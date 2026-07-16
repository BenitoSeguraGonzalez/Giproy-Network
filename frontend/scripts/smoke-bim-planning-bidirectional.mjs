import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
    createActivityPlanningSelection,
    createElementPlanningSelection,
    findActivitiesByGuid,
} from '../src/components/bim/bimPlanningSelection.js';

const gantt = {
    activities: [
        { id: 10, global_ids: ['GUID-A', 'GUID-B'] },
        { id: 20, global_ids: ['GUID-A'] },
        { id: 30, global_ids: [] },
    ],
};

assert.deepEqual(findActivitiesByGuid('GUID-A', gantt).map(({ id }) => id), [10, 20], 'Un elemento debe resolver todas sus actividades');
assert.deepEqual(createElementPlanningSelection('GUID-A', gantt), {
    activityIds: [10, 20], primaryActivityId: 10, guids: ['GUID-A'], primaryGuid: 'GUID-A', source: 'element', focusToken: null,
});
assert.deepEqual(createActivityPlanningSelection(gantt.activities[0], 'focus-1'), {
    activityIds: [10], primaryActivityId: 10, guids: ['GUID-A', 'GUID-B'], primaryGuid: 'GUID-A', source: 'activity', focusToken: 'focus-1',
});

const workspaceSource = readFileSync(new URL('../src/components/bim/BimWorkspace.jsx', import.meta.url), 'utf8');
const fragmentsSource = readFileSync(new URL('../src/components/bim/BimFragmentsViewport.jsx', import.meta.url), 'utf8');
assert.match(workspaceSource, /createElementPlanningSelection[\s\S]*createActivityPlanningSelection/, 'El workspace debe usar el contrato bidireccional compartido');
assert.match(workspaceSource, /selectionProfile=\{planningSelection\}/, 'El estado de planificación debe llegar al visor fragments');
assert.match(fragmentsSource, /selectionProfile[\s\S]*getLocalIdsByGuids[\s\S]*getMergedBox/, 'Fragments debe resolver y encuadrar la selección 4D nativa');

console.log('smoke-bim-planning-bidirectional: ok');
