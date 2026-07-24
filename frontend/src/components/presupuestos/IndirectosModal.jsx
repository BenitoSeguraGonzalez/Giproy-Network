import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { PencilLine, Percent, Plus, Save, Search, Trash2, X } from 'lucide-react';
import { Card } from '../ui/card';
import { LiquidButton } from '../ui/liquid-button';
import { presupuestosApi } from '../../api/presupuestos';
import { getIndirectosStatus } from '../../utils/indirectosStatus';
import { useFormatters } from '../../hooks/useFormatters';
import { normalizeTextInputValue } from '../../utils/normalizeInputValue';
import { includesNormalized, normalizeSearchToken } from '../../utils/normalizeSearch';
import { AuthContext } from '../../context/AuthContext';
import ClearSearchField from '../ui/ClearSearchField';
import {
    INDIRECTOS_CATEGORIAS,
    INDIRECTOS_CONCEPTOS_POR_CATEGORIA,
    INDIRECTOS_CONCEPTOS
} from '../../constants/indirectosCatalog';
import {
    PORTABLE_WORKSPACE_EVENT,
    readPortableWorkspaceOverride,
    resolvePortableWorkspace,
} from '../../utils/portableWorkspace';
import AnimatedSelect from '../ui/AnimatedSelect';
import { APP_MODAL_CLOSE_BUTTON_CLASS } from '../ui/app-modal';

const formatPercent = (value) => `${Number(value || 0).toFixed(2)}%`;
const normalizeOptionalText = (value) => {
    if (value == null) return '';
    if (typeof value === 'string' && value.trim().toLowerCase() === 'null') return '';
    return String(value);
};

const buildConceptCode = (conceptId) => `base:${conceptId}`;
const FIRST_FIXED_CATEGORY = INDIRECTOS_CONCEPTOS.find((concepto) => concepto.fijo)?.codPadre || INDIRECTOS_CATEGORIAS[0]?.codigo || '';

