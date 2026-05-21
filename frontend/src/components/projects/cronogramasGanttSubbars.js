const DAY_MS = 24 * 60 * 60 * 1000;

const shiftSubbarDateValueByDays = (value, dayDelta = 0, options = {}) => {
    const shiftValue = typeof options?.shiftValue === 'function'
        ? options.shiftValue
        : null;
    if (shiftValue) {
        return shiftValue(value, dayDelta, options?.config || {});
    }
    const parsed = normalizeDate(value);
    if (!parsed) return value || null;
    return new Date(parsed.getTime() + (Number(dayDelta || 0) * DAY_MS)).toISOString();
};

export const clamp = (value, min, max) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return Number(min);
    return Math.min(Math.max(numeric, min), max);
};

export const normalizeDate = (value) => {
    if (!value) return null;
    const parsed = value instanceof Date ? new Date(value.getTime()) : new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const getTimelineWidthPx = (timelineSegments = [], segmentColumnWidth = 1) => (
    Math.max(timelineSegments.length, 1) * Math.max(1, Number(segmentColumnWidth || 1))
);

const getDatePositionPx = (value, timelineSegments = [], segmentColumnWidth = 1) => {
    const parsed = normalizeDate(value);
    if (!parsed || !timelineSegments.length) return 0;
    const target = new Date(parsed);
    const timelineWidth = getTimelineWidthPx(timelineSegments, segmentColumnWidth);
    const firstStart = new Date(timelineSegments[0].start);
    if (target <= firstStart) return 0;

    for (let index = 0; index < timelineSegments.length; index += 1) {
        const segment = timelineSegments[index];
        const start = new Date(segment.start);
        const endExclusive = new Date(segment.exclusiveEnd || segment.end);
        if (target < endExclusive) {
            const segmentSpanMs = Math.max(1, endExclusive.getTime() - start.getTime());
            const offsetMs = clamp(target.getTime() - start.getTime(), 0, segmentSpanMs);
            return (index * segmentColumnWidth) + ((offsetMs / segmentSpanMs) * segmentColumnWidth);
        }
    }

    return timelineWidth;
};

export const buildGanttInitialParentId = (budgetLineId = '', periodId = '') => {
    const safeLineId = String(budgetLineId || '').trim();
    const safePeriodId = String(periodId || '').trim();
    if (!safeLineId || !safePeriodId) return '';
    return `valuado-initial-${safeLineId}-${safePeriodId}`;
};

export const buildInitialValoradoSubbars = ({
    budgetLineId = '',
    periods = [],
    distribution = [],
    lineTotal = 0,
    totalDurationDays = 0,
    source = 'valuado_initial_segment',
    windowStart = null,
    windowEnd = null,
    clipToWindow = false,
}) => {
    const safeBudgetLineId = String(budgetLineId || '').trim();
    if (!safeBudgetLineId || !Array.isArray(periods) || !periods.length) return [];
    const normalizedWindowStart = normalizeDate(windowStart);
    const normalizedWindowEnd = normalizeDate(windowEnd);
    if (clipToWindow && (!normalizedWindowStart || !normalizedWindowEnd || normalizedWindowEnd.getTime() <= normalizedWindowStart.getTime())) {
        return [];
    }

    return periods.map((period, index) => {
        const periodPercent = Number(distribution[index] || 0);
        if (periodPercent <= 0.0001) return null;
        const periodId = String(period?.id || `P${index + 1}`);
        const periodStart = normalizeDate(period?.starts_at);
        const periodEnd = normalizeDate(period?.ends_at);
        if (!periodStart || !periodEnd || periodEnd.getTime() <= periodStart.getTime()) return null;

        const startsAt = clipToWindow
            ? new Date(Math.max(normalizedWindowStart.getTime(), periodStart.getTime()))
            : periodStart;
        const proportionalDurationMs = Math.max(0, Number(totalDurationDays || 0)) * (periodPercent / 100) * DAY_MS;
        const rawEndsAt = proportionalDurationMs > 0
            ? new Date(startsAt.getTime() + proportionalDurationMs)
            : startsAt;
        const endsAt = clipToWindow
            ? new Date(Math.min(normalizedWindowEnd.getTime(), periodEnd.getTime(), rawEndsAt.getTime()))
            : new Date(Math.min(periodEnd.getTime(), rawEndsAt.getTime()));
        if (endsAt.getTime() <= startsAt.getTime()) return null;

        return {
            id: `${safeBudgetLineId}-${periodId}-${index + 1}`,
            period_id: periodId,
            parent_period_id: periodId,
            parent_initial_id: buildGanttInitialParentId(safeBudgetLineId, periodId) || periodId,
            starts_at: startsAt.toISOString(),
            ends_at: endsAt.toISOString(),
            percent: Number(periodPercent.toFixed(4)),
            amount: lineTotal > 0 ? Number((lineTotal * (periodPercent / 100)).toFixed(4)) : 0,
            status: 'draft_session',
            source,
            metadata: {
                label: String(period?.label || `P${index + 1}`),
            },
        };
    }).filter(Boolean);
};

export const mergeGanttSubbarsSequentially = ({
    subbars = [],
    anchorSubbarId = '',
    targetParentInitialId = '',
    source = 'gantt_multi_merge',
}) => {
    const safeSubbars = Array.isArray(subbars) ? subbars.filter(Boolean) : [];
    if (safeSubbars.length < 2) return null;
    const anchorId = String(anchorSubbarId || safeSubbars[0]?.id || '').trim();
    const anchorSubbar = safeSubbars.find((segment) => String(segment?.id || '') === anchorId) || safeSubbars[0];
    const anchorStart = normalizeDate(anchorSubbar?.starts_at);
    if (!anchorStart) return null;
    const totalDurationMs = safeSubbars.reduce((sum, segment) => {
        const start = normalizeDate(segment?.starts_at);
        const end = normalizeDate(segment?.ends_at);
        if (!start || !end) return sum;
        return sum + Math.max(0, end.getTime() - start.getTime());
    }, 0);
    if (totalDurationMs <= 0) return null;
    const startsAt = new Date(anchorStart.getTime());
    const endsAt = new Date(anchorStart.getTime() + totalDurationMs);
    return {
        ...anchorSubbar,
        id: `${anchorId}-merged`,
        starts_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        percent: Number(safeSubbars.reduce((sum, segment) => sum + Number(segment?.percent || 0), 0).toFixed(4)),
        amount: Number(safeSubbars.reduce((sum, segment) => sum + Number(segment?.amount || 0), 0).toFixed(4)),
        parent_initial_id: String(targetParentInitialId || anchorSubbar?.parent_initial_id || anchorSubbar?.parent_period_id || anchorSubbar?.period_id || '').trim(),
        parent_period_id: anchorSubbar?.parent_period_id || anchorSubbar?.period_id || null,
        period_id: anchorSubbar?.period_id || anchorSubbar?.parent_period_id || null,
        parent_subbar_id: anchorSubbar?.id || null,
        status: 'draft_session',
        source,
        metadata: {
            ...(anchorSubbar?.metadata || {}),
            merged_subbar_ids: safeSubbars.map((segment) => String(segment?.id || '')).filter(Boolean),
            merged_count: safeSubbars.length,
        },
    };
};

export const splitGanttSubbarByRatio = (subbar = null, firstPercentRatio = 50) => {
    const totalPercent = Number(subbar?.percent || 0);
    const firstPercent = Number((totalPercent * (clamp(Number(firstPercentRatio || 0), 0.0001, 99.9999) / 100)).toFixed(4));
    const preview = buildGanttSubbarSplitPreview({
        subbar,
        parts: [
            { id: 'split-a', label: 'Parte A', percent: firstPercent },
            { id: 'split-b', label: 'Parte B', percent: Number((totalPercent - firstPercent).toFixed(4)) },
        ],
        mode: 'sequential',
    });
    return preview?.segments?.length ? preview.segments : null;
};

const normalizeSplitPercent = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return 0;
    return Number(Math.max(0, numeric).toFixed(4));
};

