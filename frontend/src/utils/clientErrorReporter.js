const MAX_CLIENT_ERROR_EVENTS = 50;

const normalizeClientErrorValue = (value) => {
    if (value instanceof Error) {
        return {
            name: value.name,
            message: value.message,
            stack: value.stack,
        };
    }
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object') {
        try {
            return JSON.parse(JSON.stringify(value));
        } catch {
            return String(value);
        }
    }
    return value ?? null;
};

export const reportClientError = (...args) => {
    const event = {
        timestamp: new Date().toISOString(),
        args: args.map(normalizeClientErrorValue),
    };
    const target = globalThis;
    const current = Array.isArray(target.__giproyClientErrors)
        ? target.__giproyClientErrors
        : [];
    target.__giproyClientErrors = [...current, event].slice(-MAX_CLIENT_ERROR_EVENTS);
    target.dispatchEvent?.(
        new CustomEvent('giproy:client-error', {
            detail: event,
        }),
    );
};

globalThis.reportClientError = reportClientError;
