import assert from 'node:assert/strict';
import {
    buildInitialValoradoSubbars,
    buildGanttSplitPeriodSlots,
    buildGanttSubbarSplitPreview,
    mergeGanttSubbarsSequentially,
    moveGanttSubbarsByDays,
    moveSingleGanttSubbarByDays,
    splitGanttSubbarByRatio,
    rebalanceValoradoDistributionForInterparentMerge,
    buildSimpleTimelineSegments,
    buildSubbarEnvelope,
    buildSubbarVisualsFromTimeline,
} from '../src/components/projects/cronogramasGanttSubbars.js';
import {
    clampMoveDayDeltaToBounds,
    filterSelectionKeysByLine,
    isTaskBarDraggable,
    resolveSubbarClickSelection,
    resolveSubbarPointerSelection,
} from '../src/components/projects/cronogramasGanttInteraction.js';

const periods = [
    { id: 'P1', starts_at: '2026-03-24T08:00:00', ends_at: '2026-03-31T08:00:00', label: 'P1' },
    { id: 'P2', starts_at: '2026-03-31T08:00:00', ends_at: '2026-04-30T08:00:00', label: 'P2' },
    { id: 'P3', starts_at: '2026-04-30T08:00:00', ends_at: '2026-05-31T08:00:00', label: 'P3' },
    { id: 'P4', starts_at: '2026-05-31T08:00:00', ends_at: '2026-06-30T08:00:00', label: 'P4' },
    { id: 'P5', starts_at: '2026-06-30T08:00:00', ends_at: '2026-07-31T08:00:00', label: 'P5' },
    { id: 'P6', starts_at: '2026-07-31T08:00:00', ends_at: '2026-08-31T08:00:00', label: 'P6' },
    { id: 'P7', starts_at: '2026-08-31T08:00:00', ends_at: '2026-09-20T08:00:00', label: 'P7' },
];

const distribution = [12, 15, 20, 10, 15, 15, 13];

const initialSubbars = buildInitialValoradoSubbars({
    budgetLineId: 'replanteo-1',
    periods,
    distribution,
    lineTotal: 1000,
    totalDurationDays: 0.2816,
    source: 'valuado_initial_segment',
});

assert.equal(initialSubbars.length, 7, 'La línea base debe nacer con 7 subbarras iniciales');
assert.equal(initialSubbars[0].period_id, 'P1');
assert.equal(initialSubbars[6].period_id, 'P7');
assert.equal(initialSubbars[0].percent, 12);
assert.equal(initialSubbars[6].percent, 13);
assert.equal(new Date(initialSubbars[0].starts_at).toISOString().slice(0, 10), '2026-03-24');
assert.equal(new Date(initialSubbars[1].starts_at).toISOString().slice(0, 10), '2026-03-31');

const firstDurationMs = new Date(initialSubbars[0].ends_at).getTime() - new Date(initialSubbars[0].starts_at).getTime();
const thirdDurationMs = new Date(initialSubbars[2].ends_at).getTime() - new Date(initialSubbars[2].starts_at).getTime();
assert.ok(thirdDurationMs > firstDurationMs, 'Un periodo con 20% debe durar más que uno con 12%');

const clippedManual = buildInitialValoradoSubbars({
    budgetLineId: 'replanteo-1',
    periods,
    distribution,
    lineTotal: 1000,
    totalDurationDays: 4,
    source: 'manual_window_period_seed',
    windowStart: '2026-03-24T08:00:00',
    windowEnd: '2026-05-15T08:00:00',
    clipToWindow: true,
});

assert.equal(clippedManual.length, 3, 'La ventana manual debe recortar solo los periodos que realmente toca');

const timelineSegments = buildSimpleTimelineSegments(periods.map((period) => period.starts_at), 30);
const visuals = buildSubbarVisualsFromTimeline({
    subbars: initialSubbars,
    timelineSegments,
    segmentColumnWidth: 80,
    minWidthPx: 6,
    timeScale: 'month',
});

