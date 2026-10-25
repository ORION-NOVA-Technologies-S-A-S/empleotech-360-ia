import React, { useEffect, useRef, useState } from 'react'
import { hablarConAgente } from '../api.js'
import { NovaAvatar, OriAvatar } from './Avatares.jsx'

function hablar(texto, activo) {
  if (!activo || !('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texto.replace(/[•#*]/g, '').slice(0, 500))
  u.lang = 'es-CO'
  window.speechSynthesis.speak(u)
}

function Quiz({ datos, onEnviar }) {
  const [resp, setResp] = useState([])
  return (
    <div className="quiz">
      {datos.preguntas.map((p, i) => (
        <fieldset key={i}>
          <legend>{i + 1}. {p.texto}</legend>
          {p.opciones.map((o, j) => (
            <label key={j}>
              <input type="radio" name={`p${i}`} checked={resp[i] === j}
                onChange={() => setResp((r) => { const n = [...r]; n[i] = j; return n })} /> {o}
            </label>
          ))}
        </fieldset>
      ))}
      <button className="btn" disabled={resp.filter((x) => x !== undefined).length < datos.preguntas.length}
        onClick={() => onEnviar(datos.competencia, resp)}>Calificar</button>
    </div>
  )
}

export default function Chat({ agente = 'nova', nombre = 'NOVA', competencias = [], territorio = 'Neiva', compacto = false }) {
  const [mensajes, setMensajes] = useState([])
  const [texto, setTexto] = useState('')
  const [cargando, setCargando] = useState(false)
  const [voz, setVoz] = useState(false)
  const fin = useRef(null)

  const enviar = async (msg, extra = {}) => {
    if (!msg.trim() && !extra.respuestas && mensajes.length) return
    if (msg.trim()) setMensajes((m) => [...m, { de: 'yo', texto: msg }])
    setTexto(''); setCargando(true)
    try {
      const r = await hablarConAgente(agente, msg, { territorio, datos: { competencias, ...extra } })
      setMensajes((m) => [...m, { de: r.agente, nombre: r.nombre, texto: r.texto, datos: r.datos, bloqueado: r.bloqueado }])
      hablar(r.texto, voz)
    } catch (e) {
      setMensajes((m) => [...m, { de: 'error', texto: e.message }])
    } finally { setCargando(false) }
  }

  // Saludo inicial del agente
  useEffect(() => { setMensajes([]); enviar('') }, [agente]) // eslint-disable-line
  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [mensajes, cargando])

  const escuchar = () => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!R) return alert('Tu navegador no permite dictado por voz.')
    const rec = new R(); rec.lang = 'es-CO'
    rec.onresult = (e) => enviar(e.results[0][0].transcript)
    rec.start()
  }

  return (
    <div className={`chat ${compacto ? 'compacto' : ''}`}>
      <div className="chat-cabecera">
        {agente === 'ori' ? <OriAvatar size={56} /> : <NovaAvatar size={56} hablando={cargando} />}
        <div><strong>{nombre}</strong><span className="tenue"> · protegido por ORI SECURITY</span></div>
        <button className="btn-icono" title="Leer respuestas en voz alta" aria-pressed={voz} onClick={() => setVoz(!voz)}>{voz ? '🔊' : '🔈'}</button>
      </div>
      <div className="chat-cuerpo">
        {mensajes.map((m, i) => (
          <div key={i} className={`msj ${m.de === 'yo' ? 'yo' : m.de === 'error' ? 'error' : m.bloqueado ? 'bloqueado' : 'bot'}`}>
            {m.nombre && m.de !== agente && <span className="msj-de">{m.nombre}</span>}
            <p>{m.texto}</p>
            {m.datos?.sugerencias && (
              <div className="chips">{m.datos.sugerencias.map((s) => <button key={s} className="chip" onClick={() => enviar(s)}>{s}</button>)}</div>
            )}
            {m.datos?.preguntas && m.datos.preguntas[0]?.opciones && (
              <Quiz datos={m.datos} onEnviar={(competencia, respuestas) => enviar('', { competencia, respuestas })} />
            )}
          </div>
        ))}
        {cargando && <div className="msj bot escribiendo"><span /><span /><span /></div>}
        <div ref={fin} />
      </div>
      <form className="chat-entrada" onSubmit={(e) => { e.preventDefault(); enviar(texto) }}>
        <button type="button" className="btn-icono" title="Hablar" onClick={escuchar}>🎙️</button>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={4000}
          placeholder={`Escríbele a ${nombre}…`} aria-label="Mensaje" />
        <button className="btn" disabled={cargando || !texto.trim()}>Enviar</button>
      </form>
    </div>
  )
}
