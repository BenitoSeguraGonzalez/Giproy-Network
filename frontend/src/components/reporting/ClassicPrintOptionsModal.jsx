import React, { useEffect, useMemo, useState } from 'react';
import { Printer } from 'lucide-react';
import { APP_MODAL_CLOSE_BUTTON_CLASS, AppModalBody, AppModalFooter, AppModalHeader, AppModalShell } from '../ui/app-modal';
import AnimatedSelect from '../ui/AnimatedSelect';

const PAGE_SIZES = [
    { value: 'A0', label: 'A0', detail: '841 x 1189 mm' },
    { value: 'A1', label: 'A1', detail: '594 x 841 mm' },
    { value: 'A2', label: 'A2', detail: '420 x 594 mm' },
    { value: 'A3', label: 'A3', detail: '297 x 420 mm' },
    { value: 'A4', label: 'A4', detail: '210 x 297 mm' },
];

const ORIENTATIONS = [
    { value: 'landscape', label: 'Horizontal' },
    { value: 'portrait', label: 'Vertical' },
];

const PRINT_MODES = [
    { value: 'complete', label: 'Completa' },
    { value: 'paginated', label: 'Paginada' },
];

const ROWS_PER_PAGE_VALUES = ['20', '30', '40', '60'];

const selectClassName = [
    'h-9 rounded-xl border border-zinc-200 bg-white px-3',
    'text-xs font-black text-zinc-800 shadow-[inset_1px_1px_3px_rgba(186,190,204,0.22)]',
    'outline-none hover:border-[#F39200]/60 focus:border-[#F39200]',
].join(' ');

const selectDropdownClassName = 'rounded-[1rem] border-zinc-200 bg-white shadow-[0_16px_38px_rgba(15,23,42,0.13)]';
const selectListClassName = 'p-1';
const selectOptionClassName = 'rounded-[0.85rem] px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-zinc-700 hover:bg-orange-50 hover:text-[#F39200]';
const selectOptionSelectedClassName = 'rounded-[0.85rem] bg-orange-50 px-3 py-2 text-[11px] font-black uppercase tracking-[0.08em] text-[#F39200]';

