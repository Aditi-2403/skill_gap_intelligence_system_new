from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(32), default="student", nullable=False)  # student, admin

    profile = relationship("Profile", back_populates="user", uselist=False)


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    cgpa = Column(Float, nullable=False)
    branch = Column(String(120), nullable=False)
    year = Column(Integer, nullable=False)
    skills = Column(Text, default="")  # Comma-separated skill string
    certifications = Column(Text, default="")
    projects = Column(Text, default="")
    internships = Column(Text, default="")

    user = relationship("User", back_populates="profile")
