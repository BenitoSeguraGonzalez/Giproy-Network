import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import BimActualCostLedgerPanel from '../../components/bim/BimActualCostLedgerPanel';

let ledger = { entries: [{ id: 1, field_report_id: 11, activity_snapshot_id: 21, activity_code: 'A-100', activity_name: 'Cimentación', occurred_at: '2026-07-15T16:00:00Z', currency: 'USD', incremental_actual_cost: 4200, cumulative_actual_cost: 4200 }], currency_totals: { USD: 4200 }, source_report_count: 2, posted_report_count: 1, validated_exception_cost: 850 };
const api = {
    getActualCostLedger: async () => ledger,
    syncActualCostLedger: async () => { ledger = { ...ledger, entries: [...ledger.entries, { id: 2, field_report_id: 12, activity_snapshot_id: 21, activity_code: 'A-100', activity_name: 'Cimentación', occurred_at: '2026-07-16T16:00:00Z', currency: 'USD', incremental_actual_cost: 1800, cumulative_actual_cost: 6000 }], currency_totals: { USD: 6000 }, posted_report_count: 2 }; return ledger; },
};

createRoot(document.getElementById('root')).render(<main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)]"><BimActualCostLedgerPanel projectId={7} empresaId={1} api={api} /></div></main>);
