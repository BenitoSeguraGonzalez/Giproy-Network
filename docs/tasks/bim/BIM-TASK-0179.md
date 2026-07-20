# BIM-TASK-0179 - Escala del feed colaborativo CDE

Fecha: 2026-07-20
Estado: Cerrada localmente; repeticion beta pendiente
Modo: GIPROY BIM

## Objetivo

Certificar sobre PostgreSQL dedicado que el feed colaborativo mantiene cursor,
limite, aislamiento tenant/proyecto y latencia local controlada con un corpus de
100.000 eventos, sin usar ni alterar la base operativa.

## Criterios verificables

- Base obligatoriamente terminada en `_test` y distinta de la operativa.
- 100.000 eventos BIM sinteticos y pagina incremental acotada a 100.
- Evento senuelo de otra empresa situado entre cursor y pagina, nunca expuesto.
- Uso del indice `ix_bim_cde_collaboration_events_project_cursor` demostrado
  mediante `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)`.
- Sesenta lecturas end-to-end del servicio con p95 local menor o igual a 150 ms.
- Eliminacion de todo el corpus, empresas, proyectos y usuario temporales.

## Resultado

`BIM_CDE_SCALE_OK events=100000 samples=60 page=100 p95_ms=1.939
max_p95_ms=150.000 index=ix_bim_cde_collaboration_events_project_cursor
tenant_isolation=true cursor=true`

El p95 observado utiliza solo el entorno local y no se presenta como SLO de
Internet. La evidencia remota se mantiene separada en `BIM-TASK-0178`.

## Validacion

- `py_compile`: correcto.
- Pruebas focales de percentil y recorrido de plan: 3 correctas.
- PostgreSQL real: 100.000 eventos, 60 muestras y pagina de 100 correctos.
- Indice compuesto, cursor monotono y aislamiento cruzado: correctos.
- Cleanup reversible: correcto.

## No interferencia clasica

Solo se agregan tooling y documentacion BIM. No cambian endpoints, modelos,
migraciones, frontend, datos ni contratos de GiProy Clasico.

## Limite declarado

La capacidad local queda certificada. H03 sigue parcial hasta repetir el probe
contra beta con dos usuarios reales y recopilar latencia de red desplegada.

## Rollback

Eliminar el validador, sus pruebas y referencias documentales. No existe cambio
de producto, esquema o runtime que revertir.

## Porcentaje

Paridad: 88,33%. Programa: 53/61 slices, 86,89% realizado y 13,11% pendiente.
