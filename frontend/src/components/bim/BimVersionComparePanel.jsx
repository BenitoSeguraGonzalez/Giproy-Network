import React, { useEffect, useMemo, useState } from 'react';
import { GitCompareArrows } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const changeLabels = {
    added: 'Agregado',
    removed: 'Eliminado',
    geometry: 'Geometría',
    properties: 'Propiedades',
    geometry_and_properties: 'Geometría + propiedades',
    unchanged: 'Sin cambios',
};

const BimVersionComparePanel = ({ projectId, empresaId, models = [], activeVersionId, onSelectGuid }) => {
    const versions = useMemo(
        () => models.flatMap((model) => (model.versions || []).map((version) => ({ ...version, modelName: model.nombre || model.name || model.disciplina }))),
        [models],
    );
    const [baseVersionId, setBaseVersionId] = useState('');
    const [targetVersionId, setTargetVersionId] = useState('');
    const [comparison, setComparison] = useState(null);
    const [filter, setFilter] = useState('changed');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (versions.length < 2) return;
        const target = versions.find((version) => version.id === activeVersionId) || versions[0];
        const base = versions.find((version) => version.id !== target.id);
        setTargetVersionId(String(target.id));
        setBaseVersionId(String(base.id));
    }, [activeVersionId, versions]);

    const compare = async () => {
        if (!baseVersionId || !targetVersionId || baseVersionId === targetVersionId) return;
        try {
            setLoading(true);
            setError('');
            setComparison(await bimModelsApi.compareVersions(projectId, Number(baseVersionId), Number(targetVersionId), empresaId));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo comparar las versiones BIM.');
        } finally {
            setLoading(false);
        }
    };

    if (versions.length < 2) return null;
    const visibleChanges = (comparison?.changes || []).filter((change) => {
        if (filter === 'all') return true;
        if (filter === 'changed') return change.change_type !== 'unchanged';
        return change.change_type === filter;
    });

    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-version-compare>
            <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2.5">
                <GitCompareArrows className="h-4 w-4 text-[#F39200]" aria-hidden="true" />
                <h3 className="text-xs font-semibold text-zinc-900">Comparar versiones</h3>
            </div>
            <div className="space-y-2 p-3">
                <select value={baseVersionId} onChange={(event) => setBaseVersionId(event.target.value)} className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs" aria-label="Versión base">
                    {versions.map((version) => <option key={version.id} value={version.id}>{version.modelName || 'Modelo'} · {version.label || version.version_label}</option>)}
                </select>
                <select value={targetVersionId} onChange={(event) => setTargetVersionId(event.target.value)} className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs" aria-label="Versión objetivo">
                    {versions.map((version) => <option key={version.id} value={version.id}>{version.modelName || 'Modelo'} · {version.label || version.version_label}</option>)}
                </select>
                <button type="button" onClick={compare} disabled={loading || baseVersionId === targetVersionId} className="h-9 w-full rounded-md bg-[#F39200] px-3 text-xs font-semibold text-white disabled:opacity-40">{loading ? 'Comparando...' : 'Comparar'}</button>
                {error ? <p className="text-xs font-medium text-rose-700" role="alert">{error}</p> : null}
                {comparison ? (
                    <>
                        <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                            <span className="rounded bg-emerald-50 px-1 py-1.5 text-emerald-700">+{comparison.summary.added || 0}</span>
                            <span className="rounded bg-rose-50 px-1 py-1.5 text-rose-700">-{comparison.summary.removed || 0}</span>
                            <span className="rounded bg-amber-50 px-1 py-1.5 text-amber-800">Δ{(comparison.summary.geometry || 0) + (comparison.summary.properties || 0) + (comparison.summary.geometry_and_properties || 0)}</span>
                        </div>
                        <select value={filter} onChange={(event) => setFilter(event.target.value)} className="h-8 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs" aria-label="Filtrar tipo de cambio">
                            <option value="changed">Cambios</option><option value="all">Todos</option><option value="added">Agregados</option><option value="removed">Eliminados</option><option value="geometry">Geometría</option><option value="properties">Propiedades</option><option value="geometry_and_properties">Geometría + propiedades</option>
                        </select>
                        <div className="max-h-56 space-y-1 overflow-auto" data-bim-version-change-list>
                            {visibleChanges.map((change, index) => (
                                <button key={`${change.base_guid}-${change.target_guid}-${index}`} type="button" onClick={() => onSelectGuid?.(change.target_guid || change.base_guid)} className="w-full rounded-md border border-zinc-200 px-2 py-2 text-left hover:border-[#F39200]">
                                    <span className="block truncate text-xs font-medium text-zinc-800">{change.name || change.target_guid || change.base_guid}</span>
                                    <span className="mt-0.5 block text-[10px] text-zinc-500">{changeLabels[change.change_type]} · {change.match_strategy === 'semantic_fallback' ? 'fallback semántico' : 'GUID'}</span>
                                </button>
                            ))}
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    );
};

export default BimVersionComparePanel;
