# BIM-TASK-0108 - Conflictos espacio-tiempo 4D

Estado: Cerrada y validada

## Objetivo

Detectar solapes temporales de frentes/componentes que comparten espacio o
geometria, con severidad, evidencia y viewpoint reproducible.

## Resultado

- Detección derivada de solapes entre actividades vinculadas a frentes,
  componentes y elementos BIM.
- Severidad crítica por geometría compartida, alta por componente y media por
  frente, con intervalo, actividades y `GlobalId` reproducibles.
- Panel BIM compacto con resumen, actualización y foco en el modelo.

## Validación

- Prueba focal de geometría compartida y suite BIM completa: `109 passed`.
- Build Vite, smoke Classic, workspace BIM y timeline 4D en verde.
