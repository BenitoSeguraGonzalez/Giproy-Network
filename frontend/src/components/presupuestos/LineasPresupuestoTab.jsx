import React, { useState, useEffect, useContext, useRef, useMemo, useCallback, useLayoutEffect } from 'react';
import { usePresupuestoActions, usePresupuestoData, usePresupuestoSelection } from '../../context/PresupuestoContext';
import { AuthContext } from '../../context/AuthContext';
import { edtApi } from '../../api/edt';
import { Folders, ChevronDown, ChevronRight, Calculator, Trash2, FileText, GripVertical, Boxes, Target, Edit2, Check, FlaskConical, ArrowDown, X, Lock } from 'lucide-react';
import CodeColorizer from '../../utils/codeColorizer';
import { getIndirectosStatus } from '../../utils/indirectosStatus';
import { appConfirm } from '../../utils/appDialog';
import { useFormatters } from '../../hooks/useFormatters';
import { formatoMoneda, roundDecimal } from '../../utils/math';
import {
    divideDecimalNumber,
    roundDecimalNumber,
    sumDecimalNumber,
    toDecimalNumber,
} from '../../utils/decimalNumbers';
import {
    resolveBudgetLineOperationalSubtotal,
    sumBudgetOperationalSubtotals,
} from '../../utils/operationalNumbers';
import { normalizeDescriptionCapitalization } from '../../utils/descriptionCapitalization';
import { includesNormalized } from '../../utils/normalizeSearch';
import ClearSearchField from '../ui/ClearSearchField';
import MotionScrollbar from '../ui/MotionScrollbar';
import { ControlRail, ControlRailDivider, ControlRailIconButton, ControlRailSection } from '../ui/ControlRail';
import useAdaptiveLayout from '../../hooks/useAdaptiveLayout';

const fallbackFormatMoneda = (value) => formatoMoneda(value, 2);
const formatMoney = (value, formatCurrency = fallbackFormatMoneda) => formatCurrency(value);
const formatDelta = (value, formatCurrency = fallbackFormatMoneda) => `${value >= 0 ? '+' : ''}${formatCurrency(value)}`;
const isStructuralBudgetRow = (linea) => linea?.tipo === 'CUENTA_PAQUETE';
const isOperationalBudgetLine = (linea) => !isStructuralBudgetRow(linea);
const isDesyncedBudgetLine = (linea) => isOperationalBudgetLine(linea) && !linea?.apu_id;
const isCountableBudgetLine = (linea) => isOperationalBudgetLine(linea) && !isDesyncedBudgetLine(linea);
const BUDGET_ROW_MIN_WIDTH = 1104;
const BUDGET_COLUMN_WIDTH = {
    item: 'w-[72px]',
    edt: 'w-[110px]',
    unit: 'w-[44px]',
    quantity: 'w-[92px]',
    unitPrice: 'w-[84px]',
    subtotal: 'w-[98px]',
    actions: 'w-[224px]',
};
const CHAPTER_ROW_HEIGHT = 48;
const LINE_ROW_HEIGHT = 52;
const VIRTUAL_INITIAL_ROWS = 180;
const VIRTUAL_ROWS_CHUNK = 140;
const VIRTUAL_ROWS_OVERSCAN = 40;
const VIRTUAL_MIN_BOTTOM_BUFFER_PX = 1200;
const VIRTUALIZED_CHAPTER_STYLE = {
    contentVisibility: 'auto',
    containIntrinsicSize: '48px',
    contain: 'layout style paint',
};
const VIRTUALIZED_LINE_STYLE = {
    contentVisibility: 'auto',
    containIntrinsicSize: '52px',
    contain: 'layout style paint',
};
const collectTreeNodeIds = (nodes, acc = []) => {
    for (const node of nodes || []) {
        acc.push(Number(node.id));
        if (node.hijos?.length) collectTreeNodeIds(node.hijos, acc);
    }
    return acc;
};
const roundCascade = (value, decimals = 2) => roundDecimalNumber(value || 0, decimals);
const focusAndSelectInput = (input) => {
    if (!input) return;
    requestAnimationFrame(() => {
        input.focus();
        input.select();
    });
};

const getEditableQuantityInputs = () => Array.from(document.querySelectorAll('[data-apu-quantity-id]'));
const getVisibleBudgetLineIds = () =>
    Array.from(document.querySelectorAll('[data-apu-line-id]'))
        .map((element) => Number(element.getAttribute('data-apu-line-id')))
        .filter((id) => Number.isFinite(id));
const getVisibleBudgetLineIdsForEdt = (edtId) =>
    Array.from(document.querySelectorAll(`[data-apu-line-id][data-budget-edt-owner-id="${edtId}"]`))
        .map((element) => Number(element.getAttribute('data-apu-line-id')))
        .filter((id) => Number.isFinite(id));
const isElementFullyVisibleInScrollParent = (element) => {
    if (!(element instanceof HTMLElement)) return true;
    const scrollParent = element.closest('[data-budget-scroll-parent="true"]') || element.closest('.custom-scrollbar');
    if (!(scrollParent instanceof HTMLElement)) return true;

    const parentRect = scrollParent.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    return elementRect.top >= parentRect.top && elementRect.bottom <= parentRect.bottom;
};

const BudgetFooterMetric = ({ label, value, meta, accent = 'default', icon = null, valueSuffix = '', metaTone = '' }) => {
    const accentMap = {
        default: {
            card: 'border-zinc-200 bg-white/80',
            value: 'text-zinc-900',
            meta: 'text-zinc-500',
            dot: 'bg-zinc-400'
        },
        indirectos: {
            card: 'border-emerald-200 bg-emerald-50/80',
            value: 'text-emerald-700',
            meta: 'text-emerald-600',
            dot: 'bg-emerald-400'
        },
        info: {
            card: 'border-blue-200 bg-blue-50/80',
            value: 'text-blue-700',
            meta: 'text-blue-600',
            dot: 'bg-blue-400'
        },
        warning: {
            card: 'border-amber-200 bg-amber-50/80',
            value: 'text-amber-700',
            meta: 'text-amber-600',
            dot: 'bg-amber-400'
        },
        danger: {
            card: 'border-red-200 bg-red-50/80',
            value: 'text-red-700',
            meta: 'text-red-600',
            dot: 'bg-red-400'
        },
        total: {
            card: 'border-[#F39200]/20 bg-amber-50/80',
            value: 'text-[#8A5300]',
            meta: 'text-[#F39200]',
            dot: 'bg-[#F39200]'
        }
    };

    const tone = accentMap[accent] || accentMap.default;
    const Icon = icon;

    return (
        <div className={`h-full rounded-2xl border px-2.5 py-2 overflow-hidden ${tone.card}`}>
            <div className="mb-1 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500">
                <span className={`h-1.5 w-1.5 rounded-full ${tone.dot}`} />
                {Icon ? <Icon className="h-3 w-3" /> : null}
                <span className="min-w-0 truncate">{label}</span>
            </div>
            <div className={`flex min-w-0 items-end justify-end gap-2 text-right ${tone.value}`}>
                <span className="shrink-0 text-[0.82rem] font-black tabular-nums tracking-tight">{value}</span>
                {valueSuffix ? (
                    <span className="min-w-0 truncate pb-[1px] text-[8px] font-bold uppercase tracking-[0.12em] text-zinc-500">
                        {valueSuffix}
                    </span>
                ) : null}
            </div>
            <div className={`mt-1 min-w-0 truncate text-right text-[8px] font-black uppercase tracking-[0.14em] ${metaTone || tone.meta}`}>
                {meta}
            </div>
        </div>
    );
};

