import { createContext, useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, Info, MessageSquareQuote, PencilLine, X } from 'lucide-react';
import { appAlert, appConfirm, appPrompt, registerAppDialogHandler, unregisterAppDialogHandler } from '../../utils/appDialog';

const MotionDiv = motion.div;

const AppDialogContext = createContext({
    alert: appAlert,
    confirm: appConfirm,
    prompt: appPrompt,
});

const DEFAULTS = {
    alert: {
        title: 'Aviso del sistema',
        confirmLabel: 'Aceptar',
        tone: 'info',
        size: 'compact',
    },
    confirm: {
        title: 'Confirmación',
        confirmLabel: 'Confirmar',
        cancelLabel: 'Cancelar',
        tone: 'warning',
        size: 'compact',
    },
    prompt: {
        title: 'Entrada requerida',
        confirmLabel: 'Aceptar',
        cancelLabel: 'Cancelar',
        placeholder: '',
        defaultValue: '',
        tone: 'info',
        size: 'compact',
    },
};

const TONE_STYLES = {
    info: {
        icon: Info,
        iconClass: 'text-[#136191]',
        accent: '#136191',
    },
    success: {
        icon: CheckCircle2,
        iconClass: 'text-emerald-600',
        accent: '#059669',
    },
    warning: {
        icon: AlertTriangle,
        iconClass: 'text-[#F39200]',
        accent: '#F39200',
    },
    danger: {
        icon: AlertTriangle,
        iconClass: 'text-red-600',
        accent: '#dc2626',
    },
    input: {
        icon: PencilLine,
        iconClass: 'text-[#136191]',
        accent: '#136191',
    },
};

const DIALOG_SURFACE = '#e7ebf1';
const DIALOG_TEXT = '#4b5563';
const DIALOG_TEXT_STRONG = '#23262d';
const DIALOG_SHADOW_RAISED = '-4px -4px 10px rgba(255,255,255,0.85), 5px 5px 12px rgba(148,163,184,0.24)';
const DIALOG_SHADOW_INSET = 'inset 2px 2px 4px rgba(186,190,204,0.9), inset -3px -3px 7px rgba(255,255,255,0.78)';
const DIALOG_PANEL_SHADOW = '-10px -10px 24px rgba(255,255,255,0.76), 14px 14px 28px rgba(148,163,184,0.24)';

const resolveDialogConfig = (dialog) => {
    const defaults = DEFAULTS[dialog.type] || DEFAULTS.alert;
    const toneKey = dialog.tone || defaults.tone;
    const normalizedMessage = typeof dialog.message === 'string'
        ? dialog.message.trim()
        : dialog.message;
    return {
        ...defaults,
        ...dialog,
        tone: toneKey,
        message: normalizedMessage || 'Se produjo un evento del sistema sin detalle adicional disponible.',
    };
};