assert.equal(visuals.length, 7, 'Los 7 tramos iniciales deben producir 7 visuales');
assert.ok(visuals.every((segment) => segment.widthPx >= 6), 'Ninguna subbarra debe colapsar por debajo del mínimo visual');
assert.ok(visuals[1].leftPx > visuals[0].leftPx, 'Los tramos deben avanzar temporalmente en el timeline');
assert.ok(
    visuals.every((segment) => !segment.isApproximateVisualDuration),
    'En escala mensual, un tramo menor a un día debe conservar duración exacta sin marca aproximada',
);
assert.ok(
    visuals.every((segment) => (segment.visualDurationMs || 0) < (24 * 60 * 60 * 1000)),
    'La política vigente no debe inflar tramos cortos a un día visual completo',
);

const dayTimelineSegments = buildSimpleTimelineSegments(periods.map((period) => period.starts_at), 1);
const dayVisuals = buildSubbarVisualsFromTimeline({
    subbars: initialSubbars,
    timelineSegments: dayTimelineSegments,
    segmentColumnWidth: 80,
    minWidthPx: 6,
    timeScale: 'day',
});

assert.ok(
    dayVisuals[2].exactWidthPx > dayVisuals[0].exactWidthPx,
    'En escala diaria, la geometría exacta debe distinguir un 20% frente a un 12%',
);

const exactShortDayVisuals = buildSubbarVisualsFromTimeline({
    subbars: initialSubbars,
    timelineSegments: dayTimelineSegments,
    segmentColumnWidth: 80,
    minWidthPx: 6,
    timeScale: 'day',
});

assert.ok(
    exactShortDayVisuals.every((segment) => !segment.isApproximateVisualDuration),
    'Si la configuración desactiva la aproximación, las tareas menores a un día no deben marcarse como día visual completo',
);
assert.ok(
    exactShortDayVisuals.every((segment) => (segment.visualDurationMs || 0) < (24 * 60 * 60 * 1000)),
    'Si la configuración desactiva la aproximación, la duración visual debe conservar la duración real menor a un día',
);

const hourVisuals = buildSubbarVisualsFromTimeline({
    subbars: initialSubbars,
    timelineSegments,
    segmentColumnWidth: 80,
    minWidthPx: 6,
    timeScale: 'hour',
});

assert.ok(hourVisuals.every((segment) => !segment.isApproximateVisualDuration), 'En escala horaria la subbarra debe conservar su duración exacta');
assert.ok(
    hourVisuals[2].visualDurationMs > hourVisuals[0].visualDurationMs,
    'En hora, la visualización debe seguir la proporción real de duración entre tramos',
);

const envelope = buildSubbarEnvelope(visuals);
assert.ok(envelope.widthPx > visuals[0].widthPx, 'El envelope debe abarcar la secuencia segmentada completa');

const merged = mergeGanttSubbarsSequentially({
    subbars: [initialSubbars[0], initialSubbars[1], initialSubbars[2]],
    anchorSubbarId: initialSubbars[1].id,
});
assert.ok(merged, 'La unión secuencial debe producir un tramo resultante');
assert.equal(
    new Date(merged.starts_at).toISOString(),
    new Date(initialSubbars[1].starts_at).toISOString(),
    'La unión debe anclarse al inicio de la primera subbarra seleccionada',
);
assert.equal(
    Number(merged.percent.toFixed(4)),
    Number((initialSubbars[0].percent + initialSubbars[1].percent + initialSubbars[2].percent).toFixed(4)),
    'La unión debe conservar la suma de porcentajes',
);

const split = splitGanttSubbarByRatio(initialSubbars[2], 30);
assert.equal(split.length, 2, 'La división debe producir dos subtramos');
assert.equal(
    new Date(split[0].ends_at).toISOString(),
    new Date(split[1].starts_at).toISOString(),
    'La división debe dejar las dos partes en continuidad temporal',
);
assert.equal(
    Number((split[0].percent + split[1].percent).toFixed(4)),
    Number(initialSubbars[2].percent.toFixed(4)),
    'La división debe conservar el porcentaje total del tramo origen',
);

const alignedParent = {
    id: 'initial-parent-1',
    starts_at: periods[0].starts_at,
    ends_at: periods[6].ends_at,
    percent: 100,
    amount: 1000,
    source: 'initial_creation_seed',
    status: 'confirmed_against_budget',
};

const splitSlots = buildGanttSplitPeriodSlots(alignedParent, periods);
assert.equal(splitSlots.length, 7, 'La semilla inicial debe exponer todos los slots valorados disponibles');

