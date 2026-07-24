# Auditoria global de alcanzabilidad adaptativa

Fecha: 2026-07-24

Estado: IMPLEMENTED_AND_AUTOMATED_PENDING_PHYSICAL_ROUTE_WALK

## Motivo

La primera certificacion fisica de Proyectos demostro que comprobar solamente
la ausencia de overflow del documento produce falsos positivos: una superficie
puede estar recortada por un ancestro y seguir sin aumentar `scrollWidth` o
`scrollHeight` global.

## Universo revisado

- 38 rutas protegidas registradas en `AppRouter`.
- 40 archivos de pagina.
- 166 superficies JSX entre paginas y componentes Classic/BIM.
- Shell, paginas, workspaces, tablas anchas, modales y paneles BIM.
- Perfiles: 1920x1080, Windows escalado 1536x864, zoom 200%, HiDPI
  2560x1440, Lenovo Tab P12 horizontal 1472x820 CSS y vertical 920x1472 CSS.

Grupos cubiertos:

- Inicio y Dashboard.
- Proyectos, gestor, EDO, EDT, Datos, Stakeholders, Presupuesto,
  Desagregacion, Formula, Cronogramas y Gantt.
- Precios Unitarios, Bases, Subcategorias, APUs y Recursos.
- Servicios, Community y Transferencias.
- Marketplace, producto, pedido y dashboards comprador/vendedor/admin.
- Settings y todas las rutas de Administracion Global.
- Workspace BIM y suites de planificacion, CDE, campo, costes, as-built,
  commissioning, entrega, operaciones e integraciones.

## Hallazgos aplicados

### P0 - El shell podia hacer inaccesible una pagina completa

`AppLayout` ocultaba overflow y delegaba totalmente el scroll en cada pagina.
Una sola raiz sin scroll propio quedaba recortada. Se sustituyo el wrapper
`contents` por un viewport real con altura de contenedor, `min-height: 0`,
scroll bidireccional, overscroll contenido y pan tactil. La clave de tenant se
conserva, por lo que cambiar de empresa sigue remontando todo el contenido.

### P1 - Superficies operativas anchas sin scroll horizontal

- Portafolio Proyectos: corregido en `TASK-2042`.
- Editor de lineas APU dentro de Presupuesto: el viewport vertical pasa a ser
  bidireccional y admite pan tactil.
- Vista legacy de Proyectos: recibe el mismo contrato para evitar reintroducir
  el fallo si cambia el selector de landing.

### P1 - Las pruebas confundian ausencia de overflow con alcanzabilidad

El harness del shell genera ahora contenido de 1400 px y 36 filas, exige que el
viewport tenga overflow real, desplaza hasta el final y verifica geométricamente
que el ultimo elemento queda dentro de pantalla. Si una tabla supera el ancho,
la prueba cambia `scrollLeft` y exige desplazamiento efectivo.

### P1 - No existia un gate de inventario transversal

`audit-adaptive-scroll-contracts.mjs` extrae las rutas protegidas y recorre las
superficies JSX. El build falla si:

- desaparece el viewport seguro de `AppLayout`;
- el inventario baja de 35 rutas protegidas;
- aparece una anchura minima directa de 600 px o mas sin un ancestro de scroll
  horizontal dentro de su superficie.

El gate se ejecuta al principio de `smoke:adaptive-all`.

## Evidencia

- Contrato global: 38 rutas y 166 superficies, OK.
- Alcanzabilidad en navegador, seis perfiles: OK.
- Formula desktop/tablet horizontal/tablet vertical: OK.
- Servicios y Transferencias: OK.
- Gantt Classic: OK, incluidas 1326 comprobaciones de puntero/scroll/escala.
- BIM Workspace V2 y suites funcionales BIM: OK.
- Build Vite: OK.
- Baseline enterprise con frontend y aislamiento tenant: OK.
- Detector Impeccable: tres avisos preexistentes del navbar; dos son falsos
  positivos de estados `hover` y uno corresponde al acento de marca existente.
  Ninguno afecta alcanzabilidad ni fue introducido por esta correccion.

## Limite de la automatizacion

La automatizacion impide que una pagina completa vuelva a quedar inaccesible y
protege tablas con anchura minima declarada. No sustituye una inspeccion humana
de ergonomia, legibilidad o calidad del gesto en hardware real. La promocion a
produccion sigue requiriendo recorrer las rutas con una Tab P12 fisica y datos
representativos; una incidencia ya no se tratara como parche aislado, sino como
fallo del gate correspondiente.

## Rollback

Desactivar la release o revertir el commit de esta auditoria. No existen cambios
de backend, base de datos, permisos, licencias ni contratos de negocio.
