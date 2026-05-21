# Plan Seguro de Refactor Enterprise - GiProy Network

Fecha: 2026-05-20  
Modo: GIPROY CLASICO  
Principio rector: estabilidad antes que optimizacion

## Objetivo

Profesionalizar GiProy Network para VSCode, Codex/OpenCode, GitHub privado, Docker, Coolify, staging, produccion SaaS y mantenimiento enterprise sin romper comportamiento actual.

## Estado de control vigente

Fecha de control: 2026-05-21.

Artefactos ya disponibles para trabajar sin reanalisis completo:

- `AI_CONTEXT.md`: contexto persistente actualizado para sesiones IA.
- `docs/project_state.json`: snapshot de arquitectura, modulos sensibles, dependencias y tooling IA.
- `docs/repo_hygiene_inventory.json`: inventario reproducible de higiene de repositorio.
- `docs/logging_inventory.json`: inventario reproducible de logging, consola y posibles terminos sensibles.
- `docs/LOGGING_POLICY.md`: politica conservadora de logging seguro.
- `docs/ENTERPRISE_VALIDATION_RUNBOOK.md`: comandos y criterios de cierre para validacion enterprise.
- `tools/ai_tools/validate_enterprise_baseline.py`: gate local reproducible para JSON, backend, frontend y smoke anti-BIM.

Regla operativa:

- Antes de abrir una fase nueva, ejecutar el baseline enterprise si el cambio puede afectar runtime.
- No regenerar snapshots salvo que el slice lo requiera.
- Si se regeneran snapshots, documentar TASK + CHANGELOG y validar JSON.
- En MODO 1, cualquier deuda BIM detectada se documenta, no se corrige.

## Fase 0 - Gobierno y linea base

Prioridad: maxima.

Acciones:

- Mantener `AI_CONTEXT.md`, `docs/project_state.json`, `docs/HANDOFF.md` y `docs/runtime/WORK_MODE_STATE.json` actualizados.
- Mantener `docs/ENTERPRISE_VALIDATION_RUNBOOK.md` como referencia de comandos de cierre.
- Documentar riesgos antes de tocar codigo.
- Definir gates obligatorios por modulo.
- No alterar DB, rutas, auth, tenant ni contratos API.

Validaciones:

- `git status --short`
- parseo JSON de snapshots
- revision de `.gitignore`
- `tools/ai_tools/validate_enterprise_baseline.py --include-frontend` cuando el slice pueda afectar runtime
- smoke no contaminacion BIM cuando haya cambios frontend

Rollback:

- revertir solo documentos/snapshots de esta fase.

## Fase 1 - Higiene de repositorio sin movimiento funcional

Prioridad: alta.

Acciones:

- Clasificar artefactos temporales, dumps, logs, perfiles de navegador y scripts sueltos.
- Crear inventario de scripts con estado: productivo, debug, migracion historica, QA, desconocido.
- Endurecer `.gitignore` para impedir nuevo ruido.
- No borrar ni mover archivos aun.
- Regenerar `docs/repo_hygiene_inventory.json` solo cuando cambien reglas de clasificacion o se trabaje un lote de higiene.

Validaciones:

- busqueda `rg --files` focal por patrones peligrosos
- revision manual de secretos antes de GitHub privado

Rollback:

- revertir cambios de `.gitignore` o documentos.

## Fase 2 - Consolidacion documental y snapshots IA

Prioridad: alta.

Acciones:

- Actualizar snapshot de arquitectura por dominios.
- Separar decision vigente de historial en docs.
- Mantener `docs/tasks` como bitacora por slices.
- Mantener `docs/logging_inventory.json` y `docs/repo_hygiene_inventory.json` como snapshots auxiliares, no como fuente de cambios automaticos.

Validaciones:

- JSON valido en `docs/project_state.json`
- JSON valido en snapshots auxiliares si se modifican
- lectura cruzada con `docs/architecture/project_map.json`

