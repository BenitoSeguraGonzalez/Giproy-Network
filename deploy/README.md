# GiProy Beta Docker Deployment

Este paquete abre la Fase 6 de despliegue Docker para GiProy Clasico de forma
aislada y repetible.

## Arquitectura

- `giproy-beta-postgres`: PostgreSQL 18 con volumen dedicado, alineado con la
  base local usada como semilla inicial.
- `giproy-beta-backend`: FastAPI/Gunicorn en red interna `backend`.
- `giproy-beta-frontend`: Nginx con build Vite, publica por Traefik.
- Redes externas esperadas en el servidor: `proxy` y `backend`.
- BIM queda apagado por defecto con `BIM_ENABLED=false`.

## Primer despliegue en el servidor

Directorio esperado:

```bash
/home/benito/docker/apps/giproy-beta
```

Preparar variables:

```bash
cd /home/benito/docker/apps/giproy-beta
cp deploy/env/giproy-beta.env.example deploy/.env
nano deploy/.env
```

Ejecutar preflight:

```bash
./deploy/scripts/giproy-beta-preflight.sh
```

Desplegar:

```bash
./deploy/scripts/giproy-beta-deploy.sh
```

Importar una semilla local como base inicial:

```bash
SEED_FILE=/home/benito/docker/apps/giproy-beta/deploy/giproy-local-seed.sql \
  ./deploy/scripts/giproy-beta-import-seed.sh
```

El importador reinicia solo el stack `giproy-beta`, recrea sus volumenes,
restaura la semilla, ejecuta Alembic y levanta backend/frontend.

## Redes del servidor observado

El servidor `192.168.18.106` ya tiene Docker, Traefik y Cloudflared. Traefik
escucha en `127.0.0.1:80` y Cloudflared enruta `*.excomconsultores.com` hacia
ese Traefik. Por eso el host inicial recomendado es:

```bash
GIPROY_HOST=giproy.excomconsultores.com
```

### Recreación segura del WAF después de cambiar el frontend

El WAF Nginx resuelve `BACKEND` al arrancar y puede conservar la IP anterior
del contenedor frontend. Después de recrear `giproy-beta-frontend`, recrear
también únicamente el WAF para evitar que una ruta de GiProy sirva otro
proyecto:

```bash
GIPROY_IMAGE_TAG=<tag> docker compose -f deploy/docker-compose.beta.yml up -d --force-recreate waf
```

Verificar desde Traefik que `/auth/login` contiene `GIPROY | Engineering ERP`
antes de validar el despliegue públicamente.

## Operacion recurrente

Para repetir despliegues:

```bash
cd /home/benito/docker/apps/giproy-beta
git pull  # si el directorio queda como working copy
./deploy/scripts/giproy-beta-deploy.sh
```

El script intenta respaldar PostgreSQL antes de migrar si la base ya existe.
Si la base esta vacia, ejecuta un bootstrap controlado desde modelos y luego
`alembic stamp heads`; en despliegues posteriores usa Alembic normalmente.

## Variables de seguridad

No versionar `.env`. Rotar credenciales si fueron expuestas en consola, chat o
archivos compartidos.

## No interferencia

Este despliegue no toca los contenedores existentes `traefik`, `portainer`,
`gitea`, `grafana`, `prometheus`, `uptime-kuma` ni `redis`.
