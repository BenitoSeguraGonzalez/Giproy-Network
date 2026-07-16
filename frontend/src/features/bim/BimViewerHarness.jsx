import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimCanvasViewer from '../../components/bim/BimCanvasViewer';
import BimFragmentsHarness from '../../components/bim/BimFragmentsHarness';
import BimThreeViewer from '../../components/bim/BimThreeViewer';

const elements = [
    {
        id: 101,
        global_id: 'HARNESS-WALL-001',
        ifc_class: 'IfcWall',
        nombre: 'Muro harness',
        storey_name: 'Nivel 01',
        bim_model_version_id: 7,
        metadata_json: {
            geometry_2d: { x: 40, y: 56, width: 210, height: 34 },
        },
    },
    {
        id: 102,
        global_id: 'HARNESS-SLAB-002',
        ifc_class: 'IfcSlab',
        nombre: 'Losa harness',
        storey_name: 'Nivel 01',
        bim_model_version_id: 7,
        metadata_json: {
            geometry_2d: {
                points: [
                    { x: 110, y: 150 },
                    { x: 330, y: 150 },
                    { x: 355, y: 255 },
                    { x: 95, y: 260 },
                ],
            },
        },
    },
    {
        id: 103,
        global_id: 'HARNESS-GRID-003',
        ifc_class: 'IfcGrid',
        nombre: 'Eje harness',
        storey_name: 'Nivel 01',
        bim_model_version_id: 7,
        metadata_json: {
            geometry_2d: {
                points: [
                    { x: 390, y: 54 },
                    { x: 390, y: 292 },
                ],
            },
        },
    },
];

const viewerArtifact = {
    artifact_type: 'giproy_bim_viewer_artifact',
    artifact_version: 1,
    source_version_id: 7,
    source_filename: 'harness.ifc',
    source_artifact_path: 'local/harness/artifacts/viewer-artifact-v7.json',
    summary: {
        element_count: 3,
        storey_count: 1,
        ifc_class_counts: {
            IfcWall: 1,
            IfcSlab: 1,
            IfcGrid: 1,
        },
    },
    storeys: [{ id: 1, name: 'Nivel 01' }],
    elements: [
        {
            viewer_id: 'artifact-wall-001',
            bim_element_id: 101,
            global_id: 'HARNESS-WALL-001',
            ifc_class: 'IfcWall',
            name: 'Muro harness',
            storey_name: 'Nivel 01',
            bounds_2d: { x: 40, y: 56, width: 210, height: 34 },
            property_count: 2,
        },
        {
            viewer_id: 'artifact-slab-002',
            bim_element_id: 102,
            global_id: 'HARNESS-SLAB-002',
            ifc_class: 'IfcSlab',
            name: 'Losa harness',
            storey_name: 'Nivel 01',
            bounds_2d: { x: 95, y: 150, width: 260, height: 110 },
            property_count: 1,
        },
        {
            viewer_id: 'artifact-grid-003',
            bim_element_id: 103,
            global_id: 'HARNESS-GRID-003',
            ifc_class: 'IfcGrid',
            name: 'Eje harness',
            storey_name: 'Nivel 01',
            bounds_2d: { x: 390, y: 54, width: 12, height: 238 },
            property_count: 0,
        },
    ],
    indexes: {
        storeys: { 'Nivel 01': [101, 102, 103] },
        ifc_classes: { IfcWall: [101], IfcSlab: [102], IfcGrid: [103] },
        properties: { FireRating: [101], Thickness: [101, 102] },
    },
};

const BimViewerHarness = () => {
    const [selectedElement, setSelectedElement] = useState(elements[0]);

    return (
        <main
            data-bim-viewer-harness="isolated"
            data-selected-element-id={selectedElement?.id || ''}
            className="h-screen bg-zinc-100 p-4"
        >
            <div className="flex h-full min-h-0 flex-col gap-4">
                <BimFragmentsHarness />
                <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-2">
                    <BimCanvasViewer
                        elements={elements}
                        ready
                        error={false}
                        selectedElement={selectedElement}
                        selectedLink={{ id: 500, bim_element_id: 102, target_type: 'edt', target_label: 'EDT Harness' }}
                        linkedElementIds={[101, 102]}
                        elementLinkCounts={{ 101: 1, 102: 2 }}
                        validationIssuesByElementId={{
                            103: [{ severity: 'warning', message: 'Advertencia harness' }],
                        }}
                        onSelectElement={setSelectedElement}
                        activeVersionLabel="v-harness"
                        activeStoreyName="Nivel 01"
                    />
                    <BimThreeViewer
                        elements={elements}
                        viewerArtifact={viewerArtifact}
                        ready
                        selectedElement={selectedElement}
                        linkedElementIds={[101, 102]}
                        activeVersionLabel="v-harness"
                        activeStoreyName="Nivel 01"
                        onSelectElement={setSelectedElement}
                    />
                </div>
            </div>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimViewerHarness />);
