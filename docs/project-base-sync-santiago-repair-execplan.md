# Project Base Sync Santiago Repair Execplan

## Objetivo
Sanear la sincronización entre `Base Maestra` y `Base de Proyecto` en la empresa `Santiago Bermeo`, recuperando APUs heredados vacíos/incompletos y endureciendo el flujo para que `sync-missing` no vuelva a dejar estructuras huérfanas.

## Hallazgos
- La `Base Maestra` origen (`id=32`) no estaba vacía: conservaba `70` subcategorías, `216` recursos, `173` APUs y `831` líneas.
- La incidencia estaba en la `Base de Proyecto` (`id=34`), que conservaba cabeceras de APU pero había quedado con `33` APUs vacíos y `10` APUs divergentes.
- `sync-missing` solo agregaba entidades faltantes por código y no reparaba APUs heredados ya existentes cuando sus líneas habían quedado vacías.

## Plan
1. Endurecer `sync-missing` para que repare APUs heredados vacíos/incompletos de forma conservadora.
2. Exponer trazabilidad de APUs reparados en la respuesta y en la UI de sincronización.
3. Ejecutar una reparación específica para `Santiago Bermeo`, primero validando la integridad de la Base Maestra y después reconciliando la Base de Proyecto afectada.
4. Validar el resultado con comparación antes/después y dejar trazabilidad documental.

## Resultado esperado
- La Base Maestra sigue íntegra y no requiere reconstrucción.
- La Base de Proyecto recupera líneas y asociaciones heredadas perdidas.
- `sync-missing` deja de ser ciego ante APUs ya existentes pero vacíos.
