import api from './axiosConfig';
import { withTenantConfig, withTenantParams } from './tenant';

export const basesTrabajoApi = {
    getAll: (params) => api.get('/bases-trabajo/', { params: withTenantParams(params) }),
    getById: (id, empresaId = null) => api.get(`/bases-trabajo/${id}`, withTenantConfig({}, empresaId)),
    create: (data, empresaId = null) => api.post('/bases-trabajo/', data, withTenantConfig({}, empresaId)),
    update: (id, data, empresaId = null) => api.put(`/bases-trabajo/${id}`, data, withTenantConfig({}, empresaId)),
    delete: (id, empresaId = null) => api.delete(`/bases-trabajo/${id}`, withTenantConfig({}, empresaId)),
    getRecycleBin: (params = {}) => api.get('/bases-trabajo/papelera', { params: withTenantParams(params) }),
    restoreFromRecycleBin: (id, empresaId = null) => api.post(`/bases-trabajo/papelera/${id}/restore`, {}, withTenantConfig({}, empresaId)),
    purgeFromRecycleBin: (id, empresaId = null) => api.delete(`/bases-trabajo/papelera/${id}/purge`, withTenantConfig({}, empresaId)),
    purgeExpiredRecycleBin: (empresaId = null) => api.post('/bases-trabajo/papelera/purge-expired', {}, withTenantConfig({}, empresaId)),
    getNextCode: (empresaId = null) => api.get('/bases-trabajo/generate-base-code', withTenantConfig({}, empresaId)),
    getActive: (params) => api.get('/bases-trabajo/active', { params: withTenantParams(params) }),
    // empresa_id opcional: permite al Superadministrador activar bases de otras empresas
    activate: (id, empresaId = null) => api.post(
        `/bases-trabajo/${id}/activate`,
        {},
        withTenantConfig({}, empresaId)
    ),
    // empresa_id opcional: permite al Superadministrador desactivar bases de otras empresas
    deactivateAll: (empresaId = null) => api.post(
        '/bases-trabajo/deactivate-all',
        {},
        withTenantConfig({}, empresaId)
    ),
    syncMissing: (id, empresaId = null) => api.post(
        `/bases-trabajo/${id}/sync-missing`,
        {},
        withTenantConfig({}, empresaId)
    ),
    previewSyncMissing: (id, empresaId = null) => api.get(
        `/bases-trabajo/${id}/sync-missing/preview`,
        withTenantConfig({}, empresaId)
    ),
    repairInherited: (id, empresaId = null) => api.post(
        `/bases-trabajo/${id}/repair-inherited`,
        {},
        withTenantConfig({}, empresaId)
    ),
    previewSyncOperation: async (id, mode, empresaId = null) => {
        try {
            return await api.post(
                `/bases-trabajo/${id}/sync/preview`,
                { mode },
                withTenantConfig({}, empresaId)
            );
        } catch (error) {
            if (error?.response?.status !== 404) {
                throw error;
            }
            throw new Error('El backend activo no soporta todavía la previsualización operativa de sincronización con reversión. Reinicie o actualice el backend antes de sincronizar.');
        }
    },
    executeSyncOperation: async (id, mode, empresaId = null) => {
        try {
            return await api.post(
                `/bases-trabajo/${id}/sync/execute`,
                { mode },
                withTenantConfig({}, empresaId)
            );
        } catch (error) {
            if (error?.response?.status !== 404) {
                throw error;
            }
            throw new Error('El backend activo no soporta todavía la ejecución de sincronización con reversión. No se ejecutó ningún sincronismo. Reinicie o actualice el backend.');
        }
    },
    revertSyncOperation: (id, syncEventId, empresaId = null) => api.post(
        `/bases-trabajo/${id}/sync/revert`,
        { sync_event_id: syncEventId },
        withTenantConfig({}, empresaId)
    ),
    getSyncHistory: (id, empresaId = null, limit = 8) => api.get(
        `/bases-trabajo/${id}/sync-history`,
        withTenantConfig({ params: { limit } }, empresaId)
    ),
    getAssignedUsers: async (id, params = {}) => {
        const response = await api.get(`/bases-trabajo/${id}/assigned-users`, { params: withTenantParams(params) });
        return response.data;
    },
    assignUser: async (id, params = {}) => {
        const response = await api.post(`/bases-trabajo/${id}/assign`, null, { params: withTenantParams(params) });
        return response.data;
    },
    unassignUser: async (id, usuarioId, params = {}) => {
        const response = await api.delete(`/bases-trabajo/${id}/assign/${usuarioId}`, { params: withTenantParams(params) });
        return response.data;
    }
};

export default basesTrabajoApi;
