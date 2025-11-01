import random
from abc import ABC, abstractmethod
from src.Guerras_Clon.api.schemas.star_wars_models import Personaje


class Habilidad(ABC):
    def __init__(self, nombre: str, probabilidad_esquivar: float = 0.25):
        self.nombre = nombre
        self.probabilidad_esquivar = probabilidad_esquivar

    @abstractmethod
    def ejecutar(self, atacante: Personaje, defensor: Personaje) -> (int, str):
        pass

    def _calcular_esquivar(self) -> bool:
        return random.random() < self.probabilidad_esquivar


class AtaqueNormal(Habilidad):
    def __init__(self):
        super().__init__(nombre="Ataque Normal")

    def ejecutar(self, atacante: Personaje, defensor: Personaje) -> (int, str):
        if self._calcular_esquivar():
            return 0, f"{defensor.nombre} ha esquivado el ataque!"

        daño_base = atacante.info.daño - (defensor.info.defensa // 25)
        daño_final = max(1, int(daño_base * random.uniform(0.85, 1.15)))

        return daño_final, f"{atacante.nombre} ataca a {defensor.nombre} y causa {daño_final} de daño."


class AtaqueEspecial(Habilidad):
    def __init__(self):
        super().__init__(nombre="Ataque Especial")

    def ejecutar(self, atacante: Personaje, defensor: Personaje) -> (int, str):
        if self._calcular_esquivar():
            return 0, f"{defensor.nombre} ha esquivado el ataque especial!"


        daño_base = atacante.info.ataque_especial - (defensor.info.defensa // 25)
        daño_final = max(1, int(daño_base * random.uniform(0.85, 1.15)))

        return daño_final, f"{atacante.nombre} usa su habilidad especial contra {defensor.nombre} y causa {daño_final} de daño."


class HabilidadFactory:

    def __init__(self):
        self._habilidades = {
            "ataque_normal": AtaqueNormal,
            "ataque_especial": AtaqueEspecial
        }

    def get_habilidad(self, nombre_habilidad: str) -> Habilidad:
        habilidad_clase = self._habilidades.get(nombre_habilidad)
        if not habilidad_clase:
            raise ValueError(f"Habilidad '{nombre_habilidad}' desconocida.")
        return habilidad_clase()


factory_habilidades = HabilidadFactory()

