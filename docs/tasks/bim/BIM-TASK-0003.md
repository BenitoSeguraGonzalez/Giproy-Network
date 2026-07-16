# BIM-TASK-0003: shell frontend BIM

## Estado
Parcialmente implementada

## Equivalente historico
`TASK-0548`.

## Objetivo
Crear la shell frontend BIM desacoplada, protegida por flags y visualmente
coherente con GiProy.

## Estado real 2026-07-01
Existen `BimTab`, `BimWorkspace` y componentes BIM dedicados. En
`Proyectos.jsx`, la experiencia clasica conserva BIM apagado mediante
`CLASSIC_BIM_ACCESS_DISABLED`, por lo que la shell no esta expuesta a usuarios
clasicos.
