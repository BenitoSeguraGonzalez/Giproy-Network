# HANDOFF

Fecha
2026-05-08

Motor IA utilizado
Codex

TASK en progreso
`TASK-1603` / `TASK-1604`: motor inicial de laminas graficas clasicas, implementado y validado para testeo/pulido.

Resultado actual
Se crea el contrato de impresion grafica clasica y una primera implementacion funcional sin backend nuevo. El boton `Reporte` de `EDO` y `EDT` ahora distingue `Reporte documental` y `Lamina grafica`. `Cronogramas` incorpora `Lamina Curva S` y `Lamina Gantt completo` dentro de sus menus de reporte. El motor comun permite `A0` a `A4`, orientacion horizontal/vertical, preflight compacto y genera un `Blob application/pdf` con descarga directa, sin ventana tecnica ni dialogo de impresion del navegador. Las laminas no incluyen controles de UI y usan datos extendidos: jerarquia grafica con tarjetas/conectores en EDO/EDT, periodos completos en Curva S y grid izquierdo + timeline reconstruidos desde datos en Gantt. Hotfix posterior: se corrige la salida inicial tipo rejilla y el mojibake `þÿ` del PDF directo. Pulido Gantt PDF: se retira la franja naranja artificial, se eliminan los rotulos flotantes `FS`/`FF`/etc. y el grid izquierdo suma `Pred.`, `Inicio`, `Fin` y `Dur.`. Saneamiento posterior acotado solo a impresion: las relaciones PDF se dibujan solo desde `dependencies` explicitas y la lamina deja de convertir tareas de ancho pequeno en hitos, evitando diamantes y rutas que no existen en la vista real.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.
- Parseo JSON de `docs/project_state.json` y `docs/runtime/WORK_MODE_STATE.json` OK.

Validacion manual pendiente
Prueba manual de descarga PDF directa para EDO, EDT, Curva S y Gantt.

Impacto
Frontend clasico de `EDO`, `EDT` y `Cronogramas`, mas componentes/utilidades comunes de reporting visual clasico. Sin backend, sin persistencia, sin rutas BIM, sin UX BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1602`: revision y alineacion de reportes EDO/EDT, implementada y validada.

Resultado actual
La reportería de `EDO` y `EDT` queda conectada al visor comun de reportes. `EDO` ahora tiene `report_type: edo`, preview/export, nombres de descarga y servicio `generate_edo_report(...)` usando `001 - EDO.xlsx`. `EDT` corrige el generador para usar `EdtNode` y los placeholders reales de sus plantillas (`#CODIGOEDT`, `#DESCRIPCION_CUENTA_PAQUETE`, `#NOMBRE_RESPONSABLE`, `#CODIGO_STKR`, `#DEFINICION`, `#SUBTOTAL_CUENTA`). Los botones de reporte de ambas secciones abren `CommonReportPreviewModal` y permiten Excel, PDF nativo y PDF desde Excel. Hotfix posterior: `Stakeholders` resuelve roles para preview y Excel con la misma politica, usando asignacion consolidada y fallback directo a roles operativos en `EDO` / `EDT`; se invalida cache de exportacion.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py backend/app/api/endpoints/reporting.py backend/app/schemas/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_edo_edt_reports.py -q` OK desde `backend/`, 2 passed.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK desde `backend/`, 6 passed.
- `python -m pytest app/tests/test_stakeholder_role_sync.py -q` OK desde `backend/`, 6 passed.
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Reportería clásica y entrada frontend clásica de EDO/EDT. Sin rutas BIM, UX BIM, modelos BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1600` / `TASK-1601`: adecuacion visual de EDT al patron EDO, implementada y validada.

Resultado actual
EDT adopta el lenguaje visual clasico homologado: header principal claro/soft con identidad verde, selector `Grafico / Arbol` junto al reporte, rail operativo oscuro con accion de nueva cuenta, busqueda unica, metricas economicas como chips/semaforos y acciones por lote siempre visibles pero desactivadas cuando no hay seleccion. En grafico, los chips de estructura y valoracion quedan agrupados en el mismo bloque y los botones se separan a la derecha. La vista grafica usa toolbar externa y busqueda externa de `HierarchyGraphView`; el arbol queda como grid compacto con header unico, columnas para selector/codigo/descripcion/subvalores/acciones, filas mas densas, acciones soft por hover de fila y hints para textos truncados. Los modales de cuenta, participante y mover seleccion adoptan header negro, cuerpo claro, footer plano, cierre blanco/soft y `SearchableSelect` animado. `SoftSelectToggle` gana tono `green` reutilizable para EDT.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de EDT y variante visual reutilizable de `SoftSelectToggle`. Sin backend, sin cambios de persistencia, sin rutas BIM, UX BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1599`: reportería de Stakeholders con roles sincronizados en exportaciones, implementada y validada.

Resultado actual
Las exportaciones del reporte `Stakeholders` ya no reutilizan una versión cacheada sin roles cuando la vista previa/resumen muestra roles sincronizados desde EDO/EDT. La clave de caché de exportación incorpora proyecto raíz, stakeholders, asignaciones `proyecto_stakeholders`, `rol_id`, nombre y marca temporal del rol. Esto cubre Excel y PDF desde Excel, manteniendo el fallback `Sin rol asignado` cuando no hay rol consolidado.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_stakeholder_role_sync.py -q` OK desde `backend/`, 5 passed.

Impacto
Backend común de reporting clásico. Sin frontend, sin cambios de persistencia, sin rutas BIM, UX BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1598`: compactacion visual del arbol EDO, implementada y validada.

Resultado actual
El arbol EDO reduce densidad vertical y adopta una estructura visual grid alineada con `Stakeholders`: toolbar y cabecera de columnas viven en un unico header oscuro, con columnas fijas para selector/codigo/acciones y columna principal fluida. La indentacion jerarquica se aplica solo sobre `Descripcion / Responsable`, evitando desplazar toda la fila y recuperando espacio util. La guia de drop a raiz deja de mostrar una franja crema permanente y solo aparece coloreada durante el arrastre. El contador de seleccion masiva vive como chip/semaforo siempre visible en el header y sus acciones usan botones iconograficos soft desactivados hasta tener seleccion. Chips y botones del rail oscuro quedan centralizados en `frontend/src/components/ui/darkRailControls.jsx` y son compartidos por `Grafico` y `Arbol`. El modal de mover seleccion EDO queda mas compacto, sin paneles internos redundantes y con una variante limpia del `SearchableSelect` animado. El scrollbar queda anclado al cuerpo scrolleable visible. La seleccion multiple sigue usando `SoftSelectToggle` y se preservan busqueda, expansion, acciones, drag/drop y sincronizacion con Stakeholders.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.
- Parseo JSON OK.

Impacto
Frontend clasico de EDO. Sin backend, sin cambios de persistencia, sin modo grafico, sin UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1597`: selectores operativos migrados a `SoftSelectToggle`, implementada y validada.

Resultado actual
Los selectores multiples discretos usan ahora `SoftSelectToggle` en `EDO`, `EDT`, `Subcategorias`, `Recursos`, `APUs`, empresas destinatarias de `Comunicados` y dias laborables del calendario avanzado de `CronogramaGantt`. El componente queda definido como led circular pequeno con area clicable ampliada y variante `as="span"` para indicadores dentro de botones compuestos. Se dejan fuera de esta migracion los checkboxes booleanos de formularios, consentimientos, preferencias, configuracion, activo/inactivo y BIM. El patron queda documentado en `docs/STYLE_GUIDE.md`.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.
- Parseo JSON OK.

Impacto
Frontend clasico visual. Sin backend, sin cambios de reglas de negocio, sin UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1593` a `TASK-1596`: adecuacion visual de EDO implementada y validada.

Resultado actual
EDO adopta el lenguaje visual clasico homologado: header principal claro/soft con selector `Grafico / Arbol` junto al reporte, workbench soft, rail operativo oscuro, busqueda local sin acentos compartida por modo grafico y modo arbol, botones de fila con skin soft, hints para textos largos y modales internos con header negro, cuerpo claro, footer plano y cierre X blanco/soft. La vista grafica queda integrada en el mismo workbench; sus controles superiores se proyectan al rail oscuro, se elimina el buscador duplicado interno y las metricas quedan siempre visibles como chips/semaforos en el rail sin boton `Resumen`. En modo arbol, expandir/contraer queda solo en los nodos, alineado con el grupo derecho de acciones, el hover de acciones queda aislado por fila para no activar hijos y la seleccion multiple usa `SoftSelectToggle` como led circular reutilizable con area clicable ampliada. El selector de cabecera alterna seleccion/limpieza de todos los nodos visibles. En `Stakeholders`, el subtitulo del header cambia a `Directorio común del proyecto`.
Hotfix aplicado: se corrige el `ReferenceError` en runtime y se limpia el rail arbol de acciones redundantes.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de EDO y ajuste literal visual en Stakeholders. Sin backend, sin cambios de persistencia EDO/EDT, sin rutas BIM ni UX BIM.

TASK en progreso
`TASK-1592`: cierre visual de modales de reportes, implementada y validada.

Resultado actual
El visor comun de reportes conserva el `onClose` funcional y usa el patron visual de `ProjectSectionReportButton`: 40px, radio contenido, sombra soft clara, hover con acento azul, escala activa e inset shadow. `AppModalHeader` queda preparado con props opcionales para personalizar el cierre sin cambiar el default global.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de reporting. Sin backend, plantillas, EDO/EDT, rutas BIM, UX BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1591`: politica de borrado seguro de Stakeholders, implementada y validada.

Resultado actual
`Stakeholders` ya no permite borrar un responsable si tiene rol consolidado o uso activo en `EDO`/`EDT`. El backend bloquea el `DELETE /stakeholders/{id}` con `409 Conflict` y el frontend muestra el detalle: primero debe liberarse en EDO/EDT. La regla vive en repositorio backend para evitar huerfanos o cascadas destructivas aunque se llame la API directamente.

Validacion ejecutada
- `python -m py_compile app/repositories/stakeholder.py app/api/endpoints/stakeholders.py` OK.
- `python -m pytest app/tests/test_stakeholder_role_sync.py -q` OK, 4 passed.
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Backend comun de Stakeholders/EDO/EDT y frontend clasico de Stakeholders. Sin reporting, UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1587`: boton nuevo de Stakeholders en toolbar oscura, implementada y validada.

Resultado actual
La accion `Nuevo` sale de la cabecera principal de `Stakeholders` y se reubica en el header oscuro del directorio, junto al buscador. El boton queda circular, compacto, sin label visible, con icono `+` en morado y sombra contenida alineada con la familia visual de `Datos de Proyecto`.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de Stakeholders. Sin backend, persistencia, reportes, EDO/EDT, UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1586`: toolbar oscura del directorio Stakeholders, implementada y validada.

Resultado actual
El header interno del listado de `Stakeholders` retira los chips `registrados`, `visibles` y el texto auxiliar de busqueda. La franja del buscador pasa a skin oscuro, el campo queda a la izquierda y se conserva la busqueda natural sin acentos como comportamiento no visible.

Validacion ejecutada
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de Stakeholders. Sin backend, persistencia, reportes, EDO/EDT, UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1584` / `TASK-1585`: roles de Stakeholders sincronizados desde EDO/EDT, implementado y validado.

Resultado actual
`Stakeholders` ya no muestra el boton `Roles` ni conserva el modal local de gestion de roles. El catalogo de roles permanece disponible para `EDO` y `EDT`, que son ahora el origen operativo del rol. Al crear o actualizar un nodo stakeholder en EDO/EDT, el backend comun sincroniza `proyecto_stakeholders.rol_id` para que el directorio comun y el reporte de stakeholders muestren el rol consolidado. El fallback visible/documental pasa a `Sin rol asignado`.

Saneamiento ejecutado
Empresa `Santiago Bermeo` (`id=3`), proyecto raiz `SantiagoBermeo-2026-001`: `2` stakeholders sincronizados, `0` sin rol. Backup: `tmp/santiago_bermeo_stakeholder_roles_backup_20260507_192720.json`.

Validacion ejecutada
- `python -m py_compile app/repositories/stakeholder.py app/repositories/edo.py app/repositories/edt.py app/services/reporting.py scripts/sync_santiago_bermeo_stakeholder_roles.py` OK.
- `python -m pytest app/tests/test_stakeholder_role_sync.py app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 8 passed.
- `npm run build` OK desde `frontend/`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico de Stakeholders, backend comun de EDO/EDT/Stakeholders y reporting `stakeholders`. Sin UX BIM, rutas BIM, modelos BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1583`: adecuacion visual de Stakeholders al estilo base clasico, implementada y validada.

Resultado actual
Stakeholders adopta una cabecera clara/soft equivalente a `Datos de Proyecto`, workbench soft, toolbar compacta, chips de conteo, busqueda natural y tabla mas densa con header sticky oscuro. Se conserva el morado como identidad en icono y label `Stakeholders`. El modal de alta/edicion queda reorganizado en Identidad, Contacto, Perfil profesional y Ubicacion, con inputs compactos y footer sobrio.

Validacion ejecutada
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.
- Busqueda focal en `Stakeholders.jsx` sin referencias BIM.

Impacto
Visual/UX en Stakeholders clasico. Sin backend, persistencia, reportes generados, plantillas, UX BIM, rutas BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1582`: hotfix de carga de la ruta Proyectos, implementada y validada.

Resultado actual
`/proyectos` vuelve a import directo en `AppRouter.jsx`, eliminando el chunk dinamico `assets/Proyectos-*.js` que provoco `Failed to fetch dynamically imported module` en el entorno publicado. Las secciones internas pesadas del proyecto permanecen con carga diferida.

Validacion ejecutada
- `npm run build` OK.
- El build nuevo ya no genera `assets/Proyectos-*.js`.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Frontend clasico, carga de ruta principal de Proyectos. Sin backend, persistencia, reportes, plantillas, UX BIM, rutas BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1581`: prueba de skin oscuro en cabeceras plegables de Datos de Proyecto, implementada y validada.

Resultado actual
Las cabeceras plegables de Datos de Proyecto usan un skin oscuro tipo Gantt y la cabecera lateral `8. Documentos e imagenes / Repositorio visual del proyecto` queda alineada con el mismo skin. Esa cabecera lateral queda `sticky` dentro del panel derecho para mantenerse visible durante scroll. El cambio queda centralizado en constantes de `DatosProyecto.jsx` para poder revertirlo facilmente. El boton circular de despliegue conserva tamano, forma y animacion; se redujo solo el halo exterior para que no quede difuso sobre el header oscuro. El despliegue ahora usa `CollapsibleSectionBody` con transicion de altura/opacidad, evitando el salto brusco anterior.

Validacion ejecutada
- `npm run build` OK.
- JSON documental OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Visual/UX en Datos de Proyecto clasico. Sin backend, persistencia, reportes, plantillas, UX BIM, rutas BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1580`: hints en listados largos de Objetivos, Restricciones y Supuestos en Datos de Proyecto, implementada y validada.

Resultado actual
Los inputs de `Objetivos clave`, `Restricciones conocidas` y `Supuestos iniciales` usan el componente estandar `AppHint` cuando el texto capturado es largo, mostrando el contenido completo sin alterar edicion, serializacion, persistencia, backend ni reportes.

Validacion ejecutada
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Visual/UX en Datos de Proyecto clasico. Sin cambios de backend, persistencia, reportes generados, plantillas, UX BIM, rutas BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1579`: ajuste visual del footer del visor comun de reportes y alineacion de Especificaciones Tecnicas, implementada y validada.

Resultado actual
El visor comun de reportes vuelve a un pie plano y ligero: `CommonReportPreviewModal` usa `AppModalFooter variant="flat"` con separador sutil y botones de exportacion menos pesados. La variante inset permanece como comportamiento por defecto para otros modales. En Datos de Proyecto, `Normativa aplicable` y `Nivel de complejidad` quedan en la misma linea visual dentro de `2. Especificaciones tecnicas`, con normativa ocupando dos columnas y complejidad la tercera.

Validacion ejecutada
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Visual, frontend clasico. Sin cambios de backend, persistencia, reportes generados, plantillas, UX BIM, rutas BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1578`: nivel de complejidad en Datos de Proyecto y Acta de Constitucion, implementada y validada.

Resultado actual
Datos de Proyecto clasico incorpora `Nivel de complejidad` en `2. Especificaciones tecnicas` con las opciones Baja, Media, Alta y Muy Alta. El backend guarda el dato en `ProyectoDetalle.nivel_complejidad`, la migracion `ac7d8e9f10a1` ya fue aplicada y el Acta usa ese campo para `#COMPLEJIDAD`, dejando de reutilizar `descripcion_unidad`. `Cliente / Contratante` y `Fuente de financiamiento` permanecen en `4. Informacion contractual y financiera` y alimentan reportes desde sus campos reales.

Validacion ejecutada
- `python -m py_compile backend/app/models/proyecto_detalle.py backend/app/schemas/proyecto_detalle.py backend/app/services/reporting.py backend/app/services/marketplace_checkout.py backend/alembic/versions/ac7d8e9f10a1_add_project_detail_complexity_level.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 6 passed.
- `alembic upgrade ac7d8e9f10a1` OK.
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK desde `frontend/`.

Impacto
Datos de Proyecto clasico, backend comun de detalle de proyecto y reporte Acta de Constitucion. Sin UX BIM, rutas BIM, modelos BIM ni acoplamientos nuevos.

TASK en progreso
`TASK-1576` / `TASK-1577`: correccion visual real del Acta PDF desde Excel, implementada y validada.

TASK de control asociada
`TASK-1576`: reapertura por salida real no conforme en visor.

Slice actual
`TASK-1577`: imagenes integradas a bloque completo, compactacion universal de cola residual y cache de render `pdf-formal-v7`.

Resultado actual
El PDF desde Excel del Acta ya no dibuja imagenes por su tamano bruto anclado ni como lienzo blanco centrado: calcula el rango real de celdas del placeholder y ocupa el bloque completo. La paginacion queda reforzada con prueba explicita: pagina 1 termina en fila 30 y pagina 2 empieza en fila 31 con `ESPECIFICACIONES TECNICAS Y CONTRACTUALES`. El conversor comun compacta suavemente cualquier reporte cuando la ultima pagina es residual para evitar paginas finales con una sola linea.
El endpoint `/reporting/export` expone `X-GiProy-Report-Render-Version` para verificar que el backend activo ya carga `pdf-formal-v7`.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m py_compile backend/app/api/endpoints/reporting.py backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 6 passed.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
PDF desde Excel en reportes clasicos. Sin cambios en frontend, contratos API, plantillas, modelos, persistencia, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1574` / `TASK-1575`: secciones indivisibles en PDF desde Excel, implementado y validado.

TASK de control asociada
`TASK-1574`: control de cortes de seccion formal en Acta de Constitucion.

Slice actual
`TASK-1575`: agrupacion de cabeceras oscuras y cache de render `pdf-formal-v4`.

Resultado actual
El conversor PDF desde Excel detecta cabeceras oscuras/titulos conocidos y mantiene cada seccion junta cuando cabe en una pagina. En el Acta, `ESPECIFICACIONES TECNICAS Y CONTRACTUALES` queda agrupada de la fila 31 a la 37, evitando que solo se muestre la segunda mitad del bloque.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 4 passed.
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
PDF desde Excel en reportes clasicos. Sin cambios en frontend, contratos API, plantillas, modelos, persistencia, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1572` / `TASK-1573`: proporcion de imagenes en Acta de Constitucion, implementado y validado.

TASK de control asociada
`TASK-1572`: control de imagenes georreferenciacion/referencial dentro del area de pagina.

Slice actual
`TASK-1573`: composicion proporcional de imagenes en placeholders y cache de render `pdf-formal-v3`.

Resultado actual
Las imagenes del Acta se componen ahora en un lienzo del tamano exacto del rango destino, con escala proporcional `contain`, centradas y con margen interno. Esto evita deformaciones y desbordes en PDF desde Excel. La cache de exportaciones queda invalidada por nueva version de render.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 3 passed.
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
Reporte clasico Datos de Proyecto / Acta de Constitucion y PDF desde Excel. Sin cambios en frontend, contratos API, plantillas, modelos, persistencia, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1570` / `TASK-1571`: footer del visor comun de reportes y cache versionada, implementado y validado.

TASK de control asociada
`TASK-1570`: control del pie visual del modal de impresion/reportes.

Slice actual
`TASK-1571`: `CommonReportPreviewModal` compacto y version de cache de exportacion en reporting.

Resultado actual
El footer del visor comun de reportes elimina el texto largo y usa acciones compactas `PDF`, `PDF Excel` y `Excel` con material visual comun, hints y `aria-label`. El cache key de exportaciones incorpora una version de render para que los PDF anteriores al ajuste formal no se reutilicen.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 2 passed.
- `npm run build` OK.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
Reportes clasicos y visor comun. Sin cambios en contratos API, plantillas, modelos, persistencia, UX BIM, rutas BIM ni modelos BIM.

TASK en progreso
`TASK-1568` / `TASK-1569`: ajuste formal de salidas PDF en reportes clasicos, implementado y validado.

TASK de control asociada
`TASK-1568`: control de PDF directo vertical y PDF desde Excel ajustado sin recortes.

Slice actual
`TASK-1569`: backend comun de reporting con PDF directo A4 vertical, anchos responsivos y bloques formales agrupados.

Resultado actual
El PDF directo ya no se genera apaisado: usa A4 vertical y calcula resumen, campos, imagenes y tablas contra el ancho real del documento. Excel a PDF conserva apaisado cuando la hoja lo requiere y ajusta alturas efectivas de filas para texto envuelto, reduciendo cortes de informacion. Los bloques principales se agrupan para evitar saltos en mitad de secciones formales cuando hay espacio para moverlos completos.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- `python -m pytest app/tests/test_reporting_stakeholders_excel_pdf.py -q` OK, 2 passed.
- `node scripts/smoke-classic-no-bim-contamination.mjs` OK.

Impacto
Reportes clasicos en backend comun. Sin cambios en frontend, plantillas, contratos API, PostgreSQL, modelos BIM, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1566` / `TASK-1567`: correccion de listados incrementales de Objetivos, Restricciones y Supuestos, implementada y validada.

TASK de control asociada
`TASK-1566`: control de edicion con espacios, alta visible y boton iconico.

Slice actual
`TASK-1567`: parseo/serializacion editable para los tres listados y boton `+` compacto.

Resultado actual
Los campos de Objetivos, Restricciones y Supuestos permiten escribir frases con espacios. El boton `+` crea una fila nueva visible porque las filas vacias se conservan durante la edicion. El boton `+ Agregar` queda reducido al simbolo `+` con `title` y `aria-label`.

Validacion ejecutada
- Prueba focal de serializacion OK.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico. Sin cambios en backend, reportes documentales, plantillas, modelos BIM, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1564` / `TASK-1565`: precision de intersecciones georreferenciadas en Datos de Proyecto, implementada y validada.

TASK de control asociada
`TASK-1564`: control para evitar posiciones genericas o parciales en busquedas de interseccion.

Slice actual
`TASK-1565`: Overpass como primera via para intersecciones ecuatorianas y limpieza de encabezado del modal.

Resultado actual
El modal de georreferenciacion ya no duplica coordenadas en el encabezado; el titulo queda con mayor jerarquia y las coordenadas permanecen en el panel lateral. Para direcciones tipo `calle principal y calle de interseccion`, el frontend consulta Overpass antes de aceptar respuestas del backend activo; backend comun y fallback frontend tambien cruzan geometrias OSM de ambas calles y solo aceptan resultados que contienen ambas calles. El caso `Miguel Velez y Rafael Maria Arizaga, Cuenca` devuelve `-2.8895224, -79.010998`, `zoom=18`, `source=overpass`.

Validacion ejecutada
- Validacion focal real Overpass OK.
- `python -m py_compile backend/app/api/endpoints/proyecto_detalles.py backend/app/schemas/proyecto_detalle.py` OK.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico y geocodificacion comun. Sin cambios en reportes documentales, plantillas, modelos BIM, UX BIM ni rutas BIM.

TASK en progreso
`TASK-1562` / `TASK-1563`: busqueda editable y tolerante a acentos en georreferenciacion de Datos de Proyecto, implementada y validada.

TASK de control asociada
`TASK-1562`: control de redefinicion de busqueda dentro del modal de georreferenciacion.

Slice actual
`TASK-1563`: input editable junto a `Localizar`, apertura con busqueda inmediata y variantes con/sin acentos.

Resultado actual
El boton de mapa junto a `Direccion Exacta` abre la vista completa y ejecuta la localizacion sin segundo clic. El modal de georreferenciacion incluye un campo editable junto a `Localizar`; al pulsar Enter o el boton se busca con ese texto. Backend comun y fallback temporal de navegador expanden variantes con y sin diacriticos, incluyendo aliases como `Simon`/`Simón` y `Bolivar`/`Bolívar`.

