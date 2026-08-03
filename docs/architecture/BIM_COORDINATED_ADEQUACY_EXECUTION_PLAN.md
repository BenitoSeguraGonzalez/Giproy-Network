# Plan Ejecutivo Coordinado de Adecuacion BIM

Fecha: 2026-08-03

Estado: aprobado para descomposicion documental; implementacion y migracion real
pendientes de gates especificos

Programa: INTEGRACION CONTROLADA GIPROY CLASICO <-> GIPROY BIM

## 1. Objetivo y alcance

Sustituir integralmente el frontend BIM actual y construir una coordinacion real
entre Presupuesto, Gantt y BIM, incorporando OmniClass, roles, capacidades,
auditoria y experiencia de Proyecto bajo un unico programa. BIM sigue siendo
opcional: GiProy debe operar plenamente con Presupuesto y Gantt al margen de BIM.

El plan coordina tres frentes inseparables:

1. Clasificacion OmniClass en BIM y Proyecto.
2. Tri-sincronizacion Presupuesto <-> Gantt <-> BIM.
3. Reestructuracion completa del workspace y de la experiencia BIM.

No se autoriza todavia modificar datos reales. Se autoriza diseno, contratos,
TASKs, migraciones preparatorias y dry-run. La aplicacion definitiva requerira
revisar el informe del dry-run.

## 2. Decisiones rectoras confirmadas

### 2.1 Producto y desacoplamiento

- BIM es opcional por empresa/proyecto y desaparece de la navegacion cotidiana
  cuando esta desactivado.
- Son validas las combinaciones Presupuesto solo, Presupuesto+Gantt,
  Presupuesto+BIM, Gantt+BIM y coordinacion tridominio.
- Desactivar BIM no elimina datos: suspende operacion y conserva historia en
  lectura/auditoria.
- La experiencia BIM es neutral y comun; entrada, acciones y prioridades se
  adaptan por capacidades, contexto, pendientes y preferencias.
- Planificacion 4D y costes 5D son el flujo central.

### 2.2 Fuentes de verdad y estados

- Presupuesto/APU gobierna coste, composicion, rendimiento y cantidad aprobada.
- Gantt gobierna fechas, dependencias, calendario y baseline.
- La version BIM gobierna geometria, GUID, propiedades y cantidades IFC.
- Ningun dominio sobrescribe otro silenciosamente.
- Gantt conserva su borrador operativo; Presupuesto conserva revisiones;
  BIM conserva versiones/publicacion; la coordinacion usa propuestas. No se
  crea un borrador universal de GiProy.
- El conjunto de coordinacion referencia revision presupuestaria, baseline Gantt
  y version/modelos BIM y orquesta diff, conflicto, propuesta, aprobacion,
  aplicacion y recuperacion.

### 2.3 Roles, capacidades y responsabilidades

- Stakeholder+rol expresa responsabilidad organizativa; Usuario+asignacion+
  capacidades expresa autorizacion tecnica.
- Vincular ambas identidades es explicito y no concede permisos silenciosamente.
- La autorizacion efectiva es acumulativa:

  `licencia/flag ∩ tenant ∩ proyecto ∩ modulo ∩ EDT ∩ capacidad ∩ recurso`.

- Las capacidades se acotan por empresa, proyecto y rama EDT.
- Un consultor integral puede proponer y aprobar cuando su asignacion lo permite.
- Administracion tecnica no implica autoridad economica o contractual.
- Los roles funcionales son plantillas configurables; las capacidades efectivas
  gobiernan backend y frontend.

### 2.4 OmniClass

- Con BIM nuevo, OmniClass se recomienda activado por defecto.
- No se cambia silenciosamente la configuracion de tenants existentes.
- Desactivar OmniClass con BIM activo exige confirmacion reforzada e impacto.
- Clasificacion IFC se preserva aun con OmniClass apagado, pero no se resuelve,
  filtra ni usa para propuestas 5D.
- Estado comun: desactivado, sin resolver, parcial, conflictivo o coordinado.
- La falta de coordinacion genera aviso destacado y cuantificado.
- Solo una politica contractual configurada convierte la falta de OmniClass en
  bloqueo.
- OmniClass puede asistir propuestas; nunca crea links automaticamente.

### 2.5 Vinculos y versiones

- Los vinculos linea/APU <-> actividad <-> elemento son muchos-a-muchos,
  cuantificados, versionados y con vigencia.
- Menos de 100% es cobertura incompleta permitida en borrador; mas de 100% es
  conflicto bloqueante para totales oficiales.
- Se admiten referencias no aditivas.
- Nueva version IFC conserva coincidencias GUID exactas; cualquier inferencia
  exige reconciliacion humana.
- Nueva revision de Proyecto crea un conjunto de coordinacion nuevo y hereda
  relaciones como propuestas, nunca como aprobadas.
- Una aplicacion multidominio parcial nunca se presenta como valida; usa estados,
  idempotencia y compensacion.

### 2.6 Experiencia y superficies

- Cinco modos: Planificacion y costes, Modelo, Coordinacion, Seguimiento y
  Entrega.
- Informes son salida contextual; Administracion BIM queda fuera del flujo diario.
- El workbench 4D/5D integra visor superior y superficie temporal-coste inferior.
- Presupuesto y Gantt especializados siguen siendo editores de profundidad con
  navegacion reversible y restauracion de contexto.
- Politica obligatoria:
  - lateral contextual para seleccion/edicion breve;
  - inferior para tiempo, coste, links y tablas persistentes;
  - drawer para exploracion/historial/busqueda auxiliar;
  - modal solo para decisiones acotadas;
  - workbench para procesos complejos;
  - un modal activo y un lateral abierto por defecto;
  - sin z-index, anchuras u overlays privados fuera del sistema comun.
- Herramientas se registran declarativamente con superficie, capacidades,
  contexto, lazy-load, desmontaje y pruebas.
