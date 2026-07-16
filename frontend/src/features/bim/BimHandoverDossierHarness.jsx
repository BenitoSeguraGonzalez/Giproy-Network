import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import Panel from '../../components/bim/BimHandoverDossierPanel';

let items = [];
const api = {
    listHandoverDossiers: async () => items,
    createHandoverDossier: async (_project, payload) => { const value = { id: 1, ...payload, as_built_acceptance_id: 5, punch_closure_id: 6, manifest: { schema: 'giproy_bim_handover_manifest_v1' }, manifest_checksum_sha256: 'd'.repeat(64), system_ids: [1], asset_ids: [2, 3], cde_revision_ids: [4, 5, 6], total_systems: 1, total_assets: 2, total_documents: 3, status: 'submitted', lock_version: 1 }; items = [value]; return value; },
    decideHandoverDossier: async (_project, id, payload) => { const value = { ...items.find((item) => item.id === id), status: payload.decision, decision_reason: payload.reason, lock_version: 2 }; items = [value]; return value; },
};
createRoot(document.getElementById('root')).render(<main className="h-screen bg-zinc-100 p-6"><div className="h-[calc(100vh-48px)]"><Panel projectId={7} empresaId={1} api={api}/></div></main>);