export const buildGanttSplitPeriodSlots = (subbar = null, periods = []) => {
    const start = normalizeDate(subbar?.starts_at);
    const end = normalizeDate(subbar?.ends_at);
    if (!start || !end || end.getTime() <= start.getTime()) return [];
    return (Array.isArray(periods) ? periods : [])
        .map((period, index) => {
            const periodStart = normalizeDate(period?.starts_at);
            const periodEnd = normalizeDate(period?.ends_at);
            if (!periodStart || !periodEnd || periodEnd.getTime() <= periodStart.getTime()) return null;
            const slotStart = new Date(Math.max(start.getTime(), periodStart.getTime()));
            const slotEnd = new Date(Math.min(end.getTime(), periodEnd.getTime()));
            if (slotEnd.getTime() <= slotStart.getTime()) return null;
            return {
                id: String(period?.id || `P${index + 1}`),
                label: String(period?.label || period?.id || `P${index + 1}`),
                starts_at: slotStart.toISOString(),
                ends_at: slotEnd.toISOString(),
            };
        })
        .filter(Boolean)
        .sort((left, right) => new Date(left.starts_at).getTime() - new Date(right.starts_at).getTime());
};

export const buildGanttSubbarSplitPreview = ({
    subbar = null,
    parts = [],
    mode = 'sequential',
    periods = [],
} = {}) => {
    const start = normalizeDate(subbar?.starts_at);
    const end = normalizeDate(subbar?.ends_at);
    if (!start || !end || end.getTime() <= start.getTime()) return null;

    const parentPercent = normalizeSplitPercent(subbar?.percent || 0);
    const parentAmount = Number(subbar?.amount || 0);
    const normalizedMode = String(mode || 'sequential').trim().toLowerCase() === 'align_to_periods'
        ? 'align_to_periods'
        : 'sequential';
    const normalizedParts = (Array.isArray(parts) ? parts : []).map((part, index) => ({
        id: String(part?.id || `part-${index + 1}`),
        label: String(part?.label || `Parte ${index + 1}`),
        percent: normalizeSplitPercent(part?.percent || 0),
        starts_at: normalizeDate(part?.starts_at)?.toISOString() || null,
        slot_id: String(part?.slot_id || '').trim() || null,
        slot_label: String(part?.slot_label || '').trim() || null,
    }));
    const positiveParts = normalizedParts.filter((part) => part.percent > 0.0001);
    const assignedPercent = Number(positiveParts.reduce((sum, part) => sum + part.percent, 0).toFixed(4));
    const remainingPercent = Number(Math.max(0, parentPercent - assignedPercent).toFixed(4));
    const availableSlots = normalizedMode === 'align_to_periods'
        ? buildGanttSplitPeriodSlots(subbar, periods)
        : [];
    const errors = [];

    if (parentPercent <= 0.0001) {
        errors.push('El tramo origen no tiene porcentaje suficiente para dividirse.');
    }
    if (!positiveParts.length) {
        errors.push('Debe existir al menos una parte con porcentaje mayor que cero.');
    }
    if (normalizedMode === 'sequential' && normalizedParts.some((part) => part.percent <= 0.0001)) {
        errors.push('Todas las partes deben tener un porcentaje mayor que cero antes de aplicar la división.');
    }
    if (normalizedMode === 'sequential' && positiveParts.length < 2) {
        errors.push('La división avanzada requiere al menos dos partes con porcentaje mayor que cero.');
    }
    if (assignedPercent > parentPercent + 0.0001) {
        errors.push('La suma de partes supera el porcentaje disponible del tramo padre.');
    }
    if (assignedPercent < parentPercent - 0.0001) {
        errors.push('La suma de partes debe cuadrar exactamente con el porcentaje disponible del tramo padre.');
    }
    if (normalizedMode === 'align_to_periods' && positiveParts.length > availableSlots.length) {
        errors.push('No hay suficientes tramos/periodos disponibles para alinear todas las partes solicitadas.');
    }

    const isExactAssignment = Math.abs(assignedPercent - parentPercent) <= 0.0001;
    const totalDurationMs = Math.max(0, end.getTime() - start.getTime());
    const segments = [];
    const basePayload = {
        ...subbar,
        status: 'draft_session',
        source: 'gantt_manual_split',
        parent_subbar_id: subbar?.id || null,
    };

    if (!errors.length && totalDurationMs > 0 && positiveParts.length) {
        if (normalizedMode === 'align_to_periods') {
            normalizedParts.forEach((part, index) => {
                if (part.percent <= 0.0001) return;
                const slot = availableSlots[index];
                if (!slot) return;
                const slotStart = normalizeDate(part.starts_at || slot.starts_at);
                const slotEnd = normalizeDate(slot.ends_at);
                if (!slotStart || !slotEnd || slotEnd.getTime() <= slotStart.getTime()) return;
                const amountRatio = parentPercent > 0.0001 ? part.percent / parentPercent : 0;
                const durationMs = Math.max(0, totalDurationMs * (part.percent / Math.max(parentPercent, 0.0001)));
                const adjustedEnd = new Date(slotStart.getTime() + durationMs);
                segments.push({
                    ...basePayload,
                    id: `${String(subbar?.id || 'subbar')}-split-${index + 1}`,
                    starts_at: slotStart.toISOString(),
                    ends_at: adjustedEnd.toISOString(),
                    period_id: part.slot_id || slot.id,
                    parent_period_id: part.slot_id || slot.id,
                    percent: part.percent,
                    amount: Number((parentAmount * amountRatio).toFixed(4)),
                    metadata: {
                        ...(subbar?.metadata || {}),
                        split_mode: 'align_to_periods',
                        split_index: index + 1,
                        split_total: normalizedParts.length,
                        split_part_label: part.label,
                        aligned_period_id: part.slot_id || slot.id,
                        aligned_period_label: part.slot_label || slot.label,
                    },
                });
            });
        } else {
            let currentStartMs = start.getTime();
            const totalAssignedPercent = positiveParts.reduce((sum, part) => sum + part.percent, 0) || 0;
            normalizedParts.forEach((part, index) => {
                if (part.percent <= 0.0001) return;
                const positiveIndex = segments.length;
                const remainingPositiveParts = normalizedParts.filter((candidate) => candidate.percent > 0.0001);
                const isLast = positiveIndex === remainingPositiveParts.length - 1;
                const segmentStart = normalizeDate(part.starts_at) || new Date(currentStartMs);
                const partDurationMs = isLast
                    ? Math.max(0, end.getTime() - segmentStart.getTime())
                    : Math.max(1, totalDurationMs * (part.percent / Math.max(totalAssignedPercent, 0.0001)));
                const nextEndMs = segmentStart.getTime() + partDurationMs;
                const amountRatio = parentPercent > 0.0001 ? part.percent / parentPercent : 0;
                segments.push({
                    ...basePayload,
                    id: `${String(subbar?.id || 'subbar')}-split-${index + 1}`,
                    starts_at: segmentStart.toISOString(),
                    ends_at: new Date(nextEndMs).toISOString(),
                    percent: part.percent,
                    amount: Number((parentAmount * amountRatio).toFixed(4)),
                    metadata: {
                        ...(subbar?.metadata || {}),
                        split_mode: 'sequential',
                        split_index: index + 1,
                        split_total: remainingPositiveParts.length,
                        split_part_label: part.label,
                    },
                });
                currentStartMs = nextEndMs;
            });
        }
    }

    return {
        mode: normalizedMode,
        parts: normalizedParts,
        positiveParts,
        parentPercent,
        assignedPercent,
        remainingPercent,
        isExactAssignment,
        availableSlots,
        unassignedSlotCount: Math.max(0, availableSlots.length - positiveParts.length),
        errors,
        canApply: !errors.length && isExactAssignment && segments.length === positiveParts.length,
        segments,
    };
};

