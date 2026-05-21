import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const adminSupportApi = {
    getCompanyConsole: async (empresaId) => {
        const response = await api.get(`/admin-system/company-console/${empresaId}`, withoutTenant());
        return response.data;
    },
};

export default adminSupportApi;
