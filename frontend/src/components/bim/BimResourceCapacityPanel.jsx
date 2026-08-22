import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, BarChart3, Check, Plus, RefreshCw, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const EMPTY_RESOURCE = { code: '', name: '', resource_type: 'labor', unit: 'personas', capacity_per_day: 8, source_kind: 'bim_native' };

export default function BimResourceCapacityPanel({ projectId, empresaId, api = bimModelsApi }) {
    const [resources, setResources] = useState([]);
    const [baselines, setBaselines] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [baselineId, setBaselineId] = useState('');
    const [histogram, setHistogram] = useState(null);
    const [scenarios, setScenarios] = useState([]);
    const [levelingRevision, setLevelingRevision] = useState('LEV-R1');
    const [levelingReason, setLevelingReason] = useState('');
    const [draft, setDraft] = useState(EMPTY_RESOURCE);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const loadResources = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const [resourceValues, baselineValues] = await Promise.all([
                api.list4dResources(projectId, empresaId),
                api.list4dBaselines(projectId, empresaId),
            ]);
            setResources(resourceValues);
            setBaselines(baselineValues);
            setSelectedId((current) => current || (resourceValues[0]?.id ? String(resourceValues[0].id) : ''));
            setBaselineId((current) => current || (baselineValues[0]?.id ? String(baselineValues[0].id) : ''));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudieron cargar los recursos BIM 4D.');
        }
    }, [api, empresaId, projectId]);

    useEffect(() => { loadResources(); }, [loadResources]);
    useEffect(() => { const onKey = (event) => event.key === 'Escape' && setCreateOpen(false); window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);

    useEffect(() => {
        let active = true;
        if (!selectedId) { setHistogram(null); return undefined; }
        api.get4dResourceHistogram(projectId, Number(selectedId), empresaId)
            .then((value) => { if (active) setHistogram(value); })
            .catch((requestError) => { if (active) setError(requestError?.response?.data?.detail || 'No se pudo calcular la capacidad BIM 4D.'); });
        return () => { active = false; };
    }, [api, empresaId, projectId, selectedId]);

    const loadScenarios = useCallback(async () => {
        if (!projectId || !baselineId) { setScenarios([]); return; }
        try {
            setScenarios(await api.list4dResourceLeveling(projectId, Number(baselineId), empresaId));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudieron cargar las nivelaciones BIM 4D.');
        }
    }, [api, baselineId, empresaId, projectId]);

    useEffect(() => { loadScenarios(); }, [loadScenarios]);

    const createResource = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const created = await api.create4dResource(projectId, { ...draft, capacity_per_day: Number(draft.capacity_per_day) }, empresaId);
            setDraft(EMPTY_RESOURCE);
            await loadResources();
            setSelectedId(String(created.id));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo crear el recurso BIM 4D.');
        } finally { setBusy(false); }
    };

    const createLeveling = async () => {
        try {
            setBusy(true); setError('');
            const created = await api.create4dResourceLeveling(projectId, {
                baseline_id: Number(baselineId),
                revision: levelingRevision.trim(),
                resource_ids: [Number(selectedId)],
                max_shift_days: 365,
            }, empresaId);
            setScenarios((current) => [created, ...current]);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo simular la nivelacion BIM 4D.');
        } finally { setBusy(false); }
    };

    const decideLeveling = async (scenario, decision) => {
        try {
            setBusy(true); setError('');
            const decided = await api.decide4dResourceLeveling(projectId, scenario.id, {
                decision,
                reason: levelingReason.trim(),
                expected_lock_version: scenario.lock_version,
            }, empresaId);
            setScenarios((current) => current.map((item) => (
                item.id === decided.id
                    ? decided
                    : decision === 'approved' && item.status === 'approved'
                        ? { ...item, status: 'superseded' }
                        : item
            )));
            setLevelingReason('');
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo decidir la nivelacion BIM 4D.');
        } finally { setBusy(false); }
    };

    const peak = histogram?.peak_demand || 0;
    const scale = Math.max(peak, histogram?.resource?.capacity_per_day || 1);

    return (
        <section className="rounded border border-slate-200 bg-white" data-bim-resource-capacity>
            <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
                <BarChart3 size={16} className="text-orange-600" />
                <h3 className="text-sm font-semibold text-slate-800">Recursos y capacidad 4D</h3><button type="button" onClick={() => setCreateOpen(true)} className="ml-auto inline-flex h-7 items-center gap-1 bg-orange-600 px-2.5 text-[11px] font-semibold text-white"><Plus size={13}/>Nuevo recurso</button>
            </header>
            <div className="space-y-3 p-3">
                <form className="hidden" onSubmit={createResource}>
                    <input className="min-w-0 rounded border border-slate-300 px-2 py-1.5 text-xs" aria-label="Código de recurso" placeholder="Código" required value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })} />
                    <input className="min-w-0 rounded border border-slate-300 px-2 py-1.5 text-xs" aria-label="Nombre de recurso" placeholder="Nombre" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
                    <select className="rounded border border-slate-300 px-2 py-1.5 text-xs" aria-label="Tipo de recurso" value={draft.resource_type} onChange={(event) => setDraft({ ...draft, resource_type: event.target.value })}>
                        <option value="labor">Mano de obra</option><option value="equipment">Equipo</option><option value="material">Material</option><option value="location">Espacio</option><option value="cost">Costo</option>
                    </select>
                    <div className="flex min-w-0 gap-1">
                        <input className="w-1/2 min-w-0 rounded border border-slate-300 px-2 py-1.5 text-xs" aria-label="Capacidad diaria" type="number" min="0.01" step="0.01" required value={draft.capacity_per_day} onChange={(event) => setDraft({ ...draft, capacity_per_day: event.target.value })} />
                        <input className="w-1/2 min-w-0 rounded border border-slate-300 px-2 py-1.5 text-xs" aria-label="Unidad del recurso" required value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })} />
                    </div>
                    <button className="col-span-2 inline-flex items-center justify-center gap-1 rounded bg-orange-600 px-2 py-1.5 text-xs font-medium text-white disabled:opacity-50" disabled={busy} type="submit"><Plus size={14} />Agregar recurso</button>
                </form>
                <select className="w-full rounded border border-slate-300 px-2 py-1.5 text-xs" aria-label="Recurso para histograma" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>
                    <option value="">Sin recursos</option>
                    {resources.map((resource) => <option key={resource.id} value={resource.id}>{resource.code} · {resource.name}</option>)}
                </select>
                {histogram ? (
                    <div className="space-y-2 text-xs" data-bim-resource-histogram>
                        <div className="grid grid-cols-3 gap-2 text-center">
                            <div><strong className="block text-sm text-slate-800">{histogram.resource.capacity_per_day}</strong>capacidad/día</div>
                            <div><strong className="block text-sm text-slate-800">{peak}</strong>pico</div>
                            <div><strong className={`block text-sm ${histogram.overloaded_days ? 'text-red-600' : 'text-emerald-600'}`}>{histogram.overloaded_days}</strong>sobrecargas</div>
                        </div>
                        <div className="flex h-20 items-end gap-1 overflow-x-auto border-b border-slate-300 pb-1" aria-label="Histograma de demanda diaria">
                            {histogram.points.map((point) => <div key={point.date} className={`w-3 shrink-0 ${point.overloaded ? 'bg-red-500' : 'bg-orange-500'}`} style={{ height: `${Math.max(4, point.demand / scale * 100)}%` }} title={`${point.date}: ${point.demand}/${point.capacity}`} />)}
                        </div>
                        {histogram.overloaded_days > 0 ? <p className="flex items-center gap-1 text-red-700"><AlertTriangle size={14} />Requiere nivelación de recursos.</p> : null}
                    </div>
                ) : null}
                <div className="border-t border-slate-200 pt-3" data-bim-resource-leveling>
                    <div className="grid grid-cols-2 gap-2">
                        <select className="min-w-0 rounded border border-slate-300 px-2 py-1.5 text-xs" aria-label="Linea base para nivelacion" value={baselineId} onChange={(event) => setBaselineId(event.target.value)}>
                            <option value="">Sin linea base</option>
                            {baselines.map((baseline) => <option key={baseline.id} value={baseline.id}>{baseline.revision} · {baseline.name}</option>)}
                        </select>
                        <input className="min-w-0 rounded border border-slate-300 px-2 py-1.5 text-xs" aria-label="Revision de nivelacion" value={levelingRevision} onChange={(event) => setLevelingRevision(event.target.value)} />
                    </div>
                    <button type="button" onClick={createLeveling} disabled={busy || !baselineId || !selectedId || !levelingRevision.trim()} className="mt-2 inline-flex h-8 w-full items-center justify-center gap-1 bg-slate-800 text-xs font-semibold text-white disabled:opacity-40"><RefreshCw size={14} />Simular nivelacion</button>
                    {scenarios.map((scenario) => (
                        <div key={scenario.id} className="mt-2 border border-slate-200 p-2 text-[10px]" data-bim-leveling-scenario={scenario.status}>
                            <div className="flex items-center justify-between"><strong>{scenario.revision} · REV {String(scenario.project_revision).padStart(3, '0')}</strong><span className="uppercase text-slate-500">{scenario.status}</span></div>
                            <div className="mt-1 grid grid-cols-3 gap-1 text-center">
                                <span><strong className="block text-sm text-red-600">{scenario.result.before_overloaded_resource_days}</strong>antes</span>
                                <span><strong className="block text-sm text-emerald-700">{scenario.result.after_overloaded_resource_days}</strong>despues</span>
                                <span><strong className="block text-sm text-slate-800">{scenario.result.shifted_activities}</strong>movidas</span>
                            </div>
                            {scenario.status === 'proposed' ? (
                                <><input className="mt-2 w-full rounded border border-slate-300 px-2 py-1.5 text-xs" aria-label={`Motivo de decision ${scenario.revision}`} value={levelingReason} onChange={(event) => setLevelingReason(event.target.value)} placeholder="Motivo de decision" /><div className="mt-1 grid grid-cols-2 gap-1"><button type="button" onClick={() => decideLeveling(scenario, 'approved')} disabled={busy || levelingReason.trim().length < 5} className="inline-flex h-8 items-center justify-center gap-1 bg-emerald-700 font-semibold text-white disabled:opacity-40"><Check size={13} />Aprobar</button><button type="button" onClick={() => decideLeveling(scenario, 'rejected')} disabled={busy || levelingReason.trim().length < 5} className="inline-flex h-8 items-center justify-center gap-1 border border-red-200 font-semibold text-red-700 disabled:opacity-40"><X size={13} />Rechazar</button></div></>
                            ) : null}
                        </div>
                    ))}
                </div>
                {error ? <p className="text-xs text-red-700" role="alert">{error}</p> : null}
            </div>{createOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-6"><form className="w-full max-w-lg overflow-hidden rounded-xl bg-white shadow-2xl" onSubmit={(event) => { createResource(event); setCreateOpen(false); }} role="dialog" aria-modal="true" aria-labelledby="resource-create-title"><header className="flex min-h-12 items-center border-b border-slate-200 px-5"><div><h3 id="resource-create-title" className="text-sm font-semibold">Nuevo recurso 4D</h3><p className="text-[11px] text-slate-500">Define capacidad diaria y unidad para el histograma.</p></div><button type="button" onClick={() => setCreateOpen(false)} aria-label="Cerrar nuevo recurso" className="ml-auto inline-flex size-8 items-center justify-center text-slate-500"><X size={16}/></button></header><div className="grid grid-cols-2 gap-3 p-5"><input autoFocus className="h-9 border border-slate-300 px-3 text-xs" aria-label="Código de recurso" placeholder="Código" required value={draft.code} onChange={(event) => setDraft({ ...draft, code: event.target.value })}/><input className="h-9 border border-slate-300 px-3 text-xs" aria-label="Nombre de recurso" placeholder="Nombre" required value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })}/><select className="h-9 border border-slate-300 px-2 text-xs" aria-label="Tipo de recurso" value={draft.resource_type} onChange={(event) => setDraft({ ...draft, resource_type: event.target.value })}><option value="labor">Mano de obra</option><option value="equipment">Equipo</option><option value="material">Material</option><option value="location">Espacio</option><option value="cost">Costo</option></select><div className="flex gap-2"><input className="w-1/2 border border-slate-300 px-2 text-xs" aria-label="Capacidad diaria" type="number" min="0.01" step="0.01" required value={draft.capacity_per_day} onChange={(event) => setDraft({ ...draft, capacity_per_day: event.target.value })}/><input className="w-1/2 border border-slate-300 px-2 text-xs" aria-label="Unidad del recurso" required value={draft.unit} onChange={(event) => setDraft({ ...draft, unit: event.target.value })}/></div></div><footer className="flex min-h-12 items-center justify-end gap-2 border-t border-slate-200 px-5"><button type="button" onClick={() => setCreateOpen(false)} className="h-8 px-3 text-xs">Cancelar</button><button type="submit" disabled={busy} className="h-8 bg-orange-600 px-4 text-xs font-semibold text-white">Agregar recurso</button></footer></form></div> : null}
        </section>
    );
}
