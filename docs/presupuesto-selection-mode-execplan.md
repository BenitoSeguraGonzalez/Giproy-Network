# Presupuesto Selection Mode ExecPlan

## Objetivo
Sustituir la selección múltiple libre con `Ctrl/Cmd` por un patrón más estable de `modo selección` dentro de `Proyecto > Presupuesto`.

## Problema
- la selección libre mezclaba líneas entre capítulos EDT
- el navegador entraba en selección de texto al usar modificadores
- el árbol de presupuesto no se comporta como una lista plana y necesita un ámbito de selección más explícito

## Solución
- añadir un `modo selección` reversible
- mostrar `checkboxes` solo cuando ese modo esté activo
- limitar la selección múltiple al mismo capítulo EDT
- mantener `Shift` como extensión de rango dentro de la rama actual
- limpiar la selección al cambiar de capítulo o salir del modo

## Resultado esperado
- presupuesto limpio en modo normal
- trabajo en grupo más explícito y menos propenso a errores
- continuidad visual con el look & feel del workbench actual
