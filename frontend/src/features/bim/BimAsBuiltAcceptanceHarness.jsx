import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import Panel from '../../components/bim/BimAsBuiltAcceptancePanel';

let items = [];
const api = {
    listAsBuiltAcceptances: async () => items,
    createAsBuiltAcceptance: async (_projectId, payload) => {
        const value = { id: 1, ...payload, version_label: 'AB-01', source_filename: 'obra-final.ifc', source_checksum_sha256: 'a'.repeat(64), quality_status: 'passed', status: 'submitted', lock_version: 1, submitted_by: 4, decided_by: null, submitted_at: new Date().toISOString(), decided_at: null, decision_reason: null };
        items = [value]; return value;
    },
    decideAsBuiltAcceptance: async (_projectId, _id, payload) => { items = [{ ...items[0], status: payload.decision, decision_reason: payload.reason, lock_version: 2 }]; return items[0]; },
};
const models = [{ id: 1, nombre: 'Arquitectura', versions: [{ id: 10, version_label: 'AB-01', status: 'ready' }] }];
createRoot(document.getElementById('root')).render(<main className="h-screen bg-zinc-100 p-6"><div className="h-[calc(100vh-48px)]"><Panel projectId={7} empresaId={1} models={models} activeVersionId={10} api={api} /></div></main>);
