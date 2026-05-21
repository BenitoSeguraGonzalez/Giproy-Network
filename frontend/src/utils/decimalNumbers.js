import Decimal from 'decimal.js';

Decimal.set({
    precision: 40,
    rounding: Decimal.ROUND_HALF_UP,
    toExpNeg: -30,
    toExpPos: 30,
});

export const normalizeDecimalInput = (value, defaultValue = '0') => {
    if (value === null || value === undefined || value === '') return defaultValue;
    if (typeof value === 'string') {
        const normalized = value.trim().replace(',', '.');
        return normalized || defaultValue;
    }
    return String(value);
};

export const toDecimal = (value, defaultValue = '0') => {
    try {
        return new Decimal(normalizeDecimalInput(value, defaultValue));
    } catch {
        return new Decimal(defaultValue);
    }
};

export const toDecimalNumber = (value, defaultValue = '0') => {
    return Number(toDecimal(value, defaultValue).toString());
};

export const roundDecimalValue = (value, decimals = 2) => {
    return toDecimal(value).toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
};

export const roundDecimalNumber = (value, decimals = 2) => {
    return Number(roundDecimalValue(value, decimals).toString());
};

export const sumDecimalValue = (values = [], { decimals = null } = {}) => {
    let total = new Decimal(0);
    for (const value of values || []) {
        total = total.plus(toDecimal(value));
    }
    return decimals === null ? total : total.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
};

export const sumDecimalNumber = (values = [], options = {}) => {
    return Number(sumDecimalValue(values, options).toString());
};

export const multiplyDecimalValue = (values = [], { decimals = null } = {}) => {
    let total = new Decimal(1);
    for (const value of values || []) {
        total = total.times(toDecimal(value));
    }
    return decimals === null ? total : total.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP);
};

export const multiplyDecimalNumber = (values = [], options = {}) => {
    return Number(multiplyDecimalValue(values, options).toString());
};

export const divideDecimalNumber = (
    numerator,
    denominator,
    { decimals = null, defaultValue = 0 } = {}
) => {
    const den = toDecimal(denominator);
    if (den.isZero()) return defaultValue;
    const result = toDecimal(numerator).dividedBy(den);
    return Number((decimals === null ? result : result.toDecimalPlaces(decimals, Decimal.ROUND_HALF_UP)).toString());
};
