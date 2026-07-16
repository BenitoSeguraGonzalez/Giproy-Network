# BIM-TASK-0138 - UX de nivelacion de recursos 4D

Estado: Cerrada localmente

## Objetivo

Exponer el motor de nivelacion como flujo operativo del Workspace BIM V2 para
la resolucion minima soportada de 1920x1080.

## Cambios

- Seleccion de linea base y recurso dentro del panel BIM de capacidad.
- Accion de simulacion y comparacion de sobrecargas antes/despues.
- Conteo de actividades desplazadas y etiqueta de revision del proyecto.
- Aprobacion y rechazo auditables de escenarios propuestos.
- Cliente API BIM dedicado y harness Playwright aislado.

## Validacion

- `npm run build`: OK, con warning conocido de chunks grandes.
- `npm run smoke:bim-workspace-v2`: OK.
- Playwright de nivelacion a 1920x1080: OK.
- Smoke de no contaminacion BIM en GiProy Clasico: OK.
- Baseline enterprise con frontend: OK.

## Rollback

Retirar el panel/harness y los metodos API de nivelacion. El motor y sus
escenarios pueden permanecer inaccesibles o eliminarse con el rollback de
`BIM-TASK-0137`; GiProy Clasico no cambia.

