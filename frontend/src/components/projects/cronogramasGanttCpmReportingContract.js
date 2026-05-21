const normalizeNumber = (value, fallback = 0) => {
    const nextValue = Number(value);
    return Number.isFinite(nextValue) ? nextValue : fallback;
};

export const buildGanttCpmReportingLineContract = ({
    row = null,
    diagnostics = null,
    scheduleAlignment = null,
    reconciliation = null,
    traceEvents = [],
} = {}) => {
    const normalizedTraceEvents = Array.isArray(traceEvents) ? traceEvents.filter(Boolean) : [];
    const latestTrace = normalizedTraceEvents[0] || null;
    const criticalPathIndexes = Array.isArray(diagnostics?.criticalPathIndexes)
        ? diagnostics.criticalPathIndexes
        : [];
    return {
        line_id: row?.budget_line_id ?? row?.linea_id ?? null,
        item_code: row?.codigo_item || null,
        description: row?.descripcion || null,
        cpm_available: Boolean(diagnostics),
        critical_path_count: normalizeNumber(diagnostics?.criticalPathCount, 0),
        critical_path_indexes: criticalPathIndexes,
        total_float_days: diagnostics ? normalizeNumber(diagnostics?.totalSlack, 0) : null,
        free_float_days: diagnostics ? normalizeNumber(diagnostics?.freeSlack, 0) : null,
        has_negative_float: Boolean(diagnostics?.hasNegativeFloat),
        restriction_type: diagnostics?.restrictionType || null,
        restriction_label: diagnostics?.restrictionLabel || null,
        project_duration_days: diagnostics?.projectDuration ?? null,
        has_schedule_drift: Boolean(scheduleAlignment?.hasDrift),
        drift_start_days: scheduleAlignment?.hasDrift ? normalizeNumber(scheduleAlignment?.driftStart, 0) : null,
        drift_finish_days: scheduleAlignment?.hasDrift ? normalizeNumber(scheduleAlignment?.driftFinish, 0) : null,
        drift_duration_days: scheduleAlignment?.hasDrift ? normalizeNumber(scheduleAlignment?.driftDuration, 0) : null,
        cpm_reconciled: Boolean(reconciliation),
        cpm_reconciliation_adopted_at: reconciliation?.adopted_at || null,
        cpm_trace_count: normalizedTraceEvents.length,
        cpm_last_action: latestTrace?.action || null,
        cpm_last_mode: latestTrace?.mode || null,
        cpm_last_actor_email: latestTrace?.actor_email || null,
        cpm_last_occurred_at: latestTrace?.occurred_at || null,
    };
};

export const summarizeGanttCpmReportingContract = (contracts = []) => {
    return (Array.isArray(contracts) ? contracts : []).reduce((summary, entry) => {
        if (!entry) return summary;
        summary.total_lines += 1;
        if (entry.cpm_available) summary.cpm_available_lines += 1;
        if (entry.has_negative_float) summary.negative_float_lines += 1;
        if (entry.restriction_type) summary.restricted_lines += 1;
        if (entry.has_schedule_drift) summary.drift_lines += 1;
        if (entry.cpm_reconciled) summary.reconciled_lines += 1;
        if (normalizeNumber(entry.cpm_trace_count, 0) > 0) summary.traced_lines += 1;
        return summary;
    }, {
        total_lines: 0,
        cpm_available_lines: 0,
        negative_float_lines: 0,
        restricted_lines: 0,
        drift_lines: 0,
        reconciled_lines: 0,
        traced_lines: 0,
    });
};
