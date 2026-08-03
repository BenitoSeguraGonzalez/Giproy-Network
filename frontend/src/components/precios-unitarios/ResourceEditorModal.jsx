import React, { useEffect, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, SpellCheck, Save, LayoutGrid, Package } from 'lucide-react';
import { Input } from '../ui/input';
import ClearSearchField from '../ui/ClearSearchField';
import { Label } from '../ui/label';
import { LiquidButton } from '../ui/liquid-button';
import SearchableSelect from '../ui/searchable-select';
import recursosApi from '../../api/recursos';
import { maestrosApi } from '../../api/maestros';
import { buildOmniClassOptions } from '../../utils/omniclass';
import { normalizeDescriptionCapitalization, normalizeDisplayUnit } from '../../utils/descriptionCapitalization';
import AnimatedSelect from '../ui/AnimatedSelect';
import { AppModalShell, AppModalHeader, AppModalBody, AppModalFooter } from '../ui/app-modal';

const ResourceEditorModal = ({
    isOpen,
    onClose,
    onSubmit,
    editingRecurso,
    form,
    setForm,
    unidades,
    onSpellCheck,
    title,
    subtitle,
    submitLabel,
    currentOmniClassTable,
    formatMonedaInput,
    enableOmniClass = true,
    currentCategoryId = null
}) => {
    const [cpcSearchTerm, setCpcSearchTerm] = useState('');
    const [cpcResults, setCpcResults] = useState([]);
    const [showCpcDropdown, setShowCpcDropdown] = useState(false);
    const [omniclassOptions, setOmniclassOptions] = useState([]);
    const [isOmniLoading, setIsOmniLoading] = useState(false);
    const [showOmniPanel, setShowOmniPanel] = useState(false);

    const handleOmniClassSearch = useCallback(async (term) => {
        if (!term || term.length < 2) return;
        setIsOmniLoading(true);
        try {
            const res = await maestrosApi.getOmniClassSearch(term, currentOmniClassTable);
            setOmniclassOptions(buildOmniClassOptions(res || []));
        } catch (error) {
            globalThis.reportClientError?.('Error searching OmniClass:', error);
        } finally {
            setIsOmniLoading(false);
        }
    }, [currentOmniClassTable]);

    const handleOmniClassOpen = useCallback(async () => {
        if (omniclassOptions.length > 0 || isOmniLoading) return;
        setIsOmniLoading(true);
        try {
            const res = await maestrosApi.getOmniClassTabla(currentOmniClassTable);
            setOmniclassOptions(buildOmniClassOptions(res || []));
        } catch (error) {
            globalThis.reportClientError?.('Error preloading OmniClass:', error);
        } finally {
            setIsOmniLoading(false);
        }
    }, [currentOmniClassTable, isOmniLoading, omniclassOptions.length]);

    useEffect(() => {
        if (!isOpen) return;
        setCpcSearchTerm('');
        setCpcResults([]);
        setShowCpcDropdown(false);
        setOmniclassOptions([]);
        setShowOmniPanel(false);
    }, [isOpen, currentOmniClassTable]);

    const resolvedCategoryId = Number(
        currentCategoryId
        || editingRecurso?.recurso?.subcategoria_codigo
        || editingRecurso?.subcategoria_codigo
        || editingRecurso?.categoria_id
        || 0
    );
    const showEquipmentOwnershipField = resolvedCategoryId === 1;
    const governingKindOptions = resolvedCategoryId === 1
        ? [
            { value: 'equipo_maquinaria', label: 'Equipo / Maquinaria' },
            { value: 'herramientas', label: 'Herramientas' },
        ]
        : resolvedCategoryId === 4
            ? [
                { value: 'mano_obra_especializada', label: 'Mano de obra especializada' },
                { value: 'mano_obra_semiespecializada', label: 'Mano de obra semiespecializada' },
                { value: 'mano_obra_no_especializada', label: 'Mano de obra no especializada' },
            ]
            : [];

    useEffect(() => {
        if (!enableOmniClass) {
            setShowOmniPanel(false);
        }
    }, [enableOmniClass]);

    useEffect(() => {
        if (!showEquipmentOwnershipField && form?.equipment_ownership_kind) {
            setForm((prev) => ({ ...prev, equipment_ownership_kind: '' }));
        }
    }, [form?.equipment_ownership_kind, setForm, showEquipmentOwnershipField]);

    useEffect(() => {
        if (!governingKindOptions.length) {
            if (form?.governing_resource_kind) {
                setForm((prev) => ({ ...prev, governing_resource_kind: '' }));
            }
            return;
        }
        if (!form?.governing_resource_kind) {
            setForm((prev) => ({ ...prev, governing_resource_kind: governingKindOptions[0].value }));
        }
    }, [form?.governing_resource_kind, governingKindOptions, setForm]);

    useEffect(() => {
        if (!isOpen) return undefined;
        const delayDebounceFn = setTimeout(async () => {
            try {
                const res = await recursosApi.searchCPC(cpcSearchTerm);
                setCpcResults(res.data || []);
                if (cpcSearchTerm.length === 0 && (res.data || []).length === 0) {
                    setShowCpcDropdown(false);
                }
            } catch (error) {
                globalThis.reportClientError?.('Error searching CPC:', error);
            }
        }, 300);
        return () => clearTimeout(delayDebounceFn);
    }, [cpcSearchTerm, isOpen]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <AppModalShell
                    isOpen={isOpen}
                    onClose={onClose}
                    size="lg"
                    zIndex="z-[1000]"
                    overlayClassName="overflow-y-auto"
                    panelClassName="max-h-[calc(100dvh-1.5rem)] flex flex-col"
                >
                    <AppModalHeader
                        title={title || (editingRecurso ? 'Modificar recurso' : 'Nuevo recurso')}
                        subtitle={subtitle}
                        icon={Package}
                        iconClassName="text-[#F39200]"
                        iconWrapClassName="border border-orange-100 bg-orange-50"
                        onClose={onClose}
                    />
                    <form onSubmit={onSubmit} className="min-h-0 flex flex-1 flex-col">
                        <AppModalBody className="min-h-0 flex-1 overflow-y-auto bg-[#f7f7f5] p-4 md:p-5 custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                            <div className="md:col-span-2 space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest ml-1 text-zinc-400 italic">
                                    Descripción del Insumo / Recurso *
                                </Label>
                                <Input
                                    required
                                    value={form.descripcion || ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, descripcion: e.target.value }))}
                                    onBlur={(e) => setForm((prev) => ({ ...prev, descripcion: normalizeDescriptionCapitalization(e.target.value) }))}
                                    className="h-11 bg-zinc-50 border-zinc-200 rounded-xl font-bold text-sm focus:ring-2 focus:ring-[#F39200]/20"
                                    placeholder="Ej: Cemento Holcim 50kg"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest ml-1 text-zinc-400 italic">
                                    Precio Dolar (sin indirectos)*
                                </Label>
                                <Input
                                    required
                                    type="text"
                                    value={form.precio || ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, precio: e.target.value }))}
                                    onBlur={() => setForm((prev) => ({ ...prev, precio: formatMonedaInput(prev.precio) }))}
                                    className="h-11 bg-zinc-50 border-orange-100 rounded-xl font-black text-base text-[#F39200] focus:ring-2 focus:ring-orange-500/20"
                                    placeholder={formatMonedaInput(0)}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[9px] font-black uppercase tracking-widest ml-1 text-zinc-400 italic">
                                    Unidad de Medida *
                                </Label>
                                <div className="flex items-center gap-3">
                                    <div className="relative flex-1 group">
                                        <AnimatedSelect
                                            required
                                            value={form.unidad_id || ''}
                                            onChange={(e) => setForm((prev) => ({ ...prev, unidad_id: e.target.value }))}
                                            className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl px-4 pr-10 text-sm font-bold outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none"
                                        >
                                            {unidades.map((u) => (
                                                <option key={u.id} value={u.id}>
                                                    {normalizeDisplayUnit(u.descripcion)} - {normalizeDisplayUnit(u.descripcion_completa)}
                                                </option>
                                            ))}
                                        </AnimatedSelect>
                                    </div>
                                    {enableOmniClass && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowOmniPanel((prev) => !prev);
                                                if (!showOmniPanel) {
                                                    handleOmniClassOpen();
                                                }
                                            }}
                                            className={`h-11 w-11 shrink-0 rounded-xl border transition-all flex items-center justify-center ${
                                                showOmniPanel || form.omniclass_codigo
                                                    ? 'border-blue-200 bg-blue-50 text-blue-600'
                                                    : 'border-zinc-200 bg-white text-zinc-400 hover:text-zinc-700'
                                            }`}
                                            title={
                                                form.omniclass_codigo
                                                    ? `OmniClass ${form.omniclass_codigo}`
                                                    : `Asignar OmniClass Tabla ${currentOmniClassTable}`
                                            }
                                        >
                                            <LayoutGrid className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {showEquipmentOwnershipField && (
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 text-zinc-400 italic">
                                        Propiedad Clásica Del Equipo
                                    </Label>
                                    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] gap-3 items-start">
                                        <div className="relative group">
                                            <AnimatedSelect
                                                value={form.equipment_ownership_kind || ''}
                                                onChange={(e) => setForm((prev) => ({ ...prev, equipment_ownership_kind: e.target.value }))}
                                                className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl px-4 pr-10 text-sm font-bold outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none"
                                            >
                                                <option value="">Sin declarar</option>
                                                <option value="owned">Equipo propio</option>
                                                <option value="rented">Equipo alquilado</option>
                                            </AnimatedSelect>
                                        </div>
                                        <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-3 py-2 text-[10px] font-bold leading-snug text-blue-700">
                                            Define si el costo temporal del equipo es propio o alquilado para habilitar crashing económico real en Gantt.
                                        </div>
                                    </div>
                                </div>
                            )}

                            {governingKindOptions.length > 0 && (
                                <div className="md:col-span-2 space-y-2">
                                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 text-zinc-400 italic">
                                        Clasificación Gobernante Clásica
                                    </Label>
                                    <div className="grid grid-cols-1 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.4fr)] gap-3 items-start">
                                        <div className="relative group">
                                            <AnimatedSelect
                                                value={form.governing_resource_kind || ''}
                                                onChange={(e) => setForm((prev) => ({ ...prev, governing_resource_kind: e.target.value }))}
                                                className="w-full h-11 bg-zinc-50 border border-zinc-200 rounded-xl px-4 pr-10 text-sm font-bold outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none"
                                            >
                                                {governingKindOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </AnimatedSelect>
                                        </div>
                                        <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 px-3 py-2 text-[10px] font-bold leading-snug text-emerald-700">
                                            Esta clasificación se usa para resolver el recurso gobernante del APU con la cascada oficial del cronograma.
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="md:col-span-2 space-y-2 relative">
                                <Label className="text-[9px] font-black uppercase tracking-widest ml-1 text-zinc-400 italic">
                                    Asociar Código CPC
                                </Label>
                                <div className="relative group">
                                    <ClearSearchField
                                        value={form.cpc_display || cpcSearchTerm || ''}
                                        onValueChange={(value) => {
                                            setCpcSearchTerm(value);
                                            setForm((prev) => ({ ...prev, cod_cpc_id: null, cpc_display: '' }));
                                            setShowCpcDropdown(true);
                                        }}
                                        onFocus={() => setShowCpcDropdown(true)}
                                        placeholder="Buscar CPC..."
                                        searchIconClassName="left-4"
                                        inputClassName="w-full h-11 pl-11 pr-10 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-bold"
                                    />
                                    {form.cod_cpc_id && (
                                        <button
                                            type="button"
                                            onClick={() => setForm((prev) => ({ ...prev, cod_cpc_id: null, cpc_display: '' }))}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-zinc-200 rounded-full"
                                        >
                                            <X className="w-3 h-3 text-zinc-500" />
                                        </button>
                                    )}
                                </div>
                                <AnimatePresence>
                                    {showCpcDropdown && cpcResults.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute z-[260] left-0 right-0 top-full mt-2 bg-white border border-zinc-200 rounded-2xl shadow-2xl max-h-60 overflow-y-auto"
                                        >
                                            {cpcResults.map((cpc) => (
                                                <button
                                                    key={cpc.id}
                                                    type="button"
                                                    onClick={() => {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            cod_cpc_id: cpc.id,
                                                            cpc_display: `${cpc.codCPC} - ${cpc.descripcion}`,
                                                        }));
                                                        setShowCpcDropdown(false);
                                                        setCpcSearchTerm('');
                                                    }}
                                                    className="w-full p-4 flex flex-col text-left hover:bg-zinc-50 border-b border-zinc-50 last:border-0 transition-colors"
                                                >
                                                    <span className="text-[10px] font-black text-[#F39200]">{cpc.codCPC}</span>
                                                    <span className="text-xs font-bold text-zinc-800 line-clamp-1">{cpc.descripcion}</span>
                                                </button>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <AnimatePresence initial={false}>
                                {enableOmniClass && showOmniPanel && (
                                    <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: 'auto', opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="md:col-span-2 overflow-hidden"
                                    >
                                        <div className="p-6 bg-blue-50/40 rounded-3xl border border-blue-100 space-y-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <Label className="text-[10px] font-black uppercase tracking-widest text-blue-600 ml-1 italic">
                                                        Clasificación OmniClass Tabla {currentOmniClassTable}
                                                    </Label>
                                                    <p className="mt-1 text-[11px] font-bold text-zinc-500">
                                                        Asigne OmniClass solo cuando haga falta, sin ocupar una banda fija del modal.
                                                    </p>
                                                </div>
                                                {form.omniclass_codigo && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setForm((prev) => ({ ...prev, omniclass_codigo: '', omniclass_titulo: '' }))}
                                                        className="text-[9px] font-black text-red-500 uppercase tracking-widest hover:underline"
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
                                                    const selected = omniclassOptions.find((o) => o.codigo === val);
                                                    if (selected) {
                                                        setForm((prev) => ({
                                                            ...prev,
                                                            omniclass_codigo: selected.codigo,
                                                            omniclass_titulo: selected.titulo_resuelto || selected.titulo,
                                                        }));
                                                    }
                                                }}
                                                className="bg-white h-11 text-[11px]"
                                            />

                                            {(form.omniclass_codigo || form.omniclass_titulo) && (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    {form.omniclass_codigo && (
                                                        <span className="px-3 py-1 rounded-full bg-white border border-blue-100 text-[10px] font-black tracking-widest text-blue-600">
                                                            {form.omniclass_codigo}
                                                        </span>
                                                    )}
                                                    {form.omniclass_titulo && (
                                                        <span className="text-[10px] font-bold uppercase tracking-tight text-zinc-500">
                                                            {form.omniclass_titulo}
                                                        </span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <div className="md:col-span-2 space-y-2">
                                <div className="flex justify-between items-center mb-1">
                                    <Label className="text-[9px] font-black uppercase tracking-widest ml-1 text-zinc-400 italic">
                                        Especificaciones / Ficha Técnica
                                    </Label>
                                    <button
                                        type="button"
                                        onClick={onSpellCheck}
                                        className="flex items-center gap-1 text-[10px] font-black text-[#F39200] hover:underline uppercase tracking-widest"
                                    >
                                        <SpellCheck className="w-3 h-3" /> Revisar Ortografía
                                    </button>
                                </div>
                                <textarea
                                    value={form.especificaciones || ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, especificaciones: e.target.value }))}
                                    className="w-full h-24 p-4 bg-zinc-50 border border-zinc-100 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#F39200]/10"
                                    placeholder="..."
                                />
                            </div>

                            </div>
                        </AppModalBody>
                        <AppModalFooter variant="flat" className="flex-wrap border-t border-[#ececec] bg-[#f7f7f5]">
                            <button
                                type="button"
                                onClick={onClose}
                                title="Cancelar"
                                aria-label="Cancelar"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <LiquidButton type="submit" title={submitLabel} aria-label={submitLabel} className="h-11 w-11 !min-w-0 rounded-xl !px-0">
                                <Save className="w-4 h-4" />
                            </LiquidButton>
                        </AppModalFooter>
                    </form>
                </AppModalShell>
            )}
        </AnimatePresence>
    );
};

export default ResourceEditorModal;
