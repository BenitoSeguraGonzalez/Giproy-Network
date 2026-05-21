const WORKING_COMPANY_STORAGE_KEY = 'giproy_working_company';

const TENANTLESS_EXACT_PATHS = new Set([
    '/',
    '/login/access-token',
    '/register',
    '/usuarios/me',
]);

const TENANTLESS_PREFIXES = [
    '/empresas',
    '/paises',
    '/maestros',
    '/utils/spellcheck',
    '/usuarios/validar-ruc',
];

const parseStoredJson = (rawValue) => {
    if (!rawValue) return null;
    try {
        return JSON.parse(rawValue);
    } catch {
        return null;
    }
};

const normalizeUrl = (url = '') => {
    if (!url) return '';
    if (url.startsWith('http')) {
        try {
            return new URL(url).pathname.replace('/api/v1', '') || '';
        } catch {
            return url;
        }
    }

    const [path] = url.split('?');
    return path;
};

export const getStoredWorkingCompany = () => {
    if (typeof window === 'undefined') return null;
    return parseStoredJson(window.localStorage.getItem(WORKING_COMPANY_STORAGE_KEY));
};

export const getStoredWorkingCompanyId = () => getStoredWorkingCompany()?.id ?? null;

export const withoutTenant = (config = {}) => ({
    ...config,
    skipTenant: true,
});

export const withTenantParams = (params = {}, empresaId = null) => {
    const nextParams = { ...(params || {}) };
    const resolvedEmpresaId = empresaId ?? getStoredWorkingCompanyId();

    if (resolvedEmpresaId && nextParams.empresa_id == null) {
        nextParams.empresa_id = resolvedEmpresaId;
    }

    return nextParams;
};

export const withTenantConfig = (config = {}, empresaId = null) => ({
    ...config,
    params: withTenantParams(config.params, empresaId),
});

export const shouldSkipTenantInjection = (config = {}) => {
    if (config.skipTenant) return true;
    if (config.params?.empresa_id != null) return true;
    if (typeof config.url === 'string' && config.url.includes('empresa_id=')) return true;

    const normalizedUrl = normalizeUrl(config.url);
    if (!normalizedUrl) return false;

    if (TENANTLESS_EXACT_PATHS.has(normalizedUrl)) return true;
    return TENANTLESS_PREFIXES.some((prefix) => normalizedUrl.startsWith(prefix));
};

export const routeRequiresCompanyContext = (pathname = '') => {
    if (!pathname) return false;

    const safePaths = new Set([
        '/',
        '/dashboard',
        '/settings',
        '/admin-global',
    ]);

    if (safePaths.has(pathname)) return false;
    return !pathname.startsWith('/admin-global/');
};
