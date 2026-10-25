import React, { useEffect, useRef, useState } from 'react'
import { api, sesion } from '../api.js'

// Escenarios de práctica (pregunta, opciones, índice correcto)
const ESCENARIOS = {
  entrevista: { titulo: 'Entrevista de trabajo', color: '#1b2a7a', preguntas: [
    ['NOVA: "Háblame de ti"', ['Cuento mi vida desde niño', 'Perfil, logro y por qué este cargo', 'Digo que no sé'], 1],
    ['NOVA: "¿Cuál es tu mayor debilidad?"', ['No tengo ninguna', 'Una real y cómo la mejoro', 'Soy muy perfeccionista y ya'], 1],
    ['NOVA: "¿Tienes preguntas?"', ['No, ninguna', '¿Cuánto pagan y cuándo salgo?', '¿Cómo se mide el éxito en el cargo?'], 2]] },
  atencion: { titulo: 'Atención al cliente', color: '#3b2a6a', preguntas: [
    ['Un cliente llega molesto por un cobro', ['Le digo que no es mi culpa', 'Escucho, valido y busco solución', 'Llamo al jefe sin hablar'], 1],
    ['No tienes la respuesta', ['Invento algo', 'Digo que lo verifico y le doy un plazo', 'Lo ignoro'], 1],
    ['Cierre de la atención', ['Confirmo que quedó resuelto', 'Me voy sin despedirme', 'Le pido que no vuelva'], 0]] },
  soc: { titulo: 'Centro de ciberseguridad con ORI', color: '#0c3a4a', preguntas: [
    ['ORI: 50 intentos de login fallidos en 1 minuto', ['Ignorar', 'Posible fuerza bruta: bloquear IP y alertar', 'Reiniciar el servidor'], 1],
    ['ORI: correo pide "actualizar tu clave" con enlace raro', ['Hacer clic', 'Reportar como phishing', 'Reenviarlo a todos'], 1],
    ['ORI: ¿qué protege mejor una cuenta?', ['Clave corta', 'Misma clave en todo', 'Clave larga + 2 pasos'], 2]] },
  hse: { titulo: 'Seguridad industrial en planta', color: '#4a3a0c', preguntas: [
    ['Ves un derrame de aceite en el pasillo', ['Paso por encima', 'Señalizo y reporto', 'Lo tapo con cartón'], 1],
    ['Antes de intervenir una máquina', ['Bloqueo y etiquetado (LOTO)', 'La toco rápido', 'Pido que la sostengan'], 0],
    ['Tu casco está fisurado', ['Lo uso igual', 'Solicito reemplazo', 'Lo pego con cinta'], 1]] },
  iot: { titulo: 'Montaje de sensores IoT', color: '#0c4a2a', preguntas: [
    ['¿Qué sensor mide temperatura?', ['DHT22', 'LED', 'Relé'], 0],
    ['¿Qué protocolo es ligero para IoT?', ['FTP', 'MQTT', 'SMTP'], 1],
    ['¿Cómo proteges un dispositivo IoT?', ['Clave por defecto', 'Clave única y cifrado', 'Puerto abierto'], 1]] },
}

function Opcion({ texto, y, onElegir }) {
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.addEventListener('click', onElegir)
    return () => el.removeEventListener('click', onElegir)
  }, [onElegir])
  return (
    <a-entity ref={ref} class="clicable" position={`0 ${y} 0.02`}
      geometry="primitive: plane; width: 2.6; height: 0.32" material="color: #2b4bd8; opacity: 0.92"
      animation__hover="property: scale; to: 1.05 1.05 1; startEvents: mouseenter; dur: 150"
      animation__out="property: scale; to: 1 1 1; startEvents: mouseleave; dur: 150"
      text={`value: ${texto.replace(/[;:]/g, ',')}; align: center; color: #ffffff; width: 2.4; wrapCount: 34`} />
  )
}

