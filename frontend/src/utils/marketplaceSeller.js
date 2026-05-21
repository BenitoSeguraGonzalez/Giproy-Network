export const getMarketplaceSellerDisplayName = (seller) => {
    if (!seller) return 'Sin definir';
    const role = (seller.rol || '').toLowerCase();
    if (role === 'superadministrador') {
        return 'Sistema';
    }
    return seller.nombre_completo || 'Sin definir';
};