- Seleccion y contexto son unicos y compartidos entre visor, Gantt, Presupuesto,
  incidencias, documentos y ubicacion.
- Vistas de presentacion y vistas de trabajo son contratos separados.

### 2.7 Migracion, piloto y plataformas

- Migracion frontend completa, no progresiva: un solo nuevo workspace.
- Se preservan y migran datos validos; se permiten campos/tablas adicionales.
- Tenant piloto: Santiago Bermeo, sin excepciones por nombre en codigo.
- Proyecto canonico persistido: `SantiagoBermeo-2026-001` (`#` solo visual).
- Estado verificado: revision 0 unica, Presupuesto 13 en elaboracion, Gantt y
  Cronograma Valorado vinculados, modelo `Duplex_A_20110907.ifc` ready/activo,
  144 elementos, 4 plantas y 2 vistas; faltan baseline, snapshots y links 4D/5D.
- El piloto sera federado por disciplinas y declarara partidas no modeladas.
- Transformaciones de federacion, coordenadas y unidades son versionadas.
- Telefonos fuera de alcance. Tablet fisica minima 1920x1080; funciones avanzadas
  dependen tambien de viewport CSS, puntero fino, hover y teclado.
- Chrome/Edge son referencia. Safari advierte divergencias. iOS/iPadOS se evalua
  por capacidades reales y no se asume Blink por instalar Chrome.

## 3. Arquitectura objetivo

### 3.1 Agregados principales

1. `ProjectCoordinationSet`: tenant, proyecto/root, revision, presupuesto,
   baseline, modelos/versiones, estado y vigencia.
2. `CoordinationIdentity`: identidad estable de linea/APU, actividad y elemento.
3. `CoordinationLink`: relacion muchos-a-muchos, asignacion, regla, fuente,
   vigencia y estado.
4. `CoordinationProposal`: diff, impacto, proponente, revisores y aplicacion.
5. `CoordinationConflict`: tipo, severidad, entidades, resolucion y evidencia.
6. `ClassificationResolution`: clasificacion IFC, referencia al maestro,
   confianza, estado y version.
7. `ProjectAuditEvent`: sobre comun inmutable con detalle por dominio y
   `correlation_id`.

### 3.2 Taxonomias comunes

Proceso:

`Borrador -> Pendiente de revision -> Aprobado/Rechazado -> Aplicando ->
Aplicado/Fallido-Requiere recuperacion`.

Coordinacion:

`No configurado | Incompleto | Desactualizado | En conflicto | Coordinado |
Suspendido`.

Severidad:

`Informativa | Advertencia | Alta | Critica`.

Los dominios conservan sus nombres propios. La taxonomia comun traduce y no
reemplaza estados existentes.

### 3.3 Flujo rector

`Preparar contexto -> Vincular -> Validar -> Simular -> Proponer -> Revisar ->
Aprobar -> Aplicar -> Seguir -> Informar`.

Si falta un dominio, el usuario entra igualmente y trabaja con los disponibles.
Las operaciones que necesitan triangulacion se deshabilitan con motivo y accion
siguiente; no se crean datos automaticamente.

## 4. Contrato UX y espacial

### 4.1 Desktop de referencia

- Referencia fisica: 1920x1080.
- La composicion usa contenedor CSS, no resolucion fisica ni DPR aislados.
- Cabecera BIM completa: maximo 88 px.
- Rail: 44-48 px.
- Un lateral por defecto: 280-360 px.
- Visor: minimo 65% del ancho util en flujo habitual.
- Superficie 4D/5D: 220-260 px iniciales, 36-40 px colapsada, maximo 35% de
  altura del contenedor.
- En resoluciones mayores crece informacion/area, no controles sin limite.

### 4.2 DPI y dispositivos

Matriz minima:

| Fisica | DPI |
| --- | --- |
| 1920x1080 | 100%, 125%, 150% |
| 2560x1440 | 100%, 125%, 150% |
| 3440x1440 | 100%, 125% |
| 3840x2160 | 100%, 150%, 200% |

- Zoom navegador: 80%-150%.
- Canvas adapta buffer a DPR con limite para GPU/memoria.
- Bajo superficie segura: modo reducido de consulta/revision; no edicion critica.
- Tablet compatible: minimo fisico y gates adicionales de entrada/viewport.

### 4.3 Navegacion y estados

- Entrada: pendientes prioritarios -> ultimo modo -> preferencia -> perfil ->
  Planificacion y costes.
- Navegacion profunda conserva proyecto, revision, entidad, camara, seleccion,
  filtros, fecha 4D y retorno.
- Bandeja unica de trabajo agrupa propuestas, conflictos, reconciliaciones,
  CDE, OmniClass y recuperaciones.
- Busqueda global se filtra desde backend por tenant, EDT, capacidades y ACL.
- Estados vacios y errores explican falta, impacto, responsable y siguiente paso.

## 5. Matriz coordinada de roles y capacidades

Perfiles sugeridos, nunca autoridad fija:

| Perfil | Prioridad | Capacidades sugeridas |
| --- | --- | --- |
| Consultor integral | ciclo completo | todas las funcionales del proyecto |
| Presupuestista/costes | 5D | ver/editar/proponer/aprobar costes segun asignacion |
| Planificador | 4D | ver/editar Gantt, baseline, link y propuesta |
| Coordinador BIM | modelo/coordinacion | importar, federar, clasificar, coordinar |
| Produccion/campo | seguimiento | avance, evidencia, incidencias e inspeccion |
| Revisor/aprobador | bandeja | revisar/aprobar segun dominio y umbral |
| Administrador BIM | operacion tecnica | modelos, versiones, publicacion, ACL |
| Superadministrador | gobierno global | soporte/rollout; sin autoridad economica implicita |

Capacidades nuevas a disenar, con nombres finales pendientes de contrato:

