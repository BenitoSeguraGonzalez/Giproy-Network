import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import apusApi from '../api/apus';
import recursosApi from '../api/recursos';
import subcategoriasItemsApi from '../api/subcategoriasItems';
import basesTrabajoApi from '../api/basesTrabajo';
import reportingApi from '../api/reporting';
import { maestrosApi } from '../api/maestros';
import { AuthContext } from '../context/AuthContext';
import AnimatedSelect from '../components/ui/AnimatedSelect';

/**
 * @typedef {import('../api/api-client').Schemas} Schemas
 */

import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2, AlertCircle, Check, ArrowLeft, Layers, FolderOpen,
    Copy, Edit2, ClipboardList, Database, Plus, Calculator, X,
    ArrowRight, FileText, Save, Search, ChevronRight, ChevronDown,
    PlusCircle, Info, LayoutGrid, CheckCircle2,
    FileSpreadsheet, Package, Calendar, Download,
    PanelLeftClose, PanelLeftOpen,
    SpellCheck, GripVertical
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LiquidButton } from '../components/ui/liquid-button';
import BulkDeleteConfirmModal from '../components/precios-unitarios/BulkDeleteConfirmModal';
import ResourceEditorModal from '../components/precios-unitarios/ResourceEditorModal';
import ImportFormatHint from '../components/precios-unitarios/ImportFormatHint';
import utilsApi from '../api/utils';
import SearchableSelect from '../components/ui/searchable-select';
import { AppModalShell, AppModalHeader } from '../components/ui/app-modal';
import CatalogSidebarCard from '../components/ui/CatalogSidebarCard';
import ClearSearchField from '../components/ui/ClearSearchField';
import SoftSelectToggle from '../components/ui/SoftSelectToggle';
import CodeColorizer from '../utils/codeColorizer';
import { normalizeTextInputValue } from '../utils/normalizeInputValue';
import { useFormatters } from '../hooks/useFormatters';
import { appAlert, appConfirm } from '../utils/appDialog';
import { roundDecimal } from '../utils/math';
import {
    divideDecimalNumber,
    roundDecimalNumber,
    sumDecimalNumber,
    toDecimalNumber,
} from '../utils/decimalNumbers';
import {
    resolveApuLineOperationalSubtotal,
    resolveApuLineOperationalUnitPrice,
} from '../utils/operationalNumbers';
import CommonReportPreviewModal from '../components/reporting/CommonReportPreviewModal';
import ReportGenerationModal from '../components/reporting/ReportGenerationModal';
import { extractBlobErrorMessage } from '../utils/apiBlobErrors';
import {
    readPortableWorkspaceOverride,
    resolvePortableWorkspace
} from '../utils/portableWorkspace';
import { buildOmniClassOptions, getOmniClassTableForApu, getOmniClassTableForResourceCategory } from '../utils/omniclass';
import { includesNormalized, normalizeSearchToken } from '../utils/normalizeSearch';
import { buildReportFileName, sanitizeReportContext } from '../utils/reportFileName';
import { downloadBlobResponse } from '../utils/blobDownload';
import MarketplaceOriginBadgeSet from '../components/marketplace/MarketplaceOriginBadgeSet';
import useMarketplaceOrigin from '../hooks/useMarketplaceOrigin';
import { buildNestedApuEditConfirmConfig } from '../utils/nestedApuEditing';
import * as descriptionCapitalization from '../utils/descriptionCapitalization';
import { findMatchingUnit, resolveApuLineUnitDescription, resolveUnitDescription, resolveUnitId } from '../utils/unitOptions';

// --- Constantes de Categorías ---
const CATEGORIAS_BASE = [
    { id: 1, nombre: 'Equipos y Herramientas', icon: '🔧', color: 'text-blue-600' },
    { id: 2, nombre: 'Materiales', icon: '📦', color: 'text-green-600' },
    { id: 3, nombre: 'Transporte', icon: '🚚', color: 'text-yellow-600' },
    { id: 4, nombre: 'Mano de Obra', icon: '👥', color: 'text-purple-600' },
    { id: 5, nombre: 'Análisis de Precios Unitarios', icon: '📑', color: 'text-orange-600' }, // Recursos APU
];

// Variante visual reversible para la lista lateral de subcategorias APU.
// Si no convence, basta con devolver este flag a false para restaurar el layout anterior.
const USE_ENHANCED_APU_SUBCATEGORY_LIST = true;

import ErrorBoundary from '../components/ErrorBoundary';

const APU_EDITOR_GLOBAL_RENDIMIENTO_STORAGE_KEY = 'giproy_apu_editor_global_rendimiento_activado';
const APU_STATUS_FILTER_OPTIONS = [
    { id: 'all', label: 'Todos' },
    { id: 'pending', label: 'Pendientes' },
    { id: 'reviewed', label: 'Revisados' },
];

const PROJECT_APU_ENTRY = 'project';
const PROJECT_APU_RETURN = 'project';
const PROJECT_APU_RETURN_TAB = 'presupuesto';

const readApuEditorGlobalRendimientoPreference = () => {
    if (typeof window === 'undefined') return true;
    try {
        const storedValue = window.localStorage.getItem(APU_EDITOR_GLOBAL_RENDIMIENTO_STORAGE_KEY);
        if (storedValue === null) return true;
        return storedValue !== 'false';
    } catch {
        return true;
    }
};

const persistApuEditorGlobalRendimientoPreference = (value) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(
            APU_EDITOR_GLOBAL_RENDIMIENTO_STORAGE_KEY,
            value ? 'true' : 'false'
        );
    } catch {
        // Si el storage no está disponible, el editor conserva el fallback activado.
    }
};

// --- Auxiliares ---
const renderUnidad = (u) => {
    if (!u) return '-';
    if (typeof u === 'object') return normalizeDisplayUnit(u.descripcion || u.nombre || u);
    return normalizeDisplayUnit(u);
};

const renderApuDescription = (value) => normalizeDescriptionCapitalization(value);
const renderSubcategoryDescription = (value) => normalizeSubcategoryDisplay(value);

const cleanClipboardLine = (value) => (value || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r/g, '')
    .trim();

const looksLikeRowLabel = (value) => {
    const normalized = cleanClipboardLine(value);
    if (!normalized || normalized.length > 10) return false;
    if (!/^[\dA-Za-z._-]+$/.test(normalized)) return false;
    return /\d/.test(normalized) || /[._-]/.test(normalized);
};

const normalizeClipboardText = (value) => cleanClipboardLine(value).replace(/\s+/g, ' ');

const hasPathInApuGraph = (graph, sourceId, targetId, visited = new Set()) => {
    const normalizedSourceId = Number(sourceId || 0);
    const normalizedTargetId = Number(targetId || 0);
    if (!normalizedSourceId || !normalizedTargetId) return false;
    if (normalizedSourceId === normalizedTargetId) return true;
    if (visited.has(normalizedSourceId)) return false;
    visited.add(normalizedSourceId);

    const childIds = graph.get(normalizedSourceId) || [];
    for (const childId of childIds) {
        if (Number(childId) === normalizedTargetId) {
            return true;
        }
        if (hasPathInApuGraph(graph, Number(childId), normalizedTargetId, visited)) {
            return true;
        }
    }

    return false;
};

const parseApuImportLine = (line, unidades = []) => {
    const cols = line.split('\t').map(cleanClipboardLine);
    if (cols.length === 0 || !cols.some(Boolean)) return null;

    const offset = cols.length > 1 && looksLikeRowLabel(cols[0]) && cols[1] ? 1 : 0;
    const scopedCols = cols.slice(offset);

    // Standard detection: Description(0) | Unit(1) | OmniCode(2) | OmniTitle(3)
    const descripcion = normalizeClipboardText(scopedCols[0] || '');
    const unidad = cleanClipboardLine(scopedCols[1] || '');
    const omniclass_codigo = cleanClipboardLine(scopedCols[2] || '');
    const omniclass_titulo = cleanClipboardLine(scopedCols[3] || '');

    if (descripcion && unidad) {
        return { descripcion, unidad, omniclass_codigo, omniclass_titulo };
    }

    // Fuzzy matching fallback for plain text (original logic)
    const normalizedLine = normalizeClipboardText(line);
    const tokens = normalizedLine.split(/\s+/).map(cleanClipboardLine);
    const fuzzyTokens = (tokens.length > 1 && looksLikeRowLabel(tokens[0]) && tokens[1]) ? tokens.slice(1) : tokens;
    const fuzzyLine = normalizeClipboardText(fuzzyTokens.join(' '));
    const validUnits = [...new Set((unidades || []).map((item) => cleanClipboardLine(typeof item === 'object' ? item.descripcion : item)).filter(Boolean))]
        .sort((a, b) => b.length - a.length);

    for (const candidateUnit of validUnits) {
        const normalizedUnit = normalizeClipboardText(candidateUnit);
        if (!normalizedUnit) continue;
        if (fuzzyLine.toLowerCase().endsWith(` ${normalizedUnit.toLowerCase()}`)) {
            const candidateDescripcion = normalizeClipboardText(
                fuzzyLine.slice(0, fuzzyLine.length - normalizedUnit.length)
            );
            if (candidateDescripcion) {
                return { descripcion: candidateDescripcion, unidad: normalizedUnit };
            }
        }
    }

    if (fuzzyTokens.length >= 2) {
        return {
            descripcion: normalizeClipboardText(fuzzyTokens.slice(0, -1).join(' ')),
            unidad: cleanClipboardLine(fuzzyTokens[fuzzyTokens.length - 1])
        };
    }

    return null;
};

const buildApuImportPreview = (rawText, apus, unidades) => {
    // Lista de unidades normalizada para búsqueda inteligente
    const systemUnits = (unidades || []).map(u => ({
        id: u.id,
        name: cleanClipboardLine(typeof u === 'object' ? u.descripcion : u).toLowerCase(),
        full: cleanClipboardLine(typeof u === 'object' ? u.descripcion_completa : '').toLowerCase()
    }));

    const findBestUnit = (rawUnit) => {
        if (!rawUnit) return null;
        const normalized = cleanClipboardLine(rawUnit).toLowerCase();
        if (!normalized) return null;

        // 1. Coincidencia exacta por nombre (abreviatura)
        let found = systemUnits.find(u => u.name === normalized);
        if (found) return found;

        // 2. Coincidencia exacta por nombre completo (si existe)
        found = systemUnits.find(u => u.full === normalized);
        if (found) return found;

        // 3. Mapeos manuales inteligentes (Common pitfalls)
        const mappings = {
            'kg': 'kg', 'kilogramo': 'kg', 'kilogramos': 'kg',
            'km': 'km', 'kilómetro': 'km', 'kilometros': 'km',
            'h': 'hora', 'hr': 'hora', 'hora': 'hora', 'horas': 'hora',
            'dia': 'dia', 'día': 'dia', 'dias': 'dia',
            'sem': 'semana', 'semana': 'semana', 'semanas': 'semana',
            'mes': 'mes', 'meses': 'mes', 'und': 'und', 'unidad': 'und'
        };

        if (mappings[normalized]) {
            const mappedName = mappings[normalized];
            found = systemUnits.find(u => u.name === mappedName);
            if (found) return found;
        }

        // 4. Coincidencia parcial (empieza por...)
        found = systemUnits.find(u => u.name.startsWith(normalized) || u.full.startsWith(normalized));
        if (found) return found;

        return null;
    };

    const existing = new Set((apus || []).map((apu) => `${cleanClipboardLine(apu.descripcion).toLowerCase()}::${cleanClipboardLine(renderUnidad(apu.unidad)).toLowerCase()}`));
    const seen = new Set();

    return rawText
        .split('\n')
        .map((line, index) => {
            const raw = line;
            const parsed = parseApuImportLine(line, unidades);
            let reason = '';
            let valid = !!parsed?.descripcion;

            if (!raw.trim()) return null;
            if (!parsed?.descripcion) {
                valid = false;
                reason = 'Falta descripción';
            } else if (!parsed.unidad) {
                valid = false;
                reason = 'Unidad obligatoria';
            } else {
                // Búsqueda inteligente de unidad
                const bestUnit = findBestUnit(parsed.unidad);
                if (bestUnit) {
                    parsed.unidad = bestUnit.name; // Normalizar nombre visual para el preview
                    const key = `${cleanClipboardLine(parsed.descripcion).toLowerCase()}::${bestUnit.name.toLowerCase()}`;
                    
                    if (seen.has(key)) {
                        valid = false;
                        reason = 'Duplicada dentro del pegado';
                    } else if (existing.has(key)) {
                        valid = false;
                        reason = 'Ya existe en la base activa';
                        seen.add(key);
                    }
                } else {
                    valid = false;
                    reason = `Unidad desconocida: ${parsed.unidad}`;
                }
            }

            return {
                row: index + 1,
                raw,
                parsed,
                valid,
                reason
            };
        })
        .filter(Boolean);
};

const isApuImportEligible = (estadoRevision) => {
    const normalized = String(estadoRevision || '').trim().toLowerCase();
    return normalized === 'revisado' || normalized === 'aprobado';
};

const normalizeApuRevisionStatus = (estadoRevision) => {
    const normalized = String(estadoRevision || '').trim().toLowerCase();
    if (normalized === 'revisado' || normalized === 'aprobado') return 'Revisado';
    if (normalized === 'pendiente' || normalized === 'por validar' || normalized === 'borrador' || normalized === 'incompleto') return 'Pendiente';
    return 'Pendiente';
};

