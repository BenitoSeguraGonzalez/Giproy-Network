# BIM-TASK-0137 - Nivelacion CPM reversible por revision

Estado: Cerrada localmente

## Objetivo

Completar el motor de nivelacion de recursos 4D sin modificar actividades ni
cronogramas clasicos y preservando la independencia entre revisiones de un
mismo proyecto.

## Cambios

- Migracion aditiva `de2026a1b2c3` y tabla BIM de escenarios inmutables.
- Nivelacion determinista por capacidad diaria sobre snapshots y asignaciones
  BIM, con dependencias FS, SS, FF y SF.
- Resultado antes/despues, actividades desplazadas, sobrecargas, checksum y
  version de algoritmo persistidos.
- Gobierno `proposed/approved/rejected/superseded` con aprobacion activa unica.
- Trazabilidad explicita por `proyecto_id`, `project_revision` y
  `project_root_code`.

## Aislamiento de revisiones

Cada revision clasica es una fila `Proyecto` distinta. El servicio exige que
linea base, actividades, recursos y asignaciones pertenezcan al mismo
`proyecto_id`; compartir `codigo_root` no concede acceso cruzado. Una prueba
crea R2 y R3 del mismo root y verifica que un recurso R3 no puede nivelar R2.

## Validacion

- Suite focal y acumulada: `41 passed`.
- `py_compile`: OK.
- Alembic: `de2026a1b2c3` reconocido como cabeza BIM.
- PostgreSQL real `giproy_bim_test`: upgrade, downgrade, `TIMESTAMPTZ`,
  `project_revision` e indice unico parcial: OK.
- SQLite se utiliza solo en pruebas unitarias efimeras, no como base operativa.
- Baseline enterprise con frontend: OK.

## No interferencia clasica

No se modifican tablas, endpoints, contratos ni datos de Cronograma, EDT, APU
o Presupuesto. Los escenarios BIM son derivados, aislados y descartables.

## Rollback

Ejecutar downgrade de `de2026a1b2c3` y retirar endpoints, schema, modelo y
servicio de nivelacion. Las lineas base y fuentes clasicas permanecen intactas.

