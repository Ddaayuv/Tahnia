from __future__ import annotations

import asyncio
import logging
from datetime import timedelta, timezone
from contextlib import suppress

from aiogram import Bot, Dispatcher
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode
from aiogram.types import BotCommand
from aiohttp import web
from sqlalchemy import delete, select, text
from sqlalchemy.ext.asyncio import AsyncConnection
from sqlalchemy.orm import selectinload

from app.api.health import build_health_app
from app.bot.routers import admin, exams, misc, owner, polls, results, start
from app.bot.routers.access import BlockedUserMiddleware, DeduplicateUpdateMiddleware
from app.bot.routers.common import safe_html
from app.config import Settings
from app.database import session as db
from app.database.models import Exam, ExamAttempt, ProcessedUpdate, User
from app.services.exam_service import finalize_attempt, now_utc
from app.utils.logging_config import configure_logging

log = logging.getLogger(__name__)
POLLING_LOCK_KEY = 71020261110


async def acquire_polling_lock(settings: Settings) -> AsyncConnection | None:
    """Keep a PostgreSQL advisory lock for this polling process."""
    if not settings.database_url.startswith("postgresql+"):
        log.warning("DATABASE_URL is not PostgreSQL; distributed polling lock is unavailable. Keep one bot process only.")
        return None
    connection = await db.engine.connect()
    locked = await connection.scalar(text("SELECT pg_try_advisory_lock(:key)"), {"key": POLLING_LOCK_KEY})
    if not locked:
        await connection.close()
        raise RuntimeError("هناك نسخة أخرى من البوت تستخدم Long Polling بهذا الرمز. أوقف النسخة الأخرى أو اجعل عدد النسخ Replica واحدة.")
    await connection.commit()
    log.info("PostgreSQL advisory lock acquired for Telegram polling")
    return connection


async def ensure_owner(settings: Settings) -> None:
    async with db.SessionLocal() as session:
        owner = await session.get(User, settings.owner_id)
        if owner is None:
            session.add(User(id=settings.owner_id, full_name="Bot Owner", role="owner"))
        else:
            owner.role = "owner"
        await session.execute(delete(ProcessedUpdate).where(
            ProcessedUpdate.processed_at < now_utc() - timedelta(days=30)
        ))
        await session.commit()


async def expire_attempts_loop(bot: Bot) -> None:
    """Finalize timed-out attempts even when participants stop interacting."""
    while True:
        try:
            expired = []
            last_id = 0
            async with db.SessionLocal() as session:
                while True:
                    rows = (await session.execute(
                        select(ExamAttempt, Exam)
                        .join(Exam, Exam.id == ExamAttempt.exam_id)
                        .where(ExamAttempt.status == "in_progress", ExamAttempt.id > last_id)
                        .options(selectinload(Exam.questions))
                        .order_by(ExamAttempt.id.asc())
                        .limit(250)
                    )).all()
                    if not rows:
                        break
                    for attempt, exam in rows:
                        last_id = max(last_id, attempt.id)
                        started = attempt.started_at
                        if started.tzinfo is None:
                            started = started.replace(tzinfo=timezone.utc)
                        if now_utc() >= started + timedelta(minutes=exam.duration_minutes):
                            result = await finalize_attempt(session, attempt, exam)
                            expired.append((attempt.user_id, exam.title, result))
                    if len(rows) < 250:
                        break
                await session.commit()
            for user_id, title, result in expired:
                try:
                    percent = result["percent"]
                    await bot.send_message(
                        user_id,
                        f"⏱ انتهى وقت اختبار <b>{safe_html(title)}</b>.\n"
                        f"نتيجتك: {result['score']} / {result['total']} ({percent}%).",
                    )
                except Exception:
                    log.info("Could not notify user %s about expired exam", user_id)
        except asyncio.CancelledError:
            raise
        except Exception:
            log.exception("Timeout sweeper failed")
        await asyncio.sleep(20)


async def main() -> None:
    from dotenv import load_dotenv
    load_dotenv()
    settings = Settings.from_env()
    configure_logging(settings.log_level)
    db.configure_database(settings)

    polling_lock = await acquire_polling_lock(settings)
    await ensure_owner(settings)

    storage = None
    if settings.redis_url:
        try:
            from aiogram.fsm.storage.redis import RedisStorage
            storage = RedisStorage.from_url(settings.redis_url)
            log.info("Redis FSM storage enabled")
        except Exception:
            log.exception("Redis configuration failed; using in-memory FSM storage")
            from aiogram.fsm.storage.memory import MemoryStorage
            storage = MemoryStorage()
    else:
        from aiogram.fsm.storage.memory import MemoryStorage
        storage = MemoryStorage()
        log.warning("Redis is not configured; FSM state is stored in memory and can reset on restart")

    bot = Bot(
        token=settings.bot_token,
        default=DefaultBotProperties(parse_mode=ParseMode.HTML),
    )
    dp = Dispatcher(storage=storage)
    dp.update.outer_middleware(DeduplicateUpdateMiddleware())
    blocked_middleware = BlockedUserMiddleware()
    dp.message.outer_middleware(blocked_middleware)
    dp.callback_query.outer_middleware(blocked_middleware)
    dp.poll_answer.outer_middleware(blocked_middleware)
    admin.setup(settings)
    misc.setup(settings)
    owner.setup(settings)
    polls.setup(settings)
    results.setup(settings)

    dp.include_router(start.router)
    dp.include_router(admin.router)
    dp.include_router(exams.router)
    dp.include_router(polls.router)
    dp.include_router(owner.router)
    dp.include_router(results.router)
    dp.include_router(misc.router)

    await bot.set_my_commands([
        BotCommand(command="start", description="بدء البوت"),
        BotCommand(command="help", description="المساعدة"),
        BotCommand(command="panel", description="لوحة الإدارة"),
        BotCommand(command="newexam", description="إنشاء اختبار"),
        BotCommand(command="myresults", description="نتائجي"),
        BotCommand(command="leaderboard", description="المتصدرون"),
        BotCommand(command="owner", description="استدعاء المالك"),
    ])
    # Polling and webhook cannot be active simultaneously.
    await bot.delete_webhook(drop_pending_updates=False)

    health_runner = web.AppRunner(build_health_app(settings))
    await health_runner.setup()
    site = web.TCPSite(health_runner, host="0.0.0.0", port=settings.port)
    await site.start()
    log.info("Health server listening on 0.0.0.0:%s", settings.port)

    sweeper = asyncio.create_task(expire_attempts_loop(bot), name="exam-timeout-sweeper")
    log.info("Starting Smart Exam Bot v%s in polling mode", settings.app_version)
    try:
        await dp.start_polling(
            bot,
            allowed_updates=dp.resolve_used_update_types(),
            close_bot_session=False,
        )
    finally:
        sweeper.cancel()
        with suppress(asyncio.CancelledError):
            await sweeper
        await health_runner.cleanup()
        if hasattr(storage, "close"):
            with suppress(Exception):
                await storage.close()
        await bot.session.close()
        if polling_lock is not None:
            with suppress(Exception):
                await polling_lock.execute(text("SELECT pg_advisory_unlock(:key)"), {"key": POLLING_LOCK_KEY})
                await polling_lock.close()
        await db.close_database()


def run() -> None:
    asyncio.run(main())
