const TRACE_ENDPOINT = '/api/v1/login/session-trace';

export const sendSessionTrace = ({ token = null, body }) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return fetch(TRACE_ENDPOINT, {
        method: 'POST',
        headers,
        body,
        keepalive: true,
    });
};

export default sendSessionTrace;
