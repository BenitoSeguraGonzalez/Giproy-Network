import { Trash2 } from 'lucide-react';

const formatRecycleDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const ProjectRecycleModal = ({
    isOpen,
    projects = [],
    loading = false,
    actionId = null,
    onClose,
    onRefresh,
    onRestore,
    onPurge,
}) => (
    <AnimatePresence>
        {isOpen ? (
            <AppModalShell
                isOpen={true}
                size="lg"
                zIndex="z-[200]"
                panelClassName="rounded-[2.5rem] max-h-[calc(100dvh-4rem)] flex flex-col"
                onClose={onClose}
            >
                <AppModalHeader
                    title="Papelera de proyectos"
                    subtitle="Retención operativa de 7 días antes del borrado definitivo."
                    icon={Trash2}
                    onClose={onClose}
                />
                <div className="min-h-0 overflow-y-auto px-6 py-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-16" role="status" aria-live="polite">
                            <div className="flex flex-col items-center gap-4 text-zinc-500">
                                <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-100 border-t-[#F39200] motion-reduce:animate-none" aria-hidden="true" />
                                <p className="text-xs font-black uppercase tracking-[0.16em]">Cargando papelera...</p>
                            </div>
                        </div>
                    ) : projects.length === 0 ? (
                        <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50/70 px-6 py-12 text-center">
                            <p className="text-xs font-black uppercase tracking-[0.16em] text-zinc-500">Sin proyectos en papelera</p>
                            <p className="mt-3 text-sm font-medium text-zinc-600">Los proyectos eliminados se mostrarán aquí durante 7 días.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {projects.map((project) => {
                                const projectName = project.trash_original_nombre || project.nombre;
                                const projectCode = project.trash_original_codigo || project.codigo;
                                const isBusy = actionId === project.id;
                                return (
                                    <div key={project.id} className="rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
                                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="min-w-0">
                                                <p className="truncate text-[12px] font-black uppercase tracking-tight text-zinc-900">{projectName}</p>
                                                <div className="mt-1 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                    <span>{projectCode || 'Sin código'}</span>
                                                    <span>Eliminado: {formatRecycleDateTime(project.deleted_at)}</span>
                                                    <span>Expira: {formatRecycleDateTime(project.recycle_expires_at)}</span>
                                                </div>
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <button type="button" onClick={() => onRestore(project)} disabled={isBusy} className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.85rem] border border-emerald-100 bg-emerald-50 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 transition hover:border-emerald-300 disabled:opacity-50">
                                                    <RotateCcw className="h-3.5 w-3.5" /> Restaurar
                                                </button>
                                                <button type="button" onClick={() => onPurge(project)} disabled={isBusy} className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.85rem] border border-rose-100 bg-rose-50 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-300 disabled:opacity-50">
                                                    <Trash2 className="h-3.5 w-3.5" /> Borrar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
                <AppModalFooter>
                    <button type="button" onClick={onClose} className="h-11 rounded-[1rem] bg-zinc-50 px-5 text-[10px] font-black uppercase tracking-widest text-zinc-600 transition hover:bg-zinc-100">
                        Cerrar
                    </button>
                    <LiquidButton onClick={onRefresh} disabled={loading} className="!h-11 bg-[#1A1A1A] text-white">
                        <RotateCcw className="mr-2 h-4 w-4" /> Actualizar
                    </LiquidButton>
                </AppModalFooter>
            </AppModalShell>
        ) : null}
    </AnimatePresence>
);

export default ProjectRecycleModal;
