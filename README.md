# EmpleoTech 360 IA
**Plataforma de empleabilidad inteligente · Orion Nova Technologies**
*Innovamos · Desarrollamos · Conectamos* — Neiva, Huila · 📱 WhatsApp **300 444 0009**

EmpleoTech 360 IA identifica las **brechas laborales** de cada territorio con datos del **DANE (GEIH)** y guía a los jóvenes, con **17 agentes de inteligencia artificial**, a adquirir las competencias que pide el mercado para llegar a vacantes reales.

| Tecnología | Cómo se usa |
|---|---|
| 🧠 Inteligencia artificial | 17 agentes; NOVA orquesta. IA generativa opcional (API de Claude) con motor de reglas propio si no hay clave |
| 📊 Analítica de datos | Indicadores DANE, índice de demanda, cálculo de brechas, rutas y afinidad con vacantes |
| 🛡️ Ciberseguridad | **ORI SECURITY**: Argon2id, JWT, límite de peticiones, bloqueo por intentos, antimanipulación de IA, enmascarado de datos personales, RLS en Supabase, auditoría |
| 🥽 Realidad virtual | Laboratorio WebXR (A-Frame): entrevista, atención al cliente, SOC con ORI, HSE, montaje IoT |
| 📡 IoT | Dispositivos con clave propia por HTTP o MQTT (kioscos, sensores de aula, asistencia) |

**Pila:** React 18 + Vite (JavaScript) · Python 3.12 + FastAPI · PostgreSQL 16 / Supabase · PostgREST · Docker · Nginx · Mosquitto (MQTT).

---

## Los 17 agentes

| # | Agente | Área | Qué hace |
|---|---|---|---|
| 1 | **NOVA** · asistente humanoide | IA | Conversa y enruta al agente experto |
| 2 | **ORI SECURITY** | Ciberseguridad | Detecta fraudes en ofertas, bloquea manipulación, auditoría |
| 3 | Analista DANE | Analítica | Explica desempleo, informalidad y ninis por territorio |
| 4 | Detector de brechas | Analítica | Compara competencias del joven vs. demanda del territorio |
| 5 | Analizador de perfil | IA | Extrae competencias de un texto libre |
| 6 | Radar de tendencias | Analítica | Competencias que más crecen |
| 7 | Diseñador de rutas | IA | Brechas → plan de cursos (gratis primero) |
| 8 | Tutor IA | IA | Explica temas paso a paso |
| 9 | Evaluador de competencias | IA | Pruebas cortas y registro de puntaje |
| 10 | Emparejador de vacantes | IA | % de afinidad y qué falta para cada vacante |
| 11 | Coach de entrevistas | IA | Simulación con método STAR |
| 12 | Generador de hoja de vida | IA | Borrador con palabras clave |
| 13 | Orientador vocacional | IA | Gustos ↔ sectores con demanda |
| 14 | Mentor de habilidades blandas | IA | Retos de comunicación y trabajo en equipo |
| 15 | Laboratorio VR | Realidad virtual | Escenarios inmersivos |
| 16 | Monitor IoT | IoT | Estado de sensores y kioscos |
| 17 | Analítica de impacto | Analítica | KPIs para entidades y aliados |

Código: `backend/app/agents/agentes.py`.

---

## Opción A · Todo local con Docker

```bash
cp .env.example .env            # cambie JWT_SECRET y POSTGRES_PASSWORD
docker compose --profile local up -d --build
docker compose exec backend python -m scripts.crear_admin carlosdanielculmap@gmail.com "Carlos Culma" "Clave-Muy-Segura-2026"
```
- Plataforma: http://localhost:8080
- API y documentación: http://localhost:8000/docs
- PostgREST (catálogos públicos, solo lectura): http://localhost:3000/cursos

## Opción B · Base de datos en Supabase (recomendado en producción)

1. En Supabase cree un proyecto (o use el de NOVA) y abra **SQL Editor**.
2. Ejecute en orden: `database/01_schema.sql`, `database/02_seed_ejemplo.sql` y **`database/03_supabase_seguridad.sql`** (activa RLS: la API pública solo lee cursos, vacantes e indicadores; los datos personales quedan cerrados).
3. Copie la cadena del **Transaction pooler** (Project Settings → Database) en `DATABASE_URL` del `.env` con `?sslmode=require`.
4. `docker compose up -d --build` (sin el perfil `local`, no se crea Postgres local).

> La clave `service_role` de Supabase **nunca** va en el frontend. El backend usa la cadena de conexión; el navegador solo habla con el backend.

## Datos oficiales del DANE

Las cifras incluidas son **de ejemplo** (`es_ejemplo = true`) y la plataforma lo avisa en pantalla. Para cargar las oficiales:

1. Descargue los anexos de **Mercado laboral** y **Mercado laboral de la juventud** en dane.gov.co.
2. Arme un CSV: `periodo,territorio,grupo,indicador,valor,unidad` (indicadores: `TD`, `TO`, `TGP`, `Informalidad`, `NiNi`).
3. `docker compose exec backend python -m scripts.importar_dane /ruta/datos.csv --borrar-ejemplos`

La demanda de competencias (`competencias_demandadas`) y las vacantes también vienen de ejemplo: conéctelas con fuentes como el Servicio Público de Empleo o convenios con empresas.

## IA generativa

Sin clave, cada agente responde con datos de la plataforma y reglas propias. Con `ANTHROPIC_API_KEY` en `.env`, los agentes redactan con IA; ORI enmascara correos, teléfonos y documentos antes de enviar cualquier texto.

## IoT

```bash
# Registrar dispositivo (como admin, desde la página IoT) → entrega una clave iot_...
python iot/simulador_sensor.py http://localhost:8080 aula-neiva-01 iot_LACLAVE
```
MQTT: cree `iot/passwd` con `mosquitto_passwd`, ponga `MQTT_HOST=mqtt` y levante `docker compose --profile iot up -d`.

## Desarrollo sin Docker

```bash
cd backend && pip install -r requirements.txt && uvicorn app.main:app --reload
cd frontend && npm install && npm run dev      # http://localhost:5173
```

## Estructura

```
backend/   FastAPI · agentes · ORI SECURITY · scripts (importar_dane, crear_admin)
frontend/  React + Vite · NOVA y ORI animados · VR · Nginx
database/  01 esquema · 02 datos de ejemplo · 03 seguridad Supabase (RLS)
iot/       Mosquitto y simulador de sensor
```

## Seguridad y datos personales
- Autorización expresa de tratamiento de datos (Ley 1581 de 2012) en el registro.
- Antes de producción: cambie `JWT_SECRET`, use HTTPS (Cloudflare), restrinja `CORS_ORIGENES` a su dominio y revise la bitácora de ORI.

---
© 2026 Orion Nova Technologies · Contacto: WhatsApp 300 444 0009
