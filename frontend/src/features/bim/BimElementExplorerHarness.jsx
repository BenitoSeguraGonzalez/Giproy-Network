import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimTreePanel from '../../components/bim/BimTreePanel';

const BimElementExplorerHarness = () => {
    const [selectedElement, setSelectedElement] = useState(null);
    const elements = useMemo(
        () => Array.from({ length: 1005 }, (_, index) => ({
            id: index + 1,
            bim_model_version_id: 1,
            global_id: `HARNESS-${String(index).padStart(4, '0')}`,
            nombre: `Elemento ${String(index).padStart(4, '0')}`,
            ifc_class: index % 4 === 0 ? 'IFCDUCTSEGMENT' : 'IFCWALL',
            storey_name: `Nivel ${String((index % 8) + 1).padStart(2, '0')}`,
            system_name: index % 4 === 0 ? 'Suministro' : null,
            classification: `CL-${index % 6}`,
            properties: { codigo: `PROP-${String(index).padStart(4, '0')}` },
        })),
        [],
    );
    return (
        <main
            className="grid min-h-screen min-w-0 gap-3 bg-zinc-100 p-3 md:grid-cols-[360px_minmax(0,1fr)]"
            data-bim-element-explorer-harness
            data-selected-guid={selectedElement?.global_id || ''}
        >
            <div className="h-[calc(100vh-24px)] min-h-[620px]">
                <BimTreePanel
                    nodes={[{ id: 'root', label: 'Modelo' }]}
                    elements={elements}
                    ready
                    versionId={1}
                    selectedElement={selectedElement}
                    selectedElementId={selectedElement?.id}
                    onSelectElement={setSelectedElement}
                />
            </div>
            <section className="min-h-40 rounded-lg border border-zinc-200 bg-white p-4" data-bim-explorer-harness-inspector>
                <h1 className="text-sm font-semibold text-zinc-900">Inspector sincronizado</h1>
                <p className="mt-3 font-mono text-xs text-zinc-600">{selectedElement?.global_id || 'Sin selección'}</p>
            </section>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimElementExplorerHarness />);
