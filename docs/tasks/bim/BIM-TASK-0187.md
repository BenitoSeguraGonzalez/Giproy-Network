# BIM-TASK-0187 - Soporte interno IFC4.3 con corpus oficial

Fecha: 2026-07-20
Estado: Cerrada en beta controlada
Modo: GIPROY BIM

## Objetivo

Cerrar la brecha tecnica IFC4.3 del pipeline BIM mediante soporte explicito de
`IFC4X3_ADD2`, corpus oficial y ejecucion completa del job de importacion.

## Alcance ejecutado

- `IFC4X3_ADD2` pasa a schema soportado junto con IFC2X3 e IFC4.
- Se incorpora `Building-Architecture.ifc` del corpus PCERT oficial de
  buildingSMART, bajo CC BY 4.0 y checksum fijado.
- El registro valida procedencia, bytes, checksum, 383 entidades, un storey y
  12 elementos importables.
- El job asyncrono importa el archivo, persiste version y reporte de calidad
  con `schema_status=supported`.
- Schemas futuros desconocidos conservan warning `partially_supported`.
- `certification_claimed` permanece siempre en `false`.

## Validacion

- Calidad, corpus y job IFC: 15 pruebas correctas.
- `IfcImporter` convierte el IFC4.3 oficial a 17.320 bytes Fragments dentro
  del corpus completo de seis datasets.
- Corpus Fragments IFC2X3/IFC4/IFC4X3_ADD2: seis datasets correctos.
- Expediente de conformidad: IFC pasa a `verified_internal`.
- Certificacion IFC por producto/version y auditoria ISO siguen externas.
- Backend beta desplegado: imagen
  `sha256:fc32aaee43dab17b54ce9369af47410d6c75f3b8799eb67ffd01c11ccd5d0f04`.
- Probe remoto: `IFC4X3_REMOTE_OK schema=IFC4X3_ADD2 status=supported
  entities=148 physical=10`.
- Home HTTP 200, CDE sin autenticar 401, allowlist `1,3` y Enterprise activa
  para ambas empresas.

## No interferencia clasica

No se modifican GiProy Clasico, frontend, auth, tenant, contratos clasicos ni
PostgreSQL. El cambio vive en servicio y fixtures BIM.

## Rollback

Retirar `IFC4X3_ADD2` del baseline, el fixture/manifest, pruebas y referencias.
En beta restaurar el archivo desde
`deploy/backups/bim-ifc4x3-20260720-191715` y la imagen
`giproy-beta-backend:bim-ifc4x3-predeploy-20260720-191715`. No hay migracion
ni datos productivos que revertir.

## Porcentaje

Implementacion tecnica autorizada: 61/61, 100%. Programa de liberacion:
60/61, 98,36%; Gate E, certificaciones y Gate K permanecen externos.
