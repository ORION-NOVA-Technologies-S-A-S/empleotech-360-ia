"""Analítica de datos: DANE, brechas, rutas, vacantes, VR y panel de ORI."""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from .. import db
from ..security import requiere_rol, usuario_actual
from ..services import mercado

router = APIRouter(prefix="/api", tags=["Datos y analítica"])


class Competencias(BaseModel):
    competencias: list[str] = []
    territorio: str = "Neiva"


@router.get("/dane/indicadores")
async def indicadores(territorio: str = "Neiva"):
    return await mercado.indicadores(territorio)


@router.get("/mercado/demanda")
async def demanda(territorio: str = "Neiva"):
    return await mercado.demanda_territorio(territorio)


@router.post("/brechas")
async def brechas(c: Competencias):
    r = await mercado.calcular_brechas(c.competencias, c.territorio)
    r["ruta"] = await mercado.ruta_para(r["brechas"])
    return r


@router.post("/vacantes/emparejar")
async def vacantes(c: Competencias):
    return await mercado.emparejar_vacantes(c.competencias, c.territorio)


@router.get("/cursos")
async def cursos():
    return await db.fetch("select * from cursos order by competencia, nivel")


class SesionVR(BaseModel):
    escenario: str = Field(max_length=40)
    puntaje: float = Field(ge=0, le=100)
    duracion_seg: int = Field(ge=0, le=7200)


@router.post("/vr/sesiones")
async def guardar_vr(s: SesionVR, u: dict = Depends(usuario_actual)):
    await db.execute("insert into vr_sesiones (usuario_id, escenario, puntaje, duracion_seg) values (%s,%s,%s,%s)",
                     u["id"], s.escenario, s.puntaje, s.duracion_seg)
    return {"ok": True}


@router.get("/seguridad/eventos")
async def eventos(_: dict = Depends(requiere_rol("admin"))):
    return await db.fetch("""select id, usuario_id::text, evento, severidad, detalle, ip, creado_en
                             from auditoria_seguridad order by creado_en desc limit 200""")
