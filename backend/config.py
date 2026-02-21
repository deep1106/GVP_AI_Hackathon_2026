"""FleetFlow – Configuration."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    APP_NAME: str = "FleetFlow"
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/fleetflow"
    SECRET_KEY: str = "change-me-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    # Automation settings
    BUDGET_THRESHOLD_MONTHLY: float = 500000.0   # INR monthly budget ceiling
    MAINTENANCE_KM_INTERVAL: float = 10000.0     # km before next service reminder
    LICENSE_WARN_DAYS: int = 30                  # days before expiry to warn
    FUEL_ANOMALY_THRESHOLD_PCT: float = 20.0     # % deviation to flag

    class Config:
        env_file = ".env"


@lru_cache
def get_settings() -> Settings:
    return Settings()
