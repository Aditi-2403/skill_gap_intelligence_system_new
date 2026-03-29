from functools import lru_cache
from typing import List
import os


class Settings:
    app_name: str = "Skill Gap Intelligence System"
    app_version: str = "2.1.0"
    app_description: str = "API for student skill gap analysis and career readiness."

    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production-use-a-long-random-string")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    database_url: str = os.getenv("DATABASE_URL", "sqlite:///./sql_app.db")
    max_resume_size_bytes: int = int(os.getenv("MAX_RESUME_SIZE_BYTES", str(5 * 1024 * 1024)))

    @property
    def allowed_origins(self) -> List[str]:
        origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
        cleaned = [origin.strip() for origin in origins if origin.strip()]
        return cleaned or ["*"]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
