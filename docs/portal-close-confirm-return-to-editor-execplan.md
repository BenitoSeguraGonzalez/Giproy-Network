# Portal de compras públicas: confirmación de cierre con retorno al editor

## Objetivo
Hacer que la confirmación de cierre del editor permita retroceder sin abandonar el modal principal.

## Plan de implementación
1. Reemplazar la confirmación binaria por una decisión de tres salidas.
2. Mapear `X` y `Volver al editor` al mismo resultado conservador.
3. Mantener `Cerrar sin guardar` como única salida destructiva del contexto de edición.
4. Validar compilación y no interferencia BIM.

## Alcance
- `frontend/src/pages/MarketplaceAdminDashboard.jsx`
- `docs/tasks/TASK-0708.md`
- `docs/tasks/TASK-0564.md`
- `docs/CHANGELOG.md`

## Estado
Implementado
