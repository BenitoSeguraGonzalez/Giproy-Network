# Despliegue beta - interfaz adaptativa Classic y BIM

Fecha: 2026-07-24

Estado: BETA_DEPLOYED_PENDING_PHYSICAL_DEVICE_CERTIFICATION

## Version desplegada

Version de aplicacion: `3.1.0-beta.2` (`TASK-2046`). Coincide en login,
cabecera persistente y `/version.json`. Commit funcional `ee42976`; imagen
frontend `sha256:8f12b1fcd80fae8de2472265bd45c35d60db614feeffff33ae6996b05d877ec3`.

- Rama: `feature/adaptive-ui-p12`.
- Commit de aplicacion: `00907294b6a14d3f1259e96bda4bd0e307183be0`.
- Release del servidor: `/home/benito/docker/apps/giproy-release-0090729`.
- Host beta: `https://giproy.excomconsultores.com`.
- Imagen backend: `sha256:6d4855ab1b28988bfb67e0afa2819063e1174d3d45d793bb61b192560fc9db85`.
- Imagen frontend: `sha256:fcccb1a07964687dc7dad104f1eb1674b7d326ceea39512996dd28a709d63182`.

El paquete se genero con `git archive` desde el commit indicado. En el
servidor se normalizaron los finales CRLF de los scripts `deploy/scripts/*.sh`
antes de ejecutarlos con Bash; no se modifico codigo de aplicacion.

## Activacion

- `VITE_ADAPTIVE_UI_ENABLED=true`.
- Modulos: `shell`, `project-structure`, `desagregacion`,
  `formula-polinomica`, `presupuesto`, `apus`, `cronogramas`, `gantt` y `bim`.
- No se cambiaron contratos backend, permisos, licencias, tenants ni gates BIM.
- Alembic se ejecuto sobre el esquema existente sin migraciones nuevas de esta
  adecuacion.

## Controles previos

- Suite adaptativa global, Gantt Classic, BIM Workspace V2, seguridad de
  despliegue y build Vite: OK.
- Baseline enterprise con frontend: OK.
- `.env` real con permisos `600`, fuera de Git y sin placeholders sensibles.
- `SECRET_KEY`, `POSTGRES_PASSWORD` y `RUC_REVIEW_ENCRYPTION_KEY` presentes,
  robustos y separados entre si.
- Derivacion Fernet RUC: OK. Registros cifrados existentes: 0; fallos: 0.
- Secretos ausentes de assets publicos y logs: OK antes y despues del deploy.

## Respaldo y recuperacion

Directorio protegido:

`/home/benito/docker/apps/giproy-beta/deploy/backups/20260724-adaptive-0090729`

Contiene:

- `deploy.env.predeploy` con permisos `600`.
- `source-predeploy.tgz` del despliegue anterior.
- `giproy-beta-20260724-133256.sql.gz` del PostgreSQL anterior.

Rollback visual inmediato, sin datos ni migraciones:

1. Definir `VITE_ADAPTIVE_UI_ENABLED=false` en el `.env` de la release.
2. Reconstruir y recrear exclusivamente el frontend con el Compose beta.
3. Comprobar salud y rutas publicas.

Rollback total:

1. Restaurar `source-predeploy.tgz` en un directorio de release separado.
2. Instalar `deploy.env.predeploy` como `deploy/.env` con permisos `600`.
3. Reconstruir y levantar el Compose beta con nombre de proyecto
   `giproy-beta`.
4. Restaurar el SQL solo si una verificacion demuestra dano de datos; esta
   release no introduce cambios de datos.

## Verificacion posterior

- Frontend, backend y PostgreSQL: `healthy`.
- Portada HTTPS: HTTP 200.
- OpenAPI HTTPS: HTTP 200.
- Flags de todos los modulos presentes en el bundle servido.
- Coincidencias criticas en logs (`traceback`, `uncaught`, `fatal`, `panic`): 0.
- Secretos en bundle o logs: 0.

## Certificacion pendiente

La simulacion cubre Full HD, Windows HiDPI/escalado, zoom 200% y Lenovo Tab
P12 horizontal/vertical. El cierre final requiere ejecutar
`npm run certify:lenovo-tab-p12` con la tablet fisica conectada por ADB y hacer
la inspeccion humana de Classic y BIM con datos representativos. Hasta entonces
la release permanece en beta y no debe promoverse a produccion.

## Incidencias de certificacion fisica

- `TASK-2042`: el primer recorrido en Lenovo Tab P12 detecto recorte y bloqueo
  de scroll en el listado de Proyectos de la empresa Santiago Bermeo. Se
  implemento scroll interno vertical/bidireccional sin escalado global; queda
  pendiente repetir la comprobacion tras desplegar el hotfix.
- `TASK-2043`: la respuesta se eleva a contrato global. El shell ofrece
  alcanzabilidad de respaldo y el gate automatizado cubre 38 rutas protegidas y
  166 superficies JSX, con pruebas reales de final de contenido y scroll
  horizontal. Commit `eacce57` desplegado; imagen frontend
  `sha256:fdfa1c020a80c53679e257b243a49d03593f7a26ca592ff9f987686cb0471309`
  saludable. Pendiente continuar el recorrido fisico completo.
- `TASK-2044`: la tablet no reflejo el segundo despliegue aunque el servidor ya
  entregaba el bundle nuevo. Se identifico falta de revalidacion explicita del
  indice SPA. La politica `no-store` para HTML, fallback y manifiesto, junto a
  assets con hash inmutables, ya esta desplegada y verificada por HTTPS.
- `TASK-2045`: se elimina el literal `V3.0`, se publica la release visible
  `3.1.0-beta.1` y el flujo futuro bloquea despliegues sin incremento de version.
- `TASK-2046`: se corrige la ubicacion del indicador, el recorte del footer en
  viewports bajos y la ausencia de actualizacion automatica en sesiones abiertas.
  La beta HTTPS supera el gate visual en escritorio y tablet; queda pendiente
  la confirmacion fisica en Lenovo Tab P12.
