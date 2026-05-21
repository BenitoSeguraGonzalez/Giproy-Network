import { ArrowLeft, ArrowRight, ArrowUpRight, Heart, ShieldCheck, ShoppingCart, Sparkles, Star, Store, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';

import { Card, CardContent } from '../ui/card';
import { getMarketplaceSellerDisplayName } from '../../utils/marketplaceSeller';

export const MARKETPLACE_TYPE_LABELS = {
    licencia: 'Licencia',
    addon: 'Addon',
    adicional: 'Adicional',
    portal_compras_publicas: 'Portal compras publicas',
    base_maestra: 'Base Maestra',
    apu: 'APU',
    proyecto: 'Proyecto',
};

const PRODUCT_TYPE_META = {
    licencia: 'border-sky-200 bg-sky-50 text-sky-700',
    addon: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    adicional: 'border-zinc-200 bg-zinc-100 text-zinc-700',
    portal_compras_publicas: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    base_maestra: 'border-blue-200 bg-blue-50 text-[#136191]',
    apu: 'border-orange-200 bg-orange-50 text-[#A55A00]',
    proyecto: 'border-violet-200 bg-violet-50 text-violet-700',
};

export const isMarketplaceSystemProduct = (product) =>
    (product?.seller?.rol || '').toLowerCase() === 'superadministrador';

export const MarketplaceTypeBadge = ({ type }) => (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${PRODUCT_TYPE_META[type] || PRODUCT_TYPE_META.adicional}`}>
        {MARKETPLACE_TYPE_LABELS[type] || type || 'Otro'}
    </span>
);

export const MarketplaceShell = ({ children, className = '', contentClassName = '' }) => (
    <div className={`min-h-[calc(100vh-theme(spacing.20))] bg-[#F2F4F7] ${className}`}>
        <div className={`mx-auto max-w-[1680px] px-4 py-5 sm:px-5 md:px-8 md:py-6 xl:px-10 ${contentClassName}`}>{children}</div>
    </div>
);

export const MarketplaceDashboardHeader = ({
    backTo = '/marketplace',
    title,
    subtitle,
    badge = 'Tienda',
    contextLabel,
    actions,
}) => (
    <header className="sticky top-0 z-20 rounded-[2rem] border border-zinc-200 bg-white px-5 py-4 shadow-[0_10px_35px_rgba(0,0,0,0.04)] md:px-6 xl:px-7">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex min-w-0 items-center gap-4 xl:gap-6">
                <Link
                    to={backTo}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                    title="Volver a Tienda"
                >
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 xl:gap-2.5">
                        <span className="inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
                        <h1 className="truncate text-[1.7rem] font-black uppercase tracking-tight text-zinc-900 xl:text-[1.9rem]">
                            {title}
                        </h1>
                        <span className="inline-flex rounded-xl border border-orange-100 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#F39200]">
                            {badge}
                        </span>
                    </div>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 xl:text-[11px]">
                        {subtitle}
                    </p>
                    {contextLabel ? (
                        <p className="mt-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                            {contextLabel}
                        </p>
                    ) : null}
                </div>
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
        </div>
    </header>
);

export const MarketplaceModuleCard = ({
    eyebrow,
    title,
    description,
    cta = 'Abrir frente',
    icon: Icon,
    onClick,
    tone = 'default',
}) => {
    const toneClasses = tone === 'blue'
        ? 'border-blue-200 bg-blue-50 text-[#136191]'
        : tone === 'orange'
            ? 'border-orange-200 bg-orange-50 text-[#F39200]'
            : tone === 'violet'
                ? 'border-violet-200 bg-violet-50 text-violet-700'
                : 'border-zinc-200 bg-zinc-50 text-zinc-600';

    return (
        <button
            type="button"
            onClick={onClick}
            className="group min-h-[210px] rounded-[1.5rem] border border-zinc-100 bg-white px-5 py-5 text-left shadow-[0_14px_34px_rgba(15,23,42,0.045)] transition-all hover:border-zinc-200"
        >
            <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-[0.95rem] border ${toneClasses}`}>
                {Icon ? <Icon className="h-5 w-5" /> : null}
            </div>
            <p className="text-[8px] font-black uppercase tracking-[0.22em] text-zinc-400">{eyebrow}</p>
            <h2 className="mt-2 text-[1.12rem] font-black uppercase leading-none tracking-tight text-[#1A1A1A] xl:text-[1.22rem]">
                {title}
            </h2>
            <p className="mt-3 min-h-[48px] max-w-[36ch] text-[0.82rem] font-medium leading-relaxed text-zinc-600">
                {description}
            </p>
            <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">{cta}</span>
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-[0.9rem] border border-[#ececec] bg-[#ededed] text-zinc-500 shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff] transition-[color,filter,box-shadow] duration-200 group-hover:text-[#136191]">
                    <ArrowUpRight className="h-4 w-4" />
                </span>
            </div>
        </button>
    );
};

export const MarketplaceHero = ({
    eyebrow = 'Marketplace',
    title,
    description,
    children,
    accent = 'orange',
    backgroundImage = null,
}) => {
    const eyebrowTone = accent === 'blue'
        ? 'border-blue-200 bg-blue-50 text-[#136191]'
        : 'border-orange-200 bg-orange-50 text-[#F39200]';

    return (
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className={`relative px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8 ${backgroundImage ? 'bg-zinc-900' : 'bg-[radial-gradient(circle_at_top_left,rgba(243,146,0,0.16),transparent_32%),radial-gradient(circle_at_top_right,rgba(19,97,145,0.12),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fbfbfc_100%)]'}`}>
                {backgroundImage ? (
                    <>
                        <img
                            src={backgroundImage}
                            alt={title || 'Banner marketplace'}
                            className="absolute inset-0 h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.72),rgba(15,23,42,0.2)_48%,rgba(15,23,42,0.68))]" />
                    </>
                ) : null}
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className={`relative max-w-4xl space-y-3 ${backgroundImage ? 'text-white' : ''}`}>
                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] ${eyebrowTone}`}>
                            <Store className="h-3.5 w-3.5" />
                            {eyebrow}
                        </span>
                        <div className="space-y-2">
                            <h1 className={`text-[1.9rem] font-black uppercase tracking-tight sm:text-3xl md:text-4xl xl:text-[2.7rem] ${backgroundImage ? 'text-white' : 'text-[#1A1A1A]'}`}>
                                {title}
                            </h1>
                            <p className={`max-w-3xl text-sm font-medium leading-relaxed md:text-[15px] ${backgroundImage ? 'text-white/85' : 'text-zinc-600'}`}>
                                {description}
                            </p>
                        </div>
                    </div>
                    {children ? <div className="relative flex w-full flex-col gap-3 xl:w-auto xl:min-w-[360px]">{children}</div> : null}
                </div>
            </div>
        </section>
    );
};

export const MarketplaceQuickStat = ({ label, value, tone = 'zinc' }) => {
    const toneClasses = tone === 'orange'
        ? 'border-orange-200 bg-orange-50 text-[#A55A00]'
        : tone === 'blue'
            ? 'border-blue-200 bg-blue-50 text-[#136191]'
            : 'border-zinc-200 bg-zinc-50 text-zinc-600';

    return (
        <div className={`rounded-[1.25rem] border px-4 py-3 min-h-[92px] ${toneClasses}`}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] opacity-75">{label}</p>
            <p className="mt-2 text-xl font-black tracking-tight text-[#1A1A1A] sm:text-2xl">{value}</p>
        </div>
    );
};

