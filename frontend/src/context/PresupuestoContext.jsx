import React, { createContext, useContext, useMemo, useState, useCallback, useEffect, useRef, startTransition } from 'react';
import { presupuestosApi } from '../api/presupuestos';
import { AuthContext } from './AuthContext';
import {
    divideDecimalNumber,
    multiplyDecimalNumber,
    roundDecimalNumber,
    sumDecimalNumber,
    toDecimalNumber,
} from '../utils/decimalNumbers';

const PresupuestoContext = createContext();
const PresupuestoDataContext = createContext();
const PresupuestoSelectionContext = createContext();
const PresupuestoActionsContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export const usePresupuesto = () => {
    return useContext(PresupuestoContext);
};

// eslint-disable-next-line react-refresh/only-export-components
export const usePresupuestoData = () => useContext(PresupuestoDataContext);

// eslint-disable-next-line react-refresh/only-export-components
export const usePresupuestoSelection = () => useContext(PresupuestoSelectionContext);

// eslint-disable-next-line react-refresh/only-export-components
export const usePresupuestoActions = () => useContext(PresupuestoActionsContext);

export const PresupuestoProvider = ({ children }) => {
    const { selectedEmpresa, user } = useContext(AuthContext);
    const [activePresupuesto, setActivePresupuesto] = useState(null);
    const [activeProyecto, setActiveProyecto] = useState(null);
    const [selectedNodeId, setSelectedNodeId] = useState(null);
    const [selectedNodeMeta, setSelectedNodeMeta] = useState(null);
    const [selectedLineId, setSelectedLineId] = useState(null);
    const [tanteoSession, setTanteoSession] = useState({}); // { apuId: simulatedPrice }
    const [notesSummary, setNotesSummary] = useState({
        general_total: 0,
        general_nuevas: 0,
        lineas: {},
        last_opened_at: null
    });
    const activePresupuestoIdRef = useRef(null);
    const currentEmpresaId = useMemo(() => selectedEmpresa?.id || user?.empresa_id || null, [selectedEmpresa, user]);

    const applyBudgetTotalsFromSubtotal = useCallback((presupuesto, subtotalValue) => {
        if (!presupuesto) return presupuesto;
        const decMoneda = Number(presupuesto.dec_moneda ?? 2);
        const subtotal = roundDecimalNumber(subtotalValue || 0, decMoneda);
        const indirectosPorcentaje = Number(presupuesto.indirectos_porcentaje || 0);
        const indirectosTotal = roundDecimalNumber(
            multiplyDecimalNumber([subtotal, divideDecimalNumber(indirectosPorcentaje, 100, { decimals: 6 })], { decimals: 6 }),
            decMoneda
        );
        const baseImponible = sumDecimalNumber([subtotal, indirectosTotal], { decimals: 6 });
        const impuestos = Number(presupuesto.iva_aplicado || 0)
            ? roundDecimalNumber(
                multiplyDecimalNumber([baseImponible, divideDecimalNumber(presupuesto.iva_aplicado || 0, 100, { decimals: 6 })], { decimals: 6 }),
                decMoneda
            )
            : 0;
        const total = roundDecimalNumber(sumDecimalNumber([subtotal, indirectosTotal, impuestos], { decimals: 6 }), decMoneda);
        return {
            ...presupuesto,
            subtotal,
            indirectos_total: indirectosTotal,
            impuestos,
            total,
        };
    }, []);

    const getLineOperationalContribution = useCallback((linea) => {
        const isStructural = (linea?.tipo || '') === 'CUENTA_PAQUETE';
        const isDesynced = !isStructural && linea?.apu_id == null;
        if (isDesynced) return 0;
        return toDecimalNumber(linea?.precio_total || 0, '0');
    }, []);

    const recalculateBudgetSnapshot = useCallback((presupuesto) => {
        if (!presupuesto) return presupuesto;
        const decMoneda = Number(presupuesto.dec_moneda ?? 2);
        const detalle = Array.isArray(presupuesto.detalle) ? presupuesto.detalle : [];
        const subtotal = roundDecimalNumber(
            detalle.reduce((acc, linea) => {
                const isStructural = (linea?.tipo || '') === 'CUENTA_PAQUETE';
                const isDesynced = !isStructural && linea?.apu_id == null;
                if (isDesynced) return acc;
                return sumDecimalNumber([acc, linea?.precio_total || 0], { decimals: 6 });
            }, 0),
            decMoneda
        );
        return applyBudgetTotalsFromSubtotal(presupuesto, subtotal);
    }, [applyBudgetTotalsFromSubtotal]);

    const patchLineInActivePresupuesto = useCallback((updatedLine) => {
        if (!updatedLine?.id) return;
        startTransition(() => setActivePresupuesto((prev) => {
            if (!prev?.detalle?.length) return prev;
            const previousDetail = prev.detalle;
            const lineIndex = previousDetail.findIndex((linea) => Number(linea.id) === Number(updatedLine.id));
            if (lineIndex < 0) return prev;
            const previousLine = previousDetail[lineIndex];
            const detalle = [...previousDetail];
            detalle[lineIndex] = {
                ...previousLine,
                ...updatedLine,
            };
            const nextSubtotal = sumDecimalNumber([
                prev.subtotal || 0,
                -getLineOperationalContribution(previousLine),
                getLineOperationalContribution(detalle[lineIndex]),
            ], { decimals: 6 });
            return applyBudgetTotalsFromSubtotal({
                ...prev,
                detalle,
            }, nextSubtotal);
        }));
    }, [applyBudgetTotalsFromSubtotal, getLineOperationalContribution]);

    const upsertBudgetLineInActivePresupuesto = useCallback((linea, target = {}) => {
        if (!linea?.id) return;
        startTransition(() => setActivePresupuesto((prev) => {
            if (!prev) return prev;
            const previousDetail = Array.isArray(prev.detalle) ? prev.detalle : [];
            const existingIndex = previousDetail.findIndex((item) => Number(item.id) === Number(linea.id));

            let detalle;
            if (existingIndex >= 0) {
                detalle = [...previousDetail];
                detalle[existingIndex] = { ...previousDetail[existingIndex], ...linea };
            } else {
                detalle = [...previousDetail, linea];
                const targetEdtId = Number(target.edtId || linea.edt_id || 0) || null;
                const targetAfterLineId = Number(target.afterLineId || 0) || null;
                const edtOperationalLines = detalle
                    .filter((item) => Number(item.edt_id) === Number(targetEdtId) && item.apu_id && item.tipo !== 'CUENTA_PAQUETE')
                    .sort((a, b) => {
                        if (targetAfterLineId && Number(a.id) === Number(linea.id)) return 1;
                        if (targetAfterLineId && Number(b.id) === Number(linea.id)) return -1;
                        return Number(a.orden || 0) - Number(b.orden || 0) || Number(a.id || 0) - Number(b.id || 0);
                    });

                const insertedLine = edtOperationalLines.find((item) => Number(item.id) === Number(linea.id));
                if (insertedLine) {
                    const withoutInserted = edtOperationalLines.filter((item) => Number(item.id) !== Number(linea.id));
                    let insertIndex = withoutInserted.length;
                    if (targetAfterLineId) {
                        const afterIndex = withoutInserted.findIndex((item) => Number(item.id) === Number(targetAfterLineId));
                        if (afterIndex >= 0) {
                            insertIndex = afterIndex + 1;
                        }
                    }
                    withoutInserted.splice(insertIndex, 0, insertedLine);
                    const codesPrefix = previousDetail.find((item) => Number(item.edt_id) === Number(targetEdtId) && item.tipo === 'CUENTA_PAQUETE')?.codigo_item
                        || linea.codigo_item?.split('.').slice(0, -1).join('.')
                        || '';
                    const updatedById = new Map();
                    withoutInserted.forEach((item, index) => {
                        updatedById.set(Number(item.id), {
                            ...item,
                            orden: index,
                            codigo_item: codesPrefix ? `${codesPrefix}.${index + 1}` : item.codigo_item,
                        });
                    });
                    detalle = previousDetail.slice();
                    detalle.push(linea);
                    for (let idx = 0; idx < detalle.length; idx += 1) {
                        const patched = updatedById.get(Number(detalle[idx].id));
                        if (patched) {
                            detalle[idx] = patched;
                        }
                    }
                }
            }

            const previousLine = existingIndex >= 0 ? previousDetail[existingIndex] : null;
            const nextSubtotal = sumDecimalNumber([
                prev.subtotal || 0,
                -getLineOperationalContribution(previousLine),
                getLineOperationalContribution(linea),
            ], { decimals: 6 });
            return applyBudgetTotalsFromSubtotal({
                ...prev,
                detalle,
            }, nextSubtotal);
        }));
    }, [applyBudgetTotalsFromSubtotal, getLineOperationalContribution]);

    useEffect(() => {
        activePresupuestoIdRef.current = activePresupuesto?.id || null;
    }, [activePresupuesto?.id]);

    const updateTanteoSession = useCallback((apuId, simulatedPrice) => {
        setTanteoSession(prev => ({
            ...prev,
            [apuId]: simulatedPrice
        }));
    }, []);

    const clearTanteoSession = useCallback((apuId = null) => {
        if (apuId) {
            setTanteoSession(prev => {
                const newState = { ...prev };
                delete newState[apuId];
                return newState;
            });
        } else {
            setTanteoSession({});
        }
    }, []);

    // Default configs in case no budget is active
    const config = {
        iva_aplicado: activePresupuesto?.iva_aplicado ?? 15.00,
        indirectos_porcentaje: activePresupuesto?.indirectos_porcentaje ?? 0,
        indirectos_total: activePresupuesto?.indirectos_total ?? 0,
        dec_moneda: activePresupuesto?.dec_moneda ?? 2,
        dec_calculos: activePresupuesto?.dec_calculos ?? 4,
        moneda: activePresupuesto?.moneda ?? 'USD'
    };

    const refreshActivePresupuesto = useCallback(async (manualId = null, options = {}) => {
        const id = manualId || activePresupuestoIdRef.current;
        if (!id) return;
        try {
            const data = await presupuestosApi.getById(id, currentEmpresaId, options);
            startTransition(() => setActivePresupuesto(data));
            return data;
        } catch (error) {
            globalThis.reportClientError?.("Error al refrescar presupuesto:", error);
        }
    }, [currentEmpresaId]); // Quitamos activePresupuesto?.id para estabilidad

    const updateApuInBudget = useCallback(async (lineaId, updateData) => {
        try {
            const updatedLine = await presupuestosApi.updateLine(lineaId, updateData, currentEmpresaId);
            patchLineInActivePresupuesto(updatedLine);
            return updatedLine;
        } catch (error) {
            globalThis.reportClientError?.("Error al actualizar línea del presupuesto:", error);
            throw error;
        }
    }, [currentEmpresaId, patchLineInActivePresupuesto]);

    const addApuToBudget = useCallback(async (apu, target = null) => {
        if (!activePresupuesto) return;

        const resolvedTarget = typeof target === 'object' && target !== null
            ? target
            : { edtId: target };
        const selectedLine = resolvedTarget.afterLineId != null
            ? (activePresupuesto.detalle || []).find((linea) => Number(linea.id) === Number(resolvedTarget.afterLineId))
            : null;
        const resolvedEdtId = Number(
            resolvedTarget.edtId
            ?? selectedLine?.edt_id
            ?? selectedNodeId
            ?? null
        ) || null;
        const resolvedAfterLineId = selectedLine?.id ?? null;

        if (!resolvedEdtId) {
            throw new Error('No se pudo resolver el EDT destino para añadir el APU.');
        }
        
        // Verificar si ya existe el rubro en ESTE capítulo (EDT) solo para
        // informar la UX posterior. La persistencia/merge la resuelve el backend.
        const existingLine = (activePresupuesto.detalle || []).find(
            l => Number(l.edt_id) === Number(resolvedEdtId) && Number(l.apu_id) === Number(apu.id)
        );

        // Siempre delegamos al alta normal del backend, que ya fusiona cantidades
        // cuando detecta el mismo APU dentro del mismo EDT.
        try {
            const newLine = {
                edt_id: resolvedEdtId,
                after_linea_id: resolvedAfterLineId,
                apu_id: apu.id,
                codigo_item: apu.codigo,
                descripcion: apu.descripcion,
                unidad: typeof apu.unidad === 'object' ? apu.unidad?.descripcion : apu.unidad,
                cantidad: 1.0,
                // Enviamos el costo_directo puro — el backend aplicará el % de indirectos funcional del presupuesto
                precio_unitario: toDecimalNumber(apu.costo_directo || 0, '0'),
                notas: ''
            };

            const finalLine = await presupuestosApi.addLine(activePresupuesto.id, newLine, currentEmpresaId);
            upsertBudgetLineInActivePresupuesto(finalLine, {
                edtId: resolvedEdtId,
                afterLineId: resolvedAfterLineId,
            });
            return {
                ...finalLine,
                _budgetAction: existingLine ? 'incremented_existing' : 'created_new',
            };
        } catch (error) {
            globalThis.reportClientError?.("Detailed Error adding APU:", {
                error,
                response: error.response?.data,
                status: error.response?.status
            });
            throw error;
        }
    }, [activePresupuesto, currentEmpresaId, selectedNodeId, upsertBudgetLineInActivePresupuesto]);

    const deleteApuFromBudget = useCallback(async (lineaId) => {
        try {
            await presupuestosApi.deleteLine(lineaId, currentEmpresaId);
            await refreshActivePresupuesto(activePresupuestoIdRef.current, { refreshPrices: false });
        } catch (error) {
            globalThis.reportClientError?.("Error al eliminar línea del presupuesto:", error);
            throw error;
        }
    }, [currentEmpresaId, refreshActivePresupuesto]);

    const moveApuInBudget = useCallback(async (lineaId, moveData) => {
        try {
            const moveResult = await presupuestosApi.moveLine(lineaId, moveData, currentEmpresaId);
            
            // Recargar el presupuesto completo para asegurar que todos los códigos y el orden sean correctos
            // Importante: Al mover, puede haber fusiones (merge) o re-numeración masiva.
            await refreshActivePresupuesto(activePresupuestoIdRef.current, { refreshPrices: false });
            return moveResult;
        } catch (error) {
            globalThis.reportClientError?.("Error al mover línea del presupuesto:", error);
            throw error;
        }
    }, [currentEmpresaId, refreshActivePresupuesto]);

    const refreshNotesSummary = useCallback(async (presupuestoId = null) => {
        const targetId = presupuestoId || activePresupuesto?.id;
        if (!targetId) return null;
        try {
            const summary = await presupuestosApi.getNotesSummary(targetId, currentEmpresaId);
            setNotesSummary(summary);
            return summary;
        } catch (error) {
            globalThis.reportClientError?.("Error al refrescar resumen de notas:", error);
            return null;
        }
    }, [currentEmpresaId]); // Quitamos activePresupuesto?.id

    const markBudgetOpened = useCallback(async (presupuestoId = null) => {
        const targetId = presupuestoId || activePresupuesto?.id;
        if (!targetId) return;
        try {
            await presupuestosApi.markOpened(targetId, currentEmpresaId);
        } catch (error) {
            globalThis.reportClientError?.("Error registrando apertura del presupuesto:", error);
        }
    }, [currentEmpresaId]); // Quitamos activePresupuesto?.id

    const dataValue = useMemo(() => ({
        activePresupuesto,
        setActivePresupuesto,
        activeProyecto,
        setActiveProyecto,
        tanteoSession,
        notesSummary,
        setNotesSummary,
        config
    }), [
        activePresupuesto,
        activeProyecto,
        tanteoSession,
        notesSummary,
        config
    ]);

    const selectionValue = useMemo(() => ({
        selectedNodeId,
        setSelectedNodeId,
        selectedNodeMeta,
        setSelectedNodeMeta,
        selectedLineId,
        setSelectedLineId
    }), [
        selectedNodeId,
        selectedNodeMeta,
        selectedLineId
    ]);

    const actionsValue = useMemo(() => ({
        updateTanteoSession,
        clearTanteoSession,
        addApuToBudget,
        deleteApuFromBudget,
        updateApuInBudget,
        moveApuInBudget,
        refreshActivePresupuesto,
        refreshNotesSummary,
        markBudgetOpened
    }), [
        updateTanteoSession,
        clearTanteoSession,
        addApuToBudget,
        deleteApuFromBudget,
        updateApuInBudget,
        moveApuInBudget,
        refreshActivePresupuesto,
        refreshNotesSummary,
        markBudgetOpened
    ]);

    const value = useMemo(() => ({
        ...dataValue,
        ...selectionValue,
        ...actionsValue
    }), [
        dataValue,
        selectionValue,
        actionsValue
    ]);

    return (
        <PresupuestoDataContext.Provider value={dataValue}>
            <PresupuestoSelectionContext.Provider value={selectionValue}>
                <PresupuestoActionsContext.Provider value={actionsValue}>
                    <PresupuestoContext.Provider value={value}>
                        {children}
                    </PresupuestoContext.Provider>
                </PresupuestoActionsContext.Provider>
            </PresupuestoSelectionContext.Provider>
        </PresupuestoDataContext.Provider>
    );
};
