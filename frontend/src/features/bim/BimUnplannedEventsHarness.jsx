import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import BimUnplannedEventsPanel from '../../components/bim/BimUnplannedEventsPanel';

let events = [{ id: 41, activity_snapshot_id: 11, work_area_id: 21, event_type: 'weather', title: 'Lluvia intensa', description: 'Frente detenido por saturación del terreno.', occurred_at: '2026-07-16T15:00:00Z', delay_days: 1.5, actual_cost: 2400, status: 'reported', decision_reason: null }];
const api = {
    list4dUnplannedEvents: async () => events,
    list4dActivities: async () => [{ id: 11, activity_code: 'CIM-100', activity_name: 'Cimentación' }, { id: 12, activity_code: 'EST-120', activity_name: 'Muros' }],
    list4dWorkAreas: async () => [{ id: 21, code: 'FN-01', name: 'Frente norte' }],
    create4dUnplannedEvent: async (_projectId, payload) => { const item = { id: 42, status: 'reported', decision_reason: null, ...payload }; events = [item, ...events]; return item; },
    decide4dUnplannedEvent: async (_projectId, id, payload) => { events = events.map((item) => item.id === id ? { ...item, status: payload.action === 'validate' ? 'validated' : 'void', decision_reason: payload.reason } : item); return events.find((item) => item.id === id); },
};
createRoot(document.getElementById('root')).render(<main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)]"><BimUnplannedEventsPanel projectId={7} empresaId={1} api={api} /></div></main>);
