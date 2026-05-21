# Portal de compras públicas: blindaje de cierre del modal

## Objetivo
Evitar cualquier salida abrupta del editor especializado y garantizar confirmación previa al cierre.

## Plan de implementación
1. Auditar todos los puntos de cierre del modal.
2. Redirigir backdrop, `X` y `Cancelar` a `requestClosePortalModal`.
3. Reservar `closePortalModal` solo para cierres ya confirmados.
4. Validar compilación y no interferencia BIM.

## Alcance
- `frontend/src/pages/MarketplaceAdminDashboard.jsx`
- `docs/tasks/TASK-0707.md`
- `docs/tasks/TASK-0564.md`
- `docs/CHANGELOG.md`

## Estado
Implementado
