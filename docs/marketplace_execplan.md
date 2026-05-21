# ExecPlan - Marketplace GiProy

## 1. Objetivo funcional

Extender GiProy Network con una capa de marketplace tipo WooCommerce, integrada al sistema actual, para publicar y vender productos manuales y productos referenciados a entidades existentes (`base_trabajo`, `APU`, `Proyecto`), con compra segura mediante clonación, reparto automático `20% plataforma / 80% vendedor`, paneles para comprador, vendedor y administración global, y sin romper módulos actuales.

## 2. Estado actual del sistema

### Backend existente
- `FastAPI` modular en `backend/app/api/api.py`.
- Entidades fuente ya operativas:
  - bases maestras / bases de proyecto: `backend/app/models/base_trabajo.py`
  - APUs: `backend/app/models/apu.py`
  - proyectos y revisiones: `backend/app/models/proyecto.py`
- Ya existen operaciones reutilizables de clonación/importación:
  - bases profundas mediante `BaseTrabajoCreate.source_base_id` y `base_trabajo_repo._clone_deep_content`
  - APUs por `apu_service.duplicate_apu` e importación entre bases
  - proyectos por `proyecto_service.create_revision` dentro de la misma empresa
- Multiempresa ya presente por `empresa_id`.
- Seguridad actual basada principalmente en `Usuario.rol` (`usuario`, `administrador`, `superadministrador`).
- Existe una capa secundaria `system_roles` / `user_roles`, pero hoy no gobierna permisos operativos generales.

### Frontend existente
- `React` con `AppLayout` y patrón visual consolidado.
- Router principal en `frontend/src/routes/AppRouter.jsx`.
- Existe placeholder real de tienda en `frontend/src/pages/Placeholders.jsx` bajo `Otros Servicios`.
- Existe infraestructura de clientes API por dominio en `frontend/src/api`.
- El dashboard y layouts ya contienen cards, badges, tablas y patrones reutilizables.

### Restricciones detectadas
- No hay hoy un módulo de ventas.
- No existe un RBAC granular transversal consumido por toda la app.
- Las compras deben montarse como capa comercial desacoplada, evitando tocar la lógica interna de bases, APUs y proyectos.

## 3. Diseño propuesto

### Principio rector

Implementar una capa marketplace aditiva, compatible y reversible:
- nuevas tablas y servicios propios del dominio marketplace
- reutilización de clonaciones y estructuras actuales
- cero reemplazo de endpoints existentes
- cero cambio de comportamiento en APUs, bases y proyectos fuera del flujo comercial

### Diseño backend

Se añadirá un dominio `marketplace` con:
- modelos nuevos:
  - `MarketplacePermission`
  - `MarketplaceProductCategory`
  - `MarketplaceProduct`
  - `MarketplaceProductAsset`
  - `MarketplaceCart`
  - `MarketplaceCartItem`
  - `MarketplaceOrder`
  - `MarketplaceOrderItem`
  - `MarketplaceInvoice`
  - `MarketplaceReview`
- servicios nuevos:
  - permisos marketplace
  - publicación de producto
  - catálogo / detalle
  - carrito / checkout
  - fulfillment con clonación
  - estadísticas seller / admin
- endpoints nuevos:
  - `/marketplace/*`
  - `/marketplace-seller/*`
  - `/marketplace-admin/*`

### Diseño de producto referenciado

`MarketplaceProduct` soportará:
- `product_kind`: `manual` | `referenced`
- `source_type`: `base_trabajo` | `apu` | `proyecto` | `null`
- `source_id`

Reglas:
- no se duplican datos fuente al publicar
- el detalle comercial resuelve metadata desde la entidad original
- al comprar siempre se clona a la empresa del comprador; nunca se comparte referencia viva

### Diseño de permisos

Sin alterar roles existentes:
- se mantendrá `Usuario.rol` como control principal legacy
- se añadirá una capa aditiva de permisos marketplace por usuario
- grupos lógicos:
  - `marketplace_buyer`
  - `marketplace_seller`
  - `marketplace_admin`

Permisos mínimos:
- `marketplace.view`
- `marketplace.buy`
- `orders.view_own`
- `orders.download_invoice`
- `orders.access_resources`
- `reviews.create`
- `seller.publish`
- `seller.edit_own`
- `seller.delete_own`
- `seller.view_own_products`
- `seller.view_sales`
- `seller.view_stats`
- `seller.activate_product`
- `marketplace.manage_all_products`
- `marketplace.approve_products`
- `marketplace.delete_any_product`
- `marketplace.view_all_sales`
- `marketplace.view_commissions`
- `marketplace.view_analytics`
- `users.manage_roles_marketplace`

