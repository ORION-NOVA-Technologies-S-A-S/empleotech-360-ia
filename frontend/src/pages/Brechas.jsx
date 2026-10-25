import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Barras, Kpi } from '../components/Graficos.jsx'

const TERRITORIOS = ['Neiva', 'Huila', 'Nacional']
const pesos = (v) => '$' + Math.round(v).toLocaleString('es-CO')

export default function Brechas({ usuario }) {
  const [territorio, setTerritorio] = useState('Neiva')
  const [catalogo, setCatalogo] = useState([])
  const [mias, setMias] = useState([])
  const [res, setRes] = useState(null)
  const [vacantes, setVacantes] = useState([])
  const [msg, setMsg] = useState('')

  useEffect(() => { api(`/mercado/demanda?territorio=${territorio}`).then(setCatalogo).catch((e) => setMsg(e.message)) }, [territorio])
  useEffect(() => { if (usuario) api('/auth/yo').then((p) => setMias(p.competencias || [])).catch(() => {}) }, [usuario])

  const alternar = (c) => setMias((m) => (m.includes(c) ? m.filter((x) => x !== c) : [...m, c]))

  const analizar = async () => {
    setMsg('')
    try {
      const body = { competencias: mias, territorio }
      const [b, v] = await Promise.all([api('/brechas', { method: 'POST', body }), api('/vacantes/emparejar', { method: 'POST', body })])
      setRes(b); setVacantes(v)
    } catch (e) { setMsg(e.message) }
  }

  const guardar = async () => {
    try {
      const p = await api('/auth/yo')
      await api('/auth/perfil', { method: 'PUT', body: { nivel_educativo: p.nivel_educativo, area_interes: p.area_interes, experiencia_meses: p.experiencia_meses || 0, resumen: p.resumen, competencias: mias } })
      setMsg('✅ Competencias guardadas en tu perfil.')
    } catch (e) { setMsg(e.message) }
  }

  return (
    <section>
      <h1>Brechas laborales y ruta de aprendizaje</h1>
      <p className="lead">Marca lo que ya sabes hacer. Lo comparamos con lo que pide el mercado de tu territorio.</p>

      <div className="panel">
        <label className="campo">Territorio
          <select value={territorio} onChange={(e) => setTerritorio(e.target.value)}>
            {TERRITORIOS.map((t) => <option key={t}>{t}</option>)}
          </select>
        </label>
        <div className="chips">
          {catalogo.map((c) => (
            <button key={c.competencia} className={`chip ${mias.includes(c.competencia) ? 'on' : ''}`} onClick={() => alternar(c.competencia)} aria-pressed={mias.includes(c.competencia)}>
              {mias.includes(c.competencia) ? '✓ ' : ''}{c.competencia}
            </button>
          ))}
        </div>
        <div className="acciones">
          <button className="btn" onClick={analizar}>Analizar mis brechas</button>
          {usuario && <button className="btn btn-sec" onClick={guardar}>Guardar en mi perfil</button>}
        </div>
        {msg && <p className="aviso">{msg}</p>}
      </div>

      {res && (
        <>
          <div className="kpis">
            <Kpi titulo="Cobertura de la demanda" valor={`${res.cobertura}%`} nota={`en ${res.territorio}`} />
            <Kpi titulo="Competencias que ya tienes" valor={res.tiene.length} />
            <Kpi titulo="Brechas detectadas" valor={res.brechas.length} />
          </div>
          {res.es_ejemplo && <p className="aviso">La demanda mostrada es de ejemplo hasta que se carguen fuentes oficiales.</p>}

          <div className="dos-columnas">
            <div className="panel">
              <h2>Brechas prioritarias</h2>
              <Barras datos={res.brechas.slice(0, 8).map((b) => ({ etiqueta: b.competencia, valor: b.prioridad }))} max={120} />
              <p className="tenue">Prioridad = demanda del mercado + la mitad de su crecimiento.</p>
            </div>
            <div className="panel">
              <h2>Tu ruta</h2>
              <ol className="ruta">
                {res.ruta.map((r) => (
                  <li key={r.competencia}>
                    <b>{r.competencia}</b>
                    {r.cursos[0] ? (
                      <span> — <a href={r.cursos[0].url} target="_blank" rel="noopener noreferrer">{r.cursos[0].titulo}</a>
                        {' '}({r.cursos[0].proveedor}, {r.cursos[0].horas} h, {r.cursos[0].modalidad === 'vr' ? 'realidad virtual' : r.cursos[0].modalidad}{r.cursos[0].gratuito ? ', gratis' : ''})</span>
                    ) : <span className="tenue"> — curso por asignar</span>}
                  </li>
                ))}
              </ol>
            </div>
          </div>

          <div className="panel">
            <h2>Vacantes para ti</h2>
            <div className="vacantes">
              {vacantes.map((v) => (
                <article key={v.id} className="vacante">
                  <div className="afinidad" style={{ '--p': v.afinidad }}>{v.afinidad}%</div>
                  <div>
                    <h3>{v.titulo}</h3>
                    <p className="tenue">{v.empresa} · {v.territorio} · {v.modalidad}{v.salario_min ? ` · ${pesos(v.salario_min)} – ${pesos(v.salario_max)}` : ''}</p>
                    {v.faltan.length > 0 ? <p>Te falta: {v.faltan.join(', ')}</p> : <p>✅ Cumples con todas las competencias</p>}
                    {v.es_ejemplo && <span className="pill">ejemplo</span>}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
