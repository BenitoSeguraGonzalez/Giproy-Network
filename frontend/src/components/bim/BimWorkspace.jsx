import React, { useEffect, useMemo, useState } from 'react';

import { bimModelsApi } from '../../api/bimModels';
import { bimLinksApi } from '../../api/bimLinks';
import { bimViewStatesApi } from '../../api/bimViewStates';
import BimCanvasViewer from './BimCanvasViewer';
import BimLinksPanel from './BimLinksPanel';
import BimImportJobsPanel from './BimImportJobsPanel';
import BimFragmentsViewport from './BimFragmentsViewport';
import BimPropertiesPanel from './BimPropertiesPanel';
import BimQualityReportPanel from './BimQualityReportPanel';
import BimThreeViewer from './BimThreeViewer';
import BimTreePanel from './BimTreePanel';
import BimVersionSelector from './BimVersionSelector';
import BimVersionComparePanel from './BimVersionComparePanel';
import BimFederationPanel from './BimFederationPanel';
import BimIdsPanel from './BimIdsPanel';
import BimIssuesPanel from './BimIssuesPanel';
import BimQuantityProposalPanel from './BimQuantityProposalPanel';
import BimCostEstimatePanel from './BimCostEstimatePanel';
import BimCostContractsPanel from './BimCostContractsPanel';
import BimCostPaymentsPanel from './BimCostPaymentsPanel';
import BimCostSovPanel from './BimCostSovPanel';
import BimCostChangeOrdersPanel from './BimCostChangeOrdersPanel';
import BimActualCostLedgerPanel from './BimActualCostLedgerPanel';
import BimCostForecastPanel from './BimCostForecastPanel';
import BimAsBuiltAcceptancePanel from './BimAsBuiltAcceptancePanel';
import BimPunchClosurePanel from './BimPunchClosurePanel';
import BimHandoverDossierPanel from './BimHandoverDossierPanel';
import BimOperationsTransitionPanel from './BimOperationsTransitionPanel';
import BimErpExchangePanel from './BimErpExchangePanel';
import BimIntegrationGatewayPanel from './BimIntegrationGatewayPanel';
import BimCommissioningRegistryPanel from './BimCommissioningRegistryPanel';
import BimScheduleLinkPanel from './BimScheduleLinkPanel';
import BimScheduleInterchangePanel from './BimScheduleInterchangePanel';
import BimCdeDocumentsPanel from './BimCdeDocumentsPanel';
import BimCdeDashboardPanel from './BimCdeDashboardPanel';
import BimCdeCollaborationPanel from './BimCdeCollaborationPanel';
import BimCdeRfiPanel from './BimCdeRfiPanel';
import BimCdeSubmittalsPanel from './BimCdeSubmittalsPanel';
import BimSiteGeoreferencePanel from './BimSiteGeoreferencePanel';
import BimCdeReviewPanel from './BimCdeReviewPanel';
import BimPlanActualPanel from './BimPlanActualPanel';
import BimWorkfrontScenarioPanel from './BimWorkfrontScenarioPanel';
import BimProductivityProposalPanel from './BimProductivityProposalPanel';
import BimFieldReportPanel from './BimFieldReportPanel';
import BimFieldDocumentsPanel from './BimFieldDocumentsPanel';
import BimFieldIssuesPanel from './BimFieldIssuesPanel';
import BimFieldDiaryPanel from './BimFieldDiaryPanel';
import BimResourceCapacityPanel from './BimResourceCapacityPanel';
import BimSpaceTimeConflictPanel from './BimSpaceTimeConflictPanel';
import BimPlanning4dPanel from './BimPlanning4dPanel';
import BimReportsPanel from './BimReportsPanel';
import BimConstructiblePartitionPanel from './BimConstructiblePartitionPanel';
import BimEquipmentMotionPanel from './BimEquipmentMotionPanel';
import BimSafetyRiskPanel from './BimSafetyRiskPanel';
import BimUnplannedEventsPanel from './BimUnplannedEventsPanel';
import BimFieldResourcesPanel from './BimFieldResourcesPanel';
import BimCrewsTimecardsPanel from './BimCrewsTimecardsPanel';
import BimViewStateToolbar from './BimViewStateToolbar';
import BimWorkspaceV2 from './BimWorkspaceV2';
import { createActivityPlanningSelection, createElementPlanningSelection, findActivitiesByGuid } from './bimPlanningSelection';
import { useBimProjectWorkspace } from '../../hooks/bim/useBimProjectWorkspace';

const BIM_CONTEXT_STORAGE_KEY = 'giproy_bim_workspace_context';

const readStoredBimContext = (projectId) => {
    if (typeof window === 'undefined' || !projectId) return null;
    try {
        const rawValue = window.localStorage.getItem(BIM_CONTEXT_STORAGE_KEY);
        const parsed = rawValue ? JSON.parse(rawValue) : {};
        return parsed?.[projectId] || null;
    } catch {
        return null;
    }
};

