import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, Clock3, RotateCcw } from 'lucide-react';

const MotionDiv = motion.div;

const popoverTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 0.82,
};

const pad = (value) => String(value).padStart(2, '0');

const MONTH_LABELS = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const WEEKDAY_LABELS = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

const normalizeDatePartsFromValue = (value, type = 'date') => {
    if (!value) return null;

    const rawValue = String(value).trim();
    if (!rawValue) return null;

    if (type === 'datetime-local') {
        const match = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
        if (match) {
            return {
                year: Number(match[1]),
                month: Number(match[2]) - 1,
                day: Number(match[3]),
                hour: Number(match[4]),
                minute: Number(match[5]),
            };
        }
    }

    const dateMatch = rawValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (dateMatch) {
        return {
            year: Number(dateMatch[1]),
            month: Number(dateMatch[2]) - 1,
            day: Number(dateMatch[3]),
            hour: 0,
            minute: 0,
        };
    }

    const parsedDate = new Date(rawValue);
    if (Number.isNaN(parsedDate.getTime())) {
        return null;
    }

    return {
        year: parsedDate.getFullYear(),
        month: parsedDate.getMonth(),
        day: parsedDate.getDate(),
        hour: parsedDate.getHours(),
        minute: parsedDate.getMinutes(),
    };
};

const toComparableDateKey = (parts) => {
    if (!parts) return '';
    return `${parts.year}-${pad(parts.month + 1)}-${pad(parts.day)}`;
};

const toInputValue = (parts, type = 'date') => {
    if (!parts) return '';

    const dateKey = toComparableDateKey(parts);
    if (type === 'datetime-local') {
        return `${dateKey}T${pad(parts.hour ?? 0)}:${pad(parts.minute ?? 0)}`;
    }
    return dateKey;
};

const formatDisplayValue = (parts, type = 'date', { compact = false } = {}) => {
    if (!parts) return '';

    const date = new Date(
        parts.year,
        parts.month,
        parts.day,
        parts.hour ?? 0,
        parts.minute ?? 0,
        0,
        0,
    );

    if (Number.isNaN(date.getTime())) {
        return '';
    }

    if (type === 'datetime-local') {
        if (compact) {
            return new Intl.DateTimeFormat('es-ES', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
            }).format(date).replace(',', '');
        }

        return new Intl.DateTimeFormat('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        }).format(date).replace(',', '');
    }

    return new Intl.DateTimeFormat('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: compact ? '2-digit' : 'numeric',
    }).format(date);
};

const buildCalendarMatrix = (visibleMonthDate) => {
    const firstOfMonth = new Date(visibleMonthDate.getFullYear(), visibleMonthDate.getMonth(), 1);
    const firstWeekday = (firstOfMonth.getDay() + 6) % 7;
    const matrixStart = new Date(firstOfMonth);
    matrixStart.setDate(firstOfMonth.getDate() - firstWeekday);

    const days = [];
    for (let index = 0; index < 42; index += 1) {
        const current = new Date(matrixStart);
        current.setDate(matrixStart.getDate() + index);
        days.push(current);
    }

    return days;
};

const clampNumber = (value, min, max) => {
    if (Number.isNaN(value)) return min;
    return Math.min(max, Math.max(min, value));
};

const createInputLikeEvent = ({ value, name, id, type }) => ({
    target: { value, name, id, type },
    currentTarget: { value, name, id, type },
});

