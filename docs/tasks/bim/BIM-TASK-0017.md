# BIM-TASK-0017: gobierno runtime de esquema BIM y tests focales

## Estado
Cerrada

## Objetivo

Endurecer el dominio BIM para que no cree tablas en runtime despues de crear la
migracion Alembic principal, y agregar cobertura focal de feature flags y
readiness de esquema.

## Alcance

- Ajustar servicios BIM para verificar readiness de tablas sin crearlas.
- Mantener lecturas BIM tolerantes cuando el esquema no esta listo.
- Hacer que escrituras BIM fallen explicitamente si falta aplicar Alembic.
- Cubrir feature flags BIM por entorno, allowlists y configuracion DB.
- Cubrir frontera tenant de resolucion de proyecto BIM.
- Cubrir que readiness BIM no cree tablas runtime.
- No tocar GiProy Clasico, UX visible, rutas clasicas, auth, tenant compartido,
  EDT, APUs, Presupuesto ni Cronogramas.

## Resultado

- `backend/app/services/bim/model_registry.py` ya no crea tablas BIM desde
  servicios.
- `backend/app/services/bim/view_state_service.py` ya no crea
  `bim_view_states` desde servicios.
- `backend/app/services/system_bim_setting.py` ya no crea
  `system_bim_settings` desde servicios.
- Se agrega `backend/app/tests/test_bim_foundation.py` con 9 pruebas focales.

## No interferencia

- Sin cambios frontend.
- Sin activar `BimTab`.
- Sin cambios DB aplicados.
- Sin cambios Docker/Coolify/CI/CD/staging/produccion.
- Sin dependencia nueva desde modulos clasicos hacia BIM.

## Validacion

- `python -m py_compile backend\app\services\bim\model_registry.py backend\app\services\bim\view_state_service.py backend\app\services\system_bim_setting.py backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py`: OK, 9 passed, warnings conocidos Pydantic BIM `model_name/model_id`.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

## Pendiente posterior

- Validar aplicacion real de Alembic BIM en DB local controlada.
- Crear pruebas focales de endpoints `/bim` con flag apagada/encendida.
- Crear smoke BIM positivo controlado sin activar GiProy Clasico para usuarios
  no habilitados.
