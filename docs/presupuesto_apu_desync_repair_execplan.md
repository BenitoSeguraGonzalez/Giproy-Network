---
title: "Presupuesto APU Desync Repair ExecPlan"
created_at: "2026-03-25"
owner: "Codex"
status: "Completado"
---

# Objetivo
Cuando se elimina un APU que ya está usado en presupuesto, la línea debe quedar claramente marcada como desincronizada, debe salir del cálculo operativo y el usuario debe recibir advertencia explícita para repararla manualmente.

# Estado actual detectado
- Al borrar el APU, `presupuesto_detalles.apu_id` queda en `NULL`.
- La línea permanece visible.
- Los totales siguen contando esa línea porque el cálculo suma `precio_total` de todas las líneas.
- No existe advertencia explícita al entrar en presupuesto.

# Política objetivo
- Una línea operativa con `apu_id = NULL` se considera `desincronizada`.
- Las líneas desincronizadas:
  - siguen visibles
  - se pintan en advertencia
  - no participan en subtotales, indirectos, IVA ni total
  - exigen reparación manual por el usuario
- Al entrar en presupuesto, si existen líneas desincronizadas, se informa al usuario.

# Fases
1. Excluir líneas desincronizadas de cálculos backend.
2. Recalcular presupuestos afectados al borrar APU.
3. Señalizar filas desincronizadas en frontend y excluirlas de métricas visuales.
4. Alertar al usuario al entrar en presupuesto.

# Riesgos controlados
- No borrar líneas automáticamente.
- No generar huérfanos adicionales.
- No perder trazabilidad del contenido presupuestado.
- No romper filas estructurales de EDT.

# Validación
- Borrar un APU usado en presupuesto deja la línea visible y marcada.
- El subtotal del presupuesto baja excluyendo esa línea.
- Indirectos, IVA y total se recalculan sin esa línea.
- Al abrir presupuesto aparece advertencia si hay líneas desincronizadas.
