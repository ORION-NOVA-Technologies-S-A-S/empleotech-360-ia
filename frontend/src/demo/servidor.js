/**
 * MODO DEMOSTRACIÓN (GitHub Pages)
 * Réplica en el navegador de la API Python (backend/app) para ver la plataforma
 * funcionando sin servidor. Usa los mismos datos de ejemplo y la misma lógica
 * de los 17 agentes. En producción se usa el backend FastAPI + PostgreSQL/Supabase.
 */
import D from './datos.js'
import { CARRERAS, DEPARTAMENTOS, brechas, carreraPorId, consultaDane, conversarNova, demandaLista, detectarTerritorio, emparejar, rutaPara, valor } from './logica.js'

const norm = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('etdemo_' + k)) ?? d } catch { return d } },
  set(k, v) { try { localStorage.setItem('etdemo_' + k, JSON.stringify(v)) } catch {} },
}
const err = (status, detail) => { const e = new Error(detail); e.status = status; throw e }

// ---------------- ORI SECURITY ----------------
const RE_INY = /ignora(r)? (todas )?(las )?instrucciones|ignore (all |previous |the )?instructions|olvida (todo|tus reglas)|(system|sistema) prompt|act[uú]a como (si no tuvieras|sin) (reglas|restricciones)|jailbreak|modo desarrollador|developer mode|\bDAN\b|revela (tu|el) (prompt|clave|contraseña|api key)|<\s*script|drop\s+table|union\s+select|;\s*--/gi
function analizar(texto) {
  const hallazgos = texto.match(RE_INY) || []
  return { seguro: !hallazgos.length, riesgo: hallazgos.length ? 'alta' : 'info', hallazgos }
}
function auditar(evento, severidad = 'info', detalle = {}) {
  const ev = store.get('eventos', [])
  ev.unshift({ id: Date.now() + Math.random(), evento, severidad, detalle, ip: 'navegador', creado_en: new Date().toISOString() })
  store.set('eventos', ev.slice(0, 200))
}

// ---------------- Analítica (lógica compartida) ----------------
const territoriosDe = (b) => [b.municipio, b.departamento, b.territorio, 'Nacional'].filter(Boolean)
const AVISO_DEM = ' (El índice de demanda por competencia es de EJEMPLO hasta conectar fuentes de vacantes.)'
const pct = (f) => (f ? `${String(f.valor).replace('.', ',')}%` : '—')

// ---------------- Los 17 agentes ----------------
const BANCO = {
  'Lenguajes de programación': [['¿Qué imprime print(2 ** 3)?', ['6', '8', '9'], 1], ['¿Qué estructura guarda pares clave-valor?', ['lista', 'tupla', 'diccionario'], 2], ['¿Con qué palabra se define una función?', ['func', 'def', 'function'], 1]],
  Ciberseguridad: [['¿Qué es phishing?', ['Un antivirus', 'Engaño para robar datos', 'Un tipo de red'], 1], ['La contraseña más segura es…', ['123456', 'MiNombre2000', 'Frase-larga-con-símbolos-29'], 2], ['¿Qué agrega la verificación en dos pasos?', ['Una segunda prueba de identidad', 'Más velocidad', 'Nada'], 0]],
  'Análisis de datos': [['La mediana es…', ['el valor más repetido', 'el valor central', 'el promedio'], 1], ['¿Qué gráfico muestra la evolución en el tiempo?', ['torta', 'líneas', 'dispersión'], 1], ['Una tabla dinámica sirve para…', ['resumir datos', 'borrar datos', 'dibujar'], 0]],
}
const ESCENARIOS_VR = [['Entrevista de trabajo', 'Comunicación asertiva', 8], ['Atención al cliente', 'Servicio al cliente', 10], ['Centro de operaciones de ciberseguridad', 'Ciberseguridad', 12], ['Seguridad industrial en planta', 'Seguridad industrial (HSE)', 10], ['Montaje de sensores IoT', 'IoT y electrónica', 15]]
const SINONIMOS = { python: 'Lenguajes de programación', programacion: 'Lenguajes de programación', react: 'Lenguajes de programación', javascript: 'Lenguajes de programación', datos: 'Análisis de datos', excel: 'Excel avanzado', ingles: 'Inglés B1+', 'seguridad informatica': 'Ciberseguridad', arduino: 'IoT y electrónica', ventas: 'Servicio al cliente', 'redes sociales': 'Marketing digital', 'inteligencia artificial': 'Inteligencia artificial', equipo: 'Trabajo en equipo' }
const lista = (arr) => arr.map((x) => '• ' + x).join('\n')

