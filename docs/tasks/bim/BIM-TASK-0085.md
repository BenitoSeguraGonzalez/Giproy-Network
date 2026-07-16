# BIM-TASK-0085 - Cantidades y vinculos 5D

Estado: Cerrada localmente

## Implementacion

- Migracion aditiva `de2008a1b2c3` para propuestas de cantidad 5D BIM.
- Prioridad de fuente: `IfcElementQuantity`, perfil de propiedades y estimacion
  geometrica declarada.
- Cada propuesta conserva GUID, version, cantidad, valor/unidad original,
  valor/unidad presentada, factor, redondeo, regla y destino referencial.
- Aprobacion/rechazo exige motivo y usuario; no escribe en EDT, APU,
  Presupuesto ni cantidades/costos clasicos.
- Panel de preview/propuesta/decision aparece solo con elemento y cantidad real.

## Validacion

- Fuente IFC, unidad m3, redondeo, version, GUID y aprobacion: OK.
- Suite BIM acumulada: `90 passed`.
- Build y smokes BIM/anti-BIM/fronteras API: OK.

## Rollback

Retirar panel, API, servicio y tabla BIM. No hay dato clasico que restaurar.