- coordinacion: ver, editar, proponer, revisar, aprobar, aplicar y recuperar;
- 5D: ver, vincular, proponer y aprobar costes/cantidades;
- baseline: proponer, aprobar y publicar;
- clasificacion: ver, resolver, aprobar y administrar politica;
- auditoria: ver, exportar y administrar retencion;
- migracion: dry-run y aplicar.

## 6. Dependency graph unico

```text
Autoridad de datos + identidad estable
    -> roles/asignaciones/capacidades por proyecto y EDT
        -> schemas + migraciones aditivas + ledger de auditoria
            -> contratos API + idempotencia + staging/preflight
                -> conjunto de coordinacion + links + propuestas + conflictos
                    -> resolucion OmniClass + federacion/unidades
                        -> shell + registro de herramientas + superficies
                            -> workbench 4D/5D
                                -> Modelo/Coordinacion/CDE
                                    -> Seguimiento/Entrega/Informes
                                        -> migracion dry-run
                                            -> piloto + QA + aprobacion de datos
```

Los contratos compartidos son secuenciales. Solo pueden paralelizarse slices
que consuman contratos ya congelados y no escriban el mismo estado.

## 7. Plan por slices verticales

Cada slice debe abrir una BIM-TASK y, si toca GiProy Clasico, una TASK de
integracion controlada. Ninguna task debe superar una sesion enfocada; si toca
mas de cinco archivos funcionales independientes, se divide.

### Fase A - Contratos y gobierno

#### S01 - Inventario canonico de roles, modulos y funciones

- Entrega: matriz actual/deseada de rol global, stakeholder, asignacion, modulo,
  EDT, capacidades y acciones.
- Aceptacion: cada funcion de Proyecto y BIM tiene responsable, permiso y estado;
  no hay autorizacion basada solo en frontend.
- Verificacion: pruebas de matriz y revision de endpoints actuales.
- Dependencias: ninguna.
- Rollback: documental.
- Cierre verificado: las 33 acciones canónicas cubren todas las capacidades sin
  huérfanas y publican dominio propietario, riesgo, dependencia BIM, estado,
  enforcement backend y perfiles responsables. El catálogo administrativo está
  protegido por `project.manage` y mantiene compatibilidad de contrato.

#### S02 - Autoridad, identidades y taxonomias

- Entrega: contrato de identidad y autoridad tridominio y estados comunes.
- Aceptacion: toda entidad/version se identifica sin `source_ref` ambiguo.
- Verificacion: schemas y tests de transiciones invalidas.
- Dependencias: S01.
- Cierre verificado: un vínculo con `activity_ref` o `bim_global_id` sin ID
  versionado se marca `draft_reference` y bloquea oficialización. La nueva
  reconciliación exige que actividad y elemento pertenezcan al tenant/proyecto y
  coincidan exactamente con la referencia histórica; debe resolver todas las
  ambigüedades en una transacción y queda auditada con motivo.

#### S03 - Capacidades por proyecto y EDT

- Entrega: grants acotados, perfiles sugeridos y separacion admin/economia.
- Aceptacion: consultor integral y perfiles restringidos pasan matriz tenant/EDT.
- Verificacion: tests backend 403/200 y frontend sin acciones indebidas.
- Dependencias: S01-S02.
- Cierre verificado: asignaciones, grants y perfiles se resuelven por tenant,
  proyecto y EDT; ausencia de asignación falla cerrada. Administrador técnico no
  hereda aprobación económica y consultor integral conserva el catálogo completo.
  Importaciones, búsqueda y herramientas visibles consumen la misma capacidad.

#### S04 - Ledger de auditoria de Proyecto

- Entrega: sobre comun inmutable, detalles de dominio y correlacion.
- Aceptacion: reconstruccion de una operacion coordinada sin exponer payloads.
- Verificacion: tests de inmutabilidad, permisos, retencion y multi-tenant.
- Dependencias: S02-S03.
- Cierre verificado: eventos inmutables, saneados, acotados y encadenados por
  hash; retención mínima de diez años sin purga automática. El escritor admite
  participar en la transacción de dominio (`commit=False`) y revierte con ella.
  Logs técnicos históricos se sellan de forma idempotente por huella, sin
  secretos ni contenido binario original.

### Checkpoint A

- Contratos congelados y versionados.
- Matriz roles/capacidades aprobada.
- Ninguna migracion real ejecutada.

### Fase B - Nucleo de coordinacion

#### S05 - Conjunto de coordinacion versionado

- Entrega: agregado que fija revision, presupuesto, baseline y modelos/versiones.
- Aceptacion: funciona con 1, 2 o 3 dominios; BIM apagado no rompe clasico.
- Verificacion: tests de combinaciones, vigencia y tenant.
- Dependencias: S02-S04.

#### S06 - Vinculos muchos-a-muchos cuantificados

- Entrega: links aditivos/no aditivos, cobertura y tolerancias.
- Aceptacion: cobertura <100 informa, >100 bloquea totales oficiales.
- Verificacion: tests dimensionales, redondeo y doble conteo.
- Dependencias: S05.

#### S07 - Propuestas, conflictos y aplicacion recuperable

- Entrega: diff, revision, aprobacion, idempotencia y compensacion.
- Aceptacion: fallo parcial nunca cambia referencia oficial.
- Verificacion: fallos inducidos en cada dominio y reintento seguro.
- Dependencias: S05-S06.

#### S08 - Staging e importaciones controladas

- Entrega: preflight comun para IFC/BCF/Gantt/Excel/conectores.
- Aceptacion: ningun import modifica dominio antes de confirmacion.
- Verificacion: archivos invalidos, duplicados, rollback y checksum.
- Dependencias: S04-S07.

### Checkpoint B

- Flujo API sin UI completa: preparar, vincular, proponer, aprobar, aplicar y
  recuperar.
- Prueba BIM off y aislamiento multi-tenant.

### Fase C - OmniClass y federacion

#### S09 - Clasificacion BIM versionada

- Entrega: asociaciones IFC y referencia gobernada al maestro existente.
- Aceptacion: preserva origen; no duplica catalogo ni genera links automaticos.
- Verificacion: parser, codigos no resueltos y `use_omniclass` off/on.
- Dependencias: S05, S08.

