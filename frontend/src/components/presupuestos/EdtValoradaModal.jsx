import { useContext, useEffect, useMemo, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { usePresupuestoData, usePresupuestoSelection } from '../../context/PresupuestoContext';
import { edtApi } from '../../api/edt';
import { AppModalShell, AppModalHeader, AppModalBody, AppModalFooter } from '../ui/app-modal';
import { Folders, ChevronDown, ChevronRight, ListTree, ArrowRight, FileSpreadsheet } from 'lucide-react';
import { LiquidButton } from '../ui/liquid-button';
import reportingApi from '../../api/reporting';
import { extractBlobErrorMessage } from '../../utils/apiBlobErrors';
import { appAlert } from '../../utils/appDialog';
import CommonReportPreviewModal from '../reporting/CommonReportPreviewModal';
import ReportGenerationModal from '../reporting/ReportGenerationModal';
import { buildReportFileName, sanitizeReportContext } from '../../utils/reportFileName';
import { downloadBlobResponse } from '../../utils/blobDownload';
import { roundDecimal } from '../../utils/math';
import {
    divideDecimalNumber,
    roundDecimalNumber,
    sumDecimalNumber,
    toDecimalNumber,
} from '../../utils/decimalNumbers';
import { useFormatters } from '../../hooks/useFormatters';
import { sumBudgetOperationalSubtotals } from '../../utils/operationalNumbers';
import {
    PORTABLE_WORKSPACE_EVENT,
    readPortableWorkspaceOverride,
    resolvePortableWorkspace,
} from '../../utils/portableWorkspace';

const formatCurrency = (value) => `$${toDecimalNumber(value || 0, '0').toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const formatPercent = (value) => `${roundDecimalNumber(value || 0, 2).toFixed(2)}%`;

const roundCascade = (value, decimals = 2) => roundDecimalNumber(value || 0, decimals);

const buildNodeMetrics = ({ tree, lineas, tanteoSession, indirectosPorcentaje, moneyDecimals }) => {
    const lineasByEdt = lineas.reduce((acc, linea) => {
        const key = linea.edt_id;
        if (!acc[key]) {
            acc[key] = [];
        }
        acc[key].push(linea);
        return acc;
    }, {});

    const walk = (node) => {
        const ownDirecto = sumBudgetOperationalSubtotals(
            lineasByEdt[node.id] || [],
            { moneyDecimals, tanteoSession }
        );

        const children = (node.hijos || [])
            .filter((child) => child.tipo_nodo === 'CUENTA_PAQUETE')
            .map(walk);

        const directChildren = sumDecimalNumber(children.map((child) => child.metrics.directo), { decimals: moneyDecimals });
        const directo = roundCascade(sumDecimalNumber([ownDirecto, directChildren], { decimals: moneyDecimals }), moneyDecimals);
        const valorado = roundCascade(
            directo * sumDecimalNumber([1, divideDecimalNumber(indirectosPorcentaje || 0, 100, { decimals: 6 })], { decimals: 6 }),
            moneyDecimals
        );

        return {
            ...node,
            hijos: children,
            metrics: {
                ownDirecto,
                directo,
                valorado,
            }
        };
    };

    return tree
        .filter((node) => node.tipo_nodo === 'CUENTA_PAQUETE')
        .map(walk);
};

const findNodeById = (nodes, targetId) => {
    for (const node of nodes) {
        if (node.id === targetId) {
            return node;
        }
        const child = findNodeById(node.hijos || [], targetId);
        if (child) {
            return child;
        }
    }
    return null;
};

const collectExpandableIds = (nodes, result = new Set()) => {
    nodes.forEach((node) => {
        if ((node.hijos || []).length > 0) {
            result.add(node.id);
            collectExpandableIds(node.hijos, result);
        }
    });
    return result;
};

const ValuedNodeRow = ({
    node,
    level = 0,
    totalValorado,
    selectedNodeId,
    onSelectNode,
    expandedNodes,
    onToggleNode,
    onNavigate,
    compact = false,
}) => {
    const hasChildren = (node.hijos || []).length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const isSelected = selectedNodeId === node.id;
    const percent = totalValorado > 0 ? (node.metrics.valorado / totalValorado) * 100 : 0;

    return (
        <div className="relative group/node w-full">
            <div
                onClick={() => onSelectNode(node.id)}
                onDoubleClick={() => onNavigate(node.id)}
                className={`relative z-10 flex items-center gap-3 py-2.5 px-3 border-b border-r cursor-pointer transition-all ${
                    isSelected
                        ? 'bg-blue-600/10 border-blue-300 ring-1 ring-blue-500/20 shadow-sm'
                        : 'bg-white hover:bg-blue-50/40 border-b-slate-100'
                } border-l-4 ${isSelected ? 'border-l-blue-600' : 'border-l-blue-400'}`}
                style={{ paddingLeft: `${(level * 1.5) + 1}rem` }}
            >
                <div className="flex items-center w-6 shrink-0">
                    {hasChildren ? (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onToggleNode(node.id);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-slate-800 hover:bg-slate-200 transition-colors"
                        >
                            {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                        </button>
                    ) : (
                        <div className="w-6" />
                    )}
                </div>

                {compact ? (
                    <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <div className={`text-[10px] font-mono font-black tracking-wider ${isSelected ? 'text-blue-700' : 'text-blue-600'}`}>
                                    {node.codigo}
                                </div>
                                <div className="mt-1 flex items-center gap-2 min-w-0">
                                    <Folders className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : 'text-blue-500'}`} />
                                    <span className={`font-bold uppercase tracking-tight text-[11px] leading-tight ${isSelected ? 'text-blue-900' : 'text-zinc-800'}`}>
                                        {node.nombre}
                                    </span>
                                </div>
                            </div>
                            <div className={`text-xs font-black tabular-nums shrink-0 ${isSelected ? 'text-blue-900' : 'text-zinc-900'}`}>
                                {formatCurrency(node.metrics.valorado)}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                            <span>Directo {formatCurrency(node.metrics.directo)}</span>
                            <span className="text-center">Valorado {formatCurrency(node.metrics.valorado)}</span>
                            <span className="text-right">% {formatPercent(percent)}</span>
                        </div>
                    </div>
                ) : (
                    <>
                        <span className={`w-[80px] shrink-0 text-xs font-mono font-black tracking-wider ${isSelected ? 'text-blue-700' : 'text-blue-600'}`}>
                            {node.codigo}
                        </span>

                        <div className="flex items-center gap-2 flex-1 min-w-0">
                            <Folders className={`w-4 h-4 ${isSelected ? 'text-blue-600' : 'text-blue-500'}`} />
                            <span className={`font-bold truncate uppercase tracking-tight text-[11px] ${isSelected ? 'text-blue-900' : 'text-zinc-800'}`}>
                                {node.nombre}
                            </span>
                        </div>

                        <div className="w-[120px] text-right text-xs font-black tabular-nums text-zinc-500 shrink-0">
                            {formatCurrency(node.metrics.directo)}
                        </div>
                        <div className={`w-[130px] text-right text-xs font-black tabular-nums shrink-0 ${isSelected ? 'text-blue-900' : 'text-zinc-900'}`}>
                            {formatCurrency(node.metrics.valorado)}
                        </div>
                        <div className="w-[80px] text-right text-[10px] font-black uppercase tracking-widest text-zinc-500 shrink-0">
                            {formatPercent(percent)}
                        </div>
                    </>
                )}
            </div>

            {hasChildren && isExpanded && (
                <div className="relative">
                    <div
                        className="absolute w-[2px] bg-zinc-200/60 z-0 border-l border-dashed border-zinc-300"
                        style={{ left: `${(level * 1.5) + 2.5}rem`, top: 0, bottom: 0 }}
                    />
                    {node.hijos.map((child) => (
                        <ValuedNodeRow
                            key={child.id}
                            node={child}
                            level={level + 1}
                            totalValorado={totalValorado}
                            selectedNodeId={selectedNodeId}
                            onSelectNode={onSelectNode}
                            expandedNodes={expandedNodes}
                            onToggleNode={onToggleNode}
                            onNavigate={onNavigate}
                            compact={compact}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const EdtValoradaModal = ({ isOpen, onClose, onNavigateToNode }) => {
    const { selectedEmpresa, user } = useContext(AuthContext);
    const formatters = useFormatters();
    const moneyDecimals = formatters?.precisionMoneda ?? 2;
    const { activeProyecto, activePresupuesto, tanteoSession, config } = usePresupuestoData();
    const { selectedNodeId, setSelectedNodeId } = usePresupuestoSelection();

    const currentEmpresaId = selectedEmpresa?.id || user?.empresa_id || null;
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(false);
    const [expandedNodes, setExpandedNodes] = useState(new Set());
    const [forcedPortableWorkspace, setForcedPortableWorkspace] = useState(() => readPortableWorkspaceOverride());
    const [viewport, setViewport] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    }));

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const syncViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        const syncPortableOverride = () => setForcedPortableWorkspace(readPortableWorkspaceOverride());
        syncViewport();
        syncPortableOverride();
        window.addEventListener('resize', syncViewport);
        window.addEventListener('storage', syncPortableOverride);
        window.addEventListener(PORTABLE_WORKSPACE_EVENT, syncPortableOverride);
        return () => {
            window.removeEventListener('resize', syncViewport);
            window.removeEventListener('storage', syncPortableOverride);
            window.removeEventListener(PORTABLE_WORKSPACE_EVENT, syncPortableOverride);
        };
    }, []);

    const isCompactViewport = resolvePortableWorkspace({
        moduleKey: 'presupuesto',
        width: viewport.width,
        height: viewport.height,
        forced: user?.role === 'superadmin' && forcedPortableWorkspace,
    });

    useEffect(() => {
        const loadTree = async () => {
            if (!isOpen || !activeProyecto?.id) {
                return;
            }
            try {
                setLoading(true);
                const data = await edtApi.getTree(activeProyecto.id, currentEmpresaId);
                setTree(data);
                setExpandedNodes(collectExpandableIds(data));
            } catch (error) {
                globalThis.reportClientError?.('Error cargando EDT valorada:', error);
                setTree([]);
            } finally {
                setLoading(false);
            }
        };

        loadTree();
    }, [isOpen, activeProyecto?.id, currentEmpresaId]);

    const valuedTree = useMemo(() => buildNodeMetrics({
        tree,
        lineas: activePresupuesto?.detalle || [],
        tanteoSession,
        indirectosPorcentaje: config.indirectos_porcentaje,
        moneyDecimals,
    }), [tree, activePresupuesto?.detalle, tanteoSession, config.indirectos_porcentaje, moneyDecimals]);

    const totalDirecto = useMemo(
        () => roundCascade(valuedTree.reduce((acc, node) => acc + node.metrics.directo, 0), moneyDecimals),
        [valuedTree, moneyDecimals]
    );
    const totalValorado = useMemo(
        () => roundCascade(valuedTree.reduce((acc, node) => acc + node.metrics.valorado, 0), moneyDecimals),
        [valuedTree, moneyDecimals]
    );
    const selectedNode = useMemo(
        () => findNodeById(valuedTree, selectedNodeId) || valuedTree[0] || null,
        [valuedTree, selectedNodeId]
    );

    useEffect(() => {
        if (selectedNode && selectedNodeId !== selectedNode.id) {
            setSelectedNodeId(selectedNode.id);
        }
    }, [selectedNode, selectedNodeId, setSelectedNodeId]);

    const [generatingReport, setGeneratingReport] = useState(null);
    const [reportPreview, setReportPreview] = useState(null);
    const [showReportPreview, setShowReportPreview] = useState(false);

    if (!isOpen) {
        return null;
    }

    const handleToggleNode = (nodeId) => {
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                next.delete(nodeId);
            } else {
                next.add(nodeId);
            }
            return next;
        });
    };

    const handleNavigate = (nodeId = selectedNode?.id) => {
        if (!nodeId) {
            return;
        }
        setSelectedNodeId(nodeId);
        onNavigateToNode?.(nodeId);
        onClose();
    };

    const handleDownloadEdtReport = async (type) => {
        if (!activeProyecto?.id) return;
        try {
            setGeneratingReport(type);
            const response = await reportingApi.previewReport({
                report_type: 'edt',
                entity_ids: [activeProyecto.id],
                variant: type
            });
            setReportPreview(response.data);
            setShowReportPreview(true);
        } catch (error) {
            globalThis.reportClientError?.(`Error al generar reporte EDT ${type}:`, error);
            appAlert(`Error al generar el reporte EDT ${type}.`);
        } finally {
            setGeneratingReport(null);
        }
    };

    const handleExportReportExcel = async () => {
        if (!activeProyecto?.id || !reportPreview) return;
        try {
            setGeneratingReport(reportPreview.variant || 'listado');
            const response = await reportingApi.exportReport({
                report_type: 'edt',
                entity_ids: [activeProyecto.id],
                variant: reportPreview.variant || 'listado',
                format: 'xlsx'
            });
            downloadBlobResponse(response, buildReportFileName({
                reportLabel: `EDT ${String(reportPreview.variant || 'listado').toUpperCase()}`,
                contextLabel: sanitizeReportContext(activeProyecto?.nombre || `Proyecto ${activeProyecto?.id}`),
                revision: activeProyecto?.revision ?? 1,
                extension: 'xlsx',
            }));
        } catch (error) {
            globalThis.reportClientError?.("Error al exportar EDT:", error);
            appAlert(await extractBlobErrorMessage(error, "Error al exportar el reporte EDT."));
        } finally {
            setGeneratingReport(null);
        }
    };

    const handleExportReportPdf = async () => {
        if (!activeProyecto?.id || !reportPreview) return;
        try {
            setGeneratingReport(reportPreview.variant || 'listado');
            const response = await reportingApi.exportReport({
                report_type: 'edt',
                entity_ids: [activeProyecto.id],
                variant: reportPreview.variant || 'listado',
                format: 'pdf'
            });
            downloadBlobResponse(response, buildReportFileName({
                reportLabel: `EDT ${String(reportPreview.variant || 'listado').toUpperCase()}`,
                contextLabel: sanitizeReportContext(activeProyecto?.nombre || `Proyecto ${activeProyecto?.id}`),
                revision: activeProyecto?.revision ?? 1,
                extension: 'pdf',
            }), 'application/pdf');
        } catch (error) {
            globalThis.reportClientError?.("Error al exportar EDT PDF:", error);
            appAlert(await extractBlobErrorMessage(error, "Error al exportar el reporte EDT en PDF."));
        } finally {
            setGeneratingReport(null);
        }
    };

    const handleExportReportPdfFromExcel = async () => {
        if (!activeProyecto?.id || !reportPreview) return;
        try {
            setGeneratingReport(reportPreview.variant || 'listado');
            const response = await reportingApi.exportReport({
                report_type: 'edt',
                entity_ids: [activeProyecto.id],
                variant: reportPreview.variant || 'listado',
                format: 'pdf_excel'
            });
            downloadBlobResponse(response, buildReportFileName({
                reportLabel: `EDT ${String(reportPreview.variant || 'listado').toUpperCase()}`,
                contextLabel: sanitizeReportContext(activeProyecto?.nombre || `Proyecto ${activeProyecto?.id}`),
                revision: activeProyecto?.revision ?? 1,
                extension: 'pdf',
            }), 'application/pdf');
        } catch (error) {
            globalThis.reportClientError?.("Error al exportar EDT PDF desde Excel:", error);
            appAlert(await extractBlobErrorMessage(error, "Error al exportar el reporte EDT como PDF desde Excel."));
        } finally {
            setGeneratingReport(null);
        }
    };

    return (
        <>
        <AppModalShell
            size="2xl"
            zIndex="z-[150]"
            overlayClassName={isCompactViewport ? 'p-2' : ''}
            panelClassName={isCompactViewport ? 'min-h-[92dvh] max-h-[96dvh] flex flex-col rounded-[1.35rem]' : 'min-h-[75dvh] max-h-[88dvh] flex flex-col'}
        >
            <AppModalHeader
                title="EDT Valorada"
                subtitle="Árbol económico sincronizado con la EDT del proyecto y el presupuesto activo."
                icon={ListTree}
                iconClassName="text-[#136191]"
                iconWrapClassName="border-blue-200 bg-blue-50"
                onClose={onClose}
            />

            <AppModalBody className="flex-1 overflow-hidden p-0">
                <div className={isCompactViewport ? 'grid grid-cols-1 h-full' : 'grid grid-cols-[minmax(0,1fr)_320px] h-full'}>
                    <div className={isCompactViewport ? 'flex flex-col min-h-0' : 'flex flex-col border-r border-zinc-200 min-h-0'}>
                        <div className={isCompactViewport ? 'px-4 py-3 border-b border-zinc-200 bg-white' : 'px-6 py-4 border-b border-zinc-200 bg-white'}>
                            <div className={isCompactViewport ? 'grid grid-cols-1 sm:grid-cols-3 gap-3' : 'grid grid-cols-3 gap-3'}>
                                <div className="rounded-2xl border border-zinc-200 bg-[#F8F9FB] px-4 py-3">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Indirectos Operativos</div>
                                    <div className="mt-2 text-xl font-black tracking-tight text-[#F39200]">{formatPercent(config.indirectos_porcentaje)}</div>
                                </div>
                                <div className="rounded-2xl border border-zinc-200 bg-[#F8F9FB] px-4 py-3">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Total Directo EDT</div>
                                    <div className="mt-2 text-xl font-black tracking-tight text-zinc-900">{formatCurrency(totalDirecto)}</div>
                                </div>
                                <div className="rounded-2xl border border-zinc-200 bg-[#F8F9FB] px-4 py-3">
                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Total Valorado</div>
                                    <div className="mt-2 text-xl font-black tracking-tight text-[#136191]">{formatCurrency(totalValorado)}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-white">
                            {loading ? (
                                <div className="py-20 text-center flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-4 border-zinc-100 border-t-[#136191] rounded-full animate-spin" />
                                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Cargando EDT valorada...</p>
                                </div>
                            ) : valuedTree.length === 0 ? (
                                <div className="py-20 px-8 text-center flex flex-col items-center gap-4">
                                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                                        <ListTree className="w-8 h-8 text-[#136191] opacity-50" />
                                    </div>
                                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mt-2">No hay EDT valorable</p>
                                    <p className="text-sm text-zinc-500 max-w-md">
                                        Esta vista necesita una EDT con capítulos y líneas de presupuesto asociadas para calcular el valor por rama.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {isCompactViewport ? (
                                        <div className="sticky top-0 z-20 py-2.5 px-4 bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                                            Árbol valorizado
                                        </div>
                                    ) : (
                                        <div className="sticky top-0 z-20 flex items-center gap-3 py-3 px-3 bg-slate-50 border-b border-slate-200 text-xs font-black uppercase tracking-wider text-slate-500">
                                            <div className="w-6 shrink-0" />
                                            <div className="w-[80px]">Código</div>
                                            <div className="flex-1">Estructura valorizada</div>
                                            <div className="w-[120px] text-right">Directo</div>
                                            <div className="w-[130px] text-right text-[#136191]">Valorado</div>
                                            <div className="w-[80px] text-right">% Total</div>
                                        </div>
                                    )}
                                    <div className="flex flex-col">
                                        {valuedTree.map((node) => (
                                            <ValuedNodeRow
                                                key={node.id}
                                                node={node}
                                                totalValorado={totalValorado}
                                                selectedNodeId={selectedNode?.id}
                                                onSelectNode={setSelectedNodeId}
                                                expandedNodes={expandedNodes}
                                                onToggleNode={handleToggleNode}
                                                onNavigate={handleNavigate}
                                                compact={isCompactViewport}
                                            />
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <aside className={isCompactViewport ? 'bg-[#F8F9FB] flex flex-col min-h-0 border-t border-zinc-200' : 'bg-[#F8F9FB] flex flex-col min-h-0'}>
                        <div className={isCompactViewport ? 'px-4 py-3 border-b border-zinc-200' : 'px-6 py-5 border-b border-zinc-200'}>
                            <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Contexto activo</div>
                            <div className="mt-3 text-lg font-black tracking-tight text-zinc-900">
                                {selectedNode?.codigo ? `${selectedNode.codigo} · ${selectedNode.nombre}` : 'Sin capítulo seleccionado'}
                            </div>
                            <div className="mt-2 text-[11px] font-medium text-zinc-500">
                                Doble clic sobre una rama para abrirla en el editor de presupuesto.
                            </div>
                        </div>

                        <div className={isCompactViewport ? 'flex-1 min-h-0 overflow-y-auto custom-scrollbar px-4 py-4 space-y-4' : 'flex-1 min-h-0 overflow-y-auto custom-scrollbar px-6 py-5 space-y-4'}>
                            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Valor directo de la rama</div>
                                <div className="mt-2 text-2xl font-black tracking-tight text-zinc-900">
                                    {formatCurrency(selectedNode?.metrics?.directo || 0)}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Valor presupuestado de la rama</div>
                                <div className="mt-2 text-2xl font-black tracking-tight text-[#136191]">
                                    {formatCurrency(selectedNode?.metrics?.valorado || 0)}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">% sobre el presupuesto valorado</div>
                                <div className="mt-2 text-2xl font-black tracking-tight text-[#F39200]">
                                    {formatPercent(totalValorado > 0 ? ((selectedNode?.metrics?.valorado || 0) / totalValorado) * 100 : 0)}
                                </div>
                            </div>
                            <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-4">
                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-blue-500">Regla operativa</div>
                                <p className="mt-2 text-[11px] leading-relaxed text-blue-900 font-medium">
                                    La EDT valorada se sincroniza con el presupuesto activo. El valor de cada rama se recalcula con el directo vigente de sus líneas y el porcentaje de indirectos operativo del presupuesto.
                                </p>
                            </div>
                        </div>
                    </aside>
                </div>
            </AppModalBody>

            <AppModalFooter className={isCompactViewport ? 'flex-col items-stretch justify-start gap-3' : 'justify-between'}>
                <div className={isCompactViewport ? 'grid grid-cols-1 sm:grid-cols-3 gap-2 w-full' : 'flex items-center gap-2'}>
                    <button
                        onClick={() => handleDownloadEdtReport('listado')}
                        disabled={!!generatingReport}
                        className="px-4 h-11 bg-white border border-zinc-200 text-zinc-600 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-50 disabled:opacity-50 flex items-center gap-2"
                        title="Generar Listado de EDT"
                    >
                        <FileSpreadsheet className={`w-4 h-4 ${generatingReport === 'listado' ? 'animate-pulse' : ''}`} /> Listado
                    </button>
                    <button
                        onClick={() => handleDownloadEdtReport('diccionario')}
                        disabled={!!generatingReport}
                        className="px-4 h-11 bg-white border border-zinc-200 text-zinc-600 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-zinc-50 disabled:opacity-50 flex items-center gap-2"
                        title="Generar Diccionario de la EDT"
                    >
                        <FileSpreadsheet className={`w-4 h-4 ${generatingReport === 'diccionario' ? 'animate-pulse' : ''}`} /> Diccionario
                    </button>
                    <button
                        onClick={() => handleDownloadEdtReport('valorada')}
                        disabled={!!generatingReport}
                        className="px-4 h-11 bg-emerald-50 border border-emerald-100 text-emerald-600 font-bold text-[10px] uppercase tracking-widest rounded-xl hover:bg-emerald-100 disabled:opacity-50 flex items-center gap-2"
                        title="Generar EDT Valorada Profecional"
                    >
                        <FileSpreadsheet className={`w-4 h-4 ${generatingReport === 'valorada' ? 'animate-pulse' : ''}`} /> Valorada
                    </button>
                </div>
                <div className={isCompactViewport ? 'flex flex-col-reverse sm:flex-row items-stretch sm:items-center gap-3 w-full' : 'flex items-center gap-3'}>
                    <button
                        type="button"
                        onClick={onClose}
                        className={isCompactViewport ? 'w-full sm:w-auto px-6 h-11 bg-zinc-100 text-zinc-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-200' : 'px-6 h-11 bg-zinc-100 text-zinc-500 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-zinc-200'}
                    >
                        Cerrar
                    </button>
                    <LiquidButton
                        onClick={() => handleNavigate()}
                        className={isCompactViewport ? 'w-full sm:w-auto !h-11 !px-8 bg-[#136191] text-white text-xs font-black uppercase tracking-widest rounded-xl' : '!h-11 !px-8 bg-[#136191] text-white text-xs font-black uppercase tracking-widest rounded-xl'}
                    >
                        <ArrowRight className="w-4 h-4 mr-2" />
                        Ir al editor
                    </LiquidButton>
                </div>
            </AppModalFooter>
        </AppModalShell>
        <CommonReportPreviewModal
            isOpen={showReportPreview}
            onClose={() => setShowReportPreview(false)}
            preview={reportPreview}
            onExportExcel={handleExportReportExcel}
            onExportPdf={handleExportReportPdf}
            onExportPdfFromExcel={handleExportReportPdfFromExcel}
            exporting={!!generatingReport}
        />
        <ReportGenerationModal
            isOpen={!!generatingReport}
            title="Generando reporte"
            message="Estamos preparando el reporte EDT. La descarga comenzará automáticamente cuando esté listo."
        />
        </>
    );
};

export default EdtValoradaModal;
