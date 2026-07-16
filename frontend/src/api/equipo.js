import api from './axiosConfig';
import { withTenantConfig, withoutTenant } from './tenant';

const companyConfig = (empresaId = null) => (
    empresaId ? withoutTenant({ params: { empresa_id: empresaId } }) : withTenantConfig()
);

const bodyConfig = (payload = {}) => (
    payload?.empresa_id ? withoutTenant() : withTenantConfig()
);

export const equipoApi = {
    getLimits: async (empresaId = null) => {
        const response = await api.get('/equipo/limits', companyConfig(empresaId));
        return response.data;
    },
    getSeats: async (empresaId = null) => {
        const response = await api.get('/equipo/seats', companyConfig(empresaId));
        return response.data;
    },
    getOperations: async (empresaId = null) => {
        const response = await api.get('/equipo/operations', companyConfig(empresaId));
        return response.data;
    },
    getContext: async (empresaId = null, proyectoId = null) => {
        const params = {};
        if (empresaId) params.empresa_id = empresaId;
        if (proyectoId) params.proyecto_id = proyectoId;
        const response = await api.get('/equipo/context', empresaId || proyectoId ? withoutTenant({ params }) : withTenantConfig());
        return response.data;
    },
    getAdminSummary: async () => {
        const response = await api.get('/equipo/admin/summary', withoutTenant());
        return response.data;
    },
    createSeat: async (payload = {}) => {
        const response = await api.post('/equipo/seats', payload, bodyConfig(payload));
        return response.data;
    },
    releaseSeat: async (seatId, payload = {}) => {
        const response = await api.post(`/equipo/seats/${seatId}/release`, payload, bodyConfig(payload));
        return response.data;
    },
    createAssignment: async (payload = {}) => {
        const response = await api.post('/equipo/assignments', payload, bodyConfig(payload));
        return response.data;
    },
    revokeAssignment: async (assignmentId, payload = {}) => {
        const response = await api.post(`/equipo/assignments/${assignmentId}/revoke`, payload, bodyConfig(payload));
        return response.data;
    },
    createLock: async (payload = {}) => {
        const response = await api.post('/equipo/locks', payload, bodyConfig(payload));
        return response.data;
    },
    releaseLock: async (lockId, payload = {}) => {
        const response = await api.post(`/equipo/locks/${lockId}/release`, payload, bodyConfig(payload));
        return response.data;
    },
    createProposal: async (payload = {}) => {
        const response = await api.post('/equipo/proposals', payload, bodyConfig(payload));
        return response.data;
    },
    reviewProposal: async (proposalId, payload = {}) => {
        const response = await api.post(`/equipo/proposals/${proposalId}/review`, payload, bodyConfig(payload));
        return response.data;
    },
};

export default equipoApi;
