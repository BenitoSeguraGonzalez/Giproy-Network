const normalizeTraceEvents = (traceEvents = []) => (
    Array.isArray(traceEvents)
        ? traceEvents.filter(Boolean)
        : []
);

export const resolveGanttCpmRowState = ({
    diagnostics = null,
    scheduleAlignment = null,
    reconciliation = null,
    traceEvents = [],
} = {}) => {
    const normalizedTraceEvents = normalizeTraceEvents(traceEvents);
    const latestTrace = normalizedTraceEvents[0] || null;
    const hasTrace = normalizedTraceEvents.length > 0;
    const hasAlignmentDrift = Boolean(scheduleAlignment?.hasDrift);
    const hasRestriction = Boolean(diagnostics?.restrictionType);
    const hasNegativeFloat = Boolean(diagnostics?.hasNegativeFloat);
    const hasReconciliation = Boolean(reconciliation);
    const hasAction = Boolean(hasReconciliation || hasTrace);

    let badge = null;
    if (hasAction) {
        badge = {
            label: 'CPM+',
            className: hasReconciliation
                ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                : 'border-sky-200 bg-sky-50 text-[#136191]',
            tooltip: hasReconciliation
                ? `La tarea mantiene un tanteo CPM activo${reconciliation?.adopted_at ? ` desde ${reconciliation.adopted_at}` : ''}.`
                : `La tarea conserva ${normalizedTraceEvents.length} evento(s) de trazabilidad CPM${latestTrace?.occurred_at ? ` desde ${latestTrace.occurred_at}` : ''}.`,
        };
    }

    return {
        hasAction,
        hasTrace,
        hasReconciliation,
        hasAlignmentDrift,
        hasRestriction,
        hasNegativeFloat,
        latestTrace,
        badge,
    };
};

export const resolveGanttCpmManualEditGuard = ({
    rowLabel = 'la tarea',
    cpmState = null,
    editTargetLabel = 'este ajuste manual',
} = {}) => {
    if (!cpmState?.hasAction) return null;
    const latestAction = cpmState.latestTrace?.action === 'revert'
        ? 'reversión'
        : cpmState.hasReconciliation
            ? 'tanteo adoptado'
            : 'traza CPM';
    return {
        title: 'Edición manual sobre tarea con lectura CPM',
        message: `Vas a abrir ${editTargetLabel} sobre ${rowLabel}, que ya mantiene ${latestAction} de CPM.${cpmState.hasAlignmentDrift ? ' La tarea además sigue desalineada frente al CPM backend.' : ''}\n\nSi continúas, la edición manual pasará a prevalecer como borrador local pendiente de aprobación.`,
    };
};

export const formatGanttCpmHistoryBatchLabel = (count = 0) => {
    const safeCount = Math.max(0, Number(count || 0));
    return `${safeCount} tanteo${safeCount === 1 ? '' : 's'} CPM`;
};
