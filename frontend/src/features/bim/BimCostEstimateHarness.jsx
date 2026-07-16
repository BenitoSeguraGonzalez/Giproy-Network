import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import BimCostEstimatePanel from '../../components/bim/BimCostEstimatePanel';

const qtos = [{ id: 61, revision: 'QTO-A', status: 'approved', rows: [{ group: { ifc_class: 'IFCWALL', storey: 'Nivel 1' }, quantity_name: 'NetVolume', unit: 'm3', value: 10, cost_code: 'EST-MUR' }, { group: { ifc_class: 'IFCDOOR', storey: 'Nivel 1' }, quantity_name: 'Count', unit: 'ud', value: 2, cost_code: 'ARQ-PUE' }] }];
let estimates = [];
const api = {
    listQtoSnapshots: async () => qtos,
    listCostEstimates: async () => estimates,
    createCostEstimate: async (_projectId, payload) => { const qto = qtos[0]; const lines = qto.rows.map((row, index) => ({ ...row, unit_rate: payload.rates[index].unit_rate, line_total: row.value * payload.rates[index].unit_rate })); const item = { id: 71, ...payload, qto_checksum_sha256: 'a'.repeat(64), lines, subtotal: lines.reduce((sum, line) => sum + line.line_total, 0), status: 'draft', lock_version: 1 }; estimates = [item]; return item; },
    decideCostEstimate: async (_projectId, _estimateId, payload) => { estimates = [{ ...estimates[0], status: payload.decision, lock_version: 2 }]; return estimates[0]; },
};

createRoot(document.getElementById('root')).render(<main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)]"><BimCostEstimatePanel projectId={7} empresaId={1} api={api} /></div></main>);
