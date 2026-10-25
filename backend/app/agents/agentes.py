"""Los 17 agentes de inteligencia artificial de EmpleoTech 360 IA."""
import re

from .. import db
from ..security import analizar_mensaje
from ..datos import ACADEMIA, agrupar, carrera_por_id, carreras, detectar_territorio, lecciones
from ..services import hoja_vida
from ..services import mercado
from ..services.conversacion import conversar_nova
from ..utils import normalizar
from .base import Agente, Contexto


# 1 ─────────────────────────────────────────────────────────────── NOVA
class Nova(Agente):
    id, nombre, icono = "nova", "NOVA · Asistente humanoide", "🤖"
    area = "Inteligencia artificial"
    descripcion = "Conversa contigo, te recuerda y te lleva al agente experto que necesitas."
    sistema = ("Eres NOVA, la asistente humanoide de EmpleoTech 360 IA de Orion Nova Technologies. "
               "Eres cálida, motivadora y concreta. Ayudas a jóvenes colombianos a encontrar empleo.")

    RUTAS = [
        (r"\bclase\b|ens[eé][nñ]ame sobre", "tutor"),
        (r"hoja de vida|curr[ií]cul", "hoja_vida"),
        (r"brecha|me falta|qu[eé] necesito|competencias? (pide|piden|demanda)", "brechas"),
        (r"dane|desempleo|ocupaci[oó]n|informalidad|ninis?|estad[ií]stica", "dane"),
        (r"vocaci|qu[eé] estudiar|no s[eé] qu[eé]|me gusta", "orientador"),
        (r"vacante|empleo|trabajo|oferta|contrat", "vacantes"),
        (r"ruta|aprender|estudiar|curso|capacitar", "rutas"),
        (r"entrevista", "entrevistas"),
        (r"hoja de vida|cv|curr[ií]cul", "hoja_vida"),
        (r"evaluar|examen|test|prueba", "evaluador"),
        (r"tendencia|futuro|crece", "tendencias"),
        (r"realidad virtual|vr|simulaci", "vr"),
        (r"iot|sensor|dispositivo|kiosco", "iot"),
        (r"segur|hack|estafa|phishing|contrase", "ori"),
        (r"blandas|comunicaci|liderazgo|equipo", "blandas"),
        (r"clase|explica|qu[eé] es|c[oó]mo funciona|ens[eé][nñ]ame|aprender sobre", "tutor"),
        (r"emprend|negocio propio", "orientador"),
    ]

    async def ejecutar(self, ctx: Contexto, mensaje: str) -> dict:
        from .registro import obtener_agente
        social = await conversar_nova(mensaje, ctx.datos)
        if social:
            return {"agente": self.id, "nombre": self.nombre, "texto": social["texto"], "datos": social["datos"], "ia_generativa": False}
        destino = next((a for p, a in self.RUTAS if re.search(p, mensaje, re.I)), None)
        if destino:
            r = await obtener_agente(destino).ejecutar(ctx, mensaje)
            r["derivado_por"] = "nova"
            return r
        return await super().ejecutar(ctx, mensaje)

    async def preparar(self, ctx, mensaje):
        nombre = ctx.datos.get("nombre")
        return (f"Mmm, no estoy segura de haberte entendido{', ' + nombre if nombre else ''}. 🤔 Puedes contarme qué estudias, "
                "preguntarme por el desempleo de tu departamento, pedirme vacantes o una ruta de cursos.",
                {"sugerencias": ["¿Qué puedes hacer?", "Estudio ingeniería de sistemas", "Desempleo en el Huila", "Búscame vacantes"]}, "")


