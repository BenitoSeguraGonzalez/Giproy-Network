# Estado Real del Codigo BIM

Fecha: 2026-07-13

Modo: GIPROY BIM

## Proposito

Este documento alinea la documentacion BIM con el estado real observado en el
codigo. Debe leerse junto con `BIM_MASTER_PLAN.md`, `BIM_INDEX.md` y
`docs/tasks/bim/BIM_TASK_INDEX.md` antes de iniciar nuevos slices BIM.

## Resumen ejecutivo

- existe intercambio MSPDI XML aislado con import-preview, exportacion,
  jerarquia WBS, calendarios, actividades, dependencias y recursos sobre el
  contrato canonico BIM; no escribe Cronograma clasico y reporta cualquier
  semantica no representable.
- existe intercambio Primavera P6 XML aislado con preview/export, namespace
  versionado tolerante, WBS, calendarios, relaciones, recursos y asignaciones;
  XER, baselines completas y round-trip Oracle permanecen pendientes.
- existe contrato de capacidades de scheduling que mantiene XER, MPP y
  Powerproject PP desactivados hasta disponer de corpus o adaptador autorizado.
- existen revisiones canonicas persistidas de scheduling BIM con preflight,
  aprobacion unica, supersede, comparacion semantica y rollback; no aplican
  cambios sobre Cronograma clasico.
- existe corpus IFC real de cinco modelos buildingSMART CC BY 4.0 con
  manifiesto, checksums, IFC4/IFC2x3, arquitectura, estructura, MEP y federacion
  reproducible; parser y `IfcImporter` Fragments quedan validados contra el
  mismo contrato.
- existe fundacion 4D aislada con snapshots de actividad, propuestas de vinculo
  elemento-actividad, capacidades dedicadas, decisiones auditables y UX BIM.
- existe simulacion 4D operativa con progreso inmutable, estados por fecha de
  corte, timeline reproducible y perfiles de visibilidad/color Fragments.
- existe plan-real 4D con lineas base inmutables, dependencias snapshot,
  desviacion declarada y retorno a viewpoints por version/GUID.
- existen frentes, componentes construibles logicos y escenarios what-if
  inmutables con deteccion de violaciones, sin mutar IFC ni Cronograma.
- existen propuestas 4D/5D de duracion y recursos derivadas de cantidades BIM
  verificadas, aprobables solo dentro del dominio BIM.

La capa BIM ya no esta solo planificada. Existe una incubacion funcional en
codigo, protegida por feature flags y con la experiencia clasica de Proyectos
forzada a BIM apagado.

El estado correcto es:

- arquitectura BIM planificada y parcialmente implementada;
- dominio backend BIM creado dentro del backend comun;
- frontend BIM creado en perimetros dedicados;
- endpoints BIM montados bajo `/api/v1/bim`;
- administracion BIM montada bajo `/api/v1/admin-bim`;
- pestaña BIM en `Proyectos.jsx` apagada de forma explicita mediante
  `CLASSIC_BIM_ACCESS_DISABLED`;
- viewer tecnico/demostrativo 2D basado en geometria propia de frontend y
  fundacion 3D local aislada con Three.js;
- persistencia BIM principal regularizada con migracion Alembic inicial;
  servicios BIM ya no crean tablas runtime y ahora exigen esquema aplicado para
  escrituras.
- migracion Alembic principal conserva cobertura rapida heredada y los nuevos
  cierres de persistencia BIM exigen validacion PostgreSQL; la rama 4D pasa
  upgrade, downgrade y servicios sobre PostgreSQL 18 aislado,
  sin tocar DB real.
- smoke frontend BIM positivo aislado agregado para comprobar workspace/canvas
  sin activar BIM en Proyectos clasico.
- smoke visual DOM del viewer BIM agregado con harness aislado y canvas no
  vacio en desktop/mobile.
- importacion JSON batch endurecida como operacion transaccional todo-o-nada.
- UX BIM bloquea importaciones JSON con errores de validacion antes de llamar a
  importacion de paquete unico o batch.
- permisos de vistas BIM compartidas endurecidos para duplicacion hacia scope
  `company`.
- endpoints BIM de importacion JSON rechazan con 400 paquetes con errores de
  validacion antes de crear modelos o versiones.
- workspace context BIM cubierto por pruebas HTTP: persistencia aislada por
  usuario/proyecto/empresa y bloqueo bajo feature flag apagada.
- view states BIM restringen scopes publicos a `personal` y `company`; el scope
  `workspace_context` queda reservado al servicio interno.
- existe endpoint backend BIM para registrar manifiestos IFC versionados bajo
  feature flag, sin parsing IFC semantico ni fragments todavia.
- `frontend/src/api/bimModels.js` expone cliente de dominio para registrar
  manifiestos IFC sin activar UX visible.
- existe endpoint backend BIM `/imports/ifc-text` para parsing IFC textual
  inicial bajo feature flag, tenant y rol superadministrador.
- `frontend/src/api/bimModels.js` expone cliente de dominio `importIfcText`
  para la puerta semantica IFC inicial.
- existe bateria inicial de simulaciones IFC S1/S2/S3 sinteticas para parser
  textual, incluyendo arquitectura pequena, coordinacion multinivel y volumen
  medio.
- existe storage local IFC controlado bajo `BIM_LOCAL_STORAGE_DIR`, endpoint
  `/imports/ifc-file` y persistencia de `artifact_path` en versiones BIM.
- el parser IFC textual inicial ya resuelve relaciones espaciales
  `IFCRELCONTAINEDINSPATIALSTRUCTURE` y property sets simples mediante
  `IFCRELDEFINESBYPROPERTIES`, `IFCPROPERTYSET` e
  `IFCPROPERTYSINGLEVALUE`.
- existe generacion local de artefacto optimizado JSON para viewer BIM con
  indices por storey, clase IFC y propiedades.
- el viewer 3D aislado ya consume artefactos `giproy_bim_viewer_artifact`
  mediante adaptador frontend BIM y harness WebGL verificado.
- el registro de manifiestos IFC bloquea etiquetas de version duplicadas por
  modelo antes de escribir.
- la importacion JSON BIM bloquea etiquetas de version duplicadas por modelo y
  responde 400 sin crear una segunda version.
- `frontend/package.json` incorpora el stack BIM/3D autorizado:
  `three`, `web-ifc`, `@thatopen/components`,
  `@thatopen/components-front` y `@thatopen/fragments`.
- `frontend/src/components/bim/BimThreeViewer.jsx` monta una escena WebGL
  aislada con elementos BIM extruidos desde `geometry_2d`, preparada como
  fundacion del viewer IFC/3D maduro.
- existe smoke local de fragments binarios mediante `IfcImporter` de
  `@thatopen/fragments` y WASM local de `web-ifc`.
- existe carga de bytes fragments con `FragmentsModels` dentro del harness BIM
  aislado.
- el harness fragments expone localIds y GlobalIds consultables a partir de un
  fixture IFC geometrico representativo local.
- existe simulacion IFC/fragments de volumen local con 25 muros procesados por
  `IfcImporter`.
- el harness fragments consulta `ItemData` desde `FragmentsModels` y expone una
  muestra verificable de localId/GlobalId.
- el harness fragments expone inspector y controles frontend reales de categoria
  IFC y visibilidad mediante `getCategories`, `getItemsOfCategories`,
  `getVisible`, `toggleVisible`, `resetVisible` y `getItemsByVisibility`.
- el harness fragments expone inspector `ItemData` profundo con claves reales,
  `GlobalId` resuelto y tipo/clase IFC derivado de `FragmentsModels`.
- el harness fragments consulta `getSpatialStructure()` y expone estructura
  espacial real con nodos, profundidad e hijos de raiz trazables.
- el harness fragments consulta geometria y medicion nativa con
  `getItemsWithGeometry`, `getBoxes`, `getItemsVolume` y
  `getItemsMaterialDefinition`.
- el harness fragments mide categorias IFC activas con `getItemsVolume`,
  `getMergedBox` y `getItemsMaterialDefinition` sobre localIds reales de
  categoria.
- el harness fragments genera subset binario por categoria IFC activa mediante
  `getSubsetBuffer` y expone bytes verificables en DOM.
- el harness fragments valida trazabilidad bidireccional `localId`/`GlobalId`
  mediante `getGuidsByLocalIds` y `getLocalIdsByGuids`.
- el harness fragments consulta `ItemData` batch por categoria IFC activa y
  expone conteo de items y claves reales en DOM.
- el harness fragments conecta el hit de `model.raycast` con
  `model.getItemsData([localId])` y expone seleccion nativa con claves,
  tipo/categoria y nombre verificables en DOM.
- el harness fragments alterna visibilidad del `localId` seleccionado mediante
  `model.toggleVisible([localId])`, refresca fragments y expone el estado
  visible/no visible de la seleccion nativa en DOM.
- el harness fragments re-renderiza el canvas nativo al alternar o restaurar
  visibilidad por categoria IFC, con visibles/ocultos validados por smoke DOM.
- el harness fragments permite aislar la categoria IFC activa en el canvas
  nativo con `getLocalIds`, `getItemsOfCategories`, `resetVisible` y
  `toggleVisible`, con estado DOM y reset trazables.
- el canvas fragments nativo acepta `pointerdown` real y ejecuta
  `model.raycast` con coordenadas del evento, manteniendo `localId`, `GlobalId`
  e `ItemData` de seleccion trazables.
- el canvas BIM 2D expone filtro operativo por clase IFC derivado de elementos
  reales, con controles compactos alineados con Proyectos y atributos DOM
  trazables.
- el viewer BIM 3D local expone seleccion por `THREE.Raycaster`, sincronizada
  con el estado BIM y trazable por `elementId`, `GlobalId` y clase IFC.
