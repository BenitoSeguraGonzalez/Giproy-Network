import React from 'react';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'h-2.5 w-2.5',
  md: 'h-3 w-3',
  lg: 'h-3.5 w-3.5',
};

const hitAreaClasses = {
  sm: 'h-5 w-5',
  md: 'h-6 w-6',
  lg: 'h-7 w-7',
};

const toneClasses = {
  blue: {
    checked: 'border-[#136191] bg-[#136191] shadow-[0_0_0_3px_rgba(19,97,145,0.12),0_0_12px_rgba(19,97,145,0.42),inset_1px_1px_1px_rgba(255,255,255,0.42)]',
    idle: 'border-slate-300/70 bg-slate-200/60 shadow-[inset_1px_1px_2px_rgba(15,23,42,0.12),0_1px_2px_rgba(255,255,255,0.9)]',
    hover: 'group-hover/softselect:border-[#136191]/60 group-hover/softselect:bg-[#136191]/25 group-hover/softselect:opacity-100',
  },
  purple: {
    checked: 'border-purple-500 bg-purple-500 shadow-[0_0_0_3px_rgba(168,85,247,0.12),0_0_12px_rgba(168,85,247,0.38),inset_1px_1px_1px_rgba(255,255,255,0.42)]',
    idle: 'border-slate-300/70 bg-slate-200/60 shadow-[inset_1px_1px_2px_rgba(15,23,42,0.12),0_1px_2px_rgba(255,255,255,0.9)]',
    hover: 'group-hover/softselect:border-purple-400/70 group-hover/softselect:bg-purple-400/25 group-hover/softselect:opacity-100',
  },
  green: {
    checked: 'border-emerald-500 bg-emerald-500 shadow-[0_0_0_3px_rgba(16,185,129,0.12),0_0_12px_rgba(16,185,129,0.38),inset_1px_1px_1px_rgba(255,255,255,0.42)]',
    idle: 'border-slate-300/70 bg-slate-200/60 shadow-[inset_1px_1px_2px_rgba(15,23,42,0.12),0_1px_2px_rgba(255,255,255,0.9)]',
    hover: 'group-hover/softselect:border-emerald-400/70 group-hover/softselect:bg-emerald-400/25 group-hover/softselect:opacity-100',
  },
};

export default function SoftSelectToggle({
  checked = false,
  onChange,
  label = 'Seleccionar',
  size = 'md',
  tone = 'blue',
  muted = true,
  className = '',
  indicatorClassName = '',
  as: Component = 'button',
  ...props
}) {
  const palette = toneClasses[tone] || toneClasses.blue;
  const interactiveProps = Component === 'button'
    ? {
        type: 'button',
        role: 'checkbox',
        'aria-checked': checked,
        'aria-label': label,
        title: label,
        onClick: onChange,
      }
    : {
        'aria-hidden': props['aria-hidden'] ?? true,
      };
  const restProps = { ...props };
  delete restProps['aria-hidden'];

  return (
    <Component
      className={cn(
        'group/softselect inline-flex shrink-0 items-center justify-center rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#136191]/25 active:scale-95 disabled:pointer-events-none disabled:opacity-35',
        hitAreaClasses[size] || hitAreaClasses.md,
        className
      )}
      {...interactiveProps}
      {...restProps}
    >
      <span
        className={cn(
          'block rounded-full border transition-all duration-200',
          sizeClasses[size] || sizeClasses.md,
          checked ? palette.checked : palette.idle,
          !checked && muted ? 'opacity-35' : 'opacity-100',
          !checked && palette.hover,
          indicatorClassName
        )}
      />
    </Component>
  );
}
