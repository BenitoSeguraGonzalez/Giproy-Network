import assert from 'node:assert/strict';

const MINUTES_PER_WORK_DAY = 8 * 60;
const TOLERANCE_MINUTES = 0.05;
const TOLERANCE_MS = 1000;

const DELTA_CASES = [
    { label: '0 min', minutes: 0 },
    { label: '15 min', minutes: 15 },
    { label: '45 min', minutes: 45 },
    { label: '2 h 15 min', minutes: (2 * 60) + 15 },
    { label: 'media jornada', minutes: MINUTES_PER_WORK_DAY / 2 },
    { label: '1 d exacto', minutes: MINUTES_PER_WORK_DAY },
    { label: '1 d 2 h 15 min', minutes: MINUTES_PER_WORK_DAY + (2 * 60) + 15 },
    { label: '2 d 6 h 30 min', minutes: (2 * MINUTES_PER_WORK_DAY) + (6 * 60) + 30 },
    { label: 'cruce fin de semana', minutes: (5 * MINUTES_PER_WORK_DAY) + 30 },
    { label: '-15 min', minutes: -15 },
    { label: '-2 h 15 min', minutes: -((2 * 60) + 15) },
    { label: '-1 d exacto', minutes: -MINUTES_PER_WORK_DAY },
    { label: '-1 d 2 h 15 min', minutes: -(MINUTES_PER_WORK_DAY + (2 * 60) + 15) },
];

const SCALE_CASES = [
    { label: 'dia 96px', scale: 'day', columnWidth: 96 },
    { label: 'semana 120px', scale: 'week', columnWidth: 120 },
    { label: 'semana 240px', scale: 'week', columnWidth: 240 },
    { label: 'mes 180px', scale: 'month', columnWidth: 180 },
];

const POINTER_CASES = [
    { label: 'exacto', jitterPx: 0, scrollLeft: 0, expectsRequestedDelta: true },
    { label: 'con scroll virtual', jitterPx: 0, scrollLeft: 640, expectsRequestedDelta: true },
    { label: 'subpixel +0.33', jitterPx: 0.33, scrollLeft: 0, expectsRequestedDelta: false },
    { label: 'subpixel -0.33', jitterPx: -0.33, scrollLeft: 0, expectsRequestedDelta: false },
];

const PROJECT_START = '2026-06-01T08:00:00';

const toDate = (value) => new Date(value);
const clamp = (value, min, max) => Math.max(min, Math.min(max, Number(value || 0)));

const assertDateClose = (actual, expected, label) => {
    const diffMs = Math.abs(toDate(actual).getTime() - toDate(expected).getTime());
    assert.equal(
        diffMs <= TOLERANCE_MS,
        true,
        `${label}: fecha divergente. actual=${toDate(actual).toISOString()} expected=${toDate(expected).toISOString()} diffMs=${diffMs}`,
    );
};

const isWorkBoundaryEquivalent = (actual, expected) => {
    const actualDate = toDate(actual);
    const expectedDate = toDate(expected);
    const actualToExpectedMinutes = countWorkMinutesBetween(actualDate, expectedDate);
    const expectedToActualMinutes = countWorkMinutesBetween(expectedDate, actualDate);
    return Math.abs(actualToExpectedMinutes) <= TOLERANCE_MINUTES
        && Math.abs(expectedToActualMinutes) <= TOLERANCE_MINUTES;
};

const assertEffectiveDateCompatible = (actual, expected, label) => {
    const diffMs = Math.abs(toDate(actual).getTime() - toDate(expected).getTime());
    if (diffMs <= TOLERANCE_MS || isWorkBoundaryEquivalent(actual, expected)) return;
    assertDateClose(actual, expected, label);
};

const isWorkDay = (date) => {
    const day = date.getDay();
    return day >= 1 && day <= 5;
};

const atWorkStart = (date) => {
    const next = new Date(date);
    next.setHours(8, 0, 0, 0);
    return next;
};

const atWorkEnd = (date) => {
    const next = new Date(date);
    next.setHours(16, 0, 0, 0);
    return next;
};

const nextWorkStart = (date) => {
    const next = new Date(date);
    next.setDate(next.getDate() + 1);
    next.setHours(8, 0, 0, 0);
    while (!isWorkDay(next)) {
        next.setDate(next.getDate() + 1);
    }
    return next;
};

