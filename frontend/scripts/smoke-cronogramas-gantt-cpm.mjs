import assert from 'node:assert/strict';
import {
    formatGanttCpmHistoryBatchLabel,
    resolveGanttCpmManualEditGuard,
    resolveGanttCpmRowState,
} from '../src/components/projects/cronogramasGanttCpm.js';

const adoptedState = resolveGanttCpmRowState({
    diagnostics: { hasNegativeFloat: false, restrictionType: 'SNET' },
    scheduleAlignment: { hasDrift: true },
    reconciliation: { adopted_at: '2026-04-19T18:35:00Z' },
    traceEvents: [{ action: 'adopt', occurred_at: '2026-04-19T18:35:00Z' }],
});

assert.equal(adoptedState.hasAction, true, 'Una tarea con tanteo CPM adoptado debe contarse como acción CPM');
assert.equal(adoptedState.hasReconciliation, true, 'La conciliación manual CPM debe detectarse');
assert.equal(adoptedState.hasAlignmentDrift, true, 'La deriva visible contra CPM debe propagarse al estado');
assert.equal(adoptedState.badge?.label, 'CPM+', 'La fila debe exponer badge discreto para acciones CPM');

const tracedState = resolveGanttCpmRowState({
    diagnostics: {},
    scheduleAlignment: null,
    reconciliation: null,
    traceEvents: [{ action: 'revert', occurred_at: '2026-04-19T19:10:00Z' }],
});

assert.equal(tracedState.hasAction, true, 'Una traza CPM histórica también debe entrar en el foco CPM');
assert.equal(tracedState.hasReconciliation, false, 'La sola traza no implica tanteo activo');

const manualGuard = resolveGanttCpmManualEditGuard({
    rowLabel: 'Excavación manual',
    editTargetLabel: 'el ajuste fino del subtramo',
    cpmState: adoptedState,
});

assert.ok(manualGuard?.message.includes('Excavación manual'), 'El guardarraíl debe nombrar la tarea afectada');
assert.ok(manualGuard?.message.includes('ajuste fino del subtramo'), 'El guardarraíl debe explicar qué edición manual se está abriendo');
assert.equal(formatGanttCpmHistoryBatchLabel(1), '1 tanteo CPM');
assert.equal(formatGanttCpmHistoryBatchLabel(3), '3 tanteos CPM');

console.log('smoke-cronogramas-gantt-cpm: ok');
