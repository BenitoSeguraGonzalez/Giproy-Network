import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown } from 'lucide-react';

const MotionDiv = motion.div;

const popoverTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 0.82,
};

const flattenOptionChildren = (children) =>
    React.Children.toArray(children).flatMap((child) => {
        if (!React.isValidElement(child)) {
            return [];
        }

        if (child.type === React.Fragment) {
            return flattenOptionChildren(child.props.children);
        }

        if (child.type === 'optgroup') {
            return flattenOptionChildren(child.props.children).map((option) => ({
                ...option,
                group: child.props.label,
            }));
        }

        if (child.type !== 'option') {
            return [];
        }

        const rawLabel = React.Children.toArray(child.props.children).join('');

        return [{
            value: child.props.value ?? rawLabel,
            label: rawLabel,
            disabled: Boolean(child.props.disabled),
        }];
    });

const createSelectEvent = ({ value, name, id, multiple, selectedValues, options }) => {
    const selectedOptions = options
        .filter((option) => selectedValues.includes(String(option.value)))
        .map((option) => ({ value: String(option.value), label: option.label }));

    return {
        target: {
            value,
            name,
            id,
            multiple,
            selectedOptions,
        },
        currentTarget: {
            value,
            name,
            id,
            multiple,
            selectedOptions,
        },
    };
};

