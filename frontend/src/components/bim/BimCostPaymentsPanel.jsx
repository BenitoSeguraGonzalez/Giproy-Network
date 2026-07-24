import { useCallback, useEffect, useMemo, useState } from 'react';
import { BadgeCheck, FileClock, RefreshCw, Send, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const STATUS_LABELS = { draft: 'Borrador', submitted: 'En revisión', certified: 'Certificado', rejected: 'Rechazado' };

export default function BimCostPaymentsPanel({ projectId, empresaId, api = bimModelsApi }) {
    const [contracts, setContracts] = useState([]);
    const [applications, setApplications] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ contract_id: '', application_number: '', period_start: '', period_end: '', gross_requested: '', retention_requested: '0' });
    const [decision, setDecision] = useState({ certified_gross: '', certified_retention: '0', reason: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const [contractValues, applicationValues] = await Promise.all([api.listCostContracts(projectId, empresaId), api.listPaymentApplications(projectId, empresaId)]);
            const active = contractValues.filter((item) => item.status === 'active');
            setContracts(active); setApplications(applicationValues);
            setSelectedId((current) => current || applicationValues[0]?.id || null);
            setForm((current) => ({ ...current, contract_id: current.contract_id || String(active[0]?.id || '') }));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudieron cargar las solicitudes de pago BIM.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);
    const selectedContract = contracts.find((item) => String(item.id) === String(form.contract_id)) || null;
    const selectedApplication = applications.find((item) => item.id === selectedId) || applications[0] || null;
    const totals = useMemo(() => applications.reduce((value, item) => ({ requested: value.requested + Number(item.net_requested || 0), certified: value.certified + Number(item.certified_net || 0) }), { requested: 0, certified: 0 }), [applications]);
    const netPreview = Math.max(0, Number(form.gross_requested || 0) - Number(form.retention_requested || 0));
    const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    const createApplication = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const created = await api.createPaymentApplication(projectId, { ...form, contract_id: Number(form.contract_id), gross_requested: Number(form.gross_requested), retention_requested: Number(form.retention_requested) }, empresaId);
            setApplications((current) => [created, ...current]); setSelectedId(created.id);
            setForm((current) => ({ ...current, application_number: '', period_start: '', period_end: '', gross_requested: '', retention_requested: '0' }));
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

    return <section className="bim-responsive-container flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white" data-bim-cost-payments>
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-3"><div className="flex items-center gap-2"><FileClock size={16} className="text-[#F39200]" /><div><h3 className="text-xs font-semibold">Solicitudes y certificaciones BIM</h3><p className="text-[10px] text-zinc-500">Pagos gobernados contra contratos activos · sin ejecución contable</p></div></div><div className="flex items-center gap-4 text-[10px]"><span>Solicitado neto <strong>{totals.requested.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}</strong></span><span>Certificado neto <strong>{totals.certified.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}</strong></span><button type="button" onClick={load} aria-label="Actualizar solicitudes" title="Actualizar" className="grid h-8 w-8 place-items-center border border-zinc-200 text-zinc-600"><RefreshCw size={14} /></button></div></header>
        <div className="bim-responsive-workbench flex-1" style={{ '--bim-workbench-sidebar': '390px' }}>
            <form onSubmit={createApplication} className="grid content-start gap-2 overflow-y-auto border-r border-zinc-200 p-3">
                <h4 className="text-xs font-semibold">Nueva solicitud</h4>
                <select required aria-label="Contrato activo" value={form.contract_id} onChange={(event) => setField('contract_id', event.target.value)} className="h-9 border border-zinc-300 px-2 text-xs"><option value="">Seleccionar contrato activo</option>{contracts.map((item) => <option key={item.id} value={item.id}>{item.contract_number} · {item.title}</option>)}</select>
                <input required aria-label="Número de solicitud" placeholder="PAY-001" value={form.application_number} onChange={(event) => setField('application_number', event.target.value)} className="h-9 border border-zinc-300 px-2 text-xs" />
                <div className="grid grid-cols-2 gap-2"><label className="text-[10px] text-zinc-500">Periodo desde<input required type="date" aria-label="Inicio del periodo" value={form.period_start} onChange={(event) => setField('period_start', event.target.value)} className="mt-1 h-9 w-full border border-zinc-300 px-2 text-xs text-zinc-800" /></label><label className="text-[10px] text-zinc-500">Periodo hasta<input required type="date" min={form.period_start || undefined} aria-label="Fin del periodo" value={form.period_end} onChange={(event) => setField('period_end', event.target.value)} className="mt-1 h-9 w-full border border-zinc-300 px-2 text-xs text-zinc-800" /></label></div>
                <div className="grid grid-cols-2 gap-2"><input required type="number" min="0.01" step="0.01" max={selectedContract?.committed_amount || undefined} aria-label="Bruto solicitado" placeholder="Bruto" value={form.gross_requested} onChange={(event) => setField('gross_requested', event.target.value)} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><input required type="number" min="0" step="0.01" max={form.gross_requested || undefined} aria-label="Retención solicitada" placeholder="Retención" value={form.retention_requested} onChange={(event) => setField('retention_requested', event.target.value)} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /></div>
                <p className="bg-zinc-50 p-2 text-[10px] text-zinc-600">Neto previsto: <strong>{netPreview.toLocaleString('es-EC', { style: 'currency', currency: selectedContract?.currency || 'USD' })}</strong>{selectedContract ? ` · compromiso ${Number(selectedContract.committed_amount).toLocaleString('es-EC', { style: 'currency', currency: selectedContract.currency })}` : ''}</p>
                <button disabled={busy || !selectedContract} className="h-9 bg-zinc-800 text-xs font-semibold text-white disabled:opacity-40">Crear solicitud</button>{error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
            </form>
            <main className="flex min-w-0 flex-col overflow-hidden" data-bim-payment-ledger>
                <div className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto">{applications.map((item) => <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={`grid w-full grid-cols-[130px_130px_minmax(0,1fr)_140px_140px_80px] items-center gap-3 px-4 py-3 text-left text-xs ${selectedApplication?.id === item.id ? 'bg-orange-50' : 'hover:bg-zinc-50'}`}><div><strong>{item.application_number}</strong><p className="text-[10px] uppercase text-zinc-500">{STATUS_LABELS[item.status]}</p></div><span className="text-[10px] text-zinc-500">{item.contract_number}</span><span className="truncate text-[10px] text-zinc-500">{item.period_start} · {item.period_end}</span><span className="text-right">Neto {Number(item.net_requested).toLocaleString('es-EC', { style: 'currency', currency: item.currency })}</span><strong className="text-right">{item.certified_net == null ? 'Pendiente' : Number(item.certified_net).toLocaleString('es-EC', { style: 'currency', currency: item.currency })}</strong><span className="text-right text-[10px]">v{item.lock_version}</span></button>)}</div>
                {selectedApplication?.status === 'draft' ? <div className="flex shrink-0 justify-end border-t border-zinc-200 p-3"><button type="button" onClick={submit} disabled={busy} className="inline-flex h-9 w-32 items-center justify-center gap-1 bg-zinc-800 text-[10px] font-semibold text-white disabled:opacity-40"><Send size={13} />Enviar</button></div> : null}
                {selectedApplication?.status === 'submitted' ? <div className="grid shrink-0 grid-cols-[130px_130px_minmax(220px,1fr)_100px_100px] gap-2 border-t border-zinc-200 p-3"><input type="number" min="0.01" step="0.01" max={selectedApplication.gross_requested} aria-label="Bruto certificado" placeholder="Bruto cert." value={decision.certified_gross} onChange={(event) => setDecision({ ...decision, certified_gross: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><input type="number" min="0" step="0.01" max={decision.certified_gross || undefined} aria-label="Retención certificada" placeholder="Retención" value={decision.certified_retention} onChange={(event) => setDecision({ ...decision, certified_retention: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><input aria-label="Motivo de certificación" placeholder="Motivo de decisión" value={decision.reason} onChange={(event) => setDecision({ ...decision, reason: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><button type="button" onClick={() => decide('certified')} disabled={busy || decision.reason.trim().length < 5 || !decision.certified_gross} className="inline-flex h-9 items-center justify-center gap-1 bg-emerald-700 text-[10px] font-semibold text-white disabled:opacity-40"><BadgeCheck size={13} />Certificar</button><button type="button" onClick={() => decide('rejected')} disabled={busy || decision.reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1 border border-red-200 text-[10px] font-semibold text-red-700 disabled:opacity-40"><X size={13} />Rechazar</button></div> : null}
            </main>
        </div>
    </section>;
}
