import React, { useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimCdeSubmittalsPanel from '../../components/bim/BimCdeSubmittalsPanel';

const now = '2026-07-13T12:00:00Z';

const BimCdeSubmittalsHarness = () => {
    const items = useRef([]);
    const nextEvent = useRef(1);
    const api = useMemo(() => ({
        listCdeSubmittals: async () => items.current,
        listCdeRfiAssignees: async () => [{ id: 8, name: 'Revisor BIM', email: 'review@giproy.test' }],
        listCdeDocuments: async () => [{ id: 91, document_code: 'SHOP-P01', title: 'Fachada REV 1' }, { id: 92, document_code: 'SHOP-P02', title: 'Fachada REV 2' }],
        createCdeSubmittal: async (_projectId, payload) => {
            const saved = { id: 41, project_id: 7, company_id: 1, submittal_number: 'SUB-0001', ...payload, status: 'draft', current_revision: 1, lock_version: 1, created_by: 7, created_at: now, updated_at: now, revisions: [{ id: 51, revision: 1, document_id: payload.document_id, document_revision_id: 101, status: 'draft', submission_notes: payload.submission_notes, decision_comment: null, submitted_by: null, reviewed_by: null, submitted_at: null, reviewed_at: null, created_at: now }], events: [{ id: nextEvent.current++, event_type: 'created', payload: { revision: 1 }, created_by: 7, created_at: now }] };
            items.current = [saved]; return saved;
        },
        transitionCdeSubmittal: async (_projectId, id, payload) => {
            const current = items.current.find((item) => item.id === id);
            const statusByAction = { submit: 'submitted', start_review: 'under_review', approve: 'approved', reject: 'rejected', void: 'void' };
            const status = statusByAction[payload.action];
            const revisions = current.revisions.map((item, index) => index === 0 ? { ...item, status, decision_comment: ['approve', 'reject'].includes(payload.action) ? payload.comment : item.decision_comment } : item);
            const saved = { ...current, status, lock_version: current.lock_version + 1, revisions, events: [...current.events, { id: nextEvent.current++, event_type: payload.action, payload: { comment: payload.comment, revision: current.current_revision }, created_by: 8, created_at: now }] };
            items.current = [saved]; return saved;
        },
        createCdeSubmittalRevision: async (_projectId, id, payload) => {
            const current = items.current.find((item) => item.id === id);
            const saved = { ...current, status: 'draft', current_revision: 2, lock_version: current.lock_version + 1, revisions: [{ id: 52, revision: 2, document_id: payload.document_id, document_revision_id: 102, status: 'draft', submission_notes: payload.submission_notes, decision_comment: null, submitted_by: null, reviewed_by: null, submitted_at: null, reviewed_at: null, created_at: now }, ...current.revisions.map((item) => ({ ...item, status: 'superseded' }))], events: [...current.events, { id: nextEvent.current++, event_type: 'revision_created', payload: { revision: 2 }, created_by: 7, created_at: now }] };
            items.current = [saved]; return saved;
        },
    }), []);
    return <main className="min-h-screen bg-[#F2F4F7] p-6"><div className="mx-auto w-[1080px]"><BimCdeSubmittalsPanel projectId={7} empresaId={1} api={api} /></div></main>;
};

createRoot(document.getElementById('root')).render(<BimCdeSubmittalsHarness />);
