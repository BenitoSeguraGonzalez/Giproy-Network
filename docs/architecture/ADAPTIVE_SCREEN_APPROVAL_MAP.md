# Mapa de aprobacion visual adaptativa GiProy

Estado: PROPUESTA PARA APROBACION  
Alcance: GiProy Classic + BIM, todas las rutas, espacios internos y overlays  
Regla de trabajo: ninguna pantalla se modifica sin presentar antes su analisis y recibir confirmacion

## Que significa pantalla

Una pantalla es cualquier composicion que cambie de forma sustancial la tarea,
la jerarquia, la navegacion o el propietario del desplazamiento. Por tanto, una
ruta con pestañas o workbenches contiene varias pantallas. Los modales,
drawers, popovers y estados de error se certifican con su pantalla propietaria
y tambien mediante los contratos globales de overlays.

Cada identificador de este documento recorrera estos estados cuando apliquen:

1. carga;
2. datos representativos;
3. vacio;
4. busqueda sin resultados;
5. error recuperable;
6. formulario con validacion;
7. modal, menu, selector, tooltip o drawer abierto;
8. contenido minimo y contenido largo;
9. inicio y final de cada scroll;
10. teclado virtual, cambio de orientacion y retorno a la orientacion inicial.

## Perfiles obligatorios

| Perfil | Viewport CSS | DPR | Entrada |
|---|---:|---:|---|
| Windows FHD 100 % | 1920x1080 | 1 | raton y teclado |
| Windows FHD 125 % | 1536x864 | 1.25 | raton, teclado y touch opcional |
| Windows FHD 150 % | 1280x720 | 1.5 | raton y teclado |
| Windows 4K 200 % | 1920x1080 | 2 | raton, teclado y touch opcional |
| Tablet Full HD horizontal | 1280x720 | 1.5 | touch |
| Tablet Full HD vertical | 720x1200 | 1.5 | touch |
| Tablet 2K horizontal | 1280x800 | 2 | touch |
| Tablet 2K vertical | 800x1280 | 2 | touch |
| Lenovo P12 horizontal | 1472x820 | 2 | touch |
| Lenovo P12 vertical | 920x1372 | 2 | touch |

Los breakpoints se decidiran por espacio util del contenedor, contenido y
metodo de entrada. La resolucion fisica no se usara como sustituto del viewport
CSS y no se aplicara zoom global para encoger la aplicacion.

## G00 - Contratos globales, aprobacion previa a las pantallas

| ID | Superficie | Que se analizara y adecuara |
|---|---|---|
| G00.1 | Shell protegido — VERIFICADA LOCALMENTE | cabecera, marca, empresa, version, acciones, alto util y contenido principal |
| G00.2 | Navegacion global — VERIFICADA LOCALMENTE | retorno, rutas, menus, foco, teclado, touch y cierre exterior |
| G00.3 | Footer y version — VERIFICADA LOCALMENTE | presencia, posicion, no solapamiento y coincidencia con `version.json` |
| G00.4 | Sistema tipografico — VERIFICADA LOCALMENTE | tamaño legible sin escalado global, truncado, wrapping y numeros tabulares |
| G00.5 | Densidad y espaciado — VERIFICADA LOCALMENTE | escritorio HiDPI, tablet tactil, maximos de ancho y ritmo vertical |
| G00.6 | Tablas y listas | cabecera fija cuando proceda, scroll interno correcto y acciones alcanzables |
| G00.7 | Formularios | reflujo de columnas, etiquetas, errores, teclado virtual y accion primaria |
| G00.8 | Overlays | modal, dialog, drawer, popover, selector, tooltip, confirmacion y alerta |
| G00.9 | Estados asincronos | skeleton/carga, vacio, error, reintento, offline y permisos insuficientes |
| G00.10 | Accesibilidad operativa | foco visible, orden de tabulacion, 44x44 tactil, contraste y reduced motion |

