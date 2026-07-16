import { useContext, useEffect, useState } from 'react';

import { bimApi } from '../../api/bim';
import { AuthContext } from '../../context/AuthContext';

const DEFAULT_ACCESS = {
    feature: 'bim',
    enabled: false,
    environment_enabled: false,
    scoped: false,
    company_match: false,
    user_match: false,
    allowed_company_ids: [],
    allowed_user_ids: [],
    resolved_company_id: null,
    resolved_user_id: null,
    resolved_role: null,
    commercial_entitlement_required: false,
    commercial_entitled: true,
    commercial_entitlement_source: null,
};

export function useBimFeatureAccess() {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const [access, setAccess] = useState(DEFAULT_ACCESS);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let cancelled = false;

        const loadAccess = async () => {
            if (!user) {
                setAccess(DEFAULT_ACCESS);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const empresaId = selectedEmpresa?.id || user?.empresa_id || null;
                const data = await bimApi.getFeatureFlags(empresaId);
                if (!cancelled) {
                    setAccess({ ...DEFAULT_ACCESS, ...data });
                }
            } catch (error) {
                console.warn('No se pudo resolver la activacion BIM:', error);
                if (!cancelled) {
                    setAccess(DEFAULT_ACCESS);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadAccess();
        return () => {
            cancelled = true;
        };
    }, [selectedEmpresa?.id, user?.empresa_id, user?.id]);

    return { access, loading };
}
