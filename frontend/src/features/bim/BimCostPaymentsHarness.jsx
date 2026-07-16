import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import BimCostPaymentsPanel from '../../components/bim/BimCostPaymentsPanel';

const contracts = [{ id: 81, contract_number: 'CTR-001', title: 'Estructura principal', committed_amount: 9000, currency: 'USD', status: 'active' }];
let applications = [];
const api = {
    listCostContracts: async () => contracts,
    listPaymentApplications: async () => applications,
    createPaymentApplication: async (_projectId, payload) => { const item = { id: 91, ...payload, contract_number: 'CTR-001', currency: 'USD', net_requested: payload.gross_requested - payload.retention_requested, certified_gross: null, certified_retention: null, certified_net: null, status: 'draft', lock_version: 1 }; applications = [item]; return item; },
    submitPaymentApplication: async () => { applications = [{ ...applications[0], status: 'submitted', lock_version: 2 }]; return applications[0]; },
    decidePaymentApplication: async (_projectId, _applicationId, payload) => { applications = [{ ...applications[0], status: payload.decision, certified_gross: payload.certified_gross, certified_retention: payload.certified_retention, certified_net: payload.certified_gross - payload.certified_retention, lock_version: 3 }]; return applications[0]; },
};

createRoot(document.getElementById('root')).render(<main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)]"><BimCostPaymentsPanel projectId={7} empresaId={1} api={api} /></div></main>);
