# Guía de Recuperación y Respaldo: Fix de Autorización y Puertos

Este documento sirve como respaldo técnico de todos los cambios realizados para solucionar el error persistente de autorización ("403 Forbidden") y el desajuste de puertos entre el Frontend y el Backend.

## 1. Cambios en la Lógica del Backend
**Archivo:** `backend\app\api\deps.py`
- **Cambio**: Se modificó el código de estado de error `403` a `401`.
- **Razón**: El error 403 (Prohibido) es permanente en el frontend; el 401 (No autorizado) activa el refresco de sesión o redirección al login.
- **Líneas clave**:
```python
except jwt.PyJWTError as e:
    # Log de diagnóstico añadido para ver la causa real en auth_debug.log
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
```

## 2. Sincronización de Puertos (Estructura)
Se ha estandarizado el uso del **Puerto 3000** para el Backend (anteriormente intentaba usar el 8010, causando desconexión).

### Ajustes realizados:
1.  **Launcher Config** (`tools\launcher\launcher_app\config.py`):
    - `backend_port: int = 3000` (Asegura que el Launcher no intente volver al 8010).
2.  **Frontend .env** (`frontend\.env`):
    - `VITE_API_URL=http://127.0.0.1:3000/api/v1`
    - `VITE_BACKEND_PORT=3000`
3.  **Vite Proxy** (`frontend\vite.config.js`):
    - Se actualizó el `target` de la API a `http://localhost:3000`.

## 3. Herramientas de Mantenimiento
**Archivo modificado:** `cerrar_servidores.bat`
- Se añadió la detención de servicios de Windows: `sc stop GiProy-Backend`.
- Se añadió la limpieza del puerto `8010` (por si quedaran procesos de intentos fallidos anteriores).
- Se añadió la limpieza forzada de procesos `python.exe` y `node.exe`.

---

## Cómo verificar si el problema vuelve:
1.  **Revisar Logs**: Abre `backend\auth_debug.log`. Si ves "JWT VALIDATION FAILED", el arreglo del código (401) está funcionando.
2.  **Revisar Puertos**: Ejecuta `netstat -ano | findstr :3000` en la consola. Debes ver una línea que diga `LISTENING`.
3.  **Coexistencia con NurIA**: GiProy ahora usa el puerto **3000**, mientras que NurIA-Core usa el **8001**. No deben interferir entre sí.

---
**Fecha del arreglo:** 11 de Marzo de 2026
**Estado:** Confirmado y persistente (Estructural).
