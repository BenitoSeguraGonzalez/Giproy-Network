# Project Base Sync Regulation And UX Tuning - ExecPlan

## Objetivo
Regularizar el caso real de `Santiago Bermeo` para que la `Base de Proyecto` vuelva a quedar alineada con su `Base Maestra`, refrescando además el presupuesto asociado, y compactar el modal de sincronización para que vuelva a ser usable en viewport real.

## Diagnóstico
- La base de proyecto `34` arrastraba `12` APUs heredados divergidos frente a la base maestra `32`.
- El presupuesto operativo `13` consumía esos APUs vivos de la base de proyecto, por lo que heredaba el desfase.
- El modal de sincronización estaba leyendo mal el impacto presupuestario porque el frontend usaba claves distintas a las que entregaba el backend (`presupuestos_afectables` / `presupuestos_con_lineas`).
- La composición visual del modal era demasiado alta, sin scroll interno ni contraste suficiente en `Impacto operativo`.

## Enfoque
1. Ejecutar una regulación real usando la rutina operativa `integral` ya existente.
2. Registrar el resultado con snapshot/undo e histórico, sin rutas especiales ni saneamientos paralelos.
3. Verificar que `compare_bases` quede en cero divergencias y que el presupuesto se recalcule con los APUs regulados.
4. Compactar el modal:
   - menos altura visual
   - scroll interno
   - lectura correcta del impacto presupuestario
   - bloque `Impacto operativo` con más contraste

## Resultado esperado
- `Base Proyecto = Base Maestra` para el caso actual de `Santiago Bermeo`.
- Presupuesto operativo recalculado con precios alineados a la maestra.
- Historial de sincronización con evento reversible de la regulación aplicada.
- Modal de sincronización más corto, más claro y usable.
