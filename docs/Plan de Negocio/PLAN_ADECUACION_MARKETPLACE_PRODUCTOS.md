# Plan de adecuacion Marketplace para productos SaaS GIPROY

Fecha: 2026-06-08

Modo: GIPROY CLASICO

Documento fuente: `docs/Plan de Negocio/Plan Aprobado V1.docx`

## 0. Decision de adecuacion aceptada

Las propuestas de adecuacion quedan aceptadas como direccion inicial del programa comercial SaaS de GiProy Clasico:

- Marketplace sera el canal de venta, no el motor directo de permisos.
- Licencias seguira siendo la fuente de verdad de plan base, vigencia y limites.
- Packs y modulos se modelaran como derechos SaaS adicionales, auditables y separables de la licencia base.
- Toda compra confirmada debera pasar por una entrega SaaS backend idempotente.
- La UI solo reflejara capacidades resueltas por backend.
- `Conecta` y `Equipo` quedan separados en fases propias por su impacto en permisos y colaboracion.
- `Equipo` no se implementa junto con checkout; se ejecuta por slices independientes por EDT, locks, auditoria y aprobacion.
- Reporting y exportaciones con marca de agua se validaran server-side.
- Retencion de datos adoptara politica mixta documentada antes de implementarse.

Este documento no autoriza codigo por si solo. Cada fase de ejecucion debe abrir TASK propia, validar impacto clasico, preservar el baseline `TASK-1807` y mantener BIM apagado/no interferente.

### 0.1 Politica global de formas de pago

Las formas de pago configuradas en Marketplace son metodos comerciales globales,
no metodos exclusivos de compras publicas. Cuando una forma de pago queda activa
y lista (`sandbox_ready` o `production_ready`), debe poder usarse en toda compra
disponible que pase por el checkout comercial clasico: productos publicos,
licencias base, packs SaaS, modulos independientes y productos sistema
vendibles.

La visibilidad de cada producto puede seguir dependiendo de empresa, permisos,
licencia, metadata comercial o restricciones de superadministracion; la lista de
formas de pago activas no debe duplicarse por canal. `TASK-1894` implementa la
guarda backend para impedir que un checkout use por API directa un metodo
inactivo o incompleto y activa transferencia bancaria como primer metodo local.

## 1. Resumen ejecutivo del plan aprobado

El documento aprobado define un modelo comercial SaaS basado en tres familias de oferta:

- Licencias base: `EXPRES`, `ESTANDAR`, `PROFESIONAL`, `TESTER`, `ACADEMICA` y `CAPACITACION`.
- Packs complementarios: `Planifica`, `Licita`, `Conecta` y `Equipo`.
- Modulos de compra independiente: `Fusion` y `Migracion`.

La logica comercial principal es que las licencias base gobiernan acceso, limites y duracion; los packs desbloquean capacidades adicionales; y algunos modulos se compran como productos independientes de pago unico. El documento tambien fija reglas de colaboracion, transferencia, retencion de datos, precios sugeridos, alertas de negocio, KPIs y una ruta MVP por fases.

El objetivo de adecuacion para GiProy no debe ser crear otro sistema comercial paralelo, sino conectar este modelo con los dominios ya existentes:

- `Licencias y cuotas` como fuente de verdad de vigencia, limites y acceso.
- `Marketplace` como canal de venta, checkout, ordenes, pagos, facturas y biblioteca.
- Backend comun como validador server-side obligatorio.
- Frontend clasico como experiencia visible, sin activar UX BIM ni tocar despliegue.

## 2. Lectura funcional del documento fuente

### 2.1 Licencias base

`EXPRES` funciona como trial/freemium de 30 dias con limites estrictos, publicidad y reportes con marca de agua.

`ESTANDAR` es la licencia comercial base. Permite APUs y presupuestos, pero segun la matriz no incluye cronogramas, formula polinomica ni desagregacion salvo compra de packs.

`PROFESIONAL` es la licencia comercial premium. Incluye `Planifica` y `Licita`, y puede comprar `Conecta` y `Equipo`.

`TESTER` es una licencia especial con acceso amplio, canal directo y modulos especiales habilitados para feedback.

`ACADEMICA` y `CAPACITACION` son licencias especiales educativas con duracion limitada, restricciones comerciales, almacenamiento bajo y reportes con marca de agua.

### 2.2 Packs