// Recursive Component for the Budget Tree
const PresupuestoNodeItem = ({ 
    node, 
    level = 0, 
    lineasByEdtId,
    chapterSubtotalByNodeId,
    onAddLinea, 
    onDeleteLinea, 
    selectedNodeId, 
    onSelectNode, 
    onMoveApu,
    onUpdateLinea,
    selectedLineId,
    onSelectLine,
    onOpenTanteo,
    onEditApu,
    tanteoSession = {},
    notesSummary = {},
    onOpenLineNotes,
    formatCalculo,
    formatMoneda,
    moneyDecimals = 2,
    parseNumericInput,
    formatNumericDisplay,
    isBudgetCompact = false,
    useOmniClass = true,
    onNavigateQuantity,
    onQuantityFocus,
    onQuantityDraftChange,
    onQuantityCommit,
    getQuantityDisplayValue,
    onQuantityCancel,
    onQuantityBlur,
    activeDragLineId,
    onRegisterDragLine,
    onMoveStart,
    selectedLineIds,
    selectionAnchorId,
    selectionScopeEdtId,
    isSelectionMode,
    isTanteoMode,
    onSelectLineRange,
    onSelectionModeRequest,
    onTanteoModeRequest,
    setTanteoVisible,
    onEquipoLockLine,
    onEquipoProposalLine,
}) => {
    const [isExpanded, setIsExpanded] = useState(true);
    const [isDragOver, setIsDragOver] = useState(false);
    const [dragOverLineId, setDragOverLineId] = useState(null);
    const isCuenta = node.tipo_nodo === 'CUENTA_PAQUETE';
    const isSelected = selectedNodeId === node.id;

    const nodeLineas = lineasByEdtId.get(Number(node.id)) || [];

    // Filter out non-cuenta WBS children
    const validChildren = (node.hijos || []).filter(h => h.tipo_nodo === 'CUENTA_PAQUETE');

    const chapterSubtotal = chapterSubtotalByNodeId.get(Number(node.id)) || 0;

    const toggle = (e) => {
        e.stopPropagation();
        setIsExpanded(!isExpanded);
    };

    // Drag and Drop Logic
    const handleDragStart = (e, lineaId) => {
        const visibleIds = getVisibleBudgetLineIds();
        const sortedSelectedIds = Array.from(selectedLineIds || []).sort((a, b) => visibleIds.indexOf(a) - visibleIds.indexOf(b));
        const draggedLineIds = sortedSelectedIds.includes(lineaId) && sortedSelectedIds.length > 1
            ? sortedSelectedIds
            : [lineaId];
        e.dataTransfer.setData("lineaId", String(lineaId));
        e.dataTransfer.setData("lineaIds", JSON.stringify(draggedLineIds));
        e.dataTransfer.setData("text/plain", String(lineaId));
        e.dataTransfer.setData("oldEdtId", node.id);
        e.dataTransfer.effectAllowed = "move";
        onMoveStart && onMoveStart();
        onRegisterDragLine && onRegisterDragLine(lineaId);
    };

    const handleDragOver = (e) => {
        if (!isCuenta) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
    };

    const handleDragLeave = () => {
        setIsDragOver(false);
    };

    const handleDrop = (e) => {
        if (!isCuenta) return;
        e.preventDefault();
        setIsDragOver(false);
        const lineaId = e.dataTransfer.getData("lineaId");
        if (lineaId) {
            const rawLineIds = e.dataTransfer.getData("lineaIds");
            let lineIds = [];
            try {
                lineIds = JSON.parse(rawLineIds || '[]');
            } catch {
                lineIds = [];
            }
            if (Array.isArray(lineIds) && lineIds.length > 1) {
                onMoveApu(lineIds, { edt_id: node.id });
                return;
            }
            onMoveApu(parseInt(lineaId, 10), { edt_id: node.id });
        }
    };

    const handleLineDragOver = (e, targetLineId) => {
        e.preventDefault();
        e.stopPropagation();
        const sourceId = parseInt(e.dataTransfer.getData("lineaId"), 10);
        if (!Number.isFinite(sourceId) || sourceId === targetLineId) return;
        e.dataTransfer.dropEffect = 'move';
        setDragOverLineId(targetLineId);
    };

    const handleLineDragLeave = (targetLineId) => {
        setDragOverLineId((current) => (current === targetLineId ? null : current));
    };

    const handleLineDrop = (e, targetLine) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverLineId(null);
        const sourceId = parseInt(e.dataTransfer.getData("lineaId"), 10);
        if (!Number.isFinite(sourceId) || sourceId === targetLine.id) return;
        const rawLineIds = e.dataTransfer.getData("lineaIds");
        let lineIds = [];
        try {
            lineIds = JSON.parse(rawLineIds || '[]');
        } catch {
            lineIds = [];
        }
        if (Array.isArray(lineIds) && lineIds.length > 1) {
            const filteredLineIds = lineIds.filter((lineId) => Number(lineId) !== Number(targetLine.id));
            if (filteredLineIds.length > 1) {
                onMoveApu(filteredLineIds, { edt_id: targetLine.edt_id });
                return;
            }
            if (filteredLineIds.length === 1) {
                onMoveApu(filteredLineIds[0], { edt_id: targetLine.edt_id, after_linea_id: targetLine.id });
                return;
            }
        }
        onMoveApu(sourceId, { edt_id: targetLine.edt_id, after_linea_id: targetLine.id });
    };

    const handleLineSelection = (event, linea) => {
        event.stopPropagation();
        if (!onSelectLine) return;

        const lineId = Number(linea.id);
        const lineEdtId = Number(linea.edt_id);
        const clickedSelectionZone =
            event.target instanceof Element &&
            Boolean(event.target.closest('[data-budget-selection-zone="true"]'));
        const wantsSelectionMode = event.ctrlKey || event.metaKey;
        const wantsSelectionRange = event.shiftKey && isSelectionMode && clickedSelectionZone;
        const wantsTanteoLaunch = (event.shiftKey && !wantsSelectionRange) || isTanteoMode;

        if (wantsSelectionMode && !isSelectionMode && onSelectionModeRequest) {
            onSelectionModeRequest(true);
        }
        if (wantsSelectionMode) {
            setTanteoVisible && setTanteoVisible(false);
        }
        if (wantsSelectionMode && onTanteoModeRequest) {
            onTanteoModeRequest(false);
        }
        if (wantsTanteoLaunch && isSelectionMode) {
            onSelectionModeRequest && onSelectionModeRequest(false);
        }
        const isSameScope = Number(selectionScopeEdtId) === lineEdtId;
        const multiSelectionEnabled = isSelectionMode || wantsSelectionMode;
        let shouldOpenTanteo = true;

        if (multiSelectionEnabled && onSelectLineRange) {
            const nextSelection = isSameScope ? new Set(selectedLineIds || []) : new Set();
            const isModifierToggle = event.ctrlKey || event.metaKey;

            if (!isSelectionMode && wantsSelectionMode && !isModifierToggle) {
                nextSelection.clear();
            }

            if (wantsSelectionRange) {
                const visibleIds = getVisibleBudgetLineIdsForEdt(lineEdtId);
                const effectiveAnchorId =
                    isSameScope && selectionAnchorId != null && visibleIds.includes(Number(selectionAnchorId))
                        ? Number(selectionAnchorId)
                        : lineId;
                const anchorIndex = visibleIds.indexOf(effectiveAnchorId);
                const targetIndex = visibleIds.indexOf(lineId);
                if (anchorIndex !== -1 && targetIndex !== -1) {
                    const [startIndex, endIndex] = anchorIndex <= targetIndex
                        ? [anchorIndex, targetIndex]
                        : [targetIndex, anchorIndex];
                    const nextIds = visibleIds.slice(startIndex, endIndex + 1);
                    onSelectLineRange(nextIds, lineId, effectiveAnchorId, lineEdtId);
                    shouldOpenTanteo = false;
                    return;
                }
                nextSelection.clear();
                nextSelection.add(lineId);
            } else if (isModifierToggle) {
                if (nextSelection.has(lineId)) nextSelection.delete(lineId);
                else nextSelection.add(lineId);
            } else {
                nextSelection.clear();
                nextSelection.add(lineId);
            }
            const nextIds = Array.from(nextSelection);
            onSelectLineRange(nextIds, nextIds.length > 0 ? lineId : null, nextIds.length > 0 ? lineId : null, nextIds.length > 0 ? lineEdtId : null);
            shouldOpenTanteo = nextIds.length > 0;
        } else {
            onSelectLine(lineId);
        }

        if (!wantsTanteoLaunch) {
            return;
        }

        if (shouldOpenTanteo && !isDesyncedBudgetLine(linea)) {
            onOpenTanteo && onOpenTanteo();
        }
    };

    const handleQuantityFocus = (e, lineId, currentValue) => {
        e.stopPropagation();
        onQuantityFocus && onQuantityFocus(lineId, currentValue);
        focusAndSelectInput(e.target);
    };

    const handleQuantityKeyDown = (e, lineId) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            onQuantityCancel && onQuantityCancel(lineId);
            e.currentTarget.blur();
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            onNavigateQuantity && onNavigateQuantity(lineId, 'ArrowDown');
            return;
        }
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        e.stopPropagation();
        onNavigateQuantity && onNavigateQuantity(lineId, e.key);
    };

    return (
        <div className="relative group/node w-full text-sm">
            {/* WBS Row (Drop Target) */}
            <div
                data-budget-edt-id={node.id}
                onClick={() => isCuenta && onSelectNode && onSelectNode(node.id)}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative z-10 flex items-center gap-3 py-1.5 px-3 border-b border-r cursor-pointer transition-all ${isSelected ? 'border-b-blue-200 bg-blue-50/70 shadow-[inset_0_0_0_1px_rgba(19,97,145,0.10)]' : 'bg-sky-50/25 border-b-sky-100 hover:bg-sky-50/45'} ${isCuenta ? 'border-l-[6px] border-l-[#136191]' : ''} ${isDragOver ? 'ring-2 ring-[#F39200] bg-orange-50/50 border-orange-200' : ''}`}
                style={{ ...VIRTUALIZED_CHAPTER_STYLE, paddingLeft: `${(level * 1.5) + 1}rem` }}
            >
                {/* Visual Feedback for Drop */}
                {isDragOver && (
                    <div 
                        className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F39200] rounded-r-full"
                    />
                )}
                <div className="flex items-center w-6 shrink-0">
                    {isCuenta && (validChildren.length > 0 || nodeLineas.length > 0) && (
                        <button onClick={toggle} className="p-1 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200 transition-colors">
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    )}
                </div>

                <div className="flex-1 min-w-0 flex items-center gap-3">
                    <div className="w-[136px] shrink-0">
                        <div className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">Cod EDT</div>
                        <span className="mt-0.5 block text-[11px] font-mono font-black tracking-wider text-[#136191]">
                            {node.codigo}
                        </span>
                    </div>

                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Folders className="w-4 h-4 shrink-0 text-[#136191]" />
                        <span className={`font-bold truncate mt-0.5 tracking-tight text-[11px] ${isSelected ? 'text-slate-900' : 'text-zinc-800'}`}>
                            {String(node.nombre || '').toUpperCase()}
                        </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                        <div className={`${BUDGET_COLUMN_WIDTH.unit} shrink-0`} />
                        <div className={`${BUDGET_COLUMN_WIDTH.quantity} shrink-0`} />
                        <div className={`${BUDGET_COLUMN_WIDTH.unitPrice} shrink-0`} />
                        <div className={`${BUDGET_COLUMN_WIDTH.subtotal} text-right font-black tabular-nums text-xs text-[#136191]/70`}>
                            {chapterSubtotal > 0 ? formatMoneda(chapterSubtotal) : '-'}
                        </div>
                        <div className={`${BUDGET_COLUMN_WIDTH.actions} shrink-0`} />
                    </div>
                </div>
            </div>

            {/* Children and Lines */}
            {isExpanded && (
                <div>
                    {nodeLineas.map((linea) => {
                        const lineNoteMeta = notesSummary?.lineas?.[linea.id] || { total: 0, nuevas: 0 };
                        const isDesynced = isDesyncedBudgetLine(linea);
                        const lineSubtotal = resolveBudgetLineOperationalSubtotal(linea, { moneyDecimals, tanteoSession });
                        const isGroupedSelected = isSelectionMode && selectedLineIds?.has?.(linea.id);
                        return (
                        <div
                            key={linea.id}
                            data-apu-line-id={linea.id}
                            data-budget-edt-owner-id={linea.edt_id}
                            onDragOver={(e) => handleLineDragOver(e, linea.id)}
                            onDragLeave={() => handleLineDragLeave(linea.id)}
                            onDrop={(e) => handleLineDrop(e, linea)}
                            onClick={(e) => handleLineSelection(e, linea)}
                            onDoubleClick={(e) => {
                                if (!linea.apu_id || e.target instanceof HTMLInputElement || e.target.closest('button') || e.target.closest('[data-budget-drag-handle="true"]')) {
                                    return;
                                }
                                e.preventDefault();
                                e.stopPropagation();
                                onEditApu && onEditApu(linea);
                            }}
                            onMouseDown={(e) => {
                                if (e.target instanceof HTMLInputElement || e.target.closest('button') || e.target.closest('[data-budget-drag-handle="true"]')) {
                                    return;
                                }
                                e.preventDefault();
                            }}
                            className={`relative z-10 py-1 px-3 border-b border-r transition-colors group/linea pl-0 cursor-pointer select-none ${dragOverLineId === linea.id ? 'ring-2 ring-[#F39200] bg-orange-50/70 border-orange-200' : isGroupedSelected ? 'border-b-blue-200 bg-blue-50/70 shadow-[inset_0_0_0_1px_rgba(19,97,145,0.10)]' : selectedLineId === linea.id ? 'border-b-blue-200 bg-blue-50/70 shadow-[inset_0_0_0_1px_rgba(19,97,145,0.10)]' : isDesynced ? 'bg-red-50/80 border-red-200' : (linea.tanteo_activo || tanteoSession[linea.apu_id]) ? 'bg-amber-50 border-amber-200/60' : 'bg-white hover:bg-[#f7f7f5] border-b-zinc-100'}`}
                            style={{ ...VIRTUALIZED_LINE_STYLE, paddingLeft: `${((level + 1) * 1.5) + 1}rem` }}
                        >
                            {dragOverLineId === linea.id && (
                                <div className="absolute left-0 right-0 -bottom-px h-[3px] bg-[#F39200]" />
                            )}
                            <div className="relative z-10 flex items-center gap-2">
                                    {isSelectionMode && (
                                        <button
                                            type="button"
                                            onClick={(e) => handleLineSelection(e, linea)}
                                            data-budget-selection-zone="true"
                                            className={`ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                                                isGroupedSelected
                                                    ? 'border-[#F39200] bg-[#F39200] text-white'
                                                    : 'border-zinc-300 bg-white text-transparent hover:border-[#F39200]'
                                            }`}
                                            title={isGroupedSelected ? 'Quitar de la selección' : 'Añadir a la selección'}
                                        >
                                            <Check className="h-3.5 w-3.5" />
                                        </button>
                                    )}
                                    <div
                                        draggable={!isDesynced}
                                        data-budget-drag-handle="true"
                                        onMouseDown={(e) => e.stopPropagation()}
                                        onDragStart={(e) => {
                                            if (isDesynced) {
                                                e.preventDefault();
                                                return;
                                            }
                                            e.stopPropagation();
                                            handleDragStart(e, linea.id);
                                        }}
                                        onDragEnd={() => onRegisterDragLine && onRegisterDragLine(null)}
                                        onClick={(e) => e.stopPropagation()}
                                        className={`flex items-center justify-center w-6 shrink-0 ml-1 transition-opacity select-none touch-none ${isDesynced ? 'text-red-300 opacity-80 cursor-not-allowed' : 'text-zinc-300 opacity-60 hover:opacity-100 cursor-grab active:cursor-grabbing'}`}
                                        title={isDesynced ? 'Línea desincronizada: no se puede mover' : 'Arrastrar a otra cuenta EDT'}
                                    >
                                        <GripVertical className="w-3.5 h-3.5 pointer-events-none" />
                                    </div>

                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div className="w-[136px] shrink-0">
                                            <div className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">Item</div>
                                            <CodeColorizer code={linea.codigo_item || 'S/N'} className="mt-0.5 text-[10px]" />
                                            <div className="mt-1 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">Cod EDT</div>
                                            <div className="mt-0.5 font-mono text-[10px] font-black tracking-wider text-[#136191]">
                                                {node.codigo || 'S/N'}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <Calculator className="w-4 h-4 text-[#F39200] shrink-0" />
                                            <div className="flex flex-col min-w-0 flex-1">
                                                <div className="flex min-w-0 items-center gap-1.5">
                                                    <CodeColorizer code={linea.codigo_item || 'S/N'} className="shrink-0 text-[10px]" />
                                                    <span className="font-bold text-zinc-700 truncate text-[11px] leading-tight tracking-tight">
                                                        {normalizeDescriptionCapitalization(linea.descripcion)}
                                                    </span>
                                                </div>
                                                {isDesynced && (
                                                    <span className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-red-600">
                                                        Desincronizada: APU eliminado del catálogo. Reparar borrando la línea o añadiendo una sustitutiva.
                                                    </span>
                                                )}
                                                {useOmniClass && linea.omniclass_codigo && !isBudgetCompact && (
                                                    <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                                        <span className="text-[8px] font-black bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-widest border border-zinc-200">
                                                            OC {linea.omniclass_codigo}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-zinc-400 truncate max-w-[160px] uppercase italic">
                                                            {linea.omniclass_titulo}
                                                        </span>
                                                    </div>
                                                )}
                                                {lineNoteMeta.total > 0 && (
                                                    <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5 ${lineNoteMeta.nuevas > 0 ? 'text-[#F39200]' : 'text-zinc-400'}`}>
                                                        <FileText className="w-3 h-3" />
                                                        {lineNoteMeta.total} nota{lineNoteMeta.total === 1 ? '' : 's'}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2.5 shrink-0">
                                            <div className={`${BUDGET_COLUMN_WIDTH.unit} text-center text-[10px] font-bold text-zinc-500 uppercase`}>
                                                {linea.unidad || 'UND'}
                                            </div>
                                            <div className={`${BUDGET_COLUMN_WIDTH.quantity} text-right`}>
                                                <input 
                                                    type="text" 
                                                    value={getQuantityDisplayValue ? getQuantityDisplayValue(linea.id, linea.cantidad) : formatNumericDisplay(linea.cantidad)}
                                                    data-apu-quantity-id={linea.id}
                                                    disabled={isDesynced}
                                                    readOnly={isDesynced}
                                                    onClick={(e) => e.stopPropagation()}
                                                    onFocus={(e) => {
                                                        if (isDesynced) return;
                                                        handleQuantityFocus(e, linea.id, linea.cantidad);
                                                    }}
                                                    onMouseUp={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => {
                                                        if (isDesynced) {
                                                            e.preventDefault();
                                                            return;
                                                        }
                                                        handleQuantityKeyDown(e, linea.id);
                                                    }}
                                                    onBlur={() => !isDesynced && onQuantityBlur && onQuantityBlur(linea.id)}
                                                    onChange={(e) => !isDesynced && onQuantityDraftChange && onQuantityDraftChange(linea.id, e.target.value)}
                                                    className={`w-full rounded-lg border px-2 py-1 text-right text-[13px] font-mono font-black shadow-sm transition-all ${isDesynced ? 'border-red-200 bg-red-50 text-red-700 cursor-not-allowed' : 'border-zinc-100 bg-zinc-50 text-zinc-900 caret-[#F39200] hover:border-zinc-200 focus:bg-white focus:border-[#F39200]/40 focus:ring-2 focus:ring-[#F39200]/10'}`}
                                                />
                                            </div>
                                            <div className={`${BUDGET_COLUMN_WIDTH.unitPrice} text-right`}>
                                                <span className={`inline-flex min-w-[76px] justify-end rounded-lg border px-2 py-1 text-right text-[13px] font-mono font-black tabular-nums shadow-sm ${
                                                    isDesynced
                                                        ? 'border-red-200 bg-red-50 text-red-700'
                                                        :
                                                    tanteoSession[linea.apu_id] !== undefined
                                                        ? 'border-blue-200 bg-blue-50 text-blue-600'
                                                        : 'border-zinc-100 bg-zinc-50 text-zinc-900'
                                                }`}>
                                                    {formatMoneda(tanteoSession[linea.apu_id] !== undefined ? tanteoSession[linea.apu_id] : toDecimalNumber(parseNumericInput(linea.precio_unitario), '0'))}
                                                </span>
                                            </div>
                                            <div className={`${BUDGET_COLUMN_WIDTH.subtotal} text-right font-black tabular-nums text-xs shadow-sm px-2 py-1 rounded-lg border ${isDesynced ? 'bg-red-50 border-red-200 text-red-700' : tanteoSession[linea.apu_id] !== undefined ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-emerald-50 border-emerald-100 text-emerald-950'}`}>
                                                {formatMoneda(lineSubtotal)}
                                            </div>

                                            <div className={`flex items-center gap-1 transition-opacity ${BUDGET_COLUMN_WIDTH.actions} justify-end ${lineNoteMeta.total > 0 || selectedLineId === linea.id ? 'opacity-100' : 'opacity-0 group-hover/linea:opacity-100'}`}>
                                                {!isDesynced && onEquipoLockLine && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEquipoLockLine(linea);
                                                        }}
                                                        className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-blue-50 hover:text-[#136191]"
                                                        title="Bloquear línea Equipo"
                                                    >
                                                        <Lock className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {!isDesynced && onEquipoProposalLine && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEquipoProposalLine(linea);
                                                        }}
                                                        className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-emerald-50 hover:text-emerald-700"
                                                        title="Proponer ajuste Equipo"
                                                    >
                                                        <Check className="w-4 h-4" />
                                                    </button>
                                                )}
                                                {linea.apu_id && (
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onEditApu && onEditApu(linea);
                                                        }}
                                                        className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-blue-50 hover:text-blue-600"
                                                        title="Editar APU"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onOpenLineNotes && onOpenLineNotes(linea);
                                                    }}
                                                    className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${lineNoteMeta.nuevas > 0 ? 'text-[#F39200] hover:bg-orange-50 animate-pulse' : lineNoteMeta.total > 0 ? 'text-blue-600 hover:bg-blue-50' : 'text-zinc-500 hover:text-[#F39200] hover:bg-orange-50'}`}
                                                    title={isDesynced ? 'Leer notas de la línea' : 'Notas de la línea'}
                                                >
                                                    <FileText className="w-4 h-4" />
                                                    {lineNoteMeta.total > 0 && (
                                                        <span className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-[8px] font-black ${lineNoteMeta.nuevas > 0 ? 'bg-[#F39200] text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                                                            {lineNoteMeta.nuevas > 0 ? lineNoteMeta.nuevas : lineNoteMeta.total}
                                                        </span>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onDeleteLinea(linea.id);
                                                    }}
                                                    className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-red-50 hover:text-red-600"
                                                    title="Eliminar Linea"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                        </div>
                        );
                    })}

                    {validChildren.map(hijo => (
                        <PresupuestoNodeItem
                            key={hijo.id}
                            node={hijo}
                            level={level + 1}
                            lineasByEdtId={lineasByEdtId}
                            chapterSubtotalByNodeId={chapterSubtotalByNodeId}
                            onAddLinea={onAddLinea}
                            onDeleteLinea={onDeleteLinea}
                            selectedNodeId={selectedNodeId}
                            onSelectNode={onSelectNode}
                            onMoveApu={onMoveApu}
                            onUpdateLinea={onUpdateLinea}
                            selectedLineId={selectedLineId}
                            onSelectLine={onSelectLine}
                            onOpenTanteo={onOpenTanteo}
                            onEditApu={onEditApu}
                            tanteoSession={tanteoSession}
                            notesSummary={notesSummary}
                            onOpenLineNotes={onOpenLineNotes}
                            formatCalculo={formatCalculo}
                            formatMoneda={formatMoneda}
                            moneyDecimals={moneyDecimals}
                            parseNumericInput={parseNumericInput}
                            formatNumericDisplay={formatNumericDisplay}
                            isBudgetCompact={isBudgetCompact}
                            useOmniClass={useOmniClass}
                            onNavigateQuantity={onNavigateQuantity}
                            onQuantityFocus={onQuantityFocus}
                            onQuantityDraftChange={onQuantityDraftChange}
                            onQuantityCommit={onQuantityCommit}
                            getQuantityDisplayValue={getQuantityDisplayValue}
                            onQuantityCancel={onQuantityCancel}
                            onQuantityBlur={onQuantityBlur}
                            activeDragLineId={activeDragLineId}
                            onRegisterDragLine={onRegisterDragLine}
                            onMoveStart={onMoveStart}
                            selectedLineIds={selectedLineIds}
                            selectionAnchorId={selectionAnchorId}
                            selectionScopeEdtId={selectionScopeEdtId}
                            isSelectionMode={isSelectionMode}
                            isTanteoMode={isTanteoMode}
                            onSelectLineRange={onSelectLineRange}
                            onSelectionModeRequest={onSelectionModeRequest}
                            onTanteoModeRequest={onTanteoModeRequest}
                            setTanteoVisible={setTanteoVisible}
                            onEquipoLockLine={onEquipoLockLine}
                            onEquipoProposalLine={onEquipoProposalLine}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const MemoizedPresupuestoNodeItem = React.memo(PresupuestoNodeItem);

const BudgetChapterRow = ({
    rowKey,
    node,
    level,
    itemVisible,
    edtCodeVisible,
    isExpanded,
    isSelected,
    isDragOver,
    chapterSubtotal,
    onToggle,
    onSelectNode,
    onDragOver,
    onDragLeave,
    onDrop,
    formatMoneda,
    onMeasureRow,
}) => {
    const rowRef = useRef(null);

    useLayoutEffect(() => {
        const nodeEl = rowRef.current;
        if (!(nodeEl instanceof HTMLElement) || typeof onMeasureRow !== 'function') return undefined;

        const commitMeasure = () => {
            onMeasureRow(rowKey, nodeEl.offsetHeight || CHAPTER_ROW_HEIGHT);
        };

        commitMeasure();

        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(() => commitMeasure());
        observer.observe(nodeEl);
        return () => observer.disconnect();
    }, [onMeasureRow, rowKey, isExpanded, isSelected, isDragOver, chapterSubtotal]);

    return (
        <div
            ref={rowRef}
            data-budget-edt-id={node.id}
            onClick={() => onSelectNode && onSelectNode(node.id)}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            className={`relative z-10 flex items-center gap-3 py-1.5 px-3 pl-0 border-b border-r cursor-pointer transition-all ${isSelected ? 'border-b-blue-200 bg-blue-50/70 shadow-[inset_0_0_0_1px_rgba(19,97,145,0.10)]' : 'bg-sky-50/25 border-b-sky-100 hover:bg-sky-50/45'} border-l-[6px] border-l-[#136191] ${isDragOver ? 'ring-2 ring-[#F39200] bg-orange-50/50 border-orange-200' : ''}`}
            style={{ ...VIRTUALIZED_CHAPTER_STYLE, minHeight: `${CHAPTER_ROW_HEIGHT}px` }}
        >
            {isDragOver && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#F39200] rounded-r-full" />}
            <div className="ml-1 flex items-center w-6 shrink-0">
                <button onClick={onToggle} className="p-1 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200 transition-colors">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
            </div>
            <div className="flex-1 min-w-0 flex items-center gap-3">
                <div className={`flex h-full ${BUDGET_COLUMN_WIDTH.item} shrink-0 items-center justify-center text-center text-[11px] font-black tabular-nums text-[#136191]`}>
                    {itemVisible}
                </div>
                <div className={`flex h-full ${BUDGET_COLUMN_WIDTH.edt} shrink-0 items-center text-[11px] font-mono font-black tracking-wider text-[#136191]`}>
                    {edtCodeVisible || ''}
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0" style={{ paddingLeft: `${(level * 1.5) + 1}rem` }}>
                    <Folders className="w-4 h-4 shrink-0 text-[#136191]" />
                    <span className={`font-bold truncate mt-0.5 tracking-tight text-[11px] ${isSelected ? 'text-slate-900' : 'text-zinc-800'}`}>
                        {String(node.nombre || '').toUpperCase()}
                    </span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    <div className={`${BUDGET_COLUMN_WIDTH.unit} shrink-0`} />
                    <div className={`${BUDGET_COLUMN_WIDTH.quantity} shrink-0`} />
                    <div className={`${BUDGET_COLUMN_WIDTH.unitPrice} shrink-0`} />
                    <div className={`${BUDGET_COLUMN_WIDTH.subtotal} text-right font-black tabular-nums text-xs text-[#136191]/70`}>
                        {chapterSubtotal > 0 ? formatMoneda(chapterSubtotal) : '-'}
                    </div>
                    <div className={`${BUDGET_COLUMN_WIDTH.actions} shrink-0`} />
                </div>
            </div>
        </div>
    );
};

const BudgetLineRow = ({
    rowKey,
    linea,
    level,
    itemVisible,
    lineNoteMeta,
    lineSubtotal,
    isSelectionMode,
    isGroupedSelected,
    isSelected,
    isDragOver,
    tanteoSession,
    useOmniClass,
    isBudgetCompact,
    getQuantityDisplayValue,
    formatNumericDisplay,
    quantityDecimals,
    formatMoneda,
    parseNumericInput,
    handleLineSelection,
    handleQuantityFocus,
    handleQuantityKeyDown,
    handleQuantityBlur,
    onQuantityDraftChange,
    onEditApu,
    onOpenLineNotes,
    onDeleteLinea,
    onEquipoLockLine,
    onEquipoProposalLine,
    handleDragStart,
    handleLineDragOver,
    handleLineDragLeave,
    handleLineDrop,
    onMeasureRow,
    edtCodeVisible,
}) => {
    const isDesynced = isDesyncedBudgetLine(linea);
    const rowRef = useRef(null);

    useLayoutEffect(() => {
        const nodeEl = rowRef.current;
        if (!(nodeEl instanceof HTMLElement) || typeof onMeasureRow !== 'function') return undefined;

        const commitMeasure = () => {
            onMeasureRow(rowKey, nodeEl.offsetHeight || LINE_ROW_HEIGHT);
        };

        commitMeasure();

        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(() => commitMeasure());
        observer.observe(nodeEl);
        return () => observer.disconnect();
    }, [onMeasureRow, rowKey, isSelectionMode, isGroupedSelected, isSelected, isDragOver, lineNoteMeta?.total, lineNoteMeta?.nuevas, isBudgetCompact, tanteoSession?.[linea.apu_id]]);

    return (
        <div
            ref={rowRef}
            data-apu-line-id={linea.id}
            data-budget-edt-owner-id={linea.edt_id}
            onDragOver={(e) => handleLineDragOver(e, linea.id)}
            onDragLeave={() => handleLineDragLeave(linea.id)}
            onDrop={(e) => handleLineDrop(e, linea)}
            onClick={(e) => handleLineSelection(e, linea)}
            onDoubleClick={(e) => {
                if (!linea.apu_id || e.target instanceof HTMLInputElement || e.target.closest('button') || e.target.closest('[data-budget-drag-handle="true"]')) {
                    return;
                }
                e.preventDefault();
                e.stopPropagation();
                onEditApu && onEditApu(linea);
            }}
            onMouseDown={(e) => {
                if (e.target instanceof HTMLInputElement || e.target.closest('button') || e.target.closest('[data-budget-drag-handle="true"]')) {
                    return;
                }
                e.preventDefault();
            }}
            className={`relative z-10 py-1 px-3 border-b border-r transition-colors group/linea pl-0 cursor-pointer select-none ${isDragOver ? 'ring-2 ring-[#F39200] bg-orange-50/70 border-orange-200' : isGroupedSelected ? 'border-b-blue-200 bg-blue-50/70 shadow-[inset_0_0_0_1px_rgba(19,97,145,0.10)]' : isSelected ? 'border-b-blue-200 bg-blue-50/70 shadow-[inset_0_0_0_1px_rgba(19,97,145,0.10)]' : isDesynced ? 'bg-red-50/80 border-red-200' : (linea.tanteo_activo || tanteoSession[linea.apu_id]) ? 'bg-amber-50 border-amber-200/60' : 'bg-white hover:bg-[#f7f7f5] border-b-zinc-100'}`}
            style={{ ...VIRTUALIZED_LINE_STYLE, minHeight: `${LINE_ROW_HEIGHT}px` }}
        >
            {isDragOver && <div className="absolute left-0 right-0 -bottom-px h-[3px] bg-[#F39200]" />}
            <div className="relative z-10 flex items-center gap-3 h-full">
                {isSelectionMode && (
                    <button
                        type="button"
                        onClick={(e) => handleLineSelection(e, linea)}
                        data-budget-selection-zone="true"
                        className={`ml-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${isGroupedSelected ? 'border-[#F39200] bg-[#F39200] text-white' : 'border-zinc-300 bg-white text-transparent hover:border-[#F39200]'}`}
                        title={isGroupedSelected ? 'Quitar de la selección' : 'Añadir a la selección'}
                    >
                        <Check className="h-3.5 w-3.5" />
                    </button>
                )}
                <div
                    draggable={!isDesynced}
                    data-budget-drag-handle="true"
                    onMouseDown={(e) => e.stopPropagation()}
                    onDragStart={(e) => {
                        if (isDesynced) {
                            e.preventDefault();
                            return;
                        }
                        e.stopPropagation();
                        handleDragStart(e, linea.id);
                    }}
                    className={`flex items-center justify-center w-6 shrink-0 ml-1 transition-opacity select-none touch-none ${isDesynced ? 'text-red-300 opacity-80 cursor-not-allowed' : 'text-zinc-300 opacity-60 hover:opacity-100 cursor-grab active:cursor-grabbing'}`}
                    title={isDesynced ? 'Línea desincronizada: no se puede mover' : 'Arrastrar a otra cuenta EDT'}
                >
                    <GripVertical className="w-3.5 h-3.5 pointer-events-none" />
                </div>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`flex h-full ${BUDGET_COLUMN_WIDTH.item} shrink-0 items-center justify-center text-center text-[11px] font-black tabular-nums text-[#136191]`}>
                        {itemVisible}
                    </div>
                    <div className={`flex h-full ${BUDGET_COLUMN_WIDTH.edt} shrink-0 items-center`}>
                        <CodeColorizer code={edtCodeVisible || 'S/N'} className="text-[10px]" />
                    </div>
                    <div className="flex items-center gap-2 flex-1 min-w-0" style={{ paddingLeft: `${((level + 1) * 1.5) + 1}rem` }}>
                        <Calculator className="w-4 h-4 text-[#F39200] shrink-0" />
                        <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex min-w-0 items-center gap-1.5">
                                <CodeColorizer code={linea.codigo_item || 'S/N'} className="shrink-0 text-[10px]" />
                                <span className="font-bold text-zinc-700 truncate text-[11px] tracking-tight">
                                    {normalizeDescriptionCapitalization(linea.descripcion)}
                                </span>
                            </div>
                            {isDesynced && (
                                <span className="mt-0.5 text-[9px] font-black uppercase tracking-widest text-red-600">
                                    Desincronizada: APU eliminado del catálogo. Reparar borrando la línea o añadiendo una sustitutiva.
                                </span>
                            )}
                            {useOmniClass && linea.omniclass_codigo && !isBudgetCompact && (
                                <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
                                    <span className="text-[8px] font-black bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-widest border border-zinc-200">
                                        OC {linea.omniclass_codigo}
                                    </span>
                                    <span className="text-[8px] font-bold text-zinc-400 truncate max-w-[160px] uppercase italic">
                                        {linea.omniclass_titulo}
                                    </span>
                                </div>
                            )}
                            {lineNoteMeta.total > 0 && (
                                <span className={`text-[9px] font-bold uppercase tracking-widest flex items-center gap-1 mt-0.5 ${lineNoteMeta.nuevas > 0 ? 'text-[#F39200]' : 'text-zinc-400'}`}>
                                    <FileText className="w-3 h-3" />
                                    {lineNoteMeta.total} nota{lineNoteMeta.total === 1 ? '' : 's'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0">
                        <div className={`${BUDGET_COLUMN_WIDTH.unit} text-center text-[10px] font-bold text-zinc-500 lowercase`}>
                            {String(linea.unidad || 'und').toLowerCase()}
                        </div>
                        <div className={`${BUDGET_COLUMN_WIDTH.quantity} text-right`}>
                            <input
                                type="text"
                                value={getQuantityDisplayValue ? getQuantityDisplayValue(linea.id, linea.cantidad) : formatNumericDisplay(linea.cantidad, quantityDecimals)}
                                data-apu-quantity-id={linea.id}
                                disabled={isDesynced}
                                readOnly={isDesynced}
                                onClick={(e) => e.stopPropagation()}
                                onFocus={(e) => {
                                    if (isDesynced) return;
                                    handleQuantityFocus(e, linea.id, linea.cantidad);
                                }}
                                onMouseUp={(e) => e.stopPropagation()}
                                onKeyDown={(e) => {
                                    if (isDesynced) {
                                        e.preventDefault();
                                        return;
                                    }
                                    handleQuantityKeyDown(e, linea.id);
                                }}
                                onBlur={() => !isDesynced && handleQuantityBlur && handleQuantityBlur(linea.id)}
                                onChange={(e) => !isDesynced && onQuantityDraftChange && onQuantityDraftChange(linea.id, e.target.value)}
                                className={`w-full rounded-lg border px-2 py-1 text-right text-[13px] font-mono font-black shadow-sm transition-all ${isDesynced ? 'border-red-200 bg-red-50 text-red-700 cursor-not-allowed' : 'border-zinc-100 bg-zinc-50 text-zinc-900 caret-[#F39200] hover:border-zinc-200 focus:bg-white focus:border-[#F39200]/40 focus:ring-2 focus:ring-[#F39200]/10'}`}
                            />
                        </div>
                        <div className={`${BUDGET_COLUMN_WIDTH.unitPrice} text-right`}>
                            <span className={`inline-flex min-w-[76px] justify-end rounded-lg border px-2 py-1 text-right text-[13px] font-mono font-black tabular-nums shadow-sm ${isDesynced ? 'border-red-200 bg-red-50 text-red-700' : tanteoSession[linea.apu_id] !== undefined ? 'border-blue-200 bg-blue-50 text-blue-600' : 'border-zinc-100 bg-zinc-50 text-zinc-900'}`}>
                                {formatMoneda(tanteoSession[linea.apu_id] !== undefined ? tanteoSession[linea.apu_id] : toDecimalNumber(parseNumericInput(linea.precio_unitario), '0'))}
                            </span>
                        </div>
                        <div className={`${BUDGET_COLUMN_WIDTH.subtotal} text-right font-black tabular-nums text-xs shadow-sm px-2 py-1 rounded-lg border ${isDesynced ? 'bg-red-50 border-red-200 text-red-700' : tanteoSession[linea.apu_id] !== undefined ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-emerald-50 border-emerald-100 text-emerald-950'}`}>
                            {formatMoneda(lineSubtotal)}
                        </div>
                        <div className={`flex items-center gap-1 transition-opacity ${BUDGET_COLUMN_WIDTH.actions} justify-end ${lineNoteMeta.total > 0 || isSelected ? 'opacity-100' : 'opacity-0 group-hover/linea:opacity-100'}`}>
                            {!isDesynced && onEquipoLockLine && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEquipoLockLine(linea);
                                    }}
                                    className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-blue-50 hover:text-[#136191]"
                                    title="Bloquear línea Equipo"
                                >
                                    <Lock className="w-4 h-4" />
                                </button>
                            )}
                            {!isDesynced && onEquipoProposalLine && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEquipoProposalLine(linea);
                                    }}
                                    className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-emerald-50 hover:text-emerald-700"
                                    title="Proponer ajuste Equipo"
                                >
                                    <Check className="w-4 h-4" />
                                </button>
                            )}
                            {linea.apu_id && (
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onEditApu && onEditApu(linea);
                                    }}
                                    className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-blue-50 hover:text-blue-600"
                                    title="Editar APU"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenLineNotes && onOpenLineNotes(linea);
                                }}
                                className={`relative flex h-11 w-11 items-center justify-center rounded-xl transition-all ${lineNoteMeta.nuevas > 0 ? 'text-[#F39200] hover:bg-orange-50 animate-pulse' : lineNoteMeta.total > 0 ? 'text-blue-600 hover:bg-blue-50' : 'text-zinc-500 hover:text-[#F39200] hover:bg-orange-50'}`}
                                title={isDesynced ? 'Leer notas de la línea' : 'Notas de la línea'}
                            >
                                <FileText className="w-4 h-4" />
                                {lineNoteMeta.total > 0 && (
                                    <span className={`absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full flex items-center justify-center text-[8px] font-black ${lineNoteMeta.nuevas > 0 ? 'bg-[#F39200] text-white' : 'bg-zinc-200 text-zinc-600'}`}>
                                        {lineNoteMeta.nuevas > 0 ? lineNoteMeta.nuevas : lineNoteMeta.total}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteLinea(linea.id);
                                }}
                                className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-500 transition-all hover:bg-red-50 hover:text-red-600"
                                title="Eliminar Linea"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const MemoBudgetChapterRow = React.memo(
    BudgetChapterRow,
    (prev, next) =>
        prev.node === next.node &&
        prev.level === next.level &&
        prev.isExpanded === next.isExpanded &&
        prev.isSelected === next.isSelected &&
        prev.isDragOver === next.isDragOver &&
        prev.chapterSubtotal === next.chapterSubtotal
);

const MemoBudgetLineRow = React.memo(
    BudgetLineRow,
    (prev, next) =>
        prev.linea === next.linea &&
        prev.itemVisible === next.itemVisible &&
        prev.edtCodeVisible === next.edtCodeVisible &&
        prev.level === next.level &&
        prev.lineNoteMeta?.total === next.lineNoteMeta?.total &&
        prev.lineNoteMeta?.nuevas === next.lineNoteMeta?.nuevas &&
        prev.lineSubtotal === next.lineSubtotal &&
        prev.isSelectionMode === next.isSelectionMode &&
        prev.isGroupedSelected === next.isGroupedSelected &&
        prev.isSelected === next.isSelected &&
        prev.isDragOver === next.isDragOver &&
        prev.isBudgetCompact === next.isBudgetCompact
);


const LineasPresupuestoTab = ({
    tanteoVisible = false,
    setTanteoVisible,
    notesSummary = {},
    onOpenLineNotes,
    onEditApu,
    onEquipoLockLine,
    onEquipoProposalLine,
    minimapTargetNodeId = null,
    onMinimapTargetHandled = null,
    onTreeReady = null
}) => {
    const { activeProyecto, activePresupuesto, tanteoSession, config } = usePresupuestoData();
    const {
        selectedNodeId,
        setSelectedNodeId,
        setSelectedNodeMeta,
        selectedLineId,
        setSelectedLineId,
    } = usePresupuestoSelection();
    const {
        deleteApuFromBudget,
        updateApuInBudget,
        moveApuInBudget,
    } = usePresupuestoActions();
    const { selectedEmpresa, user } = useContext(AuthContext);
    const useOmniClass = selectedEmpresa?.use_omniclass !== false;
    const adaptiveLayout = useAdaptiveLayout({ moduleKey: 'presupuesto' });
    
    // -- Robust formatters with fallbacks --
    const formatters = useFormatters();
    const formatNumericDisplay = formatters?.formatNumericDisplay || ((v) => String(v || '').replace('.', ','));
    const parseNumericInput = formatters?.parseNumericInput || ((v) => String(v || '').replace(',', '.'));
    const { 
        formatMoneda = fallbackFormatMoneda,
        formatCalculo 
    } = formatters || {};
    const moneyDecimals = formatters?.precisionMoneda ?? 2;
    const quantityDecimals = formatters?.precisionCalculo ?? 4;

    const indirectosStatus = getIndirectosStatus(config.indirectos_porcentaje);
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1920));
    const [quantityDrafts, setQuantityDrafts] = useState({});
    const [quantityEditOrigins, setQuantityEditOrigins] = useState({});
    const [quantityCommittedValues, setQuantityCommittedValues] = useState({});
    const [activeDragLineId, setActiveDragLineId] = useState(null);
    const [budgetMoveNotice, setBudgetMoveNotice] = useState(null);
    const [selectedLineIds, setSelectedLineIds] = useState(new Set());
    const [selectionAnchorId, setSelectionAnchorId] = useState(null);
    const [selectionScopeEdtId, setSelectionScopeEdtId] = useState(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isTanteoMode, setIsTanteoMode] = useState(false);
    const [expandedNodeIds, setExpandedNodeIds] = useState(new Set());
    const [dragOverNodeId, setDragOverNodeId] = useState(null);
    const [dragOverLineId, setDragOverLineId] = useState(null);
    const [viewportScrollTop, setViewportScrollTop] = useState(0);
    const [viewportHeight, setViewportHeight] = useState(720);
    const [renderedRowCount, setRenderedRowCount] = useState(VIRTUAL_INITIAL_ROWS);
    const [budgetSearchQuery, setBudgetSearchQuery] = useState('');
    const [activeBudgetSearchIndex, setActiveBudgetSearchIndex] = useState(-1);
    const [pendingBudgetSearchTarget, setPendingBudgetSearchTarget] = useState(null);
    const quantityBlurBypassRef = useRef(null);
    const quantityCancelBypassRef = useRef(null);
    const budgetViewportRef = useRef(null);
    const budgetHeaderScrollRef = useRef(null);

    useEffect(() => {
        const handleResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!budgetMoveNotice) return undefined;
        const timer = window.setTimeout(() => setBudgetMoveNotice(null), 2800);
        return () => window.clearTimeout(timer);
    }, [budgetMoveNotice]);

    useEffect(() => {
        const validLineIds = new Set((activePresupuesto?.detalle || []).filter(isOperationalBudgetLine).map((linea) => Number(linea.id)));
        setSelectedLineIds((prev) => new Set(Array.from(prev).filter((id) => validLineIds.has(Number(id)))));
        setSelectionAnchorId((prev) => (prev != null && validLineIds.has(Number(prev)) ? prev : null));
        setSelectionScopeEdtId((prev) => {
            if (prev == null) return null;
            const scopedLines = (activePresupuesto?.detalle || []).filter((linea) => Number(linea.edt_id) === Number(prev) && isOperationalBudgetLine(linea));
            return scopedLines.length > 0 ? prev : null;
        });
    }, [activePresupuesto?.detalle]);

    useEffect(() => {
        if (isSelectionMode) return;
        setSelectedLineIds(new Set());
        setSelectionAnchorId(null);
        setSelectionScopeEdtId(null);
    }, [isSelectionMode]);

    useEffect(() => {
        if (tanteoVisible || !isTanteoMode) return;
        setIsTanteoMode(false);
    }, [tanteoVisible, isTanteoMode]);

    const isBudgetCompact = adaptiveLayout.enabled
        ? adaptiveLayout.profile !== 'wide'
        : viewportWidth < 1280;

    useEffect(() => {
        const fetchTree = async () => {
            if (!activeProyecto?.id) return;
            try {
                setLoading(true);
                const empresaId = selectedEmpresa?.id || user?.empresa_id || null;
                const treeData = await edtApi.getTree(activeProyecto.id, empresaId);
                setTree(treeData);
                
                const findFirstCuenta = (nodes) => {
                    for (const n of nodes) {
                        if (n.tipo_nodo === 'CUENTA_PAQUETE') return n.id;
                        if (n.hijos) {
                            const found = findFirstCuenta(n.hijos);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                
                if (treeData.length > 0) {
                    setExpandedNodeIds(new Set(collectTreeNodeIds(treeData)));
                    setSelectedNodeId((prevSelectedNodeId) => prevSelectedNodeId ?? findFirstCuenta(treeData));
                }
            } catch (error) {
                globalThis.reportClientError?.("Error cargando el árbol EDT para Presupuestos:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTree();
    }, [activeProyecto, selectedEmpresa, user, setSelectedNodeId]);

    useEffect(() => {
        onTreeReady && onTreeReady(tree);
    }, [tree, onTreeReady]);

    useEffect(() => {
        const node = budgetViewportRef.current;
        if (!(node instanceof HTMLElement)) return undefined;

        const syncViewport = () => {
            setViewportScrollTop(node.scrollTop);
            setViewportHeight(node.clientHeight || 720);
            if (budgetHeaderScrollRef.current instanceof HTMLElement) {
                budgetHeaderScrollRef.current.scrollLeft = node.scrollLeft;
            }
        };

        syncViewport();
        node.addEventListener('scroll', syncViewport, { passive: true });
        window.addEventListener('resize', syncViewport);
        return () => {
            node.removeEventListener('scroll', syncViewport);
            window.removeEventListener('resize', syncViewport);
        };
    }, [loading]);

    const getQuantityDisplayValue = (lineId, persistedValue) => {
        if (Object.prototype.hasOwnProperty.call(quantityDrafts, lineId)) {
            return quantityDrafts[lineId];
        }
        if (Object.prototype.hasOwnProperty.call(quantityCommittedValues, lineId)) {
            return formatNumericDisplay(quantityCommittedValues[lineId], quantityDecimals);
        }
        return formatNumericDisplay(persistedValue, quantityDecimals);
    };

    const handleQuantityFocus = (lineId, currentValue) => {
        const baseValue = Object.prototype.hasOwnProperty.call(quantityDrafts, lineId)
            ? parseFloat(parseNumericInput(quantityDrafts[lineId]))
            : Object.prototype.hasOwnProperty.call(quantityCommittedValues, lineId)
                ? quantityCommittedValues[lineId]
                : Number(currentValue ?? 0);
        setQuantityEditOrigins((prev) => (
            Object.prototype.hasOwnProperty.call(prev, lineId)
                ? prev
                : { ...prev, [lineId]: baseValue }
        ));
        setQuantityDrafts((prev) => ({
            ...prev,
            [lineId]: formatNumericDisplay(baseValue, quantityDecimals)
        }));
    };

    const handleQuantityKeyDown = (e, lineId) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            e.stopPropagation();
            cancelQuantityDraft(lineId);
            e.currentTarget.blur();
            return;
        }
        if (e.key === 'Enter') {
            e.preventDefault();
            e.stopPropagation();
            handleQuantityNavigation(lineId, 'ArrowDown');
            return;
        }
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        e.stopPropagation();
        handleQuantityNavigation(lineId, e.key);
    };

    const handleQuantityDraftChange = (lineId, value) => {
        setQuantityDrafts((prev) => ({
            ...prev,
            [lineId]: value
        }));
    };

    const commitQuantityDraft = async (lineId) => {
        if (!Object.prototype.hasOwnProperty.call(quantityDrafts, lineId)) return;
        const raw = quantityDrafts[lineId];
        const trimmed = String(raw ?? '').trim();

        if (!trimmed) {
            setQuantityDrafts((prev) => {
                const next = { ...prev };
                delete next[lineId];
                return next;
            });
            setQuantityEditOrigins((prev) => {
                const next = { ...prev };
                delete next[lineId];
                return next;
            });
            return;
        }

        const parsed = parseFloat(parseNumericInput(trimmed));
        if (!Number.isFinite(parsed)) {
            setQuantityDrafts((prev) => {
                const next = { ...prev };
                delete next[lineId];
                return next;
            });
            setQuantityEditOrigins((prev) => {
                const next = { ...prev };
                delete next[lineId];
                return next;
            });
            return;
        }

        await updateApuInBudget(lineId, { cantidad: parsed });
        setQuantityCommittedValues((prev) => ({
            ...prev,
            [lineId]: parsed
        }));
        setQuantityDrafts((prev) => ({
            ...prev,
            [lineId]: formatNumericDisplay(parsed, quantityDecimals)
        }));
        setQuantityEditOrigins((prev) => {
            const next = { ...prev };
            delete next[lineId];
            return next;
        });
    };

    const cancelQuantityDraft = (lineId) => {
        quantityCancelBypassRef.current = lineId;
        const originValue = Object.prototype.hasOwnProperty.call(quantityEditOrigins, lineId)
            ? quantityEditOrigins[lineId]
            : activePresupuesto?.detalle?.find((linea) => String(linea.id) === String(lineId))?.cantidad;

        setQuantityDrafts((prev) => {
            const next = { ...prev };
            delete next[lineId];
            return next;
        });
        if (originValue !== undefined && originValue !== null) {
            setQuantityCommittedValues((prev) => ({
                ...prev,
                [lineId]: Number(originValue)
            }));
        }
        setQuantityEditOrigins((prev) => {
            const next = { ...prev };
            delete next[lineId];
            return next;
        });
    };

    const handleQuantityBlur = async (lineId) => {
        if (String(quantityCancelBypassRef.current ?? '') === String(lineId)) {
            quantityCancelBypassRef.current = null;
            return;
        }
        if (String(quantityBlurBypassRef.current ?? '') === String(lineId)) {
            quantityBlurBypassRef.current = null;
            return;
        }
        await commitQuantityDraft(lineId);
    };

    const handleQuantityNavigation = async (currentLineId, directionKey) => {
        const quantityLineIds = flattenedOperationalLineIds;
        if (quantityLineIds.length === 0) return;

        let currentIndex = quantityLineIds.findIndex((id) => Number(id) === Number(currentLineId));
        if (currentIndex < 0) return;

        let nextIndex;
        if (directionKey === 'ArrowDown') {
            nextIndex = currentIndex + 1;
            if (nextIndex >= quantityLineIds.length) {
                quantityBlurBypassRef.current = currentLineId;
                await commitQuantityDraft(currentLineId);
                setSelectedLineId(Number(currentLineId));
                focusQuantityInputForLine(Number(currentLineId), 'auto');
                return;
            }
        } else {
            nextIndex = currentIndex - 1;
            if (nextIndex < 0) {
                quantityBlurBypassRef.current = currentLineId;
                await commitQuantityDraft(currentLineId);
                setSelectedLineId(Number(currentLineId));
                focusQuantityInputForLine(Number(currentLineId), 'auto');
                return;
            }
        }

        const nextId = Number(quantityLineIds[nextIndex]);
        quantityBlurBypassRef.current = currentLineId;
        await commitQuantityDraft(currentLineId);
        setSelectedLineId(nextId);
        focusQuantityInputForLine(nextId, 'auto');
    };

    const lineas = activePresupuesto?.detalle || [];
    const lineasByEdtId = useMemo(() => {
        const map = new Map();
        for (const linea of lineas) {
            if (!isOperationalBudgetLine(linea)) continue;
            const edtId = Number(linea.edt_id);
            if (!map.has(edtId)) {
                map.set(edtId, []);
            }
            map.get(edtId).push(linea);
        }
        for (const [edtId, items] of map.entries()) {
            map.set(
                edtId,
                [...items].sort((a, b) => (a.orden || 0) - (b.orden || 0))
            );
        }
        return map;
    }, [lineas]);
    const chapterSubtotalByNodeId = useMemo(() => {
        const directSubtotalByEdtId = new Map();
        for (const [edtId, items] of lineasByEdtId.entries()) {
            directSubtotalByEdtId.set(
                edtId,
                sumBudgetOperationalSubtotals(
                    items.filter(isCountableBudgetLine),
                    { moneyDecimals, tanteoSession }
                )
            );
        }

        const subtotalByNodeId = new Map();
        const computeNodeSubtotal = (node) => {
            const own = directSubtotalByEdtId.get(Number(node.id)) || 0;
            const children = (node.hijos || []).reduce((acc, child) => acc + computeNodeSubtotal(child), 0);
            const subtotal = own + children;
            subtotalByNodeId.set(Number(node.id), subtotal);
            return subtotal;
        };

        tree.forEach((node) => computeNodeSubtotal(node));
        return subtotalByNodeId;
    }, [lineasByEdtId, moneyDecimals, tanteoSession, tree]);
    const edtCodeByNodeId = useMemo(() => {
        const map = new Map();
        const appendNode = (node) => {
            map.set(Number(node.id), String(node.codigo || '').trim());
            (node.hijos || []).forEach((child) => appendNode(child));
        };
        tree.forEach((node) => appendNode(node));
        return map;
    }, [tree]);
    const apuLineas = lineas.filter(isCountableBudgetLine);
    const desyncedLineas = lineas.filter(isDesyncedBudgetLine);
    const flattenedRows = useMemo(() => {
        const rows = [];
        const appendNode = (node, level = 0) => {
            const nodeId = Number(node.id);
            rows.push({
                key: `node-${nodeId}`,
                type: 'node',
                node,
                itemVisible: String(rows.length + 1),
                edtCodeVisible: level === 0 ? '' : (edtCodeByNodeId.get(nodeId) || ''),
                level,
                estimatedHeight: CHAPTER_ROW_HEIGHT,
            });
            if (!expandedNodeIds.has(nodeId)) return;
            const nodeLineas = lineasByEdtId.get(nodeId) || [];
            for (const linea of nodeLineas) {
                rows.push({
                    key: `line-${linea.id}`,
                    type: 'line',
                    linea,
                    itemVisible: String(rows.length + 1),
                    edtCodeVisible: String(linea.codigo_item || '').trim() || edtCodeByNodeId.get(Number(linea.edt_id)) || '',
                    level,
                    estimatedHeight: LINE_ROW_HEIGHT,
                });
            }
            for (const child of (node.hijos || []).filter((item) => item.tipo_nodo === 'CUENTA_PAQUETE')) {
                appendNode(child, level + 1);
            }
        };
        for (const node of tree) appendNode(node, 0);
        return rows;
    }, [edtCodeByNodeId, expandedNodeIds, lineasByEdtId, tree]);
    const flattenedOperationalLineIds = useMemo(
        () => flattenedRows.filter((row) => row.type === 'line').map((row) => Number(row.linea.id)),
        [flattenedRows]
    );
    const budgetSearchEntries = useMemo(() => {
        const entries = [];
        const appendNodeEntries = (nodes, ancestorIds = []) => {
            for (const node of nodes || []) {
                const nodeId = Number(node.id);
                const nodePath = [...ancestorIds, nodeId];
                entries.push({
                    key: `node-${nodeId}`,
                    type: 'node',
                    nodeId,
                    expandNodeIds: ancestorIds,
                    text: `${node.codigo || ''} ${node.nombre || ''}`,
                });
                const nodeLineas = lineasByEdtId.get(nodeId) || [];
                for (const linea of nodeLineas) {
                    entries.push({
                        key: `line-${linea.id}`,
                        type: 'line',
                        lineId: Number(linea.id),
                        nodeId,
                        expandNodeIds: nodePath,
                        text: `${linea.codigo_item || ''} ${linea.descripcion || ''} ${linea.unidad || ''}`,
                    });
                }
                const children = (node.hijos || []).filter((item) => item.tipo_nodo === 'CUENTA_PAQUETE');
                if (children.length > 0) {
                    appendNodeEntries(children, nodePath);
                }
            }
        };
        appendNodeEntries(tree, []);
        return entries;
    }, [lineasByEdtId, tree]);
    const budgetSearchMatches = useMemo(() => {
        const query = String(budgetSearchQuery || '').trim();
        if (!query) return [];
        return budgetSearchEntries.filter((entry) => includesNormalized(entry.text, query));
    }, [budgetSearchEntries, budgetSearchQuery]);
    const flattenedLineIdsByEdt = useMemo(() => {
        const map = new Map();
        for (const row of flattenedRows) {
            if (row.type !== 'line') continue;
            const edtId = Number(row.linea.edt_id);
            if (!map.has(edtId)) map.set(edtId, []);
            map.get(edtId).push(Number(row.linea.id));
        }
        return map;
    }, [flattenedRows]);
    const registerRowHeight = useCallback(() => {}, []);

    useEffect(() => {
        setRenderedRowCount((prev) => Math.min(flattenedRows.length, Math.max(VIRTUAL_INITIAL_ROWS, prev)));
    }, [flattenedRows.length]);

    const estimatedAverageRowHeight = LINE_ROW_HEIGHT;
    const expandRenderedRows = useCallback((nextMinimumCount) => {
        setRenderedRowCount((prev) => {
            if (flattenedRows.length <= prev) return prev;
            return Math.min(flattenedRows.length, Math.max(prev, nextMinimumCount));
        });
    }, [flattenedRows.length]);

    const ensureRenderedRowsForIndex = useCallback((targetIndex) => {
        if (!Number.isFinite(targetIndex) || targetIndex < 0) return;
        const viewportRows = Math.max(
            VIRTUAL_ROWS_CHUNK,
            Math.ceil((viewportHeight || 720) / estimatedAverageRowHeight) + VIRTUAL_ROWS_OVERSCAN
        );
        expandRenderedRows(targetIndex + 1 + viewportRows);
    }, [estimatedAverageRowHeight, expandRenderedRows, viewportHeight]);

    useEffect(() => {
        if (flattenedRows.length <= renderedRowCount) return;
        const estimatedVisibleRows = Math.max(
            VIRTUAL_ROWS_CHUNK,
            Math.ceil((viewportHeight || 720) / estimatedAverageRowHeight) + VIRTUAL_ROWS_OVERSCAN
        );
        const estimatedScrolledRows = Math.floor(viewportScrollTop / estimatedAverageRowHeight);
        const requiredRows = estimatedScrolledRows + estimatedVisibleRows;
        const nearBottomThreshold = Math.max(
            0,
            (renderedRowCount * estimatedAverageRowHeight) - (viewportHeight || 720) - VIRTUAL_MIN_BOTTOM_BUFFER_PX
        );

        if (
            requiredRows >= renderedRowCount - VIRTUAL_ROWS_OVERSCAN ||
            viewportScrollTop >= nearBottomThreshold
        ) {
            expandRenderedRows(renderedRowCount + estimatedVisibleRows);
        }
    }, [estimatedAverageRowHeight, expandRenderedRows, flattenedRows.length, renderedRowCount, viewportHeight, viewportScrollTop]);

    useEffect(() => {
        if (flattenedRows.length <= renderedRowCount) return;
        const viewport = budgetViewportRef.current;
        if (!(viewport instanceof HTMLElement)) return;

        const remainingRenderedPx = viewport.scrollHeight - (viewport.scrollTop + viewport.clientHeight);
        if (remainingRenderedPx <= VIRTUAL_MIN_BOTTOM_BUFFER_PX) {
            const viewportRows = Math.max(
                VIRTUAL_ROWS_CHUNK,
                Math.ceil((viewport.clientHeight || 720) / estimatedAverageRowHeight) + VIRTUAL_ROWS_OVERSCAN
            );
            expandRenderedRows(renderedRowCount + viewportRows);
        }
    }, [estimatedAverageRowHeight, expandRenderedRows, flattenedRows.length, renderedRowCount, viewportHeight, viewportScrollTop]);

    const rowTopOffsets = useMemo(() => {
        const offsets = new Map();
        let top = 0;
        flattenedRows.forEach((row) => {
            offsets.set(row.key, top);
            top += row.type === 'node' ? CHAPTER_ROW_HEIGHT : LINE_ROW_HEIGHT;
        });
        return offsets;
    }, [flattenedRows]);

    const scrollLineIntoView = (lineId, behavior = 'auto') => {
        const viewport = budgetViewportRef.current;
        if (!(viewport instanceof HTMLElement)) return;
        const rowIndex = flattenedRows.findIndex((row) => row.type === 'line' && Number(row.linea.id) === Number(lineId));
        if (rowIndex < 0) return;
        ensureRenderedRowsForIndex(rowIndex);
        const row = flattenedRows[rowIndex];
        const top = rowTopOffsets.get(row.key) || 0;
        const bottom = top + (row.type === 'node' ? CHAPTER_ROW_HEIGHT : LINE_ROW_HEIGHT);
        const currentTop = viewport.scrollTop;
        const currentBottom = currentTop + viewport.clientHeight;

        if (top < currentTop) {
            viewport.scrollTo({ top, behavior });
        } else if (bottom > currentBottom) {
            viewport.scrollTo({ top: Math.max(0, bottom - viewport.clientHeight), behavior });
        }
    };

    const navigateBudgetSearchMatch = useCallback((targetIndex = 0) => {
        if (budgetSearchMatches.length === 0) return;
        const normalizedIndex = ((targetIndex % budgetSearchMatches.length) + budgetSearchMatches.length) % budgetSearchMatches.length;
        const target = budgetSearchMatches[normalizedIndex];
        setActiveBudgetSearchIndex(normalizedIndex);
        setExpandedNodeIds((prev) => {
            const next = new Set(prev);
            (target.expandNodeIds || []).forEach((id) => next.add(Number(id)));
            return next;
        });
        if (target.type === 'node') {
            setSelectedNodeId(target.nodeId);
            setSelectedLineId(null);
        } else {
            setSelectedNodeId(target.nodeId);
            setSelectedLineId(target.lineId);
        }
        setPendingBudgetSearchTarget(target);
    }, [budgetSearchMatches, setSelectedLineId, setSelectedNodeId]);

    const focusQuantityInputForLine = (lineId, behavior = 'auto') => {
        scrollLineIntoView(lineId, behavior);
        requestAnimationFrame(() => {
            const input = document.querySelector(`[data-apu-quantity-id="${lineId}"]`);
            if (input instanceof HTMLInputElement) {
                if (!isElementFullyVisibleInScrollParent(input)) {
                    input.scrollIntoView({ behavior, block: 'nearest' });
                }
                focusAndSelectInput(input);
            }
        });
    };
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
            if (document.activeElement?.tagName === 'INPUT') return;

            const allLineIds = flattenedOperationalLineIds;
            if (allLineIds.length === 0) return;
            e.preventDefault();

            const currentId = selectedLineId;
            const currentIndex = allLineIds.findIndex((id) => Number(id) === Number(currentId));
            if (currentIndex < 0) return;

            let nextIndex = currentIndex;
            if (e.key === 'ArrowDown' && currentIndex < allLineIds.length - 1) nextIndex = currentIndex + 1;
            if (e.key === 'ArrowUp' && currentIndex > 0) nextIndex = currentIndex - 1;

            const nextId = Number(allLineIds[nextIndex]);
            setSelectedLineId(nextId);
            scrollLineIntoView(nextId, 'smooth');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [flattenedOperationalLineIds, scrollLineIntoView, selectedLineId, setSelectedLineId]);
    const findNodeById = (nodes, targetId) => {
        for (const node of nodes) {
            if (Number(node.id) === Number(targetId)) return node;
            if (node.hijos?.length) {
                const found = findNodeById(node.hijos, targetId);
                if (found) return found;
            }
        }
        return null;
    };
    const selectedNode = selectedNodeId ? findNodeById(tree, selectedNodeId) : null;

    useEffect(() => {
        if (selectedNode) {
            setSelectedNodeMeta({
                id: selectedNode.id,
                codigo: selectedNode.codigo,
                nombre: selectedNode.nombre
            });
            return;
        }
        setSelectedNodeMeta(null);
    }, [selectedNode, setSelectedNodeMeta]);

    useEffect(() => {
        if (!minimapTargetNodeId) return;
        setSelectedNodeId(minimapTargetNodeId);
        setSelectedLineId(null);
        const rowIndex = flattenedRows.findIndex((item) => item.type === 'node' && Number(item.node.id) === Number(minimapTargetNodeId));
        if (rowIndex >= 0) {
            ensureRenderedRowsForIndex(rowIndex);
        }
        const row = rowIndex >= 0 ? flattenedRows[rowIndex] : null;
        if (row && budgetViewportRef.current instanceof HTMLElement) {
            budgetViewportRef.current.scrollTo({ top: rowTopOffsets.get(row.key) || 0, behavior: 'smooth' });
        }
        onMinimapTargetHandled && onMinimapTargetHandled();
    }, [ensureRenderedRowsForIndex, flattenedRows, minimapTargetNodeId, onMinimapTargetHandled, rowTopOffsets, setSelectedLineId, setSelectedNodeId]);

    useEffect(() => {
        if (!selectedLineId) return undefined;
        const rowIndex = flattenedRows.findIndex((row) => row.type === 'line' && Number(row.linea.id) === Number(selectedLineId));
        if (rowIndex >= 0) {
            ensureRenderedRowsForIndex(rowIndex);
        }
        let frameId = null;
        frameId = window.requestAnimationFrame(() => {
            scrollLineIntoView(selectedLineId, 'smooth');
        });
        return () => {
            if (frameId != null) {
                window.cancelAnimationFrame(frameId);
            }
        };
    }, [ensureRenderedRowsForIndex, flattenedRows, scrollLineIntoView, selectedLineId]);

    useEffect(() => {
        const query = String(budgetSearchQuery || '').trim();
        if (!query) {
            setActiveBudgetSearchIndex(-1);
            setPendingBudgetSearchTarget(null);
            return;
        }
        if (budgetSearchMatches.length === 0) {
            setActiveBudgetSearchIndex(-1);
            setPendingBudgetSearchTarget(null);
            return;
        }
        navigateBudgetSearchMatch(0);
    }, [budgetSearchMatches, budgetSearchQuery, navigateBudgetSearchMatch]);

    useEffect(() => {
        if (!pendingBudgetSearchTarget) return;
        if (pendingBudgetSearchTarget.type === 'node') {
            const rowIndex = flattenedRows.findIndex(
                (row) => row.type === 'node' && Number(row.node.id) === Number(pendingBudgetSearchTarget.nodeId)
            );
            if (rowIndex < 0) return;
            ensureRenderedRowsForIndex(rowIndex);
            const row = flattenedRows[rowIndex];
            if (row && budgetViewportRef.current instanceof HTMLElement) {
                budgetViewportRef.current.scrollTo({ top: rowTopOffsets.get(row.key) || 0, behavior: 'smooth' });
                setPendingBudgetSearchTarget(null);
            }
            return;
        }

        const rowIndex = flattenedRows.findIndex(
            (row) => row.type === 'line' && Number(row.linea.id) === Number(pendingBudgetSearchTarget.lineId)
        );
        if (rowIndex < 0) return;
        ensureRenderedRowsForIndex(rowIndex);
        scrollLineIntoView(pendingBudgetSearchTarget.lineId, 'smooth');
        setPendingBudgetSearchTarget(null);
    }, [ensureRenderedRowsForIndex, flattenedRows, pendingBudgetSearchTarget, rowTopOffsets, scrollLineIntoView]);

    useEffect(() => {
        if (!isSelectionMode && !isTanteoMode && !tanteoVisible) return undefined;

        const handleSelectionEscape = (event) => {
            if (event.key !== 'Escape') return;
            if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;
            event.preventDefault();
            resetBudgetWorkbenchModes();
        };

        window.addEventListener('keydown', handleSelectionEscape);
        return () => window.removeEventListener('keydown', handleSelectionEscape);
    }, [isSelectionMode, isTanteoMode, tanteoVisible]);

    if (loading) {
        return (
            <div className="py-20 text-center">
                <div className="w-8 h-8 mx-auto border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" />
            </div>
        );
    }

    if (tree.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-dashed border-zinc-200 p-12 text-center">
                <h3 className="text-lg font-black uppercase tracking-tight mb-2 text-zinc-400">Árbol EDT Vacío</h3>
                <p className="text-sm text-zinc-500">Este proyecto aún no tiene configurada una Estructura de Desglose de Trabajo (EDT). Debes crear Cuentas y Paquetes en el módulo de Planificación antes de presupuestar.</p>
            </div>
        );
    }

    const simulatedLineTotal = sumBudgetOperationalSubtotals(apuLineas, { moneyDecimals, tanteoSession });
    const indirectosFactor = sumDecimalNumber([1, divideDecimalNumber(config.indirectos_porcentaje || 0, 100, { decimals: 6 })], { decimals: 6 });
    const simulatedSubtotal = roundCascade(
        indirectosFactor > 0 ? divideDecimalNumber(simulatedLineTotal, indirectosFactor, { decimals: moneyDecimals }) : simulatedLineTotal,
        moneyDecimals
    );
    const simulatedIndirectos = roundCascade(sumDecimalNumber([simulatedLineTotal, -simulatedSubtotal], { decimals: moneyDecimals }), moneyDecimals);
    const referentialComparableTotal = roundCascade(simulatedLineTotal, moneyDecimals);
    const simulatedIva = roundCascade(
        referentialComparableTotal * divideDecimalNumber(config.iva_aplicado || 0, 100, { decimals: 6 }),
        moneyDecimals
    );
    const totalPresupuesto = roundCascade(sumDecimalNumber([referentialComparableTotal, simulatedIva], { decimals: moneyDecimals }), moneyDecimals);
    const totalLineasApus = apuLineas.length;
    const apusDiferentes = new Set(apuLineas.map((linea) => linea.apu_id).filter(Boolean)).size;
    const objetivoProyecto = toDecimalNumber(activeProyecto?.presupuesto_estimado || 0, '0');
    const deltaProyecto = roundCascade(sumDecimalNumber([referentialComparableTotal, -objetivoProyecto], { decimals: moneyDecimals }), moneyDecimals);
    const deltaTolerance = 0.01;
    const deltaStatus = Math.abs(deltaProyecto) < deltaTolerance
        ? {
            label: 'Igualado',
            accent: 'default',
            meta: `${formatMoneda(objetivoProyecto)} objetivo`,
            metaTone: 'text-blue-600'
        }
        : deltaProyecto < 0
            ? {
                label: `Debajo ${formatDelta(deltaProyecto, formatMoneda)}`,
                accent: 'info',
                meta: `${formatMoneda(objetivoProyecto)} objetivo`,
                metaTone: 'text-emerald-600'
            }
            : {
                label: `Sobre ${formatDelta(deltaProyecto, formatMoneda)}`,
                accent: 'danger',
                meta: `${formatMoneda(objetivoProyecto)} objetivo`,
                metaTone: 'text-red-600'
            };

    const handleAddLinea = (edtId) => {
        setSelectedNodeId(edtId);
    };

    const handleDeleteLinea = async (lineaId) => {
        const confirmed = await appConfirm({
            title: 'Eliminar línea',
            message: '¿Seguro que deseas eliminar esta línea del presupuesto?',
            confirmLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            tone: 'danger'
        });
        if (!confirmed) return;
        try {
            await deleteApuFromBudget(lineaId);
        } catch (error) {
            globalThis.reportClientError?.(error);
        }
    };

    const handleSelectLineRange = (lineIds, primaryLineId, anchorLineId, scopeEdtId = null) => {
        setSelectedLineIds(new Set((lineIds || []).map((id) => Number(id)).filter((id) => Number.isFinite(id))));
        setSelectedLineId(primaryLineId ?? null);
        setSelectionAnchorId(anchorLineId ?? primaryLineId ?? null);
        setSelectionScopeEdtId(scopeEdtId ?? null);
    };

    const clearGroupedSelection = () => {
        setSelectedLineIds(new Set());
        setSelectionAnchorId(null);
        setSelectionScopeEdtId(null);
    };

    const resetTanteoWorkbench = () => {
        setIsTanteoMode(false);
        setTanteoVisible && setTanteoVisible(false);
    };

    const resetSelectionWorkbench = () => {
        clearGroupedSelection();
        setIsSelectionMode(false);
    };

    const resetBudgetWorkbenchModes = () => {
        clearGroupedSelection();
        setIsSelectionMode(false);
        setIsTanteoMode(false);
        setTanteoVisible && setTanteoVisible(false);
    };

    const handleToggleSelectionMode = () => {
        const nextValue = !isSelectionMode;
        setIsSelectionMode(nextValue);
        if (nextValue) {
            resetTanteoWorkbench();
        }
    };

    const handleSelectionModeRequest = (nextValue = true) => {
        const resolvedValue = Boolean(nextValue);
        setIsSelectionMode(resolvedValue);
        if (resolvedValue) {
            resetTanteoWorkbench();
        }
    };

    const handleToggleTanteoMode = () => {
        if (tanteoVisible || isTanteoMode) {
            resetTanteoWorkbench();
            return;
        }
        if (!isTanteoMode) {
            clearGroupedSelection();
            setIsSelectionMode(false);
            setIsTanteoMode(true);
            setTanteoVisible && setTanteoVisible(true);
        }
    };

    const handleTanteoModeRequest = (nextValue = true) => {
        const resolvedValue = Boolean(nextValue);
        setIsTanteoMode(resolvedValue);
        if (resolvedValue) {
            clearGroupedSelection();
            setIsSelectionMode(false);
            setTanteoVisible && setTanteoVisible(true);
        } else {
            setTanteoVisible && setTanteoVisible(false);
        }
    };

    const handleSelectNode = (nodeId) => {
        setSelectedNodeId(nodeId);
        setSelectedLineId(null);
        clearGroupedSelection();
        if (isSelectionMode) {
            setIsSelectionMode(false);
        }
    };

    const handleMoveApu = async (lineaId, moveData) => {
        try {
            setTanteoVisible && setTanteoVisible(false);
            if (Array.isArray(lineaId)) {
                const uniqueLineIds = Array.from(new Set(lineaId.map((id) => Number(id)).filter((id) => Number.isFinite(id))));
                if (uniqueLineIds.length === 0) return;
                const confirmed = await appConfirm({
                    title: 'Mover líneas seleccionadas',
                    message: `Vas a mover ${uniqueLineIds.length} líneas del presupuesto al nodo EDT destino. Las reglas de fusión se mantendrán por cada línea. ¿Deseas continuar?`,
                    confirmLabel: 'Mover grupo',
                    cancelLabel: 'Cancelar',
                    tone: 'warning'
                });
                if (!confirmed) {
                    resetSelectionWorkbench();
                    return;
                }

                let mergedCount = 0;
                for (const lineId of uniqueLineIds) {
                    const result = await moveApuInBudget(lineId, { edt_id: moveData.edt_id });
                    if (result?.merged) mergedCount += 1;
                }
                setBudgetMoveNotice(
                    mergedCount > 0
                        ? `Se movieron ${uniqueLineIds.length} líneas. ${mergedCount} se integraron en líneas ya existentes del EDT destino.`
                        : `Se movieron ${uniqueLineIds.length} líneas al EDT destino.`
                );
                resetSelectionWorkbench();
                return;
            }
            const result = await moveApuInBudget(lineaId, moveData);
            if (result?.merged) {
                const mergeInfo = result.merge_info;
                if (mergeInfo) {
                    const codigo = mergeInfo.apu_codigo || 'APU';
                    const descripcion = mergeInfo.descripcion || 'Item sin descripción';
                    const unidad = mergeInfo.unidad || 'UND';
                    const cantidadInicial = formatNumericDisplay(mergeInfo.cantidad_inicial, quantityDecimals);
                    const cantidadMovida = formatNumericDisplay(mergeInfo.cantidad_movida, quantityDecimals);
                    const cantidadTotal = formatNumericDisplay(mergeInfo.cantidad_total, quantityDecimals);
                    setBudgetMoveNotice(`Se sumó la línea existente en el EDT destino: ${codigo} - ${descripcion} - ${unidad}: ${cantidadInicial} + ${cantidadMovida} = ${cantidadTotal}`);
                } else {
                    setBudgetMoveNotice(result.message || 'Se sumaron las cantidades porque el item ya existía en el EDT destino.');
                }
            }
        } catch (error) {
            globalThis.reportClientError?.("Error moviendo rubro:", error);
        }
    };

    const handleUpdateLinea = async (lineaId, updateData) => {
        try {
            await updateApuInBudget(lineaId, updateData);
        } catch (error) {
            globalThis.reportClientError?.("Error actualizando linea:", error);
        }
    };

    const handleToggleNodeExpanded = (nodeId) => {
        setExpandedNodeIds((prev) => {
            const next = new Set(prev);
            if (next.has(Number(nodeId))) next.delete(Number(nodeId));
            else next.add(Number(nodeId));
            return next;
        });
    };

    const handleNodeDragOver = (e, nodeId) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        setDragOverNodeId(Number(nodeId));
    };

    const handleNodeDragLeave = (nodeId) => {
        setDragOverNodeId((current) => (current === Number(nodeId) ? null : current));
    };

    const handleNodeDrop = (e, nodeId) => {
        e.preventDefault();
        setDragOverNodeId(null);
        const lineaId = parseInt(e.dataTransfer.getData('lineaId'), 10);
        if (lineaId) {
            const rawLineIds = e.dataTransfer.getData('lineaIds');
            let lineIds = [];
            try {
                lineIds = JSON.parse(rawLineIds || '[]');
            } catch {
                lineIds = [];
            }
            if (Array.isArray(lineIds) && lineIds.length > 1) {
                handleMoveApu(lineIds, { edt_id: nodeId });
                return;
            }
            handleMoveApu(Number(lineaId), { edt_id: nodeId });
        }
    };

    const handleDragStart = (e, lineaId) => {
        const sortedSelectedIds = Array.from(selectedLineIds || []).sort(
            (a, b) => flattenedOperationalLineIds.indexOf(Number(a)) - flattenedOperationalLineIds.indexOf(Number(b))
        );
        const draggedLineIds = sortedSelectedIds.includes(Number(lineaId)) && sortedSelectedIds.length > 1
            ? sortedSelectedIds
            : [Number(lineaId)];
        e.dataTransfer.setData('lineaId', String(lineaId));
        e.dataTransfer.setData('lineaIds', JSON.stringify(draggedLineIds));
        e.dataTransfer.setData('text/plain', String(lineaId));
        e.dataTransfer.effectAllowed = 'move';
        setTanteoVisible && setTanteoVisible(false);
        setActiveDragLineId(Number(lineaId));
    };

    const handleLineDragOver = (e, targetLineId) => {
        e.preventDefault();
        e.stopPropagation();
        const sourceId = parseInt(e.dataTransfer.getData('lineaId'), 10);
        if (!Number.isFinite(sourceId) || sourceId === Number(targetLineId)) return;
        e.dataTransfer.dropEffect = 'move';
        setDragOverLineId(Number(targetLineId));
    };

    const handleLineDragLeave = (targetLineId) => {
        setDragOverLineId((current) => (current === Number(targetLineId) ? null : current));
    };

    const handleLineDrop = (e, targetLine) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverLineId(null);
        const sourceId = parseInt(e.dataTransfer.getData('lineaId'), 10);
        if (!Number.isFinite(sourceId) || sourceId === Number(targetLine.id)) return;
        const rawLineIds = e.dataTransfer.getData('lineaIds');
        let lineIds = [];
        try {
            lineIds = JSON.parse(rawLineIds || '[]');
        } catch {
            lineIds = [];
        }
        if (Array.isArray(lineIds) && lineIds.length > 1) {
            const filtered = lineIds.filter((id) => Number(id) !== Number(targetLine.id));
            if (filtered.length > 1) {
                handleMoveApu(filtered, { edt_id: targetLine.edt_id });
                return;
            }
            if (filtered.length === 1) {
                handleMoveApu(filtered[0], { edt_id: targetLine.edt_id, after_linea_id: targetLine.id });
                return;
            }
        }
        handleMoveApu(sourceId, { edt_id: targetLine.edt_id, after_linea_id: targetLine.id });
    };

    const handleLineSelection = (event, linea) => {
        event.stopPropagation();
        const lineId = Number(linea.id);
        const lineEdtId = Number(linea.edt_id);
        const clickedSelectionZone = event.target instanceof Element && Boolean(event.target.closest('[data-budget-selection-zone="true"]'));
        const wantsSelectionMode = event.ctrlKey || event.metaKey;
        const wantsSelectionRange = event.shiftKey && isSelectionMode && clickedSelectionZone;
        const wantsTanteoLaunch = (event.shiftKey && !wantsSelectionRange) || isTanteoMode;

        if (wantsSelectionMode && !isSelectionMode) handleSelectionModeRequest(true);
        if (wantsSelectionMode) {
            setTanteoVisible && setTanteoVisible(false);
            handleTanteoModeRequest(false);
        }
        if (wantsTanteoLaunch && isSelectionMode) {
            handleSelectionModeRequest(false);
        }

        const isSameScope = Number(selectionScopeEdtId) === lineEdtId;
        const multiSelectionEnabled = isSelectionMode || wantsSelectionMode;
        let shouldOpenTanteo = true;

        if (multiSelectionEnabled) {
            const nextSelection = isSameScope ? new Set(selectedLineIds || []) : new Set();
            const isModifierToggle = event.ctrlKey || event.metaKey;

            if (wantsSelectionRange) {
                const visibleIds = flattenedLineIdsByEdt.get(lineEdtId) || [];
                const effectiveAnchorId =
                    isSameScope && selectionAnchorId != null && visibleIds.includes(Number(selectionAnchorId))
                        ? Number(selectionAnchorId)
                        : lineId;
                const anchorIndex = visibleIds.indexOf(effectiveAnchorId);
                const targetIndex = visibleIds.indexOf(lineId);
                if (anchorIndex !== -1 && targetIndex !== -1) {
                    const [startIndex, endIndex] = anchorIndex <= targetIndex ? [anchorIndex, targetIndex] : [targetIndex, anchorIndex];
                    const nextIds = visibleIds.slice(startIndex, endIndex + 1);
                    handleSelectLineRange(nextIds, lineId, effectiveAnchorId, lineEdtId);
                    shouldOpenTanteo = false;
                    return;
                }
            } else if (isModifierToggle) {
                if (nextSelection.has(lineId)) nextSelection.delete(lineId);
                else nextSelection.add(lineId);
            } else {
                nextSelection.clear();
                nextSelection.add(lineId);
            }
            const nextIds = Array.from(nextSelection);
            handleSelectLineRange(nextIds, nextIds.length > 0 ? lineId : null, nextIds.length > 0 ? lineId : null, nextIds.length > 0 ? lineEdtId : null);
            shouldOpenTanteo = nextIds.length > 0;
        } else {
            setSelectedLineId(lineId);
        }

        if (wantsTanteoLaunch && shouldOpenTanteo && !isDesyncedBudgetLine(linea)) {
            setTanteoVisible && setTanteoVisible(true);
        }
    };

    const visibleRows = flattenedRows.slice(0, renderedRowCount);

    return (
        <div className="relative bg-white rounded-[1.25rem] border border-[#e2ded6] overflow-hidden shadow-[6px_6px_16px_#e2e2de,-6px_-6px_16px_#ffffff] flex flex-col h-full">
            {budgetMoveNotice && (
                <div className="fixed top-20 right-6 z-[160] max-w-xl rounded-2xl border border-amber-200 bg-amber-50/98 px-4 py-3 shadow-2xl backdrop-blur">
                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Aviso operativo</div>
                    <div className="mt-1 text-sm font-semibold text-amber-900">{budgetMoveNotice}</div>
                </div>
            )}
            <div className="shrink-0 bg-[#111318] px-5 pt-3 pb-0">
                <div className="flex h-[84px] min-w-0 flex-wrap items-center justify-between gap-2.5">
                    <ControlRail className="h-[60px] min-w-[320px] max-w-[560px] flex-[0.84_1_18rem] px-2 py-1.5">
                        <ControlRailSection className="h-full min-w-0 flex-1 gap-2 pl-2 pr-1.5">
                            <div className="min-w-0 flex-1">
                            <ClearSearchField
                                value={budgetSearchQuery}
                                onValueChange={setBudgetSearchQuery}
                                placeholder="Buscar línea o EDT..."
                                    containerClassName="min-w-0 flex-1 rounded-[0.9rem] border border-white/16 bg-white shadow-[inset_2px_2px_6px_rgba(15,23,42,0.12),inset_-2px_-2px_6px_rgba(255,255,255,0.75)]"
                                    inputClassName="w-full bg-transparent py-1.5 pl-9 pr-8 text-[11px] font-bold text-zinc-800 outline-none placeholder:text-zinc-400"
                                    searchIconClassName="h-3 w-3 text-zinc-500 group-focus-within:text-[#F39200]"
                                    clearButtonClassName="text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        if (budgetSearchMatches.length > 0) {
                                            navigateBudgetSearchMatch(activeBudgetSearchIndex + 1);
                                        }
                                    }
                                }}
                            />
                            </div>
                            <ControlRailDivider className="h-7" />
                            <button
                                type="button"
                                onClick={() => navigateBudgetSearchMatch(activeBudgetSearchIndex + 1)}
                                disabled={budgetSearchMatches.length === 0}
                                className={`inline-flex flex-none items-center justify-center gap-1 rounded-[0.8rem] border border-white/8 bg-[#15181d] px-2 text-[8px] font-black uppercase tracking-[0.12em] text-white/78 shadow-[2px_2px_6px_rgba(0,0,0,0.28),-1px_-1px_5px_rgba(255,255,255,0.04)] transition hover:border-white/14 hover:bg-[#1b1f25] hover:text-white active:translate-y-[1px] active:scale-[0.96] active:shadow-[inset_4px_4px_9px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.06)] disabled:pointer-events-none disabled:opacity-35 ${isBudgetCompact ? 'h-11' : 'h-8'}`}
                                title="Buscar siguiente coincidencia"
                            >
                                <ArrowDown className="h-3 w-3" />
                                Sgte
                            </button>
                            <span className="min-w-[30px] flex-none text-right text-[8px] font-black uppercase tracking-[0.12em] text-white/54">
                                {budgetSearchMatches.length > 0 ? `${activeBudgetSearchIndex + 1}/${budgetSearchMatches.length}` : '0/0'}
                            </span>
                        </ControlRailSection>
                    </ControlRail>

                    <ControlRail className="h-[60px] flex-none px-2 py-1.5">
                        <ControlRailSection className="h-full gap-2 px-2">
                        {isSelectionMode && selectedLineIds.size > 0 && (
                                <ControlRailIconButton
                                onClick={clearGroupedSelection}
                                    className={isBudgetCompact ? 'h-11 w-11' : ''}
                                    tooltip="Limpiar selección"
                                    aria-label="Limpiar selección"
                            >
                                    <X className="h-3.5 w-3.5" />
                                </ControlRailIconButton>
                        )}
                            <ControlRailIconButton
                                onClick={handleToggleSelectionMode}
                                    className={isBudgetCompact ? 'h-11 w-11' : ''}
                                    active={isSelectionMode}
                                tooltip={isSelectionMode ? `Seleccionar: modo activo${selectedLineIds.size > 0 ? ` · ${selectedLineIds.size} línea${selectedLineIds.size === 1 ? '' : 's'}` : ''}.` : "Seleccionar: Ctrl/Cmd + clic sobre una línea para seleccionar en grupo."}
                                    aria-label={isSelectionMode ? 'Salir de selección' : 'Seleccionar líneas'}
                            >
                                    <Check className="h-3.5 w-3.5" />
                            </ControlRailIconButton>
                            <ControlRailIconButton
                                onClick={handleToggleTanteoMode}
                                    className={isBudgetCompact ? 'h-11 w-11' : ''}
                                    active={isTanteoMode || tanteoVisible}
                                tooltip={(isTanteoMode || tanteoVisible) ? 'Tanteo: modo activo.' : "Tanteo: Shift + clic sobre una línea para abrir tanteo. O activa este modo para abrir tanteo con clic simple."}
                                    aria-label={(isTanteoMode || tanteoVisible) ? 'Salir de tanteo' : 'Abrir tanteo'}
                            >
                                    <FlaskConical className="h-3.5 w-3.5" />
                            </ControlRailIconButton>
                        </ControlRailSection>
                    </ControlRail>
                </div>
            </div>
            {/* Table Header */}
            <div className="h-[56px] shrink-0 overflow-hidden bg-[#111318] pr-7 text-white">
                <div ref={budgetHeaderScrollRef} data-budget-header-scroll="true" className="h-full overflow-hidden">
                    <div className="flex h-full items-center gap-3 border-b border-[#272b33] pl-0 pr-3" style={{ minWidth: `${BUDGET_ROW_MIN_WIDTH}px` }}>
                        <div className={`${isSelectionMode ? 'w-12' : 'w-6'} ml-1 shrink-0`} />
                        <div className={`${BUDGET_COLUMN_WIDTH.item} shrink-0 text-center text-[10px] font-black uppercase tracking-widest text-zinc-400`}>ITEM</div>
                        <div className={`${BUDGET_COLUMN_WIDTH.edt} shrink-0 text-[10px] font-black uppercase tracking-widest text-zinc-400`}>CÓD. EDT</div>
                        <div className="flex-1 min-w-0 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                            DESCRIPCIÓN DE LA ESTRUCTURA / PARTIDAS
                        </div>
                        <div className="flex items-center gap-2.5 shrink-0">
                            <div className={`${BUDGET_COLUMN_WIDTH.unit} text-center text-[10px] font-black uppercase tracking-widest text-zinc-400`}>UNIDAD</div>
                            <div className={`${BUDGET_COLUMN_WIDTH.quantity} text-right text-[10px] font-black uppercase tracking-widest text-zinc-400`}>CANTIDAD</div>
                            <div className={`${BUDGET_COLUMN_WIDTH.unitPrice} text-right text-[10px] font-black uppercase tracking-widest text-zinc-400`} title="Precio unitario funcional con indirectos aplicados">
                                P. UNITARIO
                            </div>
                            <div className={`${BUDGET_COLUMN_WIDTH.subtotal} text-right text-[10px] font-black uppercase tracking-widest text-zinc-400`}>SUBTOTAL</div>
                            <div className={`${BUDGET_COLUMN_WIDTH.actions} text-right text-[10px] font-black uppercase tracking-widest text-zinc-400`}>ACCIONES</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tree Content */}
            <div className="relative flex-1 min-h-0">
                <div
                    ref={budgetViewportRef}
                    data-budget-scroll-parent="true"
                    className="giproy-motion-scrollbar-hide h-full min-h-0 overflow-auto overscroll-contain pr-7"
                    style={{ touchAction: 'pan-x pan-y' }}
                >
                    <div style={{ minWidth: `${BUDGET_ROW_MIN_WIDTH}px` }}>
                        {visibleRows.map((row) => {
                            if (row.type === 'node') {
                                return (
                                    <MemoBudgetChapterRow
                                        key={row.key}
                                        rowKey={row.key}
                                        node={row.node}
                                        level={row.level}
                                        itemVisible={row.itemVisible}
                                        edtCodeVisible={row.edtCodeVisible}
                                        isExpanded={expandedNodeIds.has(Number(row.node.id))}
                                        isSelected={selectedNodeId === row.node.id}
                                        isDragOver={dragOverNodeId === Number(row.node.id)}
                                        chapterSubtotal={chapterSubtotalByNodeId.get(Number(row.node.id)) || 0}
                                        onToggle={(e) => {
                                            e.stopPropagation();
                                            handleToggleNodeExpanded(row.node.id);
                                        }}
                                        onSelectNode={handleSelectNode}
                                        onDragOver={(e) => handleNodeDragOver(e, row.node.id)}
                                        onDragLeave={() => handleNodeDragLeave(row.node.id)}
                                        onDrop={(e) => handleNodeDrop(e, row.node.id)}
                                        formatMoneda={formatMoneda}
                                        onMeasureRow={registerRowHeight}
                                    />
                                );
                            }

                            const lineNoteMeta = notesSummary?.lineas?.[row.linea.id] || { total: 0, nuevas: 0 };
                            const lineSubtotal = resolveBudgetLineOperationalSubtotal(row.linea, { moneyDecimals, tanteoSession });
                            const isGroupedSelected = isSelectionMode && selectedLineIds?.has?.(row.linea.id);
                            return (
                                <MemoBudgetLineRow
                                    key={row.key}
                                    rowKey={row.key}
                                    linea={row.linea}
                                    level={row.level}
                                    itemVisible={row.itemVisible}
                                    lineNoteMeta={lineNoteMeta}
                                    lineSubtotal={lineSubtotal}
                                    isSelectionMode={isSelectionMode}
                                    isGroupedSelected={isGroupedSelected}
                                    isSelected={selectedLineId === row.linea.id}
                                    isDragOver={dragOverLineId === row.linea.id}
                                    tanteoSession={tanteoSession}
                                    edtCodeVisible={row.edtCodeVisible}
                                    useOmniClass={useOmniClass}
                                    isBudgetCompact={isBudgetCompact}
                                    getQuantityDisplayValue={getQuantityDisplayValue}
                                    formatNumericDisplay={formatNumericDisplay}
                                    quantityDecimals={quantityDecimals}
                                    formatMoneda={formatMoneda}
                                    parseNumericInput={parseNumericInput}
                                    handleLineSelection={handleLineSelection}
                                    handleQuantityFocus={handleQuantityFocus}
                                    handleQuantityKeyDown={handleQuantityKeyDown}
                                    handleQuantityBlur={handleQuantityBlur}
                                    onQuantityDraftChange={handleQuantityDraftChange}
                                    onEditApu={onEditApu}
                                    onOpenLineNotes={onOpenLineNotes}
                                    onDeleteLinea={handleDeleteLinea}
                                    onEquipoLockLine={onEquipoLockLine}
                                    onEquipoProposalLine={onEquipoProposalLine}
                                    handleDragStart={handleDragStart}
                                    handleLineDragOver={handleLineDragOver}
                                    handleLineDragLeave={handleLineDragLeave}
                                    handleLineDrop={handleLineDrop}
                                    onMeasureRow={registerRowHeight}
                                />
                            );
                        })}
                    </div>
                </div>
                <MotionScrollbar targetRef={budgetViewportRef} className="right-2" />
            </div>

            {/* Bottom Totals Footer */}
            <div className="shrink-0 border-t border-[#d8d3ca] bg-[#efefeb]/92 px-3 py-2 backdrop-blur-sm">
                <div className="grid items-stretch gap-2 pb-1 md:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7">
                    <BudgetFooterMetric
                        label="APUS"
                        value={String(totalLineasApus)}
                        valueSuffix="en presupuesto"
                        meta={desyncedLineas.length > 0 ? `${desyncedLineas.length} desincronizadas · ${apusDiferentes} diferentes` : `${apusDiferentes} diferentes`}
                        accent={desyncedLineas.length > 0 ? 'warning' : 'default'}
                        icon={Boxes}
                    />
                    <BudgetFooterMetric
                        label="Objetivo Referencial"
                        value={formatMoney(objetivoProyecto)}
                        meta={deltaStatus.label}
                        accent={deltaStatus.accent}
                        metaTone={deltaStatus.metaTone}
                        icon={Target}
                    />
                    <BudgetFooterMetric
                        label="Costo directo"
                        value={formatMoney(simulatedSubtotal)}
                        meta={Object.keys(tanteoSession).length > 0 ? 'Con tanteo activo' : ''}
                        accent={Object.keys(tanteoSession).length > 0 ? 'info' : 'default'}
                        icon={Calculator}
                    />
                    <BudgetFooterMetric
                        label={`Indirectos (${Number(config.indirectos_porcentaje || 0).toFixed(2)}%)`}
                        value={formatMoney(simulatedIndirectos)}
                        meta={indirectosStatus.label}
                        accent={indirectosStatus.key === 'rojo' ? 'danger' : indirectosStatus.key === 'ambar' ? 'warning' : 'indirectos'}
                    />
                    <BudgetFooterMetric
                        label="Operativo sin IVA"
                        value={formatMoney(referentialComparableTotal)}
                        meta="Costo directo + indirectos"
                        accent="info"
                        icon={Target}
                    />
                    <BudgetFooterMetric
                        label={`IVA (${Number(config.iva_aplicado || 0).toFixed(2)}%)`}
                        value={formatMoney(simulatedIva)}
                        meta="Carga fiscal aplicada"
                        accent="default"
                    />
                    <BudgetFooterMetric
                        label="Total con IVA"
                        value={formatMoney(totalPresupuesto)}
                        meta="Resultado operativo"
                        accent="total"
                        icon={Target}
                    />
                </div>
            </div>
        </div>
    );
};

export default LineasPresupuestoTab;
