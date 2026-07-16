# BIM-TASK-0072 - Job de importacion IFC observable

Estado: Cerrada localmente

## Objetivo

Convertir la importacion IFC en un proceso persistente, observable e
idempotente, sin bloquear el request HTTP ni publicar versiones incompletas.

## Alcance autorizado

- Perimetro BIM aislado y backend comun existente.
- Migracion Alembic aditiva sobre la rama BIM.
- Endpoints, cliente API y componente frontend exclusivamente BIM.
- Sin cambios en auth, tenant, rutas clasicas, TASK-1807 o infraestructura.

## Implementacion

- `bim_import_jobs` persiste proyecto, empresa, usuario iniciador, checksum,
  archivo fuente, estado, etapa, progreso, intentos, cancelacion, error,
  resultado y timestamps.
- La revision `de2002a1b2c3` agrega la tabla sin modificar tablas clasicas.
- La creacion calcula una clave idempotente por tenant, proyecto, modelo,
  disciplina, version y checksum; una repeticion devuelve el mismo job.
- El procesamiento usa sesion independiente y savepoint para persistencia:
  una falla revierte solo la version parcial y conserva el job fallido.
- Las versiones exitosas quedan `ready_for_review`, inactivas y nunca desplazan
  automaticamente la version activa anterior.
- API aditiva: crear `202`, listar, consultar, cancelar y reintentar.
- `BimImportJobsPanel` ofrece carga IFC, progreso, error, cancelacion y retry;
  el polling de 1.5 s solo continua mientras existen jobs no terminales y se
  limpia al desmontar.
- La UX se monta unicamente en `BimWorkspace` para superadministrador habilitado
  y usa el cliente de dominio `frontend/src/api/bimModels.js`.

## Validacion

- `pytest test_bim_import_jobs.py test_bim_import_job_migration.py
  test_bim_import_job_endpoints.py test_bim_foundation.py`: 49 passed.
- `py_compile` de modelos, schemas, servicios, endpoints y tests: OK.
- `alembic heads`: `de2002a1b2c3` reconocido como head BIM.
- `node scripts/smoke-bim-workspace-positive.mjs`: OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build`: OK; warning conocido de chunk grande Vite.
- Warnings conocidos no bloqueantes: Pydantic `model_name/model_id`, httpx y
  transacciones de fixtures preexistentes.

## No interferencia clasica

- El endpoint sincronico `/imports/ifc-file` permanece compatible.
- No se modifica ninguna pantalla, API, modelo o servicio clasico.
- Proyectos clasico conserva BIM forzado apagado y el smoke anti-BIM pasa.
- No se toca TASK-1807, Docker, Coolify, CI/CD, staging o produccion.

## Limites declarados

- El dispatcher local usa `FastAPI.BackgroundTasks`; los jobs persistidos
  pueden reintentarse tras reinicio, pero un worker distribuido pertenece a
  una fase de infraestructura no autorizada.
- Una version importada requiere revision y activacion posterior explicita.

## Rollback

Retirar la migracion `de2002a1b2c3`, modelo, schema, servicio, endpoints, tests,
cliente y panel BIM. El endpoint IFC sincronico y GiProy Clasico permanecen
operativos durante todo el rollback.