const advancedSequentialSplit = buildGanttSubbarSplitPreview({
    subbar: alignedParent,
    parts: [
        { id: 'part-1', label: 'Parte 1', percent: 20 },
        { id: 'part-2', label: 'Parte 2', percent: 35 },
        { id: 'part-3', label: 'Parte 3', percent: 45 },
    ],
    mode: 'sequential',
    periods,
});

assert.equal(advancedSequentialSplit.canApply, true, 'La división avanzada secuencial debe poder aplicarse cuando cuadra al 100% del padre');
assert.equal(advancedSequentialSplit.segments.length, 3, 'La división avanzada debe soportar más de dos partes');
assert.equal(
    Number(advancedSequentialSplit.assignedPercent.toFixed(4)),
    100,
    'La división avanzada debe conservar el porcentaje completo del tramo padre',
);
assert.equal(
    new Date(advancedSequentialSplit.segments[0].starts_at).toISOString(),
    new Date(alignedParent.starts_at).toISOString(),
    'La primera parte secuencial debe iniciar exactamente donde inicia el padre',
);
assert.equal(
    new Date(advancedSequentialSplit.segments[2].ends_at).toISOString(),
    new Date(alignedParent.ends_at).toISOString(),
    'La última parte secuencial debe cerrar exactamente donde termina el padre',
);

const advancedAlignedSplit = buildGanttSubbarSplitPreview({
    subbar: alignedParent,
    parts: [
        { id: 'part-a', label: 'Parte A', percent: 20 },
        { id: 'part-b', label: 'Parte B', percent: 20 },
        { id: 'part-c', label: 'Parte C', percent: 20 },
        { id: 'part-d', label: 'Parte D', percent: 20 },
        { id: 'part-e', label: 'Parte E', percent: 20 },
    ],
    mode: 'align_to_periods',
    periods,
});

assert.equal(advancedAlignedSplit.canApply, true, 'La división alineada a tramos debe poder aplicarse con cinco partes sobre siete slots');
assert.equal(advancedAlignedSplit.segments.length, 5, 'La división alineada debe producir una subbarra por parte positiva');
assert.equal(advancedAlignedSplit.unassignedSlotCount, 2, 'Si sobran slots, el preview debe declararlos como no asignados');
assert.equal(
    advancedAlignedSplit.segments[0].period_id,
    'P1',
    'La primera parte alineada debe arrancar en el primer slot disponible',
);
assert.equal(
    advancedAlignedSplit.segments[4].period_id,
    'P5',
    'La quinta parte alineada debe ocupar el quinto slot visible del padre',
);

const invalidAdvancedSplit = buildGanttSubbarSplitPreview({
    subbar: alignedParent,
    parts: [
        { id: 'part-x', label: 'Parte X', percent: 60 },
        { id: 'part-y', label: 'Parte Y', percent: 20 },
    ],
    mode: 'sequential',
    periods,
});

assert.equal(invalidAdvancedSplit.canApply, false, 'No debe permitirse aplicar una división que no cuadre el 100% del padre');
assert.ok(
    invalidAdvancedSplit.remainingPercent > 0,
    'El preview inválido debe informar el porcentaje restante pendiente de asignar',
);

const movedSingle = moveSingleGanttSubbarByDays(initialSubbars, initialSubbars[2].id, 2);
assert.equal(movedSingle.length, initialSubbars.length, 'Mover un subtramo no debe alterar la cantidad total de tramos');
assert.equal(
    new Date(movedSingle[2].starts_at).getTime() - new Date(initialSubbars[2].starts_at).getTime(),
    2 * 24 * 60 * 60 * 1000,
    'El subtramo objetivo debe desplazarse exactamente el número de días indicado',
);
assert.equal(
    movedSingle[1].starts_at,
    initialSubbars[1].starts_at,
    'Los subtramos no seleccionados no deben desplazarse',
);
assert.equal(
    movedSingle[3].starts_at,
    initialSubbars[3].starts_at,
    'Mover un subtramo no debe arrastrar a los demás',
);

