import React from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimCoordinationControlPanel from '../../components/bim/BimCoordinationControlPanel';

const coordinationSet = {
    id: 44,
    revision: 3,
    official: false,
    coordination_status: 'incomplete',
    presupuesto_id: 13,
    presupuesto_revision: 0,
    cronograma_trabajo_id: 1,
    baseline_id: 8,
    bim_version_ids: [21, 22],
};

const api = {
    listCoordinationSets: async () => [coordinationSet],
    getClassificationSummary: async () => ({ enabled: true, status: 'unresolved', total: 0, warning_required: true }),
    list4dBaselines: async () => [{ id: 8, name: 'Plan contractual', revision: 'R1' }],
    getCoordinationCoverage: async () => ({ coordination_status: 'incomplete', coordinated_count: 142, incomplete_count: 45, overallocated_count: 0 }),
    listCoordinationProposals: async () => [
        { id: 71, proposal_type: 'Cambio de duración', source_domain: 'Gantt', target_domain: 'BIM 4D', status: 'pending_review', version: 1 },
        { id: 72, proposal_type: 'Cantidad medida actualizada', source_domain: 'BIM', target_domain: 'Presupuesto', status: 'approved', version: 2 },
        { id: 73, proposal_type: 'Vínculo de partida corregido', source_domain: 'Presupuesto', target_domain: 'Gantt', status: 'applied', version: 3 },
    ],
    listCoordinationLinks: async () => [],
    listCoordinationConflicts: async () => [
        { id: 1, conflict_type: 'unclassified_budget_lines', severity: 'warning', status: 'open', detail: { count: 201 } },
        { id: 2, conflict_type: 'unlinked_coordination_entities', severity: 'warning', status: 'open', detail: { budget_lines: 201, activities: 187, bim_elements: 120, automatic_links_created: 0 } },
        { id: 3, conflict_type: 'missing_bim_disciplines', severity: 'warning', status: 'open', detail: { present_disciplines: ['Arquitectura'] } },
        { id: 4, conflict_type: 'missing_functional_role_assignments', severity: 'warning', status: 'open', detail: { technical_administrators: 2, business_roles_inferred: false } },
    ],
    createCoordinationSet: async () => coordinationSet,
    makeCoordinationSetOfficial: async () => ({ ...coordinationSet, official: true }),
    decideCoordinationProposal: async () => ({}),
    applyCoordinationProposal: async () => ({}),
    recoverCoordinationProposal: async () => ({}),
    createCoordinationLink: async () => ({}),
    reconcileCoordinationLinkIdentity: async () => ({}),
};

const budgetsApi = { getByProyecto: async () => ({ data: [{ id: 13, descripcion: 'Presupuesto contractual', revision: 0 }] }) };
const schedulesApi = { getTrabajo: async () => ({ id: 1 }) };

createRoot(document.getElementById('root')).render(
    <main className="h-screen overflow-hidden bg-[#F2F4F7] p-6">
        <div className="h-[calc(100vh-48px)] overflow-hidden border border-zinc-200 bg-white">
            <BimCoordinationControlPanel
                projectId={7}
                empresaId={3}
                activeVersionId={22}
                selectedActivity={{ id: 301, code: 'EST-01.020', name: 'Estructura planta baja', source_ref: 'gantt-301', budget_line_id: 905 }}
                selectedElement={{ id: 501, name: 'Viga V-21', global_id: '2GoXeF051238RZ7Ikh7ysP' }}
                canEdit
                canApprove
                canApply
                canRecover
                api={api}
                budgetsApi={budgetsApi}
                schedulesApi={schedulesApi}
            />
        </div>
    </main>,
);
