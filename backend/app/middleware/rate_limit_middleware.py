from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from app.core.config import settings
from app.core.rate_limit import RateLimitExceeded, enforce_rate_limit


class GlobalRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Applies a generous default per-org (or per-IP if unauthenticated)
    request cap. This is deliberately loose — it exists to stop runaway
    scripts/bugs, not to be the primary defense on sensitive endpoints.
    Calling/SMS/email/import endpoints layer their own tighter,
    action-specific limits via app.core.rate_limit.enforce_rate_limit
    (see app/modules/clients/router.py's CSV import endpoint for an example).
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        scope_key = self._scope_key(request)
        try:
            await enforce_rate_limit(
                key=f"ratelimit:global:{scope_key}",
                limit=settings.rate_limit_per_minute_default,
                window_seconds=60,
            )
        except RateLimitExceeded as exc:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content={"detail": "Rate limit exceeded"},
                headers={"Retry-After": str(exc.retry_after_seconds)},
            )
        return await call_next(request)

    @staticmethod
    def _scope_key(request: Request) -> str:
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            # Cheap scoping key — good enough to bucket by token without a full decode+DB hit on every request.
            return f"token:{hash(auth_header) % 10_000_000}"
        client_host = request.client.host if request.client else "unknown"
        return f"ip:{client_host}"
