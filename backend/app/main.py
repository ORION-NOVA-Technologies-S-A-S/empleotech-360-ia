"""EmpleoTech 360 IA · Orion Nova Technologies
Plataforma de empleabilidad inteligente: brechas laborales con datos del DANE,
17 agentes de IA, ciberseguridad (ORI SECURITY), analítica, realidad virtual e IoT."""
import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import db
from .agents import AGENTES
from .config import get_settings
from .routers import agentes, auth, datos, iot
from .security import OriSecurityMiddleware
from .services import mqtt_puente


@asynccontextmanager
async def ciclo_vida(app: FastAPI):
    await db.abrir_pool()
    mqtt = mqtt_puente.iniciar(asyncio.get_running_loop())
    yield
    if mqtt:
        mqtt.loop_stop()
    await db.cerrar_pool()


s = get_settings()
app = FastAPI(title=s.app_nombre, version="1.0.0", lifespan=ciclo_vida,
              description="API de EmpleoTech 360 IA – Orion Nova Technologies")

app.add_middleware(OriSecurityMiddleware)
app.add_middleware(CORSMiddleware, allow_origins=s.origenes, allow_credentials=False,
                   allow_methods=["GET", "POST", "PUT"], allow_headers=["Authorization", "Content-Type", "X-Device-Key"])

for r in (auth.router, agentes.router, datos.router, iot.router):
    app.include_router(r)


@app.get("/api/salud", tags=["Sistema"])
async def salud():
    await db.fetchone("select 1 as ok")
    return {"estado": "ok", "agentes": len(AGENTES), "ia_generativa": bool(s.anthropic_api_key)}


@app.get("/api/contacto", tags=["Sistema"])
async def contacto():
    return {"empresa": s.empresa, "telefono": s.contacto_telefono,
            "whatsapp": f"https://wa.me/{s.contacto_whatsapp}", "ciudad": "Neiva, Huila"}