#### S10 - Resolucion, advertencias y politica contractual

- Entrega: estados, cobertura, conflictos, activacion/desactivacion informada.
- Aceptacion: usuario comprende la ruptura estructural; bloqueo solo por politica.
- Verificacion: tests configuracion tenant, API y mensajes UX.
- Dependencias: S09.

#### S11 - Federacion, coordenadas, unidades y reconciliacion

- Entrega: disciplinas, transformaciones, preflight y cambio de version/GUID.
- Aceptacion: medicion oficial solo con escala/unidad valida; inferencias revisadas.
- Verificacion: modelos desalineados, unidades distintas, split/merge/retirada.
- Dependencias: S05-S10.
- Cierre verificado: cada inferencia genera una huella determinista y requiere
  decisión explícita con motivo. Las divisiones/ambigüedades exigen seleccionar
  destino; la aprobación persiste y propaga los vínculos coordinados en una
  transacción, el rechazo no los altera y la repetición es idempotente.

### Checkpoint C

- Clasificacion y federacion operan contra el mismo conjunto de coordinacion.
- Cobertura y conflictos reproducibles por API.

### Fase D - Sistema UX comun y sustitucion completa

#### S12 - Shell, superficies y registro de herramientas

- Entrega: cinco modos, rail, lateral, inferior, drawer, modal y workbench.
- Aceptacion: ninguna herramienta crea overlays o dimensiones privadas.
- Verificacion: DOM/visual, foco, desmontaje, error boundary y lazy-load.
- Dependencias: contratos S01-S11 congelados.
- Cierre verificado: cinco modos mutuamente coordinados, visor con mínimo 65% de
  anchura, un único lateral y drawer inferior, regiones aisladas por error
  boundary, preferencias por proyecto, navegación por teclado, guardas de
  resolución física/DPI y aviso Safari. Validado a 1920x1080, escalado 125%,
  2560x1440/150%, 3840x2160/200% y tablet horizontal compatible.

#### S13 - Contexto, navegacion, busqueda y bandeja

- Entrega: seleccion unica, retorno profundo, busqueda autorizada y pendientes.
- Aceptacion: no se pierde camara/entidad/filtros; busqueda no filtra solo cliente.
- Verificacion: reload, permisos, EDT, referencias obsoletas y fallos parciales.
- Dependencias: S03-S04, S12.
- Cierre verificado: contexto profundo persistido en servidor con fallback local,
  referencias ausentes degradadas a selección vacía, carga parcial no fatal y
  búsqueda unificada resuelta en backend. Los resultados están aislados por
  tenant/proyecto y cada dominio (BIM, Gantt, Presupuesto) solo participa con su
  capacidad de lectura efectiva; la selección restaura el workspace pertinente.

#### S14 - Workbench Planificacion y costes 4D/5D

- Entrega: visor + tabla temporal-coste, links, cobertura, simulacion y propuestas.
- Aceptacion: partida -> actividad -> elemento en maximo dos acciones.
- Verificacion: flujo completo, baseline vs borrador, cantidad/coste y seleccion.
- Dependencias: S05-S13.
- Cierre verificado: el drawer único sincroniza selección Gantt/modelo, expone la
  partida heredada y crea el vínculo 5D/4D/BIM desde el contexto compartido. La
  referencia distingue el borrador Gantt de una baseline elegida y fijada;
  cobertura, sobreasignación, simulación y propuestas conservan revisión,
  aprobación, aplicación y recuperación explícitas.

#### S15 - Modelo, Coordinacion y CDE contextual

- Entrega: propiedades, versiones, conflictos, incidencias, documentos, RFI,
  submittals, IDS y vistas sin pestanas duplicadas.
- Aceptacion: cada funcion usa la superficie obligatoria y contexto compartido.
- Verificacion: ACL, viewpoint reproducible, cambio de version y reconciliacion.
- Dependencias: S11-S14.
- Cierre verificado: propiedades, vínculos, incidencias/BCF, documentos y ACL,
  RFI, submittals, IDS, comparación y federación comparten proyecto, versión,
  selección o viewpoint según su alcance. Las decisiones de cambio de versión
  son persistentes y ninguna inferencia modifica vínculos sin aprobación.

#### S16 - Seguimiento, Entrega e Informes

- Entrega: plan-real, avance, evidencias, cierre, dossier y salidas oficiales.
- Aceptacion: informes solo desde aprobado/aplicado; preliminares `NO OFICIAL`.
- Verificacion: BIM off, OmniClass incompleto, snapshots y reproduccion.
- Dependencias: S14-S15.
- Cierre verificado: plan-real, avance, as-built, commissioning, punch, dossier y
  transición O&M conservan sus estados gobernados. Los informes preliminares se
  marcan como no contractuales; los oficiales exigen referencia activa y fijan
  revisiones/IDs junto con una huella SHA-256 reproducible del snapshot.

### Checkpoint D

- Workspace anterior sin ruta visible ni duplicacion funcional.
- Build, tests y flujo completo en datos de prueba.

### Fase E - Migracion integral y piloto

#### S17 - Migracion aditiva y dry-run

- Entrega: backup, migraciones, transformadores e informe sin escritura final.
- Aceptacion: conteos/referencias conciliados y rollback ensayado.
- Verificacion: copia controlada, idempotencia y segundo dry-run sin cambios.
- Dependencias: S01-S16.

#### S18 - Adecuacion de SantiagoBermeo-2026-001

- Entrega: federacion multidisciplinar, baseline, snapshots, links, roles,
  capacidades, OmniClass y conflictos controlados.
- Aceptacion: datos reales via APIs; partidas no modeladas explicitamente.
- Verificacion: informe antes/despues y recorrido canonico reproducible.
- Dependencias: S17 y autorizacion posterior al informe.

#### S19 - Certificacion multidimensional

