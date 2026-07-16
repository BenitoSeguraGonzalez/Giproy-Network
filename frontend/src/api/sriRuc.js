import api from './axiosConfig';

export const sriRucApi = {
    getStatus: async () => (await api.get('/sri-ruc/admin/status')).data,
    syncProvince: async (provinceCode, force = false) => (
        await api.post(`/sri-ruc/admin/sync/${provinceCode}`, null, { params: { force } })
    ).data,
    listManualReviews: async (status = 'pending') => (
        await api.get('/sri-ruc/admin/manual-reviews', { params: { status } })
    ).data,
    decideManualReview: async (reviewId, payload) => (
        await api.post(`/sri-ruc/admin/manual-reviews/${reviewId}/decision`, payload)
    ).data,
};

export default sriRucApi;
