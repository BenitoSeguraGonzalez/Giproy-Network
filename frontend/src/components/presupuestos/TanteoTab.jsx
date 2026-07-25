import React, { useState, useEffect, useMemo, useContext } from 'react';
import { usePresupuestoActions, usePresupuestoData, usePresupuestoSelection } from '../../context/PresupuestoContext';
import { AuthContext } from '../../context/AuthContext';
import { Wrench, Users, Calculator, Save, X, AlertCircle, RotateCcw, CheckCircle2, Package, Truck } from 'lucide-react';
import CodeColorizer from '../../utils/codeColorizer';
import { normalizeDescriptionCapitalization } from '../../utils/descriptionCapitalization';
import apusApi from '../../api/apus';
import { presupuestosApi } from '../../api/presupuestos';
import { appAlert, appConfirm } from '../../utils/appDialog';
import { useFormatters } from '../../hooks/useFormatters';
import { roundDecimal } from '../../utils/math';
import {
    divideDecimalNumber,
    roundDecimalNumber,
    sumDecimalNumber,
    toDecimalNumber,
} from '../../utils/decimalNumbers';
import {
    resolveApuLineOperationalSubtotal,
    resolveApuLineSimulatedSubtotal,
} from '../../utils/operationalNumbers';

const sameEntityId = (left, right) => String(left ?? '') === String(right ?? '');
const resolveLineApuId = (line) => line?.apu_id ?? line?.apu?.id ?? null;
const getTanteoInputs = () => Array.from(document.querySelectorAll('[data-tanteo-linea-id]:not(:disabled)'));
const roundMoneyCascade = (value, decimals = 2) => roundDecimalNumber(value || 0, decimals);
const EDITABLE_TANTEO_SUBCATEGORY_CODES = new Set([1, 4]);