- el viewer BIM 3D local usa `OrbitControls` de Three.js para navegacion
  profesional y reset de camara, sin depender de autorrotacion demostrativa.
- el viewer BIM 3D local permite enfocar el elemento seleccionado ajustando
  camara y target de `OrbitControls`, con `elementId` y `GlobalId` trazables.
- el viewer BIM 3D local expone hover por `THREE.Raycaster`, con `elementId`,
  `GlobalId` y clase IFC trazables sin seleccionar el elemento.
- el viewer BIM 3D local muestra inspector contextual de hover/seleccion con
  nombre, clase IFC, `GlobalId`, conteo de propiedades, material y sistema
  cuando existen en datos BIM reales.
- el viewer BIM 3D local filtra la escena por clase IFC con controles compactos
  `IFC 3D`, derivados de elementos reales.
- el viewer BIM 3D local permite ocultar/restaurar clases IFC con controles
  `Visibilidad 3D` y reset trazable.
- el parser IFC textual extrae quantities iniciales, materiales directos y
  sistemas mediante relaciones STEP/IFC simples.

## Codigo backend existente

### Modelos

El repo contiene modelos BIM dedicados:

- `backend/app/models/bim_model.py`
- `backend/app/models/bim_model_version.py`
- `backend/app/models/bim_element.py`
- `backend/app/models/bim_storey.py`
- `backend/app/models/bim_view_state.py`
- `backend/app/models/bim_link_edt.py`
- `backend/app/models/bim_link_apu.py`
- `backend/app/models/bim_link_presupuesto.py`
- `backend/app/models/system_bim_setting.py`

### Schemas

El repo contiene contratos BIM dedicados:

- `backend/app/schemas/bim_model.py`
- `backend/app/schemas/bim_link.py`
- `backend/app/schemas/bim_view_state.py`
- `backend/app/schemas/system_bim_setting.py`

### Servicios

El repo contiene servicios BIM dedicados:

- `backend/app/services/bim/feature_flags.py`
- `backend/app/services/bim/model_registry.py`
- `backend/app/services/bim/import_service.py`
- `backend/app/services/bim/ifc_parser.py`
- `backend/app/services/bim/ifc_storage.py`
- `backend/app/services/bim/artifact_service.py`
- `backend/app/services/bim/link_registry.py`
- `backend/app/services/bim/view_state_service.py`
- `backend/app/services/bim/demo_bootstrap.py`
- `backend/app/services/system_bim_setting.py`

### Endpoints

El router comun monta:

- `/api/v1/bim/feature-flags/me`
- `/api/v1/bim/projects/{project_id}/workspace`
- `/api/v1/bim/projects/{project_id}/models`
- `/api/v1/bim/projects/{project_id}/bootstrap-demo`
- `/api/v1/bim/projects/{project_id}/imports/json-package`
- `/api/v1/bim/projects/{project_id}/imports/json-batch`
- `/api/v1/bim/projects/{project_id}/imports/ifc-manifest`
- `/api/v1/bim/projects/{project_id}/imports/ifc-text`
- `/api/v1/bim/projects/{project_id}/imports/ifc-file`
- `/api/v1/bim/projects/{project_id}/versions/{version_id}/artifacts/viewer`
- `/api/v1/bim/projects/{project_id}/imports/json-validate`
- endpoints BIM de links
- endpoints BIM de view states
- `/api/v1/admin-bim`

Los endpoints `json-package` y `json-batch` ejecutan validacion BIM previa,
rechazan imports con errores y bloquean etiquetas de version duplicadas por
modelo. Las advertencias siguen siendo no bloqueantes.

## Codigo frontend existente

### APIs

El repo contiene clientes de dominio BIM en `frontend/src/api`:

- `frontend/src/api/bim.js`
- `frontend/src/api/bimModels.js`
- `frontend/src/api/bimLinks.js`
- `frontend/src/api/bimViewStates.js`
- `frontend/src/api/adminBim.js`

### Hooks

El repo contiene hooks BIM dedicados:

- `frontend/src/hooks/bim/useBimFeatureAccess.js`
- `frontend/src/hooks/bim/useBimProjectWorkspace.js`

### Componentes

El repo contiene componentes BIM dedicados:

- `frontend/src/components/projects/BimTab.jsx`
- `frontend/src/components/bim/BimWorkspace.jsx`
- `frontend/src/components/bim/BimCanvasViewer.jsx`
- `frontend/src/components/bim/BimThreeViewer.jsx`
- `frontend/src/components/bim/BimPropertiesPanel.jsx`
- `frontend/src/components/bim/BimTreePanel.jsx`
- `frontend/src/components/bim/BimLinksPanel.jsx`
- `frontend/src/components/bim/BimVersionSelector.jsx`
- `frontend/src/components/bim/BimViewStateToolbar.jsx`
- `frontend/src/components/bim/BimFragmentsHarness.jsx`

## Activacion y no interferencia clasica

El estado clasico vigente sigue protegido:

- `frontend/src/pages/Proyectos.jsx` define `CLASSIC_BIM_ACCESS_DISABLED`.
- `Proyectos.jsx` usa `const bimAccess = CLASSIC_BIM_ACCESS_DISABLED;`.
- La seccion `bim` solo pasa el filtro si `bimAccess.enabled`.
- El smoke `frontend/scripts/smoke-classic-no-bim-contamination.mjs` verifica
  que la ruta clasica no monte hooks ni componentes BIM.

Por tanto, BIM existe en codigo, pero la experiencia visible clasica permanece
apagada en `Proyectos` bajo el estado actual.

## Persistencia y deuda Alembic

Hay migraciones Alembic para:

- `system_bim_settings`
- tablas principales del dominio BIM mediante
  `backend/alembic/versions/de2001a1b2c3_bim_domain_tables.py`

La migracion principal cubre:

- `bim_models`
- `bim_model_versions`
- `bim_elements`
- `bim_storeys`
- `bim_view_states`
- `bim_link_edt`
- `bim_link_apu`
- `bim_link_presupuesto`

Tras `BIM-TASK-0017`, los servicios BIM ya no crean tablas runtime. Las
lecturas pueden devolver estado no listo o listas vacias si falta esquema, y
las escrituras fallan explicitamente indicando que debe aplicarse Alembic.

Antes de declarar `BIM-TASK-0002` cerrada debe validarse la migracion en base
local controlada.

## Stack viewer

El plan maestro conserva como stack objetivo:

- Three.js
- web-ifc
- That Open Components
- That Open Fragments

El codigo frontend ya incorpora esas dependencias como fundacion local. El
viewer actual debe considerarse una shell tecnica 2D operativa + una escena 3D
interactiva con Three.js para metadata, geometria simplificada, filtros IFC,
filtro/visibilidad IFC 3D, seleccion y hover por raycasting, navegacion
OrbitControls, inspector 3D contextual, propiedades, links y foco de elemento
seleccionado, propiedades, links y consumo de artefacto JSON
optimizado. Todavia no es un viewer IFC maduro porque falta dataset geometrico
real y pruebas con modelos reales. El harness fragments ya prueba raycasting
nativo con `model.raycast` sobre canvas WebGL propio y seleccion `ItemData`
desde el hit, pero esa capacidad aun no esta integrada como seleccion madura
del viewer fragments productivo.

## Estado por TASK BIM estructural

