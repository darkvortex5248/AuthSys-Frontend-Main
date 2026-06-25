import os
from pydantic import model_validator
from pydantic_settings import BaseSettings

os.environ["POSTGRES_URL"] = "postgres://something"

class Settings(BaseSettings):
    DATABASE_URL: str = ""

    @model_validator(mode="before")
    @classmethod
    def resolve_env_aliases(cls, data: object) -> object:
        if not isinstance(data, dict):
            return data
        
        print("Data received in before validator:", data)
        if not data.get("DATABASE_URL"):
            value = os.getenv("POSTGRES_URL")
            if value:
                data["DATABASE_URL"] = value
        return data

s = Settings()
print("DATABASE_URL is:", s.DATABASE_URL)
