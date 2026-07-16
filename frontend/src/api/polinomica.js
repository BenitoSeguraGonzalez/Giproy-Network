import api from './axiosConfig';

export const polinomicaApi = {
    getIndicesInec: async () => {
        const response = await api.get('/polinomica/indices-inec');
        return response.data;
    },

    getResources: async (presupuestoId) => {
        const response = await api.get(`/polinomica/${presupuestoId}/resources`);
        return response.data;
    },

    getFormula: async (presupuestoId) => {
        const response = await api.get(`/polinomica/${presupuestoId}`);
        return response.data;
    },

    regenerate: async (presupuestoId, tipo) => {
        const response = await api.post(
            `/polinomica/${presupuestoId}/regenerate`,
            null,
            { params: { tipo } }
        );
        return response.data;
    },

    saveAssignments: async (presupuestoId, payload) => {
        const response = await api.post(`/polinomica/${presupuestoId}/assignments`, payload);
        return response.data;
    },

    saveIndices: async (presupuestoId, payload) => {
        const response = await api.post(`/polinomica/${presupuestoId}/indices`, payload);
        return response.data;
    },
};

export default polinomicaApi;