Dependencia: todas las pantallas heredan estos contratos. Cualquier cambio
global se presentara y aprobara antes de aplicarse a sus consumidores.

## C01 - Acceso publico

| ID | Ruta/pantalla | Secciones y estados propios |
|---|---|---|
| C01.1 | `/login` | credenciales, recordar sesion, error, bloqueo, carga y acceso a recuperacion |
| C01.2 | `/forgot-password` | email, confirmacion, validacion y retorno |
| C01.3 | `/reset-password` | token valido/invalido, nueva clave, confirmacion y expiracion |
| C01.4 | `/verify-registration` | verificando, aprobado, rechazado, expirado y acceso |
| C01.5 | `/ruc-review` | consulta, pendiente, aprobado, rechazado, observaciones y error |

## C02 - Consolas y hubs Classic

| ID | Ruta/pantalla | Secciones y estados propios |
|---|---|---|
| C02.1 | `/` y `/dashboard` Consola de Operaciones | cabecera, tarjetas de modulos, permisos, indicadores, footer y version |
| C02.2 | `/precios-unitarios` | cuatro tarjetas de acceso, descripciones, estados deshabilitados y retorno |
| C02.3 | `/servicios` | tarjetas Comunidad, Marketplace, Transferencias y servicios futuros |
| C02.4 | `/admin-global` | hub administrativo, permisos, tarjetas y retorno |

## C03 - Proyectos y gestion de equipo

| ID | Ruta/pantalla | Secciones y estados propios |
|---|---|---|
| C03.1 | `/proyectos` listado | empresa Santiago Bermeo, filtros, resumen, filas, acciones y scroll exclusivo del listado |
| C03.2 | `/proyectos` tarjetas/resumen alternativo | densidad, wrapping, estados y continuidad con el listado |
| C03.3 | Crear/editar proyecto | formulario completo, fechas, responsables, validaciones y acciones |
| C03.4 | Acciones de proyecto | menus, confirmaciones, eliminacion, duplicado y navegacion |
| C03.5 | `/proyectos/gestor` Proyectos | busqueda, tabla/tarjetas, asignados y acciones |
| C03.6 | `/proyectos/gestor` Bases maestras | selector de vista, listado, asignados y acciones |
| C03.7 | Modal de asignacion | EDT, modulo, asignacion global, usuarios disponibles/asignados y scroll |
| C03.8 | Dashboard de equipo | filtros, metricas, ramas EDT, miembros y salto a asignacion |

## C04 - Espacio de trabajo de un proyecto

| ID | Pantalla interna | Secciones y estados propios |
|---|---|---|
| C04.1 | Cabecera y selector del proyecto | identidad, acciones, cambio de seccion, retorno y titulo largo |
| C04.2 | Datos del proyecto | formulario, fechas, plazo, informacion contractual y guardado |
| C04.3 | Stakeholders | listado, filtros, alta/edicion, roles, contactos y estados |
| C04.4 | EDT arbol | arbol, seleccion, expansion, formularios, acciones y profundidad extrema |
| C04.5 | EDT grafo | canvas, zoom, pan, seleccion, leyenda y panel contextual |
| C04.6 | Presupuestos del proyecto | listado, crear, importar, estados y navegacion |
| C04.7 | Desagregacion | grupos, partidas, recursos, edicion, resumen y scroll bidireccional |
| C04.8 | Formula polinomica - indices | alertas, controles, tabla de indices y totales |
| C04.9 | Formula polinomica - formula | coeficientes, validacion, resultados y barras de distribucion |
| C04.10 | EDO | datos, estructura, edicion, resultados y overlays |
| C04.11 | Cronogramas - listado/configuracion | selector, edicion, importacion y sincronizacion |
| C04.12 | Cronogramas - valorado | tabla, resumen, periodos, comparaciones y scroll |
| C04.13 | Cronogramas - Gantt | cabeceras, tabla, timeline, barras, dependencias y scroll sincronizado |
| C04.14 | Gantt - edicion e interacciones | drag, resize, hitos, dependencias, preview, errores y confirmacion |
| C04.15 | Gantt - Pareto/reportes | modal, grafico, tabla, impresion y exportacion |
| C04.16 | BIM dentro del proyecto | entrada, carga, permisos, error, selector de version y workspace |

