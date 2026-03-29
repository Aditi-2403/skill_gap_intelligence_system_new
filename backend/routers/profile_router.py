from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from sqlalchemy.orm import Session

from .. import auth, database, models, schemas, utils
from ..core.config import get_settings
from ..services import profile_service


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