### Diseño frontend

Se reutilizará la shell actual con nuevas vistas:
- `/marketplace`
- `/product/:id`
- `/cart`
- `/checkout`
- `/mis-pedidos`
- `/pedido/:id`
- `/facturas`
- `/mis-descargas`
- `/dashboard/seller`
- `/dashboard/admin`

Puntos de reutilización:
- reemplazar el placeholder `Tienda`
- reutilizar cards, tablas, modales, badges y layout actual
- introducir componentes de dominio, no un diseño paralelo

### UX obligatoria

Se implementará experiencia comercial compatible con el diseño actual:
- badges por tipo: `LICENCIA`, `ADDON`, `ADICIONAL`, `BASE`, `APU`, `PROYECTO`
- rating
- número de ventas
- bloque `Qué incluye` / `Qué no incluye`
- vista previa real resumida
- CTA claros: `Comprar ahora`, `Añadir a mi sistema`, `Usar en mi proyecto`

## 4. Fases de implementación

### Fase A - Fundaciones backend
- crear modelos marketplace y migración alembic
- crear permisos marketplace aditivos
- exponer permisos marketplace en `/usuarios/me`
- registrar router marketplace base

### Fase B - Publicación de productos
- producto manual y referenciado
- categorías, etiquetas y estados
- endpoint `Publicar en Marketplace`
- validación de propiedad y no duplicidad

### Fase C - Catálogo y detalle
- listado marketplace
- filtros por tipo, categoría, precio, popularidad y reciente
- detalle con metadata resuelta desde origen
- related products, vendedor, ventas, rating y preview

### Fase D - Carrito y checkout
- carrito persistente
- checkout sin pasarela compleja
- generación de orden, invoice y reparto económico

### Fase E - Fulfillment
- compra de base: clonación profunda a empresa compradora
- compra de APU: clonación a base destino del comprador
- compra de proyecto: clonación desacoplada a empresa compradora
- registrar recursos entregados y accesos

### Fase F - Dashboards
- seller dashboard: productos, ventas, ingresos, estados
- admin dashboard: moderación, ventas globales, comisiones, métricas
- comprador: pedidos, facturas, recursos, historial y valoraciones

### Fase G - Integración frontend
- nuevas APIs frontend
- rutas y navegación
- integración no invasiva en dashboard y `Otros Servicios`

### Fase H - Validación y hardening
- pruebas backend
- build frontend
- pruebas de permisos
- prueba end-to-end de publicación, compra, comisión y clonación

## 5. Riesgos y mitigación

### Riesgo: romper lógica de APUs / bases / proyectos
- Mitigación: encapsular marketplace en servicios nuevos; consumir APIs y repos existentes; no reescribir lógica interna.

### Riesgo: permisos inconsistentes con el sistema actual
- Mitigación: mantener chequeo legacy por `rol` y sumar autorización marketplace aditiva; no sustituir seguridad actual.

### Riesgo: clonación incompleta al comprar
- Mitigación: reutilizar mecanismos existentes y envolverlos en servicios de fulfillment con transacción y auditoría.

### Riesgo: contratos frontend/backend rotos
- Mitigación: crear rutas nuevas y clientes API nuevos; no alterar endpoints legacy.

### Riesgo: UI inconsistente
- Mitigación: reutilizar placeholder `Tienda`, componentes `Card`, tablas, badges y patrones del layout actual.

### Riesgo: deuda por implementación demasiado amplia en un solo bloque
- Mitigación: ejecutar por TASKS independientes con validación al final de cada bloque.

## 6. Validaciones obligatorias

Por cada TASK:
- `py_compile` o prueba dirigida del backend afectado
- validación de imports backend
- `npm run build` cuando haya cambios frontend relevantes
- revisión manual de permisos y navegación
- prueba funcional del flujo afectado

Validaciones E2E mínimas finales:
- publicar APU propio -> aparece en marketplace
- publicar base propia -> aparece en marketplace
- publicar proyecto propio -> aparece en marketplace
- usuario sin permiso seller no puede publicar
- compra APU -> clonación correcta y orden creada
- compra base -> clonación correcta y orden creada
- compra proyecto -> clonación correcta y orden creada
- comisión guardada `20/80`
- comprador solo ve sus pedidos, recursos e invoices
- seller solo ve sus ventas
- admin marketplace puede aprobar/rechazar y ver métricas globales

