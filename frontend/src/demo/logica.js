/**
 * Lógica compartida de EmpleoTech 360 IA (réplica de backend/app/services/*.py)
 * Carreras y perfiles, territorios, consulta DANE, brechas y conversación de NOVA.
 */
import CARRERAS from '../../../database/datos/carreras.json'
import TERR from '../../../database/datos/territorios.json'
import INDICADORES from '../../../database/datos/indicadores_dane.json'
import D from './datos.js'

export const norm = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
export { CARRERAS }
export const DEPARTAMENTOS = TERR.departamentos

// ---------------- Carreras ----------------
const VACIAS = new Set(['ingenieria', 'tecnologia', 'tecnico', 'en', 'de', 'y', 'del', 'la', 'el', 'licenciatura', 'los', 'las', 'productos', 'servicios', 'gestion'])
const tokens = (s) => norm(s).replace(/[()]/g, ' ').split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !VACIAS.has(w))
export const carreraPorId = (id) => CARRERAS.find((c) => c.id === id)
export function detectarCarrera(texto) {
  const t = ' ' + norm(texto) + ' '
  let mejor = null, puntos = 0
  for (const c of CARRERAS) {
    const tk = tokens(c.nombre)
    if (!tk.length) continue
    const hits = tk.filter((w) => new RegExp(`\\b${w}`).test(t)).length
    let s = hits / tk.length + hits * 0.1
    if (t.includes(norm(c.nombre))) s += 0.4 * tk.length
    if (/tecnolog/.test(t) && c.nivel === 'Tecnólogo') s += 0.5
    if (/tecnic|auxiliar/.test(t) && c.nivel === 'Técnico') s += 0.5
    if (c.nivel === 'Profesional') s += 0.01
    if (hits && s > puntos) { puntos = s; mejor = c }
  }
  return puntos >= 0.99 ? mejor : null
}

// ---------------- Territorios ----------------
const conBorde = (t, nombre) => new RegExp(`(^|[^a-z])${norm(nombre).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`).test(t)
/** Busca departamento y municipio mencionados en un texto libre */
export function detectarTerritorio(texto, depActual = null, munActual = null) {
  const t = norm(texto)
  let dep = TERR.departamentos.map((d) => d.departamento).find((d) => conBorde(t, d)) || null
  let mun = null
  const buscarEn = dep ? TERR.departamentos.filter((d) => d.departamento === dep) : TERR.departamentos
  for (const d of buscarEn) {
    const m = d.municipios.filter((x) => x.length > 4 && conBorde(t, x)).sort((a, b) => b.length - a.length)[0]
    if (m && !(m === d.departamento && dep)) { mun = m; dep = d.departamento; break }
  }
  return { departamento: dep || (mun ? null : depActual), municipio: mun || (dep ? null : munActual) }
}

// ---------------- DANE ----------------
export function consultaDane(departamento, municipio) {
  const nacional = INDICADORES.filter((i) => i.nivel === 'Nacional')
  const dep = departamento ? INDICADORES.filter((i) => i.nivel === 'Departamento' && i.territorio === departamento) : []
  const mun = municipio ? INDICADORES.filter((i) => i.nivel === 'Municipio' && i.territorio === municipio && i.departamento === departamento) : []
  const avisos = []
  if (departamento && !dep.length && departamento !== 'Bogotá D.C.')
    avisos.push(`El DANE no publica cifras anuales de ${departamento} en su boletín por departamentos (solo cubre 23). Se muestran las cifras nacionales como referencia.`)
  if (municipio && !mun.length)
    avisos.push(`El DANE publica el desempleo municipal solo para 23 ciudades y áreas metropolitanas. ${municipio} no está entre ellas, así que se usan las cifras ${dep.length ? 'de ' + departamento : 'nacionales'}.`)
  const ranking = INDICADORES.filter((i) => i.nivel === 'Departamento' && i.indicador === 'TD').map((i) => ({ territorio: i.territorio, valor: i.valor })).sort((a, b) => b.valor - a.valor)
  const ciudades = INDICADORES.filter((i) => i.nivel === 'Municipio' && i.indicador === 'TD').map((i) => ({ territorio: i.territorio, departamento: i.departamento, valor: i.valor, nota: i.nota })).sort((a, b) => b.valor - a.valor)
  return { nacional, departamento: dep, municipio: mun, avisos, ranking, ciudades }
}
export const valor = (filas, indicador, grupo = 'Total') => filas.find((i) => i.indicador === indicador && i.grupo === grupo)

// ---------------- Demanda y brechas ----------------
function demandaMapa(territorios) {
  const m = new Map()
  for (const d of D.competencias_demandadas.filter((x) => territorios.includes(x.territorio))) {
    const a = m.get(d.competencia)
    if (!a || d.demanda > a.demanda) m.set(d.competencia, { demanda: d.demanda, tendencia: d.tendencia, sector: d.sector })
  }
  return m
}
export function demandaLista(territorios) {
  return [...demandaMapa(territorios).entries()].map(([competencia, d]) => ({ competencia, ...d, es_ejemplo: true })).sort((a, b) => b.demanda - a.demanda)
}

