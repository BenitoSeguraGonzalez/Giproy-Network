import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimFragmentsViewport from '../../components/bim/BimFragmentsViewport';
import BimShellContextBar from '../../components/bim/BimShellContextBar';
import { getBimFragmentsSmokeBytes } from '../../components/bim/bimFragmentsBinaryFixture';

const loadHarnessBytes = async () => getBimFragmentsSmokeBytes();

const BimShellHarness = () => {
    const [viewerMode, setViewerMode] = useState('fragments');
    const [explorerVisible, setExplorerVisible] = useState(true);
    const [inspectorVisible, setInspectorVisible] = useState(true);
    const [refreshCount, setRefreshCount] = useState(0);
    const [resetCount, setResetCount] = useState(0);

    return (
        <main
            className="flex h-screen min-w-0 flex-col overflow-hidden bg-zinc-100"
            data-bim-shell-harness
            data-refresh-count={refreshCount}
            data-reset-count={resetCount}
        >
            <BimShellContextBar
                companyLabel="Constructora Santiago"
                projectLabel="Centro Empresarial Norte"
                modelLabel="Arquitectura coordinada"
                versionLabel="IFC4 - R08"
                viewerMode={viewerMode}
                explorerVisible={explorerVisible}
                inspectorVisible={inspectorVisible}
                onChangeViewerMode={setViewerMode}
                onToggleExplorer={() => setExplorerVisible((current) => !current)}
                onToggleInspector={() => setInspectorVisible((current) => !current)}
                onReset={() => setResetCount((current) => current + 1)}
                onRefresh={() => setRefreshCount((current) => current + 1)}
            />
            <section
                className={`grid min-h-0 flex-1 gap-3 overflow-auto p-3 ${
                    explorerVisible && inspectorVisible
                        ? 'lg:grid-cols-[240px_minmax(0,1fr)_280px]'
                        : explorerVisible
                          ? 'lg:grid-cols-[240px_minmax(0,1fr)]'
                          : inspectorVisible
                            ? 'lg:grid-cols-[minmax(0,1fr)_280px]'
                            : 'grid-cols-1'
                }`}
                data-bim-shell-layout
            >
                {explorerVisible ? (
                    <aside className="min-h-36 rounded-lg border border-zinc-200 bg-white p-3" data-bim-shell-explorer>
                        <h2 className="text-xs font-semibold text-zinc-900">Explorer</h2>
                        <button type="button" className="mt-3 w-full rounded-md bg-orange-50 px-2 py-2 text-left text-xs font-medium text-[#B86700]">
                            Nivel 01 / Muros
                        </button>
                    </aside>
                ) : null}
                <div className="min-h-[420px] min-w-0">
                    {viewerMode === 'fragments' ? (
                        <BimFragmentsViewport projectId={1} versionId={1} empresaId={1} loadBytes={loadHarnessBytes} />
                    ) : (
                        <div className="grid h-full min-h-[420px] place-items-center rounded-lg border border-zinc-200 bg-white" data-bim-shell-plan>
                            <span className="text-sm font-semibold text-zinc-600">Plano 2D</span>
                        </div>
                    )}
                </div>
                {inspectorVisible ? (
                    <aside className="min-h-36 rounded-lg border border-zinc-200 bg-white p-3" data-bim-shell-inspector>
                        <h2 className="text-xs font-semibold text-zinc-900">Inspector</h2>
                        <dl className="mt-3 grid grid-cols-2 gap-2 text-xs">
                            <dt className="text-zinc-400">Clase</dt><dd className="truncate font-medium text-zinc-800">IfcWall</dd>
                            <dt className="text-zinc-400">GlobalId</dt><dd className="truncate font-medium text-zinc-800">2Q8xR08BIM</dd>
                        </dl>
                    </aside>
                ) : null}
            </section>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimShellHarness />);
