"""
Manage all environment variables, constants (model names, database URL, etc.)
"""

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, AliasChoices


class Settings(BaseSettings):
    """
    All application settings loaded from environment variables / .env files.
    """

    model_config = SettingsConfigDict(
        env_prefix="APP_",
        env_file=("apps/api/.env", ".env"),
        extra="ignore"
    )

    # ── Constants ─────────────────────────────────────────────────────────────
    max_page_count: int = 15

    # ── AI Credentials ────────────────────────────────────────────────────────
    GEMINI_API_KEY: str | None = Field(
        default=None,
        description="Google Gemini API Key",
        validation_alias=AliasChoices(
            "APP_GEMINI_API_KEY", "GEMINI_API_KEY",
            "APP_GOOGLE_API_KEY", "GOOGLE_API_KEY"
        )
    )

    # ── Database (Supabase Postgres via SQLAlchemy) ───────────────────────────
    DATABASE_URL: str = Field(
        default="",
        description="Full async database URL. Use port 6543 (transaction pooler) for FastAPI.",
        validation_alias=AliasChoices(
            "APP_DATABASE_URL", "DATABASE_URL"
        )
    )

    # ── Supabase Client SDK ───────────────────────────────────────────────────
    SUPABASE_URL: str = Field(
        default="",
        description="Your Supabase project URL: https://<ref>.supabase.co",
        validation_alias=AliasChoices(
            "APP_SUPABASE_URL", "SUPABASE_URL"
        )
    )

    # Formerly "anon key" — safe to use in client-side/browser code.
    # Respects Row Level Security (RLS) policies on your tables.
    SUPABASE_PUBLISHABLE_KEY: str = Field(
        default="",
        description="Supabase publishable key (formerly anon key). Safe for client-side. Respects RLS.",
        validation_alias=AliasChoices(
            "APP_SUPABASE_PUBLISHABLE_KEY", "SUPABASE_PUBLISHABLE_KEY",
            "APP_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY"       # legacy name fallback
        )
    )

    # Formerly "service_role key" — BYPASSES RLS entirely. Backend use only!
    # Never expose in frontend code, browser, logs, or public repos.
    SUPABASE_SECRET_KEY: str = Field(
        default="",
        description="Supabase secret key (formerly service_role). Bypasses RLS. BACKEND ONLY.",
        validation_alias=AliasChoices(
            "APP_SUPABASE_SECRET_KEY", "SUPABASE_SECRET_KEY",
            "APP_SUPABASE_SERVICE_ROLE_KEY", "SUPABASE_SERVICE_ROLE_KEY"   # legacy name fallback
        )
    )

    STORAGE_BUCKET: str = Field(
        default="pdfs",
        description="Supabase Storage bucket name for PDF uploads",
        validation_alias=AliasChoices(
            "APP_STORAGE_BUCKET", "STORAGE_BUCKET"
        )
    )

    # ── Auth Modes ────────────────────────────────────────────────────────────
    APP_ENV: str = Field(
        default="production",
        description="Environment: 'development' enables local UUID auth shortcut",
        validation_alias=AliasChoices("APP_ENV", "ENV")
    )

    # Only set this for legacy Supabase projects using symmetric HS256 JWTs.
    # Leave empty for modern Supabase projects (asymmetric keys — Mode 3 is used).
    SUPABASE_JWT_SECRET: str = Field(
        default="",
        description="Legacy Supabase JWT secret for HS256 decoding. Leave empty for modern projects.",
        validation_alias=AliasChoices(
            "APP_SUPABASE_JWT_SECRET", "SUPABASE_JWT_SECRET"
        )
    )

    # ── Security ──────────────────────────────────────────────────────────────
    secret_key: str = Field(
        default="change-me-in-production",
        description="JWT signing secret for your API",
        validation_alias=AliasChoices(
            "APP_SECRET_KEY", "SECRET_KEY"
        )
    )

    @property
    def super_key(self) -> str:
        return self.secret_key


settings = Settings()
