import axiosInstance from './axiosConfig';
import { withTenantConfig, withTenantParams } from './tenant';

export const personalTodosApi = {
    getAll: async (params = {}) => {
        const response = await axiosInstance.get('/usuarios/personal-todos/', {
            params: withTenantParams(params),
        });
        return response.data;
    },

    create: async (payload, empresaId = null) => {
        const response = await axiosInstance.post(
            '/usuarios/personal-todos/',
            payload,
            withTenantConfig({}, empresaId)
        );
        return response.data;
    },

    update: async (todoId, payload, empresaId = null) => {
        const response = await axiosInstance.put(
            `/usuarios/personal-todos/${todoId}`,
            payload,
            withTenantConfig({}, empresaId)
        );
        return response.data;
    },

    delete: async (todoId, empresaId = null) => {
        const response = await axiosInstance.delete(
            `/usuarios/personal-todos/${todoId}`,
            withTenantConfig({}, empresaId)
        );
        return response.data;
    },
};

export default personalTodosApi;