const previousWorkEnd = (date) => {
    const previous = new Date(date);
    previous.setDate(previous.getDate() - 1);
    previous.setHours(16, 0, 0, 0);
    while (!isWorkDay(previous)) {
        previous.setDate(previous.getDate() - 1);
    }
    return previous;
};

const alignWorkTime = (value, direction = 1) => {
    let cursor = toDate(value);
    if (!Number.isFinite(cursor.getTime())) return null;
    cursor.setMilliseconds(0);
    if (direction >= 0) {
        while (!isWorkDay(cursor)) cursor = nextWorkStart(cursor);
        if (cursor < atWorkStart(cursor)) return atWorkStart(cursor);
        if (cursor >= atWorkEnd(cursor)) return nextWorkStart(cursor);
        return cursor;
    }
    while (!isWorkDay(cursor)) cursor = previousWorkEnd(cursor);
    if (cursor > atWorkEnd(cursor)) return atWorkEnd(cursor);
    if (cursor < atWorkStart(cursor)) return previousWorkEnd(cursor);
    return cursor;
};

const addWorkMinutes = (value, minutes) => {
    if (Math.abs(Number(minutes || 0)) <= TOLERANCE_MINUTES) {
        const cursor = toDate(value);
        cursor.setMilliseconds(0);
        return cursor;
    }
    const direction = minutes < 0 ? -1 : 1;
    let remaining = Math.abs(minutes);
    let cursor = alignWorkTime(value, direction);
    assert.ok(cursor, 'Fecha de trabajo valida');
    while (remaining > TOLERANCE_MINUTES) {
        if (direction >= 0) {
            const end = atWorkEnd(cursor);
            const available = Math.max(0, (end.getTime() - cursor.getTime()) / 60000);
            if (remaining <= available + TOLERANCE_MINUTES) {
                return new Date(cursor.getTime() + (remaining * 60000));
            }
            remaining -= available;
            cursor = nextWorkStart(cursor);
        } else {
            const start = atWorkStart(cursor);
            const available = Math.max(0, (cursor.getTime() - start.getTime()) / 60000);
            if (remaining <= available + TOLERANCE_MINUTES) {
                return new Date(cursor.getTime() - (remaining * 60000));
            }
            remaining -= available;
            cursor = previousWorkEnd(cursor);
        }
    }
    return cursor;
};

const countWorkMinutesBetween = (startValue, endValue) => {
    const start = toDate(startValue);
    const end = toDate(endValue);
    const direction = end >= start ? 1 : -1;
    let cursor = alignWorkTime(start, direction);
    const target = alignWorkTime(end, direction);
    assert.ok(cursor && target, 'Rango laboral valido');
    let minutes = 0;
    while ((direction >= 0 && cursor < target) || (direction < 0 && cursor > target)) {
        if (direction >= 0) {
            const endOfDay = atWorkEnd(cursor);
            const next = endOfDay < target ? endOfDay : target;
            minutes += Math.max(0, (next.getTime() - cursor.getTime()) / 60000);
            cursor = next >= target ? target : nextWorkStart(cursor);
        } else {
            const startOfDay = atWorkStart(cursor);
            const next = startOfDay > target ? startOfDay : target;
            minutes += Math.max(0, (cursor.getTime() - next.getTime()) / 60000);
            cursor = next <= target ? target : previousWorkEnd(cursor);
        }
    }
    return direction * minutes;
};

const finishOf = (task) => (
    Number(task.durationMinutes || 0) <= 0
        ? toDate(task.start)
        : addWorkMinutes(task.start, task.durationMinutes)
);

const normalizeDate = (date) => toDate(date).toISOString().slice(0, 16);

const normalizeSchedule = (schedule) => Object.fromEntries(
    Object.entries(schedule)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([id, task]) => [
            id,
            {
                start: normalizeDate(task.start),
                finish: normalizeDate(finishOf(task)),
                durationMinutes: Number(task.durationMinutes || 0),
            },
        ]),
);

const dependencyAnchorSource = (source, type) => (
    type === 'SS' || type === 'SF'
        ? toDate(source.start)
        : finishOf(source)
);

