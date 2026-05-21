import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { LiquidButton } from '../ui/liquid-button';
import { APP_MODAL_CLOSE_BUTTON_CLASS } from '../ui/app-modal';

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
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    className="bg-white w-full max-w-md rounded-[2.5rem] overflow-hidden border border-zinc-200"
                >
                    <div className="p-10 relative">
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className={`${APP_MODAL_CLOSE_BUTTON_CLASS} absolute right-6 top-6`}
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 ${step === 1 ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                                {step === 1 ? <AlertTriangle className="w-10 h-10" /> : <Trash2 className="w-10 h-10" />}
                            </div>

                            {step === 1 ? (
                                <>
                                    <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-zinc-900">{title}</h2>
                                    <p className="text-zinc-500 text-sm font-medium mb-4">{summary}</p>
                                    <div className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 mb-8 text-left">
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
                                    <div className="flex flex-col w-full gap-3">
                                        <LiquidButton
                                            onClick={() => setStep(2)}
                                            className="w-full !h-14 bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl"
                                        >
                                            Entiendo, Continuar
                                        </LiquidButton>
                                        <button
                                            onClick={onClose}
                                            className="w-full h-14 bg-zinc-50 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-red-600">CONFIRMACIÓN FINAL</h2>
                                    <p className="text-zinc-500 text-sm font-medium mb-8">{finalWarning}</p>
                                    <div className="flex flex-col w-full gap-3">
                                        <LiquidButton
                                            onClick={onConfirm}
                                            disabled={loading}
                                            className="w-full !h-14 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
                                        >
                                            {loading ? "Procesando..." : "Confirmar Eliminación Permanente"}
                                        </LiquidButton>
                                        <button
                                            onClick={onClose}
                                            disabled={loading}
                                            className="w-full h-14 bg-zinc-50 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-all"
                                        >
                                            Dar Marcha Atrás
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
    </AnimatePresence>
);

export default BulkDeleteConfirmModal;
