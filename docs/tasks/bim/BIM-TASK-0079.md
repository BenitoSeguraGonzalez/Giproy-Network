# BIM-TASK-0079 - Vistas reproducibles

Estado: Cerrada localmente; Gate B cerrado

## Objetivo

Persistir y reproducir el contexto tecnico completo del viewer BIM bajo un
contrato versionado, sin crear una nueva fuente de verdad.

## Implementacion

- Contrato `giproy_bim_view_state_v2` dentro del JSON existente de view states.
- Persiste camara/proyeccion, seleccion GUID/localId, visibilidad, colores,
  filtros, ghost, clipping, mediciones y unidades.
- `BimFragmentsViewport` emite snapshots tras cambios de controles/herramientas.
- `BimWorkspace` guarda el snapshot solo en vistas nombradas y lo reaplica.
- Replay restaura camara, seleccion, ocultos, colores, ghost, clipping,
  medicion y unidades sobre el mismo artifact/version.
- Version distinta o contrato no soportado produce estado `incompatible`.
- Vistas legacy siguen aplicando su contexto previo sin estado 3D.
- No se agrega migracion: se usa `bim_view_states.payload` existente.

## Validacion

- Roundtrip HTTP conserva todo el contrato y rechaza source/version distintos.
- Harness WebGL: configurar, capturar, resetear y reaplicar restaura proyeccion,
  clipping, aislamiento, ocultos y medicion: OK en 5.6 s.
- Caso incompatible declarado: OK.
- Suite focal acumulada: 62 tests BIM pasan, dos warnings conocidos.
- Corpus real de cinco IFC: 0.18 MB a 17.9 MB convierte a Fragments; mayor
  dataset en 1.619 s, sin bloqueo.
- Build, smoke BIM y anti-BIM: OK.

## Cierre Gate B

- Flujo abrir/revisar/guardar/resetear/reabrir reproducido localmente.
- Viewer estable con corpus S/M/L y explorer paginado con 1.005 elementos.
- GiProy Clasico permanece identico con BIM apagado.
- Seguridad, rendimiento de liberacion y piloto siguen gobernados por Gate E.

## No interferencia clasica

- Contrato, UI, harness y tests limitados al dominio BIM.
- Scopes personal/company y permisos existentes permanecen intactos.
- Sin cambios en TASK-1807, rutas clasicas, auth, tenant o infraestructura.

## Rollback

Dejar de enviar/interpretar `viewer_state`; las vistas previas continúan
funcionando con version, nivel, elemento y link. No requiere rollback de DB.
