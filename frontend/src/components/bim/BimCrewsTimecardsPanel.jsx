import { useCallback, useEffect, useMemo, useState } from 'react';
import { Clock3, RefreshCw, UsersRound } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const EMPTY_CREW = { code: '', name: '', trade: '', member_count: '', note: '' };
const EMPTY_TIMECARD = { crew_id: '', activity_snapshot_id: '', work_area_id: '', work_date: '', regular_hours: '8', overtime_hours: '0', installed_quantity: '0', installed_unit: 'ud', note: '' };

export default function BimCrewsTimecardsPanel({ projectId, empresaId, api = bimModelsApi }) {
    const [mode, setMode] = useState('timecards');
    const [crews, setCrews] = useState([]);
    const [activities, setActivities] = useState([]);
    const [areas, setAreas] = useState([]);
    const [timecards, setTimecards] = useState([]);
    const [crewDraft, setCrewDraft] = useState(EMPTY_CREW);
    const [timecardDraft, setTimecardDraft] = useState(EMPTY_TIMECARD);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const [crewValues, activityValues, areaValues, timecardValues] = await Promise.all([
                api.list4dCrews(projectId, false, empresaId),
                api.list4dActivities(projectId, empresaId),
                api.list4dWorkAreas(projectId, empresaId),
                api.list4dTimecards(projectId, null, empresaId),
            ]);
            setCrews(crewValues); setActivities(activityValues); setAreas(areaValues); setTimecards(timecardValues);
            setTimecardDraft((current) => ({ ...current, crew_id: current.crew_id || String(crewValues.find((item) => item.active)?.id || '') }));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo cargar el control de cuadrillas.');
        }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);

    const totals = useMemo(() => timecards.reduce((value, item) => ({
        hours: value.hours + item.total_hours,
        overtime: value.overtime + item.overtime_hours,
    }), { hours: 0, overtime: 0 }), [timecards]);

    const submitCrew = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const created = await api.create4dCrew(projectId, { ...crewDraft, member_count: Number(crewDraft.member_count), active: true }, empresaId);
            setCrews((current) => [...current, created]);
            setTimecardDraft((current) => ({ ...current, crew_id: current.crew_id || String(created.id) }));
            setCrewDraft(EMPTY_CREW);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear la cuadrilla.'); }
        finally { setBusy(false); }
    };

    const submitTimecard = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const created = await api.create4dTimecard(projectId, {
                crew_id: Number(timecardDraft.crew_id), activity_snapshot_id: Number(timecardDraft.activity_snapshot_id),
                work_area_id: timecardDraft.work_area_id ? Number(timecardDraft.work_area_id) : null,
                work_date: timecardDraft.work_date, regular_hours: Number(timecardDraft.regular_hours),
                overtime_hours: Number(timecardDraft.overtime_hours), installed_quantity: Number(timecardDraft.installed_quantity),
                installed_unit: timecardDraft.installed_unit, note: timecardDraft.note,
            }, empresaId);
            setTimecards((current) => [created, ...current]);
            setTimecardDraft((current) => ({ ...EMPTY_TIMECARD, crew_id: current.crew_id, installed_unit: current.installed_unit }));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo registrar el parte.'); }
        finally { setBusy(false); }
    };

    return <section className="bim-responsive-container flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white" data-bim-crews-timecards>
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-3">
            <div className="flex items-center gap-2"><UsersRound size={16} className="text-[#F39200]" /><div><h3 className="text-xs font-semibold text-zinc-900">Cuadrillas y partes de horas</h3><p className="text-[10px] text-zinc-500">Directorio operativo BIM, sin datos personales ni nómina</p></div></div>
            <div className="flex items-center gap-2">
                <div className="flex h-8 border border-zinc-200 bg-zinc-50 p-0.5" role="tablist" aria-label="Vista de cuadrillas">
                    <button type="button" role="tab" aria-selected={mode === 'timecards'} onClick={() => setMode('timecards')} className={`px-3 text-[10px] font-semibold ${mode === 'timecards' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>Partes</button>
                    <button type="button" role="tab" aria-selected={mode === 'directory'} onClick={() => setMode('directory')} className={`px-3 text-[10px] font-semibold ${mode === 'directory' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}>Directorio</button>
                </div>
                <button type="button" onClick={load} title="Actualizar" aria-label="Actualizar cuadrillas" className="grid h-8 w-8 place-items-center border border-zinc-200 text-zinc-600"><RefreshCw size={14} /></button>
            </div>
        </header>
        <div className="bim-responsive-workbench flex-1" style={{ '--bim-workbench-sidebar': '390px' }}>
            <aside className="overflow-y-auto border-r border-zinc-200 p-3">
                {mode === 'directory' ? <form className="space-y-2" onSubmit={submitCrew} data-bim-crew-form>
                    <h4 className="text-xs font-semibold text-zinc-900">Nueva cuadrilla BIM</h4>
                    <div className="grid grid-cols-[120px_1fr] gap-2"><input required maxLength={80} aria-label="Código de cuadrilla" placeholder="Código" value={crewDraft.code} onChange={(event) => setCrewDraft({ ...crewDraft, code: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><input required maxLength={180} aria-label="Nombre de cuadrilla" placeholder="Nombre" value={crewDraft.name} onChange={(event) => setCrewDraft({ ...crewDraft, name: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /></div>
                    <div className="grid grid-cols-[1fr_110px] gap-2"><input required maxLength={120} aria-label="Especialidad de cuadrilla" placeholder="Especialidad" value={crewDraft.trade} onChange={(event) => setCrewDraft({ ...crewDraft, trade: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><input required type="number" min="1" max="500" aria-label="Tamaño de cuadrilla" placeholder="Personas" value={crewDraft.member_count} onChange={(event) => setCrewDraft({ ...crewDraft, member_count: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /></div>
                    <textarea maxLength={2000} aria-label="Nota de cuadrilla" placeholder="Alcance operativo" value={crewDraft.note} onChange={(event) => setCrewDraft({ ...crewDraft, note: event.target.value })} className="h-20 w-full resize-none border border-zinc-300 p-2 text-xs" />
                    <button disabled={busy} className="h-9 w-full bg-zinc-800 text-xs font-semibold text-white disabled:opacity-40">Crear cuadrilla</button>
                </form> : <form className="space-y-2" onSubmit={submitTimecard} data-bim-timecard-form>
                    <h4 className="text-xs font-semibold text-zinc-900">Registrar parte diario</h4>
                    <select required aria-label="Cuadrilla del parte" value={timecardDraft.crew_id} onChange={(event) => setTimecardDraft({ ...timecardDraft, crew_id: event.target.value })} className="h-9 w-full border border-zinc-300 px-2 text-xs"><option value="">Seleccionar cuadrilla</option>{crews.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select>
                    <select required aria-label="Actividad del parte" value={timecardDraft.activity_snapshot_id} onChange={(event) => setTimecardDraft({ ...timecardDraft, activity_snapshot_id: event.target.value })} className="h-9 w-full border border-zinc-300 px-2 text-xs"><option value="">Seleccionar actividad</option>{activities.map((item) => <option key={item.id} value={item.id}>{item.activity_code} · {item.activity_name}</option>)}</select>
                    <select aria-label="Frente del parte" value={timecardDraft.work_area_id} onChange={(event) => setTimecardDraft({ ...timecardDraft, work_area_id: event.target.value })} className="h-9 w-full border border-zinc-300 px-2 text-xs"><option value="">Sin frente</option>{areas.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select>
                    <input required type="date" aria-label="Fecha del parte" value={timecardDraft.work_date} onChange={(event) => setTimecardDraft({ ...timecardDraft, work_date: event.target.value })} className="h-9 w-full border border-zinc-300 px-2 text-xs" />
                    <div className="grid grid-cols-2 gap-2"><input required type="number" min="0" max="24" step="0.25" aria-label="Horas regulares" placeholder="Horas regulares" value={timecardDraft.regular_hours} onChange={(event) => setTimecardDraft({ ...timecardDraft, regular_hours: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><input required type="number" min="0" max="24" step="0.25" aria-label="Horas extra" placeholder="Horas extra" value={timecardDraft.overtime_hours} onChange={(event) => setTimecardDraft({ ...timecardDraft, overtime_hours: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /></div>
                    <div className="grid grid-cols-[1fr_100px] gap-2"><input required type="number" min="0" step="0.01" aria-label="Producción instalada" placeholder="Producción" value={timecardDraft.installed_quantity} onChange={(event) => setTimecardDraft({ ...timecardDraft, installed_quantity: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><input required maxLength={30} aria-label="Unidad instalada" placeholder="Unidad" value={timecardDraft.installed_unit} onChange={(event) => setTimecardDraft({ ...timecardDraft, installed_unit: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /></div>
                    <textarea required minLength={3} maxLength={2000} aria-label="Nota del parte" placeholder="Trabajo ejecutado" value={timecardDraft.note} onChange={(event) => setTimecardDraft({ ...timecardDraft, note: event.target.value })} className="h-20 w-full resize-none border border-zinc-300 p-2 text-xs" />
                    <button disabled={busy || !crews.length} className="h-9 w-full bg-zinc-800 text-xs font-semibold text-white disabled:opacity-40">Registrar parte</button>
                </form>}
                {error ? <p role="alert" className="mt-3 text-xs text-red-700">{error}</p> : null}
            </aside>
            <main className="min-w-0 overflow-y-auto" data-bim-timecard-ledger>
                <div className="grid grid-cols-3 border-b border-zinc-200 bg-zinc-50"><div className="p-3"><strong className="block text-lg text-zinc-900">{crews.filter((item) => item.active).length}</strong><span className="text-[10px] text-zinc-500">cuadrillas activas</span></div><div className="border-x border-zinc-200 p-3"><strong className="block text-lg text-zinc-900">{totals.hours}</strong><span className="text-[10px] text-zinc-500">horas registradas</span></div><div className="p-3"><strong className="block text-lg text-[#C56F00]">{totals.overtime}</strong><span className="text-[10px] text-zinc-500">horas extra</span></div></div>
                {mode === 'directory' ? <div className="divide-y divide-zinc-100" data-bim-crew-directory>{crews.map((crew) => <article key={crew.id} className="grid grid-cols-[120px_1fr_140px_90px] items-center gap-3 px-4 py-3 text-xs"><strong>{crew.code}</strong><div><p className="font-medium text-zinc-900">{crew.name}</p><p className="text-[10px] text-zinc-500">{crew.note || 'Sin nota'}</p></div><span>{crew.trade}</span><span className="text-right">{crew.member_count} integrantes</span></article>)}</div> : <div className="divide-y divide-zinc-100">{timecards.map((item) => <article key={item.id} className="grid grid-cols-[110px_180px_1fr_100px_120px] items-center gap-3 px-4 py-3 text-xs"><div><strong>{item.work_date}</strong><p className="text-[10px] text-zinc-500">Parte #{item.id}</p></div><div><p className="font-medium text-zinc-900">{item.crew_code}</p><p className="truncate text-[10px] text-zinc-500">{item.crew_name}</p></div><p className="truncate text-zinc-600">{item.note}</p><div className="flex items-center justify-end gap-1 font-semibold"><Clock3 size={13} />{item.total_hours} h</div><div className="text-right"><strong>{item.installed_quantity} {item.installed_unit}</strong><p className="text-[10px] text-[#C56F00]">extra {item.overtime_hours} h</p></div></article>)}</div>}
            </main>
        </div>
    </section>;
}
