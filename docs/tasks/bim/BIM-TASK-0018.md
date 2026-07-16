# BIM-TASK-0018: contratos API BIM bajo flags y tenant

## Estado
Cerrada

## Objetivo

Agregar cobertura focal de endpoints BIM para confirmar que la superficie API
respeta feature flags, readiness y frontera multiempresa sin activar GiProy
Clasico.

## Alcance

- Probar `/bim/feature-flags/me` con configuracion BIM apagada desde DB.
- Probar `/bim/projects/{project_id}/workspace` con BIM apagado.
- Probar workspace BIM habilitado para empresa permitida.
- Probar que un usuario normal no cruza a proyectos de otra empresa aunque
  envie `empresa_id`.
- Mantener los tests en una app FastAPI minima con routers BIM, sin montar la
  aplicacion completa ni rutas clasicas.

## Resultado

- `backend/app/tests/test_bim_foundation.py` pasa de 9 a 13 pruebas focales.
- Los endpoints BIM quedan cubiertos en los contratos iniciales de:
  - flag apagada;
  - flag encendida controlada;
  - workspace vacio con tablas listas;
  - bloqueo tenant.

## No interferencia

- Sin cambios frontend.
- Sin activar `BimTab`.
- Sin cambios DB aplicados.
- Sin tocar rutas clasicas, auth/JWT/tenant compartido, EDT, APUs, Presupuesto
  ni Cronogramas.
- Sin Docker/Coolify/CI/CD/staging/produccion.

## Validacion

- `python -m py_compile backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py`: OK, 13 passed.
- Warnings conocidos: Pydantic BIM `model_name/model_id` y deprecacion
  `httpx` por uso de `TestClient` con shortcut `app`.

## Pendiente posterior

- Crear tests positivos de importacion JSON y links BIM con datos reales de
  dominio.
- Crear smoke BIM frontend positivo con flag controlada, sin exponer BIM a
  usuarios no habilitados.

