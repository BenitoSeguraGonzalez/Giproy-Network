import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Building2, Link2, Maximize2, Move, Search } from 'lucide-react';

const VIEWER_BACKGROUND = '#F8FAFC';
const GRID_COLOR = '#E4E4E7';
const ELEMENT_FILL = '#CBD5E1';
const ELEMENT_BORDER = '#64748B';
const ELEMENT_ACTIVE_FILL = '#F39200';
const ELEMENT_ACTIVE_BORDER = '#C26F00';
const ELEMENT_LINKED_FILL = '#DBEAFE';
const ELEMENT_LINKED_BORDER = '#2563EB';
const ELEMENT_WARNING_BORDER = '#D97706';
const ELEMENT_ERROR_BORDER = '#DC2626';

const toFiniteNumber = (value, fallback) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizePolygonPoints = (points = []) => {
    return points
        .map((point) => ({
            x: Number(point?.x),
            y: Number(point?.y),
        }))
        .filter((point) => Number.isFinite(point.x) && Number.isFinite(point.y));
};

const distanceToSegment = (point, start, end) => {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    if (Math.abs(dx) < Number.EPSILON && Math.abs(dy) < Number.EPSILON) {
        return Math.hypot(point.x - start.x, point.y - start.y);
    }

    const projection = ((point.x - start.x) * dx + (point.y - start.y) * dy) / (dx * dx + dy * dy);
    const clampedProjection = Math.max(0, Math.min(1, projection));
    const projectedX = start.x + clampedProjection * dx;
    const projectedY = start.y + clampedProjection * dy;
    return Math.hypot(point.x - projectedX, point.y - projectedY);
};

const getElementIndicatorPoint = (element) => {
    if (element.geometryType === 'line' && element.linePoints?.length === 2) {
        return {
            x: element.linePoints[1].x,
            y: element.linePoints[1].y,
        };
    }

    return {
        x: element.x + element.width - 10,
        y: element.y + 10,
    };
};

const getElementValidationPoint = (element) => {
    if (element.geometryType === 'line' && element.linePoints?.length === 2) {
        return {
            x: Math.min(element.linePoints[0].x, element.linePoints[1].x),
            y: Math.min(element.linePoints[0].y, element.linePoints[1].y),
        };
    }

    return {
        x: element.x + 10,
        y: element.y + 10,
    };
};

const pointInPolygon = (point, polygonPoints = []) => {
    if (polygonPoints.length < 3) {
        return false;
    }

    let inside = false;
    for (let i = 0, j = polygonPoints.length - 1; i < polygonPoints.length; j = i++) {
        const xi = polygonPoints[i].x;
        const yi = polygonPoints[i].y;
        const xj = polygonPoints[j].x;
        const yj = polygonPoints[j].y;
        const crosses = yi > point.y !== yj > point.y;
        if (!crosses) {
            continue;
        }
        const denominator = yj - yi;
        const safeDenominator = Math.abs(denominator) < Number.EPSILON ? Number.EPSILON : denominator;
        const intersectionX = ((xj - xi) * (point.y - yi)) / safeDenominator + xi;
        if (point.x < intersectionX) {
            inside = !inside;
        }
    }
    return inside;
};

const drawPolygonPath = (context, polygonPoints = []) => {
    if (polygonPoints.length < 2) {
        return;
    }
    context.beginPath();
    context.moveTo(polygonPoints[0].x, polygonPoints[0].y);
    polygonPoints.slice(1).forEach((point) => {
        context.lineTo(point.x, point.y);
    });
    context.closePath();
};

const buildElementLayout = (elements = []) => {
    return elements.map((element, index) => {
        const geometry = element?.metadata_json?.geometry_2d || {};
        const polygonPoints = normalizePolygonPoints(geometry?.points || []);
        if (polygonPoints.length === 2) {
            const [startPoint, endPoint] = polygonPoints;
            const minX = Math.min(startPoint.x, endPoint.x);
            const minY = Math.min(startPoint.y, endPoint.y);
            const maxX = Math.max(startPoint.x, endPoint.x);
            const maxY = Math.max(startPoint.y, endPoint.y);

            return {
                ...element,
                x: minX,
                y: minY,
                width: Math.max(12, maxX - minX),
                height: Math.max(12, maxY - minY),
                linePoints: polygonPoints,
                geometrySource: 'imported',
                geometryType: 'line',
            };
        }
        if (polygonPoints.length >= 3) {
            const minX = Math.min(...polygonPoints.map((point) => point.x));
            const minY = Math.min(...polygonPoints.map((point) => point.y));
            const maxX = Math.max(...polygonPoints.map((point) => point.x));
            const maxY = Math.max(...polygonPoints.map((point) => point.y));

            return {
                ...element,
                x: minX,
                y: minY,
                width: Math.max(20, maxX - minX),
                height: Math.max(16, maxY - minY),
                polygonPoints,
                geometrySource: 'imported',
                geometryType: 'polygon',
            };
        }
        const hasGeometry =
            geometry &&
            Number.isFinite(Number(geometry.x)) &&
            Number.isFinite(Number(geometry.y)) &&
            Number.isFinite(Number(geometry.width)) &&
            Number.isFinite(Number(geometry.height));

        if (hasGeometry) {
            return {
                ...element,
                x: toFiniteNumber(geometry.x, 48),
                y: toFiniteNumber(geometry.y, 48),
                width: Math.max(20, toFiniteNumber(geometry.width, 80)),
                height: Math.max(16, toFiniteNumber(geometry.height, 40)),
                geometrySource: 'imported',
                geometryType: 'rect',
            };
        }

        const width = 64 + ((element.id % 3) * 18);
        const height = 42 + ((element.id % 4) * 12);
        const column = index % 4;
        const row = Math.floor(index / 4);
        const offsetSeed = element.id % 11;

        return {
            ...element,
            x: 48 + column * 122 + offsetSeed * 1.5,
            y: 48 + row * 96 + (offsetSeed % 5) * 4,
            width,
            height,
            geometrySource: 'derived',
            geometryType: 'rect',
        };
    });
};

