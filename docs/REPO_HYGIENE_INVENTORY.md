# Inventario de Higiene del Repositorio - GiProy Network

Fecha: 2026-05-21  
Modo: GIPROY CLASICO  
Alcance: inventario sin mover, borrar ni reescribir codigo

## Principio de esta fase

Este documento clasifica artefactos y scripts para preparar una limpieza segura. No autoriza eliminacion automatica. Todo movimiento futuro debe hacerse por lote pequeno, con busqueda de referencias y rollback.

## Resumen

El repositorio contiene una mezcla de:

- codigo productivo backend/frontend
- pruebas formales en `backend/app/tests`
- scripts operativos historicos
- scripts debug temporales
- backups y dumps
- bases locales
- perfiles de navegador de QA
- logs y trazas
- binarios/licencias externas

La prioridad no es borrar; es distinguir que puede ignorarse, que debe conservarse documentado, que necesita traslado controlado y que debe revisarse por posible secreto.

## Inventario reproducible

La clasificacion manual queda respaldada por tooling local:

- Script: `tools/ai_tools/repo_hygiene_inventory.py`
- Snapshot JSON: `docs/repo_hygiene_inventory.json`
- Comando: `.venv\Scripts\python.exe tools\ai_tools\repo_hygiene_inventory.py --json docs\repo_hygiene_inventory.json`

Resultado de referencia de 2026-05-21:

- 10.515 archivos escaneados.
- 7.054 archivos clasificados por riesgo o conservacion.
- 49 artefactos criticos sensibles.
- 6.745 artefactos altos generados/locales.
- 201 scripts sueltos de riesgo medio.
- 59 pruebas formales o assets de riesgo bajo.

Este snapshot no autoriza limpieza automatica. Sirve para planificar lotes pequenos, revisar secretos antes de GitHub privado y evitar que futuras sesiones IA reanalicen todo el repositorio desde cero.

## Clasificacion de riesgo

### Riesgo critico: revisar antes de GitHub privado

Estos archivos o carpetas pueden contener credenciales, tokens, dumps productivos, sesiones o material licenciado:

- `docs/db_credentials.txt`
- `CloudFlared-bkp/*token*.txt`
- `delphi version/github API Key.txt`
- `DBDump/*.sql`
- `DBDump/*.dump`
- `backups/`
- `backend/db_mirror_clon.sql`
- `backend/backup_before_apu_migration.sql`
- `deploy.tar.gz`
- `Complementos/Aspose.Tasks for Java 20.2 (25 Feb 2020) Retail + License Key/`
- `auth_session_trace.jsonl`
- `backend/auth_session_trace.jsonl`

Accion segura recomendada:

- No publicar hasta revisar contenido.
- Mover a almacenamiento privado externo o vault si son necesarios.
- Si se requiere conservar evidencia, generar version anonimizda.

### Riesgo alto: artefactos locales o generados

Archivos que no deberian versionarse como fuente:

- `backend/*.db`
- `backend/app/core/database.db`
- `test_multicompany.db`
- `*.log`
- `frontend/tmp_*.png`
- `frontend/*lint*.txt`
- `frontend/*lint*.json`
- `frontend/gantt-ff-harness.html`
- `frontend/formula-responsive-harness.html`
- `tmp/edge-*`
- `tmp/edge-profile-clone`
- `tmp/*backup*.json`
- `tmp/*.xlsx`
- `tmp/*.pdf`
- `tmp/*.docx`

Accion segura recomendada:

- Mantener ignorados por Git.
- No borrar sin confirmar si son evidencia de QA activa.
- Para limpiar, crear primero un backup externo o etiqueta de archivo.

### Riesgo medio: scripts sueltos con posible utilidad operativa

Raiz:

- `check_*.py`
- `verify_*.py`
- `fix_*.py`
- `tmp_*.py`
- `test_*.py`
- `audit_users.py`
- `clean_roles.py`
- `migrate_*.py`
- `restart_backend.py`
- `inspect_repo.py`

