import assert from 'node:assert/strict';
import {
    resolveEffectiveGanttBootstrapState,
    shouldAttemptGanttBudgetFallback,
} from '../src/components/projects/cronogramasGanttBootstrap.js';

const project = { id: 7 };

assert.equal(
    shouldAttemptGanttBudgetFallback({ scheduleTab: 'gantt', resolvedBudgetId: '', projectId: 7 }),
    true,
    'Debe intentar resolver presupuesto fallback cuando el Gantt aún no tiene presupuesto resuelto.',
);

assert.equal(
    resolveEffectiveGanttBootstrapState({
        scheduleTab: 'gantt',
        project,
        projectId: 7,
        resolvedBudgetId: '',
        ganttBudgetResolving: true,
        cronogramaTrabajoLoading: false,
        cronogramaTrabajo: null,
        cronogramaTrabajoError: '',
    }),
    true,
    'Mientras se resuelve el presupuesto fallback, el Gantt debe seguir en bootstrap.',
);

assert.equal(
    resolveEffectiveGanttBootstrapState({
        scheduleTab: 'gantt',
        project,
        projectId: 7,
        resolvedBudgetId: '13',
        ganttBudgetResolving: true,
        cronogramaTrabajoLoading: false,
        cronogramaTrabajo: null,
        cronogramaTrabajoError: '',
    }),
    false,
    'Un flag viejo de ganttBudgetResolving no debe dejar el Gantt atascado si ya existe presupuesto resuelto.',
);

assert.equal(
    resolveEffectiveGanttBootstrapState({
        scheduleTab: 'gantt',
        project,
        projectId: 7,
        resolvedBudgetId: '13',
        ganttBudgetResolving: false,
        cronogramaTrabajoLoading: true,
        cronogramaTrabajo: { rows: [] },
        cronogramaTrabajoError: '',
    }),
    false,
    'Un flag viejo de cronogramaTrabajoLoading no debe dejar el Gantt atascado si el motor operativo ya llegó.',
);

assert.equal(
    resolveEffectiveGanttBootstrapState({
        scheduleTab: 'gantt',
        project,
        projectId: 7,
        resolvedBudgetId: '13',
        ganttBudgetResolving: false,
        cronogramaTrabajoLoading: true,
        cronogramaTrabajo: null,
        cronogramaTrabajoError: '',
    }),
    true,
    'Si el motor operativo sigue cargando sin respuesta ni error, el Gantt debe seguir en bootstrap.',
);

console.log('smoke-cronogramas-gantt-bootstrap: ok');
