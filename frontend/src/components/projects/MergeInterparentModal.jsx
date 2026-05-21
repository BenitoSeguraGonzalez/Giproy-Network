import React, { useCallback, useMemo, useState } from "react";
import { AlertCircle, Check, ChevronDown, ChevronUp, X } from 'lucide-react';
import { appConfirm, appAlert } from '../../utils/appDialog';
import { formatNumber, formatCurrency } from '../../utils/numbers';

const MergeInterparentModal = ({
    open,
    sourceSubbars,
    targetSubbar,
    currency = 'USD',
    decMoneda = 2,
    onCancel,
    onConfirmMerge,
}) => {
    const [reajustePct, setReajustePct] = useState(100);
// UNUSED: collapsedGroups, setCollapsedGroups

    const sourceGroups = useMemo(() => {
        const groups = {};
        (sourceSubbars || []).forEach(subbar => {
            const parentId = subbar.parent_initial_id || subbar.parentInitialId || 'unknown';
            groups[parentId] = groups[parentId] || [];
            groups[parentId].push(subbar);
        });
        return groups;
    }, [sourceSubbars]);

    const totalSourceAmount = useMemo(() => 
        sourceSubbars.reduce((sum, subbar) => sum + Number(subbar.amount || 0), 0),
    [sourceSubbars]);

    const transferAmount = useMemo(() => 
        Math.round(totalSourceAmount * (reajustePct / 100) * 100) / 100,
    [totalSourceAmount, reajustePct]);

    const handleConfirm = useCallback(async () => {
        if (reajustePct <= 0 || reajustePct > 100) {
            await appAlert({
                title: 'Porcentaje inválido',
                message: 'El reajuste debe estar entre 1% y 100%.',
                tone: 'warning',
            });
            return;
        }

        const confirmed = await appConfirm({
            title: 'Confirmar fusión intertramo',
            message: `¿Transferir ${formatNumber(reajustePct, 1)}% del tramo origen (${formatCurrency(transferAmount, currency, decMoneda)}) al tramo destino ${targetSubbar.parent_initial_id}?`,
            subtitle: `Impacto Valorado: origen → destino`,
            confirmLabel: 'Fusión intertramo',
            tone: 'warning',
        });

        if (confirmed) {
            await onConfirmMerge({
                reajuste_pct: reajustePct / 100,
                transfer_amount: transferAmount,
            });
        }
    }, [reajustePct, totalSourceAmount, transferAmount, targetSubbar, currency, decMoneda, onConfirmMerge]);

    if (!open || !sourceSubbars?.length || !targetSubbar) return null;

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="max-h-[85vh] w-full max-w-2xl max-w-md flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-zinc-200">
                    <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-lg">
                            <ChevronDown className="h-6 w-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                                Fusión Intertramo
                            </h3>
                            <p className="text-sm font-semibold text-zinc-600 mt-1">
                                Reagrupar tramos origen → destino con confirmación %
                            </p>
                        </div>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
                                    Tramo Destino
                                </label>
                                <div className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                                    <span className="font-mono font-black text-orange-700 text-sm">
                                        {targetSubbar.parent_initial_id}
                                    </span>
                                    <span className="text-xs font-medium text-orange-700">
                                        {formatCurrency(Number(targetSubbar.amount || 0), currency, decMoneda)}
                                    </span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-2">
                                    Origenes ({sourceSubbars.length})
                                </label>
                                <div className="space-y-1 max-h-20 overflow-y-auto">
                                    {Object.entries(sourceGroups).map(([parentId, group]) => (
                                        <div key={parentId} className="inline-flex items-center gap-2 px-3 py-1.5 bg-zinc-50 rounded-lg">
                                            <span className="font-mono font-black text-zinc-700 text-xs">
                                                {parentId}
                                            </span>
                                            <span className="text-xs font-medium text-zinc-500">
                                                {formatCurrency(group.reduce((sum, s) => sum + Number(s.amount || 0), 0), currency, decMoneda)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-3">
                                % Reajuste Origen → Destino
                            </label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    step="0.1"
                                    value={reajustePct}
                                    onChange={(e) => setReajustePct(Number(e.target.value) || 100)}
                                    className="w-full h-14 rounded-2xl border-2 border-zinc-200 px-6 text-2xl font-black text-zinc-900 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/20 transition-all"
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-2xl font-black text-zinc-400">
                                    %
                                </div>
                            </div>
                            <div className="mt-2 text-right">
                                <span className="text-sm font-black text-orange-600">
                                    {formatCurrency(transferAmount, currency, decMoneda)} → Tramo destino
                                </span>
                            </div>
                        </div>

                        <div className="p-4 rounded-xl bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                                <span className="font-black text-orange-800 text-sm uppercase tracking-wide">
                                    Impacto en Cronograma Valorado
                                </span>
                            </div>
                            <p className="text-xs leading-relaxed text-orange-800">
                                Esta fusión intertramo generará override en Valorado. Los tramos origen perderán su % original
                                que se sumará al destino. Podrás revertir con "Limpiar overrides" si necesitas.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3 p-6 bg-zinc-50 border-t border-zinc-200">
                    <button
                        onClick={onCancel}
                        className="flex-1 h-12 rounded-xl border border-zinc-300 bg-white px-6 font-black uppercase tracking-wide text-zinc-600 text-sm transition hover:border-zinc-400 hover:bg-zinc-50"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={reajustePct <= 0 || reajustePct > 100}
                        className="flex-1 h-12 rounded-xl bg-gradient-to-r from-orange-500 to-amber-600 px-6 font-black uppercase tracking-wide text-white text-sm shadow-lg hover:from-orange-600 hover:to-amber-700 focus:outline-none focus:ring-4 focus:ring-orange-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Check className="inline h-4 w-4 mr-2" />
                        Confirmar Fusión
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MergeInterparentModal;

