import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const authApi = {
    refreshAccessToken: async () => {
        const response = await api.post('/login/refresh', {}, withoutTenant());
        return response.data;
    },

    getCurrentUser: async () => {
        const response = await api.get('/usuarios/me', withoutTenant());
        return response.data;
    },

    login: async (body, params = {}) => {
        const response = await api.post('/login/access-token', body, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            params,
            skipTenant: true,
        });
        return response.data;
    },

    logout: async () => {
        const response = await api.post('/login/logout', {}, withoutTenant());
        return response.data;
    },
};

export default authApi;