- Entrega: matriz navegador/DPI/zoom/contenedor/entrada, rendimiento,
  accesibilidad, permisos y multi-tenant.
- Aceptacion: cero solapes/truncados; gates de rendimiento; tablet compatible;
  clasico sin regresion con BIM off.
- Verificacion: automatizada y revision visual humana.
- Dependencias: S18.

#### S20 - Piloto y gate final

- Entrega: piloto minimo, evidencia, incidencias y decision de salida.
- Aceptacion: dos revisiones/modelos cuando proceda, ciclo completo y rollback.
- Verificacion: acta de aprobacion; ningun gate critico abierto.
- Dependencias: S19.

## 8. Matriz transversal minima por slice

Toda BIM-TASK/TASK debe incluir:

| Campo | Obligatorio |
| --- | --- |
| Impacto OmniClass | si / no + razon |
| Impacto tri-sincronizacion | si / no + contrato |
| Impacto UX/superficies | si / no + superficie |
| Roles/capacidades | lectura/escritura/aprobacion |
| Tenant/proyecto/EDT | scopes probados |
| BIM apagado | comportamiento clasico |
| Datos/migracion | aditiva, transformacion o ninguno |
| Auditoria | eventos y correlation ID |
| Pruebas | unitarias, contrato, DOM, visual, E2E |
| Rendimiento/DPI | presupuesto y perfiles |
| Rollback | tecnico, datos y UX |

## 8.1 Pesos y calculo de avance

El avance del programa se calcula sobre slices cerrados y verificados, no sobre
numero de archivos, lineas de codigo o percepcion subjetiva. Los pesos suman
100%:

| Fase | Slice | Peso total |
| --- | --- | ---: |
| A - Contratos y gobierno | S01 | 3% |
|  | S02 | 4% |
|  | S03 | 4% |
|  | S04 | 4% |
| B - Nucleo de coordinacion | S05 | 6% |
|  | S06 | 6% |
|  | S07 | 7% |
|  | S08 | 6% |
| C - OmniClass y federacion | S09 | 5% |
|  | S10 | 5% |
|  | S11 | 5% |
| D - UX y sustitucion completa | S12 | 5% |
|  | S13 | 6% |
|  | S14 | 7% |
|  | S15 | 6% |
|  | S16 | 6% |
| E - Migracion y piloto | S17 | 4% |
|  | S18 | 4% |
|  | S19 | 4% |
|  | S20 | 3% |
| **Total** |  | **100%** |

Reglas de calculo:

- `avance parcial del slice`: 0%-100% segun criterios de aceptacion verificados.
- `aporte total`: peso del slice multiplicado por su avance parcial.
- `avance de fase`: suma ponderada de sus slices / peso total de la fase.
- `avance total`: suma de aportes de S01-S20.
- Un slice solo aporta 100% de su peso cuando codigo, datos, pruebas,
  documentacion y rollback aplicables estan cerrados.
- Un cierre documental no aumenta el avance de implementacion salvo que sea un
  entregable y gate explicito del slice.
- Reabrir un criterio reduce el avance parcial y recalcula fase y total.

Estado base al aprobar este documento:

- Diagnostico y planificacion documental (`BIM-TASK-0193`): **100%**.
- Implementacion del plan coordinado S01-S20: **0%**.
- Avance total del programa de adecuacion coordinada: **0%**.

### Seguimiento de ejecucion (actualizado 2026-08-03, consolidación final)

Este bloque sustituye el estado base anterior una vez iniciada la ejecucion. Los
porcentajes son conservadores: un slice no se declara al 100% sin codigo, datos,
pruebas y evidencia documental.

| Slice | Avance parcial | Peso | Aporte verificado |
| --- | ---: | ---: | ---: |
| S01 | 100% | 3% | 3,00% |
| S02 | 100% | 4% | 4,00% |
| S03 | 100% | 4% | 4,00% |
| S04 | 100% | 4% | 4,00% |
| S05 | 100% | 6% | 6,00% |
| S06 | 100% | 6% | 6,00% |
| S07 | 100% | 7% | 7,00% |
| S08 | 100% | 6% | 6,00% |
| S09 | 100% | 5% | 5,00% |
| S10 | 100% | 5% | 5,00% |
| S11 | 100% | 5% | 5,00% |
| S12 | 100% | 5% | 5,00% |
| S13 | 100% | 6% | 6,00% |
| S14 | 100% | 7% | 7,00% |
| S15 | 100% | 6% | 6,00% |
| S16 | 100% | 6% | 6,00% |
| S17 | 100% | 4% | 4,00% |
| S18 | 100% | 4% | 4,00% |
| S19 | 100% | 4% | 4,00% |
| S20 | 100% | 3% | 3,00% |
| **Total programa S01-S20** |  | **100%** | **100,00%** |

| Fase | Avance de fase | Aporte al total |
| --- | ---: | ---: |
| A - Contratos y gobierno | 100,00% | 15,00% |
| B - Coordinación transaccional | 100,00% | 25,00% |
| C - Clasificación y federación | 100,00% | 15,00% |
| D - Experiencia BIM integrada | 100,00% | 30,00% |
| E - Migración, piloto y certificación | 100,00% | 15,00% |

Evidencia cerrada o verificada en esta consolidación:

- Auditoría final requisito por requisito cerrada en
  `BIM_COORDINATED_FINAL_AUDIT_2026-08-03.md`: implementación, revisión y goal
  verificados al **100,00%**, sin gates críticos abiertos.
- S20 cerrado: el piloto reproducible verificó baseline, 187 snapshots,
  federación factual, conjunto coordinado, grants, OmniClass, backup y ausencia
  de enlaces inferidos. No existen conflictos críticos; las cuatro advertencias
  controladas permanecen visibles. La decisión
  `release_approved_with_controlled_warnings` tiene huella
  `ca573f0d0819a00df2caf870def97419d3e0ea18efa590d1760b8abc2a71395b`
  y evento de auditoría idempotente. La referencia del proyecto no se declaró
  oficial mientras su coordinación sea incompleta.
