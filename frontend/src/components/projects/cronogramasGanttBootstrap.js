export const shouldAttemptGanttBudgetFallback = ({
    scheduleTab,
    resolvedBudgetId,
    projectId,
}) => scheduleTab === 'gantt' && !resolvedBudgetId && Boolean(projectId);

export const resolveEffectiveGanttBootstrapState = ({
    scheduleTab,
    project,
    projectId,
    resolvedBudgetId,
    ganttBudgetResolving,
    cronogramaTrabajoLoading,
    cronogramaTrabajo,
    cronogramaTrabajoError,
}) => {
    if (scheduleTab !== 'gantt') {
        return false;
    }

    if (!project) {
        return true;
    }

    const fallbackPending = shouldAttemptGanttBudgetFallback({
        scheduleTab,
        resolvedBudgetId,
        projectId,
    }) && ganttBudgetResolving;

    const trabajoPending = Boolean(resolvedBudgetId)
        && cronogramaTrabajoLoading
        && !cronogramaTrabajo
        && !cronogramaTrabajoError;

    return fallbackPending || trabajoPending;
};
