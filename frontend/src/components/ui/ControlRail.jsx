import React from 'react';
import AppHint from './AppHint';

const joinClasses = (...values) => values.filter(Boolean).join(' ');
const CONTROL_RAIL_TOOLTIP_SKIN = 'rounded-[0.7rem] border border-white/20 bg-[#0b0d11]';

export const ControlRail = ({ children, className = '' }) => (
    <div
        className={joinClasses(
            'flex items-center gap-2 rounded-[1rem] border border-white/12 bg-[#0f1115] px-3 py-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ring-1 ring-black/18',
            className,
        )}
    >
        {children}
    </div>
);

export const ControlRailSection = React.forwardRef(({ children, className = '' }, ref) => (
    <div
        ref={ref}
        className={joinClasses(
            'flex items-center gap-2 rounded-[0.9rem] bg-white/[0.04] px-1.5 py-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]',
            className,
        )}
    >
        {children}
    </div>
));

ControlRailSection.displayName = 'ControlRailSection';

export const ControlRailDivider = ({ className = '' }) => (
    <div className={joinClasses('h-6 w-px shrink-0 bg-white/12', className)} />
);

export const ControlRailTooltip = ({ content, children, className = '' }) => (
    <AppHint content={content} tone="dark" className={className} contentClassName={CONTROL_RAIL_TOOLTIP_SKIN} maxWidth={224} widthOffset={0}>
        {children}
    </AppHint>
);

export const ControlRailIconButton = React.forwardRef(({
    children,
    className = '',
    active = false,
    disabled = false,
    tooltip = '',
    ...props
}, ref) => (
    <ControlRailTooltip content={tooltip}>
        <button
            ref={ref}
            type="button"
            disabled={disabled}
            aria-pressed={active ? 'true' : undefined}
            className={joinClasses(
                'relative inline-flex h-9 w-9 items-center justify-center rounded-[0.8rem] border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200]/40 active:translate-y-[1px] active:scale-[0.96]',
                active
                    ? 'border-[#F39200]/70 bg-[#211b14] text-[#ffbd73] shadow-[inset_3px_3px_8px_rgba(0,0,0,0.46),inset_-3px_-3px_8px_rgba(255,255,255,0.055),0_0_0_1px_rgba(243,146,0,0.22)]'
                    : 'border-white/8 bg-[#15181d] text-white/82 shadow-[3px_3px_8px_rgba(0,0,0,0.32),-2px_-2px_6px_rgba(255,255,255,0.045)] hover:border-white/14 hover:bg-[#1b1f25] hover:text-white hover:shadow-[2px_2px_7px_rgba(0,0,0,0.36),-2px_-2px_7px_rgba(255,255,255,0.06)] active:shadow-[inset_4px_4px_9px_rgba(0,0,0,0.52),inset_-3px_-3px_7px_rgba(255,255,255,0.06)]',
                disabled ? 'cursor-not-allowed opacity-35 hover:border-white/8 hover:bg-[#15181d] hover:text-white/82 hover:shadow-[3px_3px_8px_rgba(0,0,0,0.32),-2px_-2px_6px_rgba(255,255,255,0.045)]' : '',
                className,
            )}
            {...props}
        >
            {active && (
                <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-[#F39200] shadow-[0_0_0_2px_rgba(243,146,0,0.14),0_0_8px_rgba(243,146,0,0.75)]" />
            )}
            {children}
        </button>
    </ControlRailTooltip>
));

ControlRailIconButton.displayName = 'ControlRailIconButton';
