# Acta de piloto y gate final BIM S20

Fecha: 2026-08-03  
Proyecto: `#SantiagoBermeo-2026-001`  
Decisión: `release_approved_with_controlled_warnings`

## Decisión de salida

Se aprueba la salida del módulo coordinado. No se aprueba todavía una referencia
contractual oficial para este proyecto: esa transición seguirá bloqueada hasta
resolver la clasificación, los vínculos y las disciplinas/roles pendientes.
Esta separación evita confundir software operativo con datos coordinados.

| Gate | Resultado |
| --- | --- |
| OmniClass activo por defecto con BIM | aprobado |
| Presupuesto 13 ↔ Gantt 1 ↔ BIM versión 1 fijados | aprobado |
| Baseline y 187 snapshots | aprobado |
| Federación basada únicamente en evidencia | aprobado |
| Permisos explícitos | aprobado |
| Enlaces inferidos automáticamente | 0, aprobado |
| Conflictos críticos | 0, aprobado |
| Advertencias controladas y visibles | 4, aprobado |
| Backup/restore | aprobado |
| Reintento de certificación | idempotente, aprobado |

Advertencias abiertas: `missing_bim_disciplines`,
`missing_functional_role_assignments`, `unclassified_budget_lines` y
`unlinked_coordination_entities`. Son trabajo de datos del proyecto, no gates
críticos del despliegue. La presencia de una sola versión/modelo es la realidad
del proyecto; el criterio “dos revisiones/modelos cuando proceda” no autoriza a
inventar una segunda revisión.

Huella de evidencia:
`ca573f0d0819a00df2caf870def97419d3e0ea18efa590d1760b8abc2a71395b`.

## Porcentajes de cierre

Avance parcial S20: **100%**  
Peso S20: **3%**  
Aporte S20: **3,00%**  
Avance fase E: **100,00%**  
Avance implementación S01-S20: **100,00%**
