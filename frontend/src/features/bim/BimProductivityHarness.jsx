import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimProductivityProposalPanel from '../../components/bim/BimProductivityProposalPanel';

const candidate = { quantity_name: 'Quantity.Volume', source_kind: 'ifc_element_quantity', original_value: 10, original_unit: 'm3', presented_value: 10, presented_unit: 'm3', conversion_factor: 1, rounding_digits: 3, normalization_rule: 'identity_si' };
const activity = { id: 71, activity_code: 'A-042', activity_name: 'Construir muros' };

const BimProductivityHarness = () => {
    const [proposals, setProposals] = useState([]);
    const api = useMemo(() => ({
        getQuantityCandidates: async () => [candidate],
        list4dActivities: async () => [activity],
        list4dProductivityProposals: async () => proposals,
        create4dProductivityProposal: async (_projectId, payload) => {
            const created = { id: 131, ...payload, version_id: 3, global_id: 'GUID-PROD-001', calculated_duration_days: 2.5, formula: 'quantity / (productivity_per_crew_day * crew_size)', status: 'pending', decision_reason: null };
            setProposals([created]);
            return created;
        },
        decide4dProductivityProposal: async (_projectId, _proposalId, payload) => {
            const decided = { ...proposals[0], status: payload.decision, decision_reason: payload.reason };
            setProposals([decided]);
            return decided;
        },
    }), [proposals]);
    return <main className="min-h-screen bg-[#F2F4F7] p-3" data-bim-productivity-harness><div className="mx-auto w-full max-w-md"><BimProductivityProposalPanel projectId={1} empresaId={1} element={{ id: 41, global_id: 'GUID-PROD-001' }} api={api} /></div></main>;
};

createRoot(document.getElementById('root')).render(<BimProductivityHarness />);
