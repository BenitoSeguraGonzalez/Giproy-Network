import React, { Component, useEffect, useMemo, useRef, useState } from 'react';
import {
    Box,
    CalendarRange,
    ChartNoAxesCombined,
    ClipboardCheck,
    FileChartColumn,
    GitMerge,
    Layers3,
    MonitorX,
    PackageCheck,
    PanelLeft,
    PanelRight,
    RefreshCw,
    RotateCcw,
    Search,
    Settings,
    Upload,
    X,
} from 'lucide-react';
import { isMinimumDesktopDisplaySupported } from '../../utils/displayResolution';
import { getErrorMessage } from '../../utils/errorMessage';
import useAdaptiveLayout from '../../hooks/useAdaptiveLayout';

const BIM_V2_PREFERENCES_KEY = 'giproy_bim_workspace_v2_preferences';

const WORKSPACES = [
    { id: 'viewer', label: 'Visor', icon: Box },
    { id: 'coordination', label: 'Coordinación', icon: GitMerge },
    { id: 'planning', label: 'Planificación 4D', icon: CalendarRange },
    { id: 'production', label: 'Producción', icon: ChartNoAxesCombined },
    { id: 'field', label: 'Campo', icon: ClipboardCheck },
    { id: 'handover', label: 'Entrega', icon: PackageCheck },
    { id: 'reports', label: 'Informes', icon: FileChartColumn },
];

const iconButtonClass =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] disabled:cursor-not-allowed disabled:opacity-40';

const readPreferences = (projectId) => {
    if (typeof window === 'undefined' || !projectId) return {};
    try {
        const stored = JSON.parse(window.localStorage.getItem(BIM_V2_PREFERENCES_KEY) || '{}');
        return stored[projectId] || {};
    } catch {
        return {};
    }
};

const writePreferences = (projectId, preferences) => {
    if (typeof window === 'undefined' || !projectId) return;
    try {
        const stored = JSON.parse(window.localStorage.getItem(BIM_V2_PREFERENCES_KEY) || '{}');
        stored[projectId] = preferences;
        window.localStorage.setItem(BIM_V2_PREFERENCES_KEY, JSON.stringify(stored));
    } catch {
        // Visual preferences must never block the BIM workspace.
    }
};