export const moveSingleGanttSubbarByDays = (subbars = [], subbarId = '', dayDelta = 0, options = {}) => {
    const safeSubbars = Array.isArray(subbars) ? subbars : [];
    const normalizedSubbarId = String(subbarId || '').trim();
    if (!normalizedSubbarId) return safeSubbars;
    const renewableSources = new Set([
        'gantt_schedule_period_seed',
        'gantt_initial_segments',
        'valuado_initial_segment',
        'manual_window_period_seed',
        'factory_reset_seed',
        'initial_creation_seed',
    ]);
    return safeSubbars.map((segment) => {
        if (String(segment?.id || '') !== normalizedSubbarId) return segment;
        const start = normalizeDate(segment?.starts_at);
        const end = normalizeDate(segment?.ends_at);
        if (!start || !end) return segment;
        const source = String(segment?.source || '').trim().toLowerCase();
        const nextSource = renewableSources.has(source)
            ? 'gantt_manual_move'
            : (segment?.source || 'gantt_manual_move');
        return {
            ...segment,
            starts_at: shiftSubbarDateValueByDays(segment?.starts_at, dayDelta, options),
            ends_at: shiftSubbarDateValueByDays(segment?.ends_at, dayDelta, options),
            status: 'draft_session',
            source: nextSource,
        };
    });
};

