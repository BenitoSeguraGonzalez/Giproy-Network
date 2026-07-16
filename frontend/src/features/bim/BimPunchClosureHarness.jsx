import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import Panel from '../../components/bim/BimPunchClosurePanel';

let items = [];
const api = {
    listPunchClosures: async () => items,
    createPunchClosure: async (_project, payload) => { const value = { id: 1, ...payload, punch_item_ids: [11, 12], punch_snapshot_sha256: 'a'.repeat(64), total_items: 2, critical_items: 1, as_built_acceptance_id: 5, status: 'submitted', lock_version: 1 }; items = [value]; return value; },
    decidePunchClosure: async (_project, id, payload) => { const value = { ...items.find((item) => item.id === id), status: payload.decision, decision_reason: payload.reason, lock_version: 2 }; items = [value]; return value; },
};
createRoot(document.getElementById('root')).render(<main className="h-screen bg-zinc-100 p-6"><div className="h-[calc(100vh-48px)]"><Panel projectId={7} empresaId={1} api={api}/></div></main>);
