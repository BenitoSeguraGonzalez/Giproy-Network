import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
    buildDependencyRoute,
    distributeLaneOffset,
    formatDependencyShortcodeValue,
    parseDependencyShortcodeTokens,
    resolveDependencyConstraintPresentation,
    resolveDependencyVerticalAnchors,
    snapDependencyCoordinate,
} from '../src/components/projects/cronogramasGanttDependencies.js';

const ganttComponentSource = readFileSync(
    new URL('../src/components/projects/CronogramaGantt.jsx', import.meta.url),
    'utf8',
);

const parsePathPoints = (path) => path
    .split(/M|L/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
        const [x, y] = segment.split(/\s+/).map(Number);
        return { x, y };
    });

const horizontalSegmentsCoverGeometry = (points, geometry) => points.some((point, index) => {
    if (index === 0) return false;
    const previous = points[index - 1];
    if (Math.abs(point.y - previous.y) > 0.5) return false;
    const y = point.y;
    if (y <= geometry.topPx || y >= geometry.bottomPx) return false;
    const minX = Math.min(point.x, previous.x);
    const maxX = Math.max(point.x, previous.x);
    return maxX > geometry.leftPx && minX < geometry.rightPx;
});

const sourceGeometry = {
    leftPx: 100,
    rightPx: 140,
    topPx: 0,
    bottomPx: 24,
    centerY: 12,
};

const targetGeometryBelow = {
    leftPx: 220,
    rightPx: 280,
    topPx: 48,
    bottomPx: 72,
    centerY: 60,
};

const targetGeometryAbove = {
    leftPx: 220,
    rightPx: 280,
    topPx: -60,
    bottomPx: -36,
    centerY: -48,
};

const targetGeometrySameRow = {
    leftPx: 220,
    rightPx: 280,
    topPx: 0,
    bottomPx: 24,
    centerY: 12,
};

const milestoneLagSourceGeometry = {
    leftPx: 100,
    rightPx: 118,
    centerPx: 109,
    topPx: 48,
    bottomPx: 66,
    centerY: 57,
};

assert.equal(snapDependencyCoordinate(140.24), 140, 'Las coordenadas de dependencia deben estabilizarse a una rejilla de medio pixel');
assert.equal(snapDependencyCoordinate(140.25), 140.5, 'El snap debe evitar decimales arbitrarios derivados del zoom');
assert.equal(snapDependencyCoordinate(-0.1), 0, 'El snap no debe emitir -0 en paths SVG');

assert.equal(distributeLaneOffset(0, 1), 0, 'Una sola relación no debe desplazarse');
assert.equal(distributeLaneOffset(0, 2), -2, 'Dos relaciones deben repartirse simétricamente');
assert.equal(distributeLaneOffset(1, 2), 2, 'Dos relaciones deben repartirse simétricamente');
assert.equal(distributeLaneOffset(0, 3), -6, 'Tres relaciones deben abrir un carril superior compacto');
assert.equal(distributeLaneOffset(1, 3), 0, 'La relación central debe quedar centrada');
assert.equal(distributeLaneOffset(2, 3), 6, 'Tres relaciones deben abrir un carril inferior compacto');

const simpleShortcodes = parseDependencyShortcodeTokens('3, 5FF, 6CC+2d, 10CF-30min, 11FC+50%');
assert.equal(simpleShortcodes.error, '', 'Los shortcodes simples separados por comas deben parsear sin error');
assert.deepEqual(
    simpleShortcodes.tokens.map((item) => ({
        reference: item.reference,
        dependencyType: item.dependencyType,
        lag_days: item.lag_days,
        lag_unit: item.lag_unit,
        lag_mode: item.lag_mode,
    })),
    [
        { reference: '3', dependencyType: 'FS', lag_days: 0, lag_unit: 'day', lag_mode: 'duration' },
        { reference: '5', dependencyType: 'FF', lag_days: 0, lag_unit: 'day', lag_mode: 'duration' },
        { reference: '6', dependencyType: 'SS', lag_days: 2, lag_unit: 'day', lag_mode: 'duration' },
        { reference: '10', dependencyType: 'SF', lag_days: -30, lag_unit: 'minute', lag_mode: 'duration' },
        { reference: '11', dependencyType: 'FS', lag_days: 50, lag_unit: 'percent', lag_mode: 'percent' },
    ],
    'El parser debe conservar la semántica interna FS/SS/FF/SF desde FC/CC/FF/CF',
);

