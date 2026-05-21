# Plan de ajuste - Trazabilidad entre APU de presupuesto, base de proyecto y base maestra

## Contexto
En `Presupuesto` se estaba interpretando como inconsistencia una diferencia entre:

- el APU mostrado desde la línea de presupuesto
- el APU abierto desde la base de proyecto
- el APU maestro de origen

El diagnóstico real confirmó dos factores:

1. La comparación se estaba haciendo entre APUs distintos del mismo bloque (`5-023-0001` vs `5-023-0002`).
2. El APU de proyecto puede estar `heredado` y `divergente`, por lo que no siempre coincide con la base maestra aunque comparta origen.

## Objetivo
Hacer explícita en la interfaz la identidad exacta del APU activo y su relación con el maestro para evitar falsas lecturas de desincronización.

## Ajustes
- Mostrar en el editor APU de presupuesto el código exacto del APU activo.
- Mostrar el origen maestro asociado cuando exista `source_apu_id`.
- Mostrar el estado de sincronización (`Local`, `Heredado`, `Divergente`) con lectura operativa.
- Dejar trazado documental el diagnóstico para futuras incidencias de sincronización.

## Criterios de cierre
- El usuario puede distinguir visualmente qué APU exacto está editando desde presupuesto.
- Si el APU es heredado, puede ver cuál es su maestro asociado.
- Si el APU está divergente, la UI lo comunica sin ambigüedad.
