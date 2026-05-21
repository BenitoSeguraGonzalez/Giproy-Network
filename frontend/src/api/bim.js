import axiosInstance from './axiosConfig';
import { withTenantConfig } from './tenant';

export const bimApi = {
    getFeatureFlags: async (empresaId = null) => {
        const response = await axiosInstance.get('/bim/feature-flags/me', withTenantConfig({}, empresaId));
        return response.data;
    },
};
