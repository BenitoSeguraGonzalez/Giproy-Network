# BIM-TASK-0023: smoke visual DOM del viewer BIM aislado

## Estado
Cerrada

## Objetivo

Agregar una validacion visual/DOM controlada del viewer BIM para comprobar que
el canvas monta y pinta geometria no vacia sin activar BIM en GiProy Clasico.

## Alcance

- Crear un harness BIM aislado fuera del router productivo.
- Montar `BimCanvasViewer` con elementos BIM sinteticos bajo
  `frontend/src/features/bim`.
- Validar con Playwright que el canvas existe, tiene dimensiones estables y
  contiene pixeles no vacios en desktop y mobile.
- Confirmar ausencia de overflow horizontal y errores de consola relevantes.
- Mantener `Proyectos.jsx` y `BimTab` sin cambios.

## Resultado

- Se crea `frontend/bim-viewer-harness.html`.
- Se crea `frontend/src/features/bim/BimViewerHarness.jsx`.
- Se crea `frontend/scripts/validate-bim-viewer-dom.mjs`.
- Se actualiza `frontend/scripts/smoke-bim-workspace-positive.mjs` para incluir
  el nuevo perimetro `frontend/src/features/bim`.

## No interferencia

- El harness no esta enlazado desde rutas, menus ni pantallas productivas.
- Sin cambios en `frontend/src/pages/Proyectos.jsx`.
- Sin activar `BimTab`.
- Sin cambios backend, base de datos, auth/JWT/tenant, EDT/APUs/Presupuesto,
  Cronogramas, Docker/Coolify, CI/CD, staging ni produccion.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `cmd /c node scripts\validate-bim-viewer-dom.mjs` desde `frontend`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.
- `npm run build` desde `frontend`: OK.

Warning conocido no bloqueante: chunks grandes Vite.

## Pendiente posterior

- Validar aplicacion local de la migracion Alembic BIM principal en base
  controlada.
- Evolucionar el viewer hacia stack BIM/3D autorizado cuando el slice lo pida.
