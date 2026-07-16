# Mapa de dependencias frontend clasico

Fecha: 2026-05-22

Modo: GIPROY CLASICO

## Objetivo

Mapear dependencias frontend antes de modularizar para evitar movimientos masivos, cambios invisibles de tenant o acoplamientos hacia BIM.

## Estado general

- `frontend/src` tiene 217 archivos.
- `frontend/src/api` contiene 44 clientes/contratos detectados por inventario.
- El inventario reproducible detecta 0 llamadas directas `api.*`, `axios.*` o `fetch()` fuera de `frontend/src/api`.
- La capa de tenant central existe en `frontend/src/api/tenant.js`.
- La mayoria de rutas principales ya usan `lazyWithChunkRecovery`.

## Clientes API existentes

Clientes principales:

- `apus.js`
- `basesTrabajo.js`
- `community.js`
- `cronogramas.js`
- `edo.js`
- `edt.js`
- `marketplace.js`
- `presupuestos.js`
- `polinomica.js`
- `proyectoDetalle.js`
- `proyectos.js`
- `recursos.js`
- `reporting.js`
- `stakeholders.js`
- `subcategoriasItems.js`
- `utils.js`

Clientes globales/admin:

- `adminAudit.js`
- `adminImportModels.js`
- `adminLicenses.js`
- `adminMaintenance.js`
- `adminSessions.js`
- `adminSupport.js`
- `adminSystem.js`
- `systemAnnouncements.js`
- `publicAuth.js`
- `sessionTrace.js`
- `geocoding.js`
- `ganttFixtures.js`
- `empresas.js`

Clientes BIM aislados:

- `adminBim.js`
- `bim.js`
- `bimLinks.js`
- `bimModels.js`
- `bimViewStates.js`

## Llamadas directas fuera de clientes API

Total detectado por `docs/frontend_dependency_inventory.json`: 0.

Zonas prioritarias para revisar, sin migrar todavia:

| Zona | Motivo de riesgo |
|---|---|
| `frontend/src/pages/Settings.jsx` | Resuelto por clientes API; mantener como superficie sensible por logos, plantillas y datos de empresa |
| `frontend/src/pages/ProjectManager.jsx` | Proyectos, bases, usuarios y EDT con `empresa_id` manual |
| `frontend/src/components/projects/FormulaPolinomicaTab.jsx` | Resuelto por `polinomicaApi` y `presupuestosApi.getByProyecto()`; requiere pruebas focales de integridad numerica si se toca logica |
| `frontend/src/context/AuthContext.jsx` | Resuelto por `authApi` y `adminLicensesApi`; sigue sensible para pruebas manuales de login, refresh y logout |
| `frontend/src/pages/ForgotPassword.jsx` y `ResetPassword.jsx` | Resuelto por `publicAuthApi`; queda prueba manual focal recomendada |
| `frontend/src/components/projects/DatosProyecto.jsx` | Resuelto por `geocodingApi`; no es API GiProy |
| `frontend/src/pages/Community.jsx` | Paises resuelto por `maestrosApi`; alta de usuario Comunidad resuelta por `usuariosApi.create()` |
| `frontend/src/pages/MarketplaceAdminDashboard.jsx` | Paises resuelto por `maestrosApi`; resto del dashboard sigue sensible |

## Politica de tenant observada

`frontend/src/api/tenant.js` define:

- `withoutTenant(config)`
- `withTenantParams(params, empresaId)`
- `withTenantConfig(config, empresaId)`
- `shouldSkipTenantInjection(config)`
- `routeRequiresCompanyContext(pathname)`

Regla para slices futuros:

- No reemplazar llamadas directas si no hay cliente API equivalente claro.
- No introducir query strings manuales nuevos con `empresa_id`.
- Si se crea cliente nuevo, debe usar `withTenantConfig`, `withTenantParams` o `withoutTenant` segun corresponda.
- No tocar auth ni refresh sin pruebas focales.

## Orden seguro recomendado

1. Crear o completar clientes API por dominio antes de mover llamadas desde paginas.
2. Empezar por llamadas globales simples y sin estado local complejo.
3. Evitar primero `Settings`, `AuthContext`, `ProjectManager`, `FormulaPolinomicaTab`, `CronogramaGantt`, `Community` y `Marketplace`.
4. Para cada migracion, validar build, smoke no-BIM y flujo focal si existe.
5. No mover carpetas ni renombrar rutas hasta reducir llamadas directas.

## Cola de slices candidatos

Los siguientes candidatos son de bajo riesgo relativo, pero siguen requiriendo build y smoke no-BIM. No implican mover carpetas ni tocar rutas.

| Prioridad | Slice candidato | Motivo | Validacion minima |
|---:|---|---|---|
| 1 | Cliente global para paises/maestros de lectura | Llamadas repetidas de lectura global, tenantless por politica | build + smoke no-BIM + busqueda de usos |
| 2 | Cliente auth de recuperacion/reset password | Corrige URLs hardcoded a localhost, pero toca auth publica | build + prueba manual focal login/reset |
| 3 | Cliente polinomica | Concentraria `FormulaPolinomicaTab`, pero toca presupuestos/proyecto | build + flujo focal de polinomica |
| 4 | Cliente admin empresas/usuarios para Settings | Reduciria muchas llamadas, pero es multi-tenant sensible | build + smoke focal Settings |
| 5 | Cliente ProjectManager | Reduciria query manual, pero toca proyectos/EDT | build + smoke focal Proyectos |

