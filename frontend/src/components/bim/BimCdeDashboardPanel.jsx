import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Check, ClipboardList, FileStack, MessageSquareText, RefreshCw, Users } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const STATUS_LABELS = {
    active: 'Activo', draft: 'Borrador', submitted: 'Enviado', answered: 'Respondido',
    closed: 'Cerrado', void: 'Anulado', under_review: 'En revisión', approved: 'Aprobado',
    rejected: 'Rechazado', open: 'Abierto', resolved: 'Resuelto',
};

const ITEM_LABELS = { rfi: 'RFI', submittal: 'Submittal', review: 'Revisión' };
const ALERT_LABELS = { due_soon: 'Próximo', overdue: 'Vencido', escalated: 'Escalado' };
const ALERT_STYLES = {
    warning: 'border-amber-200 bg-amber-50 text-amber-800',
    high: 'border-rose-200 bg-rose-50 text-rose-800',
    critical: 'border-red-300 bg-red-50 text-red-900',
};

const formatDate = (value) => value
    ? new Intl.DateTimeFormat('es-EC', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value))
    : 'Sin fecha';

const StatusLine = ({ label, values }) => {
    const entries = Object.entries(values || {});
    return (
        <div className="flex min-h-9 items-center gap-3 border-b border-zinc-100 px-3 last:border-b-0">
            <span className="w-24 shrink-0 text-[10px] font-semibold uppercase text-zinc-500">{label}</span>
            <div className="flex min-w-0 flex-wrap gap-x-4 gap-y-1">
                {entries.length ? entries.map(([status, count]) => (
                    <span key={status} className="text-[11px] text-zinc-600">
                        {STATUS_LABELS[status] || status}: <strong className="text-zinc-900">{count}</strong>
                    </span>
                )) : <span className="text-[11px] text-zinc-400">Sin registros visibles</span>}
            </div>
        </div>
    );
};

const Metric = ({ icon: Icon, label, value, detail, alert }) => (
    <div className="min-w-0 border-r border-zinc-200 px-4 last:border-r-0">
        <div className="flex items-center gap-2 text-zinc-500"><Icon className="h-4 w-4" aria-hidden="true" /><span className="truncate text-[10px] font-semibold uppercase">{label}</span></div>
        <div className="mt-1 flex items-baseline gap-2"><strong className="text-xl font-semibold text-zinc-900">{value}</strong>{detail ? <span className={`text-[10px] font-semibold ${alert ? 'text-rose-600' : 'text-zinc-500'}`}>{detail}</span> : null}</div>
    </div>
);