const dependencyAnchorTarget = (target, type) => (
    type === 'FF' || type === 'SF'
        ? finishOf(target)
        : toDate(target.start)
);

const buildSuccessorMap = (dependencies) => {
    const map = new Map();
    dependencies.forEach((dependency) => {
        map.set(dependency.source, [...(map.get(dependency.source) || []), dependency]);
    });
    return map;
};

const collectAffectedRoute = (sourceId, dependencies) => {
    const successorMap = buildSuccessorMap(dependencies);
    const affected = new Set();
    const queue = [...(successorMap.get(sourceId) || []).map((dependency) => dependency.target)];
    while (queue.length) {
        const current = queue.shift();
        if (affected.has(current)) continue;
        affected.add(current);
        queue.push(...(successorMap.get(current) || []).map((dependency) => dependency.target));
    }
    return affected;
};

const recalibrateIncomingLags = (schedule, dependencies, movedId) => dependencies.map((dependency) => {
    if (dependency.target !== movedId) return { ...dependency };
    const source = schedule[dependency.source];
    const target = schedule[dependency.target];
    const nextLagMinutes = countWorkMinutesBetween(
        dependencyAnchorSource(source, dependency.type),
        dependencyAnchorTarget(target, dependency.type),
    );
    return {
        ...dependency,
        lagMinutes: nextLagMinutes,
    };
});

const previewFormulaFromTemporalDelta = ({ schedule, dependencies, movedId, deltaMinutes }) => {
    const affected = collectAffectedRoute(movedId, dependencies);
    const next = structuredClone(schedule);
    [movedId, ...affected].forEach((id) => {
        next[id].start = addWorkMinutes(next[id].start, deltaMinutes).toISOString();
    });
    return {
        schedule: next,
        dependencies: recalibrateIncomingLags(next, dependencies, movedId),
    };
};

const commitFormulaFromTemporalDelta = ({ schedule, dependencies, movedId, deltaMinutes }) => {
    const next = structuredClone(schedule);
    const movedStart = addWorkMinutes(next[movedId].start, deltaMinutes);
    const effectiveDelta = countWorkMinutesBetween(next[movedId].start, movedStart);
    next[movedId].start = movedStart.toISOString();
    collectAffectedRoute(movedId, dependencies).forEach((id) => {
        next[id].start = addWorkMinutes(next[id].start, effectiveDelta).toISOString();
    });
    return {
        schedule: next,
        dependencies: recalibrateIncomingLags(next, dependencies, movedId),
    };
};

const startOfWeek = (value) => {
    const date = toDate(value);
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
    date.setHours(0, 0, 0, 0);
    return date;
};

const startOfMonth = (value) => {
    const date = toDate(value);
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
    return date;
};

const buildTimelineSegments = ({ scale, minDate, maxDate }) => {
    const segments = [];
    if (scale === 'day') {
        const cursor = toDate(minDate);
        cursor.setHours(0, 0, 0, 0);
        const end = toDate(maxDate);
        end.setHours(0, 0, 0, 0);
        while (cursor <= end) {
            const start = new Date(cursor);
            const exclusiveEnd = new Date(start);
            exclusiveEnd.setDate(exclusiveEnd.getDate() + 1);
            segments.push({ start, end: new Date(exclusiveEnd.getTime() - 1), exclusiveEnd });
            cursor.setDate(cursor.getDate() + 1);
        }
        return segments;
    }
    if (scale === 'month') {
        const cursor = startOfMonth(minDate);
        const end = startOfMonth(maxDate);
        while (cursor <= end) {
            const start = new Date(cursor);
            const exclusiveEnd = new Date(start.getFullYear(), start.getMonth() + 1, 1);
            segments.push({ start, end: new Date(exclusiveEnd.getTime() - 1), exclusiveEnd });
            cursor.setMonth(cursor.getMonth() + 1);
        }
        return segments;
    }
    const cursor = startOfWeek(minDate);
    const end = startOfWeek(maxDate);
    while (cursor <= end) {
        const start = new Date(cursor);
        const exclusiveEnd = new Date(start);
        exclusiveEnd.setDate(exclusiveEnd.getDate() + 7);
        segments.push({ start, end: new Date(exclusiveEnd.getTime() - 1), exclusiveEnd });
        cursor.setDate(cursor.getDate() + 7);
    }
    return segments;
};

