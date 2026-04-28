from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from .. import auth, models, schemas

FIXED_ADMIN_EMAIL = "skillsync@gmail.com"
FIXED_ADMIN_PASSWORD = "skillsync@121"


def ensure_fixed_admin_account(db: Session) -> None:
    # Ensure only one administrator account remains in the system.
    other_admins = (
        db.query(models.User)
        .filter(models.User.role == "admin", models.User.email != FIXED_ADMIN_EMAIL)
        .all()
    )
    for other in other_admins:
        other.role = "student"

    admin_user = db.query(models.User).filter(models.User.email == FIXED_ADMIN_EMAIL).first()
    if admin_user is None:
        admin_user = models.User(
            email=FIXED_ADMIN_EMAIL,
            hashed_password=auth.get_password_hash(FIXED_ADMIN_PASSWORD),
            role="admin",
        )
        db.add(admin_user)
    else:
        admin_user.role = "admin"
        if not auth.verify_password(FIXED_ADMIN_PASSWORD, admin_user.hashed_password):
            admin_user.hashed_password = auth.get_password_hash(FIXED_ADMIN_PASSWORD)

    db.commit()


def create_user(user: schemas.UserCreate, db: Session) -> models.User:
    if user.email.lower().strip() == FIXED_ADMIN_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This email is reserved for administrator login only.",
        )

    existing_user = db.query(models.User).filter(models.User.email == user.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password, role="student")
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(credentials: schemas.UserLogin, db: Session) -> models.User:
    normalized_email = credentials.email.lower().strip()

    if normalized_email == FIXED_ADMIN_EMAIL:
        if credentials.password != FIXED_ADMIN_PASSWORD:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password.",
                headers={"WWW-Authenticate": "Bearer"},
            )
        user = db.query(models.User).filter(models.User.email == FIXED_ADMIN_EMAIL).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Administrator account not initialized.",
            )
        return user

    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or user.role == "admin" or not auth.verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user
