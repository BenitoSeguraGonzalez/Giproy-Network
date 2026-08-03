import axiosInstance from './axiosConfig';
import { withTenantConfig } from './tenant';

export const proyectoDetalleApi = {
    getByRoot: async (codigoRoot, empresaId = null) => {
        const response = await axiosInstance.get(`/proyecto-detalles/${codigoRoot}`, withTenantConfig({}, empresaId));
        return response.data;
    },
    save: async (detalleData, empresaId = null) => {
        const response = await axiosInstance.post('/proyecto-detalles/', detalleData, withTenantConfig({}, empresaId));
        return response.data;
    },
    uploadImage: async (codigoRoot, file, empresaId = null) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post('/proyecto-detalles/upload-image', formData, {
            ...withTenantConfig({}, empresaId),
            params: { codigo_root: codigoRoot, ...(empresaId ? { empresa_id: empresaId } : {}) },
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    listDocuments: async (codigoRoot, empresaId = null) => {
        const response = await axiosInstance.get(`/proyecto-detalles/${codigoRoot}/documents`, withTenantConfig({}, empresaId));
        return response.data;
    },
    uploadDocument: async (codigoRoot, file, empresaId = null) => {
        const formData = new FormData();
        formData.append('file', file);
        const response = await axiosInstance.post(`/proyecto-detalles/${codigoRoot}/documents`, formData, {
            ...withTenantConfig({}, empresaId),
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },
    downloadDocument: async (documentId, empresaId = null) => {
        const response = await axiosInstance.get(`/proyecto-detalles/documents/${documentId}/download`, {
            ...withTenantConfig({}, empresaId),
            responseType: 'blob'
        });
        return response;
    },
    deleteDocument: async (documentId, empresaId = null) => {
        const response = await axiosInstance.delete(`/proyecto-detalles/documents/${documentId}`, withTenantConfig({}, empresaId));
        return response.data;
    },
    geocodeAddress: async (payload, empresaId = null) => {
        const response = await axiosInstance.post('/proyecto-detalles/geocode-address', payload, withTenantConfig({}, empresaId));
        return response.data;
    }
};