- S19 cerrado: build Vite de `2.602` módulos, `35` recorridos/harnesses BIM,
  matriz adaptativa completa y `43/43` pruebas focales de capacidades, tenant,
  OmniClass, búsqueda, coordinación y migraciones. El workspace fue comprobado
  en 1920x1080, escala 125%, 2560x1440 a 150% y 3840x2160 a 200%, sin overflow,
  botones/campos sin nombre, tabindex positivo ni IDs duplicados. Chrome/Edge
  cumplieron el presupuesto de rendimiento en escritorio/tablet; Safari muestra
  la advertencia y recomienda Chromium en macOS/iPadOS. La navegación clásica y
  el tenant con BIM apagado permanecen libres de contaminación BIM.
- S18 cerrado: el proyecto real `#SantiagoBermeo-2026-001` quedó fijado a
  presupuesto `13`, cronograma `1`, baseline `SB-2026-R0` y versión BIM `1`.
  Se materializaron `187` snapshots 4D, una federación activa con el único
  modelo factual disponible, un conjunto de coordinación, cuatro conflictos
  abiertos y dos grants `administrador_bim`. OmniClass quedó activo para el
  tenant; las `201` partidas permanecen explícitamente sin clasificar y se
  crearon `0` enlaces automáticos. No se inventaron disciplinas, roles ni
  correspondencias ausentes.
- La carga S18 se ensayó dos veces sobre una restauración aislada y después se
  ejecutó dos veces en la base real. Los identificadores y conteos de dominio
  permanecieron estables y ambas pasadas reales produjeron la huella
  `a8b06602fa9439e3f0696856ba2a7837f4deec2c66d3bb61acecd838d4b06b92`.
  Cada invocación dejó su propio evento inmutable de auditoría, sin duplicar
  entidades funcionales.
- S17 cerrado: dump PostgreSQL 18 completo de 3.418.382 bytes, SHA-256
  `b87527cf5695fa20ab6b74bd7523f56394cefd9e70509cc0fe846715b7c04766`,
  2.967 entradas TOC y restauración aislada verificada con proyecto, 201
  partidas, cronograma y versión BIM originales. La base temporal fue eliminada.
- Ledger S04 cerrado con `9/9` pruebas: inmutabilidad, tamper detection,
  retención, saneamiento, rollback atómico e importación legacy idempotente.
- Capacidades S03 cerradas con `12/12` pruebas tenant/proyecto/EDT, separación
  técnica/económica, denegación fail-closed e intercambio de planificación.
- Identidades S02 cerradas: referencias históricas permanecen como borrador,
  no pueden oficializarse y se convierten a IDs canónicos solo por coincidencia
  exacta revisada. Núcleo `19/19`, build, smoke y DOM correctos.
- Inventario S01 cerrado: todas las capacidades tienen una acción canónica con
  propietario, estado, enforcement backend y perfiles responsables; catálogo,
  matriz y cobertura de mutaciones superan `11/11` pruebas.
- Seguimiento, entrega e informes superan `69/69` pruebas backend y los
  validadores visuales de plan-real, as-built, commissioning, punch, dossier y
  O&M. Cada salida incluye huella reproducible; lo preliminar permanece marcado
  `NO OFICIAL` y lo oficial exige referencia coordinada activa.
- Modelo, coordinación y CDE contextual superan `20/20` pruebas backend de
  federación, reconciliación, ACL, documentos, incidencias/BCF e IDS, además de
  siete validadores DOM específicos sin paneles superpuestos.
- El workbench 4D/5D fija de forma diferenciada Gantt borrador o baseline,
  proyecta la selección entre actividad y elemento y crea vínculos con partida
  en un máximo de dos acciones. Coordinación/4D `24/24`, build, smoke y DOM
  correctos.
- La búsqueda transversal ya no confía en filtrar un catálogo descargado: el
  backend limita por empresa/proyecto y capacidades efectivas, y devuelve
  elementos, actividades o partidas únicamente si son autorizados. Regresión de
  búsqueda/capacidades `12/12`, build, smoke y matriz DOM del workspace correctos.
- La reconciliación de versiones BIM conserva la decisión humana por candidato,
  detecta hashes obsoletos, exige destino explícito en split/ambiguous y actualiza
  vínculos aprobados atómicamente (30/30 pruebas focales backend, build y
  validador DOM de federación aprobados).
- Primer alta BIM activa OmniClass por defecto; una decisión posterior del
  tenant no se revierte automáticamente. Desactivar con BIM exige aceptación y
  motivo, conserva el origen, degrada resoluciones/conjuntos y deja auditoría.
- El conjunto fija las revisiones reales de Proyecto/Presupuesto y la pareja
  Presupuesto-Gantt; cualquier deriva impide oficializar la referencia antigua.
- Cobertura cuantificada normaliza unidades compatibles a base SI y crea
  conflicto bloqueante cuando una misma entidad mezcla dimensiones distintas.
- Las propuestas coordinadas aplican metadato gobernado y recuperable en una
  partida 5D, una actividad Gantt y un elemento BIM dentro de la misma
  transacción. La validación completa precede a cualquier mutación; un fallo
  tardío no deja cambios parciales y la recuperación restaura los tres estados.
- Un fallo de commit inducido en sesión aislada después de preparar los tres
  dominios conserva los tres estados originales; el reintento con la misma
  versión aplica todo una sola vez (15/15 pruebas S07).
- El importador IFC por jobs ya no puede escribir sin staging confirmado: el
  frontend ejecuta preflight/confirmación y backend vuelve a verificar dominio,
  formato, tenant, tamaño y SHA-256 antes de reclamar el payload. El consumo es
  exclusivo, libera el staging ante fallo y devuelve el mismo job en reintentos.
- MSPDI, Primavera P6 XML y P6 XER mantienen el staging confirmado entre el
  análisis y “Guardar revisión”; la escritura vuelve a contrastar dominio,
  formato, nombre y checksum y conserva rollback/versionado del cronograma BIM.
