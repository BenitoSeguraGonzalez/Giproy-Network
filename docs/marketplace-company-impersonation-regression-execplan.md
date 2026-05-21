# Marketplace Company Impersonation Regression Sanitization

## Objetivo
Restaurar el comportamiento histórico por el que `superadministración` puede entrar en una empresa activa y operar el marketplace como si fuera su administrador, recuperando acceso visible y funcional a `carrito`, `Mis compras` y `Mis ventas`.

## Alcance
- Permisos efectivos de marketplace para `superadministrador`
- Acceso temporal de testing al `Panel Administrador` para el administrador de `Santiago Bermeo`
- Coherencia entre autorización backend y visibilidad frontend

## Plan de ajuste
1. Recuperar el grupo comprador para `superadministrador` dentro de permisos por defecto.
2. Rehabilitar la excepción beta de `Santiago Bermeo` también en backend, no solo en el botón visible.
3. Hacer que la storefront consuma el permiso real `marketplace.buy` en lugar de asumir que solo el rol literal `administrador` puede comprar.
4. Mantener la excepción de testing acotada y documentada para retiro posterior.

## Criterio de cierre
- `Superadministrador` puede ver y usar `carrito`, `Mis compras` y `Mis ventas` al entrar en una empresa activa.
- El administrador de `Santiago Bermeo` puede abrir `Panel Administrador` en modo beta de testing.
- Backend y frontend responden de forma consistente al mismo modelo de permisos.
