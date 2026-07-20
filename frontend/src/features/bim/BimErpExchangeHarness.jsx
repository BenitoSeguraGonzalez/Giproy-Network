import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import BimErpExchangePanel from '../../components/bim/BimErpExchangePanel';

let items = [];
const api = {
    listErpExchangePackages: async () => items,
    createErpExchangePackage: async (_projectId, payload) => {
        const value = { id: items.length + 1, revision: items.length + 1, status: 'draft', project_revision: 6, cutoff_at: payload.cutoff_at, checksum_sha256: 'a'.repeat(64), activity_count: 12, timecard_count: 4, regular_hours: 32, overtime_hours: 3, justification: payload.justification, lock_version: 1 };
        items = [value, ...items]; return value;
    },
    transitionErpExchangePackage: async (_projectId, id, payload) => {
        items = items.map((item) => item.id === id ? { ...item, status: payload.action === 'publish' ? 'published' : 'revoked', lock_version: item.lock_version + 1 } : item);
        return items.find((item) => item.id === id);
    },
    getErpExchangeContent: async (_projectId, id) => ({ package: items.find((item) => item.id === id), payload: { progress: [], timecards: [] } }),
};

createRoot(document.getElementById('root')).render(<main className="h-screen bg-zinc-100 p-6"><div className="mx-auto h-[calc(100vh-48px)] max-w-[1500px]"><BimErpExchangePanel projectId={7} empresaId={1} canManage api={api} onDownload={() => {}} /></div></main>);
