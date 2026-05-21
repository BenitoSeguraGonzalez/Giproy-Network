export const clampGanttZoom = (value, min = 0.35, max = 3.5) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return min;
    return Math.min(Math.max(Number(numeric.toFixed(2)), min), max);
};

export const buildDeferredZoomViewport = ({
    committedZoomLevel = 1,
    previewZoomLevel = 1,
    timelineCanvasWidthPx = 0,
    viewportSnapshot = null,
}) => {
    const committed = Math.max(0.01, Number(committedZoomLevel || 1));
    const preview = Math.max(0.01, Number(previewZoomLevel || committed));
    const renderRatio = Math.max(0.1, preview / committed);
    const renderCanvasWidthPx = Math.max(1, Math.round(Number(timelineCanvasWidthPx || 0) * renderRatio));
    const safeSnapshot = viewportSnapshot || { scrollLeft: 0, width: 0 };
    return {
        renderRatio,
        renderCanvasWidthPx,
        logicalViewport: {
            scrollLeft: Number(safeSnapshot.scrollLeft || 0) / renderRatio,
            width: Number(safeSnapshot.width || 0) / renderRatio,
        },
    };
};
