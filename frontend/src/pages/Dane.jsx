import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { Barras, Linea } from '../components/Graficos.jsx'

const NOMBRES = { TD: 'Tasa de desempleo', TO: 'Tasa de ocupación', TGP: 'Participación global', Informalidad: 'Informalidad', NiNi: 'Ni estudian ni trabajan' }
const mes = (p) => new Date(p + 'T00:00:00').toLocaleDateString('es-CO', { month: 'short', year: '2-digit' })

export default function Dane() {
  const [territorio, setTerritorio] = useState('Neiva')
  const [ind, setInd] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { api(`/dane/indicadores?territorio=${territorio}`).then(setInd).catch((e) => setError(e.message)) }, [territorio])

  const ultimo = ind.length ? ind.reduce((a, b) => (a.periodo > b.periodo ? a : b)).periodo : null
  const recientes = ind.filter((i) => i.periodo === ultimo)
  const serie = ind.filter((i) => i.territorio === territorio && i.grupo === 'Jóvenes 15-28' && i.indicador === 'TD')
    .map((i) => ({ etiqueta: mes(i.periodo), valor: i.valor }))

  return (
    <section>
      <h1>Mercado laboral con datos del DANE</h1>
      <p className="lead">Indicadores de la Gran Encuesta Integrada de Hogares (GEIH). El Analista DANE los explica en el chat.</p>
      <label className="campo">Territorio
        <select value={territorio} onChange={(e) => setTerritorio(e.target.value)}>
          <option>Neiva</option><option>Huila</option><option>Nacional</option>
        </select>
      </label>
      {error && <p className="aviso error">{error}</p>}
      {ind.some((i) => i.es_ejemplo) && <p className="aviso">Hay cifras de ejemplo cargadas. Importe las oficiales con <code>python -m scripts.importar_dane</code>.</p>}
      <div className="dos-columnas">
        <div className="panel">
          <h2>Desempleo juvenil en {territorio}</h2>
          <Linea puntos={serie} />
        </div>
        <div className="panel">
          <h2>Último periodo {ultimo && `(${mes(ultimo)})`}</h2>
          <Barras sufijo="%" datos={recientes.map((i) => ({ etiqueta: `${NOMBRES[i.indicador] || i.indicador} · ${i.grupo} · ${i.territorio}`, valor: i.valor }))} />
        </div>
      </div>
      <p className="tenue">Fuente: DANE – GEIH. EmpleoTech 360 IA no modifica las cifras oficiales; solo las organiza y explica.</p>
    </section>
  )
}