Validacion ejecutada
- `python -m py_compile backend/app/api/endpoints/proyecto_detalles.py backend/app/schemas/proyecto_detalle.py` OK.
- Prueba focal de candidatos con `Av. Simon Bolivar y Av. Loja` y `Av. Simón Bolívar y Av. Loja` OK.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico y geocodificacion comun. Sin cambios en modelos, reportes documentales, plantillas, UX BIM, rutas BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1560` / `TASK-1561`: compatibilidad de localizacion asistida ante backend activo sin reinicio, en validacion visual del usuario.

TASK de control asociada
`TASK-1560`: control del 405 `Method Not Allowed` en `geocode-address`.

Slice actual
`TASK-1561`: fallback de navegador para `Localizar` cuando el backend devuelve `404` o `405`.

Resultado actual
El codigo backend del endpoint nuevo esta correcto, pero el servicio activo en `localhost:3001` no lo tenia cargado y respondia 405. No se pudo reiniciar por permisos del sistema. `DatosProyecto` ahora intenta primero `proyectoDetalleApi.geocodeAddress`; si el backend devuelve `404` o `405`, usa un fallback modular de navegador con las mismas variantes de direccion ecuatoriana.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico, compatibilidad temporal de geocodificacion. Sin cambios en modelo, persistencia, reportes, cache oficial, plantillas ni BIM.

TASK en progreso
`TASK-1558` / `TASK-1559`: mejora de geocodificacion para direcciones ecuatorianas por interseccion en validacion visual del usuario.

TASK de control asociada
`TASK-1558`: control del patron Ecuador `calle principal + interseccion`.

Slice actual
`TASK-1559`: backend de `geocode-address` genera variantes de interseccion y reordena consultas de direccion.

Resultado actual
El backend reconoce direcciones como `Av. 12 de Abril y Av. Loja` dentro del campo unico `direccion`, genera variantes con `y`, `&`, `con`, `/` y coma, y agrega fallbacks por calle principal/calle de interseccion. Tambien deduplica contexto para evitar `Cuenca, Cuenca` cuando ciudad y canton coinciden.

Validacion ejecutada
- `python -m py_compile backend/app/api/endpoints/proyecto_detalles.py backend/app/schemas/proyecto_detalle.py` OK.
- Prueba focal de candidatos para `Av. 12 de Abril y Av. Loja`, `Cuenca`, `Azuay`, `Ecuador`: OK.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico y backend comun de geocodificacion. Sin cambios en modelo, persistencia, cache de reportes, plantillas, UX BIM ni acoplamientos BIM.

TASK en progreso
`TASK-1556` / `TASK-1557`: recuperacion de localizacion asistida por direccion en Datos de Proyecto en validacion visual del usuario.

TASK de control asociada
`TASK-1556`: control de geocodificacion asistida desde backend comun.

Slice actual
`TASK-1557`: endpoint backend `POST /proyecto-detalles/geocode-address` y frontend consumiendo `proyectoDetalleApi.geocodeAddress`.

Resultado actual
La accion `Localizar` ya no llama directamente a `nominatim.openstreetmap.org` desde el navegador. El backend comun construye candidatos de direccion, consulta Nominatim con `User-Agent`/`Referer` de GiProy y devuelve latitud, longitud, zoom y mensaje de precision. `DatosProyecto` actualiza coordenadas/zoom y marca la cache del mapa como `pending` para regeneracion posterior.

Validacion ejecutada
- `python -m py_compile backend/app/api/endpoints/proyecto_detalles.py backend/app/schemas/proyecto_detalle.py` OK.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos de Proyecto clasico y backend comun de proyecto-detalles. Sin cambios en UX BIM, rutas BIM, modelos BIM, reportes documentales, plantillas ni acoplamientos hacia BIM.

TASK en progreso
`TASK-1554` / `TASK-1555`: limpieza visual de georreferenciacion lateral en Datos de Proyecto en validacion visual del usuario.

TASK de control asociada
`TASK-1554`: control de retirada de labels laterales y ampliacion de mapa.

Slice actual
`TASK-1555`: Datos de Proyecto clasico amplia el mapa lateral y conserva feedback solo en vista completa.

Resultado actual
La tarjeta lateral de georreferenciacion ya no muestra el bloque `Resultado de localizacion` ni la nota auxiliar bajo el mapa. El contenedor del mapa lateral pasa de `270px` a `350px`. La vista completa mantiene el resultado de localizacion para no perder feedback durante la edicion.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- Busqueda focal confirma que `Resultado de localizacion` permanece solo en la vista completa.

Impacto
Datos de Proyecto clasico, UX puntual de georreferenciacion lateral. Sin cambios en backend, reportes, cache georreferenciada, plantillas, persistencia, permisos ni BIM.

TASK en progreso
`TASK-1552` / `TASK-1553`: plantilla ampliada de Datos de Proyecto / Acta de Constitucion en validacion visual del usuario.

TASK de control asociada
`TASK-1552`: control de sustitucion de plantilla productiva y cobertura de placeholders.

Slice actual
`TASK-1553`: copia de plantilla ampliada a `docs/reportes` y ajuste del backend para sus 32 placeholders.

Resultado actual
`docs/reportes/001 - Acta de Constitucion - General.xlsx` queda sustituida por la plantilla ampliada de `tmp/adicionar`. `backend/app/services/reporting.py` cubre los nuevos placeholders de alcance, medicion, presupuesto, cliente, objetivos, restricciones y supuestos, e inserta georreferenciacion/imagen referencial antes del reemplazo textual para que Excel y PDF desde Excel mantengan imagenes.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- Validacion focal de plantilla ampliada: 32 placeholders cubiertos, 2 imagenes insertadas y 0 placeholders residuales.
- Generacion real proyecto `7`, empresa `3`: `tmp/acta_constitucion_ampliada_validacion.xlsx`, 83 KB, 2 imagenes y 0 placeholders residuales.
- Preview real `acta_constitucion` proyecto `7`: OK, 27 campos, mapa e imagen disponibles.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Reporte clasico Datos de Proyecto / Acta de Constitucion y plantilla Excel productiva. Sin cambios BIM, sin UX BIM y sin acoplamientos nuevos.

TASK en progreso
`TASK-1550` / `TASK-1551`: cache universal de mapa georreferenciado por proyecto en validacion visual del usuario.

TASK de control asociada
`TASK-1550`: control de referencia georreferenciada unica por proyecto.

Slice actual
`TASK-1551`: persistencia y refresco recuperable de `georreferenciacion.png` para reportes de Datos de Proyecto.

Resultado actual
Datos de Proyecto clasico guarda metadatos de cache georreferenciada en `proyecto_detalles`. Al guardar coordenadas/zoom se intenta generar `uploads/proyectos/{empresa_id}/{codigo_root}/georef/georreferenciacion.png`; si falla, queda `pending` con error trazable y se reintenta al leer el detalle o generar reportes. Reporting usa primero la imagen cacheada vigente y solo despues recompone mapa/fallbacks.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py backend/app/api/endpoints/proyecto_detalles.py backend/app/models/proyecto_detalle.py backend/app/schemas/proyecto_detalle.py backend/alembic/versions/ab6c7d8e9f10_project_georef_map_cache.py` OK.
- `alembic upgrade ab6c7d8e9f10` OK sobre la rama de georreferenciacion.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Backend comun y Datos de Proyecto clasico. La georreferenciacion es unica por proyecto, no por usuario ni por revision. Sin cambio de proveedor de mapas y sin tocar BIM.

TASK en progreso
`TASK-1548` / `TASK-1549`: georreferenciacion real en reportes de Datos de Proyecto en validacion visual del usuario.

TASK de control asociada
`TASK-1548`: control de imagen real de mapa para Acta de Constitucion.

Slice actual
`TASK-1549`: backend reporting compone mapa desde teselas OSM usando `latitud`, `longitud` y `map_zoom` del proyecto.

Resultado actual
`backend/app/services/reporting.py` intenta ahora generar primero un PNG real con teselas `tile.openstreetmap.org`, centrado en la coordenada del proyecto y con el zoom guardado por el usuario. El static map externo queda como segunda via y el snapshot sintetico queda solo como ultimo fallback. Se cachean teselas e imagen final.

Validacion ejecutada
- `python -m py_compile backend/app/services/reporting.py` OK.
- Prueba focal con red: `_build_project_osm_tile_map_bytes(...)` genero PNG real de `85606` bytes.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Backend comun de reporting para Datos de Proyecto clasico. Sin cambios en modelo de datos, APIs publicas, frontend, plantillas, permisos, persistencia ni BIM.

TASK en progreso
`TASK-1546` / `TASK-1547`: cierre de homogeneidad de hints visuales con `AppHint` en validacion visual del usuario.

TASK de control asociada
`TASK-1546`: control del segundo pase de hints visuales restantes.

Slice actual
`TASK-1547`: migracion de Curva S/chips de Cronogramas, descripcion de Bases de Trabajo, `MarketplaceOriginBadgeSet` y ayuda de tramos automaticos a `AppHint`.

Resultado actual
El sistema visual de hints queda concentrado en `AppHint` con variantes clara y oscura. Los casos visuales detectados fuera del primer pase ya no mantienen tooltips propios ni portales locales. Los `title` nativos restantes se consideran fallback accesible en botones, modales, campos o celdas truncadas, no un sistema visual paralelo.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Frontend clasico y componentes comunes no BIM. Sin cambios en backend, APIs, PostgreSQL, calculos, reportes documentales, exportaciones, permisos, persistencia ni BIM.

TASK en progreso
`TASK-1544` / `TASK-1545`: estandarizacion transversal de hints claros y oscuros en validacion del usuario; no cerrar sin confirmacion visual expresa.

TASK de control asociada
`TASK-1544`: control del patron comun `AppHint` para hints visuales clasicos.

Slice actual
`TASK-1545`: helper `AppHint` y migracion de wrappers existentes en Gantt, rail oscuro, presupuesto, catalogo lateral y boton generico de reportes.

Resultado actual
Se crea `frontend/src/components/ui/AppHint.jsx` con variantes `light` y `dark`, portal y parametros de posicionamiento. `GanttHeaderTooltip`, `ControlRailTooltip`, `BudgetToolbarTooltip`, `CatalogSidebarCard` y `ProjectSectionReportButton` usan el helper comun para una lectura homogenea. El boton generico de reportes mantiene `aria-label` y evita tooltip nativo visible cuando ya hay hint visual.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Frontend clasico, patron visual transversal de hints/tooltips. Sin cambios en calculos, reportes documentales, preview/export, backend, APIs, PostgreSQL, permisos, persistencia ni BIM. No cerrar hasta confirmacion visual expresa del usuario.

TASK en progreso
`TASK-1542` / `TASK-1543`: compactacion transversal de botones de reportes de Proyecto en validacion del usuario; no cerrar sin confirmacion visual expresa.

TASK de control asociada
`TASK-1542`: control del patron icon-only compacto para reportes en subsecciones principales de Proyecto.

Slice actual
`TASK-1543`: `ProjectSectionReportButton` icon-only y Presupuesto alineado al boton comun.

Resultado actual
`ProjectSectionReportButton` ya no renderiza el boton stacked grande con label `Reporte`; ahora muestra solo el icono de reporte en un boton compacto con `title`/`aria-label`. `PresupuestoDetail` adopta el mismo componente comun y conserva su funcionalidad de abrir la configuracion de reporte profesional.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Proyecto clasico frontend, solo patron visual y reutilizacion del boton de reportes. Sin cambios en preview/export, reporting service, backend, plantillas, calculos, persistencia ni BIM. No cerrar hasta confirmacion visual expresa del usuario.

TASK en progreso
`TASK-1540` / `TASK-1541`: limpieza visual del header de Cronograma Valorado en validacion del usuario; no cerrar sin confirmacion visual expresa.

TASK de control asociada
`TASK-1540`: control de retiro de labels no operativos del header oscuro de Cronograma Valorado.

Slice actual
`TASK-1541`: retiro del titulo `Cronograma valorado` y subtitulo `Matriz base del presupuesto`.

Resultado actual
El header oscuro de Cronograma Valorado ya no muestra el bloque textual superior. Se conserva la barra operativa de controles y acciones, sin cambios en reportes, Gantt, cash flow, footer, calculos, backend ni persistencia.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Cronogramas clasicos frontend, solo limpieza visual de header en Cronograma Valorado. Sin UX BIM, rutas BIM ni acoplamientos nuevos. No cerrar hasta confirmacion visual expresa del usuario.

TASK en progreso
`TASK-1538` / `TASK-1539`: compactacion de bordes del rail de proyecto clasico en validacion del usuario; no cerrar sin confirmacion visual expresa.

TASK de control asociada
`TASK-1538`: control de alineacion del rail lateral con botones de trabajo clasicos.

Slice actual
`TASK-1539`: reversion del boton suave intermedio, refuerzo de bordes, compactacion del estado colapsado, prueba modular de reveal del label, suavizado de apertura del panel y estabilizacion de caja interna de botones.

Resultado actual
El rail vertical de `Proyectos` conserva el boton anterior con activo oscuro. Se descarta la version intermedia mas pesada, se agregan bordes sutiles al boton y al contenedor del icono, el boton mantiene `w-full h-[58px]` en colapsado y expandido para evitar salto horizontal interno, se muestra el punto de color del modulo activo centrado verticalmente sobre el borde derecho en colapsado, se prueba una animacion modular de reveal del label al expandir y el contenedor abre/cierra con `MotionAside` por `spring`.

Diagnostico actual
La brusquedad no venia del `spring` del panel, sino del cambio inmediato de clases internas del boton: de caja fija centrada (`mx-auto w-[58px]`) a caja expandida (`w-full justify-start px-4`). Se estabiliza esa caja para que el boton crezca junto al panel.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- `npx eslint src/pages/Proyectos.jsx src/components/projects/ProjectSectionNavButton.jsx` quedo bloqueado en una pasada intermedia por deuda previa de `Proyectos.jsx` no relacionada con este slice.

Impacto
Proyectos clasico frontend, solo capa visual del rail de secciones. Sin cambios en permisos, rutas, reportes de cronogramas, backend, persistencia ni BIM. No cerrar hasta confirmacion visual expresa del usuario.

TASK en progreso
`TASK-1536` / `TASK-1537`: selector explicito de reportes de Cronogramas clasicos en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1536`: control de adecuacion de accesos a reportes de cronogramas.

Slice actual
`TASK-1537`: menu explicito de variantes de reporte documental.

Resultado actual
El boton `Reporte` de Cronograma Valorado deja de depender de una pestaña visible `flujo_caja` ya retirada y abre opciones explicitas: `Cronograma valorado`, `Flujo de caja` y `Reporte integrado`. En Gantt, el menu separa `Reporte Gantt`, `Reporte integrado` y `MS Project`, manteniendo la interoperabilidad MS Project como accion aparte. La exportacion usa la variante real del preview cuando existe.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Cronogramas clasicos frontend, solo acceso/seleccion de variantes de reporte. Sin cambios backend, `reporting_service`, `cash_flow`, `footer`, calculos, Gantt, Cronograma Valorado, Presupuesto/APU, persistencia ni BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1534` / `TASK-1535`: buscador claro en Desagregacion dentro de rail oscuro en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1534`: control visual de buscador claro en Desagregacion.

Slice actual
`TASK-1535`: ajuste conservador del `ClearSearchField` principal de Desagregacion.

Resultado actual
El buscador principal de Desagregacion mantiene el rail oscuro, pero el campo de edicion pasa a fondo blanco explicito con borde claro, inset shadow, texto oscuro, placeholder gris e icono con foco naranja. Se conserva el boton `Sgte`, el contador y la navegacion de coincidencias.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Desagregacion clasica frontend, solo capa visual. Sin cambios de busqueda funcional, CPC, VAE, reportes, persistencia, backend ni BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1532` / `TASK-1533`: altura uniforme de islas del rail superior en Gantt clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1532`: control visual de altura uniforme en islas de funciones del rail Gantt.

Slice actual
`TASK-1533`: normalizacion conservadora de altura vertical en rail superior Gantt.

Resultado actual
Las tres islas principales del rail superior oscuro de Gantt comparten una altura visual comun de `60px`. Las secciones internas ocupan el alto completo para que busqueda, navegacion critica y herramientas/zoom queden alineadas verticalmente sin cambiar iconos, acciones, tooltips ni comportamiento.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Gantt clasico frontend, solo capa visual. Sin cambios de calculo, dependencias, rutas, drag, zoom funcional, persistencia, backend, Presupuesto/APU, Cronograma Valorado ni BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1530` / `TASK-1531`: subbarra financiera operativa en Cronograma Valorado clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1530`: control de subbarra financiera compacta, operativa y sin choque de controles.

Slice actual
`TASK-1531`: el boton universal del rail superior alterna resumen compacto/completo y la subbarra financiera queda siempre visible.

Resultado actual
Se elimina el boton circular local de la subbarra financiera y su funcionalidad pasa al boton universal. La subbarra queda en una sola linea con chips operativos de `Estado`, `Origen`, `Total`, `Pico` y `Riesgo`/`Pendiente`, siguiendo una semantica visual compacta similar a Presupuesto y llevando el detalle secundario a tooltips. Correccion posterior: el `Resumen compacto` inferior adopta tambien chips compactos tipo Presupuesto, alineados a la derecha, con datos operativos visibles y conserva su skin oscuro. El bloque `Impacto reconciliacion` pasa a `Semaforo reconciliacion` con estados `OK`, `Impacto` y `Revisar`. La cabecera refuerza `Cronograma valorado` como titulo principal y deja `Matriz base del presupuesto` como descripcion secundaria. Las tabs del valorado quedan alineadas a la derecha dentro del rail y la busqueda se reubica entre grupos de acciones con mayor ancho util. La subbarra superior de chips de `Inversion` adopta gris neutro operativo. Las opciones de configuracion del valorado quedan compactadas e integradas como banda oscura bajo el header general del panel; el semaforo de reconciliacion se une al grupo de chips de lectura y los controles quedan agrupados a la derecha como acciones independientes. El expansor de `Curva S` queda contenido en la zona de trabajo entre header oscuro y footer oscuro, se contrae al cambiar de seccion y la linea acumulada cruza sus puntos de inflexion. El mando del resumen inferior usa icono de lista/detalle.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Cronograma Valorado clasico frontend. Sin backend, sin cambios de calculo, sin cambios en `footer`, `cash_flow`, `Gantt -> Valorado -> Caja`, `Recalcular desde Gantt`, Presupuesto/APU, `CronogramaGantt`, licencias ni BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1528` / `TASK-1529`: resumen economico compacto/completo en Cronograma Valorado clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1528`: control de resumen economico mixto compacto/completo.

Slice actual
`TASK-1529`: el boton circular de la franja financiera alterna el resumen inferior compacto/completo.

Resultado actual
El resumen economico inferior queda en modo compacto por defecto con una sola linea de total, pico, avance y cantidad de periodos. El boton circular existente de la franja `Lectura financiera` deja de plegar esa franja y ahora despliega o repliega el resumen completo de 4 filas. La franja financiera permanece siempre compacta en una sola linea.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Cronograma Valorado clasico frontend. Sin backend, sin cambios de calculo, sin cambios en `footer`, `cash_flow`, `Gantt -> Valorado -> Caja`, `Recalcular desde Gantt`, Presupuesto/APU, `CronogramaGantt`, licencias ni BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1526` / `TASK-1527`: unificacion visual de `Inversion` y `Flujo caja` en Cronograma Valorado clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1526`: control de unificacion visual inversion/caja dentro de Cronograma Valorado.

Slice actual
`TASK-1527`: `Inversion` absorbe la lectura financiera de caja sin tocar calculos ni contratos backend.

Resultado actual
Se retira la pestaña visible separada `Flujo caja` y se integra su lectura como bloque plegable `Lectura financiera` dentro de `Inversion`. Ajuste posterior: la franja queda reducida a una sola linea horizontal con indicadores semaforizados, datos secundarios en tooltip nativo y acciones en botones de icono. Se conserva internamente `cash_flow` para origen, total, pico, horas efectivas, categorias, consistencia, restriccion financiera, propuestas y reportes. El pie de la matriz queda como lectura economica unica: `Inversion periodo`, `Inversion acumulada`, `% periodo` y `% acumulado`.

Validacion ejecutada
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- Validacion repetida tras compactar la franja financiera: `npm run build` OK y `npm run smoke:gantt-classic` OK.

Impacto
Cronograma Valorado clasico frontend. Sin backend, sin cambios de calculo, sin cambios en `Gantt -> Valorado -> Caja`, sin cambios en `Recalcular desde Gantt`, sin Presupuesto/APU, sin `CronogramaGantt`, sin licencias y sin BIM. No cerrar hasta confirmacion expresa del usuario en UI real.

TASK en progreso
`TASK-1524` / `TASK-1525`: guia visual de inicio y fin de proyecto en Gantt clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1524`: control de guia visual de limites de proyecto del Gantt clasico.

Slice actual
`TASK-1525`: el timeline del Gantt clasico muestra lineas verticales sutiles para inicio y fin de proyecto y atenúa las zonas fuera del rango del proyecto.

Resultado actual
Se incorpora una capa visual no interactiva sobre el timeline: atenua el tiempo anterior al inicio y posterior al fin del proyecto, y marca ambos limites con lineas finas. La capa usa `pointer-events: none`, queda separada del motor de dependencias y no modifica fechas, calendario, reglas `FS/SS/FF/SF`, preview, commit, backend ni datos persistidos. Ajuste posterior: las lineas se pintan como cajas reales de `1px` clampadas dentro del timeline para que no se recorten en el borde visible, el zoom por slider fuerza refresco estable de viewport/rutas en doble frame, el rango visual añade aire dinamico antes/despues del proyecto desde un minimo de `96px`, simetrico para inicio y fin, y las guias bajan a plano de fondo para no competir con rutas/hitos cuando coinciden. Ajuste posterior de hito: las rutas que entran o salen de hitos usan siempre el centro del rombo como ancla temporal; inicio/fin exacto de proyecto solo afecta a la representacion visual del rombo frente a la guia.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-zoom.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-manual-milestone-drag.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-manual-milestone-dependencies.mjs` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- `npm run build` OK.

Impacto
Gantt clasico frontend, solo capa visual. Sin backend nuevo, sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM. No cerrar hasta confirmacion expresa del usuario.

TASK en progreso
`TASK-1522` / `TASK-1523`: saneamiento visual de zoom fluido del Gantt clasico en validacion del usuario; no cerrar sin confirmacion expresa.

TASK de control asociada
`TASK-1522`: control de zoom fluido y foco temporal del Gantt clasico.

Slice actual
`TASK-1523`: el zoom del Gantt clasico mantiene foco en el inicio temporal de la tarea/hito seleccionado, agrupa cambios por frame y refresca rutas despues de estabilizar viewport/virtualizacion.

Resultado actual
Se corrige la causa visual de rutas incoherentes tras zoom: `dependencyPaths` podia medir DOM con zoom nuevo pero `scrollLeft`/ventana virtual anterior, y solo quedaba bien al desplazar el viewport. `captureTimelineAnchor(...)` prioriza el inicio temporal de la tarea/hito seleccionado y mantiene el centro visible si no hay seleccion. Los cambios por rueda/slider se agrupan por `requestAnimationFrame`; la rueda acumula contra el zoom pendiente, no contra un `zoomLevel` antiguo. Tras aplicar el `scrollLeft` anclado se fuerzan snapshots horizontal/vertical y refresco de rutas en doble frame. No se tocan reglas `FS/SS/FF/SF`, `buildDependentScheduleDrafts`, `previewCommitContract`, calendario laboral, backend ni datos reales.

Refuerzo actual
El zoom con seleccion centra el inicio visual real de la tarea/hito/subtramo seleccionado, incluyendo `gantt_subbars`, para que una pieza mayor que el viewport mantenga visible su punto de entrada. Las rutas `hito -> tarea` sin lag evitan rodeos heredados, la capa interactiva de dependencias se desactiva durante scroll/zoom reducido y los hitos se elevan por encima del SVG de rutas para no perder captura de drag tras zoom.

Correccion posterior
En escala hora/zoom alto, el rombo del hito seguia pareciendo fuera de posicion porque su `left` visual coincidia con la fecha real. Se centra el rombo sobre esa fecha, de modo que el centro del hito y la salida de la ruta representan el mismo instante temporal.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-dependencies.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-manual-milestone-drag.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-manual-milestone-dependencies.mjs` OK.
- `node scripts/smoke-cronogramas-gantt-zoom.mjs` OK.
- `node scripts/smoke-gantt-preview-commit-double-blind.mjs` OK con `1326` comprobaciones.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- `npm run build` OK.

Impacto
Gantt clasico frontend y QA visual de zoom; sin cambio de calculo, sin backend nuevo, sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM. No cerrar hasta confirmacion expresa del usuario.

Nota de datos
Santiago Bermeo queda coherente tras el undo defectuoso observado: hito manual `hm-mok8sj9c-j04f` en `2026-05-12T08:00:00`, sucesora `49` en `2026-05-12T08:00:00 -> 2026-05-12T10:18:43`; backup `tmp/santiago_bermeo_gantt_manual_boundary_backup_20260506_185537.json`.

Nota operativa
No se pudo reiniciar `GiProy-Frontend` desde Codex: Windows devolvio `Acceso denegado` al servicio. El build queda generado con bundle `CronogramaGantt-BF4h7_AQ.js`; si la UI servida conserva codigo anterior, hay que reiniciar el frontend fuera de esta sesion o refrescar la instancia que sirve Vite.

TASK en progreso
`TASK-1515`: saneamiento integral preview/commit de movimiento Gantt clasico sigue en validacion del usuario; se corrigio el borde negativo de fin de jornada y duracion cero.

TASK en progreso
`TASK-1516`: saneamiento real del Gantt de `Santiago Bermeo` ejecutado y pendiente de confirmacion expresa del usuario.

TASK de control asociada
`TASK-1511`: frente Gantt clasico en validacion del usuario, no cerrado.

Slice actual
`TASK-1516`: reparacion de datos reales despues de que el hito manual `hm-mok8sj9c-j04f` quedara huerfano (`successor_dependencies: []`) y desplazado a `2026-06-02T08:00:00`.

