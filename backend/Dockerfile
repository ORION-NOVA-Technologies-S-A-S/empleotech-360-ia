# Se construye desde la raíz del repositorio (ver docker-compose.yml)
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 DATOS_DIR=/app/datos
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY backend/ .
COPY database/datos/ /app/datos/
# ORI SECURITY: el contenedor no corre como root
RUN useradd -m -u 10001 empleotech && chown -R empleotech /app
USER empleotech
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--proxy-headers"]
