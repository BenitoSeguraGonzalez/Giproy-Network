# BIM-TASK-0011: feature flags y activacion progresiva

## Estado
Parcialmente implementada

## Equivalente historico
`TASK-0556`.

## Objetivo
Controlar activacion BIM por entorno, empresa, usuario o modulo, con apagado
limpio y validacion de GiProy Clasico con flags desactivadas.

## Estado real 2026-07-01
Existen `BIM_ENABLED`, allowlists y configuracion `admin-bim`. En
`Proyectos.jsx` la UX clasica permanece apagada con
`CLASSIC_BIM_ACCESS_DISABLED`.
