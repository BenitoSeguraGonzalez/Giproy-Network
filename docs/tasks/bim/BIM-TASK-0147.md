# BIM-TASK-0147 - Documentos CDE disponibles en Campo

Estado: Cerrada localmente

## Objetivo

Dar acceso operativo de escritorio a los documentos CDE autorizados desde el
area Campo del Workspace BIM V2, sin duplicar almacenamiento, permisos ni
versiones y sin declarar soporte movil u offline fuera del contrato vigente.

## Cambios

- Panel de solo lectura `Documentos` como primera herramienta de Campo.
- Listado de revisiones vigentes obtenido mediante el cliente BIM y el endpoint
  CDE existente, con ACL de vista aplicada por backend.
- Busqueda por codigo, titulo o archivo y filtro por categoria.
- Revision, version, tamano y descarga de la revision vigente, respetando el
  permiso documental `download` existente.
- Harness aislado y smoke DOM con descarga verificable en viewport util
  `1920x900` y expansion responsive `2560x1300`.

## Criterios verificados

- Campo no crea una segunda fuente documental ni evita la ACL CDE.
- La revision mostrada y descargada es la revision vigente autorizada.
- El panel no escribe documentos, Cronograma, Proyectos ni datos clasicos.
- No se agrega cache, outbox, sincronizacion offline, PWA ni superficie movil.
- GiProy Clasico no importa ni monta componentes BIM.

## Validacion

- Build Vite: OK.
- Smoke focal y workspace BIM V2 agregado, 14 scripts: OK.
- Playwright 1920x900 y 2560x1300: OK; sin overflow, solapamientos ni errores
  de consola.
- Contratos CDE/ACL sobre PostgreSQL real: `8 passed`.
- Validador PostgreSQL reversible hasta `de2032a1b2c3`: OK; sin migracion nueva.
- Baseline enterprise con frontend y anti-BIM: OK.
- Matriz: D03 completa, `58,33%`.

## Rollback

Retirar el panel, harness, smoke, entrada `Documentos` de Campo y metodo cliente
si deja de tener consumidores. No hay downgrade de base de datos. El CDE,
GiProy Clasico y TASK-1807 permanecen intactos.