- JSON individual/lote, manifiestos IFC, IFC texto/archivo y BCF comparten el
  mismo reclamo exclusivo. Los reintentos consumidos devuelven el resultado
  persistido; bytes alterados, otro tenant o distinta operación reciben 409.
- Regresión S08: 64 pruebas backend focales, build Vite y validador DOM de
  intercambio 4D aprobados. El cierre HTTP BCF añade rechazo sin staging,
  consumo confirmado y reintento idempotente (16/16 pruebas del grupo final).
- Dry-run real repetido para `#SantiagoBermeo-2026-001`: dos ejecuciones de
  solo lectura, cero escrituras y huella determinista
  `d0e92b0cedc53c9f89f1ce08c2b2ea41bc7afc6c640b6e6de506b8f8b3693643`.
- Manifiesto de siete migraciones Alembic con SHA-256, clave de idempotencia,
  backup PostgreSQL completo y restauración exigida sobre copia aislada.
- Contrato de capacidades por proyecto/usuario/EDT y envolvente de auditoria.
- Nucleo de conjuntos, vinculos multidominio, propuestas y resolucion OmniClass.
- Sustitucion del shell BIM por cinco flujos coordinados, con 4D/5D como entrada.
- Una sola region lateral, visor minimo del 65%, cabecera de 84 px y banda temporal
  limitada a 220-260 px.
- Build de produccion correcto y matriz DOM/visual correcta en 1920x1080, 125%
  DPI, tablet horizontal y guarda de resolucion no compatible.
- Transición explícita a referencia oficial con permiso, motivo, bloqueo de
  sobreasignación y convivencia con uno, dos o tres dominios.
- Bandeja integrada de propuestas con revisar, aprobar, aplicar y recuperar.
- Dry-run de `#SantiagoBermeo-2026-001` con inventario tridominio y cero
  escrituras, documentado en
  `BIM_SANTIAGO_BERMEO_DRY_RUN_REPORT_2026-08-03.md`.
- SQL Alembic de upgrade/downgrade generado offline y esquema real actualizado
  hasta `de2064a1b2c3` tras verificar el backup restaurable.
- Staging común con checksum, confirmación y consumo idempotente para IFC, BCF,
  Gantt, Excel, JSON y conectores coordinados.
- Suite focal del núcleo y capacidades correcta; build y 37 validadores/smokes
  BIM correctos.
- El snapshot 4D conserva ahora la partida presupuestaria de origen, validada
  contra proyecto y tenant. La selección compartida del Gantt y del visor llega
  al control coordinado y permite crear en una sola acción un vínculo
  partida-actividad-elemento; si la actividad histórica carece de partida, la
  UI crea solo el vínculo 4D/BIM y mantiene visible la ruptura 5D.
- Los informes 4D/5D declaran contrato v2, estado preliminar/oficial y marca de
  agua. La salida oficial falla cerrada si no existe una referencia coordinada
  oficial activa o si la línea base solicitada no coincide; la UI mantiene la
  opción oficial deshabilitada y advierte la falta de validez contractual.
- El ledger de Proyecto es inmutable y encadenado mediante SHA-256 por tenant y
  proyecto, limita y sanea payloads, expone verificación de integridad y permite
  reconstruir por módulo y correlación la historia de una operación coordinada.
  La cobertura estática obliga a auditar las mutaciones materiales de Proyecto,
  Presupuesto, Gantt, EDT, EDO, interesados y fórmula polinómica. La política
  impide purga automática, fija retención mínima de 3.650 días, contempla
  retención legal y exige verificar integridad antes de archivar.
- La suite transversal de gobierno y coordinación queda en `45 passed`; también
  se corrigió la identidad de subbarras Gantt sin padre inicial y la normalización
  de `session_id` a `created_from_session`. La migración aditiva
  `de2062a1b2c3` está preparada, pero no se aplicó al esquema real.
- El catálogo de capacidades incorpora un inventario canónico y neutral de 33
  acciones de Proyecto, Presupuesto, Gantt, BIM, clasificación, coordinación y
  migración. Cada acción declara dominio, capacidad, dependencia opcional de BIM
  y riesgo; `consultor_integral` conserva todas las capacidades, mientras los
  perfiles restringidos son solo presets y no autoridad fija. La prueba de
  contrato y endpoints queda en `9 passed`.
- Los vínculos coordinados distinguen identidad canónica de referencia heredada:
  los borradores pueden conservar `activity_ref` y `bim_global_id`, pero una
  referencia oficial exige los IDs versionados de snapshot y elemento. El panel
  cuantifica la ruptura, explica la reconciliación y bloquea la aprobación antes
  de que el usuario llegue a un error tardío. Coordinación/staging: `12 passed`;
  build de producción correcto.
- Los accesos clásicos a Presupuesto, Gantt, interesados y EDO incorporan un
  puente fail-closed al contrato de capacidades de Proyecto. Un usuario sin
  asignación ya no atraviesa silenciosamente los helpers legacy; administrador y
  consultor integral conservan sus contratos diferenciados. Regresión funcional:
  `26 passed`; matriz focal de capacidades y denegación: `9 passed`.
- El agregado coordinado verifica seis combinaciones operativas: Presupuesto,
  Presupuesto+Gantt, BIM, Presupuesto+BIM, Gantt+BIM y tridominio. Conserva
  revisiones monotónicas y aislamiento tenant. La cobertura contabiliza los
  vínculos aditivos y mantiene visibles los no aditivos sin duplicar totales;
  tolerancia decimal, unidades, sobreasignación e identidad duplicada permanecen
  cubiertas. Núcleo coordinado: `12 passed`.
