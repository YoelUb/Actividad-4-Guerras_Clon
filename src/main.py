from fastapi import FastAPI
from .ministerioMarvel.core.loggin_config import setup_logging

from .ministerioMarvel.api.endpoints import heroes


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