const malformedShortcode = parseDependencyShortcodeTokens('FF+2d');
assert.match(malformedShortcode.error, /formato/i, 'Un shortcode sin referencia de tarea debe fallar antes de tocar datos reales');

assert.equal(
    formatDependencyShortcodeValue('3', { type: 'FS', lag_days: 0, lag_unit: 'day' }),
    '3',
    'FC sin lag debe mostrarse como referencia simple',
);
assert.equal(
    formatDependencyShortcodeValue('5', { type: 'FF', lag_days: 0, lag_unit: 'day' }),
    '5FF',
    'FF debe conservar su tipo visible aunque no tenga lag',
);
assert.equal(
    formatDependencyShortcodeValue('6', { type: 'SS', lag_days: 2, lag_unit: 'day' }),
    '6CC+2d',
    'CC con lag entero debe mantenerse compacto y sin decimales innecesarios',
);
assert.equal(
    formatDependencyShortcodeValue('10', { type: 'SF', lag_days: -30, lag_unit: 'minute' }),
    '10CF-30min',
    'CF con adelanto en minutos debe conservar signo y unidad corta',
);
assert.equal(
    formatDependencyShortcodeValue('11', { type: 'FC', lag_days: 50, lag_unit: 'percent' }),
    '11FC+50%',
    'FC con lag porcentual debe mostrar el tipo para no perder significado',
);

const baseSourceStart = new Date('2026-10-05T08:00:00');
const baseSourceFinish = new Date('2026-10-08T17:00:00');
const addDays = (value, days) => {
    const next = new Date(value);
    next.setDate(next.getDate() + Number(days || 0));
    return next;
};
const fsConstraint = resolveDependencyConstraintPresentation({
    dependency: { type: 'FC' },
    sourceStart: baseSourceStart,
    sourceFinish: baseSourceFinish,
    lagDays: 2,
    addDuration: addDays,
});
assert.equal(fsConstraint.sourceAnchor, 'finish', 'FC debe tomar el fin de la predecesora como origen semántico');
assert.equal(fsConstraint.targetAnchor, 'start', 'FC debe gobernar el inicio de la tarea destino');
assert.equal(fsConstraint.targetDate.toISOString(), '2026-10-10T22:00:00.000Z', 'FC debe aplicar lag sobre el fin origen');

const ssConstraint = resolveDependencyConstraintPresentation({
    dependency: { type: 'CC' },
    sourceStart: baseSourceStart,
    sourceFinish: baseSourceFinish,
    lagDays: 1,
    addDuration: addDays,
});
assert.equal(ssConstraint.sourceAnchor, 'start', 'CC debe tomar el comienzo de la predecesora como origen semántico');
assert.equal(ssConstraint.targetAnchor, 'start', 'CC debe gobernar el inicio de la tarea destino');
assert.equal(ssConstraint.targetDate.toISOString(), '2026-10-06T13:00:00.000Z', 'CC debe aplicar lag sobre el comienzo origen');

const ffConstraint = resolveDependencyConstraintPresentation({
    dependency: { type: 'FF' },
    sourceStart: baseSourceStart,
    sourceFinish: baseSourceFinish,
    lagDays: 0,
    addDuration: addDays,
});
assert.equal(ffConstraint.sourceAnchor, 'finish', 'FF debe tomar el fin de la predecesora como origen semántico');
assert.equal(ffConstraint.targetAnchor, 'finish', 'FF debe gobernar el fin de la tarea destino');
assert.equal(ffConstraint.targetDate.toISOString(), baseSourceFinish.toISOString(), 'FF sin lag debe igualar el fin destino al fin origen');

