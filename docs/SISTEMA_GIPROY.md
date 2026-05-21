# Documentación Técnica del Sistema GIPROY ERP

## Índice

1. [Introducción](#introducción)
2. [Arquitectura del Sistema](#arquitectura-del-sistema)
3. [Sistema de Identificación de Dispositivos](#sistema-de-identificación-de-dispositivos)
4. [Guía de Instalación](#guía-de-instalación)
5. [Configuración de Puertos](#configuración-de-puertos)
6. [Gestión de Servicios Windows](#gestión-de-servicios-windows)
7. [Estructura del Proyecto](#estructura-del-proyecto)
8. [API de Dispositivos](#api-de-dispositivos)
9. [Seguridad](#seguridad)
10. [Clonación y Migración de Datos](#clonación-y-migración-de-datos)

---

## Introducción

GIPROY ERP es un sistema ERP empresarial desarrollado con:

- **Backend**: Python (FastAPI)
- **Frontend**: React (Vite)
- **Base de datos**: PostgreSQL
- **Características**: Multi-empresa, control de dispositivos, auditoría

---

## Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────┐
│                      GIPROY ERP                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   ┌─────────────┐           ┌─────────────┐                 │
│   │   Frontend  │────────▶ │   Backend   │                 │
│   │  React +    │◀──────── │  FastAPI    │                 │
│   │   Vite      │           │  Python     │                 │
│   └─────────────┘           └──────┬──────┘                 │
│                                  │                          │
│                                  ▼                          │
│                          ┌───────────────┐                  │
│                          │  PostgreSQL   │                  │
│                          │   (giproy_erp)│                  │
│                          └───────────────┘                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Componentes Principales

| Componente | Tecnología | Puerto |
|------------|-------------|--------|
| Frontend | React + Vite | 3001 |
| Backend | FastAPI + Uvicorn | 3000 |
| Base de datos | PostgreSQL | 5432 |

---

## Sistema de Identificación de Dispositivos

### Descripción

El sistema implementa un mecanismo de identificación de dispositivos para:
- **Seguridad**: Controlar desde qué computadoras se accede al sistema
- **Anti-copia**: Identificar dispositivos autorizados
- **Auditoría**: Registrar accesos por dispositivo

### Cómo Funciona

1. **Generación de Fingerprint**: Al acceder, el navegador genera un identificador único basado en:
   - User Agent del navegador
   - Resolución de pantalla
   - Zona horaria
   - Canvas fingerprint
   - WebGL renderer
   - Hardware del dispositivo

2. **Registro en BD**: El dispositivo se registra automáticamente al primer login

3. **Validación**: En cada login se verifica:
   - Si el dispositivo está activo
   - Si no está bloqueado
   - Si requiere aprobación manual

4. **Control de Intentos**: 
   - Máximo 5 intentos fallidos
   - Bloqueo automático después del límite

### Flujo de Acceso

```
Usuario intenta login
        │
        ▼
        ... (Flujo de validación)
```

---

## Guía de Instalación

... (Secciones de instalación omitidas para brevedad en este log) ...

---

## Clonación y Migración de Datos

### Procedimiento Oficial de Clonación (Local a Beta)

Este procedimiento garantiza la paridad absoluta bit a bit entre el entorno de desarrollo y el servidor Beta.

#### 1. Generación del Volcado (PC Local)
Ejecutar en la terminal de desarrollo (PowerShell):
```powershell
$env:PGPASSWORD="CEE9846B4CFDA0E7E14E3722BE702C88"
& "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe" -U postgres -d giproy_erp -F p -f db_mirror_clon.sql --no-owner --no-privileges
```

#### 2. Transferencia al Servidor
```bash
scp db_mirror_clon.sql administrador@192.168.18.106:~/
```

#### 3. Restauración en el Servidor Beta
Ejecutar los siguientes comandos dentro del servidor SSH:

```bash
# A. Dar permisos de lectura al archivo
chmod 644 ~/db_mirror_clon.sql

# B. Detener servicios para liberar bloqueos
sudo systemctl stop giproy-backend

# C. Limpiar esquema actual (¡CUIDADO: Acción destructiva!)
sudo -u postgres psql -d giproy_erp -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# D. Restaurar datos nativos
sudo -u postgres psql -d giproy_erp -f ~/db_mirror_clon.sql

# E. Sincronizar permisos de usuario
sudo -u postgres psql -d giproy_erp -c "GRANT ALL PRIVILEGES ON SCHEMA public TO giproy_user; GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO giproy_user; GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO giproy_user;"

# F. Reiniciar servicios
sudo systemctl start giproy-backend
```

#### 4. Verificación de Integridad
```bash
sudo -u postgres psql -d giproy_erp -c "SELECT empresa_id, max_almacenamiento_bytes / 1024 / 1024 / 1024 as GB_FINAL FROM empresa_uso WHERE empresa_id = 3;"
```

---

*Documentación generada para GIPROY ERP v1.0.0*
*Última actualización: 2026-04-28 (Clonación de Datos Nativa)*
