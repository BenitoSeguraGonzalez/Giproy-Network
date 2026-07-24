import React, { useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimCdeReviewPanel from '../../components/bim/BimCdeReviewPanel';

const documentRow = { id: 91, document_code: 'PLN-001', title: 'Plano fachada', status: 'active' };
const revisionRow = { id: 101, document_id: 91, revision: 2, version_label: 'P02', status: 'current' };

const BimCdeReviewHarness = () => {
    const review = useRef(null);
    const api = useMemo(() => ({
        listCdeReviews: async () => review.current ? [review.current] : [],
        listCdeDocuments: async () => [documentRow],
        listCdeDocumentRevisions: async () => [revisionRow],
        listCdeRfiAssignees: async () => [{ id: 8, name: 'Revisor BIM', email: 'review@giproy.test' }],
        listCdeReviewNotifications: async () => [],
        createCdeReview: async (_projectId, payload) => {
            review.current = { id: 301, project_id: 7, company_id: 1, review_number: 'REV-0001', title: payload.title, status: 'open', document_revision_id: 101, document_id: 91, document_code: 'PLN-001', document_revision: 2, version_label: 'P02', global_id: payload.global_id, viewpoint: payload.viewpoint, assigned_to: 8, assigned_name: 'Revisor BIM', due_at: payload.due_at, created_by: 7, resolution: null, lock_version: 1, created_at: '2026-07-13T12:00:00Z', updated_at: '2026-07-13T12:00:00Z', resolved_at: null, closed_at: null, comments: [{ id: 1, body: payload.initial_comment, created_by: 7, created_at: '2026-07-13T12:00:00Z' }] };
            return review.current;
        },
        commentCdeReview: async (_projectId, _reviewId, payload) => {
            review.current = { ...review.current, lock_version: 2, comments: [...review.current.comments, { id: 2, body: payload.body, created_by: 8, created_at: '2026-07-13T13:00:00Z' }] };
            return review.current;
        },
        transitionCdeReview: async (_projectId, _reviewId, payload) => {
            review.current = { ...review.current, status: payload.action === 'resolve' ? 'resolved' : payload.action === 'close' ? 'closed' : 'open', resolution: payload.resolution, lock_version: review.current.lock_version + 1 };
            return review.current;
        },
        readCdeReviewNotification: async () => null,
    }), []);
    return <main className="min-h-screen bg-[#F2F4F7] p-3 sm:p-6"><div className="mx-auto w-full max-w-[1040px]"><BimCdeReviewPanel projectId={7} empresaId={1} selectedElement={{ global_id: '3GUID-FACHADA' }} viewerState={{ camera: { position: [1, 2, 3] } }} api={api} /></div></main>;
};

createRoot(document.getElementById('root')).render(<BimCdeReviewHarness />);
