import React, { useState, useEffect, useContext, useMemo, useCallback, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

import {
    Building2, Search, Plus, Filter, Package, Users, HardHat, Truck,
    MoreVertical, Edit2, Trash2, Database, ArrowLeft, LayoutGrid, X, Save,
    ChevronRight, GripVertical, AlertCircle, SpellCheck, Copy, Info, CheckCircle2,
    Tags,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LiquidButton } from '../components/ui/liquid-button';
import { AppModalShell, AppModalHeader, AppModalBody, AppModalFooter } from '../components/ui/app-modal';
import BulkDeleteConfirmModal from '../components/precios-unitarios/BulkDeleteConfirmModal';
import ResourceEditorModal from '../components/precios-unitarios/ResourceEditorModal';
import ImportFormatHint from '../components/precios-unitarios/ImportFormatHint';
import CatalogSidebarCard from '../components/ui/CatalogSidebarCard';
import ClearSearchField from '../components/ui/ClearSearchField';
import SoftSelectToggle from '../components/ui/SoftSelectToggle';
import CodeColorizer from '../utils/codeColorizer';
import recursosApi from '../api/recursos';
import basesTrabajoApi from '../api/basesTrabajo';
import subcategoriasItemsApi from '../api/subcategoriasItems';
import utilsApi from '../api/utils';
import { maestrosApi } from '../api/maestros';
import { normalizeTextInputValue } from '../utils/normalizeInputValue';
import { includesNormalized, normalizeSearchToken } from '../utils/normalizeSearch';
import { appAlert, appConfirm } from '../utils/appDialog';
import { roundDecimal } from '../utils/math';
import { useFormatters } from '../hooks/useFormatters';
import { getOmniClassTableForResourceCategory } from '../utils/omniclass';
import useMarketplaceOrigin from '../hooks/useMarketplaceOrigin';
import MarketplaceOriginBadgeSet, { getMarketplaceOwnershipTone } from '../components/marketplace/MarketplaceOriginBadgeSet';
import * as descriptionCapitalization from '../utils/descriptionCapitalization';

const getResourceVariantBadge = (item) => {
    if (item?.sync_status === 'diverged') {
        return { label: 'Divergente', className: 'bg-red-50 text-red-600 border-red-200', title: 'Este recurso heredado ya difiere de la base origen.' };
    }
    if (item?.content_origin === 'local') {
        return { label: 'Local', className: 'bg-violet-50 text-violet-600 border-violet-200', title: 'Este recurso existe solo en esta base de trabajo.' };
    }
    if (item?.content_origin === 'inherited') {
        return { label: 'Heredado', className: 'bg-emerald-50 text-emerald-600 border-emerald-200', title: 'Este recurso está alineado con la base origen.' };
    }
    return { label: 'Nativo', className: 'bg-slate-50 text-slate-500 border-slate-200', title: 'Este recurso pertenece a una base nativa.' };
};

const resourceHasCpc = (recurso) => Boolean(
    recurso?.cod_cpc_id ||
    recurso?.cpc?.id ||
    recurso?.cpc?.codCPC ||
    recurso?.cod_cpc_codigo
);

// --- Constantes de Categorías ---
const CATEGORIAS_BASE = [
    { id: 1, nombre: 'Equipos y Herramientas', icon: '🔧', color: 'text-blue-600' },
    { id: 2, nombre: 'Materiales', icon: '📦', color: 'text-green-600' },
    { id: 3, nombre: 'Transporte', icon: '🚚', color: 'text-yellow-600' },
    { id: 4, nombre: 'Mano de Obra', icon: '👥', color: 'text-purple-600' },
    { id: 5, nombre: 'Análisis de Precios Unitarios', icon: '📑', color: 'text-orange-600' },
];

const CATEGORIA_STYLING = {
    1: { icon: '🔧', color: 'text-blue-600' },
    2: { icon: '📦', color: 'text-green-600' },
    3: { icon: '🚚', color: 'text-yellow-600' },
    4: { icon: '👥', color: 'text-purple-600' },
    5: { icon: '📄', color: 'text-zinc-600' }
};

// Variante visual reversible para sidebars de subcategorias en catalogos operativos.
const USE_ENHANCED_RESOURCE_SUBCATEGORY_LIST = true;

const cleanClipboardCell = (value) => (value || '')
    .replace(/\u00A0/g, ' ')
    .replace(/\r/g, '')
    .trim();

const looksLikeRowLabel = (value) => {
    const normalized = cleanClipboardCell(value);
    if (!normalized || normalized.length > 10) return false;
    if (!/^[\dA-Za-z._-]+$/.test(normalized)) return false;
    return /\d/.test(normalized) || /[._-]/.test(normalized);
};

const isNumericClipboardValue = (value) => /^-?\d+([.,]\d+)?$/.test(cleanClipboardCell(value || ''));

const normalizeClipboardText = (value) => cleanClipboardCell(value).replace(/\s+/g, ' ');

const RESOURCE_IMPORT_UNIT_MAPPINGS = {
    'kg': 'kg',
    'kilogramo': 'kg',
    'kilogramos': 'kg',
    'km': 'km',
    'kilómetro': 'km',
    'kilometro': 'km',
    'kilometros': 'km',
    'kilómetros': 'km',
    'h': 'hora',
    'hr': 'hora',
    'hrs': 'hora',
    'hora': 'hora',
    'horas': 'hora',
    'dia': 'dia',
    'día': 'dia',
    'dias': 'dia',
    'días': 'dia',
    'sem': 'semana',
    'semana': 'semana',
    'semanas': 'semana',
    'mes': 'mes',
    'meses': 'mes',
    'm3': 'm3',
    'metro cubico': 'm3',
    'metro cúbico': 'm3',
    'metros cubicos': 'm3',
    'metros cúbicos': 'm3',
    'm2': 'm2',
    'metro cuadrado': 'm2',
    'metros cuadrados': 'm2',
    'ml': 'ml',
    'metro lineal': 'ml',
    'metros lineales': 'ml',
    'und': 'und',
    'unidad': 'und',
    'unidades': 'und',
};

const isResourceImportHeader = (line) => {
    const normalized = normalizeClipboardText(line).toLowerCase();
    if (!normalized) return false;
    return (
        normalized.includes('descripcion') ||
        normalized.includes('descripción') ||
        normalized.includes('precio') ||
        normalized.includes('unidad') ||
        normalized.includes('cpc') ||
        normalized.includes('omniclass')
    );
};

const stripLeadingRowLabel = (parts) => (
    parts.length > 1 && looksLikeRowLabel(parts[0]) && parts[1]
        ? parts.slice(1)
        : parts
);

const parseResourceImportFromPlainText = (line) => {
    const normalizedLine = normalizeClipboardText(line);
    if (!normalizedLine) return null;

    const tokens = stripLeadingRowLabel(normalizedLine.split(/\s+/).map(cleanClipboardCell));
    if (tokens.length === 0) return null;

    const cpcIndex = /^\d{4,}$/.test(tokens[tokens.length - 1] || '') ? tokens.length - 1 : tokens.length;
    let priceIndex = -1;
    for (let i = cpcIndex - 1; i >= 0; i -= 1) {
        if (isNumericClipboardValue(tokens[i])) {
            priceIndex = i;
            break;
        }
    }

    if (priceIndex <= 0) {
        return {
            descripcion: normalizedLine,
            precio: 0,
            unidad_nombre: '',
            cod_cpc_codigo: '',
            especificaciones: ''
        };
    }

    const descripcion = normalizeClipboardText(tokens.slice(0, priceIndex).join(' '));
    const unidad = normalizeClipboardText(tokens.slice(priceIndex + 1, cpcIndex).join(' '));
    const cpc = cpcIndex < tokens.length ? cleanClipboardCell(tokens[cpcIndex]) : '';
    const especificaciones = cpcIndex < tokens.length - 1
        ? normalizeClipboardText(tokens.slice(cpcIndex + 1).join(' '))
        : '';

    return {
        descripcion,
        precio: roundDecimal(parseFloat(tokens[priceIndex].replace(',', '.')) || 0, 2),
        unidad_nombre: unidad,
        cod_cpc_codigo: cpc,
        especificaciones
    };
};

const parseResourceImportLine = (line) => {
    const cols = line.split('\t').map(cleanClipboardCell);
    if (cols.length === 0 || !cols.some(Boolean)) return null;

    let offset = 0;
    if (cols.length > 1 && looksLikeRowLabel(cols[0]) && cols[1]) {
        offset = 1;
    }

    const scopedCols = cols.slice(offset);
    if (scopedCols.length <= 1) {
        return parseResourceImportFromPlainText(line);
    }

    const descripcion = normalizeClipboardText(scopedCols[0] || '');
    if (!descripcion) return parseResourceImportFromPlainText(line);

    const maybePrice = cleanClipboardCell(scopedCols[1] || '');
    const hasExplicitPriceColumn = isNumericClipboardValue(maybePrice);
    const normalizedPrice = maybePrice.replace(',', '.');
    const parsedPrice = hasExplicitPriceColumn ? parseFloat(normalizedPrice) : 0;
    
    // Column mapping:
    // With Price: Descr(0) | Price(1) | Unid(2) | CPC(3) | Spec(4) | OmniCod(5) | OmniTit(6...)
    // Without Price: Descr(0) | Unid(1) | CPC(2) | Spec(3) | OmniCod(4) | OmniTit(5...)

    const unidad = hasExplicitPriceColumn
        ? cleanClipboardCell(scopedCols[2] || '')
        : cleanClipboardCell(scopedCols[1] || '');
    const cpc = hasExplicitPriceColumn
        ? cleanClipboardCell(scopedCols[3] || '')
        : cleanClipboardCell(scopedCols[2] || '');
    
    const especificaciones = hasExplicitPriceColumn
        ? cleanClipboardCell(scopedCols[4] || '')
        : cleanClipboardCell(scopedCols[3] || '');
    const omniclass_codigo = hasExplicitPriceColumn
        ? cleanClipboardCell(scopedCols[5] || '')
        : cleanClipboardCell(scopedCols[4] || '');
    const omniclass_titulo = hasExplicitPriceColumn
        ? normalizeClipboardText(scopedCols.slice(6).join(' '))
        : normalizeClipboardText(scopedCols.slice(5).join(' '));

    return {
        descripcion,
        precio: roundDecimal(Number.isFinite(parsedPrice) ? parsedPrice : 0, 2),
        unidad_nombre: unidad,
        cod_cpc_codigo: cpc,
        omniclass_codigo,
        omniclass_titulo,
        especificaciones
    };
};

const buildResourceImportPreview = (rawText, recursos, unidades) => {
    const existingDescriptions = new Set((recursos || []).map(recurso => cleanClipboardCell(recurso.descripcion).toLowerCase()));
    const seen = new Set();
    
    const systemUnits = (unidades || []).map(u => ({
        id: u.id,
        name: cleanClipboardCell(u.descripcion).toLowerCase(),
        full: cleanClipboardCell(u.descripcion_completa).toLowerCase()
    }));

    const findBestUnit = (rawUnit) => {
        if (!rawUnit) return null;
        const normalized = cleanClipboardCell(rawUnit).toLowerCase();
        if (!normalized) return null;

        let found = systemUnits.find(u => u.name === normalized || u.full === normalized);
        if (found) return found;

        if (RESOURCE_IMPORT_UNIT_MAPPINGS[normalized]) {
            const mappedNameOrFull = RESOURCE_IMPORT_UNIT_MAPPINGS[normalized];
            found = systemUnits.find(u => u.name === mappedNameOrFull || u.full === mappedNameOrFull);
            if (found) return found;
        }

        if (normalized.length > 3) {
            found = systemUnits.find(u => u.name.startsWith(normalized) || u.full.startsWith(normalized));
            if (found) return found;
        }

        return null;
    };

    return rawText
        .split('\n')
        .map((line, index) => {
            const raw = line;
            if (!raw.trim()) return null;
            if (isResourceImportHeader(raw) && index === 0) {
                return {
                    row: index + 1,
                    raw,
                    parsed: null,
                    valid: false,
                    reason: 'Encabezado detectado'
                };
            }
            const parsed = parseResourceImportLine(line);
            let reason = '';
            let valid = !!parsed?.descripcion;

            if (!parsed?.descripcion) {
                valid = false;
                reason = 'Fila vacía o sin descripción interpretable';
            } else if (!parsed.unidad_nombre) {
                valid = false;
                reason = 'Unidad obligatoria';
            } else {
                const key = cleanClipboardCell(parsed.descripcion).toLowerCase();
                if (seen.has(key)) {
                    valid = false;
                    reason = 'Duplicada dentro del pegado';
                } else if (existingDescriptions.has(key)) {
                    valid = false;
                    reason = 'Ya existe en la base activa';
                } else {
                    seen.add(key);
                    const bestUnit = findBestUnit(parsed.unidad_nombre);
                    if (bestUnit) {
                        parsed.unidad_id = bestUnit.id;
                        parsed.unidad_nombre = bestUnit.name;
                    } else {
                        valid = false;
                        reason = `Unidad desconocida: ${parsed.unidad_nombre}`;
                    }
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

const resolveExactCpcMatch = (results = [], rawCode = '') => {
    const normalizedCode = cleanClipboardCell(rawCode);
    if (!normalizedCode) return null;
    return results.find((item) => cleanClipboardCell(item.codCPC) === normalizedCode) || results[0] || null;
};

const resolveExactOmniMatch = (results = [], rawCode = '', rawTitle = '') => {
    const normalizedCode = cleanClipboardCell(rawCode);
    const normalizedTitle = normalizeClipboardText(rawTitle).toLowerCase();

    if (normalizedCode) {
        const byCode = results.find((item) => cleanClipboardCell(item.codigo) === normalizedCode);
        if (byCode) return byCode;
    }

    if (normalizedTitle) {
        const byTitle = results.find((item) => {
            const title = normalizeClipboardText(item.titulo_resuelto || item.titulo_es || item.titulo || '').toLowerCase();
            return title === normalizedTitle;
        });
        if (byTitle) return byTitle;
    }

    return results[0] || null;
};

const renderResourceDescription = (value) => normalizeDescriptionCapitalization(value);
const renderSubcategoryDescription = (value) => normalizeSubcategoryDisplay(value);
const renderUnitDescription = (value) => normalizeDisplayUnit(value);

const Recursos = () => {
    const { user, selectedEmpresa, selectedBaseTrabajo } = useContext(AuthContext);
    const activeBaseOrigin = useMarketplaceOrigin('base_trabajo', selectedBaseTrabajo?.id);
    const activeBaseTone = getMarketplaceOwnershipTone(activeBaseOrigin);
    const [sourceBaseLabel, setSourceBaseLabel] = useState('');
    const useOmniClass = selectedEmpresa?.use_omniclass !== false;
    const effectiveBaseRevision = selectedBaseTrabajo?.tipo === 'Base de Proyecto'
        ? (selectedBaseTrabajo.revision ?? 0)
        : null;
    
    // -- Robust formatters with fallbacks --
    const formatters = useFormatters();
    const formatNumericDisplay = formatters?.formatNumericDisplay || ((v) => String(v || '').replace('.', ','));
    const parseNumericInput = formatters?.parseNumericInput || ((v) => String(v || '').replace(',', '.'));
    const { formatMoneda, formatMonedaInput } = formatters || {};

    const navigate = useNavigate();

    const [categorias, setCategorias] = useState([]);
    const [selectedCat, setSelectedCat] = useState(1);
    const [subcategorias, setSubcategorias] = useState([]);
    const [allSubcategorias, setAllSubcategorias] = useState([]);
    const [selectedSubcatId, setSelectedSubcatId] = useState(null);
    const [recursos, setRecursos] = useState([]);
    const [allRecursos, setAllRecursos] = useState([]);
    const [searchSubcategories, setSearchSubcategories] = useState('');

    // Catalogos
    const [unidades, setUnidades] = useState([]);
    // UI State
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingRecurso, setEditingRecurso] = useState(null);
    const [dragOverSubcat, setDragOverSubcat] = useState(null);
    const [selectedRecursos, setSelectedRecursos] = useState([]); 
    const [showImportModal, setShowImportModal] = useState(false);
    const [importText, setImportText] = useState('');
    const importPreview = useMemo(() => buildResourceImportPreview(importText, recursos, unidades), [importText, recursos, unidades]);
    const resourceVariantSummary = useMemo(() => recursos.reduce((acc, recurso) => {
        if (recurso?.sync_status === 'diverged') acc.diverged += 1;
        else if (recurso?.content_origin === 'local') acc.local += 1;
        else if (recurso?.content_origin === 'inherited') acc.inherited += 1;
        else acc.native += 1;
        return acc;
    }, { inherited: 0, local: 0, diverged: 0, native: 0 }), [recursos]);
    const validImportRows = importPreview.filter(item => item.valid);
    const duplicateImportRows = importPreview.filter(item => item && !item.valid && (
        (item.reason || '').toLowerCase().includes('duplic') ||
        (item.reason || '').toLowerCase().includes('ya existe')
    ));
    const invalidImportRows = importPreview.filter(item => item && !item.valid && !(
        (item.reason || '').toLowerCase().includes('duplic') ||
        (item.reason || '').toLowerCase().includes('ya existe')
    ));
    const validUnitNames = useMemo(
        () => unidades.map((u) => (typeof u === 'object' ? u.descripcion : u)).filter(Boolean),
        [unidades]
    );
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [bulkDeleteStep, setBulkDeleteStep] = useState(1);
    const [bulkDeleting, setBulkDeleting] = useState(false);
    const [showBulkCpcModal, setShowBulkCpcModal] = useState(false);
    const [bulkCpcSearchTerm, setBulkCpcSearchTerm] = useState('');
    const [bulkCpcResults, setBulkCpcResults] = useState([]);
    const [bulkCpcSearching, setBulkCpcSearching] = useState(false);
    const [bulkCpcSaving, setBulkCpcSaving] = useState(false);
    const [lastActionId, setLastActionId] = useState(null);
    const [globalSearchLoading, setGlobalSearchLoading] = useState(false);
    const [cpcFilterMode, setCpcFilterMode] = useState('all');
    const pendingSubcatNavigationRef = useRef(null);
    const [cpcResolutionMap, setCpcResolutionMap] = useState({});
    const [omniResolutionMap, setOmniResolutionMap] = useState({});
    const [importResolutionLoading, setImportResolutionLoading] = useState(false);

    const [form, setForm] = useState({
        descripcion: '',
        precio: 0,
        unidad_id: '',
        cod_cpc_id: null,
        especificaciones: '',
        cpc_display: '',
        equipment_ownership_kind: '',
        governing_resource_kind: '',
        omniclass_codigo: '',
        omniclass_titulo: ''
    });

    const currentOmniClassTable = getOmniClassTableForResourceCategory(selectedCat);
    const allSubcategoriasMap = useMemo(
        () => new Map((allSubcategorias || []).map(subcat => [subcat.id, subcat])),
        [allSubcategorias]
    );

    const getCategoryNameForSubcatId = useCallback((subcatId) => {
        const subcat = allSubcategoriasMap.get(subcatId);
        const category = CATEGORIAS_BASE.find(cat => cat.id === Number(subcat?.subcategoria_codigo));
        return category?.nombre || 'Categoría';
    }, [allSubcategoriasMap]);

    useEffect(() => {
        if (!showImportModal || importPreview.length === 0) {
            setCpcResolutionMap({});
            setOmniResolutionMap({});
            setImportResolutionLoading(false);
            return;
        }

        const cpcEntries = importPreview
            .map((item) => cleanClipboardCell(item.parsed?.cod_cpc_codigo))
            .filter(Boolean);
        const omniEntries = importPreview
            .map((item) => ({
                key: `${cleanClipboardCell(item.parsed?.omniclass_codigo)}|${normalizeClipboardText(item.parsed?.omniclass_titulo || '')}`,
                codigo: cleanClipboardCell(item.parsed?.omniclass_codigo),
                titulo: normalizeClipboardText(item.parsed?.omniclass_titulo || '')
            }))
            .filter((item) => item.codigo || item.titulo);

        if (cpcEntries.length === 0 && omniEntries.length === 0) {
            setCpcResolutionMap({});
            setOmniResolutionMap({});
            setImportResolutionLoading(false);
            return;
        }

        let cancelled = false;
        const uniqueCpcs = [...new Set(cpcEntries)];
        const uniqueOmni = Array.from(new Map(omniEntries.map((item) => [item.key, item])).values());

        const loadResolutions = async () => {
            setImportResolutionLoading(true);
            try {
                const nextCpcMap = {};
                const nextOmniMap = {};

                for (const code of uniqueCpcs) {
                    try {
                        const response = await recursosApi.searchCPC(code);
                        const results = Array.isArray(response?.data) ? response.data : [];
                        const resolved = resolveExactCpcMatch(results, code);
                        if (resolved) nextCpcMap[code] = resolved;
                    } catch (error) {
                        globalThis.reportClientError?.('Error resolviendo CPC en importador de recursos:', error);
                    }
                }

                for (const omni of uniqueOmni) {
                    try {
                        const query = omni.codigo || omni.titulo;
                        const results = await maestrosApi.getOmniClassSearch(query, currentOmniClassTable);
                        const resolved = resolveExactOmniMatch(results || [], omni.codigo, omni.titulo);
                        if (resolved) nextOmniMap[omni.key] = resolved;
                    } catch (error) {
                        globalThis.reportClientError?.('Error resolviendo OmniClass en importador de recursos:', error);
                    }
                }

                if (!cancelled) {
                    setCpcResolutionMap(nextCpcMap);
                    setOmniResolutionMap(nextOmniMap);
                }
            } finally {
                if (!cancelled) setImportResolutionLoading(false);
            }
        };

        loadResolutions();
        return () => {
            cancelled = true;
        };
    }, [showImportModal, importPreview, currentOmniClassTable]);

    useEffect(() => {
        if (!showBulkCpcModal) return undefined;
        const timer = setTimeout(async () => {
            if (bulkCpcSearchTerm.length === 1) return;
            setBulkCpcSearching(true);
            try {
                const response = await recursosApi.searchCPC(bulkCpcSearchTerm);
                setBulkCpcResults(response.data || []);
            } catch (error) {
                globalThis.reportClientError?.('Error buscando CPC para asignacion masiva:', error);
                setBulkCpcResults([]);
            } finally {
                setBulkCpcSearching(false);
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [bulkCpcSearchTerm, showBulkCpcModal]);

    const fetchCategorias = useCallback(async () => {
        if (!selectedBaseTrabajo) return;
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await recursosApi.getCategorias(selectedBaseTrabajo.id, empId);
            const filtered = (res.data || []).filter(c => c.id >= 1 && c.id <= 4);
            setCategorias(filtered);
        } catch (error) {
            globalThis.reportClientError?.("Error fetching categories:", error);
        }
    }, [selectedBaseTrabajo, selectedEmpresa, user?.empresa_id]);

    useEffect(() => {
        fetchCategorias();
    }, [fetchCategorias]);

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

    const fetchSubcategorias = useCallback(async (targetId = null) => {
        if (!selectedBaseTrabajo) return;
        setLoading(true);
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await subcategoriasItemsApi.getAll(selectedBaseTrabajo.id, selectedCat, empId);
            const subcats = res.data || [];
            setSubcategorias(subcats);
            if (subcats.length > 0) {
                const idToKeep = targetId || selectedSubcatId;
                const exists = subcats.some(s => s.id === idToKeep);
                if (idToKeep && exists) {
                    setSelectedSubcatId(idToKeep);
                } else {
                    setSelectedSubcatId(null);
                }
            } else {
                setSelectedSubcatId(null);
                setRecursos([]);
            }
        } catch (error) {
            globalThis.reportClientError?.("Error cargando subcategorías:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedBaseTrabajo, selectedCat, selectedEmpresa?.id, user?.empresa_id, selectedSubcatId]);

    const ensureGlobalSearchIndex = useCallback(async () => {
        if (!selectedBaseTrabajo) return;
        if (allRecursos.length > 0 && allSubcategorias.length > 0) return;

        setGlobalSearchLoading(true);
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const [subcatsRes, recursosRes] = await Promise.all([
                subcategoriasItemsApi.getAll(selectedBaseTrabajo.id, null, empId),
                recursosApi.getAll(selectedBaseTrabajo.id, null, empId)
            ]);
            setAllSubcategorias(subcatsRes.data || []);
            setAllRecursos(recursosRes.data || []);
        } catch (error) {
            globalThis.reportClientError?.('[Recursos] Error construyendo índice global de búsqueda:', error);
        } finally {
            setGlobalSearchLoading(false);
        }
    }, [selectedBaseTrabajo, selectedEmpresa?.id, user?.empresa_id, allRecursos.length, allSubcategorias.length]);

    const fetchRecursos = useCallback(async () => {
        if (!selectedBaseTrabajo) return;
        setLoading(true);
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await recursosApi.getAll(selectedBaseTrabajo.id, null, empId);
            setRecursos(res.data || []);
        } catch (error) {
            globalThis.reportClientError?.("[Recursos] Error cargando recursos:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedBaseTrabajo, selectedEmpresa?.id, user?.empresa_id]);

    const fetchUnidades = useCallback(async () => {
        if (!selectedBaseTrabajo) return;
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await recursosApi.getUnidades(selectedCat, selectedBaseTrabajo.id, empId);
            setUnidades(res.data);
        } catch (error) {
            globalThis.reportClientError?.("Error cargando unidades:", error);
        }
    }, [selectedBaseTrabajo, selectedCat, selectedEmpresa?.id, user?.empresa_id]);

    useEffect(() => {
        if (!selectedBaseTrabajo) {
            navigate('/precios-unitarios/bases');
            return;
        }
        fetchSubcategorias(pendingSubcatNavigationRef.current);
        pendingSubcatNavigationRef.current = null;
        fetchUnidades();
    }, [selectedCat, selectedBaseTrabajo, fetchSubcategorias, fetchUnidades, navigate]);

    useEffect(() => {
        if (selectedBaseTrabajo) fetchRecursos();
    }, [selectedBaseTrabajo, selectedCat, fetchRecursos]);

    useEffect(() => {
        if (lastActionId) {
            const timer = setTimeout(() => {
                const element = document.getElementById(`recurso-${lastActionId}`);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    element.classList.add('ring-2', 'ring-[#F39200]', 'ring-offset-2');
                    setTimeout(() => element.classList.remove('ring-2', 'ring-[#F39200]', 'ring-offset-2'), 2000);
                }
                setLastActionId(null);
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [recursos, lastActionId]);

    useEffect(() => {
        if (!selectedSubcatId) return;
        const timer = setTimeout(() => {
            const subcatElement = document.getElementById(`subcategoria-${selectedSubcatId}`);
            subcatElement?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 120);
        return () => clearTimeout(timer);
    }, [selectedSubcatId, subcategorias]);

    useEffect(() => {
        setAllSubcategorias([]);
        setAllRecursos([]);
    }, [selectedBaseTrabajo?.id, selectedEmpresa?.id, user?.empresa_id]);

    useEffect(() => {
        if (searchTerm.trim()) {
            ensureGlobalSearchIndex();
        }
    }, [searchTerm, ensureGlobalSearchIndex]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showModal) setShowModal(false);
                if (showImportModal) setShowImportModal(false);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showModal, showImportModal]);

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Normalizar el precio antes de enviar
            const normalizedPrice = parseFloat(parseNumericInput(form.precio)) || 0;
            const data = { 
                ...form, 
                precio: normalizedPrice,
                subcategoria_item_id: selectedSubcatId 
            };
            if (!useOmniClass) {
                data.omniclass_codigo = '';
                data.omniclass_titulo = '';
            }
            delete data.cpc_display;
            const empId = selectedEmpresa?.id || user?.empresa_id;
            if (editingRecurso) {
                await recursosApi.update(editingRecurso.id, data, empId);
                setLastActionId(editingRecurso.id);
            } else {
                const res = await recursosApi.create(selectedBaseTrabajo.id, data, empId);
                if (res.data?.id) setLastActionId(res.data.id);
            }
            setShowModal(false);
            fetchRecursos();
        } catch (error) {
            appAlert(error.response?.data?.detail || "Error al guardar el recurso");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await appConfirm({
            title: 'Borrar recurso',
            message: '¿Confirmar eliminación del recurso? Los códigos se restructurarán.',
            confirmLabel: 'Borrar',
            cancelLabel: 'Cancelar',
            tone: 'danger'
        });
        if (!confirmed) return;
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await recursosApi.delete(id, empId);
            fetchRecursos();
        } catch {
            appAlert("Error al eliminar");
        }
    };

    const handleDuplicate = async (id) => {
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await recursosApi.duplicate(id, empId);
            if (res.data?.id) setLastActionId(res.data.id);
            fetchRecursos();
        } catch {
            appAlert("Error al duplicar");
        }
    };

    const handleSpellCheck = async () => {
        if (!form.especificaciones.trim()) return;
        try {
            const res = await utilsApi.spellcheck(form.especificaciones);
            if (res.data.has_errors) {
                const confirmed = await appConfirm({
                    title: 'Aplicar corrección ortográfica',
                    message: `Sugerencia de corrección:\n\n${res.data.corrected}\n\n¿Desea aplicar?`,
                    confirmLabel: 'Aplicar',
                    cancelLabel: 'Mantener actual',
                    tone: 'info'
                });
                if (confirmed) setForm(prev => ({ ...prev, especificaciones: res.data.corrected }));
            } else {
                appAlert("Ortografía correcta.");
            }
        } catch (error) {
            globalThis.reportClientError?.(error);
        }
    };

    const handleDragStart = (e, recursoId) => {
        if (selectedRecursos.includes(recursoId)) {
            e.dataTransfer.setData('recursoIds', JSON.stringify(selectedRecursos));
        } else {
            e.dataTransfer.setData('recursoIds', JSON.stringify([recursoId]));
        }
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, subcatId) => {
        e.preventDefault();
        const scrollContainer = document.getElementById('subcategories-scroll-container');
        if (scrollContainer) {
            const { top, bottom } = scrollContainer.getBoundingClientRect();
            if (e.clientY < top + 50) scrollContainer.scrollTop -= 10;
            else if (e.clientY > bottom - 50) scrollContainer.scrollTop += 10;
        }
        if (selectedSubcatId !== subcatId) setDragOverSubcat(subcatId);
    };

    const handleDrop = async (e, targetSubcatId) => {
        e.preventDefault();
        setDragOverSubcat(null);
        const rawIds = e.dataTransfer.getData('recursoIds');
        if (!rawIds) return;
        const ids = JSON.parse(rawIds);
        if (selectedSubcatId === targetSubcatId) return;
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await Promise.all(ids.map(id => recursosApi.move(id, targetSubcatId, empId)));
            appAlert(`Se movieron ${ids.length} recursos correctamente`);
            setSelectedSubcatId(targetSubcatId);
            setLastActionId(ids[0]);
            fetchSubcategorias(targetSubcatId);
            setSelectedRecursos([]);
        } catch {
            appAlert("Error al mover recursos");
        }
    };

    const toggleSelect = (id) => {
        setSelectedRecursos(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const currentCategorySubcatIds = useMemo(
        () => new Set((subcategorias || []).map((sub) => Number(sub.id))),
        [subcategorias]
    );
    const recursoIsInCurrentScope = useCallback((recurso) => {
        if (selectedSubcatId) {
            return Number(recurso.subcategoria_item_id) === Number(selectedSubcatId);
        }
        return currentCategorySubcatIds.has(Number(recurso.subcategoria_item_id));
    }, [selectedSubcatId, currentCategorySubcatIds]);
    const scopedRecursos = useMemo(() => (
        (recursos || []).filter(recursoIsInCurrentScope)
    ), [recursos, recursoIsInCurrentScope]);
    const totalWithoutCpcCount = useMemo(() => (
        scopedRecursos.filter((recurso) => !resourceHasCpc(recurso)).length
    ), [scopedRecursos]);
    const visibleRecursos = useMemo(() => (
        cpcFilterMode === 'without_cpc'
            ? scopedRecursos.filter((recurso) => !resourceHasCpc(recurso))
            : scopedRecursos
    ), [scopedRecursos, cpcFilterMode]);
    const totalRecursosCount = scopedRecursos.length;
    const visibleResourceSubcategories = useMemo(() => (
        (subcategorias || []).filter((sub) => (
            includesNormalized(sub.descripcion, searchSubcategories) ||
            includesNormalized(sub.codigo, searchSubcategories)
        ))
    ), [subcategorias, searchSubcategories]);
    const visibleRecursoIds = visibleRecursos.map(recurso => recurso.id);
    const allVisibleSelected = visibleRecursoIds.length > 0 && visibleRecursoIds.every(id => selectedRecursos.includes(id));
    const someVisibleSelected = visibleRecursoIds.some(id => selectedRecursos.includes(id)) && !allVisibleSelected;

    const globalSearchResults = useMemo(() => {
        const normalizedQuery = normalizeSearchToken(searchTerm);
        if (!normalizedQuery) return [];

        return (allRecursos || [])
            .filter(recurso => {
                if (cpcFilterMode === 'without_cpc' && resourceHasCpc(recurso)) {
                    return false;
                }
                return includesNormalized(recurso.descripcion, normalizedQuery) || includesNormalized(recurso.codigo, normalizedQuery);
            })
            .slice(0, 12);
    }, [allRecursos, searchTerm, cpcFilterMode]);

    const handleSelectGlobalResult = useCallback((recurso) => {
        const targetSubcatId = recurso.subcategoria_item_id;
        const targetSubcat = allSubcategoriasMap.get(targetSubcatId);
        const targetCatId = Number(targetSubcat?.subcategoria_codigo);

        if (!targetSubcatId || !targetCatId) {
            appAlert('No se pudo resolver la ubicación del recurso seleccionado.');
            return;
        }

        pendingSubcatNavigationRef.current = targetSubcatId;
        setSelectedRecursos([]);
        setSearchTerm('');
        setLastActionId(recurso.id);

        if (selectedCat !== targetCatId) {
            setSelectedCat(targetCatId);
        } else {
            setSelectedSubcatId(targetSubcatId);
        }
    }, [allSubcategoriasMap, selectedCat]);

    const toggleSelectAllVisible = () => {
        if (visibleRecursoIds.length === 0) return;
        setSelectedRecursos(prev => allVisibleSelected ? prev.filter(id => !visibleRecursoIds.includes(id)) : [...new Set([...prev, ...visibleRecursoIds])]);
    };

    const clearSelection = () => setSelectedRecursos([]);

    const handleBulkDelete = () => {
        if (selectedRecursos.length === 0) {
            appAlert("Seleccione al menos un recurso para borrar.");
            return;
        }
        setShowBulkDeleteModal(true);
    };

    const handleOpenBulkCpc = () => {
        if (selectedRecursos.length < 2) {
            appAlert("Seleccione al menos dos recursos para asignar un CPC masivo.");
            return;
        }
        setBulkCpcSearchTerm('');
        setBulkCpcResults([]);
        setShowBulkCpcModal(true);
    };

    const handleBulkAssignCpc = async (cpc) => {
        if (!cpc?.id || selectedRecursos.length < 2) return;
        const confirmed = await appConfirm({
            title: 'Asignar CPC a seleccionados',
            message: `Se asignará el CPC ${cpc.codCPC} a ${selectedRecursos.length} recursos seleccionados. Los CPC actuales de esos recursos serán reemplazados.`,
            confirmLabel: 'Asignar CPC',
            cancelLabel: 'Cancelar',
            tone: 'info'
        });
        if (!confirmed) return;
        try {
            setBulkCpcSaving(true);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const response = await recursosApi.bulkAssignCpc(selectedRecursos, cpc.id, empId);
            appAlert(response.data?.message || `CPC asignado a ${selectedRecursos.length} recursos.`);
            setShowBulkCpcModal(false);
            setBulkCpcSearchTerm('');
            setBulkCpcResults([]);
            fetchRecursos();
        } catch (error) {
            appAlert(error.response?.data?.detail || "No se pudo asignar el CPC a los recursos seleccionados.");
        } finally {
            setBulkCpcSaving(false);
        }
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            setBulkDeleting(true);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await recursosApi.bulkDelete(selectedRecursos, empId);
            appAlert(res.data.message);
            setSelectedRecursos([]);
            setShowBulkDeleteModal(false);
            setBulkDeleteStep(1);
            fetchRecursos();
        } catch (error) {
            appAlert(error.response?.data?.detail || "Error al ejecutar el borrado masivo.");
        } finally {
            setBulkDeleting(false);
        }
    };

    const handleExport = async () => {
        if (selectedRecursos.length === 0) return;
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await recursosApi.export(selectedRecursos, empId);
            await navigator.clipboard.writeText(res.data.clipboard);
            appAlert("Datos copiados al portapapeles (Formato Excel).");
        } catch {
            appAlert("Error al exportar");
        }
    };

    const handleImport = async () => {
        if (!importText.trim()) return;
        if (!selectedSubcatId) {
            appAlert("Seleccione primero una subcategoría destino para la importación.");
            return;
        }
        const items = validImportRows.map(item => {
            const parsed = item.parsed || {};
            const cpcKey = cleanClipboardCell(parsed.cod_cpc_codigo);
            const omniKey = `${cleanClipboardCell(parsed.omniclass_codigo)}|${normalizeClipboardText(parsed.omniclass_titulo || '')}`;
            const resolvedCpc = cpcResolutionMap[cpcKey];
            const resolvedOmni = omniResolutionMap[omniKey];

            return {
                ...parsed,
                cod_cpc_id: resolvedCpc?.id || parsed.cod_cpc_id || null,
                cod_cpc_codigo: resolvedCpc?.codCPC || parsed.cod_cpc_codigo || '',
                omniclass_codigo: resolvedOmni?.codigo || parsed.omniclass_codigo || '',
                omniclass_titulo: resolvedOmni?.titulo_resuelto || resolvedOmni?.titulo_es || resolvedOmni?.titulo || parsed.omniclass_titulo || ''
            };
        });
        if (items.length === 0) {
            appAlert("No se detectaron recursos válidos.");
            return;
        }
        try {
            setLoading(true);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await recursosApi.import(selectedBaseTrabajo.id, { subcategoria_item_id: selectedSubcatId, items }, empId, effectiveBaseRevision);
            let message = `Importados: ${res.data.imported}\nDuplicados: ${res.data.duplicates}`;
            if (res.data.errors?.length) {
                message += `\n\nNotas:\n${res.data.errors.join('\n')}`;
            }
            appAlert(message);
            setImportText('');
            setShowImportModal(false);
            if (res.data.imported_ids?.length > 0) setLastActionId(res.data.imported_ids[res.data.imported_ids.length - 1]);
            fetchRecursos();
        } catch (error) {
            appAlert(error.response?.data?.detail || "Error en la importación");
        } finally {
            setLoading(false);
        }
    };

    const openCreate = () => {
        setEditingRecurso(null);
        setForm({
            descripcion: '',
            precio: formatMonedaInput(0),
            unidad_id: unidades[0]?.id || '',
            cod_cpc_id: null,
            especificaciones: '',
            cpc_display: '',
            equipment_ownership_kind: '',
            governing_resource_kind: '',
            omniclass_codigo: '',
            omniclass_titulo: ''
        });
        setShowModal(true);
    };

    const openEdit = (recurso) => {
        setEditingRecurso(recurso);
        setForm({
            descripcion: recurso.descripcion,
            precio: formatMonedaInput(recurso.precio),
            unidad_id: recurso.unidad_id,
            cod_cpc_id: recurso.cod_cpc_id,
            especificaciones: recurso.especificaciones || '',
            cpc_display: recurso.cpc ? `${recurso.cpc.codCPC} - ${recurso.cpc.descripcion.substring(0, 30)}...` : '',
            equipment_ownership_kind: recurso.equipment_ownership_kind || '',
            governing_resource_kind: recurso.governing_resource_kind || '',
            omniclass_codigo: recurso.omniclass_codigo || '',
            omniclass_titulo: recurso.omniclass_titulo || ''
        });
        setShowModal(true);
    };

    return (
        <div className="h-full flex flex-col bg-[#F8FAFC] overflow-hidden">
            <div className="bg-zinc-900 px-8 py-3 flex items-center justify-between flex-shrink-0 z-50">
                <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-[#F39200]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Base Activa:</span>
                    <MarketplaceOriginBadgeSet
                        origin={activeBaseOrigin}
                        loading={activeBaseOrigin.loading}
                        label="Origen"
                        mode="tooltip"
                    />
                    <span className={`text-[10px] font-black uppercase tracking-[0.2em] italic ${activeBaseTone.textStrong}`}>{selectedBaseTrabajo?.nombre}</span>
                    {selectedBaseTrabajo?.source_base_id && (
                        <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-sky-700">
                            Proviene de {sourceBaseLabel || 'Base Maestra'}
                        </span>
                    )}
                  </div>
            </div>

            <div className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between flex-shrink-0 z-40">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={() => navigate('/precios-unitarios')} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors"><ArrowLeft className="w-5 h-5 text-zinc-500" /></button>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900">Banco de Recursos</h1>
                        <p className="text-[10px] font-bold text-[#F39200] uppercase tracking-widest text-left">Maestro de Insumos por Categoría</p>
                    </div>
                </div>

                <div className="flex-1 flex justify-center">
                    <div className="flex gap-2 items-center">
                        {categorias.map(cat => {
                            const style = CATEGORIA_STYLING[cat.id] || { icon: '📦', color: 'text-zinc-600' };
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => { setSelectedCat(cat.id); setSelectedSubcatId(null); }}
                                    className={`flex items-center gap-3 px-5 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCat === cat.id ? 'bg-zinc-900 text-white border-zinc-900 shadow-lg' : 'bg-white hover:bg-zinc-50 text-zinc-500 border-zinc-200 shadow-sm'}`}
                                >
                                    <span className={`text-lg ${selectedCat === cat.id ? '' : 'grayscale opacity-50'} ${style.color} transition-all`}>{style.icon}</span>
                                    <div className="flex flex-col items-start leading-none">
                                        <span>{cat.nombre}</span>
                                        {cat.recursos_count !== undefined && (
                                            <span className="text-[8px] mt-1 text-zinc-400">{cat.recursos_count} recursos</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex-1 flex justify-end gap-3">
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                <div className="w-72 bg-white border-r border-zinc-200 flex flex-col h-full">
                    <div className="p-4 border-b border-zinc-50 bg-zinc-50/50 flex items-center justify-between">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Subcategorías</h3>
                        <button onClick={() => navigate('/precios-unitarios/subcategorias')} className="p-1 hover:bg-zinc-200 rounded transition-colors"><Plus className="w-3.5 h-3.5 text-zinc-500" /></button>
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

                    <div id="subcategories-scroll-container" className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                        {subcategorias.length === 0 ? (
                            <div className="text-center py-10 px-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200"><Info className="w-6 h-6 text-zinc-300 mx-auto mb-2" /><p className="text-[9px] font-bold text-zinc-400 uppercase leading-tight italic">Sin subcategorías</p></div>
                        ) : visibleResourceSubcategories.length === 0 ? (
                            <div className="text-center py-10 px-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-100">
                                <p className="text-[9px] font-bold text-zinc-400 uppercase italic">Sin coincidencias</p>
                                <p className="mt-1 text-[10px] font-medium text-zinc-400">Pruebe con otra descripción o código.</p>
                            </div>
                        ) : (
                            visibleResourceSubcategories.map(sub => (
                                <div
                                    key={sub.id}
                                    id={`subcategoria-${sub.id}`}
                                    onDragOver={(e) => handleDragOver(e, sub.id)}
                                    onDragLeave={() => setDragOverSubcat(null)}
                                    onDrop={(e) => handleDrop(e, sub.id)}
                                    className="block"
                                >
                                    {USE_ENHANCED_RESOURCE_SUBCATEGORY_LIST ? (
                                        <CatalogSidebarCard
                                            codeNode={<CodeColorizer code={sub.codigo} className="text-[8px] block mb-1" />}
                                            title={renderSubcategoryDescription(sub.descripcion)}
                                            displayTitle={null}
                                            tooltipText={renderSubcategoryDescription(sub.descripcion)}
                                            count={sub.items_count ?? 0}
                                            footer={renderSubcategoryDescription(sub.descripcion)}
                                            footerVariant="description"
                                            active={selectedSubcatId === sub.id}
                                            dragOver={dragOverSubcat === sub.id}
                                            expanded={selectedSubcatId === sub.id}
                                            onClick={() => setSelectedSubcatId(sub.id)}
                                        />
                                    ) : (
                                        <>
                                            <div className="flex-1 min-w-0 text-left">
                                                <CodeColorizer code={sub.codigo} className={`text-[8px] block mb-1 ${selectedSubcatId === sub.id ? 'brightness-200' : ''}`} />
                                                <p className="text-[11px] font-black uppercase tracking-tight leading-snug line-clamp-2 break-words">
                                                    {renderSubcategoryDescription(sub.descripcion)}
                                                </p>
                                                <p className={`mt-1 text-[9px] font-bold uppercase tracking-[0.14em] ${selectedSubcatId === sub.id ? 'text-white/70' : 'text-zinc-400'}`}>
                                                    {sub.items_count ?? 0} recursos
                                                </p>
                                            </div>
                                            <ChevronRight className={`mt-1 w-3 h-3 shrink-0 transition-transform ${selectedSubcatId === sub.id ? 'rotate-90 text-white' : 'text-zinc-300'}`} />
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
                    {selectedBaseTrabajo ? (
                        <>
                            <div className="flex items-center justify-between px-6 lg:px-10 py-6 flex-shrink-0 border-b border-zinc-100">
                                <div>
                                    <h2 className="text-2xl font-black uppercase text-zinc-800 tracking-tight">
                                        {selectedSubcatId
                                            ? renderSubcategoryDescription(subcategorias.find(s => s.id === selectedSubcatId)?.descripcion)
                                            : (categorias.find((cat) => Number(cat.id) === Number(selectedCat))?.nombre || 'Recursos')}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            {`${visibleRecursos.length} visibles / ${totalRecursosCount} totales`}
                                        </span>
                                        {cpcFilterMode === 'without_cpc' && (
                                            <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#F39200] bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                                                Sin CPC
                                            </span>
                                        )}
                                    </div>
                                    {!selectedSubcatId && (
                                        <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                            Resultados globales de la categoría activa
                                        </p>
                                    )}
                                    {(resourceVariantSummary.diverged > 0 || resourceVariantSummary.local > 0 || resourceVariantSummary.inherited > 0) && (
                                        <p className="mt-2 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                            {resourceVariantSummary.inherited > 0 ? `${resourceVariantSummary.inherited} heredados` : '0 heredados'}
                                            {resourceVariantSummary.diverged > 0 ? ` · ${resourceVariantSummary.diverged} divergentes` : ''}
                                            {resourceVariantSummary.local > 0 ? ` · ${resourceVariantSummary.local} locales` : ''}
                                        </p>
                                    )}
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-xl">
                                        <button onClick={() => setShowImportModal(true)} className="px-3 py-2 hover:bg-zinc-50 rounded-lg text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2"><Copy className="w-3.5 h-3.5" /> Importar</button>
                                        <div className="w-px h-4 bg-zinc-200 mx-1" />
                                        <button onClick={handleExport} disabled={selectedRecursos.length === 0} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${selectedRecursos.length > 0 ? 'text-[#F39200] hover:bg-orange-50' : 'text-zinc-300 pointer-events-none'}`}><Copy className="w-3.5 h-3.5 rotate-180" /> Exportar ({selectedRecursos.length})</button>
                                        <div className="w-px h-4 bg-zinc-200 mx-1" />
                                        <button onClick={handleBulkDelete} disabled={selectedRecursos.length === 0} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${selectedRecursos.length > 0 ? 'text-red-500 hover:bg-red-50' : 'text-zinc-300 pointer-events-none'}`}><Trash2 className="w-3.5 h-3.5" /> Borrar ({selectedRecursos.length})</button>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-xl">
                                        <button onClick={toggleSelectAllVisible} disabled={visibleRecursoIds.length === 0} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${visibleRecursoIds.length > 0 ? 'text-zinc-600 hover:bg-zinc-50' : 'text-zinc-300 pointer-events-none'}`}><SoftSelectToggle as="span" checked={allVisibleSelected} label={allVisibleSelected ? 'Quitar visibles' : 'Seleccionar visibles'} size="md" tone="blue" muted={!someVisibleSelected && !allVisibleSelected} indicatorClassName={someVisibleSelected && !allVisibleSelected ? 'border-[#F39200] bg-[#F39200]/35 opacity-100' : ''} className="-my-1" /> {allVisibleSelected ? 'Quitar visibles' : 'Seleccionar visibles'}</button>
                                        <div className="w-px h-4 bg-zinc-200 mx-1" />
                                        <button onClick={clearSelection} disabled={selectedRecursos.length === 0} className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${selectedRecursos.length > 0 ? 'text-zinc-500 hover:bg-zinc-50' : 'text-zinc-300 pointer-events-none'}`}><X className="w-3.5 h-3.5" /> Limpiar</button>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-xl">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedRecursos([]);
                                                setCpcFilterMode((current) => current === 'without_cpc' ? 'all' : 'without_cpc');
                                            }}
                                            className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${cpcFilterMode === 'without_cpc' ? 'bg-orange-50 text-[#F39200] border border-orange-100 shadow-sm' : 'text-zinc-500 hover:bg-zinc-50'}`}
                                            title="Mostrar solo recursos sin Código CPC en el alcance activo"
                                        >
                                            <Filter className="w-3.5 h-3.5" />
                                            Sin CPC ({totalWithoutCpcCount})
                                        </button>
                                    </div>
                                    <div className="relative w-80">
                                        <ClearSearchField
                                            value={normalizeTextInputValue(searchTerm)}
                                            onValueChange={(value) => setSearchTerm(normalizeTextInputValue(value))}
                                            onFocus={ensureGlobalSearchIndex}
                                            placeholder="Buscar recurso en todo el maestro..."
                                            inputClassName="w-full pl-10 pr-10 h-10 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
                                        />
                                        {searchTerm.trim() && (
                                            <div className="absolute top-full left-0 right-0 mt-2 z-20 rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
                                                <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/70">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                                        {globalSearchLoading ? 'Buscando en maestro global...' : `${globalSearchResults.length} coincidencias globales`}
                                                    </p>
                                                </div>
                                                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                                    {globalSearchLoading ? (
                                                        <div className="px-4 py-6 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                                                            Cargando índice global...
                                                        </div>
                                                    ) : globalSearchResults.length === 0 ? (
                                                        <div className="px-4 py-6 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                                                            Sin coincidencias en el maestro
                                                        </div>
                                                    ) : (
                                                        globalSearchResults.map(recurso => {
                                                            const subcat = allSubcategoriasMap.get(recurso.subcategoria_item_id);
                                                            const categoryName = getCategoryNameForSubcatId(recurso.subcategoria_item_id);
                                                            return (
                                                                <button
                                                                    key={`global-search-${recurso.id}`}
                                                                    type="button"
                                                                    onClick={() => handleSelectGlobalResult(recurso)}
                                                                    title={`${renderResourceDescription(recurso.descripcion) || ''}${recurso.unidad?.descripcion ? ` | Und: ${renderUnitDescription(recurso.unidad.descripcion)}` : ''}`}
                                                                    className="w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors border-b border-zinc-100 last:border-b-0"
                                                                >
                                                                    <div className="flex items-center gap-2 mb-1">
                                                                        <CodeColorizer code={recurso.codigo} className="text-[8px] bg-white px-2 py-0.5 rounded border border-zinc-100" />
                                                                        <span className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                                            {categoryName} • {subcat?.descripcion || 'Subcategoría'}
                                                                        </span>
                                                                    </div>
                                                                    <p className="text-[11px] font-black uppercase tracking-tight text-zinc-800 line-clamp-2">
                                                                        {renderResourceDescription(recurso.descripcion)}
                                                                    </p>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <LiquidButton onClick={openCreate} className="h-10 px-6 rounded-xl"><Plus className="w-4 h-4 mr-2" /> Nuevo Recurso</LiquidButton>
                                </div>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto p-6 lg:p-10 pt-6 custom-scrollbar">
                                {loading ? (
                                    <div className="flex flex-col items-center justify-center py-20 gap-4"><div className="w-10 h-10 border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" /><p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Consultando Maestro...</p></div>
                                ) : visibleRecursos.length === 0 ? (
                                    <div className="text-center py-20 bg-white rounded-[2rem] border-2 border-dashed border-zinc-100"><Package className="w-16 h-16 text-zinc-100 mx-auto mb-4" /><h3 className="text-lg font-black uppercase text-zinc-400">Sin recursos</h3><p className="text-sm text-zinc-400 mb-8 font-medium">{cpcFilterMode === 'without_cpc' ? 'No hay recursos sin CPC en este alcance.' : selectedSubcatId ? 'Agregue recursos técnicos a esta subcategoría.' : 'No hay recursos en la categoría activa.'}</p><LiquidButton onClick={openCreate} className="mx-auto">Crear Primer Recurso</LiquidButton></div>
                                ) : (
                                    <div className="grid grid-cols-1 gap-2">
                                        {visibleRecursos.map(recurso => (
                                            <motion.div
                                                key={recurso.id}
                                                id={`recurso-${recurso.id}`}
                                                title={`${renderResourceDescription(recurso.descripcion) || ''}${recurso.unidad?.descripcion ? ` | Und: ${renderUnitDescription(recurso.unidad.descripcion)}` : ''}`}
                                                layout
                                                initial={{ opacity: 0, x: -10 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                draggable
                                                onDragStart={(e) => handleDragStart(e, recurso.id)}
                                                onDoubleClick={() => openEdit(recurso)}
                                                className={`group relative flex items-center gap-3 px-4 py-3 bg-white border border-zinc-100 rounded-xl hover:border-[#F39200]/30 transition-all cursor-pointer ${!recurso.revisado ? 'border-red-100 bg-red-50/10' : ''} ${selectedRecursos.includes(recurso.id) ? 'border-[#F39200] bg-orange-50/20 ring-1 ring-[#F39200]' : ''}`}
                                            >
                                                <div className="flex items-center gap-2">
                                                    <SoftSelectToggle
                                                        checked={selectedRecursos.includes(recurso.id)}
                                                        onChange={(e) => { e.stopPropagation(); toggleSelect(recurso.id); }}
                                                        label={selectedRecursos.includes(recurso.id) ? 'Quitar de la selección' : 'Seleccionar recurso'}
                                                        size="md"
                                                        tone="blue"
                                                        muted={!selectedRecursos.includes(recurso.id)}
                                                    />
                                                    <div className="cursor-grab active:cursor-grabbing p-1 text-zinc-300 group-hover:text-zinc-500"><GripVertical className="w-5 h-5" /></div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1"><CodeColorizer code={recurso.codigo} className="text-[9px] bg-white px-2 py-0.5 rounded border border-zinc-100" /><span className="text-[9px] font-black uppercase text-zinc-400">Unidad: {renderUnitDescription(recurso.unidad?.descripcion)}</span><span title={getResourceVariantBadge(recurso).title} className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border ${getResourceVariantBadge(recurso).className}`}>{getResourceVariantBadge(recurso).label}</span>{!recurso.revisado && <span className="flex items-center gap-1 text-[8px] font-black uppercase text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100"><AlertCircle className="w-3 h-3" /> Revisión pendiente</span>}</div>
                                                    <h4 className={`text-sm font-black tracking-tight leading-tight ${!recurso.revisado ? 'text-red-700' : 'text-zinc-800'}`}>{renderResourceDescription(recurso.descripcion)}</h4>
                                                    {recurso.cpc && <p className="text-[9px] font-bold text-[#F39200] mt-1 italic">CPC: {recurso.cpc.codCPC} - {recurso.cpc.descripcion}</p>}
                                                </div>
                                                <div className="text-right px-3 flex flex-col justify-center border-l border-zinc-100 min-w-[116px]">
                                                    <p className="text-[8px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Precio Base</p>
                                                    <p className="text-base font-black text-zinc-900 tracking-tighter leading-none">{formatMoneda(recurso.precio)}</p>
                                                </div>
                                                <div className={`flex items-center gap-1 transition-all ${selectedRecursos.length > 1 && selectedRecursos.includes(recurso.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                    {selectedRecursos.length > 1 && selectedRecursos.includes(recurso.id) && (
                                                        <button
                                                            type="button"
                                                            onClick={(event) => {
                                                                event.stopPropagation();
                                                                handleOpenBulkCpc();
                                                            }}
                                                            className="p-1.5 bg-orange-50 hover:bg-orange-100 rounded-lg text-[#F39200] shadow-sm border border-orange-100"
                                                            title={`Asignar CPC a ${selectedRecursos.length} recursos seleccionados`}
                                                        >
                                                            <Tags className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button onClick={() => handleDuplicate(recurso.id)} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-[#F39200]" title="Duplicar"><Copy className="w-4 h-4" /></button>
                                                    <button onClick={() => openEdit(recurso)} className="p-1.5 hover:bg-zinc-100 rounded-lg text-zinc-400 hover:text-[#F39200]" title="Editar"><Edit2 className="w-4 h-4" /></button>
                                                    <button onClick={() => handleDelete(recurso.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-zinc-400 hover:text-red-500" title="Borrar"><Trash2 className="w-4 h-4" /></button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    ) : null}
                </div>
            </div>

            <ResourceEditorModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={handleSave}
                editingRecurso={editingRecurso}
                form={form}
                setForm={setForm}
                unidades={unidades}
                onSpellCheck={handleSpellCheck}
                title={editingRecurso ? 'Modificar Recurso' : 'Nuevo Recurso'}
                subtitle={`${CATEGORIAS_BASE.find(c => c.id === selectedCat)?.nombre} • Maestro de Insumos`}
                submitLabel={editingRecurso ? 'Actualizar Ficha de Recurso' : 'Registrar Nuevo Recurso'}
                currentOmniClassTable={currentOmniClassTable}
                formatMonedaInput={formatMonedaInput}
                enableOmniClass={useOmniClass}
                currentCategoryId={selectedCat}
            />

            <AnimatePresence>
                {showBulkCpcModal && (
                    <AppModalShell
                        isOpen={showBulkCpcModal}
                        onClose={() => setShowBulkCpcModal(false)}
                        size="lg"
                        zIndex="z-[1000]"
                        panelClassName="max-h-[86vh] flex flex-col"
                    >
                        <AppModalHeader
                            title="Asignar CPC"
                            subtitle={`${selectedRecursos.length} recursos seleccionados`}
                            icon={Tags}
                            iconClassName="text-[#F39200]"
                            iconWrapClassName="border-orange-200 bg-orange-50"
                            onClose={() => setShowBulkCpcModal(false)}
                        />
                        <div className="flex-1 overflow-y-auto p-8 bg-[#F8FAFC] custom-scrollbar">
                            <div className="space-y-5">
                                <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200]">
                                        El CPC elegido se aplicará a todos los recursos seleccionados y reemplazará su CPC actual.
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">
                                        Buscar Código CPC
                                    </Label>
                                    <ClearSearchField
                                        value={bulkCpcSearchTerm}
                                        onValueChange={(value) => setBulkCpcSearchTerm(normalizeTextInputValue(value))}
                                        placeholder="Buscar por código o descripción..."
                                        inputClassName="w-full h-14 pl-12 pr-10 bg-white border border-zinc-200 rounded-2xl text-sm font-bold focus:border-[#F39200] focus:ring-1 focus:ring-[#F39200]"
                                    />
                                </div>
                                <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
                                    <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/70 flex items-center justify-between">
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                            {bulkCpcSearching ? 'Buscando CPC...' : `${bulkCpcResults.length} coincidencias`}
                                        </p>
                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                            Selección: {selectedRecursos.length}
                                        </p>
                                    </div>
                                    <div className="max-h-80 overflow-y-auto custom-scrollbar">
                                        {bulkCpcSearching ? (
                                            <div className="px-4 py-8 text-center text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                Consultando catálogo CPC...
                                            </div>
                                        ) : bulkCpcResults.length === 0 ? (
                                            <div className="px-4 py-8 text-center text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                Sin coincidencias
                                            </div>
                                        ) : (
                                            bulkCpcResults.map((cpc) => (
                                                <button
                                                    key={`bulk-cpc-${cpc.id}`}
                                                    type="button"
                                                    disabled={bulkCpcSaving}
                                                    onClick={() => handleBulkAssignCpc(cpc)}
                                                    className="w-full px-5 py-4 text-left hover:bg-orange-50 transition-colors border-b border-zinc-100 last:border-b-0 disabled:opacity-50"
                                                >
                                                    <span className="block text-[10px] font-black text-[#F39200] tracking-wider">{cpc.codCPC}</span>
                                                    <span className="block text-xs font-bold text-zinc-800 line-clamp-2 leading-tight">
                                                        {descriptionCapitalization.normalizeDescriptionCapitalization(cpc.descripcion)}
                                                    </span>
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </AppModalShell>
                )}
            </AnimatePresence>

            {/* Modal de Importación */}
            <AnimatePresence>
                {showImportModal && (
                    <AppModalShell
                        isOpen={showImportModal}
                        onClose={() => setShowImportModal(false)}
                        size="xl"
                        zIndex="z-[1000]"
                        panelClassName="max-h-[90vh] flex flex-col"
                    >
                        <AppModalHeader
                            title="Importación Masiva de Recursos"
                            subtitle="Reconocimiento previo desde Excel o portapapeles"
                            icon={Copy}
                            iconClassName="text-[#F39200]"
                            iconWrapClassName="border-orange-200 bg-orange-50"
                            onClose={() => setShowImportModal(false)}
                        />
                        <AppModalBody className="flex-1 overflow-y-auto p-5 md:p-6 bg-[#F8FAFC] custom-scrollbar">
                            <div className="space-y-4">
                                <ImportFormatHint
                                    tone="blue"
                                    format="Descripción • Precio • Unidad • CPC • Especificaciones • OmniClass código • OmniClass título"
                                    hint={`Los recursos se crearán en la subcategoría "${renderSubcategoryDescription(subcategorias.find((item) => item.id === selectedSubcatId)?.descripcion || 'Sin subcategoría')}". Si no hay tabulación limpia, se intentará reconocer descripción, precio, unidad y CPC al final de la línea. OmniClass debe venir al final.`}
                                />

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-2">Descripción + precio + unidad + cpc + especificaciones + omniclass (TAB) *</Label>
                                    <textarea
                                        value={importText}
                                        onChange={e => setImportText(e.target.value)}
                                        className="w-full h-48 p-5 bg-zinc-50 border border-zinc-200 rounded-2xl text-sm font-medium focus:outline-none focus:border-[#F39200] focus:ring-1 focus:ring-[#F39200] transition-all"
                                        placeholder={"Ejemplo:\nCemento Portland\t34.50\tkg\t37440\tUso general\t23-11 13 13\tCEMENT\nArena gruesa lavada\t18.20\tm3\t\tAgregado fino seleccionado\t23-11 13 13\tAGREGADOS\nHerramienta menor mano de obra\t5.00\t%\t\tCosto indirecto"}
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
                                                    <p className="text-sm font-black text-emerald-700">{validImportRows.length}</p>
                                                </div>
                                                <div className="bg-white border border-red-200 rounded-xl px-3 py-2">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-red-500">Omitidas</p>
                                                    <p className="text-sm font-black text-red-600">{invalidImportRows.length}</p>
                                                </div>
                                                <div className="bg-white border border-amber-200 rounded-xl px-3 py-2">
                                                    <p className="text-[8px] font-black uppercase tracking-widest text-amber-600">Duplicadas</p>
                                                    <p className="text-sm font-black text-amber-700">{duplicateImportRows.length}</p>
                                                </div>
                                            </div>
                                            <div className="mt-3 rounded-xl border border-blue-100 bg-blue-50 px-3 py-2">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-blue-700">
                                                    Unidades válidas: {validUnitNames.join(', ') || 'Sin unidades cargadas'}
                                                </p>
                                            </div>
                                            <div className="mt-3 rounded-xl border border-zinc-200 bg-white px-3 py-2">
                                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-500">
                                                    Destino: {renderSubcategoryDescription(subcategorias.find((item) => item.id === selectedSubcatId)?.descripcion || 'Sin subcategoría')}
                                                </p>
                                            </div>
                                        </div>

                                        {importResolutionLoading && (
                                            <div className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-[#136191]">
                                                    Resolviendo referencias de CPC y OmniClass...
                                                </p>
                                            </div>
                                        )}

                                        <div className="max-h-56 overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50">
                                            <table className="w-full text-left">
                                                <thead className="bg-white sticky top-0 border-b border-zinc-200">
                                                    <tr>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Fila</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Descripción</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Precio</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Unidad</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">CPC</th>
                                                        {useOmniClass && (
                                                            <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400 italic">OmniClass</th>
                                                        )}
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Estado</th>
                                                        <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Motivo</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {importPreview.map((item) => {
                                                        const cpcResolution = item.parsed?.cod_cpc_codigo
                                                            ? cpcResolutionMap[cleanClipboardCell(item.parsed.cod_cpc_codigo)]
                                                            : null;
                                                        const omniKey = `${cleanClipboardCell(item.parsed?.omniclass_codigo)}|${normalizeClipboardText(item.parsed?.omniclass_titulo || '')}`;
                                                        const omniResolution = (item.parsed?.omniclass_codigo || item.parsed?.omniclass_titulo)
                                                            ? omniResolutionMap[omniKey]
                                                            : null;

                                                        return (
                                                            <tr key={`resource-import-row-${item.row}`} className="border-b border-zinc-100 last:border-b-0 align-top">
                                                                <td className="px-4 py-2.5 text-[10px] font-black text-zinc-400">{item.row}</td>
                                                                <td className="px-4 py-2.5 text-[12px] font-bold text-zinc-700 leading-snug">{item.parsed?.descripcion || item.raw}</td>
                                                                <td className="px-4 py-2.5 text-[11px] text-zinc-500">{item.parsed ? formatMoneda(item.parsed.precio || 0) : '-'}</td>
                                                                <td className="px-4 py-2.5 text-[11px] text-zinc-500">{item.parsed?.unidad_nombre || '-'}</td>
                                                                <td className="px-4 py-2.5">
                                                                    {item.parsed?.cod_cpc_codigo ? (
                                                                        <div className="flex flex-col">
                                                                            <span className="text-[9px] font-black text-[#F39200]">{cpcResolution?.codCPC || item.parsed.cod_cpc_codigo}</span>
                                                                            <span className="text-[8px] font-bold text-zinc-400 uppercase truncate max-w-[140px]">{cpcResolution?.descripcion || 'No detectado'}</span>
                                                                        </div>
                                                                    ) : (
                                                                        <span className="text-[9px] text-zinc-300 italic">No detectado</span>
                                                                    )}
                                                                </td>
                                                                {useOmniClass && (
                                                                    <td className="px-4 py-2.5">
                                                                        {(item.parsed?.omniclass_codigo || item.parsed?.omniclass_titulo) ? (
                                                                            <div className="flex flex-col">
                                                                                <span className="text-[9px] font-black text-[#F39200]">{omniResolution?.codigo || item.parsed?.omniclass_codigo || '-'}</span>
                                                                                <span className="text-[8px] font-bold text-zinc-400 uppercase truncate max-w-[140px]">{omniResolution?.titulo_resuelto || item.parsed?.omniclass_titulo || 'No detectado'}</span>
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
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </AppModalBody>
                        <AppModalFooter variant="flat" className="border-t border-zinc-200 bg-white px-5 py-4 md:px-6">
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowImportModal(false)}
                                    title="Cancelar"
                                    aria-label="Cancelar"
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                                <button
                                    onClick={handleImport}
                                    disabled={validImportRows.length === 0}
                                    title={`Confirmar ${validImportRows.length} registros`}
                                    aria-label={`Confirmar ${validImportRows.length} registros`}
                                    className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#F39200] text-white transition hover:bg-[#d97f00] disabled:bg-zinc-200 disabled:text-zinc-400"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </AppModalFooter>
                    </AppModalShell>
                )}
            </AnimatePresence>

            <BulkDeleteConfirmModal
                isOpen={showBulkDeleteModal}
                onClose={() => { setShowBulkDeleteModal(false); setBulkDeleteStep(1); }}
                onConfirm={handleBulkDeleteConfirm}
                step={bulkDeleteStep}
                setStep={setBulkDeleteStep}
                loading={bulkDeleting}
                title="¿Borrar recursos seleccionados?"
                count={selectedRecursos.length}
                summary="Se intentará eliminar toda la selección."
                previewItems={recursos.filter(recurso => selectedRecursos.includes(recurso.id))}
                finalWarning="¿Estás absolutamente seguro?"
            />
        </div>
    );
};

export default Recursos;
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
