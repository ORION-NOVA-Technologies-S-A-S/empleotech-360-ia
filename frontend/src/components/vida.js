/**
 * Vida de NOVA y ORI: mirada que sigue el puntero, gestos y voz en español.
 * Basado en el motor de ORI de ORION CORE (Orion Nova Technologies).
 */
const reducido = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
const hosts = (quien) => [...document.querySelectorAll(quien === 'ori' ? '.ori-host' : quien === 'nova' ? '.nova-host' : '.ori-host, .nova-host')]

// ---------- gestos ----------
const CLASES = { flap: 'ori-flap', scan: 'ori-scan', alert: 'ori-alert', tilt: 'tilt', saluda: 'nova-saluda', asiente: 'nova-asiente' }
export function gesto(quien, accion) {
  const cls = CLASES[accion]
  if (!cls) return
  hosts(quien).forEach((h) => {
    h.classList.remove(cls); void h.getBoundingClientRect(); h.classList.add(cls)
    clearTimeout(h['_t' + accion])
    h['_t' + accion] = setTimeout(() => h.classList.remove(cls), accion === 'flap' ? 1400 : accion === 'tilt' ? 900 : 2600)
  })
}

// ---------- mirada ----------
let iniciado = false
export function iniciarVida() {
  if (iniciado || typeof window === 'undefined') return
  iniciado = true
  addEventListener('pointermove', (e) => {
    hosts().forEach((h) => {
      const r = h.getBoundingClientRect()
      if (!r.width || r.bottom < 0 || r.top > innerHeight) return
      const dx = (e.clientX - (r.left + r.width / 2)) / innerWidth
      const dy = (e.clientY - (r.top + r.height * 0.35)) / innerHeight
      h.style.setProperty('--ox', Math.max(-1, Math.min(1, dx * 2.6)).toFixed(2))
      h.style.setProperty('--oy', Math.max(-1, Math.min(1, dy * 2.6)).toFixed(2))
    })
  }, { passive: true })
  if (!reducido) (function quieto() {
    setTimeout(() => {
      if (!document.hidden) {
        const a = ['scan', 'flap', 'alert', 'look', 'saluda'][Math.floor(Math.random() * 5)]
        if (a === 'look') {
          const x = (Math.random() * 2 - 1).toFixed(2), y = (Math.random() * 1.2 - 0.6).toFixed(2)
          hosts().forEach((h) => { h.style.setProperty('--ox', x); h.style.setProperty('--oy', y) })
        } else gesto(a === 'saluda' ? 'nova' : 'ori', a)
      }
      quieto()
    }, 6000 + Math.random() * 5000)
  })()
}

// ---------- voz ----------
const VOZ = { on: true, voces: [] }
try { VOZ.on = localStorage.getItem('empleotech.voz') !== 'off' } catch {}
export const hayVoz = () => typeof window !== 'undefined' && !!(window.speechSynthesis && window.SpeechSynthesisUtterance)
function cargarVoces() { try { VOZ.voces = (speechSynthesis.getVoices() || []).filter((v) => /^es/i.test(v.lang)) } catch { VOZ.voces = [] } }
if (hayVoz()) { cargarVoces(); try { speechSynthesis.addEventListener('voiceschanged', cargarVoces) } catch {} }

function elegirVoz(quien) {
  let mejor = null, puntos = -1e9
  VOZ.voces.forEach((v) => {
    const l = v.lang.replace('_', '-').toLowerCase()
    let s = l === 'es-co' ? 30 : l === 'es-mx' ? 26 : l === 'es-us' ? 24 : l === 'es-419' ? 22 : 12
    if (/natural|neural|online/i.test(v.name)) s += 8
    // NOVA prefiere voz femenina; ORI cualquiera
    if (quien === 'nova' && /(paulina|sabina|helena|elvira|dalia|salome|female|mujer|google español de estados unidos)/i.test(v.name)) s += 5
    if (s > puntos) { puntos = s; mejor = v }
  })
  return mejor
}
export const vozActiva = () => VOZ.on
export function cambiarVoz(on) {
  VOZ.on = on
  try { localStorage.setItem('empleotech.voz', on ? 'on' : 'off') } catch {}
  if (!on) callar()
}
function hablando(quien, on) { hosts(quien).forEach((h) => h.classList.toggle(quien === 'ori' ? 'ori-talking' : 'nova-talking', on)) }
const decible = (t) => String(t).replace(/https?:\/\/\S+/g, '').replace(/300 444 0009/g, 'tres cero cero, cuatro cuatro cuatro, cero cero cero nueve')
  .replace(/[•·→|#*]/g, ',').replace(/\s+/g, ' ').trim()

let turno = 0
export function callar() { turno++; try { if (hayVoz()) speechSynthesis.cancel() } catch {} hablando('ori', false); hablando('nova', false) }

export function hablar(texto, quien = 'nova') {
  const mio = ++turno
  hablando(quien === 'ori' ? 'nova' : 'ori', false)
  if (!VOZ.on || !hayVoz() || !VOZ.voces.length) {   // sin voz: igual mueve la boca
    hablando(quien, true)
    setTimeout(() => { if (mio === turno) hablando(quien, false) }, Math.min(3000, 400 + String(texto).length * 28))
    return
  }
  const partes = decible(texto).match(/[^.!?¿¡\n]+[.!?]?/g) || [], v = elegirVoz(quien)
  let i = 0
  try { speechSynthesis.cancel() } catch {}
  ;(function siguiente() {
    if (mio !== turno || i >= partes.length) { if (mio === turno) hablando(quien, false); return }
    const s = partes[i++].trim()
    if (s.length < 2) return siguiente()
    const u = new SpeechSynthesisUtterance(s)
    if (v) { u.voice = v; u.lang = v.lang } else u.lang = 'es-CO'
    u.rate = quien === 'ori' ? 1.08 : 1.02
    u.pitch = quien === 'ori' ? 1.45 : 1.15
    let ok = false
    const guarda = setTimeout(() => { if (!ok) hablando(quien, false) }, 2500)
    u.onstart = () => { ok = true; clearTimeout(guarda); hablando(quien, true) }
    u.onend = () => { clearTimeout(guarda); siguiente() }
    u.onerror = () => { clearTimeout(guarda); if (mio === turno) hablando(quien, false) }
    try { speechSynthesis.speak(u) } catch { clearTimeout(guarda) }
  })()
}

// Consejos de ORI (los mismos de ORION CORE + empleo seguro)
export const CONSEJOS_ORI = [
  'Ninguna empresa seria te cobra por entrevistarte, capacitarte o contratarte.',
  'Usa una contraseña distinta para cada cuenta. Si una se filtra, las demás siguen protegidas.',
  'Activa la verificación en dos pasos en tu correo, tu banco y WhatsApp.',
  'Desconfía de los mensajes que piden tus datos con urgencia. Así empiezan muchos fraudes.',
  'Antes de hacer clic, pasa el dedo o el cursor sobre el enlace y mira a dónde lleva realmente.',
  'Nunca envíes fotos de tu cédula por chat a una supuesta empresa: verifícala primero en el RUES.',
  'No uses redes Wi-Fi públicas para entrar a tu banco o a cuentas importantes.',
]
