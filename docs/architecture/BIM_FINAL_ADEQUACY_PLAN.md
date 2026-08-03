# Plan de Adecuacion Final BIM - GiProy Network

Fecha de corte: 2026-07-10
TASK de gobierno: `BIM-TASK-0070`
Estado: baseline documental aprobado; no implica implementacion, activacion,
deploy ni cambios en GiProy Clasico.

## 1. Objetivo

Convertir la fundacion BIM ya existente en GiProy en un producto operativo de
coordinacion y control BIM para proyectos reales. El objetivo no es crear una
herramienta de autoria geometrica, sino cerrar un flujo trazable de extremo a
extremo:

`Proyecto -> modelo/version -> procesamiento -> revision 3D -> datos y calidad
-> incidencias -> vinculos EDT/APU/Presupuesto -> vista persistida -> auditoria`

La adecuacion conserva:

- backend unico y comun;
- dominio BIM aislado por `empresa_id`, proyecto y usuario;
- frontend BIM desacoplado dentro de GiProy;
- activacion por flags y allowlists;
- GiProy Clasico visual y funcionalmente intacto con BIM apagado;
- rollback limpio por slice.

## 2. Lectura precisa de certificacion

No se debe usar la palabra `certificado` como sinonimo de producto completo.

- buildingSMART dispone de certificacion de software para importacion y
  exportacion IFC sobre versiones oficiales IFC 2x3, IFC 4 e IFC 4.3.
- buildingSMART indica que, a la fecha de este plan, no existe todavia un
  programa equivalente de certificacion de software para BCF o IDS.
- GiProy no debe anunciar certificacion buildingSMART hasta completar el
  proceso formal y aparecer en el ledger correspondiente.
- Antes de esa certificacion, el objetivo verificable sera `conformidad
  demostrada`: casos de prueba, reportes reproducibles, versiones de parser y
  evidencias contra el IFC Validation Service o su implementacion oficial.

## 3. Benchmark de producto

### 3.1 Fuentes oficiales analizadas

| Referencia | Capacidades observadas | Implicacion para GiProy |
|---|---|---|
| buildingSMART Software Certification | Certificacion separada para import/export IFC; scorecards y ledger | Crear perfil de conformidad IFC y no hacer claims prematuros |
| buildingSMART IFC Validation Service | Validacion STEP, schema IFC, reglas normativas y practicas de industria | Separar validez del archivo, calidad semantica y capacidad de render |
| buildingSMART BCF | Issues con viewpoint, snapshot, coordenadas y referencias por IFC GUID; XML y REST | Adoptar contrato BCF-compatible para incidencias, aunque la UI sea GiProy |
| buildingSMART IDS | Requisitos de informacion interpretables por maquina para entidades, clasificaciones, materiales y propiedades | Incorporar perfiles de calidad y resultados por elemento/version |
| Autodesk Model Coordination / Docs | Modelos agregados, vistas, issues, clashes, carga bajo demanda y comparacion de versiones con agregados/modificados/eliminados | Priorizar versionado visual, contexto reproducible e informacion bajo demanda |
| Trimble Connect | Seleccion, ocultar/aislar, medicion, clipping, markups, vistas, proyeccion ortogonal, modelos, objetos, clashes y secuencias | Completar una toolbar profesional y vistas que guarden todo el contexto |
| Dalux | Filtros por propiedades, colorizacion, bookmarks compartibles, cantidades, checks y clearances por disciplina | Conectar propiedades a filtros, tablas, cantidades y validaciones guardables |
| Solibri | Clasificaciones reutilizables para checking, visualizacion e information takeoff | Tratar clasificacion como dato operativo, no solo como etiqueta de inspector |
| Bentley iTwin | Contexto unificado de modelos, documentos y datos de realidad; comparacion y clipping en viewer extensible | Preparar federacion y fuentes derivadas sin duplicar fuentes de verdad |
| ISO 19650-1 | Registro, versionado, organizacion y disponibilidad de informacion durante el ciclo de vida | Gobernar estados, revisiones, aprobacion y trazabilidad de contenedores BIM |

### 3.2 Fuentes

- https://www.buildingsmart.org/compliance/software-certification/
- https://validate.buildingsmart.org/
- https://info.buildingsmart.org/standards/bsi-standards/bim-collaboration-format/
- https://www.buildingsmart.org/standards/bsi-standards/information-delivery-specification-ids/
- https://help.autodesk.com/cloudhelp/ENU/BIM360D-Document-Management/files/About-Comparing-2D-and-3D/GUID-1872D1A7-1973-4715-BD99-13D766C18DFB.html
- https://help.autodesk.com/view/COORD/ENU/?contextId=MODEL_COORD_VIEWS
- https://help.trimble.com/doc/trimble-connect/trimble-connect/connect-for-windows/working-in-3d/3d-viewer-reference-guide
- https://help.trimble.com/doc/trimble-connect/trimble-connect/connect-for-browser/views
- https://support.dalux.com/hc/en-us/articles/15419725830556-Filters-and-visualization-in-Locations
- https://support.dalux.com/hc/en-us/articles/7974550855196-Quantities
- https://support.dalux.com/hc/en-us/articles/13790781626140-How-to-set-up-Model-validation
- https://help.solibri.com/hc/en-us/articles/1500004070762-Understanding-Classifications
- https://developer.bentley.com/apis/visualization/samples/
- https://www.iso.org/standard/68078.html

## 4. Estado GiProy frente al benchmark

