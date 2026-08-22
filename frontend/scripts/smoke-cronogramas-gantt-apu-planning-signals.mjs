import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
    buildGanttApuPlanningSignals,
    clampFloatingPanelPosition,
} from '../src/components/projects/cronogramasGanttApuPlanning.js';

const closeTo = (actual, expected, tolerance = 0.0001) => {
    assert.ok(
        Math.abs(Number(actual) - Number(expected)) <= tolerance,
        `Expected ${actual} to be within ${tolerance} of ${expected}`,
    );
};

const row = {
    is_calculable: true,
    apu_id: 10,
    codigo_item: '1.1.1',
    descripcion: 'Replanteo y nivelación',
    unidad: 'm²',
    cantidad: 115.62,
    rendimiento_unitario_mano_obra: 0.066,
    trabajo_mano_obra: 7.63092,
    trabajo_equipos: 6.9372,
    trabajo_gobernante: 2.3124,
    cuadrilla_mano_obra: 4,
    metadata: {
        governing_resource: {
            name: 'Topógrafo',
            performance_hours_per_unit: 0.02,
            candidate_count: 4,
        },
    },
};

const model = buildGanttApuPlanningSignals({
    row,
    effectiveRow: row,
    dailyHours: 8,
    indirectPercentage: 19.23844168,
    durationModel: {
        jornada_horas: 8,
        factor_eficiencia: 0.85,
        governing_resource_name: 'Topógrafo',
    },
    costModel: {
        unit_direct_cost: 0.8522,
        category_unit_costs: {
            'Equipos y Herramientas': 0.18,
            Materiales: 0.3795,
            'Mano de Obra': 0.2927,
        },
    },
});

assert.equal(model.available, true);
assert.equal(model.overallStatus, 'ok');
assert.equal(model.activity.governingResourceName, 'Topógrafo');
assert.equal(model.activity.governingCandidateCount, 4);
closeTo(model.metrics.theoreticalProduction, 50);
closeTo(model.metrics.plannedProduction, 42.5);
closeTo(model.metrics.netDurationHours, 2.3124);
closeTo(model.metrics.plannedDurationHours, 2.7204705882);
closeTo(model.metrics.plannedDurationDays, 0.3400588235);
closeTo(model.metrics.laborNetHours, 7.63092);
closeTo(model.metrics.laborPlannedHours, 8.9775529412);
closeTo(model.metrics.equivalentCrew, 3.3);
closeTo(model.metrics.crewLoad, 0.825);
closeTo(model.metrics.equipmentPlannedHours, 8.1614117647);
closeTo(model.metrics.exactDirectUnitCost, 0.8522);
closeTo(model.metrics.plannedDirectUnitCost, 0.9356176471);
closeTo(model.metrics.plannedUnitPrice, 1.1156176471);
assert.ok(model.validations.every((validation) => validation.status === 'ok'));

const invalidFactor = buildGanttApuPlanningSignals({
    row,
    durationModel: { jornada_horas: 8, factor_eficiencia: 1.2 },
    costModel: { unit_direct_cost: 0.8522, category_unit_costs: {} },
});
assert.equal(invalidFactor.overallStatus, 'error');
assert.equal(
    invalidFactor.validations.find((validation) => validation.id === 'planning-factor')?.status,
    'error',
);

const unavailable = buildGanttApuPlanningSignals({ row: { is_calculable: false } });
assert.equal(unavailable.available, false);
assert.equal(unavailable.overallStatus, 'unavailable');

