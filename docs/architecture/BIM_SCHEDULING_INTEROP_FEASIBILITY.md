# Factibilidad de Interoperabilidad de Planificacion BIM

Fecha de corte: 2026-07-13
TASK: `BIM-TASK-0129`
Estado: decision arquitectonica cerrada; adaptadores abiertos implementados y validacion externa pendiente.

## 1. Objetivo

Definir formatos y limites legales/tecnicos para la paridad funcional de
intercambio con Primavera P6, Microsoft Project y Asta Powerproject sin copiar
formatos internos ni introducir dependencias obligatorias en GiProy Clasico.

## 2. Fuentes oficiales

- Oracle P6 Import/Export API y guias XML/XER:
  https://docs.oracle.com/en/industries/construction-engineering/primavera-cloud/rest-api/api-p6-import-export.html
- Microsoft Project XML Data Interchange (MSPDI):
  https://learn.microsoft.com/en-us/office-project/xml-data-interchange/project-xml-data-interchange-schema-reference
- Elecosoft Powerproject Import/Export:
  https://help.elecosoft.com/powerproject/english/help/Content/HTML_Topics/Dialogs/D_Backstageimportexport.htm
- buildingSMART IFC:
  https://technical.buildingsmart.org/standards/ifc/

## 3. Decisiones

| Formato/canal | Decision GiProy | Motivo |
|---|---|---|
| P6 XML | Nativo prioritario import/export | XML documentado, baselines y datos de proyecto |
| P6 XER | Adaptador opcional controlado | Oracle lo identifica como formato propietario; exige fixtures autorizados |
| MSPDI XML | Nativo import/export | esquema de intercambio publicado por Microsoft |
| MPP | Adaptador licenciado/instalado | formato nativo propietario; no se implementara por ingenieria inversa |
| Asta via P6 XML/XER | Nativo por puente documentado | Powerproject publica soporte de esos intercambios |
| Asta PP | Adaptador Elecosoft autorizado | formato nativo fuera del contrato abierto |
| CSV | Import/export auxiliar | no conserva semantica CPM completa ni demuestra round-trip |
| IFC 2x3/4/4.3 | Nativo BIM | estandar abierto principal de geometria y datos |
| CAD propietario | Conversion licenciada opcional | evita afirmar compatibilidad no demostrada |

## 4. Contrato canonico de scheduling

Todo importador debe convertir a un snapshot BIM inmutable antes de proponer
cambios a Cronograma clasico. El contrato minimo incluye:

- proyecto, zona horaria, fecha de datos y moneda;
- WBS, actividades, hitos, calendarios y excepciones;
- relaciones FS/SS/FF/SF con lag y unidad;
- restricciones, fechas plan/real y porcentaje completado;
- recursos, roles, asignaciones, unidades, trabajo y costes;
- codigos, campos extendidos y baselines;
- advertencias de perdida, campos no soportados y checksum de fuente.

La importacion se divide en `parse -> normalize -> validate -> preview ->
approve`. Ningun archivo externo escribe Cronograma clasico durante parse o
preview. La aplicacion final requiere TASK de integracion controlada, permiso,
confirmacion y rollback snapshot.

## 5. Criterio de round-trip

Un formato solo pasa a `completo` cuando un corpus autorizado demuestra:

1. importacion sin perdida silenciosa;
2. CPM equivalente para fechas, camino critico y restricciones soportadas;
3. exportacion reimportable por la aplicacion objetivo;
4. reporte explicito de toda diferencia no representable;
5. aislamiento tenant y archivos maliciosos rechazados;
6. archivo original y resultado ligados por checksum y auditoria.

## 6. Orden de implementacion

1. `BIM-TASK-0130`: contrato canonico y preflight.
2. `BIM-TASK-0131`: MSPDI XML import/export.
3. `BIM-TASK-0132`: P6 XML import/export.
4. `BIM-TASK-0133/0188`: gate propietario y subconjunto XER basado en mapa oficial.
5. `BIM-TASK-0134`: preview, aprobacion, rollback y round-trip comparativo.

Los adaptadores `.mpp` y `.pp` no bloquean la paridad funcional si MSPDI/P6
XML cubren el intercambio documentado. Si el negocio exige archivos nativos,
se adquirira e integrara un SDK/licencia antes de abrir la TASK correspondiente.

## 7. Estado XER vigente

`BIM-TASK-0188` implementa preview/export de proyecto unico para las tablas
oficiales `PROJECT`, `CALENDAR`, `PROJWBS`, `TASK`, `TASKPRED`, `RSRC`,
`RSRCRATE` y `TASKRSRC`. La capacidad permanece condicionada: el round-trip
interno no certifica reimportacion ni equivalencia CPM contra Oracle P6.
