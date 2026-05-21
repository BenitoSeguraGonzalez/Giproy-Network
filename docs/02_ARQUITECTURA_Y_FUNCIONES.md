# Arquitectura Interna y Diccionario de Funciones

El backend del ERP opera bajo un patrón multicapa (aproximación al Clean Architecture/Domain Driven Design ligero) orquestado en FastAPI.

## Estructura de Directorios (backend/app/)
*   `api/endpoints/`: Controladores. Definen las rutas (ej. `@router.get`). **No deben tener lógica de negocio pesada, solo mapear I/O HTTP**.
*   `services/`: Casos de Uso (Lógica de negocio). Aquí residen las validaciones como "Este usuario puede crear esto bajo estas reglas".
*   `repositories/`: Patrón Repositorio. Abstracción pura sobre SQLAlchemy. Interactúa con la base de datos (CRUD simple).
*   `models/`: Estructuras de tablas (SQLAlchemy Base).
*   `schemas/`: Estructuras de datos I/O (Pydantic). Las "formas" requeridas para validar cada JSON de entrada o salida.

---

## Funciones Clave Documentadas (Hasta la fecha)

### 1. Módulo Usuarios (`app/services/usuario.py`)
El módulo principal que ha sido refactorizado y purgado del controlador HTTP. Opera bajo la clase instanciada globalmente `usuario_service`.

*   **`create_usuario(db, user_in, current_user)`**
    *   **Propósito**: Ejecuta la lógica para inscribir nuevos usuarios evaluando la jerarquía de roles.
    *   **Reglas**: Si `current_user` es "Superadministrador", puede crear roles altos o bajos. Si es "administrador", solo puede crear "usuarios" normales atados forzosamente a su misma *Empresa ID*. Rechaza peticiones si el email ya existe. Pasa la estructura a `usuario_repo.create()`.
*   **`validar_ruc(ruc, token)`**
    *   **Propósito**: Delega la consulta del Identificador Fiscal a un extremo SRI externo usando `httpx` asíncrono.
    *   **Reglas**: Filtra strings para requerir exactamente longitud de 13 dígitos numéricos. Maneja fallos de ping, timeout y respuestas del proveedor retornando un objeto Pydantic ordenado con los datos fiscales (`ValidarRucResponse`).

### 2. Módulo Auth (`app/api/endpoints/auth.py`)
Encargado de los tokens JWT y verificación de login. Se mantiene en el área de Endpoints debido a su alta vinculación a las directivas HTTP `Depends()` de FastAPI.

*   **`login_access_token`**
    *   **Propósito**: Verifica credenciales e inicializa el Token de acceso JWT con duración finita (`settings.ACCESS_TOKEN_EXPIRE_MINUTES`).
    *   **Reglas Especiales**: Bloquea el login de forma silenciosa si: 
        1. La contraseña proporcionada y la hasheada con `bcrypt` no coinciden. 
        2. El usuario está desactivado (`activo == False`). 
        3. La *Empresa* del sujeto tiene una bandera de desactivación (`empresa.activa == False`).
        4. Si trae `device_id` en las cabeceras, previene la entrada si el dispositivo figura como inactivo o bloqueado en tabla.

### 3. Seguridad y Core (`app/core/`)
*   **`config.py (Settings)`**: Lee las variables del archivo central `.env` inyectándolas pasivamente a FastAPI. Forma en runtime la URL de la base de datos `sync_database_url` dinámicamente.
*   **`deps.py (get_current_active_user)`**: Middleware de inyección utilizado en docenas de endpoints para desenmarañar el token JWT llegado por "Bearer Header", recuperar el sujeto y retornar el Modelo de Usuario completo asociado para operar. Devuelve error 403 o 401 si expira la sesión o se corrompe.
*   **`database.py`**: Aísla el `engine` global de SQLAlchemy habilitando el `pool_pre_ping=True` para descartar conexiones muertas pasivas si PostgreSQL se reinicia durante el uso.