| TASK | Estado real |
|---|---|
| `BIM-TASK-0000` | En progreso documental, programa no liberable |
| `BIM-TASK-0001` | Parcialmente implementada |
| `BIM-TASK-0002` | Parcialmente implementada, Alembic principal creado y validado en entorno controlado |
| `BIM-TASK-0003` | Parcialmente implementada, apagada en Proyectos clasico |
| `BIM-TASK-0004` | Parcialmente implementada para paquetes JSON con batch transaccional, bloqueo de labels JSON duplicados, manifiesto IFC versionado, cliente frontend de dominio, bloqueo de labels IFC duplicados, parsing IFC textual inicial hacia storeys/elementos, relaciones/property sets iniciales, quantities/materiales/sistemas iniciales, storage local IFC controlado, artefacto viewer optimizado JSON, consumo en viewer 3D/harness, smoke local de fragments binarios, carga con `FragmentsModels`, corpus IFC real S/M/L, dataset geometrico representativo local, simulacion de volumen local, consulta `ItemData`, inspector/controles frontend de fragments, raycasting nativo fragments en harness, seleccion ItemData nativa desde hit real, seleccion por puntero, visibilidad de seleccion nativa, visibilidad por categoria y filtro de categoria en canvas fragments nativo; pendiente viewer Fragments de producto |
| `BIM-TASK-0005` | Backend latente cubierto para links EDT/APUs/Presupuesto; navegacion visible pendiente |
| `BIM-TASK-0006` | Parcialmente implementada para view states/workspace context, con workspace context cubierto por usuario y flag |
| `BIM-TASK-0007` | Parcialmente implementada por flags, tenant, permisos de vistas compartidas y scopes publicos restringidos |
| `BIM-TASK-0008` | Parcialmente implementada con tests API BIM, smoke frontend estatico y smoke visual DOM del viewer |
| `BIM-TASK-0009` | Pendiente |
| `BIM-TASK-0010` | Parcialmente implementada con viewer tecnico, guardas UX de importacion, filtro operativo por clase IFC, filtro/visibilidad IFC 3D, seleccion/hover 3D por raycasting, navegacion OrbitControls, foco 3D de elemento seleccionado e inspector 3D contextual |
| `BIM-TASK-0011` | Parcialmente implementada |
| `BIM-TASK-0012` | Implementada documentalmente |
| `BIM-TASK-0013` | Implementada documentalmente |
| `BIM-TASK-0014` | Implementada documentalmente |
| `BIM-TASK-0015` | Abierta/cerrada como alineacion documental del estado real |
| `BIM-TASK-0016` | Cerrada como migracion Alembic principal |
| `BIM-TASK-0017` | Cerrada como gobierno runtime y tests focales |
| `BIM-TASK-0018` | Cerrada como contratos API BIM bajo flags y tenant |
| `BIM-TASK-0019` | Cerrada como importacion JSON y workspace activo |
| `BIM-TASK-0020` | Cerrada como links BIM latentes con EDT |
| `BIM-TASK-0021` | Cerrada como links BIM latentes con APUs y Presupuesto |
| `BIM-TASK-0022` | Cerrada como smoke frontend BIM positivo aislado |
| `BIM-TASK-0023` | Cerrada como smoke visual DOM del viewer BIM aislado |
| `BIM-TASK-0024` | Cerrada como validacion controlada de migracion Alembic BIM |
| `BIM-TASK-0025` | Cerrada como importacion JSON batch transaccional |
| `BIM-TASK-0026` | Cerrada como guarda UX de validacion previa a importacion BIM |
| `BIM-TASK-0027` | Cerrada como permisos de duplicacion de vistas BIM compartidas |
| `BIM-TASK-0028` | Cerrada como guarda backend de validacion previa a importacion BIM |
| `BIM-TASK-0029` | Cerrada como cobertura de workspace context BIM por usuario |
| `BIM-TASK-0030` | Cerrada como restriccion de scopes publicos en vistas BIM |
| `BIM-TASK-0031` | Cerrada como registro de manifiesto IFC BIM versionado |
| `BIM-TASK-0032` | Cerrada como cliente frontend BIM para manifiesto IFC |
| `BIM-TASK-0033` | Cerrada como bloqueo de etiquetas IFC duplicadas |
| `BIM-TASK-0034` | Cerrada como bloqueo de etiquetas JSON BIM duplicadas |
| `BIM-TASK-0035` | Cerrada localmente como fundacion IFC/3D con Three.js y stack BIM/3D instalado |
| `BIM-TASK-0036` | Cerrada localmente como parsing IFC semantico inicial STEP/texto hacia persistencia BIM y simulaciones sinteticas S1/S2/S3 |
| `BIM-TASK-0037` | Cerrada localmente como storage local IFC controlado, endpoint multipart y artifact_path persistido |
| `BIM-TASK-0038` | Cerrada localmente como parsing IFC profundo inicial de relaciones espaciales y property sets simples |
| `BIM-TASK-0039` | Cerrada localmente como artefacto optimizado JSON para viewer BIM con indices por storey/clase/propiedad |
| `BIM-TASK-0040` | Cerrada localmente como consumo de artefacto viewer optimizado en harness 3D con canvas WebGL validado |
| `BIM-TASK-0041` | Cerrada localmente como smoke de fragments binarios reales con `IfcImporter` y WASM local |
| `BIM-TASK-0042` | Cerrada localmente como carga de fragments binarios con `FragmentsModels` en harness aislado |
| `BIM-TASK-0043` | Cerrada localmente como dataset IFC geometrico representativo local con localIds y GlobalIds consultables |
| `BIM-TASK-0071` | Cerrada localmente como corpus IFC real licenciado, manifestado y validado con parser y Fragments |
| `BIM-TASK-0072` | Cerrada localmente como job IFC observable con persistencia, idempotencia, progreso, cancelacion, retry y UX BIM |
| `BIM-TASK-0073` | Cerrada localmente como reporte IFC STEP/schema/semantica persistido por version e integrado al job/workspace |
| `BIM-TASK-0074` | Cerrada localmente como lifecycle versionado source/viewer/fragments y cierre verificable Gate A |
| `BIM-TASK-0075` | Cerrada localmente como viewport Fragments de producto con carga registrada, raycast, resize, recovery y disposal |
| `BIM-TASK-0076` | Cerrada localmente como shell UX profesional con contexto persistente, toolbar funcional, explorer e inspector adaptables |
| `BIM-TASK-0077` | Cerrada localmente como busqueda BIM paginada, explorer arbol/tabla y seleccion GUID sincronizada |
| `BIM-TASK-0078` | Cerrada localmente con herramientas Fragments reales de visibilidad, ghost, clipping, medicion, proyeccion y reset |
| `BIM-TASK-0079` | Cerrada localmente con view state v2 reproducible y cierre Gate B |
| `BIM-TASK-0080` | Cerrada localmente con comparacion de versiones y fallback GUID explicito |
| `BIM-TASK-0081` | Cerrada localmente con federacion versionada, georreferenciada y render Fragments multiversion |
| `BIM-TASK-0082` | Cerrada localmente con IDS por version/GUID, excepciones auditadas y exportacion; Gate C cerrado |
| `BIM-TASK-0083` | Cerrada localmente con topics, viewpoints, historial y BCF-XML 2.1 |
| `BIM-TASK-0084` | Cerrada localmente con UX de incidencias creador/responsable/revisor |
| `BIM-TASK-0085` | Cerrada localmente con cantidades 5D trazables y decisiones solo BIM |
| `BIM-TASK-0086` | Cerrada localmente: puerta, foco EDT/Presupuesto y retorno APU bajo flags; Gate D al 100% |
| `BIM-TASK-0087` | Cerrada localmente con capacidades y auditoria BIM |
| `BIM-TASK-0088` | Cerrada localmente para matriz reproducible Chrome/Edge desktop/tablet |
| `BIM-TASK-0089` | Cerrada localmente con metricas sanitizadas y correlation id |
| `BIM-TASK-0090` | Allowlist desplegada en beta para Administradores Generales y Santiago Bermeo; inicio temporal y evidencia real pendientes |
| `BIM-TASK-0091` | Cerrada localmente como modelo conceptual 4D |
| `BIM-TASK-0092` | Cerrada localmente con capacidades 4D |
| `BIM-TASK-0093` | Cerrada localmente con persistencia 4D tenant-aware |
| `BIM-TASK-0094` | Cerrada localmente con propuestas y UX 4D |
| `BIM-TASK-0095` | Cerrada localmente con progreso y motor temporal PostgreSQL |
| `BIM-TASK-0096` | Cerrada localmente con timeline por fecha de corte |
| `BIM-TASK-0097` | Cerrada localmente con perfiles Fragments reversibles |
| `BIM-TASK-0098` | Cerrada localmente con baseline y dependencias PostgreSQL |
| `BIM-TASK-0099` | Cerrada localmente con plan-real y retorno a viewpoint |
| `BIM-TASK-0100` | Cerrada localmente con frentes BIM PostgreSQL |
| `BIM-TASK-0101` | Cerrada localmente con componentes logicos |
| `BIM-TASK-0102` | Cerrada localmente con escenarios what-if |
| `BIM-TASK-0103` | Cerrada localmente con propuestas de productividad 4D/5D |
| `BIM-TASK-0104` | Cerrada localmente con campo y evidencia PostgreSQL BYTEA |
| `BIM-TASK-0105` | Cerrada localmente con productividad real y EVM |
| `BIM-TASK-0106` | Cerrada: playback 4D profesional nativo |
| `BIM-TASK-0107` | Cerrada: recursos, asignaciones, capacidad e histogramas PostgreSQL |
| `BIM-TASK-0108` | Cerrada: conflictos espacio-tiempo con evidencia y foco GUID |
| `BIM-TASK-0109` | Cerrada: Gantt BIM, ruta crítica y navegación temporal |
| `BIM-TASK-0110` | Cerrada: informes JSON/CSV 4D/5D nativos |
| `BIM-TASK-0111` | Cerrada: corpus IFC real S/M/L y presupuesto WebGL |
| `BIM-TASK-0112` | Cerrada: gate nativo, aislamiento y rollback certificados |
| `BIM-TASK-0113` | Cerrada: particiones no destructivas PostgreSQL y preview WebGL real |
| `BIM-TASK-0114` | Cerrada: sólidos paramétricos, cantidades y artefacto PostgreSQL; CSG IFC exacto no declarado |
| `BIM-TASK-0115` | Cerrada: equipos BIM, trayectorias temporizadas, playback y conflictos operacionales |
| `BIM-TASK-0116` | Cerrada: seguridad 4D PostgreSQL con zonas, inspecciones y exposición de rutas |
| `BIM-TASK-0117` | Cerrada: gate avanzado reproducible, federación x5 y presupuesto WebGL |
| `BIM-TASK-0118` | Cerrada localmente: sustracción/intersección CSG exacta sobre malla manifold controlada, conservación volumétrica y harness WebGL; pendiente materialización PostgreSQL y cobertura IFC general |
| `BIM-TASK-0119` | Cerrada localmente: persistencia CSG inmutable por revisión en PostgreSQL, validación geométrica servidor, API tenant-aware y round-trip por checksum; pendiente fuente geométrica IFC/Fragments real |
| `BIM-TASK-0120` | Cerrada localmente: IFC real buildingSMART verificado, conversión Fragments y partición CSG conservativa de sólido web-ifc con ExpressId/GlobalId; pendiente round-trip geométrico desde FragmentsModels |
| `BIM-TASK-0121` | Cerrada localmente: triangulación obtenida por `FragmentsModels.getItemsGeometry`, GlobalId real, CSG conservativo, canvas responsive y payload PostgreSQL verificable; pendiente consumo del artefacto CSG en el panel BIM de producto |
| `BIM-TASK-0122` | Cerrada localmente: el panel BIM de producto consulta, reconstruye y renderiza la revision CSG PostgreSQL mas reciente, con trazabilidad y fallback `bounding_box_v1`; Gate D y piloto Gate E pendientes |
| `BIM-TASK-0044` | Cerrada localmente como parsing IFC inicial de quantities, materiales y sistemas |
| `BIM-TASK-0046` | Cerrada localmente como simulacion IFC/fragments de volumen local |
| `BIM-TASK-0047` | Cerrada localmente como consulta ItemData desde FragmentsModels |
| `BIM-TASK-0048` | Cerrada localmente como inspector y controles frontend de fragments consultables |
| `BIM-TASK-0049` | Cerrada localmente como filtro operativo por clase IFC en canvas BIM |
| `BIM-TASK-0050` | Cerrada localmente como seleccion 3D con raycasting en viewer BIM |
| `BIM-TASK-0051` | Cerrada localmente como navegacion 3D profesional con OrbitControls |
| `BIM-TASK-0052` | Cerrada localmente como foco 3D de elemento seleccionado |
| `BIM-TASK-0053` | Cerrada localmente como hover 3D con raycasting trazable |
| `BIM-TASK-0054` | Cerrada localmente como inspector 3D contextual del viewer BIM |
| `BIM-TASK-0055` | Cerrada localmente como filtro IFC 3D operativo en viewer BIM |
| `BIM-TASK-0056` | Cerrada localmente como visibilidad IFC 3D operativa en viewer BIM |
| `BIM-TASK-0064` | Cerrada localmente como raycasting nativo fragments en harness BIM |
| `BIM-TASK-0065` | Cerrada localmente como seleccion ItemData nativa fragments desde raycasting |
| `BIM-TASK-0066` | Cerrada localmente como visibilidad de seleccion nativa fragments |
| `BIM-TASK-0067` | Cerrada localmente como visibilidad por categoria en canvas fragments nativo |
| `BIM-TASK-0068` | Cerrada localmente como filtro de categoria en canvas fragments nativo |
| `BIM-TASK-0069` | Cerrada localmente como seleccion por puntero en canvas fragments nativo |

