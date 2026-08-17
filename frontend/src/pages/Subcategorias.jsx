import { useState, useEffect, useContext, useMemo, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
 
import { AnimatePresence } from 'framer-motion';
import { includesNormalized } from '../utils/normalizeSearch';
import {
    Plus,
    Edit2,
    Trash2,
    Copy,
    Download,
    Upload,
    ChevronRight,
    ArrowLeft,
    Save,
    X,
    Database,
    Package,
    Check,
    Wrench,
    Truck,
    Users,
    FileText,
    Search,
    Clipboard,
    Move,
    SpellCheck,
    GripVertical,
    AlertCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { subcategoriasItemsApi } from '../api/subcategoriasItems'; // Changed to named import
import utilsApi from '../api/utils'; // Added utilsApi import
import { maestrosApi } from '../api/maestros'; // Added maestrosApi import
import ClearSearchField from '../components/ui/ClearSearchField';
import SoftSelectToggle from '../components/ui/SoftSelectToggle';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { LiquidButton } from '../components/ui/liquid-button';
import SearchableSelect from '../components/ui/searchable-select'; // Import SearchableSelect
import { buildOmniClassOptions, getOmniClassTableForSubcategoria } from '../utils/omniclass';
import BulkDeleteConfirmModal from '../components/precios-unitarios/BulkDeleteConfirmModal';
import ImportFormatHint from '../components/precios-unitarios/ImportFormatHint';
import CatalogSidebarCard from '../components/ui/CatalogSidebarCard';
import { AppModalShell, AppModalHeader, AppModalBody, AppModalFooter } from '../components/ui/app-modal';
import CodeColorizer from '../utils/codeColorizer';
import { normalizeTextInputValue } from '../utils/normalizeInputValue';
import { appAlert, appConfirm } from '../utils/appDialog';
import useMarketplaceOrigin from '../hooks/useMarketplaceOrigin';
import MarketplaceOriginBadgeSet from '../components/marketplace/MarketplaceOriginBadgeSet';
import * as descriptionCapitalization from '../utils/descriptionCapitalization';
import AnimatedSelect from '../components/ui/AnimatedSelect';

// Las 5 subcategorías fijas del sistema
const SUBCATEGORIAS = [
    { codigo: 1, nombre: 'Equipos y Herramientas', icon: Wrench, color: 'bg-blue-50 border-blue-200 text-blue-600' },
    { codigo: 2, nombre: 'Materiales', icon: Package, color: 'bg-green-50 border-green-200 text-green-600' },
    { codigo: 3, nombre: 'Transporte', icon: Truck, color: 'bg-yellow-50 border-yellow-200 text-yellow-600' },
    { codigo: 4, nombre: 'Mano de Obra', icon: Users, color: 'bg-purple-50 border-purple-200 text-purple-600' },
    { codigo: 5, nombre: 'APU', icon: FileText, color: 'bg-orange-50 border-orange-200 text-orange-600' },
];

// Variante visual reversible para la sidebar de familias de subcategorias.
const USE_ENHANCED_SUBCATEGORIA_FAMILY_LIST = true;

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

const normalizeClipboardText = (value) => cleanClipboardCell(value).replace(/\s+/g, ' ');

const parseSubcategoriaImportLine = (line, index) => {
    const parts = line.split('\t').map(cleanClipboardCell);
    const hasRealTabColumns = parts.filter(Boolean).length > 1;

    if (parts.length === 0 || !parts.some(Boolean)) {
        return null;
    }

    // Skip header if detected
    if (index === 0 && (
        parts[0]?.toLowerCase().includes('código') ||
        parts[0]?.toLowerCase().includes('descripcion') ||
        parts[0]?.toLowerCase().includes('descripción') ||
        parts[1]?.toLowerCase().includes('descripcion') ||
        parts[1]?.toLowerCase().includes('descripción')
    )) {
        return null;
    }

    if (!hasRealTabColumns) {
        const descripcion = normalizeClipboardText(
            (parts.length > 1 && looksLikeRowLabel(parts[0]) && parts[1])
                ? parts.slice(1).join(' ')
                : parts.join(' ')
        );
        if (!descripcion) return null;
        return { descripcion, observaciones: '', omniclass_codigo: '', omniclass_titulo: '' };
    }

    let offset = 0;
    if (parts.length > 1 && looksLikeRowLabel(parts[0]) && parts[1]) {
        offset = 1;
    }

    const descripcion = normalizeClipboardText(parts[offset] || '');
    const observaciones = normalizeClipboardText(parts[offset + 1] || '');
    const omniclass_codigo = normalizeClipboardText(parts[offset + 2] || '');
    const omniclass_titulo = normalizeClipboardText(parts[offset + 3] || '');
    
    if (!descripcion) return null;

    return { descripcion, observaciones, omniclass_codigo, omniclass_titulo };
};

const buildSubcategoriaImportPreview = (rawText, currentItems, selectedSubcategoria) => {
    const existingDescriptions = new Set(
        (currentItems || []).map(item => `${selectedSubcategoria}::${cleanClipboardCell(item.descripcion).toLowerCase()}`)
    );
    const seen = new Set();

    return rawText
        .split('\n')
        .map((line, index) => {
            const raw = line;
            const parsed = parseSubcategoriaImportLine(line, index);
            let reason = '';
            let valid = !!parsed?.descripcion;

            if (!raw.trim()) return null;
            if (!parsed?.descripcion) {
                valid = false;
                reason = 'Fila vacía o sin descripción interpretable';
            } else {
                const key = `${selectedSubcategoria}::${cleanClipboardCell(parsed.descripcion).toLowerCase()}`;
                if (seen.has(key)) {
                    valid = false;
                    reason = 'Duplicada dentro del pegado';
                } else if (existingDescriptions.has(key)) {
                    valid = false;
                    reason = 'Ya existe en la categoría destino';
                } else {
                    seen.add(key);
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

const Subcategorias = () => {
    const { user, selectedBaseTrabajo, selectedEmpresa } = useContext(AuthContext);
    const activeBaseOrigin = useMarketplaceOrigin('base_trabajo', selectedBaseTrabajo?.id);
    const useOmniClass = selectedEmpresa?.use_omniclass !== false;
    const navigate = useNavigate();

    // Estado
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState({});
    const [selectedSubcategoria, setSelectedSubcategoria] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [selectedItems, setSelectedItems] = useState([]);
    const [showImportModal, setShowImportModal] = useState(false);
    const [importData, setImportData] = useState('');
    const [dragOverCategory, setDragOverCategory] = useState(null);
    const [dragOverItemId, setDragOverItemId] = useState(null);
    const [dragOverItemPosition, setDragOverItemPosition] = useState('before');
    const [, setSpellSuggestions] = useState([]);
    const [isCheckingSpell, setIsCheckingSpell] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
    const [bulkDeleteStep, setBulkDeleteStep] = useState(1);
    const [bulkDeleting, setBulkDeleting] = useState(false);

    // OmniClass Search State
    const [omniclassOptions, setOmniclassOptions] = useState([]);
    const [isOmniLoading, setIsOmniLoading] = useState(false);
    const currentOmniClassTable = getOmniClassTableForSubcategoria(selectedSubcategoria);

    // Formulario
    const [form, setForm] = useState({
        descripcion: '',
        observaciones: '',
        omniclass_codigo: '',
        omniclass_titulo: ''
    });

    const currentItems = useMemo(() => items[selectedSubcategoria] || [], [items, selectedSubcategoria]);

    const importPreview = useMemo(
        () => buildSubcategoriaImportPreview(importData, currentItems, selectedSubcategoria),
        [importData, currentItems, selectedSubcategoria]
    );

    const validImportRows = importPreview.filter(item => item.valid);
    const invalidImportRows = importPreview.filter(item => !item.valid);
    const duplicateImportRows = invalidImportRows.filter(item => (item.reason || '').toLowerCase().includes('duplic'));

    const closeModal = useCallback(() => {
        setShowModal(false);
        setEditingItem(null);
        setForm({ 
            descripcion: '', 
            observaciones: '', 
            omniclass_codigo: '', 
            omniclass_titulo: '' 
        });
        setSpellSuggestions([]); // Clear spell suggestions on close
    }, []);

    const closeImportModal = useCallback(() => {
        setShowImportModal(false);
        setImportData('');
    }, []);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await subcategoriasItemsApi.getAll(selectedBaseTrabajo.id, null, empId);
            const grouped = {};
            SUBCATEGORIAS.forEach(sub => {
                grouped[sub.codigo] = res.data.filter(item => item.subcategoria_codigo === sub.codigo);
            });
            setItems(grouped);
        } catch (error) {
            globalThis.reportClientError?.("Error cargando items:", error);
        } finally {
            setLoading(false);
        }
    }, [selectedBaseTrabajo, selectedEmpresa, user]);

    useEffect(() => {
        if (!selectedBaseTrabajo) {
            navigate('/precios-unitarios/bases');
            return;
        }
        fetchItems();
    }, [selectedBaseTrabajo, fetchItems, navigate]);

    // Manejar tecla Escape para cerrar el modal
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (showModal) closeModal();
                if (showImportModal) closeImportModal();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [showModal, showImportModal, closeModal, closeImportModal]);

    const handleOmniClassSearch = async (q) => {
        if (!q || q.length < 2) return;
        setIsOmniLoading(true);
        try {
            const res = await maestrosApi.getOmniClassSearch(q, currentOmniClassTable);
            setOmniclassOptions(buildOmniClassOptions(res || []));
        } catch (error) {
            globalThis.reportClientError?.("Error buscando OmniClass:", error);
        } finally {
            setIsOmniLoading(false);
        }
    };

    const handleOmniClassOpen = useCallback(async () => {
        if (omniclassOptions.length > 0 || isOmniLoading) return;
        setIsOmniLoading(true);
        try {
            const res = await maestrosApi.getOmniClassTabla(currentOmniClassTable);
            setOmniclassOptions(buildOmniClassOptions(res || []));
        } catch (error) {
            globalThis.reportClientError?.("Error precargando OmniClass:", error);
        } finally {
            setIsOmniLoading(false);
        }
    }, [currentOmniClassTable, isOmniLoading, omniclassOptions.length]);

    useEffect(() => {
        setOmniclassOptions([]);
    }, [currentOmniClassTable, showModal]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const data = {
                subcategoria_codigo: selectedSubcategoria,
                descripcion: normalizeSubcategoryDisplay(form.descripcion),
                observaciones: form.observaciones || null
            };

            const empId = selectedEmpresa?.id || user?.empresa_id;

            if (editingItem) {
                const updatePayload = {
                    descripcion: normalizeSubcategoryDisplay(form.descripcion),
                    observaciones: form.observaciones,
                    omniclass_codigo: useOmniClass ? form.omniclass_codigo : '',
                    omniclass_titulo: useOmniClass ? form.omniclass_titulo : ''
                };
                await subcategoriasItemsApi.update(editingItem.id, {
                    ...updatePayload
                }, empId);
            } else {
                const createData = {
                    ...data,
                    omniclass_codigo: useOmniClass ? form.omniclass_codigo : '',
                    omniclass_titulo: useOmniClass ? form.omniclass_titulo : ''
                };
                await subcategoriasItemsApi.create(selectedBaseTrabajo.id, createData, empId);
            }

            closeModal();
            fetchItems();
        } catch (error) {
            globalThis.reportClientError?.("Error al guardar:", error);
            let detail = error.response?.data?.detail;

            // Si el error es un objeto o array (validación FastAPI), extraer el mensaje
            if (typeof detail === 'object') {
                if (Array.isArray(detail)) {
                    detail = detail.map(d => `${d.loc.join('.')}: ${d.msg}`).join('\n');
                } else {
                    detail = JSON.stringify(detail);
                }
            }

            appAlert(detail || 'Error al guardar');
        }
    };

    const handleDelete = async (e, item) => {
        if (e) e.stopPropagation();
        const confirmed = await appConfirm({
            title: 'Borrar subcategoría',
            message: `¿Está seguro de borrar la subcategoría "${item.descripcion.substring(0, 30)}..."?\n\nLos códigos se restructurarán automáticamente.`,
            confirmLabel: 'Borrar',
            cancelLabel: 'Cancelar',
            tone: 'danger'
        });
        if (!confirmed) {
            return;
        }
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await subcategoriasItemsApi.delete(item.id, empId);
            fetchItems();
        } catch (error) {
            globalThis.reportClientError?.("Error al borrar:", error);
            appAlert('Error al borrar el item: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleDuplicate = async (e, item) => {
        if (e) e.stopPropagation();
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await subcategoriasItemsApi.duplicate(item.id, empId);
            fetchItems();
        } catch (error) {
            globalThis.reportClientError?.("Error al duplicar:", error);
            appAlert('Error al duplicar el item: ' + (error.response?.data?.detail || error.message));
        }
    };

    const handleExport = async () => {
        if (selectedItems.length === 0) {
            appAlert('Seleccione al menos un item para exportar');
            return;
        }
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await subcategoriasItemsApi.export(selectedItems, empId);
            // Copiar al portapapeles
            await navigator.clipboard.writeText(res.data.clipboard);
            appAlert(`Se copiaron ${res.data.count} items al portapapeles\n\nPegue en Excel para ver los datos`);
            setSelectedItems([]);
        } catch {
            appAlert('Error al exportar');
        }
    };

    const handleImport = async () => {
        if (!importData.trim()) return;

        const itemsToImport = validImportRows.map(item => item.parsed);

        if (itemsToImport.length === 0) {
            appAlert("No se encontraron datos válidos para importar.");
            return;
        }

        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await subcategoriasItemsApi.import(
                selectedBaseTrabajo.id,
                selectedSubcategoria,
                itemsToImport,
                empId
            );
            const { imported, duplicates, errors } = res.data;

            let message = `Importación finalizada:\n`;
            message += `✅ Creados: ${imported}\n`;
            if (duplicates > 0) message += `⚠️ Omitidos (ya existían): ${duplicates}\n`;

            if (errors && errors.length > 0) {
                message += `\nDetalles / Errores:\n- ${errors.slice(0, 5).join('\n- ')}`;
                if (errors.length > 5) message += `\n... y ${errors.length - 5} más.`;
            }

            appAlert(message);

            if (imported > 0) {
                fetchItems();
                setShowImportModal(false);
                setImportData('');
            }
        } catch (error) {
            globalThis.reportClientError?.("Error al importar:", error);
            appAlert("Error al importar: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleSpellCheck = async () => {
        if (!form.observaciones.trim()) {
            appAlert("No hay texto en Observaciones para revisar.");
            return;
        }
        setIsCheckingSpell(true);
        try {
            const res = await utilsApi.spellcheck(form.observaciones);
            if (res.data.has_errors) {
                const suggestionsList = res.data.suggestions.join('\n');
                const confirmed = await appConfirm({
                    title: 'Aplicar corrección ortográfica',
                    message: `Se han encontrado posibles mejoras ortográficas:\n\n${suggestionsList}\n\n¿Desea aplicar la corrección sugerida?\n\n"${res.data.corrected}"`,
                    confirmLabel: 'Aplicar',
                    cancelLabel: 'Mantener actual',
                    tone: 'info'
                });
                if (confirmed) {
                    setForm(prev => ({ ...prev, observaciones: res.data.corrected }));
                }
            } else {
                appAlert("No se detectaron errores ortográficos.");
            }
        } catch (error) {
            globalThis.reportClientError?.("Error al revisar ortografía:", error);
            appAlert("Error al revisar ortografía: " + (error.response?.data?.detail || error.message));
        } finally {
            setIsCheckingSpell(false);
        }
    };

    const openEdit = (e, item) => {
        if (e) e.stopPropagation();
        setEditingItem(item);
        setForm({
            descripcion: normalizeSubcategoryDisplay(item.descripcion),
            observaciones: item.observaciones || '',
            omniclass_codigo: item.omniclass_codigo || '',
            omniclass_titulo: item.omniclass_titulo || ''
        });
        setShowModal(true);
    };

    const openNew = () => {
        setEditingItem(null);
        setForm({ 
            descripcion: '', 
            observaciones: '',
            omniclass_codigo: '',
            omniclass_titulo: ''
        });
        setShowModal(true);
    };

    const openImportModal = () => {
        setImportData('');
        setShowImportModal(true);
    };

    const toggleSelectItem = (id) => {
        setSelectedItems(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const closeBulkDeleteModal = () => {
        if (bulkDeleting) return;
        setShowBulkDeleteModal(false);
        setBulkDeleteStep(1);
    };

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) {
            appAlert('Seleccione al menos una subcategoría para borrar.');
            return;
        }
        setShowBulkDeleteModal(true);
    };

    const handleBulkDeleteConfirm = async () => {
        try {
            setBulkDeleting(true);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const res = await subcategoriasItemsApi.bulkDelete(selectedItems, empId);
            appAlert(res.data.message);
            setSelectedItems([]);
            closeBulkDeleteModal();
            fetchItems();
        } catch (error) {
            appAlert(error.response?.data?.detail || 'Error al ejecutar el borrado masivo.');
        } finally {
            setBulkDeleting(false);
        }
    };

    // Handlers para Drag & Drop
    const handleDragStart = (e, item) => {
        e.dataTransfer.setData('itemId', item.id);
        e.dataTransfer.setData('sourceCategory', item.subcategoria_codigo);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e, targetSubcat) => {
        e.preventDefault();

        // Auto-scroll logic for the container
        const scrollContainer = document.getElementById('categories-scroll-container');
        if (scrollContainer) {
            const { top, bottom } = scrollContainer.getBoundingClientRect();
            const threshold = 50;

            if (e.clientY < top + threshold) {
                scrollContainer.scrollTop -= 10;
            } else if (e.clientY > bottom - threshold) {
                scrollContainer.scrollTop += 10;
            }
        }

        // Usamos selectedSubcategoria que es la categoría actual de donde vienen los items
        if (selectedSubcategoria !== targetSubcat) {
            setDragOverCategory(targetSubcat);
            e.dataTransfer.dropEffect = 'move';
        }
    };

    const handleDragLeave = () => {
        setDragOverCategory(null);
    };

    const handleItemDragOver = (e, targetItem) => {
        e.preventDefault();
        const draggedItemId = parseInt(e.dataTransfer.getData('itemId'));
        const sourceSubcat = parseInt(e.dataTransfer.getData('sourceCategory'));
        if (!draggedItemId || sourceSubcat !== selectedSubcategoria || draggedItemId === targetItem.id) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        setDragOverItemId(targetItem.id);
        setDragOverItemPosition(e.clientY >= midpoint ? 'after' : 'before');
        e.dataTransfer.dropEffect = 'move';
    };

    const handleItemDragLeave = (e) => {
        const related = e.relatedTarget;
        if (related && e.currentTarget.contains(related)) return;
        setDragOverItemId(null);
    };

    const handleItemDrop = async (e, targetItem) => {
        e.preventDefault();
        const itemId = parseInt(e.dataTransfer.getData('itemId'));
        const sourceSubcat = parseInt(e.dataTransfer.getData('sourceCategory'));
        const placeAfter = dragOverItemPosition === 'after';
        setDragOverItemId(null);

        if (!itemId || sourceSubcat !== selectedSubcategoria || itemId === targetItem.id) return;

        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await subcategoriasItemsApi.reorder(itemId, targetItem.id, placeAfter, empId);
            fetchItems();
        } catch (error) {
            globalThis.reportClientError?.("Error al reordenar item:", error);
            appAlert(error.response?.data?.detail || 'Error al reordenar la subcategoría');
        }
    };

    const handleDrop = async (e, targetSubcat) => {
        e.preventDefault();
        setDragOverCategory(null);

        const itemId = parseInt(e.dataTransfer.getData('itemId'));
        const sourceSubcat = parseInt(e.dataTransfer.getData('sourceCategory'));

        if (sourceSubcat === targetSubcat) return;

        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await subcategoriasItemsApi.move(itemId, targetSubcat, empId);
            fetchItems();
        } catch (error) {
            globalThis.reportClientError?.("Error al mover item:", error);
            appAlert(error.response?.data?.detail || 'Error al mover la subcategoría');
        }
    };

    const visibleItems = currentItems.filter(item => includesNormalized(item.descripcion, searchTerm));
    const visibleItemIds = visibleItems.map(item => item.id);
    const allVisibleSelected = visibleItemIds.length > 0 && visibleItemIds.every(id => selectedItems.includes(id));
    const someVisibleSelected = visibleItemIds.some(id => selectedItems.includes(id)) && !allVisibleSelected;

    const toggleSelectAllVisible = () => {
        if (visibleItemIds.length === 0) return;
        setSelectedItems(prev => {
            if (allVisibleSelected) {
                return prev.filter(id => !visibleItemIds.includes(id));
            }
            return [...new Set([...prev, ...visibleItemIds])];
        });
    };

    const clearSelection = () => setSelectedItems([]);

    return (
        <div className="h-full min-h-0 flex flex-col bg-[#F8FAFC] overflow-hidden">
            {/* Header Context */}
            <div className="bg-zinc-900 px-8 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Database className="w-4 h-4 text-[#F39200]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Base Activa:</span>
                    <MarketplaceOriginBadgeSet
                        origin={activeBaseOrigin}
                        loading={activeBaseOrigin.loading}
                        label="Origen"
                        mode="tooltip"
                    />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] italic text-zinc-100">{selectedBaseTrabajo?.nombre}</span>
                  </div>
            </div>

            {/* Header Principal - Fijo */}
            <div className="bg-white border-b border-zinc-200 px-8 py-4 flex items-center justify-between flex-shrink-0 z-40">
                <div className="flex items-center gap-4 flex-1">
                    <button onClick={() => navigate('/precios-unitarios')} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-zinc-500" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900">Subcategorías</h1>
                        <p className="text-[10px] font-bold text-[#F39200] uppercase tracking-widest text-left">Gestión de Catálogo PU</p>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar - Subcategorías */}
                <div className="w-64 bg-white border-r border-zinc-200 h-full p-4 flex flex-col">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 flex-shrink-0">Categorías</h3>
                    <div id="categories-scroll-container" className="space-y-2 flex-1 overflow-y-auto custom-scrollbar">
                        {SUBCATEGORIAS.map(sub => {
                            const Icon = sub.icon;
                            const count = (items[sub.codigo] || []).length;
                            const isSelected = selectedSubcategoria === sub.codigo;

                            return (
                                <div
                                    key={sub.codigo}
                                    onDragOver={(e) => handleDragOver(e, sub.codigo)}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, sub.codigo)}
                                    className="relative block"
                                >
                                    {dragOverCategory === sub.codigo && (
                                        <div className="absolute inset-0 bg-[#F39200]/10 rounded-xl animate-pulse pointer-events-none" />
                                    )}
                                    {USE_ENHANCED_SUBCATEGORIA_FAMILY_LIST ? (
                                        <CatalogSidebarCard
                                            codeNode={<span className="text-[8px] font-black uppercase tracking-[0.18em] mb-1 block text-zinc-400">Categoría {sub.codigo}</span>}
                                            title={sub.nombre}
                                            displayTitle={null}
                                            tooltipText={sub.nombre}
                                            count={count}
                                            footer={sub.nombre}
                                            footerVariant="description"
                                            active={isSelected}
                                            dragOver={dragOverCategory === sub.codigo}
                                            expanded={isSelected}
                                            onClick={() => setSelectedSubcategoria(sub.codigo)}
                                            leading={<div className={`p-2 rounded-xl ${isSelected ? 'bg-white border border-zinc-200 text-zinc-600' : sub.color}`}><Icon className="w-4 h-4" /></div>}
                                        />
                                    ) : (
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-white/20' : sub.color}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-xs font-bold uppercase tracking-tight line-clamp-1">{sub.nombre}</p>
                                                <p className={`text-[10px] ${isSelected ? 'text-zinc-400' : 'text-zinc-400'}`}>
                                                    {count} subcategorías
                                                </p>
                                            </div>
                                            <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-zinc-400' : 'text-zinc-300'}`} />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Main Content - Items */}
                <div className="flex-1 flex flex-col overflow-hidden bg-[#F8FAFC]">
                    {/* Toolbar Fixed - Standard Pattern */}
                    <div className="flex items-center justify-between px-8 py-6 flex-shrink-0 border-b border-zinc-100">
                        <div className="flex items-center gap-4">
                            <div>
                                <h2 className="text-2xl font-black uppercase text-zinc-800 tracking-tight">
                                    {SUBCATEGORIAS.find(s => s.codigo === selectedSubcategoria)?.nombre}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <div className="w-3 h-3 rounded-full bg-green-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                        {currentItems.length} subcategorías registradas
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4">
                            {/* Acciones Grupadas */}
                            <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-xl">
                                <button
                                    onClick={openImportModal}
                                    className="px-3 py-2 hover:bg-zinc-50 rounded-lg text-[10px] font-black uppercase text-zinc-500 flex items-center gap-2 transition-colors"
                                    title="Importar desde portapapeles"
                                >
                                    <Copy className="w-3.5 h-3.5" /> Importar
                                </button>
                                <div className="w-px h-4 bg-zinc-200 mx-1" />
                                <button
                                    onClick={handleExport}
                                    disabled={selectedItems.length === 0}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${selectedItems.length > 0 ? 'text-[#F39200] hover:bg-orange-50' : 'text-zinc-300 pointer-events-none'}`}
                                    title="Exportar seleccionados"
                                >
                                    <Copy className="w-3.5 h-3.5 rotate-180" /> Exportar ({selectedItems.length})
                                </button>
                                <div className="w-px h-4 bg-zinc-200 mx-1" />
                                <button
                                    onClick={handleBulkDelete}
                                    disabled={selectedItems.length === 0}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${selectedItems.length > 0 ? 'text-red-500 hover:bg-red-50' : 'text-zinc-300 pointer-events-none'}`}
                                    title="Borrar seleccionados"
                                >
                                    <Trash2 className="w-3.5 h-3.5" /> Borrar ({selectedItems.length})
                                </button>
                            </div>

                            <div className="flex items-center gap-1 bg-white border border-zinc-200 p-1 rounded-xl">
                                <button
                                    onClick={toggleSelectAllVisible}
                                    disabled={visibleItemIds.length === 0}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${visibleItemIds.length > 0 ? 'text-zinc-600 hover:bg-zinc-50' : 'text-zinc-300 pointer-events-none'}`}
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
                                    onClick={clearSelection}
                                    disabled={selectedItems.length === 0}
                                    className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${selectedItems.length > 0 ? 'text-zinc-500 hover:bg-zinc-50' : 'text-zinc-300 pointer-events-none'}`}
                                    title="Limpiar selección"
                                >
                                    <X className="w-3.5 h-3.5" /> Limpiar
                                </button>
                            </div>

                            {/* Buscador */}
                            <ClearSearchField
                                value={normalizeTextInputValue(searchTerm)}
                                onValueChange={(value) => setSearchTerm(normalizeTextInputValue(value))}
                                placeholder="Buscar subcategorías..."
                                containerClassName="w-64"
                                inputClassName="w-full pl-10 pr-10 h-10 bg-white border border-zinc-200 rounded-xl text-xs font-bold"
                            />

                            <LiquidButton onClick={openNew} className="h-10 px-6 rounded-xl">
                                <Plus className="w-4 h-4 mr-2" /> Nueva Subcategoría
                            </LiquidButton>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                        {/* Items List */}
                        {loading ? (
                            <div className="py-20 flex flex-col items-center justify-center gap-4">
                                <div className="w-12 h-12 border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Cargando Subcategorías...</p>
                            </div>
                        ) : currentItems.length === 0 ? (
                            <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-zinc-200">
                                <Package className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                                <h3 className="text-lg font-black uppercase text-zinc-400">Sin subcategorías registradas</h3>
                                <p className="text-sm text-zinc-400 mb-8 font-medium">Comience a agregar subcategorías a esta categoría.</p>
                                <LiquidButton onClick={openNew} className="mx-auto">
                                    Agregar Primera Subcategoría
                                </LiquidButton>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-2">
                            {visibleItems.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        onDoubleClick={(e) => openEdit(e, item)}
                                        onDragOver={(e) => handleItemDragOver(e, item)}
                                        onDragLeave={handleItemDragLeave}
                                        onDrop={(e) => handleItemDrop(e, item)}
                                        className={`group flex items-center gap-3 px-4 py-3 bg-white border rounded-xl transition-all cursor-pointer ${selectedItems.includes(item.id)
                                            ? 'border-[#F39200] bg-orange-50'
                                            : dragOverItemId === item.id
                                                ? `border-[#F39200] bg-orange-50/40 ${dragOverItemPosition === 'before' ? 'ring-2 ring-inset ring-[#F39200]' : 'ring-2 ring-inset ring-zinc-300'}`
                                                : 'border-zinc-100'
                                            }`}

                                    >
                                        {/* Drag Handle */}
                                        <div
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, item)}
                                            className="cursor-grab active:cursor-grabbing p-0.5 text-zinc-300 hover:text-zinc-600 transition-colors"
                                            title="Arrastrar para reordenar o mover de categoría"
                                        >
                                            <GripVertical className="w-5 h-5" />
                                        </div>

                                        <SoftSelectToggle
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => toggleSelectItem(item.id)}
                                            label={selectedItems.includes(item.id) ? 'Quitar de la selección' : 'Seleccionar subcategoría'}
                                            size="md"
                                            tone="blue"
                                            muted={!selectedItems.includes(item.id)}
                                        />

                                        <div className="w-20">
                                            <CodeColorizer code={item.codigo} />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-bold ${item.revisado === false ? 'text-red-600' : 'text-zinc-800'}`}>
                                                    {normalizeSubcategoryDisplay(item.descripcion)}
                                                </h4>
                                                {item.revisado === false && (
                                                    <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-tighter border border-red-100">
                                                        <AlertCircle className="w-3 h-3" />
                                                        Pendiente de Revisión
                                                    </div>
                                                )}
                                            </div>
                                            {item.observaciones && (
                                                <p className="text-xs text-zinc-400 mt-1">{item.observaciones}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2 opacity-60 hover:opacity-100 transition-all">
                                            <button
                                                onClick={(e) => handleDuplicate(e, item)}
                                                className="p-1.5 hover:bg-purple-50 text-purple-500 rounded-lg"
                                                title="Duplicar"
                                            >
                                                <Copy className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => openEdit(e, item)}
                                                className="p-1.5 hover:bg-blue-50 text-blue-500 rounded-lg"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => handleDelete(e, item)}
                                                className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg"
                                                title="Borrar"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Modal - Crear/Editar Item */}
                <AnimatePresence>
                    {showModal && (
                        <AppModalShell isOpen={showModal} onClose={closeModal} size="lg" zIndex="z-[1000]" panelClassName="max-h-[90dvh] flex flex-col">
                            <AppModalHeader
                                title={editingItem ? 'Editar subcategoría' : 'Nueva subcategoría'}
                                subtitle={SUBCATEGORIAS.find(s => s.codigo === selectedSubcategoria)?.nombre}
                                icon={Database}
                                iconClassName="text-[#F39200]"
                                iconWrapClassName="border border-orange-100 bg-orange-50"
                                onClose={closeModal}
                            />
                            <form onSubmit={handleSubmit} className="min-h-0 flex flex-1 flex-col">
                                <AppModalBody className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f5] p-5 md:p-6 custom-scrollbar">
                                    <div className="space-y-5">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">
                                                Código
                                            </Label>
                                            <div className="h-12 bg-zinc-100 border border-zinc-200 rounded-xl flex items-center px-4">
                                                <span className="text-sm font-bold text-zinc-500">
                                                    {editingItem ? editingItem.codigo : `Se generará automáticamente (${selectedSubcategoria}-XXX)`}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">
                                                Descripción *
                                            </Label>
                                            <Input
                                                required
                                                value={form.descripcion || ''}
                                                onChange={e => setForm({ ...form, descripcion: e.target.value })}
                                                onBlur={e => setForm({ ...form, descripcion: normalizeSubcategoryDisplay(e.target.value) })}
                                                className="h-12 bg-zinc-50 border-zinc-200 rounded-xl focus:ring-[#F39200]"
                                                placeholder="Ej: Cemento Portland Tipo I"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center mb-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">Observaciones</label>
                                                <button
                                                    type="button"
                                                    onClick={handleSpellCheck}
                                                    disabled={isCheckingSpell}
                                                    className="text-xs flex items-center gap-1 text-[#F39200] hover:underline"
                                                >
                                                    <SpellCheck className={`w-3 h-3 ${isCheckingSpell ? 'animate-pulse' : ''}`} />
                                                    Asistente Ortográfico
                                                </button>
                                            </div>
                                            <textarea
                                                value={form.observaciones || ''}
                                                onChange={(e) => setForm({ ...form, observaciones: e.target.value })}
                                                spellCheck="true"
                                                className="w-full p-3 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-[#F39200] transition-all min-h-[100px] text-zinc-600 text-sm bg-zinc-50 outline-none"
                                                placeholder="Detalles adicionales..."
                                            />
                                        </div>

                                        {/* OmniClass Section */}
                                        {useOmniClass && (
                                        <div className="p-5 bg-zinc-50/50 rounded-2xl border border-zinc-100 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">
                                                    Clasificación OmniClass Tabla {currentOmniClassTable}
                                                </Label>
                                                {form.omniclass_codigo && (
                                                    <button 
                                                        type="button"
                                                        onClick={() => setForm({ ...form, omniclass_codigo: '', omniclass_titulo: '' })}
                                                        className="text-[9px] font-bold text-red-500 uppercase hover:underline"
                                                    >
                                                        Limpiar
                                                    </button>
                                                )}
                                            </div>
                                            
                                            <SearchableSelect
                                                placeholder="Buscar por código o descripción estándar..."
                                                options={omniclassOptions}
                                                loading={isOmniLoading}
                                                value={form.omniclass_codigo}
                                                labelKey="label"
                                                valueKey="codigo"
                                                onOpen={handleOmniClassOpen}
                                                onSearch={handleOmniClassSearch}
                                                onChange={(val) => {
                                                    const selected = omniclassOptions.find(o => o.codigo === val);
                                                    if (selected) {
                                                        setForm({
                                                            ...form,
                                                            omniclass_codigo: selected.codigo,
                                                            omniclass_titulo: selected.titulo_resuelto || selected.titulo
                                                        });
                                                    }
                                                }}
                                            />

                                            {form.omniclass_titulo && (
                                                <div className="px-3 py-2 bg-blue-50/50 border border-blue-100 rounded-lg">
                                                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-tight line-clamp-1">
                                                        {form.omniclass_titulo}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                        )}

                                    </div>
                                </AppModalBody>
                                <AppModalFooter variant="flat" className="flex-wrap bg-[#f7f7f5]">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        title="Cancelar"
                                        aria-label="Cancelar"
                                        className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                    <LiquidButton type="submit" title={editingItem ? 'Actualizar' : 'Crear'} aria-label={editingItem ? 'Actualizar' : 'Crear'} className="h-11 w-11 !min-w-0 rounded-xl !px-0">
                                        <Save className="w-4 h-4" />
                                    </LiquidButton>
                                </AppModalFooter>
                            </form>
                        </AppModalShell>
                    )}
                </AnimatePresence>

                {/* Modal - Importar */}
                <AnimatePresence>
                    {showImportModal && (
                        <AppModalShell isOpen={showImportModal} onClose={closeImportModal} size="xl" zIndex="z-[1000]" panelClassName="max-h-[90dvh] flex flex-col">
                            <AppModalHeader
                                title="Importar subcategorías"
                                subtitle="Pegue datos desde Excel o portapapeles"
                                icon={Upload}
                                iconClassName="text-[#F39200]"
                                iconWrapClassName="border border-orange-100 bg-orange-50"
                                onClose={closeImportModal}
                            />
                            <AppModalBody className="flex-1 min-h-0 overflow-y-auto bg-[#f7f7f5] p-5 md:p-6 custom-scrollbar">
                                    <div className="space-y-4">
                                        <ImportFormatHint
                                            format="Una línea por ítem • TAB opcional para observaciones"
                                            hint="Si pega una sola columna, toda la línea se tomará como descripción completa."
                                        />

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">
                                                Categoría destino
                                            </Label>
                                            <AnimatedSelect
                                                value={selectedSubcategoria}
                                                onChange={e => setSelectedSubcategoria(Number(e.target.value))}
                                                className="w-full h-12 bg-zinc-50 border border-zinc-200 rounded-xl px-4 text-sm font-bold"
                                            >
                                                {SUBCATEGORIAS.map(sub => (
                                                    <option key={sub.codigo} value={sub.codigo}>
                                                        {sub.nombre}
                                                    </option>
                                                ))}
                                            </AnimatedSelect>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">
                                                Datos (Descripción + Observaciones)
                                            </Label>
                                            <textarea
                                                value={importData}
                                                onChange={e => setImportData(e.target.value)}
                                                className="w-full h-48 p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:ring-[#F39200] outline-none font-mono"
                                                placeholder="Cemento Portland&#9;50kg bolsa&#10;Acero de refuerzo&#9;Varilla corrugada&#10;..."
                                            />
                                        </div>

                                        {importPreview.length > 0 && (
                                            <div className="space-y-3">
                                                <div className="bg-zinc-50 border border-zinc-200 rounded-2xl p-4">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">
                                                            Previo de Importación
                                                        </Label>
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                                                            {importPreview.length} filas procesadas
                                                        </span>
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
                                                </div>
                                                <div className="max-h-56 overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50">
                                                    <table className="w-full text-left">
                                                        <thead className="bg-white sticky top-0 border-b border-zinc-200">
                                                            <tr>
                                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Fila</th>
                                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Descripción</th>
                                                                {useOmniClass && (
                                                                    <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">OmniClass</th>
                                                                )}
                                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Estado</th>
                                                                <th className="px-4 py-3 text-[9px] font-black uppercase tracking-widest text-zinc-400">Motivo</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {importPreview.map((item) => (
                                                                <tr key={`sub-preview-${item.row}`} className="border-b border-zinc-100 last:border-b-0 align-top">
                                                                    <td className="px-4 py-2.5 text-[10px] font-black text-zinc-400">{item.row}</td>
                                                                    <td className="px-4 py-2.5 text-[12px] font-bold text-zinc-700 leading-snug">{item.parsed?.descripcion || '-'}</td>
                                                                    {useOmniClass && (
                                                                        <td className="px-4 py-2.5 text-[11px] text-zinc-500 leading-snug">
                                                                            {item.parsed?.omniclass_codigo ? (
                                                                                <div className="flex flex-col">
                                                                                    <span className="font-black text-[9px] text-[#F39200]">{item.parsed.omniclass_codigo}</span>
                                                                                    <span className="text-[10px] truncate max-w-[120px]">{item.parsed.omniclass_titulo}</span>
                                                                                </div>
                                                                            ) : (
                                                                                <span className="text-zinc-300 italic">Sin asignar</span>
                                                                            )}
                                                                        </td>
                                                                    )}
                                                                    <td className="px-4 py-2.5">
                                                                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-[9px] font-black uppercase tracking-widest ${item.valid ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : (item.reason || '').toLowerCase().includes('duplic') ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
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
                            </AppModalBody>
                            <AppModalFooter variant="flat" className="border-t border-zinc-200 bg-white px-5 py-4 md:px-6">
                                    <div className="flex gap-4">
                                        <button
                                            type="button"
                                            onClick={closeImportModal}
                                            title="Cancelar"
                                            aria-label="Cancelar"
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                        <LiquidButton
                                            onClick={handleImport}
                                            disabled={validImportRows.length === 0}
                                            title={`Confirmar importación de ${validImportRows.length} registros`}
                                            aria-label={`Confirmar importación de ${validImportRows.length} registros`}
                                            className="h-11 w-11 !min-w-0 rounded-xl !px-0"
                                        >
                                            <Upload className="w-4 h-4" />
                                        </LiquidButton>
                                    </div>
                            </AppModalFooter>
                        </AppModalShell>
                    )}
                </AnimatePresence>
            </div>

            <BulkDeleteConfirmModal
                isOpen={showBulkDeleteModal}
                onClose={closeBulkDeleteModal}
                onConfirm={handleBulkDeleteConfirm}
                step={bulkDeleteStep}
                setStep={setBulkDeleteStep}
                loading={bulkDeleting}
                title="¿Borrar subcategorías seleccionadas?"
                count={selectedItems.length}
                summary="Se intentará eliminar toda la selección en una sola operación. Si una subcategoría contiene recursos o APUs, no se borrará ninguna."
                previewItems={currentItems.filter(item => selectedItems.includes(item.id))}
                finalWarning="¿Estás absolutamente seguro? Esta acción es irreversible. El borrado solo se ejecutará si todas las subcategorías están completamente vacías."
            />
        </div>
    );
};

export default Subcategorias;
const normalizeSubcategoryDisplay =
    descriptionCapitalization.normalizeSubcategoryDisplay
    || descriptionCapitalization.default?.normalizeSubcategoryDisplay
    || ((value) => String(value || '').toUpperCase());
