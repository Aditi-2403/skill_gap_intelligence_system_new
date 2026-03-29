from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=128)
    role: Optional[str] = "student"

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: Optional[str]) -> str:
        normalized = (value or "student").lower().strip()
        if normalized not in {"student", "admin"}:
            raise ValueError("Role must be either 'student' or 'admin'.")
        return normalized


class UserLogin(UserBase):
    password: str = Field(min_length=6, max_length=128)


class UserResponse(UserBase):
    id: int
    role: str

    model_config = ConfigDict(from_attributes=True)


class ProfileBase(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    cgpa: float = Field(ge=0.0, le=10.0)
    branch: str = Field(min_length=2, max_length=120)
    year: int = Field(ge=1, le=8)
    skills: str = Field(default="")
    certifications: Optional[str] = ""
    projects: Optional[str] = ""
    internships: Optional[str] = ""


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(ProfileBase):
    pass


class ProfileResponse(ProfileBase):
    id: int
    user_id: int

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    email: Optional[str] = None
