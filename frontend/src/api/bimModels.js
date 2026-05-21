import axiosInstance from './axiosConfig';
import { withTenantConfig } from './tenant';

export const bimModelsApi = {
    getWorkspace: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/workspace`, withTenantConfig({}, empresaId));
        return response.data;
    },
    listByProject: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/models`, withTenantConfig({}, empresaId));
        return response.data;
    },
    bootstrapDemo: async (projectId, empresaId = null) => {
        const response = await axiosInstance.post(`/bim/projects/${projectId}/bootstrap-demo`, null, withTenantConfig({}, empresaId));
        return response.data;
    },
    importJsonPackage: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/json-package`,
            payload,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    importJsonBatch: async (projectId, packages, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/json-batch`,
            { packages },
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    validateJsonBatch: async (projectId, packages, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/imports/json-validate`,
            { packages },
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
};
