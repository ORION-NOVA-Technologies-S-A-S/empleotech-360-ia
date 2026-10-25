import React, { useEffect, useState } from 'react'
import { api, sesion } from '../api.js'
import { NovaAvatar, OriAvatar } from '../components/Avatares.jsx'
import { gesto, hablar } from '../components/vida.js'

const modoDeUrl = () => (new URLSearchParams(window.location.hash.split('?')[1] || '').get('modo') === 'registro' ? 'registro' : 'login')
function fuerza(c) {
  let p = 0
  if (c.length >= 10) p++; if (/[A-Z]/.test(c) && /[a-z]/.test(c)) p++; if (/\d/.test(c)) p++; if (/[^A-Za-z0-9]/.test(c) || c.length >= 14) p++
  return p
}

export default function Cuenta({ usuario, setUsuario }) {
  const [modo, setModo] = useState(modoDeUrl())
  const [dice, setDice] = useState('Estoy vigilando tu acceso. Nunca compartas tu contraseña con nadie, ni siquiera con el equipo de Orion.')
  useEffect(() => { const f = () => setModo(modoDeUrl()); addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])
  const ori = (t, accion = 'scan') => { setDice(t); gesto('ori', accion) }
  const [f, setF] = useState({ nombre: '', email: '', password: '', municipio: 'Neiva', departamento: 'Huila', rol: 'joven', acepta_datos: false })
  const [perfil, setPerfil] = useState(null)
  const [msg, setMsg] = useState('')
  const cambio = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  useEffect(() => { if (usuario) api('/auth/yo').then(setPerfil).catch(() => {}) }, [usuario])

  const enviar = async (e) => {
    e.preventDefault(); setMsg('')
    try {
      const r = modo === 'login'
        ? await api('/auth/login', { method: 'POST', body: { email: f.email, password: f.password } })
        : await api('/auth/registro', { method: 'POST', body: f })
      sesion.guardar(r.token, r.usuario); setUsuario(r.usuario)
      const saludo = `¡Bienvenido${modo === 'registro' ? '' : ' de nuevo'}, ${r.usuario.nombre.split(' ')[0]}! Soy NOVA. Vamos por tu primer empleo.`
      gesto('nova', 'saluda'); hablar(saludo, 'nova')
      window.location.hash = '#/brechas'
    } catch (err) { setMsg(err.message); ori(err.message, 'alert') }
  }

  const guardarPerfil = async (e) => {
    e.preventDefault()
    try {
      await api('/auth/perfil', { method: 'PUT', body: { ...perfil, experiencia_meses: Number(perfil.experiencia_meses) || 0, competencias: perfil.competencias || [] } })
      setMsg('✅ Perfil actualizado.')
    } catch (err) { setMsg(err.message) }
  }

  if (usuario && perfil) {
    const p = (k) => ({ value: perfil[k] ?? '', onChange: (e) => setPerfil({ ...perfil, [k]: e.target.value }) })
    return (
      <section>
        <h1>Hola, {usuario.nombre.split(' ')[0]} 👋</h1>
        <form className="panel formulario" onSubmit={guardarPerfil}>
          <h2>Mi perfil</h2>
          <label className="campo">Nivel educativo
            <select {...p('nivel_educativo')}>
              <option value="">Selecciona…</option>
              {['Bachiller', 'Técnico', 'Tecnólogo', 'Profesional', 'Posgrado'].map((n) => <option key={n}>{n}</option>)}
            </select>
          </label>
          <label className="campo">Área de interés<input {...p('area_interes')} placeholder="Tecnología, comercio, agro…" /></label>
          <label className="campo">Meses de experiencia<input type="number" min="0" {...p('experiencia_meses')} /></label>
          <label className="campo">Competencias (separadas por coma)
            <input value={(perfil.competencias || []).join(', ')} onChange={(e) => setPerfil({ ...perfil, competencias: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })} />
          </label>
          <label className="campo">Cuéntanos de ti<textarea rows="4" maxLength="2000" {...p('resumen')} /></label>
          <div className="acciones">
            <button className="btn">Guardar</button>
            <button type="button" className="btn btn-sec" onClick={() => { sesion.cerrar(); setUsuario(null); setPerfil(null) }}>Cerrar sesión</button>
          </div>
          {msg && <p className="aviso">{msg}</p>}
        </form>
      </section>
    )
  }

  const nivel = fuerza(f.password)
  const NIVELES = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte']
  return (
    <section className="acceso">
      <aside className="acceso-lado">
        <OriAvatar size={150} />
        <p className="burbuja-personaje" aria-live="polite"><b>ORI:</b> {dice}</p>
        <div className="acceso-nova"><NovaAvatar size={70} /><span>{modo === 'login' ? 'NOVA te espera adentro con tu ruta.' : 'Crea tu cuenta y NOVA arma tu ruta al empleo.'}</span></div>
      </aside>
      <form className="panel formulario" onSubmit={enviar}>
        <h1>{modo === 'login' ? 'Iniciar sesión' : 'Registrarse'}</h1>
        <div className="pestanas" role="tablist">
          <button type="button" role="tab" aria-selected={modo === 'login'} className={modo === 'login' ? 'on' : ''} onClick={() => { window.location.hash = '#/cuenta?modo=login' }}>Iniciar sesión</button>
          <button type="button" role="tab" aria-selected={modo === 'registro'} className={modo === 'registro' ? 'on' : ''} onClick={() => { window.location.hash = '#/cuenta?modo=registro' }}>Registrarse</button>
        </div>
        {modo === 'registro' && <>
          <label className="campo">Nombre completo<input required minLength="2" value={f.nombre} onChange={cambio('nombre')} autoComplete="name" /></label>
          <label className="campo">Soy
            <select value={f.rol} onChange={cambio('rol')}><option value="joven">Joven que busca empleo</option><option value="empresa">Empresa que contrata</option></select>
          </label>
          <label className="campo">Municipio<input value={f.municipio} onChange={cambio('municipio')} /></label>
        </>}
        <label className="campo">Correo<input type="email" required value={f.email} onChange={cambio('email')} autoComplete="email"
          onFocus={() => ori('Revisa que el correo esté bien escrito. Te escribiremos solo desde el dominio de Orion Nova.')} /></label>
        <label className="campo">Contraseña<input type="password" required minLength={modo === 'registro' ? 10 : 1} value={f.password} onChange={cambio('password')}
          autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
          onFocus={() => ori(modo === 'registro' ? 'Usa una frase larga, con mayúsculas, minúsculas y números. Que no sea la misma de tu correo.' : 'Escribe tu contraseña. Yo no la veo ni la guardo en texto.')} /></label>
        {modo === 'registro' && f.password && (
          <div className="fuerza" aria-live="polite"><div className={`fuerza-barra n${nivel}`} style={{ width: `${(nivel / 4) * 100}%` }} /><span>{NIVELES[nivel]}</span></div>
        )}
        {modo === 'registro' && <>
          <p className="tenue">Mínimo 10 caracteres, con mayúsculas, minúsculas y números.</p>
          <label className="check"><input type="checkbox" checked={f.acepta_datos} onChange={cambio('acepta_datos')} required />
            Autorizo a Orion Nova Technologies el tratamiento de mis datos personales según la Ley 1581 de 2012.</label>
        </>}
        <button className="btn btn-ancho">{modo === 'login' ? 'Iniciar sesión' : 'Crear mi cuenta'}</button>
        {msg && <p className="aviso error">{msg}</p>}
        <p className="tenue centro">{modo === 'login'
          ? <>¿No tienes cuenta? <a href="#/cuenta?modo=registro">Regístrate gratis</a></>
          : <>¿Ya tienes cuenta? <a href="#/cuenta?modo=login">Inicia sesión</a></>}</p>
        <p className="tenue centro">🦉 Protegido por ORI SECURITY</p>
      </form>
    </section>
  )
}
