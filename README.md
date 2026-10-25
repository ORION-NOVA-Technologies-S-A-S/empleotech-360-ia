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

## Demo en línea

**https://empleotech.orionnovatechnologies.com** (GitHub Pages; se publica sola con cada cambio en `main`).
La demo funciona en el navegador: NOVA conversa, recuerda tu nombre y tu carrera; ORI (el mismo de ORION CORE) da consejos y bloquea manipulaciones.

## Acceso

Botones **Iniciar sesión** y **Registrarse** en la cabecera, con ORI guiando la seguridad de la contraseña (Argon2id, bloqueo por intentos y autorización de la Ley 1581). En la demo de GitHub Pages las cuentas viven solo en el navegador; en producción, en PostgreSQL/Supabase.

## Carreras, territorios y datos del DANE

- `database/datos/carreras.json`: **73 carreras y programas** (profesionales, tecnólogos y técnicos) con su perfil, las competencias de la carrera, lo que además pide el mercado y las transversales. Se pueden agregar más editando el archivo.
- `database/datos/territorios.json`: **33 departamentos (incluido Bogotá D.C.) y 1.105 municipios** (lista base de [marcovega/colombia-json](https://github.com/marcovega/colombia-json), licencia MIT).
- `database/datos/indicadores_dane.json`: **cifras oficiales de la GEIH** con su boletín de origen:
  - Nacional 2025 (TD 8,9 %) y jóvenes 15-28 años may–jul 2026 (TD 14,1 %, ninis 20,6 %).
  - 23 departamentos, año 2025 (boletín *Mercado laboral por departamentos*).
  - 23 ciudades y áreas metropolitanas, oct–dic 2025. Las marcadas con nota se leyeron del gráfico del boletín: verifíquelas en el anexo oficial.
- El DANE no publica la GEIH para todos los departamentos ni municipios; para esos la plataforma muestra la cifra más cercana y lo avisa.
- El **índice de demanda por competencia, los cursos y las vacantes siguen siendo de ejemplo** hasta conectar fuentes reales (Servicio Público de Empleo, convenios con empresas).

## Los 17 agentes

| # | Agente | Área | Qué hace |
|---|---|---|---|
| 1 | **NOVA** · asistente humanoide | IA | Conversa, recuerda tu nombre y carrera, y enruta al agente experto |
| 2 | **ORI SECURITY** | Ciberseguridad | Detecta fraudes en ofertas, bloquea manipulación, auditoría |
| 3 | Analista DANE | Analítica | Cifras oficiales: nacional, departamento y ciudad |
| 4 | Detector de brechas | Analítica | Perfil de la carrera + lo que pide el mercado vs. lo que el joven domina |
| 5 | Analizador de perfil | IA | Extrae competencias de un texto libre |
| 6 | Radar de tendencias | Analítica | Competencias que más crecen |
| 7 | Diseñador de rutas | IA | Brechas → plan de cursos en **Orion Nova Academy** |
| 8 | Tutor IA · **Clases con NOVA** | IA | Clases cortas: concepto, ejemplo y mini reto (`database/datos/lecciones.json`) |
| 9 | Evaluador de competencias | IA | Pruebas cortas y registro de puntaje |
| 10 | Emparejador de vacantes | IA | % de afinidad y qué falta para cada vacante |
| 11 | Coach de entrevistas | IA | Simulación con método STAR |
| 12 | Revisor de hoja de vida | IA | El joven sube su hoja de vida (PDF, Word o texto); NOVA dice qué fortalecer y cómo mejorarla. El archivo se lee en el navegador |
| 13 | Orientador vocacional | IA | Gustos ↔ carreras y sectores con demanda |
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
2. Ejecute en orden: `database/01_schema.sql`, `database/02_datos_iniciales.sql` y **`database/03_supabase_seguridad.sql`** (activa RLS: la API pública solo lee cursos, vacantes e indicadores; los datos personales quedan cerrados).
3. Copie la cadena del **Transaction pooler** (Project Settings → Database) en `DATABASE_URL` del `.env` con `?sslmode=require`.
4. `docker compose up -d --build` (sin el perfil `local`, no se crea Postgres local).

> La clave `service_role` de Supabase **nunca** va en el frontend. El backend usa la cadena de conexión; el navegador solo habla con el backend.

## Datos oficiales del DANE

La base trae las cifras oficiales indicadas arriba. Para cargar boletines nuevos:

1. Descargue los boletines o anexos de **Mercado laboral** en dane.gov.co.
2. Arme un CSV: `periodo,periodo_nombre,nivel,territorio,departamento,grupo,indicador,valor,url` (nivel: `Nacional`, `Departamento` o `Municipio`; indicadores: `TD`, `TO`, `TGP`, `Informalidad`, `NiNi`).
3. `docker compose exec backend python -m scripts.importar_dane /ruta/datos.csv`

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