- El staging común valida firma, extensión, dominio, checksum, tenant y usuario
  para IFC, BCF, MSPDI, P6 XML, P6 XER, XLSX, JSON y conectores. Preflight y
  confirmación son idempotentes, y el manifiesto acredita cero escrituras de
  dominio. Staging+nucleo: `22 passed`; los importadores históricos aún deben
  consumir obligatoriamente el stage confirmado antes de aplicar.
- La federación compara dos versiones del mismo modelo y separa GUID retenidos,
  altas, retiradas, sustituciones, divisiones y fusiones mediante una firma
  semántica revisable. Toda inferencia declara `requires_review`, ninguna se
  aplica automáticamente y la UI de Federación presenta el resumen antes de
  cualquier decisión. Federación/OmniClass: `8 passed`; build correcto.
- Las superficies CDE RFI, submittals, colaboración, incidencias, diario de obra
  y aprobación de estimaciones dejan de imponer anchos privados o notificaciones
  fijas sobre el workspace. Sus master-detail y vistas triples se reorganizan por
  el espacio asignado, conservan scroll local y no crean overlays. Siete
  validadores DOM, incluida Federación, y build de producción quedan correctos.
- La carga del contexto usa resultados parciales: el workspace base sigue
  operativo si fallan vistas guardadas, índice de elementos o vínculos; un
  indicador discreto identifica exactamente la fuente ausente. Solo el fallo del
  contrato principal activa el estado fatal. Build, smoke y validador DOM del
  workspace quedan correctos.

Pendiente para cerrar fases: aislamiento transaccional definitivo del escritor
de auditoría y migración de logs técnicos legacy, inventario exhaustivo de
acciones, staging común de todos los importadores, flujo 4D/5D con datos
reales, accesibilidad/rendimiento/matriz 4K, Safari real, aplicación autorizada
de migraciones, piloto y gate final.
- Programa BIM tecnico historico 61/61: no se recalcula ni se mezcla con este
  nuevo porcentaje de adecuacion.

## 8.2 Informe obligatorio de cada cierre

Cada cierre parcial o completo debe registrar, en la TASK, el plan rector y el
CHANGELOG:

```text
Slice/TASK: Sxx / identificador
Avance parcial del slice: NN%
Peso del slice en el programa: NN%
Aporte acumulado del slice: NN.NN%
Avance de la fase: NN.NN%
Avance total del programa coordinado: NN.NN%
Estado de gates: aprobados / pendientes / reabiertos
Evidencia: pruebas, build, migracion/dry-run, QA visual y rollback
```

No se admite un cierre que indique solo `completado`, `100%` o un porcentaje
aislado. Deben aparecer siempre el porcentaje parcial y el porcentaje total.
Si el trabajo no corresponde a un slice ponderado, debe informar `aporte total:
0%` y explicar que es diagnostico, soporte o documentacion no ponderada.

## 9. Gates de calidad

### Gate funcional

- Presupuesto -> Gantt -> BIM -> propuesta -> aprobacion -> aplicacion ->
  seguimiento -> informe.
- Operacion valida con BIM apagado y con dominios faltantes.

### Gate UX

- Sin solapes, truncados, modales apilados o scroll global indebido.
- Un lateral por defecto y contexto restaurable.
- Acciones comprensibles sin depender solo de iconos/tooltips.

### Gate seguridad

- Resolucion backend de tenant, proyecto, modulo, EDT, capability y ACL.
- Admin tecnico sin autoridad economica implicita.
- Busqueda, vistas y auditoria no elevan permisos.

### Gate datos

- Backup y dry-run revisados.
- Idempotencia y reconciliacion de conteos.
- Ninguna escritura real antes de autorizacion posterior.

### Gate plataforma

- Matriz fisica/DPI/zoom/contenedor aprobada.
- Chrome/Edge certificados; Safari con divergencias documentadas.
- Telefonos excluidos; tablet solo si supera capacidades y superficie.

### Gate rendimiento

- Shell interactivo, primera geometria, FPS, seleccion y filtros dentro de
  presupuestos medidos y calibrados con hardware de referencia.
- Buffer DPR limitado y funciones secundarias lazy-load.

## 10. Riesgos y mitigaciones

| Riesgo | Impacto | Mitigacion |
| --- | --- | --- |
| Repetir silos por frente | critico | dependency graph, matriz transversal y gate unico |
| Convertir OmniClass en enlace automatico | alto | solo sugerencias revisables y fuente visible |
| Romper GiProy Clasico | critico | BIM off en cada slice y TASK de integracion separada |
| Roles nominales sustituyen permisos | alto | capacidades backend por proyecto/EDT |
| Paneles vuelven a crecer | alto | registro/superficies y visual tests obligatorios |
| Migracion pierde evidencia | critico | backup, dry-run, aditiva, idempotente y rollback |
| Piloto falsamente completo | alto | partidas no modeladas y conflictos explicitos |
| DPI/4K degrada GPU | alto | layout por contenedor y DPR cap |
| Estado parcial multidominio | critico | referencia oficial inmutable, idempotencia y compensacion |
| Auditoria expone datos | alto | sobre minimo, detalle protegido y logs sin payloads |

## 11. Pendientes no bloqueantes de verificacion

- Calibrar cifras finales de rendimiento contra hardware de referencia.
- Inventariar todas las funciones actuales para clasificar reutilizar/adaptar/
  fusionar/reemplazar/retirar.
- Auditar calidad y cobertura de cada disciplina IFC adicional del piloto.
- Definir nombres finales y granularidad exacta de capacidades nuevas.
- Determinar politicas contractuales/umbrales iniciales por empresa/proyecto.
- Generar informe de dry-run antes de cualquier modificacion real.

## 12. Condicion de inicio y cierre

La implementacion solo inicia tras crear y aprobar las TASKs de S01-S04. Los
datos reales solo se modifican tras S17 y autorizacion explicita del informe.
El programa solo cierra con S20, sin gates criticos abiertos y con evidencia del
proyecto canonico.

Todo checkpoint y cierre actualiza obligatoriamente el avance parcial del slice,
el avance de su fase y el avance total ponderado del programa.