const movedSelection = moveGanttSubbarsByDays(
    initialSubbars,
    [initialSubbars[1].id, initialSubbars[2].id],
    3,
);
assert.equal(
    new Date(movedSelection[1].starts_at).getTime() - new Date(initialSubbars[1].starts_at).getTime(),
    3 * 24 * 60 * 60 * 1000,
    'El drag múltiple debe desplazar el primer tramo seleccionado',
);
assert.equal(
    new Date(movedSelection[2].starts_at).getTime() - new Date(initialSubbars[2].starts_at).getTime(),
    3 * 24 * 60 * 60 * 1000,
    'El drag múltiple debe desplazar también el segundo tramo seleccionado',
);
assert.equal(
    movedSelection[0].starts_at,
    initialSubbars[0].starts_at,
    'El drag múltiple no debe mover tramos fuera de la selección',
);

const factoryResetSubbars = [
    {
        id: 'factory-reset-segment-15',
        starts_at: '2026-03-24T08:00:00',
        ends_at: '2026-03-26T08:00:00',
        percent: 100,
        amount: 1200,
        source: 'factory_reset_seed',
        status: 'confirmed_against_budget',
    },
];

const movedFactoryReset = moveGanttSubbarsByDays(
    factoryResetSubbars,
    ['factory-reset-segment-15'],
    2,
    {
        shiftValue: (value, dayDelta) => `shifted:${value}:${dayDelta}`,
    },
);

assert.equal(
    movedFactoryReset[0].starts_at,
    'shifted:2026-03-24T08:00:00:2',
    'Una subbarra sembrada por factory reset debe delegar el desplazamiento al shifter operativo inyectado',
);
assert.equal(
    movedFactoryReset[0].source,
    'gantt_manual_move',
    'El primer drag sobre una semilla de factory reset debe convertirla en movimiento manual operativo',
);
assert.equal(
    movedFactoryReset[0].status,
    'draft_session',
    'El drag de una semilla factory reset debe volverla borrador operativo editable',
);

const initialCreationSubbars = [
    {
        id: 'initial-creation-segment-15',
        starts_at: '2026-03-24T08:00:00',
        ends_at: '2026-03-31T08:00:00',
        percent: 100,
        amount: 800,
        source: 'initial_creation_seed',
        status: 'confirmed_against_budget',
    },
];

const movedInitialCreation = moveSingleGanttSubbarByDays(
    initialCreationSubbars,
    'initial-creation-segment-15',
    1,
    {
        shiftValue: (value, dayDelta) => `shifted:${value}:${dayDelta}`,
    },
);

assert.equal(
    movedInitialCreation[0].source,
    'gantt_manual_move',
    'La primera interacción de drag sobre una semilla inicial debe convertirla en movimiento manual operativo',
);
assert.equal(
    movedInitialCreation[0].starts_at,
    'shifted:2026-03-24T08:00:00:1',
    'La semilla inicial debe reutilizar el shifter operativo inyectado igual que el factory reset',
);

const preservedSelection = resolveSubbarPointerSelection({
    lineId: 'L1',
    subbarId: 'S2',
    selectedKeys: ['L1::S1', 'L1::S2'],
    orderedSubbarIds: ['S1', 'S2', 'S3'],
});
assert.deepEqual(
    preservedSelection.selectedSubbarKeys,
    ['L1::S1', 'L1::S2'],
    'Iniciar drag sobre una subbarra ya seleccionada debe preservar la multiselección de la línea',
);
assert.deepEqual(
    preservedSelection.draggedSubbarIds,
    ['S1', 'S2'],
    'El drag debe moverse como bloque cuando la subbarra activa ya pertenece a la selección',
);

