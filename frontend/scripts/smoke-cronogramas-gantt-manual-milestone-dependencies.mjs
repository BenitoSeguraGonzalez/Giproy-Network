import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const source = readFileSync(
    resolve('src/components/projects/CronogramaGantt.jsx'),
    'utf8',
);
const dependencyRouterSource = readFileSync(
    resolve('src/components/projects/cronogramasGanttDependencies.js'),
    'utf8',
);

assert.match(
    source,
    /source_id:\s*serializeDependencyEndpointId\(sourceLineId\),[\s\S]*?target_id:\s*serializeDependencyEndpointId\(normalizedTargetId\),/,
    'El parser de predecesoras debe conservar endpoints de hitos manuales y no convertirlos a Number/NaN.',
);

assert.match(
    source,
    /const nextManualSourceDependencies = nextDependencies[\s\S]*?manual_milestone_sequence:\s*true/,
    'El commit textual debe derivar dependencias con hito manual hacia successor_dependencies.',
);

assert.match(
    source,
    /const nextDependencies = \[[\s\S]*?manualDependency,[\s\S]*?\]\.sort/,
    'El enlace grafico hito manual -> tarea debe reflejar la dependencia manual en el draft local de la tarea.',
);

assert.match(
    source,
    /applyDraftPatches\(\{[\s\S]*?\[normalizedTargetId\]: nextDraft,[\s\S]*?buildDependentScheduleDrafts\(normalizedTargetId, draftSnapshot\),[\s\S]*?\}\);[\s\S]*?await handleSave\(targetRow, nextDraft,/,
    'El enlace grafico hito manual -> tarea debe pintar el estado local antes de guardar la linea.',
);

const createDependencyStart = source.indexOf('const createDependencyFromSourceToTarget = useCallback');
const createDependencyEnd = source.indexOf('dragDraftsRef.current = drafts;', createDependencyStart);
assert.notEqual(createDependencyStart, -1, 'Debe existir createDependencyFromSourceToTarget.');
assert.notEqual(createDependencyEnd, -1, 'Debe existir el bloque posterior a createDependencyFromSourceToTarget.');
const createDependencyBlock = source.slice(createDependencyStart, createDependencyEnd);

assert.doesNotMatch(
    createDependencyBlock,
    /const createDependencyFromSourceToTarget = useCallback[\s\S]*?\}, \[[^\]]*(?:applyDraftPatches|buildDependentScheduleDrafts)[^\]]*\]\);/,
    'createDependencyFromSourceToTarget no debe leer helpers declarados mas abajo en su array de dependencias; eso provoca ReferenceError/TDZ en el bundle minificado.',
);

assert.match(
    source,
    /await persistManualMilestones\(nextMilestones,\s*\{\s*selectLineId:\s*normalizedTargetId\s*\}\);[\s\S]*?await persistDraftPatches\(accumulatedPatches,/,
    'El commit textual con hito manual debe persistir primero la configuracion del hito antes del guardado de la tarea.',
);

assert.match(
    source,
    /const committedManualMilestonesSignatureRef = useRef\(null\);/,
    'Debe existir una firma de hitos confirmada para proteger la UI ante respuestas antiguas.',
);

assert.match(
    source,
    /committedManualMilestonesSignature[\s\S]*?incomingManualMilestonesSignature !== committedManualMilestonesSignature[\s\S]*?manual_milestones: Array\.isArray\(current\?\.manual_milestones\)/,
    'La rehidratacion no debe pisar manual_milestones confirmados con una config antigua.',
);

const buildManualMilestoneLineId = (milestoneId) => `manual-milestone:${String(milestoneId || '').trim()}`;
const isManualMilestoneLineId = (value) => String(value || '').trim().startsWith('manual-milestone:');
const normalizeDependencyEndpointId = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (isManualMilestoneLineId(raw)) return raw;
    const numeric = Number(raw);
    return Number.isFinite(numeric) && numeric > 0 ? String(numeric) : '';
};
const serializeDependencyEndpointId = (value) => {
    const normalized = normalizeDependencyEndpointId(value);
    if (!normalized) return '';
    return isManualMilestoneLineId(normalized) ? normalized : Number(normalized);
};

const milestoneLineId = buildManualMilestoneLineId('hm-dependency-smoke');
const parsedDependency = {
    source_id: serializeDependencyEndpointId(milestoneLineId),
    target_id: serializeDependencyEndpointId('49'),
    type: 'FS',
    lag_days: 0,
    lag_unit: 'day',
    lag_mode: 'duration',
    metadata: {},
};

assert.equal(parsedDependency.source_id, milestoneLineId);
assert.equal(parsedDependency.target_id, 49);
assert.equal(Number.isNaN(Number(parsedDependency.source_id)), true);

const nextMilestone = {
    id: 'hm-dependency-smoke',
    successor_dependencies: [{
        ...parsedDependency,
        metadata: {
            ...parsedDependency.metadata,
            manual_milestone_sequence: true,
        },
    }],
};

assert.equal(nextMilestone.successor_dependencies[0].target_id, 49);
assert.equal(nextMilestone.successor_dependencies[0].metadata.manual_milestone_sequence, true);

assert.match(
    dependencyRouterSource,
    /sourceIsMilestone\s*\|\|\s*targetIsMilestone[\s\S]*?DEPENDENCY_ALIGNED_ANCHOR_TOLERANCE_PX[\s\S]*?normalizePoints\(\[startPoint,\s*endPoint\]\)/,
    'Los enlaces de hitos alineados deben renderizar una vertical limpia sin codos laterales.',
);

console.log('smoke-cronogramas-gantt-manual-milestone-dependencies: ok');
