# BIM-TASK-0191 - Administrador de empresa como operador BIM

Fecha: 2026-07-22

Estado: Cerrada en beta

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

## Despliegue beta

- Commit: `cdcba86`.
- Backend `sha256:72bd62de6a70619ec44b9b46530bf6ae8f80a5490371e4b4fd096fb3ed14ba4a`.
- Frontend `sha256:92096214b306536444ffad2bc83f94ca9a8c9327c9e0d166f2d59919d8a24061`.
- Stack healthy, home `200` y frontera BIM anonima `401`.
- Sin migraciones ni cambios de PostgreSQL.
- Rollback de fuentes e imagenes con sello `20260722-102609`.
