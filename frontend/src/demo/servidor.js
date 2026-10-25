/**
 * MODO DEMOSTRACIÓN (GitHub Pages)
 * Réplica en el navegador de la API Python (backend/app) para ver la plataforma
 * funcionando sin servidor. Usa los mismos datos de ejemplo y la misma lógica
 * de los 17 agentes. En producción se usa el backend FastAPI + PostgreSQL/Supabase.
 */
import D from './datos.js'

const norm = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
const store = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('etdemo_' + k)) ?? d } catch { return d } },
  set(k, v) { try { localStorage.setItem('etdemo_' + k, JSON.stringify(v)) } catch {} },
}
const AVISO = ' (Atención: son datos de EJEMPLO; el administrador debe cargar las fuentes oficiales.)'
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

// ---------------- Analítica ----------------
function demanda(territorio) {
  const m = new Map()
  for (const d of D.competencias_demandadas.filter((x) => [territorio, 'Huila', 'Nacional'].includes(x.territorio))) {
    const a = m.get(d.competencia)
    m.set(d.competencia, a ? { ...a, demanda: Math.max(a.demanda, d.demanda), tendencia: Math.max(a.tendencia, d.tendencia), sector: a.sector > d.sector ? a.sector : d.sector }
      : { competencia: d.competencia, sector: d.sector, demanda: d.demanda, tendencia: d.tendencia, es_ejemplo: true })
  }
  return [...m.values()].sort((a, b) => b.demanda - a.demanda)
}
function brechas(competencias, territorio) {
  const dem = demanda(territorio), propias = new Set(competencias.map(norm))
  const tiene = dem.filter((d) => propias.has(norm(d.competencia)))
  const faltan = dem.filter((d) => !propias.has(norm(d.competencia))).map((f) => ({ ...f, prioridad: Math.round((f.demanda + 0.5 * f.tendencia) * 10) / 10 }))
  faltan.sort((a, b) => b.prioridad - a.prioridad)
  const total = dem.reduce((s, d) => s + d.demanda, 0) || 1
  return { territorio, cobertura: Math.round((1000 * tiene.reduce((s, d) => s + d.demanda, 0)) / total) / 10, tiene, brechas: faltan, es_ejemplo: true }
}
const NIVEL = { 'básico': 1, intermedio: 2, avanzado: 3 }
const rutaPara = (br, lim = 5) => br.slice(0, lim).map((b) => ({ competencia: b.competencia, prioridad: b.prioridad,
  cursos: D.cursos.filter((c) => c.competencia === b.competencia).sort((a, c) => (c.gratuito - a.gratuito) || (NIVEL[a.nivel] - NIVEL[c.nivel])) }))
function emparejar(competencias, territorio) {
  const propias = new Set(competencias.map(norm))
  return D.vacantes.filter((v) => [territorio, 'Huila', 'Remoto'].includes(v.territorio)).map((v) => {
    const coinciden = v.competencias.filter((c) => propias.has(norm(c)))
    return { ...v, afinidad: Math.round((100 * coinciden.length) / v.competencias.length), coinciden, faltan: v.competencias.filter((c) => !coinciden.includes(c)) }
  }).sort((a, b) => b.afinidad - a.afinidad)
}
const indicadores = (t) => D.indicadores_dane.filter((i) => [t, 'Nacional'].includes(i.territorio))
  .sort((a, b) => a.periodo.localeCompare(b.periodo) || a.territorio.localeCompare(b.territorio))

