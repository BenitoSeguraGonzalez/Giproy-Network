# Indice TASK BIM Paralelo

## Proposito

Este indice separa el gobierno operativo BIM del carril clasico. A partir de
esta adecuacion, el programa BIM se ejecuta con IDs `BIM-TASK-*` dentro de
`docs/tasks/bim`.

## Relacion con TASKs historicas

Las TASK clasicas `TASK-0545` a `TASK-0559` quedan como planificacion legacy.
No se eliminan ni se mueven para conservar trazabilidad historica, pero las
nuevas ejecuciones BIM deben usar la estructura paralela de este directorio.

| TASK BIM | Equivalente historico | Frente |
|---|---|---|
| `BIM-TASK-0000` | `TASK-0545` | Madre de control BIM |
| `BIM-TASK-0001` | `TASK-0546` | Dominio BIM y arquitectura |
| `BIM-TASK-0002` | `TASK-0547` | Backend y base de datos BIM |
| `BIM-TASK-0003` | `TASK-0548` | Shell frontend BIM |
| `BIM-TASK-0004` | `TASK-0549` | Pipeline de importacion y versionado |
| `BIM-TASK-0005` | `TASK-0550` | Vinculos BIM con negocio |
| `BIM-TASK-0006` | `TASK-0551` | Vistas, estado y navegacion BIM |
| `BIM-TASK-0007` | `TASK-0552` | Seguridad, permisos y operacion |
| `BIM-TASK-0008` | `TASK-0553` | Validacion, simulacion y smokes |
| `BIM-TASK-0009` | `TASK-0554` | Rollout y liberacion |
| `BIM-TASK-0010` | `TASK-0555` | Paridad visual y funcional BIM |
| `BIM-TASK-0011` | `TASK-0556` | Feature flags y activacion progresiva |
| `BIM-TASK-0012` | `TASK-0557` | Prompt maestro de transicion paralela |
| `BIM-TASK-0013` | `TASK-0558` | Prompt ejecutivo de activacion |
| `BIM-TASK-0014` | `TASK-0559` | Tooling de modos, runtime y TASK automatica |
| `BIM-TASK-0015` | N/A | Alineacion documental del estado real BIM |
| `BIM-TASK-0016` | N/A | Migracion Alembic del dominio BIM principal |
| `BIM-TASK-0017` | N/A | Gobierno runtime de esquema BIM y tests focales |
| `BIM-TASK-0018` | N/A | Contratos API BIM bajo flags y tenant |
| `BIM-TASK-0019` | N/A | Importacion JSON BIM y workspace activo |
| `BIM-TASK-0020` | N/A | Links BIM latentes con EDT |
| `BIM-TASK-0021` | N/A | Links BIM latentes con APUs y Presupuesto |
| `BIM-TASK-0022` | N/A | Smoke frontend BIM positivo aislado |
| `BIM-TASK-0023` | N/A | Smoke visual DOM del viewer BIM aislado |
| `BIM-TASK-0024` | N/A | Validacion controlada de migracion Alembic BIM |
| `BIM-TASK-0025` | N/A | Importacion JSON batch transaccional |
| `BIM-TASK-0026` | N/A | Guarda UX de validacion previa a importacion BIM |
| `BIM-TASK-0027` | N/A | Permisos de duplicacion de vistas BIM compartidas |
| `BIM-TASK-0028` | N/A | Guarda backend de validacion previa a importacion BIM |
| `BIM-TASK-0029` | N/A | Cobertura de workspace context BIM por usuario |
| `BIM-TASK-0030` | N/A | Restriccion de scopes publicos en vistas BIM |
| `BIM-TASK-0031` | N/A | Registro de manifiesto IFC BIM versionado |
| `BIM-TASK-0032` | N/A | Cliente frontend BIM para manifiesto IFC |
| `BIM-TASK-0033` | N/A | Bloqueo de etiquetas IFC duplicadas |
| `BIM-TASK-0034` | N/A | Bloqueo de etiquetas JSON BIM duplicadas |
| `BIM-TASK-0035` | N/A | IFC/3D como fundamento de cierre BIM |
| `BIM-TASK-0036` | N/A | Parsing IFC semantico inicial local y simulaciones sinteticas |
| `BIM-TASK-0037` | N/A | Storage local IFC controlado |
| `BIM-TASK-0038` | N/A | Parsing IFC profundo inicial |
| `BIM-TASK-0039` | N/A | Artefacto optimizado para viewer BIM |
| `BIM-TASK-0040` | N/A | Consumo de artefacto viewer en harness 3D |
| `BIM-TASK-0041` | N/A | Smoke local de fragments binarios |
| `BIM-TASK-0042` | N/A | Carga de fragments con FragmentsModels en harness |
| `BIM-TASK-0043` | N/A | Dataset IFC geometrico representativo local |
| `BIM-TASK-0071` | N/A | Corpus IFC real licenciado y reproducible |
| `BIM-TASK-0044` | N/A | Quantities, materiales y sistemas IFC |
| `BIM-TASK-0046` | N/A | Simulacion IFC/fragments de volumen local |
| `BIM-TASK-0047` | N/A | Consulta ItemData desde FragmentsModels |
| `BIM-TASK-0048` | N/A | Inspector y controles frontend de fragments consultables |
| `BIM-TASK-0049` | N/A | Filtro operativo IFC en canvas BIM |
| `BIM-TASK-0050` | N/A | Seleccion 3D con raycasting en viewer BIM |
| `BIM-TASK-0051` | N/A | Navegacion 3D profesional con OrbitControls |
| `BIM-TASK-0052` | N/A | Foco 3D de elemento seleccionado |
| `BIM-TASK-0053` | N/A | Hover 3D con raycasting trazable |
| `BIM-TASK-0054` | N/A | Inspector 3D contextual del viewer BIM |
| `BIM-TASK-0055` | N/A | Filtro IFC 3D operativo en viewer BIM |
| `BIM-TASK-0056` | N/A | Visibilidad IFC 3D operativa en viewer BIM |

