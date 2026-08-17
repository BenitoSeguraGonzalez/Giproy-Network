import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Calculator,
  CheckCircle2,
  Download,
  FileText,
  Package,
  RefreshCw,
  Truck,
  Users,
  Wrench,
} from 'lucide-react';
import { polinomicaApi } from '../../api/polinomica';
import { presupuestosApi } from '../../api/presupuestos';
import reportingApi from '../../api/reporting';
import { extractBlobErrorMessage } from '../../utils/apiBlobErrors';
import { appAlert } from '../../utils/appDialog';
import CommonReportPreviewModal from '../reporting/CommonReportPreviewModal';
import ReportGenerationModal from '../reporting/ReportGenerationModal';
import { buildReportFileName, sanitizeReportContext } from '../../utils/reportFileName';
import { downloadBlobResponse } from '../../utils/blobDownload';
import { AuthContext } from '../../context/AuthContext';
import CatalogSidebarCard from '../ui/CatalogSidebarCard';
import AnimatedSelect from '../ui/AnimatedSelect';
import MotionScrollbar from '../ui/MotionScrollbar';
import ProjectSegmentedSwitch from './ProjectSegmentedSwitch';
import ProjectSectionReportButton from './ProjectSectionReportButton';
import { ControlRail, ControlRailDivider, ControlRailIconButton, ControlRailSection } from '../ui/ControlRail';
import {
  PORTABLE_WORKSPACE_EVENT,
  readPortableWorkspaceOverride,
  resolvePortableWorkspace,
} from '../../utils/portableWorkspace';

const parseNumber = (value) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => parseNumber(value).toLocaleString(undefined, { minimumFractionDigits: 2 });
const FORMULA_PANEL_RESIZER_WIDTH_PX = 12;
const FORMULA_LEFT_PANEL_MIN_PX = 480;
const FORMULA_RIGHT_PANEL_MIN_PX = 420;

const FORMULA_GRID_PANEL_CLASS =
  'flex min-w-0 flex-col overflow-hidden rounded-[1.15rem] border border-[#ececec] bg-white shadow-[6px_6px_16px_#e1e1e1,-6px_-6px_16px_#ffffff]';

const FORMULA_GRID_HEADER_CLASS =
  'flex flex-wrap items-center justify-between gap-3 border-b border-[#ececec] bg-[#f2f2f0] px-4 py-3';