export const AppDialogProvider = ({ children }) => {
    const queueRef = useRef([]);
    const resolverRef = useRef(null);
    const [activeDialog, setActiveDialog] = useState(null);
    const [promptValue, setPromptValue] = useState('');
    const [promptError, setPromptError] = useState('');

    const openDialog = useCallback((dialog) => new Promise((resolve) => {
        const nextDialog = { ...dialog, key: `${dialog.type}-${Date.now()}-${Math.random()}` };
        queueRef.current.push({ dialog: nextDialog, resolve });
        if (!activeDialog) {
            const next = queueRef.current.shift();
            resolverRef.current = next.resolve;
            setActiveDialog(next.dialog);
        }
    }), [activeDialog]);

    const closeDialog = (result) => {
        resolverRef.current?.(result);
        resolverRef.current = null;
        setActiveDialog(null);
        setPromptValue('');
        setPromptError('');
    };

    useEffect(() => {
        if (!activeDialog && queueRef.current.length > 0) {
            const next = queueRef.current.shift();
            resolverRef.current = next.resolve;
            setActiveDialog(next.dialog);
        }
    }, [activeDialog]);

    useEffect(() => {
        registerAppDialogHandler({
            alert: (options) => openDialog({ ...options, type: 'alert' }),
            confirm: (options) => openDialog({ ...options, type: 'confirm' }),
            prompt: (options) => openDialog({ ...options, type: 'prompt' }),
        });

        const nativeAlert = window.alert;
        window.alert = (message) => {
            void openDialog({ type: 'alert', message: String(message ?? '') });
        };

        return () => {
            unregisterAppDialogHandler();
            window.alert = nativeAlert;
        };
    }, [openDialog]);

    useEffect(() => {
        if (activeDialog?.type === 'prompt') {
            setTimeout(() => {
                setPromptValue(activeDialog.defaultValue || '');
                setPromptError('');
            }, 0);
        }
    }, [activeDialog]);

    const contextValue = useMemo(() => ({
        alert: appAlert,
        confirm: appConfirm,
        prompt: appPrompt,
    }), []);

    const dialog = activeDialog ? resolveDialogConfig(activeDialog) : null;
    const tone = dialog ? (TONE_STYLES[dialog.tone] || TONE_STYLES.info) : TONE_STYLES.info;
    const overlayZIndex = dialog?.zIndex || 'z-[1800]';
    const Icon = dialog?.type === 'prompt' ? MessageSquareQuote : tone.icon;
    const isCompactDialog = dialog?.size === 'compact';
    const isWideDialog = dialog?.size === 'wide';

    const panelWidthClass = isWideDialog
        ? 'max-w-[520px]'
        : isCompactDialog
            ? 'max-w-[380px]'
            : 'max-w-[420px]';
    const panelRadiusClass = isCompactDialog ? 'rounded-[1.35rem]' : 'rounded-[1.55rem]';
    const panelPaddingHeaderClass = isCompactDialog ? 'px-3.5 py-3' : 'px-4 py-3.5';
    const panelPaddingBodyClass = isCompactDialog ? 'px-3.5 py-3 space-y-2' : 'px-4 py-3.5 space-y-2.5';
    const panelPaddingFooterClass = isCompactDialog ? 'px-3.5 py-2.5' : 'px-4 py-3';
    const titleClass = isCompactDialog ? 'text-[9.5px] tracking-[0.14em]' : 'text-[10px] tracking-[0.15em]';
    const subtitleClass = isCompactDialog ? 'text-[9.5px]' : 'text-[10px]';
    const messageClass = isCompactDialog ? 'text-[11.5px] leading-[1.45]' : 'text-[12px] leading-[1.5]';
    const raisedButtonStyle = {
        background: DIALOG_SURFACE,
        boxShadow: DIALOG_SHADOW_RAISED,
    };
    const insetFieldStyle = {
        background: DIALOG_SURFACE,
        boxShadow: DIALOG_SHADOW_INSET,
    };
    const primaryButtonStyle = {
        background: DIALOG_SURFACE,
        color: tone.accent,
        boxShadow: DIALOG_SHADOW_RAISED,
    };

    const handleConfirm = () => {
        if (!dialog) return;
        if (dialog.type === 'prompt') {
            const value = promptValue.trim();
            if (!value) {
                setPromptError(dialog.requiredMessage || 'Este campo es obligatorio.');
                return;
            }
            closeDialog(value);
            return;
        }
        closeDialog(dialog.type === 'confirm' ? true : true);
    };

    const handleCancel = () => {
        if (!dialog) return;
        if (dialog.type === 'alert') {
            closeDialog(true);
            return;
        }
        closeDialog(dialog.type === 'prompt' ? null : false);
    };

    const handleSecondary = () => {
        if (!dialog) return;
        closeDialog(dialog.secondaryResult ?? 'secondary');
    };

    return (
        <AppDialogContext.Provider value={contextValue}>
            {children}
            <AnimatePresence>
                {dialog ? (
                    <MotionDiv
                        className={`fixed inset-0 ${overlayZIndex} flex items-center justify-center bg-[rgba(15,23,42,0.14)] backdrop-blur-[1.5px] p-3`}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <MotionDiv
                            initial={{ opacity: 0, scale: 0.96, y: 16 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.98, y: 10 }}
                            transition={{ duration: 0.18 }}
                            className={`w-full ${panelRadiusClass} overflow-hidden ${panelWidthClass}`}
                            style={{
                                background: DIALOG_SURFACE,
                                border: '1px solid rgba(0, 0, 0, 0.08)',
                                boxShadow: DIALOG_PANEL_SHADOW,
                            }}
                        >
                            <div className={`flex items-start justify-between gap-2.5 ${panelPaddingHeaderClass}`}>
                                <div className="flex items-start gap-2.5 min-w-0">
                                    <div
                                        className={`${isCompactDialog ? 'w-8 h-8 rounded-[0.8rem]' : 'w-9 h-9 rounded-[0.9rem]'} flex items-center justify-center shrink-0`}
                                        style={raisedButtonStyle}
                                    >
                                        <Icon className={`${isCompactDialog ? 'w-4 h-4' : 'w-4.5 h-4.5'} ${tone.iconClass}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <div className={`${titleClass} font-black uppercase`} style={{ color: DIALOG_TEXT_STRONG }}>
                                            {dialog.title}
                                        </div>
                                        {dialog.subtitle ? (
                                            <div className={`mt-0.5 font-medium leading-snug ${subtitleClass}`} style={{ color: DIALOG_TEXT }}>
                                                {dialog.subtitle}
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className={`${isCompactDialog ? 'w-7.5 h-7.5 rounded-[0.8rem]' : 'w-8 h-8 rounded-[0.85rem]'} flex items-center justify-center text-zinc-400 hover:text-zinc-700 transition-all`}
                                    style={raisedButtonStyle}
                                >
                                    <X className={`${isCompactDialog ? 'w-3.25 h-3.25' : 'w-3.5 h-3.5'}`} />
                                </button>
                            </div>

                            <div className={`${panelPaddingBodyClass} max-h-[46vh] overflow-y-auto`}>
                                <div className={`${messageClass} whitespace-pre-line`} style={{ color: DIALOG_TEXT }}>
                                    {dialog.message}
                                </div>

                                {dialog.type === 'prompt' ? (
                                    <div className="space-y-2">
                                        {dialog.label ? (
                                            <div className="text-[9px] font-black uppercase tracking-[0.14em]" style={{ color: DIALOG_TEXT }}>
                                                {dialog.label}
                                            </div>
                                        ) : null}
                                        <input
                                            autoFocus
                                            value={promptValue}
                                            onChange={(event) => {
                                                setPromptValue(event.target.value);
                                                if (promptError) setPromptError('');
                                            }}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter') handleConfirm();
                                                if (event.key === 'Escape') handleCancel();
                                            }}
                                            placeholder={dialog.placeholder}
                                            className="w-full h-10 rounded-[0.95rem] border-none px-3.5 text-[12.5px] font-semibold outline-none"
                                            style={{
                                                ...insetFieldStyle,
                                                color: DIALOG_TEXT_STRONG,
                                            }}
                                        />
                                        {promptError ? (
                                            <div className="text-[11px] font-bold text-red-600">{promptError}</div>
                                        ) : null}
                                    </div>
                                ) : null}
                            </div>

                            <div className={`flex items-center justify-end gap-2 ${panelPaddingFooterClass}`}>
                                {dialog.type === 'confirm' && dialog.secondaryLabel ? (
                                    <button
                                        type="button"
                                        onClick={handleSecondary}
                                        className="h-8 px-3 rounded-[0.85rem] text-[8.5px] font-black uppercase tracking-[0.13em] transition-all"
                                        style={{
                                            ...raisedButtonStyle,
                                            color: DIALOG_TEXT,
                                        }}
                                    >
                                        {dialog.secondaryLabel}
                                    </button>
                                ) : null}
                                {dialog.type !== 'alert' ? (
                                    <button
                                        type="button"
                                        onClick={handleCancel}
                                        className="h-8 px-3 rounded-[0.85rem] text-[8.5px] font-black uppercase tracking-[0.13em] transition-all"
                                        style={{
                                            ...raisedButtonStyle,
                                            color: DIALOG_TEXT,
                                        }}
                                    >
                                        {dialog.cancelLabel}
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={handleConfirm}
                                    className="h-8 px-3 rounded-[0.85rem] text-[8.5px] font-black uppercase tracking-[0.13em] transition-all"
                                    style={primaryButtonStyle}
                                >
                                    {dialog.confirmLabel}
                                </button>
                            </div>
                        </MotionDiv>
                    </MotionDiv>
                ) : null}
            </AnimatePresence>
        </AppDialogContext.Provider>
    );
};

export { AppDialogContext };
