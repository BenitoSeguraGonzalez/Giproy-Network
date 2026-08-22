import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, Plus, RefreshCw, TrendingUp, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const money = (value, currency = 'USD') => Number(value || 0).toLocaleString('es-EC', { style: 'currency', currency });
const STATUS_LABELS = { draft: 'Borrador', approved: 'Aprobado', rejected: 'Rechazado', superseded: 'Sustituido' };

const BimCostForecastPanel = ({ projectId, empresaId, api = bimModelsApi }) => {
    const [items, setItems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ revision: 'FC-R1', currency: 'USD', estimate_to_complete: '', rationale: '' });
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const rows = await api.listCostForecasts(projectId, empresaId);
            setItems(rows);
            setSelectedId((value) => value || rows[0]?.id || null);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo cargar la previsión BIM.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => {
        if (!createOpen) return undefined;
        const close = (event) => { if (event.key === 'Escape') setCreateOpen(false); };
        window.addEventListener('keydown', close);
        return () => window.removeEventListener('keydown', close);
    }, [createOpen]);

    const selected = items.find((item) => item.id === selectedId) || items[0] || null;
    const approved = useMemo(() => items.find((item) => item.status === 'approved') || null, [items]);

    const create = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const value = await api.createCostForecast(projectId, { ...form, estimate_to_complete: Number(form.estimate_to_complete) }, empresaId);
            setItems((current) => [value, ...current]); setSelectedId(value.id);
            setForm((current) => ({ ...current, revision: `FC-R${items.length + 2}`, estimate_to_complete: '', rationale: '' }));
            setCreateOpen(false);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear la previsión.'); }
        finally { setBusy(false); }
    };

    const decide = async (decision) => {
        try {
            setBusy(true); setError('');
            const value = await api.decideCostForecast(projectId, selected.id, { decision, reason, expected_lock_version: selected.lock_version }, empresaId);
            setItems((current) => current.map((item) => item.id === value.id ? value : decision === 'approved' && item.currency === value.currency && item.status === 'approved' ? { ...item, status: 'superseded' } : item));
            setReason('');
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo decidir la previsión.'); }
        finally { setBusy(false); }
    };

    return (
        <section className="relative flex h-full min-h-0 flex-col overflow-hidden bg-white" data-bim-cost-forecast>
            <header className="flex min-h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-4">
                <div className="flex items-center gap-2"><TrendingUp className="size-4 text-orange-600" /><div><h3 className="text-xs font-semibold text-zinc-950">Previsión de coste final</h3><p className="text-[10px] text-zinc-600">Revisiones gobernadas de ETC, EAC y variación.</p></div></div>
                <button type="button" onClick={load} aria-label="Actualizar forecast" className="inline-flex size-8 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:text-orange-700"><RefreshCw className="size-3.5" /></button>
            </header>
            <div className="flex min-h-14 shrink-0 items-center gap-5 border-b border-zinc-200 bg-zinc-50 px-4">
                <div><span className="block text-[9px] font-medium text-zinc-500">Referencia vigente</span><strong className="text-xs text-zinc-950">{approved?.revision || 'Sin previsión aprobada'}</strong></div><div className="h-7 w-px bg-zinc-200" />
                <div><span className="block text-[9px] font-medium text-zinc-500">EAC vigente</span><strong className="text-xs text-zinc-950">{approved ? money(approved.forecast_at_completion, approved.currency) : '—'}</strong></div>
                <div><span className="block text-[9px] font-medium text-zinc-500">Variación prevista</span><strong className={approved?.variance_at_completion < 0 ? 'text-xs text-rose-700' : 'text-xs text-emerald-700'}>{approved ? money(approved.variance_at_completion, approved.currency) : '—'}</strong></div>
                <button type="button" onClick={() => setCreateOpen(true)} className="ml-auto inline-flex h-9 items-center gap-2 rounded-md bg-orange-600 px-3 text-xs font-semibold text-white active:scale-[.97] hover:bg-orange-700"><Plus className="size-3.5" />Nueva previsión</button>
            </div>
            {error ? <div className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-800" role="alert">{error}</div> : null}
            <div className="min-h-0 flex-1 overflow-auto" data-bim-forecast-ledger>
                <table className="w-full min-w-[64rem] border-collapse text-left text-xs"><thead className="sticky top-0 z-10 bg-white text-[10px] font-semibold text-zinc-600"><tr className="border-b border-zinc-200"><th className="w-28 px-4 py-2.5">Revisión</th><th className="w-24 px-3 py-2.5">Estado</th><th className="w-20 px-3 py-2.5">Moneda</th><th className="px-3 py-2.5 text-right">Base</th><th className="px-3 py-2.5 text-right">Comprometido</th><th className="px-3 py-2.5 text-right">Real</th><th className="px-3 py-2.5 text-right">ETC</th><th className="px-3 py-2.5 text-right">EAC</th><th className="px-4 py-2.5 text-right">Variación</th></tr></thead><tbody className="divide-y divide-zinc-200">{items.map((item) => <tr key={item.id} onClick={() => setSelectedId(item.id)} className={`cursor-pointer ${selected?.id === item.id ? 'bg-orange-50' : 'hover:bg-zinc-50'}`}><td className="px-4 py-3 font-semibold text-zinc-950">{item.revision}</td><td className="px-3 py-3"><span className="rounded bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-700">{STATUS_LABELS[item.status] || item.status}</span></td><td className="px-3 py-3 text-zinc-600">{item.currency}</td><td className="px-3 py-3 text-right tabular-nums">{money(item.baseline_budget, item.currency)}</td><td className="px-3 py-3 text-right tabular-nums">{money(item.committed_cost, item.currency)}</td><td className="px-3 py-3 text-right tabular-nums">{money(item.actual_cost, item.currency)}</td><td className="px-3 py-3 text-right tabular-nums">{money(item.estimate_to_complete, item.currency)}</td><td className="px-3 py-3 text-right font-semibold tabular-nums">{money(item.forecast_at_completion, item.currency)}</td><td className={`px-4 py-3 text-right font-semibold tabular-nums ${item.variance_at_completion < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>{money(item.variance_at_completion, item.currency)}</td></tr>)}</tbody></table>
                {!items.length ? <div className="grid min-h-48 place-items-center text-center"><div><TrendingUp className="mx-auto size-6 text-zinc-400" /><p className="mt-2 text-xs font-semibold text-zinc-900">Sin previsiones registradas</p><p className="mt-1 text-[11px] text-zinc-600">Crea una revisión cuando exista una hipótesis de cierre documentada.</p></div></div> : null}
            </div>
            {selected?.status === 'draft' ? <div className="grid shrink-0 grid-cols-[minmax(16rem,1fr)_7rem_7rem] gap-2 border-t border-zinc-200 bg-white p-3"><input aria-label="Motivo de decisión forecast" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo de la decisión" className="h-9 rounded-md border border-zinc-300 px-3 text-xs" /><button type="button" onClick={() => decide('approved')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md bg-emerald-700 text-xs font-semibold text-white disabled:opacity-40"><Check className="size-3.5" />Aprobar</button><button type="button" onClick={() => decide('rejected')} disabled={busy || reason.trim().length < 5} className="inline-flex h-9 items-center justify-center gap-1.5 rounded-md border border-rose-200 text-xs font-semibold text-rose-700 disabled:opacity-40"><X className="size-3.5" />Rechazar</button></div> : null}
            {createOpen ? <div className="absolute inset-0 z-30 grid place-items-center bg-zinc-950/35 p-6"><form onSubmit={create} className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="forecast-create-title"><header className="flex min-h-14 items-center border-b border-zinc-200 px-5"><div><h3 id="forecast-create-title" className="text-sm font-semibold text-zinc-950">Nueva previsión de coste</h3><p className="mt-0.5 text-[11px] text-zinc-600">Documenta la hipótesis; no modifica el presupuesto oficial.</p></div><button type="button" onClick={() => setCreateOpen(false)} className="ml-auto inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100" aria-label="Cerrar nueva previsión"><X className="size-4" /></button></header><div className="space-y-4 p-5"><div className="grid grid-cols-2 gap-3"><label className="text-[11px] font-semibold text-zinc-800">Revisión<input autoFocus required aria-label="Revisión forecast" value={form.revision} onChange={(event) => setForm({ ...form, revision: event.target.value })} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label><label className="text-[11px] font-semibold text-zinc-800">Moneda<select aria-label="Moneda forecast" value={form.currency} onChange={(event) => setForm({ ...form, currency: event.target.value })} className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs font-normal"><option>USD</option><option>EUR</option><option>COP</option></select></label></div><label className="block text-[11px] font-semibold text-zinc-800">Estimado por completar (ETC)<input required type="number" min="0" step="0.01" aria-label="Estimado por completar" value={form.estimate_to_complete} onChange={(event) => setForm({ ...form, estimate_to_complete: event.target.value })} className="mt-1 h-9 w-full rounded-md border border-zinc-300 px-3 text-xs font-normal" /></label><label className="block text-[11px] font-semibold text-zinc-800">Hipótesis y justificación<textarea required minLength={5} aria-label="Justificación forecast" value={form.rationale} onChange={(event) => setForm({ ...form, rationale: event.target.value })} className="mt-1 h-28 w-full resize-none rounded-md border border-zinc-300 p-3 text-xs font-normal" /></label></div><footer className="flex min-h-14 items-center justify-end gap-2 border-t border-zinc-200 px-5"><button type="button" onClick={() => setCreateOpen(false)} className="h-9 px-3 text-xs font-semibold text-zinc-600">Cancelar</button><button type="submit" disabled={busy} className="h-9 rounded-md bg-orange-600 px-4 text-xs font-semibold text-white disabled:opacity-40">{busy ? 'Creando…' : 'Crear previsión'}</button></footer></form></div> : null}
        </section>
    );
};

export default BimCostForecastPanel;
