# Gobierno de Roles BIM

Fecha: 2026-07-22

Estado: politica canonica vigente

## Principio

El rol operativo propietario de BIM es el `administrador` de la empresa. Puede
administrar modelos, versiones, importaciones, vistas compartidas, artefactos y
flujos BIM dentro de su propia empresa cuando la licencia, entitlement, feature
flags, allowlist, proyecto y capacidades lo autorizan.

El `superadministrador` es un rol de tutela, soporte, gestion y control global.
Puede asistir en un tenant seleccionado y autorizado, pero no debe recibir
funcionalidad BIM operativa exclusiva salvo que una TASK y una politica de
gobierno global lo definan expresamente.

## Matriz canonica

| Rol | Operacion BIM del tenant | Gobierno global BIM | Frontera de empresa |
| --- | --- | --- | --- |
| Administrador | Completa segun licencia y puertas BIM | No | Su empresa activa |
| Superadministrador | Tutela y operacion asistida cuando el tenant esta autorizado | Si | Tenant seleccionado y autorizado |
| Usuario | Capacidades concedidas, sin administracion implicita | No | Su empresa activa |

## Puertas acumulativas

El rol nunca sustituye estas comprobaciones:

1. activacion tecnica BIM;
2. licencia y entitlement comercial;
3. allowlist de empresa/usuario cuando corresponda;
4. empresa activa y pertenencia del proyecto;
5. capability BIM requerida;
6. permisos y estado del recurso concreto.

## Operacion empresarial

Administrador y superadministrador pueden, dentro del tenant autorizado:

- cargar IFC y administrar jobs de importacion;
- registrar versiones, artefactos, calidad y rollback BIM;
- administrar vistas compartidas de empresa;
- administrar ACL y flujos CDE del proyecto;
- usar las capacidades BIM operativas completas.

## Gobierno global reservado

Permanecen exclusivos del superadministrador:

- configuracion global desde `admin_bim`;
- gobierno de rollout entre empresas;
- activacion del gate global `superadmin_only`;
- auditoria y soporte transversal que requieran contexto multiempresa.

Estas excepciones no convierten al superadministrador en propietario operativo
del BIM de una empresa.

## Reglas para codigo futuro

- No comparar roles directamente para autorizar una operacion BIM de empresa.
- Usar `is_bim_company_operator` para administracion tenant-scoped.
- Usar capabilities para funciones delegables a usuarios.
- Mantener la seleccion multiempresa del superadministrador separada de la
  operacion del administrador sobre su propia empresa.
- Toda nueva exclusividad del superadministrador debe documentar por que es
  gobierno global y tener una TASK explicita.

## Trazabilidad

- `TASK-2038`
- `BIM-TASK-0191`
- `backend/app/services/bim/role_policy.py`
