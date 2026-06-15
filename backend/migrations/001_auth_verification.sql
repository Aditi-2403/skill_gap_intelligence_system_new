-- SkillSync authentication redesign migration for PostgreSQL.
-- Run this against the production database before or during deployment.

ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name VARCHAR(120) DEFAULT '';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_expiry TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_expiry TIMESTAMPTZ;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ;

UPDATE users
SET role = 'learner'
WHERE role = 'student';

UPDATE users
SET full_name = COALESCE(
    NULLIF(full_name, ''),
    (
        SELECT profiles.full_name
        FROM profiles
        WHERE profiles.user_id = users.id
        LIMIT 1
    ),
    'SkillSync User'
)
WHERE full_name IS NULL OR full_name = '';

UPDATE users
SET created_at = NOW()
WHERE created_at IS NULL;

ALTER TABLE users ALTER COLUMN role SET DEFAULT 'learner';
ALTER TABLE users ALTER COLUMN full_name SET NOT NULL;
ALTER TABLE users ALTER COLUMN created_at SET DEFAULT NOW();
ALTER TABLE users ALTER COLUMN created_at SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'users_role_check'
    ) THEN
        ALTER TABLE users
        ADD CONSTRAINT users_role_check CHECK (role IN ('learner', 'admin'));
    END IF;
END $$;
