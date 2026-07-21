# BIM-TASK-0188 - Adaptador controlado Primavera P6 XER

Fecha: 2026-07-20
Estado: Cerrada localmente; despliegue beta pendiente
Modo: GIPROY BIM

## Objetivo

Habilitar preview y exportacion de un subconjunto declarado de Primavera P6
XER, sin persistencia durante el parseo, sin escribir Cronograma clasico y sin
afirmar certificacion contra Oracle P6.

## Supuestos, incertidumbres y tradeoffs

- XER es un formato propietario de Oracle; la implementacion usa solo tablas y
  columnas publicadas en el mapa oficial de importacion/exportacion.
- El fixture es propio y no sustituye un archivo exportado por una instancia P6
  licenciada ni una prueba de reimportacion en el producto objetivo.
- Se admite exactamente un proyecto por preview. Oracle permite archivos
  multiproyecto, pero rechazarlos evita mezclar scopes y referencias externas.
- `clndr_data`, baselines, UDF, riesgos, pasos y tablas no representadas se
  reportan como warnings; no hay perdida silenciosa.

## Alcance ejecutado

- Parser tabular con limites de 50 MiB, 500.000 filas y 1 MiB por campo.
- Decodificacion UTF-8 con fallback Windows-1252, cabecera `ERMHDR`, marcadores
  `%T/%F/%R/%E`, campos unicos y referencias controladas.
- Mapeo de `PROJECT`, `CALENDAR`, `PROJWBS`, `TASK`, `TASKPRED`, `RSRC`,
  `RSRCRATE` y `TASKRSRC` al contrato canonico BIM.
- Exportacion determinista del mismo subconjunto y round-trip interno.
- Endpoints BIM protegidos `p6-xer/import-preview` y `p6-xer/export`.
- Opcion XER en el panel de intercambio existente y descarga `.xer` estable.
- Capacidad XER permanece `conditional` mientras falte round-trip Oracle real.

## Fuentes oficiales

- Oracle XER Import/Export Data Map Guide (Project):
  https://docs.oracle.com/cd/G18294_01/English/Mapping_and_Schema/xer_import_export_data_map_project/xer_import_export_data_map_project.pdf
- Oracle P6 Professional Importing and Exporting Guide:
  https://docs.oracle.com/cd/G18296_01/English/admin/p6_pro_importing_exporting/p6_pro_importing_exporting.pdf
- Oracle Primavera Cloud, import/export P6 XML/XER:
  https://docs.oracle.com/cd/E80480_01/help/en/user/95912.htm

## Validacion local

- `py_compile`: correcto.
- Suite P6 XER/XML/capacidades: 14 pruebas correctas; scheduling completo: 31.
- `npm run build`: correcto; solo warning conocido de chunks grandes.
- `npm run smoke:bim-schedule-interchange`: correcto a 1920x1080.
- `smoke-classic-no-bim-contamination.mjs`: correcto.
- Screenshot: tres formatos sin overflow ni solapamientos.

## No interferencia clasica

No se modifican modelos, tablas, auth, tenant, rutas, cronogramas ni pantallas
clasicas. Preview/export viven bajo router, permisos y workspace BIM. Con BIM
apagado no existe nueva superficie visible.

## Limite pendiente

B02 sigue parcial hasta ejecutar exportacion e importacion contra Oracle P6 con
un corpus autorizado y comparar CPM, calendarios, restricciones, costes y
advertencias. Esta evidencia requiere producto/licencia externa real.

## Rollback

Retirar servicio, dos endpoints, fixture/pruebas y la opcion `p6-xer` del panel.
No hay migraciones ni datos persistidos que revertir.

## Porcentaje

Slice tecnico BIM-TASK-0188: 100% local. Implementacion tecnica autorizada:
61/61, 100%. Liberacion general: 60/61, 98,36%; Gate E, certificaciones,
round-trip Oracle y Gate K siguen externos.
