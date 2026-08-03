import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { presupuestosApi } from '../../api/presupuestos';
import { proyectosApi } from '../../api/proyectos';
import { equipoApi } from '../../api/equipo';
import { usePresupuestoActions, usePresupuestoData, usePresupuestoSelection } from '../../context/PresupuestoContext';
import { AuthContext } from '../../context/AuthContext';
import reportingApi from '../../api/reporting';
import { extractBlobErrorMessage } from '../../utils/apiBlobErrors';
import {
    Percent,
    BarChart3,
    FileText,
    ListTree,
    Network,
    Minus,
    ChevronUp,
    ChevronRight,
    AlertTriangle,
    Trash2,
    X,
    Eraser,
    Calculator,
    ClipboardList,
    Search,
    Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { normalizeSearchToken } from '../../utils/normalizeSearch';
import CatalogoApuTab from './CatalogoApuTab';
import LineasPresupuestoTab from './LineasPresupuestoTab';
import ClearSearchField from '../ui/ClearSearchField';
import { LiquidButton } from '../ui/liquid-button';
import { getIndirectosStatus } from '../../utils/indirectosStatus';
import { appAlert, appConfirm, appPrompt } from '../../utils/appDialog';
import {
    readPortableWorkspaceOverride,
    resolvePortableWorkspace
} from '../../utils/portableWorkspace';
import { buildReportFileName, sanitizeReportContext } from '../../utils/reportFileName';
import { downloadBlobResponse } from '../../utils/blobDownload';
import ProjectSectionReportButton, {
    PROJECT_REPORT_BUTTON_ACTIVE_CLASS,
    ProjectReportMenu,
    ProjectReportMenuItem,
} from '../projects/ProjectSectionReportButton';

const MotionDiv = motion.div;
const TanteoTab = React.lazy(() => import('./TanteoTab'));
const ApuEditorModal = React.lazy(() => import('./ApuEditorModal'));
const IndirectosModal = React.lazy(() => import('./IndirectosModal'));
const ParetoModal = React.lazy(() => import('./ParetoModal'));
const NotasGeneralesModal = React.lazy(() => import('./NotasGeneralesModal'));
const CommonReportPreviewModal = React.lazy(() => import('../reporting/CommonReportPreviewModal'));
const ReportGenerationModal = React.lazy(() => import('../reporting/ReportGenerationModal'));

const cleanClipboardNumberCell = (value) => String(value || '').replace(/\u00A0/g, ' ').trim();

const parseClipboardNumericCell = (rawValue) => {
    const raw = cleanClipboardNumberCell(rawValue).replace(/\s+/g, '');
    if (!raw) return null;
    if (!/^[+-]?[\d.,]+$/.test(raw)) return Number.NaN;

    const sign = raw.startsWith('-') ? '-' : raw.startsWith('+') ? '+' : '';
    const unsigned = raw.replace(/^[+-]/, '');
    const lastDot = unsigned.lastIndexOf('.');
    const lastComma = unsigned.lastIndexOf(',');

    let normalized = unsigned;
    if (lastDot >= 0 && lastComma >= 0) {
        const decimalSeparator = lastDot > lastComma ? '.' : ',';
        const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';
        normalized = unsigned.replaceAll(thousandsSeparator, '').replace(decimalSeparator, '.');
    } else if (lastDot >= 0 || lastComma >= 0) {
        const separator = lastDot >= 0 ? '.' : ',';
        const occurrences = unsigned.split(separator).length - 1;
        if (occurrences > 1) {
            const lastIndex = unsigned.lastIndexOf(separator);
            const decimalsLength = unsigned.length - lastIndex - 1;
            normalized = decimalsLength > 0 && decimalsLength <= 6
                ? `${unsigned.slice(0, lastIndex).replaceAll(separator, '')}.${unsigned.slice(lastIndex + 1)}`
                : unsigned.replaceAll(separator, '');
        } else {
            const decimalsLength = unsigned.length - unsigned.lastIndexOf(separator) - 1;
            const looksLikeThousandsOnly = decimalsLength === 3 && /^\d{1,3}[.,]\d{3}$/.test(unsigned);
            normalized = looksLikeThousandsOnly ? unsigned.replace(separator, '') : unsigned.replace(separator, '.');
        }
    }

    const parsed = Number.parseFloat(`${sign}${normalized}`);
    return Number.isFinite(parsed) ? parsed : Number.NaN;
};

const parseClipboardNumberList = (clipboardText) => {
    const rows = String(clipboardText || '')
        .replace(/\r/g, '')
        .split('\n')
        .map((row) => row.trim())
        .filter(Boolean);

    const values = [];
    const invalidCells = [];

    rows.forEach((row) => {
        let cells = row.includes('\t') ? row.split('\t') : row.split(';');
        if (cells.length === 1) {
            const compactTokens = row.split(/\s+/).filter(Boolean);
            if (compactTokens.length > 1) {
                cells = compactTokens;
            }
        }

        cells
            .map((cell) => cleanClipboardNumberCell(cell))
            .filter(Boolean)
            .forEach((cell) => {
                const parsed = parseClipboardNumericCell(cell);
                if (!Number.isFinite(parsed)) {
                    invalidCells.push(cell);
                    return;
                }
                values.push(parsed);
            });
    });

    return { values, invalidCells };
};

const formatBudgetLinePreviewReference = (line) => {
    const itemVisible = String(line?.codigo_item || '').trim();
    if (itemVisible) return `Item ${itemVisible}`;
    return 'Item S/N';
};

const resolveEquipoErrorMessage = (error) => {
    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (detail?.message) return detail.message;
    if (detail?.code === 'equipo_edt_scope_denied') return 'No tienes alcance Equipo para esta EDT.';
    if (detail?.code === 'equipo_lock_conflict') return 'La línea o EDT ya tiene un lock Equipo activo.';
    return error?.message || 'No se pudo procesar la operación Equipo.';
};

const normalizeBudgetMiniMapSearch = (value) => normalizeSearchToken(value);

const budgetMiniMapNodeMatchesSearch = (node, query) => [
    node?.codigo,
    node?.nombre,
    node?.descripcion,
].some((value) => normalizeBudgetMiniMapSearch(value).includes(query));

const cloneBudgetMiniMapTreeWithFilter = (nodes = [], predicate) => (
    nodes.reduce((acc, node) => {
        if (node?.tipo_nodo !== 'CUENTA_PAQUETE') return acc;
        const filteredChildren = cloneBudgetMiniMapTreeWithFilter(node.hijos || [], predicate);
        if (predicate(node) || filteredChildren.length > 0) {
            acc.push({
                ...node,
                hijos: filteredChildren,
            });
        }
        return acc;
    }, [])
);

const flattenBudgetMiniMapTree = (nodes = [], bucket = []) => {
    nodes.forEach((node) => {
        if (node?.tipo_nodo !== 'CUENTA_PAQUETE') return;
        bucket.push(node);
        flattenBudgetMiniMapTree(node.hijos || [], bucket);
    });
    return bucket;
};

const BudgetMiniMapBranch = ({ node, selectedNodeId, onSelect, level = 0, searchActive = false }) => {
    const children = (node.hijos || []).filter((child) => child.tipo_nodo === 'CUENTA_PAQUETE');
    const isSelected = Number(selectedNodeId) === Number(node.id);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const hasChildren = children.length > 0;
    const shouldShowChildren = hasChildren && (searchActive || !isCollapsed);

    return (
        <div className="space-y-1">
            <div
                className={`flex w-full items-center gap-2 rounded-[1.1rem] border px-3 py-1.5 text-left transition ${
                    isSelected
                        ? 'border-b-blue-200 bg-blue-50/70 text-[#136191] shadow-[inset_0_0_0_1px_rgba(19,97,145,0.10)]'
                        : 'border-[#e6e3dc] bg-[#f8f8f6] text-zinc-700 hover:border-[#136191]/20 hover:bg-white'
                }`}
                style={{ marginLeft: `${level * 14}px` }}
                title={`${node.codigo} · ${node.nombre}`}
            >
                <button
                    type="button"
                    onClick={() => onSelect(node.id)}
                    className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#136191]/20"
                >
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] ${
                        isSelected ? 'bg-[#136191] text-white' : 'bg-white text-[#136191] ring-1 ring-[#d7e3ea]'
                    }`}>
                        {node.codigo}
                    </span>
                    <span className="min-w-0 truncate text-[10px] font-black uppercase leading-tight tracking-[0.08em]">
                        {node.nombre}
                    </span>
                </button>
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            setIsCollapsed((prev) => !prev);
                        }}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e3e3e3] bg-[#ededed] text-zinc-500 shadow-[1px_1px_4px_rgba(0,0,0,0.18),-1px_-1px_3px_rgba(255,255,255,0.58)] transition-[color,border-color,transform,box-shadow] duration-200 hover:border-[#F39200]/40 hover:text-[#F39200] active:scale-[0.98] active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff]"
                        title={shouldShowChildren ? 'Contraer cuenta EDT' : 'Expandir cuenta EDT'}
                        aria-expanded={shouldShowChildren}
                    >
                        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${shouldShowChildren ? 'rotate-90' : ''}`} />
                    </button>
                ) : null}
            </div>
            {shouldShowChildren && (
                <div className="space-y-1">
                    {children.map((child) => (
                        <BudgetMiniMapBranch
                            key={child.id}
                            node={child}
                            selectedNodeId={selectedNodeId}
                            onSelect={onSelect}
                            level={level + 1}
                            searchActive={searchActive}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const MemoBudgetMiniMapBranch = motion ? React.memo(BudgetMiniMapBranch) : React.memo(BudgetMiniMapBranch);

const BudgetSidebarActionButton = ({
    icon: Icon,
    label,
    onClick,
    disabled = false,
    title,
    toneClassName = 'text-white/74',
    hoverClassName = 'hover:border-[#F39200]/45 hover:text-[#F39200]',
    badge,
    dotClassName = '',
    animate = false,
}) => (
    <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        title={title || label}
        className={[
            'group relative flex h-9 w-full min-w-0 flex-col items-center justify-center rounded-[0.7rem] border border-white/8 bg-[#15181d] px-1 py-1 transition-all duration-200',
            'shadow-[3px_3px_8px_rgba(0,0,0,0.32),-2px_-2px_6px_rgba(255,255,255,0.045)] hover:bg-[#1b1f25] hover:shadow-[2px_2px_7px_rgba(0,0,0,0.36),-2px_-2px_7px_rgba(255,255,255,0.06)]',
            'active:translate-y-[1px] active:scale-[0.96] active:shadow-[inset_4px_4px_9px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.06)]',
            disabled ? 'pointer-events-none opacity-50' : '',
            toneClassName,
            hoverClassName,
        ].join(' ')}
    >
        {Icon ? (
            <Icon className={`mb-0.5 h-[11px] w-[11px] shrink-0 transition-transform duration-300 ${animate ? 'animate-pulse' : 'group-hover:scale-105'}`} />
        ) : null}
        <span className="text-[5px] font-black uppercase tracking-[0.1em] leading-none">{label}</span>
        {dotClassName ? (
            <span className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-[#111318] ${dotClassName}`} />
        ) : null}
        {badge != null ? (
            <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#F39200] px-1 text-[8px] font-black text-white">
                {badge}
            </span>
        ) : null}
    </button>
);

const BudgetCatalogSidebar = React.memo(function BudgetCatalogSidebar({
    isCompactViewport,
    isCatalogVisuallyCollapsed,
    tanteoVisible,
    setTanteoVisible,
    setIsCatalogHoverExpanded,
    setIsCatalogPointerInside,
    isCatalogCollapsed,
    isCatalogSearchFocused,
    indirectosStatus,
    setIsIndirectosOpen,
    setIsParetoOpen,
    handleOpenGeneralNotes,
    notesSummary,
    handlePasteQuantitiesFromClipboard,
    bulkQuantityApplying,
    setBudgetMiniMapOpen,
    setBudgetMiniMapMinimized,
    hasAnyTanteos,
    setClearTanteoStep,
    setShowClearTanteoModal,
    setIsCatalogSearchFocused,
    catalogSearchTerm,
    setCatalogSearchTerm,
    catalogApuSummary,
    setCatalogApuSummary,
}) {
    const catalogApuSummaryLabel = catalogApuSummary.visible === catalogApuSummary.total
        ? `${catalogApuSummary.total} apus totales`
        : `${catalogApuSummary.visible} visibles · ${catalogApuSummary.total} totales`;

    return (
        <motion.aside
            initial={false}
            animate={{ width: isCatalogVisuallyCollapsed ? 56 : (isCompactViewport ? 280 : 320) }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="border-r border-[#e2ded6] bg-[#efefeb] flex flex-col shrink-0 overflow-hidden relative"
            onMouseEnter={() => {
                setIsCatalogPointerInside(true);
                if (isCatalogCollapsed) {
                    if (tanteoVisible) {
                        setTanteoVisible(false);
                    }
                    setIsCatalogHoverExpanded(true);
                }
            }}
            onMouseLeave={() => {
                setIsCatalogPointerInside(false);
                if (isCatalogCollapsed && !isCatalogSearchFocused) {
                    setIsCatalogHoverExpanded(false);
                }
            }}
        >
            <div className={`${isCatalogVisuallyCollapsed ? 'm-1 mb-0 px-1' : 'ml-4 mr-7 mt-3 mb-0 px-3'} flex h-[152px] flex-col overflow-hidden rounded-t-[1.25rem] border border-[#272b33] border-b-0 bg-[#111318] py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`}>
                {!isCatalogVisuallyCollapsed && (
                    <div className="flex h-[18px] shrink-0 items-center">
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Catalogo APU</span>
                    </div>
                )}
                {!isCatalogVisuallyCollapsed && (
                    <div className="flex h-[48px] shrink-0 items-center">
                        <div className="grid w-full grid-cols-6 gap-1.5 rounded-[1rem] border border-white/12 bg-[#0f1115] px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-black/18">
                            <BudgetSidebarActionButton
                                onClick={() => setIsIndirectosOpen(true)}
                                icon={Percent}
                                label="I+IVA"
                                toneClassName={indirectosStatus.key === 'rojo' ? 'text-red-300' : indirectosStatus.key === 'ambar' ? 'text-amber-300' : 'text-white/74'}
                                hoverClassName={indirectosStatus.key === 'rojo' ? 'hover:text-red-200 hover:border-red-400/40' : indirectosStatus.key === 'ambar' ? 'hover:text-amber-200 hover:border-amber-400/40' : 'hover:text-emerald-200 hover:border-emerald-400/35'}
                                title={`Indirectos e IVA · ${indirectosStatus.description}`}
                                dotClassName={`${indirectosStatus.dotClass} ${indirectosStatus.key === 'rojo' ? 'animate-pulse' : ''}`}
                            />
                            <BudgetSidebarActionButton
                                onClick={() => setIsParetoOpen(true)}
                                icon={BarChart3}
                                label="Pto"
                                title="Pareto"
                            />
                            <BudgetSidebarActionButton
                                onClick={handleOpenGeneralNotes}
                                icon={FileText}
                                label="Notas"
                                toneClassName={notesSummary.general_nuevas > 0 ? 'text-[#F39200]' : 'text-white/74'}
                                hoverClassName="hover:text-[#F39200]"
                                title="Notas"
                                badge={notesSummary.general_total > 0 ? (notesSummary.general_nuevas > 0 ? notesSummary.general_nuevas : notesSummary.general_total) : null}
                            />
                            <BudgetSidebarActionButton
                                onClick={handlePasteQuantitiesFromClipboard}
                                disabled={bulkQuantityApplying}
                                icon={ClipboardList}
                                label="Pegar"
                                toneClassName={bulkQuantityApplying ? 'text-blue-300' : 'text-white/74'}
                                hoverClassName={bulkQuantityApplying ? '' : 'hover:text-[#F39200]'}
                                title="Aplicar cantidades desde el portapapeles a partir de la línea seleccionada"
                                animate={bulkQuantityApplying}
                            />
                            <BudgetSidebarActionButton
                                onClick={() => {
                                    setBudgetMiniMapOpen(true);
                                    setBudgetMiniMapMinimized(false);
                                }}
                                icon={Network}
                                label="Mapa"
                                toneClassName="text-white/74"
                                hoverClassName="hover:text-[#F39200]"
                                title="Minimapa EDT del presupuesto"
                            />
                            <BudgetSidebarActionButton
                                onClick={() => {
                                    if (!hasAnyTanteos) return;
                                    setClearTanteoStep(1);
                                    setShowClearTanteoModal(true);
                                }}
                                disabled={!hasAnyTanteos}
                                icon={Eraser}
                                label="Tanteo"
                                toneClassName={hasAnyTanteos ? 'text-white/74' : 'text-white/28'}
                                hoverClassName={hasAnyTanteos ? 'hover:text-red-200 hover:border-red-400/40' : ''}
                                title={hasAnyTanteos ? 'Borrar todos los tanteos del presupuesto' : 'No hay tanteos activos para limpiar'}
                            />
                        </div>
                    </div>
                )}
                {!isCatalogVisuallyCollapsed && (
                    <div className="flex h-[62px] shrink-0 flex-col justify-start border-t border-white/[0.035] pt-2">
                        <ClearSearchField
                            value={catalogSearchTerm}
                            onValueChange={setCatalogSearchTerm}
                            placeholder="Buscar APU o Subcategoría..."
                            containerClassName="min-w-0 w-full rounded-[0.9rem] border border-white/16 bg-white shadow-[inset_2px_2px_6px_rgba(15,23,42,0.12),inset_-2px_-2px_6px_rgba(255,255,255,0.75)]"
                            inputClassName="h-8 w-full bg-transparent py-1 pl-9 pr-8 text-[11px] font-bold text-zinc-800 outline-none placeholder:text-zinc-400"
                            searchIconClassName="h-3 w-3 text-zinc-500 group-focus-within:text-[#F39200]"
                            clearButtonClassName="text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                            onFocus={() => setIsCatalogSearchFocused(true)}
                            onBlur={() => setIsCatalogSearchFocused(false)}
                        />
                        <div className="mt-1 px-1 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500">
                            {catalogApuSummaryLabel}
                        </div>
                    </div>
                )}
            </div>

            <div className="ml-4 mr-7 mb-3 flex min-h-0 flex-1 flex-col overflow-hidden rounded-b-[1.25rem] bg-white">
                <CatalogoApuTab
                    compact={true}
                    isCollapsed={isCatalogVisuallyCollapsed}
                    onSearchFocusChange={setIsCatalogSearchFocused}
                    searchTerm={catalogSearchTerm}
                    onSearchTermChange={setCatalogSearchTerm}
                    hideSearch={true}
                    onCatalogSummaryChange={setCatalogApuSummary}
                />
            </div>
        </motion.aside>
    );
});

const BudgetMiniMapWindow = React.memo(function BudgetMiniMapWindow({
    budgetMiniMapOpen,
    budgetMiniMapMinimized,
    isCompactViewport,
    budgetMiniMapPosition,
    setBudgetMiniMapOpen,
    setBudgetMiniMapMinimized,
    miniMapDragRef,
    budgetMiniMapTree,
    selectedNodeId,
    setSelectedNodeId,
    setSelectedLineId,
    setMinimapTargetNodeId,
}) {
    const [miniMapSearch, setMiniMapSearch] = useState('');
    const miniMapRoots = React.useMemo(
        () => (budgetMiniMapTree || []).filter((node) => node.tipo_nodo === 'CUENTA_PAQUETE'),
        [budgetMiniMapTree]
    );
    const miniMapFlatNodes = React.useMemo(
        () => flattenBudgetMiniMapTree(miniMapRoots, []),
        [miniMapRoots]
    );
    const miniMapMatches = React.useMemo(() => {
        const query = normalizeBudgetMiniMapSearch(miniMapSearch);
        if (!query) return [];
        return miniMapFlatNodes.filter((node) => budgetMiniMapNodeMatchesSearch(node, query));
    }, [miniMapFlatNodes, miniMapSearch]);
    const miniMapFilteredTree = React.useMemo(() => {
        const query = normalizeBudgetMiniMapSearch(miniMapSearch);
        if (!query) return miniMapRoots;
        return cloneBudgetMiniMapTreeWithFilter(miniMapRoots, (node) => budgetMiniMapNodeMatchesSearch(node, query));
    }, [miniMapRoots, miniMapSearch]);
    const handleMiniMapNavigate = (match = null) => {
        const target = match || miniMapMatches[0];
        if (!target) return;
        setSelectedNodeId(target.id);
        setSelectedLineId(null);
        setMinimapTargetNodeId(target.id);
    };

    if (!budgetMiniMapOpen) return null;
    return (
        <div
            data-budget-minimap-window="true"
            className={`fixed z-[120] ${budgetMiniMapMinimized ? 'w-[220px]' : isCompactViewport ? 'w-[320px]' : 'w-[360px]'}`}
            style={{
                left: `${budgetMiniMapPosition.x}px`,
                top: `${budgetMiniMapPosition.y}px`,
            }}
        >
            <div className="overflow-hidden rounded-[1.35rem] border border-[#e2ded6] bg-[#f7f7f4]/96 shadow-[14px_14px_34px_rgba(31,31,31,0.16)] backdrop-blur">
                <div
                    onMouseDown={(event) => {
                        const panel = event.currentTarget.closest('[data-budget-minimap-window="true"]');
                        const rect = panel?.getBoundingClientRect();
                        if (!rect) return;
                        document.body.style.userSelect = 'none';
                        document.body.style.cursor = 'grabbing';
                        miniMapDragRef.current = {
                            offsetX: event.clientX - rect.left,
                            offsetY: event.clientY - rect.top,
                            panel,
                        };
                    }}
                    className="flex cursor-grab items-center gap-3 border-b border-[#e2ded6] bg-[#efefeb]/95 px-4 py-3 active:cursor-grabbing"
                >
                    <div className="flex h-10 w-10 items-center justify-center rounded-[0.9rem] border border-[#F39200]/25 bg-amber-50 text-[#F39200] shadow-[3px_3px_8px_#deded9,-3px_-3px_8px_#ffffff]">
                        <Network className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-zinc-900">
                            Minimapa EDT
                        </div>
                        <div className="truncate text-[10px] font-semibold text-zinc-500">
                            Navegación rápida por capítulos del presupuesto
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => setBudgetMiniMapMinimized((prev) => !prev)}
                            className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800"
                            title={budgetMiniMapMinimized ? 'Restaurar minimapa' : 'Minimizar minimapa'}
                        >
                            {budgetMiniMapMinimized ? <ChevronUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                        </button>
                        <button
                            type="button"
                            onClick={() => setBudgetMiniMapOpen(false)}
                            className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800"
                            title="Cerrar minimapa"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                {!budgetMiniMapMinimized && (
                    <div className="max-h-[60dvh] overflow-auto px-4 py-4">
                        {miniMapRoots.length > 0 ? (
                            <>
                                <div className="mb-3 space-y-2">
                                    <div className="relative">
                                        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                                        <input
                                            value={miniMapSearch}
                                            onChange={(event) => setMiniMapSearch(event.target.value)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    handleMiniMapNavigate();
                                                }
                                                if (event.key === 'Escape') {
                                                    setMiniMapSearch('');
                                                }
                                            }}
                                            placeholder="Buscar cuenta EDT..."
                            className="h-10 w-full rounded-xl border border-[#e2ded6] bg-white pl-9 pr-20 text-[11px] font-semibold text-zinc-700 outline-none transition focus:border-[#F39200]"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => handleMiniMapNavigate()}
                                            disabled={!miniMapMatches.length}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-zinc-600 transition hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Ir
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                            {miniMapSearch ? `${miniMapMatches.length} coincidencias` : 'Filtro rápido'}
                                        </span>
                                        {miniMapSearch && (
                                            <button
                                                type="button"
                                                onClick={() => setMiniMapSearch('')}
                                                className="text-[8px] font-black uppercase tracking-[0.14em] text-zinc-500 transition hover:text-zinc-800"
                                            >
                                                Limpiar
                                            </button>
                                        )}
                                    </div>
                                    {miniMapSearch && miniMapMatches.length > 0 && (
                                        <div className="flex flex-wrap gap-1.5">
                                            {miniMapMatches.slice(0, 6).map((match) => (
                                                <button
                                                    key={match.id}
                                                    type="button"
                                                    onClick={() => handleMiniMapNavigate(match)}
                                                    className="rounded-full border border-[#F39200]/30 bg-orange-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-[#F39200] transition hover:border-[#F39200]/50"
                                                >
                                                    {match.codigo || 'TBD'}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    {miniMapFilteredTree.map((node) => (
                                        <MemoBudgetMiniMapBranch
                                            key={node.id}
                                            node={node}
                                            selectedNodeId={selectedNodeId}
                                            onSelect={(nodeId) => {
                                                setSelectedNodeId(nodeId);
                                                setSelectedLineId(null);
                                                setMinimapTargetNodeId(nodeId);
                                            }}
                                            searchActive={Boolean(miniMapSearch)}
                                        />
                                    ))}
                                    {miniMapSearch && miniMapFilteredTree.length === 0 && (
                                        <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-4 text-center text-[10px] font-bold text-zinc-500">
                                            Sin coincidencias en el minimapa.
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-5 py-8 text-center">
                                <div className="text-[11px] font-black uppercase tracking-[0.18em] text-zinc-500">Sin estructura cargada</div>
                                <div className="mt-2 text-sm font-semibold text-zinc-500">El minimapa se habilitará cuando el árbol EDT del presupuesto esté disponible.</div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
});

const PresupuestoDetail = ({ inlineProyectoId, inlinePresupuestoId, initialFocusNodeId = null, initialFocusLineId = null }) => {
    const { presupuestoId: paramPresupuestoId, proyectoId: paramProyectoId } = useParams();
    const presupuestoId = inlinePresupuestoId || paramPresupuestoId;
    const proyectoId = inlineProyectoId || paramProyectoId;

    const { selectedEmpresa, activeProject, user } = useContext(AuthContext);
    const {
        activePresupuesto,
        setActivePresupuesto,
        activeProyecto,
        setActiveProyecto,
        tanteoSession,
        notesSummary,
    } = usePresupuestoData();
    const {
        selectedNodeId,
        selectedLineId,
        setSelectedLineId,
        setSelectedNodeId,
    } = usePresupuestoSelection();
    const {
        refreshActivePresupuesto,
        clearTanteoSession,
        refreshNotesSummary,
        markBudgetOpened
    } = usePresupuestoActions();
    const currentEmpresaId = selectedEmpresa?.id || user?.empresa_id || null;
    const [editingApuId, setEditingApuId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [equipoLineAction, setEquipoLineAction] = useState('');
    const [reportPreview, setReportPreview] = useState(null);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [showBudgetReportMenu, setShowBudgetReportMenu] = useState(false);
    const [reportVariant, setReportVariant] = useState('without_apus');
    const [budgetMiniMapOpen, setBudgetMiniMapOpen] = useState(false);
    const [budgetMiniMapMinimized, setBudgetMiniMapMinimized] = useState(false);
    const [budgetMiniMapTree, setBudgetMiniMapTree] = useState([]);
    const [minimapTargetNodeId, setMinimapTargetNodeId] = useState(null);
    const [budgetMiniMapPosition, setBudgetMiniMapPosition] = useState({ x: 16, y: 16 });
    const [tanteoVisible, setTanteoVisible] = useState(false);
    const [bulkQuantityApplying, setBulkQuantityApplying] = useState(false);
    const [showClearTanteoModal, setShowClearTanteoModal] = useState(false);
    const [clearTanteoStep, setClearTanteoStep] = useState(1);
    const [clearing, setClearing] = useState(false);
    const desyncAlertSignatureRef = useRef(null);
    const desyncFocusSignatureRef = useRef(null);
    
    // Collapsible Sidebar States (Left)
    const [isCatalogCollapsed, setIsCatalogCollapsed] = useState(false);
    const [isCatalogHoverExpanded, setIsCatalogHoverExpanded] = useState(false);
    const [isCatalogSearchFocused, setIsCatalogSearchFocused] = useState(false);
    const [catalogSearchTerm, setCatalogSearchTerm] = useState('');
    const [catalogApuSummary, setCatalogApuSummary] = useState({ total: 0, visible: 0 });
    const [isCatalogPointerInside, setIsCatalogPointerInside] = useState(false);
    const [isCatalogPinned] = useState(false);
    const catalogCollapsedByTanteoRef = useRef(false);
    const miniMapDragRef = useRef(null);
    const budgetReportMenuRef = useRef(null);
    const [windowSize, setWindowSize] = useState({
        width: window.innerWidth,
        height: window.innerHeight
    });
    const [forcedPortableWorkspace, setForcedPortableWorkspace] = useState(() => readPortableWorkspaceOverride());
    const isCompactViewport = resolvePortableWorkspace({
        moduleKey: 'presupuesto',
        width: windowSize.width,
        height: windowSize.height,
        forced: user?.rol?.toLowerCase() === 'superadministrador' && forcedPortableWorkspace
    });
    const isCatalogVisuallyCollapsed = isCatalogCollapsed && !isCatalogHoverExpanded;

    // Monitor window resize
    useEffect(() => {
        const handleResize = () => {
            setWindowSize({
                width: window.innerWidth,
                height: window.innerHeight
            });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!showBudgetReportMenu) return undefined;
        const handlePointerDown = (event) => {
            if (budgetReportMenuRef.current?.contains(event.target)) return;
            setShowBudgetReportMenu(false);
        };
        document.addEventListener('pointerdown', handlePointerDown, true);
        return () => document.removeEventListener('pointerdown', handlePointerDown, true);
    }, [showBudgetReportMenu]);

    useEffect(() => {
        const handleMessage = (e) => {
            if (e.data?.type === 'APU_EDITOR_CLOSED') {
                setEditingApuId(null);
                refreshActivePresupuesto();
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [refreshActivePresupuesto]);

    useEffect(() => {
        if (!activePresupuesto?.detalle?.length) return;
        if (initialFocusNodeId) {
            setSelectedNodeId(initialFocusNodeId);
        }
        if (initialFocusLineId) {
            setSelectedLineId(initialFocusLineId);
        }
    }, [activePresupuesto?.detalle, initialFocusLineId, initialFocusNodeId, setSelectedLineId, setSelectedNodeId]);

    const handleEditApuLinea = (linea) => {
        if (linea.apu_id) {
            setEditingApuId(linea.apu_id);
        }
    };

    useEffect(() => {
        const syncOverride = () => setForcedPortableWorkspace(readPortableWorkspaceOverride());
        window.addEventListener('storage', syncOverride);
        window.addEventListener('giproy:portable-workspace-changed', syncOverride);
        return () => {
            window.removeEventListener('storage', syncOverride);
            window.removeEventListener('giproy:portable-workspace-changed', syncOverride);
        };
    }, []);

    useEffect(() => {
        const handlePointerMove = (event) => {
            if (!miniMapDragRef.current) return;
            const { offsetX, offsetY } = miniMapDragRef.current;
            const panel = miniMapDragRef.current.panel;
            if (!(panel instanceof HTMLElement)) return;
            const panelRect = panel.getBoundingClientRect();
            const nextX = event.clientX - offsetX;
            const nextY = event.clientY - offsetY;
            const maxX = Math.max(8, window.innerWidth - panelRect.width - 8);
            const maxY = Math.max(8, window.innerHeight - panelRect.height - 8);
            setBudgetMiniMapPosition({
                x: Math.min(Math.max(8, nextX), maxX),
                y: Math.min(Math.max(8, nextY), maxY),
            });
        };

        const stopDragging = () => {
            miniMapDragRef.current = null;
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };

        window.addEventListener('mousemove', handlePointerMove);
        window.addEventListener('mouseup', stopDragging);
        return () => {
            window.removeEventListener('mousemove', handlePointerMove);
            window.removeEventListener('mouseup', stopDragging);
        };
    }, []);

    // Logic for mutual exclusion and auto-collapse
    useEffect(() => {
        if (!isCompactViewport || isCatalogPinned) {
            if (!tanteoVisible && catalogCollapsedByTanteoRef.current) {
                catalogCollapsedByTanteoRef.current = false;
            }
            return;
        }

        if (tanteoVisible) {
            if (!isCatalogCollapsed) {
                catalogCollapsedByTanteoRef.current = true;
            }
            setIsCatalogCollapsed(true);
            setIsCatalogHoverExpanded(false);
            return;
        }

        if (catalogCollapsedByTanteoRef.current) {
            catalogCollapsedByTanteoRef.current = false;
            setIsCatalogCollapsed(false);
            setIsCatalogHoverExpanded(false);
        }
    }, [tanteoVisible, isCompactViewport, isCatalogPinned, isCatalogCollapsed]);

    useEffect(() => {
        if (isCatalogCollapsed && !isCatalogSearchFocused && !isCatalogPointerInside) {
            setIsCatalogHoverExpanded(false);
        }
    }, [isCatalogCollapsed, isCatalogPointerInside, isCatalogSearchFocused]);

    // Modal States
    const [isIndirectosOpen, setIsIndirectosOpen] = useState(false);
    const [isParetoOpen, setIsParetoOpen] = useState(false);
    const [isNotasOpen, setIsNotasOpen] = useState(false);
    const [notesModalScope, setNotesModalScope] = useState('general');
    const [notesTargetLine, setNotesTargetLine] = useState(null);

    useEffect(() => {
        const fetchDetalle = async () => {
            if (!presupuestoId) return;
            try {
                // Solo mostrar loading si no tenemos data previa o el ID cambió
                if (!activePresupuesto || activePresupuesto.id !== presupuestoId) {
                    setLoading(true);
                }
                
                const [presData, projData] = await Promise.all([
                    presupuestosApi.getById(presupuestoId, currentEmpresaId),
                    proyectosApi.getById(proyectoId, currentEmpresaId)
                ]);
                setActivePresupuesto(presData);
                setActiveProyecto(projData);
                await refreshNotesSummary(presupuestoId);
                await markBudgetOpened(presupuestoId);
            } catch (error) {
                globalThis.reportClientError?.("Error cargando detalle del presupuesto:", error);
                // No limpiar estados si hubo error para no causar parpadeo visual agresivo,
                // el ErrorBoundary se encargará si es fatal.
            } finally {
                setLoading(false);
            }
        };
        fetchDetalle();
        // NO limpiar setActivePresupuesto(null) en el cleanup del efecto de carga
        // porque causa parpadeos vacíos entre cambios leves de props.
    }, [presupuestoId, proyectoId, setActivePresupuesto, setActiveProyecto, currentEmpresaId, refreshNotesSummary, markBudgetOpened]);

    useEffect(() => {
        if (!activePresupuesto?.id) return;
        const desyncedLines = (activePresupuesto.detalle || []).filter((linea) => linea?.apu_id == null && linea?.tipo !== 'CUENTA_PAQUETE');
        if (desyncedLines.length === 0) {
            desyncAlertSignatureRef.current = null;
            desyncFocusSignatureRef.current = null;
            return;
        }
        const signature = `${activePresupuesto.id}:${desyncedLines.length}`;
        if (desyncAlertSignatureRef.current === signature) return;
        desyncAlertSignatureRef.current = signature;
        appAlert(
            `Este presupuesto tiene ${desyncedLines.length} línea(s) desincronizada(s) porque su APU fue eliminado del catálogo.\n\n` +
            `Debe reparar la incidencia borrando cada línea afectada y añadiendo, si procede, una línea sustitutiva.`
        );
    }, [activePresupuesto]);

    useEffect(() => {
        if (!activePresupuesto?.id) return;
        const firstDesyncedLine = (activePresupuesto.detalle || []).find((linea) => linea?.apu_id == null && linea?.tipo !== 'CUENTA_PAQUETE');
        if (!firstDesyncedLine) {
            desyncFocusSignatureRef.current = null;
            return;
        }
        const signature = `${activePresupuesto.id}:${firstDesyncedLine.id}`;
        if (desyncFocusSignatureRef.current === signature) return;
        desyncFocusSignatureRef.current = signature;
        setSelectedNodeId(firstDesyncedLine.edt_id || null);
        setSelectedLineId(firstDesyncedLine.id);
    }, [activePresupuesto, setSelectedLineId, setSelectedNodeId]);

    useEffect(() => {
        if (!tanteoVisible || !selectedLineId || !activePresupuesto?.detalle) return;
        const selectedLine = activePresupuesto.detalle.find((linea) => Number(linea.id) === Number(selectedLineId));
        if (selectedLine && selectedLine.apu_id == null && selectedLine.tipo !== 'CUENTA_PAQUETE') {
            setTanteoVisible(false);
        }
    }, [activePresupuesto, selectedLineId, tanteoVisible]);

    const handleOpenGeneralNotes = async () => {
        setNotesTargetLine(null);
        setNotesModalScope('general');
        setIsNotasOpen(true);
        try {
            await presupuestosApi.markGeneralNotesOpened(activePresupuesto?.id, currentEmpresaId);
            await refreshNotesSummary(activePresupuesto?.id);
        } catch (error) {
            globalThis.reportClientError?.("Error marcando notas generales como vistas:", error);
        }
    };

    const handleOpenLineNotes = async (linea) => {
        setNotesTargetLine(linea);
        setNotesModalScope('linea');
        setIsNotasOpen(true);
        try {
            await presupuestosApi.markLineNotesOpened(linea.id, currentEmpresaId);
            await refreshNotesSummary(activePresupuesto?.id);
        } catch (error) {
            globalThis.reportClientError?.("Error marcando notas de línea como vistas:", error);
        }
    };

    const handlePasteQuantitiesFromClipboard = async () => {
        if (!selectedLineId) {
            await appAlert({
                title: 'Selecciona una línea',
                message: 'Selecciona primero la línea de presupuesto desde la que deseas empezar a reemplazar cantidades.',
                confirmLabel: 'Aceptar',
                tone: 'warning',
            });
            return;
        }

        if (!navigator?.clipboard?.readText) {
            await appAlert({
                title: 'Portapapeles no disponible',
                message: 'El navegador no permite leer el portapapeles en este contexto. Copia los datos y vuelve a intentarlo desde una sesión segura.',
                confirmLabel: 'Aceptar',
                tone: 'danger',
            });
            return;
        }

        try {
            const clipboardText = await navigator.clipboard.readText();
            if (!clipboardText.trim()) {
                await appAlert({
                    title: 'Portapapeles vacío',
                    message: 'Copia primero un listado de cantidades en texto plano o desde Excel.',
                    confirmLabel: 'Aceptar',
                    tone: 'warning',
                });
                return;
            }

            const { values, invalidCells } = parseClipboardNumberList(clipboardText);
            if (invalidCells.length > 0 || values.length === 0) {
                await appAlert({
                    title: 'Listado no válido',
                    message: invalidCells.length > 0
                        ? `El portapapeles debe contener solo números. Revisa valores como: ${invalidCells.slice(0, 4).join(', ')}${invalidCells.length > 4 ? '…' : ''}`
                        : 'No se detectaron cantidades numéricas en el portapapeles.',
                    confirmLabel: 'Aceptar',
                    tone: 'danger',
                });
                return;
            }

            const visibleLineIds = Array.from(document.querySelectorAll('[data-apu-line-id]'))
                .map((element) => Number(element.getAttribute('data-apu-line-id')))
                .filter((id) => Number.isFinite(id));
            const startIndex = visibleLineIds.indexOf(Number(selectedLineId));
            if (startIndex < 0) {
                await appAlert({
                    title: 'Línea no visible',
                    message: 'La línea seleccionada ya no está visible en el árbol actual. Expande la rama correspondiente y vuelve a intentarlo.',
                    confirmLabel: 'Aceptar',
                    tone: 'warning',
                });
                return;
            }

            const budgetLinesMap = new Map((activePresupuesto?.detalle || []).map((linea) => [Number(linea.id), linea]));
            const candidateLineIds = visibleLineIds.slice(startIndex).filter((lineId) => {
                const line = budgetLinesMap.get(Number(lineId));
                return line && line.tipo !== 'CUENTA_PAQUETE';
            });

            if (candidateLineIds.length === 0) {
                await appAlert({
                    title: 'Sin líneas destino',
                    message: 'No hay líneas operativas visibles a partir de la selección actual.',
                    confirmLabel: 'Aceptar',
                    tone: 'warning',
                });
                return;
            }

            const applicableCount = Math.min(candidateLineIds.length, values.length);
            const previewPairs = candidateLineIds.slice(0, Math.min(applicableCount, 3)).map((lineId, index) => {
                const line = budgetLinesMap.get(Number(lineId));
                return `${formatBudgetLinePreviewReference(line)} · ${line?.descripcion || 'Línea'} → ${values[index]}`;
            });

            const confirmed = await appConfirm({
                title: 'Reemplazar cantidades desde portapapeles',
                message:
                    `Se actualizarán ${applicableCount} línea(s) del presupuesto desde la línea seleccionada inclusive.\n\n` +
                    `${values.length > candidateLineIds.length ? `Hay ${values.length - candidateLineIds.length} valor(es) extra en el portapapeles que no se aplicarán.\n\n` : ''}` +
                    `${previewPairs.length > 0 ? `Primeros cambios:\n${previewPairs.join('\n')}\n\n` : ''}` +
                    'Esta acción recalculará el presupuesto. ¿Deseas continuar?',
                confirmLabel: 'Aplicar cantidades',
                cancelLabel: 'Cancelar',
                tone: 'warning',
            });
            if (!confirmed) return;

            setBulkQuantityApplying(true);
            setTanteoVisible(false);
            const updatedBudget = await presupuestosApi.bulkUpdateLineQuantities(
                activePresupuesto?.id,
                candidateLineIds.slice(0, applicableCount).map((lineId, index) => ({
                    linea_id: lineId,
                    cantidad: values[index],
                })),
                currentEmpresaId
            );
            if (updatedBudget) {
                setActivePresupuesto(updatedBudget);
            } else {
                await refreshActivePresupuesto(activePresupuesto?.id, { refreshPrices: false });
            }

            await appAlert({
                title: 'Cantidades actualizadas',
                message: `Se aplicaron ${applicableCount} cantidad(es) desde el portapapeles y el presupuesto fue recalculado.`,
                confirmLabel: 'Aceptar',
                tone: 'success',
            });
        } catch (error) {
            globalThis.reportClientError?.('Error aplicando cantidades desde portapapeles:', error);
            await appAlert({
                title: 'No se pudo aplicar el portapapeles',
                message: 'No fue posible leer o aplicar las cantidades del portapapeles. Revisa el formato y vuelve a intentarlo.',
                confirmLabel: 'Aceptar',
                tone: 'danger',
            });
        } finally {
            setBulkQuantityApplying(false);
        }
    };

    const handleNoteCreated = async () => {
        await refreshNotesSummary();
    };

    const handleParetoNavigate = ({ itemType, edtId, lineaId }) => {
        if (edtId) {
            setSelectedNodeId(edtId);
        }

        if (itemType === 'linea' && lineaId) {
            setSelectedLineId(lineaId);
        } else {
            setSelectedLineId(null);
        }

        setIsParetoOpen(false);
    };

    const [generatingReport, setGeneratingReport] = useState(false);

    const buildPresupuestoReportFilename = (extension, variant = reportPreview?.variant || reportVariant) => {
        const projectNameRaw = activePresupuesto?.proyecto?.nombre || activeProject?.nombre || 'Proyecto';
        const revision = activePresupuesto?.revision ?? activeProject?.revision ?? 1;
        const reportLabel = variant === 'indirectos' ? 'Indirectos del Presupuesto' : 'Presupuesto';
        return buildReportFileName({
            reportLabel,
            contextLabel: sanitizeReportContext(projectNameRaw, 'Proyecto'),
            revision,
            extension,
        });
    };

    const handleEquipoLockLine = async (linea) => {
        if (!linea?.id || !linea?.edt_id || !activePresupuesto?.proyecto_id) return;
        const confirmed = await appConfirm({
            title: 'Bloquear línea Equipo',
            message: `Se registrará un lock colaborativo sobre ${formatBudgetLinePreviewReference(linea)}.`,
            confirmLabel: 'Bloquear',
            cancelLabel: 'Cancelar',
            tone: 'info',
        });
        if (!confirmed) return;

        setEquipoLineAction(`lock-${linea.id}`);
        try {
            await equipoApi.createLock({
                empresa_id: currentEmpresaId,
                proyecto_id: activePresupuesto.proyecto_id,
                edt_id: linea.edt_id,
                presupuesto_linea_id: linea.id,
                reason: 'Lock solicitado desde Presupuesto clásico',
            });
            await appAlert({
                title: 'Lock Equipo registrado',
                message: 'La línea quedó marcada para trabajo colaborativo controlado.',
                tone: 'success',
            });
        } catch (error) {
            await appAlert({
                title: 'No se pudo registrar el lock',
                message: resolveEquipoErrorMessage(error),
                tone: 'danger',
            });
        } finally {
            setEquipoLineAction('');
        }
    };

    const handleEquipoProposalLine = async (linea) => {
        if (!linea?.id || !linea?.edt_id || !activePresupuesto?.proyecto_id) return;
        const quantityValue = await appPrompt({
            title: 'Proponer cantidad Equipo',
            message: `Cantidad sugerida para ${formatBudgetLinePreviewReference(linea)}.`,
            label: 'Cantidad propuesta',
            placeholder: String(linea.cantidad ?? ''),
            confirmLabel: 'Enviar propuesta',
            cancelLabel: 'Cancelar',
            tone: 'info',
            size: 'compact',
        });
        if (quantityValue == null || String(quantityValue).trim() === '') return;

        setEquipoLineAction(`proposal-${linea.id}`);
        try {
            await equipoApi.createProposal({
                empresa_id: currentEmpresaId,
                proyecto_id: activePresupuesto.proyecto_id,
                edt_id: linea.edt_id,
                presupuesto_linea_id: linea.id,
                title: `Ajuste de cantidad ${formatBudgetLinePreviewReference(linea)}`,
                description: 'Propuesta enviada desde Presupuesto clásico por colaborador Equipo.',
                proposed_changes: {
                    cantidad: String(quantityValue).trim(),
                },
            });
            await appAlert({
                title: 'Propuesta Equipo enviada',
                message: 'Un administrador deberá aprobar o rechazar el cambio antes de aplicar el presupuesto.',
                tone: 'success',
            });
        } catch (error) {
            await appAlert({
                title: 'No se pudo enviar la propuesta',
                message: resolveEquipoErrorMessage(error),
                tone: 'danger',
            });
        } finally {
            setEquipoLineAction('');
        }
    };
    const resolvePresupuestoReportTemplateId = (variant = reportPreview?.variant || reportVariant) => {
        const templateKey = variant === 'indirectos' ? 'indirectos' : 'presupuestos';
        return activeProject?.plantillas_config?.[templateKey] || selectedEmpresa?.plantillas_config?.[templateKey] || "001";
    };

    const handleDownloadReport = async (variantOverride = null) => {
        if (!activePresupuesto?.id) return;
        const nextVariant = variantOverride || reportVariant;
        try {
            setGeneratingReport(true);
            setReportVariant(nextVariant);
            const reportEmpresaId = activePresupuesto?.proyecto?.empresa_id || activeProyecto?.empresa_id || currentEmpresaId;
            const templateId = resolvePresupuestoReportTemplateId(nextVariant);
            const response = await reportingApi.previewReport({
                report_type: 'presupuesto',
                entity_ids: [activePresupuesto.id],
                template_id: templateId,
                variant: nextVariant,
                empresa_id: reportEmpresaId,
            }, reportEmpresaId);
            setReportPreview(response.data);
            setShowReportPreview(true);
            setShowBudgetReportMenu(false);
        } catch (error) {
            globalThis.reportClientError?.("Error al generar reporte:", error);
            appAlert(await extractBlobErrorMessage(error, "Error al generar el reporte profesional."));
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleExportReportExcel = async () => {
        if (!activePresupuesto?.id) return;
        try {
            setGeneratingReport(true);
            const reportEmpresaId = activePresupuesto?.proyecto?.empresa_id || activeProyecto?.empresa_id || currentEmpresaId;
            const response = await reportingApi.exportReport({
                report_type: 'presupuesto',
                entity_ids: [activePresupuesto.id],
                template_id: reportPreview?.template_id || resolvePresupuestoReportTemplateId(),
                format: 'xlsx',
                variant: reportPreview?.variant || reportVariant,
                empresa_id: reportEmpresaId,
            }, reportEmpresaId);
            downloadBlobResponse(response, buildPresupuestoReportFilename('xlsx'));
        } catch (error) {
            globalThis.reportClientError?.("Error al exportar reporte:", error);
            appAlert(await extractBlobErrorMessage(error, "Error al exportar el reporte profesional."));
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleExportReportPdf = async () => {
        if (!activePresupuesto?.id) return;
        try {
            setGeneratingReport(true);
            const reportEmpresaId = activePresupuesto?.proyecto?.empresa_id || activeProyecto?.empresa_id || currentEmpresaId;
            const response = await reportingApi.exportReport({
                report_type: 'presupuesto',
                entity_ids: [activePresupuesto.id],
                template_id: reportPreview?.template_id || resolvePresupuestoReportTemplateId(),
                format: 'pdf',
                variant: reportPreview?.variant || reportVariant,
                empresa_id: reportEmpresaId,
            }, reportEmpresaId);
            downloadBlobResponse(response, buildPresupuestoReportFilename('pdf'), 'application/pdf');
        } catch (error) {
            globalThis.reportClientError?.("Error al exportar reporte PDF:", error);
            appAlert(await extractBlobErrorMessage(error, "Error al exportar el reporte PDF."));
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleExportReportPdfFromExcel = async () => {
        if (!activePresupuesto?.id) return;
        try {
            setGeneratingReport(true);
            const reportEmpresaId = activePresupuesto?.proyecto?.empresa_id || activeProyecto?.empresa_id || currentEmpresaId;
            const response = await reportingApi.exportReport({
                report_type: 'presupuesto',
                entity_ids: [activePresupuesto.id],
                template_id: reportPreview?.template_id || resolvePresupuestoReportTemplateId(),
                format: 'pdf_excel',
                variant: reportPreview?.variant || reportVariant,
                empresa_id: reportEmpresaId,
            }, reportEmpresaId);
            downloadBlobResponse(response, buildPresupuestoReportFilename('pdf'), 'application/pdf');
        } catch (error) {
            globalThis.reportClientError?.("Error al exportar reporte PDF desde Excel:", error);
            appAlert(await extractBlobErrorMessage(error, "Error al exportar el reporte PDF desde Excel."));
        } finally {
            setGeneratingReport(false);
        }
    };

    if (loading) return (
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
            <div className="rounded-[1.1rem] border border-[#ececec] bg-[#f3f3f1] px-4 py-3 shadow-[8px_8px_20px_#dddddd,-8px_-8px_20px_#ffffff]">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] border border-amber-200 bg-amber-50 text-amber-600 shadow-[3px_3px_8px_#deded9,-3px_-3px_8px_#ffffff]">
                        <Calculator className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-lg font-black uppercase tracking-tight text-amber-600">Presupuesto</h2>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                            Construcción operativa del presupuesto, tanteo y control económico
                        </p>
                    </div>
                </div>
            </div>
            <div className="flex-1 rounded-[1.25rem] border border-[#ececec] bg-[#f7f7f5] flex items-center justify-center py-20 shadow-[10px_10px_26px_#dddddd,-10px_-10px_26px_#ffffff]">
                <div className="w-10 h-10 border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" />
            </div>
        </div>
    );

    if (!activePresupuesto) return <div className="p-8 text-center text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Presupuesto no encontrado.</div>;

    const indirectosStatus = getIndirectosStatus(activePresupuesto?.indirectos_porcentaje);
    const hasPersistedTanteos = (activePresupuesto?.detalle || []).some((linea) => Boolean(linea.tanteo_activo));
    const hasDraftTanteos = Object.keys(tanteoSession || {}).length > 0;
    const hasAnyTanteos = hasPersistedTanteos || hasDraftTanteos;

    return (
        <div className="relative flex h-full min-h-0 flex-col gap-3 overflow-hidden text-[#1A1A1A]">
            <div className="rounded-[1.1rem] border border-[#ececec] bg-[#f3f3f1] px-4 py-3 shadow-[8px_8px_20px_#dddddd,-8px_-8px_20px_#ffffff]">
                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] border border-amber-200 bg-amber-50 text-amber-600 shadow-[3px_3px_8px_#deded9,-3px_-3px_8px_#ffffff]">
                            <Calculator className="h-4 w-4" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="truncate text-lg font-black uppercase tracking-tight text-amber-600">Presupuesto</h2>
                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                                Construcción operativa del presupuesto, tanteo y control económico
                            </p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {activePresupuesto?.codigo && (
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-amber-700 shadow-[2px_2px_5px_#deded9,-2px_-2px_5px_#ffffff]">
                                {activePresupuesto.codigo}
                            </span>
                        )}
                        <div ref={budgetReportMenuRef} className="relative">
                            <ProjectSectionReportButton
                                sectionLabel="Presupuesto"
                                onClick={() => setShowBudgetReportMenu((current) => !current)}
                                disabled={generatingReport}
                                title="Reporte de presupuesto"
                                className={showBudgetReportMenu ? PROJECT_REPORT_BUTTON_ACTIVE_CLASS : ''}
                            />
                            {showBudgetReportMenu ? (
                                <ProjectReportMenu widthClassName="w-[18rem]">
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            await handleDownloadReport('without_apus');
                                        }}
                                        disabled={generatingReport}
                                        icon={FileText}
                                    >
                                        Presupuesto
                                    </ProjectReportMenuItem>
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            await handleDownloadReport('with_apus');
                                        }}
                                        disabled={generatingReport}
                                        icon={Layers}
                                        accent="blue"
                                    >
                                        Presupuesto + APUs
                                    </ProjectReportMenuItem>
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            await handleDownloadReport('indirectos');
                                        }}
                                        disabled={generatingReport}
                                        icon={Percent}
                                        accent="orange"
                                    >
                                        Indirectos
                                    </ProjectReportMenuItem>
                                </ProjectReportMenu>
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-[#ececec] bg-[#f7f7f5] shadow-[10px_10px_26px_#dddddd,-10px_-10px_26px_#ffffff]">
            <div className="flex-1 flex overflow-hidden">
                {/* 1/3 SECTION: TOOLBAR & CATALOG */}
                <BudgetCatalogSidebar
                    isCompactViewport={isCompactViewport}
                    isCatalogVisuallyCollapsed={isCatalogVisuallyCollapsed}
                    tanteoVisible={tanteoVisible}
                    setTanteoVisible={setTanteoVisible}
                    setIsCatalogHoverExpanded={setIsCatalogHoverExpanded}
                    setIsCatalogPointerInside={setIsCatalogPointerInside}
                    isCatalogCollapsed={isCatalogCollapsed}
                    isCatalogSearchFocused={isCatalogSearchFocused}
                    indirectosStatus={indirectosStatus}
                    setIsIndirectosOpen={setIsIndirectosOpen}
                    setIsParetoOpen={setIsParetoOpen}
                    handleOpenGeneralNotes={handleOpenGeneralNotes}
                    notesSummary={notesSummary}
                    handlePasteQuantitiesFromClipboard={handlePasteQuantitiesFromClipboard}
                    bulkQuantityApplying={bulkQuantityApplying}
                    setBudgetMiniMapOpen={setBudgetMiniMapOpen}
                    setBudgetMiniMapMinimized={setBudgetMiniMapMinimized}
                    hasAnyTanteos={hasAnyTanteos}
                    setClearTanteoStep={setClearTanteoStep}
                    setShowClearTanteoModal={setShowClearTanteoModal}
                    setIsCatalogSearchFocused={setIsCatalogSearchFocused}
                    catalogSearchTerm={catalogSearchTerm}
                    setCatalogSearchTerm={setCatalogSearchTerm}
                    catalogApuSummary={catalogApuSummary}
                    setCatalogApuSummary={setCatalogApuSummary}
                />

                {/* 2/3 SECTION: MAIN EDITOR & TANTEO */}
                <main className={`flex-1 flex overflow-hidden bg-[#f7f7f5] ${isCompactViewport ? 'p-1.5 gap-1.5' : 'p-3 gap-3'} relative`}>
                    <div className="flex-1 overflow-hidden flex flex-col">
                        <LineasPresupuestoTab 
                            tanteoVisible={tanteoVisible}
                            setTanteoVisible={setTanteoVisible}
                            notesSummary={notesSummary}
                            onEditApu={handleEditApuLinea}
                            onOpenLineNotes={handleOpenLineNotes}
                            onEquipoLockLine={equipoLineAction ? null : handleEquipoLockLine}
                            onEquipoProposalLine={equipoLineAction ? null : handleEquipoProposalLine}
                            minimapTargetNodeId={minimapTargetNodeId}
                            onMinimapTargetHandled={() => setMinimapTargetNodeId(null)}
                            onTreeReady={setBudgetMiniMapTree}
                        />
                    </div>

                    {/* Collapsible Tanteo Panel */}
                    {tanteoVisible ? (
                        <div className={`${isCompactViewport ? 'w-[320px]' : 'w-[380px]'} shrink-0 animate-in slide-in-from-right duration-300`}>
                            <React.Suspense fallback={null}>
                                <TanteoTab sidebar={true} onHide={() => setTanteoVisible(false)} />
                            </React.Suspense>
                        </div>
                    ) : null}
                </main>
            </div>

            <BudgetMiniMapWindow
                budgetMiniMapOpen={budgetMiniMapOpen}
                budgetMiniMapMinimized={budgetMiniMapMinimized}
                isCompactViewport={isCompactViewport}
                budgetMiniMapPosition={budgetMiniMapPosition}
                setBudgetMiniMapOpen={setBudgetMiniMapOpen}
                setBudgetMiniMapMinimized={setBudgetMiniMapMinimized}
                miniMapDragRef={miniMapDragRef}
                budgetMiniMapTree={budgetMiniMapTree}
                selectedNodeId={selectedNodeId}
                setSelectedNodeId={setSelectedNodeId}
                setSelectedLineId={setSelectedLineId}
                setMinimapTargetNodeId={setMinimapTargetNodeId}
            />
            </div>

            {/* Modal Editor APU Inline */}
            {editingApuId ? (
                <React.Suspense fallback={null}>
                    <ApuEditorModal
                        apuId={editingApuId}
                        projectBaseId={activeProyecto?.base_trabajo_id || activeProject?.base_trabajo_id || activePresupuesto?.proyecto?.base_trabajo_id}
                        projectRevision={activeProyecto?.revision ?? activeProject?.revision ?? 0}
                        onClose={() => {
                            setEditingApuId(null);
                            refreshActivePresupuesto();
                        }}
                    />
                </React.Suspense>
            ) : null}

            {/* Modals */}
            {isIndirectosOpen ? (
                <React.Suspense fallback={null}>
                    <IndirectosModal
                        isOpen={isIndirectosOpen}
                        onClose={() => setIsIndirectosOpen(false)}
                        onSaved={() => refreshActivePresupuesto()}
                        presupuestoId={activePresupuesto?.id}
                    />
                </React.Suspense>
            ) : null}
            {isParetoOpen ? (
                <React.Suspense fallback={null}>
                    <ParetoModal
                        isOpen={isParetoOpen}
                        onClose={() => setIsParetoOpen(false)}
                        presupuestoId={activePresupuesto?.id}
                        onNavigateToItem={handleParetoNavigate}
                    />
                </React.Suspense>
            ) : null}
            {isNotasOpen ? (
                <React.Suspense fallback={null}>
                    <NotasGeneralesModal
                        isOpen={isNotasOpen}
                        onClose={() => setIsNotasOpen(false)}
                        presupuestoId={activePresupuesto?.id}
                        scope={notesModalScope}
                        linea={notesTargetLine}
                        onNoteCreated={handleNoteCreated}
                        readOnly={notesModalScope === 'linea' && notesTargetLine?.apu_id == null && notesTargetLine?.tipo !== 'CUENTA_PAQUETE'}
                    />
                </React.Suspense>
            ) : null}

            {showReportPreview ? (
                <React.Suspense fallback={null}>
                    <CommonReportPreviewModal
                        isOpen={showReportPreview}
                        onClose={() => setShowReportPreview(false)}
                        preview={reportPreview}
                        onExportExcel={handleExportReportExcel}
                        onExportPdf={handleExportReportPdf}
                        onExportPdfFromExcel={handleExportReportPdfFromExcel}
                        exporting={generatingReport}
                    />
                </React.Suspense>
            ) : null}
            {generatingReport ? (
                <React.Suspense fallback={null}>
                    <ReportGenerationModal
                        isOpen={generatingReport}
                        title="Generando reporte"
                        message="Estamos preparando el reporte de presupuesto. La descarga comenzará automáticamente cuando esté listo."
                    />
                </React.Suspense>
            ) : null}

            {/* Modal de Borrado de Tanteos con Doble Confirmación */}
            <AnimatePresence>
                {showClearTanteoModal && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div
                            className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden"
                        >
                            <div className="p-10 relative">
                                <button 
                                    onClick={() => setShowClearTanteoModal(false)}
                                    className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-xl transition-all"
                                >
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 ${clearTanteoStep === 1 ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                                        {clearTanteoStep === 1 ? <AlertTriangle className="w-10 h-10" /> : <Trash2 className="w-10 h-10" />}
                                    </div>

                                    {clearTanteoStep === 1 ? (
                                        <>
                                            <h2 className="text-2xl font-black uppercase tracking-tight mb-4">¿Borrar todos los Tanteos?</h2>
                                            <p className="text-zinc-500 text-sm font-medium mb-8 uppercase tracking-widest leading-relaxed">
                                                Estás a punto de <strong className="text-zinc-900">limpiar todas las simulaciones</strong> y restaurar los precios originales en esta revisión del proyecto.
                                            </p>
                                            <div className="flex flex-col w-full gap-3">
                                                <LiquidButton
                                                    onClick={() => setClearTanteoStep(2)}
                                                    className="w-full !h-14 bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl"
                                                >
                                                    Entiendo, Continuar
                                                </LiquidButton>
                                                <button
                                                    onClick={() => setShowClearTanteoModal(false)}
                                                    className="w-full h-14 bg-zinc-50 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-red-600">CONFIRMACIÓN FINAL</h2>
                                            <p className="text-zinc-500 text-sm font-medium mb-8 uppercase tracking-widest leading-relaxed">
                                                ¿Estás absolutamente seguro? Esta acción restaurará los valores de <strong className="text-zinc-900">toda la revisión</strong> de forma irreversible.
                                            </p>
                                            <div className="flex flex-col w-full gap-3">
                                                <LiquidButton
                                                    onClick={async () => {
                                                        try {
                                                            setClearing(true);
                                                            clearTanteoSession();
                                                            await presupuestosApi.clearTanteo(activePresupuesto.id, currentEmpresaId);
                                                            await refreshActivePresupuesto();
                                                            setShowClearTanteoModal(false);
                                                            setClearTanteoStep(1);
                                                        } catch (error) {
                                                            globalThis.reportClientError?.("Error al limpiar tanteos:", error);
                                                            appAlert("Error al limpiar los tanteos.");
                                                        } finally {
                                                            setClearing(false);
                                                        }
                                                    }}
                                                    disabled={clearing}
                                                    className="w-full !h-14 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-red-200"
                                                >
                                                    {clearing ? "Procesando..." : "Confirmar Borrado Integral"}
                                                </LiquidButton>
                                                <button
                                                    onClick={() => {
                                                        setShowClearTanteoModal(false);
                                                        setClearTanteoStep(1);
                                                    }}
                                                    className="w-full h-14 bg-zinc-50 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-all"
                                                >
                                                    Volver
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default PresupuestoDetail;
