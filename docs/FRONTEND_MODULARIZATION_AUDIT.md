# Auditoria inicial de modularizacion frontend clasica

Fecha: 2026-05-22

Modo: GIPROY CLASICO

## Objetivo

Iniciar Fase 5 con analisis sin modificar comportamiento, UI, rutas ni contratos. Esta auditoria prepara slices futuros de frontend sin activar BIM ni crear acoplamientos nuevos.

## Estructura real

`frontend/src` contiene 217 archivos y estas carpetas de primer nivel:

- `api`
- `assets`
- `components`
- `constants`
- `context`
- `hooks`
- `layouts`
- `lib`
- `pages`
- `routes`
- `utils`

## Superficies grandes detectadas

No deben moverse ni dividirse en bloque. Requieren slices pequenos, build y smoke visual/focal.

| Archivo | Tamano aproximado | Riesgo |
|---|---:|---|
| `frontend/src/components/projects/CronogramaGantt.jsx` | 1408 KB | Muy alto: Gantt clasico, interacciones, reportes y estados densos |
| `frontend/src/pages/Proyectos.jsx` | 363 KB | Alto: shell principal de proyectos y carga lazy de vistas |
| `frontend/src/components/projects/Cronogramas.jsx` | 357 KB | Alto: puente Gantt/Valorado/Caja y lazy load |
| `frontend/src/pages/MarketplaceAdminDashboard.jsx` | 348 KB | Alto: dashboard admin Marketplace |
| `frontend/src/pages/Community.jsx` | 298 KB | Alto: comunidad, moderacion y contratos API |

Snapshot reproducible vigente: `docs/FRONTEND_SIZE_INVENTORY.md` y `docs/frontend_size_inventory.json`.

## Estado de carga y rutas

- `frontend/src/routes/AppRouter.jsx` ya usa lazy loading en la mayoria de paginas protegidas.
- `Cronogramas.jsx` ya carga `CronogramaGantt` con `lazyWithChunkRecovery`.
- `Proyectos.jsx` ya carga varias vistas de proyecto mediante `lazyWithChunkRecovery`.
- Hay warning Vite por chunks grandes, pero el build no falla.

## Frontera BIM

Referencias BIM detectadas y esperadas:

- `frontend/src/routes/AppRouter.jsx`: ruta `/admin-global/bim`.
- `frontend/src/pages/AdminGlobalBim.jsx`.
- `frontend/src/components/projects/BimTab.jsx`.
- `frontend/src/components/bim/*`.
- `frontend/src/hooks/bim/*`.
- `frontend/src/api/bim*.js` y `frontend/src/api/adminBim.js`.

No se modifica ninguna de estas rutas ni componentes en esta auditoria.

## Orden seguro recomendado

1. No tocar `CronogramaGantt.jsx` como primer slice funcional.
2. Empezar por documentar o extraer helpers UI puros ya existentes solo si tienen tests/smoke o bajo riesgo.
3. Mantener `AppRouter.jsx` estable; no cambiar rutas existentes.
4. No mover clientes API multi-tenant sin revisar `frontend/src/api/tenant.js` y `axiosConfig.js`.
5. Evitar cambios visuales globales hasta tener captura o smoke focal.
6. Mantener BIM aislado y sin UX activa adicional.

## Validacion requerida para cualquier slice Fase 5

- `npm run build`.
- Smoke `frontend/scripts/smoke-classic-no-bim-contamination.mjs`.
- Baseline enterprise con `--include-frontend`.
- Si toca Gantt, ejecutar smoke Gantt clasico correspondiente.
- Si toca UI visible, validar coherencia con `docs/STYLE_GUIDE.md`.

## No interferencia BIM

- No se modifico codigo BIM.
- No se activo UX BIM.
- No se agregaron dependencias BIM.
- La auditoria solo documenta fronteras y riesgos.
