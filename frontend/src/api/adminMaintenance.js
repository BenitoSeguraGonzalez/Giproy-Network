import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const adminMaintenanceApi = {
    getConfig: async () => {
        const response = await api.get('/admin-maintenance/', withoutTenant());
        return response.data;
    },

    getActive: async () => {
        const response = await api.get('/admin-maintenance/active', withoutTenant());
        return response.data;
    },

    updateConfig: async (payload) => {
        const response = await api.put('/admin-maintenance/', payload, withoutTenant());
        return response.data;
    },
};

export default adminMaintenanceApi;
