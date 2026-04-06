from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .. import models, schemas


def get_profile_by_user_id(user_id: int, db: Session) -> models.Profile | None:
    return db.query(models.Profile).filter(models.Profile.user_id == user_id).first()


def skill_list_from_profile(profile: models.Profile) -> list[str]:
    return [skill.strip() for skill in (profile.skills or "").split(",") if skill.strip()]


def sync_profile_skills(user_id: int, skills: list[str], db: Session) -> None:
    normalized_skills: list[str] = []
    seen: set[str] = set()

    for skill in skills:
        cleaned = skill.strip()
        if not cleaned:
            continue
        lowered = cleaned.lower()
        if lowered in seen:
            continue
        seen.add(lowered)
        normalized_skills.append(cleaned)

    existing_rows = db.query(models.StudentSkill).filter(models.StudentSkill.user_id == user_id).all()
    existing_by_lower = {row.skill_name.strip().lower(): row for row in existing_rows}
    target_by_lower = {skill.lower(): skill for skill in normalized_skills}

    for lowered, skill in target_by_lower.items():
        row = existing_by_lower.get(lowered)
        if row is None:
            db.add(models.StudentSkill(user_id=user_id, skill_name=skill, level=5))
        else:
            # Keep canonical display name from latest profile save.
            row.skill_name = skill

    for lowered, row in existing_by_lower.items():
        if lowered not in target_by_lower:
            db.delete(row)


def get_student_skill_levels(
    user_id: int,
    db: Session,
    profile: models.Profile | None = None,
) -> dict[str, int]:
    rows = db.query(models.StudentSkill).filter(models.StudentSkill.user_id == user_id).all()
    if not rows and profile:
        sync_profile_skills(user_id=user_id, skills=skill_list_from_profile(profile), db=db)
        db.commit()
        rows = db.query(models.StudentSkill).filter(models.StudentSkill.user_id == user_id).all()

    return {row.skill_name: int(row.level) for row in rows}


def upsert_student_skill_levels(
    user_id: int,
    skill_levels: list[schemas.SkillLevelInput],
    db: Session,
) -> list[models.StudentSkill]:
    normalized_map: dict[str, int] = {}
    display_name: dict[str, str] = {}

    for item in skill_levels:
        key = item.skill.strip().lower()
        if not key:
            continue
        normalized_map[key] = int(item.level)
        display_name[key] = item.skill.strip()

    if not normalized_map:
        return db.query(models.StudentSkill).filter(models.StudentSkill.user_id == user_id).all()

    existing_rows = db.query(models.StudentSkill).filter(models.StudentSkill.user_id == user_id).all()
    existing_by_lower = {row.skill_name.strip().lower(): row for row in existing_rows}

    for skill_key, level in normalized_map.items():
        row = existing_by_lower.get(skill_key)
        if row is None:
            db.add(
                models.StudentSkill(
                    user_id=user_id,
                    skill_name=display_name[skill_key],
                    level=level,
                )
            )
        else:
            row.skill_name = display_name[skill_key]
            row.level = level

    db.commit()
    return db.query(models.StudentSkill).filter(models.StudentSkill.user_id == user_id).all()


def get_target_role(user_id: int, db: Session) -> str | None:
    row = (
        db.query(models.StudentRolePreference)
        .filter(models.StudentRolePreference.user_id == user_id)
        .first()
    )
    return row.target_role if row else None


def set_target_role(user_id: int, target_role: str, db: Session) -> str:
    existing = (
        db.query(models.StudentRolePreference)
        .filter(models.StudentRolePreference.user_id == user_id)
        .first()
    )
    if existing:
        existing.target_role = target_role
    else:
        db.add(models.StudentRolePreference(user_id=user_id, target_role=target_role))

    db.commit()
    return target_role


def get_target_domain(user_id: int, db: Session) -> str | None:
    row = (
        db.query(models.StudentDomainPreference)
        .filter(models.StudentDomainPreference.user_id == user_id)
        .first()
    )
    return row.target_domain if row else None


def set_target_domain(user_id: int, target_domain: str, db: Session) -> str:
    existing = (
        db.query(models.StudentDomainPreference)
        .filter(models.StudentDomainPreference.user_id == user_id)
        .first()
    )
    if existing:
        existing.target_domain = target_domain
    else:
        db.add(models.StudentDomainPreference(user_id=user_id, target_domain=target_domain))

    db.commit()
    return target_domain


def upsert_profile(profile: schemas.ProfileCreate, user_id: int, db: Session) -> models.Profile:
    db_profile = get_profile_by_user_id(user_id=user_id, db=db)

    if db_profile:
        for key, value in profile.model_dump().items():
            setattr(db_profile, key, value)
    else:
        db_profile = models.Profile(**profile.model_dump(), user_id=user_id)
        db.add(db_profile)

    db.commit()
    sync_profile_skills(user_id=user_id, skills=skill_list_from_profile(db_profile), db=db)
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