export const moveGanttSubbarsByDays = (subbars = [], subbarIds = [], dayDelta = 0, options = {}) => {
    const safeSubbars = Array.isArray(subbars) ? subbars : [];
    const safeSubbarIds = Array.isArray(subbarIds)
        ? subbarIds.map((value) => String(value || '').trim()).filter(Boolean)
        : [];
    if (!safeSubbarIds.length) return safeSubbars;
    const targetIds = new Set(safeSubbarIds);
    const renewableSources = new Set([
        'gantt_schedule_period_seed',
        'gantt_initial_segments',
        'valuado_initial_segment',
        'manual_window_period_seed',
        'factory_reset_seed',
        'initial_creation_seed',
    ]);
    return safeSubbars.map((segment) => {
        if (!targetIds.has(String(segment?.id || ''))) return segment;
        const start = normalizeDate(segment?.starts_at);
        const end = normalizeDate(segment?.ends_at);
        if (!start || !end) return segment;
        const source = String(segment?.source || '').trim().toLowerCase();
        const nextSource = renewableSources.has(source)
            ? 'gantt_manual_move'
            : (segment?.source || 'gantt_manual_move');
        return {
            ...segment,
            starts_at: shiftSubbarDateValueByDays(segment?.starts_at, dayDelta, options),
            ends_at: shiftSubbarDateValueByDays(segment?.ends_at, dayDelta, options),
            status: 'draft_session',
            source: nextSource,
        };
    });
};