const getTimelineWidthPx = (timelineSegments, segmentColumnWidth) => (
    Math.max(timelineSegments.length, 1) * Math.max(1, Number(segmentColumnWidth || 1))
);

const getDatePositionPx = (value, timelineSegments, segmentColumnWidth) => {
    const target = toDate(value);
    const timelineWidth = getTimelineWidthPx(timelineSegments, segmentColumnWidth);
    const firstStart = new Date(timelineSegments[0].start);
    if (target <= firstStart) return 0;

    for (let index = 0; index < timelineSegments.length; index += 1) {
        const segment = timelineSegments[index];
        const start = new Date(segment.start);
        const endExclusive = new Date(segment.exclusiveEnd || segment.end);
        if (target < endExclusive) {
            const spanMs = Math.max(1, endExclusive.getTime() - start.getTime());
            const offsetMs = clamp(target.getTime() - start.getTime(), 0, spanMs);
            return (index * segmentColumnWidth) + ((offsetMs / spanMs) * segmentColumnWidth);
        }
    }
    return timelineWidth;
};

const getTimelineDateFromPx = (positionPx, timelineSegments, segmentColumnWidth) => {
    const timelineWidth = getTimelineWidthPx(timelineSegments, segmentColumnWidth);
    const normalizedPx = clamp(Number(positionPx || 0), 0, timelineWidth);
    for (let index = 0; index < timelineSegments.length; index += 1) {
        const segmentStartPx = index * segmentColumnWidth;
        const segmentEndPx = segmentStartPx + segmentColumnWidth;
        if (normalizedPx > segmentEndPx && index < timelineSegments.length - 1) continue;
        const start = new Date(timelineSegments[index].start);
        const endExclusive = new Date(timelineSegments[index].exclusiveEnd || timelineSegments[index].end);
        const segmentSpanMs = Math.max(1, endExclusive.getTime() - start.getTime());
        const segmentRatio = clamp((normalizedPx - segmentStartPx) / Math.max(1, segmentColumnWidth), 0, 1);
        return new Date(start.getTime() + Math.floor(segmentRatio * segmentSpanMs));
    }
    return new Date(timelineSegments[timelineSegments.length - 1].end);
};

const resolvePreviewContractFromPointer = ({
    schedule,
    dependencies,
    movedId,
    pixelDelta,
    timelineSegments,
    columnWidth,
}) => {
    const originalStart = toDate(schedule[movedId].start);
    const originalStartPx = getDatePositionPx(originalStart, timelineSegments, columnWidth);
    const width = getTimelineWidthPx(timelineSegments, columnWidth);
    const rawPointerDate = getTimelineDateFromPx(originalStartPx + pixelDelta, timelineSegments, columnWidth);
    const direction = pixelDelta < 0 ? -1 : 1;
    const effectiveStartDate = alignWorkTime(rawPointerDate, direction);
    const minimumStart = alignWorkTime(PROJECT_START, 1);
    const boundedStart = effectiveStartDate < minimumStart ? minimumStart : effectiveStartDate;
    const effectiveDeltaMinutes = countWorkMinutesBetween(originalStart, boundedStart);
    const preview = previewFormulaFromTemporalDelta({
        schedule,
        dependencies,
        movedId,
        deltaMinutes: effectiveDeltaMinutes,
    });
    return {
        ...preview,
        rawPointerDate,
        effectiveStartDate: boundedStart,
        effectiveDeltaMinutes,
        translationPx: clamp(getDatePositionPx(boundedStart, timelineSegments, columnWidth), 0, width) - originalStartPx,
    };
};

const commitFormulaFromPreviewContract = ({ schedule, dependencies, movedId, previewContract }) => (
    commitFormulaFromTemporalDelta({
        schedule,
        dependencies,
        movedId,
        deltaMinutes: previewContract.effectiveDeltaMinutes,
    })
);

