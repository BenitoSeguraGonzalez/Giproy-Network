import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimFragmentsViewport from '../../components/bim/BimFragmentsViewport';
import BimPlanning4dPanel from '../../components/bim/BimPlanning4dPanel';
import BimThreeViewer from '../../components/bim/BimThreeViewer';
import BimWorkspaceV2 from '../../components/bim/BimWorkspaceV2';
import { getBimFragmentsSmokeBytes } from '../../components/bim/bimFragmentsBinaryFixture';
import { createActivityPlanningSelection, createElementPlanningSelection } from '../../components/bim/bimPlanningSelection';

const FIXTURE_GUID = '0p3fMZQGz7KxQ1YkSm0020';
const SECOND_GUID = '0p3fMZQGz7KxQ1YkSm0021';
const useFallbackViewer = new URLSearchParams(window.location.search).get('viewer') === 'fallback';
const ELEMENTS = [
    { id: 1, global_id: FIXTURE_GUID, name: 'Muro perimetral A', ifc_class: 'IfcWall', metadata_json: { geometry_2d: { x: 10, y: 10, width: 80, height: 20 } } },
    { id: 2, global_id: SECOND_GUID, name: 'Losa nivel 01', ifc_class: 'IfcSlab', metadata_json: { geometry_2d: { x: 40, y: 55, width: 120, height: 70 } } },
];
const GANTT = {
    range_start: '2026-07-01T00:00:00Z',
    range_finish: '2026-08-15T00:00:00Z',
    critical_path_activity_ids: [101, 102],
    dependencies: [{ predecessor_activity_id: 101, successor_activity_id: 102 }],
    activities: [
        { id: 101, code: 'EDT-01', name: 'Cimentación sector A', planned_start: '2026-07-01T00:00:00Z', planned_finish: '2026-07-12T00:00:00Z', duration_days: 12, critical: true, global_ids: [FIXTURE_GUID, SECOND_GUID] },
        { id: 102, code: 'EDT-02', name: 'Estructura nivel 01', planned_start: '2026-07-13T00:00:00Z', planned_finish: '2026-07-28T00:00:00Z', duration_days: 16, critical: true, global_ids: [FIXTURE_GUID] },
        { id: 103, code: 'EDT-03', name: 'Instalaciones preliminares', planned_start: '2026-07-22T00:00:00Z', planned_finish: '2026-08-08T00:00:00Z', duration_days: 18, critical: false, global_ids: [] },
    ],
};
const ganttApi = {
    list4dBaselines: async () => [{ id: 1, revision: 'R08', name: 'Programa contractual' }],
    get4dGantt: async () => GANTT,
};
const timelineApi = {
    get4dTimeline: async (_projectId, cutoff) => ({
        range_start: GANTT.range_start,
        range_finish: GANTT.range_finish,
        cutoff,
        counts: { completed: 1, in_progress: 1, not_started: 1 },
        items: GANTT.activities.flatMap((activity) => activity.global_ids.map((globalId) => ({
            activity_snapshot_id: activity.id,
            activity_code: activity.code,
            global_id: globalId,
            state: activity.id === 101 ? 'completed' : 'in_progress',
        }))),
    }),
};

const panel = (title, detail) => (
    <section className="h-full border border-zinc-200 bg-white p-3">
        <h2 className="text-xs font-semibold text-zinc-900">{title}</h2>
        <p className="mt-2 text-xs text-zinc-500">{detail}</p>
    </section>
);

const BimWorkspaceV2Harness = () => {
    const [viewerMode, setViewerMode] = useState('fragments');
    const [refreshCount, setRefreshCount] = useState(0);
    const [resetCount, setResetCount] = useState(0);
    const [cutoff, setCutoff] = useState('2026-07-13');
    const [timeline, setTimeline] = useState(null);
    const [selection, setSelection] = useState(() => createElementPlanningSelection(FIXTURE_GUID, GANTT));
    const viewer = viewerMode === 'fragments'
        ? (useFallbackViewer
            ? <BimThreeViewer elements={ELEMENTS} ready activeVersionLabel="IFC4 - R08" selectedElement={ELEMENTS[0]} onSelectElement={() => {}} />
            : <BimFragmentsViewport projectId={1} versionId={1} empresaId={1} loadBytes={() => getBimFragmentsSmokeBytes()} temporalProfile={timeline} selectionProfile={selection} />)
        : panel('Plano BIM 2D', 'Vista técnica del nivel activo.');

    const selectActivity = (activity) => {
        setSelection(createActivityPlanningSelection(activity, `harness-${activity.id}-${Date.now()}`));
        setCutoff(activity.planned_start.slice(0, 10));
    };

    return (
        <main className="h-screen overflow-hidden bg-zinc-100 p-3" data-bim-workspace-v2-harness data-refresh-count={refreshCount} data-reset-count={resetCount}>
            <BimWorkspaceV2
                projectId="harness-v2"
                companyLabel="Santiago Bermeo"
                projectLabel="Centro Empresarial Norte"
                modelLabel="Arquitectura coordinada"
                versionLabel="IFC4 - R08"
                viewerMode={viewerMode}
                loading={false}
                ready
                canAdminister
                explorer={panel('Explorador', 'Nivel 01 · IfcWall · 25 elementos')}
                viewer={viewer}
                inspector={panel('Propiedades', 'IfcWall · 2Q8xR08BIM')}
                workspaceTools={{
                    model: [{ id: 'properties', label: 'Propiedades', content: panel('Propiedades', 'IfcWall · 2Q8xR08BIM') }],
                    coordination: [{ id: 'issues', label: 'Incidencias', content: panel('Incidencias', 'Coordinación activa') }],
                    'planning-costs': [{ id: 'schedule', label: 'Actividad y vínculo', content: panel('Actividad y vínculo', 'EDT 1.2') }],
                    tracking: [
                        { id: 'progress', label: 'Registrar avance', content: panel('Registrar avance', 'Nivel 01') },
                        { id: 'reports', label: 'Informes', content: panel('Informes BIM', 'Avance · 4D · Productividad · Recursos · Seguridad · Calidad') },
                    ],
                    handover: [{ id: 'dossier', label: 'Dossier', content: panel('Dossier digital', 'Entrega coordinada') }],
                }}
                bottomTools={[{
                    id: 'planning-4d',
                    label: 'Secuencia 4D',
                    content: <BimPlanning4dPanel projectId={1} empresaId={1} cutoff={cutoff} selectedGuid={selection.primaryGuid} selectedActivityIds={selection.activityIds} primaryActivityId={selection.primaryActivityId} onCutoffChange={setCutoff} onTimelineChange={setTimeline} onGanttChange={() => {}} onSelectActivity={selectActivity} timelineApi={timelineApi} ganttApi={ganttApi} />,
                }]}
                adminTools={[{ id: 'imports', label: 'Importaciones', content: panel('Importaciones IFC', 'Sin trabajos pendientes') }]}
                reports={panel('Informes BIM', 'Avance · 4D · Productividad · Recursos · Seguridad · Calidad')}
                searchItems={[
                    { id: 'wall', type: 'Elemento', label: 'Muro perimetral A', meta: 'IfcWall · WALL-001', workspace: 'model' },
                    { id: 'activity', type: 'Actividad', label: 'Cimentación', meta: 'EDT 1.2', workspace: 'planning-costs' },
                ]}
                onChangeViewerMode={setViewerMode}
                onResetContext={() => setResetCount((value) => value + 1)}
                onRefresh={() => setRefreshCount((value) => value + 1)}
            />
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimWorkspaceV2Harness />);
