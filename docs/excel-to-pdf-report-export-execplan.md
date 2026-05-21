# Excel To PDF Report Export ExecPlan

## Objetivo
Añadir un tercer carril de exportación para reportes:
- `Excel`
- `PDF nativo`
- `PDF desde Excel`

La intención es permitir un PDF que replique el formato del `.xlsx` sin reemplazar el PDF actual.

## Diseño
- Nuevo formato de exportación backend: `pdf_excel`.
- El backend genera primero el `.xlsx` con la plantilla real del reporte.
- Después intenta convertir ese `.xlsx` a PDF usando Microsoft Excel por COM en un helper aislado con timeout.
- El frontend muestra la opción como un tercer botón en el visor común de reportes.

## Componentes
- `backend/app/schemas/reporting.py`
- `backend/app/api/endpoints/reporting.py`
- `backend/app/services/reporting.py`
- `backend/scripts/convert_excel_to_pdf.py`
- `frontend/src/components/reporting/CommonReportPreviewModal.jsx`
- handlers de exportación en:
  - `PresupuestoDetail.jsx`
  - `APUs.jsx`
  - `EdtValoradaModal.jsx`
  - `DesagregacionTab.jsx`
  - `FormulaPolinomicaTab.jsx`

## Riesgos / Limitaciones
- La conversión `Excel -> PDF` depende de una sesión COM de Microsoft Excel utilizable en la instancia que ejecuta el backend.
- En entornos sin Office instalado o sin sesión COM operable, el carril existe pero devolverá un error operativo claro.

## Resultado esperado
- El usuario puede escoger `PDF desde Excel` cuando necesita máxima fidelidad visual respecto al `.xlsx`.
- El PDF nativo actual se mantiene como opción rápida y estable.
