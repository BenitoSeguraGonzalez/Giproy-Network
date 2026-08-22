FROM python:3.12-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app/backend

# El contexto de build debe excluir licencias/keys propietarias. La evidencia
# distribuible se genera fuera de la imagen mediante scripts/compliance.

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        curl \
        default-jre-headless \
        libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt ./requirements.txt
RUN pip install --upgrade pip \
    && pip install -r requirements.txt \
    && pip install gunicorn==22.0.0

COPY backend/alembic.ini ./alembic.ini
COPY backend/alembic ./alembic
COPY backend/app ./app
COPY backend/scripts/docker_bootstrap_schema.py ./scripts/docker_bootstrap_schema.py
COPY backend/scripts/sri_ruc_sync.py ./scripts/sri_ruc_sync.py
COPY docs/reportes /app/reports

RUN mkdir -p /app/backend/uploads /app/reports /app/logs /app/backend/scripts

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
    CMD curl -fsS http://127.0.0.1:3001/ >/dev/null || exit 1

CMD ["gunicorn", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "app.main:app", "--bind", "0.0.0.0:3001"]
