from fastapi import FastAPI
from .Guerras_Clon.core.loggin_config import setup_logging
from fastapi.middleware.cors import CORSMiddlewar
from .Guerras_Clon.api.endpoints import heroes


setup_logging()

app = FastAPI(
    title="Ministerio Marvel API",
    description="Sistema de gestión de héroes y combates con AOP."
)

origins = [
    "http://localhost:3000",
]


app.add_middleware(
    CORSMiddlewar,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    heroes.router,
    prefix="/Guerras_Clon"
)


@app.get("/", tags=["Root"])
async def read_root():

    return {"Ministerio": "Bienvenido al Sistema de Gestión Marvel"}