import React, { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import apusApi from '../../api/apus';
import recursosApi from '../../api/recursos';
import subcategoriasItemsApi from '../../api/subcategoriasItems';
import { AuthContext } from '../../context/AuthContext';
import { usePresupuestoData } from '../../context/PresupuestoContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Trash2, AlertCircle, Check, ArrowLeft, Layers, FolderOpen,
    Calculator, X, Save, Search, ChevronRight, Edit2,
    PlusCircle, LayoutGrid, GripVertical, PanelLeftClose, PanelLeftOpen, Plus
} from 'lucide-react';
import { useFormatters } from '../../hooks/useFormatters';
import { appAlert, appConfirm } from '../../utils/appDialog';
import {
    resolveApuLineOperationalSubtotal,
    resolveApuLineOperationalUnitPrice,
} from '../../utils/operationalNumbers';
import {
    divideDecimalNumber,
    roundDecimalNumber,
    sumDecimalNumber,
} from '../../utils/decimalNumbers';
import CodeColorizer from '../../utils/codeColorizer';
import SearchableSelect from '../ui/searchable-select';
import { getOmniClassTableForResourceCategory } from '../../utils/omniclass';
import ResourceEditorModal from '../precios-unitarios/ResourceEditorModal';
import { buildNestedApuEditConfirmConfig } from '../../utils/nestedApuEditing';
import ClearSearchField from '../ui/ClearSearchField';
import { normalizeDescriptionCapitalization } from '../../utils/descriptionCapitalization';
import { findMatchingUnit, resolveApuLineUnitDescription, resolveUnitDescription } from '../../utils/unitOptions';
import { dispatchBudgetProductivityUpdated } from '../../utils/cronogramaSyncEvents';
import AnimatedSelect from '../ui/AnimatedSelect';
import { APP_MODAL_CLOSE_BUTTON_CLASS } from '../ui/app-modal';

const MotionDiv = motion.div;

// --- Constantes de Categorías ---
const CATEGORIAS_BASE = [
    { id: 1, nombre: 'Equipos y Herramientas', icon: '🔧', color: 'text-blue-600' },
    { id: 2, nombre: 'Materiales', icon: '📦', color: 'text-green-600' },
    { id: 3, nombre: 'Transporte', icon: '🚚', color: 'text-yellow-600' },
    { id: 4, nombre: 'Mano de Obra', icon: '👥', color: 'text-purple-600' },
    { id: 5, nombre: 'Análisis de Precios Unitarios', icon: '📑', color: 'text-orange-600' },
];

const parseCategoryFromCode = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const match = raw.match(/^(\d+)/);
    const candidate = match ? Number(match[1]) : Number(raw);
    return Number.isFinite(candidate) && candidate >= 1 && candidate <= 5 ? candidate : null;
};

const renderUnidad = (u) => {
    if (!u) return '-';
    if (typeof u === 'object') return u.descripcion || u.nombre || u;
    return u;
};

const getSyncBadge = (item) => {
    if (item?.sync_status === 'diverged') {
        return {
            label: 'Divergente',
            className: 'bg-red-50 text-red-600 border-red-200',
            tone: 'text-red-600',
            message: 'Este APU heredado ya difiere de la base maestra.',
        };
    }
    if (item?.content_origin === 'local') {
        return {
            label: 'Local',
            className: 'bg-violet-50 text-violet-600 border-violet-200',
            tone: 'text-violet-600',
            message: 'Este APU existe solo en la base de proyecto.',
        };
    }
    if (item?.content_origin === 'inherited') {
        return {
            label: 'Heredado',
            className: 'bg-emerald-50 text-emerald-600 border-emerald-200',
            tone: 'text-emerald-600',
            message: 'Este APU sigue alineado con la base maestra.',
        };
    }
    return {
        label: 'Nativo',
        className: 'bg-slate-50 text-slate-500 border-slate-200',
        tone: 'text-slate-500',
        message: 'Este APU pertenece a una base nativa.',
    };
};

