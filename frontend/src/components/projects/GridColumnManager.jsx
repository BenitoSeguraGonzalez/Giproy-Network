import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { ArrowDown, ArrowUp, Check, Columns3, Eye, EyeOff, RotateCcw } from 'lucide-react';
import { ControlRailIconButton } from '../ui/ControlRail';

const normalizeColumnSettings = (columns = [], settings = {}) => {
    const ids = columns.map((column) => column.id || column.key).filter(Boolean);
    const known = new Set(ids);
    const locked = new Set(columns.filter((column) => column.locked).map((column) => column.id || column.key));
    const order = [
        ...(Array.isArray(settings?.order) ? settings.order.filter((id) => known.has(id)) : []),
        ...ids.filter((id) => !(Array.isArray(settings?.order) ? settings.order : []).includes(id)),
    ];
    const hidden = new Set(Array.isArray(settings?.hidden) ? settings.hidden.filter((id) => known.has(id) && !locked.has(id)) : []);
    return { order, hidden: Array.from(hidden) };
};

const readSettings = (storageKey, columns) => {
    if (!storageKey || typeof window === 'undefined' || !window.localStorage) {
        return normalizeColumnSettings(columns);
    }
    try {
        const raw = window.localStorage.getItem(storageKey);
        return normalizeColumnSettings(columns, raw ? JSON.parse(raw) : {});
    } catch {
        return normalizeColumnSettings(columns);
    }
};

const writeSettings = (storageKey, settings) => {
    if (!storageKey || typeof window === 'undefined' || !window.localStorage) return;
    try {
        window.localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
        // Las preferencias visuales no deben impedir el uso del grid.
    }
};

export const useGridColumnSettings = ({ columns = [], storageKey = '' }) => {
    const [settings, setSettings] = useState(() => readSettings(storageKey, columns));

    useEffect(() => {
        setSettings(readSettings(storageKey, columns));
    }, [storageKey, columns]);

    useEffect(() => {
        writeSettings(storageKey, settings);
    }, [settings, storageKey]);

    const normalized = useMemo(() => normalizeColumnSettings(columns, settings), [columns, settings]);
    const columnMap = useMemo(() => new Map(columns.map((column) => [column.id || column.key, column])), [columns]);
    const hiddenSet = useMemo(() => new Set(normalized.hidden), [normalized.hidden]);
    const orderedColumns = useMemo(() => normalized.order.map((id) => columnMap.get(id)).filter(Boolean), [columnMap, normalized.order]);
    const visibleColumns = useMemo(() => orderedColumns.filter((column) => column.locked || !hiddenSet.has(column.id || column.key)), [hiddenSet, orderedColumns]);
    const visibleColumnIds = useMemo(() => visibleColumns.map((column) => column.id || column.key), [visibleColumns]);
    const columnIndexById = useMemo(() => new Map(visibleColumnIds.map((id, index) => [id, index + 1])), [visibleColumnIds]);
    const visibleWidths = useMemo(() => visibleColumns.map((column) => Number(column.width || 0)), [visibleColumns]);
    const gridTemplateColumns = useMemo(() => visibleWidths.map((width) => `${width}px`).join(' '), [visibleWidths]);
    const contentWidth = useMemo(() => visibleWidths.reduce((total, width) => total + width, 0), [visibleWidths]);

    const toggleColumn = (columnId) => {
        const column = columnMap.get(columnId);
        if (!column || column.locked) return;
        setSettings((current) => {
            const next = normalizeColumnSettings(columns, current);
            const hidden = new Set(next.hidden);
            if (hidden.has(columnId)) hidden.delete(columnId);
            else hidden.add(columnId);
            return { ...next, hidden: Array.from(hidden) };
        });
    };

    const moveColumn = (columnId, direction) => {
        const column = columnMap.get(columnId);
        if (!column || column.locked) return;
        setSettings((current) => {
            const next = normalizeColumnSettings(columns, current);
            const index = next.order.indexOf(columnId);
            const target = direction === 'up' ? index - 1 : index + 1;
            if (index < 0 || target < 0 || target >= next.order.length) return next;
            const targetColumn = columnMap.get(next.order[target]);
            if (targetColumn?.locked) return next;
            const order = [...next.order];
            [order[index], order[target]] = [order[target], order[index]];
            return { ...next, order };
        });
    };

    const resetColumns = () => setSettings(normalizeColumnSettings(columns));
    const isColumnVisible = (columnId) => columnMap.get(columnId)?.locked || !hiddenSet.has(columnId);
    const getCellGridStyle = (columnId, extra = {}) => {
        const index = columnIndexById.get(columnId);
        if (!index) return { display: 'none' };
        return {
            ...extra,
            gridColumn: `${index} / ${index + 1}`,
            gridRow: '1 / 2',
            order: index,
            minWidth: 0,
        };
    };

    return {
        settings: normalized,
        orderedColumns,
        visibleColumns,
        visibleColumnIds,
        visibleWidths,
        gridTemplateColumns,
        contentWidth,
        columnIndexById,
        toggleColumn,
        moveColumn,
        resetColumns,
        isColumnVisible,
        getCellGridStyle,
    };
};

