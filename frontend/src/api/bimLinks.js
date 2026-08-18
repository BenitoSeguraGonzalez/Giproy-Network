import axiosInstance from './axiosConfig';
import { withTenantConfig } from './tenant';

export const bimLinksApi = {
    listByProject: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/links`, withTenantConfig({}, empresaId));
        return response.data;
    },
    listElementsByProject: async (projectId, empresaId = null, versionId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/elements`, withTenantConfig({ params: versionId ? { version_id: versionId } : {} }, empresaId));
        return response.data;
    },
    searchElementsByProject: async (projectId, params = {}, empresaId = null) => {
        const response = await axiosInstance.get(
            `/bim/projects/${projectId}/elements/search`,
            withTenantConfig({ params }, empresaId),
        );
        return response.data;
    },
    create: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/links`, payload, withTenantConfig({}, empresaId));
        return response.data;
    },
    remove: async (projectId, targetType, linkId, empresaId = null) => {
        await axiosInstance.delete(`/bim/projects/${projectId}/links/${targetType}/${linkId}`, withTenantConfig({}, empresaId));
    },
};
