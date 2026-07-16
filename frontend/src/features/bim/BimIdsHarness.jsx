import React from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import { bimModelsApi } from '../../api/bimModels';
import BimIdsPanel from '../../components/bim/BimIdsPanel';

let profiles = [];
const validation = {
    id: 71,
    summary: { passed: 1, failed: 1, exempted: 0 },
    findings: [
        { id: 91, requirement_id: 'wall-fire-rating', specification_name: 'Wall fire rating', global_id: 'WALL-FAIL', severity: 'error', status: 'failed', message: 'Pset_WallCommon.FireRating: 30' },
    ],
};
bimModelsApi.listIdsProfiles = async () => profiles;
bimModelsApi.importIdsProfile = async (_projectId, payload) => {
    const profile = { id: 11, name: payload.name, source_filename: payload.source_filename, ids_version: '1.0', specification_count: 1 };
    profiles = [profile];
    return profile;
};
bimModelsApi.validateIdsProfile = async () => validation;
bimModelsApi.exemptIdsFinding = async (_projectId, findingId, reason) => ({
    ...validation,
    summary: { passed: 1, failed: 0, exempted: 1 },
    findings: validation.findings.map((finding) => ({ ...finding, id: findingId, status: 'exempted', exception_reason: reason, exception_by: 5 })),
});

const BimIdsHarness = () => (
    <main className="min-h-screen bg-zinc-100 p-3" data-bim-ids-harness>
        <div className="ml-auto w-full max-w-[320px]"><BimIdsPanel projectId={1} versionId={7} empresaId={2} /></div>
    </main>
);

createRoot(document.getElementById('root')).render(<BimIdsHarness />);
