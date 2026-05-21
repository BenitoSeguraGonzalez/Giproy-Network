# Project To APU Editor Context Navigation

## Objetivo
Hacer que `Pasar al Módulo APU` desde `Proyecto` abra el editor/creador de APUs, no el catálogo general, y permitir un retorno explícito a `Proyecto > Presupuesto`.

## Alcance
- Redirección contextual desde `Proyectos.jsx`.
- Entrada contextual en `APUs.jsx`.
- Retorno controlado al detalle de proyecto en la pestaña `Presupuesto`.
- Preservación de avisos por cambios sin guardar al volver.

## Resultado
- El CTA de proyecto activa la base de la revisión y navega a `APUs` en modo editor.
- `APUs` reconoce el contexto de entrada desde proyecto.
- Cuando la entrada es contextual, aparece `Volver al módulo Proyecto`.
- El retorno aterriza en `Proyectos?project_id=...&tab=presupuesto`.