# 2 ───────────────────────────────────────────────────────── ORI SECURITY
class OriSecurity(Agente):
    id, nombre, icono = "ori", "ORI SECURITY · Ciberseguridad", "🦉"
    area = "Ciberseguridad"
    descripcion = "Protege la plataforma y enseña a los jóvenes a detectar ofertas falsas y fraudes."
    sistema = ("Eres ORI, el búho de ciberseguridad de Orion Nova Technologies. Enseñas a jóvenes a "
               "reconocer ofertas de empleo falsas, phishing y a cuidar sus datos.")

    async def preparar(self, ctx, mensaje):
        analisis = analizar_mensaje(mensaje)
        senales = [s for s in ["pago", "consigna", "adelanto", "whatsapp", "urgente", "sin experiencia gana"]
                   if s in normalizar(mensaje)]
        datos = {"analisis_mensaje": analisis, "senales_fraude": senales}
        if ctx.usuario and ctx.usuario.get("rol") == "admin":
            datos["eventos_24h"] = await db.fetch(
                """select severidad, count(*)::int as total from auditoria_seguridad
                   where creado_en > now() - interval '24 hours' group by severidad""")
        consejos = ("🦉 Reglas de ORI para buscar empleo seguro:\n"
                    "1. Ninguna empresa seria te cobra por entrevistarte, capacitarte o contratarte.\n"
                    "2. Desconfía de salarios muy altos sin experiencia y de la prisa.\n"
                    "3. Verifica la empresa en el RUES y que el correo sea de su dominio.\n"
                    "4. Nunca envíes fotos de tu cédula ni claves por chat.\n"
                    "5. Usa contraseñas largas y activa la verificación en dos pasos.")
        if senales:
            consejos = f"⚠️ Detecté señales de posible fraude: {', '.join(senales)}.\n\n" + consejos
        return consejos, datos, consejos


# 3 ───────────────────────────────────────────────────────── Analista DANE
class AnalistaDane(Agente):
    id, nombre, icono = "dane", "Analista DANE del mercado laboral", "📊"
    area = "Analítica"
    descripcion = "Explica los indicadores oficiales de la GEIH del DANE: nacional, departamentos y ciudades."
    sistema = "Eres un economista laboral que explica indicadores del DANE (GEIH) a jóvenes, sin tecnicismos."

    async def preparar(self, ctx, mensaje):
        dep, mun = detectar_territorio(mensaje, ctx.datos.get("departamento"), ctx.datos.get("municipio"))
        c = await mercado.consulta_dane(dep, mun)
        v, pct = mercado.valor, mercado.pct
        lineas = [f"Colombia: desempleo {pct(v(c['nacional'], 'TD'))} en 2025; jóvenes de 15 a 28 años "
                  f"{pct(v(c['nacional'], 'TD', 'Jóvenes 15-28'))} (may–jul 2026); el {pct(v(c['nacional'], 'NiNi', 'Jóvenes 15-28'))} "
                  "de los jóvenes ni estudia ni trabaja."]
        if c["departamento"]:
            d = c["departamento"]
            lineas.append(f"📍 {dep}: desempleo {pct(v(d, 'TD'))}, ocupación {pct(v(d, 'TO'))} y participación {pct(v(d, 'TGP'))} (año 2025).")
        if c["municipio"]:
            m = c["municipio"][0]
            lineas.append(f"🏙️ {mun}: desempleo {pct(v(c['municipio'], 'TD'))} ({m['periodo_nombre'].lower()}).{' ' + m['nota'] if m['nota'] else ''}")
        if not dep:
            lineas.append("Dime tu departamento o municipio y te muestro sus cifras. Ejemplo: desempleo en el Huila.")
        texto = "\n".join(lineas + c["avisos"]) + "\nFuente: DANE – GEIH."
        return texto, {**c, "acciones": [{"label": "Ver gráficos DANE", "href": "#/dane"}]}, texto


