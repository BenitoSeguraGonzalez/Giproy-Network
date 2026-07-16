import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const licenseNotificationsApi = {
    getMine: async () => {
        const response = await api.get('/license-notifications/me', {
            ...withoutTenant(),
        });
        return response.data;
    },

    acknowledge: async (id) => {
        const response = await api.post(`/license-notifications/${id}/ack`, null, {
            ...withoutTenant(),
        });
        return response.data;
    },
};

export default licenseNotificationsApi;