assert.deepEqual(
    clampFloatingPanelPosition(
        { left: -80, top: 760, width: 440, height: 360 },
        1280,
        800,
    ),
    { left: 12, top: 428 },
);
assert.deepEqual(
    clampFloatingPanelPosition(
        { left: 1180, top: -40, width: 440, height: 360 },
        1280,
        800,
    ),
    { left: 828, top: 12 },
);

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const componentSource = await readFile(
    path.resolve(scriptDir, '../src/components/projects/CronogramaGantt.jsx'),
    'utf8',
);
const panelSource = await readFile(
    path.resolve(scriptDir, '../src/components/projects/GanttApuPlanningSignalsPanel.jsx'),
    'utf8',
);
for (const marker of [
    'gantt-apu-planning-signals-button',
    'openApuPlanningSignals',
    'scheduleCloseApuPlanningSignals',
    'toggleApuPlanningSignalsPinned',
    'openApuPlanningSignalsForRow',
    'toggleApuPlanningSignalsForRow',
    'clampFloatingPanelPosition',
    'startApuPlanningSignalsDrag',
    'setPointerCapture?.(event.pointerId)',
    'moveApuPlanningSignals',
    'finishApuPlanningSignalsDrag',
    'setApuPlanningSignalsPinned(true)',
    "event?.type !== 'resize'",
    "maxHeight: `${Math.max(240, window.innerHeight - 24)}px`",
    'Abrir y fijar semáforos APU de esta actividad',
    'aria-expanded={apuPlanningSignalsOpen}',
    "event.key !== 'Escape'",
]) {
    assert.ok(componentSource.includes(marker), `Missing planning signals interaction marker: ${marker}`);
}

for (const marker of [
    "lazyWithChunkRecovery(() => import('./GanttApuPlanningSignalsPanel'))",
    'role="status"',
    'Cargando señales APU',
]) {
    assert.ok(componentSource.includes(marker), `Missing lazy panel boundary marker: ${marker}`);
}

for (const marker of [
    'gantt-apu-planning-signals-panel',
    'gantt-apu-planning-signals-drag-handle',
    'onPointerDown={onDragPointerDown}',
    'aria-pressed={pinned}',
]) {
    assert.ok(panelSource.includes(marker), `Missing planning signals presentation marker: ${marker}`);
}

assert.equal(
    componentSource.split('aria-label="Abrir y fijar semáforos APU de esta actividad"').length - 1,
    2,
    'Expected a row-level planning signals trigger in both Gantt row layouts',
);

const unitCostSection = panelSource.slice(
    panelSource.indexOf("label: 'Costo unitario'"),
    panelSource.indexOf("label: 'Costo unitario'") + 900,
);
for (const marker of [
    "['Costo directo'",
    "['% indirecto'",
    "['Costo indirecto'",
    "['Precio plan'",
]) {
    assert.ok(unitCostSection.includes(marker), `Missing unit cost marker: ${marker}`);
}
assert.ok(
    unitCostSection.indexOf("['Costo directo'") < unitCostSection.indexOf("['% indirecto'")
        && unitCostSection.indexOf("['% indirecto'") < unitCostSection.indexOf("['Costo indirecto'")
        && unitCostSection.indexOf("['Costo indirecto'") < unitCostSection.indexOf("['Precio plan'"),
    'Expected the requested unit cost presentation order',
);
assert.ok(!unitCostSection.includes('Directo exacto'), 'Directo exacto must not be rendered');
assert.ok(!panelSource.includes('>Validaciones<'), 'The redundant validations block must not be rendered');

for (const marker of [
    'lightEditorPlanningSignals',
    'buildGanttApuPlanningSignals({',
    'gantt-apu-light-operational-dashboard',
    'gantt-apu-light-operational-metrics',
    'grid-cols-6 grid-rows-2',
]) {
    assert.ok(componentSource.includes(marker), `Missing Light editor planning dashboard marker: ${marker}`);
}

const lightEditorCardsSection = componentSource.slice(
    componentSource.indexOf('const lightEditorMetricCards = ['),
    componentSource.indexOf('const lightEditorMetricCards = [') + 2200,
);
for (const label of [
    'Ciclo gobernante',
    'Factor plan',
    'Producción teórica',
    'Producción plan',
    'Duración neta',
    'Duración plan',
    'Trabajo MO neto',
    'Trabajo MO plan',
    'Cuadrilla nominal',
    'Cuadrilla equivalente',
    'Carga de cuadrilla',
    'Equipos plan',
]) {
    assert.ok(lightEditorCardsSection.includes(`['${label}'`), `Missing Light editor metric: ${label}`);
}
assert.ok(
    !componentSource.includes('gantt-apu-light-operational-metrics\"\n                                                className=\"overflow'),
    'The Light editor metrics must not introduce scrolling',
);

console.log('smoke-cronogramas-gantt-apu-planning-signals: OK');
