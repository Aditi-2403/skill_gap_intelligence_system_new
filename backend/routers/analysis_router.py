from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import auth, database, models
from ..services import analysis_service, profile_service


router = APIRouter(tags=["analysis"])


@router.get("/industry-roles")
def get_roles():
    return analysis_service.get_roles()


@router.get("/skill-gap/{role_name}")
def get_skill_gap(
    role_name: str,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    profile = profile_service.get_profile_by_user_id(user_id=current_user.id, db=db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complete your profile before running gap analysis.",
        )

    student_skills = profile_service.skill_list_from_profile(profile)
    return analysis_service.analyze_skill_gap(student_skills=student_skills, role_name=role_name)
