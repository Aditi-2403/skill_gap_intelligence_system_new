from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import logging


logger = logging.getLogger("skillsync.errors")


def build_error_payload(code: str, message: str, path: str):
    return {
        "detail": message,
        "error": {
            "code": code,
            "message": message,
            "path": path,
        }
    }


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning("HTTP %s on %s: %s", exc.status_code, request.url.path, exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=build_error_payload(
            code=f"HTTP_{exc.status_code}",
            message=str(exc.detail),
            path=request.url.path,
        ),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.info("Validation error on %s: %s", request.url.path, exc.errors())
    return JSONResponse(
        status_code=422,
        content={
            "detail": "Validation failed",
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation failed",
                "path": request.url.path,
                "fields": exc.errors(),
            }
        },
    )


async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled exception on %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=500,
        content=build_error_payload(
            code="INTERNAL_SERVER_ERROR",
            message="An internal server error occurred. Please try again.",
            path=request.url.path,
        ),
    )


def register_exception_handlers(app: FastAPI):
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)
