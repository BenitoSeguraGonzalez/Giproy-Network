# Índice Único BIM - GiProy Network

## Propósito

Este documento es el punto de entrada único para todo el programa BIM de GiProy Network. Su objetivo es concentrar, en una sola superficie, la arquitectura, la estrategia, las TASKs, los prompts y el tooling necesarios para ejecutar la implantación BIM sin tener que buscar documentación dispersa.

Este índice debe usarse siempre como primera referencia al retomar el programa BIM.

---

## 1. Documentos maestros de arquitectura

- [Plan Maestro BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_MASTER_PLAN.md)
- [Estado Real del Codigo BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_CODE_STATE.md)
- [Mapa Conceptual BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_CONCEPT_MAP.md)
- [Mapa de Inserción BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_INSERTION_MAP.md)
- [Plan de Validación BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_VALIDATION_PLAN.md)
- [Roadmap de Ejecución BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_EXECUTION_ROADMAP.md)
- [Plan de Adecuacion Final BIM y decisiones confirmadas](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_FINAL_ADEQUACY_PLAN.md)
- [Plan de Paridad Funcional BIM 4D tipo SYNCHRO](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_4D_SYNCHRO_INTEGRATION_PLAN.md)
- [Plan de Paridad Avanzada del Nucleo BIM 4D](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_ADVANCED_4D_PARITY_PLAN.md)
- [Estrategia de Implementación Paralela BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_PARALLEL_IMPLEMENTATION_STRATEGY.md)
- [Resumen Ejecutivo para Junta de Revisión y Aprobación](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_EXECUTIVE_SUMMARY_FOR_REVIEW_BOARD.md)

---

## 2. Gobierno por TASKs BIM paralelas

### Regla vigente

El carril BIM usa estructura TASK propia e independiente en
`docs/tasks/bim`. Las TASKs historicas `TASK-0545` a `TASK-0559` quedan como
planificacion legacy y no deben reutilizarse para cerrar trabajo BIM nuevo.

### Indice operativo

- [Indice TASK BIM paralelo](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM_TASK_INDEX.md)
- [README de gobierno TASK BIM](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/README.md)

### TASK madre de control BIM

- [BIM-TASK-0000](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0000.md)

### Subtasks del programa BIM