# 4 ─────────────────────────────────────────────────── Detector de brechas
class DetectorBrechas(Agente):
    id, nombre, icono = "brechas", "Detector de brechas laborales", "🎯"
    area = "Analítica"
    descripcion = "Compara el perfil de tu carrera y tus competencias con lo que pide el mercado."
    sistema = "Eres un analista de talento que explica brechas de competencias y cómo cerrarlas."

    async def preparar(self, ctx, mensaje):
        carrera = carrera_por_id(ctx.datos.get("carrera"))
        r = await mercado.calcular_brechas(ctx.competencias, ctx.territorios, carrera)
        grupos = agrupar([b["competencia"] for b in r["brechas"][:8]])
        texto = ((f"🎯 {carrera['nombre']}: " if carrera else "🎯 Frente a lo que más pide el mercado, ")
                 + f"tu cobertura es {format(r['cobertura'], 'g').replace('.', ',')}%.\nLo que más te conviene fortalecer, por área:\n"
                 + "\n".join(f"• {g}: {', '.join(l)}" for g, l in grupos.items()))
        if not ctx.competencias:
            texto += "\nTodavía no me has dicho qué dominas; márcalo en Brechas y rutas para afinar el resultado."
        if not carrera:
            texto += "\nCuéntame qué estudias (por ejemplo: estudio contaduría) y te evalúo con el perfil de tu carrera."
        r["acciones"] = [{"label": "Evaluar en detalle", "href": "#/brechas" + (f"?carrera={carrera['id']}" if carrera else "")}]
        return texto, r, texto


# 5 ─────────────────────────────────────────────────── Analizador de perfil
class AnalizadorPerfil(Agente):
    id, nombre, icono = "perfil", "Analizador de perfil", "🧑‍💼"
    area = "Inteligencia artificial"
    descripcion = "Lee tu experiencia en texto libre y extrae las competencias que ya tienes."
    sistema = "Eres un reclutador que identifica competencias en la descripción que hace un joven de sí mismo."

    SINONIMOS = {"python": "Lenguajes de programación", "programacion": "Lenguajes de programación", "react": "Lenguajes de programación", "javascript": "Lenguajes de programación",
                 "datos": "Análisis de datos", "excel": "Excel avanzado", "ingles": "Inglés B1+",
                 "seguridad informatica": "Ciberseguridad", "arduino": "IoT y electrónica",
                 "ventas": "Servicio al cliente", "redes sociales": "Marketing digital",
                 "inteligencia artificial": "Inteligencia artificial", "equipo": "Trabajo en equipo"}

    async def preparar(self, ctx, mensaje):
        catalogo = [f["competencia"] for f in await db.fetch("select distinct competencia from competencias_demandadas")]
        t = normalizar(mensaje)
        encontradas = {c for c in catalogo if normalizar(c) in t}
        encontradas |= {v for k, v in self.SINONIMOS.items() if k in t}
        lista = sorted(encontradas)
        texto = ("Identifiqué estas competencias en tu perfil: " + ", ".join(lista) + ". Puedes guardarlas en tu perfil."
                 if lista else "No identifiqué competencias aún. Cuéntame qué has estudiado, en qué has trabajado y qué herramientas usas.")
        return texto, {"competencias_detectadas": lista}, texto


# 6 ─────────────────────────────────────────────── Tendencias del mercado
class Tendencias(Agente):
    id, nombre, icono = "tendencias", "Radar de tendencias laborales", "📈"
    area = "Analítica"
    descripcion = "Muestra qué áreas y competencias crecen más y qué carreras tienen más futuro."
    sistema = "Eres un analista de prospectiva laboral en Colombia."

    async def preparar(self, ctx, mensaje):
        top = sorted(await mercado.demanda_lista(ctx.territorios), key=lambda x: x["tendencia"], reverse=True)[:8]
        grupos: dict[str, list[str]] = {}
        g = agrupar([f["competencia"] for f in top])
        for grupo, comps in g.items():
            grupos[grupo] = [f"{c} ↑{next(f['tendencia'] for f in top if f['competencia'] == c):g}%" for c in comps]
        calientes = [f["competencia"] for f in top[:4]]
        futuro = sorted(((c, sum(1 for x in c["competencias"] + c["mercado"] if x in calientes)) for c in carreras()), key=lambda x: -x[1])
        futuro = [c["nombre"] for c, n in futuro if n > 1][:4]
        texto = ("📈 Áreas que más están creciendo en demanda:\n" + "\n".join(f"• {gr}: {', '.join(l)}" for gr, l in grupos.items())
                 + (f"\n\n🎓 Carreras que aprovechan estas tendencias: {', '.join(futuro)}." if futuro else "")
                 + "\n\nConsejo de NOVA: suma al menos una competencia de Datos e inteligencia artificial, sin importar tu carrera.")
        return texto, {"tendencias": top, "sugerencias": ["Clase de inteligencia artificial", "¿Qué competencias me faltan?"],
                       "acciones": [{"label": "Ver cursos en Orion Nova Academy", "href": ACADEMIA}]}, texto


