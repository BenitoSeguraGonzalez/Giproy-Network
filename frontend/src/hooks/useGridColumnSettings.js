import { useEffect, useMemo, useState } from 'react';

const normalizeColumnSettings = (columns = [], settings = {}) => {
    const ids = columns.map((column) => column.id || column.key).filter(Boolean);
    const known = new Set(ids);
    const locked = new Set(columns.filter((column) => column.locked).map((column) => column.id || column.key));
    const requestedOrder = Array.isArray(settings?.order) ? settings.order : [];
    const order = [...requestedOrder.filter((id) => known.has(id)), ...ids.filter((id) => !requestedOrder.includes(id))];
    const hidden = new Set(Array.isArray(settings?.hidden) ? settings.hidden.filter((id) => known.has(id) && !locked.has(id)) : []);
    return { order, hidden: Array.from(hidden) };
};

const readSettings = (storageKey, columns) => {
    if (!storageKey || typeof window === 'undefined' || !window.localStorage) return normalizeColumnSettings(columns);
    try { const raw = window.localStorage.getItem(storageKey); return normalizeColumnSettings(columns, raw ? JSON.parse(raw) : {}); } catch { return normalizeColumnSettings(columns); }
};

const writeSettings = (storageKey, settings) => {
    if (!storageKey || typeof window === 'undefined' || !window.localStorage) return;
    try { window.localStorage.setItem(storageKey, JSON.stringify(settings)); } catch { /* preferencias visuales no bloquean el grid */ }
};

export const useGridColumnSettings = ({ columns = [], storageKey = '' }) => {
    const [settings, setSettings] = useState(() => readSettings(storageKey, columns));
    useEffect(() => { setSettings(readSettings(storageKey, columns)); }, [storageKey, columns]);
    useEffect(() => { writeSettings(storageKey, settings); }, [settings, storageKey]);
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
    const toggleColumn = (columnId) => { const column = columnMap.get(columnId); if (!column || column.locked) return; setSettings((current) => { const next = normalizeColumnSettings(columns, current); const hidden = new Set(next.hidden); if (hidden.has(columnId)) hidden.delete(columnId); else hidden.add(columnId); return { ...next, hidden: Array.from(hidden) }; }); };
    const moveColumn = (columnId, direction) => { const column = columnMap.get(columnId); if (!column || column.locked) return; setSettings((current) => { const next = normalizeColumnSettings(columns, current); const index = next.order.indexOf(columnId); const target = direction === 'up' ? index - 1 : index + 1; if (index < 0 || target < 0 || target >= next.order.length) return next; const targetColumn = columnMap.get(next.order[target]); if (targetColumn?.locked) return next; const order = [...next.order]; [order[index], order[target]] = [order[target], order[index]]; return { ...next, order }; }); };
    const resetColumns = () => setSettings(normalizeColumnSettings(columns));
    const isColumnVisible = (columnId) => columnMap.get(columnId)?.locked || !hiddenSet.has(columnId);
    const getCellGridStyle = (columnId, extra = {}) => { const index = columnIndexById.get(columnId); if (!index) return { display: 'none' }; return { ...extra, gridColumn: `${index} / ${index + 1}`, gridRow: '1 / 2', order: index, minWidth: 0 }; };
    return { settings: normalized, orderedColumns, visibleColumns, visibleColumnIds, visibleWidths, gridTemplateColumns, contentWidth, columnIndexById, toggleColumn, moveColumn, resetColumns, isColumnVisible, getCellGridStyle };
};
