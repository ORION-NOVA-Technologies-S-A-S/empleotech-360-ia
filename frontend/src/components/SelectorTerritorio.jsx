import React, { useEffect, useState } from 'react'
import { api } from '../api.js'

/** Nacional → Departamento → Municipio (33 departamentos y 1.105 municipios) */
export default function SelectorTerritorio({ valor, onCambio }) {
  const [deps, setDeps] = useState([])
  useEffect(() => { api('/territorios').then(setDeps).catch(() => {}) }, [])
  const municipios = deps.find((d) => d.departamento === valor.departamento)?.municipios || []
  return (
    <div className="filtros">
      <label className="campo">Departamento
        <select value={valor.departamento || ''} onChange={(e) => onCambio({ departamento: e.target.value || null, municipio: null })}>
          <option value="">Nacional (todo el país)</option>
          {deps.map((d) => <option key={d.departamento} value={d.departamento}>{d.departamento}</option>)}
        </select>
      </label>
      <label className="campo">Municipio
        <select value={valor.municipio || ''} disabled={!valor.departamento} onChange={(e) => onCambio({ ...valor, municipio: e.target.value || null })}>
          <option value="">{valor.departamento ? `Todo ${valor.departamento}` : '—'}</option>
          {municipios.map((m) => <option key={m}>{m}</option>)}
        </select>
      </label>
    </div>
  )
}