# 7 ─────────────────────────────────────────── Diseñador de rutas
class RutasAprendizaje(Agente):
    id, nombre, icono = "rutas", "Diseñador de rutas de aprendizaje", "🗺️"
    area = "Inteligencia artificial"
    descripcion = "Convierte tus brechas en un plan de cursos en Orion Nova Academy."
    sistema = "Eres un diseñador instruccional de Orion Nova Academy que arma planes de estudio realistas para jóvenes."

    async def preparar(self, ctx, mensaje):
        b = await mercado.calcular_brechas(ctx.competencias, ctx.territorios, carrera_por_id(ctx.datos.get("carrera")))
        ruta = await mercado.ruta_para(b["brechas"])
        horas = sum(r["cursos"][0]["horas"] for r in ruta)
        texto = (f"🗺️ Tu ruta en Orion Nova Academy: {len(ruta)} etapas, unas {horas} horas (a 6 h por semana, cerca de {max(1, round(horas / 6))} semanas).\n"
                 + "\n".join(f"Etapa {n}: {r['cursos'][0]['titulo']} ({r['cursos'][0]['horas']} h{', gratis' if r['cursos'][0]['gratuito'] else ''})"
                              for n, r in enumerate(ruta, 1))
                 + "\nAl terminar recibes el certificado de Orion Nova Technologies.")
        return texto, {"ruta": ruta, "horas_totales": horas, "acciones": [{"label": "Ir a Orion Nova Academy", "href": ACADEMIA}]}, texto


# 8 ─────────────────────────────────────────── Tutor IA · Clases con NOVA
ALIAS_TEMAS = {"python": "Lenguajes de programación", "javascript": "Lenguajes de programación", "programacion": "Lenguajes de programación",
               "programar": "Lenguajes de programación", "sql": "Bases de datos SQL", "base de datos": "Bases de datos SQL",
               "datos": "Análisis de datos", "seguridad": "Ciberseguridad", "hacker": "Ciberseguridad", "ia": "Inteligencia artificial",
               "inteligencia artificial": "Inteligencia artificial", "excel": "Excel avanzado", "ingles": "Inglés B1+", "english": "Inglés B1+",
               "asertiv": "Comunicación asertiva", "comunicacion": "Comunicación asertiva", "cliente": "Servicio al cliente",
               "marketing": "Marketing digital", "redes": "Marketing digital"}
TITULOS_CLASE = ["📘 Concepto", "💡 Ejemplo", "🎯 Mini reto"]


def clase(tema: str, paso: int = 0) -> tuple[str, dict]:
    partes = lecciones()[tema]
    fin = paso >= len(partes) - 1
    texto = (f"Clase con NOVA · {tema} ({paso + 1}/{len(partes)})\n{TITULOS_CLASE[paso]}\n{partes[paso]}"
             + ("\n\n¡Terminaste la clase! 🎉 Sigue con el curso completo en Orion Nova Academy." if fin else ""))
    datos = {"sugerencias": ["Quiero otra clase", "Evaluar mis conocimientos"] if fin else [f"Continuar clase de {tema} ({paso + 2}/{len(partes)})"],
             "acciones": [{"label": "Ir a Orion Nova Academy", "href": ACADEMIA}] if fin else []}
    return texto, datos


