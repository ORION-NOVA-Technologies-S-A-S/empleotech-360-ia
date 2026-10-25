"""Analítica del mercado laboral: DANE por territorio, brechas por carrera, rutas y vacantes."""
from .. import db
from ..utils import normalizar


def territorios_de(municipio: str | None = None, departamento: str | None = None, territorio: str | None = None) -> list[str]:
    return [t for t in (municipio, departamento, territorio, "Nacional") if t]


async def demanda(territorios: list[str]) -> dict[str, dict]:
    """Índice de demanda por competencia: se toma el mayor entre los territorios dados."""
    filas = await db.fetch(
        """select competencia, max(sector) as sector, max(demanda) as demanda, max(tendencia) as tendencia
           from competencias_demandadas where territorio = any(%s)
           group by competencia order by max(demanda) desc""", territorios)
    return {f["competencia"]: {"sector": f["sector"], "demanda": float(f["demanda"]), "tendencia": float(f["tendencia"])} for f in filas}


async def demanda_lista(territorios: list[str]) -> list[dict]:
    return [{"competencia": c, **d, "es_ejemplo": True} for c, d in (await demanda(territorios)).items()]


async def calcular_brechas(competencias: list[str], territorios: list[str], carrera: dict | None = None) -> dict:
    """Con carrera: perfil de la carrera + lo que pide el mercado + transversales.
    Sin carrera: toda la demanda del territorio."""
    dem = await demanda(territorios)
    propias = {normalizar(c) for c in competencias}
    if carrera:
        vistos, objetivo = set(), []
        for lista, peso, tipo in ((carrera["competencias"], 1.0, "De la carrera"),
                                  (carrera["mercado"], 1.2, "Pide el mercado"),
                                  (carrera["transversales"], 0.8, "Transversal")):
            for c in lista:
                if c not in vistos:
                    vistos.add(c); objetivo.append((c, peso, tipo))
    else:
        objetivo = [(c, 1.0, "Demanda general") for c in dem]
    filas = []
    for comp, peso, tipo in objetivo:
        d = dem.get(comp)
        indice = d["demanda"] if d else 60
        filas.append({"competencia": comp, "tipo": tipo, "peso": peso,
                      "demanda": d["demanda"] if d else None, "tendencia": d["tendencia"] if d else None,
                      "prioridad": round(indice * peso + 0.5 * (d["tendencia"] if d else 0), 1)})
    tiene = [f for f in filas if normalizar(f["competencia"]) in propias]
    faltan = sorted((f for f in filas if normalizar(f["competencia"]) not in propias), key=lambda x: x["prioridad"], reverse=True)
    total = sum(f["prioridad"] for f in filas) or 1
    return {"carrera": {k: carrera[k] for k in ("id", "nombre", "nivel", "perfil", "sector")} if carrera else None,
            "territorio": territorios[0], "cobertura": round(100 * sum(f["prioridad"] for f in tiene) / total, 1),
            "tiene": tiene, "brechas": faltan, "es_ejemplo": True}


async def ruta_para(brechas: list[dict], limite: int = 6) -> list[dict]:
    ruta = []
    for b in brechas[:limite]:
        cursos = await db.fetch(
            """select id, titulo, nivel, horas, modalidad, proveedor, url, gratuito
               from cursos where competencia = %s
               order by gratuito desc, case nivel when 'básico' then 1 when 'intermedio' then 2 else 3 end""",
            b["competencia"])
        if not cursos:
            cursos = [{"id": "academia-" + normalizar(b["competencia"]), "titulo": f"{b['competencia']} en Orion Nova Academy",
                       "nivel": "básico", "horas": 30, "modalidad": "virtual", "proveedor": "Orion Nova Academy",
                       "url": "https://academy.orionnovatechnologies.com", "gratuito": True, "sugerido": True}]
        ruta.append({"competencia": b["competencia"], "prioridad": b["prioridad"], "cursos": cursos})
    return ruta


async def emparejar_vacantes(competencias: list[str], territorios: list[str]) -> list[dict]:
    propias = {normalizar(c) for c in competencias}
    vacantes = await db.fetch(
        """select id, titulo, empresa, territorio, sector, competencias, salario_min, salario_max,
                  modalidad, url, es_ejemplo
           from vacantes where activa and territorio = any(%s)""", territorios + ["Huila", "Remoto"])
    res = []
    for v in vacantes:
        req = v["competencias"] or []
        coinciden = [c for c in req if normalizar(c) in propias]
        res.append({**v, "afinidad": round(100 * len(coinciden) / len(req)) if req else 0, "coinciden": coinciden,
                    "faltan": [c for c in req if c not in coinciden],
                    "salario_min": float(v["salario_min"] or 0), "salario_max": float(v["salario_max"] or 0)})
    return sorted(res, key=lambda x: x["afinidad"], reverse=True)


def _fila(f: dict) -> dict:
    return {**f, "valor": float(f["valor"]), "periodo": f["periodo"].isoformat()}


async def consulta_dane(departamento: str | None, municipio: str | None) -> dict:
    """Indicadores oficiales: nacional + departamento + municipio, con avisos de cobertura."""
    cols = "periodo, periodo_nombre, nivel, territorio, departamento, grupo, indicador, valor, unidad, fuente, url, nota, es_ejemplo"
    nacional = [_fila(f) for f in await db.fetch(f"select {cols} from indicadores_dane where nivel='Nacional' order by periodo desc")]
    dep = [_fila(f) for f in await db.fetch(
        f"select {cols} from indicadores_dane where nivel='Departamento' and territorio=%s order by periodo desc", departamento)] if departamento else []
    mun = [_fila(f) for f in await db.fetch(
        f"select {cols} from indicadores_dane where nivel='Municipio' and territorio=%s and departamento=%s order by periodo desc",
        municipio, departamento)] if municipio else []
    avisos = []
    if departamento and not dep and departamento != "Bogotá D.C.":
        avisos.append(f"El DANE no publica cifras anuales de {departamento} en su boletín por departamentos (solo cubre 23). "
                      "Se muestran las cifras nacionales como referencia.")
    if municipio and not mun:
        avisos.append(f"El DANE publica el desempleo municipal solo para 23 ciudades y áreas metropolitanas. {municipio} no está "
                      f"entre ellas, así que se usan las cifras {'de ' + departamento if dep else 'nacionales'}.")
    ultimo_dep = await db.fetch("""select distinct on (territorio) territorio, valor from indicadores_dane
                                   where nivel='Departamento' and indicador='TD' and grupo='Total' order by territorio, periodo desc""")
    ultimo_mun = await db.fetch("""select distinct on (territorio, departamento) territorio, departamento, valor, nota from indicadores_dane
                                   where nivel='Municipio' and indicador='TD' and grupo='Total' order by territorio, departamento, periodo desc""")
    return {"nacional": nacional, "departamento": dep, "municipio": mun, "avisos": avisos,
            "ranking": sorted(({"territorio": r["territorio"], "valor": float(r["valor"])} for r in ultimo_dep), key=lambda x: -x["valor"]),
            "ciudades": sorted(({**r, "valor": float(r["valor"])} for r in ultimo_mun), key=lambda x: -x["valor"])}


def valor(filas: list[dict], indicador: str, grupo: str = "Total") -> dict | None:
    return next((f for f in filas if f["indicador"] == indicador and f["grupo"] == grupo), None)


def pct(f: dict | None) -> str:
    return f"{f['valor']:g}%".replace(".", ",") if f else "—"


AVISO_DEMANDA = " (El índice de demanda por competencia es de EJEMPLO hasta conectar fuentes de vacantes.)"
