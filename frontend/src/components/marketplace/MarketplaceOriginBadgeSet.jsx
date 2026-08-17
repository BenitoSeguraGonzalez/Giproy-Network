import AppHint from '../ui/AppHint';

const BADGE_STYLES = {
    owned: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    acquired: 'border-amber-200 bg-amber-50 text-amber-700',
    internal: 'border-rose-200 bg-rose-50 text-rose-700',
};



const resolveOriginPayload = (origin) => {
    if (!origin) {
        return null;
    }
    if (origin.origin || origin.ownershipKind || origin.originKind || origin.usagePolicy) {
        return {
            ownershipKind: origin.ownershipKind || origin.origin?.ownership_kind || 'owned',
            originKind: origin.originKind || origin.origin?.origin_kind || 'native',
            usagePolicy: origin.usagePolicy || origin.origin?.metadata_json?.usage_policy || null,
        };
    }
    return {
        ownershipKind: origin.ownership_kind || 'owned',
        originKind: origin.origin_kind || 'native',
        usagePolicy: origin.metadata_json?.usage_policy || null,
    };
};

const buildTooltipText = ({ ownershipKind, originKind, usagePolicy }, label) => {
    const lines = [];
    if (label) {
        lines.push(label);
    }
    lines.push(`Propiedad: ${ownershipKind === 'acquired' ? 'Adquirido' : 'Propio'}`);
    lines.push(`Origen técnico: ${originKind === 'marketplace' ? 'Marketplace' : 'Nativo'}`);
    if (usagePolicy?.publishable_marketplace === false) {
        lines.push('Uso: Solo interno');
    }
    return lines.join(' | ');
};

const MarketplaceOriginBadgeSet = ({ origin, className = '', label = null, loading = false, mode = 'badges' }) => {
    const resolved = resolveOriginPayload(origin);
    const ownershipKind = resolved?.ownershipKind || 'owned';
    const originKind = resolved?.originKind || 'native';
    const usagePolicy = resolved?.usagePolicy || null;
    const tooltipText = buildTooltipText({ ownershipKind, originKind, usagePolicy }, label);

    if (mode === 'tooltip') {
        return (
            <AppHint content={loading ? `${label || 'Origen'} | Cargando` : tooltipText} tone="light" className={className} maxWidth={260} minWidth={180} widthOffset={24}>
                <>
                    <span className={`h-2.5 w-2.5 rounded-full ${ownershipKind === 'acquired' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                    {usagePolicy?.publishable_marketplace === false && (
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                    )}
                </>
            </AppHint>
        );
    }

    return (
        <div className={`flex flex-wrap items-center gap-1.5 ${className}`}>
            {label && (
                <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                    {label}
                </span>
            )}
            {loading && (
                <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500">
                    Cargando
                </span>
            )}
            <span className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] ${
                ownershipKind === 'acquired' ? BADGE_STYLES.acquired : BADGE_STYLES.owned
            }`}>
                {ownershipKind === 'acquired' ? 'Adquirido' : 'Propio'}
            </span>
            {usagePolicy?.publishable_marketplace === false && (
                <span className={`inline-flex rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.16em] ${BADGE_STYLES.internal}`}>
                    Uso interno
                </span>
            )}
        </div>
    );
};

export default MarketplaceOriginBadgeSet;
