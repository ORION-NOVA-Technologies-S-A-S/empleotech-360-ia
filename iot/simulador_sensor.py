"""Simulador de un sensor de aula IoT (solo Python estándar).
Uso: python simulador_sensor.py http://localhost:8080 aula-neiva-01 iot_LACLAVE"""
import json, random, sys, time, urllib.request

base, disp, clave = sys.argv[1:4]
while True:
    lecturas = [{"metrica": "temperatura", "valor": round(random.uniform(22, 29), 1)},
                {"metrica": "co2", "valor": random.randint(450, 1100)},
                {"metrica": "ocupacion", "valor": random.randint(5, 30)}]
    req = urllib.request.Request(f"{base}/api/iot/lecturas/{disp}", data=json.dumps(lecturas).encode(),
                                 headers={"Content-Type": "application/json", "X-Device-Key": clave})
    try:
        print(urllib.request.urlopen(req).read().decode())
    except Exception as e:
        print("Error:", e)
    time.sleep(30)
