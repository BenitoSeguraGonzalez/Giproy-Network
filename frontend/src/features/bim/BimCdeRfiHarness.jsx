import React, { useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimCdeRfiPanel from '../../components/bim/BimCdeRfiPanel';

const now = '2026-07-13T12:00:00Z';

const BimCdeRfiHarness = () => {
    const rfis = useRef([]);
    const nextEvent = useRef(1);
    const api = useMemo(() => ({
        listCdeRfis: async (_projectId, status) => rfis.current.filter((item) => !status || item.status === status),
        listCdeRfiAssignees: async () => [{ id: 8, name: 'Coordinador BIM', email: 'bim@giproy.test' }],
        listCdeDocuments: async () => [{ id: 91, document_code: 'ARQ-001', title: 'Planta arquitectura', status: 'active' }],
        createCdeRfi: async (_projectId, payload) => {
            const event = { id: nextEvent.current++, event_type: 'created', payload: { subject: payload.subject }, created_by: 7, created_at: now };
            const saved = { id: 31, project_id: 7, company_id: 1, rfi_number: 'RFI-0001', ...payload, status: 'draft', answer: null, created_by: 7, answered_by: null, closed_by: null, lock_version: 1, created_at: now, submitted_at: null, answered_at: null, closed_at: null, updated_at: now, events: [event] };
            rfis.current = [saved]; return saved;
        },
        transitionCdeRfi: async (_projectId, rfiId, payload) => {
            const current = rfis.current.find((item) => item.id === rfiId);
            const statusByAction = { submit: 'submitted', answer: 'answered', close: 'closed', void: 'void' };
            const eventByAction = { submit: 'submitted', answer: 'answered', close: 'closed', void: 'voided' };
            const timestampByAction = { submit: 'submitted_at', answer: 'answered_at', close: 'closed_at', void: 'closed_at' };
            const saved = {
                ...current,
                status: statusByAction[payload.action],
                answer: payload.action === 'answer' ? payload.answer : current.answer,
                lock_version: current.lock_version + 1,
                [timestampByAction[payload.action]]: now,
                events: [...current.events, { id: nextEvent.current++, event_type: eventByAction[payload.action], payload: { reason: payload.reason }, created_by: 8, created_at: now }],
            };
            rfis.current = [saved]; return saved;
        },
    }), []);
    return <main className="min-h-screen bg-[#F2F4F7] p-3 sm:p-6"><div className="mx-auto w-full max-w-[980px]"><BimCdeRfiPanel projectId={7} empresaId={1} selectedElement={{ global_id: '3GIPROY_TEST_GUID' }} api={api} /></div></main>;
};

createRoot(document.getElementById('root')).render(<BimCdeRfiHarness />);
