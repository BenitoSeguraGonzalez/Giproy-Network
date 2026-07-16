import React, { useEffect, useState } from 'react';
import { Boxes, Focus, LoaderCircle, Map, Plus, Save, TestTubeDiagonal } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const fieldClass = 'h-8 min-w-0 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100';

const BimWorkfrontScenarioPanel = ({ projectId, empresaId, versionId, element, onSelectGuid, api = bimModelsApi }) => {
    const [areas, setAreas] = useState([]);
    const [components, setComponents] = useState([]);
    const [scenarios, setScenarios] = useState([]);
    const [activities, setActivities] = useState([]);
    const [baselines, setBaselines] = useState([]);
    const [areaDraft, setAreaDraft] = useState({ code: '', name: '' });
    const [componentDraft, setComponentDraft] = useState({ area: '', activity: '', code: '', name: '' });
    const [scenarioDraft, setScenarioDraft] = useState({ baseline: '', activity: '', offset: '0', name: '', revision: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        if (!projectId) return undefined;
        setLoading(true);
        Promise.all([
            api.list4dWorkAreas(projectId, empresaId),
            api.list4dComponents(projectId, null, empresaId),
            api.list4dScenarios(projectId, empresaId),
            api.list4dActivities(projectId, empresaId),
            api.list4dBaselines(projectId, empresaId),
        ]).then(([nextAreas, nextComponents, nextScenarios, nextActivities, nextBaselines]) => {
            if (cancelled) return;
            setAreas(nextAreas); setComponents(nextComponents); setScenarios(nextScenarios); setActivities(nextActivities); setBaselines(nextBaselines);
            setComponentDraft((current) => ({ ...current, area: current.area || String(nextAreas[0]?.id || ''), activity: current.activity || String(nextActivities[0]?.id || '') }));
            setScenarioDraft((current) => ({ ...current, baseline: current.baseline || String(nextBaselines[0]?.id || ''), activity: current.activity || String(nextActivities[0]?.id || '') }));
        }).catch((requestError) => { if (!cancelled) setError(requestError?.response?.data?.detail || 'No se pudo cargar frentes y escenarios.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [api, empresaId, projectId]);

    const createArea = async () => {
        setSaving('area'); setError('');
        try {
            const created = await api.create4dWorkArea(projectId, { code: areaDraft.code.trim(), name: areaDraft.name.trim(), description: null }, empresaId);
            setAreas((current) => [...current, created]);
            setComponentDraft((current) => ({ ...current, area: String(created.id) }));
            setAreaDraft({ code: '', name: '' });
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear el frente BIM.'); }
        finally { setSaving(''); }
    };

    const createComponent = async () => {
        setSaving('component'); setError('');
        try {
            const created = await api.create4dComponent(projectId, { work_area_id: Number(componentDraft.area), version_id: Number(versionId), code: componentDraft.code.trim(), name: componentDraft.name.trim(), element_ids: [element.id], activity_snapshot_ids: [Number(componentDraft.activity)] }, empresaId);
            setComponents((current) => [...current, created]);
            setComponentDraft((current) => ({ ...current, code: '', name: '' }));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear el componente construible.'); }
        finally { setSaving(''); }
    };

    const createScenario = async () => {
        setSaving('scenario'); setError('');
        try {
            const created = await api.create4dScenario(projectId, { baseline_id: Number(scenarioDraft.baseline), name: scenarioDraft.name.trim(), revision: scenarioDraft.revision.trim(), shifts: [{ activity_snapshot_id: Number(scenarioDraft.activity), offset_days: Number(scenarioDraft.offset) }] }, empresaId);
            setScenarios((current) => [created, ...current]);
            setScenarioDraft((current) => ({ ...current, name: '', revision: '' }));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear el escenario what-if.'); }
        finally { setSaving(''); }
    };

    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-workfront-scenarios>
            <header className="flex h-10 items-center gap-2 border-b border-zinc-200 px-3">
                <Map className="h-4 w-4 text-[#F39200]" aria-hidden="true" />
                <h3 className="text-xs font-semibold text-zinc-900">Frentes y escenarios</h3>
                {loading ? <LoaderCircle className="ml-auto h-3.5 w-3.5 animate-spin text-zinc-400" aria-label="Cargando frentes 4D" /> : <span className="ml-auto text-[10px] font-semibold text-zinc-500">{areas.length} / {components.length} / {scenarios.length}</span>}
            </header>
            <div className="space-y-2 p-3">
                <details className="rounded-md border border-zinc-200" data-bim-work-area-editor>
                    <summary className="flex h-9 cursor-pointer list-none items-center gap-2 px-2.5 text-xs font-semibold text-zinc-700"><Plus className="h-3.5 w-3.5 text-[#F39200]" />Nuevo frente</summary>
                    <div className="grid grid-cols-[82px_minmax(0,1fr)_32px] gap-1.5 border-t border-zinc-200 p-2">
                        <input value={areaDraft.code} onChange={(event) => setAreaDraft((current) => ({ ...current, code: event.target.value }))} className={fieldClass} placeholder="Código" aria-label="Código de frente BIM" />
                        <input value={areaDraft.name} onChange={(event) => setAreaDraft((current) => ({ ...current, name: event.target.value }))} className={fieldClass} placeholder="Nombre del frente" aria-label="Nombre de frente BIM" />
                        <button type="button" onClick={createArea} disabled={saving || !areaDraft.code.trim() || areaDraft.name.trim().length < 2} className="inline-flex h-8 w-8 items-center justify-center rounded bg-[#F39200] text-white disabled:opacity-40" title="Guardar frente" aria-label="Guardar frente BIM">{saving === 'area' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}</button>
                    </div>
                </details>

                <details className="rounded-md border border-zinc-200" data-bim-component-editor>
                    <summary className="flex h-9 cursor-pointer list-none items-center gap-2 px-2.5 text-xs font-semibold text-zinc-700"><Boxes className="h-3.5 w-3.5 text-[#F39200]" />Componente construible</summary>
                    <div className="space-y-1.5 border-t border-zinc-200 p-2">
                        <div className="grid grid-cols-2 gap-1.5"><select value={componentDraft.area} onChange={(event) => setComponentDraft((current) => ({ ...current, area: event.target.value }))} className={fieldClass} aria-label="Frente del componente BIM">{areas.map((area) => <option key={area.id} value={area.id}>{area.code} · {area.name}</option>)}</select><select value={componentDraft.activity} onChange={(event) => setComponentDraft((current) => ({ ...current, activity: event.target.value }))} className={fieldClass} aria-label="Actividad del componente BIM">{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.activity_code}</option>)}</select></div>
                        <div className="grid grid-cols-[82px_minmax(0,1fr)_32px] gap-1.5"><input value={componentDraft.code} onChange={(event) => setComponentDraft((current) => ({ ...current, code: event.target.value }))} className={fieldClass} placeholder="Código" aria-label="Código de componente BIM" /><input value={componentDraft.name} onChange={(event) => setComponentDraft((current) => ({ ...current, name: event.target.value }))} className={fieldClass} placeholder={element ? element.nombre || element.global_id : 'Selecciona un elemento'} aria-label="Nombre de componente BIM" /><button type="button" onClick={createComponent} disabled={saving || !element?.id || !versionId || !componentDraft.area || !componentDraft.activity || !componentDraft.code.trim() || componentDraft.name.trim().length < 2} className="inline-flex h-8 w-8 items-center justify-center rounded bg-[#F39200] text-white disabled:opacity-40" title="Guardar componente" aria-label="Guardar componente construible">{saving === 'component' ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}</button></div>
                    </div>
                </details>

                {components.length ? <div className="max-h-24 overflow-auto">{components.map((component) => <div key={component.id} className="flex h-8 items-center gap-2 border-b border-zinc-100 text-[10px]"><Boxes className="h-3 w-3 text-zinc-400" /><span className="min-w-0 flex-1 truncate font-semibold text-zinc-700">{component.code} · {component.name}</span><button type="button" onClick={() => onSelectGuid?.(component.global_ids[0])} disabled={!component.global_ids.length} className="inline-flex h-7 w-7 items-center justify-center text-zinc-500 hover:text-[#F39200] disabled:opacity-25" title="Enfocar componente" aria-label={`Enfocar componente ${component.code}`}><Focus className="h-3.5 w-3.5" /></button></div>)}</div> : null}

                <details className="rounded-md border border-zinc-200" data-bim-scenario-editor>
                    <summary className="flex h-9 cursor-pointer list-none items-center gap-2 px-2.5 text-xs font-semibold text-zinc-700"><TestTubeDiagonal className="h-3.5 w-3.5 text-[#F39200]" />Escenario what-if</summary>
                    <div className="space-y-1.5 border-t border-zinc-200 p-2">
                        <div className="grid grid-cols-2 gap-1.5"><select value={scenarioDraft.baseline} onChange={(event) => setScenarioDraft((current) => ({ ...current, baseline: event.target.value }))} className={fieldClass} aria-label="Baseline del escenario 4D">{baselines.map((baseline) => <option key={baseline.id} value={baseline.id}>{baseline.revision}</option>)}</select><select value={scenarioDraft.activity} onChange={(event) => setScenarioDraft((current) => ({ ...current, activity: event.target.value }))} className={fieldClass} aria-label="Actividad del escenario 4D">{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.activity_code}</option>)}</select></div>
                        <div className="grid grid-cols-[minmax(0,1fr)_78px_58px] gap-1.5"><input value={scenarioDraft.name} onChange={(event) => setScenarioDraft((current) => ({ ...current, name: event.target.value }))} className={fieldClass} placeholder="Nombre" aria-label="Nombre de escenario 4D" /><input value={scenarioDraft.revision} onChange={(event) => setScenarioDraft((current) => ({ ...current, revision: event.target.value }))} className={fieldClass} placeholder="Revisión" aria-label="Revisión de escenario 4D" /><input type="number" value={scenarioDraft.offset} onChange={(event) => setScenarioDraft((current) => ({ ...current, offset: event.target.value }))} className={fieldClass} aria-label="Desplazamiento del escenario en días" /></div>
                        <button type="button" onClick={createScenario} disabled={saving || !scenarioDraft.baseline || !scenarioDraft.activity || scenarioDraft.name.trim().length < 2 || !scenarioDraft.revision.trim()} className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded bg-zinc-800 text-xs font-semibold text-white disabled:opacity-40"><TestTubeDiagonal className="h-3.5 w-3.5" />Calcular escenario</button>
                    </div>
                </details>

                {scenarios[0] ? <div className="grid grid-cols-3 gap-1 rounded-md bg-zinc-50 p-2 text-center" data-bim-scenario-result={scenarios[0].id}><div><p className="text-[9px] text-zinc-500">Duración</p><p className="text-xs font-semibold text-zinc-800">{scenarios[0].metrics.scenario_span_days}d</p></div><div><p className="text-[9px] text-zinc-500">Variación</p><p className="text-xs font-semibold text-zinc-800">{scenarios[0].metrics.duration_delta_days > 0 ? '+' : ''}{scenarios[0].metrics.duration_delta_days}d</p></div><div><p className="text-[9px] text-zinc-500">Conflictos</p><p className={`text-xs font-semibold ${scenarios[0].metrics.dependency_violations ? 'text-rose-700' : 'text-emerald-700'}`}>{scenarios[0].metrics.dependency_violations}</p></div></div> : null}
                {error ? <p className="text-xs font-medium text-rose-700" role="alert">{error}</p> : null}
            </div>
        </section>
    );
};

export default BimWorkfrontScenarioPanel;
