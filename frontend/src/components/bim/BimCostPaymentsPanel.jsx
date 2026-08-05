import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, FileClock, Plus, RefreshCw, Send, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const STATUS_LABELS = { draft: 'Borrador', submitted: 'En revisión', certified: 'Certificado', rejected: 'Rechazado' };
const money = (value, currency = 'USD') => Number(value || 0).toLocaleString('es-EC', { style: 'currency', currency });

export default function BimCostPaymentsPanel({ projectId, empresaId, api = bimModelsApi }) {
    const [contracts, setContracts] = useState([]);
    const [applications, setApplications] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ contract_id: '', application_number: '', period_start: '', period_end: '', gross_requested: '', retention_requested: '0' });
    const [decision, setDecision] = useState({ certified_gross: '', certified_retention: '0', reason: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const [contractValues, applicationValues] = await Promise.all([api.listCostContracts(projectId, empresaId), api.listPaymentApplications(projectId, empresaId)]);
            const active = contractValues.filter((item) => item.status === 'active');
            setContracts(active); setApplications(applicationValues);
            setSelectedId((current) => current || applicationValues[0]?.id || null);
            setForm((current) => ({ ...current, contract_id: current.contract_id || String(active[0]?.id || '') }));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudieron cargar las certificaciones BIM.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        if (!createOpen) return undefined;
        const close = (event) => { if (event.key === 'Escape') setCreateOpen(false); };
        window.addEventListener('keydown', close);
        return () => window.removeEventListener('keydown', close);
    }, [createOpen]);

    const selectedContract = contracts.find((item) => String(item.id) === String(form.contract_id)) || null;
    const selectedApplication = applications.find((item) => item.id === selectedId) || applications[0] || null;
    const totals = useMemo(() => applications.reduce((value, item) => ({ requested: value.requested + Number(item.net_requested || 0), certified: value.certified + Number(item.certified_net || 0) }), { requested: 0, certified: 0 }), [applications]);
    const pendingTotal = useMemo(() => applications.filter((item) => item.status === 'submitted').reduce((sum, item) => sum + Number(item.net_requested || 0), 0), [applications]);
    const netPreview = Math.max(0, Number(form.gross_requested || 0) - Number(form.retention_requested || 0));
    const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    const createApplication = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const created = await api.createPaymentApplication(projectId, { ...form, contract_id: Number(form.contract_id), gross_requested: Number(form.gross_requested), retention_requested: Number(form.retention_requested) }, empresaId);
            setApplications((current) => [created, ...current]); setSelectedId(created.id);
            setForm((current) => ({ ...current, application_number: '', period_start: '', period_end: '', gross_requested: '', retention_requested: '0' }));
            setCreateOpen(false);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear la solicitud BIM.'); }
        finally { setBusy(false); }
    };

    const submit = async () => {
        try {
            setBusy(true); setError('');
            const changed = await api.submitPaymentApplication(projectId, selectedApplication.id, { expected_lock_version: selectedApplication.lock_version }, empresaId);
            setApplications((current) => current.map((item) => item.id === changed.id ? changed : item));
            setDecision((current) => ({ ...current, certified_gross: String(changed.gross_requested), certified_retention: String(changed.retention_requested) }));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo enviar la solicitud BIM.'); }
        finally { setBusy(false); }
    };

    const decide = async (target) => {
        try {
            setBusy(true); setError('');
            const payload = { decision: target, reason: decision.reason, expected_lock_version: selectedApplication.lock_version, certified_gross: target === 'certified' ? Number(decision.certified_gross) : null, certified_retention: target === 'certified' ? Number(decision.certified_retention) : 0 };
            const changed = await api.decidePaymentApplication(projectId, selectedApplication.id, payload, empresaId);
            setApplications((current) => current.map((item) => item.id === changed.id ? changed : item)); setDecision({ certified_gross: '', certified_retention: '0', reason: '' });
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo decidir la solicitud BIM.'); }
        finally { setBusy(false); }
    };

    return (
        <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white" data-bim-cost-payments>
            <header className="flex min-h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-4"><div className="flex items-center gap-2"><FileClock className="size-4 text-orange-600" /><div><h3 className="text-xs font-semibold text-zinc-950">Solicitudes y certificaciones</h3><p className="text-[10px] text-zinc-600">Revisión económica contra contratos activos.</p></div></div><button type="button" onClick={load} aria-label="Actualizar solicitudes" className="inline-flex size-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:text-orange-700"><RefreshCw className="size-3.5" /></button></header>
            <div className="flex min-h-14 shrink-0 items-center gap-5 border-b border-zinc-200 bg-zinc-50 px-4"><div><span className="block text-[9px] text-zinc-500">Solicitado neto</span><strong className="text-xs text-zinc-950">{money(totals.requested)}</strong></div><div className="h-7 w-px bg-zinc-200" /><div><span className="block text-[9px] text-zinc-500">En revisión</span><strong className="text-xs text-amber-800">{money(pendingTotal)}</strong></div><div><span className="block text-[9px] text-zinc-500">Certificado neto</span><strong className="text-xs text-emerald-700">{money(totals.certified)}</strong></div><button type="button" onClick={() => setCreateOpen(true)} disabled={!contracts.length} className="ml-auto inline-flex h-9 items-center gap-2 rounded-md bg-orange-600 px-3 text-xs font-semibold text-white active:scale-[.97] hover:bg-orange-700 disabled:opacity-40"><Plus className="size-3.5" />Nueva solicitud</button></div>
            {error ? <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800" role="alert">{error}</div> : null}
            <div className="min-h-0 flex-1 overflow-auto" data-bim-payment-ledger><table className="w-full min-w-[62rem] border-collapse text-left text-xs"><thead className="sticky top-0 z-10 bg-white text-[10px] font-semibold text-zinc-600"><tr className="border-b border-zinc-200"><th className="w-32 px-4 py-2.5">Solicitud</th><th className="w-24 px-3 py-2.5">Estado</th><th className="w-32 px-3 py-2.5">Contrato</th><th className="px-3 py-2.5">Periodo</th><th className="w-36 px-3 py-2.5 text-right">Solicitado neto</th><th className="w-36 px-4 py-2.5 text-right">Certificado neto</th></tr></thead><tbody className="divide-y divide-zinc-200">{applications.map((item) => <tr key={item.id} onClick={() => setSelectedId(item.id)} className={`cursor-pointer ${selectedApplication?.id === item.id ? 'bg-orange-50' : 'hover:bg-zinc-50'}`}><td className="px-4 py-3 font-semibold text-zinc-950">{item.application_number}</td><td className="px-3 py-3"><span className="rounded bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-700">{STATUS_LABELS[item.status]}</span></td><td className="px-3 py-3 text-[11px] text-zinc-600">{item.contract_number}</td><td className="px-3 py-3 text-[10px] text-zinc-600">{item.period_start} → {item.period_end}</td><td className="px-3 py-3 text-right font-medium tabular-nums">{money(item.net_requested, item.currency)}</td><td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-950">{item.certified_net == null ? 'Pendiente' : money(item.certified_net, item.currency)}</td></tr>)}</tbody></table>{!applications.length ? <div className="grid min-h-48 place-items-center text-center"><div><FileClock className="mx-auto size-6 text-zinc-400" /><p className="mt-2 text-xs font-semibold text-zinc-900">Sin solicitudes de certificación</p><p className="mt-1 text-[11px] text-zinc-600">Crea una solicitud contra un contrato activo.</p></div></div> : null}</div>
            {selectedApplication?.status === 'draft' ? <div className="flex shrink-0 justify-end border-t border-zinc-200 bg-white p-3"><button type="button" onClick={submit} disabled={busy} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-4 text-xs font-semibold text-white disabled:opacity-40"><Send className="size-3.5" />Enviar a revisión</button></div> : null}
            {selectedApplication?.status === 'submitted' ? <div className="grid shrink-0 grid-cols-[8rem_8rem_minmax(16rem,1fr)_7rem_7rem] gap-2 border-t border-zinc-200 bg-white p-3"><input type="number" min="0.01" step="0.01" max={selectedApplication.gross_requested} aria-label="Bruto certificado" placeholder="Bruto certificado" value={decision.certified_gross} onChange={(event) => setDecision({ ...decision, certified_gross: event.target.value })} className="h-9 rounded-md border border-zinc-300 px-3 text-xs" /><input type="number" min="0" step="0.01" max={decision.certified_gross || undefined} aria-label="Retención certificada" placeholder="Retención" value={decision.certified_retention} onChange={(event) => setDecision({ ...decision, certified_retention: event.target.value })} className="h-9 rounded-md border border-zinc-300 px-3 text-xs" /><input aria-label="Motivo de certificación" placeholder="Motivo de la decisión" value={decision.reason} onChange={(event) => setDecision({ ...decision, reason: event.target.value })} className="h-9 rounded-md border border-zinc-300 px-3 text-xs" /><button type="button" onClick={() => decide('certified')} disabled={busy || decision.reason.trim().length < 5 || !decision.certified_gross} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-700 text-xs font-semibold text-white disabled:opacity-40"><BadgeCheck className="size-3.5" />Certificar</button><button type="button" onClick={() => decide('rejected')} disabled={busy || decision.reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-rose-200 text-xs font-semibold text-rose-700 disabled:opacity-40"><X className="size-3.5" />Rechazar</button></div> : null}
            {createOpen ? <div className="absolute inset-0 z-30 grid place-items-center bg-zinc-950/35 p-6"><form onSubmit={createApplication} className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="payment-create-title"><header className="flex min-h-14 items-center border-b border-zinc-200 px-5"><div><h3 id="payment-create-title" className="text-sm font-semibold text-zinc-950">Nueva solicitud de certificación</h3><p className="mt-0.5 text-[11px] text-zinc-600">Registra el periodo y valor solicitado contra el compromiso.</p></div><button type="button" onClick={() => setCreateOpen(false)} className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100" aria-label="Cerrar nueva solicitud"><X className="size-4" /></button></header><div className="space-y-4 p-5"><label className="block text-[11px] font-semibold text-zinc-800">Contrato activo<select autoFocus required aria-label="Contrato activo" value={form.contract_id} onChange={(event) => setField('contract_id', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs font-normal"><option value="">Seleccionar contrato activo</option>{contracts.map((item) => <option key={item.id} value={item.id}>{item.contract_number} · {item.title}</option>)}</select></label><label className="block text-[11px] font-semibold text-zinc-800">Número de solicitud<input required aria-label="Número de solicitud" value={form.application_number} onChange={(event) => setField('application_number', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label><div className="grid grid-cols-2 gap-3"><label className="text-[11px] font-semibold text-zinc-800">Periodo desde<input required type="date" aria-label="Inicio del periodo" value={form.period_start} onChange={(event) => setField('period_start', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label><label className="text-[11px] font-semibold text-zinc-800">Periodo hasta<input required type="date" min={form.period_start || undefined} aria-label="Fin del periodo" value={form.period_end} onChange={(event) => setField('period_end', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label></div><div className="grid grid-cols-2 gap-3"><label className="text-[11px] font-semibold text-zinc-800">Bruto solicitado<input required type="number" min="0.01" step="0.01" max={selectedContract?.committed_amount || undefined} aria-label="Bruto solicitado" value={form.gross_requested} onChange={(event) => setField('gross_requested', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label><label className="text-[11px] font-semibold text-zinc-800">Retención solicitada<input required type="number" min="0" step="0.01" max={form.gross_requested || undefined} aria-label="Retención solicitada" value={form.retention_requested} onChange={(event) => setField('retention_requested', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label></div><p className="text-[11px] text-zinc-600">Neto previsto: <strong>{money(netPreview, selectedContract?.currency || 'USD')}</strong>{selectedContract ? ` · compromiso ${money(selectedContract.committed_amount, selectedContract.currency)}` : ''}</p></div><footer className="flex min-h-14 items-center justify-end gap-2 border-t border-zinc-200 px-5"><button type="button" onClick={() => setCreateOpen(false)} className="h-9 px-3 text-xs font-semibold text-zinc-600">Cancelar</button><button type="submit" disabled={busy || !selectedContract} className="h-9 rounded-md bg-orange-600 px-4 text-xs font-semibold text-white disabled:opacity-40">{busy ? 'Creando…' : 'Crear solicitud'}</button></footer></form></div> : null}
        </section>
    );
}
