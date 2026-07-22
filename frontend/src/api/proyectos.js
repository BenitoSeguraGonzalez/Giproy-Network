import axiosInstance from './axiosConfig';
import { withTenantConfig, withTenantParams } from './tenant';
import { requestProjectListWithRetry } from './projectListRetry';

export const proyectosApi = {
    // Obtener todos los proyectos del tenant
    getAll: async (params = {}) => {
        const response = await requestProjectListWithRetry(() => (
            axiosInstance.get('/proyectos/', { params: withTenantParams(params) })
        ));
        return response.data;
    },

    // Obtener un solo proyecto
    getById: async (id, empresaId = null) => {
        const response = await axiosInstance.get(`/proyectos/${id}`, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Crear proyecto
    create: async (proyectoData, empresaId = null) => {
        const response = await axiosInstance.post('/proyectos/', proyectoData, withTenantConfig({}, empresaId));
        return response.data;
    },

    previewPublicProcurementImport: async ({ files = [], sourceRoles = {}, existingAnalysis = null, onUploadProgress = null } = {}) => {
        const formData = new FormData();
        files.forEach((file) => {
            formData.append('files', file);
        });

        if (sourceRoles && Object.keys(sourceRoles).length > 0) {
            formData.append('source_roles_json', JSON.stringify(sourceRoles));
        }

        if (existingAnalysis) {
            formData.append('existing_analysis_json', JSON.stringify(existingAnalysis));
        }

        const response = await axiosInstance.post('/proyectos/public-procurement-import/preview', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            },
            ...(onUploadProgress ? { onUploadProgress } : {})
        });
        return response.data;
    },

    materializePublicProcurementImport: async ({ importAnalysis, projectName = null, superadminIncidentConsent = false } = {}) => {
        const response = await axiosInstance.post('/proyectos/public-procurement-import/materialize', {
            import_analysis: importAnalysis,
            project_name: projectName,
            superadmin_incident_consent: Boolean(superadminIncidentConsent)
        });
        return response.data;
    },

    previewProjectMarketplaceExport: async ({ projectId, empresaId = null, productType = null } = {}) => {
        const response = await axiosInstance.post('/proyectos/marketplace-export/preview', {
            project_id: projectId,
            product_type: productType
        }, withTenantConfig({}, empresaId));
        return response.data;
    },

    exportProjectToMarketplace: async ({ projectId, empresaId = null, productType = null, payload = {} } = {}) => {
        const response = await axiosInstance.post('/proyectos/marketplace-export', {
            project_id: projectId,
            product_type: productType,
            ...payload
        }, withTenantConfig({}, empresaId));
        return response.data;
    },

    getProjectMarketplaceExportStatuses: async ({ empresaId = null } = {}) => {
        const response = await axiosInstance.get('/proyectos/marketplace-export/statuses', withTenantConfig({}, empresaId));
        return response.data;
    },

    // Actualizar proyecto
    update: async (id, proyectoData, empresaId = null) => {
        const response = await axiosInstance.put(`/proyectos/${id}`, proyectoData, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Obtener revisiones de un proyecto por su codigo_root
    getRevisions: async (codigoRoot, params = {}) => {
        const response = await axiosInstance.get(`/proyectos/${codigoRoot}/revisiones`, { params: withTenantParams(params) });
        return response.data;
    },

    // Crear una nueva revisión de un proyecto
    createRevision: async (id, empresaId = null) => {
        const response = await axiosInstance.post(`/proyectos/${id}/revision`, {}, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Eliminar una revisión individual (excepto R000)
    deleteRevision: async (id, empresaId = null) => {
        const response = await axiosInstance.delete(`/proyectos/${id}/revision`, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Eliminar proyecto: mueve a papelera y decide si la Base de Proyecto acompaña o se conserva como Base Maestra.
    delete: async (id, empresaId = null, options = {}) => {
        const response = await axiosInstance.delete(
            `/proyectos/${id}`,
            withTenantConfig({
                params: {
                    delete_project_base: options.deleteProjectBase !== false
                }
            }, empresaId)
        );
        return response.data;
    },

    getRecycleBin: async (params = {}) => {
        const response = await axiosInstance.get('/proyectos/papelera', { params: withTenantParams(params) });
        return response.data;
    },

    restoreFromRecycleBin: async (id, empresaId = null) => {
        const response = await axiosInstance.post(`/proyectos/papelera/${id}/restore`, {}, withTenantConfig({}, empresaId));
        return response.data;
    },

    purgeFromRecycleBin: async (id, empresaId = null) => {
        const response = await axiosInstance.delete(`/proyectos/papelera/${id}/purge`, withTenantConfig({}, empresaId));
        return response.data;
    },

    purgeExpiredRecycleBin: async (empresaId = null) => {
        const response = await axiosInstance.post('/proyectos/papelera/purge-expired', {}, withTenantConfig({}, empresaId));
        return response.data;
    },

    // Buscar proyecto por el ID de su base de trabajo vinculada
    getByBaseId: async (baseId, empresaId = null) => {
        const response = await axiosInstance.get(`/proyectos/by-base/${baseId}`, withTenantConfig({}, empresaId));
        return response.data;
    },

    getPermissions: async (id, empresaId = null) => {
        const response = await axiosInstance.get(`/proyectos/${id}/permissions`, withTenantConfig({}, empresaId));
        return response.data;
    },

    getAssignmentDashboard: async (id, empresaId = null, modulo = 'todos') => {
        const config = withTenantConfig({ params: { modulo } }, empresaId);
        const response = await axiosInstance.get(`/proyectos/${id}/assignment-dashboard`, config);
        return response.data;
    },

    getUserSummary: async (id, usuarioId, empresaId = null) => {
        const response = await axiosInstance.get(`/proyectos/${id}/user-summary/${usuarioId}`, withTenantConfig({}, empresaId));
        return response.data;
    },

    getAssignedUsers: async (id, params = {}) => {
        const response = await axiosInstance.get(`/proyectos/${id}/assigned-users`, { params: withTenantParams(params) });
        return response.data;
    },

    assignUser: async (id, params = {}) => {
        const response = await axiosInstance.post(`/proyectos/${id}/assign`, null, { params: withTenantParams(params) });
        return response.data;
    },

    unassignUser: async (id, usuarioId, params = {}) => {
        const response = await axiosInstance.delete(`/proyectos/${id}/assign/${usuarioId}`, { params: withTenantParams(params) });
        return response.data;
    }
};