`Planifica` habilita o agrupa funcionalidades de planificacion: cronogramas, formula polinomica y desagregacion tecnologica segun la matriz.

`Licita` agrupa capacidades relacionadas con licitacion, oferta y preparacion documental/comercial.

`Conecta` gobierna intercambio entre usuarios, con limites por licencia y regla de cambio cada 30 dias.

Adenda 2026-06-16 para `Envios y Transferencias`: `Conecta` queda redefinido
para este plan como producto Marketplace exclusivo de ampliacion de empresas
destino del modulo `Otros Servicios > Envios y Transferencias`. La funcionalidad
base queda incluida en licencias comerciales `STANDARD` y `PROFESSIONAL`;
`Conecta` no habilita el modulo base, sino que agrega 3 empresas destino
adicionales durante 30 dias desde la fecha/hora exacta de compra. Cada compra es
independiente, sus destinatarios quedan asociados a esa compra concreta, las
compras son acumulables y el precio inicial definido es `24,99 USD`. Esta
adecuacion no debe conceder permisos implicitos sobre proyectos, EDT,
presupuestos ni cronogramas.

En el contexto de activos enviados, todos los productos Marketplace detectados
son obligatorios para la empresa receptora. No existen productos informativos,
recomendados u opcionales. Si el receptor no compra el conjunto completo
requerido, el envio queda bloqueado para apertura, importacion y uso. El precio
aplicable al receptor es siempre el precio vigente de Marketplace al momento de
su compra, no el precio historico pagado por el emisor.

`Equipo` habilita colaboracion federada con especialistas, solo para titulares `PROFESIONAL`, con acceso por EDT, locks por partida, log de cambios y aprobacion/rechazo por administrador.

### 2.3 Modulos independientes

`Fusion` y `Migracion` son compras de pago unico. En la matriz aparecen habilitados para `TESTER`, no para licencias comerciales base por defecto.

### 2.4 Retencion y vencimiento

El documento contiene dos reglas que deben resolverse antes de implementar:

- Una seccion indica periodo de gracia de 15 dias con acceso de solo lectura.
- Otra seccion indica suspension inmediata en dia 0, datos inaccesibles del dia 1 al 29 y eliminacion en dia 30.

La decision recomendada para GiProy es separar `acceso funcional` de `retencion de datos`:

- Dia 0: vence la licencia y se bloquea escritura.
- Dias 1 a 15: solo lectura para respaldo y renovacion.
- Dias 16 a 30: datos retenidos sin operacion normal; solo reactivacion o descarga administrativa controlada si se decide permitirla.
- Dia 30: eliminacion o cola de eliminacion irreversible, con aprobacion operativa y backup legal si aplica.

## 3. Estado actual del sistema relevante

### 3.1 Licencias

El backend ya tiene:

- Modelo `Licencia` con `codigo`, `plan_kind`, precios mensual/anual y `limites` JSON.
- Modelo `EmpresaLicencia` con vigencia, estado, fuente, gracia y modo solo lectura.
- Servicio de licencias con catalogo base, asignacion a empresa, housekeeping, snapshot de estado, flags especiales y limites.
- Administracion global de licencias y cuotas.
- Eventos de licencia mediante `LicenseEvent`.

Brechas frente al plan aprobado:

- El catalogo actual incluye `Express`, `Estandar`, `Profesional` y `Empresarial`, pero no esta alineado exactamente a los codigos, limites, precios y duracion del DOCX.
- `Express` actual esta sembrada como default sin vencimiento claro, mientras el plan aprobado exige trial de 30 dias.
- Los limites actuales difieren: por ejemplo `Express` actual usa mas capacidad que el plan aprobado.
- Las capacidades por modulo no estan modeladas aun como derechos granulares vendibles por pack.
- Las compras desde Marketplace no asignan todavia licencias ni packs como consecuencia comercial.

### 3.2 Marketplace

El backend ya tiene:

- Productos, categorias, ordenes, items, checkout drafts, intentos de pago, eventos de pago, metodos de pago, reembolsos y biblioteca del comprador.
- Tipos de producto reservados, incluyendo `licencia`, `addon`, `adicional` y `portal_compras_publicas`.
- Productos administrables por superadmin.
- Checkout y flujo de pagos con PayPhone, PayPal y transferencia bancaria.
- Factura/descargas y gobierno de compras.

Brechas frente al plan aprobado:

- Falta un contrato explicito de entrega para productos SaaS: al pagar una licencia, pack o modulo, debe activarse un derecho en la empresa compradora.
- Falta distinguir producto informativo de producto activable.
- Falta definir vigencia mensual/anual, renovacion, upgrade, downgrade, cola de activacion y prorrateos.
- Falta conectar compras con `EmpresaLicencia`, eventos de licencia y estados de acceso.
- Falta biblioteca/estado de derechos SaaS comprados, separada de assets como proyectos/APUs/bases.

## 4. Necesidades para convertir el plan en productos vendibles

### 4.1 Catalogo comercial unificado

Crear una taxonomia comercial unica para Marketplace:

| Familia | Ejemplos | Tipo Marketplace propuesto | Entrega |
|---|---|---|---|
| Licencia base | EXPRES, ESTANDAR, PROFESIONAL | `licencia` | Asignacion o renovacion de `EmpresaLicencia` |
| Licencia especial | TESTER, ACADEMICA, CAPACITACION | `licencia_especial` o `licencia` con metadata | Asignacion controlada, normalmente no publica |
| Pack | Planifica, Licita, Conecta, Equipo | `addon` | Derecho adicional ligado a empresa/licencia |
| Modulo independiente | Fusion, Migracion | `modulo` o `addon` | Derecho de pago unico con vigencia definida |
| Producto operativo actual | APU, Base, Proyecto, Portal | tipos existentes | Entrega de asset o clonacion |

La recomendacion conservadora es no crear inicialmente muchas tablas nuevas de producto comercial. Primero usar `MarketplaceProduct.product_type` y `vista_previa/product_meta` con un contrato documentado, y solo despues normalizar si la implementacion lo exige.

### 4.2 Derechos y capacidades

El sistema necesita una capa de derechos calculados, server-side, que responda preguntas como:

- Que licencia base tiene la empresa activa.
- Que packs activos tiene la empresa.
- Que modulos independientes activos tiene la empresa.
- Que funcionalidades quedan habilitadas.
- Que limites aplican.
- Que restricciones comerciales aplican.

Esta capa debe nutrirse de `EmpresaLicencia`, ordenes Marketplace confirmadas y futuros registros de derechos SaaS. No debe confiar en flags del frontend.

### 4.3 Entrega post-compra

Cada orden confirmada de Marketplace con producto SaaS debe tener una entrega idempotente:

- Si compra licencia base mensual/anual: crear o encolar `EmpresaLicencia`.
- Si compra upgrade desde Express a Estandar/Profesional: cancelar Express y activar nueva licencia.
- Si renueva la misma licencia: extender vigencia o crear asignacion en cola.
- Si compra pack: crear derecho asociado a empresa, licencia y periodo.
- Si compra modulo pago unico: crear derecho permanente o con vigencia contractual.
- Si falla la entrega: dejar orden pagada en estado de atencion administrativa, no duplicar cobros ni activar dos veces.

### 4.4 Reglas comerciales prioritarias

Antes de codigo deben cerrarse estas decisiones:

- Si `EXPRES` conserva APUs, presupuestos y cronogramas como indica la matriz, o si se limita mas por ser trial.
- Si `ESTANDAR` realmente no incluye cronogramas/formula/desagregacion sin `Planifica`.
- Si `PROFESIONAL` incluye `Planifica` y `Licita` como derechos base o como packs con precio cero.
- Si `Conecta` debe ser pack por empresa, por usuario o por par de conexion.
- Si `Equipo` lo paga el titular por colaborador, o si cada colaborador compra su propia licencia `EQUIPO`.
- Si `Fusion` y `Migracion` son productos publicos, servicios asistidos o capacidades bajo aprobacion.
- Cual regla de retencion gana: 15 dias solo lectura, 30 dias inaccesibles, o esquema mixto.

## 5. Plan de adecuacion propuesto

### Fase 0 - Gobierno documental y decisiones cerradas

Objetivo: convertir el DOCX en contrato funcional ejecutable.

Entregables:

- Matriz oficial de licencias, packs, modulos, precios y limites.
- Resolucion de contradicciones de retencion y acceso.
- Diccionario de codigos canonicos: `EXPRESS`, `STANDARD`, `PROFESSIONAL`, `TESTER`, `ACADEMIC`, `TRAINING`, `PACK_PLANIFICA`, `PACK_LICITA`, `PACK_CONECTA`, `PACK_EQUIPO`, `MOD_FUSION`, `MOD_MIGRACION`.
- Politica de upgrades, renovaciones, reembolsos y downgrade.
- Politica de marca de agua y exportaciones por licencia.