export const MarketplaceSectionCard = ({
    title,
    eyebrow,
    description,
    actionLabel,
    onAction,
    children,
    className = '',
    contentClassName = '',
}) => (
    <div className={`rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)] ${className}`}>
        {eyebrow ? <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{eyebrow}</p> : null}
        {title ? <h3 className="mt-2 text-xl font-black tracking-tight text-zinc-900">{title}</h3> : null}
        {description ? <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">{description}</p> : null}
        {children ? <div className={`mt-4 ${contentClassName}`}>{children}</div> : null}
        {onAction ? (
            <button
                type="button"
                onClick={onAction}
                className="mt-5 inline-flex h-11 items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:border-[#136191] hover:text-[#136191]"
            >
                {actionLabel}
                <ArrowRight className="h-4 w-4" />
            </button>
        ) : null}
    </div>
);

export const MarketplaceSectionHeader = ({ eyebrow, title, description, badge }) => (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
            {eyebrow ? <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{eyebrow}</p> : null}
            <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A] sm:text-2xl">{title}</h2>
            {description ? <p className="max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">{description}</p> : null}
        </div>
        {badge ? (
            <div className="w-full rounded-full border border-zinc-200 bg-white px-4 py-2 text-center text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500 md:w-auto">
                {badge}
            </div>
        ) : null}
    </div>
);