export default function RealidadVirtual() {
  const [esc, setEsc] = useState('entrevista')
  const [paso, setPaso] = useState(0)
  const [puntos, setPuntos] = useState(0)
  const [inicio] = useState(() => Date.now())
  const [aviso, setAviso] = useState('')
  const hayAframe = typeof window !== 'undefined' && !!window.AFRAME
  const e = ESCENARIOS[esc]
  const terminado = paso >= e.preguntas.length
  const puntaje = Math.round((puntos / e.preguntas.length) * 100)

  const reiniciar = (k) => { setEsc(k); setPaso(0); setPuntos(0); setAviso('') }
  const elegir = (i) => {
    if (i === e.preguntas[paso][2]) setPuntos((p) => p + 1)
    setPaso((p) => p + 1)
  }

  useEffect(() => {
    if (!terminado || !sesion.token) return
    api('/vr/sesiones', { method: 'POST', body: { escenario: esc, puntaje, duracion_seg: Math.round((Date.now() - inicio) / 1000) } })
      .then(() => setAviso('Resultado guardado en tu progreso.')).catch(() => {})
  }, [terminado]) // eslint-disable-line

  return (
    <section>
      <h1>Laboratorio de realidad virtual</h1>
      <p className="lead">Practica situaciones reales de trabajo. Funciona en el celular, en el PC y en visores VR (botón de gafas abajo a la derecha de la escena).</p>
      <div className="chips">
        {Object.entries(ESCENARIOS).map(([k, v]) => (
          <button key={k} className={`chip ${esc === k ? 'on' : ''}`} onClick={() => reiniciar(k)}>{v.titulo}</button>
        ))}
      </div>

      {!hayAframe ? (
        <p className="aviso">No se pudo cargar el motor de realidad virtual (A-Frame). Revisa tu conexión a internet.</p>
      ) : (
        <div className="vr-marco">
          <a-scene embedded vr-mode-ui="enabled: true" renderer="antialias: true" background={`color: ${e.color}`}>
            <a-entity light="type: ambient; intensity: 0.7" />
            <a-entity light="type: directional; intensity: 0.8" position="1 3 2" />
            <a-plane rotation="-90 0 0" width="12" height="12" color="#10142a" />
            <a-box position="0 0.4 -2.6" width="2.4" height="0.1" depth="1" color="#c7cfe0" />
            {/* NOVA entrevistadora */}
            <a-entity position="0 1.35 -3.2" animation="property: position; to: 0 1.42 -3.2; dir: alternate; loop: true; dur: 1600; easing: easeInOutSine">
              <a-sphere radius="0.32" color="#e8edf7" />
              <a-box position="0 0 0.25" width="0.42" height="0.2" depth="0.05" color="#101a55" />
              <a-sphere position="-0.09 0 0.28" radius="0.04" color="#6fb6ff" />
              <a-sphere position="0.09 0 0.28" radius="0.04" color="#6fb6ff" />
              <a-cylinder position="0 -0.55 0" radius="0.28" height="0.6" color="#c7cfe0" />
              <a-sphere position="0 0.42 0" radius="0.05" color="#5b9dff" />
            </a-entity>
            {/* Panel de preguntas */}
            <a-entity position="0 1.6 -2.2">
              <a-plane width="3" height="1.9" color="#05060f" opacity="0.82" />
              {terminado ? (
                <a-entity text={`value: Puntaje ${puntaje}/100\n${puntaje >= 67 ? 'Excelente trabajo' : 'Sigue practicando'}; align: center; color: #ffffff; width: 2.6`} />
              ) : (
                <>
                  <a-entity position="0 0.62 0.02" text={`value: ${e.preguntas[paso][0].replace(/[;:]/g, ',')}; align: center; color: #9fd0ff; width: 2.6; wrapCount: 36`} />
                  {e.preguntas[paso][1].map((o, i) => <Opcion key={`${paso}-${i}`} texto={o} y={0.15 - i * 0.42} onElegir={() => elegir(i)} />)}
                </>
              )}
            </a-entity>
            <a-entity camera look-controls wasd-controls="enabled: false" position="0 1.6 0">
              <a-entity cursor="fuse: true; fuseTimeout: 1500" raycaster="objects: .clicable"
                position="0 0 -1" geometry="primitive: ring; radiusInner: 0.012; radiusOuter: 0.02" material="color: #ffffff; shader: flat" />
            </a-entity>
            <a-entity cursor="rayOrigin: mouse" raycaster="objects: .clicable" />
          </a-scene>
        </div>
      )}
      <div className="acciones">
        <span>Pregunta {Math.min(paso + 1, e.preguntas.length)} de {e.preguntas.length} · Aciertos: {puntos}</span>
        <button className="btn btn-sec" onClick={() => reiniciar(esc)}>Reiniciar escenario</button>
      </div>
      {aviso && <p className="aviso">{aviso}</p>}
      {!sesion.token && <p className="tenue">Inicia sesión para guardar tus resultados.</p>}
    </section>
  )
}
