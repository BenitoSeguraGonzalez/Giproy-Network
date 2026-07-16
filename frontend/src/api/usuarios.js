import api from './axiosConfig';
import { withoutTenant, withTenantParams } from './tenant';

export const usuariosApi = {
    getAll: async (params = {}) => {
        const response = await api.get('/usuarios/', { params: withTenantParams(params) });
        return response.data;
    },

    getAllGlobal: async () => {
        const response = await api.get('/usuarios/', withoutTenant());
        return response.data;
    },

    create: async (payload, params = {}) => {
        const response = await api.post('/usuarios/', payload, { params: withTenantParams(params) });
        return response.data;
    },

    update: async (usuarioId, payload, params = {}) => {
        const response = await api.put(`/usuarios/${usuarioId}`, payload, { params: withTenantParams(params) });
        return response.data;
    },

    updateGlobal: async (usuarioId, payload) => {
        const response = await api.put(`/usuarios/${usuarioId}`, payload, withoutTenant());
        return response.data;
    },

    delete: async (usuarioId, params = {}) => {
        const response = await api.delete(`/usuarios/${usuarioId}`, { params: withTenantParams(params) });
        return response.data;
    }
};

export default usuariosApi;
