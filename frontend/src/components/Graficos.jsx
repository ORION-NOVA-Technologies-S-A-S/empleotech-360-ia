import React from 'react'

/** Barras horizontales sencillas (sin librerías) */
export function Barras({ datos, max = 100, sufijo = '', color = 'var(--azul)' }) {
  return (
    <div className="barras">
      {datos.map((d) => (
        <div className="barra" key={d.etiqueta}>
          <span className="barra-etq">{d.etiqueta}</span>
          <div className="barra-pista">
            <div className="barra-relleno" style={{ width: `${Math.min(100, (d.valor / max) * 100)}%`, background: d.color || color }} />
          </div>
          <span className="barra-val">{d.valor}{sufijo}</span>
        </div>
      ))}
    </div>
  )
}

/** Línea temporal en SVG */
export function Linea({ puntos, alto = 160, sufijo = '%' }) {
  if (!puntos.length) return <p className="tenue">Sin datos.</p>
  const ancho = 520, m = 28
  const vals = puntos.map((p) => p.valor)
  const min = Math.min(...vals) - 1, max = Math.max(...vals) + 1
  const x = (i) => m + (i * (ancho - 2 * m)) / Math.max(1, puntos.length - 1)
  const y = (v) => alto - m - ((v - min) / (max - min)) * (alto - 2 * m)
  const d = puntos.map((p, i) => `${i ? 'L' : 'M'}${x(i)},${y(p.valor)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${ancho} ${alto}`} className="linea" role="img" aria-label="Evolución del indicador">
      <path d={d} fill="none" stroke="var(--azul)" strokeWidth="3" />
      {puntos.map((p, i) => (
        <g key={p.etiqueta}>
          <circle cx={x(i)} cy={y(p.valor)} r="5" fill="var(--azul-claro)" />
          <text x={x(i)} y={y(p.valor) - 10} textAnchor="middle" className="linea-val">{p.valor}{sufijo}</text>
          <text x={x(i)} y={alto - 6} textAnchor="middle" className="linea-etq">{p.etiqueta}</text>
        </g>
      ))}
    </svg>
  )
}

export function Kpi({ titulo, valor, nota }) {
  return (
    <div className="kpi">
      <span className="kpi-titulo">{titulo}</span>
      <strong className="kpi-valor">{valor}</strong>
      {nota && <span className="kpi-nota">{nota}</span>}
    </div>
  )
}
