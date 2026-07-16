import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const adminLicensesApi = {
    getSummary: async () => {
        const response = await api.get('/admin-licenses/summary', withoutTenant());
        return response.data;
    },
    getCatalog: async () => {
        const response = await api.get('/admin-licenses/catalog', withoutTenant());
        return response.data;
    },
    updateCompany: async (empresaId, payload) => {
        const response = await api.put(`/empresas/${empresaId}`, payload, withoutTenant());
        return response.data;
    },
    assignLicense: async (payload) => {
        const response = await api.post('/admin-licenses/assign', payload, withoutTenant());
        return response.data;
    },
    recalculateUsage: async (empresaId) => {
        const response = await api.post(`/admin-licenses/recalculate/${empresaId}`, {}, withoutTenant());
        return response.data;
    },
    runHousekeeping: async (empresaId = null) => {
        const response = await api.post('/admin-licenses/housekeeping/run', { empresa_id: empresaId }, withoutTenant());
        return response.data;
    },
    getHistory: async (empresaId, limit = 20) => {
        const response = await api.get(`/admin-licenses/history/${empresaId}`, {
            ...withoutTenant(),
            params: { limit },
        });
        return response.data;
    },
    getMyLicense: async (params = {}) => {
        const response = await api.get('/admin-licenses/me', withoutTenant({ params }));
        return response.data;
    }
};

export default adminLicensesApi;
