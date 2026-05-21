# Project Base Sync Hardening Execplan

## Objetivo
Endurecer la sincronización `Base Maestra -> Base de Proyecto` para que sea previsible, conservadora y auditable sin perder la lógica operativa actual.

## Mejoras implementadas
1. `preview` explícito antes de sincronizar.
2. Separación formal entre:
   - `sync-missing`: agrega faltantes y repara heredados rotos detectados.
   - `repair-inherited`: solo repara APUs heredados vacíos/incompletos.
3. Feedback de UI con:
   - añadidos
   - reparados
   - divergentes no tocados
4. Script genérico para preview/sync/repair por empresa y base.
5. Test de contrato para:
   - creación de faltantes
   - respeto de divergencias
   - reparación conservadora de heredados
   - no alteración del origen

## Resultado esperado
- El usuario sabe qué va a pasar antes de sincronizar.
- La lógica deja de mezclar “agregar faltantes” con “reparar corrupción” de manera implícita.
- El origen sigue siendo estrictamente de solo lectura.