// ---------------- Los 17 agentes ----------------
const BANCO = {
  'Programación Python': [['¿Qué imprime print(2 ** 3)?', ['6', '8', '9'], 1], ['¿Qué estructura guarda pares clave-valor?', ['lista', 'tupla', 'diccionario'], 2], ['¿Con qué palabra se define una función?', ['func', 'def', 'function'], 1]],
  Ciberseguridad: [['¿Qué es phishing?', ['Un antivirus', 'Engaño para robar datos', 'Un tipo de red'], 1], ['La contraseña más segura es…', ['123456', 'MiNombre2000', 'Frase-larga-con-símbolos-29'], 2], ['¿Qué agrega la verificación en dos pasos?', ['Una segunda prueba de identidad', 'Más velocidad', 'Nada'], 0]],
  'Análisis de datos': [['La mediana es…', ['el valor más repetido', 'el valor central', 'el promedio'], 1], ['¿Qué gráfico muestra la evolución en el tiempo?', ['torta', 'líneas', 'dispersión'], 1], ['Una tabla dinámica sirve para…', ['resumir datos', 'borrar datos', 'dibujar'], 0]],
}
const ESCENARIOS_VR = [['Entrevista de trabajo', 'Comunicación asertiva', 8], ['Atención al cliente', 'Servicio al cliente', 10], ['Centro de operaciones de ciberseguridad', 'Ciberseguridad', 12], ['Seguridad industrial en planta', 'Seguridad industrial (HSE)', 10], ['Montaje de sensores IoT', 'IoT y electrónica', 15]]
const SINONIMOS = { python: 'Programación Python', react: 'JavaScript / React', javascript: 'JavaScript / React', datos: 'Análisis de datos', excel: 'Excel avanzado', ingles: 'Inglés B1+', 'seguridad informatica': 'Ciberseguridad', arduino: 'IoT y electrónica', ventas: 'Servicio al cliente', 'redes sociales': 'Marketing digital', 'inteligencia artificial': 'Inteligencia artificial', equipo: 'Trabajo en equipo' }
const lista = (arr) => arr.map((x) => '• ' + x).join('\n')

