import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, CheckCircle2, Clock3, Loader2, TrendingUp, X } from 'lucide-react';
import ClearSearchField from '../ui/ClearSearchField';
import { cronogramasApi } from '../../api/cronogramas';
import { includesNormalized, normalizeSearchToken } from '../../utils/normalizeSearch';
import { normalizeDescriptionCapitalization, normalizeSubcategoryDisplay } from '../../utils/descriptionCapitalization';
import AnimatedSelect from '../ui/AnimatedSelect';
import AnimatedDateInput from '../ui/AnimatedDateInput';
import { APP_MODAL_CLOSE_BUTTON_CLASS } from '../ui/app-modal';

const TOP_OPTIONS = [10, 20, 50];
const VIEW_OPTIONS = [
    { id: 'integrated', label: 'Integrado', icon: TrendingUp },
    { id: 'time', label: 'Tiempo', icon: Clock3 },
    { id: 'cost', label: 'Costo', icon: BarChart3 },
];

const cx = (...classes) => classes.filter(Boolean).join(' ');

const formatNumber = (value, decimals = 2) =>
    Number(value || 0).toLocaleString('es-ES', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    });

const formatMoney = (value) => formatNumber(value, 2);

const formatDate = (value) => {
    if (!value) return 'Sin fecha';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    return date.toLocaleDateString('es-ES');
};

const MetricPill = ({ label, value, accent = false }) => (
    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">{label}</div>
        <div className={cx('mt-1 text-[15px] font-black tracking-tight tabular-nums', accent ? 'text-[#F39200]' : 'text-zinc-900')}>
            {value}
        </div>
    </div>
);

const PillButton = ({ active, onClick, children }) => (
    <button
        type="button"
        onClick={onClick}
        className={cx(
            'h-8 rounded-xl border px-3 text-[10px] font-black uppercase tracking-[0.16em] transition-all',
            active
                ? 'border-zinc-900 bg-zinc-900 text-white'
                : 'border-zinc-200 bg-white text-zinc-500 hover:border-[#F39200]/50 hover:text-zinc-900'
        )}
    >
        {children}
    </button>
);

