# BIM-TASK-0124 - Workspace BIM V2 ordenado y desplegado

Estado: cerrada localmente y desplegada en beta.

Fecha: 2026-07-13.

## Objetivo

Reordenar la experiencia BIM de producto para eliminar el apilamiento de
paneles y mantener el visor como superficie principal. La sustitucion definitiva
del workspace anterior queda trazada en `BIM-TASK-0125`.

## Slice implementado

- activacion beta inicial controlada durante la transicion a V2;
- seis workspaces: Visor, Coordinacion, Planificacion 4D, Produccion, Campo e
  Informes;
- Administracion BIM separada y restringida a superadministracion;
- maximo de un panel izquierdo y uno derecho, con herramienta contextual unica;
- drawer Timeline/Gantt minimizable para Planificacion y Produccion;
- busqueda real de elementos, GlobalId, modelos/versiones y vinculos;
- persistencia por proyecto de workspace, herramienta, visibilidad y dimensiones;
- layout redimensionable, reset, atajos `Ctrl+K` y `Alt+1..6`;
- estados vacio/error aislados y guarda de pantalla minima 1920 x 1080;
- Informes con superficie principal propia y preview 3D opcional.

## No interferencia clasica

- no se cambiaron APIs, backend, auth, tenant, datos ni contratos clasicos;
- `Proyectos.jsx` conserva la puerta BIM existente sin modificaciones;
- desde `BIM-TASK-0125`, V2 es la unica implementacion de workspace y el
  rollback se conserva fuera del bundle mediante fuente e imagen respaldadas;
- el baseline TASK-1807 y sus guardas no se modificaron.

## Validaciones

- `npm run build`: OK;
- `npm run smoke:bim-workspace-v2`: OK;
- `smoke-bim-workspace-positive.mjs`: OK;
- `smoke-classic-no-bim-contamination.mjs`: OK;
- `validate_enterprise_baseline.py --include-frontend`: OK;
- Playwright 1920 x 1080: canvas WebGL no vacio, viewer >= 65%, sin overflow,
  tabs/drawer/busqueda operativos;
- Playwright 1366 x 768: workspace no montado y aviso de resolucion visible.

## Despliegue beta

- backup: `backups/bim-workspace-v2-20260713-185457`;
- imagen anterior: `giproy-beta-frontend:backup-bim-workspace-v2-20260713-185457`;
- reconstruccion y recreacion exclusivamente del frontend;
- frontend, backend y PostgreSQL saludables;
- home 200, chunk BIM 200, marcador V2 presente y endpoint protegido 401;
- acceso runtime: empresas 1 y 3 habilitadas; empresa 2 denegada.

## Rollback

1. restaurar la imagen frontend etiquetada; o
2. restaurar los archivos del backup fechado y reconstruir solo frontend.

Porcentaje de finalizacion del slice: 100%.
