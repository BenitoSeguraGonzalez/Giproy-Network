# Plan de avisos y cierre de ciclo de vida de licencias

Fecha: 2026-06-09
Modo: GIPROY CLASICO

## Objetivo

Adecuar el ciclo de vida SaaS de licencias para que cada hito comercial y operativo tenga avisos trazables por email e in-app, y para que la expiracion avance de forma automatizada hacia solo lectura, backup, retirada operativa y recuperacion controlada por superadministrador.

## Estado real de partida

- El backend clasico ya mantiene `licencias`, `empresa_licencias` y `license_events`.
- `run_license_housekeeping_for_company` ya vence licencias activas, marca `read_only_mode` y calcula `grace_ends_at`.
- `/admin-licenses/me` ya expone `license_status`, `access_mode`, `grace_days_remaining` y `license_banner_message`.
- El sistema de comunicados internos ya existe con alcance global/empresa.
- El email real de plataforma no esta implementado; solo existe utilidad mock para recuperacion de password.
- No existe aun una cola idempotente especifica para avisos de ciclo de vida de licencia.
- Las compras Marketplace ya formalizan pedidos `completed` y productos entregados; los productos SaaS pueden declarar vigencia con `product_meta.duration_months`.
- No existe aun automatizacion segura de backup/cuarentena/borrado ni pantalla SaaS de recuperacion.

## Flujo objetivo

1. Compra formalizada:
   - Al formalizarse cualquier compra, se registra aviso transaccional general.
   - Aplica a licencias, packs SaaS, modulos, portales, productos manuales y checkout clasico.
   - El aviso general debe incluir pedido, productos, importe, moneda, metodo de pago cuando exista y entregas realizadas.

2. Compra o renovacion de licencia pagada:
   - Al confirmarse el cobro, se activa o cola la licencia segun politica vigente.
   - Se registra email de bienvenida para el administrador de empresa.
   - Se registra aviso in-app de bienvenida para administradores de empresa.
   - El aviso in-app de bienvenida debe mostrarse una sola vez por administrador y licencia.

3. Fin de compra con vigencia:
   - Cuando un producto comprado tiene fecha de fin, el sistema debe avisar al llegar a esa fecha.
   - Para productos SaaS la fecha puede derivarse de `order.created_at + product_meta.duration_months`.
   - El aviso debe ser distinto al de licencia: `purchase_lifecycle_ended`.
   - Este evento no implica por si mismo borrado de datos de empresa; solo cierre del derecho/producto comprado.

4. Ventana de caducidad de licencia:
   - Siete dias antes de `ends_at`, cada login debe mostrar aviso de caducidad a los usuarios de la empresa.
   - Ese mismo dia se debe enviar email al administrador con fecha de caducidad.
   - La generacion debe ser idempotente para no duplicar emails diarios.

5. Solo lectura:
   - Al superar `ends_at`, la empresa queda en `access_mode=readonly` durante el periodo de gracia.
   - Cada login debe informar fecha limite de disponibilidad de lectura.
   - El mensaje debe indicar que los datos seran borrados pasado el periodo estipulado.
   - Se debe enviar email el dia de entrada en solo lectura y luego cada 5 dias.

6. Dia de cierre:
   - El ultimo dia se notifica por email que se procede al cierre de datos.
   - El sistema genera backup verificable antes de retirar datos de funciones.
   - La empresa queda fuera de operativa normal mediante estado de cuarentena/caducada.
   - La retirada debe ser auditable y reversible desde backup por superadministrador.

7. Recuperacion SaaS:
   - El menu SaaS/Superadministrador debe incluir un apartado de empresas caducadas/backups.
   - Solo superadministrador puede listar, inspeccionar metadata y recuperar backups.
   - Toda recuperacion debe dejar auditoria, usuario ejecutor, motivo y resultado.

## Reglas de seguridad

- No ejecutar borrado fisico sin backup verificado y auditoria previa.
- No mezclar el flujo con BIM ni activar UX BIM.
- No cambiar contratos publicos existentes salvo TASK focal.
- No bloquear login por vencimiento mientras el periodo de solo lectura este activo.
- No eliminar datos runtime locales (`uploads`, dumps, backups) sin instruccion explicita.
- La recuperacion de backups debe ser superadmin-only.

## Arquitectura propuesta

- `license_notification_events`: cola/auditoria idempotente de avisos de licencias y compras.
- `license_notification_acknowledgements`: lectura unica por usuario para avisos in-app criticos.
- Servicio backend `license_notifications` para construir payloads y dedupe keys.
- Servicio email real posterior, con templates versionados.
- Housekeeping diario para:
  - aviso 7 dias antes,
  - entrada en solo lectura,
  - recordatorio cada 5 dias,
  - cierre y backup.
- Area SaaS para backups de empresas caducadas.

## Slices de implementacion

1. Fundacion documental y cola de eventos.
2. Compra formalizada general.
3. Bienvenida por licencia pagada/confirmada.
4. Fin de compra con vigencia.
5. Aviso 7 dias antes de caducidad.
6. Avisos de solo lectura y recordatorios de gracia.
7. Backup/cuarentena automatizados sin borrado fisico irreversible.
8. Pantalla SaaS de recuperacion superadmin.
9. Politica final de purga fisica, solo despues de validar retencion legal/contractual.

## No interferencia BIM

Este plan pertenece al carril clasico SaaS/licencias. No introduce dependencias BIM, no activa UX BIM y no cambia feature flags BIM.
