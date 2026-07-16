# BIM-TASK-0020: links BIM latentes con EDT

## Estado
Cerrada

## Objetivo

Agregar cobertura focal para links BIM latentes hacia EDT sin activar navegacion
visible en GiProy Clasico.

## Alcance

- Crear un modelo BIM importado por JSON.
- Crear un nodo EDT minimo dentro del mismo proyecto/empresa.
- Crear link BIM -> EDT mediante `create_link_for_project(...)`.
- Verificar idempotencia del link.
- Verificar listado de links por proyecto.
- Bloquear link hacia EDT de otro proyecto/empresa.

## Resultado

- `backend/app/tests/test_bim_foundation.py` pasa de 15 a 17 pruebas focales.
- Los links BIM -> EDT quedan cubiertos como contrato latente backend.
- No se activa navegacion desde EDT ni se toca UI clasica.

## No interferencia

- Sin cambios frontend.
- Sin activar `BimTab`.
- Sin modificar componentes EDT clasicos.
- Sin cambios DB reales.
- Sin auth/JWT/tenant compartido, APUs, Presupuesto ni Cronogramas.
- Sin Docker/Coolify/CI/CD/staging/produccion.

## Validacion

- `python -m py_compile backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py`: OK, 17 passed.
- Warnings conocidos: Pydantic BIM `model_name/model_id` y deprecacion `httpx`
  por `TestClient`.

## Pendiente posterior

- Cubrir links BIM latentes con APUs y Presupuesto.
- Crear smoke BIM frontend positivo bajo flag controlada.

