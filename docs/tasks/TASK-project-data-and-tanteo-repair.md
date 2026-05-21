# TASK: Reparacion Datos de Proyecto + Tanteo

## TASK-01

**Objetivo**
Identificar el contenedor real de scroll del detalle de proyecto y centralizar ahi el control del `wheel`.

**Archivos afectados**
- `frontend/src/pages/Proyectos.jsx`
- `frontend/src/components/projects/DatosProyecto.jsx`

**Dependencias**
- Ninguna

**Validacion**
- El handler de scroll no depende solo del hijo `DatosProyecto`

## TASK-02

**Objetivo**
Implementar el modo de scroll dividido solo cuando el panel derecho completo esta visible.

**Archivos afectados**
- `frontend/src/pages/Proyectos.jsx`
- `frontend/src/components/projects/DatosProyecto.jsx`

**Dependencias**
- TASK-01

**Validacion**
- Si el panel derecho cabe completo, la rueda desplaza solo la izquierda
- Si no cabe, el scroll vuelve a ser conjunto

## TASK-03

**Objetivo**
Rehacer el bloque comparativo de `Tanteo` con una grilla fija y filas simetricas por columna.

**Archivos afectados**
- `frontend/src/components/presupuestos/TanteoTab.jsx`

**Dependencias**
- Ninguna

**Validacion**
- Valor original y simulado quedan exactamente alineados
- Unidad visible en ambos lados
- Delta no altera la altura del valor

## TASK-04

**Objetivo**
Validar compilacion y dejar criterio de prueba manual para confirmacion de usuario.

**Archivos afectados**
- Ninguno adicional

**Dependencias**
- TASK-02
- TASK-03

**Validacion**
- `npm run build`
- checklist manual de ambos comportamientos

