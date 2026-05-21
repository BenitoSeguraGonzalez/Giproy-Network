# Presupuesto Base Scope Integrity - Execplan

## Objetivo
Eliminar la mezcla de APUs/recursos entre bases de trabajo dentro de presupuestos y dejar una regla inviolable tanto en código como en base de datos.

## Diagnóstico
- La mezcla real estaba en `presupuesto_detalles.apu_id`: algunas líneas del presupuesto operativo del proyecto apuntaban a APUs de una base distinta a la `base_trabajo_id` del proyecto.
- La base de datos lo permitía porque la FK solo validaba existencia del APU, no coherencia contextual con el proyecto.
- `create_revision(...)` clonaba líneas de presupuesto heredando `apu_id` sin remapear a la nueva base.
- `POST /presupuestos/{id}/lineas` aceptaba cualquier `apu_id` y recalculaba sin validar el scope.

## Implementación
1. Resolver APU canónico por base destino.
2. Reparar líneas mezcladas existentes y recalcular presupuestos afectados.
3. Remapear líneas al crear revisiones.
4. Bloquear altas futuras en endpoint/servicio.
5. Blindar la BD con triggers:
   - `presupuesto_detalles`: APU y EDT deben pertenecer al contexto del presupuesto/proyecto.
   - `apu_lineas`: recurso y APU hijo deben pertenecer a la misma base/empresa del APU padre.

## Validación
- Tests nuevos de saneamiento y clonación de revisión.
- Smoke test en DB real para detectar mezcla de:
  - presupuestos
  - APU -> recurso
  - APU -> APU hijo
- Reparación ejecutada sobre `Santiago Bermeo` y revalidación en cero.
