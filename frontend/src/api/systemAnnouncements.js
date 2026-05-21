import api from './axiosConfig';
import { withoutTenant } from './tenant';

const cleanParams = (params = {}) => Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== null && value !== undefined && value !== '')
);

export const systemAnnouncementsApi = {
    getActive: async (empresaId = null) => {
        const response = await api.get('/system-announcements/active', {
            params: cleanParams({ empresa_id: empresaId }),
            ...withoutTenant(),
        });
        return response.data;
    },

    getAll: async (filters = {}) => {
        const response = await api.get('/system-announcements/', {
            params: cleanParams(filters),
            ...withoutTenant(),
        });
        return response.data;
    },

    create: async (payload) => {
        const response = await api.post('/system-announcements/', payload);
        return response.data;
    },

    update: async (id, payload) => {
        const response = await api.put(`/system-announcements/${id}`, payload);
        return response.data;
    },

    remove: async (id) => {
        await api.delete(`/system-announcements/${id}`);
    },
};

export default systemAnnouncementsApi;
