import React, { useMemo, useState } from 'react';
import { BadgeDollarSign, ClipboardList, FileCheck2, FileSignature, ReceiptText, TrendingUp } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';
import BimActualCostLedgerPanel from './BimActualCostLedgerPanel';
import BimCostChangeOrdersPanel from './BimCostChangeOrdersPanel';
import BimCostContractsPanel from './BimCostContractsPanel';
import BimCostForecastPanel from './BimCostForecastPanel';
import BimCostPaymentsPanel from './BimCostPaymentsPanel';
import BimCostSovPanel from './BimCostSovPanel';

const SECTIONS = [
    { id: 'contracts', label: 'Compromisos', description: 'Contratos sobre estimaciones aprobadas', icon: FileSignature },
    { id: 'sov', label: 'Valores', description: 'Estructura contractual de valores', icon: ClipboardList },
    { id: 'payments', label: 'Certificaciones', description: 'Solicitudes, revisión y certificación', icon: FileCheck2 },
    { id: 'changes', label: 'Cambios', description: 'Impactos económicos y de plazo', icon: ReceiptText },
    { id: 'actuals', label: 'Coste real', description: 'Conciliación de partes de campo', icon: BadgeDollarSign },
    { id: 'forecast', label: 'Previsión', description: 'Coste estimado al finalizar', icon: TrendingUp },
];

const BimCostControlWorkbench = ({ projectId, empresaId, api = bimModelsApi }) => {
    const [activeSection, setActiveSection] = useState('contracts');
    const activeMeta = useMemo(() => SECTIONS.find((item) => item.id === activeSection) || SECTIONS[0], [activeSection]);
    const content = {
        contracts: <BimCostContractsPanel projectId={projectId} empresaId={empresaId} api={api} />,
        sov: <BimCostSovPanel projectId={projectId} empresaId={empresaId} api={api} />,
        payments: <BimCostPaymentsPanel projectId={projectId} empresaId={empresaId} api={api} />,
        changes: <BimCostChangeOrdersPanel projectId={projectId} empresaId={empresaId} api={api} />,
        actuals: <BimActualCostLedgerPanel projectId={projectId} empresaId={empresaId} api={api} />,
        forecast: <BimCostForecastPanel projectId={projectId} empresaId={empresaId} api={api} />,
    };

    return (
        <section className="grid h-full min-h-0 grid-cols-[15rem_minmax(0,1fr)] overflow-hidden bg-white" data-bim-cost-control-workbench data-bim-cost-section={activeSection}>
            <aside className="flex min-h-0 flex-col border-r border-zinc-200 bg-zinc-50" aria-label="Flujo de control económico">
                <div className="border-b border-zinc-200 px-4 py-4">
                    <h3 className="text-xs font-semibold text-zinc-950">Control económico 5D</h3>
                    <p className="mt-1 text-[11px] leading-4 text-zinc-600">Del compromiso a la previsión, sin alterar el presupuesto oficial.</p>
                </div>
                <nav className="min-h-0 flex-1 overflow-y-auto py-2" aria-label="Etapas de control económico">
                    {SECTIONS.map(({ id, label, description, icon: Icon }, index) => {
                        const active = id === activeSection;
                        return (
                            <button key={id} type="button" onClick={() => setActiveSection(id)} className={`flex min-h-[4.25rem] w-full items-start gap-3 px-4 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600 ${active ? 'bg-white text-zinc-950' : 'text-zinc-700 hover:bg-white/70'}`} aria-current={active ? 'step' : undefined}>
                                <span className={`mt-0.5 inline-flex size-7 shrink-0 items-center justify-center rounded-md ${active ? 'bg-orange-50 text-orange-700' : 'text-zinc-500'}`}><Icon className="size-3.5" aria-hidden="true" /></span>
                                <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="text-xs">{label}</strong><span className="text-[9px] tabular-nums text-zinc-500">{index + 1}/6</span></span><span className="mt-0.5 block text-[10px] leading-4 text-zinc-600">{description}</span></span>
                            </button>
                        );
                    })}
                </nav>
            </aside>
            <main className="flex min-h-0 min-w-0 flex-col overflow-hidden" aria-label={activeMeta.label}>
                <header className="flex min-h-12 shrink-0 items-center border-b border-zinc-200 px-4">
                    <div><h3 className="text-xs font-semibold text-zinc-950">{activeMeta.label}</h3><p className="mt-0.5 text-[10px] text-zinc-600">{activeMeta.description}</p></div>
                    <span className="ml-auto text-[10px] font-medium text-zinc-500">Presupuesto GiProy como referencia</span>
                </header>
                <div className="min-h-0 flex-1 overflow-hidden [&>section]:border-0 [&>section>header]:hidden">
                    {content[activeSection]}
                </div>
            </main>
        </section>
    );
};

export default BimCostControlWorkbench;
