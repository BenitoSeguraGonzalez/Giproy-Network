import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import { normalizeTextInputValue } from '../../utils/normalizeInputValue';

const sanitizeSearchFieldValue = (value) => {
    const normalized = normalizeTextInputValue(value);
    return normalized.trim().toLowerCase() === 'null' ? '' : normalized;
};

const sanitizePlaceholderValue = (value) => {
    const normalized = normalizeTextInputValue(value);
    return normalized.trim().toLowerCase() === 'null' ? '' : normalized;
};

export default function ClearSearchField({
    value,
    onValueChange,
    placeholder = 'Buscar...',
    containerClassName = '',
    inputClassName = '',
    searchIconClassName = '',
    clearButtonClassName = '',
    disabled = false,
    type = 'text',
    onFocus,
    onBlur,
    onKeyDown,
    autoFocus = false,
}) {
    const inputRef = useRef(null);
    const escapeResetRef = useRef(false);
    const [inputEpoch, setInputEpoch] = useState(0);
    const safeValue = useMemo(() => sanitizeSearchFieldValue(value), [value]);
    const safePlaceholder = useMemo(() => sanitizePlaceholderValue(placeholder), [placeholder]);
    const hasValue = safeValue.length > 0;

    useLayoutEffect(() => {
        const input = inputRef.current;
        if (!(input instanceof HTMLInputElement)) return;
        const sanitizedDomValue = sanitizeSearchFieldValue(input.value);
        if (input.value !== sanitizedDomValue) {
            input.value = sanitizedDomValue;
        }
        if (sanitizedDomValue !== safeValue) {
            input.value = safeValue;
        }
        if (input.placeholder !== safePlaceholder) {
            input.placeholder = safePlaceholder;
        }
    }, [safePlaceholder, safeValue]);

    useEffect(() => {
        const repair = () => {
            const input = inputRef.current;
            if (!(input instanceof HTMLInputElement)) return;
            const sanitizedDomValue = sanitizeSearchFieldValue(input.value);
            if (input.value !== sanitizedDomValue) {
                input.value = sanitizedDomValue;
            }
            if (sanitizedDomValue !== safeValue) {
                onValueChange?.(sanitizedDomValue);
            }
        };

        repair();
        const rafOne = window.requestAnimationFrame(repair);
        const rafTwo = window.requestAnimationFrame(() => {
            window.requestAnimationFrame(repair);
        });
        const timeoutId = window.setTimeout(repair, 120);

        return () => {
            window.cancelAnimationFrame(rafOne);
            window.cancelAnimationFrame(rafTwo);
            window.clearTimeout(timeoutId);
        };
    }, [onValueChange, safeValue]);

    const repairInputNode = (input) => {
        if (!(input instanceof HTMLInputElement)) return;
        input.value = '';
        input.placeholder = safePlaceholder;
    };

    const scheduleEscapeRepair = () => {
        const repair = () => repairInputNode(inputRef.current);
        repair();
        window.requestAnimationFrame(repair);
        window.setTimeout(repair, 0);
        window.setTimeout(repair, 32);
        window.setTimeout(repair, 96);
        let attempts = 0;
        const intervalId = window.setInterval(() => {
            repair();
            attempts += 1;
            if (attempts >= 20) {
                window.clearInterval(intervalId);
            }
        }, 40);
    };

    return (
        <div className={`relative group ${containerClassName}`}>
            <Search className={`pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-[#F39200] ${searchIconClassName}`} />
            <input
                key={`clear-search-field-${inputEpoch}`}
                ref={inputRef}
                type={type}
                value={safeValue}
                onChange={(event) => onValueChange?.(sanitizeSearchFieldValue(event.target.value))}
                placeholder={safePlaceholder}
                disabled={disabled}
                autoComplete="off"
                spellCheck={false}
                onFocus={onFocus}
                onBlur={(event) => {
                    if (escapeResetRef.current) {
                        escapeResetRef.current = false;
                        repairInputNode(event.currentTarget);
                        onValueChange?.('');
                        onBlur?.(event);
                        return;
                    }
                    const sanitized = sanitizeSearchFieldValue(event.currentTarget.value);
                    if (event.currentTarget.value !== sanitized) {
                        event.currentTarget.value = sanitized;
                    }
                    if (sanitized !== safeValue) {
                        onValueChange?.(sanitized);
                    }
                    onBlur?.(event);
                }}
                onKeyDown={(event) => {
                    if (event.key === 'Escape') {
                        event.preventDefault();
                        event.stopPropagation();
                        escapeResetRef.current = true;
                        repairInputNode(event.currentTarget);
                        onValueChange?.('');
                        setInputEpoch((current) => current + 1);
                        scheduleEscapeRepair();
                        window.requestAnimationFrame(() => {
                            const input = inputRef.current;
                            if (!(input instanceof HTMLInputElement)) return;
                            input.blur();
                        });
                        return;
                    }
                    onKeyDown?.(event);
                }}
                autoFocus={autoFocus}
                className={inputClassName}
            />
            {hasValue && !disabled && (
                <button
                    type="button"
                    onClick={() => onValueChange?.('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 ${clearButtonClassName}`}
                    aria-label="Limpiar búsqueda"
                    title="Limpiar"
                >
                    <X className="h-3.5 w-3.5" />
                </button>
            )}
        </div>
    );
}
