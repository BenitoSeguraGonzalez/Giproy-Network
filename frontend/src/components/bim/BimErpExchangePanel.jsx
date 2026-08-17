import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Download, RefreshCw, RotateCcw, Send } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const defaultCutoff = () => new Date().toISOString().slice(0, 16);

export default function BimErpExchangePanel({ projectId, empresaId, canManage = false, api = bimModelsApi, onDownload }) {
    const [packages, setPackages] = useState([]);
    const [cutoff, setCutoff] = useState(defaultCutoff);
    const [reason, setReason] = useState('');
    const [decisionReason, setDecisionReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');

    const load = useCallback(async () => {
        if (!projectId) return;
        try { setPackages(await api.listErpExchangePackages(projectId, empresaId)); }
        catch (error) { setMessage(error?.response?.data?.detail || 'No se pudieron cargar los paquetes ERP BIM.'); }
    }, [api, empresaId, projectId]);
    useEffect(() => { void load(); }, [load]);

    const current = useMemo(() => packages.find((item) => item.status === 'published'), [packages]);
    const generate = async () => {
        if (reason.trim().length < 5) return;
        try {
            setBusy(true); setMessage('');
            const value = await api.createErpExchangePackage(projectId, { cutoff_at: new Date(cutoff).toISOString(), justification: reason.trim() }, empresaId);
            setPackages((items) => [value, ...items]); setReason(''); setMessage(`Paquete ERP r${value.revision} generado`);
        } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo generar el paquete ERP BIM.'); }
        finally { setBusy(false); }
    };
    const transition = async (item, action) => {
        if (decisionReason.trim().length < 5) return;
        try {
            setBusy(true); setMessage('');
            const value = await api.transitionErpExchangePackage(projectId, item.id, { action, reason: decisionReason.trim(), expected_lock_version: item.lock_version }, empresaId);
            await load(); setDecisionReason(''); setMessage(action === 'publish' ? `Paquete ERP r${value.revision} publicado` : `Paquete ERP r${value.revision} revocado`);
        } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo cambiar el estado del paquete ERP BIM.'); }
        finally { setBusy(false); }
    };
    const download = async (item) => {
        const content = await api.getErpExchangeContent(projectId, item.id, empresaId);
        if (onDownload) return onDownload(content);
        const blob = new Blob([JSON.stringify(content, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob); const anchor = document.createElement('a');
        anchor.href = url; anchor.download = `giproy-bim-erp-r${item.revision}.json`; anchor.click(); URL.revokeObjectURL(url);
    };

    return <section className="flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white" data-bim-erp-exchange>
        <header className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 px-3">
            <div><h3 className="text-xs font-semibold text-zinc-900">Intercambio ERP</h3><p className="text-[10px] text-zinc-500">Avance y horas BIM · contrato pull checksum-exacto</p></div>
            <button type="button" onClick={load} className="inline-flex h-8 w-8 items-center justify-center text-zinc-500" aria-label="Actualizar paquetes ERP" title="Actualizar paquetes ERP"><RefreshCw className="h-4 w-4" /></button>
        </header>
        <div className="grid shrink-0 grid-cols-4 gap-2 border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px]">
            <div><span className="text-zinc-500">Publicado</span><strong className="ml-2 text-zinc-900" data-bim-erp-current>{current ? `r${current.revision}` : 'Ninguno'}</strong></div>
            <div><span className="text-zinc-500">Actividades</span><strong className="ml-2 text-zinc-900">{current?.activity_count || 0}</strong></div>
            <div><span className="text-zinc-500">Partes</span><strong className="ml-2 text-zinc-900">{current?.timecard_count || 0}</strong></div>
            <div><span className="text-zinc-500">Horas</span><strong className="ml-2 text-zinc-900">{current ? `${current.regular_hours + current.overtime_hours} h` : '0 h'}</strong></div>
        </div>
        {canManage ? <div className="grid shrink-0 grid-cols-[190px_minmax(260px,1fr)_36px] gap-2 border-b border-zinc-200 p-3">
            <input type="datetime-local" aria-label="Fecha de corte ERP" value={cutoff} onChange={(event) => setCutoff(event.target.value)} className="h-9 border border-zinc-300 px-2 text-xs" />
            <input aria-label="Justificación del paquete ERP" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Justificación del corte contractual" className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" />
            <button type="button" onClick={generate} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 w-9 items-center justify-center bg-[#F39200] text-white disabled:opacity-40" aria-label="Generar paquete ERP" title="Generar paquete ERP"><Send className="h-4 w-4" /></button>
        </div> : null}
        <div className="min-h-0 flex-1 overflow-y-auto">
            {packages.length ? <div className="divide-y divide-zinc-100">{packages.map((item) => <article key={item.id} className="grid grid-cols-[90px_110px_150px_1fr_150px] items-center gap-3 px-3 py-3 text-xs" data-bim-erp-package={item.id}>
                <div><strong>r{item.revision}</strong><p className="text-[10px] text-zinc-500">Proyecto R{item.project_revision}</p></div>
                <span className={`w-fit px-2 py-1 text-[10px] font-semibold ${item.status === 'published' ? 'bg-emerald-50 text-emerald-700' : item.status === 'draft' ? 'bg-amber-50 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>{item.status}</span>
                <div><strong>{item.activity_count} actividades</strong><p className="text-[10px] text-zinc-500">{item.timecard_count} partes · {item.regular_hours + item.overtime_hours} h</p></div>
                <code className="truncate text-[10px] text-zinc-500" title={item.checksum_sha256}>sha256:{item.checksum_sha256.slice(0, 12)}</code>
                <div className="flex justify-end gap-1">
                    {item.status === 'published' ? <button type="button" onClick={() => download(item)} className="inline-flex h-8 w-8 items-center justify-center text-zinc-600" aria-label={`Descargar paquete ERP r${item.revision}`} title={`Descargar paquete ERP r${item.revision}`}><Download className="h-4 w-4" /></button> : null}
                    {canManage && item.status === 'draft' ? <button type="button" onClick={() => transition(item, 'publish')} disabled={busy || decisionReason.trim().length < 5} className="inline-flex h-8 w-8 items-center justify-center text-emerald-700 disabled:opacity-30" aria-label={`Publicar paquete ERP r${item.revision}`} title={`Publicar paquete ERP r${item.revision}`}><Check className="h-4 w-4" /></button> : null}
                    {canManage && item.status === 'published' ? <button type="button" onClick={() => transition(item, 'revoke')} disabled={busy || decisionReason.trim().length < 5} className="inline-flex h-8 w-8 items-center justify-center text-red-600 disabled:opacity-30" aria-label={`Revocar paquete ERP r${item.revision}`} title={`Revocar paquete ERP r${item.revision}`}><RotateCcw className="h-4 w-4" /></button> : null}
                </div>
            </article>)}</div> : <p className="p-4 text-xs text-zinc-500">No existen paquetes ERP BIM.</p>}
        </div>
        {canManage ? <div className="shrink-0 border-t border-zinc-200 p-3"><input aria-label="Motivo de publicación ERP" value={decisionReason} onChange={(event) => setDecisionReason(event.target.value)} placeholder="Motivo para publicar o revocar" className="h-9 w-full border border-zinc-300 px-2 text-xs" /></div> : null}
        {message ? <p className="shrink-0 border-t border-zinc-100 px-3 py-2 text-[10px] font-medium text-zinc-600" role="status">{message}</p> : null}
    </section>;
}
