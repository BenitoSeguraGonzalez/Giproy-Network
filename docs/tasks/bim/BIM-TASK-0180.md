# BIM-TASK-0180 - Drenaje resiliente del feed CDE

Fecha: 2026-07-20
Estado: Cerrada localmente; despliegue beta pendiente
Modo: GIPROY BIM

## Objetivo

Evitar que una rafaga superior al limite de pagina deje al cliente CDE
convergiendo lentamente o sin conocer el backlog, sin abrir dependencias hacia
GiProy Clasico.

## Alcance ejecutado

- El feed consulta `limit + 1` y expone `has_more` de forma aditiva.
- La instantanea inicial conserva los eventos mas recientes y no presenta el
  historico anterior como una cola drenable hacia adelante.
- Con cursor previo, el cliente drena hasta cinco paginas por ciclo.
- Cada pagina debe avanzar el cursor cuando `has_more=true`; en caso contrario,
  el cliente corta con error y evita un loop infinito.
- El cursor solo se publica tras confirmar que la respuesta pertenece al scope
  empresa/proyecto activo, conservando las guardas de `BIM-TASK-0177`.
- Servidores anteriores sin `has_more` siguen siendo compatibles.

## Validacion

- `py_compile`: correcto.
- Backend focal: 5 pruebas correctas.
- Rafaga de 205 eventos: paginas 100/100/5, cursores monotonos y cierre limpio.
- Harness Playwright: drenaje multipagina, cambio de scope y recuperacion
  online correctos en 1920x900 y 2560x1300.
- Inspeccion visual: sin canvas vacio, solapamiento ni overflow horizontal.

## No interferencia clasica

El contrato es aditivo y vive exclusivamente en schemas, servicio, endpoint ya
existente y componente BIM bajo feature flag. No cambia rutas ni datos
clasicos, auth, tenant, Gantt, EDT, APUs o Presupuesto.

## Limite declarado

La resiliencia local ante rafagas queda cerrada. H03 sigue parcial hasta
desplegar la ola y obtener evidencia con dos usuarios y red real.

## Rollback

Retirar `has_more`, volver a consulta de una pagina y revertir las pruebas. No
hay migracion ni dato persistente que revertir.

## Porcentaje

Paridad: 88,33%. Programa: 54/61 slices, 88,52% realizado y 11,48% pendiente.
