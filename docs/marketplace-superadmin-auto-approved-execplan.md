# Marketplace: autoaprobación de superadministración en fase inicial

## Objetivo
Garantizar que, mientras el marketplace se consolida desde cero, toda operación hecha por `superadministrador` deje el producto en `approved`.

## Plan de implementación
1. Mantener `estado` como dato interno heredado.
2. Respetar la creación ya autoaprobada por `superadministrador`.
3. Reafirmar `approved` en cada edición administrativa hecha por `superadministrador`.
4. Preservar `approved_by_user_id` para trazabilidad.
5. Validar backend y no interferencia con BIM.

## Alcance
- `backend/app/services/marketplace.py`
- `docs/tasks/TASK-0706.md`
- `docs/tasks/TASK-0564.md`
- `docs/CHANGELOG.md`

## Estado
Implementado
