import React, { useEffect, useRef, useState } from 'react';
import { Building2, Eye, Layers3, ScanSearch, Settings2 } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';
import { bimViewStatesApi } from '../../api/bimViewStates';
import BimCanvasViewer from './BimCanvasViewer';
import BimLinksPanel from './BimLinksPanel';
import BimPropertiesPanel from './BimPropertiesPanel';
import BimTreePanel from './BimTreePanel';
import BimVersionSelector from './BimVersionSelector';
import BimViewStateToolbar from './BimViewStateToolbar';
import { useBimProjectWorkspace } from '../../hooks/bim/useBimProjectWorkspace';

const TOOL_BUTTON_BASE =
    'flex min-h-[72px] min-w-[72px] flex-col items-center justify-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]';
const BIM_CONTEXT_STORAGE_KEY = 'giproy_bim_workspace_context';
const BIM_IMPORT_SAMPLE = `{
  "model_name": "Arquitectura Torre Norte",
  "discipline": "Arquitectura",
  "description": "Paquete BIM inicial importado desde JSON",
  "source_filename": "torre-norte.ifc",
  "version_label": "v1",
  "notes": "Carga inicial controlada",
  "activate": true,
  "storeys": [
    { "nombre": "Nivel 01", "codigo": "N1", "orden": 1 },
    { "nombre": "Nivel 02", "codigo": "N2", "orden": 2 }
  ],
  "elements": [
    {
      "global_id": "WALL-001",
      "ifc_class": "IfcWall",
      "nombre": "Muro perimetral A",
      "storey_name": "Nivel 01",
      "classification": "ARQ-WALL",
      "geometry_2d": { "x": 40, "y": 60, "width": 180, "height": 30 },
      "properties": { "Longitud": "5.20 m", "Espesor": "0.15 m" }
    },
    {
      "global_id": "SLAB-002",
      "ifc_class": "IfcSlab",
      "nombre": "Losa principal",
      "storey_name": "Nivel 02",
      "classification": "ARQ-SLAB",
      "geometry_2d": { "x": 90, "y": 150, "width": 220, "height": 110 },
      "properties": { "Area": "78.50 m2", "Espesor": "0.18 m" }
    },
    {
      "global_id": "ROOF-003",
      "ifc_class": "IfcRoof",
      "nombre": "Cubierta acceso",
      "storey_name": "Nivel 02",
      "classification": "ARQ-ROOF",
      "geometry_2d": {
        "points": [
          { "x": 360, "y": 70 },
          { "x": 470, "y": 110 },
          { "x": 430, "y": 205 },
          { "x": 320, "y": 170 }
        ]
      },
      "properties": { "Area": "42.00 m2", "Pendiente": "8%" }
    },
    {
      "global_id": "GRID-004",
      "ifc_class": "IfcGrid",
      "nombre": "Eje A",
      "storey_name": "Nivel 01",
      "classification": "ARQ-GRID",
      "geometry_2d": {
        "points": [
          { "x": 260, "y": 40 },
          { "x": 260, "y": 280 }
        ]
      },
      "properties": { "Tipo": "Eje", "Longitud": "12.40 m" }
    }
  ]
}`;

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

