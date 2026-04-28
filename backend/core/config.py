from functools import lru_cache
from typing import List
import os
from urllib.parse import urlparse


def _normalize_database_url(raw_url: str) -> str:
    cleaned = raw_url.strip()
    if cleaned.startswith("postgres://"):
        return "postgresql://" + cleaned[len("postgres://") :]
    return cleaned


def _resolve_database_url(raw_url: str) -> tuple[str, bool]:
    cleaned = raw_url.strip()
    if cleaned:
        return _normalize_database_url(cleaned), True
    return "sqlite:///./sql_app.db", False


def _format_database_location(database_url: str) -> str:
    parsed = urlparse(database_url)
    scheme = parsed.scheme.lower()

    if scheme.startswith("sqlite"):
        path = parsed.path or "./sql_app.db"
        if path.startswith("/./"):
            return path[1:]
        return path

    host = parsed.hostname or "unknown-host"
    database_name = (parsed.path or "").lstrip("/")
    return f"{host}/{database_name}" if database_name else host


class Settings:
    app_name: str = "Skill Gap Intelligence System"
    app_version: str = "2.1.0"
    app_description: str = "API for student skill gap analysis and career readiness."

    secret_key: str = os.getenv("SECRET_KEY", "change-me-in-production-use-a-long-random-string")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "60"))

    _database_url_env_value: str = os.getenv("DATABASE_URL", "")
    database_url, database_url_from_env = _resolve_database_url(_database_url_env_value)
    max_resume_size_bytes: int = int(os.getenv("MAX_RESUME_SIZE_BYTES", str(5 * 1024 * 1024)))

    @property
    def allowed_origins(self) -> List[str]:
        origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
        cleaned = [origin.strip() for origin in origins if origin.strip()]
        return cleaned or ["*"]

    @property
    def database_engine(self) -> str:
        scheme = urlparse(self.database_url).scheme.lower()
        if scheme.startswith("postgresql"):
            return "postgresql"
        if scheme.startswith("sqlite"):
            return "sqlite"
        return scheme or "unknown"

    @property
    def database_location(self) -> str:
        return _format_database_location(self.database_url)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
