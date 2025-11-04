import pytest
import random
from unittest.mock import patch, MagicMock
from src.Guerras_Clon.api.schemas.star_wars_models import Personaje, InfoPersonaje
from src.Guerras_Clon.services.battle_service import AtaqueNormal, AtaqueEspecial, HabilidadFactory



@pytest.fixture
def heroe_atacante():
    """Un héroe genérico para atacar."""
    return Personaje(
        id="luke", nombre="Luke", tipo="heroe", mundo_id=1,
        info=InfoPersonaje(daño=100, defensa=500, ataque_especial=200),
        imagen="luke.png"
    )


@pytest.fixture
def villano_defensor():
    """Un villano genérico para defender."""
    return Personaje(
        id="vader", nombre="Vader", tipo="villano", mundo_id=2,
        info=InfoPersonaje(daño=100, defensa=750, ataque_especial=200),
        imagen="vader.png"
    )


# --- Tests para Habilidades ---

def test_ataque_normal_calculo_daño(heroe_atacante, villano_defensor):
    """
    Prueba el cálculo de daño de AtaqueNormal, mockeando la aleatoriedad.
    """
    ataque = AtaqueNormal()

    with patch('random.uniform', return_value=1.0), \
            patch.object(AtaqueNormal, '_calcular_esquivar', return_value=False):
        daño_esperado = 100 - (750 // 25)
        daño, log = ataque.ejecutar(heroe_atacante, villano_defensor)

        assert daño == daño_esperado
        assert log == "Luke ataca a Vader y causa 70 de daño."


def test_ataque_especial_calculo_daño(heroe_atacante, villano_defensor):
    """
    Prueba el cálculo de daño de AtaqueEspecial, mockeando la aleatoriedad.
    """
    ataque = AtaqueEspecial()

    with patch('random.uniform', return_value=1.0), \
            patch.object(AtaqueEspecial, '_calcular_esquivar', return_value=False):
        daño_esperado = 170
        daño, log = ataque.ejecutar(heroe_atacante, villano_defensor)

        assert daño == daño_esperado
        assert log == "Luke usa su habilidad especial contra Vader y causa 170 de daño."


def test_habilidad_esquivada(heroe_atacante, villano_defensor):
    """
    Prueba que la lógica de esquivar funcione.
    """
    ataque = AtaqueNormal()

    with patch.object(AtaqueNormal, '_calcular_esquivar', return_value=True):
        daño, log = ataque.ejecutar(heroe_atacante, villano_defensor)

        assert daño == 0
        assert log == "Vader ha esquivado el ataque!"



def test_habilidad_factory_exito():
    """Prueba que la factory devuelva las instancias correctas."""
    factory = HabilidadFactory()

    ataque_normal = factory.get_habilidad("ataque_normal")
    assert isinstance(ataque_normal, AtaqueNormal)

    ataque_especial = factory.get_habilidad("ataque_especial")
    assert isinstance(ataque_especial, AtaqueEspecial)


def test_habilidad_factory_falla():
    """Prueba que la factory lance un error si la habilidad no existe."""
    factory = HabilidadFactory()

    with pytest.raises(ValueError, match="Habilidad 'ataque_laser' desconocida."):
        factory.get_habilidad("ataque_laser")