import { useCallback, useEffect, useMemo, useState } from 'react';
import { Calculator, Check, RefreshCw, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const STATUS_LABELS = { draft: 'Pendiente de revisión', approved: 'Aprobada', rejected: 'Rechazada', superseded: 'Sustituida' };

export default function BimCostEstimatePanel({ projectId, empresaId, api = bimModelsApi, embedded = false, onSelectLine }) {
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

    return <section className="flex h-full min-h-0 flex-col overflow-hidden bg-white" data-bim-cost-estimate>
        {!embedded ? <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-3"><div className="flex items-center gap-2"><Calculator size={16} className="text-orange-600" /><div><h3 className="text-xs font-semibold text-zinc-950">Estimación BIM gobernada</h3><p className="text-[10px] text-zinc-600">Valorar cantidades aprobadas sin modificar el presupuesto</p></div></div><button type="button" onClick={load} aria-label="Actualizar estimaciones" className="inline-flex h-8 items-center gap-2 rounded-md border border-zinc-300 px-2.5 text-[11px] font-semibold text-zinc-700 active:scale-[.97] hover:border-orange-500"><RefreshCw size={13} />Actualizar</button></header> : null}
        <div className="grid min-h-0 flex-1 grid-cols-[minmax(20rem,24rem)_minmax(0,1fr)]" data-bim-estimate-layout>
            <form onSubmit={createEstimate} className="flex min-h-0 flex-col border-r border-zinc-200 bg-zinc-50/60">
                <div className="shrink-0 border-b border-zinc-200 p-4">
                    <div className="flex items-center justify-between gap-3"><div><h4 className="text-sm font-semibold text-zinc-950">Preparar valoración</h4><p className="mt-0.5 text-[11px] text-zinc-600">El QTO conserva su origen y el resultado nace como revisión.</p></div>{embedded ? <button type="button" onClick={load} aria-label="Actualizar estimaciones" className="inline-flex size-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-600 active:scale-[.97] hover:border-orange-500"><RefreshCw size={13} /></button> : null}</div>
                    <label className="mt-4 block text-[11px] font-semibold text-zinc-800">Cantidad aprobada<select required aria-label="QTO aprobado" value={qtoId} onChange={(event) => { setQtoId(event.target.value); setRates({}); }} className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-2.5 text-xs outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600"><option value="">Seleccionar QTO aprobado</option>{qtos.map((item) => <option key={item.id} value={item.id}>{item.revision} · {item.rows.length} líneas</option>)}</select></label>
                    <label className="mt-3 block text-[11px] font-semibold text-zinc-800">Nombre de revisión<input required minLength={1} maxLength={100} aria-label="Revisión de estimación" value={revision} onChange={(event) => setRevision(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-2.5 text-xs outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600" /></label>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar" data-bim-estimate-rates>
                    {selectedQto?.rows?.length ? <div className="divide-y divide-zinc-200">{selectedQto.rows.map((row, index) => <label key={`${row.quantity_name}-${index}`} onFocus={() => onSelectLine?.(row)} className="grid grid-cols-[minmax(0,1fr)_7.5rem] items-center gap-3 px-4 py-3 text-[11px]"><span className="min-w-0"><strong className="block truncate text-zinc-900">{Object.values(row.group).join(' / ')}</strong><span className="mt-0.5 block text-zinc-600">{row.value} {row.unit} · {row.cost_code || 'Sin código presupuestario'}</span></span><span><span className="sr-only">Precio unitario</span><input required type="number" min="0" step="0.01" aria-label={`Precio línea ${index + 1}`} placeholder="USD / unidad" value={rates[index] || ''} onChange={(event) => setRates({ ...rates, [index]: event.target.value })} className="h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-right text-xs tabular-nums outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600" /></span></label>)}</div> : <div className="grid h-full min-h-36 place-items-center px-6 text-center"><div><p className="text-xs font-semibold text-zinc-800">Selecciona un QTO aprobado</p><p className="mt-1 text-[11px] leading-4 text-zinc-600">Las líneas de cantidad aparecerán aquí para asignar sus precios.</p></div></div>}
                </div>
                <div className="shrink-0 border-t border-zinc-300 bg-white p-3"><div className="flex items-baseline justify-between"><span className="text-[11px] text-zinc-600">Subtotal previsto</span><strong className="text-lg tabular-nums text-zinc-950">{preview.toLocaleString('es-EC', { style: 'currency', currency: 'USD' })}</strong></div><button disabled={busy || !selectedQto} className="mt-2 h-9 w-full rounded-md bg-orange-600 text-xs font-semibold text-white active:scale-[.99] hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-40">{busy ? 'Guardando…' : 'Crear revisión de estimación'}</button>{error ? <p role="alert" className="mt-2 text-xs text-rose-700">{error}</p> : null}</div>
            </form>
            <main className="flex min-w-0 flex-col overflow-hidden" data-bim-estimate-ledger>
                <header className="flex min-h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4"><div><h4 className="text-sm font-semibold text-zinc-950">Registro de estimaciones</h4><p className="text-[10px] text-zinc-600">Historial inmutable sobre cantidades aprobadas</p></div><span className="text-[11px] font-medium tabular-nums text-zinc-600">{estimates.length} revisiones</span></header>
                <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar">{estimates.length ? <div className="divide-y divide-zinc-200">{estimates.map((estimate) => <article key={estimate.id} className={`grid grid-cols-[9rem_minmax(0,1fr)_11rem_8rem] items-center gap-4 px-4 py-3 text-xs ${selectedEstimate?.id === estimate.id ? 'bg-orange-50/60' : 'bg-white'}`}><div><strong className="text-zinc-950">{estimate.revision}</strong><p className={`mt-0.5 text-[10px] font-medium ${estimate.status === 'approved' ? 'text-emerald-700' : estimate.status === 'rejected' ? 'text-rose-700' : 'text-amber-800'}`}>{STATUS_LABELS[estimate.status] || estimate.status}</p></div><p className="truncate text-[11px] text-zinc-600" title={estimate.qto_checksum_sha256}>QTO verificado · huella {estimate.qto_checksum_sha256?.slice(0, 10)}</p><strong className="text-right tabular-nums text-zinc-950">{estimate.subtotal.toLocaleString('es-EC', { style: 'currency', currency: estimate.currency })}</strong><span className="text-right text-[10px] text-zinc-600">{estimate.lines.length} líneas · v{estimate.lock_version}</span></article>)}</div> : <div className="grid h-full place-items-center p-8 text-center"><div><p className="text-sm font-semibold text-zinc-900">Todavía no hay estimaciones</p><p className="mt-1 text-xs text-zinc-600">Crea la primera revisión a partir de un QTO aprobado.</p></div></div>}</div>
                {selectedEstimate?.status === 'draft' ? <div className="shrink-0 border-t border-zinc-300 bg-white p-3"><div className="ml-auto grid max-w-2xl grid-cols-[minmax(0,1fr)_7rem_7rem] gap-2"><input aria-label="Motivo de decisión de estimación" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo de la decisión" className="h-9 min-w-0 rounded-md border border-zinc-300 px-2.5 text-xs outline-none focus:border-orange-600 focus:ring-1 focus:ring-orange-600" /><button type="button" onClick={() => decide('approved')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-700 text-[11px] font-semibold text-white active:scale-[.97] hover:bg-emerald-800 disabled:opacity-40"><Check size={13} />Aprobar</button><button type="button" onClick={() => decide('rejected')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-rose-300 text-[11px] font-semibold text-rose-700 active:scale-[.97] hover:bg-rose-50 disabled:opacity-40"><X size={13} />Rechazar</button></div></div> : null}
            </main>
        </div>
    </section>;
}
