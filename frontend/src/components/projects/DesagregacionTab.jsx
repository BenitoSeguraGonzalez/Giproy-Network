import React, { useState, useEffect, useContext, useMemo, useRef, useCallback } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { presupuestosApi } from '../../api/presupuestos';
import { apusApi } from '../../api/apus';
import { recursosApi } from '../../api/recursos';
import { edtApi } from '../../api/edt';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "../ui/table";
import { Input } from "../ui/input";
import ClearSearchField from '../ui/ClearSearchField';
import MotionScrollbar from '../ui/MotionScrollbar';
import { appAlert } from "../../utils/appDialog";
import { Folders } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { 
    BarChart3, 
    ChevronDown, 
    AlertCircle,
    Loader2,
    Search,
    Eye,
    Calculator,
    X
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import {
    calculateApuVaeBreakdown,
    calculatePesoRelativo,
    calculateVaePonderadoProject,
} from '../../utils/vaeCalculator';
import SearchableSelect from '../ui/searchable-select';
import { normalizeTextInputValue } from '../../utils/normalizeInputValue';
import { motion } from 'framer-motion';
import reportingApi from '../../api/reporting';
import { extractBlobErrorMessage } from '../../utils/apiBlobErrors';
import CommonReportPreviewModal from '../reporting/CommonReportPreviewModal';
import ReportGenerationModal from '../reporting/ReportGenerationModal';
import ProjectSectionReportButton from './ProjectSectionReportButton';
import ProjectSegmentedSwitch from './ProjectSegmentedSwitch';
import { ControlRail, ControlRailDivider, ControlRailIconButton, ControlRailSection } from '../ui/ControlRail';
import { buildReportFileName, sanitizeReportContext } from '../../utils/reportFileName';
import { downloadBlobResponse } from '../../utils/blobDownload';
import {
    PORTABLE_WORKSPACE_EVENT,
    readPortableWorkspaceOverride,
    resolvePortableWorkspace,
} from '../../utils/portableWorkspace';
import {
    parseOperationalNumber,
    resolveApuLineOperationalSubtotal,
    resolveApuLineOperationalUnitPrice,
} from '../../utils/operationalNumbers';
import {
    normalizeDescriptionCapitalization,
    normalizeDisplayUnit,
    normalizeSubcategoryDisplay,
} from '../../utils/descriptionCapitalization';
import { APP_MODAL_CLOSE_BUTTON_CLASS } from '../ui/app-modal';
import { includesNormalized } from '../../utils/normalizeSearch';

const MotionDiv = motion.div;

const DESAGREGACION_DARK_PILL_BUTTON =
    'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[0.85rem] border border-white/8 bg-[#15181d] px-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/82 shadow-[3px_3px_8px_rgba(0,0,0,0.32),-2px_-2px_6px_rgba(255,255,255,0.045)] transition-all duration-200 hover:border-white/14 hover:bg-[#1b1f25] hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/8 disabled:hover:bg-[#15181d] disabled:hover:text-white/82';

const resolveCpcCode = (cpc = {}) => cpc?.codCPC || cpc?.cod_cpc || cpc?.codigo || cpc?.code || '';
const resolveProjectApuCpcCode = (entry = {}) => resolveCpcCode(entry?.cpc) || entry?.cod_cpc_codigo || entry?.codCPC || '';
const resolveProjectApuCpcDescription = (entry = {}) => (
    entry?.cpc?.descripcion
    || entry?.cpc_descripcion
    || entry?.descripcion
    || ''
);
const resolveLineaCpc = (linea = {}) => {
    const recurso = linea?.recurso || {};
    const directCpc = recurso?.cpc || linea?.cpc || null;
    const directCode = resolveCpcCode(directCpc);
    if (directCode) return directCpc;

    const fallbackCode = recurso?.cod_cpc_codigo
        || recurso?.codCPC
        || recurso?.cod_cpc
        || recurso?.cpc_codigo
        || linea?.cod_cpc_codigo
        || linea?.codCPC
        || linea?.cod_cpc
        || linea?.cpc_codigo
        || '';

    if (!fallbackCode) return directCpc;

    return {
        ...(directCpc || {}),
        codCPC: fallbackCode,
        descripcion: recurso?.cpc_descripcion || linea?.cpc_descripcion || directCpc?.descripcion || '',
        porcentaje: recurso?.cpc_porcentaje ?? linea?.cpc_porcentaje ?? directCpc?.porcentaje ?? 0,
    };
};
const isNestedApuLine = (linea = {}) => Boolean(linea?.apu_hijo_id || linea?.apu_hijo);
const lineHasIncompleteCpcPayload = (linea = {}) => {
    if (isNestedApuLine(linea)) return false;
    const hasAssignedCpc = Boolean(
        linea?.recurso?.cod_cpc_id
        || linea?.cod_cpc_id
        || resolveCpcCode(resolveLineaCpc(linea))
    );
    if (!hasAssignedCpc) return false;
    return !resolveCpcCode(resolveLineaCpc(linea));
};
const detailHasIncompleteCpcPayload = (detail = {}) => (detail?.recursos || []).some(lineHasIncompleteCpcPayload);
const isStructuralBudgetRow = (linea = {}) => linea?.tipo === 'CUENTA_PAQUETE';
const isDesagregacionRubroLine = (linea = {}) => Boolean(linea?.apu_id) && !isStructuralBudgetRow(linea);
const normalizeNumericId = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const CATEGORIAS_BASE = [
    { id: 1, nombre: 'Equipos y Herramientas', icon: '🔧', color: 'text-blue-600' },
    { id: 2, nombre: 'Materiales', icon: '📦', color: 'text-green-600' },
    { id: 3, nombre: 'Transporte', icon: '🚚', color: 'text-yellow-600' },
    { id: 4, nombre: 'Mano de Obra', icon: '👥', color: 'text-purple-600' },
];

const parseCategoryFromCode = (value) => {
    if (value === null || value === undefined) return null;
    const raw = String(value).trim();
    const firstDigit = raw.match(/[1-4]/)?.[0];
    return firstDigit ? Number(firstDigit) : null;
};

const resolveResourceMotherCategoryId = (linea = {}) => {
    if (linea?.apu_hijo_id || linea?.apu_hijo) return 2;
    const directCategory = Number(linea?.categoria_id || linea?.recurso?.categoria_id || 0);
    if (directCategory >= 1 && directCategory <= 4) return directCategory;
    return parseCategoryFromCode(
        linea?.subcategoria_codigo
        || linea?.recurso?.subcategoria_codigo
        || linea?.subcategoria_item?.subcategoria_codigo
        || linea?.recurso?.subcategoria_item?.subcategoria_codigo
        || linea?.subcategoria_item?.codigo
        || linea?.recurso?.subcategoria_item?.codigo
        || linea?.recurso?.codigo
        || linea?.codigo
    ) || 2;
};

const DesagregacionTab = ({ project }) => {
    const { selectedEmpresa, user } = useContext(AuthContext);
    const [, setPresupuestos] = useState([]);
    const [selectedPresId, setSelectedPresId] = useState(null);
    const [budgetData, setBudgetData] = useState(null);
    const [edtTree, setEdtTree] = useState([]);
    const [desagregacionViewMode, setDesagregacionViewMode] = useState('edt');
    const [loading, setLoading] = useState(false);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [selectedLine, setSelectedLine] = useState(null);
    const [apuDetails, setApuDetails] = useState({}); // Cache de detalles de APU {apuId: {vae: 0, recursos: []}}
    const [loadingApuIds, setLoadingApuIds] = useState(() => new Set());
    const [collapsedApuResourceCategories, setCollapsedApuResourceCategories] = useState([]);
    const apuDetailsRef = useRef({});

    // Estado para el Selector Global de CPC
    const [showCpcModal, setShowCpcModal] = useState(false);
    const [cpcSearchQuery, setCpcSearchQuery] = useState('');
    const [cpcResults, setCpcResults] = useState([]);
    const [isSearchingCpc, setIsSearchingCpc] = useState(false);
    const [reportPreview, setReportPreview] = useState(null);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [updatingRecurso, setUpdatingRecurso] = useState(null);
    const [updatingApuCpc, setUpdatingApuCpc] = useState(null);
    const [projectApuCpcMap, setProjectApuCpcMap] = useState({});
    const [, setIsSavingCpc] = useState(false);

    // Estado para Navegación de Integridad CPC
    const [currentCpcFocusIndex, setCurrentCpcFocusIndex] = useState(-1);
    const [desagregacionSearch, setDesagregacionSearch] = useState('');
    const [activeDesagregacionSearchIndex, setActiveDesagregacionSearchIndex] = useState(-1);
    const tableContainerRef = useRef(null);
    const apuResourcesTableRef = useRef(null);

    const [generatingReport, setGeneratingReport] = useState(false);
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
        width: viewport.width,
        height: viewport.height,
        forced: user?.role === 'superadmin' && forcedPortableWorkspace,
    });

    const handleDownloadVaeReport = async () => {
        if (!selectedPresId) return;
        try {
            setGeneratingReport(true);
            const response = await reportingApi.previewReport({
                report_type: 'vae',
                entity_ids: [selectedPresId]
            });
            setReportPreview(response.data);
            setShowReportPreview(true);
        } catch (error) {
            console.error("Error al generar reporte VAE:", error);
            appAlert({ title: "Error", message: "No se pudo generar el reporte VAE.", tone: "danger" });
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleExportReportExcel = async () => {
        if (!selectedPresId) return;
        try {
            setGeneratingReport(true);
            const response = await reportingApi.exportReport({
                report_type: 'vae',
                entity_ids: [selectedPresId],
                format: 'xlsx'
            });
            downloadBlobResponse(response, buildReportFileName({
                reportLabel: 'VAE',
                contextLabel: sanitizeReportContext(project?.nombre || `Proyecto ${project?.id}`),
                revision: project?.revision ?? 1,
                extension: 'xlsx',
            }));
        } catch (error) {
            console.error("Error al exportar reporte VAE:", error);
            appAlert({ title: "Error", message: await extractBlobErrorMessage(error, "No se pudo exportar el reporte VAE."), tone: "danger" });
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleExportReportPdf = async () => {
        if (!selectedPresId) return;
        try {
            setGeneratingReport(true);
            const response = await reportingApi.exportReport({
                report_type: 'vae',
                entity_ids: [selectedPresId],
                format: 'pdf'
            });
            downloadBlobResponse(response, buildReportFileName({
                reportLabel: 'VAE',
                contextLabel: sanitizeReportContext(project?.nombre || `Proyecto ${project?.id}`),
                revision: project?.revision ?? 1,
                extension: 'pdf',
            }), 'application/pdf');
        } catch (error) {
            console.error("Error al exportar reporte VAE PDF:", error);
            appAlert({ title: "Error", message: await extractBlobErrorMessage(error, "No se pudo exportar el reporte VAE en PDF."), tone: "danger" });
        } finally {
            setGeneratingReport(false);
        }
    };

    const handleExportReportPdfFromExcel = async () => {
        if (!selectedPresId) return;
        try {
            setGeneratingReport(true);
            const response = await reportingApi.exportReport({
                report_type: 'vae',
                entity_ids: [selectedPresId],
                format: 'pdf_excel'
            });
            downloadBlobResponse(response, buildReportFileName({
                reportLabel: 'VAE',
                contextLabel: sanitizeReportContext(project?.nombre || `Proyecto ${project?.id}`),
                revision: project?.revision ?? 1,
                extension: 'pdf',
            }), 'application/pdf');
        } catch (error) {
            console.error("Error al exportar reporte VAE PDF desde Excel:", error);
            appAlert({ title: "Error", message: await extractBlobErrorMessage(error, "No se pudo exportar el reporte VAE como PDF desde Excel."), tone: "danger" });
        } finally {
            setGeneratingReport(false);
        }
    };

    useEffect(() => {
        apuDetailsRef.current = apuDetails;
    }, [apuDetails]);

    useEffect(() => {
        apuDetailsRef.current = {};
        setApuDetails({});
        setLoadingApuIds(new Set());
        setSelectedLine(null);
        setCurrentCpcFocusIndex(-1);
    }, [selectedPresId, selectedEmpresa?.id]);

    const buildApuVaeDetail = useCallback((apu) => {
        const vaeBreakdown = calculateApuVaeBreakdown(
            (apu.lineas || []).map((l) => ({
                total: resolveApuLineOperationalSubtotal(l, { moneyDecimals: 4 }),
                cpc_porcentaje: isNestedApuLine(l)
                    ? Number(l?.apu_hijo?.vae_total || 0) * 100
                    : resolveLineaCpc(l)?.porcentaje || 0,
                cpc_codigo: isNestedApuLine(l)
                    ? `APU-${l?.apu_hijo_id || l?.apu_hijo?.id || 'ANIDADO'}`
                    : resolveCpcCode(resolveLineaCpc(l)),
                is_nested_apu: isNestedApuLine(l),
            })),
            parseOperationalNumber(apu.costo_directo),
        );

        return {
            vae: vaeBreakdown.value,
            isComplete: vaeBreakdown.isComplete,
            recursos: apu.lineas || [],
            costoDirecto: parseOperationalNumber(apu.costo_directo)
        };
    }, []);

    useEffect(() => {
        if (!project?.id || !selectedEmpresa?.id) {
            setProjectApuCpcMap({});
            return;
        }
        let cancelled = false;
        apusApi.getProjectCpc(project.id, selectedEmpresa.id)
            .then((res) => {
                if (cancelled) return;
                const nextMap = {};
                (res.data || []).forEach((entry) => {
                    if (!entry?.apu_id) return;
                    nextMap[String(entry.apu_id)] = entry;
                });
                setProjectApuCpcMap(nextMap);
            })
            .catch((error) => {
                console.error("Error cargando CPC de APUs del proyecto:", error);
                setProjectApuCpcMap({});
            });
        return () => {
            cancelled = true;
        };
    }, [project?.id, selectedEmpresa?.id]);

    const loadApusVAE = useCallback(async (ids) => {
        const uniqueIds = [...new Set((ids || []).filter(Boolean))];
        const pendingIds = uniqueIds.filter(id => !apuDetailsRef.current[id]);
        
        if (pendingIds.length === 0) return;

        setLoadingApuIds((prev) => {
            const next = new Set(prev);
            pendingIds.forEach((id) => next.add(String(id)));
            return next;
        });

        try {
            const response = await apusApi.getBatchDetails(pendingIds, selectedEmpresa?.id);
            const batchDetails = {};
            const receivedIds = new Set();
            (response.data || []).forEach((apu) => {
                if (!apu?.id) return;
                const detail = buildApuVaeDetail(apu);
                batchDetails[apu.id] = detail;
                receivedIds.add(String(apu.id));
            });

            const directFallbackIds = pendingIds.filter((id) => {
                const detail = batchDetails[id];
                return !receivedIds.has(String(id))
                    || !detail
                    || detail.recursos.length === 0
                    || detailHasIncompleteCpcPayload(detail);
            });

            const directResults = directFallbackIds.length > 0
                ? await Promise.allSettled(
                    directFallbackIds.map((id) => apusApi.getById(id, selectedEmpresa?.id))
                )
                : [];

            directResults.forEach((result, index) => {
                const fallbackId = directFallbackIds[index];
                if (result.status !== 'fulfilled' || !result.value?.data) {
                    console.error("Error cargando detalle directo de APU:", fallbackId, result.reason);
                    return;
                }
                batchDetails[fallbackId] = buildApuVaeDetail(result.value.data);
            });

            setApuDetails((prev) => {
                const next = { ...prev, ...batchDetails };
                apuDetailsRef.current = next;
                return next;
            });
        } catch (error) {
            console.error("Error cargando VAE de APUs:", error);
            const directResults = await Promise.allSettled(
                pendingIds.map((id) => apusApi.getById(id, selectedEmpresa?.id))
            );
            const fallbackDetails = {};
            directResults.forEach((result, index) => {
                const fallbackId = pendingIds[index];
                if (result.status !== 'fulfilled' || !result.value?.data) {
                    console.error("Error cargando detalle directo de APU:", fallbackId, result.reason);
                    return;
                }
                fallbackDetails[fallbackId] = buildApuVaeDetail(result.value.data);
            });
            if (Object.keys(fallbackDetails).length > 0) {
                setApuDetails((prev) => {
                    const next = { ...prev, ...fallbackDetails };
                    apuDetailsRef.current = next;
                    return next;
                });
            }
        } finally {
            setLoadingApuIds((prev) => {
                const next = new Set(prev);
                pendingIds.forEach((id) => next.delete(String(id)));
                return next;
            });
        }
    }, [buildApuVaeDetail, selectedEmpresa?.id]);

    // Helper para el "Semáforo" de integridad CPC
    const getApuStatus = useCallback((apuId) => {
        const data = apuDetails[apuId];
        if (!data) return 'loading';
        return data.isComplete ? 'complete' : 'incomplete';
    }, [apuDetails]);

    useEffect(() => {
        setSelectedLine(null);
        setCurrentCpcFocusIndex(-1);
    }, [desagregacionViewMode]);

    useEffect(() => {
        const apuId = selectedLine?.apu_id;
        if (!apuId) return;

        setLoadingApuIds((prev) => {
            const next = new Set(prev);
            next.add(String(apuId));
            return next;
        });

        let cancelled = false;
        apusApi.getById(apuId, selectedEmpresa?.id)
            .then((res) => {
                if (cancelled || !res?.data) return;
                const nextDetail = buildApuVaeDetail(res.data);
                setApuDetails((prev) => {
                    const next = {
                        ...prev,
                        [apuId]: nextDetail,
                    };
                    apuDetailsRef.current = next;
                    return next;
                });
            })
            .catch((error) => {
                console.error("Error cargando detalle directo del APU seleccionado:", error);
                if (!apuDetailsRef.current[apuId]) {
                    loadApusVAE([apuId]);
                }
            })
            .finally(() => {
                if (cancelled) return;
                setLoadingApuIds((prev) => {
                    const next = new Set(prev);
                    next.delete(String(apuId));
                    return next;
                });
            });

        return () => {
            cancelled = true;
        };
    }, [selectedLine?.apu_id, selectedEmpresa?.id, buildApuVaeDetail, loadApusVAE]);

    useEffect(() => {
        setCollapsedApuResourceCategories([]);
    }, [selectedLine?.apu_id]);

    // Cargar el presupuesto y la EDT del proyecto
    useEffect(() => {
        const fetchData = async () => {
            if (!project?.id) return;
            try {
                setLoading(true);
                const empresaId = selectedEmpresa?.id;
                const [presupuestoResult, edtResult] = await Promise.allSettled([
                    presupuestosApi.getAll({ proyecto_id: project.id }),
                    edtApi.getTree(project.id, empresaId)
                ]);

                const presData = presupuestoResult.status === 'fulfilled' ? presupuestoResult.value : [];
                if (presupuestoResult.status === 'rejected') {
                    console.error("Error cargando presupuestos de desagregación:", presupuestoResult.reason);
                }
                if (edtResult.status === 'fulfilled') {
                    setEdtTree(Array.isArray(edtResult.value) ? edtResult.value : []);
                } else {
                    console.error("Error cargando EDT de desagregación:", edtResult.reason);
                    setEdtTree([]);
                }

                // Buscamos el presupuesto que coincida con la revisión del proyecto
                const currentPres = presData.find(p => p.revision === project.revision) || presData[0];
                
                if (currentPres) {
                    setSelectedPresId(currentPres.id);
                }
                setPresupuestos(presData);
            } catch (error) {
                console.error("Error cargando datos de desagregación:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [project?.id, project?.revision, selectedEmpresa]);

    // Cargar detalle del presupuesto seleccionado
    useEffect(() => {
        const fetchBudgetDetails = async () => {
            if (!selectedPresId) return;
            try {
                setLoadingDetails(true);
                const data = await presupuestosApi.getById(selectedPresId, selectedEmpresa?.id);
                setBudgetData(data);
                
                // Cargar VAE de todos los APUs en el presupuesto
                const apuIds = [...new Set(data.detalle.filter(d => d.apu_id).map(d => d.apu_id))];
                loadApusVAE(apuIds);

            } catch (error) {
                console.error("Error cargando detalle del presupuesto:", error);
            } finally {
                setLoadingDetails(false);
            }
        };
        fetchBudgetDetails();
    }, [selectedPresId, selectedEmpresa, loadApusVAE]);

    // Funciones para el Selector de CPC
    const handleOpenCpcModal = (recurso) => {
        const resolvedCpc = resolveLineaCpc({ recurso });
        const resolvedCpcCode = resolveCpcCode(resolvedCpc);
        setUpdatingRecurso(recurso);
        setUpdatingApuCpc(null);
        setCpcSearchQuery(resolvedCpcCode || '');
        setShowCpcModal(true);
        handleCpcSearch(resolvedCpcCode || '');
    };

    const handleOpenApuCpcModal = (line, event) => {
        event?.stopPropagation?.();
        if (!line?.apu_id) return;
        const currentEntry = projectApuCpcMap[String(line.apu_id)] || null;
        const currentCode = resolveProjectApuCpcCode(currentEntry);
        setUpdatingRecurso(null);
        setUpdatingApuCpc({
            apu_id: line.apu_id,
            descripcion: line.descripcion,
        });
        setCpcSearchQuery(currentCode || '');
        setShowCpcModal(true);
        handleCpcSearch(currentCode || '');
    };

    const handleCpcSearch = useCallback((query) => {
        const nextValue = normalizeTextInputValue(query);
        setCpcSearchQuery(nextValue);
    }, []);


    // Debounce para búsqueda de CPC
    useEffect(() => {
        const timer = setTimeout(async () => {
            // Si está vacío, traemos los primeros resultados igualmente
            // Pero si es solo 1 letra, esperamos a 2 o vacío
            if (cpcSearchQuery.length === 1) return;
            
            setIsSearchingCpc(true);
            try {
                const res = await recursosApi.searchCPC(cpcSearchQuery);
                setCpcResults(res.data);
            } catch (error) {
                console.error("Error buscando CPC:", error);
            } finally {
                setIsSearchingCpc(false);
            }
        }, 400); // 400ms de delay

        return () => clearTimeout(timer);
    }, [cpcSearchQuery, handleCpcSearch]);

    const handleSaveCpc = async (cpc) => {
        if (!updatingRecurso && !updatingApuCpc) return;
        
        setIsSavingCpc(true);
        try {
            const empId = selectedEmpresa?.id;
            if (updatingApuCpc) {
                const response = await apusApi.assignProjectCpc(
                    updatingApuCpc.apu_id,
                    project.id,
                    cpc.id,
                    empId
                );
                setProjectApuCpcMap((prev) => ({
                    ...prev,
                    [String(updatingApuCpc.apu_id)]: response.data,
                }));
                setShowCpcModal(false);
                setUpdatingApuCpc(null);
                return;
            }

            // Actualización global del recurso
            await recursosApi.update(updatingRecurso.id, {
                cod_cpc_id: cpc.id
            }, empId);

            appAlert({
                title: "CPC Actualizado",
                message: `El recurso "${normalizeDescriptionCapitalization(updatingRecurso.descripcion)}" ahora tiene el CPC ${cpc.codCPC}. Se recalculó el VAE global.`,
                tone: "success"
            });

            // Forzar recarga del APU actual para ver los cambios inmediatamente
            if (selectedLine?.apu_id) {
                const res = await apusApi.getById(selectedLine.apu_id, empId);
                const apu = res.data;
                const nextDetail = buildApuVaeDetail(apu);
                
                setApuDetails(prev => {
                    const next = {
                        ...prev,
                        [selectedLine.apu_id]: nextDetail
                    };
                    apuDetailsRef.current = next;
                    return next;
                });
            }

            setShowCpcModal(false);
            setUpdatingRecurso(null);

            // Si estábamos en modo navegación, es probable que este rubro ya esté completo ahora
        } catch (error) {
            console.error("Error guardando CPC:", error);
            appAlert({
                title: "Error",
                message: error.response?.data?.detail || "No se pudo actualizar el código CPC.",
                tone: "danger"
            });
        } finally {
            setIsSavingCpc(false);
        }
    };

    const budgetLines = useMemo(() => {
        if (!budgetData) return [];
        return (budgetData.detalle || []).filter(isDesagregacionRubroLine);
    }, [budgetData]);

    const edtMetaById = useMemo(() => {
        const map = new Map();
        const appendNode = (node, ancestors = []) => {
            const nodeId = normalizeNumericId(node?.id);
            if (nodeId === null) return;
            const codigo = String(node?.codigo || '').trim();
            const nombre = String(node?.nombre || '').trim();
            const path = [...ancestors, { id: nodeId, codigo, nombre }];
            map.set(nodeId, {
                id: nodeId,
                codigo,
                nombre,
                path,
                pathCodigo: path.map((item) => item.codigo).filter(Boolean).join(' / '),
                pathNombre: path.map((item) => item.nombre).filter(Boolean).join(' / ')
            });
            (node?.hijos || []).forEach((child) => appendNode(child, path));
        };
        (edtTree || []).forEach((node) => appendNode(node));
        return map;
    }, [edtTree]);

    const apuLocationsById = useMemo(() => {
        const map = new Map();
        for (const line of budgetLines) {
            const apuId = normalizeNumericId(line.apu_id);
            if (apuId === null) continue;
            const edtId = normalizeNumericId(line.edt_id);
            const meta = edtId !== null ? edtMetaById.get(edtId) : null;
            const location = {
                edtId,
                codigo: meta?.codigo || String(line.codigo_item || '').split('.').slice(0, -1).join('.'),
                nombre: meta?.nombre || '',
                pathCodigo: meta?.pathCodigo || '',
                pathNombre: meta?.pathNombre || ''
            };
            if (!map.has(apuId)) map.set(apuId, []);
            const locations = map.get(apuId);
            if (!locations.some((item) => item.edtId === location.edtId)) {
                locations.push(location);
            }
        }
        return map;
    }, [budgetLines, edtMetaById]);

    const consolidateBudgetLineGroup = useCallback((lines, keyPrefix = 'apu') => {
        const orderedLines = [...(lines || [])].sort((a, b) => (a.orden || 0) - (b.orden || 0));
        const firstLine = orderedLines[0];
        if (!firstLine) return null;

        const cantidadTotal = orderedLines.reduce((acc, line) => acc + parseOperationalNumber(line.cantidad), 0);
        const precioTotal = orderedLines.reduce((acc, line) => acc + parseOperationalNumber(line.precio_total), 0);
        const precioUnitario = cantidadTotal > 0
            ? precioTotal / cantidadTotal
            : parseOperationalNumber(firstLine.precio_unitario);
        const apuId = normalizeNumericId(firstLine.apu_id);
        const locations = apuId !== null ? (apuLocationsById.get(apuId) || []) : [];

        return {
            ...firstLine,
            id: `${keyPrefix}-${firstLine.apu_id}`,
            source_line_id: firstLine.id,
            source_line_ids: orderedLines.map((line) => line.id),
            source_lines: orderedLines,
            occurrences: orderedLines.length,
            edt_locations: locations,
            cantidad: cantidadTotal,
            precio_unitario: precioUnitario,
            precio_total: precioTotal,
            isChapter: false,
            isConsolidated: orderedLines.length > 1 || locations.length > 1
        };
    }, [apuLocationsById]);

    const consolidatedBudgetLines = useMemo(() => {
        const byApuId = new Map();
        for (const line of budgetLines) {
            const apuId = normalizeNumericId(line.apu_id);
            if (apuId === null) continue;
            if (!byApuId.has(apuId)) byApuId.set(apuId, []);
            byApuId.get(apuId).push(line);
        }
        return Array.from(byApuId.entries())
            .map(([apuId, lines]) => consolidateBudgetLineGroup(lines, `consolidated-${apuId}`))
            .filter(Boolean)
            .sort((a, b) => {
                const firstA = a.source_lines?.[0] || a;
                const firstB = b.source_lines?.[0] || b;
                return (firstA.orden || 0) - (firstB.orden || 0);
            });
    }, [budgetLines, consolidateBudgetLineGroup]);

    const linesByEdtId = useMemo(() => {
        const map = new Map();
        for (const line of budgetLines) {
            const edtId = normalizeNumericId(line.edt_id);
            if (edtId === null) continue;
            if (!map.has(edtId)) map.set(edtId, []);
            map.get(edtId).push(line);
        }

        for (const [edtId, lines] of map.entries()) {
            const byApuId = new Map();
            for (const line of lines) {
                const apuId = normalizeNumericId(line.apu_id);
                if (apuId === null) continue;
                if (!byApuId.has(apuId)) byApuId.set(apuId, []);
                byApuId.get(apuId).push(line);
            }
            map.set(
                edtId,
                Array.from(byApuId.entries())
                    .map(([apuId, groupedLines]) => consolidateBudgetLineGroup(groupedLines, `edt-${edtId}-apu-${apuId}`))
                    .filter(Boolean)
                    .sort((a, b) => (a.source_lines?.[0]?.orden || a.orden || 0) - (b.source_lines?.[0]?.orden || b.orden || 0))
            );
        }
        return map;
    }, [budgetLines, consolidateBudgetLineGroup]);

    const flatHierarchy = useMemo(() => {
        if (!budgetData) return [];
        if (desagregacionViewMode === 'consolidado' || edtTree.length === 0) {
            return consolidatedBudgetLines.map((line) => ({
                ...line,
                level: 0,
                rowMode: 'consolidado'
            }));
        }

        const rows = [];
        const nodeHasApuRows = (node) => {
            const nodeId = normalizeNumericId(node?.id);
            const directLines = nodeId !== null ? (linesByEdtId.get(nodeId) || []) : [];
            if (directLines.length > 0) return true;
            return (node?.hijos || []).some((child) => nodeHasApuRows(child));
        };

        const appendNode = (node, level = 0) => {
            if (!nodeHasApuRows(node)) return;
            if (node?.tipo_nodo !== 'CUENTA_PAQUETE') {
                (node?.hijos || []).forEach((child) => appendNode(child, level));
                return;
            }
            const nodeId = normalizeNumericId(node.id);
            rows.push({
                key: `edt-${nodeId}`,
                id: nodeId,
                codigo: node.codigo,
                nombre: node.nombre,
                isChapter: true,
                level
            });
            const directLines = nodeId !== null ? (linesByEdtId.get(nodeId) || []) : [];
            directLines.forEach((line) => {
                rows.push({
                    ...line,
                    level: level + 1,
                    rowMode: 'edt'
                });
            });
            (node.hijos || [])
                .filter((child) => child.tipo_nodo === 'CUENTA_PAQUETE')
                .forEach((child) => appendNode(child, level + 1));
        };

        edtTree.forEach((node) => appendNode(node));
        return rows.length > 0
            ? rows
            : consolidatedBudgetLines.map((line) => ({ ...line, level: 0, rowMode: 'consolidado' }));
    }, [budgetData, consolidatedBudgetLines, desagregacionViewMode, edtTree, linesByEdtId]);

    const navigableApuRows = useMemo(() => {
        return flatHierarchy.filter((row) => !row.isChapter && row.apu_id);
    }, [flatHierarchy]);

    const desagregacionSearchValue = useMemo(() => {
        const normalized = normalizeTextInputValue(desagregacionSearch);
        return normalized.length <= 80 ? normalized : normalized.slice(0, 80);
    }, [desagregacionSearch]);

    useEffect(() => {
        if (desagregacionSearch !== desagregacionSearchValue) {
            setDesagregacionSearch(desagregacionSearchValue);
        }
    }, [desagregacionSearch, desagregacionSearchValue]);

    const getDesagregacionRowDomId = useCallback((item) => {
        const prefix = item?.isChapter ? 'chapter' : 'line';
        return `desag-row-${prefix}-${String(item?.id ?? item?.key ?? item?.source_line_id ?? '')}`;
    }, []);

    const desagregacionSearchMatches = useMemo(() => {
        const query = String(desagregacionSearchValue || '').trim();
        if (!query) return [];
        return flatHierarchy
            .map((row) => {
                const apuCpcEntry = row?.apu_id ? projectApuCpcMap[String(row.apu_id)] : null;
                const cpcCode = resolveProjectApuCpcCode(apuCpcEntry);
                const cpcDescription = resolveProjectApuCpcDescription(apuCpcEntry);
                return {
                    rowId: getDesagregacionRowDomId(row),
                    lineId: row?.isChapter ? null : row.id,
                    item: row,
                    text: [
                        row?.codigo,
                        row?.codigo_item,
                        row?.nombre,
                        row?.descripcion,
                        row?.unidad,
                        cpcCode,
                        cpcDescription,
                        ...(row?.edt_locations || []).flatMap((location) => [location?.codigo, location?.nombre, location?.pathCodigo, location?.pathNombre]),
                    ].filter(Boolean).join(' '),
                };
            })
            .filter((entry) => includesNormalized(entry.text, query));
    }, [desagregacionSearchValue, flatHierarchy, getDesagregacionRowDomId, projectApuCpcMap]);

    const desagregacionSearchMatchIds = useMemo(
        () => new Set(desagregacionSearchMatches.map((entry) => entry.rowId)),
        [desagregacionSearchMatches]
    );

    const activeDesagregacionSearchMatchId = activeDesagregacionSearchIndex >= 0
        ? desagregacionSearchMatches[activeDesagregacionSearchIndex]?.rowId
        : null;

    const scrollToDesagregacionSearchMatch = useCallback((match) => {
        if (!match?.rowId) return;
        window.requestAnimationFrame(() => {
            const element = document.getElementById(match.rowId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            if (!match.item?.isChapter) {
                setSelectedLine(match.item);
            }
        });
    }, []);

    useEffect(() => {
        const query = String(desagregacionSearchValue || '').trim();
        if (!query || desagregacionSearchMatches.length === 0) {
            setActiveDesagregacionSearchIndex(-1);
            return;
        }
        setActiveDesagregacionSearchIndex(0);
        scrollToDesagregacionSearchMatch(desagregacionSearchMatches[0]);
    }, [desagregacionSearchMatches, desagregacionSearchValue, scrollToDesagregacionSearchMatch]);

    const navigateDesagregacionSearchMatch = (nextIndex = activeDesagregacionSearchIndex + 1) => {
        if (!desagregacionSearchMatches.length) return;
        const normalizedIndex = ((nextIndex % desagregacionSearchMatches.length) + desagregacionSearchMatches.length) % desagregacionSearchMatches.length;
        setActiveDesagregacionSearchIndex(normalizedIndex);
        scrollToDesagregacionSearchMatch(desagregacionSearchMatches[normalizedIndex]);
    };

    // Lógica de Navegación "Loop"
    const incompleteApuIds = useMemo(() => {
        return navigableApuRows
            .filter(line => line.apu_id && getApuStatus(line.apu_id) === 'incomplete')
            .map(line => line.id);
    }, [navigableApuRows, getApuStatus]);

    const navigateToNextIncomplete = () => {
        if (incompleteApuIds.length === 0) return;

        const nextIndex = (currentCpcFocusIndex + 1) % incompleteApuIds.length;
        const targetLineId = incompleteApuIds[nextIndex];
        const targetLine = navigableApuRows.find(l => l.id === targetLineId);

        if (targetLine) {
            setSelectedLine(targetLine);
            setCurrentCpcFocusIndex(nextIndex);

            // Scroll automático al rubro
            setTimeout(() => {
                const element = document.getElementById(getDesagregacionRowDomId(targetLine));
                if (element && tableContainerRef.current) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    };

    const projectTotal = useMemo(() => {
        return budgetLines.reduce((acc, line) => acc + parseOperationalNumber(line.precio_total), 0);
    }, [budgetLines]);

    const renderRow = (item, index) => {
        const isChapter = item.isChapter;
        
        if (isChapter) {
            const chapterCode = normalizeSubcategoryDisplay(item.codigo || '');
            const chapterName = normalizeSubcategoryDisplay(item.nombre || '');
            const rowDomId = getDesagregacionRowDomId(item);
            const isSearchMatch = desagregacionSearchMatchIds.has(rowDomId);
            const isActiveSearchMatch = activeDesagregacionSearchMatchId === rowDomId;
            return (
                <TableRow
                    id={rowDomId}
                    key={`chap-${item.id}`}
                    className={`bg-blue-50/30 hover:bg-blue-100/30 border-b-blue-100 border-l-[6px] border-l-blue-400 ${
                        isSearchMatch ? 'ring-1 ring-inset ring-[#F39200]/30' : ''
                    } ${isActiveSearchMatch ? 'bg-orange-50/70 ring-2 ring-inset ring-[#F39200]/70' : ''}`}
                >
                    <TableCell className="py-2.5 px-6" style={{ paddingLeft: `${item.level * 1.5 + 1}rem` }}>
                        <span className="font-mono text-[10px] font-black text-blue-600 tracking-wider">
                            {chapterCode}
                        </span>
                    </TableCell>
                    <TableCell colSpan={8} className="py-2">
                        <div className="flex items-center gap-2">
                            <Folders className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-black text-[10px] uppercase tracking-tight text-zinc-800">
                                {chapterName}
                            </span>
                        </div>
                    </TableCell>
                </TableRow>
            );
        }

        const line = item;
        const isSelected = selectedLine?.id === line.id;
        const vaeData = line.apu_id ? apuDetails[line.apu_id] : null;
        const vaeRubro = vaeData?.vae ?? null;
        const pesoRelativo = calculatePesoRelativo(parseOperationalNumber(line.precio_total), projectTotal);
        const vaePonderado = calculateVaePonderadoProject(vaeRubro, pesoRelativo);
        const lineDescription = normalizeDescriptionCapitalization(line.descripcion);
        const lineUnit = normalizeDisplayUnit(line.unidad);
        const apuCpcEntry = line.apu_id ? projectApuCpcMap[String(line.apu_id)] : null;
        const apuCpcCode = resolveProjectApuCpcCode(apuCpcEntry);
        const apuCpcDescription = resolveProjectApuCpcDescription(apuCpcEntry);
        const rowDomId = getDesagregacionRowDomId(line);
        const isSearchMatch = desagregacionSearchMatchIds.has(rowDomId);
        const isActiveSearchMatch = activeDesagregacionSearchMatchId === rowDomId;

        return (
            <React.Fragment key={line.id}>
                <TableRow 
                    id={rowDomId}
                    className={`group cursor-pointer transition-all border-zinc-50 ${
                        isSelected ? 'bg-orange-100/50 border-l-4 border-l-orange-500' : 'hover:bg-orange-50/20'
                    } ${isSearchMatch ? 'ring-1 ring-inset ring-[#F39200]/35' : ''} ${
                        isActiveSearchMatch ? 'bg-[#fff7ed] ring-2 ring-inset ring-[#F39200]/70' : ''
                    }`}
                    onClick={() => setSelectedLine(line)}
                >
                    <TableCell className="py-3 px-6 text-left" style={{ paddingLeft: `${item.level * 1.5 + 1}rem` }}>
                        <span className="font-mono text-[10px] font-bold tracking-wider text-zinc-400">
                            {line.codigo_item || (index + 1).toString()}
                        </span>
                    </TableCell>
                    <TableCell className="font-bold text-[11px] tracking-tight text-zinc-700">
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                                {line.apu_id && (
                                    <div 
                                        className={`w-2 h-2 rounded-full shrink-0 ${getApuStatus(line.apu_id) === 'incomplete' ? 'bg-[#E94E1B] animate-pulse' : getApuStatus(line.apu_id) === 'complete' ? 'bg-[#136191]' : 'bg-zinc-200'}`}
                                        title={getApuStatus(line.apu_id) === 'incomplete' ? "Recursos faltan por asignar CPC" : "CPC completo"}
                                    />
                                )}
                                <Calculator className="w-3.5 h-3.5 text-[#F39200]" />
                                {lineDescription}
                            </div>
                            {(line.isConsolidated || line.edt_locations?.length > 0 || line.apu_id) && (
                                <div className="flex flex-wrap items-center gap-1.5 pl-5 text-[7.5px] font-black uppercase tracking-widest text-zinc-400">
                                    {line.occurrences > 1 && (
                                        <span className="rounded-full border border-orange-100 bg-orange-50 px-2 py-0.5 text-[#F39200]">
                                            {line.occurrences} lineas consolidadas
                                        </span>
                                    )}
                                    {line.edt_locations?.slice(0, 3).map((location) => (
                                        <span key={`${line.id}-loc-${location.edtId}`} className="inline-flex items-center gap-1 rounded-full border border-blue-100 bg-blue-50 px-2 py-0.5 text-blue-600">
                                            <Folders className="h-3 w-3" />
                                            {normalizeSubcategoryDisplay(location.codigo || location.nombre || 'EDT')}
                                        </span>
                                    ))}
                                    {(line.edt_locations?.length || 0) > 3 && (
                                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5">
                                            +{line.edt_locations.length - 3} EDT
                                        </span>
                                    )}
                                    {line.apu_id && (
                                        <button
                                            type="button"
                                            onClick={(event) => handleOpenApuCpcModal(line, event)}
                                            className={`inline-flex max-w-full items-center text-left text-[9px] font-bold italic leading-tight transition-colors ${
                                                apuCpcCode
                                                    ? 'text-[#F39200] hover:text-[#D98200]'
                                                    : 'text-zinc-300 hover:text-[#F39200]'
                                            }`}
                                            title="Asignar CPC del APU para este proyecto"
                                        >
                                            {apuCpcCode ? (
                                                <span className="truncate">
                                                    CPC: {apuCpcCode}{apuCpcDescription ? ` - ${apuCpcDescription}` : ''}
                                                </span>
                                            ) : (
                                                <span>CPC: asignar codigo cpc</span>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </TableCell>
                    <TableCell className="text-center text-[10px] font-black tracking-widest text-zinc-400">
                        {lineUnit || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[11px] tabular-nums">
                        {parseFloat(line.cantidad || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[11px] tabular-nums">
                        ${parseFloat(line.precio_unitario || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[11px] font-black tabular-nums">
                        ${parseFloat(line.precio_total || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell className="text-right">
                        <div className="flex flex-col items-end">
                            <span className="font-mono text-[10px] font-bold text-zinc-600">{(pesoRelativo * 100).toFixed(4)}%</span>
                            <div className="w-12 h-1 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                                <div className="h-full bg-[#136191]/30" style={{ width: `${Math.min(pesoRelativo * 100, 100)}%` }} />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell className="text-right">
                        {line.apu_id ? (
                            <div className="flex flex-col items-end">
                                <span className={`font-mono text-[10px] font-bold ${vaeRubro === null ? 'text-zinc-400' : 'text-[#136191]'}`}>
                                    {vaeRubro === null ? 'N/D' : `${(vaeRubro * 100).toFixed(2)}%`}
                                </span>
                                <div className="w-12 h-1 bg-zinc-100 rounded-full mt-1 overflow-hidden">
                                    <div className={`h-full ${vaeRubro === null ? 'bg-zinc-300' : 'bg-[#136191]'}`} style={{ width: `${Math.max(0, (vaeRubro || 0) * 100)}%` }} />
                                </div>
                            </div>
                        ) : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                         <span className={`font-mono text-[10px] font-black ${vaeRubro === null ? 'text-zinc-400' : 'text-[#136191]'}`}>
                            {vaeRubro === null ? 'N/D' : `${(vaePonderado * 100).toFixed(4)}%`}
                         </span>
                    </TableCell>
                </TableRow>
            </React.Fragment>
        );
    };

    const projectVaeTotal = useMemo(() => {
        let totalVae = 0;
        budgetLines.forEach(line => {
            if (line.apu_id && apuDetails[line.apu_id]) {
                const vaeRubro = apuDetails[line.apu_id].vae;
                if (vaeRubro === null || vaeRubro === undefined) return;
                const pesoRelativo = calculatePesoRelativo(parseOperationalNumber(line.precio_total), projectTotal);
                totalVae += (vaeRubro * pesoRelativo);
            }
        });
        return totalVae;
    }, [budgetLines, projectTotal, apuDetails]);

    const selectedApuDetail = selectedLine?.apu_id ? apuDetails[selectedLine.apu_id] : null;
    const selectedApuIsLoading = selectedLine?.apu_id ? loadingApuIds.has(String(selectedLine.apu_id)) : false;
    const selectedApuResources = selectedApuDetail?.recursos || [];
    const selectedApuResourceGroups = useMemo(() => {
        const groups = CATEGORIAS_BASE.map((category) => ({
            ...category,
            lineas: [],
        }));
        const groupById = new Map(groups.map((group) => [group.id, group]));

        selectedApuResources.forEach((linea) => {
            const categoryId = resolveResourceMotherCategoryId(linea);
            const targetGroup = groupById.get(categoryId) || groupById.get(2);
            targetGroup.lineas.push(linea);
        });

        return groups.filter((group) => group.lineas.length > 0);
    }, [selectedApuResources]);
    const toggleApuResourceCategory = useCallback((categoryId) => {
        setCollapsedApuResourceCategories((prev) => (
            prev.includes(categoryId)
                ? prev.filter((id) => id !== categoryId)
                : [...prev, categoryId]
        ));
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-20">
                <Loader2 className="w-10 h-10 text-[#136191] animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Analizando Estructura de Proyecto...</p>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
            <div className="flex-1 flex min-h-0 flex-col gap-4">
                <div className="flex flex-col gap-2 rounded-[1.1rem] border border-[#ececec] bg-[#f3f3f1] px-4 py-3 shadow-[8px_8px_20px_#dddddd,-8px_-8px_20px_#ffffff] lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <h2 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-[#136191]">
                            <BarChart3 className="w-4 h-4" /> Desagregación
                        </h2>
                        <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                            Lectura tecnológica y VAE del presupuesto operativo
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                        <ProjectSegmentedSwitch
                            value={desagregacionViewMode}
                            onChange={setDesagregacionViewMode}
                            options={[
                                { value: 'edt', label: 'Por EDT' },
                                { value: 'consolidado', label: 'Consolidado' },
                            ]}
                            size="lg"
                            minSegmentWidth={126}
                            ariaLabel="Vista de desagregación"
                        />
                        <ProjectSectionReportButton
                            sectionLabel="Desagregación"
                            onClick={handleDownloadVaeReport}
                            disabled={generatingReport || !selectedPresId}
                            className={generatingReport ? 'animate-pulse' : ''}
                        />
                    </div>
                </div>
                {/* Tabla de Consolidado */}
                <Card className="flex-1 overflow-hidden rounded-[1.25rem] border border-[#ececec] bg-[#f7f7f5] shadow-[10px_10px_26px_#dddddd,-10px_-10px_26px_#ffffff] flex flex-col">
                    <CardHeader className={`${isCompactViewport ? 'py-3 px-3' : 'py-3 px-4'} border-b border-[#ececec] bg-[#f2f2f0] flex-shrink-0`}>
                        <div className={`flex gap-3 ${isCompactViewport ? 'flex-col' : 'items-center justify-between'}`}>
                            <div className="min-w-0 flex-none">
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#136191]">Desagregación Tecnológica</p>
                                <h3 className="mt-0.5 text-base font-black uppercase tracking-tight text-zinc-900 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4 text-[#136191]" />
                                    Formulario 1: Consolidado de Rubros
                                </h3>
                            </div>
                            
                            <div className={`flex min-w-0 items-center justify-end gap-2 ${isCompactViewport ? 'flex-wrap' : 'flex-nowrap'}`}>
                                <ControlRail className="w-[clamp(22rem,30vw,34rem)] flex-none px-2 py-1.5">
                                    <ControlRailSection className="min-w-0 flex-1 gap-2 pl-2 pr-1.5">
                                        <div className="min-w-0 flex-1">
                                            <ClearSearchField
                                                value={desagregacionSearchValue}
                                                onValueChange={setDesagregacionSearch}
                                                placeholder="Buscar rubro, EDT o CPC..."
                                                containerClassName="min-w-0 flex-1 rounded-[0.9rem] border border-white/16 bg-white shadow-[inset_2px_2px_6px_rgba(15,23,42,0.12),inset_-2px_-2px_6px_rgba(255,255,255,0.75)]"
                                                inputClassName="w-full bg-transparent py-2.5 pl-9 pr-8 text-[10px] font-bold text-zinc-800 outline-none placeholder:text-zinc-400 focus-visible:ring-0"
                                                searchIconClassName="h-3.5 w-3.5 text-zinc-500 group-focus-within:text-[#F39200]"
                                                onKeyDown={(event) => {
                                                    if (event.key !== 'Enter') return;
                                                    event.preventDefault();
                                                    if (desagregacionSearchMatches.length > 0) {
                                                        navigateDesagregacionSearchMatch(activeDesagregacionSearchIndex + 1);
                                                    }
                                                }}
                                            />
                                        </div>
                                        <ControlRailDivider className="h-7" />
                                        <button
                                            type="button"
                                            onClick={() => navigateDesagregacionSearchMatch(activeDesagregacionSearchIndex + 1)}
                                            disabled={desagregacionSearchMatches.length === 0}
                                            className={DESAGREGACION_DARK_PILL_BUTTON}
                                            title="Buscar siguiente coincidencia"
                                        >
                                            <ChevronDown className="h-3 w-3" />
                                            Sgte
                                        </button>
                                        <span className="min-w-[38px] flex-none text-right text-[9px] font-black uppercase tracking-[0.12em] text-white/55">
                                            {desagregacionSearchMatches.length > 0 && activeDesagregacionSearchIndex >= 0
                                                ? `${activeDesagregacionSearchIndex + 1}/${desagregacionSearchMatches.length}`
                                                : '0/0'}
                                        </span>
                                    </ControlRailSection>
                                </ControlRail>

                                {incompleteApuIds.length > 0 && (
                                    <ControlRail className="flex-none px-2 py-1.5">
                                        <ControlRailSection className="gap-2 pl-2 pr-1.5">
                                            <div className="min-w-[74px]">
                                                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Integridad CPC</p>
                                                <p className="text-sm font-black tabular-nums text-[#F39200]">
                                                    {incompleteApuIds.length} <span className="text-[9px] text-white/45">faltantes</span>
                                                </p>
                                            </div>
                                            <ControlRailDivider className="h-7" />
                                            <ControlRailIconButton
                                                type="button"
                                                onClick={navigateToNextIncomplete}
                                                tooltip="Saltar al siguiente rubro incompleto"
                                            >
                                                <Search className="h-4 w-4" />
                                            </ControlRailIconButton>
                                        </ControlRailSection>
                                    </ControlRail>
                                )}

                                <ControlRail className="flex-none px-2 py-1.5">
                                    <ControlRailSection className="gap-2 pl-2 pr-2">
                                        <div className="min-w-[86px]">
                                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">VAE consolidado</p>
                                            <p className="text-sm font-black tabular-nums text-sky-200">{(projectVaeTotal * 100).toFixed(2)}%</p>
                                        </div>
                                        <ControlRailDivider className="h-7" />
                                        <div className="min-w-[116px]">
                                            <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Monto del proyecto</p>
                                            <p className="text-sm font-black tabular-nums text-white">${projectTotal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                        </div>
                                    </ControlRailSection>
                                </ControlRail>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0 flex-1 overflow-hidden flex flex-col">
                        <div className="relative min-h-0 flex-1 overflow-hidden pb-6 pr-6">
                        <div 
                            ref={tableContainerRef}
                            className={`giproy-motion-scrollbar-hide h-full ${isCompactViewport ? 'overflow-auto' : 'overflow-y-auto'}`}
                        >
                            {loadingDetails ? (
                                <div className="h-full flex flex-col items-center justify-center p-20">
                                    <Loader2 className="w-8 h-8 text-[#136191] animate-spin mb-3" />
                                    <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400">Cargando líneas...</p>
                                </div>
                            ) : budgetLines.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center p-20 text-zinc-400 italic">
                                    <AlertCircle className="w-10 h-10 mb-2 opacity-20" />
                                    <p>No hay líneas registradas en este presupuesto</p>
                                </div>
                            ) : (
                                <Table className={isCompactViewport ? 'min-w-[920px]' : ''}>
                                    <TableHeader className="bg-white/90 backdrop-blur-md sticky top-0 z-20 border-b border-zinc-100">
                                        <TableRow className="hover:bg-transparent">
                                            <TableHead className="w-[80px] font-black uppercase text-[8px] tracking-widest py-2.5 px-6 text-left">Ítem</TableHead>
                                            <TableHead className="font-black uppercase text-[8px] tracking-widest py-2.5">Descripción del Rubro</TableHead>
                                            <TableHead className="w-[70px] font-black uppercase text-[8px] tracking-widest py-2.5 text-center">Unidad</TableHead>
                                            <TableHead className="w-[100px] font-black uppercase text-[8px] tracking-widest py-2.5 text-right">Cantidad</TableHead>
                                            <TableHead className="w-[100px] font-black uppercase text-[8px] tracking-widest py-2.5 text-right">P. Unitario ($)</TableHead>
                                            <TableHead className="w-[110px] font-black uppercase text-[8px] tracking-widest py-2.5 text-right">P. Global ($)</TableHead>
                                            <TableHead className="w-[100px] font-black uppercase text-[8px] tracking-widest py-2.5 text-right">Peso Relat. (%)</TableHead>
                                            <TableHead className="w-[100px] font-black uppercase text-[8px] tracking-widest py-2.5 text-right">VAE Rubro (%)</TableHead>
                                            <TableHead className="w-[100px] font-black uppercase text-[8px] tracking-widest py-2.5 text-right">VAE Pond. (%)</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {flatHierarchy.map((item, index) => renderRow(item, index))}
                                    </TableBody>
                                </Table>
                            )}
                        </div>
                        <MotionScrollbar targetRef={tableContainerRef} className="right-0" style={{ top: 42, bottom: isCompactViewport ? 24 : 4 }} />
                        {isCompactViewport ? (
                            <MotionScrollbar targetRef={tableContainerRef} orientation="horizontal" className="bottom-0" style={{ right: 24 }} />
                        ) : null}
                        </div>
                    </CardContent>
                </Card>

                {/* Panel de Desglose Industrial Light */}
                <AnimatePresence mode="wait">
                    {selectedLine && selectedLine.apu_id && (
                        <MotionDiv
                            key="detail-panel"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className={isCompactViewport ? 'min-h-[320px]' : 'h-1/3 min-h-[300px]'}
                        >
                            <Card className="h-full bg-white border-zinc-200 shadow-sm rounded-2xl overflow-hidden flex flex-col">
                                <CardHeader className={`${isCompactViewport ? 'py-2.5 px-4' : 'py-2.5 px-6'} bg-zinc-50 flex-shrink-0 border-b border-zinc-100`}>
                                    <div className={`flex items-center justify-between ${isCompactViewport ? 'flex-wrap gap-3' : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-xl bg-[#136191] flex items-center justify-center items-center shadow-sm">
                                                <Eye className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-[11px] font-black tracking-tight text-zinc-800">
                                                    Desglose Técnico: {normalizeDescriptionCapitalization(selectedLine.descripcion)}
                                                </CardTitle>
                                                <CardDescription className="text-[8px] font-bold uppercase tracking-widest text-[#136191]/80">
                                                    Análisis de VAE por recurso • Rubro {selectedLine.codigo_item || '#'}
                                                </CardDescription>
                                            </div>
                                        </div>
                                        
                                        <div className={`flex items-center gap-4 ${isCompactViewport ? 'flex-wrap w-full justify-between' : ''}`}>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[7.5px] font-black uppercase tracking-widest text-zinc-400">Directo Unit.</span>
                                                <span className="text-sm font-black font-mono tabular-nums text-zinc-700">
                                                    ${parseFloat(selectedLine.precio_unitario || 0).toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                                                </span>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                <span className="text-[7.5px] font-black uppercase tracking-widest text-zinc-400">VAE del Rubro</span>
                                                <span className={`text-sm font-black font-mono tabular-nums ${selectedApuDetail?.vae === null || selectedApuIsLoading ? 'text-zinc-400' : 'text-[#136191]'}`}>
                                                    {selectedApuIsLoading
                                                        ? '...'
                                                        : selectedApuDetail?.vae === null
                                                        ? 'N/D'
                                                        : `${((selectedApuDetail?.vae || 0) * 100).toFixed(2)}%`}
                                                </span>
                                            </div>
                                            <button 
                                                onClick={() => setSelectedLine(null)}
                                                className="p-2 hover:bg-zinc-200 rounded-xl transition-colors text-zinc-400 ml-2"
                                            >
                                                <X className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0 flex-1 overflow-hidden">
                                    <div className="relative h-full overflow-hidden pb-6 pr-6">
                                    <div ref={apuResourcesTableRef} className={`giproy-motion-scrollbar-hide h-full ${isCompactViewport ? 'overflow-auto' : 'overflow-y-auto'}`}>
                                        <Table className={`border-collapse ${isCompactViewport ? 'min-w-[860px]' : ''}`}>
                                            <TableHeader className="bg-white sticky top-0 z-10 border-b border-zinc-100">
                                                <TableRow className="hover:bg-transparent">
                                                    <TableHead className="w-[50px]"></TableHead>
                                                    <TableHead className="font-black uppercase text-[7.5px] tracking-[0.15em] py-2 text-zinc-400">Recurso / Insumo</TableHead>
                                                    <TableHead className="w-[90px] font-black uppercase text-[7.5px] tracking-[0.15em] py-2 text-zinc-400">Código CPC</TableHead>
                                                    <TableHead className="w-[90px] font-black uppercase text-[7.5px] tracking-[0.15em] py-2 text-right text-zinc-400">Cantidad</TableHead>
                                                    <TableHead className="w-[90px] font-black uppercase text-[7.5px] tracking-[0.15em] py-2 text-right text-zinc-400">Precio</TableHead>
                                                    <TableHead className="w-[90px] font-black uppercase text-[7.5px] tracking-[0.15em] py-2 text-right text-zinc-400">Subtotal</TableHead>
                                                    <TableHead className="w-[110px] font-black uppercase text-[7.5px] tracking-[0.15em] py-2 text-right text-zinc-400">Peso Rubro (%)</TableHead>
                                                    <TableHead className="w-[110px] font-black uppercase text-[7.5px] tracking-[0.15em] py-2 text-right text-zinc-400">VAE Recurso (%)</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {selectedApuIsLoading ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="py-10 text-center">
                                                            <div className="flex flex-col items-center gap-3 text-zinc-400">
                                                                <Loader2 className="h-6 w-6 animate-spin text-[#136191]" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Cargando recursos del APU...</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : selectedApuResources.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} className="py-10 text-center">
                                                            <div className="flex flex-col items-center gap-2 text-zinc-400">
                                                                <AlertCircle className="h-6 w-6 text-zinc-200" />
                                                                <span className="text-[9px] font-black uppercase tracking-widest">No se cargaron recursos para este APU</span>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ) : selectedApuResourceGroups.flatMap((group) => {
                                                    const isCollapsed = collapsedApuResourceCategories.includes(group.id);
                                                    const groupSubtotal = group.lineas.reduce((sum, linea) => (
                                                        sum + resolveApuLineOperationalSubtotal(linea, { moneyDecimals: 4 })
                                                    ), 0);
                                                    const groupRelative = selectedApuDetail?.costoDirecto
                                                        ? groupSubtotal / selectedApuDetail.costoDirecto
                                                        : 0;

                                                    return [
                                                    <TableRow key={`category-${group.id}`} className="bg-zinc-50/70 hover:bg-zinc-50 border-y border-zinc-100">
                                                        <TableCell colSpan={8} className="p-0">
                                                            <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleApuResourceCategory(group.id);
                                                                }}
                                                                className="w-full flex items-center justify-between gap-4 px-4 py-2.5 transition-all select-none group/cat"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="p-1 rounded-md bg-white border border-zinc-200 shadow-sm flex items-center justify-center transition-transform group-hover/cat:scale-110">
                                                                        <span className="text-[10px] leading-none">{group.icon}</span>
                                                                    </div>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">
                                                                        {group.nombre}
                                                                    </span>
                                                                    <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-300 ${isCollapsed ? '-rotate-90' : ''}`} />
                                                                </div>
                                                                <div className="flex items-center gap-5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                                    <span>
                                                                        Recursos: <span className="text-zinc-900 ml-1 tabular-nums">{group.lineas.length}</span>
                                                                    </span>
                                                                    <span>
                                                                        Subtotal: <span className="text-zinc-900 ml-1">${groupSubtotal.toLocaleString('es-EC', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                    </span>
                                                                    <span>
                                                                        % Rel.: <span className="text-[#F39200] ml-1">{(groupRelative * 100).toFixed(2)}%</span>
                                                                    </span>
                                                                </div>
                                                            </button>
                                                        </TableCell>
                                                    </TableRow>,
                                                    ...(isCollapsed ? [] : group.lineas.map((linea) => {
                                                        const resolvedCpc = resolveLineaCpc(linea);
                                                        const cpcCode = resolveCpcCode(resolvedCpc);
                                                        const isNestedApu = isNestedApuLine(linea);
                                                        const subtotal = resolveApuLineOperationalSubtotal(linea, { moneyDecimals: 4 });
                                                        const unitPrice = resolveApuLineOperationalUnitPrice(linea, { moneyDecimals: 2 });
                                                        const quantity = parseOperationalNumber(linea.cantidad);
                                                        const costoDirecto = selectedApuDetail?.costoDirecto || 0;
                                                        const pesoRecurso = subtotal / (costoDirecto || 1);
                                                        const hasCpc = Boolean(cpcCode);
                                                        const nestedApuVae = isNestedApu ? Number(linea?.apu_hijo?.vae_total || 0) : null;
                                                        const vaeRecurso = isNestedApu
                                                            ? pesoRecurso * nestedApuVae
                                                            : hasCpc
                                                            ? pesoRecurso * ((resolvedCpc?.porcentaje || 0) / 100)
                                                            : null;
                                                        const resourceDescription = normalizeDescriptionCapitalization(linea.recurso?.descripcion || linea.apu_hijo?.descripcion);

                                                        return (
                                                            <TableRow 
                                                                key={linea.id} 
                                                                className="hover:bg-zinc-50 border-b border-zinc-50 last:border-0 transition-colors cursor-pointer group/row"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (linea.recurso && !isNestedApu) handleOpenCpcModal(linea.recurso);
                                                                }}
                                                            >
                                                                <TableCell className="text-center py-2">
                                                                    <div className="mx-auto h-6 w-px bg-zinc-100 group-hover/row:bg-[#F39200]/30 transition-colors" />
                                                                </TableCell>
                                                                <TableCell className="font-bold text-[10px] text-zinc-700">
                                                                    <div className="flex items-center gap-2">
                                                                        {resourceDescription}
                                                                        {linea.recurso && !isNestedApu && <Search className="w-3 h-3 text-[#F39200] opacity-0 group-hover/row:opacity-100 transition-opacity" />}
                                                                    </div>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <span className={`font-mono text-[8px] font-bold tracking-wider px-1.5 py-0.5 rounded ${hasCpc ? 'text-[#F39200] bg-orange-50' : isNestedApu ? 'text-transparent' : 'text-zinc-400 border border-dashed border-zinc-200'}`}>
                                                                        {isNestedApu ? '' : (cpcCode || 'SIN CPC')}
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-[9px] tabular-nums text-zinc-500">
                                                                    {quantity.toLocaleString('es-EC', { minimumFractionDigits: 4 })}
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-[9px] tabular-nums text-zinc-500">
                                                                    ${unitPrice.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                                                                </TableCell>
                                                                <TableCell className="text-right font-mono text-[9px] font-bold text-zinc-700 tabular-nums">
                                                                    ${subtotal.toLocaleString('es-EC', { minimumFractionDigits: 2 })}
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <span className="font-mono text-[9px] font-bold text-zinc-400">
                                                                        {(pesoRecurso * 100).toFixed(2)}%
                                                                    </span>
                                                                </TableCell>
                                                                <TableCell className="text-right">
                                                                    <span className={`px-2 py-0.5 rounded-full font-mono text-[9px] font-bold tracking-tight ${
                                                                        vaeRecurso === null
                                                                            ? 'bg-zinc-50 text-zinc-400 border border-zinc-200'
                                                                            : vaeRecurso > 0.5
                                                                                ? 'bg-blue-50 text-[#136191] border border-blue-100'
                                                                                : 'bg-orange-50 text-[#E94E1B] border border-orange-100'
                                                                    }`}>
                                                                        {vaeRecurso === null ? 'N/D' : `${(vaeRecurso * 100).toFixed(2)}%`}
                                                                    </span>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })),
                                                ];
                                                })}
                                            </TableBody>
                                        </Table>
                                    </div>
                                    <MotionScrollbar targetRef={apuResourcesTableRef} className="right-0" style={{ top: 38, bottom: isCompactViewport ? 24 : 4 }} />
                                    {isCompactViewport ? (
                                        <MotionScrollbar targetRef={apuResourcesTableRef} orientation="horizontal" className="bottom-0" style={{ right: 24 }} />
                                    ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        </MotionDiv>
                    )}
                    
                    {!selectedLine && budgetLines.length > 0 && (
                        <MotionDiv
                            key="placeholder"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-24 flex items-center justify-center text-zinc-400 border-2 border-dashed border-zinc-200 rounded-2xl"
                        >
                            <div className="flex flex-col items-center gap-2">
                                <Search className="w-5 h-5 opacity-20" />
                                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Seleccione un rubro para analizar su composición técnica</p>
                            </div>
                        </MotionDiv>
                    )}
                </AnimatePresence>
                {/* Modal del Selector Global de CPC */}
                <AnimatePresence>
                    {showCpcModal && (
                        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/60 backdrop-blur-sm">
                            <MotionDiv
                                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                                className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col"
                            >
                                <div className="p-8 pb-4">
                                    <div className="flex items-center justify-between mb-6">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200] mb-1">
                                                {updatingApuCpc ? 'Clasificación del APU' : 'Maestro de Insumos'}
                                            </p>
                                            <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">
                                                {updatingApuCpc ? 'Asignar Código CPC al APU' : 'Asignar Código CPC'}
                                            </h3>
                                        </div>
                                        <button 
                                            onClick={() => setShowCpcModal(false)}
                                            className={APP_MODAL_CLOSE_BUTTON_CLASS}
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-4 mb-6">
                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">
                                            {updatingApuCpc ? 'APU seleccionado' : 'Recurso seleccionado'}
                                        </p>
                                        <p className="text-sm font-black text-zinc-800 leading-snug">
                                            {normalizeDescriptionCapitalization(updatingApuCpc?.descripcion || updatingRecurso?.descripcion)}
                                        </p>
                                    </div>

                                    <ClearSearchField
                                        value={normalizeTextInputValue(cpcSearchQuery)}
                                        onValueChange={handleCpcSearch}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Escape') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleCpcSearch('');
                                            }
                                        }}
                                        autoFocus
                                        placeholder="Buscar por código o descripción..."
                                        containerClassName="group"
                                        searchIconClassName="left-4 group-focus-within:text-[#F39200]"
                                        inputClassName="w-full h-14 pl-12 pr-10 bg-white border border-zinc-200 rounded-2xl font-bold text-sm shadow-inner focus:ring-2 focus:ring-[#F39200]/20"
                                    />
                                </div>

                                <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[400px] max-h-[400px] custom-scrollbar relative">
                                    {isSearchingCpc ? (
                                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] transition-all">
                                            <div className="bg-white p-6 rounded-3xl shadow-sm border border-zinc-100 flex flex-col items-center gap-3">
                                                <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Consultando catálogo...</p>
                                            </div>
                                        </div>
                                    ) : null}

                                    {!isSearchingCpc && cpcResults.length === 0 ? (
                                        <div className="py-10 text-center">
                                            <AlertCircle className="w-10 h-10 text-zinc-100 mx-auto mb-2" />
                                            <p className="text-xs font-bold text-zinc-400 uppercase">No se encontraron resultados</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 gap-2">
                                            {cpcResults.map((cpc) => (
                                                <button
                                                    key={cpc.id}
                                                    onClick={() => handleSaveCpc(cpc)}
                                                    className="w-full p-4 flex flex-col text-left hover:bg-orange-50 border border-zinc-50 hover:border-[#F39200]/30 rounded-2xl transition-all group/item"
                                                >
                                                    <div className="flex items-center justify-between mb-1">
                                                        <span className="text-[10px] font-black text-[#F39200] tracking-wider">{cpc.codCPC}</span>
                                                        <span className="text-[8px] font-black uppercase tracking-widest text-zinc-400 group-hover/item:text-[#F39200]/50 transition-colors">Seleccionar</span>
                                                    </div>
                                                    <span className="text-xs font-bold text-zinc-800 line-clamp-2 leading-tight">{normalizeDescriptionCapitalization(cpc.descripcion)}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex items-center justify-between">
                                    <p className="text-[10px] font-bold text-zinc-400 italic">Total: {cpcResults.length} coincidencias</p>
                                    <button 
                                        onClick={() => setShowCpcModal(false)}
                                        className="px-6 py-2.5 bg-white border border-zinc-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </MotionDiv>
                        </div>
                    )}
                </AnimatePresence>
                <CommonReportPreviewModal
                    isOpen={showReportPreview}
                    onClose={() => setShowReportPreview(false)}
                    preview={reportPreview}
                    onExportExcel={handleExportReportExcel}
                    onExportPdf={handleExportReportPdf}
                    onExportPdfFromExcel={handleExportReportPdfFromExcel}
                    exporting={generatingReport}
                />
                <ReportGenerationModal
                    isOpen={generatingReport}
                    title="Generando reporte"
                    message="Estamos preparando el reporte VAE. La descarga comenzará automáticamente cuando esté listo."
                />
            </div>
        </div>
    );
};

export default DesagregacionTab;
