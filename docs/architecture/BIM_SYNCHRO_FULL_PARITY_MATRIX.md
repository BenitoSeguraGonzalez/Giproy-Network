# Matriz de Adecuacion Funcional Bentley SYNCHRO - GiProy BIM

Fecha de corte: 2026-07-13
TASK de gobierno: `BIM-TASK-0127`
Estado: baseline contractual v1; no implica paridad completa ni autorizacion de
despliegue adicional.

## 1. Objetivo y limite

Esta matriz convierte la oferta funcional publica de Bentley SYNCHRO en
criterios verificables para GiProy. El objetivo es paridad funcional propia,
no copiar interfaces, codigo, formatos internos ni marcas de Bentley.

Fuentes oficiales de referencia:

- https://www.bentley.com/software/synchro/
- https://blog.bentley.com/software/what-is-synchro-4d/
- https://www.bentley.com/wp-content/uploads/Comp-Sheet-SYNCHRO-LTR-EN-LR.pdf
- https://www.bentley.com/wp-content/uploads/ebook-meet-synchro-en.pdf

La afirmacion `100%` solo sera valida cuando las 60 capacidades esten en
`completa`, Gate K este aprobado y el piloto humano Gate E tenga evidencia real.

## 2. Metodo de puntuacion

- `Completa` = 1 punto: contrato, flujo de producto, persistencia, permisos y
  pruebas end-to-end demostrados.
- `Parcial` = 0,5 puntos: existe una pieza real, pero falta alcance, UX,
  interoperabilidad o validacion requerida.
- `Ausente` = 0 puntos.
- Un harness aislado no convierte por si solo una capacidad en completa.
- Una capacidad no puede cerrarse solo con mocks, documentacion o datos
  sinteticos.

## 3. Baseline verificable

### A. SYNCHRO 4D y Modeler

| ID | Capacidad | Estado | Evidencia o brecha principal |
|---|---|---|---|
| A01 | Programacion y simulacion 4D | Completa | `BIM-TASK-0091` a `0112`, `0126` |
| A02 | Areas y frentes de trabajo | Completa | `BIM-TASK-0100` |
| A03 | Componentes construibles | Completa | `BIM-TASK-0101`, `0113` a `0122` |
| A04 | QTO y WBS/codigos de coste | Completa | snapshots QTO IFC, cobertura, aprobacion unica y paquete 5D versionado |
| A05 | Modelos federados | Completa | `BIM-TASK-0081` |
| A06 | Lineas base y plan-real | Completa | `BIM-TASK-0098`, `0099` |
| A07 | Escenarios what-if | Completa | `BIM-TASK-0102` |
| A08 | Filtros por fase, actividad, material y propiedades | Completa | viewer, timeline y workspace V2 |
| A09 | Recursos y nivelacion | Completa | `BIM-TASK-0137/0138`: escenarios CPM reversibles, capacidad diaria, gobierno y UX por revision |
| A10 | Ensayo digital y comunicacion visual | Completa | playback, seguridad, equipos e informes 4D |

### B. Scheduling e interoperabilidad

| ID | Capacidad | Estado | Evidencia o brecha principal |
|---|---|---|---|
| B01 | Crear y editar cronograma CPM | Completa | Cronograma clasico como fuente y snapshot BIM |
| B02 | Importar/exportar Primavera P6 XER/XML | Parcial | `BIM-TASK-0132/0188`: P6 XML y subconjunto XER con round-trip interno; round-trip Oracle pendiente |
| B03 | Importar/exportar Asta Powerproject | Ausente | requiere formato autorizado y corpus real |
| B04 | Intercambio MS Project XML | Completa | `BIM-TASK-0131/0134/0139`: preview, export, revisiones, gobierno y UX BIM |
| B05 | Interoperabilidad amplia CAD/BIM | Parcial | `BIM-TASK-0187`: IFC2X3/IFC4/IFC4X3_ADD2 y Fragments; no cubre la amplitud propietaria publicada |
| B06 | API, webhooks y conectores de terceros | Completa | `BIM-TASK-0173`: API ERP, webhooks HMAC, outbox recuperable y controles SSRF |

### C. SYNCHRO Control / CDE

