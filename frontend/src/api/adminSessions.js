import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const adminSessionsApi = {
    getAll: async () => {
        const response = await api.get('/admin-system/sessions', withoutTenant());
        return response.data;
    },

    revoke: async (userId) => {
        const response = await api.post(`/admin-system/sessions/${userId}/revoke`, {}, withoutTenant());
        return response.data;
    },
};

export default adminSessionsApi;