const FORMULA_GRID_HEADER_ICON_CLASS =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-[0.9rem] border border-[#ececec] bg-[#ededed] text-[#F39200] shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff]';

const FORMULA_DARK_PILL_BUTTON =
  'inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[0.85rem] border border-white/8 bg-[#15181d] px-3.5 text-[9px] font-black uppercase tracking-[0.16em] text-white/82 shadow-[3px_3px_8px_rgba(0,0,0,0.32),-2px_-2px_6px_rgba(255,255,255,0.045)] transition-all duration-200 hover:border-white/14 hover:bg-[#1b1f25] hover:text-white disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:border-white/8 disabled:hover:bg-[#15181d] disabled:hover:text-white/82';

const FormulaPolinomicaTab = ({ projectId, activeRevision }) => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [formulaData, setFormulaData] = useState(null);
  const [resources, setResources] = useState([]);
  const [indicesCatalog, setIndicesCatalog] = useState([]);
  const [presupuestoId, setPresupuestoId] = useState(null);
  const [calculating, setCalculating] = useState(false);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportPreview, setReportPreview] = useState(null);
  const [showReportPreview, setShowReportPreview] = useState(false);
  const [activeCategory, setActiveCategory] = useState('EQUIPOS');
  const [activeTab, setActiveTab] = useState('INDICES');
  const [selectedType, setSelectedType] = useState('SIN_DESGLOSE');
  const formulaCompactScrollRef = useRef(null);
  const formulaCategoryScrollRef = useRef(null);
  const formulaResourcesScrollRef = useRef(null);
  const formulaResultsScrollRef = useRef(null);
  const formulaWorkbenchRef = useRef(null);
  const formulaResizeInteractionRef = useRef(null);
  const [formulaLeftPanelWidth, setFormulaLeftPanelWidth] = useState(null);
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
    moduleKey: 'formula-polinomica',
    width: viewport.width,
    height: viewport.height,
    forced: user?.role === 'superadmin' && forcedPortableWorkspace,
  });

  const categories = useMemo(
    () => [
      { id: 'EQUIPOS', name: 'Equipos y Herramientas', icon: Wrench, sc: 1, color: 'bg-blue-50 border-blue-200 text-blue-600' },
      { id: 'MATERIALES', name: 'Materiales', icon: Package, sc: 2, color: 'bg-green-50 border-green-200 text-green-600' },
      { id: 'TRANSPORTE', name: 'Transporte', icon: Truck, sc: 3, color: 'bg-yellow-50 border-yellow-200 text-yellow-600' },
      { id: 'MANO_OBRA', name: 'Mano de Obra', icon: Users, sc: 4, color: 'bg-purple-50 border-purple-200 text-purple-600' },
    ],
    [],
  );

  const resolvePresupuesto = useCallback(async () => {
    if (!projectId) return;
    setLoading(true);
    try {
      const response = await presupuestosApi.getByProyecto(projectId);
      const budgets = response.data;
      const currentPres = budgets.find((budget) => budget.revision === activeRevision?.revision) || budgets[0];
      if (!currentPres) {
        setError('No se encontró un presupuesto activo para este proyecto');
        return;
      }
      setPresupuestoId(currentPres.id);
    } catch (resolveError) {
      globalThis.reportClientError?.('[PolinomicaTab] Error resolving presupuesto:', resolveError);
      setError('Error al cargar presupuestos');
    } finally {
      setLoading(false);
    }
  }, [projectId, activeRevision?.revision]);

  const fetchIndicesCatalog = useCallback(async () => {
    try {
      const data = await polinomicaApi.getIndicesInec();
      setIndicesCatalog(data || []);
    } catch (catalogError) {
      globalThis.reportClientError?.('[PolinomicaTab] Error loading indices catalog:', catalogError);
    }
  }, []);

  const fetchResources = useCallback(async (budgetId) => {
    if (!budgetId) return;
    const data = await polinomicaApi.getResources(budgetId);
    setResources(data || []);
  }, []);

  const loadFormula = useCallback(async (budgetId) => {
    if (!budgetId) return;
    try {
      const loadedFormula = await polinomicaApi.getFormula(budgetId);
      if (
        loadedFormula
        && Array.isArray(loadedFormula.monomios)
        && loadedFormula.monomios.length === 0
        && Number(loadedFormula.resources_detected || 0) > 0
      ) {
        const finalType = loadedFormula.tipo || 'SIN_DESGLOSE';
        const regenerated = await polinomicaApi.regenerate(budgetId, finalType);
        setFormulaData(regenerated);
        if (regenerated?.tipo) setSelectedType(regenerated.tipo);
        return;
      }
      setFormulaData(loadedFormula);
      if (loadedFormula?.tipo) setSelectedType(loadedFormula.tipo);
    } catch (loadError) {
      if (loadError?.response?.status === 404) {
        setFormulaData(null);
      } else {
        globalThis.reportClientError?.('[PolinomicaTab] Error loading formula:', loadError);
        throw loadError;
      }
    }
  }, []);

  const loadData = useCallback(async (budgetId) => {
    if (!budgetId) return;
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadFormula(budgetId), fetchResources(budgetId), fetchIndicesCatalog()]);
    } catch {
      setError('Error crítico al cargar datos');
    } finally {
      setLoading(false);
    }
  }, [fetchIndicesCatalog, fetchResources, loadFormula]);

  useEffect(() => {
    resolvePresupuesto();
  }, [resolvePresupuesto]);

  useEffect(() => {
    if (presupuestoId) {
      loadData(presupuestoId);
    }
  }, [loadData, presupuestoId]);

  const persistAssignments = async (payload) => {
    if (!presupuestoId) return;
    try {
      setCalculating(true);
      const data = await polinomicaApi.saveAssignments(presupuestoId, payload);
      if (data?.id) {
        setFormulaData(data);
        if (data?.tipo) setSelectedType(data.tipo);
      } else {
        await loadFormula(presupuestoId);
      }
      await fetchResources(presupuestoId);
    } catch (assignmentError) {
      globalThis.reportClientError?.('[PolinomicaTab] Save assignment error:', assignmentError);
      setError('Error al guardar la asignación');
    } finally {
      setCalculating(false);
    }
  };

  const saveAssignment = async (recursoId, simbolo) => {
    await persistAssignments([{ recurso_id: recursoId, simbolo }]);
  };

  const saveFormulaIndices = async (payload) => {
    if (!presupuestoId) return;
    try {
      setCalculating(true);
      const data = await polinomicaApi.saveIndices(presupuestoId, payload);
      setFormulaData(data);
      await fetchResources(presupuestoId);
    } catch (indicesError) {
      globalThis.reportClientError?.('[PolinomicaTab] Save formula indices error:', indicesError);
      setError('Error al guardar la selección de índices');
    } finally {
      setCalculating(false);
    }
  };

  const generateFormula = async (typeToUse) => {
    if (!presupuestoId) return;
    const finalType = typeToUse || selectedType;
    setCalculating(true);
    try {
      const data = await polinomicaApi.regenerate(presupuestoId, finalType);
      setFormulaData(data);
      setSelectedType(finalType);
      await fetchResources(presupuestoId);
    } catch (generateError) {
      globalThis.reportClientError?.('[PolinomicaTab] Generate formula error:', generateError);
      const detail = generateError?.response?.data?.detail;
      setError(detail || 'Error al generar la fórmula');
    } finally {
      setCalculating(false);
    }
  };

  const assignSuggested = async () => {
    const pendingAssignments = filteredResources
      .filter((resource) => !resource.termino_actual && resource.termino_sugerido)
      .map((resource) => ({ recurso_id: resource.recurso_id, simbolo: resource.termino_sugerido }));
    if (pendingAssignments.length === 0) return;
    await persistAssignments(pendingAssignments);
  };

  const handleDownloadReport = async () => {
    if (!presupuestoId || !formulaData?.is_complete) return;
    try {
      setGeneratingReport(true);
      const response = await reportingApi.previewReport({
        report_type: 'polinomica',
        entity_ids: [presupuestoId],
      });
      setReportPreview(response.data);
      setShowReportPreview(true);
    } catch (previewError) {
      globalThis.reportClientError?.('Report generation error:', previewError);
      appAlert({ title: 'Error', message: 'No se pudo generar el reporte de Fórmula Polinómica.', tone: 'danger' });
    } finally {
      setGeneratingReport(false);
    }
  };

  const exportReport = async (format, fallbackMessage) => {
    if (!presupuestoId || !formulaData?.is_complete) return;
    try {
      setGeneratingReport(true);
      const response = await reportingApi.exportReport({
        report_type: 'polinomica',
        entity_ids: [presupuestoId],
        format,
      });
      downloadBlobResponse(
        response,
        buildReportFileName({
          reportLabel: 'Formula Polinomica',
          contextLabel: sanitizeReportContext(`Proyecto ${projectId || presupuestoId}`),
          revision: activeRevision ?? 1,
          extension: format === 'xlsx' ? 'xlsx' : 'pdf',
        }),
        format === 'xlsx' ? undefined : 'application/pdf',
      );
    } catch (exportError) {
      globalThis.reportClientError?.('Report export error:', exportError);
      appAlert({
        title: 'Error',
        message: await extractBlobErrorMessage(exportError, fallbackMessage),
        tone: 'danger',
      });
    } finally {
      setGeneratingReport(false);
    }
  };

  const handleExportReportExcel = async () => exportReport('xlsx', 'No se pudo exportar el reporte de Fórmula Polinómica.');
  const handleExportReportPdf = async () => exportReport('pdf', 'No se pudo exportar el reporte de Fórmula Polinómica en PDF.');
  const handleExportReportPdfFromExcel = async () => exportReport('pdf_excel', 'No se pudo exportar la fórmula polinómica como PDF desde Excel.');

  const filteredResources = useMemo(() => {
    const active = categories.find((category) => category.id === activeCategory);
    if (!active) return [];
    return resources.filter((resource) => {
      const code = resource.subcategoria_codigo !== null && resource.subcategoria_codigo !== undefined ? Number(resource.subcategoria_codigo) : null;
      if (active.sc === 2) {
        return code === 2 || code === 5 || code === null || code === undefined;
      }
      return code === active.sc;
    });
  }, [activeCategory, categories, resources]);

  const getCountBySc = useCallback(
    (sc) => {
      if (sc === 2) {
        return resources.filter((resource) => {
          const code = resource.subcategoria_codigo;
          return code === 2 || code === 5 || code === null || code === undefined;
        }).length;
      }
      return resources.filter((resource) => Number(resource.subcategoria_codigo) === sc).length;
    },
    [resources],
  );

  const terminos = ['B', 'C', 'D', 'E', 'M', 'P', 'R', 'X'];
  const resourcesDetected = Number(formulaData?.resources_detected ?? resources.length);
  const pendingCount = Number(formulaData?.resources_pending ?? resources.filter((resource) => !resource.termino_actual).length);
  const formulaIsComplete = Boolean(formulaData?.is_complete);
  const costoDirectoBase = parseNumber(formulaData?.costo_directo_total);
  const totalIndices = parseNumber(formulaData?.valor_total_indices);
  const cuadrillaFormula = formulaData?.formula_cuadrilla || '';
  const footerFormula = formulaData?.formula_general || '';
  const useWideWorkbench = !isCompactViewport && viewport.width >= 1440;
  const formulaWorkbenchGridStyle = useMemo(() => {
    if (!useWideWorkbench) return undefined;
    if (!Number.isFinite(formulaLeftPanelWidth)) {
      return {
        gridTemplateColumns: `minmax(${FORMULA_LEFT_PANEL_MIN_PX}px, 7fr) ${FORMULA_PANEL_RESIZER_WIDTH_PX}px minmax(${FORMULA_RIGHT_PANEL_MIN_PX}px, 5fr)`,
      };
    }
    return {
      gridTemplateColumns: `${formulaLeftPanelWidth}px ${FORMULA_PANEL_RESIZER_WIDTH_PX}px minmax(${FORMULA_RIGHT_PANEL_MIN_PX}px, 1fr)`,
    };
  }, [formulaLeftPanelWidth, useWideWorkbench]);

  useEffect(() => {
    if (!useWideWorkbench) {
      setFormulaLeftPanelWidth(null);
    }
  }, [useWideWorkbench]);

  useEffect(() => {
    if (!useWideWorkbench || Number.isFinite(formulaLeftPanelWidth)) return;
    const containerRect = formulaWorkbenchRef.current?.getBoundingClientRect?.();
    if (!containerRect || containerRect.width <= 0) return;
    const maxLeft = Math.max(
      FORMULA_LEFT_PANEL_MIN_PX,
      containerRect.width - FORMULA_PANEL_RESIZER_WIDTH_PX - FORMULA_RIGHT_PANEL_MIN_PX,
    );
    const defaultLeft = Math.round((containerRect.width - FORMULA_PANEL_RESIZER_WIDTH_PX) * (7 / 12));
    setFormulaLeftPanelWidth(Math.min(Math.max(defaultLeft, FORMULA_LEFT_PANEL_MIN_PX), maxLeft));
  }, [formulaData, formulaLeftPanelWidth, loading, resources.length, useWideWorkbench, viewport.width]);

  useEffect(() => {
    const handlePointerMove = (event) => {
      const interaction = formulaResizeInteractionRef.current;
      if (!interaction) return;
      const maxLeft = Math.max(
        FORMULA_LEFT_PANEL_MIN_PX,
        interaction.containerWidth - FORMULA_PANEL_RESIZER_WIDTH_PX - FORMULA_RIGHT_PANEL_MIN_PX,
      );
      const nextWidth = Math.min(
        Math.max(interaction.startWidth + (event.clientX - interaction.startX), FORMULA_LEFT_PANEL_MIN_PX),
        maxLeft,
      );
      setFormulaLeftPanelWidth(Math.round(nextWidth));
    };
    const handlePointerUp = () => {
      formulaResizeInteractionRef.current = null;
    };
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const handleFormulaResizePointerDown = useCallback((event) => {
    if (!useWideWorkbench) return;
    event.preventDefault();
    const container = formulaWorkbenchRef.current;
    const containerRect = container?.getBoundingClientRect?.();
    if (!containerRect || containerRect.width <= 0) return;
    const currentLeft = Number.isFinite(formulaLeftPanelWidth)
      ? formulaLeftPanelWidth
      : Math.max(FORMULA_LEFT_PANEL_MIN_PX, Math.round((containerRect.width - FORMULA_PANEL_RESIZER_WIDTH_PX) * (7 / 12)));
    formulaResizeInteractionRef.current = {
      startX: event.clientX,
      startWidth: currentLeft,
      containerWidth: containerRect.width,
    };
  }, [formulaLeftPanelWidth, useWideWorkbench]);

  if (loading && !resources.length && !formulaData) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center">
        <RefreshCw className="mb-4 h-10 w-10 animate-spin text-[#F39200]" />
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Cargando módulo de polinómica...</p>
      </div>
    );
  }

  return (
    <div data-formula-polinomica-workspace="true" className="flex h-full min-h-0 flex-col gap-4 overflow-hidden animate-in fade-in duration-500">
      {error && (
        <div className="mx-2 flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50 p-3 text-rose-600 animate-in slide-in-from-top-2">
          <AlertCircle className="h-4 w-4" />
          <p className="text-xs font-bold">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-rose-400 hover:text-rose-600">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <div className={`shrink-0 rounded-[1.1rem] border border-zinc-100 bg-white px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.03)] ${isCompactViewport ? 'flex flex-col gap-2' : 'flex items-center justify-between gap-2'}`}>
        <div>
          <h2 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-rose-500">
            <Calculator className="h-4 w-4" /> Fórmula Polinómica
          </h2>
          <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">
            Índices, cuadrilla tipo y fórmula general alineados con el método Delphi
          </p>
        </div>
        <div className={`flex items-center gap-3 ${isCompactViewport ? 'self-center' : ''}`}>
          <ProjectSegmentedSwitch
            value={selectedType}
            onChange={generateFormula}
            disabled={calculating}
            options={[
              { value: 'SIN_DESGLOSE', label: 'Estándar' },
              { value: 'CON_DESGLOSE', label: 'Con desglose' },
            ]}
            size="lg"
            minSegmentWidth={142}
            ariaLabel="Tipo de fórmula polinómica"
          />
          <ProjectSectionReportButton
            sectionLabel="Fórmula Polinómica"
            onClick={handleDownloadReport}
            disabled={generatingReport || !presupuestoId || !formulaIsComplete}
            className={generatingReport ? 'animate-pulse' : ''}
          />
        </div>
      </div>

      <div className={`flex shrink-0 gap-3 ${isCompactViewport ? 'flex-col' : 'items-stretch'}`}>
        <ControlRail className={`${isCompactViewport ? 'w-full min-w-0 flex-none' : 'min-w-[280px] flex-[1_1_22rem]'} px-2 py-1.5`}>
          <ControlRailSection className="min-w-0 flex-1 gap-2 pl-2 pr-1.5">
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Modo</p>
              <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-white">
                {selectedType === 'CON_DESGLOSE' ? 'Desglose manual' : 'Estándar'}
              </p>
            </div>
            <ControlRailDivider className="h-7" />
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Recursos</p>
              <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-white/82">
                {resourcesDetected} detectados
              </p>
            </div>
            <ControlRailDivider className="h-7" />
            <div className="min-w-0 flex-1">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Estado</p>
              <p className={`truncate text-[10px] font-black uppercase tracking-[0.16em] ${formulaIsComplete ? 'text-emerald-300' : 'text-[#F39200]'}`}>
                {formulaIsComplete ? 'Fórmula completa' : `${pendingCount} pendientes`}
              </p>
            </div>
          </ControlRailSection>
        </ControlRail>

        <ControlRail className={`${isCompactViewport ? 'w-full min-w-0 flex-none overflow-x-auto' : 'min-w-[360px] flex-[1.2_1_28rem]'} px-2 py-1.5`}>
          <ControlRailSection className="min-w-0 flex-1 justify-center gap-3 pl-2 pr-2">
            <div className="min-w-[72px] text-center">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Pendientes</p>
              <p className={`text-sm font-black tabular-nums ${pendingCount > 0 ? 'text-[#F39200]' : 'text-emerald-300'}`}>
                {pendingCount} <span className="text-[9px] text-white/40">/ {resourcesDetected}</span>
              </p>
            </div>
            <ControlRailDivider className="h-7" />
            <div className="min-w-[74px] text-center">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Suma coef.</p>
              <p className="text-sm font-black italic tabular-nums text-sky-200">{formulaIsComplete ? '1.000' : 'Pend.'}</p>
            </div>
            <ControlRailDivider className="h-7" />
            <div className="min-w-[96px] text-center">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Directo base</p>
              <p className="text-sm font-black tabular-nums text-white">${formatCurrency(costoDirectoBase)}</p>
            </div>
            <ControlRailDivider className="h-7" />
            <div className="min-w-[96px] text-center">
              <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Total índices</p>
              <p className="text-sm font-black tabular-nums text-white">${formatCurrency(totalIndices)}</p>
            </div>
          </ControlRailSection>
        </ControlRail>

        <ControlRail className={`${isCompactViewport ? 'w-full min-w-0 flex-none overflow-x-auto' : 'min-w-[290px] flex-[0.8_1_18rem]'} px-2 py-1.5`}>
          <ControlRailSection className="min-w-0 flex-1 justify-end gap-2 pl-2 pr-2">
            <button
              type="button"
              onClick={assignSuggested}
              disabled={calculating || !resources.some((resource) => !resource.termino_actual && resource.termino_sugerido)}
              className={`${FORMULA_DARK_PILL_BUTTON} text-[#F39200]`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              ASIGNAR SUGERIDOS
            </button>
            <ControlRailDivider className="h-7" />
            <ControlRailIconButton
              type="button"
              onClick={() => { resolvePresupuesto(); if (presupuestoId) loadData(presupuestoId); }}
              tooltip="Forzar recarga de presupuesto y recursos"
            >
              <RefreshCw className="h-4 w-4" />
            </ControlRailIconButton>
            <ControlRailIconButton
              type="button"
              onClick={() => generateFormula()}
              tooltip="Refrescar cálculos"
            >
              <Calculator className={`h-4 w-4 ${calculating ? 'animate-pulse' : ''}`} />
            </ControlRailIconButton>
            <ControlRailIconButton
              type="button"
              onClick={handleExportReportExcel}
              disabled={generatingReport || !presupuestoId || !formulaIsComplete}
              tooltip="Descargar reporte Excel"
              className={generatingReport ? 'animate-pulse' : ''}
            >
              <Download className="h-4 w-4" />
            </ControlRailIconButton>
            <ControlRailIconButton
              type="button"
              onClick={handleExportReportPdf}
              disabled={generatingReport || !presupuestoId || !formulaIsComplete}
              tooltip="Exportar reporte PDF"
            >
              <FileText className="h-4 w-4" />
            </ControlRailIconButton>
          </ControlRailSection>
        </ControlRail>
      </div>

      <section
        ref={(node) => {
          formulaCompactScrollRef.current = node;
          formulaWorkbenchRef.current = node;
        }}
        className={`relative min-h-0 flex-1 pb-3 ${useWideWorkbench ? 'grid' : 'giproy-motion-scrollbar-hide flex flex-col gap-4 overflow-y-auto pr-6'}`}
        style={formulaWorkbenchGridStyle}
      >
        <div className={`${useWideWorkbench ? 'min-h-0' : 'min-h-[360px]'} ${FORMULA_GRID_PANEL_CLASS}`}>
          <div className={FORMULA_GRID_HEADER_CLASS}>
            <div className="flex items-center gap-3">
              <span className={FORMULA_GRID_HEADER_ICON_CLASS}>
                <Package className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-900">Recursos del presupuesto</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">{filteredResources.length} visibles en la categoria activa</p>
              </div>
            </div>
          </div>
          <div className={`min-h-0 flex-1 ${useWideWorkbench ? 'grid grid-cols-[220px_minmax(0,1fr)]' : 'flex flex-col'}`}>
            <aside
              ref={formulaCategoryScrollRef}
              className={`${useWideWorkbench ? 'giproy-motion-scrollbar-hide relative min-h-0 overflow-y-auto border-r border-gray-100 p-3 pr-8' : 'border-b border-gray-100 p-3'}`}
            >
              <div className={`${useWideWorkbench ? 'space-y-2' : 'grid grid-cols-1 gap-2 sm:grid-cols-2'}`}>
                {categories.map((category) => (
                  <CatalogSidebarCard
                    key={category.id}
                    compact
                    codeNode={<span className="mb-1 block text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">Categoría {category.sc}</span>}
                    title={category.name}
                    displayTitle={null}
                    tooltipText={category.name}
                    count={getCountBySc(category.sc)}
                    footer={category.name}
                    footerVariant="description"
                    active={activeCategory === category.id}
                    expanded={activeCategory === category.id}
                    onClick={() => setActiveCategory(category.id)}
                    leading={<div className={`rounded-xl p-2 ${activeCategory === category.id ? 'border border-zinc-200 bg-white text-zinc-600' : category.color}`}><category.icon className="h-4 w-4" /></div>}
                  />
                ))}
              </div>
              {useWideWorkbench ? (
                <MotionScrollbar targetRef={formulaCategoryScrollRef} className="right-1" style={{ top: 8, bottom: 8 }} />
              ) : null}
            </aside>

            <div className="relative min-h-0 flex-1 overflow-hidden pb-14 pr-7">
            <div ref={formulaResourcesScrollRef} className="giproy-motion-scrollbar-hide h-full overflow-auto">
              <table className="w-full min-w-[860px] border-collapse text-left">
                <thead className="sticky top-0 z-10 border-b border-[#ececec] bg-[#f7f7f5]">
                  <tr className="text-[10px] font-black uppercase tracking-widest leading-none text-gray-400">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Término</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3">Unidad</th>
                    <th className="px-4 py-3 text-right">Cantidad</th>
                    <th className="px-4 py-3 text-right">C. Directo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredResources.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="px-4 py-8 text-center font-medium italic text-gray-400">
                        {loading ? 'Cargando recursos del presupuesto...' : 'No se encontraron recursos del presupuesto en esta categoría.'}
                      </td>
                    </tr>
                  ) : (
                    filteredResources.map((resource, idx) => (
                      <tr key={resource.recurso_id} className="group text-xs text-gray-700 hover:bg-blue-50/50">
                        <td className="px-4 py-2 font-mono text-[10px] text-gray-400">{String(idx + 1).padStart(4, '0')}</td>
                        <td className="px-4 py-2">
                          <AnimatedSelect
                            value={resource.termino_actual || ''}
                            displayValue={resource.termino_actual || '-'}
                            onChange={(event) => saveAssignment(resource.recurso_id, event.target.value)}
                            className={`w-fit min-w-[48px] rounded-xl border border-transparent bg-transparent px-0 py-1 text-sm font-black italic transition-colors hover:border-orange-100 hover:bg-orange-50 hover:px-2 focus-visible:border-[#F39200]/40 focus-visible:bg-orange-50 focus-visible:px-2 focus-visible:outline-none [&_svg]:h-3.5 [&_svg]:w-3.5 [&_svg]:text-blue-600 ${
                              resource.termino_actual ? 'text-orange-600' : 'text-gray-400'
                            }`}
                            dropdownMinWidth={160}
                            optionTitle={false}
                          >
                            <option value="">(Sin asignar)</option>
                            {terminos.map((termino) => (
                              <option key={termino} value={termino}>{termino}</option>
                            ))}
                          </AnimatedSelect>
                        </td>
                        <td className="px-4 py-2 text-[10px] font-medium text-gray-500">{resource.codigo}</td>
                        <td className="max-w-[240px] truncate px-4 py-2" title={resource.descripcion}>{resource.descripcion}</td>
                        <td className="px-4 py-2 text-gray-400">{resource.unidad}</td>
                        <td className="px-4 py-2 text-right font-mono">{parseNumber(resource.cantidad_total).toFixed(4)}</td>
                        <td className="px-4 py-2 text-right font-mono">${formatCurrency(resource.costo_total)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <MotionScrollbar targetRef={formulaResourcesScrollRef} className="right-0" style={{ top: 42, bottom: 56 }} />
            <MotionScrollbar targetRef={formulaResourcesScrollRef} orientation="horizontal" className="bottom-6" style={{ left: 18, right: 34 }} />
            </div>
          </div>
        </div>

        {useWideWorkbench ? (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-label="Ajustar ancho entre recursos e índices"
            onPointerDown={handleFormulaResizePointerDown}
            className="group relative z-20 flex min-h-[360px] w-3 shrink-0 cursor-col-resize items-stretch justify-center self-stretch bg-transparent"
          >
            <div className="w-px bg-zinc-200 transition-colors duration-150 group-hover:bg-[#F39200]" />
            <div className="pointer-events-none absolute inset-y-0 flex items-center">
              <div className="h-14 w-1.5 rounded-full bg-zinc-200 transition-colors duration-150 group-hover:bg-[#F39200]/55" />
            </div>
          </div>
        ) : null}

        <div className={`${useWideWorkbench ? 'min-h-0' : 'min-h-[360px]'} ${FORMULA_GRID_PANEL_CLASS}`}>
          <div className={FORMULA_GRID_HEADER_CLASS}>
            <div className="flex items-center gap-3">
              <span className={FORMULA_GRID_HEADER_ICON_CLASS}>
                <Calculator className="h-4 w-4" />
              </span>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-zinc-900">Coeficientes e índices</p>
                <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">Lectura normativa de la fórmula</p>
              </div>
            </div>
            <ProjectSegmentedSwitch
              value={activeTab}
              onChange={setActiveTab}
              options={[
                { value: 'INDICES', label: 'Índices' },
                { value: 'CUADRILLA', label: 'Cuadrilla' },
              ]}
              size="lg"
              ariaLabel="Vista de fórmula polinómica"
            />
          </div>

          <div className="relative min-h-0 flex-1 overflow-hidden pb-14 pr-7">
          <div ref={formulaResultsScrollRef} className="giproy-motion-scrollbar-hide h-full overflow-auto rounded-b-[0.9rem]">
            {activeTab === 'INDICES' ? (
              <table className="w-full min-w-[760px] border-collapse text-left">
                <thead className="sticky top-0 z-10 border-b border-[#ececec] bg-[#f7f7f5]">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Término</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Descripción de índice</th>
                    <th className="px-4 py-3 text-right">C. Directo</th>
                    <th className="px-4 py-3 text-right">Coeficiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {formulaData?.monomios?.map((monomio, index) => (
                    <tr key={monomio.id} className="transition-colors hover:bg-gray-50">
                      <td className="px-4 py-2 font-mono text-[10px] text-gray-400">{String(index + 1).padStart(4, '0')}</td>
                      <td className="px-4 py-2 text-base font-black italic text-orange-600">{monomio.simbolo}</td>
                      <td className="px-4 py-2 text-[10px] text-gray-500">{monomio.indice_codigo || '---'}</td>
                      <td className="min-w-[280px] px-4 py-2 text-xs">
                        {monomio.indice_inec_id || indicesCatalog.length > 0 ? (
                          <AnimatedSelect
                            value={String(monomio.indice_inec_id || '')}
                            onChange={(event) =>
                              saveFormulaIndices({
                                monomios: [{ simbolo: monomio.simbolo, indice_inec_id: event.target.value ? Number(event.target.value) : null }],
                              })
                            }
                            className="w-full border-0 bg-transparent p-0 text-xs font-medium text-zinc-700"
                          >
                            <option value="">(Sin índice)</option>
                            {indicesCatalog.map((indice) => (
                              <option key={indice.id} value={indice.id}>
                                {indice.codigo} - {indice.descripcion}
                              </option>
                            ))}
                          </AnimatedSelect>
                        ) : (
                          <span className="font-medium text-zinc-700">{monomio.indice_descripcion || '(Sin índice)'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right font-mono text-xs">${formatCurrency(monomio.subtotal_termino)}</td>
                      <td className="px-4 py-2 text-right font-mono text-base font-black text-gray-900">{monomio.coeficiente}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full min-w-[920px] border-collapse text-left">
                <thead className="sticky top-0 z-10 border-b border-[#ececec] bg-[#f7f7f5]">
                  <tr className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Índice</th>
                    <th className="px-4 py-3">Recurso</th>
                    <th className="px-4 py-3 text-right">Salario / Precio</th>
                    <th className="px-4 py-3 text-right">SHR</th>
                    <th className="px-4 py-3 text-right">Trabajo</th>
                    <th className="px-4 py-3 text-right">C. Directo</th>
                    <th className="px-4 py-3 text-right">Coeficiente</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {formulaData?.cuadrilla_tipo?.map((item, index) => (
                    <tr key={item.id} className="text-xs transition-colors hover:bg-blue-50/50">
                      <td className="px-4 py-2 font-mono text-[10px] text-gray-400">{String(index + 1).padStart(4, '0')}</td>
                      <td className="min-w-[280px] px-4 py-2">
                        {item.indice_inec_id || indicesCatalog.length > 0 ? (
                          <AnimatedSelect
                            value={String(item.indice_inec_id || '')}
                            onChange={(event) =>
                              saveFormulaIndices({
                                cuadrilla: [{ recurso_id: item.recurso_id, indice_inec_id: event.target.value ? Number(event.target.value) : null }],
                              })
                            }
                            className="w-full border-0 bg-transparent p-0 text-xs font-medium text-zinc-700"
                          >
                            <option value="">(Sin índice)</option>
                            {indicesCatalog.map((indice) => (
                              <option key={indice.id} value={indice.id}>
                                {indice.codigo} - {indice.descripcion}
                              </option>
                            ))}
                          </AnimatedSelect>
                        ) : (
                          <span className="font-medium text-zinc-700">{item.indice_descripcion || '(Sin índice)'}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 font-medium text-gray-800">{item.recurso_descripcion}</td>
                      <td className="px-4 py-2 text-right font-mono text-zinc-600">${formatCurrency(item.salario_minimo)}</td>
                      <td className="px-4 py-2 text-right font-mono text-zinc-600">{parseNumber(item.cantidad_hh).toFixed(4)}</td>
                      <td className="px-4 py-2 text-right font-mono text-zinc-600">{parseNumber(item.trabajo).toFixed(4)}</td>
                      <td className="px-4 py-2 text-right font-mono text-zinc-600">${formatCurrency(item.costo_directo)}</td>
                      <td className="px-4 py-2 text-right font-mono font-black text-blue-700">{(parseNumber(item.coeficiente_incidencia) * 100).toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          <MotionScrollbar targetRef={formulaResultsScrollRef} className="right-0" style={{ top: 42, bottom: 56 }} />
          <MotionScrollbar targetRef={formulaResultsScrollRef} orientation="horizontal" className="bottom-6" style={{ left: 18, right: 34 }} />
          </div>

          <div className="border-t border-[#ececec] bg-[#f2f2f0] p-3 text-center">
            <p className="text-[10px] italic text-gray-600">
              Fórmula Polinómica General:{' '}
              <span className="font-bold text-blue-700">
                {formulaIsComplete ? footerFormula || 'PR = P0 (...)' : 'Pendiente de completar asignaciones'}
              </span>
            </p>
            {cuadrillaFormula && (
              <p className="mt-2 text-[10px] italic text-gray-600">
                Fórmula Polinómica Cuadrilla: <span className="font-bold text-blue-700">{cuadrillaFormula}</span>
              </p>
            )}
          </div>
        </div>
        {!useWideWorkbench ? (
          <MotionScrollbar targetRef={formulaCompactScrollRef} className="right-0" style={{ top: 0, bottom: 4 }} />
        ) : null}
      </section>

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
        message="Estamos preparando la fórmula polinómica. La descarga comenzará automáticamente cuando esté lista."
      />
    </div>
  );
};

export default FormulaPolinomicaTab;