| Frente | Estado actual comprobado | Brecha para producto final | Prioridad |
|---|---|---|---|
| Ingesta IFC | Archivo, checksum, parser semantico y artifacts locales | Jobs asincronos, progreso, reintentos, errores accionables y datasets reales | P0 |
| Conformidad IFC | Parsing y simulaciones S1/S2/S3 | Matriz IFC 2x3/4/4.3, reporte de conformidad y corpus versionado | P0 |
| Fragments | Import, carga, GUID, ItemData, categorias y raycast en harness | Integracion en viewer final con ciclo de vida y liberacion de memoria | P0 |
| Viewer | Three.js y canvas fragments aislados con controles reales | Un solo viewport de producto, toolbar, paneles, clipping y medicion final | P0 |
| Modelos/versiones | Contratos y persistencia base | Selector de version, publicacion, version activa y comparacion de cambios | P0 |
| Estructura/datos | Storeys, clases, psets, quantities, materiales y sistemas | Arbol navegable, busqueda global, tabla de objetos y filtros compuestos | P0 |
| Vistas | View states y workspace context | Guardar camara, proyeccion, clipping, filtros, colores, seleccion y mediciones | P1 |
| Calidad | Smokes y parsing focal | IDS, reglas por disciplina, runs, resultados y excepciones auditadas | P1 |
| Incidencias | No existe flujo BCF completo | Issues con viewpoint, GUIDs, snapshot, estado, responsable, comentarios e historial | P1 |
| Federacion | Dataset representativo unico | Modelos por disciplina, transformaciones, georreferencia y carga selectiva | P1 |
| 5D GiProy | Links latentes con EDT/APU/Presupuesto | UX de vinculacion, cantidades trazables, vigencia por version y navegacion bidireccional | P1 |
| Seguridad | Flags, tenant, allowlists y permisos iniciales | Matriz lectura/edicion/publicacion, auditoria y pruebas multiempresa completas | P0 |
| Rendimiento | Canvas no vacio y smokes visuales | Presupuestos medibles de carga, FPS, memoria, cancelacion y datasets grandes | P0 |
| Rollout | BIM apagado y rollback estructural | Checklist de liberacion, telemetria, soporte y activacion gradual | P2 |

## 5. Arquitectura backend objetivo

### 5.1 Pipeline de ingesta

La importacion debe ser un job explicito y observable:

1. registrar archivo fuente inmutable;
2. validar extension, tamano, checksum y schema declarado;
3. ejecutar conformidad IFC;
4. parsear estructura y propiedades;
5. producir artifacts versionados;
6. importar fragments;
7. construir indices de busqueda, categorias, GUID y cantidades;
8. ejecutar validaciones configuradas;
9. publicar la version solo si supera el gate definido;
10. mantener la version anterior activa si cualquier etapa falla.

Estados minimos del job:

`queued`, `validating`, `parsing`, `building_artifacts`, `indexing`,
`checking`, `ready`, `failed`, `cancelled`.

Cada etapa debe registrar porcentaje, timestamps, parser/version de libreria,
errores normalizados y referencia al artefacto producido.

### 5.2 Datos nuevos o contratos a completar

Los nombres finales deben respetar los modelos existentes y definirse en TASK
focal antes de crear migraciones. La capacidad minima requerida es:

- `import jobs`: etapa, progreso, intento, error, duracion y usuario iniciador;
- `source files`: nombre original, bytes, checksum, IFC schema, MVD, unidades,
  aplicacion autora y metadatos de georreferencia;
- `artifacts`: tipo/formato, version de contrato, checksum, bytes, storage key y
  compatibilidad con viewer/parser;
- `model versions`: inmutabilidad, padre, estado, fecha de publicacion, version
  activa y motivo de rechazo/rollback;
- `federations`: modelos miembros, disciplina, orden, transformacion y version
  fijada;
- `change sets`: elementos agregados, eliminados y modificados entre versiones;
- `validation profiles/runs/results`: IDS o reglas internas, severidad,
  elemento/GUID, estado y excepcion aprobada;
- `issues`: BCF topic, viewpoint, snapshot, GUIDs, estado, prioridad,
  responsable, vencimiento, comentarios e historial;
- `audit events`: actor, empresa, proyecto, accion, entidad, antes/despues y
  correlation id.

### 5.3 API y servicios

- Mantener clientes BIM en `frontend/src/api` y endpoints bajo namespace BIM.
- Separar comandos de importacion/publicacion de queries de viewer.
- Hacer idempotentes importacion, regeneracion de artifact y reintentos.
- Paginar y filtrar tablas de objetos, issues y resultados de validacion.
- Entregar artifacts grandes por streaming/range o mecanismo equivalente.
- Evitar payloads completos de propiedades al abrir el viewer; cargar detalle
  bajo demanda por GUID/localId.
- Aplicar tenant/proyecto/version en toda query, cache key y ruta de storage.
- No usar servicios clasicos como dependientes de BIM.

## 6. Arquitectura frontend y UX objetivo

### 6.1 Escena de uso

Un coordinador BIM, presupuestista o jefe de proyecto trabaja durante horas en
un portatil de obra u oficina, con informacion densa y necesidad de confirmar
rapidamente que esta viendo la empresa, proyecto, modelo y version correctos.

La estrategia visual sera restringida: GiProy claro como shell, viewport 3D
como superficie principal neutra, naranja solo para accion/seleccion y azul
blueprint para informacion tecnica. No se creara una identidad visual paralela.

### 6.2 Arquitectura de informacion del workspace

- Barra contextual superior: empresa, proyecto, federacion/modelo, version,
  estado de procesamiento y ultima publicacion.
- Rail de herramientas sobre el viewport: seleccionar, encuadrar, ocultar,
  aislar, restaurar, medir, clipping, proyeccion, vista y captura.
- Panel izquierdo con tabs: `Modelos`, `Estructura`, `Filtros`, `Validacion`.
- Viewport central sin tarjetas decorativas ni informacion superpuesta que tape
  geometria.
- Inspector derecho contextual con tabs: `Propiedades`, `Cantidades`,
  `Vinculos`, `Incidencias`.
- Banda de estado inferior: seleccion, GUID, unidades, elementos visibles,
  progreso y alertas de rendimiento.

En desktop se usara la composicion de tres zonas. En tablet los paneles se
convertiran en drawers mutuamente excluyentes. En movil se priorizara revision,
seleccion, propiedades e incidencias; las operaciones pesadas mostraran limites
claros en vez de simular paridad falsa.

### 6.3 Flujos obligatorios

1. Importar IFC con preflight, progreso por etapas, cancelacion y error
   accionable.
2. Abrir modelo/version activa y confirmar visualmente su contexto.
3. Navegar estructura espacial y buscar por nombre, GUID, clase o propiedad.
4. Seleccionar desde canvas, arbol o tabla y mantener sincronizacion entre las
   tres superficies.
5. Filtrar/colorizar por propiedad, clase, nivel, sistema o disciplina.
6. Medir, aplicar clipping, guardar vista y recuperarla de forma reproducible.
7. Comparar versiones y revisar agregados, eliminados y modificados.
8. Crear incidencia desde seleccion con snapshot, viewpoint y GUIDs.
9. Vincular elemento/grupo con EDT, APU o linea de Presupuesto bajo permiso.
10. Saltar desde BIM al dato de negocio y volver al mismo viewpoint bajo una
    TASK de integracion controlada.

### 6.4 Estados UX obligatorios

- primera entrada sin modelo;
- archivo seleccionado pendiente de preflight;
- importacion por etapa;
- procesamiento en segundo plano;
- modelo listo, rechazado, obsoleto o con nueva version;
- viewer cargando con skeleton de paneles y progreso del modelo;
- WebGL no disponible, memoria insuficiente o contexto perdido;
- seleccion vacia, unica y multiple;
- filtro sin resultados;
- propiedades parciales o no disponibles;
- vista privada, compartida o sin permiso;
- cambios locales sin guardar;
- modo offline/degradado solo cuando exista soporte real.

### 6.5 Criterios UI

- Controles de herramienta mediante iconos Lucide, labels accesibles y tooltip.
- Atajos visibles en tooltip/command palette, no como texto permanente.
- Acciones destructivas o de publicacion con confirmacion contextual GiProy.
- Focus visible, navegacion por teclado y contraste WCAG AA.
- Objetivos tactiles minimos de 40 px en tablet/movil.
- Transiciones de estado entre 150 y 250 ms y soporte reduced motion.
- Ningun panel debe desplazar o redimensionar inesperadamente el canvas.
- Ningun tooltip/dropdown debe quedar recortado por overflow del viewport.
- Densidad configurable `compacta/comoda` solo si se aplica a toda la
  superficie, no por componentes aislados.

## 7. Plan de ejecucion vertical

Los IDs siguientes son backlog propuesto. Solo se incorporaran al indice como
TASK abiertas cuando se inicie cada slice.

### Fase A - Datos reales y pipeline confiable

#### BIM-TASK-0071 - Registro de datasets IFC reales

Estado: cerrada localmente el 2026-07-10 con corpus buildingSMART CC BY 4.0,
manifiesto verificable, parser IFC4/IFC2x3 y conversion Fragments reproducible.

- Catalogar modelos pequeno, medio y grande con licencia/procedencia, schema,
  disciplina, bytes, elementos y resultado esperado.
- Criterio: al menos un IFC arquitectonico, uno estructural y uno MEP o
  federable; ningun dataset sin permiso de uso.
- Verificacion: checksum, manifiesto, parser y render reproducibles.

#### BIM-TASK-0072 - Job de importacion observable

Estado: cerrada localmente el 2026-07-10 con persistencia Alembic, API `202`,
idempotencia, progreso, cancelacion, retry y panel operativo en `BimWorkspace`.

- Implementar estado/progreso/error/cancelacion sin bloquear request HTTP.
- Criterio: reintento idempotente y version anterior activa ante fallo.
- Verificacion: pytest de transiciones y smoke UI de progreso/error.

#### BIM-TASK-0073 - Conformidad IFC y reporte de calidad base

Estado: cerrada localmente el 2026-07-10 con contrato de calidad v1,
persistencia por version, integracion en jobs, API y panel BIM.

- Separar validez STEP/schema/normativa de warnings semanticos GiProy.
- Criterio: reporte persistido por version con errores vinculables.
- Verificacion: corpus valido, invalido y parcialmente compatible.

#### BIM-TASK-0074 - Lifecycle de artifacts

Estado: cerrada localmente el 2026-07-10 con registro generacional,
contratos/checksums, escritura atomica, validacion y rollback.

- Versionar fragments, viewer JSON e indices con checksum y contrato.
- Criterio: regeneracion segura, deteccion de artifact incompatible y rollback.
- Verificacion: tests de idempotencia, corrupcion y version de contrato.

### Gate A

Estado: cerrado localmente el 2026-07-10 con prueba real S/M/L por jobs
observables (13/144/926 elementos) y trazabilidad completa.

- Tres escalas de dataset procesadas sin tocar tablas clasicas.
- Fallos no publican versiones incompletas.
- Toda salida es trazable a archivo, checksum, parser y job.

### Fase B - Viewer Fragments de producto

#### BIM-TASK-0075 - Viewport Fragments final

Estado: cerrada localmente el 2026-07-10 con artifact Fragments registrado,
canvas de producto, resize, seleccion, recovery y disposal validados.

- Integrar el canvas nativo en `BimWorkspace`, fuera del harness.
- Criterio: carga, resize, disposal, seleccion y recuperacion de WebGL.
- Verificacion: canvas no vacio desktop/tablet/movil y memoria liberada al salir.

#### BIM-TASK-0076 - Shell UX profesional

Estado: cerrada localmente el 2026-07-10 con contexto permanente, toolbar
operativa, explorer/inspector adaptables y auditoria Playwright/teclado.

- Implementar barra contextual, toolbar, explorer e inspector.
- Criterio: contexto de empresa/proyecto/modelo/version siempre visible.
- Verificacion: screenshots Playwright sin overlap/overflow y auditoria teclado.

