# ExecPlan - Saneamiento de regresión en orden persistente de líneas APU

## Objetivo
Recuperar la persistencia real del orden de recursos/APUs hijos dentro del editor APU para que ese orden vuelva a reflejarse de forma consistente en reportes y demás consumidores.

## Hallazgo
- El editor APU seguía permitiendo reordenar visualmente las líneas dentro de cada categoría.
- Ese reordenamiento ya no disparaba la persistencia inmediata al backend para APUs existentes.
- Los reportes siguen leyendo base de datos, así que mostraban el último orden persistido y no el orden recién ajustado en el editor.
- Además, la normalización backend del payload deducía la categoría sin consultar `recurso_id`, dejando la lógica demasiado frágil para futuros saneamientos.

## Causa raíz
1. El `drag and drop` del editor quedó reducido a mutación local de `formApu.lineas`.
2. El endpoint backend `PUT /apus/{id}/lineas/move` seguía existiendo, pero dejó de usarse desde la UI.
3. La normalización de líneas en `apu_service` no resolvía el código de recurso desde `recurso_id` cuando el payload no llevaba `recurso_codigo`.

## Estrategia
1. Rehabilitar persistencia inmediata del reordenamiento en APUs ya guardados.
2. Mantener comportamiento local para APUs nuevos no persistidos.
3. Blindar backend para inferir correctamente la categoría al normalizar el payload.
4. Validar que reportes sigan leyendo `orden` persistido sin lógica adicional.

## Tasks
- `TASK-0772`: Rehabilitar persistencia inmediata del orden de líneas APU desde el editor.
- `TASK-0773`: Endurecer backend y consumidores para no perder el orden persistido en reportes.

## Criterio de cierre
- Un APU existente reordenado en el editor actualiza su orden persistido sin esperar al guardado completo.
- El reporte APU vuelve a reflejar ese mismo orden.
- La normalización backend ya no depende de `recurso_codigo` ausente cuando existe `recurso_id`.
