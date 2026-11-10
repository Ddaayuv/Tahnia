from __future__ import annotations

from time import monotonic

from aiohttp import web
from sqlalchemy import text

from app.database import session as db


async def health_handler(request: web.Request) -> web.Response:
    started = request.app["started_at"]
    settings = request.app["settings"]
    database_status = "ok"
    redis_status = "not_configured"
    try:
        if db.SessionLocal is None:
            raise RuntimeError("database session is not configured")
        async with db.SessionLocal() as session:
            await session.execute(text("SELECT 1"))
    except Exception:
        database_status = "error"

    if settings.redis_url:
        client = None
        try:
            from redis.asyncio import Redis
            client = Redis.from_url(settings.redis_url, socket_connect_timeout=2, socket_timeout=2)
            await client.ping()
            redis_status = "ok"
        except Exception:
            redis_status = "error"
        finally:
            if client is not None:
                await client.aclose()

    status = "ok" if database_status == "ok" and redis_status != "error" else "degraded"
    response = {
        "status": status,
        "bot_process": "running",
        "database": database_status,
        "redis": redis_status,
        "uptime_seconds": round(monotonic() - started, 2),
        "version": settings.app_version,
    }
    return web.json_response(response, status=200 if status == "ok" else 503)


def build_health_app(settings) -> web.Application:
    app = web.Application()
    app["settings"] = settings
    app["started_at"] = monotonic()
    app.router.add_get("/health", health_handler)
    app.router.add_get("/", health_handler)
    return app
