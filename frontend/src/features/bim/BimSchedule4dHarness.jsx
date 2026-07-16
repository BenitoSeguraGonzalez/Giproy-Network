import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimScheduleLinkPanel from '../../components/bim/BimScheduleLinkPanel';

const activity = {
    id: 71,
    activity_code: 'A-042',
    activity_name: 'Construir muros nivel 1',
    planned_start: '2026-08-03T08:00:00Z',
    planned_finish: '2026-08-07T17:00:00Z',
};

const BimSchedule4dHarness = () => {
    const [proposals, setProposals] = useState([]);
    const api = {
        list4dActivities: async () => [activity],
        list4dLinkProposals: async () => proposals,
        create4dLinkProposal: async (_projectId, payload) => {
            const proposal = { id: 81, project_id: 1, company_id: 1, version_id: 3, element_id: payload.element_id, global_id: 'GUID-4D-001', activity, link_type: payload.link_type, status: 'pending', proposal_reason: payload.proposal_reason, decision_reason: null };
            setProposals([proposal]);
            return proposal;
        },
        decide4dLinkProposal: async (_projectId, _proposalId, payload) => {
            const decided = { ...proposals[0], status: payload.decision, decision_reason: payload.reason };
            setProposals([decided]);
            return decided;
        },
    };
    return (
        <main className="min-h-screen bg-[#F2F4F7] p-3" data-bim-schedule-4d-harness>
            <div className="mx-auto w-full max-w-md">
                <BimScheduleLinkPanel projectId={1} empresaId={1} element={{ id: 41, global_id: 'GUID-4D-001', nombre: 'Muro nivel 1' }} api={api} />
            </div>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimSchedule4dHarness />);
