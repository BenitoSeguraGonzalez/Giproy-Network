import assert from 'node:assert/strict';
import {
    applyManualMilestoneDependencyLagUpdates,
    buildTaskMoveGuideModel,
    resolveGhostSubbarVisuals,
    resolveTaskMoveGuideAnchors,
} from '../src/components/projects/cronogramasGanttDragPreview.js';

const ghostWhenNoRealSubbars = resolveGhostSubbarVisuals({
    activePreviewType: 'move',
    interactionScope: 'task',
    originalSubbarVisuals: [
        { id: 'seg-a', leftPx: 40, widthPx: 18 },
        { id: 'seg-b', leftPx: 72, widthPx: 18 },
    ],
    hasRealSubbars: false,
});
assert.deepEqual(
    ghostWhenNoRealSubbars,
    [],
    'Una tarea sin subtramos reales no debe renderizar ghost múltiple aunque existan segmentos auxiliares',
);

const ghostForSingleRealSubbarDrag = resolveGhostSubbarVisuals({
    activePreviewType: 'move',
    interactionScope: 'subbar',
    originalSubbarVisuals: [
        { id: 'seg-a', leftPx: 40, widthPx: 18 },
        { id: 'seg-b', leftPx: 72, widthPx: 18 },
    ],
    hasRealSubbars: true,
    isDraggingSingleSubbar: true,
    activeSegmentId: 'seg-b',
});
assert.equal(
    ghostForSingleRealSubbarDrag.length,
    1,
    'El ghost múltiple solo debe sobrevivir durante el drag de un subtramo real',
);

const guide = buildTaskMoveGuideModel({
    activePreviewType: 'move',
    interactionScope: 'task',
    originalLeftPx: 120,
    nextLeftPx: 180,
    pixelsPerDay: 12,
});
assert.ok(guide, 'El movimiento horizontal de tarea debe producir una guía temporal');
assert.equal(guide.leftPx, 124, 'La guía debe nacer desde el borde original con el inset definido');
assert.equal(guide.widthPx, 52, 'La guía debe conservar el ancho útil esperado');
assert.equal(guide.deltaDays, 5, 'La guía debe reflejar el delta de días del movimiento');

const guideWithTranslationFallback = buildTaskMoveGuideModel({
    activePreviewType: 'move',
    interactionScope: 'task',
    originalLeftPx: 200,
    translationPx: -24,
    pixelsPerDay: 12,
});
assert.ok(guideWithTranslationFallback, 'La guía debe poder resolverse por translationPx cuando aún no exista previewGeometry');
assert.equal(guideWithTranslationFallback.deltaDays, -2, 'El fallback por translationPx debe preservar el delta temporal');

const guideWithStalePreviewButLiveTranslation = buildTaskMoveGuideModel({
    activePreviewType: 'move',
    interactionScope: 'task',
    originalLeftPx: 200,
    nextLeftPx: 200,
    translationPx: 36,
    pixelsPerDay: 12,
});
assert.ok(
    guideWithStalePreviewButLiveTranslation,
    'La guía debe seguir apareciendo cuando el preview todavía no se ha movido visualmente pero sí existe translationPx',
);
assert.equal(
    guideWithStalePreviewButLiveTranslation.deltaDays,
    3,
    'Cuando nextLeftPx sigue clavado al origen, la guía debe usar la translationPx real',
);

const leftmostSubbarGuide = buildTaskMoveGuideModel({
    activePreviewType: 'move',
    interactionScope: 'subbar',
    originalLeftPx: 84,
    nextLeftPx: 132,
    pixelsPerDay: 12,
});
assert.ok(leftmostSubbarGuide, 'Una tarea con subtareas debe poder medir la guía desde la subtarea más a la izquierda');
assert.equal(leftmostSubbarGuide.deltaDays, 4, 'La guía basada en la subtarea izquierda debe conservar el delta temporal correcto');

const taskAnchors = resolveTaskMoveGuideAnchors({
    interactionScope: 'task',
    barLeftPx: 120,
    previewBarLeftPx: 180,
});
assert.deepEqual(
    taskAnchors,
    { originalLeftPx: 120, nextLeftPx: 180 },
    'Sin subtareas previas, la medición debe ir desde el inicio de la tarea hasta el inicio del gráfico movido',
);

const subbarAnchors = resolveTaskMoveGuideAnchors({
    interactionScope: 'subbar',
    barLeftPx: 120,
    activeSegmentId: 'seg-b',
    originalSubbarVisuals: [
        { id: 'seg-a', leftPx: 140, widthPx: 24 },
        { id: 'seg-b', leftPx: 190, widthPx: 24 },
    ],
    translatedSubbarVisuals: [
        { id: 'seg-a', leftPx: 140, widthPx: 24 },
        { id: 'seg-b', leftPx: 220, widthPx: 24 },
    ],
});
assert.deepEqual(
    subbarAnchors,
    { originalLeftPx: 164, nextLeftPx: 220 },
    'Con subtarea previa, la medición debe ir desde el fin de la subtarea izquierda hasta el inicio de la subtarea movida',
);

const manualMilestones = [
    {
        id: 'hm-1',
        successor_dependencies: [
            { source_id: 'manual-milestone:hm-1', target_id: '271', type: 'FS', lag_days: 0, lag_unit: 'day', lag_mode: 'duration' },
        ],
    },
    {
        id: 'hm-2',
        successor_dependencies: [],
    },
];
const lagUpdate = applyManualMilestoneDependencyLagUpdates({
    manualMilestones,
    targetLineId: '271',
    nextDependencies: [
        { source_id: 'manual-milestone:hm-1', target_id: '271', type: 'FS', lag_days: 4, lag_unit: 'day', lag_mode: 'duration' },
        { source_id: '49', target_id: '271', type: 'FS', lag_days: 1, lag_unit: 'day', lag_mode: 'duration' },
    ],
    normalizeDependencyEndpointId: (value) => String(value || '').trim(),
    buildManualMilestoneLineId: (value) => `manual-milestone:${String(value || '').trim()}`,
});
assert.equal(lagUpdate.updatedCount, 1, 'El ajuste de lag debe localizar exactamente la dependencia del hito que gobierna la tarea');
assert.equal(
    lagUpdate.nextMilestones[0].successor_dependencies[0].lag_days,
    4,
    'El lag recalculado debe persistirse en successor_dependencies del hito',
);

console.log(JSON.stringify({
    ghostWithoutRealSubbars: ghostWhenNoRealSubbars.length,
    guideDeltaDays: guide.deltaDays,
    guideWithTranslationFallbackDeltaDays: guideWithTranslationFallback.deltaDays,
    guideWithStalePreviewTranslationDeltaDays: guideWithStalePreviewButLiveTranslation.deltaDays,
    taskGuideOriginLeftPx: taskAnchors.originalLeftPx,
    subbarGuideOriginLeftPx: subbarAnchors.originalLeftPx,
    updatedManualMilestoneLagCount: lagUpdate.updatedCount,
}, null, 2));
