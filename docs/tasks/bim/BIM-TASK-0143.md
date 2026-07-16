# BIM-TASK-0143 - ACL documental granular BIM

Estado: Cerrada localmente

## Objetivo

Aplicar permisos granulares a los documentos del CDE BIM sin modificar auth,
JWT, roles clasicos ni la experiencia de GiProy Clasico.

## Cambios

- Migracion aditiva `de2030a1b2c3` con concesiones por documento y usuario.
- Permisos jerarquicos para ver, descargar, revisar y administrar.
- Compatibilidad opt-in: sin concesiones se conserva el acceso BIM previo; tras
  crear la primera ACL, el documento permanece restringido aunque se revoquen
  todas las concesiones.
- Gobierno limitado al creador, superadmin o usuario con permiso de administrar.
- ACL aplicada a listado, historial, descarga, nueva revision y archivo.
- Gestion de acceso integrada en `Documentos` del Workspace BIM V2; un usuario
  sin gobierno ACL no recibe controles administrativos.

## Criterios verificados

- Descargar implica ver, revisar implica descargar y administrar implica todos
  los permisos.
- La revocacion total no vuelve a publicar el documento por accidente.
- Un usuario sin permiso no lista, consulta, descarga, revisa ni archiva.
- Empresa/proyecto no pueden conceder acceso fuera de su frontera tenant.
- No se cambian usuarios, roles, documentos ni contratos clasicos.

## Validacion

- Suite ACL y CDE: `8 passed`; regresion BIM acumulada: `43 passed`.
- PostgreSQL real: upgrade/downgrade `de2030a1b2c3`, `BOOLEAN` y
  `TIMESTAMPTZ`: OK.
- Build, Playwright 1920x1080, workspace BIM V2 y smoke anti-BIM: OK.
- Baseline enterprise con frontend: OK.
- Matriz: C04 completa, `53,33%`.

## Rollback

Ejecutar downgrade `de2030a1b2c3` y retirar endpoints, servicio, cliente,
controles ACL y harness. Los documentos CDE y todos los dominios clasicos
permanecen intactos.
