import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimFieldDocumentsPanel from '../../components/bim/BimFieldDocumentsPanel';

const documents = [
    { id: 1, document_code: 'ARQ-PLN-042', title: 'Planta arquitectónica nivel 03', category: 'drawing', status: 'active', current_revision: 3, current: { id: 101, revision: 3, version_label: 'C03', source_filename: 'ARQ-PLN-042-C03.pdf', media_type: 'application/pdf', file_size_bytes: 2457600 } },
    { id: 2, document_code: 'EST-ESP-011', title: 'Especificación de hormigón estructural', category: 'specification', status: 'active', current_revision: 2, current: { id: 102, revision: 2, version_label: 'A02', source_filename: 'EST-ESP-011-A02.pdf', media_type: 'application/pdf', file_size_bytes: 823000 } },
    { id: 3, document_code: 'SEG-PRO-005', title: 'Procedimiento de trabajo en altura', category: 'procedure', status: 'active', current_revision: 5, current: { id: 103, revision: 5, version_label: 'V05', source_filename: 'SEG-PRO-005-V05.pdf', media_type: 'application/pdf', file_size_bytes: 1224000 } },
];

const api = { listCdeDocuments: async () => documents, downloadCdeRevision: async () => new Blob(['field-document']) };

const Harness = () => {
    const [downloaded, setDownloaded] = useState('');
    return <main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="mx-auto h-[calc(100vh-48px)] w-full"><BimFieldDocumentsPanel projectId={7} empresaId={1} api={api} onDownload={(document) => setDownloaded(document.document_code)} /></div><output className="sr-only" data-bim-field-downloaded>{downloaded}</output></main>;
};

createRoot(document.getElementById('root')).render(<Harness />);