class Tutor(Agente):
    id, nombre, icono = "tutor", "Tutor IA · Clases con NOVA", "🎓"
    area = "Inteligencia artificial"
    descripcion = "NOVA te da clases cortas: concepto, ejemplo y mini reto."
    sistema = ("Eres NOVA dando una clase corta. Explica con ejemplos cotidianos de Colombia, en pasos cortos, "
               "y termina con un mini ejercicio.")

    async def ejecutar(self, ctx: Contexto, mensaje: str) -> dict:
        texto, datos, _ = await self.preparar(ctx, mensaje)
        return {"agente": self.id, "nombre": self.nombre, "texto": texto, "datos": datos, "ia_generativa": False}

    async def preparar(self, ctx, mensaje):
        m = re.search(r"continuar clase de (.+) \((\d+)/\d+\)", mensaje, re.I)
        if m and m.group(1) in lecciones():
            t, d = clase(m.group(1), int(m.group(2)) - 1)
            return t, d, ""
        n = normalizar(mensaje)
        tema = next((x for x in lecciones() if normalizar(x) in n), None) or \
            next((v for k, v in ALIAS_TEMAS.items() if re.search(rf"\b{k}", n)), None)
        if tema:
            t, d = clase(tema, 0)
            return t, d, ""
        nombre = ctx.datos.get("nombre")
        return (f"¡Hola{', ' + nombre if nombre else ''}! Soy NOVA y hoy soy tu profe 🎓. Cada clase tiene 3 partes: concepto, "
                "ejemplo y mini reto. ¿Qué tema quieres aprender?", {"sugerencias": [f"Clase de {x}" for x in lecciones()]}, "")


# 9 ─────────────────────────────────────────── Evaluador de competencias
BANCO = {
    "Lenguajes de programación": [
        ("¿Qué imprime print(2 ** 3)?", ["6", "8", "9"], 1),
        ("¿Qué estructura guarda pares clave-valor?", ["lista", "tupla", "diccionario"], 2),
        ("¿Con qué palabra se define una función?", ["func", "def", "function"], 1)],
    "Ciberseguridad": [
        ("¿Qué es phishing?", ["Un antivirus", "Engaño para robar datos", "Un tipo de red"], 1),
        ("La contraseña más segura es…", ["123456", "MiNombre2000", "Frase-larga-con-símbolos-29"], 2),
        ("¿Qué agrega la verificación en dos pasos?", ["Una segunda prueba de identidad", "Más velocidad", "Nada"], 0)],
    "Análisis de datos": [
        ("La mediana es…", ["el valor más repetido", "el valor central", "el promedio"], 1),
        ("¿Qué gráfico muestra la evolución en el tiempo?", ["torta", "líneas", "dispersión"], 1),
        ("Una tabla dinámica sirve para…", ["resumir datos", "borrar datos", "dibujar"], 0)],
}


class Evaluador(Agente):
    id, nombre, icono = "evaluador", "Evaluador de competencias", "📝"
    area = "Inteligencia artificial"
    descripcion = "Mide tu nivel con pruebas cortas y guarda tu progreso."

    async def preparar(self, ctx, mensaje):
        comp = ctx.datos.get("competencia") or next((c for c in BANCO if normalizar(c.split()[-1]) in normalizar(mensaje)), "Lenguajes de programación")
        preguntas = BANCO.get(comp, BANCO["Lenguajes de programación"])
        respuestas = ctx.datos.get("respuestas")
        if respuestas is None:
            return (f"Prueba de {comp}: responde las {len(preguntas)} preguntas.",
                    {"competencia": comp, "preguntas": [{"texto": p, "opciones": o} for p, o, _ in preguntas],
                     "disponibles": list(BANCO)}, "")
        correctas = sum(1 for (_, _, ok), r in zip(preguntas, respuestas) if r == ok)
        puntaje = round(100 * correctas / len(preguntas))
        if ctx.usuario:
            await db.execute("insert into evaluaciones (usuario_id, competencia, puntaje) values (%s,%s,%s)",
                             ctx.usuario["id"], comp, puntaje)
        nivel = "avanzado" if puntaje >= 80 else "intermedio" if puntaje >= 50 else "básico"
        return (f"Obtuviste {puntaje}/100 en {comp}: nivel {nivel}.", {"competencia": comp, "puntaje": puntaje, "nivel": nivel}, "")


