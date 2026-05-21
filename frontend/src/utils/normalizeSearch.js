import { normalizeTextInputValue } from './normalizeInputValue';

export const normalizeSearchToken = (value) =>
    normalizeTextInputValue(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

export const includesNormalized = (value, term) => {
    const normalizedTerm = normalizeSearchToken(term);
    if (!normalizedTerm) return true;
    return normalizeSearchToken(value).includes(normalizedTerm);
};
