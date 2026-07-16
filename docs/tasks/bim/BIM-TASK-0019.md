# BIM-TASK-0019: importacion JSON BIM y workspace activo

## Estado
Cerrada

## Objetivo

Agregar cobertura focal positiva para la importacion JSON BIM incubada y su
reflejo en el workspace backend, sin activar UI BIM ni tocar modulos clasicos.

## Alcance

- Probar `import_json_bim_package(...)` con modelo, version, storey y elemento.
- Verificar que `get_workspace_summary(...)` refleja version activa,
  agrupacion por nivel y conteo de elementos.
- Probar validacion JSON para IDs duplicados y resumen de geometria 2D.
- Mantener el alcance en backend BIM aislado.

## Resultado

- `backend/app/tests/test_bim_foundation.py` pasa de 13 a 15 pruebas focales.
- Queda cubierta la ruta positiva de importacion JSON BIM.
- Queda cubierta la validacion de duplicados y geometria basica.

## No interferencia

- Sin cambios frontend.
- Sin activar `BimTab`.
- Sin cambios DB reales.
- Sin rutas clasicas, auth/JWT/tenant compartido, EDT/APUs/Presupuesto ni
  Cronogramas.
- Sin Docker/Coolify/CI/CD/staging/produccion.

## Validacion

- `python -m py_compile backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py`: OK, 15 passed.
- Warnings conocidos: Pydantic BIM `model_name/model_id` y deprecacion `httpx`
  por `TestClient`.

## Pendiente posterior

- Cubrir links BIM EDT/APU/Presupuesto con datos minimos.
- Crear smoke BIM frontend positivo bajo flag controlada.

