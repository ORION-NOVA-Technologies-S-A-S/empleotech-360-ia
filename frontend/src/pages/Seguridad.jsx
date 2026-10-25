import React, { useEffect, useState } from 'react'
import { api } from '../api.js'
import { OriAvatar } from '../components/Avatares.jsx'
import Chat from '../components/Chat.jsx'
import { CONSEJOS_ORI, gesto, hablar } from '../components/vida.js'

const CAPAS = [
  ['🔐', 'Contraseñas Argon2id', 'Las claves nunca se guardan en texto; se exige longitud y variedad.'],
  ['🎫', 'Sesiones JWT cortas', 'Las sesiones vencen en 60 minutos y viven solo en la pestaña.'],
  ['🚦', 'Límite de peticiones', 'Frena ataques de fuerza bruta y abuso de la API por IP.'],
  ['⛔', 'Bloqueo por intentos', 'Tras 5 intentos fallidos la cuenta se bloquea 15 minutos.'],
  ['🧠', 'Antimanipulación de IA', 'Cada mensaje se revisa contra inyección de instrucciones antes de llegar a un agente.'],
  ['🙈', 'Datos personales enmascarados', 'Correos, teléfonos y documentos se ocultan antes de consultar un modelo de IA.'],
  ['🗄️', 'RLS en Supabase', 'La API pública solo lee catálogos; los datos personales pasan únicamente por el backend.'],
  ['📜', 'Auditoría', 'Inicios de sesión, bloqueos y alertas quedan en la bitácora de ORI.'],
]

export default function Seguridad({ usuario }) {
  const [eventos, setEventos] = useState([])
  useEffect(() => { if (usuario?.rol === 'admin') api('/seguridad/eventos').then(setEventos).catch(() => {}) }, [usuario])
  const [consejo, setConsejo] = useState('Tócame y te doy un consejo de seguridad.')
  const tocar = () => { const t = CONSEJOS_ORI[Math.floor(Math.random() * CONSEJOS_ORI.length)]; setConsejo(t); gesto('ori', 'tilt'); gesto('ori', 'flap'); hablar(t, 'ori') }
  const graves = eventos.filter((e) => ['alta', 'critica'].includes(e.severidad)).length

  return (
    <section>
      <div className="ori-cabecera">
        <OriAvatar size={150} alerta={graves > 0} onClick={tocar} />
        <div>
          <h1>ORI SECURITY</h1>
          <p className="lead">El búho guardián de ORION CORE protege la plataforma y te enseña a buscar empleo sin caer en fraudes.</p>
          <p className="burbuja-personaje" aria-live="polite"><b>ORI:</b> {consejo}</p>
        </div>
      </div>
      <div className="tarjetas">
        {CAPAS.map(([i, t, d]) => <article className="tarjeta" key={t}><span className="icono">{i}</span><h3>{t}</h3><p>{d}</p></article>)}
      </div>

      <h2>Pregúntale a ORI si una oferta es real</h2>
      <Chat agente="ori" nombre="ORI SECURITY" />

      {usuario?.rol === 'admin' && (
        <div className="panel">
          <h2>Bitácora de seguridad {graves > 0 && <span className="pill alerta">{graves} alertas altas</span>}</h2>
          <div className="tabla-envoltura">
            <table>
              <thead><tr><th>Fecha</th><th>Evento</th><th>Severidad</th><th>IP</th><th>Detalle</th></tr></thead>
              <tbody>
                {eventos.map((e) => (
                  <tr key={e.id} className={`sev-${e.severidad}`}>
                    <td>{new Date(e.creado_en).toLocaleString('es-CO')}</td><td>{e.evento}</td><td>{e.severidad}</td>
                    <td>{e.ip || '—'}</td><td><code>{JSON.stringify(e.detalle)}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  )
}
