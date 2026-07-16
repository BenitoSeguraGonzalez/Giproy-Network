import { useCallback, useEffect, useState } from 'react';
import { CircleDollarSign, RefreshCw } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const emptyLedger = { entries: [], currency_totals: {}, source_report_count: 0, posted_report_count: 0, validated_exception_cost: 0 };
const money = (value, currency) => Number(value || 0).toLocaleString('es-EC', { style: 'currency', currency });

export default function BimActualCostLedgerPanel({ projectId, empresaId, api = bimModelsApi }) {
    const [ledger, setLedger] = useState(emptyLedger);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!projectId) return;
        try { setError(''); setLedger(await api.getActualCostLedger(projectId, empresaId)); }
        catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo cargar el coste real BIM.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);
    const sync = async () => {
        try { setBusy(true); setError(''); setLedger(await api.syncActualCostLedger(projectId, empresaId)); }
        catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo conciliar el coste real de Campo.'); }
        finally { setBusy(false); }
    };

    return <section className="flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white" data-bim-actual-cost-ledger>
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-3"><div className="flex items-center gap-2"><CircleDollarSign size={16} className="text-[#F39200]" /><div><h3 className="text-xs font-semibold">Coste real desde Campo</h3><p className="text-[10px] text-zinc-500">Incrementos inmutables por parte · excepciones validadas no contabilizadas</p></div></div><button type="button" onClick={sync} disabled={busy} className="inline-flex h-8 items-center gap-1 border border-zinc-200 px-3 text-[10px] font-semibold text-zinc-700 disabled:opacity-40"><RefreshCw size={13} className={busy ? 'animate-spin' : ''} />Conciliar</button></header>
        <div className="grid h-16 shrink-0 grid-cols-[repeat(3,minmax(0,1fr))] border-b border-zinc-200 bg-zinc-50">
            <div className="border-r border-zinc-200 px-4 py-2"><p className="text-[9px] uppercase text-zinc-500">Coste contabilizado</p><div className="flex gap-4">{Object.entries(ledger.currency_totals || {}).map(([currency, value]) => <strong key={currency} className="text-base text-zinc-900">{money(value, currency)}</strong>)}{!Object.keys(ledger.currency_totals || {}).length ? <strong className="text-base text-zinc-400">Sin asientos</strong> : null}</div></div>
            <div className="border-r border-zinc-200 px-4 py-2"><p className="text-[9px] uppercase text-zinc-500">Partes conciliados</p><strong className="text-base text-zinc-900">{ledger.posted_report_count} / {ledger.source_report_count}</strong></div>
            <div className="px-4 py-2"><p className="text-[9px] uppercase text-zinc-500">Excepciones validadas</p><strong className="text-base text-amber-700">{money(ledger.validated_exception_cost, 'USD')}</strong><span className="ml-2 text-[9px] text-zinc-500">fuera del total</span></div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto" data-bim-actual-cost-entries>
            <div className="sticky top-0 grid h-8 grid-cols-[150px_110px_minmax(240px,1fr)_120px_140px_140px] items-center gap-3 border-b border-zinc-200 bg-white px-4 text-[9px] font-semibold uppercase text-zinc-500"><span>Fecha</span><span>Actividad</span><span>Descripción</span><span>Moneda</span><span className="text-right">Incremento</span><span className="text-right">Acumulado</span></div>
            {ledger.entries.map((entry) => <div key={entry.id} className="grid min-h-12 grid-cols-[150px_110px_minmax(240px,1fr)_120px_140px_140px] items-center gap-3 border-b border-zinc-100 px-4 text-xs"><span className="text-[10px] text-zinc-500">{new Date(entry.occurred_at).toLocaleString('es')}</span><strong>{entry.activity_code}</strong><span className="truncate text-zinc-600">{entry.activity_name}</span><span>{entry.currency}</span><strong className="text-right text-emerald-700">{money(entry.incremental_actual_cost, entry.currency)}</strong><span className="text-right font-semibold">{money(entry.cumulative_actual_cost, entry.currency)}</span></div>)}
            {!ledger.entries.length ? <p className="p-8 text-center text-xs text-zinc-500">Sin partes de Campo contabilizados.</p> : null}
        </div>
        {error ? <p role="alert" className="shrink-0 border-t border-red-100 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p> : null}
    </section>;
}
