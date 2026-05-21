const buildPathWithParams = (pathname, params) => {
    const searchParams = new URLSearchParams();

    Object.entries(params || {}).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
            searchParams.set(key, String(value));
        }
    });

    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
};

export const buildMarketplaceEntityLink = (entityType, entityId) => {
    if (!entityType || !entityId) {
        return null;
    }

    switch (entityType) {
        case 'base_trabajo':
            return buildPathWithParams('/precios-unitarios/bases', { base_id: entityId });
        case 'apu':
            return buildPathWithParams('/apus', { apu_id: entityId });
        case 'proyecto':
            return buildPathWithParams('/proyectos', { project_id: entityId });
        default:
            return null;
    }
};

export const getMarketplaceEntityActionLabel = (entityType) => {
    switch (entityType) {
        case 'base_trabajo':
            return 'Abrir base';
        case 'apu':
            return 'Abrir APU';
        case 'proyecto':
            return 'Abrir proyecto';
        default:
            return 'Abrir activo';
    }
};
