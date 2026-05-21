import axiosConfig from './axiosConfig';
import { withTenantConfig } from './tenant';

export const stakeholdersApi = {
    // Obtener todos para el proyecto raíz, opcionalmente con asignación para revisión específica
    getByProject: async (codigoRoot, proyectoId = null, empresaId = null) => {
        const params = proyectoId ? { proyecto_id: proyectoId } : {};
        const response = await axiosConfig.get(`/stakeholders/project/${codigoRoot}`, withTenantConfig({ params }, empresaId));
        return response.data;
    },

    create: async (data, empresaId = null) => {
        const response = await axiosConfig.post('/stakeholders/', data, withTenantConfig({}, empresaId));
        return response.data;
    },

    update: async (id, data, empresaId = null) => {
        const response = await axiosConfig.put(`/stakeholders/${id}`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    delete: async (id, empresaId = null) => {
        const response = await axiosConfig.delete(`/stakeholders/${id}`, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Asignación
    assign: async (proyectoId, stakeholderId, rolId = null, empresaId = null) => {
        const response = await axiosConfig.post('/stakeholders/assign', {
            proyecto_id: proyectoId,
            stakeholder_id: stakeholderId,
            rol_id: rolId
        }, withTenantConfig({}, empresaId));
        return response.data;
    },

    unassign: async (proyectoId, stakeholderId, empresaId = null) => {
        const response = await axiosConfig.delete(`/stakeholders/unassign/${proyectoId}/${stakeholderId}`, withTenantConfig({}, empresaId));
        return response.data;
    }
};

export const rolesApi = {
    getAll: async (empresaId = null) => {
        const response = await axiosConfig.get('/roles/', withTenantConfig({}, empresaId));
        return response.data;
    },
    create: async (data, empresaId = null) => {
        const response = await axiosConfig.post('/roles/', data, withTenantConfig({}, empresaId));
        return response.data;
    },
    update: async (id, data, empresaId = null) => {
        const response = await axiosConfig.put(`/roles/${id}`, data, withTenantConfig({}, empresaId));
        return response.data;
    },
    delete: async (id, empresaId = null) => {
        const response = await axiosConfig.delete(`/roles/${id}`, withTenantConfig({}, empresaId));
        return response.data;
    }
};
