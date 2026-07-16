import { useEffect, useMemo, useState } from 'react';

import marketplaceApi from '../api/marketplace';

const defaultPolicy = {
    editable_internal: true,
    duplicable_internal: true,
    publishable_marketplace: true,
    requires_origin_traceability: false,
};

export const useMarketplaceOrigin = (entityType, entityId) => {
    const [origin, setOrigin] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!entityType || !entityId) {
            setOrigin(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        marketplaceApi
            .getOrigins({ entity_type: entityType, entity_id: entityId })
            .then((response) => {
                if (!cancelled) {
                    const items = response.data || [];
                    setOrigin(items[0] || null);
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    globalThis.reportClientError?.('Error cargando origen marketplace:', error);
                    setOrigin(null);
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [entityType, entityId]);

    const resolved = useMemo(() => {
        if (!origin) {
            return {
                origin: null,
                ownershipKind: 'owned',
                originKind: 'native',
                usagePolicy: defaultPolicy,
            };
        }

        return {
            origin,
            ownershipKind: origin.ownership_kind || 'owned',
            originKind: origin.origin_kind || 'native',
            usagePolicy: origin.metadata_json?.usage_policy || defaultPolicy,
        };
    }, [origin]);

    return {
        ...resolved,
        loading,
    };
};

export default useMarketplaceOrigin;
