const RECENTLY_VIEWED_KEY_PREFIX = 'giproy_marketplace_recently_viewed';
const MAX_RECENTLY_VIEWED_ITEMS = 8;

const resolveRecentlyViewedKey = (userId) => `${RECENTLY_VIEWED_KEY_PREFIX}:${userId || 'anonymous'}`;

const parseRecentlyViewed = (rawValue) => {
    if (!rawValue) return [];
    try {
        const parsed = JSON.parse(rawValue);
        return Array.isArray(parsed) ? parsed.map((item) => String(item)) : [];
    } catch {
        return [];
    }
};

export const getMarketplaceRecentlyViewed = (userId) => {
    if (typeof window === 'undefined') return [];
    return parseRecentlyViewed(window.localStorage.getItem(resolveRecentlyViewedKey(userId)));
};

export const setMarketplaceRecentlyViewed = (userId, productIds) => {
    if (typeof window === 'undefined') return [];
    const normalizedIds = [...new Set((productIds || []).map((item) => String(item)))].slice(0, MAX_RECENTLY_VIEWED_ITEMS);
    window.localStorage.setItem(resolveRecentlyViewedKey(userId), JSON.stringify(normalizedIds));
    return normalizedIds;
};

export const pushMarketplaceRecentlyViewed = (userId, productId) => {
    const normalizedId = String(productId);
    const current = getMarketplaceRecentlyViewed(userId).filter((item) => item !== normalizedId);
    return setMarketplaceRecentlyViewed(userId, [normalizedId, ...current]);
};

export const isMarketplaceRecentlyViewed = (recentIds, productId) =>
    (recentIds || []).includes(String(productId));

export const MARKETPLACE_RECENTLY_VIEWED_MAX_ITEMS = MAX_RECENTLY_VIEWED_ITEMS;
