import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, Circle, RefreshCw, Users } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const POLL_INTERVAL_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 15000;

const EVENT_LABELS = {
    'presence.joined': 'Entró al espacio BIM',
    'presence.context_changed': 'Cambió de contexto',
    'presence.left': 'Salió del espacio BIM',
    'review.created': 'Creó una revisión',
    'review.commented': 'Comentó una revisión',
    'review.resolve': 'Resolvió una revisión',
    'review.reopen': 'Reabrió una revisión',
    'review.close': 'Cerró una revisión',
};

const WORKSPACE_LABELS = {
    viewer: 'Visor', coordination: 'Coordinación', planning: 'Planificación',
    production: 'Producción', field: 'Campo', handover: 'Entrega',
};

const createSessionKey = () => {
    if (globalThis.crypto?.randomUUID) return `web-${globalThis.crypto.randomUUID()}`;
    return `web-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const formatTime = (value) => value
    ? new Intl.DateTimeFormat('es-EC', { hour: '2-digit', minute: '2-digit' }).format(new Date(value))
    : '--:--';

const mergeEvents = (current, incoming) => {
    const rows = new Map(current.map((item) => [item.id, item]));
    incoming.forEach((item) => rows.set(item.id, item));
    return [...rows.values()].sort((left, right) => right.id - left.id).slice(0, 100);
};

const BimCdeCollaborationPanel = ({ projectId, empresaId, selectedElement = null, api = bimModelsApi }) => {
    const sessionKey = useRef(createSessionKey());
    const cursor = useRef(0);
    const context = useRef({ tool: 'activity' });
    const [presences, setPresences] = useState([]);
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    context.current = selectedElement?.global_id
        ? { tool: 'activity', global_id: selectedElement.global_id }
        : { tool: 'activity' };

    const heartbeat = useCallback(async () => {
        if (!projectId) return;
        await api.heartbeatCdePresence(projectId, {
            session_key: sessionKey.current,
            workspace: 'coordination',
            context: context.current,
        }, empresaId);
    }, [api, empresaId, projectId]);

    const refresh = useCallback(async ({ heartbeatFirst = false } = {}) => {
        if (!projectId) return;
        try {
            setLoading(true);
            if (heartbeatFirst) await heartbeat();
            const [activeRows, feed] = await Promise.all([
                api.listCdePresences(projectId, empresaId),
                api.listCdeCollaborationEvents(projectId, cursor.current, empresaId),
            ]);
            setPresences(activeRows);
            setEvents((current) => mergeEvents(current, feed.events || []));
            cursor.current = Math.max(cursor.current, feed.cursor || 0);
            setMessage('');
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo actualizar la colaboración CDE.');
        } finally {
            setLoading(false);
        }
    }, [api, empresaId, heartbeat, projectId]);

    useEffect(() => {
        if (!projectId) return undefined;
        let disposed = false;
        const run = async () => { if (!disposed) await refresh({ heartbeatFirst: true }); };
        run();
        const pollTimer = globalThis.setInterval(() => {
            if (!disposed && globalThis.document?.visibilityState !== 'hidden') refresh();
        }, POLL_INTERVAL_MS);
        const heartbeatTimer = globalThis.setInterval(() => {
            if (!disposed && globalThis.document?.visibilityState !== 'hidden') heartbeat().catch(() => {});
        }, HEARTBEAT_INTERVAL_MS);
        return () => {
            disposed = true;
            globalThis.clearInterval(pollTimer);
            globalThis.clearInterval(heartbeatTimer);
            api.leaveCdePresence(projectId, { session_key: sessionKey.current }, empresaId).catch(() => {});
        };
    }, [api, empresaId, heartbeat, projectId, refresh]);

    return (
        <section className="relative h-full min-h-0 overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-cde-collaboration>
            <header className="flex h-11 items-center justify-between border-b border-zinc-200 px-3">
                <div className="flex min-w-0 items-center gap-2">
                    <Users className="h-4 w-4 shrink-0 text-[#F39200]" aria-hidden="true" />
                    <div className="min-w-0"><h3 className="truncate text-xs font-semibold text-zinc-900">Actividad del equipo</h3><p className="text-[9px] text-zinc-500">Presencia activa y cambios CDE incrementales</p></div>
                </div>
                <button type="button" onClick={() => refresh({ heartbeatFirst: true })} disabled={loading} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:border-[#F39200] hover:text-[#F39200] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 disabled:opacity-40" aria-label="Actualizar actividad CDE" title="Actualizar actividad CDE"><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /></button>
            </header>

            <div className="grid h-[calc(100%-44px)] min-h-0 grid-cols-[280px_minmax(0,1fr)] divide-x divide-zinc-200">
                <div className="min-h-0 overflow-auto" data-bim-cde-presences>
                    <div className="sticky top-0 flex h-8 items-center justify-between border-b border-zinc-200 bg-zinc-50 px-3 text-[9px] font-semibold uppercase text-zinc-500"><span>Conectados</span><span>{presences.length}</span></div>
                    {presences.length ? presences.map((presence) => (
                        <div key={presence.id} className="flex min-h-12 items-center gap-2 border-b border-zinc-100 px-3">
                            <Circle className="h-2.5 w-2.5 shrink-0 fill-emerald-500 text-emerald-500" aria-label="En línea" />
                            <div className="min-w-0 flex-1"><p className="truncate text-[11px] font-semibold text-zinc-800" title={presence.user_name}>{presence.user_name}{presence.current_user ? ' (tú)' : ''}</p><p className="truncate text-[9px] text-zinc-500">{WORKSPACE_LABELS[presence.workspace] || presence.workspace}{presence.context?.global_id ? ` · ${presence.context.global_id}` : ''}</p></div>
                            <span className="text-[9px] text-zinc-400">{formatTime(presence.last_seen_at)}</span>
                        </div>
                    )) : <p className="p-4 text-xs text-zinc-500">No hay otras sesiones activas en este proyecto.</p>}
                </div>

                <div className="min-h-0 overflow-auto" data-bim-cde-collaboration-events>
                    <div className="sticky top-0 grid h-8 grid-cols-[120px_minmax(0,1fr)_72px] items-center border-b border-zinc-200 bg-zinc-50 px-3 text-[9px] font-semibold uppercase text-zinc-500"><span>Usuario</span><span>Actividad</span><span>Hora</span></div>
                    {events.length ? events.map((event) => (
                        <div key={event.id} className="grid min-h-12 grid-cols-[120px_minmax(0,1fr)_72px] items-center border-b border-zinc-100 px-3 text-[11px]">
                            <span className="truncate font-semibold text-zinc-800" title={event.actor_name}>{event.actor_name}</span>
                            <div className="min-w-0"><p className="truncate text-zinc-700" title={event.summary}>{EVENT_LABELS[event.event_type] || event.summary}</p>{event.payload?.review_number ? <p className="truncate text-[9px] text-zinc-500">{event.payload.review_number} · {event.summary}</p> : null}</div>
                            <span className="text-zinc-400">{formatTime(event.created_at)}</span>
                        </div>
                    )) : <div className="grid min-h-40 place-items-center px-4 text-center"><div><Activity className="mx-auto h-5 w-5 text-zinc-300" /><p className="mt-2 text-xs text-zinc-500">La actividad del proyecto aparecerá aquí.</p></div></div>}
                </div>
            </div>
            {message ? <p className="absolute bottom-2 left-3 rounded bg-white px-2 py-1 text-[10px] font-medium text-rose-600" role="status">{message}</p> : null}
        </section>
    );
};

export default BimCdeCollaborationPanel;
