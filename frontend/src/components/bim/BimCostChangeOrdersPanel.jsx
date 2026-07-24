import { useCallback, useEffect, useMemo, useState } from 'react';
import { Ban, Check, GitPullRequestArrow, RefreshCw, Send, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const STATUS_LABELS = { potential: 'Potencial', submitted: 'En revisión', approved: 'Aprobada', rejected: 'Rechazada', cancelled: 'Cancelada' };

export default function BimCostChangeOrdersPanel({ projectId, empresaId, api = bimModelsApi }) {
    const [contracts, setContracts] = useState([]);
    const [changes, setChanges] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ contract_id: '', change_number: '', title: '', description: '', requested_cost_delta: '', requested_schedule_days: '0' });
    const [action, setAction] = useState({ reason: '', approved_cost_delta: '', approved_schedule_days: '0' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const [contractValues, changeValues] = await Promise.all([api.listCostContracts(projectId, empresaId), api.listChangeOrders(projectId, empresaId)]);
            const active = contractValues.filter((item) => item.status === 'active');
            setContracts(active); setChanges(changeValues); setSelectedId((current) => current || changeValues[0]?.id || null);
            setForm((current) => ({ ...current, contract_id: current.contract_id || String(active[0]?.id || '') }));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudieron cargar las órdenes de cambio BIM.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);
    const selectedContract = contracts.find((item) => String(item.id) === String(form.contract_id)) || null;
    const selectedChange = changes.find((item) => item.id === selectedId) || changes[0] || null;
    const approvedDelta = useMemo(() => changes.filter((item) => item.status === 'approved').reduce((sum, item) => sum + Number(item.approved_cost_delta || 0), 0), [changes]);
    const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

    const createChange = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const created = await api.createChangeOrder(projectId, { ...form, contract_id: Number(form.contract_id), requested_cost_delta: Number(form.requested_cost_delta), requested_schedule_days: Number(form.requested_schedule_days) }, empresaId);
            setChanges((current) => [created, ...current]); setSelectedId(created.id);
            setForm((current) => ({ ...current, change_number: '', title: '', description: '', requested_cost_delta: '', requested_schedule_days: '0' }));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear la orden de cambio BIM.'); }
        finally { setBusy(false); }
    };

    const transition = async (targetStatus) => {
        try {
            setBusy(true); setError('');
            const changed = await api.transitionChangeOrder(projectId, selectedChange.id, { target_status: targetStatus, reason: action.reason, expected_lock_version: selectedChange.lock_version }, empresaId);
            setChanges((current) => current.map((item) => item.id === changed.id ? changed : item));
            setAction({ reason: '', approved_cost_delta: String(changed.requested_cost_delta), approved_schedule_days: String(changed.requested_schedule_days) });
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo cambiar el estado de la orden.'); }
        finally { setBusy(false); }
    };

    const decide = async (decision) => {
        try {
            setBusy(true); setError('');
            const payload = { decision, reason: action.reason, expected_lock_version: selectedChange.lock_version, approved_cost_delta: decision === 'approved' ? Number(action.approved_cost_delta) : null, approved_schedule_days: decision === 'approved' ? Number(action.approved_schedule_days) : null };
            const changed = await api.decideChangeOrder(projectId, selectedChange.id, payload, empresaId);
            setChanges((current) => current.map((item) => item.id === changed.id ? changed : item)); setAction({ reason: '', approved_cost_delta: '', approved_schedule_days: '0' });
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo decidir la orden de cambio.'); }
        finally { setBusy(false); }
    };

    return <section className="bim-responsive-container flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white" data-bim-cost-changes>
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-3"><div className="flex items-center gap-2"><GitPullRequestArrow size={16} className="text-[#F39200]" /><div><h3 className="text-xs font-semibold">Órdenes de cambio BIM</h3><p className="text-[10px] text-zinc-500">PCO, decisión e impacto contractual gobernado</p></div></div><div className="flex items-center gap-3 text-[10px]"><span>Delta aprobado <strong>{approvedDelta.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}</strong></span><button type="button" onClick={load} aria-label="Actualizar cambios" title="Actualizar" className="grid h-8 w-8 place-items-center border border-zinc-200 text-zinc-600"><RefreshCw size={14} /></button></div></header>
        <div className="bim-responsive-workbench flex-1" style={{ '--bim-workbench-sidebar': '390px' }}>
            <form onSubmit={createChange} className="grid content-start gap-2 overflow-y-auto border-r border-zinc-200 p-3"><h4 className="text-xs font-semibold">Nueva PCO</h4><select required aria-label="Contrato de cambio" value={form.contract_id} onChange={(event) => setField('contract_id', event.target.value)} className="h-9 border border-zinc-300 px-2 text-xs"><option value="">Seleccionar contrato activo</option>{contracts.map((item) => <option key={item.id} value={item.id}>{item.contract_number} · {item.title}</option>)}</select><input required aria-label="Número de cambio" placeholder="CO-001" value={form.change_number} onChange={(event) => setField('change_number', event.target.value)} className="h-9 border border-zinc-300 px-2 text-xs" /><input required aria-label="Título del cambio" placeholder="Título" value={form.title} onChange={(event) => setField('title', event.target.value)} className="h-9 border border-zinc-300 px-2 text-xs" /><textarea required minLength={5} aria-label="Descripción del cambio" placeholder="Descripción y causa" value={form.description} onChange={(event) => setField('description', event.target.value)} className="h-20 resize-none border border-zinc-300 p-2 text-xs" /><div className="grid grid-cols-2 gap-2"><input required type="number" step="0.01" aria-label="Delta de coste solicitado" placeholder="Delta coste" value={form.requested_cost_delta} onChange={(event) => setField('requested_cost_delta', event.target.value)} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><input required type="number" min="-3650" max="3650" aria-label="Delta de plazo solicitado" placeholder="Días" value={form.requested_schedule_days} onChange={(event) => setField('requested_schedule_days', event.target.value)} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /></div>{selectedContract ? <p className="bg-zinc-50 p-2 text-[10px]">Compromiso vigente: <strong>{Number(selectedContract.committed_amount).toLocaleString('es-EC', { style: 'currency', currency: selectedContract.currency })}</strong></p> : null}<button disabled={busy || !selectedContract || (!Number(form.requested_cost_delta) && !Number(form.requested_schedule_days))} className="h-9 bg-zinc-800 text-xs font-semibold text-white disabled:opacity-40">Crear PCO</button>{error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}</form>
            <main className="flex min-w-0 flex-col overflow-hidden" data-bim-change-ledger><div className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto">{changes.map((item) => <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={`grid w-full grid-cols-[120px_130px_minmax(0,1fr)_140px_100px_80px] items-center gap-3 px-4 py-3 text-left text-xs ${selectedChange?.id === item.id ? 'bg-orange-50' : 'hover:bg-zinc-50'}`}><div><strong>{item.change_number}</strong><p className="text-[10px] uppercase text-zinc-500">{STATUS_LABELS[item.status]}</p></div><span className="text-[10px] text-zinc-500">{item.contract_number}</span><span className="truncate"><strong className="block truncate">{item.title}</strong><span className="text-[10px] text-zinc-500">{item.description}</span></span><span className="text-right">{Number(item.requested_cost_delta).toLocaleString('es-EC', { style: 'currency', currency: item.currency })}</span><span className="text-right text-[10px]">{item.requested_schedule_days} días</span><span className="text-right text-[10px]">v{item.lock_version}</span></button>)}</div>{selectedChange?.status === 'potential' ? <div className="grid shrink-0 grid-cols-[minmax(220px,1fr)_100px_100px] gap-2 border-t border-zinc-200 p-3"><input aria-label="Motivo de transición de cambio" placeholder="Motivo" value={action.reason} onChange={(event) => setAction({ ...action, reason: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><button type="button" onClick={() => transition('submitted')} disabled={busy || action.reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1 bg-zinc-800 text-[10px] font-semibold text-white disabled:opacity-40"><Send size={13} />Enviar</button><button type="button" onClick={() => transition('cancelled')} disabled={busy || action.reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1 border border-red-200 text-[10px] font-semibold text-red-700 disabled:opacity-40"><Ban size={13} />Cancelar</button></div> : null}{selectedChange?.status === 'submitted' ? <div className="grid shrink-0 grid-cols-[130px_100px_minmax(220px,1fr)_100px_100px] gap-2 border-t border-zinc-200 p-3"><input type="number" step="0.01" aria-label="Delta de coste aprobado" value={action.approved_cost_delta} onChange={(event) => setAction({ ...action, approved_cost_delta: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><input type="number" min="-3650" max="3650" aria-label="Delta de plazo aprobado" value={action.approved_schedule_days} onChange={(event) => setAction({ ...action, approved_schedule_days: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><input aria-label="Motivo de decisión de cambio" placeholder="Motivo de decisión" value={action.reason} onChange={(event) => setAction({ ...action, reason: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><button type="button" onClick={() => decide('approved')} disabled={busy || action.reason.trim().length < 5 || action.approved_cost_delta === ''} className="inline-flex h-9 items-center justify-center gap-1 bg-emerald-700 text-[10px] font-semibold text-white disabled:opacity-40"><Check size={13} />Aprobar</button><button type="button" onClick={() => decide('rejected')} disabled={busy || action.reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1 border border-red-200 text-[10px] font-semibold text-red-700 disabled:opacity-40"><X size={13} />Rechazar</button></div> : null}</main>
        </div>
    </section>;
}