export const rebalanceValoradoDistributionForInterparentMerge = ({
    distribution = [],
    periods = [],
    sourcePeriodId = '',
    targetPeriodId = '',
    percentToMove = 0,
}) => {
    const safeDistribution = Array.isArray(distribution)
        ? distribution.map((value) => Number(value || 0))
        : [];
    const safePeriods = Array.isArray(periods) ? periods : [];
    const normalizedSourcePeriodId = String(sourcePeriodId || '').trim();
    const normalizedTargetPeriodId = String(targetPeriodId || '').trim();
    const safePercentToMove = Number(percentToMove || 0);

    if (!safeDistribution.length || !safePeriods.length) return null;
    if (!normalizedSourcePeriodId || !normalizedTargetPeriodId) return null;
    if (normalizedSourcePeriodId === normalizedTargetPeriodId) return null;
    if (!(safePercentToMove > 0)) return null;

    const sourceIndex = safePeriods.findIndex((period, index) => String(period?.id || `P${index + 1}`) === normalizedSourcePeriodId);
    const targetIndex = safePeriods.findIndex((period, index) => String(period?.id || `P${index + 1}`) === normalizedTargetPeriodId);
    if (sourceIndex < 0 || targetIndex < 0) return null;

    const availableSourcePercent = Number(safeDistribution[sourceIndex] || 0);
    const clampedPercentToMove = clamp(safePercentToMove, 0, availableSourcePercent);
    if (!(clampedPercentToMove > 0)) return null;

    const nextDistribution = [...safeDistribution];
    nextDistribution[sourceIndex] = Number(Math.max(0, nextDistribution[sourceIndex] - clampedPercentToMove).toFixed(4));
    nextDistribution[targetIndex] = Number((nextDistribution[targetIndex] + clampedPercentToMove).toFixed(4));

    return {
        sourceIndex,
        targetIndex,
        percentMoved: Number(clampedPercentToMove.toFixed(4)),
        nextDistribution,
    };
};

