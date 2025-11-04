import pytest
from src.Guerras_Clon.services import swapi_service
from src.Guerras_Clon.api.schemas.star_wars_models import Mundo, Personaje


@pytest.mark.asyncio
async def test_obtener_mundos_clon():
    """Prueba que se devuelva la lista de mundos."""
    mundos = await swapi_service.obtener_mundos_clon()

    assert isinstance(mundos, list)
    assert len(mundos) == 3
    assert isinstance(mundos[0], Mundo)
    assert mundos[0].nombre == "Tatooine"


@pytest.mark.asyncio
@pytest.mark.parametrize("mundo_id, num_heroes, num_villanos, primer_heroe_nombre", [
    (1, 3, 3, "Luke Skywalker"),
    (2, 3, 3, "Princess Leia (Hoth)"),
    (3, 3, 3, "Wicket W. Warrick"),
    (99, 0, 0, None)
])
async def test_obtener_personajes_por_mundo(mundo_id, num_heroes, num_villanos, primer_heroe_nombre):
    """Prueba que se filtren los personajes correctamente por mundo."""
    personajes = await swapi_service.obtener_personajes_por_mundo(mundo_id)

    assert "heroes" in personajes
    assert "villanos" in personajes
    assert len(personajes["heroes"]) == num_heroes
    assert len(personajes["villanos"]) == num_villanos

    if primer_heroe_nombre:
        assert personajes["heroes"][0].nombre == primer_heroe_nombre


@pytest.mark.asyncio
async def test_get_character_by_id():
    """Prueba la búsqueda de personajes por ID."""

    luke = await swapi_service.get_character_by_id("luke")
    assert luke is not None
    assert isinstance(luke, Personaje)
    assert luke.nombre == "Luke Skywalker"

    jarjar = await swapi_service.get_character_by_id("jarjar")
    assert jarjar is None


@pytest.mark.asyncio
async def test_get_all_characters():
    """Prueba que devuelva todos los personajes."""
    todos = await swapi_service.get_all_characters()
    assert isinstance(todos, list)
    assert len(todos) > 0  # Basado en tus datos, hay 18
    assert len(todos) == 18