const writeStoredBimContext = (projectId, context) => {
    if (typeof window === 'undefined' || !projectId) return;
    try {
        const rawValue = window.localStorage.getItem(BIM_CONTEXT_STORAGE_KEY);
        const parsed = rawValue ? JSON.parse(rawValue) : {};
        parsed[projectId] = context;
        window.localStorage.setItem(BIM_CONTEXT_STORAGE_KEY, JSON.stringify(parsed));
    } catch {
        // ignore storage issues to keep BIM shell non-blocking
    }
};

const BimWorkspace = ({ project, access, onNavigateTarget }) => {
    const [timeline4d, setTimeline4d] = useState(null);
    const [planningCutoff, setPlanningCutoff] = useState('');
    const [planningGantt, setPlanningGantt] = useState(null);
    const [planningSelection, setPlanningSelection] = useState({
        activityIds: [],
        primaryActivityId: null,
        guids: [],
        primaryGuid: '',
        source: null,
        focusToken: null,
    });
    const projectLabel = project?.nombre || 'Proyecto activo';
    const { workspace, viewStates, loading, error, refresh } = useBimProjectWorkspace(project?.id, access?.enabled);
    const [selectedVersionId, setSelectedVersionId] = useState(null);
    const [selectedStoreyName, setSelectedStoreyName] = useState(null);
    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedLink, setSelectedLink] = useState(null);
    const [selectedViewStateId, setSelectedViewStateId] = useState(null);
    const [contextHydrated, setContextHydrated] = useState(false);
    const [savingViewState, setSavingViewState] = useState(false);
    const [renamingViewStateId, setRenamingViewStateId] = useState(null);
    const [duplicatingViewStateId, setDuplicatingViewStateId] = useState(null);
    const [deletingViewStateId, setDeletingViewStateId] = useState(null);
    const [fragmentsViewportAvailable, setFragmentsViewportAvailable] = useState(false);
    const [viewerMode, setViewerMode] = useState('fragments');
    const [viewerStateSnapshot, setViewerStateSnapshot] = useState(null);
    const [viewerStateToApply, setViewerStateToApply] = useState(null);
    const [viewerStateApplyStatus, setViewerStateApplyStatus] = useState(null);
    const [federation, setFederation] = useState(null);
    const canCreateCompanyScope = access?.resolved_role === 'superadministrador';

    useEffect(() => {
        if (!project?.id || !access?.enabled) {
            setFederation(null);
            return undefined;
        }
        let cancelled = false;
        bimModelsApi.getFederation(project.id, access?.resolved_company_id)
            .then((payload) => { if (!cancelled) setFederation(payload); })
            .catch(() => { if (!cancelled) setFederation(null); });
        return () => { cancelled = true; };
    }, [access?.enabled, access?.resolved_company_id, project?.id]);

    const applyWorkspaceSelection = (payload = {}, viewStateId = null) => {
        setSelectedViewStateId(viewStateId);
        setSelectedVersionId(payload.active_version_id || null);
        setSelectedStoreyName(payload.storey_name || null);

        const restoredElement = payload.element_id
            ? (workspace.elements || []).find((element) => element.id === payload.element_id) || null
            : null;
        setSelectedElement(restoredElement);

        const restoredLink = payload.link_id
            ? (workspace.recent_links || []).find((link) => link.id === payload.link_id) || null
            : null;
        setSelectedLink(restoredLink);
    };

    const handleSelectVersion = (versionId) => {
        setSelectedViewStateId(null);
        setSelectedVersionId(versionId);
    };

    const handleOpenIssue = (issue) => {
        const viewpoint = issue?.viewpoint || {};
        if (issue?.version_id) setSelectedVersionId(issue.version_id);
        setViewerStateToApply({
            contract_version: 'giproy_bim_view_state_v2',
            source_version_id: issue?.version_id || viewpoint.source_version_id,
            camera: viewpoint.camera || {},
            selection: { global_id: viewpoint.selected_guids?.[0] || null },
            visibility: viewpoint.visibility || {},
            clipping: viewpoint.clipping || {},
            colors: [], filters: {}, ghost: {}, measurements: [], units: 'm',
            apply_token: `issue-${issue?.id}-${Date.now()}`,
        });
    };

    const syncPlanningFromGuid = (guid, gantt = planningGantt) => {
        setPlanningSelection(createElementPlanningSelection(guid, gantt));
    };

    const setResolvedElement = (element) => {
        setSelectedViewStateId(null);
        setSelectedElement(element);
    };

    const handleSelectElement = (element) => {
        setResolvedElement(element);
        syncPlanningFromGuid(element?.global_id || '');
    };

    const handleSelectLink = (link) => {
        setSelectedViewStateId(null);
        if (link?.bim_element_id) {
            const linkedElement = (workspace.elements || []).find((element) => element.id === link.bim_element_id) || null;
            if (linkedElement) {
                handleSelectElement(linkedElement);
                setSelectedVersionId(linkedElement.bim_model_version_id || null);
                setSelectedStoreyName(linkedElement.storey_name || null);
            }
        }
        setSelectedLink(link);
    };

    const visibleElements = (workspace.elements || []).filter((element) => {
        const versionMatch = selectedVersionId ? element.bim_model_version_id === selectedVersionId : true;
        const storeyMatch = selectedStoreyName ? element.storey_name === selectedStoreyName : true;
        return versionMatch && storeyMatch;
    });

    const activeVersionLabel =
        (workspace.models || [])
            .flatMap((model) => model.versions || [])
            .find((version) => version.id === (selectedVersionId || workspace.active_version_id))?.label ||
        workspace.active_version_label ||
        null;
    const activeVersionId = selectedVersionId || workspace.active_version_id;
    const activeModel = (workspace.models || []).find((model) =>
        (model.versions || []).some((version) => version.id === activeVersionId),
    );
    const activeModelLabel = activeModel?.nombre || activeModel?.name || activeModel?.model_name || null;
    const companyLabel = access?.resolved_company_name || access?.company_name || access?.resolved_company_id?.toString() || null;
    const linkedElementIds = Array.from(new Set((workspace.recent_links || []).map((link) => link.bim_element_id).filter(Boolean)));
    const elementLinkCounts = (workspace.recent_links || []).reduce((accumulator, link) => {
        if (!link?.bim_element_id) {
            return accumulator;
        }
        accumulator[link.bim_element_id] = (accumulator[link.bim_element_id] || 0) + 1;
        return accumulator;
    }, {});
    const validationIssuesByElementId = {};

    useEffect(() => {
        let cancelled = false;

        const hydrateContext = async () => {
            if (!project?.id || !workspace.ready) {
                setContextHydrated(false);
                return;
            }

            try {
                const response = await bimViewStatesApi.getWorkspaceContext(project.id, access?.resolved_company_id);
                const payload = response?.payload || {};
                if (!cancelled) {
                    applyWorkspaceSelection(payload, payload.view_state_id || null);
                }
                if (!cancelled) {
                    setContextHydrated(true);
                }
            } catch {
                const localContext = readStoredBimContext(project.id);
                if (!cancelled && localContext) {
                    applyWorkspaceSelection(
                        {
                            active_version_id: localContext.activeVersionId || null,
                            storey_name: localContext.storeyName || null,
                            element_id: localContext.elementId || null,
                            link_id: localContext.linkId || null,
                        },
                        localContext.viewStateId || null,
                    );
                }
                if (!cancelled) {
                    setContextHydrated(true);
                }
            }
        };

        hydrateContext();
        return () => {
            cancelled = true;
        };
    }, [access?.resolved_company_id, project?.id, workspace.elements, workspace.ready, workspace.recent_links]);

    useEffect(() => {
        if (!selectedVersionId && workspace.active_version_id) {
            setSelectedVersionId(workspace.active_version_id);
        }
    }, [selectedVersionId, workspace.active_version_id]);

    useEffect(() => {
        if (!selectedVersionId) {
            return;
        }
        const availableVersionIds = new Set(
            (workspace.models || []).flatMap((model) => (model.versions || []).map((version) => version.id)),
        );
        if (!availableVersionIds.has(selectedVersionId)) {
            setSelectedVersionId(workspace.active_version_id || null);
        }
    }, [selectedVersionId, workspace.active_version_id, workspace.models]);

    useEffect(() => {
        if (!selectedStoreyName) {
            return;
        }
        const availableStoreys = new Set(visibleElements.map((element) => element.storey_name || 'Sin nivel'));
        if (!availableStoreys.has(selectedStoreyName)) {
            setSelectedStoreyName(null);
        }
    }, [selectedStoreyName, visibleElements]);

    useEffect(() => {
        if (!selectedElement) {
            return;
        }
        const nextSelected = visibleElements.find((element) => element.id === selectedElement.id) || null;
        if (nextSelected) {
            setSelectedElement(nextSelected);
            return;
        }
        const selectedVersionMatches = !selectedVersionId || selectedElement.bim_model_version_id === selectedVersionId;
        const selectedStoreyMatches = !selectedStoreyName || selectedElement.storey_name === selectedStoreyName;
        if (!selectedVersionMatches || !selectedStoreyMatches) setSelectedElement(null);
    }, [selectedElement, visibleElements]);

    useEffect(() => {
        if (!selectedLink) {
            return;
        }
        const nextLink = (workspace.recent_links || []).find((link) => link.id === selectedLink.id) || null;
        setSelectedLink(nextLink);
    }, [selectedLink, workspace.recent_links]);

    useEffect(() => {
        if (!selectedElement?.id) {
            setSelectedLink(null);
            return;
        }

        const matchingLinks = (workspace.recent_links || []).filter((link) => link.bim_element_id === selectedElement.id);
        if (matchingLinks.length === 0) {
            setSelectedLink(null);
            return;
        }

        setSelectedLink((current) => {
            if (current && current.bim_element_id === selectedElement.id) {
                const refreshedCurrent = matchingLinks.find((link) => link.id === current.id);
                return refreshedCurrent || matchingLinks[0];
            }
            return matchingLinks[0];
        });
    }, [selectedElement?.id, workspace.recent_links]);

    useEffect(() => {
        if (!project?.id) {
            return;
        }
        writeStoredBimContext(project.id, {
            viewStateId: selectedViewStateId || null,
            activeVersionId: selectedVersionId || null,
            storeyName: selectedStoreyName || null,
            elementId: selectedElement?.id || null,
            linkId: selectedLink?.id || null,
        });
    }, [project?.id, selectedElement?.id, selectedLink?.id, selectedStoreyName, selectedVersionId, selectedViewStateId]);

    useEffect(() => {
        if (!project?.id || !contextHydrated) {
            return;
        }
        const timeoutId = window.setTimeout(() => {
            bimViewStatesApi.updateWorkspaceContext(
                project.id,
                {
                    view_state_id: selectedViewStateId || null,
                    active_version_id: selectedVersionId || null,
                    storey_name: selectedStoreyName || null,
                    element_id: selectedElement?.id || null,
                    link_id: selectedLink?.id || null,
                },
                access?.resolved_company_id,
            ).catch(() => {
                // Keep local fallback as non-blocking backup.
            });
        }, 250);

        return () => window.clearTimeout(timeoutId);
    }, [access?.resolved_company_id, contextHydrated, project?.id, selectedElement?.id, selectedLink?.id, selectedStoreyName, selectedVersionId, selectedViewStateId]);

    const handleSaveViewState = async (viewName, scope = 'personal') => {
        if (!project?.id || !viewName?.trim()) {
            return;
        }
        try {
            setSavingViewState(true);
            const createdState = await bimViewStatesApi.createByProject(
                project.id,
                {
                    nombre: viewName.trim(),
                    scope,
                    active_version_id: selectedVersionId || null,
                    storey_name: selectedStoreyName || null,
                    element_id: selectedElement?.id || null,
                    link_id: selectedLink?.id || null,
                    viewer_state: viewerStateSnapshot
                        ? {
                              ...viewerStateSnapshot,
                              filters: {
                                  ...(viewerStateSnapshot.filters || {}),
                                  storey_name: selectedStoreyName || null,
                                  viewer_mode: viewerMode,
                              },
                          }
                        : null,
                },
                access?.resolved_company_id,
            );
            setSelectedViewStateId(createdState?.id || null);
            refresh();
        } catch (viewStateError) {
            window.alert(viewStateError?.response?.data?.detail || 'No se pudo guardar la vista BIM actual.');
        } finally {
            setSavingViewState(false);
        }
    };

    const handleApplyViewState = (viewState) => {
        const payload = viewState?.payload || {};
        applyWorkspaceSelection(payload, viewState?.id || null);
        if (payload.viewer_state) {
            setViewerMode(payload.viewer_state.filters?.viewer_mode === 'plan' ? 'plan' : 'fragments');
            setViewerStateApplyStatus({ status: 'applying', viewStateId: viewState.id });
            setViewerStateToApply({ ...payload.viewer_state, apply_token: viewState.id });
        } else {
            setViewerStateApplyStatus({ status: 'legacy', viewStateId: viewState?.id || null });
            setViewerStateToApply(null);
        }
    };

    const handleRenameViewState = async (viewState, viewName) => {
        if (!project?.id || !viewState?.id || !viewName?.trim()) {
            return;
        }
        try {
            setRenamingViewStateId(viewState.id);
            const updatedState = await bimViewStatesApi.updateByProject(
                project.id,
                viewState.id,
                { nombre: viewName.trim() },
                access?.resolved_company_id,
            );
            if (selectedViewStateId === viewState.id) {
                setSelectedViewStateId(updatedState?.id || viewState.id);
            }
            refresh();
        } catch (viewStateError) {
            window.alert(viewStateError?.response?.data?.detail || 'No se pudo renombrar la vista BIM.');
        } finally {
            setRenamingViewStateId(null);
        }
    };

    const handleDuplicateViewState = async (viewState) => {
        if (!project?.id || !viewState?.id) {
            return;
        }
        try {
            setDuplicatingViewStateId(viewState.id);
            const targetScope =
                viewState.scope === 'company' && access?.resolved_role !== 'superadministrador' ? 'personal' : viewState.scope;
            const duplicatedState = await bimViewStatesApi.duplicateByProject(
                project.id,
                viewState.id,
                { scope: targetScope },
                access?.resolved_company_id,
            );
            setSelectedViewStateId(duplicatedState?.id || null);
            refresh();
        } catch (viewStateError) {
            window.alert(viewStateError?.response?.data?.detail || 'No se pudo duplicar la vista BIM.');
        } finally {
            setDuplicatingViewStateId(null);
        }
    };

    const handleDeleteViewState = async (viewState) => {
        if (!project?.id || !viewState?.id) {
            return;
        }
        const confirmed = window.confirm(`¿Eliminar la vista BIM "${viewState.nombre}"?`);
        if (!confirmed) {
            return;
        }
        try {
            setDeletingViewStateId(viewState.id);
            await bimViewStatesApi.deleteByProject(project.id, viewState.id, access?.resolved_company_id);
            if (selectedViewStateId === viewState.id) {
                setSelectedViewStateId(null);
            }
            refresh();
        } catch (viewStateError) {
            window.alert(viewStateError?.response?.data?.detail || 'No se pudo eliminar la vista BIM.');
        } finally {
            setDeletingViewStateId(null);
        }
    };

    const resetTechnicalContext = () => {
        setSelectedViewStateId(null);
        setSelectedVersionId(workspace.active_version_id || null);
        setSelectedStoreyName(null);
        setSelectedElement(null);
        setSelectedLink(null);
        setTimeline4d(null);
        setPlanningCutoff('');
        setPlanningSelection({ activityIds: [], primaryActivityId: null, guids: [], primaryGuid: '', source: null, focusToken: null });
    };

    const resolveElementByGuid = async (guid) => {
        const localElement = (workspace.elements || []).find((item) => item.global_id === guid);
        if (localElement) {
            setResolvedElement(localElement);
            setSelectedVersionId(localElement.bim_model_version_id || null);
            setSelectedStoreyName(localElement.storey_name || null);
            return localElement;
        }
        try {
            const response = await bimLinksApi.searchElementsByProject(
                project.id,
                { q: guid, page: 1, page_size: 10 },
                access?.resolved_company_id,
            );
            const resolvedElement = (response.items || []).find((item) => item.global_id === guid);
            if (resolvedElement) {
                setResolvedElement(resolvedElement);
                setSelectedVersionId(resolvedElement.bim_model_version_id || null);
                setSelectedStoreyName(resolvedElement.storey_name || null);
            }
            return resolvedElement || null;
        } catch {
            // Native selection remains in the viewer if metadata resolution is unavailable.
            return null;
        }
    };

    const handleSelectGuid = async (guid) => {
        syncPlanningFromGuid(guid);
        await resolveElementByGuid(guid);
    };

    const handleSelectActivity = async (activity) => {
        const selection = createActivityPlanningSelection(activity, `activity-${activity?.id || 'none'}-${Date.now()}`);
        setPlanningSelection(selection);
        if (activity?.planned_start) setPlanningCutoff(new Date(activity.planned_start).toISOString().slice(0, 10));
        if (selection.primaryGuid) await resolveElementByGuid(selection.primaryGuid);
        else setResolvedElement(null);
    };

    const handleGanttChange = (gantt) => {
        setPlanningGantt(gantt);
        if (planningSelection.source === 'element' && planningSelection.primaryGuid) {
            const matches = findActivitiesByGuid(planningSelection.primaryGuid, gantt);
            setPlanningSelection((current) => ({
                ...current,
                activityIds: matches.map((activity) => activity.id),
                primaryActivityId: matches[0]?.id || null,
            }));
        }
    };

    const highlightedElementIds = useMemo(() => {
        const selectedGuids = new Set(planningSelection.guids);
        return visibleElements.filter((element) => selectedGuids.has(element.global_id)).map((element) => element.id);
    }, [planningSelection.guids, visibleElements]);

    const viewer = (
            <div className="flex h-full min-h-0 flex-col [&>section]:flex-1">
                {viewerMode === 'fragments' ? (
                    <BimFragmentsViewport
                        projectId={project?.id}
                        versionId={selectedVersionId || workspace.active_version_id}
                        empresaId={access?.resolved_company_id}
                        onAvailabilityChange={setFragmentsViewportAvailable}
                        onSelectGuid={handleSelectGuid}
                        onViewerStateChange={setViewerStateSnapshot}
                        viewerStateToApply={viewerStateToApply}
                        onViewerStateApplied={setViewerStateApplyStatus}
                        federationMembers={federation?.members || []}
                        temporalProfile={timeline4d}
                        selectionProfile={planningSelection}
                    />
                ) : null}
                {viewerMode === 'plan' ? (
                    <BimCanvasViewer
                        elements={visibleElements}
                        ready={workspace.ready}
                        error={error}
                        selectedElement={selectedElement}
                        selectedLink={selectedLink}
                        linkedElementIds={linkedElementIds}
                        highlightedElementIds={highlightedElementIds}
                        elementLinkCounts={elementLinkCounts}
                        validationIssuesByElementId={validationIssuesByElementId}
                        onSelectElement={handleSelectElement}
                        activeVersionLabel={activeVersionLabel}
                        activeStoreyName={selectedStoreyName}
                    />
                ) : null}
                {viewerMode === 'fragments' && !fragmentsViewportAvailable ? (
                    <BimThreeViewer
                        elements={visibleElements}
                        ready={workspace.ready}
                        selectedElement={selectedElement}
                        linkedElementIds={linkedElementIds}
                        highlightedElementIds={highlightedElementIds}
                        activeVersionLabel={activeVersionLabel}
                        activeStoreyName={selectedStoreyName}
                        onSelectElement={handleSelectElement}
                    />
                ) : null}
            </div>
        );

        const viewStateTool = (
            <BimViewStateToolbar
                viewStates={viewStates}
                loading={loading}
                activeViewStateId={selectedViewStateId}
                canCreateCompanyScope={canCreateCompanyScope}
                canManageCompanyViews={canCreateCompanyScope}
                onRefresh={refresh}
                onApplyViewState={handleApplyViewState}
                onSaveViewState={handleSaveViewState}
                onRenameViewState={handleRenameViewState}
                onDuplicateViewState={handleDuplicateViewState}
                onDeleteViewState={handleDeleteViewState}
                saving={savingViewState}
                renamingViewStateId={renamingViewStateId}
                duplicatingViewStateId={duplicatingViewStateId}
                deletingViewStateId={deletingViewStateId}
                applyStatus={viewerStateApplyStatus}
            />
        );
        const linksTool = (
            <BimLinksPanel
                linkSummary={workspace.link_summary}
                ready={workspace.ready}
                projectId={project?.id}
                empresaId={access?.resolved_company_id}
                elements={visibleElements}
                recentLinks={workspace.recent_links}
                selectedElement={selectedElement}
                selectedLinkId={selectedLink?.id}
                onSelectLink={handleSelectLink}
                onRefresh={refresh}
            />
        );
        const propertiesTool = (
            <BimPropertiesPanel
                groups={workspace.property_groups}
                ready={workspace.ready}
                selectedElement={selectedElement}
                selectedLink={selectedLink}
                onNavigateTarget={onNavigateTarget}
            />
        );
        const workspaceTools = {
            viewer: [
                { id: 'properties', label: 'Propiedades', content: propertiesTool },
                { id: 'versions', label: 'Modelos y versiones', content: <BimVersionSelector models={workspace.models} activeVersionId={activeVersionId} onSelectVersion={handleSelectVersion} /> },
                { id: 'views', label: 'Vistas guardadas', content: viewStateTool },
                { id: 'links', label: 'Vínculos', content: linksTool },
                { id: 'quantities', label: 'Cantidades', content: <BimQuantityProposalPanel projectId={project?.id} empresaId={access?.resolved_company_id} versionId={activeVersionId} element={selectedElement} /> },
            ],
            coordination: [
                { id: 'cde-dashboard', label: 'Resumen', content: <BimCdeDashboardPanel projectId={project?.id} empresaId={access?.resolved_company_id} canReconcile={canCreateCompanyScope} /> },
                { id: 'collaboration', label: 'Actividad', content: <BimCdeCollaborationPanel projectId={project?.id} empresaId={access?.resolved_company_id} selectedElement={selectedElement} /> },
                { id: 'documents', label: 'Documentos', content: <BimCdeDocumentsPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'rfis', label: 'RFI', content: <BimCdeRfiPanel projectId={project?.id} empresaId={access?.resolved_company_id} selectedElement={selectedElement} /> },
                { id: 'submittals', label: 'Submittals', content: <BimCdeSubmittalsPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'reviews', label: 'Revisiones', content: <BimCdeReviewPanel projectId={project?.id} empresaId={access?.resolved_company_id} selectedElement={selectedElement} viewerState={viewerStateSnapshot} /> },
                { id: 'issues', label: 'Incidencias', content: <BimIssuesPanel projectId={project?.id} versionId={activeVersionId} empresaId={access?.resolved_company_id} currentUserId={access?.resolved_user_id || access?.user_id} viewerState={viewerStateSnapshot} onOpenIssue={handleOpenIssue} /> },
                { id: 'quality', label: 'Calidad', content: <BimQualityReportPanel projectId={project?.id} versionId={activeVersionId} empresaId={access?.resolved_company_id} canGenerate={canCreateCompanyScope} /> },
                { id: 'ids', label: 'IDS', content: <BimIdsPanel projectId={project?.id} versionId={activeVersionId} empresaId={access?.resolved_company_id} onSelectGuid={handleSelectGuid} /> },
                { id: 'compare', label: 'Comparar versiones', content: <BimVersionComparePanel projectId={project?.id} empresaId={access?.resolved_company_id} models={workspace.models} activeVersionId={activeVersionId} onSelectGuid={handleSelectGuid} /> },
                { id: 'federation', label: 'Federación', content: <BimFederationPanel projectId={project?.id} empresaId={access?.resolved_company_id} models={workspace.models} federation={federation} onFederationChange={setFederation} /> },
                { id: 'location', label: 'Ubicación', content: <BimSiteGeoreferencePanel projectId={project?.id} empresaId={access?.resolved_company_id} activeVersionId={activeVersionId} onSelectVersion={handleSelectVersion} /> },
                { id: 'conflicts', label: 'Conflictos', content: <BimSpaceTimeConflictPanel projectId={project?.id} empresaId={access?.resolved_company_id} onSelectGuid={handleSelectGuid} /> },
            ],
            planning: [
                { id: 'schedule', label: 'Actividad y vínculo', content: <BimScheduleLinkPanel projectId={project?.id} empresaId={access?.resolved_company_id} element={selectedElement} /> },
                { id: 'interchange', label: 'Intercambio', content: <BimScheduleInterchangePanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'links', label: 'Vínculos', content: linksTool },
                { id: 'properties', label: 'Propiedades', content: propertiesTool },
            ],
            production: [
                { id: 'plan-actual', label: 'Plan vs. real', content: <BimPlanActualPanel projectId={project?.id} empresaId={access?.resolved_company_id} onOpenViewpoint={(viewpoint) => viewpoint && handleOpenIssue({ version_id: viewpoint.source_version_id, viewpoint })} /> },
                { id: 'erp-exchange', label: 'ERP', content: <BimErpExchangePanel projectId={project?.id} empresaId={access?.resolved_company_id} canManage={canCreateCompanyScope} /> },
                { id: 'integrations', label: 'Integraciones', content: <BimIntegrationGatewayPanel projectId={project?.id} empresaId={access?.resolved_company_id} canManage={canCreateCompanyScope} /> },
                { id: 'estimate', label: 'Estimación', content: <BimCostEstimatePanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'contracts', label: 'Contratos', content: <BimCostContractsPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'payments', label: 'Pagos', content: <BimCostPaymentsPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'sov', label: 'Valores', content: <BimCostSovPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'changes', label: 'Cambios', content: <BimCostChangeOrdersPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'actual-costs', label: 'Reales', content: <BimActualCostLedgerPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'forecast', label: 'Forecast', content: <BimCostForecastPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'events', label: 'Eventos', content: <BimUnplannedEventsPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'workfronts', label: 'Frentes', content: <BimWorkfrontScenarioPanel projectId={project?.id} empresaId={access?.resolved_company_id} versionId={activeVersionId} element={selectedElement} onSelectGuid={handleSelectGuid} /> },
                { id: 'quantities', label: 'Cantidades', content: <BimQuantityProposalPanel projectId={project?.id} empresaId={access?.resolved_company_id} versionId={activeVersionId} element={selectedElement} /> },
                { id: 'productivity', label: 'Productividad', content: <BimProductivityProposalPanel projectId={project?.id} empresaId={access?.resolved_company_id} element={selectedElement} /> },
                { id: 'resources', label: 'Recursos', content: <BimResourceCapacityPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'partitions', label: 'Particiones', content: <BimConstructiblePartitionPanel projectId={project?.id} empresaId={access?.resolved_company_id} element={selectedElement} /> },
                { id: 'equipment', label: 'Equipos', content: <BimEquipmentMotionPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
            ],
            field: [
                { id: 'diary', label: 'Diario', content: <BimFieldDiaryPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'crews', label: 'Cuadrillas', content: <BimCrewsTimecardsPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'materials', label: 'Materiales', content: <BimFieldResourcesPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'documents', label: 'Documentos', content: <BimFieldDocumentsPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'issues', label: 'Incidencias', content: <BimFieldIssuesPanel projectId={project?.id} versionId={activeVersionId} empresaId={access?.resolved_company_id} viewerState={viewerStateSnapshot} onOpenIssue={handleOpenIssue} /> },
                { id: 'progress', label: 'Registrar avance', content: <BimFieldReportPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'safety', label: 'Inspecciones', content: <BimSafetyRiskPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'properties', label: 'Elemento', content: propertiesTool },
            ],
            handover: [
                { id: 'as-built', label: 'As-built', content: <BimAsBuiltAcceptancePanel projectId={project?.id} empresaId={access?.resolved_company_id} models={workspace.models} activeVersionId={activeVersionId} /> },
                { id: 'commissioning', label: 'Commissioning', content: <BimCommissioningRegistryPanel projectId={project?.id} empresaId={access?.resolved_company_id} versionId={activeVersionId} element={selectedElement} /> },
                { id: 'punch-closure', label: 'Cierre punch', content: <BimPunchClosurePanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'handover-dossier', label: 'Dossier digital', content: <BimHandoverDossierPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
                { id: 'operations-transition', label: 'Transición O&M', content: <BimOperationsTransitionPanel projectId={project?.id} empresaId={access?.resolved_company_id} /> },
            ],
        };
        const bottomTools = [
            {
                id: 'planning-4d',
                label: 'Secuencia 4D',
                content: (
                    <BimPlanning4dPanel
                        projectId={project?.id}
                        empresaId={access?.resolved_company_id}
                        cutoff={planningCutoff}
                        selectedGuid={planningSelection.primaryGuid}
                        selectedActivityIds={planningSelection.activityIds}
                        primaryActivityId={planningSelection.primaryActivityId}
                        onCutoffChange={setPlanningCutoff}
                        onTimelineChange={setTimeline4d}
                        onGanttChange={handleGanttChange}
                        onSelectActivity={handleSelectActivity}
                    />
                ),
            },
        ];
        const adminTools = canCreateCompanyScope
            ? [
                  { id: 'imports', label: 'Importaciones', content: <BimImportJobsPanel projectId={project?.id} empresaId={access?.resolved_company_id} onImportReady={refresh} /> },
                  { id: 'versions', label: 'Modelos y versiones', content: <BimVersionSelector models={workspace.models} activeVersionId={activeVersionId} onSelectVersion={handleSelectVersion} /> },
                  { id: 'federation', label: 'Federación', content: <BimFederationPanel projectId={project?.id} empresaId={access?.resolved_company_id} models={workspace.models} federation={federation} onFederationChange={setFederation} /> },
                  { id: 'location', label: 'Ubicación', content: <BimSiteGeoreferencePanel projectId={project?.id} empresaId={access?.resolved_company_id} activeVersionId={activeVersionId} onSelectVersion={handleSelectVersion} /> },
                  { id: 'quality', label: 'Calidad', content: <BimQualityReportPanel projectId={project?.id} versionId={activeVersionId} empresaId={access?.resolved_company_id} canGenerate /> },
                  { id: 'ids', label: 'IDS', content: <BimIdsPanel projectId={project?.id} versionId={activeVersionId} empresaId={access?.resolved_company_id} onSelectGuid={handleSelectGuid} /> },
              ]
            : [];
        const searchItems = [
            ...visibleElements.map((element) => ({
                id: `element-${element.id}`,
                type: 'Elemento',
                label: element.nombre || element.global_id,
                meta: `${element.ifc_class || 'Sin clase'} · ${element.global_id || 'Sin GlobalId'} · ${element.storey_name || 'Sin nivel'}`,
                workspace: 'viewer',
                onSelect: () => handleSelectElement(element),
            })),
            ...(workspace.models || []).flatMap((model) => (model.versions || []).map((version) => ({
                id: `version-${version.id}`,
                type: 'Modelo',
                label: `${model.nombre || model.name || model.model_name || 'Modelo BIM'} · ${version.label}`,
                meta: model.discipline || model.disciplina || 'Modelo y versión BIM',
                workspace: 'viewer',
                onSelect: () => handleSelectVersion(version.id),
            }))),
            ...(workspace.recent_links || []).map((link) => ({
                id: `link-${link.id}`,
                type: 'Vínculo',
                label: link.target_label || link.target_id || 'Vínculo BIM',
                meta: `${link.target_type || 'Destino'} · ${link.link_type || 'Vínculo'}`,
                workspace: 'planning',
                onSelect: () => handleSelectLink(link),
            })),
            ...(planningGantt?.activities || []).map((activity) => ({
                id: `activity-${activity.id}`,
                type: 'Actividad',
                label: `${activity.code} · ${activity.name}`,
                meta: `${new Date(activity.planned_start).toLocaleDateString('es')} · ${activity.global_ids.length} elementos BIM`,
                workspace: 'planning',
                onSelect: () => handleSelectActivity(activity),
            })),
        ];

    return (
        <BimWorkspaceV2
                projectId={project?.id}
                companyLabel={companyLabel}
                projectLabel={projectLabel}
                modelLabel={activeModelLabel}
                versionLabel={activeVersionLabel}
                viewerMode={viewerMode}
                loading={loading}
                canAdminister={access?.resolved_role === 'superadministrador'}
                explorer={(
                    <BimTreePanel
                        nodes={workspace.tree_nodes}
                        elements={visibleElements}
                        ready={workspace.ready}
                        projectId={project?.id}
                        empresaId={access?.resolved_company_id}
                        versionId={activeVersionId}
                        selectedElement={selectedElement}
                        selectedElementId={selectedElement?.id}
                        onSelectElement={handleSelectElement}
                    />
                )}
                viewer={viewer}
                inspector={propertiesTool}
                workspaceTools={workspaceTools}
                bottomTools={bottomTools}
                adminTools={adminTools}
                reports={<BimReportsPanel projectId={project?.id} empresaId={access?.resolved_company_id} />}
                ready={workspace.ready}
                error={error}
                searchItems={searchItems}
                onChangeViewerMode={setViewerMode}
                onResetContext={resetTechnicalContext}
                onRefresh={refresh}
        />
    );
};

export default BimWorkspace;
