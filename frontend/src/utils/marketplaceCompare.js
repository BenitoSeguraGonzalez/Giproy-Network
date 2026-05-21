const COMPARE_KEY_PREFIX = 'giproy_marketplace_compare';
const MAX_COMPARE_ITEMS = 3;

const resolveCompareKey = (userId) => `${COMPARE_KEY_PREFIX}:${userId || 'anonymous'}`;

const parseCompare = (rawValue) => {
    if (!rawValue) return [];
    try {
        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
        return [];
    }
};

export const getMarketplaceCompare = (userId) => {
    if (typeof window === 'undefined') return [];
    return parseCompare(window.localStorage.getItem(resolveCompareKey(userId)));
};

export const setMarketplaceCompare = (userId, productIds) => {
    if (typeof window === 'undefined') return [];
    const normalizedIds = [...new Set((productIds || []).map((item) => String(item)))].slice(0, MAX_COMPARE_ITEMS);
    window.localStorage.setItem(resolveCompareKey(userId), JSON.stringify(normalizedIds));
    return normalizedIds;
};

export const toggleMarketplaceCompare = (userId, productId) => {
    const normalizedId = String(productId);
    const current = getMarketplaceCompare(userId);
    const next = current.includes(normalizedId)
        ? current.filter((item) => item !== normalizedId)
        : [normalizedId, ...current].slice(0, MAX_COMPARE_ITEMS);
    return setMarketplaceCompare(userId, next);
};

export const isMarketplaceCompared = (compareIds, productId) =>
    (compareIds || []).includes(String(productId));

export const MARKETPLACE_COMPARE_MAX_ITEMS = MAX_COMPARE_ITEMS;
