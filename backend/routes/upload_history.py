from fastapi import (
    APIRouter,
    Depends,
    Query,
    HTTPException,
)

from sqlalchemy.orm import Session

from database import get_db

from utils.security import (
    get_current_active_user,
)

import models

router = APIRouter(
    prefix="/upload-history",
    tags=["Upload History"]
)

# =====================================================
# USER HISTORY
# =====================================================

@router.get("/")
def get_upload_history(
    limit: int = Query(50, le=100),
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_active_user
    )
):

    history = (
        db.query(models.UploadHistory)
        .filter(
            models.UploadHistory.user_id
            == current_user.id
        )
        .order_by(
            models.UploadHistory.id.desc()
        )
        .limit(limit)
        .all()
    )

    return {
        "status": "success",

        "count": len(history),

        "data": [
            {
                "id": h.id,

                "filename": h.filename,

                "records": h.records_count,

                "status": h.status,

                "uploaded_at":
                    h.upload_time.strftime(
                        "%d %b %Y, %I:%M %p"
                    )
            }
            for h in history
        ]
    }


# =====================================================
# DELETE HISTORY
# =====================================================

@router.delete("/{history_id}")
def delete_upload_history(
    history_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_active_user
    )
):

    history = (
        db.query(models.UploadHistory)
        .filter(
            models.UploadHistory.id
            == history_id,

            models.UploadHistory.user_id
            == current_user.id
        )
        .first()
    )

    if not history:
        raise HTTPException(
            status_code=404,
            detail="Upload history not found"
        )

    db.delete(history)

    db.commit()

    return {
        "success": True,
        "message":
            "Upload history deleted"
    }


# =====================================================
# ADMIN: ALL UPLOADS
# =====================================================

@router.get("/admin")
def get_all_uploads(
    db: Session = Depends(get_db),
    current_user=Depends(
        get_current_active_user
    )
):

    if current_user.role != "admin":
        raise HTTPException(
            status_code=403,
            detail="Unauthorized"
        )

    history = (
        db.query(models.UploadHistory)
        .order_by(
            models.UploadHistory.id.desc()
        )
        .all()
    )

    return {
        "status": "success",

        "total": len(history),

        "data": [
            {
                "id": h.id,

                "user_id": h.user_id,

                "filename": h.filename,

                "records": h.records_count,

                "status": h.status,

                "uploaded_at":
                    h.upload_time.strftime(
                        "%d %b %Y"
                    )
            }
            for h in history
        ]
    }