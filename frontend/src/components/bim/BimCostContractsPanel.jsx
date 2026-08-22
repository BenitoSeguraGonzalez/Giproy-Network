import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, FileSignature, Plus, RefreshCw, X, XCircle } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const STATUS_LABELS = { draft: 'Borrador', active: 'Activo', closed: 'Cerrado', cancelled: 'Cancelado' };
const money = (value, currency = 'USD') => Number(value || 0).toLocaleString('es-EC', { style: 'currency', currency });

export default function BimCostContractsPanel({ projectId, empresaId, api = bimModelsApi }) {
    const [estimates, setEstimates] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ estimate_id: '', contract_number: '', title: '', counterparty_name: '', committed_amount: '', start_date: '', end_date: '' });
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const [estimateValues, contractValues] = await Promise.all([api.listCostEstimates(projectId, empresaId), api.listCostContracts(projectId, empresaId)]);
            const approved = estimateValues.filter((item) => item.status === 'approved');
            setEstimates(approved); setContracts(contractValues);
            setSelectedId((current) => current || contractValues[0]?.id || null);
            setForm((current) => ({ ...current, estimate_id: current.estimate_id || String(approved[0]?.id || '') }));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudieron cargar los contratos BIM.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        if (!createOpen) return undefined;
        const close = (event) => { if (event.key === 'Escape') setCreateOpen(false); };
        window.addEventListener('keydown', close);
        return () => window.removeEventListener('keydown', close);
    }, [createOpen]);

    const selectedEstimate = estimates.find((item) => String(item.id) === String(form.estimate_id)) || null;
    const selectedContract = contracts.find((item) => item.id === selectedId) || contracts[0] || null;
    const committedTotal = useMemo(() => contracts.filter((item) => item.status !== 'cancelled').reduce((sum, item) => sum + Number(item.committed_amount || 0), 0), [contracts]);
    const activeTotal = useMemo(() => contracts.filter((item) => item.status === 'active').reduce((sum, item) => sum + Number(item.committed_amount || 0), 0), [contracts]);
    const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    const createContract = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const created = await api.createCostContract(projectId, { ...form, estimate_id: Number(form.estimate_id), committed_amount: Number(form.committed_amount) }, empresaId);
            setContracts((current) => [created, ...current]); setSelectedId(created.id);
            setForm((current) => ({ ...current, contract_number: '', title: '', counterparty_name: '', committed_amount: '', start_date: '', end_date: '' }));
            setCreateOpen(false);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear el contrato BIM.'); }
        finally { setBusy(false); }
    };

    const transition = async (targetStatus) => {
        if (!selectedContract) return;
        try {
            setBusy(true); setError('');
            const changed = await api.transitionCostContract(projectId, selectedContract.id, { target_status: targetStatus, reason, expected_lock_version: selectedContract.lock_version }, empresaId);
            setContracts((current) => current.map((item) => item.id === changed.id ? changed : item)); setReason('');
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo cambiar el estado contractual.'); }
        finally { setBusy(false); }
    };

    return (
        <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white" data-bim-cost-contracts>
            <header className="flex min-h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-4"><div className="flex items-center gap-2"><FileSignature className="size-4 text-orange-600" /><div><h3 className="text-xs font-semibold text-zinc-950">Compromisos contractuales</h3><p className="text-[10px] text-zinc-600">Contratos sobre estimaciones aprobadas.</p></div></div><button type="button" onClick={load} aria-label="Actualizar contratos" className="inline-flex size-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:text-orange-700"><RefreshCw className="size-3.5" /></button></header>
            <div className="flex min-h-14 shrink-0 items-center gap-5 border-b border-zinc-200 bg-zinc-50 px-4"><div><span className="block text-[9px] text-zinc-500">Comprometido total</span><strong className="text-xs text-zinc-950">{money(committedTotal)}</strong></div><div className="h-7 w-px bg-zinc-200" /><div><span className="block text-[9px] text-zinc-500">Contratos activos</span><strong className="text-xs text-zinc-950">{contracts.filter((item) => item.status === 'active').length}</strong></div><div><span className="block text-[9px] text-zinc-500">Compromiso activo</span><strong className="text-xs text-zinc-950">{money(activeTotal)}</strong></div><button type="button" onClick={() => setCreateOpen(true)} disabled={!estimates.length} className="ml-auto inline-flex h-9 items-center gap-2 rounded-md bg-orange-600 px-3 text-xs font-semibold text-white active:scale-[.97] hover:bg-orange-700 disabled:opacity-40"><Plus className="size-3.5" />Nuevo compromiso</button></div>
            {error ? <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800" role="alert">{error}</div> : null}
            <div className="min-h-0 flex-1 overflow-auto" data-bim-contract-ledger><table className="w-full min-w-[58rem] border-collapse text-left text-xs"><thead className="sticky top-0 z-10 bg-white text-[10px] font-semibold text-zinc-600"><tr className="border-b border-zinc-200"><th className="w-32 px-4 py-2.5">Contrato</th><th className="w-24 px-3 py-2.5">Estado</th><th className="px-3 py-2.5">Objeto y contraparte</th><th className="w-32 px-3 py-2.5">Estimación</th><th className="w-40 px-3 py-2.5">Vigencia</th><th className="w-36 px-4 py-2.5 text-right">Comprometido</th></tr></thead><tbody className="divide-y divide-zinc-200">{contracts.map((contract) => <tr key={contract.id} onClick={() => setSelectedId(contract.id)} className={`cursor-pointer ${selectedContract?.id === contract.id ? 'bg-orange-50' : 'hover:bg-zinc-50'}`}><td className="px-4 py-3 font-semibold text-zinc-950">{contract.contract_number}</td><td className="px-3 py-3"><span className="rounded bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-700">{STATUS_LABELS[contract.status]}</span></td><td className="min-w-0 px-3 py-3"><p className="truncate font-semibold text-zinc-900">{contract.title}</p><p className="mt-0.5 truncate text-[10px] text-zinc-600">{contract.counterparty_name}</p></td><td className="px-3 py-3 text-[11px] text-zinc-600">{contract.estimate_revision}</td><td className="px-3 py-3 text-[10px] text-zinc-600">{contract.start_date} → {contract.end_date}</td><td className="px-4 py-3 text-right font-semibold tabular-nums text-zinc-950">{money(contract.committed_amount, contract.currency)}</td></tr>)}</tbody></table>{!contracts.length ? <div className="grid min-h-48 place-items-center text-center"><div><FileSignature className="mx-auto size-6 text-zinc-400" /><p className="mt-2 text-xs font-semibold text-zinc-900">Sin compromisos contractuales</p><p className="mt-1 text-[11px] text-zinc-600">Crea el primer contrato desde una estimación aprobada.</p></div></div> : null}</div>
            {selectedContract && !['closed', 'cancelled'].includes(selectedContract.status) ? <div className="grid shrink-0 grid-cols-[minmax(16rem,1fr)_7rem_7rem] gap-2 border-t border-zinc-200 bg-white p-3"><input aria-label="Motivo de transición contractual" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo de la transición" className="h-9 rounded-md border border-zinc-300 px-3 text-xs" />{selectedContract.status === 'draft' ? <button type="button" onClick={() => transition('active')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-700 text-xs font-semibold text-white disabled:opacity-40"><CheckCircle2 className="size-3.5" />Activar</button> : <button type="button" onClick={() => transition('closed')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-zinc-900 text-xs font-semibold text-white disabled:opacity-40"><XCircle className="size-3.5" />Cerrar</button>}<button type="button" onClick={() => transition('cancelled')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-rose-200 text-xs font-semibold text-rose-700 disabled:opacity-40"><Ban className="size-3.5" />Cancelar</button></div> : null}
            {createOpen ? <div className="absolute inset-0 z-30 grid place-items-center bg-zinc-950/35 p-6"><form onSubmit={createContract} className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="contract-create-title"><header className="flex min-h-14 items-center border-b border-zinc-200 px-5"><div><h3 id="contract-create-title" className="text-sm font-semibold text-zinc-950">Nuevo compromiso contractual</h3><p className="mt-0.5 text-[11px] text-zinc-600">Se vinculará a una estimación 5D aprobada.</p></div><button type="button" onClick={() => setCreateOpen(false)} className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100" aria-label="Cerrar nuevo compromiso"><X className="size-4" /></button></header><div className="space-y-4 p-5"><label className="block text-[11px] font-semibold text-zinc-800">Estimación aprobada<select autoFocus required aria-label="Estimación aprobada" value={form.estimate_id} onChange={(event) => setField('estimate_id', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs font-normal"><option value="">Seleccionar estimación</option>{estimates.map((item) => <option key={item.id} value={item.id}>{item.revision} · {money(item.subtotal, item.currency)}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="text-[11px] font-semibold text-zinc-800">Número<input required aria-label="Número de contrato" value={form.contract_number} onChange={(event) => setField('contract_number', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label><label className="text-[11px] font-semibold text-zinc-800">Importe comprometido<input required type="number" min="0.01" step="0.01" max={selectedEstimate?.subtotal || undefined} aria-label="Importe comprometido" value={form.committed_amount} onChange={(event) => setField('committed_amount', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label></div><label className="block text-[11px] font-semibold text-zinc-800">Objeto<input required aria-label="Objeto del contrato" value={form.title} onChange={(event) => setField('title', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label><label className="block text-[11px] font-semibold text-zinc-800">Contraparte<input required aria-label="Contraparte contractual" value={form.counterparty_name} onChange={(event) => setField('counterparty_name', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label><div className="grid grid-cols-2 gap-3"><label className="text-[11px] font-semibold text-zinc-800">Inicio<input required type="date" aria-label="Fecha inicial" value={form.start_date} onChange={(event) => setField('start_date', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label><label className="text-[11px] font-semibold text-zinc-800">Fin<input required type="date" min={form.start_date || undefined} aria-label="Fecha final" value={form.end_date} onChange={(event) => setField('end_date', event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label></div>{selectedEstimate ? <p className="text-[11px] text-zinc-600">Límite aprobado: <strong>{money(selectedEstimate.subtotal, selectedEstimate.currency)}</strong> · {selectedEstimate.revision}</p> : null}</div><footer className="flex min-h-14 items-center justify-end gap-2 border-t border-zinc-200 px-5"><button type="button" onClick={() => setCreateOpen(false)} className="h-9 px-3 text-xs font-semibold text-zinc-600">Cancelar</button><button type="submit" disabled={busy || !selectedEstimate} className="h-9 rounded-md bg-orange-600 px-4 text-xs font-semibold text-white disabled:opacity-40">{busy ? 'Creando…' : 'Crear contrato'}</button></footer></form></div> : null}
        </section>
    );
}
