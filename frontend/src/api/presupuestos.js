import axiosInstance from './axiosConfig';
import { withTenantConfig, withTenantParams } from './tenant';

export const presupuestosApi = {
    // Listar presupuestos de una empresa (opcional filtro por proyecto)
    getAll: async (params = {}) => {
        const response = await axiosInstance.get('/presupuestos/', { params: withTenantParams(params) });
        return response.data;
    },

    // Obtener presupuestos por proyecto
    getByProyecto: async (proyectoId, empresaId = null) => {
        const response = await axiosInstance.get('/presupuestos/', { 
            params: withTenantParams({ proyecto_id: proyectoId }, empresaId) 
        });
        return response; // Note: Presupuestos.jsx expects { data: [...] } if it follows the Axios response structure
    },

    // Obtener un presupuesto por ID
    getById: async (id, empresaId = null, options = {}) => {
        const response = await axiosInstance.get(
            `/presupuestos/${id}`,
            withTenantConfig({ params: { refresh_prices: options.refreshPrices ?? true } }, empresaId)
        );

        return response.data;
    },

    // Crear presupuesto
    create: async (data, params = {}) => {
        const response = await axiosInstance.post('/presupuestos/', data, { params: withTenantParams(params) });
        return response.data;
    },

    // Agregar línea al presupuesto
    addLine: async (presupuestoId, lineData, empresaId = null) => {
        const response = await axiosInstance.post(`/presupuestos/${presupuestoId}/lineas`, lineData, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Eliminar línea del presupuesto
    deleteLine: async (lineaId, empresaId = null) => {
        const response = await axiosInstance.delete(`/presupuestos/lineas/${lineaId}`, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Mover línea del presupuesto
    moveLine: async (lineaId, moveData, empresaId = null) => {
        const response = await axiosInstance.put(`/presupuestos/lineas/${lineaId}/move`, moveData, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Actualizar línea del presupuesto
    updateLine: async (lineaId, updateData, empresaId = null) => {
        const response = await axiosInstance.put(`/presupuestos/lineas/${lineaId}`, updateData, withTenantConfig({}, empresaId));
        return response.data;
    },

    bulkUpdateLineQuantities: async (presupuestoId, items, empresaId = null) => {
        const response = await axiosInstance.put(
            `/presupuestos/${presupuestoId}/lineas/bulk-cantidad`,
            { items },
            withTenantConfig({}, empresaId)
        );
        return response.data;
    },

    getNotesSummary: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.get(`/presupuestos/${presupuestoId}/notas/summary`, withTenantConfig({}, empresaId));
        return response.data;
    },

    getPareto: async (presupuestoId, params = {}, empresaId = null) => {
        const response = await axiosInstance.get(`/presupuestos/${presupuestoId}/pareto`, { params: withTenantParams(params, empresaId) });
        return response.data;
    },

    getIndirectos: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.get(`/presupuestos/${presupuestoId}/indirectos`, withTenantConfig({}, empresaId));
        return response.data;
    },

    updateIndirectos: async (presupuestoId, data, empresaId = null) => {
        const response = await axiosInstance.put(`/presupuestos/${presupuestoId}/indirectos`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    markOpened: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.post(`/presupuestos/${presupuestoId}/notas/opened`, null, withTenantConfig({}, empresaId));
        return response.data;
    },

    markGeneralNotesOpened: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.post(`/presupuestos/${presupuestoId}/notas/generales/opened`, null, withTenantConfig({}, empresaId));
        return response.data;
    },

    getGeneralNotes: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.get(`/presupuestos/${presupuestoId}/notas/generales`, withTenantConfig({}, empresaId));
        return response.data;
    },

    createGeneralNote: async (presupuestoId, data, empresaId = null) => {
        const response = await axiosInstance.post(`/presupuestos/${presupuestoId}/notas/generales`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    getLineNotes: async (lineaId, empresaId = null) => {
        const response = await axiosInstance.get(`/presupuestos/lineas/${lineaId}/notas`, withTenantConfig({}, empresaId));
        return response.data;
    },

    createLineNote: async (lineaId, data, empresaId = null) => {
        const response = await axiosInstance.post(`/presupuestos/lineas/${lineaId}/notas`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    markLineNotesOpened: async (lineaId, empresaId = null) => {
        const response = await axiosInstance.post(`/presupuestos/lineas/${lineaId}/notas/opened`, null, withTenantConfig({}, empresaId));
        return response.data;
    },

    applyTanteo: async (presupuestoId, mutaciones, empresaId = null) => {
        const response = await axiosInstance.post(`/presupuestos/${presupuestoId}/tanteo`, { mutaciones }, withTenantConfig({}, empresaId));
        return response.data;
    },

    clearTanteo: async (presupuestoId, empresaId = null) => {
        const response = await axiosInstance.delete(`/presupuestos/${presupuestoId}/tanteo/clear-all`, withTenantConfig({}, empresaId));
        return response.data;
    },

    revertTanteoRecurso: async (presupuestoId, recursoId, empresaId = null) => {
        const response = await axiosInstance.delete(`/presupuestos/${presupuestoId}/tanteo/${recursoId}`, withTenantConfig({}, empresaId));
        return response.data;
    }
};