Resultado actual
Se ejecuto `tmp/rebuild_santiago_gantt_dependencies_clean.py`. El script creo backup `tmp/santiago_bermeo_gantt_clean_rebuild_backup_20260506_113203.json` y snapshot `tmp/santiago_bermeo_gantt_relations_snapshot_20260506_113203.json`; restauro el hito a `2026-03-24T08:00:00`, reinyecto la relacion manual `FS -> linea 49` y recalculo `187` filas. La linea `49` queda `2026-03-24T08:00:00 -> 2026-03-24T10:18:43`.

Validacion ejecutada
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` tareas antes del inicio, `0` incidencias.
- `python tmp/validate_santiago_gantt_integrity.py` OK: `dependency_issue_count=0`.
- `python tmp/validate_santiago_gantt_rules_independent.py` OK: `29` dependencias linea-linea (`28 FS`, `1 FF`), `1` hito-linea, `manual_dependency_checks=1`, `issues_count=0`.
- `python tmp/audit_santiago_gantt_links.py` OK: hito enlazado contra linea `49`.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.

Impacto
Datos reales del Gantt clasico de `Santiago Bermeo`; sin UX BIM, sin rutas BIM, sin dependencias BIM y sin acoplamientos nuevos. No cerrar hasta confirmacion expresa del usuario.

TASK en progreso
`TASK-1511` / `TASK-1515`: saneamiento integral preview/commit de movimiento Gantt clasico pendiente de confirmacion expresa del usuario.

TASK de control asociada
`TASK-1511`: en validacion del usuario, no cerrada.

Slice actual
`TASK-1515`: saneamiento integral preview/commit de movimiento Gantt aplicado y pendiente de validacion visual/funcional del usuario. `TASK-1512` y `TASK-1513` quedan como diagnostico/implementacion previa absorbidos. `TASK-1514` no se usa como evidencia DOM por instruccion expresa.

Resultado actual
Se aplica saneamiento del calculo integral de movimiento en Gantt clasico y de la frontera entre modos de interaccion. La causa no era solo dibujo: preview y commit podian reinterpretar la red completa con `buildDependentScheduleDrafts(...)` y, ademas, el cuerpo del hito manual podia activar `beginDependencyLinkFromDragInteraction(...)` por deriva vertical, mezclando preview de movimiento con preview de enlace/lag. Ahora el preview guarda `previewCommitContract`; al soltar se recalcula el commit y se bloquea si difiere. El hito manual usa `resolveManualMilestoneMovePreview(...)`, traslada cascada con `buildManualMilestoneCascadeShiftDrafts(...)`, conserva `start_date === end_date`, muestra fecha-hora y delta real en el helper, apaga el preview si `effectiveLaborDelta` es cero, no inicia dependencias desde el cuerpo, desactiva la capa interactiva/guia generica incompatible durante ese modo y limpia previews incompatibles al cambiar entre drag y enlace explicito. Correccion posterior: el commit de hito manual usa la version efectiva con overlays de `successor_dependencies`, preserva sucesoras al mover y cancela si un hito con sucesoras no genera cascada dependiente.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-manual-milestone-drag.mjs` OK.
- `node scripts/smoke-gantt-preview-commit-double-blind.mjs` OK con `1326` comprobaciones: `78` temporales + `1248` de puntero/escala/scroll, cubriendo `6` nodos movidos, `13` deltas temporales (`0 min`, minutos, horas, media jornada, dias completos, cruce de fin de semana y desplazamientos negativos), escalas dia/semana/mes, scroll virtual, ruido subpixel, tareas, hitos, duracion cero y `FS/SS/FF/SF`.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- `npm run build` OK.
- Sin DOM como evidencia de cierre por instruccion expresa del usuario y por comportamiento no fiable en este caso.
- No cerrado: queda pendiente la confirmacion expresa del usuario.

Impacto
UI/calculo de interaccion Gantt clasico; sin backend nuevo, sin datos productivos, sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM.

TASK en progreso
Sin TASK activa real.

TASK de control asociada
`TASK-1510`: completada al 100%.

Slice actual
`TASK-1510`: correccion en Gantt clasico para que el drag/drop de hitos manuales use el delta horizontal real del puntero al soltar y para que las rutas SVG durante el preview usen la geometria calculada de las sucesoras movidas por `activeMovePreviewDrafts`, no la caja DOM anterior o en transicion.

Resultado actual
`CronogramaGantt.jsx` mantiene la barra activa del hito siguiendo el puntero, clasifica `pointerup` de hitos manuales por `lastHorizontalDeltaPx`, y para sucesoras en preview fuerza geometria calculada desde el draft temporal antes de rutear dependencias. El helper visible muestra `Moviendo hito` y la fecha real del draft temporal.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-manual-milestone-drag.mjs` OK.
- `npm run smoke:gantt-classic` OK, incluyendo `smoke-classic-no-bim-contamination`.
- `npm run build` OK.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1508`: completada al 100%.

Slice actual
`TASK-1509`: implementacion y saneamiento limpio completados al 100%. Se toma snapshot de relaciones, se borran datos antiguos de dependencias/predecesoras/fechas y se reconstruye la red real de `Santiago Bermeo`.

Resultado actual
`CronogramaGantt.jsx` deja de desplazar cascadas antiguas por delta al mover un hito manual y usa la relacion autoritativa para preview y commit. El Gantt real de `Santiago Bermeo`, proyecto `7`, presupuesto `13`, queda saneado con hito inicial `hm-mok8sj9c-j04f` en `2026-03-24T08:00:00` y sucesora `49` en `2026-03-24T08:00:00 -> 2026-03-24T10:18:43`.

Validacion ejecutada
- Backup: `tmp/santiago_bermeo_gantt_clean_rebuild_backup_20260505_160910.json`.
- Snapshot: `tmp/santiago_bermeo_gantt_relations_snapshot_20260505_160910.json`.
- `python tmp/audit_santiago_gantt_links.py` OK: hito `2026-03-24T08:00:00`, linea `49` `2026-03-24T08:00:00 -> 2026-03-24T10:18:43`.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` tareas antes del inicio, `0` incidencias.
- `python tmp/validate_santiago_gantt_integrity.py` OK: `dependency_issue_count=0`.
- `python tmp/validate_santiago_gantt_rules_independent.py` OK: validador externo sin motor, `187` filas, `29` dependencias linea-linea (`28 FS`, `1 FF`), `1` hito-linea, `0` divergencias.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas, `0` incidencias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK.

Impacto
Gantt clasico y datos reales de `Santiago Bermeo`; sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1504`: completada al 100%.

Slice actual
`TASK-1505`: implementacion y saneamiento real completados al 100%. Se protege el commit de hito manual para no reinterpretar la cascada como una nueva planificacion completa que pueda vulnerar el inicio del proyecto.

Resultado actual
`CronogramaGantt.jsx` traslada la cascada de sucesores del hito por el delta laboral real del movimiento y mantiene la validacion de no guardar tareas antes de la fecha/hora de inicio del proyecto. El Gantt real de `Santiago Bermeo`, proyecto `7`, presupuesto `13`, fue recalculado con backup `tmp/santiago_bermeo_gantt_full_rebuild_backup_20260505_154838.json`.

Validacion ejecutada
- `python tmp/validate_santiago_gantt_integrity.py` OK: `187` filas, `0` tareas antes de `2026-03-24T08:00:00`, `0` incidencias de dependencias.
- `python tmp/audit_santiago_gantt_full.py` OK: `manual_milestone_count=1`, `FS=28`, `FF=1`, `before_project_start_count=0`, `dependency_issue_count=0`, `manual_issue_count=0`.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas, `0` incidencias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK.

Impacto
Gantt clasico y datos reales de `Santiago Bermeo`; sin Presupuesto/APU, sin Cronograma Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1502`: completada al 100%.

Slice actual
`TASK-1503`: implementacion completada al 100%. Se corrige el movimiento por horas del hito manual y se evita rehidratacion parcial de cascada tras soltar.

Resultado actual
`CronogramaGantt.jsx` deja de tratar el hito manual como movimiento entero de dias. En escala `HORA`, la fecha/hora del hito se resuelve desde el pixel real del timeline y se guarda como `start_date/end_date`. La cascada de sucesores de hito manual fuerza refresco completo del Gantt para que la vista no quede parcial hasta recargar.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-drag-preview-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: hito `hm-mok8sj9c-j04f`, `bar_delta_px=220`, `pointer_drag_px=220`, `target_delta_px=220`.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas, `0` incidencias.
- `node scripts/validate-gantt-santiago-full-dom.mjs` OK: `0` diagonales, `0` rutas directas indebidas, `0` rutas vacias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1500`: completada al 100%.

Slice actual
`TASK-1501`: implementacion completada al 100%. Se corrige el preview no fluido del hito manual y se evita que un drag rechazado deje patches locales sucios hasta refrescar.

Resultado actual
`CronogramaGantt.jsx` pinta el hito manual activo con el delta real del puntero, por lo que en escala `HORA` y zoom alto el rombo sigue al raton. Ademas, si una persistencia optimista de drag devuelve `null` por validacion funcional, `drafts` vuelve al snapshot previo y no queda una representacion falsa hasta recargar.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-drag-preview-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: hito `hm-mok8sj9c-j04f`, `bar_delta_px=220`, `pointer_drag_px=220`.
- `node scripts/validate-gantt-manual-milestone-drag-release-dom.mjs` OK: bloqueo seguro cuando la cascada real viola inicio de proyecto.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `node scripts/validate-gantt-ff-predecessor-dom.mjs` OK: no rehidrata fechas de febrero.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas, `0` incidencias.
- `node scripts/validate-gantt-santiago-full-dom.mjs` OK: `0` diagonales, `0` rutas directas indebidas, `0` rutas vacias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1498`: completada al 100%.

Slice actual
`TASK-1499`: saneamiento real completado al 100% sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`.

Resultado actual
El hito manual `hm-mok8sj9c-j04f` habia quedado visible pero huerfano, sin `successor_dependencies`, por lo que no gobernaba la ruta. Se creo backup `tmp/santiago_bermeo_gantt_manual_link_backup_20260505_105254.json`, se restauro el hito a `2026-03-24T08:00:00`, se enlazo como `FS -> linea 49` y se reconstruyo `schedule_data` con el motor oficial.

Validacion ejecutada
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `python tmp/validate_santiago_gantt_integrity.py` OK: relacion `1.1.6 -> 1.1.7` conserva `FF`, `0` incidencias.
- `python tmp/audit_santiago_gantt_links.py` OK: hito `hm-mok8sj9c-j04f` enlazado a linea `49`.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas, `0` incidencias.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK: `route_d="M 12 166 L 12 106"`.
- `node scripts/validate-gantt-santiago-full-dom.mjs` OK: `0` diagonales, `0` rutas directas indebidas, `0` rutas vacias.
- `npm run smoke:gantt-classic` OK.

Impacto
Datos Gantt clasico de `Santiago Bermeo`; sin codigo funcional nuevo, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1496`: completada al 100%.

Slice actual
`TASK-1497`: implementacion completada al 100%. Se sincroniza el preview y el commit del hito manual para que hito, sucesora y ruta se muevan/calculen juntos.

Resultado actual
Durante el drag de un hito manual se construyen patches de sucesores y la capa de dependencias usa el estado temporal completo. Al soltar, el commit guarda hito y sucesora con el mismo inicio cuando la relacion `FS` sin lag lo exige.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-drag-preview-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: hito movido `-292.56px`, sucesora `-320px`, ruta actualizada.
- `node scripts/validate-gantt-manual-milestone-drag-release-dom.mjs` OK: hito `hm-mok8sj9c-j04f` y linea `49` guardados en `2026-06-01T08:00:00`, ruta final con `2` comandos.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas calculadas, `0` incidencias.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1494`: completada al 100%.

Slice actual
`TASK-1495`: implementacion completada al 100%. Se recupera el movimiento real del hito manual inicial y se conserva la regla visual de linea vertical limpia cuando la dependencia hito -> tarea esta practicamente alineada.

Resultado actual
El hito manual vuelve a recibir `pointerdown` por encima de la capa SVG de dependencias. Las rutas con hito casi alineado colapsan a una X unica, evitando diagonales cortas o micro-codos.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: `route_d="M 579 166 L 579 106"`.
- `node scripts/validate-gantt-manual-milestone-drag-preview-dom.mjs` OK: hito `hm-mok8sj9c-j04f` movido `310.86px` y ruta estable `M 579 166 L 579 106`.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas calculadas, `0` incidencias.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1492`: completada al 100%.

Slice actual
`TASK-1493`: implementacion completada al 100%. Se estabiliza el preview de arrastre de hito manual para que mover el hito no deforme la red de dependencias confirmada ni genere codos/ghosts temporales en el Gantt estable.

Resultado actual
El hito manual puede moverse visualmente durante el drag, pero `dependencyPaths` deja de recalcularse con `activeMovePreviewDrafts` y el drag de hito manual ya no genera cascada visual temporal. La cascada real se mantiene en el flujo de soltar/guardar.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-drag-preview-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: hito `hm-mok8sj9c-j04f` movido `310.86px`, ruta estable `M 414.5 166 L 414.5 106`.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas calculadas, `0` incidencias.
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.

Impacto
UI Gantt clasico; sin backend, sin datos productivos, sin Presupuesto/Valorado directo, sin licencias y sin BIM.

TASK de control asociada
`TASK-1490`: completada al 100%.

Slice actual
`TASK-1491`: saneamiento real completado al 100% sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`. Se reconstruyo `schedule_data` desde el motor oficial con backup previo `tmp/santiago_bermeo_gantt_full_rebuild_backup_20260502_201515.json` y se ajusto el router visual para que una dependencia con hito alineado use linea vertical limpia, sin codo lateral.

Resultado actual
El cronograma servido por backend queda consistente: `187` filas, `0` filas antes del inicio del proyecto y `0` incidencias de dependencias. La relacion `1.1.6 -> 1.1.7` queda persistida como `FF` (`source_id=71`, `target_id=73`) y visualmente el hito alineado ya no se dibuja como linea directa ni como codo lateral.

Validacion ejecutada
- `python tmp/audit_santiago_gantt_full.py` OK: `187` filas, `0` incidencias, `30` relaciones auditadas por contrato.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK con `route_command_count=2` y `route_d="M 149.5 166 L 149.5 106"`.
- `node scripts/validate-gantt-santiago-route-all.mjs` OK: `30/30` rutas calculadas, `0` incidencias.
- `node scripts/validate-gantt-santiago-full-dom.mjs` OK: `0` diagonales, `0` rutas manuales invalidas, `0` rutas vacias en DOM renderizado.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.

Impacto
Datos Gantt clasico de `Santiago Bermeo` y ruteo visual acotado; sin licencias nuevas, sin Presupuesto/Valorado directo y sin BIM.

TASK de control asociada
`TASK-1488`: completada al 100%.

Slice actual
`TASK-1489`: implementacion completada al 100%. Se corrige el flujo de soltar hitos manuales en Gantt: primero se intenta persistir la cascada de sucesores y solo si esa cascada pasa se guarda `manual_milestones`.

Resultado actual
Mover un hito manual ya no puede dejar guardado el hito en una posicion nueva si sus sucesores no pudieron persistirse. Esto evita la rehidratacion incoherente que generaba rutas visuales sin significado.

Validacion ejecutada
- `node scripts/validate-gantt-manual-milestone-drag-release-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: la cascada real queda bloqueada por una violacion previa de inicio de proyecto y el hito no se guarda solo.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK.
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.

Impacto
Gantt clasico; sin cambio visual, sin Presupuesto/Valorado directo, sin licencias nuevas y sin BIM.

TASK de control asociada
`TASK-1486`: completada al 100%.

Slice actual
`TASK-1487`: saneamiento real completado al 100% sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`. Se detecto que el hito manual `hm-mok8sj9c-j04f` habia quedado sin `successor_dependencies` y fechado en `2026-03-30T08:00:00`; se creo backup `tmp\santiago_bermeo_gantt_saneamiento_hito_backup_20260502_184030.json` y se restauro el hito a `2026-03-24T08:00:00` con relacion `FS` hacia la linea `49`.

Resultado actual
El hito manual inicial vuelve a gobernar la primera tarea visible del bloque sin tocar fechas de tareas ni relaciones tarea-tarea existentes. La linea `49` permanece `2026-03-24T08:00:00 -> 2026-03-24T10:19:00`.

Validacion ejecutada
- Consulta directa a base OK: `manual-milestone:hm-mok8sj9c-j04f -> 49` persistido.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK con `Santiago Bermeo`, presupuesto `13`: `manual-milestone:hm-mok8sj9c-j04f-49` renderiza `route_command_count=5`.

Impacto
Datos Gantt clasico de `Santiago Bermeo`; sin codigo funcional nuevo, sin Presupuesto, sin Cronograma Valorado, sin licencias nuevas y sin BIM.

TASK de control asociada
`TASK-1484`: completada al 100%.

Slice actual
`TASK-1485`: implementacion completada al 100%. Gantt corrige la representacion visual de dependencias con hitos: el router deja de convertir `sourceIsMilestone` / `targetIsMilestone` sin lag en una linea directa punto a punto y usa el ruteo ortogonal general del cronograma.

Resultado actual
Mover un hito manual ya no debe producir una diagonal directa como secuenciacion visual. La dependencia hito -> tarea se representa por codos ortogonales y anclajes de Gantt.

Validacion ejecutada
- `node scripts/smoke-cronogramas-gantt-manual-milestone-dependencies.mjs` OK.
- Validacion focal del router hito -> tarea OK (`commandCount > 2`).
- `npm run smoke:gantt-classic` OK.
- `node scripts/validate-gantt-manual-milestone-route-dom.mjs` OK con fixture de `Santiago Bermeo`, presupuesto `13`: `manual-milestone:hm-mok8sj9c-j04f-49` renderiza `route_command_count = 5`.
- `node scripts/validate-gantt-manual-milestone-default-time-dom.mjs` OK.
- `npm run build` OK en `frontend`.

Impacto
UI Gantt clasico; sin cambios de calculo, sin datos productivos, sin Cronograma Valorado, sin Presupuesto, sin licencias nuevas y sin BIM.

TASK de control asociada
`TASK-1482`: completada al 100%.

Slice actual
`TASK-1483`: saneamiento real completado al 100% sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`. El hito manual `hm-mok8sj9c-j04f` estaba en `2026-04-01T08:00:00` mientras la linea sucesora `49` seguia en `2026-03-24T08:00:00`; se creo backup `tmp_santiago_gantt_manual_milestone_route_backup_20260502_133651.json`, se alineo la linea `49` con el hito y el motor backend propago `30` lineas por cascada.

Resultado actual
La relacion hito -> linea `49` queda `aligned=true`; no quedan diferencias entre `schedule_data` persistido y calculo backend; no hay filas antes del inicio del proyecto. Cronograma Valorado permanece en modo `gantt` con `0` overrides, por lo que deriva del Gantt vigente.

Validacion ejecutada
- Validacion real sobre `Santiago Bermeo`: `187` filas servidas, `29` con dependencias, `0` diferencias persistido/calculado, `0` filas antes del inicio.
- `npm run smoke:gantt-classic` OK.
- `node scripts/smoke-cronogramas-gantt-manual-milestone-drag.mjs` OK.
- `node scripts/validate-gantt-manual-milestone-default-time-dom.mjs` OK.
- `npm run build` OK en `frontend`.

Impacto
Datos Gantt clasico de `Santiago Bermeo`; sin cambios de licencias, sin UI nueva, sin backend BIM y sin UX BIM.

TASK de control asociada
`TASK-1478`: completada al 100%.

Slice previo
`TASK-1479`: implementacion completada al 100%. La opcion `Aceptar` del Gantt confirma las lineas pendientes como lote unico mediante `onSaveTrabajoDraftBatch(...)` cuando esta disponible, limpia drafts/historial de lineas confirmadas y mantiene una unica sincronizacion final `Gantt -> Valorado -> Caja`.

Resultado actual
`Aceptar` ya no confirma linea a linea como experiencia principal. Las etiquetas de descripcion pasan de forma atomica desde `Pendiente aprobar` / `Programacion ajustada` hacia `Confirmado` / `Sincronizado` segun metadata persistida, sin resincronizacion economica intermedia por fila. La politica sigue alineada: `Presupuesto` es fuente productiva base, `Gantt` gobierna la dimension temporal, `Cronograma Valorado` deriva del Gantt vigente en modo `gantt` y `Flujo de Caja` deriva del Valorado vigente.

Validacion ejecutada
- `npm run smoke:gantt-classic` OK.
- `npm run build` OK en `frontend`.
- Verificacion estatica: `persistConfirmedRowsBatch(...)` usa `onSaveTrabajoDraftBatch(...)`, `approvalMode: confirmed` y `skipValoradoSync: true`.
- Verificacion estatica: `Guardando linea` / `Guardando línea` no queda renderizado en `CronogramaGantt.jsx` ni en bundle.

Impacto
Gantt clasico y sincronizacion derivada `Gantt -> Valorado -> Caja`; sin backend nuevo, sin cambios de calculo, sin licencias nuevas, sin backend BIM y sin UX BIM.

TASK de control asociada
`TASK-1476`: completada al 100%.

Slice previo
`TASK-1477`: implementacion completada al 100%. Gantt retira el letrero tecnico `Guardando linea ...` del rail oscuro y refuerza la aprobacion/restauracion por lote: las lineas se persisten sin sincronizacion economica intermedia y `Cronograma Valorado` / `Flujo de Caja` se sincronizan una sola vez al cierre del lote.

TASK de control asociada
`TASK-1474`: completada al 100%.

Slice previo
`TASK-1475`: implementacion completada al 100%. Formula Polinomica repara el contrato de asignaciones para que cada cambio de `Termino` guarde, regenere y devuelva la formula calculada completa antes de refrescar recursos. Se mantiene una unica columna `Termino`, sin restaurar la columna duplicada `Asignacion`.

TASK de control asociada
`TASK-1472`: completada al 100%.

Slice actual
`TASK-1473`: implementacion completada al 100%. El grid izquierdo del Gantt incorpora columnas `Holg. total` y `Holg. libre`, gestionables por el panel de columnas y alimentadas por `metadata.cpm.total_float_days` / `metadata.cpm.free_float_days`, sin tocar calculos CPM, dependencias, calendario laboral, backend ni BIM.

Slice previo
`TASK-1471`: implementacion completada al 100%. Cronograma Trabajo consume la capacidad restante de la jornada laboral antes de saltar al siguiente dia laborable, genera subtramos automaticos `gantt_workday_auto_segment` para cortes de jornada y sanea el Gantt real de `Santiago Bermeo` sin romper las politicas `FS/SS/FF/SF`. Refuerzo posterior: `update_schedule` y `commit-delta` persisten fechas/subtramos calculados en `schedule_data` tras cada recalculo para mantener sincronizados grid izquierdo y timeline derecho.

Subajuste visual posterior
`TASK-1471`: Gantt une los subtramos automaticos consecutivos con una linea sutil calculada desde la posicion visual real del final de un tramo hasta el inicio del siguiente, sin cambiar calculos, dependencias ni persistencia.

Slice previo
`TASK-1469`: hotfix UI Formula Polinomica completado al 100%. Se incorpora un separador vertical redimensionable entre el grid de recursos y el grid de coeficientes/indices, con limites minimos por panel y fallback responsive en viewport compacto.

Slice previo
`TASK-1468`: hotfix Gantt completado al 100%. Los scrollbars horizontales inferiores del grid izquierdo y timeline derecho quedan balanceados en inicio y fin corrigiendo el recorrido del selector en `MotionScrollbar` y reservando simetricamente `left: 24` / `right: 24` en `CronogramaGantt`.

Slice previo
`TASK-1467`: homogeneizacion visual de Desagregacion completada al 100%. La cabecera, card, buscador, selector `Por EDT / Consolidado`, KPIs e Integridad CPC adoptan la piel soft de `Datos de Proyecto`.

Slice anterior
`TASK-1465`: hotfix Desagregacion completado al 100%. El boton general `Reporte` ejecuta el reporte VAE existente y se retira el boton duplicado `Reporte VAE` de la zona de funciones.

Referencia anterior
`TASK-1464`: hotfix Gantt completado al 100%. Al navegar con cursor arriba/abajo en la columna `Predecesoras`, la celda editable y la tarea seleccionada quedan sincronizadas.

Referencia anterior
`TASK-1463`: completada al 100%. `Desagregacion` incorpora CPC de APUs a nivel de proyecto raiz, separado del CPC universal de recursos. Los APUs anidados en modo recurso quedan con CPC en blanco, no cuentan como faltantes y usan el VAE total calculado de su APU normal.

Subajuste visual posterior: el CPC de APU ya no se presenta como columna independiente; queda como chip accionable en la segunda linea bajo la descripcion del rubro, usando el mismo modal y guardado.

Control actual
Sin pendientes de cierre.

Validacion ejecutada
- Validacion real `TASK-1473`: `Santiago Bermeo`, proyecto `7`, presupuesto `13`; `cronograma_trabajo_service.get_schedule(...)` devuelve `187` filas y las `187` incluyen `metadata.cpm.total_float_days` y `metadata.cpm.free_float_days`. Muestras: linea `49` `HT=0.0 / HL=0.0`, linea `102` `HT=36.1241 / HL=0.0`, linea `118` `HT=9.166 / HL=0.0`.
- `npm run smoke:gantt-classic` OK para `TASK-1473`.
- `npm run build` OK en `frontend` para `TASK-1473`.
- `python -m pytest app/tests/test_cronograma_trabajo_advanced_calendar_config.py -q` OK para `TASK-1471`: `15 passed`.
- `python -m py_compile app/services/cronograma_trabajo.py app/tests/test_cronograma_trabajo_advanced_calendar_config.py` OK para `TASK-1471`.
- Validacion real `Santiago Bermeo`, proyecto `7`, presupuesto `13`: calendario real contiene `2026-04-30` y `2026-05-01` como no laborables; lineas `93`, `94`, `95` quedan persistidas y servidas con fechas coherentes y subtramos `gantt_workday_auto_segment`.
- Validacion de recalculo `Santiago Bermeo`: `commit-delta` real recalcula `187` filas y deja persistidos los subtramos automaticos en `schedule_data`.
- `npm run smoke:gantt-classic` OK para `TASK-1471`.
- `npm run build` OK para `TASK-1471`.
- `node scripts/smoke-formula-polinomica-responsive.mjs` OK para `TASK-1469`.
- `node scripts/validate-formula-responsive-dom.mjs` OK para `TASK-1469` a `1920x1080`.
- `npm run build` OK para `TASK-1469`.
- Validacion visual real del usuario para `TASK-1469`: scrollbars y slider vertical entre grids de Formula Polinomica correctos.
- `npm run build` OK para `TASK-1468`.
- `npm run smoke:gantt-classic` OK para `TASK-1468`.
- `node scripts/smoke-project-scrollbars.mjs` OK para `TASK-1468`.
- `node scripts/validate-gantt-scrollbar-geometry.mjs` OK para `TASK-1468`: DOM con datos reales de `Santiago Bermeo`, grid izquierdo y timeline derecho con `leftClearance=24` y `rightClearance=24`.
- `npm run build` OK para `TASK-1467`.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK para `TASK-1467`.
- `npm run build` OK para `TASK-1465`.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK para `TASK-1465`.
- `npm run build` OK para `TASK-1464`.
- `npm run smoke:gantt-classic` OK para `TASK-1464`.
- Validacion real reversible sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`, linea `49`, APU `349`: asignacion temporal CPC `011200011` persiste en `proyecto_apu_cpc` por root `SantiagoBermeo-2026-001` y no modifica el CPC del recurso.
- Validacion real de APU anidado: linea `1630`, APU padre `538`, APU hijo `110`, `resource_id = None`, `vae_total = 0.2877643678160919540229885057`; no debe mostrar `Sin CPC` ni entrar en faltantes.
- `alembic upgrade ad9e0f1a2b3c` aplicado en base local.
- `python -m py_compile app/models/apu.py app/models/proyecto_apu_cpc.py app/schemas/apu.py app/api/endpoints/apus.py app/repositories/apu.py` OK.
- `python -m pytest app/tests/test_nested_apu_integrity.py app/tests/test_project_base_reconciliation.py -q` OK: `12 passed`.
- `npm run build` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.

