import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import BimCostChangeOrdersPanel from '../../components/bim/BimCostChangeOrdersPanel';

const contracts = [{ id: 81, contract_number: 'CTR-001', title: 'Estructura principal', committed_amount: 9000, currency: 'USD', status: 'active' }];
let changes = [];
const api = {
    listCostContracts: async () => contracts,
    listChangeOrders: async () => changes,
    createChangeOrder: async (_projectId, payload) => { const item = { id: 111, ...payload, contract_number: 'CTR-001', currency: 'USD', approved_cost_delta: null, approved_schedule_days: null, contract_amount_before: null, contract_amount_after: null, status: 'potential', lock_version: 1 }; changes = [item]; return item; },
    transitionChangeOrder: async (_projectId, _changeId, payload) => { changes = [{ ...changes[0], status: payload.target_status, lock_version: 2 }]; return changes[0]; },
    decideChangeOrder: async (_projectId, _changeId, payload) => { changes = [{ ...changes[0], status: payload.decision, approved_cost_delta: payload.approved_cost_delta, approved_schedule_days: payload.approved_schedule_days, contract_amount_before: 9000, contract_amount_after: 9000 + payload.approved_cost_delta, lock_version: 3 }]; return changes[0]; },
};

createRoot(document.getElementById('root')).render(<main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)]"><BimCostChangeOrdersPanel projectId={7} empresaId={1} api={api} /></div></main>);