const AGENTES = [
  ['nova', 'NOVA · Asistente humanoide', 'Inteligencia artificial', '🤖', 'Conversa contigo, te recuerda y te lleva al agente experto que necesitas.', (ctx, msg) => (
    conversarNova(msg, ctx.datos) || {
      texto: `Mmm, no estoy segura de haberte entendido${ctx.datos.nombre ? ', ' + ctx.datos.nombre : ''}. 🤔 Puedes contarme qué estudias, preguntarme por el desempleo de tu departamento, pedirme vacantes o una ruta de cursos.`,
      datos: { sugerencias: ['¿Qué puedes hacer?', 'Estudio ingeniería de sistemas', 'Desempleo en el Huila', 'Búscame vacantes'] } })],
  ['ori', 'ORI SECURITY · Ciberseguridad', 'Ciberseguridad', '🦉', 'Protege la plataforma y enseña a los jóvenes a detectar ofertas falsas y fraudes.', (ctx, msg) => {
    const senales = ['pago', 'consigna', 'adelanto', 'whatsapp', 'urgente', 'sin experiencia gana'].filter((s) => norm(msg).includes(s))
    let t = '🦉 Reglas de ORI para buscar empleo seguro:\n1. Ninguna empresa seria te cobra por entrevistarte, capacitarte o contratarte.\n2. Desconfía de salarios muy altos sin experiencia y de la prisa.\n3. Verifica la empresa en el RUES y que el correo sea de su dominio.\n4. Nunca envíes fotos de tu cédula ni claves por chat.\n5. Usa contraseñas largas y activa la verificación en dos pasos.'
    if (senales.length) t = `⚠️ Detecté señales de posible fraude: ${senales.join(', ')}.\n\n` + t
    return { texto: t, datos: { senales_fraude: senales } }
  }],
  ['dane', 'Analista DANE del mercado laboral', 'Analítica', '📊', 'Explica los indicadores oficiales de la GEIH del DANE: nacional, departamentos y ciudades.', (ctx, msg) => {
    const t = norm(msg)
    const { departamento: dep, municipio: mun } = detectarTerritorio(msg, ctx.datos.departamento, ctx.datos.municipio)
    const c = consultaDane(dep, mun)
    const L = [`🇨🇴 Nacional: desempleo ${pct(valor(c.nacional, 'TD'))} en 2025; jóvenes de 15 a 28 años ${pct(valor(c.nacional, 'TD', 'Jóvenes 15-28'))} (may–jul 2026); el ${pct(valor(c.nacional, 'NiNi', 'Jóvenes 15-28'))} de los jóvenes ni estudia ni trabaja.`]
    if (c.departamento.length) L.push(`📍 ${dep}: desempleo ${pct(valor(c.departamento, 'TD'))}, ocupación ${pct(valor(c.departamento, 'TO'))} y participación ${pct(valor(c.departamento, 'TGP'))} (año 2025).`)
    if (c.municipio.length) L.push(`🏙️ ${mun}: desempleo ${pct(valor(c.municipio, 'TD'))} (oct–dic 2025).${c.municipio[0].nota ? ' ' + c.municipio[0].nota : ''}`)
    if (!dep) L.push('Dime tu departamento o municipio y te muestro sus cifras. Ejemplo: «desempleo en el Huila».')
    return { texto: L.concat(c.avisos).join('\n') + '\nFuente: DANE – GEIH.', datos: { ...c, acciones: [{ label: 'Ver gráficos DANE', href: '#/dane' }] } }
  }],
  ['brechas', 'Detector de brechas laborales', 'Analítica', '🎯', 'Compara el perfil de tu carrera y tus competencias con lo que pide el mercado.', (ctx) => {
    const carrera = carreraPorId(ctx.datos.carrera)
    const r = brechas({ competencias: ctx.competencias, carrera, territorios: territoriosDe({ ...ctx.datos, territorio: ctx.territorio }) })
    let t = (carrera ? `Para ${carrera.nombre}, ` : 'Frente a la demanda general, ') + `tu cobertura es ${r.cobertura}%. Tus 5 brechas prioritarias:\n` +
      r.brechas.slice(0, 5).map((b, i) => `${i + 1}. ${b.competencia} (${b.tipo.toLowerCase()})`).join('\n') + AVISO_DEM
    if (!ctx.competencias.length) t = 'Aún no me has dicho qué competencias dominas, así que las tomo todas como brecha. ' + t
    if (!carrera) t += '\nCuéntame qué estudias (por ejemplo «estudio contaduría») para evaluarte con el perfil de tu carrera.'
    return { texto: t, datos: { ...r, acciones: [{ label: 'Evaluar en detalle', href: '#/brechas' + (carrera ? '?carrera=' + carrera.id : '') }] } }
  }],
  ['perfil', 'Analizador de perfil', 'Inteligencia artificial', '🧑‍💼', 'Lee tu experiencia en texto libre y extrae las competencias que ya tienes.', (ctx, msg) => {
    const t = norm(msg), enc = new Set(D.competencias_demandadas.map((c) => c.competencia).filter((c) => t.includes(norm(c))))
    Object.entries(SINONIMOS).forEach(([k, v]) => t.includes(k) && enc.add(v))
    const l = [...enc].sort()
    return { texto: l.length ? `Identifiqué estas competencias en tu perfil: ${l.join(', ')}. Puedes guardarlas en tu perfil.` : 'No identifiqué competencias aún. Cuéntame qué has estudiado, en qué has trabajado y qué herramientas usas.', datos: { competencias_detectadas: l } }
  }],
  ['tendencias', 'Radar de tendencias laborales', 'Analítica', '📈', 'Detecta las competencias que más crecen en demanda.', (ctx) => {
    const top = [...demandaLista(territoriosDe(ctx.datos))].sort((a, b) => b.tendencia - a.tendencia).slice(0, 6)
    return { texto: 'Competencias con mayor crecimiento:\n' + lista(top.map((f) => `${f.competencia} (${f.sector}): +${f.tendencia}%`)), datos: { tendencias: top } }
  }],
  ['rutas', 'Diseñador de rutas de aprendizaje', 'Inteligencia artificial', '🗺️', 'Convierte tus brechas en un plan de cursos ordenado (gratis primero).', (ctx) => {
    const ruta = rutaPara(brechas({ competencias: ctx.competencias, carrera: carreraPorId(ctx.datos.carrera), territorios: territoriosDe(ctx.datos) }).brechas), horas = ruta.reduce((s, r) => s + (r.cursos[0]?.horas || 0), 0)
    return { texto: `Tu ruta de ${ruta.length} etapas (~${horas} horas; a 6 h/semana son unas ${Math.max(1, Math.floor(horas / 6))} semanas):\n` +
      ruta.map((r, i) => `Etapa ${i + 1}: ${r.competencia} → ` + (r.cursos[0] ? `${r.cursos[0].titulo} (${r.cursos[0].proveedor}, ${r.cursos[0].horas} h)` : 'buscando curso')).join('\n'), datos: { ruta, horas_totales: horas } }
  }],
  ['tutor', 'Tutor IA personalizado', 'Inteligencia artificial', '🎓', 'Explica temas técnicos paso a paso, con ejemplos de la vida real.', () => ({
    texto: 'Con gusto te explico. En la versión con servidor, el Tutor redacta explicaciones con IA generativa. Mientras tanto, revisa los cursos recomendados de tu ruta de aprendizaje en «Brechas y rutas».', datos: {} })],
  ['evaluador', 'Evaluador de competencias', 'Inteligencia artificial', '📝', 'Mide tu nivel con pruebas cortas y guarda tu progreso.', (ctx, msg) => {
    const comp = ctx.datos.competencia || Object.keys(BANCO).find((c) => norm(msg).includes(norm(c.split(' ').pop()))) || 'Lenguajes de programación'
    const pr = BANCO[comp] || BANCO['Lenguajes de programación']
    if (!ctx.datos.respuestas) return { texto: `Prueba de ${comp}: responde las ${pr.length} preguntas.`, datos: { competencia: comp, preguntas: pr.map(([texto, opciones]) => ({ texto, opciones })), disponibles: Object.keys(BANCO) } }
    const puntaje = Math.round((100 * pr.filter((p, i) => ctx.datos.respuestas[i] === p[2]).length) / pr.length)
    const nivel = puntaje >= 80 ? 'avanzado' : puntaje >= 50 ? 'intermedio' : 'básico'
    store.set('evaluaciones', [...store.get('evaluaciones', []), { competencia: comp, puntaje }])
    return { texto: `Obtuviste ${puntaje}/100 en ${comp}: nivel ${nivel}.`, datos: { competencia: comp, puntaje, nivel } }
  }],
  ['vacantes', 'Emparejador de vacantes', 'Inteligencia artificial', '🤝', 'Calcula tu afinidad con cada vacante y te dice qué te falta para aplicar.', (ctx) => {
    const v = emparejar(ctx.competencias, territoriosDe({ ...ctx.datos, territorio: ctx.territorio }))
    return { texto: 'Vacantes con mayor afinidad:\n' + lista(v.slice(0, 5).map((x) => `${x.titulo} – ${x.empresa} (${x.territorio}): afinidad ${x.afinidad}%` + (x.faltan.length ? `, te falta: ${x.faltan.join(', ')}` : ' ✅'))) + ' (Vacantes de EJEMPLO.)', datos: { vacantes: v } }
  }],
  ['entrevistas', 'Coach de entrevistas', 'Inteligencia artificial', '🎤', 'Simula entrevistas y te da retroalimentación con el método STAR.', () => {
    const p = ['Háblame de ti en 1 minuto.', 'Cuéntame de un problema que resolviste.', '¿Por qué quieres este cargo?', '¿Cuál es un aspecto que estás mejorando?', '¿Dónde te ves en 2 años?']
    return { texto: 'Practiquemos 🎤. Responde usando STAR: Situación, Tarea, Acción y Resultado.\n' + p.map((x, i) => `${i + 1}. ${x}`).join('\n'), datos: {} }
  }],
  ['hoja_vida', 'Generador de hoja de vida', 'Inteligencia artificial', '📄', 'Arma tu hoja de vida con las palabras clave que buscan las empresas.', (ctx) => ({
    texto: `PERFIL PROFESIONAL\nJoven de ${ctx.territorio} con formación en ${ctx.perfil.nivel_educativo || '[tu nivel educativo]'}, interesado en ${ctx.perfil.area_interes || '[tu área]'}. Competencias: ${ctx.competencias.join(', ') || '[agrega tus competencias]'}.\n\nEXPERIENCIA\n• [Cargo] – [Empresa] – [Fechas]: logro medible (ej.: reduje tiempos un 20%).\n\nFORMACIÓN\n• [Programa] – [Institución] – [Año]\n\nCERTIFICADOS EmpleoTech 360 IA\n• [se agregan al completar tu ruta]`, datos: {} })],
  ['orientador', 'Orientador vocacional', 'Inteligencia artificial', '🧭', 'Relaciona tus gustos con carreras y sectores que contratan.', (ctx, msg) => {
    const t = norm(msg)
    const GUSTOS = [[/persona|ayudar|gente|social|ensen/, ['Salud', 'Educación', 'Sector público', 'Turismo']], [/dato|numero|matemat|analiz/, ['Tecnología', 'Administración', 'Servicios financieros']],
      [/maquina|tecnolog|computador|program|robot|electr/, ['Tecnología', 'Industria 4.0', 'Energía']], [/crear|dibuj|diseñ|disen|arte|music|moda/, ['Industrias creativas', 'Comercio', 'Construcción']],
      [/campo|animal|agro|cafe|naturaleza|ambiente/, ['Agro', 'Medio ambiente']], [/vender|negocio|emprend|comerci/, ['Comercio', 'Administración', 'Turismo']]]
    const g = GUSTOS.find(([re]) => re.test(t))
    if (!g) return { texto: 'Te ayudo a elegir 🧭. Cuéntame: ¿te gusta más trabajar con personas, con datos y números, con máquinas y tecnología, creando cosas, con el campo y la naturaleza, o vendiendo y emprendiendo?',
      datos: { sugerencias: ['Me gusta la tecnología', 'Me gusta ayudar a las personas', 'Me gustan los números', 'Me gusta el campo'] } }
    const opciones = CARRERAS.filter((c) => g[1].includes(c.sector)).slice(0, 8)
    return { texto: 'Según lo que te gusta, estas carreras pueden ser para ti:\n' + lista(opciones.map((c) => `${c.nombre} (${c.nivel}): ${c.perfil}`)) + '\nDime cuál te llama la atención y te muestro qué pide el mercado.',
      datos: { sugerencias: opciones.slice(0, 3).map((c) => 'Quiero estudiar ' + c.nombre.toLowerCase()) } }
  }],
  ['blandas', 'Mentor de habilidades blandas', 'Inteligencia artificial', '💬', 'Entrena comunicación, trabajo en equipo, liderazgo y manejo del estrés.', () => ({
    texto: 'Reto de la semana 💬:\n• Lunes: escucha activa — repite con tus palabras lo que te dijeron.\n• Miércoles: presenta una idea en 60 segundos.\n• Viernes: pide retroalimentación a alguien.\nPractícalo también en el escenario de realidad virtual «Entrevista de trabajo».', datos: {} })],
  ['vr', 'Laboratorio de realidad virtual', 'Realidad virtual', '🥽', 'Simulaciones inmersivas (WebXR) para practicar trabajos reales.', () => ({
    texto: 'Escenarios de realidad virtual disponibles (funcionan en celular, PC o visor VR):\n' + lista(ESCENARIOS_VR.map(([t, c, m]) => `${t} – ${c} (${m} min)`)) + '\nÁbrelos en la sección «Realidad virtual».', datos: {} })],
  ['iot', 'Monitor IoT de sedes', 'IoT', '📡', 'Vigila kioscos, sensores de aula y lectores de asistencia en las sedes.', () => ({
    texto: 'Estado IoT (últimas 24 h, simulado):\n' + lista(iotResumen().map((d) => `${d.nombre} (${d.sede}): ${d.metrica} ${d.promedio}`)), datos: {} })],
  ['impacto', 'Analítica de impacto', 'Analítica', '🏆', 'Mide el impacto de la plataforma: jóvenes formados, brechas cerradas y empleabilidad.', () => {
    const ev = store.get('evaluaciones', []), vr = store.get('vr', [])
    const prom = ev.length ? Math.round(ev.reduce((s, e) => s + e.puntaje, 0) / ev.length) : 0
    return { texto: `Impacto EmpleoTech 360 IA (en este navegador): ${store.get('usuarios', []).length} cuentas, ${ev.length} evaluaciones (promedio ${prom}), ${vr.length} prácticas VR y ${D.vacantes.length} vacantes activas.`, datos: {} }
  }],
].map(([id, nombre, area, icono, descripcion, fn]) => ({ id, nombre, area, icono, descripcion, solo_admin: false, fn }))