Validacion previa
- Validacion DOM real sobre `Santiago Bermeo`, presupuesto `13`, linea `73`: `9FF` queda visible sin fechas de febrero y con `start_date = 2026-04-06T10:49:01`, `end_date = 2026-04-07T12:06:14`.
- Validacion real de datos `Santiago Bermeo`: frontera `2026-03-24T08:00:00`, filas calculables antes del inicio `0`, relaciones `FF` desalineadas `0`.
- `npm run build` OK.
- `npm run smoke:gantt-classic` OK.
- `node scripts/validate-gantt-ff-predecessor-dom.mjs` OK.

Validacion previa relacionada
- Validacion real reversible sobre `Santiago Bermeo`, presupuesto `13`, lineas `71 -> 73`: `FS`, `SS`, `FF` y `SF` cumplen su semantica. Caso negativo `49 -> 73 FF` rechazado porque iniciaria antes de `2026-03-24T08:00:00`.
- Saneamiento real `Santiago Bermeo`: backup `tmp_santiago_gantt_dependency_dates_backup_20260430.json`; `29` filas dependientes con fechas persistidas obsoletas actualizadas; `remaining_stale_dependency_rows = []`.
- `python -m py_compile app/services/cronograma_trabajo.py app/tests/test_cronograma_trabajo_cpm_metadata.py` OK.
- `python -m pytest app/tests/test_cronograma_trabajo_cpm_metadata.py app/tests/test_cronograma_trabajo_advanced_calendar_config.py -q` OK: `21 passed`.
- `npm run smoke:gantt-classic` OK.
- `node scripts/validate-gantt-ff-predecessor-dom.mjs` OK.
- `npm run build` OK.
- `node frontend/scripts/smoke-classic-no-bim-contamination.mjs` OK.

Auditoria relacionada
Sin pendientes. Pueden quedar `custom-scrollbar` en contenedores secundarios como modales o dropdowns internos, fuera del alcance de grids principales.

Pendiente para 100%
Ninguno.

Última TASK completada
`TASK-1463`: CPC de APUs por proyecto en Desagregacion. `TASK-1457`: asignacion masiva CPC en Recursos.

Nota operativa CPC/APU
El CPC de APU no debe copiarse al recurso ni a APUs anidados usados como recurso. La tabla rectora es `proyecto_apu_cpc`, con clave logica `empresa + proyecto_root_codigo + apu`. Para APUs anidados, la celda CPC queda vacia y el VAE usado es `APU.vae_total`.

Nota operativa Gantt
`FF` valido debe alinear fin con fin. Si al retrocalcular la duracion la sucesora tendria que iniciar antes del proyecto, la secuenciacion debe rechazarse; no se debe guardar una relacion degradada ni mover la barra al inicio del proyecto.

Nota operativa Formula Polinomica
Se retira el bloqueo fijo `X <= 0.200`: `X` puede actuar como termino residual cuando el presupuesto real lo requiera. En `Santiago Bermeo`, proyecto `7`, presupuesto `13`, la formula vuelve a regenerar con monomios en `SIN_DESGLOSE` y `CON_DESGLOSE`.

Slice anterior cerrado
`TASK-1451`: implementacion normativa de `Formula Polinomica` segun DOCX, Excel y Delphi. TASK de control `TASK-1450` tambien cerrada al 100%.

Último slice ejecutado
`TASK-1444`: Desagregacion queda al 99.8% con CPC directo/batch, ruta inversa CPC y sincronizacion base maestra -> base proyecto validadas. Hotfix reciente: `execute_sync_operation(...)` sincroniza todos los recursos compartidos en modos `apu_values` e `integral`, no solo recursos de APUs tocados, para que el CPC del recurso maestro se copie aunque el APU no cambie. Proteccion adicional: `PUT /recursos/{id}` ya no borra CPC si recibe `cod_cpc_id: null` por payload incompleto; solo borra con `clear_cod_cpc: true`. Saneamiento real en `Santiago Bermeo`: base proyecto `34` contra maestra `32`, `111` CPC restaurados, backup `tmp_santiago_base34_cpc_repair_backup_20260430.json`; base proyecto queda `216/216` con CPC y presupuesto `13` queda con `164` APUs / `747` lineas de recurso sin faltantes CPC. Validacion anti-borrado real: recurso `428` conserva `17767 / 432540011` tras update incompleto. Pendiente QA visual/desplegada general para cierre al 100%.

Slice aparcado
`TASK-1449`: busqueda CPC flexible en asignacion de recursos al 98%. Implementacion: `CodCPCRepository.search` sube limite por defecto a 200, busca por codigo/descripcion/frase completa y por todos los terminos aunque no formen frase exacta, y ordena por relevancia. `GET /recursos/cpc/search` acepta `limit` entre 1 y 500 con 200 por defecto. Validado con `py_compile`, pytest focalizado `test_codcpc_search.py` (3 passed) y lectura real de base configurada: `hierro` devuelve 200 resultados con 11 coincidencias `VARILLAS` + `HIERRO`; `estruct` devuelve 200 resultados con 132 coincidencias `ESTRUCTURAL`. Pendiente QA visual en UI servida del dropdown. Sin cambios de guardado, licencias ni BIM.

Slice previo aparcado
`TASK-1448`: filtro de recursos sin CPC en Precios Unitarios clasico al 95%. Implementacion: `Recursos.jsx` agrega helper robusto para detectar CPC por `cod_cpc_id`, objeto `cpc` o `cod_cpc_codigo` plano; incorpora boton compacto `Sin CPC` con contador en el alcance activo, filtra `visibleRecursos` por categoria/subcategoria activa, hace que la busqueda global respete el filtro activo y limpia seleccion masiva al cambiar modo. Validado con comprobacion estatica focalizada, simulacion funcional del criterio CPC y `npm run build`. Pendiente QA visual en UI servida para cierre al 100%. Sin cambios backend, licencias ni BIM.

Slice anterior aparcado
`TASK-1447`: hotfix y mejora de grid izquierdo del Gantt clasico al 99.9995%. Diagnostico: al borrar la ultima predecesora, el commit textual eliminaba el borrador local antes de esperar al backend; durante ese hueco el input volvia a leer la fila persistida anterior y repintaba el numero viejo. Implementacion: `CronogramaGantt.jsx` mantiene el shortcode optimista, aplica el parche local antes del `await` backend y hace que `gantt_predecessor_shortcode` use `deferValoradoSync: true` para entrar por el commit delta/diferido. Hotfix secuenciador hito -> tarea: el parser textual conserva endpoints `manual-milestone:*`, no los convierte a `Number/NaN`, persiste relaciones hito -> tarea en `manual_milestones[].successor_dependencies`, el mapa secuenciable usa `rows` ya fusionado con hitos manuales y el borrador optimista de `Predecesoras` no se borra hasta que el persistido coincide semanticamente. Hotfix borrado tarea -> tarea: el borrador optimista vacio se conserva hasta que el persistido coincide semanticamente con vacio, evitando que el numero antiguo se rehidrate. Hotfix FF/lag: `Cronogramas.jsx` y backend conservan `FF`, aliases visibles (`FC`/`CC`/`CF`) y unidades `minute`/`percent`, evitando que `9FF-50%` se convierta en dias o en `CC`. Hotfix adicional `FF`: backend y preview frontend aplican el inicio del proyecto como suelo obligatorio, por lo que una relacion `FF` ya no puede derivar el inicio del destino antes del inicio del proyecto por duracion del destino. Hotfix visual `FF`: `buildDependencyRoute(...)` conserva el calculo temporal pero representa fin-fin con salida desde el fin de la predecesora y llegada vertical al fin de la sucesora. Hotfix hitos: los hitos nuevos nacen en hora laboral; en `Santiago Bermeo`, cronograma `1`, presupuesto `13`, se saneo `hm-mok8sj9c-j04f` de `2026-03-24T00:00:00` a `2026-03-24T08:00:00`, con backup `tmp_santiago_manual_milestones_midnight_backup_20260430.json`. Validacion real reversible sobre `Santiago Bermeo`, empresa `3`, proyecto `7`, presupuesto `13`: escribir `3` en la predecesora del item 4 (`line_id=49`) mantiene `3` tras 7 segundos; borrar `9` en la predecesora del item 8 (`Cobertura de plástico`) mantiene la celda vacia tras 7 segundos con `commit-delta 200`; escribir `9FF-50%` conserva `9FF-50%` tras 7 segundos; `diagnose_santiago_gantt_ff_item10.py` guarda `71 -> 73` con `FF`; la respuesta de servicio devuelve el hito saneado a `08:00` y quedan 0 hitos manuales a medianoche. Validado con pytest backend, `node scripts/smoke-cronogramas-gantt-dependencies.mjs`, `npm run smoke:gantt-classic`, `node scripts/validate-gantt-ff-predecessor-dom.mjs` y `npm run build`. Pendiente QA visual/percibida en UI servida principal tras desplegar/reiniciar frontend para cierre al 100%. Sin cambios en Valorado/Caja, Presupuesto, licencias ni BIM.

Slice previo cerrado
`TASK-1446` queda cerrada al 100%: optimizacion conservadora del commit de secuenciacion en Gantt clasico. Objetivo cumplido: aceptar una secuenciacion confirma rapido el Gantt y no espera de forma bloqueante la resincronizacion silenciosa del Cronograma Valorado cuando el modo es `gantt`. Implementacion: `Cronogramas.jsx` difiere la sincronizacion silenciosa del Valorado con debounce de 900 ms cuando el commit del Gantt llega con `deferValoradoSync`, estabiliza `CronogramaTrabajoResponse`, y usa `PUT /cronogramas-trabajo/{presupuesto_id}/commit-delta` solo para secuenciacion diferida. El endpoint delta valida/persiste igual que el completo pero devuelve filas livianas, `schedule_data` cambiado y resumen, manteniendo intacto el `PUT` completo existente. Perfilado real `Santiago Bermeo`, empresa `3`, proyecto `7`, presupuesto `13`: payload completo `1,935,288` bytes frente a delta `505,951` bytes (`-73.9%`); commit completo ~454.3 ms frente a delta ~299.7-370.9 ms. Validado con `py_compile`, ruta FastAPI, `npm run smoke:gantt-classic`, `npm run build` y confirmacion UI servida del usuario tras reinicio backend/frontend. Sin tocar CPM backend, Valorado/Caja ni BIM.

Slice previo aparcado
`TASK-1445`: ruta critica coherente en Gantt clasico queda al 96% pendiente de QA visual/desplegada. Diagnostico real sobre `Santiago Bermeo`, proyecto `7`, presupuesto `13`: backend CPM devuelve `30` nodos criticos calculables y `29` arcos criticos en `metadata.cpm_network.critical_paths`; el frontend pintaba enlaces rojos pero mantenia barras/semaforos `RC=0` porque el nodo CPM backend usado por `displayPlanningMap` no reconstruia `criticalOutgoingKeys` / `criticalIncomingKeys`. Implementacion focalizada: `cronogramasGanttCriticalPath.js` normaliza rutas criticas backend y `CronogramaGantt.jsx` enriquece los nodos CPM con pertenencia critica para que barras/subbarras y contadores usen el mismo criterio. Hotfix posterior: el drag vertical de hitos manuales recien creados usa una referencia viva del resolver de drop. Validado con smoke focalizado, smoke de hito manual, `npm run smoke:gantt-classic`, build, smoke no BIM y verificacion real `Santiago Bermeo`: `rows=187`, `backend_is_critical_rows=30`, `nodes_from_critical_paths=30`, `edges_from_critical_paths=29`, `frontend_expected_rc_after_fix=30`.

Slice documental previo
`TASK-1437`: saneamiento documental posterior al cierre `TASK-1435` / `TASK-1436`; `WORK_MODE_STATE`, `HANDOFF`, `TODO`, `project_state` y `CHANGELOG` quedan alineados y el runtime vuelve a `sin TASK activa real`.

Saneamiento documental 2026-04-28
- `TASK-1435` y `TASK-1436` ya estaban cerradas y registradas en `CHANGELOG`, pero el snapshot rector seguía citando `TASK-1433` / `TASK-1434` como último cierre.
- Se crea y cierra `TASK-1437` como control documental, sin cambios funcionales.
- El consenso operativo queda en `SIN_TASK_ACTIVA_REAL`.
- Impacto en licencias: ninguno.
- Impacto UI: ninguno.
- No interferencia BIM: confirmada; sin UX BIM ni acoplamientos nuevos.

Saneamiento documental posterior
- `TASK-1089`, `TASK-1090`, `TASK-1091` y `TASK-1092` dejan de actuar como frente activo real y quedan archivadas como slices históricos superados.
- `TASK-1414` deja de figurar como tarea activa real residual del runtime; `TASK-1415` / `TASK-1416`, `TASK-1417` / `TASK-1418`, `TASK-1419` / `TASK-1420`, `TASK-1421` / `TASK-1422`, `TASK-1423` / `TASK-1424`, `TASK-1425` / `TASK-1426`, `TASK-1427` / `TASK-1428`, `TASK-1429` / `TASK-1430` y `TASK-1431` / `TASK-1432` quedan como slices históricos cerrados del frente Gantt clásico del 2026-04-26.

Pendiente operativo real
- Continuar `TASK-1444` hasta QA visual/desplegada y cierre documental.
- No reabrir `TASK-1443` salvo bug explícito de mezcla EDT/APU en `Desagregación`.
- No reabrir `TASK-1442` salvo bug explicito de carga batch o cache de `Desagregación`.
- No reabrir `TASK-1441` salvo bug explicito de sincronización CPC en `Desagregación` o contrato de recurso APU.
- No reabrir `TASK-1440` salvo ajuste visual explícito del Gantt clásico sobre altura o rombo de hitos manuales.
- No reabrir `TASK-1439` salvo ajuste visual explícito del Gantt clásico sobre hitos manuales.
- No reabrir `TASK-1438` salvo ajuste visual explícito del landing de Proyectos.
- No reactivar `TASK-1435` / `TASK-1436` salvo bug explícito del frente de drag horizontal.
- `TASK-presupuesto-module-access-repair` queda cerrada; no reabrir salvo evidencia de endpoint sin `_verify_module_access`.
- La adecuación Delphi de `Fórmula Polinómica` queda validada con datos reales sobre `Santiago Bermeo`.
- La persistencia del carril de hitos manuales queda probada con datos reales sobre `Santiago Bermeo`.
- El movimiento vertical de hitos secuenciados queda probado con un hito real de `Santiago Bermeo`.
- El frente de calendario laboral unificado queda cerrado.
- `TASK-1230` y `TASK-1232` quedan cerradas documentalmente como frentes históricos absorbidos por el cierre visual posterior.
- El frente de secuenciación gráfica `TASK-1243` a `TASK-1245` queda cerrado al 100%.
- El hotfix visual `TASK-1246` a `TASK-1248` queda cerrado al 100%.
- El hotfix funcional `TASK-1249` a `TASK-1251` queda cerrado al 100%.
- La mejora UX `TASK-1252` a `TASK-1254` queda cerrada al 100%.
- El ajuste geométrico `TASK-1255` a `TASK-1257` queda cerrado al 100%.
- El ajuste de dismiss `TASK-1258` a `TASK-1260` queda cerrado al 100%.
- El ajuste geométrico complementario `TASK-1261` a `TASK-1263` queda cerrado al 100%.
- El hotfix del carril `TASK-1264` a `TASK-1266` queda cerrado al 100%.
- El hotfix funcional `TASK-1267` a `TASK-1269` queda cerrado al 100%.
- El hotfix UX/consistencia `TASK-1270` a `TASK-1272` queda cerrado al 100%.
- El hotfix funcional `TASK-1273` a `TASK-1275` queda cerrado al 100%.
- El hotfix UX de drag `TASK-1276` a `TASK-1278` queda cerrado al 100%.
- El hotfix UX de foco `TASK-1279` a `TASK-1281` queda cerrado al 100%.
- La corrección estructural de viewport `TASK-1282` a `TASK-1284` queda cerrada al 100%.
- La corrección estructural horizontal `TASK-1285` a `TASK-1287` queda cerrada al 100%.
- La corrección de regresión por affordances invisibles `TASK-1288` a `TASK-1290` queda cerrada al 100%.
- La separación estricta click/drag `TASK-1291` a `TASK-1293` queda cerrada al 100%.
- La eliminación de autoposiciones restantes `TASK-1294` a `TASK-1296` queda cerrada al 100%.
- La selección pasiva en grid izquierdo `TASK-1297` a `TASK-1299` queda cerrada al 100%.
- `TASK-1300` a `TASK-1302` quedan como intento exploratorio sobre `ProjectManager` y no como adopción final del selector.
- `TASK-1303` a `TASK-1305` quedan cerradas: la adecuación visual alineada a la referencia HTML vive ahora en `Proyectos.jsx`, con `Lista / Kanban / Calendario`, historial inline y `ProjectManager` devuelto a standby por flag.
- `TASK-1306` a `TASK-1308` quedan cerradas: el fondo base del landing nuevo de `/proyectos` se alinea con el color institucional `#F2F4F7` del shell principal.
- `TASK-1309` a `TASK-1311` quedan cerradas: el bloque superior del landing pierde el copy descriptivo, reduce altura y acerca tipografía/acciones al patrón corporativo del style guide.
- `TASK-1312` a `TASK-1314` quedan cerradas: los KPIs dejan de mostrarse como cuatro cards grandes y pasan a una banda estadística compacta con separadores internos.
- `TASK-1315` a `TASK-1317` quedan cerradas: la banda KPI se reemplaza por cuatro cards compactas con badge superior y lectura vertical simple, como prueba visual inspirada en Uiverse.
- `TASK-1318` a `TASK-1320` quedan cerradas: la familia KPI se refina otra vez para acercarse más al patrón de card seleccionado, sustituyendo badges genéricos por iconografía técnica, valor fuerte y pie compacto sin cambiar métricas ni comportamiento.
- `TASK-1321` a `TASK-1323` quedan cerradas: la familia KPI cambia a una versión horizontal, más baja y compacta, con icono lateral, valor dominante y pie corto, manteniendo intacta la lógica del selector.
- `TASK-1324` a `TASK-1326` quedan cerradas: la toolbar del landing reduce altura, elimina el tono beige dominante y adopta controles blancos/zinc con estados activos naranjas más próximos al patrón de `Cronogramas`.
- `TASK-1327` a `TASK-1329` quedan cerradas: el selector `Lista / Kanban / Calendario` deja el patrón manual temporal, adopta `ProjectSegmentedSwitch` y se alinea al borde derecho sin aumentar tamaño.
- `TASK-1330` a `TASK-1332` quedan cerradas: `Volver`, `Gestión de personal`, `Nuevo proyecto` y `Filtros` comparten ya una misma familia de botones suaves con borde claro, relieve leve y tipografía consistente.
- `TASK-1333` a `TASK-1335` quedan cerradas: las acciones principales del landing pasan a botones iconográficos descriptivos y `Filtros` sustituye la expansión inferior por un dropdown contextual anclado al botón.
- `TASK-1336` a `TASK-1338` quedan cerradas: se recupera el material `soft-action` de esa botonera y del dropdown de filtros, manteniendo iconografía descriptiva e interacción contextual.
- `TASK-1339` a `TASK-1341` quedan cerradas: el landing reduce gap y padding vertical entre header, KPIs, toolbar y tabla para aumentar el área de trabajo visible.
- `TASK-1342` a `TASK-1344` quedan cerradas: la tabla de `/proyectos` sustituye el acceso directo por despliegue inline del historial, siembra la revisión `0` cuando no hay más versiones, elimina la columna `Avance` y rebaja la paleta cálida del grid hacia neutros y azul corporativo.
- `TASK-1345` a `TASK-1347` quedan cerradas: el historial de revisiones deja de empujar filas y pasa a overlay anclado al item padre dentro del scroller del listado; la columna `Acciones` desaparece y solo queda borrado contextual condicionado por rol.
- `TASK-1348` a `TASK-1350` quedan cerradas: el overlay de revisiones recibe altura máxima y scroll interno, reforzando que el crecimiento vertical ocurra dentro del panel y no en la página.
- `TASK-1351` a `TASK-1353` quedan cerradas: el expansor del historial y las papeleras contextuales pasan a una familia compacta `soft-action`, sin crecer ni perder la animación de giro del chevron.
- `TASK-1354` a `TASK-1356` quedan cerradas: las revisiones del overlay se recompensan a dos líneas, reducen altura y redistribuyen metadatos para que el panel gane densidad.
- `TASK-1357` a `TASK-1359` quedan cerradas: el overlay de revisiones ajusta altura máxima y reserva inferior para no quedar pegado al borde bajo de la ventana.
- `TASK-1360` a `TASK-1362` quedan cerradas: `Kanban` deja de ser un dashboard estático, adopta columnas-lista con scroll interno, separa fase operativa de `Con revisiones` y permite mover proyectos entre fases persistiendo `estado`.
- `TASK-1363` a `TASK-1365` quedan cerradas: `Proyectos.jsx` recupera el import del icono `Play` usado en el workspace y elimina el `ReferenceError` que impedía abrir el módulo.
- `TASK-1366` a `TASK-1368` quedan cerradas: en `Kanban` desaparece el lápiz, `Pre-factibilidad` no ofrece entrada, `Planificación` abre un microlistado de revisiones y las fases de la derecha entran directo a la revisión vigente.
- `TASK-1369` a `TASK-1371` quedan cerradas: al pasar de `Planificación` a `Licitación`, si existe más de una revisión el sistema exige elegir cuál queda aprobada; esa decisión se persiste en `plantillas_config` del proyecto raíz y las fases posteriores abren siempre esa revisión.
- `TASK-1372` a `TASK-1374` quedan cerradas: si un proyecto con presupuesto retrocede de `Planificación` a `Pre-Factibilidad`, el `Kanban` exige confirmación explícita de proyecto retraído antes de persistir el cambio de fase.
- `TASK-1375` a `TASK-1377` quedan cerradas: el badge de estado visible deja de mostrar semánticas paralelas como `Con revisiones` y pasa a reflejar en lista, overlay de revisiones y calendario el estado operativo del proyecto raíz que gobierna `Kanban`.
- `TASK-1378` a `TASK-1380` quedan cerradas: el `Calendario` del selector deja el segmentado principal y pasa a un modal mensual navegable.
- `TASK-1381` a `TASK-1383` quedan cerradas: `Anterior`, `Siguiente`, `Hoy` y la cápsula de `Mes operativo` del calendario modal reducen altura y anchura para ganar superficie útil sin perder jerarquía ni navegación.
- `TASK-1384` a `TASK-1386` quedan cerradas: el calendario modal del portafolio entra en modo mixto y combina ya eventos operativos, anotaciones compartidas de administración, notas privadas por usuario y comunicados visibles para toda la empresa, con persistencia dedicada y permisos diferenciados por rol.
- `TASK-1387` a `TASK-1389` quedan cerradas como base de densificación UX del calendario mensual; su patrón lateral inicial queda posteriormente sustituido por el modelo embebido cerrado en `TASK-1396` a `TASK-1398`.
- `TASK-1390` a `TASK-1392` quedan cerradas: el calendario añade hitos automáticos múltiples por proyecto y revisión, incluyendo alta, inicio operativo, fin estimado, creación de revisiones y revisión aprobada cuando aplica, visibles para todos los usuarios del portafolio.
- `TASK-1393` a `TASK-1395` quedan cerradas: cuando el backend activo no soporta aún `calendar-entries`, el calendario deja de lanzar un aviso bloqueante y pasa a modo degradado, manteniendo operativos los hitos automáticos y mostrando la indisponibilidad de la capa manual dentro del modal.
- `TASK-1396` a `TASK-1398` quedan cerradas: el calendario mensual del selector `/proyectos` retira el panel lateral, convierte cada día en un microlistado embebido con cabecera `Eventos: X`, resuelve el detalle por hover local y mueve el alta de anotaciones/notas/comunicados a un modal corto.
- `TASK-1399` a `TASK-1401` quedan cerradas: el calendario mensual compacta su cabecera en una sola banda horizontal y aprovecha la columna derecha para una bandeja privada de `Pendientes personales`, persistidos por usuario y sin fecha.
- `TASK-1402` a `TASK-1404` quedan cerradas: si el backend activo todavía no soporta `usuarios/personal-todos`, la bandeja `Pendientes personales` pasa automáticamente a modo local por usuario/empresa, sigue permitiendo crear, editar, completar y borrar, y sustituye el error duro por un aviso contextual no bloqueante.
- `TASK-1405` a `TASK-1407` quedan cerradas: la cabecera embebida de cada día del calendario mensual reduce contraste, altura, peso tipográfico y tamaño del botón `+`, manteniendo intacto el microlistado y el conteo de eventos.
- `TASK-1408` queda cerrada al 100% con build frontend en verde.
- Tras el cierre, no queda una TASK activa real consensuada; el siguiente trabajo debe abrir una TASK nueva antes de reanudar implementación.

