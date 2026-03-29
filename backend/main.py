import os
import time

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

from . import database, models
from .core.config import get_settings
from .core.errors import register_exception_handlers
from .core.logging import configure_logging
from .routers import admin_router, analysis_router, auth_router, health_router, profile_router


settings = get_settings()
logger = configure_logging()
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=settings.app_description,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    elapsed = (time.perf_counter() - start) * 1000
    logger.info("%s %s -> %d (%.1f ms)", request.method, request.url.path, response.status_code, elapsed)
    return response


register_exception_handlers(app)

app.include_router(health_router.router)
app.include_router(auth_router.router)
app.include_router(profile_router.router)
app.include_router(analysis_router.router)
app.include_router(admin_router.router)


_static_dir = os.path.join(os.path.dirname(__file__), "static")
if os.path.exists(_static_dir):
    _assets_dir = os.path.join(_static_dir, "assets")
    if os.path.exists(_assets_dir):
        app.mount("/assets", StaticFiles(directory=_assets_dir), name="assets")

_API_PREFIXES = frozenset(
    {
        "register",
        "token",
        "users",
        "profile",
        "resume-upload",
        "industry-roles",
        "skill-gap",
        "admin",
        "health",
    }
)


@app.get("/{full_path:path}", include_in_schema=False)
async def serve_frontend(full_path: str):
    first_segment = full_path.split("/")[0]
    if first_segment in _API_PREFIXES:
        raise HTTPException(status_code=404, detail="Not found.")

    if os.path.exists(_static_dir):
        file_path = os.path.join(_static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)

        index_path = os.path.join(_static_dir, "index.html")
        if os.path.exists(index_path):
            return FileResponse(index_path)

    return JSONResponse(
        status_code=503,
        content={"detail": "Frontend not built yet. Run `npm run build` in /frontend."},
    )
