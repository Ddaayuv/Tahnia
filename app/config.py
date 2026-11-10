from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path


def _normalize_database_url(value: str) -> str:
    value = value.strip()
    if value.startswith("postgres://"):
        return "postgresql+asyncpg://" + value[len("postgres://"):]
    if value.startswith("postgresql://"):
        return "postgresql+asyncpg://" + value[len("postgresql://"):]
    if value.startswith("sqlite:///") and not value.startswith("sqlite+aiosqlite:///"):
        return "sqlite+aiosqlite:///" + value[len("sqlite:///"):]
    return value


@dataclass(frozen=True, slots=True)
class Settings:
    bot_token: str
    owner_id: int
    database_url: str
    redis_url: str | None
    bot_mode: str
    log_level: str
    port: int
    app_version: str = "1.0.0"
    max_questions: int = 100
    max_exam_duration_minutes: int = 240

    @classmethod
    def from_env(cls) -> "Settings":
        token = os.getenv("BOT_TOKEN", "").strip()
        if not token:
            raise RuntimeError("BOT_TOKEN غير مضبوط. أضفه إلى متغيرات البيئة أو ملف .env.")
        raw_owner = os.getenv("OWNER_ID", "").strip()
        if not raw_owner.isdigit():
            raise RuntimeError("OWNER_ID يجب أن يكون رقم Telegram ID الخاص بالمالك.")
        mode = os.getenv("BOT_MODE", "polling").strip().lower()
        if mode not in {"polling", "webhook"}:
            raise RuntimeError("BOT_MODE يجب أن يكون polling أو webhook.")
        if mode == "webhook":
            raise RuntimeError("وضع webhook مُعدّ للتوسعة المستقبلية؛ الإصدار الحالي يعمل بنظام polling.")
        database_url = _normalize_database_url(
            os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./smart_exam_bot.db")
        )
        if database_url.startswith("postgresql://"):
            raise RuntimeError("استخدم postgresql+asyncpg:// أو رابط Railway DATABASE_URL دون تعديل يدوي.")
        return cls(
            bot_token=token,
            owner_id=int(raw_owner),
            database_url=database_url,
            redis_url=os.getenv("REDIS_URL") or None,
            bot_mode=mode,
            log_level=os.getenv("LOG_LEVEL", "INFO").upper(),
            port=int(os.getenv("PORT", "8080")),
            app_version=os.getenv("APP_VERSION", "1.0.0"),
            max_questions=int(os.getenv("MAX_QUESTIONS", "100")),
            max_exam_duration_minutes=int(os.getenv("MAX_EXAM_DURATION_MINUTES", "240")),
        )


BASE_DIR = Path(__file__).resolve().parent.parent
