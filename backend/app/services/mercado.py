"""Lógica de analítica del mercado laboral: brechas, rutas y emparejamiento."""
from .. import db
from ..utils import normalizar


async def demanda_territorio(territorio: str) -> list[dict]:
    """Competencias demandadas en el territorio + nacional (se toma el mayor índice)."""
    filas = await db.fetch(
        """select competencia, max(sector) as sector, max(demanda) as demanda,
                  max(tendencia) as tendencia, bool_or(es_ejemplo) as es_ejemplo
           from competencias_demandadas
           where territorio in (%s, 'Huila', 'Nacional')
           group by competencia order by max(demanda) desc""", territorio)
    return [{**f, "demanda": float(f["demanda"]), "tendencia": float(f["tendencia"])} for f in filas]


async def calcular_brechas(competencias: list[str], territorio: str) -> dict:
    demanda = await demanda_territorio(territorio)
    propias = {normalizar(c) for c in competencias}
    tiene, faltan = [], []
    for d in demanda:
        (tiene if normalizar(d["competencia"]) in propias else faltan).append(d)
    total = sum(d["demanda"] for d in demanda) or 1
    cobertura = round(100 * sum(d["demanda"] for d in tiene) / total, 1)
    for f in faltan:
        f["prioridad"] = round(f["demanda"] + 0.5 * f["tendencia"], 1)
    faltan.sort(key=lambda x: x["prioridad"], reverse=True)
    return {"territorio": territorio, "cobertura": cobertura, "tiene": tiene,
            "brechas": faltan, "es_ejemplo": any(d["es_ejemplo"] for d in demanda)}


async def ruta_para(brechas: list[dict], limite: int = 5) -> list[dict]:
    ruta = []
    for b in brechas[:limite]:
        cursos = await db.fetch(
            """select id, titulo, nivel, horas, modalidad, proveedor, url, gratuito
               from cursos where competencia = %s
               order by gratuito desc, case nivel when 'básico' then 1 when 'intermedio' then 2 else 3 end""",
            b["competencia"])
        ruta.append({"competencia": b["competencia"], "prioridad": b["prioridad"], "cursos": cursos})
    return ruta


async def emparejar_vacantes(competencias: list[str], territorio: str) -> list[dict]:
    propias = {normalizar(c) for c in competencias}
    vacantes = await db.fetch(
        """select id, titulo, empresa, territorio, sector, competencias, salario_min, salario_max,
                  modalidad, url, es_ejemplo
           from vacantes where activa and territorio in (%s, 'Huila', 'Remoto')""", territorio)
    res = []
    for v in vacantes:
        req = v["competencias"] or []
        coinciden = [c for c in req if normalizar(c) in propias]
        afinidad = round(100 * len(coinciden) / len(req)) if req else 0
        res.append({**v, "afinidad": afinidad, "coinciden": coinciden,
                    "faltan": [c for c in req if c not in coinciden],
                    "salario_min": float(v["salario_min"] or 0), "salario_max": float(v["salario_max"] or 0)})
    return sorted(res, key=lambda x: x["afinidad"], reverse=True)


async def indicadores(territorio: str) -> list[dict]:
    filas = await db.fetch(
        """select periodo, territorio, grupo, indicador, valor, unidad, fuente, es_ejemplo
           from indicadores_dane where territorio in (%s, 'Nacional')
           order by periodo, territorio, grupo""", territorio)
    return [{**f, "valor": float(f["valor"]), "periodo": f["periodo"].isoformat()} for f in filas]


def texto_aviso_ejemplo(es_ejemplo: bool) -> str:
    return (" (Atención: son datos de EJEMPLO; el administrador debe cargar las fuentes oficiales.)"
            if es_ejemplo else "")