/** Brechas: con carrera compara su perfil + lo que pide el mercado; sin carrera usa la demanda general */
export function brechas({ competencias = [], carrera = null, territorios = ['Nacional'] }) {
  const dem = demandaMapa(territorios), propias = new Set(competencias.map(norm))
  let objetivo
  if (carrera) {
    const vistos = new Set()
    objetivo = [...carrera.competencias.map((c) => [c, 1.0, 'De la carrera']), ...carrera.mercado.map((c) => [c, 1.2, 'Pide el mercado']),
      ...carrera.transversales.map((c) => [c, 0.8, 'Transversal'])].filter(([c]) => !vistos.has(c) && vistos.add(c))
  } else objetivo = [...dem.keys()].map((c) => [c, 1.0, 'Demanda general'])
  const filas = objetivo.map(([competencia, peso, tipo]) => {
    const d = dem.get(competencia)
    const indice = d ? d.demanda : 60
    return { competencia, tipo, peso, demanda: d ? d.demanda : null, tendencia: d ? d.tendencia : null,
      prioridad: Math.round((indice * peso + 0.5 * (d ? d.tendencia : 0)) * 10) / 10 }
  })
  const tiene = filas.filter((f) => propias.has(norm(f.competencia)))
  const faltan = filas.filter((f) => !propias.has(norm(f.competencia))).sort((a, b) => b.prioridad - a.prioridad)
  const total = filas.reduce((s, f) => s + f.prioridad, 0) || 1
  return { carrera: carrera ? { id: carrera.id, nombre: carrera.nombre, nivel: carrera.nivel, perfil: carrera.perfil, sector: carrera.sector } : null,
    territorio: territorios[0], cobertura: Math.round((1000 * tiene.reduce((s, f) => s + f.prioridad, 0)) / total) / 10,
    tiene, brechas: faltan, es_ejemplo: true }
}

const NIVEL = { 'básico': 1, intermedio: 2, avanzado: 3 }
export const rutaPara = (br, lim = 6) => br.slice(0, lim).map((b) => {
  const cursos = D.cursos.filter((c) => c.competencia === b.competencia).sort((a, c) => (c.gratuito - a.gratuito) || (NIVEL[a.nivel] - NIVEL[c.nivel]))
  return { competencia: b.competencia, prioridad: b.prioridad,
    cursos: cursos.length ? cursos : [{ id: 'sena-' + norm(b.competencia), titulo: `Buscar «${b.competencia}» en SENA Sofia Plus`, nivel: 'básico', horas: 40, modalidad: 'virtual', proveedor: 'SENA Sofia Plus', url: 'https://oferta.senasofiaplus.edu.co', gratuito: true, sugerido: true }] }
})

export function emparejar(competencias, territorios) {
  const propias = new Set(competencias.map(norm))
  return D.vacantes.filter((v) => [...territorios, 'Huila', 'Remoto'].includes(v.territorio)).map((v) => {
    const coinciden = v.competencias.filter((c) => propias.has(norm(c)))
    return { ...v, afinidad: Math.round((100 * coinciden.length) / v.competencias.length), coinciden, faltan: v.competencias.filter((c) => !coinciden.includes(c)) }
  }).sort((a, b) => b.afinidad - a.afinidad)
}

// ---------------- NOVA: conversación ----------------
const CHISTES = [
  '¿Por qué el currículum fue al gimnasio? Porque quería verse más competente. 😄',
  'Mi jefe me dijo que pensara fuera de la caja… pero yo soy un robot, ¡vivo en la nube! ☁️',
  '¿Qué le dijo la entrevista a la hoja de vida? «Te veo en la segunda ronda». 😉',
]
const elegir = (a) => a[Math.floor(Math.random() * a.length)]
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()

