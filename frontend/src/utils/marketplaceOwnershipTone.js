const resolveOriginPayload = (origin) => {
    if (!origin) return null;
    if (origin.origin || origin.ownershipKind || origin.originKind || origin.usagePolicy) {
        return {
            ownershipKind: origin.ownershipKind || origin.origin?.ownership_kind || 'owned',
            originKind: origin.originKind || origin.origin?.origin_kind || 'native',
            usagePolicy: origin.usagePolicy || origin.origin?.metadata_json?.usage_policy || null,
        };
    }
    return {
        ownershipKind: origin.ownership_kind || 'owned',
        originKind: origin.origin_kind || 'native',
        usagePolicy: origin.metadata_json?.usage_policy || null,
    };
};

export const getMarketplaceOwnershipTone = (origin) => {
    const resolved = resolveOriginPayload(origin);
    const ownershipKind = resolved?.ownershipKind || 'owned';
    if (ownershipKind === 'acquired') return { dot: 'bg-amber-500', text: 'text-amber-700', textStrong: 'text-amber-800' };
    return { dot: 'bg-emerald-500', text: 'text-emerald-700', textStrong: 'text-emerald-800' };
};