const sfConstraint = resolveDependencyConstraintPresentation({
    dependency: { type: 'CF' },
    sourceStart: baseSourceStart,
    sourceFinish: baseSourceFinish,
    lagDays: -1,
    addDuration: addDays,
});
assert.equal(sfConstraint.sourceAnchor, 'start', 'CF debe tomar el comienzo de la predecesora como origen semántico');
assert.equal(sfConstraint.targetAnchor, 'finish', 'CF debe gobernar el fin de la tarea destino');
assert.equal(sfConstraint.targetDate.toISOString(), '2026-10-04T13:00:00.000Z', 'CF debe aplicar lag/lead sobre el comienzo origen');

const anchorsBelow = resolveDependencyVerticalAnchors(sourceGeometry, targetGeometryBelow, null, null);
assert.deepEqual(
    anchorsBelow,
    { sourceY: 12, targetY: 60 },
    'Si la tarea destino está debajo, la conexión debe salir y entrar por la zona media de las barras',
);

const anchorsAbove = resolveDependencyVerticalAnchors(sourceGeometry, targetGeometryAbove, null, null);
assert.deepEqual(
    anchorsAbove,
    { sourceY: 12, targetY: -48 },
    'Si la tarea destino está arriba, la conexión debe salir y entrar por la zona media de las barras',
);

const anchorsSameRow = resolveDependencyVerticalAnchors(sourceGeometry, targetGeometrySameRow, null, null);
assert.deepEqual(
    anchorsSameRow,
    { sourceY: 12, targetY: 12 },
    'Si ambas tareas comparten fila, la conexión debe anclarse al centro vertical de ambas barras',
);

const fsRoute = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: targetGeometryBelow,
    sourceY: anchorsBelow.sourceY,
    targetY: anchorsBelow.targetY,
    dependencyType: 'FS',
});
const fsPoints = parsePathPoints(fsRoute.d);
assert.equal(fsPoints.at(-1).x, 220, 'FC debe terminar sobre el borde temporal exacto de inicio de la tarea destino');
assert.equal(fsPoints.at(-1).y, 48, 'FC debe llegar por la parte superior de la barra destino');
assert.equal(fsPoints[0].x, sourceGeometry.rightPx, 'FC debe arrancar exactamente desde el borde de fin de la tarea origen');
assert.equal(fsPoints[1].x - fsPoints[0].x, 8, 'FC debe salir con un micro-codo horizontal desde el borde derecho');
assert.equal(fsPoints.at(-2).x, fsPoints.at(-1).x, 'FC debe cerrar con caída vertical al borde superior del destino');
assert.equal(fsPoints.at(-1).y - fsPoints.at(-2).y, 16, 'FC debe caer desde una separación suficiente para que la cabeza de flecha no invada la barra destino');

const ssRoute = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: targetGeometryBelow,
    sourceY: anchorsBelow.sourceY,
    targetY: anchorsBelow.targetY,
    dependencyType: 'SS',
});
const ssPoints = parsePathPoints(ssRoute.d);
assert.equal(ssPoints.at(-1).x, 220, 'CC debe terminar sobre el borde temporal exacto de inicio de la tarea destino');
assert.equal(ssPoints[0].x, sourceGeometry.leftPx, 'CC debe arrancar exactamente desde el borde de inicio de la tarea origen');
assert.equal(ssPoints.at(-2).y, ssPoints.at(-1).y, 'CC en geometría inversa debe cerrar con un tramo horizontal final hasta el inicio exacto del destino');
assert.equal(ssPoints[0].x - ssPoints[1].x, 8, 'CC debe salir con un micro-codo horizontal desde el borde izquierdo');
assert.equal(ssPoints.at(-1).x - ssPoints.at(-2).x, 8, 'CC debe entrar con un micro-codo horizontal hacia el borde izquierdo');

