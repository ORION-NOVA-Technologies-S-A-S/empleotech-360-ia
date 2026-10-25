import React from 'react'

/** Definiciones SVG de ORI (diseño oficial de ORION CORE). Se monta una sola vez en App. */
export function SpritePersonajes() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
      <defs>
        <linearGradient id="g-owl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8a5e3a" /><stop offset="1" stopColor="#5a3a22" /></linearGradient>
        <linearGradient id="g-hood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b2340" /><stop offset="1" stopColor="#0b0f1f" /></linearGradient>
        <radialGradient id="g-iris" cx=".45" cy=".4" r=".6"><stop offset="0" stopColor="#9fe3ff" /><stop offset=".5" stopColor="#2f86ff" /><stop offset="1" stopColor="#123a9a" /></radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.4" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
        <linearGradient id="nv-metal" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#f2f5fb" /><stop offset="1" stopColor="#9aa5bd" /></linearGradient>
        <linearGradient id="nv-visor" x1="0" x2="1"><stop offset="0" stopColor="#0b1030" /><stop offset="1" stopColor="#1b2a7a" /></linearGradient>
        <radialGradient id="nv-ojo"><stop offset="0" stopColor="#d9f3ff" /><stop offset="1" stopColor="#4f8cff" /></radialGradient>
        <symbol id="ori" viewBox="0 0 260 340">
          <ellipse cx="130" cy="330" rx="80" ry="8" fill="#000" opacity=".45" />
          <path d="M44 330 Q36 214 130 186 Q224 214 216 330 Z" fill="url(#g-hood)" />
          <path d="M96 200 Q130 270 164 200 Q150 192 130 190 Q110 192 96 200 Z" fill="#d6b88e" />
          <path d="M108 212 q8 6 16 0 M136 212 q8 6 16 0 M118 232 q12 7 24 0" stroke="#a9845b" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M96 200 Q130 280 164 200" fill="none" stroke="#2a3460" strokeWidth="6" />
          <circle cx="176" cy="262" r="15" fill="none" stroke="#53c6ff" strokeWidth="4" filter="url(#glow)" />
          <circle cx="176" cy="262" r="5" fill="#53c6ff" />
          <text x="176" y="300" textAnchor="middle" fontFamily="Exo 2, Arial, sans-serif" fontWeight="700" fontSize="18" fill="#cdd4e6" letterSpacing="1">ORI</text>
          <path className="ori-wing" d="M50 300 Q30 250 60 222 Q74 260 72 304 Z" fill="url(#g-owl)" />
          <g className="ori-head">
            <path className="ori-tuft" d="M64 70 L50 18 L98 52 Z" fill="#6b4529" />
            <path className="ori-tuft" d="M196 70 L210 18 L162 52 Z" fill="#6b4529" />
            <ellipse cx="130" cy="112" rx="92" ry="80" fill="url(#g-owl)" />
            <path d="M130 70 Q60 56 52 116 Q56 168 130 170 Q204 168 208 116 Q200 56 130 70 Z" fill="#c99d6c" />
            <path d="M130 74 L130 96" stroke="#8a5e3a" strokeWidth="4" strokeLinecap="round" />
            <path className="ori-brow" d="M70 80 Q96 64 120 84" stroke="#4a2f1b" strokeWidth="7" fill="none" strokeLinecap="round" />
            <path className="ori-brow" d="M140 84 Q164 64 190 80" stroke="#4a2f1b" strokeWidth="7" fill="none" strokeLinecap="round" />
            <g className="blink late"><circle cx="96" cy="116" r="28" fill="#f4efe6" /><g className="ori-pupil"><circle cx="98" cy="118" r="18" fill="url(#g-iris)" /><circle cx="98" cy="118" r="8" fill="#050816" /><circle cx="92" cy="111" r="4.5" fill="#fff" /></g></g>
            <g className="blink late"><circle cx="164" cy="116" r="28" fill="#f4efe6" /><g className="ori-pupil"><circle cx="162" cy="118" r="18" fill="url(#g-iris)" /><circle cx="162" cy="118" r="8" fill="#050816" /><circle cx="156" cy="111" r="4.5" fill="#fff" /></g></g>
            <g filter="url(#glow)">
              <circle cx="164" cy="116" r="35" fill="none" stroke="#53c6ff" strokeWidth="4" />
              <g className="ring-spin ori-ring"><circle cx="164" cy="116" r="41" fill="none" stroke="#53c6ff" strokeWidth="2" strokeDasharray="6 9" opacity=".8" /></g>
              <path d="M199 116 H222 L230 128" stroke="#53c6ff" strokeWidth="3" fill="none" strokeLinecap="round" />
              <circle cx="230" cy="128" r="3.5" fill="#53c6ff" />
            </g>
            <path className="ori-jaw" d="M123 150 L137 150 L130 165 Z" fill="#c98a24" />
            <path d="M120 140 Q130 134 140 140 L130 156 Z" fill="#e3a43a" />
            <path d="M120 140 Q130 134 140 140" stroke="#b97b1e" strokeWidth="2" fill="none" />
          </g>
        </symbol>
      </defs>
    </svg>
  )
}

