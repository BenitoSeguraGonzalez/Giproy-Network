import React from 'react';
import {
    Box,
    Building2,
    Layers3,
    PanelLeft,
    PanelRight,
    RefreshCw,
    RotateCcw,
} from 'lucide-react';

const iconButtonClass =
    'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40';

const ContextValue = ({ label, value }) => (
    <div className="min-w-0">
        <span className="block text-[10px] font-bold uppercase text-zinc-400">{label}</span>
        <span className="block truncate text-xs font-semibold text-zinc-800" title={value || undefined}>
            {value || 'Sin asignar'}
        </span>
    </div>
);

const BimShellContextBar = ({
    companyLabel,
    projectLabel,
    modelLabel,
    versionLabel,
    viewerMode,
    explorerVisible,
    inspectorVisible,
    loading,
    onChangeViewerMode,
    onToggleExplorer,
    onToggleInspector,
    onReset,
    onRefresh,
}) => (
    <header
        className="border-b border-zinc-200 bg-white"
        data-bim-shell-context
        data-viewer-mode={viewerMode}
    >
        <div className="flex min-h-14 min-w-0 flex-wrap items-center gap-x-5 gap-y-2 px-3 py-2 sm:px-4">
            <div className="flex w-full min-w-0 basis-full items-center gap-3 lg:w-auto lg:basis-auto lg:flex-1">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F39200] text-white">
                    <Building2 className="h-4 w-4" aria-hidden="true" />
                </span>
                <div className="grid min-w-0 flex-1 grid-cols-2 gap-x-4 gap-y-1 md:grid-cols-4">
                    <ContextValue label="Empresa" value={companyLabel} />
                    <ContextValue label="Proyecto" value={projectLabel} />
                    <ContextValue label="Modelo" value={modelLabel} />
                    <ContextValue label="Version" value={versionLabel} />
                </div>
            </div>

            <nav className="ml-auto flex shrink-0 items-center gap-1" aria-label="Herramientas del visor BIM">
                <div className="flex h-9 items-center rounded-lg border border-zinc-200 bg-zinc-50 p-0.5" role="group" aria-label="Modo del visor">
                    <button
                        type="button"
                        onClick={() => onChangeViewerMode('fragments')}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] ${
                            viewerMode === 'fragments' ? 'bg-white text-[#F39200] shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                        title="Visor 3D Fragments"
                        aria-label="Mostrar visor 3D Fragments"
                        aria-pressed={viewerMode === 'fragments'}
                    >
                        <Box className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        onClick={() => onChangeViewerMode('plan')}
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] ${
                            viewerMode === 'plan' ? 'bg-white text-[#F39200] shadow-sm' : 'text-zinc-500 hover:text-zinc-900'
                        }`}
                        title="Plano BIM 2D"
                        aria-label="Mostrar plano BIM 2D"
                        aria-pressed={viewerMode === 'plan'}
                    >
                        <Layers3 className="h-4 w-4" aria-hidden="true" />
                    </button>
                </div>
                <button
                    type="button"
                    onClick={onToggleExplorer}
                    className={iconButtonClass}
                    title="Mostrar u ocultar explorer BIM"
                    aria-label="Mostrar u ocultar explorer BIM"
                    aria-pressed={explorerVisible}
                >
                    <PanelLeft className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={onToggleInspector}
                    className={iconButtonClass}
                    title="Mostrar u ocultar inspector BIM"
                    aria-label="Mostrar u ocultar inspector BIM"
                    aria-pressed={inspectorVisible}
                >
                    <PanelRight className="h-4 w-4" aria-hidden="true" />
                </button>
                <button type="button" onClick={onReset} className={iconButtonClass} title="Restablecer contexto BIM" aria-label="Restablecer contexto BIM">
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                    type="button"
                    onClick={onRefresh}
                    disabled={loading}
                    className={iconButtonClass}
                    title="Actualizar workspace BIM"
                    aria-label="Actualizar workspace BIM"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} aria-hidden="true" />
                </button>
            </nav>
        </div>
    </header>
);

export default BimShellContextBar;
