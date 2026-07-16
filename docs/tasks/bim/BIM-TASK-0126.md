# BIM-TASK-0126 - Planificacion 4D bidireccional Gantt y modelo

Estado: Cerrada y desplegada en beta

## Objetivo

Convertir la planificacion 4D del Workspace BIM V2 en una experiencia unica y
operativa: Gantt, cursor temporal y modelo 3D deben compartir seleccion y fecha
de corte sin duplicar Cronograma ni introducir dependencias desde GiProy
Clasico hacia BIM.

## Referencia funcional oficial

Se contrasto la solucion con la documentacion publica oficial de Bentley:

- https://www.bentley.com/software/synchro/
- https://blog.bentley.com/software/what-is-synchro-4d/

El patron adoptado es la superficie coordinada de programa, simulacion y modelo.
No se replica la estructura interna de SYNCHRO ni se introduce una integracion
Bentley, iTwin, OAuth o dependencia externa.

## Criterios verificables

- Timeline y Gantt conviven en una sola superficie `Secuencia 4D`.
- Seleccionar una actividad resalta todos sus GlobalIds en Fragments, plano 2D
  y viewer Three, encuadra la seleccion y mueve la fecha de corte.
- Seleccionar un elemento desde 3D, arbol, busqueda o vinculo resalta todas sus
  actividades relacionadas en el Gantt.
- El Gantt permite linea base, busqueda, filtros de vinculadas y criticas,
  escalas dia/semana/mes, dependencias, cursor y centrado de seleccion.
- Las relaciones muchos-a-muchos usan snapshots BIM existentes; Cronograma
  clasico permanece como fuente de verdad y no cambia su contrato.
- El workspace opera solo a partir de 1920x1080 y no monta UX movil.
- BIM apagado mantiene GiProy Clasico sin contaminacion.

## Cambios

- `BimPlanning4dPanel` integra timeline y Gantt.
- `bimPlanningSelection.js` formaliza actividad-elementos y
  elemento-actividades.
- `BimWorkspace` comparte cursor y seleccion entre paneles y visores.
- `BimFragmentsViewport` aplica seleccion multi-GUID nativa sobre modelos
  federados, color primario/secundario y foco por bounding box combinado.
- Los viewers 2D y Three reciben resaltado multi-elemento equivalente.
- `BimGanttPanel` incorpora grilla virtualizada, barras, dependencias y filtros.
- El drawer temporal V2 adopta altura y overflow adecuados para escritorio.
- `vite.config.js` conserva Three, web-ifc y That Open en el chunk dedicado
  `bim-3d`, evitando una regresion de carga en `BimTab`.

## Validacion

- `npm run build`: OK; solo warning conocido de chunks grandes.
- `npm run smoke:bim-workspace-v2`: OK.
- `smoke-bim-planning-bidirectional`: OK.
- `smoke-bim-workspace-positive`: OK.
- `validate-bim-schedule-4d-dom`: OK.
- `validate-bim-timeline-4d-dom`: OK.
- `validate-bim-advanced-4d-gate`: OK con 50k actividades.
- Playwright 1920x1080: canvas WebGL no vacio, bidireccion, sin overflow y
  guarda 1366x768 verificadas.
- `smoke-classic-no-bim-contamination`: OK.
- `validate_enterprise_baseline.py --include-frontend`: OK.

## No impacto clasico

No se modifican backend, PostgreSQL, auth, JWT, tenant, EDT, APUs, Presupuesto,
Cronograma clasico, Proyectos clasico ni las guardas TASK-1779 a TASK-1807.

## Rollback

Revertir los componentes y smokes listados en esta TASK. La puerta BIM de
rollout y entitlement conserva el apagado inmediato para que la UX no se monte.
No se requiere rollback de datos ni migracion.

## Estado de liberacion

El slice esta cerrado y desplegado en beta al 100%. Gate E continua pendiente
del piloto humano real ya definido; esta mejora tecnica no sustituye sus
jornadas ni revisiones.

## Despliegue beta

- servidor: `192.168.18.106`, dominio `https://giproy.excomconsultores.com`;
- backup de fuentes: `deploy/backups/bim-task-0126-20260713-195506`;
- imagen previa: `giproy-beta-frontend:bim-task-0126-predeploy-20260713-195506`;
- imagen desplegada: `sha256:515e0370bc499719095ed9650f35f19a30591bb5683c40ac36bcb87f283a2052`;
- chunk: `BimTab-DIFbSNXO.js`, `276630` bytes y HTTP `200` publico;
- chunk 3D separado: `bim-3d-JAfuxNS3.js`, `1988254` bytes;
- home publico `200` y endpoint BIM sin autenticacion `401`;
- marcadores `data-bim-planning-4d` y `data-bim-planning-selection` presentes;
- frontend recreado y saludable; backend y PostgreSQL no fueron recreados;
- allowlist preservada: `is_enabled=true`, `superadmin_only=false`, empresas
  `1,3`.

## Rollback beta

Etiquetar la imagen previa como `giproy-beta-frontend:beta` y recrear solo el
servicio frontend. Para recuperar tambien el arbol fuente, restaurar los
archivos de `deploy/backups/bim-task-0126-20260713-195506/files` y eliminar las
rutas registradas en `missing-files.txt`. No hay rollback de DB.