const AnimatedSelect = ({
    children,
    value,
    defaultValue,
    onChange,
    disabled = false,
    multiple = false,
    className = '',
    dropdownClassName = '',
    listClassName = '',
    optionClassName = '',
    optionSelectedClassName = '',
    optionDisabledClassName = '',
    optionLabelClassName = '',
    checkClassName = '',
    dropdownMinWidth = null,
    dropdownHeader = null,
    renderOption = null,
    optionTitle = true,
    displayValue,
    placeholder = 'Seleccionar...',
    id,
    name,
    title,
    'aria-label': ariaLabel,
    ...rest
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState(null);
    const options = useMemo(() => flattenOptionChildren(children), [children]);
    const initialValue = multiple ? [] : '';
    const uncontrolledInitialValue = defaultValue ?? initialValue;
    const [internalValue, setInternalValue] = useState(uncontrolledInitialValue);
    const resolvedValue = value ?? internalValue;
    const selectedValues = useMemo(() => {
        if (multiple) {
            return Array.isArray(resolvedValue) ? resolvedValue.map(String) : [];
        }

        return [String(resolvedValue ?? '')];
    }, [multiple, resolvedValue]);

    const selectedOptions = options.filter((option) => selectedValues.includes(String(option.value)));
    const displayLabel = displayValue !== undefined
        ? displayValue
        : multiple
            ? (selectedOptions.length > 0 ? `${selectedOptions.length} seleccionados` : placeholder)
            : (selectedOptions[0]?.label || options[0]?.label || placeholder);

    const updateDropdownPosition = useCallback(() => {
        if (!containerRef.current || typeof window === 'undefined') {
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const maxWidth = Math.max(220, viewportWidth - rect.left - 16);
        const availableBelow = viewportHeight - rect.bottom - 16;
        const availableAbove = rect.top - 16;
        const openAbove = availableBelow < 220 && availableAbove > availableBelow;
        const resolvedWidth = Math.max(
            rect.width,
            Number(dropdownMinWidth || 0),
        );

        setDropdownStyle({
            position: 'fixed',
            left: rect.left,
            width: Math.min(resolvedWidth, maxWidth),
            ...(openAbove
                ? { bottom: viewportHeight - rect.top + 4, transformOrigin: 'bottom' }
                : { top: rect.bottom + 4, transformOrigin: 'top' }),
            maxHeight: Math.max(180, Math.min(320, openAbove ? availableAbove : availableBelow)),
        });
    }, [dropdownMinWidth]);

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

    const commitValue = (nextSelectedValues) => {
        const nextValue = multiple ? nextSelectedValues : nextSelectedValues[0];
        if (value === undefined) {
            setInternalValue(nextValue);
        }

        onChange?.(createSelectEvent({
            value: nextValue,
            name,
            id,
            multiple,
            selectedValues: nextSelectedValues.map(String),
            options,
        }));
    };

    const handleOptionSelect = (option) => {
        if (option.disabled) {
            return;
        }

        const optionValue = String(option.value);

        if (multiple) {
            const nextSelectedValues = selectedValues.includes(optionValue)
                ? selectedValues.filter((selectedValue) => selectedValue !== optionValue)
                : [...selectedValues, optionValue];
            commitValue(nextSelectedValues);
            return;
        }

        commitValue([optionValue]);
        setIsOpen(false);
    };

    const handleKeyDown = (event) => {
        if (disabled) {
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            setIsOpen((current) => !current);
        }

        if (event.key === 'Escape') {
            setIsOpen(false);
        }
    };

    const dropdownContent = (
        <MotionDiv
            ref={dropdownRef}
            initial={{ opacity: 0, y: dropdownStyle?.bottom ? 6 : -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: dropdownStyle?.bottom ? 4 : -4, scale: 0.98 }}
            transition={popoverTransition}
            style={dropdownStyle || undefined}
            className={`z-[1300] overflow-hidden rounded-[1.15rem] border border-zinc-200 bg-white shadow-[0_18px_46px_rgba(15,23,42,0.14)] ${dropdownClassName}`.trim()}
        >
            {dropdownHeader}
            <div className={`custom-scrollbar overflow-y-auto p-1 ${listClassName}`.trim()} style={{ maxHeight: dropdownStyle?.maxHeight }}>
                {options.map((option, index) => {
                    const selected = selectedValues.includes(String(option.value));

                    return (
                        <button
                            key={`${option.value}-${index}`}
                            type="button"
                            disabled={option.disabled}
                            onClick={() => handleOptionSelect(option)}
                            title={typeof optionTitle === 'function' ? optionTitle(option) : (optionTitle ? option.label : undefined)}
                            className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2 text-left text-sm transition-colors ${
                                option.disabled
                                    ? `cursor-not-allowed text-zinc-300 ${optionDisabledClassName}`
                                    : selected
                                        ? `text-zinc-800 hover:bg-orange-50 hover:text-[#F39200] ${optionSelectedClassName || optionClassName}`
                                        : `text-zinc-800 hover:bg-orange-50 hover:text-[#F39200] ${optionClassName}`
                            }`.trim()}
                        >
                            {typeof renderOption === 'function'
                                ? renderOption(option, { selected, index })
                                : <span className={`min-w-0 ${optionLabelClassName || 'truncate'}`.trim()}>{option.label}</span>}
                            {selected && <Check className={`h-4 w-4 shrink-0 text-[#F39200] ${checkClassName}`.trim()} />}
                        </button>
                    );
                })}
            </div>
        </MotionDiv>
    );

    return (
        <div ref={containerRef} className="relative w-full">
            <div
                id={id}
                role="combobox"
                aria-label={ariaLabel || title || name}
                aria-expanded={isOpen}
                aria-disabled={disabled}
                tabIndex={disabled ? -1 : 0}
                title={title}
                onClick={() => !disabled && setIsOpen((current) => !current)}
                onKeyDown={handleKeyDown}
                className={`${className} flex cursor-pointer items-center justify-between gap-3 transition-all duration-200 ${
                    disabled ? 'cursor-not-allowed opacity-60' : ''
                }`}
                {...rest}
            >
                <span className="min-w-0 truncate">{displayLabel}</span>
                <ChevronDown className={`h-4 w-4 shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {dropdownStyle && typeof document !== 'undefined' && createPortal(
                <AnimatePresence>
                    {isOpen && dropdownContent}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
};

export default AnimatedSelect;
