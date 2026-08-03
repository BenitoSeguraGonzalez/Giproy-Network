import React from 'react';
import { Boxes, CalendarRange, CircleDollarSign, FileSpreadsheet, FileText, Layers, PackageCheck, Sigma } from 'lucide-react';
import { AppModalShell, AppModalHeader, AppModalBody, AppModalFooter } from '../ui/app-modal';
import { normalizeReportDescription, normalizeReportPersonName, normalizeReportUnit } from '../../utils/reportTextFormatting';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import AppHint from '../ui/AppHint';
import giproyAppIcon from '../../assets/LogoSoft.png';

const formatMoney = (value) => {
    const number = Number(value || 0);
    return new Intl.NumberFormat('es-EC', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(number);
};

const formatCalc = (value, decimals = 4) => {
    const number = Number(value || 0);
    return new Intl.NumberFormat('es-EC', {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimals,
    }).format(number);
};

const getDisplayDescription = (value, isStructural = false) => {
    return normalizeReportDescription(value, isStructural);
};

const PERSON_NAME_KEYS = new Set(['nombre_responsable', 'responsable', 'stakeholder_nombre', 'nombre_stakeholder']);

const getDisplayPersonName = (value) => normalizeReportPersonName(value);

const isPersonNameColumn = (column = {}) => column.kind === 'person' || PERSON_NAME_KEYS.has(column.key);

const isDocumentPersonLine = (linea = {}, reportKind = '') => {
    if (linea.nombre_responsable || linea.responsable || linea.stakeholder_nombre || linea.nombre_stakeholder) {
        return true;
    }
    if (reportKind === 'edt') {
        return Boolean(linea.codigo_stkr || String(linea.codigo_edt || linea.codigo || '').includes('.R'));
    }
    return false;
};

const isResourceUsagePreview = (preview = {}, item = {}) => {
    const variant = String(preview?.variant || '').toLowerCase();
    return item?.preview_layout === 'resource_usage'
        || (
            preview?.report_type === 'cronograma_valorado'
            && ['resources', 'resource_usage', 'uso_recursos', 'uso_de_recursos', 'resources_range', 'resource_usage_range', 'uso_recursos_rango'].includes(variant)
        );
};

const resolveDocumentTitleValue = (linea, titleKey, reportKind) => {
    const rawValue = linea?.[titleKey];
    if (PERSON_NAME_KEYS.has(titleKey) || isDocumentPersonLine(linea, reportKind)) {
        return getDisplayPersonName(rawValue);
    }
    return getDisplayDescription(rawValue, linea?.is_structural);
};

const normalizePreviewText = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const reportExportButtonBase = [
    'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[0.85rem] px-3',
    'text-[10px] font-black uppercase tracking-[0.14em]',
    'transition-[color,border-color,filter,transform,box-shadow] duration-200',
    'active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
].join(' ');

const reportExportButtonSoft = [
    reportExportButtonBase,
    'border border-zinc-200 bg-white/80 text-zinc-600',
    'shadow-[2px_2px_5px_rgba(148,163,184,0.18),-2px_-2px_5px_rgba(255,255,255,0.9)]',
    'hover:brightness-[0.99] hover:text-[#136191]',
    'active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff]',
].join(' ');

const reportModalCloseButtonClass = [
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem]',
    'border border-[#ececec] bg-[#ededed] text-zinc-600',
    'shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff]',
    'transition-[color,border-color,filter,transform,box-shadow] duration-200',
    'hover:brightness-[0.99] hover:text-[#136191]',
    'active:scale-[0.98] active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff]',
].join(' ');

const ReportExportButton = ({
    children,
    icon: Icon,
    iconSrc,
    iconClassName = 'h-4 w-4',
    labelClassName = '',
    className = '',
    onClick,
    disabled,
    title,
}) => (
    <AppHint content={title} tone="light">
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            aria-label={title}
            className={`${reportExportButtonSoft} ${className}`.trim()}
        >
            {iconSrc ? (
                <img src={iconSrc} alt="" aria-hidden="true" className={`${iconClassName} object-contain`} />
            ) : (
                <Icon className={iconClassName} />
            )}
            <span className={labelClassName}>{children}</span>
        </button>
    </AppHint>
);

