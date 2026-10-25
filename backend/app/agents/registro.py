from fastapi import HTTPException

from .agentes import AGENTES_17

AGENTES = {a.id: a for a in AGENTES_17}
assert len(AGENTES) == 17, "EmpleoTech 360 IA debe tener 17 agentes"


def obtener_agente(agente_id: str):
    agente = AGENTES.get(agente_id)
    if not agente:
        raise HTTPException(404, f"No existe el agente '{agente_id}'.")
    return agente
