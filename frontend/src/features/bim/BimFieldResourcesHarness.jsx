import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import BimFieldResourcesPanel from '../../components/bim/BimFieldResourcesPanel';

let movements = [{ id: 1, resource_id: 31, activity_snapshot_id: null, work_area_id: null, movement_type: 'receipt', quantity: 12, occurred_at: '2026-07-16T14:00:00Z', reference: 'REM-001', note: 'Recepción conforme', balance_after: 12 }];
const api = {
    list4dResources: async () => [{ id: 31, code: 'MAT-H25', name: 'Hormigón H25', resource_type: 'material', unit: 'm3' }, { id: 32, code: 'EQ-GRU', name: 'Grúa torre', resource_type: 'equipment', unit: 'h' }, { id: 33, code: 'MO-01', name: 'Cuadrilla', resource_type: 'labor', unit: 'h' }],
    list4dActivities: async () => [{ id: 11, activity_code: 'CIM-100', activity_name: 'Cimentación' }],
    list4dWorkAreas: async () => [{ id: 21, code: 'FN-01', name: 'Frente norte' }],
    list4dFieldResourceMovements: async () => movements,
    create4dFieldResourceMovement: async (_projectId, payload) => { const current = movements.filter((item) => item.resource_id === payload.resource_id).at(-1)?.balance_after || 0; const balance_after = current + (payload.movement_type === 'consume' ? -payload.quantity : payload.quantity); const item = { id: movements.length + 1, balance_after, ...payload }; movements = [...movements, item]; return item; },
};
createRoot(document.getElementById('root')).render(<main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)]"><BimFieldResourcesPanel projectId={7} empresaId={1} api={api} /></div></main>);