- [BIM-TASK-0001](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0001.md) - dominio BIM y arquitectura
- [BIM-TASK-0002](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0002.md) - backend y base de datos BIM
- [BIM-TASK-0003](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0003.md) - shell frontend BIM
- [BIM-TASK-0004](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0004.md) - pipeline de importacion y versionado
- [BIM-TASK-0005](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0005.md) - vinculos BIM con negocio
- [BIM-TASK-0006](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0006.md) - vistas, estado y navegacion BIM
- [BIM-TASK-0007](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0007.md) - seguridad, permisos y operacion
- [BIM-TASK-0008](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0008.md) - validacion, simulacion y smoke tests
- [BIM-TASK-0009](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0009.md) - rollout y liberacion
- [BIM-TASK-0010](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0010.md) - paridad visual y funcional BIM
- [BIM-TASK-0011](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0011.md) - feature flags y activacion progresiva
- [BIM-TASK-0012](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0012.md) - prompt maestro de transicion paralela
- [BIM-TASK-0013](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0013.md) - prompt ejecutivo de activacion
- [BIM-TASK-0014](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0014.md) - tooling de modos, runtime y TASK automatica
- [BIM-TASK-0015](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0015.md) - alineacion documental del estado real BIM
- [BIM-TASK-0016](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0016.md) - migracion Alembic del dominio BIM principal
- [BIM-TASK-0017](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0017.md) - gobierno runtime de esquema BIM y tests focales
- [BIM-TASK-0018](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0018.md) - contratos API BIM bajo flags y tenant
- [BIM-TASK-0019](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0019.md) - importacion JSON BIM y workspace activo
- [BIM-TASK-0020](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0020.md) - links BIM latentes con EDT
- [BIM-TASK-0021](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0021.md) - links BIM latentes con APUs y Presupuesto
- [BIM-TASK-0022](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0022.md) - smoke frontend BIM positivo aislado
- [BIM-TASK-0023](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0023.md) - smoke visual DOM del viewer BIM aislado
- [BIM-TASK-0024](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0024.md) - validacion controlada de migracion Alembic BIM
- [BIM-TASK-0025](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0025.md) - importacion JSON batch transaccional
- [BIM-TASK-0026](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0026.md) - guarda UX de validacion previa a importacion BIM
- [BIM-TASK-0027](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0027.md) - permisos de duplicacion de vistas BIM compartidas
- [BIM-TASK-0028](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0028.md) - guarda backend de validacion previa a importacion BIM
- [BIM-TASK-0029](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0029.md) - cobertura de workspace context BIM por usuario
- [BIM-TASK-0030](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0030.md) - restriccion de scopes publicos en vistas BIM
- [BIM-TASK-0031](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0031.md) - registro de manifiesto IFC BIM versionado
- [BIM-TASK-0032](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0032.md) - cliente frontend BIM para manifiesto IFC
- [BIM-TASK-0033](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0033.md) - bloqueo de etiquetas IFC duplicadas
- [BIM-TASK-0034](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0034.md) - bloqueo de etiquetas JSON BIM duplicadas
- [BIM-TASK-0035](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0035.md) - IFC/3D como fundamento de cierre BIM
- [BIM-TASK-0036](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0036.md) - parsing IFC semantico inicial local
- [BIM-TASK-0037](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0037.md) - storage local IFC controlado
- [BIM-TASK-0038](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0038.md) - parsing IFC profundo inicial
- [BIM-TASK-0039](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0039.md) - artefacto optimizado para viewer BIM
- [BIM-TASK-0040](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0040.md) - consumo de artefacto viewer en harness 3D
- [BIM-TASK-0041](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0041.md) - smoke local de fragments binarios
- [BIM-TASK-0042](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0042.md) - carga de fragments con FragmentsModels en harness
- [BIM-TASK-0043](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0043.md) - dataset IFC geometrico representativo local
- [BIM-TASK-0044](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0044.md) - quantities, materiales y sistemas IFC
- [BIM-TASK-0046](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0046.md) - simulacion IFC/fragments de volumen local
- [BIM-TASK-0047](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0047.md) - consulta ItemData desde FragmentsModels
- [BIM-TASK-0048](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0048.md) - inspector y controles frontend de fragments consultables
- [BIM-TASK-0049](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0049.md) - filtro operativo IFC en canvas BIM
- [BIM-TASK-0050](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0050.md) - seleccion 3D con raycasting en viewer BIM
- [BIM-TASK-0051](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0051.md) - navegacion 3D profesional con OrbitControls
- [BIM-TASK-0052](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0052.md) - foco 3D de elemento seleccionado
- [BIM-TASK-0053](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0053.md) - hover 3D con raycasting trazable
- [BIM-TASK-0054](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0054.md) - inspector 3D contextual del viewer BIM
- [BIM-TASK-0055](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0055.md) - filtro IFC 3D operativo en viewer BIM
- [BIM-TASK-0056](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0056.md) - visibilidad IFC 3D operativa en viewer BIM
- [BIM-TASK-0057](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0057.md) - inspector ItemData profundo en fragments
- [BIM-TASK-0058](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0058.md) - estructura espacial real en harness fragments
- [BIM-TASK-0059](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0059.md) - geometria y medicion fragments en harness BIM
- [BIM-TASK-0060](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0060.md) - medicion por categoria IFC en fragments
- [BIM-TASK-0061](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0061.md) - subset fragments por categoria IFC
- [BIM-TASK-0062](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0062.md) - trazabilidad GUID bidireccional en fragments
- [BIM-TASK-0063](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0063.md) - ItemData batch por categoria IFC en fragments
- [BIM-TASK-0064](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0064.md) - raycasting nativo fragments en harness BIM
- [BIM-TASK-0065](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0065.md) - seleccion ItemData nativa fragments desde raycasting
- [BIM-TASK-0066](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0066.md) - visibilidad de seleccion nativa fragments
- [BIM-TASK-0067](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0067.md) - visibilidad por categoria en canvas fragments nativo
- [BIM-TASK-0068](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0068.md) - filtro de categoria en canvas fragments nativo
- [BIM-TASK-0069](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0069.md) - seleccion por puntero en canvas fragments nativo
- [BIM-TASK-0070](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0070.md) - benchmark, plan y baseline de decisiones BIM confirmadas
- [BIM-TASK-0071](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0071.md) - corpus IFC real licenciado y reproducible
- [BIM-TASK-0072](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0072.md) - job IFC observable, persistente e idempotente
- [BIM-TASK-0073](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0073.md) - conformidad IFC y reporte de calidad base
- [BIM-TASK-0074](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0074.md) - lifecycle versionado de artifacts y cierre Gate A
- [BIM-TASK-0075](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0075.md) - viewport Fragments de producto
- [BIM-TASK-0076](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0076.md) - shell UX profesional
- [BIM-TASK-0077](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0077.md) - explorer BIM sincronizado
- [BIM-TASK-0078](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0078.md) - herramientas de revision Fragments
- [BIM-TASK-0079](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0079.md) - vistas reproducibles y Gate B
- [BIM-TASK-0080](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0080.md) - comparacion de versiones
- [BIM-TASK-0081](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0081.md) - federacion por disciplina
- [BIM-TASK-0082](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0082.md) - IDS y reglas de informacion
- [BIM-TASK-0083](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0083.md) - dominio de incidencias BCF-compatible
- [BIM-TASK-0084](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0084.md) - UX operativa de incidencias
- [BIM-TASK-0085](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0085.md) - cantidades y propuestas 5D