const GridColumnManager = ({
    columns = [],
    settings,
    onToggleColumn,
    onMoveColumn,
    onResetColumns,
    label = 'Columnas',
}) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef(null);
    const menuRef = useRef(null);
    const [portalStyle, setPortalStyle] = useState(null);
    const hiddenSet = useMemo(() => new Set(settings?.hidden || []), [settings?.hidden]);
    const orderedColumns = useMemo(() => {
        const columnMap = new Map(columns.map((column) => [column.id || column.key, column]));
        return (settings?.order || columns.map((column) => column.id || column.key)).map((id) => columnMap.get(id)).filter(Boolean);
    }, [columns, settings?.order]);

    useEffect(() => {
        if (!open) return undefined;
        const updateMenuPosition = () => {
            const node = rootRef.current;
            if (!node || typeof window === 'undefined') return;
            const rect = node.getBoundingClientRect();
            const viewportPadding = 12;
            const menuWidth = Math.min(288, Math.max(240, window.innerWidth - (viewportPadding * 2)));
            const left = Math.min(
                window.innerWidth - menuWidth - viewportPadding,
                Math.max(viewportPadding, rect.left),
            );
            setPortalStyle({
                position: 'fixed',
                left: `${left}px`,
                top: `${rect.bottom + 9}px`,
                width: `${menuWidth}px`,
            });
        };
        updateMenuPosition();
        const handlePointerDown = (event) => {
            if (rootRef.current?.contains(event.target)) return;
            if (menuRef.current?.contains(event.target)) return;
            setOpen(false);
        };
        document.addEventListener('scroll', updateMenuPosition, true);
        window.addEventListener('resize', updateMenuPosition);
        document.addEventListener('pointerdown', handlePointerDown, true);
        return () => {
            document.removeEventListener('pointerdown', handlePointerDown, true);
            document.removeEventListener('scroll', updateMenuPosition, true);
            window.removeEventListener('resize', updateMenuPosition);
        };
    }, [open]);

    const menuNode = open && portalStyle && typeof document !== 'undefined'
        ? createPortal(
            <motion.div
                ref={menuRef}
                initial={{ opacity: 0, y: -6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25, mass: 0.82 }}
                className="z-[260] overflow-hidden rounded-[1rem] border border-white/10 bg-[#11141a] p-2 text-white shadow-[0_22px_50px_rgba(0,0,0,0.38)]"
                style={portalStyle}
                onPointerDown={(event) => {
                    event.stopPropagation();
                }}
                onClick={(event) => {
                    event.stopPropagation();
                }}
            >
                <div className="flex items-center justify-between gap-2 px-2 py-1">
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Grid</p>
                        <p className="text-[11px] font-black uppercase tracking-[0.12em] text-white/90">{label}</p>
                    </div>
                    <button
                        type="button"
                        onClick={onResetColumns}
                        className="inline-flex h-7 items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2 text-[8px] font-black uppercase tracking-[0.12em] text-white/65 transition hover:bg-white/[0.09] hover:text-white"
                    >
                        <RotateCcw className="h-3 w-3" />
                        Reset
                    </button>
                </div>
                <div className="gantt-dark-scrollbar mt-2 max-h-[20rem] space-y-1 overflow-y-auto pr-1">
                    {orderedColumns.map((column, index) => {
                        const columnId = column.id || column.key;
                        const visible = column.locked || !hiddenSet.has(columnId);
                        return (
                            <div key={columnId} className="flex items-center gap-1 rounded-[0.85rem] border border-white/8 bg-white/[0.035] p-1.5">
                                <button
                                    type="button"
                                    onClick={() => onToggleColumn(columnId)}
                                    disabled={column.locked}
                                    className={`inline-flex h-7 w-7 items-center justify-center rounded-full border transition ${
                                        visible
                                            ? 'border-[#F39200]/40 bg-[#F39200]/14 text-[#ffbe64]'
                                            : 'border-white/10 bg-transparent text-white/35'
                                    } ${column.locked ? 'cursor-not-allowed opacity-70' : 'hover:border-[#F39200]/55 hover:text-[#ffbe64]'}`}
                                    title={column.locked ? 'Columna fija obligatoria' : (visible ? 'Ocultar columna' : 'Mostrar columna')}
                                >
                                    {column.locked ? <Check className="h-3.5 w-3.5" /> : visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                                </button>
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-[10px] font-black uppercase tracking-[0.1em] text-white/88">{column.label}</p>
                                    {column.locked ? <p className="text-[8px] font-bold uppercase tracking-[0.1em] text-white/32">Siempre visible</p> : null}
                                </div>
                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => onMoveColumn(columnId, 'up')}
                                        disabled={column.locked || index === 0 || orderedColumns[index - 1]?.locked}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/54 transition hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-20"
                                        title="Subir columna"
                                    >
                                        <ArrowUp className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onMoveColumn(columnId, 'down')}
                                        disabled={column.locked || index === orderedColumns.length - 1}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white/54 transition hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-20"
                                        title="Bajar columna"
                                    >
                                        <ArrowDown className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </motion.div>,
            document.body,
        )
        : null;

    return (
        <div
            ref={rootRef}
            className="relative z-[165] shrink-0"
            onPointerDown={(event) => {
                event.stopPropagation();
            }}
            onClick={(event) => {
                event.stopPropagation();
            }}
        >
            <ControlRailIconButton
                onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    setOpen((current) => !current);
                }}
                active={open}
                tooltip={label}
                aria-label={label}
            >
                <Columns3 className="h-3.5 w-3.5" />
            </ControlRailIconButton>
            {menuNode}
        </div>
    );
};

export default GridColumnManager;
