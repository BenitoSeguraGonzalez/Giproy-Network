import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const MANUAL_MILESTONE_START_SENTINEL = '__START__';

const resolveRowLineId = (row) => String(row?.budget_line_id ?? row?.linea_id ?? '');
const buildManualMilestoneLineId = (milestoneId) => `manual-milestone:${String(milestoneId || '').trim()}`;
const isManualMilestoneRow = (row = {}) => (
    row?.tipo === 'manual_milestone'
    || row?.calculation_mode === 'manual_milestone'
    || row?.metadata?.manual_milestone === true
);

const resolveManualMilestonePersistenceAnchorLineId = (rows = [], requestedAnchorId = '', calculableLineIds = null) => {
    const normalizedRequestedAnchorId = String(requestedAnchorId || '').trim();
    if (normalizedRequestedAnchorId === MANUAL_MILESTONE_START_SENTINEL) {
        return '';
    }
    const orderedRows = Array.isArray(rows) ? rows : [];
    const validCalculableIds = calculableLineIds instanceof Set ? calculableLineIds : null;
    const isPersistableCalculable = (row) => {
        const lineId = resolveRowLineId(row);
        if (!lineId) return false;
        if (validCalculableIds) {
            return validCalculableIds.has(lineId);
        }
        return Boolean(row?.is_calculable);
    };
    if (!orderedRows.length) return normalizedRequestedAnchorId;
    const requestedIndex = normalizedRequestedAnchorId
        ? orderedRows.findIndex((candidate) => resolveRowLineId(candidate) === normalizedRequestedAnchorId)
        : -1;
    if (requestedIndex >= 0) {
        const requestedRow = orderedRows[requestedIndex];
        if (isPersistableCalculable(requestedRow)) {
            return resolveRowLineId(requestedRow);
        }
        for (let index = requestedIndex + 1; index < orderedRows.length; index += 1) {
            if (isPersistableCalculable(orderedRows[index])) {
                return resolveRowLineId(orderedRows[index]);
            }
        }
        for (let index = requestedIndex - 1; index >= 0; index -= 1) {
            if (isPersistableCalculable(orderedRows[index])) {
                return resolveRowLineId(orderedRows[index]);
            }
        }
    }
    const firstCalculable = orderedRows.find((candidate) => isPersistableCalculable(candidate));
    return firstCalculable ? resolveRowLineId(firstCalculable) : normalizedRequestedAnchorId;
};

const createManualMilestoneDropResolver = ({
    rows,
    visibleSchedulableRows,
    manualMilestones,
    calculableLineIdSet,
}) => {
    const schedulableRowMeta = new Map(
        visibleSchedulableRows.map((row, index) => [
            resolveRowLineId(row),
            {
                ...row,
                sequence: Number(row.sequence_index || index + 1),
            },
        ]),
    );
    const manualMilestoneByLineId = new Map(
        manualMilestones.map((entry) => [buildManualMilestoneLineId(entry.id), entry]),
    );
    const visualRowMeta = new Map(
        rows.map((row, index) => [
            resolveRowLineId(row),
            { ...row, sequence: Number(row.sequence_index || index + 1) },
        ]),
    );

    return (lineId, targetLineId, options = {}) => {
        const normalizedLineId = String(lineId || '').trim();
        const normalizedTargetLineId = String(targetLineId || '').trim();
        const placement = options?.placement === 'before' ? 'before' : 'after';
        const sourceRow = visualRowMeta.get(normalizedLineId) || schedulableRowMeta.get(normalizedLineId) || null;
        const targetRow = visualRowMeta.get(normalizedTargetLineId) || schedulableRowMeta.get(normalizedTargetLineId) || null;
        if (!sourceRow || !targetRow) {
            return { canMove: false, reason: 'No se pudo resolver la linea origen o destino del hito.' };
        }
        if (!isManualMilestoneRow(sourceRow)) {
            return { canMove: false, reason: 'Solo los hitos manuales pueden reordenarse con este gesto.' };
        }
        const milestone = manualMilestoneByLineId.get(normalizedLineId) || null;
        if (!milestone) {
            return { canMove: false, reason: 'No se pudo resolver la persistencia del hito manual.' };
        }
        const getMilestoneDisplayAnchorId = (entry = {}) => String(
            entry?.display_after_line_id === MANUAL_MILESTONE_START_SENTINEL
                ? MANUAL_MILESTONE_START_SENTINEL
                : (entry?.display_after_line_id || entry?.after_line_id || '')
        ).trim();
        const sourcePreviousDisplayAnchorId = getMilestoneDisplayAnchorId(milestone);
        const orderedRows = rows.filter((candidate) => (
            String(resolveRowLineId(candidate) || '').trim() !== normalizedLineId
        ));
        const targetIndex = orderedRows.findIndex((candidate) => (
            String(resolveRowLineId(candidate) || '').trim() === normalizedTargetLineId
        ));
        if (targetIndex < 0) {
            return { canMove: false, reason: 'No se pudo resolver la posicion de destino del hito.' };
        }
        const nextDisplayAnchorId = placement === 'before'
            ? (targetIndex > 0 ? String(resolveRowLineId(orderedRows[targetIndex - 1]) || '').trim() : MANUAL_MILESTONE_START_SENTINEL)
            : normalizedTargetLineId;
        const nextPersistenceAnchorId = resolveManualMilestonePersistenceAnchorLineId(
            rows,
            nextDisplayAnchorId,
            calculableLineIdSet,
        );
        const targetIsManualMilestone = isManualMilestoneRow(targetRow);
        const nextMilestones = manualMilestones.map((entry) => {
            const entryLineId = buildManualMilestoneLineId(entry.id);
            if (entryLineId === normalizedLineId) {
                return {
                    ...entry,
                    after_line_id: nextPersistenceAnchorId,
                    display_after_line_id: nextDisplayAnchorId,
                };
            }
            if (getMilestoneDisplayAnchorId(entry) === normalizedLineId) {
                const followerDisplayAnchorId = sourcePreviousDisplayAnchorId;
                return {
                    ...entry,
                    after_line_id: resolveManualMilestonePersistenceAnchorLineId(
                        rows,
                        followerDisplayAnchorId,
                        calculableLineIdSet,
                    ),
                    display_after_line_id: followerDisplayAnchorId,
                };
            }
            if (targetIsManualMilestone && placement === 'before' && entryLineId === normalizedTargetLineId) {
                return {
                    ...entry,
                    after_line_id: resolveManualMilestonePersistenceAnchorLineId(
                        rows,
                        normalizedLineId,
                        calculableLineIdSet,
                    ),
                    display_after_line_id: normalizedLineId,
                };
            }
            return entry;
        });
        return {
            canMove: true,
            reason: '',
            nextMilestones,
            targetRow,
        };
    };
};

