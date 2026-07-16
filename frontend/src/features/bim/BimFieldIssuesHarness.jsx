import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimFieldIssuesPanel from '../../components/bim/BimFieldIssuesPanel';

const svgBlob = () => new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#d9dde2"/><rect x="180" y="45" width="280" height="270" fill="#b8bec6"/><path d="M310 70l18 220" stroke="#b42318" stroke-width="8"/><circle cx="320" cy="180" r="42" fill="none" stroke="#f39200" stroke-width="8"/></svg>'], { type: 'image/svg+xml' });
let nextId = 3;
let issues = [
    { id: 1, topic_guid: '25f718d0-0ee0-4cb2-83dd-e8180b0e77a1', title: 'Fisura en muro estructural E-14', description: 'Fisura diagonal observada en el frente norte, nivel 02.', priority: 'high', status: 'open', version_id: 7, viewpoint: { selected_guids: ['WALL-E14'] }, comments: [{ id: 1, body: 'Pendiente evaluación del especialista.' }], attachments: [{ id: 91, issue_id: 1, filename: 'fisura-e14.png', content_type: 'image/png', byte_size: 824000 }] },
    { id: 2, topic_guid: '49072f16-97a1-4269-8e5a-b03f1499e138', title: 'Baranda temporal incompleta', description: 'Falta tramo de protección colectiva en borde oeste.', priority: 'critical', status: 'assigned', version_id: 7, viewpoint: { selected_guids: ['SLAB-L03'] }, comments: [], attachments: [] },
];
const api = {
    listIssues: async () => issues,
    createIssue: async (_projectId, payload) => { const item = { id: nextId++, topic_guid: crypto.randomUUID(), status: 'open', comments: [], attachments: [], ...payload }; issues = [item, ...issues]; return item; },
    updateIssue: async (_projectId, issueId, payload) => { issues = issues.map((item) => item.id === issueId ? { ...item, ...payload } : item); return issues.find((item) => item.id === issueId); },
    commentIssue: async (_projectId, issueId, body) => { issues = issues.map((item) => item.id === issueId ? { ...item, comments: [...item.comments, { id: Date.now(), body }] } : item); return issues.find((item) => item.id === issueId); },
    uploadIssueAttachment: async (_projectId, issueId, file) => ({ id: 100 + Date.now(), issue_id: issueId, filename: file.name, content_type: file.type, byte_size: file.size }),
    downloadIssueAttachment: async () => svgBlob(),
};

const Harness = () => {
    const [opened, setOpened] = useState('');
    return <main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)] w-full"><BimFieldIssuesPanel projectId={7} versionId={7} empresaId={1} api={api} viewerState={{ selection: { global_id: 'WALL-E14' } }} onOpenIssue={(issue) => setOpened(`issue-${issue.id}`)} onOpenAttachment={(attachment) => setOpened(`attachment-${attachment.id}`)} /></div><output className="sr-only" data-bim-field-issue-opened>{opened}</output></main>;
};

createRoot(document.getElementById('root')).render(<Harness />);
