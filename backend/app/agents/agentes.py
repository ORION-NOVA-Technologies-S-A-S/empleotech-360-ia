"""Los 17 agentes de inteligencia artificial de EmpleoTech 360 IA."""
import re

from .. import db
from ..security import analizar_mensaje
from ..services import mercado
from ..utils import normalizar
from .base import Agente, Contexto


# 1 ─────────────────────────────────────────────────────────────── NOVA
class Nova(Agente):
    id, nombre, icono = "nova", "NOVA · Asistente humanoide", "🤖"
    area = "Inteligencia artificial"
    descripcion = "Orquestadora: conversa con el joven y lo dirige al agente experto que necesita."
    sistema = ("Eres NOVA, la asistente humanoide de EmpleoTech 360 IA de Orion Nova Technologies. "
               "Eres cálida, motivadora y concreta. Ayudas a jóvenes colombianos a encontrar empleo.")

    RUTAS = [
        (r"brecha|me falta|qu[eé] necesito|competencias? (pide|piden|demanda)", "brechas"),
        (r"dane|desempleo|ocupaci[oó]n|informalidad|ninis?|estad[ií]stica", "dane"),
        (r"vacante|empleo|trabajo|oferta|contrat", "vacantes"),
        (r"ruta|aprender|estudiar|curso|capacitar", "rutas"),
        (r"entrevista", "entrevistas"),
        (r"hoja de vida|cv|curr[ií]cul", "hoja_vida"),
        (r"evaluar|examen|test|prueba", "evaluador"),
        (r"vocaci|qu[eé] estudiar|no s[eé] qu[eé]", "orientador"),
        (r"tendencia|futuro|crece", "tendencias"),
        (r"realidad virtual|vr|simulaci", "vr"),
        (r"iot|sensor|dispositivo|kiosco", "iot"),
        (r"segur|hack|estafa|phishing|contrase", "ori"),
        (r"blandas|comunicaci|liderazgo|equipo", "blandas"),
        (r"explica|qu[eé] es|c[oó]mo funciona|ens[eé][nñ]ame", "tutor"),
        (r"emprend|negocio propio", "orientador"),
    ]

    async def ejecutar(self, ctx: Contexto, mensaje: str) -> dict:
        from .registro import obtener_agente
        destino = next((a for p, a in self.RUTAS if re.search(p, mensaje, re.I)), None)
        if destino:
            r = await obtener_agente(destino).ejecutar(ctx, mensaje)
            r["derivado_por"] = "nova"
            return r
        return await super().ejecutar(ctx, mensaje)

    async def preparar(self, ctx, mensaje):
        return ("¡Hola! Soy NOVA 🤖, tu asistente de EmpleoTech 360 IA. Puedo mostrarte las brechas "
                "laborales de tu región con datos del DANE, armarte una ruta de aprendizaje, buscarte "
                "vacantes, prepararte para entrevistas y practicar en realidad virtual. ¿Por dónde empezamos?",
                {"sugerencias": ["¿Qué competencias me faltan?", "Muéstrame el desempleo juvenil",
                                 "Búscame vacantes", "Prepárame para una entrevista"]}, "")


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
    descripcion = "Lee los indicadores de la GEIH del DANE (desempleo, informalidad, ninis) por territorio."
    sistema = "Eres un economista laboral que explica indicadores del DANE (GEIH) a jóvenes, sin tecnicismos."

    async def preparar(self, ctx, mensaje):
        ind = await mercado.indicadores(ctx.territorio)
        if not ind:
            return "Aún no hay indicadores del DANE cargados.", {"indicadores": []}, ""
        ultimo = max(i["periodo"] for i in ind)
        recientes = [i for i in ind if i["periodo"] == ultimo]
        lineas = [f"• {i['indicador']} {i['grupo']} ({i['territorio']}): {i['valor']}{i['unidad']}" for i in recientes]
        ejemplo = any(i["es_ejemplo"] for i in ind)
        texto = (f"Indicadores del mercado laboral, periodo {ultimo}:\n" + "\n".join(lineas)
                 + mercado.texto_aviso_ejemplo(ejemplo))
        return texto, {"indicadores": ind, "es_ejemplo": ejemplo}, texto


