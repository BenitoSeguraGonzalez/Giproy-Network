const DEPENDENCY_CONNECTOR_GAP_PX = 2;
const DEPENDENCY_CONNECTOR_STUB_PX = 8;
const DEPENDENCY_CONNECTOR_LANE_PX = 24;
const DEPENDENCY_GOVERNED_MARKER_INSET_PX = 0;
const DEPENDENCY_ALIGNED_ANCHOR_TOLERANCE_PX = 12;
const DEPENDENCY_TOP_ENTRY_CLEARANCE_PX = 16;
const GANTT_BAR_HEIGHT_PX = 24;

const DEPENDENCY_TYPE_LABELS = new Map([
    ['FS', 'Fin-Comienzo'],
    ['SS', 'Comienzo-Comienzo'],
    ['FF', 'Fin-Fin'],
    ['SF', 'Comienzo-Fin'],
]);

const DEPENDENCY_GRID_SHORT_CODES_REVERSE = new Map([
    ['FC', 'FS'],
    ['CC', 'SS'],
    ['FF', 'FF'],
    ['CF', 'SF'],
]);
const DEPENDENCY_GRID_SHORT_CODES = new Map([
    ['FS', 'FC'],
    ['SS', 'CC'],
    ['FF', 'FF'],
    ['SF', 'CF'],
]);
const DEPENDENCY_SHORTCODE_EXAMPLE = '14, 6CC+2d o 10FF-50%';

const DEPENDENCY_TYPE_ALIASES = new Map([
    ['FIN-COMIENZO', 'FS'],
    ['FIN-INICIO', 'FS'],
    ['COMIENZO-COMIENZO', 'SS'],
    ['INICIO-INICIO', 'SS'],
    ['FIN-FIN', 'FF'],
    ['COMIENZO-FIN', 'SF'],
    ['INICIO-FIN', 'SF'],
]);

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const roundConfigNumber = (value, decimals = 2) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    const factor = 10 ** decimals;
    return Math.round(numeric * factor) / factor;
};

export const snapDependencyCoordinate = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    const snapped = Math.round(numeric * 2) / 2;
    return Object.is(snapped, -0) ? 0 : snapped;
};

const snapDependencyPoint = (point) => ({
    x: snapDependencyCoordinate(point?.x),
    y: snapDependencyCoordinate(point?.y),
});

const buildDependencyPathFromPoints = (points) => points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');

const resolvePolylineMidpoint = (points = []) => {
    if (!Array.isArray(points) || points.length === 0) {
        return { x: 0, y: 0 };
    }
    if (points.length === 1) {
        return snapDependencyPoint(points[0]);
    }
    const xs = points.map((point) => Number(point?.x || 0));
    const ys = points.map((point) => Number(point?.y || 0));
    const visualCenter = {
        x: (Math.min(...xs) + Math.max(...xs)) / 2,
        y: (Math.min(...ys) + Math.max(...ys)) / 2,
    };

    let closestPoint = snapDependencyPoint(points[Math.floor(points.length / 2)] || points[0]);
    let closestDistance = Number.POSITIVE_INFINITY;
    for (let index = 1; index < points.length; index += 1) {
        const previous = points[index - 1];
        const current = points[index];
        const deltaX = Number(current?.x || 0) - Number(previous?.x || 0);
        const deltaY = Number(current?.y || 0) - Number(previous?.y || 0);
        const segmentLengthSquared = (deltaX ** 2) + (deltaY ** 2);
        if (segmentLengthSquared <= 0.0001) continue;
        const ratio = clamp(
            (
                ((visualCenter.x - Number(previous?.x || 0)) * deltaX)
                + ((visualCenter.y - Number(previous?.y || 0)) * deltaY)
            ) / segmentLengthSquared,
            0,
            1,
        );
        const projectedPoint = {
            x: Number(previous?.x || 0) + (deltaX * ratio),
            y: Number(previous?.y || 0) + (deltaY * ratio),
        };
        const projectedDistance = Math.hypot(
            projectedPoint.x - visualCenter.x,
            projectedPoint.y - visualCenter.y,
        );
        if (projectedDistance < closestDistance) {
            closestDistance = projectedDistance;
            closestPoint = snapDependencyPoint(projectedPoint);
        }
    }

    return closestPoint;
};

const buildDependencyRouteResult = (points = []) => {
    const actionPoint = resolvePolylineMidpoint(points);
    const endPoint = points.at(-1) || points[points.length - 1] || actionPoint;
    return {
        d: buildDependencyPathFromPoints(points),
        controlX: endPoint?.x ?? 0,
        controlY: endPoint?.y ?? 0,
        actionX: actionPoint?.x ?? 0,
        actionY: actionPoint?.y ?? 0,
    };
};

