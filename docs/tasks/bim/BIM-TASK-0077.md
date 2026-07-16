# BIM-TASK-0077 - Arbol, tabla y busqueda sincronizados

Estado: Cerrada localmente

## Objetivo

Permitir localizar y seleccionar elementos BIM por estructura, clase, nivel,
sistema, GUID, nombre y propiedades sin limitar el resultado a la precarga.

## Implementacion

- Endpoint BIM aditivo `/projects/{id}/elements/search` con tenant, proyecto,
  version, texto, pagina y tamano de pagina acotado a 200.
- Busqueda servidor sobre GUID, nombre, clase IFC, nivel, sistema,
  clasificacion, descripcion y JSON de propiedades.
- `BimTreePanel` se convierte en explorer compacto con vistas arbol/tabla,
  agrupacion por estructura/nivel/clase/sistema y paginacion de 100 filas.
- Arbol, tabla, seleccion del viewer e inspector comparten el mismo elemento.
- Una seleccion Fragments por GUID no precargado se resuelve mediante el nuevo
  endpoint y actualiza el contexto global.
- La seleccion activa se fija en el explorer aunque quede fuera de la pagina.

## Validacion

- 225 elementos backend: tres paginas 100/100/25 y busqueda en propiedad JSON.
- Endpoint HTTP feature-gated y tenant-scoped: OK.
- Harness frontend con 1.005 elementos: paginas, busqueda por propiedad,
  arbol/tabla, seleccion por teclado e inspector sincronizado: OK.
- Playwright desktop/mobile sin overflow de documento: OK.
- Suite focal: 60 tests BIM pasan; dos warnings SQLAlchemy conocidos.
- Build Vite, smoke BIM y anti-BIM: OK.

## No interferencia clasica

- Endpoint y componentes dentro del dominio BIM existente.
- El contrato anterior de listado de elementos se conserva sin cambios.
- Sin migracion, auth, tenant, rutas clasicas o cambios en TASK-1807.

## Rollback

Retirar endpoint/cliente paginado y restaurar el explorer anterior; la lista BIM
existente de 120 elementos continua operativa y no requiere rollback de datos.
