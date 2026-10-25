import React, { useEffect, useState } from 'react'
import { api, sesion } from '../api.js'

export default function Cuenta({ usuario, setUsuario }) {
  const [modo, setModo] = useState('login')
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
    } catch (err) { setMsg(err.message) }
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

  return (
    <section className="cuenta">
      <form className="panel formulario" onSubmit={enviar}>
        <div className="pestanas">
          <button type="button" className={modo === 'login' ? 'on' : ''} onClick={() => setModo('login')}>Ingresar</button>
          <button type="button" className={modo === 'registro' ? 'on' : ''} onClick={() => setModo('registro')}>Crear cuenta</button>
        </div>
        {modo === 'registro' && <>
          <label className="campo">Nombre completo<input required minLength="2" value={f.nombre} onChange={cambio('nombre')} autoComplete="name" /></label>
          <label className="campo">Soy
            <select value={f.rol} onChange={cambio('rol')}><option value="joven">Joven que busca empleo</option><option value="empresa">Empresa que contrata</option></select>
          </label>
          <label className="campo">Municipio<input value={f.municipio} onChange={cambio('municipio')} /></label>
        </>}
        <label className="campo">Correo<input type="email" required value={f.email} onChange={cambio('email')} autoComplete="email" /></label>
        <label className="campo">Contraseña<input type="password" required minLength={modo === 'registro' ? 10 : 1} value={f.password} onChange={cambio('password')} autoComplete={modo === 'login' ? 'current-password' : 'new-password'} /></label>
        {modo === 'registro' && <>
          <p className="tenue">Mínimo 10 caracteres, con mayúsculas, minúsculas y números.</p>
          <label className="check"><input type="checkbox" checked={f.acepta_datos} onChange={cambio('acepta_datos')} required />
            Autorizo a Orion Nova Technologies el tratamiento de mis datos personales según la Ley 1581 de 2012.</label>
        </>}
        <button className="btn">{modo === 'login' ? 'Ingresar' : 'Crear cuenta'}</button>
        {msg && <p className="aviso error">{msg}</p>}
        <p className="tenue">🦉 Protegido por ORI SECURITY</p>
      </form>
    </section>
  )
}
