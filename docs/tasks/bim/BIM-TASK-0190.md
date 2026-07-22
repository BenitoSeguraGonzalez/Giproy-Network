# BIM-TASK-0190 - Error BIM serializable en la interfaz React

Fecha: 2026-07-22
Estado: Cerrada en beta
Modo: GIPROY BIM

## Objetivo

Eliminar el crash React `#31` producido al intentar renderizar un objeto
`Error` durante la carga del workspace BIM.

## Causa raiz

`useBimProjectWorkspace` guardaba el objeto capturado completo mediante
`setError(err)`. El estado se entregaba a `BimWorkspaceV2`, que lo insertaba
directamente como hijo de un parrafo. React solo admite texto o nodos
renderizables y abortaba la superficie BIM.

## Cambios realizados

- Normalizacion segura de errores JavaScript, Axios y validaciones FastAPI.
- El hook BIM conserva exclusivamente un mensaje textual.
- La shell BIM aplica una segunda defensa antes de renderizar el mensaje.
- Regresiones para `Error`, `detail` textual, `detail` tabular y objeto opaco.

## Validacion local

- Smoke focal BIM workspace: correcto.
- ESLint focal: correcto.
- Build Vite: correcto; solo warning conocido de chunks grandes.
- Baseline enterprise y smoke anti-BIM: correctos.
- Servicios locales frontend/backend y API por tunel: operativos.

## No interferencia clasica

No cambian API, backend, PostgreSQL, auth, tenant, licencias, allowlist ni
componentes clasicos. El nuevo normalizador solo es consumido por el dominio BIM.

## Rollback

Revertir el normalizador y restaurar el manejo previo en el hook y la shell.
No hay migraciones ni datos que revertir.

En beta, restaurar fuentes desde
`deploy/backups/bim-error-react31-20260722-144513` o etiquetar como `beta` la
imagen `giproy-beta-frontend:bim-error-react31-predeploy-20260722-144513` y
recrear solo el frontend.

## Despliegue beta

- Frontend: `sha256:23ffe21a0dbc01edb18140a1695ea61cc1c0ea272a9d5c4c5df9c526b45d0010`.
- Frontend, backend y PostgreSQL: healthy.
- Home beta y local: `200`; API local: `200`; ruta BIM beta anonima: `401`.
- Bundle remoto contiene el fallback textual del workspace BIM.
- Backend y PostgreSQL no se reconstruyeron; no hubo migraciones ni escrituras.

## Porcentaje

Slice BIM-TASK-0190: 100% en beta. Implementacion tecnica autorizada: 61/61,
100%. Liberacion general: 60/61, 98,36%; los gates externos no cambian.
