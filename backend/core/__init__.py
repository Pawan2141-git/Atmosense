"""
Atmosense Core Configuration
Centralized settings loaded from environment variables.
"""
from pydantic_settings import BaseSettings
from pydantic import Field
from backend.core.enums import DataMode  # single source of truth


class Settings(BaseSettings):
    """Application settings loaded from environment."""

    # Application
    app_name: str = "Atmosense"
    app_version: str = "0.1.0-prototype"
    debug: bool = False

    # Data Mode
    data_mode: DataMode = DataMode.DEMO

    # Server
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000
    cors_origins: str = "http://localhost:3000"

    # Map provider
    carto_api_token: str = Field(
        default="",
        validation_alias="CARTO_API_TOKEN",
    )

    # Database
    db_path: str = "./data/atmosense.duckdb"

    # ML Model
    model_path: str = "./ml/models/"
    model_version: str = "0.1.0-prototype"

    # Open-Meteo Provider Configuration
    openmeteo_enabled: bool = True
    openmeteo_timeout_sec: float = 10.0
    openmeteo_cache_ttl_sec: int = 600
    openmeteo_max_grid_size: int = 7

    # Logging
    log_level: str = "INFO"

    model_config = {
        "env_prefix": "ATMOSENSE_",
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


# Singleton settings instance
_settings = None


def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
