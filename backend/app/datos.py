"""Catálogos en JSON compartidos con el frontend (database/datos):
carreras con su perfil, departamentos y municipios de Colombia."""
import json
import os
import re
from functools import lru_cache
from pathlib import Path

from .utils import normalizar

DATOS_DIR = Path(os.getenv("DATOS_DIR", Path(__file__).resolve().parents[2] / "database" / "datos"))


@lru_cache
def carreras() -> list[dict]:
    return json.loads((DATOS_DIR / "carreras.json").read_text(encoding="utf-8"))


@lru_cache
def departamentos() -> list[dict]:
    return json.loads((DATOS_DIR / "territorios.json").read_text(encoding="utf-8"))["departamentos"]


def carrera_por_id(cid: str | None) -> dict | None:
    return next((c for c in carreras() if c["id"] == cid), None) if cid else None


_VACIAS = {"ingenieria", "tecnologia", "tecnico", "en", "de", "y", "del", "la", "el", "licenciatura",
           "los", "las", "productos", "servicios", "gestion"}


def _tokens(s: str) -> list[str]:
    return [w for w in re.split(r"[^a-z0-9]+", normalizar(s).replace("(", " ").replace(")", " "))
            if len(w) > 2 and w not in _VACIAS]


def detectar_carrera(texto: str) -> dict | None:
    t = " " + normalizar(texto) + " "
    mejor, puntos = None, 0.0
    for c in carreras():
        tk = _tokens(c["nombre"])
        if not tk:
            continue
        hits = sum(1 for w in tk if re.search(rf"\b{w}", t))
        s = hits / len(tk) + hits * 0.1
        if normalizar(c["nombre"]) in t:
            s += 0.4 * len(tk)
        if re.search(r"tecnolog", t) and c["nivel"] == "Tecnólogo":
            s += 0.5
        if re.search(r"tecnic|auxiliar", t) and c["nivel"] == "Técnico":
            s += 0.5
        if c["nivel"] == "Profesional":
            s += 0.01
        if hits and s > puntos:
            mejor, puntos = c, s
    return mejor if puntos >= 0.99 else None


def _con_borde(t: str, nombre: str) -> bool:
    return re.search(rf"(^|[^a-z]){re.escape(normalizar(nombre))}([^a-z]|$)", t) is not None


def detectar_territorio(texto: str, dep_actual: str | None = None, mun_actual: str | None = None) -> tuple[str | None, str | None]:
    t = normalizar(texto)
    dep = next((d["departamento"] for d in departamentos() if _con_borde(t, d["departamento"])), None)
    mun = None
    for d in (x for x in departamentos() if not dep or x["departamento"] == dep):
        cands = sorted((m for m in d["municipios"] if len(m) > 4 and _con_borde(t, m)), key=len, reverse=True)
        if cands and not (cands[0] == d["departamento"] and dep):
            mun, dep = cands[0], d["departamento"]
            break
    return (dep or (None if mun else dep_actual)), (mun or (None if dep else mun_actual))


ACADEMIA = "https://academy.orionnovatechnologies.com"


@lru_cache
def lecciones() -> dict[str, list[str]]:
    return json.loads((DATOS_DIR / "lecciones.json").read_text(encoding="utf-8"))


@lru_cache
def grupo_de() -> dict[str, str]:
    g = json.loads((DATOS_DIR / "grupos_competencias.json").read_text(encoding="utf-8"))["grupos"]
    return {c: grupo for grupo, lista in g.items() for c in lista}


def agrupar(competencias: list[str]) -> dict[str, list[str]]:
    out: dict[str, list[str]] = {}
    for c in competencias:
        out.setdefault(grupo_de().get(c, "Otras competencias"), []).append(c)
    return out
