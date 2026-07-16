import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimResourceCapacityPanel from '../../components/bim/BimResourceCapacityPanel';

const resource = { id: 21, code: 'MO-01', name: 'Cuadrilla estructura', resource_type: 'labor', unit: 'personas', capacity_per_day: 8, source_kind: 'bim_native' };
const baseline = { id: 31, revision: 'BL-R2', name: 'Gantt revision 2' };

const BimResourceLevelingHarness = () => {
    const [scenarios, setScenarios] = useState([]);
    const api = useMemo(() => ({
        list4dResources: async () => [resource],
        list4dBaselines: async () => [baseline],
        get4dResourceHistogram: async () => ({ resource, peak_demand: 10, overloaded_days: 2, points: [{ date: '2026-08-04', demand: 10, capacity: 8, utilization_percent: 125, overloaded: true }] }),
        create4dResource: async () => resource,
        list4dResourceLeveling: async () => scenarios,
        create4dResourceLeveling: async (_projectId, payload) => {
            const created = { id: 41, project_id: 7, project_revision: 2, baseline_id: payload.baseline_id, revision: payload.revision, status: 'proposed', lock_version: 1, result: { before_overloaded_resource_days: 2, after_overloaded_resource_days: 0, shifted_activities: 1, max_shift_days: 3, source_immutable: true, activities: [] } };
            setScenarios([created]);
            return created;
        },
        decide4dResourceLeveling: async (_projectId, _scenarioId, payload) => {
            const decided = { ...scenarios[0], status: payload.decision, lock_version: 2, decision_reason: payload.reason };
            setScenarios([decided]);
            return decided;
        },
    }), [scenarios]);
    return <main className="min-h-screen bg-[#F2F4F7] p-6"><div className="mx-auto w-[480px]"><BimResourceCapacityPanel projectId={7} empresaId={1} api={api} /></div></main>;
};

createRoot(document.getElementById('root')).render(<BimResourceLevelingHarness />);
