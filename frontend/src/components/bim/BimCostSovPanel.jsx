import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, ListTree, Plus, RefreshCw, Trash2, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const emptyLine = () => ({ code: '', description: '', scheduled_value: '' });

export default function BimCostSovPanel({ projectId, empresaId, api = bimModelsApi }) {
    const [contracts, setContracts] = useState([]);
    const [sovs, setSovs] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [contractId, setContractId] = useState('');
    const [revision, setRevision] = useState('SOV-R1');
    const [lines, setLines] = useState([emptyLine()]);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const [contractValues, sovValues] = await Promise.all([api.listCostContracts(projectId, empresaId), api.listSchedulesOfValues(projectId, empresaId)]);
            const active = contractValues.filter((item) => item.status === 'active');
            setContracts(active); setSovs(sovValues); setContractId((current) => current || String(active[0]?.id || '')); setSelectedId((current) => current || sovValues[0]?.id || null);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo cargar el Schedule of Values BIM.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);
    const selectedContract = contracts.find((item) => String(item.id) === contractId) || null;
    const selectedSov = sovs.find((item) => item.id === selectedId) || sovs[0] || null;
    const total = useMemo(() => lines.reduce((sum, item) => sum + Number(item.scheduled_value || 0), 0), [lines]);
    const difference = Number(selectedContract?.committed_amount || 0) - total;
    const updateLine = (index, field, value) => setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, [field]: value } : line));

    const createSov = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const created = await api.createScheduleOfValues(projectId, { contract_id: Number(contractId), revision: revision.trim(), lines: lines.map((item) => ({ ...item, scheduled_value: Number(item.scheduled_value) })) }, empresaId);
            setSovs((current) => [created, ...current]); setSelectedId(created.id); setLines([emptyLine()]);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear el SOV BIM.'); }
        finally { setBusy(false); }
    };

    const decide = async (decision) => {
        try {
            setBusy(true); setError('');
            const changed = await api.decideScheduleOfValues(projectId, selectedSov.id, { decision, reason, expected_lock_version: selectedSov.lock_version }, empresaId);
            setSovs((current) => current.map((item) => item.id === changed.id ? changed : decision === 'approved' && item.contract_id === changed.contract_id && item.status === 'approved' ? { ...item, status: 'superseded' } : item)); setReason('');
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo decidir el SOV BIM.'); }
        finally { setBusy(false); }
    };

    return <section className="bim-responsive-container flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white" data-bim-cost-sov>
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-3"><div className="flex items-center gap-2"><ListTree size={16} className="text-[#F39200]" /><div><h3 className="text-xs font-semibold">Schedule of Values BIM</h3><p className="text-[10px] text-zinc-500">Asignación completa del compromiso contractual · revisiones gobernadas</p></div></div><button type="button" onClick={load} aria-label="Actualizar SOV" title="Actualizar" className="grid h-8 w-8 place-items-center border border-zinc-200 text-zinc-600"><RefreshCw size={14} /></button></header>
        <div className="bim-responsive-workbench flex-1" style={{ '--bim-workbench-sidebar': '520px' }}>
            <form onSubmit={createSov} className="flex min-h-0 flex-col border-r border-zinc-200 p-3">
                <div className="grid shrink-0 grid-cols-[1fr_120px_32px] gap-2"><select required aria-label="Contrato SOV" value={contractId} onChange={(event) => setContractId(event.target.value)} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs"><option value="">Seleccionar contrato activo</option>{contracts.map((item) => <option key={item.id} value={item.id}>{item.contract_number} · {item.title}</option>)}</select><input required aria-label="Revisión SOV" value={revision} onChange={(event) => setRevision(event.target.value)} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><button type="button" onClick={() => setLines((current) => [...current, emptyLine()])} aria-label="Añadir línea SOV" title="Añadir línea" className="grid h-9 w-8 place-items-center border border-zinc-300 text-zinc-700"><Plus size={14} /></button></div>
                <div className="mt-2 min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto border border-zinc-200" data-bim-sov-lines>{lines.map((line, index) => <div key={index} className="grid grid-cols-[80px_minmax(0,1fr)_120px_30px] items-center gap-2 p-2"><input required aria-label={`Código SOV ${index + 1}`} placeholder="Código" value={line.code} onChange={(event) => updateLine(index, 'code', event.target.value)} className="h-8 min-w-0 border border-zinc-300 px-2 text-xs" /><input required aria-label={`Descripción SOV ${index + 1}`} placeholder="Descripción" value={line.description} onChange={(event) => updateLine(index, 'description', event.target.value)} className="h-8 min-w-0 border border-zinc-300 px-2 text-xs" /><input required type="number" min="0.01" step="0.01" aria-label={`Valor SOV ${index + 1}`} placeholder="Valor" value={line.scheduled_value} onChange={(event) => updateLine(index, 'scheduled_value', event.target.value)} className="h-8 min-w-0 border border-zinc-300 px-2 text-right text-xs" /><button type="button" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_item, lineIndex) => lineIndex !== index))} aria-label={`Eliminar línea SOV ${index + 1}`} title="Eliminar línea" className="grid h-8 w-8 place-items-center text-red-700 disabled:opacity-30"><Trash2 size={13} /></button></div>)}</div>
                <div className="mt-2 grid shrink-0 grid-cols-3 gap-2 bg-zinc-50 p-2 text-[10px]"><span>Contrato <strong className="block text-xs">{Number(selectedContract?.committed_amount || 0).toLocaleString('es-EC', { style: 'currency', currency: selectedContract?.currency || 'USD' })}</strong></span><span>Asignado <strong className="block text-xs">{total.toLocaleString('es-EC', { style: 'currency', currency: selectedContract?.currency || 'USD' })}</strong></span><span>Diferencia <strong className={`block text-xs ${difference === 0 ? 'text-emerald-700' : 'text-red-700'}`}>{difference.toLocaleString('es-EC', { style: 'currency', currency: selectedContract?.currency || 'USD' })}</strong></span></div>
                <button disabled={busy || !selectedContract || difference !== 0} className="mt-2 h-9 shrink-0 bg-zinc-800 text-xs font-semibold text-white disabled:opacity-40">Crear revisión SOV</button>{error ? <p role="alert" className="mt-2 text-xs text-red-700">{error}</p> : null}
            </form>
            <main className="flex min-w-0 flex-col overflow-hidden" data-bim-sov-ledger><div className="min-h-0 flex-1 divide-y divide-zinc-100 overflow-y-auto">{sovs.map((item) => <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={`grid w-full grid-cols-[120px_140px_minmax(0,1fr)_150px_90px] items-center gap-3 px-4 py-3 text-left text-xs ${selectedSov?.id === item.id ? 'bg-orange-50' : 'hover:bg-zinc-50'}`}><div><strong>{item.revision}</strong><p className="text-[10px] uppercase text-zinc-500">{item.status}</p></div><span className="text-[10px] text-zinc-500">{item.contract_number}</span><span className="truncate text-[10px] text-zinc-500">{item.lines.length} líneas · {item.lines.map((line) => line.code).join(', ')}</span><strong className="text-right">{Number(item.total_scheduled_value).toLocaleString('es-EC', { style: 'currency', currency: item.currency })}</strong><span className="text-right text-[10px]">v{item.lock_version}</span></button>)}</div>{selectedSov?.status === 'draft' ? <div className="grid shrink-0 grid-cols-[minmax(220px,1fr)_100px_100px] gap-2 border-t border-zinc-200 p-3"><input aria-label="Motivo de decisión SOV" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo de decisión" className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><button type="button" onClick={() => decide('approved')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1 bg-emerald-700 text-[10px] font-semibold text-white disabled:opacity-40"><Check size={13} />Aprobar</button><button type="button" onClick={() => decide('rejected')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1 border border-red-200 text-[10px] font-semibold text-red-700 disabled:opacity-40"><X size={13} />Rechazar</button></div> : null}</main>
        </div>
    </section>;
}
