# Marketplace Buyer Seller Functional Workbench Execplan

## Objetivo
Reestructurar `Mis compras` y `Mis ventas` para que dejen de comportarse como páginas largas de lectura técnica y pasen a operar como superficies de trabajo reales, apoyadas en listados útiles y modales acotados, manteniendo el look & feel actual del marketplace clásico.

## Problema detectado
- `Panel Administrador` ya opera como lanzador de submódulos reales en `AppModalShell`.
- `Mis compras` y `Mis ventas` seguían siendo pantallas largas con navegación por scroll interno.
- La entrada visual no estaba alineada con su arquitectura funcional.
- Había exceso de bloques técnicos sin valor directo de uso para comprador o vendedor.

## Principios UX
- Empezar por listados reales, no por KPIs abstractos.
- Cada bloque del primer viewport debe permitir actuar.
- Los frentes secundarios deben abrir en modales acotados.
- Mantener la gramática visual actual de Tienda clásica.
- Reutilizar `AppModalShell`, `AppModalHeader`, `AppModalBody` y `AppModalFooter`.

## Arquitectura objetivo

### Mis compras
- Cabecera sticky homogénea con admin
- Bandeja principal de compras
- Bandeja principal de activos entregados
- Modales:
  - `Mis compras`
  - `Biblioteca de compra`

### Mis ventas
- Cabecera sticky homogénea con admin
- Selector funcional de contexto `Empresa / Sistema`
- Bandeja principal de catálogo publicado
- Bandeja principal de ventas
- Modales:
  - `Catálogo publicado`
  - `Ventas`

## Tasks
- `TASK-0779`: Replantear `Mis compras` como bandeja funcional con modales acotados.
- `TASK-0780`: Replantear `Mis ventas` como bandeja funcional con modales acotados.
- `TASK-0781`: Migrar buyer/seller desde navegación por scroll a submódulos operativos reales.
- `TASK-0782`: Homologar cabeceras y arquitectura de entrada con `Panel Administrador`.
- `TASK-0783`: Rebajar ruido técnico y priorizar acciones de valor real de uso.

## Estado de esta iteración
- Buyer: completado como bandeja funcional con workbenches modales reales.
- Seller: completado como bandeja funcional con workbenches modales reales.
- La migración buyer/seller queda cerrada funcionalmente en esta fase; cualquier remate visual menor se absorbe como QA transversal, no como deuda de arquitectura.