# 10 ───────────────────────────────────────────── Emparejador de vacantes
class Vacantes(Agente):
    id, nombre, icono = "vacantes", "Emparejador de vacantes", "🤝"
    area = "Inteligencia artificial"
    descripcion = "Calcula tu afinidad con cada vacante y te dice qué te falta para aplicar."
    sistema = "Eres un headhunter que recomienda vacantes y explica qué le falta al candidato."

    async def preparar(self, ctx, mensaje):
        v = await mercado.emparejar_vacantes(ctx.competencias, ctx.territorios)
        lineas = [f"• {x['titulo']} – {x['empresa']} ({x['territorio']}): afinidad {x['afinidad']}%"
                  + (f", te falta: {', '.join(x['faltan'])}" if x["faltan"] else " ✅") for x in v[:5]]
        texto = "Vacantes con mayor afinidad:\n" + "\n".join(lineas) + (" (Vacantes de EJEMPLO.)" if any(x["es_ejemplo"] for x in v) else "")
        return texto, {"vacantes": v}, texto


# 11 ─────────────────────────────────────────────── Coach de entrevistas
class CoachEntrevistas(Agente):
    id, nombre, icono = "entrevistas", "Coach de entrevistas", "🎤"
    area = "Inteligencia artificial"
    descripcion = "Simula entrevistas y te da retroalimentación con el método STAR."
    sistema = ("Eres un coach de entrevistas. Haz UNA pregunta a la vez; si el joven responde, dale "
               "retroalimentación con el método STAR (Situación, Tarea, Acción, Resultado).")

    async def preparar(self, ctx, mensaje):
        preguntas = ["Háblame de ti en 1 minuto.", "Cuéntame de un problema que resolviste.",
                     "¿Por qué quieres este cargo?", "¿Cuál es un aspecto que estás mejorando?",
                     "¿Dónde te ves en 2 años?"]
        texto = ("Practiquemos 🎤. Responde usando STAR: Situación, Tarea, Acción y Resultado.\n"
                 + "\n".join(f"{n}. {p}" for n, p in enumerate(preguntas, 1)))
        return texto, {"preguntas": preguntas}, texto


# 12 ─────────────────────────────────────────────── Generador de hoja de vida
class HojaVida(Agente):
    id, nombre, icono = "hoja_vida", "Revisor de hoja de vida", "📄"
    area = "Inteligencia artificial"
    descripcion = "Sube tu hoja de vida y NOVA te dice qué mejorar y qué fortalecer para el mercado."

    async def preparar(self, ctx, mensaje):
        cv = ctx.datos.get("hoja_vida_texto") or (mensaje if len(mensaje.split()) > 60 else "")
        if not cv:
            return ("📄 Sube tu hoja de vida (PDF, Word o texto) con el botón 📎 y la reviso por ti: te digo qué competencias tienes, "
                    "qué debes fortalecer para el mercado laboral y cómo mejorar su presentación. Tu archivo se lee en tu navegador y no se guarda.",
                    {"pedir_hoja_vida": True}, "")
        r = hoja_vida.analizar(str(cv)[:20000], ctx.datos.get("carrera"))
        lineas = [f"📄 Revisé tu hoja de vida ({r['palabras']} palabras). Puntaje: {r['puntaje']}/100."]
        if r["carrera"]:
            lineas.append(f"La comparé con el perfil de {r['carrera']['nombre']}.")
        lineas.append(f"✅ Competencias que encontré: {', '.join(r['encontradas'])}." if r["encontradas"]
                      else "✅ No encontré competencias claras; nómbralas en una sección de habilidades.")
        if r["fortalecer"]:
            lineas.append("💪 Para el mercado laboral te conviene fortalecer:\n"
                          + "\n".join(f"• {g}: {', '.join(l)}" for g, l in agrupar(r["fortalecer"][:8]).items()))
        if r["mejorar"]:
            lineas.append("✍️ Para mejorar tu hoja de vida:\n" + "\n".join(f"• {x}" for x in r["mejorar"]))
        return "\n".join(lineas), {"analisis_hoja_vida": r, "acciones": [{"label": "Ver mi ruta en Orion Nova Academy", "href": ACADEMIA}],
                                   "sugerencias": [f"Clase de {c}" for c in r["fortalecer"] if c in lecciones()][:2]}, ""


