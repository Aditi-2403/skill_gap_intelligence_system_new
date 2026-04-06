from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import auth, database, models, schemas
from ..services import analysis_service, profile_service


router = APIRouter(tags=["analysis"])


@router.get("/industry-roles")
def get_roles(domain: str | None = None):
    return analysis_service.get_roles(domain_name=domain)


@router.get("/domains")
def get_domains():
    return analysis_service.get_domains()


@router.get("/skill-gap/{role_name}")
def get_skill_gap(
    role_name: str,
    domain: str | None = None,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    profile = profile_service.get_profile_by_user_id(user_id=current_user.id, db=db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complete your profile before running gap analysis.",
        )

    student_skill_levels = profile_service.get_student_skill_levels(
        user_id=current_user.id,
        db=db,
        profile=profile,
    )
    return analysis_service.analyze_skill_gap(
        role_name=role_name,
        domain_name=domain,
        student_skill_levels=student_skill_levels,
    )


@router.get("/skill-gap")
def get_skill_gap_for_target_role(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    profile = profile_service.get_profile_by_user_id(user_id=current_user.id, db=db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Complete your profile before running gap analysis.",
        )

    target_domain = profile_service.get_target_domain(user_id=current_user.id, db=db) or analysis_service.get_default_domain()
    role_name = profile_service.get_target_role(user_id=current_user.id, db=db) or analysis_service.find_default_role_for_domain(target_domain)
    student_skill_levels = profile_service.get_student_skill_levels(
        user_id=current_user.id,
        db=db,
        profile=profile,
    )
    return analysis_service.analyze_skill_gap(
        role_name=role_name,
        domain_name=target_domain,
        student_skill_levels=student_skill_levels,
    )


@router.post("/skill-gap/analyze")
def analyze_skill_gap_payload(payload: schemas.SkillGapRequest):
    return analysis_service.analyze_skill_gap(
        role_name=payload.role_name,
        domain_name=payload.domain_name,
        student_skills=payload.student_skills,
        skill_levels=payload.skill_levels,
    )
