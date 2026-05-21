# Presupuesto - Resolución de conflictos entre modo selección y modo tanteo

## Objetivo
Eliminar ambigüedades operativas cuando el usuario alterna entre `selección múltiple` y `tanteo` desde el árbol de líneas de presupuesto.

## Problema detectado
- si el tanteo está abierto y el usuario usa `Ctrl/Cmd + clic` sobre una línea, el tanteo no se cierra automáticamente
- si la selección múltiple está activa y el usuario usa `Shift + clic`, no se abandona la selección para abrir tanteo
- `Escape` hoy sirve para abandonar la selección, pero no abandona también el modo tanteo

## Criterio de adecuación
- `Ctrl/Cmd + clic` sobre una línea:
  - debe priorizar `selección`
  - debe cerrar `tanteo` si estuviera abierto
- `Shift + clic` sobre una línea:
  - debe priorizar `tanteo`
  - debe abandonar `modo selección`
  - debe limpiar la selección grupal visible
- `Escape`:
  - debe cerrar `modo selección` si está activo
  - debe cerrar `modo tanteo` si está activo
  - si ambos estuvieran activos por una inconsistencia, debe dejar el presupuesto en estado normal

## Alcance
- endurecer la resolución de conflictos entre modos en `LineasPresupuestoTab`
- unificar el comportamiento de `Escape`
- mantener intacta la navegación interna ya existente del panel de tanteo
- no alterar el look & feel ni la estructura del árbol

## Resultado esperado
- solo un modo operativo principal activo cada vez
- `Ctrl/Cmd` siempre fuerza flujo de selección
- `Shift` siempre fuerza flujo de tanteo
- `Escape` devuelve el presupuesto a estado neutral
