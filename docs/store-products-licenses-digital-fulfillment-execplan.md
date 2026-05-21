# Tienda SaaS - Licencias y Productos Digitales

## Resumen
El sistema ya dispone de dos bases importantes:

- `Marketplace` operativo con checkout, pagos, órdenes y `fulfillment`.
- Dominio inicial de `Licencias` con catálogo, asignación por empresa y métricas de uso.

El trabajo correcto no es rehacer esos bloques, sino completar el contrato funcional para:

1. `Licencias SaaS` como producto vivo del sistema.
2. `Productos digitales` (`APU`, `Base Maestra`, `Proyecto`) como activos vendibles con integración automática.

## Objetivo
- Formalizar el modelo de licencias con:
  - licencia inicial `Express`
  - cola de activación sin solapamientos
  - expiración + gracia de `15 días`
  - acceso `solo lectura`
  - trazabilidad de cambios de plan y activaciones
- Formalizar y documentar el `fulfillment` de productos digitales ya existente para:
  - `APU`
  - `Base Maestra`
  - `Proyecto / Presupuesto`
- Mantener compatibilidad con la arquitectura multiempresa actual.

## Hallazgos de arquitectura

### Licencias
Ya existen:
- `backend/app/models/licencia.py`
- `backend/app/models/empresa_licencia.py`
- `backend/app/models/empresa_uso.py`
- `backend/app/services/license.py`
- `backend/app/middleware/license_middleware.py`
- `backend/app/api/endpoints/admin_licenses.py`
- `frontend/src/pages/AdminGlobalLicencias.jsx`
- banner/licencia en `frontend/src/layouts/AppLayout.jsx`

Huecos reales previos al slice:
- asignación simple sin cola
- ausencia de historial/eventos
- falta de estado explícito `readonly/grace`
- dependencia parcial de campos legacy `Empresa.license_start_date / license_end_date`

### Productos digitales
Ya existen:
- clonación APU en `backend/app/services/marketplace_checkout.py::_clone_apu_to_company`
- clonación Base Maestra mediante `BaseTrabajoCreate.source_base_id`
- clonación Proyecto completa en `backend/app/services/marketplace_checkout.py::_clone_project_to_company`
- trazabilidad de origen mediante `MarketplaceAssetOrigin`

Conclusión:
- el frente digital está funcionalmente adelantado
- el frente de licencias necesitaba el endurecimiento principal

## Principios rectores
- No romper `Marketplace` clásico ni `Portal de compras públicas`.
- No duplicar servicios de clonación ya existentes.
- Mantener `tenant isolation` estricto con IDs nuevos por empresa compradora.
- Tratar `Express` como licencia base del sistema y las licencias pagadas como activaciones comerciales.
- Mantener compatibilidad transitoria con la UI actual mientras el backend evoluciona.

## Orden de ejecución

### Fase 1. Licencias - base de dominio
- extender `Licencia` con metadatos de plan y precio
- extender `EmpresaLicencia` con estado, cola y gracia
- crear `LicenseEvent`
- endurecer `LicenseService`

### Fase 2. Licencias - control operativo
- exponer snapshot de licencia por empresa
- aplicar `solo lectura` en middleware
- alinear `AdminGlobalLicencias` y banner global con el snapshot nuevo
- preparar job de housekeeping

### Fase 3. Productos digitales - formalización
- documentar que `APU`, `Base Maestra` y `Proyecto` ya entregan copia profunda
- separar mejor el lenguaje de `fulfillment` frente al de `pago`
- completar la matriz documental de ID maps y validación multi-tenant

## Resultado esperado
- licencias SaaS con cola y expiración consistente
- acceso `solo lectura` cuando corresponda
- catálogo de licencias coherente con precios comerciales
- productos digitales integrados automáticamente tras compra confirmada
- trazabilidad técnica y documental cerrada
