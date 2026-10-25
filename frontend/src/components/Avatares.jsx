import React from 'react'

/** NOVA · humanoide animado (parpadea, flota y mueve la boca cuando habla) */
export function NovaAvatar({ size = 140, hablando = false }) {
  return (
    <svg className={`avatar nova ${hablando ? 'hablando' : ''}`} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="NOVA, asistente humanoide">
      <defs>
        <linearGradient id="nv-metal" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#f2f5fb" /><stop offset="1" stopColor="#9aa5bd" />
        </linearGradient>
        <linearGradient id="nv-visor" x1="0" x2="1">
          <stop offset="0" stopColor="#0b1030" /><stop offset="1" stopColor="#1b2a7a" />
        </linearGradient>
        <radialGradient id="nv-ojo"><stop offset="0" stopColor="#d9f3ff" /><stop offset="1" stopColor="#4f8cff" /></radialGradient>
      </defs>
      <g className="flotar">
        <line x1="100" y1="22" x2="100" y2="38" stroke="#9aa5bd" strokeWidth="4" />
        <circle className="antena" cx="100" cy="18" r="7" fill="#5b9dff" />
        <rect x="45" y="36" width="110" height="96" rx="44" fill="url(#nv-metal)" />
        <rect x="35" y="72" width="14" height="30" rx="7" fill="#5b6bb5" />
        <rect x="151" y="72" width="14" height="30" rx="7" fill="#5b6bb5" />
        <rect x="58" y="60" width="84" height="44" rx="22" fill="url(#nv-visor)" />
        <g className="ojos">
          <ellipse cx="82" cy="82" rx="9" ry="9" fill="url(#nv-ojo)" />
          <ellipse cx="118" cy="82" rx="9" ry="9" fill="url(#nv-ojo)" />
        </g>
        <g className="boca" fill="#5b9dff">
          <rect x="84" y="112" width="5" height="8" rx="2.5" />
          <rect x="92" y="110" width="5" height="12" rx="2.5" />
          <rect x="100" y="108" width="5" height="16" rx="2.5" />
          <rect x="108" y="110" width="5" height="12" rx="2.5" />
        </g>
        <path d="M60 140 Q100 128 140 140 L150 196 H50 Z" fill="url(#nv-metal)" />
        <circle cx="100" cy="164" r="13" fill="#0b1030" stroke="#5b9dff" strokeWidth="3" />
        <path d="M100 154 l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#e8f1ff" />
      </g>
    </svg>
  )
}

/** ORI SECURITY · búho guardián con escudo, candado, monóculo y chaqueta negra */
export function OriAvatar({ size = 110, alerta = false }) {
  return (
    <svg className={`avatar ori ${alerta ? 'alerta' : ''}`} width={size} height={size} viewBox="0 0 200 200" role="img" aria-label="ORI SECURITY, búho de ciberseguridad">
      <g className="flotar-lento">
        <path d="M52 52 L66 22 L82 48 Z M148 52 L134 22 L118 48 Z" fill="#6c5a45" />
        <ellipse cx="100" cy="74" rx="56" ry="46" fill="#8a7358" />
        <ellipse cx="100" cy="80" rx="46" ry="34" fill="#e9dcc6" />
        <circle cx="78" cy="76" r="17" fill="#fff" /><circle cx="122" cy="76" r="17" fill="#fff" />
        <g className="ojos">
          <circle cx="78" cy="77" r="8" fill="#1a1a2e" /><circle cx="122" cy="77" r="8" fill="#1a1a2e" />
          <circle cx="81" cy="74" r="2.5" fill="#fff" /><circle cx="125" cy="74" r="2.5" fill="#fff" />
        </g>
        <circle className="monoculo" cx="122" cy="76" r="21" fill="none" stroke="#38e1ff" strokeWidth="4" />
        <line x1="141" y1="86" x2="152" y2="118" stroke="#38e1ff" strokeWidth="2" />
        <path d="M94 92 L100 104 L106 92 Z" fill="#f2a83b" />
        {/* chaqueta negra */}
        <path d="M44 118 Q100 100 156 118 L164 196 H36 Z" fill="#0d0f17" />
        <path d="M100 112 L86 196 M100 112 L114 196" stroke="#2a2f45" strokeWidth="3" />
        <circle cx="66" cy="140" r="7" fill="#4f6cff" /><path d="M63 140 l3-4 3 4-3 4z" fill="#fff" />
        {/* escudo con candado */}
        <path className="escudo" d="M100 128 L128 138 V160 Q128 182 100 192 Q72 182 72 160 V138 Z" fill="#3d5cff" stroke="#9fb4ff" strokeWidth="3" />
        <rect x="89" y="157" width="22" height="18" rx="3" fill="#e8eeff" />
        <path d="M93 157 v-6 a7 7 0 0 1 14 0 v6" fill="none" stroke="#e8eeff" strokeWidth="3.5" />
        <circle cx="100" cy="166" r="2.6" fill="#3d5cff" />
        {/* pulgar arriba */}
        <g className="pulgar">
          <rect x="148" y="132" width="22" height="20" rx="6" fill="#8a7358" />
          <rect x="155" y="114" width="9" height="22" rx="4.5" fill="#8a7358" />
        </g>
      </g>
    </svg>
  )
}
