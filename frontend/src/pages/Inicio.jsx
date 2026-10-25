import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { NovaAvatar, OriAvatar } from '../components/Avatares.jsx'
import { CONSEJOS_ORI, gesto, hablar } from '../components/vida.js'
import { Kpi } from '../components/Graficos.jsx'

const PILARES = [
  ['🧠', 'Inteligencia artificial', '17 agentes que detectan brechas, arman rutas, evalúan y conectan con vacantes.'],
  ['📊', 'Analítica de datos', 'Indicadores del DANE (GEIH) y demanda de competencias por territorio.'],
  ['🛡️', 'Ciberseguridad', 'ORI SECURITY protege cuentas, datos personales y a los agentes de manipulación.'],
  ['🥽', 'Realidad virtual', 'Simulaciones de entrevistas y puestos de trabajo desde el celular o un visor VR.'],
  ['📡', 'IoT', 'Kioscos, sensores de aula y asistencia conectados en las sedes de formación.'],
]

const SALUDOS_NOVA = [
  '¡Hola! Soy NOVA. Toca el botón azul de abajo y conversemos sobre tu futuro laboral.',
  '¿Sabías que en Colombia el 14,1% de los jóvenes busca empleo y no lo encuentra? Yo te ayudo a ser del otro grupo.',
  'Cuéntame qué estudias y te digo qué te pide el mercado. ¡Tengo más de 70 carreras con su perfil!',
  'Practica tu entrevista conmigo en realidad virtual. La primera vez da nervios; la tercera, ya no.',
]

export default function Inicio() {
  const [c, setC] = useState(null)
  const [diceNova, setDiceNova] = useState(SALUDOS_NOVA[0])
  const [diceOri, setDiceOri] = useState('Soy ORI, el guardián de ORION CORE. Tócame y te doy un consejo de seguridad.')
  const [iN, setIN] = useState(0)
  const [iO, setIO] = useState(-1)
  useEffect(() => { api('/dane/consulta?departamento=Huila&municipio=Neiva').then(setC).catch(() => {}) }, [])
  const v = (filas, ind, grupo = 'Total') => filas?.find((x) => x.indicador === ind && x.grupo === grupo)
  const pct = (f) => (f ? `${String(f.valor).replace('.', ',')}%` : '—')

  const tocarNova = () => { const n = (iN + 1) % SALUDOS_NOVA.length; setIN(n); setDiceNova(SALUDOS_NOVA[n]); gesto('nova', 'saluda'); hablar(SALUDOS_NOVA[n], 'nova') }
  const tocarOri = () => { const n = (iO + 1) % CONSEJOS_ORI.length; setIO(n); const t = CONSEJOS_ORI[n]; setDiceOri(t); gesto('ori', 'tilt'); gesto('ori', 'flap'); hablar(t, 'ori') }

  return (
    <>
      <section className="heroe">
        <div>
          <span className="etiqueta">Plataforma de empleabilidad inteligente</span>
          <h1>Del dato del DANE<br /><em>al primer empleo.</em></h1>
          <p className="lead">EmpleoTech 360 IA identifica las brechas laborales de tu territorio y te guía, con 17 agentes de
            inteligencia artificial, a desarrollar las competencias que el mercado está pidiendo hoy.</p>
          <div className="acciones">
            <a className="btn" href="#/brechas">Evaluar mi carrera</a>
            <a className="btn btn-sec" href="#/cuenta?modo=registro">Crear mi cuenta</a>
          </div>
        </div>
        <div className="heroe-personajes">
          <div className="personaje-con-burbuja nova-lado">
            <p className="burbuja-personaje" aria-live="polite">{diceNova}</p>
            <NovaAvatar size={220} onClick={tocarNova} />
            <span className="tenue">Toca a NOVA</span>
          </div>
          <div className="personaje-con-burbuja ori-lado">
            <p className="burbuja-personaje" aria-live="polite"><b>ORI:</b> {diceOri}</p>
            <OriAvatar size={130} onClick={tocarOri} />
          </div>
        </div>
      </section>

      <section>
        <h2>El reto en cifras <small className="tenue">· DANE, GEIH</small></h2>
        <div className="kpis">
          <Kpi titulo="Desempleo nacional" valor={pct(v(c?.nacional, 'TD'))} nota="Año 2025" />
          <Kpi titulo="Desempleo jóvenes 15-28 años" valor={pct(v(c?.nacional, 'TD', 'Jóvenes 15-28'))} nota="Nacional, may–jul 2026" />
          <Kpi titulo="Jóvenes que ni estudian ni trabajan" valor={pct(v(c?.nacional, 'NiNi', 'Jóvenes 15-28'))} nota="Nacional, may–jul 2026" />
          <Kpi titulo="Desempleo Huila" valor={pct(v(c?.departamento, 'TD'))} nota={`Año 2025 · Neiva ${pct(v(c?.municipio, 'TD'))} (oct–dic)`} />
        </div>
        <p className="tenue">Fuente: DANE – Gran Encuesta Integrada de Hogares. <a href="#/dane">Ver por departamento y municipio →</a></p>
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
          <li><b>Diagnóstico.</b> Elige tu carrera entre más de 70 programas y marca lo que ya dominas, o cuéntaselo a NOVA.</li>
          <li><b>Brechas.</b> Las comparamos con la demanda real de tu territorio y los datos del DANE.</li>
          <li><b>Ruta.</b> Recibes un plan de cursos (gratis primero), tutoría IA y práctica en realidad virtual.</li>
          <li><b>Empleo.</b> El emparejador te muestra vacantes reales y qué te falta para cada una.</li>
        </ol>
      </section>
    </>
  )
}
