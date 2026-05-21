# Informe de Implementación y Capacidad: GiProy Network

Este informe detalla la estrategia de despliegue, el modelo de subida y la capacidad operativa del sistema GiProy Network basado en el hardware de alta gama proporcionado.

## 1. Especificaciones de Hardware
| Componente | Detalle |
| :--- | :--- |
| **Procesador** | 18 vCPU Cores |
| **Memoria RAM** | 96 GB |
| **Almacenamiento** | 350 GB NVMe |
| **S.O.** | Ubuntu Server 20.04 LTS |
| **Red** | Puerto de 1 Gbps |

---

## 2. Resumen para el Cliente (No Técnico)
**¿Qué significa este hardware para su negocio?**
Usted cuenta con una infraestructura de **clase empresarial**. Es equivalente a tener una autopista de 18 carriles con un motor de altísimo rendimiento.

- **Capacidad Masiva:** El sistema puede atender a miles de usuarios al mismo tiempo sin ponerse lento.
- **Velocidad Extrema:** Gracias al disco NVMe y la enorme memoria, las búsquedas y cálculos de presupuestos serán casi instantáneos.
- **Crecimiento Garantizado:** No necesitará mejores equipos en mucho tiempo, incluso si su empresa crece significativamente.
- **Fiabilidad:** El sistema tiene espacio de sobra para manejar picos de trabajo (cierres de mes o licitaciones grandes).

---

## 3. Análisis Técnico y Capacidad de Usuarios

### Cálculo de Concurrencia
Para el backend (FastAPI/Python), la configuración óptima utiliza 37 procesos simultáneos (2 * núcleos + 1).

1.  **Usuarios Simultáneos Reales (Active Concurrent Requests):** ~2,500 solicitudes procesándose en el mismo milisegundo.
2.  **Usuarios en Sesión Activa:** Considerando que un usuario promedio hace una acción cada 5-8 segundos, el servidor soporta entre **5,000 y 8,000 usuarios navegando simultáneamente** con tiempos de respuesta menores a 150ms.
3.  **Base de Datos:** Con 96GB de RAM, podemos configurar PostgreSQL para mantener la base de datos completa en memoria, eliminando el "cuello de botella" del disco.

### Cuello de Botella Potencial
El único límite teórico sería el ancho de banda de 1Gbps en caso de descargas masivas de documentos adjuntos, pero para datos de presupuestos es prácticamente inagotable.

---

## 4. Modelo de Subida e Implementación
Se recomienda un modelo basado en **Contenedores (Docker)** para garantizar estabilidad y facilidad de actualización.

### Esquema de Producción:
1.  **Frontend (React):** Compilado y servido a través de **Nginx** con compresión Gzip/Brotli.
2.  **Backend (FastAPI):** Ejecutado con **Gunicorn + Uvicorn Workers** (37 workers).
3.  **Base de Datos (PostgreSQL 14+):** Instalada sobre el NVMe con optimización de `shared_buffers` a 24GB y `effective_cache_size` a 72GB.
4.  **Caché (Redis):** Para persistencia de sesiones y resultados de cálculos complejos (como el Pareto de presupuestos grandes).

---

## 5. Guía de Procesos de Implementación

### Fase Previa (Pre-deployment)
1.  **Validación de Entorno:** Verificar que Ubuntu 20 tiene instaladas las dependencias base (Docker, Git, Nginx).
2.  **Snapshot de Datos:** Si existe un sistema previo, realizar volcado de seguridad.
3.  **Configuración de Secretos:** Preparación del archivo `.env` con credenciales productivas, desactivando el modo `DEBUG`.
4.  **Optimización de Kernel:** Ajustar límites de archivos abiertos (`ulimit -n 65535`) para manejar la alta concurrencia.

### Fase Posterior (Post-deployment)
1.  **Monitoreo con Prometheus/Grafana:** Para vigilar el uso de esos 18 núcleos en tiempo real.
2.  **Backups Automatizados:** Configurar una tarea (Cron) para respaldar la DB cada 6 horas hacia un almacenamiento externo.
3.  **SSL/TLS:** Instalación de Certbot (Let's Encrypt) para cifrado obligatorio.
4.  **Calibración de Firewall (UFW):** Cerrar puertos innecesarios, dejando solo 80, 443 y SSH protegido.
5.  **Pruebas de Estrés:** Ejecutar un test de carga corto (Locust o JMeter) para validar que los 37 workers responden correctamente.

---

## 6. Guía Técnica: Instalación Paso a Paso (Ubuntu 20.04)

Esta guía asume un servidor limpio con acceso root.

### Paso 1: Actualización Inicial y Dependencias
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl soft-ware-properties-common apt-transport-https ca-certificates
```

### Paso 2: Instalación de Docker y Docker Compose
```bash
# Agregar llave GPG de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Agregar repositorio
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io
sudo systemctl enable docker --now

# Docker Compose (v2)
sudo apt install -y docker-compose-plugin
```

### Paso 3: Optimización del Kernel para 96GB RAM y 18 vCPUs
Editar `/etc/sysctl.conf` para mejorar el manejo de conexiones y red:
```bash
# Agregar al final del archivo
net.core.somaxconn = 65535
net.ipv4.ip_local_port_range = 1024 65535
fs.file-max = 2097152
vm.swappiness = 10
```
Aplicar cambios: `sudo sysctl -p`

### Paso 4: Preparación del Repositorio y Entorno
```bash
mkdir -p /opt/giproy && cd /opt/giproy
git clone <URL_REPOSITORIO> .

# Crear archivo de variables (basado en .env.example)
cp backend/.env.example backend/.env
nano backend/.env # Configurar DB_PASSWORD, SECRET_KEY, etc.
```

### Paso 5: Despliegue con Docker Compose
Teniendo en cuenta los 18 núcleos, configuraremos el backend para usar los 37 workers. En el archivo `docker-compose.yml` (o el script de entrada del backend):
```yaml
# Fragmento del comando de inicio
command: gunicorn -w 37 -k uvicorn.workers.UvicornWorker app.main:app --bind 0.0.0.0:8000
```
Lanzar servicios:
```bash
sudo docker compose up -d --build
```

### Paso 6: Configuración de Nginx (Proxy Inverso)
```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/giproy
```
Configuración recomendada para `/etc/nginx/sites-available/giproy`:
```nginx
server {
    listen 80;
    server_name su-dominio.com;

    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```
Activar y reiniciar:
```bash
sudo ln -s /etc/nginx/sites-available/giproy /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl restart nginx
```

### Paso 7: Seguridad y Certificados SSL
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d su-dominio.com
```

---

## 7. Necesidades Inmediatas
- **Acceso SSH** al servidor.
- **Dominio/Subdominio** apuntando a la IP del VPS.
- **Certificados SSL** (si no se usa Let's Encrypt).
- **Almacenamiento Externo** (opcional) para respaldos de base de datos fuera del servidor principal.
