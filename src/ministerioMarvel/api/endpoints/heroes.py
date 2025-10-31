import logging
from fastapi import APIRouter, Depends
from ...dependencies.common import get_logger


router = APIRouter()


@router.get("/heroes", tags=["Héroes"])
async def get_lista_heroes(
        logger: logging.Logger = Depends(get_logger)
):



    logger.info("Petición recibida para listar héroes.")


    return [
        {"nombre": "Iron Man", "vida": 100, "ataque": 75, "defensa": 60},
        {"nombre": "Hulk", "vida": 500, "ataque": 100, "defensa": 80}
    ]


@router.get("/", tags=["Héroes"])
async def get_root_heroes():

    return {"mensaje": "Módulo de Héroes"}