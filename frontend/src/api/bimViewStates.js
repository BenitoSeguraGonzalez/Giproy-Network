import axiosInstance from './axiosConfig';
import { withTenantConfig } from './tenant';

export const bimViewStatesApi = {
    listByProject: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/view-states`, withTenantConfig({}, empresaId));
        return response.data;
    },
    createByProject: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/view-states`,
            payload,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    getByProject: async (projectId, viewStateId, empresaId = null) => {
        const response = await axiosInstance.get(
            `/bim/projects/${projectId}/view-states/${viewStateId}`,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    updateByProject: async (projectId, viewStateId, payload, empresaId = null) => {
        const response = await axiosInstance.patch(
            `/bim/projects/${projectId}/view-states/${viewStateId}`,
            payload,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    duplicateByProject: async (projectId, viewStateId, payload = {}, empresaId = null) => {
        const response = await axiosInstance.post(
            `/bim/projects/${projectId}/view-states/${viewStateId}/duplicate`,
            payload,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
    deleteByProject: async (projectId, viewStateId, empresaId = null) => {
        await axiosInstance.delete(
            `/bim/projects/${projectId}/view-states/${viewStateId}`,
            withTenantConfig({}, empresaId),
        );
    },
    getWorkspaceContext: async (projectId, empresaId = null) => {
        const response = await axiosInstance.get(`/bim/projects/${projectId}/workspace-context`, withTenantConfig({}, empresaId));
        return response.data;
    },
    updateWorkspaceContext: async (projectId, payload, empresaId = null) => {
        const response = await axiosInstance.put(
            `/bim/projects/${projectId}/workspace-context`,
            payload,
            withTenantConfig({}, empresaId),
        );
        return response.data;
    },
};