# 13 ─────────────────────────────────────────────── Orientador vocacional
class Orientador(Agente):
    id, nombre, icono = "orientador", "Orientador vocacional", "🧭"
    area = "Inteligencia artificial"
    descripcion = "Relaciona tus gustos con carreras y sectores que contratan."
    sistema = "Eres orientador vocacional. Haz preguntas sobre gustos y conecta con carreras y sectores con demanda real."

    GUSTOS = [(r"persona|ayudar|gente|social|ensen", ["Salud", "Educación", "Sector público", "Turismo"]),
              (r"dato|numero|matemat|analiz", ["Tecnología", "Administración", "Servicios financieros"]),
              (r"maquina|tecnolog|computador|program|robot|electr", ["Tecnología", "Industria 4.0", "Energía"]),
              (r"crear|dibuj|disen|arte|music|moda", ["Industrias creativas", "Comercio", "Construcción"]),
              (r"campo|animal|agro|cafe|naturaleza|ambiente", ["Agro", "Medio ambiente"]),
              (r"vender|negocio|emprend|comerci", ["Comercio", "Administración", "Turismo"])]

    async def preparar(self, ctx, mensaje):
        t = normalizar(mensaje)
        g = next((sec for patron, sec in self.GUSTOS if re.search(patron, t)), None)
        if not g:
            texto = ("Te ayudo a elegir 🧭. Cuéntame: ¿te gusta más trabajar con personas, con datos y números, con máquinas "
                     "y tecnología, creando cosas, con el campo y la naturaleza, o vendiendo y emprendiendo?")
            return texto, {"sugerencias": ["Me gusta la tecnología", "Me gusta ayudar a las personas", "Me gustan los números", "Me gusta el campo"]}, texto
        opciones = [c for c in carreras() if c["sector"] in g][:8]
        texto = ("Según lo que te gusta, estas carreras pueden ser para ti:\n"
                 + "\n".join(f"• {c['nombre']} ({c['nivel']}): {c['perfil']}" for c in opciones)
                 + "\nDime cuál te llama la atención y te muestro qué pide el mercado.")
        return texto, {"sugerencias": [f"Quiero estudiar {c['nombre'].lower()}" for c in opciones[:3]]}, texto


# 14 ─────────────────────────────────────────── Mentor de habilidades blandas
class HabilidadesBlandas(Agente):
    id, nombre, icono = "blandas", "Mentor de habilidades blandas", "💬"
    area = "Inteligencia artificial"
    descripcion = "Entrena comunicación, trabajo en equipo, liderazgo y manejo del estrés."
    sistema = "Eres mentor de habilidades blandas para jóvenes en su primer empleo. Da ejercicios prácticos."

    async def preparar(self, ctx, mensaje):
        texto = ("Reto de la semana 💬:\n• Lunes: escucha activa — repite con tus palabras lo que te dijeron.\n"
                 "• Miércoles: presenta una idea en 60 segundos.\n• Viernes: pide retroalimentación a alguien.\n"
                 "Practícalo también en el escenario de realidad virtual Entrevista de trabajo.")
        return texto, {}, texto