Saneamiento documental
- `docs/runtime/WORK_MODE_STATE.json` apuntaba erróneamente a `TASK-1217`.
- `TASK-1217` está completada y pertenece al frente cerrado `TASK-1216` a `TASK-1222`.
- El consenso documental actual deja `TASK-1230` y `TASK-1232` como slices históricos ya absorbidos por el cierre posterior de `TASK-1234` a `TASK-1239`.
- La TASK activa real queda saneada a `sin TASK activa` tras archivar `TASK-1089` y asociadas como frente superado.

Índice BIM
- El programa BIM ya tiene un punto de entrada único y oficial en `docs/architecture/BIM_INDEX.md`.
- Cualquier reactivación del frente BIM debe arrancar desde ese índice y no desde documentación dispersa.

Estado operativo inmediato
- Los secuenciadores del `Gantt` clásico ya deben caer sobre la tarea o el hito contenedor aunque el puntero toque una subbarra o una zona pequeña del carril.
- Las secuenciaciones `hito <-> tarea` del `Gantt` clásico ya deben completar el commit real tras soltar y no quedarse en una línea continua provisional sin persistencia.
- Los hitos manuales ya no deben reanclarse al final del cronograma cuando se mueven hacia una fila superior.
- Las secuenciaciones entre hitos y tareas del `Gantt` clásico ya deben quedar persistidas y dibujadas como relaciones completas, no solo como ajuste de fecha.
- Los hitos manuales ya pueden volver a subir o bajar de línea desde menú y `drag'n'drop` cuando origen y destino están libres de secuenciadores.
- `TASK-1243`, `TASK-1244` y `TASK-1245` quedan cerradas: el Gantt clásico ya expone un botón hover de secuenciación hermano de `Opciones`, crea `FS` por defecto por arrastre tarea-a-tarea, serializa shortcuts por comas en `Predecesoras` y mantiene editor gráfico de la relación.
- `TASK-1246`, `TASK-1247` y `TASK-1248` quedan cerradas: el editor gráfico de dependencias pasa a portal fijo con clamp al viewport del módulo y deja de quedar recortado por el plano scrollable o la barra horizontal inferior.
- `TASK-1249`, `TASK-1250` y `TASK-1251` quedan cerradas: al romper una dependencia, la tarea destino sin predecesoras vuelve al inicio operativo del proyecto y la cascada sucesora se recalcula desde ese arranque libre.
- `TASK-1252`, `TASK-1253` y `TASK-1254` quedan cerradas: el mismo botón hover `Link2` ya permite tanto arrastrar una dependencia como fijar una tarea origen por click y completar la relación con click sobre una tarea lejana tras hacer scroll.
- `TASK-1255`, `TASK-1256` y `TASK-1257` quedan cerradas: el botón `X` de ruptura deja de usar la punta del path y pasa al punto medio real del recorrido polilineal.
- `TASK-1258`, `TASK-1259` y `TASK-1260` quedan cerradas: si la dependencia está seleccionada y el usuario pulsa fuera del diálogo y fuera del propio enlace, el editor y el botón `X` desaparecen; `Escape` también cierra la selección.
- `TASK-1261`, `TASK-1262` y `TASK-1263` quedan cerradas: el anclaje del botón `X` se recalcula desde el centro visual del bounding box del enlace proyectado sobre la polilínea real, evitando que el control reaparezca en la punta final en rutas con codos.
- `TASK-1264`, `TASK-1265` y `TASK-1266` quedan cerradas: el carril ya no filtra dependencias cuando la predecesora está por debajo de la tarea destino y `dependencyPaths` conserva también `actionX/actionY` para que el botón `X` use el anclaje medio real.
- `TASK-1267`, `TASK-1268` y `TASK-1269` quedan cerradas: al romper una dependencia, tanto origen como destino vuelven al inicio del proyecto solo si quedan sin ninguna relación activa, evitando mover tareas que aún conservan enlaces entrantes o salientes.
- `TASK-1270`, `TASK-1271` y `TASK-1272` quedan cerradas: el grid izquierdo ya no selecciona la fila ni provoca centrado accidental al pulsar vacío, y quitar una relación desde `Predecesoras` cae en la misma lógica completa de `removeDependencyLink(...)`.
- `TASK-1273`, `TASK-1274` y `TASK-1275` quedan cerradas: el commit textual de `Predecesoras` detecta relaciones retiradas y aplica también la regla de volver al inicio cuando origen o destino quedan totalmente libres.
- `TASK-1276`, `TASK-1277` y `TASK-1278` quedan cerradas: el drag de barras bloquea el viewport visible durante el gesto y el preview de movimiento deja de usar una sombra ancha que hacía parecer que la tarea cambiaba de tamaño.
- `TASK-1279`, `TASK-1280` y `TASK-1281` quedan cerradas: las acciones normales del Gantt dejan de centrar fila/timeline automáticamente, la política por defecto pasa a `nearest` y la selección de subbarras elimina el `scrollIntoView(...)` automático, revelando el tramo solo si estaba fuera de vista.
- `TASK-1282`, `TASK-1283` y `TASK-1284` quedan cerradas: la sincronización vertical deja de ejecutarse en `useLayoutEffect` tras cambios de selección/draft/layout y pasa a depender solo de scroll real del usuario.
- `TASK-1294`, `TASK-1295` y `TASK-1296` quedan cerradas: las acciones normales del timeline dejan de ejecutar cualquier autoposición residual (`scrollIntoView` / `scrollRowIntoViewById`) y los affordances flotantes del propio Gantt salen del foco nativo con `tabIndex={-1}` para evitar saltos horizontales espurios.
- `TASK-1297`, `TASK-1298` y `TASK-1299` quedan cerradas: el grid izquierdo ya puede seleccionar la fila desde celdas pasivas, pero respeta intactos botones, inputs, labels, enlaces y acciones inline existentes.
- `TASK-1300`, `TASK-1301` y `TASK-1302` quedan archivadas como exploración sobre `ProjectManager`; el modelo nuevo no se adopta allí y el flag vuelve a `legacy`.
- `TASK-1342`, `TASK-1343` y `TASK-1344` quedan cerradas: el selector `/proyectos` usa ya el panel inline como entrada primaria al historial de revisiones y limpia la lectura del grid sin columna `Avance`.
- `TASK-1345`, `TASK-1346` y `TASK-1347` quedan cerradas: el historial del selector `/proyectos` se monta como overlay dentro del listado y deja la interacción reducida a selección de revisión y borrado contextual por rol.
- `TASK-1303`, `TASK-1304` y `TASK-1305` quedan cerradas: `Proyectos.jsx` adopta la estructura del HTML de referencia sobre el selector real, suma vistas `Lista / Kanban / Calendario`, expansiones inline de revisiones y conserva intacta la rama de detalle del proyecto.
- `cronogramasGanttDependencies.js` alinea la llegada vertical de rutas con el marcador de gobierno esperado y deja el smoke geométrico de dependencias en verde.
- `TASK-1089`, `TASK-1090`, `TASK-1091` y `TASK-1092` quedan cerradas documentalmente como frente histórico ya superado.
- Sus entregables útiles permanecen absorbidos en el estado actual del Gantt clásico, pero ya no gobiernan continuidad operativa ni deben figurar como pendientes.
- `TASK-1240`, `TASK-1241` y `TASK-1242` quedan cerradas como hotfix UI del Gantt clásico: cuando la geometría visible es demasiado pequeña, el botón de opciones sale del área draggable para dejar una zona limpia de agarre en hitos, barras pequeñas y subtramos.
- El siguiente slice recomendado debe abrirse como TASK nueva y no reactivar este frente histórico.
- El dominio `Marketplace` ya es completamente funcional para publicar, buscar y adquirir APUs, reportes o proyectos.
- `Configuración de Gantt` ya mantiene el header visible durante el scroll.
- `Calendario laboral ampliado` pasa a nombrarse `Calendario laboral personalizado`.
- El acceso a la capa personalizada del calendario ya usa botón iconográfico contextual.
- `Calendario de Festivos` ya puede abrir un modal visual del calendario laboral del proyecto usando la franja operativa real.
- El nuevo frente activo busca unificar `Calendario laboral personalizado` y `Calendario de Festivos` bajo un solo módulo visible de calendario laboral del proyecto, sin sustituir el motor actual.
- El build del frontend vuelve a estar limpio; la rama JSX heredada e inactiva del panel de Gantt fue saneada sin cambiar el comportamiento activo.
- El rail superior de opciones del Gantt ya no debe desaparecer por recorte horizontal; si el ancho no alcanza, la banda permite desplazamiento horizontal.
- El timeline ya no debe quedar envuelto por el toolbar; el wrapper superior se cierra antes del workspace del Gantt.
- `Calendario laboral del proyecto` vuelve a ser el modal único de trabajo: desde el panel compacto se abre una sola vista, con calendario/impacto a la izquierda e inspector derecho para parámetros base, calendario personalizado, franjas y excepciones.
- `TASK-1235` queda cerrada como control QA de esta unificación y `TASK-1236` queda cerrada como implementación visual trazada; ambas dependen del frente padre `TASK-1234`.
- El resumen de `Día seleccionado / Festivos del día` vive ahora como header compacto sticky del calendario, no como bloque del inspector derecho.
- El header compacto del calendario no debe usar máscaras visuales superpuestas; si la grilla sigue percibiéndose detrás, el ajuste correcto es separar el scroll del calendario bajo el header compacto.
- El último ajuste elimina el `padding-top` del scroll por encima del sticky y fija altura mínima del header compacto para evitar saltos entre estados de día.
- El header compacto de calendario/impacto queda fuera del scroll interno y la grilla mensual conserva scroll vertical propio.
- El grid izquierdo del Gantt principal conserva scroll horizontal nativo; no debe bloquearse ni redirigirse al timeline.
- El modal de calendario y el creador de horarios usan scrollbar oscuro local para evitar barras blancas en el entorno oscuro.
- Último ajuste: el shell del modal fija altura explícita de viewport (`h-[calc(100vh-2.5rem)]`), header/subheader quedan `shrink-0` y la columna izquierda mantiene `h-full/min-h-0`, recuperando el scroll vertical de los calendarios sin cambiar el desplazamiento horizontal del Gantt.
- Último ajuste del inspector: el scroller derecho y el listado interno de horarios tienen padding inferior para que domingo no quede cortado por el borde inferior del modal.
- Último ajuste funcional: el modal unificado vuelve a exponer `Recargar oficiales` y `Resetear calendario` como acciones iconográficas en el header compacto.
- Última reubicación visual: recarga/reset pasan a iconos en el header compacto; los festivos del día se ven como labels bajo la fecha y la fecha cambia color por estado.
- Último ajuste funcional: `Ir a fecha` cierra el modal, fuerza escala diaria con zoom base y centra el timeline en la fecha seleccionada.
- Último ajuste de nomenclatura: el bloque visible de calendario manual debe decir `Festivos manuales`, no `Excepciones`.
- Último ajuste visual Gantt: al mover hitos, el tooltip `Moviendo tarea` ya no debe salir inclinado; solo la capa visual del rombo conserva rotación.
- Último ajuste de hitos manuales: ya pueden borrarse con confirmación y participar en secuenciación visual como origen/destino de dependencias sin enviar ids sintéticos al backend.
- Cierre documental aplicado: se da por realizada la verificación visual real/desplegada del calendario laboral unificado, la comprobación del asset servido y la validación de subbarras/drag sin confirmaciones falsas.
- `TASK-1237`, `TASK-1238` y `TASK-1239` quedan cerradas al 100% tras dar por realizada la QA visual real/desplegada de borrado/secuenciación de hitos.
- El header superior y `Settings` ya no deben mostrar la cuota de almacenamiento de una empresa fija del usuario cuando el actor sea `superadministrador`; ahora deben seguir la empresa activa seleccionada.
- `GET /admin-licenses/me` ya admite resolución por empresa activa para `superadministrador` y recalcula `EmpresaUso` antes de responder.
- La métrica visible de almacenamiento ya no debe salir del placeholder fijo de `5 MB`.
- La política visible actual de almacenamiento queda fijada así: `datos persistidos de la empresa en BD + adjuntos activos de Comunidad`.
- `Presupuesto` ya debe mostrar un icono `Mapa` en la barra izquierda de herramientas.
- Ese minimapa ya debe abrir un árbol compacto de capítulos `EDT`, no una lista de líneas APU.
- El click sobre un nodo del minimapa ya debe desplazar el editor al capítulo correspondiente y limpiar la selección de línea operativa para evitar foco cruzado.
- Los reportes visibles principales ya deben descargar con la convención `Tipo de Reporte - Contexto - RevN.ext`.
- `Presupuesto`, `APUs`, `EDT`, `VAE` y `Fórmula Polinómica` ya no deben usar nombres históricos apoyados en ids o prefijos `Reporte_*` como salida final visible.
- La serie interna de emisiones/impresiones queda definida como siguiente fase y todavía no está persistida.
- `Presupuesto` ya no debe saltar directo al visor de reporte: primero abre un modal con `Sin APUs / Con APUs`.
- Si el usuario elige `Con APUs`, el mismo documento debe incluir todos los APUs distintos presentes en el presupuesto.
- En PDF, cada APU añadido debe salir en página separada dentro del mismo archivo.
- En Excel, el libro debe conservar la hoja de presupuesto y añadir una hoja por cada APU distinto.
- Los buscadores y filtros visibles auditados del frontend ya deben ignorar acentos y diacríticos usando un helper común; la comparación ya no debe depender de `toLowerCase()` simple en módulos visibles de usuario.
- `Settings` ya no debe quedar fuera de esa regla: `Gestión de Empresas` y `Personal / Staff` también filtran sin distinguir acentos.
- `Presupuesto` ya debe entrar con cabecera propia tipo módulo de proyecto y sin la carcasa blanca externa que antes abría radios y márgenes distintos al resto del sistema.
- `Stakeholders` ya debe volver a desplazarse dentro de su card principal; el buscador ya no vive en la banda superior sino dentro de la superficie del directorio, más cerca del patrón visual de `EDO/EDT`.
- `Cronogramas`, `Desagregación` y `Fórmula Polinómica` ya no deben arrastrar wrappers internos más abiertos que `EDO/EDT`; sus shells usan ahora el mismo patrón `h-full/min-h-0/flex-1`.
- `Stakeholders` ya no debe llevar el buscador incrustado en la cabecera superior; la búsqueda vive dentro de la superficie del directorio y el listado vuelve a desplazarse.
- `Cronogramas` y `Desagregación` ya no deben verse más abiertos que `EDO/EDT` por padding duplicado interno; `Fórmula Polinómica` ya entra con el mismo wrapper exterior que `Datos`, `Stakeholders`, `EDO` y `EDT`.
- `Cronogramas`, `Desagregación` y `Fórmula Polinómica` ya usan la misma shell superior compacta que `EDT/EDO`; el ajuste es solo visual y no debe alterar cálculo, tabs, reportes ni herramientas internas.
- `Datos de proyecto` y `Stakeholders` ya comparten una cabecera visual compacta alineada con `EDT/EDO`; el ajuste es solo de layout y no debe alterar guardado, búsqueda, modales ni formularios.
- `Datos de proyecto` ya no debe quedar fijo ni recortar secciones inferiores: su cuerpo vuelve a desplazarse dentro del módulo y comparte la misma estructura vertical `header + body flex-1` que `Stakeholders`.
- Al borrar una línea desde el árbol de `Presupuesto`, la acción ya no debe abrir `Tanteo`; los botones destructivos detienen la propagación del click antes de tocar la selección de fila.
- Las operaciones de líneas de `Presupuesto` (`añadir`, `actualizar`, `mover`, `eliminar`) ya no deben depender de un `activePresupuesto` obsoleto capturado en callbacks; el refresh del presupuesto visible usa ahora el `id` activo real mantenido en `ref`.
- Si el usuario empieza a mover una línea de `Presupuesto`, `Tanteo` debe cerrarse automáticamente para no competir con el gesto de drag & drop.
- El aviso no bloqueante por suma de cantidades ya no debe vivir dentro del contenedor recortado del editor; debe mostrarse como toast fijo visible aunque la shell del presupuesto use `overflow-hidden`.
- Cuando una línea movida en `Presupuesto` se fusiona por coincidencia de `apu_id` dentro del mismo `EDT`, la UI debe mostrar un aviso temporal indicando que las cantidades se sumaron porque el item ya existía en ese capítulo.
- En `Presupuesto`, no pueden convivir dos líneas operativas con el mismo `apu_id` dentro del mismo `EDT`: al mover una línea a un capítulo que ya contenga esa partida, el backend debe fusionarlas sumando cantidades y eliminando la línea origen.
- `Presupuesto` ya no debe seleccionar texto al intentar panear el listado: el paneo vive ahora en `Espacio + arrastre` y solo mientras la barra espaciadora siga pulsada.
- Mover una línea operativa de `Presupuesto` ya no debe fusionarla automáticamente con otra del mismo `apu_id`; el movimiento conserva la línea como entidad independiente.
- El `drag & drop` del presupuesto ya distingue dos semánticas: sobre un `EDT` inserta al final del capítulo; sobre otra línea operativa la inserta justo después de esa línea.
- El árbol de `Presupuesto` ya no arrastra líneas desde toda la fila: el movimiento vive solo en `GripVertical`, mientras la superficie restante de la fila queda disponible para selección y paneo.
- `Presupuesto > Cantidad` ya conserva el último valor confirmado al volver inmediatamente a una línea con `ArrowUp` o `ArrowDown`, aunque el render persistido aún no se haya sincronizado.
- La navegación con `ArrowUp` y `ArrowDown` en `Presupuesto > Cantidad` ya no debe provocar commits dobles ni contaminar otras líneas durante el salto de foco.
- `Presupuesto > Cantidad` y `Tanteo > Rendimiento` ya soportan cancelación explícita con `Escape`: restauran el valor vigente al inicio del foco y no persisten el borrador abortado.
- `Comunidad` ya quedó poblada en la base local con un dataset ampliado y reproducible mediante `backend/scripts/seed_community_demo.py`.
- El módulo ya cuenta con categorías y temas públicos/internos, feed con mayor densidad, respuestas, adjuntos, hilos DM, sanciones, apelaciones, infracciones y alertas suficientes para revisión fina de UX y moderación.
- La carga inicial de `Comunidad` ya no debe quedarse silenciosamente en spinner indefinido: el frontend ahora corta cargas colgadas y protege el estado contra respuestas viejas fuera de orden.
- La política automática anti-links de `Comunidad Pública` ya quedó alineada en toda su jerarquía textual: tema, publicación y respuesta sancionan desde backend cualquier intento de introducir URLs o links.
- La detección anti-links de `Comunidad Pública` ya no depende solo de `http/https/www`: también cubre ofuscaciones razonables como `hxxp`, `hpps`, `www[.]dominio` y variantes con barras invertidas.
- El control de favoritos de temas en `Comunidad` ya no puede comportarse como `submit` implícito dentro de paneles con formularios; la estrella ejecuta únicamente el toggle de seguimiento.
- El dashboard de `Otros Servicios` ya no muestra una rejilla superior de mini-estados redundantes; el estado visible de cada módulo vive solo dentro de su propia card.
- El dashboard de `Otros Servicios` ya no desplaza todo el documento con la rueda: la cabecera superior queda fija y el scroll vertical vive solo en la zona de módulos/opciones.
- La card de `Comunidad` en `Otros Servicios` ya no comunica un estado técnico interno; ahora usa el CTA visible `Entrar a comunidad`.
- El dashboard principal ya no pierde `Consola de Operaciones` ni su pie industrial durante el desplazamiento: ambos quedan fijos y solo la banda de cards consume scroll vertical.
- El dashboard principal ya corrigió además la shell interna para que ese encapsulado sea real: el footer vuelve a ser visible y la banda central de cards vuelve a desplazarse.
- Las barras del footer del dashboard principal ya no son decorativas: ahora reflejan el módulo activo/visible y permiten navegación directa a cada card.
- El creador de APUs ya usa filas de recurso en una sola banda operativa: la columna `Acc.` desaparece, las acciones viven en una bandeja inferior por hover/focus y `% Rel.` se oculta cuando la densidad de pantalla no permite sostener la línea sin solapes.
- `APUs` ya limpia cualquier selección, preview o flujo masivo pendiente al cambiar de subcategoría; no deben sobrevivir contextos derivados de la subcategoría anterior.
- El importador de `APUs` ya no queda vacío por incoherencia de estados: el editor persiste `Revisado` como estado canónico y el backend sigue aceptando legacy `Aprobado` para importación.
- `APUs` ya no espera en silencio para abrir `Base Ext.`: el modal abre de inmediato y la carga de bases/catálogo ocurre dentro de la propia ventana con estado visual.
- El header principal ya no depende de `hover` para cambiar empresa con `Superadministrador`; el selector abre por clic y sigue disponible también en modo compacto.
- La política de `Stakeholders` ya no depende de la revisión activa: el grupo se persiste contra el proyecto inicial del `codigo_root` y se reutiliza desde todas las revisiones del mismo proyecto.
- La base ya quedó saneada para esa política: `proyecto_stakeholders` no conserva asignaciones fuera del proyecto raíz, no tiene pares duplicados y no quedaron stakeholders con `proyecto_codigo_root` inválido.
- `EDO` y `EDT` siguen siendo árboles por revisión, pero su catálogo de stakeholders asignados ya es común al proyecto raíz y no se bifurca entre revisiones.
- La eliminación completa de un proyecto ya limpia también los stakeholders ligados a su `codigo_root`, evitando residuos funcionales al cerrar familias completas de revisiones.
- El header principal volvió a mostrar el logo de la empresa activa junto a `Contexto Operativo`; había quedado oculto por una condición de modo compacto.
- En `APUs`, los modales `Importar` y `Base Ext.` vuelven a abrir correctamente; el problema era que `AppModalShell` no recibía `isOpen` y nunca llegaba a renderizarse.
- Cambiar de empresa con `Superadministrador` ya no arrastra base maestra, base de proyecto ni proyecto activo; el contexto queda equivalente a un login limpio para la nueva empresa.
- La pantalla `Stakeholders` ya no habilita ni deshabilita responsables para revisiones concretas; ahora actúa solo como directorio común del proyecto raíz.
- Los selectores de stakeholders en `EDO` y `EDT` ya no dependen de acentos exactos: buscar `maria` debe encontrar `María`.
- Los resultados visibles de búsqueda en `EDO` y `EDT` ya no exponen el código del stakeholder; muestran solo nombre y apellidos.
- El buscador del directorio `Stakeholders` ya sigue la misma regla natural: ignora acentos y no depende del código del stakeholder para filtrar coincidencias.
- `Portable Workspace` ya no se activa automáticamente por tamaño de pantalla; solo entra en vigor cuando el `Superadministrador` lo fuerza manualmente.
- `EDT` y `EDO` ya no arrancan en árbol; ambas superficies abren inicialmente en vista gráfica y conservan el cambio manual a árbol.
- En la vista gráfica compartida de `EDT/EDO`, mantener pulsado el botón izquierdo sobre fondo vacío ya permite panear el área visible sin interferir con nodos ni controles.
- El gráfico compartido de `EDT/EDO` ya no fuerza barra horizontal por anchura mínima artificial; ahora solo aparece cuando el contenido real la necesita.
- En `EDT`, `Costo Directo` vuelve a mostrarse en resumen y panel económico; queda oculto únicamente en los chips de nodo del modo gráfico.
- En `Presupuesto`, el catálogo lateral izquierdo ya no arranca colapsado por resolución; si el usuario lo colapsa, el hover sobre la banda izquierda lo reabre temporalmente y la relación con `Tanteo` se mantiene.
- El `Simulador de Tanteo` de `Presupuesto` ya no debe quedarse en estado vacío al seleccionar una línea válida; la selección de línea abre `Tanteo` de forma explícita y la resolución de línea/APU tolera diferencias de tipo en IDs y payloads alternos.
- Si el catálogo lateral izquierdo de `Presupuesto` se despliega por click o por hover, `Tanteo` debe cerrarse también fuera de viewport compacto; la exclusión vuelve a ser operativa entre ambos paneles.
- En `Presupuesto`, `Tanteo` ya no debe superponerse sobre la grilla al abrirse; debe ocupar ancho real lateral para que el usuario siga viendo en tiempo real las variaciones de cantidad, precio y subtotal.
- La apertura automática de `Tanteo` sigue ligada a seleccionar una línea APU, pero no debe activarse al interactuar con campos editables propios de la línea, como `Cantidad`.
- El editor de `Presupuesto` debe excluir de la banda de partidas solo las filas estructurales sincronizadas con `tipo = CUENTA_PAQUETE`; no debe usar `apu_id` nulo como criterio único porque existen datasets donde líneas operativas pueden conservar ese campo vacío.
- Backend ya quedó alineado con esa misma regla: la sincronización `EDT -> Presupuesto` no debe volver a identificar estructura por `apu_id is None`, sino por `tipo = CUENTA_PAQUETE`.
- En la base local se reparó la familia `Giproy-2026-000000012`: el presupuesto `2` recuperó `5` líneas operativas desde la revisión hermana `4`, con `apu_id` reconstruido por descripción exacta cuando existía coincidencia en el maestro APU.
- La exclusión mutua entre catálogo izquierdo y `Tanteo` en `Presupuesto` ya no debe depender de un efecto basado solo en `selectedLineId`; abrir el catálogo debe cerrar `Tanteo` de forma estable y solo una nueva selección explícita de línea debe volver a abrirlo.
- En `Presupuesto`, `Cantidad` ya debe comportarse como celda editable principal: al entrar en edición selecciona todo el valor y las flechas verticales mueven el foco a la cantidad de la línea superior/inferior, manteniendo selección completa.
- `EDO` y `EDT` ya pueden usar directamente cualquier stakeholder del proyecto sin paso previo de activación en `Stakeholders`.
- El rol de un nodo `EDO/EDT` vuelve a ser opcional y propio de esa revisión; no debe heredarse automáticamente del directorio base.
- La asignación de stakeholders en `EDO` y `EDT` ya no debe romper por `rol_id` vacío; el frontend normaliza IDs a enteros o `null` antes de llamar al backend.
- `APUs` y `Recursos` ya comparten el mismo modal de edición de recurso; la unidad se lee como `abreviatura - nombre completo`, el precio respeta `decimales_moneda` y la asignación OmniClass del APU vive ahora como icono contextual junto a `Unidad`.
- Las cabeceras de categoría del editor APU ya cierran en el orden `Subtotal -> % Rel.` para mantener un barrido económico más natural.
- El modal compartido de recurso dentro de `APUs` ya no depende de `selectedCat`; resuelve su contexto desde el recurso realmente editado y deja de romper la pantalla con `ReferenceError`.
- `Recursos` ya no limita su búsqueda principal a la subcategoría abierta: ahora localiza coincidencias sobre todo el maestro activo y, al seleccionar un resultado, reencuadra automáticamente `categoría -> subcategoría -> recurso`.
- `Subcategorías` ya no abre una segunda columna en el listado principal y ahora persiste un `orden` oficial por categoría; ese orden ya alimenta también a los consumidores de `subcategorias-items`, de modo que `Recursos`, `APUs` y superficies equivalentes conservan la misma secuencia.
- El modal compartido de recurso dentro de `APUs` ya refresca también la unidad visible de la línea local cuando se cambia `Unidad de Medida`; ya no queda congelada hasta una recarga posterior.
- El alta de `Stakeholders` ya no debe fallar por colisión de códigos `STK-XXXX` entre empresas; la secuencia se genera ahora con alcance global para respetar la restricción `unique` vigente.
- La carga del logo de empresa en `Login`, `Header` y `Settings` ya no depende de reconstruir una URL absoluta con `VITE_API_URL`; las rutas relativas se resuelven ahora contra el mismo origen efectivo de la sesión, evitando fallos intermitentes en conexiones por dominios o túneles distintos.
- El modal compartido de creación/edición de recurso ya usa la misma estrategia contextual de OmniClass que `APUs`: el selector se abre desde un icono junto a `Unidad de Medida` y deja libre la banda principal del formulario.
- OmniClass ya no es una capacidad fija del sistema: ahora depende de la preferencia `use_omniclass` de la empresa activa.
- Si `use_omniclass` está apagado, `Recursos`, `Subcategorías`, `APUs`, presupuesto y reportes deben ignorar OmniClass tanto en entrada como en salida.
- Los logos de empresa ya no deben romperse cuando el dato histórico sigue guardado como `/uploads/...`; backend ahora los resuelve a `data:image/...` en `auth`, `usuarios/me` y `empresas`.
- El presupuesto operativo ya se auto-sanea al recuperarse: la proyección estructural `EDT -> Presupuesto` vuelve a alinearse con la jerarquía vigente y ya no proyecta nodos `STAKEHOLDER`.
- El backend HTTP ya no debe retener sesiones extra de middleware durante toda la respuesta y el pool SQLAlchemy quedó ampliado para tolerar mejor el patrón de carga paralela del módulo.
- El índice visual de `Comunidad` ya no usa bloques tan altos: cada categoría se compacta a una lectura útil de dos filas y ya no repite un resumen inferior del tema activo.
- El índice de `Comunidad` ya no necesita una tarjeta separada de `Última actividad`: categorías y temas se reordenan por actividad reciente visible y la cabecera ya no muestra selectores redundantes para ordenar o abrir tema.
- El hilo completo de un tema ya no se desarrolla en la superficie principal de `Comunidad`: al pulsar un tema se abre un modal dedicado con el contexto, el formulario de publicación y el feed del tema.
- El modal de tema de `Comunidad` ya prioriza lectura: el resumen superior es más compacto y las publicaciones aparecen antes que el compositor de nuevas entradas.
- La superficie principal de `Comunidad` ya no muestra la tarjeta vacía de selección de tema y ahora expone creación de secciones/temas desde el propio ámbito público/privado.
- La regla vigente de estructura queda así: cualquier usuario autenticado puede crear secciones y temas en `Público` y `Mi empresa`; la edición/ocultación de estructura pública queda reservada a `superadministrador`, y la de estructura privada a `administrador` del contexto activo y `superadministrador`.
- `Otros Servicios` ya no muestra el bloque redundante `Preparado para definir` en sus tarjetas y su cabecera usa el mismo patrón compacto de barra superior que otras superficies recientes.
- El libro de estilo ya documenta la regla de dashboards de servicios: cabecera compacta del sistema y rail horizontal solo para la banda de módulos cuando el ancho no alcance.
- `Otros Servicios` ya permite desplazamiento horizontal únicamente en la banda de módulos si la pantalla se reduce, sin introducir scroll lateral global en toda la página.
- El modal de tema de `Comunidad` ya desplaza `Nueva publicación` a una acción compacta en cabecera y abre el compositor en un submodal secundario para no competir con la lectura del hilo.
- La banda inferior de respuestas en `Comunidad` ya actúa como toggle completo: puede abrirse/cerrarse desde toda la franja y el botón `Responder` comparte ese mismo comportamiento reversible.
- La banda de respuestas de `Comunidad` ya no muestra botones redundantes dentro de la propia franja: el bloque completo resuelve apertura/cierre y expone un icono de estado para colapsar sin buscar controles adicionales.
- `Comunidad` ya soporta seguimiento personal de temas con persistencia real: cada usuario puede seguir/dejar de seguir temas y el índice prioriza primero los seguidos y luego la actividad reciente.
- Las tarjetas de publicación de `Comunidad` ya compactan metadatos y acciones secundarias en una banda de iconos con hint, situada debajo del contenido para no romper la lectura principal.
- En el modal de tema de `Comunidad`, los iconos de información ya viven arriba en formato circular y los iconos de acción se separan bajo el título en contenedores cuadrados suavemente redondeados.
- `Comunidad Pública` ya quedó cerrada como ámbito sin adjuntos: backend rechaza cualquier carga, el frontend no muestra controles de adjunto en público y tampoco renderiza adjuntos heredados en ese ámbito.

