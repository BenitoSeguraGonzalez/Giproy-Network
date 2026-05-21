# Inventario funcional del frontend de Tienda

Fecha
2026-03-28

Modo
GIPROY CLASICO

## Objetivo

Dejar un documento de lectura rápida que describa qué funcionalidades tiene hoy el frontend de `Tienda`, separando claramente:

- storefront público
- comprador
- vendedor
- administración marketplace
- funciones exclusivas de `superadministrador`

Este inventario sirve como base de análisis antes de continuar agregando o reordenando funciones.

## 1. Storefront público

Superficie principal:
- `frontend/src/pages/Marketplace.jsx`

Funciones activas:
- listado público de productos marketplace
- búsqueda textual
- ordenación comercial
- filtrado por categoría
- filtrado por precio
- acceso al detalle de producto
- lectura separada entre productos oficiales de `Sistema` y publicaciones de usuarios
- bloque lateral de productos recientes

Funciones comerciales ya existentes pero no necesariamente prioritarias en la nueva home:
- favoritos por usuario
- comparación de productos
- productos vistos recientemente

## 2. Detalle de producto

Superficie:
- `frontend/src/pages/MarketplaceProductDetail.jsx`

Funciones activas:
- lectura de ficha comercial
- información de producto y vendedor
- compra
- reseñas
- vista previa cuando existe

Estado:
- sigue operativo
- pendiente de reencuadre visual posterior para conversar con la nueva storefront

## 3. Comprador

Superficies:
- `frontend/src/pages/MarketplaceBuyerDashboard.jsx`
- `frontend/src/pages/MarketplaceOrderDetail.jsx`

Funciones activas:
- panel buyer
- historial de pedidos
- biblioteca de activos adquiridos
- detalle de pedido
- descargas y continuidad postcompra

Estado:
- funcionalmente maduro
- pendiente de futura revisión visual si se redefine la experiencia completa de Tienda

## 4. Vendedor

Superficie:
- `frontend/src/pages/SellerDashboard.jsx`

Funciones activas:
- creación y edición de productos
- catálogo vivo
- ventas seller
- workflow de moderación
- clonación y retiro de publicaciones
- lectura diferenciada entre `Empresa` y `Sistema` para `superadministrador`

Estado:
- funcionalmente maduro
- pendiente de replanteamiento visual posterior si se redefine el backoffice comercial

## 5. Administración marketplace

Superficie:
- `frontend/src/pages/MarketplaceAdminDashboard.jsx`

Funciones activas:
- moderación de publicaciones
- notas administrativas
- pedidos globales
- ventas globales
- métricas y alertas operativas

Estado:
- funcionalmente maduro
- pendiente de revisión posterior si se redefine la experiencia administrativa

## 6. Exclusivo de superadministrador dentro de Tienda

Superficie principal actual:
- `frontend/src/pages/Marketplace.jsx`

Funciones activas:
- acceso a `Ventas Sistema`
- acceso a `Administración marketplace`

Regla vigente:
- estas funciones deben vivir dentro de `Tienda`
- no deben volver a mezclarse con `Administración Global`

## 7. Principios vigentes para la siguiente fase

- mantener el header global estándar de GiProy
- rediseñar primero la página inicial de ventas
- no seguir propagando el diseño storefront al resto de módulos sin aprobación
- mantener buyer, seller, admin y detalle operativos mientras la home se sanea
- toda función de tienda exclusiva de `superadministrador` debe vivir dentro de `Tienda`

## 8. Siguiente prioridad

1. sanear storefront inicial
2. revisar detalle de producto
3. decidir después cómo continuar buyer, seller y admin
