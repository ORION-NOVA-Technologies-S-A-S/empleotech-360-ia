"""Importa indicadores oficiales del DANE (GEIH) a la base de datos.

1. Descargue los boletines o anexos en https://www.dane.gov.co (Mercado laboral, por departamentos,
   23 ciudades y Mercado laboral de la juventud).
2. Arme un CSV con estas columnas (encabezado obligatorio):
   periodo,periodo_nombre,nivel,territorio,departamento,grupo,indicador,valor,url
   2026-12-31,Año 2026,Departamento,Huila,Huila,Total,TD,6.5,https://www.dane.gov.co/...
   - nivel: Nacional | Departamento | Municipio
   - indicador: TD | TO | TGP | Informalidad | NiNi
3. Ejecute:  python -m scripts.importar_dane datos_dane.csv"""
import asyncio
import csv
import sys

from app import db

INDICADORES = {"TD", "TO", "TGP", "Informalidad", "NiNi"}
NIVELES = {"Nacional", "Departamento", "Municipio"}


async def main(ruta: str):
    await db.abrir_pool()
    n = 0
    with open(ruta, encoding="utf-8-sig") as f:
        for fila in csv.DictReader(f):
            if fila["indicador"] not in INDICADORES or fila["nivel"] not in NIVELES:
                print("Fila inválida, se omite:", fila); continue
            await db.execute(
                """insert into indicadores_dane (periodo, periodo_nombre, nivel, territorio, departamento, grupo, indicador,
                                                 valor, fuente, url, es_ejemplo)
                   values (%s,%s,%s,%s,%s,%s,%s,%s,'DANE - GEIH',%s,false)
                   on conflict (periodo, nivel, territorio, grupo, indicador)
                   do update set valor=excluded.valor, periodo_nombre=excluded.periodo_nombre, url=excluded.url, es_ejemplo=false""",
                fila["periodo"], fila.get("periodo_nombre", ""), fila["nivel"], fila["territorio"].strip(),
                (fila.get("departamento") or "").strip() or None, fila["grupo"].strip(), fila["indicador"],
                float(fila["valor"].replace(",", ".")), fila.get("url") or None)
            n += 1
    await db.cerrar_pool()
    print(f"✅ {n} indicadores oficiales importados.")


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    asyncio.run(main(sys.argv[1]))