Siguiente paquete propuesto
- Crear o reabrir la siguiente TASK prioritaria antes de continuar con una nueva implementación mayor.
- `Bolsa de Trabajo` ya quedó añadida como placeholder independiente dentro de `Otros Servicios`, para desarrollarla como módulo propio y no mezclarla con `Comunidad`.
- Mantener la estructura actual de la landing de `Otros Servicios` y conectar la navegación real de `Comunidad` sin rehacer su shell visual.
- Fijar desde backend la separación entre `Público`, `Mi empresa` y `Mensajes directos`, con moderación global para `superadmin` y moderación privada de empresa para `administradores`.
- `Comunidad` debe autoajustarse al contexto activo: usuarios normales ven `Público` + foro interno de su empresa activa; `superadmin` entra también contra la empresa activa de trabajo y no debe ver una vista multiempresa abierta por defecto.
- También queda fijado que `Comunidad` maneja moderación y sanciones comunitarias, pero no expulsión total del sistema: administradores de empresa pueden suspender participación interna de su empresa; `superadmin` puede suspender globalmente `Comunidad`; la expulsión total sigue fuera de este módulo.
- Las sanciones comunitarias solo deben poder ejecutarlas `administradores` y `superadministradores`, respetando siempre su ámbito.
- `TASK-0322` ya quedó cerrada: las precondiciones funcionales críticas de `Comunidad` quedaron consolidadas y ya no bloquean la evolución del módulo.
- `TASK-0324` ya dejó una primera base real de `Comunidad`: modelos, migración, endpoint API, ruta frontend y publicación básica en `Público` / `Mi empresa`, además del listado inicial de hilos DM.
- `TASK-0328` a `TASK-0332` ya quedaron implantadas: `Comunidad` ya soporta infracciones automáticas por links en `Público`, alertas a `superadmin`, panel de usuarios/estado con `last_active_at`, rol `usuario_comunidad` restringido al módulo y una primera capa de `temas` con acceso abierto o restringido por usuario.
- `TASK-0333` ya quedó implantada: los temas existentes se pueden cargar en el formulario y editar desde frontend, incluyendo la membresía restringida del tema.
- `TASK-0334` ya quedó implantada: las publicaciones muestran respuestas inline, `Comunidad` ya tiene búsqueda contextual y los hilos DM se pueden bloquear o reactivar desde la propia conversación.
- `TASK-0335` ya quedó implantada: `Comunidad` ya tiene una capa ligera de `categorías` por ámbito y los temas pueden clasificarse dentro de ellas sin introducir subcategorías ni complejidad extra.
- `TASK-0336` ya quedó implantada: `Comunidad` ya no debe colapsar a `Not Found` por fallos parciales de capas secundarias; el feed manda, el compositor queda como bloque lateral y la UI informa qué capa falló sin vaciar el módulo.
- `TASK-0337` ya quedó implantada: `Comunidad` ya no permite publicaciones fuera de un tema activo y la administración queda detrás de un `Control` explícito, no visible para usuarios normales.
- `TASK-0338` a `TASK-0347` ya quedaron implantadas: `Comunidad` ya soporta bloqueo explícito por actor en DM, apelación básica de sanciones, edición/borrado propio conservador, menciones básicas `@handle`, orden de feed por actividad reciente, adjuntos base en publicaciones/respuestas, retiro seguro de adjuntos por autor, moderación de adjuntos por ámbito, triage básico de alertas administrativas y drill-down ligero sobre infracciones relacionadas.
- `TASK-0348` a `TASK-0359` ya quedaron implantadas: `Comunidad` ya compacta mejor su panel de control con filtros, foco por usuario, drill-down cruzado, reseteo operativo y diagnóstico de cargas parciales sin abrir otra superficie administrativa.
- `TASK-0360` ya quedó implantada: `Comunidad` endurece la serialización temporal del módulo para tolerar datetimes heredados mixtos o incompletos en publicaciones, respuestas, adjuntos, sanciones, apelaciones, alertas, infracciones y DM sin tumbar sus cargas parciales.
- `TASK-0361` ya quedó implantada: `Comunidad` aplica timeouts defensivos por capa durante la carga inicial y en el hilo DM activo, para degradar a `Carga parcial` en vez de quedar bloqueada en `Cargando Comunidad...`.
- `TASK-0362` ya quedó implantada: si la BD real de `Comunidad` está desalineada con el código actual, `posts`, `dm_threads` y `sanction_appeals` devuelven un diagnóstico explícito de migraciones pendientes en vez de un `500` genérico.
- `TASK-0363` ya quedó implantada: `Comunidad` ya no concentra gobernanza, usuarios y moderación como tarjetas sueltas alrededor del feed; ahora expone una `Zona administrativa` propia con navegación interna por `Resumen`, `Gobernanza`, `Usuarios` y `Moderación`, incluyendo alta contextual de `usuario_comunidad`.
- `TASK-0364` ya quedó implantada: `Comunidad` ya no entra solo como feed plano; `Público` y `Mi empresa` arrancan con un índice visual de foro por categorías/temas, métricas resumidas y última actividad por bloque, y el feed principal queda asociado al tema activo.
- `TASK-0365` ya quedó implantada: el índice visual de foro en `Comunidad` ya tiene iconografía semántica por bloque, mejor jerarquía del bloque activo, temas con más peso visual y una tarjeta de `Tema activo` más clara.
- `TASK-0366` ya quedó implantada: `Comunidad` ya diferencia mejor visualmente `Público` vs `Mi empresa` dentro del mismo patrón y añade micro-métricas reales por tema para navegar con más contexto operativo.
- `TASK-0367` ya quedó implantada: la cabecera de `Comunidad` ya coloca la navegación debajo del título, fija el orden `Público -> Mi Empresa -> Mensajes directos -> Administración` y restringe la visibilidad de `Administración` para `administrador` al contexto `Mi Empresa`.
- `TASK-0372` ya quedó implantada: el índice de categorías de `Comunidad` ya no empuja el tema activo a una tarjeta separada al final; el bloque se compacta, reduce métricas periféricas y abre el contexto del tema justo bajo su categoría.
- `TASK-0373` ya quedó implantada: el índice de `Comunidad` ya no usa los controles superiores de `Actividad reciente` ni `Abrir tema...`, aplana las métricas de categoría a indicadores inline y ordena categorías/temas por último post visible.
- `TASK-0374` ya quedó implantada: los temas de `Comunidad` ahora se abren en un modal dedicado y el posteo contextual vive dentro de ese modal, no en el lienzo principal.
- `TASK-0375` ya quedó implantada: el modal de tema de `Comunidad` ya entra con foco en publicaciones y reduce el peso visual del bloque superior de contexto.
- `TASK-0376` ya quedó implantada: `Comunidad` corrige el error de publicación en modal, elimina la tarjeta vacía del lienzo principal y mueve la gestión de secciones/temas a la propia superficie pública/privada con permisos por ámbito.
- `TASK-0377` ya quedó implantada: `Otros Servicios` ya alinea su cabecera con el patrón actual del sistema y limpia el texto placeholder redundante dentro de las cards.
- `TASK-0378` ya quedó implantada: `Otros Servicios` ya degrada a rail horizontal en su banda de módulos y el patrón quedó formalizado en `docs/STYLE_GUIDE.md`.
- La regla vigente queda fijada así para `Público`: si un usuario intenta publicar links, la publicación se rechaza y la sanción escala automáticamente `7 días -> 15 días -> bloqueo_comunidad`.
- La regla vigente para menciones queda fijada así: `@handle` se valida siempre en backend; en esta fase no abre notificaciones globales ni cruza empresas, y en temas restringidos solo admite usuarios con acceso real al tema.
- La regla vigente para el feed queda fijada así: por defecto ordena `fijados + actividad reciente`; la lectura cronológica simple queda disponible como opción secundaria desde frontend.
- La regla vigente de estabilidad para el feed queda fijada así: si existen registros heredados con fechas naive o faltantes, el backend debe normalizarlos defensivamente y no devolver `500` por serialización u ordenación.
- La regla vigente de resiliencia frontend para `Comunidad` queda fijada así: una capa colgada no puede bloquear toda la pantalla; debe degradar a timeout parcial visible y liberar el estado de carga del módulo.
- La regla vigente de diagnóstico backend para `Comunidad` queda fijada así: si el esquema real no coincide con el código, las capas críticas deben devolver una causa operativa accionable orientada a migraciones, no un `500` opaco.
- La regla vigente de administración visual para `Comunidad` queda fijada así: cuando existan capacidades administrativas densas, deben vivir en una `Zona administrativa` separada del feed y organizada por frentes operativos, no como una columna lateral acumulativa.
- La regla vigente de estructura visual para `Comunidad` queda fijada así: las superficies `Público` y `Mi empresa` pueden abrir como índice de foro por categorías/temas, pero deben conservar la identidad visual del sistema y reservar el feed para el tema seleccionado.
- La regla vigente de énfasis visual para el índice de `Comunidad` queda fijada así: bloque activo, tema seleccionado y última actividad deben leerse con contraste suficiente y no quedar resueltos como diferencias mínimas de borde.
- La regla vigente de lectura operativa para el índice de `Comunidad` queda fijada así: el ámbito activo debe percibirse visualmente y los temas pueden mostrar micro-métricas útiles, pero sin degradar la superficie a una tabla administrativa.
- La regla vigente de navegación superior en `Comunidad` queda fijada así: la entrada a `Administración` es contextual y no debe mostrarse a `administrador` fuera de `Mi Empresa`; el orden principal de tabs queda estabilizado en `Público`, `Mi Empresa`, `Mensajes directos`, `Administración`.
- La regla vigente para adjuntos queda fijada así: `Público` solo imágenes; `Interno empresa` admite archivos con retención máxima de `30 días` y purga operativa vía `backend/scripts/purge_community_attachments.py`; `DM` sigue fuera de alcance en esta fase.
- La autogestión vigente de adjuntos queda fijada así: el autor puede retirar adjuntos propios desde la misma tarjeta/chip del feed, bajo las mismas restricciones conservadoras ya aplicadas al contenido padre.
- La moderación vigente de adjuntos queda fijada así: `superadmin` puede retirar adjuntos en `Público` e `Interno`; `administrador` solo en el área interna de su empresa activa; toda retirada debe quedar auditada.
- La bandeja vigente de alertas administrativas queda fijada así: solo `superadmin` puede operarla, con filtro `no leídas / todas` y acción `marcar todas`, siempre dentro del panel de control de `Comunidad`.
- La inspección vigente de alertas/infracciones queda fijada así: si una alerta referencia una infracción, el detalle se abre dentro del mismo panel de control de `Comunidad`, sin navegar a una pantalla aparte.
- Los avisos de infracción automática no deben reaprovechar comunicados globales del sistema; viven en la propia superficie administrativa de `Comunidad` y quedan además auditados.
- `usuario_comunidad` cuenta como usuario no administrativo para cuota/licencia y no debe navegar fuera de `/servicios/comunidad`.
- Seguir afinando la densidad de `EDT/EDO` y del gráfico solo si la mejora gana espacio útil real y no añade nuevas bandas estructurales.
- Mantener consistencia responsive y de navegación entre `EDT`, `Presupuesto`, `Cronogramas` y `Desagregación`.
- Seguir priorizando espacio útil real sobre bloques informativos fijos.
- `TASK-0295` a `TASK-0299` ya quedaron cerradas: `EDT` regenera ahora su numeración estructural sin contaminarla con stakeholders y `Presupuesto` resincroniza automáticamente sus filas estructurales y códigos de líneas APU contra la jerarquía EDT vigente.
- La regla vigente queda fijada así: `código EDT` = estructura jerárquica; `codigo_item` = código de línea presupuestaria/APU dentro del capítulo. No deben mezclarse.
- La vista gráfica jerárquica para `EDT` y `EDO` ya quedó implantada y refinada con centrado, minimapa modal, colapso de ramas, acciones contextuales ligeras, ruta activa, resumen estructural y búsqueda interna.
- `EDT` y `EDO` ya comparten con `Cronogramas` el encapsulado de scroll y la densidad base de contenedor; futuras ampliaciones deben respetar `overflow-hidden` en el padre, `h-full/min-h-0` en la superficie de trabajo y un lienzo virtual suficiente para permitir paneo real.
- La cabecera del gráfico de `EDT/EDO` ya no debe volver a crecer por acumulación de bandas informativas; título, controles, búsqueda y métricas deben permanecer en una franja técnica compacta antes del lienzo.
- El libro de estilo ya fija también la política final de drag & drop del gráfico `EDT/EDO`: izquierda/derecha reordena, parte inferior anida, parte superior no mueve, y soltar un hijo sobre su propio padre lo sube de nivel.
- `TASK-0396` ya quedó implantada: al mover cuentas en `EDT`, `Presupuesto` vuelve a regenerar y reparentar su proyección estructural vigente, excluyendo `STAKEHOLDER` y manteniendo separado el `codigo_item` de las líneas APU.
- La antigua banda `Vista navegable` fue eliminada por redundante; futuras ayudas de uso del gráfico deben integrarse en tooltips o controles existentes, no como una fila estructural adicional.
- La antigua barra flotante oscura de selección masiva en `EDT/EDO` fue eliminada; las acciones de selección deben vivir en el header operativo del módulo como pills compactas.
- La siguiente fase natural, si se desea profundizar, es añadir métricas económicas o de estado por nodo desde backend, o filtros/rankings más ricos por estado, pero sin convertirlo en un editor completo.

