import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimFragmentsViewport from '../../components/bim/BimFragmentsViewport';
import { getBimFragmentsSmokeBytes } from '../../components/bim/bimFragmentsBinaryFixture';

const initialMembers = [
    { version_id: 101, discipline: 'Arquitectura', enabled: true, transform: { translation: [0, 0, 0], rotation_degrees: [0, 0, 0], scale: [1, 1, 1] } },
    { version_id: 102, discipline: 'Estructura', enabled: true, transform: { translation: [0.25, 0, 0], rotation_degrees: [0, 0, 0], scale: [1, 1, 1] } },
    { version_id: 103, discipline: 'MEP', enabled: true, transform: { translation: [8, 0, 0], rotation_degrees: [0, 0, 0], scale: [1, 1, 1] } },
    { version_id: 104, discipline: 'Civil', enabled: true, transform: { translation: [-8, 0, 0], rotation_degrees: [0, 0, 0], scale: [1, 1, 1] } },
    { version_id: 105, discipline: 'Temporal', enabled: true, transform: { translation: [0, 0, 8], rotation_degrees: [0, 0, 0], scale: [1, 1, 1] } },
];

const BimFederationHarness = () => {
    const [members, setMembers] = useState(initialMembers);
    const [mounted, setMounted] = useState(true);
    const toggle = (versionId) => setMembers((current) => current.map((member) => (
        member.version_id === versionId ? { ...member, enabled: !member.enabled } : member
    )));
    return (
        <main className="min-h-screen bg-zinc-100 p-3" data-bim-federation-harness>
            <div className="mx-auto max-w-5xl">
                <div className="mb-3 flex gap-2">
                    <button type="button" onClick={() => setMounted((value) => !value)} className="h-9 rounded-md bg-zinc-800 px-3 text-xs font-semibold text-white">{mounted ? 'Desmontar visor' : 'Montar visor'}</button>
                    {members.map((member) => (
                        <button key={member.version_id} type="button" onClick={() => toggle(member.version_id)} className="h-9 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700" aria-pressed={member.enabled}>{member.discipline}</button>
                    ))}
                </div>
                {mounted ? <div className="h-[720px]">
                    <BimFragmentsViewport projectId={1} versionId={101} empresaId={1} federationMembers={members} loadMemberBytes={getBimFragmentsSmokeBytes} />
                </div> : null}
            </div>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimFederationHarness />);
