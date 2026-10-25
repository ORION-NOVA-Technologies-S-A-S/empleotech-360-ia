"""Acceso a PostgreSQL / Supabase con un pool asíncrono."""
from typing import Any
from psycopg.rows import dict_row
from psycopg_pool import AsyncConnectionPool

from .config import get_settings

_pool: AsyncConnectionPool | None = None


async def abrir_pool() -> None:
    global _pool
    s = get_settings()
    # prepare_threshold=None: necesario con el pooler de Supabase (modo transacción)
    _pool = AsyncConnectionPool(
        s.database_url, min_size=1, max_size=10, open=False,
        kwargs={"row_factory": dict_row, "prepare_threshold": None},
    )
    await _pool.open(wait=True, timeout=30)


async def cerrar_pool() -> None:
    if _pool:
        await _pool.close()


async def fetch(sql: str, *params: Any) -> list[dict]:
    assert _pool, "Pool no inicializado"
    async with _pool.connection() as conn:
        cur = await conn.execute(sql, params or None)
        return await cur.fetchall()


async def fetchone(sql: str, *params: Any) -> dict | None:
    filas = await fetch(sql, *params)
    return filas[0] if filas else None


async def execute(sql: str, *params: Any) -> None:
    assert _pool, "Pool no inicializado"
    async with _pool.connection() as conn:
        await conn.execute(sql, params or None)