#### BIM-TASK-0077 - Arbol, tabla y busqueda sincronizados

Estado: cerrada localmente el 2026-07-10 con busqueda tenant-scoped, paginacion
real, arbol/tabla y resolucion GUID desde raycast.

- Navegar estructura, clase, nivel, sistema, GUID, nombre y propiedades.
- Criterio: seleccionar en cualquier superficie enfoca y actualiza las otras.
- Verificacion: casos 0, 1, multiples y miles de resultados paginados/virtuales.

#### BIM-TASK-0078 - Herramientas de revision

Estado: cerrada localmente el 2026-07-10 con seis herramientas Fragments
reales, unidades persistentes y reset reversible desktop/movil.

- Ocultar, aislar, ghost, clipping, medicion, proyeccion y reset.
- Criterio: todas actuan sobre datos reales y tienen estado reversible.
- Verificacion: smoke DOM/WebGL por herramienta y persistencia de unidades.

#### BIM-TASK-0079 - Vistas reproducibles

Estado: cerrada localmente el 2026-07-10 con contrato v2, roundtrip completo,
replay WebGL y declaracion de incompatibilidad por version.

- Persistir camara, seleccion, visibilidad, colores, filtros, clipping y medidas.
- Criterio: reabrir reproduce el contexto o declara incompatibilidad de version.
- Verificacion: roundtrip backend/frontend y permisos privado/compartido.

### Gate B

Estado: cerrado localmente el 2026-07-10. Flujo reproducible, viewer Fragments,
explorer paginado, herramientas y corpus real S/M/L validados con BIM aislado.

- Flujo real `abrir -> revisar -> guardar vista -> cerrar -> reabrir` aprobado.
- Viewer estable con dataset medio y degradacion controlada con dataset grande.
- GiProy Clasico sigue identico con BIM apagado.

### Fase C - Versiones, federacion y calidad

#### BIM-TASK-0080 - Comparacion de versiones

Estado: cerrada localmente el 2026-07-10 con change set reproducible, filtros
y fallback semantico explicito para GUID cambiado.

- Calcular y visualizar agregados, eliminados, geometria/transform modificada y
  propiedades modificadas.
- Criterio: change set reproducible por GUID y fallback documentado si cambia.
- Verificacion: dataset A/B conocido y filtros por tipo de cambio.

#### BIM-TASK-0081 - Federacion por disciplina

Estado: cerrada localmente el 2026-07-11 con revisiones inmutables,
transform/georreferencia por version y viewport Fragments multiversion.

- Cargar varias versiones fijadas con transformacion y georreferencia.
- Criterio: activar/desactivar modelo, disciplina y version sin perder contexto.
- Verificacion: arquitectura + estructura + MEP alineados y caso desalineado.

#### BIM-TASK-0082 - IDS y reglas de informacion

Estado: cerrada localmente el 2026-07-11 con perfil IDS persistido, resultados
por requisito/GUID, excepciones auditadas y CSV exportable.

- Importar perfil IDS y ejecutar validacion por version.
- Criterio: resultados por requisito y GUID, severidad y excepcion auditada.
- Verificacion: fixtures IDS oficiales/compatibles y reporte exportable.

### Gate C

Estado: cerrado localmente el 2026-07-11. Comparacion reproducible, federacion
Fragments multiversion e IDS visible/independiente de conformidad IFC pasan.

- Versiones comparables, federacion estable y calidad de datos visible.
- No se confunde `archivo valido` con `modelo que cumple requisitos`.

### Fase D - Coordinacion e integracion GiProy

#### BIM-TASK-0083 - Dominio de incidencias BCF-compatible

Estado: cerrada localmente el 2026-07-11 con topic/viewpoint/historial e
importacion/exportacion BCF-XML 2.1.

- Topic, viewpoint, snapshot, GUIDs, responsable, prioridad, estado e historial.
- Criterio: incidencia reabre el contexto exacto o explica elementos faltantes.
- Verificacion: roundtrip BCF XML/API segun alcance autorizado.

#### BIM-TASK-0084 - UX de incidencias

Estado: cerrada localmente el 2026-07-11 con flujo operativo completo desde el
contexto real del viewer.

- Crear desde seleccion, asignar, comentar, responder y cerrar.
- Criterio: permisos y actividad visibles; no hay paneles falsos.
- Verificacion: flujo creador/responsable/revisor con dataset real.

#### BIM-TASK-0085 - Cantidades y vinculos 5D

Estado: cerrada localmente el 2026-07-11 con preview de fuente/unidades,
propuesta aprobable/rechazable y cero escritura automatica clasica.

- Presentar quantity fuente, unidad, version, GUID y regla de normalizacion antes
  de proponer vinculo con EDT/APU/Presupuesto.
- Criterio: ningun dato BIM sobrescribe una fuente clasica automaticamente.
- Verificacion: preview, aprobacion, rechazo y cambio de version.

#### BIM-TASK-0086 - Navegacion bidireccional controlada

Estado: bloqueada por la prohibicion vigente de modificar GiProy Clasico. La
activacion requiere TASK clasica de integracion separada y autorizada.

- Abrir TASK clasica de integracion separada por modulo.
- Criterio: flag apagado deja la pantalla clasica pixel/funcionalmente igual.
- Verificacion: smoke flag off/on, permisos y retorno al viewpoint.

### Gate D

- Incidencias operativas y cantidades trazables.
- Links utiles en ambos sentidos sin duplicar fuentes de verdad.
- Cada toque clasico tiene TASK y rollback independiente.

### Fase E - Enterprise y liberacion

#### BIM-TASK-0087 - Seguridad y auditoria completas

Estado: cerrada localmente el 2026-07-11 con capacidades BIM componibles por
tenant, pruebas negativas y auditoria de grants/rollout.

