const sortVisualsByLeft = (items = []) => [...(Array.isArray(items) ? items : [])]
    .filter(Boolean)
    .sort((left, right) => Number(left?.leftPx || 0) - Number(right?.leftPx || 0));

export const resolveTaskMoveGuideAnchors = ({
    interactionScope = '',
    barLeftPx = null,
    previewBarLeftPx = null,
    activeSegmentId = '',
    originalSubbarVisuals = [],
    translatedSubbarVisuals = [],
} = {}) => {
    const baseBarLeftPx = Number(barLeftPx);
    const basePreviewBarLeftPx = Number.isFinite(Number(previewBarLeftPx))
        ? Number(previewBarLeftPx)
        : baseBarLeftPx;

    if (interactionScope === 'subbar') {
        const originalSegments = sortVisualsByLeft(originalSubbarVisuals);
        const translatedSegments = sortVisualsByLeft(translatedSubbarVisuals);
        const normalizedSegmentId = String(activeSegmentId || '');
        const originalIndex = originalSegments.findIndex((segment) => String(segment?.id || '') === normalizedSegmentId);
        const translatedIndex = translatedSegments.findIndex((segment) => String(segment?.id || '') === normalizedSegmentId);
        const originalSegment = originalIndex >= 0 ? originalSegments[originalIndex] : null;
        const translatedSegment = translatedIndex >= 0 ? translatedSegments[translatedIndex] : null;
        if (!originalSegment || !translatedSegment) {
            return {
                originalLeftPx: baseBarLeftPx,
                nextLeftPx: basePreviewBarLeftPx,
            };
        }
        const previousSegment = originalIndex > 0 ? originalSegments[originalIndex - 1] : null;
        const originalLeftPx = previousSegment
            ? Number(previousSegment.leftPx || 0) + Number(previousSegment.widthPx || 0)
            : baseBarLeftPx;
        return {
            originalLeftPx,
            nextLeftPx: Number(translatedSegment.leftPx || 0),
        };
    }

    return {
        originalLeftPx: baseBarLeftPx,
        nextLeftPx: basePreviewBarLeftPx,
    };
};

export const buildTaskMoveGuideModel = ({
    activePreviewType = '',
    interactionScope = '',
    originalLeftPx = null,
    nextLeftPx = null,
    translationPx = null,
    pixelsPerDay = 1,
} = {}) => {
    if (activePreviewType !== 'move' || (interactionScope !== 'task' && interactionScope !== 'subbar')) return null;
    const originalLeft = Number(originalLeftPx);
    const hasExplicitNextLeft = nextLeftPx !== null && nextLeftPx !== undefined && nextLeftPx !== '';
    const hasTranslation = translationPx !== null && translationPx !== undefined && translationPx !== '';
    const explicitNextLeft = hasExplicitNextLeft && Number.isFinite(Number(nextLeftPx))
        ? Number(nextLeftPx)
        : Number.NaN;
    const translatedNextLeft = Number.isFinite(Number(originalLeftPx)) && hasTranslation && Number.isFinite(Number(translationPx))
        ? Number(originalLeftPx) + Number(translationPx)
        : Number.NaN;
    const resolvedNextLeft = Number.isFinite(explicitNextLeft) && (
        !Number.isFinite(translatedNextLeft)
        || Math.abs(explicitNextLeft - originalLeft) >= 0.5
    )
        ? explicitNextLeft
        : translatedNextLeft;
    if (!Number.isFinite(originalLeft) || !Number.isFinite(resolvedNextLeft)) return null;
    const totalWidthPx = Math.abs(resolvedNextLeft - originalLeft);
    if (!Number.isFinite(totalWidthPx) || totalWidthPx < 14) return null;
    const safePixelsPerDay = Number(pixelsPerDay || 0);
    const deltaDays = safePixelsPerDay > 0
        ? (resolvedNextLeft - originalLeft) / safePixelsPerDay
        : 0;
    return {
        leftPx: Math.min(originalLeft, resolvedNextLeft) + 4,
        widthPx: Math.max(0, totalWidthPx - 8),
        deltaDays,
    };
};

export const resolveGhostSubbarVisuals = ({
    activePreviewType = '',
    interactionScope = '',
    originalSubbarVisuals = [],
    hasRealSubbars = false,
    isDraggingSingleSubbar = false,
    activeSegmentId = '',
} = {}) => {
    if (
        activePreviewType !== 'move'
        || interactionScope !== 'subbar'
        || !hasRealSubbars
        || !Array.isArray(originalSubbarVisuals)
        || !originalSubbarVisuals.length
    ) {
        return [];
    }
    return originalSubbarVisuals.filter((segment) => (
        !isDraggingSingleSubbar
        || String(segment?.id || '') === String(activeSegmentId || '')
    ));
};

export const applyManualMilestoneDependencyLagUpdates = ({
    manualMilestones = [],
    targetLineId = '',
    nextDependencies = [],
    normalizeDependencyEndpointId = (value) => String(value || '').trim(),
    buildManualMilestoneLineId = (value) => String(value || '').trim(),
} = {}) => {
    const normalizedTargetLineId = String(targetLineId || '').trim();
    if (!normalizedTargetLineId || !Array.isArray(manualMilestones) || !manualMilestones.length) {
        return { nextMilestones: Array.isArray(manualMilestones) ? manualMilestones : [], updatedCount: 0 };
    }

    const updatesBySource = new Map();
    (Array.isArray(nextDependencies) ? nextDependencies : []).forEach((dependency) => {
        const sourceId = normalizeDependencyEndpointId(dependency?.source_id ?? dependency?.sourceId ?? dependency?.predecessor_id);
        if (!String(sourceId || '').startsWith('manual-milestone:')) return;
        updatesBySource.set(String(sourceId), dependency);
    });
    if (!updatesBySource.size) {
        return { nextMilestones: manualMilestones, updatedCount: 0 };
    }

    let updatedCount = 0;
    const nextMilestones = manualMilestones.map((entry) => {
        const lineId = buildManualMilestoneLineId(entry?.id);
        const sourceDependency = updatesBySource.get(String(lineId));
        if (!sourceDependency) return entry;
        const nextSuccessors = (Array.isArray(entry?.successor_dependencies) ? entry.successor_dependencies : []).map((dependency) => {
            const dependencyTargetId = normalizeDependencyEndpointId(dependency?.target_id ?? dependency?.targetId);
            if (dependencyTargetId !== normalizedTargetLineId) return dependency;
            updatedCount += 1;
            return {
                ...dependency,
                type: sourceDependency?.type ?? dependency?.type,
                lag_days: sourceDependency?.lag_days ?? sourceDependency?.lagDays ?? dependency?.lag_days ?? dependency?.lagDays ?? 0,
                lag_unit: sourceDependency?.lag_unit ?? sourceDependency?.lagUnit ?? dependency?.lag_unit ?? dependency?.lagUnit ?? 'day',
                lag_mode: sourceDependency?.lag_mode ?? sourceDependency?.lagMode ?? dependency?.lag_mode ?? dependency?.lagMode ?? 'duration',
            };
        });
        return {
            ...entry,
            successor_dependencies: nextSuccessors,
        };
    });

    return {
        nextMilestones,
        updatedCount,
    };
};
