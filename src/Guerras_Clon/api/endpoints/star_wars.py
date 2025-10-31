from fastapi import APIRouter, HTTPException
from typing import List, Dict
from ..models.star_wars_models import Mundo, Personaje
from ...services import swapi_service

router = APIRouter()

@router.get("/mundos", response_model=List[Mundo])
async def get_mundos():
    return await swapi_service.obtener_mundos_clon()

@router.get("/mundos/{mundo_id}/personajes", response_model=Dict[str, List[Personaje]])
async def get_personajes_por_mundo(mundo_id: int):
    personajes = await swapi_service.obtener_personajes_por_mundo(mundo_id)
    if not personajes["heroes"] and not personajes["villanos"]:
        raise HTTPException(status_code=404, detail="Mundo no encontrado o sin personajes")
    return personajes