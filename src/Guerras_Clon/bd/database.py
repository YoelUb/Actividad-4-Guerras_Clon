from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from ..core.config import settings


DATABASE_URL = settings.DATABASE_URL


engine = create_async_engine(DATABASE_URL, echo = True)
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=AsyncSession

)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