---

## 3. Prompts operativos

### Prompt maestro de transición

- [Prompt Transición Paralela GiProy BIM](/e:/Repositorios/GiProy%20Network/docs/Prompt%20Transicion%20Paralela%20GiProy%20BIM.txt)

### Prompt ejecutivo de activación

- [Prompt Ejecutivo Activación BIM](/e:/Repositorios/GiProy%20Network/docs/Prompt%20Ejecutivo%20Activacion%20BIM.txt)

### Plantillas por modo

- [Prompt Modo Clásico](/e:/Repositorios/GiProy%20Network/docs/plantillas/Prompt%20Modo%20Clasico.txt)
- [Prompt Modo BIM](/e:/Repositorios/GiProy%20Network/docs/plantillas/Prompt%20Modo%20BIM.txt)
- [Prompt Modo Integración Controlada](/e:/Repositorios/GiProy%20Network/docs/plantillas/Prompt%20Modo%20Integracion%20Controlada.txt)

---

## 4. Tooling de continuidad

- [Lanzador Python de modos](/e:/Repositorios/GiProy%20Network/tools/ai_tools/mode_prompt_launcher.py)
- [Lanzador BAT interno](/e:/Repositorios/GiProy%20Network/tools/ai_tools/mode_prompt_launcher.bat)
- [Lanzador BAT raíz](/e:/Repositorios/GiProy%20Network/mode_prompt_launcher.bat)
- [Estado runtime](/e:/Repositorios/GiProy%20Network/docs/runtime/WORK_MODE_STATE.json)
- [README de runtime](/e:/Repositorios/GiProy%20Network/docs/runtime/README.md)

---

## 5. Regla de uso recomendada

Al retomar el programa BIM, el orden correcto es:

1. leer este índice
2. revisar `BIM_MASTER_PLAN`
3. revisar `BIM_PARALLEL_IMPLEMENTATION_STRATEGY`
4. activar el modo de sesión correspondiente con el lanzador
5. trabajar siempre sobre la TASK BIM activa en `docs/tasks/bim` o sobre la TASK BIM del slice aprobado

---

## 6. Estado actual del programa BIM

### Situación actual

- planificacion arquitectonica cerrada
- baseline de 29 decisiones de producto y arquitectura confirmado en
  `BIM_FINAL_ADEQUACY_PLAN.md`; no representa implementacion funcional
- corpus real buildingSMART cubierto con cinco IFC CC BY 4.0, IFC4/IFC2x3,
  arquitectura/estructura/MEP, manifiesto, parser y conversion Fragments
- importacion IFC observable cubierta con job persistente por tenant/proyecto,
  API `202`, progreso, cancelacion, retry, errores y UX BIM controlada
- conformidad IFC base cubierta por version con dominios STEP/schema/semantica,
  checksum, findings vinculables e inspector BIM sin claim de certificacion
- lifecycle de source IFC, viewer JSON/indices y Fragments cubierto con
  contratos, generaciones, checksum, integridad, incompatibilidad y rollback
- Gate A cerrado con datasets reales small/medium/large procesados por jobs
- viewport Fragments de producto cubierto con artifact registrado, WebGL no
  vacio, resize, seleccion GUID, recovery y disposal desktop/tablet/movil
