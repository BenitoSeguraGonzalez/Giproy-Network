import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import BimCostContractsPanel from '../../components/bim/BimCostContractsPanel';

const estimates = [{ id: 71, revision: 'EST-A', subtotal: 10000, currency: 'USD', status: 'approved' }];
let contracts = [];
const api = {
    listCostEstimates: async () => estimates,
    listCostContracts: async () => contracts,
    createCostContract: async (_projectId, payload) => { const item = { id: 81, ...payload, estimate_revision: 'EST-A', estimate_subtotal: 10000, currency: 'USD', status: 'draft', lock_version: 1 }; contracts = [item]; return item; },
    transitionCostContract: async (_projectId, _contractId, payload) => { contracts = [{ ...contracts[0], status: payload.target_status, lock_version: contracts[0].lock_version + 1 }]; return contracts[0]; },
};

createRoot(document.getElementById('root')).render(<main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)]"><BimCostContractsPanel projectId={7} empresaId={1} api={api} /></div></main>);
