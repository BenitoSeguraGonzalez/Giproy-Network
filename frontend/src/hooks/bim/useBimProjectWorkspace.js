import { useContext, useEffect, useState } from 'react';

import { bimLinksApi } from '../../api/bimLinks';
import { bimModelsApi } from '../../api/bimModels';
import { bimViewStatesApi } from '../../api/bimViewStates';
import { AuthContext } from '../../context/AuthContext';
import { getErrorMessage } from '../../utils/errorMessage';

const EMPTY_WORKSPACE = {
    ready: false,
    tables_ready: false,
    project_id: null,
    company_id: null,
    models: [],
    active_version_id: null,
    active_version_label: null,
    tree_nodes: [],
    property_groups: [],
    link_summary: [],
    elements: [],
    recent_links: [],
};

export function useBimProjectWorkspace(projectId, enabled) {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const [workspace, setWorkspace] = useState(EMPTY_WORKSPACE);
    const [viewStates, setViewStates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const loadWorkspace = async () => {
            if (!enabled || !projectId || !user) {
                setWorkspace(EMPTY_WORKSPACE);
                setViewStates([]);
                setError(null);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const empresaId = selectedEmpresa?.id || user?.empresa_id || null;
                const [workspaceResponse, statesResponse, elementsResponse, linksResponse] = await Promise.all([
                    bimModelsApi.getWorkspace(projectId, empresaId),
                    bimViewStatesApi.listByProject(projectId, empresaId),
                    bimLinksApi.listElementsByProject(projectId, empresaId),
                    bimLinksApi.listByProject(projectId, empresaId),
                ]);
                if (!cancelled) {
                    setWorkspace({
                        ...EMPTY_WORKSPACE,
                        ...workspaceResponse,
                        elements: elementsResponse || [],
                        recent_links: linksResponse || [],
                    });
                    setViewStates(statesResponse || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setWorkspace(EMPTY_WORKSPACE);
                    setViewStates([]);
                    setError(getErrorMessage(err, 'No se pudo cargar el workspace BIM.'));
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        loadWorkspace();
        return () => {
            cancelled = true;
        };
    }, [enabled, projectId, reloadToken, selectedEmpresa?.id, user, user?.empresa_id]);

    return {
        workspace,
        viewStates,
        loading,
        error,
        refresh: () => setReloadToken((value) => value + 1),
    };
}
