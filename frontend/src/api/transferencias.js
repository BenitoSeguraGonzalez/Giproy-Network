import api from './axiosConfig';
import { withTenantConfig, withTenantParams } from './tenant';

const withEmpresaParams = (params = {}, empresaId = null) => withTenantParams(params, empresaId);

export const transferenciasApi = {
    getContract: async () => {
        const response = await api.get('/transferencias/contract');
        return response.data;
    },
    getTraySummary: async (empresaId = null) => {
        const response = await api.get('/transferencias/tray-summary', {
            params: withEmpresaParams({}, empresaId),
        });
        return response.data;
    },
    getTray: async (params = {}, empresaId = null) => {
        const response = await api.get('/transferencias/tray', {
            params: withEmpresaParams(params, empresaId),
        });
        return response.data;
    },
    getMyCode: async (empresaId = null) => {
        const response = await api.get('/transferencias/my-code', withTenantConfig({}, empresaId));
        return response.data;
    },
    getRecipients: async (empresaId = null) => {
        const response = await api.get('/transferencias/recipients', withTenantConfig({}, empresaId));
        return response.data;
    },
    resolveRecipientCode: async (publicCode, empresaId = null) => {
        const response = await api.post('/transferencias/recipient-code/resolve', {
            public_code: publicCode,
        }, withTenantConfig({}, empresaId));
        return response.data;
    },
    createRecipient: async ({ public_code, confirm = true, confirmed_display_name = null } = {}, empresaId = null) => {
        const response = await api.post('/transferencias/recipients', {
            public_code,
            confirm,
            confirmed_display_name,
        }, withTenantConfig({}, empresaId));
        return response.data;
    },
    preflight: async (payload = {}, empresaId = null) => {
        const response = await api.post('/transferencias/preflight', payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    createShipment: async (payload = {}, empresaId = null) => {
        const response = await api.post('/transferencias/shipments', payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    cancelShipment: async (shipmentId, reason = null, empresaId = null) => {
        const response = await api.post(`/transferencias/shipments/${shipmentId}/cancel`, { reason }, withTenantConfig({}, empresaId));
        return response.data;
    },
    rejectShipment: async (shipmentId, reason, empresaId = null) => {
        const response = await api.post(`/transferencias/shipments/${shipmentId}/reject`, { reason }, withTenantConfig({}, empresaId));
        return response.data;
    },
    importShipment: async (shipmentId, empresaId = null) => {
        const response = await api.post(`/transferencias/shipments/${shipmentId}/import`, {}, withTenantConfig({}, empresaId));
        return response.data;
    },
    getMarketplaceRequirements: async (shipmentId, empresaId = null) => {
        const response = await api.get(`/transferencias/shipments/${shipmentId}/marketplace-requirements`, withTenantConfig({}, empresaId));
        return response.data;
    },
    revalidateMarketplaceRequirements: async (shipmentId, empresaId = null) => {
        const response = await api.post(`/transferencias/shipments/${shipmentId}/marketplace-requirements/revalidate`, {}, withTenantConfig({}, empresaId));
        return response.data;
    },
};

export default transferenciasApi;