export const normalizeDependencyType = (value) => {
    const normalized = String(value || 'FS').trim().toUpperCase();
    const normalizedInternalCode = DEPENDENCY_GRID_SHORT_CODES_REVERSE.get(normalized);
    if (normalizedInternalCode && DEPENDENCY_TYPE_LABELS.has(normalizedInternalCode)) return normalizedInternalCode;
    const normalizedAlias = DEPENDENCY_TYPE_ALIASES.get(normalized);
    if (normalizedAlias && DEPENDENCY_TYPE_LABELS.has(normalizedAlias)) return normalizedAlias;
    return DEPENDENCY_TYPE_LABELS.has(normalized) ? normalized : 'FS';
};

export const normalizeDependencyLagUnit = (value) => {
    const normalized = String(value || 'day').trim().toLowerCase();
    if (normalized === 'hour' || normalized === 'h' || normalized === 'hr' || normalized === 'hrs') return 'hour';
    if (normalized === 'minute' || normalized === 'minutes' || normalized === 'min' || normalized === 'm') return 'minute';
    if (normalized === 'percent' || normalized === 'percentage' || normalized === '%') return 'percent';
    return 'day';
};

const normalizeDependencyLag = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const formatShortDecimal = (value, decimals = 2) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return '0';
    const fixed = numeric.toFixed(decimals).replace(/\.?0+$/, '');
    return fixed.replace('.', ',');
};

export const formatDependencyLagShort = (value, unit = 'day') => {
    const lag = normalizeDependencyLag(value);
    if (Math.abs(lag) < 0.000001) return '';
    const normalizedUnit = normalizeDependencyLagUnit(unit);
    const unitText = normalizedUnit === 'hour'
        ? 'h'
        : normalizedUnit === 'minute'
            ? 'min'
            : normalizedUnit === 'percent'
                ? '%'
                : 'd';
    return `${lag > 0 ? '+' : ''}${formatShortDecimal(lag, 2)}${unitText}`;
};

export const formatDependencyShortcodeValue = (referenceText, dependency = {}, options = {}) => {
    const normalizedReference = String(referenceText || '').trim();
    if (!normalizedReference) return '';
    const typeCode = DEPENDENCY_GRID_SHORT_CODES.get(normalizeDependencyType(dependency?.type)) || 'FC';
    const lagText = formatDependencyLagShort(
        dependency?.lag_days ?? dependency?.lagDays ?? options.lagValue ?? 0,
        dependency?.lag_unit || dependency?.lagUnit || options.lagUnit || 'day',
    );
    const mustRenderType = typeCode !== 'FC' || Boolean(lagText);
    return `${normalizedReference}${mustRenderType ? typeCode : ''}${lagText}`;
};

const addCalendarDays = (value, days = 0) => {
    const parsed = value ? new Date(value) : null;
    if (!parsed || Number.isNaN(parsed.getTime())) return null;
    const next = new Date(parsed);
    next.setTime(next.getTime() + Number(days || 0) * 24 * 60 * 60 * 1000);
    return next;
};

export const resolveDependencyConstraintPresentation = ({
    dependency,
    sourceStart,
    sourceFinish,
    lagDays = 0,
    addDuration = addCalendarDays,
} = {}) => {
    const normalizedType = normalizeDependencyType(dependency?.type);
    const sourceStartDate = sourceStart ? new Date(sourceStart) : null;
    const sourceFinishDate = sourceFinish ? new Date(sourceFinish) : null;
    if (!sourceStartDate || Number.isNaN(sourceStartDate.getTime())) return null;
    if (!sourceFinishDate || Number.isNaN(sourceFinishDate.getTime())) return null;

    const targetAnchor = normalizedType === 'FF' || normalizedType === 'SF' ? 'finish' : 'start';
    const sourceAnchor = normalizedType === 'SS' || normalizedType === 'SF' ? 'start' : 'finish';
    const sourceDate = sourceAnchor === 'start' ? sourceStartDate : sourceFinishDate;
    const targetDate = addDuration(sourceDate, lagDays);

    return {
        dependency,
        type: normalizedType,
        targetAnchor,
        sourceAnchor,
        targetDate,
        sourceDate,
    };
};

