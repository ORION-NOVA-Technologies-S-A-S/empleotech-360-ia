import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { NovaAvatar, OriAvatar } from '../components/Avatares.jsx'
import { Kpi } from '../components/Graficos.jsx'

const PILARES = [
  ['🧠', 'Inteligencia artificial', '17 agentes que detectan brechas, arman rutas, evalúan y conectan con vacantes.'],
  ['📊', 'Analítica de datos', 'Indicadores del DANE (GEIH) y demanda de competencias por territorio.'],
  ['🛡️', 'Ciberseguridad', 'ORI SECURITY protege cuentas, datos personales y a los agentes de manipulación.'],
  ['🥽', 'Realidad virtual', 'Simulaciones de entrevistas y puestos de trabajo desde el celular o un visor VR.'],
  ['📡', 'IoT', 'Kioscos, sensores de aula y asistencia conectados en las sedes de formación.'],
]

export default function Inicio() {
  const [ind, setInd] = useState([])
  useEffect(() => { api('/dane/indicadores?territorio=Neiva').then(setInd).catch(() => {}) }, [])
  const ultimo = ind.length ? ind.reduce((a, b) => (a.periodo > b.periodo ? a : b)).periodo : null
  const valor = (t, g, i) => ind.find((x) => x.periodo === ultimo && x.territorio === t && x.grupo === g && x.indicador === i)?.valor
  const ejemplo = ind.some((x) => x.es_ejemplo)

  return (
    <>
      <section className="heroe">
        <div>
          <span className="etiqueta">Plataforma de empleabilidad inteligente</span>
          <h1>Del dato del DANE<br /><em>al primer empleo.</em></h1>
          <p className="lead">EmpleoTech 360 IA identifica las brechas laborales de tu territorio y te guía, con 17 agentes de
            inteligencia artificial, a desarrollar las competencias que el mercado está pidiendo hoy.</p>
          <div className="acciones">
            <a className="btn" href="#/brechas">Descubrir mis brechas</a>
            <a className="btn btn-sec" href="#/cuenta">Crear mi cuenta</a>
          </div>
        </div>
        <div className="heroe-personajes">
          <div className="burbuja">¡Hola! Soy <b>NOVA</b>, tu asistente.</div>
          <NovaAvatar size={210} hablando />
          <div className="ori-mini"><OriAvatar size={120} /><span>ORI te cuida 🛡️</span></div>
        </div>
      </section>

      <section>
        <h2>El reto en cifras {ultimo && <small className="tenue">· DANE GEIH {ultimo}</small>}</h2>
        <div className="kpis">
          <Kpi titulo="Desempleo juvenil · Neiva" valor={valor('Neiva', 'Jóvenes 15-28', 'TD') != null ? `${valor('Neiva', 'Jóvenes 15-28', 'TD')}%` : '—'} />
          <Kpi titulo="Desempleo juvenil · Nacional" valor={valor('Nacional', 'Jóvenes 15-28', 'TD') != null ? `${valor('Nacional', 'Jóvenes 15-28', 'TD')}%` : '—'} />
          <Kpi titulo="Informalidad juvenil" valor={valor('Nacional', 'Jóvenes 15-28', 'Informalidad') != null ? `${valor('Nacional', 'Jóvenes 15-28', 'Informalidad')}%` : '—'} />
          <Kpi titulo="Jóvenes que no estudian ni trabajan" valor={valor('Nacional', 'Jóvenes 15-28', 'NiNi') != null ? `${valor('Nacional', 'Jóvenes 15-28', 'NiNi')}%` : '—'} />
        </div>
        {ejemplo && <p className="aviso">Cifras de ejemplo para la demostración. El administrador carga las oficiales del DANE con el importador.</p>}
      </section>

      <section>
        <h2>Cinco tecnologías, un propósito</h2>
        <div className="tarjetas">
          {PILARES.map(([i, t, d]) => <article className="tarjeta" key={t}><span className="icono">{i}</span><h3>{t}</h3><p>{d}</p></article>)}
        </div>
      </section>

      <section className="pasos">
        <h2>¿Cómo funciona?</h2>
        <ol>
          <li><b>Diagnóstico.</b> Cuéntale a NOVA qué sabes hacer; el analizador de perfil extrae tus competencias.</li>
          <li><b>Brechas.</b> Las comparamos con la demanda real de tu territorio y los datos del DANE.</li>
          <li><b>Ruta.</b> Recibes un plan de cursos (gratis primero), tutoría IA y práctica en realidad virtual.</li>
          <li><b>Empleo.</b> El emparejador te muestra vacantes reales y qué te falta para cada una.</li>
        </ol>
      </section>
    </>
  )
}
