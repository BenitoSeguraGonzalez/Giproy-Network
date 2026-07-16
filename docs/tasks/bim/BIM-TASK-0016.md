# BIM-TASK-0016: migracion Alembic del dominio BIM principal

## Estado
Cerrada

## Objetivo

Regularizar la persistencia principal del dominio BIM mediante una migracion
Alembic no destructiva, sin activar UX BIM visible ni modificar flujos
clasicos.

## Alcance

- Crear migracion Alembic para las tablas principales BIM:
  - `bim_models`
  - `bim_model_versions`
  - `bim_elements`
  - `bim_storeys`
  - `bim_view_states`
  - `bim_link_edt`
  - `bim_link_apu`
  - `bim_link_presupuesto`
- Mantener la migracion tolerante a bases locales donde las tablas ya pudieran
  existir por la incubacion runtime previa.
- No retirar todavia los fallbacks `checkfirst` de servicios BIM.
- No tocar frontend, rutas clasicas, auth, tenant ni contratos EDT/APUs/
  Presupuesto.

## Resultado

- Se crea `backend/alembic/versions/de2001a1b2c3_bim_domain_tables.py`.
- El upgrade crea tablas e indices solo si faltan.
- La migracion queda colgada del frente operativo `de1991a1b2c3`.
- La deuda de persistencia BIM baja de "sin Alembic del dominio principal" a
  "Alembic creado; queda retirar o reducir fallbacks runtime en un slice
  posterior".

## No interferencia

- Sin cambios en GiProy Clasico visible.
- Sin activar `BimTab` en `Proyectos`.
- Sin cambios Docker/Coolify/CI/CD/staging/produccion.
- Sin cambios destructivos PostgreSQL en upgrade.
- Sin cambios en auth/JWT/tenant.

## Validacion

- `py_compile` focal de la migracion BIM.
- Smoke anti-BIM clasico recomendado despues de cambios backend/documentales.

## Pendiente posterior

- Ejecutar/validar la migracion en una base local controlada.
- Evaluar reemplazo de `ensure_bim_domain_tables(...)` para que pase a verificar
  readiness sin crear tablas runtime.
- Crear tests focales de endpoints BIM bajo flag apagada/encendida.

