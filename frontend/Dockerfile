# Se construye desde la raíz del repositorio (ver docker-compose.yml)
FROM node:22-alpine AS build
WORKDIR /repo/frontend
COPY frontend/package.json ./
RUN npm install
COPY frontend/ .
COPY database/datos/ /repo/database/datos/
ARG VITE_API_URL=""
RUN npm run build

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/frontend/dist /usr/share/nginx/html
EXPOSE 80
