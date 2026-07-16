import { decodeJWT } from './jwt';
import { sendSessionTrace } from '../api/sessionTrace';

const buildTracePayload = (eventType, payload = {}) => {
    const token = localStorage.getItem('giproy_token');
    const decoded = token ? decodeJWT(token) : null;

    return {
        event_type: eventType,
        reason: payload.reason || null,
        request_path: payload.requestPath || null,
        request_method: payload.requestMethod || null,
        request_id: payload.requestId || null,
        token_session_id: payload.tokenSessionId || decoded?.sid || null,
        token_exp: payload.tokenExp || decoded?.exp || null,
        response_status: payload.responseStatus || null,
        payload: payload.payload || {},
    };
};

export const traceSessionEvent = (eventType, payload = {}) => {
    if (typeof window === 'undefined') return;

    const body = JSON.stringify(buildTracePayload(eventType, payload));
    const token = localStorage.getItem('giproy_token');

    sendSessionTrace({ token, body }).catch(() => {
        // El trazado no debe interferir con el flujo principal.
    });
};
