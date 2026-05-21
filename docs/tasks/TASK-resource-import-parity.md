# TASK: Paridad Importador de Recursos

## TASK-RES-01: Discovery y mapping funcional

- objetivo: comparar capacidades actuales recursos vs APUs y fijar alcance
- archivos afectados: `docs/resource_import_parity_execplan.md`, `docs/tasks/TASK-resource-import-parity.md`
- dependencias: ninguna
- validación: plan y tasks documentadas

## TASK-RES-02: Parser y preview inteligente de recursos

- objetivo: ampliar reconocimiento, normalización y motivos de validación
- archivos afectados: `frontend/src/pages/Recursos.jsx`
- dependencias: TASK-RES-01
- validación: preview clasifica filas válidas, duplicadas y omitidas

## TASK-RES-03: Modal UX de importación de recursos

- objetivo: igualar patrón visual/operativo del importador de APUs
- archivos afectados: `frontend/src/pages/Recursos.jsx`
- dependencias: TASK-RES-02
- validación: modal muestra ayuda, métricas, tabla y CTA contextual

## TASK-RES-04: Robustez backend de importación

- objetivo: endurecer validaciones y feedback del lote importado
- archivos afectados: `backend/app/services/recurso.py`, `backend/app/api/endpoints/recursos.py`, `backend/app/schemas/recurso.py`
- dependencias: TASK-RES-02
- validación: respuestas backend consistentes y sin errores silenciosos

## TASK-RES-05: Validación final

- objetivo: asegurar estabilidad del bloque
- archivos afectados: frontend/backend implicados
- dependencias: TASK-RES-03, TASK-RES-04
- validación: `py_compile` y `npm run build`
