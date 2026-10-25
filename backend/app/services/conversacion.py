"""Conversación social de NOVA: saludo, nombre, ánimo, chistes y carreras.
Devuelve None cuando el mensaje es para un agente experto (brechas, DANE, vacantes...)."""
import random
import re

from ..datos import detectar_carrera
from ..utils import normalizar
from . import mercado

CHISTES = [
    "¿Por qué el currículum fue al gimnasio? Porque quería verse más competente. 😄",
    "Mi jefe me dijo que pensara fuera de la caja… pero yo soy un robot, ¡vivo en la nube! ☁️",
    "¿Qué le dijo la entrevista a la hoja de vida? Te veo en la segunda ronda. 😉",
]
SUG = ["¿Qué competencias me faltan?", "Estudio ingeniería de sistemas", "Muéstrame el desempleo en mi departamento", "Cuéntame un chiste"]


def _hay(patron: str, t: str) -> bool:
    return re.search(patron, t) is not None


async def conversar_nova(msg: str, datos: dict) -> dict | None:
    t = " " + normalizar(msg) + " "
    nombre = (datos or {}).get("nombre") or ""
    tu = f", {nombre}" if nombre else ""

    m = re.search(r"(?:me llamo|mi nombre es|dime|llámame|llamame)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ]{2,20})", msg, re.I)
    if m:
        n = m.group(1).capitalize()
        return {"texto": f"¡Mucho gusto, {n}! 🤝 Ya me acuerdo de ti. Cuéntame: ¿qué estudias o qué carrera te interesa? "
                         "Con eso te muestro tu perfil y las brechas frente al mercado.",
                "datos": {"nombre_detectado": n, "sugerencias": ["Estudio enfermería", "Quiero estudiar algo de tecnología", "No sé qué estudiar"]}}
    if not msg.strip() or _hay(r"\b(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|saludos|que mas|quiubo)\b", t):
        texto = (f"¡Hola de nuevo{tu}! 👋 Qué bueno verte. ¿Seguimos con tu ruta hacia el empleo? Puedo revisar tus brechas, "
                 "buscarte vacantes o ponerte a practicar una entrevista en realidad virtual." if nombre else
                 "¡Hola! 👋 Soy NOVA, la asistente humanoide de EmpleoTech 360 IA, de Orion Nova Technologies. "
                 "Te ayudo a descubrir qué te pide el mercado laboral y cómo conseguirlo. ¿Cómo te llamas?")
        return {"texto": texto, "datos": {"sugerencias": SUG if nombre else ["¿Qué puedes hacer?", "Estudio enfermería", "¿Qué competencias me faltan?"]}}
    if _hay(r"\b(como estas|como vas|que tal|como te va)\b", t):
        return {"texto": f"¡Muy bien{tu}, con la batería al 100% para ayudarte! ⚡ ¿Y tú cómo vas con la búsqueda de empleo o con tus estudios?",
                "datos": {"sugerencias": SUG}}
    if _hay(r"\b(quien eres|que eres|como te llamas|eres un robot|eres real)\b", t):
        return {"texto": "Soy NOVA 🤖, un humanoide de inteligencia artificial creado por Orion Nova Technologies en Neiva, Huila. "
                         "Coordino a 16 agentes expertos, y ORI, el búho, nos cuida la seguridad. Mi misión: que llegues a un "
                         "empleo real con las competencias que pide el mercado.", "datos": {"sugerencias": SUG}}
    if _hay(r"\b(que puedes hacer|ayudame|que haces|como funciona (esto|la plataforma|empleotech))\b|^\s*ayuda\s*$", t):
        return {"texto": f"Esto es lo que puedo hacer por ti{tu}:\n• Analizar tu carrera y decirte qué competencias te faltan.\n"
                         "• Mostrarte el desempleo de tu departamento o municipio con datos del DANE.\n• Armarte una ruta de cursos, gratis primero.\n"
                         "• Buscarte vacantes y decirte tu afinidad.\n• Ponerte a practicar entrevistas en realidad virtual.\n"
                         "• Con ORI, enseñarte a detectar ofertas falsas.", "datos": {"sugerencias": SUG}}
    if _hay(r"\b(gracias|muy amable|te pasaste|genial|excelente|chevere|bacano)\b", t):
        return {"texto": f"¡Con mucho gusto{tu}! 💙 Para eso estoy. ¿Te ayudo con algo más?", "datos": {"sugerencias": SUG}}
    if _hay(r"\b(chiste|hazme reir|algo gracioso)\b", t):
        return {"texto": random.choice(CHISTES), "datos": {"sugerencias": ["Otro chiste", "¿Qué competencias me faltan?"]}}
    if _hay(r"\b(adios|chao|hasta luego|nos vemos|bye)\b", t):
        return {"texto": f"¡Hasta pronto{tu}! 👋 Aquí te espero para seguir avanzando. ¡Tú puedes!", "datos": {}}
    if _hay(r"\b(triste|desanimad|deprimid|no consigo|no encuentro trabajo|frustrad|cansad|perdid)", t):
        return {"texto": f"Te entiendo{tu}. Buscar empleo cansa y es normal sentirse así. 💙 Vamos paso a paso: primero miramos tus "
                         "fortalezas, luego elegimos 2 o 3 competencias para reforzar y practicamos una entrevista. No estás solo en "
                         "esto. Si sientes que es algo más fuerte, habla con alguien de confianza o llama a la línea 106.",
                "datos": {"sugerencias": ["¿Qué competencias me faltan?", "Prepárame para una entrevista"]}}
    if _hay(r"\b(no se que estudiar|que estudio|que carrera|me recomiendas estudiar)\b", t):
        return None
    carrera = detectar_carrera(msg)
    if carrera and _hay(r"\b(estudio|estudie|carrera|soy|quiero estudiar|me gradue|egresad|perfil|profesion|programa)\b|ingenier|licenciad|tecnolog|tecnic", t):
        terr = mercado.territorios_de(datos.get("municipio"), datos.get("departamento"))
        r = await mercado.calcular_brechas([], terr, carrera)
        top = [b["competencia"] for b in r["brechas"] if b["tipo"] == "Pide el mercado"][:3]
        return {"texto": f"¡{carrera['nombre']}, buena elección{tu}! 🎓\nPerfil: {carrera['perfil']}\n"
                         f"Competencias de la carrera: {', '.join(carrera['competencias'])}.\n"
                         f"Además el mercado está pidiendo: {', '.join(top)}.\n"
                         "En Brechas y rutas marcas lo que ya dominas y te digo exactamente qué te falta.",
                "datos": {"carrera_detectada": carrera["id"],
                          "acciones": [{"label": f"Evaluar mis brechas en {carrera['nombre']}", "href": f"#/brechas?carrera={carrera['id']}"}]}}
    return None
