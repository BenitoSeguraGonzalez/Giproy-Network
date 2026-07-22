const firstText = (...values) => values.find((value) => typeof value === 'string' && value.trim())?.trim();

export const getErrorMessage = (error, fallback = 'Se produjo un error inesperado.') => {
    if (typeof error === 'string') return error.trim() || fallback;

    const detail = error?.response?.data?.detail;
    if (Array.isArray(detail)) {
        const messages = detail
            .map((item) => firstText(item?.msg, item?.message, typeof item === 'string' ? item : null))
            .filter(Boolean);
        if (messages.length) return messages.join(' ');
    }

    return firstText(detail, error?.message, error?.response?.data?.message) || fallback;
};
