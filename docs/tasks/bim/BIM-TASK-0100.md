# BIM-TASK-0100 - Frentes y areas BIM 4D

Estado: Cerrada localmente

## Resultado

- Frentes tenant-aware organizan trabajo por codigo, nombre y proyecto.
- Son entidades BIM aisladas y no modifican EDT ni estructura espacial IFC.
- API y panel compacto permiten crear y consultar frentes reales.

## Validacion

- PostgreSQL `de2014`, pruebas tenant/proyecto y harness responsive: OK.
- Duplicados de codigo por proyecto se bloquean.

## Rollback

Downgrade a `de2013a1b2c3` elimina solo frentes, componentes y escenarios BIM.
