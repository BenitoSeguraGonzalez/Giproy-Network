import { roundDecimalNumber } from './decimalNumbers';

const toFiniteNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const makeEmptySync = () => ({
    days: 0,
    hours: 0,
    directDays: 0,
    directHours: 0,
    totalRows: 0,
    scheduledRows: 0,
    status: 'none',
});

const mergeSync = (items = []) => {
    const merged = items.reduce((acc, item) => ({
        days: acc.days + toFiniteNumber(item?.days),
        hours: acc.hours + toFiniteNumber(item?.hours),
        directDays: acc.directDays + toFiniteNumber(item?.directDays),
        directHours: acc.directHours + toFiniteNumber(item?.directHours),
        totalRows: acc.totalRows + toFiniteNumber(item?.totalRows),
        scheduledRows: acc.scheduledRows + toFiniteNumber(item?.scheduledRows),
    }), makeEmptySync());

    const status = merged.totalRows <= 0
        ? 'none'
        : merged.scheduledRows <= 0
            ? 'pending'
            : merged.scheduledRows < merged.totalRows
                ? 'partial'
                : 'defined';

    return {
        ...merged,
        days: roundDecimalNumber(merged.days, 4),
        hours: roundDecimalNumber(merged.hours, 4),
        directDays: roundDecimalNumber(merged.directDays, 4),
        directHours: roundDecimalNumber(merged.directHours, 4),
        status,
    };
};

export const buildEdtGanttDurationSync = ({ tree, rows }) => {
    const rowsByEdt = (rows || []).reduce((acc, row) => {
        const edtId = Number(row?.edt_id || 0);
        const lineId = Number(row?.presupuesto_linea_id || row?.linea_id || 0);
        if (!edtId || !lineId) return acc;
        if (!acc[edtId]) acc[edtId] = [];
        acc[edtId].push(row);
        return acc;
    }, {});

    const walk = (node) => {
        const directRows = rowsByEdt[Number(node?.id)] || [];
        const direct = directRows.reduce((acc, row) => {
            const days = toFiniteNumber(row?.dias_utiles || row?.dias_calendario || 0);
            const hours = toFiniteNumber(row?.duracion_horas || (days * 8));
            return {
                days: acc.days + days,
                hours: acc.hours + hours,
                directDays: acc.directDays + days,
                directHours: acc.directHours + hours,
                totalRows: acc.totalRows + 1,
                scheduledRows: acc.scheduledRows + (days > 0 || hours > 0 ? 1 : 0),
            };
        }, makeEmptySync());

        const children = (node.hijos || []).map(walk);
        const sync = mergeSync([direct, ...children.map((child) => child.gantt_duration_sync)]);

        return {
            ...node,
            hijos: children,
            gantt_duration_sync: sync,
        };
    };

    const syncedTree = (tree || []).map(walk);
    const summary = mergeSync(syncedTree.map((node) => node.gantt_duration_sync));

    return { tree: syncedTree, summary };
};

export const formatEdtGanttDurationDays = (days) => {
    const value = roundDecimalNumber(days || 0, 2);
    return `${value.toLocaleString('es-ES', { minimumFractionDigits: value % 1 === 0 ? 0 : 2, maximumFractionDigits: 2 })} d`;
};