## C05 - Precios unitarios y catalogos

| ID | Ruta/pantalla | Secciones y estados propios |
|---|---|---|
| C05.1 | `/precios-unitarios/bases` | selector de empresa/base, listado, busqueda, alta, edicion y acciones |
| C05.2 | `/precios-unitarios/subcategorias` | categorias, subcategorias, elementos, filtros y formularios |
| C05.3 | `/recursos` | catalogo, filtros, tabla, edicion, importacion, seleccion multiple y eliminacion |
| C05.4 | `/apus` | listado, filtros, estados, acciones, importacion y seleccion multiple |
| C05.5 | Editor APU | cabecera, datos base, recursos agrupados, totales, formulas y guardado |
| C05.6 | Editor de recurso | formulario, unidades, rendimientos, precios, validacion y acciones |
| C05.7 | Modales auxiliares de catalogo | confirmaciones masivas, importacion, advertencias y resultados |

## C06 - Presupuesto detallado

| ID | Ruta/pantalla | Secciones y estados propios |
|---|---|---|
| C06.1 | `/proyectos/:id/presupuestos` | lista, filtros, crear, importar, duplicar y eliminar |
| C06.2 | Detalle - Lineas | EDT/partidas, tabla, edicion, cantidades, precios y scroll |
| C06.3 | Detalle - Catalogo APU | busqueda, categorias, seleccion, previsualizacion e insercion |
| C06.4 | Detalle - Tanteo | parametros, calculos, alternativas y resultados |
| C06.5 | Editor APU del presupuesto | recursos, rendimientos, precios, totales y validaciones |
| C06.6 | Indirectos | modal, conceptos, porcentajes, formulas, totales y acciones |
| C06.7 | Pareto | modal, grafico, tabla, filtros, leyenda y exportacion |
| C06.8 | EDT valorada | modal, jerarquia, importes, totales y scroll |
| C06.9 | Notas generales | modal, editor, contenido largo, guardado y cierre |
| C06.10 | Informes del presupuesto | configuracion, vista previa, paginacion, impresion y descarga |

## C07 - Comunidad, transferencias y Marketplace

| ID | Ruta/pantalla | Secciones y estados propios |
|---|---|---|
| C07.1 | Comunidad - Publico | categorias, temas, feed, busqueda, seguimiento y publicaciones |
| C07.2 | Comunidad - Mi empresa | ambito privado, temas, miembros, restricciones y publicaciones |
| C07.3 | Comunidad - Mensajes directos | hilos, conversacion, composicion, adjuntos y participantes |
| C07.4 | Comunidad - Panel Resumen | metricas, actividad y accesos |
| C07.5 | Comunidad - Gobernanza | estructura, categorias, temas, permisos y formularios |
| C07.6 | Comunidad - Usuarios | directorio, filtros, alta/edicion y permisos |
| C07.7 | Comunidad - Moderacion | denuncias, sanciones, decisiones y auditoria |
| C07.8 | Comunidad - Overlays | tema, publicacion, personal, estructura, confirmacion y adjuntos |
| C07.9 | Envios y Transferencias | enviados/recibidos, filtros, listado, detalle, envio y estados |
| C07.10 | Marketplace - Catalogo | cabecera, busqueda, filtros, categorias, productos y carrito |
| C07.11 | Marketplace - Detalle de producto | galeria, datos, vendedor, licencia, compra y contenido largo |
| C07.12 | Marketplace - Pedido | estado, pago, justificantes, entrega, incidencias y acciones |
| C07.13 | Comprador - Resumen/Pedidos | metricas, filtros, historial, estados y acciones |
| C07.14 | Comprador - Biblioteca | activos, permisos, filtros, descargas y accesos |
| C07.15 | Vendedor - Resumen | metricas, selector empresa/sistema, actividad y alertas |
| C07.16 | Vendedor - Productos | listado, filtros, alta/edicion, moderacion y publicacion |
| C07.17 | Vendedor - Ventas/Devoluciones | tablas, filtros, importes, estados y detalle |
| C07.18 | Administrador Marketplace - Catalogo | tipos, productos, moderacion, filtros y formularios |
| C07.19 | Administrador Marketplace - Pedidos/Pagos | colas, validacion, comprobantes y decisiones |
| C07.20 | Administrador Marketplace - Importacion | archivos, progreso, analisis, conciliacion, errores y resultado |
| C07.21 | Administrador Marketplace - Configuracion | pasarelas, secretos enmascarados, entrega y reglas |

