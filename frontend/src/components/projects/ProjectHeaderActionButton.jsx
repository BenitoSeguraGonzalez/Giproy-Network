import React from 'react';

const TONE_STYLES = {
    neutral: {
        icon: 'text-zinc-600',
        label: 'text-zinc-700',
    },
    primary: {
        icon: 'text-[#136191]',
        label: 'text-[#136191]',
    },
    danger: {
        icon: 'text-red-600',
        label: 'text-red-600',
    },
    warning: {
        icon: 'text-[#F39200]',
        label: 'text-[#F39200]',
    },
    dark: {
        icon: 'text-zinc-800',
        label: 'text-zinc-800',
    },
};

const SIZE_STYLES = {
    sm: 'min-w-[100px]',
    md: 'min-w-[116px]',
    lg: 'min-w-[132px]',
    xl: 'min-w-[156px]',
};

const ProjectHeaderActionButton = ({
    icon: Icon,
    label,
    onClick,
    disabled = false,
    tone = 'neutral',
    className = '',
    title,
    stacked = true,
    size = 'md',
    children,
}) => {
    const toneClasses = TONE_STYLES[tone] || TONE_STYLES.neutral;
    const sizeClassName = SIZE_STYLES[size] || SIZE_STYLES.md;

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            title={title || label}
            className={[
                'group inline-flex border border-[#ececec] bg-[#f3f3f1] transition-[color,box-shadow,filter] duration-200',
                'shadow-[4px_4px_10px_#d6d6d1,-4px_-4px_10px_#ffffff] hover:brightness-[0.99]',
                'active:text-[#666666] active:shadow-[inset_2px_2px_8px_#d0d0d0,inset_-2px_-2px_8px_#ffffff]',
                'disabled:pointer-events-none disabled:opacity-50',
                stacked
                    ? `min-h-[56px] ${sizeClassName} flex-col items-center justify-center gap-1.5 self-end rounded-[1rem] px-3.5 py-2.5`
                    : `min-h-11 ${sizeClassName} items-center justify-center gap-1.5 rounded-full px-4 py-2`,
                className,
            ].join(' ')}
        >
            {Icon ? (
                <Icon className={`${stacked ? 'h-[15px] w-[15px]' : 'h-[14px] w-[14px]'} ${toneClasses.icon} shrink-0`} />
            ) : null}
            {children || (
                <span className={`${stacked ? 'text-[9px] tracking-[0.16em] text-center leading-tight' : 'text-[9px] tracking-[0.14em]'} font-black uppercase ${toneClasses.label}`}>
                    {label}
                </span>
            )}
        </button>
    );
};

export default ProjectHeaderActionButton;
