# BIM-TASK-0193 - Diagnostico y plan de adecuacion transversal BIM

Fecha: 2026-08-03

Estado: Cierre documental; cuestionario completado y plan ejecutivo consolidado

Modo: INTEGRACION CONTROLADA GIPROY CLASICO <-> GIPROY BIM

## Objetivo

Registrar de forma verificable las brechas que el usuario vaya priorizando sobre
el modulo BIM y convertirlas, una vez acordadas, en un plan de adecuacion por
slices verticales, sin confundir diagnostico, planificacion e implementacion.

## Alcance de esta TASK

- Contrastar cada cuestion con codigo, contratos, persistencia, frontend,
  pruebas y documentacion existentes.
- Distinguir capacidad clasica, capacidad BIM generica e integracion real.
- Registrar fuentes de verdad, dependencias, riesgos, gates y validaciones.
- Mantener un backlog de frentes candidatos sin activarlos silenciosamente.
- Proponer TASKs BIM y TASKs de integracion separadas antes de implementar.

## No alcance

- Modificar codigo, contratos API, PostgreSQL, migraciones o datos.
- Cambiar flags, licencias, entitlement, roles, tenant o allowlists.
- Alterar el porcentaje tecnico 61/61 ni cerrar Gate E o Gate K.
- Mezclar este diagnostico con `BIM-TASK-0192`.

## Frente registrado 01 - OmniClass con BIM y Proyectos

### Estado verificado

- GiProy Clasico dispone de maestro OmniClass, tablas 21/22/23/34, endpoints,
  configuracion `Empresa.use_omniclass` y campos en subcategorias, recursos,
  APUs y lineas de presupuesto.
- `BimElement` solo conserva `classification` como texto libre, sin sistema,
  edicion, tabla, codigo normalizado, fuente ni referencia al maestro.
- El parser IFC no demuestra extraccion de `IfcClassification`,
  `IfcClassificationReference` o `IfcRelAssociatesClassification`.
- Los modelos BIM estan acotados por empresa y proyecto, y los elementos pueden
  enlazarse explicitamente con EDT, APU y Presupuesto, pero OmniClass no gobierna
  ni propone actualmente esos enlaces.
- No se encontraron pruebas ni BIM-TASK previas especificas de OmniClass BIM.

### Brecha aceptada para el plan

Construir una clasificacion BIM gobernada que reutilice el maestro clasico como
fuente de verdad, preserve sistema/edicion/tabla/codigo/titulo/procedencia por
version de modelo y respete empresa, proyecto, revision, flags y rollback.

### Restricciones

- No duplicar el catalogo OmniClass en tablas BIM.
- No sustituir el campo generico sin estrategia compatible y migracion aditiva.
- No crear links EDT/APU/Presupuesto automaticamente por coincidencia de codigo.
- Toda propuesta de enlace debe ser explicita, revisable, trazable e idempotente.
- Si la implementacion toca maestros, empresa, APUs, EDT o Presupuesto, requiere
  una TASK clasica de integracion controlada enlazada con su BIM-TASK.

### Slices candidatos aun no autorizados

1. Contrato y persistencia aditiva de clasificacion BIM versionada.
2. Extraccion de asociaciones de clasificacion desde IFC.
3. Resolucion contra el maestro OmniClass sin duplicarlo.
4. Politica por empresa/proyecto y tratamiento de codigos no resueltos.
5. Inspector, filtros y busqueda de clasificacion en el workspace BIM.
6. Propuestas controladas de vinculacion 5D con EDT/APU/Presupuesto.

## Frente registrado 02 - Tri-sincronizacion Presupuesto, Gantt y BIM

### Estado verificado

- El Gantt clasico esta ligado al presupuesto operativo mediante
  `presupuesto_id`, proyecto, empresa y lineas de presupuesto. Dispone de
  recalculo gobernado desde Presupuesto/APU, borradores, preflight, locks,
  confirmacion, historial, restauracion y derivacion hacia Cronograma Valorado y
  Flujo de Caja.
- BIM 4D dispone de snapshots de actividad, baselines, dependencias, propuestas
  aprobables elemento-actividad, progreso y reproduccion temporal real sobre
  GUIDs del modelo.
- La identidad 4D usa `source_kind`, `source_ref` y `snapshot_revision` como
  referencias textuales; no existe una FK estable hacia la fila/version del
  Gantt clasico ni un adaptador que refresque y reconcilie cambios de forma
  automatica.
- BIM 5D dispone de links explicitos de elemento con EDT, APU y linea de
  Presupuesto, QTO y propuestas aprobables sin escritura automatica clasica.
