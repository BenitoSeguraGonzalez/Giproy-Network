import api from './axiosConfig';
import { withTenantConfig, withoutTenant } from './tenant';

const companyConfig = (empresaId = null) => (
    empresaId ? withoutTenant({ params: { empresa_id: empresaId } }) : withTenantConfig()
);

const bodyConfig = (payload = {}) => (
    payload?.empresa_id ? withoutTenant() : withTenantConfig()
);

export const conectaApi = {
    getLimits: async (empresaId = null) => {
        const response = await api.get('/conecta/limits', companyConfig(empresaId));
        return response.data;
    },
    getSlots: async (empresaId = null) => {
        const response = await api.get('/conecta/slots', companyConfig(empresaId));
        return response.data;
    },
    getAdminSummary: async () => {
        const response = await api.get('/conecta/admin/summary', withoutTenant());
        return response.data;
    },
    createSlot: async (payload = {}) => {
        const response = await api.post('/conecta/slots', payload, bodyConfig(payload));
        return response.data;
    },
    releaseSlot: async (slotId, payload = {}) => {
        const response = await api.post(`/conecta/slots/${slotId}/release`, payload, bodyConfig(payload));
        return response.data;
    },
};

export default conectaApi;
