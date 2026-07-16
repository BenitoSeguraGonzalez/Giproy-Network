# BIM-TASK-0093 - Persistencia de actividades y vinculos 4D

Estado: Cerrada localmente

## Resultado

- Migracion `de2011a1b2c3` agrega snapshots de actividad y propuestas 4D.
- Snapshot identifica fuente, referencia, revision, codigo, nombre y rango.
- Vínculo conserva version BIM, elemento, actividad, tipo y trazabilidad.
- Duplicados vigentes y cruces de empresa se bloquean explicitamente.

## Validacion

- Migracion aditiva y encadenada: OK.
- Suite BIM acumulada: `98 passed`.

## Rollback

Downgrade elimina primero propuestas y despues snapshots. No toca cronogramas.