## C08 - Configuracion de empresa y usuario

| ID | Ruta/pantalla | Secciones y estados propios |
|---|---|---|
| C08.1 | Settings - Mi empresa | identidad, logo, datos, ubicacion, contacto y guardado |
| C08.2 | Settings - Backup empresa | copias, progreso, descarga, restauracion y confirmaciones |
| C08.3 | Settings - Usuarios | listado, filtros, alta/edicion, roles y estados |
| C08.4 | Settings - Plantillas | base, configuracion, listado, seleccion y acciones |
| C08.5 | Settings - Configuracion de proyecto | decimales, formatos, reglas y guardado |
| C08.6 | Settings - Preferencias | modo adaptativo, preferencias visuales y persistencia |
| C08.7 | Settings - Modales de empresa/usuario | formulario largo, errores, acciones y teclado virtual |

## C09 - Administracion global

| ID | Ruta/pantalla | Secciones y estados propios |
|---|---|---|
| C09.1 | Estado | salud, servicios, indicadores, refresco y degradacion |
| C09.2 | Sesiones | listado, filtros, detalle, revocacion y estados |
| C09.3 | Mantenimiento | tareas, progreso, logs, confirmaciones y resultados |
| C09.4 | BIM global | gates, configuracion, limites, estado y guardado |
| C09.5 | Licencias | planes, licencias, asignaciones, filtros y formularios |
| C09.6 | Email corporativo | configuracion, prueba, plantillas, errores y secretos enmascarados |
| C09.7 | Integraciones | proveedores, credenciales, estado, pruebas y formularios |
| C09.8 | Superadministradores | listado, alta/edicion, roles, estados y confirmaciones |
| C09.9 | Empresas | listado, filtros, detalle, alta/edicion y cambio de contexto |
| C09.10 | Comunicados | listado, editor, destinatarios, programacion y estados |
| C09.11 | Gobernanza | politicas, configuracion, decisiones y auditoria |
| C09.12 | Auditoria | filtros, tabla, detalle, exportacion y contenido extenso |
| C09.13 | Herramientas | acciones operativas, parametros, progreso y resultados |
| C09.14 | Modelos de importacion | listado, editor, campos, mapeos, validacion y prueba |
| C09.15 | Empresa auditada | contexto, datos, cumplimiento, hallazgos y evidencias |

## B10 - Shell y visor BIM

| ID | Pantalla | Secciones y estados propios |
|---|---|---|
| B10.1 | Workspace BIM V2 | context bar, navegacion, regiones, preferencias y recuperacion |
| B10.2 | Shell/selector de workspace | Viewer, Coordinacion, Planificacion, Produccion, Campo, Entrega e Informes |
| B10.3 | Visor 3D/Fragments | canvas, carga, vacio, error WebGL, seleccion, orbit, zoom y touch |
| B10.4 | Arbol de elementos | jerarquia, busqueda, expansion, seleccion y scroll |
| B10.5 | Propiedades | grupos, valores largos, vacio, scroll y copia |
| B10.6 | Selector/comparador de versiones | lista, estados, comparacion y resultados |
| B10.7 | Toolbar de estados de vista | guardar, recuperar, compartir, menus y feedback |
| B10.8 | Explorador de elementos | filtros, tabla/arbol, seleccion y vinculacion con visor |
| B10.9 | Federacion/modelos | modelos, estado, visibilidad, transformaciones y errores |
| B10.10 | Particion/CSG | canvas, parametros, resultado, metricas y acciones |