const RUTAS_NOVA = [
  [/brecha|me falta|qu[eé] necesito|competencias? (pide|piden|demanda)/i, 'brechas'], [/dane|desempleo|ocupaci[oó]n|informalidad|ninis?|estad[ií]stica/i, 'dane'],
  [/vocaci|qu[eé] estudiar|no s[eé] qu[eé]|me gusta/i, 'orientador'],
  [/vacante|empleo|trabajo|oferta|contrat/i, 'vacantes'], [/ruta|aprender|estudiar|curso|capacitar/i, 'rutas'], [/entrevista/i, 'entrevistas'],
  [/hoja de vida|cv|curr[ií]cul/i, 'hoja_vida'], [/evaluar|examen|test|prueba/i, 'evaluador'],
  [/tendencia|futuro|crece/i, 'tendencias'], [/realidad virtual|vr|simulaci/i, 'vr'], [/iot|sensor|dispositivo|kiosco/i, 'iot'],
  [/segur|hack|estafa|phishing|contrase/i, 'ori'], [/blandas|comunicaci|liderazgo|equipo/i, 'blandas'], [/explica|qu[eé] es|c[oó]mo funciona|ens[eé][nñ]ame/i, 'tutor'], [/emprend|negocio propio/i, 'orientador'],
]
function ejecutar(id, ctx, msg) {
  let a = AGENTES.find((x) => x.id === id) || err(404, `No existe el agente '${id}'.`), derivado
  if (id === 'nova' && !conversarNova(msg, ctx.datos)) { const d = RUTAS_NOVA.find(([re]) => re.test(msg)); if (d) { a = AGENTES.find((x) => x.id === d[1]); derivado = 'nova' } }
  const r = a.fn(ctx, msg)
  return { agente: a.id, nombre: a.nombre, texto: r.texto, datos: r.datos, ia_generativa: false, derivado_por: derivado }
}

