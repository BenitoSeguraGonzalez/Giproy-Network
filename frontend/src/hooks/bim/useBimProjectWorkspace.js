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

export function useBimProjectWorkspace(projectId, enabled, selectedVersionId = null) {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const [workspace, setWorkspace] = useState(EMPTY_WORKSPACE);
    const [viewStates, setViewStates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [warnings, setWarnings] = useState([]);
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        let cancelled = false;

        const loadWorkspace = async () => {
            if (!enabled || !projectId || !user) {
                setWorkspace(EMPTY_WORKSPACE);
                setViewStates([]);
                setError(null);
                setWarnings([]);
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                setError(null);
                const empresaId = selectedEmpresa?.id || user?.empresa_id || null;
                const [workspaceResult, statesResult, elementsResult, linksResult] = await Promise.allSettled([
                    bimModelsApi.getWorkspace(projectId, empresaId),
                    bimViewStatesApi.listByProject(projectId, empresaId),
                    bimLinksApi.listElementsByProject(projectId, empresaId, selectedVersionId),
                    bimLinksApi.listByProject(projectId, empresaId),
                ]);
                if (workspaceResult.status === 'rejected') throw workspaceResult.reason;
                const partialWarnings = [];
                if (statesResult.status === 'rejected') partialWarnings.push('vistas guardadas');
                if (elementsResult.status === 'rejected') partialWarnings.push('índice de elementos');
                if (linksResult.status === 'rejected') partialWarnings.push('vínculos coordinados');
                if (!cancelled) {
                    setWorkspace({
                        ...EMPTY_WORKSPACE,
                        ...workspaceResult.value,
                        active_version_id: selectedVersionId || workspaceResult.value.active_version_id,
                        active_version_label: selectedVersionId
                            ? workspaceResult.value.models?.flatMap((model) => model.versions || []).find((version) => version.id === selectedVersionId)?.version_label || workspaceResult.value.active_version_label
                            : workspaceResult.value.active_version_label,
                        elements: elementsResult.status === 'fulfilled' ? (elementsResult.value || []) : [],
                        recent_links: linksResult.status === 'fulfilled' ? (linksResult.value || []) : [],
                    });
                    setViewStates(statesResult.status === 'fulfilled' ? (statesResult.value || []) : []);
                    setWarnings(partialWarnings);
                }
            } catch (err) {
                if (!cancelled) {
                    setWorkspace(EMPTY_WORKSPACE);
                    setViewStates([]);
                    setError(getErrorMessage(err, 'No se pudo cargar el workspace BIM.'));
                    setWarnings([]);
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
    }, [enabled, projectId, reloadToken, selectedEmpresa?.id, selectedVersionId, user, user?.empresa_id]);

    return {
        workspace,
        viewStates,
        loading,
        error,
        warnings,
        refresh: () => setReloadToken((value) => value + 1),
    };
}