- Matriz ver/importar/publicar/vincular/compartir/administrar.
- Criterio: aislamiento multiempresa probado en API, artifacts, cache y vistas.
- Verificacion: pruebas negativas y auditoria de acciones sensibles.

#### BIM-TASK-0088 - Rendimiento y estabilidad

Estado: cerrada localmente el 2026-07-11 para la matriz reproducible disponible:
Chrome/Edge, desktop/tablet, 60 FPS, first render menor a 0.9 s, heap estable y
disposal por tres ciclos. El resultado no sustituye certificacion de hardware
externo ni del futuro piloto.

- Definir presupuesto por escala: carga, first render, interaccion, FPS y memoria.
- Criterio: cancelacion, disposal y recuperacion de errores sin recargar GiProy.
- Verificacion: matriz Chrome/Edge, desktop/tablet y datasets S/M/L.

#### BIM-TASK-0089 - Observabilidad operativa

Estado: cerrada localmente el 2026-07-11 con correlation id de jobs, metricas
agregadas tenant-aware y sanitizacion de datos sensibles.

- Metricas de jobs, fallos por etapa, tiempos, artifacts y errores WebGL.
- Criterio: diagnostico sin exponer IFC, propiedades sensibles o tokens.
- Verificacion: correlation id desde importacion hasta viewer.

#### BIM-TASK-0090 - Rollout controlado

Estado: preparación técnica revalidada al 100% el 2026-07-13. El piloto real y
Gate E permanecen abiertos hasta contar con evidencia temporal y usuarios reales.

- Checklist, allowlist piloto, soporte, rollback y criterio de salida.
- Criterio: activacion por empresa/usuario sin deploy BIM separado.
- Verificacion: Gate E completo y rollback ensayado.

### Gate E

- Smokes, funcionales, permisos, rendimiento y estabilidad aprobados.
- PostgreSQL autorizada con migraciones upgrade/rollback verificadas.
- Piloto controlado aprobado antes de cualquier ampliacion de allowlist.

## 8. Criterio de producto completamente funcional

GiProy BIM podra declararse funcional para liberacion controlada solo cuando:

- un usuario habilitado importe un IFC real y siga su procesamiento;
- el sistema conserve fuente, checksum, version y artifacts inmutables;
- el viewer Fragments final abra modelos medianos/grandes con estabilidad;
- estructura, propiedades, cantidades, filtros, clipping y medicion sean
  operativos;
- vistas y contexto puedan guardarse y recuperarse;
- versiones puedan compararse;
- exista validacion de calidad separada de la validacion sintactica IFC;
- incidencias con viewpoint y GUID sean trazables;
- links 5D sean aprobables y no sobrescriban datos clasicos automaticamente;
- permisos, tenant, auditoria y rollback esten probados;
- BIM apagado conserve GiProy Clasico sin cambios visibles o funcionales.

## 9. Fuera del cierre inicial

Estas capacidades pueden formar una fase posterior y no deben bloquear la
primera liberacion profesional:

- autoria o edicion de geometria IFC;
- clash detection avanzado equivalente a motores especializados;
- CDE documental completo;
- BCF colaborativo con todas las extensiones de mercado;
- point clouds/reality capture como flujo productivo;
- gemelo digital IoT en tiempo real;
- operacion offline completa del viewer 3D.

No obstante, el modelo de datos y los contratos no deben impedir su adicion
futura.

## 10. Riesgos y mitigaciones

| Riesgo | Mitigacion |
|---|---|
| Seguir ampliando el harness sin producto final | Gate B exige integracion real en `BimWorkspace` |
| Claim de certificacion incorrecto | Separar conformidad demostrada de certificacion formal |
| IFC real rompe parser o GUIDs | Corpus S/M/L, errores normalizados y fallback por version |
| Modelo grande bloquea navegador | Jobs derivados, carga bajo demanda, indices y presupuestos de memoria |
| Federacion desalineada | Unidades, georreferencia y transforms explicitos por miembro |
| Links 5D duplican fuentes clasicas | Contrato referencial, preview y aprobacion sin escritura automatica |
| Fuga multiempresa en artifacts/cache | Tenant en DB, storage key, cache key, endpoints y pruebas negativas |
| UX sobrecargada | Viewport dominante, paneles contextuales y disclosure progresivo |
| Documentacion contradice codigo | Auditoria de TASKs madre antes de cada gate |

## 11. Orden inmediato recomendado

1. `BIM-TASK-0071`: datasets IFC reales autorizados.
2. `BIM-TASK-0072`: job de importacion observable.
3. `BIM-TASK-0075`: viewport Fragments final en `BimWorkspace`.
4. `BIM-TASK-0076`: shell UX profesional.
5. Cerrar Gate A y Gate B antes de abrir integracion visible con GiProy
   Clasico.

Este orden convierte primero la evidencia tecnica existente en producto real y
mantiene EDT, APUs y Presupuesto fuera de riesgo hasta que el viewer supere sus
gates de madurez.

## 12. Decisiones de producto y arquitectura confirmadas

Las siguientes decisiones fueron revisadas y confirmadas para gobernar el
backlog `BIM-TASK-0071` a `BIM-TASK-0090`. Son criterios objetivo y no deben
interpretarse como capacidades ya implementadas.

1. **Alcance BIM 1.0:** revision, coordinacion y conexion 5D controlada. Quedan
   fuera autoria geometrica, CDE completo, clash avanzado, reality capture e
   IoT.
2. **Usuario principal:** coordinador BIM. Project manager, presupuestista y
   tecnico de obra son usuarios secundarios.
3. **Corpus real:** datasets publicos licenciados y reproducibles para pruebas,
   mas modelos privados reales fuera de Git. Todos usan manifiesto comun con
   procedencia, licencia, checksum, schema, disciplina, escala y resultado
   esperado.
