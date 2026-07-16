# BIM-TASK-0161 - Aceptacion de modelo as-built BIM

Fecha: 2026-07-16
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Completar G01 con un workflow auditable para presentar, revisar y aceptar una
version BIM inmutable como modelo as-built del proyecto.

## Alcance ejecutado

- Migracion aditiva `de2045a1b2c3` para `bim_as_built_acceptances`, con una
  unica aceptacion vigente por proyecto y referencia restrictiva a la version.
- Snapshot de version, archivo, checksum IFC, estado de calidad, criterios y
  declaracion; la decision revalida version, calidad y checksum.
- Workflow presentado/aceptado/rechazado/sustituido con lock optimista,
  identidad de responsables y marcas temporales.
- Endpoints tenant-aware y nueva area `Entrega` del workspace BIM V2.

## Validacion

- 3 tests focales y `py_compile`: correctos.
- PostgreSQL upgrade/downgrade reversible hasta `de2045`: correcto.
- Build, 28 smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline:
  correctos.

## No interferencia clasica

No se modifican modelos, rutas, contratos, pantallas ni datos de GiProy
Clasico. El area Entrega solo se monta dentro del workspace BIM ya protegido.

## Rollback

Ocultar BIM, retirar el area `Entrega` y revertir `de2045a1b2c3`; las versiones
BIM fuente y todos los dominios clasicos permanecen intactos.

## Resultado

G01 completa. Paridad: 75,00%. Programa: 35/61 slices, 57,38% realizado y
42,62% pendiente. Sin deploy.
