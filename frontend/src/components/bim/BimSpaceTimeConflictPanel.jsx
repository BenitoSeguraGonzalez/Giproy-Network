import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Focus, RefreshCw } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const severityClass = { critical: 'text-red-700 bg-red-50', high: 'text-orange-700 bg-orange-50', medium: 'text-amber-700 bg-amber-50' };

export default function BimSpaceTimeConflictPanel({ projectId, empresaId, onSelectGuid }) {
    const [analysis, setAnalysis] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const load = useCallback(async () => {
        if (!projectId) return;
        try { setLoading(true); setError(''); setAnalysis(await bimModelsApi.get4dSpaceTimeConflicts(projectId, empresaId)); }
        catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo analizar conflictos espacio-tiempo.'); }
        finally { setLoading(false); }
    }, [empresaId, projectId]);
    useEffect(() => { load(); }, [load]);

    return (
        <section className="rounded border border-slate-200 bg-white" data-bim-space-time-conflicts>
            <header className="flex items-center justify-between border-b border-slate-200 px-3 py-2">
                <span className="flex items-center gap-2"><AlertTriangle size={16} className="text-orange-600" /><h3 className="text-sm font-semibold text-slate-800">Conflictos espacio-tiempo</h3></span>
                <button className="rounded p-1 text-slate-600 hover:bg-slate-100 disabled:opacity-50" type="button" aria-label="Actualizar conflictos" title="Actualizar conflictos" disabled={loading} onClick={load}><RefreshCw size={15} /></button>
            </header>
            <div className="space-y-2 p-3 text-xs">
                {analysis ? <div className="grid grid-cols-4 gap-1 text-center"><span><strong className="block text-sm">{analysis.counts.total}</strong>Total</span><span className="text-red-700"><strong className="block text-sm">{analysis.counts.critical}</strong>Críticos</span><span className="text-orange-700"><strong className="block text-sm">{analysis.counts.high}</strong>Altos</span><span className="text-amber-700"><strong className="block text-sm">{analysis.counts.medium}</strong>Medios</span></div> : null}
                <div className="max-h-56 space-y-1 overflow-y-auto">
                    {analysis?.conflicts.map((conflict) => (
                        <div className="flex items-center gap-2 rounded border border-slate-200 p-2" key={conflict.conflict_key}>
                            <span className={`rounded px-1.5 py-0.5 font-medium ${severityClass[conflict.severity]}`}>{conflict.severity}</span>
                            <span className="min-w-0 flex-1 truncate" title={conflict.activity_codes.join(' / ')}>{conflict.activity_codes.join(' / ')}</span>
                            {conflict.global_ids[0] ? <button className="rounded p-1 text-slate-600 hover:bg-slate-100" type="button" aria-label="Enfocar conflicto en el modelo" title="Enfocar conflicto" onClick={() => onSelectGuid?.(conflict.global_ids[0])}><Focus size={14} /></button> : null}
                        </div>
                    ))}
                </div>
                {analysis?.counts.total === 0 ? <p className="text-slate-500">Sin conflictos detectados en los componentes programados.</p> : null}
                {error ? <p className="text-red-700" role="alert">{error}</p> : null}
            </div>
        </section>
    );
}
