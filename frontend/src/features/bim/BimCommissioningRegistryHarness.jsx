import React from 'react';
import { createRoot } from 'react-dom/client';
import '../../index.css';
import Panel from '../../components/bim/BimCommissioningRegistryPanel';

let registry = { project_id: 7, company_id: 1, systems: [], assets: [], tests: [] };
const api = {
    getCommissioningRegistry: async () => registry,
    createCommissioningSystem: async (_project, payload) => { const value = { id: 1, ...payload, status: 'registered', asset_count: 0, lock_version: 1 }; registry = { ...registry, systems: [value] }; return value; },
    createCommissioningAsset: async (_project, payload) => { const value = { id: 1, ...payload, global_id: 'GUID-PUMP-01', source_system_name: 'Agua helada', status: 'registered', lock_version: 1 }; registry = { ...registry, systems: registry.systems.map((system) => ({ ...system, asset_count: 1 })), assets: [value] }; return value; },
    createCommissioningTest: async (_project, payload) => { const value = { id: 1, ...payload, attempt: 1, status: 'submitted', lock_version: 1 }; registry = { ...registry, systems: registry.systems.map((system) => ({ ...system, status: 'commissioning', lock_version: 2 })), assets: registry.assets.map((asset) => ({ ...asset, status: 'testing', lock_version: 2 })), tests: [value] }; return value; },
    decideCommissioningTest: async (_project, id, payload) => { const value = { ...registry.tests.find((item) => item.id === id), status: payload.decision, decision_reason: payload.reason, lock_version: 2 }; registry = { ...registry, assets: registry.assets.map((asset) => ({ ...asset, status: payload.decision === 'accepted' ? 'testing' : 'rejected', lock_version: 3 })), tests: [value] }; return value; },
    decideCommissioningAsset: async (_project, id, payload) => { const value = { ...registry.assets.find((item) => item.id === id), status: payload.decision, decision_reason: payload.reason, lock_version: 4 }; registry = { ...registry, assets: [value] }; return value; },
    acceptCommissioningSystem: async (_project, id, payload) => { const value = { ...registry.systems.find((item) => item.id === id), status: 'accepted', decision_reason: payload.reason, lock_version: 3 }; registry = { ...registry, systems: [value] }; return value; },
};
const element = { id: 21, nombre: 'Bomba 01', global_id: 'GUID-PUMP-01', ifc_class: 'IFCPUMP' };
createRoot(document.getElementById('root')).render(<main className="h-screen bg-zinc-100 p-6"><div className="h-[calc(100vh-48px)]"><Panel projectId={7} empresaId={1} versionId={10} element={element} api={api}/></div></main>);