## Reglas para el proximo slice BIM

Antes de avanzar funcionalmente:

1. No asumir que BIM esta no iniciado.
2. No duplicar modelos, endpoints ni componentes ya existentes.
3. La pestaña BIM en Proyectos solo puede activarse bajo `TASK-2022`, feature
   flag y allowlists; cualquier otro modulo exige TASK separada.
4. Regularizar migraciones Alembic del dominio BIM antes de crecer persistencia.
5. Mantener `smoke-classic-no-bim-contamination` como validacion obligatoria.
6. Tratar el viewer actual como shell incubada 2D/3D, no como viewer IFC maduro.
7. Gates A/B/C/D estan cerrados y el perimetro BIM actual esta desplegado en
   beta. Gate E tiene preparacion tecnica completa y allowlist activa para
   empresas `1` y `3`; sigue abierto por el piloto humano real. Las demas
   empresas permanecen denegadas y sin UX BIM.

## Entitlement comercial vigente - 2026-07-13

- La puerta BIM exige rollout y derecho comercial simultaneamente.
- Empresarial, Tester, Academica y Capacitacion incluyen BIM.
- Estandar y Profesional pueden comprar el modulo mensual por USD 99.99.
- Express no incluye ni puede comprar BIM.
- Empresas piloto `1` y `3` son Enterprise localmente y en beta; cualquier otra
  empresa sigue oculta por la allowlist aunque su licencia incluya BIM.
- Gate E humano continua abierto; este cambio no altera el porcentaje global de
  certificacion.

## Workspace BIM V2 - 2026-07-13

- `BIM-TASK-0124` sustituye en beta el apilamiento visual por seis workspaces
  operativos, herramienta contextual unica y drawer temporal inferior.
- La shell V2 reutiliza viewer Fragments, plano 2D, seleccion, propiedades,
  APIs y contratos existentes; no duplica dominio ni fuentes de verdad.
- El layout y el contexto visual se persisten por proyecto, con busqueda
  unificada, redimensionado, reset y navegacion por teclado.
- `BIM-TASK-0125` elimina la rama visual anterior y el flag de convivencia;
  `BimWorkspaceV2` es la unica experiencia BIM compilada.
- El rollback de UX es externo mediante imagen y fuentes respaldadas, sin
  mantener dos formas de trabajo dentro del producto.
- La sustitucion unica esta desplegada en beta desde `BIM-TASK-0125`; bundle
  publico verificado y contenedores saludables.
- Beta publica el bundle V2 solo para quienes superan la puerta BIM existente:
  empresas 1 y 3 habilitadas, empresa 2 denegada.
- Gate E humano sigue abierto: la mejora UX no sustituye las diez jornadas ni
  las dos revisiones reales requeridas para certificacion final.

## Planificacion 4D integrada - 2026-07-13

- `BIM-TASK-0126` sustituye las pestañas temporales separadas por una superficie
  unica de timeline y Gantt dentro del drawer de Planificacion 4D.
- Existe seleccion bidireccional muchos-a-muchos: una actividad proyecta todos
  sus GlobalIds y un elemento resuelve todas sus actividades snapshot.
- Fragments federado aplica resaltado, seleccion primaria y foco por bounding
  box combinado; los viewers 2D y Three mantienen el mismo contexto visual.
- El Gantt virtualizado expone linea base, busqueda, filtros, ruta critica,
  escalas, dependencias y cursor compartido sin modificar Cronograma clasico.
- Build, Playwright 1920x1080, smokes 4D, anti-BIM y baseline enterprise pasan.
- El slice esta desplegado en beta como frontend-only. El chunk publico contiene
  los marcadores de planificacion y seleccion, la allowlist `1,3` permanece
  intacta y backend/PostgreSQL no fueron recreados.
- Gate E humano permanece abierto.

## Programa de adecuacion integral SYNCHRO

`BIM-TASK-0127` separa formalmente el 100% del nucleo 4D propio de la paridad
con toda la suite publica Bentley SYNCHRO. La matriz contractual evalua 60
capacidades: 16 completas, 23 parciales y 21 ausentes, para un baseline
conservador de 45,83%. Este cambio es documental; no altera codigo, rollout,
Gate E ni GiProy Clasico. La implementacion continua desde `BIM-TASK-0128`.

`BIM-TASK-0130` incorpora el primer slice funcional de la adecuacion integral:
un contrato canonico de scheduling y preflight protegido que valida calendarios,
WBS, actividades, relaciones, recursos, asignaciones, baselines, ciclos, zonas
IANA y perdida de datos. Es observacional y no escribe Cronograma clasico ni
PostgreSQL. El baseline integral permanece en 45,83% hasta cerrar un formato de
intercambio end-to-end.

## QTO BIM versionado - 2026-07-13

- `BIM-TASK-0135` incorpora snapshots QTO inmutables sobre cantidades IFC
  persistidas, con agrupacion, cobertura, checksum y trazabilidad GlobalId.
- Las reglas WBS/coste son referencias latentes dentro de BIM; no consultan ni
  escriben EDT, APU, Presupuesto o Cronograma clasicos.
- El Workspace BIM V2 organiza cantidades en `QTO` y `Elemento`; el harness
  Playwright certifica el flujo a 1920x1080 sin overflow.
- La rama BIM alcanza `de2024a1b2c3`; build, 29 pruebas acumuladas, smokes BIM,
  anti-BIM y baseline enterprise estan verdes.
- `BIM-TASK-0136` agrega aprobacion unica, control optimista y paquete 5D
  versionado. A04 queda completa; F01 sigue parcial porque no existe aplicacion
  ni estimacion automatica sobre fuentes clasicas.
- La paridad integral demostrada queda en `47,50%`: 17 completas, 23 parciales
  y 20 ausentes.

## Nivelacion de recursos 4D - 2026-07-13

- `BIM-TASK-0137` agrega escenarios inmutables de nivelacion CPM sobre una
  linea base BIM y asignaciones nativas, con restricciones FS/SS/FF/SF,
  capacidad diaria, checksum y decisiones auditables.
- La simulacion nunca muta actividades, dependencias, recursos ni Cronograma
  clasico. Aprobar selecciona un escenario y supersede el anterior; rechazar o
  retirar el escenario conserva intacta la fuente.
- Cada escenario registra `proyecto_id`, `project_revision` y
  `project_root_code`. Dos revisiones con el mismo `codigo_root` conservan
  Gantt, recursos, lineas base y escenarios independientes.
- La migracion `de2026a1b2c3` pasa upgrade, downgrade, tipos `TIMESTAMPTZ` e
  indice unico parcial sobre PostgreSQL real en `giproy_bim_test`; SQLite se
  usa solo como motor efimero de pruebas unitarias.
- `BIM-TASK-0138` incorpora seleccion de linea base/recurso, simulacion,
  comparacion antes/despues y aprobacion/rechazo en el Workspace BIM V2.
- Build, Playwright 1920x1080, smoke anti-BIM, 41 pruebas acumuladas y baseline
  enterprise pasan. A09 queda completa.
- La paridad integral demostrada queda en `48,33%`: 18 completas, 22 parciales
  y 20 ausentes. Esta ola no se ha desplegado.

## Intercambio de planificacion en producto - 2026-07-13

- `BIM-TASK-0139` incorpora un tab `Intercambio` en Planificacion del Workspace
  BIM V2 para MSPDI y Primavera P6 XML.
- El usuario selecciona XML, zona horaria y moneda, ejecuta import-preview y
  revisa conteos, errores y perdidas antes de guardar una revision BIM.
- Las revisiones se pueden aprobar, rechazar y revertir; la exportacion produce
  XML descargable. Ninguna accion aplica cambios al Cronograma clasico.
- El flujo usa exclusivamente `frontend/src/api/bimModels.js` y endpoints BIM
  protegidos existentes; no introduce llamadas API directas ni nueva tabla.
