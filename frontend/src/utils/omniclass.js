export const buildOmniClassOptions = (items = []) =>
    (items || []).map((item) => ({
        ...item,
        id: item.codigo,
        codigo: item.codigo,
        titulo_original: item.titulo,
        titulo_es: item.titulo_es || '',
        titulo_resuelto: item.titulo_es || item.titulo,
        titulo: item.titulo_es || item.titulo,
        label: `[${item.codigo}] ${item.titulo_es || item.titulo}`
    }));

export const getOmniClassTableForApu = () => '21';

export const getOmniClassTableForResourceCategory = (categoryId) => {
    if (Number(categoryId) === 4) return '34';
    return '23';
};

export const getOmniClassTableForSubcategoria = (subcategoriaCodigo) => {
    if (Number(subcategoriaCodigo) === 4) return '34';
    if (Number(subcategoriaCodigo) === 5) return '22';
    return '23';
};
