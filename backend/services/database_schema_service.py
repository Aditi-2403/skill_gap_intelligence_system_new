import logging

from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


logger = logging.getLogger("skillsync.database")


def _column_type(dialect: str, name: str) -> str:
    postgres_types = {
        "full_name": "VARCHAR(120) DEFAULT ''",
        "is_verified": "BOOLEAN NOT NULL DEFAULT FALSE",
        "verification_token": "VARCHAR(255)",
        "verification_expiry": "TIMESTAMP WITH TIME ZONE",
        "reset_token": "VARCHAR(255)",
        "reset_expiry": "TIMESTAMP WITH TIME ZONE",
        "created_at": "TIMESTAMP WITH TIME ZONE",
    }
    sqlite_types = {
        "full_name": "VARCHAR(120) DEFAULT ''",
        "is_verified": "BOOLEAN NOT NULL DEFAULT 0",
        "verification_token": "VARCHAR(255)",
        "verification_expiry": "TIMESTAMP",
        "reset_token": "VARCHAR(255)",
        "reset_expiry": "TIMESTAMP",
        "created_at": "TIMESTAMP",
    }
    return postgres_types.get(name, sqlite_types[name]) if dialect.startswith("postgresql") else sqlite_types[name]


def ensure_auth_schema(engine: Engine) -> None:
    inspector = inspect(engine)
    if not inspector.has_table("users"):
        return

    existing_columns = {column["name"] for column in inspector.get_columns("users")}
    required_columns = (
        "full_name",
        "is_verified",
        "verification_token",
        "verification_expiry",
        "reset_token",
        "reset_expiry",
        "created_at",
    )

    with engine.begin() as connection:
        for column_name in required_columns:
            if column_name in existing_columns:
                continue
            column_type = _column_type(engine.dialect.name, column_name)
            logger.info("Adding missing users.%s column.", column_name)
            connection.execute(text(f"ALTER TABLE users ADD COLUMN {column_name} {column_type}"))

        connection.execute(text("UPDATE users SET role = 'learner' WHERE role = 'student'"))
        connection.execute(
            text(
                """
                UPDATE users
                SET full_name = COALESCE(
                    NULLIF(full_name, ''),
                    (SELECT profiles.full_name FROM profiles WHERE profiles.user_id = users.id LIMIT 1),
                    'SkillSync User'
                )
                WHERE full_name IS NULL OR full_name = ''
                """
            )
        )

        if engine.dialect.name.startswith("postgresql"):
            connection.execute(text("UPDATE users SET created_at = NOW() WHERE created_at IS NULL"))
        else:
            connection.execute(text("UPDATE users SET created_at = CURRENT_TIMESTAMP WHERE created_at IS NULL"))