const buildSyntheticManualMilestoneRow = (milestone = {}, anchorRow = null) => {
    const milestoneId = String(milestone?.id || '').trim();
    if (!milestoneId) return null;
    const lineId = buildManualMilestoneLineId(milestoneId);
    return {
        budget_line_id: lineId,
        linea_id: lineId,
        tipo: 'manual_milestone',
        calculation_mode: 'manual_milestone',
        is_calculable: false,
        level: Number(anchorRow?.level || 0),
        metadata: {
            manual_milestone: true,
            manual_milestone_id: milestoneId,
            after_line_id: String(milestone?.after_line_id || '').trim(),
            display_after_line_id: String(
                milestone?.display_after_line_id === MANUAL_MILESTONE_START_SENTINEL
                    ? MANUAL_MILESTONE_START_SENTINEL
                    : (milestone?.display_after_line_id || milestone?.after_line_id || '')
            ).trim(),
        },
    };
};

const mergeManualMilestonesIntoRows = (rows = [], manualMilestones = []) => {
    const orderedRows = Array.isArray(rows) ? [...rows] : [];
    const normalizedMilestones = Array.isArray(manualMilestones) ? manualMilestones.filter(Boolean) : [];
    const resolveMilestoneAnchorId = (milestone) => String(
        milestone?.display_after_line_id === MANUAL_MILESTONE_START_SENTINEL
            ? MANUAL_MILESTONE_START_SENTINEL
            : (milestone?.display_after_line_id || milestone?.after_line_id || '')
    ).trim();
    const resolveManualMilestoneInsertIndex = (anchorIndex, anchorId, insertAtStart = false) => {
        let insertIndex = insertAtStart ? 0 : anchorIndex + 1;
        while (insertIndex < orderedRows.length) {
            const candidate = orderedRows[insertIndex];
            if (!isManualMilestoneRow(candidate)) break;
            const candidateAnchorId = String(candidate?.metadata?.display_after_line_id || '').trim();
            if (candidateAnchorId !== anchorId) break;
            insertIndex += 1;
        }
        return insertIndex;
    };
    const pendingMilestones = [...normalizedMilestones];
    let guard = 0;
    while (pendingMilestones.length && guard < normalizedMilestones.length + 2) {
        let insertedInPass = false;
        for (let index = 0; index < pendingMilestones.length;) {
            const milestone = pendingMilestones[index];
            const anchorId = resolveMilestoneAnchorId(milestone);
            const insertAtStart = anchorId === MANUAL_MILESTONE_START_SENTINEL;
            const anchorIndex = insertAtStart
                ? -1
                : (anchorId ? orderedRows.findIndex((candidate) => resolveRowLineId(candidate) === anchorId) : -1);
            if (anchorId && !insertAtStart && anchorIndex < 0) {
                index += 1;
                continue;
            }
            const anchorRow = insertAtStart
                ? (orderedRows[0] || null)
                : (anchorIndex >= 0 ? orderedRows[anchorIndex] : orderedRows[orderedRows.length - 1] || null);
            const syntheticRow = buildSyntheticManualMilestoneRow(milestone, anchorRow);
            if (!syntheticRow) {
                pendingMilestones.splice(index, 1);
                insertedInPass = true;
                continue;
            }
            const insertIndex = insertAtStart
                ? resolveManualMilestoneInsertIndex(-1, MANUAL_MILESTONE_START_SENTINEL, true)
                : (anchorIndex >= 0 ? resolveManualMilestoneInsertIndex(anchorIndex, anchorId, false) : orderedRows.length);
            orderedRows.splice(insertIndex, 0, syntheticRow);
            pendingMilestones.splice(index, 1);
            insertedInPass = true;
        }
        if (!insertedInPass) break;
        guard += 1;
    }
    pendingMilestones.forEach((milestone) => {
        const syntheticRow = buildSyntheticManualMilestoneRow(milestone, orderedRows[orderedRows.length - 1] || null);
        if (syntheticRow) orderedRows.push(syntheticRow);
    });
    return orderedRows;
};

