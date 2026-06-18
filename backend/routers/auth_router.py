from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import auth, database, models, schemas
from ..services import auth_service


router = APIRouter(tags=["auth"])


@router.post("/register", response_model=schemas.AuthMessageResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    return auth_service.create_user(user=user, db=db)


@router.post("/verify-email", response_model=schemas.MessageResponse)
def verify_email(payload: schemas.EmailVerificationRequest, db: Session = Depends(database.get_db)):
    return auth_service.verify_email(payload=payload, db=db)


@router.post("/resend-verification", response_model=schemas.MessageResponse)
def resend_verification(payload: schemas.ResendVerificationRequest, db: Session = Depends(database.get_db)):
    return auth_service.resend_verification(payload=payload, db=db)


@router.post("/forgot-password", response_model=schemas.MessageResponse)
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(database.get_db)):
    return auth_service.forgot_password(payload=payload, db=db)


@router.post("/reset-password", response_model=schemas.MessageResponse)
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(database.get_db)):
    return auth_service.reset_password(payload=payload, db=db)


@router.post("/login", response_model=schemas.Token)
def login_json(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = auth_service.authenticate_user(credentials=user, db=db)
    access_token = auth.create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role,
        "redirect_to": "/batch-overview" if db_user.role == "admin" else "/",
        "user": db_user,
    }


@router.post("/token", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = auth_service.authenticate_user(credentials=user, db=db)
    access_token = auth.create_access_token(data={"sub": db_user.email, "role": db_user.role})
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": db_user.role,
        "redirect_to": "/batch-overview" if db_user.role == "admin" else "/",
        "user": db_user,
    }


@router.get("/users/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
