import React from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimSafetyRiskPanel from '../../components/bim/BimSafetyRiskPanel';

const risks = [{ id: 31, activity_snapshot_id: 11, title: 'Izaje sobre frente norte', hazard_type: 'lifting', severity: 5, likelihood: 3, risk_score: 15, controls: ['Barricada perimetral', 'Señalero asignado'], zone: { x: 5, y: 0, z: 0, radius: 2 }, status: 'open' }];
let inspections = [{ id: 71, risk_id: 31, inspected_at: '2026-07-16T14:00:00Z', result: 'non_compliant', note: 'Señalero pendiente al inicio del turno.', checklist: [{ label: 'Barricada perimetral', passed: true }, { label: 'Señalero asignado', passed: false }], evidence_ref: null }];
let punches = [{ id: 91, risk_id: 31, inspection_id: 71, title: 'Asignar señalero certificado', priority: 'critical', status: 'open', created_at: '2026-07-16T14:02:00Z' }];
const api = {
    list4dSafetyRisks: async () => risks,
    list4dActivities: async () => [{ id: 11, activity_code: 'EST-120', activity_name: 'Izaje estructural' }],
    get4dSafetyExposure: async () => [{ risk_id: 31, motion_plan_id: 9, exposed: true }],
    list4dSafetyInspections: async () => inspections,
    list4dSafetyPunchItems: async () => punches,
    create4dSafetyRisk: async () => risks[0],
    create4dSafetyInspection: async (_projectId, riskId, payload) => { const item = { id: inspections.length + 72, risk_id: riskId, ...payload }; inspections = [item, ...inspections]; return item; },
    create4dSafetyPunchItem: async (_projectId, riskId, payload) => { const item = { id: punches.length + 92, risk_id: riskId, status: 'open', created_at: new Date().toISOString(), ...payload }; punches = [item, ...punches]; return item; },
    update4dSafetyPunchItem: async (_projectId, _riskId, punchId, payload) => { punches = punches.map((item) => item.id === punchId ? { ...item, ...payload } : item); return punches.find((item) => item.id === punchId); },
};

createRoot(document.getElementById('root')).render(<main className="h-screen overflow-hidden bg-[#F2F4F7] p-6"><div className="h-[calc(100vh-48px)]"><BimSafetyRiskPanel projectId={7} empresaId={1} api={api} /></div></main>);
