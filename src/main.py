from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from .Guerras_Clon.core.loggin_config import setup_logging
from .Guerras_Clon.api.endpoints import star_wars, auth, admin
from .Guerras_Clon.bd.database import engine, Base


setup_logging()


@app.on_event("startup")
async def on_startup():

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


    Instrumentator().instrument(app).expose(app)


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
    auth.router,
    prefix="/api/auth",
    tags=["Authentication"]
)
app.include_router(
    admin.router,
    prefix="/api/admin",
    tags=["Admin"]
)
app.include_router(
    star_wars.router,
    prefix="/api/guerras-clon",
    tags=["Star Wars"]
)


@app.get("/", tags=["Root"])
async def read_root():
    return {"GUERRAS CLON": "PREPARADO PARA LA GUERRA?"}