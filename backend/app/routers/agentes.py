from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, Field

from .. import db
from ..agents import AGENTES, obtener_agente
from ..agents.base import Contexto
from ..security import analizar_mensaje, auditar, usuario_opcional

router = APIRouter(prefix="/api/agentes", tags=["Agentes IA"])


class Peticion(BaseModel):
    mensaje: str = Field("", max_length=4000)
    territorio: str = Field("Neiva", max_length=60)
    datos: dict = {}


@router.get("")
async def listar():
    return [a.ficha() for a in AGENTES.values()]


@router.post("/{agente_id}")
async def conversar(agente_id: str, p: Peticion, req: Request, u: dict | None = Depends(usuario_opcional)):
    agente = obtener_agente(agente_id)
    if agente.solo_admin and (not u or u["rol"] != "admin"):
        raise HTTPException(403, "Agente reservado a administradores.")

    # ORI SECURITY revisa cada mensaje antes de que llegue a cualquier agente
    analisis = analizar_mensaje(p.mensaje)
    if not analisis["seguro"]:
        await auditar("prompt_injection", analisis["riesgo"], u["id"] if u else None,
                      req.client.host if req.client else None, agente=agente_id, hallazgos=analisis["hallazgos"])
        return {"agente": "ori", "nombre": "ORI SECURITY", "bloqueado": True, "datos": analisis,
                "texto": "🦉 ORI SECURITY bloqueó este mensaje porque parece un intento de manipular a los agentes. "
                         "Reformula tu pregunta, por favor."}

    perfil = {}
    if u:
        perfil = await db.fetchone("select * from perfiles where usuario_id = %s", u["id"]) or {}
    ctx = Contexto(usuario=u, perfil=perfil, territorio=p.territorio, datos=p.datos)
    respuesta = await agente.ejecutar(ctx, p.mensaje)

    if u and p.mensaje:
        await db.execute("insert into conversaciones (usuario_id, agente, rol, contenido) values (%s,%s,'usuario',%s),(%s,%s,'agente',%s)",
                         u["id"], respuesta["agente"], p.mensaje, u["id"], respuesta["agente"], respuesta["texto"][:4000])
    return respuesta