const assertDependenciesStillSatisfied = (schedule, dependencies, label) => {
    dependencies.forEach((dependency) => {
        const source = schedule[dependency.source];
        const target = schedule[dependency.target];
        const expected = addWorkMinutes(
            dependencyAnchorSource(source, dependency.type),
            dependency.lagMinutes || 0,
        );
        const actualAnchor = dependencyAnchorTarget(target, dependency.type);
        const diff = countWorkMinutesBetween(expected, actualAnchor);
        assert.equal(
            Math.abs(diff) <= TOLERANCE_MINUTES,
            true,
            `${label}: dependencia ${dependency.source}->${dependency.target} ${dependency.type} no queda cerrada (${diff} min)`,
        );
    });
};

const baseSchedule = {
    h0: { start: '2026-06-01T08:00:00', durationMinutes: 0, kind: 'manual_milestone' },
    fsTask: { start: '2026-06-01T08:00:00', durationMinutes: 90, kind: 'task' },
    ssTask: { start: '2026-06-01T10:15:00', durationMinutes: 180, kind: 'task' },
    ffTask: { start: '2026-06-01T11:15:00', durationMinutes: 120, kind: 'task' },
    sfMilestone: { start: '2026-06-01T13:15:00', durationMinutes: 0, kind: 'milestone' },
    tailTask: { start: '2026-06-01T13:15:00', durationMinutes: 240, kind: 'task' },
};

const dependencies = [
    { source: 'h0', target: 'fsTask', type: 'FS', lagMinutes: 0 },
    { source: 'fsTask', target: 'ssTask', type: 'SS', lagMinutes: 135 },
    { source: 'ssTask', target: 'ffTask', type: 'FF', lagMinutes: 0 },
    { source: 'ffTask', target: 'sfMilestone', type: 'SF', lagMinutes: 120 },
    { source: 'sfMilestone', target: 'tailTask', type: 'FS', lagMinutes: 0 },
];

assertDependenciesStillSatisfied(baseSchedule, dependencies, 'base');

const boundaryFridayFinish = '2026-07-03T16:00:00';
assertDateClose(
    addWorkMinutes(boundaryFridayFinish, 0),
    boundaryFridayFinish,
    'Un hito de duracion cero en fin de jornada no debe saltar al siguiente lunes',
);
assertDateClose(
    addWorkMinutes(boundaryFridayFinish, -MINUTES_PER_WORK_DAY),
    '2026-07-03T08:00:00',
    'Un desplazamiento negativo de 1 dia laboral desde fin de jornada no debe descontar doble',
);
assert.equal(
    countWorkMinutesBetween('2026-07-03T16:00:00', '2026-07-03T08:00:00'),
    -MINUTES_PER_WORK_DAY,
    'El conteo inverso entre fines de jornada contiguos debe ser -1 dia laboral',
);

let temporalCases = 0;
let pointerCases = 0;

Object.keys(baseSchedule).forEach((movedId) => {
    DELTA_CASES.forEach((deltaCase) => {
        const preview = previewFormulaFromTemporalDelta({
            schedule: baseSchedule,
            dependencies,
            movedId,
            deltaMinutes: deltaCase.minutes,
        });
        const commit = commitFormulaFromTemporalDelta({
            schedule: baseSchedule,
            dependencies,
            movedId,
            deltaMinutes: deltaCase.minutes,
        });
        assert.deepEqual(
            {
                schedule: normalizeSchedule(preview.schedule),
                dependencies: preview.dependencies,
            },
            {
                schedule: normalizeSchedule(commit.schedule),
                dependencies: commit.dependencies,
            },
            `Preview temporal y commit divergen para ${movedId} con delta ${deltaCase.label}`,
        );
        assertDependenciesStillSatisfied(preview.schedule, preview.dependencies, `preview temporal ${movedId} ${deltaCase.label}`);
        assertDependenciesStillSatisfied(commit.schedule, commit.dependencies, `commit temporal ${movedId} ${deltaCase.label}`);
        temporalCases += 1;
    });
});

