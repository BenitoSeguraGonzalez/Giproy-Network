import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import BimCostSovPanel from '../../components/bim/BimCostSovPanel';

const contracts = [{ id: 81, contract_number: 'CTR-001', title: 'Estructura principal', committed_amount: 9000, currency: 'USD', status: 'active' }];
let sovs = [];
const api = {
    listCostContracts: async () => contracts,
    listSchedulesOfValues: async () => sovs,
    createScheduleOfValues: async (_projectId, payload) => { const item = { id: 101, ...payload, contract_number: 'CTR-001', total_scheduled_value: payload.lines.reduce((sum, line) => sum + line.scheduled_value, 0), contract_committed_amount: 9000, currency: 'USD', status: 'draft', lock_version: 1 }; sovs = [item]; return item; },
    decideScheduleOfValues: async (_projectId, _sovId, payload) => { sovs = [{ ...sovs[0], status: payload.decision, lock_version: 2 }]; return sovs[0]; },
};

createRoot(document.getElementById('root')).render(<main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)]"><BimCostSovPanel projectId={7} empresaId={1} api={api} /></div></main>);