4. **Jobs:** estado persistente en PostgreSQL, servicio BIM idempotente y worker
   local controlado dentro del backend comun. La interfaz de cola queda
   preparada, sin introducir Redis, Celery, Docker ni otro runtime en esta fase.
5. **Versiones:** una importacion nunca queda activa automaticamente. El flujo
   es cargada, procesada, validada, lista para revision y publicada de forma
   explicita. Las versiones son inmutables y admiten rollback sin reprocesar.
6. **Compatibilidad IFC:** IFC2x3 Coordination View 2.0 es compatibilidad
   obligatoria; IFC4 Reference View es objetivo primario de conformidad; IFC4.3
   permanece experimental y controlado. Schema y MVD se detectan y declaran.
7. **Motor de produccion:** Fragments sera el unico motor geometrico del viewer
   final. Three.js permanece como base tecnica y el viewer simplificado actual
   como harness diagnostico temporal hasta alcanzar paridad y rollback.
8. **Ubicacion UX:** BIM vive dentro del proyecto activo, en un workspace amplio
   bajo la shell GiProy. No se crea inicialmente un modulo global independiente
   y el bundle 3D se carga solo al entrar en BIM.
9. **Mobile:** modo profesional de revision, sin paridad total. Permite abrir,
   navegar, seleccionar, consultar, comentar y operar herramientas basicas; la
   importacion, federacion, IDS, publicacion y vinculacion masiva quedan en
   desktop/tablet.
10. **Gates de validacion:** integridad, schema ilegible, artifacts corruptos,
    geometria no procesable e IDS critico bloquean. Errores no criticos exigen
    excepcion justificada y auditada; warnings permanecen visibles.
11. **Orden 5D:** EDT primero, Presupuesto despues y APUs al final, cada modulo
    con TASK clasica de integracion y flag propios. BIM 1.0 no actualiza
    cantidades ni costos clasicos automaticamente.
12. **BCF:** dominio interno alineado con BCF y BCF-XML 2.1 para importacion y
    exportacion inicial. El contrato se prepara para BCF 3.0; REST externo y
    sincronizacion en tiempo real quedan para una fase posterior.
13. **Cambio de GUID:** solo el mismo GlobalId crea continuidad automatica. Las
    heuristicas generan candidatos que un coordinador aprueba o rechaza; issues,
    links y excepciones IDS no migran automaticamente.
14. **Federacion:** se preservan coordenadas, unidades y georreferencia de cada
    fuente. Los ajustes son transformaciones no destructivas, justificadas,
    versionadas y auditadas; su herencia a una nueva version es solo propuesta.
15. **Permisos:** no se alteran roles globales, auth ni JWT. Las capacidades BIM
    componibles son `bim.view`, `bim.review`, `bim.coordinate`, `bim.publish` y
    `bim.admin`.
16. **Retencion:** fuentes IFC publicadas, manifiestos, checksums, reportes y
    auditoria son permanentes. Artifacts derivados son regenerables; fallos y
    borradores cancelados se purgan tras 30 dias mediante proceso explicito,
    auditado y tenant-aware. Lo publicado usa dependencias y soft delete.
17. **Presupuesto de rendimiento inicial:** pequeno hasta 50 MB o 100k elementos
    con primer render en 8 s; mediano hasta 250 MB o 500k en 20 s y 30 FPS;
    grande/federado hasta 1 GB o 2M con carga progresiva en 45 s y 20 FPS. Debe
    liberarse memoria tras cerrar o cambiar modelo y evitar acumulacion tras
    tres ciclos. Estos valores se recalibran con el corpus real.
18. **Lenguaje visual:** shell clara GiProy para controles y paneles; viewport
    tecnico neutro oscuro o medio configurable. Naranja identifica accion o
    seleccion, azul informacion tecnica y el resto usa semantica de estado.
19. **Conformidad:** el piloto requiere conformidad verificada, no certificacion
    formal buildingSMART. Se distinguen Experimental, Conformidad verificada y
    Certificado formal, sin claims comerciales prematuros.
20. **Clash:** BIM 1.0 no incorpora un motor geometrico propietario de clashes.
    Admite federacion, BCF, inspeccion, clipping, medicion, IDS y clashes
    importados por GUID/viewpoint. Clash propio queda para una fase posterior.
21. **Rollout:** interno, shadow/read-only, piloto por tenant y usuarios
    nominales, y despues integracion EDT, Presupuesto y APUs por flags. Cada
    escalon exige metricas, cero criticos y rollback ensayado.
22. **Vistas guardadas:** privadas por defecto y compartidas explicitamente.
    Publicar para proyecto requiere `bim.coordinate`; cada cambio crea revision
    y conserva camara, filtros, clipping, colores, modelos/versiones, seleccion
    y mediciones.
23. **Cantidades:** prioridad para `IfcElementQuantity`, despues propiedades del
    perfil de proyecto y finalmente estimacion geometrica GiProy. Se muestra
    valor, unidad, fuente, version y regla; el coordinador aprueba la fuente 5D.
24. **Workflow de issues:** Abierta, Asignada, En revision, Resuelta y Cerrada,
    con Descartada para invalida o duplicada. Transiciones, responsables,
    comentarios, reaperturas y clasificaciones quedan auditados.
25. **Observabilidad:** logs solo con IDs internos, tenant/proyecto/modelo/version,
    correlation ID, etapa, duracion, bytes, conteos, versiones tecnicas, error
    normalizado y metricas agregadas. Se excluyen contenido IFC, psets, nombres
    sensibles, comentarios, snapshots, tokens, paths y payloads economicos.
26. **Definicion de 100%:** GiProy BIM 1.0 solo puede declararse funcional tras
    un piloto real aprobado, no por implementacion tecnica aislada.
27. **Piloto minimo:** diez dias habiles, dos revisiones reales del modelo y
    evidencia de importacion, version, comparacion, issues, validacion,
    publicacion, reapertura y rollback, con coordinador BIM y usuario de negocio.
