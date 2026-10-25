from dataclasses import dataclass, field
from typing import Any

from ..services.llm import generar
from ..utils import normalizar  # noqa: F401


@dataclass
class Contexto:
    usuario: dict | None = None            # {"id", "rol"} o None si es visitante
    perfil: dict = field(default_factory=dict)
    territorio: str = "Neiva"
    datos: dict[str, Any] = field(default_factory=dict)  # datos extra que envía el frontend

    @property
    def territorios(self) -> list[str]:
        return [t for t in (self.datos.get("municipio"), self.datos.get("departamento"), self.territorio, "Nacional") if t]

    @property
    def competencias(self) -> list[str]:
        comp = self.datos.get("competencias") or self.perfil.get("competencias") or []
        return [c.strip() for c in comp if c and c.strip()]


class Agente:
    id: str = ""
    nombre: str = ""
    area: str = "Inteligencia artificial"   # Inteligencia artificial | Ciberseguridad | Analítica | Realidad virtual | IoT
    icono: str = "🤖"
    descripcion: str = ""
    sistema: str = ""                       # instrucciones para el modelo de IA
    solo_admin: bool = False

    async def preparar(self, ctx: Contexto, mensaje: str) -> tuple[str, dict, str]:
        """Devuelve (respuesta_por_reglas, datos_estructurados, contexto_para_IA)."""
        return "Estoy listo para ayudarte.", {}, ""

    async def ejecutar(self, ctx: Contexto, mensaje: str) -> dict:
        texto, datos, contexto_ia = await self.preparar(ctx, mensaje)
        usa_ia = False
        if self.sistema and mensaje.strip():
            ia = await generar(self.sistema, mensaje, contexto_ia or texto)
            if ia:
                texto, usa_ia = ia, True
        return {"agente": self.id, "nombre": self.nombre, "texto": texto, "datos": datos, "ia_generativa": usa_ia}

    def ficha(self) -> dict:
        return {"id": self.id, "nombre": self.nombre, "area": self.area, "icono": self.icono,
                "descripcion": self.descripcion, "solo_admin": self.solo_admin}

