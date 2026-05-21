# Marketplace Clásico - Plan Maestro de Pagos, Postcompra y Gobierno Comercial

## Resumen
El siguiente frente del Marketplace clásico debe incorporar una arquitectura de pagos y postcompra capaz de soportar tres métodos iniciales:

- `PayPhone`
- `PayPal`
- `Transferencia bancaria`

Este plan no implementa todavía el código, pero deja definido el diseño funcional, la arquitectura recomendada y el orden de ejecución para no romper:

- storefront
- modal público de producto
- carrito persistente
- checkout ya remodelado
- experiencia visual del marketplace clásico

Además, el plan deja reflejada una restricción importante:

- solo `administradores de empresa` pueden comprar

Y una previsión futura que todavía no se implementa en este slice:

- los mismos administradores podrán actuar más adelante como `vendedores parciales` de una parte del catálogo, por lo que la arquitectura de pagos, órdenes y backoffice no debe cerrarse asumiendo un único vendedor `Sistema`.

## Objetivo
- Añadir `Formas de pago` al panel administrador.
- Añadir `Ventas Sistema` al panel administrador.
- Hacer funcional `Mis compras` para la empresa compradora.
- Adaptar checkout y postcompra a múltiples métodos de pago.
- Confirmar y entregar compras solo desde backend, nunca desde frontend.
- Soportar validación manual de transferencias.
- Mantener el carrito persistente entre sesiones sin perder control por rol.
- Dejar preparada la arquitectura para vendedores parciales futuros sin introducir todavía ese slice.
- Incorporar una política de devolución automatizada por categorías compatibles.
- Limpiar automáticamente carritos abandonados con más de `7 días` sin actividad.
- Recordar de forma sutil, al iniciar, que existen productos en el carrito cuando el usuario autorizado pueda comprar.
- Cerrar antes de implementar la matriz de estados, jobs temporales, auditoría mínima y criterio MVP del frente.

