export const getCompanyDisplayName = (empresa, fallback = 'Sin empresa') => {
    if (!empresa) return fallback;
    const alias = String(empresa.alias || empresa.empresa_alias || '').trim();
    const name = String(empresa.nombre || empresa.empresa_nombre || '').trim();
    return alias || name || fallback;
};

export default getCompanyDisplayName;
