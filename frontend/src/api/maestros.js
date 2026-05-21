import axiosInstance from './axiosConfig';
import { withoutTenant } from './tenant';

export const maestrosApi = {
    getTiposProyecto: async () => {
        const response = await axiosInstance.get('/maestros/tipos-proyecto', withoutTenant());
        return response.data;
    },
    getCategorias: async (tipoId) => {
        const response = await axiosInstance.get(`/maestros/categorias/${tipoId}`, withoutTenant());
        return response.data;
    },
    getProvincias: async () => {
        const response = await axiosInstance.get('/maestros/ecuador/provincias', withoutTenant());
        return response.data;
    },
    getCantones: async (provincia) => {
        const response = await axiosInstance.get(`/maestros/ecuador/cantones/${encodeURIComponent(provincia)}`, withoutTenant());
        return response.data;
    },
    getOmniClassSearch: async (q, tabla = null) => {
        const params = { q };
        if (tabla) params.tabla = tabla;
        const response = await axiosInstance.get('/maestros/omniclass/search', { params, ...withoutTenant() });
        return response.data;
    },
    getOmniClassTabla: async (tablaId, nivel = null, parentId = null) => {
        const params = {};
        if (nivel) params.nivel = nivel;
        if (parentId) params.parent_id = parentId;
        const response = await axiosInstance.get(`/maestros/omniclass/tabla/${tablaId}`, { params, ...withoutTenant() });
        return response.data;
    }
};