const AnimatedDateInput = React.forwardRef(({
    type = 'date',
    value,
    defaultValue,
    onChange,
    onValueChange,
    onBlur,
    disabled = false,
    readOnly = false,
    className = '',
    placeholder,
    id,
    name,
    title,
    min,
    max,
    clearable = true,
    variant = 'default',
    align = 'auto',
    openOnMount = false,
    compactFullDisplay = false,
    'aria-label': ariaLabel,
    ...rest
}, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState(null);
    const [draftParts, setDraftParts] = useState(() => normalizeDatePartsFromValue(value ?? defaultValue, type));
    const [visibleMonthDate, setVisibleMonthDate] = useState(() => {
        const parts = normalizeDatePartsFromValue(value ?? defaultValue, type);
        return parts ? new Date(parts.year, parts.month, 1) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    });

    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const hasInteractedRef = useRef(false);

    const resolvedParts = useMemo(
        () => normalizeDatePartsFromValue(value ?? defaultValue, type),
        [defaultValue, type, value],
    );

    const minParts = useMemo(() => normalizeDatePartsFromValue(min, type), [min, type]);
    const maxParts = useMemo(() => normalizeDatePartsFromValue(max, type), [max, type]);
    const minKey = toComparableDateKey(minParts);
    const maxKey = toComparableDateKey(maxParts);

    useEffect(() => {
        if (!isOpen) {
            setDraftParts(resolvedParts);
        }
    }, [isOpen, resolvedParts]);

    useEffect(() => {
        if (!openOnMount || disabled || readOnly) return;
        setIsOpen(true);
    }, [disabled, openOnMount, readOnly]);

    useEffect(() => {
        if (!isOpen) return;
        if (draftParts) {
            setVisibleMonthDate(new Date(draftParts.year, draftParts.month, 1));
        }
    }, [draftParts, isOpen]);

    const updateDropdownPosition = useCallback(() => {
        if (!containerRef.current || typeof window === 'undefined') {
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const desiredWidth = variant === 'compact'
            ? (type === 'datetime-local' ? 286 : 268)
            : (type === 'datetime-local' ? 304 : 288);
        const width = Math.min(Math.max(rect.width, desiredWidth), viewportWidth - 24);
        const availableBelow = viewportHeight - rect.bottom - 16;
        const availableAbove = rect.top - 16;
        const openAbove = availableBelow < 320 && availableAbove > availableBelow;
        const maxHeight = Math.max(220, Math.min(type === 'datetime-local' ? 356 : 286, openAbove ? availableAbove : availableBelow));

        let left = rect.left;
        if (align === 'right') {
            left = rect.right - width;
        } else if (align === 'auto') {
            left = Math.min(rect.left, viewportWidth - width - 12);
        }
        left = Math.max(12, left);

        setDropdownStyle({
            position: 'fixed',
            left,
            width,
            maxHeight,
            ...(openAbove
                ? { bottom: viewportHeight - rect.top + 6, transformOrigin: 'bottom' }
                : { top: rect.bottom + 6, transformOrigin: 'top' }),
        });
    }, [align, type, variant]);

    useEffect(() => {
        if (!isOpen) return undefined;

        updateDropdownPosition();

        const handleViewportUpdate = () => updateDropdownPosition();
        window.addEventListener('resize', handleViewportUpdate);
        window.addEventListener('scroll', handleViewportUpdate, true);

        return () => {
            window.removeEventListener('resize', handleViewportUpdate);
            window.removeEventListener('scroll', handleViewportUpdate, true);
        };
    }, [isOpen, updateDropdownPosition]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            const insideTrigger = containerRef.current?.contains(event.target);
            const insideDropdown = dropdownRef.current?.contains(event.target);
            if (!insideTrigger && !insideDropdown) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        if (!isOpen) return undefined;

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                setIsOpen(false);
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen && hasInteractedRef.current) {
            hasInteractedRef.current = false;
            onBlur?.(createInputLikeEvent({
                value: toInputValue(resolvedParts, type),
                name,
                id,
                type,
            }));
        }
    }, [id, isOpen, name, onBlur, resolvedParts, type]);

    const commitValue = useCallback((nextParts) => {
        const nextValue = toInputValue(nextParts, type);
        onValueChange?.(nextValue);
        onChange?.(createInputLikeEvent({
            value: nextValue,
            name,
            id,
            type,
        }));
    }, [id, name, onChange, onValueChange, type]);

    const isDayDisabled = useCallback((date) => {
        const key = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
        if (minKey && key < minKey) return true;
        if (maxKey && key > maxKey) return true;
        return false;
    }, [maxKey, minKey]);

    const handleSelectDate = (date) => {
        if (disabled || readOnly || isDayDisabled(date)) {
            return;
        }

        hasInteractedRef.current = true;
        const baseParts = draftParts || resolvedParts || normalizeDatePartsFromValue(new Date().toISOString(), 'datetime-local');
        const nextParts = {
            year: date.getFullYear(),
            month: date.getMonth(),
            day: date.getDate(),
            hour: baseParts?.hour ?? 0,
            minute: baseParts?.minute ?? 0,
        };

        setDraftParts(nextParts);
        commitValue(nextParts);

        if (type === 'date') {
            setIsOpen(false);
        }
    };

    const updateTime = (field, rawValue) => {
        if (disabled || readOnly) return;

        const safeBase = draftParts || resolvedParts || {
            year: new Date().getFullYear(),
            month: new Date().getMonth(),
            day: new Date().getDate(),
            hour: 0,
            minute: 0,
        };
        const parsedValue = Number(String(rawValue).replace(/\D/g, ''));
        const nextParts = {
            ...safeBase,
            [field]: clampNumber(parsedValue, field === 'hour' ? 0 : 0, field === 'hour' ? 23 : 59),
        };
        hasInteractedRef.current = true;
        setDraftParts(nextParts);
        commitValue(nextParts);
    };

    const handleSetToday = () => {
        if (disabled || readOnly) return;
        const now = new Date();
        const nextParts = {
            year: now.getFullYear(),
            month: now.getMonth(),
            day: now.getDate(),
            hour: type === 'datetime-local' ? now.getHours() : 0,
            minute: type === 'datetime-local' ? now.getMinutes() : 0,
        };
        hasInteractedRef.current = true;
        setDraftParts(nextParts);
        setVisibleMonthDate(new Date(nextParts.year, nextParts.month, 1));
        commitValue(nextParts);
        if (type === 'date') {
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        if (disabled || readOnly) return;
        hasInteractedRef.current = true;
        setDraftParts(null);
        commitValue(null);
        setIsOpen(false);
    };

    const handleKeyDown = (event) => {
        if (disabled || readOnly) return;

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen((current) => !current);
            return;
        }

        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const calendarDays = useMemo(() => buildCalendarMatrix(visibleMonthDate), [visibleMonthDate]);
    const selectedKey = toComparableDateKey(draftParts || resolvedParts);
    const displayLabel = formatDisplayValue(resolvedParts, type, { compact: variant === 'compact' && !compactFullDisplay }) || placeholder || (type === 'datetime-local' ? 'Seleccione fecha y hora' : 'Seleccione fecha');

    const triggerBaseClass = variant === 'compact'
        ? 'h-9 rounded-[0.95rem] px-3 text-[9.5px] font-semibold'
        : 'h-12 rounded-[1.15rem] px-4 text-sm font-medium';
    const iconOffsetClass = variant === 'compact' ? 'pl-9' : 'pl-11';
    const triggerRightPaddingClass = variant === 'compact' ? 'pr-2.5' : 'pr-4';
    const iconSizeClass = variant === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4';
    const panelRadiusClass = variant === 'compact' ? 'rounded-[1rem]' : 'rounded-[1.15rem]';
    const selectedTimeLabel = `${pad((draftParts || resolvedParts)?.hour ?? 0)}:${pad((draftParts || resolvedParts)?.minute ?? 0)}`;
    const showCompactMode = variant === 'compact';
    const floatingIconButtonClass = 'flex h-8 w-8 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-500 shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:border-[#F39200] hover:text-[#F39200]';
    const floatingActionButtonClass = 'inline-flex h-8 items-center gap-1 rounded-full border border-zinc-200/80 bg-white px-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500 shadow-[0_8px_18px_rgba(15,23,42,0.08)] transition hover:border-[#F39200] hover:text-[#F39200]';

    const dropdownContent = (
        <MotionDiv
            ref={dropdownRef}
            initial={{ opacity: 0, y: dropdownStyle?.bottom ? 6 : -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownStyle?.bottom ? 4 : -4, scale: 0.98 }}
            transition={popoverTransition}
            style={dropdownStyle || undefined}
            className={`z-[1400] overflow-y-auto overflow-x-hidden border border-zinc-200 bg-white shadow-[0_18px_46px_rgba(15,23,42,0.14)] ${panelRadiusClass}`}
        >
            <div className="border-b border-zinc-100 px-3 py-2">
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-zinc-700">
                        <button
                            type="button"
                            onClick={() => setVisibleMonthDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                            className={floatingIconButtonClass}
                        >
                            <ChevronLeft className="h-3 w-3" />
                        </button>
                    </div>
                    <div className="mr-0.5 flex items-center gap-2">
                        {type === 'datetime-local' && (
                            <div className={floatingActionButtonClass}>
                                <Clock3 className="h-3 w-3" />
                                {selectedTimeLabel}
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={handleSetToday}
                            className={floatingActionButtonClass}
                        >
                            <RotateCcw className="h-3 w-3" />
                            Hoy
                        </button>
                        <button
                            type="button"
                            onClick={() => setVisibleMonthDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                            className={floatingIconButtonClass}
                        >
                            <ChevronRight className="h-3 w-3" />
                        </button>
                    </div>
                </div>
            </div>

            <div className="p-2.5">
                <div className="mb-2 text-center">
                    <p className="text-[0.92rem] font-semibold capitalize leading-none text-zinc-900">
                        {MONTH_LABELS[visibleMonthDate.getMonth()]} de {visibleMonthDate.getFullYear()}
                    </p>
                </div>
                <div className="grid grid-cols-7 gap-0.5">
                    {WEEKDAY_LABELS.map((label) => (
                        <div key={label} className="flex items-center justify-center text-[9px] font-black uppercase tracking-[0.12em] text-zinc-400">
                            {label}
                        </div>
                    ))}
                    {calendarDays.map((date) => {
                        const dayKey = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
                        const isSelected = selectedKey === dayKey;
                        const isOutsideMonth = date.getMonth() !== visibleMonthDate.getMonth();
                        const isDisabledDay = isDayDisabled(date);

                        return (
                            <button
                                key={dayKey}
                                type="button"
                                disabled={isDisabledDay}
                                onClick={() => handleSelectDate(date)}
                                className={`flex h-7 items-center justify-center rounded-[0.75rem] text-[0.82rem] font-semibold transition ${
                                    isSelected
                                        ? 'border border-[#F39200] bg-orange-50 text-[#F39200] shadow-[0_6px_14px_rgba(243,146,0,0.12)]'
                                        : isDisabledDay
                                            ? 'cursor-not-allowed text-zinc-300'
                                            : isOutsideMonth
                                                ? 'text-zinc-300 hover:bg-zinc-50'
                                                : 'text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900'
                                }`}
                            >
                                {date.getDate()}
                            </button>
                        );
                    })}
                </div>

                {type === 'datetime-local' && (
                    <div className="mt-2 border-t border-zinc-100 pt-2">
                        <div className="flex items-center gap-1.5 text-zinc-500">
                            <div className="flex items-center gap-1.5">
                                <Clock3 className="h-3.5 w-3.5" />
                                <p className="text-[9px] font-black uppercase tracking-[0.14em]">Hora</p>
                            </div>
                        </div>
                        <div className="mt-1.5 grid grid-cols-[60px_auto_60px] items-center justify-center gap-2">
                            <input
                                type="text"
                                inputMode="numeric"
                                value={pad((draftParts || resolvedParts)?.hour ?? 0)}
                                onChange={(event) => updateTime('hour', event.target.value)}
                                className="h-8 rounded-[0.75rem] border border-zinc-200 bg-white px-2 text-center text-[0.95rem] font-semibold text-zinc-800 outline-none transition focus:border-[#F39200]"
                            />
                            <span className="text-[0.95rem] font-semibold text-zinc-500">:</span>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={pad((draftParts || resolvedParts)?.minute ?? 0)}
                                onChange={(event) => updateTime('minute', event.target.value)}
                                className="h-8 rounded-[0.75rem] border border-zinc-200 bg-white px-2 text-center text-[0.95rem] font-semibold text-zinc-800 outline-none transition focus:border-[#F39200]"
                            />
                        </div>
                    </div>
                )}

            </div>
        </MotionDiv>
    );

    return (
        <div ref={containerRef} className="relative w-full">
            <button
                ref={(node) => {
                    triggerRef.current = node;
                    if (typeof ref === 'function') {
                        ref(node);
                    } else if (ref) {
                        ref.current = node;
                    }
                }}
                type="button"
                id={id}
                name={name}
                title={title}
                aria-label={ariaLabel || title || name}
                aria-expanded={isOpen}
                aria-disabled={disabled || readOnly}
                data-date-trigger="true"
                onClick={() => {
                    if (disabled || readOnly) return;
                    setIsOpen((current) => !current);
                }}
                onKeyDown={handleKeyDown}
                className={`${className} relative ${triggerBaseClass} ${iconOffsetClass} ${triggerRightPaddingClass} flex w-full items-center justify-between gap-2 border border-zinc-200 bg-white text-left text-zinc-800 outline-none transition-all duration-200 focus:border-[#F39200] ${disabled || readOnly ? 'cursor-not-allowed opacity-60' : 'hover:border-zinc-300 hover:bg-white'}`}
                {...rest}
            >
                <Calendar className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 ${iconSizeClass}`} />
                <span className={`min-w-0 truncate ${resolvedParts ? 'text-zinc-800' : 'text-zinc-400'}`}>
                    {displayLabel}
                </span>
                {!showCompactMode ? (
                    <ChevronDown className={`h-4 w-4 shrink-0 text-zinc-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                ) : null}
            </button>

            {dropdownStyle && typeof document !== 'undefined' && createPortal(
                isOpen ? dropdownContent : null,
                document.body,
            )}
        </div>
    );
});

AnimatedDateInput.displayName = 'AnimatedDateInput';

export default AnimatedDateInput;
