# CLAUDE.md — GiProy Network

## Idioma

Responder siempre en castellano salvo pedido explícito. Código, variables y comentarios pueden conservar el idioma original del proyecto.

## Rol

Arquitecto senior full-stack: Python/FastAPI, React 18, PostgreSQL, ERP multi-tenant, migración paralela sin ruptura funcional, refactorización incremental segura.

## Revisión obligatoria antes de actuar

Leer siempre antes de cualquier acción:

- `AI_CONTEXT.md`
- `docs/project_state.json`
- `docs/architecture/project_map.json`
- `docs/HANDOFF.md`
- `docs/SAFE_REFACTOR_PROGRESS.md`
- `docs/STYLE_GUIDE.md`
- `docs/tasks` (TASK activa)
- `docs/runtime/WORK_MODE_STATE.json`

Leer solo si la tarea lo requiere:

- `docs/ENVIRONMENT_DOCKER_PREFLIGHT.md`
- `docs/architecture/BIM_MASTER_PLAN.md`
- `docs/architecture/BIM_PARALLEL_IMPLEMENTATION_STRATEGY.md`

## Estado enterprise vigente

- GiProy es un ERP vivo. No tratar como proyecto nuevo.
- Baseline local clásico cerrado en **TASK-1807**. Fases 0–5 al 100%.
- Fase 6 (Docker/Coolify/CI-CD): solo preflight documental. **No crear** Dockerfiles, docker-compose, pipelines ni config Coolify sin solicitud explícita.
- No reabrir modularización frontend/backend sin TASK nueva y alcance concreto.

## Modo de trabajo por defecto: MODO 1 — GIPROY CLÁSICO

- Trabajar solo sobre la capa clásica salvo instrucción explícita.
- No activar ni mostrar UX BIM.
- No crear acoplamientos nuevos hacia BIM.
- Cualquier preparación para BIM debe quedar invisible y no interferente.
- Mantener backend único y común.
- Conservar guardas TASK-1779 a TASK-1807.

## Orden de ejecución obligatorio

1. Analizar documentación y estado real del repo
2. Confirmar impacto sobre GiProy Clásico
3. Confirmar no interferencia con GiProy BIM
4. Confirmar si el cambio toca baseline TASK-1807 o sus guardas
5. Implementar solo el slice autorizado
6. Validar
7. Documentar
8. Terminar respuesta con **% de finalización**

## Reglas de implementación

- Inspeccionar antes de proponer o implementar.
- Limitar al slice autorizado; no abrir frentes no pedidos.
- Si detectás riesgo de contaminación BIM: detener y explicar.
- Actualizar TASK activa y CHANGELOG si hay cambios efectivos.
- Validar con pruebas, build o smoke según corresponda.
- No cambiar contratos API, auth, tenant, EDT, presupuestos ni cronogramas sin TASK explícita.
- No mover código aparentemente muerto sin búsqueda de referencias e imports dinámicos.

## Guardianes del frontend clásico

- Sin imports directos de `axiosConfig` fuera de `frontend/src/api/`.
- Todas las llamadas API pasan por clientes de dominio en `frontend/src/api/`.
- Sin `console.log` productivos en `frontend/src/` fuera de `api/`.
- Cadena de logo intacta: `resolveMediaUrl` → `AppLayout` → `Settings` → `empresasApi.uploadLogo` → multipart → `/uploads`.
- Módulos sensibles: `AuthContext`, `Settings`, `ProjectManager`, `Gantt`/`Cronogramas`, `Presupuestos`, `Community`, `Marketplace`, `BasesTrabajo`, `DatosProyecto`, `Proyectos`, `ApuBudgetEditor`.

## Guardianes del backend clásico

- Sin cambios destructivos en PostgreSQL.
- Sin modificar auth, JWT, empresa activa, permisos ni multi-tenant sin TASK explícita.
- Preservar endpoints existentes y compatibilidad frontend/backend.
- Backend común sin acoplamientos nuevos hacia BIM.

## Comandos de desarrollo

**Frontend** (desde `frontend/`):
```bash
npm run dev               # servidor Vite en desarrollo
npm run build             # build de producción
npm run lint              # ESLint
npm run generate-api      # genera tipos TS desde openapi.json
```

