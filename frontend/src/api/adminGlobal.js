import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const adminGlobalApi = {
    getEmpresas: async () => {
        const response = await api.get('/empresas/', withoutTenant());
        return response.data;
    },
    getUsuarios: async () => {
        const response = await api.get('/usuarios/', withoutTenant());
        return response.data;
    },
};

export default adminGlobalApi;