## B11 - Coordinacion, calidad y CDE

| ID | Pantalla | Secciones y estados propios |
|---|---|---|
| B11.1 | Issues | listado, filtros, detalle, formulario, estados y marcadores 3D |
| B11.2 | IDS | requisitos, validacion, resultados, errores y exportacion |
| B11.3 | Quality report | resumen, incidencias, filtros, tabla y exportacion |
| B11.4 | Review tools/replay | anotaciones, mediciones, estados de vista e historial |
| B11.5 | CDE Dashboard | indicadores, actividad, alertas y accesos |
| B11.6 | CDE Documentos | arbol/lista, metadatos, carga, versionado, filtros y detalle |
| B11.7 | CDE RFI | listado, detalle, formulario, estados y adjuntos |
| B11.8 | CDE Submittals | listado, detalle, workflow, decision y adjuntos |
| B11.9 | CDE Review | documentos, visor, comentarios, decision y paneles |
| B11.10 | CDE ACL | usuarios/roles, permisos, matriz, cambios y confirmacion |
| B11.11 | CDE Colaboracion | presencia, eventos, estado online/offline y scroll independiente |
| B11.12 | Links e integracion contextual | relaciones, seleccion, alta, errores y navegacion |

## B12 - Planificacion 4D y produccion

| ID | Pantalla | Secciones y estados propios |
|---|---|---|
| B12.1 | Planning 4D | shell, herramientas, seleccion cruzada y drawer inferior |
| B12.2 | Timeline 4D | escala, barras, controles, reproduccion, scroll y touch |
| B12.3 | Gantt BIM | actividades, dependencias, seleccion, scroll y sincronizacion 3D |
| B12.4 | Enlaces de cronograma | elementos, actividades, asignacion y estados |
| B12.5 | Intercambio de cronograma | importacion, preflight, warnings, errores y resultado |
| B12.6 | Plan vs Actual | indicadores, tabla/grafico, filtros y comparacion |
| B12.7 | Escenario de frente | formulario, escenarios, resultados y seleccion |
| B12.8 | Conflicto espacio-tiempo | parametros, lista, visor, severidad y acciones |
| B12.9 | Nivelacion/capacidad de recursos | recursos, periodos, alertas, propuesta y decisiones |
| B12.10 | Productividad | captura, propuestas, destinos, estados y aprobacion |
| B12.11 | Cuadrillas y partes | formulario, resumen, registro, acciones y scroll propio |
| B12.12 | Movimiento de equipos | equipos, actividades, trayectoria, visor y controles |
| B12.13 | Eventos no planificados | listado, formulario, impacto, decisiones y estados |

## B13 - Campo, costes, entrega e integraciones

