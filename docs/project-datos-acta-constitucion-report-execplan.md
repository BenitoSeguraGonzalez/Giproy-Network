# Project Datos Acta Constitucion Report ExecPlan

## Objetivo
Activar el primer reporte real del nuevo carril `Proyecto > Reporte` usando la sección `Datos de Proyecto` y la plantilla:

- `001 - Acta de Constitucion - General`

## Diseño
- Reutilizar el flujo estándar de `Presupuesto > Reportes`:
  - selector de plantilla
  - preview
  - exportación `Excel`
  - exportación `PDF`
  - exportación `PDF desde Excel`
- Resolver el documento desde datos reales de:
  - `Proyecto`
  - `ProyectoDetalle`
- Mantener el botón de sección ya introducido como entry point común.

## Backend
- Nuevo `report_type`: `acta_constitucion`
- Generación Excel basada en plantilla sin tabla repetitiva, solo hooks.
- Preview y PDF nativo adaptados a documentos de ficha/acta con:
  - tarjetas resumen
  - campos clave del proyecto

## Frontend
- `DatosProyecto.jsx` deja de usar placeholder y abre un modal real de reporte.
- Se reutiliza `CommonReportPreviewModal`, extendiéndolo para soportar:
  - `summary_cards`
  - `fields`

## Resultado esperado
- `Proyecto > Datos de Proyecto > Reporte` ya genera el `Acta de Constitución del Proyecto` con datos reales.
