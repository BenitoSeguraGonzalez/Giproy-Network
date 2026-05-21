import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const adminSystemApi = {
    getStatus: async () => {
        const response = await api.get('/admin-system/status', withoutTenant());
        return response.data;
    },
};

export default adminSystemApi;
