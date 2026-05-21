import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronRight, ChevronUp, Ellipsis, Folders, Minus, Network, Pencil, Plus, Search, Trash2, UserCog, X } from 'lucide-react';
import { formatEdtCurrency, formatEdtPercent } from '../../utils/edtValuation';
import { normalizeSearchToken } from '../../utils/normalizeSearch';
import { normalizePersonName } from '../../utils/descriptionCapitalization';
import ClearSearchField from '../ui/ClearSearchField';
import MotionScrollbar from '../ui/MotionScrollbar';
import AppHint from '../ui/AppHint';
import {
    DARK_RAIL_CONTROL_BUTTON_CLASS,
    DARK_RAIL_ICON_BUTTON_CLASS,
    DARK_RAIL_METRIC_CHIP_CLASS,
    DARK_RAIL_METRIC_DOT_CLASS,
    DARK_RAIL_METRIC_VALUE_CLASS,
    DARK_RAIL_TEXT_BUTTON_CLASS,
} from '../ui/darkRailControls';

const clampZoom = (value) => Math.max(0.1, Math.min(1.35, value));

const countDescendants = (nodes = []) => nodes.reduce((acc, node) => acc + 1 + countDescendants(node.hijos || []), 0);
const getStakeholderDisplayName = (node) => normalizePersonName(`${node?.stakeholder?.nombre || ''} ${node?.stakeholder?.apellidos || ''}`);
const isStructuralNode = (node, moduleType) => (
    moduleType === 'edt'
        ? node?.tipo_nodo === 'CUENTA_PAQUETE'
        : node?.tipo_nodo === 'HITO'
);

const collectIdsRecursively = (nodes = [], bucket = []) => {
    nodes.forEach((node) => {
        bucket.push(node.id);
        collectIdsRecursively(node.hijos || [], bucket);
    });
    return bucket;
};

const findNodePath = (nodes = [], nodeId, trail = []) => {
    for (const node of nodes) {
        const nextTrail = [...trail, node];
        if (node.id === nodeId) return nextTrail;
        const nested = findNodePath(node.hijos || [], nodeId, nextTrail);
        if (nested.length) return nested;
    }
    return [];
};

const countDirectChildren = (node) => (node.hijos || []).length;

const cloneTreeWithFilter = (nodes = [], predicate) => (
    nodes.reduce((acc, node) => {
        const filteredChildren = cloneTreeWithFilter(node.hijos || [], predicate);
        if (predicate(node) || filteredChildren.length > 0) {
            acc.push({
                ...node,
                hijos: filteredChildren,
            });
        }
        return acc;
    }, [])
);

const projectGraphTree = (nodes = [], moduleType) => (
    nodes
        .filter((node) => isStructuralNode(node, moduleType))
        .map((node) => {
            const structuralChildren = (node.hijos || []).filter((child) => isStructuralNode(child, moduleType));
            const embeddedStakeholders = (node.hijos || []).filter((child) => !isStructuralNode(child, moduleType));
            return {
                ...node,
                embeddedStakeholders,
                hijos: projectGraphTree(structuralChildren, moduleType),
            };
        })
);

const flattenTree = (nodes = [], bucket = []) => {
    nodes.forEach((node) => {
        bucket.push(node);
        flattenTree(node.hijos || [], bucket);
    });
    return bucket;
};

const normalizeSearch = (value) => normalizeSearchToken(value);
const INTERACTIVE_GRAPH_SELECTOR = 'button, input, textarea, select, a, [role="button"], [data-graph-interactive="true"], [data-graph-card="true"]';
const resolveDropZone = (event) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const offsetX = event.clientX - rect.left;
    const offsetY = event.clientY - rect.top;
    const width = rect.width || 1;
    const height = rect.height || 1;
    const verticalRatio = offsetY / height;
    const horizontalRatio = offsetX / width;

    if (verticalRatio <= 0.25) return 'none';
    if (verticalRatio >= 0.72) return 'inside';
    if (horizontalRatio <= 0.5) return 'before';
    return 'after';
};

const nodeMatchesSearch = (node, moduleType, query) => {
    const presentation = getNodePresentation(node, moduleType);
    const embeddedValues = (node.embeddedStakeholders || []).flatMap((stakeholder) => [
        stakeholder.codigo,
        getStakeholderDisplayName(stakeholder),
        stakeholder.rol?.nombre,
        stakeholder.actividades_claves,
        stakeholder.stakeholder?.nombre,
        stakeholder.stakeholder?.apellidos,
    ]);

    return [
        node.codigo,
        node.nombre,
        presentation.title,
        presentation.subtitle,
        ...embeddedValues,
    ].some((value) => normalizeSearch(value).includes(query));
};

const getNodePresentation = (node, moduleType) => {
    if (moduleType === 'edt') {
        const title = node.nombre;
        const subtitle = node.definicion || `${countDescendants(node.hijos || [])} elementos vinculados`;
        return {
            title: title || 'Nodo EDT',
            subtitle,
            tone: 'orange',
            icon: Folders,
            badge: 'Cuenta',
        };
    }

    const title = node.nombre;
    const subtitle = '';
    return {
        title: title || 'Nodo EDO',
        subtitle,
        tone: 'orange',
        icon: Network,
        badge: 'Hito',
    };
};

const toneClassMap = {
    orange: {
        card: 'border-[#ececec] bg-[#f7f7f5] shadow-[10px_10px_26px_#dddddd,-10px_-10px_26px_#ffffff]',
        iconWrap: 'border-[#F39200]/24 bg-[#fffdfa] text-[#F39200]',
        code: 'text-[#F39200]',
        badge: 'border-[#F39200]/28 bg-white text-[#F39200]',
        title: 'text-[#1A1A1A]',
        subtitle: 'text-slate-500',
    },
    purple: {
        card: 'border-purple-200 bg-gradient-to-b from-purple-50 to-white shadow-[0_18px_45px_rgba(147,51,234,0.12)]',
        iconWrap: 'border-purple-200 bg-purple-100 text-purple-700',
        code: 'text-purple-700',
        badge: 'border-purple-200 bg-white text-purple-700',
        title: 'text-[#2a2140]',
        subtitle: 'text-slate-500',
    },
};

const graphNeumorphicButtonBase =
    'inline-flex items-center justify-center border border-[#ececec] bg-[#f3f3f1] text-zinc-500 shadow-[4px_4px_10px_#d6d6d1,-4px_-4px_10px_#ffffff] transition-[color,box-shadow,filter] duration-200 hover:brightness-[0.99] hover:text-zinc-700 active:shadow-[inset_2px_2px_8px_#d0d0d0,inset_-2px_-2px_8px_#ffffff]';

const GRAPH_CARD_HEADER_VISUAL = {
    orange: {
        iconWrap: 'flex h-9 w-9 items-center justify-center rounded-full border border-[#e7e8eb] bg-[linear-gradient(180deg,#fbfbfa_0%,#f1f1ee_100%)] text-zinc-500 shadow-[0_8px_16px_rgba(15,23,42,0.06),inset_1px_1px_2px_rgba(255,255,255,0.88)]',
        badge: 'inline-flex items-center justify-center rounded-full border border-[#e7e8eb] bg-[linear-gradient(180deg,#fbfbfa_0%,#f2f2ef_100%)] px-3 py-1 text-zinc-500 shadow-[0_8px_16px_rgba(15,23,42,0.05),inset_1px_1px_2px_rgba(255,255,255,0.88)]',
    },
    purple: {
        iconWrap: 'flex h-9 w-9 items-center justify-center rounded-full border border-[#e7e8eb] bg-[linear-gradient(180deg,#fbfbfa_0%,#f2f0f7_100%)] text-zinc-500 shadow-[0_8px_16px_rgba(15,23,42,0.06),inset_1px_1px_2px_rgba(255,255,255,0.88)]',
        badge: 'inline-flex items-center justify-center rounded-full border border-[#e7e8eb] bg-[linear-gradient(180deg,#fbfbfa_0%,#f2f0f7_100%)] px-3 py-1 text-zinc-500 shadow-[0_8px_16px_rgba(15,23,42,0.05),inset_1px_1px_2px_rgba(255,255,255,0.88)]',
    },
};