Backend:

- `backend/check_*.py`
- `backend/verify_*.py`
- `backend/debug_*.py`
- `backend/fix_*.py`
- `backend/test_*.py`
- `backend/manual_migration.py`

Scripts:

- `scripts/check_*.py`
- `scripts/verify_*.py`
- `scripts/debug_*.py`
- `scripts/seed_*.py`
- `scripts/apply_*.py`
- `scripts/backup_before_migration.py`

Backend scripts:

- `backend/scripts/check_*.py`
- `backend/scripts/verify_*.py`
- `backend/scripts/test_*.py`
- `backend/scripts/debug_*.py`
- `backend/scripts/fix_*.py`
- `backend/scripts/migrate_*.py`
- `backend/scripts/create_*.py`
- `backend/scripts/seed_*.py`

Accion segura recomendada:

- Antes de mover: buscar referencias exactas por nombre.
- Separar en:
  - `tools/debug/`
  - `scripts/debug/`
  - `scripts/migrations_legacy/`
  - `scripts/ops/`
  - `backend/app/tests/` solo si son pruebas formales.
- Mantener wrappers temporales si algun comando externo depende de ruta antigua.

### Riesgo bajo: pruebas formales o assets productivos

Conservar:

- `backend/app/tests/test_*.py`
- `tools/launcher/tests/test_ops_smoke.py`
- `frontend/public/favicon.png`
- `frontend/src/assets/*.png`
- `assets/LogoSoft.png`
- `assets/favico.png`
- `frontend/assets/tienda/**`

Accion segura recomendada:

- No mover durante higiene inicial.
- Si se reubican assets, validar imports y build frontend.

## Candidatos de cuarentena por lote

### Lote A - Gitignore y seguridad

Estado: parcialmente ejecutado y reproducible.

- Ignorar dumps, DB locales, logs, `tmp/`, `backups/`, comprimidos y credenciales locales.
- Agregar patrones especificos para `frontend/tmp_*`, lint outputs, CloudFlared backup, Complementos y archivos de claves.
- Regenerar `docs/repo_hygiene_inventory.json` tras cada lote de limpieza para comparar conteos.

Validacion:

- `git status --short`
- revisar que no se oculten fuentes productivas nuevas por accidente.

### Lote B - Scripts raiz

No ejecutar aun.

Objetivo:

- Inventariar y mover solo scripts sin referencias.

Validacion previa:

- `rg "nombre_script"` en repo completo.
- confirmar si el script aparece en docs, launchers, tareas o handoff.

### Lote C - Backend scripts historicos

No ejecutar aun.

Objetivo:

- Separar migraciones historicas, debug DB y operaciones utiles.

Riesgo:

- Algunos scripts pueden haber sido usados para saneamientos reales de empresas/proyectos.
- Moverlos sin wrappers puede romper instrucciones operativas documentadas.

### Lote D - Tmp y perfiles de navegador

No ejecutar aun.

Objetivo:

- Retirar `tmp/edge-*` y evidencias voluminosas del repo.

Riesgo:

- Pueden contener screenshots o estado usado para reproducir bugs recientes.

## Reglas para movimiento futuro

1. Un lote por TASK.
2. Buscar referencias antes de mover.
3. No borrar; mover primero a carpeta controlada.
4. Mantener `README.md` en carpeta destino explicando origen y fecha.
5. Ejecutar validacion minima:
   - JSON docs si se toca documentacion.
   - `py_compile` si se mueven scripts Python importables.
   - `npm run build` si se tocan assets frontend o imports.
   - smoke no contaminacion BIM si se toca frontend clasico.
6. Documentar CHANGELOG y TASK.

## No interferencia BIM

Este inventario no cambia la capa BIM ni la capa clasica. BIM se menciona solo como restriccion de validacion: cualquier limpieza futura que toque frontend clasico debe confirmar que no se activa UX BIM.
