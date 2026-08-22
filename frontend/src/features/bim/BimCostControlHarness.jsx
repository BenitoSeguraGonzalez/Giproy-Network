import React from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimCostControlWorkbench from '../../components/bim/BimCostControlWorkbench';

const contract = { id: 4, estimate_id: 2, estimate_revision: 'EST-R1', contract_number: 'CTR-001', title: 'Estructura de hormigón', counterparty_name: 'Contratista de prueba', committed_amount: 86500, currency: 'USD', start_date: '2026-08-01', end_date: '2026-12-15', status: 'active', lock_version: 2 };
const api = {
    listCostEstimates: async () => [{ id: 2, revision: 'EST-R1', subtotal: 130089.96, currency: 'USD', status: 'approved' }],
    listCostContracts: async () => [contract],
    listSchedulesOfValues: async () => [],
    listPaymentApplications: async () => [],
    listChangeOrders: async () => [],
    getActualCostLedger: async () => ({ entries: [], currency_totals: { USD: 18420 }, source_report_count: 12, posted_report_count: 10, validated_exception_cost: 850 }),
    syncActualCostLedger: async () => ({ entries: [], currency_totals: { USD: 18420 }, source_report_count: 12, posted_report_count: 10, validated_exception_cost: 850 }),
    listCostForecasts: async () => [{ id: 8, revision: 'FC-R1', status: 'approved', currency: 'USD', baseline_budget: 130089.96, committed_cost: 86500, actual_cost: 18420, estimate_to_complete: 72100, forecast_at_completion: 90520, variance_at_completion: 39569.96, lock_version: 1 }],
};

createRoot(document.getElementById('root')).render(
    <main className="h-screen overflow-hidden bg-[#F2F4F7] p-6">
        <div className="h-[calc(100vh-48px)] overflow-hidden border border-zinc-200 bg-white">
            <BimCostControlWorkbench projectId={7} empresaId={3} api={api} />
        </div>
    </main>,
);