const GraphNodeCard = ({
    node,
    moduleType,
    compact,
    selected,
    onSelect,
    registerRef,
    isCollapsed,
    onToggleCollapse,
    isInActivePath,
    isSearchHit,
    totalValorado = 0,
    draggable = false,
    isDragTarget = false,
    dragTargetZone = null,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
    showActionTrigger = false,
    onOpenActions,
    registerActionTrigger,
    embeddedDisplayMode = 'full',
    selectedEmbeddedStakeholderId = null,
    onSelectEmbeddedStakeholder,
    registerEmbeddedRef,
}) => {
    const landingPillButtonClass = `${graphNeumorphicButtonBase} rounded-full`;
    const presentation = getNodePresentation(node, moduleType);
    const tone = toneClassMap[presentation.tone];
    const headerVisual = GRAPH_CARD_HEADER_VISUAL[presentation.tone] || GRAPH_CARD_HEADER_VISUAL.orange;
    const Icon = presentation.icon;
    const isCuenta = moduleType === 'edt' && node.tipo_nodo === 'CUENTA_PAQUETE';
    const hasChildren = (node.hijos || []).length > 0;
    const directChildren = countDirectChildren(node);
    const totalDescendants = countDescendants(node.hijos || []);
    const valuePercent = isCuenta && totalValorado > 0 ? ((node.metrics?.valorado || 0) / totalValorado) * 100 : 0;
    const embeddedStakeholders = node.embeddedStakeholders || [];
    const showEmbeddedStakeholders = embeddedDisplayMode !== 'hidden';
    const compactEmbeddedFocus = embeddedDisplayMode === 'focus';

    return (
        <div
            ref={(element) => registerRef?.(node.id, element)}
            data-graph-card="true"
            onClick={() => onSelect(node.id)}
            draggable={draggable}
            onDragStart={(event) => onDragStart?.(event, node)}
            onDragOver={(event) => onDragOver?.(event, node)}
            onDrop={(event) => onDrop?.(event, node)}
            onDragEnd={onDragEnd}
            className={[
                'group relative rounded-[1.3rem] border px-4 pt-3 text-left transition-all duration-200',
                showActionTrigger ? 'pb-12' : 'pb-3',
                compact ? 'w-[190px] min-h-[112px]' : 'w-[238px] min-h-[132px]',
                tone.card,
                isInActivePath ? 'shadow-[12px_12px_28px_#d9d9d5,-12px_-12px_28px_#ffffff]' : '',
                isSearchHit ? 'border-emerald-300 shadow-[0_18px_45px_rgba(16,185,129,0.16)]' : '',
                isDragTarget ? 'border-dashed border-[#F39200] ring-2 ring-[#F39200]/20' : '',
                dragTargetZone === 'before' ? 'shadow-[-10px_0_0_0_rgba(243,146,0,0.22)]' : '',
                dragTargetZone === 'after' ? 'shadow-[10px_0_0_0_rgba(243,146,0,0.22)]' : '',
                dragTargetZone === 'inside' ? 'shadow-[0_12px_0_0_rgba(243,146,0,0.22)]' : '',
                selected
                    ? 'scale-[1.01] shadow-[12px_12px_28px_#d8d8d4,-12px_-12px_28px_#ffffff]'
                    : 'hover:-translate-y-0.5 hover:shadow-[14px_14px_30px_#dbdbd7,-14px_-14px_30px_#ffffff]',
            ].join(' ')}
        >
            <div className="flex items-start justify-between gap-3">
                <div className={headerVisual.iconWrap}>
                    <Icon className="h-4 w-4" />
                </div>
                <div className="flex items-center gap-2">
                    {hasChildren && (
                        <span
                            role="button"
                            tabIndex={0}
                            onClick={(event) => {
                                event.stopPropagation();
                                onToggleCollapse?.(node.id);
                            }}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    event.stopPropagation();
                                    onToggleCollapse?.(node.id);
                                }
                            }}
                            className={`${landingPillButtonClass} h-8 w-8`}
                            title={isCollapsed ? 'Expandir rama' : 'Contraer rama'}
                        >
                            {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </span>
                    )}
                    <span className={`${headerVisual.badge} text-[10px] font-black uppercase tracking-[0.16em]`}>
                        {presentation.badge}
                    </span>
                </div>
            </div>
            <div className={`mt-3 flex items-start gap-3 ${compact ? 'min-h-[32px]' : 'min-h-[38px]'}`}>
                <div className={`shrink-0 text-[12px] font-black uppercase tracking-[0.18em] ${tone.code}`}>
                    {node.codigo || 'TBD'}
                </div>
                <div className={`min-w-0 flex-1 line-clamp-2 font-black leading-tight ${compact ? 'text-[13px]' : 'text-[15px]'} ${tone.title}`}>
                    {presentation.title}
                </div>
            </div>
            {!compactEmbeddedFocus && presentation.subtitle ? (
                <div className={`mt-2 line-clamp-3 leading-snug ${compact ? 'text-[10px]' : 'text-[11px]'} ${tone.subtitle}`}>
                    {presentation.subtitle}
                </div>
            ) : null}
            {showEmbeddedStakeholders && embeddedStakeholders.length > 0 && (
                <div className={`mt-3 space-y-2 ${compactEmbeddedFocus ? 'border-t border-orange-100 pt-3' : ''}`}>
                    {embeddedStakeholders.map((stakeholder) => {
                        const stakeholderName = getStakeholderDisplayName(stakeholder) || 'Responsable asignado';
                        const stakeholderRole = stakeholder.rol?.nombre || stakeholder.actividades_claves || 'Sin rol definido';
                        const isEmbeddedSelected = selectedEmbeddedStakeholderId === stakeholder.id;
                        return (
                            <button
                                key={stakeholder.id}
                                type="button"
                                ref={(element) => registerEmbeddedRef?.(node.id, stakeholder.id, element)}
                                onClick={(event) => {
                                    event.stopPropagation();
                                    onSelectEmbeddedStakeholder?.(node, stakeholder);
                                }}
                                className={[
                                    'flex w-full flex-col items-start rounded-2xl border px-3 py-2 text-left transition',
                                    isEmbeddedSelected
                                        ? 'border-amber-300 bg-amber-50 shadow-[0_10px_22px_rgba(245,158,11,0.12)]'
                                        : 'border-zinc-200 bg-white/90 hover:border-[#F39200]/24 hover:bg-[#fffdfa]',
                                ].join(' ')}
                                title="Acciones del responsable"
                            >
                                <span className="line-clamp-2 text-[11px] font-black tracking-[0.02em] text-[#16304a]">
                                    {stakeholderName}
                                </span>
                                <span className="mt-0.5 line-clamp-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                                    {stakeholderRole}
                                </span>
                            </button>
                        );
                    })}
                </div>
            )}
            {!compactEmbeddedFocus && isCuenta && node.metrics && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    <div className="rounded-full border border-[#F39200]/22 bg-[#fffdfa] px-2.5 py-1.5">
                        <div className="text-[7px] font-black uppercase leading-none tracking-[0.14em] text-[#F39200]">Val.</div>
                        <div className={`mt-0.5 font-black leading-none tracking-tight text-[#F39200] ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                            {formatEdtCurrency(node.metrics.valorado)}
                        </div>
                    </div>
                    <div className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1.5">
                        <div className="text-[7px] font-black uppercase leading-none tracking-[0.14em] text-amber-500">%</div>
                        <div className={`mt-0.5 font-black leading-none tracking-tight text-amber-700 ${compact ? 'text-[10px]' : 'text-[11px]'}`}>
                            {formatEdtPercent(valuePercent)}
                        </div>
                    </div>
                </div>
            )}
            {!compactEmbeddedFocus && (
                <div className="mt-3 flex flex-wrap gap-2">
                    {hasChildren && (
                        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
                            Hijos {directChildren}
                        </span>
                    )}
                    <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
                        Desc. {totalDescendants}
                    </span>
                    {embeddedStakeholders.length > 0 && (
                        <span className="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-purple-700">
                            Resp. {embeddedStakeholders.length}
                        </span>
                    )}
                </div>
            )}
                    {showActionTrigger && (
                <button
                    type="button"
                    ref={(element) => registerActionTrigger?.(node.id, element)}
                    onClick={(event) => {
                        event.stopPropagation();
                        onOpenActions?.(node.id);
                    }}
                    onMouseEnter={(event) => {
                        event.stopPropagation();
                        onOpenActions?.(node.id);
                    }}
                    data-graph-action-trigger="true"
                    className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full border border-[#dddfe3] bg-[linear-gradient(180deg,#fbfbfa_0%,#f1f1ee_100%)] text-[#B87712] shadow-[0_8px_18px_rgba(15,23,42,0.08),inset_1px_1px_2px_rgba(255,255,255,0.88)] transition hover:brightness-[0.99] active:shadow-[inset_2px_2px_8px_#d0d0d0,inset_-2px_-2px_8px_#ffffff]"
                    title="Abrir acciones"
                >
                    <Ellipsis className="h-4 w-4" />
                </button>
            )}
        </div>
    );
};

const HierarchyBranch = ({
    node,
    moduleType,
    compact,
    selectedIds,
    onSelect,
    registerRef,
    collapsedIds,
    onToggleCollapse,
    activePathIds,
    searchHitIds,
    totalValorado = 0,
    draggableNodeIds,
    dragTargetId,
    dragTargetZone,
    onDragStartNode,
    onDragOverNode,
    onDropOnNode,
    onDragEndNode,
    onOpenActions,
    registerActionTrigger,
    embeddedDisplayMode,
    selectedGraphNodeId,
    selectedEmbeddedStakeholderId,
    selectedEmbeddedStakeholderParentId,
    onSelectEmbeddedStakeholder,
    registerEmbeddedRef,
}) => {
    const children = node.hijos || [];
    const isCollapsed = collapsedIds.has(node.id);
    return (
        <div className="flex min-w-max flex-col items-center">
            <GraphNodeCard
                node={node}
                moduleType={moduleType}
                compact={compact}
                selected={selectedGraphNodeId === node.id}
                onSelect={onSelect}
                registerRef={registerRef}
                isCollapsed={isCollapsed}
                onToggleCollapse={onToggleCollapse}
                isInActivePath={activePathIds.has(node.id)}
                isSearchHit={searchHitIds.has(node.id)}
                totalValorado={totalValorado}
                draggable={draggableNodeIds?.has(node.id)}
                isDragTarget={dragTargetId === node.id}
                dragTargetZone={dragTargetId === node.id ? dragTargetZone : null}
                onDragStart={onDragStartNode}
                onDragOver={onDragOverNode}
                onDrop={onDropOnNode}
                onDragEnd={onDragEndNode}
                showActionTrigger={selectedGraphNodeId === node.id && selectedEmbeddedStakeholderParentId !== node.id}
                onOpenActions={onOpenActions}
                registerActionTrigger={registerActionTrigger}
                embeddedDisplayMode={embeddedDisplayMode}
                selectedEmbeddedStakeholderId={selectedEmbeddedStakeholderParentId === node.id ? selectedEmbeddedStakeholderId : null}
                onSelectEmbeddedStakeholder={onSelectEmbeddedStakeholder}
                registerEmbeddedRef={registerEmbeddedRef}
            />

            {children.length > 0 && !isCollapsed && (
                <>
                    <div className="h-6 w-px bg-slate-300" />
                    <div className="relative flex min-w-max items-start justify-center">
                        {children.map((child, index) => (
                            <div key={child.id} className={`relative flex flex-col items-center ${compact ? 'px-2 pt-5' : 'px-3 pt-6'}`}>
                                {children.length > 1 && index !== 0 && (
                                    <div className="pointer-events-none absolute left-0 right-1/2 top-0 h-px bg-slate-300" />
                                )}
                                {children.length > 1 && index !== children.length - 1 && (
                                    <div className="pointer-events-none absolute left-1/2 right-0 top-0 h-px bg-slate-300" />
                                )}
                                <div className="absolute left-1/2 top-0 h-5 w-px -translate-x-1/2 bg-slate-300" />
                                <HierarchyBranch
                                    node={child}
                                    moduleType={moduleType}
                                    compact={compact}
                                    selectedIds={selectedIds}
                                    onSelect={onSelect}
                                    registerRef={registerRef}
                                    collapsedIds={collapsedIds}
                                    onToggleCollapse={onToggleCollapse}
                                    activePathIds={activePathIds}
                                    searchHitIds={searchHitIds}
                                    totalValorado={totalValorado}
                                    draggableNodeIds={draggableNodeIds}
                                    dragTargetId={dragTargetId}
                                    dragTargetZone={dragTargetZone}
                                    onDragStartNode={onDragStartNode}
                                    onDragOverNode={onDragOverNode}
                                    onDropOnNode={onDropOnNode}
                                    onDragEndNode={onDragEndNode}
                                    onOpenActions={onOpenActions}
                                    embeddedDisplayMode={embeddedDisplayMode}
                                    selectedGraphNodeId={selectedGraphNodeId}
                                    selectedEmbeddedStakeholderId={selectedEmbeddedStakeholderId}
                                    selectedEmbeddedStakeholderParentId={selectedEmbeddedStakeholderParentId}
                                    onSelectEmbeddedStakeholder={onSelectEmbeddedStakeholder}
                                    registerEmbeddedRef={registerEmbeddedRef}
                                />
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

const MiniMapBranch = ({ node, level = 0, selectedNodeId, onSelect, collapsedIds, onToggleCollapse }) => {
    const hasChildren = (node.hijos || []).length > 0;
    const isCollapsed = collapsedIds.has(node.id);

    return (
        <div className="w-full">
            <div
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-zinc-50"
                style={{ paddingLeft: `${8 + level * 12}px` }}
            >
                {hasChildren ? (
                    <button
                        type="button"
                        onClick={() => onToggleCollapse(node.id)}
                        className="flex h-5 w-5 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-500"
                    >
                        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>
                ) : (
                    <div className="h-5 w-5" />
                )}
                <button
                    type="button"
                    onClick={() => onSelect(node.id)}
                    className={`flex min-w-0 flex-1 items-center gap-2 rounded-md border px-2 py-1 text-left text-[10px] font-black uppercase tracking-[0.14em] ${
                        selectedNodeId === node.id
                            ? 'border-[#F39200] bg-[#fffdfa] text-[#F39200]'
                            : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
                    }`}
                >
                    <span className="truncate">{node.codigo || 'TBD'}</span>
                    <span className="truncate font-bold normal-case tracking-normal">{node.nombre || getStakeholderDisplayName(node) || 'Nodo'}</span>
                </button>
            </div>
            {hasChildren && !isCollapsed && (
                <div className="space-y-1">
                    {node.hijos.map((child) => (
                        <MiniMapBranch
                            key={child.id}
                            node={child}
                            level={level + 1}
                            selectedNodeId={selectedNodeId}
                            onSelect={onSelect}
                            collapsedIds={collapsedIds}
                            onToggleCollapse={onToggleCollapse}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const HierarchyGraphView = ({
    tree = [],
    moduleType = 'edt',
    compact = false,
    selectedIds = new Set(),
    activeNodeId = null,
    onSelectNode,
    onMoveSelection,
    onDeleteSelection,
    onClearSelection,
    onCreateChild,
    onCreateStakeholder,
    onEditNode,
    onDeleteNode,
    onEditEmbeddedStakeholder,
    onDeleteEmbeddedStakeholder,
    economicSummary = null,
    onReorderNodes,
    toolbarPortalRef = null,
    toolbarPortalTarget = null,
    useExternalToolbar = false,
    externalSearchTerm,
    onExternalSearchTermChange,
}) => {
    const defaultZoom = compact ? 0.82 : 1;
    const [zoom, setZoom] = useState(defaultZoom);
    const [collapsedIds, setCollapsedIds] = useState(() => new Set());
    const [typeFilter, setTypeFilter] = useState('all');
    const [internalSearchTerm, setInternalSearchTerm] = useState('');
    const [searchIndex, setSearchIndex] = useState(0);
    const [scopeMode, setScopeMode] = useState('all');
    const [miniMapOpen, setMiniMapOpen] = useState(false);
    const [miniMapMinimized, setMiniMapMinimized] = useState(false);
    const [miniMapPosition, setMiniMapPosition] = useState({ x: 24, y: 24 });
    const [miniMapSearch, setMiniMapSearch] = useState('');
    const [isPanning, setIsPanning] = useState(false);
    const [summaryCollapsed, setSummaryCollapsed] = useState(false);
    const [economicPanelOpen, setEconomicPanelOpen] = useState(false);
    const [draggedNodeId, setDraggedNodeId] = useState(null);
    const [dragTargetId, setDragTargetId] = useState(null);
    const [dragTargetZone, setDragTargetZone] = useState(null);
    const [selectedActionPanelStyle, setSelectedActionPanelStyle] = useState(null);
    const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
    const nodeRefs = useRef(new Map());
    const actionTriggerRefs = useRef(new Map());
    const embeddedRefs = useRef(new Map());
    const viewportRef = useRef(null);
    const miniMapDragRef = useRef(null);
    const hoveringViewportRef = useRef(false);
    const pendingActionOpenRef = useRef(false);
    const panStateRef = useRef({
        active: false,
        startX: 0,
        startY: 0,
        scrollLeft: 0,
        scrollTop: 0,
    });

    const graphTitle = moduleType === 'edt' ? 'Vista gráfica EDT' : 'Vista gráfica EDO';
    const graphSubtitle = moduleType === 'edt'
        ? 'Lectura jerárquica de cuentas paquete y responsables.'
        : 'Lectura jerárquica de hitos y responsables.';

    useEffect(() => {
        const handlePointerMove = (event) => {
            if (!miniMapDragRef.current) return;
            const { offsetX, offsetY, panel } = miniMapDragRef.current;
            if (!(panel instanceof HTMLElement)) return;
            const panelRect = panel.getBoundingClientRect();
            const nextX = event.clientX - offsetX;
            const nextY = event.clientY - offsetY;
            const maxX = Math.max(8, window.innerWidth - panelRect.width - 8);
            const maxY = Math.max(8, window.innerHeight - panelRect.height - 8);
            setMiniMapPosition({
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

    const hasSelection = selectedIds.size > 0;
    const selectedId = activeNodeId || (hasSelection ? Array.from(selectedIds)[0] : null);
    const sourceFlatNodes = useMemo(() => flattenTree(tree, []), [tree]);
    const graphSourceTree = useMemo(() => projectGraphTree(tree, moduleType), [tree, moduleType]);
    const graphSourceFlatNodes = useMemo(() => flattenTree(graphSourceTree, []), [graphSourceTree]);
    const selectedRawNode = useMemo(
        () => (selectedId ? sourceFlatNodes.find((node) => node.id === selectedId) || null : null),
        [selectedId, sourceFlatNodes]
    );
    const selectedRawPath = useMemo(() => (selectedId ? findNodePath(tree, selectedId) : []), [selectedId, tree]);
    const selectedGraphNodeId = useMemo(() => {
        if (!selectedRawPath.length) return selectedRawNode && isStructuralNode(selectedRawNode, moduleType) ? selectedRawNode.id : null;
        const structuralTrail = selectedRawPath.filter((node) => isStructuralNode(node, moduleType));
        return structuralTrail.length ? structuralTrail[structuralTrail.length - 1].id : null;
    }, [selectedRawNode, selectedRawPath, moduleType]);
    const selectedGraphNode = useMemo(
        () => (selectedGraphNodeId ? graphSourceFlatNodes.find((node) => node.id === selectedGraphNodeId) || null : null),
        [selectedGraphNodeId, graphSourceFlatNodes]
    );
    const selectedEmbeddedNode = useMemo(
        () => (selectedRawNode && !isStructuralNode(selectedRawNode, moduleType) ? selectedRawNode : null),
        [selectedRawNode, moduleType]
    );
    const handleSelect = (nodeId) => {
        if (selectedId !== nodeId) {
            setIsActionMenuOpen(false);
        }
        onSelectNode?.(nodeId);
    };
    const handleSelectEmbeddedStakeholder = (parentNode, stakeholderNode) => {
        pendingActionOpenRef.current = true;
        onSelectNode?.(stakeholderNode.id);
    };
    const selectionLabel = hasSelection
        ? `${selectedIds.size} ${selectedIds.size === 1 ? 'seleccionado' : 'seleccionados'}`
        : '';
    const filterOptions = useMemo(() => (
        moduleType === 'edt'
            ? [
                { id: 'all', label: 'Todos' },
                { id: 'main', label: 'Cuentas' },
            ]
            : [
                { id: 'all', label: 'Todos' },
                { id: 'main', label: 'Hitos' },
            ]
    ), [moduleType]);
    const canCreateChild = useMemo(() => {
        if (!selectedGraphNode) return false;
        return isStructuralNode(selectedGraphNode, moduleType);
    }, [moduleType, selectedGraphNode]);
    const canCreateStakeholder = useMemo(
        () => Boolean(onCreateStakeholder) && Boolean(selectedGraphNode) && isStructuralNode(selectedGraphNode, moduleType),
        [moduleType, onCreateStakeholder, selectedGraphNode]
    );
    const scopedTree = useMemo(() => {
        if (scopeMode !== 'branch' || !selectedGraphNode) return graphSourceTree;
        return [{ ...selectedGraphNode }];
    }, [scopeMode, selectedGraphNode, graphSourceTree]);
    const renderedTree = useMemo(() => {
        if (typeFilter === 'all' || typeFilter === 'main') return scopedTree;
        return cloneTreeWithFilter(scopedTree, (node) => (node.embeddedStakeholders || []).length > 0);
    }, [scopedTree, typeFilter]);
    const embeddedDisplayMode = typeFilter === 'secondary'
        ? 'focus'
        : typeFilter === 'main'
            ? 'hidden'
            : 'full';
    const rootNavigator = useMemo(
        () => renderedTree.map((node) => ({ id: node.id, codigo: node.codigo, nombre: node.nombre || 'Nodo raíz' })),
        [renderedTree]
    );
    const selectedPath = useMemo(() => (selectedGraphNodeId ? findNodePath(graphSourceTree, selectedGraphNodeId) : []), [selectedGraphNodeId, graphSourceTree]);
    const activePathIds = useMemo(() => new Set(selectedPath.map((node) => node.id)), [selectedPath]);
    const renderedFlatNodes = useMemo(() => flattenTree(renderedTree, []), [renderedTree]);
    const analytics = useMemo(() => {
        const secondaryNodes = renderedFlatNodes.reduce((acc, node) => acc + ((node.embeddedStakeholders || []).length), 0);
        return {
            totalNodes: renderedFlatNodes.length + secondaryNodes,
            mainNodes: renderedFlatNodes.length,
            secondaryNodes,
            rootNodes: renderedTree.length,
            selectedDepth: selectedPath.length ? selectedPath.length - 1 : 0,
        };
    }, [renderedFlatNodes, renderedTree.length, selectedPath.length]);
    const totalValorado = useMemo(
        () => (moduleType === 'edt' ? graphSourceTree.reduce((acc, node) => acc + (node.metrics?.valorado || 0), 0) : 0),
        [moduleType, graphSourceTree]
    );
    const draggableNodeIds = useMemo(() => {
        const ids = new Set();
        renderedFlatNodes.forEach((node) => ids.add(node.id));
        return ids;
    }, [renderedFlatNodes]);
    const searchTerm = externalSearchTerm ?? internalSearchTerm;
    const setSearchTerm = onExternalSearchTermChange ?? setInternalSearchTerm;
    const searchMatches = useMemo(() => {
        const query = normalizeSearch(searchTerm);
        if (!query) return [];
        return renderedFlatNodes.filter((node) => nodeMatchesSearch(node, moduleType, query));
    }, [renderedFlatNodes, searchTerm, moduleType]);
    const activeSearchMatch = searchMatches.length ? searchMatches[searchIndex % searchMatches.length] : null;
    const searchHitIds = useMemo(() => new Set(searchMatches.map((node) => node.id)), [searchMatches]);
    const miniMapMatches = useMemo(() => {
        const query = normalizeSearch(miniMapSearch);
        if (!query) return [];
        return renderedFlatNodes.filter((node) => nodeMatchesSearch(node, moduleType, query));
    }, [miniMapSearch, renderedFlatNodes, moduleType]);
    const miniMapFilteredTree = useMemo(() => {
        const query = normalizeSearch(miniMapSearch);
        if (!query) return renderedTree;
        return cloneTreeWithFilter(renderedTree, (node) => nodeMatchesSearch(node, moduleType, query));
    }, [miniMapSearch, renderedTree, moduleType]);
    const isSingleSelection = selectedIds.size === 1;
    const childActionLabel = moduleType === 'edt' ? 'Añadir cuenta hija' : 'Añadir hito hijo';
    const assignmentActionLabel = moduleType === 'edt' ? 'Asignar participante' : 'Asignar responsable';
    const registerNodeRef = (nodeId, element) => {
        if (element) nodeRefs.current.set(nodeId, element);
        else nodeRefs.current.delete(nodeId);
    };
    const registerActionTriggerRef = (nodeId, element) => {
        if (element) actionTriggerRefs.current.set(nodeId, element);
        else actionTriggerRefs.current.delete(nodeId);
    };
    const registerEmbeddedRef = (parentId, stakeholderId, element) => {
        const refKey = `${parentId}:${stakeholderId}`;
        if (element) embeddedRefs.current.set(refKey, element);
        else embeddedRefs.current.delete(refKey);
    };
    const handleDragStartNode = (event, node) => {
        if (!draggableNodeIds.has(node.id)) return;
        event.dataTransfer.effectAllowed = 'move';
        setDraggedNodeId(node.id);
    };
    const handleDragOverNode = (event, node) => {
        if (!draggedNodeId || draggedNodeId === node.id) return;
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
        const zone = resolveDropZone(event);
        if (dragTargetId !== node.id || dragTargetZone !== zone) {
            setDragTargetId(node.id);
            setDragTargetZone(zone);
        }
    };
    const handleDropOnNode = async (event, node) => {
        event.preventDefault();
        const sourceId = draggedNodeId;
        const zone = resolveDropZone(event);
        setDragTargetId(null);
        setDragTargetZone(null);
        setDraggedNodeId(null);
        if (!sourceId || sourceId === node.id) return;
        if (zone === 'none') return;
        const draggedNode = renderedFlatNodes.find((item) => item.id === sourceId);
        if (!draggedNode) return;
        await onReorderNodes?.(draggedNode, node, zone);
    };
    const handleDragEndNode = () => {
        setDraggedNodeId(null);
        setDragTargetId(null);
        setDragTargetZone(null);
    };

    const handleToggleCollapse = (nodeId) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    };

    const handleExpandAll = () => {
        setCollapsedIds(new Set());
    };

    const handleCollapseAll = () => {
        setCollapsedIds(new Set(collectIdsRecursively(graphSourceTree)));
    };

    const navigateToSearchMatch = (match) => {
        if (!match) return;
        onSelectNode?.(match.id);
        const path = findNodePath(graphSourceTree, match.id);
        if (path.length) {
            setCollapsedIds((prev) => {
                const next = new Set(prev);
                path.forEach((node) => next.delete(node.id));
                return next;
            });
        }
        requestAnimationFrame(() => {
            const nodeElement = nodeRefs.current.get(match.id);
            if (nodeElement) {
                nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            }
        });
    };

    const handleCenterSelection = () => {
        if (!selectedGraphNodeId) return;
        const nodeElement = nodeRefs.current.get(selectedGraphNodeId);
        if (nodeElement) {
            nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    };

    const handleOpenActionMenu = (nodeId) => {
        if (selectedId !== nodeId) {
            pendingActionOpenRef.current = true;
            onSelectNode?.(nodeId);
            return;
        }
        setIsActionMenuOpen(true);
    };

    useEffect(() => {
        if (pendingActionOpenRef.current) {
            setIsActionMenuOpen(true);
            pendingActionOpenRef.current = false;
            return;
        }
        setIsActionMenuOpen(false);
    }, [selectedId]);

    useEffect(() => {
        const handleOutsideContextMenu = (event) => {
            if (!isActionMenuOpen || !selectedId) return;
            const target = event.target;
            const panel = viewportRef.current?.querySelector('[data-graph-action-menu="true"]');
            const selectedNodeElement = selectedEmbeddedNode
                ? embeddedRefs.current.get(`${selectedEmbeddedNode.parent_id}:${selectedEmbeddedNode.id}`)
                : nodeRefs.current.get(selectedGraphNodeId);
            if (panel && panel.contains(target)) return;
            if (selectedNodeElement && selectedNodeElement.contains(target)) return;
            setIsActionMenuOpen(false);
        };

        document.addEventListener('contextmenu', handleOutsideContextMenu, true);
        return () => document.removeEventListener('contextmenu', handleOutsideContextMenu, true);
    }, [isActionMenuOpen, selectedId, selectedEmbeddedNode, selectedGraphNodeId]);

    const handleMiniMapSearchNavigate = (match = null) => {
        const target = match || miniMapMatches[0];
        if (!target) return;
        navigateToSearchMatch(target);
        setMiniMapMinimized(false);
    };

    useEffect(() => {
        const syncSelectedActionPanel = () => {
            if (!isSingleSelection || !selectedId || !viewportRef.current) {
                setSelectedActionPanelStyle(null);
                return;
            }
            const nodeElement = selectedEmbeddedNode
                ? embeddedRefs.current.get(`${selectedEmbeddedNode.parent_id}:${selectedEmbeddedNode.id}`)
                : actionTriggerRefs.current.get(selectedGraphNodeId) || nodeRefs.current.get(selectedGraphNodeId);
            if (!nodeElement) {
                setSelectedActionPanelStyle(null);
                return;
            }
            const viewportRect = viewportRef.current.getBoundingClientRect();
            const viewportScrollLeft = viewportRef.current.scrollLeft;
            const viewportScrollTop = viewportRef.current.scrollTop;
            const nodeRect = nodeElement.getBoundingClientRect();
            const panelWidth = selectedEmbeddedNode ? 174 : 220;
            const panelHeight = selectedEmbeddedNode ? 76 : 212;
            let left = nodeRect.right - viewportRect.left + viewportScrollLeft + 12;
            let top = nodeRect.top - viewportRect.top + viewportScrollTop + (nodeRect.height / 2) - (panelHeight / 2);

            if ((left - viewportScrollLeft) + panelWidth > viewportRect.width - 8) {
                left = Math.max(12 + viewportScrollLeft, nodeRect.left - viewportRect.left + viewportScrollLeft - panelWidth - 12);
            }
            if ((top - viewportScrollTop) + panelHeight > viewportRect.height - 8) {
                top = Math.max(12 + viewportScrollTop, viewportScrollTop + viewportRect.height - panelHeight - 12);
            }

            setSelectedActionPanelStyle({
                left: `${Math.max(12, left)}px`,
                top: `${Math.max(12, top)}px`,
            });
        };

        syncSelectedActionPanel();
        const viewport = viewportRef.current;
        if (viewport) {
            viewport.addEventListener('scroll', syncSelectedActionPanel);
        }
        window.addEventListener('resize', syncSelectedActionPanel);
        return () => {
            if (viewport) {
                viewport.removeEventListener('scroll', syncSelectedActionPanel);
            }
            window.removeEventListener('resize', syncSelectedActionPanel);
        };
    }, [isSingleSelection, selectedId, selectedGraphNodeId, selectedEmbeddedNode, zoom, collapsedIds, scopeMode, typeFilter, searchTerm, renderedTree]);

    const handleResetView = () => {
        setZoom(defaultZoom);
        const viewport = viewportRef.current;
        if (viewport) {
            viewport.scrollTo({ top: 0, left: 0, behavior: 'smooth' });
        }
        if (selectedId) {
            requestAnimationFrame(() => {
                handleCenterSelection();
            });
        }
    };

    useEffect(() => {
        if (!selectedIds.size) return;
        const nodeElement = nodeRefs.current.get(selectedGraphNodeId);
        if (nodeElement) {
            nodeElement.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
        }
    }, [selectedIds, selectedGraphNodeId]);

    useEffect(() => {
        setSearchIndex(0);
    }, [searchTerm]);

    useEffect(() => {
        if (!selectedGraphNode && scopeMode === 'branch') {
            setScopeMode('all');
        }
    }, [selectedGraphNode, scopeMode]);

    useEffect(() => {
        if (typeFilter === 'secondary') {
            setTypeFilter('all');
        }
    }, [typeFilter]);

    useEffect(() => {
        const viewport = viewportRef.current;
        if (!viewport) return undefined;

        const preventMiddleButtonDefault = (event) => {
            if (!hoveringViewportRef.current || event.button !== 1) return;
            event.preventDefault();
        };

        const handleMouseEnterNative = () => {
            hoveringViewportRef.current = true;
        };

        const handleMouseDownNative = (event) => {
            const isMiddleButton = event.button === 1;
            const isLeftButton = event.button === 0;
            const clickedInteractive = event.target instanceof Element && event.target.closest(INTERACTIVE_GRAPH_SELECTOR);
            const clickedPanSurface = event.target instanceof Element && event.target.closest('[data-graph-pan-surface="true"]');

            if (!isMiddleButton && !(isLeftButton && clickedPanSurface && !clickedInteractive)) return;
            event.preventDefault();
            setIsPanning(true);
            panStateRef.current = {
                active: true,
                startX: event.clientX,
                startY: event.clientY,
                scrollLeft: viewport.scrollLeft,
                scrollTop: viewport.scrollTop,
            };
        };

        const handleMouseMoveNative = (event) => {
            if (!panStateRef.current.active) return;
            event.preventDefault();
            const deltaX = event.clientX - panStateRef.current.startX;
            const deltaY = event.clientY - panStateRef.current.startY;
            viewport.scrollTo({
                left: panStateRef.current.scrollLeft - deltaX,
                top: panStateRef.current.scrollTop - deltaY,
            });
        };

        const handleMouseUpNative = () => {
            panStateRef.current.active = false;
            setIsPanning(false);
        };

        const handleMouseLeaveNative = () => {
            hoveringViewportRef.current = false;
            handleMouseUpNative();
        };

        const handleAuxClickNative = (event) => {
            if (event.button === 1) {
                event.preventDefault();
            }
        };

        const handleWheelNative = (event) => {
            event.preventDefault();
            const direction = event.deltaY > 0 ? -0.08 : 0.08;
            setZoom((prev) => clampZoom(prev + direction));
        };

        document.addEventListener('pointerdown', preventMiddleButtonDefault, true);
        document.addEventListener('mousedown', preventMiddleButtonDefault, true);
        document.addEventListener('auxclick', preventMiddleButtonDefault, true);
        document.addEventListener('mouseup', preventMiddleButtonDefault, true);
        viewport.addEventListener('mouseenter', handleMouseEnterNative);
        viewport.addEventListener('mousedown', handleMouseDownNative);
        viewport.addEventListener('mousemove', handleMouseMoveNative);
        viewport.addEventListener('mouseup', handleMouseUpNative);
        viewport.addEventListener('mouseleave', handleMouseLeaveNative);
        viewport.addEventListener('auxclick', handleAuxClickNative);
        viewport.addEventListener('wheel', handleWheelNative, { passive: false });
        window.addEventListener('mouseup', handleMouseUpNative);

        return () => {
            hoveringViewportRef.current = false;
            document.removeEventListener('pointerdown', preventMiddleButtonDefault, true);
            document.removeEventListener('mousedown', preventMiddleButtonDefault, true);
            document.removeEventListener('auxclick', preventMiddleButtonDefault, true);
            document.removeEventListener('mouseup', preventMiddleButtonDefault, true);
            viewport.removeEventListener('mouseenter', handleMouseEnterNative);
            viewport.removeEventListener('mousedown', handleMouseDownNative);
            viewport.removeEventListener('mousemove', handleMouseMoveNative);
            viewport.removeEventListener('mouseup', handleMouseUpNative);
            viewport.removeEventListener('mouseleave', handleMouseLeaveNative);
            viewport.removeEventListener('auxclick', handleAuxClickNative);
            viewport.removeEventListener('wheel', handleWheelNative);
            window.removeEventListener('mouseup', handleMouseUpNative);
        };
    }, []);

    const workspaceMinHeight = compact ? 840 : 1040;
    const landingControlButtonClass = `${graphNeumorphicButtonBase} disabled:cursor-not-allowed disabled:opacity-40`;
    const landingControlTextButtonClass = `${landingControlButtonClass} rounded-[0.8rem] px-3 py-1.5 text-[8px] font-black uppercase tracking-[0.12em] text-zinc-600`;
    const landingControlIconButtonClass = `${landingControlButtonClass} h-8 w-8 rounded-full`;
    const externalToolbarNode = toolbarPortalTarget || toolbarPortalRef?.current || null;
    const controlsOnDarkSurface = Boolean(useExternalToolbar || toolbarPortalRef || toolbarPortalTarget);
    const graphControlTextButtonClass = controlsOnDarkSurface
        ? DARK_RAIL_TEXT_BUTTON_CLASS
        : landingControlTextButtonClass;
    const graphControlIconButtonClass = controlsOnDarkSurface
        ? DARK_RAIL_ICON_BUTTON_CLASS
        : landingControlIconButtonClass;
    const depthMetricLabel = moduleType === 'edt' || moduleType === 'edo' ? 'Nivel' : 'Prof.';
    const graphDarkMetricChips = controlsOnDarkSurface ? (
        <div className="flex flex-wrap items-center justify-end gap-1.5">
            <AppHint content={`${scopeMode === 'branch' ? 'Rama' : 'Vista'}: ${analytics.totalNodes} ${scopeMode === 'branch' ? 'nodos' : 'visibles'}.`} tone="dark" maxWidth={240} widthOffset={12}>
                <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                    <span className={`${DARK_RAIL_METRIC_DOT_CLASS} bg-slate-300`} />
                    <span>{scopeMode === 'branch' ? 'Rama' : 'Vista'}</span>
                    <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-white`}>{analytics.totalNodes}</span>
                </div>
            </AppHint>
            <AppHint content={`${moduleType === 'edt' ? 'Cuentas' : 'Hitos'} principales: ${analytics.mainNodes}.`} tone="dark" maxWidth={240} widthOffset={12}>
                <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                    <span className={`${DARK_RAIL_METRIC_DOT_CLASS} bg-[#F39200]`} />
                    <span>{moduleType === 'edt' ? 'Cuentas' : 'Hitos'}</span>
                    <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-[#F39200]`}>{analytics.mainNodes}</span>
                </div>
            </AppHint>
            <AppHint content={`Responsables asociados: ${analytics.secondaryNodes}.`} tone="dark" maxWidth={240} widthOffset={12}>
                <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                    <span className={`${DARK_RAIL_METRIC_DOT_CLASS} bg-purple-400`} />
                    <span>Resp.</span>
                    <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-purple-200`}>{analytics.secondaryNodes}</span>
                </div>
            </AppHint>
            <AppHint content={`Raices visibles: ${analytics.rootNodes}.`} tone="dark" maxWidth={240} widthOffset={12}>
                <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                    <span className={`${DARK_RAIL_METRIC_DOT_CLASS} bg-sky-300`} />
                    <span>Raices</span>
                    <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-sky-100`}>{analytics.rootNodes}</span>
                </div>
            </AppHint>
            <AppHint content={`Profundidad ${selectedPath.length ? 'activa' : 'sin seleccion'}: ${analytics.selectedDepth}.`} tone="dark" maxWidth={260} widthOffset={12}>
                <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                    <span className={`${DARK_RAIL_METRIC_DOT_CLASS} bg-amber-300`} />
                    <span>{depthMetricLabel}</span>
                    <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-amber-100`}>{analytics.selectedDepth}</span>
                </div>
            </AppHint>
        </div>
    ) : null;
    const graphEconomicMetricChips = controlsOnDarkSurface && moduleType === 'edt' && economicSummary?.enabled ? (
        <div className="flex flex-wrap items-center gap-1.5">
            <AppHint content={`Directo: ${formatEdtCurrency(economicSummary.totalDirecto || 0)}.`} tone="dark" maxWidth={220} widthOffset={12}>
                <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                    <span className={`${DARK_RAIL_METRIC_DOT_CLASS} bg-emerald-300`} />
                    <span>Dir.</span>
                    <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-emerald-100`}>{formatEdtCurrency(economicSummary.totalDirecto || 0)}</span>
                </div>
            </AppHint>
            <AppHint content={`Indirectos: ${formatEdtPercent(economicSummary.indirectosPorcentaje || 0)}.`} tone="dark" maxWidth={220} widthOffset={12}>
                <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                    <span className={`${DARK_RAIL_METRIC_DOT_CLASS} bg-amber-300`} />
                    <span>Ind.</span>
                    <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-amber-100`}>{formatEdtPercent(economicSummary.indirectosPorcentaje || 0)}</span>
                </div>
            </AppHint>
            <AppHint content={`Valorado: ${formatEdtCurrency(economicSummary.totalValorado || 0)}.`} tone="dark" maxWidth={220} widthOffset={12}>
                <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                    <span className={`${DARK_RAIL_METRIC_DOT_CLASS} bg-sky-300`} />
                    <span>Val.</span>
                    <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-sky-100`}>{formatEdtCurrency(economicSummary.totalValorado || 0)}</span>
                </div>
            </AppHint>
        </div>
    ) : null;
    const graphPrimaryControls = (
        <div className={`flex items-center gap-1.5 ${compact ? 'flex-wrap' : ''}`}>
            <button
                type="button"
                onClick={handleCenterSelection}
                disabled={!selectedId}
                className={graphControlTextButtonClass}
            >
                Centrar
            </button>
            <button
                type="button"
                onClick={handleResetView}
                className={graphControlTextButtonClass}
            >
                Reset
            </button>
            {!controlsOnDarkSurface ? (
                <button
                    type="button"
                    onClick={() => setSummaryCollapsed((prev) => !prev)}
                    className={`${graphControlTextButtonClass} ${
                        summaryCollapsed
                            ? ''
                            : 'text-[#136191] shadow-[inset_2px_2px_8px_#d0d0d0,inset_-2px_-2px_8px_#ffffff]'
                    }`}
                >
                    Resumen
                </button>
            ) : null}
            <button
                type="button"
                onClick={() => setZoom((prev) => clampZoom(prev - 0.1))}
                className={graphControlIconButtonClass}
                title="Alejar"
            >
                <Minus className="h-3.5 w-3.5" />
            </button>
            <div className={`min-w-[44px] text-center text-[8px] font-black uppercase tracking-[0.12em] ${controlsOnDarkSurface ? 'text-white/70' : 'text-zinc-500'}`}>
                {Math.round(zoom * 100)}%
            </div>
            <button
                type="button"
                onClick={() => setZoom((prev) => clampZoom(prev + 0.1))}
                className={graphControlIconButtonClass}
                title="Acercar"
            >
                <Plus className="h-3.5 w-3.5" />
            </button>
        </div>
    );
    const graphSecondaryControls = (
        <div className="flex items-center gap-1.5">
            <button
                type="button"
                onClick={() => setScopeMode((prev) => (prev === 'branch' ? 'all' : 'branch'))}
                disabled={!selectedGraphNode}
                className={`rounded-lg border px-2 py-1 text-[8px] font-black uppercase tracking-[0.1em] transition ${
                    scopeMode === 'branch'
                    ? 'border-amber-300 bg-amber-100 text-amber-800'
                    : controlsOnDarkSurface
                            ? 'border-white/16 bg-white/8 text-white/60 hover:border-white/35 hover:text-white'
                            : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
                } disabled:cursor-not-allowed disabled:opacity-40`}
                title={scopeMode === 'branch' ? 'Volver a vista total' : 'Enfocar rama activa'}
            >
                {scopeMode === 'branch' ? 'Vista total' : 'Rama'}
            </button>
            <div className={`min-w-[62px] text-center text-[8px] font-black uppercase tracking-[0.1em] ${controlsOnDarkSurface ? 'text-white/60' : 'text-zinc-500'}`}>
                {searchMatches.length ? `${searchIndex + 1}/${searchMatches.length}` : 'Sin match'}
            </div>
            <button
                type="button"
                onClick={() => {
                    const nextIndex = searchMatches.length
                        ? ((searchIndex - 1) < 0 ? searchMatches.length - 1 : searchIndex - 1)
                        : 0;
                    setSearchIndex(nextIndex);
                    if (searchMatches.length) {
                        navigateToSearchMatch(searchMatches[nextIndex]);
                    }
                }}
                disabled={!searchMatches.length}
                className={controlsOnDarkSurface ? `${DARK_RAIL_CONTROL_BUTTON_CLASS} h-7 w-7 rounded-lg` : 'flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40'}
                title="Coincidencia anterior"
            >
                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
            </button>
            <button
                type="button"
                onClick={() => {
                    const nextIndex = searchMatches.length ? ((searchIndex + 1) % searchMatches.length) : 0;
                    setSearchIndex(nextIndex);
                    if (searchMatches.length) {
                        navigateToSearchMatch(searchMatches[nextIndex]);
                    }
                }}
                disabled={!searchMatches.length}
                className={controlsOnDarkSurface ? `${DARK_RAIL_CONTROL_BUTTON_CLASS} h-7 w-7 rounded-lg` : 'flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-40'}
                title="Siguiente coincidencia"
            >
                <ChevronRight className="h-3.5 w-3.5" />
            </button>
        </div>
    );
    const graphPortalControls = externalToolbarNode
        ? createPortal(
            <div className="flex w-full flex-wrap items-center gap-2">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                    {graphDarkMetricChips}
                    {graphEconomicMetricChips}
                </div>
                <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                    {graphPrimaryControls}
                    {graphSecondaryControls}
                </div>
            </div>,
            externalToolbarNode
        )
        : null;

    return (
        <div className="flex h-full min-h-0 flex-col rounded-[1.6rem] border border-zinc-100 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
            {graphPortalControls}
            {!useExternalToolbar && !toolbarPortalRef && !toolbarPortalTarget ? (
            <div className="border-b border-zinc-100 px-3 py-2">
                <div className={`flex ${compact ? 'flex-col gap-2' : 'items-center justify-between gap-3'}`}>
                    <div className="min-w-0">
                        <div className="flex min-w-0 items-center gap-2">
                            <h3 className="truncate text-[11px] font-black uppercase tracking-[0.14em] text-[#F39200]">{graphTitle}</h3>
                            <span className="hidden rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400 xl:inline-flex">
                                {graphSubtitle}
                            </span>
                        </div>
                    </div>
                    {graphPrimaryControls}
                </div>

                <div className={`mt-2 flex ${compact ? 'flex-col gap-1.5' : 'items-center gap-2'}`}>
                    <div className={`flex min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white ${compact ? 'flex-wrap gap-1.5 px-2 py-1.5' : 'items-center gap-1.5 px-2'}`}>
                        <ClearSearchField
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            onKeyDown={(event) => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    navigateToSearchMatch(activeSearchMatch);
                                }
                            }}
                            placeholder={`Buscar ${moduleType === 'edt' ? 'cuenta o responsable' : 'hito o responsable'}...`}
                            containerClassName="min-w-[220px] flex-1"
                            searchIconClassName="left-1 h-3.5 w-3.5"
                            clearButtonClassName="right-1"
                            inputClassName="h-8 w-full border-none bg-transparent pl-7 pr-8 text-[12px] text-zinc-700 outline-none"
                        />
                        {selectedPath.length > 1 && (
                            <>
                                <div className={`bg-zinc-200 ${compact ? 'hidden' : 'h-4 w-px'}`} />
                                <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                                    <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.1em] text-zinc-400">
                                        Ruta
                                    </span>
                                    <div className="flex min-w-0 items-center gap-1 overflow-hidden">
                                        {selectedPath.map((node, index) => (
                                            <React.Fragment key={node.id}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSelect(node.id)}
                                                    className={`max-w-[92px] truncate rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.1em] transition ${
                                                        node.id === selectedId
                                                            ? 'border-amber-300 bg-amber-100 text-amber-800'
                                                            : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
                                                    }`}
                                                >
                                                    {node.codigo || 'TBD'}
                                                </button>
                                                {index < selectedPath.length - 1 && (
                                                    <ChevronRight className="h-3 w-3 shrink-0 text-zinc-300" />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                        <div className={`bg-zinc-200 ${compact ? 'hidden' : 'h-4 w-px'}`} />
                        {graphSecondaryControls}
                    </div>
                </div>

                {!summaryCollapsed && (
                    <div className="mt-2 overflow-x-auto">
                        <div className="flex min-w-max items-center gap-1.5">
                        <div className="rounded-[0.95rem] border border-zinc-200 bg-zinc-50/70 px-2.5 py-1.5">
                            <div className="text-[8px] font-black uppercase tracking-[0.12em] text-zinc-400">
                                {scopeMode === 'branch' ? 'Rama' : 'Vista'}
                            </div>
                            <div className="mt-0.5 flex items-end gap-1">
                                <span className="text-base font-black leading-none text-zinc-900">{analytics.totalNodes}</span>
                                <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">
                                    {scopeMode === 'branch' ? 'Nodos' : 'Visibles'}
                                </span>
                            </div>
                        </div>
                        <div className="rounded-[0.95rem] border border-[#F39200]/14 bg-[#fffdfa] px-2.5 py-1.5">
                            <div className="text-[8px] font-black uppercase tracking-[0.12em] text-[#F39200]">
                                {moduleType === 'edt' ? 'Cuentas' : 'Hitos'}
                            </div>
                            <div className="mt-0.5 flex items-end gap-1">
                                <span className="text-base font-black leading-none text-[#F39200]">{analytics.mainNodes}</span>
                                <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-[#F39200]">Principales</span>
                            </div>
                        </div>
                        <div className="rounded-[0.95rem] border border-purple-200/70 bg-purple-50/70 px-2.5 py-1.5">
                            <div className="text-[8px] font-black uppercase tracking-[0.12em] text-purple-500">Resp.</div>
                            <div className="mt-0.5 flex items-end gap-1">
                                <span className="text-base font-black leading-none text-purple-700">{analytics.secondaryNodes}</span>
                                <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-purple-700">Asociados</span>
                            </div>
                        </div>
                        <div className="rounded-[0.95rem] border border-zinc-200 bg-zinc-50/70 px-2.5 py-1.5">
                            <div className="text-[8px] font-black uppercase tracking-[0.12em] text-zinc-400">Raíces</div>
                            <div className="mt-0.5 flex items-end gap-1">
                                <span className="text-base font-black leading-none text-zinc-900">{analytics.rootNodes}</span>
                                <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-zinc-500">Ramas</span>
                            </div>
                        </div>
                        <div className="rounded-[0.95rem] border border-amber-200/70 bg-amber-50/70 px-2.5 py-1.5">
                            <div className="text-[8px] font-black uppercase tracking-[0.12em] text-amber-600">{depthMetricLabel}</div>
                            <div className="mt-0.5 flex items-end gap-1">
                                <span className="text-base font-black leading-none text-amber-800">{analytics.selectedDepth}</span>
                                <span className="text-[8px] font-bold uppercase tracking-[0.1em] text-amber-700">
                                    {selectedPath.length ? 'Activa' : 'Sin sel.'}
                                </span>
                            </div>
                        </div>
                        <div className="mx-1 h-6 w-px bg-zinc-200" />
                        <div className="flex items-center gap-1.5">
                            {filterOptions.map((option) => (
                                <button
                                    key={option.id}
                                    type="button"
                                    onClick={() => setTypeFilter(option.id)}
                                    className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.1em] shadow-[0_6px_14px_rgba(15,23,42,0.04)] transition ${
                                        typeFilter === option.id
                                            ? 'border-[#F39200]/22 bg-[#fffdfa] text-[#F39200]'
                                            : 'border-zinc-200/90 bg-white text-zinc-500 hover:border-[#F39200]/24 hover:text-[#136191]'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                            {rootNavigator.map((root) => (
                                <button
                                    key={root.id}
                                    type="button"
                                    onClick={() => handleSelect(root.id)}
                                    className={`rounded-full border px-2.5 py-1 text-left text-[8px] font-black uppercase tracking-[0.1em] shadow-[0_6px_14px_rgba(15,23,42,0.04)] transition ${
                                        selectedGraphNodeId === root.id
                                            ? 'border-[#F39200]/22 bg-[#fffdfa] text-[#F39200]'
                                            : 'border-zinc-200/90 bg-white text-zinc-500 hover:border-[#F39200]/24 hover:text-[#136191]'
                                    }`}
                                >
                                    {root.codigo || 'TBD'} · {root.nombre}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
                )}
            </div>
            ) : null}

            {selectedIds.size > 1 && (
                <div className="mx-3 mt-3 flex flex-wrap items-center gap-2 rounded-[1.1rem] border border-zinc-200 bg-white px-4 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.03)]">
                    <span className="rounded-full border border-[#F39200]/22 bg-[#fffdfa] px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-[#F39200]">
                        {selectionLabel}
                    </span>
                    <button
                        type="button"
                        onClick={onMoveSelection}
                        className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600 transition hover:border-[#F39200] hover:text-[#F39200]"
                    >
                        Mover selección
                    </button>
                    <button
                        type="button"
                        onClick={onDeleteSelection}
                        className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-red-600 transition hover:border-red-300 hover:text-red-700"
                    >
                        Eliminar selección
                    </button>
                    <button
                        type="button"
                        onClick={onClearSelection}
                        className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
                    >
                        Limpiar selección
                    </button>
                </div>
            )}

            <div className="relative flex-1 min-h-0">
                <div
                    ref={viewportRef}
                    className={`giproy-motion-scrollbar-hide h-full min-h-0 overflow-auto select-none bg-[radial-gradient(circle_at_top,_rgba(19,97,145,0.035),_transparent_34%),linear-gradient(180deg,_#ffffff_0%,_#fbfcfe_100%)] ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                >
                    {(selectedGraphNode || selectedEmbeddedNode) && isSingleSelection && selectedActionPanelStyle && (
                        <div
                            className={`pointer-events-none absolute z-30 transition-opacity duration-150 ${isActionMenuOpen ? 'opacity-100' : 'opacity-0'}`}
                            style={{ ...selectedActionPanelStyle, visibility: isActionMenuOpen ? 'visible' : 'hidden' }}
                        >
                            <div data-graph-action-menu="true" className="pointer-events-auto flex items-center gap-1.5 rounded-[1.1rem] border border-[#ececec] bg-[#f7f7f5]/96 px-2 py-2 shadow-[10px_10px_24px_#dddddd,-10px_-10px_24px_#ffffff] backdrop-blur-sm before:absolute before:-left-2 before:top-1/2 before:h-3 before:w-3 before:-translate-y-1/2 before:rotate-45 before:border-b before:border-l before:border-[#ececec] before:bg-[#f7f7f5] before:content-['']">
                                {selectedEmbeddedNode ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => onEditEmbeddedStakeholder?.(selectedEmbeddedNode)}
                                            className={`${graphNeumorphicButtonBase} relative z-10 h-10 w-10 rounded-[1rem] text-zinc-700`}
                                            title="Editar responsable"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDeleteEmbeddedStakeholder?.(selectedEmbeddedNode)}
                                            className={`${graphNeumorphicButtonBase} relative z-10 h-10 w-10 rounded-[1rem] text-red-600`}
                                            title="Eliminar responsable"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => onEditNode?.(selectedGraphNode)}
                                            className={`${graphNeumorphicButtonBase} relative z-10 h-10 w-10 rounded-[1rem] text-zinc-700`}
                                            title="Editar"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        {canCreateChild && (
                                            <button
                                                type="button"
                                                onClick={() => onCreateChild?.(selectedGraphNode.id)}
                                                className={`${graphNeumorphicButtonBase} relative z-10 h-10 w-10 rounded-[1rem] text-[#B87712]`}
                                                title={childActionLabel}
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        {canCreateStakeholder && (
                                            <button
                                                type="button"
                                                onClick={() => onCreateStakeholder?.(selectedGraphNode.id)}
                                                className={`${graphNeumorphicButtonBase} relative z-10 h-10 w-10 rounded-[1rem] text-purple-700`}
                                                title={assignmentActionLabel}
                                            >
                                                <UserCog className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={onMoveSelection}
                                            className={`${graphNeumorphicButtonBase} relative z-10 h-10 w-10 rounded-[1rem] text-zinc-600`}
                                            title="Mover"
                                        >
                                            <ChevronRight className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onDeleteNode?.(selectedGraphNode)}
                                            className={`${graphNeumorphicButtonBase} relative z-10 h-10 w-10 rounded-[1rem] text-red-600`}
                                            title="Eliminar"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    onClick={onClearSelection}
                                    className={`${graphNeumorphicButtonBase} relative z-10 h-10 w-10 rounded-[1rem] text-zinc-500`}
                                    title="Cerrar acciones"
                                >
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                    {moduleType === 'edt' && economicSummary?.enabled && (
                        <div className="pointer-events-none absolute left-3 top-3 z-20">
                            <div className="pointer-events-auto flex flex-col items-start gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEconomicPanelOpen((prev) => !prev)}
                                    className={`rounded-full border px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.12em] shadow-sm transition ${
                                        economicPanelOpen
                                            ? 'border-[#F39200]/22 bg-[#fffdfa] text-[#F39200]'
                                            : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
                                    }`}
                                >
                                    {economicPanelOpen ? 'Ocultar economía' : 'Economía EDT'}
                                </button>
                                {economicPanelOpen && (
                                    <div className="rounded-[1rem] border border-zinc-200 bg-white/95 px-5 py-3 shadow-[0_12px_30px_rgba(0,0,0,0.08)] backdrop-blur-sm">
                                        <div className="flex items-center gap-6 whitespace-nowrap">
                                            <div className="flex items-center gap-2.5">
                                                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">Dir.</div>
                                                <div className="text-[11px] font-black tracking-tight text-zinc-900">
                                                    {formatEdtCurrency(economicSummary.totalDirecto)}
                                                </div>
                                            </div>
                                            <div className="h-7 w-px bg-zinc-200" />
                                            <div className="flex items-center gap-2.5">
                                                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">Ind.</div>
                                                <div className="text-[11px] font-black tracking-tight text-[#F39200]">
                                                    {formatEdtPercent(economicSummary.indirectosPorcentaje)}
                                                </div>
                                            </div>
                                            <div className="h-7 w-px bg-zinc-200" />
                                            <div className="flex items-center gap-2.5">
                                                <div className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">Val.</div>
                                                <div className="text-[11px] font-black tracking-tight text-[#136191]">
                                                    {formatEdtCurrency(economicSummary.totalValorado)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    <div
                        data-graph-pan-surface="true"
                        className={`flex items-start justify-center ${compact ? 'px-8 py-10' : 'px-12 py-14'}`}
                        style={{
                            minWidth: '100%',
                            minHeight: `${workspaceMinHeight}px`,
                        }}
                    >
                        <div
                            data-graph-pan-surface="true"
                            className="origin-top transition-transform duration-200"
                            style={{ transform: `scale(${zoom})` }}
                        >
                            <div data-graph-pan-surface="true" className={`flex min-w-max items-start justify-center ${compact ? 'gap-5' : 'gap-8'}`}>
                                {renderedTree.map((node) => (
                                    <HierarchyBranch
                                        key={node.id}
                                        node={node}
                                        moduleType={moduleType}
                                        compact={compact}
                                        selectedIds={selectedIds}
                                        onSelect={handleSelect}
                                        registerRef={registerNodeRef}
                                collapsedIds={collapsedIds}
                                onToggleCollapse={handleToggleCollapse}
                                        activePathIds={activePathIds}
                                        searchHitIds={searchHitIds}
                                        totalValorado={totalValorado}
                                        draggableNodeIds={draggableNodeIds}
                                        dragTargetId={dragTargetId}
                                        dragTargetZone={dragTargetZone}
                                        onDragStartNode={handleDragStartNode}
                                        onDragOverNode={handleDragOverNode}
                                        onDropOnNode={handleDropOnNode}
                                        onDragEndNode={handleDragEndNode}
                                        onOpenActions={handleOpenActionMenu}
                                        registerActionTrigger={registerActionTriggerRef}
                                        embeddedDisplayMode={embeddedDisplayMode}
                                        selectedGraphNodeId={selectedGraphNodeId}
                                        selectedEmbeddedStakeholderId={selectedEmbeddedNode?.id || null}
                                        selectedEmbeddedStakeholderParentId={selectedEmbeddedNode?.parent_id || null}
                                        onSelectEmbeddedStakeholder={handleSelectEmbeddedStakeholder}
                                        registerEmbeddedRef={registerEmbeddedRef}
                                    />
                                ))}
                    </div>
                        </div>
                    </div>
                </div>
                <MotionScrollbar targetRef={viewportRef} className="right-1" />
                <MotionScrollbar targetRef={viewportRef} className="right-1" />
                <button
                    type="button"
                    onClick={() => {
                        setMiniMapOpen(true);
                        setMiniMapMinimized(false);
                    }}
                    className="absolute bottom-4 right-4 z-10 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/95 px-3 py-2 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-600 shadow-sm backdrop-blur transition hover:border-zinc-300 hover:text-zinc-900"
                >
                    <Network className="h-3.5 w-3.5" />
                    Minimapa
                </button>
            </div>

            {miniMapOpen && (
                <div
                    data-hierarchy-minimap-window="true"
                    className="fixed z-[140] w-[360px]"
                    style={{
                        left: `${miniMapPosition.x}px`,
                        top: `${miniMapPosition.y}px`,
                    }}
                >
                    <div className="overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white/96 shadow-2xl backdrop-blur">
                        <div
                            onMouseDown={(event) => {
                                const panel = event.currentTarget.closest('[data-hierarchy-minimap-window="true"]');
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
                            className="flex cursor-grab items-center gap-3 border-b border-zinc-200 bg-zinc-50/90 px-4 py-3 active:cursor-grabbing"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-[#F39200]/20 bg-[#fffdfa] text-[#F39200]">
                                <Network className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate text-[10px] font-black uppercase tracking-[0.18em] text-zinc-900">
                                    Minimapa de estructura
                                </div>
                                <div className="truncate text-[10px] font-semibold text-zinc-500">
                                    Navega por la jerarquía completa y expande o contrae ramas sin salir del gráfico.
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => setMiniMapMinimized((prev) => !prev)}
                                    className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800"
                                    title={miniMapMinimized ? 'Restaurar minimapa' : 'Minimizar minimapa'}
                                >
                                    {miniMapMinimized ? <ChevronUp className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setMiniMapOpen(false)}
                                    className="rounded-xl border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800"
                                    title="Cerrar minimapa"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        {!miniMapMinimized && (
                        <div className="max-h-[70vh] overflow-auto px-4 py-4">
                            <div className="mb-3 space-y-2">
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                                    <input
                                        value={miniMapSearch}
                                        onChange={(event) => setMiniMapSearch(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                handleMiniMapSearchNavigate();
                                            }
                                        }}
                                        placeholder={`Buscar ${moduleType === 'edt' ? 'cuenta o participante' : 'hito o responsable'}...`}
                                        className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-20 text-[11px] font-semibold text-zinc-700 outline-none transition focus:border-[#F39200]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleMiniMapSearchNavigate()}
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
                                                onClick={() => handleMiniMapSearchNavigate(match)}
                                                className="rounded-full border border-[#F39200]/22 bg-[#fffdfa] px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-[#F39200] transition hover:border-[#F39200]/40"
                                            >
                                                {match.codigo || 'TBD'}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                {miniMapFilteredTree.map((node) => (
                                    <MiniMapBranch
                                        key={node.id}
                                        node={node}
                                        selectedNodeId={selectedGraphNodeId}
                                        onSelect={handleSelect}
                                        collapsedIds={collapsedIds}
                                        onToggleCollapse={handleToggleCollapse}
                                    />
                                ))}
                                {miniMapSearch && miniMapFilteredTree.length === 0 && (
                                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-4 text-center text-[10px] font-bold text-zinc-500">
                                        Sin coincidencias en el minimapa.
                                    </div>
                                )}
                            </div>
                        </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HierarchyGraphView;
