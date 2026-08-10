from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.middleware.rate_limit_middleware import GlobalRateLimitMiddleware
from app.modules.auth.router import router as auth_router
from app.modules.chat.router import router as chat_router
from app.modules.clients.router import router as clients_router
from app.modules.orgs.router import router as orgs_router
from app.modules.pipeline.router import router as pipeline_router

# Gap-fill routers (previously models-only, now fully wired)
from app.modules.contacts.router import router as contacts_router
from app.modules.industries.router import router as industries_router
from app.modules.tags.router import router as tags_router
from app.modules.saved_searches.router import router as saved_searches_router
from app.modules.reminders.router import router as reminders_router
from app.modules.interactions.router import router as interactions_router
from app.modules.audit_logs.router import router as audit_logs_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Best-effort ES index bootstrap; search still works (via Postgres fallback) if this fails.
    try:
        from app.search.es_client import ensure_index

        await ensure_index()
    except Exception:
        pass
    yield


app = FastAPI(
    title="B2B Client Discovery & Outreach CRM API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GlobalRateLimitMiddleware)


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Consistent structured error envelope across the API."""
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail, "path": request.url.path})


@app.get("/health")
async def health():
    return {"status": "ok"}


# Core routers
app.include_router(auth_router)
app.include_router(orgs_router)
app.include_router(clients_router)
app.include_router(pipeline_router)
app.include_router(chat_router)

# Gap-fill routers
app.include_router(contacts_router)
app.include_router(industries_router)
app.include_router(tags_router)
app.include_router(saved_searches_router)
app.include_router(reminders_router)
app.include_router(interactions_router)
app.include_router(audit_logs_router)
