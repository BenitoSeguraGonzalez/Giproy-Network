# Portal de compras públicas: normalización del input de Precio de licitación

## Objetivo
Evitar corrupción de montos al pegar valores formateados con separadores de miles y decimales.

## Plan de implementación
1. Reemplazar el input numérico nativo por captura textual controlada.
2. Normalizar formatos anglosajón y europeo a una forma canónica.
3. Reforzar el parser backend con la misma lógica semántica.
4. Validar compilación y no interferencia con BIM.

## Alcance
- `frontend/src/pages/MarketplaceAdminDashboard.jsx`
- `backend/app/services/marketplace.py`
- `docs/tasks/TASK-0709.md`
- `docs/tasks/TASK-0564.md`
- `docs/CHANGELOG.md`

## Estado
Implementado
