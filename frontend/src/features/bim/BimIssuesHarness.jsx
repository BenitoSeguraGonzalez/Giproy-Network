import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import { bimModelsApi } from '../../api/bimModels';
import BimIssuesPanel from '../../components/bim/BimIssuesPanel';

let issue = null;
bimModelsApi.listIssues = async () => issue ? [issue] : [];
bimModelsApi.createIssue = async (_project, payload) => issue = { id: 1, topic_guid: '11111111-1111-1111-1111-111111111111', title: payload.title, priority: 'normal', status: 'open', assigned_to: null, version_id: payload.version_id, viewpoint: payload.viewpoint, comments: [], events: [] };
bimModelsApi.updateIssue = async (_project, _id, payload) => issue = { ...issue, ...payload };
bimModelsApi.commentIssue = async (_project, _id, body) => issue = { ...issue, comments: [...issue.comments, { id: issue.comments.length + 1, body }] };
bimModelsApi.exportIssueBcf = async () => new Blob(['bcf']);

createRoot(document.getElementById('root')).render(<main className="min-h-screen bg-zinc-100 p-3"><div className="ml-auto w-full max-w-[320px]"><BimIssuesPanel projectId={1} versionId={7} empresaId={2} currentUserId={5} viewerState={{ camera: { position: [1, 2, 3] }, selection: { global_id: 'WALL-1' } }} /></div></main>);