const baseRows = [
    { budget_line_id: '49', linea_id: '49', is_calculable: true, descripcion: 'Replanteo y nivelacion' },
    { budget_line_id: '63', linea_id: '63', is_calculable: true, descripcion: 'Excavacion' },
    { budget_line_id: '69', linea_id: '69', is_calculable: true, descripcion: 'Hormigon' },
];
const milestone = {
    id: 'hm-smoke-drag',
    after_line_id: '49',
    display_after_line_id: '49',
    descripcion: 'Nuevo hito',
    start_date: '2026-03-24T08:00:00',
};
const milestoneLineId = buildManualMilestoneLineId(milestone.id);
const milestoneRow = {
    budget_line_id: milestoneLineId,
    linea_id: milestoneLineId,
    tipo: 'manual_milestone',
    calculation_mode: 'manual_milestone',
    is_calculable: false,
    metadata: { manual_milestone: true },
};
const rowsAfterCreate = [baseRows[0], milestoneRow, baseRows[1], baseRows[2]];
const calculableLineIdSet = new Set(baseRows.map(resolveRowLineId));

const staleResolver = createManualMilestoneDropResolver({
    rows: baseRows,
    visibleSchedulableRows: baseRows,
    manualMilestones: [],
    calculableLineIdSet,
});
const currentResolver = createManualMilestoneDropResolver({
    rows: rowsAfterCreate,
    visibleSchedulableRows: rowsAfterCreate,
    manualMilestones: [milestone],
    calculableLineIdSet,
});

assert.equal(
    staleResolver(milestoneLineId, '63', { placement: 'after' }).canMove,
    false,
    'El snapshot viejo reproduce el fallo: no conoce el hito recien creado',
);

const liveResolverRef = { current: currentResolver };
const resolverUsedByPointerUp = liveResolverRef.current || staleResolver;
const movement = resolverUsedByPointerUp(milestoneLineId, '63', { placement: 'after' });

assert.equal(movement.canMove, true, 'El pointerup debe resolver el hito usando el resolver vivo');
assert.equal(movement.nextMilestones[0].display_after_line_id, '63', 'El hito debe moverse visualmente despues de la linea destino');
assert.equal(movement.nextMilestones[0].after_line_id, '63', 'El hito debe persistir contra una linea calculable valida');

const edtOne = { budget_line_id: 'edt-1', linea_id: 'edt-1', is_calculable: false, descripcion: 'EDT 1', level: 0 };
const edtTwo = { budget_line_id: 'edt-2', linea_id: 'edt-2', is_calculable: false, descripcion: 'EDT 2', level: 1 };
const taskChild = { budget_line_id: 'task-1', linea_id: 'task-1', is_calculable: true, descripcion: 'Tarea hija', level: 2 };
const milestoneOne = {
    id: 'hm-one',
    after_line_id: 'task-1',
    display_after_line_id: 'edt-2',
    descripcion: 'Hito uno',
};
const milestoneTwo = {
    id: 'hm-two',
    after_line_id: 'task-1',
    display_after_line_id: buildManualMilestoneLineId('hm-one'),
    descripcion: 'Hito dos',
};
const visualRowsWithEdtAndMilestones = mergeManualMilestonesIntoRows(
    [edtOne, edtTwo, taskChild],
    [milestoneOne, milestoneTwo],
);
assert.deepEqual(
    visualRowsWithEdtAndMilestones.map(resolveRowLineId),
    ['edt-1', 'edt-2', buildManualMilestoneLineId('hm-one'), buildManualMilestoneLineId('hm-two'), 'task-1'],
    'La insercion inicial debe respetar EDT > subEDT > hito 1 > hito 2 > tarea',
);

