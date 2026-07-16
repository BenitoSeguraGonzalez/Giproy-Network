import React, { useEffect, useState } from 'react';
import { Camera, ClipboardList, ExternalLink, LoaderCircle, Save } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const inputClass = 'h-8 min-w-0 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100';
const localNow = () => {
    const value = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
    return value.toISOString().slice(0, 16);
};

const BimFieldReportPanel = ({ projectId, empresaId, api = bimModelsApi }) => {
    const [activities, setActivities] = useState([]);
    const [areas, setAreas] = useState([]);
    const [reports, setReports] = useState([]);
    const [file, setFile] = useState(null);
    const [draft, setDraft] = useState({ activity: '', area: '', reportedAt: localNow(), progress: '', quantity: '', unit: 'm3', labor: '', equipment: '0', bac: '', pv: '', ac: '', log: '' });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        if (!projectId) return undefined;
        setLoading(true);
        Promise.all([api.list4dActivities(projectId, empresaId), api.list4dWorkAreas(projectId, empresaId), api.list4dFieldReports(projectId, null, empresaId)])
            .then(([nextActivities, nextAreas, nextReports]) => {
                if (cancelled) return;
                setActivities(nextActivities); setAreas(nextAreas); setReports(nextReports);
                setDraft((current) => ({ ...current, activity: String(nextActivities[0]?.id || ''), area: String(nextAreas[0]?.id || '') }));
            }).catch((requestError) => { if (!cancelled) setError(requestError?.response?.data?.detail || 'No se pudo cargar campo BIM.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [api, empresaId, projectId]);

    const create = async () => {
        setSaving(true); setError('');
        try {
            let report = await api.create4dFieldReport(projectId, { activity_snapshot_id: Number(draft.activity), work_area_id: draft.area ? Number(draft.area) : null, reported_at: new Date(draft.reportedAt).toISOString(), progress_percent: Number(draft.progress), actual_start: null, actual_finish: Number(draft.progress) === 100 ? new Date(draft.reportedAt).toISOString() : null, installed_quantity: Number(draft.quantity), installed_unit: draft.unit.trim(), labor_hours: Number(draft.labor), equipment_hours: Number(draft.equipment), budget_at_completion: Number(draft.bac), planned_value_to_date: Number(draft.pv), actual_cost: Number(draft.ac), daily_log: draft.log.trim() }, empresaId);
            if (file) {
                const evidence = await api.upload4dFieldEvidence(projectId, report.id, file, empresaId);
                report = { ...report, evidence: [...(report.evidence || []), evidence] };
            }
            setReports((current) => [report, ...current]);
            setFile(null);
            setDraft((current) => ({ ...current, progress: '', quantity: '', labor: '', equipment: '0', pv: '', ac: '', log: '', reportedAt: localNow() }));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo registrar el reporte de campo.'); }
        finally { setSaving(false); }
    };

    const openEvidence = async (evidence) => {
        try {
            const blob = await api.download4dFieldEvidence(projectId, evidence.id, empresaId);
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank', 'noopener,noreferrer');
            window.setTimeout(() => URL.revokeObjectURL(url), 30000);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo abrir la evidencia.'); }
    };

    const latest = reports[0];
    const valid = draft.activity && draft.reportedAt && draft.progress !== '' && draft.quantity !== '' && draft.unit.trim() && draft.labor !== '' && draft.bac !== '' && draft.pv !== '' && draft.ac !== '' && draft.log.trim().length >= 3;
    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-field-report>
            <header className="flex h-10 items-center gap-2 border-b border-zinc-200 px-3"><ClipboardList className="h-4 w-4 text-[#F39200]" /><h3 className="text-xs font-semibold text-zinc-900">Campo 4D</h3>{loading ? <LoaderCircle className="ml-auto h-3.5 w-3.5 animate-spin text-zinc-400" /> : reports.length ? <span className="ml-auto text-[10px] font-semibold text-zinc-500">{reports.length}</span> : null}</header>
            <div className="space-y-2 p-3">
                <details className="rounded-md border border-zinc-200" data-bim-field-editor>
                    <summary className="flex h-9 cursor-pointer list-none items-center gap-2 px-2.5 text-xs font-semibold text-zinc-700"><Save className="h-3.5 w-3.5 text-[#F39200]" />Nuevo reporte</summary>
                    <div className="space-y-1.5 border-t border-zinc-200 p-2">
                        <div className="grid grid-cols-2 gap-1.5"><select value={draft.activity} onChange={(event) => setDraft((current) => ({ ...current, activity: event.target.value }))} className={inputClass} aria-label="Actividad de campo 4D">{activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.activity_code}</option>)}</select><select value={draft.area} onChange={(event) => setDraft((current) => ({ ...current, area: event.target.value }))} className={inputClass} aria-label="Frente de campo 4D"><option value="">Sin frente</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.code}</option>)}</select></div>
                        <input type="datetime-local" value={draft.reportedAt} onChange={(event) => setDraft((current) => ({ ...current, reportedAt: event.target.value }))} className={`${inputClass} w-full`} aria-label="Fecha del reporte de campo" />
                        <div className="grid grid-cols-3 gap-1.5"><input type="number" min="0" max="100" value={draft.progress} onChange={(event) => setDraft((current) => ({ ...current, progress: event.target.value }))} className={inputClass} placeholder="Avance %" aria-label="Avance de campo porcentual" /><input type="number" min="0" step="0.001" value={draft.quantity} onChange={(event) => setDraft((current) => ({ ...current, quantity: event.target.value }))} className={inputClass} placeholder="Cantidad" aria-label="Cantidad instalada en campo" /><input value={draft.unit} onChange={(event) => setDraft((current) => ({ ...current, unit: event.target.value }))} className={inputClass} placeholder="Unidad" aria-label="Unidad instalada en campo" /></div>
                        <div className="grid grid-cols-2 gap-1.5"><input type="number" min="0" value={draft.labor} onChange={(event) => setDraft((current) => ({ ...current, labor: event.target.value }))} className={inputClass} placeholder="HH mano de obra" aria-label="Horas de mano de obra" /><input type="number" min="0" value={draft.equipment} onChange={(event) => setDraft((current) => ({ ...current, equipment: event.target.value }))} className={inputClass} placeholder="HH equipo" aria-label="Horas de equipo" /></div>
                        <div className="grid grid-cols-3 gap-1.5"><input type="number" min="0" value={draft.bac} onChange={(event) => setDraft((current) => ({ ...current, bac: event.target.value }))} className={inputClass} placeholder="BAC" aria-label="BAC de campo" /><input type="number" min="0" value={draft.pv} onChange={(event) => setDraft((current) => ({ ...current, pv: event.target.value }))} className={inputClass} placeholder="PV" aria-label="PV de campo" /><input type="number" min="0" value={draft.ac} onChange={(event) => setDraft((current) => ({ ...current, ac: event.target.value }))} className={inputClass} placeholder="AC" aria-label="AC de campo" /></div>
                        <textarea value={draft.log} onChange={(event) => setDraft((current) => ({ ...current, log: event.target.value }))} className="min-h-16 w-full resize-y rounded-md border border-zinc-300 p-2 text-xs outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100" placeholder="Diario de campo" aria-label="Diario de campo BIM" />
                        <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-dashed border-zinc-300 px-2 text-[10px] text-zinc-600"><Camera className="h-3.5 w-3.5 text-[#F39200]" /><span className="min-w-0 flex-1 truncate">{file?.name || 'Evidencia JPEG, PNG o WebP'}</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} className="sr-only" aria-label="Evidencia fotográfica de campo" /></label>
                        <button type="button" onClick={create} disabled={saving || !valid} className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded bg-[#F39200] text-xs font-semibold text-white disabled:opacity-40">{saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}Registrar campo</button>
                    </div>
                </details>
                {latest ? <div className="space-y-1.5" data-bim-field-latest={latest.id}><div className="grid grid-cols-4 gap-1 rounded-md bg-zinc-50 p-2 text-center"><div><p className="text-[9px] text-zinc-500">Avance</p><p className="text-xs font-semibold text-zinc-800">{latest.progress_percent}%</p></div><div><p className="text-[9px] text-zinc-500">EV</p><p className="text-xs font-semibold text-zinc-800">{latest.earned_value}</p></div><div><p className="text-[9px] text-zinc-500">SPI</p><p className={`text-xs font-semibold ${latest.schedule_performance_index < 1 ? 'text-rose-700' : 'text-emerald-700'}`}>{latest.schedule_performance_index ?? '—'}</p></div><div><p className="text-[9px] text-zinc-500">CPI</p><p className={`text-xs font-semibold ${latest.cost_performance_index < 1 ? 'text-rose-700' : 'text-emerald-700'}`}>{latest.cost_performance_index ?? '—'}</p></div></div><p className="line-clamp-2 text-[10px] text-zinc-600">{latest.daily_log}</p>{latest.evidence?.map((evidence) => <button key={evidence.id} type="button" onClick={() => openEvidence(evidence)} className="flex h-8 w-full items-center gap-2 rounded bg-zinc-50 px-2 text-[10px] text-zinc-600 hover:text-[#F39200]" aria-label={`Abrir evidencia ${evidence.filename}`}><Camera className="h-3.5 w-3.5" /><span className="min-w-0 flex-1 truncate text-left">{evidence.filename}</span><ExternalLink className="h-3 w-3" /></button>)}</div> : !loading ? <p className="py-2 text-center text-xs text-zinc-500">Sin reportes de campo.</p> : null}
                {error ? <p className="text-xs font-medium text-rose-700" role="alert">{error}</p> : null}
            </div>
        </section>
    );
};

export default BimFieldReportPanel;
