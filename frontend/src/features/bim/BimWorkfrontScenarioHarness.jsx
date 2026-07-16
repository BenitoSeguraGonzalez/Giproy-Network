import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimWorkfrontScenarioPanel from '../../components/bim/BimWorkfrontScenarioPanel';

const activities = [{ id: 71, activity_code: 'A-042', activity_name: 'Construir muros' }];
const baselines = [{ id: 91, revision: 'BL-001', name: 'Contractual' }];

const BimWorkfrontScenarioHarness = () => {
    const [areas, setAreas] = useState([]);
    const [components, setComponents] = useState([]);
    const [scenarios, setScenarios] = useState([]);
    const [focusedGuid, setFocusedGuid] = useState('');
    const api = useMemo(() => ({
        list4dWorkAreas: async () => areas,
        list4dComponents: async () => components,
        list4dScenarios: async () => scenarios,
        list4dActivities: async () => activities,
        list4dBaselines: async () => baselines,
        create4dWorkArea: async (_projectId, payload) => {
            const created = { id: 101, ...payload, component_count: 0 };
            setAreas([created]);
            return created;
        },
        create4dComponent: async (_projectId, payload) => {
            const created = { id: 111, ...payload, global_ids: ['GUID-FRONT-001'] };
            setComponents([created]);
            return created;
        },
        create4dScenario: async (_projectId, payload) => {
            const created = { id: 121, ...payload, metrics: { scenario_span_days: 5, duration_delta_days: -2, dependency_violations: 1 } };
            setScenarios([created]);
            return created;
        },
    }), [areas, components, scenarios]);
    return (
        <main className="min-h-screen bg-[#F2F4F7] p-3" data-bim-workfront-harness data-focused-guid={focusedGuid}>
            <div className="mx-auto w-full max-w-md">
                <BimWorkfrontScenarioPanel projectId={1} empresaId={1} versionId={3} element={{ id: 41, global_id: 'GUID-FRONT-001', nombre: 'Muro nivel 1' }} api={api} onSelectGuid={setFocusedGuid} />
            </div>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimWorkfrontScenarioHarness />);
