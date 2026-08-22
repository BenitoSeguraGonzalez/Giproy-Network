import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange, GitBranch, LoaderCircle, LocateFixed, Plus, Save, Search, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const STATUS_META = {
    ahead: ['Adelantada', 'bg-emerald-50 text-emerald-700'],
    on_track: ['En línea', 'bg-zinc-100 text-zinc-700'],
    behind: ['Atrasada', 'bg-rose-50 text-rose-700'],
};

const today = () => new Date().toISOString().slice(0, 10);

const BimPlanActualPanel = ({ projectId, empresaId, onOpenViewpoint, api = bimModelsApi, embedded = false }) => {
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
    const [baselineEditorOpen, setBaselineEditorOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const baselineTriggerRef = useRef(null);

    useEffect(() => {
        if (!baselineEditorOpen) return undefined;
        const onKeyDown = (event) => {
            if (event.key === 'Escape') {
                setBaselineEditorOpen(false);
                window.setTimeout(() => baselineTriggerRef.current?.focus(), 0);
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [baselineEditorOpen]);

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
            setBaselineEditorOpen(false);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo crear la línea base 4D.');
        } finally {
            setSaving(false);
        }
    };

    const filteredDeviationItems = useMemo(() => {
        const normalized = query.trim().toLocaleLowerCase('es');
        return (deviation?.items || []).filter((item) => {
            const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
            const matchesQuery = !normalized || `${item.activity_code} ${item.activity_name}`.toLocaleLowerCase('es').includes(normalized);
            return matchesStatus && matchesQuery;
        });
    }, [deviation?.items, query, statusFilter]);

    return (
        <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white" data-bim-plan-actual>
            {!embedded ? (
                <header className="flex h-14 shrink-0 items-center gap-3 border-b border-zinc-200 px-4">
                    <span className="inline-flex size-8 items-center justify-center rounded-md bg-orange-50 text-orange-700"><CalendarRange className="size-4" aria-hidden="true" /></span>
                    <div><h2 className="text-sm font-semibold text-zinc-950">Plan frente a ejecución</h2><p className="text-[11px] text-zinc-600">Lectura 4D a una fecha de corte.</p></div>
                </header>
            ) : null}
            <div className="flex min-h-14 shrink-0 items-center gap-3 border-b border-zinc-200 bg-zinc-50 px-4">
                <label className="min-w-0 flex-1 max-w-md"><span className="sr-only">Línea base 4D</span><select value={baselineId} onChange={(event) => setBaselineId(event.target.value)} className="h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600" aria-label="Línea base 4D"><option value="">Sin línea base</option>{baselines.map((baseline) => <option key={baseline.id} value={baseline.id}>{baseline.revision} · {baseline.name}</option>)}</select></label>
                <label className="flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-xs font-medium text-zinc-700"><span>Fecha de corte</span><input type="date" value={cutoff} onChange={(event) => setCutoff(event.target.value)} className="bg-transparent text-zinc-950 outline-none" aria-label="Fecha de corte plan-real 4D" /></label>
                <button ref={baselineTriggerRef} type="button" onClick={() => setBaselineEditorOpen(true)} className="ml-auto inline-flex h-9 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 text-xs font-semibold text-zinc-800 active:scale-[.97] hover:border-orange-500 hover:text-orange-800"><Plus className="size-3.5" />Crear línea base</button>
                {loading ? <LoaderCircle className="size-4 animate-spin text-zinc-500 motion-reduce:animate-none" aria-label="Cargando plan-real 4D" /> : null}
            </div>

            {error ? <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs font-medium text-rose-800" role="alert">{error}</div> : null}

            <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-16 shrink-0 items-center gap-5 border-b border-zinc-200 px-4">
                    <div className="flex items-center gap-5">
                        {Object.entries(STATUS_META).map(([status, meta]) => (
                            <button key={status} type="button" onClick={() => setStatusFilter(statusFilter === status ? 'all' : status)} className={`text-left ${statusFilter === status ? 'text-orange-800' : 'text-zinc-700'}`} aria-pressed={statusFilter === status}>
                                <strong className="block text-base tabular-nums text-zinc-950">{deviation?.counts?.[status] || 0}</strong><span className="text-[10px] font-medium">{meta[0]}</span>
                            </button>
                        ))}
                    </div>
                    <div className="h-8 w-px bg-zinc-200" />
                    <label className="flex h-9 min-w-64 max-w-sm flex-1 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 focus-within:ring-2 focus-within:ring-orange-600"><Search className="size-3.5 text-zinc-500" aria-hidden="true" /><span className="sr-only">Buscar actividad 4D</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Código o actividad" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-500" /></label>
                    <span className="ml-auto text-[11px] text-zinc-600">{filteredDeviationItems.length} de {deviation?.items?.length || 0} actividades</span>
                </div>

                {deviation ? (
                    <div className="min-h-0 flex-1 overflow-auto" data-bim-deviation-count={deviation.items.length}>
                        <table className="w-full min-w-[58rem] border-collapse text-left text-xs">
                            <thead className="sticky top-0 z-10 bg-zinc-50 text-[10px] font-semibold text-zinc-600"><tr className="border-b border-zinc-200"><th className="w-28 px-4 py-2.5">Estado</th><th className="px-3 py-2.5">Actividad</th><th className="w-52 px-3 py-2.5">Avance plan / real</th><th className="w-24 px-3 py-2.5 text-right">Variación</th><th className="w-24 px-3 py-2.5 text-right">Plazo</th><th className="w-20 px-4 py-2.5 text-right">Modelo</th></tr></thead>
                            <tbody className="divide-y divide-zinc-200">
                                {filteredDeviationItems.map((item) => (
                                    <tr key={item.activity_snapshot_id} className="hover:bg-zinc-50" data-bim-deviation-status={item.status}>
                                        <td className="px-4 py-3"><span className={`inline-flex rounded px-2 py-1 text-[10px] font-semibold ${STATUS_META[item.status][1]}`}>{STATUS_META[item.status][0]}</span></td>
                                        <td className="min-w-0 px-3 py-3"><p className="font-semibold text-zinc-950">{item.activity_code}</p><p className="mt-0.5 truncate text-[11px] text-zinc-600">{item.activity_name}</p></td>
                                        <td className="px-3 py-3"><div className="grid grid-cols-[2.25rem_minmax(0,1fr)_2.25rem] items-center gap-2 text-[10px] tabular-nums"><span className="text-zinc-600">{item.planned_progress_percent}%</span><div className="relative h-2 overflow-hidden rounded-full bg-zinc-200"><span className="absolute inset-y-0 left-0 bg-zinc-500" style={{ width: `${Math.min(100, item.planned_progress_percent)}%` }} /><span className="absolute inset-y-0 left-0 bg-orange-600" style={{ width: `${Math.min(100, item.actual_progress_percent)}%`, opacity: 0.8 }} /></div><strong className="text-right text-zinc-950">{item.actual_progress_percent}%</strong></div></td>
                                        <td className={`px-3 py-3 text-right font-semibold tabular-nums ${item.progress_variance_percent < 0 ? 'text-rose-700' : item.progress_variance_percent > 0 ? 'text-emerald-700' : 'text-zinc-700'}`}>{item.progress_variance_percent > 0 ? '+' : ''}{item.progress_variance_percent}%</td>
                                        <td className="px-3 py-3 text-right font-medium tabular-nums text-zinc-700">{item.schedule_variance_days > 0 ? '+' : ''}{item.schedule_variance_days} d</td>
                                        <td className="px-4 py-3 text-right"><button type="button" onClick={() => onOpenViewpoint?.(item.viewpoints[0])} disabled={!item.viewpoints.length} className="inline-flex size-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-600 active:scale-[.97] hover:border-orange-500 hover:text-orange-700 disabled:opacity-30" title="Enfocar en modelo" aria-label={`Enfocar ${item.activity_code} en modelo`}><LocateFixed className="size-3.5" /></button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {!filteredDeviationItems.length ? <div className="grid min-h-48 place-items-center text-xs text-zinc-600">No hay actividades que coincidan con el filtro.</div> : null}
                    </div>
                ) : !loading ? <div className="grid min-h-0 flex-1 place-items-center"><div className="text-center"><CalendarRange className="mx-auto size-6 text-zinc-400" /><p className="mt-2 text-xs font-semibold text-zinc-900">Selecciona una línea base</p><p className="mt-1 text-[11px] text-zinc-600">La comparación no modifica el Gantt ni el presupuesto.</p></div></div> : null}
            </div>

            {baselineEditorOpen ? (
                <div className="absolute inset-0 z-30 grid place-items-center bg-zinc-950/35 p-6" data-bim-baseline-editor role="dialog" aria-modal="true" aria-labelledby="baseline-editor-title">
                    <div className="flex max-h-[min(46rem,calc(100vh-8rem))] w-full max-w-4xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                        <header className="flex min-h-14 items-center gap-3 border-b border-zinc-200 px-5"><div className="min-w-0 flex-1"><h3 id="baseline-editor-title" className="text-sm font-semibold text-zinc-950">Crear línea base 4D</h3><p className="mt-0.5 text-[11px] text-zinc-600">Congela actividades y dependencias para futuras comparaciones.</p></div><button type="button" onClick={() => setBaselineEditorOpen(false)} className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100" aria-label="Cerrar creación de línea base"><X className="size-4" /></button></header>
                        <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.1fr)_minmax(18rem,.9fr)] divide-x divide-zinc-200 overflow-hidden">
                            <div className="min-h-0 overflow-y-auto p-5"><div className="grid grid-cols-2 gap-3"><label className="text-[11px] font-semibold text-zinc-800">Nombre<input autoFocus value={name} onChange={(event) => setName(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" placeholder="Plan contractual" aria-label="Nombre de línea base 4D" /></label><label className="text-[11px] font-semibold text-zinc-800">Revisión<input value={revision} onChange={(event) => setRevision(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" placeholder="BL-001" aria-label="Revisión de línea base 4D" /></label></div><p className="mt-5 text-xs font-semibold text-zinc-950">Actividades incluidas <span className="font-normal text-zinc-500">({selectedIds.length}/{activities.length})</span></p><div className="mt-2 divide-y divide-zinc-200 border-y border-zinc-200" aria-label="Actividades de línea base 4D">{activities.map((activity) => <label key={activity.id} className="flex min-h-10 items-center gap-3 px-1 text-[11px] text-zinc-700"><input type="checkbox" checked={selectedSet.has(activity.id)} onChange={() => toggleActivity(activity.id)} className="accent-orange-600" /><span className="min-w-0 truncate"><strong>{activity.activity_code}</strong> · {activity.activity_name}</span></label>)}</div></div>
                            <div className="min-h-0 overflow-y-auto bg-zinc-50 p-5"><p className="text-xs font-semibold text-zinc-950">Dependencias</p><p className="mt-1 text-[11px] leading-4 text-zinc-600">Añade únicamente relaciones que pertenezcan a esta referencia.</p>{activities.length > 1 ? <div className="mt-4 space-y-2"><select value={dependency.predecessor} onChange={(event) => setDependency((current) => ({ ...current, predecessor: event.target.value }))} className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs" aria-label="Predecesora 4D">{activities.map((item) => <option key={item.id} value={item.id}>Predecesora · {item.activity_code}</option>)}</select><select value={dependency.successor} onChange={(event) => setDependency((current) => ({ ...current, successor: event.target.value }))} className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs" aria-label="Sucesora 4D">{activities.map((item) => <option key={item.id} value={item.id}>Sucesora · {item.activity_code}</option>)}</select><div className="grid grid-cols-[1fr_1fr_auto] gap-2"><select value={dependency.type} onChange={(event) => setDependency((current) => ({ ...current, type: event.target.value }))} className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-xs" aria-label="Tipo de dependencia 4D">{['FS', 'SS', 'FF', 'SF'].map((type) => <option key={type}>{type}</option>)}</select><input type="number" value={dependency.lag} onChange={(event) => setDependency((current) => ({ ...current, lag: event.target.value }))} className="h-9 min-w-0 rounded-md border border-zinc-300 px-2 text-xs" aria-label="Lag en días 4D" /><button type="button" onClick={addDependency} className="inline-flex size-9 items-center justify-center rounded-md bg-zinc-900 text-white active:scale-[.97]" title="Agregar dependencia" aria-label="Agregar dependencia 4D"><GitBranch className="size-3.5" /></button></div></div> : null}<div className="mt-4 divide-y divide-zinc-200 border-y border-zinc-200">{dependencies.map((item, index) => <div key={`${item.predecessor_activity_id}-${item.successor_activity_id}-${item.dependency_type}`} className="flex min-h-10 items-center gap-2 py-2 text-[10px] text-zinc-700"><span className="min-w-0 flex-1">{activities.find((entry) => entry.id === item.predecessor_activity_id)?.activity_code} → {activities.find((entry) => entry.id === item.successor_activity_id)?.activity_code} · {item.dependency_type} · {item.lag_days} d</span><button type="button" onClick={() => setDependencies((current) => current.filter((_, itemIndex) => itemIndex !== index))} aria-label="Quitar dependencia 4D" title="Quitar dependencia" className="inline-flex size-7 items-center justify-center rounded-md hover:bg-zinc-200"><X className="size-3.5" /></button></div>)}</div></div>
                        </div>
                        <footer className="flex min-h-14 items-center justify-end gap-2 border-t border-zinc-200 px-5"><button type="button" onClick={() => setBaselineEditorOpen(false)} className="h-9 px-3 text-xs font-semibold text-zinc-600">Cancelar</button><button type="button" onClick={createBaseline} disabled={saving || name.trim().length < 2 || !revision.trim() || !selectedIds.length} className="inline-flex h-9 items-center gap-2 rounded-md bg-orange-600 px-4 text-xs font-semibold text-white active:scale-[.97] hover:bg-orange-700 disabled:opacity-40"><Save className="size-3.5" />{saving ? 'Guardando…' : 'Guardar línea base'}</button></footer>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

export default BimPlanActualPanel;