export const parseDependencyShortcodeTokens = (rawValue) => {
    const normalizedRaw = String(rawValue || '').trim();
    if (!normalizedRaw) return { tokens: [], error: '' };

    const parts = normalizedRaw
        .split(/[\n;,]+/g)
        .map((item) => item.trim())
        .filter(Boolean);
    if (!parts.length) return { tokens: [], error: '' };

    const tokens = [];
    for (const part of parts) {
        let normalizedPart = String(part || '').trim().replace(/\s+/g, '');
        if (!normalizedPart) continue;

        let lagSign = '';
        let lagValueRaw = '';
        let lagUnitRaw = '';
        const lagMatch = normalizedPart.match(/([+-])([0-9]+(?:[.,][0-9]+)?)(d|h|min|%)$/i);
        if (lagMatch) {
            [, lagSign, lagValueRaw, lagUnitRaw] = lagMatch;
            normalizedPart = normalizedPart.slice(0, lagMatch.index);
        }

        let shortTypeRaw = '';
        const typeMatch = normalizedPart.match(/(FC|CC|FF|CF)$/i);
        if (typeMatch) {
            shortTypeRaw = String(typeMatch[1] || '').toUpperCase();
            normalizedPart = normalizedPart.slice(0, typeMatch.index);
        }

        const reference = String(normalizedPart || '').trim();
        if (!reference) {
            return { tokens: [], error: `El formato "${part}" no es válido. Usa por ejemplo: ${DEPENDENCY_SHORTCODE_EXAMPLE}.` };
        }

        const dependencyType = shortTypeRaw
            ? (DEPENDENCY_GRID_SHORT_CODES_REVERSE.get(shortTypeRaw) || null)
            : 'FS';
        if (!dependencyType) {
            return { tokens: [], error: `El tipo "${shortTypeRaw}" no es válido.` };
        }

        const lagValue = lagValueRaw ? Number(String(lagValueRaw).replace(',', '.')) : 0;
        if (!Number.isFinite(lagValue)) {
            return { tokens: [], error: `El lag de "${part}" no es válido.` };
        }
        const lagUnit = lagValueRaw
            ? (
                lagUnitRaw.toLowerCase() === 'h'
                    ? 'hour'
                    : lagUnitRaw.toLowerCase() === 'min'
                        ? 'minute'
                        : lagUnitRaw.toLowerCase() === '%'
                            ? 'percent'
                            : 'day'
            )
            : 'day';

        tokens.push({
            raw: part,
            reference,
            dependencyType,
            lag_days: (lagSign === '-' ? -1 : 1) * lagValue,
            lag_unit: lagUnit,
            lag_mode: lagUnit === 'percent' ? 'percent' : 'duration',
        });
    }

    return { tokens, error: '' };
};

export const distributeLaneOffset = (index, total, maxSpreadPx = 10) => {
    const safeTotal = Math.max(1, Number(total || 1));
    const safeIndex = clamp(Number(index || 0), 0, safeTotal - 1);
    if (safeTotal === 1) return 0;
    const spread = Math.min(maxSpreadPx, Math.max(4, safeTotal * 2));
    const center = (safeTotal - 1) / 2;
    const raw = ((safeIndex - center) / Math.max(center, 1)) * spread;
    return roundConfigNumber(raw, 2);
};

export const resolveDependencyVerticalAnchors = (sourceGeometry, targetGeometry, sourceLayout, targetLayout) => {
    const sourceCenterY = sourceGeometry?.centerY ?? sourceLayout?.centerY ?? 0;
    const targetCenterY = targetGeometry?.centerY ?? targetLayout?.centerY ?? 0;
    return {
        sourceY: sourceCenterY,
        targetY: targetCenterY,
    };
};