Decision actual: no ejecutar ningun slice de codigo hasta elegir uno con validacion focal clara.

Avance ejecutado:

- `maestrosApi.getPaises()` concentra la lectura global `GET /paises/`.
- `RegisterModal` y `BasesTrabajo` consumen `maestrosApi.getPaises()`.
- No se migraron `Settings`, `Community` ni `MarketplaceAdminDashboard` en este slice.
- `adminLicensesApi.getCatalog()` concentra `GET /admin-licenses/catalog`.
- `AdminGlobalLicencias` consume `adminLicensesApi.getCatalog()` sin tocar el resto de licencias.
- `adminGlobalApi.getEmpresas()` y `adminGlobalApi.getUsuarios()` concentran lecturas tenantless de gobernanza.
- `AdminGlobalGobernanza` consume `adminGlobalApi` para sus metricas de solo lectura.
- `AdminGlobalEmpresaAuditada` consume `adminGlobalApi.getEmpresas()` para seleccionar empresa auditable.
- `AdminGlobalComunicados` consume `adminGlobalApi.getEmpresas()` para filtros/alcance de comunicados.
- `AppLayout` consume `adminGlobalApi.getEmpresas()` para poblar el selector de empresa del superadministrador.
- `ForgotPassword` y `ResetPassword` consumen `publicAuthApi` para recuperacion/reset sin URL absoluta local.
- `Login` consume `publicAuthApi.getAccountsByEmail()` para la consulta publica previa a password.
- `RegisterModal` consume `publicAuthApi.register()` para el alta publica de cuenta.
- `sessionTrace` usa `sendSessionTrace()` desde `frontend/src/api/sessionTrace.js` para trazas no bloqueantes.
- `FormulaPolinomicaTab` consume `polinomicaApi` y `presupuestosApi.getByProyecto()` sin cambiar UI ni payloads.
- `Community` y `MarketplaceAdminDashboard` consumen `maestrosApi.getPaises()` para lecturas globales de paises.
- `Settings` consume `maestrosApi.getPaises()` solo para lectura global de paises; administracion sensible sigue intacta.
- `ProjectManager` consume `proyectosApi`, `basesTrabajoApi`, `usuariosApi` y `edtApi` para lecturas/asignaciones existentes sin cambiar UI ni payloads.
- `DatosProyecto` consume `geocodingApi` para llamadas externas Overpass/Nominatim sin cambiar fallback ni mapa.
- `Community` consume `usuariosApi.create()` para el alta de usuarios `usuario_comunidad` sin cambiar payload ni empresa activa.
- `gantt-ff-harness` consume `ganttFixturesApi.getFfFixture()` para cargar el fixture local sin tocar `CronogramaGantt`.
- `Settings.fetchData` consume `empresasApi`, `usuariosApi` y `proyectosApi` para lecturas iniciales; escrituras quedan intactas.
- `Settings` consume `empresasApi` para crear, actualizar, activar/desactivar y eliminar empresas.
- `Settings` consume `usuariosApi` para crear, actualizar y eliminar usuarios; roles, validaciones y payloads quedan intactos.
- `Settings` consume `empresasApi` y `proyectosApi` para uploads de logo, plantillas, configuracion de empresa y refresco de empresas; ya no importa `axiosConfig` directamente.
- `AuthContext` consume `authApi` para login, refresh, usuario actual y logout; licencia actual usa `adminLicensesApi.getMyLicense(params)`.

## Superficies bloqueadas para primer cambio real

- `frontend/src/context/AuthContext.jsx`.
- `frontend/src/pages/Settings.jsx`.
- `frontend/src/pages/ProjectManager.jsx` queda sensible; cualquier nuevo cambio requiere validacion focal de asignacion.
- `frontend/src/components/projects/CronogramaGantt.jsx`.
- `frontend/src/components/projects/Cronogramas.jsx`.
- `frontend/src/components/presupuestos/PresupuestoDetail.jsx`.
- `frontend/src/pages/Community.jsx`.
- `frontend/src/pages/MarketplaceAdminDashboard.jsx`.
- Cualquier archivo bajo `frontend/src/components/bim`, `frontend/src/hooks/bim` o `frontend/src/api/bim*.js`.

## No interferencia BIM

- Los clientes BIM se reconocen como frontera aislada.
- No se modifica ningun archivo BIM.
- No se activa UX BIM.
- No se agrega dependencia hacia BIM desde la capa clasica.

## Snapshot reproducible

`tools/ai_tools/frontend_dependency_inventory.py` genera `docs/frontend_dependency_inventory.json`.

Totales vigentes:

- Archivos frontend escaneados: 217.
- Lineas frontend escaneadas: 120215.
- Clientes API detectados: 44.
- Llamadas directas fuera de `frontend/src/api`: 0.
- Referencias BIM detectadas: 132.
- Limites lazy detectados: 35.