export const buildSubbarVisualsFromTimeline = ({
    subbars = [],
    timelineSegments = [],
    segmentColumnWidth = 1,
    minWidthPx = 6,
    timeScale = 'day',
}) => {
    if (!Array.isArray(subbars) || !subbars.length || !Array.isArray(timelineSegments) || !timelineSegments.length) {
        return [];
    }

    return subbars
        .map((subbar, index) => {
            const start = normalizeDate(subbar?.starts_at);
            const end = normalizeDate(subbar?.ends_at) || start;
            if (!start || !end) return null;

            const actualDurationMs = Math.max(0, end.getTime() - start.getTime());
            const visualEnd = end;
            const leftPx = getDatePositionPx(start, timelineSegments, segmentColumnWidth);
            const rightPx = getDatePositionPx(visualEnd, timelineSegments, segmentColumnWidth);
            const widthPx = Math.max(minWidthPx, rightPx - leftPx);
            const exactRightPx = getDatePositionPx(end, timelineSegments, segmentColumnWidth);
            const rawExactWidthPx = Math.max(2, exactRightPx - leftPx);
            const exactWidthPx = rawExactWidthPx;
            return {
                ...subbar,
                id: String(subbar?.id || `subbar-${index + 1}`),
                index,
                leftPx,
                widthPx,
                exactWidthPx,
                proportionalExactWidthPx: exactWidthPx,
                relativeApproximateRatio: 1,
                percent: Number(subbar?.percent || 0),
                amount: Number(subbar?.amount || 0),
                periodId: String(subbar?.period_id || subbar?.parent_period_id || `P${index + 1}`),
                parentInitialId: String(subbar?.parent_initial_id || subbar?.parentInitialId || subbar?.parent_period_id || subbar?.period_id || `P${index + 1}`),
                status: String(subbar?.status || 'draft_session'),
                startsAt: start,
                endsAt: end,
                visualEndsAt: visualEnd,
                actualDurationMs,
                visualDurationMs: Math.max(0, visualEnd.getTime() - start.getTime()),
                isApproximateVisualDuration: false,
            };
        })
        .filter(Boolean);
};

export const buildSubbarEnvelope = (visuals = []) => {
    if (!Array.isArray(visuals) || !visuals.length) return null;
    const leftPx = Math.min(...visuals.map((segment) => Number(segment?.leftPx || 0)));
    const rightPx = Math.max(...visuals.map((segment) => Number(segment?.leftPx || 0) + Number(segment?.widthPx || 0)));
    const widthPx = Math.max(18, rightPx - leftPx);
    return {
        leftPx,
        widthPx,
        rightPx,
    };
};

export const buildSimpleTimelineSegments = (starts = [], stepDays = 7) => (
    starts.map((value, index) => {
        const start = normalizeDate(value);
        const exclusiveEnd = start ? new Date(start.getTime() + (stepDays * DAY_MS)) : null;
        return {
            id: `segment-${index + 1}`,
            start: start?.toISOString(),
            end: exclusiveEnd?.toISOString(),
            exclusiveEnd: exclusiveEnd?.toISOString(),
        };
    }).filter((segment) => Boolean(segment.start && segment.end))
);