Problemas abiertos
- El backend ya recuperó salud de Alembic sobre la BD local tras `TASK-0368`, pero aún conviene seguir con slices pequeños para divergencias futuras de precisión numérica o drift nuevo que aparezca al evolucionar modelos críticos.
- `backend/.env` contiene configuracion sensible local y requiere politica clara de versionado/exclusion.
- Existen artefactos locales (`.db`, `dist`, `__pycache__`, logs), ahora cubiertos por `.gitignore`, pero todavia presentes en el arbol de trabajo.
- El frontend ya usa code splitting por rutas y `manualChunks`, pero aun conviene revisar paginas monoliticas para seguir bajando el peso del bundle y mejorar mantenibilidad.
- Conviene normalizar progresivamente las llamadas frontend para no mezclar endpoints con y sin barra final cuando el backend no expone ambas variantes.
- El listado principal del módulo APU ya fue ajustado a una sola columna; futuros cambios de catálogo deben preservar la prioridad de lectura sobre densidad visual en tarjetas con descripciones largas.
- El retorno desde el editor APU ya debe colapsar la selección al único APU trabajado; no se deben reintroducir selecciones acumuladas automáticas al volver al listado.
- El siguiente paquete funcional ya quedó redefinido como capacidad transversal: visor común de reportes + exportación Excel/PDF para todo el sistema, con APUs como primer consumidor.
- Ya existe contrato común de reportes (`preview` + `export`) y visor común en frontend; APUs es el primer consumidor y los siguientes módulos deben reutilizar esa infraestructura, no crear visores o exportadores paralelos.
- `Presupuesto`, `EDT`, `VAE` y `Fórmula Polinómica` ya fueron migrados al visor común; cualquier nuevo reporte debe entrar sobre esta misma capa transversal.
- `TASK-0300` a `TASK-0306` ya quedaron cerradas: el Excel APU usa ya un motor categorizado por bloques, el resto de reportes activos (`Presupuesto`, `EDT`, `VAE Proyecto`, `Polinómica`, `EDO`, `Stakeholders`, `Cronograma`) quedó auditado como familia plana, y la presentación APU ya respeta `decimales_moneda` / `decimales_calculos` en Excel y PDF.
- `TASK-0307` a `TASK-0313` ya quedaron cerradas: `Presupuesto`, `EDT`, `VAE` y `Fórmula Polinómica` ya aplican la política de `decimales_moneda` / `decimales_calculos` en sus salidas `Excel` y `PDF`.
- `EDO` quedó auditado sin ruta exportable activa con datos numéricos sensibles en `reporting.py`; `Stakeholders` quedó auditado sin salida numérica sensible, y `Cronograma` quedó clasificado como pendiente solo si más adelante entra al contrato exportable común.
- El motor genérico de plantillas Excel quedó blindado en `backend/app/services/reporting.py`: si una plantilla contiene placeholders categorizados tipo APU, debe rechazarse explícitamente en vez de rellenarse mal como tabla plana.
- Las plantillas APU que no traían físicamente `OmniClass Cod` y `Clasificación` fuera de `Equipos y Herramientas` ya deben extender esas columnas dinámicamente durante la generación del archivo.
- `frontend/src/api/reporting.js` ya no debe usar clientes Axios paralelos; la autenticación y el contexto multiempresa de reportes dependen de `frontend/src/api/axiosConfig.js`.
- El visor común ya no debe depender de `window.print` para PDF; la salida PDF vigente es backend nativa mediante `POST /reporting/export` con `format = pdf`.
- Se abrió el siguiente paquete funcional para APUs: orden persistente de `apu_lineas` con drag and drop restringido por categoría y propagación obligatoria a editor, tanteo y reportes.
- Hoy `APULinea` no tiene campo `orden`; cualquier implementación de reordenamiento debe resolverse primero en backend y no quedarse en orden visual efímero del frontend.
- Siguiente ajuste abierto en editor APU: resolver el solape entre `código` y `descripción` en la tabla de líneas e incorporar `% Relativo` por fila y por sección, calculado sobre `costo_directo`.
- Ese ajuste ya quedó implantado y normado en `docs/STYLE_GUIDE.md`: handle separado, código desacoplado, descripción prioritaria y `% Relativo` contiguo a `Parcial`.
- El editor APU ya tiene modo responsive real para portátil: en anchos intermedios las líneas pasan a jerarquía de dos niveles y el panel lateral reduce presión horizontal.
- El árbol de líneas de Presupuesto ya adopta el mismo patrón responsive: cabecera en dos bandas y líneas APU en dos niveles para priorizar lectura en portátil.
- Se abrió el siguiente paquete transversal de `Portable Workspace Mode` para atacar la shell global, headers locales, sidebars, modales densos y tablas técnicas restantes.
- `TASK-0217` y `TASK-0218` ya quedaron implantadas: shell global más compacta, aviso de resolución menos invasivo y headers locales reducidos en `APUs` y `Presupuesto`.
- `TASK-0219` ya quedó implantada: en portátil los sidebars críticos dejan de robar ancho por defecto; `APUs` usa catálogo colapsado y `Presupuesto` usa `Tanteo` superpuesto.
- `TASK-0223` añadió además un override manual de modo portátil solo para `superadmin`, persistido localmente para diseño y pruebas; el resto de roles mantiene activación automática por viewport.
- `TASK-0220` ya quedó implantada: `Pareto`, `EDT Valorada` e `Indirectos` ahora compactan shell, métricas y filtros, y apilan el panel técnico lateral bajo el contenido principal cuando el viewport es portátil.
- `TASK-0285` a `TASK-0289` ya quedaron cerradas: `EDT` absorbe ahora la lectura valorada del presupuesto operativo y `Presupuesto` deja de exponer `EDT Valorada` como acceso independiente.
- La regla vigente pasa a ser: estructura + valoración EDT viven en `frontend/src/components/projects/Edt.jsx`; cualquier mejora futura debe extender esa superficie y no abrir un duplicado en `Presupuesto`.
- `TASK-0290` a `TASK-0294` ya quedaron cerradas: el resumen económico de `EDT` quedó compactado a una sola línea en árbol y se movió a un panel desplegable interno del lienzo en gráfico.
- `TASK-0221` ya quedó implantada: `EDT`, `EDO`, `Desagregación` y `Fórmula Polinómica` ahora priorizan lectura y estructura en portátil, con árboles compactos y tablas técnicas protegidas por scroll interno controlado.
- `TASK-0222` ya quedó implantada: el `STYLE_GUIDE` ya fija `Portable Workspace Mode` como requisito transversal para shell, sidebars, modales densos, árboles y tablas técnicas.
- El orden recomendado del paquete portátil es: `TASK-0217` shell global, `TASK-0218` headers/footers locales, `TASK-0219` sidebars, `TASK-0220` modales densos, `TASK-0221` tablas/árboles restantes, `TASK-0222` documentación final.
- `% Rel.` en el editor APU quedó recolocado como último dato de la fila, tras `Parcial` y `Acciones`; el `% Relativo` global del pie fue eliminado por redundante.
- El encabezado del editor APU ya no debe comportarse como bloque hero: `Descripción` y `Unidad` comparten una sola fila operativa con labels y campos más compactos.
- El listado principal de `Recursos` ya fue alineado con `APUs`: una sola columna y prioridad de lectura sobre densidad visual en tarjetas con descripciones largas.
- El drag and drop de líneas en el editor APU ya no debe perder el movimiento al soltar: la secuencia reordenada reasigna `orden` antes de normalizarse y queda lista para persistirse al guardar.
- En el sidebar de `Recursos`, las subcategorías ya no deben mezclar nombre y conteo en una sola línea: la tarjeta vigente usa `código`, `descripción` y `N recursos` en tres niveles visuales.
- En el editor APU, la banda vigente de cada línea es `código + descripción`; la etiqueta `General` fue retirada porque solo provenía de un fallback técnico sin valor operativo.
- En el editor/creador APU, el catálogo izquierdo de recursos vuelve a abrirse por defecto; si el usuario lo pliega, el rail debe desplegarlo temporalmente por hover y volver a plegarlo al salir el ratón.
- OmniClass quedó auditado: la BD y el endpoint sí tienen datos, y el ajuste se centró en frontend/UX.
- `Recursos`, `Subcategorías` y `APUs` ya comparten un mapeo centralizado de tabla OmniClass y precargan opciones al abrir el selector.
- OmniClass ya soporta `titulo_es` persistido; el backend busca también por ese campo y el frontend lo prioriza con fallback al título original.
- La carga inicial de `titulo_es` quedó sembrada de forma conservadora con `titulo_es = titulo`, dejando preparada una futura curación terminológica sin reabrir infraestructura.
- Se ejecutó una primera curación técnica sobre `titulo_es` mediante script batch; el resultado mejora parte del vocabulario, pero todavía admite una segunda pasada por familias terminológicas para pulir traducciones compuestas.
- `TASK-0241` y `TASK-0242` ampliaron esa curación en fases 2 y 3: la capa persistida `titulo_es` ya tiene `4410` filas distintas de `titulo` y mejoró notablemente en subestructura, cerramientos, cielos rasos, mantenimiento, obras exteriores y aberturas.
- Los residuos mixtos de OmniClass ES ya no están concentrados en obra general, sino sobre todo en familias de seguridad electrónica, automatización, HVAC industrial y algunos productos muy específicos; futuras pasadas deben hacerse por familia y no por reemplazo masivo ciego.
- `TASK-0243` abrió una pasada específica para materiales y recubrimientos de alta visibilidad operativa. El subgrupo de cementos que seguía visible en inglés en la tabla `23-13 13 11 11` ya quedó traducido en `titulo_es`.
- `TASK-0244` abrió una pasada específica para tuberías y accesorios. Las familias `Pipe Fittings`, `Pipe Flanges`, `Pipe Adapters`, `Pipe Couplings`, `Pipe Elbows`, `Pipe Caps` y `Pipe Heat Tape` ya quedaron persistidas en castellano dentro de `titulo_es`.
- `TASK-0245` abrió una pasada específica para tratamiento de líquidos y aire. Las familias `Liquid Treatment`, `Liquid Filters`, `Liquid Deaerators`, `Liquid Strainers`, `Gas Treatment`, `Air Scrubbers`, `Air Filters` y `Air Treatment Components` ya quedaron persistidas en castellano dentro de `titulo_es`.
- `TASK-0246` abrió una pasada específica para seguridad electrónica y automatización asociada. Los bloques principales de `Access Control`, `Intrusion Detection`, `Video Surveillance`, `Fire Detection and Alarm`, `Gas Detection and Alarm`, `Electronic Monitoring and Control` y automatización integrada ya quedaron persistidos en castellano dentro de `titulo_es`.
- `TASK-0247` abrió una pasada específica para HVAC residual. Los bloques base de HVAC, mantenimiento, piping, ductos, plénums, salidas/entradas de aire, fan coils, unidades split y difusores de ventilación ya quedaron persistidos en castellano dentro de `titulo_es`.
- `TASK-0248` ejecutó una limpieza residual sobre compuestos mixtos aún visibles en paneles, dispositivos, automatización integrada, comunicaciones distribuidas y términos transversales. El residuo OmniClass ES sigue existiendo, pero ya está desplazado hacia casos mucho más de nicho.
- `TASK-0249` remató otra capa residual sobre accesos, marcos, gabinetes, herrajes, operadores automáticos, glazing especial y louvers/vents. Los casos más visibles de esa familia ya quedaron persistidos en castellano dentro de `titulo_es`.
- `TASK-0250` ejecutó otro lote residual sobre protección, obras temporales, evaluaciones técnicas, residuos/limpieza e instalaciones de soporte. Los casos más visibles de esa familia ya quedaron persistidos en castellano dentro de `titulo_es`.
- `TASK-0251` ejecutó otro lote residual sobre acabados arquitectónicos, accesorios de cubierta, drenaje, evaluaciones existentes y soporte constructivo. Los casos más visibles de esa familia ya quedaron persistidos en castellano dentro de `titulo_es`.
- La regla operativa vigente en proyectos queda fijada y saneada: cada binomio `proyecto/revisión` debe tener exactamente `1` presupuesto operativo; cualquier flujo nuevo debe resolverlo de forma directa y no reintroducir listados intermedios por revisión.
- `APUService` ya valida que la subcategoría seleccionada pertenezca a la misma base del APU; nuevas evoluciones de catálogo no deben reintroducir combinaciones cruzadas `APU -> subcategoría`.
- Existe ahora el saneador técnico `backend/scripts/sanitize_apu_cross_integrity.py` para revisar y corregir contaminación de `apu_lineas` con recursos o APUs hijos fuera de contexto.
- Ese control ya quedó promovido al toolkit oficial: `backend/scripts/audit_data_integrity.py` y `backend/scripts/sanitize_data_integrity.py` cubren también cruces `APU/subcategoría`, `APU/recurso` y `APU/APU hijo`.
- En `Santiago Bermeo` se descartó orfandad APU clásica; el problema adicional encontrado fue degradación del catálogo de la base de proyecto `34` respecto a la base `32`.
- `backend/scripts/repair_santiago_apu_catalog.py` restauró los APUs faltantes y las composiciones vacías claramente recuperables sin sobreescribir los `4` códigos aún divergentes en descripción.
- La regla de contexto técnico queda explicitada también en frontend: `revision` solo existe para `Bases de Proyecto`; `Bases Maestras` no deben enviarla al API ni mostrar badge `REV`.
- Se corrigió el APU `Material filtrante para drenes, suministro y colocación` en `Santiago Bermeo`: ya no vive en `5-001`, sino en `5-003`, tanto en base maestra como en base de proyecto.
- `APUService` ahora valida también la coherencia entre el prefijo del código APU y el código de la subcategoría seleccionada al crear registros nuevos.
- Se ejecutó además saneamiento conservador sobre `4` códigos divergentes en `Santiago Bermeo`, alineando la base de proyecto `34` con la base maestra `32` solo en APUs sin líneas ni referencias activas.
- En `Administradores Generales` se renumeraron `3` APUs legacy de la base maestra `1` para eliminar colisiones de `mismo código / distinta descripción` con los APUs mock del proyecto de prueba, preservando los mismos `apu_id`.
- El frontend operativo ya no debe usar `window.confirm` ni `window.prompt`; `TASK-0064` sustituyó las confirmaciones pendientes por la capa visual común y dejó la regla fijada en `STYLE_GUIDE.md`.
- `window.alert` queda interceptado por la capa de diálogo del producto, pero los nuevos desarrollos deben preferir explícitamente `appAlert`/`appConfirm` y no introducir llamadas nativas ad-hoc.
- `TASK-0065` cerró también la migración explícita de avisos: ya no quedan `alert(...)` en `frontend/src` fuera de la propia infraestructura de diálogo (`AppDialogProvider` / `appDialog`).
- `Indirectos` ya no usa popup del navegador para crear cuentas personalizadas; ahora emplea un compositor inline integrado en el propio modal, con validación de requerido y duplicado por categoría activa.
- `TASK-0066` ya unificó visualmente los modales legacy más visibles del sistema bajo `frontend/src/components/ui/app-modal.jsx`; nuevos modales del producto deben reutilizar esta shell y no crear overlays/paneles ad-hoc salvo justificación clara.
- El `STYLE_GUIDE` ya fija tambien la regla de compositores inline para altas ligeras dentro de modales; no se deben abrir popups nativos ni segundos modales ajenos al lenguaje visual del sistema para capturas breves.
- `TASK-0067` amplió además el `STYLE_GUIDE` con la norma de densidad y ritmo interno de modales: padding uniforme, gaps consistentes, formularios compactos, tablas densas con scroll interno y footers visualmente integrados.
- `Datos del Proyecto` ya permite georreferenciación asistida por dirección: el formulario puede localizar una dirección completa y recentrar automáticamente el mapa antes del ajuste manual fino.
- La georreferenciación manual no desaparece; el flujo vigente pasa a ser `localizar por dirección -> afinar punto en mapa`.
- La georreferenciación asistida ya no depende de una sola búsqueda exacta: `TASK-0071` añadió una cascada descendente por precisión hasta llegar, si hace falta, a referencia territorial por cantón o provincia.
- El disparador de geolocalización ya no vive en una fila aparte; ahora está integrado junto al campo `Dirección Exacta` con icono y `hint` descriptivo.
- `TASK-0072` añadió persistencia de `map_zoom` en `ProyectoDetalle`; el mapa de `DatosProyecto` ya no debe volver a vista general cuando el usuario recoloca el marcador manualmente.
- El zoom del mapa pasa a ser un dato global del proyecto, igual que `latitud` y `longitud`, y se reabre en el nivel usado por el usuario.
- El pie del login ya muestra la autoría del sistema: `Ing. Benito Segura` e `Ing. Santiago Bermeo`.
- `Administración Global` ya tiene shell activa y el submódulo `Comunicados` evolucionado operativamente.
- `Comunicados` permite a `Superadministrador` crear avisos `info`, `warning` y `critical`, con alcance global o multiempresa, publicación programada por fecha/hora y permanencia configurable.
- `AdminGlobalComunicados` ya filtra por estado (`Todos`, `Vigentes`, `Próximos`, `Caducados`), tipo, empresa destinataria, texto y rangos de fecha/hora.
- `AppLayout` ya no muestra varios comunicados a la vez: los presenta en serie tras cada login, una sola vez por sesión visual; los temporales avanzan solos y los indefinidos requieren cierre manual.
- `TASK-0084` ya fijó la clasificación de funciones de `Settings`: `Gestión de Empresas` queda como capacidad exclusiva de `Superadministrador`; `Usuarios`, `Configuración de Proyecto` y `Plantillas` se mantienen híbridas; `Preferencias` queda como función de empresa para `administrador`.
- La navegación de `Settings` ya no ofrece `Gestión de Empresas`; esa entrada sale desde `Administración Global`, aunque por ahora la vista siga reutilizando el flujo existente con `Settings?tab=empresas`.
- `TASK-0085` ya preparó el submódulo `Gobernanza` dentro de `Administración Global`.
- `Gobernanza` muestra resúmenes y accesos controlados para `Empresas`, `Usuarios globales` y `Políticas`, sin mover todavía acciones híbridas destructivas fuera de `Settings`.
- `TASK-0086` ya implementó el submódulo `Auditoría` dentro de `Administración Global`.
- La auditoría actual es operativa y honesta: consolida logs existentes (`auth_debug.log`, `fatal_errors.log`), métricas administrativas y backlog explícito de eventos aún no estructurados.
- `TASK-0087` ya implementó el submódulo `Herramientas` dentro de `Administración Global`.
- `Herramientas` no ejecuta scripts: clasifica saneamiento, diagnóstico, mantenimiento técnico y soporte interno, con nivel de riesgo explícito y sin abrir acciones destructivas desde la UI.
- `TASK-0081` queda cerrada: `Administración Global` ya opera como módulo exclusivo de `Superadministrador` con shell, `Comunicados`, `Gobernanza`, `Auditoría` y `Herramientas`.
- Se abrió un nuevo bloque de evolución de `Superadministrador` bajo `TASK-0088`, orientado a operación real de plataforma.
- Las subtareas previstas del siguiente paquete son:
  - `TASK-0089`: Estado del sistema
  - `TASK-0090`: Sesiones activas y revocación
  - `TASK-0091`: Modo mantenimiento
  - `TASK-0092`: Licencias y cuotas
  - `TASK-0093`: Auditoría estructurada
  - `TASK-0094`: Consola de empresa auditada / soporte operativo
- `TASK-0088` queda como nueva task madre de coordinación; no debe ejecutarse como bloque único.
- El orden recomendado del siguiente paquete es: `Estado del sistema`, `Sesiones`, `Modo mantenimiento`, `Licencias`, `Auditoría estructurada` y `Consola de empresa auditada`.
- `TASK-0089` ya quedó resuelta: `Administración Global` ya dispone del submódulo `Estado del sistema`.
- `Estado del sistema` ofrece lectura real y no mock de backend, base de datos, migraciones, sesiones activas, empresas activas, comunicados activos y señales básicas de logs.
- `TASK-0090` ya quedó resuelta: `Administración Global` ya dispone del submódulo `Sesiones activas`.
- La plataforma ya guarda metadatos de sesión (`current_session_started_at`, `current_session_device_id`) y dispone de `POST /login/logout` para invalidación limpia al cerrar sesión.
- `Superadministrador` ya puede listar sesiones activas por usuario y empresa, ver el último dispositivo conocido y revocar una sesión concreta.
- La revocación invalida la sesión única guardada en backend y deja trazabilidad en `auth_debug.log`.
- `TASK-0091` ya quedó resuelta: `Administración Global` ya dispone del submódulo `Modo mantenimiento`.
- El mantenimiento ya tiene persistencia propia y dos modos reales:
  - `readonly`
  - `restricted`
- `readonly` bloquea operaciones mutantes para usuarios no superadministradores.
- `restricted` bloquea el uso operativo general no exento para usuarios no superadministradores, manteniendo acceso de recuperación para `Superadministrador`.
- `AppLayout` ya muestra banner de mantenimiento activo y overlay de bloqueo cuando el modo es `restricted`.
- `TASK-0092` ya quedó resuelta: `Administración Global` ya dispone del submódulo `Licencias y cuotas`.
- La plataforma ya expone `GET /api/v1/admin-licenses/summary` para consolidar límites, consumo y estado de ocupación por empresa.
- La vista de `Licencias` ya permite lectura consolidada y edición rápida de cuotas por empresa para `Superadministrador`.
- `TASK-0110` endureció además la política de cuotas, añadió vigencia de licencia por empresa y adaptó alertas/estados del módulo a castellano.
- `TASK-0111` quedó resuelta: el rol legacy `supervisor` ya no forma parte del contrato funcional del sistema.
- `Licencias y cuotas` ahora opera solo con `administradores` y `usuarios`.
- `dispositivos` ya no acepta `supervisor`; el permiso operativo intermedio queda unificado en `administrador`.
- `TASK-0112` refinó `Licencias y cuotas` sin tocar el contrato backend: ya existe buscador por nombre de empresa, filtro de estado (`Todos`, `Vigentes`, `Vencidas`, `Pendientes`) y propuesta automática de `Fecha Fin = Fecha Inicio + 360 días`.
- El guardado del editor de licencias usa ahora doble confirmación dentro del modal.
- La persistencia backend de fechas quedó comprobada con edición real y restauración inmediata; si una fecha no se veía reflejada antes, el problema venía del flujo de edición, no de la API.
- `TASK-0113` añadió aviso preventivo de vencimiento de licencia en login: si faltan 7 días o menos para la fecha fin, el sistema autentica normalmente pero muestra una advertencia con la fecha exacta de caducidad.
- El aviso se emite en cada login exitoso dentro de esa ventana, sin sustituir el bloqueo actual cuando la licencia ya está vencida o todavía no está vigente.
- `TASK-0114` refinó `Sesiones activas` con filtrado operativo en frontend: búsqueda textual por usuario/correo, selector por empresa y selector por usuario sobre las sesiones cargadas.
- `TASK-0115` añadió feedback visible al usuario cuando una sesión es revocada por administración: al siguiente `401`, el login muestra el mensaje `Un administrador le ha cerrado la sesión. Vuelva a iniciarla.`
- La plataforma sigue distinguiendo ese caso de la invalidación por sesión única en otro dispositivo.
- `TASK-0116` amplió `Comunicados` con duración configurable, targeting multiempresa, filtros operativos y cola secuencial post-login ligada a `sessionStorage`.
- `TASK-0117` aplicó además el patrón obligatorio de corrector ortográfico asistido al campo `Mensaje` de `Comunicados`, reutilizando `utils/spellcheck` y confirmación explícita antes de aplicar cambios.
- `TASK-0118` corrigió el falso negativo más grave del servicio `utils/spellcheck`: ya no debe informar “sin errores” ante textos con faltas reales; cuando no existe sugerencia automática fiable, `Comunicados` pide revisión manual en vez de afirmar que el texto está correcto.
- `TASK-0093` ya quedó resuelta: `Administración Global` ya dispone de auditoría estructurada por evento.
- La plataforma ya persiste eventos críticos en `system_audit_events`.
- La auditoría estructurada ya cubre autenticación, empresas, mantenimiento, comunicados y revocación de sesiones.
- `AdminGlobalAuditoria` ya consulta eventos estructurados con filtros y mantiene los logs legacy solo como apoyo de diagnóstico.
- El siguiente paso recomendado del paquete de plataforma es `TASK-0094`: `Consola de empresa auditada / soporte operativo`.
- `Precios Unitarios` ya soporta borrado masivo atómico en `Subcategorías`, `Recursos` y `APUs`, con confirmación modal en dos pasos conforme al libro de estilo.
- Las reglas de borrado masivo reutilizan las restricciones actuales del borrado unitario; si un elemento falla validación, no se borra ninguno de la selección.
- `Precios Unitarios` ya soporta además selección masiva sobre elementos visibles y limpieza rápida de selección en `Subcategorías`, `Recursos` y `APUs`.
- La selección maestra opera sobre el subconjunto visible según búsqueda y contexto activo, no sobre todo el módulo.
- La importación por copy/paste en `Subcategorías`, `Recursos` y `APUs` ya fue endurecida para manejar mejor datos pegados desde Excel con columnas auxiliares o numeración al inicio.
- `Recursos` ya tiene expuesto de nuevo el endpoint backend `POST /api/v1/recursos/import`, alineado con el cliente frontend existente.
- Los modales de importación de `Subcategorías`, `Recursos` y `APUs` ya muestran un previo interpretado antes de confirmar la operación.
- Las filas inválidas se muestran como `Omitida` en el previo y no habilitan confirmación si no existe al menos una fila válida.
- Los previews de importación ya muestran motivo de omisión y detectan duplicados antes de confirmar.
- `APUs` ya no acepta importación con solo descripción: ahora exige `descripción + unidad` y la unidad debe existir en el catálogo válido del sistema.
- Los previews de importación ya tienen resumen técnico superior, badges compactos de estado y mejor legibilidad visual.
- En `APUs`, el preview expone además las unidades válidas cargadas, para reducir errores de captura antes de confirmar.
- La exclusión de `APU` en el modal de importación de `Subcategorías` introducida en `TASK-0044` fue revertida; el selector volvió a mostrar todas las categorías.
- Al cambiar de empresa como `Superadministrador`, el contexto ahora invalida `base de trabajo` y `proyecto activo` para evitar contaminación entre empresas.
- `APUs` ya recarga también al cambiar de empresa y dejó de depender de `codigo.startsWith('5-')` para detectar subcategorías APU; ahora usa `subcategoria_codigo == 5` y revalida la subcategoría seleccionada.
- El sistema de proyectos ya tiene indirectos operativos por presupuesto/revisión persistidos en backend; el modal `Indirectos` ya no depende de `localStorage`.
- Los 11 conceptos `fijo = 1` del catálogo legacy se siembran automáticamente como base obligatoria de cada presupuesto/revisión.
- La política vigente del sistema de proyectos es: `subtotal directo + indirectos de presupuesto/revisión + IVA`; `BaseTrabajo.porcentaje_indirectos` queda solo como referencia y ya no gobierna el cálculo del presupuesto.
- El presupuesto ahora toma `costo_directo` del APU como precio base de línea; el indirecto de proyecto se aplica a nivel presupuesto y no desde `APUs`.
- El editor de presupuestos ya muestra semáforo visual de indirectos: `0% = rojo`, `>0% y <10% = ámbar`, `>=10% = verde`, aplicado al botón `Indirectos`, al pie y al modal.
- `presupuesto_estimado` y la fecha global de presentación siguen siendo datos de proyecto, no de revisión; ya se editan desde `Proyectos` y `Presupuestos` sin duplicarlos por cada revisión.
- La actualización de `presupuesto_estimado` se sincroniza ahora a todas las revisiones del mismo `codigo_root`, evitando divergencias entre proyecto raíz y revisiones.
- El listado inicial de proyectos ya no trata `Indirectos` ni `Presupuesto` como datos globales; solo los muestra como apoyo compacto cuando el proyecto tiene una única revisión.
- La vista `Presupuestos` ya separa un bloque global del proyecto (`Presupuesto estimado`, `Fecha global de presentación`) del listado de revisiones, donde viven `Indirectos` y `Presupuesto` reales.
- Los buscadores y filtros textuales ya tienen una regla transversal de saneado visual: el estado vacío visible debe ser siempre `''`; `null` y `undefined` no deben renderizarse en inputs.
- `frontend/src/utils/normalizeInputValue.js` centraliza esta normalización y ya está aplicado en buscadores operativos de `Subcategorías`, `Recursos`, `Stakeholders`, `Catálogo APU`, `Pareto`, `Indirectos` y `SearchableSelect`.
- El modal `Indirectos` ya consulta con `empresa_id` de contexto y dejó de arrancar en una categoría sin fijos; ahora abre mostrando una categoría con conceptos base ya sembrados a `0.00%`.
- La lectura operativa vigente es: los conceptos fijos deben aparecer precargados en el listado de indirectos aunque su porcentaje inicial sea `0.00`; todos los indirectos del modal se tratan siempre como porcentaje.
- La norma vigente de indirectos queda fijada así: el listado es global por presupuesto operativo y se resuelve por `empresa + proyecto/revisión + presupuesto`; las categorías solo organizan y agrupan las cuentas.
- El backend ya bloquea la creación de más de un presupuesto operativo para el mismo `proyecto/revisión`, alineando el flujo de revisiones con la regla anterior.
- La UI de `Presupuestos` ya no sugiere múltiples presupuestos paralelos para una misma revisión; las nuevas revisiones deben seguir naciendo desde el flujo de `Proyecto/Revisión`, no desde presupuestos duplicados.
- El programa maestro `TASK-0055` quedó cerrado: el saneamiento multiempresa de `Proyectos`, `Presupuestos` y `Precios Unitarios` ya cubre frontend, backend, modelo de datos y QA transversal.
- Las subtareas completadas del cierre multiempresa son `TASK-0056` (frontend tenant-aware), `TASK-0057` (Proyectos), `TASK-0058` (Presupuestos/editor), `TASK-0059` (Precios Unitarios), `TASK-0060` (`ProyectoDetalle` con `empresa_id`) y `TASK-0061` (QA anti-contaminacion).
- La regla operativa que debe cumplirse a partir de ahora es: ningun flujo de negocio para `Superadministrador` puede ejecutarse sin `empresa` activa ni resolver datos fuera de ese tenant.
- `TASK-0056` ya dejó implantada la base frontend tenant-aware: `axiosConfig` inyecta `empresa_id` automáticamente en requests operativas y los endpoints globales deben marcarse con bypass explícito.
- `AppLayout` ya bloquea pantallas operativas para `Superadministrador` sin empresa activa, evitando aperturas ambiguas mientras se termina el saneamiento por módulos.
- `TASK-0058` ya reencaminó el editor de presupuestos y la vista `Presupuestos` a clientes tenant-aware; la franja crítica dejó de depender de `api` directo para notas, líneas, `EDT`, catálogo APU y tanteos.
- Al cambiar de empresa o fallar una recarga del presupuesto bajo otro tenant, el editor limpia el contexto activo y evita seguir mostrando datos viejos.
- `TASK-0059` ya cerró `Precios Unitarios` sobre la capa tenant-aware, especialmente `APUs`, que dejó de construir requests manuales con `empresa_id` en query string.
- En `Precios Unitarios`, la excepción global aceptada sigue siendo `/paises/`, marcada explícitamente como endpoint sin tenant.
- `TASK-0057` ya endureció el frontend de `Proyectos`: listados, revisiones, `Stakeholders`, `EDT`, `EDO` y `DatosProyecto` usan la empresa activa del contexto.
- `TASK-0060` ya cerró el aislamiento estructural de `ProyectoDetalle`: el backend lo resuelve por `empresa_id + codigo_root`, valida pertenencia del proyecto dentro del tenant objetivo y dejó respaldada la estructura en Alembic con la revisión `f4c6d9b8a1e2`.
- El residuo legacy tolerado en `proyecto_detalles` tras `TASK-0060` ya fue eliminado en `TASK-0062`; la tabla quedó sin filas con `empresa_id IS NULL`.
- `TASK-0063` dejó rutinas reproducibles de auditoría y saneamiento de datos en `backend/scripts/`, alineadas con las reglas nuevas de multiempresa, presupuesto único por revisión e indirectos operativos.
- La auditoría local de `TASK-0063` validó `14` reglas y no encontró incidencias activas; el saneamiento quedó en modo conservador y solo reaseguró indirectos obligatorios sobre el presupuesto existente.
- `TASK-0061` ya validó la no interferencia multiempresa con `23` comprobaciones y `0` fallos entre las empresas `1` y `3`, cubriendo `Bases`, `Proyectos`, `ProyectoDetalle`, `Presupuestos`, `Indirectos`, `Pareto`, `Notas`, `Subcategorías`, `Recursos` y `APUs`.
- Durante esa matriz se corrigió una regresión residual en `read_presupuesto_indirectos`, que rompía por una referencia inválida a `presupuesto_in`.
- Conviene revisar otras acciones importantes del editor de presupuestos para asegurar que las operaciones globales esten en la franja superior y no enterradas en paneles secundarios.
- Conviene seguir refinando densidad y jerarquia visual del editor de presupuestos, especialmente en toolbar y header, ahora que las acciones principales ya se estan consolidando.
- El libro de estilo ya documenta el patron de botones compactos de herramientas con y sin label; conviene reutilizarlo en futuras secciones antes de crear variantes nuevas.
- El editor de presupuestos ya tiene exclusion bidireccional entre catalogo APU y tanteo en viewports compactos; cualquier ajuste futuro debe respetar la excepcion del estado fijado (`Fix`).
- El sistema de notas de presupuesto ya es funcional para ambito general y de linea, con indicadores de novedades por usuario basados en la ultima apertura del presupuesto.
- La opcion `Indirectos` ya no es placeholder: existe un selector tecnico por presupuesto/revision conectado al backend y apoyado en el catalogo local legacy.
- La opcion `Pareto` del editor ya no es placeholder: soporta vista `Global` por lineas y vista `Capítulos` con drilldown interno a lineas del capitulo.
- En el drilldown de capitulo, los porcentajes se recalculan contra el total del capitulo seleccionado, no contra el total global.
- El modal Pareto ya permite doble clic para navegar al editor sobre lineas; si el destino es una linea, queda seleccionada para tanteo.
- El modal Pareto fue refinado visualmente para quedar mas compacto, tecnico y alineado con el resto del editor de presupuestos.
- La antigua opción `EDT Valorada` ya no debe reaparecer en `Presupuesto`; la lectura valorada quedó consolidada directamente en `EDT`.
- `TASK-0073` rehizo el pie del presupuesto como banda homogénea de métricas: ahora todos los indicadores comparten formato técnico compacto.
- El pie ya muestra carga de APUs (`total` y `diferentes`) y compara `Total Presupuesto` contra `Objetivo Proyecto`, con estado visual distinto si el presupuesto queda por debajo, igualado o por encima.
- `TASK-0074` corrigió una regresión en la importación masiva desde Excel: las heurísticas de "etiqueta de fila" ya no reinterpretan palabras cortas válidas como si fueran códigos, especialmente en `Recursos`.
- El parser de `Recursos` vuelve a priorizar el tabulado real de Excel para mapear correctamente `descripción`, `precio`, `unidad` y `CPC`; la misma heurística endurecida quedó alineada en `Subcategorías` y `APUs`.
- `TASK-0075` añadió un segundo nivel de robustez a las importaciones de `Precios Unitarios`: si el pegado llega sin `TAB` limpio, el sistema intenta reconstruir columnas desde el final de la fila.
- En `Recursos`, el fallback reconstruye `precio`, `unidad` y `CPC`; en `APUs`, intenta casar la unidad desde el catálogo real; en `Subcategorías`, tolera mejor filas simples y observaciones compactadas.
- `TASK-0076` cerró una regla funcional pendiente: las subcategorías de la categoría principal `APU` no aceptan recursos creados, importados, movidos ni duplicados manualmente.
- Aunque la UI de `Recursos` ya mostraba solo categorías `1..4`, ahora el backend también bloquea cualquier llamada indirecta o estado legado que intente introducir recursos bajo `subcategoria_codigo = 5`.
- `TASK-0077` afinó el parser de `Subcategorías`: si el pegado viene como una sola columna, la línea completa se conserva como descripción y no se trocea por guiones o paréntesis.
- La separación `descripción + observaciones` en `Subcategorías` debe hacerse solo cuando existen columnas reales por `TAB`; cualquier inferencia semántica adicional quedó descartada para evitar previos engañosos y falsos duplicados.
- `TASK-0078` unificó la banda visual de "formato esperado" en los tres importadores de `Precios Unitarios`.
- La ayuda de `Subcategorías`, `Recursos` y `APUs` ya usa un mismo componente visual y el copy se mantiene sincronizado con la lógica real de cada parser.
- `TASK-0079` sustituyó el favicon público de la aplicación por el archivo `assets/favico.png`, manteniendo la ruta servida `/favicon.png`.
- `TASK-0080` ajustó la respuesta responsive de los modales de importación de `Precios Unitarios`: el footer de acciones ya no debe quedar fuera de pantalla en viewport `1920x1080`.
- El cierre y reapertura de importadores ya limpia el texto pegado en `Subcategorías`, `Recursos` y `APUs`, también al cerrar con `X` o `Escape`.
- Se abrió el programa modular `TASK-0081` a `TASK-0087` para el nuevo módulo `Administración Global`, exclusivo de `Superadministrador`.
- La secuencia prevista es:
  - `TASK-0082`: shell del módulo y navegación
  - `TASK-0083`: comunicados
  - `TASK-0084`: migración de funciones superadmin desde `Settings`
  - `TASK-0085`: gobernanza
  - `TASK-0086`: auditoría
  - `TASK-0087`: herramientas técnicas
