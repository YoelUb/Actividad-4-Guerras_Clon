from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import computed_field
import os


env_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), '.env')


class Settings(BaseSettings):


    model_config = SettingsConfigDict(env_file=env_path, extra='ignore')


    DB_USER: str
    DB_PASSWORD: str
    DB_NAME: str
    DB_HOST: str
    DB_PORT: int


    EMAIL_SENDER: str | None = None
    EMAIL_APP_PASSWORD: str | None = None


    @computed_field
    @property
    def DATABASE_URL(self) -> str:
        """
        Construye la URL de conexión a la BBDD.
        """
        return f"postgresql+asyncpg://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"


settings = Settings()