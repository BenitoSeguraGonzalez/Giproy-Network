import { AlertCircle, CircleCheck, CircleX, TriangleAlert } from 'lucide-react';

const SIGNAL_PRESENTATION = {
    ok: { label: 'OK', Icon: CircleCheck, chipClassName: 'border-emerald-200 bg-emerald-50 text-emerald-700' },
    review: { label: 'Revisar', Icon: TriangleAlert, chipClassName: 'border-amber-200 bg-amber-50 text-amber-800' },
    error: { label: 'Inconsistente', Icon: CircleX, chipClassName: 'border-rose-200 bg-rose-50 text-rose-700' },
    unavailable: { label: 'Sin datos', Icon: AlertCircle, chipClassName: 'border-zinc-200 bg-zinc-100 text-zinc-600' },
};

const formatNumber = (value, decimals = 2) => new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
}).format(Number(value || 0));

const formatCurrency = (value, currency = 'USD', decimals = 2) => new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
}).format(Number(value || 0));

const GanttApuPlanningSignalsPanel = ({
    model,
    pinned = false,
    currency = 'USD',
    moneyDecimals = 2,
    onTogglePinned,
    onDragPointerDown,
    onDragPointerMove,
    onDragPointerEnd,
    onPointerEnter,
    onPointerLeave,
}) => {
    const overallPresentation = SIGNAL_PRESENTATION[model?.overallStatus] || SIGNAL_PRESENTATION.unavailable;
    const OverallIcon = overallPresentation.Icon;
    const metrics = model?.metrics || {};
    const unit = model?.activity?.unit || 'u';
    const metricRows = model?.available ? [
        {
            label: 'Capacidad',
            values: [
                ['Ciclo gobernante', formatNumber(metrics.governingCycle, 4), `h/${unit}`],
                ['Factor plan', formatNumber(metrics.planningFactor * 100, 2), '%'],
                ['Producción teórica', formatNumber(metrics.theoreticalProduction, 4), `${unit}/h`],
                ['Producción plan', formatNumber(metrics.plannedProduction, 4), `${unit}/h`],
                ['Duración neta', formatNumber(metrics.netDurationHours, 4), 'h'],
                ['Duración plan', formatNumber(metrics.plannedDurationDays, 4), 'd'],
            ],
        },
        {
            label: 'Recursos',
            values: [
                ['Trabajo MO neto', formatNumber(metrics.laborNetHours, 4), 'HH'],
                ['Trabajo MO plan', formatNumber(metrics.laborPlannedHours, 4), 'HH'],
                ['Cuadrilla nominal', formatNumber(metrics.nominalCrew, 2), 'pers.'],
                ['Cuadrilla equivalente', formatNumber(metrics.equivalentCrew, 2), 'pers.'],
                ['Carga de cuadrilla', formatNumber(metrics.crewLoad * 100, 2), '%'],
                ['Equipos plan', formatNumber(metrics.equipmentPlannedHours, 4), 'EH'],
            ],
        },
        {
            label: 'Costo unitario',
            values: [
                ['Costo directo', formatCurrency(metrics.plannedDirectUnitCost, currency, moneyDecimals), ''],
                ['% indirecto', formatNumber(metrics.indirectPercentage, 2), '%'],
                ['Costo indirecto', formatCurrency(metrics.plannedUnitPrice - metrics.plannedDirectUnitCost, currency, moneyDecimals), ''],
                ['Precio plan', formatCurrency(metrics.plannedUnitPrice, currency, moneyDecimals), ''],
            ],
        },
    ] : [];

    return (
        <section
            id="gantt-apu-planning-signals-panel"
            data-testid="gantt-apu-planning-signals-panel"
            className="flex max-h-full flex-col overflow-hidden rounded-[1rem] border border-zinc-200 bg-white shadow-[0_6px_12px_rgba(15,23,42,0.12)]"
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            aria-label="Semáforos de planificación del APU seleccionado"
        >
            <div
                data-testid="gantt-apu-planning-signals-drag-handle"
                className="flex cursor-move touch-none select-none items-start justify-between gap-3 border-b border-zinc-200 px-4 py-3"
                onPointerDown={onDragPointerDown}
                onPointerMove={onDragPointerMove}
                onPointerUp={onDragPointerEnd}
                onPointerCancel={onDragPointerEnd}
                title="Arrastra para mover el panel"
            >
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <Gauge className="h-4 w-4 shrink-0 text-[#136191]" />
                        <h3 className="text-[12px] font-black text-zinc-900">Semáforos APU</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[9px] font-black ${overallPresentation.chipClassName}`}>
                            <OverallIcon className="h-3 w-3" />
                            {overallPresentation.label}
                        </span>
                    </div>
                    <p className="mt-1 truncate text-[11px] font-semibold text-zinc-600">
                        {model?.activity?.code ? `${model.activity.code} · ` : ''}
                        {model?.activity?.description || 'Selecciona una actividad calculable vinculada a un APU.'}
                    </p>
                    {model?.available ? (
                        <p className="mt-1 text-[10px] font-medium text-zinc-500">
                            Gobierna: <span className="font-bold text-zinc-700">{model.activity.governingResourceName}</span>
                            {model.activity.governingCandidateCount > 1 ? ` · ${model.activity.governingCandidateCount} candidatos` : ''}
                        </p>
                    ) : null}
                </div>
                <button
                    type="button"
                    onPointerDown={(event) => event.stopPropagation()}
                    onClick={onTogglePinned}
                    className={`inline-flex h-8 shrink-0 items-center gap-1.5 rounded-[0.75rem] border px-2.5 text-[9px] font-black transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200]/35 ${pinned ? 'border-[#F39200]/45 bg-[#fff7ed] text-[#F39200]' : 'border-zinc-200 bg-white text-zinc-600 hover:border-[#136191]/35 hover:text-[#136191]'}`}
                    aria-pressed={pinned}
                >
                    {pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
                    {pinned ? 'Desacoplar' : 'Fijar'}
                </button>
            </div>

            <div className="gantt-dark-scrollbar min-h-0 overflow-y-auto px-4 py-3">
                {!model?.available ? (
                    <div className="flex items-start gap-2 rounded-[0.85rem] bg-zinc-100 px-3 py-3 text-zinc-700">
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                        <p className="text-[11px] font-semibold leading-relaxed">
                            {model?.reason || 'No hay información suficiente para calcular los indicadores.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {metricRows.map((group) => (
                            <div key={group.label}>
                                <div className="mb-1.5 flex items-center gap-2">
                                    <span className="text-[10px] font-black text-zinc-800">{group.label}</span>
                                    <span className="h-px flex-1 bg-zinc-200" />
                                </div>
                                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                    {group.values.map(([label, value, valueUnit]) => (
                                        <div key={label} className="flex min-w-0 items-baseline justify-between gap-2 py-1">
                                            <span className="truncate text-[9px] font-semibold text-zinc-500">{label}</span>
                                            <span className="shrink-0 text-[10px] font-black tabular-nums text-zinc-900">
                                                {value}{valueUnit ? <span className="ml-1 text-[8px] text-zinc-500">{valueUnit}</span> : null}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
};

export default GanttApuPlanningSignalsPanel;
