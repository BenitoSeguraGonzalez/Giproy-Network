import { normalizeTextInputValue } from './normalizeInputValue.js';
import { normalizePersonName } from './descriptionCapitalization.js';

const INITIAL_CAPITALIZATION_PATTERN = /[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/u;

export function normalizeReportDescription(value, isStructural = false) {
    const normalized = normalizeTextInputValue(value).replace(/\s+/g, ' ').trim();
    if (!normalized) return '';

    const lowerCased = normalized.toLocaleLowerCase('es');
    const firstLetterIndex = lowerCased.search(INITIAL_CAPITALIZATION_PATTERN);
    const capitalized =
        firstLetterIndex < 0
            ? lowerCased
            : (
                lowerCased.slice(0, firstLetterIndex) +
                lowerCased.charAt(firstLetterIndex).toLocaleUpperCase('es') +
                lowerCased.slice(firstLetterIndex + 1)
            );

    return isStructural ? capitalized.toLocaleUpperCase('es') : capitalized;
}

export function normalizeReportUnit(value) {
    const normalized = normalizeTextInputValue(value).replace(/\s+/g, ' ').trim();
    if (!normalized || normalized === '-') return normalized || '-';
    return normalized.toLocaleLowerCase('es');
}

export function normalizeReportPersonName(value) {
    return normalizePersonName(value);
}
