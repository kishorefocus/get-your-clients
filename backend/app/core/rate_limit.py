"""
Simple fixed-window rate limiter backed by Redis.

Not a full token-bucket (that's a reasonable v2 upgrade), but this is enough
to (a) protect calling/SMS/email endpoints from abuse and (b) stay within
third-party provider rate limits per org. Each call is O(1) via INCR + TTL,
so it's cheap enough to run on every request.
"""

from app.core.redis_client import get_redis


class RateLimitExceeded(Exception):
    def __init__(self, retry_after_seconds: int):
        self.retry_after_seconds = retry_after_seconds
        super().__init__(f"Rate limit exceeded, retry after {retry_after_seconds}s")


async def enforce_rate_limit(*, key: str, limit: int, window_seconds: int = 60) -> None:
    """
    key should already encode scope, e.g. f"ratelimit:org:{org_id}:sms"
    or f"ratelimit:user:{user_id}:api".
    """
    redis = get_redis()
    current = await redis.incr(key)
    if current == 1:
        await redis.expire(key, window_seconds)
    if current > limit:
        ttl = await redis.ttl(key)
        raise RateLimitExceeded(retry_after_seconds=max(ttl, 1))
