# Project Base Sync Executive Confirmation - ExecPlan

## Objetivo
Rediseñar la experiencia de sincronización entre `Base Maestra` y `Base de Proyecto` para que funcione como una decisión operativa breve, con resumen ejecutivo y confirmación explícita, sin listados técnicos ni vistas previas extensas.

## Problema detectado
- El modal actual está sobredimensionado y muestra listados que no ayudan a decidir.
- La interfaz mezcla selección, análisis técnico y confirmación en un mismo flujo.
- El usuario necesita una respuesta ejecutiva:
  - qué tipo de sincronismo va a ejecutar
  - sobre qué revisión
  - cuántos elementos se variarán
  - si el presupuesto y derivados se recalcularán
  - y una confirmación binaria clara

## Alcance
- Mantener los tres tipos de sincronismo:
  - `APUs nuevas`
  - `Valores de APU`
  - `Sincronismo integral`
- Mantener selección de revisión cuando existan varias revisiones.
- Sustituir la vista previa detallada por un resumen ejecutivo.
- Convertir el mensaje final en una confirmación explícita de continuar o cancelar.
- Mantener la reversión solo desde el historial.

## Principios UX
- No mostrar listados de APUs, recursos o divergencias dentro del modal principal.
- No mostrar previews tipo inspección técnica.
- Mostrar solo contadores y estados de impacto.
- La interfaz debe resolver una decisión, no un análisis.

## Resumen operativo esperado
El modal debe mostrar únicamente:
- `APUs nuevas`
- `APUs con valores a reajustar`
- `Recursos a actualizar`
- `Subcategorías implicadas`
- `Presupuesto`
  - `Tendrá variación` / `Sin variación`
- `Cronogramas y derivados`
  - `Tendrán variación` / `Sin variación`
- `Tanteos`
  - `Se conservarán, recalculados con los nuevos precios`

## Confirmación final
La última interacción no debe ser un aviso pasivo. Debe ser una decisión binaria:
- `Confirmar sincronización`
- `Cancelar`

Con copy del estilo:
- `Esta sincronización reajustará valores del presupuesto y otros elementos del proyecto. ¿Desea continuar?`

## Historial
El historial debe permanecer como superficie secundaria y operativa.
Debe mostrar:
- usuario
- fecha/hora
- revisión
- tipo de sincronismo
- opción `Revertir` cuando corresponda

No debe transformarse en una vista analítica de preview.

## Resultado esperado
- Flujo mucho más corto
- Menor ruido visual
- Decisión operativa clara
- Confirmación explícita y honesta
- Misma lógica funcional backend, con una experiencia mucho más usable