- Build, 17 pruebas focales, Playwright 1920x1080, workspace V2, anti-BIM y
  baseline enterprise pasan. B04 queda completa; B02 permanece parcial por la
  certificacion externa P6/XER pendiente.
- La paridad integral demostrada queda en `49,17%`: 19 completas, 21 parciales
  y 20 ausentes. Esta ola no se ha desplegado.

## Gestion documental CDE BIM - 2026-07-13

- `BIM-TASK-0140` incorpora documentos CDE y revisiones inmutables en tablas
  BIM dedicadas, aisladas por empresa/proyecto.
- Cada codigo documental conserva una revision vigente unica, historial
  superseded, etiqueta de emision, metadata, tamano y checksum SHA-256.
- Los archivos viven bajo `BIM_LOCAL_STORAGE_DIR/<empresa>/<proyecto>/cde`, con
  nombre seguro, limite de 100 MB, bloqueo de ejecutables y escritura atomica.
- Descarga valida confinamiento de ruta e integridad antes de servir bytes;
  archivar es logico y no elimina archivos ni historial.
- El Workspace BIM V2 agrega `Documentos` en Coordinacion con carga de nuevas
  emisiones, historial, descarga y archivo. No reutiliza ni modifica
  Documentos de Proyecto clasico.
- PostgreSQL real pasa upgrade/downgrade `de2027a1b2c3`, `TIMESTAMPTZ` e indice
  parcial de revision vigente; ademas pasan 45 pruebas acumuladas, build,
  Playwright 1920x1080, workspace V2, anti-BIM y baseline enterprise.
- C01 queda completa. C04 permanece parcial hasta ACL documental. Paridad:
  `50,00%`, con 20 completas, 20 parciales y 20 ausentes. Sin deploy.

## Workflow RFI integral - 2026-07-13

- `BIM-TASK-0141` agrega RFI y eventos auditables en tablas BIM dedicadas,
  aisladas por empresa/proyecto y migracion aditiva `de2028a1b2c3`.
- El contrato conserva numeracion, pregunta, responsable, vencimiento,
  prioridad, documento CDE y `GlobalId`, con bloqueo optimista.
- El workflow controla envio, respuesta, cierre y anulacion; responsable y
  solicitante tienen acciones diferenciadas y cada transicion deja evento.
- El Workspace BIM V2 incorpora `RFI` en Coordinacion con contexto del elemento
  IFC seleccionado. No se agrega dependencia ni UX a GiProy Clasico.
- PostgreSQL real, 35 pruebas acumuladas, build, Playwright 1920x1080,
  workspace V2, anti-BIM y baseline enterprise pasan.
- C02 queda completa. Paridad: `50,83%`, con 21 completas, 19 parciales y 20
  ausentes. Programa: 15/61 slices, 24,59% realizado y 75,41% pendiente. Sin
  deploy.

## Submittals y planos de ingenieria - 2026-07-13

- `BIM-TASK-0142` agrega expedientes, revisiones y eventos BIM mediante la
  migracion aditiva `de2029a1b2c3`.
- Cada revision de submittal fija una revision documental CDE exacta; nuevas
  emisiones no alteran retroactivamente decisiones previas.
- El workflow controla envio, revision, aprobacion, rechazo, anulacion y
  reenvio con bloqueo optimista, revisor asignado y trazabilidad completa.
- El Workspace BIM V2 incorpora `Submittals` en Coordinacion. No depende de
  Documentos, Compras ni Contratos clasicos.
- PostgreSQL real, 39 pruebas acumuladas, build, Playwright 1920x1080,
  workspace V2, anti-BIM y baseline enterprise pasan.
- C03 queda completa. Paridad: `52,50%`, con 22 completas, 19 parciales y 19
  ausentes. Programa: 16/61 slices, 26,23% realizado y 73,77% pendiente. Sin
  deploy.

## ACL documental granular BIM - 2026-07-13

- `BIM-TASK-0143` agrega concesiones por documento y usuario mediante la
  migracion aditiva `de2030a1b2c3`.
- Los permisos ver, descargar, revisar y administrar son jerarquicos y se
  aplican a listado, historial, descarga, nueva revision y archivo.
- Sin ACL se conserva el contrato BIM previo; despues de la primera concesion,
  revocar todos los accesos no vuelve a exponer el documento.
- Solo creador, superadmin o administrador ACL puede gobernar concesiones. No
  se modifican auth, JWT, roles ni documentos clasicos.
- PostgreSQL real, 43 pruebas acumuladas, build, Playwright 1920x1080,
  workspace V2, anti-BIM y baseline enterprise pasan.
- C04 queda completa. Paridad: `53,33%`, con 23 completas, 18 parciales y 19
  ausentes. Programa: 17/61 slices, 27,87% realizado y 72,13% pendiente. Sin
  deploy.

## Geolocalizacion BIM modelo-mapa - 2026-07-13

- `BIM-TASK-0144` agrega anclas BIM versionadas mediante la migracion aditiva
  `de2031a1b2c3`.
- La ubicacion conserva WGS84, CRS declarado, altitud, origen local, rumbo,
  zoom, `codigo_root` y revision clasica, pero el aislamiento usa `proyecto_id`.
- Los origenes federados se transforman a puntos de mapa; seleccionar un punto
  activa su version en el visor y la version activa queda resaltada.
- No existe lectura o escritura automatica de la geolocalizacion clasica ni se
  promete reproyeccion EPSG universal sin adaptador certificado.
- PostgreSQL real, 41 pruebas de regresion seleccionada, build, Playwright
  1920x1080, workspace V2, anti-BIM y baseline enterprise pasan.
- C05 queda completa. Paridad: `55,00%`, con 24 completas, 18 parciales y 18
  ausentes. Programa: 18/61 slices, 29,51% realizado y 70,49% pendiente. Sin
  deploy.

## Revision CDE contextual y notificaciones BIM - 2026-07-13

- `BIM-TASK-0145` agrega revisiones, comentarios y notificaciones mediante la
  migracion aditiva `de2032a1b2c3`.
- Cada hilo fija una revision documental, responsable y vencimiento; puede
  conservar `GlobalId` y viewpoint BIM.
- Creador y responsable gobiernan comentario, resolucion, reapertura y cierre
  con bloqueo optimista; terceros del tenant no acceden.
- La bandeja BIM deduplica eventos y registra lectura sin tocar correo ni
  notificaciones clasicas.
- PostgreSQL real, 44 pruebas, build, Playwright 1920x1080, workspace V2,
  anti-BIM y baseline enterprise pasan.
- C07 queda completa. Paridad: `55,83%`, con 25 completas, 17 parciales y 18
  ausentes. Programa: 19/61 slices, 31,15% realizado y 68,85% pendiente. Sin
  deploy.

## Dashboard CDE operacional - 2026-07-16

- `BIM-TASK-0146` agrega un resumen CDE de solo lectura sobre documentos,
  RFIs, submittals, revisiones, responsables y notificaciones existentes.
- ACL documental y participación limitan las métricas ordinarias; el
  superadministrador conserva vista de proyecto sin cruzar empresa ni
  `proyecto_id`.
- La superficie `Resumen` abre Coordinacion BIM V2 con KPIs compactos, estados,
  carga por responsable y cola ordenada por vencimiento.
- No hay migracion nueva ni dependencia desde GiProy Clasico; PostgreSQL real
  pasa 25 pruebas CDE y upgrade/downgrade hasta `de2032a1b2c3`.
- Build, Playwright 1920x1080, workspace V2, anti-BIM y baseline enterprise
  pasan.
- C08 queda completa. Paridad: `56,67%`, con 26 completas, 16 parciales y 18
  ausentes. Programa: 20/61 slices, 32,79% realizado y 67,21% pendiente. Sin
  deploy.

## Documentos CDE disponibles en Campo - 2026-07-16

- `BIM-TASK-0147` incorpora `Documentos` como primera herramienta de Campo en
  el Workspace BIM V2 de escritorio.
- El panel consume el listado CDE autorizado y descarga la revision vigente
  mediante el cliente BIM; busqueda y categoria son filtros locales de la
  coleccion ya delimitada por ACL.
- No existe una segunda persistencia, escritura documental, PWA, cache,
  sincronizacion offline ni soporte movil declarado.
- PostgreSQL real pasa 8 pruebas CDE/ACL y el ciclo reversible hasta
  `de2032a1b2c3`; no hay migracion nueva.
- Build, 14 smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline
  enterprise pasan.
- D03 queda completa. Paridad: `58,33%`, con 27 completas, 16 parciales y 17
  ausentes. Programa: 21/61 slices, 34,43% realizado y 65,57% pendiente. Sin
  deploy.

## Incidencias y evidencia fotografica de Campo - 2026-07-16

- `BIM-TASK-0148` extiende la incidencia BCF existente con adjuntos
  fotograficos en la tabla BIM aditiva `bim_issue_attachments`.
- PostgreSQL conserva binario, firma MIME verificada, tamano, checksum SHA-256,
  autor y fecha; el acceso se resuelve siempre por issue, proyecto y empresa.
- Campo BIM V2 presenta lista/detalle, busqueda, estados, creacion contextual,
  comentarios y galeria en una sola superficie de trabajo.
- La migracion `de2033a1b2c3` es reversible; 8 pruebas PostgreSQL, build, 15
  smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline enterprise
  pasan.
- D04 queda completa. Paridad: `59,17%`, con 28 completas, 15 parciales y 17
  ausentes. Programa: 22/61 slices, 36,07% realizado y 63,93% pendiente. Sin
  deploy.

## Diario de obra consolidado de Campo - 2026-07-16

