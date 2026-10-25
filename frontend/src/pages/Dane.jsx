import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Barras, Kpi } from '../components/Graficos.jsx'
import SelectorTerritorio from '../components/SelectorTerritorio.jsx'

const v = (filas, ind, grupo = 'Total') => filas?.find((i) => i.indicador === ind && i.grupo === grupo)
const pct = (f) => (f ? `${String(f.valor).replace('.', ',')}%` : '—')
const FUENTES = [
  ['Mercado laboral por departamentos, año 2025', 'https://www.dane.gov.co/files/operaciones/GEIH/bol-GEIHDepartamentos-2025.pdf'],
  ['GEIH, boletín diciembre 2025 (nacional y 23 ciudades)', 'https://www.dane.gov.co/files/operaciones/GEIH/bol-GEIH-dic2025.pdf'],
  ['Mercado laboral de la juventud, mayo–julio 2026', 'https://www.dane.gov.co/files/operaciones/GEIH/bol-GEIHMLJ-may-jul2026.pdf'],
]

export default function Dane() {
  const [lugar, setLugar] = useState({ departamento: 'Huila', municipio: 'Neiva' })
  const [c, setC] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    const q = new URLSearchParams()
    if (lugar.departamento) q.set('departamento', lugar.departamento)
    if (lugar.municipio) q.set('municipio', lugar.municipio)
    api(`/dane/consulta?${q}`).then(setC).catch((e) => setError(e.message))
  }, [lugar])

  const td = v(c?.nacional, 'TD'), juv = v(c?.nacional, 'TD', 'Jóvenes 15-28')
  const juvAnt = c?.nacional.find((i) => i.indicador === 'TD' && i.grupo === 'Jóvenes 15-28' && i.periodo_nombre === 'May–jul 2025')
  const resaltar = lugar.departamento

  return (
    <section>
      <h1>Mercado laboral con datos oficiales del DANE</h1>
      <p className="lead">Cifras de la Gran Encuesta Integrada de Hogares (GEIH): nacional, por departamento y por ciudad. Elige tu territorio.</p>
      <div className="panel"><SelectorTerritorio valor={lugar} onCambio={setLugar} /></div>
      {error && <p className="aviso error">{error}</p>}

      {c && (
        <>
          <h2>🇨🇴 Nacional</h2>
          <div className="kpis">
            <Kpi titulo="Desempleo nacional" valor={pct(td)} nota={td?.periodo_nombre} />
            <Kpi titulo="Ocupación nacional" valor={pct(v(c.nacional, 'TO'))} nota="Año 2025" />
            <Kpi titulo="Desempleo jóvenes 15-28" valor={pct(juv)} nota={`${juv?.periodo_nombre} (antes ${pct(juvAnt)})`} />
            <Kpi titulo="Jóvenes que ni estudian ni trabajan" valor={pct(v(c.nacional, 'NiNi', 'Jóvenes 15-28'))} nota="May–jul 2026" />
          </div>

          {lugar.departamento && c.departamento.length > 0 && (
            <>
              <h2>📍 {lugar.departamento} <small className="tenue">· año 2025</small></h2>
              <div className="kpis">
                <Kpi titulo="Desempleo" valor={pct(v(c.departamento, 'TD'))} nota={`Nacional: ${pct(td)}`} />
                <Kpi titulo="Ocupación" valor={pct(v(c.departamento, 'TO'))} />
                <Kpi titulo="Participación global" valor={pct(v(c.departamento, 'TGP'))} />
              </div>
            </>
          )}

          {lugar.municipio && c.municipio.length > 0 && (
            <>
              <h2>🏙️ {lugar.municipio} <small className="tenue">· oct–dic 2025</small></h2>
              <div className="kpis"><Kpi titulo="Desempleo de la ciudad" valor={pct(v(c.municipio, 'TD'))} nota={c.municipio[0].nota || 'Texto del boletín'} /></div>
            </>
          )}

          {c.avisos.map((a) => <p key={a} className="aviso">{a}</p>)}

          <div className="dos-columnas">
            <div className="panel">
              <h2>Desempleo por departamento (2025)</h2>
              <Barras sufijo="%" max={14} datos={c.ranking.map((r) => ({ etiqueta: r.territorio, valor: r.valor, color: r.territorio === resaltar ? '#f5b544' : undefined }))} />
            </div>
            <div className="panel">
              <h2>Desempleo por ciudad (oct–dic 2025)</h2>
              <Barras sufijo="%" max={24} datos={c.ciudades.map((r) => ({ etiqueta: r.territorio + (r.nota ? ' *' : ''), valor: r.valor, color: r.territorio === lugar.municipio ? '#f5b544' : undefined }))} />
              <p className="tenue">* Valor leído del gráfico del boletín; verifíquelo en el anexo oficial.</p>
            </div>
          </div>
        </>
      )}

      <div className="panel">
        <h2>Fuentes oficiales</h2>
        <ul>{FUENTES.map(([t, u]) => <li key={u}><a href={u} target="_blank" rel="noopener noreferrer">{t}</a></li>)}</ul>
        <p className="tenue">El DANE publica cifras anuales para 23 departamentos y el desempleo municipal para 23 ciudades y áreas metropolitanas. Para los demás territorios la plataforma muestra la cifra más cercana disponible y lo indica. Los administradores pueden cargar nuevos boletines con el importador.</p>
      </div>
    </section>
  )
}
