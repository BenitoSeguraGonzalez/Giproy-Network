const COUNTRY_DETECTION_URL = 'https://ipapi.co/json/';
const DEFAULT_TIMEOUT_MS = 1800;

const normalize = (value) => String(value ?? '').trim().toLowerCase();

export const getRegistrationCountryPolicy = (country) => {
    const normalized = normalize(country);
    if (normalized === 'ecuador') {
        return {
            mode: 'ecuador',
            requiresCanton: true,
            provinceLabel: 'Provincia',
            cityLabel: 'Ciudad',
        };
    }
    if (normalized === 'españa' || normalized === 'espana' || normalized === 'spain') {
        return {
            mode: 'spain',
            requiresCanton: false,
            provinceLabel: 'Provincia',
            cityLabel: 'Municipio / ciudad',
        };
    }
    return {
        mode: 'generic',
        requiresCanton: false,
        provinceLabel: 'Provincia / región',
        cityLabel: 'Ciudad / municipio',
    };
};

export const resolveDetectedCountry = (detected, countries = []) => {
    if (!detected || !Array.isArray(countries)) return null;
    const code = normalize(detected.country_code || detected.countryCode);
    const name = normalize(detected.country || detected.country_name);
    return countries.find((country) => (
        (code && normalize(country.codigo) === code)
        || (name && normalize(country.nombre) === name)
    )) || null;
};

export const detectConnectionCountry = async ({
    fetchImpl = globalThis.fetch,
    timeoutMs = DEFAULT_TIMEOUT_MS,
} = {}) => {
    if (typeof fetchImpl !== 'function') return null;
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    const timeout = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;
    try {
        const response = await fetchImpl(COUNTRY_DETECTION_URL, {
            signal: controller?.signal,
            headers: { Accept: 'application/json' },
        });
        if (!response?.ok) return null;
        return await response.json();
    } catch {
        return null;
    } finally {
        if (timeout) clearTimeout(timeout);
    }
};

export { COUNTRY_DETECTION_URL };