/** Respuestas sociales de NOVA. Devuelve null si el mensaje es para un agente experto. */
export function conversarNova(msg, datos = {}) {
  const t = ' ' + norm(msg) + ' '
  const nombre = datos.nombre || ''
  const tu = nombre ? `, ${nombre}` : ''
  const sug = ['¿Qué competencias me faltan?', 'Estudio ingeniería de sistemas', 'Muéstrame el desempleo en mi departamento', 'Cuéntame un chiste']

  const mNombre = msg.match(/(?:me llamo|mi nombre es|dime|llámame|llamame)\s+([A-Za-zÁÉÍÓÚÑáéíóúñ]{2,20})/i)
  if (mNombre) {
    const n = capital(mNombre[1])
    return { texto: `¡Mucho gusto, ${n}! 🤝 Ya me acuerdo de ti. Cuéntame: ¿qué estudias o qué carrera te interesa? Con eso te muestro tu perfil y las brechas frente al mercado.`,
      datos: { nombre_detectado: n, sugerencias: ['Estudio enfermería', 'Quiero estudiar algo de tecnología', 'No sé qué estudiar'] } }
  }
  if (!msg.trim() || /\b(hola|buenas|buenos dias|buenas tardes|buenas noches|hey|saludos|que mas|quiubo)\b/.test(t))
    return { texto: nombre
      ? `¡Hola de nuevo${tu}! 👋 Qué bueno verte. ¿Seguimos con tu ruta hacia el empleo? Puedo revisar tus brechas, buscarte vacantes o ponerte a practicar una entrevista en realidad virtual.`
      : '¡Hola! 👋 Soy NOVA, la asistente humanoide de EmpleoTech 360 IA, de Orion Nova Technologies. Te ayudo a descubrir qué te pide el mercado laboral y cómo conseguirlo. ¿Cómo te llamas?',
    datos: { sugerencias: nombre ? sug : ['¿Qué puedes hacer?', 'Estudio enfermería', '¿Qué competencias me faltan?'] } }
  if (/\b(como estas|como vas|que tal|como te va)\b/.test(t))
    return { texto: `¡Muy bien${tu}, con la batería al 100% para ayudarte! ⚡ ¿Y tú cómo vas con la búsqueda de empleo o con tus estudios?`, datos: { sugerencias: sug } }
  if (/\b(quien eres|que eres|como te llamas|eres un robot|eres real)\b/.test(t))
    return { texto: 'Soy NOVA 🤖, un humanoide de inteligencia artificial creado por Orion Nova Technologies en Neiva, Huila. Coordino a 16 agentes expertos, y ORI, el búho, nos cuida la seguridad. Mi misión: que llegues a un empleo real con las competencias que pide el mercado.', datos: { sugerencias: sug } }
  if (/\b(que puedes hacer|ayudame|que haces|como funciona (esto|la plataforma|empleotech))\b|^\s*ayuda\s*$/.test(t))
    return { texto: `Esto es lo que puedo hacer por ti${tu}:\n• Analizar tu carrera y decirte qué competencias te faltan.\n• Mostrarte el desempleo de tu departamento o municipio con datos del DANE.\n• Armarte una ruta de cursos, gratis primero.\n• Buscarte vacantes y decirte tu afinidad.\n• Ponerte a practicar entrevistas en realidad virtual.\n• Con ORI, enseñarte a detectar ofertas falsas.`, datos: { sugerencias: sug } }
  if (/\b(gracias|muy amable|te pasaste|genial|excelente|chevere|bacano)\b/.test(t))
    return { texto: `¡Con mucho gusto${tu}! 💙 Para eso estoy. ¿Te ayudo con algo más?`, datos: { sugerencias: sug } }
  if (/\b(chiste|hazme reir|algo gracioso)\b/.test(t))
    return { texto: elegir(CHISTES), datos: { sugerencias: ['Otro chiste', '¿Qué competencias me faltan?'] } }
  if (/\b(otro chiste)\b/.test(t)) return { texto: elegir(CHISTES), datos: {} }
  if (/\b(adios|chao|hasta luego|nos vemos|bye)\b/.test(t))
    return { texto: `¡Hasta pronto${tu}! 👋 Aquí te espero para seguir avanzando. ¡Tú puedes!`, datos: {} }
  if (/\b(triste|desanimad|deprimid|no consigo|no encuentro trabajo|frustrad|cansad|perdid)/.test(t))
    return { texto: `Te entiendo${tu}. Buscar empleo cansa y es normal sentirse así. 💙 Vamos paso a paso: primero miramos tus fortalezas, luego elegimos 2 o 3 competencias para reforzar y practicamos una entrevista. No estás solo en esto. Si sientes que es algo más fuerte, habla con alguien de confianza o llama a la línea 106.`,
      datos: { sugerencias: ['¿Qué competencias me faltan?', 'Prepárame para una entrevista'] } }
  if (/\b(no se que estudiar|que estudio|que carrera|me recomiendas estudiar)\b/.test(t)) return null  // orientador
  const carrera = detectarCarrera(msg)
  if (carrera && /\b(estudio|estudie|carrera|soy|quiero estudiar|me gradue|egresad|perfil|profesion|programa)\b|ingenier|licenciad|tecnolog|tecnic/.test(t)) {
    const r = brechas({ competencias: [], carrera, territorios: [datos.municipio, datos.departamento, 'Nacional'].filter(Boolean) })
    const top = r.brechas.filter((b) => b.tipo === 'Pide el mercado').slice(0, 3).map((b) => b.competencia)
    return { texto: `¡${carrera.nombre}, buena elección${tu}! 🎓\nPerfil: ${carrera.perfil}\nCompetencias de la carrera: ${carrera.competencias.join(', ')}.\nAdemás el mercado está pidiendo: ${top.join(', ')}.\nEn «Brechas y rutas» marcas lo que ya dominas y te digo exactamente qué te falta.`,
      datos: { carrera_detectada: carrera.id, acciones: [{ label: `Evaluar mis brechas en ${carrera.nombre}`, href: `#/brechas?carrera=${carrera.id}` }] } }
  }
  return null
}