- No existe un contrato unico que relacione simultaneamente linea de
  Presupuesto/APU, actividad Gantt, elemento/version BIM y revision de proyecto.
- No existe orquestador triangular, ledger comun de sincronizacion, matriz de
  conflictos, preflight conjunto ni rollback atomico de los tres dominios.

### Brecha aceptada para el plan

Crear una coordinacion tridominio gobernada, no una replicacion circular. Cada
atributo debe declarar fuente de verdad y direccion permitida: coste/cantidad y
composicion desde Presupuesto/APU; fechas, dependencias y baseline desde Gantt;
geometria, GUID, propiedades y cantidades IFC desde la version BIM. Los cambios
cruzados se materializan como propuestas versionadas y aprobables.

### Restricciones

- No convertir BIM en dependencia del Gantt o Presupuesto clasicos.
- No sobrescribir costes, cantidades, rendimientos, fechas o geometria por una
  coincidencia implicita.
- No usar `source_ref` textual como unica identidad productiva definitiva.
- Mantener independencia entre revision clasica, baseline Gantt y version BIM,
  vinculandolas mediante un agregado de coordinacion explicito.
- Toda escritura cruzada debe ser autorizada, idempotente, tenant-aware,
  auditable y reversible.

### Slices candidatos aun no autorizados

1. Matriz de autoridad por dato y estados de sincronizacion.
2. Identidad estable para linea/APU, actividad Gantt, elemento y sus versiones.
3. Agregado versionado de coordinacion 4D/5D por proyecto y revision.
4. Adaptador Presupuesto/Gantt hacia snapshots BIM con diff e invalidacion.
5. Preflight conjunto, conflictos y propuestas de cambio aprobables.
6. UX de estado, navegacion cruzada, aplicacion y rollback controlado.
7. Pruebas end-to-end con BIM apagado, encendido y aislamiento multi-tenant.

## Frente registrado 03 - Reestructuracion integral del frontend BIM

### Decisiones confirmadas

- La experiencia sera neutral y compartida, con entrada, acciones y prioridades
  adaptadas dinamicamente a las capacidades y al contexto del usuario.
- Planificacion 4D y presupuesto 5D constituyen el flujo principal porque
  GiProy nace como sistema de presupuestos de obra.
- Se autoriza reorganizar completamente el frontend BIM para integrarlo en el
  sistema y eliminar la presentacion actual como conjunto inconexo de funciones.
- La referencia minima es un monitor fisico de 1920 x 1080; la composicion debe
  usar el contenedor util real y escalar correctamente a resoluciones mayores.

### Estado verificado

- El workspace actual ofrece siete espacios: Visor, Coordinacion, Planificacion
  4D, Produccion, Campo, Entrega e Informes.
- Existen herramientas duplicadas entre espacios y navegacion plana mediante
  numerosas pestanas, sin un flujo rector de principio a fin.
- En escritorio pueden coexistir explorador de 220 px, inspector de 300 px y
  panel inferior de al menos 300 px, ademas de tres bandas superiores.
- La exclusion automatica entre laterales solo se aplica en perfiles reducidos.
- Los paneles internos asumen anchos heterogeneos y pueden truncarse al montarse
  dentro del inspector actual.
- La adaptacion funcional del frontend sigue siendo mas gruesa por rol que la
  matriz de capacidades BIM existente en backend.

### Brecha aceptada para el plan

Construir un workspace orientado a tareas con cinco modos: `Planificacion y
costes`, `Modelo`, `Coordinacion`, `Seguimiento` y `Entrega`. El flujo principal
debe conectar revision presupuestaria, baseline Gantt y version BIM; facilitar
vinculacion, validacion, simulacion, propuesta, aprobacion y seguimiento; y
mantener visible el estado de sincronizacion y la fuente de verdad.

### Contrato espacial inicial

- Cabecera BIM completa de hasta 88 px en dos niveles.
- Un unico panel lateral desarrollado por defecto, de 280-360 px.
- Visor con al menos 65% del ancho util durante el flujo habitual.
- Superficie temporal 4D/5D de 220-260 px, colapsable a 36-40 px y limitada al
  35% de la altura del contenedor.
- Consultas de contenedor para decidir composicion; la resolucion fisica solo
  determina compatibilidad minima.
- En 2560, ultrawide y 4K aumenta el contenido visible, no la escala general de
  controles, tipografia o paneles.

### Slices candidatos aun no autorizados

