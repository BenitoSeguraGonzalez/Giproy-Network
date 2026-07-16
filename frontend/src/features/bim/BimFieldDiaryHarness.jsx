import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimFieldDiaryPanel from '../../components/bim/BimFieldDiaryPanel';

const activities = [{ id: 11, activity_code: 'EST-120', activity_name: 'Muros nivel 02' }, { id: 12, activity_code: 'ARQ-230', activity_name: 'Mampostería nivel 03' }];
const areas = [{ id: 21, code: 'FN-02', name: 'Frente norte' }, { id: 22, code: 'FO-03', name: 'Frente oeste' }];
const reports = [
    { id: 101, activity_snapshot_id: 11, work_area_id: 21, reported_at: '2026-07-16T17:30:00Z', progress_percent: 58, installed_quantity: 14.5, installed_unit: 'm3', labor_hours: 32, equipment_hours: 4, actual_cost: 1850, schedule_performance_index: 0.94, cost_performance_index: 1.03, daily_log: 'Hormigonado completado en ejes 3-5. Se verificó recubrimiento antes del vaciado.', evidence: [{ id: 501, filename: 'muro-eje-4.png', byte_size: 920000 }] },
    { id: 102, activity_snapshot_id: 12, work_area_id: 22, reported_at: '2026-07-16T15:10:00Z', progress_percent: 36, installed_quantity: 82, installed_unit: 'm2', labor_hours: 24, equipment_hours: 0, actual_cost: 940, schedule_performance_index: 1.02, cost_performance_index: 0.98, daily_log: 'Mampostería ejecutada hasta dinteles. Pendiente liberación de instalaciones.', evidence: [] },
    { id: 103, activity_snapshot_id: 11, work_area_id: 21, reported_at: '2026-07-15T17:20:00Z', progress_percent: 49, installed_quantity: 11, installed_unit: 'm3', labor_hours: 30, equipment_hours: 4, actual_cost: 1700, schedule_performance_index: 0.91, cost_performance_index: 1.01, daily_log: 'Armado y encofrado revisados para el siguiente vaciado.', evidence: [{ id: 502, filename: 'encofrado.png', byte_size: 640000 }] },
    { id: 104, activity_snapshot_id: 12, work_area_id: 22, reported_at: '2026-07-14T16:50:00Z', progress_percent: 22, installed_quantity: 48, installed_unit: 'm2', labor_hours: 18, equipment_hours: 0, actual_cost: 610, schedule_performance_index: 1.04, cost_performance_index: 1.08, daily_log: 'Replanteo aprobado e inicio de primera hilada.', evidence: [] },
];
const evidenceBlob = () => new Blob(['<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360"><rect width="640" height="360" fill="#dde2e7"/><rect x="80" y="80" width="480" height="220" fill="#aeb7c0"/><path d="M80 210h480" stroke="#f39200" stroke-width="12"/></svg>'], { type: 'image/svg+xml' });
const api = { list4dFieldReports: async () => reports, list4dActivities: async () => activities, list4dWorkAreas: async () => areas, download4dFieldEvidence: async () => evidenceBlob() };

const Harness = () => {
    const [opened, setOpened] = useState('');
    return <main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)] w-full"><BimFieldDiaryPanel projectId={7} empresaId={1} api={api} onOpenEvidence={(evidence) => setOpened(String(evidence.id))} /></div><output className="sr-only" data-bim-field-diary-opened>{opened}</output></main>;
};

createRoot(document.getElementById('root')).render(<Harness />);