| ID | Pantalla | Secciones y estados propios |
|---|---|---|
| B13.1 | Campo - Dashboard/reporte | resumen, metricas, actividad, alertas y filtros |
| B13.2 | Campo - Documentos | listado, carga, filtros, detalle y evidencias |
| B13.3 | Campo - Issues | listado, detalle, formulario, estados y ubicacion |
| B13.4 | Campo - Diario | fecha, entradas, formulario, adjuntos y cierre |
| B13.5 | Campo - Inspecciones | plantillas, lista, formulario, resultados y firma |
| B13.6 | Campo - Recursos | personal/equipos, cantidades, periodos y formulario |
| B13.7 | Campo - Georreferencia | mapa, controles, puntos, tabla y calibracion |
| B13.8 | Seguridad | riesgos, severidad, medidas, estados y vista 3D |
| B13.9 | Costes - Estimacion | formulario, conceptos, total, registro y decisiones |
| B13.10 | Costes - Contratos | formulario, listado, importes, fechas y estados |
| B13.11 | Costes - SOV | contrato, partidas, importes, resumen y acciones |
| B13.12 | Costes - Pagos | formulario, listado, certificados, estados y decisiones |
| B13.13 | Costes - Ordenes de cambio | formulario, listado, impacto, estados y decisiones |
| B13.14 | Costes - Coste real | ledger, filtros, importes, origen y scroll bidireccional |
| B13.15 | Costes - Forecast | formulario, revisiones, EAC, variacion y decisiones |
| B13.16 | Entrega - Aceptacion as-built | formulario, calidad, version, registro y decision |
| B13.17 | Entrega - Commissioning | sistemas, pruebas, activos, formulario y registro |
| B13.18 | Entrega - Cierre punch | criterios, evidencias, registro y decision |
| B13.19 | Entrega - Dossier digital | ensamblado, manifiesto, registro y decision |
| B13.20 | Entrega - Transicion a Operaciones | receptor, baseline, registro y decision |
| B13.21 | ERP Exchange | configuracion, ejecuciones, estado, errores y resultados |
| B13.22 | Integration Gateway | conectores, trabajos, estado, errores y reintentos |
| B13.23 | Import Jobs | cargas, progreso, errores, resultados y detalle |
| B13.24 | Informes BIM | configuracion, seleccion, preview, exportacion y estados |

## Orden de aprobacion propuesto

El orden reduce retrabajo, pero no autoriza cambios:

1. G00 contratos globales.
2. C01 acceso publico.
3. C02 hubs.
4. C03 Proyectos.
5. C05 catalogos.
6. C04 proyecto, salvo BIM.
7. C06 presupuesto.
8. C07 servicios, comunidad y Marketplace.
9. C08 Settings.
10. C09 Administracion global.
11. B10 shell y visor BIM.
12. B11 coordinacion y CDE.
13. B12 planificacion y produccion.
14. B13 campo, costes, entrega e integraciones.

Antes de implementar cada ID se entregara:

- captura actual en seis perfiles;
- descripcion del problema real;
- propietario esperado de cada scroll;
- propuesta de composicion, tamaños y comportamiento;
- componentes compartidos afectados;
- pruebas exactas que certificaran el cambio.

Despues de la confirmacion se implementara solamente ese ID o el contrato global
explicitamente aprobado. La aprobacion exige capturas posterior/anterior,
metricas DOM, gestos tactiles cuando proceda, build y ausencia de regresion en
las pantallas consumidoras.

## Conteo y trazabilidad

- 43 rutas reales: 5 publicas y 38 protegidas.
- 10 contratos globales.
- 5 pantallas publicas.
- 4 hubs.
- 8 pantallas de Proyectos/Equipo.
- 16 pantallas internas del proyecto.
- 7 pantallas de catalogos.
- 10 pantallas de presupuesto.
- 21 pantallas de Comunidad/Transferencias/Marketplace.
- 7 pantallas de Settings.
- 15 pantallas de Administracion global.
- 10 pantallas de shell/visor BIM.
- 12 pantallas de Coordinacion/CDE.
- 13 pantallas de Planificacion/Produccion BIM.
- 24 pantallas de Campo/Costes/Entrega/Integraciones BIM.

Total de unidades de aprobacion: **162**. Este total no sustituye los estados y
overlays asociados: cada unidad se prueba con la matriz de estados definida al
inicio.

## Exclusiones

No hay exclusiones visuales implícitas. Una superficie puede declararse:

- no accesible por rol;
- bloqueada por datos o infraestructura;
- no implementada;
- duplicada tecnicamente pero compartida visualmente.

En cualquiera de esos casos se registra el motivo y la evidencia; nunca se
marca como aprobada por ausencia de acceso o por no aparecer en una captura.
