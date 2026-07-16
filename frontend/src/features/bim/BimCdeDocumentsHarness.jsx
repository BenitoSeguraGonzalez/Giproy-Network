import React, { useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimCdeDocumentsPanel from '../../components/bim/BimCdeDocumentsPanel';

const BimCdeDocumentsHarness = () => {
    const documents = useRef([]);
    const history = useRef([]);
    const api = useMemo(() => ({
        listCdeDocuments: async (_projectId, includeArchived) => documents.current.filter((item) => includeArchived || item.status === 'active'),
        uploadCdeDocument: async (_projectId, payload) => {
            const existing = documents.current.find((item) => item.document_code === payload.document_code);
            const revision = (existing?.current_revision || 0) + 1;
            const revisionRow = { id: 100 + revision, document_id: existing?.id || 91, revision, version_label: payload.version_label, source_filename: payload.file.name, media_type: payload.file.type, file_size_bytes: payload.file.size, checksum_sha256: String(revision).repeat(64), notes: payload.notes, status: 'current', created_at: '2026-07-13T12:00:00Z' };
            const nextHistory = [revisionRow, ...history.current.map((item) => ({ ...item, status: 'superseded' }))];
            const saved = { id: existing?.id || 91, project_id: 7, company_id: 1, document_code: payload.document_code, title: payload.title, category: payload.category, status: 'active', current_revision: revision, created_at: '2026-07-13T12:00:00Z', updated_at: '2026-07-13T12:00:00Z', current: revisionRow };
            history.current = nextHistory; documents.current = [saved]; return saved;
        },
        listCdeDocumentRevisions: async () => history.current,
        downloadCdeRevision: async () => new Blob(['documento'], { type: 'application/pdf' }),
        archiveCdeDocument: async () => { const archived = { ...documents.current[0], status: 'archived' }; documents.current = [archived]; return archived; },
    }), []);
    return <main className="min-h-screen bg-[#F2F4F7] p-6"><div className="mx-auto w-[540px]"><BimCdeDocumentsPanel projectId={7} empresaId={1} api={api} /></div></main>;
};

createRoot(document.getElementById('root')).render(<BimCdeDocumentsHarness />);