- shell UX profesional cubierta con contexto empresa/proyecto/modelo/version,
  toolbar funcional, modos Fragments/2D y explorer/inspector adaptables
- explorer BIM cubierto con arbol/tabla, agrupaciones, busqueda servidor sobre
  propiedades y paginacion real validada con mas de mil elementos
- herramientas Fragments de revision cubiertas para ocultar, aislar, ghost,
  clipping, medicion, proyeccion y reset con estado reversible
- vistas reproducibles cubiertas bajo contrato v2 para camara, seleccion,
  visibilidad, colores, filtros, clipping, medidas y compatibilidad de version
- Gate B cerrado localmente con corpus real S/M/L y GiProy Clasico apagado
- comparacion de versiones cubierta por GUID para agregados, eliminados,
  geometria/transform y propiedades, con fallback semantico declarado
- incidencias BCF 2.1, cantidades 5D sin escritura clasica, capacidades BIM,
  observabilidad sanitizada y gobierno de rollout cubiertos localmente
- rendimiento reproducible certificado en Chrome/Edge desktop/tablet con 60
  FPS, first render menor a 0.9 s, memoria estable y disposal por tres ciclos
- Gate D queda cerrado localmente mediante `TASK-2022/2023/2024/2025`, limitado
  a Proyectos y protegido por flags, con foco EDT/Presupuesto y retorno APU;
  Gate E tiene preparación técnica completa, pero el piloto real sigue pendiente
- fundacion 4D latente cubierta con snapshots de actividad, propuestas N:M,
  capacidades y panel contextual; no existe escritura ni dependencia clasica
- simulacion 4D cubierta con progreso inmutable, estados temporales, timeline
  reproducible y perfiles Fragments activables sin interferir con revision
- plan-real cubierto con baseline/dependencias inmutables, desviacion por corte
  y enfoque de GUIDs dentro del viewer BIM
- frentes, componentes construibles logicos y what-if cubiertos sin crear
  geometria ni escribir cronograma fuente
- propuestas cantidad-rendimiento-cuadrilla cubiertas con duracion/recurso
  derivados y decisiones solo BIM
- partes de campo cubiertos con avance, cantidades, horas, diario y evidencia
  binaria persistida en PostgreSQL, sin escritura clasica
- valor ganado cubierto con BAC, PV, EV, AC, SPI y CPI reproducibles
- SYNCHRO se usa solo como benchmark funcional; no existe ni se autoriza una
  conexion Bentley, iTwin/iModel, OAuth o dependencia externa
- estrategia paralela definida
- tooling de continuidad operativo
- incubacion funcional parcial ya presente en codigo
- UX BIM de Proyectos clasico apagada explicitamente
- viewer tecnico/demostrativo 2D existente y fundacion 3D local con Three.js en perimetro BIM aislado; IFC/3D queda como requisito central del cierre BIM
- migraciones Alembic BIM creadas y validadas en entorno controlado, incluida `de2002a1b2c3` para jobs IFC; servicios BIM ya no crean tablas runtime; importacion IFC observable persistente, idempotente, cancelable y reintentable cubierta con versiones fallidas no publicadas; contratos API iniciales bajo flags/tenant cubiertos; importacion JSON BIM positiva, batch transaccional, guarda UX, guarda backend de validacion previa y bloqueo de labels duplicados cubiertos; manifiesto IFC versionado cubierto en backend y cliente frontend de dominio, con bloqueo de labels duplicados; parsing IFC textual inicial cubierto hacia storeys/elementos BIM persistidos con simulaciones sinteticas S1/S2/S3 y corpus real buildingSMART; storage local IFC controlado cubierto con checksum y `artifact_path`; parsing IFC profundo inicial cubierto para relaciones espaciales, property sets, quantities, materiales y sistemas; artefacto viewer optimizado JSON cubierto con indices por storey/clase/propiedad y consumo verificado en harness 3D; dependencias `three`, `web-ifc`, `@thatopen/components`, `@thatopen/components-front` y `@thatopen/fragments` instaladas; smoke local de fragments binarios real con `IfcImporter`; carga fragments con `FragmentsModels` validada en harness con localIds/GlobalIds, `ItemData`, categorias IFC, inspector ItemData profundo, estructura espacial real, geometria/medicion fragments, medicion por categoria IFC, subset fragments por categoria, trazabilidad GUID bidireccional, ItemData batch por categoria, raycasting nativo fragments con `model.raycast`, seleccion ItemData nativa desde hit real, seleccion por puntero en canvas nativo, visibilidad operativa del elemento seleccionado, visibilidad por categoria y filtro de categoria en canvas fragments nativo y controles reales de visibilidad; canvas BIM 2D con filtro operativo por clase IFC derivado de elementos reales; viewer BIM 3D con filtro/visibilidad IFC 3D, seleccion y hover por raycasting local, hit trazable, navegacion OrbitControls, foco 3D del elemento seleccionado e inspector 3D contextual; simulacion IFC/fragments de volumen local cubierta; viewer 3D aislado y smoke visual DOM ampliado; todavia pendiente viewer 3D maduro sobre fragments; permisos de vistas compartidas endurecidos; scopes publicos de view states restringidos; workspace context cubierto por usuario y flag; links EDT/APUs/Presupuesto latentes cubiertos; pendiente aplicacion en DB real autorizada

