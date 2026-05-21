import axios from 'axios';
import { getStoredWorkingCompanyId, shouldSkipTenantInjection, withTenantParams } from './tenant';
import { expireAuthSession } from '../utils/authSession';
import { traceSessionEvent } from '../utils/sessionTrace';

const REFRESH_URL = '/login/refresh';
const LOGIN_URL = '/login/access-token';
const LOGOUT_URL = '/login/logout';

const api = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    }
});

const authApi = axios.create({
    baseURL: '/api/v1',
    headers: {
        'Content-Type': 'application/json',
    }
});

let refreshPromise = null;

const getRequestPath = (config = {}) => {
    const url = config?.url || '';
    if (!url) return '';
    if (url.startsWith('http')) {
        try {
            return new URL(url).pathname.replace('/api/v1', '');
        } catch {
            return url;
        }
    }
    return url;
};

const AUTH_EXPIRATION_DETAILS = [
    'su sesión ha expirado. vuelva a iniciarla.',
    'su sesión ha expirado por inactividad. vuelva a iniciarla.',
    'su sesión ha expirado porque se inició sesión en otro dispositivo.',
    'un administrador le ha cerrado la sesión. vuelva a iniciarla.',
    'no se pudo validar las credenciales',
];

const shouldExpireSessionFor401 = (config = {}, detail = null) => {
    const path = getRequestPath(config);
    if (shouldBypass401Recovery(config)) {
        return true;
    }

    const normalizedDetail = typeof detail === 'string' ? detail.trim().toLowerCase() : '';
    if (normalizedDetail && AUTH_EXPIRATION_DETAILS.includes(normalizedDetail)) {
        return true;
    }

    return false;
};

const shouldBypass401Recovery = (config = {}) => {
    const path = getRequestPath(config);
    return path === REFRESH_URL || path === LOGIN_URL || path === LOGOUT_URL;
};

const requestTokenRefresh = async (token) => {
    const { data } = await authApi.post(
        REFRESH_URL,
        {},
        {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
    );

    if (data?.access_token) {
        localStorage.setItem('giproy_token', data.access_token);
        return data.access_token;
    }

    return null;
};

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('giproy_token');
    config._tokenUsed = token || null;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    if (!shouldSkipTenantInjection(config)) {
        const empresaId = getStoredWorkingCompanyId();
        if (empresaId) {
            config.params = withTenantParams(config.params, empresaId);
        }
    }

    return config;
}, (error) => {
    return Promise.reject(error);
});

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const status = error.response?.status;
        const detail = error.response?.data?.detail;
        const originalRequest = error.config || {};

        if (status !== 401) {
            return Promise.reject(error);
        }

        if (shouldBypass401Recovery(originalRequest)) {
            traceSessionEvent('frontend_401_intercepted', {
                reason: typeof detail === 'string' ? detail : '401_bypass_recovery',
                requestPath: getRequestPath(originalRequest),
                requestMethod: originalRequest.method,
                requestId: error.response?.headers?.['x-request-id'] || null,
                responseStatus: status,
                payload: { phase: 'bypass' },
            });
            expireAuthSession(typeof detail === 'string' ? detail : null);
            return Promise.reject(error);
        }

        if (originalRequest._retry) {
            traceSessionEvent('frontend_401_intercepted', {
                reason: typeof detail === 'string' ? detail : '401_after_retry',
                requestPath: getRequestPath(originalRequest),
                requestMethod: originalRequest.method,
                requestId: error.response?.headers?.['x-request-id'] || null,
                responseStatus: status,
                payload: { phase: 'after_retry' },
            });
            if (shouldExpireSessionFor401(originalRequest, detail)) {
                expireAuthSession(typeof detail === 'string' ? detail : null);
            }
            return Promise.reject(error);
        }

        const currentToken = localStorage.getItem('giproy_token');
        const requestToken = originalRequest._tokenUsed || null;

        if (currentToken && requestToken && currentToken !== requestToken) {
            traceSessionEvent('frontend_retry_with_newer_token', {
                reason: 'stale_request_token',
                requestPath: getRequestPath(originalRequest),
                requestMethod: originalRequest.method,
                requestId: error.response?.headers?.['x-request-id'] || null,
                responseStatus: status,
            });
            originalRequest._retry = true;
            originalRequest.headers = {
                ...(originalRequest.headers || {}),
                Authorization: `Bearer ${currentToken}`,
            };
            return api(originalRequest);
        }

        if (!currentToken) {
            traceSessionEvent('frontend_401_intercepted', {
                reason: typeof detail === 'string' ? detail : 'missing_local_token',
                requestPath: getRequestPath(originalRequest),
                requestMethod: originalRequest.method,
                requestId: error.response?.headers?.['x-request-id'] || null,
                responseStatus: status,
            });
            expireAuthSession(typeof detail === 'string' ? detail : null);
            return Promise.reject(error);
        }

        try {
            if (!refreshPromise) {
                traceSessionEvent('frontend_refresh_started', {
                    reason: '401_recovery',
                    requestPath: getRequestPath(originalRequest),
                    requestMethod: originalRequest.method,
                    requestId: error.response?.headers?.['x-request-id'] || null,
                    responseStatus: status,
                });
                refreshPromise = requestTokenRefresh(currentToken).finally(() => {
                    refreshPromise = null;
                });
            }

            const nextToken = await refreshPromise;
            if (!nextToken) {
                traceSessionEvent('frontend_refresh_failed', {
                    reason: typeof detail === 'string' ? detail : 'refresh_without_token',
                    requestPath: getRequestPath(originalRequest),
                    requestMethod: originalRequest.method,
                    requestId: error.response?.headers?.['x-request-id'] || null,
                    responseStatus: status,
                });
                if (shouldExpireSessionFor401(originalRequest, detail)) {
                    expireAuthSession(typeof detail === 'string' ? detail : null);
                }
                return Promise.reject(error);
            }

            traceSessionEvent('frontend_retry_after_refresh', {
                reason: 'refresh_success',
                requestPath: getRequestPath(originalRequest),
                requestMethod: originalRequest.method,
                requestId: error.response?.headers?.['x-request-id'] || null,
                responseStatus: status,
            });
            originalRequest._retry = true;
            originalRequest.headers = {
                ...(originalRequest.headers || {}),
                Authorization: `Bearer ${nextToken}`,
            };
            return api(originalRequest);
        } catch (refreshError) {
            const refreshDetail = refreshError?.response?.data?.detail;
            traceSessionEvent('frontend_refresh_failed', {
                reason: typeof refreshDetail === 'string' ? refreshDetail : (typeof detail === 'string' ? detail : 'refresh_failed'),
                requestPath: getRequestPath(originalRequest),
                requestMethod: originalRequest.method,
                requestId: refreshError?.response?.headers?.['x-request-id'] || error.response?.headers?.['x-request-id'] || null,
                responseStatus: refreshError?.response?.status || status,
            });
            if (
                shouldExpireSessionFor401(originalRequest, detail) ||
                shouldExpireSessionFor401({ url: REFRESH_URL }, refreshDetail)
            ) {
                expireAuthSession(typeof refreshDetail === 'string' ? refreshDetail : (typeof detail === 'string' ? detail : null));
            }
        }
        return Promise.reject(error);
    }
);

export default api;