export const MarketplaceActionTile = ({ eyebrow, title, description, onClick, tone = 'default' }) => {
    const classes = tone === 'warm'
        ? 'border-orange-200 bg-[linear-gradient(145deg,#fff7ed_0%,#ffffff_100%)]'
        : tone === 'cool'
            ? 'border-blue-200 bg-[linear-gradient(145deg,#eff6ff_0%,#ffffff_100%)]'
            : 'border-zinc-200 bg-white';

    return (
        <button
            type="button"
            onClick={onClick}
            className={`w-full rounded-[1.5rem] border px-4 py-4 sm:px-5 text-left transition-colors hover:border-[#136191] hover:text-[#136191] ${classes}`}
        >
            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{eyebrow}</p>
            <p className="mt-2 text-sm font-black text-zinc-800">{title}</p>
            {description ? <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">{description}</p> : null}
        </button>
    );
};

export const MarketplaceEmptyState = ({
    eyebrow,
    title,
    description,
    primaryActionLabel,
    onPrimaryAction,
    secondaryActionLabel,
    onSecondaryAction,
    children,
}) => (
    <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white p-6 sm:p-8 md:p-10">
        <div className="mx-auto max-w-4xl space-y-5 text-center">
            <div className="space-y-3">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#136191]">{eyebrow}</p>
                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900 sm:text-2xl">{title}</h2>
                <p className="mx-auto max-w-2xl text-sm font-medium leading-relaxed text-zinc-600">{description}</p>
            </div>
            {children}
            {(onPrimaryAction || onSecondaryAction) ? (
                <div className="flex flex-col justify-center gap-3 sm:flex-row">
                    {onPrimaryAction ? (
                        <button
                            type="button"
                            onClick={onPrimaryAction}
                            className="inline-flex h-11 w-full items-center justify-center rounded-2xl bg-zinc-900 px-5 text-[11px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#136191] sm:w-auto"
                        >
                            {primaryActionLabel}
                        </button>
                    ) : null}
                    {onSecondaryAction ? (
                        <button
                            type="button"
                            onClick={onSecondaryAction}
                            className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-zinc-200 bg-white px-5 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:border-[#136191] hover:text-[#136191] sm:w-auto"
                        >
                            {secondaryActionLabel}
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    </div>
);

export const MarketplaceProductCard = ({
    product,
    canBuy,
    detailPath,
    onBuy,
    featured = false,
    isFavorite = false,
    onToggleFavorite,
    isCompared = false,
    onToggleCompare,
    compareDisabled = false,
}) => {
    const isSystemProduct = isMarketplaceSystemProduct(product);
    const ratingValue = Number(product?.rating_promedio || 0).toFixed(1);

    return (
        <Card
            className={`overflow-hidden rounded-[1.85rem] border ${
                featured
                    ? 'border-orange-200 bg-[linear-gradient(180deg,#fff8f1_0%,#ffffff_72%)]'
                    : 'border-zinc-200 bg-white'
            } shadow-[0_18px_45px_rgba(15,23,42,0.05)] transition-transform duration-200 hover:-translate-y-1`}
        >
            <CardContent className="flex h-full flex-col p-0">
                <div className={`border-b px-6 py-5 ${featured ? 'border-orange-100 bg-white/70' : 'border-zinc-100 bg-zinc-50/60'}`}>
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex flex-wrap gap-2">
                            <MarketplaceTypeBadge type={product.product_type} />
                            {isSystemProduct ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#A55A00]">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Sistema
                                </span>
                            ) : null}
                        </div>
                        <div className="flex items-center gap-2">
                            {onToggleFavorite ? (
                                <button
                                    type="button"
                                    onClick={() => onToggleFavorite(product)}
                                    className={`inline-flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                                        isFavorite
                                            ? 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300'
                                            : 'border-zinc-200 bg-white text-zinc-500 hover:border-rose-200 hover:text-rose-500'
                                    }`}
                                    aria-label={isFavorite ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                                >
                                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-current' : ''}`} />
                                </button>
                            ) : null}
                            <div className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                <Star className="h-3.5 w-3.5 text-amber-500" />
                                {ratingValue}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex h-full flex-col px-6 py-6">
                    <div className="space-y-3">
                        <h3 className="text-xl font-black tracking-tight text-zinc-900">{product.titulo}</h3>
                        <p className="min-h-[48px] sm:min-h-[66px] text-sm font-medium leading-relaxed text-zinc-600">
                            {product.resumen || 'Producto comercial listo para clonar e integrar en tu empresa.'}
                        </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                        {product.category?.nombre ? (
                            <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#136191]">
                                {product.category.nombre}
                            </span>
                        ) : null}
                        {(product.etiquetas || []).slice(0, 3).map((tagValue) => (
                            <span key={tagValue} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                                <Tag className="h-3 w-3" />
                                {tagValue}
                            </span>
                        ))}
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-3 rounded-[1.4rem] border border-zinc-100 bg-zinc-50 p-4 sm:grid-cols-2">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Propietario</p>
                            <p className="mt-1 text-sm font-black text-zinc-700">{getMarketplaceSellerDisplayName(product.seller)}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Ventas</p>
                            <p className="mt-1 text-sm font-black text-zinc-700">{product.ventas_count || 0}</p>
                        </div>
                    </div>

                    <div className="mt-auto flex flex-col gap-4 border-t border-zinc-100 pt-5 md:flex-row md:items-end md:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Precio</p>
                            <p className="mt-1 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
                                {Number(product.precio || 0).toFixed(2)} <span className="text-sm text-zinc-400">{product.moneda}</span>
                            </p>
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                            <Link
                                to={detailPath}
                                className="inline-flex h-11 w-full items-center justify-center rounded-2xl border border-zinc-200 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-[#136191] hover:text-[#136191] sm:w-auto"
                            >
                                Ver detalle
                            </Link>
                            {onToggleCompare ? (
                                <button
                                    type="button"
                                    disabled={compareDisabled}
                                    onClick={() => onToggleCompare(product)}
                                    className={`inline-flex h-11 w-full items-center justify-center rounded-2xl px-4 text-[11px] font-black uppercase tracking-[0.16em] transition-colors sm:w-auto ${
                                        compareDisabled
                                            ? 'cursor-not-allowed border border-zinc-200 bg-zinc-100 text-zinc-400'
                                            : isCompared
                                                ? 'border border-blue-200 bg-blue-50 text-[#136191] hover:border-blue-300'
                                                : 'border border-zinc-200 bg-white text-zinc-700 hover:border-[#136191] hover:text-[#136191]'
                                    }`}
                                >
                                    {isCompared ? 'En comparacion' : 'Comparar'}
                                </button>
                            ) : null}
                            <button
                                type="button"
                                disabled={!canBuy}
                                onClick={onBuy}
                                className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-2xl px-4 text-[11px] font-black uppercase tracking-[0.16em] transition-colors sm:w-auto ${
                                    canBuy
                                        ? 'bg-zinc-900 text-white hover:bg-[#F39200]'
                                        : 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                                }`}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Comprar
                            </button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export const MarketplaceTrustPanel = ({ title, items = [] }) => (
    <div className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
        <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-200 bg-orange-50">
                <ShieldCheck className="h-5 w-5 text-[#F39200]" />
            </div>
            <div>
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Confianza comercial</p>
                <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-900">{title}</h3>
            </div>
        </div>
        <div className="mt-4 space-y-3">
            {items.map((item) => (
                <div key={item} className="rounded-2xl border border-zinc-100 bg-zinc-50 px-4 py-3 text-sm font-medium leading-relaxed text-zinc-600">
                    {item}
                </div>
            ))}
        </div>
    </div>
);

const MarketplaceSkeletonBlock = ({ className = '' }) => (
    <div className={`animate-pulse rounded-2xl bg-zinc-200/80 ${className}`} />
);

export const MarketplaceLoadingState = ({
    eyebrow = 'Cargando',
    title = 'Preparando la vista comercial',
    description = 'Estamos sincronizando la informacion para mostrar una lectura consistente del marketplace clasico.',
    statsCount = 4,
    cardCount = 3,
}) => (
    <div className="space-y-8">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]">
            <div className="bg-[radial-gradient(circle_at_top_left,rgba(243,146,0,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(19,97,145,0.1),transparent_28%),linear-gradient(180deg,#ffffff_0%,#fbfbfc_100%)] px-5 py-6 sm:px-6 sm:py-7 md:px-8 md:py-8">
                <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                    <div className="max-w-4xl space-y-3">
                        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500">
                            {eyebrow}
                        </span>
                        <div className="space-y-2">
                            <h1 className="text-[1.9rem] font-black uppercase tracking-tight text-[#1A1A1A] sm:text-3xl md:text-4xl xl:text-[2.7rem]">
                                {title}
                            </h1>
                            <p className="max-w-3xl text-sm font-medium leading-relaxed text-zinc-600 md:text-[15px]">
                                {description}
                            </p>
                        </div>
                    </div>
                    <div className="grid w-full grid-cols-1 gap-3 sm:grid-cols-2 xl:min-w-[360px] xl:max-w-[420px]">
                        {Array.from({ length: statsCount }).map((_, index) => (
                            <div key={`loading-stat-${index}`} className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <MarketplaceSkeletonBlock className="h-3 w-24" />
                                <MarketplaceSkeletonBlock className="mt-3 h-8 w-20" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
            {Array.from({ length: cardCount }).map((_, index) => (
                <div key={`loading-card-${index}`} className="rounded-[1.75rem] border border-zinc-200 bg-white p-5 shadow-[0_14px_40px_rgba(15,23,42,0.05)]">
                    <MarketplaceSkeletonBlock className="h-3 w-24" />
                    <MarketplaceSkeletonBlock className="mt-4 h-7 w-3/4" />
                    <MarketplaceSkeletonBlock className="mt-4 h-4 w-full" />
                    <MarketplaceSkeletonBlock className="mt-2 h-4 w-5/6" />
                    <div className="mt-6 grid gap-3 sm:grid-cols-2">
                        <MarketplaceSkeletonBlock className="h-20 w-full" />
                        <MarketplaceSkeletonBlock className="h-20 w-full" />
                    </div>
                </div>
            ))}
        </section>
    </div>
);