### Próximo paso natural

El plan de paridad funcional BIM 4D `0091-0112` está cerrado al `100%`. La
navegacion clasica 0086 sigue requiriendo autorizacion separada.
La extensión avanzada `0113-0117` está cerrada al `100%` dentro de su alcance:
particiones, sólidos paramétricos, equipos, playback, conflictos, seguridad,
50k actividades, animación reproducible y federación Fragments x5. No implica
paridad total con SYNCHRO Perform/Control/Field ni CSG IFC exacto.

`BIM-TASK-0118` cierra el gate técnico inicial de CSG exacto sobre una malla
manifold controlada: perforación por sustracción, particiones por intersección,
conservación volumétrica y render WebGL responsive. Esto elimina el límite de
“solo bounding box” para el motor geométrico aislado, pero no declara aún
materialización PostgreSQL ni compatibilidad universal con cualquier IFC.

`BIM-TASK-0119` materializa ese resultado mediante el contrato
`giproy_bim_4d_csg_artifact_v1` y la migración aditiva `de2022a1b2c3`. El
servidor vuelve a calcular volumen e integridad de triángulos antes de almacenar
el JSON geométrico y su SHA-256. El alcance continúa aislado: falta certificar
la misma ruta con geometría extraída de IFC/Fragments real.

`BIM-TASK-0120` certifica CSG sobre un sólido real del IFC buildingSMART PCERT:
ExpressId `448`, GlobalId `1yP7NInQz5uQzbiOpVFFJr` y delta volumétrico
`0.000000926 m3`. La fuente se verifica por SHA-256 y también se convierte a
Fragments. El gate siguiente debe obtener la triangulación a través de
`FragmentsModels.getItemsGeometry`, evitando confundir conversión paralela con
round-trip geométrico Fragments.

`BIM-TASK-0121` cierra ese round-trip: el IFC real se convierte a Fragments,
`FragmentsModels` entrega la triangulacion del localId `464`, resuelve el
GlobalId `3_4VN63S96DfWiJjgG8j1C` y alimenta CSG con conservación exacta a seis
decimales (`6.345857 m3`). El resultado genera el contrato persistible v1 y
pasa WebGL desktop/mobile. Queda pendiente que el panel BIM de producto lea y
renderice el artefacto CSG persistido en lugar de limitarse al artefacto
parametrico `bounding_box_v1`.

`BIM-TASK-0122` completa la cadena CSG local hasta el workspace de producto: el
panel consulta la revisión PostgreSQL mas reciente, reconstruye sus mallas,
prioriza `exact_bvh_csg_v1` y conserva `bounding_box_v1` como fallback. El
render pasa desktop/mobile y expone revisión, checksum, método y volumen. Con
ello el avance tecnico local previo se estimaba en `97%`. `TASK-2022` a
`TASK-2025` cierran Gate D local al `100%`; la suite BIM de 120 pruebas, la
matriz de rendimiento y los harness funcionales dejan también la preparación
técnica Gate E al `100%`. La liberación se estima en `99%`: solo falta ejecutar
y aprobar el piloto humano real exigido por la Definition of Done.

