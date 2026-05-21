export const resolveMediaUrl = (path) => {
    if (!path || typeof path !== 'string') return null;

    const normalized = path.trim().replace(/\\/g, '/');
    if (!normalized) return null;

    if (
        normalized.startsWith('data:') ||
        normalized.startsWith('blob:') ||
        normalized.startsWith('http://') ||
        normalized.startsWith('https://')
    ) {
        return normalized;
    }

    if (
        normalized.startsWith('/uploads/proyectos/') ||
        normalized.startsWith('uploads/proyectos/')
    ) {
        const proxiedPath = normalized.startsWith('/') ? normalized : `/${normalized}`;
        return `/api/v1/proyecto-detalles/media/image-proxy?path=${encodeURIComponent(proxiedPath)}`;
    }

    return normalized.startsWith('/') ? normalized : `/${normalized}`;
};
