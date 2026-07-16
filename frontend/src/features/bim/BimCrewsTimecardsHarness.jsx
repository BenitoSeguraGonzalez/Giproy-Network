import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import BimCrewsTimecardsPanel from '../../components/bim/BimCrewsTimecardsPanel';

let crews = [{ id: 41, code: 'CU-EST-01', name: 'Cuadrilla estructura 1', trade: 'Estructura', member_count: 8, active: true, note: 'Cimentaciones' }];
let timecards = [{ id: 51, crew_id: 41, crew_code: 'CU-EST-01', crew_name: 'Cuadrilla estructura 1', activity_snapshot_id: 11, work_area_id: 21, work_date: '2026-07-16', regular_hours: 8, overtime_hours: 1, total_hours: 9, installed_quantity: 12, installed_unit: 'm3', note: 'Vaciado inicial' }];
const api = {
    list4dCrews: async () => crews,
    list4dActivities: async () => [{ id: 11, activity_code: 'CIM-100', activity_name: 'Cimentación' }],
    list4dWorkAreas: async () => [{ id: 21, code: 'FN-01', name: 'Frente norte' }],
    list4dTimecards: async () => timecards,
    create4dCrew: async (_projectId, payload) => { const item = { id: crews.length + 41, ...payload }; crews = [...crews, item]; return item; },
    create4dTimecard: async (_projectId, payload) => { const crew = crews.find((item) => item.id === payload.crew_id); const item = { id: timecards.length + 51, crew_code: crew.code, crew_name: crew.name, total_hours: payload.regular_hours + payload.overtime_hours, ...payload }; timecards = [item, ...timecards]; return item; },
};

createRoot(document.getElementById('root')).render(<main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)]"><BimCrewsTimecardsPanel projectId={7} empresaId={1} api={api} /></div></main>);