const visualResolver = createManualMilestoneDropResolver({
    rows: visualRowsWithEdtAndMilestones,
    visibleSchedulableRows: visualRowsWithEdtAndMilestones.filter((row) => row.is_calculable || isManualMilestoneRow(row)),
    manualMilestones: [milestoneOne, milestoneTwo],
    calculableLineIdSet: new Set(['task-1']),
});
const moveFirstMilestoneUp = visualResolver(buildManualMilestoneLineId('hm-one'), 'edt-2', { placement: 'before' });
assert.equal(moveFirstMilestoneUp.canMove, true, 'El hito debe poder moverse antes de una subEDT visible');
assert.equal(moveFirstMilestoneUp.nextMilestones[0].display_after_line_id, 'edt-1', 'Subir el primer hito debe colocarlo entre las dos EDT');
assert.equal(moveFirstMilestoneUp.nextMilestones[1].display_after_line_id, 'edt-2', 'El segundo hito debe quedarse bajo la subEDT, no seguir al primero como bloque');
assert.deepEqual(
    mergeManualMilestonesIntoRows([edtOne, edtTwo, taskChild], moveFirstMilestoneUp.nextMilestones).map(resolveRowLineId),
    ['edt-1', buildManualMilestoneLineId('hm-one'), 'edt-2', buildManualMilestoneLineId('hm-two'), 'task-1'],
    'Subir el primer hito no debe mandar hitos al final ni mover el bloque completo',
);

const moveFirstMilestoneDown = visualResolver(buildManualMilestoneLineId('hm-one'), buildManualMilestoneLineId('hm-two'), { placement: 'after' });
assert.equal(moveFirstMilestoneDown.canMove, true, 'El hito debe poder intercambiarse con el hito siguiente');
assert.equal(moveFirstMilestoneDown.nextMilestones[0].display_after_line_id, buildManualMilestoneLineId('hm-two'), 'El primer hito debe quedar despues del segundo');
assert.equal(moveFirstMilestoneDown.nextMilestones[1].display_after_line_id, 'edt-2', 'El segundo hito debe tomar el ancla visual anterior del primero');
assert.deepEqual(
    mergeManualMilestonesIntoRows([edtOne, edtTwo, taskChild], moveFirstMilestoneDown.nextMilestones).map(resolveRowLineId),
    ['edt-1', 'edt-2', buildManualMilestoneLineId('hm-two'), buildManualMilestoneLineId('hm-one'), 'task-1'],
    'Bajar el primer hito debe intercambiar solo esos dos hitos y no enviarlos al final',
);

const buildManualMilestonesSignature = (milestones = []) => JSON.stringify(
    (Array.isArray(milestones) ? milestones : []).map((entry) => ({
        id: String(entry?.id || '').trim(),
        after_line_id: String(entry?.after_line_id || '').trim(),
        display_after_line_id: String(
            entry?.display_after_line_id === MANUAL_MILESTONE_START_SENTINEL
                ? MANUAL_MILESTONE_START_SENTINEL
                : (entry?.display_after_line_id || '')
        ).trim(),
        descripcion: String(entry?.descripcion || '').trim(),
        start_date: String(entry?.start_date || '').trim(),
        dependencies: Array.isArray(entry?.dependencies) ? entry.dependencies : [],
        predecessors: Array.isArray(entry?.predecessors) ? entry.predecessors : [],
        successor_dependencies: Array.isArray(entry?.successor_dependencies) ? entry.successor_dependencies : [],
    }))
);
const preservePendingManualMilestonesDuringExternalConfigSync = ({
    currentMilestones,
    incomingMilestones,
    pendingSignature,
}) => {
    if (!pendingSignature) return { milestones: incomingMilestones, pendingSignature: null };
    const incomingSignature = buildManualMilestonesSignature(incomingMilestones);
    if (incomingSignature === pendingSignature) {
        return { milestones: incomingMilestones, pendingSignature: null };
    }
    return { milestones: currentMilestones, pendingSignature };
};

const movedMilestones = moveFirstMilestoneUp.nextMilestones;
const pendingSignature = buildManualMilestonesSignature(movedMilestones);
const staleExternalConfigMilestones = [milestoneOne, milestoneTwo];
const guardedStaleSync = preservePendingManualMilestonesDuringExternalConfigSync({
    currentMilestones: movedMilestones,
    incomingMilestones: staleExternalConfigMilestones,
    pendingSignature,
});
assert.deepEqual(
    guardedStaleSync.milestones.map((entry) => entry.display_after_line_id),
    movedMilestones.map((entry) => entry.display_after_line_id),
    'Una rehidratacion externa antigua no debe devolver el hito a su posicion inicial mientras guarda',
);
const guardedPersistedSync = preservePendingManualMilestonesDuringExternalConfigSync({
    currentMilestones: movedMilestones,
    incomingMilestones: movedMilestones,
    pendingSignature: guardedStaleSync.pendingSignature,
});
assert.equal(
    guardedPersistedSync.pendingSignature,
    null,
    'Cuando llega la configuracion persistida equivalente, el bloqueo optimista debe liberarse',
);

