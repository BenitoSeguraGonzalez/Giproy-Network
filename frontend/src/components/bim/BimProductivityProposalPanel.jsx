import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Check, LoaderCircle, Users, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const inputClass = 'h-8 min-w-0 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100';

const BimProductivityProposalPanel = ({ projectId, empresaId, element, api = bimModelsApi }) => {
    const [candidates, setCandidates] = useState([]);
    const [activities, setActivities] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [draft, setDraft] = useState({ candidate: '0', activity: '', targetType: 'activity', targetId: '', productivity: '', crew: '1', resourceCode: '', resourceName: '' });
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setCandidates([]); setProposals([]); setError('');
        if (!projectId || !element?.id) return undefined;
        setLoading(true);
        Promise.all([api.getQuantityCandidates(projectId, element.id, empresaId), api.list4dActivities(projectId, empresaId), api.list4dProductivityProposals(projectId, element.id, empresaId)])
            .then(([nextCandidates, nextActivities, nextProposals]) => {
                if (cancelled) return;
                setCandidates(nextCandidates); setActivities(nextActivities); setProposals(nextProposals);
                setDraft((current) => ({ ...current, activity: String(nextActivities[0]?.id || ''), targetId: String(nextActivities[0]?.id || '') }));
            }).catch((requestError) => { if (!cancelled) setError(requestError?.response?.data?.detail || 'No se pudo cargar rendimiento 4D/5D.'); })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [api, element?.id, empresaId, projectId]);

    const candidate = candidates[Number(draft.candidate)] || candidates[0];
    const duration = useMemo(() => {
        const denominator = Number(draft.productivity) * Number(draft.crew);
        return candidate && denominator > 0 ? Math.round((candidate.presented_value / denominator) * 1000) / 1000 : null;
    }, [candidate, draft.crew, draft.productivity]);
    const proposal = proposals[0] || null;

    const create = async () => {
        setSaving(true); setError('');
        try {
            const created = await api.create4dProductivityProposal(projectId, { element_id: element.id, activity_snapshot_id: Number(draft.activity), target_type: draft.targetType, target_id: Number(draft.targetId), candidate, productivity_value: Number(draft.productivity), crew_size: Number(draft.crew), resource_code: draft.resourceCode.trim(), resource_name: draft.resourceName.trim() }, empresaId);
            setProposals((current) => [created, ...current]);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear la propuesta de rendimiento.'); }
        finally { setSaving(false); }
    };

    const decide = async (decision) => {
        setSaving(true); setError('');
        try {
            const decided = await api.decide4dProductivityProposal(projectId, proposal.id, { decision, reason: reason.trim() }, empresaId);
            setProposals((current) => current.map((item) => item.id === decided.id ? decided : item));
            setReason('');
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo decidir la propuesta de rendimiento.'); }
        finally { setSaving(false); }
    };

    if (!element) return null;
    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-productivity-proposal>
            <header className="flex h-10 items-center gap-2 border-b border-zinc-200 px-3"><Users className="h-4 w-4 text-[#F39200]" /><h3 className="text-xs font-semibold text-zinc-900">Rendimiento 4D/5D</h3>{loading ? <LoaderCircle className="ml-auto h-3.5 w-3.5 animate-spin text-zinc-400" /> : null}</header>
            <div className="space-y-2 p-3">
                {!proposal && candidates.length && activities.length ? <>
                    <div className="grid grid-cols-2 gap-1.5"><select value={draft.candidate} onChange={(event) => setDraft((current) => ({ ...current, candidate: event.target.value }))} className={inputClass} aria-label="Cantidad para rendimiento 4D">{candidates.map((item, index) => <option key={item.quantity_name} value={index}>{item.quantity_name} · {item.presented_value} {item.presented_unit}</option>)}</select><select value={draft.activity} onChange={(event) => setDraft((current) => ({ ...current, activity: event.target.value, targetId: current.targetType === 'activity' ? event.target.value : current.targetId }))} className={inputClass} aria-label="Actividad para rendimiento 4D">{activities.map((item) => <option key={item.id} value={item.id}>{item.activity_code}</option>)}</select></div>
                    <div className="grid grid-cols-2 gap-1.5"><input type="number" min="0.001" step="0.001" value={draft.productivity} onChange={(event) => setDraft((current) => ({ ...current, productivity: event.target.value }))} className={inputClass} placeholder="Rendimiento/día" aria-label="Rendimiento por cuadrilla y día" /><input type="number" min="0.1" step="0.1" value={draft.crew} onChange={(event) => setDraft((current) => ({ ...current, crew: event.target.value }))} className={inputClass} placeholder="Cuadrillas" aria-label="Cantidad de cuadrillas" /></div>
                    <div className="grid grid-cols-[82px_minmax(0,1fr)] gap-1.5"><input value={draft.resourceCode} onChange={(event) => setDraft((current) => ({ ...current, resourceCode: event.target.value }))} className={inputClass} placeholder="Código" aria-label="Código de recurso 4D" /><input value={draft.resourceName} onChange={(event) => setDraft((current) => ({ ...current, resourceName: event.target.value }))} className={inputClass} placeholder="Recurso o cuadrilla" aria-label="Nombre de recurso 4D" /></div>
                    <div className="grid grid-cols-[100px_minmax(0,1fr)] gap-1.5"><select value={draft.targetType} onChange={(event) => setDraft((current) => ({ ...current, targetType: event.target.value, targetId: event.target.value === 'activity' ? current.activity : '' }))} className={inputClass} aria-label="Destino de propuesta de rendimiento"><option value="activity">Actividad</option><option value="edt">EDT</option><option value="presupuesto">Presupuesto</option><option value="apu">APU</option></select><input type="number" min="1" value={draft.targetId} onChange={(event) => setDraft((current) => ({ ...current, targetId: event.target.value }))} className={inputClass} aria-label="ID destino de rendimiento" /></div>
                    <div className="flex h-9 items-center gap-2 rounded-md bg-zinc-50 px-2.5" data-bim-productivity-duration={duration ?? ''}><Calculator className="h-3.5 w-3.5 text-[#F39200]" /><span className="text-[10px] text-zinc-500">Duración propuesta</span><strong className="ml-auto text-xs text-zinc-800">{duration === null ? '—' : `${duration} días`}</strong></div>
                    <button type="button" onClick={create} disabled={saving || duration === null || !draft.activity || !Number(draft.targetId) || !draft.resourceCode.trim() || draft.resourceName.trim().length < 2} className="inline-flex h-8 w-full items-center justify-center rounded bg-[#F39200] text-xs font-semibold text-white disabled:opacity-40">Proponer rendimiento</button>
                </> : null}
                {proposal ? <><div className="rounded-md bg-zinc-50 p-2" data-bim-productivity-status={proposal.status}><div className="flex items-center gap-2"><span className="text-xs font-semibold text-zinc-800">{proposal.calculated_duration_days} días</span><span className="ml-auto rounded bg-white px-1.5 py-0.5 text-[10px] text-zinc-600">{proposal.status}</span></div><p className="mt-1 text-[10px] text-zinc-500">{proposal.resource_code} · {proposal.resource_name} · {proposal.productivity_value} × {proposal.crew_size}</p></div>{proposal.status === 'pending' ? <><input value={reason} onChange={(event) => setReason(event.target.value)} className={`${inputClass} w-full`} placeholder="Motivo de decisión" aria-label="Motivo de decisión de rendimiento" /><div className="flex gap-1.5"><button type="button" onClick={() => decide('approved')} disabled={saving || reason.trim().length < 5} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded bg-emerald-700 text-[10px] font-semibold text-white disabled:opacity-40"><Check className="h-3 w-3" />Aprobar</button><button type="button" onClick={() => decide('rejected')} disabled={saving || reason.trim().length < 5} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded border border-rose-200 text-[10px] font-semibold text-rose-700 disabled:opacity-40"><X className="h-3 w-3" />Rechazar</button></div></> : null}</> : null}
                {!loading && (!candidates.length || !activities.length) ? <p className="py-2 text-center text-xs text-zinc-500">Sin cantidad o actividad disponible.</p> : null}
                {error ? <p className="text-xs font-medium text-rose-700" role="alert">{error}</p> : null}
            </div>
        </section>
    );
};

export default BimProductivityProposalPanel;
