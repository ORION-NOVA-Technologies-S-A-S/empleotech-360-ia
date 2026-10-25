import React, { useEffect, useMemo, useState } from 'react'
import { api } from '../api.js'
import { Barras, Kpi } from '../components/Graficos.jsx'
import SelectorTerritorio from '../components/SelectorTerritorio.jsx'

const pesos = (v) => '$' + Math.round(v).toLocaleString('es-CO')
const NIVELES = ['Todos', 'Profesional', 'Tecnólogo', 'Técnico']
const COLOR_TIPO = { 'De la carrera': 'var(--azul)', 'Pide el mercado': '#f5b544', Transversal: '#8fc3ff', 'Demanda general': 'var(--azul)' }
const norm = (t) => (t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
const carreraDeUrl = () => new URLSearchParams(window.location.hash.split('?')[1] || '').get('carrera') || ''

export default function Brechas({ usuario }) {
  const [carreras, setCarreras] = useState([])
  const [nivel, setNivel] = useState('Todos')
  const [area, setArea] = useState('Todas')
  const [busca, setBusca] = useState('')
  const [carreraId, setCarreraId] = useState(carreraDeUrl())
  const [lugar, setLugar] = useState({ departamento: 'Huila', municipio: 'Neiva' })
  const [mias, setMias] = useState([])
  const [res, setRes] = useState(null)
  const [vacantes, setVacantes] = useState([])
  const [msg, setMsg] = useState('')
  const [generales, setGenerales] = useState([])

  useEffect(() => { api('/carreras').then(setCarreras).catch((e) => setMsg(e.message)); api('/mercado/demanda?territorio=Nacional').then((d) => setGenerales(d.map((x) => x.competencia))).catch(() => {}) }, [])
  useEffect(() => { if (usuario) api('/auth/yo').then((p) => setMias(p.competencias || [])).catch(() => {}) }, [usuario])
  useEffect(() => { const f = () => { const c = carreraDeUrl(); if (c) setCarreraId(c) }; addEventListener('hashchange', f); return () => removeEventListener('hashchange', f) }, [])

  const areas = useMemo(() => ['Todas', ...new Set(carreras.map((c) => c.area))], [carreras])
  const filtradas = carreras.filter((c) => (nivel === 'Todos' || c.nivel === nivel) && (area === 'Todas' || c.area === area) && (!busca || norm(c.nombre).includes(norm(busca))))
  const carrera = carreras.find((c) => c.id === carreraId)
  const lista = carrera ? [...new Set([...carrera.competencias, ...carrera.mercado, ...carrera.transversales])] : []

  useEffect(() => { setRes(null) }, [carreraId])
  const alternar = (c) => setMias((m) => (m.includes(c) ? m.filter((x) => x !== c) : [...m, c]))

  const analizar = async () => {
    setMsg('')
    try {
      const body = { carrera_id: carreraId || null, competencias: mias, departamento: lugar.departamento, municipio: lugar.municipio }
      const [b, v] = await Promise.all([api('/brechas', { method: 'POST', body }), api('/vacantes/emparejar', { method: 'POST', body })])
      setRes(b); setVacantes(v)
      setTimeout(() => document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch (e) { setMsg(e.message) }
  }

  const guardar = async () => {
    try {
      const p = await api('/auth/yo')
      await api('/auth/perfil', { method: 'PUT', body: { nivel_educativo: p.nivel_educativo, area_interes: carrera?.nombre || p.area_interes, experiencia_meses: p.experiencia_meses || 0, resumen: p.resumen, competencias: mias } })
      setMsg('✅ Competencias guardadas en tu perfil.')
    } catch (e) { setMsg(e.message) }
  }

  return (
    <section>
      <h1>Brechas laborales por carrera</h1>
      <p className="lead">Elige tu carrera o programa, marca lo que ya dominas y te mostramos qué te pide el mercado de tu territorio y cómo cerrar la brecha.</p>

      <div className="panel">
        <h2>1. Tu carrera</h2>
        <div className="filtros">
          <label className="campo">Buscar<input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Ej.: enfermería, sistemas, contaduría…" /></label>
          <label className="campo">Nivel<select value={nivel} onChange={(e) => setNivel(e.target.value)}>{NIVELES.map((n) => <option key={n}>{n}</option>)}</select></label>
          <label className="campo">Área del conocimiento<select value={area} onChange={(e) => setArea(e.target.value)}>{areas.map((a) => <option key={a}>{a}</option>)}</select></label>
        </div>
        <div className="carreras">
          {filtradas.map((c) => (
            <button key={c.id} className={`carrera ${c.id === carreraId ? 'activo' : ''}`} onClick={() => { setCarreraId(c.id); setMias((m) => m.filter((x) => [...c.competencias, ...c.mercado, ...c.transversales].includes(x))) }}>
              <b>{c.nombre}</b><small>{c.nivel} · {c.sector}</small>
            </button>
          ))}
          {!filtradas.length && <p className="tenue">No encontramos esa carrera. Prueba con otra palabra.</p>}
        </div>
        <p className="tenue">{carreras.length} carreras y programas (profesionales, tecnólogos y técnicos). Puedes analizar también sin carrera, con la demanda general.</p>
      </div>

      {carrera && (
        <div className="panel perfil-carrera">
          <h2>2. Perfil de {carrera.nombre}</h2>
          <p><span className="pill">{carrera.nivel}</span> <span className="pill">{carrera.area}</span> <span className="pill">Sector: {carrera.sector}</span></p>
          <p className="lead">{carrera.perfil}</p>
          <p>Marca las competencias que <b>ya dominas</b>:</p>
          {[['De la carrera', carrera.competencias], ['Lo que además pide el mercado', carrera.mercado], ['Transversales', carrera.transversales]].map(([t, l]) => (
            <div key={t}>
              <h3 className="area">{t}</h3>
              <div className="chips">{l.map((c) => (
                <button key={c} className={`chip ${mias.includes(c) ? 'on' : ''}`} onClick={() => alternar(c)} aria-pressed={mias.includes(c)}>{mias.includes(c) ? '✓ ' : ''}{c}</button>
              ))}</div>
            </div>
          ))}
          <p className="tenue">Llevas {mias.filter((m) => lista.includes(m)).length} de {lista.length} competencias del perfil.</p>
        </div>
      )}

      {!carrera && (
        <div className="panel">
          <h2>2. Sin carrera: marca lo que ya dominas</h2>
          <div className="chips">{generales.map((c) => (
            <button key={c} className={`chip ${mias.includes(c) ? 'on' : ''}`} onClick={() => alternar(c)} aria-pressed={mias.includes(c)}>{mias.includes(c) ? '✓ ' : ''}{c}</button>
          ))}</div>
        </div>
      )}

      <div className="panel">
        <h2>3. Tu territorio</h2>
        <SelectorTerritorio valor={lugar} onCambio={setLugar} />
        <div className="acciones">
          <button className="btn" onClick={analizar}>Evaluar mis brechas</button>
          {usuario && <button className="btn btn-sec" onClick={guardar}>Guardar en mi perfil</button>}
        </div>
        {msg && <p className="aviso">{msg}</p>}
      </div>

      {res && (
        <div id="resultado">
          <div className="kpis">
            <Kpi titulo="Cobertura del perfil" valor={`${res.cobertura}%`} nota={res.carrera ? res.carrera.nombre : 'Demanda general'} />
            <Kpi titulo="Competencias que ya tienes" valor={res.tiene.length} />
            <Kpi titulo="Brechas por cerrar" valor={res.brechas.length} />
          </div>
          <p className="aviso">El índice de demanda por competencia es de ejemplo hasta conectar fuentes de vacantes (Servicio Público de Empleo). Las cifras de desempleo de la sección DANE sí son oficiales.</p>

          <div className="dos-columnas">
            <div className="panel">
              <h2>Brechas prioritarias</h2>
              <Barras datos={res.brechas.slice(0, 10).map((b) => ({ etiqueta: b.competencia, valor: b.prioridad, color: COLOR_TIPO[b.tipo] }))} max={Math.max(130, ...res.brechas.map((b) => b.prioridad))} />
              <p className="tenue"><span style={{ color: 'var(--azul)' }}>■</span> De la carrera · <span style={{ color: '#f5b544' }}>■</span> Pide el mercado · <span style={{ color: '#8fc3ff' }}>■</span> Transversal</p>
            </div>
            <div className="panel">
              <h2>Tu ruta de aprendizaje</h2>
              <ol className="ruta">
                {res.ruta.map((r) => (
                  <li key={r.competencia}>
                    <b>{r.competencia}</b> — <a href={r.cursos[0].url} target="_blank" rel="noopener noreferrer">{r.cursos[0].titulo}</a>
                    {!r.cursos[0].sugerido && <> ({r.cursos[0].proveedor}, {r.cursos[0].horas} h, {r.cursos[0].modalidad === 'vr' ? 'realidad virtual' : r.cursos[0].modalidad}{r.cursos[0].gratuito ? ', gratis' : ''})</>}
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
        </div>
      )}
    </section>
  )
}
