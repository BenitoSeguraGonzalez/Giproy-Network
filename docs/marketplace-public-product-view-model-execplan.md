# Normalización pública del producto para el storefront clásico

## Resumen
El storefront clásico del Marketplace debe dejar de renderizar las cards desde el objeto bruto del backend y pasar a un modelo público único con `meta común`, `meta exclusiva`, lógica comercial centralizada y modal de detalle reutilizable.

## Objetivo
- Unificar la representación pública de todos los productos.
- Alinear todos los tipos a la `meta común` ya definida en el editor del portal.
- Añadir `imagen_relevante_url` como campo común con fallback al degradado actual.
- Rehacer la card pública para eliminar repeticiones y soportar descuentos.
- Crear un modal público de detalle con CTA de carrito.

## Meta común universal
- categoría
- título comercial
- propietario
- descripción corta
- descripción larga
- descripción completa
- precio comercial
- descuento/promoción
- fechas de publicación
- imagen relevante

## Meta exclusiva
- `portal_meta`
- futura meta exclusiva por tipo (`licencia`, `apu`, `base_maestra`, `proyecto`)
- el modal debe poder mostrar un bloque exclusivo aunque hoy todavía no todas las tipologías estén enriquecidas

## Reglas UX
- La card mantiene la estética actual del storefront.
- La card deja de repetir el título en cuerpo.
- La línea secundaria del cuerpo queda reducida a `propietario`.
- `Portal de compras públicas` muestra `Monto de licitación` como dato técnico secundario bajo la descripción corta.
- El descuento solo aparece cuando existe porcentaje real.
- El modal muestra primero la `meta común`, luego la `meta exclusiva`.
- El modal incluye botón `Agregar al carrito`.

## Fallbacks
- sin imagen relevante: mantener degradado
- sin descuento válido: no mostrar descuento
- sin descripción larga/completa: ocultar bloque
- sin meta exclusiva estructurada: mostrar mensaje de que no hay características especiales configuradas todavía

## Implementación
- normalizar `imagen_relevante_url` en `product_meta`
- crear `view model` público único en frontend
- remapear card del storefront al nuevo contrato
- crear modal público de detalle con CTA comercial
