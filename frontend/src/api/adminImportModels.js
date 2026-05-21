import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const adminImportModelsApi = {
    list: async () => {
        const response = await api.get('/admin-import-models/', withoutTenant());
        return response.data;
    },

    save: async (profileId, payload) => {
        const response = await api.put(`/admin-import-models/${profileId}`, payload, withoutTenant());
        return response.data;
    },

    activate: async (profileId) => {
        const response = await api.post(`/admin-import-models/${profileId}/activate`, {}, withoutTenant());
        return response.data;
    },

    deactivate: async (profileId) => {
        const response = await api.post(`/admin-import-models/${profileId}/deactivate`, {}, withoutTenant());
        return response.data;
    },

    clone: async (profileId, payload) => {
        const response = await api.post(`/admin-import-models/${profileId}/clone`, payload, withoutTenant());
        return response.data;
    },

    autocreatePreview: async ({ file, desiredName }) => {
        const formData = new FormData();
        formData.append('file', file);
        if (desiredName) {
            formData.append('desired_name', desiredName);
        }
        const response = await api.post('/admin-import-models/autocreate-preview', formData, {
            ...withoutTenant(),
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },
};

export default adminImportModelsApi;
