"""Crea o asciende un administrador:  python -m scripts.crear_admin correo@dominio.com "Nombre" "Clave-Segura-123" """
import asyncio
import sys

from app import db
from app.security import hash_password, politica_password


async def main(email: str, nombre: str, clave: str):
    if err := politica_password(clave):
        sys.exit(err)
    await db.abrir_pool()
    await db.execute(
        """insert into usuarios (email, nombre, password_hash, rol) values (%s,%s,%s,'admin')
           on conflict (email) do update set rol='admin', password_hash=excluded.password_hash""",
        email.lower(), nombre, hash_password(clave))
    await db.execute("insert into perfiles (usuario_id) select id from usuarios where email=%s on conflict do nothing", email.lower())
    await db.cerrar_pool()
    print("✅ Administrador listo:", email)


if __name__ == "__main__":
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    asyncio.run(main(*sys.argv[1:]))
