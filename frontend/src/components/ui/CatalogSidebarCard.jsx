import { useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import AppHint from './AppHint';

const CatalogSidebarCard = ({
    codeNode = null,
    title,
    displayTitle = title,
    tooltipText,
    count = null,
    footer = null,
    footerVariant = 'meta',
    active = false,
    dragOver = false,
    onClick,
    leading = null,
    expanded = false,
    compact = false,
    className = '',
}) => {
    const titleRef = useRef(null);
    const footerRef = useRef(null);

    const surfaceClass = active
        ? 'bg-zinc-100 text-zinc-900 border-zinc-300 shadow-sm'
        : dragOver
            ? 'bg-orange-50 text-zinc-700 border-2 border-dashed border-orange-300 shadow-md'
            : 'bg-white text-zinc-600 border-zinc-200/70 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.75)] hover:border-zinc-300 hover:shadow-sm';

    const isNodeTruncated = (node) => {
        if (!node) return false;
        return node.scrollWidth > node.clientWidth || node.scrollHeight > node.clientHeight;
    };

    const shouldShowTooltip = () => {
        if (footerVariant === 'description' && footer) {
            return isNodeTruncated(footerRef.current);
        }
        const titleTruncated = displayTitle ? isNodeTruncated(titleRef.current) : false;
        const footerTruncated = footer ? isNodeTruncated(footerRef.current) : false;
        return footerTruncated || titleTruncated;
    };

    const resolvedTooltipText = tooltipText ?? (footerVariant === 'description' && footer ? footer : title);

    return (
        <AppHint
            content={resolvedTooltipText}
            tone="light"
            as="span"
            triggerClassName="block w-full"
            maxWidth={320}
            minWidth={180}
            widthOffset={-24}
            zIndex={120}
            shouldShow={shouldShowTooltip}
        >
            <button
                onClick={onClick}
                aria-expanded={expanded}
                className={`w-full group relative z-0 hover:z-30 focus-visible:z-30 border rounded-2xl text-left transition-all ${compact ? 'p-2' : 'p-2.5'} ${surfaceClass} ${className}`}
            >
                <div className="flex items-start gap-2.5">
                    {leading ? <div className="shrink-0">{leading}</div> : null}
                    <div className="min-w-0 flex-1">
                        {codeNode ? <div className={`${active ? 'opacity-95' : 'opacity-75'}`}>{codeNode}</div> : null}
                        {displayTitle ? (
                            <div className="relative min-w-0">
                                <p ref={titleRef} className={`${compact ? 'text-[9px]' : 'text-[10px]'} font-black uppercase tracking-[0.18em] pr-5 truncate text-zinc-400`}>
                                    {displayTitle}
                                </p>
                                <div
                                    className={`pointer-events-none absolute inset-y-0 right-0 w-8 ${active ? 'bg-gradient-to-l from-zinc-100 via-zinc-100/90 to-transparent' : 'bg-gradient-to-l from-white via-white/90 to-transparent group-hover:from-white'}`}
                                />
                            </div>
                        ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 self-center">
                        {count !== null && count !== undefined ? (
                            <span
                                className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full border px-2 text-[10px] font-black tabular-nums shadow-[1px_1px_3px_rgba(0,0,0,0.08),-1px_-1px_3px_rgba(255,255,255,0.7)] ${active ? 'border-blue-100 bg-blue-50 text-[#136191]' : 'border-zinc-200 bg-zinc-100 text-zinc-700'}`}
                            >
                                {count}
                            </span>
                        ) : null}
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e3e3e3] bg-[#ededed] text-zinc-500 shadow-[1px_1px_3px_rgba(0,0,0,0.16),-1px_-1px_3px_rgba(255,255,255,0.58)] transition-[color,border-color,transform,box-shadow] duration-200 group-hover:border-[#F39200]/40 group-hover:text-[#F39200] group-active:scale-[0.98] group-active:shadow-[inset_2px_2px_5px_#d0d0d0,inset_-2px_-2px_5px_#ffffff]">
                            <ChevronRight className={`h-3 w-3 transition-transform ${expanded ? 'rotate-90' : ''}`} />
                        </span>
                    </div>
                </div>
                {footer ? (
                    <div className={`${compact ? 'mt-1.5 pt-1.5' : 'mt-2 pt-2'} border-t border-zinc-200/80`}>
                        <p ref={footerRef} className={footerVariant === 'description'
                            ? `${compact ? 'text-[12px]' : 'text-[13px]'} font-extrabold leading-snug text-zinc-800 line-clamp-2 tracking-tight`
                            : 'text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500'}>
                            {footer}
                        </p>
                    </div>
                ) : null}
            </button>
        </AppHint>
    );
};

export default CatalogSidebarCard;
