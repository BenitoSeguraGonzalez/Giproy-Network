import React from 'react';
import { AnimatePresence } from 'framer-motion';
import { AlertTriangle, ArrowRight, RotateCcw, Trash2, X } from 'lucide-react';
import { LiquidButton } from '../ui/liquid-button';
import { AppModalShell, AppModalHeader, AppModalBody, AppModalFooter } from '../ui/app-modal';

const BulkDeleteConfirmModal = ({
    isOpen,
    onClose,
    onConfirm,
    step,
    setStep,
    loading = false,
    title,
    count = 0,
    summary,
    previewItems = [],
    finalWarning,
}) => (
    <AnimatePresence>
        {isOpen && (
            <AppModalShell isOpen={isOpen} onClose={loading ? undefined : onClose} size="md" zIndex="z-[1000]">
                <AppModalHeader
                    title={step === 1 ? title : 'Confirmación final'}
                    subtitle={step === 1 ? 'Revisión previa de la selección' : 'Acción irreversible pendiente'}
                    icon={step === 1 ? AlertTriangle : Trash2}
                    iconClassName={step === 1 ? 'text-[#F39200]' : 'text-red-600'}
                    iconWrapClassName={step === 1 ? 'border border-orange-100 bg-orange-50' : 'border border-red-100 bg-red-50'}
                    onClose={loading ? null : onClose}
                />
                <AppModalBody className="space-y-4 bg-[#f7f7f5]">
                    <div className="text-center">
                            {step === 1 ? (
                                <>
                                    <p className="text-sm font-bold leading-relaxed text-zinc-600">{summary}</p>
                                    <div className="mt-4 w-full bg-white border border-zinc-200 rounded-2xl p-4 text-left">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Selección actual</span>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-[#F39200]">{count} elementos</span>
                                        </div>
                                        <div className="space-y-1.5">
                                            {previewItems.slice(0, 5).map((item) => (
                                                <div key={item.id} className="flex items-center justify-between gap-3 text-[11px]">
                                                    <span className="font-black text-zinc-500 truncate">{item.codigo || '---'}</span>
                                                    <span className="font-bold text-zinc-700 truncate text-right">{item.descripcion}</span>
                                                </div>
                                            ))}
                                            {previewItems.length > 5 && (
                                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 pt-2">
                                                    Y {previewItems.length - 5} más
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <p className="rounded-2xl border border-red-100 bg-red-50 px-4 py-5 text-sm font-bold leading-relaxed text-red-700">{finalWarning}</p>
                                </>
                            )}
                    </div>
                </AppModalBody>
                <AppModalFooter variant="flat" className="flex-wrap bg-[#f7f7f5]">
                    {step === 1 ? (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                title="Cancelar"
                                aria-label="Cancelar"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700"
                            >
                                <X className="h-4 w-4" />
                            </button>
                            <LiquidButton
                                onClick={() => setStep(2)}
                                title="Continuar"
                                aria-label="Continuar"
                                className="h-11 w-11 !min-w-0 bg-[#1A1A1A] !px-0 text-white rounded-xl"
                            >
                                <ArrowRight className="h-4 w-4" />
                            </LiquidButton>
                        </>
                    ) : (
                        <>
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                title="Dar marcha atrás"
                                aria-label="Dar marcha atrás"
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700 disabled:opacity-50"
                            >
                                <RotateCcw className="h-4 w-4" />
                            </button>
                            <LiquidButton
                                onClick={onConfirm}
                                disabled={loading}
                                title={loading ? 'Procesando' : 'Confirmar eliminación'}
                                aria-label={loading ? 'Procesando' : 'Confirmar eliminación'}
                                className="h-11 w-11 !min-w-0 bg-red-600 !px-0 text-white rounded-xl"
                            >
                                {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Trash2 className="h-4 w-4" />}
                            </LiquidButton>
                        </>
                    )}
                </AppModalFooter>
            </AppModalShell>
        )}
    </AnimatePresence>
);

export default BulkDeleteConfirmModal;
