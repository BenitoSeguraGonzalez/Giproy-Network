# Marketplace: alineación semántica del estado visible con la regla real de publicación

## Objetivo
Hacer que el estado mostrado en el listado global de productos represente la publicabilidad efectiva del producto.

## Plan de implementación
1. Mantener `Borrador` como prioridad cuando falten datos obligatorios.
2. Redefinir `Activo` para exigir:
   - `approved`
   - `activo = true`
   - ventana de publicación vigente
3. Redefinir `Inactivo` como el resto de productos completos no publicables.
4. Validar compilación y no interferencia BIM.

## Alcance
- `frontend/src/pages/MarketplaceAdminDashboard.jsx`
- `docs/tasks/TASK-0705.md`
- `docs/tasks/TASK-0564.md`
- `docs/CHANGELOG.md`

## Estado
Implementado
