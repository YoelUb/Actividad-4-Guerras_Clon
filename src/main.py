from fastapi import FastAPI
from .ministerio_Marvel.core.logging_config import setup_logging

from .ministerio_Marvel.api.endpoints import heroes


setup_logging()

app = FastAPI(
    title="Ministerio Marvel API",
    description="Sistema de gestión de héroes y combates con AOP."
)


app.include_router(
    heroes.router,
    prefix="/ministerioMarvel"
)


@app.get("/", tags=["Root"])
async def read_root():

    return {"Ministerio": "Bienvenido al Sistema de Gestión Marvel"}