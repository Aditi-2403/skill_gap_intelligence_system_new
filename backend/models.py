from sqlalchemy import Column, Float, ForeignKey, Integer, String, Text, UniqueConstraint
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


class StudentSkill(Base):
    __tablename__ = "student_skills"
    __table_args__ = (
        UniqueConstraint("user_id", "skill_name", name="uq_student_skill_user_skill"),
    )

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    skill_name = Column(String(120), nullable=False)
    level = Column(Integer, nullable=False, default=5)  # 1-10 scale


class StudentRolePreference(Base):
    __tablename__ = "student_role_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    target_role = Column(String(120), nullable=False)


class StudentDomainPreference(Base):
    __tablename__ = "student_domain_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False, index=True)
    target_domain = Column(String(120), nullable=False)
