# Skill Gap Intelligence System

## Run (One Command)

From project root:

```powershell
.\start.cmd
```

This starts backend + frontend automatically (and reuses already running ports if available).
If you prefer PowerShell directly:

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-dev.ps1
```

Default URLs:
- Frontend: http://127.0.0.1:5175
- Backend: http://127.0.0.1:8000

## Run (Local Toolchain - Manual)

1. Start backend API (includes DB + static frontend serving):

```powershell
Set-Location D:\devops-project\skill_gap_intelligence_system_new
& .\.tools\python-3.13.3-embed-amd64\python.exe -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```

2. Open app:

- http://127.0.0.1:8000

## Connection Setup

- Backend reads `DATABASE_URL` from environment.
- Local development fallback is `sqlite:///./sql_app.db` when `DATABASE_URL` is not set.
- If `DATABASE_URL` starts with `postgres://`, backend auto-converts it to `postgresql://` for SQLAlchemy compatibility.
- Database tables are created automatically at startup.
- Frontend API base URL is configurable with `VITE_API_BASE_URL` (see `frontend/.env.example`).

### Render + Vercel Deployment Notes

- In Render, open your backend service `Environment` tab and set `DATABASE_URL` to your Render Postgres connection string.
- In Render Postgres, you can find connection info in the database service `Connections` tab.
- In Vercel, set `VITE_API_BASE_URL` to your backend URL (for example: `https://your-backend-service.onrender.com`).

## Health Check

- `GET /health` now validates DB connectivity and returns:
  - `status`
  - `version`
  - `database` (`connected` or `disconnected`)
  - `database_engine` (example: `postgresql` or `sqlite`)
  - `database_location` (example: `hostname/database_name` or local sqlite path)
  - `database_source` (`DATABASE_URL` or `default_sqlite_fallback`)
