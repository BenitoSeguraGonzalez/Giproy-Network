export const GIPROY_BUDGET_PRODUCTIVITY_UPDATED_EVENT = 'giproy:budget-productivity-updated';

export const dispatchBudgetProductivityUpdated = (detail = {}) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent(GIPROY_BUDGET_PRODUCTIVITY_UPDATED_EVENT, {
        detail: {
            presupuestoId: detail.presupuestoId != null ? String(detail.presupuestoId) : '',
            apuId: detail.apuId != null ? Number(detail.apuId) : null,
            source: detail.source || 'budget_apu_editor',
            updatedAt: detail.updatedAt || new Date().toISOString(),
        },
    }));
};
