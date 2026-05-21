# Marketplace: estado visible de borrador y filtro dedicado

## Objetivo
Integrar `Borrador` como estado de lectura y filtrado dentro del listado global de productos del panel administrador.

## Plan de implementación
1. Reutilizar `activation_readiness` ya universalizado para derivar un estado administrativo compacto.
2. Modelar un estado visual único por fila:
   - `Activo`
   - `Inactivo`
   - `Borrador`
3. Añadir `Borradores` al selector de filtros de estado.
4. Mantener una sola línea visual por fila y evitar recarga de badges secundarios.
5. Validar compilación y no interferencia con BIM.

## Alcance
- `frontend/src/pages/MarketplaceAdminDashboard.jsx`
- `docs/tasks/TASK-0704.md`
- `docs/tasks/TASK-0564.md`
- `docs/CHANGELOG.md`

## Estado
Implementado
