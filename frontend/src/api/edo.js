import axiosConfig from './axiosConfig';
import { withTenantConfig } from './tenant';

export const edoApi = {
    // Obtener el árbol EDO para un proyecto
    getTree: async (proyectoId, empresaId = null) => {
        const response = await axiosConfig.get(`/edo/project/${proyectoId}`, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Crear un nuevo nodo (HITO o STAKEHOLDER)
    create: async (data, empresaId = null) => {
        const response = await axiosConfig.post('/edo/', data, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Actualizar datos básicos de un nodo
    update: async (id, data, empresaId = null) => {
        const response = await axiosConfig.put(`/edo/${id}`, data, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Mover nodo a otra rama o posición
    move: async (id, newParentId, newOrden, empresaId = null) => {
        const response = await axiosConfig.put(`/edo/${id}/move`, {
            new_parent_id: newParentId,
            new_orden: newOrden
        }, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Eliminar un nodo recursivamente
    delete: async (id, empresaId = null) => {
        const response = await axiosConfig.delete(`/edo/${id}`, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Acciones en bloque
    bulkDelete: async (ids, empresaId = null) => {
        const response = await axiosConfig.post('/edo/bulk-delete', { ids }, withTenantConfig({}, empresaId));
        return response.data;
    },

    bulkMove: async (ids, newParentId, empresaId = null) => {
        const response = await axiosConfig.post('/edo/bulk-move', { ids, new_parent_id: newParentId }, withTenantConfig({}, empresaId));
        return response.data;
    }
};
