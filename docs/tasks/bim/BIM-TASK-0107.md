# BIM-TASK-0107 - Recursos y capacidad 4D nativos

Estado: Cerrada y validada

## Objetivo

Persistir recursos BIM, asignaciones a actividades, capacidad, demanda y
curvas/histogramas temporales sin duplicar recursos clasicos.

## Resultado

- Recursos y asignaciones 4D persistidos solo en tablas BIM PostgreSQL.
- Referencias clásicas opcionales como snapshot, sin dependencia ni escritura inversa.
- Histograma diario con capacidad, utilización, pico y detección de sobrecarga.
- Panel compacto protegido por el workspace BIM y cliente de dominio API.

## Validación

- `2 passed` focales y `108 passed` en la suite BIM.
- PostgreSQL upgrade/downgrade/re-upgrade certificado hasta `de2017a1b2c3`.
- `npm run build`, guardas API clásicas y smoke positivo BIM en verde.
