from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import auth, database
from ..services import admin_service


router = APIRouter(tags=["admin"], dependencies=[Depends(auth.get_current_admin)])


@router.get("/admin/dashboard")
def admin_dashboard(
    student_limit: int = 1000,
    db: Session = Depends(database.get_db),
):
    return admin_service.get_admin_dashboard_data(db=db, student_limit=student_limit)


@router.delete("/admin/students/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(database.get_db),
):
    return admin_service.delete_student_by_id(db=db, student_id=student_id)