const ClassicPrintOptionsModal = ({
    isOpen,
    onClose,
    onConfirm,
    targetLabel = 'Lámina gráfica',
    defaultPageSize = 'A3',
    defaultOrientation = 'landscape',
    supportsPagination = false,
    defaultPrintMode = 'complete',
    defaultRowsPerPage = 40,
    paginationItemLabel = 'elementos',
    summaryItems = [],
    recommendedText = '',
}) => {
    const [pageSize, setPageSize] = useState(defaultPageSize);
    const [orientation, setOrientation] = useState(defaultOrientation);
    const [printMode, setPrintMode] = useState(defaultPrintMode);
    const [rowsPerPage, setRowsPerPage] = useState(String(defaultRowsPerPage));
    const selectedPage = useMemo(() => PAGE_SIZES.find((item) => item.value === pageSize) || PAGE_SIZES[3], [pageSize]);
    const rowsPerPageOptions = useMemo(
        () => ROWS_PER_PAGE_VALUES.map((value) => ({ value, label: `${value} ${paginationItemLabel}` })),
        [paginationItemLabel],
    );
    const safePrintMode = supportsPagination ? printMode : 'complete';

    useEffect(() => {
        if (!isOpen) return;
        setPageSize(defaultPageSize);
        setOrientation(defaultOrientation);
        setPrintMode(supportsPagination ? defaultPrintMode : 'complete');
        setRowsPerPage(String(defaultRowsPerPage));
    }, [defaultOrientation, defaultPageSize, defaultPrintMode, defaultRowsPerPage, isOpen, supportsPagination]);

    const handleConfirm = () => {
        onConfirm?.({
            pageSize,
            orientation,
            printMode: safePrintMode,
            rowsPerPage: Number(rowsPerPage || defaultRowsPerPage),
        });
    };

    return (
        <AppModalShell
            isOpen={isOpen}
            onClose={onClose}
            size="lg"
            zIndex="z-[150]"
            panelClassName="!rounded-[1.25rem]"
        >
            <AppModalHeader
                title="Lámina gráfica"
                subtitle={targetLabel}
                icon={Printer}
                onClose={onClose}
                iconClassName="text-[#F39200]"
                iconWrapClassName="!h-8 !w-8 !rounded-xl"
                closeButtonClassName={`${APP_MODAL_CLOSE_BUTTON_CLASS} !h-8 !w-8 !rounded-[0.75rem]`}
                closeIconClassName="h-3.5 w-3.5"
            />
            <AppModalBody className="py-2.5 md:py-3">
                {summaryItems.length || recommendedText ? (
                    <section className="mb-3 rounded-[1rem] border border-zinc-200 bg-zinc-50/80 px-3 py-2.5">
                        {summaryItems.length ? (
                            <div className="flex flex-wrap gap-2">
                                {summaryItems.map((item) => (
                                    <span
                                        key={`${item.label}-${item.value}`}
                                        className="inline-flex h-7 items-center gap-1.5 rounded-full border border-white bg-white px-3 text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500 shadow-[2px_2px_6px_rgba(186,190,204,0.18),-2px_-2px_6px_rgba(255,255,255,0.75)]"
                                    >
                                        <span>{item.label}</span>
                                        <span className="text-zinc-900">{item.value}</span>
                                    </span>
                                ))}
                            </div>
                        ) : null}
                        {recommendedText ? (
                            <p className="mt-2 text-[10px] font-bold leading-relaxed text-zinc-500">{recommendedText}</p>
                        ) : null}
                    </section>
                ) : null}
                <div className="grid gap-3 sm:grid-cols-2">
                    <section className="space-y-2">
                        <label className="block text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">Tamaño de papel</label>
                        <AnimatedSelect
                            value={pageSize}
                            onChange={(event) => setPageSize(event.target.value)}
                            className={selectClassName}
                            dropdownMinWidth={260}
                            dropdownClassName={selectDropdownClassName}
                            listClassName={selectListClassName}
                            optionClassName={selectOptionClassName}
                            optionSelectedClassName={selectOptionSelectedClassName}
                            optionLabelClassName="truncate"
                            checkClassName="text-[#F39200]"
                            displayValue={`${selectedPage.label} · ${selectedPage.detail}`}
                        >
                            {PAGE_SIZES.map((item) => (
                                <option key={item.value} value={item.value}>{`${item.label} · ${item.detail}`}</option>
                            ))}
                        </AnimatedSelect>
                    </section>

                    <section className="space-y-2">
                        <label className="block text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">Orientación</label>
                        <AnimatedSelect
                            value={orientation}
                            onChange={(event) => setOrientation(event.target.value)}
                            className={selectClassName}
                            dropdownMinWidth={220}
                            dropdownClassName={selectDropdownClassName}
                            listClassName={selectListClassName}
                            optionClassName={selectOptionClassName}
                            optionSelectedClassName={selectOptionSelectedClassName}
                            optionLabelClassName="truncate"
                            checkClassName="text-[#F39200]"
                        >
                            {ORIENTATIONS.map((item) => (
                                <option key={item.value} value={item.value}>{item.label}</option>
                            ))}
                        </AnimatedSelect>
                    </section>
                </div>
                {supportsPagination ? (
                    <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <section className="space-y-2">
                            <label className="block text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">Salida</label>
                            <AnimatedSelect
                                value={safePrintMode}
                                onChange={(event) => setPrintMode(event.target.value)}
                                className={selectClassName}
                                dropdownMinWidth={220}
                                dropdownClassName={selectDropdownClassName}
                                listClassName={selectListClassName}
                                optionClassName={selectOptionClassName}
                                optionSelectedClassName={selectOptionSelectedClassName}
                                optionLabelClassName="truncate"
                                checkClassName="text-[#F39200]"
                            >
                                {PRINT_MODES.map((item) => (
                                    <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                            </AnimatedSelect>
                        </section>

                        <section className="space-y-2">
                            <label className="block text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">{`${paginationItemLabel} por página`}</label>
                            <AnimatedSelect
                                value={rowsPerPage}
                                onChange={(event) => setRowsPerPage(event.target.value)}
                                className={`${selectClassName} ${safePrintMode !== 'paginated' ? 'opacity-55' : ''}`}
                                dropdownMinWidth={220}
                                dropdownClassName={selectDropdownClassName}
                                listClassName={selectListClassName}
                                optionClassName={selectOptionClassName}
                                optionSelectedClassName={selectOptionSelectedClassName}
                                optionLabelClassName="truncate"
                                checkClassName="text-[#F39200]"
                                disabled={safePrintMode !== 'paginated'}
                            >
                                {rowsPerPageOptions.map((item) => (
                                    <option key={item.value} value={item.value}>{item.label}</option>
                                ))}
                            </AnimatedSelect>
                        </section>
                    </div>
                ) : null}
            </AppModalBody>
            <AppModalFooter variant="flat" className="py-2.5 md:py-2.5">
                <button
                    type="button"
                    onClick={onClose}
                    className="h-9 rounded-full border border-zinc-200 bg-white px-4 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-800"
                >
                    Cancelar
                </button>
                <button
                    type="button"
                    onClick={handleConfirm}
                    className="h-9 rounded-full border border-[#F39200] bg-[#F39200] px-4 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-[0_8px_18px_rgba(243,146,0,0.2)] transition hover:bg-[#e48700]"
                >
                    Generar PDF
                </button>
            </AppModalFooter>
        </AppModalShell>
    );
};

export default ClassicPrintOptionsModal;
