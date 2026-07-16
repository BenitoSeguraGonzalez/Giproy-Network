import axiosInstance from './axiosConfig';
import { withTenantConfig } from './tenant';

export const cronogramasApi = {
    getValorado: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.get(`/cronogramas/valorados/${presupuestoId}`, withTenantConfig({}, empresaId));
        return response.data;
    },

    getRecursos: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.get(`/cronogramas/valorados/${presupuestoId}/recursos`, withTenantConfig({}, empresaId));
        return response.data;
    },

    getRecursosState: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.get(`/cronogramas/valorados/${presupuestoId}/recursos/state`, withTenantConfig({}, empresaId));
        return response.data;
    },

    updateRecursosState: async (presupuestoId, data, empresaId = null) => {
        const response = await axiosInstance.put(`/cronogramas/valorados/${presupuestoId}/recursos/state`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    updateValoradoConfig: async (presupuestoId, data, empresaId = null) => {
        const response = await axiosInstance.put(`/cronogramas/valorados/${presupuestoId}/config`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    updateValoradoLinea: async (presupuestoId, lineaId, data, empresaId = null) => {
        const response = await axiosInstance.put(`/cronogramas/valorados/${presupuestoId}/lineas/${lineaId}`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    resetValoradoLinea: async (presupuestoId, lineaId, empresaId = null) => {
        const response = await axiosInstance.delete(`/cronogramas/valorados/${presupuestoId}/lineas/${lineaId}`, withTenantConfig({}, empresaId));
        return response.data;
    },

    getTrabajo: async (presupuestoId, empresaId = null, options = {}) => {
        const params = {
            ...(options.compact ? { compact: true } : {}),
            ...(options.metadataMode ? { metadata_mode: options.metadataMode } : {}),
        };
        const response = await axiosInstance.get(`/cronogramas-trabajo/${presupuestoId}`, withTenantConfig({ params }, empresaId));
        return response.data;
    },

    getTrabajoLineMetadata: async (presupuestoId, lineaId, empresaId = null) => {
        const response = await axiosInstance.get(
            `/cronogramas-trabajo/${presupuestoId}/lineas/${lineaId}/metadata`,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },

    getTrabajoPareto: async (presupuestoId, params = {}, empresaId = null) => {
        const response = await axiosInstance.get(`/cronogramas-trabajo/${presupuestoId}/pareto`, withTenantConfig({ params }, empresaId));
        return response.data;
    },

    updateTrabajo: async (presupuestoId, data, empresaId = null) => {
        const response = await axiosInstance.put(`/cronogramas-trabajo/${presupuestoId}`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    updateTrabajoDelta: async (presupuestoId, data, empresaId = null) => {
        const response = await axiosInstance.put(`/cronogramas-trabajo/${presupuestoId}/commit-delta`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    getTrabajoGanttDraft: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.get(`/cronogramas-trabajo/${presupuestoId}/gantt-draft`, withTenantConfig({}, empresaId));
        return response.data;
    },

    saveTrabajoGanttDraftIntention: async (presupuestoId, data, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/gantt-draft/intentions`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    preflightTrabajoGanttDraftApply: async (presupuestoId, data = {}, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/gantt-draft/preflight`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    applyTrabajoGanttDraft: async (presupuestoId, data = {}, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/gantt-draft/apply`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    discardInvalidatedTrabajoGanttDraft: async (presupuestoId, data = {}, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/gantt-draft/discard-invalidated`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    prepareInvalidatedTrabajoGanttDraftAdjustment: async (presupuestoId, data = {}, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/gantt-draft/prepare-adjustment`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    acquireTrabajoGanttLock: async (presupuestoId, data = {}, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/gantt-lock/acquire`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    heartbeatTrabajoGanttLock: async (presupuestoId, data = {}, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/gantt-lock/heartbeat`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    requestTrabajoGanttLockRelease: async (presupuestoId, data = {}, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/gantt-lock/request-release`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    releaseTrabajoGanttLock: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/gantt-lock/release`, {}, withTenantConfig({}, empresaId));
        return response.data;
    },

    resetIntegral: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/reset-integral`, {}, withTenantConfig({}, empresaId));
        return response.data;
    },

    mergeTrabajoInterparentSubbars: async (presupuestoId, data, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/merge-interparent-subbars`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    reloadTrabajoHolidayCalendar: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/holiday-calendar/reload`, {}, withTenantConfig({}, empresaId));
        return response.data;
    },

    resetTrabajoHolidayCalendar: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/holiday-calendar/reset`, {}, withTenantConfig({}, empresaId));
        return response.data;
    },

    addTrabajoHolidayCalendarManual: async (presupuestoId, data, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/holiday-calendar/manual`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    removeTrabajoHolidayCalendarDay: async (presupuestoId, data, empresaId = null) => {
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/holiday-calendar/remove`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    exportTrabajoMsProject: async (presupuestoId, empresaId = null, format = 'xml', openAfterExport = false) => {
        return axiosInstance.get(`/cronogramas-trabajo/${presupuestoId}/export/ms-project`, {
            ...withTenantConfig({}, empresaId),
            params: { format, open_after_export: openAfterExport },
            responseType: 'blob',
        });
    },

    importTrabajoMsProject: async (presupuestoId, file, empresaId = null) => {
        const formData = new FormData();
        formData.append('file', file);
        const config = withTenantConfig({}, empresaId);
        config.headers = {
            ...(config.headers || {}),
            'Content-Type': 'multipart/form-data',
        };
        const response = await axiosInstance.post(`/cronogramas-trabajo/${presupuestoId}/import/ms-project`, formData, config);
        return response.data;
    },
};
