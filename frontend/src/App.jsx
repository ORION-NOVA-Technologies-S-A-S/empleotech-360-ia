import React, { useEffect, useState } from 'react'
import { CONTACTO, MODO_DEMO, RECURSO, sesion } from './api.js'
import Chat from './components/Chat.jsx'
import { NovaAvatar } from './components/Avatares.jsx'
import Inicio from './pages/Inicio.jsx'
import Agentes from './pages/Agentes.jsx'
import Brechas from './pages/Brechas.jsx'
import Dane from './pages/Dane.jsx'
import RealidadVirtual from './pages/RealidadVirtual.jsx'
import IoT from './pages/IoT.jsx'
import Seguridad from './pages/Seguridad.jsx'
import Cuenta from './pages/Cuenta.jsx'
import Contacto from './pages/Contacto.jsx'

const RUTAS = {
  inicio: ['Inicio', Inicio], agentes: ['17 Agentes IA', Agentes], brechas: ['Brechas y rutas', Brechas],
  dane: ['Datos DANE', Dane], vr: ['Realidad virtual', RealidadVirtual], iot: ['IoT', IoT],
  seguridad: ['ORI SECURITY', Seguridad], cuenta: ['Mi cuenta', Cuenta], contacto: ['Contacto', Contacto],
}

const rutaActual = () => (window.location.hash.replace('#/', '') || 'inicio').split('?')[0]

export default function App() {
  const [ruta, setRuta] = useState(rutaActual())
  const [usuario, setUsuario] = useState(sesion.usuario)
  const [novaAbierta, setNovaAbierta] = useState(false)

  useEffect(() => {
    const f = () => { setRuta(rutaActual()); window.scrollTo(0, 0) }
    window.addEventListener('hashchange', f)
    return () => window.removeEventListener('hashchange', f)
  }, [])

  const [, Pagina] = RUTAS[ruta] || RUTAS.inicio
  return (
    <>
      <header className="cabecera">
        <a href="#/inicio" className="marca">
          <img src={RECURSO('logo.png')} alt="Orion Nova Technologies" />
          <span><strong>EmpleoTech 360 IA</strong><small>Orion Nova Technologies</small></span>
        </a>
        <nav className="menu" aria-label="Principal">
          {Object.entries(RUTAS).map(([k, [titulo]]) => (
            <a key={k} href={`#/${k}`} className={ruta === k ? 'activo' : ''}>
              {k === 'cuenta' && usuario ? usuario.nombre.split(' ')[0] : titulo}
            </a>
          ))}
        </nav>
      </header>

      {MODO_DEMO && (
        <div className="banda-demo">
          Versión de demostración: funciona en tu navegador con datos de ejemplo. La versión completa usa el servidor Python y PostgreSQL/Supabase.
        </div>
      )}
      <main className="contenedor">
        <Pagina usuario={usuario} setUsuario={setUsuario} />
      </main>

      <footer className="pie">
        <img src={RECURSO('logo.png')} alt="" />
        <div>
          <strong>EmpleoTech 360 IA</strong> · Orion Nova Technologies · Neiva, Huila<br />
          <span className="tenue">Innovamos · Desarrollamos · Conectamos</span>
        </div>
        <a className="btn btn-wa" href={CONTACTO.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp {CONTACTO.telefono}</a>
      </footer>

      {/* NOVA flotante en todas las páginas */}
      <div className={`nova-flotante ${novaAbierta ? 'abierta' : ''}`}>
        {novaAbierta && <Chat agente="nova" nombre="NOVA" compacto />}
        <button className="nova-boton" onClick={() => setNovaAbierta(!novaAbierta)} aria-label={novaAbierta ? 'Cerrar NOVA' : 'Hablar con NOVA'}>
          {novaAbierta ? '✕' : <NovaAvatar size={62} />}
        </button>
      </div>
    </>
  )
}
