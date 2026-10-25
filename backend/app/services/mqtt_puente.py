"""Puente MQTT → base de datos (opcional, se activa con MQTT_HOST).
Tema: empleotech/iot/<dispositivo_id>
Carga: {"key": "iot_...", "lecturas": [{"metrica": "temperatura", "valor": 24.5}]}"""
import asyncio
import json
import logging

log = logging.getLogger("mqtt")


def iniciar(loop: asyncio.AbstractEventLoop):
    from ..config import get_settings
    s = get_settings()
    if not s.mqtt_host:
        return None
    import paho.mqtt.client as mqtt
    from ..routers.iot import Lectura, guardar_lectura

    def al_mensaje(_cli, _ud, msg):
        try:
            disp = msg.topic.rsplit("/", 1)[-1]
            carga = json.loads(msg.payload)
            lecturas = [Lectura(**l) for l in carga.get("lecturas", [])]
            asyncio.run_coroutine_threadsafe(guardar_lectura(disp, carga.get("key", ""), lecturas), loop)
        except Exception as e:  # nunca tumbar el puente por un mensaje malo
            log.warning("Mensaje MQTT descartado: %s", e)

    cli = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    if s.mqtt_usuario:
        cli.username_pw_set(s.mqtt_usuario, s.mqtt_clave)
    cli.on_message = al_mensaje
    cli.on_connect = lambda c, *_: c.subscribe(s.mqtt_topic)
    cli.connect_async(s.mqtt_host, s.mqtt_port)
    cli.loop_start()
    log.info("Puente MQTT escuchando %s", s.mqtt_topic)
    return cli
