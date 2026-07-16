# BIM-TASK-0125 - Sustitucion definitiva por Workspace BIM V2

Estado: Cerrada y desplegada en beta

## Objetivo

Aplicar la decision de producto por la que Workspace BIM V2 sustituye a la
experiencia anterior. No deben convivir dos formas de trabajo BIM en el codigo,
el bundle ni la configuracion de despliegue.

## Criterios verificables

- `BimWorkspace.jsx` tiene un unico retorno visual basado en `BimWorkspaceV2`.
- no existe `VITE_BIM_WORKSPACE_V2` ni una rama de layout legacy;
- las importaciones reales siguen disponibles mediante `BimImportJobsPanel`;
- la puerta BIM comercial y por allowlist permanece sin cambios;
- GiProy Clasico pasa el smoke anti-BIM y el baseline TASK-1807;
- rollback disponible restaurando imagen o fuentes respaldadas, no por
  convivencia de implementaciones.

## Alcance

- frontend BIM y guardas focales;
- configuracion de build frontend beta;
- documentacion BIM y changelog.

No modifica backend, PostgreSQL, auth, JWT, tenant, EDT, APUs, Presupuesto,
Cronogramas ni contratos clasicos.

## Validacion local

- `npx eslint src/components/bim/BimWorkspace.jsx`: sin errores; permanecen dos
  warnings preexistentes de dependencias de hooks;
- `npm run smoke:bim-workspace-v2`: OK, incluido WebGL/DOM a 1920x1080;
- `smoke-bim-workspace-positive`: OK;
- `smoke-classic-no-bim-contamination`: OK;
- `npm run build`: OK; `BimTab` baja de aproximadamente 2.26 MB a 265 KB;
- `validate_enterprise_baseline.py --include-frontend`: OK.

## Despliegue beta

- backup previo: `backups/bim-workspace-v2-unique-20260713-191942`;
- imagen previa: `giproy-beta-frontend:backup-before-v2-unique-20260713-191942`;
- se copiaron solo `BimWorkspace.jsx`, Dockerfile y Compose;
- se elimino `VITE_BIM_WORKSPACE_V2` del entorno beta;
- se reconstruyo y recreo exclusivamente el frontend;
- home y chunk BIM publicos responden `200`;
- el bundle contiene `data-bim-workspace-v2` y no contiene firmas legacy;
- frontend, backend y PostgreSQL permanecen saludables.

## Rollback

Restaurar la imagen frontend
`giproy-beta-frontend:backup-before-v2-unique-20260713-191942` o las fuentes del
backup `backups/bim-workspace-v2-unique-20260713-191942`, y recrear
exclusivamente el contenedor frontend. La puerta BIM puede seguir
deshabilitandose por su control de rollout existente.