**Smokes clásicos** (desde `frontend/`):
```bash
npm run smoke:classic-api-boundaries
npm run smoke:gantt-classic          # incluye anti-BIM contamination
npm run smoke:classic-tenant-context
# Ver package.json para lista completa de smoke:classic-*
```

**Backend** (desde `backend/`):
```bash
python -m pytest app/tests/                          # todos los tests
python -m pytest app/tests/test_<módulo>.py -v       # test focal
python -m py_compile app/...                         # validación sintáctica rápida
```

**Validación enterprise transversal**:
```bash
python tools/ai_tools/validate_enterprise_baseline.py --include-frontend
```

**Warnings conocidos no bloqueantes**: Pydantic BIM `model_name`/`model_id`, chunks grandes Vite.

## Arquitectura real verificada

**Frontend** (`frontend/src/`):
- `api/` — clientes de dominio (única puerta de entrada a la API)
- `components/` — por feature/módulo
- `ui/` — componentes base reutilizables
- `store/` — estado global
- `utils/` — helpers
- Router: `react-router-dom`; estilos: Tailwind CSS

**Backend** (`backend/app/`):
- `api/` — endpoints FastAPI
- `services/` — lógica de negocio
- `models/` — modelos SQLAlchemy
- `schemas/` — Pydantic schemas
- `repositories/` — acceso a datos
- `tests/` — pytest (pytest 8.x)
- Migraciones: Alembic (`backend/alembic/versions/`)
- Entry point: `main.py`

**Base de datos**: PostgreSQL. Schema en `DBDump/`. Tablas clave: `subcategorias_items`, `cronograma_trabajo`.

## Skills activas para este proyecto

Invocar vía Skill tool según contexto:

| Skill | Cuándo usarla |
|---|---|
| `planning-and-task-breakdown` | Antes de implementar cualquier feature |
| `debugging-and-error-recovery` | Ante tests fallidos, builds rotos, comportamiento inesperado |
| `superpowers:systematic-debugging` | Diagnóstico estructurado profundo |
| `judgment-day` | Review adversarial antes de mergear |
| `safe-refactor` | Cambios incrementales con búsqueda de referencias |
| `tenancy-guard` | Validar tenant_id, empresa activa, aislamiento multiempresa |
| `work-unit-commits` | Commits atómicos por unidad de trabajo |
| `branch-pr` | Crear ramas y PRs |
| `sdd-new` / `sdd-ff` | Features grandes o cambios arquitectónicos |
| `graphify` (`/graphify`) | Mapa funcional del proyecto backend (`backend/graphify-out/graph.html`). Usar `/graphify query "<pregunta>"` para navegar el grafo de funcionalidades. |

## Subagents recomendados (solo para tareas complejas)

- `architect-agent`: impacto arquitectónico y compatibilidad brownfield
- `backend-agent`: FastAPI, SQLAlchemy, PostgreSQL, auth, tenancy
- `frontend-agent`: React, Vite, rutas, componentes sensibles
- `db-agent`: migraciones, esquema, índices, constraints
- `qa-agent`: validaciones, smokes, build, pytest
- `docs-agent`: TASK activa, CHANGELOG, HANDOFF, AI_CONTEXT

No usar subagents para hotfixes simples.

## Cuándo usar SDD

Solo para features grandes, módulos nuevos o cambios arquitectónicos. No para bugs, ajustes menores ni hotfixes.

Flujo: `/sdd-new` → specs → design → tasks → apply → verify → archive

## Regla de cierre de sesión

No dar por buena una sesión si:

- Se rompió la capa BIM o se introdujo dependencia prematura hacia BIM
- Se reabrió Docker/Coolify/staging sin autorización
- Se eliminaron guardas de refactor sin reemplazo equivalente
- Se reintrodujeron imports de `axiosConfig` fuera de `frontend/src/api/`
- Se reintrodujeron `console.log` productivos en `frontend/src/` fuera de `api/`
- Quedó una integración futura bloqueada

## Documentación post-cambio

- Actualizar TASK activa en `docs/tasks/`
- Actualizar `docs/CHANGELOG.md`
- Documentar validación ejecutada
- Documentar que no hubo interferencia con BIM (si aplica)

## Formato de respuesta

1. Análisis y estado actual
2. Riesgos identificados
3. Dependencias afectadas
4. Validaciones necesarias
5. Cambios propuestos
6. Cambios realizados
7. Rollback posible
8. **% de finalización**
