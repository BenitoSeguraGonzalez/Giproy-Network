import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimScheduleInterchangePanel from '../../components/bim/BimScheduleInterchangePanel';

const documentPayload = {
    contract_version: 'giproy_bim_schedule_interchange_v1', source_format: 'mspdi_xml', source_filename: 'gantt-r3.xml', source_checksum_sha256: 'a'.repeat(64), source_application: 'Microsoft Project', project_external_id: 'PRJ-01-R3', project_name: 'Edificio Central R3', timezone: 'America/Bogota', currency: 'USD', data_date: '2026-07-13T12:00:00Z', calendars: [], wbs: [], activities: [{ id: 'A1', code: 'A1', name: 'Cimentacion', activity_type: 'task', planned_start: '2026-08-01T12:00:00Z', planned_finish: '2026-08-05T12:00:00Z', percent_complete: 0, duration_hours: 32, constraint_type: 'none', custom_fields: {} }], dependencies: [], resources: [], assignments: [], baselines: [], unsupported_source_fields: ['Task.Notes.rich_text'],
};

const BimScheduleInterchangeHarness = () => {
    const [revisions, setRevisions] = useState([]);
    const api = useMemo(() => ({
        listScheduleImportRevisions: async () => revisions,
        previewScheduleInterchange: async () => ({ contract_version: 'giproy_bim_schedule_import_preview_v1', coordination_stage_id: 41, document: documentPayload, preflight: { valid: true, normalized_checksum_sha256: 'b'.repeat(64), counts: { activities: 1, dependencies: 0, resources: 0 }, errors: [], warnings: [{ severity: 'warning', code: 'unsupported', path: 'unsupported_source_fields', message: 'Notas enriquecidas no representables.' }] } }),
        createScheduleImportRevision: async () => { const created = { id: 51, project_id: 7, company_id: 1, revision: 3, version: 1, source_format: 'mspdi_xml', source_filename: 'gantt-r3.xml', source_checksum_sha256: 'a'.repeat(64), normalized_checksum_sha256: 'b'.repeat(64), status: 'pending', counts: { activities: 1 }, created_at: '2026-07-13T12:00:00Z' }; setRevisions([created]); return created; },
        decideScheduleImportRevision: async (_projectId, _revisionId, payload) => { const updated = { ...revisions[0], status: payload.decision, version: 2, decision_reason: payload.reason }; setRevisions([updated]); return updated; },
        rollbackScheduleImportRevision: async (_projectId, _revisionId, payload) => { const updated = { ...revisions[0], status: 'rolled_back', version: 3, rollback_reason: payload.reason }; setRevisions([updated]); return updated; },
        exportScheduleInterchange: async () => new Blob(['<Project />'], { type: 'application/xml' }),
    }), [revisions]);
    return <main className="min-h-screen bg-[#F2F4F7] p-6"><div className="mx-auto w-[520px]"><BimScheduleInterchangePanel projectId={7} empresaId={1} api={api} /></div></main>;
};

createRoot(document.getElementById('root')).render(<BimScheduleInterchangeHarness />);
