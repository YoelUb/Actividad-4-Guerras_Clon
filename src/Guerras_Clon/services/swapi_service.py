from ..api.models.star_wars_models import Mundo, Personaje, InfoPersonaje

DATOS_MUNDOS = {
    1: Mundo(id=1, nombre="Kamino", imagen="https://statsic.wikia.nocookie.net/es.starwars/images/5/52/Kamino-TSWB.png"),
    2: Mundo(id=2, nombre="Coruscant", imagen="https://static.wikia.nocookie.net/es.starwars/images/e/e1/Coruscant_Enciclopedia.png"),
    3: Mundo(id=3, nombre="Naboo", imagen="https://static.wikia.nocookie.net/es.starwars/images/0/06/Naboo_Enciclopedia.png"),
}

DATOS_PERSONAJES = [
    Personaje(id="obi", nombre="Obi-Wan Kenobi", tipo="heroe", mundo_id=1, info=InfoPersonaje(daño=80, defensa=90, ataque_especial=150), imagen="https://static.wikia.nocookie.net/es.starwars/images/3/30/Obi-Wan_Kenobi_Kenobi_series.png"),
    Personaje(id="cody", nombre="Comandante Cody", tipo="heroe", mundo_id=1, info=InfoPersonaje(daño=70, defensa=80, ataque_especial=120), imagen="https://static.wikia.nocookie.net/es.starwars/images/2/29/Cody_S3.png"),
    Personaje(id="shaak", nombre="Shaak Ti", tipo="heroe", mundo_id=1, info=InfoPersonaje(daño=75, defensa=85, ataque_especial=140), imagen="https://static.wikia.nocookie.net/es.starwars/images/e/e3/Shaak_Ti_sin_sable.png"),
    Personaje(id="jango", nombre="Jango Fett", tipo="villano", mundo_id=1, info=InfoPersonaje(daño=90, defensa=70, ataque_especial=160), imagen="https://static.wikia.nocookie.net/es.starwars/images/6/6e/Jango_Fett_BD.png"),
    Personaje(id="taun", nombre="Taun We", tipo="villano", mundo_id=1, info=InfoPersonaje(daño=30, defensa=50, ataque_especial=60), imagen="https://static.wikia.nocookie.net/es.starwars/images/3/36/Taun_We_TBB.png"),
    Personaje(id="lama", nombre="Lama Su", tipo="villano", mundo_id=1, info=InfoPersonaje(daño=20, defensa=40, ataque_especial=50), imagen="https://static.wikia.nocookie.net/es.starwars/images/a/a9/Lama_Su_TBB.png"),

    Personaje(id="anakin", nombre="Anakin Skywalker", tipo="heroe", mundo_id=2, info=InfoPersonaje(daño=90, defensa=80, ataque_especial=170), imagen="https://static.wikia.nocookie.net/es.starwars/images/c/c6/Anakin_Skywalker_perfil.png"),
    Personaje(id="yoda", nombre="Yoda", tipo="heroe", mundo_id=2, info=InfoPersonaje(daño=70, defensa=95, ataque_especial=180), imagen="https://static.wikia.nocookie.net/es.starwars/images/1/1d/Yoda_en_su_silla.png"),
    Personaje(id="padme", nombre="Padmé Amidala", tipo="heroe", mundo_id=2, info=InfoPersonaje(daño=60, defensa=60, ataque_especial=110), imagen="https://static.wikia.nocookie.net/es.starwars/images/a/a2/Padme_Amidala_perfil.png"),
    Personaje(id="palpatine", nombre="Palpatine", tipo="villano", mundo_id=2, info=InfoPersonaje(daño=80, defensa=80, ataque_especial=200), imagen="https://static.wikia.nocookie.net/es.starwars/images/6/68/Palpatine_sith.png"),
    Personaje(id="cad", nombre="Cad Bane", tipo="villano", mundo_id=2, info=InfoPersonaje(daño=85, defensa=60, ataque_especial=150), imagen="https://static.wikia.nocookie.net/es.starwars/images/c/c5/Cad_Bane_TBB_Perfil.png"),
    Personaje(id="mas", nombre="Mas Amedda", tipo="villano", mundo_id=2, info=InfoPersonaje(daño=10, defensa=30, ataque_especial=20), imagen="https://static.wikia.nocookie.net/es.starwars/images/d/d5/Mas_Amedda_SWE.png"),

    Personaje(id="quigon", nombre="Qui-Gon Jinn", tipo="heroe", mundo_id=3, info=InfoPersonaje(daño=75, defensa=85, ataque_especial=145), imagen="https://static.wikia.nocookie.net/es.starwars/images/7/7e/Qui-Gon_Jinn_perfil.png"),
    Personaje(id="jarjar", nombre="Jar Jar Binks", tipo="heroe", mundo_id=3, info=InfoPersonaje(daño=50, defensa=70, ataque_especial=100), imagen="https://static.wikia.nocookie.net/es.starwars/images/8/8f/Jar_Jar_Binks_perfil.png"),
    Personaje(id="nass", nombre="Jefe Nass", tipo="heroe", mundo_id=3, info=InfoPersonaje(daño=40, defensa=60, ataque_especial=70), imagen="https://static.wikia.nocookie.net/es.starwars/images/f/f3/BossNass-TatooineTrip.png"),
    Personaje(id="maul", nombre="Darth Maul", tipo="villano", mundo_id=3, info=InfoPersonaje(daño=95, defensa=75, ataque_especial=175), imagen="https://static.wikia.nocookie.net/es.starwars/images/b/b2/Darth_Maul_perfil.png"),
    Personaje(id="nute", nombre="Nute Gunray", tipo="villano", mundo_id=3, info=InfoPersonaje(daño=20, defensa=40, ataque_especial=30), imagen="https://static.wikia.nocookie.net/es.starwars/images/b/b0/Nute_Gunray_perfil.png"),
    Personaje(id="droide", nombre="Droide de Batalla", tipo="villano", mundo_id=3, info=InfoPersonaje(daño=50, defensa=30, ataque_especial=50), imagen="https://static.wikia.nocookie.net/es.starwars/images/9/9b/B1_batdroid.png"),
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