import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const adminBimApi = {
    getConfig: async () => {
        const response = await api.get('/admin-bim/', withoutTenant());
        return response.data;
    },

    updateConfig: async (payload) => {
        const response = await api.put('/admin-bim/', payload, withoutTenant());
        return response.data;
    },
};

export default adminBimApi;
