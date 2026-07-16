import React from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimCdeDashboardPanel from '../../components/bim/BimCdeDashboardPanel';

const dashboard = {
    contract_version: 'giproy_bim_cde_dashboard_v1', project_id: 7, company_id: 1,
    generated_at: '2026-07-16T15:00:00Z', scope: 'project',
    totals: { documents: 18, document_revisions: 46, open_rfis: 7, overdue_rfis: 2, pending_submittals: 5, overdue_submittals: 1, open_reviews: 4, overdue_reviews: 1, unread_notifications: 3 },
    document_statuses: { active: 18 }, rfi_statuses: { submitted: 5, answered: 2, closed: 9 },
    submittal_statuses: { submitted: 2, under_review: 3, approved: 8 }, review_statuses: { open: 4, resolved: 3, closed: 11 },
    responsible_workload: [
        { user_id: 8, name: 'María Coordinación BIM', rfis: 3, submittals: 2, reviews: 2, overdue: 2, total: 7 },
        { user_id: 9, name: 'Carlos Estructuras', rfis: 2, submittals: 2, reviews: 1, overdue: 1, total: 5 },
        { user_id: 10, name: 'Lucía Arquitectura', rfis: 2, submittals: 1, reviews: 1, overdue: 1, total: 4 },
    ],
    priority_queue: [
        { item_type: 'rfi', item_id: 1, number: 'RFI-0042', title: 'Interferencia entre bandeja y viga de transferencia', status: 'submitted', due_at: '2026-07-14T12:00:00Z', responsible_id: 8, responsible_name: 'María Coordinación BIM', overdue: true },
        { item_type: 'review', item_id: 2, number: 'REV-0017', title: 'Revisar emisión P03 de fachada norte', status: 'open', due_at: '2026-07-15T12:00:00Z', responsible_id: 9, responsible_name: 'Carlos Estructuras', overdue: true },
        { item_type: 'submittal', item_id: 3, number: 'SUB-0021', title: 'Planos de taller de estructura metálica', status: 'under_review', due_at: '2026-07-18T12:00:00Z', responsible_id: 10, responsible_name: 'Lucía Arquitectura', overdue: false },
        { item_type: 'rfi', item_id: 4, number: 'RFI-0044', title: 'Confirmar nivel de acabado en núcleo central', status: 'submitted', due_at: '2026-07-20T12:00:00Z', responsible_id: 8, responsible_name: 'María Coordinación BIM', overdue: false },
    ],
};

const api = { getCdeDashboard: async () => dashboard };

createRoot(document.getElementById('root')).render(
    <main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="mx-auto h-[720px] w-[1480px]"><BimCdeDashboardPanel projectId={7} empresaId={1} api={api} /></div></main>,
);