`TASK-2026` activa el rollout controlado únicamente para `Administradores
Generales` (`empresa_id=1`) y `Santiago Bermeo` (`empresa_id=3`) usando
`system_bim_settings`. El backend deniega cualquier otra empresa y el frontend
mantiene oculta la entrada BIM al consumir esa misma puerta. La activación está
auditada y no inicia todavía el conteo de Gate E. El 2026-07-13 el perimetro
BIM actual y la rama Alembic aditiva hasta `de2022a1b2c3` se desplegaron en
beta con BIM apagado durante la intervencion; la allowlist se reactivo solo tras
confirmar contenedores saludables, acceso runtime `1/3=true`, empresa
`2=false`, home `200`, endpoint protegido `401` y chunk BIM publico `200`.

`TASK-2027` y `BIM-TASK-0123` agregan una segunda puerta comercial al rollout.
BIM queda incluido por licencia Empresarial, Tester, Academica o Capacitacion;
Estandar y Profesional pueden adquirir `PACK_BIM` por USD 99.99 mensuales y
Express queda excluida. La allowlist `1,3` permanece obligatoria durante el
piloto. Administradores Generales y Santiago Bermeo fueron convertidas a
Enterprise localmente y en beta conservando su vigencia original.

`BIM-TASK-0124` despliega el Workspace BIM V2 y `BIM-TASK-0125` completa su
sustitucion definitiva: no existe una rama legacy ni un flag de convivencia en
el bundle. La shell unica organiza Visor, Coordinacion, Planificacion 4D,
Produccion, Campo e Informes, limita los paneles simultaneos y mantiene el visor
como superficie principal. La validacion cubre 1920x1080, canvas WebGL no vacio,
viewer superior al 65%, ausencia de overflow y bloqueo bajo 1920x1080. El
rollback es externo mediante imagen y fuentes respaldadas.

`BIM-TASK-0126` consolida Planificacion 4D en una unica superficie inspirada en
el patron operativo documentado oficialmente por Bentley SYNCHRO: Gantt,
cursor temporal y modelo comparten contexto. La seleccion actividad -> todos
sus GlobalIds y elemento -> todas sus actividades es muchos-a-muchos; Fragments
federado aplica color y foco nativos. Cronograma clasico sigue siendo fuente de
verdad mediante snapshots BIM y no recibe cambios. El slice esta desplegado en
beta como frontend-only; conserva imagen y fuentes previas para rollback.

