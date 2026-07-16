import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimQuantityProposalPanel from '../../components/bim/BimQuantityProposalPanel';

const candidate = {
    quantity_name: 'Quantity.Volume',
    source_kind: 'ifc_element_quantity',
    original_value: 12.5,
    original_unit: 'm3',
    presented_value: 12.5,
    presented_unit: 'm3',
    conversion_factor: 1,
    rounding_digits: 3,
    normalization_rule: 'identity_si',
};

const buildSnapshot = (id, revision, mappings = []) => ({
    id,
    project_id: 1,
    version_id: 3,
    revision,
    status: 'draft',
    lock_version: 1,
    checksum: `qto-${id}`,
    coverage: {
        elements_total: 4,
        elements_with_quantities: 4,
        rows_total: 1,
        rows_mapped: mappings.length ? 1 : 0,
        quantity_coverage_percent: 100,
        mapping_coverage_percent: mappings.length ? 100 : 0,
    },
    rows: [{
        group: { ifc_class: 'IFCWALL', storey: 'Nivel 1', material: 'Hormigon' },
        quantity_name: 'Quantity.Volume',
        value: 50,
        unit: 'm3',
        element_count: 4,
        global_ids: ['GUID-QTO-001', 'GUID-QTO-002', 'GUID-QTO-003', 'GUID-QTO-004'],
        source_kinds: ['ifc_element_quantity'],
        wbs_code: mappings[0]?.wbs_code || null,
        cost_code: mappings[0]?.cost_code || null,
    }],
});

const BimQtoHarness = () => {
    const [snapshots, setSnapshots] = useState([]);
    const api = useMemo(() => ({
        listQtoSnapshots: async () => snapshots,
        createQtoSnapshot: async (_projectId, payload) => {
            const created = buildSnapshot(snapshots.length + 1, payload.revision, payload.mappings);
            setSnapshots((current) => [created, ...current]);
            return created;
        },
        getQuantityCandidates: async () => [candidate],
        createQuantityProposal: async (_projectId, payload) => ({ id: 7, ...payload, status: 'pending' }),
        decideQuantityProposal: async (_projectId, _proposalId, payload) => ({ id: 7, status: payload.decision, target_type: 'edt', target_id: 11 }),
        decideQtoSnapshot: async (_projectId, snapshotId, payload) => {
            const source = snapshots.find((item) => item.id === snapshotId);
            const decided = { ...source, status: payload.decision, lock_version: source.lock_version + 1, decision_reason: payload.reason };
            setSnapshots((current) => current.map((item) => item.id === snapshotId ? decided : item));
            return decided;
        },
        getQto5dPackage: async (_projectId, snapshotId) => {
            const snapshot = snapshots.find((item) => item.id === snapshotId);
            return { qto_checksum_sha256: snapshot.checksum, rows: snapshot.rows, coverage: snapshot.coverage };
        },
    }), [snapshots]);

    return (
        <main className="min-h-screen bg-[#F2F4F7] p-6" data-bim-qto-harness>
            <div className="mx-auto w-[460px]">
                <BimQuantityProposalPanel
                    projectId={1}
                    empresaId={1}
                    versionId={3}
                    element={{ id: 41, bim_model_version_id: 3, ifc_class: 'IFCWALL' }}
                    api={api}
                />
            </div>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimQtoHarness />);
