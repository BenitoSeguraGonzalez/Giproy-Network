import { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    FolderOpen,
    Settings,
    Trash2,
    Info,
    Calendar,
    Globe,
    ChevronRight,
    Search,
    Copy,
    ArrowLeft,
    Save,
    X,
    Database,
    SortAsc,
    SortDesc,
    ArrowUpDown,
    RefreshCw,
    RotateCcw
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { includesNormalized, normalizeSearchToken } from '../utils/normalizeSearch';
import basesTrabajoApi from '../api/basesTrabajo';
import { maestrosApi } from '../api/maestros';
import { proyectosApi } from '../api/proyectos';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LiquidButton } from '../components/ui/liquid-button';
import SearchableSelect from '../components/ui/searchable-select';
import { appAlert, appConfirm } from '../utils/appDialog';
import { AppModalShell, AppModalHeader, AppModalFooter } from '../components/ui/app-modal';
import { useFormatters } from '../hooks/useFormatters';
import MarketplaceOriginBadgeSet, { getMarketplaceOwnershipTone } from '../components/marketplace/MarketplaceOriginBadgeSet';
import useMarketplaceOrigin from '../hooks/useMarketplaceOrigin';
import useMarketplaceOriginsMap from '../hooks/useMarketplaceOriginsMap';
import ClearSearchField from '../components/ui/ClearSearchField';
import AppHint from '../components/ui/AppHint';
const SYNC_MODE_LABELS = {
    new_apus: 'APUs nuevas',
    apu_values: 'Valores de APU',
    integral: 'Sincronismo integral'
};

const SYNC_HISTORY_USABLE_EVENT_TYPES = new Set([
    'project_base_sync_executed',
    'project_base_sync_reverted',
    'project_base_sync_missing_completed',
    'project_base_inherited_repaired',
]);

const SYNC_HISTORY_EVENT_LABELS = {
    project_base_sync_executed: 'Sincronización ejecutada',
    project_base_sync_reverted: 'Sincronización revertida',
    project_base_sync_missing_completed: 'Sincronización de faltantes',
    project_base_inherited_repaired: 'Reparación heredada',
};

const getSyncSummaryMetrics = (summary = {}) => {
    const missingSubcategories = Number(summary?.missing_subcategories || 0);
    const missingResources = Number(summary?.missing_resources || 0);
    const missingApus = Number(summary?.missing_apus || 0);
    const valueApus = Number(summary?.value_apus || 0);
    const presupuestosAfectables = Number(summary?.presupuestos_afectables || summary?.presupuestos || 0);
    const presupuestosConLineas = Number(summary?.presupuestos_con_lineas || 0);
    const lineasPresupuesto = Number(summary?.lineas_presupuesto || 0);
    const budgetImpacted = presupuestosConLineas > 0 || lineasPresupuesto > 0 || valueApus > 0;

    return {
        missingSubcategories,
        missingResources,
        missingApus,
        valueApus,
        presupuestosAfectables,
        presupuestosConLineas,
        lineasPresupuesto,
        budgetImpacted,
    };
};

