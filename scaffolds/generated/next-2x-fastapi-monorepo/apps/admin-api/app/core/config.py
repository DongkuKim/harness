from dataclasses import dataclass


@dataclass(frozen=True)
class Settings:
    app_title: str = "Admin API"
    app_version: str = "0.1.0"


settings = Settings()
