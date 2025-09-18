# app/config.py
from pydantic_settings import BaseSettings
from typing import List
from dotenv import load_dotenv

load_dotenv() # Explicitly load the .env file to be safe

class Settings(BaseSettings):
    MONGO_URI: str
    MONGO_DB: str
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_MINUTES: int = 60
    CORS_ORIGINS: str = ""
    GEMINI_API_KEY: str # <-- This now correctly includes your key

    class Config:
        env_file = ".env"

settings = Settings()

def cors_origins_list() -> List[str]:
    if not settings.CORS_ORIGINS:
        return []
    return [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]