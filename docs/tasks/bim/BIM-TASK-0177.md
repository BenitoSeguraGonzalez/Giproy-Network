# BIM-TASK-0177 - Recuperacion de red y aislamiento de scope CDE

Fecha: 2026-07-20
Estado: Cerrada localmente; pendiente de repeticion desplegada
Modo: GIPROY BIM

## Objetivo

Hacer que el cliente de colaboracion CDE recupere presencia y actividad tras
fallos temporales, pestañas ocultas o cambios de proyecto, sin mezclar cursores
ni datos entre scopes BIM.

## Alcance ejecutado

- Los eventos `online` y `visibilitychange` visible disparan heartbeat y
  recuperacion incremental inmediatos.
- El estado offline informa degradacion y se limpia al recuperar la conexion.
- Cada empresa/proyecto reinicia presencia, eventos y cursor antes de consultar.
- Las respuestas tardias de un scope anterior se descartan.
- Los polls solapados del mismo scope se bloquean para evitar carreras y carga
  duplicada.

## Validacion

- Build Vite: correcto; warning de chunks grandes conocido.
- Smoke focal en `1920x900` y `2560x1300`: correcto.
- Recuperacion `online`, cambio de proyecto y ausencia de datos previos: correctos.
- Cadena completa de 35 smokes BIM: correcta.
- Captura visual sin overflow ni solapamientos: correcta.

## No interferencia clasica

El cambio se limita al componente/harness BIM de actividad CDE. No modifica
rutas, APIs, datos, componentes ni experiencia de GiProy Clasico.

## Limite declarado

La recuperacion del cliente queda certificada localmente. H03 permanece parcial
hasta repetir el flujo con latencia, desconexion y usuarios reales en servidor.

## Rollback

Revertir el control de scope/eventos de red y sus aserciones del smoke. El
polling y contratos CDE de `BIM-TASK-0174` permanecen funcionales.

## Resultado

Paridad: 88,33%. Programa: 51/61 slices, 83,61% realizado y 16,39% pendiente.
