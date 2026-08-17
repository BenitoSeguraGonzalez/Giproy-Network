import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Copy, Power, RefreshCw, RotateCw, Send } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const hostOf = (value) => { try { return new URL(value).host; } catch { return value; } };

export default function BimIntegrationGatewayPanel({ projectId, empresaId, canManage = false, api = bimModelsApi, onCopy }) {
    const [subscriptions, setSubscriptions] = useState([]);
    const [deliveries, setDeliveries] = useState([]);
    const [label, setLabel] = useState('');
    const [targetUrl, setTargetUrl] = useState('');
    const [reason, setReason] = useState('');
    const [secretOnce, setSecretOnce] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            const [subscriptionRows, deliveryRows] = await Promise.all([api.listIntegrationSubscriptions(projectId, empresaId), api.listIntegrationDeliveries(projectId, empresaId)]);
            setSubscriptions(subscriptionRows); setDeliveries(deliveryRows);
        } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo cargar el gateway BIM.'); }
    }, [api, empresaId, projectId]);
    useEffect(() => { void load(); }, [load]);
    const activeCount = useMemo(() => subscriptions.filter((item) => item.status === 'active').length, [subscriptions]);
    const pendingCount = useMemo(() => deliveries.filter((item) => ['pending', 'retry'].includes(item.status)).length, [deliveries]);
    const create = async () => {
        if (label.trim().length < 3 || !targetUrl.startsWith('https://')) return;
        try {
            setBusy(true); setMessage('');
            const value = await api.createIntegrationSubscription(projectId, { label: label.trim(), target_url: targetUrl.trim(), event_types: ['erp.package.published'] }, empresaId);
            setSecretOnce(value.secret_once || ''); setLabel(''); setTargetUrl(''); await load(); setMessage('Conector BIM creado');
        } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo crear el conector BIM.'); }
        finally { setBusy(false); }
    };
    const transition = async (item) => {
        if (reason.trim().length < 5) return;
        try {
            setBusy(true); setMessage('');
            await api.transitionIntegrationSubscription(projectId, item.id, { status: item.status === 'active' ? 'disabled' : 'active', expected_lock_version: item.lock_version, reason: reason.trim() }, empresaId);
            setReason(''); await load(); setMessage('Estado del conector actualizado');
        } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo actualizar el conector BIM.'); }
        finally { setBusy(false); }
    };
    const retry = async (item) => {
        try { setBusy(true); setMessage(''); await api.retryIntegrationDelivery(projectId, item.id, empresaId); await load(); setMessage('Entrega BIM procesada'); }
        catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo reintentar la entrega BIM.'); }
        finally { setBusy(false); }
    };
    const copySecret = async () => {
        if (onCopy) onCopy(secretOnce); else await navigator.clipboard.writeText(secretOnce);
        setMessage('Secreto copiado');
    };
    return <section className="flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white" data-bim-integration-gateway>
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 px-3">
            <div><h3 className="text-xs font-semibold text-zinc-900">Integraciones</h3><p className="text-[10px] text-zinc-500">Webhooks firmados · outbox recuperable</p></div>
            <button type="button" onClick={load} className="inline-flex h-8 w-8 items-center justify-center text-zinc-500" aria-label="Actualizar integraciones BIM" title="Actualizar integraciones BIM"><RefreshCw className="h-4 w-4" /></button>
        </header>
        <div className="grid shrink-0 grid-cols-3 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px]">
            <div><span className="text-zinc-500">Activos</span><strong className="ml-2 text-zinc-900" data-bim-integration-active>{activeCount}</strong></div>
            <div><span className="text-zinc-500">Entregas</span><strong className="ml-2 text-zinc-900">{deliveries.length}</strong></div>
            <div><span className="text-zinc-500">Pendientes</span><strong className="ml-2 text-zinc-900">{pendingCount}</strong></div>
        </div>
        {canManage ? <div className="grid shrink-0 grid-cols-[180px_minmax(320px,1fr)_36px] gap-2 border-b border-zinc-200 p-3">
            <input value={label} onChange={(event) => setLabel(event.target.value)} aria-label="Nombre del conector BIM" placeholder="Nombre del conector" className="h-9 border border-zinc-300 px-2 text-xs" />
            <input value={targetUrl} onChange={(event) => setTargetUrl(event.target.value)} aria-label="URL HTTPS del webhook BIM" placeholder="https://erp.empresa.com/webhooks/giproy" className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" />
            <button type="button" onClick={create} disabled={busy || label.trim().length < 3 || !targetUrl.startsWith('https://')} className="inline-flex h-9 w-9 items-center justify-center bg-[#F39200] text-white disabled:opacity-40" aria-label="Crear conector BIM" title="Crear conector BIM"><Send className="h-4 w-4" /></button>
        </div> : null}
        {secretOnce ? <div className="flex h-11 shrink-0 items-center gap-3 border-b border-amber-200 bg-amber-50 px-3 text-[10px] text-amber-900" data-bim-integration-secret><strong>Secreto único</strong><code className="min-w-0 flex-1 truncate">{secretOnce}</code><button type="button" onClick={copySecret} className="inline-flex h-8 w-8 items-center justify-center" aria-label="Copiar secreto del webhook BIM" title="Copiar secreto del webhook BIM"><Copy className="h-4 w-4" /></button></div> : null}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(480px,0.9fr)_minmax(620px,1.1fr)] divide-x divide-zinc-200 overflow-hidden">
            <div className="min-h-0 overflow-y-auto">
                <div className="border-b border-zinc-100 px-3 py-2 text-[10px] font-semibold uppercase text-zinc-500">Conectores</div>
                {subscriptions.length ? subscriptions.map((item) => <article key={item.id} className="grid grid-cols-[minmax(180px,1fr)_100px_40px] items-center gap-2 border-b border-zinc-100 px-3 py-3 text-xs" data-bim-integration-subscription={item.id}>
                    <div className="min-w-0"><strong className="block truncate">{item.label}</strong><p className="truncate text-[10px] text-zinc-500" title={item.target_url}>{hostOf(item.target_url)} · …{item.secret_hint}</p></div>
                    <span className={`w-fit px-2 py-1 text-[10px] font-semibold ${item.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-zinc-100 text-zinc-600'}`}>{item.status}</span>
                    {canManage ? <button type="button" onClick={() => transition(item)} disabled={busy || reason.trim().length < 5} className="inline-flex h-8 w-8 items-center justify-center text-zinc-600 disabled:opacity-30" aria-label={`${item.status === 'active' ? 'Desactivar' : 'Activar'} conector ${item.label}`} title={`${item.status === 'active' ? 'Desactivar' : 'Activar'} conector`}><Power className="h-4 w-4" /></button> : null}
                </article>) : <p className="p-4 text-xs text-zinc-500">No existen conectores BIM.</p>}
            </div>
            <div className="min-h-0 overflow-y-auto">
                <div className="border-b border-zinc-100 px-3 py-2 text-[10px] font-semibold uppercase text-zinc-500">Entregas</div>
                {deliveries.length ? deliveries.map((item) => <article key={item.id} className="grid grid-cols-[minmax(190px,1fr)_90px_100px_40px] items-center gap-2 border-b border-zinc-100 px-3 py-3 text-xs" data-bim-integration-delivery={item.id}>
                    <div className="min-w-0"><strong className="block truncate">{item.event_type}</strong><code className="text-[10px] text-zinc-500">{item.event_id.slice(0, 12)}</code></div>
                    <span className={`w-fit px-2 py-1 text-[10px] font-semibold ${item.status === 'delivered' ? 'bg-emerald-50 text-emerald-700' : item.status === 'dead' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{item.status}</span>
                    <span className="text-[10px] text-zinc-500">{item.attempt_count}/{item.max_attempts}{item.last_http_status ? ` · HTTP ${item.last_http_status}` : ''}</span>
                    {canManage && item.status !== 'delivered' ? <button type="button" onClick={() => retry(item)} disabled={busy} className="inline-flex h-8 w-8 items-center justify-center text-zinc-600 disabled:opacity-30" aria-label={`Reintentar entrega ${item.id}`} title="Reintentar entrega"><RotateCw className="h-4 w-4" /></button> : null}
                </article>) : <p className="p-4 text-xs text-zinc-500">No existen entregas BIM.</p>}
            </div>
        </div>
        {canManage ? <div className="shrink-0 border-t border-zinc-200 p-3"><input value={reason} onChange={(event) => setReason(event.target.value)} aria-label="Motivo de cambio del conector BIM" placeholder="Motivo para activar o desactivar" className="h-9 w-full border border-zinc-300 px-2 text-xs" /></div> : null}
        {message ? <p className="shrink-0 border-t border-zinc-100 px-3 py-2 text-[10px] font-medium text-zinc-600" role="status">{message}</p> : null}
    </section>;
}