Validacion documental:

- Revisión contra `license_service.DEFAULT_LICENSE_CATALOG`.
- Revisión contra productos/tipos actuales de Marketplace.
- Revisión con administracion global de licencias.

### Fase 1 - Catalogo vendible en Marketplace

Objetivo: que el Marketplace pueda listar licencias, packs y modulos como productos administrados por GiProy.

Alcance por slices:

- Categoria fija `Licencias y planes`.
- Categoria fija `Packs SaaS`.
- Categoria fija `Servicios y modulos`.
- Productos admin-only para cada plan/premium pack.
- Metadata de producto con `commercial_code`, `billing_period`, `delivery_kind`, `requires_base_plan`, `included_in`, `activation_policy`.

No debe tocar:

- BIM.
- Contratos actuales de venta de APUs, bases, proyectos o portal de compras.
- Publicacion de sellers externos.

### Fase 2 - Activacion de licencias por compra

Objetivo: que una orden pagada active una licencia base o renovacion.

Alcance futuro:

- Servicio de entrega SaaS desde orden Marketplace.
- Asignacion de `EmpresaLicencia` con fuente `marketplace_order`.
- Evento `license_marketplace_purchase_activated`.
- Idempotencia por `marketplace_order_item_id`.
- Manejo de renovacion, upgrade desde Express y compra anticipada.

Validaciones:

- Compra Estandar mensual activa licencia por 1 mes.
- Compra Profesional anual activa licencia por 12 meses.
- Recompra de misma licencia no duplica activacion accidental.
- Pago rechazado no activa licencia.

### Fase 3 - Packs y derechos adicionales

Objetivo: modelar derechos complementarios sin romper licencias base.

Alcance futuro:

- Registro de derechos SaaS por empresa.
- Capabilities calculadas para `Planifica`, `Licita`, `Conecta`, `Equipo`.
- Validacion server-side para funcionalidades restringidas.
- Lectura frontend solo como reflejo del backend.

Punto sensible:

Si `Planifica` controla `Cronogramas`, `Formula Polinomica` y `Desagregacion`, esto toca modulos sensibles. Debe hacerse por slices y con smokes focales.

### Fase 4 - Colaboracion CONECTA

Objetivo: implementar reglas de conexion entre usuarios/empresas sin abrir colaboracion federada completa.

Alcance:

- Modelo persistente `saas_conecta_slots` implementado en `TASK-1887`.
- Servicio backend de cupos y asignacion implementado en `TASK-1887`.
- Endpoints clasicos `/api/v1/conecta` implementados en `TASK-1888`.
- Cambio permitido cada 30 dias, con excepcion auditada solo para superadministrador.
- Compra de `Conecta` interpretada como cupos adicionales desde productos SaaS efectivos.
- UI clasica Conecta implementada en `TASK-1889`; auditoria/KPIs implementados
  en `TASK-1890`.
- Certificacion E2E implementada en `TASK-1891`: compra de Pack Conecta desde
  Marketplace, entrega como `saas_right`, visibilidad por empresa y uso de cupo.

Validaciones:

- Estandar no supera 1 conexion sin pack.
- Profesional no supera 2 conexiones sin pack.
- No se permite conectar hacia licencia inferior si la regla final se mantiene.

### Fase 5 - Colaboracion EQUIPO

Objetivo: habilitar colaboracion federada por EDT bajo titular Profesional.

Alcance futuro:

- Slice 1 MVP anti-fuga: acceso read-only por nodos EDT asignados, sin
  escritura colaborativa (`TASK-1892`).
- Slice 2 comercial: licencia/derecho `Equipo` por colaborador desde
  Marketplace, con vigencia y entrega SaaS, sin conceder acceso operativo
  automatico.
- Slice 3 gestion operativa: asignacion admin de colaboradores a proyecto/nodos
  EDT desde `SaaS / Superadministrador`.
- Slice 4 frontera UI clasica: EDT y Presupuestos visibles solo en alcance
  asignado.
- Slice 5 locks por partida y log auditable por usuario.
- Slice 6 aprobacion/rechazo por administrador antes de consolidar cambios.
- Slice 7 expansion a cronogramas/reportes solo cuando existan guardas
  equivalentes.

Riesgo alto:

Esta fase toca EDT, Presupuestos, permisos, multi-tenant y auditoria. Debe dividirse en TASKs pequeñas y no debe mezclarse con Marketplace checkout.

Estado MVP:

- `TASK-1892` implementa el primer perimetro defensivo: colaborador asignado por
  EDT consulta solo su rama y lineas de presupuesto asociadas; usuario sin
  asignacion recibe `403`; administradores conservan vista completa.
- `TASK-1893` implementa el MVP operativo de Equipo: cupos/asientos,
  asignacion EDT sincronizada con `ProyectoAsignacion`, locks, propuestas,
  aprobacion/rechazo sobre campos seguros de linea de presupuesto, operacion en
  `SaaS / Superadministrador` y controles minimos en `Presupuesto` para lock y
  propuesta de cantidad por colaborador.
- Queda pendiente fuera del MVP la extension controlada a cronogramas/reporting
  y una bandeja local por empresa distinta de `SaaS / Superadministrador`, solo
  con TASK explicita.

### Fase 6 - Retencion, alertas y KPIs

Objetivo: cerrar el ciclo SaaS operativo.

Alcance futuro:

- Recordatorios de vencimiento.
- Banners de conversion.
- Housekeeping de expiracion.
- Estados de solo lectura/inaccesible.
- KPIs de conversion y adopcion.
- Eventos de negocio para analitica.

## 6. Programa de TASKs de control y ejecucion

### 6.1 TASK de control

| TASK | Objetivo | Estado |
|---|---|---|
| TASK-1872 | Control madre del programa SaaS Marketplace | Abierta documentalmente |

### 6.2 TASKs documentales de cierre de contrato

| TASK | Objetivo | Salida esperada |
|---|---|---|
| TASK-1873 | Matriz canonica comercial SaaS | Implementada documentalmente |
| TASK-1874 | Contrato de producto SaaS vendible en Marketplace | Implementado documentalmente |
| TASK-1875 | Politica de retencion, vencimiento y renovacion | Implementada documentalmente |

### 6.3 TASKs de ejecucion futura

| TASK | Objetivo | Tipo |
|---|---|---|
| TASK-1876 | Catalogo Marketplace de productos SaaS administrados por GiProy | Implementado |
| TASK-1877 | Entrega idempotente de licencias base desde orden confirmada | Implementado |
| TASK-1878 | Renovacion, upgrade y downgrade desde Marketplace | Implementado |
| TASK-1879 | Derechos SaaS para packs y modulos independientes | Implementado |
| TASK-1880 | Resolvedor server-side de capacidades comerciales | Implementado backend |
| TASK-1881 | Guardas server-side de reporting, Excel/PDF y marca de agua | Implementado backend |
| TASK-1882 | UI clasica de compra y estado de plan en Marketplace/Settings/AdminGlobal | Implementado |
| TASK-1883 | `Conecta` MVP con cupos y regla de cambio cada 30 dias | Contrato cerrado |
| TASK-1884 | `Equipo` colaborativo por EDT con locks, auditoria y aprobacion | Plan ejecutado como MVP |
| TASK-1885 | Alertas, recordatorios, housekeeping y KPIs SaaS | Admin/reporting futuro |
| TASK-1886 | Alineacion de empresas actuales a politicas SaaS Marketplace | Implementado |
| TASK-1887 | Backend Conecta, modelo persistente, cupos y regla de 30 dias | Implementado backend |
| TASK-1888 | Endpoints clasicos Conecta y frontera API | Implementado backend |
| TASK-1889 | UI clasica Conecta en SaaS/Settings/AdminGlobal | Implementado frontend |
| TASK-1890 | Auditoria, housekeeping y KPIs Conecta | Implementado admin no destructivo |
| TASK-1891 | Certificacion end-to-end Marketplace SaaS con empresa mockup | Implementado QA/E2E |
| TASK-1892 | MVP Equipo Slice 1: perimetro EDT anti-fuga con empresa mockup | Implementado backend/test |
| TASK-1893 | Equipo Slice 2: cupos, asignacion EDT, locks y propuestas | Implementado MVP operativo |

### 6.4 Orden recomendado