28. **Salidas BIM 1.0:** BCF-XML para issues, CSV/XLSX para cantidades,
    validaciones y cambios, y PDF reproducible para revision y aceptacion. Cada
    salida identifica proyecto, modelo, version, fecha, usuario, unidades y
    origen; no se incluye disenador avanzado ni geometria propietaria.
29. **Unidades:** se preservan valor, unidad y procedencia IFC originales. La
    presentacion puede convertir al sistema del proyecto mostrando unidad
    original, unidad presentada, factor y redondeo, sin sobrescritura silenciosa.

Estas decisiones prevalecen ante ambiguedades del backlog. Cualquier cambio
posterior requiere actualizar esta seccion, la TASK BIM correspondiente y sus
criterios de gate antes de implementar.

## 11. Reapertura controlada del diagnostico transversal - 2026-08-03

La `BIM-TASK-0193` abre un cuestionario de adecuacion con el usuario. Esta
reapertura agrega brechas al plan, pero no revoca cierres tecnicos, no modifica
el programa 61/61 y no cierra Gate E ni Gate K. Cada frente se confirmara antes
de convertirlo en slices de implementacion.

### 11.1 Frente 01 - OmniClass con BIM y Proyectos

**Diagnostico confirmado:** OmniClass tiene una implementacion funcional en el
dominio clasico, mientras BIM conserva solo `BimElement.classification` como
texto generico. No existe aun un contrato OmniClass BIM versionado ni una
relacion gobernada con proyecto/revision o con los links 5D.

**Fuente de verdad:** `omniclass_maestro` y los datos clasicos gobernados de
subcategorias, recursos, APUs y Presupuesto. El dominio BIM no debe copiar ese
catalogo; debe referenciarlo mediante un contrato estable y conservar la
procedencia de cualquier clasificacion importada desde IFC.

**Objetivo de adecuacion:** incorporar sistema, edicion, tabla, codigo, titulo,
fuente, estado de resolucion y vigencia por version de modelo; respetar
`empresa_id`, proyecto, revision y `Empresa.use_omniclass`; y habilitar UX de
inspeccion/filtro antes de considerar propuestas 5D.

**Orden preliminar:** contrato aditivo -> parser IFC -> resolucion contra
maestro -> gobierno empresa/proyecto -> UX BIM -> propuestas 5D revisables.

**Guardas:** no generar links automaticos, no duplicar fuentes clasicas, no
sobrescribir clasificaciones IFC silenciosamente y no tocar EDT/APU/Presupuesto
sin una TASK de integracion controlada separada.

Estado: brecha documentada y confirmada; slices pendientes de completar el
cuestionario y recibir aprobacion del plan integral.

### 11.2 Frente 02 - Tri-sincronizacion Presupuesto <-> Gantt <-> BIM

**Diagnostico confirmado:** GiProy no dispone hoy de una sincronizacion
triangular operativa. El carril clasico Presupuesto/APU <-> Gantt es el mas
maduro; BIM 4D tiene snapshots, baselines, links aprobables y reproduccion
temporal; BIM 5D tiene links y propuestas controladas con EDT/APU/Presupuesto.
Esas capacidades no comparten aun una identidad versionada ni un ciclo conjunto
de diff, conflicto, aprobacion y rollback.

**Fuentes de verdad propuestas:** Presupuesto/APU gobierna coste, cantidad
aprobada, composicion y rendimiento; Gantt gobierna fechas, dependencias,
calendario y baseline; la version BIM gobierna geometria, GUID, propiedades y
cantidades IFC de origen. Ningun dominio sobrescribe otro automaticamente.

**Objetivo de adecuacion:** crear un agregado de coordinacion por empresa,
proyecto y revision que fije presupuesto/revision, baseline Gantt y version BIM,
con enlaces estables entre linea/APU, actividad y elemento. Cada cambio cruzado
debe generar diff y propuesta aprobable, no una propagacion circular inmediata.

**Orden preliminar:** matriz de autoridad -> identidades estables -> agregado
versionado -> adaptadores y snapshots -> preflight/conflictos -> UX y rollback
-> certificacion end-to-end tenant-aware.

**Guardas:** BIM apagado mantiene intacto el circuito Presupuesto/Gantt;
`source_ref` textual no sera la identidad final; las revisiones independientes
no se colapsan; y cualquier escritura clasica requiere TASK de integracion
controlada y prueba de no mutacion accidental.

Estado: brecha documentada y confirmada; no implica implementacion ni modifica
los cierres 4D/5D existentes.

### 11.3 Frente 03 - Reestructuracion integral del workspace BIM

**Decision confirmada:** BIM debe dejar de presentarse como un catalogo de
funciones y convertirse en un espacio de trabajo integrado en GiProy. La
experiencia sera neutral y comun, pero su entrada, acciones disponibles,
prioridades y siguiente paso se adaptaran dinamicamente a las capacidades y al
contexto del usuario. Planificacion 4D y presupuesto 5D son el flujo principal.

**Diagnostico confirmado:** el workspace actual distribuye las capacidades en
siete espacios principales y numerosas pestanas, con funciones repetidas y sin
una secuencia operativa comun. En escritorio puede mantener simultaneamente
explorador izquierdo, visor, inspector derecho y panel temporal inferior. Sus
anchos y alturas iniciales consumen una parte excesiva del area util disponible
en un monitor fisico de 1920 x 1080 y los paneles internos no comparten un
contrato consistente de tamano, scroll ni composicion.

**Arquitectura objetivo:** consolidar la navegacion en cinco modos:
`Planificacion y costes`, `Modelo`, `Coordinacion`, `Seguimiento` y `Entrega`.
`Planificacion y costes` sera la entrada preferente cuando las capacidades del
usuario lo permitan. Informes se resolvera como salida contextual y la
administracion de modelos quedara separada del trabajo BIM cotidiano.

