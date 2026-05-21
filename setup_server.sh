#!/bin/bash

# Script de configuración para GiProy Network en Ubuntu
# Uso: sudo bash setup_server.sh

set -e

PROJECT_ROOT="/var/www/giproy"
DOMAIN="giproy-erp-beta.excompc.dpdns.org"

echo "--- Iniciando configuración de GiProy Network ---"

# 1. Crear directorios y mover archivos
sudo mkdir -p $PROJECT_ROOT
sudo tar -xzf /home/administrador/deploy.tar.gz -C $PROJECT_ROOT
sudo chown -R www-data:www-data $PROJECT_ROOT

# 2. Instalar dependencias del sistema
sudo apt update
sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib

# 3. Configurar Backend
cd $PROJECT_ROOT/backend
sudo -u www-data python3 -m venv venv
sudo -u www-data ./venv/bin/pip install --upgrade pip
sudo -u www-data ./venv/bin/pip install -r requirements.txt
sudo -u www-data ./venv/bin/pip install gunicorn uvicorn

# 4. Configurar .env de producción (Sobrescribir el local)
cd $PROJECT_ROOT/backend
echo "Configurando variables de entorno de producción..."
DB_PASS=$(openssl rand -hex 16)
cat <<EOF | sudo -u www-data tee .env
PROJECT_NAME="GIPROY ERP PROD"
API_V1_STR="/api/v1"
SECRET_KEY="$(openssl rand -hex 32)"
POSTGRES_SERVER="localhost"
POSTGRES_PORT="5432"
POSTGRES_DB="giproy_erp"
POSTGRES_USER="giproy_user"
POSTGRES_PASSWORD="$DB_PASS"
CREATE_TABLES_ON_STARTUP="false"
EOF

# Crear DB y Usuario en Postgres (Si no existen)
echo "Configurando PostgreSQL..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS giproy_erp;"
sudo -u postgres psql -c "DROP USER IF EXISTS giproy_user;"
sudo -u postgres psql -c "CREATE USER giproy_user WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "CREATE DATABASE giproy_erp OWNER giproy_user;"

# Ejecutar la creación del esquema directo
echo "Creando esquema de base de datos desde los modelos..."
sudo -u www-data ./venv/bin/python create_schema.py

# Importar datos si existe el backup
if [ -f ../db_backup.json ]; then
    echo "Importando datos desde backup..."
    sudo -u www-data ./venv/bin/python import_data.py
fi

# 5. Configurar Systemd para el Backend
cat <<EOF | sudo tee /etc/systemd/system/giproy-backend.service
[Unit]
Description=Gunicorn instance to serve GiProy Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=$PROJECT_ROOT/backend
Environment="PATH=$PROJECT_ROOT/backend/venv/bin"
ExecStart=$PROJECT_ROOT/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app --bind unix:giproy.sock

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable giproy-backend.service
sudo systemctl restart giproy-backend.service

# 6. Configurar Nginx
cat <<EOF | sudo tee /etc/nginx/sites-available/giproy
server {
    listen 80;
    server_name $DOMAIN;

    location / {
        root $PROJECT_ROOT/frontend/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_set_header Host \$http_host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_pass http://unix:$PROJECT_ROOT/backend/giproy.sock;
    }

    location /uploads {
        alias $PROJECT_ROOT/backend/uploads;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/giproy /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx

echo "--- Configuración completada con éxito ---"
echo "URL: https://$DOMAIN"
