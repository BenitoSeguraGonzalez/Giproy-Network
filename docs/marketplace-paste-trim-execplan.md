# Marketplace: trim automático al pegar en formularios del creador

## Objetivo
Sanear cualquier contenido pegado en los formularios del creador/editor antes de insertarlo en el campo.

## Plan de implementación
1. Añadir un interceptor de `paste` a nivel de formulario.
2. Detectar campos editables compatibles (`input` y `textarea`).
3. Recortar blancos iniciales y finales, incluyendo espacios, tabs, saltos y blancos Unicode.
4. Reinyectar el texto saneado conservando la selección del usuario.
5. Validar compilación y no interferencia BIM.

## Alcance
- `frontend/src/pages/MarketplaceAdminDashboard.jsx`
- `docs/tasks/TASK-0710.md`
- `docs/tasks/TASK-0564.md`
- `docs/CHANGELOG.md`

## Estado
Implementado
