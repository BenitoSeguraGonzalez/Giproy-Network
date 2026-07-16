# BIM-TASK-0136 - Gobierno QTO y paquete 5D

Estado: Cerrada localmente

## Objetivo

Completar el flujo de producto QTO/WBS con aprobacion auditable y salida 5D
versionada, sin aplicar cambios automaticos a GiProy Clasico.

## Cambios

- Migracion aditiva `de2025a1b2c3` con estado, decision, control optimista y
  aprobacion activa unica por empresa/proyecto/version BIM.
- Estados `draft/approved/rejected/superseded` y motivo/autor/fecha de decision.
- La aprobacion exige filas QTO y cobertura WBS/coste del 100%.
- Una nueva aprobacion supersede la revision activa sin borrar historial.
- Paquete `giproy_bim_qto_5d_package_v1` disponible solo para la revision
  aprobada activa, con checksum, filas, totales y cobertura.
- Endpoints protegidos de decision y paquete 5D.
- UX QTO con estado, version de lock, motivo, aprobar/rechazar y verificacion
  del paquete 5D.

## Criterios verificados

- Cobertura incompleta no puede aprobarse.
- Una version obsoleta no puede decidirse.
- Solo existe una aprobacion activa por version BIM.
- Una revision superseded deja de producir paquete 5D activo.
- Todo acceso respeta empresa/proyecto y capacidades BIM.
- No existe escritura ni dependencia desde EDT, APU, Presupuesto o Cronograma.

## Validacion

- Suite QTO focal: `5 passed`.
- Suite acumulada scheduling/interoperabilidad/QTO: `31 passed`.
- `py_compile`: OK.
- `alembic heads`: `de2025a1b2c3` reconocido en la rama BIM.
- Build y `smoke:bim-workspace-v2`: OK.
- Playwright QTO 1920x1080: generacion, aprobacion y paquete 5D OK.
- Smoke anti-BIM y baseline enterprise: OK.
- Matriz reproducible: `47,50%`, 17 completas, 23 parciales y 20 ausentes.

## Estado de paridad

A04 pasa a completa. F01 permanece parcial porque este slice no estima precios
ni aplica cantidades a fuentes clasicas.

## Rollback

Ejecutar downgrade de `de2025a1b2c3` y retirar endpoints, schemas, servicio y
controles de gobierno QTO. Los snapshots de `BIM-TASK-0135` permanecen; no se
modifican tablas clasicas.
