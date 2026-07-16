import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimFragmentsViewport from '../../components/bim/BimFragmentsViewport';
import BimTimeline4dPanel from '../../components/bim/BimTimeline4dPanel';
import { getBimFragmentsSmokeBytes } from '../../components/bim/bimFragmentsBinaryFixture';

const globalId = '0p3fMZQGz7KxQ1YkSm0020';
const api = {
    get4dTimeline: async (_projectId, cutoff) => {
        const active = new Date(cutoff) >= new Date('2026-08-03T00:00:00Z');
        return {
            contract_version: 'giproy_bim_4d_timeline_v1',
            project_id: 1,
            company_id: 1,
            cutoff,
            range_start: '2026-08-01T00:00:00Z',
            range_finish: '2026-08-10T00:00:00Z',
            counts: active ? { in_progress: 1 } : { not_started: 1 },
            items: [{ global_id: globalId, element_id: 20, version_id: 101, activity_snapshot_id: 71, activity_code: 'A-042', activity_name: 'Construir muro', link_type: 'construction', state: active ? 'in_progress' : 'not_started', progress_percent: 0, visible: active, opacity: active ? 1 : 0, color: active ? '#F39200' : '#71717a' }],
        };
    },
};

const BimTimeline4dHarness = () => {
    const [timeline, setTimeline] = useState(null);
    const [focusedGuid, setFocusedGuid] = useState('');
    return (
        <main className="min-h-screen bg-[#F2F4F7] p-3" data-bim-timeline-4d-harness>
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-3">
                <BimTimeline4dPanel projectId={1} empresaId={1} onTimelineChange={setTimeline} onFocusGuid={setFocusedGuid} api={api} />
                <output className="sr-only" data-bim-timeline-focused-guid={focusedGuid}>{focusedGuid}</output>
                <div className="h-[680px] min-h-0">
                    <BimFragmentsViewport projectId={1} versionId={101} empresaId={1} loadBytes={getBimFragmentsSmokeBytes} temporalProfile={timeline} />
                </div>
            </div>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimTimeline4dHarness />);
