import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Focus, RefreshCw } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const severityClass = { critical: 'border-l-red-600', high: 'border-l-orange-500', medium: 'border-l-amber-500' };
const severityLabel = { critical: 'Crítico', high: 'Alto', medium: 'Medio' };

export default function BimSpaceTimeConflictPanel({ projectId, empresaId, onSelectGuid, api = bimModelsApi }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const load = useCallback(async () => {
        if (!projectId) return;
        try { setLoading(true); setError(''); setAnalysis(await api.get4dSpaceTimeConflicts(projectId, empresaId)); }
        catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo analizar conflictos espacio-tiempo.'); }
        finally { setLoading(false); }
    }, [api, empresaId, projectId]);
    useEffect(() => { load(); }, [load]);

    return (
        <section className="flex h-full min-h-0 flex-col bg-white" data-bim-space-time-conflicts>
            <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-4">
                <span className="flex items-center gap-2"><AlertTriangle size={16} className="text-orange-600" /><span><h3 className="text-xs font-semibold text-zinc-900">Conflictos espacio-tiempo</h3><p className="text-[10px] text-zinc-500">Solapes de elementos programados</p></span></span>
                <button className="inline-flex size-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:border-orange-400 hover:text-orange-700 disabled:opacity-50" type="button" aria-label="Actualizar conflictos" title="Actualizar conflictos" disabled={loading} onClick={load}><RefreshCw size={14} className={loading ? 'animate-spin motion-reduce:animate-none' : ''} /></button>
            </header>
            {analysis ? <div className="grid shrink-0 grid-cols-4 divide-x divide-zinc-200 border-b border-zinc-200 bg-zinc-50 text-center"><span className="py-2"><strong className="block text-sm tabular-nums text-zinc-950">{analysis.counts.total}</strong><span className="text-[9px] text-zinc-500">Total</span></span><span className="py-2"><strong className="block text-sm tabular-nums text-red-700">{analysis.counts.critical}</strong><span className="text-[9px] text-zinc-500">Críticos</span></span><span className="py-2"><strong className="block text-sm tabular-nums text-orange-700">{analysis.counts.high}</strong><span className="text-[9px] text-zinc-500">Altos</span></span><span className="py-2"><strong className="block text-sm tabular-nums text-amber-700">{analysis.counts.medium}</strong><span className="text-[9px] text-zinc-500">Medios</span></span></div> : null}
            <div className="min-h-0 flex-1 overflow-y-auto text-xs">
                <div className="divide-y divide-zinc-200">
                    {analysis?.conflicts.map((conflict) => (
                        <div className={`border-l-2 bg-white px-4 py-3 ${severityClass[conflict.severity] || 'border-l-zinc-400'}`} key={conflict.conflict_key}>
                            <div className="flex items-start gap-3"><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">{severityLabel[conflict.severity] || conflict.severity}</span><span className="text-[9px] text-zinc-400">{conflict.global_ids?.length || 0} elemento(s)</span></div><p className="mt-1 truncate text-xs font-semibold text-zinc-900" title={conflict.activity_codes.join(' / ')}>{conflict.activity_codes.join(' / ')}</p><p className="mt-1 text-[10px] leading-4 text-zinc-500">Las actividades coinciden espacialmente durante su ejecución.</p></div>
                            {conflict.global_ids[0] ? <button className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:border-orange-400 hover:text-orange-700" type="button" aria-label="Enfocar conflicto en el modelo" title="Enfocar conflicto" onClick={() => onSelectGuid?.(conflict.global_ids[0])}><Focus size={14} /></button> : null}</div>
                        </div>
                    ))}
                </div>
                {analysis?.counts.total === 0 ? <div className="px-4 py-8 text-center"><p className="text-xs font-semibold text-zinc-900">Sin conflictos detectados</p><p className="mt-1 text-[11px] leading-4 text-zinc-500">Los componentes programados no presentan solapes espacio-tiempo.</p></div> : null}
            </div>
            {error ? <p className="shrink-0 border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700" role="alert">{error}</p> : null}
        </section>
    );
}
