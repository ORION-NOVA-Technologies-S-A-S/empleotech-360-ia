from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request
from pydantic import BaseModel, EmailStr, Field

from .. import db
from ..config import get_settings
from ..security import (auditar, crear_token, hash_password, politica_password,
                        usuario_actual, verificar_password)

router = APIRouter(prefix="/api/auth", tags=["Autenticación"])


class Registro(BaseModel):
    nombre: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(max_length=128)
    municipio: str = "Neiva"
    departamento: str = "Huila"
    rol: str = Field("joven", pattern="^(joven|empresa)$")   # admin solo se asigna en BD
    acepta_datos: bool = Field(description="Autorización Ley 1581 de 2012 (habeas data)")


class Login(BaseModel):
    email: EmailStr
    password: str


class Perfil(BaseModel):
    nivel_educativo: str | None = None
    area_interes: str | None = None
    experiencia_meses: int = 0
    competencias: list[str] = []
    resumen: str | None = Field(None, max_length=2000)


@router.post("/registro")
async def registro(d: Registro, req: Request):
    if not d.acepta_datos:
        raise HTTPException(400, "Debe autorizar el tratamiento de datos personales (Ley 1581 de 2012).")
    if err := politica_password(d.password):
        raise HTTPException(400, err)
    if await db.fetchone("select 1 from usuarios where email = %s", d.email.lower()):
        raise HTTPException(409, "Ese correo ya está registrado.")
    u = await db.fetchone(
        """insert into usuarios (email, nombre, password_hash, rol, municipio, departamento)
           values (%s,%s,%s,%s,%s,%s) returning id::text, rol, nombre""",
        d.email.lower(), d.nombre.strip(), hash_password(d.password), d.rol, d.municipio, d.departamento)
    await db.execute("insert into perfiles (usuario_id) values (%s)", u["id"])
    await auditar("registro", usuario_id=u["id"], ip=req.client.host if req.client else None)
    return {"token": crear_token(u["id"], u["rol"]), "usuario": u}


@router.post("/login")
async def login(d: Login, req: Request):
    s = get_settings()
    ip = req.client.host if req.client else None
    u = await db.fetchone(
        "select id::text, nombre, rol, password_hash, intentos_fallidos, bloqueado_hasta from usuarios where email = %s",
        d.email.lower())
    ahora = datetime.now(timezone.utc)
    if u and u["bloqueado_hasta"] and u["bloqueado_hasta"] > ahora:
        await auditar("login_bloqueado", "media", u["id"], ip)
        raise HTTPException(423, "Cuenta bloqueada temporalmente por intentos fallidos. Intente en 15 minutos.")
    if not u or not verificar_password(u["password_hash"], d.password):
        if u:
            intentos = u["intentos_fallidos"] + 1
            bloqueo = ahora + timedelta(minutes=15) if intentos >= s.max_intentos_login else None
            await db.execute("update usuarios set intentos_fallidos=%s, bloqueado_hasta=%s where id=%s",
                             0 if bloqueo else intentos, bloqueo, u["id"])
        await auditar("login_fallido", "baja", u["id"] if u else None, ip, email=d.email.lower())
        raise HTTPException(401, "Correo o contraseña incorrectos.")
    await db.execute("update usuarios set intentos_fallidos=0, bloqueado_hasta=null where id=%s", u["id"])
    await auditar("login", usuario_id=u["id"], ip=ip)
    return {"token": crear_token(u["id"], u["rol"]), "usuario": {"id": u["id"], "nombre": u["nombre"], "rol": u["rol"]}}


@router.get("/yo")
async def yo(u: dict = Depends(usuario_actual)):
    datos = await db.fetchone(
        """select u.id::text, u.nombre, u.email, u.rol, u.municipio, u.departamento,
                  p.nivel_educativo, p.area_interes, p.experiencia_meses, p.competencias, p.resumen
           from usuarios u left join perfiles p on p.usuario_id = u.id where u.id = %s""", u["id"])
    if not datos:
        raise HTTPException(404, "Usuario no encontrado.")
    return datos


@router.put("/perfil")
async def actualizar_perfil(p: Perfil, u: dict = Depends(usuario_actual)):
    comps = sorted({c.strip()[:60] for c in p.competencias if c.strip()})[:40]
    await db.execute(
        """insert into perfiles (usuario_id, nivel_educativo, area_interes, experiencia_meses, competencias, resumen, actualizado_en)
           values (%s,%s,%s,%s,%s,%s,now())
           on conflict (usuario_id) do update set nivel_educativo=excluded.nivel_educativo,
             area_interes=excluded.area_interes, experiencia_meses=excluded.experiencia_meses,
             competencias=excluded.competencias, resumen=excluded.resumen, actualizado_en=now()""",
        u["id"], p.nivel_educativo, p.area_interes, p.experiencia_meses, comps, p.resumen)
    return {"ok": True, "competencias": comps}