const BimCdeDashboardPanel = ({ projectId, empresaId, canReconcile = false, api = bimModelsApi }) => {
    const [dashboard, setDashboard] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const load = useCallback(async (reconcile = false) => {
        if (!projectId) return;
        try {
            setLoading(true); setMessage('');
            if (reconcile && canReconcile) await api.reconcileOperationalNotifications(projectId, empresaId);
            const [summary, alerts] = await Promise.all([
                api.getCdeDashboard(projectId, empresaId),
                api.listOperationalNotifications(projectId, empresaId),
            ]);
            setDashboard(summary); setNotifications(alerts);
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo cargar el resumen CDE.');
        } finally { setLoading(false); }
    }, [api, canReconcile, empresaId, projectId]);

    useEffect(() => { load(false); }, [load]);
    const acknowledge = async (notification) => {
        try {
            setMessage('');
            const updated = await api.acknowledgeOperationalNotification(projectId, notification.id, empresaId);
            setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item));
            if (!notification.acknowledged_at) setDashboard((current) => current ? { ...current, totals: { ...current.totals, unread_notifications: Math.max(0, (current.totals.unread_notifications || 0) - 1) } } : current);
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo acusar la alerta BIM.');
        }
    };

    const totals = dashboard?.totals || {};
    const scopeLabel = dashboard?.scope === 'project' ? 'Proyecto completo' : 'Mi ámbito autorizado';
    const queue = useMemo(() => dashboard?.priority_queue || [], [dashboard]);

    return (
        <section className="relative h-full min-h-0 overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-cde-dashboard>
            <header className="flex h-11 items-center justify-between border-b border-zinc-200 px-3">
                <div className="flex min-w-0 items-center gap-2"><ClipboardList className="h-4 w-4 shrink-0 text-[#F39200]" aria-hidden="true" /><div className="min-w-0"><h3 className="truncate text-xs font-semibold text-zinc-900">Resumen CDE</h3><p className="text-[9px] text-zinc-500">{scopeLabel}</p></div></div>
                <button type="button" onClick={() => load(canReconcile)} disabled={loading} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:border-[#F39200] hover:text-[#F39200] disabled:opacity-40" aria-label="Actualizar resumen CDE" title={canReconcile ? 'Reconciliar alertas y actualizar' : 'Actualizar resumen CDE'}><RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /></button>
            </header>

            {dashboard ? <div className="grid h-[calc(100%-44px)] min-h-0 grid-rows-[88px_112px_minmax(0,1fr)]">
                <div className="grid grid-cols-5 items-center border-b border-zinc-200 bg-zinc-50" data-bim-cde-metrics>
                    <Metric icon={FileStack} label="Documentos" value={totals.documents || 0} detail={`${totals.document_revisions || 0} revisiones`} />
                    <Metric icon={MessageSquareText} label="RFI abiertos" value={totals.open_rfis || 0} detail={`${totals.overdue_rfis || 0} vencidos`} alert={totals.overdue_rfis > 0} />
                    <Metric icon={ClipboardList} label="Submittals" value={totals.pending_submittals || 0} detail={`${totals.overdue_submittals || 0} vencidos`} alert={totals.overdue_submittals > 0} />
                    <Metric icon={Users} label="Revisiones" value={totals.open_reviews || 0} detail={`${totals.overdue_reviews || 0} vencidas`} alert={totals.overdue_reviews > 0} />
                    <Metric icon={Bell} label="Notificaciones" value={totals.unread_notifications || 0} detail="sin leer" alert={totals.unread_notifications > 0} />
                </div>
                <div className="border-b border-zinc-200" data-bim-cde-status-summary>
                    <StatusLine label="RFI" values={dashboard.rfi_statuses} />
                    <StatusLine label="Submittals" values={dashboard.submittal_statuses} />
                    <StatusLine label="Revisiones" values={dashboard.review_statuses} />
                </div>
                <div className="grid min-h-0 grid-cols-[30%_44%_26%] divide-x divide-zinc-200">
                    <div className="min-h-0 overflow-auto">
                        <div className="sticky top-0 grid h-8 grid-cols-[minmax(0,1fr)_44px_64px_58px_52px] items-center border-b border-zinc-200 bg-white px-3 text-[9px] font-semibold uppercase text-zinc-400"><span>Responsable</span><span>RFI</span><span>Submittal</span><span>Rev.</span><span>Venc.</span></div>
                        <div data-bim-cde-workload>{dashboard.responsible_workload.length ? dashboard.responsible_workload.map((item) => (
                            <div key={item.user_id} className="grid min-h-10 grid-cols-[minmax(0,1fr)_44px_64px_58px_52px] items-center border-b border-zinc-100 px-3 text-[11px]"><span className="truncate font-medium text-zinc-800" title={item.name}>{item.name}</span><span>{item.rfis}</span><span>{item.submittals}</span><span>{item.reviews}</span><span className={item.overdue ? 'font-semibold text-rose-600' : 'text-zinc-500'}>{item.overdue}</span></div>
                        )) : <p className="p-4 text-xs text-zinc-500">No hay carga asignada visible.</p>}</div>
                    </div>
                    <div className="min-h-0 overflow-auto">
                        <div className="sticky top-0 grid h-8 grid-cols-[76px_86px_minmax(0,1fr)_112px_90px] items-center border-b border-zinc-200 bg-white px-3 text-[9px] font-semibold uppercase text-zinc-400"><span>Tipo</span><span>Número</span><span>Asunto</span><span>Responsable</span><span>Vence</span></div>
                        <div data-bim-cde-priority-queue>{queue.length ? queue.map((item) => (
                            <div key={`${item.item_type}-${item.item_id}`} className={`grid min-h-11 grid-cols-[76px_86px_minmax(0,1fr)_112px_90px] items-center border-b border-zinc-100 px-3 text-[11px] ${item.overdue ? 'bg-rose-50/60' : ''}`}>
                                <span className="text-[9px] font-semibold uppercase text-zinc-500">{ITEM_LABELS[item.item_type] || item.item_type}</span><span className="font-semibold text-zinc-800">{item.number}</span><span className="truncate text-zinc-700" title={item.title}>{item.title}</span><span className="truncate text-zinc-500" title={item.responsible_name || ''}>{item.responsible_name || 'Sin asignar'}</span><span className={item.overdue ? 'font-semibold text-rose-600' : 'text-zinc-500'}>{formatDate(item.due_at)}</span>
                            </div>
                        )) : <p className="p-4 text-xs text-zinc-500">No hay acciones pendientes en el ámbito autorizado.</p>}</div>
                    </div>
                    <div className="min-h-0 overflow-auto" data-bim-operational-notifications>
                        <div className="sticky top-0 flex h-8 items-center justify-between border-b border-zinc-200 bg-white px-3 text-[9px] font-semibold uppercase text-zinc-400"><span>Alertas BIM</span><span>{notifications.filter((item) => !item.acknowledged_at).length} pendientes</span></div>
                        {notifications.length ? notifications.map((item) => (
                            <div key={item.id} className="border-b border-zinc-100 px-3 py-2">
                                <div className="flex items-center justify-between gap-2">
                                    <span className={`border px-1.5 py-0.5 text-[9px] font-semibold uppercase ${ALERT_STYLES[item.severity] || ALERT_STYLES.warning}`}>{ALERT_LABELS[item.event_type] || item.event_type}</span>
                                    {!item.acknowledged_at ? <button type="button" onClick={() => acknowledge(item)} className="inline-flex h-6 items-center gap-1 px-1 text-[9px] font-semibold text-zinc-600 hover:text-emerald-700" aria-label={`Acusar alerta ${item.source_number}`} title="Acusar alerta"><Check className="h-3 w-3" />Acusar</button> : <span className="text-[9px] font-semibold text-emerald-700">Acusada</span>}
                                </div>
                                <p className="mt-1 truncate text-[11px] font-semibold text-zinc-800" title={item.title}>{item.source_number} · {item.title}</p>
                                <p className="mt-0.5 text-[9px] text-zinc-500">{ITEM_LABELS[item.source_type] || item.source_type} · vence {formatDate(item.due_at)} · nivel {item.escalation_level}</p>
                            </div>
                        )) : <p className="p-4 text-xs text-zinc-500">Sin alertas operacionales activas.</p>}
                    </div>
                </div>
            </div> : <div className="grid h-[calc(100%-44px)] place-items-center"><p className="text-xs text-zinc-500">{loading ? 'Cargando resumen CDE...' : message || 'Sin información CDE disponible.'}</p></div>}
            {message && dashboard ? <p className="absolute bottom-2 left-3 text-[10px] font-medium text-rose-600" role="status">{message}</p> : null}
        </section>
    );
};

export default BimCdeDashboardPanel;