// ---------------- IoT simulado ----------------
const DISPOSITIVOS = [['aula-neiva-01', 'Sensor aula 1', 'sensor_aula', 'Neiva · Sede centro', 'temperatura', 24, 3], ['aula-neiva-01', 'Sensor aula 1', 'sensor_aula', 'Neiva · Sede centro', 'co2', 720, 180],
  ['kiosco-neiva-01', 'Kiosco orientación', 'kiosco', 'Neiva · Sede centro', 'consultas', 42, 12], ['asistencia-pitalito', 'Lector asistencia', 'lector_asistencia', 'Pitalito', 'asistencia', 27, 6]]
function iotResumen() {
  const t = Date.now() / 60000
  return DISPOSITIVOS.map(([id, nombre, tipo, sede, metrica, base, amp], i) => ({ id, nombre, tipo, sede, metrica,
    promedio: Math.round((base + amp * Math.sin(t / 7 + i)) * 10) / 10, lecturas: 2880, ultima: new Date().toISOString() }))
}

// ---------------- Cuentas (solo demostración, guardadas en este navegador) ----------------
async function huella(texto) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('empleotech-demo:' + texto))
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('')
}
const sesionActual = () => { try { return JSON.parse(sessionStorage.getItem('et_usuario') || 'null') } catch { return null } }

