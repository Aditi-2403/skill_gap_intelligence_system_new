from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas


def get_profile_by_user_id(user_id: int, db: Session) -> models.Profile | None:
    return db.query(models.Profile).filter(models.Profile.user_id == user_id).first()


def upsert_profile(profile: schemas.ProfileCreate, user_id: int, db: Session) -> models.Profile:
    db_profile = get_profile_by_user_id(user_id=user_id, db=db)

    if db_profile:
        for key, value in profile.model_dump().items():
            setattr(db_profile, key, value)
    else:
        db_profile = models.Profile(**profile.model_dump(), user_id=user_id)
        db.add(db_profile)

    db.commit()
    db.refresh(db_profile)
    return db_profile


def ensure_profile(user_id: int, db: Session) -> models.Profile:
    profile = get_profile_by_user_id(user_id=user_id, db=db)
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Profile not found. Please create your profile first.",
        )
    return profile


def skill_list_from_profile(profile: models.Profile) -> list[str]:
    return [skill.strip() for skill in (profile.skills or "").split(",") if skill.strip()]
