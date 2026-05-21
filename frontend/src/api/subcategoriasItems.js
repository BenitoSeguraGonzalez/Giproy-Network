import api from './axiosConfig';
import { withTenantConfig, withTenantParams } from './tenant';

export const subcategoriasItemsApi = {
    // Obtener items de una base de trabajo
    getAll: (baseId, subcategoriaCodigo = null, empresaId = null, revision = null) => {
        const params = { base_id: baseId };
        if (subcategoriaCodigo) params.subcategoria_codigo = subcategoriaCodigo;
        if (revision !== null) params.revision = revision;
        return api.get('/subcategorias-items/', { params: withTenantParams(params, empresaId) });
    },

    // Crear un nuevo item
    create: (baseId, data, empresaId = null) => {
        return api.post('/subcategorias-items/', data, {
            params: withTenantParams({ base_id: baseId }, empresaId)
        });
    },

    // Actualizar un item
    update: (id, data, empresaId = null) => api.put(`/subcategorias-items/${id}`, data, withTenantConfig({}, empresaId)),

    // Eliminar un item
    delete: (id, empresaId = null) => api.delete(`/subcategorias-items/${id}`, withTenantConfig({}, empresaId)),

    // Eliminar varios items de forma atómica
    bulkDelete: (itemIds, empresaId = null) => api.post('/subcategorias-items/bulk-delete', {
        item_ids: itemIds
    }, withTenantConfig({}, empresaId)),

    // Duplicar un item
    duplicate: (id, empresaId = null) => api.post(`/subcategorias-items/duplicate/${id}`, {}, withTenantConfig({}, empresaId)),

    // Importar items desde portapapeles
    import: (baseId, subcategoriaCodigo, items, empresaId = null, revision = null) => {
        const params = { base_id: baseId };
        if (revision !== null) params.revision = revision;
        return api.post('/subcategorias-items/import', { subcategoria_codigo: subcategoriaCodigo, items }, {
            params: withTenantParams(params, empresaId)
        });
    },

    // Exportar items al portapapeles
    export: (itemIds, empresaId = null) => api.post('/subcategorias-items/export', { item_ids: itemIds }, withTenantConfig({}, empresaId)),
    // Mover un item a otra categoría
    move: (itemId, targetSubcategoriaCodigo, empresaId = null) => api.post(`/subcategorias-items/${itemId}/move`, {
        target_subcategoria_codigo: targetSubcategoriaCodigo
    }, withTenantConfig({}, empresaId)),

    // Reordenar un item dentro de la misma categoría
    reorder: (itemId, targetItemId, placeAfter = false, empresaId = null) => api.post(`/subcategorias-items/${itemId}/reorder`, {
        target_item_id: targetItemId,
        place_after: placeAfter
    }, withTenantConfig({}, empresaId)),
};

export default subcategoriasItemsApi;