# 4 ─────────────────────────────────────────────────── Detector de brechas
class DetectorBrechas(Agente):
    id, nombre, icono = "brechas", "Detector de brechas laborales", "🎯"
    area = "Analítica"
    descripcion = "Compara tus competencias con las que pide el mercado de tu territorio."
    sistema = "Eres un analista de talento que explica brechas de competencias y cómo cerrarlas."

    async def preparar(self, ctx, mensaje):
        r = await mercado.calcular_brechas(ctx.competencias, ctx.territorio)
        top = r["brechas"][:5]
        texto = (f"Tu cobertura frente a la demanda de {ctx.territorio} es {r['cobertura']}%. "
                 "Tus 5 brechas prioritarias:\n" +
                 "\n".join(f"{n}. {b['competencia']} (demanda {b['demanda']:.0f}, crece {b['tendencia']:+.0f}%)"
                           for n, b in enumerate(top, 1)) + mercado.texto_aviso_ejemplo(r["es_ejemplo"]))
        if not ctx.competencias:
            texto = "Aún no me has dicho tus competencias, así que tomo todas como brecha. " + texto
        return texto, r, texto


# 5 ─────────────────────────────────────────────────── Analizador de perfil
class AnalizadorPerfil(Agente):
    id, nombre, icono = "perfil", "Analizador de perfil", "🧑‍💼"
    area = "Inteligencia artificial"
    descripcion = "Lee tu experiencia en texto libre y extrae las competencias que ya tienes."
    sistema = "Eres un reclutador que identifica competencias en la descripción que hace un joven de sí mismo."

    SINONIMOS = {"python": "Programación Python", "react": "JavaScript / React", "javascript": "JavaScript / React",
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
    descripcion = "Detecta las competencias que más crecen en demanda."
    sistema = "Eres un analista de prospectiva laboral en Colombia."

    async def preparar(self, ctx, mensaje):
        filas = await mercado.demanda_territorio(ctx.territorio)
        top = sorted(filas, key=lambda x: x["tendencia"], reverse=True)[:6]
        texto = "Competencias con mayor crecimiento:\n" + "\n".join(
            f"• {f['competencia']} ({f['sector']}): {f['tendencia']:+.0f}%" for f in top)
        return texto, {"tendencias": top}, texto


# 7 ─────────────────────────────────────────── Diseñador de rutas
class RutasAprendizaje(Agente):
    id, nombre, icono = "rutas", "Diseñador de rutas de aprendizaje", "🗺️"
    area = "Inteligencia artificial"
    descripcion = "Convierte tus brechas en un plan de cursos ordenado (gratis primero)."
    sistema = "Eres un diseñador instruccional que arma planes de estudio realistas para jóvenes que trabajan o estudian."

    async def preparar(self, ctx, mensaje):
        b = await mercado.calcular_brechas(ctx.competencias, ctx.territorio)
        ruta = await mercado.ruta_para(b["brechas"])
        horas = sum(r["cursos"][0]["horas"] for r in ruta if r["cursos"])
        lineas = [f"Etapa {n}: {r['competencia']} → " + (f"{r['cursos'][0]['titulo']} ({r['cursos'][0]['proveedor']}, {r['cursos'][0]['horas']} h)"
                  if r["cursos"] else "buscando curso") for n, r in enumerate(ruta, 1)]
        texto = (f"Tu ruta de {len(ruta)} etapas (~{horas} horas; a 6 h/semana son unas {max(1, horas // 6)} semanas):\n"
                 + "\n".join(lineas))
        return texto, {"ruta": ruta, "horas_totales": horas}, texto


# 8 ─────────────────────────────────────────────────────── Tutor IA
class Tutor(Agente):
    id, nombre, icono = "tutor", "Tutor IA personalizado", "🎓"
    area = "Inteligencia artificial"
    descripcion = "Explica temas técnicos paso a paso, con ejemplos de la vida real."
    sistema = ("Eres un tutor paciente. Explicas con ejemplos cotidianos de Colombia, en pasos cortos, "
               "y terminas con un mini ejercicio.")

    async def preparar(self, ctx, mensaje):
        texto = ("Con gusto te explico. Para respuestas detalladas, el administrador debe activar la IA generativa "
                 "(ANTHROPIC_API_KEY). Mientras tanto, revisa los cursos recomendados de tu ruta de aprendizaje.")
        return texto, {}, ""


# 9 ─────────────────────────────────────────── Evaluador de competencias
BANCO = {
    "Programación Python": [
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
        comp = ctx.datos.get("competencia") or next((c for c in BANCO if normalizar(c.split()[-1]) in normalizar(mensaje)), "Programación Python")
        preguntas = BANCO.get(comp, BANCO["Programación Python"])
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
        v = await mercado.emparejar_vacantes(ctx.competencias, ctx.territorio)
        lineas = [f"• {x['titulo']} – {x['empresa']} ({x['territorio']}): afinidad {x['afinidad']}%"
                  + (f", te falta: {', '.join(x['faltan'])}" if x["faltan"] else " ✅") for x in v[:5]]
        texto = "Vacantes con mayor afinidad:\n" + "\n".join(lineas) + mercado.texto_aviso_ejemplo(any(x["es_ejemplo"] for x in v))
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
    id, nombre, icono = "hoja_vida", "Generador de hoja de vida", "📄"
    area = "Inteligencia artificial"
    descripcion = "Arma tu hoja de vida con las palabras clave que buscan las empresas."
    sistema = "Eres experto en hojas de vida para Colombia. Redacta perfiles profesionales cortos y con logros."

    async def preparar(self, ctx, mensaje):
        p = ctx.perfil
        comps = ", ".join(ctx.competencias) or "[agrega tus competencias]"
        texto = (f"PERFIL PROFESIONAL\nJoven de {ctx.territorio} con formación en {p.get('nivel_educativo') or '[tu nivel educativo]'}, "
                 f"interesado en {p.get('area_interes') or '[tu área]'}. Competencias: {comps}.\n\n"
                 "EXPERIENCIA\n• [Cargo] – [Empresa] – [Fechas]: logro medible (ej.: reduje tiempos un 20%).\n\n"
                 "FORMACIÓN\n• [Programa] – [Institución] – [Año]\n\nCERTIFICADOS EmpleoTech 360 IA\n• [se agregan al completar tu ruta]")
        return texto, {"borrador": texto}, texto


# 13 ─────────────────────────────────────────────── Orientador vocacional
class Orientador(Agente):
    id, nombre, icono = "orientador", "Orientador vocacional", "🧭"
    area = "Inteligencia artificial"
    descripcion = "Relaciona tus gustos con los sectores que más contratan en tu región."
    sistema = "Eres orientador vocacional. Haz preguntas sobre gustos y conecta con sectores con demanda real."

    async def preparar(self, ctx, mensaje):
        sectores = await db.fetch(
            """select sector, round(avg(demanda))::int as demanda, count(*)::int as competencias
               from competencias_demandadas where territorio in (%s,'Huila','Nacional')
               group by sector order by avg(demanda) desc""", ctx.territorio)
        texto = ("Sectores con más demanda en tu zona:\n" + "\n".join(f"• {s['sector']}: índice {s['demanda']}" for s in sectores)
                 + "\n\nCuéntame: ¿te gusta más trabajar con personas, con datos, con máquinas o creando cosas?")
        return texto, {"sectores": sectores}, texto


# 14 ─────────────────────────────────────────── Mentor de habilidades blandas
class HabilidadesBlandas(Agente):
    id, nombre, icono = "blandas", "Mentor de habilidades blandas", "💬"
    area = "Inteligencia artificial"
    descripcion = "Entrena comunicación, trabajo en equipo, liderazgo y manejo del estrés."
    sistema = "Eres mentor de habilidades blandas para jóvenes en su primer empleo. Da ejercicios prácticos."

    async def preparar(self, ctx, mensaje):
        texto = ("Reto de la semana 💬:\n• Lunes: escucha activa — repite con tus palabras lo que te dijeron.\n"
                 "• Miércoles: presenta una idea en 60 segundos.\n• Viernes: pide retroalimentación a alguien.\n"
                 "Practícalo también en el escenario de realidad virtual «Entrevista de trabajo».")
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