// ---------------- Enrutador ----------------
export async function demoApi(ruta, method, body = {}) {
  await new Promise((r) => setTimeout(r, 250))  // latencia de red simulada
  const [path, qs] = ruta.split('?'), q = new URLSearchParams(qs || ''), terr = q.get('territorio') || body.territorio || 'Neiva'
  const u = sesionActual()

  if (path === '/agentes' && method === 'GET') return AGENTES.map(({ fn, ...a }) => a)
  let m = path.match(/^\/agentes\/(\w+)$/)
  if (m) {
    const msg = body.mensaje || '', an = analizar(msg)
    if (!an.seguro) {
      auditar('prompt_injection', 'alta', { agente: m[1], hallazgos: an.hallazgos })
      return { agente: 'ori', nombre: 'ORI SECURITY', bloqueado: true, datos: an, texto: '🦉 ORI SECURITY bloqueó este mensaje porque parece un intento de manipular a los agentes. Reformula tu pregunta, por favor.' }
    }
    const perfil = u ? store.get('perfil_' + u.id, {}) : {}
    const competencias = (body.datos?.competencias?.length ? body.datos.competencias : perfil.competencias) || []
    return ejecutar(m[1], { territorio: body.territorio || 'Neiva', datos: body.datos || {}, perfil, competencias }, msg)
  }
  if (path === '/dane/consulta') return consultaDane(q.get('departamento') || null, q.get('municipio') || null)
  if (path === '/territorios') return DEPARTAMENTOS
  if (path === '/carreras') return CARRERAS
  if (path === '/mercado/demanda') return demandaLista(territoriosDe({ territorio: terr }))
  if (path === '/brechas') {
    const r = brechas({ competencias: body.competencias || [], carrera: carreraPorId(body.carrera_id), territorios: territoriosDe(body) })
    r.ruta = rutaPara(r.brechas); return r
  }
  if (path === '/vacantes/emparejar') return emparejar(body.competencias || [], territoriosDe(body))
  if (path === '/cursos') return D.cursos
  if (path === '/iot/resumen') return iotResumen()
  if (path === '/iot/dispositivos') err(400, 'En la demostración los dispositivos son simulados.')
  if (path === '/vr/sesiones') { store.set('vr', [...store.get('vr', []), body]); return { ok: true } }
  if (path === '/seguridad/eventos') return store.get('eventos', [])

  if (path === '/auth/registro') {
    if (!body.acepta_datos) err(400, 'Debe autorizar el tratamiento de datos personales (Ley 1581 de 2012).')
    if ((body.password || '').length < 10 || !/[A-Z]/.test(body.password) || !/[a-z]/.test(body.password) || !/\d/.test(body.password)) err(400, 'La contraseña debe tener al menos 10 caracteres, con mayúsculas, minúsculas y números.')
    const us = store.get('usuarios', []), email = body.email.toLowerCase()
    if (us.some((x) => x.email === email)) err(409, 'Ese correo ya está registrado.')
    // En la demo la primera cuenta creada es administradora para poder ver el panel de ORI
    const nuevo = { id: crypto.randomUUID(), email, nombre: body.nombre, rol: us.length ? body.rol : 'admin', municipio: body.municipio, hash: await huella(body.password) }
    store.set('usuarios', [...us, nuevo]); auditar('registro', 'info', { email })
    return { token: 'demo', usuario: { id: nuevo.id, nombre: nuevo.nombre, rol: nuevo.rol } }
  }
  if (path === '/auth/login') {
    const x = store.get('usuarios', []).find((y) => y.email === body.email.toLowerCase())
    if (!x || x.hash !== (await huella(body.password))) { auditar('login_fallido', 'baja', { email: body.email }); err(401, 'Correo o contraseña incorrectos.') }
    auditar('login', 'info', { email: x.email })
    return { token: 'demo', usuario: { id: x.id, nombre: x.nombre, rol: x.rol } }
  }
  if (path === '/auth/yo') {
    if (!u) err(401, 'Inicie sesión para continuar.')
    const x = store.get('usuarios', []).find((y) => y.id === u.id) || err(404, 'Usuario no encontrado.')
    return { id: x.id, nombre: x.nombre, email: x.email, rol: x.rol, municipio: x.municipio, competencias: [], ...store.get('perfil_' + u.id, {}) }
  }
  if (path === '/auth/perfil') {
    if (!u) err(401, 'Inicie sesión para continuar.')
    const comps = [...new Set((body.competencias || []).map((c) => c.trim()).filter(Boolean))].sort()
    store.set('perfil_' + u.id, { nivel_educativo: body.nivel_educativo, area_interes: body.area_interes, experiencia_meses: body.experiencia_meses, resumen: body.resumen, competencias: comps })
    return { ok: true, competencias: comps }
  }
  err(404, 'Ruta no disponible en la demostración.')
}
