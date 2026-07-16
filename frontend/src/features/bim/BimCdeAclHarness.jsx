import React, { useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimCdeDocumentsPanel from '../../components/bim/BimCdeDocumentsPanel';

const documentRow = { id: 91, project_id: 7, company_id: 1, document_code: 'ACL-001', title: 'Plano restringido', category: 'drawing', status: 'active', current_revision: 1, created_at: '2026-07-13T12:00:00Z', updated_at: '2026-07-13T12:00:00Z', current: { id: 101, checksum_sha256: 'a'.repeat(64) } };
const revisionRow = { id: 101, document_id: 91, revision: 1, version_label: 'P01', source_filename: 'acl-p01.pdf', status: 'current', created_at: '2026-07-13T12:00:00Z' };

const BimCdeAclHarness = () => {
    const grants = useRef([]);
    const api = useMemo(() => ({
        listCdeDocuments: async () => [documentRow],
        listCdeDocumentRevisions: async () => [revisionRow],
        listCdeDocumentAcl: async () => grants.current,
        listCdeAclUsers: async () => [{ id: 8, name: 'Revisor BIM', email: 'review@giproy.test' }],
        saveCdeDocumentAcl: async (_projectId, _documentId, payload) => {
            const saved = { id: 201, document_id: 91, user_id: payload.user_id, user_name: 'Revisor BIM', user_email: 'review@giproy.test', can_manage: payload.can_manage, can_revise: payload.can_revise || payload.can_manage, can_download: payload.can_download || payload.can_revise || payload.can_manage, can_view: payload.can_view || payload.can_download || payload.can_revise || payload.can_manage, active: payload.active, granted_by: 7, created_at: '2026-07-13T12:00:00Z', updated_at: '2026-07-13T12:00:00Z' };
            grants.current = [saved]; return saved;
        },
        downloadCdeRevision: async () => new Blob(['acl']),
        archiveCdeDocument: async () => ({ ...documentRow, status: 'archived' }),
        uploadCdeDocument: async () => documentRow,
    }), []);
    return <main className="min-h-screen bg-[#F2F4F7] p-6"><div className="mx-auto w-[760px]"><BimCdeDocumentsPanel projectId={7} empresaId={1} api={api} /></div></main>;
};

createRoot(document.getElementById('root')).render(<BimCdeAclHarness />);
