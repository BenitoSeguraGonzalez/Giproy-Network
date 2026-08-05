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

const BimScheduleLinkPanel = ({ projectId, empresaId, element, selectedActivityId = null, api = bimModelsApi }) => {
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
            setActivityId((current) => {
                const synchronized = nextActivities.find((activity) => activity.id === selectedActivityId);
                return String(synchronized?.id || current || nextActivities[0]?.id || '');
            });
        }).catch((requestError) => {
            if (!cancelled) setError(requestError?.response?.data?.detail || 'No se pudo cargar la planificación 4D.');
        }).finally(() => {
            if (!cancelled) setLoading(false);
        });
        return () => { cancelled = true; };
    }, [api, element?.id, empresaId, projectId, selectedActivityId]);

    useEffect(() => {
        if (selectedActivityId && activities.some((activity) => activity.id === selectedActivityId)) {
            setActivityId(String(selectedActivityId));
        }
    }, [activities, selectedActivityId]);

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
        <section className="flex h-full min-h-0 flex-col bg-white" data-bim-schedule-link>
            <header className="flex h-12 shrink-0 items-center gap-2 border-b border-zinc-200 px-4">
                <CalendarClock className="h-4 w-4 text-[#F39200]" aria-hidden="true" />
                <div className="min-w-0"><h3 className="text-xs font-semibold text-zinc-900">Vincular selección 4D</h3><p className="truncate text-[10px] text-zinc-500">Actividad del Gantt ↔ elemento del modelo</p></div>
                {proposals.length ? <span className="ml-auto rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-600">{proposals.length}</span> : null}
            </header>
            <div className="min-h-0 flex-1 overflow-y-auto">
                <div className="border-b border-zinc-200 bg-zinc-50 px-4 py-3"><span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Elemento del visor</span><p className="mt-1 truncate text-xs font-semibold text-zinc-900">{element.nombre || element.name || element.global_id}</p><p className="mt-0.5 truncate font-mono text-[9px] text-zinc-500">{element.global_id}</p></div>
                <div className="space-y-4 p-4">
                {loading ? (
                    <div className="flex h-16 items-center justify-center text-zinc-500" aria-label="Cargando planificación 4D"><LoaderCircle className="h-4 w-4 animate-spin" /></div>
                ) : null}
                {!loading && !activities.length ? (
                    <p className="py-3 text-center text-xs text-zinc-500">Sin actividades 4D disponibles.</p>
                ) : null}
                {!loading && activities.length && !currentProposal ? (
                    <>
                        <label className="block text-[11px] font-semibold text-zinc-800">Actividad planificada<select value={activityId} onChange={(event) => setActivityId(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs font-normal text-zinc-800 outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100" aria-label="Actividad 4D">
                            {activities.map((activity) => <option key={activity.id} value={activity.id}>{activity.activity_code} · {activity.activity_name} · {formatDate(activity.planned_start)}–{formatDate(activity.planned_finish)}</option>)}
                        </select></label>
                        {selectedActivityId ? <p className="border-l-2 border-emerald-500 pl-2 text-[10px] leading-4 text-emerald-800">Actividad sincronizada con la selección vigente del Gantt.</p> : <p className="text-[10px] leading-4 text-zinc-500">Selecciona una actividad aquí o directamente en la secuencia 4D.</p>}
                        <label className="block text-[11px] font-semibold text-zinc-800">Comportamiento en la simulación<select value={linkType} onChange={(event) => setLinkType(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs font-normal text-zinc-800" aria-label="Tipo de vínculo 4D">
                                {LINK_TYPES.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select></label>
                        <label className="block text-[11px] font-semibold text-zinc-800">Justificación<input value={proposalReason} onChange={(event) => setProposalReason(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100" placeholder="Explica por qué deben vincularse" aria-label="Motivo del vínculo 4D" /></label>
                        <button type="button" onClick={createProposal} disabled={saving || !activityId || proposalReason.trim().length < 5} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-[#F39200] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#dc8300] focus:outline-none focus:ring-2 focus:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-40" aria-label="Proponer vínculo 4D">{saving ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}Proponer vínculo</button>
                    </>
                ) : null}
                {!loading && currentProposal ? (
                    <>
                        <div className="border-y border-zinc-200 bg-zinc-50 px-3 py-3" data-bim-4d-proposal-status={currentProposal.status}>
                            <div className="min-w-0 flex-1">
                                <span className="text-[9px] font-semibold uppercase tracking-wide text-zinc-500">Propuesta vigente</span>
                                <p className="truncate text-xs font-semibold text-zinc-800">{currentProposal.activity.activity_code} · {currentProposal.activity.activity_name}</p>
                                <p className="mt-0.5 text-[10px] text-zinc-500">{STATUS_LABELS[currentProposal.status]} · {formatDate(currentProposal.activity.planned_start)}–{formatDate(currentProposal.activity.planned_finish)}</p>
                            </div>
                            <span className="mt-2 inline-flex rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-zinc-600">{LINK_TYPES.find(([value]) => value === currentProposal.link_type)?.[1]}</span>
                        </div>
                        {currentProposal.status === 'pending' ? (
                            <><label className="block text-[11px] font-semibold text-zinc-800">Motivo de decisión<input value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100" placeholder="Documenta la decisión" aria-label="Motivo de decisión 4D" /></label><div className="grid grid-cols-2 gap-2"><button type="button" onClick={() => decideProposal('rejected')} disabled={saving || decisionReason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-rose-200 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-40" aria-label="Rechazar vínculo 4D"><X className="h-4 w-4" />Rechazar</button><button type="button" onClick={() => decideProposal('approved')} disabled={saving || decisionReason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-700 text-xs font-semibold text-white hover:bg-emerald-800 disabled:opacity-40" aria-label="Aprobar vínculo 4D"><Check className="h-4 w-4" />Aprobar</button></div></>
                        ) : null}
                    </>
                ) : null}
                {error ? <p className="text-xs font-medium text-rose-700" role="alert">{typeof error === 'string' ? error : 'Error 4D'}</p> : null}
                </div>
            </div>
        </section>
    );
};

export default BimScheduleLinkPanel;
