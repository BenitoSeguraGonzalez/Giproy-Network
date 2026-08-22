import { useContext, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Eye, GitCompareArrows, Heart, MessageSquare, ShieldCheck, ShoppingCart, Star } from 'lucide-react';

import marketplaceApi from '../api/marketplace';
import { AuthContext } from '../context/AuthContext';
import { appAlert } from '../utils/appDialog';
import { resolveMarketplaceLicenseBanner } from '../utils/marketplaceLicenseBanners';
import { resolveMarketplacePublicProcurementBanner } from '../utils/marketplacePublicProcurementBanners';
import {
    getMarketplaceFavorites,
    isMarketplaceFavorite,
    toggleMarketplaceFavorite,
} from '../utils/marketplaceFavorites';
import {
    getMarketplaceCompare,
    isMarketplaceCompared,
    MARKETPLACE_COMPARE_MAX_ITEMS,
    toggleMarketplaceCompare,
} from '../utils/marketplaceCompare';
import { pushMarketplaceRecentlyViewed } from '../utils/marketplaceRecentlyViewed';
import { getMarketplaceSellerDisplayName } from '../utils/marketplaceSeller';
import { isMarketplaceSystemProduct, MARKETPLACE_TYPE_LABELS } from '../utils/marketplaceProductMeta';
import {
    MarketplaceActionTile,
    MarketplaceEmptyState,
    MarketplaceHero,
    MarketplaceQuickStat,
    MarketplaceSectionCard,
    MarketplaceShell,
    MarketplaceTrustPanel,
    MarketplaceTypeBadge,
} from '../components/marketplace/MarketplaceVisualSystem';
import AnimatedSelect from '../components/ui/AnimatedSelect';