const useSupportedDesktop = () => {
    const getSupported = () => isMinimumDesktopDisplaySupported();
    const [supported, setSupported] = useState(getSupported);

    useEffect(() => {
        const update = () => setSupported(getSupported());
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return supported;
};

const ContextValue = ({ label, value }) => (
    <div className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase text-zinc-400">{label}</span>
        <span className="block truncate text-xs font-semibold text-zinc-800" title={value || undefined}>
            {value || 'Sin asignar'}
        </span>
    </div>
);

class BimRegionBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { failed: false };
    }

    static getDerivedStateFromError() {
        return { failed: true };
    }

    componentDidUpdate(previousProps) {
        if (previousProps.resetKey !== this.props.resetKey && this.state.failed) {
            this.setState({ failed: false });
        }
    }

    render() {
        if (this.state.failed) {
            return (
                <div className="grid h-full min-h-40 place-items-center border border-rose-200 bg-rose-50 p-5 text-center" role="alert">
                    <div>
                        <p className="text-sm font-semibold text-rose-800">Esta herramienta no pudo cargarse.</p>
                        <p className="mt-1 text-xs text-rose-700">El resto del workspace BIM continúa disponible.</p>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const BimWorkspaceV2 = ({
    projectId,
    companyLabel,
    projectLabel,
    modelLabel,
    versionLabel,
    viewerMode,
    loading,
    canAdminister,
    explorer,
    viewer,
    inspector,
    workspaceTools,
    bottomTools,
    adminTools,
    reports,
    ready,
    error,
    searchItems = [],
    onChangeViewerMode,
    onResetContext,
    onRefresh,
}) => {
    const errorMessage = error ? getErrorMessage(error, 'No se pudo cargar el workspace BIM.') : '';
    const initialPreferences = useMemo(() => readPreferences(projectId), [projectId]);
    const [activeWorkspace, setActiveWorkspace] = useState(initialPreferences.activeWorkspace || 'viewer');
    const [explorerVisible, setExplorerVisible] = useState(initialPreferences.explorerVisible !== false);
    const [inspectorVisible, setInspectorVisible] = useState(initialPreferences.inspectorVisible !== false);
    const [activeToolByWorkspace, setActiveToolByWorkspace] = useState(initialPreferences.activeToolByWorkspace || {});
    const [bottomTool, setBottomTool] = useState(initialPreferences.bottomTool || 'planning-4d');
    const [bottomCollapsed, setBottomCollapsed] = useState(initialPreferences.bottomCollapsed === true);
    const [reportsViewerVisible, setReportsViewerVisible] = useState(false);
    const [leftWidth, setLeftWidth] = useState(initialPreferences.leftWidth || 220);
    const [rightWidth, setRightWidth] = useState(initialPreferences.rightWidth || 300);
    const [bottomHeight, setBottomHeight] = useState(Math.max(300, initialPreferences.bottomHeight || 320));
    const [resizeSession, setResizeSession] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const searchInputRef = useRef(null);
    const legacySupportedDesktop = useSupportedDesktop();
    const adaptiveLayout = useAdaptiveLayout({ moduleKey: 'bim' });
    const adaptiveWorkspaceRestricted = ['constrained', 'tablet-portrait'].includes(adaptiveLayout.profile);
    const supportedDesktop = adaptiveLayout.enabled ? !adaptiveWorkspaceRestricted : legacySupportedDesktop;

    useEffect(() => {
        writePreferences(projectId, {
            activeWorkspace,
            explorerVisible,
            inspectorVisible,
            activeToolByWorkspace,
            bottomTool,
            bottomCollapsed,
            leftWidth,
            rightWidth,
            bottomHeight,
        });
    }, [activeToolByWorkspace, activeWorkspace, bottomCollapsed, bottomHeight, bottomTool, explorerVisible, inspectorVisible, leftWidth, projectId, rightWidth]);

    useEffect(() => {
        if (!resizeSession) return undefined;
        const handleMove = (event) => {
            if (resizeSession.type === 'left') {
                setLeftWidth(Math.max(220, Math.min(360, resizeSession.value + event.clientX - resizeSession.pointer)));
            } else if (resizeSession.type === 'right') {
                setRightWidth(Math.max(300, Math.min(480, resizeSession.value - event.clientX + resizeSession.pointer)));
            } else {
                setBottomHeight(Math.max(260, Math.min(520, resizeSession.value - event.clientY + resizeSession.pointer)));
            }
        };
        const handleUp = () => setResizeSession(null);
        window.addEventListener('pointermove', handleMove);
        window.addEventListener('pointerup', handleUp, { once: true });
        return () => {
            window.removeEventListener('pointermove', handleMove);
            window.removeEventListener('pointerup', handleUp);
        };
    }, [resizeSession]);

    useEffect(() => {
        const handleKeyboard = (event) => {
            if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                searchInputRef.current?.focus();
                setSearchOpen(true);
                return;
            }
            if (event.altKey && /^[1-7]$/.test(event.key)) {
                event.preventDefault();
                setActiveWorkspace(WORKSPACES[Number(event.key) - 1].id);
                return;
            }
            if (event.key === 'Escape') setSearchOpen(false);
        };
        window.addEventListener('keydown', handleKeyboard);
        return () => window.removeEventListener('keydown', handleKeyboard);
    }, []);

    if (!supportedDesktop) {
        return (
            <section className="grid h-full min-h-0 place-items-center overflow-hidden border border-zinc-200 bg-zinc-100" data-bim-unsupported-resolution>
                <div className="max-w-md text-center">
                    <MonitorX className="mx-auto h-10 w-10 text-zinc-400" aria-hidden="true" />
                    <h2 className="mt-4 text-base font-semibold text-zinc-900">
                        {adaptiveLayout.enabled ? 'Espacio de trabajo no compatible' : 'Resolución no compatible'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">
                        {adaptiveLayout.enabled
                            ? 'El workspace BIM necesita más espacio útil. Gira la tablet a horizontal, cierra barras del navegador o usa una ventana más amplia.'
                            : 'El workspace BIM requiere una pantalla mínima de 1920 x 1080 para operar con seguridad.'}
                    </p>
                </div>
            </section>
        );
    }

    const isAdmin = activeWorkspace === 'admin';
    const isReports = activeWorkspace === 'reports';
    const singleSidePanel = adaptiveLayout.enabled && ['compact', 'tablet-landscape'].includes(adaptiveLayout.profile);
    const showExplorer = ready && explorerVisible && !isAdmin && !isReports;
    const availableTools = workspaceTools?.[activeWorkspace] || [];
    const selectedToolId = activeToolByWorkspace[activeWorkspace] || availableTools[0]?.id;
    const selectedTool = availableTools.find((tool) => tool.id === selectedToolId) || availableTools[0];
    const selectedBottomTool = (bottomTools || []).find((tool) => tool.id === bottomTool) || bottomTools?.[0];
    const selectedAdminToolId = activeToolByWorkspace.admin || adminTools?.[0]?.id;
    const selectedAdminTool = (adminTools || []).find((tool) => tool.id === selectedAdminToolId) || adminTools?.[0];
    const showInspector = ready && inspectorVisible && (!singleSidePanel || !showExplorer) && !isAdmin && !isReports && Boolean(selectedTool || inspector);
    const showBottomDrawer = ready && ['planning', 'production'].includes(activeWorkspace) && Boolean(selectedBottomTool);
    const gridTemplate = `${showExplorer ? `${leftWidth}px 4px ` : ''}minmax(0, 1fr)${showInspector ? ` 4px ${rightWidth}px` : ''}`;
    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es');
    const matchingSearchItems = normalizedSearch
        ? searchItems.filter((item) => `${item.label} ${item.meta || ''}`.toLocaleLowerCase('es').includes(normalizedSearch)).slice(0, 8)
        : [];

    const selectTool = (workspaceId, toolId) => {
        setActiveToolByWorkspace((current) => ({ ...current, [workspaceId]: toolId }));
    };

    const resetLayout = () => {
        setLeftWidth(220);
        setRightWidth(300);
        setBottomHeight(320);
        setExplorerVisible(true);
        setInspectorVisible(true);
        setBottomCollapsed(false);
    };

    const openSearchItem = (item) => {
        item.onSelect?.();
        if (item.workspace) setActiveWorkspace(item.workspace);
        setSearchTerm('');
        setSearchOpen(false);
    };

    return (
        <section
            className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden border border-zinc-200 bg-zinc-100 text-zinc-800"
            data-bim-workspace-v2
            data-bim-active-workspace={activeWorkspace}
            data-bim-adaptive-profile={adaptiveLayout.enabled ? adaptiveLayout.profile : 'legacy'}
            data-bim-single-side-panel={singleSidePanel ? 'true' : 'false'}
        >
            <header className="shrink-0 border-b border-zinc-200 bg-white">
                <div className="flex h-12 min-w-0 items-center gap-4 px-3">
                    <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#F39200] text-white">
                        <Box className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="grid min-w-0 flex-1 grid-cols-4 gap-4">
                        <ContextValue label="Empresa" value={companyLabel} />
                        <ContextValue label="Proyecto" value={projectLabel} />
                        <ContextValue label="Modelo" value={modelLabel} />
                        <ContextValue label="Versión" value={versionLabel} />
                    </div>
                    <div className="relative w-64 shrink-0">
                        <label className="flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 focus-within:border-[#F39200]">
                            <Search className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                            <span className="sr-only">Buscar en BIM</span>
                            <input
                                ref={searchInputRef}
                                type="search"
                                value={searchTerm}
                                onFocus={() => setSearchOpen(true)}
                                onChange={(event) => {
                                    setSearchTerm(event.target.value);
                                    setSearchOpen(true);
                                }}
                                placeholder="Elemento, GUID, actividad o modelo"
                                className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-400"
                            />
                            <kbd className="text-[9px] font-semibold text-zinc-400">Ctrl K</kbd>
                        </label>
                        {searchOpen && normalizedSearch ? (
                            <div className="absolute right-0 top-10 z-50 w-96 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-xl" role="listbox" aria-label="Resultados BIM">
                                {matchingSearchItems.length ? matchingSearchItems.map((item) => (
                                    <button
                                        key={item.id}
                                        type="button"
                                        onMouseDown={(event) => event.preventDefault()}
                                        onClick={() => openSearchItem(item)}
                                        className="flex min-h-11 w-full items-center justify-between gap-3 border-b border-zinc-100 px-3 text-left last:border-b-0 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F39200]"
                                        role="option"
                                    >
                                        <span className="min-w-0">
                                            <span className="block truncate text-xs font-semibold text-zinc-900">{item.label}</span>
                                            <span className="block truncate text-[10px] text-zinc-500">{item.meta}</span>
                                        </span>
                                        <span className="shrink-0 text-[10px] font-semibold uppercase text-zinc-400">{item.type}</span>
                                    </button>
                                )) : <p className="px-3 py-4 text-xs text-zinc-500">No hay coincidencias en el proyecto BIM.</p>}
                            </div>
                        ) : null}
                    </div>
                    {canAdminister ? (
                        <button type="button" onClick={() => { setActiveWorkspace('admin'); selectTool('admin', 'imports'); }} className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md bg-[#F39200] px-3 text-xs font-semibold text-white transition-colors hover:bg-[#d87f00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200" title="Cargar y revisar modelos IFC">
                            <Upload className="h-4 w-4" aria-hidden="true" />
                            Cargar modelo IFC
                        </button>
                    ) : null}
                    {canAdminister ? (
                        <button
                            type="button"
                            onClick={() => setActiveWorkspace((current) => (current === 'admin' ? 'viewer' : 'admin'))}
                            className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-md border bg-white px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 ${isAdmin ? 'border-[#F39200] text-[#F39200]' : 'border-zinc-200 text-zinc-600 hover:border-[#F39200] hover:text-[#F39200]'}`}
                            title="Administración BIM"
                            aria-label="Abrir administración BIM"
                            aria-pressed={isAdmin}
                        >
                            {isAdmin ? <X className="h-4 w-4" aria-hidden="true" /> : <Settings className="h-4 w-4" aria-hidden="true" />}
                            {isAdmin ? 'Cerrar administración' : 'Administrar BIM'}
                        </button>
                    ) : null}
                </div>

                <div className="flex h-11 min-w-0 items-center justify-between gap-3 border-t border-zinc-100 px-3">
                    <nav className="flex h-full min-w-0 items-stretch" aria-label="Espacios de trabajo BIM">
                        {WORKSPACES.map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => setActiveWorkspace(id)}
                                className={`relative inline-flex h-full items-center gap-2 px-3 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F39200] ${
                                    activeWorkspace === id ? 'text-zinc-950' : 'text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900'
                                }`}
                                aria-current={activeWorkspace === id ? 'page' : undefined}
                            >
                                <Icon className={`h-4 w-4 ${activeWorkspace === id ? 'text-[#F39200]' : ''}`} aria-hidden="true" />
                                {label}
                                {activeWorkspace === id ? <span className="absolute inset-x-2 bottom-0 h-0.5 bg-[#F39200]" /> : null}
                            </button>
                        ))}
                    </nav>

                    <div className={`flex shrink-0 items-center gap-1 ${isAdmin ? 'invisible' : ''}`}>
                        <div className="flex h-9 items-center rounded-md border border-zinc-200 bg-zinc-50 p-0.5" role="group" aria-label="Modo del visor">
                            <button
                                type="button"
                                onClick={() => onChangeViewerMode('fragments')}
                                className={`h-8 rounded px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] ${viewerMode === 'fragments' ? 'bg-white text-[#F39200] shadow-sm' : 'text-zinc-500'}`}
                                aria-pressed={viewerMode === 'fragments'}
                            >
                                3D
                            </button>
                            <button
                                type="button"
                                onClick={() => onChangeViewerMode('plan')}
                                className={`h-8 rounded px-2 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] ${viewerMode === 'plan' ? 'bg-white text-[#F39200] shadow-sm' : 'text-zinc-500'}`}
                                aria-pressed={viewerMode === 'plan'}
                            >
                                2D
                            </button>
                            <button type="button" disabled className="h-8 rounded px-2 text-xs font-semibold text-zinc-300" title="Disponible cuando exista un plano mapeado">
                                Dividida
                            </button>
                        </div>
                        <button type="button" onClick={() => { setExplorerVisible(!showExplorer); if (singleSidePanel && !showExplorer) setInspectorVisible(false); }} disabled={isReports} className={iconButtonClass} title="Mostrar u ocultar explorador" aria-label="Mostrar u ocultar explorador" aria-pressed={showExplorer}>
                            <PanelLeft className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={() => { setInspectorVisible(!showInspector); if (singleSidePanel && !showInspector) setExplorerVisible(false); }} className={iconButtonClass} title="Mostrar u ocultar panel contextual" aria-label="Mostrar u ocultar panel contextual" aria-pressed={showInspector}>
                            <PanelRight className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={onResetContext} className={iconButtonClass} title="Restablecer contexto" aria-label="Restablecer contexto">
                            <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={resetLayout} className={iconButtonClass} title="Restablecer layout" aria-label="Restablecer layout">
                            <Layers3 className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button type="button" onClick={onRefresh} disabled={loading} className={iconButtonClass} title="Actualizar BIM" aria-label="Actualizar BIM">
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </header>

            {isAdmin ? (
                <div className="flex h-10 shrink-0 items-center gap-1 border-b border-zinc-200 bg-white px-3" role="tablist" aria-label="Administración BIM">
                    <span className="mr-3 text-xs font-semibold text-zinc-900">Modelos y configuración BIM</span>
                    {(adminTools || []).map((tool) => (
                        <button
                            key={tool.id}
                            type="button"
                            onClick={() => selectTool('admin', tool.id)}
                            className={`h-8 rounded-md px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] ${selectedAdminTool?.id === tool.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                            role="tab"
                            aria-selected={selectedAdminTool?.id === tool.id}
                        >
                            {tool.label}
                        </button>
                    ))}
                </div>
            ) : availableTools.length > 0 && !isReports ? (
                <div className="flex h-10 shrink-0 items-center gap-1 overflow-x-auto border-b border-zinc-200 bg-white px-3" role="tablist" aria-label={`Herramientas de ${activeWorkspace}`}>
                    {availableTools.map((tool) => (
                        <button
                            key={tool.id}
                            type="button"
                            onClick={() => selectTool(activeWorkspace, tool.id)}
                            className={`h-8 shrink-0 rounded-md px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] ${selectedTool?.id === tool.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900'}`}
                            role="tab"
                            aria-selected={selectedTool?.id === tool.id}
                        >
                            {tool.label}
                        </button>
                    ))}
                </div>
            ) : null}

            {isAdmin ? (
                <main className="min-h-0 min-w-0 flex-1 overflow-auto p-2 custom-scrollbar" data-bim-admin-region>
                    {selectedAdminTool?.content}
                </main>
            ) : isReports ? (
                <main className="relative grid min-h-0 min-w-0 flex-1 gap-2 overflow-hidden p-2" style={{ gridTemplateColumns: reportsViewerVisible ? 'minmax(0, 1fr) 34%' : 'minmax(0, 1fr)' }} data-bim-reports-region>
                    <BimRegionBoundary resetKey="reports"><div className="min-h-0 min-w-0 overflow-auto custom-scrollbar">{reports}</div></BimRegionBoundary>
                    {reportsViewerVisible ? <BimRegionBoundary resetKey="reports-viewer"><div className="min-h-0 min-w-0 overflow-hidden">{viewer}</div></BimRegionBoundary> : null}
                    <button
                        type="button"
                        onClick={() => setReportsViewerVisible((current) => !current)}
                        className="absolute bottom-4 right-4 inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 shadow-sm hover:border-[#F39200] hover:text-[#F39200] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200]"
                    >
                        {reportsViewerVisible ? 'Ocultar vista 3D' : 'Vista 3D'}
                    </button>
                </main>
            ) : (
                <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                    <div
                        className="grid min-h-0 min-w-0 flex-1 gap-2 overflow-hidden p-2"
                        style={{ gridTemplateColumns: gridTemplate }}
                        data-bim-shell-layout
                    >
                        {showExplorer ? <BimRegionBoundary resetKey={`explorer-${projectId}`}><aside className="min-h-0 min-w-0 overflow-hidden">{explorer}</aside></BimRegionBoundary> : null}
                        {showExplorer ? <div className="cursor-col-resize bg-zinc-200 hover:bg-[#F39200]" onPointerDown={(event) => setResizeSession({ type: 'left', pointer: event.clientX, value: leftWidth })} role="separator" aria-label="Redimensionar explorador" aria-orientation="vertical" /> : null}
                        <main className="flex min-h-0 min-w-0 flex-col overflow-hidden" data-bim-viewer-region>
                            {!ready ? (
                                <div className="grid h-full min-h-0 place-items-center border border-zinc-200 bg-white p-8" data-bim-empty-state>
                                    <div className="w-full max-w-2xl text-center">
                                        <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-[#F39200]">
                                            {loading ? <RefreshCw className="h-6 w-6 animate-spin motion-reduce:animate-none" aria-hidden="true" /> : <Box className="h-6 w-6" aria-hidden="true" />}
                                        </span>
                                        <h2 className="mt-4 text-base font-semibold text-zinc-900">{loading ? 'Preparando el modelo BIM' : 'Carga el primer modelo BIM del proyecto'}</h2>
                                        <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-zinc-600">{errorMessage || 'Selecciona un archivo IFC para procesar su geometría, propiedades y estructura espacial en este proyecto.'}</p>
                                        {canAdminister && !loading ? <button type="button" onClick={() => { setActiveWorkspace('admin'); selectTool('admin', 'imports'); }} className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-[#F39200] px-4 text-sm font-semibold text-white hover:bg-[#d87f00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200"><Upload className="h-4 w-4" aria-hidden="true" />Cargar modelo IFC</button> : null}
                                        {!canAdminister && !loading ? <div className="mx-auto mt-5 max-w-lg border border-amber-200 bg-amber-50 px-4 py-3 text-left"><p className="text-xs font-semibold text-amber-900">Tu acceso BIM es de consulta o colaboración.</p><p className="mt-1 text-xs leading-5 text-amber-800">El administrador de tu empresa debe cargar el primer modelo IFC de este proyecto.</p></div> : null}
                                        {!loading ? <div className="mt-8 grid grid-cols-3 divide-x divide-zinc-200 border-y border-zinc-200 py-4 text-left"><div className="px-4"><strong className="block text-xs text-zinc-800">1. Selecciona</strong><span className="mt-1 block text-[11px] leading-4 text-zinc-500">Archivo IFC, nombre, versión y disciplina.</span></div><div className="px-4"><strong className="block text-xs text-zinc-800">2. Procesa</strong><span className="mt-1 block text-[11px] leading-4 text-zinc-500">GiProy valida y prepara el modelo.</span></div><div className="px-4"><strong className="block text-xs text-zinc-800">3. Revisa</strong><span className="mt-1 block text-[11px] leading-4 text-zinc-500">El visor activa geometría y propiedades.</span></div></div> : null}
                                    </div>
                                </div>
                            ) : (
                                <BimRegionBoundary resetKey={`viewer-${projectId}-${viewerMode}`}>
                                    <div className="flex h-full min-h-0 flex-col [&>section]:flex-1">{viewer}</div>
                                </BimRegionBoundary>
                            )}
                        </main>
                        {showInspector ? <div className="cursor-col-resize bg-zinc-200 hover:bg-[#F39200]" onPointerDown={(event) => setResizeSession({ type: 'right', pointer: event.clientX, value: rightWidth })} role="separator" aria-label="Redimensionar panel contextual" aria-orientation="vertical" /> : null}
                        {showInspector ? <BimRegionBoundary resetKey={`${activeWorkspace}-${selectedTool?.id}`}><aside className="min-h-0 min-w-0 overflow-auto custom-scrollbar">{selectedTool?.content || inspector}</aside></BimRegionBoundary> : null}
                    </div>

                    {showBottomDrawer ? (
                        <section className="relative shrink-0 border-t border-zinc-300 bg-white" style={{ height: bottomCollapsed ? 40 : bottomHeight }} data-bim-bottom-drawer>
                            {!bottomCollapsed ? <div className="absolute inset-x-0 top-0 z-10 h-1 cursor-row-resize hover:bg-[#F39200]" onPointerDown={(event) => setResizeSession({ type: 'bottom', pointer: event.clientY, value: bottomHeight })} role="separator" aria-label="Redimensionar panel temporal" aria-orientation="horizontal" /> : null}
                            <div className="flex h-10 items-center justify-between border-b border-zinc-200 px-3">
                                <div className="flex items-center gap-1" role="tablist" aria-label="Planificación temporal">
                                    {(bottomTools || []).map((tool) => (
                                        <button
                                            key={tool.id}
                                            type="button"
                                            onClick={() => {
                                                setBottomTool(tool.id);
                                                setBottomCollapsed(false);
                                            }}
                                            className={`h-8 rounded-md px-3 text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] ${selectedBottomTool?.id === tool.id ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-100'}`}
                                            role="tab"
                                            aria-selected={selectedBottomTool?.id === tool.id}
                                        >
                                            {tool.label}
                                        </button>
                                    ))}
                                </div>
                                <button type="button" onClick={() => setBottomCollapsed((current) => !current)} className={iconButtonClass} title={bottomCollapsed ? 'Expandir panel temporal' : 'Minimizar panel temporal'} aria-label={bottomCollapsed ? 'Expandir panel temporal' : 'Minimizar panel temporal'}>
                                    <Layers3 className="h-4 w-4" aria-hidden="true" />
                                </button>
                            </div>
                            {!bottomCollapsed ? <BimRegionBoundary resetKey={`bottom-${selectedBottomTool?.id}`}><div className="h-[calc(100%-2.5rem)] min-h-0 overflow-hidden p-2 [&>section]:h-full">{selectedBottomTool?.content}</div></BimRegionBoundary> : null}
                        </section>
                    ) : null}
                </div>
            )}
        </section>
    );
};

export default BimWorkspaceV2;
