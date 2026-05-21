# Saneamiento de regresión: persistencia del orden de recursos en APUs

## Contexto
El editor de `Precios Unitarios > Análisis de Precios Unitarios (APU)` seguía permitiendo reordenar recursos dentro del APU, pero ese orden ya no se reflejaba de forma consistente en consumidores persistentes como reportes. La UX daba la impresión de que el orden había quedado guardado, pero en realidad parte del circuito solo estaba reordenando en memoria.

## Diagnóstico
Se detectaron dos focos de regresión:

1. **Persistencia frontend perdida**
   - El `drag and drop` del editor actualizaba `formApu.lineas` de forma local.
   - Ya no estaba invocando de forma inmediata el endpoint persistente `moveLinea`.
   - Resultado: el editor mostraba el nuevo orden, pero reportes y consumidores que leen desde base de datos seguían usando el orden anterior hasta un guardado posterior.

2. **Blindaje backend debilitado**
   - La normalización de orden backend dependía de `recurso_codigo` o `codigo`.
   - En algunos flujos de edición, esa metadata ya no llegaba completa.
   - Resultado: el saneamiento de `orden` podía reconstruirse de forma ambigua y reordenar de forma no deseada cuando el payload llegaba sin código de recurso.

## Objetivo
Restaurar el comportamiento histórico correcto:

- Reordenar recursos en un APU existente debe persistirse inmediatamente.
- Ese mismo orden debe verse igual en editor, detalle, consumidores y reportes.
- El backend debe poder reconstruir el orden con seguridad aunque el payload no traiga `recurso_codigo`.

## Plan de saneamiento

### TASK-0772
Rehabilitar la persistencia inmediata del orden en el editor APU.

- Reutilizar el endpoint persistente `apusApi.moveLinea`.
- Mantener optimismo local para no romper la UX actual.
- Revertir el cambio local si backend rechaza la persistencia.
- Mantener sin cambios el comportamiento local de APUs nuevos aún no guardados.

### TASK-0773
Blindar backend para que la normalización del orden no dependa de metadata incompleta.

- Resolver `recurso_codigo` desde `recurso_id` cuando no llegue en el payload.
- Mantener la agrupación categórica histórica por orden técnico.
- Confirmar que consumidores como reporting ya leen por `orden` persistido.

## Criterios de cierre

- El reordenamiento en APUs existentes persiste al soltar la línea.
- El orden reaparece igual al reabrir el APU.
- Reportes vuelven a reflejar el mismo orden persistido.
- El backend no depende de `recurso_codigo` embebido para conservar el orden correcto.
