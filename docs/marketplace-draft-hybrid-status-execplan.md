# Marketplace: estado híbrido universal para borradores incompletos

## Objetivo
Extender la política de borrador al listado global del panel administrador sin añadir una nueva categoría visual dominante.

## Estrategia
1. Unificar en backend la lectura de `activation_readiness` para todos los tipos de producto.
2. Conservar en `Portal de compras públicas` sus requisitos específicos sobre la base común.
3. Exponer en el listado un estado híbrido:
   - estado principal `Inactivo`
   - microindicador ámbar
   - ayuda contextual del sistema con la causa operativa
4. Validar que la fila siga resolviéndose en una sola línea.
5. Certificar no interferencia con BIM.

## Alcance
- `backend/app/services/marketplace.py`
- `frontend/src/pages/MarketplaceAdminDashboard.jsx`
- `docs/tasks/TASK-0703.md`
- `docs/tasks/TASK-0564.md`
- `docs/CHANGELOG.md`

## No interferencia BIM
- Sin rutas BIM
- Sin flags BIM
- Sin imports ni acoplamientos nuevos hacia módulos BIM

## Estado
Implementado
