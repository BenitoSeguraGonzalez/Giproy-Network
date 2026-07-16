from pathlib import Path
from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_ENV_FILE = Path(__file__).resolve().parents[2] / ".env"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=BACKEND_ENV_FILE,
        env_file_encoding="utf-8",
    )

    PROJECT_NAME: str = "GIPROY ERP"
    API_V1_STR: str = "/api/v1"
    REPORTS_DIR: Path = Path(__file__).resolve().parents[3] / "docs" / "reportes"
    SECRET_KEY: str = "change-this-in-env"
    COMPANY_BACKUP_SECRET: Optional[str] = None
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    SESSION_INACTIVITY_TIMEOUT_MINUTES: int = 30
    RUC_REVIEW_ENCRYPTION_KEY: Optional[str] = None
    SRI_RUC_PRIVATE_DIR: Path = Path("runtime") / "sri_ruc"
    SRI_RUC_DOWNLOAD_MAX_BYTES: int = 1_500_000_000
    SRI_RUC_LOOKUPS_PER_IP_HOUR: int = 10
    SRI_RUC_ALERT_EMAIL: Optional[str] = None
    AUTH_SESSION_TRACE_ENABLED: bool = True
    AUTH_SESSION_TRACE_FILE: str = "auth_session_trace.jsonl"
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3010",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3010"
    ]
    CREATE_TABLES_ON_STARTUP: bool = False
    BIM_ENABLED: bool = False
    BIM_ALLOWED_EMPRESA_IDS: str = ""
    BIM_ALLOWED_USER_IDS: str = ""
    BIM_LOCAL_STORAGE_DIR: Path = Path("uploads") / "bim"
    EMAIL_BACKEND: str = "mock"
    EMAIL_FROM_EMAIL: str = "soporte@giproy.com"
    EMAIL_FROM_NAME: str = "GiProy"
    FRONTEND_PUBLIC_URL: str = "http://localhost:3010"
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USERNAME: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = True
    SMTP_USE_SSL: bool = False
    
    # DB
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = ""
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: str = "5432"
    POSTGRES_DB: str = "giproy_erp"
    DATABASE_URL: Optional[str] = None
    
    @property
    def sync_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

settings = Settings()
