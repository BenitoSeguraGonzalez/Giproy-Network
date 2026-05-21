import { X } from 'lucide-react';
import { motion } from 'framer-motion';

const MotionDiv = motion.div;
const MODAL_SURFACE = '#e7ebf1';
const MODAL_SURFACE_ALT = '#edf1f6';
const MODAL_TEXT = '#4b5563';
const MODAL_TEXT_STRONG = '#23262d';
const MODAL_BORDER = '1px solid rgba(0, 0, 0, 0.07)';
const MODAL_SHADOW_PANEL = '-12px -12px 28px rgba(255,255,255,0.82), 16px 16px 34px rgba(148,163,184,0.24)';
const MODAL_SHADOW_RAISED = '-4px -4px 10px rgba(255,255,255,0.85), 5px 5px 12px rgba(148,163,184,0.22)';
const MODAL_SHADOW_INSET = 'inset 2px 2px 4px rgba(186,190,204,0.88), inset -3px -3px 7px rgba(255,255,255,0.78)';

export const APP_MODAL_CLOSE_BUTTON_CLASS = [
    'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem]',
    'border border-[#ececec] bg-[#ededed] text-zinc-600',
    'shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff]',
    'transition-[color,border-color,filter,transform,box-shadow] duration-200',
    'hover:brightness-[0.99] hover:text-[#136191]',
    'active:scale-[0.98] active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff]',
    'disabled:pointer-events-none disabled:opacity-50',
].join(' ');

const SIZE_MAP = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-5xl',
    '3xl': 'max-w-6xl',
};

export const AppModalShell = ({
    children,
    isOpen = true,
    onClose,
    size = 'lg',
    zIndex = 'z-[120]',
    overlayClassName = '',
    panelClassName = '',
    surfaceColor = MODAL_SURFACE,
}) => {
    if (!isOpen) return null;

    return (
        <div
            className={`fixed inset-0 ${zIndex} flex items-center justify-center bg-[rgba(15,23,42,0.18)] backdrop-blur-[2px] p-3 md:p-4 ${overlayClassName}`}
            onClick={(e) => {
                if (e.target === e.currentTarget && onClose) onClose();
            }}
        >
            <MotionDiv
                initial={{ opacity: 0, scale: 0.96, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98, y: 10 }}
                transition={{ duration: 0.18 }}
                className={`w-full ${SIZE_MAP[size] || SIZE_MAP.lg} rounded-[1.7rem] overflow-hidden ${panelClassName}`}
                style={{
                    background: surfaceColor,
                    border: MODAL_BORDER,
                    boxShadow: MODAL_SHADOW_PANEL,
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </MotionDiv>
        </div>
    );
};

export const AppModalHeader = ({
    title,
    subtitle = '',
    icon: Icon = null,
    onClose = null,
    iconClassName = 'text-[#136191]',
    iconWrapClassName = '',
    actions = null,
    closeButton = null,
    closeButtonClassName = '',
    closeIconClassName = 'w-3.5 h-3.5',
    surfaceColor = MODAL_SURFACE,
    titleClassName = '',
    subtitleClassName = '',
}) => (
    <div
        className="flex items-start justify-between gap-3 px-4 py-3.5 md:px-5 md:py-4"
        style={{ background: surfaceColor }}
    >
        <div className="flex items-start gap-3 min-w-0">
            {Icon ? (
                <div
                    className={`w-9 h-9 rounded-[0.95rem] flex items-center justify-center shrink-0 ${iconWrapClassName}`}
                    style={{
                        background: MODAL_SURFACE_ALT,
                        boxShadow: MODAL_SHADOW_RAISED,
                    }}
                >
                    <Icon className={`w-5 h-5 ${iconClassName}`} />
                </div>
            ) : null}
            <div className="min-w-0">
                <div
                    className={`text-[10px] font-black uppercase tracking-[0.16em] ${titleClassName}`.trim()}
                    style={titleClassName ? undefined : { color: MODAL_TEXT_STRONG }}
                >
                    {title}
                </div>
                {subtitle ? (
                    <div
                        className={`mt-0.5 text-[11px] font-medium leading-snug ${subtitleClassName}`.trim()}
                        style={subtitleClassName ? undefined : { color: MODAL_TEXT }}
                    >
                        {subtitle}
                    </div>
                ) : null}
            </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
            {actions}
            {closeButton || (onClose ? (
                <button
                    type="button"
                    onClick={onClose}
                    className={closeButtonClassName || APP_MODAL_CLOSE_BUTTON_CLASS}
                    style={closeButtonClassName ? undefined : {
                        background: '#ededed',
                    }}
                >
                    <X className={closeIconClassName} />
                </button>
            ) : null)}
        </div>
    </div>
);

export const AppModalBody = ({ children, className = '' }) => (
    <div
        className={`px-4 py-3.5 md:px-5 md:py-4 ${className}`}
        style={{ color: MODAL_TEXT }}
    >
        {children}
    </div>
);

export const AppModalFooter = ({ children, className = '', variant = 'inset', surfaceColor = MODAL_SURFACE }) => (
    <div
        className={`flex items-center justify-end gap-2.5 px-4 py-3 md:px-5 md:py-3.5 ${className}`}
        style={{
            background: surfaceColor,
            boxShadow: variant === 'flat' ? 'none' : MODAL_SHADOW_INSET,
            borderTop: variant === 'flat' ? '1px solid rgba(15, 23, 42, 0.07)' : 'none',
        }}
    >
        {children}
    </div>
);
