from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import List
import pandas as pd
import os

from . import models, schemas, database, auth, utils

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Skill Gap Intelligence System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(email=user.email, hashed_password=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/token", response_model=schemas.Token)
def login_for_access_token(user: schemas.UserLogin, db: Session = Depends(database.get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if not db_user or not auth.verify_password(user.password, db_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token = auth.create_access_token(data={"sub": db_user.email})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

@app.post("/profile", response_model=schemas.ProfileResponse)
def create_or_update_profile(profile: schemas.ProfileCreate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    db_profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if db_profile:
        for key, value in profile.dict().items():
            setattr(db_profile, key, value)
    else:
        db_profile = models.Profile(**profile.dict(), user_id=current_user.id)
        db.add(db_profile)
    
    db.commit()
    db.refresh(db_profile)
    return db_profile

@app.get("/profile", response_model=schemas.ProfileResponse)
def get_profile(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    db_profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return db_profile

@app.post("/resume-upload")
async def upload_resume(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user)):
    contents = await file.read()
    skills = utils.extract_skills_from_resume(contents)
    return {"extracted_skills": skills}

@app.get("/industry-roles")
def get_roles():
    return utils.get_industry_skills()

@app.get("/skill-gap/{role_name}")
def get_gap(role_name: str, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    db_profile = db.query(models.Profile).filter(models.Profile.user_id == current_user.id).first()
    if not db_profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    roles = utils.get_industry_skills()
    selected_role = next((r for r in roles if r["role"] == role_name), None)
    if not selected_role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    student_skills = [s.strip() for s in db_profile.skills.split(",") if s.strip()]
    gap_result = utils.calculate_skill_gap(student_skills, selected_role["skills"])
    return gap_result

@app.get("/admin/dashboard", dependencies=[Depends(auth.get_current_admin)])
def admin_dashboard(db: Session = Depends(database.get_db)):
    users = db.query(models.User).filter(models.User.role == "student").all()
    profiles = db.query(models.Profile).all()
    
    total_students = len(users)
    avg_cgpa = sum([p.cgpa for p in profiles]) / len(profiles) if profiles else 0
    
    return {
        "total_students": total_students,
        "average_cgpa": round(avg_cgpa, 2),
        "students": [
            {"email": u.email, "name": u.profile.full_name if u.profile else "N/A", "cgpa": u.profile.cgpa if u.profile else 0}
            for u in users
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Mount the static directory for assets (JS, CSS, etc.)
# We use a relative path from where the script is run
static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    # Skip API routes
    if full_path.startswith("api") or full_path in ["register", "token", "profile", "resume-upload", "industry-roles", "skill-gap", "admin", "health"]:
        return None # Let FastAPI handle it or return 404 later
    
    # Path to the file in static folder
    file_path = os.path.join(static_dir, full_path)
    if os.path.isfile(file_path):
        return FileResponse(file_path)
    
    # Serve index.html for all other routes to support client-side routing
    index_path = os.path.join(static_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {"message": "Static files not found. Please build the frontend."}
