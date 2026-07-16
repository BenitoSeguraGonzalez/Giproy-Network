# BIM-TASK-0139 - Intercambio de planificacion en producto

Estado: Cerrada localmente

## Objetivo

Convertir los contratos MSPDI/P6 y el gobierno de revisiones ya existentes en
un flujo operativo del Workspace BIM V2, sin aplicar cambios al Cronograma
clasico.

## Cambios

- Tab `Intercambio` dentro de Planificacion.
- Selector MSPDI/P6 XML, archivo, zona horaria y moneda.
- Import-preview con conteos, validez, errores y warnings visibles.
- Guardado de revision BIM solo cuando el preflight es valido.
- Aprobacion, rechazo y rollback auditables con version optimista.
- Exportacion XML descargable desde el documento canonico previsualizado.
- Cliente API dedicado, harness y smoke Playwright a 1920x1080.

## Limites conservadores

- No existe accion de aplicacion, merge o escritura al Cronograma clasico.
- P6 XML permanece parcial hasta certificar round-trip contra Oracle; XER sigue
  condicionado a corpus autorizado.
- MPP y Powerproject PP siguen desactivados por requerir adaptador licenciado.

## Validacion

- MSPDI, revisiones y contrato canonico: `17 passed`.
- `npm run build`: OK, con warning conocido de chunks grandes.
- Exportacion XML y Playwright 1920x1080: OK.
- `npm run smoke:bim-workspace-v2`: OK.
- Smoke anti-BIM y baseline enterprise con frontend: OK.
- B04 pasa a completa; matriz: `49,17%`.

## Rollback

Retirar el tab, componente, metodos del cliente API y harness. Los endpoints y
revisiones BIM previos permanecen compatibles; GiProy Clasico no cambia.

