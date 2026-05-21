const FAVORITES_KEY_PREFIX = 'giproy_marketplace_favorites';

const resolveFavoritesKey = (userId) => `${FAVORITES_KEY_PREFIX}:${userId || 'anonymous'}`;

const parseFavorites = (rawValue) => {
    if (!rawValue) return [];
    try {
        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
        return [];
    }
};

export const getMarketplaceFavorites = (userId) => {
    if (typeof window === 'undefined') return [];
    return parseFavorites(window.localStorage.getItem(resolveFavoritesKey(userId)));
};

export const setMarketplaceFavorites = (userId, productIds) => {
    if (typeof window === 'undefined') return [];
    const normalizedIds = [...new Set((productIds || []).map((item) => String(item)))];
    window.localStorage.setItem(resolveFavoritesKey(userId), JSON.stringify(normalizedIds));
    return normalizedIds;
};

export const toggleMarketplaceFavorite = (userId, productId) => {
    const normalizedId = String(productId);
    const current = getMarketplaceFavorites(userId);
    const next = current.includes(normalizedId)
        ? current.filter((item) => item !== normalizedId)
        : [normalizedId, ...current];
    return setMarketplaceFavorites(userId, next);
};

export const isMarketplaceFavorite = (favorites, productId) =>
    (favorites || []).includes(String(productId));
