from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from .. import database
from ..core.config import get_settings


router = APIRouter(tags=["utility"])


@router.get("/health")
def health_check(db: Session = Depends(database.get_db)):
    settings = get_settings()
    db_status = "connected"

    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "version": settings.app_version,
        "database": db_status,
    }