const ffRoute = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: targetGeometryBelow,
    sourceY: anchorsBelow.sourceY,
    targetY: anchorsBelow.targetY,
    dependencyType: 'FF',
});
const ffPoints = parsePathPoints(ffRoute.d);
assert.equal(ffPoints.at(-1).x, 280, 'FF debe terminar sobre el borde temporal exacto de fin de la tarea destino');
assert.equal(ffPoints[0].x, sourceGeometry.rightPx, 'FF debe arrancar exactamente desde el borde de fin de la tarea origen');
assert.equal(ffPoints[1].x - ffPoints[0].x, 8, 'FF debe salir con un micro-codo horizontal desde el borde derecho');
assert.equal(ffPoints.at(-2).x - ffPoints.at(-1).x, 8, 'FF debe entrar con un micro-codo horizontal hacia el borde derecho');
assert.equal(ffPoints.at(-2).y, ffPoints.at(-1).y, 'FF no debe caer verticalmente sobre el destino');

const backwardFfTargetGeometry = {
    leftPx: 120,
    rightPx: 180,
    topPx: 96,
    bottomPx: 120,
    centerY: 108,
};
const backwardFfRoute = buildDependencyRoute({
    sourceGeometry: {
        leftPx: 260,
        rightPx: 340,
        topPx: 0,
        bottomPx: 24,
        centerY: 12,
    },
    targetGeometry: backwardFfTargetGeometry,
    sourceY: 12,
    targetY: backwardFfTargetGeometry.centerY,
    dependencyType: 'FF',
    sharedExitX: 380,
});
const backwardFfPoints = parsePathPoints(backwardFfRoute.d);
assert.equal(backwardFfPoints[0].x, 340, 'FF inverso debe salir desde el fin real de la predecesora');
assert.equal(backwardFfPoints.at(-1).x, 180, 'FF inverso debe terminar sobre el fin real de la sucesora');
assert.equal(backwardFfPoints.at(-2).y, backwardFfPoints.at(-1).y, 'FF inverso debe cerrar con codo horizontal, no con caída vertical');
assert.equal(backwardFfPoints.at(-2).x - backwardFfPoints.at(-1).x, 8, 'FF inverso debe entrar con micro-codo hacia el borde derecho');
assert.equal(
    backwardFfPoints.some((point) => point.x > 360),
    false,
    'FF inverso no debe salir a un carril exterior que convierta visualmente el fin-fin en una flecha lateral confusa',
);

const sfRoute = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: targetGeometryBelow,
    sourceY: anchorsBelow.sourceY,
    targetY: anchorsBelow.targetY,
    dependencyType: 'SF',
});
const sfPoints = parsePathPoints(sfRoute.d);
assert.equal(sfPoints.at(-1).x, 280, 'CF debe terminar sobre el borde temporal exacto de fin de la tarea destino');
assert.equal(sfPoints[0].x, sourceGeometry.leftPx, 'CF debe arrancar exactamente desde el borde de inicio de la tarea origen');
assert.equal(sfPoints.at(-2).y, sfPoints.at(-1).y, 'CF en geometría inversa debe cerrar con un tramo horizontal final hasta el fin exacto del destino');
assert.equal(sfPoints[0].x - sfPoints[1].x, 8, 'CF debe salir con un micro-codo horizontal desde el borde izquierdo');
assert.equal(sfPoints.at(-2).x - sfPoints.at(-1).x, 8, 'CF debe entrar con un micro-codo horizontal hacia el borde derecho');

const fsSameRowRoute = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: targetGeometrySameRow,
    sourceY: anchorsSameRow.sourceY,
    targetY: anchorsSameRow.targetY,
    dependencyType: 'FS',
});
const fsSameRowPoints = parsePathPoints(fsSameRowRoute.d);
assert.equal(fsSameRowPoints.at(-1).x, 220, 'FC en misma fila debe seguir apuntando al borde temporal exacto de inicio del destino');
assert.equal(fsSameRowPoints.at(-1).y, 0, 'FC en misma fila debe cerrar sobre el borde superior del destino');

