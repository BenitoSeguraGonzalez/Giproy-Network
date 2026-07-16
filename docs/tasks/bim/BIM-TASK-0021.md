# BIM-TASK-0021: links BIM latentes con APUs y Presupuesto

## Estado
Cerrada

## Objetivo

Completar la cobertura backend de links BIM latentes hacia APUs y Presupuesto,
sin activar navegacion visible ni modificar modulos clasicos.

## Alcance

- Crear links BIM -> APU con target de la misma empresa.
- Verificar idempotencia y listado de links APU.
- Bloquear links BIM -> APU hacia otra empresa.
- Crear links BIM -> Presupuesto con linea del mismo proyecto/empresa.
- Verificar idempotencia y listado de links Presupuesto.
- Bloquear links BIM -> Presupuesto hacia otro proyecto/empresa.

## Resultado

- `backend/app/tests/test_bim_foundation.py` pasa de 17 a 21 pruebas focales.
- Los links latentes BIM hacia EDT, APUs y Presupuesto quedan cubiertos en
  backend.
- La navegacion cruzada visible sigue desactivada y fuera de alcance.

## No interferencia

- Sin cambios frontend.
- Sin activar `BimTab`.
- Sin modificar pantallas, servicios ni flujos clasicos de APUs o Presupuesto.
- Sin cambios DB reales.
- Sin auth/JWT/tenant compartido, EDT visible, Cronogramas, Docker/Coolify,
  CI/CD, staging ni produccion.

## Validacion

- `python -m py_compile backend\app\tests\test_bim_foundation.py`: OK.
- `..\.venv\Scripts\python.exe -m pytest app\tests\test_bim_foundation.py`: OK, 21 passed.
- Warnings conocidos: Pydantic BIM `model_name/model_id` y deprecacion `httpx`
  por `TestClient`.

## Pendiente posterior

- Crear smoke BIM frontend positivo bajo flag controlada.
- Validar visualmente workspace/canvas BIM no vacio sin exponerlo a usuarios no
  habilitados.