- `BIM-TASK-0149` consolida por fecha los partes 4D existentes sin crear otra
  persistencia ni modificar el registro de avance.
- Campo BIM V2 incorpora busqueda, frente, rango temporal, resumen diario,
  lista/detalle, observacion oficial, metricas y evidencia descargable.
- Las cantidades instaladas se mantienen por parte y unidad; el resumen no
  combina unidades incompatibles.
- PostgreSQL pasa 8 pruebas y validacion reversible hasta `de2033a1b2c3`; no
  hay migracion nueva.
- Build, 16 smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline
  enterprise pasan.
- D05 y E05 quedan completas. Paridad: `60,83%`, con 30 completas, 13
  parciales y 17 ausentes. Programa: 23/61 slices, 37,70% realizado y 62,30%
  pendiente. Sin deploy.

## Inspecciones, checklists y punch lists de Campo - 2026-07-16

- `BIM-TASK-0150` sustituye la tab aislada de riesgos por una superficie unica
  de inspeccion, sin perder zona WebGL ni exposicion 4D.
- La migracion aditiva `de2034a1b2c3` agrega checklist JSON y punch items
  tenant-aware ligados a riesgo e inspeccion.
- Resultados y checks se validan de forma coherente; los hallazgos conservan
  prioridad y transiciones auditables entre abierto, en curso y cerrado.
- PostgreSQL pasa 10 pruebas y ciclo reversible hasta `de2034`; build, 17
  smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline pasan.
- D07 queda completa. Paridad: `61,67%`, con 31 completas, 12 parciales y 17
  ausentes. Programa: 24/61 slices, 39,34% realizado y 60,66% pendiente. Sin
  deploy.

## Eventos no planificados con impacto real - 2026-07-16

- `BIM-TASK-0151` completa E04 con eventos operativos ligados a snapshots de
  actividad y frentes BIM opcionales.
- La migracion aditiva `de2035a1b2c3` persiste ocurrencia, dias de retraso,
  coste real y decision auditable `validated/void`, siempre por tenant.
- La tab `Eventos` de Produccion registra, consulta y decide el impacto; los
  totales solo consideran eventos validados.
- No hay escritura ni reprogramacion sobre Cronogramas o Presupuestos clasicos.
- PostgreSQL pasa 12 pruebas y ciclo reversible hasta `de2035`; build, 18
  smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline pasan.
- E04 queda completa. Paridad: `62,50%`, con 32 completas, 11 parciales y 17
  ausentes. Programa: 25/61 slices, 40,98% realizado y 59,02% pendiente. Sin
  deploy.

## Estimacion BIM gobernada - 2026-07-16

- `BIM-TASK-0154` completa F01 mediante estimaciones BIM derivadas de QTO
  aprobado, con precio para cada fila y checksum de origen.
- `bim_cost_estimates` persiste lineas reproducibles, subtotal `NUMERIC`,
  revision, lock y decision; solo una aprobada puede permanecer activa.
- Backend, API y UI viven en BIM y no leen ni escriben Presupuestos, APUs,
  contratos o contabilidad clasicos.
- PostgreSQL reversible, build, 21 smokes BIM, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- F01 queda completa. Paridad: `65,83%`, con 35 completas, 9 parciales y 16
  ausentes. Programa: 28/61, 45,90% realizado y 54,10% pendiente. Sin deploy.

## Contratos BIM de coste - 2026-07-16

- `BIM-TASK-0155` completa F02 mediante contratos derivados exclusivamente de
  una estimacion BIM aprobada y dentro del mismo tenant/proyecto.
- `bim_cost_contracts` persiste numero, objeto, contraparte, moneda heredada,
  compromiso `NUMERIC`, periodo, estado, lock y trazabilidad de transicion.
- El compromiso acumulado no cancelado no puede superar el subtotal aprobado;
  el workflow permitido es borrador a activo/cancelado y activo a
  cerrado/cancelado.
- Backend, API y UI viven en BIM y no dependen de proveedores, compras,
  contratos, Presupuestos o contabilidad clasicos.
- PostgreSQL reversible, build, 22 smokes BIM, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- F02 queda completa. Paridad: `67,50%`, con 36 completas, 9 parciales y 15
  ausentes. Programa: 29/61, 47,54% realizado y 52,46% pendiente. Sin deploy.

## Solicitudes y certificaciones de pago BIM - 2026-07-16

- `BIM-TASK-0156` completa F03 con solicitudes de pago contra contratos BIM
  activos y certificacion gobernada posterior al envio.
- `bim_cost_payment_applications` persiste periodo, bruto, retencion, neto,
  importes certificados, estado, lock y autores/timestamps de workflow.
- Los acumulados solicitados y certificados permanecen dentro del compromiso;
  una certificacion tampoco puede exceder su solicitud.
- Backend, API y UI viven en BIM; no ejecutan pagos ni dependen de facturacion,
  tesoreria o contabilidad clasicas.
- PostgreSQL reversible, build, 23 smokes BIM, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- F03 queda completa. Paridad: `69,17%`, con 37 completas, 9 parciales y 14
  ausentes. Programa: 30/61, 49,18% realizado y 50,82% pendiente. Sin deploy.

## Schedule of Values BIM - 2026-07-16

- `BIM-TASK-0157` completa F04 con asignaciones contractuales versionadas,
  aprobables y totalmente conciliadas con el compromiso BIM.
- `bim_cost_schedules_of_values` persiste revision, lineas de codigo/
  descripcion/valor, total `NUMERIC`, lock y decision.
- Los codigos son unicos y la suma debe coincidir exactamente con el contrato;
  una aprobacion nueva sustituye de forma trazable a la anterior.
- Backend, API y editor `Valores` viven en BIM y no leen ni escriben EDT,
  APUs, Presupuestos o contratos clasicos.
- PostgreSQL reversible, build, 24 smokes BIM, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- F04 queda completa. Paridad: `70,83%`, con 38 completas, 9 parciales y 13
  ausentes. Programa: 31/61, 50,82% realizado y 49,18% pendiente. Sin deploy.

## Cuadrillas y partes de horas BIM - 2026-07-16

- `BIM-TASK-0153` completa E08 con directorio de cuadrillas BIM y partes
  diarios ligados a actividad, frente y jornada.
- `bim_4d_crews` no almacena identidades personales; `bim_4d_timecards`
  registra horas regulares/extra y produccion instalada dentro del tenant.
- La migracion aditiva `de2037a1b2c3`, endpoints y UI viven solo en BIM; no
  hay dependencia ni escritura en personal, nomina o contabilidad clasicos.
- PostgreSQL reversible, build, 20 smokes BIM, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- E08 queda completa. Paridad: `65,00%`, con 34 completas, 10 parciales y 16
  ausentes. Programa: 27/61 slices, 44,26% realizado y 55,74% pendiente. Sin
  deploy.

## Materiales y equipos de Campo - 2026-07-16

- `BIM-TASK-0152` completa E07 con un libro BIM de recepcion, consumo y retorno
  sobre el catalogo de recursos 4D existente.
- La migracion aditiva `de2036a1b2c3` liga movimientos a recurso, actividad y
  frente dentro del tenant; el bloqueo transaccional impide saldo negativo.
- Campo incorpora la tab `Materiales` con saldos y trazabilidad operativa.
- No hay escritura en inventario, compras, APUs o contabilidad clasicos.
- PostgreSQL pasa 14 pruebas y ciclo reversible hasta `de2036`; build, 19
  smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline pasan.
- E07 queda completa. Paridad: `63,33%`, con 33 completas, 10 parciales y 17
  ausentes. Programa: 26/61 slices, 42,62% realizado y 57,38% pendiente. Sin
  deploy.
## Ordenes de cambio BIM gobernadas - 2026-07-16

- `BIM-TASK-0158` completa F05 con PCO versionadas y workflow potencial,
  enviado, aprobado, rechazado o cancelado dentro del tenant.
- La aprobacion modifica el compromiso del contrato BIM bajo bloqueo
  transaccional, sustituye el SOV aprobado y protege pagos ya reservados.
- Backend, API y herramienta `Cambios` viven solo en BIM; no escriben contratos,
  Presupuestos, Cronogramas, facturacion o contabilidad clasicos.
- PostgreSQL reversible, build, 25 smokes BIM, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- F05 queda completa. Paridad: `72,50%`, con 39 completas, 9 parciales y 12
  ausentes. Programa: 32/61, 52,46% realizado y 47,54% pendiente. Sin deploy.
## Ledger de coste real desde Campo BIM - 2026-07-16

- `BIM-TASK-0159` completa F06 con un asiento incremental e inmutable por cada
  parte BIM y una sincronizacion idempotente para datos historicos.
- Los costes acumulados deben ser no decrecientes y conservar la moneda por
  actividad; las excepciones validadas no se suman automaticamente.
- Backend, API y herramienta `Reales` viven solo en BIM; no escriben nomina,
  inventario, Presupuestos, contratos o contabilidad clasicos.
- PostgreSQL reversible, build, 26 smokes BIM, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- F06 queda completa. Paridad: `73,33%`, con 40 completas, 8 parciales y 12
  ausentes. Programa: 33/61, 54,10% realizado y 45,90% pendiente. Sin deploy.
## Forecast de coste final BIM - 2026-07-16

- `BIM-TASK-0160` completa F07 con revisiones monetarias multi-moneda,
  trazables y aprobables sin mutar sus fuentes.
- PostgreSQL reversible, build, 27 smokes BIM, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- Paridad: `74,17%`, 41 completas, 7 parciales y 12 ausentes. Programa: 34/61,
  55,74% realizado y 44,26% pendiente. Sin deploy.
## Aceptacion de modelo as-built BIM - 2026-07-16

