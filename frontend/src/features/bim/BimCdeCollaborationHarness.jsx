import React from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimCdeCollaborationPanel from '../../components/bim/BimCdeCollaborationPanel';

const now = new Date().toISOString();
const presences = [
    { id: 1, user_id: 8, user_name: 'María Coordinación BIM', session_key: 'session-one', workspace: 'coordination', context: { tool: 'activity' }, last_seen_at: now, current_user: true },
    { id: 2, user_id: 9, user_name: 'Carlos Estructuras', session_key: 'session-two', workspace: 'viewer', context: { global_id: '2O2Fr$t4X7Zf8NOew3FLOH' }, last_seen_at: now, current_user: false },
    { id: 3, user_id: 10, user_name: 'Lucía Arquitectura', session_key: 'session-three', workspace: 'planning', context: { tool: 'schedule' }, last_seen_at: now, current_user: false },
];
const events = [
    { id: 41, event_type: 'presence.joined', actor_id: 10, actor_name: 'Lucía Arquitectura', summary: 'Se conectó al espacio BIM.', payload: { workspace: 'planning' }, created_at: now },
    { id: 42, event_type: 'review.created', entity_type: 'cde_review', entity_id: 17, actor_id: 8, actor_name: 'María Coordinación BIM', summary: 'Creó REV-0017: Fachada norte', payload: { review_number: 'REV-0017', status: 'open' }, created_at: now },
    { id: 43, event_type: 'review.commented', entity_type: 'cde_review', entity_id: 17, actor_id: 9, actor_name: 'Carlos Estructuras', summary: 'Comentó REV-0017: Fachada norte', payload: { review_number: 'REV-0017', comment_id: 24 }, created_at: now },
];
const api = {
    heartbeatCdePresence: async () => presences[0],
    leaveCdePresence: async () => undefined,
    listCdePresences: async () => presences,
    listCdeCollaborationEvents: async (_projectId, afterId) => ({ contract_version: 'giproy_bim_cde_collaboration_feed_v1', project_id: 7, company_id: 1, cursor: 43, events: afterId ? [] : events }),
};

createRoot(document.getElementById('root')).render(
    <main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="mx-auto h-[calc(100vh-48px)] w-full max-w-[2200px]"><BimCdeCollaborationPanel projectId={7} empresaId={1} selectedElement={{ global_id: '2O2Fr$t4X7Zf8NOew3FLOH' }} api={api} /></div></main>,
);
