from src.Guerras_Clon.api.schemas.star_wars_models import Mundo, Personaje, InfoPersonaje
# --- 1. AÑADIR IMPORT ---
from typing import List
# ------------------------

BASE_URL_FRONTEND = "http://localhost:3000/imagenes"

DATOS_MUNDOS = {
    1: Mundo(id=1, nombre="Tatooine", imagen=f"{BASE_URL_FRONTEND}/tatooine.png"),
    2: Mundo(id=2, nombre="Hoth", imagen=f"{BASE_URL_FRONTEND}/hoth.png"),
    3: Mundo(id=3, nombre="Endor", imagen=f"{BASE_URL_FRONTEND}/endor.png"),
}

DATOS_PERSONAJES = [
    Personaje(id="luke", nombre="Luke Skywalker", tipo="heroe", mundo_id=1,
              info=InfoPersonaje(daño=85, defensa=670, ataque_especial=160),
              imagen=f"{BASE_URL_FRONTEND}/luke.png"),
    Personaje(id="obiwan", nombre="Obi-Wan Kenobi", tipo="heroe", mundo_id=1,
              info=InfoPersonaje(daño=80, defensa=690, ataque_especial=150),
              imagen=f"{BASE_URL_FRONTEND}/obiwan.png"),
    Personaje(id="r2d2", nombre="R2-D2", tipo="heroe", mundo_id=1,
              info=InfoPersonaje(daño=30, defensa=670, ataque_especial=100),
              imagen=f"{BASE_URL_FRONTEND}/r2d2.png"),

    Personaje(id="jabba", nombre="Jabba the Hutt", tipo="villano", mundo_id=1,
              info=InfoPersonaje(daño=60, defensa=680, ataque_especial=100),
              imagen=f"{BASE_URL_FRONTEND}/jabba.png"),
    Personaje(id="tusken", nombre="Tusken Raider", tipo="villano", mundo_id=1,
              info=InfoPersonaje(daño=65, defensa=650, ataque_especial=70),
              imagen=f"{BASE_URL_FRONTEND}/tusken.png"),
    Personaje(id="greedo", nombre="Greedo", tipo="villano", mundo_id=1,
              info=InfoPersonaje(daño=55, defensa=640, ataque_especial=60),
              imagen=f"{BASE_URL_FRONTEND}/greedo.png"),

    # --- Mundo 2: Hoth ---
    Personaje(id="leia", nombre="Princess Leia (Hoth)", tipo="heroe", mundo_id=2,
              info=InfoPersonaje(daño=70, defensa=665, ataque_especial=130),
              imagen=f"{BASE_URL_FRONTEND}/leia.png"),
    Personaje(id="han", nombre="Han Solo (Hoth)", tipo="heroe", mundo_id=2,
              info=InfoPersonaje(daño=75, defensa=660, ataque_especial=140),
              imagen=f"{BASE_URL_FRONTEND}/han.png"),
    Personaje(id="chewie", nombre="Chewbacca", tipo="heroe", mundo_id=2,
              info=InfoPersonaje(daño=90, defensa=680, ataque_especial=120),
              imagen=f"{BASE_URL_FRONTEND}/chewie.png"),

    Personaje(id="vader", nombre="Darth Vader", tipo="villano", mundo_id=2,
              info=InfoPersonaje(daño=100, defensa=690, ataque_especial=180),
              imagen=f"{BASE_URL_FRONTEND}/vader.png"),
    Personaje(id="veers", nombre="General Veers", tipo="villano", mundo_id=2,
              info=InfoPersonaje(daño=70, defensa=670, ataque_especial=110),
              imagen=f"{BASE_URL_FRONTEND}/veers.png"),
    Personaje(id="wampa", nombre="Wampa", tipo="villano", mundo_id=2,
              info=InfoPersonaje(daño=80, defensa=1360, ataque_especial=90),
              imagen=f"{BASE_URL_FRONTEND}/wampa.png"),

    # --- Mundo 3: Endor ---
    Personaje(id="wicket", nombre="Wicket W. Warrick", tipo="heroe", mundo_id=3,
              info=InfoPersonaje(daño=50, defensa=650, ataque_especial=80),
              imagen=f"{BASE_URL_FRONTEND}/wicket.png"),
    Personaje(id="lando", nombre="Lando Calrissian", tipo="heroe", mundo_id=3,
              info=InfoPersonaje(daño=70, defensa=665, ataque_especial=135),
              imagen=f"{BASE_URL_FRONTEND}/lando.png"),
    Personaje(id="ackbar", nombre="Admiral Ackbar", tipo="heroe", mundo_id=3,
              info=InfoPersonaje(daño=60, defensa=670, ataque_especial=110),
              imagen=f"{BASE_URL_FRONTEND}/ackbar.png"),

    Personaje(id="palpatine", nombre="Emperador Palpatine", tipo="villano", mundo_id=3,
              info=InfoPersonaje(daño=80, defensa=680, ataque_especial=200),
              imagen=f"{BASE_URL_FRONTEND}/palpatine.png"),
    Personaje(id="scout", nombre="Scout Trooper", tipo="villano", mundo_id=3,
              info=InfoPersonaje(daño=65, defensa=655, ataque_especial=75),
              imagen=f"{BASE_URL_FRONTEND}/scout.png"),
    Personaje(id="moff", nombre="Moff Jerjerrod", tipo="villano", mundo_id=3,
              info=InfoPersonaje(daño=40, defensa=660, ataque_especial=50),
              imagen=f"{BASE_URL_FRONTEND}/moff.png"),
]


async def obtener_mundos_clon():
    return list(DATOS_MUNDOS.values())


async def obtener_personajes_por_mundo(mundo_id: int):
    personajes = [p for p in DATOS_PERSONAJES if p.mundo_id == mundo_id]
    heroes = [p for p in personajes if p.tipo == "heroe"]
    villanos = [p for p in personajes if p.tipo == "villano"]

    return {
        "heroes": heroes[:3],
        "villanos": villanos[:3]
    }

async def get_character_by_id(character_id: str) -> Personaje | None:
    return next((p for p in DATOS_PERSONAJES if p.id == character_id), None)

async def get_all_characters() -> List[Personaje]:
    return DATOS_PERSONAJES