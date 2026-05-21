import assert from 'node:assert/strict';
import {
    buildVirtualRowMetrics,
    resolveTimelineVirtualWindow,
    resolveVerticalVirtualWindow,
} from '../src/components/projects/cronogramasGanttVirtualization.js';

const windowA = resolveTimelineVirtualWindow({
    scrollLeft: 0,
    viewportWidth: 480,
    columnWidth: 80,
    totalColumns: 40,
    overscanColumns: 4,
});

assert.deepEqual(
    windowA,
    {
        startIndex: 0,
        endIndex: 10,
        offsetLeftPx: 0,
        widthPx: 880,
    },
    'La ventana inicial debe incluir el rango visible más el overscan a la derecha',
);

const windowB = resolveTimelineVirtualWindow({
    scrollLeft: 1600,
    viewportWidth: 400,
    columnWidth: 80,
    totalColumns: 40,
    overscanColumns: 3,
});

assert.deepEqual(
    windowB,
    {
        startIndex: 17,
        endIndex: 28,
        offsetLeftPx: 1360,
        widthPx: 960,
    },
    'La ventana desplazada debe calcular correctamente índices y offset absolutos',
);

const rowMetrics = buildVirtualRowMetrics(
    [
        { budget_line_id: 1, is_calculable: false },
        { budget_line_id: 2, is_calculable: true },
        { budget_line_id: 3, is_calculable: true },
        { budget_line_id: 4, is_calculable: false },
    ],
    (row) => (row.is_calculable ? 74 : 50),
);

assert.equal(rowMetrics.totalHeight, 248, 'La suma total de alturas debe quedar precalculada');
assert.deepEqual(rowMetrics.offsets, [0, 50, 124, 198], 'Los offsets acumulados deben respetar las alturas heterogéneas');

const verticalWindow = resolveVerticalVirtualWindow({
    scrollTop: 60,
    viewportHeight: 90,
    rowMetrics,
    overscanRows: 1,
});

assert.deepEqual(
    verticalWindow,
    {
        startIndex: 0,
        endIndex: 3,
        offsetTopPx: 0,
        bottomSpacerPx: 0,
        visibleHeightPx: 248,
    },
    'La ventana vertical debe expandirse con overscan sin perder offsets ni altura visible',
);

console.log('smoke-cronogramas-gantt-virtualization: ok');
