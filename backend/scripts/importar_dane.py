"""Importa indicadores oficiales del DANE (GEIH) a la base de datos.

1. Descargue los anexos del mercado laboral en https://www.dane.gov.co
   (Estadísticas por tema → Mercado laboral → Empleo y desempleo / Mercado laboral de la juventud).
2. Copie las cifras que necesita a un CSV con estas columnas:
   periodo,territorio,grupo,indicador,valor,unidad
   2026-06-01,Neiva,Jóvenes 15-28,TD,18.1,%
3. Ejecute:  python -m scripts.importar_dane datos_dane.csv [--borrar-ejemplos]
Las filas importadas quedan con es_ejemplo = false."""
import asyncio
import csv
import sys

from app import db

INDICADORES = {"TD", "TO", "TGP", "Informalidad", "NiNi"}


async def main(ruta: str, borrar: bool):
    await db.abrir_pool()
    if borrar:
        await db.execute("delete from indicadores_dane where es_ejemplo")
    n = 0
    with open(ruta, encoding="utf-8-sig") as f:
        for fila in csv.DictReader(f):
            if fila["indicador"] not in INDICADORES:
                print("Indicador desconocido, se omite:", fila); continue
            await db.execute(
                """insert into indicadores_dane (periodo, territorio, grupo, indicador, valor, unidad, fuente, es_ejemplo)
                   values (%s,%s,%s,%s,%s,%s,'DANE - GEIH',false)
                   on conflict (periodo, territorio, grupo, indicador)
                   do update set valor=excluded.valor, unidad=excluded.unidad, es_ejemplo=false""",
                fila["periodo"], fila["territorio"].strip(), fila["grupo"].strip(), fila["indicador"],
                float(fila["valor"].replace(",", ".")), fila.get("unidad") or "%")
            n += 1
    await db.cerrar_pool()
    print(f"✅ {n} indicadores oficiales importados.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    asyncio.run(main(sys.argv[1], "--borrar-ejemplos" in sys.argv))
