from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.Guerras_Clon.bd.database import get_db
from src.Guerras_Clon.services import swapi_service, battle_service
from src.Guerras_Clon.api.schemas import star_wars_models as schemas
from src.Guerras_Clon.security import security
from src.Guerras_Clon.bd import models
from typing import Dict

router = APIRouter()

batallas_activas: Dict[str, battle_service.EstadoBatalla] = {}


@router.get("/mundos")
async def get_mundos(
        current_user: models.User = Depends(security.get_current_user)
):
    """
    Obtiene la lista de todos los mundos disponibles.
    """
    return await swapi_service.obtener_mundos_clon()


@router.get("/mundos/{mundo_id}/personajes")
# ------------------------------------
async def get_personajes_por_mundo(
        mundo_id: int,
        current_user: models.User = Depends(security.get_current_user)
):
    """
    Obtiene los personajes (héroes y villanos) de un mundo específico.
    """
    if mundo_id not in swapi_service.DATOS_MUNDOS:
        raise HTTPException(status_code=404, detail="Mundo no encontrado")
    return await swapi_service.obtener_personajes_por_mundo(mundo_id)


@router.post("/batalla/iniciar", response_model=battle_service.EstadoBatalla)
async def iniciar_batalla(
        request: schemas.InicioBatallaRequest,
        db: AsyncSession = Depends(get_db),
        current_user: models.User = Depends(security.get_current_user)
):
    """
    Inicia una nueva batalla entre un jugador y un oponente de IA.
    """
    estado_inicial = await battle_service.iniciar_nueva_batalla(
        db=db,
        user=current_user,
        mundo_id=request.mundo_id,
        jugador_char_id=request.jugador_id
    )
    batallas_activas[estado_inicial.id_batalla] = estado_inicial
    return estado_inicial


@router.post("/batalla/accion", response_model=battle_service.EstadoBatalla)
async def tomar_accion_en_batalla(
        request: schemas.AccionBatallaRequest,
        current_user: models.User = Depends(security.get_current_user)
):
    """
    Procesa una acción del jugador (ataque normal o especial) en una batalla activa.
    """
    id_batalla = request.id_batalla
    if id_batalla not in batallas_activas:
        raise HTTPException(status_code=404, detail="Batalla no encontrada o ya ha terminado.")

    estado_actual = batallas_activas[id_batalla]
    if estado_actual.terminada:
        raise HTTPException(status_code=400, detail="Esta batalla ya ha terminado.")

    if not (estado_actual.jugador.es_jugador and estado_actual.jugador.personaje.id == current_user.username):

        pass

    try:
        estado_actualizado = await battle_service.procesar_turno(
            estado=estado_actual,
            accion_jugador=request.tipo_accion
        )
        if estado_actualizado.terminada:
            del batallas_activas[id_batalla]
        else:
            batallas_activas[id_batalla] = estado_actualizado

        return estado_actualizado
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))