# 15 ─────────────────────────────────────────────── Laboratorio VR
ESCENARIOS_VR = [
    {"id": "entrevista", "titulo": "Entrevista de trabajo", "competencia": "Comunicación asertiva", "minutos": 8},
    {"id": "atencion", "titulo": "Atención al cliente", "competencia": "Servicio al cliente", "minutos": 10},
    {"id": "soc", "titulo": "Centro de operaciones de ciberseguridad", "competencia": "Ciberseguridad", "minutos": 12},
    {"id": "hse", "titulo": "Seguridad industrial en planta", "competencia": "Seguridad industrial (HSE)", "minutos": 10},
    {"id": "iot", "titulo": "Montaje de sensores IoT", "competencia": "IoT y electrónica", "minutos": 15},
]


class LaboratorioVR(Agente):
    id, nombre, icono = "vr", "Laboratorio de realidad virtual", "🥽"
    area = "Realidad virtual"
    descripcion = "Simulaciones inmersivas (WebXR) para practicar trabajos reales."

    async def preparar(self, ctx, mensaje):
        texto = ("Escenarios de realidad virtual disponibles (funcionan en celular, PC o visor VR):\n"
                 + "\n".join(f"• {e['titulo']} – {e['competencia']} ({e['minutos']} min)" for e in ESCENARIOS_VR))
        return texto, {"escenarios": ESCENARIOS_VR}, ""


# 16 ─────────────────────────────────────────────── Agente IoT
class AgenteIoT(Agente):
    id, nombre, icono = "iot", "Monitor IoT de sedes", "📡"
    area = "IoT"
    descripcion = "Vigila kioscos, sensores de aulas y lectores de asistencia en las sedes."

    async def preparar(self, ctx, mensaje):
        filas = await db.fetch(
            """select d.id, d.nombre, d.tipo, d.sede, l.metrica, round(avg(l.valor)::numeric,1)::float as promedio,
                      max(l.registrado_en) as ultima
               from iot_dispositivos d left join iot_lecturas l
                 on l.dispositivo_id = d.id and l.registrado_en > now() - interval '24 hours'
               where d.activo group by d.id, d.nombre, d.tipo, d.sede, l.metrica order by d.sede""")
        if not filas:
            return "No hay dispositivos IoT registrados todavía.", {"dispositivos": []}, ""
        texto = "Estado IoT (últimas 24 h):\n" + "\n".join(
            f"• {f['nombre']} ({f['sede']}): {f['metrica'] or 'sin lecturas'} {f['promedio'] if f['promedio'] is not None else ''}" for f in filas)
        return texto, {"dispositivos": filas}, ""


# 17 ─────────────────────────────────────────────── Analítica e impacto
class AnaliticaImpacto(Agente):
    id, nombre, icono = "impacto", "Analítica de impacto", "🏆"
    area = "Analítica"
    descripcion = "Mide el impacto de la plataforma: jóvenes formados, brechas cerradas y empleabilidad."

    async def preparar(self, ctx, mensaje):
        k = await db.fetchone(
            """select (select count(*) from usuarios where rol='joven')::int as jovenes,
                      (select count(*) from evaluaciones)::int as evaluaciones,
                      (select coalesce(round(avg(puntaje)),0) from evaluaciones)::int as puntaje_promedio,
                      (select count(*) from rutas_aprendizaje where estado='completado')::int as cursos_completados,
                      (select count(*) from vacantes where activa)::int as vacantes_activas,
                      (select count(*) from vr_sesiones)::int as sesiones_vr""")
        texto = (f"Impacto EmpleoTech 360 IA: {k['jovenes']} jóvenes, {k['evaluaciones']} evaluaciones "
                 f"(promedio {k['puntaje_promedio']}), {k['cursos_completados']} cursos completados, "
                 f"{k['sesiones_vr']} prácticas VR y {k['vacantes_activas']} vacantes activas.")
        return texto, {"kpis": k}, texto


AGENTES_17 = [Nova(), OriSecurity(), AnalistaDane(), DetectorBrechas(), AnalizadorPerfil(), Tendencias(),
              RutasAprendizaje(), Tutor(), Evaluador(), Vacantes(), CoachEntrevistas(), HojaVida(),
              Orientador(), HabilidadesBlandas(), LaboratorioVR(), AgenteIoT(), AnaliticaImpacto()]
