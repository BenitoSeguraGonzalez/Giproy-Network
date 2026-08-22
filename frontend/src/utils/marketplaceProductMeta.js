export const MARKETPLACE_TYPE_LABELS = {
    licencia: 'Licencia', addon: 'Addon', adicional: 'Adicional', portal_compras_publicas: 'Portal compras publicas',
    base_maestra: 'Base Maestra', apu: 'APU', proyecto: 'Proyecto',
};

export const isMarketplaceSystemProduct = (product) =>
    (product?.seller?.rol || '').toLowerCase() === 'superadministrador';