const buildContextBadges = ({ activeVersionLabel, selectedStoreyName, selectedElement, selectedLink }) =>
    [
        activeVersionLabel ? { key: 'version', label: `Versión ${activeVersionLabel}` } : null,
        selectedStoreyName ? { key: 'storey', label: `Nivel ${selectedStoreyName}` } : null,
        selectedElement
            ? {
                  key: 'element',
                  label: `Elemento ${selectedElement.nombre || selectedElement.global_id}`,
              }
            : null,
        selectedLink
            ? {
                  key: 'link',
                  label: `Vínculo ${selectedLink.target_type?.toUpperCase()} · ${selectedLink.target_label}`,
              }
            : null,
    ].filter(Boolean);

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
    const projectLabel = project?.nombre || 'Proyecto activo';
    const { workspace, viewStates, loading, error, refresh } = useBimProjectWorkspace(project?.id, access?.enabled);
    const statusLabel = loading ? 'cargando' : workspace.ready ? 'activo' : 'base pendiente';
    const [bootstrapping, setBootstrapping] = useState(false);
    const [bootstrapMessage, setBootstrapMessage] = useState('');
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
    const [importDraft, setImportDraft] = useState(BIM_IMPORT_SAMPLE);
    const [importingPackage, setImportingPackage] = useState(false);
    const [validatingPackage, setValidatingPackage] = useState(false);
    const [importMessage, setImportMessage] = useState('');
    const [importFileName, setImportFileName] = useState('');
    const [importBatchFiles, setImportBatchFiles] = useState([]);
    const [isImportDragActive, setIsImportDragActive] = useState(false);
    const [validationSummary, setValidationSummary] = useState(null);
    const importFileInputRef = useRef(null);
    const canCreateCompanyScope = access?.resolved_role === 'superadministrador';

    const resetValidationState = () => {
        setValidationSummary(null);
    };

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

    const handleSelectStorey = (storeyName) => {
        setSelectedViewStateId(null);
        setSelectedStoreyName(storeyName);
    };

    const handleSelectElement = (element) => {
        setSelectedViewStateId(null);
        setSelectedElement(element);
    };

    const handleSelectLink = (link) => {
        setSelectedViewStateId(null);
        if (link?.bim_element_id) {
            const linkedElement = (workspace.elements || []).find((element) => element.id === link.bim_element_id) || null;
            if (linkedElement) {
                setSelectedElement(linkedElement);
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
    const linkedElementIds = Array.from(new Set((workspace.recent_links || []).map((link) => link.bim_element_id).filter(Boolean)));
    const contextBadges = buildContextBadges({
        activeVersionLabel,
        selectedStoreyName,
        selectedElement,
        selectedLink,
    });
    const elementLinkCounts = (workspace.recent_links || []).reduce((accumulator, link) => {
        if (!link?.bim_element_id) {
            return accumulator;
        }
        accumulator[link.bim_element_id] = (accumulator[link.bim_element_id] || 0) + 1;
        return accumulator;
    }, {});
    const validationIssuesByElementId = (() => {
        if (!validationSummary) {
            return {};
        }

        let payloads;
        try {
            payloads =
                importBatchFiles.length > 0
                    ? importBatchFiles.map((batchFile) => JSON.parse(batchFile.content))
                    : [JSON.parse(importDraft)];
        } catch {
            return {};
        }
        const issuesByGlobalId = {};

        (validationSummary.results || []).forEach((result, packageIndex) => {
            const payload = payloads[packageIndex];
            if (!payload?.elements?.length) {
                return;
            }

            (result.issues || []).forEach((issue) => {
                const match = issue.path?.match(/^elements\[(\d+)\]/);
                if (!match) {
                    return;
                }
                const elementIndex = Number(match[1]);
                const payloadElement = payload.elements[elementIndex];
                const globalId = payloadElement?.global_id;
                if (!globalId) {
                    return;
                }
                if (!issuesByGlobalId[globalId]) {
                    issuesByGlobalId[globalId] = [];
                }
                issuesByGlobalId[globalId].push(issue);
            });
        });

        return visibleElements.reduce((accumulator, element) => {
            const elementIssues = issuesByGlobalId[element.global_id];
            if (elementIssues?.length) {
                accumulator[element.id] = elementIssues;
            }
            return accumulator;
        }, {});
    })();

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
        setSelectedElement(nextSelected);
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
        applyWorkspaceSelection(viewState?.payload || {}, viewState?.id || null);
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

    const handleBootstrapDemo = async () => {
        if (!project?.id) {
            return;
        }
        try {
            setBootstrapping(true);
            setBootstrapMessage('');
            const response = await bimModelsApi.bootstrapDemo(project.id, access?.resolved_company_id);
            setBootstrapMessage(
                `${response.message} Elementos: ${response.created_elements ?? 0} · Niveles: ${response.created_storeys ?? 0}`,
            );
            refresh();
        } catch (bootstrapError) {
            setBootstrapMessage(
                bootstrapError?.response?.data?.detail || 'No se pudo materializar el bootstrap BIM demo.',
            );
        } finally {
            setBootstrapping(false);
        }
    };

    const handleImportJsonPackage = async () => {
        if (!project?.id) {
            return;
        }

        let parsedPayload;
        try {
            parsedPayload = JSON.parse(importDraft);
        } catch {
            setImportMessage('El paquete BIM JSON no es válido. Revisa la sintaxis antes de importar.');
            return;
        }

        try {
            setImportingPackage(true);
            setImportMessage('');
            const response = await bimModelsApi.importJsonPackage(project.id, parsedPayload, access?.resolved_company_id);
            setImportMessage(
                `Importación BIM lista: ${response.model_name} ${response.version_label} · elementos ${response.created_elements} · niveles ${response.created_storeys}`,
            );
            refresh();
        } catch (importError) {
            setImportMessage(importError?.response?.data?.detail || 'No se pudo importar el paquete BIM JSON.');
        } finally {
            setImportingPackage(false);
        }
    };

    const loadImportJsonFiles = async (files = []) => {
        const validBatch = [];

        for (const file of files) {
            if (!file) {
                continue;
            }
            try {
                const fileContent = await file.text();
                JSON.parse(fileContent);
                validBatch.push({
                    name: file.name,
                    content: fileContent,
                });
            } catch {
                setImportMessage(`El archivo ${file.name || 'seleccionado'} no contiene un JSON BIM válido.`);
                return;
            }
        }

        if (validBatch.length === 0) {
            return;
        }

        resetValidationState();
        setImportBatchFiles(validBatch);
        setImportDraft(validBatch[0].content);
        setImportFileName(validBatch[0].name);
        setImportMessage(
            validBatch.length === 1
                ? `Archivo BIM JSON cargado en borrador: ${validBatch[0].name}`
                : `${validBatch.length} archivos BIM JSON listos para importación por lote.`,
        );
    };

    const handleImportFileChange = async (event) => {
        const files = Array.from(event.target.files || []);
        await loadImportJsonFiles(files);
        event.target.value = '';
    };

    const handleImportDragOver = (event) => {
        event.preventDefault();
        setIsImportDragActive(true);
    };

    const handleImportDragLeave = (event) => {
        event.preventDefault();
        const nextTarget = event.relatedTarget;
        if (event.currentTarget.contains(nextTarget)) {
            return;
        }
        setIsImportDragActive(false);
    };

    const handleImportDrop = async (event) => {
        event.preventDefault();
        setIsImportDragActive(false);
        const files = Array.from(event.dataTransfer?.files || []);
        await loadImportJsonFiles(files);
    };

    const handleImportBatchPackages = async () => {
        if (!project?.id || importBatchFiles.length === 0) {
            return;
        }

        try {
            setImportingPackage(true);
            setImportMessage('');
            const payloads = importBatchFiles.map((batchFile) => JSON.parse(batchFile.content));
            const response = await bimModelsApi.importJsonBatch(project.id, payloads, access?.resolved_company_id);
            const results = (response.results || []).map((result, index) => {
                const sourceName = importBatchFiles[index]?.name || result.model_name;
                return `${sourceName}: ${result.created_elements} elementos`;
            });

            setImportMessage(`Importación BIM por lote completada. ${results.join(' · ')}`);
            refresh();
        } catch (importError) {
            setImportMessage(importError?.response?.data?.detail || 'No se pudo completar la importación BIM por lote.');
        } finally {
            setImportingPackage(false);
        }
    };

    const handleValidateImportPackages = async () => {
        if (!project?.id) {
            return;
        }

        try {
            setValidatingPackage(true);
            setImportMessage('');
            const payloads =
                importBatchFiles.length > 0 ? importBatchFiles.map((batchFile) => JSON.parse(batchFile.content)) : [JSON.parse(importDraft)];
            const response = await bimModelsApi.validateJsonBatch(project.id, payloads, access?.resolved_company_id);
            setValidationSummary(response);
            setImportMessage(
                `Validación BIM completada. Errores: ${response.total_errors ?? 0} · Advertencias: ${response.total_warnings ?? 0}`,
            );
        } catch (validationError) {
            setValidationSummary(null);
            setImportMessage(validationError?.response?.data?.detail || 'No se pudo validar el paquete BIM JSON.');
        } finally {
            setValidatingPackage(false);
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-col gap-4">
            <section className="rounded-[1.75rem] border border-zinc-200 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-200 px-6 py-5">
                    <div className="min-w-0">
                        <div className="mb-2 flex items-center gap-2">
                            <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50 text-[#F39200]">
                                <Building2 className="h-4 w-4" />
                            </span>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">
                                    Workspace BIM
                                </p>
                                <h2 className="text-lg font-black uppercase tracking-tight text-zinc-900">
                                    {projectLabel}
                                </h2>
                            </div>
                        </div>
                        <p className="max-w-3xl text-sm text-zinc-500">
                            La capa BIM ya quedó encapsulada detrás de feature flags y dentro del módulo de proyecto. Esta
                            shell ya consume un workspace real por proyecto y sigue sin alterar el flujo clásico cuando BIM está apagado.
                        </p>
                    </div>

                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Estado de activación</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="h-2.5 w-2.5 rounded-full bg-[#F39200]" />
                            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-700">
                                BIM habilitado para esta sesión
                            </span>
                        </div>
                        <p className="mt-2 text-xs text-zinc-500">
                            Entorno: {access.environment_enabled ? 'activo' : 'apagado'} • Workspace: {statusLabel} • Empresa: {access.resolved_company_id ?? 'sin tenant'}
                        </p>
                        {access?.resolved_role === 'superadministrador' ? (
                            <>
                                <button
                                    type="button"
                                    onClick={handleBootstrapDemo}
                                    disabled={bootstrapping}
                                    className="mt-3 w-full rounded-xl bg-[#F39200] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {bootstrapping ? 'Materializando...' : 'Bootstrap BIM demo'}
                                </button>
                                {bootstrapMessage ? (
                                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                                        {bootstrapMessage}
                                    </p>
                                ) : null}
                                <div
                                    className={`mt-4 rounded-2xl border bg-white p-3 transition-colors ${
                                        isImportDragActive ? 'border-[#F39200] bg-orange-50/40' : 'border-zinc-200'
                                    }`}
                                    onDragOver={handleImportDragOver}
                                    onDragEnter={handleImportDragOver}
                                    onDragLeave={handleImportDragLeave}
                                    onDrop={handleImportDrop}
                                >
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                        Importación JSON BIM
                                    </p>
                                    <p className="mt-2 text-xs text-zinc-500">
                                        Primer carril de carga controlada para materializar modelos/versiones reales sin depender
                                        solo del bootstrap demo.
                                    </p>
                                    <div
                                        className={`mt-3 rounded-2xl border border-dashed px-4 py-3 text-center text-[11px] font-bold uppercase tracking-[0.16em] ${
                                            isImportDragActive
                                                ? 'border-[#F39200] bg-white text-[#F39200]'
                                                : 'border-zinc-300 bg-zinc-50 text-zinc-500'
                                        }`}
                                    >
                                        {isImportDragActive
                                            ? 'Suelta aquí el archivo JSON BIM'
                                            : 'Arrastra aquí un archivo .json o cárgalo manualmente'}
                                    </div>
                                    <textarea
                                        value={importDraft}
                                        onChange={(event) => {
                                            resetValidationState();
                                            setImportDraft(event.target.value);
                                        }}
                                        rows={12}
                                        spellCheck={false}
                                        className="mt-3 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3 font-mono text-[11px] text-zinc-700 outline-none transition-colors focus:border-[#F39200] focus:bg-white"
                                    />
                                    <input
                                        ref={importFileInputRef}
                                        type="file"
                                        accept=".json,application/json"
                                        multiple
                                        className="hidden"
                                        onChange={handleImportFileChange}
                                    />
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => importFileInputRef.current?.click()}
                                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                                        >
                                            Cargar archivo JSON
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                resetValidationState();
                                                setImportDraft(BIM_IMPORT_SAMPLE);
                                                setImportFileName('');
                                                setImportBatchFiles([]);
                                                setImportMessage('');
                                            }}
                                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                                        >
                                            Cargar ejemplo
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleImportBatchPackages}
                                            disabled={importingPackage || importBatchFiles.length < 2}
                                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            Importar lote
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleValidateImportPackages}
                                            disabled={validatingPackage || importingPackage}
                                            className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-40"
                                        >
                                            {validatingPackage ? 'Validando...' : 'Validar JSON BIM'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleImportJsonPackage}
                                            disabled={importingPackage}
                                            className="rounded-xl bg-[#F39200] px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {importingPackage ? 'Importando...' : 'Importar paquete JSON'}
                                        </button>
                                    </div>
                                    {importFileName ? (
                                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                                            Archivo activo: {importFileName}
                                        </p>
                                    ) : null}
                                    {importBatchFiles.length > 1 ? (
                                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                                            Lote preparado: {importBatchFiles.length} archivos JSON BIM
                                        </p>
                                    ) : null}
                                    {importMessage ? (
                                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-500">
                                            {importMessage}
                                        </p>
                                    ) : null}
                                    {validationSummary ? (
                                        <div className="mt-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                Resumen de validación BIM
                                            </p>
                                            <p className="mt-2 text-xs text-zinc-500">
                                                Paquetes: {validationSummary.package_count} · Errores: {validationSummary.total_errors} ·
                                                Advertencias: {validationSummary.total_warnings}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                                                <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600">
                                                    Revisados {validationSummary.package_count ?? 0}
                                                </span>
                                                <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">
                                                    Limpios {(validationSummary.results || []).filter((result) => (result.issue_count ?? 0) === 0).length}
                                                </span>
                                                <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">
                                                    Con errores {(validationSummary.results || []).filter((result) => (result.error_count ?? 0) > 0).length}
                                                </span>
                                                <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                                                    Con advertencias {(validationSummary.results || []).filter((result) => (result.warning_count ?? 0) > 0).length}
                                                </span>
                                            </div>
                                            <div className="mt-3 space-y-3">
                                                {(validationSummary.results || []).map((result, index) => (
                                                    <div key={`${result.model_name}-${result.version_label}-${index}`} className="rounded-2xl border border-zinc-200 bg-white p-3">
                                                        <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-700">
                                                            {result.model_name} · {result.version_label}
                                                        </p>
                                                        <p className="mt-1 text-[11px] text-zinc-500">
                                                            Elementos: {result.element_count} · Niveles: {result.storey_count} · Issues: {result.issue_count}
                                                        </p>
                                                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                                                            Origen: {importBatchFiles[index]?.name || importFileName || result.model_name || 'Paquete BIM'}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700">
                                                                Rect: {result.geometry_summary?.rect_count ?? 0}
                                                            </span>
                                                            <span className="rounded-full bg-sky-100 px-2 py-1 text-sky-700">
                                                                Líneas: {result.geometry_summary?.line_count ?? 0}
                                                            </span>
                                                            <span className="rounded-full bg-violet-100 px-2 py-1 text-violet-700">
                                                                Polígonos: {result.geometry_summary?.polygon_count ?? 0}
                                                            </span>
                                                            <span className="rounded-full bg-zinc-100 px-2 py-1 text-zinc-700">
                                                                Derivados: {result.geometry_summary?.derived_count ?? 0}
                                                            </span>
                                                        </div>
                                                        <div className="mt-2 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                                                            <span className="rounded-full bg-rose-50 px-2 py-1 text-rose-700">
                                                                Errores: {result.error_count}
                                                            </span>
                                                            <span className="rounded-full bg-amber-50 px-2 py-1 text-amber-700">
                                                                Advertencias: {result.warning_count}
                                                            </span>
                                                        </div>
                                                        {result.issues?.length ? (
                                                            <div className="mt-2 space-y-2">
                                                                {result.issues.slice(0, 4).map((issue, issueIndex) => (
                                                                    <div
                                                                        key={`${issue.code}-${issueIndex}`}
                                                                        className={`rounded-xl px-3 py-2 text-[11px] ${
                                                                            issue.severity === 'error'
                                                                                ? 'bg-rose-50 text-rose-700'
                                                                                : 'bg-amber-50 text-amber-700'
                                                                        }`}
                                                                    >
                                                                        <span className="font-black uppercase tracking-[0.16em]">{issue.severity}</span>{' '}
                                                                        {issue.message}
                                                                    </div>
                                                                ))}
                                                                {result.issues.length > 4 ? (
                                                                    <p className="text-[11px] font-semibold text-zinc-500">
                                                                        +{result.issues.length - 4} issues adicionales en este paquete.
                                                                    </p>
                                                                ) : null}
                                                            </div>
                                                        ) : (
                                                            <p className="mt-2 text-[11px] font-semibold text-emerald-700">
                                                                Sin problemas detectados.
                                                            </p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </>
                        ) : null}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3 px-6 py-5">
                    <button type="button" className={TOOL_BUTTON_BASE} title="Viewer BIM">
                        <Eye className="h-4 w-4" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Viewer</span>
                    </button>
                    <button type="button" className={TOOL_BUTTON_BASE} title="Árbol BIM">
                        <Layers3 className="h-4 w-4" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Árbol</span>
                    </button>
                    <button type="button" className={TOOL_BUTTON_BASE} title="Propiedades">
                        <ScanSearch className="h-4 w-4" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Props</span>
                    </button>
                    <button type="button" className={TOOL_BUTTON_BASE} title="Configuración BIM">
                        <Settings2 className="h-4 w-4" />
                        <span className="text-[7px] font-black uppercase tracking-widest">Config</span>
                    </button>
                </div>

                <div className="border-t border-zinc-200 px-6 py-5">
                    <div className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                    Contexto activo BIM
                                </p>
                                <h3 className="mt-1 text-sm font-black uppercase tracking-widest text-zinc-900">
                                    Navegación técnica sincronizada
                                </h3>
                                <p className="mt-2 text-sm text-zinc-500">
                                    El workspace mantiene versión, nivel, elemento y vínculo activos para que el viewer, el árbol y la
                                    bitácora sigan el mismo foco operativo.
                                </p>
                            </div>
                            <div className="flex flex-wrap gap-2 xl:max-w-[420px] xl:justify-end">
                                {contextBadges.length > 0 ? (
                                    contextBadges.map((badge) => (
                                        <span
                                            key={badge.key}
                                            className="inline-flex min-h-9 items-center rounded-full border border-orange-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#F39200]"
                                        >
                                            {badge.label}
                                        </span>
                                    ))
                                ) : (
                                    <span className="inline-flex min-h-9 items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                        Sin contexto técnico fijado
                                    </span>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedStoreyName(null)}
                                disabled={!selectedStoreyName}
                                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Limpiar nivel
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedElement(null)}
                                disabled={!selectedElement}
                                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Limpiar elemento
                            </button>
                            <button
                                type="button"
                                onClick={() => setSelectedLink(null)}
                                disabled={!selectedLink}
                                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Limpiar vínculo
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setSelectedViewStateId(null);
                                    setSelectedVersionId(workspace.active_version_id || null);
                                    setSelectedStoreyName(null);
                                    setSelectedElement(null);
                                    setSelectedLink(null);
                                }}
                                className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                            >
                                Reset técnico
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <section className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
                <BimTreePanel
                    nodes={workspace.tree_nodes}
                    elements={visibleElements}
                    ready={workspace.ready}
                    selectedElementId={selectedElement?.id}
                    selectedStoreyName={selectedStoreyName}
                    onSelectElement={handleSelectElement}
                    onSelectStorey={handleSelectStorey}
                />

                <BimCanvasViewer
                    elements={visibleElements}
                    ready={workspace.ready}
                    error={error}
                    selectedElement={selectedElement}
                    selectedLink={selectedLink}
                    linkedElementIds={linkedElementIds}
                    elementLinkCounts={elementLinkCounts}
                    validationIssuesByElementId={validationIssuesByElementId}
                    onSelectElement={handleSelectElement}
                    activeVersionLabel={activeVersionLabel}
                    activeStoreyName={selectedStoreyName}
                />

                <div className="flex min-h-[220px] flex-col gap-4">
                    <BimVersionSelector
                        models={workspace.models}
                        activeVersionId={selectedVersionId || workspace.active_version_id}
                        onSelectVersion={handleSelectVersion}
                    />
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
                    />
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
                </div>
            </section>

            <BimPropertiesPanel
                groups={workspace.property_groups}
                ready={workspace.ready}
                selectedElement={selectedElement}
                selectedLink={selectedLink}
                onNavigateTarget={onNavigateTarget}
            />
        </div>
    );
};

export default BimWorkspace;
