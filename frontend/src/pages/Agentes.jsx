import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import Chat from '../components/Chat.jsx'

export default function Agentes({ usuario }) {
  const [agentes, setAgentes] = useState([])
  const [sel, setSel] = useState(null)
  const [error, setError] = useState('')
  const [competencias, setCompetencias] = useState([])

  useEffect(() => {
    api('/agentes').then((a) => { setAgentes(a); setSel(a[0]) }).catch((e) => setError(e.message))
    if (usuario) api('/auth/yo').then((p) => setCompetencias(p.competencias || [])).catch(() => {})
  }, [usuario])

  const areas = [...new Set(agentes.map((a) => a.area))]
  return (
    <section>
      <h1>Los 17 agentes de EmpleoTech 360 IA</h1>
      <p className="lead">Cada agente es experto en una parte del camino al empleo. NOVA los coordina y ORI SECURITY revisa cada mensaje.</p>
      {error && <p className="aviso error">{error}</p>}
      <div className="agentes-layout">
        <div className="agentes-lista">
          {areas.map((area) => (
            <div key={area}>
              <h3 className="area">{area}</h3>
              {agentes.filter((a) => a.area === area).map((a) => (
                <button key={a.id} className={`agente ${sel?.id === a.id ? 'activo' : ''}`} onClick={() => setSel(a)}>
                  <span className="icono">{a.icono}</span>
                  <span><b>{a.nombre}</b><small>{a.descripcion}</small></span>
                </button>
              ))}
            </div>
          ))}
        </div>
        {sel && <Chat key={sel.id} agente={sel.id} nombre={sel.nombre} competencias={competencias} />}
      </div>
    </section>
  )
}
