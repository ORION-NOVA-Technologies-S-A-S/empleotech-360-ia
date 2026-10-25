"""Revisión de hoja de vida: competencias encontradas, qué fortalecer para el mercado y cómo mejorarla."""
import re

from ..datos import carrera_por_id, detectar_carrera, grupo_de
from ..utils import normalizar

SINONIMOS_CV = {"python": "Lenguajes de programación", "javascript": "Lenguajes de programación", "java": "Lenguajes de programación",
                "react": "Lenguajes de programación", "c#": "Lenguajes de programación", "php": "Lenguajes de programación",
                "sql": "Bases de datos SQL", "mysql": "Bases de datos SQL", "postgres": "Bases de datos SQL", "excel": "Excel avanzado",
                "power bi": "Power BI", "ingles": "Inglés B1+", "english": "Inglés B1+", "atencion al cliente": "Servicio al cliente",
                "ventas": "Ventas", "redes sociales": "Marketing digital", "aws": "Computación en la nube", "azure": "Computación en la nube",
                "docker": "DevOps", "git": "Ingeniería de software", "scrum": "Metodologías ágiles", "arduino": "IoT y electrónica",
                "autocad": "Diseño CAD", "trabajo en equipo": "Trabajo en equipo", "liderazgo": "Comunicación asertiva", "siigo": "Software contable",
                "contabilidad": "Contabilidad básica", "contable": "Contabilidad básica", "auditoria": "Auditoría"}
SECCIONES = [("Perfil profesional", r"perfil|resumen|acerca de mi|sobre mi|objetivo"),
             ("Experiencia laboral", r"experiencia|laboral|empresa|cargo"),
             ("Formación académica", r"formacion|educacion|estudios|universidad|sena|bachiller|tecnolog"),
             ("Habilidades", r"habilidades|competencias|conocimientos|herramientas"),
             ("Idiomas", r"idioma|ingles|english"),
             ("Datos de contacto", r"@|telefono|celular|\b3\d{9}\b|\b3\d{2} \d{3} \d{4}\b")]
TOP_GENERAL = ["Inteligencia artificial", "Análisis de datos", "Lenguajes de programación", "Ciberseguridad", "Inglés B1+",
               "Comunicación asertiva", "Trabajo en equipo", "Excel avanzado", "Servicio al cliente", "Marketing digital"]


def analizar(texto: str, carrera_id: str | None = None) -> dict:
    t = " " + normalizar(texto) + " "
    encontradas = {c for c in grupo_de() if normalizar(c) in t}
    encontradas |= {v for k, v in SINONIMOS_CV.items() if k in t}
    carrera = carrera_por_id(carrera_id) or detectar_carrera(texto)
    faltan_secciones = [n for n, patron in SECCIONES if not re.search(patron, t)]
    logros = len(re.findall(r"\d+\s?%|\$\s?\d|\d+\s?(clientes|ventas|proyectos|personas|usuarios)", texto, re.I))
    palabras = len(texto.split())
    mejorar = []
    if faltan_secciones:
        mejorar.append(f"Agrega estas secciones: {', '.join(faltan_secciones)}.")
    if not logros:
        mejorar.append("Escribe logros medibles (por ejemplo: aumenté las ventas un 15 % o atendí 40 clientes al día).")
    if palabras < 150:
        mejorar.append("Tu hoja de vida es muy corta; describe mejor tus funciones y resultados.")
    if palabras > 900:
        mejorar.append("Es muy larga; resúmela en 1 o 2 páginas.")
    if not re.search(r"linkedin|github|portafolio|portfolio", t):
        mejorar.append("Incluye un enlace a LinkedIn, GitHub o portafolio.")
    objetivo = (carrera["competencias"] + carrera["mercado"] + carrera["transversales"]) if carrera else TOP_GENERAL
    fortalecer = [c for c in dict.fromkeys(objetivo) if c not in encontradas]
    puntaje = round(100 - len(faltan_secciones) * 8 - (0 if logros else 12) - len(fortalecer) * 3 + min(len(encontradas), 10) * 2)
    return {"puntaje": max(10, min(100, puntaje)), "carrera": {"id": carrera["id"], "nombre": carrera["nombre"]} if carrera else None,
            "encontradas": sorted(encontradas), "fortalecer": fortalecer, "mejorar": mejorar, "palabras": palabras}