const milestoneLagRoute = buildDependencyRoute({
    sourceGeometry: milestoneLagSourceGeometry,
    targetGeometry: {
        leftPx: 109,
        rightPx: 169,
        topPx: -24,
        bottomPx: 0,
        centerY: -12,
    },
    sourceY: 57,
    targetY: -12,
    dependencyType: 'FS',
    lagDays: 3,
    sourceIsMilestone: true,
});
const milestoneLagPoints = parsePathPoints(milestoneLagRoute.d);
assert.ok(milestoneLagPoints.length >= 2, 'Una dependencia con hito debe seguir generando una ruta válida');

const nearVerticalTargetGeometry = {
    leftPx: 156,
    rightPx: 196,
    topPx: 48,
    bottomPx: 72,
    centerY: 60,
};
const nearVerticalAnchors = resolveDependencyVerticalAnchors(sourceGeometry, nearVerticalTargetGeometry, null, null);
const nearVerticalRoute = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: nearVerticalTargetGeometry,
    sourceY: nearVerticalAnchors.sourceY,
    targetY: nearVerticalAnchors.targetY,
    dependencyType: 'FS',
});
const nearVerticalPoints = parsePathPoints(nearVerticalRoute.d);
assert.equal(
    nearVerticalPoints[0].x,
    140,
    'La ruta no debe desplazar artificialmente el origen a la x del destino cuando existe una diferencia horizontal real',
);
assert.equal(
    nearVerticalPoints.at(-1).x,
    156,
    'La llegada vertical casi pegada debe conservar el borde exacto cuando no invade el cuerpo de la barra',
);

const alignedLeftEdgeTargetGeometry = {
    leftPx: 140,
    rightPx: 190,
    topPx: 48,
    bottomPx: 72,
    centerY: 60,
};
const alignedLeftEdgeRoute = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: alignedLeftEdgeTargetGeometry,
    sourceY: sourceGeometry.centerY,
    targetY: alignedLeftEdgeTargetGeometry.centerY,
    dependencyType: 'FS',
});
const alignedLeftEdgePoints = parsePathPoints(alignedLeftEdgeRoute.d);
assert.equal(
    alignedLeftEdgePoints.at(-1).x,
    alignedLeftEdgeTargetGeometry.leftPx,
    'FC alineada por fecha debe seguir terminando en el inicio temporal exacto del destino',
);
assert.equal(
    alignedLeftEdgePoints.at(-2).x,
    alignedLeftEdgeTargetGeometry.leftPx,
    'FC alineada por fecha debe cerrar con caída vertical sobre el inicio superior del destino',
);
assert.equal(
    alignedLeftEdgePoints.some((point, index) => {
        if (index === 0) return false;
        const previous = alignedLeftEdgePoints[index - 1];
        const isVerticalSegment = Math.abs(point.x - previous.x) <= 0.5
            && Math.abs(point.y - previous.y) > 0.5;
        return isVerticalSegment && Math.abs(point.x - alignedLeftEdgeTargetGeometry.leftPx) <= 0.5
            && Math.min(point.y, previous.y) < alignedLeftEdgeTargetGeometry.topPx - 0.5
            && Math.max(point.y, previous.y) > alignedLeftEdgeTargetGeometry.topPx + 0.5;
    }),
    false,
    'FC alineada por fecha solo debe tener una caída vertical mínima hasta el borde superior del destino',
);
assert.equal(
    horizontalSegmentsCoverGeometry(alignedLeftEdgePoints, alignedLeftEdgeTargetGeometry),
    false,
    'FC alineada por fecha no debe cruzar horizontalmente el cuerpo de la barra destino',
);

