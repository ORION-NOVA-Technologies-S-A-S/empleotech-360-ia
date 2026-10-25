// Cliente de la API de EmpleoTech 360 IA
import { demoApi } from './demo/servidor.js'

const BASE = import.meta.env.VITE_API_URL || ''
// Modo demostración (GitHub Pages): la API corre dentro del navegador con datos de ejemplo
export const MODO_DEMO = import.meta.env.VITE_MODO_DEMO === 'true'
export const RECURSO = (archivo) => import.meta.env.BASE_URL + archivo

export const CONTACTO = {
  telefono: '300 444 0009',
  whatsapp: 'https://wa.me/573004440009?text=' + encodeURIComponent('Hola, quiero información de EmpleoTech 360 IA'),
  tel: 'tel:+573004440009',
}

export const sesion = {
  get token() { try { return sessionStorage.getItem('et_token') } catch { return null } },
  get usuario() { try { return JSON.parse(sessionStorage.getItem('et_usuario') || 'null') } catch { return null } },
  guardar(token, usuario) {
    try { sessionStorage.setItem('et_token', token); sessionStorage.setItem('et_usuario', JSON.stringify(usuario)) } catch {}
  },
  cerrar() { try { sessionStorage.removeItem('et_token'); sessionStorage.removeItem('et_usuario') } catch {} },
}

export async function api(ruta, { method = 'GET', body } = {}) {
  if (MODO_DEMO) {
    try { return await demoApi(ruta, method, body) } catch (e) {
      if (e.status === 401) sesion.cerrar()
      throw e
    }
  }
  const headers = { 'Content-Type': 'application/json' }
  if (sesion.token) headers.Authorization = `Bearer ${sesion.token}`
  const r = await fetch(`${BASE}/api${ruta}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  const datos = await r.json().catch(() => ({}))
  if (r.status === 401 && sesion.token) sesion.cerrar()
  if (!r.ok) throw new Error(typeof datos.detail === 'string' ? datos.detail : 'No se pudo completar la solicitud.')
  return datos
}

export const hablarConAgente = (agente, mensaje, extra = {}) =>
  api(`/agentes/${agente}`, { method: 'POST', body: { mensaje, territorio: extra.territorio || 'Neiva', datos: extra.datos || {} } })
