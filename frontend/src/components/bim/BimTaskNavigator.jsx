import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Check, ChevronRight, ListTree, X } from 'lucide-react';

import { getBimToolMeta, groupBimTools } from './bimWorkflowCatalog';

const BimTaskNavigator = ({ mode, modeLabel, tools, selectedTool, onSelectTool, onClose, children, initialCatalogOpen = false }) => {
    const [catalogOpen, setCatalogOpen] = useState(initialCatalogOpen);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const groups = useMemo(() => groupBimTools(mode, tools), [mode, tools]);
    const selectedMeta = getBimToolMeta(mode, selectedTool?.id);
    const activeGroup = groups.find((group) => group.label === selectedGroup);

    useEffect(() => {
        setSelectedGroup(null);
    }, [mode]);

    const choose = (toolId) => {
        onSelectTool(toolId);
        setCatalogOpen(false);
        setSelectedGroup(null);
    };

    const openCatalog = () => {
        setSelectedGroup(null);
        setCatalogOpen(true);
    };

    const goBack = () => {
        if (activeGroup) setSelectedGroup(null);
        else setCatalogOpen(false);
    };

    return (
        <aside className="flex min-h-0 min-w-0 flex-col overflow-hidden border border-zinc-300 bg-white" aria-label="Panel de trabajo BIM" data-bim-task-navigator>
            <header className="flex min-h-14 shrink-0 items-center gap-2 border-b border-zinc-200 px-2.5">
                {catalogOpen ? (
                    <button type="button" onClick={goBack} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-600 active:scale-[.97] hover:bg-zinc-100" aria-label={activeGroup ? 'Volver a los objetivos' : 'Volver a la herramienta'}><ArrowLeft className="size-4" /></button>
                ) : <span className="inline-flex size-8 shrink-0 items-center justify-center text-orange-700"><ListTree className="size-4" /></span>}
                <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold text-zinc-950">{catalogOpen ? activeGroup?.label || `Trabajo en ${modeLabel}` : selectedTool?.label}</p>
                    <p className="truncate text-[10px] leading-4 text-zinc-600">{catalogOpen ? activeGroup ? `${activeGroup.items.length} tareas disponibles según tus capacidades` : 'Elige primero qué necesitas conseguir' : selectedMeta.purpose}</p>
                </div>
                {!catalogOpen ? <button type="button" onClick={openCatalog} className="h-8 shrink-0 rounded-md border border-zinc-300 px-2 text-[11px] font-semibold text-zinc-700 active:scale-[.97] hover:border-orange-500 hover:text-orange-800">Cambiar</button> : null}
                <button type="button" onClick={onClose} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-zinc-500 active:scale-[.97] hover:bg-zinc-100" aria-label="Cerrar panel de trabajo"><X className="size-4" /></button>
            </header>

            {catalogOpen ? (
                <nav className="min-h-0 flex-1 overflow-y-auto custom-scrollbar" aria-label={`Tareas de ${modeLabel}`}>
                    {activeGroup ? (
                        <div className="divide-y divide-zinc-200 border-b border-zinc-200" data-bim-task-level="tasks">
                            {activeGroup.items.map((tool) => {
                                const active = selectedTool?.id === tool.id;
                                return (
                                    <button key={tool.id} type="button" onClick={() => choose(tool.id)} className="flex min-h-16 w-full items-center gap-3 px-3 py-2.5 text-left active:scale-[.99] hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600" aria-current={active ? 'true' : undefined}>
                                        <span className={`inline-flex size-7 shrink-0 items-center justify-center ${active ? 'text-orange-700' : 'text-zinc-400'}`}>{active ? <Check className="size-4" /> : <ChevronRight className="size-3.5" />}</span>
                                        <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-zinc-900">{tool.label}</span><span className="mt-0.5 block text-[10px] leading-4 text-zinc-600">{tool.meta.purpose}</span></span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-200 border-b border-zinc-200" data-bim-task-level="objectives">
                            {groups.map((group) => {
                                const containsActive = group.items.some((tool) => tool.id === selectedTool?.id);
                                return (
                                    <button key={group.label} type="button" onClick={() => setSelectedGroup(group.label)} className="flex min-h-[4.5rem] w-full items-center gap-3 px-3 py-3 text-left active:scale-[.99] hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-orange-600">
                                        <span className={`inline-flex size-7 shrink-0 items-center justify-center ${containsActive ? 'text-orange-700' : 'text-zinc-400'}`}>{containsActive ? <Check className="size-4" /> : <ChevronRight className="size-3.5" />}</span>
                                        <span className="min-w-0 flex-1"><span className="block text-xs font-semibold text-zinc-900">{group.label}</span><span className="mt-1 block text-[10px] leading-4 text-zinc-600">{group.items.length} tareas · {group.items[0]?.meta.purpose}</span></span>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </nav>
            ) : <div className="min-h-0 flex-1 overflow-auto p-2 custom-scrollbar" data-bim-active-task={selectedTool?.id}>{children}</div>}
        </aside>
    );
};

export default BimTaskNavigator;
