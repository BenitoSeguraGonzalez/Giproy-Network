import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CalendarDays, Camera, Clock3, ExternalLink, RefreshCw, Search, UsersRound, Wrench } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const asNumber = (value) => Number.isFinite(Number(value)) ? Number(value) : 0;
const reportDay = (report) => String(report.reported_at || '').slice(0, 10);
const formatDay = (value) => new Intl.DateTimeFormat('es-EC', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
const formatTime = (value) => new Intl.DateTimeFormat('es-EC', { hour: '2-digit', minute: '2-digit' }).format(new Date(value));
const formatMoney = (value) => new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(asNumber(value));

const BimFieldDiaryPanel = ({ projectId, empresaId, api = bimModelsApi, onOpenEvidence }) => {
    const [reports, setReports] = useState([]);
    const [activities, setActivities] = useState([]);
    const [areas, setAreas] = useState([]);
    const [selectedDay, setSelectedDay] = useState('');
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState('');
    const [areaId, setAreaId] = useState('all');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [message, setMessage] = useState('');
    const [previewUrls, setPreviewUrls] = useState({});

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setMessage('');
            const [nextReports, nextActivities, nextAreas] = await Promise.all([api.list4dFieldReports(projectId, null, empresaId), api.list4dActivities(projectId, empresaId), api.list4dWorkAreas(projectId, empresaId)]);
            setReports(nextReports || []); setActivities(nextActivities || []); setAreas(nextAreas || []);
        } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo cargar el diario de obra.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { queueMicrotask(() => void load()); }, [load]);
    const activityById = useMemo(() => Object.fromEntries(activities.map((item) => [item.id, item])), [activities]);
    const areaById = useMemo(() => Object.fromEntries(areas.map((item) => [item.id, item])), [areas]);
    const filtered = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('es');
        return reports.filter((report) => {
            const day = reportDay(report);
            if (dateFrom && day < dateFrom) return false;
            if (dateTo && day > dateTo) return false;
            if (areaId !== 'all' && String(report.work_area_id || '') !== areaId) return false;
            const activity = activityById[report.activity_snapshot_id]; const area = areaById[report.work_area_id];
            return !term || `${report.daily_log} ${activity?.activity_code || ''} ${activity?.activity_name || activity?.name || ''} ${area?.code || ''} ${area?.name || ''}`.toLocaleLowerCase('es').includes(term);
        });
    }, [activityById, areaById, areaId, dateFrom, dateTo, reports, search]);
    const days = useMemo(() => {
        const grouped = new Map();
        filtered.forEach((report) => { const day = reportDay(report); if (!grouped.has(day)) grouped.set(day, []); grouped.get(day).push(report); });
        return [...grouped.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([day, items]) => ({
            day, reports: items,
            labor: items.reduce((sum, item) => sum + asNumber(item.labor_hours), 0),
            equipment: items.reduce((sum, item) => sum + asNumber(item.equipment_hours), 0),
            actualCost: items.reduce((sum, item) => sum + asNumber(item.actual_cost), 0),
            evidence: items.reduce((sum, item) => sum + (item.evidence?.length || 0), 0),
        }));
    }, [filtered]);

    const activeDay = days.find((item) => item.day === selectedDay) || days[0] || null;
    const selected = activeDay?.reports.find((item) => item.id === selectedId) || activeDay?.reports[0] || null;

    useEffect(() => {
        let cancelled = false; const urls = [];
        Promise.all((selected?.evidence || []).map(async (item) => { const blob = await api.download4dFieldEvidence(projectId, item.id, empresaId); const url = URL.createObjectURL(blob); urls.push(url); return [item.id, url]; }))
            .then((entries) => { if (!cancelled) setPreviewUrls(Object.fromEntries(entries)); }).catch(() => { if (!cancelled) setPreviewUrls({}); });
        return () => { cancelled = true; urls.forEach((url) => URL.revokeObjectURL(url)); };
    }, [api, empresaId, projectId, selected?.evidence, selected?.id]);

    const openEvidence = async (evidence) => {
        const blob = await api.download4dFieldEvidence(projectId, evidence.id, empresaId);
        if (onOpenEvidence) return onOpenEvidence(evidence, blob);
        const url = URL.createObjectURL(blob); window.open(url, '_blank', 'noopener,noreferrer'); setTimeout(() => URL.revokeObjectURL(url), 30000);
    };

    return (
        <section className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-field-diary>
            <header className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 px-3"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-[#F39200]" /><div><h3 className="text-xs font-semibold text-zinc-900">Diario de obra</h3><p className="text-[9px] text-zinc-500">{days.length} jornadas · {filtered.length} partes</p></div></div><button type="button" onClick={load} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:border-[#F39200]" aria-label="Actualizar diario de obra" title="Actualizar"><RefreshCw className="h-3.5 w-3.5" /></button></header>
            <div className="flex shrink-0 flex-wrap gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-1.5"><label className="relative"><Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-2 text-xs" placeholder="Buscar observación, actividad o frente" /></label><select value={areaId} onChange={(event) => setAreaId(event.target.value)} className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs" aria-label="Filtrar frente del diario"><option value="all">Todos los frentes</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.code} · {area.name}</option>)}</select><input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs" aria-label="Diario desde" /><input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs" aria-label="Diario hasta" /></div>
            <div className="bim-adaptive-triple grid min-h-0 flex-1 overflow-auto">
                <aside className="min-h-0 overflow-y-auto border-r border-zinc-200" data-bim-field-diary-days>{days.map((item) => <button key={item.day} type="button" onClick={() => { setSelectedDay(item.day); setSelectedId(item.reports[0]?.id || null); }} className={`w-full border-b border-zinc-100 px-3 py-3 text-left ${item.day === selectedDay ? 'bg-orange-50' : 'hover:bg-zinc-50'}`}><span className="block text-xs font-semibold capitalize text-zinc-800">{formatDay(item.day)}</span><span className="mt-1 block text-[10px] text-zinc-500">{item.reports.length} partes · {item.evidence} evidencias</span><span className="mt-2 grid grid-cols-2 gap-1 text-[9px] text-zinc-400"><span>{item.labor.toFixed(1)} HH</span><span>{formatMoney(item.actualCost)}</span></span></button>)}{!days.length ? <p className="p-4 text-xs text-zinc-500">No hay jornadas para estos filtros.</p> : null}</aside>
                <aside className="min-h-0 overflow-y-auto border-r border-zinc-200" data-bim-field-diary-reports>{activeDay ? <><div className="grid grid-cols-2 gap-2 border-b border-zinc-200 bg-zinc-50 p-3"><span className="text-[9px] text-zinc-500"><UsersRound className="mb-1 h-3.5 w-3.5" />{activeDay.labor.toFixed(1)} HH</span><span className="text-[9px] text-zinc-500"><Wrench className="mb-1 h-3.5 w-3.5" />{activeDay.equipment.toFixed(1)} HE</span><span className="col-span-2 text-[10px] font-semibold text-zinc-700">Costo real {formatMoney(activeDay.actualCost)}</span></div>{activeDay.reports.map((report) => { const activity = activityById[report.activity_snapshot_id]; const area = areaById[report.work_area_id]; return <button key={report.id} type="button" onClick={() => setSelectedId(report.id)} className={`w-full border-b border-zinc-100 px-3 py-3 text-left ${report.id === selected?.id ? 'bg-zinc-100' : 'hover:bg-zinc-50'}`}><span className="flex items-center justify-between gap-2"><span className="truncate text-xs font-semibold text-zinc-800">{activity?.activity_code || `Actividad ${report.activity_snapshot_id}`}</span><span className="shrink-0 text-[9px] text-zinc-400">{formatTime(report.reported_at)}</span></span><span className="mt-1 block truncate text-[10px] text-zinc-500">{area ? `${area.code} · ${area.name}` : 'Sin frente'}</span><span className="mt-2 block line-clamp-2 text-[10px] text-zinc-600">{report.daily_log}</span></button>; })}</> : null}</aside>
                <article className="min-h-0 overflow-y-auto" data-bim-field-diary-detail>{selected ? <div className="p-5"><div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4"><div><p className="text-[10px] font-semibold text-[#B86B00]">{activityById[selected.activity_snapshot_id]?.activity_code || `Actividad ${selected.activity_snapshot_id}`}</p><h4 className="mt-1 text-sm font-semibold text-zinc-900">{activityById[selected.activity_snapshot_id]?.activity_name || activityById[selected.activity_snapshot_id]?.name || 'Parte diario'}</h4><p className="mt-1 text-xs text-zinc-500">{areaById[selected.work_area_id] ? `${areaById[selected.work_area_id].code} · ${areaById[selected.work_area_id].name}` : 'Sin frente asignado'}</p></div><span className="inline-flex items-center gap-1 text-[10px] text-zinc-500"><Clock3 className="h-3.5 w-3.5" />{formatTime(selected.reported_at)}</span></div><div className="grid grid-cols-6 gap-2 border-b border-zinc-200 py-4"><span className="text-[9px] text-zinc-500"><strong className="block text-xs text-zinc-800">{selected.progress_percent}%</strong>Avance</span><span className="text-[9px] text-zinc-500"><strong className="block text-xs text-zinc-800">{selected.installed_quantity} {selected.installed_unit}</strong>Instalado</span><span className="text-[9px] text-zinc-500"><strong className="block text-xs text-zinc-800">{selected.labor_hours}</strong>HH</span><span className="text-[9px] text-zinc-500"><strong className="block text-xs text-zinc-800">{selected.equipment_hours}</strong>HE</span><span className="text-[9px] text-zinc-500"><strong className={`block text-xs ${selected.schedule_performance_index < 1 ? 'text-rose-700' : 'text-emerald-700'}`}>{selected.schedule_performance_index ?? '—'}</strong>SPI</span><span className="text-[9px] text-zinc-500"><strong className={`block text-xs ${selected.cost_performance_index < 1 ? 'text-rose-700' : 'text-emerald-700'}`}>{selected.cost_performance_index ?? '—'}</strong>CPI</span></div><div className="py-4"><h5 className="text-xs font-semibold text-zinc-800">Observación diaria</h5><p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-zinc-700">{selected.daily_log}</p></div><div><h5 className="mb-2 text-xs font-semibold text-zinc-800">Evidencia</h5><div className="grid grid-cols-3 gap-2 2xl:grid-cols-4" data-bim-field-diary-evidence>{(selected.evidence || []).map((evidence) => <button key={evidence.id} type="button" onClick={() => openEvidence(evidence)} className="overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 text-left" aria-label={`Abrir evidencia ${evidence.filename}`}><div className="aspect-video bg-zinc-100">{previewUrls[evidence.id] ? <img src={previewUrls[evidence.id]} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Camera className="h-5 w-5 text-zinc-300" /></div>}</div><div className="flex items-center gap-2 px-2 py-1.5"><span className="min-w-0 flex-1 truncate text-[10px] text-zinc-600">{evidence.filename}</span><ExternalLink className="h-3 w-3 text-zinc-400" /></div></button>)}{!selected.evidence?.length ? <p className="col-span-full border border-dashed border-zinc-200 py-8 text-center text-xs text-zinc-500">Sin evidencia adjunta.</p> : null}</div></div></div> : <div className="flex h-full items-center justify-center text-xs text-zinc-500">Selecciona una jornada.</div>}</article>
            </div>
            {message ? <p className="absolute bottom-3 right-3 text-[10px] text-rose-700" role="alert">{message}</p> : null}
        </section>
    );
};

export default BimFieldDiaryPanel;