| ID | Capacidad | Estado | Evidencia o brecha principal |
|---|---|---|---|
| C01 | Gestion documental versionada | Completa | `BIM-TASK-0140`: revisiones inmutables, checksum, descarga, archivo y UX CDE |
| C02 | RFIs e incidencias | Completa | `BIM-TASK-0083/0141`: BCF 2.1 y workflow RFI gobernado, contextual y auditable |
| C03 | Submittals y planos de ingenieria | Completa | `BIM-TASK-0142`: expedientes revisionados, decisiones, reenvio y documento CDE fijado |
| C04 | Permisos granulares por proyecto/documento | Completa | ACL BIM por documento y usuario para ver, descargar, revisar y administrar (`BIM-TASK-0143`) |
| C05 | Geolocalizacion en modelo y mapa | Completa | ancla BIM versionada, mapa operativo y selección de versión federada sincronizada (`BIM-TASK-0144`) |
| C06 | Revision 4D colaborativa web | Completa | Workspace V2 y seleccion Gantt-3D |
| C07 | Comentarios y revisiones contextuales | Completa | hilo CDE sobre revisión exacta, elemento/viewpoint, responsable, decisiones y notificaciones (`BIM-TASK-0145`) |
| C08 | Dashboards de documentos, RFIs y responsables | Completa | `BIM-TASK-0146`: metricas CDE con ACL, carga por responsable y cola de vencimientos |

### D. SYNCHRO Field

| ID | Capacidad | Estado | Evidencia o brecha principal |
|---|---|---|---|
| D01 | Aplicacion/PWA de campo | Ausente | workspace vigente es desktop >=1920x1080 |
| D02 | Operacion offline cifrada | Ausente | sin cache, outbox ni resolucion de conflictos |
| D03 | Documentos disponibles en campo | Completa | `BIM-TASK-0147`: acceso y descarga de revision CDE vigente con ACL desde Campo desktop |
| D04 | Incidencias y fotografias de campo | Completa | `BIM-TASK-0083/0148`: issue BCF, workflow Campo y fotos integras SHA-256 en PostgreSQL |
| D05 | Observaciones y diario de obra | Completa | `BIM-TASK-0104/0149`: diario consolidado sobre partes 4D, observacion oficial y evidencia |
| D06 | Modelo 3D/4D movil | Ausente | debe ser superficie separada del workspace desktop |
| D07 | Inspecciones, checklists y punch lists | Completa | `BIM-TASK-0116/0150`: checklist estructurado, histórico y punch items gobernados |
| D08 | Sincronizacion offline/online auditable | Ausente | no implementada |

### E. SYNCHRO Perform

| ID | Capacidad | Estado | Evidencia o brecha principal |
|---|---|---|---|
| E01 | Productividad diaria por frente | Completa | `BIM-TASK-0103` a `0105` |
| E02 | Valor ganado y KPIs | Completa | `BIM-TASK-0105` |
| E03 | Valores reales contra actividades | Completa | progreso y plan-real persistidos |
| E04 | Impacto de eventos no planificados | Completa | `BIM-TASK-0102/0151`: what-if y evento real costo/plazo gobernado y trazable |
| E05 | Diarios, comentarios y evidencia | Completa | `BIM-TASK-0104/0149`: detalle diario, metricas y evidencia trazable en Campo desktop |
| E06 | Informes diarios y semanales | Completa | `BIM-TASK-0110` |
| E07 | Materiales, equipos y recursos de campo | Completa | `BIM-TASK-0044/0115/0152`: recursos, equipos y ciclo de recepcion/consumo/retorno trazable |
| E08 | Partes de horas y directorio de cuadrillas | Completa | `BIM-TASK-0153`: directorio BIM sin identidades personales y partes diarios por actividad/frente |

### F. SYNCHRO Cost

| ID | Capacidad | Estado | Evidencia o brecha principal |
|---|---|---|---|
| F01 | Estimacion basada en QTO | Completa | `BIM-TASK-0085/0154`: QTO aprobado, precios completos y estimacion BIM gobernada |
| F02 | Contratos | Completa | `BIM-TASK-0155`: compromisos tenant-aware sobre estimacion aprobada y workflow gobernado |
| F03 | Solicitudes y certificaciones de pago | Completa | `BIM-TASK-0156`: solicitud, envio y certificacion contra contrato BIM activo |
| F04 | Schedule of Values | Completa | `BIM-TASK-0157`: asignacion completa, versionada y aprobable del compromiso contractual |
| F05 | Ordenes y potenciales ordenes de cambio | Completa | `BIM-TASK-0158`: PCO gobernadas, decision auditable e impacto transaccional sobre contrato y SOV BIM |
| F06 | Coste real desde campo | Completa | `BIM-TASK-0105/0159`: partes con coste acumulado y ledger incremental, inmutable, multi-moneda y tenant-aware |
| F07 | Forecast de costo final | Completa | `BIM-TASK-0160`: snapshot versionado/aprobable de presupuesto, compromiso, real, ETC, EAC y variacion |

