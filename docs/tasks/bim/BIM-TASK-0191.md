# BIM-TASK-0191 - Administrador de empresa como operador BIM

Fecha: 2026-07-22

Estado: Cerrada localmente

Modo: INTEGRACION CONTROLADA GIPROY CLASICO <-> GIPROY BIM

## Objetivo

Eliminar exclusividades operativas BIM no justificadas del superadministrador y
reconocer al administrador de empresa como dueño operativo del BIM de su tenant,
siempre sujeto a licencia, entitlement, activacion tecnica, allowlist, proyecto
y capacidades.

## Politica canonica

- `administrador`: opera y administra BIM para su propia empresa.
- `superadministrador`: tutela, soporta y gobierna la plataforma; puede operar
  en el tenant seleccionado cuando las puertas BIM lo autorizan, pero no recibe
  exclusividad funcional por defecto.
- `usuario`: opera solo las capacidades BIM concedidas.
- El gobierno global de activacion BIM permanece reservado al
  superadministrador.

## Trazabilidad clasica

Relacionado con `TASK-2038`.

## Validacion obligatoria

- Pruebas focales de roles y capacidades.
- Importacion IFC como administrador y denegacion a usuario sin capacidad.
- Vistas compartidas como administrador.
- Smoke BIM habilitado y smoke anti-BIM.
- Build frontend y baseline enterprise.

## Rollback

Revertir el helper de politica, consumidores backend/frontend y pruebas. No hay
migraciones, cambios de esquema ni escrituras de datos.

## Resultado

- El administrador de empresa puede cargar IFC y administrar el BIM de su
  tenant cuando todas las puertas acumulativas lo autorizan.
- El superadministrador conserva tutela y gobierno global sin exclusividad
  operativa implicita.
- La carga IFC es visible desde la cabecera y desde el estado vacio.
- La politica queda congelada en `BIM_ROLE_GOVERNANCE.md`.

## Evidencia

- `262 passed` en suite BIM backend.
- Smoke BIM Workspace V2 completo: OK.
- Build frontend, smoke anti-BIM y baseline enterprise: OK.
