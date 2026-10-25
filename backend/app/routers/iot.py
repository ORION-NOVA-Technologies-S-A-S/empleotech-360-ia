"""IoT: los dispositivos envían lecturas con su propia API key (cabecera X-Device-Key)."""
import hmac

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field

from .. import db
from ..security import auditar, hash_api_key, nueva_api_key, requiere_rol

router = APIRouter(prefix="/api/iot", tags=["IoT"])


class Dispositivo(BaseModel):
    id: str = Field(pattern=r"^[a-z0-9\-]{3,40}$")
    nombre: str = Field(max_length=80)
    tipo: str = Field(pattern="^(kiosco|sensor_aula|lector_asistencia|kit_robotica)$")
    sede: str = Field(max_length=80)


class Lectura(BaseModel):
    metrica: str = Field(pattern=r"^[a-z_]{2,30}$")   # temperatura, co2, ocupacion, asistencia...
    valor: float


@router.post("/dispositivos")
async def registrar(d: Dispositivo, _: dict = Depends(requiere_rol("admin"))):
    clave = nueva_api_key()
    await db.execute("insert into iot_dispositivos (id, nombre, tipo, sede, api_key_hash) values (%s,%s,%s,%s,%s)",
                     d.id, d.nombre, d.tipo, d.sede, hash_api_key(clave))
    return {"id": d.id, "api_key": clave, "aviso": "Guarde la clave: no se vuelve a mostrar."}


async def guardar_lectura(dispositivo_id: str, clave: str, lecturas: list[Lectura], ip: str | None = None) -> int:
    d = await db.fetchone("select api_key_hash, activo from iot_dispositivos where id = %s", dispositivo_id)
    if not d or not d["activo"] or not hmac.compare_digest(d["api_key_hash"], hash_api_key(clave)):
        await auditar("iot_clave_invalida", "media", ip=ip, dispositivo=dispositivo_id)
        raise HTTPException(401, "Dispositivo no autorizado.")
    for l in lecturas[:50]:
        await db.execute("insert into iot_lecturas (dispositivo_id, metrica, valor) values (%s,%s,%s)",
                         dispositivo_id, l.metrica, l.valor)
    return len(lecturas[:50])


@router.post("/lecturas/{dispositivo_id}")
async def recibir(dispositivo_id: str, lecturas: list[Lectura], req: Request, x_device_key: str = Header()):
    n = await guardar_lectura(dispositivo_id, x_device_key, lecturas, req.client.host if req.client else None)
    return {"guardadas": n}


@router.get("/resumen")
async def resumen():
    return await db.fetch(
        """select d.id, d.nombre, d.tipo, d.sede, l.metrica,
                  round(avg(l.valor)::numeric,1)::float as promedio, count(l.id)::int as lecturas,
                  max(l.registrado_en) as ultima
           from iot_dispositivos d left join iot_lecturas l
             on l.dispositivo_id = d.id and l.registrado_en > now() - interval '24 hours'
           where d.activo group by d.id, d.nombre, d.tipo, d.sede, l.metrica order by d.sede, d.nombre""")
