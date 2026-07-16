import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimFragmentsViewport from '../../components/bim/BimFragmentsViewport';
import { getBimFragmentsSmokeBytes } from '../../components/bim/bimFragmentsBinaryFixture';

const loadHarnessBytes = async () => getBimFragmentsSmokeBytes();

const BimViewStateReplayHarness = () => {
    const [snapshot, setSnapshot] = useState(null);
    const [savedSnapshot, setSavedSnapshot] = useState(null);
    const [toApply, setToApply] = useState(null);
    const [applyStatus, setApplyStatus] = useState(null);
    const [token, setToken] = useState(0);

    const applySaved = (incompatible = false) => {
        if (!savedSnapshot) return;
        const nextToken = token + 1;
        setToken(nextToken);
        setToApply({
            ...savedSnapshot,
            source_version_id: incompatible ? 999 : savedSnapshot.source_version_id,
            apply_token: `${incompatible ? 'bad' : 'ok'}-${nextToken}`,
        });
    };

    return (
        <main
            className="min-h-screen bg-zinc-100 p-3"
            data-bim-view-state-replay-harness
            data-apply-status={applyStatus?.status || ''}
            data-snapshot-ready={Boolean(snapshot)}
        >
            <div className="mx-auto max-w-5xl">
                <div className="mb-3 flex gap-2">
                    <button type="button" onClick={() => setSavedSnapshot(snapshot)} disabled={!snapshot} className="h-9 rounded-lg bg-[#F39200] px-3 text-xs font-semibold text-white disabled:opacity-40">Capturar vista</button>
                    <button type="button" onClick={() => applySaved(false)} disabled={!savedSnapshot} className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 disabled:opacity-40">Aplicar vista</button>
                    <button type="button" onClick={() => applySaved(true)} disabled={!savedSnapshot} className="h-9 rounded-lg border border-amber-200 bg-white px-3 text-xs font-semibold text-amber-700 disabled:opacity-40">Aplicar incompatible</button>
                </div>
                <div className="h-[720px]">
                    <BimFragmentsViewport
                        projectId={1}
                        versionId={1}
                        empresaId={1}
                        loadBytes={loadHarnessBytes}
                        onViewerStateChange={setSnapshot}
                        viewerStateToApply={toApply}
                        onViewerStateApplied={setApplyStatus}
                    />
                </div>
            </div>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimViewStateReplayHarness />);