1. Contrato UX, inventario de herramientas y baseline visual 1920 x 1080.
2. Nuevo shell BIM, navegacion compacta y gestor comun de paneles/overlays.
3. Workbench vertical Presupuesto <-> Gantt <-> BIM para 4D/5D.
4. Consolidacion de Modelo y Coordinacion sin herramientas duplicadas.
5. Seguimiento integrado de tiempo, cantidad, coste, produccion y campo.
6. Flujo de Entrega y separacion de Administracion BIM.
7. Adaptacion por capacidades, accesibilidad, rendimiento y QA multiresolucion.

### Criterios de aceptacion de arquitectura

- Cero solapes o controles recortados en el contenedor util de 1920 x 1080.
- Ningun flujo principal exige mantener dos laterales abiertos.
- Una partida permite alcanzar sus actividades y elementos BIM en dos acciones.
- Presupuesto, baseline, modelo, version y sincronizacion permanecen visibles.
- Las acciones primarias se comprenden sin depender exclusivamente de iconos o
  tooltips y toda escritura respeta capacidades backend.
- Las resoluciones mayores aportan mas informacion y area de modelo sin producir
  paneles sobredimensionados.

## Coordinacion obligatoria del programa multifrente

- Los tres frentes forman un unico programa y no se gestionan como backlogs
  funcionalmente independientes.
- Cada slice vertical debe declarar impacto en OmniClass, tri-sincronizacion y
  workspace, aunque el resultado sea `sin impacto` para alguno de ellos.
- OmniClass puede asistir propuestas 5D, pero no generar vinculaciones
  automaticas ni sustituir identidades estables.
- El contrato tridominio gobierna fuentes de verdad, estados, conflictos,
  aprobacion y rollback; el frontend solo los representa y opera.
- Capacidades, API, persistencia y UX deben evolucionar coordinadamente.
- El gate de cierre es end-to-end y cubre Presupuesto, Gantt, BIM, propuesta,
  aprobacion, seguimiento y clasificacion cuando `use_omniclass` este activo.
- Antes de autorizar implementacion se construira un dependency graph unico y
  una matriz `slice x frente x contrato x prueba x rollback`.

## Cierre del grill de decisiones

- Sesenta decisiones confirmadas sobre producto, roles, capacidades, fuentes de
  verdad, OmniClass, links, versiones, UX, superficies, migracion, piloto,
  auditoria, dispositivos, DPI, navegadores, rendimiento y QA.
- Plan ejecutable consolidado en
  `docs/architecture/BIM_COORDINATED_ADEQUACY_EXECUTION_PLAN.md`.
- Dependency graph, 20 slices verticales, matriz transversal y gates definidos.
- Proyecto canonico verificado: `SantiagoBermeo-2026-001`, revision 0 unica.
- Sin implementacion ni modificacion de datos. Migracion real condicionada al
  dry-run y a una autorizacion posterior sobre su informe.

## Porcentajes de cierre

- Avance parcial de `BIM-TASK-0193`: **100% documental**.
- Peso dentro de S01-S20: **0%**; esta TASK diagnostica y gobierna, no implementa
  un slice ponderado.
- Aporte acumulado al nuevo plan de implementacion: **0%**.
- Avance total del programa coordinado S01-S20: **0%**.
- Programa BIM tecnico historico 61/61: **sin cambios**.

Desde este cierre, toda TASK derivada debe informar avance parcial, aporte
ponderado, avance de fase y avance total conforme al plan ejecutivo.

## Criterios de cierre documental

- [x] Todas las cuestiones del usuario estan registradas y confirmadas.
- [x] Cada frente declara estado real, brecha, fuente de verdad y riesgos.
- [x] El dependency graph y el orden de slices han sido acordados.
- [x] Cada slice tiene criterios de aceptacion, pruebas y rollback.
- [x] Existe una matriz transversal de impacto para todos los slices.
- [x] El usuario ha aprobado el plan documental antes de abrir TASKs de ejecucion.

## Validacion de esta actualizacion

- Lectura focal de modelos, schemas, parser, servicios, endpoints, frontend,
  migraciones y referencias documentales OmniClass/BIM.
- Validacion textual de IDs y referencias mediante busqueda en repositorio.
- Sin build ni pytest: esta TASK solo registra diagnostico y planificacion.

## Rollback

Eliminar esta TASK y retirar sus entradas del indice, plan y CHANGELOG. No hay
cambio de codigo, datos, schema, flags ni comportamiento operativo.

## Avance

- Cuestionario: cerrado con 3 frentes y 60 decisiones confirmadas.
- `BIM-TASK-0193`: 100% documental; diagnostico, dependency graph, slices,
  matrices, gates y aprobacion del plan consolidados. La implementacion se abre
  mediante TASKs nuevas y no cambia el porcentaje tecnico del programa.
- Programa BIM tecnico y liberacion general: sin cambios.
