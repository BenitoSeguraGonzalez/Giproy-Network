# Marketplace Buyer Seller Recientes UX Unification Execplan

## Objetivo
Unificar en un solo slice la actualización visual de `Mis compras`, `Mis ventas` y el ajuste funcional de `Recientes` dentro de la storefront clásica de Tienda.

## Problema
- `Mis compras` y `Mis ventas` ya usan parte del visual system, pero no compartían del todo la entrada modular del `Panel Administrador`.
- `Recientes` sí tenía persistencia real, pero dependía sobre todo de la ficha completa del producto y no del detalle rápido del catálogo.
- Esto producía una continuidad UX incompleta entre storefront, buyer y seller.

## Decisión UX
- Mantener la estética actual del marketplace clásico.
- Reutilizar la gramática de entrada del `Panel Administrador` para buyer y seller.
- Hacer que `Recientes` se alimente también desde el detalle rápido del catálogo.
- Unificar la interacción de `Recientes` con la misma lógica de apertura usada por las cards principales.

## Alcance
1. `Mis compras`
   - Cabecera sticky reutilizable
   - Módulos principales tipo panel
   - Conservación del contenido buyer ya existente
2. `Mis ventas`
   - Cabecera sticky reutilizable
   - Módulos principales tipo panel
   - Conservación del backoffice seller ya existente
3. `Recientes`
   - Persistencia desde ficha completa
   - Persistencia adicional desde detalle rápido del catálogo
   - Apertura consistente con el modal de detalle público

## Tasks asociadas
- `TASK-0776`: Alinear visualmente `Mis compras` con el patrón modular del `Panel Administrador`.
- `TASK-0777`: Alinear visualmente `Mis ventas` con el patrón modular del `Panel Administrador`.
- `TASK-0778`: Cerrar la continuidad funcional de `Recientes` desde la storefront clásica.

## Validación
- Buyer y seller deben sentirse parte del mismo sistema que admin.
- `Recientes` debe reflejar productos abiertos también desde el detalle rápido.
- El build frontend debe compilar sin regresiones.