const ApuBudgetEditor = ({
    apuId,
    projectBaseId,
    projectRevision,
    onClose,
    onSaveSuccess,
    canGoBack = false,
    onGoBack = null,
    onOpenNestedApu = null,
    nestedContext = null,
    onDirtyChange = null,
}) => {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const { activePresupuesto } = usePresupuestoData();
    const useOmniClass = selectedEmpresa?.use_omniclass !== false;

    // -- State --
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formApu, setFormApu] = useState(null);
    const [recursos, setRecursos] = useState([]);
    const [subcategorias, setSubcategorias] = useState([]); 
    const [unidades, setUnidades] = useState([]);
    const [searchLeft, setSearchLeft] = useState('');
    const [expandedCats, setExpandedCats] = useState([1, 2, 3, 4, 5]);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const isSidebarHoverExpanded = false;
    const [toast, setToast] = useState(null);
    const [showResourceModal, setShowResourceModal] = useState(false);
    const [editingRecurso, setEditingRecurso] = useState(null);
    const [resourceUnidades, setResourceUnidades] = useState([]);
    const [resourceForm, setResourceForm] = useState({
        descripcion: '',
        precio: '',
        unidad_id: '',
        cod_cpc_id: null,
        cpc_display: '',
        especificaciones: '',
        equipment_ownership_kind: '',
        governing_resource_kind: '',
        omniclass_codigo: '',
        omniclass_titulo: '',
    });
    const [initialSnapshot, setInitialSnapshot] = useState(null);

    const formatters = useFormatters();
    const formatNumericDisplayFromHook = formatters?.formatNumericDisplay;
    const parseNumericInputFromHook = formatters?.parseNumericInput;
    const formatNumericDisplay = useCallback((v, decimals) => (
        formatNumericDisplayFromHook
            ? formatNumericDisplayFromHook(v, decimals)
            : String(v || '').replace('.', ',')
    ), [formatNumericDisplayFromHook]);
    const parseNumericInput = useCallback((v) => (
        parseNumericInputFromHook
            ? parseNumericInputFromHook(v)
            : String(v || '').replace(',', '.')
    ), [parseNumericInputFromHook]);
    const formatMoneda = formatters?.formatMoneda || ((v) => roundDecimalNumber(v || 0, 2).toFixed(2));
    const formatMonedaInput = formatters?.formatMonedaInput || ((v) => formatMoneda(v || 0));
    const precisionMoneda = formatters?.monedaPrecision ?? 2;
    const precisionCalculo = formatters?.precisionCalculo ?? 4;
    const formatCalculo = formatters?.formatCalculo || ((v) => formatNumericDisplay(v, precisionCalculo));

    const isSidebarVisuallyCollapsed = isSidebarCollapsed && !isSidebarHoverExpanded;
    const subcategoriesById = useMemo(() => {
        const map = new Map();
        (subcategorias || []).forEach((sub) => {
            map.set(Number(sub.id), sub);
        });
        return map;
    }, [subcategorias]);

    const resolveItemCategoryId = useCallback((item, isApu = false, options = {}) => {
        const { asEditorLine = false } = options;
        if (isApu || item?.isApu || item?.apu_hijo_id) {
            return asEditorLine ? 2 : 5;
        }

        const directCategory = Number(item?.categoria_id || item?.recurso?.categoria_id || 0);
        if (Number.isFinite(directCategory) && directCategory >= 1 && directCategory <= 5) {
            return directCategory;
        }

        const subcategoryCode =
            item?.subcategoria_codigo ||
            item?.recurso?.subcategoria_codigo ||
            item?.subcategoria_item?.subcategoria_codigo ||
            subcategoriesById.get(Number(item?.subcategoria_item_id || item?.recurso?.subcategoria_item_id || 0))?.subcategoria_codigo ||
            item?.codigo;

        return parseCategoryFromCode(subcategoryCode) || 1;
    }, [subcategoriesById]);

    const resolveItemSubcategoryMeta = useCallback((item) => {
        const subcategoryId = Number(
            item?.subcategoria_item_id ||
            item?.recurso?.subcategoria_item_id ||
            item?.subcategoria_item?.id ||
            0
        ) || null;

        const catalogSubcategory = subcategoryId ? subcategoriesById.get(subcategoryId) : null;
        return {
            subcategoria_item_id: subcategoryId,
            subcategoria_codigo:
                item?.subcategoria_codigo ||
                item?.recurso?.subcategoria_codigo ||
                item?.subcategoria_item?.codigo ||
                catalogSubcategory?.codigo ||
                '',
            subcategoria_descripcion:
                item?.subcategoria_descripcion ||
                item?.recurso?.subcategoria_descripcion ||
                item?.subcategoria_item?.descripcion ||
                catalogSubcategory?.descripcion ||
                'General',
        };
    }, [subcategoriesById]);

    const serializeEditorState = (apuForm) => {
        if (!apuForm) return null;
        return JSON.stringify({
            descripcion: apuForm.descripcion || '',
            unidad_id: Number(apuForm.unidad_id || 0),
            subcategoria_item_id: Number(apuForm.subcategoria_item_id || 0),
            estado_revision: apuForm.estado_revision || '',
            omniclass_codigo: apuForm.omniclass_codigo || '',
            omniclass_titulo: apuForm.omniclass_titulo || '',
            lineas: (apuForm.lineas || []).map((l, index) => ({
                recurso_id: l.recurso_id || null,
                apu_hijo_id: l.apu_hijo_id || null,
                cantidad: String(l.cantidad_num ?? l.cantidad ?? ''),
                rendimiento: String(l.rendimiento_num ?? l.rendimiento ?? ''),
                orden: Number(l.orden ?? index),
            })),
        });
    };

    // -- Effects --
    useEffect(() => {
        fetchInitialData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [apuId, projectBaseId, projectRevision, activePresupuesto?.proyecto_id]);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const fetchInitialData = async () => {
        if (!apuId || !projectBaseId) {
            globalThis.reportClientError?.("Missing IDs for APU Budget Editor:", { apuId, projectBaseId });
            appAlert(`Error de contexto: IDs faltantes (APU: ${apuId}, Base: ${projectBaseId})`);
            onClose();
            return;
        }

        try {
            setLoading(true);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            
            // 1. Fetch APU Detail
            const apuContextParams = {
                ...(activePresupuesto?.proyecto_id ? { proyecto_id: activePresupuesto.proyecto_id } : {}),
                ...(projectRevision !== undefined ? { revision: projectRevision } : {}),
            };
            const apuRes = await apusApi.getById(apuId, empId, apuContextParams);
            const fullApu = apuRes.data;
            // 2. Fetch Resources for the project base
            let recRes = await recursosApi.getAll(projectBaseId, null, empId, projectRevision);
            if ((!recRes.data || recRes.data.length === 0) && projectRevision !== null) {
                // FALLBACK: Si no hay nada en la revisión actual, intentar obtener del maestro (null)
                recRes = await recursosApi.getAll(projectBaseId, null, empId, null);
            }
            const allRecsRaw = recRes.data || [];

            // 2a. Fetch APUs for Sidebar (Category 5)
            let sideApusRes = await apusApi.getAll({
                base_trabajo_id: projectBaseId,
                empresa_id: empId,
                revision: projectRevision,
                ...(activePresupuesto?.proyecto_id ? { proyecto_id: activePresupuesto.proyecto_id } : {})
            }, { summary: true });
            if ((!sideApusRes.data || sideApusRes.data.length === 0) && projectRevision !== null) {
                sideApusRes = await apusApi.getAll({
                    base_trabajo_id: projectBaseId,
                    empresa_id: empId,
                    revision: null,
                    ...(activePresupuesto?.proyecto_id ? { proyecto_id: activePresupuesto.proyecto_id } : {})
                }, { summary: true });
            }
            const sideApus = (sideApusRes.data || []).map(a => ({ ...a, isApu: true, categoria_id: 5 }));

            // 2b. Fetch Subcategories for Sidebar
            let subRes = await subcategoriasItemsApi.getAll(projectBaseId, null, empId, projectRevision);
            if ((!subRes.data || subRes.data.length === 0) && projectRevision !== null) {
                 subRes = await subcategoriasItemsApi.getAll(projectBaseId, null, empId, null);
            }
            setSubcategorias(subRes.data || []);

            // Combinar recursos y APUs para el árbol lateral
            const allRecs = [...allRecsRaw, ...sideApus];

            // 3. Fetch Units for the project base
            // IMPORTANTE: subcategoria_codigo es requerido (5 = APUs)
            const unitRes = await recursosApi.getUnidades(fullApu.subcategoria_item?.subcategoria_codigo || 5, projectBaseId, empId);
            setUnidades(unitRes.data || []);

            // 4. Transform APU lines for editor
            const mappedLineas = (fullApu.lineas || []).map((l, idx) => {
                const isApu = !!l.apu_hijo_id;
                const item = l.apu_hijo || l.recurso;
                const resolvedCategoryId = resolveItemCategoryId(item, isApu, { asEditorLine: true });
                const subcategoryMeta = resolveItemSubcategoryMeta(item);
                
                return {
                    ...l,
                    unique_key: `line-${l.id || idx}-${Date.now()}`,
                    descripcion: item?.descripcion || (isApu ? 'APU hijo desconocido' : 'Recurso desconocido'),
                    codigo: item?.codigo || '???',
                    unidad: item?.unidad || '-',
                    precio: isApu
                        ? (item?.costo_directo ?? item?.precio_unitario_total ?? 0)
                        : (item?.precio || 0),
                    categoria_id: resolvedCategoryId,
                    ...subcategoryMeta,
                    cantidad: formatCalculo(l.cantidad),
                    rendimiento: l.rendimiento !== undefined ? formatCalculo(l.rendimiento) : formatCalculo(1),
                    cantidad_num: l.cantidad,
                    rendimiento_num: l.rendimiento !== undefined ? l.rendimiento : 1,
                    item_obj: item
                };
            });

            // 5. Mapear unidad string a unidad_id para el selector
            const unitStr = (fullApu.unidad || '').toLowerCase().trim();
            const matchedUnit = findMatchingUnit(unitRes.data || [], unitStr);

            setFormApu({
                ...fullApu,
                unidad_id: matchedUnit?.id || fullApu.unidad_id,
                lineas: mappedLineas
            });
            setInitialSnapshot(serializeEditorState({
                ...fullApu,
                unidad_id: matchedUnit?.id || fullApu.unidad_id,
                lineas: mappedLineas,
            }));
            setRecursos(allRecs);

        } catch (error) {
            globalThis.reportClientError?.("Error loading APU for budget:", error);
            const detail = error.response?.data?.detail || error.message;
            const detailStr = typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail;
            appAlert(`Error al cargar el APU: ${detailStr}`);
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const isDirty = useMemo(() => {
        if (!formApu || initialSnapshot === null) return false;
        return serializeEditorState(formApu) !== initialSnapshot;
    }, [formApu, initialSnapshot]);

    useEffect(() => {
        if (typeof onDirtyChange === 'function') {
            onDirtyChange(isDirty);
        }
    }, [isDirty, onDirtyChange]);

    const indirectoProyectoPct = useMemo(() => {
        const presupuestoPct = Number(activePresupuesto?.indirectos_porcentaje);
        if (Number.isFinite(presupuestoPct)) return presupuestoPct;
        const formPct = Number(formApu?.porcentaje_indirectos);
        return Number.isFinite(formPct) ? formPct : 0;
    }, [activePresupuesto?.indirectos_porcentaje, formApu?.porcentaje_indirectos]);

    const indirectoContextLabel = useMemo(() => {
        const presupuestoCodigo = activePresupuesto?.codigo || null;
        const revision = activePresupuesto?.revision;
        const revisionLabel = Number.isFinite(Number(revision))
            ? `Rev ${String(Number(revision)).padStart(3, '0')}`
            : null;
        const parts = [presupuestoCodigo, revisionLabel].filter(Boolean);
        return parts.length > 0 ? parts.join(' · ') : 'Proyecto activo';
    }, [activePresupuesto?.codigo, activePresupuesto?.revision]);

    const resolveFunctionalPrice = useCallback((linea) => {
        const item = linea?.item_obj || linea?.recurso || linea?.apu_hijo;
        const rawPrice = linea?.precio !== undefined && linea?.precio !== null && linea?.precio !== ''
            ? linea.precio
            : linea?.precio_congelado ?? (
                linea?.apu_hijo_id
                    ? (item?.costo_directo ?? item?.precio_unitario_total ?? 0)
                    : (item?.precio ?? item?.precio_unitario_total ?? 0)
            );
        return resolveApuLineOperationalUnitPrice(
            { ...linea, precio: rawPrice, item_obj: item },
            { moneyDecimals: precisionMoneda }
        );
    }, [precisionMoneda]);

    const calculateLinePartial = useCallback((linea) => {
        const precio = resolveFunctionalPrice(linea);
        return resolveApuLineOperationalSubtotal(
            {
                ...linea,
                precio,
                cantidad_num: linea?.cantidad_num ?? parseNumericInput(linea?.cantidad || 0),
                rendimiento_num: linea?.rendimiento_num ?? parseNumericInput(linea?.rendimiento || 1),
            },
            {
                moneyDecimals: precisionMoneda,
                preferPersistedSubtotal: false,
            }
        );
    }, [parseNumericInput, precisionMoneda, resolveFunctionalPrice]);

    // -- Calculations --
    const calculos = useMemo(() => {
        if (!formApu) return { directo: 0, indirecto: 0, totalConIndirectos: 0, indirectoPct: 0 };

        const directo = sumDecimalNumber(
            formApu.lineas.map((l) => calculateLinePartial(l)),
            { decimals: precisionMoneda }
        );

        const indirectoPct = indirectoProyectoPct;
        const indirecto = roundDecimalNumber(
            directo * divideDecimalNumber(indirectoPct, 100, { decimals: 6 }),
            precisionMoneda
        );
        
        return {
            directo,
            indirecto,
            totalConIndirectos: sumDecimalNumber([directo, indirecto], { decimals: precisionMoneda }),
            indirectoPct
        };
    }, [formApu, precisionMoneda, indirectoProyectoPct, calculateLinePartial]);

    // -- Handlers --
    const addLinea = (item, isApu, catIdFallback) => {
        const itemCatId = resolveItemCategoryId(item, isApu, { asEditorLine: true }) || catIdFallback;
        const subcategoryMeta = resolveItemSubcategoryMeta(item);
        const newLine = {
            unique_key: `new-${Date.now()}-${Math.random()}`,
            recurso_id: !isApu ? item.id : null,
            apu_hijo_id: isApu ? item.id : null,
            descripcion: item.descripcion,
            codigo: item.codigo,
            unidad: item.unidad,
            precio: isApu
                ? (item.costo_directo ?? item.precio_unitario_total ?? 0)
                : (item.precio || item.precio_unitario_total || 0),
            categoria_id: itemCatId,
            ...subcategoryMeta,
            cantidad: formatCalculo(1),
            rendimiento: (itemCatId === 1 || itemCatId === 4) ? formatCalculo(1) : undefined,
            cantidad_num: '1.00',
            rendimiento_num: '1.00',
            item_obj: item
        };

        setFormApu(prev => ({
            ...prev,
            lineas: [...prev.lineas, newLine]
        }));
    };

    const removeLinea = (uniqueKey) => {
        setFormApu(prev => ({
            ...prev,
            lineas: prev.lineas.filter(l => l.unique_key !== uniqueKey)
        }));
    };

    const updateLinea = (uniqueKey, field, value) => {
        setFormApu(prev => ({
            ...prev,
            lineas: prev.lineas.map(l => {
                if (l.unique_key === uniqueKey) {
                    const next = { ...l, [field]: value };
                    if (field === 'cantidad' || field === 'rendimiento') {
                        const normalized = parseNumericInput(value);
                        if (field === 'cantidad') next.cantidad_num = normalized;
                        if (field === 'rendimiento') next.rendimiento_num = normalized;
                    }
                    return next;
                }
                return l;
            })
        }));
    };

    const buildApuPayload = () => {
        if (!formApu.descripcion.trim()) {
            appAlert("La descripción es obligatoria.");
            return null;
        }

        const lineasLimpias = formApu.lineas.map((l, index) => ({
            recurso_id: l.recurso_id,
            apu_hijo_id: l.apu_hijo_id,
            cantidad: l.cantidad_num,
            rendimiento: l.rendimiento_num,
            orden: index
        }));

        return {
            codigo: formApu.codigo,
            descripcion: formApu.descripcion,
            unidad: resolveUnitDescription(unidades, formApu.unidad_id, formApu.unidad || '').toUpperCase(),
            subcategoria_item_id: formApu.subcategoria_item_id,
            base_trabajo_id: projectBaseId,
            estado_revision: formApu.estado_revision,
            omniclass_codigo: formApu.omniclass_codigo,
            omniclass_titulo: formApu.omniclass_titulo,
            lineas: lineasLimpias
        };
    };

    const persistCurrentApu = async ({ closeAfterSave = true, successMessage = "APU actualizado con éxito" } = {}) => {
        const payload = buildApuPayload();
        if (!payload) return false;

        try {
            setSaving(true);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await apusApi.update(apuId, payload, empId);

            if (successMessage) {
                showToast(successMessage);
            }
            dispatchBudgetProductivityUpdated({
                presupuestoId: activePresupuesto?.id,
                apuId,
                source: 'budget_apu_editor',
            });
            if (onSaveSuccess) onSaveSuccess();
            if (closeAfterSave) {
                onClose?.({ skipDirtyCheck: true });
            } else {
                setInitialSnapshot(serializeEditorState(formApu));
            }
            return true;
        } catch (error) {
            globalThis.reportClientError?.("Error saving APU from budget:", error);
            const detail = error.response?.data?.detail || error.message;
            const detailStr = typeof detail === 'object' ? JSON.stringify(detail, null, 2) : detail;
            appAlert(`Error al guardar el APU: ${detailStr}`);
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleSaveApu = async () => {
        await persistCurrentApu();
    };

    // Helper to group resources for the left tree
    const extractItemsByCat = (catId) => {
        const filtered = recursos.filter(r => {
            const matchesSearch = includesNormalized(r.descripcion, searchLeft) || includesNormalized(r.codigo, searchLeft);
            return resolveItemCategoryId(r, !!r.isApu) === catId && matchesSearch;
        });

        const groups = [];
        const subcatMap = new Map();

        (subcategorias || [])
            .filter((sub) => parseCategoryFromCode(sub.subcategoria_codigo || sub.codigo) === catId)
            .sort((a, b) => String(a.codigo || '').localeCompare(String(b.codigo || '')))
            .forEach((sub) => {
                const bucket = {
                    subcat: {
                        id: sub.id,
                        descripcion: sub.descripcion,
                        codigo: sub.codigo || sub.subcategoria_codigo || '',
                    },
                    items: [],
                };
                subcatMap.set(Number(sub.id), bucket);
                groups.push(bucket);
            });

        filtered.forEach(item => {
            const subMeta = resolveItemSubcategoryMeta(item);
            const subId = Number(subMeta.subcategoria_item_id || 0) || 'none';
            if (!subcatMap.has(subId)) {
                subcatMap.set(subId, { 
                    subcat: { id: subId, descripcion: subMeta.subcategoria_descripcion || 'Otros', codigo: subMeta.subcategoria_codigo || '' }, 
                    items: [] 
                });
                groups.push(subcatMap.get(subId));
            }
            subcatMap.get(subId).items.push(item);
        });

        return {
            totalItems: filtered.length,
            grupos: groups.filter((group) => group.items.length > 0),
        };
    };

    const includesNormalized = (text, search) => {
        if (!search) return true;
        return (text || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(search.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
    };

    const loadResourceUnitsForCategory = async (resourceCategory) => {
        if (!resourceCategory) {
            setResourceUnidades([]);
            return [];
        }
        const empId = selectedEmpresa?.id || user?.empresa_id;
        const res = await recursosApi.getUnidades(resourceCategory, projectBaseId, empId);
        const nextUnits = res.data || [];
        setResourceUnidades(nextUnits);
        return nextUnits;
    };

    const openEditResource = async (item) => {
        if (!item?.id) return;

        setEditingRecurso(item);
        const rawPrice = item.recurso?.precio || item.precio || item.costo_directo || item.precio_unitario_total || 0;
        const resourceCategory = item.recurso?.subcategoria_codigo || item.subcategoria_codigo || item.categoria_id;
        const nextUnits = await loadResourceUnitsForCategory(resourceCategory);

        setResourceForm({
            descripcion: item.recurso?.descripcion || item.descripcion || '',
            precio: formatMonedaInput(rawPrice),
            unidad_id: item.recurso?.unidad_id || item.unidad_id || '',
            cod_cpc_id: item.recurso?.cod_cpc_id || item.cod_cpc_id || null,
            cpc_display: item.recurso?.cpc ? `${item.recurso.cpc.codCPC} - ${item.recurso.cpc.descripcion.substring(0, 30)}...`
                : item.cpc ? `${item.cpc.codCPC} - ${item.cpc.descripcion.substring(0, 30)}...`
                    : '',
            especificaciones: item.recurso?.especificaciones || item.especificaciones || '',
            equipment_ownership_kind: item.recurso?.equipment_ownership_kind || item.equipment_ownership_kind || '',
            governing_resource_kind: item.recurso?.governing_resource_kind || item.governing_resource_kind || '',
            omniclass_codigo: item.recurso?.omniclass_codigo || item.omniclass_codigo || '',
            omniclass_titulo: item.recurso?.omniclass_titulo || item.omniclass_titulo || '',
        });
        setResourceUnidades(nextUnits);
        setShowResourceModal(true);
    };

    const handleSaveResource = async (e) => {
        e.preventDefault();
        if (!editingRecurso?.id) return;

        try {
            const data = { ...resourceForm };
            data.precio = parseFloat(parseNumericInput(data.precio)) || 0;
            delete data.cpc_display;
            if (!data.equipment_ownership_kind) {
                data.equipment_ownership_kind = '';
            }
            if (!data.governing_resource_kind) {
                data.governing_resource_kind = '';
            }
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const selectedUnit = findMatchingUnit(resourceUnidades, data.unidad_id);

            await recursosApi.update(editingRecurso.id, data, empId);

            setFormApu((prev) => ({
                ...prev,
                lineas: prev.lineas.map((l) => {
                    if (l.recurso_id !== editingRecurso.id) return l;

                    const nextItemObj = {
                        ...l.item_obj,
                        ...data,
                        descripcion: data.descripcion?.toUpperCase?.() || data.descripcion,
                        unidad_id: data.unidad_id,
                        unidad: selectedUnit ? { ...selectedUnit } : l.item_obj?.unidad,
                        recurso: l.item_obj?.recurso
                            ? {
                                ...l.item_obj.recurso,
                                ...data,
                                descripcion: data.descripcion?.toUpperCase?.() || data.descripcion,
                                unidad_id: data.unidad_id,
                                unidad: selectedUnit ? { ...selectedUnit } : l.item_obj.recurso.unidad,
                            }
                            : undefined,
                    };

                    return {
                        ...l,
                        precio: Number(parseNumericInput(data.precio)) || 0,
                        categoria_id: resolveItemCategoryId(nextItemObj, false),
                        ...resolveItemSubcategoryMeta(nextItemObj),
                        item_obj: nextItemObj,
                    };
                }),
            }));

            setShowResourceModal(false);
            showToast("Recurso actualizado correctamente");
        } catch (error) {
            appAlert(error.response?.data?.detail || "Error al guardar el recurso");
        }
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

        const saved = await persistCurrentApu({
            closeAfterSave: false,
            successMessage: "APU actual guardado. Cargando APU anidado...",
        });
        if (!saved) return;

        if (typeof onOpenNestedApu === 'function') {
            onOpenNestedApu(nestedApuId, {
                id: apuId,
                codigo: formApu?.codigo,
                descripcion: formApu?.descripcion,
            });
            return;
        }

        appAlert("No se pudo abrir el APU anidado desde este contexto.");
    };

    const requestClose = async () => {
        if (isDirty) {
            const confirmed = await appConfirm({
                title: 'Cerrar editor APU',
                message: 'Hay cambios sin guardar en el editor actual. Si continúa, se descartarán. ¿Desea cerrar igualmente?',
                confirmLabel: 'Descartar y cerrar',
                cancelLabel: 'Seguir editando',
                tone: 'warning',
                zIndex: 'z-[360]',
            });
            if (!confirmed) return;
        }
        onClose?.({ skipDirtyCheck: true });
    };

    const requestGoBack = async () => {
        if (!isDirty) {
            onGoBack?.();
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
            const saved = await persistCurrentApu({
                closeAfterSave: false,
                successMessage: 'Cambios guardados. Volviendo al APU padre...',
            });
            if (!saved) return;
            onGoBack?.();
            return;
        }

        if (decision === 'discard') {
            onGoBack?.();
        }
    };

    // -- Render helpers --
    const renderEditorLineRow = (linea, idx, catId) => {
        const rowKey = linea.unique_key;
        const partial = calculateLinePartial(linea);
        const lineUnit = resolveApuLineUnitDescription(linea);
        
        return (
            <div key={rowKey} className="px-6 py-4 border-b border-zinc-100 hover:bg-zinc-50/30 transition-colors group relative">
                <div className="grid grid-cols-[40px_minmax(0,6fr)_100px_100px_120px_100px_120px_40px] gap-4 items-center">
                    <div className="flex justify-center text-zinc-300 font-bold text-[10px]">{idx + 1}</div>
                    <div className="min-w-0 flex flex-col">
                        <span className="text-[11px] font-bold text-zinc-800 leading-snug">{normalizeDescriptionCapitalization(linea.descripcion)}</span>
                        <span className="text-[8px] text-zinc-400 font-mono font-bold">{linea.codigo}</span>
                    </div>
                    <div className="text-center text-[10px] text-zinc-500 font-bold uppercase">{renderUnidad(lineUnit)}</div>
                    <div>
                        <input
                            type="text"
                            value={linea.cantidad}
                            onChange={(e) => updateLinea(rowKey, 'cantidad', e.target.value)}
                            onBlur={(e) => updateLinea(rowKey, 'cantidad', formatCalculo(e.target.value))}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    updateLinea(rowKey, 'cantidad', formatCalculo(e.target.value));
                                    e.currentTarget.blur();
                                }
                            }}
                            className="w-full text-center bg-white border border-zinc-200 rounded-lg py-1.5 text-[11px] font-black focus:border-[#F39200] outline-none"
                        />
                    </div>
                    <div className="text-right text-[11px] font-bold text-zinc-500">${formatMoneda(linea.precio)}</div>
                    <div>
                        {(catId === 1 || catId === 4) ? (
                            <input
                                type="text"
                                value={linea.rendimiento}
                                onChange={(e) => updateLinea(rowKey, 'rendimiento', e.target.value)}
                                onBlur={(e) => updateLinea(rowKey, 'rendimiento', formatCalculo(e.target.value))}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        updateLinea(rowKey, 'rendimiento', formatCalculo(e.target.value));
                                        e.currentTarget.blur();
                                    }
                                }}
                                className="w-full text-center bg-orange-50 border border-orange-100 rounded-lg py-1.5 text-[11px] font-black text-[#F39200] focus:border-[#F39200] outline-none"
                            />
                        ) : <div className="text-center text-zinc-300">—</div>}
                    </div>
                    <div className="text-right text-[11px] font-black text-zinc-900">${formatMoneda(partial)}</div>
                    <div className="flex items-center justify-center gap-1">
                        {linea.apu_hijo_id ? (
                            <button
                                type="button"
                                onClick={() => handleEditNestedApu(linea)}
                                className="p-1.5 text-zinc-400 hover:text-[#F39200] transition-colors"
                                title="Editar APU anidado"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={() => openEditResource(linea.item_obj || linea.recurso)}
                                className="p-1.5 text-zinc-400 hover:text-[#F39200] transition-colors"
                                title="Editar recurso"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        )}
                        <button onClick={() => removeLinea(rowKey)} className="p-1.5 text-zinc-300 hover:text-red-500 transition-colors">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    if (loading) return (
        <div className="h-[70dvh] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="h-full min-h-0 flex flex-col bg-[#F2F4F7] overflow-hidden rounded-2xl">
            {/* Header */}
            <div className="px-7 py-4 border-b border-zinc-200 flex items-center justify-between bg-white/95 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-amber-50 rounded-[0.95rem] flex items-center justify-center border border-amber-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]">
                        <Calculator className="w-5 h-5 text-[#F39200]" />
                    </div>
                    <div>
                        <h2 className="text-base font-black uppercase text-zinc-900 tracking-tight">Editor de APU (Nivel Presupuesto)</h2>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[10px] font-black uppercase tracking-widest text-[#F39200]">{formApu?.codigo}</span>
                            <span className="w-1 h-1 rounded-full bg-zinc-300" />
                            <span className="text-[10px] font-bold text-zinc-500 truncate max-w-sm">{normalizeDescriptionCapitalization(formApu?.descripcion)}</span>
                            <span className={`rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-widest ${getSyncBadge(formApu).className}`} title={getSyncBadge(formApu).message}>
                                {getSyncBadge(formApu).label}
                            </span>
                        </div>
                    </div>
                </div>
                {!canGoBack ? (
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={requestClose}
                            title="Cerrar editor APU"
                            aria-label="Cerrar editor APU"
                            className={`${APP_MODAL_CLOSE_BUTTON_CLASS} !h-10 !w-10`}
                        >
                            <X className="h-4 w-4 shrink-0" />
                            <span className="sr-only">Cerrar</span>
                        </button>
                        <button
                            type="button"
                            onMouseDown={(e) => e.preventDefault()}
                            onClick={handleSaveApu}
                            disabled={saving}
                            title={saving ? 'Guardando APU' : 'Guardar APU'}
                            aria-label={saving ? 'Guardando APU' : 'Guardar APU'}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#F39200]/25 bg-orange-50/80 text-[#F39200] shadow-[3px_3px_8px_rgba(243,146,0,0.14),-3px_-3px_8px_rgba(255,255,255,0.85)] transition hover:border-[#F39200]/45 hover:bg-orange-50 active:scale-95 active:shadow-[inset_2px_2px_6px_rgba(243,146,0,0.14)] disabled:pointer-events-none disabled:opacity-50"
                        >
                            <Save className={`h-4 w-4 shrink-0 ${saving ? 'animate-pulse' : ''}`} />
                            <span className="sr-only">{saving ? 'Guardando...' : 'Guardar APU'}</span>
                        </button>
                    </div>
                ) : null}
            </div>

            <div className="flex-1 min-h-0 flex overflow-hidden">
                {/* Left Tree: Resources */}
                <div className={`${isSidebarVisuallyCollapsed ? 'w-14' : 'w-96'} min-h-0 border-r border-zinc-200 bg-white flex flex-col transition-all duration-300 overflow-hidden`}>
                    <div className="h-[104px] p-4 border-b border-white/10 bg-[#0f1115] flex items-center">
                        {!isSidebarVisuallyCollapsed && (
                            <ClearSearchField
                                value={searchLeft}
                                onValueChange={setSearchLeft}
                                placeholder="Buscar recursos..."
                                containerClassName="w-full"
                                inputClassName="w-full h-10 pl-10 pr-10 bg-white border border-white/10 rounded-xl text-xs font-bold focus:border-[#F39200] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                            />
                        )}
                        {isSidebarVisuallyCollapsed && (
                            <button onClick={() => setIsSidebarCollapsed(false)} className="mx-auto w-8 h-8 rounded-[0.8rem] border border-white/10 bg-white/[0.05] flex items-center justify-center text-white/65 hover:text-[#F39200]">
                                <PanelLeftOpen className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                    
                    <div className={`flex-1 min-h-0 overflow-y-auto ${isSidebarVisuallyCollapsed ? 'hidden' : 'p-3'} custom-scrollbar`}>
                        {CATEGORIAS_BASE.map(cat => {
                            const { totalItems, grupos } = extractItemsByCat(cat.id);
                            if (searchLeft && totalItems === 0) return null;
                            const isExpanded = expandedCats.includes(cat.id);

                            return (
                                <div key={cat.id} className="mb-3">
                                    <button
                                        onClick={() => setExpandedCats(prev => isExpanded ? prev.filter(c => c !== cat.id) : [...prev, cat.id])}
                                        className={`group w-full border rounded-[1.45rem] px-4 py-4 text-left transition-all ${
                                            isExpanded
                                                ? 'bg-[#f8f8f6] border-[#d9d6cf] shadow-[0_8px_18px_rgba(15,23,42,0.08)]'
                                                : 'bg-white border-[#e6e3dc] hover:border-[#136191]/20 hover:bg-[#f8f8f6] hover:shadow-[0_8px_18px_rgba(15,23,42,0.06)]'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`h-11 w-11 rounded-[1rem] shrink-0 flex items-center justify-center ${isExpanded ? 'bg-white border border-[#e6e3dc] text-zinc-600' : 'bg-[#f8f8f6] text-zinc-500 border border-[#edeae4]'}`}>
                                                <span className="text-base leading-none">{cat.icon}</span>
                                            </div>
                                            <div className="min-w-0 flex-1 text-left">
                                                <span className="text-[8px] block mb-1 font-black uppercase tracking-[0.18em] text-zinc-400">
                                                    Categoria {cat.id}
                                                </span>
                                                <div className="relative min-w-0">
                                                    <span className="block text-[11px] font-black uppercase tracking-tight text-zinc-700 truncate pr-5">
                                                        {cat.nombre}
                                                    </span>
                                                    <div className={`pointer-events-none absolute inset-y-0 right-0 w-8 ${isExpanded ? 'bg-gradient-to-l from-zinc-100 via-zinc-100/90 to-transparent' : 'bg-gradient-to-l from-white via-white/90 to-transparent group-hover:from-zinc-50'}`} />
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 shrink-0">
                                                <span className={`min-w-[2.1rem] h-8 px-2 rounded-full inline-flex items-center justify-center text-[10px] font-black tabular-nums border shadow-[1px_1px_4px_rgba(0,0,0,0.10),-1px_-1px_3px_rgba(255,255,255,0.70)] ${
                                                    isExpanded
                                                        ? 'bg-blue-50 text-[#136191] border-blue-100'
                                                        : 'bg-[#ededed] text-zinc-700 border-[#e3e3e3]'
                                                }`}>
                                                    {totalItems}
                                                </span>
                                                <span
                                                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e3e3e3] bg-[#ededed] text-zinc-500 shadow-[1px_1px_4px_rgba(0,0,0,0.18),-1px_-1px_3px_rgba(255,255,255,0.58)] transition-[color,border-color,transform,box-shadow] duration-200 group-hover:border-[#F39200]/40 group-hover:text-[#F39200] group-active:scale-[0.98] group-active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff]"
                                                    aria-hidden="true"
                                                >
                                                    <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isExpanded ? 'rotate-90 text-[#F39200]' : ''}`} />
                                                </span>
                                            </div>
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="ml-5 mt-3 border-l-2 border-[#edeae4] pl-3 space-y-2">
                                            {grupos.map(g => (
                                                <div key={g.subcat.id} className="space-y-1">
                                                    <div className="group relative rounded-xl border border-zinc-100 bg-white px-3 py-2 text-left">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="min-w-0 flex-1">
                                                                <span className="text-[8px] block mb-0.5 font-black uppercase tracking-[0.18em] text-zinc-400">{g.subcat.codigo || ''}</span>
                                                                <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-zinc-600 truncate">{g.subcat.descripcion}</span>
                                                            </div>
                                                            <span className="min-w-[1.75rem] h-5 px-2 rounded-full inline-flex items-center justify-center text-[9px] font-black tabular-nums border bg-zinc-100 text-zinc-700 border-zinc-200">
                                                                {g.items.length}
                                                            </span>
                                                        </div>
                                                        <div
                                                            aria-hidden="true"
                                                            className="pointer-events-none absolute left-full top-0 z-30 ml-3 hidden w-[min(18rem,calc(100vw-3rem))] translate-x-1 opacity-0 transition-all duration-150 ease-out md:block group-hover:translate-x-0 group-hover:opacity-100"
                                                        >
                                                            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                                                                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">{g.subcat.codigo || ''}</p>
                                                                <p className="mt-1 text-[10px] font-black uppercase tracking-[0.14em] leading-tight text-zinc-900 break-words">
                                                                    {g.subcat.descripcion}
                                                                </p>
                                                                <p className="mt-2 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                    {g.items.length} {g.items.length === 1 ? 'recurso en este grupo' : 'recursos en este grupo'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    {g.items.map(item => (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => addLinea(item, cat.id === 5)}
                                                            className="flex items-center justify-between p-2 rounded-lg hover:bg-[#FFF9F0] border border-transparent hover:border-[#F39200] cursor-pointer group transition-all"
                                                        >
                                                            <div className="flex-1 min-w-0 pr-2">
                                                                <p className="text-[10px] font-bold text-zinc-700 uppercase truncate leading-tight">{item.descripcion}</p>
                                                                <div className="flex justify-between mt-0.5">
                                                                    <div className="flex items-center gap-1.5">
                                                                        <span className="text-[8px] font-black text-[#F39200] uppercase">{renderUnidad(item.unidad)}</span>
                                                                        {item.isApu && (
                                                                            <span title={getSyncBadge(item).message} className={`rounded-full border px-1.5 py-0.5 text-[7px] font-black uppercase tracking-widest ${getSyncBadge(item).className}`}>
                                                                                {getSyncBadge(item).label}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-zinc-900">${formatMoneda(item.isApu ? (item.costo_directo ?? item.precio_unitario_total ?? 0) : (item.precio || item.precio_unitario_total || 0))}</span>
                                                                </div>
                                                            </div>
                                                            <Plus className="w-3.5 h-3.5 text-[#F39200] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Right Panel: Editor */}
                <div className="flex-1 min-h-0 flex flex-col bg-white overflow-hidden relative">
                    {nestedContext?.descripcion && (
                        <div className="px-8 py-3 border-b border-amber-100 bg-amber-50/80 flex items-center justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-[9px] font-black uppercase tracking-widest text-amber-700">Editando APU anidado</p>
                                <p className="text-[11px] font-bold text-zinc-600 truncate">
                                    Origen: {nestedContext.codigo ? `${nestedContext.codigo} · ` : ''}{nestedContext.descripcion}
                                </p>
                            </div>
                            {canGoBack && (
                                <button
                                    type="button"
                                    onClick={requestGoBack}
                                    className="shrink-0 rounded-xl border border-amber-200 bg-white px-4 py-2 text-[10px] font-black uppercase tracking-widest text-amber-700 hover:bg-amber-50 transition-all"
                                >
                                    Volver al padre
                                </button>
                            )}
                        </div>
                    )}
                    {/* APU Form Details */}
                    <div className="h-[104px] px-6 py-4 bg-[#0f1115] border-b border-white/10 flex items-center">
                        <div className="w-full">
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-8 space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/50 ml-1">Descripción de Partida</label>
                                    <input
                                        value={formApu?.descripcion || ''}
                                        onChange={e => setFormApu(prev => ({ ...prev, descripcion: e.target.value.toUpperCase() }))}
                                        className="w-full h-10 bg-white border border-white/10 rounded-xl px-4 text-xs font-black uppercase text-zinc-900 focus:border-[#F39200] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]"
                                    />
                                </div>
                                <div className="col-span-4 space-y-1">
                                    <label className="text-[9px] font-black uppercase tracking-widest text-white/50 ml-1">Unidad</label>
                                    <AnimatedSelect
                                        value={formApu?.unidad_id || ''}
                                        onChange={e => {
                                            const uid = parseInt(e.target.value);
                                            const u = findMatchingUnit(unidades, uid);
                                            setFormApu(prev => ({ ...prev, unidad_id: uid, unidad: u?.descripcion || prev.unidad }));
                                        }}
                                        className="w-full h-10 bg-white border border-white/10 rounded-xl px-4 text-xs font-black uppercase text-zinc-900 focus:border-[#F39200] outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] cursor-pointer"
                                    >
                                        <option value="">(Seleccionar)</option>
                                        {unidades.map(u => <option key={u.id} value={u.id}>{u.descripcion} - {u.descripcion_completa}</option>)}
                                    </AnimatedSelect>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Lines Table */}
                    <div className="flex-1 min-h-0 overflow-auto overscroll-contain custom-scrollbar [touch-action:pan-x_pan-y]">
                        <div className="min-w-[800px]">
                            <div className="sticky top-0 bg-zinc-100/80 backdrop-blur-sm border-b border-zinc-200 grid grid-cols-[40px_minmax(0,3fr)_100px_100px_120px_100px_120px_40px] gap-4 px-6 py-2.5 z-20">
                                <div className="text-center text-[9px] font-black uppercase text-zinc-400">#</div>
                                <div className="text-[9px] font-black uppercase text-zinc-400">Recurso / Descripción</div>
                                <div className="text-center text-[9px] font-black uppercase text-zinc-400">Unidad</div>
                                <div className="text-center text-[9px] font-black uppercase text-zinc-400">Cantidad</div>
                                <div className="text-right text-[9px] font-black uppercase text-zinc-400">Precio (u)</div>
                                <div className="text-center text-[9px] font-black uppercase text-zinc-400">Rend.</div>
                                <div className="text-right text-[9px] font-black uppercase text-zinc-400">Parcial</div>
                                <div></div>
                            </div>
                            
                            <div className="divide-y divide-zinc-100">
                                {CATEGORIAS_BASE.filter(c => c.id !== 5).map(cat => {
                                    const catLines = (formApu?.lineas || []).filter(l => l.categoria_id === cat.id);
                                    if (catLines.length === 0) return null;

                                    return (
                                        <div key={cat.id}>
                                            <div className="px-6 py-2 bg-zinc-50 flex items-center gap-2">
                                                <span className="text-[10px]">{cat.icon}</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-500">{cat.nombre}</span>
                                            </div>
                                            {catLines.map((l, idx) => renderEditorLineRow(l, idx, cat.id))}
                                        </div>
                                    );
                                })}

                                {formApu?.lineas.length === 0 && (
                                    <div className="py-20 text-center flex flex-col items-center gap-3">
                                        <PlusCircle className="w-10 h-10 text-zinc-200" />
                                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-300">Arrastra o pulsa "+" en los recursos para empezar</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer Totals */}
                    <div className="px-6 py-3 border-t border-zinc-200 bg-white">
                        <div className="flex justify-end gap-3">
                            <div className="min-w-[170px] rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-right shadow-[0_6px_14px_rgba(15,23,42,0.04)]">
                                <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Costo Directo</span>
                                <span className="mt-1 block text-xl font-black text-zinc-900 tracking-tighter leading-none">${formatMoneda(calculos.directo)}</span>
                            </div>
                            <div className="min-w-[230px] rounded-2xl border border-orange-200 bg-orange-50 px-4 py-2 text-right shadow-[0_6px_14px_rgba(243,146,0,0.08)]">
                                <span
                                    className="text-[9px] font-black uppercase tracking-widest text-[#F39200]"
                                    title="Indirecto operativo del proyecto/revisión activa"
                                >
                                    Indirectos proyecto
                                </span>
                                <span className="mt-1 block text-xl font-black text-[#F39200] tracking-tighter leading-none">${formatMoneda(calculos.indirecto)}</span>
                                <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                    {formatNumericDisplay(calculos.indirectoPct.toFixed(2))}% · {indirectoContextLabel}
                                </span>
                            </div>
                            <div className="min-w-[170px] rounded-2xl border border-orange-200 bg-white px-4 py-2 text-right shadow-[0_6px_14px_rgba(15,23,42,0.04)]">
                                <span className="text-[9px] font-black uppercase tracking-widest text-[#F39200]">Total Ref.</span>
                                <span className="mt-1 block text-3xl font-black text-[#F39200] tracking-tighter leading-none">${formatMoneda(calculos.totalConIndirectos)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Simple Toast */}
            <AnimatePresence>
                {toast && (
                    <MotionDiv
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 50 }}
                        className="fixed bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl bg-zinc-900 text-white shadow-2xl z-[100] flex items-center gap-3 border border-zinc-700"
                    >
                        {toast.type === 'error' ? <AlertCircle className="w-4 h-4 text-red-500" /> : <Check className="w-4 h-4 text-[#F39200]" />}
                        <span className="text-xs font-black uppercase tracking-widest">{toast.message}</span>
                    </MotionDiv>
                )}
            </AnimatePresence>

            <ResourceEditorModal
                isOpen={showResourceModal}
                onClose={() => setShowResourceModal(false)}
                onSubmit={handleSaveResource}
                editingRecurso={editingRecurso}
                form={resourceForm}
                setForm={setResourceForm}
                unidades={resourceUnidades}
                onSpellCheck={() => {}}
                title="Modificar Recurso"
                subtitle="Edición directa desde composición APU"
                submitLabel="Guardar Recurso"
                currentOmniClassTable={getOmniClassTableForResourceCategory(
                    editingRecurso?.recurso?.subcategoria_codigo || editingRecurso?.subcategoria_codigo || editingRecurso?.categoria_id || 1
                )}
                formatMonedaInput={formatMonedaInput}
                enableOmniClass={useOmniClass}
            />
        </div>
    );
};

export default ApuBudgetEditor;