const AGENTES = [
  ['nova', 'NOVA · Asistente humanoide', 'Inteligencia artificial', '🤖', 'Orquestadora: conversa con el joven y lo dirige al agente experto que necesita.', () => ({
    texto: '¡Hola! Soy NOVA 🤖, tu asistente de EmpleoTech 360 IA. Puedo mostrarte las brechas laborales de tu región con datos del DANE, armarte una ruta de aprendizaje, buscarte vacantes, prepararte para entrevistas y practicar en realidad virtual. ¿Por dónde empezamos?',
    datos: { sugerencias: ['¿Qué competencias me faltan?', 'Muéstrame el desempleo juvenil', 'Búscame vacantes', 'Prepárame para una entrevista'] } })],
  ['ori', 'ORI SECURITY · Ciberseguridad', 'Ciberseguridad', '🦉', 'Protege la plataforma y enseña a los jóvenes a detectar ofertas falsas y fraudes.', (ctx, msg) => {
    const senales = ['pago', 'consigna', 'adelanto', 'whatsapp', 'urgente', 'sin experiencia gana'].filter((s) => norm(msg).includes(s))
    let t = '🦉 Reglas de ORI para buscar empleo seguro:\n1. Ninguna empresa seria te cobra por entrevistarte, capacitarte o contratarte.\n2. Desconfía de salarios muy altos sin experiencia y de la prisa.\n3. Verifica la empresa en el RUES y que el correo sea de su dominio.\n4. Nunca envíes fotos de tu cédula ni claves por chat.\n5. Usa contraseñas largas y activa la verificación en dos pasos.'
    if (senales.length) t = `⚠️ Detecté señales de posible fraude: ${senales.join(', ')}.\n\n` + t
    return { texto: t, datos: { senales_fraude: senales } }
  }],
  ['dane', 'Analista DANE del mercado laboral', 'Analítica', '📊', 'Lee los indicadores de la GEIH del DANE (desempleo, informalidad, ninis) por territorio.', (ctx) => {
    const ind = indicadores(ctx.territorio), ult = ind.reduce((a, b) => (a > b.periodo ? a : b.periodo), '')
    return { texto: `Indicadores del mercado laboral, periodo ${ult}:\n` + lista(ind.filter((i) => i.periodo === ult).map((i) => `${i.indicador} ${i.grupo} (${i.territorio}): ${i.valor}%`)) + AVISO, datos: { indicadores: ind } }
  }],
  ['brechas', 'Detector de brechas laborales', 'Analítica', '🎯', 'Compara tus competencias con las que pide el mercado de tu territorio.', (ctx) => {
    const r = brechas(ctx.competencias, ctx.territorio)
    let t = `Tu cobertura frente a la demanda de ${ctx.territorio} es ${r.cobertura}%. Tus 5 brechas prioritarias:\n` +
      r.brechas.slice(0, 5).map((b, i) => `${i + 1}. ${b.competencia} (demanda ${b.demanda}, crece +${b.tendencia}%)`).join('\n') + AVISO
    if (!ctx.competencias.length) t = 'Aún no me has dicho tus competencias, así que tomo todas como brecha. ' + t
    return { texto: t, datos: r }
  }],
  ['perfil', 'Analizador de perfil', 'Inteligencia artificial', '🧑‍💼', 'Lee tu experiencia en texto libre y extrae las competencias que ya tienes.', (ctx, msg) => {
    const t = norm(msg), enc = new Set(D.competencias_demandadas.map((c) => c.competencia).filter((c) => t.includes(norm(c))))
    Object.entries(SINONIMOS).forEach(([k, v]) => t.includes(k) && enc.add(v))
    const l = [...enc].sort()
    return { texto: l.length ? `Identifiqué estas competencias en tu perfil: ${l.join(', ')}. Puedes guardarlas en tu perfil.` : 'No identifiqué competencias aún. Cuéntame qué has estudiado, en qué has trabajado y qué herramientas usas.', datos: { competencias_detectadas: l } }
  }],
  ['tendencias', 'Radar de tendencias laborales', 'Analítica', '📈', 'Detecta las competencias que más crecen en demanda.', (ctx) => {
    const top = [...demanda(ctx.territorio)].sort((a, b) => b.tendencia - a.tendencia).slice(0, 6)
    return { texto: 'Competencias con mayor crecimiento:\n' + lista(top.map((f) => `${f.competencia} (${f.sector}): +${f.tendencia}%`)), datos: { tendencias: top } }
  }],
  ['rutas', 'Diseñador de rutas de aprendizaje', 'Inteligencia artificial', '🗺️', 'Convierte tus brechas en un plan de cursos ordenado (gratis primero).', (ctx) => {
    const ruta = rutaPara(brechas(ctx.competencias, ctx.territorio).brechas), horas = ruta.reduce((s, r) => s + (r.cursos[0]?.horas || 0), 0)
    return { texto: `Tu ruta de ${ruta.length} etapas (~${horas} horas; a 6 h/semana son unas ${Math.max(1, Math.floor(horas / 6))} semanas):\n` +
      ruta.map((r, i) => `Etapa ${i + 1}: ${r.competencia} → ` + (r.cursos[0] ? `${r.cursos[0].titulo} (${r.cursos[0].proveedor}, ${r.cursos[0].horas} h)` : 'buscando curso')).join('\n'), datos: { ruta, horas_totales: horas } }
  }],
  ['tutor', 'Tutor IA personalizado', 'Inteligencia artificial', '🎓', 'Explica temas técnicos paso a paso, con ejemplos de la vida real.', () => ({
    texto: 'Con gusto te explico. En la versión con servidor, el Tutor redacta explicaciones con IA generativa. Mientras tanto, revisa los cursos recomendados de tu ruta de aprendizaje en «Brechas y rutas».', datos: {} })],
  ['evaluador', 'Evaluador de competencias', 'Inteligencia artificial', '📝', 'Mide tu nivel con pruebas cortas y guarda tu progreso.', (ctx, msg) => {
    const comp = ctx.datos.competencia || Object.keys(BANCO).find((c) => norm(msg).includes(norm(c.split(' ').pop()))) || 'Programación Python'
    const pr = BANCO[comp] || BANCO['Programación Python']
    if (!ctx.datos.respuestas) return { texto: `Prueba de ${comp}: responde las ${pr.length} preguntas.`, datos: { competencia: comp, preguntas: pr.map(([texto, opciones]) => ({ texto, opciones })), disponibles: Object.keys(BANCO) } }
    const puntaje = Math.round((100 * pr.filter((p, i) => ctx.datos.respuestas[i] === p[2]).length) / pr.length)
    const nivel = puntaje >= 80 ? 'avanzado' : puntaje >= 50 ? 'intermedio' : 'básico'
    store.set('evaluaciones', [...store.get('evaluaciones', []), { competencia: comp, puntaje }])
    return { texto: `Obtuviste ${puntaje}/100 en ${comp}: nivel ${nivel}.`, datos: { competencia: comp, puntaje, nivel } }
  }],
  ['vacantes', 'Emparejador de vacantes', 'Inteligencia artificial', '🤝', 'Calcula tu afinidad con cada vacante y te dice qué te falta para aplicar.', (ctx) => {
    const v = emparejar(ctx.competencias, ctx.territorio)
    return { texto: 'Vacantes con mayor afinidad:\n' + lista(v.slice(0, 5).map((x) => `${x.titulo} – ${x.empresa} (${x.territorio}): afinidad ${x.afinidad}%` + (x.faltan.length ? `, te falta: ${x.faltan.join(', ')}` : ' ✅'))) + AVISO, datos: { vacantes: v } }
  }],
  ['entrevistas', 'Coach de entrevistas', 'Inteligencia artificial', '🎤', 'Simula entrevistas y te da retroalimentación con el método STAR.', () => {
    const p = ['Háblame de ti en 1 minuto.', 'Cuéntame de un problema que resolviste.', '¿Por qué quieres este cargo?', '¿Cuál es un aspecto que estás mejorando?', '¿Dónde te ves en 2 años?']
    return { texto: 'Practiquemos 🎤. Responde usando STAR: Situación, Tarea, Acción y Resultado.\n' + p.map((x, i) => `${i + 1}. ${x}`).join('\n'), datos: {} }
  }],
  ['hoja_vida', 'Generador de hoja de vida', 'Inteligencia artificial', '📄', 'Arma tu hoja de vida con las palabras clave que buscan las empresas.', (ctx) => ({
    texto: `PERFIL PROFESIONAL\nJoven de ${ctx.territorio} con formación en ${ctx.perfil.nivel_educativo || '[tu nivel educativo]'}, interesado en ${ctx.perfil.area_interes || '[tu área]'}. Competencias: ${ctx.competencias.join(', ') || '[agrega tus competencias]'}.\n\nEXPERIENCIA\n• [Cargo] – [Empresa] – [Fechas]: logro medible (ej.: reduje tiempos un 20%).\n\nFORMACIÓN\n• [Programa] – [Institución] – [Año]\n\nCERTIFICADOS EmpleoTech 360 IA\n• [se agregan al completar tu ruta]`, datos: {} })],
  ['orientador', 'Orientador vocacional', 'Inteligencia artificial', '🧭', 'Relaciona tus gustos con los sectores que más contratan en tu región.', (ctx) => {
    const g = {}
    D.competencias_demandadas.filter((x) => [ctx.territorio, 'Huila', 'Nacional'].includes(x.territorio)).forEach((x) => (g[x.sector] ||= []).push(x.demanda))
    const s = Object.entries(g).map(([sector, v]) => ({ sector, demanda: Math.round(v.reduce((a, b) => a + b) / v.length) })).sort((a, b) => b.demanda - a.demanda)
    return { texto: 'Sectores con más demanda en tu zona:\n' + lista(s.map((x) => `${x.sector}: índice ${x.demanda}`)) + '\n\nCuéntame: ¿te gusta más trabajar con personas, con datos, con máquinas o creando cosas?', datos: { sectores: s } }
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
  [/vacante|empleo|trabajo|oferta|contrat/i, 'vacantes'], [/ruta|aprender|estudiar|curso|capacitar/i, 'rutas'], [/entrevista/i, 'entrevistas'],
  [/hoja de vida|cv|curr[ií]cul/i, 'hoja_vida'], [/evaluar|examen|test|prueba/i, 'evaluador'], [/vocaci|qu[eé] estudiar|no s[eé] qu[eé]/i, 'orientador'],
  [/tendencia|futuro|crece/i, 'tendencias'], [/realidad virtual|vr|simulaci/i, 'vr'], [/iot|sensor|dispositivo|kiosco/i, 'iot'],
  [/segur|hack|estafa|phishing|contrase/i, 'ori'], [/blandas|comunicaci|liderazgo|equipo/i, 'blandas'], [/explica|qu[eé] es|c[oó]mo funciona|ens[eé][nñ]ame/i, 'tutor'], [/emprend|negocio propio/i, 'orientador'],
]
function ejecutar(id, ctx, msg) {
  let a = AGENTES.find((x) => x.id === id) || err(404, `No existe el agente '${id}'.`), derivado
  if (id === 'nova') { const d = RUTAS_NOVA.find(([re]) => re.test(msg)); if (d) { a = AGENTES.find((x) => x.id === d[1]); derivado = 'nova' } }
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
  if (path === '/dane/indicadores') return indicadores(terr)
  if (path === '/mercado/demanda') return demanda(terr)
  if (path === '/brechas') { const r = brechas(body.competencias, terr); r.ruta = rutaPara(r.brechas); return r }
  if (path === '/vacantes/emparejar') return emparejar(body.competencias, terr)
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
