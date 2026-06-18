from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator, model_validator


class UserBase(BaseModel):
    email: EmailStr


class UserCreate(UserBase):
    full_name: str = Field(min_length=2, max_length=120)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_passwords(self):
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match.")
        return self


class EmailVerificationRequest(UserBase):
    otp: str = Field(min_length=4, max_length=64)


class ResendVerificationRequest(UserBase):
    pass


class ForgotPasswordRequest(UserBase):
    pass


class ResetPasswordRequest(UserBase):
    otp: str = Field(min_length=4, max_length=64)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @model_validator(mode="after")
    def validate_passwords(self):
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match.")
        return self


class RoleUpdateMixin(BaseModel):
    role: Optional[str] = "learner"

    @field_validator("role")
    @classmethod
    def validate_role(cls, value: Optional[str]) -> str:
        normalized = (value or "learner").lower().strip()
        if normalized != "learner":
            raise ValueError("Only 'learner' role is allowed during signup.")
        return normalized


class UserLogin(UserBase):
    password: str = Field(min_length=8, max_length=128)


class UserResponse(UserBase):
    id: int
    full_name: str
    role: str
    is_verified: bool
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MessageResponse(BaseModel):
    message: str


class AuthMessageResponse(MessageResponse):
    user: UserResponse


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


class SkillLevelInput(BaseModel):
    skill: str = Field(min_length=1, max_length=120)
    level: int = Field(ge=1, le=10)


class StudentSkillResponse(SkillLevelInput):
    model_config = ConfigDict(from_attributes=True)


class AnalysisPreferencesUpdate(BaseModel):
    target_domain: Optional[str] = None
    target_role: Optional[str] = None
    skill_levels: list[SkillLevelInput] = Field(default_factory=list)


class AnalysisPreferencesResponse(BaseModel):
    target_domain: Optional[str] = None
    target_role: Optional[str] = None
    skill_levels: list[SkillLevelInput] = Field(default_factory=list)


class SkillGapRequest(BaseModel):
    domain_name: Optional[str] = None
    role_name: str = Field(min_length=2, max_length=120)
    student_skills: list[str] = Field(default_factory=list)
    skill_levels: list[SkillLevelInput] = Field(default_factory=list)


class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    redirect_to: str
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None
