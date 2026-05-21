import { normalizeTextInputValue } from './normalizeInputValue.js';

const INITIAL_CAPITALIZATION_PATTERN = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/u;

export function normalizeDescriptionCapitalization(value) {
    const normalized = normalizeTextInputValue(value).replace(/\s+/g, ' ').trim();
    if (!normalized) return '';

    const lowerCased = normalized.toLocaleLowerCase('es');
    const firstLetterIndex = lowerCased.search(INITIAL_CAPITALIZATION_PATTERN);
    if (firstLetterIndex < 0) return lowerCased;

    return (
        lowerCased.slice(0, firstLetterIndex) +
        lowerCased.charAt(firstLetterIndex).toLocaleUpperCase('es') +
        lowerCased.slice(firstLetterIndex + 1)
    );
}

export function normalizeSubcategoryDisplay(value) {
    const normalized = normalizeTextInputValue(value).replace(/\s+/g, ' ').trim();
    if (!normalized) return '';
    return normalized.toLocaleUpperCase('es');
}

export function normalizeDisplayUnit(value) {
    const normalized = normalizeTextInputValue(value).replace(/\s+/g, ' ').trim();
    if (!normalized || normalized === '-') return normalized || '-';
    return normalized.toLocaleLowerCase('es');
}

export function normalizePersonName(value) {
    const normalized = normalizeTextInputValue(value).replace(/\s+/g, ' ').trim();
    if (!normalized || normalized === '-') return normalized || '-';

    return normalized
        .toLocaleLowerCase('es')
        .replace(/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+/gu, (word) => (
            word.charAt(0).toLocaleUpperCase('es') + word.slice(1)
        ));
}

export default {
    normalizeDescriptionCapitalization,
    normalizeSubcategoryDisplay,
    normalizeDisplayUnit,
    normalizePersonName,
};
