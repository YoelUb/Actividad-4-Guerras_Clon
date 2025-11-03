import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from datetime import datetime, timezone
from sqlalchemy.future import select
from sqlalchemy import delete
from prometheus_fastapi_instrumentator import Instrumentator
from src.Guerras_Clon.api.endpoints import star_wars, auth, admin, tournaments

from src.Guerras_Clon.bd.database import SessionLocal, engine, Base
from src.Guerras_Clon.bd.models import VerificationCode
from src.Guerras_Clon.core.loggin_config import LOGGING_CONFIG

logging.config.dictConfig(LOGGING_CONFIG)
logger = logging.getLogger("Guerras_Clon")


async def cleanup_expired_codes():
    logger.info("Iniciando tarea de limpieza de códigos de verificación...")
    while True:
        await asyncio.sleep(60)
        now = datetime.now(timezone.utc)
        async with SessionLocal() as db:
            try:
                stmt = delete(VerificationCode).where(VerificationCode.expires_at < now)
                result = await db.execute(stmt)
                await db.commit()
                if result.rowcount > 0:
                    logger.info(f"Limpiados {result.rowcount} códigos expirados.")
            except Exception as e:
                logger.error(f"Error durante la limpieza de códigos: {e}")
                await db.rollback()


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Creando tablas en la base de datos...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    asyncio.create_task(cleanup_expired_codes())

    yield

    logger.info("Cerrando la aplicación.")


app = FastAPI(
    title="API de Star Wars: Guerras Clon",
    description="API para gestionar el juego y la autenticación",
    version="1.0.0",
    lifespan=lifespan
)

Instrumentator().instrument(app).expose(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Autenticación"])
app.include_router(admin.router, prefix="/api/admin", tags=["Administración"])
app.include_router(star_wars.router, prefix="/api/guerras-clon", tags=["Juego"])
app.include_router(tournaments.router, prefix="/api/tournament", tags=["Torneo"])

@app.get("/api/health")
async def health_check():
    return {"status": "ok"}