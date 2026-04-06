from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import auth, database
from ..services import admin_service


router = APIRouter(tags=["admin"], dependencies=[Depends(auth.get_current_admin)])


@router.get("/admin/dashboard")
def admin_dashboard(
    student_limit: int = 200,
    db: Session = Depends(database.get_db),
):
    return admin_service.get_admin_dashboard_data(db=db, student_limit=student_limit)