const GanttParetoModal = ({ isOpen, onClose, presupuestoId, onNavigateToItem, onOpenReport, rows = [], valorado = null }) => {
    const [view, setView] = useState('integrated');
    const [top, setTop] = useState(20);
    const [search, setSearch] = useState('');
    const [selectedEdtId, setSelectedEdtId] = useState('');
    const [criticalOnly, setCriticalOnly] = useState(false);
    const [startFrom, setStartFrom] = useState('');
    const [endTo, setEndTo] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const cacheRef = useRef(new Map());

    const edtOptions = useMemo(() => {
        const map = new Map();
        (Array.isArray(rows) ? rows : []).forEach((row) => {
            if (!row || row.is_calculable || !row.edt_id) return;
            map.set(String(row.edt_id), {
                id: String(row.edt_id),
                label: `${row.edt_code_visible || row.codigo || row.edt_id} · ${normalizeSubcategoryDisplay(row.descripcion || 'EDT')}`,
            });
        });
        return Array.from(map.values());
    }, [rows]);

    const financialContext = useMemo(() => {
        const itemIds = new Set((data?.items || []).map((item) => Number(item?.linea_id || item?.id || 0)).filter(Boolean));
        const periods = Array.isArray(valorado?.periods) ? valorado.periods : [];
        const cashFlow = Array.isArray(valorado?.cash_flow) ? valorado.cash_flow : [];
        const totalValorado = Number(
            valorado?.footer?.inversion_acumulada?.[valorado?.footer?.inversion_acumulada?.length - 1]
            || valorado?.rows?.reduce((sum, row) => sum + Number(row?.precio_total || 0), 0)
            || 0
        );
        const sourceBaseLabel = valorado?.distribution_mode === 'gantt'
            ? (valorado?.has_line_overrides ? 'Gantt + overrides valorados' : 'Gantt vía Valorado')
            : (valorado?.has_line_overrides ? 'Valorado con overrides' : 'Distribución valorada');

        const rowMap = new Map();
        (Array.isArray(valorado?.rows) ? valorado.rows : []).forEach((row) => {
            const lineId = Number(row?.linea_id || 0);
            if (!lineId || (itemIds.size && !itemIds.has(lineId))) return;
            const distribution = Array.isArray(row?.distribution) ? row.distribution : [];
            const total = Number(row?.precio_total || 0);
            const valuesByPeriod = periods.map((period, index) => ({
                periodId: period?.id || `P${index + 1}`,
                periodLabel: period?.label || `P${index + 1}`,
                value: total * (Number(distribution[index] || 0) / 100),
                cashCost: Number(cashFlow[index]?.cost || 0),
                cashCumulative: Number(cashFlow[index]?.cumulative_cost || 0),
            }));
            const peakEntry = valuesByPeriod.reduce((best, current) => (current.value > (best?.value || 0) ? current : best), valuesByPeriod[0] || null);
            const peakValue = Number(peakEntry?.value || 0);
            const peakPeriodCost = Number(peakEntry?.cashCost || 0);
            const peakWeightPct = totalValorado > 0 ? (peakValue / totalValorado) * 100 : 0;
            const cashSharePct = peakPeriodCost > 0 ? Math.min(100, (peakValue / peakPeriodCost) * 100) : 0;
            rowMap.set(lineId, {
                sourceLabel: row?.has_override ? `${sourceBaseLabel} · override línea` : sourceBaseLabel,
                peakPeriodId: peakEntry?.periodId || null,
                peakPeriodLabel: peakEntry?.periodLabel || 'Sin periodo dominante',
                peakValue,
                peakWeightPct,
                peakPeriodCost,
                peakPeriodCashSharePct: cashSharePct,
                peakCashCumulative: Number(peakEntry?.cashCumulative || 0),
            });
        });
        return {
            rowMap,
            totalValorado,
            sourceBaseLabel,
        };
    }, [data?.items, valorado]);

    useEffect(() => {
        if (!isOpen || !presupuestoId) return;
        let cancelled = false;
        const fetchPareto = async () => {
            try {
                setLoading(true);
                setError('');
                const cacheKey = JSON.stringify({
                    view,
                    top,
                    selectedEdtId,
                    criticalOnly,
                    startFrom,
                    endTo,
                });
                if (cacheRef.current.has(cacheKey)) {
                    const cached = cacheRef.current.get(cacheKey);
                    if (!cancelled) {
                        setData(cached);
                        setSelectedItemId(cached.items?.[0]?.id ?? null);
                    }
                    return;
                }
                const response = await cronogramasApi.getTrabajoPareto(presupuestoId, {
                    view,
                    top,
                    ...(selectedEdtId ? { edt_id: Number(selectedEdtId) } : {}),
                    ...(criticalOnly ? { critical_only: true } : {}),
                    ...(startFrom ? { start_from: startFrom } : {}),
                    ...(endTo ? { end_to: endTo } : {}),
                });
                if (cancelled) return;
                cacheRef.current.set(cacheKey, response);
                setData(response);
                setSelectedItemId(response.items?.[0]?.id ?? null);
            } catch (fetchError) {
                if (cancelled) return;
                globalThis.reportClientError?.('Error cargando Pareto temporal del Gantt:', fetchError);
                setError('No fue posible cargar el Pareto temporal del Gantt.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        fetchPareto();
        return () => {
            cancelled = true;
        };
    }, [criticalOnly, endTo, isOpen, presupuestoId, selectedEdtId, startFrom, top, view]);

    useEffect(() => {
        if (!isOpen) return;
        setView('integrated');
        setTop(20);
        setSearch('');
        setSelectedEdtId('');
        setCriticalOnly(false);
        setStartFrom('');
        setEndTo('');
        setError('');
        setData(null);
        setSelectedItemId(null);
    }, [isOpen]);

    const enrichedItems = useMemo(() => {
        const items = (data?.items || []).map((item) => {
            const financial = financialContext.rowMap.get(Number(item?.linea_id || item?.id || 0));
            const financialIntegratedPct = financial
                ? ((Number(item.integrated_value || 0) + Number(financial.peakWeightPct || 0) + Number(financial.peakPeriodCashSharePct || 0)) / 3)
                : Number(item.integrated_value || 0);
            return {
                ...item,
                descripcion_formateada: normalizeDescriptionCapitalization(item.descripcion || ''),
                source_label: financial?.sourceLabel || financialContext.sourceBaseLabel || 'Sin lectura valorada',
                peak_period_id: financial?.peakPeriodId || null,
                peak_period_label: financial?.peakPeriodLabel || 'Sin periodo dominante',
                peak_period_value: Number(financial?.peakValue || 0),
                peak_period_weight_pct: Number(financial?.peakWeightPct || 0),
                peak_period_cash_share_pct: Number(financial?.peakPeriodCashSharePct || 0),
                peak_period_cash_cost: Number(financial?.peakPeriodCost || 0),
                peak_period_cash_cumulative: Number(financial?.peakCashCumulative || 0),
                financial_integrated_pct: Number(financialIntegratedPct || 0),
            };
        });

        if (view === 'integrated') {
            return [...items].sort((left, right) => Number(right.financial_integrated_pct || 0) - Number(left.financial_integrated_pct || 0))
                .map((item, index, all) => ({
                    ...item,
                    ranking: index + 1,
                    porcentaje_acumulado: Number(
                        all.slice(0, index + 1).reduce((sum, current) => sum + Number(current.porcentaje || 0), 0).toFixed(4)
                    ),
                }));
        }
        return items;
    }, [data?.items, financialContext.rowMap, financialContext.sourceBaseLabel, view]);

    const filteredItems = useMemo(() => {
        const items = enrichedItems;
        const normalizedSearch = normalizeSearchToken(search);
        if (!normalizedSearch) return items;
        return items.filter((item) =>
            includesNormalized(`${item.codigo || ''} ${item.descripcion || ''}`, normalizedSearch)
        );
    }, [enrichedItems, search]);

    const selectedItem = filteredItems.find((item) => item.id === selectedItemId) || filteredItems[0] || null;
    const topItem = filteredItems[0] || null;
    const selectedViewOption = VIEW_OPTIONS.find((option) => option.id === view) || VIEW_OPTIONS[0];
    const SelectedIcon = selectedViewOption.icon;
    const paretoTotals = useMemo(() => {
        const items = data?.items || [];
        return {
            totalCost: items.reduce((sum, item) => sum + Number(item?.cost_value || 0), 0),
            totalDuration: items.reduce((sum, item) => sum + Number(item?.duration_days || 0), 0),
            totalQuantity: items.reduce((sum, item) => sum + Number(item?.cantidad ?? item?.quantity ?? 0), 0),
        };
    }, [data?.items]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm">
            <div className="flex h-[88dvh] w-full max-w-[1420px] flex-col overflow-hidden rounded-[1.75rem] border border-zinc-300 bg-[#F3F4F6] shadow-2xl">
                <div className="border-b border-zinc-200 bg-white px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50">
                                    <CheckCircle2 className="h-4 w-4 text-[#F39200]" />
                                </div>
                                <div className="min-w-0">
                                    <div className="text-[12px] font-black uppercase tracking-[0.18em] text-zinc-900">
                                        Pareto temporal
                                    </div>
                                    <div className="text-[11px] font-medium text-zinc-500">
                                        APUs más relevantes por costo, tiempo e impacto combinado sobre el Gantt
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => onOpenReport?.()}
                                className="inline-flex h-9 items-center justify-center rounded-xl border border-[#F39200]/25 bg-[#fff7ed] px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#F39200] transition hover:border-[#F39200] hover:bg-[#F39200] hover:text-white"
                            >
                                Reporte
                            </button>
                            <button
                                type="button"
                                onClick={onClose}
                                className={`${APP_MODAL_CLOSE_BUTTON_CLASS} !h-9 !w-9 !rounded-[0.75rem]`}
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {VIEW_OPTIONS.map((option) => (
                                <PillButton key={option.id} active={view === option.id} onClick={() => setView(option.id)}>
                                    {option.label}
                                </PillButton>
                            ))}
                            <div className="mx-1 h-6 w-px bg-zinc-200" />
                            {TOP_OPTIONS.map((option) => (
                                <PillButton key={option} active={top === option} onClick={() => setTop(option)}>
                                    Top {option}
                                </PillButton>
                            ))}
                            <PillButton active={criticalOnly} onClick={() => setCriticalOnly((current) => !current)}>
                                Solo críticas
                            </PillButton>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <AnimatedSelect
                                value={selectedEdtId}
                                onChange={(event) => setSelectedEdtId(event.target.value)}
                                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-[11px] font-bold text-zinc-700 outline-none focus:border-[#F39200]"
                            >
                                <option value="">Toda la EDT</option>
                                {edtOptions.map((option) => (
                                    <option key={option.id} value={option.id}>
                                        {option.label}
                                    </option>
                                ))}
                            </AnimatedSelect>
                            <AnimatedDateInput
                                type="date"
                                variant="compact"
                                value={startFrom}
                                onChange={(event) => setStartFrom(event.target.value)}
                                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-[11px] font-bold text-zinc-700 outline-none focus:border-[#F39200]"
                                title="Inicio de ventana"
                            />
                            <AnimatedDateInput
                                type="date"
                                variant="compact"
                                value={endTo}
                                onChange={(event) => setEndTo(event.target.value)}
                                className="h-9 rounded-xl border border-zinc-200 bg-white px-3 text-[11px] font-bold text-zinc-700 outline-none focus:border-[#F39200]"
                                title="Fin de ventana"
                            />
                        </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                        <ClearSearchField
                            value={search}
                            onValueChange={setSearch}
                            placeholder="Filtrar código o descripción"
                            containerClassName="w-full max-w-[340px] rounded-xl bg-zinc-50"
                            inputClassName="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2 pl-10 pr-10 text-[12px] font-medium text-zinc-700 outline-none focus:border-[#F39200]"
                        />
                    </div>
                </div>

                <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1.35fr)_390px] gap-0">
                    <div className="flex min-h-0 flex-col border-r border-zinc-200 bg-white">
                        <div className="grid grid-cols-5 gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3">
                            <MetricPill label="Modo" value={selectedViewOption.label} accent />
                            <MetricPill label="Total costo" value={`$ ${formatMoney(paretoTotals.totalCost)}`} />
                            <MetricPill label="Total tiempo" value={`${formatNumber(paretoTotals.totalDuration, 2)} d`} />
                            <MetricPill label="Total cantidad" value={formatNumber(paretoTotals.totalQuantity, 2)} />
                            <MetricPill label="Items" value={`${data?.visible_items || 0}/${data?.total_items || 0}`} />
                            <MetricPill label="Acumulado" value={`${formatNumber(data?.visible_acumulado || 0, 2)}%`} />
                        </div>

                        <div className="grid grid-cols-[84px_minmax(260px,1.4fr)_110px_110px_110px_120px_1fr] border-b border-zinc-200 bg-[#171717] px-4 py-2 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-300">
                            <div>Rank</div>
                            <div>Partida</div>
                            <div>Costo</div>
                            <div>Cantidad</div>
                            <div>Tiempo</div>
                            <div>% acum.</div>
                            <div>Impacto</div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-auto">
                            {loading ? (
                                <div className="flex h-full items-center justify-center gap-2 text-sm font-semibold text-zinc-500">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Cargando Pareto temporal...
                                </div>
                            ) : error ? (
                                <div className="p-6 text-sm font-semibold text-red-600">{error}</div>
                            ) : filteredItems.length === 0 ? (
                                <div className="p-6 text-sm font-semibold text-zinc-500">No hay datos suficientes para construir el Pareto temporal.</div>
                            ) : (
                                filteredItems.map((item) => {
                                    const widthPct = Math.max(4, Math.min(100, Number(item.porcentaje || 0)));
                                    const isSelected = selectedItem?.id === item.id;
                                    return (
                                        <button
                                            key={item.id}
                                            type="button"
                                            onClick={() => setSelectedItemId(item.id)}
                                            onDoubleClick={() => onNavigateToItem?.(item)}
                                            className={cx(
                                                'grid w-full grid-cols-[84px_minmax(260px,1.4fr)_110px_110px_110px_120px_1fr] items-center gap-0 border-b border-zinc-100 px-4 py-2 text-left transition',
                                                isSelected ? 'bg-[#fff7ed]' : 'bg-white hover:bg-zinc-50'
                                            )}
                                        >
                                            <div className="text-[11px] font-black text-[#F39200]">#{item.ranking}</div>
                                            <div className="min-w-0">
                                                <div className="truncate text-[11px] font-black text-zinc-900">{item.codigo || '—'} · {item.descripcion_formateada}</div>
                                                <div className="mt-1 text-[9px] font-bold uppercase tracking-[0.1em] text-zinc-400">
                                                    {formatDate(item.start_date)} → {formatDate(item.end_date)}
                                                </div>
                                                <div className="mt-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#F39200]">
                                                    {item.peak_period_label} · $ {formatMoney(item.peak_period_value || 0)}
                                                </div>
                                            </div>
                                            <div className="text-[11px] font-bold text-zinc-700">$ {formatMoney(item.cost_value)}</div>
                                            <div className="text-[11px] font-bold text-zinc-700">{formatNumber(item.cantidad ?? item.quantity ?? 0, 2)}</div>
                                            <div className="text-[11px] font-bold text-zinc-700">{formatNumber(item.duration_days, 2)} d</div>
                                            <div className="text-[11px] font-black text-zinc-500">{formatNumber(item.porcentaje_acumulado, 2)}%</div>
                                            <div className="pr-2">
                                                <div className="h-3 rounded-full bg-zinc-100">
                                                    <div className="h-3 rounded-full bg-[#F39200]" style={{ width: `${widthPct}%` }} />
                                                </div>
                                            </div>
                                        </button>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="flex min-h-0 flex-col bg-[#F8F9FA]">
                        <div className="border-b border-zinc-200 bg-white px-5 py-4">
                            <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Detalle</div>
                            <div className="mt-1 text-lg font-black tracking-tight text-zinc-900">
                                {selectedItem ? `${selectedItem.codigo || '—'} · ${selectedItem.descripcion_formateada}` : 'Selecciona una partida'}
                            </div>
                        </div>

                        <div className="min-h-0 flex-1 overflow-auto px-5 py-4">
                            {selectedItem ? (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <MetricPill label="Costo" value={`$ ${formatMoney(selectedItem.cost_value)}`} />
                                        <MetricPill label="Cantidad" value={formatNumber(selectedItem.cantidad ?? selectedItem.quantity ?? 0, 2)} />
                                        <MetricPill label="Tiempo" value={`${formatNumber(selectedItem.duration_days, 2)} d`} />
                                        <MetricPill label="Horas efectivas" value={`${formatNumber(selectedItem.work_hours, 2)} h`} />
                                        <MetricPill label="Impacto" value={`${formatNumber(selectedItem.porcentaje, 2)}%`} accent />
                                        <MetricPill label="Pico valorado" value={`$ ${formatMoney(selectedItem.peak_period_value)}`} />
                                        <MetricPill label="Pico caja" value={`${formatNumber(selectedItem.peak_period_cash_share_pct, 2)}%`} accent />
                                    </div>
                                    <div className="rounded-[1.25rem] border border-zinc-200 bg-white p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Lectura temporal</div>
                                        <div className="mt-2 text-sm font-semibold leading-relaxed text-zinc-600">
                                            {view === 'cost'
                                                ? 'Esta partida se ordena por monto total dentro del cronograma operativo.'
                                                : view === 'time'
                                                    ? 'Esta partida se ordena por impacto temporal programado, medido sobre su duración activa y soporte horario.'
                                                    : 'Esta partida se ordena por un índice combinado entre costo y tiempo para detectar APUs que dominan simultáneamente la economía y la programación.'}
                                        </div>
                                        <div className="mt-4 space-y-2 text-[11px] font-bold text-zinc-600">
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Costo relativo</span>
                                                <span>{formatNumber(selectedItem.cost_pct, 2)}%</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Tiempo relativo</span>
                                                <span>{formatNumber(selectedItem.time_pct, 2)}%</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Índice integrado</span>
                                                <span>{formatNumber(selectedItem.integrated_value, 2)}%</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Integración Valorado/Caja</span>
                                                <span>{formatNumber(selectedItem.financial_integrated_pct, 2)}%</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Estado crítico</span>
                                                <span>{selectedItem.is_critical ? 'Sí' : 'No'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="rounded-[1.25rem] border border-zinc-200 bg-white p-4">
                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Lectura valorada y de caja</div>
                                        <div className="mt-2 space-y-2 text-[11px] font-bold text-zinc-600">
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Origen</span>
                                                <span className="text-right">{selectedItem.source_label}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Periodo dominante</span>
                                                <span>{selectedItem.peak_period_label}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Peso en Valorado</span>
                                                <span>{formatNumber(selectedItem.peak_period_weight_pct, 2)}%</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Caja del periodo</span>
                                                <span>$ {formatMoney(selectedItem.peak_period_cash_cost)}</span>
                                            </div>
                                            <div className="flex items-center justify-between gap-3">
                                                <span>Caja acumulada</span>
                                                <span>$ {formatMoney(selectedItem.peak_period_cash_cumulative)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onNavigateToItem?.(selectedItem)}
                                        className="inline-flex h-10 items-center justify-center rounded-[0.9rem] border border-[#F39200]/25 bg-[#fff7ed] px-4 text-[10px] font-black uppercase tracking-[0.14em] text-[#F39200] transition hover:border-[#F39200] hover:bg-[#F39200] hover:text-white"
                                    >
                                        Ir a la tarea en Gantt
                                    </button>
                                </div>
                            ) : (
                                <div className="text-sm font-semibold text-zinc-500">Selecciona una partida para revisar su lectura Pareto temporal.</div>
                            )}

                            {topItem ? (
                                <div className="mt-6 rounded-[1.25rem] border border-zinc-200 bg-white p-4">
                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Dominante actual</div>
                                    <div className="mt-2 text-sm font-black text-zinc-900">
                                        {topItem.codigo || '—'} · {topItem.descripcion_formateada}
                                    </div>
                                    <div className="mt-1 text-[11px] font-semibold text-zinc-500">
                                        Aporta {formatNumber(topItem.porcentaje, 2)}% del Pareto visible en modo {selectedViewOption.label.toLowerCase()}.
                                    </div>
                                    <div className="mt-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[#F39200]">
                                        {topItem.peak_period_label} · $ {formatMoney(topItem.peak_period_value || 0)}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GanttParetoModal;