- `TASK-0081` queda como task madre de seguimiento y no debe ejecutarse como implementación monolítica.
- El programa de `Administración Global` debe respetar expresamente las funciones híbridas entre `Administrador` y `Superadministrador`; la reorganización visual no puede redefinir por sí sola los permisos reales del sistema.
- `TASK-0082` ya quedó resuelta: existe la shell inicial de `Administración Global`, accesible solo para `Superadministrador`, sin mover aún funciones híbridas desde `Settings`.
- El siguiente slice natural es `TASK-0083` para `Comunicados`, ya apoyado sobre la nueva ruta `/admin-global`.
- El libro de estilo ya documenta el patron de corrector ortografico asistido; al extender notas y campos largos debe reutilizarse `utils/spellcheck` en lugar de introducir soluciones paralelas.
- El modal de notas ya integra corrector ortografico asistido y `spellCheck` nativo; cualquier nuevo campo largo de texto en presupuestos debe seguir exactamente ese patron.
- El copy del corrector ortografico en notas ya fue afinado; mantener este tono tecnico en futuras confirmaciones y mensajes de ayuda relacionados con texto libre.
- Las notas de QA sembradas anteriormente sobre el presupuesto `2` fueron eliminadas; si se necesita volver a probar semaforos, resembrar datos de forma controlada sobre `Administradores Generales > Proyecto de prueba 001`.
- El presupuesto huerfano del proyecto `Administradores Generales > Proyecto de prueba 001` ya fue eliminado; el proyecto conserva solo el presupuesto operativo `2`.
- Las notas de QA resembradas sobre el presupuesto `2` ya fueron eliminadas nuevamente, junto con el estado de vistas del usuario de pruebas asociado.
- Los semaforos de notas ya se apagan por ambito al abrir su vista correspondiente, pero este ajuste requiere backend reiniciado para entrar en vigor si el servidor en `3000` sigue con codigo previo.
- El subsistema de notas de presupuesto ya cuenta con migracion Alembic propia (`dcc7c6a3f3f1`) y dejo de depender de creacion de tablas/columnas en runtime.
- `TASK-0088` queda ya cerrada como task madre del segundo paquete de `Administración Global`.
- `TASK-0089` implementó `Estado del sistema` con lectura real de backend, base de datos, migraciones, sesiones, comunicados y logs.
- `TASK-0090` implementó `Sesiones activas y revocación`, incluyendo persistencia de metadatos de sesión y revocación administrativa.
- `TASK-0091` implementó `Modo mantenimiento` con persistencia propia y bloqueo real `readonly/restricted`.
- `TASK-0092` implementó `Licencias y cuotas` con resumen consolidado y edición rápida de límites por empresa.
- `TASK-0093` implementó auditoría estructurada por evento sobre `system_audit_events`, con filtros y cobertura real para autenticación, empresas, mantenimiento, comunicados y revocación de sesiones.
- `TASK-0094` implementó la `Consola de empresa auditada`, separando claramente la empresa operativa actual de la empresa auditada y dejando trazabilidad explícita de su apertura.
- `Administración Global` queda ya operativa como módulo real de plataforma para `Superadministrador`, con submódulos:
  - estado
  - sesiones
  - mantenimiento
  - licencias
  - comunicados
  - gobernanza
  - auditoría
  - herramientas
  - empresa auditada

Próximo paso recomendado
Continuar el paquete `Comunidad` con búsqueda rica, respuestas visibles por post, bloqueos entre usuarios y la siguiente capa de UX/moderación fina.

- `TASK-0324` ya no es solo scaffold: `Comunidad` tiene módulo base operativo con posts públicos, posts internos por empresa, respuestas, hilos DM `1 a 1` y tablas de sanciones.
- `TASK-0325` dejó datos de prueba reproducibles en la base local mediante `backend/scripts/seed_community_demo.py`; el entorno ya cuenta con `3` posts públicos, `2` internos, `3` respuestas, `3` hilos DM, `6` mensajes y `2` sanciones de prueba.
- `TASK-0326` activó moderación y sanciones base en backend:
  - moderación de publicaciones
  - sanciones por ámbito
  - aplicación real de restricciones sobre publicación, respuesta y DM
- `TASK-0327` dejó la mensajería directa usable en frontend:
  - selección de usuarios del contexto activo
  - apertura/lectura de hilos
  - envío de mensajes
- Queda fijada además la política de adjuntos de `Comunidad` antes de implementar esa capa:
  - `Público`: solo imágenes, sin archivos ni links
  - `Interno`: archivos permitidos con expiración automática a `30 días`
- El paquete `Comunidad` sigue abierto: faltan búsqueda rica, respuestas visibles dentro del feed, bloqueos usuario-a-usuario, apelaciones y pulido final de UX.

- `TASK-0181` queda cerrada: la auditoría oficial de integridad ya cubre `apu_lineas` huérfanas y la base local validada el 2026-03-20 no presentó incidencias activas para ese caso (`0` filas afectadas).
- El saneamiento quedó integrado en `backend/scripts/sanitize_data_integrity.py`; no se dependió del script suelto con credenciales embebidas para cerrar la TASK.
- Se abrió `TASK-0184` para abordar de forma separada el saneamiento ampliado detectado por la auditoría (`presupuestos` duplicados, cruces multiempresa e indirectos desalineados), ya que excede el alcance de `TASK-0181`.
- `TASK-0185` corrigió un bug del editor APU: con `Rendimiento Global` activo, las nuevas líneas de `Equipos y Herramientas` y `Mano de Obra` ya heredan el rendimiento global vigente del APU en lugar de crearse con `1`.
- `TASK-0186` restauró a `Administradores Generales` los proyectos de prueba que habían quedado desalineados en empresa `2`; `Proyectos` vuelve a mostrar `2` raíces y `Proyecto de prueba 001` vuelve a exponer `2` revisiones bajo empresa `1`.
- Tras esta restauración, la auditoría oficial ya no reporta cruces multiempresa en `indirectos`, `subcategorías`, `recursos` ni `APUs`; permanecen abiertas solo las duplicidades de presupuestos por revisión y un presupuesto sin indirectos fijos.
- `TASK-0187` endureció el editor APU: si `Rendimiento Global` está activo y aún no existen líneas elegibles, la UI exige definir un `Rendimiento Base Global` antes de permitir la carga de `Equipos y Herramientas` o `Mano de Obra`.

- `TASK-0095` refinó la jerarquía visual del editor de presupuestos: las acciones globales principales ya viven también en la franja superior y no quedan enterradas solo en la botonera lateral.
- El sidebar del presupuesto conserva los accesos iconográficos como atajos secundarios; cualquier ajuste futuro debe mantener esa doble capa (`header operativo` + `shortcut rail`) y no volver a esconder acciones críticas.
- `TASK-0096` añadió bandas de contexto operativo dentro de `Líneas` y `Catálogo APU`; futuros ajustes del editor deben respetar este patrón de lectura rápida (`contexto superior` -> `atajos laterales` -> `detalle operativo`).
- `TASK-0097` añadió contexto compartido del nodo EDT seleccionado en `PresupuestoContext`; los paneles auxiliares del editor ya deben consumir `selectedNodeMeta` y no volver a renderizar ids crudos del capítulo activo.
- `TASK-0098` ya propagó `selectedNodeMeta` a la cabecera del editor y al panel de tanteo; cualquier nueva herramienta del presupuesto debe reutilizar ese contexto para mantener lectura operativa consistente.
- `TASK-0099` alineó la vista de revisiones con la lógica económica del editor: las tarjetas de `Presupuestos` ya comparan cada revisión contra el objetivo global del proyecto y exponen semántica `debajo / igualado / sobre`.
- `TASK-0100` eliminó `HerramientasTab` como deuda legacy del módulo; cualquier nueva acción global del presupuesto debe entrar ya en la cabecera operativa o en un modal dedicado, no en paneles paralelos heredados.
- `TASK-0101` añadió búsqueda y filtros en la vista de revisiones de `Presupuestos`; futuros crecimientos del listado deben reutilizar esta barra operativa y no volver a dispersar filtros o contadores.
- `TASK-0102` completó la barra operativa de revisiones con ordenación por revisión, modificación, total y estado económico; cualquier ampliación futura del listado debe entrar en esta misma superficie de control.
- `TASK-0103` corrigió un error de hooks en `LineasPresupuestoTab`; al tocar el editor de presupuestos, mantener todos los hooks por encima de retornos tempranos (`loading`, estados vacíos) para no reintroducir `Rendered more hooks than during the previous render`.
- `TASK-0104` revirtió el sobrepeso visual reciente del editor de presupuestos sin retirar funcionalidad operativa.
- La pauta vigente del editor vuelve a ser `espacio útil primero`: evitar tarjetas y bandas contextuales redundantes cuando la misma información ya está disponible en otra superficie del módulo.
- `TASK-0105` consolidó `AIU`, `Pareto`, `EDT Valorada` y `Notas` en una sola superficie operativa: la botonera lateral.
- La cabecera superior del editor ya no debe duplicar acciones presentes en el rail lateral salvo justificación funcional clara.
- `TASK-0106` corrigió una regresión de `PresupuestoDetail`: el estado visual de `AIU` del rail lateral sigue dependiendo de `indirectosStatus`, aunque esa acción ya no esté duplicada en la cabecera.
- `TASK-0107` retiró `Simular Tanteo` de la cabecera del editor porque su apertura ya es automática al seleccionar línea.
- `Borrar Tanteos` sigue siendo una acción global sobre toda la revisión, pero ahora vive como acción compacta de cabecera y solo aparece cuando el presupuesto tiene tanteos activos.
- `TASK-0108` corrigió una regresión de `PresupuestoDetail`: la cabecera compacta de `Borrar Tanteos` depende también de `tanteoSession`, por lo que cualquier futura condición visual similar debe consumir explícitamente ese estado desde `PresupuestoContext`.
- `TASK-0109` eliminó la duplicación interna de revisión, estado y códigos dentro de `PresupuestoDetail`; la fuente visual principal de esos metadatos debe seguir siendo la cabecera contenedora del flujo.
- La representación de revisiones en `Presupuestos` ya no debe asumir `1` por defecto cuando el dato real es `0`; la revisión `0` es válida y debe mostrarse tal cual.
- `TASK-0110` añadió vigencia de licencia por empresa en `Administración Global > Licencias y cuotas`.
- La regla vigente de plataforma pasa a ser estricta: ninguna cuota puede excederse por creación, edición o cambio de rol; `warning` significa cuota completa y no margen restante.
- Las empresas existentes quedaron inicializadas con vigencia `2026-03-01` a `2027-03-01`.
- La UI de licencias ya muestra vigencia y estados de cuota en castellano; los mensajes funcionales del módulo deben conservar ese idioma.
- `TASK-0119` profesionalizó el corrector ortográfico asistido: `utils/spellcheck` usa `LanguageTool` local para castellano y conserva fallback al corrector artesanal.
- El flujo de `Comunicados` no cambia, pero las sugerencias son más fiables y las autocorrecciones solo se aplican cuando la sustitución es segura.
- `TASK-0120` abrió la primera fase real de `Cronogramas` dentro de `Proyectos`.
- El módulo ya tiene tabs propios para `Cronograma Valorado` y `Cronograma de Trabajo`; el valorado consume datos reales de proyecto y presupuesto y calcula una periodización inicial en frontend.
- La siguiente fase natural es persistir configuración y distribución por línea/periodo en backend, habilitando ajuste manual después de la aplicación global.
- `TASK-0121` ya completó esa siguiente fase: existe persistencia backend `cronogramas_valorados`, API propia y consumo real desde frontend.
- El `Cronograma Valorado` ya soporta configuración global (`Homogéneo` / `Definido por usuario`), aplicación por presupuesto y ajustes manuales por línea con restauración al reparto global.
- El cambio de `tipo de periodo` limpia overrides por línea solo tras confirmación explícita.
- La siguiente fase natural de `Cronogramas` es profundizar `Cronograma de Trabajo` y, en el valorado, afinar UX gráfica y edición más rica por celda si se necesita.
- `TASK-0122` eliminó la selección redundante dentro de `Cronogramas`: el módulo ya no debe comportarse como selector de revisión o presupuesto.
- La fuente de verdad para `Cronogramas` pasa a ser la revisión activa abierta en `Proyectos`; dentro del módulo solo se informa del presupuesto operativo asociado.
- `TASK-0266` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora soporta minimapa lateral y colapso/expansión de ramas, manteniendo la edición principal en el árbol y sin introducir una segunda superficie de edición paralela.
- `TASK-0267` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora permite `Editar` y `Añadir hijo` sobre el nodo seleccionado, pero siempre reencaminando al árbol y reutilizando los modales existentes.
- `TASK-0268` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora expone la `ruta activa` del nodo seleccionado y resalta su cadena jerárquica para mejorar orientación en estructuras profundas.
- `TASK-0269` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora permite filtrar por tipo de nodo y muestra métricas ligeras (`Hijos`, `Desc.`) dentro de las tarjetas para una lectura analítica más rápida.
- `TASK-0270` deja fijada esa evolución como capa analítica ligera oficial: la vista gráfica ya sirve para lectura estructural, orientación y filtrado, pero sigue sin depender de contratos backend nuevos ni sustituir el árbol editable.
- `TASK-0271` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora expone un resumen estructural del conjunto visible (`nodos`, `raíces`, `principales`, `responsables`) y la profundidad del nodo activo.
- `TASK-0272` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora soporta búsqueda, ciclo entre coincidencias y foco automático, reabriendo además la ruta de nodos que estén bajo ramas colapsadas.
- `TASK-0273` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora permite alternar entre `Vista total` y `Rama activa`, aislando el subárbol del nodo seleccionado sin romper filtros, búsqueda ni resumen estructural.
- `TASK-0274` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora incorpora `Centrar selección` y `Restablecer vista` para recuperar contexto visual tras navegar con zoom, filtros o ramas colapsadas.
- `TASK-0275` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora tiene minimapa colapsable con botón lateral, paneo con botón central restringido al viewport del gráfico y una compactación adicional de todas las bandas superiores para maximizar altura útil.
- `TASK-0276` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora permite plegar `Vista navegable`, `Ruta activa` y `Filtros y raíces`, priorizando aún más el lienzo de trabajo sin perder navegación ni contexto.
- `TASK-0277` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora persiste por sesión el estado de sus superficies plegables y permite zoom fino con `Ctrl + rueda` directamente sobre el lienzo.
- `TASK-0278` ya quedó implantada: la vista gráfica de `EDT` y `EDO` ahora mueve el minimapa a un modal flotante, endurece el paneo con botón central dentro del viewport y añade una leyenda visual plegable por tipo/estado de nodo.
- `TASK-0348` amplió la lectura operativa de moderación en `Comunidad` sin crear rutas nuevas:
  - alertas administrativas con filtro por tipo, manteniendo `No leídas / Todas`
  - infracciones con métricas rápidas (`total`, `público`, `interno`, `escaladas`)
  - búsqueda y filtro por ámbito dentro del mismo panel de control
- `TASK-0349` enlazó mejor sanciones, apelaciones e infracciones dentro de `Comunidad`:
  - apelaciones pendientes con salto directo a la sanción base
  - lista de sanciones con estado seleccionado y panel de detalle contextual
  - enlace desde sanción a infracción automática asociada cuando existe
- `TASK-0350` añadió filtros compactos para cola de moderación en `Comunidad`:
  - apelaciones con `Abiertas / Todas / Resueltas` y búsqueda inline
  - sanciones filtrables por ámbito y texto
  - apelaciones resueltas siguen visibles con su nota, sin abrir otra pantalla histórica
- `TASK-0351` añadió foco de moderación por usuario en `Comunidad`:
  - selección desde `Usuarios y estado`
  - filtrado compartido sobre infracciones, sanciones y apelaciones
  - contexto visible y reversible dentro del mismo panel administrativo
- `TASK-0352` cerró esta pasada del panel administrativo de `Comunidad`:
  - resumen consolidado de alertas, infracciones, apelaciones y sanciones visibles
  - acción única para limpiar foco y filtros compactos
  - sin abrir dashboards ni rutas nuevas fuera del mismo panel
- `TASK-0353` endureció el diagnóstico de carga parcial en `Comunidad`:
  - chips por capa fallida
  - detalle inline de la capa seleccionada
  - el feed sigue operativo aunque fallen superficies secundarias
- `TASK-0354` cerró la coherencia del foco de moderación en `Comunidad`:
  - las alertas automáticas ya respetan el usuario enfocado cuando existe `target_user`
  - infracciones, sanciones, apelaciones y alertas quedan alineadas bajo el mismo filtro
- `TASK-0355` cerró el cruce contextual restante de moderación en `Comunidad`:
  - el detalle de infracción ya puede saltar directamente a la sanción vinculada
  - el drill-down queda completo entre alertas, infracciones y sanciones dentro del mismo panel
- `TASK-0356` conectó el foco de usuario con la acción administrativa principal:
  - enfocar usuario ahora precarga el destinatario de sanción
  - la tarjeta del usuario muestra si ya arrastra sanciones activas
- `TASK-0357` conectó la revisión de infracciones con la acción manual posterior:
  - el detalle de infracción ya permite preparar una sanción sobre ese usuario
  - se reutiliza el mismo formulario administrativo, sin abrir otra superficie
- `TASK-0358` afinó ese traspaso operativo:
  - la preparación de sanción desde infracción ya carga usuario, tipo sugerido y motivo borrador contextual
  - el moderador conserva edición manual completa antes de emitir la sanción
- `TASK-0359` convirtió el foco de usuario en una ficha operativa real:
  - conteos de alertas, infracciones, apelaciones y sanciones del usuario enfocado
  - chips con sanciones activas visibles en la misma tarjeta