const backwardFsTargetGeometry = {
    leftPx: 120,
    rightPx: 150,
    topPx: 48,
    bottomPx: 72,
    centerY: 60,
};
const backwardFsRoute = buildDependencyRoute({
    sourceGeometry: {
        leftPx: 200,
        rightPx: 260,
        topPx: 0,
        bottomPx: 24,
        centerY: 12,
    },
    targetGeometry: backwardFsTargetGeometry,
    sourceY: 12,
    targetY: backwardFsTargetGeometry.centerY,
    dependencyType: 'FS',
});
const backwardFsPoints = parsePathPoints(backwardFsRoute.d);
assert.equal(
    backwardFsPoints.at(-1).x,
    backwardFsTargetGeometry.leftPx,
    'FC inversa debe caer exactamente en el inicio real de la barra destino',
);
assert.equal(
    backwardFsPoints.at(-2).x,
    backwardFsTargetGeometry.leftPx,
    'FC inversa debe cerrar con caída vertical al borde superior destino',
);
assert.equal(
    Math.abs(backwardFsPoints.at(-2).x - backwardFsPoints.at(-1).x) <= 0.5
        && Math.abs(backwardFsPoints.at(-2).y - backwardFsPoints.at(-1).y) > 0.5,
    true,
    'FC inversa debe cerrar con caída vertical tipo MS Project',
);
assert.equal(backwardFsPoints[0].x, 260, 'FC inversa debe salir exactamente del fin real de la predecesora');
assert.equal(backwardFsPoints[0].y, 12, 'FC inversa no debe desplazar verticalmente la salida de la predecesora');
assert.equal(
    Math.max(...backwardFsPoints.map((point) => point.x)),
    268,
    'FC inversa solo debe abrir el micro-codo minimo de salida a la derecha de la predecesora',
);
backwardFsPoints.forEach((point, index) => {
    if (index === 0) return;
    const previous = backwardFsPoints[index - 1];
    assert.ok(
        Math.abs(point.x - previous.x) <= 0.5 || Math.abs(point.y - previous.y) <= 0.5,
        'FC inversa no debe introducir diagonales',
    );
});

const ffAboveRoute = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: targetGeometryAbove,
    sourceY: anchorsAbove.sourceY,
    targetY: anchorsAbove.targetY,
    dependencyType: 'FF',
});
const ffAbovePoints = parsePathPoints(ffAboveRoute.d);
assert.equal(ffAbovePoints.at(-1).x, 280, 'FF con destino arriba debe mantener la llegada en el fin exacto cuando no invade el cuerpo');
assert.equal(ffAbovePoints.at(-1).y, -48, 'FF con destino arriba debe entrar por el centro lateral de la barra destino');
assert.equal(ffAbovePoints.at(-2).x - ffAbovePoints.at(-1).x, 8, 'FF con destino arriba debe cerrar con micro-codo horizontal hacia el borde derecho');

const milestoneGeometry = {
    leftPx: 320,
    rightPx: 338,
    centerPx: 329,
    topPx: 96,
    bottomPx: 114,
    centerY: 105,
};
const taskToMilestoneLagRoute = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: milestoneGeometry,
    sourceY: sourceGeometry.centerY,
    targetY: milestoneGeometry.centerY,
    dependencyType: 'FS',
    lagDays: 0,
    targetIsMilestone: true,
});
const taskToMilestoneLagPoints = parsePathPoints(taskToMilestoneLagRoute.d);
assert.ok(
    taskToMilestoneLagPoints.length > 2,
    'Sin lag, una dependencia tarea -> hito debe usar ruteo ortogonal y no una diagonal directa',
);
assert.notEqual(
    taskToMilestoneLagPoints[0].x,
    taskToMilestoneLagPoints[1].x,
    'Sin lag, la ruta con hito no debe forzarse a una vertical artificial cuando existe un desplazamiento horizontal real',
);
assert.equal(
    taskToMilestoneLagPoints.at(-1).x,
    milestoneGeometry.centerPx,
    'La dependencia tarea -> hito debe terminar en el centro visual del hito',
);

