# Normalización de capitalización en descripciones operativas

## Resumen
Se detecta inconsistencia visual en descripciones operativas del sistema: algunas superficies muestran textos totalmente en mayúsculas y otras respetan la mezcla de origen. Esto rompe lectura, uniformidad y percepción de calidad en reportes, presupuesto y edición de APUs.

## Objetivo
- Normalizar la presentación de descripciones a una capitalización operativa simple:
  - solo la letra inicial en mayúscula
  - resto del texto en minúscula
- Mantener la regla como ajuste de presentación y no como mutación de datos de negocio.

## Criterios
- Afectar únicamente descripciones y nombres operativos visibles.
- No tocar códigos, unidades, badges, labels técnicos ni claves funcionales.
- Priorizar superficies transversales:
  - visor común de reportes
  - impresión de preview
  - presupuesto
  - catálogo lateral de APUs
  - tanteo
  - editor APU de presupuesto

## Ejemplos esperados
- `COMIDA` -> `Comida`
- `EJEMPLO DE CAPITALIZACION` -> `Ejemplo de capitalizacion`
- `Agua POTABLE` -> `Agua potable`

## Orden de ejecución
1. Crear utilidad compartida de capitalización operativa.
2. Aplicarla en reportes y superficies de presupuesto/APUs.
3. Eliminar clases `uppercase` donde forzaban descripciones a todo mayúsculas.
4. Validar build y revisar que no se rompan códigos ni unidades.

## Resultado esperado
- Las descripciones visibles dejan de alternar entre mayúsculas plenas y capitalización mixta.
- La aplicación gana una lectura uniforme sin tocar la persistencia original de datos.

