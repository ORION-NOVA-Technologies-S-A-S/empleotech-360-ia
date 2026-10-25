"""
ORI SECURITY · capa de ciberseguridad de EmpleoTech 360 IA
- Contraseñas con Argon2id
- JWT de corta duración
- Límite de peticiones por IP
- Bloqueo por intentos fallidos de inicio de sesión
- Detección de inyección de instrucciones (prompt injection) hacia los agentes
- Enmascarado de datos personales antes de enviarlos a un modelo de IA
- Cabeceras HTTP seguras y bitácora de auditoría
"""
import hashlib
import json
import re
import secrets
import time
from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse

from . import db
from .config import get_settings

_ph = PasswordHasher()
_bearer = HTTPBearer(auto_error=False)


# ---------------- Contraseñas ----------------
def hash_password(clave: str) -> str:
    return _ph.hash(clave)


def verificar_password(hash_: str, clave: str) -> bool:
    try:
        return _ph.verify(hash_, clave)
    except VerifyMismatchError:
        return False


def politica_password(clave: str) -> str | None:
    if len(clave) < 10:
        return "La contraseña debe tener al menos 10 caracteres."
    if not re.search(r"[A-Z]", clave) or not re.search(r"[a-z]", clave) or not re.search(r"\d", clave):
        return "Use mayúsculas, minúsculas y números."
    return None


# ---------------- Claves de dispositivos IoT ----------------
def nueva_api_key() -> str:
    return "iot_" + secrets.token_urlsafe(32)


def hash_api_key(clave: str) -> str:
    return hashlib.sha256(clave.encode()).hexdigest()


# ---------------- JWT ----------------
def crear_token(usuario_id: str, rol: str) -> str:
    s = get_settings()
    ahora = datetime.now(timezone.utc)
    payload = {"sub": usuario_id, "rol": rol, "iat": ahora,
               "exp": ahora + timedelta(minutes=s.jwt_minutos), "iss": "empleotech360"}
    return jwt.encode(payload, s.jwt_secret, algorithm="HS256")


async def usuario_actual(cred: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict:
    if not cred:
        raise HTTPException(401, "Inicie sesión para continuar.")
    try:
        datos = jwt.decode(cred.credentials, get_settings().jwt_secret,
                           algorithms=["HS256"], issuer="empleotech360")
    except jwt.PyJWTError:
        raise HTTPException(401, "Sesión inválida o vencida.")
    return {"id": datos["sub"], "rol": datos["rol"]}


async def usuario_opcional(cred: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict | None:
    if not cred:
        return None
    try:
        return await usuario_actual(cred)
    except HTTPException:
        return None


def requiere_rol(*roles: str):
    async def _dep(u: dict = Depends(usuario_actual)) -> dict:
        if u["rol"] not in roles:
            raise HTTPException(403, "No tiene permisos para esta acción.")
        return u
    return _dep


# ---------------- Auditoría ----------------
async def auditar(evento: str, severidad: str = "info", usuario_id: str | None = None,
                  ip: str | None = None, **detalle) -> None:
    try:
        await db.execute(
            "insert into auditoria_seguridad (usuario_id, evento, severidad, detalle, ip) values (%s,%s,%s,%s,%s)",
            usuario_id, evento, severidad, json.dumps(detalle, default=str), ip)
    except Exception:
        pass  # la auditoría nunca debe tumbar la petición


# ---------------- Prompt injection y datos personales ----------------
_PATRONES_INYECCION = [
    r"ignora(r)? (todas )?(las )?instrucciones",
    r"ignore (all |previous |the )?instructions",
    r"olvida (todo|tus reglas)",
    r"(system|sistema) prompt",
    r"act[uú]a como (si no tuvieras|sin) (reglas|restricciones)",
    r"jailbreak|modo desarrollador|developer mode|DAN\b",
    r"revela (tu|el) (prompt|clave|contraseña|api key)",
    r"<\s*script|drop\s+table|union\s+select|;\s*--",
]
_RE_INYECCION = re.compile("|".join(_PATRONES_INYECCION), re.IGNORECASE)


def analizar_mensaje(texto: str) -> dict:
    hallazgos = [m.group(0) for m in _RE_INYECCION.finditer(texto)]
    riesgo = "alta" if hallazgos else "info"
    if len(texto) > 4000:
        hallazgos.append("mensaje demasiado largo")
        riesgo = "media" if riesgo == "info" else riesgo
    return {"seguro": not hallazgos, "riesgo": riesgo, "hallazgos": hallazgos}


_RE_EMAIL = re.compile(r"[\w.+-]+@[\w-]+\.[\w.]+")
_RE_TEL = re.compile(r"\b3\d{2}[\s-]?\d{3}[\s-]?\d{4}\b")
_RE_DOC = re.compile(r"\b\d{6,10}\b")


def enmascarar_pii(texto: str) -> str:
    texto = _RE_EMAIL.sub("[correo]", texto)
    texto = _RE_TEL.sub("[teléfono]", texto)
    return _RE_DOC.sub("[documento]", texto)


# ---------------- Middleware ----------------
class OriSecurityMiddleware(BaseHTTPMiddleware):
    """Límite de peticiones por IP + cabeceras seguras."""

    def __init__(self, app):
        super().__init__(app)
        self._ventanas: dict[str, deque] = defaultdict(deque)

    async def dispatch(self, request: Request, call_next):
        s = get_settings()
        ip = request.headers.get("x-forwarded-for", request.client.host if request.client else "?").split(",")[0].strip()
        ahora = time.monotonic()
        v = self._ventanas[ip]
        while v and ahora - v[0] > 60:
            v.popleft()
        if len(v) >= s.limite_peticiones_minuto and not request.url.path.startswith("/api/salud"):
            await auditar("limite_peticiones", "media", ip=ip, ruta=request.url.path)
            return JSONResponse({"detail": "ORI SECURITY: demasiadas peticiones, espere un minuto."}, 429)
        v.append(ahora)

        respuesta = await call_next(request)
        respuesta.headers.update({
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "Referrer-Policy": "strict-origin-when-cross-origin",
            "Permissions-Policy": "geolocation=(), camera=(), microphone=(self)",
            "Strict-Transport-Security": "max-age=63072000; includeSubDomains",
            "X-Protegido-Por": "ORI SECURITY",
        })
        return respuesta
