import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { normalizeTextInputValue } from '../../utils/normalizeInputValue';
import ClearSearchField from './ClearSearchField';

const MotionDiv = motion.div;

const popoverTransition = {
    type: 'spring',
    stiffness: 300,
    damping: 25,
    mass: 0.82,
};

const normalizeSearchToken = (value) =>
    normalizeTextInputValue(value)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();

const SearchableSelect = ({
    options = [],
    value,
    onChange,
    placeholder = "Seleccionar...",
    labelKey = "nombre",
    valueKey = "id",
    loading = false,
    disabled = false,
    onSearch = null,
    onOpen = null,
    className = "",
    triggerClassName = "",
    dropdownClassName = "",
    searchInputClassName = "",
    optionClassName = "",
    optionSelectedClassName = "",
    checkClassName = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);
    const triggerRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState(null);

    const handleToggle = () => {
        if (!disabled) setIsOpen(!isOpen);
    };

    const updateDropdownPosition = useCallback(() => {
        if (!containerRef.current || typeof window === 'undefined') {
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const availableWidth = Math.max(220, viewportWidth - rect.left - 16);

        setDropdownStyle({
            position: 'fixed',
            top: rect.bottom + 4,
            left: rect.left,
            width: Math.min(rect.width, availableWidth),
        });
    }, []);

    useEffect(() => {
        if (isOpen && onOpen) {
            onOpen();
        }
    }, [isOpen, onOpen]);

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

    // Close when clicking outside
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

    const getOptionLabel = (opt) => {
        if (!opt) return "";
        return opt[labelKey] || opt.nombre || opt.label || "";
    };

    const getOptionValue = (opt) => {
        if (!opt) return "";
        return opt[valueKey] !== undefined ? opt[valueKey] : (opt.id !== undefined ? opt.id : opt.nombre);
    };

    const selectedOption = options.find(opt => String(getOptionValue(opt)) === String(value));

    // Fix: If onSearch is present and there's a search term, assume server-side results are already filtered.
    // Local search should only act as a fallback or for purely local lists.
    const filteredOptions = (onSearch && search.length > 0) 
        ? options 
        : options.filter(opt => {
            const label = getOptionLabel(opt);
            return normalizeSearchToken(label).includes(normalizeSearchToken(search));
        });

    const handleSelect = (option) => {
        onChange(getOptionValue(option));
        setIsOpen(false);
        setSearch('');
    };

    const dropdownContent = (
        <MotionDiv
            ref={dropdownRef}
            initial={{ opacity: 0, y: -6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={popoverTransition}
            style={dropdownStyle || undefined}
            className={`z-[1200] mt-1 origin-top overflow-hidden rounded-[1.15rem] border border-zinc-200 bg-white shadow-[0_18px_46px_rgba(15,23,42,0.14)] dark:border-zinc-700 dark:bg-zinc-800 ${dropdownClassName}`.trim()}
        >
            <div className="border-b border-zinc-100 p-2 dark:border-zinc-700">
                <ClearSearchField
                    value={normalizeTextInputValue(search)}
                    onValueChange={(nextValue) => {
                        const normalizedValue = normalizeTextInputValue(nextValue);
                        setSearch(normalizedValue);
                        if (onSearch) onSearch(normalizedValue);
                    }}
                    autoFocus
                    placeholder="Buscar..."
                    inputClassName={searchInputClassName || "w-full rounded-md border-none bg-zinc-50 py-2 pl-9 pr-10 text-sm outline-none focus:ring-1 focus:ring-blue-500 dark:bg-zinc-900"}
                    clearButtonClassName="right-2"
                />
            </div>

            <div className="custom-scrollbar max-h-60 overflow-y-auto p-1">
                {loading ? (
                    <div className="px-4 py-6 text-center text-sm text-zinc-500">Cargando...</div>
                ) : filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => (
                        <div
                            key={option.id || index}
                            onClick={() => handleSelect(option)}
                            className={`flex cursor-pointer items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 ${String(getOptionValue(selectedOption)) === String(getOptionValue(option)) ? optionSelectedClassName : optionClassName}`.trim()}
                        >
                            <span>{getOptionLabel(option)}</span>
                            {String(getOptionValue(selectedOption)) === String(getOptionValue(option)) && (
                                <Check className={`h-4 w-4 text-blue-500 ${checkClassName}`.trim()} />
                            )}
                        </div>
                    ))
                ) : (
                    <div className="px-4 py-6 text-center text-sm text-zinc-500">Sin resultados</div>
                )}
            </div>
        </MotionDiv>
    );

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            <div
                ref={triggerRef}
                onClick={handleToggle}
                className={triggerClassName || `flex items-center justify-between w-full h-12 px-3 py-2 text-sm border cursor-pointer transition-all duration-200
          ${disabled ? 'bg-zinc-100 border-zinc-200 cursor-not-allowed opacity-60' :
                        isOpen ? 'border-blue-500 ring-2 ring-blue-500/20 bg-white rounded-t-xl' : 'border-zinc-200 bg-zinc-50 rounded-xl hover:bg-white'} 
          dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-200`}
            >
                <span className={selectedOption ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-400'}>
                    {selectedOption ? getOptionLabel(selectedOption) : placeholder}
                </span>
                <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
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

export default SearchableSelect;