const APUs = () => {
    const { 
        user, 
        selectedEmpresa, 
        selectedBaseTrabajo, 
        setSelectedBaseTrabajo,
        activeProject 
    } = useContext(AuthContext);
    const miEmpresa = selectedEmpresa; 
    const useOmniClass = miEmpresa?.use_omniclass !== false;
    const effectiveBaseRevision = selectedBaseTrabajo?.tipo === 'Base de Proyecto'
        ? (selectedBaseTrabajo.revision ?? 0)
        : null;


    // -- Use Formatters with robust fallbacks --
    const formatters = useFormatters();
    const formatNumericDisplay = formatters?.formatNumericDisplay || ((v, d) => String(v || '').replace('.', ','));
    const parseNumericInput = formatters?.parseNumericInput || ((v) => String(v || '').replace(',', '.'));
    const { 
        formatMoneda, 
        formatMonedaInput, 
        formatCalculo, 
        formatCalculoVisual, 
        precisionMoneda, 
        precisionCalculo 
    } = formatters || {};
    const formatRelativePercent = (value) => `${formatNumericDisplay((Number(value || 0) * 100).toFixed(2))}%`;

    const navigate = useNavigate();
    const location = useLocation();

    const activeBaseOrigin = useMarketplaceOrigin('base_trabajo', selectedBaseTrabajo?.id);
    const [sourceBaseLabel, setSourceBaseLabel] = useState('');
    // -- Estados Globales --
    const [apus, setApus] = useState([]);
    const [nestedApusCatalog, setNestedApusCatalog] = useState([]);
    const [subcategorias, setSubcategorias] = useState([]);
    const [selectedSubcatId, setSelectedSubcatId] = useState(null);
    const [apuStatusFilter, setApuStatusFilter] = useState('all');
    const [allSubcategorias, setAllSubcategorias] = useState([]);
    const [selectedApus, setSelectedApus] = useState([]); // Selección masiva
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const [recursos, setRecursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [apuUnidades, setApuUnidades] = useState([]);
    const [resourceUnidades, setResourceUnidades] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [bulkDeleteStep, setBulkDeleteStep] = useState(1);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [lastActionId, setLastActionId] = useState(null);
    const [pendingDuplicatedApuId, setPendingDuplicatedApuId] = useState(null);
    const [reportPreview, setReportPreview] = useState(null);
    const [showReportPreviewModal, setShowReportPreviewModal] = useState(false);
    const [reportExporting, setReportExporting] = useState(false);
    const [dragOverSubcat, setDragOverSubcat] = useState(null);
    const [dragOverCatEditor, setDragOverCatEditor] = useState(null); // Para el editor
    const [draggingEditorLineKey, setDraggingEditorLineKey] = useState(null);
    const [dragOverEditorLineKey, setDragOverEditorLineKey] = useState(null);
    const [viewportWidth, setViewportWidth] = useState(() => (typeof window !== 'undefined' ? window.innerWidth : 1920));
    const [forcedPortableWorkspace, setForcedPortableWorkspace] = useState(() => readPortableWorkspaceOverride());
    const importPreview = useMemo(() => buildApuImportPreview(importText, apus, apuUnidades), [importText, apus, apuUnidades]);
    const routeQuery = useMemo(() => new URLSearchParams(location.search), [location.search]);
    const requestedApuId = Number(routeQuery.get('apu_id') || 0);
    const entrySource = routeQuery.get('entry') || '';
    const entryMode = routeQuery.get('mode') || '';
    const returnTo = routeQuery.get('return_to') || '';
    const returnTab = routeQuery.get('return_tab') || '';
    const returnProjectId = Number(routeQuery.get('project_id') || 0);
    const cameFromProjectModule = entrySource === PROJECT_APU_ENTRY && returnTo === PROJECT_APU_RETURN && returnProjectId > 0;
    const shouldOpenEditorFromProject = cameFromProjectModule && entryMode === 'editor' && !requestedApuId;
    const contextualProjectEntryHandledRef = useRef(false);
    const nestedApuGraph = useMemo(() => {
        const graph = new Map();
        (nestedApusCatalog || []).forEach((apu) => {
            const childIds = (apu.lineas || [])
                .filter((linea) => !!linea.apu_hijo_id)
                .map((linea) => Number(linea.apu_hijo_id))
                .filter(Boolean);
            graph.set(Number(apu.id), childIds);
        });
        return graph;
    }, [nestedApusCatalog]);

    useEffect(() => {
        if (!requestedApuId) {
            return;
        }

        let cancelled = false;
        const syncRequestedApuBase = async () => {
            try {
                const requestedApuResponse = await apusApi.getById(requestedApuId, selectedEmpresa?.id);
                const targetBaseId = requestedApuResponse?.data?.base_trabajo_id;
                if (!targetBaseId || selectedBaseTrabajo?.id === targetBaseId || cancelled) {
                    return;
                }

                await basesTrabajoApi.activate(targetBaseId, selectedEmpresa?.id);
                const baseRes = await basesTrabajoApi.getById(targetBaseId, selectedEmpresa?.id);
                if (!cancelled) {
                    setSelectedBaseTrabajo(baseRes.data);
                }
            } catch (error) {
                console.error('Error sincronizando base del APU adquirido:', error);
            }
        };

        syncRequestedApuBase();
        return () => {
            cancelled = true;
        };
    }, [requestedApuId, selectedBaseTrabajo?.id, selectedEmpresa?.id, setSelectedBaseTrabajo]);

    useEffect(() => {
        let cancelled = false;

        const loadSourceBaseLabel = async () => {
            if (!selectedBaseTrabajo?.source_base_id) {
                setSourceBaseLabel('');
                return;
            }

            try {
                const response = await basesTrabajoApi.getById(selectedBaseTrabajo.source_base_id, selectedEmpresa?.id);
                if (!cancelled) {
                    setSourceBaseLabel(response?.data?.nombre || '');
                }
            } catch {
                if (!cancelled) {
                    setSourceBaseLabel('');
                }
            }
        };

        loadSourceBaseLabel();
        return () => {
            cancelled = true;
        };
    }, [selectedBaseTrabajo?.source_base_id, selectedEmpresa?.id]);

    useEffect(() => {
        if (!requestedApuId || apus.length === 0) {
            return;
        }

        const requestedApu = apus.find((item) => item.id === requestedApuId);
        if (!requestedApu) {
            return;
        }

        if (requestedApu.subcategoria_item_id && selectedSubcatId !== requestedApu.subcategoria_item_id) {
            setSelectedSubcatId(requestedApu.subcategoria_item_id);
        }
        setSelectedApus((prev) => (prev.length === 1 && prev[0] === requestedApuId ? prev : [requestedApuId]));

        window.setTimeout(() => {
            const element = document.getElementById(`apu-${requestedApuId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 120);
    }, [apus, requestedApuId, selectedSubcatId]);


    // -- Estados Edición --
    const [editingApu, setEditingApu] = useState(null);
    const [editingApuHistory, setEditingApuHistory] = useState([]);
    const [initialApuEditorSnapshot, setInitialApuEditorSnapshot] = useState(null);
    const [expandedCats, setExpandedCats] = useState([1, 2, 3, 4, 5]);
    const [expandedSubcats, setExpandedSubcats] = useState([]);
    const [searchLeft, setSearchLeft] = useState('');
    const [searchSubcategories, setSearchSubcategories] = useState('');
    const [searchRight, setSearchRight] = useState('');
    const [collapsedCategoriesEditor, setCollapsedCategoriesEditor] = useState([]); // Nuevo estado
    const [isEditorSidebarCollapsed, setIsEditorSidebarCollapsed] = useState(false);
    const [isEditorSidebarHoverExpanded, setIsEditorSidebarHoverExpanded] = useState(false);
    const lastAddRef = React.useRef(0); // Para evitar duplicados por click rápido


    // -- Estados Importación desde Base --
    const [showBaseImportModal, setShowBaseImportModal] = useState(false);
    const [availableBases, setAvailableBases] = useState([]);
    const [baseImportSearch, setBaseImportSearch] = useState('');
    const [selectedSourceBaseId, setSelectedSourceBaseId] = useState(null);
    const [selectedSourceBaseMeta, setSelectedSourceBaseMeta] = useState(null);
    const [sourceBaseSubcats, setSourceBaseSubcats] = useState([]);
    const [sourceBaseApus, setSourceBaseApus] = useState([]);
    const [baseImportLoading, setBaseImportLoading] = useState(false);
    const [selectedImportApuIds, setSelectedImportApuIds] = useState([]);
    const [importingStep, setImportingStep] = useState(1); // 1: Select Base, 2: Select APUs
    const [importingStatus, setImportingStatus] = useState(false);
    const [importConflicts, setImportConflicts] = useState([]);
    const [importResolutions, setImportResolutions] = useState({}); // {source_apu_id: 'skip' | 'overwrite'}
    const [showConflictModal, setShowConflictModal] = useState(false);
    const previousSubcatIdRef = React.useRef(null);
    const hasInitializedApuSubcategoryRef = React.useRef(false);
    const targetImportContextLabel = selectedBaseTrabajo
        ? `${selectedBaseTrabajo.tipo}${selectedBaseTrabajo.tipo === 'Base de Proyecto' ? ` · Rev. ${String(effectiveBaseRevision ?? 0).padStart(3, '0')}` : ''}`
        : 'Base destino';

    // -- Estados Edición de Recurso In-line --
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [editingRecurso, setEditingRecurso] = useState(null);
    const [resourceForm, setResourceForm] = useState({
        descripcion: '',
        precio: '',
        unidad_id: '',
        cod_cpc_id: null,
        especificaciones: '',
        cpc_display: '',
        equipment_ownership_kind: '',
        governing_resource_kind: '',
        omniclass_codigo: '',
        omniclass_titulo: ''
    });

    // -- Formulario de Edición --
    /** @type {[Schemas['APUCreate'] & {id?: number}, React.Dispatch<React.SetStateAction<Schemas['APUCreate'] & {id?: number}>>]} */
    const [savedRendimientoGlobalPreference, setSavedRendimientoGlobalPreference] = useState(
        () => readApuEditorGlobalRendimientoPreference()
    );
    const [formApu, setFormApu] = useState(() => ({
        descripcion: '',
        unidad: '',
        rendimiento_global_activado: readApuEditorGlobalRendimientoPreference(),
        rendimiento_global_base: '',
        estado_revision: 'Pendiente',
        por_validar: true,
        lineas: []
    }));

    const serializeApuEditorState = useCallback((apuForm) => {
        if (!apuForm) return null;
        return JSON.stringify({
            descripcion: apuForm.descripcion || '',
            unidad_id: Number(apuForm.unidad_id || 0),
            subcategoria_item_id: Number(apuForm.subcategoria_item_id || 0),
            por_validar: Boolean(apuForm.por_validar),
            omniclass_codigo: apuForm.omniclass_codigo || '',
            omniclass_titulo: apuForm.omniclass_titulo || '',
            rendimiento_global_activado: Boolean(apuForm.rendimiento_global_activado),
            rendimiento_global_base: String(apuForm.rendimiento_global_base || ''),
            lineas: buildPersistedLineOrder(apuForm.lineas || []).map((l, index) => ({
                recurso_id: l.recurso_id || null,
                apu_hijo_id: l.apu_hijo_id || null,
                cantidad: String(l.cantidad ?? ''),
                rendimiento: String(l.rendimiento ?? ''),
                hide_rendimiento: Boolean(l.hide_rendimiento),
                orden: Number(l.orden ?? index),
            })),
        });
    }, []);

    const isApuEditorDirty = useMemo(() => {
        if (!editingApu || initialApuEditorSnapshot === null) return false;
        return serializeApuEditorState(formApu) !== initialApuEditorSnapshot;
    }, [editingApu, formApu, initialApuEditorSnapshot, serializeApuEditorState]);
    const routeLeaveDecisionPendingRef = React.useRef(false);

    const [showUnidadModal, setShowUnidadModal] = useState(false);
    const [showApuOmniPanel, setShowApuOmniPanel] = useState(false);
    const [newUnidadForm, setNewUnidadForm] = useState({ descripcion: '', descripcion_completa: '' });

    const nestedApuBlockedReasons = useMemo(() => {
        const blocked = new Map();
        const currentApuId = editingApu && editingApu !== 'new' ? Number(formApu?.id || 0) : 0;
        if (!currentApuId) return blocked;

        (nestedApusCatalog || []).forEach((apu) => {
            const candidateId = Number(apu?.id || 0);
            if (!candidateId) return;

            if (candidateId === currentApuId) {
                blocked.set(candidateId, 'Un APU no puede contenerse a sí mismo.');
                return;
            }

            if (hasPathInApuGraph(nestedApuGraph, candidateId, currentApuId)) {
                blocked.set(candidateId, 'Este APU ya contiene al APU actual; insertarlo generaría una referencia circular.');
            }
        });

        return blocked;
    }, [editingApu, formApu?.id, nestedApusCatalog, nestedApuGraph]);

    // --- OmniClass Search State ---
    const [omniclassOptions, setOmniclassOptions] = useState([]);
    const [isOmniLoading, setIsOmniLoading] = useState(false);
    const currentApuOmniClassTable = getOmniClassTableForApu();
    const currentResourceCategory = editingRecurso?.recurso?.subcategoria_codigo
        || editingRecurso?.subcategoria_codigo
        || editingRecurso?.categoria_id
        || null;
    const currentResourceOmniClassTable = getOmniClassTableForResourceCategory(
        currentResourceCategory || 1
    );

    useEffect(() => {
        const handleResize = () => setViewportWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const syncOverride = () => setForcedPortableWorkspace(readPortableWorkspaceOverride());
        window.addEventListener('storage', syncOverride);
        window.addEventListener('giproy:portable-workspace-changed', syncOverride);
        return () => {
            window.removeEventListener('storage', syncOverride);
            window.removeEventListener('giproy:portable-workspace-changed', syncOverride);
        };
    }, []);

    const isEditorCompact = resolvePortableWorkspace({
        width: viewportWidth,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
        forced: user?.rol?.toLowerCase() === 'superadministrador' && forcedPortableWorkspace
    });

    useEffect(() => {
        if (!editingApu) {
            setIsEditorSidebarCollapsed(false);
            setIsEditorSidebarHoverExpanded(false);
            setShowApuOmniPanel(false);
            return;
        }
        setIsEditorSidebarCollapsed(false);
        setIsEditorSidebarHoverExpanded(false);
        setShowApuOmniPanel(false);
    }, [editingApu]);

    useEffect(() => {
        setOmniclassOptions([]);
    }, [editingApu]);

    useEffect(() => {
        if (!useOmniClass) {
            setShowApuOmniPanel(false);
        }
    }, [useOmniClass]);

    const isEditorSidebarVisuallyCollapsed = isEditorSidebarCollapsed && !isEditorSidebarHoverExpanded;

    const handleOmniClassSearch = async (term) => {
        if (!term || term.length < 2) return;
        setIsOmniLoading(true);
        try {
            const res = await maestrosApi.getOmniClassSearch(term, currentApuOmniClassTable);
            setOmniclassOptions(buildOmniClassOptions(res || []));
        } catch (error) {
            console.error("Error searching OmniClass:", error);
        } finally {
            setIsOmniLoading(false);
        }
    };

    const handleOmniClassOpen = async () => {
        if (omniclassOptions.length > 0 || isOmniLoading) return;
        setIsOmniLoading(true);
        try {
            const res = await maestrosApi.getOmniClassTabla(currentApuOmniClassTable);
            setOmniclassOptions(buildOmniClassOptions(res || []));
        } catch (error) {
            console.error("Error preloading OmniClass:", error);
        } finally {
            setIsOmniLoading(false);
        }
    };

    // -- Toasts --
    const [toast, setToast] = useState(null);
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const openImportModal = () => {
        setImportText('');
        setShowImportModal(true);
    };

    const closeImportModal = () => {
        setShowImportModal(false);
        setImportText('');
    };

    const fetchData = React.useCallback(async (targetSubcatId = null) => {
        if (!selectedBaseTrabajo) { navigate('/precios-unitarios/bases'); return; }
        setLoading(true);
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            // Cargar TODAS las subcategorías (Cat 1 a 5)
            const resAllSub = await subcategoriasItemsApi.getAll(selectedBaseTrabajo.id, null, empId, effectiveBaseRevision);
            setAllSubcategorias(resAllSub.data);

            // Cargar categorías con conteos
            try {
                const resCats = await recursosApi.getCategorias(selectedBaseTrabajo.id, empId);
                setCategorias(resCats.data || []);
            } catch (err) {
                console.error("Error fetching category counts:", err);
            }

            // Filtrar Cat 5 por el campo categórico real para evitar falsos vacíos.
            const cat5Subs = resAllSub.data.filter(s => Number(s.subcategoria_codigo) === 5);
            setSubcategorias(cat5Subs);

            let currentSubcatId = targetSubcatId || selectedSubcatId;
            const hasValidCurrentSubcat = cat5Subs.some(sub => sub.id === currentSubcatId);
            
            if (hasValidCurrentSubcat) {
                // Si la subcategoría es válida, nos aseguramos de mantenerla sin saltar a la primera
                if (selectedSubcatId !== currentSubcatId) {
                    setSelectedSubcatId(currentSubcatId);
                }
            } else if (!hasInitializedApuSubcategoryRef.current && cat5Subs.length > 0) {
                // Solo saltamos a la primera si la actual no existe en el catálogo Cat 5
                setSelectedSubcatId(cat5Subs[0].id);
                currentSubcatId = cat5Subs[0].id;
            } else {
                setSelectedSubcatId(null);
                currentSubcatId = null;
            }

            hasInitializedApuSubcategoryRef.current = true;

            // Cargar APUs filtrados por subcategoría si existe
            const resApus = await apusApi.getAll({
                base_trabajo_id: selectedBaseTrabajo.id,
                ...(currentSubcatId ? { subcategoria_item_id: currentSubcatId } : {}),
                empresa_id: empId,
                revision: effectiveBaseRevision,
                limit: 1000
            });
            setApus(resApus.data);

            const resNestedApus = await apusApi.getAll({
                base_trabajo_id: selectedBaseTrabajo.id,
                empresa_id: empId,
                revision: effectiveBaseRevision,
                limit: 1000
            });
            setNestedApusCatalog(resNestedApus.data || []);

            // Cargar todos los recursos de la base (para el panel izquierdo)
            const resRec = await recursosApi.getAll(selectedBaseTrabajo.id, null, empId, effectiveBaseRevision);
            setRecursos(resRec.data);

            // Cargar de unidades (específicas para APUs - Cat 5)
            const resUn = await recursosApi.getUnidades(5, selectedBaseTrabajo.id, empId);
            setApuUnidades(resUn.data);
        } catch (error) {
            console.error("Error fetching data:", error);
            setApus([]);
            setNestedApusCatalog([]);
            setRecursos([]);
            setApuUnidades([]);
            setResourceUnidades([]);
        } finally {
            setLoading(false);
        }
    }, [selectedBaseTrabajo, selectedEmpresa?.id, user?.empresa_id, selectedSubcatId, navigate, effectiveBaseRevision]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        contextualProjectEntryHandledRef.current = false;
    }, [location.search]);

    useEffect(() => {
        const shouldWarn = Boolean(editingApu && (isApuEditorDirty || pendingDuplicatedApuId));
        if (!shouldWarn) return undefined;

        const handleBeforeUnload = (event) => {
            event.preventDefault();
            event.returnValue = '';
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [editingApu, isApuEditorDirty, pendingDuplicatedApuId]);

    // Efecto para mantener el foco (scroll into view) tras acciones
    useEffect(() => {
        if (lastActionId) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`apu-${lastActionId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-[#F39200]', 'ring-offset-2');
                    setTimeout(() => element.classList.remove('ring-2', 'ring-[#F39200]', 'ring-offset-2'), 2000);
                }
                setLastActionId(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [apus, lastActionId]);

    useEffect(() => {
        hasInitializedApuSubcategoryRef.current = false;
        setSelectedSubcatId(null);
        setApuStatusFilter('all');
        setSelectedApus([]);
    }, [selectedBaseTrabajo?.id, selectedEmpresa?.id, setSelectedSubcatId]);

    useEffect(() => {
        const previousSubcatId = previousSubcatIdRef.current;
        if (previousSubcatId !== null && previousSubcatId !== selectedSubcatId) {
            setSelectedApus([]);
            setReportPreview(null);
            setShowReportPreviewModal(false);
            setShowBulkDeleteModal(false);
            setBulkDeleteStep(1);
            setSelectedImportApuIds([]);
            setImportConflicts([]);
            setImportResolutions({});
            setShowConflictModal(false);
        }
        previousSubcatIdRef.current = selectedSubcatId;
    }, [selectedSubcatId]);

    const getNextApuCode = () => {
        const subcat = subcategorias.find(s => s.id === selectedSubcatId);
        if (!subcat) return '5-XX-001';

        const prefix = subcat.codigo; // ej: 5-01
        const relatedApus = apus.filter(a => a.codigo && a.codigo.startsWith(prefix));

        let maxSeq = 0;
        relatedApus.forEach(a => {
            const parts = a.codigo.split('-');
            const seqStr = parts[parts.length - 1];
            const seqNum = parseInt(seqStr);
            if (!isNaN(seqNum) && seqNum > maxSeq) maxSeq = seqNum;
        });

        const nextSeq = (maxSeq + 1).toString().padStart(4, '0');
        return `${prefix}-${nextSeq}`;
    };

    const getEffectiveCategoria = (linea) => (
        linea?.categoria_calc ||
        (linea?.is_apu
            ? 2
            : parseInt(String(linea?.item_obj?.codigo || linea?.item_obj?.item_obj?.codigo || '').charAt(0) || '1'))
    );

    const buildPersistedLineOrder = (lineas = []) => {
        const categoryPriority = { 1: 0, 2: 1, 3: 2, 4: 3, 5: 4 };
        return [...lineas]
            .sort((a, b) => {
                const categoryDiff = (categoryPriority[getEffectiveCategoria(a)] ?? 99) - (categoryPriority[getEffectiveCategoria(b)] ?? 99);
                if (categoryDiff !== 0) return categoryDiff;
                const orderDiff = Number(a.orden ?? 0) - Number(b.orden ?? 0);
                if (orderDiff !== 0) return orderDiff;
                return String(a.unique_key || a.id || '').localeCompare(String(b.unique_key || b.id || ''));
            })
            .map((linea, index) => ({ ...linea, orden: index }));
    };

    const reorderLineasWithinCategory = (lineas = [], sourceKey, targetKey) => {
        const sourceIndex = lineas.findIndex((linea) => String(linea.unique_key || linea.id) === String(sourceKey));
        const targetIndex = lineas.findIndex((linea) => String(linea.unique_key || linea.id) === String(targetKey));
        if (sourceIndex === -1 || targetIndex === -1 || sourceIndex === targetIndex) {
            return lineas;
        }

        const sourceLinea = lineas[sourceIndex];
        const targetLinea = lineas[targetIndex];
        if (getEffectiveCategoria(sourceLinea) !== getEffectiveCategoria(targetLinea)) {
            return lineas;
        }

        const category = getEffectiveCategoria(sourceLinea);
        const categoryLineas = lineas.filter((linea) => getEffectiveCategoria(linea) === category);
        const sourceCategoryIndex = categoryLineas.findIndex((linea) => String(linea.unique_key || linea.id) === String(sourceKey));
        const targetCategoryIndex = categoryLineas.findIndex((linea) => String(linea.unique_key || linea.id) === String(targetKey));
        if (sourceCategoryIndex === -1 || targetCategoryIndex === -1) {
            return lineas;
        }

        const reorderedCategoryLineas = [...categoryLineas];
        const [moved] = reorderedCategoryLineas.splice(sourceCategoryIndex, 1);
        reorderedCategoryLineas.splice(targetCategoryIndex, 0, moved);

        const normalizedCategoryLineas = reorderedCategoryLineas.map((linea, index) => ({
            ...linea,
            orden: index
        }));

        let pointer = 0;
        return buildPersistedLineOrder(
            lineas.map((linea) => {
                if (getEffectiveCategoria(linea) !== category) {
                    return linea;
                }
                const nextLinea = normalizedCategoryLineas[pointer];
                pointer += 1;
                return nextLinea;
            })
        );
    };

    const getCurrentGlobalRendimiento = (lineas = []) => {
        const eligibleLine = [...lineas].reverse().find((linea) => {
            const categoria = getEffectiveCategoria(linea);
            return (categoria === 1 || categoria === 4) && !linea.hide_rendimiento;
        });

        if (!eligibleLine) return 1.0;

        const parsed = toDecimalNumber(parseNumericInput(eligibleLine.rendimiento), '0');
        return Number.isFinite(parsed) && parsed > 0 ? parsed : 1.0;
    };

    const parseGlobalBaseRendimiento = (value) => {
        const parsed = toDecimalNumber(parseNumericInput(value), '0');
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    };

    const hasEligibleGlobalLineas = (lineas = []) => (
        lineas.some((linea) => {
            const categoria = getEffectiveCategoria(linea);
            return (categoria === 1 || categoria === 4) && !linea.hide_rendimiento;
        })
    );

    const resolveGlobalRendimiento = (lineas = [], fallbackBase = '') => {
        if (hasEligibleGlobalLineas(lineas)) {
            return getCurrentGlobalRendimiento(lineas);
        }
        return parseGlobalBaseRendimiento(fallbackBase);
    };

    const handleCreateNew = async () => {
        await handleAbandonCurrentApuEditor({
            title: 'Crear nuevo APU',
            message: pendingDuplicatedApuId
                ? 'El APU duplicado actual sigue pendiente. ¿Desea guardarlo antes de crear uno nuevo? Si no lo guarda, la copia se borrará.'
                : 'Hay cambios sin guardar en el APU actual. ¿Desea guardarlos antes de crear uno nuevo?',
            saveSuccessMessage: 'Cambios guardados. Preparando nuevo APU...',
            onContinue: async () => {
                setSearchLeft('');
                setEditingApuHistory([]);
                setPendingDuplicatedApuId(null);
                setEditingApu('new');
                const defaultUnit = apuUnidades.length > 0 ? apuUnidades[0] : null;
                const nextForm = {
                    id: null,
                    codigo: getNextApuCode(),
                    descripcion: '',
                    unidad_id: defaultUnit?.id || null,
                    unidad: defaultUnit ? (defaultUnit.descripcion || defaultUnit) : '',
                    subcategoria_item_id: selectedSubcatId,
                    rendimiento_global_activado: savedRendimientoGlobalPreference,
                    rendimiento_global_base: '',
                    por_validar: true,
                    omniclass_codigo: '',
                    omniclass_titulo: '',
                    lineas: []
                };
                setFormApu(nextForm);
                setInitialApuEditorSnapshot(serializeApuEditorState(nextForm));
            },
        });
    };

    useEffect(() => {
        if (!shouldOpenEditorFromProject || loading || editingApu || requestedApuId) {
            return;
        }
        if (contextualProjectEntryHandledRef.current) {
            return;
        }
        contextualProjectEntryHandledRef.current = true;
        handleCreateNew();
    }, [editingApu, handleCreateNew, loading, requestedApuId, shouldOpenEditorFromProject]);

    const handleEditApu = async (apu, options = {}) => {
        const { resetHistory = true, skipAbandonConfirm = false } = options;
        if (!apu?.id) return;

        if (!skipAbandonConfirm && editingApu && Number(editingApu) !== Number(apu.id)) {
            const continued = await handleAbandonCurrentApuEditor({
                title: 'Cambiar de APU',
                message: pendingDuplicatedApuId
                    ? 'El APU duplicado actual sigue pendiente. ¿Desea guardarlo antes de abrir otro APU? Si no lo guarda, la copia se borrará.'
                    : 'Hay cambios sin guardar en el APU actual. ¿Desea guardarlos antes de abrir otro APU?',
                saveSuccessMessage: 'Cambios guardados. Cargando el siguiente APU...',
                onContinue: async () => {
                    await handleEditApu(apu, { resetHistory, skipAbandonConfirm: true });
                },
            });
            if (!continued) return;
            return;
        }

        try {
            setLoading(true);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            // Obtener el detalle completo del APU (incluyendo líneas)
            const res = await apusApi.getById(apu.id, empId);
            const fullApu = res.data;

            // Mapear líneas del backend al formato esperado por el frontend
            const mappedLineas = (fullApu.lineas || []).map(l => {
                const isApu = !!l.apu_hijo_id;
                const item = l.recurso || l.apu_hijo;
                const categoria_base = isApu ? 5 : parseInt(item?.codigo?.charAt(0) || "1");

                let target_category = categoria_base;
                let es_oculto = false;
                if (isApu) {
                    target_category = 2;
                    es_oculto = true;
                } else if (categoria_base === 3 || categoria_base === 2) {
                    es_oculto = true;
                }

                return {
                    ...l,
                    unique_key: String(l.id),
                    orden: Number(l.orden ?? 0),
                    item_obj: item,
                    is_apu: isApu,
                    categoria_calc: target_category,
                    hide_rendimiento: es_oculto
                };
            });

            setSearchLeft(''); // Limpiar búsqueda del árbol de recursos
            if (resetHistory) {
                setEditingApuHistory([]);
            }
            setEditingApu(fullApu.id);
            // --- Corrección de Unidad ---
            // El backend devuelve un string en 'unidad', pero el editor usa 'unidad_id' para el componente select.
            // Buscamos el ID correspondiente en el maestro de unidades.
            const unitStr = (fullApu.unidad || '').toLowerCase().trim();
            const resolvedUnitId = resolveUnitId(
                apuUnidades,
                fullApu.unidad_id || unitStr,
                apuUnidades.length > 0 ? apuUnidades[0].id : null
            );
            const matchedUnit = findMatchingUnit(apuUnidades, resolvedUnitId);

            const nextForm = {
                id: fullApu.id,
                codigo: fullApu.codigo,
                descripcion: fullApu.descripcion,
                unidad_id: resolvedUnitId,
                unidad: renderUnidad(fullApu.unidad),
                subcategoria_item_id: fullApu.subcategoria_item_id,
                rendimiento_global_activado: savedRendimientoGlobalPreference,
                rendimiento_global_base: hasEligibleGlobalLineas(mappedLineas)
                    ? formatCalculo(getCurrentGlobalRendimiento(mappedLineas))
                    : '',
                por_validar: normalizeApuRevisionStatus(fullApu.estado_revision) === 'Pendiente',
                omniclass_codigo: fullApu.omniclass_codigo || '',
                omniclass_titulo: fullApu.omniclass_titulo || '',
                lineas: mappedLineas
            };
            setFormApu(nextForm);
            setInitialApuEditorSnapshot(serializeApuEditorState(nextForm));
        } catch (error) {
            console.error("Error al cargar detalle del APU:", error);
            showToast("Error al cargar el detalle completo del APU", "error");
        } finally {
            setLoading(false);
        }
    };



    const handleDeleteApu = async (id, e) => {
        if (e) e.stopPropagation();
        const confirmed = await appConfirm({
            title: 'Borrar APU',
            message: '¿Confirmar eliminación de este APU?',
            confirmLabel: 'Borrar',
            cancelLabel: 'Cancelar',
            tone: 'danger'
        });
        if (!confirmed) return;
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await apusApi.delete(id, empId);
            showToast("APU eliminado correctamente");
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.detail || "Error al eliminar", "error");
        }
    };

    const discardDuplicatedDraft = useCallback(async (apuId) => {
        if (!apuId) return true;
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await apusApi.delete(apuId, empId);
            setPendingDuplicatedApuId((current) => (current === apuId ? null : current));
            return true;
        } catch (error) {
            appAlert(error.response?.data?.detail || "No se pudo descartar el APU duplicado.");
            return false;
        }
    }, [selectedEmpresa?.id, user?.empresa_id]);

    const handleAbandonCurrentApuEditor = useCallback(async ({
        onContinue,
        title = 'Cerrar edición APU',
        message = 'Hay cambios sin guardar en el APU actual. ¿Qué desea hacer?',
        saveSuccessMessage = null,
    } = {}) => {
        const currentApuId = editingApu === 'new' ? null : Number(editingApu || 0);
        const duplicatedDraftId = pendingDuplicatedApuId && currentApuId === pendingDuplicatedApuId
            ? pendingDuplicatedApuId
            : null;
        const hasUnsavedWork = isApuEditorDirty || Boolean(duplicatedDraftId);

        if (!hasUnsavedWork) {
            if (onContinue) await onContinue();
            return true;
        }

        const decision = await appConfirm({
            title,
            message,
            confirmLabel: 'Guardar',
            secondaryLabel: duplicatedDraftId ? 'No guardar y borrar copia' : 'No guardar',
            secondaryResult: 'discard',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });

        if (decision === true) {
            const savedApuId = await persistCurrentApuEditor({
                closeEditor: false,
                successMessage: saveSuccessMessage,
            });
            if (!savedApuId) return false;
            setPendingDuplicatedApuId((current) => (current === savedApuId ? null : current));
            if (onContinue) await onContinue();
            return true;
        }

        if (decision === 'discard') {
            if (duplicatedDraftId) {
                const deleted = await discardDuplicatedDraft(duplicatedDraftId);
                if (!deleted) return false;
            }
            if (onContinue) await onContinue();
            return true;
        }

        return false;
    }, [
        discardDuplicatedDraft,
        editingApu,
        isApuEditorDirty,
        pendingDuplicatedApuId,
    ]);

    useEffect(() => {
        const shouldWarn = Boolean(editingApu && (isApuEditorDirty || pendingDuplicatedApuId));
        if (!shouldWarn) return undefined;

        const handleInternalNavigationAttempt = (event) => {
            if (routeLeaveDecisionPendingRef.current) {
                event.preventDefault();
                return;
            }
            if (event.defaultPrevented || event.button !== 0) return;
            if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

            const anchor = event.target?.closest?.('a[href]');
            if (!anchor) return;
            if (anchor.target === '_blank' || anchor.hasAttribute('download')) return;

            const href = anchor.getAttribute('href');
            if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;

            const nextUrl = new URL(anchor.href, window.location.href);
            if (nextUrl.origin !== window.location.origin) return;

            const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
            const nextPath = `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`;
            if (nextPath === currentUrl) return;

            event.preventDefault();
            routeLeaveDecisionPendingRef.current = true;

            handleAbandonCurrentApuEditor({
                title: 'Salir de APUs',
                message: pendingDuplicatedApuId
                    ? 'El APU duplicado actual sigue pendiente. ¿Desea guardarlo antes de salir de esta pantalla? Si no lo guarda, la copia se borrará.'
                    : 'Hay cambios sin guardar en el APU actual. ¿Desea guardarlos antes de salir de esta pantalla?',
                saveSuccessMessage: editingApu === 'new' ? 'APU creado con éxito' : 'APU guardado correctamente',
                onContinue: async () => {
                    navigate(nextPath);
                },
            }).finally(() => {
                routeLeaveDecisionPendingRef.current = false;
            });
        };

        document.addEventListener('click', handleInternalNavigationAttempt, true);
        return () => document.removeEventListener('click', handleInternalNavigationAttempt, true);
    }, [
        editingApu,
        handleAbandonCurrentApuEditor,
        isApuEditorDirty,
        navigate,
        pendingDuplicatedApuId,
    ]);

    const handleDuplicateApu = async (id, e) => {
        if (e) e.stopPropagation();
        await handleAbandonCurrentApuEditor({
            title: 'Duplicar APU',
            message: pendingDuplicatedApuId
                ? 'El APU duplicado actual sigue pendiente. ¿Desea guardarlo antes de duplicar otro? Si no lo guarda, la copia se borrará.'
                : 'Hay cambios sin guardar en el APU actual. ¿Desea guardarlos antes de duplicar otro APU?',
            saveSuccessMessage: 'Cambios guardados. Generando duplicado...',
            onContinue: async () => {
                try {
                    const empId = selectedEmpresa?.id || user?.empresa_id;
                    const res = await apusApi.duplicate(id, empId, effectiveBaseRevision);
                    if (res.data?.id) {
                        setPendingDuplicatedApuId(res.data.id);
                        setLastActionId(res.data.id);
                        await fetchData();
                        await handleEditApu({ id: res.data.id }, { skipAbandonConfirm: true });
                    }
                    showToast("APU duplicado y abierto para edición");
                } catch {
                    showToast("Error al duplicar", "error");
                }
            },
        });
    };

    // Drag & Drop para mover APUs entre subcategorías
    const handleDragStartAPU = (e, apuId) => {
        if (selectedApus.includes(apuId)) {
            e.dataTransfer.setData('apuIds', JSON.stringify(selectedApus));
        } else {
            e.dataTransfer.setData('apuIds', JSON.stringify([apuId]));
        }
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOverAPU = (e, subcatId) => {
        e.preventDefault();
        if (selectedSubcatId !== subcatId) {
            setDragOverSubcat(subcatId);
        }
    };

    const handleDropAPU = async (e, targetSubcatId) => {
        e.preventDefault();
        setDragOverSubcat(null);
        
        const rawIds = e.dataTransfer.getData('apuIds');
        if (!rawIds) return;
        
        const ids = JSON.parse(rawIds);
        if (selectedSubcatId === targetSubcatId) return;

        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await Promise.all(ids.map(id => apusApi.move(id, targetSubcatId, empId)));
            
            appAlert(`Se movieron ${ids.length} APUs correctamente`);
            
            setSelectedSubcatId(targetSubcatId);
            setLastActionId(ids[0]);
            
            fetchData(targetSubcatId);
            setSelectedApus([]);
        } catch {
            appAlert("Error al mover APUs");
        }
    };

    // --- Lógica de Importación desde Base ---
    const handleOpenImportModal = async () => {
        try {
            setShowBaseImportModal(true);
            setBaseImportLoading(true);
            setAvailableBases([]);
            setBaseImportSearch('');
            setSourceBaseApus([]);
            setSourceBaseSubcats([]);
            setImportingStep(1);
            setSelectedSourceBaseId(null);
            setSelectedSourceBaseMeta(null);
            setSelectedImportApuIds([]);
            const res = await basesTrabajoApi.getAll({ empresa_id: selectedEmpresa?.id || user?.empresa_id });
            const otherBases = res.data.filter((b) => {
                if (b.id === selectedBaseTrabajo?.id) return false;
                return true;
            });
            setAvailableBases(otherBases);
        } catch (error) {
            console.error("Error loading bases:", error);
            showToast("Error crítico al cargar bases de trabajo para importación", "error");
        } finally {
            setBaseImportLoading(false);
        }
    };

    const handleSelectSourceBase = async (baseId) => {
        try {
            setBaseImportLoading(true);
            setSelectedSourceBaseId(baseId);
            const sourceBase = availableBases.find((base) => base.id === baseId) || null;
            const sourceRevision = sourceBase?.tipo === 'Base de Proyecto'
                ? (sourceBase?.revision ?? 0)
                : 0;
            setSelectedSourceBaseMeta(sourceBase);

            // Cargar Subcategorías de la base fuente
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const resSub = await subcategoriasItemsApi.getAll(baseId, null, empId, sourceRevision);
            setSourceBaseSubcats(resSub.data);

            // Cargar APUs de la base fuente
            const resApu = await apusApi.getAll({ base_trabajo_id: baseId, empresa_id: empId, revision: sourceRevision });
            setSourceBaseApus(resApu.data);

            setImportingStep(2);
        } catch {
            showToast("Error al cargar Catálogo", "error");
        } finally {
            setBaseImportLoading(false);
        }
    };

    const handleExecuteImport = async (resolutionsMap = null) => {
        if (selectedImportApuIds.length === 0) {
            showToast("No has seleccionado ningún APU para importar", "error");
            return;
        }

        try {
            setImportingStatus(true);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const sourceRevision = selectedSourceBaseMeta?.tipo === 'Base de Proyecto'
                ? (selectedSourceBaseMeta?.revision ?? 0)
                : 0;
            const res = await apusApi.importFromBase({
                source_base_id: selectedSourceBaseId,
                target_base_id: selectedBaseTrabajo.id,
                source_revision: sourceRevision,
                target_revision: effectiveBaseRevision ?? 0,
                apu_ids: selectedImportApuIds,
                dry_run: !resolutionsMap,
                resolutions: resolutionsMap
            }, empId);

            if (res.data.conflicts && res.data.conflicts.length > 0) {
                setImportConflicts(res.data.conflicts);
                // Inicializar resoluciones por defecto a 'skip' (mantener actual)
                const initialResolutions = {};
                res.data.conflicts.forEach(c => {
                    initialResolutions[c.source.id] = 'skip';
                });
                setImportResolutions(initialResolutions);
                setShowConflictModal(true);
                return;
            }

            showToast(`Importación exitosa: ${res.data.imported_apus} APUs y ${res.data.imported_resources} recursos creados.`);
            setShowBaseImportModal(false);
            setShowConflictModal(false);
            fetchData();
        } catch (error) {
            const msg = error.response?.data?.detail || "Error en la importación";
            showToast(msg, "error");
        } finally {
            setImportingStatus(false);
        }
    };

    const handleAutoDecision = () => {
        const newRes = { ...importResolutions };
        importConflicts.forEach(c => {
            const sDate = c.source?.fecha ? new Date(c.source.fecha).getTime() : 0;
            const tDate = c.target?.fecha ? new Date(c.target.fecha).getTime() : 0;
            newRes[c.source.id] = sDate > tDate ? 'overwrite' : 'skip';
        });
        setImportResolutions(newRes);
        showToast("Se han seleccionado las versiones más recientes automáticamente");
    };

    const filteredImportBases = useMemo(() => {
        const token = normalizeSearchToken(normalizeTextInputValue(baseImportSearch));
        if (!token) return availableBases;
        return availableBases.filter((base) => {
            const revisionLabel = base.tipo === 'Base de Proyecto'
                ? `rev ${String(base.revision ?? 0).padStart(3, '0')}`
                : '';
            return (
                includesNormalized(base.nombre || '', token) ||
                includesNormalized(base.codigo || '', token) ||
                includesNormalized(base.tipo || '', token) ||
                includesNormalized(revisionLabel, token)
            );
        });
    }, [availableBases, baseImportSearch]);

    const handleImportApu = async () => {
        if (!importText.trim()) return;
        if (!selectedSubcatId) {
            showToast("Seleccione primero una subcategoría destino para la importación.", "error");
            return;
        }
        try {
            const lines = importPreview.filter(p => p.valid).map(item => item.parsed);
            if (lines.length === 0) {
                showToast("No hay filas válidas para importar.", "error");
                return;
            }
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await apusApi.importClipboard(lines, selectedBaseTrabajo.id, selectedSubcatId, empId, effectiveBaseRevision);

            let msg = `Importación completada: ${res.data.imported} APUs creados.`;
            if (res.data.errors && res.data.errors.length > 0) {
                msg += `\n\nNotas:\n${res.data.errors.join('\n')}`;
            }
            showToast(msg);
            setImportText('');
            setShowImportModal(false);
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.detail || "Error en la importación masiva", "error");
        }
    };

    const toggleSelectApu = (id, e) => {
        if (e) e.stopPropagation();
        setSelectedApus(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const apuSearchPool = searchRight ? nestedApusCatalog : apus;
    const searchFilteredApus = apuSearchPool.filter((apu) => (
        includesNormalized(apu.descripcion, searchRight) ||
        includesNormalized(apu.codigo, searchRight) ||
        includesNormalized(renderUnidad(apu.unidad), searchRight) ||
        includesNormalized(
            subcategorias.find((s) => s.id === apu.subcategoria_item_id)?.descripcion ||
            allSubcategorias.find((s) => s.id === apu.subcategoria_item_id)?.descripcion ||
            '',
            searchRight
        )
    ));
    const visibleApus = searchFilteredApus.filter((apu) => {
        const normalizedStatus = normalizeApuRevisionStatus(apu.estado_revision);
        if (apuStatusFilter === 'pending') return normalizedStatus === 'Pendiente';
        if (apuStatusFilter === 'reviewed') return normalizedStatus === 'Revisado';
        return true;
    });
    const totalApusCount = nestedApusCatalog.length;
    const visibleApuSubcategories = subcategorias.filter((sub) => (
        includesNormalized(sub.descripcion, searchSubcategories) ||
        includesNormalized(sub.codigo, searchSubcategories)
    ));
    const visibleApuIds = visibleApus.map(apu => apu.id);
    const allVisibleSelected = visibleApuIds.length > 0 && visibleApuIds.every(id => selectedApus.includes(id));
    const someVisibleSelected = visibleApuIds.some(id => selectedApus.includes(id)) && !allVisibleSelected;

    const toggleSelectAllVisible = () => {
        if (visibleApuIds.length === 0) return;
        setSelectedApus(prev => {
            if (allVisibleSelected) {
                return prev.filter(id => !visibleApuIds.includes(id));
            }
            return [...new Set([...prev, ...visibleApuIds])];
        });
    };

    const clearSelection = () => setSelectedApus([]);
    const handleToggleSubcategory = (subId) => {
        setSelectedSubcatId((current) => (current === subId ? null : subId));
    };

    const closeBulkDeleteModal = () => {
        if (bulkDeleting) return;
        setShowBulkDeleteModal(false);
        setBulkDeleteStep(1);
    };

    const handleBulkDelete = () => {
        if (selectedApus.length === 0) {
            showToast("Seleccione al menos un APU para borrar.", "error");
            return;
        }
        setShowBulkDeleteModal(true);
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            setBulkDeleting(true);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await apusApi.bulkDelete(selectedApus, empId);
            showToast(res.data.message);
            setSelectedApus([]);
            closeBulkDeleteModal();
            fetchData();
        } catch (error) {
            showToast(error.response?.data?.detail || "Error al ejecutar el borrado masivo.", "error");
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleOpenReportPreview = async () => {
        if (selectedApus.length === 0) {
            appAlert("Seleccione al menos un APU para generar reporte.");
            return;
        }
        try {
            setLoading(true);
            const templateId = activeProject?.plantillas_config?.apus || miEmpresa?.plantillas_config?.apus || "001";
            const response = await reportingApi.previewReport({
                report_type: 'apu',
                entity_ids: selectedApus,
                template_id: templateId
            });
            setReportPreview(response.data);
            setShowReportPreviewModal(true);
        } catch (error) {
            console.error("Error al preparar vista previa:", error);
            showToast("Error al preparar la vista previa del reporte", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleExportReportExcel = async () => {
        if (!reportPreview?.items?.length) return;
        try {
            setReportExporting(true);
            const response = await reportingApi.exportReport({
                report_type: 'apu',
                entity_ids: reportPreview.items.map(item => item.id),
                template_id: reportPreview.template_id || "001",
                format: 'xlsx'
            });
            const reportName = reportPreview.items.length > 1
                ? buildReportFileName({
                    reportLabel: 'APUs',
                    contextLabel: sanitizeReportContext(activeProject?.nombre || selectedBaseTrabajo?.nombre || 'Base de Trabajo'),
                    revision: activeProject?.revision ?? effectiveBaseRevision ?? 1,
                    extension: 'xlsx',
                })
                : buildReportFileName({
                    reportLabel: 'APU',
                    contextLabel: sanitizeReportContext(reportPreview.items[0].codigo || reportPreview.items[0].descripcion || 'APU'),
                    revision: activeProject?.revision ?? effectiveBaseRevision ?? 1,
                    extension: 'xlsx',
                });
            downloadBlobResponse(response, reportName);
            showToast("Reporte Excel generado correctamente");
        } catch (error) {
            console.error("Error al exportar Excel:", error);
            showToast(await extractBlobErrorMessage(error, "Error al exportar el reporte a Excel"), "error");
        } finally {
            setReportExporting(false);
        }
    };

    const handleExportReportPdf = async () => {
        if (!reportPreview?.items?.length) return;
        try {
            setReportExporting(true);
            const response = await reportingApi.exportReport({
                report_type: 'apu',
                entity_ids: reportPreview.items.map((item) => item.id),
                template_id: reportPreview.template_id || "001",
                format: 'pdf'
            });
            const reportName = reportPreview.selection_count > 1
                ? buildReportFileName({
                    reportLabel: 'APUs',
                    contextLabel: sanitizeReportContext(activeProject?.nombre || selectedBaseTrabajo?.nombre || 'Base de Trabajo'),
                    revision: activeProject?.revision ?? effectiveBaseRevision ?? 1,
                    extension: 'pdf',
                })
                : buildReportFileName({
                    reportLabel: 'APU',
                    contextLabel: sanitizeReportContext(reportPreview.items[0]?.codigo || reportPreview.items[0]?.descripcion || 'APU'),
                    revision: activeProject?.revision ?? effectiveBaseRevision ?? 1,
                    extension: 'pdf',
                });
            downloadBlobResponse(response, reportName, 'application/pdf');
            showToast("Reporte PDF generado correctamente");
        } catch (error) {
            console.error("Error al exportar PDF:", error);
            showToast(await extractBlobErrorMessage(error, "Error al exportar el reporte a PDF"), "error");
        } finally {
            setReportExporting(false);
        }
    };

    const handleExportReportPdfFromExcel = async () => {
        if (!reportPreview?.items?.length) return;
        try {
            setReportExporting(true);
            const response = await reportingApi.exportReport({
                report_type: 'apu',
                entity_ids: reportPreview.items.map((item) => item.id),
                template_id: reportPreview.template_id || "001",
                format: 'pdf_excel'
            });
            const reportName = reportPreview.selection_count > 1
                ? buildReportFileName({
                    reportLabel: 'APUs',
                    contextLabel: sanitizeReportContext(activeProject?.nombre || selectedBaseTrabajo?.nombre || 'Base de Trabajo'),
                    revision: activeProject?.revision ?? effectiveBaseRevision ?? 1,
                    extension: 'pdf',
                })
                : buildReportFileName({
                    reportLabel: 'APU',
                    contextLabel: sanitizeReportContext(reportPreview.items[0]?.codigo || reportPreview.items[0]?.descripcion || 'APU'),
                    revision: activeProject?.revision ?? effectiveBaseRevision ?? 1,
                    extension: 'pdf',
                });
            downloadBlobResponse(response, reportName, 'application/pdf');
            showToast("PDF desde Excel generado correctamente");
        } catch (error) {
            console.error("Error al exportar PDF desde Excel:", error);
            showToast(await extractBlobErrorMessage(error, "Error al exportar el reporte PDF desde Excel"), "error");
        } finally {
            setReportExporting(false);
        }
    };

    const handleCreateUnidad = async (e) => {
        e.preventDefault();
        try {
            await recursosApi.createUnidad({
                ...newUnidadForm,
                descripcion: normalizeDisplayUnit(newUnidadForm.descripcion),
                descripcion_completa: normalizeDisplayUnit(newUnidadForm.descripcion_completa),
                categoria_id: 5, // Forzar Categoría 5 (APU)
                base_trabajo_id: selectedBaseTrabajo.id,
                empresa_id: selectedEmpresa ? selectedEmpresa.id : user?.empresa_id
            });
            setShowUnidadModal(false);
            setNewUnidadForm({ descripcion: '', descripcion_completa: '' });

            // Recargar unidades
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const resUnidades = await recursosApi.getUnidades(5, selectedBaseTrabajo.id, empId);
            setApuUnidades(resUnidades.data);

            const createdUnit = findMatchingUnit(resUnidades.data || [], newUnidadForm.descripcion);

            // Auto-seleccionar la nueva con id y etiqueta consistentes.
            setFormApu(prev => ({
                ...prev,
                unidad_id: createdUnit?.id || prev.unidad_id || null,
                unidad: resolveUnitDescription(resUnidades.data || [], createdUnit?.id || newUnidadForm.descripcion, prev.unidad),
            }));
        } catch (error) {
            appAlert(error.response?.data?.detail || "Error al crear unidad");
        }
    };

    const handleCancelEdit = () => {
        handleAbandonCurrentApuEditor({
            title: 'Cerrar edición APU',
            message: pendingDuplicatedApuId
                ? 'El APU duplicado actual sigue pendiente. ¿Desea guardarlo antes de cerrar? Si no lo guarda, la copia se borrará.'
                : 'Hay cambios sin guardar en el APU actual. ¿Desea guardarlos antes de cerrar?',
            saveSuccessMessage: editingApu === 'new' ? 'APU creado con éxito' : 'APU guardado correctamente',
            onContinue: async () => {
                setSearchLeft('');
                setEditingApuHistory([]);
                setInitialApuEditorSnapshot(null);
                if (formApu?.id) {
                    setLastActionId(formApu.id);
                    setSelectedApus((prev) => prev.filter((id) => id !== formApu.id));
                }
                setPendingDuplicatedApuId(null);
                setEditingApu(null);
                fetchData();
            },
        });
    };

    const handleReturnToProjectModule = useCallback(() => {
        if (!cameFromProjectModule || !returnProjectId) {
            navigate('/precios-unitarios');
            return;
        }

        const targetSearch = new URLSearchParams({
            project_id: String(returnProjectId),
            tab: returnTab || PROJECT_APU_RETURN_TAB,
        });

        const targetPath = `/proyectos?${targetSearch.toString()}`;

        if (!editingApu) {
            navigate(targetPath);
            return;
        }

        handleAbandonCurrentApuEditor({
            title: 'Volver al módulo Proyecto',
            message: pendingDuplicatedApuId
                ? 'El APU duplicado actual sigue pendiente. ¿Desea guardarlo antes de volver al proyecto? Si no lo guarda, la copia se borrará.'
                : 'Hay cambios sin guardar en el APU actual. ¿Desea guardarlos antes de volver al proyecto?',
            saveSuccessMessage: editingApu === 'new' ? 'APU creado con éxito' : 'APU guardado correctamente',
            onContinue: async () => {
                navigate(targetPath);
            },
        });
    }, [
        cameFromProjectModule,
        editingApu,
        handleAbandonCurrentApuEditor,
        navigate,
        pendingDuplicatedApuId,
        returnProjectId,
        returnTab,
    ]);

    // --- Manejo del Formulario y Lineas ---

    const addLinea = (item, isApu = false, forcedCatId = null) => {
        // --- PREVENCIÓN DE DOBLE CLIC RÁPIDO ---
        const now = Date.now();
        if (now - lastAddRef.current < 300) return; // Cooldown de 300ms
        lastAddRef.current = now;

        // Validación de referencias circulares
        if (isApu && editingApu !== 'new' && item.id === formApu.id) {
            appAlert("Un APU no puede contenerse a sí mismo.");
            return;
        }
        if (isApu) {
            const blockedReason = nestedApuBlockedReasons.get(Number(item.id));
            if (blockedReason) {
                appAlert(blockedReason);
                return;
            }
        }

        // --- LÓGICA DE MERGE ---
        const existingLinea = formApu.lineas.find(l =>
            (isApu && l.apu_hijo_id === item.id) ||
            (!isApu && l.recurso_id === item.id)
        );

        if (existingLinea) {
            const key = existingLinea.unique_key || existingLinea.id;
            updateLinea(
                key,
                'cantidad',
                sumDecimalNumber([existingLinea.cantidad || 0, 1], { decimals: precisionCalculo || 4 })
            );

            // Auto-scroll al ya existente
            setTimeout(() => {
                const el = document.getElementById(`row-${key}`);
                if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 100);
            return;
        }

        const categoria_base = isApu ? 5 : parseInt(item.codigo?.charAt(0) || "1");
        const uniqueKey = `${isApu ? 'A' : 'R'}-${item.id}-${Date.now()}`;

        // REGLAS DE NEGOCIO: Transporte(3) y Materiales(2) entran con rendimiento 1.0 siempre (y se oculta). Así como APUs (Entran en Materiales = 2)
        let default_rendimiento = 1.0;
        let es_oculto = false;

        let target_category = forcedCatId || categoria_base;
        if (isApu) {
            target_category = 2; // Si inserto un APU en otro APU, actúa como Material
            es_oculto = true;
            default_rendimiento = 1.0;
        } else if (categoria_base === 3 || categoria_base === 2) {
            // Transporte o Materiales
            es_oculto = true;
            default_rendimiento = 1.0;
        }

        const isEligibleForGlobalRendimiento = !es_oculto && (target_category === 1 || target_category === 4);

        setFormApu(prev => {
            const resolvedGlobalRendimiento = resolveGlobalRendimiento(prev.lineas, prev.rendimiento_global_base);
            if (prev.rendimiento_global_activado && isEligibleForGlobalRendimiento && resolvedGlobalRendimiento === null) {
                appAlert("Defina primero el rendimiento base global antes de agregar Equipos o Mano de Obra.");
                return prev;
            }

            const shouldInheritGlobalRendimiento =
                prev.rendimiento_global_activado &&
                isEligibleForGlobalRendimiento;

            const inheritedRendimiento = shouldInheritGlobalRendimiento
                ? resolvedGlobalRendimiento
                : default_rendimiento;

            const newLinea = {
                unique_key: uniqueKey,
                recurso_id: isApu ? null : item.id,
                apu_hijo_id: isApu ? item.id : null,
                cantidad: formatCalculo(1.0),
                rendimiento: formatCalculo(inheritedRendimiento),
                orden: prev.lineas.length,
                item_obj: item, // Referencia visual
                is_apu: isApu,
                categoria_calc: target_category,
                hide_rendimiento: es_oculto
            };

            return {
                ...prev,
                lineas: buildPersistedLineOrder([...prev.lineas, newLinea])
            };
        });

        // Auto-scroll al nuevo
        setTimeout(() => {
            const el = document.getElementById(`row-${uniqueKey}`);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 150);

    };

    const removeLinea = (uniqueKey) => {
        setFormApu(prev => ({
            ...prev,
            lineas: buildPersistedLineOrder(prev.lineas.filter(l => l.unique_key !== uniqueKey && l.id !== uniqueKey))
        }));
    };

    const updateLinea = (uniqueKey, field, value) => {
        setFormApu(prev => {
            // Restricción: solo números, puntos y comas
            if (field === 'cantidad' || field === 'rendimiento') {
                if (value !== '' && !/^[0-9.,]*$/.test(value)) return prev;
            }

            const normalizedValue = (field === 'cantidad' || field === 'rendimiento' || field === 'precio') 
                ? parseNumericInput(value) 
                : value;
            
            const numValue = normalizedValue === '' ? '' : normalizedValue; 
            const safeNumValue = (v) => (v === '' || isNaN(v)) ? 0 : v;

            const lineaModificada = prev.lineas.find(l => String(l.unique_key) === String(uniqueKey) || String(l.id) === String(uniqueKey));
            const targetCat = lineaModificada ? getEffectiveCategoria(lineaModificada) : null;

            // ¿Aplica rendimiento global? Solo si activado + es campo rendimiento + afecta cat 1 o 4
            const applyGlobal = prev.rendimiento_global_activado && field === 'rendimiento' && (targetCat === 1 || targetCat === 4);

            return {
                ...prev,
                lineas: prev.lineas.map(l => {
                    const isTargetRow = String(l.unique_key) === String(uniqueKey) || String(l.id) === String(uniqueKey);

                    if (isTargetRow) {
                        return { ...l, [field]: numValue };
                    }

                    if (applyGlobal) {
                        const currentCat = getEffectiveCategoria(l);
                        if (currentCat === 1 || currentCat === 4) {
                            return { ...l, rendimiento: numValue };
                        }
                    }

                    return l;
                })
            };
        });
    };

    const handleToggleRendimientoGlobal = () => {
        setFormApu((prev) => ({
            ...prev,
            rendimiento_global_activado: !prev.rendimiento_global_activado
        }));
    };

    const requiresExplicitGlobalBase =
        formApu.rendimiento_global_activado &&
        !hasEligibleGlobalLineas(formApu.lineas);

    const globalBaseRendimientoResolved = resolveGlobalRendimiento(formApu.lineas, formApu.rendimiento_global_base);

    const extractItemsByCat = (catId) => {
        let itemsForCat = [];
        if (catId === 5) {
            itemsForCat = editingApu ? nestedApusCatalog : apus;
        } else {
            itemsForCat = recursos.filter(r => (r.codigo || '').startsWith(catId.toString()));
        }

        const filteredItems = itemsForCat.filter(i => includesNormalized(i.descripcion, searchLeft) || includesNormalized(i.codigo, searchLeft));

        const grupos = {};
        allSubcategorias.filter(s => s.codigo.startsWith(`${catId}-`)).forEach(s => {
            grupos[s.id] = { subcat: s, items: [] };
        });

        filteredItems.forEach(item => {
            const subId = item.subcategoria_item_id;
            if (grupos[subId]) {
                grupos[subId].items.push(item);
            } else {
                if (!grupos['other']) grupos['other'] = { subcat: { id: `other-${catId}`, codigo: `${catId}-XXX`, descripcion: 'General' }, items: [] };
                grupos['other'].items.push(item);
            }
        });

        return {
            totalItems: filteredItems.length,
            grupos: Object.values(grupos)
                .filter((g) => {
                    if (catId === 5 && editingApu && !searchLeft) {
                        return true;
                    }
                    return g.items.length > 0;
                })
                .sort((a, b) => a.subcat.codigo.localeCompare(b.subcat.codigo))
        };
    };

    // Cálculos en vivo 
    const resolveEditorLinePrice = useCallback((linea) => {
        const item = linea?.item_obj || linea?.recurso || linea?.apu_hijo;
        const rawPrice = linea?.precio !== undefined && linea?.precio !== null && linea?.precio !== ''
            ? linea.precio
            : linea?.precio_congelado ?? (
                linea?.is_apu || linea?.apu_hijo_id
                    ? (item?.costo_directo ?? item?.precio_unitario_total ?? 0)
                    : (item?.precio ?? item?.precio_unitario_total ?? 0)
            );
        return resolveApuLineOperationalUnitPrice(
            { ...linea, precio: parseNumericInput(rawPrice), item_obj: item },
            { moneyDecimals: precisionMoneda || 2 }
        );
    }, [parseNumericInput, precisionMoneda]);

    const calculateEditorLinePartial = useCallback((linea) => {
        const precioBase = resolveEditorLinePrice(linea);
        const cantidadRaw = linea?.cantidad_num ?? linea?.cantidad ?? 0;
        const rendimientoRaw = linea?.rendimiento_num ?? linea?.rendimiento ?? 1;

        return resolveApuLineOperationalSubtotal(
            {
                ...linea,
                precio: precioBase,
                cantidad_num: parseNumericInput(cantidadRaw),
                rendimiento_num: parseNumericInput(rendimientoRaw),
            },
            {
                moneyDecimals: precisionMoneda || 2,
                preferPersistedSubtotal: false,
            }
        );
    }, [parseNumericInput, precisionMoneda, resolveEditorLinePrice]);

    const calculos = useMemo(() => {
        // Obtenemos el costo indirecto basado en la parametrización de la base actual
        let rawPct = selectedBaseTrabajo?.porcentaje_indirectos;
        let pctIndirecto = rawPct != null ? divideDecimalNumber(rawPct, 100, { decimals: 6 }) : 0;
        const subtotales = [];
        const breakdown = { manoObra: [], materiales: [], equipos: [], otros: [] };

        if (formApu && Array.isArray(formApu.lineas)) {
            formApu.lineas.forEach(l => {
                const item = l.item_obj || l.recurso || l.apu_hijo;
                if (!item) return;

                const subtotal = calculateEditorLinePartial(l);
                subtotales.push(subtotal);

                // Breakdown por categoría
                const cat = l.categoria_calc || (l.is_apu ? 2 : parseInt(item.codigo?.charAt(0) || "2"));
                if (cat === 4) breakdown.manoObra.push(subtotal);
                else if (cat === 2) breakdown.materiales.push(subtotal);
                else if (cat === 1) breakdown.equipos.push(subtotal);
                else breakdown.otros.push(subtotal);
            });
        }

        const costoDirecto = sumDecimalNumber(subtotales, { decimals: precisionMoneda || 2 });
        const costoIndirecto = roundDecimalNumber(costoDirecto * pctIndirecto, precisionMoneda || 2);
        const total = sumDecimalNumber([costoDirecto, costoIndirecto], { decimals: precisionMoneda || 2 });

        return {
            directo: costoDirecto,
            total: costoDirecto,
            indirectoPct: pctIndirecto * 100,
            indirecto: costoIndirecto,
            totalConIndirectos: total,
            manoObra: sumDecimalNumber(breakdown.manoObra, { decimals: precisionMoneda || 2 }),
            materiales: sumDecimalNumber(breakdown.materiales, { decimals: precisionMoneda || 2 }),
            equipos: sumDecimalNumber(breakdown.equipos, { decimals: precisionMoneda || 2 }),
            otros: sumDecimalNumber(breakdown.otros, { decimals: precisionMoneda || 2 })
        };
    }, [calculateEditorLinePartial, formApu, precisionMoneda, selectedBaseTrabajo]);

    const lineasEditor = useMemo(() => {
        return buildPersistedLineOrder(formApu.lineas || []).map(l => {
            const item = l.item_obj || l.recurso || l.apu_hijo;
            return {
                ...l,
                codigo: item?.codigo || '---',
                descripcion: item?.descripcion || '---',
                unidad: item?.unidad || '---',
                // El editor debe operar con el mismo precio monetario funcional que se muestra al usuario.
                precio: resolveEditorLinePrice(l),
                subcategoria_nombre: item?.subcategoria_nombre || 'General',
                categoria_id: l.categoria_calc || (l.is_apu ? 2 : parseInt(String(item?.codigo || "").charAt(0) || "2")),
                cantidad_num: parseNumericInput(l.cantidad),
                rendimiento_num: parseNumericInput(l.rendimiento)
            };
        });
    }, [formApu.lineas, parseNumericInput, resolveEditorLinePrice]);

    const renderEditorLineActions = (linea, rowKey) => (
        <div className="flex items-center gap-1 rounded-xl border border-zinc-200 bg-white/95 p-1 shadow-[0_8px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm">
            {linea.is_apu ? (
                <button
                    type="button"
                    onClick={() => handleEditNestedApu(linea)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-orange-50 hover:text-[#F39200]"
                    title="Editar APU anidado"
                >
                    <Edit2 className="h-3 w-3" />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => openEditResource(linea.item_obj || linea.recurso)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-orange-50 hover:text-[#F39200]"
                    title="Editar recurso"
                >
                    <Edit2 className="h-3 w-3" />
                </button>
            )}
            <button
                type="button"
                onClick={() => removeLinea(rowKey)}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300 transition-all hover:bg-red-50 hover:text-red-500"
            >
                <X className="h-3 w-3" />
            </button>
        </div>
    );

    const renderEditorLineRow = (linea, idx, catId, directCost, editorGridClass) => {
        const rowKey = linea.unique_key || linea.id || idx;
        const partial = calculateEditorLinePartial(linea);
        const lineRelative = Number(directCost || 0) > 0 ? partial / Number(directCost || 0) : 0;
        const dragButton = (
            <button
                type="button"
                draggable
                onDragStart={(e) => handleEditorLineDragStart(e, rowKey)}
                onDragEnd={handleEditorLineDragEnd}
                className={`p-1.5 rounded-lg border transition-all cursor-grab active:cursor-grabbing ${
                    draggingEditorLineKey === rowKey
                        ? 'border-[#F39200] bg-orange-50 text-[#F39200]'
                        : 'border-zinc-200 bg-white text-zinc-400 hover:text-zinc-700 hover:border-zinc-300'
                }`}
                title="Arrastrar para reordenar dentro de esta categoría"
            >
                <GripVertical className="w-3.5 h-3.5" />
            </button>
        );
        const quantityInput = (
            <input
                type="text"
                value={linea.cantidad !== undefined && linea.cantidad !== null ? formatNumericDisplay(linea.cantidad) : ''}
                onFocus={(e) => e.target.select()}
                onBlur={(e) => {
                    const val = e.target.value;
                    if (val !== '') updateLinea(rowKey, 'cantidad', formatCalculo(val));
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        const val = e.target.value;
                        if (val !== '') updateLinea(rowKey, 'cantidad', formatCalculo(val));
                        e.target.blur();
                    }
                }}
                onChange={(e) => updateLinea(rowKey, 'cantidad', e.target.value)}
                className="w-full text-center bg-white border border-zinc-200 rounded-lg px-2 py-1.5 text-[10px] font-black text-zinc-900 focus:outline-none focus:border-[#F39200] focus:ring-1 focus:ring-[#F39200] transition-all"
            />
        );
        const priceInput = (
            <div className="flex items-center justify-end gap-1">
                <span className="text-[10px] font-black text-zinc-400">$</span>
                <input
                    type="text"
                    value={linea.precio !== undefined && linea.precio !== null ? formatNumericDisplay(linea.precio, precisionMoneda) : ''}
                    readOnly
                    title="El precio base se edita desde el recurso (botón Lápiz)"
                    className="w-full text-right bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-[10px] font-black text-zinc-500 cursor-not-allowed transition-all"
                />
            </div>
        );
        const rendimientoInput = (catId === 1 || catId === 4) ? (
            <input
                type="text"
                value={linea.rendimiento !== undefined && linea.rendimiento !== null ? formatNumericDisplay(linea.rendimiento) : ''}
                onFocus={(e) => e.target.select()}
                onBlur={(e) => {
                    const val = e.target.value;
                    if (val !== '') updateLinea(rowKey, 'rendimiento', formatCalculo(val));
                }}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                        const val = e.target.value;
                        if (val !== '') updateLinea(rowKey, 'rendimiento', formatCalculo(val));
                        e.target.blur();
                    }
                }}
                onChange={(e) => updateLinea(rowKey, 'rendimiento', e.target.value)}
                className="w-full text-center bg-[#FFF9F0] border border-orange-100 rounded-lg px-2 py-1.5 text-[10px] font-black text-[#F39200] focus:outline-none focus:border-[#F39200] transition-all"
            />
        ) : (
            <div className="py-1.5 text-center text-zinc-300 text-[10px] font-bold">—</div>
        );
        const showRelativeColumn = !isEditorCompact;
        const lineUnit = resolveApuLineUnitDescription(linea);

        return (
            <div
                key={rowKey}
                id={`row-${rowKey}`}
                title={`${renderApuDescription(linea.descripcion) || ''}${lineUnit ? ` | Und: ${lineUnit}` : ''}`}
                onDragOver={(e) => handleEditorLineDragOver(e, rowKey)}
                onDrop={(e) => handleEditorLineDrop(e, rowKey)}
                className={`px-6 py-4 pb-12 transition-colors group relative ${
                    dragOverEditorLineKey === rowKey ? 'bg-orange-50 ring-1 ring-inset ring-[#F39200]' : 'hover:bg-zinc-50/30'
                }`}
            >
                <div className={`${editorGridClass} items-center`}>
                    <div className="flex items-center justify-center">{dragButton}</div>
                    <div className="min-w-0 flex items-center gap-2 overflow-hidden">
                        <div className="inline-flex max-w-[9rem] shrink-0 rounded-xl border border-blue-100 bg-white px-2 py-1 shadow-xs">
                            <CodeColorizer code={linea.codigo} className="block max-w-full truncate text-[8px]" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <span className="block truncate text-[11px] font-bold tracking-tight text-zinc-700">
                                {renderApuDescription(linea.descripcion)}
                            </span>
                        </div>
                    </div>
                    <div className="text-center"><span className="text-[9px] font-bold text-zinc-400 normal-case">{renderUnidad(lineUnit)}</span></div>
                    <div>{quantityInput}</div>
                    <div>{priceInput}</div>
                    <div>{rendimientoInput}</div>
                    <div className="text-right"><span className="text-[11px] font-black tracking-tighter text-zinc-900">${formatMoneda(partial)}</span></div>
                    {showRelativeColumn && (
                        <div className="text-right"><span className="text-[10px] font-black uppercase tracking-widest text-[#F39200]">{formatRelativePercent(lineRelative)}</span></div>
                    )}
                </div>
                <div className="pointer-events-none absolute bottom-3 right-6 opacity-0 translate-y-1 transition-all duration-150 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100">
                    <div className="pointer-events-auto">
                        {renderEditorLineActions(linea, rowKey)}
                    </div>
                </div>
            </div>
        );
    };


    const buildApuEditorPayload = () => {
        if (!formApu.descripcion.trim()) {
            appAlert("La descripción es obligatoria.");
            return null;
        }

        const lineasLimpias = buildPersistedLineOrder(formApu.lineas)
            .filter(l => l.recurso_id || l.apu_hijo_id)
            .map((l, index) => ({
                recurso_id: l.recurso_id,
                apu_hijo_id: l.apu_hijo_id,
                cantidad: toDecimalNumber(parseNumericInput(l.cantidad), '0'),
                rendimiento: l.hide_rendimiento ? 1.0 : toDecimalNumber(parseNumericInput(l.rendimiento), '0'),
                orden: index
            }));

        if (lineasLimpias.some(l => isNaN(l.cantidad) || isNaN(l.rendimiento))) {
            throw new Error("Hay valores numéricos inválidos en las líneas.");
        }

        const payload = {
            codigo: formApu.codigo,
            descripcion: renderApuDescription(formApu.descripcion),
            unidad: resolveUnitDescription(apuUnidades, formApu.unidad_id, formApu.unidad || ''),
            subcategoria_item_id: formApu.subcategoria_item_id,
            base_trabajo_id: selectedBaseTrabajo?.id || activeProject?.base_trabajo_id || 1,
            rendimiento_estandar: 1.0,
            estado_revision: formApu.por_validar ? 'Pendiente' : 'Revisado',
            omniclass_codigo: formApu.omniclass_codigo,
            omniclass_titulo: formApu.omniclass_titulo,
            lineas: lineasLimpias
        };

        if (!useOmniClass) {
            payload.omniclass_codigo = '';
            payload.omniclass_titulo = '';
        }

        return payload;
    };

    const persistCurrentApuEditor = async ({ closeEditor = true, successMessage = null } = {}) => {
        const payload = buildApuEditorPayload();
        if (!payload) return null;

        try {
            setSaving(true);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            let savedApuId = editingApu;

            if (editingApu === 'new') {
                const res = await apusApi.create(payload, empId, effectiveBaseRevision);
                if (res.data?.id) {
                    savedApuId = res.data.id;
                    setLastActionId(res.data.id);
                }
            } else {
                await apusApi.update(editingApu, payload, empId);
                setLastActionId(editingApu);
                setSelectedApus((prev) => prev.filter((id) => id !== editingApu));
            }

            if (successMessage) {
                showToast(successMessage);
            }

            if (closeEditor) {
                setEditingApuHistory([]);
                setInitialApuEditorSnapshot(null);
                setPendingDuplicatedApuId((current) => (current === savedApuId ? null : current));
                setEditingApu(null);
                fetchData();
            } else {
                setPendingDuplicatedApuId((current) => (current === savedApuId ? null : current));
                setInitialApuEditorSnapshot(serializeApuEditorState(formApu));
            }
            setSavedRendimientoGlobalPreference(Boolean(formApu.rendimiento_global_activado));
            persistApuEditorGlobalRendimientoPreference(Boolean(formApu.rendimiento_global_activado));
            return savedApuId;
        } catch (error) {
            const msg = error.response?.data?.detail || error.message || "Error al guardar APU";
            showToast(msg, "error");
            return null;
        } finally {
            setSaving(false);
        }
    };

    const handleSaveApu = async () => {
        await persistCurrentApuEditor({
            closeEditor: true,
            successMessage: editingApu === 'new' ? "APU creado con éxito" : "APU actualizado con éxito",
        });
    };

    const handleEditNestedApu = async (linea) => {
        const nestedApuId = Number(linea?.apu_hijo_id || linea?.item_obj?.id || 0);
        if (!nestedApuId) return;

        let impactSummary = null;
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const impactRes = await apusApi.getImpactSummary(nestedApuId, empId);
            impactSummary = impactRes?.data || null;
        } catch (error) {
            console.warn('No se pudo resolver el impacto del APU anidado', error);
        }

        const confirmed = await appConfirm(buildNestedApuEditConfirmConfig({
            currentApuDescripcion: formApu?.descripcion,
            nestedApuDescripcion: linea?.descripcion || linea?.item_obj?.descripcion,
            parentApusCount: impactSummary?.parent_apus_count,
            affectedPresupuestosCount: impactSummary?.affected_presupuestos_count,
        }));
        if (!confirmed) return;

        const currentEditingApuId = editingApu === 'new' ? null : Number(editingApu);
        const savedApuId = await persistCurrentApuEditor({
            closeEditor: false,
            successMessage: "APU actual guardado. Cargando APU anidado...",
        });
        if (!savedApuId) return;

        if (currentEditingApuId || savedApuId) {
            setEditingApuHistory((prev) => [...prev, {
                id: currentEditingApuId || savedApuId,
                codigo: formApu?.codigo,
                descripcion: formApu?.descripcion,
            }]);
        }

        await handleEditApu({ id: nestedApuId }, { resetHistory: false });
    };

    const handleReturnToParentApu = async () => {
        if (editingApuHistory.length === 0) return;
        const nextHistory = [...editingApuHistory];
        const parentApu = nextHistory.pop();
        const returnToParent = async () => {
            setEditingApuHistory(nextHistory);
            await handleEditApu({ id: parentApu?.id }, { resetHistory: false });
        };

        if (!isApuEditorDirty) {
            await returnToParent();
            return;
        }

        const decision = await appConfirm({
            title: 'Volver al APU padre',
            message: 'Hay cambios pendientes en este APU anidado. ¿Qué desea hacer antes de volver al padre?',
            confirmLabel: 'Guardar y volver',
            secondaryLabel: 'Volver sin guardar',
            secondaryResult: 'discard',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });

        if (decision === true) {
            const savedApuId = await persistCurrentApuEditor({
                closeEditor: false,
                successMessage: 'Cambios guardados. Volviendo al APU padre...',
            });
            if (!savedApuId) return;
            await returnToParent();
            return;
        }

        if (decision === 'discard') {
            await returnToParent();
        }
    };

    const handleDragOverEditor = (e, catId) => {
        e.preventDefault();
        setDragOverCatEditor(catId);
    };

    const handleEditorLineDragStart = (e, lineKey) => {
        setDraggingEditorLineKey(lineKey);
        e.dataTransfer.setData('editor_line_key', String(lineKey));
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleEditorLineDragOver = (e, lineKey) => {
        e.preventDefault();
        if (draggingEditorLineKey && String(draggingEditorLineKey) !== String(lineKey)) {
            setDragOverEditorLineKey(lineKey);
        }
    };

    const handleEditorLineDrop = async (e, targetLineKey) => {
        e.preventDefault();
        const sourceKey = e.dataTransfer.getData('editor_line_key') || draggingEditorLineKey;
        setDragOverEditorLineKey(null);
        setDraggingEditorLineKey(null);
        if (!sourceKey || String(sourceKey) === String(targetLineKey)) return;

        const previousLineas = [...(formApu.lineas || [])];
        const nextLineas = reorderLineasWithinCategory(previousLineas, sourceKey, targetLineKey);
        setFormApu((prev) => ({
            ...prev,
            lineas: nextLineas
        }));

        if (editingApu === 'new') {
            return;
        }

        const sourceLinea = previousLineas.find((linea) => String(linea.unique_key || linea.id) === String(sourceKey));
        const targetLinea = previousLineas.find((linea) => String(linea.unique_key || linea.id) === String(targetLineKey));
        if (!sourceLinea?.id || !targetLinea?.id) {
            return;
        }

        const sourceCategory = getEffectiveCategoria(sourceLinea);
        if (sourceCategory !== getEffectiveCategoria(targetLinea)) {
            return;
        }

        const categoryLineas = nextLineas.filter((linea) => getEffectiveCategoria(linea) === sourceCategory);
        const targetIndex = categoryLineas.findIndex((linea) => String(linea.id || linea.unique_key) === String(sourceLinea.id));
        if (targetIndex < 0) {
            return;
        }

        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await apusApi.moveLinea(editingApu, sourceLinea.id, targetIndex, empId);
        } catch (error) {
            console.error('Error persistiendo orden de líneas APU:', error);
            setFormApu((prev) => ({
                ...prev,
                lineas: previousLineas,
            }));
            appAlert(error?.response?.data?.detail || 'No se pudo persistir el nuevo orden de recursos del APU.');
        }
    };

    const handleEditorLineDragEnd = () => {
        setDraggingEditorLineKey(null);
        setDragOverEditorLineKey(null);
    };

    const handleDropEditor = (e, catId) => {
        e.preventDefault();
        setDragOverCatEditor(null);
        const rawData = e.dataTransfer.getData('resource_item');
        if (!rawData) return;
        try {
            const data = JSON.parse(rawData);
            addLinea(data.item, data.isApu, catId);
        } catch (error) {
            console.error("Error drop editor:", error);
        }
    };


    const openEditResource = async (item) => {
        setEditingRecurso(item);
        
        const rawPrice = item.recurso?.precio || item.precio || item.costo_directo || item.precio_unitario_total || 0;

        setResourceForm({
            descripcion: item.recurso?.descripcion || item.descripcion,
            precio: formatMonedaInput(rawPrice),
            unidad_id: item.recurso?.unidad_id || item.unidad_id,
            cod_cpc_id: item.recurso?.cod_cpc_id || item.cod_cpc_id,
            especificaciones: (item.recurso?.especificaciones || item.especificaciones) || '',
            cpc_display: item.recurso?.cpc ? `${item.recurso.cpc.codCPC} - ${item.recurso.cpc.descripcion.substring(0, 30)}...` : 
                        item.cpc ? `${item.cpc.codCPC} - ${item.cpc.descripcion.substring(0, 30)}...` : '',
            equipment_ownership_kind: item.recurso?.equipment_ownership_kind || item.equipment_ownership_kind || '',
            governing_resource_kind: item.recurso?.governing_resource_kind || item.governing_resource_kind || '',
            omniclass_codigo: item.recurso?.omniclass_codigo || item.omniclass_codigo || '',
            omniclass_titulo: item.recurso?.omniclass_titulo || item.omniclass_titulo || ''
        });

        // Si el recurso pertenece a una categoría distinta a la seleccionada actualmente, 
        // debemos cargar las unidades correspondientes para evitar que se muestre una unidad incorrecta.
        const resourceCat = item.recurso?.subcategoria_codigo || item.subcategoria_codigo || item.categoria_id;
        if (resourceCat) {
            try {
                const empId = user?.rol?.toLowerCase() === 'superadministrador' ? selectedEmpresa?.id : null;
                const res = await recursosApi.getUnidades(resourceCat, selectedBaseTrabajo.id, empId);
                setResourceUnidades(res.data || []);
            } catch (error) {
                console.error("Error fetching units for resource category:", error);
                setResourceUnidades([]);
            }
        } else {
            setResourceUnidades([]);
        }
        setShowResourceModal(true);
    };

    const handleSaveResource = async (e) => {
        e.preventDefault();
        try {
            const data = { ...resourceForm };
            // Normalizar precio antes de enviar al backend
            data.precio = parseFloat(parseNumericInput(data.precio)) || 0;
            delete data.cpc_display;
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const selectedUnit = findMatchingUnit(resourceUnidades, data.unidad_id);
            
            await recursosApi.update(editingRecurso.id, data, empId);
            
            // Actualizar las líneas del APU en edición que usen este recurso
            setFormApu(prev => ({
                ...prev,
                lineas: prev.lineas.map(l => {
                    if (l.recurso_id === editingRecurso.id) {
                        const nextItemObj = {
                            ...l.item_obj,
                            ...data,
                            descripcion: renderApuDescription(data.descripcion),
                            unidad_id: data.unidad_id,
                            unidad: selectedUnit
                                ? {
                                    ...selectedUnit,
                                }
                                : l.item_obj?.unidad,
                            recurso: l.item_obj?.recurso
                                ? {
                                    ...l.item_obj.recurso,
                                    ...data,
                                    descripcion: renderApuDescription(data.descripcion),
                                    unidad_id: data.unidad_id,
                                    unidad: selectedUnit
                                        ? { ...selectedUnit }
                                        : l.item_obj.recurso.unidad,
                                }
                                : undefined,
                        };
                        return { 
                            ...l, 
                            precio: Number(parseNumericInput(data.precio)) || 0,
                            omniclass_codigo: data.omniclass_codigo || '',
                            omniclass_titulo: data.omniclass_titulo || '',
                            item_obj: nextItemObj
                        };
                    }
                    return l;
                })
            }));

            setShowResourceModal(false);
            setEditingRecurso(null);
            setResourceUnidades([]);
            showToast("Recurso actualizado correctamente");
        } catch (error) {
            appAlert(error.response?.data?.detail || "Error al guardar el recurso");
        }
    };

    const handleResourceSpellCheck = async () => {
        if (!resourceForm.especificaciones.trim()) return;
        try {
            const res = await utilsApi.spellcheck(resourceForm.especificaciones);
            if (res.data.has_errors) {
                const confirmed = await appConfirm({
                    title: 'Aplicar corrección ortográfica',
                    message: `Sugerencia de corrección:\n\n${res.data.corrected}\n\n¿Desea aplicar?`,
                    confirmLabel: 'Aplicar',
                    cancelLabel: 'Mantener actual',
                    tone: 'info'
                });
                if (confirmed) setResourceForm(prev => ({ ...prev, especificaciones: res.data.corrected }));
            } else {
                appAlert("Ortografía correcta.");
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden">
            {!editingApu ? (
                <>
                    {/* Header Contextual - Fijo */}
                    <div className="bg-zinc-100 border-b border-zinc-200 px-8 py-3 flex items-center justify-between flex-shrink-0 z-50">
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                                <div className="flex items-center gap-3">
                                    <Database className="w-4 h-4 text-[#F39200]" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Base Activa:</span>
                                    <MarketplaceOriginBadgeSet
                                        origin={activeBaseOrigin}
                                    loading={activeBaseOrigin.loading}
                                    label="Origen"
                                    mode="tooltip"
                                />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-zinc-800">{selectedBaseTrabajo?.nombre}</span>
                                {selectedBaseTrabajo?.source_base_id && (
                                    <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-sky-700">
                                        Proviene de {sourceBaseLabel || 'Base Maestra'}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Header Principal - Fijo */}
                    <div className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between flex-shrink-0 z-40 shadow-sm">
                        <div className="flex items-center gap-4">
                            {cameFromProjectModule ? (
                                <button
                                    onClick={handleReturnToProjectModule}
                                    className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-[#F39200]"
                                >
                                    <ArrowLeft className="w-4 h-4" />
                                    Volver al módulo Proyecto
                                </button>
                            ) : (
                                <button onClick={() => navigate('/precios-unitarios')} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                                    <ArrowLeft className="w-5 h-5 text-zinc-500" />
                                </button>
                            )}
                            <div>
                                <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900">Módulo de APUs</h1>
                                <p className="text-[10px] font-bold text-[#F39200] uppercase tracking-widest text-left">
                                    {cameFromProjectModule
                                        ? 'Editor / creador de APUs para la revisión activa del proyecto'
                                        : 'Catálogo General de Análisis de Precios Unitarios'}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-xl shadow-sm">
                                    <button
                                        type="button"
                                        onClick={handleOpenImportModal}
                                        className="px-3 py-2 hover:bg-zinc-50 rounded-lg text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2 transition-colors"
                                        title="Importar desde otra base de trabajo externa"
                                    >
                                        <Database className="w-3.5 h-3.5 text-[#F39200]" /> Base Ext.
                                    </button>
                                    <div className="w-px h-4 bg-zinc-200 mx-1" />
                                    <button
                                        type="button"
                                        onClick={openImportModal}
                                        className="px-3 py-2 hover:bg-zinc-50 rounded-lg text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2 transition-colors"
                                        title="Importar desde portapapeles"
                                    >
                                        <Copy className="w-3.5 h-3.5" /> Importar
                                    </button>
                                    <div className="w-px h-4 bg-zinc-200 mx-1" />
                                    <button
                                        type="button"
                                        onClick={handleBulkDelete}
                                        disabled={selectedApus.length === 0}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${selectedApus.length > 0 ? 'text-red-500 hover:bg-red-50' : 'text-zinc-300 pointer-events-none'}`}
                                        title="Borrar seleccionados"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" /> Borrar ({selectedApus.length})
                                    </button>
                                    <div className="w-px h-4 bg-zinc-200 mx-1" />
                                    <button
                                        type="button"
                                        onClick={handleOpenReportPreview}
                                        disabled={selectedApus.length === 0}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${selectedApus.length > 0 ? 'text-blue-600 hover:bg-blue-50' : 'text-zinc-300 pointer-events-none'}`}
                                        title="Generar reporte de seleccionados"
                                    >
                                        <FileText className="w-3.5 h-3.5" /> Reportes ({selectedApus.length})
                                    </button>
                                </div>
                                <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-xl shadow-sm">
                                    <div className="flex items-center gap-1 pr-2 mr-1 border-r border-zinc-200">
                                        {APU_STATUS_FILTER_OPTIONS.map((option) => {
                                            const isActive = apuStatusFilter === option.id;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => setApuStatusFilter(option.id)}
                                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase transition-all ${isActive ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:bg-zinc-50'}`}
                                                    title={`Filtrar APUs: ${option.label}`}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={toggleSelectAllVisible}
                                        disabled={visibleApuIds.length === 0}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${visibleApuIds.length > 0 ? 'text-zinc-600 hover:bg-zinc-50' : 'text-zinc-300 pointer-events-none'}`}
                                        title="Seleccionar visibles"
                                    >
                                        <SoftSelectToggle
                                            as="span"
                                            checked={allVisibleSelected}
                                            label={allVisibleSelected ? 'Quitar visibles' : 'Seleccionar visibles'}
                                            size="md"
                                            tone="blue"
                                            muted={!someVisibleSelected && !allVisibleSelected}
                                            indicatorClassName={someVisibleSelected && !allVisibleSelected ? 'border-[#F39200] bg-[#F39200]/35 opacity-100' : ''}
                                            className="-my-1"
                                        />
                                        {allVisibleSelected ? 'Quitar visibles' : 'Seleccionar visibles'}
                                    </button>
                                    <div className="w-px h-4 bg-zinc-200 mx-1" />
                                    <button
                                        type="button"
                                        onClick={clearSelection}
                                        disabled={selectedApus.length === 0}
                                        className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${selectedApus.length > 0 ? 'text-zinc-500 hover:bg-zinc-50' : 'text-zinc-300 pointer-events-none'}`}
                                        title="Limpiar selección"
                                    >
                                        <X className="w-3.5 h-3.5" /> Limpiar
                                    </button>
                                </div>
                            </div>

                            {/* Buscador Contextual */}
                            <ClearSearchField
                                value={searchRight || ''}
                                onValueChange={setSearchRight}
                                placeholder="Buscar por descripción"
                                containerClassName="w-64 lg:w-80"
                                searchIconClassName="left-4"
                                inputClassName="w-full pl-12 pr-10 h-11 bg-zinc-50 hover:bg-zinc-100 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:border-[#F39200] focus:bg-white focus:ring-1 focus:ring-[#F39200] transition-all font-bold"
                            />

                            <button
                                type="button"
                                onClick={handleCreateNew}
                                className="h-11 px-4 rounded-2xl border border-amber-200 bg-white hover:bg-amber-50 text-zinc-800 shadow-sm transition-all active:scale-[0.98] inline-flex items-center gap-3"
                            >
                                <span className="w-7 h-7 rounded-full bg-amber-100 border border-amber-200 inline-flex items-center justify-center text-[#F39200]">
                                    <Plus className="w-4 h-4" />
                                </span>
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-800">Nuevo APU</span>
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-hidden flex">
                        {/* Sidebar de Subcategorías (Cat 5) */}
                        <div className="w-64 bg-white border-r border-zinc-200 flex flex-col h-full bg-[#FAFAFA]">
                            <div className="p-4 border-b border-zinc-100 bg-white/50 flex items-center justify-between">
                                <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Subcategorías APU</h3>
                            </div>

                            <div className="px-3 pt-3">
                                <ClearSearchField
                                    value={searchSubcategories || ''}
                                    onValueChange={setSearchSubcategories}
                                    placeholder="Filtrar subcategorías..."
                                    searchIconClassName="h-3.5 w-3.5"
                                    inputClassName="w-full pl-10 pr-10 h-10 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] font-bold text-zinc-700 focus:outline-none focus:border-[#F39200] focus:ring-1 focus:ring-[#F39200] transition-all"
                                />
                            </div>

                            <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                                {subcategorias.length === 0 ? (
                                    <div className="text-center py-10 px-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-100">
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase italic">Sin subcategorías</p>
                                    </div>
                                ) : visibleApuSubcategories.length === 0 ? (
                                    <div className="text-center py-10 px-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-100">
                                        <p className="text-[9px] font-bold text-zinc-400 uppercase italic">Sin coincidencias</p>
                                        <p className="mt-1 text-[10px] font-medium text-zinc-400">Pruebe con otra descripción o código.</p>
                                    </div>
                                ) : (
                                    visibleApuSubcategories.map(sub => (
                                        <div
                                            key={sub.id}
                                            onDragOver={(e) => handleDragOverAPU(e, sub.id)}
                                            onDragLeave={() => setDragOverSubcat(null)}
                                            onDrop={(e) => handleDropAPU(e, sub.id)}
                                            className="block"
                                        >
                                            {USE_ENHANCED_APU_SUBCATEGORY_LIST ? (
                                                <CatalogSidebarCard
                                                    codeNode={<CodeColorizer code={sub.codigo} className="text-[8px] block mb-1" />}
                                                    title={renderSubcategoryDescription(sub.descripcion)}
                                                    displayTitle={null}
                                                    tooltipText={renderSubcategoryDescription(sub.descripcion)}
                                                    count={sub.items_count}
                                                    footer={renderSubcategoryDescription(sub.descripcion)}
                                                    footerVariant="description"
                                                    active={selectedSubcatId === sub.id}
                                                    dragOver={dragOverSubcat === sub.id}
                                                    expanded={selectedSubcatId === sub.id}
                                                    onClick={() => handleToggleSubcategory(sub.id)}
                                                    className={dragOverSubcat === sub.id ? 'z-20' : ''}
                                                />
                                            ) : (
                                                <div className="flex items-center gap-2.5" onClick={() => handleToggleSubcategory(sub.id)}>
                                                    <div className="flex-1 text-left">
                                                        <CodeColorizer
                                                            code={sub.codigo}
                                                            className={`text-[8px] block mb-0.5 ${selectedSubcatId === sub.id ? 'opacity-90' : 'opacity-70'}`}
                                                        />
                                                        <p className="text-[11px] font-bold uppercase tracking-tight line-clamp-1">
                                                            {renderSubcategoryDescription(sub.descripcion)}
                                                            {sub.items_count !== undefined && (
                                                                <span className={`ml-2 text-[9px] font-medium opacity-60 ${selectedSubcatId === sub.id ? 'text-white' : 'text-zinc-400'}`}>
                                                                    ({sub.items_count})
                                                                </span>
                                                            )}
                                                        </p>
                                                    </div>
                                                    <ChevronRight className={`w-3 h-3 transition-transform ${selectedSubcatId === sub.id ? 'rotate-90 text-[#F39200]' : 'text-zinc-300'}`} />
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Contenedor Principal de la Tabla */}
                        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-white">
                            <div className="max-w-7xl mx-auto space-y-8">
                                <div className="flex items-center justify-between mb-2">
                                    <div>
                                        <h2 className="text-xl font-black uppercase text-zinc-800 tracking-tight">
                                            {searchRight
                                                ? 'Resultados globales'
                                                : (subcategorias.find(s => s.id === selectedSubcatId)?.descripcion || 'General')}
                                        </h2>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                            {`${visibleApus.length} visibles / ${totalApusCount} totales`}
                                        </p>
                                    </div>
                                </div>

                                {loading ? (
                                    <div className="py-20 text-center"><div className="w-8 h-8 mx-auto border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" /></div>
                                ) : apus.length > 0 ? (
                                    <div className="flex flex-col gap-4">
                                        {visibleApus.map(apu => {
                                            const directo = roundDecimalNumber(apu.costo_directo || 0, precisionMoneda || 2);
                                            // Usar el % de indirectos de la base activa (referencial en catálogo)
                                            const pctBase = toDecimalNumber(selectedBaseTrabajo?.porcentaje_indirectos || calculos?.indirectoPct || 0, '0');
                                            const costoIndirectos = roundDecimalNumber(directo * divideDecimalNumber(pctBase, 100, { decimals: 6 }), precisionMoneda || 2);
                                            const totalConIndirectos = sumDecimalNumber([directo, costoIndirectos], { decimals: precisionMoneda || 2 });
                                            const normalizedRevisionStatus = normalizeApuRevisionStatus(apu.estado_revision);
                                            const isIncomplete = normalizedRevisionStatus === 'Pendiente' || toDecimalNumber(apu.precio_unitario_total || 0, '0') <= 0;
                                            return (
                                                <motion.div
                                                    key={apu.id}
                                                    id={`apu-${apu.id}`}
                                                    draggable="true"
                                                    onDragStart={(e) => handleDragStartAPU(e, apu.id)}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    onClick={() => toggleSelectApu(apu.id)}
                                                    onDoubleClick={() => handleEditApu(apu)}
                                                    className={`group relative bg-white border-2 rounded-[2rem] p-6 transition-all cursor-pointer overflow-hidden ${selectedApus.includes(apu.id)
                                                        ? 'border-[#F39200] bg-[#FFF9F0] shadow-md ring-4 ring-[#F39200]/10'
                                                        : 'border-zinc-100 hover:border-zinc-200 hover:shadow-xl'
                                                        }`}
                                                >
                                                    <div className="flex items-stretch gap-4">
                                                        <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                                                            <SoftSelectToggle
                                                                checked={selectedApus.includes(apu.id)}
                                                                onChange={(e) => toggleSelectApu(apu.id, e)}
                                                                label={selectedApus.includes(apu.id) ? 'Quitar de la selección' : 'Seleccionar APU'}
                                                                size="md"
                                                                tone="blue"
                                                                muted={!selectedApus.includes(apu.id)}
                                                            />
                                                        </div>

                                                        <div className="min-w-0 flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <CodeColorizer
                                                                    code={apu.codigo}
                                                                    className="text-[9px] bg-white px-2 py-0.5 rounded border border-zinc-100 shadow-sm"
                                                                />
                                                                <span className="text-[9px] font-black text-zinc-400 tracking-widest">
                                                                    <span className="uppercase">Unidad:</span>{' '}
                                                                    <span className="normal-case">{renderUnidad(apu.unidad)}</span>
                                                                </span>
                                                                <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${normalizedRevisionStatus === 'Pendiente' ? 'bg-red-50 text-red-600 border-red-100' :
                                                                    isIncomplete ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                                        'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                                    }`}>
                                                                    {normalizedRevisionStatus}
                                                                </span>
                                                            </div>
                                                            <h4 className="text-sm font-black text-zinc-800 tracking-tight leading-tight break-words">
                                                                {renderApuDescription(apu.descripcion)}
                                                            </h4>
                                                            <div className="flex items-center gap-3 mt-2">
                                                                <p className="text-[9px] font-medium text-zinc-400 font-bold uppercase tracking-widest">
                                                                    Actualizado: {apu.ultima_modificacion ? new Date(apu.ultima_modificacion).toLocaleString(undefined, { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '---'}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="text-right px-4 flex flex-col justify-center border-l border-zinc-100 min-w-[168px] flex-shrink-0">
                                                            <div className="mb-2">
                                                                <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mb-0.5 leading-none">Costo Directo</p>
                                                                <p className="text-base font-black text-zinc-900 tracking-tighter leading-none">
                                                                    ${formatMoneda(directo)}
                                                                </p>
                                                            </div>
                                                            {pctBase > 0 && (
                                                                <div className="pt-2 border-t border-zinc-50">
                                                                    <p className="text-[8px] font-black text-[#F39200] uppercase tracking-widest mb-0.5 leading-none">INDIRECTOS ({formatNumericDisplay(pctBase.toFixed(2))}%)</p>
                                                                    <p className="text-xs font-black text-[#F39200] tracking-tighter leading-none">
                                                                        ${formatMoneda(costoIndirectos)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                            {pctBase > 0 && (
                                                                <div className="pt-1.5 border-t border-zinc-100 mt-1">
                                                                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest mb-0.5 leading-none">Total ref.</p>
                                                                    <p className="text-sm font-black text-zinc-700 tracking-tighter leading-none">
                                                                        ${formatMoneda(totalConIndirectos)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-1 pl-4 border-l border-zinc-100 flex-shrink-0 self-center">
                                                            <button onClick={(e) => handleDuplicateApu(apu.id, e)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-[#F39200]" title="Duplicar"><Copy className="w-4 h-4" /></button>
                                                            <button onClick={() => handleEditApu(apu)} className="p-2 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-[#F39200]" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                                            <button onClick={(e) => handleDeleteApu(apu.id, e)} className="p-2 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500" title="Borrar"><Trash2 className="w-4 h-4" /></button>
                                                        </div>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="py-24 text-center bg-zinc-50 rounded-[2rem]">No hay APUs</div>
                                )}
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <>

                    <div className="flex-1 flex overflow-hidden bg-[#F2F4F7]">
                        {/* Panel Izquierdo: Recursos */}
                        <div
                            className={`${isEditorSidebarVisuallyCollapsed ? 'w-14' : (isEditorCompact ? 'w-[20rem]' : 'w-[32rem]')} bg-white border-r border-zinc-200 h-full flex flex-col z-10 relative transition-all duration-200`}
                            onMouseEnter={() => {
                                if (isEditorSidebarCollapsed) {
                                    setIsEditorSidebarHoverExpanded(true);
                                }
                            }}
                            onMouseLeave={() => {
                                if (isEditorSidebarCollapsed) {
                                    setIsEditorSidebarHoverExpanded(false);
                                }
                            }}
                        >
                            <div className={`${isEditorSidebarVisuallyCollapsed ? 'px-2 py-3 items-center' : (isEditorCompact ? 'p-5' : 'p-6')} bg-[#0f1115] border-b border-white/10 flex-shrink-0 flex ${isEditorSidebarVisuallyCollapsed ? 'flex-col gap-3' : 'flex-col'}`}>
                                <div className={`flex items-center ${isEditorSidebarVisuallyCollapsed ? 'justify-center' : 'justify-between'} gap-3 ${isEditorSidebarVisuallyCollapsed ? 'mb-0' : 'mb-4'}`}>
                                    {!isEditorSidebarVisuallyCollapsed && (
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-white/[0.06] rounded-[0.85rem] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                                <Layers className="w-4 h-4 text-[#F39200]" />
                                            </div>
                                            <div>
                                                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/45 leading-none mb-1">Catálogo de Base</h3>
                                                <p className="text-sm font-black text-white tracking-tight">Recursos Disponibles</p>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setIsEditorSidebarCollapsed((current) => {
                                                const next = !current;
                                                if (!next) {
                                                    setIsEditorSidebarHoverExpanded(false);
                                                }
                                                return next;
                                            });
                                        }}
                                        className="flex items-center justify-center w-9 h-9 rounded-[0.85rem] border border-white/10 bg-white/[0.05] text-white/65 hover:text-[#F39200] hover:border-[#F39200]/40 transition-all active:translate-y-[1px] active:scale-[0.96]"
                                        title={isEditorSidebarVisuallyCollapsed ? 'Expandir catálogo' : 'Contraer catálogo'}
                                    >
                                        {isEditorSidebarVisuallyCollapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                                    </button>
                                </div>
                                {!isEditorSidebarVisuallyCollapsed && (
                                    <ClearSearchField
                                        value={searchLeft || ''}
                                        onValueChange={setSearchLeft}
                                        placeholder="Buscar por código o nombre..."
                                        containerClassName="w-full"
                                        searchIconClassName={isEditorCompact ? 'left-3 w-3.5 h-3.5' : 'left-4 w-4 h-4'}
                                        inputClassName={`w-full ${isEditorCompact ? 'pl-10 pr-10 h-10 text-[13px]' : 'pl-12 pr-10 h-11 text-sm'} bg-white border border-zinc-200 rounded-[1.25rem] focus:outline-none focus:border-[#F39200] focus:ring-4 focus:ring-[#F39200]/5 text-zinc-700 placeholder:text-zinc-400 transition-all font-medium`}
                                    />
                                )}
                            </div>

                            <div className={`flex-1 overflow-y-auto ${isEditorSidebarVisuallyCollapsed ? 'hidden' : 'px-2 py-4'} custom-scrollbar`}>
                                {CATEGORIAS_BASE.map(cat => {
                                    const isExpandedCat = expandedCats.includes(cat.id) || searchLeft.length > 0;
                                    const { totalItems, grupos } = extractItemsByCat(cat.id);

                                    if (searchLeft && totalItems === 0) return null;

                                    return (
                                        <div key={cat.id} className="mb-1">
                                            <button
                                                onClick={() => {
                                                    if (searchLeft) return;
                                                    setExpandedCats(prev => isExpandedCat ? prev.filter(c => c !== cat.id) : [...prev, cat.id]);
                                                }}
                                                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${isExpandedCat ? 'bg-[#F2F4F7] text-zinc-900 border border-zinc-200 shadow-sm' : 'hover:bg-zinc-100 text-zinc-600'}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <span className={`text-xl ${isExpandedCat ? '' : 'grayscale opacity-80'}`}>{cat.icon}</span>
                                                    <div className="flex flex-col items-start leading-none">
                                                        <span className="text-[11px] font-black uppercase tracking-widest">{cat.nombre}</span>
                                                        <span className={`text-[8px] mt-1 ${isExpandedCat ? 'text-zinc-500' : 'text-zinc-500'}`}>
                                                            {cat.id === 5 ? `${(editingApu ? nestedApusCatalog : apus).length} APUs` : `${totalItems} recursos`}
                                                        </span>
                                                    </div>
                                                </div>
                                                {!searchLeft && (
                                                    <motion.div animate={{ rotate: isExpandedCat ? 180 : 0 }}>
                                                        <ChevronDown className="w-3 h-3 opacity-30" />
                                                    </motion.div>
                                                )}
                                            </button>

                                            <AnimatePresence>
                                                {isExpandedCat && grupos.length > 0 && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: "auto", opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="ml-6 border-l-2 border-zinc-100 pl-2 mt-1 space-y-2"
                                                    >
                                                        {grupos.map((grupo) => {
                                                            const subcat = grupo.subcat;
                                                            const isExpandedSub = expandedSubcats.includes(subcat.id) || searchLeft.length > 0;

                                                            return (
                                                                <div key={`sub-${subcat.id}`} className="space-y-1">
                                                                    <button
                                                                        onClick={() => {
                                                                            if (searchLeft) return;
                                                                            setExpandedSubcats(prev => isExpandedSub ? prev.filter(s => s !== subcat.id) : [...prev, subcat.id]);
                                                                        }}
                                                                        title={renderSubcategoryDescription(subcat.descripcion) || ''}
                                                                        className={`w-full group transition-colors ${USE_ENHANCED_APU_SUBCATEGORY_LIST ? 'rounded-2xl border border-zinc-100 bg-white px-3 py-2.5 hover:border-zinc-200 hover:bg-zinc-50' : 'flex items-center gap-2 py-1 px-2 hover:bg-zinc-50 rounded-lg'}`}
                                                                    >
                                                                        {USE_ENHANCED_APU_SUBCATEGORY_LIST ? (
                                                                            <>
                                                                                <div className="flex items-start gap-3">
                                                                                    <div className="pt-0.5 text-zinc-300 shrink-0">
                                                                                        {isExpandedSub ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                                                                    </div>
                                                                                    <div className="min-w-0 flex-1 text-left">
                                                                                        <CodeColorizer
                                                                                            code={subcat.codigo}
                                                                                            className="text-[8px] block mb-1 opacity-75"
                                                                                        />
                                                                                        <div className="relative min-w-0">
                                                                                            <span className={`block text-[10px] uppercase font-black tracking-widest truncate pr-5 ${isExpandedSub ? 'text-[#F39200]' : 'text-zinc-600'}`}>
                                                                                                {renderSubcategoryDescription(subcat.descripcion)}
                                                                                            </span>
                                                                                            <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white via-white/90 to-transparent group-hover:from-zinc-50" />
                                                                                        </div>
                                                                                    </div>
                                                                                    <div className="flex items-center gap-2 shrink-0 self-center">
                                                                                        <span className={`min-w-[2rem] h-6 px-2 rounded-full inline-flex items-center justify-center text-[10px] font-black tabular-nums border ${isExpandedSub ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-zinc-100 text-zinc-700 border-zinc-200'}`}>
                                                                                            {grupo.items.length}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                                <div className="mt-2 pt-2 border-t border-zinc-200/80 text-left">
                                                                                    <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                                        {grupo.items.length} {grupo.items.length === 1 ? 'APU visible' : 'APUs visibles'}
                                                                                    </p>
                                                                                </div>
                                                                            </>
                                                                        ) : (
                                                                            <>
                                                                                <div className="text-zinc-300">
                                                                                    {isExpandedSub ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                                                                </div>
                                                                                <CodeColorizer
                                                                                    code={subcat.codigo}
                                                                                    className="text-[9px] bg-white px-1.5 py-0.5 rounded border border-zinc-100 shadow-xs"
                                                                                />
                                                                                <span className={`text-[10px] uppercase font-black tracking-widest flex-1 text-left truncate ${isExpandedSub ? 'text-[#F39200]' : 'text-zinc-500'}`}>
                                                                                    {renderSubcategoryDescription(subcat.descripcion)}
                                                                                    {subcat.items_count !== undefined && (
                                                                                        <span className="ml-1 opacity-50 font-medium">({subcat.items_count})</span>
                                                                                    )}
                                                                                </span>
                                                                                <span className="text-[9px] text-zinc-400 font-bold">({grupo.items.length})</span>
                                                                            </>
                                                                        )}
                                                                    </button>

                                                                    <AnimatePresence>
                                                                        {isExpandedSub && (
                                                                            <motion.div
                                                                                initial={{ height: 0, opacity: 0 }}
                                                                                animate={{ height: "auto", opacity: 1 }}
                                                                                exit={{ height: 0, opacity: 0 }}
                                                                                className="ml-4 border-l border-zinc-100 pl-2 space-y-1"
                                                                            >
                                                                                {grupo.items.length === 0 && cat.id === 5 ? (
                                                                                    <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-zinc-300">
                                                                                        Sin APUs disponibles en esta subcategoría
                                                                                    </div>
                                                                                ) : grupo.items.map(item => {
                                                                                    const blockedReason = cat.id === 5 ? nestedApuBlockedReasons.get(Number(item.id)) : null;
                                                                                    const isBlocked = Boolean(blockedReason);
                                                                                    return (
                                                                                    <div
                                                                                        key={`itm-${item.id}`}
                                                                                        onClick={() => {
                                                                                            if (isBlocked) return;
                                                                                            addLinea(item, cat.id === 5);
                                                                                        }}
                                                                                        title={blockedReason || `${renderApuDescription(item.descripcion) || ''}${renderUnidad(item.unidad) ? ` | Und: ${renderUnidad(item.unidad)}` : ''}`}
                                                                                        className={`flex items-center justify-between p-2 rounded-lg border-l-2 transition-all group ${
                                                                                            isBlocked
                                                                                                ? 'bg-zinc-50 border-transparent opacity-50 cursor-not-allowed'
                                                                                                : 'hover:bg-[#FFF9F0] border-transparent hover:border-[#F39200] cursor-pointer'
                                                                                        }`}
                                                                                    >
                                                                                        <div className="flex-1 min-w-0 pr-3">
                                                                                            <div className="flex items-center gap-2 mb-1">
                                                                                                 <CodeColorizer
                                                                                                     code={item.codigo}
                                                                                                    className="text-[8px] bg-zinc-50 px-1 py-0.5 rounded border border-zinc-100 flex-shrink-0"
                                                                                                 />
                                                                                                <span className="text-[11px] font-bold text-zinc-700 truncate" title={`${renderApuDescription(item.descripcion) || ''}${renderUnidad(item.unidad) ? ` | Und: ${renderUnidad(item.unidad)}` : ''}`}>{renderApuDescription(item.descripcion)}</span>
                                                                                            </div>
                                                                                            <div className="flex justify-between items-center text-[9px] text-zinc-400 font-bold tracking-wide">
                                                                                                <span>Und: {renderUnidad(item.unidad)}</span>
                                                                                                <span className="text-[#F39200] font-black">${formatMoneda(item.costo_directo || item.precio || item.precio_unitario_total || 0)}</span>
                                                                                            </div>
                                                                                            {isBlocked && (
                                                                                                <div className="mt-1 text-[8px] font-black uppercase tracking-widest text-red-500">
                                                                                                    Bloqueado por ciclo
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <button
                                                                                            type="button"
                                                                                            disabled={isBlocked}
                                                                                            className={`p-1.5 rounded-md transition-opacity shrink-0 ${
                                                                                                isBlocked
                                                                                                    ? 'opacity-30 bg-zinc-200 text-zinc-400 cursor-not-allowed'
                                                                                                    : 'opacity-0 group-hover:opacity-100 bg-[#F39200] text-white'
                                                                                            }`}
                                                                                        >
                                                                                            <Plus className="w-3 h-3" />
                                                                                        </button>
                                                                                    </div>
                                                                                )})}
                                                                            </motion.div>
                                                                        )}
                                                                    </AnimatePresence>
                                                                </div>
                                                            )
                                                        })}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Panel Derecho: Edición de APU */}
                        <div className="flex-1 flex flex-col bg-white overflow-hidden relative">
                            {editingApuHistory.length > 0 && (
                                <div className="px-8 py-3 border-b border-amber-100 bg-amber-50/80 flex items-center justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">Editando APU anidado</p>
                                        <p className="text-[11px] font-bold text-zinc-600 truncate">
                                            Origen: {editingApuHistory[editingApuHistory.length - 1]?.codigo ? `${editingApuHistory[editingApuHistory.length - 1].codigo} · ` : ''}
                                            {editingApuHistory[editingApuHistory.length - 1]?.descripcion || 'APU padre'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleReturnToParentApu}
                                        className="shrink-0 rounded-xl border border-amber-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-50 transition-all"
                                    >
                                        Volver al padre
                                    </button>
                                </div>
                            )}
                            {/* Header del Panel de Edición - Imagen Original Refinada (Escala Corregida) */}
                            <div className={`bg-[#0f1115] ${isEditorCompact ? 'px-5 py-3' : 'px-7 py-4'} flex-shrink-0 border-b border-white/10 z-40 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]`}>
                                <div className={`flex ${isEditorCompact ? 'flex-col items-stretch gap-4' : 'items-center justify-between gap-4'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-10 h-10 rounded-[0.95rem] bg-white/[0.06] border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                                            <Calculator className="w-5 h-5 text-[#F39200]" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-base font-black uppercase tracking-tight text-white">Editar APU:</h2>
                                                <div className="flex items-center bg-white/[0.05] px-2 py-0.5 rounded-md border border-white/10">
                                                    <CodeColorizer code={formApu.codigo} className="text-[11px]" />
                                                </div>
                                            </div>
                                            <p className="text-[8px] font-black uppercase tracking-widest text-white/45 mt-0.5">Ajustes de Composición</p>
                                        </div>
                                    </div>

                                    {editingApuHistory.length === 0 ? (
                                        <div className={`flex items-center gap-3 ${isEditorCompact ? 'justify-end' : ''}`}>
                                            {cameFromProjectModule && (
                                                <button
                                                    onClick={handleReturnToProjectModule}
                                                    className="h-10 px-4 rounded-[0.9rem] border border-[#F39200]/35 bg-white/[0.04] text-[#ffbd73] text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.08] transition-all active:translate-y-[1px] active:scale-[0.98] inline-flex items-center gap-2"
                                                >
                                                    <ArrowLeft className="w-3.5 h-3.5" /> Volver al módulo Proyecto
                                                </button>
                                            )}
                                            <button
                                                onClick={handleCancelEdit}
                                                className="h-10 px-4 rounded-[0.9rem] border border-white/10 bg-white/[0.04] text-white/72 text-[10px] font-black uppercase tracking-widest hover:bg-white/[0.08] hover:text-white transition-all active:translate-y-[1px] active:scale-[0.98] inline-flex items-center gap-2"
                                            >
                                                <ArrowLeft className="w-3.5 h-3.5" /> Cerrar
                                            </button>
                                            <button
                                                onClick={handleSaveApu}
                                                disabled={saving}
                                                className="h-10 px-5 rounded-[0.9rem] border border-[#F39200]/45 bg-[#211b14] text-[#ffbd73] text-[10px] font-black uppercase tracking-widest hover:border-[#F39200]/70 hover:bg-[#2a2117] transition-all shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] active:translate-y-[1px] active:scale-[0.98] disabled:opacity-45 flex items-center gap-2"
                                            >
                                                <CheckCircle2 className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Cambios'}
                                            </button>
                                        </div>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex-1 overflow-hidden flex flex-col">
                                {/* Tarjeta de Detalles - Fija en la parte superior */}
                                <div className={`bg-white ${isEditorCompact ? 'px-5 pt-4 pb-3' : 'px-8 pt-5 pb-3'} border-b border-zinc-100 flex-shrink-0 z-10`}>
                                    <div className="max-w-7xl mx-auto">
                                        {/* Tarjeta de Detalles - Diseño Original (Zona Gris) */}
                                        <div className={`bg-zinc-50/80 border border-zinc-100 rounded-[2rem] ${isEditorCompact ? 'p-5 space-y-4' : 'p-6 space-y-5'} shadow-sm`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-xl shadow-sm border border-zinc-100 ring-1 ring-zinc-200/50">
                                                    <FolderOpen className="w-4 h-4 text-[#F39200]" />
                                                    <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                        {subcategorias.find(s => s.id === selectedSubcatId)?.codigo || 'S-001'}
                                                    </span>
                                                    <span className="text-[11px] font-black tracking-tight text-zinc-900 border-l border-zinc-100 pl-3">
                                                        {renderApuDescription(formApu.descripcion || 'REPLANTEOS Y NIVELACIONES')}
                                                    </span>
                                                </div>

                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={handleToggleRendimientoGlobal}
                                                        className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${formApu.rendimiento_global_activado ? 'bg-blue-50 text-blue-600 border-blue-100 shadow-sm' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${formApu.rendimiento_global_activado ? 'bg-blue-500 animate-pulse' : 'bg-zinc-300'}`} />
                                                        Rendimiento Global
                                                    </button>
                                                    <button
                                                        onClick={() => setFormApu(prev => ({ ...prev, por_validar: !prev.por_validar }))}
                                                        className={`px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all border ${!formApu.por_validar ? 'bg-emerald-50 text-emerald-600 border-emerald-100 shadow-sm' : 'bg-zinc-100 text-zinc-400 border-zinc-200'}`}
                                                    >
                                                        <div className={`w-1.5 h-1.5 rounded-full ${!formApu.por_validar ? 'bg-emerald-500' : 'bg-zinc-300'}`} />
                                                        {!formApu.por_validar ? 'Revisado' : 'Pendiente'}
                                                    </button>
                                                </div>
                                            </div>

                                            {requiresExplicitGlobalBase && (
                                                <div className="flex items-center justify-between gap-4 rounded-[1.5rem] border border-blue-100 bg-blue-50/70 px-5 py-4">
                                                    <div className="min-w-0">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                                                            Rendimiento Base Global
                                                        </p>
                                                        <p className="text-[11px] font-bold text-zinc-500">
                                                            Defina el valor inicial que heredarán nuevas líneas de Equipos y Mano de Obra.
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="text"
                                                            value={formApu.rendimiento_global_base}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                if (value !== '' && !/^[0-9.,]*$/.test(value)) return;
                                                                setFormApu((prev) => ({ ...prev, rendimiento_global_base: value }));
                                                            }}
                                                            onBlur={(e) => {
                                                                const parsed = parseGlobalBaseRendimiento(e.target.value);
                                                                setFormApu((prev) => ({
                                                                    ...prev,
                                                                    rendimiento_global_base: parsed !== null ? formatCalculo(parsed) : ''
                                                                }));
                                                            }}
                                                            placeholder="0,01"
                                                            className="w-28 text-center bg-white border border-blue-200 rounded-xl px-3 py-2 text-[11px] font-black text-blue-700 focus:outline-none focus:border-[#F39200] transition-all"
                                                        />
                                                        <div className={`px-3 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest ${globalBaseRendimientoResolved !== null ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-zinc-200 bg-white text-zinc-400'}`}>
                                                            {globalBaseRendimientoResolved !== null ? `Base ${formatCalculoVisual(globalBaseRendimientoResolved)}` : 'Pendiente'}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-12 gap-4 items-end">
                                                <div className={`${isEditorCompact ? 'col-span-7' : 'col-span-8'} space-y-2`}>
                                                    <div className="flex items-center gap-2 ml-1">
                                                        <label className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Descripción de Partida *</label>
                                                    </div>
                                                    <input
                                                        value={formApu.descripcion}
                                                        onChange={(e) => setFormApu(prev => ({ ...prev, descripcion: e.target.value }))}
                                                        onBlur={(e) => setFormApu(prev => ({ ...prev, descripcion: renderApuDescription(e.target.value) }))}
                                                        className="w-full h-12 bg-white border border-zinc-100 text-base font-black tracking-tight text-zinc-900 px-5 rounded-[1rem] focus:outline-none focus:border-[#F39200] focus:ring-4 focus:ring-[#F39200]/5 transition-all shadow-sm"
                                                        placeholder="EJ. REPLANTEO Y NIVELACIÓN..."
                                                    />
                                                </div>

                                                <div className={`${isEditorCompact ? 'col-span-5' : 'col-span-4'} space-y-2`}>
                                                    <div className="flex items-center justify-between ml-1">
                                                        <label className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Unidad *</label>
                                                        <button onClick={() => setShowUnidadModal(true)} className="text-[8px] font-black text-[#F39200] uppercase tracking-tighter hover:underline">(CREAR NUEVA) +</button>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="relative group flex-1">
                                                        <AnimatedSelect
                                                            value={formApu.unidad_id || ''}
                                                            onChange={(e) => {
                                                                const uid = parseInt(e.target.value);
                                                                const uObj = findMatchingUnit(apuUnidades, uid);
                                                                setFormApu(prev => ({
                                                                    ...prev,
                                                                    unidad_id: uid,
                                                                    unidad: uObj ? uObj.descripcion : prev.unidad
                                                                }));
                                                            }}
                                                            className="w-full h-12 bg-white border border-zinc-100 rounded-[1rem] px-5 text-[13px] font-black text-zinc-700 appearance-none focus:outline-none focus:border-[#F39200] focus:ring-4 focus:ring-[#F39200]/5 transition-all cursor-pointer shadow-sm"
                                                        >
                                                            <option value="">(Seleccionar)</option>
                                                            {apuUnidades.map(u => (
                                                                <option key={u.id} value={u.id}>{normalizeDisplayUnit(u.descripcion)} - {normalizeDisplayUnit(u.descripcion_completa)}</option>
                                                            ))}
                                                        </AnimatedSelect>
                                                        <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none group-hover:text-zinc-600 transition-colors" />
                                                        </div>
                                                        {useOmniClass && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setShowApuOmniPanel(prev => !prev);
                                                                    if (!showApuOmniPanel) {
                                                                        handleOmniClassOpen();
                                                                    }
                                                                }}
                                                                className={`h-12 w-12 shrink-0 rounded-[1rem] border shadow-sm transition-all flex items-center justify-center ${
                                                                    showApuOmniPanel || formApu.omniclass_codigo
                                                                        ? 'border-blue-200 bg-blue-50 text-blue-600'
                                                                        : 'border-zinc-100 bg-white text-zinc-400 hover:text-zinc-700'
                                                                }`}
                                                                title={
                                                                    formApu.omniclass_codigo
                                                                        ? `OmniClass ${formApu.omniclass_codigo}`
                                                                        : `Asignar OmniClass Tabla ${currentApuOmniClassTable}`
                                                                }
                                                            >
                                                                <LayoutGrid className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            <AnimatePresence initial={false}>
                                                {useOmniClass && showApuOmniPanel && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0 }}
                                                        animate={{ height: 'auto', opacity: 1 }}
                                                        exit={{ height: 0, opacity: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50/40 px-5 py-4 space-y-3">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div>
                                                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-blue-600">
                                                                        Clasificación OmniClass Tabla {currentApuOmniClassTable}
                                                                    </p>
                                                                    <p className="text-[11px] font-bold text-zinc-500">
                                                                        Asigne la clasificación técnica del APU sin ocupar una banda fija del header.
                                                                    </p>
                                                                </div>
                                                                {formApu.omniclass_codigo && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => setFormApu(prev => ({ ...prev, omniclass_codigo: '', omniclass_titulo: '' }))}
                                                                        className="text-[9px] font-black uppercase tracking-widest text-red-500 hover:underline"
                                                                    >
                                                                        Limpiar
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <SearchableSelect
                                                                placeholder="Buscar código o título estándar..."
                                                                options={omniclassOptions}
                                                                loading={isOmniLoading}
                                                                value={formApu.omniclass_codigo}
                                                                labelKey="label"
                                                                valueKey="codigo"
                                                                onOpen={handleOmniClassOpen}
                                                                onSearch={handleOmniClassSearch}
                                                                onChange={(val) => {
                                                                    const selected = omniclassOptions.find(o => o.codigo === val);
                                                                    if (selected) {
                                                                        setFormApu(prev => ({
                                                                            ...prev,
                                                                            omniclass_codigo: selected.codigo,
                                                                            omniclass_titulo: selected.titulo_resuelto || selected.titulo
                                                                        }));
                                                                    }
                                                                }}
                                                                className="bg-white h-11 text-[11px]"
                                                            />
                                                            {(formApu.omniclass_codigo || formApu.omniclass_titulo) && (
                                                                <div className="flex items-center gap-2 flex-wrap">
                                                                    {formApu.omniclass_codigo && (
                                                                        <span className="px-3 py-1 rounded-full bg-white border border-blue-100 text-[10px] font-black tracking-widest text-blue-600">
                                                                            {formApu.omniclass_codigo}
                                                                        </span>
                                                                    )}
                                                                    {formApu.omniclass_titulo && (
                                                                        <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">
                                                                            {formApu.omniclass_titulo}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabla de Análisis - Scrollable */}
                                <div className={`flex-1 overflow-y-auto ${isEditorCompact ? 'px-5' : 'px-8'} relative custom-scrollbar bg-white`}>
                                    <div className={`max-w-7xl mx-auto ${isEditorCompact ? 'py-5' : 'py-8'}`}>
                                        <div className={`${isEditorCompact ? 'space-y-8' : 'space-y-12'}`}>
                                            {CATEGORIAS_BASE.filter(cat => cat.id !== 5).map(cat => {
                                                const hasLines = lineasEditor.some(l => l.categoria_id === cat.id);
                                                const isDragOver = dragOverCatEditor === cat.id;
                                                const catLines = lineasEditor.filter(l => l.categoria_id === cat.id);
                                                const catSubtotal = catLines.reduce((sum, l) => {
                                                    return sum + calculateEditorLinePartial(l);
                                                }, 0);
                                                const catRelative = Number(calculos.directo || 0) > 0 ? (catSubtotal / Number(calculos.directo || 0)) : 0;
                                                const editorGridClass = isEditorCompact
                                                    ? "grid grid-cols-[56px_minmax(0,2.8fr)_70px_108px_120px_104px_108px] gap-3"
                                                    : "grid grid-cols-[56px_minmax(0,3.4fr)_76px_116px_136px_112px_120px_84px] gap-4";

                                                if (!hasLines && !isDragOver) return null;

                                                return (
                                                    <div key={cat.id} className="space-y-4">
                                                        {/* Cabecera de Categoría - Imagen 1 (Interactiva) */}
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setCollapsedCategoriesEditor(prev => 
                                                                    prev.includes(cat.id) 
                                                                        ? prev.filter(id => id !== cat.id) 
                                                                        : [...prev, cat.id]
                                                                );
                                                            }}
                                                            className="w-full flex items-center justify-between px-4 py-2 bg-zinc-50/50 rounded-xl border border-zinc-100 cursor-pointer hover:bg-zinc-100/50 transition-all select-none group/cat"
                                                        >
                                                            <div className="flex items-center gap-2">
                                                                <div className="p-1 rounded-md bg-white border border-zinc-200 shadow-sm flex items-center justify-center transition-transform group-hover/cat:scale-110">
                                                                    <span className="text-[10px]">{cat.icon}</span>
                                                                </div>
                                                                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-700">{cat.nombre}</span>
                                                                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-300 ${collapsedCategoriesEditor.includes(cat.id) ? '-rotate-90' : ''}`} />
                                                            </div>
                                                            <div className="flex items-center gap-6 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                                                <span>
                                                                    Subtotal: <span className="text-zinc-900 ml-1">${formatMoneda(catSubtotal)}</span>
                                                                </span>
                                                                <span>
                                                                    % Rel.: <span className="text-[#F39200] ml-1">{formatRelativePercent(catRelative)}</span>
                                                                </span>
                                                            </div>
                                                        </button>

                                                        <AnimatePresence initial={false}>
                                                            {!collapsedCategoriesEditor.includes(cat.id) && (
                                                                <motion.div
                                                                    initial={{ height: 0, opacity: 0 }}
                                                                    animate={{ height: 'auto', opacity: 1 }}
                                                                    exit={{ height: 0, opacity: 0 }}
                                                                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                                                                    className="overflow-hidden bg-white border border-zinc-100 rounded-2xl shadow-sm"
                                                                >
                                                                    {/* Cabecera de Tabla - Imagen 1 (Ligera) */}
                                                                    {isEditorCompact ? (
                                                                        <div className="px-6 py-3 bg-zinc-50/80 border-y border-zinc-100">
                                                                            <div className="grid grid-cols-[56px_minmax(0,2.8fr)_70px_108px_120px_104px_108px] gap-3 items-center text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                                                                <div className="text-center">Orden</div>
                                                                                <div>Recurso / Descripción</div>
                                                                                <div className="text-center">Unidad</div>
                                                                                <div className="text-center">Cantidad</div>
                                                                                <div className="text-right">Precio (u)</div>
                                                                                <div className="text-center">Rend.</div>
                                                                                <div className="text-right">Parcial</div>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <div className={`${editorGridClass} px-6 py-3 bg-zinc-50/80 border-y border-zinc-100 text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500`}>
                                                                            <div className="text-center">Orden</div>
                                                                            <div>Recurso / Descripción</div>
                                                                            <div className="text-center">Unidad</div>
                                                                            <div className="text-center">Cantidad</div>
                                                                            <div className="text-right">Precio (u)</div>
                                                                            <div className="text-center">Rendimiento</div>
                                                                            <div className="text-right">Parcial</div>
                                                                            <div className="text-right">% Rel.</div>
                                                                        </div>
                                                                    )}

                                                            <div className="divide-y divide-zinc-100">
                                                                {catLines.length === 0 ? (
                                                                    <div
                                                                        onDragOver={(e) => handleDragOverEditor(e, cat.id)}
                                                                        onDrop={(e) => handleDropEditor(e, cat.id)}
                                                                        className={`py-8 text-center transition-all ${dragOverCatEditor === cat.id ? 'bg-orange-50 border-2 border-dashed border-[#F39200] scale-[0.98]' : ''}`}
                                                                    >
                                                                        <div className="flex flex-col items-center gap-2">
                                                                            <PlusCircle className={`w-5 h-5 ${dragOverCatEditor === cat.id ? 'text-[#F39200] animate-bounce' : 'text-zinc-300'}`} />
                                                                            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-300">
                                                                                {dragOverCatEditor === cat.id ? 'Suelta para añadir' : `Arrastra recursos aquí`}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    catLines.map((linea, idx) => renderEditorLineRow(linea, idx, cat.id, calculos.directo, editorGridClass))
                                                                )}
                                                            </div>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                {/* Pie de Página de Totales */}
                                <div className={`bg-white border-t border-zinc-100 ${isEditorCompact ? 'px-5 py-4' : 'px-12 py-8'} flex justify-end flex-shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]`}>
                                    <div className={`flex ${isEditorCompact ? 'gap-8 flex-wrap justify-end' : 'gap-20'}`}>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Costo Directo</span>
                                            <span className={`${isEditorCompact ? 'text-lg' : 'text-xl'} font-black text-zinc-900 tracking-tighter`}>
                                                ${formatMoneda(calculos.directo)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">INDIRECTOS ({formatNumericDisplay(Number(calculos.indirectoPct || 0).toFixed(2))}%)</span>
                                            <span className={`${isEditorCompact ? 'text-lg' : 'text-xl'} font-black text-zinc-900 tracking-tighter`}>
                                                ${formatMoneda(calculos.indirecto)}
                                            </span>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">Total de Partida</span>
                                            <span className={`${isEditorCompact ? 'text-2xl' : 'text-3xl'} font-black text-[#F39200] leading-none tracking-tighter`}>
                                                ${formatMoneda(calculos.totalConIndirectos)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <AnimatePresence>
                {toast && (
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className={`fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl shadow-2xl z-[100] flex items-center gap-3 border ${toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-zinc-900 text-white border-zinc-700'
                            }`}
                    >
                        {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-400" /> : <Check className="w-4 h-4 text-[#F39200]" />}
                        <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            <CommonReportPreviewModal
                isOpen={showReportPreviewModal}
                onClose={() => setShowReportPreviewModal(false)}
                preview={reportPreview}
                onExportExcel={handleExportReportExcel}
                onExportPdf={handleExportReportPdf}
                onExportPdfFromExcel={handleExportReportPdfFromExcel}
                exporting={reportExporting}
            />
            <ReportGenerationModal
                isOpen={reportExporting}
                title="Generando reporte"
                message="Estamos preparando el reporte de APUs. La descarga comenzará automáticamente cuando esté listo."
            />

            <ResourceEditorModal
                isOpen={showResourceModal}
                onClose={() => {
                    setShowResourceModal(false);
                    setEditingRecurso(null);
                    setResourceUnidades([]);
                }}
                onSubmit={handleSaveResource}
                editingRecurso={editingRecurso}
                form={resourceForm}
                setForm={setResourceForm}
                unidades={resourceUnidades}
                onSpellCheck={handleResourceSpellCheck}
                title="Editar Recurso"
                subtitle="Ajuste directo desde APU"
                submitLabel="Guardar Cambios"
                currentOmniClassTable={currentResourceOmniClassTable}
                formatMonedaInput={formatMonedaInput}
                enableOmniClass={useOmniClass}
                currentCategoryId={currentResourceCategory}
            />

            <AnimatePresence>
                {showUnidadModal && (
                    <AppModalShell size="sm" zIndex="z-[100]">
                            <div className="p-8">
                                <AppModalHeader
                                    title="Nueva Unidad para APUs"
                                    subtitle="Esta unidad estará disponible exclusivamente para la base activa."
                                    icon={Plus}
                                    iconClassName="text-[#F39200]"
                                    iconWrapClassName="border-orange-200 bg-orange-50"
                                    onClose={() => setShowUnidadModal(false)}
                                />

                                <form onSubmit={handleCreateUnidad} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-[#F39200] ml-2">Abreviatura *</Label>
                                        <Input
                                            required
                                            maxLength={10}
                                            value={newUnidadForm.descripcion}
                                            onChange={e => setNewUnidadForm({ ...newUnidadForm, descripcion: e.target.value })}
                                            onBlur={e => setNewUnidadForm({ ...newUnidadForm, descripcion: normalizeDisplayUnit(e.target.value) })}
                                            className="h-14 px-5 bg-zinc-50 border-zinc-200 rounded-2xl font-black text-center text-lg focus:ring-[#F39200]"
                                            placeholder="ej: m2, kg, gal"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Nombre Completo *</Label>
                                        <Input
                                            required
                                            value={newUnidadForm.descripcion_completa}
                                            onChange={e => setNewUnidadForm({ ...newUnidadForm, descripcion_completa: e.target.value })}
                                            onBlur={e => setNewUnidadForm({ ...newUnidadForm, descripcion_completa: normalizeDisplayUnit(e.target.value) })}
                                            className="h-14 px-5 bg-zinc-50 border-zinc-200 rounded-2xl text-sm font-medium focus:ring-[#F39200]"
                                            placeholder="ej: Metro Cuadrado"
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            type="button"
                                            onClick={() => setShowUnidadModal(false)}
                                            className="flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:bg-zinc-100 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            className="flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-zinc-900 hover:bg-zinc-800 transition-all shadow-lg"
                                        >
                                            Crear Unidad
                                        </button>
                                    </div>
                                </form>
                            </div>
                    </AppModalShell>
                )}
            </AnimatePresence>

            {/* Modal Importación Masiva */}
            <AnimatePresence>
                {showImportModal && (
                    <AppModalShell
                        isOpen={showImportModal}
                        onClose={closeImportModal}
                        size="lg"
                        zIndex="z-[100]"
                        panelClassName="max-h-[90vh] flex flex-col"
                    >
                            <div className="flex flex-col min-h-0">
                                <AppModalHeader
                                    title="Importar APUs en Bloque"
                                    subtitle="Pega el listado en formato descripción + unidad para crearlos como registros base."
                                    icon={ClipboardList}
                                    iconClassName="text-[#F39200]"
                                    iconWrapClassName="border-orange-200 bg-orange-50"
                                    onClose={closeImportModal}
                                />

                                <div className="flex-1 min-h-0 overflow-y-auto p-8 space-y-4">
                                    <ImportFormatHint
                                        tone="blue"
                                        format="Descripción • Unidad"
                                        hint={`Los APUs se crearán en la subcategoría "${renderSubcategoryDescription(allSubcategorias.find(s => s.id === selectedSubcatId)?.descripcion)}" con valor $0.00. La unidad es obligatoria, debe existir en el sistema y, si no hay tabulación limpia, se intentará detectar al final de la línea.`}
                                    />

                                    <div className="space-y-2">
                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Descripciones + Unidad (TAB) *</Label>
                                        <textarea
                                            className="w-full h-48 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#F39200] focus:ring-1 focus:ring-[#F39200] transition-all"
                                            placeholder="Ejemplo:&#10;EXCAVACIÓN MANUAL HASTA 2M&#9;m3&#10;RELLENO COMPACTADO CON MATERIAL PROPIO&#9;m3&#10;HORMIGÓN SIMPLE f'c=180kg/cm2&#9;m3"
                                            value={importText}
                                            onChange={e => setImportText(e.target.value)}
                                        />
                                    </div>

                                    {importPreview.length > 0 && (
                                        <div className="space-y-3">
                                            <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                                                <div className="flex items-center justify-between mb-3">
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Previo de Importación</Label>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{importPreview.length} filas procesadas</span>
                                                </div>
                                                <div className="grid grid-cols-4 gap-3">
                                                    <div className="bg-white border border-zinc-200 rounded-xl px-3 py-2">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-zinc-400">Filas</p>
                                                        <p className="text-sm font-black text-zinc-900">{importPreview.length}</p>
                                                    </div>
                                                    <div className="bg-white border border-emerald-200 rounded-xl px-3 py-2">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-emerald-600">Listas</p>
                                                        <p className="text-sm font-black text-emerald-700">{importPreview.filter(p => p.valid).length}</p>
                                                    </div>
                                                    <div className="bg-white border border-red-200 rounded-xl px-3 py-2">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-red-500">Omitidas</p>
                                                        <p className="text-sm font-black text-red-600">{importPreview.filter(p => !p.valid && !p.reason.toLowerCase().includes('duplic')).length}</p>
                                                    </div>
                                                    <div className="bg-white border border-amber-200 rounded-xl px-3 py-2">
                                                        <p className="text-[8px] font-black uppercase tracking-widest text-amber-600">Duplicadas</p>
                                                        <p className="text-sm font-black text-amber-700">{importPreview.filter(p => !p.valid && p.reason.toLowerCase().includes('duplic')).length}</p>
                                                    </div>
                                                </div>
                                                <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-blue-700">
                                                        Unidades válidas: {apuUnidades.map(u => typeof u === 'object' ? u.descripcion : u).join(', ') || 'Sin unidades cargadas'}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="max-h-56 overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50">
                                                <table className="w-full text-left">
                                                    <thead className="bg-white sticky top-0 border-b border-zinc-200">
                                                        <tr>
                                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Fila</th>
                                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Descripción</th>
                                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Unidad</th>
                                                            {useOmniClass && (
                                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 italic">OmniClass</th>
                                                            )}
                                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Estado</th>
                                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Motivo</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {importPreview.map((item) => (
                                                            <tr key={`apu-preview-${item.row}`} className="border-b border-zinc-100 last:border-b-0 align-top">
                                                                <td className="px-4 py-2.5 text-[10px] font-black text-zinc-400">{item.row}</td>
                                                                <td className="px-4 py-2.5 text-[12px] font-bold text-zinc-700 leading-snug">{item.parsed?.descripcion || '-'}</td>
                                                                <td className="px-4 py-2.5 text-[11px] text-zinc-500">{item.parsed?.unidad || '-'}</td>
                                                                {useOmniClass && (
                                                                    <td className="px-4 py-2.5">
                                                                        {item.parsed?.omniclass_codigo ? (
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[9px] font-black text-[#F39200]">{item.parsed.omniclass_codigo}</span>
                                                                                <span className="text-[8px] font-bold text-zinc-400 uppercase truncate max-w-[120px]">{item.parsed.omniclass_titulo}</span>
                                                                            </div>
                                                                        ) : (
                                                                            <span className="text-[9px] text-zinc-300 italic">No detectado</span>
                                                                        )}
                                                                    </td>
                                                                )}
                                                                <td className="px-4 py-2.5">
                                                                    <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${item.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : (item.reason || '').toLowerCase().includes('duplic') || (item.reason || '').toLowerCase().includes('ya existe') ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                                                                        {item.valid ? 'Lista' : 'Omitida'}
                                                                    </span>
                                                                </td>
                                                                <td className="px-4 py-2.5 text-[11px] text-zinc-500 leading-snug">{item.reason || '-'}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                </div>
                                <div className="border-t border-zinc-200 bg-white px-8 py-5">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={closeImportModal}
                                            className="flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:bg-zinc-100 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleImportApu}
                                            disabled={importPreview.filter(p => p.valid).length === 0}
                                            className="flex-1 py-4 px-6 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-zinc-900 hover:bg-zinc-800 disabled:bg-zinc-200 disabled:text-zinc-400 transition-all shadow-lg flex items-center justify-center gap-2"
                                        >
                                            <Plus className="w-4 h-4" /> Confirmar {importPreview.filter(p => p.valid).length} Registros
                                        </button>
                                    </div>
                                </div>
                            </div>
                    </AppModalShell>
                )}
            </AnimatePresence>

            {/* Modal: Importar desde otra Base */}
            <AnimatePresence>
                {showBaseImportModal && (
                    <AppModalShell
                        isOpen={showBaseImportModal}
                        onClose={() => setShowBaseImportModal(false)}
                        size="xl"
                        zIndex="z-[100]"
                        panelClassName="max-h-[90vh] flex flex-col"
                    >
                            {/* Header del Modal */}
                            <AppModalHeader
                                title="Importar desde Base"
                                subtitle={`Paso ${importingStep} de 2: ${importingStep === 1 ? 'Selección de origen' : `Selección de APUs${selectedSourceBaseMeta ? ` · ${selectedSourceBaseMeta.tipo}${selectedSourceBaseMeta.tipo === 'Base de Proyecto' ? ` Rev. ${String(selectedSourceBaseMeta.revision ?? 0).padStart(3, '0')}` : ''}` : ''}`}`}
                                icon={Database}
                                iconClassName="text-[#F39200]"
                                iconWrapClassName="border-orange-200 bg-orange-50"
                                onClose={() => setShowBaseImportModal(false)}
                            />

                            {/* Contenido del Modal */}
                            <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC] custom-scrollbar">
                                {importingStep === 1 ? (
                                    <>
                                        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 mb-6">
                                            <Info className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                            <div className="space-y-1">
                                                <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">Gobernanza de Datos</p>
                                                <p className="text-[9px] text-amber-600 font-medium uppercase tracking-wide leading-relaxed">
                                                    Solo se muestran APUs con estado <span className="text-amber-900 font-black">"REVISADO"</span>.
                                                    Los registros legacy en estado <span className="text-amber-900 font-black">"APROBADO"</span> también son elegibles.
                                                    Las partidas pendientes de validación no son elegibles para importación entre bases.
                                                </p>
                                            </div>
                                        </div>

                                        <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                                            <h3 className="text-xs font-black uppercase text-zinc-400 mb-4 tracking-widest flex items-center gap-2">
                                                <LayoutGrid className="w-3.5 h-3.5" /> Bases de Trabajo Disponibles
                                            </h3>
                                            <div className="relative group mb-4">
                                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-[#F39200] transition-colors" />
                                                <input
                                                    type="text"
                                                    placeholder="Buscar base por código, nombre, tipo o revisión..."
                                                    className="w-full h-11 rounded-xl border border-zinc-200 bg-white pl-10 pr-10 text-xs shadow-sm transition-all focus:outline-none focus:border-[#F39200] focus:ring-1 focus:ring-[#F39200]"
                                                    value={normalizeTextInputValue(baseImportSearch)}
                                                    onChange={(e) => setBaseImportSearch(normalizeTextInputValue(e.target.value))}
                                                />
                                                {baseImportSearch && (
                                                    <button
                                                        type="button"
                                                        onMouseDown={(event) => event.preventDefault()}
                                                        onClick={() => setBaseImportSearch('')}
                                                        className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
                                                        title="Limpiar búsqueda"
                                                    >
                                                        <X className="h-3.5 w-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                            {baseImportLoading ? (
                                                <div className="py-12 text-center">
                                                    <div className="w-8 h-8 mx-auto border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" />
                                                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Cargando bases disponibles</p>
                                                </div>
                                            ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {filteredImportBases.length > 0 ? (
                                                    filteredImportBases.map(base => (
                                                        <button
                                                            type="button"
                                                            key={base.id}
                                                            onClick={() => handleSelectSourceBase(base.id)}
                                                            className="flex items-center gap-4 p-4 rounded-2xl border border-zinc-100 bg-zinc-50 hover:bg-white hover:border-[#F39200] hover:shadow-lg transition-all text-left group"
                                                        >
                                                            <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center border border-zinc-100 group-hover:bg-[#F39200]/10 transition-colors">
                                                                <Database className="w-5 h-5 text-zinc-400 group-hover:text-[#F39200]" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-[8px] font-black uppercase text-zinc-400 mb-0.5">{base.codigo}</p>
                                                                <p className="text-sm font-bold text-zinc-800 uppercase tracking-tight line-clamp-1">{base.nombre}</p>
                                                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400 mt-1">
                                                                    {base.tipo}{base.tipo === 'Base de Proyecto' ? ` · Rev. ${String(base.revision ?? 0).padStart(3, '0')}` : ''}
                                                                </p>
                                                            </div>
                                                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#F39200] group-hover:translate-x-1 transition-all" />
                                                        </button>
                                                    ))
                                                ) : (
                                                    <div className="col-span-full py-12 text-center">
                                                        <div className="w-16 h-16 bg-zinc-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-100">
                                                            <Database className="w-8 h-8 text-zinc-300" />
                                                        </div>
                                                        <p className="text-sm font-bold text-zinc-500">{availableBases.length > 0 ? 'No hay bases que coincidan con el filtro' : 'No hay otras bases de trabajo disponibles'}</p>
                                                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest mt-1">{availableBases.length > 0 ? 'Ajusta la búsqueda para ver más resultados' : 'Debe existir al menos otra base para realizar importaciones'}</p>
                                                    </div>
                                                )}
                                            </div>
                                            )}
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Origen</p>
                                                <p className="mt-1 text-xs font-black uppercase text-zinc-800">
                                                    {selectedSourceBaseMeta?.nombre || 'Base origen'}
                                                </p>
                                                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#F39200]">
                                                    {selectedSourceBaseMeta?.tipo || 'Tipo desconocido'}{selectedSourceBaseMeta?.tipo === 'Base de Proyecto' ? ` · Rev. ${String(selectedSourceBaseMeta?.revision ?? 0).padStart(3, '0')}` : ''}
                                                </p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Destino</p>
                                                <p className="mt-1 text-xs font-black uppercase text-zinc-800">
                                                    {selectedBaseTrabajo?.nombre || 'Base destino'}
                                                </p>
                                                <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-[#F39200]">
                                                    {targetImportContextLabel}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <button
                                                onClick={() => setImportingStep(1)}
                                                className="text-[10px] font-black uppercase tracking-widest text-[#F39200] hover:underline flex items-center gap-2"
                                            >
                                                <ArrowLeft className="w-3 h-3" /> Volver a selección de base
                                            </button>
                                            <div className="flex gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedImportApuIds(sourceBaseApus.filter(a => isApuImportEligible(a.estado_revision)).map(a => a.id))}
                                                    className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
                                                >
                                                    Seleccionar todos
                                                </button>
                                                <span className="text-zinc-300">|</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedImportApuIds([])}
                                                    className="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-600 transition-colors"
                                                >
                                                    Limpiar
                                                </button>
                                            </div>
                                        </div>

                                        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
                                            {baseImportLoading ? (
                                                <div className="py-12 text-center">
                                                    <div className="w-8 h-8 mx-auto border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" />
                                                    <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Cargando catálogo origen</p>
                                                </div>
                                            ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="bg-zinc-50 border-b border-zinc-200">
                                                            <th className="px-6 py-4 w-12 text-zinc-500 uppercase text-[9px] font-black tracking-widest">ID</th>
                                                            <th className="px-6 py-4 text-zinc-500 uppercase text-[9px] font-black tracking-widest">Descripción</th>
                                                            <th className="px-6 py-4 text-zinc-500 uppercase text-[9px] font-black tracking-widest">Unidad</th>
                                                            <th className="px-6 py-4 text-right text-zinc-500 uppercase text-[9px] font-black tracking-widest">Acción</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-zinc-100">
                                                        {sourceBaseApus.filter(a => isApuImportEligible(a.estado_revision)).map(apu => {
                                                            const isSelected = selectedImportApuIds.includes(apu.id);
                                                            return (
                                                                <tr
                                                                    key={apu.id}
                                                                    onClick={() => {
                                                                        setSelectedImportApuIds(prev =>
                                                                            isSelected ? prev.filter(id => id !== apu.id) : [...prev, apu.id]
                                                                        );
                                                                    }}
                                                                    className={`group cursor-pointer transition-colors ${isSelected ? 'bg-[#F39200]/5' : 'hover:bg-zinc-50'}`}
                                                                >
                                                                    <td className="px-6 py-4">
                                                                        <CodeColorizer
                                                                            code={apu.codigo}
                                                                            className="text-[10px] bg-white px-2 py-1 rounded-md border border-zinc-100"
                                                                        />
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <p className="text-xs font-bold text-zinc-800 leading-snug">{renderApuDescription(apu.descripcion)}</p>
                                                                        <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{renderSubcategoryDescription(sourceBaseSubcats.find(s => s.id === apu.subcategoria_item_id)?.descripcion || 'General')}</p>
                                                                    </td>
                                                                    <td className="px-6 py-4">
                                                                        <span className="text-[10px] font-black text-[#F39200] tracking-widest normal-case">{renderUnidad(apu.unidad)}</span>
                                                                    </td>
                                                                    <td className="px-6 py-4 text-right">
                                                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-[#F39200] border-[#F39200] shadow-sm' : 'border-zinc-200'}`}>
                                                                            {isSelected && <Check className="w-3 h-3 text-white" />}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Footer del Modal */}
                            <div className="bg-white border-t border-zinc-100 px-8 py-6 flex items-center justify-between">
                                <div>
                                    {importingStep === 2 && (
                                        <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                            <span className="text-[#F39200] font-black">{selectedImportApuIds.length}</span> APUs seleccionados
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-4">
                                    <button
                                         type="button"
                                         onClick={() => setShowBaseImportModal(false)}
                                        className="h-12 px-6 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    {importingStep === 2 && (
                                        <LiquidButton
                                            onClick={() => handleExecuteImport()}
                                            disabled={selectedImportApuIds.length === 0 || importingStatus}
                                            className={`h-12 px-10 rounded-2xl bg-[#F39200] text-white shadow-xl shadow-[#F39200]/20 font-black uppercase tracking-widest text-[11px] flex items-center gap-2 ${importingStatus ? 'opacity-50' : ''}`}
                                        >
                                            {importingStatus ? (
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Download className="w-4 h-4" />
                                            )}
                                            IMPORTAR SELECCIÓN
                                        </LiquidButton>
                                    )}
                                </div>
                            </div>
                    </AppModalShell>
                )}
            </AnimatePresence>

            {/* Modal: Resolución de Conflictos */}
            <AnimatePresence>
                {showConflictModal && (
                    <AppModalShell size="2xl" zIndex="z-[110]" overlayClassName="bg-black/55 backdrop-blur-md" panelClassName="max-h-[90vh] flex flex-col">
                            <AppModalHeader
                                title="Conflictos de Importación"
                                subtitle={`Se han detectado ${importConflicts.length} APUs que ya existen en esta base`}
                                icon={AlertCircle}
                                iconClassName="text-amber-500"
                                iconWrapClassName="border-amber-200 bg-amber-50"
                                onClose={() => setShowConflictModal(false)}
                                actions={(
                                    <button
                                        onClick={handleAutoDecision}
                                        className="h-10 px-4 text-[10px] font-black uppercase tracking-widest bg-amber-500 hover:bg-amber-600 text-white rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
                                    >
                                        <Calculator className="w-4 h-4" /> Autodecisión
                                    </button>
                                )}
                            />

                            <div className="flex-1 overflow-y-auto p-8 bg-zinc-50 custom-scrollbar">
                                <div className="space-y-4">
                                    {importConflicts.map((c, idx) => (
                                        <div key={idx} className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                            <div className="p-4 bg-zinc-50 border-b border-zinc-100 flex items-center justify-between">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Conflicto en: {renderApuDescription(c.source.descripcion)}</span>
                                                <span className="text-[10px] font-black uppercase text-[#F39200] bg-[#F39200]/10 px-2 py-1 rounded-md">{c.source.unidad}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-px bg-zinc-200">
                                                {/* Opción A: Mantener Actual */}
                                                <div
                                                    onClick={() => setImportResolutions(prev => ({ ...prev, [c.source.id]: 'skip' }))}
                                                    className={`p-6 bg-white cursor-pointer transition-all ${importResolutions[c.source.id] === 'skip' ? 'ring-2 ring-inset ring-zinc-900 bg-zinc-50' : 'hover:bg-zinc-50/50'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-[10px] font-black uppercase text-zinc-400">Versión Actual (Destino)</span>
                                                        {importResolutions[c.source.id] === 'skip' && <div className="w-5 h-5 bg-zinc-900 rounded-full flex items-center justify-center scale-110 shadow-lg"><Check className="w-3 h-3 text-white" /></div>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-baseline">
                                                            <span className="text-2xl font-black text-zinc-900">{formatMoneda(c.target.precio)}</span>
                                                            <Calendar className="w-4 h-4 text-zinc-300" />
                                                        </div>
                                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Última actualización: {c.target?.fecha ? new Date(c.target.fecha).toLocaleDateString() : 'Sin fecha'}</p>
                                                    </div>
                                                </div>

                                                {/* Opción B: Sobrescribir con Importado */}
                                                <div
                                                    onClick={() => setImportResolutions(prev => ({ ...prev, [c.source.id]: 'overwrite' }))}
                                                    className={`p-6 bg-white cursor-pointer transition-all ${importResolutions[c.source.id] === 'overwrite' ? 'ring-2 ring-inset ring-[#F39200] bg-[#F39200]/5' : 'hover:bg-zinc-50/50'}`}
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <span className="text-[10px] font-black uppercase text-zinc-400">Nueva Versión (Origen)</span>
                                                        {importResolutions[c.source.id] === 'overwrite' && <div className="w-5 h-5 bg-[#F39200] rounded-full flex items-center justify-center scale-110 shadow-lg shadow-[#F39200]/40"><Check className="w-3 h-3 text-white" /></div>}
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-baseline">
                                                            <span className="text-2xl font-black text-[#F39200]">{formatMoneda(c.source.precio)}</span>
                                                            <ArrowRight className="w-4 h-4 text-[#F39200]" />
                                                        </div>
                                                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Última actualización: {c.source?.fecha ? new Date(c.source.fecha).toLocaleDateString() : 'Sin fecha'}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white border-t border-zinc-100 px-8 py-6 flex items-center justify-between shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-[#F39200] animate-pulse" />
                                    <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Total de decisiones tomadas: {Object.keys(importResolutions).length}</p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setShowConflictModal(false)} className="h-12 px-6 text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Volver</button>
                                    <LiquidButton
                                        onClick={() => handleExecuteImport(importResolutions)}
                                        disabled={importingStatus}
                                        className="h-12 px-10 rounded-2xl bg-zinc-900 text-white shadow-xl shadow-zinc-950/20 font-black uppercase tracking-widest text-[11px] flex items-center gap-2"
                                    >
                                        {importingStatus ? (
                                            <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <Check className="w-4 h-4" />
                                        )}
                                        CONFIRMAR Y FINALIZAR
                                    </LiquidButton>
                                </div>
                            </div>
                    </AppModalShell>
                )}
            </AnimatePresence>

            <BulkDeleteConfirmModal
                isOpen={showBulkDeleteModal}
                onClose={closeBulkDeleteModal}
                onConfirm={handleBulkDeleteConfirm}
                step={bulkDeleteStep}
                setStep={setBulkDeleteStep}
                loading={bulkDeleting}
                title="¿Borrar APUs seleccionados?"
                count={selectedApus.length}
                summary="Se intentará eliminar toda la selección en una sola operación. Si uno de los APUs está siendo usado por otro APU superior, no se borrará ninguno."
                previewItems={apus.filter(apu => selectedApus.includes(apu.id))}
                finalWarning="¿Estás absolutamente seguro? Esta acción es irreversible. El borrado solo se ejecutará si todos los APUs cumplen las reglas de integridad definidas para el catálogo."
            />
        </div>
    );
};

const APUsWithBoundary = () => (
    <ErrorBoundary>
        <APUs />
    </ErrorBoundary>
);

export default APUsWithBoundary;

const normalizeDescriptionCapitalization =
    descriptionCapitalization.normalizeDescriptionCapitalization
    || descriptionCapitalization.default?.normalizeDescriptionCapitalization
    || ((value) => value ?? '');
const normalizeDisplayUnit =
    descriptionCapitalization.normalizeDisplayUnit
    || descriptionCapitalization.default?.normalizeDisplayUnit
    || ((value) => value ?? '');
const normalizeSubcategoryDisplay =
    descriptionCapitalization.normalizeSubcategoryDisplay
    || descriptionCapitalization.default?.normalizeSubcategoryDisplay
    || ((value) => String(value || '').toUpperCase());