const hitTestElement = (element, point) => {
    if (element.geometryType === 'line' && element.linePoints?.length === 2) {
        return distanceToSegment(point, element.linePoints[0], element.linePoints[1]) <= 10;
    }
    if (element.geometryType === 'polygon' && element.polygonPoints?.length >= 3) {
        return pointInPolygon(point, element.polygonPoints);
    }
    return (
        point.x >= element.x &&
        point.x <= element.x + element.width &&
        point.y >= element.y &&
        point.y <= element.y + element.height
    );
};

const getCanvasPoint = (event, canvas, viewport) => {
    const rect = canvas.getBoundingClientRect();
    const x = (event.clientX - rect.left - viewport.offsetX) / viewport.scale;
    const y = (event.clientY - rect.top - viewport.offsetY) / viewport.scale;
    return { x, y };
};

const computeSceneBounds = (elements = []) => {
    if (elements.length === 0) {
        return { minX: 0, minY: 0, maxX: 1, maxY: 1, width: 1, height: 1 };
    }

    const minX = Math.min(...elements.map((element) => element.x));
    const minY = Math.min(...elements.map((element) => element.y));
    const maxX = Math.max(...elements.map((element) => element.x + element.width));
    const maxY = Math.max(...elements.map((element) => element.y + element.height));

    return {
        minX,
        minY,
        maxX,
        maxY,
        width: Math.max(1, maxX - minX),
        height: Math.max(1, maxY - minY),
    };
};

const countValidationSeverity = (elements = [], validationIssuesByElementId = {}) =>
    elements.reduce(
        (summary, element) => {
            const issues = validationIssuesByElementId[element.id] || [];
            if (issues.some((issue) => issue.severity === 'error')) {
                summary.errors += 1;
            } else if (issues.some((issue) => issue.severity === 'warning')) {
                summary.warnings += 1;
            }
            return summary;
        },
        { errors: 0, warnings: 0 },
    );