## Estado real 2026-07-01

El programa BIM ya tiene codigo incubado. No debe tratarse como ejecucion no
iniciada.

| TASK BIM | Estado real |
|---|---|
| `BIM-TASK-0000` | En progreso documental, programa no liberable |
| `BIM-TASK-0001` | Parcialmente implementada |
| `BIM-TASK-0002` | Parcialmente implementada, Alembic principal creado y validado en entorno controlado |
| `BIM-TASK-0003` | Parcialmente implementada, UX apagada en Proyectos clasico |
| `BIM-TASK-0004` | Parcialmente implementada para paquetes JSON con batch transaccional, bloqueo de labels JSON duplicados, manifiesto IFC versionado, cliente frontend de dominio, bloqueo de labels IFC duplicados, parsing IFC textual inicial, relaciones/property sets iniciales, quantities/materiales/sistemas iniciales, storage local IFC controlado, artefacto viewer optimizado JSON, consumo del artefacto en viewer 3D/harness, smoke local de fragments binarios, carga fragments con `FragmentsModels`, dataset geometrico representativo local, simulacion de volumen local, consulta `ItemData` e inspector/controles frontend de fragments; faltan datasets reales |
| `BIM-TASK-0005` | Backend latente cubierto para links EDT/APUs/Presupuesto; navegacion visible pendiente |
| `BIM-TASK-0006` | Parcialmente implementada para view states/workspace context, con workspace context cubierto por usuario y flag |
| `BIM-TASK-0007` | Parcialmente implementada por flags, tenant, permisos de vistas compartidas y scopes publicos restringidos |
| `BIM-TASK-0008` | Parcialmente implementada con tests API BIM, smoke frontend estatico y smoke visual DOM del viewer |
| `BIM-TASK-0009` | Pendiente |
| `BIM-TASK-0010` | Parcialmente implementada con viewer tecnico, guardas UX de importacion, filtro IFC en canvas, filtro/visibilidad IFC 3D, seleccion/hover 3D por raycasting, navegacion 3D OrbitControls, foco 3D de elemento seleccionado e inspector 3D contextual |
| `BIM-TASK-0011` | Parcialmente implementada |
| `BIM-TASK-0012` | Implementada documentalmente |
| `BIM-TASK-0013` | Implementada documentalmente |
| `BIM-TASK-0014` | Implementada documentalmente |
| `BIM-TASK-0015` | Cerrada como alineacion documental |
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
| `BIM-TASK-0035` | Cerrada localmente como fundacion IFC/3D con Three.js, stack BIM/3D instalado y viewer 3D aislado sin parsing IFC semantico completo |
| `BIM-TASK-0036` | Cerrada localmente como parsing IFC semantico inicial STEP/texto hacia storeys y elementos BIM persistidos, con simulaciones sinteticas S1/S2/S3 |
| `BIM-TASK-0037` | Cerrada localmente como storage local IFC controlado con endpoint multipart, checksum, artifact_path y tests con tmp_path |
| `BIM-TASK-0038` | Cerrada localmente como parsing IFC profundo inicial de relaciones espaciales y property sets con simulacion S4 |
| `BIM-TASK-0039` | Cerrada localmente como artefacto optimizado JSON para viewer BIM con indices y endpoint protegido |
| `BIM-TASK-0040` | Cerrada localmente como consumo de artefacto viewer optimizado desde harness 3D con canvas WebGL no vacio |
| `BIM-TASK-0041` | Cerrada localmente como smoke de fragments binarios reales con `IfcImporter` y WASM local |
| `BIM-TASK-0042` | Cerrada localmente como carga de fragments binarios con `FragmentsModels` en harness aislado |
| `BIM-TASK-0043` | Cerrada localmente como dataset IFC geometrico representativo local con localIds y GlobalIds consultables |
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
| `BIM-TASK-0057` | Cerrada localmente como inspector ItemData profundo en fragments |
| `BIM-TASK-0058` | Cerrada localmente como estructura espacial real en harness fragments |
| `BIM-TASK-0059` | Cerrada localmente como geometria y medicion fragments en harness BIM |
| `BIM-TASK-0060` | Cerrada localmente como medicion por categoria IFC en fragments |
| `BIM-TASK-0061` | Cerrada localmente como subset fragments por categoria IFC |
| `BIM-TASK-0062` | Cerrada localmente como trazabilidad GUID bidireccional en fragments |
| `BIM-TASK-0063` | Cerrada localmente como ItemData batch por categoria IFC en fragments |
| `BIM-TASK-0064` | Cerrada localmente como raycasting nativo fragments en harness BIM |
| `BIM-TASK-0065` | Cerrada localmente como seleccion ItemData nativa fragments desde raycasting |
| `BIM-TASK-0066` | Cerrada localmente como visibilidad de seleccion nativa fragments |
| `BIM-TASK-0067` | Cerrada localmente como visibilidad por categoria en canvas fragments nativo |
| `BIM-TASK-0068` | Cerrada localmente como filtro de categoria en canvas fragments nativo |
| `BIM-TASK-0069` | Cerrada localmente como seleccion por puntero en canvas fragments nativo |
| `BIM-TASK-0070` | Cerrada documentalmente como benchmark, plan y baseline de 29 decisiones BIM confirmadas |
| `BIM-TASK-0071` | Cerrada localmente con cinco IFC buildingSMART CC BY 4.0, manifiesto, parser y smoke Fragments |
| `BIM-TASK-0072` | Cerrada localmente como job IFC persistente, idempotente y observable con progreso, cancelacion, retry y UX BIM |
| `BIM-TASK-0073` | Cerrada localmente como conformidad STEP/schema/semantica y reporte de calidad persistido por version |
| `BIM-TASK-0074` | Cerrada localmente como lifecycle de source IFC, viewer JSON e indices y Fragments con checksum/rollback; Gate A cerrado |
| `BIM-TASK-0075` | Cerrada localmente como viewport Fragments de producto con artifact real, raycast, resize, recovery y disposal |
| `BIM-TASK-0076` | Cerrada localmente como shell UX contextual con toolbar, explorer e inspector operativos y accesibles |
| `BIM-TASK-0077` | Cerrada localmente como explorer arbol/tabla con busqueda servidor, paginacion y seleccion sincronizada |
| `BIM-TASK-0078` | Cerrada localmente con ocultar, aislar, ghost, clipping, medicion, proyeccion y reset Fragments reales |
| `BIM-TASK-0079` | Cerrada localmente con contrato de vistas reproducibles y cierre Gate B |
| `BIM-TASK-0080` | Cerrada localmente con change set reproducible por GUID y fallback semantico declarado |
| `BIM-TASK-0081` | Cerrada localmente con federacion Fragments multiversion, transforms, georreferencia y revisiones inmutables |
| `BIM-TASK-0082` | Cerrada localmente con perfiles IDS, hallazgos por GUID, excepciones auditadas y export CSV; Gate C cerrado |
| `BIM-TASK-0083` | Cerrada localmente con dominio de incidencias e import/export BCF-XML 2.1 |
| `BIM-TASK-0084` | Cerrada localmente con flujo UX creador, responsable y revisor sobre viewpoint real |
| `BIM-TASK-0085` | Cerrada localmente con propuestas 5D trazables y sin escritura automatica clasica |
| `BIM-TASK-0086` | Cerrada localmente: TASK-2022/2023/2024/2025 completan puerta, foco EDT/Presupuesto y retorno APU |
| `BIM-TASK-0087` | Cerrada localmente con capacidades tenant-aware y auditoria sensible |
| `BIM-TASK-0088` | Cerrada localmente con presupuesto Chrome/Edge desktop/tablet, FPS, memoria y disposal |
| `BIM-TASK-0089` | Cerrada localmente con correlation id y metricas sanitizadas |
| `BIM-TASK-0090` | Allowlist desplegada en beta para empresas 1 y 3 mediante TASK-2026; responsables, 10 jornadas y dos revisiones reales pendientes |
| `BIM-TASK-0091` | Cerrada localmente como modelo conceptual 4D sin duplicar fuentes clasicas |
| `BIM-TASK-0092` | Cerrada localmente con capacidades 4D componibles |
| `BIM-TASK-0093` | Cerrada localmente con snapshots de actividad y vinculos N:M tenant-aware |
| `BIM-TASK-0094` | Cerrada localmente con propuestas 4D auditables y panel BIM operativo |
| `BIM-TASK-0095` | Cerrada localmente con snapshots de progreso y estados temporales PostgreSQL |
| `BIM-TASK-0096` | Cerrada localmente con timeline reproducible por fecha de corte |
| `BIM-TASK-0097` | Cerrada localmente con perfiles temporales Fragments y UX 4D reversible |
| `BIM-TASK-0098` | Cerrada localmente con baselines inmutables y dependencias snapshot PostgreSQL |
| `BIM-TASK-0099` | Cerrada localmente con desviacion plan-real y retorno a viewpoint BIM |
| `BIM-TASK-0100` | Cerrada localmente con frentes BIM tenant-aware en PostgreSQL |
| `BIM-TASK-0101` | Cerrada localmente con componentes construibles logicos por GUID/actividad |
| `BIM-TASK-0102` | Cerrada localmente con escenarios what-if inmutables y conflictos de dependencia |
| `BIM-TASK-0103` | Cerrada localmente con cantidad-rendimiento-cuadrilla, duracion y recurso propuestos |
| `BIM-TASK-0104` | Cerrada localmente con partes y evidencia binaria en PostgreSQL |
| `BIM-TASK-0105` | Cerrada localmente con productividad real y valor ganado reproducible |
| `BIM-TASK-0106` | Cerrada: playback 4D profesional nativo |
| `BIM-TASK-0107` | Cerrada: recursos, capacidad e histogramas 4D nativos sobre PostgreSQL |
| `BIM-TASK-0108` | Cerrada: conflictos espacio-tiempo con evidencia y foco GUID |
| `BIM-TASK-0109` | Cerrada: Gantt BIM, ruta crítica y viewport sincronizado |
| `BIM-TASK-0110` | Cerrada: informes JSON/CSV 4D/5D nativos |
| `BIM-TASK-0111` | Cerrada: corpus IFC real S/M/L y presupuesto WebGL |
| `BIM-TASK-0112` | Cerrada: gate de liberación BIM 4D nativo |
| `BIM-TASK-0113` | Cerrada: particiones no destructivas PostgreSQL y preview WebGL real |
| `BIM-TASK-0114` | Cerrada: sólidos paramétricos, cantidades y artefacto PostgreSQL |
| `BIM-TASK-0115` | Cerrada: equipos BIM, trayectorias, playback y conflictos WebGL |
| `BIM-TASK-0116` | Cerrada: riesgos, controles, inspecciones, exclusión y exposición 4D |
| `BIM-TASK-0117` | Cerrada: 50k actividades, 300 frames, federación Fragments x5 y gate avanzado |
| `BIM-TASK-0118` | Cerrada localmente: CSG BVH exacto, conservación volumétrica y harness WebGL responsive |
| `BIM-TASK-0119` | Cerrada localmente: artefactos CSG versionados PostgreSQL, validación servidor y round-trip SHA-256 |
| `BIM-TASK-0120` | Cerrada localmente: CSG conservativo sobre sólido IFC real buildingSMART con GlobalId y conversión Fragments |
| `BIM-TASK-0121` | Cerrada localmente: round-trip FragmentsModels MeshData hacia CSG exacto, GlobalId, WebGL y payload persistible |
| `BIM-TASK-0122` | Cerrada localmente: consumo y render del artefacto CSG persistido en el panel BIM de producto con fallback parametrico |
| `BIM-TASK-0123` | Cerrada y desplegada: entitlement comercial BIM, modulo mensual y piloto Enterprise limitado a empresas 1 y 3 |
| `BIM-TASK-0124` | Cerrada y desplegada: Workspace BIM V2 ordenado, contextual, reversible y validado a 1920x1080 |
| `BIM-TASK-0125` | Cerrada y desplegada: V2 sustituye definitivamente al workspace BIM anterior, sin convivencia en codigo ni build |
| `BIM-TASK-0126` | Cerrada y desplegada en beta: Gantt, cursor 4D y modelo comparten seleccion bidireccional muchos-a-muchos en una superficie unica |
| `BIM-TASK-0127` | Cerrada documentalmente: contrato de 60 capacidades SYNCHRO, evidencia y baseline integral conservador de 45,83% |
| `BIM-TASK-0128` | Cerrada localmente: matriz machine-readable, score reproducible y validador de gates de liberacion |
| `BIM-TASK-0129` | Cerrada documentalmente: XML abierto prioritario y formatos propietarios condicionados a adaptador autorizado |
| `BIM-TASK-0130` | Cerrada localmente: contrato canonico y preflight de scheduling sin escritura clasica |
| `BIM-TASK-0131` | Cerrada localmente: import-preview/export MSPDI XML seguro, jerarquico y sin escritura clasica |
| `BIM-TASK-0132` | Cerrada localmente: import-preview/export Primavera P6 XML seguro y sin escritura clasica |
| `BIM-TASK-0133` | Cerrada localmente: gate XER/MPP/PP condicionado, sin parser ni soporte propietario ficticio |
| `BIM-TASK-0134` | Cerrada localmente: revisiones canonicas, aprobacion, comparacion y rollback BIM aislado |
| `BIM-TASK-0135` | Cerrada localmente: QTO IFC versionado, cobertura y codigos WBS/coste latentes sin escritura clasica |
| `BIM-TASK-0136` | Cerrada localmente: aprobacion QTO unica, control optimista y paquete 5D sin escritura clasica |
| `BIM-TASK-0137` | Cerrada localmente: nivelacion CPM reversible, gobernada y aislada por revision de proyecto |
| `BIM-TASK-0138` | Cerrada localmente: UX de nivelacion de recursos operativa a 1920x1080 |
| `BIM-TASK-0139` | Cerrada localmente: intercambio MSPDI/P6 visible, gobernado y sin escritura clasica |
| `BIM-TASK-0140` | Cerrada localmente: gestion documental CDE versionada, integra y aislada |
| `BIM-TASK-0141` | Cerrada localmente: workflow RFI contextual, gobernado y auditable sobre CDE BIM |
| `BIM-TASK-0142` | Cerrada localmente: submittals revisionados y planos de ingenieria gobernados sobre CDE BIM |
| `BIM-TASK-0143` | Cerrada localmente: ACL documental granular, jerarquica y tenant-aware sobre CDE BIM |
| `BIM-TASK-0144` | Cerrada localmente: geolocalizacion BIM versionada y mapa sincronizado con modelos federados |
| `BIM-TASK-0145` | Cerrada localmente: revisiones CDE contextuales, responsables y notificaciones BIM internas |
| `BIM-TASK-0146` | Cerrada localmente: dashboard CDE operacional con ACL, vencimientos y carga por responsable |
| `BIM-TASK-0147` | Cerrada localmente: documentos CDE autorizados disponibles en Campo de escritorio |
| `BIM-TASK-0148` | Cerrada localmente: incidencias BCF y evidencia fotografica integra en Campo de escritorio |
| `BIM-TASK-0149` | Cerrada localmente: diario de obra consolidado sobre partes 4D existentes |
| `BIM-TASK-0150` | Cerrada localmente: inspecciones, checklists y punch lists gobernados en Campo |
| `BIM-TASK-0151` | Cerrada localmente: eventos no planificados con impacto real de plazo y coste gobernado |
| `BIM-TASK-0152` | Cerrada localmente: recepcion, consumo y retorno de materiales y equipos en Campo |
| `BIM-TASK-0153` | Cerrada localmente: directorio de cuadrillas y partes diarios de horas BIM |
| `BIM-TASK-0154` | Cerrada localmente: estimacion BIM gobernada desde QTO aprobado |
| `BIM-TASK-0155` | Cerrada localmente: contratos BIM de coste gobernados por estimacion aprobada |

## Orden de ejecucion

- Ola 1: `BIM-TASK-0001`, `BIM-TASK-0002`, `BIM-TASK-0003`, `BIM-TASK-0010`.
- Ola 2: `BIM-TASK-0004`, `BIM-TASK-0006`, `BIM-TASK-0011`.
- Ola 3: `BIM-TASK-0005`.
- Ola 4: `BIM-TASK-0007`, `BIM-TASK-0008`.
- Ola 5: `BIM-TASK-0009`.

## Regla de integracion controlada

Si una TASK BIM toca EDT, APUs, Presupuesto, Cronogramas, Proyectos clasico,
auth, tenant o rutas compartidas, debe:

1. declarar el impacto en la TASK BIM;
2. abrir o enlazar una TASK de integracion controlada;
3. validar BIM apagado y BIM encendido si aplica;
4. confirmar que GiProy Clasico no cambia de comportamiento con flags apagadas.