## Fuentes funcionales analizadas
- PayPhone oficial:
  - [Cajita de pagos Payphone](https://www.docs.payphone.app/cajita-de-pagos-payphone)
- PayPal oficial:
  - [PayPal JavaScript SDK](https://developer.paypal.com/sdk/js/)
  - [PayPal Standard Checkout - Get Started](https://developer.paypal.com/studio/checkout/standard/getstarted/)

## Principios rectores

### 1. Separar carrito, checkout y pago real
No mezclar:
- `cart`
- `checkout_draft`
- `order`
- `payment_attempt`
- `payment_event`
- `fulfillment`

Cada capa debe vivir por separado para poder soportar:
- reintentos
- conciliación
- pagos pendientes
- entregas diferidas
- auditoría
- múltiples configuraciones de pago por entorno
- futura coexistencia de varios vendedores lógicos

### 2. Activación de compra solo por backend
La compra no debe considerarse efectiva cuando el frontend muestra un mensaje de éxito.

La activación del acceso al producto debe ocurrir únicamente cuando backend valide:
- confirmación de `PayPhone`
- captura/confirmación de `PayPal`
- validación manual de `Transferencia bancaria`

La misma regla aplica a devoluciones y reembolsos:
- la reversión de acceso no puede quedar delegada al frontend
- el reembolso solo se considera efectivo cuando backend confirme el cambio de estado y la reversión del activo

### 3. Carrito persistente, compra restringida
El carrito puede seguir persistiendo entre sesiones por usuario, pero:
- solo los `administradores de empresa` pueden comprar
- el backend debe reforzar esa restricción

### 4. Preparación para multi-vendedor futuro
Aunque este frente se centra en `Ventas Sistema`, el modelo debe dejar prevista la futura participación de:
- `administradores` como vendedores parciales de ciertos productos

Por eso, órdenes, pagos y fulfillment no deben quedar acoplados a un único vendedor duro.

### 5. No romper la estética ni el flujo comercial actual
La implantación debe:
- mantener la gramática visual ya cerrada de storefront, detalle, carrito y checkout
- añadir capas de pago y postcompra sin rehacer visualmente el circuito comercial
- conservar la persistencia del carrito por usuario
- introducir confirmación, estados y backoffice sin degradar la experiencia pública

### 6. Devolución selectiva por categoría
La política de devolución no aplica igual a todo el catálogo.

Debe quedar fijado desde diseño:
- categorías con devolución automática de `30 minutos`:
  - `APUs`
  - `Proyectos`
  - `Bases Maestras`
- categorías sin devolución automática:
  - el resto del catálogo

Excepción:
- fuera de la ventana automática, solo `superadministración` puede forzar devolución desde `Ventas Sistema`

### 7. Backend-first en ventanas y estados
Todas las ventanas de tiempo y transiciones críticas deben resolverse en backend:
- abandono de carrito
- expiración de `checkout_draft`
- confirmación de pago
- ventana de devolución
- revocación de acceso

El frontend solo representa el estado vigente; no debe ser fuente de verdad para estos cálculos.

## Modelo recomendado

### Cart
Persistencia por usuario/sesión:
- `user_id`
- `items`
- `quantity`
- timestamps de actualización
- marca de abandono potencial
- `last_activity_at`

### Checkout Draft
Instantánea del intento comercial antes del pago:
- `draft_id`
- `company_id`
- `user_id`
- snapshot de ítems
- snapshot de producto y precio aplicado
- totales aplicados
- método de pago seleccionado
- estado de draft
- vigencia / expiración
- referencia de snapshot monetario

## Política de carrito abandonado
El carrito persistente no debe convertirse en almacenamiento indefinido.

Regla:
- todo carrito con más de `7 días` sin actividad se considera `abandonado`
- un carrito abandonado debe limpiarse automáticamente

Actividad válida:
- añadir ítems
- quitar ítems
- cambiar cantidades
- reabrir flujo comercial con mutación real de contenido

Implicaciones:
- el usuario puede conservar persistencia entre sesiones dentro de una ventana razonable
- el sistema evita arrastrar compras obsoletas
- la limpieza no debe interferir con pedidos ya formalizados ni con `checkout_draft` ya emitidos

Fuente de verdad temporal:
- el cálculo de los `7 días` debe hacerse en backend
- el frontend solo representa el resultado

### Recordatorio sutil al iniciar
Si al iniciar la aplicación o al recuperar sesión:
- el usuario actual es `administrador de empresa`
- y el carrito persistente contiene ítems válidos

el sistema debe mostrar un recordatorio sutil, no invasivo, indicando que existen productos pendientes en el carrito.

Reglas UX:
- no debe bloquear la navegación
- no debe usar modal intrusivo
- debe integrarse con la estética actual del marketplace clásico
- no debe mostrarse a usuarios sin permiso de compra
- no debe mostrarse si el carrito ya está vacío o fue limpiado por abandono

### Order
Representa la intención de compra ya formalizada:
- `order_id`
- `company_id`
- `user_id`
- `seller_scope`
- snapshot comercial
- versión de configuración comercial aplicada
- método de pago
- `order_status`
- importes congelados y reglas de redondeo aplicadas

### Payment Attempt
Representa cada intento de cobro:
- `payment_attempt_id`
- `order_id`
- `payment_method`
- `payment_status`
- `provider_order_id`
- `provider_transaction_id`
- `client_transaction_id`
- `idempotency_key`
- payload resumido
- `config_version`
- `environment_mode`
- `retry_count`

### Payment Event
Auditoría de eventos:
- `payment_event_id`
- `payment_attempt_id`
- proveedor
- evento
- payload crudo / resumido
- `processed_at`
- origen del evento:
  - retorno síncrono
  - webhook
  - conciliación manual
- `correlation_id`

### Fulfillment
Entrega del activo:
- `fulfillment_id`
- `order_id`
- `seller_scope`
- `status`
- activos otorgados
- fecha de activación
- `retry_count`

### Refund
Reversión económica y funcional de una compra:
- `refund_id`
- `order_id`
- `payment_attempt_id`
- `refund_status`
- `refund_reason`
- `requested_at`
- `approved_at`
- `processed_at`
- `auto_refund_deadline`
- `revoked_assets`
- `retry_count`

## Conceptos adicionales recomendados

### Payment Readiness
Cada método debe tener un estado de disponibilidad operativo:
- `disabled`
- `incomplete`
- `sandbox_ready`
- `production_ready`

Esto evita ofrecer métodos aparentemente activos que todavía no tienen:
- credenciales completas
- instrucciones suficientes
- endpoints funcionales

### Refund Eligibility
Cada orden debe poder resolver si es elegible para devolución automática:
- `eligible`
- `not_eligible`
- `window_expired`
- `manual_only`

Esto dependerá de:
- categoría comprada
- tiempo transcurrido desde la confirmación
- estado del activo entregado
- política del catálogo

### Seller Scope
Aunque en esta fase el vendedor lógico siga siendo `Sistema`, todos los modelos nuevos deben contemplar:
- `seller_scope`
- `seller_type`
- `seller_owner_id`

No se implementará todavía la venta parcial por administradores, pero estas claves deben existir a nivel de diseño para que:
- órdenes
- pagos
- fulfillment
- `Ventas Sistema`

puedan evolucionar a multi-vendedor sin rehacerse.

## Matriz de estados mínima

### Cart -> Checkout Draft
- `active -> open`
- `stale -> open`
- `abandoned -> cleared`

### Checkout Draft -> Order
- `open -> submitted`
- `submitted -> awaiting_payment`
- `awaiting_provider -> expired`
- `awaiting_provider -> canceled`

### Order + Payment
- `submitted -> awaiting_payment`
- `awaiting_payment -> paid` cuando `payment_status = confirmed`
- `awaiting_payment -> failed` cuando `payment_status = rejected`
- `awaiting_payment -> expired` cuando vence el intento
- `paid -> fulfilled` tras entrega correcta

### Refund
- `eligible -> requested`
- `requested -> approved`
- `approved -> processed`
- `eligible -> expired`
- `requested -> rejected`

Regla de consistencia:
- nunca debe existir `fulfilled` con `payment_status != confirmed`
- nunca debe existir `refund processed` sin revocación/retirada del activo
- el carrito no debe quedar `active` para los mismos ítems tras compra confirmada y formalizada

## Estados recomendados

### Order Status
- `draft`
- `submitted`
- `awaiting_payment`
- `paid`
- `fulfilled`
- `failed`
- `canceled`
- `expired`

### Payment Status
- `draft`
- `pending`
- `provider_approved`
- `confirmed`
- `rejected`
- `canceled`
- `expired`
- `abandoned`

### Refund Status
- `not_applicable`
- `eligible`
- `requested`
- `approved`
- `processed`
- `rejected`
- `expired`

### Checkout Draft Status
- `open`
- `submitted`
- `awaiting_provider`
- `expired`
- `canceled`

### Cart Status Operativo
- `active`
- `stale`
- `abandoned`
- `cleared`

## Jobs y temporizadores recomendados

### Limpieza de carrito abandonado
- frecuencia sugerida:
  - cada hora o cada pocas horas
- acción:
  - localizar carritos con `last_activity_at > 7 días`
  - marcarlos como `abandoned`
  - limpiar ítems
  - dejar trazabilidad mínima

### Expiración de checkout draft
- frecuencia sugerida:
  - cada pocos minutos
- acción:
  - expirar drafts pendientes de proveedor o sin cierre en su ventana válida

### Ventana de devolución automática
- frecuencia sugerida:
  - por lectura backend y/o job de expiración
- acción:
  - marcar como `expired` la elegibilidad automática al vencer los `30 minutos`

### Reconciliación de pagos
- frecuencia sugerida:
  - según proveedor
- acción:
  - reconsultar intentos atascados
  - cerrar estados intermedios

## Métodos de pago iniciales

### PayPhone
Flujo recomendado:
1. Backend crea intento.
2. Frontend renderiza cajita/modal.
3. PayPhone devuelve parámetros de retorno.
4. Backend ejecuta confirmación contra API PayPhone.
5. Si la confirmación es válida:
   - `payment_status = confirmed`
   - `order_status = paid`
   - se lanza `fulfillment`

Requisitos principales detectados:
- `token`
- `storeId`
- dominio registrado
- `return_url`
- confirmación en menos de 5 minutos

### PayPal
Flujo recomendado:
1. Backend crea orden PayPal.
2. Frontend renderiza botón SDK.
3. Usuario aprueba.
4. Backend captura/confirmar orden.
5. Si es válida:
   - `payment_status = confirmed`
   - `order_status = paid`
   - se lanza `fulfillment`

Requisitos mínimos:
- `client_id`
- `client_secret`
- entorno `sandbox/producción`
- webhook/reconciliación recomendada
- idempotencia en captura

### Transferencia bancaria
Flujo recomendado:
1. Backend crea pedido.
2. `payment_status = pending`
3. No se entrega el activo.
4. Empresa carga o informa datos de pago.
5. `superadministrador` valida manualmente.
6. Solo entonces:
   - `payment_status = confirmed`
   - `order_status = paid`
   - se lanza `fulfillment`

Datos recomendados:
- banco
- titular
- cuenta / referencia
- identificación fiscal
- instrucciones
- referencia bancaria obligatoria
- comprobante recomendado
- observaciones

## Política de devoluciones

### Categorías con devolución automática
Las siguientes categorías tendrán una ventana de devolución automática de `30 minutos` desde la compra confirmada:
- `APUs`
- `Proyectos`
- `Bases Maestras`

Durante esa ventana:
- el cliente puede solicitar devolución
- el sistema debe revocar el acceso al activo
- el sistema debe iniciar el reembolso por el método de pago correspondiente
- la operación debe quedar auditada

### Categorías sin devolución automática
En el resto de categorías:
- no existe devolución automática
- la compra se considera final por defecto

### Excepción manual
Fuera de la ventana de `30 minutos`, o en categorías sin devolución automática:
- solo `superadministración` puede ordenar devolución manual desde `Ventas Sistema`

### Regla operativa
Si hay devolución aprobada:
- el activo debe ser borrado, revocado o desasignado de la empresa compradora
- el pedido debe quedar trazado como reembolsado
- el pago debe quedar trazado como reembolsado total en esta primera fase

### Consideraciones por método
- `PayPhone`: el plan debe prever confirmación de reembolso o conciliación equivalente
- `PayPal`: el plan debe prever `refund` backend con trazabilidad
- `Transferencia bancaria`: la devolución será manual/administrativa, no automática de proveedor

## Nuevas secciones funcionales

### Panel de administrador - Formas de pago
Debe permitir:
- activar / desactivar métodos
- configurar credenciales
- definir `sandbox / producción`
- validar readiness
- ordenar prioridad de métodos
- marcar método recomendado si procede
- mostrar estado:
  - `disabled`
  - `incomplete`
  - `sandbox_ready`
  - `production_ready`

### Panel de administrador - Ventas Sistema
Debe permitir:
- ver ventas del sistema
- filtrar por:
  - método
  - estado
  - empresa
  - fecha
- foco especial en transferencias pendientes
- aprobar / rechazar transferencias
- registrar referencia y observación manual
- reconsultar estado cuando proceda
- aprobar devoluciones manuales fuera de ventana o en categorías no automáticas
- ver elegibilidad y expiración de devolución por pedido

### Empresa - Mis compras
Debe permitir:
- ver datos básicos de la empresa compradora
- listar compras
- mostrar:
  - estado del pedido
  - estado del pago
  - método de pago
  - total
  - fecha
  - acceso al activo solo si está confirmado
- mantener la lectura de pedidos ligados a su empresa, aunque el carrito siga persistiendo por usuario
- mostrar si el pedido tiene devolución automática disponible y cuánto tiempo queda

## Política de tiempo y zonas horarias
- backend guarda y calcula en `UTC`
- frontend presenta en horario local
- la elegibilidad temporal nunca se resuelve solo en cliente

## Política monetaria y de redondeo
- moneda base inicial: `USD`
- el pedido congela el importe efectivamente ofertado
- descuento, total y refund deben seguir una misma política de redondeo
- el refund usa el importe efectivamente abonado, no un precio recalculado del producto vivo

## Auditoría mínima obligatoria
Cada uno de estos eventos debe dejar trazabilidad suficiente:
- creación de `checkout_draft`
- formalización de `order`
- creación y confirmación de `payment_attempt`
- recepción de `payment_event`
- ejecución de `fulfillment`
- creación y resolución de `refund`
- validación manual de transferencia
- limpieza de carrito abandonado
- revocación de acceso por devolución

## Política de reintentos
- confirmación de proveedor:
  - reintentos limitados
- `fulfillment`:
  - reintentos limitados antes de escalar a resolución manual
- `refund`:
  - reintentos limitados antes de pasar a intervención manual

El plan no fija todavía un número exacto, pero sí exige máximo acotado y salida a resolución manual.

## Caso crítico de refund fallido
Si el acceso fue revocado pero el refund no pudo cerrarse correctamente:
- el pedido debe quedar en estado de resolución manual
- `Ventas Sistema` debe poder reintentar o cerrar manualmente la incidencia
- nunca debe perderse la trazabilidad del importe ni del acceso retirado

## Feature flags recomendadas
- `payments_enabled`
- `payphone_enabled`
- `paypal_enabled`
- `bank_transfer_enabled`
- `refunds_enabled`
- `system_sales_enabled`

Esto permitirá desplegar por fases sin romper el circuito comercial ya estabilizado.

## Operación y mantenimiento
- los carritos abandonados con más de `7 días` deben limpiarse por tarea programada o limpieza equivalente de backend
- la limpieza debe dejar trazabilidad mínima para soporte si fuese necesario
- el borrado de carrito no debe tocar pedidos, pagos ni activos ya confirmados
- el recordatorio sutil de carrito debe depender del estado real del carrito persistente después de aplicar la política de abandono

## Reglas de negocio críticas
- solo `administradores de empresa` pueden comprar
- el carrito puede persistir, pero el checkout no debe saltarse la validación de rol
- el carrito deja de ser válido tras `7 días` sin actividad y debe limpiarse
- el recordatorio de carrito al iniciar solo debe mostrarse a usuarios autorizados para comprar
- la compra no se activa hasta confirmación backend
- la transferencia no entrega acceso hasta validación manual
- el carrito debe vaciarse solo tras confirmación efectiva del pedido
- en la primera fase se recomienda política `todo o nada` por orden
- los productos y precios se deben congelar en snapshot al crear el `checkout_draft` y la `order`
- la capa de pago no debe asumir para siempre un único vendedor rígido
- la devolución automática solo existe para `APUs`, `Proyectos` y `Bases Maestras`
- la ventana automática de devolución es de `30 minutos` desde la confirmación de compra
- fuera de esa ventana, la devolución solo puede ser manual por `superadministrador`
- la devolución debe revocar primero o de forma atómica el acceso al activo comprado

## UX y diseño
- mantener la gramática visual actual de storefront, detalle, carrito y checkout
- no abrir métodos no configurados o incompletos como opciones reales de pago
- adaptar el checkout actual con una nueva capa:
  - `Método de pago`
  - `Estado del pago`
- no rehacer visualmente el storefront desde cero
- no convertir recordatorios, expiraciones y políticas temporales en modales invasivos salvo necesidad real

## Slice futuro previsto, no implementado en este plan
La arquitectura debe quedar preparada para que más adelante:
- los `administradores` puedan vender un subconjunto de productos
- el sistema soporte `seller_scope` más flexible
- `Ventas Sistema` evolucione a una consola de ventas multi-origen
- `Formas de pago` pueda activar métodos por vendedor o por subconjunto de catálogo

Este slice futuro no forma parte de la implementación actual, pero condiciona el diseño actual:
- no acoplar pagos y pedidos a un único vendedor rígido

## Orden de implementación recomendado
1. Core de pagos y órdenes
2. Restricción de compra por rol
3. Panel `Formas de pago`
4. Adaptación del checkout
5. Integración `PayPhone`
6. Integración `PayPal`
7. Transferencia bancaria
8. Política de devolución automática y refund eligibility
9. `Mis compras`
10. `Ventas Sistema`
11. Fulfillment y endurecimiento final
12. Limpieza automática de carrito abandonado
13. Recordatorio sutil de carrito al iniciar para administradores de empresa

## Orden recomendado de MVP
Para reducir riesgo, el primer MVP debería cerrar:
1. `TASK-0755`
2. `TASK-0756`
3. `TASK-0757`
4. `TASK-0758`
5. `TASK-0768`
6. `TASK-0769`
7. `TASK-0761`
8. `TASK-0762`
9. `TASK-0763`

Y dejar para una segunda ola:
- `TASK-0759`
- `TASK-0760`
- `TASK-0765`
- `TASK-0766`
- `TASK-0767`
- `TASK-0764`

## Tasks derivadas
- `TASK-0755`
- `TASK-0756`
- `TASK-0757`
- `TASK-0758`
- `TASK-0759`
- `TASK-0760`
- `TASK-0761`
- `TASK-0762`
- `TASK-0763`
- `TASK-0764`
- `TASK-0765`
- `TASK-0766`
- `TASK-0767`
- `TASK-0768`
- `TASK-0769`

## Criterio de cierre
El frente se considerará correctamente implantado cuando:
- checkout soporte múltiples métodos
- pagos online confirmen correctamente
- transferencia quede pendiente hasta validación
- `Mis compras` y `Ventas Sistema` sean operativos
- la compra solo entregue acceso tras confirmación real
- el diseño siga integrado con la estética actual del marketplace clásico
- el carrito persistente siga funcionando entre sesiones
- los carritos abandonados con más de `7 días` se limpien automáticamente
- los administradores de empresa con carrito activo vean un recordatorio sutil al iniciar
- el backend impida comprar a usuarios que no sean administradores de empresa
- la arquitectura deje explícita la evolución futura a vendedores parciales sin exigir una reestructuración del núcleo
- la devolución automática de `30 minutos` funcione para `APUs`, `Proyectos` y `Bases Maestras`
- las categorías no elegibles no ofrezcan devolución automática
- `Ventas Sistema` permita devoluciones manuales excepcionales por `superadministración`
- exista una matriz de estados válida antes de abrir proveedores online
- queden definidos jobs, trazabilidad mínima y feature flags antes de producción

## Estado de cierre de esta fase
El frente queda materializado en esta fase sobre el marketplace clásico:
- checkout multiforma con `Transferencia bancaria`, `PayPhone` y `PayPal`
- `checkout_draft`, `payment_attempt`, `payment_event` y housekeeping operativo
- restricción de compra a administradores de empresa
- `Mis compras`, `Ventas Sistema` y detalle de pedido con lenguaje unificado
- política de devolución por categoría, refund trazable y revocación segura del acceso
- carrito persistente con limpieza por abandono y recordatorio sutil al iniciar

Quedan fuera de esta fase únicamente evoluciones futuras no incluidas en el plan original de cierre:
- vendedores parciales
- webhooks/reconciliación avanzada por proveedor
- automatismos adicionales de producción más allá del housekeeping actual