## TASKS ejecutables

### TASK-0472 - Fundaciones del dominio marketplace
- Objetivo: crear tablas, enums, schemas y router base del marketplace.
- Archivos afectados:
  - `backend/app/models/*`
  - `backend/app/models/__init__.py`
  - `backend/app/api/api.py`
  - `backend/alembic/versions/*`
- Dependencias: ninguna.
- Validación:
  - `py_compile` de modelos y router
  - revisión de migración

### TASK-0473 - Permisos marketplace aditivos
- Objetivo: introducir permisos buyer/seller/admin sin tocar roles legacy.
- Archivos afectados:
  - `backend/app/models/usuario.py`
  - nuevos modelos/servicios de permisos marketplace
  - `backend/app/api/endpoints/usuarios.py`
  - `backend/app/schemas/usuario.py`
  - `frontend/src/context/AuthContext.jsx`
- Dependencias: TASK-0472.
- Validación:
  - `/usuarios/me` devuelve permisos marketplace
  - UI puede ocultar/mostrar acciones por permiso

### TASK-0474 - Modelo de producto y publicación referenciada
- Objetivo: soportar producto manual o referenciado con `source_type/source_id`.
- Archivos afectados:
  - modelos/schemas/services/endpoints marketplace
  - frontend seller publish flow
- Dependencias: TASK-0472, TASK-0473.
- Validación:
  - publicar base/APU/proyecto propio
  - rechazo de duplicados y recursos ajenos

### TASK-0475 - Catálogo marketplace
- Objetivo: listado, filtros, ordenación y tipos visibles.
- Archivos afectados:
  - endpoints catálogo
  - `frontend/src/pages/*marketplace*`
  - `frontend/src/components/*marketplace*`
  - `frontend/src/api/*`
- Dependencias: TASK-0474.
- Validación:
  - filtros por tipo/categoría/precio
  - badges visibles en todos los productos

### TASK-0476 - Detalle de producto y previews
- Objetivo: resolver detalle comercial desde entidad origen, con preview y trust signals.
- Archivos afectados:
  - endpoints detalle
  - componentes `ProductDetail`, related products, review summary
- Dependencias: TASK-0475.
- Validación:
  - detalle muestra tipo, vendedor, preview, qué incluye y CTA

### TASK-0477 - Carrito y checkout
- Objetivo: implementar carrito persistente, checkout y creación de órdenes.
- Archivos afectados:
  - modelos carrito/orden
  - endpoints cart/checkout/orders
  - frontend cart/checkout
- Dependencias: TASK-0475.
- Validación:
  - añadir al carrito
  - confirmar checkout
  - orden creada sin romper auth ni tenant

### TASK-0478 - Fulfillment por clonación
- Objetivo: clonar base/APU/proyecto al comprar.
- Archivos afectados:
  - servicios fulfillment marketplace
  - servicios puente con bases/APUs/proyectos
- Dependencias: TASK-0477.
- Validación:
  - el comprador recibe copia independiente
  - no se comparte referencia original

### TASK-0479 - Facturas, pedidos y recursos del comprador
- Objetivo: panel de cuenta con pedidos, invoices, descargas y recursos.
- Archivos afectados:
  - endpoints buyer
  - rutas y páginas `mis-pedidos`, `facturas`, `mis-descargas`
- Dependencias: TASK-0477, TASK-0478.
- Validación:
  - un comprador solo ve lo suyo

### TASK-0480 - Dashboard vendedor
- Objetivo: productos, ventas, ingresos, comisiones y estados.
- Archivos afectados:
  - endpoints seller
  - `frontend/src/pages/*seller*`
- Dependencias: TASK-0474, TASK-0477.
- Validación:
  - seller ve solo su catálogo y ventas

### TASK-0481 - Dashboard admin marketplace
- Objetivo: moderación, finanzas, comisiones y analíticas globales.
- Archivos afectados:
  - endpoints admin marketplace
  - `frontend/src/pages/*admin marketplace*`
- Dependencias: TASK-0473, TASK-0477.
- Validación:
  - admin puede aprobar/rechazar
  - admin ve ventas y comisiones globales

### TASK-0482 - Hardening y validación integral
- Objetivo: cerrar integración, pruebas y documentación final.
- Archivos afectados:
  - tests backend/frontend
  - documentación de tareas
- Dependencias: TASK-0472 a TASK-0481.
- Validación:
  - build frontend
  - `py_compile`
  - pruebas dirigidas E2E
