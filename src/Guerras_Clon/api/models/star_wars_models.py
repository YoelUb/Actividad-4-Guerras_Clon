from pydantic import BaseModel
from typing import Literal

class InfoPersonaje(BaseModel):
    daño: int
    defensa: int
    ataque_especial: int

class Personaje(BaseModel):
    id: str
    nombre: str
    tipo: Literal["heroe", "villano"]
    mundo_id: int
    info: InfoPersonaje
    imagen: str

class Mundo(BaseModel):
    id: int
    nombre: str
    imagen: str