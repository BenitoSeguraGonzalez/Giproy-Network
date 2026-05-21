import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const adminAuditApi = {
    getSummary: async () => {
        const response = await api.get('/admin-audit/summary', withoutTenant());
        return response.data;
    },

    getEvents: async (filters = {}) => {
        const response = await api.get('/admin-audit/events', {
            ...withoutTenant(),
            params: filters,
        });
        return response.data;
    },

    getRecentEvents: async (limit = 40) => {
        const response = await api.get('/admin-audit/recent-events', {
            ...withoutTenant(),
            params: { limit },
        });
        return response.data;
    },
};

export default adminAuditApi;
