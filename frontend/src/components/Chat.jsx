import React, { useEffect, useRef, useState } from 'react'
import { hablarConAgente } from '../api.js'
import { NovaAvatar, OriAvatar } from './Avatares.jsx'
import { callar, cambiarVoz, gesto, hablar, hayVoz, vozActiva } from './vida.js'
import { leerHojaVida } from './leerArchivo.js'

const recordar = {
  get(k) { try { return localStorage.getItem('empleotech.' + k) || '' } catch { return '' } },
  set(k, v) { try { localStorage.setItem('empleotech.' + k, v) } catch {} },
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
  const [voz, setVoz] = useState(vozActiva())
  const [escuchando, setEscuchando] = useState(false)
  const fin = useRef(null)
  const archivo = useRef(null)
  const [leyendo, setLeyendo] = useState(false)
  const esOri = agente === 'ori'

  const enviar = async (msg, extra = {}, destino = agente) => {
    if (!msg.trim() && !extra.respuestas && !extra.hoja_vida_texto && mensajes.length) return
    if (msg.trim()) setMensajes((m) => [...m, { de: 'yo', texto: msg }])
    setTexto(''); setCargando(true)
    gesto(esOri ? 'ori' : 'nova', esOri ? 'scan' : 'asiente')
    try {
      const datos = { competencias, nombre: recordar.get('nombre'), carrera: recordar.get('carrera'), ...extra }
      const r = await hablarConAgente(destino, msg, { territorio, datos })
      if (r.datos?.nombre_detectado) recordar.set('nombre', r.datos.nombre_detectado)
      if (r.datos?.carrera_detectada) recordar.set('carrera', r.datos.carrera_detectada)
      setMensajes((m) => [...m, { de: r.agente, nombre: r.nombre, texto: r.texto, datos: r.datos, bloqueado: r.bloqueado }])
      const quien = r.agente === 'ori' || r.bloqueado ? 'ori' : 'nova'
      gesto(quien, quien === 'ori' ? (r.bloqueado ? 'alert' : 'flap') : 'saluda')
      hablar(r.texto, quien)
    } catch (e) {
      setMensajes((m) => [...m, { de: 'error', texto: e.message }])
    } finally { setCargando(false) }
  }

  // Saludo inicial del agente
  useEffect(() => { setMensajes([]); enviar('') }, [agente]) // eslint-disable-line
  useEffect(() => { fin.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }) }, [mensajes, cargando])
  useEffect(() => () => callar(), [])

  const escuchar = () => {
    const R = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!R) return alert('Tu navegador no permite dictado por voz. Prueba con Chrome.')
    callar()
    const rec = new R(); rec.lang = 'es-CO'; rec.interimResults = false
    rec.onstart = () => setEscuchando(true)
    rec.onend = () => setEscuchando(false)
    rec.onresult = (e) => enviar(e.results[0][0].transcript)
    rec.start()
  }

  const pideHojaVida = agente === 'hoja_vida' || mensajes.some((m) => m.datos?.pedir_hoja_vida)
  const subir = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''
    if (!f) return
    setMensajes((m) => [...m, { de: 'yo', texto: `📎 ${f.name}` }]); setLeyendo(true)
    try {
      const texto = await leerHojaVida(f)
      await enviar('', { hoja_vida_texto: texto }, 'hoja_vida')
    } catch (err) { setMensajes((m) => [...m, { de: 'error', texto: err.message }]) } finally { setLeyendo(false) }
  }

  const alternarVoz = () => { const n = !voz; setVoz(n); cambiarVoz(n); if (n) hablar('Listo, vuelvo a hablar.', esOri ? 'ori' : 'nova') }

  return (
    <div className={`chat ${compacto ? 'compacto' : ''}`}>
      <div className="chat-cabecera">
        {esOri ? <OriAvatar size={46} /> : <NovaAvatar size={56} />}
        <div><strong>{nombre}</strong><span className="tenue"> · {cargando ? 'pensando…' : 'en línea'} · protegido por ORI SECURITY</span></div>
        {hayVoz() && (
          <button className="btn-icono" title={voz ? 'Silenciar la voz' : 'Activar la voz'} aria-pressed={voz} onClick={alternarVoz}>{voz ? '🔊' : '🔇'}</button>
        )}
      </div>
      <div className="chat-cuerpo">
        {mensajes.map((m, i) => (
          <div key={i} className={`msj ${m.de === 'yo' ? 'yo' : m.de === 'error' ? 'error' : m.bloqueado ? 'bloqueado' : 'bot'}`}>
            {m.nombre && m.de !== agente && <span className="msj-de">{m.nombre}</span>}
            <p>{m.texto}</p>
            {m.datos?.acciones && (
              <div className="chips">{m.datos.acciones.map((a) => (
                <a key={a.label} className="chip on" href={a.href} target={/^https?:/.test(a.href) ? '_blank' : undefined} rel="noopener noreferrer">{a.label}</a>
              ))}</div>
            )}
            {m.datos?.sugerencias && (
              <div className="chips">{m.datos.sugerencias.map((s) => <button key={s} className="chip" onClick={() => enviar(s)}>{s}</button>)}</div>
            )}
            {m.datos?.preguntas && m.datos.preguntas[0]?.opciones && (
              <Quiz datos={m.datos} onEnviar={(competencia, respuestas) => enviar('', { competencia, respuestas })} />
            )}
          </div>
        ))}
        {pideHojaVida && (
          <div className="subir-cv">
            <input ref={archivo} type="file" accept=".pdf,.docx,.txt" hidden onChange={subir} />
            <button type="button" className="btn" disabled={leyendo} onClick={() => archivo.current?.click()}>{leyendo ? 'Leyendo tu hoja de vida…' : '📎 Subir mi hoja de vida'}</button>
            <span className="tenue">PDF, Word o texto · máx. 5 MB · se lee en tu navegador y no se guarda</span>
          </div>
        )}
        {(cargando || leyendo) && <div className="msj bot escribiendo"><span /><span /><span /></div>}
        <div ref={fin} />
      </div>
      <form className="chat-entrada" onSubmit={(e) => { e.preventDefault(); enviar(texto) }}>
        <button type="button" className={`btn-icono ${escuchando ? 'escuchando' : ''}`} title="Hablarle por voz" aria-label="Hablarle por voz" onClick={escuchar}>🎙️</button>
        <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={4000}
          placeholder={escuchando ? 'Te escucho…' : `Escríbele a ${agente === 'tutor' ? 'NOVA' : nombre.split(' ·')[0]}…`} aria-label="Mensaje" />
        <button className="btn" disabled={!texto.trim()}>Enviar</button>
      </form>
    </div>
  )
}
