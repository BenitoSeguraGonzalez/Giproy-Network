# Cronograma Trabajo Date Picker And MS Project Audit

## Objetivo
Mejorar la edición de fechas del workbench de `Cronograma de Trabajo` y dejar visible el diagnóstico real del carril `MS Project`.

## Alcance
- Añadir un control híbrido de fecha:
  - entrada visible en `dd/mm/yyyy`
  - selector visual de calendario
- Mantener una única normalización de fechas al guardar.
- Auditar la detección real de `MS Project` en backend.
- Alinear el CTA frontend con el estado real de exportación `.mpp`.

## Resultado
- `Inicio` ya se puede escribir en `dd/mm/yyyy` y además abre un calendario nativo al entrar en el campo.
- La normalización sigue guardando en ISO y mostrando siempre `dd/mm/yyyy`.
- El CTA `MS Project` deja de desaparecer sin explicación:
  - siempre es visible
  - si no está disponible, muestra el motivo real del bloqueo
- La auditoría confirma que esta instancia backend solo expone `XML` porque no dispone de una sesión COM utilizable para Microsoft Project.
