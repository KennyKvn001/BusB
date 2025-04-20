import os
from typing import List
from pydantic import BaseSettings, AnyHttpUrl, validator
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


class Settings(BaseSettings):
    # API Settings
    API_V1_STR: str = "/api"
    PROJECT_NAME: str = "Rwanda Bus Booking API"

    # CORS Settings
    CORS_ORIGINS: List[str] = []

    @validator("CORS_ORIGINS", pre=True)
    def assemble_cors_origins(cls, v: str | List[str]) -> List[str] | str:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)

    # MongoDB Atlas Settings
    MONGODB_URL: str = os.getenv(
        "MONGODB_URL",
        "mongodb+srv://username:password@cluster.mongodb.net/rwanda_bus_db?retryWrites=true&w=majority",
    )
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "rwanda_bus_db")

    # MongoDB Atlas specific settings
    MONGODB_MIN_POOL_SIZE: int = 10
    MONGODB_MAX_POOL_SIZE: int = 100
    MONGODB_MAX_IDLE_TIME_MS: int = 10000

    # JWT Settings
    SECRET_KEY: str = os.getenv("SECRET_KEY", "rwandabussecretkey")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day
    REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # Security Settings
    PASSWORD_RESET_TOKEN_EXPIRE_HOURS: int = 24

    # Email Settings (for future implementation)
    EMAILS_ENABLED: bool = False
    EMAIL_TEMPLATES_DIR: str = "app/email-templates"
    EMAIL_TEST_USER: str = "test@example.com"
    EMAILS_FROM_NAME: str = "Rwanda Bus Booking"
    EMAILS_FROM_EMAIL: str = "noreply@rwandabus.com"
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""

    # Payment Gateway Settings (for future implementation)
    PAYMENT_API_KEY: str = os.getenv("PAYMENT_API_KEY", "")
    PAYMENT_SECRET_KEY: str = os.getenv("PAYMENT_SECRET_KEY", "")

    class Config:
        case_sensitive = True
        env_file = ".env"


# Create settings instance
settings = Settings()