const IndirectosModal = ({ isOpen, onClose, onSaved, presupuestoId }) => {
    const { user, selectedEmpresa } = useContext(AuthContext);
    
    // -- Robust formatters with fallbacks --
    const formatters = useFormatters();
    const formatNumericDisplay = formatters?.formatNumericDisplay || ((v) => String(v || '').replace('.', ','));
    const parseNumericInput = formatters?.parseNumericInput || ((v) => String(v || '').replace(',', '.'));
    const { formatMoneda, formatCalculo } = formatters || {};

    const [selectedCategoriaCodigo, setSelectedCategoriaCodigo] = useState(FIRST_FIXED_CATEGORY);
    const [selectedCatalogConceptId, setSelectedCatalogConceptId] = useState(INDIRECTOS_CONCEPTOS_POR_CATEGORIA[FIRST_FIXED_CATEGORY]?.[0]?.id || '');
    const [selectedItemCode, setSelectedItemCode] = useState(null);
    const [search, setSearch] = useState('');
    const [items, setItems] = useState([]);
    const [summary, setSummary] = useState({
        subtotal_directo: 0,
        indirectos_porcentaje: 0,
        indirectos_total: 0,
        iva_aplicado: 15,
        impuestos: 0,
        total: 0
    });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [showCustomComposer, setShowCustomComposer] = useState(false);
    const [customConceptName, setCustomConceptName] = useState('');
    const [customConceptError, setCustomConceptError] = useState('');
    const [forcedPortableWorkspace, setForcedPortableWorkspace] = useState(() => readPortableWorkspaceOverride());
    const porcentajeInputRef = useRef(null);
    const [viewport, setViewport] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    }));
    const indirectosStatus = getIndirectosStatus(summary.indirectos_porcentaje);

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
        if (!isOpen || !presupuestoId) return;

        const loadIndirectos = async () => {
            setLoading(true);
            setError('');
            try {
                const empId = selectedEmpresa?.id || user?.empresa_id;
                const data = await presupuestosApi.getIndirectos(presupuestoId, empId);
                setItems((data.items || []).map((item) => ({
                    ...item,
                    observaciones: normalizeOptionalText(item.observaciones),
                })));
                setSummary({
                    subtotal_directo: Number(data.subtotal_directo || 0),
                    indirectos_porcentaje: Number(data.indirectos_porcentaje || 0),
                    indirectos_total: Number(data.indirectos_total || 0),
                    iva_aplicado: Number(data.iva_aplicado || 15),
                    impuestos: Number(data.impuestos || 0),
                    total: Number(data.total || 0)
                });
                const firstCategoryWithItems = (data.items || []).find((item) => item.fijo)?.categoria_codigo
                    || (data.items || [])[0]?.categoria_codigo
                    || FIRST_FIXED_CATEGORY;
                setSelectedCategoriaCodigo(firstCategoryWithItems);
            } catch (loadError) {
                globalThis.reportClientError?.('No se pudo cargar indirectos:', loadError);
                setError(loadError.response?.data?.detail || 'No se pudo cargar la configuración de indirectos.');
                setItems([]);
            } finally {
                setLoading(false);
            }
        };

        loadIndirectos();
    }, [isOpen, presupuestoId, selectedEmpresa?.id, user?.empresa_id]);

    const availableConcepts = useMemo(
        () => INDIRECTOS_CONCEPTOS_POR_CATEGORIA[selectedCategoriaCodigo] || [],
        [selectedCategoriaCodigo]
    );

    useEffect(() => {
        const firstConcept = availableConcepts[0];
        setSelectedCatalogConceptId((current) => {
            if (current && availableConcepts.some((concepto) => String(concepto.id) === String(current))) {
                return current;
            }
            return firstConcept?.id || '';
        });
    }, [availableConcepts]);

    const listedItems = useMemo(() => {
        const normalizedSearch = normalizeSearchToken(search);
        return (items || [])
            .filter((item) => !normalizedSearch || includesNormalized(`${item.nombre} ${item.concepto_codigo}`, normalizedSearch))
            .sort((a, b) => {
                const categorySort = String(a.categoria_codigo).localeCompare(String(b.categoria_codigo));
                if (categorySort !== 0) return categorySort;
                if (a.fijo !== b.fijo) return a.fijo ? -1 : 1;
                return a.nombre.localeCompare(b.nombre);
            });
    }, [items, search]);

    useEffect(() => {
        setSelectedItemCode((current) => {
            if (current && listedItems.some((item) => item.concepto_codigo === current)) {
                return current;
            }
            return listedItems[0]?.concepto_codigo ?? null;
        });
    }, [listedItems]);

    const selectedItem = listedItems.find((item) => item.concepto_codigo === selectedItemCode) || null;
    const categoriaActual = useMemo(
        () => INDIRECTOS_CATEGORIAS.find((categoria) => categoria.codigo === selectedCategoriaCodigo) || null,
        [selectedCategoriaCodigo]
    );
    const selectedItemCategoriaCodigo = selectedItem?.categoria_codigo || selectedCategoriaCodigo;
    const selectedItemCategoria = useMemo(
        () => INDIRECTOS_CATEGORIAS.find((categoria) => categoria.codigo === selectedItemCategoriaCodigo) || null,
        [selectedItemCategoriaCodigo]
    );
    const fixedCount = items.filter((item) => item.fijo).length;
    const addedCount = items.filter((item) => !item.fijo).length;
    const canRemoveSelectedConcept = Boolean(
        selectedItem
        && !selectedItem.fijo
        && Number(selectedItem.porcentaje || 0) === 0
    );

    const updateSelectedItem = (patch) => {
        if (!selectedItem) return;
        setItems((prev) => prev.map((item) => (
            item.concepto_codigo === selectedItem.concepto_codigo
                ? { ...item, ...patch }
                : item
        )));
    };

    const focusAndSelectPorcentaje = () => {
        if (typeof window === 'undefined') return;
        window.requestAnimationFrame(() => {
            const input = porcentajeInputRef.current;
            if (!input) return;
            input.focus();
            input.select();
        });
    };

    const moveSelectedItem = (direction) => {
        if (!selectedItemCode || !listedItems.length) return;
        const currentIndex = listedItems.findIndex((item) => item.concepto_codigo === selectedItemCode);
        if (currentIndex < 0) return;
        const nextIndex = currentIndex + direction;
        if (nextIndex < 0 || nextIndex >= listedItems.length) return;
        setSelectedItemCode(listedItems[nextIndex].concepto_codigo);
        focusAndSelectPorcentaje();
    };

    const handleAddCatalogConcept = () => {
        const concept = availableConcepts.find((item) => String(item.id) === String(selectedCatalogConceptId));
        if (!concept) return;

        const conceptoCodigo = buildConceptCode(concept.id);
        const existing = items.find((item) => item.concepto_codigo === conceptoCodigo);
        if (existing) {
            setSelectedItemCode(existing.concepto_codigo);
            return;
        }

        const nextItem = {
            id: `tmp-${concept.id}`,
            concepto_codigo: conceptoCodigo,
            concepto_id: concept.id,
            categoria_codigo: selectedCategoriaCodigo,
            nombre: concept.nombre,
            porcentaje: 0,
            observaciones: '',
            fijo: !!concept.fijo,
            usuario: !!concept.usuario,
            custom: false
        };
        setItems((prev) => [...prev, nextItem]);
        setSelectedItemCode(nextItem.concepto_codigo);
    };

    const resetCustomComposer = () => {
        setShowCustomComposer(false);
        setCustomConceptName('');
        setCustomConceptError('');
    };

    const handleOpenCustomComposer = () => {
        setShowCustomComposer(true);
        setCustomConceptName('');
        setCustomConceptError('');
    };

    const handleAddCustomConcept = () => {
        const nombre = customConceptName.trim();
        if (!nombre) {
            setCustomConceptError('El nombre de la cuenta es obligatorio.');
            return;
        }
        const duplicated = items.some((item) => (
            item.categoria_codigo === selectedCategoriaCodigo
            && item.nombre.trim().toLowerCase() === nombre.toLowerCase()
        ));
        if (duplicated) {
            setCustomConceptError('Ya existe una cuenta con ese nombre en la categoría activa.');
            return;
        }
        const code = `custom:${Date.now()}`;
        const nextItem = {
            id: code,
            concepto_codigo: code,
            concepto_id: null,
            categoria_codigo: selectedCategoriaCodigo,
            nombre,
            porcentaje: 0,
            observaciones: '',
            fijo: false,
            usuario: true,
            custom: true
        };
        setItems((prev) => [...prev, nextItem]);
        setSelectedItemCode(nextItem.concepto_codigo);
        resetCustomComposer();
    };

    const handleRemoveSelectedConcept = () => {
        if (!canRemoveSelectedConcept) return;
        setItems((prev) => prev.filter((item) => item.concepto_codigo !== selectedItem.concepto_codigo));
    };

    const handleSave = async () => {
        if (!presupuestoId) return;
        setSaving(true);
        setError('');
        try {
            const payload = {
                iva_aplicado: Number(summary.iva_aplicado || 0),
                items: items.map((item) => ({
                    concepto_codigo: item.concepto_codigo,
                    concepto_id: item.concepto_id,
                    categoria_codigo: item.categoria_codigo,
                    nombre: item.nombre,
                    porcentaje: Number(item.porcentaje || 0),
                    observaciones: item.observaciones || '',
                    fijo: !!item.fijo,
                    usuario: !!item.usuario,
                    custom: !!item.custom
                }))
            };
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const data = await presupuestosApi.updateIndirectos(presupuestoId, payload, empId);
            setItems((data.items || []).map((item) => ({
                ...item,
                observaciones: normalizeOptionalText(item.observaciones),
            })));
            setSummary({
                subtotal_directo: Number(data.subtotal_directo || 0),
                indirectos_porcentaje: Number(data.indirectos_porcentaje || 0),
                indirectos_total: Number(data.indirectos_total || 0),
                iva_aplicado: Number(data.iva_aplicado || 15),
                impuestos: Number(data.impuestos || 0),
                total: Number(data.total || 0)
            });
            if (onSaved) {
                await onSaved(data);
            }
            resetCustomComposer();
            onClose();
        } catch (saveError) {
            globalThis.reportClientError?.('No se pudo guardar indirectos:', saveError);
            setError(saveError.response?.data?.detail || 'No se pudo guardar la configuración de indirectos.');
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm ${isCompactViewport ? 'p-2' : 'p-4'}`}>
            <Card className={`w-full bg-[#F1F3F6] shadow-2xl overflow-hidden border border-zinc-300 ${isCompactViewport ? 'max-w-none h-[96dvh] rounded-[1.35rem]' : 'max-w-[1040px] h-[78dvh] rounded-[1.6rem]'}`}>
                <div className="h-full flex flex-col">
                    <div className={`bg-white border-b border-zinc-200 shrink-0 ${isCompactViewport ? 'px-4 py-3' : 'px-6 py-4'}`}>
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-2xl border border-orange-200 bg-orange-50 flex items-center justify-center">
                                        <Percent className="w-4 h-4 text-[#F39200]" />
                                    </div>
                                    <div className="min-w-0">
                                        <div className="text-[12px] font-black uppercase tracking-[0.18em] text-zinc-900">
                                            Indirectos e IVA de Proyecto / Revisión
                                        </div>
                                        <div className="text-[11px] text-zinc-500 font-medium">
                                            Los indirectos operativos del proyecto viven aquí. La base maestra y la base de proyecto quedan solo como referencia.
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    resetCustomComposer();
                                    onClose();
                                }}
                                className={`${APP_MODAL_CLOSE_BUTTON_CLASS} !h-9 !w-9 !rounded-[0.75rem]`}
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className={`bg-white border-b border-zinc-200 shrink-0 ${isCompactViewport ? 'px-4 py-3' : 'px-6 py-4'}`}>
                        <div className={`grid gap-3 ${isCompactViewport ? 'grid-cols-2' : 'grid-cols-2 xl:grid-cols-6'}`}>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">Fijos base</div>
                                <div className="mt-1 text-[15px] font-black text-zinc-900">{fixedCount}</div>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">Añadidos</div>
                                <div className="mt-1 text-[15px] font-black text-zinc-900">{addedCount}</div>
                            </div>
                            <div
                                className={`rounded-2xl border px-4 py-3 ${indirectosStatus.softBorderClass} ${indirectosStatus.softBgClass}`}
                                title={`Indirectos e IVA · ${indirectosStatus.description}`}
                            >
                                <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                    <span className={`h-2.5 w-2.5 rounded-full ${indirectosStatus.dotClass}`} />
                                    <span>Total % indirectos</span>
                                </div>
                                <div className="mt-1 text-[15px] font-black text-[#F39200]">{formatPercent(summary.indirectos_porcentaje)}</div>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">Monto indirectos</div>
                                <div className="mt-1 text-[15px] font-black text-zinc-900">{formatMoneda(summary.indirectos_total)}</div>
                            </div>
                            <label className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">IVA aplicado</div>
                                <div className="mt-1 flex items-center gap-2">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={formatNumericDisplay(summary.iva_aplicado)}
                                        onChange={(event) => {
                                            const nextValue = Number(parseNumericInput(event.target.value) || 0);
                                            setSummary((prev) => ({ ...prev, iva_aplicado: nextValue }));
                                        }}
                                        className="w-full h-9 rounded-xl border border-zinc-200 bg-white px-3 text-[14px] font-black text-zinc-900 outline-none focus:border-[#F39200]"
                                    />
                                    <span className="text-[11px] font-black text-zinc-500">%</span>
                                </div>
                            </label>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <div className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">Total presupuesto</div>
                                <div className="mt-1 text-[15px] font-black text-zinc-900">{formatMoneda(summary.total)}</div>
                            </div>
                        </div>
                    </div>

                    <div className={`bg-white border-b border-zinc-200 shrink-0 ${isCompactViewport ? 'px-4 py-3' : 'px-6 py-4'}`}>
                        <div className={`grid grid-cols-1 gap-3 items-end ${isCompactViewport ? '' : 'xl:grid-cols-[220px_minmax(0,1fr)_260px]'}`}>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Categorías</span>
                                <AnimatedSelect
                                    value={selectedCategoriaCodigo}
                                    onChange={(event) => setSelectedCategoriaCodigo(event.target.value)}
                                    className="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-[12px] font-semibold text-zinc-700 outline-none focus:border-[#F39200]"
                                >
                                    {INDIRECTOS_CATEGORIAS.map((categoria) => (
                                        <option key={categoria.codigo} value={categoria.codigo}>
                                            {categoria.codigo} · {categoria.descripcion}
                                        </option>
                                    ))}
                                </AnimatedSelect>
                            </label>

                            <div className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Agregar cuenta</span>
                                <div className="flex items-center gap-2">
                                    <AnimatedSelect
                                        value={selectedCatalogConceptId || ''}
                                        onChange={(event) => setSelectedCatalogConceptId(event.target.value)}
                                        className="min-w-0 flex-1 h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-[12px] font-semibold text-zinc-700 outline-none focus:border-[#F39200]"
                                    >
                                        {availableConcepts.map((concepto) => (
                                            <option key={concepto.id} value={concepto.id}>
                                                {concepto.nombre}
                                            </option>
                                        ))}
                                    </AnimatedSelect>

                                    <button
                                        onClick={handleAddCatalogConcept}
                                        title="Añadir cuenta seleccionada"
                                        className="h-10 w-10 shrink-0 rounded-xl bg-zinc-900 text-white flex items-center justify-center hover:bg-[#F39200] transition-all"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>

                                    <button
                                        onClick={showCustomComposer ? resetCustomComposer : handleOpenCustomComposer}
                                        title={showCustomComposer ? 'Cancelar cuenta personalizada' : 'Nueva cuenta personalizada'}
                                        className="h-10 w-10 shrink-0 rounded-xl border border-zinc-200 bg-white text-zinc-700 flex items-center justify-center hover:border-[#F39200] hover:text-[#F39200] transition-all"
                                    >
                                        {showCustomComposer ? <X className="w-4 h-4" /> : <PencilLine className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>

                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Listado global</span>
                                <ClearSearchField
                                    value={typeof search === 'string' ? search : ''}
                                    onValueChange={(value) => setSearch(normalizeTextInputValue(value) || '')}
                                    placeholder="Buscar cuenta global"
                                    inputClassName="w-full h-10 rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-10 text-[12px] font-medium text-zinc-700 outline-none focus:border-[#F39200]"
                                />
                            </label>
                        </div>
                        {showCustomComposer ? (
                            <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-4">
                                <div className={`grid grid-cols-1 gap-3 items-end ${isCompactViewport ? '' : 'xl:grid-cols-[minmax(0,1fr)_auto_auto]'}`}>
                                    <label className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                            Nueva cuenta personalizada
                                        </span>
                                        <input
                                            autoFocus
                                            value={customConceptName}
                                            onChange={(event) => {
                                                setCustomConceptName(event.target.value);
                                                if (customConceptError) setCustomConceptError('');
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') {
                                                    event.preventDefault();
                                                    handleAddCustomConcept();
                                                }
                                                if (event.key === 'Escape') {
                                                    event.preventDefault();
                                                    resetCustomComposer();
                                                }
                                            }}
                                            placeholder="Ej. Bonificación extraordinaria"
                                            className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-[12px] font-semibold text-zinc-700 outline-none focus:border-[#F39200]"
                                        />
                                        {customConceptError ? (
                                            <div className="text-[11px] font-bold text-red-600">{customConceptError}</div>
                                        ) : (
                                            <div className="text-[11px] text-zinc-500">
                                                Se añadirá a la categoría activa y quedará disponible en el listado global con `0.00%`.
                                            </div>
                                        )}
                                    </label>
                                    <button
                                        type="button"
                                        onClick={resetCustomComposer}
                                        className="h-11 px-4 rounded-xl border border-zinc-200 bg-white text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 hover:border-zinc-300 hover:text-zinc-900 transition-all"
                                    >
                                        Cancelar
                                    </button>
                                    <LiquidButton
                                        onClick={handleAddCustomConcept}
                                        className="!h-11 !px-5 rounded-xl bg-[#1A1A1A] text-white text-[10px] font-black uppercase tracking-[0.16em]"
                                    >
                                        Crear cuenta
                                    </LiquidButton>
                                </div>
                            </div>
                        ) : null}
                    </div>

                    <div className={`flex-1 min-h-0 grid grid-cols-1 ${isCompactViewport ? '' : 'xl:grid-cols-[minmax(0,1fr)_320px]'}`}>
                        <div className={`min-h-0 flex flex-col ${isCompactViewport ? '' : 'border-r border-zinc-200'}`}>
                            {isCompactViewport ? (
                                <div className="px-4 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 border-b border-zinc-200 bg-white shrink-0">
                                    Cuentas activas
                                </div>
                            ) : (
                                <div className="grid grid-cols-[54px_minmax(0,1fr)_110px_1.1fr] gap-3 px-5 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 border-b border-zinc-200 bg-white shrink-0">
                                    <span>#</span>
                                    <span>Cuenta activa</span>
                                    <span className="text-right">%</span>
                                    <span>Observaciones</span>
                                </div>
                            )}

                            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-[#F8F9FB]">
                                {loading ? (
                                    <div className="px-5 py-10 text-[11px] font-bold text-zinc-500">Cargando indirectos...</div>
                                ) : listedItems.length === 0 ? (
                                    <div className="px-5 py-10 text-[11px] font-bold text-zinc-500">
                                        No hay cuentas que coincidan con el filtro global. Los indirectos se gestionan siempre como porcentaje.
                                    </div>
                                ) : listedItems.map((item, index) => {
                                    const isSelected = item.concepto_codigo === selectedItemCode;
                                    const itemCategoria = INDIRECTOS_CATEGORIAS.find((categoria) => categoria.codigo === item.categoria_codigo);
                                    return (
                                        <button
                                            key={item.concepto_codigo}
                                            onClick={() => setSelectedItemCode(item.concepto_codigo)}
                                            className={isCompactViewport
                                                ? `w-full px-4 py-3 text-[12px] border-b border-zinc-200 transition-colors text-left ${isSelected ? 'bg-orange-50' : 'bg-white hover:bg-zinc-50'}`
                                                : `w-full grid grid-cols-[54px_minmax(0,1fr)_110px_1.1fr] gap-3 px-5 py-2.5 text-[12px] border-b border-zinc-200 transition-colors text-left ${isSelected ? 'bg-orange-50' : 'bg-white hover:bg-zinc-50'}`
                                            }
                                        >
                                            {isCompactViewport ? (
                                                <div className="space-y-2">
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div className="min-w-0">
                                                            <div className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                                                #{index + 1} · {itemCategoria?.codigo || item.categoria_codigo}
                                                            </div>
                                                            <div className="mt-1 font-semibold text-zinc-800 leading-tight">
                                                                {item.nombre}
                                                                {item.fijo ? <span className="ml-2 text-[9px] uppercase tracking-[0.16em] text-[#F39200] font-black">Fijo</span> : null}
                                                            </div>
                                                        </div>
                                                        <div className="font-black tabular-nums text-right text-zinc-700 shrink-0">
                                                            {formatPercent(item.porcentaje)}
                                                        </div>
                                                    </div>
                                                    <div className="text-[11px] text-zinc-400">
                                                        {item.observaciones || 'Sin observaciones'}
                                                    </div>
                                                </div>
                                            ) : (
                                                <>
                                                    <span className="font-black text-zinc-500">{index + 1}</span>
                                                    <span className="font-semibold text-zinc-800 truncate">
                                                        <span className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400 mr-2">
                                                            {itemCategoria?.codigo || item.categoria_codigo}
                                                        </span>
                                                        {item.nombre}
                                                        {item.fijo ? <span className="ml-2 text-[9px] uppercase tracking-[0.16em] text-[#F39200] font-black">Fijo</span> : null}
                                                    </span>
                                                    <span className="font-black tabular-nums text-right text-zinc-700">
                                                        {formatPercent(item.porcentaje)}
                                                    </span>
                                                    <span className="text-zinc-400 truncate">{item.observaciones || 'Sin observaciones'}</span>
                                                </>
                                            )}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        <aside className={`min-h-0 bg-white flex flex-col ${isCompactViewport ? 'border-t border-zinc-200' : ''}`}>
                            <div className={`${isCompactViewport ? 'px-4 py-3' : 'px-5 py-4'} border-b border-zinc-200`}>
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <div className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Contexto activo</div>
                                        <div className="mt-1 text-[12px] font-bold text-zinc-900">
                                            {selectedItemCategoria?.codigo || categoriaActual?.codigo} · {selectedItemCategoria?.descripcion || categoriaActual?.descripcion}
                                        </div>
                                    </div>
                                    <button
                                        onClick={handleRemoveSelectedConcept}
                                        disabled={!canRemoveSelectedConcept}
                                        title={
                                            canRemoveSelectedConcept
                                                ? 'Quitar cuenta añadida sin uso'
                                                : 'Solo se pueden borrar cuentas añadidas con 0.00%'
                                        }
                                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-all hover:border-red-300 hover:text-red-500 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <div className={`${isCompactViewport ? 'p-4' : 'p-5'} flex-1 min-h-0 overflow-y-auto custom-scrollbar space-y-4 bg-[#FBFBFC]`}>
                                {error ? (
                                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[12px] font-semibold text-red-700">
                                        {error}
                                    </div>
                                ) : null}

                                <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                                    <div className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">Cuenta seleccionada</div>
                                    <div className="mt-1 text-[14px] font-black text-zinc-900 leading-tight">
                                        {selectedItem?.nombre || 'Sin cuenta seleccionada'}
                                    </div>
                                    {selectedItem ? (
                                        <div className="mt-2 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                            {selectedItemCategoria?.codigo || selectedItem.categoria_codigo} · {selectedItemCategoria?.descripcion || 'Categoría'}
                                        </div>
                                    ) : null}
                                </div>

                                <label className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Porcentaje aplicado</span>
                                    <input
                                        ref={porcentajeInputRef}
                                        type="text"
                                        value={formatNumericDisplay(Number(selectedItem?.porcentaje ?? 0).toFixed(2))}
                                        onChange={(event) => updateSelectedItem({ porcentaje: parseNumericInput(event.target.value) })}
                                        onFocus={(event) => event.target.select()}
                                        onBlur={() => {
                                            if (!selectedItem) return;
                                            const nextValue = Number(Number(parseNumericInput(selectedItem.porcentaje ?? 0) || 0).toFixed(2));
                                            updateSelectedItem({ porcentaje: nextValue });
                                        }}
                                        onKeyDown={(event) => {
                                            if (event.key === 'ArrowUp') {
                                                event.preventDefault();
                                                moveSelectedItem(-1);
                                            } else if (event.key === 'ArrowDown' || event.key === 'Enter') {
                                                event.preventDefault();
                                                moveSelectedItem(1);
                                            }
                                        }}
                                        disabled={!selectedItem}
                                        className="w-full h-11 rounded-xl border border-zinc-200 bg-white px-4 text-[13px] font-black text-zinc-900 outline-none focus:border-[#F39200] disabled:opacity-50"
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Observaciones</span>
                                    <textarea
                                        rows={5}
                                        value={normalizeOptionalText(selectedItem?.observaciones)}
                                        onChange={(event) => updateSelectedItem({ observaciones: normalizeOptionalText(event.target.value) })}
                                        disabled={!selectedItem}
                                        className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-[12px] font-medium text-zinc-700 outline-none focus:border-[#F39200] resize-none disabled:opacity-50"
                                        placeholder="Justificación, criterio de cálculo o notas del revisor"
                                    />
                                </label>
                            </div>

                            <div className={`${isCompactViewport ? 'p-4' : 'p-5'} border-t border-zinc-200 bg-white`}>
                                <LiquidButton onClick={handleSave} disabled={saving || loading} className="w-full bg-[#1A1A1A] gap-2">
                                    <Save className="w-4 h-4" /> {saving ? 'Guardando...' : 'Guardar Configuración'}
                                </LiquidButton>
                            </div>
                        </aside>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default IndirectosModal;
