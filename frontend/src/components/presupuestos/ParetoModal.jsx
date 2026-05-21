import React, { useContext, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Search, TrendingUp, X } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { presupuestosApi } from '../../api/presupuestos';
import { normalizeTextInputValue } from '../../utils/normalizeInputValue';
import { normalizeDescriptionCapitalization } from '../../utils/descriptionCapitalization';
import { AuthContext } from '../../context/AuthContext';
import { includesNormalized, normalizeSearchToken } from '../../utils/normalizeSearch';
import ClearSearchField from '../ui/ClearSearchField';
import {
    PORTABLE_WORKSPACE_EVENT,
    readPortableWorkspaceOverride,
    resolvePortableWorkspace,
} from '../../utils/portableWorkspace';
import { APP_MODAL_CLOSE_BUTTON_CLASS } from '../ui/app-modal';

const TOP_OPTIONS = [10, 20, 50];
const VIEW_OPTIONS = [
    { id: 'global', label: 'Paquetes' },
    { id: 'capitulos', label: 'Cuentas' }
];

const formatMoney = (value) =>
    Number(value || 0).toLocaleString('es-ES', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

const formatCount = (value) => Number(value || 0).toLocaleString('es-ES');

const cx = (...classes) => classes.filter(Boolean).join(' ');
const renderDescription = (value) => normalizeDescriptionCapitalization(value);
const sanitizeSearchValue = (value) => {
    const normalized = normalizeTextInputValue(value);
    return normalized.trim().toLowerCase() === 'null' ? '' : normalized;
};

const MetricCell = ({ label, value, accent = false }) => (
    <div className="min-w-0 px-4 py-3 border-r last:border-r-0 border-zinc-200">
        <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">{label}</div>
        <div className={cx('mt-1 text-[15px] font-black tracking-tight tabular-nums', accent ? 'text-[#F39200]' : 'text-zinc-900')}>
            {value}
        </div>
    </div>
);

const PillButton = ({ active, onClick, children }) => (
    <button
        onClick={onClick}
        className={cx(
            'h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-[0.16em] border transition-all',
            active
                ? 'bg-zinc-900 border-zinc-900 text-white'
                : 'bg-white border-zinc-200 text-zinc-500 hover:border-[#F39200]/50 hover:text-zinc-900'
        )}
    >
        {children}
    </button>
);

const ParetoModal = ({ isOpen, onClose, presupuestoId, onNavigateToItem }) => {
    const { user } = useContext(AuthContext);
    const [view, setView] = useState('global');
    const [top, setTop] = useState(20);
    const [onlyCritical, setOnlyCritical] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [data, setData] = useState(null);
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [drilldownChapter, setDrilldownChapter] = useState(null);
    const [forcedPortableWorkspace, setForcedPortableWorkspace] = useState(() => readPortableWorkspaceOverride());
    const [viewport, setViewport] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    }));

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const syncViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        const syncPortableOverride = () => setForcedPortableWorkspace(readPortableWorkspaceOverride());
        syncViewport();
        syncPortableOverride();
        window.addEventListener('resize', syncViewport);
        window.addEventListener('storage', syncPortableOverride);
        window.addEventListener(PORTABLE_WORKSPACE_EVENT, syncPortableOverride);
        return () => {
            window.removeEventListener('resize', syncViewport);
            window.removeEventListener('storage', syncPortableOverride);
            window.removeEventListener(PORTABLE_WORKSPACE_EVENT, syncPortableOverride);
        };
    }, []);

    const isCompactViewport = resolvePortableWorkspace({
        width: viewport.width,
        height: viewport.height,
        forced: user?.role === 'superadmin' && forcedPortableWorkspace,
    });

    useEffect(() => {
        if (!isOpen || !presupuestoId) return;

        const fetchPareto = async () => {
            try {
                setLoading(true);
                setError('');
                const response = await presupuestosApi.getPareto(presupuestoId, {
                    view,
                    top,
                    ...(onlyCritical ? { cutoff_percent: 80 } : {}),
                    ...(view === 'capitulos' && drilldownChapter ? { edt_id: drilldownChapter.edt_id } : {})
                });
                setData(response);
                setSelectedItemId(response.items[0]?.id ?? null);
            } catch (fetchError) {
                console.error('Error cargando vista Pareto:', fetchError);
                setError('No fue posible cargar el analisis Pareto de este presupuesto.');
            } finally {
                setLoading(false);
            }
        };

        fetchPareto();
    }, [isOpen, presupuestoId, top, onlyCritical, view, drilldownChapter]);

    useEffect(() => {
        if (!isOpen) return;
        setView('global');
        setTop(20);
        setOnlyCritical(false);
        setSearch('');
        setError('');
        setData(null);
        setSelectedItemId(null);
        setDrilldownChapter(null);
    }, [isOpen]);

    useEffect(() => {
        setDrilldownChapter(null);
        setSearch('');
        setSelectedItemId(null);
    }, [view]);

    const filteredItems = useMemo(() => {
        const items = data?.items || [];
        const normalizedSearch = normalizeSearchToken(sanitizeSearchValue(search));
        if (!normalizedSearch) return items;

        return items.filter((item) =>
            includesNormalized(`${item.codigo || ''} ${item.descripcion || ''}`, normalizedSearch)
        );
    }, [data, search]);

    const selectedItem = filteredItems.find((item) => item.id === selectedItemId) || filteredItems[0] || null;
    const topItem = data?.items?.[0] || null;
    const isChapterDrilldown = view === 'capitulos' && Boolean(drilldownChapter);

    const handleNavigate = (item) => {
        if (!item || !onNavigateToItem) return;
        onNavigateToItem({
            itemType: item.item_type,
            edtId: item.edt_id,
            lineaId: item.linea_id
        });
    };

    const handleItemClick = (item) => {
        if (view === 'capitulos' && !isChapterDrilldown && item.item_type === 'capitulo') {
            setDrilldownChapter(item);
            return;
        }
        setSelectedItemId(item.id);
    };

    const handleItemDoubleClick = (item) => {
        if (view === 'capitulos' && !isChapterDrilldown && item.item_type === 'capitulo') {
            setDrilldownChapter(item);
            return;
        }
        handleNavigate(item);
    };

    if (!isOpen) return null;

    const headerSubtitle = isChapterDrilldown
        ? `Cuenta ${data?.scope_codigo || drilldownChapter?.codigo || ''} · ${renderDescription(data?.scope_descripcion || drilldownChapter?.descripcion || '')}`
        : view === 'global'
            ? 'Incidencia económica por partidas y APUs del presupuesto'
            : 'Cuentas ordenadas por su peso sobre el presupuesto';

    return (
        <div className={cx('fixed inset-0 z-[100] flex items-center justify-center bg-black/35 backdrop-blur-sm', isCompactViewport ? 'p-2' : 'p-4')}>
            <Card className={cx(
                'w-full bg-[#F3F4F6] shadow-2xl overflow-hidden border border-zinc-300',
                isCompactViewport ? 'max-w-none h-[96vh] rounded-[1.35rem]' : 'max-w-[1500px] h-[88vh] rounded-[1.75rem]'
            )}>
                <div className="h-full flex flex-col">
                    <div className={cx('bg-white border-b border-zinc-200 shrink-0', isCompactViewport ? 'px-4 py-3' : 'px-6 py-4')}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-2xl border border-orange-200 bg-orange-50 flex items-center justify-center">
                                        <BarChart3 className="w-4 h-4 text-[#F39200]" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[12px] font-black uppercase tracking-[0.18em] text-zinc-900">
                                            Pareto
                                        </div>
                                        <div className="text-[11px] text-zinc-500 font-medium truncate">
                                            {headerSubtitle}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className={`${APP_MODAL_CLOSE_BUTTON_CLASS} !h-9 !w-9 !rounded-[0.75rem]`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className={cx('mt-4 flex flex-col gap-3', !isCompactViewport && 'xl:flex-row xl:items-center xl:justify-between')}>
                            <div className="flex flex-wrap items-center gap-2">
                                {isChapterDrilldown ? (
                                    <button
                                        onClick={() => setDrilldownChapter(null)}
                                        className="h-8 px-3 rounded-xl text-[10px] font-black uppercase tracking-[0.16em] border border-zinc-200 bg-white text-zinc-600 hover:border-[#F39200]/50 hover:text-zinc-900 flex items-center gap-2"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        Volver
                                    </button>
                                ) : null}

                                {VIEW_OPTIONS.map((option) => (
                                    <PillButton key={option.id} active={view === option.id} onClick={() => setView(option.id)}>
                                        {option.label}
                                    </PillButton>
                                ))}

                                <div className="w-px h-6 bg-zinc-200 mx-1" />

                                {TOP_OPTIONS.map((option) => (
                                    <PillButton key={option} active={top === option} onClick={() => setTop(option)}>
                                        Top {option}
                                    </PillButton>
                                ))}

                                <PillButton active={onlyCritical} onClick={() => setOnlyCritical((current) => !current)}>
                                    Hasta 80%
                                </PillButton>
                            </div>

                                <ClearSearchField
                                value={sanitizeSearchValue(search)}
                                onValueChange={(value) => setSearch(sanitizeSearchValue(value))}
                                placeholder="Filtrar código o descripción"
                                containerClassName={cx('w-full', !isCompactViewport && 'xl:w-[320px]')}
                                inputClassName="w-full h-9 rounded-xl bg-zinc-50 border border-zinc-200 pl-10 pr-10 text-[12px] font-medium text-zinc-700 outline-none focus:border-[#F39200]"
                            />
                        </div>
                    </div>

                    <CardContent className="flex-1 min-h-0 p-0">
                        <div className="h-full flex flex-col">
                            <div className={cx('bg-white border-b border-zinc-200 shrink-0', isCompactViewport ? 'grid grid-cols-2' : 'grid grid-cols-2 lg:grid-cols-4')}>
                                <MetricCell
                                    label={isChapterDrilldown ? 'Total capítulo' : 'Total analizado'}
                                    value={`$${formatMoney(data?.total)}`}
                                />
                                <MetricCell
                                    label={isChapterDrilldown ? 'Líneas visibles' : 'Items visibles'}
                                    value={formatCount(data?.visible_items || 0)}
                                />
                                <MetricCell
                                    label="Acumulado visible"
                                    value={`${(data?.visible_acumulado || 0).toFixed(1)}%`}
                                />
                                <MetricCell
                                    label={isChapterDrilldown ? 'Dominante capítulo' : 'Dominante actual'}
                                    value={topItem ? `${topItem.codigo || 'S/C'}` : '-'}
                                    accent
                                />
                            </div>

                            <div className={cx('flex-1 min-h-0 grid grid-cols-1', !isCompactViewport && 'xl:grid-cols-[minmax(0,1fr)_320px]')}>
                                <div className={cx('min-h-0 flex flex-col', !isCompactViewport && 'border-r border-zinc-200')}>
                                    <div className={cx('bg-zinc-50 border-b border-zinc-200 shrink-0', isCompactViewport ? 'px-4 py-2.5' : 'px-5 py-3')}>
                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                            {isChapterDrilldown
                                                ? 'Detalle interno de la cuenta'
                                                : view === 'global'
                                                    ? 'Ranking de paquetes'
                                                    : 'Ranking de cuentas'}
                                        </div>
                                        <div className="mt-1 text-[11px] text-zinc-500">
                                            {isChapterDrilldown
                                                ? 'Los porcentajes se calculan contra el total de la cuenta seleccionada.'
                                                : view === 'capitulos'
                                                    ? 'Pulsa una cuenta para abrir sus partidas ordenadas por valor.'
                                                    : null}
                                        </div>
                                    </div>

                                    <div className="flex-1 min-h-0 flex flex-col bg-white">
                                            {isCompactViewport ? (
                                                <div className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 border-b border-zinc-200 shrink-0">
                                                    Detalle listado
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-[40px_92px_minmax(260px,1.35fr)_112px_72px_86px] gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 border-b border-zinc-200 shrink-0">
                                                    <span>#</span>
                                                    <span>Código</span>
                                                    <span>Descripción</span>
                                                    <span className="text-right">Monto</span>
                                                    <span className="text-right">%</span>
                                                    <span className="text-right">Acum.</span>
                                                </div>
                                            )}
                                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
                                                {loading ? (
                                                    <div className="h-full flex items-center justify-center">
                                                        <div className="w-9 h-9 border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" />
                                                    </div>
                                                ) : error ? (
                                                    <div className="h-full flex items-center justify-center text-[11px] font-bold uppercase tracking-[0.16em] text-red-500 text-center px-8">
                                                        {error}
                                                    </div>
                                                ) : filteredItems.length === 0 ? (
                                                    <div className="h-full flex items-center justify-center text-[11px] font-bold uppercase tracking-[0.16em] text-zinc-400 text-center px-8">
                                                        No hay elementos que coincidan con el filtro aplicado.
                                                    </div>
                                                ) : (
                                                    filteredItems.map((item) => (
                                                        <button
                                                            key={`row-${item.id}`}
                                                            onClick={() => handleItemClick(item)}
                                                            onDoubleClick={() => handleItemDoubleClick(item)}
                                                            className={cx(
                                                                isCompactViewport
                                                                    ? 'w-full px-4 py-3 text-[12px] border-b border-zinc-100 transition-colors'
                                                                    : 'w-full grid grid-cols-[40px_92px_minmax(260px,1.35fr)_112px_72px_86px] gap-3 px-5 py-2.5 text-[12px] border-b border-zinc-100 transition-colors',
                                                                selectedItem?.id === item.id ? 'bg-orange-50' : 'hover:bg-zinc-50'
                                                            )}
                                                        >
                                                            {isCompactViewport ? (
                                                                <div className="space-y-2 text-left">
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div className="min-w-0">
                                                                            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                                                                #{item.ranking} · {item.codigo || 'S/C'}
                                                                            </div>
                                                                            <div className="mt-1 font-semibold text-zinc-800 leading-tight">
                                                                                {renderDescription(item.descripcion)}
                                                                            </div>
                                                                        </div>
                                                                        <div className="font-black tabular-nums text-right text-zinc-900 shrink-0">
                                                                            ${formatMoney(item.valor)}
                                                                        </div>
                                                                    </div>
                                                                    <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                                                                        <span>% base: {item.porcentaje.toFixed(2)}%</span>
                                                                        <span className="text-right">Acum.: {item.porcentaje_acumulado.toFixed(2)}%</span>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <span className="font-black text-zinc-500">#{item.ranking}</span>
                                                                    <span className="font-mono text-[11px] text-zinc-600 truncate">{item.codigo || 'S/C'}</span>
                                                                    <span className="min-w-0 text-left">
                                                                        <span
                                                                            className="block font-semibold text-zinc-800 leading-tight pr-2"
                                                                            title={item.descripcion}
                                                                            style={{
                                                                                display: '-webkit-box',
                                                                                WebkitLineClamp: 2,
                                                                                WebkitBoxOrient: 'vertical',
                                                                                overflow: 'hidden',
                                                                                whiteSpace: 'normal',
                                                                                wordBreak: 'break-word',
                                                                            }}
                                                                        >
                                                                            {renderDescription(item.descripcion)}
                                                                        </span>
                                                                        <span className="mt-1 block h-1 rounded-full bg-zinc-100 overflow-hidden">
                                                                            <span
                                                                                className={cx(
                                                                                    'block h-full rounded-full',
                                                                                    item.porcentaje_acumulado <= 80 ? 'bg-[#F39200]/80' : 'bg-zinc-400/80'
                                                                                )}
                                                                                style={{ width: `${Math.max(item.porcentaje, 2)}%` }}
                                                                            />
                                                                        </span>
                                                                    </span>
                                                                    <span className="font-black tabular-nums text-right text-zinc-900">${formatMoney(item.valor)}</span>
                                                                    <span className="font-bold tabular-nums text-right text-zinc-600">{item.porcentaje.toFixed(2)}%</span>
                                                                    <span className="font-bold tabular-nums text-right text-zinc-600">{item.porcentaje_acumulado.toFixed(2)}%</span>
                                                                </>
                                                            )}
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                    </div>
                                </div>

                                <aside className={cx('min-h-0 bg-[#FBFBFC] flex flex-col', isCompactViewport && 'border-t border-zinc-200')}>
                                    <div className={cx('border-b border-zinc-200', isCompactViewport ? 'px-4 py-3' : 'px-5 py-4')}>
                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Detalle técnico</div>
                                        <div className="mt-1 text-[11px] text-zinc-500">
                                            {selectedItem
                                                ? selectedItem.item_type === 'linea'
                                                    ? 'Partida lista para revisión o navegación al editor.'
                                                    : 'Cuenta agregada sobre el total del presupuesto.'
                                                : 'Sin selección activa.'}
                                        </div>
                                    </div>

                                    <div className={cx('flex-1 min-h-0 overflow-y-auto custom-scrollbar', isCompactViewport ? 'p-4' : 'p-5')}>
                                        {selectedItem ? (
                                            <div className="space-y-4">
                                                <div className="pb-4 border-b border-zinc-200">
                                                    <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                                        {selectedItem.codigo || 'SIN CÓDIGO'}
                                                    </div>
                                                    <div className="mt-1 text-[14px] font-black text-zinc-900 leading-tight">
                                                        {renderDescription(selectedItem.descripcion)}
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                                                        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">Monto</div>
                                                        <div className="mt-1 text-[15px] font-black tabular-nums text-zinc-900">${formatMoney(selectedItem.valor)}</div>
                                                    </div>
                                                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                                                        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">% base</div>
                                                        <div className="mt-1 text-[15px] font-black tabular-nums text-zinc-900">{selectedItem.porcentaje.toFixed(2)}%</div>
                                                    </div>
                                                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                                                        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">Acumulado</div>
                                                        <div className="mt-1 text-[15px] font-black tabular-nums text-zinc-900">{selectedItem.porcentaje_acumulado.toFixed(2)}%</div>
                                                    </div>
                                                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                                                        <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">Cantidad</div>
                                                        <div className="mt-1 text-[15px] font-black tabular-nums text-zinc-900">{formatCount(selectedItem.cantidad || 0)}</div>
                                                    </div>
                                                </div>

                                                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                                                        <div className="flex items-center gap-2 text-[#F39200]">
                                                            <TrendingUp className="w-4 h-4" />
                                                            <span className="text-[10px] font-black uppercase tracking-[0.16em]">Lectura</span>
                                                        </div>
                                                        <p className="mt-2 text-[12px] leading-relaxed text-zinc-600">
                                                            {selectedItem.item_type === 'linea'
                                                                ? isChapterDrilldown
                                                                    ? 'Esta partida está medida contra el total de la cuenta actual. El doble clic o el botón inferior la llevan al editor para revisión o tanteo.'
                                                                    : 'Esta partida está medida contra el total analizado de paquetes. El doble clic o el botón inferior la llevan al editor para revisión o tanteo.'
                                                            : 'Esta cuenta está medida contra el total del presupuesto. Pulsa sobre ella para abrir sus partidas ordenadas internamente.'}
                                                        </p>
                                                    </div>
                                                </div>
                                        ) : (
                                            <div className="text-[12px] text-zinc-500">
                                                No hay un elemento seleccionado.
                                            </div>
                                        )}
                                    </div>

                                    <div className={cx('border-t border-zinc-200 bg-white', isCompactViewport ? 'p-4' : 'p-5')}>
                                        {selectedItem?.item_type === 'linea' ? (
                                            <button
                                                onClick={() => handleNavigate(selectedItem)}
                                                className="w-full h-10 rounded-xl bg-[#F39200] text-white text-[10px] font-black uppercase tracking-[0.16em] hover:brightness-95 transition-all"
                                            >
                                                Ir al editor
                                            </button>
                                        ) : (
                                            <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                                                {view === 'capitulos' && !isChapterDrilldown
                                                    ? 'Pulsa una cuenta para ver su detalle interno.'
                                                    : 'Doble clic sobre una partida para navegar al editor.'}
                                            </div>
                                        )}
                                    </div>
                                </aside>
                            </div>
                        </div>
                    </CardContent>
                </div>
            </Card>
        </div>
    );
};

export default ParetoModal;