export const buildDependencyRoute = ({
    sourceGeometry,
    targetGeometry,
    sourceY,
    targetY,
    dependencyType = 'FS',
    lagDays = 0,
    sourceOffset = 0,
    targetOffset = 0,
    sourceLaneIndex = 0,
    targetLaneIndex = 0,
    obstacleBand = null,
    sharedExitX = null,
    sourceIsMilestone = false,
    targetIsMilestone = false,
    sourceMilestoneBoundaryAnchor = '',
    targetMilestoneBoundaryAnchor = '',
}) => {
    if (!sourceGeometry || !targetGeometry) return null;
    const normalizedType = normalizeDependencyType(dependencyType);
    const sourceAnchorSide = normalizedType === 'SS' || normalizedType === 'SF' ? 'left' : 'right';
    const targetAnchorSide = normalizedType === 'FF' || normalizedType === 'SF' ? 'right' : 'left';
    const sourceAnchorX = sourceAnchorSide === 'left' ? sourceGeometry.leftPx : sourceGeometry.rightPx;
    const targetAnchorX = targetAnchorSide === 'left'
        ? targetGeometry.leftPx + DEPENDENCY_GOVERNED_MARKER_INSET_PX
        : targetGeometry.rightPx - DEPENDENCY_GOVERNED_MARKER_INSET_PX;
    const isBackwardFinishStart = normalizedType === 'FS'
        && sourceAnchorSide === 'right'
        && targetAnchorSide === 'left'
        && targetAnchorX < sourceAnchorX - DEPENDENCY_ALIGNED_ANCHOR_TOLERANCE_PX
        && !sourceIsMilestone
        && !targetIsMilestone;
    let startPoint = {
        x: sourceAnchorX,
        y: sourceY + (isBackwardFinishStart ? 0 : sourceOffset),
    };
    const rawEndY = targetY + (isBackwardFinishStart ? 0 : targetOffset);
    let endPoint = {
        x: targetAnchorX,
        y: rawEndY,
    };
    const laneSpreadPx = Math.max(sourceLaneIndex, targetLaneIndex, 0) * 6;
    const sourceDirection = sourceAnchorSide === 'left' ? -1 : 1;
    const bandMinLeft = obstacleBand?.minLeft ?? Math.min(sourceGeometry.leftPx, targetGeometry.leftPx);
    const bandMaxRight = obstacleBand?.maxRight ?? Math.max(sourceGeometry.rightPx, targetGeometry.rightPx);
    const targetDirection = targetAnchorSide === 'left' ? -1 : 1;
    const sourceStubDistance = DEPENDENCY_CONNECTOR_STUB_PX + laneSpreadPx;
    const targetStubDistance = DEPENDENCY_CONNECTOR_STUB_PX + laneSpreadPx;
    const sourceStubX = startPoint.x + (sourceDirection * sourceStubDistance);
    const forwardDelta = (endPoint.x - sourceStubX) * sourceDirection;

    const normalizePoints = (points = []) => points
        .map(snapDependencyPoint)
        .filter((point, index, entries) => {
            if (index === 0) return true;
            const previous = entries[index - 1];
            return Math.abs(point.x - previous.x) >= 0.5 || Math.abs(point.y - previous.y) >= 0.5;
        });
    const normalizeRoutePoints = (points = []) => normalizePoints(points);
    const resolveMilestoneAnchorX = (geometry, boundaryAnchor = '', fallbackX = 0) => {
        void boundaryAnchor;
        return Number(geometry?.centerPx ?? geometry?.leftPx ?? fallbackX);
    };
    const buildFinishStartPoints = () => {
        const resolvedSourceStubX = startPoint.x + (sourceDirection * sourceStubDistance);
        const targetTop = Number(targetGeometry?.topPx);
        const targetEntryY = Number.isFinite(targetTop)
            ? targetTop
            : endPoint.y - (GANTT_BAR_HEIGHT_PX / 2);
        const approachY = targetEntryY - DEPENDENCY_TOP_ENTRY_CLEARANCE_PX;
        const targetEntryPoint = {
            x: endPoint.x,
            y: targetEntryY,
        };
        return normalizeRoutePoints([
            startPoint,
            { x: resolvedSourceStubX, y: startPoint.y },
            { x: resolvedSourceStubX, y: approachY },
            { x: targetEntryPoint.x, y: approachY },
            targetEntryPoint,
        ]);
    };
    const buildOrthogonalPoints = (middleX = null) => {
        const resolvedSourceStubX = startPoint.x + (sourceDirection * sourceStubDistance);
        const resolvedTargetStubX = endPoint.x + (targetDirection * targetStubDistance);
        let resolvedMiddleX = middleX !== null && middleX !== undefined && Number.isFinite(Number(middleX))
            ? Number(middleX)
            : (resolvedSourceStubX + resolvedTargetStubX) / 2;
        const targetTop = Number(targetGeometry?.topPx);
        const targetBottom = Number(targetGeometry?.bottomPx);
        const targetLeft = Number(targetGeometry?.leftPx);
        const targetRight = Number(targetGeometry?.rightPx);
        const targetBodyIsResolved = [targetTop, targetBottom, targetLeft, targetRight].every(Number.isFinite);
        const routeHasVerticalDrop = Math.abs(startPoint.y - endPoint.y) > 0.5;
        const targetLaneWouldCollapseIntoLeftEdge = routeHasVerticalDrop
            && targetAnchorSide === 'left'
            && resolvedSourceStubX > resolvedTargetStubX + 0.5
            && resolvedMiddleX > resolvedTargetStubX + 0.5;
        if (targetLaneWouldCollapseIntoLeftEdge) {
            resolvedMiddleX = resolvedSourceStubX;
        }
        const targetCenterLineCrossesBody = targetBodyIsResolved
            && endPoint.y > targetTop + 0.5
            && endPoint.y < targetBottom - 0.5
            && Math.min(resolvedMiddleX, resolvedTargetStubX) < targetRight - 0.5
            && Math.max(resolvedMiddleX, resolvedTargetStubX) > targetLeft + 0.5;
        if (targetCenterLineCrossesBody && Math.abs(startPoint.y - endPoint.y) > 0.5) {
            const approachY = startPoint.y <= endPoint.y
                ? targetTop - DEPENDENCY_TOP_ENTRY_CLEARANCE_PX
                : targetBottom + DEPENDENCY_TOP_ENTRY_CLEARANCE_PX;
            return normalizeRoutePoints([
                startPoint,
                { x: resolvedSourceStubX, y: startPoint.y },
                { x: resolvedMiddleX, y: startPoint.y },
                { x: resolvedMiddleX, y: approachY },
                { x: resolvedTargetStubX, y: approachY },
                { x: resolvedTargetStubX, y: endPoint.y },
                endPoint,
            ]);
        }
        return normalizeRoutePoints([
            startPoint,
            { x: resolvedSourceStubX, y: startPoint.y },
            { x: resolvedMiddleX, y: startPoint.y },
            { x: resolvedMiddleX, y: endPoint.y },
            { x: resolvedTargetStubX, y: endPoint.y },
            endPoint,
        ]);
    };

    if (sourceIsMilestone) {
        startPoint = {
            x: resolveMilestoneAnchorX(sourceGeometry, sourceMilestoneBoundaryAnchor, startPoint.x),
            y: Number(sourceGeometry.centerY ?? startPoint.y),
        };
    }
    if (targetIsMilestone) {
        endPoint = {
            x: resolveMilestoneAnchorX(targetGeometry, targetMilestoneBoundaryAnchor, targetAnchorX),
            y: Number(targetGeometry.centerY ?? rawEndY),
        };
    }

    if (normalizedType === 'FS' && !targetIsMilestone) {
        const points = buildFinishStartPoints();
        return buildDependencyRouteResult(points);
    }

    if (
        (sourceIsMilestone || targetIsMilestone)
        && Math.abs(startPoint.x - endPoint.x) <= DEPENDENCY_ALIGNED_ANCHOR_TOLERANCE_PX
    ) {
        const points = normalizePoints([startPoint, endPoint]);
        return buildDependencyRouteResult(points);
    }

    if (sourceIsMilestone && !targetIsMilestone && Math.abs(Number(lagDays || 0)) <= 0.0001) {
        const points = buildOrthogonalPoints();
        return buildDependencyRouteResult(points);
    }

    if (Math.abs(startPoint.y - endPoint.y) <= 0.5) {
        const points = normalizePoints([startPoint, endPoint]);
        return buildDependencyRouteResult(points);
    }

    if (Math.abs(startPoint.x - endPoint.x) <= DEPENDENCY_ALIGNED_ANCHOR_TOLERANCE_PX) {
        const points = buildOrthogonalPoints();
        return buildDependencyRouteResult(points);
    }

    if (normalizedType === 'FF') {
        const points = buildOrthogonalPoints();
        return buildDependencyRouteResult(points);
    }

    let points;
    const isLocallyForward = sourceDirection > 0
        ? endPoint.x >= startPoint.x - DEPENDENCY_ALIGNED_ANCHOR_TOLERANCE_PX
        : endPoint.x <= startPoint.x + DEPENDENCY_ALIGNED_ANCHOR_TOLERANCE_PX;
    if (isLocallyForward || forwardDelta >= -0.5) {
        points = buildOrthogonalPoints();
    } else {
        const outerX = sourceDirection > 0
            ? Math.max(
                bandMaxRight + DEPENDENCY_CONNECTOR_LANE_PX + laneSpreadPx,
                Number(sharedExitX) || Number.NEGATIVE_INFINITY,
            )
            : Math.min(
                bandMinLeft - DEPENDENCY_CONNECTOR_LANE_PX - laneSpreadPx,
                Number(sharedExitX) || Number.POSITIVE_INFINITY,
            );
        points = normalizeRoutePoints(
            isBackwardFinishStart
                ? buildOrthogonalPoints(startPoint.x + (sourceDirection * sourceStubDistance))
                : buildOrthogonalPoints(outerX),
        );
    }

    return buildDependencyRouteResult(points);
};