const CommonReportPreviewModal = ({
    isOpen,
    onClose,
    preview,
    onExportExcel,
    onExportPdf,
    onExportPdfFromExcel,
    exporting = false,
}) => {
    const items = preview?.items || [];
    const isEdoReport = preview?.report_type === 'edo';
    const isEdtReport = preview?.report_type === 'edt';
    const edoDocumentTitle = 'Estructura de Descomposición de la Organización - EDO';
    const edtDocumentTitle = 'Estructura de Descomposición del Trabajo - EDT';
    const edoDocumentColumns = [
        { key: 'item', label: 'Ítem', kind: 'integer' },
        { key: 'rol_asignado', label: 'Rol Asignado' },
        { key: 'nombre_responsable', label: 'Nombre del Responsable' },
        { key: 'actividades_clave', label: 'Actividades clave' },
    ];
    const edtDocumentColumns = [
        { key: 'item', label: 'Ítem', kind: 'integer' },
        { key: 'codigo_edt', label: 'Cod. EDT' },
        { key: 'descripcion_cuenta_paquete', label: 'Descripción Cuenta / Paquete de Trabajo' },
    ];
    const resolveDocumentLine = (linea, lineIndex, reportKind) => {
        if (reportKind === 'edt') {
            return {
                item: linea?.item ?? lineIndex + 1,
                codigo_edt: linea?.codigo_edt || linea?.codigo || '',
                descripcion_cuenta_paquete: linea?.descripcion_cuenta_paquete || linea?.descripcion || '-',
                nombre_responsable: linea?.nombre_responsable || linea?.responsable || '',
                codigo_stkr: linea?.codigo_stkr || '',
                definicion: linea?.definicion || linea?.actividades_clave || linea?.actividades || '',
                subtotal_cuenta: linea?.subtotal_cuenta ?? linea?.subtotal ?? 0,
                is_structural: linea?.is_structural,
            };
        }
        return {
            item: linea?.item ?? lineIndex + 1,
            rol_asignado: linea?.rol_asignado || linea?.rol || linea?.unidad || '-',
            nombre_responsable: linea?.nombre_responsable || linea?.descripcion || '-',
            codigo_stkr: linea?.codigo_stkr || '',
            actividades_clave: linea?.actividades_clave || linea?.actividades || '',
            is_structural: linea?.is_structural,
        };
    };
    const resolveDocumentFieldMap = (item, reportKind) => {
        const fieldMap = Object.fromEntries((item.fields || []).map((field) => [field.label, field.value || '-']));
        const fallbackPattern = reportKind === 'edt' ? /\s*[·-]\s*EDT.*$/i : /\s*[·-]\s*EDO\s*$/i;
        const fallbackProjectName = String(item?.descripcion || '').replace(fallbackPattern, '').trim();
        return {
            'Nombre del Proyecto': fieldMap['Nombre del Proyecto'] || fallbackProjectName || '-',
            'Revisión': fieldMap.Revisión || 'R000',
            'Código del Proyecto': fieldMap['Código del Proyecto'] || item?.codigo || '-',
            'Código Referencial': fieldMap['Código Referencial'] || '-',
            Oferente: fieldMap.Oferente || '-',
            Ubicación: fieldMap.Ubicación || '-',
            Ciudad: fieldMap.Ciudad || '-',
            Fecha: fieldMap.Fecha || '-',
        };
    };
    const renderCellValue = (linea, column) => {
        const rawValue = linea?.[column.key];
        if (column.kind === 'money') {
            return `$${formatMoney(rawValue)}`;
        }
        if (column.kind === 'integer') {
            return rawValue === 0 || rawValue ? String(Math.trunc(Number(rawValue))) : '-';
        }
        if (isPersonNameColumn(column)) {
            return getDisplayPersonName(rawValue);
        }
        if (column.kind === 'calc') {
            return rawValue ?? '-';
        }
        return rawValue || '-';
    };
    const renderSummaryCard = (card, index, compact = false) => {
        const tone = card?.tone || (index === (card?.countHint ?? -1) ? 'total' : 'default');
        const isTotal = tone === 'total';
        const value = card?.kind === 'money'
            ? `$${formatMoney(card?.value)}`
            : (card?.value === 0 || card?.value ? String(card.value) : '-');
        return (
            <div
                key={`${card?.label || 'summary'}-${index}`}
                className={`min-w-0 rounded-2xl border ${compact ? 'px-3 py-2' : 'px-4 py-3'} ${
                    isTotal
                        ? 'border-orange-200 bg-orange-50'
                        : 'border-zinc-200 bg-zinc-50'
                }`}
            >
                <div className={`${compact ? 'text-[7px] leading-tight' : 'text-[8px]'} font-black uppercase tracking-widest ${isTotal ? 'text-[#F39200]' : 'text-zinc-400'}`}>
                    {card?.label || '-'}
                </div>
                <div className={`mt-1 whitespace-nowrap ${compact ? 'text-[15px] leading-tight' : 'text-lg'} font-black ${isTotal ? 'text-[#F39200]' : 'text-zinc-900'}`}>
                    {value}
                </div>
            </div>
        );
    };
    const shouldUseSingleLineSummary = (item) => {
        const cards = item.summary_cards || [];
        const isIndirectsReport = normalizePreviewText(`${item.descripcion || ''} ${item.metadata_hint || ''}`).includes('indirect');
        return item.summary_layout === 'single_line' || (cards.length === 4 && isIndirectsReport);
    };
    const resolveSummaryGridClass = (item, forceSingleLine = false) => {
        const count = (item.summary_cards || []).length;
        if (forceSingleLine && count > 0 && count <= 4) {
            if (count === 1) return 'grid-cols-1';
            if (count === 2) return 'grid-cols-2';
            if (count === 3) return 'grid-cols-3';
            return 'grid-cols-4';
        }
        if (count === 2) return 'grid-cols-2';
        return 'grid-cols-3';
    };
    const renderReportWarnings = (item, className = '') => {
        const warnings = Array.isArray(item?.warnings) ? item.warnings.filter(Boolean) : [];
        if (!warnings.length) return null;
        return (
            <div className={`space-y-2 ${className}`}>
                {warnings.map((warning, warningIndex) => {
                    const message = typeof warning === 'string' ? warning : warning?.message;
                    if (!message) return null;
                    return (
                        <div
                            key={`${item?.id || 'report'}-warning-${warningIndex}`}
                            className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-bold leading-snug text-amber-800"
                        >
                            {message}
                        </div>
                    );
                })}
            </div>
        );
    };
    const renderResourceUsagePreview = (item, index) => {
        const rows = item.resource_usage_rows?.length ? item.resource_usage_rows : (item.lineas || []);
        const periods = item.periods || [];
        const categoryPalette = {
            '1': {
                icon: Boxes,
                chip: 'border-blue-200 bg-blue-50 text-blue-700',
                row: 'bg-blue-50/70 text-blue-900',
                dot: 'bg-blue-500',
            },
            '2': {
                icon: PackageCheck,
                chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                row: 'bg-emerald-50/70 text-emerald-900',
                dot: 'bg-emerald-500',
            },
            '3': {
                icon: CalendarRange,
                chip: 'border-amber-200 bg-amber-50 text-amber-700',
                row: 'bg-amber-50/70 text-amber-900',
                dot: 'bg-amber-500',
            },
            '4': {
                icon: Sigma,
                chip: 'border-violet-200 bg-violet-50 text-violet-700',
                row: 'bg-violet-50/70 text-violet-900',
                dot: 'bg-violet-500',
            },
        };
        const groupedRows = rows.reduce((acc, row) => {
            const categoryId = String(row.categoria_id || String(row.categoria || '').split('.')[0] || '0');
            const key = row.categoria || 'Recursos';
            const current = acc.get(key) || {
                key,
                categoryId,
                rows: [],
                quantity: 0,
                cost: 0,
            };
            current.rows.push(row);
            current.quantity += Number(row.cantidad_total || 0);
            current.cost += Number(row.costo_total || 0);
            acc.set(key, current);
            return acc;
        }, new Map());
        const groups = [...groupedRows.values()].sort((a, b) => Number(a.categoryId) - Number(b.categoryId));
        const totalCost = rows.reduce((sum, row) => sum + Number(row.costo_total || 0), 0);
        const totalQuantity = rows.reduce((sum, row) => sum + Number(row.cantidad_total || 0), 0);
        const maxCost = Math.max(...groups.map((group) => group.cost), 1);
        const periodSummaries = periods.map((period, periodIndex) => {
            const cost = rows.reduce((sum, row) => sum + Number(row.period_costs?.[periodIndex] || 0), 0);
            const quantity = rows.reduce((sum, row) => sum + Number(row.period_quantities?.[periodIndex] || 0), 0);
            return {
                label: period.label || `P${periodIndex + 1}`,
                cost,
                quantity,
                percent: totalCost > 0 ? (cost / totalCost) * 100 : 0,
            };
        });
        const maxPeriodCost = Math.max(...periodSummaries.map((period) => period.cost), 1);
        const topResources = [...rows]
            .sort((a, b) => Number(b.costo_total || 0) - Number(a.costo_total || 0))
            .slice(0, 10);
        const periodPeak = periodSummaries.reduce((best, period) => (period.cost > (best?.cost || 0) ? period : best), null);

        return (
            <section key={`${item.id}-${index}-resource-usage`} className="overflow-hidden rounded-[1.35rem] border border-zinc-200 bg-white">
                <header className="border-b border-zinc-200 bg-[#111318] px-5 py-4 text-white">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full border border-[#F39200]/40 bg-[#F39200]/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-[#ffbd73]">
                                    Reporte estrella
                                </span>
                                <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-300">
                                    Cronogramas
                                </span>
                            </div>
                            <h3 className="mt-3 text-xl font-black uppercase tracking-[0.04em] text-white">
                                Uso de Recursos
                            </h3>
                            <p className="mt-1 max-w-4xl text-sm font-semibold leading-snug text-zinc-300">
                                {getDisplayDescription(item.descripcion, false)}
                            </p>
                            {item.metadata_hint ? (
                                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                                    {item.metadata_hint}
                                </p>
                            ) : null}
                            {renderReportWarnings(item, 'mt-3 max-w-4xl')}
                        </div>
                        <div className="grid min-w-0 grid-cols-3 gap-2 xl:w-[520px]">
                            {[
                                { label: 'Recursos', value: rows.length, icon: PackageCheck, tone: 'text-[#F39200]' },
                                { label: 'Periodos', value: periods.length, icon: CalendarRange, tone: 'text-[#136191]' },
                                { label: 'Costo directo', value: `$${formatMoney(totalCost)}`, icon: CircleDollarSign, tone: 'text-[#F39200]' },
                            ].map((card) => (
                                <div key={card.label} className="rounded-[0.85rem] border border-white/10 bg-white/[0.06] px-3 py-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">{card.label}</span>
                                        <card.icon className={`h-3.5 w-3.5 ${card.tone}`} />
                                    </div>
                                    <div className="mt-1 truncate text-base font-black text-white" title={String(card.value)}>
                                        {card.value}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </header>

                <div className="space-y-4 bg-[#f4f6f9] p-4">
                    <div className="grid gap-3 lg:grid-cols-4">
                        {groups.map((group) => {
                            const palette = categoryPalette[group.categoryId] || categoryPalette['1'];
                            const Icon = palette.icon;
                            const percent = Math.min(100, Math.max(0, (group.cost / maxCost) * 100));
                            return (
                                <article key={group.key} className="rounded-[1rem] border border-zinc-200 bg-white px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] ${palette.chip}`}>
                                                <Icon className="h-3.5 w-3.5" />
                                                {group.key}
                                            </div>
                                            <div className="mt-3 text-xl font-black text-zinc-950">
                                                ${formatMoney(group.cost)}
                                            </div>
                                            <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-400">
                                                {group.rows.length} recurso(s) · {formatCalc(group.quantity)} unid.
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                                        <div className={`h-full rounded-full ${palette.dot}`} style={{ width: `${percent}%` }} />
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="rounded-[1rem] border border-zinc-200 bg-white px-4 py-3">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">Lectura ejecutiva</p>
                                    <p className="mt-1 text-sm font-bold text-zinc-800">
                                        Recursos finales consolidados, concentracion de costo y periodos de mayor demanda.
                                    </p>
                                </div>
                                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
                                    Total cantidad {formatCalc(totalQuantity)}
                                </span>
                            </div>
                        </div>
                        <div className="rounded-[1rem] border border-blue-100 bg-blue-50 px-4 py-3 text-[11px] font-semibold leading-snug text-[#136191]">
                            Periodo pico: <span className="font-black">{periodPeak?.label || '-'}</span> · ${formatMoney(periodPeak?.cost || 0)}. Excel mantiene la matriz completa para trabajo operativo.
                        </div>
                    </div>

                    <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
                        <div className="rounded-[1rem] border border-zinc-200 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">Recursos gobernantes</p>
                                    <p className="mt-1 text-sm font-bold text-zinc-800">Top 10 por costo directo acumulado.</p>
                                </div>
                            </div>
                            <div className="space-y-2">
                                {topResources.map((row, rowIndex) => {
                                    const share = totalCost > 0 ? (Number(row.costo_total || 0) / totalCost) * 100 : 0;
                                    const categoryId = String(row.categoria_id || String(row.categoria || '').split('.')[0] || '0');
                                    const palette = categoryPalette[categoryId] || categoryPalette['1'];
                                    return (
                                        <article key={`${item.id}-top-resource-${row.recurso_id || rowIndex}`} className="rounded-[0.85rem] border border-zinc-100 bg-zinc-50 px-3 py-2">
                                            <div className="flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-zinc-600">
                                                            {rowIndex + 1}
                                                        </span>
                                                        <p className="truncate text-[12px] font-black text-zinc-900" title={getDisplayDescription(row.recurso, false)}>
                                                            {getDisplayDescription(row.recurso, false)}
                                                        </p>
                                                    </div>
                                                    <div className="mt-1 flex flex-wrap items-center gap-2 pl-8 text-[9px] font-bold uppercase tracking-[0.08em] text-zinc-400">
                                                        <span>{row.codigo || '-'}</span>
                                                        <span className={`rounded-full border px-2 py-0.5 ${palette.chip}`}>{row.categoria || '-'}</span>
                                                        <span>{formatCalc(row.cantidad_total)} {row.unidad || ''}</span>
                                                    </div>
                                                </div>
                                                <div className="shrink-0 text-right">
                                                    <div className="text-[12px] font-black tabular-nums text-zinc-950">${formatMoney(row.costo_total)}</div>
                                                    <div className="text-[9px] font-bold tabular-nums text-zinc-400">{formatCalc(share, 2)}%</div>
                                                </div>
                                            </div>
                                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white">
                                                <div className={`h-full rounded-full ${palette.dot}`} style={{ width: `${Math.min(100, Math.max(2, share))}%` }} />
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="rounded-[1rem] border border-zinc-200 bg-white p-4">
                            <div className="mb-3">
                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">Demanda por periodos</p>
                                <p className="mt-1 text-sm font-bold text-zinc-800">Costo directo requerido por periodo.</p>
                            </div>
                            <div className="space-y-2">
                                {periodSummaries.map((period, periodIndex) => (
                                    <div key={`${item.id}-period-summary-${periodIndex}`} className="grid grid-cols-[72px_minmax(0,1fr)_96px] items-center gap-3">
                                        <div className="truncate text-[10px] font-black uppercase tracking-[0.1em] text-zinc-500" title={period.label}>
                                            {period.label}
                                        </div>
                                        <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
                                            <div
                                                className="h-full rounded-full bg-[#136191]"
                                                style={{ width: `${Math.min(100, Math.max(2, (period.cost / maxPeriodCost) * 100))}%` }}
                                            />
                                        </div>
                                        <div className="text-right text-[11px] font-black tabular-nums text-zinc-900">
                                            ${formatMoney(period.cost)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="overflow-hidden rounded-[1rem] border border-zinc-200 bg-white">
                        <div className="border-b border-zinc-200 px-4 py-3">
                            <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">Listado ejecutivo consolidado</p>
                            <p className="mt-1 text-sm font-bold text-zinc-800">Todos los recursos finales, sin detallar la matriz periodo por periodo.</p>
                        </div>
                        <div className="max-h-[38dvh] overflow-auto">
                            <table className="min-w-full border-separate border-spacing-0 text-left">
                                <thead className="sticky top-0 z-10 bg-white">
                                    <tr className="text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
                                        <th className="sticky left-0 z-20 border-b border-zinc-200 bg-white px-4 py-3">Recurso</th>
                                        <th className="border-b border-zinc-200 px-3 py-3">Categoria</th>
                                        <th className="border-b border-zinc-200 px-3 py-3 text-right">Cant. total</th>
                                        <th className="border-b border-zinc-200 px-3 py-3 text-right">Costo total</th>
                                        <th className="border-b border-zinc-200 px-3 py-3 text-right">Peso</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groups.map((group) => {
                                        const palette = categoryPalette[group.categoryId] || categoryPalette['1'];
                                        return (
                                            <React.Fragment key={`${item.id}-group-${group.key}`}>
                                                <tr>
                                                    <td colSpan={5} className={`border-b border-zinc-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${palette.row}`}>
                                                        {group.key}
                                                    </td>
                                                </tr>
                                                {group.rows.map((row, rowIndex) => (
                                                    <tr key={`${item.id}-resource-${group.key}-${row.recurso_id || rowIndex}`} className="group border-b border-zinc-100 hover:bg-zinc-50">
                                                        <td className="sticky left-0 z-[1] min-w-[320px] border-b border-zinc-100 bg-white px-4 py-3 group-hover:bg-zinc-50">
                                                            <div className="text-[12px] font-black leading-snug text-zinc-900">
                                                                {getDisplayDescription(row.recurso, false)}
                                                            </div>
                                                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] font-bold text-zinc-400">
                                                                <span>{row.codigo || '-'}</span>
                                                                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                                                                <span>{row.unidad || '-'}</span>
                                                                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                                                                <span>{row.subcategoria || '-'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="min-w-[180px] border-b border-zinc-100 px-3 py-3">
                                                            <span className={`inline-flex rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.1em] ${palette.chip}`}>
                                                                {row.categoria || group.key}
                                                            </span>
                                                        </td>
                                                        <td className="border-b border-zinc-100 px-3 py-3 text-right text-[12px] font-black tabular-nums text-zinc-800">
                                                            {formatCalc(row.cantidad_total)}
                                                        </td>
                                                        <td className="border-b border-zinc-100 px-3 py-3 text-right text-[12px] font-black tabular-nums text-zinc-950">
                                                            ${formatMoney(row.costo_total)}
                                                        </td>
                                                        <td className="min-w-[120px] border-b border-zinc-100 px-3 py-3 text-right">
                                                            <div className="text-[11px] font-black tabular-nums text-zinc-800">
                                                                {formatCalc(totalCost > 0 ? (Number(row.costo_total || 0) / totalCost) * 100 : 0, 2)}%
                                                            </div>
                                                            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100">
                                                                <div
                                                                    className={`h-full rounded-full ${palette.dot}`}
                                                                    style={{ width: `${Math.min(100, Math.max(2, totalCost > 0 ? (Number(row.costo_total || 0) / totalCost) * 100 : 0))}%` }}
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </section>
        );
    };

    return (
        <AppModalShell isOpen={isOpen} onClose={onClose} size={items.some((item) => isResourceUsagePreview(preview, item)) ? '3xl' : '2xl'} zIndex="z-[1110]">
            <AppModalHeader
                title={preview?.title || 'Visor de Reporte'}
                subtitle={`${preview?.selection_count || 0} elemento(s) seleccionado(s)`}
                icon={Layers}
                onClose={onClose}
                closeButtonClassName={reportModalCloseButtonClass}
                closeIconClassName="h-4 w-4"
            />
            <AppModalBody className="max-h-[70dvh] overflow-y-auto space-y-6">
                {items.map((item, index) => {
                    const reportKind = isEdtReport || item.preview_layout === 'edt_document' ? 'edt' : 'edo';
                    const isDocumentReport = isEdoReport || isEdtReport || item.preview_layout === 'edo_document' || item.preview_layout === 'edt_document';
                    const useCompactSummary = shouldUseSingleLineSummary(item);
                    if (isResourceUsagePreview(preview, item)) {
                        return renderResourceUsagePreview(item, index);
                    }
                    if (isDocumentReport) {
                        const fieldMap = resolveDocumentFieldMap(item, reportKind);
                        const fallbackColumns = reportKind === 'edt' ? edtDocumentColumns : edoDocumentColumns;
                        const documentColumns = item.table_columns?.length ? item.table_columns : fallbackColumns;
                        const documentTitle = item.document_title || (reportKind === 'edt' ? edtDocumentTitle : edoDocumentTitle);
                        const documentAccent =
                            reportKind === 'edt'
                                ? {
                                      chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
                                      text: 'text-emerald-700',
                                  }
                                : {
                                      chip: 'border-blue-200 bg-blue-50 text-[#136191]',
                                      text: 'text-[#136191]',
                                  };
                        const metadataItems = [
                            ['Código del Proyecto', fieldMap['Código del Proyecto']],
                            ['Código Referencial', fieldMap['Código Referencial']],
                            ['Revisión', fieldMap.Revisión],
                            ['Ciudad', fieldMap.Ciudad],
                            ['Fecha', fieldMap.Fecha],
                        ].filter(([, value]) => value && value !== '-');
                        const titleKeys =
                            reportKind === 'edt'
                                ? ['descripcion_cuenta_paquete', 'descripcion', 'cuenta_control']
                                : ['nombre_responsable', 'responsable', 'rol_asignado'];
                        const preferredSupportingKeys =
                            reportKind === 'edt'
                                ? ['nombre_responsable', 'codigo_stkr', 'definicion', 'subtotal_cuenta']
                                : ['rol_asignado', 'actividades_clave', 'codigo_stkr'];
                        const excludedKeys = new Set(['item', 'codigo_edt', ...titleKeys]);
                        const supportingColumns = documentColumns.filter(
                            (column) => preferredSupportingKeys.includes(column.key) || !excludedKeys.has(column.key),
                        );

                        return (
                            <section key={`${item.id}-${index}`} className="rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-sm">
                                <div className="overflow-hidden rounded-[1.25rem] border border-zinc-200 bg-zinc-50/70">
                                    <header className="border-b border-zinc-200 bg-[#111318] px-5 py-4 text-white">
                                        <div className="flex flex-wrap items-start justify-between gap-4">
                                            <div className="min-w-0">
                                                <p className="font-display text-[10px] font-black uppercase tracking-[0.22em] text-[#F39200]">
                                                    GIPROY
                                                </p>
                                                <h3 className="mt-1 font-display text-lg font-black uppercase tracking-[0.08em]">
                                                    {documentTitle}
                                                </h3>
                                            </div>
                                            <span className="rounded-full border border-white/20 px-3 py-1 font-display text-[10px] font-black uppercase tracking-[0.16em] text-zinc-200">
                                                {reportKind}
                                            </span>
                                        </div>
                                    </header>

                                    <div className="space-y-4 p-5">
                                        <div className="rounded-[1rem] border border-zinc-200 bg-white p-4">
                                            <p className="font-display text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                                Nombre del Proyecto
                                            </p>
                                            <h4 className="mt-1 font-display text-base font-black uppercase tracking-[0.04em] text-zinc-950">
                                                {fieldMap['Nombre del Proyecto']}
                                            </h4>
                                            {metadataItems.length ? (
                                                <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
                                                    {metadataItems.map(([label, value]) => (
                                                        <div key={label} className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2">
                                                            <p className="font-display text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                                                {label}
                                                            </p>
                                                            <p className="mt-1 truncate text-sm font-bold text-zinc-800" title={value}>
                                                                {value}
                                                            </p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : null}
                                        </div>

                                        {Array.isArray(item.summary_cards) && item.summary_cards.length ? (
                                            <div className={`grid gap-3 ${resolveSummaryGridClass(item)}`}>
                                                {item.summary_cards.map((card, cardIndex) => renderSummaryCard(card, cardIndex))}
                                            </div>
                                        ) : null}

                                        {item.lineas?.length ? (
                                            <div className="space-y-3">
                                                {(item.lineas || []).map((rawLinea, lineIndex) => {
                                                    const linea = resolveDocumentLine(rawLinea, lineIndex, reportKind);
                                                    const titleKey = titleKeys.find((key) => linea[key]);
                                                    const titleValue = renderCellValue(linea, { key: titleKey });
                                                    const lineTitle = resolveDocumentTitleValue(linea, titleKey, reportKind) || '-';
                                                    const lineCode = reportKind === 'edt' ? linea.codigo_edt : linea.rol_asignado;
                                                    const visibleSupportingColumns = supportingColumns.filter((column) => {
                                                        const value = renderCellValue(linea, column);
                                                        return value && value !== '-' && value !== titleValue && value !== lineCode;
                                                    });

                                                    return (
                                                        <article
                                                            key={`${item.id}-document-card-${lineIndex}`}
                                                            className="rounded-[1rem] border border-zinc-200 bg-white p-4"
                                                        >
                                                            <div className="grid gap-3 sm:grid-cols-[64px_minmax(0,1fr)]">
                                                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 font-display text-sm font-black text-zinc-700">
                                                                    {linea.item || lineIndex + 1}
                                                                </div>
                                                                <div className="min-w-0">
                                                                    <div className="flex flex-wrap items-center gap-2">
                                                                        {lineCode ? (
                                                                            <span
                                                                                className={`rounded-full border px-2.5 py-1 font-display text-[10px] font-black uppercase tracking-[0.1em] ${documentAccent.chip}`}
                                                                            >
                                                                                {lineCode}
                                                                            </span>
                                                                        ) : null}
                                                                        {linea.is_structural ? (
                                                                            <span className="rounded-full border border-zinc-200 bg-zinc-100 px-2.5 py-1 font-display text-[10px] font-black uppercase tracking-[0.1em] text-zinc-500">
                                                                                Estructural
                                                                            </span>
                                                                        ) : null}
                                                                    </div>
                                                                    <p
                                                                        className={`mt-2 text-sm font-black leading-snug ${
                                                                            linea.is_structural ? `${documentAccent.text} uppercase` : 'text-zinc-900'
                                                                        }`}
                                                                    >
                                                                        {lineTitle}
                                                                    </p>
                                                                    {visibleSupportingColumns.length ? (
                                                                        <dl className="mt-3 grid gap-2 md:grid-cols-2">
                                                                            {visibleSupportingColumns.map((column) => (
                                                                                <div
                                                                                    key={`${item.id}-document-card-${lineIndex}-${column.key}`}
                                                                                    className="rounded-xl border border-zinc-100 bg-zinc-50 px-3 py-2"
                                                                                >
                                                                                    <dt className="font-display text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
                                                                                        {column.label}
                                                                                    </dt>
                                                                                    <dd className="mt-1 text-sm font-semibold leading-snug text-zinc-700">
                                                                                        {renderCellValue(linea, column)}
                                                                                    </dd>
                                                                                </div>
                                                                            ))}
                                                                        </dl>
                                                                    ) : null}
                                                                </div>
                                                            </div>
                                                        </article>
                                                    );
                                                })}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <div className="mt-3 flex gap-8 px-1 text-[12px] font-medium text-zinc-800">
                                    <span>{fieldMap.Ciudad}</span>
                                    <span>{fieldMap.Fecha}</span>
                                </div>
                            </section>
                        );
                    }
                    return (
                    <section key={`${item.id}-${index}`} className={`rounded-[2rem] border border-zinc-200 bg-white shadow-sm ${useCompactSummary ? 'p-5' : 'p-6'}`}>
                        <div className={`${useCompactSummary ? 'mb-4 grid grid-cols-[minmax(0,1fr)_minmax(560px,640px)] items-start gap-4 pb-3' : 'mb-5 flex items-start justify-between gap-6 pb-4'} border-b border-zinc-100`}>
                            <div className="min-w-0">
                                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">{item.codigo}</div>
                                <h3 className={`mt-1 break-words tracking-tight text-zinc-900 ${item.is_structural ? 'text-xl font-black' : 'text-xl font-bold'}`}>
                                    {getDisplayDescription(item.descripcion, item.is_structural)}
                                </h3>
                                {item.categoria_base ? (
                                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                        Categoría base: <span className="text-zinc-700 normal-case tracking-normal font-bold">{getDisplayDescription(item.categoria_base, false) || '-'}</span>
                                    </p>
                                ) : null}
                                <p className="mt-2 text-[11px] font-bold uppercase tracking-widest text-zinc-400">Unidad: {normalizeReportUnit(item.unidad || '-')}</p>
                                {item.metadata_hint ? (
                                    <p className="mt-2 text-[11px] font-semibold text-zinc-500">{item.metadata_hint}</p>
                                ) : null}
                                {renderReportWarnings(item, 'mt-3')}
                            </div>
                            <div className={`min-w-0 grid w-full gap-3 text-right ${resolveSummaryGridClass(item, useCompactSummary)}`}>
                                {(item.summary_cards || [
                                    { label: 'Directo', value: item.costo_directo, kind: item.summary_direct_kind || 'money' },
                                    { label: 'Indirecto', value: item.costo_indirecto, kind: item.summary_indirect_kind || 'money' },
                                    { label: 'Total', value: item.precio_total, kind: item.summary_total_kind || 'money', tone: 'total' },
                                ]).map((card, cardIndex) => renderSummaryCard(card, cardIndex, useCompactSummary))}
                            </div>
                        </div>
                        {item.fields?.length ? (
                            useCompactSummary ? (
                                <div className="overflow-hidden rounded-[1rem] border border-zinc-100 bg-white">
                                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
                                        {item.fields.map((field, fieldIndex) => (
                                            <div
                                                key={`${item.id}-field-${fieldIndex}`}
                                                className="min-w-0 border-b border-r border-zinc-100 px-3 py-2 last:border-r-0 xl:border-b-0"
                                            >
                                                <div className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400" title={field.label}>
                                                    {field.label}
                                                </div>
                                                <div className="mt-1 truncate text-[11px] font-bold text-zinc-700" title={field.value || '-'}>
                                                    {field.value || '-'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-[1.5rem] border border-zinc-100">
                                    <div className="grid grid-cols-[220px_minmax(0,1fr)]">
                                        {item.fields.map((field, fieldIndex) => (
                                            <React.Fragment key={`${item.id}-field-${fieldIndex}`}>
                                                <div className="border-t border-zinc-100 bg-zinc-50 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                    {field.label}
                                                </div>
                                                <div className="border-t border-zinc-100 px-4 py-3 text-[12px] font-semibold text-zinc-700">
                                                    {field.value || '-'}
                                                </div>
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            )
                        ) : null}
                        {item.image_referencial_url || item.map_image_url ? (
                            <div className={`grid gap-4 ${item.image_referencial_url && item.map_image_url ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
                                {item.image_referencial_url ? (
                                    <div className="overflow-hidden rounded-[1.5rem] border border-zinc-100 bg-white p-3 shadow-sm">
                                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                            Imagen referencial
                                        </div>
                                        <img
                                            src={resolveMediaUrl(item.image_referencial_url)}
                                            alt="Imagen referencial del proyecto"
                                            className="h-auto max-h-[320px] w-full rounded-[1.25rem] border border-zinc-200 object-cover"
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                        />
                                    </div>
                                ) : null}
                                {item.map_image_url ? (
                                    <div className="overflow-hidden rounded-[1.5rem] border border-zinc-100 bg-white p-3 shadow-sm">
                                        <div className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                            Georreferenciación
                                        </div>
                                        <img
                                            src={resolveMediaUrl(item.map_image_url)}
                                            alt="Mapa del proyecto"
                                            className="h-auto max-h-[320px] w-full rounded-[1.25rem] border border-zinc-200 object-cover"
                                            loading="lazy"
                                            referrerPolicy="no-referrer"
                                        />
                                    </div>
                                ) : null}
                            </div>
                        ) : null}
                        {item.lineas?.length ? (
                            <div className="overflow-x-auto rounded-[1.5rem] border border-zinc-100">
                                <table className="w-full text-left">
                                    <thead className="bg-zinc-50">
                                        <tr>
                                            {(item.table_columns || [
                                                { key: 'codigo', label: 'Código' },
                                                { key: 'descripcion', label: 'Descripción' },
                                                { key: 'unidad', label: 'Unidad' },
                                                { key: 'cantidad', label: 'Cant.' },
                                                { key: 'precio', label: 'Precio', kind: 'money' },
                                                { key: 'rendimiento', label: 'Rend.' },
                                                { key: 'subtotal', label: 'Subtotal', kind: 'money' },
                                            ]).map((column) => (
                                                <th key={column.key} className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                    {column.label}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(item.lineas || []).map((linea, lineIndex) => (
                                            <tr key={`${item.id}-line-${lineIndex}`} className="border-t border-zinc-100">
                                                {(item.table_columns || [
                                                    { key: 'codigo', label: 'Código' },
                                                    { key: 'descripcion', label: 'Descripción' },
                                                    { key: 'unidad', label: 'Unidad' },
                                                    { key: 'cantidad', label: 'Cant.' },
                                                    { key: 'precio', label: 'Precio', kind: 'money' },
                                                    { key: 'rendimiento', label: 'Rend.' },
                                                    { key: 'subtotal', label: 'Subtotal', kind: 'money' },
                                                ]).map((column) => {
                                                    const isDescription = column.key === 'descripcion';
                                                    const isUnit = column.key === 'unidad';
                                                    const value = renderCellValue(linea, column);
                                                    return (
                                                        <td
                                                            key={`${item.id}-line-${lineIndex}-${column.key}`}
                                                            className={`px-4 py-3 ${isDescription ? `text-zinc-800 ${linea.is_structural ? 'text-[12px] font-black uppercase tracking-[0.04em]' : 'text-[12px] font-bold'}` : column.kind === 'money' ? 'text-[11px] font-black text-zinc-800' : 'text-[11px] text-zinc-500'}`}
                                                        >
                                                            {isDescription ? (
                                                                linea.is_structural ? (
                                                                    getDisplayDescription(value, true) || '-'
                                                                ) : (
                                                                    <div className="pl-3">{getDisplayDescription(value, false) || '-'}</div>
                                                                )
                                                            ) : isUnit ? (
                                                                normalizeReportUnit(value)
                                                            ) : (
                                                                value
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : null}
                    </section>
                    );
                })}
            </AppModalBody>
            <AppModalFooter variant="flat" className="justify-end py-2.5 md:py-3">
                <div className="flex flex-wrap items-center justify-end gap-2.5">
                    {typeof onExportPdf === 'function' ? (
                        <ReportExportButton
                            iconSrc={giproyAppIcon}
                            onClick={onExportPdf}
                            disabled={exporting}
                            title="Exportar PDF"
                            iconClassName="h-6 w-auto"
                            labelClassName="sr-only"
                            className="w-[5.25rem]"
                        >
                            GIPROY
                        </ReportExportButton>
                    ) : null}
                    <ReportExportButton
                        icon={FileSpreadsheet}
                        onClick={onExportExcel}
                        disabled={exporting}
                        title="Exportar Excel"
                    >
                        Excel
                    </ReportExportButton>
                    {onExportPdfFromExcel ? (
                        <ReportExportButton
                            icon={FileText}
                            onClick={onExportPdfFromExcel}
                            disabled={exporting}
                            title="Exportar PDF desde Excel"
                        >
                            PDF
                        </ReportExportButton>
                    ) : null}
                </div>
            </AppModalFooter>
        </AppModalShell>
    );
};

export default CommonReportPreviewModal;