const BimCanvasViewer = ({
    elements = [],
    ready,
    error,
    selectedElement,
    selectedLink,
    linkedElementIds = [],
    highlightedElementIds = [],
    elementLinkCounts = {},
    validationIssuesByElementId = {},
    onSelectElement,
    activeVersionLabel,
    activeStoreyName,
}) => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const minimapRef = useRef(null);
    const dragStateRef = useRef(null);
    const minimapDragStateRef = useRef(null);
    const [viewport, setViewport] = useState({ scale: 1, offsetX: 24, offsetY: 24 });
    const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
    const [hoveredElementId, setHoveredElementId] = useState(null);
    const [hoverScreenPoint, setHoverScreenPoint] = useState(null);
    const [showOnlyLinked, setShowOnlyLinked] = useState(false);
    const [activeIfcClass, setActiveIfcClass] = useState('all');

    const linkedElementIdSet = useMemo(() => new Set(linkedElementIds), [linkedElementIds]);
    const highlightedElementIdSet = useMemo(() => new Set(highlightedElementIds), [highlightedElementIds]);
    const ifcClassFilters = useMemo(() => {
        const counts = elements.reduce((accumulator, element) => {
            const ifcClass = element.ifc_class || 'Sin clase IFC';
            accumulator[ifcClass] = (accumulator[ifcClass] || 0) + 1;
            return accumulator;
        }, {});
        return Object.entries(counts)
            .map(([ifcClass, count]) => ({ ifcClass, count }))
            .sort((left, right) => right.count - left.count || left.ifcClass.localeCompare(right.ifcClass))
            .slice(0, 4);
    }, [elements]);
    const filteredElements = useMemo(() => {
        const classFilteredElements =
            activeIfcClass === 'all'
                ? elements
                : elements.filter((element) => (element.ifc_class || 'Sin clase IFC') === activeIfcClass);
        if (!showOnlyLinked) {
            return classFilteredElements;
        }
        return classFilteredElements.filter((element) => linkedElementIdSet.has(element.id));
    }, [activeIfcClass, elements, linkedElementIdSet, showOnlyLinked]);
    const laidOutElements = useMemo(() => buildElementLayout(filteredElements), [filteredElements]);
    const linkedLaidOutElements = useMemo(
        () => laidOutElements.filter((element) => linkedElementIdSet.has(element.id)),
        [laidOutElements, linkedElementIdSet],
    );
    const hoveredElement = laidOutElements.find((element) => element.id === hoveredElementId) || null;
    const sceneBounds = useMemo(() => computeSceneBounds(laidOutElements), [laidOutElements]);
    const visibleLinkedCount = linkedLaidOutElements.length;
    const visibleDerivedCount = useMemo(
        () => laidOutElements.filter((element) => element.geometrySource === 'derived').length,
        [laidOutElements],
    );
    const validationSummary = useMemo(
        () => countValidationSeverity(laidOutElements, validationIssuesByElementId),
        [laidOutElements, validationIssuesByElementId],
    );
    const minimapScale = Math.min(132 / sceneBounds.width, 96 / sceneBounds.height);
    const viewportWorldRect = {
        x: (-viewport.offsetX) / viewport.scale,
        y: (-viewport.offsetY) / viewport.scale,
        width: canvasSize.width / viewport.scale,
        height: canvasSize.height / viewport.scale,
    };

    const fitElements = (targetElements = []) => {
        if (!canvasSize.width || !canvasSize.height || targetElements.length === 0) {
            return;
        }

        const targetBounds = computeSceneBounds(targetElements);
        const padding = 36;
        const availableWidth = Math.max(1, canvasSize.width - padding * 2);
        const availableHeight = Math.max(1, canvasSize.height - padding * 2);
        const nextScale = Math.min(
            1.35,
            Math.max(0.45, Math.min(availableWidth / targetBounds.width, availableHeight / targetBounds.height)),
        );

        setViewport({
            scale: nextScale,
            offsetX: padding - targetBounds.minX * nextScale,
            offsetY: padding - targetBounds.minY * nextScale,
        });
    };

    const fitScene = () => {
        fitElements(laidOutElements);
    };

    const handleFitLinked = () => {
        fitElements(linkedLaidOutElements);
    };

    const handleFitSelected = () => {
        if (!selectedElement) {
            return;
        }
        const targetElement = laidOutElements.find((element) => element.id === selectedElement.id);
        if (!targetElement) {
            return;
        }
        fitElements([targetElement]);
    };

    const fitSelectedCallback = useCallback(() => {
        if (!selectedElement || !canvasSize.width || !canvasSize.height) {
            return;
        }
        const targetElement = laidOutElements.find((element) => element.id === selectedElement.id);
        if (!targetElement) {
            return;
        }

        const desiredScale = Math.min(
            1.6,
            Math.max(
                0.85,
                Math.min(
                    (canvasSize.width * 0.55) / Math.max(targetElement.width, 1),
                    (canvasSize.height * 0.48) / Math.max(targetElement.height, 1),
                ),
            ),
        );
        const targetCenterX = targetElement.x + targetElement.width / 2;
        const targetCenterY = targetElement.y + targetElement.height / 2;

        setViewport((current) => ({
            ...current,
            scale: desiredScale,
            offsetX: canvasSize.width / 2 - targetCenterX * desiredScale,
            offsetY: canvasSize.height / 2 - targetCenterY * desiredScale,
        }));
    }, [canvasSize.height, canvasSize.width, laidOutElements, selectedElement]);

    useEffect(() => {
        fitSelectedCallback();
    }, [fitSelectedCallback]);

    useEffect(() => {
        fitScene();
    }, [activeIfcClass, canvasSize.height, canvasSize.width, showOnlyLinked]);

    useEffect(() => {
        if (activeIfcClass === 'all') {
            return;
        }
        const availableClasses = new Set(elements.map((element) => element.ifc_class || 'Sin clase IFC'));
        if (!availableClasses.has(activeIfcClass)) {
            setActiveIfcClass('all');
        }
    }, [activeIfcClass, elements]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) {
            return undefined;
        }

        const updateSize = () => {
            setCanvasSize({
                width: Math.max(320, Math.floor(container.clientWidth)),
                height: Math.max(320, Math.floor(container.clientHeight)),
            });
        };

        updateSize();
        const observer = new ResizeObserver(updateSize);
        observer.observe(container);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || !canvasSize.width || !canvasSize.height) {
            return;
        }

        canvas.width = canvasSize.width;
        canvas.height = canvasSize.height;

        const context = canvas.getContext('2d');
        if (!context) {
            return;
        }

        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = VIEWER_BACKGROUND;
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.save();
        context.translate(viewport.offsetX, viewport.offsetY);
        context.scale(viewport.scale, viewport.scale);

        for (let axis = -200; axis < 1400; axis += 40) {
            context.beginPath();
            context.strokeStyle = GRID_COLOR;
            context.lineWidth = 1 / viewport.scale;
            context.moveTo(axis, -200);
            context.lineTo(axis, 1400);
            context.stroke();

            context.beginPath();
            context.moveTo(-200, axis);
            context.lineTo(1400, axis);
            context.stroke();
        }

        laidOutElements.forEach((element) => {
            const isActive = element.id === selectedElement?.id;
            const isHighlighted = highlightedElementIdSet.has(element.id);
            const isHovered = element.id === hoveredElementId;
            const isLinked = linkedElementIdSet.has(element.id);
            const hasActiveLink = selectedLink?.bim_element_id === element.id;
            const validationIssues = validationIssuesByElementId[element.id] || [];
            const hasValidationError = validationIssues.some((issue) => issue.severity === 'error');
            const hasValidationWarning = validationIssues.some((issue) => issue.severity === 'warning');
            context.fillStyle = isActive
                ? ELEMENT_ACTIVE_FILL
                : isHighlighted
                  ? '#DBEAFE'
                : hasActiveLink
                  ? '#FED7AA'
                  : isHovered
                    ? '#FDE7C0'
                    : isLinked
                      ? ELEMENT_LINKED_FILL
                      : ELEMENT_FILL;
            context.strokeStyle = isActive
                ? ELEMENT_ACTIVE_BORDER
                : isHighlighted
                  ? '#2563EB'
                : hasValidationError
                  ? ELEMENT_ERROR_BORDER
                  : hasValidationWarning
                    ? ELEMENT_WARNING_BORDER
                : hasActiveLink
                  ? '#EA580C'
                  : isHovered
                    ? '#F39200'
                    : isLinked
                      ? ELEMENT_LINKED_BORDER
                      : ELEMENT_BORDER;
            context.lineWidth = (isActive || isHighlighted ? 3 : hasValidationError ? 3 : isHovered || hasActiveLink || hasValidationWarning ? 2.5 : 2) / viewport.scale;
            if (element.geometryType === 'line' && element.linePoints?.length === 2) {
                context.beginPath();
                context.moveTo(element.linePoints[0].x, element.linePoints[0].y);
                context.lineTo(element.linePoints[1].x, element.linePoints[1].y);
            } else if (element.geometryType === 'polygon' && element.polygonPoints?.length >= 3) {
                drawPolygonPath(context, element.polygonPoints);
            } else {
                context.beginPath();
                context.roundRect(element.x, element.y, element.width, element.height, 10);
            }

            if (hasValidationError || hasValidationWarning) {
                const validationPoint = getElementValidationPoint(element);
                context.beginPath();
                context.fillStyle = hasValidationError ? ELEMENT_ERROR_BORDER : ELEMENT_WARNING_BORDER;
                context.arc(validationPoint.x, validationPoint.y, 4 / viewport.scale, 0, Math.PI * 2);
                context.fill();
            }
            if (element.geometryType !== 'line') {
                context.fill();
            }
            context.stroke();

            if (isLinked) {
                const indicatorPoint = getElementIndicatorPoint(element);
                context.beginPath();
                context.fillStyle = hasActiveLink ? '#EA580C' : '#2563EB';
                context.arc(indicatorPoint.x, indicatorPoint.y, 4 / viewport.scale, 0, Math.PI * 2);
                context.fill();

                const linkCount = Number(elementLinkCounts[element.id] || 0);
                if (linkCount > 0) {
                    context.fillStyle = '#FFFFFF';
                    context.font = `${Math.max(8, 9 / viewport.scale)}px sans-serif`;
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText(String(linkCount), indicatorPoint.x, indicatorPoint.y);
                    context.textAlign = 'start';
                    context.textBaseline = 'top';
                }
            }

            context.fillStyle = isActive ? '#FFFFFF' : '#0F172A';
            context.font = `${Math.max(10, 12 / viewport.scale)}px sans-serif`;
            context.textBaseline = 'top';
            const label = element.nombre || element.global_id || `Elemento ${element.id}`;
            const truncatedLabel = label.length > 18 ? `${label.slice(0, 18)}...` : label;
            const labelX =
                element.geometryType === 'line' && element.linePoints?.length === 2
                    ? Math.min(element.linePoints[0].x, element.linePoints[1].x) + 8
                    : element.x + 10;
            const labelY =
                element.geometryType === 'line' && element.linePoints?.length === 2
                    ? Math.min(element.linePoints[0].y, element.linePoints[1].y) - 6
                    : element.y + 10;
            context.fillText(truncatedLabel, labelX, labelY);

            context.fillStyle = isActive ? '#FFF7ED' : '#475569';
            context.font = `${Math.max(9, 10 / viewport.scale)}px sans-serif`;
            context.fillText(element.ifc_class || 'IFC', labelX, labelY + 16);
        });

        context.restore();
    }, [
        canvasSize.height,
        canvasSize.width,
        hoveredElementId,
        laidOutElements,
        linkedElementIdSet,
        elementLinkCounts,
        highlightedElementIdSet,
        selectedElement?.id,
        selectedLink?.bim_element_id,
        viewport,
    ]);

    const handleWheel = (event) => {
        event.preventDefault();
        const nextScale = event.deltaY > 0 ? viewport.scale * 0.92 : viewport.scale * 1.08;
        setViewport((current) => ({
            ...current,
            scale: Math.min(2.5, Math.max(0.55, nextScale)),
        }));
    };

    const handlePointerDown = (event) => {
        dragStateRef.current = {
            pointerX: event.clientX,
            pointerY: event.clientY,
            offsetX: viewport.offsetX,
            offsetY: viewport.offsetY,
            dragging: false,
        };
    };

    const handlePointerMove = (event) => {
        const dragState = dragStateRef.current;
        if (canvasRef.current) {
            const point = getCanvasPoint(event, canvasRef.current, viewport);
            const hitElement = laidOutElements.find((element) => hitTestElement(element, point)) || null;
            setHoveredElementId(hitElement?.id || null);
            if (hitElement) {
                const containerRect = containerRef.current?.getBoundingClientRect();
                if (containerRect) {
                    setHoverScreenPoint({
                        x: event.clientX - containerRect.left,
                        y: event.clientY - containerRect.top,
                    });
                }
            } else {
                setHoverScreenPoint(null);
            }
        }

        if (!dragState) {
            return;
        }
        const deltaX = event.clientX - dragState.pointerX;
        const deltaY = event.clientY - dragState.pointerY;
        const dragging = Math.abs(deltaX) > 4 || Math.abs(deltaY) > 4;
        dragStateRef.current = { ...dragState, dragging };
        setViewport((current) => ({
            ...current,
            offsetX: dragState.offsetX + deltaX,
            offsetY: dragState.offsetY + deltaY,
        }));
    };

    const handlePointerUp = (event) => {
        const dragState = dragStateRef.current;
        dragStateRef.current = null;

        if (!canvasRef.current || !dragState) {
            return;
        }

        if (dragState.dragging) {
            return;
        }

        const point = getCanvasPoint(event, canvasRef.current, viewport);
        const hitElement = laidOutElements.find((element) => hitTestElement(element, point)) || null;

        onSelectElement?.(hitElement);
    };

    const handleResetViewport = () => {
        setViewport({ scale: 1, offsetX: 24, offsetY: 24 });
    };

    const handleMinimapPointerDown = (event) => {
        if (!minimapRef.current || !canvasSize.width || !canvasSize.height) {
            return;
        }

        minimapDragStateRef.current = {
            dragging: false,
        };
        minimapRef.current.setPointerCapture?.(event.pointerId);

        const rect = minimapRef.current.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        const worldX = sceneBounds.minX + localX / minimapScale;
        const worldY = sceneBounds.minY + localY / minimapScale;

        setViewport((current) => ({
            ...current,
            offsetX: canvasSize.width / 2 - worldX * current.scale,
            offsetY: canvasSize.height / 2 - worldY * current.scale,
        }));
    };

    const handleMinimapPointerMove = (event) => {
        if (!minimapRef.current || !canvasSize.width || !canvasSize.height || !minimapDragStateRef.current) {
            return;
        }

        minimapDragStateRef.current = { dragging: true };
        const rect = minimapRef.current.getBoundingClientRect();
        const localX = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        const localY = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
        const worldX = sceneBounds.minX + localX / minimapScale;
        const worldY = sceneBounds.minY + localY / minimapScale;

        setViewport((current) => ({
            ...current,
            offsetX: canvasSize.width / 2 - worldX * current.scale,
            offsetY: canvasSize.height / 2 - worldY * current.scale,
        }));
    };

    const handleMinimapPointerUp = (event) => {
        minimapRef.current?.releasePointerCapture?.(event.pointerId);
        minimapDragStateRef.current = null;
    };

    return (
        <div
            data-bim-canvas-viewer="isolated"
            data-bim-canvas-ifc-filter={activeIfcClass}
            data-bim-canvas-filtered-elements={filteredElements.length}
            data-bim-canvas-ifc-filter-count={ifcClassFilters.length}
            className="flex min-h-[320px] flex-col rounded-[1.5rem] border border-zinc-200 bg-white"
        >
            <div className="border-b border-zinc-200 px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Canvas BIM</p>
                        <h3 className="mt-1 text-sm font-black uppercase tracking-widest text-zinc-900">
                            Viewer tecnico 2D incubado
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowOnlyLinked((current) => !current)}
                        className={`inline-flex h-9 items-center gap-2 rounded-xl border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                            showOnlyLinked
                                ? 'border-orange-200 bg-orange-50 text-[#F39200]'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-[#F39200] hover:text-[#F39200]'
                        }`}
                    >
                        <Link2 className="h-4 w-4" />
                        {showOnlyLinked ? 'Mostrando vinculados' : 'Solo vinculados'}
                    </button>
                    <button
                        type="button"
                        onClick={fitScene}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                    >
                        <Maximize2 className="h-4 w-4" />
                        Encuadrar escena
                    </button>
                    <button
                        type="button"
                        onClick={handleFitLinked}
                        disabled={linkedLaidOutElements.length === 0}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Link2 className="h-4 w-4" />
                        Encuadrar vinculados
                    </button>
                    <button
                        type="button"
                        onClick={handleFitSelected}
                        disabled={!selectedElement}
                        className="inline-flex h-9 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        <Building2 className="h-4 w-4" />
                        Encuadrar activo
                    </button>
                    <button
                        type="button"
                        onClick={handleResetViewport}
                        className="inline-flex h-9 items-center rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                    >
                        Reset vista
                    </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveIfcClass('all')}
                        className={`rounded-[0.8rem] border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] transition-colors ${
                            activeIfcClass === 'all'
                                ? 'border-[#F39200] bg-orange-50 text-[#F39200]'
                                : 'border-zinc-200 bg-white text-zinc-600 hover:border-[#F39200] hover:text-[#F39200]'
                        }`}
                    >
                        Todas {elements.length}
                    </button>
                    {ifcClassFilters.map((item) => (
                        <button
                            key={item.ifcClass}
                            type="button"
                            onClick={() => setActiveIfcClass(item.ifcClass)}
                            className={`rounded-[0.8rem] border px-2.5 py-1.5 text-[9px] font-black uppercase tracking-[0.14em] transition-colors ${
                                activeIfcClass === item.ifcClass
                                    ? 'border-[#F39200] bg-orange-50 text-[#F39200]'
                                    : 'border-zinc-200 bg-white text-zinc-600 hover:border-[#F39200] hover:text-[#F39200]'
                            }`}
                        >
                            {item.ifcClass} {item.count}
                        </button>
                    ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                        <Search className="h-3.5 w-3.5" />
                        Zoom {Math.round(viewport.scale * 100)}%
                    </span>
                    <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                        <Move className="h-3.5 w-3.5" />
                        Paneo activo
                    </span>
                    {activeVersionLabel ? (
                        <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                            {activeVersionLabel}
                        </span>
                    ) : null}
                    {activeStoreyName ? (
                        <span className="inline-flex items-center rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#F39200]">
                            {activeStoreyName}
                        </span>
                    ) : null}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                        Visibles {laidOutElements.length}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
                        Vinculados {visibleLinkedCount}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                        IFC {activeIfcClass === 'all' ? 'todas' : activeIfcClass}
                    </span>
                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                        Derivados {visibleDerivedCount}
                    </span>
                    {validationSummary.errors > 0 ? (
                        <span className="inline-flex items-center rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-rose-700">
                            Errores {validationSummary.errors}
                        </span>
                    ) : null}
                    {validationSummary.warnings > 0 ? (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                            Advertencias {validationSummary.warnings}
                        </span>
                    ) : null}
                </div>
            </div>

            <div
                ref={containerRef}
                className="relative flex flex-1 overflow-hidden bg-[linear-gradient(135deg,#F8FAFC_0%,#EEF2F7_100%)]"
            >
                {!ready ? (
                    <div className="flex flex-1 items-center justify-center px-8 py-10">
                        <div className="w-full max-w-xl rounded-[1.5rem] border border-dashed border-zinc-300 bg-white/75 px-8 py-10 text-center backdrop-blur">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-[#F39200]">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-black uppercase tracking-tight text-zinc-900">Viewer BIM en espera</h3>
                            <p className="mt-3 text-sm text-zinc-500">
                                Materializa una base BIM del proyecto para activar esta superficie visual del workspace.
                            </p>
                        </div>
                    </div>
                ) : laidOutElements.length === 0 ? (
                    <div className="flex flex-1 items-center justify-center px-8 py-10">
                        <div className="w-full max-w-xl rounded-[1.5rem] border border-dashed border-zinc-300 bg-white/75 px-8 py-10 text-center backdrop-blur">
                            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-[#F39200]">
                                <Building2 className="h-6 w-6" />
                            </div>
                            <h3 className="text-base font-black uppercase tracking-tight text-zinc-900">Sin elementos visibles</h3>
                            <p className="mt-3 text-sm text-zinc-500">
                                Cambia la versión o el nivel filtrado para ver elementos BIM dentro del canvas.
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        <canvas
                            ref={canvasRef}
                            className="h-full w-full cursor-grab touch-none active:cursor-grabbing"
                            onWheel={handleWheel}
                            onPointerDown={handlePointerDown}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onPointerLeave={() => {
                                dragStateRef.current = null;
                                setHoveredElementId(null);
                                setHoverScreenPoint(null);
                            }}
                        />
                        {hoveredElement && hoverScreenPoint ? (
                            <div
                                className="pointer-events-none absolute z-10 w-64 rounded-2xl border border-zinc-200 bg-white/95 px-4 py-3 text-xs shadow-lg backdrop-blur"
                                style={{
                                    left: Math.min(Math.max(hoverScreenPoint.x + 18, 16), Math.max(16, canvasSize.width - 272)),
                                    top: Math.min(Math.max(hoverScreenPoint.y + 18, 16), Math.max(16, canvasSize.height - 152)),
                                }}
                            >
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                    Elemento BIM
                                </p>
                                <p className="mt-1 text-sm font-black text-zinc-900">
                                    {hoveredElement.nombre || hoveredElement.global_id || `Elemento ${hoveredElement.id}`}
                                </p>
                                <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                                    <div className="rounded-xl bg-zinc-50 px-3 py-2">
                                        <p className="font-black uppercase tracking-[0.16em] text-zinc-400">Clase</p>
                                        <p className="mt-1 font-semibold text-zinc-700">{hoveredElement.ifc_class || 'IFC'}</p>
                                    </div>
                                    <div className="rounded-xl bg-zinc-50 px-3 py-2">
                                        <p className="font-black uppercase tracking-[0.16em] text-zinc-400">Nivel</p>
                                        <p className="mt-1 font-semibold text-zinc-700">
                                            {hoveredElement.storey_name || 'Sin nivel'}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-zinc-50 px-3 py-2">
                                        <p className="font-black uppercase tracking-[0.16em] text-zinc-400">Vinculos</p>
                                        <p className="mt-1 font-semibold text-zinc-700">
                                            {elementLinkCounts[hoveredElement.id] || 0}
                                        </p>
                                    </div>
                                    <div className="rounded-xl bg-zinc-50 px-3 py-2">
                                        <p className="font-black uppercase tracking-[0.16em] text-zinc-400">Estado</p>
                                        <p
                                            className={`mt-1 font-semibold ${
                                                linkedElementIdSet.has(hoveredElement.id) ? 'text-[#2563EB]' : 'text-zinc-700'
                                            }`}
                                        >
                                            {linkedElementIdSet.has(hoveredElement.id) ? 'Con vinculos' : 'Sin vinculos'}
                                        </p>
                                    </div>
                                    {(validationIssuesByElementId[hoveredElement.id] || []).length ? (
                                        <div className="col-span-2 rounded-xl bg-zinc-50 px-3 py-2">
                                            <p className="font-black uppercase tracking-[0.16em] text-zinc-400">Validación</p>
                                            <p className="mt-1 font-semibold text-zinc-700">
                                                {(validationIssuesByElementId[hoveredElement.id] || []).some((issue) => issue.severity === 'error')
                                                    ? 'Con errores BIM'
                                                    : 'Con advertencias BIM'}
                                            </p>
                                        </div>
                                    ) : null}
                                    <div className="col-span-2 rounded-xl bg-zinc-50 px-3 py-2">
                                        <p className="font-black uppercase tracking-[0.16em] text-zinc-400">Geometria</p>
                                        <p className="mt-1 font-semibold text-zinc-700">
                                            {hoveredElement.geometrySource === 'imported'
                                                ? 'Importada desde paquete BIM'
                                                : 'Derivada por layout técnico'}
                                        </p>
                                        <p className="mt-1 text-zinc-500">
                                            Tipo:{' '}
                                            {hoveredElement.geometryType === 'polygon'
                                                ? 'Polígono 2D'
                                                : hoveredElement.geometryType === 'line'
                                                  ? 'Línea 2D'
                                                  : 'Rectángulo 2D'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        <div className="pointer-events-none absolute bottom-4 left-4 rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 text-xs text-zinc-500 shadow-sm backdrop-blur">
                            <p className="font-black uppercase tracking-[0.16em] text-zinc-700">
                                {laidOutElements.length} elementos visibles
                            </p>
                            <p className="mt-1">Rueda: zoom • arrastra: paneo • clic: seleccionar</p>
                            <p className="mt-1">Azul: elemento con vínculos • número: total vínculos • Naranja: vínculo activo</p>
                            <p className="mt-1">Geometría importada: admite rectángulos, líneas y polígonos 2D desde el paquete JSON BIM</p>
                            <p className="mt-1">Rojo/ámbar: elementos con hallazgos de validación BIM</p>
                            {showOnlyLinked ? <p className="mt-1 font-bold text-[#2563EB]">Filtro activo: solo elementos vinculados</p> : null}
                            {activeIfcClass !== 'all' ? (
                                <p className="mt-1 font-bold text-[#F39200]">Filtro IFC activo: {activeIfcClass}</p>
                            ) : null}
                            {selectedElement ? (
                                <p className="mt-2 font-bold text-[#F39200]">
                                    Activo: {selectedElement.nombre || selectedElement.global_id}
                                </p>
                            ) : null}
                            {hoveredElement && hoveredElement.id !== selectedElement?.id ? (
                                <p className="mt-1 font-bold text-zinc-600">
                                    Hover: {hoveredElement.nombre || hoveredElement.global_id}
                                </p>
                            ) : null}
                            {error ? <p className="mt-2 font-bold text-rose-500">No se pudo actualizar el workspace BIM.</p> : null}
                        </div>
                        <div className="pointer-events-none absolute left-4 top-4 rounded-2xl border border-zinc-200 bg-white/90 px-4 py-3 text-xs text-zinc-500 shadow-sm backdrop-blur">
                            <p className="font-black uppercase tracking-[0.16em] text-zinc-700">Leyenda BIM</p>
                            <div className="mt-3 flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full border border-zinc-400 bg-[#CBD5E1]" />
                                    <span>Elemento sin vínculos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full border border-[#2563EB] bg-[#DBEAFE]" />
                                    <span>Elemento con vínculos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full border border-[#EA580C] bg-[#FED7AA]" />
                                    <span>Vínculo BIM activo</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full border border-[#C26F00] bg-[#F39200]" />
                                    <span>Elemento seleccionado</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full border border-[#DC2626] bg-white" />
                                    <span>Error de validación</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="h-3 w-3 rounded-full border border-[#D97706] bg-white" />
                                    <span>Advertencia de validación</span>
                                </div>
                            </div>
                            <div className="mt-3 border-t border-zinc-200 pt-3 text-[11px]">
                                <p>
                                    Geometría importada:{' '}
                                    {laidOutElements.filter((element) => element.geometrySource === 'imported').length}
                                </p>
                                <p>Vinculados en escena: {linkedLaidOutElements.length}</p>
                                <p>Total visibles: {laidOutElements.length}</p>
                            </div>
                        </div>
                        <div className="pointer-events-none absolute right-4 top-4 rounded-2xl border border-zinc-200 bg-white/90 p-3 text-xs text-zinc-500 shadow-sm backdrop-blur">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">Minimapa BIM</p>
                            <div
                                ref={minimapRef}
                                role="button"
                                tabIndex={0}
                                onPointerDown={handleMinimapPointerDown}
                                onPointerMove={handleMinimapPointerMove}
                                onPointerUp={handleMinimapPointerUp}
                                onPointerLeave={handleMinimapPointerUp}
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault();
                                        const simulatedEvent = {
                                            clientX: minimapRef.current?.getBoundingClientRect().left + 72,
                                            clientY: minimapRef.current?.getBoundingClientRect().top + 48,
                                        };
                                        handleMinimapPointerDown(simulatedEvent);
                                    }
                                }}
                                className="relative mt-2 h-24 w-36 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                            >
                                {laidOutElements.map((element) => {
                                    const isActive = element.id === selectedElement?.id;
                                    const isHighlighted = highlightedElementIdSet.has(element.id);
                                    const isLinked = linkedElementIdSet.has(element.id);
                                    const hasActiveLink = selectedLink?.bim_element_id === element.id;
                                    const minimapColor = isActive
                                        ? ELEMENT_ACTIVE_FILL
                                        : isHighlighted
                                          ? '#2563EB'
                                        : hasActiveLink
                                          ? '#FB923C'
                                          : isLinked
                                            ? '#60A5FA'
                                            : '#CBD5E1';
                                    const minimapBorderColor = isActive
                                        ? ELEMENT_ACTIVE_BORDER
                                        : isHighlighted
                                          ? '#1D4ED8'
                                        : hasActiveLink
                                          ? '#EA580C'
                                          : isLinked
                                            ? ELEMENT_LINKED_BORDER
                                            : '#94A3B8';
                                    if (element.geometryType === 'line' && element.linePoints?.length === 2) {
                                        const startPoint = element.linePoints[0];
                                        const endPoint = element.linePoints[1];
                                        const deltaX = endPoint.x - startPoint.x;
                                        const deltaY = endPoint.y - startPoint.y;
                                        const lineLength = Math.max(8, Math.hypot(deltaX, deltaY) * minimapScale);
                                        const angle = (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
                                        return (
                                            <div
                                                key={`minimap-${element.id}`}
                                                className="absolute origin-left rounded-full"
                                                style={{
                                                    left: `${(startPoint.x - sceneBounds.minX) * minimapScale}px`,
                                                    top: `${(startPoint.y - sceneBounds.minY) * minimapScale}px`,
                                                    width: `${lineLength}px`,
                                                    height: '3px',
                                                    transform: `rotate(${angle}deg)`,
                                                    backgroundColor: minimapColor,
                                                    boxShadow: `0 0 0 1px ${minimapBorderColor}`,
                                                }}
                                            />
                                        );
                                    }
                                    return (
                                        <div
                                            key={`minimap-${element.id}`}
                                            className="absolute rounded-[4px]"
                                            style={{
                                                left: `${(element.x - sceneBounds.minX) * minimapScale}px`,
                                                top: `${(element.y - sceneBounds.minY) * minimapScale}px`,
                                                width: `${Math.max(6, element.width * minimapScale)}px`,
                                                height: `${Math.max(6, element.height * minimapScale)}px`,
                                                backgroundColor: minimapColor,
                                                border: `1px solid ${minimapBorderColor}`,
                                            }}
                                        />
                                    );
                                })}
                                <div
                                    className="absolute rounded-md border-2 border-[#F39200] bg-[#F39200]/10"
                                    style={{
                                        left: `${Math.max(0, (viewportWorldRect.x - sceneBounds.minX) * minimapScale)}px`,
                                        top: `${Math.max(0, (viewportWorldRect.y - sceneBounds.minY) * minimapScale)}px`,
                                        width: `${Math.min(144, Math.max(12, viewportWorldRect.width * minimapScale))}px`,
                                        height: `${Math.min(96, Math.max(12, viewportWorldRect.height * minimapScale))}px`,
                                    }}
                                />
                            </div>
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                                Clic: reencuadrar • marco naranja: area visible
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default BimCanvasViewer;
