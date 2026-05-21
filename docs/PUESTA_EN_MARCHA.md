# Guía de Puesta en Marcha y Paro del Sistema GIPROY ERP

## Tabla de Contenidos

1. [Información General](#información-general)
2. [Puesta en Marcha](#puesta-en-marcha)
3. [Paro del Sistema](#paro-del-sistema)
4. [Solución de Problemas](#solución-de-problemas)

---

## Información General

### Puertos Utilizados

| Servicio | Puerto | URL |
|----------|--------|-----|
| Backend (API) | 3000 | http://localhost:3000 |
| Frontend (Web) | 3001 | http://localhost:3001 |
| Base de Datos | 5432 | localhost:5432 |

### Credenciales de Acceso

| Campo | Valor |
|-------|-------|
| Email | benito.segura@gmail.com |
| Contraseña | Cocoliso.1 |
| Rol | Superadministrador |

---

## Puesta en Marcha

### Método 1: Manual (Recomendado para desarrollo)

#### Paso 1: Iniciar el Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 3000
```

#### Paso 2: Iniciar el Frontend

```bash
cd frontend
npm install
npm run dev
```

#### Paso 3: Acceder al Sistema

Abrir navegador en: **http://localhost:3001**

---

### Método 2: Usando Script Batch

#### Inicio Rápido

```bash
iniciar_sistema.bat
```

Este script:
- Abre una terminal con el Backend en puerto 3000
- Abre una terminal con el Frontend en puerto 3001
- Muestra las URLs de acceso

---

### Método 3: Servicio de Windows (Producción)

#### Instalación del Servicio

1. Haga clic derecho en `instalar_servicio.bat`
2. Seleccione **"Ejecutar como administrador"**
3. Espere a que complete la instalación
4. Elija iniciar el servicio inmediatamente

#### Iniciar el Servicio

```bash
control_servicio.bat start
```

O desde Windows:
```bash
sc start GIPROY_ERP
```

---

## Paro del Sistema

### Método 1: Cerrar Ventanas (Desarrollo)

Simplemente cierre las ventanas de terminal donde están ejecutándose:
- La ventana del Backend (Python/UVicorn)
- La ventana del Frontend (Node.js/Vite)

---

### Método 2: Usando Script Batch

```bash
cerrar_servidores.bat
```

Este script:
- Cierra todos los procesos Python (Backend)
- Cierra todos los procesos Node.js (Frontend)
- Libera los puertos utilizados

---

### Método 3: Servicio de Windows

#### Detener el Servicio

```bash
control_servicio.bat stop
```

O desde Windows:
```bash
sc stop GIPROY_ERP
```

---

## Verificación del Estado

### Backend

Acceda a: http://localhost:3000

Debería mostrar:
```json
{
  "sistema": "GIPROY ERP",
  "estado": "Operativo",
  "version": "1.0.0"
}
```

### Frontend

Acceda a: http://localhost:3001

Debería mostrar la página de login del sistema GIPROY.

### Servicio Windows

```bash
control_servicio.bat status
```

---

## Solución de Problemas

### Error: "Puerto en uso"

Si al iniciar aparece error de puerto en uso:

```bash
cerrar_servidores.bat
```

Luego inicie nuevamente:
```bash
iniciar_servicio.bat
```

### Error: "Acceso denegado" en Servicio Windows

Asegurese de ejecutar como **Administrador**:

1. Haga clic derecho en el archivo .bat
2. Seleccione "Ejbrevi como administrador"

### No puedo acceder al sistema

1. Verifique que el Backend esté ejecutándose en puerto 3000
2. Verifique que el Frontend esté ejecutándose en puerto 3001
3. Verifique que PostgreSQL esté ejecutándose

### Verificar Procesos Activos

```bash
tasklist | findstr python
tasklist | findstr node
```

---

## Comandos Rápidos de Referencia

| Acción | Comando |
|--------|---------|
| Iniciar (manual) | `iniciar_sistema.bat` |
| Cerrar (manual) | `cerrar_servidores.bat` |
| Instalar servicio | `instalar_servicio.bat` (Admin) |
| Desinstalar servicio | `desinstalar_servicio.bat` (Admin) |
| Iniciar servicio | `control_servicio.bat start` |
| Detener servicio | `control_servicio.bat stop` |
| Reiniciar servicio | `control_servicio.bat restart` |
| Estado servicio | `control_servicio.bat status` |

---

*Última actualización: 2026-02-22*