const TanteoTab = ({ sidebar = false, onHide }) => {
    const { activePresupuesto, config } = usePresupuestoData();
    const { selectedLineId } = usePresupuestoSelection();
    const { selectedEmpresa, user } = useContext(AuthContext);
    
    // -- Robust formatters with fallbacks --
    const formatters = useFormatters();
    const formatNumericDisplay = formatters?.formatNumericDisplay || ((v) => String(v || '').replace('.', ','));
    const parseNumericInput = formatters?.parseNumericInput || ((v) => String(v || '').replace(',', '.'));
    const { formatMoneda, precisionCalculo = 4, precisionMoneda = 2 } = formatters || {};

    const [selectedApuId, setSelectedApuId] = useState(null);
    const [apuDetails, setApuDetails] = useState(null);
    const [loadingApu, setLoadingApu] = useState(false);
    const [tanteoValues, setTanteoValues] = useState({});
    const [tanteoDrafts, setTanteoDrafts] = useState({});
    const [tanteoEditOrigins, setTanteoEditOrigins] = useState({});

    // Update selectedApuId when selectedLineId changes in context
    const { updateTanteoSession, clearTanteoSession, refreshActivePresupuesto } = usePresupuestoActions();
    const [applySuccess, setApplySuccess] = useState(false);
    const currentEmpresaId = selectedEmpresa?.id || user?.empresa_id || null;
    const indirectosPorcentaje = Number(config?.indirectos_porcentaje || activePresupuesto?.indirectos_porcentaje || 0);
    
    useEffect(() => {
        if (selectedLineId && activePresupuesto?.detalle) {
            const line = activePresupuesto.detalle.find((l) => sameEntityId(l.id, selectedLineId));
            if (line) {
                const nextApuId = resolveLineApuId(line);
                if (!nextApuId) {
                    setSelectedApuId(null);
                    setApuDetails(null);
                    setTanteoValues({});
                    setTanteoDrafts({});
                    setTanteoEditOrigins({});
                    return;
                }
                // If switching lines, clear the PREVIOUS simulation to avoid confusion
                if (selectedApuId && !sameEntityId(selectedApuId, nextApuId)) {
                    clearTanteoSession(selectedApuId);
                }
                setSelectedApuId(nextApuId);
                setApuDetails(null);
                setTanteoValues({});
                setTanteoDrafts({});
                setTanteoEditOrigins({});
            } else {
                setSelectedApuId(null);
                setApuDetails(null);
                setTanteoValues({});
                setTanteoDrafts({});
                setTanteoEditOrigins({});
            }
        }
    }, [selectedLineId, activePresupuesto, selectedApuId, clearTanteoSession]);

    // Cleanup session when closing sidebar
    useEffect(() => {
        return () => {
            if (sidebar && selectedApuId) {
                clearTanteoSession(selectedApuId);
            }
        };
    }, [sidebar, selectedApuId, clearTanteoSession]);

    // Use lines from budget, deduplicate by APU ID
    const apusInBudget = useMemo(() => {
        const result = [];
        const seenApus = new Set();

        (activePresupuesto?.detalle || []).forEach(l => {
            if (l.apu_id && !seenApus.has(l.apu_id)) {
                seenApus.add(l.apu_id);
                result.push(l);
            }
        });
        return result;
    }, [activePresupuesto?.detalle]);

    // Fetch full APU details when selectedApuId changes
    useEffect(() => {
        const fetchApu = async () => {
            if (!selectedApuId) return;
            try {
                setLoadingApu(true);
                setApuDetails(null); // Clear before fetch
                const response = await apusApi.getById(selectedApuId, currentEmpresaId);
                setApuDetails(response?.data || response);
            } catch (error) {
                globalThis.reportClientError?.("Error al cargar detalle de APU para tanteo:", error);
            } finally {
                setLoadingApu(false);
            }
        };
        fetchApu();
    }, [selectedApuId, currentEmpresaId]);

    const selectedApuReference = apusInBudget.find((a) => sameEntityId(resolveLineApuId(a), selectedApuId));
    const selectedItemCode = String(
        selectedApuReference?.codigo_item
        || apuDetails?.codigo_item
        || apuDetails?.codigo
        || ''
    ).trim();
    const selectedEdtCode = String(
        selectedApuReference?.edt_codigo
        || selectedApuReference?.codigo_edt
        || selectedApuReference?.edt?.codigo
        || ''
    ).trim();
    const selectedDescription = normalizeDescriptionCapitalization(
        apuDetails?.descripcion || selectedApuReference?.descripcion || 'Sin descripcion'
    );
    const hasTanteoChanges = Object.keys(tanteoValues).length > 0;

    // Extraction of resources from real APU lines
    const realRecursos = useMemo(() => {
        if (!apuDetails?.lineas) return [];
        return apuDetails.lineas
            .filter(l => l.recurso) // Only physical resources for now
            .map(l => ({
                linea_id: l.id,
                id: l.recurso.id,
                codigo: l.recurso.codigo,
                descripcion: l.recurso.descripcion,
                unidad: l.recurso.unidad || 'UND',
                precio_base: l.recurso.precio,
                precio_congelado: l.precio_congelado,
                subtotal: l.subtotal,
                cantidad: l.cantidad,
                rendimiento: l.rendimiento || 1.0,
                subcategoria_codigo: Number(l.recurso.subcategoria_codigo || 0),
                tanteo_activo: Boolean(l.tanteo_activo),
                rendimiento_original: l.rendimiento_original !== null && l.rendimiento_original !== undefined
                    ? l.rendimiento_original
                    : null
            }));
    }, [apuDetails]);

    const calculations = useMemo(() => {
        if (!realRecursos.length) return { original: 0, simulated: 0, delta: 0, percent: 0, baseline: 0 };
        const hasDraftChanges = Object.keys(tanteoValues).length > 0;
        
        // Calculate Base Direct Cost (Original) and Simulated Direct Cost
        const originalDirect = sumDecimalNumber(realRecursos.map((r) => (
            resolveApuLineOperationalSubtotal(r, { moneyDecimals: precisionMoneda })
        )), { decimals: precisionMoneda });
        const simulatedDirect = sumDecimalNumber(realRecursos.map((r) => {
            const currentRendimiento = tanteoValues[r.linea_id] ?? r.rendimiento;
            return resolveApuLineSimulatedSubtotal(r, {
                moneyDecimals: precisionMoneda,
                rendimiento: currentRendimiento,
            });
        }), { decimals: precisionMoneda });

        const indirectFactor = sumDecimalNumber([1, divideDecimalNumber(indirectosPorcentaje, 100, { decimals: 6 })], { decimals: 6 });
        const originalFunctional = roundMoneyCascade(originalDirect * indirectFactor, precisionMoneda);
        const simulatedFunctional = roundMoneyCascade(simulatedDirect * indirectFactor, precisionMoneda);

        const budgetUnitPrice = roundMoneyCascade(selectedApuReference?.precio_unitario ?? 0, precisionMoneda);
        const persistedApuPrice = roundMoneyCascade(apuDetails?.precio_unitario_total || originalFunctional, precisionMoneda);
        const baselineOriginal = budgetUnitPrice || persistedApuPrice || originalFunctional;
        const simulationDelta = roundMoneyCascade(
            sumDecimalNumber([simulatedFunctional, -originalFunctional], { decimals: precisionMoneda }),
            precisionMoneda
        );
        const totalOriginal = baselineOriginal;
        const simulatedTotal = hasDraftChanges
            ? roundMoneyCascade(
                sumDecimalNumber([baselineOriginal, simulationDelta], { decimals: precisionMoneda }),
                precisionMoneda
            )
            : totalOriginal;
        
        const delta = roundMoneyCascade(sumDecimalNumber([simulatedTotal, -totalOriginal], { decimals: precisionMoneda }), precisionMoneda);
        const percent = totalOriginal !== 0 ? divideDecimalNumber(delta, totalOriginal, { decimals: 6 }) * 100 : 0;
        
        return { 
            original: totalOriginal, 
            simulated: simulatedTotal, 
            delta, 
            percent,
            baseline: baselineOriginal,
        };
    }, [realRecursos, tanteoValues, apuDetails, selectedApuReference, precisionMoneda, indirectosPorcentaje]);

    // Broadcast simulation to global context
    useEffect(() => {
        const hasDraftChanges = Object.keys(tanteoValues).length > 0;
        if (selectedApuId && hasDraftChanges && calculations.simulated > 0) {
            updateTanteoSession(selectedApuId, calculations.simulated);
            return;
        }
        if (selectedApuId) {
            clearTanteoSession(selectedApuId);
        }
    }, [selectedApuId, calculations.simulated, tanteoValues, updateTanteoSession, clearTanteoSession]);

    const handleTanteoChange = (lineaId, value) => {
        setTanteoDrafts(prev => ({
            ...prev,
            [lineaId]: value
        }));
        const parsed = toDecimalNumber(parseNumericInput(value), '0');
        setTanteoValues(prev => {
            if (!String(value).trim() || !Number.isFinite(parsed)) {
                const next = { ...prev };
                delete next[lineaId];
                return next;
            }
            return {
                ...prev,
                [lineaId]: parsed
            };
        });
    };

    const handleTanteoFocus = (lineaId, currentValue, event) => {
        setTanteoEditOrigins(prev => (
            Object.prototype.hasOwnProperty.call(prev, lineaId)
                ? prev
                : { ...prev, [lineaId]: toDecimalNumber(currentValue ?? 0, '0') }
        ));
        setTanteoDrafts(prev => ({
            ...prev,
            [lineaId]: formatNumericDisplay(currentValue, precisionCalculo)
        }));
        event.target.select();
    };

    const handleTanteoBlur = (lineaId) => {
        setTanteoDrafts(prev => {
            if (!Object.prototype.hasOwnProperty.call(prev, lineaId)) return prev;
            const raw = prev[lineaId];
            const parsed = toDecimalNumber(parseNumericInput(raw), '0');
            const next = { ...prev };
            if (!String(raw).trim() || !Number.isFinite(parsed)) {
                delete next[lineaId];
                return next;
            }
            next[lineaId] = formatNumericDisplay(parsed, precisionCalculo);
            return next;
        });
        setTanteoEditOrigins(prev => {
            const next = { ...prev };
            delete next[lineaId];
            return next;
        });
    };

    const handleTanteoCancel = (lineaId) => {
        const resourceLine = realRecursos.find((rec) => sameEntityId(rec.linea_id, lineaId));
        const originValue = Object.prototype.hasOwnProperty.call(tanteoEditOrigins, lineaId)
            ? tanteoEditOrigins[lineaId]
            : (resourceLine?.rendimiento ?? 0);

        setTanteoDrafts(prev => ({
            ...prev,
            [lineaId]: formatNumericDisplay(originValue, precisionCalculo)
        }));
        setTanteoValues(prev => {
            const next = { ...prev };
            delete next[lineaId];
            return next;
        });
        setTanteoEditOrigins(prev => {
            const next = { ...prev };
            delete next[lineaId];
            return next;
        });
    };

    const focusTanteoInputForLine = (lineaId) => {
        const input = document.querySelector(`[data-tanteo-linea-id="${lineaId}"]`);
        if (input instanceof HTMLInputElement) {
            requestAnimationFrame(() => {
                input.focus();
                input.select();
            });
        }
    };

    const handleTanteoCommitAndNext = (lineaId) => {
        handleTanteoBlur(lineaId);

        const inputs = getTanteoInputs();
        if (inputs.length === 0) return;

        const currentIndex = inputs.findIndex(
            (input) => input.getAttribute('data-tanteo-linea-id') === String(lineaId)
        );
        if (currentIndex < 0) return;

        const nextIndex = currentIndex + 1 >= inputs.length ? 0 : currentIndex + 1;
        const nextId = parseInt(inputs[nextIndex].getAttribute('data-tanteo-linea-id'));
        focusTanteoInputForLine(nextId);
    };

    const handleRevertTanteo = async (apuLineaId) => {
        const confirmed = await appConfirm({
            title: 'Restaurar recurso',
            message: '¿Deseas restaurar el rendimiento original de esta línea del APU?',
            confirmLabel: 'Restaurar',
            cancelLabel: 'Cancelar',
            tone: 'warning'
        });
        if (!confirmed) return;
        try {
            await presupuestosApi.revertTanteoRecurso(activePresupuesto.id, apuLineaId, currentEmpresaId);
            appAlert("Recurso restaurado.");
            // Refresh details to get new official price
            await refreshActivePresupuesto();
            const response = await apusApi.getById(selectedApuId, currentEmpresaId);
            setApuDetails(response?.data || response);
            setTanteoValues({});
            setTanteoDrafts({});
            clearTanteoSession(selectedApuId);
        } catch (error) {
            globalThis.reportClientError?.("Error revirtiendo tanteo:", error);
            appAlert("Error al restaurar el recurso.");
        }
    };

    const handleApplyTanteo = async () => {
        if (Object.keys(tanteoValues).length === 0) {
            appAlert("No hay cambios para aplicar.");
            return;
        }
        
        try {
            const mutaciones = Object.entries(tanteoValues)
                .map(([recId, newVal]) => {
                    const recurso = realRecursos.find((item) => item.linea_id === parseInt(recId));
                    if (!recurso?.id || !EDITABLE_TANTEO_SUBCATEGORY_CODES.has(Number(recurso.subcategoria_codigo || 0))) return null;
                    return {
                        apu_linea_id: parseInt(recId),
                        recurso_id: recurso.id,
                        nuevo_rendimiento: newVal
                    };
                })
                .filter(Boolean);

            if (mutaciones.length === 0) {
                appAlert("No se encontraron líneas válidas para aplicar el tanteo.");
                return;
            }
            
            await presupuestosApi.applyTanteo(activePresupuesto.id, mutaciones, currentEmpresaId);
            
            // Refrescar datos sin recargar página
            await refreshActivePresupuesto();
            const response = await apusApi.getById(selectedApuId, currentEmpresaId);
            setApuDetails(response?.data || response);
            
            // Feedback visual suave
            setApplySuccess(true);
            setTimeout(() => setApplySuccess(false), 3000);
            
            // Limpiar valores del tanteo ya aplicados
            setTanteoValues({});
            setTanteoDrafts({});
            clearTanteoSession(selectedApuId);
            // Importante: No cerramos el sidebar para que el usuario pueda seguir trabajando
        } catch (error) {
            globalThis.reportClientError?.("Error aplicando tanteo:", error);
            appAlert("Error al aplicar el tanteo.");
        }
    };

    if (loadingApu) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-zinc-200 border-t-orange-500 rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className={`flex bg-[#f7f7f5] rounded-[1.25rem] border border-[#e2ded6] overflow-hidden shadow-[6px_6px_16px_#e2e2de,-6px_-6px_16px_#ffffff] h-full ${sidebar ? 'flex-col' : 'gap-4'}`}>
            {!sidebar && (
                <div className="w-[350px] flex flex-col border-r border-zinc-100 shrink-0">
                    <div className="flex h-[152px] items-end bg-[#111318] px-5 py-3">
                        <h3 className="text-[12px] font-black text-white uppercase tracking-tight">Presupuesto en Uso</h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                        {apusInBudget.map(apu => (
                            <button
                                key={apu.id}
                                onClick={() => { 
                                    setSelectedApuId(apu.apu_id); 
                                    setApuDetails(null);
                                    setTanteoValues({});
                                    setTanteoDrafts({});
                                }}
                                className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all border text-left ${selectedApuId === apu.apu_id ? 'bg-[#111318] text-white' : 'border-[#e2ded6] bg-white hover:bg-amber-50/40'}`}
                            >
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold truncate">{normalizeDescriptionCapitalization(apu.descripcion)}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex h-[152px] shrink-0 items-center border-b border-[#272b33] bg-[#111318] px-4 py-3 text-white">
                    {!selectedApuId ? (
                        <div className="flex min-w-0 items-center">
                            <h2 className="text-[14px] font-black leading-none tracking-tight text-white">Sin seleccion</h2>
                        </div>
                    ) : (
                        <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5">
                            <div className="flex min-w-0 items-center gap-2">
                                <div className="flex shrink-0 items-center gap-1.5">
                                    {selectedEdtCode && (
                                        <CodeColorizer code={selectedEdtCode} className="text-[10px]" />
                                    )}
                                    <CodeColorizer code={selectedItemCode || 'S/N'} className="text-[10px]" />
                                </div>
                                <h2 className="min-w-0 flex-1 truncate text-[14px] font-black leading-tight tracking-tight text-white" title={selectedDescription}>
                                    {selectedDescription}
                                </h2>
                                {onHide && (
                                    <button
                                        onClick={onHide}
                                        className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/8 bg-[#15181d] text-white/62 shadow-[3px_3px_8px_rgba(0,0,0,0.32),-2px_-2px_6px_rgba(255,255,255,0.045)] transition hover:border-white/14 hover:bg-[#1b1f25] hover:text-white active:translate-y-[1px] active:scale-[0.96] active:shadow-[inset_4px_4px_9px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.06)]"
                                        title="Cerrar tanteo"
                                    >
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>

                            <div className="giproy-motion-scrollbar-hide flex min-w-0 items-center gap-2 overflow-x-auto">
                                <div className="inline-flex h-9 min-w-[124px] shrink-0 items-center gap-2 rounded-full border border-white/8 bg-[#15181d] px-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]">
                                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#ff2d55]" />
                                    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-white/58">Original</span>
                                    <span className="ml-auto text-[12px] font-black tabular-nums text-white">{formatMoneda(calculations.original)}</span>
                                    <span className="text-[9px] font-bold text-white/42">/{String(apuDetails?.unidad || 'und').toLowerCase()}</span>
                                </div>

                                <div className={`inline-flex h-9 min-w-[124px] shrink-0 items-center gap-2 rounded-full border px-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] ${calculations.delta === 0 ? 'border-white/8 bg-[#15181d]' : calculations.delta > 0 ? 'border-red-400/22 bg-red-500/10' : 'border-emerald-400/22 bg-emerald-500/10'}`}>
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${calculations.delta > 0 ? 'bg-red-400' : calculations.delta < 0 ? 'bg-emerald-400' : 'bg-[#F39200]'}`} />
                                    <span className={`text-[8px] font-black uppercase tracking-[0.12em] ${calculations.delta === 0 ? 'text-white/58' : calculations.delta > 0 ? 'text-red-100/80' : 'text-emerald-100/80'}`}>Simulado</span>
                                    <span className={`ml-auto text-[12px] font-black tabular-nums ${calculations.delta > 0 ? 'text-red-100' : calculations.delta < 0 ? 'text-emerald-100' : 'text-white'}`}>{formatMoneda(calculations.simulated)}</span>
                                    <span className={`text-[9px] font-bold ${calculations.delta === 0 ? 'text-white/42' : calculations.delta > 0 ? 'text-red-100/58' : 'text-emerald-100/58'}`}>/{String(apuDetails?.unidad || 'und').toLowerCase()}</span>
                                </div>

                                <div className={`inline-flex h-9 min-w-[88px] shrink-0 items-center gap-2 rounded-full border px-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] ${calculations.delta === 0 ? 'border-white/8 bg-[#15181d]' : calculations.delta > 0 ? 'border-red-400/22 bg-red-500/10' : 'border-emerald-400/22 bg-emerald-500/10'}`}>
                                    <span className="text-[8px] font-black uppercase tracking-[0.12em] text-white/58">Delta</span>
                                    <span className={`ml-auto text-[11px] font-black tabular-nums ${calculations.delta > 0 ? 'text-red-100' : calculations.delta < 0 ? 'text-emerald-100' : 'text-white/62'}`}>
                                        {calculations.delta > 0 ? '+' : ''}{calculations.percent.toFixed(1)}%
                                    </span>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleApplyTanteo}
                                    disabled={!hasTanteoChanges}
                                    title={applySuccess ? 'Tanteo aplicado con éxito' : 'Aplicar tanteo al APU'}
                                    aria-label={applySuccess ? 'Tanteo aplicado con éxito' : 'Aplicar tanteo al APU'}
                                    className={`inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[0.85rem] border transition-all duration-200 ${
                                        applySuccess
                                            ? 'border-emerald-400/28 bg-emerald-500/12 text-emerald-100'
                                            : !hasTanteoChanges
                                                ? 'pointer-events-none border-white/8 bg-[#15181d] text-white/32 shadow-[3px_3px_8px_rgba(0,0,0,0.32),-2px_-2px_6px_rgba(255,255,255,0.045)]'
                                                : 'border-[#F39200]/30 bg-[#15181d] text-white/84 shadow-[3px_3px_8px_rgba(0,0,0,0.32),-2px_-2px_6px_rgba(255,255,255,0.045)] hover:border-[#F39200]/55 hover:bg-[#1b1f25] hover:text-white active:translate-y-[1px] active:scale-[0.96] active:shadow-[inset_4px_4px_9px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.06)]'
                                    }`}
                                >
                                    {applySuccess ? (
                                        <CheckCircle2 className="h-3.5 w-3.5 animate-in zoom-in" />
                                    ) : (
                                        <Save className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {!selectedApuId ? (
                    <div className="flex-1 bg-white" />
                ) : (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar bg-white">
                            <div className="flex items-center justify-between">
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-[#F39200]" /> Ajuste de Rendimientos
                                </h3>
                                {Object.keys(tanteoValues).length > 0 && (
                                    <button 
                                        onClick={() => {
                                            setTanteoValues({});
                                            setTanteoDrafts({});
                                            clearTanteoSession(selectedApuId);
                                        }} 
                                        className="inline-flex min-h-11 items-center px-2 text-[9px] font-bold text-blue-600 hover:underline"
                                    >
                                        Limpiar Simulación
                                    </button>
                                )}
                            </div>

                            {realRecursos.length === 0 ? (
                                <div className="p-8 border border-dashed border-zinc-200 rounded-2xl text-center">
                                    <AlertCircle className="w-6 h-6 text-zinc-300 mx-auto mb-2" />
                                    <p className="text-[10px] text-zinc-400 uppercase font-black">No se encontraron recursos en este APU</p>
                                </div>
                            ) : (
                                realRecursos.map(rec => {
                                    const isEditableRendimiento = EDITABLE_TANTEO_SUBCATEGORY_CODES.has(Number(rec.subcategoria_codigo || 0));
                                    const currentVal = isEditableRendimiento ? (tanteoValues[rec.linea_id] ?? rec.rendimiento) : 1;
                                    const displayValue = Object.prototype.hasOwnProperty.call(tanteoDrafts, rec.linea_id)
                                        ? tanteoDrafts[rec.linea_id]
                                        : formatNumericDisplay(currentVal, precisionCalculo);
                                    const isEquip = Number(rec.subcategoria_codigo) === 1;
                                    const isLabor = Number(rec.subcategoria_codigo) === 4;
                                    const isMaterial = Number(rec.subcategoria_codigo) === 2;
                                    const isTransport = Number(rec.subcategoria_codigo) === 3;
                                    const resourceIcon = isEquip
                                        ? <Wrench className="w-3 h-3 text-blue-600" />
                                        : isLabor
                                            ? <Users className="w-3 h-3 text-[#F39200]" />
                                            : isTransport
                                                ? <Truck className="w-3 h-3 text-amber-600" />
                                                : <Package className="w-3 h-3 text-emerald-600" />;
                                    const resourceIconShell = isEquip
                                        ? 'bg-blue-100'
                                        : isLabor
                                            ? 'bg-orange-100'
                                            : isTransport
                                                ? 'bg-amber-100'
                                                : 'bg-emerald-100';
                                    const subtotalSimulado = resolveApuLineSimulatedSubtotal(rec, {
                                        moneyDecimals: precisionMoneda,
                                        rendimiento: currentVal,
                                    });
                                    const rendimientoStatus = currentVal > rec.rendimiento
                                        ? {
                                            label: 'Mayor rendimiento',
                                            lineClass: 'bg-red-400',
                                            textClass: 'text-red-500'
                                        }
                                        : currentVal < rec.rendimiento
                                            ? {
                                                label: 'Menor rendimiento',
                                                lineClass: 'bg-emerald-400',
                                                textClass: 'text-emerald-600'
                                            }
                                            : {
                                                label: 'Igual rendimiento',
                                                lineClass: 'bg-blue-400',
                                                textClass: 'text-blue-500'
                                            };

                                    return (
                                        <div key={rec.linea_id} className={`p-3.5 rounded-2xl border transition-all ${tanteoValues[rec.linea_id] !== undefined ? 'bg-amber-50/60 border-amber-200 shadow-sm' : 'border-[#e2ded6] bg-[#f8f8f6]'}`}>
                                            <div className="flex items-center mb-2.5">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <div className={`p-1.5 rounded-lg ${resourceIconShell}`}>
                                                        {resourceIcon}
                                                    </div>
                                                    <div className="flex flex-col min-w-0">
                                                        <span className="text-[9px] font-black text-zinc-900 truncate max-w-[200px] leading-none mb-0.5">{normalizeDescriptionCapitalization(rec.descripcion)}</span>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-[8px] font-bold text-zinc-400 font-mono italic">{rec.codigo}</span>
                                                            {rec.tanteo_activo && (
                                                                <button 
                                                                    onClick={() => handleRevertTanteo(rec.linea_id)}
                                                                    className="flex min-h-11 items-center gap-1 text-[7px] font-black uppercase text-red-500 hover:underline"
                                                                    title={`Original: ${formatNumericDisplay(rec.rendimiento_original ?? rec.rendimiento, precisionCalculo)}`}
                                                                >
                                                                    <RotateCcw className="w-2 h-2" /> Restaurar Original
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="mt-0.5 flex items-center gap-1.5 min-w-0 text-[9px] leading-none">
                                                            <span className="font-black uppercase text-zinc-400 shrink-0">Tarifa base</span>
                                                            <span className="font-black text-zinc-600 font-mono truncate">{formatMoneda(rec.precio_base)}</span>
                                                        </div>
                                                        {!isEditableRendimiento && (
                                                            <div className="mt-1 inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-1 text-[8px] font-black uppercase tracking-[0.12em] text-zinc-500">
                                                                Rendimiento fijo 1,0000
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="flex-1 relative">
                                                    <p className="mb-1 text-[8px] font-black text-zinc-400 uppercase tracking-widest">Rendimiento</p>
                                                    <input
                                                        type="text"
                                                        inputMode="decimal"
                                                        data-tanteo-linea-id={rec.linea_id}
                                                        value={displayValue}
                                                        disabled={!isEditableRendimiento}
                                                        onFocus={(e) => handleTanteoFocus(rec.linea_id, currentVal, e)}
                                                        onChange={(e) => handleTanteoChange(rec.linea_id, e.target.value)}
                                                        onBlur={() => handleTanteoBlur(rec.linea_id)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Escape') {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                handleTanteoCancel(rec.linea_id);
                                                                e.currentTarget.blur();
                                                                return;
                                                            }
                                                            const shouldAdvance =
                                                                e.key === 'Enter' ||
                                                                e.key === 'Return' ||
                                                                e.key === 'Tab';
                                                            if (!shouldAdvance) return;
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleTanteoCommitAndNext(rec.linea_id);
                                                        }}
                                                        className={`h-11 w-full rounded-lg px-3 text-xs font-mono font-black outline-none transition-all ${
                                                            isEditableRendimiento
                                                                ? 'bg-white border border-zinc-200 focus:border-[#F39200] focus:ring-1 focus:ring-orange-200'
                                                                : 'border border-zinc-200 bg-zinc-100 text-zinc-500 cursor-not-allowed'
                                                        }`}
                                                    />
                                                </div>
                                                <div className="text-right shrink-0 min-w-[82px] self-stretch flex flex-col justify-start">
                                                    <p className="text-[8px] font-black text-zinc-400 uppercase">Subtotal APU</p>
                                                    <p className={`text-xs font-black tabular-nums transition-colors ${tanteoValues[rec.linea_id] !== undefined ? 'text-blue-600' : 'text-zinc-900'}`}>
                                                        {formatMoneda(subtotalSimulado)}
                                                    </p>
                                                    <div
                                                        className="mt-2"
                                                        title="Roja = rendimiento mayor, Azul = rendimiento igual, Verde = rendimiento menor"
                                                    >
                                                        <div className={`h-1.5 w-full rounded-full ${rendimientoStatus.lineClass}`} />
                                                        <p className={`mt-1 text-[8px] font-black uppercase leading-none ${rendimientoStatus.textClass}`}>
                                                            {rendimientoStatus.label}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default TanteoTab;
