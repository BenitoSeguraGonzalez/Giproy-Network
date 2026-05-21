# Portal de compras públicas: ayuda contextual para tramos de precio de licitación

## Objetivo
Hacer visible la política por tramos del `Precio de licitación` dentro del modal administrativo, usando la solución de ayuda contextual propia del sistema.

## Implementación
1. Añadir un disparador compacto junto al label `Precio de licitación`.
2. Mostrar una tarjeta flotante con los cuatro tramos comerciales vigentes.
3. Mantener intacta la lógica de cálculo ya consolidada en frontend y backend.
4. Validar compilación del frontend y no interferencia con la capa BIM.

## No interferencia BIM
- Cambio acotado al modal clásico de `MarketplaceAdminDashboard`.
- Sin imports, rutas ni flags BIM.

## Estado
Implementado
