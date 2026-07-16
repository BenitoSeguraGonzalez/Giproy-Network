import React, { useEffect, useMemo, useState } from 'react';
import { CalendarRange, GitBranch, LoaderCircle, LocateFixed, Plus, Save, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const STATUS_META = {
    ahead: ['Adelantada', 'bg-emerald-50 text-emerald-700'],
    on_track: ['En línea', 'bg-zinc-100 text-zinc-700'],
    behind: ['Atrasada', 'bg-rose-50 text-rose-700'],
};

const today = () => new Date().toISOString().slice(0, 10);

const BimPlanActualPanel = ({ projectId, empresaId, onOpenViewpoint, api = bimModelsApi }) => {
    const [activities, setActivities] = useState([]);
    const [baselines, setBaselines] = useState([]);
    const [baselineId, setBaselineId] = useState('');
    const [selectedIds, setSelectedIds] = useState([]);
    const [dependencies, setDependencies] = useState([]);
    const [dependency, setDependency] = useState({ predecessor: '', successor: '', type: 'FS', lag: '0' });
    const [name, setName] = useState('');
    const [revision, setRevision] = useState('');
    const [cutoff, setCutoff] = useState(today);
    const [deviation, setDeviation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        if (!projectId) return undefined;
        setLoading(true);
        Promise.all([api.list4dActivities(projectId, empresaId), api.list4dBaselines(projectId, empresaId)])
            .then(([nextActivities, nextBaselines]) => {
                if (cancelled) return;
                setActivities(nextActivities);
                setBaselines(nextBaselines);
                setSelectedIds(nextActivities.map((activity) => activity.id));
                setDependency((current) => ({ ...current, predecessor: String(nextActivities[0]?.id || ''), successor: String(nextActivities[1]?.id || '') }));
                setBaselineId(String(nextBaselines[0]?.id || ''));
            })
            .catch((requestError) => { if (!cancelled) setError(requestError?.response?.data?.detail || 'No se pudo cargar plan-real 4D.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [api, empresaId, projectId]);

    useEffect(() => {
        let cancelled = false;
        if (!baselineId || !cutoff) {
            setDeviation(null);
            return undefined;
        }
        setLoading(true);
        api.get4dDeviation(projectId, Number(baselineId), `${cutoff}T12:00:00Z`, empresaId)
            .then((result) => { if (!cancelled) setDeviation(result); })
            .catch((requestError) => { if (!cancelled) setError(requestError?.response?.data?.detail || 'No se pudo calcular la desviación 4D.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [api, baselineId, cutoff, empresaId, projectId]);

    const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
    const toggleActivity = (activityId) => setSelectedIds((current) => current.includes(activityId) ? current.filter((id) => id !== activityId) : [...current, activityId]);

    const addDependency = () => {
        const predecessor = Number(dependency.predecessor);
        const successor = Number(dependency.successor);
        if (!predecessor || !successor || predecessor === successor) return;
        const next = { predecessor_activity_id: predecessor, successor_activity_id: successor, dependency_type: dependency.type, lag_days: Number(dependency.lag || 0) };
        if (dependencies.some((item) => item.predecessor_activity_id === predecessor && item.successor_activity_id === successor && item.dependency_type === dependency.type)) return;
        setDependencies((current) => [...current, next]);
    };

    const createBaseline = async () => {
        setSaving(true);
        setError('');
        try {
            const created = await api.create4dBaseline(projectId, { name: name.trim(), revision: revision.trim(), activity_snapshot_ids: selectedIds, dependencies }, empresaId);
            setBaselines((current) => [created, ...current]);
            setBaselineId(String(created.id));
            setName('');
            setRevision('');
            setDependencies([]);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo crear la línea base 4D.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-plan-actual>
            <header className="flex h-10 items-center gap-2 border-b border-zinc-200 px-3">
                <CalendarRange className="h-4 w-4 text-[#F39200]" aria-hidden="true" />
                <h3 className="text-xs font-semibold text-zinc-900">Plan / real 4D</h3>
                {loading ? <LoaderCircle className="ml-auto h-3.5 w-3.5 animate-spin text-zinc-400" aria-label="Cargando plan-real 4D" /> : null}
            </header>
            <div className="space-y-2.5 p-3">
                <details className="rounded-md border border-zinc-200" data-bim-baseline-editor>
                    <summary className="flex h-9 cursor-pointer list-none items-center gap-2 px-2.5 text-xs font-semibold text-zinc-700">
                        <Plus className="h-3.5 w-3.5 text-[#F39200]" aria-hidden="true" />Nueva línea base
                    </summary>
                    <div className="space-y-2 border-t border-zinc-200 p-2.5">
                        <div className="grid grid-cols-2 gap-2">
                            <input value={name} onChange={(event) => setName(event.target.value)} className="h-8 min-w-0 rounded-md border border-zinc-300 px-2 text-xs" placeholder="Nombre" aria-label="Nombre de línea base 4D" />
                            <input value={revision} onChange={(event) => setRevision(event.target.value)} className="h-8 min-w-0 rounded-md border border-zinc-300 px-2 text-xs" placeholder="Revisión" aria-label="Revisión de línea base 4D" />
                        </div>
                        <div className="max-h-28 overflow-auto rounded-md bg-zinc-50 p-1.5" aria-label="Actividades de línea base 4D">
                            {activities.map((activity) => (
                                <label key={activity.id} className="flex min-h-7 items-center gap-2 px-1 text-[11px] text-zinc-700">
                                    <input type="checkbox" checked={selectedSet.has(activity.id)} onChange={() => toggleActivity(activity.id)} className="accent-[#F39200]" />
                                    <span className="truncate"><strong>{activity.activity_code}</strong> · {activity.activity_name}</span>
                                </label>
                            ))}
                        </div>
                        {activities.length > 1 ? (
                            <div className="grid grid-cols-[1fr_1fr_52px_54px_32px] gap-1">
                                <select value={dependency.predecessor} onChange={(event) => setDependency((current) => ({ ...current, predecessor: event.target.value }))} className="h-8 min-w-0 rounded border border-zinc-300 px-1 text-[10px]" aria-label="Predecesora 4D">{activities.map((item) => <option key={item.id} value={item.id}>{item.activity_code}</option>)}</select>
                                <select value={dependency.successor} onChange={(event) => setDependency((current) => ({ ...current, successor: event.target.value }))} className="h-8 min-w-0 rounded border border-zinc-300 px-1 text-[10px]" aria-label="Sucesora 4D">{activities.map((item) => <option key={item.id} value={item.id}>{item.activity_code}</option>)}</select>
                                <select value={dependency.type} onChange={(event) => setDependency((current) => ({ ...current, type: event.target.value }))} className="h-8 rounded border border-zinc-300 px-1 text-[10px]" aria-label="Tipo de dependencia 4D">{['FS', 'SS', 'FF', 'SF'].map((type) => <option key={type}>{type}</option>)}</select>
                                <input type="number" value={dependency.lag} onChange={(event) => setDependency((current) => ({ ...current, lag: event.target.value }))} className="h-8 min-w-0 rounded border border-zinc-300 px-1 text-[10px]" aria-label="Lag en días 4D" />
                                <button type="button" onClick={addDependency} className="inline-flex h-8 w-8 items-center justify-center rounded bg-zinc-800 text-white" title="Agregar dependencia" aria-label="Agregar dependencia 4D"><GitBranch className="h-3.5 w-3.5" /></button>
                            </div>
                        ) : null}
                        {dependencies.map((item, index) => <div key={`${item.predecessor_activity_id}-${item.successor_activity_id}-${item.dependency_type}`} className="flex h-7 items-center gap-1.5 bg-zinc-50 px-2 text-[10px] text-zinc-600"><span className="flex-1">{activities.find((entry) => entry.id === item.predecessor_activity_id)?.activity_code} → {activities.find((entry) => entry.id === item.successor_activity_id)?.activity_code} · {item.dependency_type} · {item.lag_days}d</span><button type="button" onClick={() => setDependencies((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Quitar dependencia 4D" title="Quitar dependencia"><X className="h-3.5 w-3.5" /></button></div>)}
                        <button type="button" onClick={createBaseline} disabled={saving || name.trim().length < 2 || !revision.trim() || !selectedIds.length} className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-md bg-[#F39200] px-3 text-xs font-semibold text-white hover:bg-[#dc8300] disabled:cursor-not-allowed disabled:opacity-40"><Save className="h-3.5 w-3.5" />Guardar línea base</button>
                    </div>
                </details>

                <div className="flex gap-2">
                    <select value={baselineId} onChange={(event) => setBaselineId(event.target.value)} className="h-8 min-w-0 flex-1 rounded-md border border-zinc-300 bg-white px-2 text-xs" aria-label="Línea base 4D"><option value="">Sin línea base</option>{baselines.map((baseline) => <option key={baseline.id} value={baseline.id}>{baseline.revision} · {baseline.name}</option>)}</select>
                    <input type="date" value={cutoff} onChange={(event) => setCutoff(event.target.value)} className="h-8 w-32 rounded-md border border-zinc-300 px-2 text-xs" aria-label="Fecha de corte plan-real 4D" />
                </div>

                {deviation ? (
                    <div className="space-y-1.5" data-bim-deviation-count={deviation.items.length}>
                        <div className="flex flex-wrap gap-1">{Object.entries(deviation.counts).map(([status, count]) => count ? <span key={status} className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${STATUS_META[status][1]}`}>{STATUS_META[status][0]} {count}</span> : null)}</div>
                        <div className="max-h-52 overflow-auto">
                            {deviation.items.map((item) => (
                                <div key={item.activity_snapshot_id} className="grid min-h-11 grid-cols-[minmax(0,1fr)_42px_42px_38px_30px] items-center gap-1 border-b border-zinc-100 text-[10px]" data-bim-deviation-status={item.status}>
                                    <div className="min-w-0"><p className="truncate font-semibold text-zinc-800">{item.activity_code} · {item.activity_name}</p><p className="text-zinc-500">Δ {item.progress_variance_percent > 0 ? '+' : ''}{item.progress_variance_percent}% · {item.schedule_variance_days}d</p></div>
                                    <span className="text-right text-zinc-500" title="Plan">{item.planned_progress_percent}%</span>
                                    <span className="text-right font-semibold text-zinc-800" title="Real">{item.actual_progress_percent}%</span>
                                    <span className={`rounded px-1 py-0.5 text-center font-semibold ${STATUS_META[item.status][1]}`}>{item.status === 'ahead' ? '↑' : item.status === 'behind' ? '↓' : '='}</span>
                                    <button type="button" onClick={() => onOpenViewpoint?.(item.viewpoints[0])} disabled={!item.viewpoints.length} className="inline-flex h-7 w-7 items-center justify-center rounded text-zinc-500 hover:bg-orange-50 hover:text-[#F39200] disabled:opacity-25" title="Enfocar en modelo" aria-label={`Enfocar ${item.activity_code} en modelo`}><LocateFixed className="h-3.5 w-3.5" /></button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : !loading ? <p className="py-2 text-center text-xs text-zinc-500">Sin comparación plan-real.</p> : null}
                {error ? <p className="text-xs font-medium text-rose-700" role="alert">{error}</p> : null}
            </div>
        </section>
    );
};

export default BimPlanActualPanel;