- `BIM-TASK-0161` completa G01 mediante solicitudes tenant-aware vinculadas a
  versiones `ready`, reporte IFC no fallido y checksum congelado.
- La decision revalida el checksum, usa lock optimista y sustituye de forma
  auditable la aceptacion vigente anterior sin mutar el modelo fuente.
- El workspace V2 incorpora el area independiente `Entrega`; no se modifica
  navegacion, datos ni contratos de GiProy Clasico.
- PostgreSQL reversible, 3 tests focales, build, 28 smokes BIM, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- Paridad: `75,00%`, 42 completas, 6 parciales y 12 ausentes. Programa: 35/61,
  57,38% realizado y 42,62% pendiente. Sin deploy.
## Registro de commissioning BIM - 2026-07-16

- `BIM-TASK-0162` inicia G02 con sistemas y activos tenant-aware vinculados a
  elementos y versiones BIM listas mediante claves restrictivas.
- Cada activo conserva tag, GlobalId, sistema IFC de origen y datos técnicos;
  no se duplica geometria ni se escribe inventario o mantenimiento clasicos.
- Entrega incorpora `Commissioning`; PostgreSQL reversible, 3 tests focales,
  build, 29 smokes BIM, Playwright 1920x900/2560x1300, anti-BIM y baseline pasan.
- G02 queda parcial. Paridad: `75,83%`, 42 completas, 7 parciales y 11
  ausentes. Programa: 36/61, 59,02% realizado y 40,98% pendiente. Sin deploy.

## Aceptacion tecnica de commissioning BIM - 2026-07-16

- `BIM-TASK-0163` completa G02 con protocolos y resultados JSON vinculados a
  activos, decision auditable y aceptacion jerarquica activo/sistema.
- `de2047a1b2c3` agrega locks y timestamps de decision sin alterar tablas ni
  contratos clasicos; las referencias a activos son restrictivas.
- Una prueba fallida, pendiente o rechazada bloquea el activo; un activo no
  aceptado bloquea el sistema. Los reintentos conservan el historial y solo el
  ultimo intento gobernado de cada protocolo determina la aceptacion.
- PostgreSQL reversible, 6 tests, build, 29 smokes, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- Paridad: `76,67%`, 43 completas, 6 parciales y 11 ausentes. Programa: 37/61,
  60,66% realizado y 39,34% pendiente. Sin deploy.

## Cierre gobernado de punch list BIM - 2026-07-16

- `BIM-TASK-0164` completa G03 con una solicitud tenant-aware ligada al
  as-built aceptado y al ledger real de punch items BIM.
- El snapshot conserva IDs, prioridad, cierre, responsable y huella SHA-256;
  cualquier pendiente o mutación posterior bloquea la decisión.
- `de2048a1b2c3` y `Cierre punch` permanecen aislados de incidencias y datos
  clásicos.
- PostgreSQL reversible, 3 tests, build, 30 smokes, Playwright
  1920x900/2560x1300, anti-BIM y baseline pasan.
- Paridad: `77,50%`, 44 completas, 5 parciales y 11 ausentes. Programa: 38/61,
  62,30% realizado y 37,70% pendiente. Sin deploy.

## Ensamblado gobernado del dossier digital BIM - 2026-07-16

- `BIM-TASK-0165` inicia G04 mediante un manifiesto canónico con referencias y
  checksums de as-built, punch, commissioning y revisiones CDE vigentes.
- `bim_handover_dossiers` conserva revisión, inventarios de IDs, métricas,
  huella SHA-256, lock y auditoría dentro del tenant/proyecto.
- La herramienta `Dossier digital` vive solo en Entrega BIM V2 y no escribe ni
  consulta documentos clásicos.
- G04 queda parcial. Paridad: `78,33%`, 44 completas, 6 parciales y 10
  ausentes. Programa: 39/61, 63,93% realizado y 36,07% pendiente. Sin deploy.

## Aceptación gobernada del dossier digital BIM - 2026-07-16

- `BIM-TASK-0166` completa G04 reensamblando el manifiesto bajo locks y
  rechazando cualquier diferencia frente a la huella presentada.
- La decisión usa lock optimista, auditoría y un índice parcial PostgreSQL que
  permite un único dossier aceptado por tenant/proyecto.
- La interacción permanece en `Dossier digital`; no se modifica GiProy
  Clásico con BIM apagado.
- Paridad: `79,17%`, 45 completas, 5 parciales y 10 ausentes. Programa: 40/61,
  65,57% realizado y 34,43% pendiente. Sin deploy.

## Baseline de transición BIM a Operaciones - 2026-07-16

- `BIM-TASK-0167` inicia G05 desde el dossier aceptado y congela organización,
  responsable, fecha, criterios y baseline SHA-256 de activos/sistemas.
- `bim_operations_transitions` es tenant-aware, versionada y restrictiva con
  su dossier fuente; no crea integración prematura con módulos clásicos.
- Entrega incorpora `Transición O&M` bajo la misma flag BIM.
- Paridad: `80,00%`, 45 completas, 6 parciales y 9 ausentes. Programa: 41/61,
  67,21% realizado y 32,79% pendiente. Sin deploy.

## Activación gobernada de transición BIM a Operaciones - 2026-07-17

- `BIM-TASK-0168` completa G05 revalidando dossier, baseline y SHA-256 bajo
  locks antes de activar la transferencia al gemelo operativo.
- Un índice parcial permite una única transición aceptada vigente y conserva
  el historial anterior como `superseded`.
- La decisión permanece aislada de mantenimiento, inventario e IoT clásicos.
- Paridad: `80,83%`, 46 completas, 5 parciales y 9 ausentes. Programa: 42/61,
  68,85% realizado y 31,15% pendiente. Sin deploy.

## Matriz operacional de alertas BIM - 2026-07-17

- `BIM-TASK-0169` completa H04 con reconciliación idempotente de RFI,
  submittals y revisiones CDE.
- Los niveles próximo, vencido y escalado se deduplican por fuente,
  destinatario, vencimiento y nivel; las alertas obsoletas se resuelven.
- El acuse es tenant-aware y exclusivo del destinatario, sin usar tablas o
  canales clásicos.
- Paridad: `81,67%`, 47 completas, 4 parciales y 9 ausentes. Programa: 43/61,
  70,49% realizado y 29,51% pendiente. Sin deploy.

## Ensayo DR del dominio BIM - 2026-07-17

- `BIM-TASK-0170` completa H07 con dump/restore PostgreSQL limitado a `bim_*`.
- El validador compara conteos y SHA-256 de 79 tablas y exige fingerprint
  clásico inalterado.
- El ensayo usa dos bases `_test`, artefacto temporal y limpieza automática;
  no toca backup clásico ni infraestructura productiva.
- Paridad: `82,50%`, 48 completas, 3 parciales y 9 ausentes. Programa: 44/61,
  72,13% realizado y 27,87% pendiente. Sin deploy.

## Servicios cartograficos BIM - 2026-07-20

- `BIM-TASK-0171` completa H05 con catalogos XYZ/WMS revisados, tenant-aware y
  ligados a la revision independiente de cada proyecto.
- Leaflet consume capas base y overlays reales con visibilidad y opacidad; el
  contrato bloquea URLs no HTTP(S), XYZ incompleto y WMS sin nombre de capa.
- `de2054a1b2c3` es aditiva y reversible; no requiere PostGIS ni toca mapas o
  contratos clasicos.
- Paridad: `84,17%`, 49 completas, 3 parciales y 8 ausentes. Programa: 45/61,
  73,77% realizado y 26,23% pendiente. Sin deploy.

## Intercambio gobernado BIM hacia ERP - 2026-07-20

- `BIM-TASK-0172` completa H06 con paquetes pull versionados de avance y horas
  BIM, fecha de corte, checksum, bloqueo optimista y publicacion gobernada.
- El contenido publicado se descarga desde Produccion y solo consolida fuentes
  `bim_*`; no escribe Cronogramas, APUs, personal ni contabilidad clasicos.
- `de2055a1b2c3` es aditiva, tenant-aware y reversible; la UX permanece dentro
  del workspace BIM y sus puertas de licencia/allowlist.
- Paridad: `85,83%`, 50 completas, 3 parciales y 7 ausentes. Programa: 46/61,
  75,41% realizado y 24,59% pendiente. Sin deploy.

## Gateway de integracion empresarial BIM - 2026-07-20

- `BIM-TASK-0173` completa B06 conectando la API ERP H06 con suscripciones HTTPS
  HMAC-SHA256 y un outbox tenant-aware, idempotente y recuperable.
- Los secretos se muestran una vez y permanecen cifrados; DNS y direcciones se
  revalidan en cada entrega para bloquear SSRF y redirects.
- La UX vive en Produccion > Integraciones bajo las puertas BIM existentes; el
  evento solo nace de fuentes `bim_*` y no escribe el dominio clasico.
- Paridad: `87,50%`, 51 completas, 3 parciales y 6 ausentes. Programa: 47/61,
  77,05% realizado y 22,95% pendiente. Sin deploy.

## Colaboracion CDE multiusuario incremental - 2026-07-20

- `BIM-TASK-0174` agrega presencia activa por sesion y feed incremental por
  cursor, ambos aislados por empresa/proyecto.
- Las revisiones CDE emiten eventos de creacion, comentario y transicion en la
  misma transaccion; heartbeat repetido sin cambio no genera ruido.
- Coordinacion incorpora `Actividad`, con polling recuperable, expiracion de
  presencia y salida limpia, solo bajo las puertas BIM existentes.
- H03 pasa a parcial: falta certificar concurrencia y reconexion en servidor.
- Build, 35 smokes BIM, PostgreSQL reversible, DR de 85 tablas, anti-BIM y
  baseline enterprise pasan.
