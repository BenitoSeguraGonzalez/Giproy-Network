# Auditoria conservadora de indice Git

Fecha: 2026-05-22

Modo: GIPROY CLASICO

## Objetivo

Revisar el estado real del indice Git antes de avanzar a Fase 5, sin borrar archivos, sin mover contenido y sin alterar comportamiento de la aplicacion.

## Resultado

- Archivos ya versionados que coinciden con reglas actuales de `.gitignore`: 49.
- Entradas ignoradas no versionadas detectadas por `git status --ignored`: 112.
- No se ejecuto `git rm --cached`.
- No se eliminaron uploads, backups, dumps, logs ni temporales.
- No se tocaron rutas frontend/backend, DB, auth, tenant ni contratos API.

## Archivos trackeados que requieren decision explicita

Estos archivos ya estan en el indice. Aunque `.gitignore` los proteja para cambios futuros, Git los seguira controlando hasta retirar cada lote con una accion explicita y revisable.

```text
.aider.tags.cache.v4/cache.db
.runtime/monitor/alerts.jsonl
.runtime/monitor/metrics.jsonl
Complementos/Aspose.Tasks for Java 20.2 (25 Feb 2020) Retail + License Key/aspose-tasks-20.2-java.zip
DBDump/categoria_indirectos.sql
DBDump/codcpc.sql
DBDump/conceptos_indirectos.sql
DBDump/giproylocal_2.sql
DBDump/giproynet.sql
DBDump/tipo_categorias.sql
DBDump/tipo_proyectos.sql
DBDump/unidades.sql
GiProy Control Center.lnk
auth_session_trace.jsonl
backend/auth_session_trace.jsonl
backups/migration_20260318_173151/apus.json
backups/migration_20260318_173151/presupuesto_detalles.json
backups/migration_20260318_173151/recursos.json
backups/migration_20260318_173151/subcategorias_items.json
deploy.tar.gz
test_multicompany.db
tmp/Cronograma Valorado.xlsx
tmp/Desagregacion Tecnologica.xlsx
tmp/Formula Polinomica - con desglose de equipo.xlsx
tmp/Formula Polinomica - sin desglose de equipo.xlsx
tmp/analyze_budget_cats.py
tmp/check_cpc_vae.py
tmp/check_cpc_vae_sync.py
tmp/check_db_state.py
tmp/check_monomios.py
tmp/compare_polinomica.py
tmp/debug_polinomica_resources.py
tmp/debug_redistribution.py
tmp/diagnose_api.py
tmp/dump_excel.py
tmp/excel_dump.json
tmp/find_recent_budgets.py
tmp/inspect_apu_calc.py
tmp/inspect_budgets.py
tmp/inspect_equipment.py
tmp/inspect_excel.py
tmp/inspect_form1.py
tmp/inspect_polinomica.py
tmp/list_sheets.py
tmp/polinomica_logic.json
tmp/test_api_response.py
tmp/test_serialization.py
tmp/trace_aggregation.py
tmp/verify_all_budgets.py
```

## Recomendacion segura

1. No abrir Fase 5 hasta decidir si se sanea el indice.
2. Si se sanea, hacerlo por lotes pequenos con `git rm --cached` y revision posterior.
3. Primer lote recomendado: trazas y caches (`*.jsonl`, `.aider.tags.cache.v4`, `.runtime`).
4. Segundo lote recomendado: dumps y backups (`DBDump/`, `backups/`, `*.db`, `*.tar.gz`, `*.zip`).
5. Tercer lote recomendado: temporales `tmp/`, previa busqueda de referencias.

## No interferencia BIM

- No se modifico codigo BIM.
- No se activo UX BIM.
- No se agregaron dependencias BIM.
- La auditoria es documental y de higiene Git.
