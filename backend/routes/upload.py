from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
import pandas as pd
import time
import logging

from database import get_db
import models
from services.cleaning import clean_data
from utils.security import get_current_active_user

# CELERY TASK
from tasks.train import train_model_task

router = APIRouter()
logger = logging.getLogger(__name__)


# =====================================================
# UPLOAD CSV
# =====================================================

@router.post("/")
def upload_file(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):

    start_time = time.time()

    # =====================================================
    # STEP 1 — VALIDATE FILE BEFORE CREATING HISTORY
    # FIX: history is only created after the file is
    # confirmed readable, so validation failures do not
    # pollute the upload history table.
    # =====================================================

    if not file.filename.endswith(".csv"):
        raise HTTPException(
            status_code=400,
            detail="Only CSV files are allowed"
        )

    try:
        df = pd.read_csv(file.file)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid CSV format — file could not be parsed"
        )

    if df.empty:
        raise HTTPException(
            status_code=400,
            detail="CSV contains no data"
        )

    # =====================================================
    # STEP 2 — CREATE HISTORY ONLY AFTER FILE IS VALID
    # =====================================================

    upload_history = models.UploadHistory(
        user_id=current_user.id,
        filename=file.filename,
        records_count=0,
        status="processing"
    )

    db.add(upload_history)
    db.commit()

    # =====================================================
    # PROCESS
    # =====================================================

    try:

        # =====================================================
        # NORMALIZE COLUMNS
        # =====================================================

        df.columns = (
            df.columns
            .str.strip()
            .str.lower()
            .str.replace(" ", "_")
        )

        # =====================================================
        # COLUMN MAPPING
        # =====================================================

        COLUMN_MAPPING = {
            # Medicine name
            "medicine":         "medicine_name",
            "product_name":     "medicine_name",
            "drug_name":        "medicine_name",

            # Sales / units
            "units_sold":       "sales",
            "qty":              "sales",
            "quantity":         "sales",
            "quantity_sold":    "sales",

            # Price
            "cost":             "price",
            "amount":           "price",
            "unit_price":       "price",

            # Stock
            "inventory":        "stock",
            "current_stock":    "stock",

            # Reorder level
            "reorder_level":    "reorder_level",

            # Batch
            "batch_id":         "batch_id",
        }

        df.rename(columns=COLUMN_MAPPING, inplace=True)

        # =====================================================
        # REQUIRED FIELD CHECK
        # =====================================================

        if "sales" not in df.columns:
            raise HTTPException(
                status_code=400,
                detail="Missing required column: units_sold / sales / quantity_sold"
            )

        if "medicine_name" not in df.columns:
            raise HTTPException(
                status_code=400,
                detail="Missing required column: medicine_name / product_name"
            )

        # =====================================================
        # CLEAN DATA
        # =====================================================

        df = clean_data(df)

        if df.empty:
            raise HTTPException(
                status_code=400,
                detail="No valid data after cleaning"
            )

        # =====================================================
        # ADD USER ID
        # =====================================================

        df["user_id"] = current_user.id

        # =====================================================
        # DROP DUPLICATES WITHIN FILE
        # =====================================================

        df = df.drop_duplicates(
            subset=["medicine_name", "date", "user_id"],
            keep="last"
        )

        records = df.to_dict(orient="records")

        logger.info(f"Records after cleaning: {len(records)}")

        # =====================================================
        # VALID FIELDS
        # =====================================================

        valid_fields = {
            "date", "medicine_name", "category", "sales",
            "price", "stock", "reorder_level",
            "expiry_date", "temperature", "rainfall",
            "day_of_week", "user_id", "batch_id"
        }

        # =====================================================
        # PRELOAD EXISTING RECORDS FOR UPSERT
        # =====================================================

        existing_records = db.query(
            models.SalesData
        ).filter(
            models.SalesData.user_id == current_user.id
        ).all()

        existing_map = {
            (r.medicine_name, r.date): r
            for r in existing_records
        }

        valid_count = 0
        skipped_count = 0
        new_objects = []
        seen_keys = set()

        # =====================================================
        # UPSERT LOOP
        # =====================================================

        for row in records:

            # Strip unknown fields
            row = {
                k: v for k, v in row.items()
                if k in valid_fields
            }

            if not row.get("date") or not row.get("medicine_name"):
                skipped_count += 1
                continue

            key = (row.get("medicine_name"), row.get("date"))

            # Skip duplicates already seen in this file
            if key in seen_keys:
                skipped_count += 1
                continue

            seen_keys.add(key)

            try:
                if key in existing_map:
                    # Update existing record
                    existing = existing_map[key]
                    for field, val in row.items():
                        setattr(existing, field, val)
                else:
                    # Queue new record
                    new_objects.append(
                        models.SalesData(**row)
                    )

                valid_count += 1

            except Exception as e:
                logger.warning(f"Skipped bad row: {str(e)}")
                skipped_count += 1

        # =====================================================
        # BULK INSERT NEW RECORDS
        # =====================================================

        if new_objects:
            db.bulk_save_objects(new_objects)

        db.commit()

        logger.info(
            f"Inserted/Updated: {valid_count}, Skipped: {skipped_count}"
        )

        # =====================================================
        # UPDATE HISTORY — SUCCESS
        # =====================================================

        upload_history.records_count = valid_count
        upload_history.status = "success"
        db.commit()

        # =====================================================
        # TRIGGER TRAINING ONLY IF THERE IS VALID DATA
        # FIX: previously fired even when valid_count == 0,
        # wasting a Celery worker on empty data.
        # =====================================================

        if valid_count > 0:
            train_model_task.delay(current_user.id)

        processing_time = round(
            time.time() - start_time,
            2
        )

        return {
            "success": True,
            "data": {
                "inserted": valid_count,
                "skipped": skipped_count,
                "processing_time": processing_time
            },
            "error": None
        }

    # =====================================================
    # HTTP EXCEPTIONS — expected validation errors
    # =====================================================

    except HTTPException as e:

        upload_history.status = "failed"

        try:
            db.commit()
        except Exception:
            pass

        raise e

    # =====================================================
    # UNEXPECTED EXCEPTIONS
    # FIX: db.rollback() detaches upload_history from the
    # session. Use db.merge() to reattach before updating
    # status, so the failure is correctly recorded.
    # =====================================================

    except Exception as e:

        db.rollback()

        logger.error(f"Upload failed: {str(e)}")

        try:
            upload_history.status = "failed"
            db.merge(upload_history)
            db.commit()
        except Exception:
            pass

        raise HTTPException(
            status_code=500,
            detail=f"Upload failed: {str(e)}"
        )