const milestoneToTaskRoute = buildDependencyRoute({
    sourceGeometry: milestoneGeometry,
    targetGeometry: targetGeometryBelow,
    sourceY: milestoneGeometry.centerY,
    targetY: targetGeometryBelow.centerY,
    dependencyType: 'FS',
    lagDays: 0,
    sourceIsMilestone: true,
});
const milestoneToTaskPoints = parsePathPoints(milestoneToTaskRoute.d);
assert.equal(
    milestoneToTaskPoints[0].x,
    milestoneGeometry.centerPx,
    'La dependencia hito -> tarea debe salir del centro visual del hito',
);
assert.equal(
    milestoneToTaskPoints[1].x - milestoneToTaskPoints[0].x,
    8,
    'La dependencia hito -> tarea FC debe abrir con micro-codo horizontal desde el centro del hito',
);
assert.equal(
    milestoneToTaskPoints.at(-1).x,
    targetGeometryBelow.leftPx,
    'La dependencia hito -> tarea FC debe llegar al inicio temporal exacto de la tarea',
);
assert.equal(
    milestoneToTaskPoints.at(-1).y,
    targetGeometryBelow.topPx,
    'La dependencia hito -> tarea FC debe llegar al borde superior de la tarea',
);
assert.equal(
    milestoneToTaskPoints.some((point, index) => {
        if (index === 0) return false;
        const previous = milestoneToTaskPoints[index - 1];
        const isVerticalSegment = Math.abs(point.x - previous.x) <= 0.5
            && Math.abs(point.y - previous.y) > 0.5;
        return isVerticalSegment && Math.abs(point.x - targetGeometryBelow.leftPx) <= 0.5
            && Math.min(point.y, previous.y) < targetGeometryBelow.topPx - 0.5
            && Math.max(point.y, previous.y) > targetGeometryBelow.topPx + 0.5;
    }),
    false,
    'La dependencia hito -> tarea FC solo debe caer verticalmente desde la separación mínima sobre la tarea destino',
);

const projectStartMilestoneRoute = buildDependencyRoute({
    sourceGeometry: milestoneGeometry,
    targetGeometry: targetGeometryBelow,
    sourceY: milestoneGeometry.centerY,
    targetY: targetGeometryBelow.centerY,
    dependencyType: 'FS',
    sourceIsMilestone: true,
    sourceMilestoneBoundaryAnchor: 'start',
});
assert.equal(
    parsePathPoints(projectStartMilestoneRoute.d)[0].x,
    milestoneGeometry.centerPx,
    'Un hito en inicio exacto de proyecto debe conservar el centro del rombo como ancla temporal de ruta',
);

const projectFinishMilestoneRoute = buildDependencyRoute({
    sourceGeometry: milestoneGeometry,
    targetGeometry: targetGeometryBelow,
    sourceY: milestoneGeometry.centerY,
    targetY: targetGeometryBelow.centerY,
    dependencyType: 'FS',
    sourceIsMilestone: true,
    sourceMilestoneBoundaryAnchor: 'finish',
});
assert.equal(
    parsePathPoints(projectFinishMilestoneRoute.d)[0].x,
    milestoneGeometry.centerPx,
    'Un hito en fin exacto de proyecto debe conservar el centro del rombo como ancla temporal de ruta',
);

const fractionalZoomSourceGeometry = {
    leftPx: 100.33,
    rightPx: 140.66,
    topPx: 0.25,
    bottomPx: 24.25,
    centerY: 12.25,
};
const fractionalZoomTargetGeometry = {
    leftPx: 220.66,
    rightPx: 280.33,
    topPx: 48.33,
    bottomPx: 72.33,
    centerY: 60.33,
};
const fractionalRoute = buildDependencyRoute({
    sourceGeometry: fractionalZoomSourceGeometry,
    targetGeometry: fractionalZoomTargetGeometry,
    sourceY: fractionalZoomSourceGeometry.centerY,
    targetY: fractionalZoomTargetGeometry.centerY,
    dependencyType: 'FS',
    sourceOffset: -1.33,
    targetOffset: 1.33,
});
const fractionalPoints = parsePathPoints(fractionalRoute.d);
for (const point of fractionalPoints) {
    assert.equal(point.x * 2, Math.round(point.x * 2), 'Las X de rutas bajo zoom deben quedar cuantizadas a medio pixel');
    assert.equal(point.y * 2, Math.round(point.y * 2), 'Las Y de rutas bajo zoom deben quedar cuantizadas a medio pixel');
}
assert.equal(
    fractionalPoints.at(-1).x,
    snapDependencyCoordinate(fractionalZoomTargetGeometry.leftPx),
    'La llegada FC bajo zoom debe conservar el inicio exacto cuando no invade el cuerpo de la barra',
);
assert.equal(
    fractionalPoints.at(-1).y,
    snapDependencyCoordinate(fractionalZoomTargetGeometry.topPx),
    'La llegada FC bajo zoom debe estabilizar el borde superior de destino',
);