**Flujo rector 4D/5D:** seleccionar proyecto, revision presupuestaria, baseline
Gantt y version BIM; vincular linea/APU, actividad y elemento; validar cobertura
y conflictos; simular tiempo y coste; producir propuestas versionadas; revisar
y aprobar; y seguir plan frente a real. La UX debe exponer siempre la fuente de
verdad y el estado de sincronizacion, sin escrituras circulares silenciosas.

**Contrato espacial:** 1920 x 1080 es la resolucion fisica minima de referencia,
pero la composicion se decide mediante el contenedor util CSS. La cabecera BIM
ocupara como maximo 88 px; solo un panel lateral estara desarrollado por defecto;
el visor conservara al menos 65% del ancho util; y la superficie 4D/5D usara una
altura inicial de 220-260 px, sera colapsable y no superara 35% del contenedor.
En resoluciones superiores crecera el contenido util, no el tamano indiscriminado
de controles y paneles.

**Adaptacion por capacidades:** reutilizar `bim.view`, `bim.review`,
`bim.coordinate`, `bim.schedule.view`, `bim.schedule.link`,
`bim.progress.report`, `bim.publish` y `bim.admin`, combinadas con permisos de
Presupuesto y Gantt. No se crearan aplicaciones distintas por nombre de rol. Se
debera definir ademas un contrato explicito de capacidades 5D para lectura,
vinculacion, propuesta y aprobacion de costes BIM.

**Orden preliminar:** contrato UX y medicion -> shell BIM y sistema de paneles ->
workbench vertical Presupuesto/Gantt/BIM -> modelo y coordinacion -> seguimiento
integrado -> entrega y administracion -> accesibilidad, rendimiento y QA visual.

**Guardas:** no reducir el rediseño a cambios cosmeticos; no esconder acciones
sin explicar la capacidad requerida; no depender solo de `window.innerWidth`;
no abrir dos laterales por defecto; no usar tooltips como unica explicacion; no
modificar contratos 4D/5D ni fuentes de verdad desde la capa visual.

Estado: direccion UX/UI documentada y confirmada; pendiente descomponerla en
slices verticales con criterios de aceptacion, pruebas visuales y rollback.

### 11.4 Regla de coordinacion transversal entre frentes

El plan es multifrente, pero constituye un unico programa de adecuacion. Los
frentes 01, 02 y 03 no pueden convertirse en backlogs independientes ni cerrar
por separado cuando compartan contratos, estados, permisos o superficies.

La coordinacion obligatoria queda definida asi:

1. **OmniClass alimenta el flujo 5D:** la clasificacion resuelta puede asistir
   busqueda, filtros, cantidades y propuestas de enlace, pero nunca crear links
   Presupuesto/Gantt/BIM de forma implicita.
2. **La tri-sincronizacion gobierna el estado:** revision presupuestaria,
   baseline Gantt, version BIM, identidades, autoridad, diff, conflicto,
   aprobacion y rollback proceden del contrato tridominio, no de estados locales
   inventados por el frontend.
3. **El workspace materializa el contrato:** la UX muestra y opera los estados
   de OmniClass y sincronizacion, pero no redefine fuentes de verdad ni elude
   permisos backend.
4. **Capacidades compartidas:** cualquier ampliacion 5D debe definir backend,
   API y frontend conjuntamente; el nombre del rol no sustituye las capacidades.
5. **Slices verticales coordinados:** cada slice debe declarar impacto sobre los
   tres frentes, dependencias, migracion, compatibilidad, pruebas y rollback,
   incluso cuando alguno quede expresamente como `sin impacto`.
6. **Gate conjunto:** ningun frente se considera funcionalmente adecuado hasta
   superar un recorrido end-to-end Presupuesto -> Gantt -> BIM -> propuesta ->
   aprobacion -> seguimiento, incluyendo clasificacion cuando este habilitada.

Orden de dependencia inicial:

`autoridad e identidades -> capacidades y contratos API -> agregado 4D/5D ->
clasificacion/resolucion OmniClass -> shell y workbench -> flujos secundarios ->
QA end-to-end y piloto`.

Se permite construir infraestructura en paralelo cuando no comparta contratos,
pero su integracion solo puede realizarse contra las mismas identidades, estados
y criterios de aceptacion aprobados por el programa.

### 11.5 Cierre del cuestionario y plan ejecutivo coordinado

La entrevista de adecuacion queda cerrada con sesenta decisiones confirmadas.
El contrato ejecutable, dependency graph, slices, matrices y gates se consolidan
en `BIM_COORDINATED_ADEQUACY_EXECUTION_PLAN.md`, que pasa a ser complemento
obligatorio de este plan rector. Ninguna TASK de los frentes 01-03 puede abrirse
o cerrarse sin declarar su impacto transversal conforme a dicho documento.

Estado: cuestionario cerrado; plan ejecutivo aprobado documentalmente. No se
autoriza aun implementacion ni modificacion de datos reales. El siguiente paso
es crear y aprobar las TASKs de contratos y gobierno S01-S04.

### 11.6 Gobierno obligatorio de porcentajes de cierre

Cada cierre del programa debe informar porcentaje parcial del slice, porcentaje
de fase y porcentaje total ponderado S01-S20. Los pesos, formula y plantilla
canonica viven en `BIM_COORDINATED_ADEQUACY_EXECUTION_PLAN.md`. Un cierre sin
ambos porcentajes, evidencia y estado de gates se considera documentalmente
incompleto.

Linea base actual:

- diagnostico/planificacion `BIM-TASK-0193`: 100% documental;
- implementacion del nuevo plan coordinado: 0%;
- total del programa de adecuacion coordinada S01-S20: 0%;
- programa BIM tecnico historico 61/61: sin cambios y separado de esta medicion.
