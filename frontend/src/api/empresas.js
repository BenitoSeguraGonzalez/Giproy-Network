import api from './axiosConfig';

export const empresasApi = {
    getAll: async () => {
        const response = await api.get('/empresas/');
        return response.data;
    },

    getById: async (empresaId) => {
        const response = await api.get(`/empresas/${empresaId}`);
        return response.data;
    },

    create: async (payload) => {
        const response = await api.post('/empresas/', payload);
        return response.data;
    },

    update: async (empresaId, payload) => {
        const response = await api.put(`/empresas/${empresaId}`, payload);
        return response.data;
    },

    uploadLogo: async (empresaId, formData) => {
        const response = await api.post(`/empresas/upload-logo/${empresaId}`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    delete: async (empresaId) => {
        const response = await api.delete(`/empresas/${empresaId}`);
        return response.data;
    },
};

export default empresasApi;
