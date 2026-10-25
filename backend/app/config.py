from functools import lru_cache
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_nombre: str = "EmpleoTech 360 IA"
    empresa: str = "Orion Nova Technologies"
    contacto_whatsapp: str = "573004440009"
    contacto_telefono: str = "300 444 0009"

    # Base de datos: PostgreSQL local (Docker) o Supabase (cadena del pooler)
    database_url: str = "postgresql://empleotech:empleotech@db:5432/empleotech"

    # ORI SECURITY
    jwt_secret: str = "CAMBIAR-esta-clave-por-una-larga-y-aleatoria"
    jwt_minutos: int = 60
    cors_origenes: str = "http://localhost:5173,http://localhost:8080"
    limite_peticiones_minuto: int = 60
    max_intentos_login: int = 5

    # IA (opcional). Sin clave, los agentes responden con su motor de reglas.
    anthropic_api_key: str = ""
    anthropic_modelo: str = "claude-sonnet-5-5"

    # IoT por MQTT (opcional)
    mqtt_host: str = ""
    mqtt_port: int = 1883
    mqtt_topic: str = "empleotech/iot/#"
    mqtt_usuario: str = ""
    mqtt_clave: str = ""

    @property
    def origenes(self) -> list[str]:
        return [o.strip() for o in self.cors_origenes.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