const scrollToSection = (sectionId) => {
    if (typeof document === 'undefined') return;
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const MarketplaceProductDetail = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [submitting, setSubmitting] = useState(false);
    const [reviewSubmitting, setReviewSubmitting] = useState(false);
    const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
    const [favoriteIds, setFavoriteIds] = useState([]);
    const [compareIds, setCompareIds] = useState([]);
    const canBuy = (user?.marketplace_permissions || []).includes('marketplace.buy');
    const isSuperAdmin = (user?.rol || '').toLowerCase() === 'superadministrador';
    const profileComplete = isSuperAdmin || Boolean(user?.marketplace_profile_complete);
    const canBuyNow = canBuy && profileComplete;
    const canReview = (user?.marketplace_permissions || []).includes('reviews.create') && profileComplete;
    const hasOwnReview = reviews.some((review) => review.buyer_user_id === user?.id);
    const isSystemProduct = isMarketplaceSystemProduct(product);
    const productHeroImage = product?.product_type === 'licencia'
        ? resolveMarketplaceLicenseBanner(product)
        : product?.product_type === 'portal_compras_publicas'
            ? resolveMarketplacePublicProcurementBanner(product)
            : null;
    const productIsFavorite = isMarketplaceFavorite(favoriteIds, product?.id);
    const productIsCompared = isMarketplaceCompared(compareIds, product?.id);

    useEffect(() => {
        setFavoriteIds(getMarketplaceFavorites(user?.id));
        setCompareIds(getMarketplaceCompare(user?.id));
    }, [user?.id]);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [{ data: productData }, { data: reviewsData }] = await Promise.all([
                    marketplaceApi.getProductById(productId),
                    marketplaceApi.getProductReviews(productId),
                ]);
                if (!cancelled) {
                    setProduct(productData);
                    setReviews(reviewsData || []);
                    pushMarketplaceRecentlyViewed(user?.id, productData.id);
                }
            } catch (error) {
                globalThis.reportClientError?.('Error cargando producto:', error);
                if (!cancelled) {
                    setProduct(null);
                    setReviews([]);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [productId, user?.id]);

    const previewItems = useMemo(() => {
        if (!product?.vista_previa) return [];
        return Object.entries(product.vista_previa).filter(([, value]) => value !== null && value !== undefined && value !== '');
    }, [product]);
    const detailFocus = useMemo(() => {
        if (isSystemProduct) {
            return {
                label: 'Oferta oficial',
                title: 'Producto respaldado por Sistema',
                description: 'La ficha está centrada en una oferta oficial de GiProy, lista para compra inmediata y adopción directa en tu entorno.',
                actionLabel: 'Ir a compra',
                onAction: () => scrollToSection('product-buy-panel'),
            };
        }
        if (Number(product?.rating_promedio || 0) >= 4) {
            return {
                label: 'Alta valoración',
                title: 'Producto bien recibido por compradores',
                description: 'La valoración y el historial comercial sugieren una opción madura dentro del marketplace multi vendedor.',
                actionLabel: 'Ver reseñas',
                onAction: () => scrollToSection('product-reviews-section'),
            };
        }
        return {
            label: 'Evaluación comercial',
            title: 'Revisa alcance, vista previa y reseñas antes de comprar',
            description: 'Esta ficha reúne todo el contexto útil para decidir si el producto encaja con tu operación antes de llevarlo al pedido.',
            actionLabel: 'Ver descripción',
            onAction: () => scrollToSection('product-main-section'),
        };
    }, [isSystemProduct, product?.rating_promedio]);

    const renderDetailEmptyState = ({
        eyebrow,
        title,
        description,
        primaryActionLabel,
        onPrimaryAction,
        secondaryActionLabel,
        onSecondaryAction,
    }) => (
        <MarketplaceEmptyState
            eyebrow={eyebrow}
            title={title}
            description={description}
            primaryActionLabel={primaryActionLabel}
            onPrimaryAction={onPrimaryAction}
            secondaryActionLabel={secondaryActionLabel}
            onSecondaryAction={onSecondaryAction}
        />
    );

    const handleBuyNow = async () => {
        if (!canBuyNow || !product) return;
        try {
            setSubmitting(true);
            const payload = { product_ids: [product.id] };
            if (product.source_type === 'apu') {
                payload.apu_target_base_id = null;
            }
            const { data } = await marketplaceApi.checkout(payload);
            navigate(`/pedido/${data.id}`);
        } catch (error) {
            globalThis.reportClientError?.('Error en checkout:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo completar la compra.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleCreateReview = async () => {
        if (!canReview || !product || hasOwnReview) return;
        try {
            setReviewSubmitting(true);
            await marketplaceApi.createProductReview(product.id, reviewForm);
            const [{ data: productData }, { data: reviewsData }] = await Promise.all([
                marketplaceApi.getProductById(product.id),
                marketplaceApi.getProductReviews(product.id),
            ]);
            setProduct(productData);
            setReviews(reviewsData || []);
            setReviewForm({ rating: 5, comment: '' });
        } catch (error) {
            globalThis.reportClientError?.('Error creando reseña marketplace:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo registrar la reseña.');
        } finally {
            setReviewSubmitting(false);
        }
    };

    const handleToggleFavorite = () => {
        if (!product) return;
        setFavoriteIds(toggleMarketplaceFavorite(user?.id, product.id));
    };

    const handleToggleCompare = () => {
        if (!product) return;
        setCompareIds(toggleMarketplaceCompare(user?.id, product.id));
    };

    if (!product) {
        return (
            <MarketplaceShell>
                <div className="rounded-[2rem] border border-zinc-200 bg-white p-12 text-center text-sm font-black uppercase tracking-[0.18em] text-zinc-400">
                    Cargando producto
                </div>
            </MarketplaceShell>
        );
    }

    return (
        <MarketplaceShell>
            <div className="space-y-8">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/marketplace')} className="rounded-2xl border border-zinc-200 bg-white p-3 text-zinc-500 transition-colors hover:border-[#136191] hover:text-[#136191]">
                        <ArrowLeft className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={handleToggleCompare}
                        className={`rounded-2xl border p-3 transition-colors ${
                            productIsCompared
                                ? 'border-blue-200 bg-blue-50 text-[#136191] hover:border-blue-300'
                                : 'border-zinc-200 bg-white text-zinc-500 hover:border-blue-200 hover:text-[#136191]'
                        }`}
                    >
                        <GitCompareArrows className="h-5 w-5" />
                    </button>
                    <button
                        type="button"
                        onClick={handleToggleFavorite}
                        className={`rounded-2xl border p-3 transition-colors ${
                            productIsFavorite
                                ? 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300'
                                : 'border-zinc-200 bg-white text-zinc-500 hover:border-rose-200 hover:text-rose-500'
                        }`}
                    >
                        <Heart className={`h-5 w-5 ${productIsFavorite ? 'fill-current' : ''}`} />
                    </button>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#F39200]">Tienda GiProy</p>
                        <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A]">{product.titulo}</h1>
                    </div>
                </div>

                <MarketplaceHero
                    eyebrow={isSystemProduct ? 'Oferta oficial' : 'Detalle de producto'}
                    title={product.titulo}
                    description={product.resumen || 'Ficha comercial lista para explorar, evaluar y convertir en compra dentro del marketplace clasico.'}
                    accent={isSystemProduct ? 'orange' : 'blue'}
                    backgroundImage={productHeroImage}
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <MarketplaceQuickStat label="Precio" value={`${Number(product.precio || 0).toFixed(2)} ${product.moneda}`} tone="orange" />
                        <MarketplaceQuickStat label="Ventas" value={product.ventas_count || 0} tone="blue" />
                        <MarketplaceQuickStat label="Rating" value={Number(product.rating_promedio || 0).toFixed(1)} />
                        <MarketplaceQuickStat label="Preview" value={previewItems.length} />
                    </div>
                </MarketplaceHero>

                <section className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.8fr)]">
                    <div className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                        <div className="flex flex-wrap gap-2">
                            <MarketplaceTypeBadge type={product.product_type} />
                            {product.category?.nombre ? (
                                <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">
                                    {product.category.nombre}
                                </span>
                            ) : null}
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                <Star className="h-3.5 w-3.5 text-amber-500" />
                                {Number(product.rating_promedio || 0).toFixed(1)}
                            </span>
                            <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                {product.ventas_count || 0} ventas
                            </span>
                        </div>

                        <div className="mt-6 grid gap-4 md:grid-cols-4">
                            <MarketplaceActionTile
                                eyebrow="Descripcion"
                                title="Alcance comercial"
                                description="Resumen completo del producto y de lo que realmente entrega."
                                onClick={() => scrollToSection('product-main-section')}
                            />
                            <MarketplaceActionTile
                                eyebrow="Vista previa"
                                title={`${previewItems.length} campos visibles`}
                                description="Informacion previa para decidir mejor antes de comprar."
                                onClick={() => scrollToSection('product-preview-section')}
                                tone="cool"
                            />
                            <MarketplaceActionTile
                                eyebrow="Reseñas"
                                title={`${reviews.length} opiniones`}
                                description="Percepcion de compradores y confianza comercial."
                                onClick={() => scrollToSection('product-reviews-section')}
                            />
                            <MarketplaceActionTile
                                eyebrow="Compra"
                                title={canBuyNow ? 'Ir a compra inmediata' : 'Revisar requisitos'}
                                description="Panel lateral de compra, perfil y condiciones."
                                onClick={() => scrollToSection('product-buy-panel')}
                                tone="warm"
                            />
                            <MarketplaceActionTile
                                eyebrow="Favoritos"
                                title={productIsFavorite ? 'Guardado para despues' : 'Guardar para despues'}
                                description={productIsFavorite ? 'Este producto ya forma parte de tu bandeja corta de seguimiento comercial.' : 'Marca esta ficha para retomarla rapido desde la portada de Tienda.'}
                                onClick={handleToggleFavorite}
                            />
                            <MarketplaceActionTile
                                eyebrow="Comparación"
                                title={productIsCompared ? 'Incluido en comparación' : 'Añadir a comparación'}
                                description={productIsCompared ? 'Este producto ya forma parte de tu mesa comparativa de Tienda.' : `Puedes comparar hasta ${MARKETPLACE_COMPARE_MAX_ITEMS} productos antes de decidir compra.`}
                                onClick={handleToggleCompare}
                                tone="cool"
                            />
                        </div>
                    </div>

                    <MarketplaceSectionCard
                        eyebrow={detailFocus.label}
                        title={detailFocus.title}
                        description={detailFocus.description}
                        actionLabel={detailFocus.actionLabel}
                        onAction={detailFocus.onAction}
                    >
                        <div className="grid gap-3">
                            <div className="rounded-[1.4rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Propietario</p>
                                <p className="mt-2 text-sm font-black text-zinc-700">{getMarketplaceSellerDisplayName(product.seller)}</p>
                            </div>
                            <div className="rounded-[1.4rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Tipo de oferta</p>
                                <p className="mt-2 text-sm font-black text-zinc-700">{MARKETPLACE_TYPE_LABELS[product.product_type] || product.product_type}</p>
                            </div>
                            <div className={`rounded-[1.4rem] border px-4 py-3 ${
                                productIsFavorite
                                    ? 'border-rose-200 bg-rose-50'
                                    : 'border-zinc-100 bg-zinc-50'
                            }`}>
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Seguimiento</p>
                                <p className={`mt-2 text-sm font-black ${productIsFavorite ? 'text-rose-700' : 'text-zinc-700'}`}>
                                    {productIsFavorite ? 'Guardado en favoritos' : 'Aun no guardado'}
                                </p>
                            </div>
                            <div className={`rounded-[1.4rem] border px-4 py-3 ${
                                productIsCompared
                                    ? 'border-blue-200 bg-blue-50'
                                    : 'border-zinc-100 bg-zinc-50'
                            }`}>
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Comparación</p>
                                <p className={`mt-2 text-sm font-black ${productIsCompared ? 'text-[#136191]' : 'text-zinc-700'}`}>
                                    {productIsCompared ? 'Activo en mesa comparativa' : 'Aun no comparado'}
                                </p>
                            </div>
                        </div>
                    </MarketplaceSectionCard>
                </section>

                <div className="grid gap-8 xl:grid-cols-[minmax(0,1.45fr)_420px]">
                    <section id="product-main-section" className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                        {isSystemProduct && (
                            <div className="mb-6 rounded-[1.5rem] border border-orange-200 bg-[linear-gradient(145deg,#fff7ed_0%,#ffffff_100%)] p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-200 bg-white">
                                        <ShieldCheck className="h-5 w-5 text-[#F39200]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200]">Oferta oficial</p>
                                        <p className="text-sm font-semibold leading-relaxed text-zinc-700">
                                            Este producto pertenece al catálogo oficial de <span className="font-black uppercase">Sistema</span> y forma parte de la oferta comercial directa de GiProy.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="flex flex-wrap items-center gap-3">
                            <MarketplaceTypeBadge type={product.product_type} />
                            {product.category?.nombre && (
                                <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">
                                    {product.category.nombre}
                                </span>
                            )}
                            <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                <Star className="h-3.5 w-3.5 text-amber-500" />
                                {Number(product.rating_promedio || 0).toFixed(1)}
                            </span>
                            <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                {product.ventas_count || 0} ventas
                            </span>
                        </div>

                        <div className="mt-6 space-y-4">
                            <p className="text-base font-medium leading-relaxed text-zinc-600">
                                {product.descripcion || product.resumen || 'Producto comercial disponible en marketplace.'}
                            </p>
                        </div>

                        <div className="mt-8 grid gap-6 md:grid-cols-2">
                            <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Qué incluye</p>
                                <p className="mt-3 text-sm font-semibold leading-relaxed text-emerald-900">
                                    {product.incluye || `Incluye 1 ${MARKETPLACE_TYPE_LABELS[product.product_type] || 'producto'} listo para clonar y usar.`}
                                </p>
                            </div>
                            <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-5">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-rose-700">Qué no incluye</p>
                                <p className="mt-3 text-sm font-semibold leading-relaxed text-rose-900">
                                    {product.no_incluye || 'No incluye personalización manual ni compartición directa del recurso original.'}
                                </p>
                            </div>
                        </div>

                        <div id="product-preview-section" className="mt-8 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
                            <div className="flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-200 bg-white">
                                    <Eye className="h-5 w-5 text-[#136191]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Vista previa</p>
                                    <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-900">Campos visibles antes de comprar</h2>
                                </div>
                            </div>
                            {previewItems.length > 0 ? (
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    {previewItems.map(([key, value]) => (
                                        <div key={key} className="rounded-2xl border border-white bg-white px-4 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{key}</p>
                                            <p className="mt-1 text-sm font-black text-zinc-700">{String(value)}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="mt-4">
                                    {renderDetailEmptyState({
                                        eyebrow: 'Vista previa no disponible',
                                        title: 'Esta ficha todavía no expone campos previos navegables',
                                        description: 'Puedes decidir la compra apoyándote en el alcance, el resumen comercial y las reseñas disponibles para este producto.',
                                        primaryActionLabel: 'Ver descripción',
                                        onPrimaryAction: () => scrollToSection('product-main-section'),
                                        secondaryActionLabel: 'Ir a compra',
                                        onSecondaryAction: () => scrollToSection('product-buy-panel'),
                                    })}
                                </div>
                            )}
                        </div>

                        <div id="product-reviews-section" className="mt-8 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-5">
                            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-orange-200 bg-white">
                                        <MessageSquare className="h-5 w-5 text-[#F39200]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Reseñas</p>
                                        <h2 className="mt-1 text-xl font-black tracking-tight text-zinc-900">
                                            Opiniones de compradores
                                        </h2>
                                    </div>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                    <Star className="h-3.5 w-3.5 text-amber-500" />
                                    {Number(product.rating_promedio || 0).toFixed(1)} | {reviews.length} reseñas
                                </div>
                            </div>

                            <div className="mt-5 space-y-3">
                                {reviews.length === 0 ? (
                                    renderDetailEmptyState({
                                        eyebrow: 'Sin reseñas',
                                        title: 'Todavía no hay opiniones publicadas para este producto',
                                        description: canReview
                                            ? 'Si ya compraste este recurso, puedes convertirte en la primera referencia visible para otros compradores.'
                                            : 'La decisión de compra deberá apoyarse por ahora en el alcance, la oferta comercial y la confianza en el vendedor.',
                                        primaryActionLabel: canReview && !hasOwnReview ? 'Dejar reseña' : 'Revisar compra',
                                        onPrimaryAction: canReview && !hasOwnReview
                                            ? () => scrollToSection('product-reviews-section')
                                            : () => scrollToSection('product-buy-panel'),
                                        secondaryActionLabel: 'Ver precio',
                                        onSecondaryAction: () => scrollToSection('product-buy-panel'),
                                    })
                                ) : (
                                    reviews.map((review) => (
                                        <div key={review.id} className="rounded-2xl border border-white bg-white p-4">
                                            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                                                <div>
                                                    <p className="text-sm font-black text-zinc-900">{review.buyer_name || 'Comprador verificado'}</p>
                                                    <p className="text-[11px] font-semibold text-zinc-500">
                                                        {review.created_at ? new Date(review.created_at).toLocaleDateString() : 'Fecha no disponible'}
                                                    </p>
                                                </div>
                                                <div className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                                                    <Star className="h-3.5 w-3.5 fill-current" />
                                                    {review.rating}/5
                                                </div>
                                            </div>
                                            {review.comment && (
                                                <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">{review.comment}</p>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Tu reseña</p>
                                {!canReview ? (
                                    <p className="mt-3 text-sm font-semibold text-zinc-500">
                                        Debes tener perfil completo y haber comprado el producto para poder reseñarlo.
                                    </p>
                                ) : hasOwnReview ? (
                                    <p className="mt-3 text-sm font-semibold text-emerald-700">
                                        Ya registraste una reseña para este producto.
                                    </p>
                                ) : (
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Calificación</label>
                                            <AnimatedSelect
                                                value={reviewForm.rating}
                                                onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
                                                className="mt-2 h-11 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 text-sm font-black uppercase tracking-[0.14em] text-zinc-700 outline-none"
                                            >
                                                {[5, 4, 3, 2, 1].map((value) => (
                                                    <option key={value} value={value}>{value} estrellas</option>
                                                ))}
                                            </AnimatedSelect>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Comentario</label>
                                            <textarea
                                                value={reviewForm.comment}
                                                onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
                                                rows={4}
                                                placeholder="Describe tu experiencia con este recurso."
                                                className="mt-2 w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-700 outline-none transition-colors focus:border-[#F39200]"
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleCreateReview}
                                            disabled={reviewSubmitting}
                                            className={`inline-flex h-11 items-center justify-center rounded-2xl px-4 text-[11px] font-black uppercase tracking-[0.16em] transition-colors ${
                                                reviewSubmitting
                                                    ? 'cursor-wait bg-zinc-100 text-zinc-400'
                                                    : 'bg-zinc-900 text-white hover:bg-[#F39200]'
                                            }`}
                                        >
                                            {reviewSubmitting ? 'Publicando reseña' : 'Publicar reseña'}
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>

                    <aside id="product-buy-panel" className="space-y-5">
                        <section className="sticky top-24 rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                            <div className="space-y-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Precio</p>
                                <p className="text-4xl font-black tracking-tight text-[#1A1A1A]">
                                    {Number(product.precio || 0).toFixed(2)} <span className="text-base text-zinc-400">{product.moneda}</span>
                                </p>
                                <div className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Propietario</p>
                                    <p className="mt-1 text-sm font-black text-zinc-700">{getMarketplaceSellerDisplayName(product.seller)}</p>
                                </div>
                                <div className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Entrega</p>
                                    <p className="mt-1 text-sm font-black text-zinc-700">Clonación trazable dentro de tu entorno</p>
                                </div>
                                {isSystemProduct && (
                                    <div className="rounded-[1.5rem] border border-orange-200 bg-orange-50 p-4 text-sm font-semibold leading-relaxed text-[#A55A00]">
                                        Publicación oficial de GiProy lista para compra inmediata dentro del catálogo `Sistema`.
                                    </div>
                                )}
                                <button
                                    type="button"
                                    disabled={!canBuyNow || submitting}
                                    onClick={handleBuyNow}
                                    className={`flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[11px] font-black uppercase tracking-[0.18em] transition-colors ${
                                        canBuyNow && !submitting
                                            ? 'bg-zinc-900 text-white hover:bg-[#F39200]'
                                            : 'cursor-not-allowed bg-zinc-100 text-zinc-400'
                                    }`}
                                >
                                    <ShoppingCart className="h-4 w-4" />
                                    {submitting ? 'Procesando compra' : 'Comprar ahora'}
                                </button>
                                {!canBuy && (
                                    <p className="text-xs font-bold leading-relaxed text-zinc-500">
                                        Solo los administradores de empresa y la superadministración pueden comprar.
                                    </p>
                                )}
                                {canBuy && !profileComplete && (
                                    <div className="space-y-3 rounded-[1.25rem] border border-red-200 bg-red-50 p-4">
                                        <p className="text-xs font-bold leading-relaxed text-red-600">
                                            Completa tu perfil en Ajustes &gt; Personal antes de comprar. Faltan: {(user?.marketplace_profile_missing_labels || []).join(', ')}.
                                        </p>
                                        <Link
                                            to="/settings?tab=usuarios&edit_user=me"
                                            className="inline-flex h-10 items-center rounded-2xl border border-red-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-red-700 transition-colors hover:border-red-400"
                                        >
                                            Completar perfil
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </section>

                        <MarketplaceTrustPanel
                            title="Compra segura y útil"
                            items={[
                                'El producto se clona en tu sistema y queda identificado con su origen comercial.',
                                'La ficha concentra señales de confianza: ventas, reseñas, propietario y tipo de oferta.',
                                'La lectura pública se mantiene en la capa clásica, sin activar ni mostrar experiencia BIM.',
                            ]}
                        />

                        <div className="grid gap-3">
                            <MarketplaceActionTile
                                eyebrow="Compra"
                                title="Ir al panel de compra"
                                description="Retoma la decisión comercial o finaliza la orden."
                                onClick={() => scrollToSection('product-buy-panel')}
                                tone="warm"
                            />
                            <MarketplaceActionTile
                                eyebrow="Vista previa"
                                title="Ver campos visibles"
                                description="Comprueba de nuevo la información previa antes de comprar."
                                onClick={() => scrollToSection('product-preview-section')}
                                tone="cool"
                            />
                            <MarketplaceActionTile
                                eyebrow="Reseñas"
                                title="Revisar opiniones"
                                description="Valida confianza y experiencia de otros compradores."
                                onClick={() => scrollToSection('product-reviews-section')}
                            />
                        </div>
                    </aside>
                </div>
            </div>
        </MarketplaceShell>
    );
};

export default MarketplaceProductDetail;