- [BIM-TASK-0124](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0124.md) - Workspace BIM V2 ordenado y reversible
- [BIM-TASK-0125](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0125.md) - Sustitucion definitiva del workspace BIM anterior
- [BIM-TASK-0126](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0126.md) - Planificacion 4D bidireccional Gantt y modelo
- [Matriz de Adecuacion Funcional Bentley SYNCHRO](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_SYNCHRO_FULL_PARITY_MATRIX.md) - contrato de 60 capacidades y evidencia
- [BIM-TASK-0127](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0127.md) - Contrato de paridad funcional SYNCHRO
- [Contrato JSON de paridad SYNCHRO](/e:/Repositorios/GiProy%20Network/docs/architecture/bim_synchro_parity_matrix.json) - estados, evidencia y requisitos de release
- [BIM-TASK-0128](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0128.md) - Evidencia y validador de paridad SYNCHRO
- [Factibilidad de Interoperabilidad de Planificacion BIM](/e:/Repositorios/GiProy%20Network/docs/architecture/BIM_SCHEDULING_INTEROP_FEASIBILITY.md) - P6, MSPDI, Asta y limites propietarios
- [BIM-TASK-0129](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0129.md) - Factibilidad legal y tecnica de scheduling
- [BIM-TASK-0130](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0130.md) - Contrato canonico y preflight de scheduling
- [BIM-TASK-0131](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0131.md) - Intercambio MSPDI XML seguro
- [BIM-TASK-0132](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0132.md) - Intercambio Primavera P6 XML seguro
- [BIM-TASK-0133](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0133.md) - Gate de formatos propietarios de scheduling
- [BIM-TASK-0134](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0134.md) - Revision, aprobacion y rollback de scheduling BIM
- [BIM-TASK-0135](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0135.md) - Motor QTO IFC versionado y aislado
- [BIM-TASK-0136](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0136.md) - Gobierno QTO y paquete 5D aprobado
- [BIM-TASK-0137](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0137.md) - Nivelacion CPM reversible y aislada por revision
- [BIM-TASK-0138](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0138.md) - UX operativa de nivelacion de recursos
- [BIM-TASK-0139](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0139.md) - Flujo de producto para intercambio de planificacion
- [BIM-TASK-0140](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0140.md) - Gestion documental versionada del CDE BIM
- [BIM-TASK-0141](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0141.md) - Workflow RFI integral sobre CDE BIM
- [BIM-TASK-0142](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0142.md) - Submittals y planos de ingenieria BIM
- [BIM-TASK-0143](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0143.md) - ACL documental granular BIM
- [BIM-TASK-0144](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0144.md) - Geolocalizacion BIM modelo-mapa
- [BIM-TASK-0145](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0145.md) - Revision CDE contextual y notificaciones BIM
- [BIM-TASK-0146](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0146.md) - Dashboard CDE operacional
- [BIM-TASK-0147](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0147.md) - Documentos CDE disponibles en Campo
- [BIM-TASK-0148](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0148.md) - Incidencias y evidencia fotografica de Campo
- [BIM-TASK-0149](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0149.md) - Diario de obra consolidado de Campo
- [BIM-TASK-0150](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0150.md) - Inspecciones, checklists y punch lists de Campo
- [BIM-TASK-0151](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0151.md) - Eventos no planificados con impacto real
- [BIM-TASK-0152](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0152.md) - Materiales y equipos de Campo
- [BIM-TASK-0153](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0153.md) - Cuadrillas y partes de horas BIM
- [BIM-TASK-0154](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0154.md) - Estimacion BIM gobernada desde QTO
- [BIM-TASK-0155](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0155.md) - Contratos BIM de coste gobernados
- [BIM-TASK-0156](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0156.md) - Solicitudes y certificaciones de pago BIM
- [BIM-TASK-0157](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0157.md) - Schedule of Values BIM gobernado
- [BIM-TASK-0158](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0158.md) - Potenciales ordenes y ordenes de cambio BIM
- [BIM-TASK-0159](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0159.md) - Ledger de coste real desde Campo BIM
- [BIM-TASK-0160](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0160.md) - Forecast versionado de coste final BIM
- [BIM-TASK-0161](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0161.md) - Aceptacion gobernada de modelo as-built BIM
- [BIM-TASK-0162](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0162.md) - Registro de activos y sistemas de commissioning
- [BIM-TASK-0163](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0163.md) - Protocolos y aceptacion tecnica de commissioning
- [BIM-TASK-0164](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0164.md) - Cierre gobernado de punch list de entrega
- [BIM-TASK-0165](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0165.md) - Ensamblado gobernado del dossier digital
- [BIM-TASK-0166](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0166.md) - Aceptación gobernada del dossier digital
- [BIM-TASK-0167](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0167.md) - Baseline de transición BIM a Operaciones
- [BIM-TASK-0168](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0168.md) - Activación gobernada de transición BIM a Operaciones
- [BIM-TASK-0169](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0169.md) - Matriz operacional de alertas BIM
- [BIM-TASK-0170](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0170.md) - Ensayo DR del dominio BIM
- [BIM-TASK-0171](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0171.md) - Servicios cartograficos XYZ/WMS BIM
- [BIM-TASK-0172](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0172.md) - Intercambio gobernado BIM hacia ERP
- [BIM-TASK-0173](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0173.md) - Gateway de integracion empresarial BIM
- [BIM-TASK-0174](/e:/Repositorios/GiProy%20Network/docs/tasks/bim/BIM-TASK-0174.md) - Colaboracion CDE multiusuario incremental

---

## 7. Regla de mantenimiento

Todo nuevo documento, TASK o herramienta del programa BIM debe quedar enlazado desde este índice. Si no aparece aquí, se considera documentación incompleta para el programa BIM.

### Política de TASKs autogeneradas

Las TASKs creadas automáticamente por el lanzador de modos se consideran bitácoras operativas de sesión, pero en modo BIM deben generarse dentro de `docs/tasks/bim`.

La regla vigente es esta:

- toda sesión BIM debe nacer con TASK activa BIM
- si el trabajo madura o se consolida, la TASK autogenerada se promueve y se completa como TASK real del slice
- si el trabajo fue exploratorio o menor, la TASK se conserva como rastro operativo de sesión
- las TASKs estructurales del programa BIM siguen siendo las TASKs `BIM-TASK-*` definidas en este índice

De esta forma se garantiza trazabilidad continua sin convertir las TASKs de sesión en ruido de gobierno.
