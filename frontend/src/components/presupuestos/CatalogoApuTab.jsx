import React, { useState, useEffect, useMemo, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import subcategoriasItemsApi from '../../api/subcategoriasItems';
import apusApi from '../../api/apus';
import { usePresupuestoActions, usePresupuestoData, usePresupuestoSelection } from '../../context/PresupuestoContext';
import { Search, Database, ChevronRight, ChevronDown, Calculator, FolderOpen, Check, X } from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import CatalogSidebarCard from '../ui/CatalogSidebarCard';
import ClearSearchField from '../ui/ClearSearchField';
import CodeColorizer from '../../utils/codeColorizer';
import { normalizeTextInputValue } from '../../utils/normalizeInputValue';
import { appAlert } from '../../utils/appDialog';
import { includesNormalized, normalizeSearchToken } from '../../utils/normalizeSearch';
import { normalizeDescriptionCapitalization } from '../../utils/descriptionCapitalization';
import MotionScrollbar from '../ui/MotionScrollbar';

const MotionDiv = motion.div;
const normalizeApuSearchToken = (value) => normalizeSearchToken(normalizeTextInputValue(value));
const sanitizeCatalogSearchValue = (value) => {
    const normalized = normalizeTextInputValue(value);
    if (normalized.trim().toLowerCase() === 'null') return '';
    return normalized;
};
const USE_ENHANCED_CATALOGO_APU_SUBCATEGORY_LIST = true;

const CatalogoApuTab = ({
    compact = false,
    isCollapsed = false,
    onSearchFocusChange = null,
    searchTerm: controlledSearchTerm = null,
    onSearchTermChange = null,
    hideSearch = false,
    onCatalogSummaryChange = null,
}) => {
    const { activeProyecto, activePresupuesto } = usePresupuestoData();
    const { addApuToBudget } = usePresupuestoActions();
    const { selectedNodeId, selectedLineId, setSelectedNodeId, setSelectedLineId } = usePresupuestoSelection();
    const { selectedEmpresa, user } = useContext(AuthContext);
    const [apus, setApus] = useState([]);
    const [subcategorias, setSubcategorias] = useState([]);
    const [loading, setLoading] = useState(true);
    const [internalSearchTerm, setInternalSearchTerm] = useState('');
    const [expandedSubcats, setExpandedSubcats] = useState({});
    const [addingApuId, setAddingApuId] = useState(null);
    const [toast, setToast] = useState(null);
    const pendingAddKeysRef = useRef(new Set());
    const toastTimeoutRef = useRef(null);
    const catalogViewportRef = useRef(null);

    useEffect(() => {
        return () => {
            if (toastTimeoutRef.current) {
                clearTimeout(toastTimeoutRef.current);
            }
        };
    }, []);

    const showToast = (message, type = 'success') => {
        if (toastTimeoutRef.current) {
            clearTimeout(toastTimeoutRef.current);
        }
        setToast({ message, type });
        toastTimeoutRef.current = setTimeout(() => {
            setToast(null);
            toastTimeoutRef.current = null;
        }, 2600);
    };

    useEffect(() => {
        const fetchData = async () => {
            if (!activeProyecto?.base_trabajo_id) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                const empresaId = selectedEmpresa?.id || user?.empresa_id || null;
                const [resApus, resSubs] = await Promise.all([
                    apusApi.getAll({ base_trabajo_id: activeProyecto.base_trabajo_id, empresa_id: empresaId, limit: 1000 }, { summary: true }),
                    subcategoriasItemsApi.getAll(activeProyecto.base_trabajo_id, null, empresaId)
                ]);

                setApus(resApus.data);
                // Filtrar solo las subcategorías de APUs (Cat 5)
                const cat5Subs = resSubs.data.filter(s => Number(s.subcategoria_codigo) === 5);
                setSubcategorias(cat5Subs);
                
                // Expandir todas por defecto inicialmente
                const initialExpanded = {};
                cat5Subs.forEach(s => initialExpanded[s.id] = true);
                setExpandedSubcats(initialExpanded);

            } catch (error) {
                globalThis.reportClientError?.("Error cargando datos del catálogo:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeProyecto, selectedEmpresa, user]);

    const handleAddApu = async (apu) => {
        const firstEdtId = (activePresupuesto?.detalle || []).find((linea) => Number(linea?.edt_id))?.edt_id ?? null;
        const resolvedEdtId = Number(selectedNodeId || firstEdtId || 0) || null;
        const selectedBudgetLine = selectedLineId != null
            ? (activePresupuesto?.detalle || []).find((linea) => Number(linea.id) === Number(selectedLineId))
            : null;
        const target = selectedBudgetLine
            ? { edtId: selectedBudgetLine.edt_id, afterLineId: selectedBudgetLine.id }
            : resolvedEdtId != null
                ? { edtId: resolvedEdtId }
                : null;

        if (!target?.edtId) {
            appAlert("Por favor, selecciona un capítulo o una línea del presupuesto primero.");
            return;
        }

        const pendingKey = `${apu.id}:${target.edtId}:${target.afterLineId || 'tail'}`;
        if (pendingAddKeysRef.current.has(pendingKey)) {
            return;
        }

        try {
            pendingAddKeysRef.current.add(pendingKey);
            setAddingApuId(apu.id);
            const savedLine = await addApuToBudget(apu, target);
            if (savedLine?.edt_id) {
                setSelectedNodeId(Number(savedLine.edt_id));
            }
            if (savedLine?.id) {
                setSelectedLineId(Number(savedLine.id));
            }
            if (savedLine?._budgetAction === 'incremented_existing') {
                showToast('El APU ya existía. Se incrementó la cantidad en 1.');
            }
            // Visual feedback: brief success state
            setTimeout(() => setAddingApuId(null), 1000);
        } catch {
            setAddingApuId(null);
            appAlert("Error al añadir el APU al presupuesto.");
        } finally {
            pendingAddKeysRef.current.delete(pendingKey);
        }
    };

    const toggleSubcat = (id) => {
        setExpandedSubcats(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const isSearchControlled = controlledSearchTerm != null;
    const searchTerm = isSearchControlled ? controlledSearchTerm : internalSearchTerm;
    const setSearchTerm = (value) => {
        const sanitized = sanitizeCatalogSearchValue(value);
        if (isSearchControlled) {
            onSearchTermChange?.(sanitized);
            return;
        }
        setInternalSearchTerm(sanitized);
    };

    const renderedSearchValue = useMemo(() => {
        const sanitized = sanitizeCatalogSearchValue(searchTerm);
        return sanitized === '' ? '' : sanitized;
    }, [searchTerm]);

    useEffect(() => {
        if (renderedSearchValue === searchTerm) return;
        setSearchTerm(renderedSearchValue);
    }, [renderedSearchValue, searchTerm]);

    const groupedData = useMemo(() => {
        const term = normalizeApuSearchToken(renderedSearchValue);
        
        // 1. Filtrar APUs
        const filteredApus = apus.filter(apu =>
            includesNormalized(apu.descripcion || '', term) ||
            includesNormalized(apu.codigo || '', term)
        );

        // 2. Agrupar por subcategoría
        return subcategorias.map(sub => {
            const subItems = filteredApus.filter(apu => apu.subcategoria_item_id === sub.id);
            // Si hay búsqueda, solo mostramos la subcategoría si tiene items o si el nombre de la subcat coincide
            const subMatches =
                includesNormalized(sub.descripcion || '', term) ||
                includesNormalized(sub.codigo || '', term);
            
            if (renderedSearchValue && !subMatches && subItems.length === 0) return null;

            return {
                ...sub,
                items: subItems
            };
        }).filter(Boolean);
    }, [apus, subcategorias, renderedSearchValue]);

    const syncSummary = useMemo(() => {
        return apus.reduce((acc, apu) => {
            if (apu?.sync_status === 'diverged') acc.diverged += 1;
            else if (apu?.content_origin === 'local') acc.local += 1;
            else if (apu?.content_origin === 'inherited') acc.inherited += 1;
            else acc.native += 1;
            return acc;
        }, { inherited: 0, local: 0, diverged: 0, native: 0 });
    }, [apus]);
    const visibleApuCount = useMemo(
        () => groupedData.reduce((acc, sub) => acc + (sub?.items?.length || 0), 0),
        [groupedData]
    );

    useEffect(() => {
        onCatalogSummaryChange?.({
            total: apus.length,
            visible: visibleApuCount,
        });
    }, [apus.length, onCatalogSummaryChange, visibleApuCount]);

    if (!activeProyecto?.base_trabajo_id) {
        return (
            <div className="p-8 text-center flex flex-col items-center justify-center">
                <Database className="w-8 h-8 text-zinc-300 mb-2" />
                <h3 className="text-[10px] font-black uppercase tracking-tight mb-2 text-zinc-400 text-center">Sin Base de Trabajo</h3>
            </div>
        );
    }

    return (
        <div className={`flex flex-col h-full bg-white ${compact ? '' : 'space-y-6'}`}>
            <AnimatePresence mode="wait">
                {!isCollapsed && (
                    <MotionDiv 
                        key="catalog-content"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex-1 flex flex-col overflow-hidden"
                    >
            {!compact && (
                <div className="flex items-center justify-between p-6 border-b border-zinc-100">
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Catálogo de APUs</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#F39200]">
                            Vinculado a la Base de Trabajo: {activeProyecto?.base_trabajo?.nombre || 'Activa'}
                        </p>
                    </div>
                </div>
            )}

            {!hideSearch && (
            <div className={`p-4 ${compact ? 'bg-zinc-50/50' : ''}`}>
                <div className="flex items-center gap-2">
                    <div className="relative group flex-1">
                        <ClearSearchField
                            value={renderedSearchValue}
                            onValueChange={(value) => setSearchTerm(sanitizeCatalogSearchValue(value))}
                            placeholder="Buscar APU o Subcategoría..."
                            containerClassName="w-full"
                            inputClassName="w-full h-10 rounded-xl border border-zinc-200 bg-white pl-10 pr-10 text-xs shadow-sm transition-all focus:outline-none focus:border-[#F39200] focus:ring-1 focus:ring-[#F39200]"
                            searchIconClassName="left-4"
                            clearButtonClassName="right-2"
                            onFocus={(event) => {
                                if (sanitizeCatalogSearchValue(event.currentTarget.value) !== event.currentTarget.value) {
                                    setSearchTerm('');
                                }
                                onSearchFocusChange?.(true);
                            }}
                            onBlur={(event) => {
                                const sanitized = sanitizeCatalogSearchValue(event.currentTarget.value);
                                if (sanitized !== event.currentTarget.value) {
                                    setSearchTerm(sanitized);
                                }
                                onSearchFocusChange?.(false);
                            }}
                            onKeyDown={(event) => {
                                if (event.key !== 'Escape') return;
                                event.preventDefault();
                                event.stopPropagation();
                                setSearchTerm('');
                                event.currentTarget.value = '';
                                event.currentTarget.blur();
                                onSearchFocusChange?.(false);
                            }}
                        />
                    </div>
                </div>
                <div className="mt-2 px-1 text-[9px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                    {visibleApuCount === apus.length
                        ? `${apus.length} apus totales`
                        : `${visibleApuCount} visibles · ${apus.length} totales`}
                </div>
            </div>
            )}

            <div className="relative flex-1 min-h-0">
                <div ref={catalogViewportRef} className="giproy-motion-scrollbar-hide h-full min-h-0 overflow-y-auto px-4 pt-2 pb-4 pr-7">
                    {loading ? (
                        <div className="py-10 text-center">
                            <div className="w-6 h-6 mx-auto border-3 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" />
                        </div>
                    ) : groupedData.length === 0 ? (
                        <div className="py-10 text-center bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">No hay resultados</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {groupedData.map(sub => (
                                <div key={sub.id} className="space-y-2">
                                    <div className="block">
                                        {USE_ENHANCED_CATALOGO_APU_SUBCATEGORY_LIST ? (
                                            <CatalogSidebarCard
                                                codeNode={<CodeColorizer code={sub.codigo} className="text-[10px] block mb-0.5" />}
                                                title={normalizeDescriptionCapitalization(sub.descripcion)}
                                                displayTitle={null}
                                                tooltipText={normalizeDescriptionCapitalization(sub.descripcion)}
                                                count={sub.items.length}
                                                footer={normalizeDescriptionCapitalization(sub.descripcion)}
                                                footerVariant="description"
                                                active={expandedSubcats[sub.id]}
                                                expanded={expandedSubcats[sub.id]}
                                                onClick={() => toggleSubcat(sub.id)}
                                            />
                                        ) : (
                                            <>
                                                {expandedSubcats[sub.id] ? (
                                                    <ChevronDown className="w-3 h-3 text-zinc-400 group-hover:text-[#F39200]" />
                                                ) : (
                                                    <ChevronRight className="w-3 h-3 text-zinc-400 group-hover:text-[#F39200]" />
                                                )}
                                                <FolderOpen className={`w-3.5 h-3.5 ${sub.items.length > 0 ? 'text-[#F39200]' : 'text-zinc-300'}`} />
                                                <div className="flex-1 text-left">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest leading-none">
                                                            {sub.codigo}
                                                        </span>
                                                        <span className="text-[8px] font-bold text-zinc-300">
                                                            {sub.items.length} APUs
                                                        </span>
                                                    </div>
                                                    <h4 className="text-[10px] font-black tracking-tight text-zinc-600 truncate leading-tight mt-0.5">
                                                        {normalizeDescriptionCapitalization(sub.descripcion)}
                                                    </h4>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    <AnimatePresence>
                                        {expandedSubcats[sub.id] && (
                                            <MotionDiv
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden"
                                            >
                                                <div className="ml-3.5 mt-1 space-y-2 border-l-2 border-zinc-100 pl-4 pr-1">
                                                    {sub.items.length === 0 ? (
                                                        <p className="text-[8px] font-bold text-zinc-300 uppercase tracking-widest py-1">
                                                            Sin APUs en esta categoría
                                                        </p>
                                                    ) : (
                                                        sub.items.map(apu => (
                                                            <MotionDiv
                                                                key={apu.id}
                                                                initial={{ opacity: 0, x: -10 }}
                                                                animate={{ opacity: 1, x: 0 }}
                                                                whileHover={{ y: -1 }}
                                                                onClick={() => handleAddApu(apu)}
                                                                className="relative"
                                                            >
                                                                <div
                                                                    title={`${normalizeDescriptionCapitalization(apu.descripcion) || 'Apu sin descripción'}${(typeof apu.unidad === 'object' ? apu.unidad?.descripcion : apu.unidad) ? ` · ${typeof apu.unidad === 'object' ? apu.unidad?.descripcion : apu.unidad}` : ''}`}
                                                                    className={`
                                                                    relative p-3 rounded-2xl bg-white border-2 transition-all duration-300 cursor-pointer group
                                                                    ${addingApuId === apu.id 
                                                                        ? 'border-green-500 shadow-lg shadow-green-100' 
                                                                        : 'border-zinc-100 hover:border-[#F39200] hover:ring-4 hover:ring-orange-400/10 hover:shadow-xl hover:shadow-orange-100/50'}
                                                                `}
                                                                >
                                                                    <div className="flex items-center gap-3">
                                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300 ${addingApuId === apu.id ? 'bg-green-500 rotate-[360deg]' : 'bg-orange-50 group-hover:bg-[#F39200]'}`}>
                                                                            {addingApuId === apu.id ? (
                                                                                <Check className="w-4 h-4 text-white" />
                                                                            ) : (
                                                                                <Calculator className={`w-4 h-4 transition-colors ${addingApuId === apu.id ? 'text-white' : 'text-[#F39200] group-hover:text-white'}`} />
                                                                            )}
                                                                        </div>
                                                                        <div className="flex-1 min-w-0">
                                                                            <div className="flex items-center justify-between mb-1">
                                                                                <CodeColorizer code={apu.codigo} className="text-[8px] opacity-70" />
                                                                                <div className="flex items-center gap-1.5">
                                                                                    <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest">{typeof apu.unidad === 'object' ? apu.unidad?.descripcion : apu.unidad}</span>
                                                                                </div>
                                                                            </div>
                                                                            <h4 className="font-black text-[11px] tracking-tight text-zinc-900 truncate">
                                                                                {normalizeDescriptionCapitalization(apu.descripcion)}
                                                                            </h4>
                                                                            <p className="text-[10px] font-black tracking-tighter tabular-nums text-[#F39200] mt-1">
                                                                                ${parseFloat(apu.costo_directo || apu.precio_unitario_total || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                                                            </p>
                                                                        </div>
                                                                    </div>

                                                                    {addingApuId === apu.id && (
                                                                        <MotionDiv 
                                                                            initial={{ opacity: 0, scale: 0.5 }}
                                                                            animate={{ opacity: 1, scale: 1 }}
                                                                            className="absolute -right-1 -top-1"
                                                                        >
                                                                            <span className="text-[7px] font-black text-white px-2 py-1 bg-green-500 rounded-full shadow-lg border border-white uppercase tracking-widest">
                                                                                +1 Unidad
                                                                            </span>
                                                                        </MotionDiv>
                                                                    )}
                                                                </div>
                                                            </MotionDiv>
                                                        ))
                                                    )}
                                                </div>
                                            </MotionDiv>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
                <MotionScrollbar targetRef={catalogViewportRef} className="right-2" />
            </div>
        </MotionDiv>
    )}
            </AnimatePresence>
            <AnimatePresence>
                {toast && (
                    <MotionDiv
                        initial={{ opacity: 0, y: 24 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 24 }}
                        className="pointer-events-none fixed bottom-8 left-1/2 z-[120] flex -translate-x-1/2 items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-950/96 px-5 py-3 text-white shadow-[0_18px_48px_rgba(15,23,42,0.28)]"
                    >
                        {toast.type === 'error' ? (
                            <X className="h-4 w-4 text-red-400" />
                        ) : (
                            <Check className="h-4 w-4 text-[#F39200]" />
                        )}
                        <span className="text-[10px] font-black uppercase tracking-[0.18em]">
                            {toast.message}
                        </span>
                    </MotionDiv>
                )}
            </AnimatePresence>
        </div>
    );
};

export default CatalogoApuTab;

