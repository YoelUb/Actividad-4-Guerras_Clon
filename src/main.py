from fastapi import FastAPI
from .Guerras_Clon.core.loggin_config import setup_logging
from fastapi.middleware.cors import CORSMiddleware
from .Guerras_Clon.api.endpoints import star_wars

setup_logging()

app = FastAPI(
    title="API de Guerras Clon",
    description="Sistema de gestión de mundos y personajes de Star Wars."
)

origins = [
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(
    star_wars.router,
    prefix="/api/guerras-clon",
    tags=["Star Wars"]
)

@app.get("/", tags=["Root"])
async def read_root():
    return {"GUERRAS CLON": "PREPARADO PARA LA GUERRA?"}