- Paridad: `88,33%`, 51 completas, 4 parciales y 5 ausentes. Programa: 48/61,
  78,69% realizado y 21,31% pendiente. Sin deploy.

## Resiliencia concurrente de colaboracion CDE - 2026-07-20

- `BIM-TASK-0175` endurece el heartbeat ante colisiones de unicidad mediante un
  savepoint transaccional y recuperacion de la presencia ya creada.
- Un validador PostgreSQL dedicado ejecuta 12 heartbeats concurrentes, dos
  sesiones, expiracion, reconexion y lectura incremental por cursor.
- El ensayo produce una sola presencia compartida y no duplica eventos de
  union. H03 conserva estado parcial hasta repetirlo en el servidor con red real.
- Paridad: `88,33%`, 51 completas, 4 parciales y 5 ausentes. Programa: 49/61,
  80,33% realizado y 19,67% pendiente. Sin deploy.

## Observabilidad operativa de colaboracion CDE - 2026-07-20

- `BIM-TASK-0176` amplía las metricas administrativas BIM con sesiones CDE
  totales, activas y expiradas, volumen/tipos de eventos, cursor y lag.
- Las agregaciones permanecen tenant-aware y no exponen usuarios, contexto,
  payload, resumen ni contenido documental.
- H03 conserva estado parcial hasta recoger la telemetria en servidor bajo red
  y usuarios reales.
- Paridad: `88,33%`, 51 completas, 4 parciales y 5 ausentes. Programa: 50/61,
  81,97% realizado y 18,03% pendiente. Sin deploy.

## Recuperacion de red y aislamiento de scope CDE - 2026-07-20

- `BIM-TASK-0177` recupera heartbeat/feed al volver online o visible y bloquea
  polls solapados del mismo proyecto.
- Empresa/proyecto reinician cursor y estado; respuestas tardias de otro scope
  se descartan para impedir mezcla visual entre proyectos.
- Build, smoke focal desktop/alta resolucion y 35 smokes BIM pasan; la captura
  no presenta overflow ni solapamientos.
- Paridad: `88,33%`, 51 completas, 4 parciales y 5 ausentes. Programa: 51/61,
  83,61% realizado y 16,39% pendiente. Sin deploy.

## Probe remoto de colaboracion CDE - 2026-07-20

- `BIM-TASK-0178` prepara un ensayo remoto con dos tokens efimeros, presencia
  concurrente, cursor, expiracion, reconexion, metricas y cleanup garantizado.
- La herramienta restringe empresas a `1,3`, no imprime credenciales y fue
  validada contra un servidor CDE simulado con reloj controlado.
- H03 permanece parcial: falta desplegar la ola y obtener `BIM_CDE_REMOTE_OK`
  con dos usuarios autorizados en beta.
- Paridad: `88,33%`, 51 completas, 4 parciales y 5 ausentes. Programa: 52/61,
  85,25% realizado y 14,75% pendiente. Sin deploy.

## Escala del feed colaborativo CDE - 2026-07-20

- `BIM-TASK-0179` certifica el feed incremental con 100.000 eventos en
  PostgreSQL dedicado, 60 lecturas y pagina acotada a 100.
- `EXPLAIN ANALYZE` confirma el indice compuesto; un evento intercalado de otra
  empresa demuestra aislamiento tenant/proyecto.
- p95 local: `1,939 ms` frente al umbral conservador de `150 ms`; falta repetir
  latencia y concurrencia sobre la red beta para completar H03.
- Paridad: `88,33%`, 51 completas, 4 parciales y 5 ausentes. Programa: 53/61,
  86,89% realizado y 13,11% pendiente. Sin deploy.

## Drenaje resiliente del feed CDE - 2026-07-20

- `BIM-TASK-0180` agrega `has_more` aditivo y drenaje cliente de hasta cinco
  paginas por ciclo, con cursor monotono y proteccion contra loops.
- Una rafaga focal de 205 eventos se consume en paginas `100/100/5`.
- El harness pasa en 1920x900 y 2560x1300 sin overflow, errores de consola ni
  mezcla de scope; falta evidencia desplegada para completar H03.
- Paridad: `88,33%`, 51 completas, 4 parciales y 5 ausentes. Programa: 54/61,
  88,52% realizado y 11,48% pendiente. Sin deploy.

## Despliegue beta y certificacion remota CDE - 2026-07-20

- `BIM-TASK-0181` despliega de forma reversible la ola `0173` a `0180` en la
  beta autorizada, manteniendo feature flag, licencia y allowlist `1,3`.
- Alembic queda en `de2057a1b2c3 (head)` y el indice del feed CDE se verifica
  sobre `(empresa_id, proyecto_id, id)`.
- El probe HTTPS con dos sesiones certifica concurrencia, cursor, expiracion,
  reconexion y telemetria: `initial=2`, `expired=1`, `reconnected=2`,
  `delta=1`, `metrics_active=2`.
- El cleanup deja cero usuarios, presencias y eventos temporales. H03 pasa a
  completa; Gate E humano y Gate K permanecen abiertos.
- Paridad: `89,17%`, 52 completas, 3 parciales y 5 ausentes. Programa: 55/61,
  90,16% realizado y 9,84% pendiente.

## Rafaga CDE certificada sobre HTTPS beta - 2026-07-20

- `BIM-TASK-0182` emite 205 cambios CDE autenticados contra beta y drena el
  feed desplegado en paginas `100/100/5` con cursor monotono.
- La latencia p95 de heartbeat es `295,96 ms`, por debajo del umbral
  conservador de `1000 ms`.
- El cleanup deja cero usuarios, presencias y eventos temporales y la beta
  permanece HTTP 200. H03 continua completa; Gate E y Gate K siguen abiertos.
- Paridad: `89,17%`, 52 completas, 3 parciales y 5 ausentes. Programa: 56/61,
  91,80% realizado y 8,20% pendiente.

## Ensayo de rollback beta desde backup pre-ola - 2026-07-20

- `BIM-TASK-0183` restaura el dump predeploy completo en una base temporal con
  `ON_ERROR_STOP=1`, sin desconectar ni modificar la beta activa.
- La huella de esquema clasico coincide exactamente (`7cb85c...`) y la
  diferencia BIM es la esperada: 81 tablas/de2055 frente a 85/de2057.
- La base temporal queda eliminada, beta continua HTTP 200 y H07 incorpora
  evidencia desplegada de rollback para esta ola.
- Paridad: `89,17%`, 52 completas, 3 parciales y 5 ausentes. Programa: 57/61,
  93,44% realizado y 6,56% pendiente.

## Expediente verificable de conformidad internacional - 2026-07-20

- `BIM-TASK-0184` agrega un contrato machine-readable para ISO 19650-1 a -6,
  IFC, IDS 1.0, BCF 2.1 y certificacion formal.
- Ocho controles tienen evidencia interna; IFC conserva brecha IFC4.3/oficial
  y la certificacion permanece externa. El validador impide cerrar esos limites
  o Gate K por documentacion interna.
- Las 40 pruebas fuente y 3 pruebas del validador pasan. H08 sigue parcial y
  Gate E humano permanece abierto.
- Paridad: `89,17%`, 52 completas, 3 parciales y 5 ausentes. Programa: 58/61,
  95,08% realizado y 4,92% pendiente.

## Protocolo operativo y ledger Gate E - 2026-07-20

- `BIM-TASK-0185` formaliza dos participantes distintos, diez jornadas con
  evidencia diaria, dos revisiones reales, ocho flujos y decision humana.
- El ledger permanece `authorized_not_started`; `--require-approved` falla de
  forma deliberada y las pruebas rechazan aprobaciones incompletas.
- Beta confirma allowlist `1,3` y licencia Enterprise activa en ambas empresas.
  Esto no inicia el piloto ni cierra Gate E.
- Paridad: `89,17%`, 52 completas, 3 parciales y 5 ausentes. Programa: 59/61,
  96,72% realizado y 3,28% pendiente.

## Agregador verificable Gate K - 2026-07-20

- `BIM-TASK-0186` agrega paridad, Gate E, conformidad, checks tecnicos,
  certificaciones y tres firmas humanas en una sola decision reproducible.
- El estado actual es `blocked` con seis bloqueos; `--require-approved` falla.
  Fixtures completos prueban la ruta futura y fixtures falsos no la eluden.
- El gate no modifica allowlist, licencia, DB ni despliegue. Queda un unico
  slice humano/externo antes de cualquier rollout general.
- Paridad: `89,17%`, 52 completas, 3 parciales y 5 ausentes. Programa: 60/61,
  98,36% realizado y 1,64% pendiente.

## Soporte interno IFC4.3 con corpus oficial - 2026-07-20

- `BIM-TASK-0187` incorpora `IFC4X3_ADD2` al baseline interno junto a IFC2X3
  e IFC4, sin reclamar certificacion.
- El corpus PCERT oficial buildingSMART bajo CC BY 4.0 queda fijado por
  checksum y valida 383 entidades, un storey y 12 elementos.
- El job completo persiste la version y el reporte `schema_status=supported`;
  schemas futuros desconocidos conservan warning.
- `IfcImporter` procesa los seis datasets y convierte el IFC4.3 oficial en
  17.320 bytes Fragments, manteniendo IFC2X3 e IFC4 verdes.
- Backend beta `fc32aa...` healthy; probe remoto confirma IFC4X3_ADD2 soportado,
  home 200, CDE anonimo 401 y allowlist `1,3` intacta.
- Implementacion tecnica autorizada: 61/61, 100%. Liberacion general: 60/61,
  98,36%; Gate E, certificaciones y Gate K siguen pendientes.
