from fastapi import APIRouter, HTTPException, Depends
from typing import List, Dict, Literal
from src.Guerras_Clon.api.schemas.star_wars_models import Mundo, Personaje
from src.Guerras_Clon.services import swapi_service
import random
from pydantic import BaseModel
from src.Guerras_Clon.services import battle_service
from src.Guerras_Clon.services.swapi_service import obtener_personajes_por_mundo, DATOS_PERSONAJES
from src.Guerras_Clon.security import security
from src.Guerras_Clon.bd import models
from sqlalchemy.ext.asyncio import AsyncSession
from src.Guerras_Clon.bd.database import get_db

router = APIRouter()


class IniciarBatallaRequest(BaseModel):
    mundo_id: int
    jugador_id: str


class PersonajeEnBatalla(BaseModel):
    personaje: Personaje
    hp_actual: int
    especial_usado: bool = False
    es_jugador: bool = False


class EstadoBatalla(BaseModel):
    id_batalla: str
    jugador: PersonajeEnBatalla
    oponente: PersonajeEnBatalla
    log_batalla: list[str] = []
    terminada: bool = False


class AccionBatallaRequest(BaseModel):
    id_batalla: str
    tipo_accion: Literal["ataque_normal", "ataque_especial"]



batallas_activas: Dict[str, EstadoBatalla] = {}


@router.get("/mundos", response_model=List[Mundo])
async def get_mundos(
        current_user: models.User = Depends(security.get_current_user)  # Añadida seguridad
):
    return await swapi_service.obtener_mundos_clon()


@router.get("/mundos/{mundo_id}/personajes", response_model=Dict[str, List[Personaje]])
async def get_personajes_por_mundo(
        mundo_id: int,
        current_user: models.User = Depends(security.get_current_user)  # Añadida seguridad
):
    personajes = await swapi_service.obtener_personajes_por_mundo(mundo_id)
    if not personajes["heroes"] and not personajes["villanos"]:
        raise HTTPException(status_code=404, detail="Mundo no encontrado o sin personajes")
    return personajes


@router.post("/batalla/iniciar", response_model=EstadoBatalla)
async def iniciar_batalla(
        request: IniciarBatallaRequest,
        current_user: models.User = Depends(security.get_current_user)
):
    personajes_mundo = await obtener_personajes_por_mundo(request.mundo_id)

    jugador_data = next((p for p in DATOS_PERSONAJES if p.id == request.jugador_id), None)
    if not jugador_data:
        raise HTTPException(status_code=404, detail="Personaje jugador no encontrado")

    tipo_jugador = jugador_data.tipo
    lista_oponentes = personajes_mundo["villanos"] if tipo_jugador == "heroe" else personajes_mundo["heroes"]

    if not lista_oponentes:
        raise HTTPException(status_code=404, detail="No hay oponentes en este mundo")

    oponente_data = random.choice(lista_oponentes)

    id_batalla = f"batalla_{random.randint(1000, 9999)}"
    estado = EstadoBatalla(
        id_batalla=id_batalla,
        jugador=PersonajeEnBatalla(
            personaje=jugador_data,
            hp_actual=jugador_data.info.defensa,
            es_jugador=True
        ),
        oponente=PersonajeEnBatalla(
            personaje=oponente_data,
            hp_actual=oponente_data.info.defensa
        ),
        log_batalla=[f"¡Comienza la batalla entre {jugador_data.nombre} y {oponente_data.nombre}!"]
    )

    batallas_activas[id_batalla] = estado
    return estado


@router.post("/batalla/accion", response_model=EstadoBatalla)
async def turno_batalla(
        request: AccionBatallaRequest,
        current_user: models.User = Depends(security.get_current_user)
):
    estado = batallas_activas.get(request.id_batalla)
    if not estado or estado.terminada:
        raise HTTPException(status_code=404, detail="Batalla no encontrada o terminada")

    jugador = estado.jugador
    oponente = estado.oponente
    log = estado.log_batalla

    # Comprobar si es el jugador correcto (aunque sin BBDD es simple)
    if not jugador.es_jugador:
        raise HTTPException(status_code=403, detail="No eres el propietario de esta batalla")

    accion_jugador = request.tipo_accion
    if accion_jugador == "ataque_especial" and jugador.especial_usado:
        log.append(f"{jugador.personaje.nombre} intenta usar su ataque especial, ¡pero ya lo ha usado!")
        accion_jugador = "ataque_normal"

    habilidad_jugador = battle_service.factory_habilidades.get_habilidad(accion_jugador)
    daño, msg = habilidad_jugador.ejecutar(jugador.personaje, oponente.personaje)

    oponente.hp_actual = max(0, oponente.hp_actual - daño)
    log.append(msg)
    if accion_jugador == "ataque_especial":
        jugador.especial_usado = True

    if oponente.hp_actual <= 0:
        estado.terminada = True
        log.append(f"¡{jugador.personaje.nombre} ha ganado la batalla!")
        return estado

    accion_ia = "ataque_normal"
    if not oponente.especial_usado and random.random() < 0.5:
        accion_ia = "ataque_especial"
        oponente.especial_usado = True

    habilidad_ia = battle_service.factory_habilidades.get_habilidad(accion_ia)
    daño_ia, msg_ia = habilidad_ia.ejecutar(oponente.personaje, jugador.personaje)

    jugador.hp_actual = max(0, jugador.hp_actual - daño_ia)
    log.append(msg_ia)

    if jugador.hp_actual <= 0:
        estado.terminada = True
        log.append(f"¡{oponente.personaje.nombre} ha ganado la batalla!")
        return estado

    batallas_activas[request.id_batalla] = estado
    return estado