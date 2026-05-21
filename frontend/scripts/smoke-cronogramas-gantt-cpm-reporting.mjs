import assert from 'node:assert/strict';
import {
    buildGanttCpmReportingLineContract,
    summarizeGanttCpmReportingContract,
} from '../src/components/projects/cronogramasGanttCpmReportingContract.js';

const line = buildGanttCpmReportingLineContract({
    row: {
        budget_line_id: 15,
        codigo_item: '1.1.3',
        descripcion: 'Excavación a mano',
    },
    diagnostics: {
        criticalPathCount: 2,
        criticalPathIndexes: [1, 2],
        totalSlack: -1.5,
        freeSlack: 0,
        hasNegativeFloat: true,
        restrictionType: 'SNET',
        restrictionLabel: 'No iniciar antes de',
        projectDuration: 186.74,
    },
    scheduleAlignment: {
        hasDrift: true,
        driftStart: 1.25,
        driftFinish: 0.5,
        driftDuration: 0,
    },
    reconciliation: {
        adopted_at: '2026-04-19T20:15:00Z',
    },
    traceEvents: [{
        action: 'adopt',
        mode: 'subbars',
        actor_email: 'qa@giproy.local',
        occurred_at: '2026-04-19T20:15:00Z',
    }],
});

assert.equal(line.line_id, 15);
assert.equal(line.cpm_available, true);
assert.equal(line.has_negative_float, true);
assert.equal(line.cpm_reconciled, true);
assert.equal(line.cpm_trace_count, 1);
assert.equal(line.cpm_last_action, 'adopt');
assert.equal(line.cpm_last_mode, 'subbars');

const summary = summarizeGanttCpmReportingContract([
    line,
    buildGanttCpmReportingLineContract({
        row: { budget_line_id: 16, codigo_item: '1.1.4', descripcion: 'Hormigón' },
        diagnostics: {
            criticalPathCount: 1,
            criticalPathIndexes: [1],
            totalSlack: 2,
            freeSlack: 1,
            hasNegativeFloat: false,
        },
        scheduleAlignment: null,
        reconciliation: null,
        traceEvents: [],
    }),
]);

assert.equal(summary.total_lines, 2);
assert.equal(summary.cpm_available_lines, 2);
assert.equal(summary.negative_float_lines, 1);
assert.equal(summary.restricted_lines, 1);
assert.equal(summary.drift_lines, 1);
assert.equal(summary.reconciled_lines, 1);
assert.equal(summary.traced_lines, 1);

console.log('smoke-cronogramas-gantt-cpm-reporting: ok');
