/**
 * phoneFormatter.js
 * Utilitario para normalizar y formatear números telefónicos a formato internacional.
 */

const COUNTRY_PREFIX_MAP = {
    ecuador: '593',
    colombia: '57',
    peru: '51',
    perú: '51',
};

export const resolveCountryPhonePrefix = (countryName) => {
    if (!countryName) return '';
    return COUNTRY_PREFIX_MAP[String(countryName).trim().toLowerCase()] || '';
};

const getDigits = (value) => String(value ?? '').replace(/\D/g, '');

const getNationalDigits = (phone, prefix) => {
    let digits = getDigits(phone);
    const cleanPrefix = getDigits(prefix);

    if (cleanPrefix && digits.startsWith(cleanPrefix)) {
        digits = digits.substring(cleanPrefix.length);
    }

    if (cleanPrefix === '593' && digits.startsWith('0')) {
        digits = digits.substring(1);
    }

    return digits;
};

export const getInternationalPhoneValidationMessage = (phone, countryName) => {
    if (!phone) return 'El móvil de contacto es obligatorio.';

    const prefix = resolveCountryPhonePrefix(countryName);
    const digits = getDigits(phone);

    if (digits.length < 7) {
        return 'El móvil debe tener al menos 7 dígitos.';
    }

    if (prefix === '593') {
        const nationalDigits = getNationalDigits(phone, prefix);
        if (nationalDigits.length !== 9 || !nationalDigits.startsWith('9')) {
            return 'Para Ecuador usa 09XXXXXXXX o +593 9XXXXXXXX.';
        }
    }

    return '';
};

/**
 * Formatea un número de teléfono basándose en el prefijo del país.
 * @param {string} phone - El número de teléfono a formatear.
 * @param {string} prefix - El prefijo del país (ej: "593").
 * @returns {string} - El teléfono formateado (+593 XXXXXXXXX).
 */
export const formatInternationalPhone = (phone, prefix) => {
    if (!phone) return '';
    
    // Eliminar caracteres no numéricos
    let cleaned = getDigits(phone);
    
    // Si no hay prefijo, devolvemos el número limpio
    if (!prefix) return cleaned;

    // Limpiar el prefijo de cualquier '+'
    const cleanPrefix = getDigits(prefix);

    // Caso especial: si el número ya empieza con el prefijo, no lo duplicamos
    if (cleaned.startsWith(cleanPrefix)) {
        cleaned = cleaned.substring(cleanPrefix.length);
    }

    // Caso especial Ecuador: si empieza con 0, quitarlo (ej: 099 -> 99)
    if (cleanPrefix === '593' && cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
    }

    // Agrupación de dígitos para legibilidad (TASK-0149)
    // Para 9 dígitos (común en Ecuador): XX XXX XX XX
    let formatted = cleaned;
    if (cleaned.length === 9) {
        formatted = `${cleaned.substring(0, 2)} ${cleaned.substring(2, 5)} ${cleaned.substring(5, 7)} ${cleaned.substring(7, 9)}`;
    } else if (cleaned.length === 10) {
        // Para 10 dígitos: XXX XXX XX XX
        formatted = `${cleaned.substring(0, 3)} ${cleaned.substring(3, 6)} ${cleaned.substring(6, 8)} ${cleaned.substring(8, 10)}`;
    }

    return `+${cleanPrefix} ${formatted}`;
};

/**
 * Valida si un string parece un teléfono válido (mínimo 7 dígitos numéricos).
 */
export const isValidPhone = (phone) => {
    if (!phone) return false;
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length >= 7;
};
