import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calculator, Check, RefreshCw, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

export default function BimCostEstimatePanel({ projectId, empresaId, api = bimModelsApi }) {
    const [qtos, setQtos] = useState([]);
    const [estimates, setEstimates] = useState([]);
    const [qtoId, setQtoId] = useState('');
    const [revision, setRevision] = useState('EST-R1');
    const [rates, setRates] = useState({});
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const [qtoValues, estimateValues] = await Promise.all([api.listQtoSnapshots(projectId, null, empresaId), api.listCostEstimates(projectId, empresaId)]);
            const approved = qtoValues.filter((item) => item.status === 'approved');
            setQtos(approved); setEstimates(estimateValues); setQtoId((current) => current || String(approved[0]?.id || ''));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo cargar la estimación BIM.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);
    const selectedQto = qtos.find((item) => String(item.id) === qtoId) || null;
    const selectedEstimate = estimates[0] || null;
    const preview = useMemo(() => (selectedQto?.rows || []).reduce((total, row, index) => total + Number(row.value || 0) * Number(rates[index] || 0), 0), [rates, selectedQto]);

    const createEstimate = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const created = await api.createCostEstimate(projectId, { qto_snapshot_id: Number(qtoId), revision: revision.trim(), currency: 'USD', rates: selectedQto.rows.map((_row, index) => ({ row_index: index, unit_rate: Number(rates[index]) })) }, empresaId);
            setEstimates((current) => [created, ...current]); setRates({});
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear la estimación BIM.'); }
        finally { setBusy(false); }
    };

    const decide = async (decision) => {
        if (!selectedEstimate) return;
        try {
            setBusy(true); setError('');
            const decided = await api.decideCostEstimate(projectId, selectedEstimate.id, { decision, reason, expected_lock_version: selectedEstimate.lock_version }, empresaId);
            setEstimates((current) => current.map((item) => item.id === decided.id ? decided : decision === 'approved' && item.status === 'approved' ? { ...item, status: 'superseded' } : item)); setReason('');
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo decidir la estimación.'); }
        finally { setBusy(false); }
    };

    return <section className="flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white" data-bim-cost-estimate>
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-3"><div className="flex items-center gap-2"><Calculator size={16} className="text-[#F39200]" /><div><h3 className="text-xs font-semibold">Estimación BIM gobernada</h3><p className="text-[10px] text-zinc-500">Precios BIM sobre QTO aprobado · sin escritura en Presupuestos</p></div></div><button type="button" onClick={load} aria-label="Actualizar estimaciones" title="Actualizar" className="grid h-8 w-8 place-items-center border border-zinc-200 text-zinc-600"><RefreshCw size={14} /></button></header>
        <div className="grid min-h-0 flex-1 grid-cols-[430px_minmax(0,1fr)]">
            <form onSubmit={createEstimate} className="space-y-2 overflow-y-auto border-r border-zinc-200 p-3">
                <h4 className="text-xs font-semibold">Nueva revisión</h4>
                <select required aria-label="QTO aprobado" value={qtoId} onChange={(event) => { setQtoId(event.target.value); setRates({}); }} className="h-9 w-full border border-zinc-300 px-2 text-xs"><option value="">Seleccionar QTO aprobado</option>{qtos.map((item) => <option key={item.id} value={item.id}>{item.revision} · {item.rows.length} líneas</option>)}</select>
                <input required minLength={1} maxLength={100} aria-label="Revisión de estimación" value={revision} onChange={(event) => setRevision(event.target.value)} className="h-9 w-full border border-zinc-300 px-2 text-xs" />
                <div className="max-h-[420px] divide-y divide-zinc-100 overflow-y-auto border border-zinc-200" data-bim-estimate-rates>{selectedQto?.rows.map((row, index) => <label key={`${row.quantity_name}-${index}`} className="grid grid-cols-[1fr_110px] items-center gap-2 p-2 text-[10px]"><span className="min-w-0"><strong className="block truncate text-zinc-800">{Object.values(row.group).join(' / ')}</strong>{row.value} {row.unit} · {row.cost_code || 'Sin código'}</span><input required type="number" min="0" step="0.01" aria-label={`Precio línea ${index + 1}`} placeholder="USD/unidad" value={rates[index] || ''} onChange={(event) => setRates({ ...rates, [index]: event.target.value })} className="h-8 min-w-0 border border-zinc-300 px-2 text-right text-xs" /></label>)}</div>
                <div className="flex items-center justify-between bg-zinc-50 p-2 text-xs"><span>Vista previa</span><strong>{preview.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}</strong></div>
                <button disabled={busy || !selectedQto} className="h-9 w-full bg-zinc-800 text-xs font-semibold text-white disabled:opacity-40">Crear estimación</button>
                {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
            </form>
            <main className="min-w-0 overflow-y-auto" data-bim-estimate-ledger>
                <div className="divide-y divide-zinc-100">{estimates.map((estimate) => <article key={estimate.id} className="grid grid-cols-[130px_1fr_150px_130px] items-center gap-3 px-4 py-3 text-xs"><div><strong>{estimate.revision}</strong><p className="text-[10px] uppercase text-zinc-500">{estimate.status}</p></div><p className="truncate font-mono text-[9px] text-zinc-500" title={estimate.qto_checksum_sha256}>{estimate.qto_checksum_sha256}</p><strong className="text-right">{estimate.subtotal.toLocaleString('es-EC', { style: 'currency', currency: estimate.currency })}</strong><span className="text-right text-[10px]">{estimate.lines.length} líneas · v{estimate.lock_version}</span></article>)}</div>
                {selectedEstimate?.status === 'draft' ? <div className="sticky bottom-0 ml-auto grid w-[460px] grid-cols-[1fr_90px_90px] gap-2 border-l border-t border-zinc-200 bg-white p-3"><input aria-label="Motivo de decisión de estimación" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo de decisión" className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><button type="button" onClick={() => decide('approved')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1 bg-emerald-700 text-[10px] font-semibold text-white disabled:opacity-40"><Check size={13} />Aprobar</button><button type="button" onClick={() => decide('rejected')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1 border border-red-200 text-[10px] font-semibold text-red-700 disabled:opacity-40"><X size={13} />Rechazar</button></div> : null}
            </main>
        </div>
    </section>;
}
