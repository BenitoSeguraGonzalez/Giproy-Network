import api from './axiosConfig';
import { withTenantConfig, withTenantParams } from './tenant';

/**
 * @typedef {import('./api-client').Schemas} Schemas
 */

export const apusApi = {
    /** @returns {Promise<{data: Schemas['APUResponse'][]}>} */
    getAll: (params) => api.get('/apus/', { params: withTenantParams(params) }),
    
    /** @returns {Promise<{data: Schemas['APUResponse']}>} */
    getById: (id, empresaId = null) => api.get(`/apus/${id}`, withTenantConfig({}, empresaId)),
    /** @returns {Promise<{data: Schemas['APUResponse'][]}>} */
    getBatchDetails: (apuIds, empresaId = null) => api.post('/apus/batch/details', {
        apu_ids: apuIds
    }, withTenantConfig({}, empresaId)),
    getProjectCpc: (proyectoId, empresaId = null) => api.get('/apus/project-cpc', {
        params: withTenantParams({ proyecto_id: proyectoId }, empresaId)
    }),
    assignProjectCpc: (apuId, proyectoId, codCpcId, empresaId = null) => api.put(`/apus/${apuId}/project-cpc`, {
        proyecto_id: proyectoId,
        cod_cpc_id: codCpcId
    }, withTenantConfig({}, empresaId)),
    getImpactSummary: (id, empresaId = null) => api.get(`/apus/${id}/impact-summary`, withTenantConfig({}, empresaId)),
    
    /** 
     * @param {Schemas['APUCreate']} data 
     * @returns {Promise<{data: Schemas['APUResponse']}>} 
     */
    create: (data, empresaId = null, revision = null) => {
        const params = {};
        if (revision !== null) params.revision = revision;
        return api.post('/apus/', data, {
            params: withTenantParams(params, empresaId)
        });
    },
    
    /** 
     * @param {Schemas['APUUpdate']} data 
     * @returns {Promise<{data: Schemas['APUResponse']}>} 
     */
    update: (id, data, empresaId = null) => api.put(`/apus/${id}`, data, withTenantConfig({}, empresaId)),
    moveLinea: (apuId, lineaId, targetIndex, empresaId = null) => api.put(`/apus/${apuId}/lineas/move`, {
        linea_id: lineaId,
        target_index: targetIndex
    }, withTenantConfig({}, empresaId)),
    delete: (id, empresaId = null) => api.delete(`/apus/${id}`, withTenantConfig({}, empresaId)),
    bulkDelete: (apuIds, empresaId = null) => api.post('/apus/bulk-delete', {
        apu_ids: apuIds
    }, withTenantConfig({}, empresaId)),
    duplicate: (id, empresaId = null, revision = null) => {
        const params = {};
        if (revision !== null) params.revision = revision;
        return api.post(`/apus/${id}/duplicate`, {}, {
            params: withTenantParams(params, empresaId)
        });
    },
    importFromBase: (data, empresaId = null) => api.post('/apus/import-from-base', data, withTenantConfig({}, empresaId)),
    importClipboard: (lines, baseId, subcatId, empresaId = null, revision = null) => {
        const params = { base_id: baseId, subcat_id: subcatId };
        if (revision !== null && revision !== undefined) params.revision = revision;
        return api.post('/apus/import-clipboard', lines, {
            params: withTenantParams(params, empresaId)
        });
    }
};

export default apusApi;