const fanOutRoute = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: targetGeometryBelow,
    sourceY: anchorsBelow.sourceY,
    targetY: anchorsBelow.targetY,
    dependencyType: 'FS',
    sourceLaneIndex: 2,
    targetLaneIndex: 1,
    sharedExitX: 332,
});
assert.equal(fanOutRoute.controlX < 332, true, 'Un fan-out compartido debe tratar el carril común como sugerencia y no crear recorridos lejanos si hay ruta local viable');

const longTargetGeometry = {
    leftPx: 220,
    rightPx: 980,
    topPx: 96,
    bottomPx: 120,
    centerY: 108,
};
const longTargetAnchors = resolveDependencyVerticalAnchors(sourceGeometry, longTargetGeometry, null, null);
const compactFsToLongTarget = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: longTargetGeometry,
    sourceY: longTargetAnchors.sourceY,
    targetY: longTargetAnchors.targetY,
    dependencyType: 'FS',
    sharedExitX: 1030,
});
const compactFsPoints = parsePathPoints(compactFsToLongTarget.d);
assert.equal(compactFsPoints.at(-1).x, 220, 'FC hacia una barra larga debe terminar en el borde temporal exacto de inicio, no viajar hasta el final de la barra');
assert.equal(compactFsToLongTarget.controlX < 360, true, 'FC hacia una barra larga debe mantener un codo local compacto tipo MS Project');
assert.equal(
    horizontalSegmentsCoverGeometry(compactFsPoints, longTargetGeometry),
    false,
    'FC hacia una barra larga no debe dibujar tramos horizontales por encima del cuerpo del Gantt destino',
);

const compactFfToLongTarget = buildDependencyRoute({
    sourceGeometry,
    targetGeometry: longTargetGeometry,
    sourceY: longTargetAnchors.sourceY,
    targetY: longTargetAnchors.targetY,
    dependencyType: 'FF',
    sharedExitX: 1030,
});
const compactFfPoints = parsePathPoints(compactFfToLongTarget.d);
assert.equal(compactFfPoints.at(-1).x, 980, 'FF debe terminar sobre el borde temporal exacto de fin de la barra destino');
assert.equal(compactFfToLongTarget.controlX <= 1030, true, 'FF puede salir por derecha, pero no debe sobrepasar innecesariamente el carril sugerido');

assert.match(
    ganttComponentSource,
    /aria-label="Editar dependencia seleccionada"/,
    'La accion flotante de una dependencia seleccionada debe abrir/editar, no sugerir borrado',
);
assert.doesNotMatch(
    ganttComponentSource,
    /key=\{`remove-\$\{path\.key\}`\}/,
    'La accion flotante no debe conservar la semantica interna de borrado directo',
);
assert.match(
    ganttComponentSource,
    /<Trash2 className="h-3\.5 w-3\.5" \/>/,
    'La ruptura de dependencia debe quedar dentro del panel como accion destructiva explicita con icono',
);
assert.match(
    ganttComponentSource,
    /aria-label="Guardar dependencia"/,
    'El panel compacto debe conservar guardado accesible mediante boton de icono',
);
assert.match(
    ganttComponentSource,
    /w-\[min\(440px,calc\(100vw-2rem\)\)\] overflow-y-auto overflow-x-hidden/,
    'El panel de dependencia debe tener ancho suficiente y bloquear desplazamiento horizontal interno',
);

console.log('smoke-cronogramas-gantt-dependencies: ok');
