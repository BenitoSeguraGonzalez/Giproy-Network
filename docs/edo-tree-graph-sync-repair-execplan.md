# ExecPlan: Saneamiento de sincronización entre árbol y gráfico en EDO/EDT

## Objetivo
Restaurar la continuidad entre la vista árbol y la vista gráfica en `Proyectos > EDO`, endureciendo además `EDT` por compartir la misma arquitectura de selección.

## Diagnóstico
- El árbol y el gráfico compartían `selectedIds`, pero no un foco único de nodo.
- La selección recursiva del árbol y la selección unitaria del gráfico competían entre sí.
- Al cambiar de vista, la interfaz podía perder el nodo “activo” aunque la selección múltiple siguiera viva.

## Estrategia
1. Separar `selección múltiple` de `nodo activo`.
2. Usar `activeNodeId` como fuente de verdad para sincronizar árbol y gráfico.
3. Mantener `selectedIds` solo para acciones masivas.
4. Autoexpandir la rama activa al volver al árbol.
5. Aplicar el mismo endurecimiento en `EDT` para evitar regresión espejo.

## Tasks
- `TASK-0790`: Restaurar sincronización funcional árbol/gráfico en `EDO`.
- `TASK-0791`: Endurecer `EDT` y `HierarchyGraphView` con el mismo contrato de foco activo.

## Validación
- Seleccionar nodo en árbol y comprobar reflejo al pasar a gráfico.
- Seleccionar nodo en gráfico y comprobar reflejo/scroll al pasar a árbol.
- Verificar que selección múltiple sigue funcionando para acciones masivas.
- Verificar `npm run build`.
