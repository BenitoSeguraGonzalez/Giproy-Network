import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimPlanActualPanel from '../../components/bim/BimPlanActualPanel';

const activities = [
    { id: 71, activity_code: 'A-042', activity_name: 'Construir muros nivel 1', planned_start: '2026-08-03T08:00:00Z', planned_finish: '2026-08-07T17:00:00Z' },
    { id: 72, activity_code: 'A-043', activity_name: 'Inspeccionar muros nivel 1', planned_start: '2026-08-08T08:00:00Z', planned_finish: '2026-08-09T17:00:00Z' },
];

const initialBaseline = { id: 91, name: 'Baseline contractual', revision: 'BL-001', activities, dependencies: [] };

const BimPlanActualHarness = () => {
    const [baselines, setBaselines] = useState([initialBaseline]);
    const [focusedGuid, setFocusedGuid] = useState('');
    const api = useMemo(() => ({
        list4dActivities: async () => activities,
        list4dBaselines: async () => baselines,
        create4dBaseline: async (_projectId, payload) => {
            const created = { id: 92, ...payload, activities: activities.filter((item) => payload.activity_snapshot_ids.includes(item.id)) };
            setBaselines((current) => [created, ...current]);
            return created;
        },
        get4dDeviation: async (_projectId, baselineId, cutoff) => ({
            project_id: 1,
            company_id: 1,
            baseline_id: baselineId,
            cutoff,
            methodology: 'linear_planned_progress',
            counts: { ahead: 0, on_track: 1, behind: 1 },
            items: [
                { activity_snapshot_id: 71, activity_code: 'A-042', activity_name: 'Construir muros nivel 1', planned_progress_percent: 65, actual_progress_percent: 40, progress_variance_percent: -25, schedule_variance_days: 1, status: 'behind', viewpoints: [{ source_version_id: 3, selected_guids: ['GUID-4D-001'] }] },
                { activity_snapshot_id: 72, activity_code: 'A-043', activity_name: 'Inspeccionar muros nivel 1', planned_progress_percent: 0, actual_progress_percent: 0, progress_variance_percent: 0, schedule_variance_days: 0, status: 'on_track', viewpoints: [] },
            ],
        }),
    }), [baselines]);
    return (
        <main className="min-h-screen bg-[#F2F4F7] p-3" data-bim-plan-actual-harness data-focused-guid={focusedGuid}>
            <div className="mx-auto w-full max-w-md">
                <BimPlanActualPanel projectId={1} empresaId={1} api={api} onOpenViewpoint={(viewpoint) => setFocusedGuid(viewpoint.selected_guids[0] || '')} />
            </div>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimPlanActualHarness />);
