import React from 'react'
import { CONTACTO } from '../api.js'
import { NovaAvatar } from '../components/Avatares.jsx'

export default function Contacto() {
  return (
    <section className="contacto">
      <NovaAvatar size={160} hablando />
      <div>
        <h1>Contacto</h1>
        <p className="lead">¿Eres joven, empresa, colegio, universidad o entidad pública y quieres llevar EmpleoTech 360 IA a tu territorio? Escríbenos.</p>
        <div className="panel">
          <p><b>Orion Nova Technologies</b><br />Neiva, Huila · Colombia</p>
          <p>📱 Teléfono y WhatsApp: <a href={CONTACTO.tel}><b>{CONTACTO.telefono}</b></a></p>
          <div className="acciones">
            <a className="btn btn-wa" href={CONTACTO.whatsapp} target="_blank" rel="noopener noreferrer">Escribir por WhatsApp</a>
            <a className="btn btn-sec" href={CONTACTO.tel}>Llamar</a>
          </div>
        </div>
      </div>
    </section>
  )
}