### G. Entrega, commissioning y gemelo digital

| ID | Capacidad | Estado | Evidencia o brecha principal |
|---|---|---|---|
| G01 | Modelo as-built versionado | Completa | `BIM-TASK-0161`: version inmutable, calidad/checksum congelados y aceptacion as-built gobernada |
| G02 | Commissioning | Completa | `BIM-TASK-0162/0163`: registro trazable, protocolos/resultados y aceptacion tecnica gobernada |
| G03 | Punch list de terminacion | Completa | `BIM-TASK-0083/0116/0150/0164`: hallazgos operativos y cierre de entrega ligado al as-built |
| G04 | Dossier digital de entrega | Completa | BIM-TASK-0165/0166: manifiesto SHA-256, revalidación y aceptación gobernada |
| G05 | Transicion a operacion/gemelo digital | Completa | BIM-TASK-0167/0168: baseline SHA-256, revalidación y activación gobernada |

### H. Plataforma empresarial

| ID | Capacidad | Estado | Evidencia o brecha principal |
|---|---|---|---|
| H01 | Multiempresa y aislamiento tenant | Completa | pruebas tenant-aware y puertas BIM |
| H02 | Auditoria sensible | Completa | correlation id y auditoria BIM |
| H03 | Colaboracion cloud/CDE | Completa | `BIM-TASK-0174` a `0182`: presencia/feed, concurrencia, metricas, recuperacion cliente, escala de 100.000 eventos y certificacion HTTPS beta con dos sesiones y rafaga 205 drenada 100/100/5 |
| H04 | Notificaciones y escalamiento | Completa | `BIM-TASK-0145/0169`: matriz operacional tenant-aware, deduplicada, escalada y con acuse |
| H05 | Mapas y servicios de ubicacion | Completa | `BIM-TASK-0171`: catalogos XYZ/WMS revisados, tenant-aware y operativos sobre georreferencia BIM |
| H06 | Integracion ERP de progreso y horas | Completa | `BIM-TASK-0172`: paquetes pull deterministas, versionados, publicados y checksum-exactos |
| H07 | Seguridad, backup y recuperacion BIM | Completa | `BIM-TASK-0090/0170/0183`: restore local checksum-exacto y restauracion beta pre-ola con fingerprint clasico intacto |
| H08 | Conformidad internacional demostrada | Parcial | `BIM-TASK-0184`/`0187`: evidencia interna ISO 19650-1..6, IFC2X3/IFC4/IFC4X3_ADD2, IDS 1.0 y BCF 2.1; faltan certificacion IFC por version/producto y auditoria ISO externa |

## 4. Resultado inicial

- Capacidades evaluadas: `60`.
- Completas: `20`.
- Parciales: `20`.
- Ausentes: `20`.
- Puntuacion conservadora: `(20 + 20 x 0,5) / 60 = 50,00%`.

Este porcentaje sustituye cualquier estimacion informal de paridad integral con
Bentley. No modifica el cierre al 100% del nucleo 4D propio ya autorizado.

## 5. Orden de adecuacion

1. `BIM-TASK-0128`: contratos de evidencia, fixtures y validador de matriz.
2. `BIM-TASK-0129`: factibilidad legal/tecnica de formatos propietarios.
3. `BIM-TASK-0130` a `0139`: scheduling, interoperabilidad y Modeler/QTO.
4. `BIM-TASK-0140` a `0146`: Control/CDE.
5. `BIM-TASK-0147` a `0153`: Field desktop; PWA, movil y offline permanecen
   brechas explicitas mientras rija el contrato minimo 1920x1080.
6. `BIM-TASK-0154` a `0160`: Perform.
7. `BIM-TASK-0161`: aceptacion as-built; `BIM-TASK-0162` a `0172`: resto de
   commissioning y handover.
9. `BIM-TASK-0173` a `0183`: integraciones, escala y resiliencia.
10. `BIM-TASK-0184` a `0188`: conformidad, Gate E, certificacion y rollout.

## 6. Regla de liberacion

No se desplegara una ola por estar programada. Cada ola necesita migraciones
aditivas, pruebas focales, baseline enterprise, BIM apagado/encendido, rollback
probado y evidencia de producto. El despliegue general permanece bloqueado
hasta Gate K; durante el desarrollo solo se admite beta con allowlist `1,3`.