const componentSource = readFileSync(
    resolve('src/components/projects/CronogramaGantt.jsx'),
    'utf8',
);
assert.match(
    componentSource,
    /dragResolveManualMilestoneVerticalDropRef\.current\s*\|\|\s*resolveManualMilestoneVerticalDrop/,
    'El drag global debe consumir la referencia viva del resolver de hitos manuales',
);
assert.match(
    componentSource,
    /pendingManualMilestonesSignatureRef/,
    'La rehidratacion de config debe respetar hitos manuales pendientes de persistencia',
);
assert.match(
    componentSource,
    /gantt_manual_milestone_move/,
    'Mover horizontalmente un hito manual debe persistir una cascada propia identificable',
);
assert.match(
    componentSource,
    /const resolveManualMilestoneMovePreview = \(\{[\s\S]*rawPointerDate[\s\S]*snappedStartDate[\s\S]*effectiveStartDate[\s\S]*effectiveLaborDelta[\s\S]*milestoneDraft/s,
    'El preview de hito manual debe resolverse en un contrato temporal autoritativo unico',
);
assert.match(
    componentSource,
    /interaction\.snapManualMilestoneToWorkdayStart[\s\S]*shiftToGanttLaborableDate\(rawPointerDate,\s*config,\s*direction\)[\s\S]*shiftToGanttWorkingDateTime\(rawPointerDate,\s*config,\s*direction\)/s,
    'Un hito manual inicio de ruta debe normalizar el drop por dia al inicio de jornada laboral, no al cierre de jornada',
);
assert.match(
    componentSource,
    /snapManualMilestoneToWorkdayStart:\s*Boolean\([\s\S]*manualMilestoneHasSuccessors[\s\S]*!manualMilestoneHasIncomingDependencies[\s\S]*\)/s,
    'Solo los hitos manuales de inicio de ruta deben activar el snap a inicio de jornada',
);
assert.match(
    componentSource,
    /const milestoneStartValue = toNativeDateTimeValue\(effectiveStartDate, config, 'start'\);[\s\S]*const milestoneStartDate = normalizeDate\(milestoneStartValue\) \|\| effectiveStartDate;[\s\S]*countGanttWorkDurationDaysBetween\(\s*interaction\.originalStartDate,\s*milestoneStartDate,\s*config,\s*\)[\s\S]*start_date: milestoneStartValue,[\s\S]*end_date: milestoneStartValue/s,
    'El preview de hito manual debe calcular delta y draft desde la misma fecha normalizada que usa el commit',
);
assert.match(
    componentSource,
    /const manualMilestonePreview = resolveManualMilestoneMovePreview\(\{[\s\S]*interaction\.manualMilestonePreview = manualMilestonePreview[\s\S]*const dayDelta =[\s\S]*manualMilestonePreview[\s\S]*manualMilestonePreview\.effectiveLaborDelta[\s\S]*runtimeBuildManualMilestoneCascadeShiftDrafts\?\.\(\s*interaction\.lineId,\s*dayDelta/s,
    'El preview horizontal de un hito manual debe trasladar la cascada por el delta laboral efectivo del contrato, sin reinterpretar toda la red durante el drag',
);
assert.match(
    componentSource,
    /interaction\.type === 'move'[\s\S]*&& interaction\.isManualMilestoneDrag[\s\S]*&& interaction\.interactionScope === 'task'[\s\S]*&& Math\.abs\(verticalPixelDelta\) > Math\.abs\(pixelDelta\)[\s\S]*delete interaction\.manualMilestonePreview[\s\S]*flushBufferedDragPreview\(null\);[\s\S]*return;/,
    'Un gesto vertical sobre un hito manual no debe activar ni conservar preview horizontal de traslado',
);
assert.match(
    componentSource,
    /interaction\.interactionScope === 'task'[\s\S]*&& !interaction\.isManualMilestoneDrag[\s\S]*beginDependencyLinkFromDragInteraction\(interaction, event\.clientX, event\.clientY\)/,
    'El cuerpo de un hito manual no debe convertirse automaticamente en creador de dependencia durante el drag',
);
assert.match(
    componentSource,
    /const activationDistance = interaction\.verticalOnly[\s\S]*\? Math\.abs\(verticalPixelDelta\)[\s\S]*: interaction\.isManualMilestoneDrag && interaction\.interactionScope === 'task'[\s\S]*\? Math\.abs\(pixelDelta\)/,
    'El drag normal de hito manual debe activarse por intencion horizontal; los gestos verticales no deben contaminar el preview temporal',
);
assert.match(
    componentSource,
    /const startDependencyLink = \(event, row\) => \{[\s\S]*dragInteractionRef\.current = null;[\s\S]*setDraggingBarId\(null\);[\s\S]*flushBufferedDragPreview\(null\);/,
    'El enlace explicito debe apagar cualquier preview de drag antes de iniciar linkingState',
);
assert.match(
    componentSource,
    /dependencyLinkRef\.current = null;[\s\S]*setLinkingState\(null\);[\s\S]*flushBufferedDragPreview\(null\);[\s\S]*dragInteractionRef\.current = \{/,
    'El inicio de drag debe apagar cualquier linkingState anterior antes de crear un preview de movimiento',
);
assert.match(
    componentSource,
    /const finalMilestonePreview = interaction\.manualMilestonePreview \|\| null;[\s\S]*const commitMilestoneMoveDeltaDays = countGanttWorkDurationDaysBetween[\s\S]*const effectiveMilestoneMoveDeltaDays = finalMilestonePreview[\s\S]*finalMilestonePreview\.effectiveLaborDelta[\s\S]*commitMilestoneMoveDeltaDays;[\s\S]*const dependentPatches = dragBuildManualMilestoneCascadeShiftDraftsRef\.current\?\.\(\s*normalizedLineId,\s*effectiveMilestoneMoveDeltaDays,\s*milestoneDraftSnapshot,\s*\) \|\| \{\};[\s\S]*const patchesToPersist = dependentPatches;/,
    'Al soltar un hito manual, la cascada persistida debe reutilizar el delta laboral efectivo del contrato final de preview',
);
assert.match(
    componentSource,
    /const manualHistoryLineIds = Object\.keys\(dependentPatches \|\| \{\}\);[\s\S]*const manualHistoryBeforeDrafts = manualHistoryLineIds\.reduce\([\s\S]*buildGanttPersistableDraftSnapshot\([\s\S]*runtimeDrafts\[normalizedHistoryLineId\] \|\| \{\}[\s\S]*beforeDrafts: manualHistoryBeforeDrafts/s,
    'El undo de movimiento de hito debe congelar el snapshot anterior de sucesoras antes del commit, sin depender del render posterior',
);
assert.match(
    componentSource,
    /const manualBaseDrafts = Array\.isArray\(manualSnapshot\)[\s\S]*buildManualMilestoneDraftBase\(manualSnapshot\)[\s\S]*const manualDependencyBaseDrafts = Array\.isArray\(manualSnapshot\)[\s\S]*buildManualMilestoneDependencyDraftBase\(manualSnapshot[\s\S]*const cascadeBaseDrafts = \{[\s\S]*\.\.\.drafts,[\s\S]*\.\.\.lineDrafts,[\s\S]*\.\.\.manualBaseDrafts,[\s\S]*\.\.\.manualDependencyBaseDrafts,[\s\S]*buildDependentScheduleDrafts\(sourceLineId, cascadeBaseDrafts\)[\s\S]*lineDrafts = \{[\s\S]*\.\.\.lineDrafts,[\s\S]*\.\.\.rebuiltCascadeDrafts/s,
    'Al aplicar undo/redo de un hito manual, la ruta dependiente debe reconstruirse desde el snapshot manual y la formula autoritativa, incluso si el historial antiguo trae drafts incompletos',
);
assert.match(
    componentSource,
    /const hasGanttContext = Boolean\(selectedTaskId \|\| taskActionMenu\?\.lineId \|\| ganttUndoStack\.length \|\| ganttRedoStack\.length\);[\s\S]*if \(!eventInsideGantt && !focusInsideGantt && !hasGanttContext\) return;[\s\S]*tabIndex=\{-1\}[\s\S]*onPointerDownCapture=\{\(\) => \{[\s\S]*ganttRootRef\.current\?\.focus\?\.\(\{ preventScroll: true \}\);/s,
    'Los atajos Ctrl+Z/Ctrl+U deben funcionar tras interactuar con el Gantt aunque el foco del navegador quede en body',
);
assert.match(
    componentSource,
    /runtimePersistDraftPatches\?\.\(patchesToPersist,\s*\{\s*source:\s*'gantt_manual_milestone_move'/s,
    'Mover horizontalmente un hito manual debe persistir la cascada protegida',
);
assert.match(
    componentSource,
    /pendingManualMilestonesSignatureRef\.current\s*=\s*buildManualMilestonesSignature\(nextMilestones\)[\s\S]*setConfigDraft\(\(current\)\s*=>\s*\(\{\s*\.\.\.current,\s*manual_milestones:\s*nextMilestones/s,
    'Al soltar un hito manual, la posicion optimista debe mantenerse mientras se guarda la cascada',
);
assert.match(
    componentSource,
    /if\s*\(!persistedPatches\)\s*\{[\s\S]*pendingManualMilestonesSignatureRef\.current\s*=\s*null[\s\S]*manual_milestones:\s*previousManualMilestones/s,
    'Si falla la cascada, el hito manual debe revertir su posicion optimista',
);
assert.match(
    componentSource,
    /const interactionIsManualMilestone = isManualMilestoneRow\(interaction\.row, interaction\.originalDraft \|\| \{\}\);[\s\S]*if \(\(!interactionIsManualMilestone && interaction\.lastDeltaDays === 0\) \|\| !interaction\.currentDraft\)/,
    'Un hito manual movido por horas no debe descartarse por lastDeltaDays === 0 antes de persistir su fecha real',
);
assert.match(
    componentSource,
    /const previousStartDate = interaction\.originalDraft\?\.start_date \|\| milestone\?\.start_date \|\| null;[\s\S]*const hasStartDateChanged = nextStartDate && String\(nextStartDate\) !== String\(previousStartDate \|\| ''\);/,
    'El commit de hito manual debe decidir por cambio real de fecha/hora, no por delta entero de dias',
);
assert.match(
    componentSource,
    /interaction\.lastHorizontalDeltaPx = pixelDelta;[\s\S]*const horizontalDeltaPx = interaction\.isManualMilestoneDrag\s*\?\s*Number\(interaction\.lastHorizontalDeltaPx \|\| 0\)\s*:\s*Number\(interaction\.lastDeltaDays \|\| 0\) \* Number\(interaction\.pixelsPerDay \|\| 0\);/s,
    'El pointerup de un hito manual debe clasificar el gesto por delta horizontal real del puntero, no por dias laborales que pueden redondearse a 0',
);
assert.match(
    componentSource,
    /activePreview\.type === 'move'[\s\S]*&& isManualMilestone[\s\S]*&& activePreview\?\.currentDraft\?\.start_date[\s\S]*previewStart = activePreview\.currentDraft\.start_date;/s,
    'El helper visible de hito manual debe mostrar la fecha real del draft calculado durante el drag',
);
assert.match(
    componentSource,
    /isManualMilestone \? 'Moviendo hito' : 'Moviendo tarea'/,
    'El helper visible debe identificar el movimiento de hito manual y no presentarlo como tarea de duracion cero',
);
assert.match(
    componentSource,
    /activePreview\.type === 'move' && isManualMilestone[\s\S]*formatMovementDelta\(activePreview\.manualMilestonePreview\?\.effectiveLaborDelta \?\? activePreview\.deltaDays \?\? 0, configDraft\)/,
    'El helper de hito manual debe mostrar delta de movimiento en la unidad real, no solo duracion cero ni dias redondeados',
);
assert.match(
    componentSource,
    /manualMilestonePreview[\s\S]*Math\.abs\(Number\(manualMilestonePreview\.effectiveLaborDelta \|\| 0\)\) < 0\.000001[\s\S]*flushBufferedDragPreview\(null\);[\s\S]*return;/,
    'Un preview de hito manual sin movimiento efectivo no debe quedar visible como Moviendo hito 0,00 d',
);
assert.doesNotMatch(
    componentSource,
    /manualMilestonePreview[\s\S]*effectiveLaborDelta[\s\S]*&&\s*Math\.abs\(Number\(manualMilestonePreview\.translationPx \|\| 0\)\) < 0\.5[\s\S]*flushBufferedDragPreview\(null\);[\s\S]*return;/,
    'El apagado de preview cero de hito manual no puede depender de translationPx',
);
assert.match(
    componentSource,
    /isManualMilestone \? formatDateTime\(previewStart\) : formatDate\(previewStart\)[\s\S]*isManualMilestone \? formatDateTime\(previewEnd\) : formatDate\(previewEnd\)/,
    'El helper de hito manual debe mostrar fecha-hora para no ocultar movimientos dentro del mismo dia',
);
assert.doesNotMatch(
    componentSource,
    /manualMilestoneStartDate/,
    'El hito manual no debe conservar una segunda fuente temporal paralela fuera de manualMilestonePreview',
);
assert.match(
    componentSource,
    /activePreview\.manualMilestonePreview\?\.effectiveLaborDelta \?\? activePreview\.deltaDays \?\? 0/,
    'El helper de hito manual debe leer primero el delta laboral efectivo del contrato de preview',
);
assert.match(
    componentSource,
    /const taskMoveGuide = \(\(\) => \{[\s\S]*if \(shouldDisableDependencyInteractionLayer\) \{[\s\S]*return null;[\s\S]*\}[\s\S]*resolveTaskMoveGuideAnchors/,
    'El modo de movimiento de hito manual no debe renderizar la guia generica por pixeles/dia que puede mostrar deltas paralelos como 46,67 d',
);
assert.match(
    componentSource,
    /interaction\.previewCommitContract = \{[\s\S]*currentDraft,[\s\S]*previewPatches,[\s\S]*manualMilestonePreview/s,
    'Cada preview de movimiento debe conservar su contrato calculado para poder compararlo contra el commit',
);
assert.match(
    componentSource,
    /previewCommitPatchMapsMatch\([\s\S]*previewContract\.previewPatches[\s\S]*dependentPatches[\s\S]*Movimiento cancelado: la cascada preview y la cascada commit no coinciden/s,
    'El commit de hito manual debe bloquearse si la cascada final difiere de la cascada mostrada en preview',
);
assert.match(
    componentSource,
    /previewCommitPatchMapsMatch\(previewPatchSet, patchesToPersist, runtimeConfigDraft\)[\s\S]*Movimiento cancelado: el calculo preview y el calculo commit no coinciden/s,
    'El commit de tareas debe bloquearse si el calculo final difiere del preview',
);
assert.match(
    componentSource,
    /const manualMilestonesForRowsRef = useRef\(manualMilestonesForRows\);[\s\S]*manualMilestonesForRowsRef\.current = manualMilestonesForRows/s,
    'El commit de hito manual debe tener disponible la version efectiva con overlays de successor_dependencies',
);
assert.match(
    componentSource,
    /const effectiveManualMilestones = manualMilestonesForRowsRef\.current \|\| manualMilestonesRef\.current \|\| \[\];[\s\S]*successor_dependencies: successorDependencies/s,
    'Mover un hito manual no puede persistir una version que pierda sus successor_dependencies',
);
assert.match(
    componentSource,
    /successorDependencies\.length && !Object\.keys\(dependentPatches \|\| \{\}\)\.length[\s\S]*Movimiento cancelado: el hito conserva sucesoras, pero la cascada no encontro la ruta dependiente/s,
    'Si un hito con sucesoras no genera cascada, el commit debe cancelarse en vez de guardar el hito solo',
);
assert.match(
    componentSource,
    /shouldPreferCalculatedPreviewGeometry[\s\S]*hasMovePreviewDraft[\s\S]*String\(candidateId\) !== String\(activeMovePreviewSource\?\.lineId \|\| ''\)[\s\S]*candidateBarGeometry = shouldPreferCalculatedPreviewGeometry\s*\?\s*null\s*:\s*resolveVisibleBarGeometry/s,
    'Durante el preview de hito manual, las rutas deben usar la geometria calculada de sucesores movidos y no la caja DOM anterior/en transicion',
);
assert.match(
    componentSource,
    /const \[visualCommitPreview, setVisualCommitPreview\] = useState\(null\);[\s\S]*activeMovePreviewSource = visualCommitPreview\?\.type === 'move'[\s\S]*dragPreview\?\.type === 'move'/s,
    'El commit visual debe conservar la ultima geometria de preview sin crear otro calculo',
);
assert.match(
    componentSource,
    /dependencyLayoutRefreshTick[\s\S]*scheduleDependencyLayoutRefresh[\s\S]*setDependencyLayoutRefreshTick\(\(current\) => current \+ 1\)[\s\S]*dependencyLayoutRefreshTick/s,
    'El cierre del commit visual debe forzar un refresco de layout para que rutas y barras no dependan de mover el viewport',
);
assert.match(
    componentSource,
    /const activePreview = visualCommitPreview\?\.lineId === lineId[\s\S]*visualCommitPreview[\s\S]*dragPreview\?\.lineId === lineId/s,
    'Durante el commit visual se debe priorizar isCommitVisual sobre dragPreview para no dejar visible el helper Moviendo',
);
assert.match(
    componentSource,
    /const liveManualMilestonePreviewGeometry = activePreview\?\.type === 'move'[\s\S]*&& !activePreview\?\.isCommitVisual[\s\S]*activePreview\.translationPx/s,
    'Durante el commit visual de hitos manuales no se debe sumar translationPx sobre un hito ya colocado por el estado optimista',
);
assert.match(
    componentSource,
    /interaction\.lastVisualPreview = nextDragPreview;[\s\S]*const commitVisualPreview = interaction\.lastVisualPreview\?\.type === 'move'[\s\S]*isCommitVisual: true[\s\S]*setVisualCommitPreview\(commitVisualPreview\)/s,
    'Al soltar, el Gantt debe mantener una imagen visual de commit antes de apagar el drag preview',
);
assert.match(
    componentSource,
    /scheduleVisualCommitPreviewRelease[\s\S]*const release = \(\) => \{[\s\S]*setVisualCommitPreview\(null\)[\s\S]*requestAnimationFrame\(\(\) => \{[\s\S]*requestAnimationFrame\(release\)/s,
    'La liberacion del commit visual debe esperar al menos dos frames para evitar el salto al origen',
);

console.log('smoke-cronogramas-gantt-manual-milestone-drag: ok');
