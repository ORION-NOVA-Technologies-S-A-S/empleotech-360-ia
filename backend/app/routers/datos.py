"""Analítica de datos: DANE, brechas, rutas, vacantes, VR y panel de ORI."""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from .. import db
from ..datos import carrera_por_id, carreras, departamentos
from ..security import requiere_rol, usuario_actual
from ..services import mercado

router = APIRouter(prefix="/api", tags=["Datos y analítica"])


class Consulta(BaseModel):
    competencias: list[str] = Field(default_factory=list, max_length=60)
    carrera_id: str | None = Field(None, max_length=80)
    departamento: str | None = Field(None, max_length=60)
    municipio: str | None = Field(None, max_length=60)
    territorio: str | None = Field(None, max_length=60)


def _territorios(c: Consulta) -> list[str]:
    return mercado.territorios_de(c.municipio, c.departamento, c.territorio)


@router.get("/carreras")
async def listar_carreras():
    return carreras()


@router.get("/territorios")
async def listar_territorios():
    return departamentos()


@router.get("/dane/consulta")
async def dane(departamento: str | None = None, municipio: str | None = None):
    return await mercado.consulta_dane(departamento, municipio)


@router.get("/mercado/demanda")
async def demanda(territorio: str = "Nacional"):
    return await mercado.demanda_lista(mercado.territorios_de(territorio=territorio))


@router.post("/brechas")
async def brechas(c: Consulta):
    carrera = carrera_por_id(c.carrera_id)
    if c.carrera_id and not carrera:
        raise HTTPException(404, "Carrera no encontrada.")
    r = await mercado.calcular_brechas(c.competencias, _territorios(c), carrera)
    r["ruta"] = await mercado.ruta_para(r["brechas"])
    return r


@router.post("/vacantes/emparejar")
async def vacantes(c: Consulta):
    return await mercado.emparejar_vacantes(c.competencias, _territorios(c))


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
