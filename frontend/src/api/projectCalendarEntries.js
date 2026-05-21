import axiosInstance from './axiosConfig';
import { withTenantConfig, withTenantParams } from './tenant';

export const projectCalendarEntriesApi = {
    getAll: async (params = {}) => {
        const response = await axiosInstance.get('/proyectos/calendar-entries/', {
            params: withTenantParams(params),
        });
        return response.data;
    },

    create: async (payload, empresaId = null) => {
        const response = await axiosInstance.post(
            '/proyectos/calendar-entries/',
            payload,
            withTenantConfig({}, empresaId)
        );
        return response.data;
    },

    update: async (entryId, payload, empresaId = null) => {
        const response = await axiosInstance.put(
            `/proyectos/calendar-entries/${entryId}`,
            payload,
            withTenantConfig({}, empresaId)
        );
        return response.data;
    },

    delete: async (entryId, empresaId = null) => {
        const response = await axiosInstance.delete(
            `/proyectos/calendar-entries/${entryId}`,
            withTenantConfig({}, empresaId)
        );
        return response.data;
    },
};

export default projectCalendarEntriesApi;
