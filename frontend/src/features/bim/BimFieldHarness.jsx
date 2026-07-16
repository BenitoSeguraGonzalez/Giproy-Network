import React, { useMemo } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimFieldReportPanel from '../../components/bim/BimFieldReportPanel';

const activity = { id: 81, activity_code: 'A-050', activity_name: 'Instalar estructura' };
const area = { id: 91, code: 'F-01', name: 'Frente norte' };

const BimFieldHarness = () => {
    const api = useMemo(() => ({
        list4dActivities: async () => [activity],
        list4dWorkAreas: async () => [area],
        list4dFieldReports: async () => [],
        create4dFieldReport: async (_projectId, payload) => {
            const report = {
                id: 141,
                ...payload,
                progress_percent: payload.progress_percent,
                earned_value: 500,
                schedule_performance_index: 0.8333,
                cost_performance_index: 1.1111,
                evidence: [],
            };
            return report;
        },
        upload4dFieldEvidence: async () => ({ id: 151, filename: 'avance-frente.png', content_type: 'image/png', size_bytes: 68 }),
        download4dFieldEvidence: async () => new Blob(['field-evidence'], { type: 'image/png' }),
    }), []);

    return (
        <main className="min-h-screen bg-[#F2F4F7] p-3" data-bim-field-harness>
            <div className="mx-auto w-full max-w-md">
                <BimFieldReportPanel projectId={1} empresaId={1} api={api} />
            </div>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimFieldHarness />);
