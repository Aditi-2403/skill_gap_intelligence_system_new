import logging
import secrets
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .. import auth, models, schemas
from ..core.config import get_settings
from . import email_service


logger = logging.getLogger("skillsync.auth")
settings = get_settings()


def _normalize_email(email: str) -> str:
    return email.lower().strip()


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _future(minutes: int) -> datetime:
    return _now() + timedelta(minutes=minutes)


def _as_aware(value: datetime | None) -> datetime | None:
    if value is None:
        return None
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value


def _generate_otp() -> str:
    return f"{secrets.randbelow(1_000_000):06d}"


def _set_verification_code(user: models.User, db: Session) -> tuple[str, bool]:
    otp = _generate_otp()
    user.verification_token = auth.get_password_hash(otp)
    user.verification_expiry = _future(settings.verification_code_expire_minutes)
    db.add(user)
    db.commit()
    db.refresh(user)
    sent = email_service.send_verification_email(
        to_email=user.email,
        full_name=user.full_name or "SkillSync learner",
        otp=otp,
    )
    return otp, sent


def _set_reset_code(user: models.User, db: Session) -> tuple[str, bool]:
    otp = _generate_otp()
    user.reset_token = auth.get_password_hash(otp)
    user.reset_expiry = _future(settings.reset_code_expire_minutes)
    db.add(user)
    db.commit()
    db.refresh(user)
    sent = email_service.send_password_reset_email(
        to_email=user.email,
        full_name=user.full_name or "SkillSync learner",
        otp=otp,
    )
    return otp, sent


def _email_delivery_message(sent: bool, success_message: str) -> str:
    if sent:
        return success_message
    return (
        "Account saved, but the verification email could not be sent. "
        "Please check SMTP settings and use Resend Verification."
    )


def ensure_fixed_admin_account(db: Session) -> None:
    admin_email = settings.admin_email
    admin_password = settings.admin_password
    if not admin_email or not admin_password:
        logger.warning("ADMIN_EMAIL or ADMIN_PASSWORD is not configured; admin bootstrap skipped.")
        return

    other_admins = (
        db.query(models.User)
        .filter(models.User.role == "admin", models.User.email != admin_email)
        .all()
    )
    for other in other_admins:
        other.role = "learner"

    admin_user = db.query(models.User).filter(models.User.email == admin_email).first()
    if admin_user is None:
        admin_user = models.User(
            full_name="SkillSync Administrator",
            email=admin_email,
            hashed_password=auth.get_password_hash(admin_password),
            role="admin",
            is_verified=True,
        )
        db.add(admin_user)
    else:
        admin_user.email = admin_email
        admin_user.full_name = admin_user.full_name or "SkillSync Administrator"
        admin_user.role = "admin"
        admin_user.is_verified = True
        admin_user.verification_token = None
        admin_user.verification_expiry = None
        if not auth.verify_password(admin_password, admin_user.hashed_password):
            admin_user.hashed_password = auth.get_password_hash(admin_password)

    db.commit()


def create_user(user: schemas.UserCreate, db: Session) -> dict:
    normalized_email = _normalize_email(user.email)
    if settings.admin_email and normalized_email == settings.admin_email:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This email is reserved for administrator login only.",
        )

    existing_user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if existing_user:
        if existing_user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email already exists.",
            )
        existing_user.full_name = user.full_name.strip()
        existing_user.hashed_password = auth.get_password_hash(user.password)
        existing_user.role = "learner"
        _otp, sent = _set_verification_code(existing_user, db)
        return {
            "message": _email_delivery_message(sent, "Verification email sent. Please verify your account."),
            "user": existing_user,
        }

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        full_name=user.full_name.strip(),
        email=normalized_email,
        hashed_password=hashed_password,
        role="learner",
        is_verified=False,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    _otp, sent = _set_verification_code(new_user, db)
    return {
        "message": _email_delivery_message(sent, "Verification email sent. Please verify your account."),
        "user": new_user,
    }


def verify_email(payload: schemas.EmailVerificationRequest, db: Session) -> dict:
    normalized_email = _normalize_email(payload.email)
    user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    if user.is_verified:
        return {"message": "Email is already verified."}

    expiry = _as_aware(user.verification_expiry)
    if not user.verification_token or not expiry or expiry < _now():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    if not auth.verify_password(payload.otp.strip(), user.verification_token):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification code.",
        )

    user.is_verified = True
    user.verification_token = None
    user.verification_expiry = None
    db.add(user)
    db.commit()
    return {"message": "Email verified successfully. You can now log in."}


def resend_verification(payload: schemas.ResendVerificationRequest, db: Session) -> dict:
    normalized_email = _normalize_email(payload.email)
    user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No account found for this email.")

    if user.is_verified:
        return {"message": "Email is already verified. You can log in."}

    _otp, sent = _set_verification_code(user, db)
    return {
        "message": _email_delivery_message(sent, "Verification email sent. Please verify your account."),
    }


def authenticate_user(credentials: schemas.UserLogin, db: Session) -> models.User:
    normalized_email = _normalize_email(credentials.email)

    user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if not user or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in.",
        )
    return user


def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session) -> dict:
    normalized_email = _normalize_email(payload.email)
    user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if not user or not user.is_verified:
        return {"message": "If an account exists, password reset instructions have been sent."}

    _otp, sent = _set_reset_code(user, db)
    if sent:
        return {"message": "If an account exists, password reset instructions have been sent."}
    return {"message": "Password reset email could not be sent. Please check SMTP settings."}


def reset_password(payload: schemas.ResetPasswordRequest, db: Session) -> dict:
    normalized_email = _normalize_email(payload.email)
    user = db.query(models.User).filter(models.User.email == normalized_email).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset code.")

    expiry = _as_aware(user.reset_expiry)
    if not user.reset_token or not expiry or expiry < _now():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset code.")

    if not auth.verify_password(payload.otp.strip(), user.reset_token):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or expired reset code.")

    user.hashed_password = auth.get_password_hash(payload.password)
    user.reset_token = None
    user.reset_expiry = None
    db.add(user)
    db.commit()
    return {"message": "Password reset successfully. You can now log in."}
