import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, CheckCircle2, FileSignature, RefreshCw, XCircle } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const STATUS_LABELS = { draft: 'Borrador', active: 'Activo', closed: 'Cerrado', cancelled: 'Cancelado' };

export default function BimCostContractsPanel({ projectId, empresaId, api = bimModelsApi }) {
    const [estimates, setEstimates] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ estimate_id: '', contract_number: '', title: '', counterparty_name: '', committed_amount: '', start_date: '', end_date: '' });
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

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
    const selectedEstimate = estimates.find((item) => String(item.id) === String(form.estimate_id)) || null;
    const selectedContract = contracts.find((item) => item.id === selectedId) || contracts[0] || null;
    const committedTotal = useMemo(() => contracts.filter((item) => item.status !== 'cancelled').reduce((sum, item) => sum + Number(item.committed_amount || 0), 0), [contracts]);
    const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    const createContract = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const created = await api.createCostContract(projectId, { ...form, estimate_id: Number(form.estimate_id), committed_amount: Number(form.committed_amount) }, empresaId);
            setContracts((current) => [created, ...current]); setSelectedId(created.id);
            setForm((current) => ({ ...current, contract_number: '', title: '', counterparty_name: '', committed_amount: '', start_date: '', end_date: '' }));
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

    return <section className="bim-responsive-container flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white" data-bim-cost-contracts>
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-3">
            <div className="flex items-center gap-2"><FileSignature size={16} className="text-[#F39200]" /><div><h3 className="text-xs font-semibold">Contratos BIM de coste</h3><p className="text-[10px] text-zinc-500">Compromisos sobre estimaciones aprobadas · dominio BIM aislado</p></div></div>
            <div className="flex items-center gap-3 text-[10px]"><span>Comprometido <strong>{committedTotal.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}</strong></span><button type="button" onClick={load} aria-label="Actualizar contratos" title="Actualizar" className="grid h-8 w-8 place-items-center border border-zinc-200 text-zinc-600"><RefreshCw size={14} /></button></div>
        </header>
        <div className="bim-responsive-workbench flex-1" style={{ '--bim-workbench-sidebar': '390px' }}>
            <form onSubmit={createContract} className="grid content-start gap-2 overflow-y-auto border-r border-zinc-200 p-3">
                <h4 className="text-xs font-semibold">Nuevo compromiso</h4>
                <select required aria-label="Estimación aprobada" value={form.estimate_id} onChange={(event) => setField('estimate_id', event.target.value)} className="h-9 w-full border border-zinc-300 px-2 text-xs"><option value="">Seleccionar estimación</option>{estimates.map((item) => <option key={item.id} value={item.id}>{item.revision} · {Number(item.subtotal).toLocaleString('es-EC', { style: 'currency', currency: item.currency })}</option>)}</select>
                <div className="grid grid-cols-2 gap-2"><input required aria-label="Número de contrato" placeholder="CTR-001" value={form.contract_number} onChange={(event) => setField('contract_number', event.target.value)} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><input required type="number" min="0.01" step="0.01" max={selectedEstimate?.subtotal || undefined} aria-label="Importe comprometido" placeholder="Importe" value={form.committed_amount} onChange={(event) => setField('committed_amount', event.target.value)} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /></div>
                <input required aria-label="Objeto del contrato" placeholder="Objeto del contrato" value={form.title} onChange={(event) => setField('title', event.target.value)} className="h-9 w-full border border-zinc-300 px-2 text-xs" />
                <input required aria-label="Contraparte contractual" placeholder="Contraparte contractual" value={form.counterparty_name} onChange={(event) => setField('counterparty_name', event.target.value)} className="h-9 w-full border border-zinc-300 px-2 text-xs" />
                <div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-zinc-500">Inicio<input required type="date" aria-label="Fecha inicial" value={form.start_date} onChange={(event) => setField('start_date', event.target.value)} className="mt-1 h-9 w-full border border-zinc-300 px-2 text-xs text-zinc-800" /></label><label className="text-[10px] text-zinc-500">Fin<input required type="date" min={form.start_date || undefined} aria-label="Fecha final" value={form.end_date} onChange={(event) => setField('end_date', event.target.value)} className="mt-1 h-9 w-full border border-zinc-300 px-2 text-xs text-zinc-800" /></label></div>
                {selectedEstimate ? <p className="bg-zinc-50 p-2 text-[10px] text-zinc-600">Límite aprobado: <strong>{Number(selectedEstimate.subtotal).toLocaleString('es-EC', { style: 'currency', currency: selectedEstimate.currency })}</strong> · {selectedEstimate.revision}</p> : null}
                <button disabled={busy || !selectedEstimate} className="h-9 bg-zinc-800 text-xs font-semibold text-white disabled:opacity-40">Crear contrato</button>
                {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
            </form>
            <main className="flex min-w-0 flex-col overflow-hidden" data-bim-contract-ledger>
                <div className="min-h-0 flex-1 overflow-y-auto divide-y divide-zinc-100">{contracts.map((contract) => <button type="button" key={contract.id} onClick={() => setSelectedId(contract.id)} className={`grid w-full grid-cols-[130px_minmax(0,1fr)_180px_150px_100px] items-center gap-3 px-4 py-3 text-left text-xs ${selectedContract?.id === contract.id ? 'bg-orange-50' : 'bg-white hover:bg-zinc-50'}`}><div><strong>{contract.contract_number}</strong><p className="text-[10px] uppercase text-zinc-500">{STATUS_LABELS[contract.status]}</p></div><div className="min-w-0"><strong className="block truncate">{contract.title}</strong><p className="truncate text-[10px] text-zinc-500">{contract.counterparty_name}</p></div><span className="truncate text-[10px] text-zinc-500">Estimación {contract.estimate_revision}</span><strong className="text-right">{Number(contract.committed_amount).toLocaleString('es-EC', { style: 'currency', currency: contract.currency })}</strong><span className="text-right text-[10px]">v{contract.lock_version}</span></button>)}</div>
                {selectedContract && !['closed', 'cancelled'].includes(selectedContract.status) ? <div className="grid shrink-0 grid-cols-[minmax(240px,1fr)_repeat(2,105px)] gap-2 border-t border-zinc-200 bg-white p-3"><input aria-label="Motivo de transición contractual" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo de transición" className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" />{selectedContract.status === 'draft' ? <button type="button" onClick={() => transition('active')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1 bg-emerald-700 text-[10px] font-semibold text-white disabled:opacity-40"><CheckCircle2 size={13} />Activar</button> : <button type="button" onClick={() => transition('closed')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1 bg-zinc-800 text-[10px] font-semibold text-white disabled:opacity-40"><XCircle size={13} />Cerrar</button>}<button type="button" onClick={() => transition('cancelled')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1 border border-red-200 text-[10px] font-semibold text-red-700 disabled:opacity-40"><Ban size={13} />Cancelar</button></div> : null}
            </main>
        </div>
    </section>;
}
