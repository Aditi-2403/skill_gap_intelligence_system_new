from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import auth, database, models, schemas
from ..services import auth_service


router = APIRouter(tags=["auth"])


@router.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    return auth_service.create_user(user=user, db=db)


@router.post("/token", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = auth_service.authenticate_user(credentials=user, db=db)
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/users/me", response_model=schemas.UserResponse)
def get_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user
