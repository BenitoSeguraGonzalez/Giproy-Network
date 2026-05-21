export const resolveTimelineVirtualWindow = ({
    scrollLeft = 0,
    viewportWidth = 0,
    columnWidth = 1,
    totalColumns = 0,
    overscanColumns = 6,
}) => {
    const safeColumnWidth = Math.max(1, Number(columnWidth || 1));
    const safeTotalColumns = Math.max(0, Number(totalColumns || 0));
    const safeOverscan = Math.max(0, Number(overscanColumns || 0));
    if (!safeTotalColumns) {
        return {
            startIndex: 0,
            endIndex: 0,
            offsetLeftPx: 0,
            widthPx: 0,
        };
    }

    const rawStart = Math.floor(Math.max(0, Number(scrollLeft || 0)) / safeColumnWidth);
    const rawVisibleCount = Math.max(1, Math.ceil(Math.max(1, Number(viewportWidth || 0)) / safeColumnWidth));
    const startIndex = Math.max(0, rawStart - safeOverscan);
    const endIndex = Math.min(safeTotalColumns - 1, rawStart + rawVisibleCount + safeOverscan);
    return {
        startIndex,
        endIndex,
        offsetLeftPx: startIndex * safeColumnWidth,
        widthPx: (Math.max(0, endIndex - startIndex) + 1) * safeColumnWidth,
    };
};

export const buildVirtualRowMetrics = (rows = [], resolveRowHeight = () => 0) => {
    const safeRows = Array.isArray(rows) ? rows : [];
    const offsets = new Array(safeRows.length);
    const heights = new Array(safeRows.length);
    const indexById = new Map();
    let totalHeight = 0;

    safeRows.forEach((row, index) => {
        const rowId = String(row?.budget_line_id ?? row?.linea_id ?? index);
        const rowHeight = Math.max(1, Number(resolveRowHeight(row) || 0));
        offsets[index] = totalHeight;
        heights[index] = rowHeight;
        totalHeight += rowHeight;
        indexById.set(rowId, index);
    });

    return {
        offsets,
        heights,
        totalHeight,
        indexById,
    };
};

const findRowIndexAtOffset = (offsets = [], heights = [], targetOffset = 0) => {
    if (!offsets.length) return 0;
    const safeTargetOffset = Math.max(0, Number(targetOffset || 0));
    let low = 0;
    let high = offsets.length - 1;

    while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        const start = Number(offsets[mid] || 0);
        const end = start + Math.max(1, Number(heights[mid] || 1));
        if (safeTargetOffset < start) {
            high = mid - 1;
            continue;
        }
        if (safeTargetOffset >= end) {
            low = mid + 1;
            continue;
        }
        return mid;
    }

    return Math.max(0, Math.min(offsets.length - 1, low));
};

export const resolveVerticalVirtualWindow = ({
    scrollTop = 0,
    viewportHeight = 0,
    rowMetrics = null,
    overscanRows = 6,
}) => {
    const totalRows = Array.isArray(rowMetrics?.offsets) ? rowMetrics.offsets.length : 0;
    if (!totalRows) {
        return {
            startIndex: 0,
            endIndex: -1,
            offsetTopPx: 0,
            bottomSpacerPx: 0,
            visibleHeightPx: 0,
        };
    }

    const offsets = rowMetrics.offsets;
    const heights = rowMetrics.heights;
    const totalHeight = Math.max(0, Number(rowMetrics.totalHeight || 0));
    const safeOverscan = Math.max(0, Number(overscanRows || 0));
    const safeViewportHeight = Math.max(1, Number(viewportHeight || 0));
    const viewportStart = Math.max(0, Number(scrollTop || 0));
    const viewportEnd = viewportStart + safeViewportHeight;

    const rawStart = findRowIndexAtOffset(offsets, heights, viewportStart);
    const rawEnd = findRowIndexAtOffset(offsets, heights, Math.max(0, viewportEnd - 1));
    const startIndex = Math.max(0, rawStart - safeOverscan);
    const endIndex = Math.min(totalRows - 1, rawEnd + safeOverscan);
    const offsetTopPx = Number(offsets[startIndex] || 0);
    const lastRowOffset = Number(offsets[endIndex] || 0);
    const lastRowHeight = Math.max(1, Number(heights[endIndex] || 1));
    const renderedBottom = lastRowOffset + lastRowHeight;
    const visibleHeightPx = Math.max(0, renderedBottom - offsetTopPx);

    return {
        startIndex,
        endIndex,
        offsetTopPx,
        bottomSpacerPx: Math.max(0, totalHeight - renderedBottom),
        visibleHeightPx,
    };
};
