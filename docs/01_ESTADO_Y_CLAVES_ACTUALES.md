# Estado Actual del Sistema y Claves de Acceso (Marzo 2026)

Este documento centraliza el estado de la infraestructura, configuraciones y accesos del proyecto ERP GiProy Network para evitar re-análisis futuros.

## 1. Stack Tecnológico Principal
*   **Backend**: Python con FastAPI (Asíncrono), SQLAlchemy (ORM), y Pydantic para validación.
*   **Frontend**: React 19 empaquetado con Vite, Tailwind CSS v4 para estilos, Axios para control de API.
*   **Base de Datos Actual**: **PostgreSQL** (se migró y reinstanció desde un estado inicial mixto MySQL/Postgres fallido).

## 2. Puertos y Servicios Locales
El sistema se arranca usando el script de consola `iniciar_sistema.bat` ubicado en la raíz del proyecto.
*   **Backend (API)**: `http://localhost:3000`
*   **Frontend (UI)**: `http://localhost:3001`
*   **PostgreSQL**: `localhost:5432`

## 3. Credenciales y Claves Críticas

### Base de Datos PostgreSQL 
(Configuradas en `backend/.env` y mapeadas a `app/core/config.py`):
*   **Motor**: postgresql
*   **Host**: localhost
*   **Puerto**: 5432
*   **Base de Datos**: `giproy_erp`
*   **Usuario**: `postgres`
*   **Contraseña**: `CEE9846B4CFDA0E7E14E3722BE702C88`

### Usuario Superadministrador (ERP)
Inyectado/Gestionado a través de `backend/scripts/manage_superuser.py`:
*   **Email de Acceso**: `benito.segura@gmail.com`
*   **Contraseña Hash**: `Kathiana96!a!`
*   **Rol en Sistema**: `Superadministrador`

## 4. Estado Actual de la Implementación (Refactorización)
*   **Seguridad CORS**: Solucionada. Solamente se admiten peticiones de `localhost:3000`, `3001` y `5173`.
*   **Dependencias de Encriptación**: Funcionales (`bcrypt` 3.2.2 acoplado con `passlib` para evitar fallos de librería al validar contraseñas).
*   **Limpieza de Repositorio**: Todos los scripts de prueba e inicialización de BD (`check_mysql.py`, `manage_superuser.py`, etc) fueron movidos de `backend/` hacia `backend/scripts/` para mantener el código "clean" y evitar inyecciones por error.
*   **Refactorización de Servicios (Aislación)**: El módulo de **Usuarios** ya está migrado a un modelo "Service Layer". Los módulos restantes (Empresas, Presupuestos, etc.) aún mezclan lógica SQL en los Controladores (API Endpoints).

> [!IMPORTANT]
> **No modificar**: La dependencia local `bcrypt` debe mantenerse en versiones < 4.0.0 hasta que `passlib` sea actualizado o removido de los requerimientos para no romper la verificación del hash en el login (`AttributeError: module 'bcrypt' has no attribute '__about__'`).
