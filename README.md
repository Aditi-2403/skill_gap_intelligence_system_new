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

- Backend reads `DATABASE_URL` from environment (default: `sqlite:///./sql_app.db`).
- Database tables are created automatically at startup.
- Frontend API base URL is configurable with `VITE_API_BASE_URL` (see `frontend/.env.example`).

## Health Check

- `GET /health` now validates DB connectivity and returns:
  - `status`
  - `version`
  - `database` (`connected` or `disconnected`)
