export const extractBlobErrorMessage = async (error, fallbackMessage = 'Se produjo un error inesperado.') => {
    const normalizeMessage = (value) => {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string') return value.trim();
        if (Array.isArray(value)) {
            return value
                .map((item) => normalizeMessage(item))
                .filter(Boolean)
                .join('\n');
        }
        if (typeof value === 'object') {
            const detail = normalizeMessage(value?.detail);
            const message = normalizeMessage(value?.message);
            if (detail || message) return detail || message;
            try {
                return JSON.stringify(value);
            } catch {
                return '';
            }
        }
        return String(value).trim();
    };

    const normalizeHtmlError = (text) => {
        const normalized = normalizeMessage(text);
        if (!normalized) return fallbackMessage;
        const lower = normalized.toLowerCase();
        if (lower.includes('<html') || lower.includes('<!doctype html')) {
            if (normalized.includes('Error code 524') || normalized.includes('A timeout occurred')) {
                return 'El servidor tardó demasiado en responder y la operación expiró antes de completarse.';
            }
            return fallbackMessage;
        }
        return normalized;
    };

    const response = error?.response;
    const data = response?.data;

    if (!data) {
        return normalizeMessage(error?.message) || fallbackMessage;
    }

    if (typeof data === 'string') {
        return normalizeHtmlError(data);
    }

    if (typeof Blob !== 'undefined' && data instanceof Blob) {
        try {
            const text = await data.text();
            if (!text) return fallbackMessage;
            try {
                const parsed = JSON.parse(text);
                return normalizeMessage(parsed?.detail || parsed?.message || text) || fallbackMessage;
            } catch {
                return normalizeHtmlError(text);
            }
        } catch {
            return fallbackMessage;
        }
    }

    return normalizeMessage(data?.detail || data?.message || error?.message) || fallbackMessage;
};
