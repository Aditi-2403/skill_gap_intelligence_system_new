from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from .. import auth, database, models, schemas, utils
from ..core.config import get_settings
from ..services import analysis_service, profile_service


router = APIRouter(tags=["profile"])
settings = get_settings()


@router.post("/profile", response_model=schemas.ProfileResponse)
def upsert_profile(
    profile: schemas.ProfileCreate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    return profile_service.upsert_profile(profile=profile, user_id=current_user.id, db=db)


@router.get("/profile", response_model=schemas.ProfileResponse)
def get_profile(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    return profile_service.ensure_profile(user_id=current_user.id, db=db)


@router.get("/profile/analysis-preferences", response_model=schemas.AnalysisPreferencesResponse)
def get_analysis_preferences(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    _ = profile_service.ensure_profile(user_id=current_user.id, db=db)
    target_domain = profile_service.get_target_domain(user_id=current_user.id, db=db)
    target_role = profile_service.get_target_role(user_id=current_user.id, db=db)
    skill_levels = profile_service.get_student_skill_levels(user_id=current_user.id, db=db)

    return {
        "target_domain": target_domain,
        "target_role": target_role,
        "skill_levels": [
            {"skill": skill, "level": level}
            for skill, level in sorted(skill_levels.items())
        ],
    }


@router.post("/profile/analysis-preferences", response_model=schemas.AnalysisPreferencesResponse)
def update_analysis_preferences(
    payload: schemas.AnalysisPreferencesUpdate,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(database.get_db),
):
    _ = profile_service.ensure_profile(user_id=current_user.id, db=db)

    if payload.target_domain:
        domains = {domain["domain"] for domain in analysis_service.get_domains()}
        if payload.target_domain not in domains:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid target_domain. Choose one of: {', '.join(sorted(domains))}",
            )
        profile_service.set_target_domain(user_id=current_user.id, target_domain=payload.target_domain, db=db)

    if payload.target_role:
        selected_domain = payload.target_domain or profile_service.get_target_domain(user_id=current_user.id, db=db)
        role_map = {
            role["role"].lower(): role["role"]
            for role in analysis_service.get_roles(domain_name=selected_domain)
        }
        normalized_role = role_map.get(payload.target_role.strip().lower())
        if normalized_role is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid target_role. Choose one of: {', '.join(sorted(role_map.values()))}",
            )
        profile_service.set_target_role(user_id=current_user.id, target_role=normalized_role, db=db)

    if payload.skill_levels:
        profile_service.upsert_student_skill_levels(
            user_id=current_user.id,
            skill_levels=payload.skill_levels,
            db=db,
        )

    target_domain = profile_service.get_target_domain(user_id=current_user.id, db=db)
    target_role = profile_service.get_target_role(user_id=current_user.id, db=db)
    skill_levels = profile_service.get_student_skill_levels(user_id=current_user.id, db=db)
    return {
        "target_domain": target_domain,
        "target_role": target_role,
        "skill_levels": [
            {"skill": skill, "level": level}
            for skill, level in sorted(skill_levels.items())
        ],
    }


@router.post("/resume-upload")
async def upload_resume(
    file: UploadFile = File(...),
    current_user: models.User = Depends(auth.get_current_user),
):
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are accepted.",
        )

    contents = await file.read()
    if len(contents) > settings.max_resume_size_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File exceeds the 5 MB size limit.",
        )

    extracted_skills = utils.extract_skills_from_resume(contents)
    return {"extracted_skills": extracted_skills, "count": len(extracted_skills)}
