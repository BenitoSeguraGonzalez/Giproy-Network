# BIM-TASK-0022: smoke frontend BIM positivo aislado

## Estado
Cerrada

## Objetivo

Agregar una validacion frontend BIM positiva que confirme la existencia y
aislamiento del workspace/canvas BIM incubado, sin activar BIM en GiProy
Clasico.

## Alcance

- Verificar artefactos BIM dedicados en `frontend/src/api`,
  `frontend/src/hooks/bim` y `frontend/src/components/bim`.
- Confirmar que `BimWorkspace` consume clientes API de dominio BIM y hooks BIM.
- Confirmar que `BimCanvasViewer` renderiza sobre canvas 2D propio, con
  geometria simplificada, seleccion y navegacion.
- Confirmar que `BimWorkspace` no importa modulos clasicos ni `axiosConfig`
  directo.
- Confirmar que `Proyectos.jsx` conserva BIM forzado apagado.

## Resultado

- Se crea `frontend/scripts/smoke-bim-workspace-positive.mjs`.
- El smoke valida el lado positivo de la incubacion frontend BIM sin montar rutas
  clasicas ni exponer UX BIM.
- El smoke anti-BIM clasico existente sigue cubriendo que `Proyectos.jsx` no
  monte hooks, tabs ni navegacion BIM.

## No interferencia

- Sin cambios en `frontend/src/pages/Proyectos.jsx`.
- Sin cambios en rutas, menus, tabs visibles ni navegacion clasica.
- Sin activar `BimTab`.
- Sin cambios backend, base de datos, auth/JWT/tenant, EDT/APUs/Presupuesto,
  Cronogramas, Docker/Coolify, CI/CD, staging ni produccion.

## Validacion

- `cmd /c node frontend\scripts\smoke-bim-workspace-positive.mjs`: OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs`: OK.

Nota: la primera ejecucion directa del smoke nuevo con `node` fallo por un
error del runner Windows `CreateProcessAsUserW failed: 1312`, antes de ejecutar
Node. La repeticion via `cmd /c` paso correctamente.

## Pendiente posterior

- Crear smoke visual/DOM del workspace BIM bajo flag controlada cuando exista un
  punto de montaje de prueba que no toque `Proyectos.jsx`.
- Validar canvas no vacio en navegador/headless al madurar el viewer.
