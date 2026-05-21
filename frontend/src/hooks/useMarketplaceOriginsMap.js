import { useEffect, useMemo, useState } from 'react';

import marketplaceApi from '../api/marketplace';

export const useMarketplaceOriginsMap = () => {
    const [origins, setOrigins] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        marketplaceApi
            .getOrigins()
            .then((response) => {
                if (!cancelled) {
                    setOrigins(response.data || []);
                }
            })
            .catch((error) => {
                if (!cancelled) {
                    console.error('Error cargando mapa de origenes marketplace:', error);
                    setOrigins([]);
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
    }, []);

    const originsMap = useMemo(() => {
        const map = new Map();
        (origins || []).forEach((origin) => {
            map.set(`${origin.entity_type}:${origin.entity_id}`, origin);
        });
        return map;
    }, [origins]);

    return {
        origins,
        originsMap,
        loading,
    };
};

export default useMarketplaceOriginsMap;
