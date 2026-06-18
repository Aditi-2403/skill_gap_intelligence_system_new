import os
from functools import lru_cache
from pathlib import Path
from typing import List
from urllib.parse import urlparse

from dotenv import load_dotenv


BACKEND_DIR = Path(__file__).resolve().parents[1]
PROJECT_DIR = BACKEND_DIR.parent
load_dotenv(PROJECT_DIR / ".env")
load_dotenv(BACKEND_DIR / ".env", override=True)


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
    admin_email: str = os.getenv("ADMIN_EMAIL", "").lower().strip()
    admin_password: str = os.getenv("ADMIN_PASSWORD", "")
    frontend_base_url: str = os.getenv("FRONTEND_BASE_URL", "http://127.0.0.1:8000").strip().rstrip("/")
    verification_code_expire_minutes: int = int(os.getenv("VERIFICATION_CODE_EXPIRE_MINUTES", "15"))
    reset_code_expire_minutes: int = int(os.getenv("RESET_CODE_EXPIRE_MINUTES", "15"))

    smtp_host: str = os.getenv("SMTP_HOST", "").strip()
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "").strip()
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    smtp_from_email: str = os.getenv("SMTP_FROM_EMAIL", smtp_username).strip()
    smtp_from_name: str = os.getenv("SMTP_FROM_NAME", "SkillSync").strip()
    smtp_use_tls: bool = os.getenv("SMTP_USE_TLS", "true").lower().strip() in {"1", "true", "yes", "on"}
    smtp_use_ssl: bool = os.getenv("SMTP_USE_SSL", "false").lower().strip() in {"1", "true", "yes", "on"}

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