Rollback:

- restaurar snapshot previo.

## Fase 3 - Validacion tecnica base

Prioridad: alta.

Acciones:

- Validar imports backend por modulo.
- Ejecutar tests focales existentes antes de tocar dominios.
- Validar build frontend.
- Confirmar que BIM no se activa ni contamina UX clasica.

Validaciones recomendadas:

- Backend: `python -m py_compile` focal sobre archivos tocados.
- Backend: `python -m pytest app/tests/<test_focal>.py -q`.
- Frontend: `npm run build`.
- Frontend: `node scripts/smoke-classic-no-bim-contamination.mjs`.
- General: `python tools/ai_tools/validate_enterprise_baseline.py --include-frontend`.

Rollback:

- revertir slice concreto; no usar reset destructivo.

## Fase 4 - Modularizacion incremental backend

Prioridad: media.

Regla: solo por dominio y con pruebas.

Orden recomendado:

1. utilidades puras y helpers sin DB
2. servicios pequenos con baja dependencia
3. clientes/reporting auxiliares
4. dominios ERP criticos solo con cobertura focal
5. Cronogramas/Gantt, Presupuesto/APU y Marketplace al final

No hacer:

- mover modelos criticos sin migracion y pruebas
- alterar rutas publicas
- fusionar repositorios sin equivalencia probada

Rollback:

- mantener wrappers de compatibilidad cuando se mueva una funcion.

## Fase 5 - Modularizacion incremental frontend

Prioridad: media.

Orden recomendado:

1. componentes UI compartidos ya estabilizados
2. clientes API y hooks de dominio
3. extraccion de subcomponentes desde paginas grandes
4. rutas internas o lazy loading solo si build y runtime lo validan

Modulos sensibles:

- `Proyectos.jsx`
- `CronogramaGantt.jsx`
- `PresupuestoDetail` y `ApuBudgetEditor`
- Marketplace dashboards
- Comunidad
- AdminGlobal

Rollback:

- conservar imports antiguos temporalmente si una extraccion requiere transicion.

## Fase 6 - Entornos y Docker

Prioridad: posterior a limpieza.

Acciones:

- Documentar variables `local`, `staging`, `production`.
- Crear Dockerfile backend y frontend sin alterar entorno local.
- Preparar `docker-compose` con Postgres y, futuro, Redis.
- No introducir Redis hasta existir necesidad implementada.

Validaciones:

- build local actual sigue pasando
- contenedores levantan sin migraciones destructivas
- Alembic se ejecuta de forma explicita, no magica

Rollback:

- Docker debe ser paralelo; el flujo local actual permanece intacto.

## Fase 7 - CI/CD y Coolify

Prioridad: posterior a Docker.

Acciones:

- Pipeline GitHub privado: lint/build/test focal.
- Staging antes de produccion.
- Coolify con frontend, backend, Postgres y futuros workers separados.
- Deploy manual o gated al inicio.

Validaciones:

- healthchecks backend/frontend
- migraciones revisadas
- smoke tenant/auth

Rollback:

- rollback de imagen/tag anterior.

## Fase 8 - Produccion SaaS

Prioridad: final.

Acciones:

- Observabilidad: logs estructurados, Loki/Grafana/Prometheus documentados.
- Backups verificados.
- Politica de migraciones segura.
- Separacion futura de workers para PDFs, IA, reportes, imports y jobs largos.

Rollback:

- backups probados, versionado de imagenes y migraciones reversibles cuando aplique.

## Gates permanentes

- No romper auth.
- No romper tenant.
- No romper Presupuesto/APU/EDT/Cronogramas.
- No alterar DB sin Alembic revisado.
- No activar BIM en UX clasica.
- No borrar codigo aparentemente muerto.
- No mover scripts sin inventario y busqueda de referencias.
- No reducir logs/consola de forma masiva sin `docs/LOGGING_POLICY.md` y `docs/logging_inventory.json` actualizados.
