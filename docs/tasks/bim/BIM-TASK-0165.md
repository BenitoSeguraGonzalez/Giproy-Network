# BIM-TASK-0165 - Ensamblado gobernado del dossier digital

Fecha: 2026-07-16
Estado: Cerrada localmente
Modo: GIPROY BIM

## Objetivo

Iniciar G04 con un manifiesto digital inmutable que reúna las fuentes BIM de
entrega ya aceptadas sin copiar ni sustituir sus datos maestros.

## Alcance ejecutado

- Migración aditiva `de2049a1b2c3` para dossiers tenant-aware y versionados.
- Ensamblado bloqueado hasta disponer de as-built, punch, sistemas, activos y
  revisiones CDE vigentes y coherentes.
- Manifiesto canónico con IDs, revisiones, GlobalIds, locks y checksums, más
  huella SHA-256 propia.
- Herramienta `Dossier digital` dentro de Entrega BIM V2.

## Validación

- 4 tests focales y `py_compile`: correctos.
- PostgreSQL reversible hasta `de2049`: correcto.
- Build, 31 smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline:
  correctos.

## No interferencia clásica

No se modifican documentos, Proyectos, Cronogramas ni datos clásicos. El
dossier referencia exclusivamente contratos BIM y revisiones del CDE BIM.

## Rollback

Ocultar BIM, retirar `Dossier digital` y revertir `de2049a1b2c3`; las fuentes
as-built, punch, commissioning y CDE permanecen intactas.

## Resultado

G04 queda parcial hasta incorporar decisión y revalidación formal. Paridad:
78,33%. Programa: 39/61 slices, 63,93% realizado y 36,07% pendiente. Sin deploy.
