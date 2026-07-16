import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimFragmentsViewport from '../../components/bim/BimFragmentsViewport';
import { getBimFragmentsSmokeBytes } from '../../components/bim/bimFragmentsBinaryFixture';

const loadHarnessBytes = async () => getBimFragmentsSmokeBytes();

const BimFragmentsProductHarness = () => {
    const [selectedGuid, setSelectedGuid] = useState('');
    return (
        <main className="min-h-screen bg-zinc-100 p-3 sm:p-5" data-bim-fragments-product-harness data-selected-guid={selectedGuid}>
            <div className="mx-auto h-[calc(100vh-24px)] min-h-[520px] max-w-6xl sm:h-[calc(100vh-40px)]">
                <BimFragmentsViewport
                    projectId={1}
                    versionId={1}
                    empresaId={1}
                    loadBytes={loadHarnessBytes}
                    onSelectGuid={setSelectedGuid}
                />
            </div>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimFragmentsProductHarness />);