const BasesTrabajo = () => {
    const { user, selectedEmpresa, selectedBaseTrabajo, setSelectedEmpresa, setSelectedBaseTrabajo, setActiveProject } = useContext(AuthContext);
    const formatters = useFormatters();
    const parseNumericInput = formatters?.parseNumericInput || ((v) => String(v || '').replace(',', '.'));
    const navigate = useNavigate();
    const location = useLocation();
    const currentEmpresaId = selectedEmpresa?.id != null ? Number(selectedEmpresa.id) : null;
    const selectedBaseTrabajoInCurrentEmpresa = selectedBaseTrabajo
        && currentEmpresaId !== null
        && Number(selectedBaseTrabajo.empresa_id) === currentEmpresaId
        ? selectedBaseTrabajo
        : null;
    const baseOrigin = useMarketplaceOrigin('base_trabajo', selectedBaseTrabajoInCurrentEmpresa?.id);
    const { originsMap } = useMarketplaceOriginsMap();
    
    // Core States
    const [bases, setBases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [paises, setPaises] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('todas');
    const [nextCode, setNextCode] = useState('');
    const [sortOrder, setSortOrder] = useState('recent');

    // Modal States
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isCloning, setIsCloning] = useState(false);
    const [editingBase, setEditingBase] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteStep, setDeleteStep] = useState(1);
    const [baseToDelete, setBaseToDelete] = useState(null);
    const [linkedProject, setLinkedProject] = useState(null);
    const [deleting, setDeleting] = useState(false);
    const [showRecycleModal, setShowRecycleModal] = useState(false);
    const [recycledBases, setRecycledBases] = useState([]);
    const [recycleLoading, setRecycleLoading] = useState(false);
    const [recycleActionId, setRecycleActionId] = useState(null);
    const [syncingBaseId, setSyncingBaseId] = useState(null);
    const [syncHistoryBase, setSyncHistoryBase] = useState(null);
    const [syncHistoryItems, setSyncHistoryItems] = useState([]);
    const [loadingSyncHistory, setLoadingSyncHistory] = useState(false);
    const [syncPreviewBase, setSyncPreviewBase] = useState(null);
    const [syncPreviewData, setSyncPreviewData] = useState(null);
    const [syncPreviewMode, setSyncPreviewMode] = useState('integral');
    const [syncPreviewTargetBaseId, setSyncPreviewTargetBaseId] = useState(null);
    const [highlightedBaseId, setHighlightedBaseId] = useState(null);
    const cardRefs = useRef(new Map());
    const highlightTimeoutRef = useRef(null);

    // Grid States (Project Grouping)
    const [selectedRevisions, setSelectedRevisions] = useState({});

    const buildSyncConfirmationMessage = useCallback((mode, summary) => {
        const {
            valueApus,
            missingApus,
            missingResources,
            missingSubcategories,
            budgetImpacted,
        } = getSyncSummaryMetrics(summary);
        const baseSummary = [
            `APUs nuevas: ${missingApus}`,
            `APUs por reajustar: ${valueApus}`,
            `Recursos a actualizar: ${missingResources}`,
            `Subcategorías implicadas: ${missingSubcategories}`,
        ].join(' · ');

        if (budgetImpacted) {
            return `Se ejecutará ${SYNC_MODE_LABELS[mode] || 'la sincronización'} sobre la revisión seleccionada. ${baseSummary}. Esta sincronización reajustará valores del presupuesto, cronogramas y otros elementos del proyecto. Los tanteos se conservarán, pero recalculados con los nuevos precios. ¿Desea continuar?`;
        }

        return `Se ejecutará ${SYNC_MODE_LABELS[mode] || 'la sincronización'} sobre la revisión seleccionada. ${baseSummary}. No se detecta impacto directo en presupuesto operativo. ¿Desea continuar?`;
    }, []);

    const executeSyncOperation = async (base, mode = syncPreviewMode, summary = syncPreviewData?.summary || {}) => {
        if (!base) {
            return;
        }

        const confirmed = await appConfirm({
            title: 'Confirmar sincronización',
            message: buildSyncConfirmationMessage(mode, summary),
        });
        if (!confirmed) {
            return;
        }

        setSyncingBaseId(base.id);
        try {
            const response = await basesTrabajoApi.executeSyncOperation(base.id, mode, selectedEmpresa?.id);
            const added = response?.data?.added || {};
            const updated = response?.data?.updated || {};
            const impacts = response?.data?.impacts || {};
            const compatibilityMode = response?.data?.compatibility_mode || null;
            setSyncPreviewBase(null);
            setSyncPreviewData(null);
            setSyncPreviewTargetBaseId(null);
            await fetchBases();
            await appAlert({
                title: 'Sincronización completada',
                message: `${compatibilityMode === 'legacy_sync_missing_execute'
                    ? 'El backend activo ejecutó un sincronismo compatible de faltantes. Esta ejecución no genera reversión de un paso.'
                    : `Se ejecutó ${SYNC_MODE_LABELS[mode] || 'la sincronización'} sobre la revisión seleccionada.`} Se añadieron ${added.subcategories || 0} subcategorías, ${added.resources || 0} recursos y ${added.apus || 0} APUs. También se actualizaron ${updated.resource_values || 0} recursos y ${updated.apu_values || 0} APUs existentes. Esta operación refrescó ${impacts.presupuestos || 0} presupuestos vinculados.`
            });
        } catch (error) {
            await appAlert({
                title: 'Error al sincronizar',
                message: error.response?.data?.detail || error.message || 'No fue posible completar la sincronización.'
            });
        } finally {
            setSyncingBaseId(null);
        }
    };

    // Form State
    const [newBase, setNewBase] = useState({
        nombre: '',
        tipo: 'Base Maestra',
        descripcion: '',
        porcentaje_indirectos: 0,
        tipo_rendimiento: 'Rendimiento Unitario (Tiempo/Unidad)',
        unidad_tiempo: 'Hora',
        pais_id: '',
        moneda: 'USD',
        observaciones: '',
        source_base_id: null
    });

    // --- DATA FETCHING ---

    const fetchBases = useCallback(async () => {
        setLoading(true);
        try {
            if (user?.rol?.toLowerCase() === 'superadministrador' && !selectedEmpresa?.id) {
                setBases([]);
                return;
            }
            const res = await basesTrabajoApi.getAll({ empresa_id: selectedEmpresa?.id });
            const nextBases = Array.isArray(res.data) ? res.data : [];
            const scopedBases = selectedEmpresa?.id
                ? nextBases.filter((base) => Number(base.empresa_id) === Number(selectedEmpresa.id))
                : nextBases;
            setBases(scopedBases);
        } catch (error) {
            globalThis.reportClientError?.("Error cargando bases de trabajo", error);
        } finally {
            setLoading(false);
        }
    }, [selectedEmpresa, user?.rol]);

    const fetchPaises = useCallback(async () => {
        try {
            const data = await maestrosApi.getPaises();
            setPaises(Array.isArray(data) ? data : []);
        } catch (error) {
            globalThis.reportClientError?.("Error cargando paises", error);
        }
    }, []);

    const fetchNextCode = useCallback(async () => {
        try {
            const res = await basesTrabajoApi.getNextCode(selectedEmpresa?.id);
            setNextCode(res.data.next_code);
        } catch (error) {
            globalThis.reportClientError?.("Error generando codigo de base de trabajo", error);
            setNextCode('BT-ERR');
        }
    }, [selectedEmpresa]);

    useEffect(() => {
        if (!selectedEmpresa && user?.empresa) setSelectedEmpresa(user.empresa);
        fetchBases();
        fetchPaises();
    }, [selectedEmpresa, user, fetchBases, fetchPaises, setSelectedEmpresa]);

    useEffect(() => {
        if (!selectedBaseTrabajo || currentEmpresaId === null) {
            return;
        }
        if (Number(selectedBaseTrabajo.empresa_id) !== currentEmpresaId) {
            setSelectedBaseTrabajo(null);
            if (setActiveProject) setActiveProject(null);
        }
    }, [
        currentEmpresaId,
        selectedBaseTrabajo,
        setActiveProject,
        setSelectedBaseTrabajo,
    ]);

    useEffect(() => {
        const requestedBaseId = Number(new URLSearchParams(location.search).get('base_id') || 0);
        if (!requestedBaseId || selectedBaseTrabajo?.id === requestedBaseId) {
            return;
        }

        let cancelled = false;
        const syncRequestedBase = async () => {
            try {
                const targetBase = bases.find((item) => item.id === requestedBaseId)
                    || (await basesTrabajoApi.getById(requestedBaseId, selectedEmpresa?.id)).data;

                if (!targetBase || cancelled) {
                    return;
                }

                await basesTrabajoApi.activate(targetBase.id, selectedEmpresa?.id);
                if (!cancelled) {
                    setSelectedBaseTrabajo({ ...targetBase, activa: true });
                    if (setActiveProject) setActiveProject(null);
                }
            } catch (error) {
                globalThis.reportClientError?.('Error sincronizando base solicitada desde marketplace:', error);
            }
        };

        syncRequestedBase();
        return () => {
            cancelled = true;
        };
    }, [bases, location.search, selectedBaseTrabajo?.id, selectedEmpresa?.id, setActiveProject, setSelectedBaseTrabajo]);

    // Modal Lifecycle
    useEffect(() => {
        if (showCreateModal) {
            if (editingBase) {
                setNewBase({
                    nombre: isCloning ? `${editingBase.nombre} (Copia)` : (editingBase.nombre || ''),
                    tipo: editingBase.tipo || 'Base Maestra',
                    descripcion: editingBase.descripcion || '',
                    porcentaje_indirectos: editingBase.porcentaje_indirectos || 0,
                    tipo_rendimiento: editingBase.tipo_rendimiento || 'Rendimiento Unitario (Tiempo/Unidad)',
                    unidad_tiempo: editingBase.unidad_tiempo || 'Hora',
                    pais_id: editingBase.pais_id || '',
                    moneda: editingBase.moneda || 'USD',
                    observaciones: editingBase.observaciones || '',
                    source_base_id: isCloning ? editingBase.id : null
                });
                setNextCode(isCloning ? '' : (editingBase.codigo_unico || ''));
                if (isCloning) fetchNextCode();
            } else {
                const ecuador = paises.find(p => p.nombre.toLowerCase() === 'ecuador');
                setNewBase({
                    nombre: '', tipo: 'Base Maestra', descripcion: '', porcentaje_indirectos: 0,
                    tipo_rendimiento: 'Rendimiento Unitario (Tiempo/Unidad)', unidad_tiempo: 'Hora',
                    pais_id: ecuador?.id || '', moneda: ecuador?.moneda || 'USD',
                    observaciones: '', source_base_id: null
                });
                fetchNextCode();
            }
        }
    }, [showCreateModal, editingBase, isCloning, fetchNextCode, paises]);

    // Pre-selection of revisions
    useEffect(() => {
        if (bases.length > 0) {
            setSelectedRevisions(prev => {
                const next = { ...prev };
                let changed = false;
                const groups = {};
                bases.forEach(b => {
                    if (b.tipo === 'Base de Proyecto' && b.codigo_root) {
                        if (!groups[b.codigo_root]) groups[b.codigo_root] = [];
                        groups[b.codigo_root].push(b);
                    }
                });
                Object.keys(groups).forEach(root => {
                    if (!next[root]) {
                        const sorted = [...groups[root]].sort((a, b) => (b.revision || 0) - (a.revision || 0));
                        next[root] = sorted[0].id;
                        changed = true;
                    }
                });
                return changed ? next : prev;
            });
        }
    }, [bases]);

    // --- ACTIONS ---

    const handleOpenBase = async (base) => {
        try {
            await basesTrabajoApi.activate(base.id, selectedEmpresa?.id);
            setSelectedBaseTrabajo({ ...base, activa: true });
            if (setActiveProject) setActiveProject(null);
            navigate(`/precios-unitarios`);
            fetchBases();
        } catch (error) {
            appAlert(`Error al activar: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleQuickClone = (base) => {
        setEditingBase(base);
        setIsCloning(true);
        setShowCreateModal(true);
    };

    const loadSyncPreview = useCallback(async (baseId, mode) => {
        if (!baseId || !mode) {
            return;
        }
        const previewResponse = await basesTrabajoApi.previewSyncOperation(baseId, mode, selectedEmpresa?.id);
        setSyncPreviewData(previewResponse?.data || null);
    }, [selectedEmpresa?.id]);

    const handleSyncMissing = async (base) => {
        if (!base?.source_base_id || base.tipo !== 'Base de Proyecto') {
            return;
        }

        try {
            setSyncPreviewBase(base);
            setSyncPreviewMode('integral');
            setSyncPreviewTargetBaseId(base.id);
            await loadSyncPreview(base.id, 'integral');
        } catch (error) {
            await appAlert({
                title: 'Error preparando sincronización',
                message: error.response?.data?.detail || error.message
            });
        }
    };

    const handleRevertSync = async (base, eventId) => {
        if (!base?.id || !eventId) {
            return;
        }
        const confirmed = await appConfirm({
            title: 'Revertir sincronización',
            message: 'Se restaurará el estado inmediatamente anterior de esta revisión. Solo es posible revertir la última sincronización, y los valores de presupuestos y cronogramas volverán al estado previo.'
        });
        if (!confirmed) {
            return;
        }

        setSyncingBaseId(base.id);
        try {
            await basesTrabajoApi.revertSyncOperation(base.id, eventId, selectedEmpresa?.id);
            await fetchBases();
            const response = await basesTrabajoApi.getSyncHistory(base.id, selectedEmpresa?.id, 8);
            setSyncHistoryItems(response?.data?.items || []);
            await appAlert({
                title: 'Sincronización revertida',
                message: 'La última sincronización se revirtió correctamente y el proyecto volvió al estado anterior.'
            });
        } catch (error) {
            await appAlert({
                title: 'Error al revertir',
                message: error.response?.data?.detail || error.message
            });
        } finally {
            setSyncingBaseId(null);
        }
    };

    const handleOpenSyncHistory = async (base) => {
        setSyncHistoryBase(base);
        setSyncHistoryItems([]);
        setLoadingSyncHistory(true);
        try {
            const response = await basesTrabajoApi.getSyncHistory(base.id, selectedEmpresa?.id, 8);
            setSyncHistoryItems(response?.data?.items || []);
        } catch (error) {
            appAlert({
                title: 'Error cargando historial',
                message: error.response?.data?.detail || error.message
            });
        } finally {
            setLoadingSyncHistory(false);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const eid = selectedEmpresa?.id || user?.empresa_id;
            const rawIndir = newBase.porcentaje_indirectos;
            const parsedIndir = parseNumericInput(rawIndir);
            const sanitizedIndir = String(parseFloat(parsedIndir) || 0.0);

            if (editingBase && !isCloning) {
                // Update
                const payload = {
                    nombre: newBase.nombre,
                    porcentaje_indirectos: sanitizedIndir,
                    pais_id: newBase.pais_id ? parseInt(newBase.pais_id) : null,
                    moneda: newBase.moneda,
                    observaciones: newBase.observaciones,
                };
                if (editingBase.tipo !== 'Base de Proyecto') {
                    payload.descripcion = newBase.descripcion;
                }
                await basesTrabajoApi.update(editingBase.id, payload, eid);
            } else {
                // Create or Clone
                const payload = {
                    ...newBase,
                    empresa_id: eid,
                    porcentaje_indirectos: sanitizedIndir,
                    source_base_id: isCloning ? editingBase?.id : null
                };
                await basesTrabajoApi.create(payload, eid);
            }
            setShowCreateModal(false);
            setEditingBase(null);
            setIsCloning(false);
            fetchBases();
            appAlert("Proceso exitoso");
        } catch (error) {
            appAlert(`Error: ${error.response?.data?.detail || error.message}`);
        }
    };

    const handleDelete = async (base) => {
        setBaseToDelete(base);
        setLinkedProject(null);
        setDeleteStep(1);
        setShowDeleteModal(true);
        if (base.tipo === 'Base de Proyecto') {
            try {
                const project = await proyectosApi.getByBaseId(base.id);
                setLinkedProject(project);
            } catch (err) { console.warn("No linked project"); }
        }
    };

    const handleDeleteBaseConfirm = async () => {
        setDeleting(true);
        try {
            const eid = selectedEmpresa?.id || user?.empresa_id;
            if (linkedProject) {
                await proyectosApi.delete(linkedProject.id);
            } else {
                await basesTrabajoApi.delete(baseToDelete.id, eid);
            }
            fetchBases();
            setShowDeleteModal(false);
        } catch (error) {
            appAlert(`Error: ${error.response?.data?.detail || error.message}`);
        } finally {
            setDeleting(false);
        }
    };

    const fetchRecycledBases = async () => {
        const eid = selectedEmpresa?.id || user?.empresa_id;
        setRecycleLoading(true);
        try {
            const response = await basesTrabajoApi.getRecycleBin(eid ? { empresa_id: eid } : {});
            const data = Array.isArray(response?.data) ? response.data : [];
            setRecycledBases(data);
        } catch (error) {
            globalThis.reportClientError?.('Error cargando papelera de bases:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo cargar la papelera de bases de trabajo.');
        } finally {
            setRecycleLoading(false);
        }
    };

    const openRecycleModal = async () => {
        setShowRecycleModal(true);
        await fetchRecycledBases();
    };

    const handleRestoreRecycledBase = async (base) => {
        if (!base?.id) return;
        const eid = base.empresa_id || selectedEmpresa?.id || user?.empresa_id;
        setRecycleActionId(base.id);
        try {
            await basesTrabajoApi.restoreFromRecycleBin(base.id, eid);
            await fetchRecycledBases();
            await fetchBases();
        } catch (error) {
            globalThis.reportClientError?.('Error restaurando base:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo restaurar la base de trabajo.');
        } finally {
            setRecycleActionId(null);
        }
    };

    const handlePurgeRecycledBase = async (base) => {
        if (!base?.id) return;
        const confirmed = await appConfirm({
            title: 'Borrado definitivo',
            message: `Se eliminará definitivamente ${base.trash_original_nombre || base.nombre}. Esta acción no se puede deshacer. ¿Desea continuar?`,
            confirmLabel: 'Borrar definitivamente',
            cancelLabel: 'Cancelar',
            tone: 'danger'
        });
        if (!confirmed) return;

        const eid = base.empresa_id || selectedEmpresa?.id || user?.empresa_id;
        setRecycleActionId(base.id);
        try {
            await basesTrabajoApi.purgeFromRecycleBin(base.id, eid);
            await fetchRecycledBases();
        } catch (error) {
            globalThis.reportClientError?.('Error purgando base:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo borrar definitivamente la base de trabajo.');
        } finally {
            setRecycleActionId(null);
        }
    };

    const clearHighlightedBase = useCallback((sourceBaseId = null) => {
        if (highlightTimeoutRef.current) {
            window.clearTimeout(highlightTimeoutRef.current);
            highlightTimeoutRef.current = null;
        }
        setHighlightedBaseId((current) => {
            if (sourceBaseId && current !== sourceBaseId) {
                return current;
            }
            return null;
        });
    }, []);

    const handleHighlightSourceBase = useCallback((sourceBaseId, options = {}) => {
        if (!sourceBaseId) {
            return;
        }
        const sourceNode = cardRefs.current.get(sourceBaseId);
        if (!sourceNode) {
            return;
        }

        const { persistMs = 1800, scrollIntoView = false } = options;

        if (scrollIntoView) {
            sourceNode.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
                inline: 'center'
            });
        }

        clearHighlightedBase();
        setHighlightedBaseId(sourceBaseId);
        if (persistMs > 0) {
            highlightTimeoutRef.current = window.setTimeout(() => {
                setHighlightedBaseId((current) => (current === sourceBaseId ? null : current));
                highlightTimeoutRef.current = null;
            }, persistMs);
        }
    }, [clearHighlightedBase]);

    useEffect(() => {
        return () => {
            if (highlightTimeoutRef.current) {
                window.clearTimeout(highlightTimeoutRef.current);
            }
        };
    }, []);

    // --- GROUPING LOGIC ---

    const filteredBases = useMemo(() => {
        return bases.filter(b => {
            if (currentEmpresaId !== null && Number(b.empresa_id) !== currentEmpresaId) {
                return false;
            }
            const s = normalizeSearchToken(searchTerm);
            const matchesSearch = includesNormalized(b.nombre, s) || includesNormalized(b.codigo_unico, s);
            const isMaster = b.tipo === 'Base Maestra' || b.tipo === 'Base Padre';
            const matchesFilter = filterType === 'todas' || (filterType === 'maestras' && isMaster) || (filterType === 'proyectos' && !isMaster);
            return matchesSearch && matchesFilter;
        });
    }, [bases, currentEmpresaId, searchTerm, filterType]);

    const groupedBases = useMemo(() => {
        const groups = {};
        const masters = [];
        filteredBases.forEach(base => {
            const isMaster = base.tipo === 'Base Maestra' || base.tipo === 'Base Padre';
            if (isMaster || !base.codigo_root) {
                masters.push(base);
            } else {
                if (!groups[base.codigo_root]) {
                    groups[base.codigo_root] = {
                        codigo_root: base.codigo_root,
                        proyecto_id: base.proyecto_id,
                        nombre: base.nombre,
                        isGroup: true,
                        revisions: []
                    };
                }
                groups[base.codigo_root].revisions.push(base);
            }
        });

        const processed = Object.values(groups).map(g => {
            g.revisions.sort((a, b) => (b.revision || 0) - (a.revision || 0));
            const latest = g.revisions[0];
            return {
                ...latest, ...g, id: latest.id, activa: g.revisions.some(r => r.activa)
            };
        });

        return [...masters, ...processed].sort((a, b) => {
            if (sortOrder === 'recent') return new Date(b.ultima_modificacion || b.fecha_creacion) - new Date(a.ultima_modificacion || a.fecha_creacion);
            return a.nombre.localeCompare(b.nombre);
        });
    }, [filteredBases, sortOrder]);

    const baseMapById = useMemo(() => {
        const map = new Map();
        bases.forEach((base) => {
            map.set(base.id, base);
        });
        return map;
    }, [bases]);

    const syncRevisionOptions = useMemo(() => {
        if (!syncPreviewBase?.codigo_root) {
            return syncPreviewBase ? [syncPreviewBase] : [];
        }
        return [...bases]
            .filter((base) => base.tipo === 'Base de Proyecto' && base.codigo_root === syncPreviewBase.codigo_root)
            .sort((a, b) => (b.revision || 0) - (a.revision || 0));
    }, [bases, syncPreviewBase]);

    const syncPreviewTargetBase = useMemo(() => {
        if (!syncPreviewTargetBaseId) {
            return syncPreviewBase;
        }
        return baseMapById.get(syncPreviewTargetBaseId) || syncPreviewBase;
    }, [baseMapById, syncPreviewBase, syncPreviewTargetBaseId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
    };

    const formatDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <div className="h-full min-h-0 flex flex-col bg-[#F8FAFC]">
            {/* Header */}
            <header className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/precios-unitarios')} className="p-2 hover:bg-zinc-100 rounded-xl">
                        <ArrowLeft className="w-5 h-5 text-zinc-500" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black uppercase text-zinc-900 tracking-tight">Bases de Trabajo</h1>
                        <p className="text-[10px] font-bold text-[#F39200] uppercase tracking-widest">{selectedEmpresa?.nombre || 'General'}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex bg-zinc-100 p-1 rounded-xl border border-zinc-200">
                        {['todas', 'maestras', 'proyectos'].map(f => (
                            <button key={f} onClick={() => setFilterType(f)} className={`px-4 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${filterType === f ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}>{f}</button>
                        ))}
                    </div>
                    <ClearSearchField
                        value={searchTerm}
                        onValueChange={setSearchTerm}
                        placeholder="Filtrar por nombre o código..."
                        containerClassName="w-64"
                        inputClassName="w-full pl-10 pr-10 h-10 bg-zinc-50 border border-zinc-200 rounded-xl text-xs outline-none focus:border-[#F39200]"
                    />
                    {['administrador', 'superadministrador', 'admin', 'superadmin'].includes(user?.rol?.toLowerCase()) && (
                        <>
                            <button
                                type="button"
                                onClick={openRecycleModal}
                                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-rose-200 hover:text-rose-700"
                            >
                                <Trash2 className="h-4 w-4" />
                                Papelera
                            </button>
                            <LiquidButton onClick={() => { setEditingBase(null); setIsCloning(false); setShowCreateModal(true); }} className="bg-[#1A1A1A] text-white">
                                <Plus className="w-4 h-4 mr-2" /> Nueva Base
                            </LiquidButton>
                        </>
                    )}
                </div>
            </header>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                {selectedBaseTrabajoInCurrentEmpresa && (
                    <div className="mb-6 flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                            Base activa
                        </span>
                        <MarketplaceOriginBadgeSet origin={baseOrigin} loading={baseOrigin.loading} mode="tooltip" label="Origen de la base activa" />
                    </div>
                )}
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-zinc-300">
                        <div className="w-10 h-10 border-4 border-zinc-100 border-t-[#F39200] rounded-full animate-spin" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Sincronizando...</p>
                    </div>
                ) : groupedBases.length === 0 ? (
                    <div className="text-center py-20 text-zinc-300 italic font-medium">No se encontraron resultados.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8">
                        {groupedBases.map(base => {
                            const isGroup = base.isGroup;
                            const currentId = isGroup ? (selectedRevisions[base.codigo_root] || base.id) : base.id;
                            const activeBase = isGroup ? (base.revisions.find(r => r.id === currentId) || base) : base;
                            const isMaster = activeBase.tipo === 'Base Maestra' || activeBase.tipo === 'Base Padre';
                            const isProjectVariant = activeBase.tipo === 'Base de Proyecto' && Boolean(activeBase.source_base_id);
                            const isVisuallySelected = selectedBaseTrabajo?.id === activeBase.id;
                            const activeBaseOriginData = originsMap.get(`base_trabajo:${activeBase.id}`) || null;
                            const ownershipTone = getMarketplaceOwnershipTone(activeBaseOriginData);
                            const sourceBase = activeBase.source_base_id ? baseMapById.get(activeBase.source_base_id) : null;

                            return (
                                <motion.div 
                                    key={isGroup ? `group-${base.codigo_root}` : `base-${base.id}`}
                                    layout
                                    ref={(node) => {
                                        if (node) {
                                            cardRefs.current.set(activeBase.id, node);
                                        } else {
                                            cardRefs.current.delete(activeBase.id);
                                        }
                                    }}
                                    className={`bg-white border rounded-[1.5rem] p-5 hover:shadow-[0_20px_40px_rgba(0,0,0,0.08)] transition-all cursor-pointer relative group flex flex-col min-h-[280px] ${highlightedBaseId === activeBase.id ? 'border-sky-400 shadow-[0_0_0_3px_rgba(14,165,233,0.18),0_18px_36px_rgba(14,165,233,0.15)]' : 'border-zinc-200 hover:border-[#F39200]/30'}`}
                                    onMouseEnter={() => {
                                        if (isProjectVariant) {
                                            handleHighlightSourceBase(activeBase.source_base_id, { persistMs: 0 });
                                        }
                                    }}
                                    onMouseLeave={() => {
                                        if (isProjectVariant) {
                                            clearHighlightedBase(activeBase.source_base_id);
                                        }
                                    }}
                                    onClick={() => handleOpenBase(activeBase)}
                                >
                                    {/* Header: Icon + Name + Actions */}
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3 flex-1 min-w-0">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isMaster ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-500'}`}>
                                                <Database className="w-5 h-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                                                    <span className="text-[9px] font-black bg-zinc-900 text-white px-1.5 py-0.5 rounded italic leading-none">{activeBase.codigo_unico}</span>
                                                    <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-full text-zinc-500 ${isMaster ? 'bg-orange-50' : 'bg-blue-50'}`}>{isMaster ? 'Base Maestra' : 'Base Proyecto'}</span>
                                                </div>
                                                <MarketplaceOriginBadgeSet
                                                    origin={activeBaseOriginData}
                                                    className="mb-0.5"
                                                    mode="tooltip"
                                                    label={`Origen de ${activeBase.nombre}`}
                                                />
                                                <h3 className="text-[13px] font-black uppercase tracking-tight leading-snug text-zinc-900 break-words [overflow-wrap:anywhere]">{activeBase.nombre}</h3>
                                            </div>
                                        </div>
                                        <div className="flex gap-0.5 shrink-0 ml-2">
                                            {isProjectVariant && (
                                                <>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleOpenSyncHistory(activeBase); }}
                                                        className="p-2 hover:bg-zinc-50 text-zinc-300 hover:text-zinc-600 rounded-lg transition-colors"
                                                        title="Ver historial de sincronización"
                                                    >
                                                        <Info className="w-3.5 h-3.5" />
                                                    </button>
                                                    <button
                                                        onClick={e => { e.stopPropagation(); handleSyncMissing(activeBase); }}
                                                        className="p-2 hover:bg-sky-50 text-zinc-300 hover:text-sky-600 rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                                        title="Sincronizar faltantes desde base maestra"
                                                        disabled={syncingBaseId === activeBase.id}
                                                    >
                                                        <RefreshCw className={`w-3.5 h-3.5 ${syncingBaseId === activeBase.id ? 'animate-spin' : ''}`} />
                                                    </button>
                                                </>
                                            )}
                                            <button onClick={e => { e.stopPropagation(); handleQuickClone(activeBase); }} className="p-2 hover:bg-zinc-50 text-zinc-300 hover:text-zinc-600 rounded-lg transition-colors" title="Clonar"><Copy className="w-3.5 h-3.5" /></button>
                                            <button onClick={e => { e.stopPropagation(); setEditingBase(activeBase); setIsCloning(false); setShowCreateModal(true); }} className="p-2 hover:bg-zinc-50 text-zinc-300 hover:text-zinc-600 rounded-lg transition-colors" title="Editar"><Settings className="w-3.5 h-3.5" /></button>
                                            <button onClick={e => { e.stopPropagation(); handleDelete(activeBase); }} className="p-2 hover:bg-red-50 text-zinc-300 hover:text-red-500 rounded-lg transition-colors" title="Eliminar"><Trash2 className="w-3.5 h-3.5" /></button>
                                        </div>
                                    </div>

                                    {/* Body: Description */}
                                    <div className="flex-1 min-h-0 mb-4">
                                        <AppHint
                                            content={activeBase.descripcion || 'Sin descripción adicional.'}
                                            tone="light"
                                            as="div"
                                            triggerClassName="relative h-full"
                                            maxWidth={280}
                                            minWidth={180}
                                            widthOffset={32}
                                            zIndex={140}
                                        >
                                            <p className="max-h-16 overflow-y-auto pr-1 text-[10px] text-zinc-500 font-medium italic leading-relaxed custom-scrollbar break-words [overflow-wrap:anywhere]">
                                                {activeBase.descripcion || 'Sin descripción adicional.'}
                                            </p>
                                        </AppHint>
                                        {isProjectVariant && (
                                            <button
                                                type="button"
                                                onClick={(event) => {
                                                    event.stopPropagation();
                                                    handleHighlightSourceBase(activeBase.source_base_id, { scrollIntoView: true });
                                                }}
                                                onMouseEnter={(event) => {
                                                    event.stopPropagation();
                                                    handleHighlightSourceBase(activeBase.source_base_id, { persistMs: 0 });
                                                }}
                                                onMouseLeave={(event) => {
                                                    event.stopPropagation();
                                                    clearHighlightedBase(activeBase.source_base_id);
                                                }}
                                                onFocus={() => handleHighlightSourceBase(activeBase.source_base_id, { persistMs: 0 })}
                                                onBlur={() => clearHighlightedBase(activeBase.source_base_id)}
                                                title={sourceBase?.nombre || `Base maestra #${activeBase.source_base_id}`}
                                                className="mt-1.5 line-clamp-2 text-left text-[10px] font-semibold text-sky-700 leading-relaxed hover:text-sky-800 transition-colors"
                                            >
                                                Proviene de: {sourceBase?.nombre || `Base maestra #${activeBase.source_base_id}`}
                                            </button>
                                        )}
                                    </div>

                                    {/* Actions / Stats Row */}
                                    <div className="space-y-3">
                                        {isGroup && base.revisions.length > 1 ? (
                                            <div onClick={e => e.stopPropagation()} className="relative">
                                                <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
                                                    <SortAsc className="w-3 h-3 text-zinc-400" />
                                                </div>
                                                <SearchableSelect 
                                                    options={base.revisions.map(r => ({ id: r.id, nombre: `Rev ${String(r.revision || 0).padStart(2, '0')} - ${r.codigo_unico}` }))} 
                                                    value={currentId} 
                                                    valueKey="id"
                                                    onChange={val => setSelectedRevisions(prev => ({ ...prev, [base.codigo_root]: val }))}
                                                    className="!h-9 !pl-8 text-[10px] font-bold rounded-xl bg-zinc-50/50 border-zinc-100"
                                                />
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 flex items-center justify-between px-2.5 py-1.5 bg-zinc-50/80 rounded-xl border border-zinc-100">
                                                    <span className="text-[8px] font-black uppercase text-zinc-400">Indirectos</span>
                                                    <span className="text-[10px] font-black text-zinc-900 italic">{activeBase.porcentaje_indirectos}%</span>
                                                </div>
                                                <div className="flex-1 flex items-center justify-between px-2.5 py-1.5 bg-zinc-50/80 rounded-xl border border-zinc-100">
                                                    <span className="text-[8px] font-black uppercase text-zinc-400">Unidad</span>
                                                    <span className="text-[10px] font-bold text-zinc-600 truncate">{activeBase.unidad_tiempo}</span>
                                                </div>
                                            </div>
                                        )}

                                        {/* Footer Status */}
                                        <div className="flex items-center justify-between pt-3 border-t border-zinc-50">
                                            <div className="flex items-center gap-1.5 min-w-0">
                                                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${isVisuallySelected ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.3)]' : 'bg-zinc-200'}`} />
                                                <span className={`text-[8px] font-black uppercase truncate ${isVisuallySelected ? 'text-green-600' : 'text-zinc-400'}`}>{isVisuallySelected ? 'Activa ahora' : 'No seleccionada'}</span>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-[9px] font-black text-zinc-400 tabular-nums lowercase tracking-tight">
                                                    <span className="hidden sm:inline">act. </span>{formatDate(activeBase.ultima_modificacion || activeBase.fecha_creacion)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* Modals */}
            <AnimatePresence>
                {showCreateModal && (
                    <AppModalShell isOpen={showCreateModal} size="lg" zIndex="z-[100]" panelClassName="rounded-[3rem]" onClose={() => setShowCreateModal(false)}>
                        <AppModalHeader 
                            title={editingBase ? (isCloning ? 'Clonar Base' : 'Configuración de Base') : 'Nueva Base Maestra'} 
                            subtitle="Establezca los parámetros técnicos y regionales de su repositorio."
                            icon={Database}
                            onClose={() => setShowCreateModal(false)}
                        />
                        <div className="p-10">
                            <form onSubmit={handleCreate} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Código Autogenerado</Label>
                                            <div className="h-12 bg-zinc-50 border border-zinc-200 rounded-2xl flex items-center px-4 text-xs font-black text-zinc-400 italic font-mono uppercase">{nextCode || 'BT-XXXX'}</div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Denominación</Label>
                                            <Input required value={newBase.nombre} onChange={e => setNewBase({...newBase, nombre: e.target.value})} className="h-12 rounded-2xl font-bold uppercase" placeholder="Ej: Base Maestra 2026" />
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Indirectos Globales (%)</Label>
                                            <Input value={newBase.porcentaje_indirectos} onChange={e => setNewBase({...newBase, porcentaje_indirectos: e.target.value})} className="h-12 rounded-2xl font-black text-center" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Mercado / Región</Label>
                                            <SearchableSelect options={paises} value={newBase.pais_id} valueKey="id" onChange={val => { const p = paises.find(x => x.id === val); setNewBase({...newBase, pais_id: val, moneda: p?.moneda || 'USD'}); }} className="h-12 rounded-2xl" />
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Observaciones Técnicas</Label>
                                    <textarea value={newBase.observaciones || ''} onChange={e => setNewBase({...newBase, observaciones: e.target.value})} className="w-full h-24 p-5 bg-zinc-50 border border-zinc-100 rounded-[2rem] text-xs font-medium outline-none focus:border-[#F39200] resize-none" />
                                </div>
                                {editingBase?.tipo === 'Base de Proyecto' && !isCloning && (
                                    <div className="rounded-[2rem] border border-sky-100 bg-sky-50 px-5 py-4 text-[10px] font-semibold leading-relaxed text-sky-700">
                                        El descriptor de una base de proyecto no se edita aquí. Se sincroniza automáticamente al cambiar el nombre del proyecto.
                                    </div>
                                )}
                                <div className="flex gap-4 pt-4">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 h-14 bg-zinc-50 text-zinc-400 font-black uppercase tracking-widest text-[10px] rounded-2xl">Cancelar</button>
                                    <LiquidButton type="submit" className="flex-[2] !h-14 bg-[#1A1A1A] text-white">
                                        <Save className="w-4 h-4 mr-2" /> {editingBase && !isCloning ? 'Actualizar Base' : 'Guardar Repositorio'}
                                    </LiquidButton>
                                </div>
                            </form>
                        </div>
                    </AppModalShell>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showDeleteModal && (
                    <AppModalShell isOpen={showDeleteModal} size="sm" zIndex="z-[200]" panelClassName="rounded-[3rem]" onClose={() => setShowDeleteModal(false)}>
                        <div className="p-10 text-center">
                            <div className="w-20 h-20 bg-red-100 text-red-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6"><Trash2 className="w-10 h-10" /></div>
                            <h2 className="text-2xl font-black uppercase mb-4 text-zinc-900 leading-tight">¿Eliminar Registro?</h2>
                            <p className="text-zinc-500 text-xs font-medium mb-10 leading-relaxed px-4">
                                {linkedProject ? `La base está vinculada a ${linkedProject.nombre}. Se moverá el proyecto completo y sus revisiones a papelera durante 7 días.` : `¿Desea mover ${baseToDelete?.nombre} a papelera durante 7 días?`}
                            </p>
                            <LiquidButton onClick={handleDeleteBaseConfirm} className="w-full !h-14 bg-red-600 text-white rounded-2xl mb-3 uppercase tracking-widest font-black text-[10px]">
                                {deleting ? 'Procesando...' : 'Mover a Papelera'}
                            </LiquidButton>
                            <button onClick={() => setShowDeleteModal(false)} className="w-full h-12 text-zinc-400 font-black uppercase tracking-widest text-[9px]">Cancelar</button>
                        </div>
                    </AppModalShell>
                )}

                {showRecycleModal && (
                    <AppModalShell
                        isOpen={showRecycleModal}
                        size="lg"
                        zIndex="z-[200]"
                        panelClassName="rounded-[2.5rem] max-h-[calc(100dvh-4rem)] flex flex-col"
                        onClose={() => setShowRecycleModal(false)}
                    >
                        <AppModalHeader
                            title="Papelera de bases"
                            subtitle="Retención operativa de 7 días antes del borrado definitivo."
                            icon={Trash2}
                            onClose={() => setShowRecycleModal(false)}
                        />
                        <div className="min-h-0 overflow-y-auto px-6 py-5">
                            {recycleLoading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="flex flex-col items-center gap-4 text-zinc-400">
                                        <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-100 border-t-[#F39200]" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Cargando papelera...</p>
                                    </div>
                                </div>
                            ) : recycledBases.length === 0 ? (
                                <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50/70 px-6 py-12 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sin bases en papelera</p>
                                    <p className="mt-3 text-sm font-medium text-zinc-500">Las bases eliminadas se mostrarán aquí durante 7 días.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {recycledBases.map((base) => {
                                        const baseName = base.trash_original_nombre || base.nombre;
                                        const baseCode = base.trash_original_codigo_unico || base.codigo_unico;
                                        const isBusy = recycleActionId === base.id;
                                        return (
                                            <div key={base.id} className="rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
                                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                    <div className="min-w-0">
                                                        <p className="truncate text-[12px] font-black uppercase tracking-tight text-zinc-900">{baseName}</p>
                                                        <div className="mt-1 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                                            <span>{baseCode || 'Sin código'}</span>
                                                            <span>{base.tipo || 'Base'}</span>
                                                            <span>Eliminada: {formatDateTime(base.deleted_at)}</span>
                                                            <span>Expira: {formatDateTime(base.recycle_expires_at)}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleRestoreRecycledBase(base)}
                                                            disabled={isBusy}
                                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.85rem] border border-emerald-100 bg-emerald-50 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 transition hover:border-emerald-300 disabled:opacity-50"
                                                        >
                                                            <RotateCcw className="h-3.5 w-3.5" />
                                                            Restaurar
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handlePurgeRecycledBase(base)}
                                                            disabled={isBusy}
                                                            className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.85rem] border border-rose-100 bg-rose-50 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-300 disabled:opacity-50"
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                            Borrar
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                        <AppModalFooter>
                            <button
                                type="button"
                                onClick={() => setShowRecycleModal(false)}
                                className="h-11 rounded-[1rem] bg-zinc-50 px-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:bg-zinc-100"
                            >
                                Cerrar
                            </button>
                            <LiquidButton
                                onClick={fetchRecycledBases}
                                disabled={recycleLoading}
                                className="!h-11 bg-[#1A1A1A] text-white"
                            >
                                <RotateCcw className="mr-2 h-4 w-4" />
                                Actualizar
                            </LiquidButton>
                        </AppModalFooter>
                    </AppModalShell>
                )}

                {syncHistoryBase && (
                    <AppModalShell
                        isOpen={Boolean(syncHistoryBase)}
                        size="lg"
                        zIndex="z-[100]"
                        panelClassName="rounded-[2.5rem] max-h-[calc(100dvh-4rem)] flex flex-col"
                        onClose={() => setSyncHistoryBase(null)}
                    >
                        <AppModalHeader
                            title="Historial de sincronización"
                            subtitle={syncHistoryBase.nombre}
                            icon={RefreshCw}
                            onClose={() => setSyncHistoryBase(null)}
                        />
                        <div className="min-h-0 overflow-y-auto px-6 py-5">
                            {loadingSyncHistory ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="flex flex-col items-center gap-4 text-zinc-400">
                                        <div className="w-10 h-10 border-4 border-zinc-100 border-t-[#F39200] rounded-full animate-spin" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Cargando historial...</p>
                                    </div>
                                </div>
                            ) : syncHistoryItems.filter((item) => SYNC_HISTORY_USABLE_EVENT_TYPES.has(item.event_type)).length === 0 ? (
                                <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50/70 px-6 py-12 text-center">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sin eventos registrados</p>
                                    <p className="mt-3 text-sm font-medium text-zinc-500">Esta base todavía no tiene sincronizaciones o reversiones operativas trazadas.</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {syncHistoryItems
                                        .filter((item) => SYNC_HISTORY_USABLE_EVENT_TYPES.has(item.event_type))
                                        .map((item) => {
                                        const payload = item.payload || {};
                                        const added = payload.added || null;
                                        const updated = payload.updated || null;
                                        const impacts = payload.impacts || null;
                                        const revision = payload.revision;
                                        const canUndo = Boolean(payload.undo_available && item.event_type === 'project_base_sync_executed');
                                        const title = SYNC_HISTORY_EVENT_LABELS[item.event_type] || 'Evento de sincronización';
                                        const modeLabel = payload.mode ? (SYNC_MODE_LABELS[payload.mode] || payload.mode) : null;
                                        const eventDate = formatDate(item.created_at);
                                        const impactBits = [];
                                        if (added && (added.apus || added.resources || added.subcategories)) {
                                            impactBits.push(`Nuevos: ${added.apus || 0} APUs · ${added.resources || 0} recursos`);
                                        }
                                        if (updated && (updated.apu_values || updated.resource_values)) {
                                            impactBits.push(`Ajustados: ${updated.apu_values || 0} APUs · ${updated.resource_values || 0} recursos`);
                                        }
                                        if (impacts && (impacts.presupuestos || impacts.lineas_presupuesto)) {
                                            impactBits.push(`Presupuesto: ${impacts.presupuestos || 0} presupuestos · ${impacts.lineas_presupuesto || 0} líneas`);
                                        }
                                        const impactSummary = impactBits.join(' · ');
                                        const legacyWithoutUndo = item.event_type === 'project_base_sync_missing_completed';
                                        return (
                                            <div key={item.id} className="rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <p className="text-[11px] font-black text-zinc-900">{title}</p>
                                                            {modeLabel && (
                                                                <span className="rounded-full bg-orange-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-[#C96E00]">
                                                                    {modeLabel}
                                                                </span>
                                                            )}
                                                            {typeof revision === 'number' && (
                                                                <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.16em] text-sky-700">
                                                                    Rev R{String(revision).padStart(3, '0')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="mt-1.5 text-[11px] font-medium text-zinc-500">
                                                            {item.actor_email || 'Sistema'} · {eventDate}
                                                        </p>
                                                        {impactSummary && (
                                                            <p className="mt-2 text-[11px] font-semibold text-zinc-700">
                                                                {impactSummary}
                                                            </p>
                                                        )}
                                                        {legacyWithoutUndo && (
                                                            <p className="mt-2 text-[11px] font-semibold text-amber-700">
                                                                Ejecutado en modo compatible legado. No dispone de reversión de un paso.
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        {canUndo && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleRevertSync(syncHistoryBase, item.id)}
                                                                className="h-9 rounded-2xl border border-amber-200 bg-amber-50 px-4 text-[10px] font-black uppercase tracking-widest text-amber-700 transition-colors hover:border-amber-300 hover:text-amber-800"
                                                                disabled={syncingBaseId === syncHistoryBase?.id}
                                                            >
                                                                Revertir
                                                            </button>
                                                        )}
                                                        <span className="rounded-full bg-zinc-900 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest text-white">
                                                            {item.event_type === 'project_base_sync_reverted' ? 'undo' : 'sync'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </AppModalShell>
                )}

                {syncPreviewBase && (
                    <AppModalShell
                        isOpen={Boolean(syncPreviewBase)}
                        size="xl"
                        zIndex="z-[110]"
                        overlayClassName="items-start overflow-y-auto py-6"
                        panelClassName="rounded-[2.5rem] max-h-[calc(100dvh-3rem)] flex flex-col"
                        onClose={() => { if (!syncingBaseId) { setSyncPreviewBase(null); setSyncPreviewData(null); setSyncPreviewTargetBaseId(null); } }}
                    >
                        <AppModalHeader
                            title="Sincronizar base de proyecto"
                            subtitle={syncPreviewTargetBase?.nombre || syncPreviewBase.nombre}
                            icon={RefreshCw}
                            onClose={() => { if (!syncingBaseId) { setSyncPreviewBase(null); setSyncPreviewData(null); setSyncPreviewTargetBaseId(null); } }}
                        />
                        <div className="min-h-0 overflow-y-auto px-6 py-5">
                            {(() => {
                                const summary = syncPreviewData?.summary || {};
                                const hasChanges = Boolean(
                                    summary.missing_subcategories || summary.missing_resources || summary.missing_apus || summary.value_apus || summary.divergent_apus_untouched
                                );
                                const targetRevision = syncPreviewData?.target_revision;
                                const {
                                    missingApus,
                                    valueApus,
                                    missingResources,
                                    missingSubcategories,
                                    presupuestosConLineas,
                                    lineasPresupuesto,
                                    budgetImpacted,
                                } = getSyncSummaryMetrics(summary);
                                const presupuestoChanges = budgetImpacted;
                                const cronogramaChanges = budgetImpacted;
                                const currentTargetBase = syncPreviewTargetBase || syncPreviewBase;
                                const sourceBaseName = bases.find((base) => base.id === currentTargetBase?.source_base_id)?.nombre;
                                const structuralCards = [
                                    { label: 'APUs nuevas', value: missingApus },
                                    { label: 'APUs por reajustar', value: valueApus },
                                    { label: 'Recursos a actualizar', value: missingResources },
                                    { label: 'Subcategorías implicadas', value: missingSubcategories },
                                ];
                                const syncModeDescriptions = {
                                    new_apus: 'Añade APUs faltantes desde la base maestra.',
                                    apu_values: 'Reajusta valores de APUs ya existentes.',
                                    integral: 'Añade APUs nuevas y reajusta valores existentes.',
                                };
                                const revisionHasBudget = presupuestosConLineas > 0 || lineasPresupuesto > 0;
                                const impactMessage = presupuestoChanges
                                    ? 'Esta sincronización modificará valores del proyecto seleccionado.'
                                    : 'Esta sincronización ajustará la base seleccionada sin impacto directo en el presupuesto operativo.';

                                return (
                                    <>
                                        <div className="flex items-start justify-between gap-4 rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-4 shadow-[0_10px_22px_rgba(0,0,0,0.03)]">
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Contexto operativo</p>
                                                <h3 className="mt-1.5 text-[15px] font-black text-zinc-900">{currentTargetBase?.nombre}</h3>
                                                <p className="mt-1.5 text-[11px] font-medium text-zinc-500">
                                                    {sourceBaseName ? `Base maestra origen: ${sourceBaseName}` : 'Base maestra origen vinculada'}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={async () => {
                                                    if (syncingBaseId) return;
                                                    const currentBase = syncPreviewBase;
                                                    setSyncPreviewBase(null);
                                                    setSyncPreviewData(null);
                                                    setSyncPreviewTargetBaseId(null);
                                                    if (currentBase) {
                                                        await handleOpenSyncHistory(currentBase);
                                                    }
                                                }}
                                                className="shrink-0 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700"
                                                disabled={Boolean(syncingBaseId)}
                                            >
                                                Historial
                                            </button>
                                        </div>

                                        <div className="mt-4 space-y-4">
                                            <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-4 shadow-[0_10px_22px_rgba(0,0,0,0.03)]">
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">1. Tipo de sincronización</p>
                                                <div className="mt-3 grid gap-3 md:grid-cols-3">
                                                    {Object.entries(SYNC_MODE_LABELS).map(([modeKey, label]) => (
                                                        <button
                                                            key={modeKey}
                                                            type="button"
                                                            onClick={async () => {
                                                                setSyncPreviewMode(modeKey);
                                                                await loadSyncPreview(syncPreviewTargetBaseId || syncPreviewBase.id, modeKey);
                                                            }}
                                                            className={`rounded-[1.3rem] border px-4 py-3.5 text-left transition-colors ${syncPreviewMode === modeKey ? 'border-[#F39200] bg-orange-50 text-[#F39200]' : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-zinc-300'}`}
                                                        >
                                                            <p className="text-[10px] font-black uppercase tracking-[0.18em]">{label}</p>
                                                            <p className={`mt-2 text-[11px] font-semibold normal-case tracking-normal ${syncPreviewMode === modeKey ? 'text-[#A35A00]' : 'text-zinc-500'}`}>
                                                                {syncModeDescriptions[modeKey]}
                                                            </p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-4 shadow-[0_10px_22px_rgba(0,0,0,0.03)]">
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">2. Revisión objetivo</p>
                                                {syncRevisionOptions.length > 1 ? (
                                                    <div className="mt-3 max-w-md">
                                                        <SearchableSelect
                                                            options={syncRevisionOptions.map((revisionBase) => ({
                                                                id: revisionBase.id,
                                                                nombre: `Rev ${String(revisionBase.revision || 0).padStart(3, '0')} · ${revisionBase.nombre}`,
                                                            }))}
                                                            value={syncPreviewTargetBaseId || syncPreviewBase.id}
                                                            valueKey="id"
                                                            onChange={async (nextBaseId) => {
                                                                setSyncPreviewTargetBaseId(nextBaseId);
                                                                await loadSyncPreview(nextBaseId, syncPreviewMode);
                                                            }}
                                                            className="h-12 rounded-2xl"
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="mt-3 rounded-[1.3rem] border border-zinc-100 bg-zinc-50 px-4 py-3 max-w-md">
                                                        <p className="text-sm font-black text-zinc-900">
                                                            Revisión R{String(targetRevision || syncPreviewBase.revision || 0).padStart(3, '0')}
                                                        </p>
                                                    </div>
                                                )}
                                                <p className="mt-2.5 text-[11px] font-medium text-zinc-500">
                                                    {revisionHasBudget ? `Con presupuesto operativo activo (${lineasPresupuesto} líneas con APU).` : 'Sin presupuesto operativo afectado en esta revisión.'}
                                                </p>
                                            </div>

                                            <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-4 shadow-[0_10px_22px_rgba(0,0,0,0.03)]">
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">3. Impacto esperado</p>
                                                <div className="mt-4">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Impacto estructural</p>
                                                    <div className="mt-2.5 grid grid-cols-2 md:grid-cols-4 gap-3">
                                                        {structuralCards.map((card) => (
                                                            <div key={card.label} className="rounded-xl border border-zinc-100 bg-zinc-50 px-4 py-3.5">
                                                                <p className="text-[8px] font-black uppercase text-zinc-400">{card.label}</p>
                                                                <p className="mt-1.5 text-lg font-black text-zinc-900">{card.value}</p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="mt-4">
                                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Impacto operativo</p>
                                                    <div className="mt-2.5 grid gap-3 md:grid-cols-3">
                                                        <div className={`rounded-xl border px-4 py-3.5 ${presupuestoChanges ? 'border-amber-200 bg-amber-50/90' : 'border-emerald-200 bg-emerald-50/90'}`}>
                                                            <p className={`text-[8px] font-black uppercase ${presupuestoChanges ? 'text-amber-700' : 'text-emerald-700'}`}>Presupuesto</p>
                                                            <p className={`mt-1.5 text-base font-black ${presupuestoChanges ? 'text-amber-800' : 'text-emerald-800'}`}>
                                                                {presupuestoChanges ? 'Tendrá variación' : 'Sin variación'}
                                                            </p>
                                                        </div>
                                                        <div className={`rounded-xl border px-4 py-3.5 ${cronogramaChanges ? 'border-amber-200 bg-amber-50/90' : 'border-emerald-200 bg-emerald-50/90'}`}>
                                                            <p className={`text-[8px] font-black uppercase ${cronogramaChanges ? 'text-amber-700' : 'text-emerald-700'}`}>Cronogramas y derivados</p>
                                                            <p className={`mt-1.5 text-base font-black ${cronogramaChanges ? 'text-amber-800' : 'text-emerald-800'}`}>
                                                                {cronogramaChanges ? 'Tendrán variación' : 'Sin variación'}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-xl border border-slate-200 bg-slate-50/90 px-4 py-3.5">
                                                            <p className="text-[8px] font-black uppercase text-slate-500">Tanteos</p>
                                                            <p className="mt-1.5 text-base font-black text-slate-900">
                                                                Se conservarán recalculados
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {!hasChanges && (
                                                <div className="rounded-[1.75rem] border border-dashed border-zinc-200 bg-zinc-50/70 px-6 py-10 text-center">
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sin cambios pendientes</p>
                                                    <p className="mt-3 text-sm font-medium text-zinc-500">No se detectaron cambios operativos pendientes frente a la Base Maestra.</p>
                                                </div>
                                            )}

                                            <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-4 shadow-[0_10px_22px_rgba(0,0,0,0.03)]">
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">4. Confirmación</p>
                                                <p className="mt-2.5 text-sm font-medium leading-relaxed text-zinc-600">
                                                    {impactMessage} {presupuestoChanges ? '¿Desea continuar?' : '¿Confirma la sincronización?'}
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                );
                            })()}
                        </div>
                        <AppModalFooter className="shrink-0 border-t border-zinc-200 bg-white/95 shadow-[0_-10px_24px_rgba(15,23,42,0.08)] backdrop-blur-sm">
                            {(() => {
                                const summary = syncPreviewData?.summary || {};
                                const hasChanges = Boolean(
                                    summary.missing_subcategories || summary.missing_resources || summary.missing_apus || summary.value_apus || summary.divergent_apus_untouched
                                );

                                return (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => { if (!syncingBaseId) { setSyncPreviewBase(null); setSyncPreviewData(null); setSyncPreviewTargetBaseId(null); } }}
                                            className="h-12 rounded-2xl border border-zinc-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition-colors hover:text-zinc-700"
                                            disabled={Boolean(syncingBaseId)}
                                        >
                                            Cancelar
                                        </button>
                                        <LiquidButton
                                            onClick={() => executeSyncOperation(syncPreviewTargetBase || syncPreviewBase, syncPreviewMode, summary)}
                                            className="!h-12 bg-[#1A1A1A] text-white"
                                            disabled={Boolean(syncingBaseId) || !hasChanges}
                                        >
                                            <RefreshCw className={`mr-2 h-4 w-4 ${syncingBaseId ? 'animate-spin' : ''}`} />
                                            {syncingBaseId ? 'Sincronizando...' : 'Sincronizar'}
                                        </LiquidButton>
                                    </>
                                );
                            })()}
                        </AppModalFooter>
                    </AppModalShell>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BasesTrabajo;