/** ORI · búho guardián de ORION CORE */
export function OriAvatar({ size = 110, alerta = false, onClick, titulo = 'ORI, el búho de seguridad' }) {
  const svg = <svg className="flotar-lento" viewBox="0 0 260 340" width={size} height={size * 340 / 260} role="img" aria-label={titulo}><use href="#ori" /></svg>
  const cls = `ori-host ${alerta ? 'ori-alert' : ''}`
  return onClick
    ? <button type="button" className={`personaje ${cls}`} onClick={onClick} aria-label={`${titulo}. Tócalo para un consejo`}>{svg}</button>
    : <span className={`personaje ${cls}`}>{svg}</span>
}

/** NOVA · humanoide: sigue el puntero con la mirada, parpadea, saluda y mueve la boca al hablar */
export function NovaAvatar({ size = 140, hablando = false, onClick }) {
  const svg = (
    <svg width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="NOVA, asistente humanoide">
      <g className="flotar">
        <line x1="100" y1="22" x2="100" y2="38" stroke="#9aa5bd" strokeWidth="4" />
        <circle className="antena" cx="100" cy="18" r="7" fill="#5b9dff" />
        <g className="nova-cabeza">
          <rect x="45" y="36" width="110" height="96" rx="44" fill="url(#nv-metal)" />
          <rect x="35" y="72" width="14" height="30" rx="7" fill="#5b6bb5" />
          <rect x="151" y="72" width="14" height="30" rx="7" fill="#5b6bb5" />
          <rect x="58" y="60" width="84" height="44" rx="22" fill="url(#nv-visor)" />
          <g className="ojos nova-pupila">
            <ellipse cx="82" cy="82" rx="9" ry="9" fill="url(#nv-ojo)" />
            <ellipse cx="118" cy="82" rx="9" ry="9" fill="url(#nv-ojo)" />
          </g>
          <g className="boca" fill="#5b9dff">
            <rect x="84" y="112" width="5" height="8" rx="2.5" />
            <rect x="92" y="110" width="5" height="12" rx="2.5" />
            <rect x="100" y="108" width="5" height="16" rx="2.5" />
            <rect x="108" y="110" width="5" height="12" rx="2.5" />
          </g>
        </g>
        <path className="nova-brazo" d="M146 146 Q170 132 176 108" stroke="url(#nv-metal)" strokeWidth="12" fill="none" strokeLinecap="round" />
        <circle className="nova-brazo" cx="177" cy="104" r="9" fill="#e8edf7" />
        <path d="M60 140 Q100 128 140 140 L150 196 H50 Z" fill="url(#nv-metal)" />
        <circle cx="100" cy="164" r="13" fill="#0b1030" stroke="#5b9dff" strokeWidth="3" />
        <path d="M100 154 l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#e8f1ff" />
      </g>
    </svg>
  )
  const cls = `personaje nova-host ${hablando ? 'nova-talking' : ''}`
  return onClick
    ? <button type="button" className={cls} onClick={onClick} aria-label="NOVA, tócala para hablar">{svg}</button>
    : <span className={cls}>{svg}</span>
}