const degradedSelection = resolveSubbarPointerSelection({
    lineId: 'L1',
    subbarId: 'S3',
    selectedKeys: ['L1::S1', 'L1::S2'],
    orderedSubbarIds: ['S1', 'S2', 'S3'],
});
assert.deepEqual(
    degradedSelection.selectedSubbarKeys,
    ['L1::S3'],
    'Arrastrar una subbarra fuera de la selección debe degradar a selección simple segura',
);
const toggledSelection = resolveSubbarClickSelection({
    lineId: 'L1',
    subbarId: 'S2',
    selectedKeys: ['L1::S1', 'L1::S2', 'L1::S3'],
    currentSelectedKey: 'L1::S2',
    orderedSubbarIds: ['S1', 'S2', 'S3'],
    toggle: true,
});
assert.equal(
    toggledSelection.selectedSubbarKey,
    'L1::S3',
    'Ctrl + clic sobre la subbarra activa debe reanclar la selección a una vecina visible cuando aún quedan otras seleccionadas',
);
assert.deepEqual(
    toggledSelection.selectedSubbarKeys,
    ['L1::S1', 'L1::S3'],
    'Ctrl + clic sobre una subbarra seleccionada debe quitarla de la multiselección sin reinyectarla',
);
const rangedSelection = resolveSubbarClickSelection({
    lineId: 'L1',
    subbarId: 'S3',
    selectedKeys: ['L1::S1'],
    currentSelectedKey: 'L1::S1',
    orderedSubbarIds: ['S1', 'S2', 'S3'],
    range: true,
});
assert.deepEqual(
    rangedSelection.selectedSubbarKeys,
    ['L1::S1', 'L1::S2', 'L1::S3'],
    'Shift + clic debe expandir un rango continuo dentro de la misma línea',
);
assert.deepEqual(
    filterSelectionKeysByLine('L1', ['L1::S2', 'L2::X1', 'L1::S1'], ['S1', 'S2', 'S3']),
    ['L1::S1', 'L1::S2'],
    'La selección por línea debe reordenarse según la secuencia temporal visible de subbarras',
);
assert.equal(
    isTaskBarDraggable({ isCalculable: true, subbarCount: 0 }),
    true,
    'La barra madre debe ser draggable para mover la tarea completa',
);
assert.equal(
    isTaskBarDraggable({ isCalculable: true, subbarCount: 2 }),
    true,
    'La barra madre debe seguir siendo draggable aunque existan subbarras visibles',
);
assert.equal(
    isTaskBarDraggable({ isCalculable: false, subbarCount: 0 }),
    false,
    'Una línea no calculable no debe activar drag de barra madre',
);

assert.equal(
    clampMoveDayDeltaToBounds({
        rawDayDelta: -7,
        minDayDelta: -5,
        projectedStartPx: -18,
        boundarySnapThresholdPx: 16,
        movingLeft: true,
    }),
    -5,
    'El drag debe quedar acotado al primer día permitido aunque el puntero intente sacar la barra por la izquierda',
);
assert.equal(
    clampMoveDayDeltaToBounds({
        rawDayDelta: -4,
        minDayDelta: -5,
        projectedStartPx: 12,
        boundarySnapThresholdPx: 16,
        movingLeft: true,
    }),
    -5,
    'Al volver casi al origen, la barra debe imantar al borde inicial en vez de quedar recortada',
);
assert.equal(
    clampMoveDayDeltaToBounds({
        rawDayDelta: 3,
        minDayDelta: -5,
        projectedStartPx: 48,
        boundarySnapThresholdPx: 16,
        movingLeft: false,
    }),
    3,
    'El clamp del borde izquierdo no debe interferir con desplazamientos normales hacia la derecha',
);
assert.equal(
    clampMoveDayDeltaToBounds({
        rawDayDelta: 4,
        minDayDelta: 0,
        maxDayDelta: 0,
        projectedStartPx: 96,
        boundarySnapThresholdPx: 16,
        movingLeft: false,
    }),
    0,
    'Una tarea gobernada por predecesoras debe quedar bloqueada en su fecha política aunque el ratón intente moverla a la derecha',
);
assert.equal(
    clampMoveDayDeltaToBounds({
        rawDayDelta: -4,
        minDayDelta: 0,
        maxDayDelta: 0,
        projectedStartPx: 8,
        boundarySnapThresholdPx: 16,
        movingLeft: true,
    }),
    0,
    'Una tarea gobernada por predecesoras debe impedir movimientos anteriores a su fecha política',
);

const rebalancedDistribution = rebalanceValoradoDistributionForInterparentMerge({
    distribution,
    periods,
    sourcePeriodId: 'P3',
    targetPeriodId: 'P4',
    percentToMove: 7,
});

assert.deepEqual(
    rebalancedDistribution?.nextDistribution,
    [12, 15, 13, 17, 15, 15, 13],
    'La fusión intertramo debe mover el porcentaje entre periodos sin alterar el total de la distribución',
);
assert.equal(
    rebalancedDistribution?.percentMoved,
    7,
    'La fusión intertramo debe reportar con precisión el porcentaje realmente movido',
);

console.log('smoke-cronogramas-gantt-subbars: ok');
