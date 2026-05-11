from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import datetime, timedelta

from database import get_db
import models
from utils.security import get_current_active_user

router = APIRouter(tags=["Admin"])


# ================= ADMIN CHECK =================
def require_admin(user):
    if user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")


# ================= GET ALL USERS =================
@router.get("/users")
def get_users(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    require_admin(current_user)

    users = db.query(models.User).all()

    return {
        "success": True,
        "data": [
            {
                "id": u.id,
                "username": u.username,
                "email": u.email,
                "role": u.role,
            }
            for u in users
        ],
        "meta": {"count": len(users)},
        "error": None
    }


# ================= DELETE USER =================
@router.delete("/user/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    require_admin(current_user)

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete yourself")

    user = db.query(models.User).filter(models.User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()

    return {
        "success": True,
        "data": {"message": f"User {user_id} deleted"},
        "error": None
    }


# ================= GET ALL UPLOADS =================
@router.get("/uploads")
def get_all_uploads(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    require_admin(current_user)

    uploads = db.query(models.UploadHistory).order_by(
        models.UploadHistory.upload_time.desc()
    ).all()

    return {
        "success": True,
        "data": [
            {
                "user_id": u.user_id,
                "filename": u.filename,
                "records": u.records_count,
                "status": u.status,
                "uploaded_at": u.upload_time.strftime("%d %b %Y, %I:%M %p")
            }
            for u in uploads
        ],
        "meta": {"count": len(uploads)},
        "error": None
    }


# ================= GET MODELS =================
@router.get("/models")
def get_models(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    require_admin(current_user)

    models_data = db.query(models.ModelMeta).order_by(
        models.ModelMeta.created_at.desc()
    ).all()

    return {
        "success": True,
        "data": [
            {
                "user_id": m.user_id,
                "version": m.version,
                "accuracy": m.accuracy,
                "file_path": m.file_path,
                "created_at": m.created_at.strftime("%d %b %Y, %I:%M %p")
            }
            for m in models_data
        ],
        "meta": {"count": len(models_data)},
        "error": None
    }


# ================= ADMIN STATS =================
@router.get("/stats")
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    require_admin(current_user)

    total_users = db.query(func.count(models.User.id)).scalar()
    total_uploads = db.query(func.count(models.UploadHistory.id)).scalar()

    success_uploads = db.query(func.count(models.UploadHistory.id)).filter(
        models.UploadHistory.status == "success"
    ).scalar()

    failed_uploads = db.query(func.count(models.UploadHistory.id)).filter(
        models.UploadHistory.status == "failed"
    ).scalar()

    processing_uploads = db.query(func.count(models.UploadHistory.id)).filter(
        models.UploadHistory.status == "processing"
    ).scalar()

    success_rate = (
        round((success_uploads / total_uploads) * 100, 2)
        if total_uploads else 0
    )

    return {
        "success": True,
        "data": {
            "total_users": total_users,
            "total_uploads": total_uploads,
            "success_uploads": success_uploads,
            "failed_uploads": failed_uploads,
            "processing_uploads": processing_uploads,
            "success_rate": success_rate
        },
        "error": None
    }


# ================= UPLOAD TREND (FIXED 🔥) =================
@router.get("/upload-trend")
def get_upload_trend(
    range: str = "7d",
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    require_admin(current_user)

    days = 7 if range == "7d" else 30
    start_date = datetime.utcnow() - timedelta(days=days)

    result = (
        db.query(
            func.date(models.UploadHistory.upload_time).label("day"),

            func.sum(
                case(
                    (models.UploadHistory.status == "success", 1),
                    else_=0
                )
            ).label("success"),

            func.sum(
                case(
                    (models.UploadHistory.status == "failed", 1),
                    else_=0
                )
            ).label("failed"),
        )
        .filter(models.UploadHistory.upload_time >= start_date)
        .group_by(func.date(models.UploadHistory.upload_time))
        .order_by(func.date(models.UploadHistory.upload_time))
        .all()
    )

    return {
        "success": True,
        "data": [
            {
                "day": str(r.day),
                "success": int(r.success or 0),
                "failed": int(r.failed or 0),
            }
            for r in result
        ],
        "error": None
    }


# ================= MODEL MAE (FIXED 🔥) =================
@router.get("/model-mae")
def get_model_mae(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user)
):
    require_admin(current_user)

    result = db.query(
        models.ModelMeta.version,
        models.ModelMeta.accuracy
    ).order_by(models.ModelMeta.version.asc()).all()

    return {
        "success": True,
        "data": [
            {
                "version": r.version,
                "mae": float(r.accuracy or 0),
            }
            for r in result
        ],
        "error": None
    }