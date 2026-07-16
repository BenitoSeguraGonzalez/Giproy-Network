# BIM-TASK-0104 - Partes, avance y evidencia de campo 4D

Estado: Cerrada localmente

## Resultado

- Los partes de campo BIM quedan aislados por empresa, proyecto y actividad.
- Avance, cantidad instalada, horas, frente y diario producen un snapshot 4D
  atomico sin modificar Cronograma, EDT, APU ni Presupuesto clasicos.
- Evidencia JPEG, PNG o WebP de hasta 10 MB se valida por tipo, tamano y SHA-256.
- Metadatos y bytes de evidencia se persisten en PostgreSQL `BYTEA`; SQLite se
  conserva solo como prueba unitaria rapida y no certifica persistencia.
- El panel BIM permite registrar el parte y recuperar su evidencia bajo las
  capacidades y fronteras tenant existentes.

## Validacion

- PostgreSQL operacional `giproy_erp` en revision `de2016a1b2c3`: OK.
- PostgreSQL aislado `giproy_bim_test`, upgrade/downgrade/re-upgrade: OK.
- `106` pruebas BIM, build Vite, harness Chrome desktop/movil: OK.
- Anti-BIM, fronteras API, workspace BIM y baseline enterprise: OK.

## Rollback

Downgrade a `de2015a1b2c3` elimina solo partes y evidencias BIM 4D.
