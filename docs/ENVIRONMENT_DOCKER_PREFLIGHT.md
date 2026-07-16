# Environment and Docker Preflight

Fecha: 2026-05-25

Actualizacion 2026-07-03: el usuario autoriza abrir Fase 6 para preparar
despliegue beta Docker en `192.168.18.106`. Se mantiene la regla de no tocar
produccion/Coolify/CI-CD y se limita el alcance a beta clasica automatizable.

Modo: GIPROY CLASICO

## Objetivo

Preparar la Fase 6 sin dockerizar todavia. Este documento fija el contrato real de entorno local y las reglas minimas para futuros Dockerfiles, `docker-compose`, Coolify, staging y produccion.

## Estado de despliegue

El despliegue Docker/Coolify quedaba **planificado pero pausado** hasta
solicitud explicita. Para `TASK-2001`, el usuario autoriza crear artefactos
Docker y estructura de despliegue beta en servidor.

Fuera de `TASK-2001`, no se debe crear, ejecutar ni activar ningun artefacto de
despliegue hasta que el usuario lo solicite explicitamente. Esto incluye:

- Dockerfiles.
- `.dockerignore`.
- `docker-compose.yml`.
- Configuracion Coolify.
- Pipelines CI/CD.
- Servicios staging.
- Cambios de puertos o proxy.
- Migraciones de entorno.

La siguiente sesion que reciba una solicitud explicita de despliegue debe abrir una TASK nueva y empezar por el orden seguro documentado en este preflight.

## Estado real observado

### Servidor beta observado en TASK-2001

- Host: `192.168.18.106`.
- OS: Ubuntu 24.04.4 LTS.
- Recursos: 12 cores, 7.6 GiB RAM, 81 GiB libres en `/`.
- Docker: 29.6.0.
- Docker Compose: v5.2.0.
- Redes Docker existentes: `proxy` y `backend`.
- Traefik: v2.11 activo en `127.0.0.1:80`, provider Docker con
  `exposedByDefault=false`.
- Cloudflared: activo, enruta `*.excomconsultores.com` hacia Traefik local.
- Apps existentes: Portainer, Gitea, Grafana, Prometheus, Uptime Kuma, Redis.
- PostgreSQL systemd instalado pero cluster local apagado; para beta se usa
  PostgreSQL containerizado dedicado con volumen propio.
- Directorio de apps disponible: `/home/benito/docker/apps`.

### Backend

- Entrada: `backend/app/main.py`.
- Framework: FastAPI.
- Prefijo API: `/api/v1`.
- Configuracion: `backend/app/core/config.py`.
- Archivo env local: `backend/.env`.
- Plantilla env: `backend/.env.example`.
- Base de datos: PostgreSQL.
- Conexion DB: `DATABASE_URL` si existe; si no, `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_SERVER`, `POSTGRES_PORT`, `POSTGRES_DB`.
- Puerto operativo historico vigente: `3001` segun contrato local y proxy Vite.
- CORS local permitido: `5173`, `3000`, `3001`, `3010` en `localhost` y `127.0.0.1`.
- BIM: `BIM_ENABLED=false` por defecto.

### Frontend

- Entrada: `frontend/src/main.jsx`.
- Build: Vite.
- Dev server vigente: `frontend/vite.config.js` con `server.port = 3010` y `strictPort = true`.
- Proxy local: `/api` hacia `http://localhost:3001`.
- Cliente API runtime: `frontend/src/api/axiosConfig.js` usa `baseURL: '/api/v1'`.
- Produccion debe servir frontend y backend de forma separada o con proxy equivalente que preserve `/api/v1`.

### Variables detectadas

- `frontend/.env` contiene:
  - `VITE_API_URL=https://giproy-erp-beta.excompc.dpdns.org/api/v1`
  - `VITE_BACKEND_PORT=3000`
  - `VITE_FRONTEND_PORT=3010`
- El frontend productivo actual no depende de `VITE_API_URL` para el cliente principal; usa ruta relativa `/api/v1`.
- Existe divergencia documental historica entre puertos `5173`, `3000`, `3001` y `3010`; el contrato vigente para GiProy clasico queda documentado como backend `3001` y frontend `3010`.

## Reglas para Docker futuro

- No introducir Dockerfiles hasta validar este preflight en una TASK separada.
- No usar `CREATE_TABLES_ON_STARTUP=true` en imagenes de staging/produccion.
- No ejecutar migraciones destructivas automaticamente.
- No copiar `uploads/`, `backend/uploads/`, `backups/`, dumps, logs ni `.env` reales a imagenes.
- Montar persistencia de uploads como volumen externo si se activa Docker.
- Mantener `BIM_ENABLED=false` por defecto.
- Mantener frontend y backend desacoplados para Coolify.
- Mantener PostgreSQL como servicio separado.
- Preparar Redis solo como dependencia futura documentada; no agregar paquete ni servicio todavia.

## Riesgos antes de Docker

- `backend/requirements.txt` incluye `pywin32` condicionado a Windows; en Linux no debe instalarse por el marcador `platform_system == "Windows"`.
- Hay scripts sueltos legacy/debug con credenciales o hosts locales; no deben copiarse a imagen final sin una fase de saneamiento del contexto Docker.
- Existen archivos runtime locales grandes y sensibles (`uploads`, logs, dumps, backups) que deben quedar fuera de build context o ignorados por `.dockerignore`.
- El frontend usa proxy Vite solo para dev; produccion necesita reverse proxy o rutas relativas servidas por gateway equivalente.
- `frontend/.env` tiene valores historicos que no deben asumirse como contrato productivo sin revisar Coolify/staging.

## Propuesta de orden seguro Fase 6

Ejecutar estos pasos solo bajo solicitud explicita del usuario. Para TASK-2001,
los pasos 1 a 5 se materializan como artefactos locales, sin tocar produccion.

1. Crear `.dockerignore` conservador antes de cualquier Dockerfile.
2. Crear `backend/.env.example` endurecido si faltan variables de entorno de produccion.
3. Crear Dockerfile backend no activado en runtime local.
4. Crear Dockerfile frontend no activado en runtime local.
5. Crear `docker-compose.yml` solo para entorno local aislado, sin tocar servicios Windows.
6. Documentar variables Coolify por servicio.
7. Validar build de imagenes sin ejecutar migraciones ni tocar DB real.

## Validacion actual

- `.\.venv\Scripts\python.exe tools\ai_tools\validate_enterprise_baseline.py --include-frontend`: OK.
- Busqueda de `console.log` productivo en `frontend/src` fuera de `api`: sin resultados.
- Busqueda de import directo de `axiosConfig` fuera de `frontend/src/api`: sin resultados.

## No interferencia BIM

- No se modifica codigo BIM.
- No se activa UX BIM.
- No se agregan dependencias BIM.
- `BIM_ENABLED=false` permanece como default documentado.
