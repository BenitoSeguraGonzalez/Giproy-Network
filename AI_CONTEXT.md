# AI_CONTEXT.md

Contexto persistente para motores de IA en GiProy Network.

## Stack real

- Backend: FastAPI, SQLAlchemy, Alembic, Pydantic, PostgreSQL.
- Frontend: React 18, Vite, React Router, Axios, Framer Motion, Lucide.
- Base de datos: PostgreSQL. Evitar dependencias nuevas sin justificacion.
- Reporting/importacion: openpyxl, xlrd, reportlab, pdfplumber.

## Modo operativo vigente

- Modo preferente: GIPROY CLASICO.
- Backend unico y comun.
- BIM existe como dominio aislado, con feature flags y rutas propias.
- La capa clasica no debe depender de BIM ni activar UX BIM.
- Cualquier preparacion BIM debe ser invisible y reversible.

## Flujo recomendado para IA

1. Leer este archivo.
2. Leer `docs/project_state.json`.
3. Leer `docs/runtime/WORK_MODE_STATE.json`.
4. Leer `docs/HANDOFF.md`.
5. Revisar `docs/tasks` solo para el slice activo.
6. Trabajar sobre modulos concretos; no reanalizar todo el repo sin necesidad.

## Tooling IA y snapshots vigentes

- `tools/ai_tools/repo_hygiene_inventory.py`: genera `docs/repo_hygiene_inventory.json` para clasificar artefactos sensibles, generados, scripts sueltos y assets/pruebas.
- `tools/ai_tools/logging_inventory.py`: genera `docs/logging_inventory.json` para inventariar `print()`, `logger.*`, `console.*` y salidas PowerShell con deteccion heuristica de terminos sensibles.
- `tools/ai_tools/validate_enterprise_baseline.py`: valida JSON documentales, compila `backend/app`, importa `app.main` y opcionalmente ejecuta build frontend + smoke anti-BIM con `--include-frontend`.
- No regenerar snapshots sin necesidad del slice. Si se regeneran, documentar TASK + CHANGELOG y validar JSON.

## Arquitectura real

- Entrada backend: `backend/app/main.py`.
- Router backend: `backend/app/api/api.py`.
- Prefijo API: `/api/v1`.
- Entrada frontend: `frontend/src/main.jsx`.
- Router frontend: `frontend/src/routes/AppRouter.jsx`.
- Migraciones: `backend/alembic`.
- Tests backend focales: `backend/app/tests`.
- Smoke frontend clave: `frontend/scripts/smoke-classic-no-bim-contamination.mjs`.

## Modulos backend principales

- Core: configuracion, DB, seguridad, tenant, rounding, utils.
- API/endpoints: auth, usuarios, empresas, proyectos, proyecto-detalles, stakeholders, roles, maestros, paises, recursos, apus, presupuestos, bases-trabajo, subcategorias, dispositivos, edo, edt, utils, admin, cronogramas, polinomica, reporting, community, marketplace, bim.
- Services: APUs, presupuesto, cronogramas, reporting, marketplace, public procurement, community, BIM, licencias, auditoria.
- Models: ERP clasico, Marketplace, Comunidad, Licencias, Auditoria, Calendario, BIM.

## Modulos frontend principales

- Pages: Dashboard, Proyectos, Precios Unitarios, Bases, Subcategorias, Recursos, APUs, Presupuestos, AdminGlobal, Marketplace, Comunidad, Settings.
- Project components: DatosProyecto, Stakeholders, EDO, EDT, Presupuesto, Cronogramas/Gantt, Desagregacion, Formula Polinomica, BimTab.
- Shared: ui, reporting, marketplace, hooks, api clients, AuthContext, PresupuestoContext.

## Reglas multi-tenant

- Toda operacion de negocio debe resolverse con empresa activa.
- El frontend centraliza tenant en `frontend/src/api/tenant.js` y `axiosConfig.js`.
- Endpoints globales deben marcarse sin tenant.
- No construir query strings manuales de `empresa_id` cuando exista cliente API de dominio.
- Superadministrador no debe operar negocio sin empresa activa salvo endpoints globales/admin claramente definidos.

## Modulos sensibles

- Auth/JWT/sesiones.
- Empresa activa y permisos.
- Proyectos/revisiones/detalle.
- Bases, Subcategorias, Recursos, APUs, Presupuestos.
- EDT/EDO/Stakeholders.
- Cronogramas/Gantt/Valorado/Caja.
- Marketplace y origen de activos.
- Compras publicas SOCE/SERCOP.
- Comunidad y moderacion.
- BIM aislado.

## Reglas de cambio

- No hacer refactors masivos.
- No cambiar contratos API sin compatibilidad.
- No modificar tablas sin migracion Alembic segura.
- No borrar codigo aparentemente muerto.
- Documentar TASK y CHANGELOG si hay cambios.
- Validar build/tests focales y smoke BIM cuando corresponda.