1. `TASK-1873`, `TASK-1874` y `TASK-1875` ya cerraron la matriz, contrato y politica base.
2. `TASK-1876` ya implementa el catalogo vendible sin entrega automatica nueva para packs/modulos.
3. `TASK-1877` ya implementa la entrega idempotente de licencias base desde orden confirmada.
4. `TASK-1878` ya implementa clasificacion y reglas base de renovacion, upgrade/downgrade sin prorrateo.
5. `TASK-1879` ya implementa derechos SaaS minimos para packs/modulos y visibilidad por empresa en Superadministracion/SaaS.
6. `TASK-1880` implementado: resolver capacidades efectivas desde licencia base, derechos SaaS y restricciones comerciales.
7. `TASK-1881` implementado: el backend bloquea `xlsx` y `pdf_excel` cuando la capacidad efectiva `excel_exports` es falsa, y aplica marca de agua server-side en PDFs cuando `requires_watermark=true`.
8. `TASK-1882` implementado: Superadministrador ve capacidades resueltas por empresa, Marketplace filtra el catalogo SaaS oficial, Settings muestra licencia/productos/capacidades y la renovacion/cambio de plan navega al catalogo oficial con busqueda enfocada.
9. `TASK-1883` cerrado como contrato: Conecta MVP sera usuario-usuario dentro de empresa activa, con cupos efectivos y regla de 30 dias; no otorgara acceso automatico a proyectos, EDT, presupuestos ni cronogramas.
10. `TASK-1887` implementado: backend persistente de Conecta, cupos efectivos, regla de 30 dias y excepcion superadministrador auditada.
11. `TASK-1888` implementado: endpoints clasicos Conecta y frontera API.
12. `TASK-1889` implementado: UI clasica Conecta en Settings y SaaS/Superadministrador, con cliente API de dominio y smokes de frontera.
13. `TASK-1890` implementado: resumen admin Conecta, KPIs por empresa, cupos bloqueados por regla de 30 dias y conteo de excepciones.
14. Implementar `TASK-1884` como fase separada de mayor riesgo.
15. Implementar `TASK-1885` cuando exista base suficiente de eventos comerciales.
16. `TASK-1886` ya alineo las empresas actuales y el catalogo local de licencias con la politica aprobada.
17. `TASK-1891` implementado: certificacion E2E con empresa mockup, compra/entrega Marketplace, visibilidad por empresa y flujo Conecta completo.

## 7. Riesgos y puntos de choque

- Retencion contradictoria: el DOCX mezcla gracia de 15 dias con bloqueo total y eliminacion a 30 dias.
- Express inconsistente: el plan aprobado da 30 dias y limites bajos; el sistema actual la trata como default operativo sin vencimiento claro.
- Packs como producto vs licencia: si se mezclan en `Licencia.limites` sin historial propio, sera dificil renovar, reembolsar o auditar packs.
- Marketplace actual vende assets; licencias requieren entrega de derechos, no descargas.
- Equipo toca permisos finos por EDT y locks; no debe implementarse como simple rol.
- Conecta queda definido como usuario-usuario bajo empresa activa; el riesgo principal pasa a ser no conceder permisos implicitos sobre proyectos/EDT/presupuestos y respetar cupos/regla de 30 dias server-side.
- Reportes con marca de agua deben aplicarse server-side en reporting, no solo ocultarse en UI.
- Los precios del DOCX difieren del catalogo actual en codigo; hay que elegir fuente oficial antes de sembrar productos.

## 8. Recomendacion de arquitectura

Mantener separadas estas responsabilidades:

- `Licencia`: plan base vigente de la empresa.
- `Derecho SaaS`: pack o modulo comprado, con vigencia, origen de compra y estado.
- `MarketplaceProduct`: oferta comercial vendible.
- `MarketplaceOrderItem`: evidencia de compra.
- `Delivery SaaS`: proceso idempotente que convierte compra confirmada en licencia o derecho.
- `Capability resolver`: servicio server-side que decide acceso real combinando licencia + derechos.

Esta separacion evita que Marketplace se convierta en motor de permisos directo y conserva el principio enterprise: backend unico, validacion server-side, trazabilidad por empresa y rollback limpio.

## 9. No interferencia BIM y baseline clasico

Este plan:

- No requiere BIM.
- No activa UX BIM.
- No crea dependencias hacia BIM.
- No toca Docker, Coolify, CI/CD, staging ni produccion.
- No modifica contratos API actuales.
- No altera auth, tenant, EDT, presupuestos, cronogramas ni datos.
- No reabre el baseline `TASK-1807`; solo documenta una ruta futura de adecuacion comercial.
