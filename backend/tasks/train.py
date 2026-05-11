from celery_worker import celery
from database import SessionLocal
import models
import pandas as pd
import logging

from ml.model import train_model

# ================= LOGGING =================
logger = logging.getLogger(__name__)


@celery.task(bind=True, autoretry_for=(Exception,), retry_backoff=True, retry_kwargs={"max_retries": 3})
def train_model_task(self, user_id: int):
    db = SessionLocal()

    try:
        logger.info(f"🚀 Celery training started for user {user_id}")

        # ================= FETCH USER DATA =================
        data = db.query(models.SalesData).filter(
            models.SalesData.user_id == user_id
        ).all()

        if not data:
            logger.warning(f"⚠️ No data found for user {user_id}")
            return {"status": "no_data"}

        # ================= CONVERT TO DATAFRAME =================
        df = pd.DataFrame([d.__dict__ for d in data])
        df = df.drop(columns=["_sa_instance_state"], errors="ignore")

        logger.info(f"📊 Training dataset size: {len(df)} rows")

        # ================= TRAIN MODEL =================
        success = train_model(df, user_id)

        if success:
            logger.info(f"✅ Training completed for user {user_id}")
            return {"status": "success"}

        else:
            logger.warning(f"⚠️ Training skipped/failed for user {user_id}")
            return {"status": "skipped"}

    except Exception as e:
        logger.error(f"❌ Celery training failed for user {user_id}: {str(e)}")

        # 🔁 Retry automatically (Celery feature)
        raise self.retry(exc=e)

    finally:
        db.close()