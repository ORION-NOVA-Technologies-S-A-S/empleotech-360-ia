import React, { useEffect, useState } from 'react'
import { api } from '../api.js'

const ICONOS = { kiosco: '🖥️', sensor_aula: '🌡️', lector_asistencia: '🪪', kit_robotica: '🤖' }

export default function IoT({ usuario }) {
  const [datos, setDatos] = useState([])
  const [error, setError] = useState('')
  const [nuevo, setNuevo] = useState({ id: '', nombre: '', tipo: 'sensor_aula', sede: 'Neiva' })
  const [clave, setClave] = useState(null)

  const cargar = () => api('/iot/resumen').then(setDatos).catch((e) => setError(e.message))
  useEffect(() => { cargar(); const t = setInterval(cargar, 15000); return () => clearInterval(t) }, [])

  const registrar = async (e) => {
    e.preventDefault()
    try { setClave(await api('/iot/dispositivos', { method: 'POST', body: nuevo })); cargar() } catch (err) { setError(err.message) }
  }

  return (
    <section>
      <h1>IoT en las sedes de formación</h1>
      <p className="lead">Kioscos de orientación, sensores de aula (temperatura, CO₂, ocupación) y lectores de asistencia. Se actualiza cada 15 segundos.</p>
      {error && <p className="aviso error">{error}</p>}
      <div className="tabla-envoltura">
        <table>
          <thead><tr><th>Dispositivo</th><th>Sede</th><th>Métrica</th><th>Promedio 24 h</th><th>Lecturas</th><th>Última</th></tr></thead>
          <tbody>
            {datos.length === 0 && <tr><td colSpan="6" className="tenue">Aún no hay dispositivos registrados.</td></tr>}
            {datos.map((d, i) => (
              <tr key={i}>
                <td>{ICONOS[d.tipo]} {d.nombre}</td><td>{d.sede}</td><td>{d.metrica || '—'}</td>
                <td>{d.promedio ?? '—'}</td><td>{d.lecturas}</td>
                <td>{d.ultima ? new Date(d.ultima).toLocaleString('es-CO') : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {usuario?.rol === 'admin' && (
        <form className="panel formulario" onSubmit={registrar}>
          <h2>Registrar dispositivo</h2>
          <label className="campo">Identificador<input required pattern="[a-z0-9\-]{3,40}" value={nuevo.id} onChange={(e) => setNuevo({ ...nuevo, id: e.target.value })} placeholder="aula-neiva-01" /></label>
          <label className="campo">Nombre<input required value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} /></label>
          <label className="campo">Tipo
            <select value={nuevo.tipo} onChange={(e) => setNuevo({ ...nuevo, tipo: e.target.value })}>
              {Object.keys(ICONOS).map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </label>
          <label className="campo">Sede<input required value={nuevo.sede} onChange={(e) => setNuevo({ ...nuevo, sede: e.target.value })} /></label>
          <button className="btn">Registrar</button>
          {clave && <p className="aviso">Clave del dispositivo <code>{clave.api_key}</code> — guárdela, no se vuelve a mostrar.</p>}
        </form>
      )}

    </section>
  )
}
