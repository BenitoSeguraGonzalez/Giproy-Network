import api from './axiosConfig';
import { withTenantConfig } from './tenant';

export const edtApi = {
    getTree: async (proyectoId, empresaId) => {
        const response = await api.get(`/edt/project/${proyectoId}`, withTenantConfig({}, empresaId));
        return response.data;
    },

    create: async (data, empresaId) => {
        const response = await api.post('/edt/', data, withTenantConfig({}, empresaId));
        return response.data;
    },

    update: async (id, data, empresaId) => {
        const response = await api.put(`/edt/${id}`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    move: async (id, newParentId, newOrden, empresaId) => {
        const response = await api.put(`/edt/${id}/move`, {
            new_parent_id: newParentId,
            new_orden: newOrden
        }, withTenantConfig({}, empresaId));
        return response.data;
    },

    delete: async (id, empresaId) => {
        const response = await api.delete(`/edt/${id}`, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Acciones en bloque
    bulkDelete: async (ids, empresaId) => {
        const response = await api.post('/edt/bulk-delete', { ids }, withTenantConfig({}, empresaId));
        return response.data;
    },

    bulkMove: async (ids, newParentId, empresaId) => {
        const response = await api.post('/edt/bulk-move', { ids, new_parent_id: newParentId }, withTenantConfig({}, empresaId));
        return response.data;
    }
};
