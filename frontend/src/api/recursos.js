import api from './axiosConfig';
import { withTenantConfig, withTenantParams, withoutTenant } from './tenant';

/**
 * @typedef {import('./api-client').Schemas} Schemas
 */


export const recursosApi = {
    // Obtener recursos filtrados por base y opcionalmente por subcategoría
    getAll: (baseId, subcategoriaItemId = null, empresaId = null, revision = null) => {
        const params = { base_id: baseId };
        if (subcategoriaItemId) params.subcategoria_item_id = subcategoriaItemId;
        if (revision !== null) params.revision = revision;
        return api.get('/recursos/', { params: withTenantParams(params, empresaId) });
    },

    // Crear un recurso
    create: (baseId, data, empresaId = null, revision = null) => {
        const params = { base_id: baseId };
        if (revision !== null) params.revision = revision;
        return api.post('/recursos/', data, {
            params: withTenantParams(params, empresaId)
        });
    },

    // Actualizar un recurso
    update: (id, data, empresaId = null) => api.put(`/recursos/${id}`, data, withTenantConfig({}, empresaId)),

    // Eliminar un recurso
    delete: (id, empresaId = null) => api.delete(`/recursos/${id}`, withTenantConfig({}, empresaId)),

    // Eliminar varios recursos de forma atómica
    bulkDelete: (recursoIds, empresaId = null) => api.post('/recursos/bulk-delete', {
        recurso_ids: recursoIds
    }, withTenantConfig({}, empresaId)),

    // Asignar un CPC a varios recursos
    bulkAssignCpc: (recursoIds, codCpcId, empresaId = null) => api.put('/recursos/bulk-cpc', {
        recurso_ids: recursoIds,
        cod_cpc_id: codCpcId
    }, withTenantConfig({}, empresaId)),

    // Duplicar un recurso
    duplicate: (id, empresaId = null, revision = null) => {
        const params = {};
        if (revision !== null) params.revision = revision;
        return api.post(`/recursos/${id}/duplicate`, {}, {
            params: withTenantParams(params, empresaId)
        });
    },

    // Mover un recurso a otra subcategoría
    move: (id, targetSubcategoriaItemId, empresaId = null) => api.post(`/recursos/${id}/move`, {
        target_subcategoria_item_id: targetSubcategoriaItemId
    }, withTenantConfig({}, empresaId)),

    // Importar recursos masivamente
    import: (baseId, data, empresaId = null, revision = null) => {
        const params = { base_id: baseId };
        if (revision !== null) params.revision = revision;
        return api.post('/recursos/import', data, {
            params: withTenantParams(params, empresaId)
        });
    },

    // Exportar recursos seleccionados
    export: (recursoIds, empresaId = null) => api.post('/recursos/export', {
        recurso_ids: recursoIds
    }, withTenantConfig({}, empresaId)),

    // Obtener unidades disponibles por categoría
    getUnidades: (subcategoriaCodigo, baseId, empresaId = null) => {
        const params = { subcategoria_codigo: subcategoriaCodigo, base_id: baseId };
        return api.get('/recursos/unidades', { params: withTenantParams(params, empresaId) });
    },

    // Buscar en el catálogo CPC
    searchCPC: (query) => api.get('/recursos/cpc/search', withoutTenant({
        params: { q: query }
    })),

    // Crear una nueva unidad
    createUnidad: (data) => api.post('/recursos/unidades', data, withoutTenant()),

    // Obtener categorías base con conteos opcionales
    getCategorias: (baseId = null, empresaId = null) => {
        const params = {};
        if (baseId) params.base_id = baseId;
        return api.get('/recursos/categorias', { params: withTenantParams(params, empresaId) });
    },
};

export default recursosApi;
