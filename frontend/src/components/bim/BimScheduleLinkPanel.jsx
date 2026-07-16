import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, Check, Link2, LoaderCircle, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const LINK_TYPES = [
    ['construction', 'Construcción'],
    ['demolition', 'Demolición'],
    ['temporary', 'Temporal'],
    ['inspection', 'Inspección'],
];

const STATUS_LABELS = { pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado' };

const formatDate = (value) => new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' }).format(new Date(value));

const BimScheduleLinkPanel = ({ projectId, empresaId, element, api = bimModelsApi }) => {
    const [activities, setActivities] = useState([]);
    const [proposals, setProposals] = useState([]);
    const [activityId, setActivityId] = useState('');
    const [linkType, setLinkType] = useState('construction');
    const [proposalReason, setProposalReason] = useState('');
    const [decisionReason, setDecisionReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        let cancelled = false;
        setProposals([]);
        setError('');
        if (!projectId || !element?.id) return undefined;
        setLoading(true);
        Promise.all([
            api.list4dActivities(projectId, empresaId),
            api.list4dLinkProposals(projectId, element.id, empresaId),
        ]).then(([nextActivities, nextProposals]) => {
            if (cancelled) return;
            setActivities(nextActivities);
            setProposals(nextProposals);
            setActivityId((current) => current || String(nextActivities[0]?.id || ''));
        }).catch((requestError) => {
            if (!cancelled) setError(requestError?.response?.data?.detail || 'No se pudo cargar la planificación 4D.');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [api, element?.id, empresaId, projectId]);

    const currentProposal = useMemo(() => proposals.find((item) => item.status === 'pending') || proposals[0], [proposals]);

    const createProposal = async () => {
        setSaving(true);
        setError('');
        try {
            const created = await api.create4dLinkProposal(projectId, {
                element_id: element.id,
                activity_snapshot_id: Number(activityId),
                link_type: linkType,
                proposal_reason: proposalReason.trim(),
            }, empresaId);
            setProposals((current) => [created, ...current]);
            setProposalReason('');
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo proponer el vínculo 4D.');
        } finally {
            setSaving(false);
        }
    };

    const decideProposal = async (decision) => {
        setSaving(true);
        setError('');
        try {
            const decided = await api.decide4dLinkProposal(projectId, currentProposal.id, { decision, reason: decisionReason.trim() }, empresaId);
            setProposals((current) => current.map((item) => (item.id === decided.id ? decided : item)));
            setDecisionReason('');
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo decidir el vínculo 4D.');
        } finally {
            setSaving(false);
        }
    };

    if (!element) return null;

    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-schedule-link>
            <header className="flex h-10 items-center gap-2 border-b border-zinc-200 px-3">
                <CalendarClock className="h-4 w-4 text-[#F39200]" aria-hidden="true" />
                <h3 className="text-xs font-semibold text-zinc-900">Planificación 4D</h3>
                {proposals.length ? <span className="ml-auto rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">{proposals.length}</span> : null}
            </header>
            <div className="space-y-2.5 p-3">
                {loading ? (
                    <div className="flex h-16 items-center justify-center text-zinc-500" aria-label="Cargando planificación 4D"><LoaderCircle className="h-4 w-4 animate-spin" /></div>
                ) : null}
                {!loading && !activities.length ? (
                    <p className="py-3 text-center text-xs text-zinc-500">Sin actividades 4D disponibles.</p>
                ) : null}
                {!loading && activities.length && !currentProposal ? (
                    <>
                        <select value={activityId} onChange={(event) => setActivityId(event.target.value)} className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800 outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100" aria-label="Actividad 4D">
                            {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.activity_code} · {activity.activity_name} · {formatDate(activity.planned_start)}–{formatDate(activity.planned_finish)}</option>)}
                        </select>
                        <div className="flex gap-2">
                            <select value={linkType} onChange={(event) => setLinkType(event.target.value)} className="h-9 w-32 rounded-md border border-zinc-300 bg-white px-2 text-xs text-zinc-800" aria-label="Tipo de vínculo 4D">
                                {LINK_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                            </select>
                            <input value={proposalReason} onChange={(event) => setProposalReason(event.target.value)} className="h-9 min-w-0 flex-1 rounded-md border border-zinc-300 px-2 text-xs outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100" placeholder="Motivo del vínculo" aria-label="Motivo del vínculo 4D" />
                            <button type="button" onClick={createProposal} disabled={saving || !activityId || proposalReason.trim().length < 5} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F39200] text-white transition-colors hover:bg-[#dc8300] focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-40" title="Proponer vínculo" aria-label="Proponer vínculo 4D">
                                {saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
                            </button>
                        </div>
                    </>
                ) : null}
                {!loading && currentProposal ? (
                    <>
                        <div className="flex items-start gap-2 rounded-md bg-zinc-50 px-2.5 py-2" data-bim-4d-proposal-status={currentProposal.status}>
                            <div className="min-w-0 flex-1">
                                <p className="truncate text-xs font-semibold text-zinc-800">{currentProposal.activity.activity_code} · {currentProposal.activity.activity_name}</p>
                                <p className="mt-0.5 text-[10px] text-zinc-500">{STATUS_LABELS[currentProposal.status]} · {formatDate(currentProposal.activity.planned_start)}–{formatDate(currentProposal.activity.planned_finish)}</p>
                            </div>
                            <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">{LINK_TYPES.find(([value]) => value === currentProposal.link_type)?.[1]}</span>
                        </div>
                        {currentProposal.status === 'pending' ? (
                            <div className="flex gap-2">
                                <input value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} className="h-9 min-w-0 flex-1 rounded-md border border-zinc-300 px-2 text-xs outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100" placeholder="Motivo de decisión" aria-label="Motivo de decisión 4D" />
                                <button type="button" onClick={() => decideProposal('approved')} disabled={saving || decisionReason.trim().length < 5} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-40" title="Aprobar vínculo" aria-label="Aprobar vínculo 4D"><Check className="h-4 w-4" /></button>
                                <button type="button" onClick={() => decideProposal('rejected')} disabled={saving || decisionReason.trim().length < 5} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-40" title="Rechazar vínculo" aria-label="Rechazar vínculo 4D"><X className="h-4 w-4" /></button>
                            </div>
                        ) : null}
                    </>
                ) : null}
                {error ? <p className="text-xs font-medium text-rose-700" role="alert">{typeof error === 'string' ? error : 'Error 4D'}</p> : null}
            </div>
        </section>
    );
};

export default BimScheduleLinkPanel;
