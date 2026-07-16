# BIM-TASK-0015: alineacion documental del estado real BIM

## Estado
Cerrada

## Objetivo

Alinear la documentacion BIM con el estado real del codigo para evitar que
futuros slices partan de una premisa incorrecta de "ejecucion no iniciada".

## Alcance

- Documentar que existe codigo BIM incubado en backend y frontend.
- Corregir el estado del indice BIM y del plan maestro.
- Registrar la deuda de migraciones Alembic del dominio principal BIM.
- Mantener intacto GiProy Clasico y la UX con BIM apagado.
- No modificar codigo productivo, rutas, endpoints, modelos, servicios ni
  migraciones.

## Resultado

- Se crea `docs/architecture/BIM_CODE_STATE.md` como fotografia del estado real
  del codigo BIM.
- Se actualiza `docs/architecture/BIM_INDEX.md` para enlazar el nuevo estado y
  reemplazar "ejecucion aun no iniciada" por "incubacion funcional parcial".
- Se actualiza `docs/architecture/BIM_MASTER_PLAN.md` para distinguir vision
  madura, estado real y brechas.
- Se actualiza `docs/tasks/bim/BIM_TASK_INDEX.md` para incluir
  `BIM-TASK-0015` y marcar estados reales parciales.
- Se actualiza `CHANGELOG.md` con el saneamiento documental.

## No interferencia

- Sin cambios backend.
- Sin cambios frontend.
- Sin cambios DB.
- Sin Docker/Coolify/CI/CD/staging/produccion.
- Sin activar UX BIM en Proyectos.
- Sin tocar contratos clasicos, auth, tenant, EDT, APUs, Presupuesto ni
  Cronogramas.

## Validacion

- Validacion documental: lectura y consistencia cruzada de documentos BIM.
- No aplica build ni pytest porque no hubo cambios de codigo.

## Pendiente posterior

- Crear migracion Alembic no destructiva para tablas BIM principales antes de
  cerrar `BIM-TASK-0002`.
- Crear smoke BIM focal antes de cerrar `BIM-TASK-0008`.
- Mantener `smoke-classic-no-bim-contamination` como guarda de BIM apagado.