Object.keys(baseSchedule).forEach((movedId) => {
    DELTA_CASES.forEach((deltaCase) => {
        SCALE_CASES.forEach((scaleCase) => {
            const expectedStart = addWorkMinutes(baseSchedule[movedId].start, deltaCase.minutes);
            const minDate = addWorkMinutes(PROJECT_START, -(5 * MINUTES_PER_WORK_DAY));
            const maxDate = addWorkMinutes(PROJECT_START, 70 * MINUTES_PER_WORK_DAY);
            const timelineSegments = buildTimelineSegments({
                scale: scaleCase.scale,
                minDate,
                maxDate,
            });
            const originalPx = getDatePositionPx(baseSchedule[movedId].start, timelineSegments, scaleCase.columnWidth);
            const expectedPx = getDatePositionPx(expectedStart, timelineSegments, scaleCase.columnWidth);
            POINTER_CASES.forEach((pointerCase) => {
                const pixelDelta = (expectedPx - originalPx) + pointerCase.jitterPx;
                const clientStartX = originalPx - pointerCase.scrollLeft;
                const clientCurrentX = clientStartX + pixelDelta;
                const reconstructedPixelDelta = clientCurrentX - clientStartX;
                assert.equal(
                    Math.abs(reconstructedPixelDelta - pixelDelta) <= 0.0001,
                    true,
                    `Delta visual reconstruido invalido ${movedId} ${deltaCase.label} ${scaleCase.label} ${pointerCase.label}`,
                );
                const preview = resolvePreviewContractFromPointer({
                    schedule: baseSchedule,
                    dependencies,
                    movedId,
                    pixelDelta: reconstructedPixelDelta,
                    timelineSegments,
                    columnWidth: scaleCase.columnWidth,
                });
                const commit = commitFormulaFromPreviewContract({
                    schedule: baseSchedule,
                    dependencies,
                    movedId,
                    previewContract: preview,
                });
                const unboundedExpectedEffectiveStart = pointerCase.expectsRequestedDelta
                    ? alignWorkTime(expectedStart, deltaCase.minutes < 0 ? -1 : 1)
                    : alignWorkTime(
                        getTimelineDateFromPx(originalPx + reconstructedPixelDelta, timelineSegments, scaleCase.columnWidth),
                        reconstructedPixelDelta < 0 ? -1 : 1,
                    );
                const minimumStart = alignWorkTime(PROJECT_START, 1);
                const expectedEffectiveStart = unboundedExpectedEffectiveStart < minimumStart
                    ? minimumStart
                    : unboundedExpectedEffectiveStart;
                const expectedEffectiveDelta = countWorkMinutesBetween(baseSchedule[movedId].start, expectedEffectiveStart);
                assertEffectiveDateCompatible(
                    preview.effectiveStartDate,
                    expectedEffectiveStart,
                    `Preview desde puntero no resuelve fecha esperada para ${movedId} ${deltaCase.label} ${scaleCase.label} ${pointerCase.label}`,
                );
                assert.equal(
                    Math.abs(preview.effectiveDeltaMinutes - expectedEffectiveDelta) <= TOLERANCE_MINUTES,
                    true,
                    `Preview desde puntero no resuelve delta laboral esperado para ${movedId} ${deltaCase.label} ${scaleCase.label} ${pointerCase.label}. actual=${preview.effectiveDeltaMinutes} expected=${expectedEffectiveDelta}`,
                );
                assert.deepEqual(
                    {
                        schedule: normalizeSchedule(preview.schedule),
                        dependencies: preview.dependencies,
                    },
                    {
                        schedule: normalizeSchedule(commit.schedule),
                        dependencies: commit.dependencies,
                    },
                    `Preview desde puntero y commit divergen para ${movedId} ${deltaCase.label} ${scaleCase.label} ${pointerCase.label}`,
                );
                assertDependenciesStillSatisfied(preview.schedule, preview.dependencies, `preview puntero ${movedId} ${deltaCase.label} ${scaleCase.label} ${pointerCase.label}`);
                assertDependenciesStillSatisfied(commit.schedule, commit.dependencies, `commit puntero ${movedId} ${deltaCase.label} ${scaleCase.label} ${pointerCase.label}`);
                pointerCases += 1;
            });
        });
    });
});

console.log(`OK preview/commit double blind completo: ${temporalCases} casos temporales + ${pointerCases} casos puntero/escala/scroll = ${temporalCases + pointerCases} comprobaciones; tareas, hitos, FS/SS/FF/SF, duracion cero, deltas positivos/negativos y cruce de fin de semana.`);
