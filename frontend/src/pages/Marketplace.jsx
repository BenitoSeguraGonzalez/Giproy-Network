import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, ChevronDown, ChevronRight, CircleAlert, CreditCard, Eye, Play, ShoppingBag, ShoppingCart, Store } from 'lucide-react';

import marketplaceApi from '../api/marketplace';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import ClearSearchField from '../components/ui/ClearSearchField';
import MotionScrollbar from '../components/ui/MotionScrollbar';
import { AuthContext } from '../context/AuthContext';
import { appAlert, appConfirm } from '../utils/appDialog';
import { resolveMarketplaceLicenseBanner, resolveMarketplaceLicenseOfferMeta } from '../utils/marketplaceLicenseBanners';
import { resolveMarketplacePublicProcurementBanner } from '../utils/marketplacePublicProcurementBanners';
import { getMarketplaceRecentlyViewed, pushMarketplaceRecentlyViewed } from '../utils/marketplaceRecentlyViewed';
import { getMarketplaceSellerDisplayName } from '../utils/marketplaceSeller';
import { normalizeSearchToken } from '../utils/normalizeSearch';
import AnimatedSelect from '../components/ui/AnimatedSelect';

const INITIAL_RENDER_COUNT = 12;
const RENDER_CHUNK_SIZE = 12;
const PRECACHE_BUFFER_SIZE = 12;
const FULL_RENDER_THRESHOLD = 24;
const CART_ABANDON_MS = 4 * 60 * 60 * 1000;
const CART_NOTICE_TIMEOUT_MS = 4200;
const PAYPHONE_BOX_SCRIPT_URL = 'https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.js';
const PAYPHONE_BOX_STYLES_URL = 'https://cdn.payphonetodoesposible.com/box/v1.1/payphone-payment-box.css';
const PAYPAL_SDK_BASE_URL = 'https://www.paypal.com/sdk/js';

const SORT_OPTIONS = {
    default: 'Orden predeterminado',
    sales: 'Mas vendidos',
    rating: 'Mejor valorados',
    price_asc: 'Precio: menor a mayor',
    price_desc: 'Precio: mayor a menor',
    title: 'Orden alfabetico',
};

const COVER_THEMES = {
    licencia: 'from-[#7a351d] via-[#d96f47] to-[#f2a06d]',
    addon: 'from-[#8d3a18] via-[#f17d40] to-[#ffb27a]',
    adicional: 'from-[#6b6b6b] via-[#9c7f73] to-[#d3b3a3]',
    portal_compras_publicas: 'from-[#16354d] via-[#1f6b8f] to-[#71c0db]',
    base_maestra: 'from-[#4b5a1d] via-[#c89b2c] to-[#f1cb6d]',
    apu: 'from-[#0d5072] via-[#2174a6] to-[#6fc3f1]',
    proyecto: 'from-[#1e2429] via-[#545f68] to-[#aeb7bf]',
};

const PRODUCT_TYPE_LABELS = {
    licencia: 'Licencia',
    addon: 'Actualizacion',
    adicional: 'Adicional',
    portal_compras_publicas: 'Portal compras publicas',
    base_maestra: 'Base maestra',
    apu: 'APU',
    proyecto: 'Proyecto',
};

let payphoneSdkPromise = null;
let paypalSdkPromise = null;

const ensurePayPhoneSdk = () => {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('PayPhone solo está disponible en entorno navegador.'));
    }
    if (window.PPaymentButtonBox) {
        return Promise.resolve(window.PPaymentButtonBox);
    }
    if (payphoneSdkPromise) {
        return payphoneSdkPromise;
    }

    payphoneSdkPromise = new Promise((resolve, reject) => {
        if (!document.querySelector(`link[href="${PAYPHONE_BOX_STYLES_URL}"]`)) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = PAYPHONE_BOX_STYLES_URL;
            document.head.appendChild(link);
        }

        const existingScript = document.querySelector(`script[src="${PAYPHONE_BOX_SCRIPT_URL}"]`);
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.PPaymentButtonBox), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK de PayPhone.')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.type = 'module';
        script.src = PAYPHONE_BOX_SCRIPT_URL;
        script.onload = () => resolve(window.PPaymentButtonBox);
        script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPhone.'));
        document.head.appendChild(script);
    });

    return payphoneSdkPromise;
};

const ensurePayPalSdk = ({ clientId, currency = 'USD', intent = 'capture', components = 'buttons' }) => {
    if (typeof window === 'undefined') {
        return Promise.reject(new Error('PayPal solo está disponible en entorno navegador.'));
    }
    if (window.paypal?.Buttons) {
        return Promise.resolve(window.paypal);
    }
    if (paypalSdkPromise) {
        return paypalSdkPromise;
    }

    const sdkUrl = `${PAYPAL_SDK_BASE_URL}?client-id=${encodeURIComponent(clientId)}&currency=${encodeURIComponent(currency)}&intent=${encodeURIComponent(intent)}&components=${encodeURIComponent(components)}`;
    paypalSdkPromise = new Promise((resolve, reject) => {
        const existingScript = document.querySelector(`script[src="${sdkUrl}"]`);
        if (existingScript) {
            existingScript.addEventListener('load', () => resolve(window.paypal), { once: true });
            existingScript.addEventListener('error', () => reject(new Error('No se pudo cargar el SDK de PayPal.')), { once: true });
            return;
        }

        const script = document.createElement('script');
        script.src = sdkUrl;
        script.async = true;
        script.onload = () => resolve(window.paypal);
        script.onerror = () => reject(new Error('No se pudo cargar el SDK de PayPal.'));
        document.head.appendChild(script);
    });

    return paypalSdkPromise;
};

const isSystemProduct = (product) =>
    (product?.seller?.rol || '').toLowerCase() === 'superadministrador';

const formatCurrency = (amount, currency = 'USD') => {
    const value = Number(amount || 0);
    try {
        return new Intl.NumberFormat('es-EC', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    } catch {
        return `${value.toFixed(2)} ${currency}`;
    }
};

const formatDisplayDate = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return null;
    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return raw;
    return new Intl.DateTimeFormat('es-EC', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(parsed);
};

const parseDiscountPercent = (value) => {
    const raw = String(value || '').trim();
    if (!raw) return 0;
    const normalized = raw.replace('%', '').replace(',', '.');
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric) || numeric <= 0) return 0;
    return Math.min(numeric, 100);
};

const resolveCommercialPricing = (product, commonMeta) => {
    const originalPrice = Number(product?.precio || commonMeta?.precio_con_iva || 0);
    const discountPercent = parseDiscountPercent(commonMeta?.descuento_promocion);
    if (!discountPercent) {
        return {
            hasDiscount: false,
            originalPrice,
            finalPrice: originalPrice,
            discountPercent: 0,
        };
    }
    const finalPrice = Math.max(0, originalPrice * (1 - (discountPercent / 100)));
    return {
        hasDiscount: true,
        originalPrice,
        finalPrice,
        discountPercent,
    };
};

const resolvePriceCap = (products) => {
    const maxPrice = Math.max(...(products || []).map((product) => Number(product.precio || 0)), 0);
    if (maxPrice <= 0) return 200;
    return Math.ceil(maxPrice / 10) * 10;
};
const PRICE_STEP = 5;

const normalizeCompanyName = (value) => normalizeSearchToken(value || '');
const resolveCartStorageKey = (userId) => `giproy_marketplace_cart_${userId || 'anon'}`;
const resolveCartReminderSessionKey = (userId) => `giproy_marketplace_cart_hint_${userId || 'anon'}`;
const coerceTimestamp = (value) => {
    const timestamp = Number(value || 0);
    return Number.isFinite(timestamp) && timestamp > 0 ? timestamp : null;
};
const resolveSalesConfig = (product) => {
    const raw = product?.vista_previa?.sales_config || {};
    const saleMode = raw.sale_mode === 'pack' ? 'pack' : 'unit';
    const minQuantity = Math.max(1, Number(raw.min_quantity || 1));
    const quantityStep = Math.max(1, Number(raw.quantity_step || 1));
    const defaultQuantity = Math.max(minQuantity, Number(raw.default_quantity || minQuantity));
    const maxQuantity = raw.max_quantity ? Math.max(minQuantity, Number(raw.max_quantity)) : null;

    if (saleMode === 'unit') {
        return {
            saleMode: 'unit',
            allowsMultiple: false,
            minQuantity: 1,
            defaultQuantity: 1,
            quantityStep: 1,
            maxQuantity: 1,
        };
    }

    return {
        saleMode: 'pack',
        allowsMultiple: true,
        minQuantity,
        defaultQuantity,
        quantityStep,
        maxQuantity,
    };
};
const normalizeCartQuantity = (product, quantity) => {
    const salesConfig = resolveSalesConfig(product);
    if (!salesConfig.allowsMultiple) return 1;

    const nextQuantity = Math.max(salesConfig.minQuantity, Number(quantity || salesConfig.defaultQuantity));
    const normalizedDelta = Math.max(0, nextQuantity - salesConfig.minQuantity);
    const steppedQuantity = salesConfig.minQuantity + (Math.ceil(normalizedDelta / salesConfig.quantityStep) * salesConfig.quantityStep);
    if (salesConfig.maxQuantity) {
        return Math.min(salesConfig.maxQuantity, steppedQuantity);
    }
    return steppedQuantity;
};
const loadStoredCart = (userId) => {
    try {
        const raw = localStorage.getItem(resolveCartStorageKey(userId));
        const parsed = JSON.parse(raw || '[]');
        const parsedLines = Array.isArray(parsed)
            ? parsed
            : (Array.isArray(parsed?.lines) ? parsed.lines : []);
        const lastActivityAt = coerceTimestamp(parsed?.lastActivityAt) || Date.now();

        if (!Array.isArray(parsedLines)) {
            return { lines: [], lastActivityAt: null, abandoned: false };
        }

        const merged = new Map();
        parsedLines.forEach((item) => {
            if (typeof item === 'number' || typeof item === 'string') {
                const productId = Number(item);
                if (productId) merged.set(productId, { productId, quantity: 1 });
                return;
            }
            if (!item || typeof item !== 'object') return;
            const productId = Number(item.productId || item.product_id);
            const quantity = Math.max(1, Number(item.quantity || 1));
            if (!productId) return;
            const current = merged.get(productId);
            merged.set(productId, {
                productId,
                quantity: (current?.quantity || 0) + quantity,
            });
        });

        const lines = Array.from(merged.values());
        if (!lines.length) {
            return { lines: [], lastActivityAt, abandoned: false };
        }

        if ((Date.now() - lastActivityAt) > CART_ABANDON_MS) {
            return { lines: [], lastActivityAt: null, abandoned: true };
        }

        return { lines, lastActivityAt, abandoned: false };
    } catch {
        return { lines: [], lastActivityAt: null, abandoned: false };
    }
};
const persistStoredCart = (userId, cartLines, lastActivityAt = null) => {
    const normalizedLines = Array.isArray(cartLines)
        ? cartLines
            .map((item) => ({
                productId: Number(item?.productId),
                quantity: Math.max(1, Number(item?.quantity || 1)),
            }))
            .filter((item) => item.productId)
        : [];

    if (!normalizedLines.length) {
        removeStoredCart(userId);
        return;
    }

    localStorage.setItem(resolveCartStorageKey(userId), JSON.stringify({
        lines: normalizedLines,
        lastActivityAt: coerceTimestamp(lastActivityAt) || Date.now(),
    }));
};
const removeStoredCart = (userId) => {
    localStorage.removeItem(resolveCartStorageKey(userId));
};

const resolveBillingStatus = (user, activeCompany = null) => {
    const empresa = activeCompany || user?.empresa || {};
    const missing = [];
    if (!user?.nombre_completo) missing.push('Nombre completo del comprador');
    if (!user?.email) missing.push('Email del comprador');
    if (!empresa?.nombre) missing.push('Nombre de la empresa');
    if (!empresa?.ruc) missing.push('RUC / identificación fiscal');
    if (!empresa?.direccion) missing.push('Dirección fiscal');
    if (!empresa?.email) missing.push('Email de facturación');
    if (!empresa?.telefono) missing.push('Teléfono de contacto');

    return {
        isComplete: missing.length === 0,
        missing,
        companyName: empresa?.nombre || user?.empresa_nombre || null,
    };
};

const resolveMarketplaceCoverImage = (product) => {
    const preview = product?.vista_previa || {};
    const productMeta = preview?.product_meta || {};
    const portalMeta = preview?.portal_meta || {};
    const licenseBanner = product?.product_type === 'licencia'
        ? resolveMarketplaceLicenseBanner(product)
        : null;
    const publicProcurementBanner = product?.product_type === 'portal_compras_publicas'
        ? resolveMarketplacePublicProcurementBanner(product)
        : null;

    return (
        product?.image_relevante_url
        || product?.cover_image_url
        || preview?.imagen_relevante_url
        || preview?.cover_image_url
        || preview?.hero_image_url
        || productMeta?.imagen_relevante_url
        || productMeta?.cover_image_url
        || productMeta?.hero_image_url
        || productMeta?.imagen_portada
        || productMeta?.imagen_portada_url
        || portalMeta?.imagen_relevante_url
        || portalMeta?.cover_image_url
        || portalMeta?.hero_image_url
        || licenseBanner
        || publicProcurementBanner
        || null
    );
};

const resolveMarketplaceProductViewModel = (product) => {
    const preview = product?.vista_previa || {};
    const productMeta = preview?.product_meta || {};
    const portalMeta = preview?.portal_meta || {};
    const commonMeta = {
        categoryLabel: product?.category?.nombre || PRODUCT_TYPE_LABELS[product?.product_type] || 'Producto',
        title: product?.titulo || 'Producto sin título',
        ownerLabel: getMarketplaceSellerDisplayName(product?.seller) || 'Sistema',
        shortDescription: productMeta?.descripcion_corta || product?.resumen || '',
        longDescription: productMeta?.descripcion_larga || product?.descripcion || '',
        fullDescription: productMeta?.descripcion_completa || '',
        publicationStart: productMeta?.fecha_inicio_publicacion || productMeta?.fecha_publicacion || '',
        publicationEnd: productMeta?.fecha_fin_publicacion || productMeta?.fecha_retirada || '',
        discountRaw: productMeta?.descuento_promocion || '',
        imageUrl: resolveMarketplaceCoverImage(product),
    };
    const pricing = resolveCommercialPricing(product, productMeta);
    const licitacionPrice = product?.product_type === 'portal_compras_publicas'
        ? Number(portalMeta?.precio_licitacion || 0)
        : null;
    return {
        id: product?.id,
        type: product?.product_type,
        typeLabel: PRODUCT_TYPE_LABELS[product?.product_type] || 'Producto',
        currency: product?.moneda || 'USD',
        commonMeta,
        pricing,
        licitacionPrice: Number.isFinite(licitacionPrice) && licitacionPrice > 0 ? licitacionPrice : null,
        code: productMeta?.codigo || portalMeta?.codigo_licitacion || portalMeta?.import_source?.reference || '',
        portalMeta,
        salesConfig: resolveSalesConfig(product),
        raw: product,
    };
};

const resolveExclusiveMetaEntries = (viewModel) => {
    if (viewModel.type === 'licencia') {
        const offer = resolveMarketplaceLicenseOfferMeta(viewModel.raw);
        return [
            { label: 'Tipo de producto', value: viewModel.typeLabel },
            { label: 'Plan SaaS', value: offer.licenseName || viewModel.commonMeta.title || null },
            {
                label: 'Ciclo comercial',
                value: offer.billingCycle === 'annual'
                    ? 'Anual'
                    : offer.durationMonths > 1
                        ? `${offer.durationMonths} meses`
                        : 'Mensual',
            },
            { label: 'Activación', value: 'Solo tras confirmación backend del pago' },
        ].filter((entry) => entry.value);
    }

    if (viewModel.type === 'portal_compras_publicas') {
        const portalMeta = viewModel.portalMeta || {};
        return [
            { label: 'Código / referencia técnica', value: viewModel.code || null },
            { label: 'País', value: portalMeta.pais || null },
            { label: 'Provincia', value: portalMeta.provincia || null },
            { label: 'Cantón', value: portalMeta.canton || null },
            { label: 'Dirección', value: portalMeta.direccion || null },
            { label: 'Monto de licitación', value: viewModel.licitacionPrice ? formatCurrency(viewModel.licitacionPrice, viewModel.currency) : null },
            { label: 'F. publicación licitación', value: formatDisplayDate(portalMeta.fecha_inicio_licitacion) },
            { label: 'F. entrega propuesta', value: formatDisplayDate(portalMeta.fecha_fin_licitacion) },
            {
                label: 'Modalidad de entrega',
                value: portalMeta.delivery_mode === 'excel_only'
                    ? 'Solo Excel'
                    : portalMeta.delivery_mode === 'project_only'
                        ? 'Solo GIPROY'
                        : 'Excel + GIPROY',
            },
        ].filter((entry) => entry.value);
    }

    return [
        { label: 'Tipo de producto', value: viewModel.typeLabel },
        {
            label: 'Modo comercial',
            value: viewModel.salesConfig?.allowsMultiple
                ? `Paquete · paso ${viewModel.salesConfig.quantityStep}`
                : 'Compra unitaria',
        },
    ].filter((entry) => entry.value);
};

const resolveExclusiveMetaSections = (viewModel) => {
    if (viewModel.type === 'portal_compras_publicas') {
        const portalMeta = viewModel.portalMeta || {};
        return [
            {
                title: 'Proceso',
                entries: [
                    { label: 'Código / referencia técnica', value: viewModel.code || null },
                    { label: 'F. publicación licitación', value: formatDisplayDate(portalMeta.fecha_inicio_licitacion) },
                    { label: 'F. entrega propuesta', value: formatDisplayDate(portalMeta.fecha_fin_licitacion) },
                    {
                        label: 'Modalidad de entrega',
                        value: portalMeta.delivery_mode === 'excel_only'
                            ? 'Solo Excel'
                            : portalMeta.delivery_mode === 'project_only'
                                ? 'Solo GIPROY'
                                : 'Excel + GIPROY',
                    },
                ].filter((entry) => entry.value),
            },
            {
                title: 'Localización',
                entries: [
                    { label: 'País', value: portalMeta.pais || null },
                    { label: 'Provincia', value: portalMeta.provincia || null },
                    { label: 'Cantón', value: portalMeta.canton || null },
                    { label: 'Dirección', value: portalMeta.direccion || null },
                ].filter((entry) => entry.value),
            },
            {
                title: 'Referencia económica',
                entries: [
                    {
                        label: 'Monto de licitación',
                        value: viewModel.licitacionPrice ? formatCurrency(viewModel.licitacionPrice, viewModel.currency) : null,
                    },
                ].filter((entry) => entry.value),
            },
        ].filter((section) => section.entries.length);
    }

    if (viewModel.type === 'licencia') {
        return [
            {
                title: 'Licencia SaaS',
                entries: resolveExclusiveMetaEntries(viewModel),
            },
        ].filter((section) => section.entries.length);
    }

    return [
        {
            title: 'Resumen',
            entries: resolveExclusiveMetaEntries(viewModel),
        },
    ].filter((section) => section.entries.length);
};

const resolveExclusiveSectionPresentation = (viewModel) => {
    if (viewModel.type === 'licencia') {
        return {
            title: 'Condiciones de licencia',
            emptyMessage: 'Esta licencia todavía no tiene condiciones públicas ampliadas.',
        };
    }

    if (viewModel.type === 'portal_compras_publicas') {
        return {
            title: 'Ficha del proceso',
            emptyMessage: 'Este portal aún no tiene ficha técnica pública ampliada.',
        };
    }

    if (viewModel.type === 'base_maestra') {
        return {
            title: 'Especificaciones de la base',
            emptyMessage: 'Esta base maestra todavía no tiene especificaciones públicas ampliadas.',
        };
    }

    if (viewModel.type === 'apu') {
        return {
            title: 'Especificaciones del APU',
            emptyMessage: 'Este APU todavía no tiene especificaciones públicas ampliadas.',
        };
    }

    if (viewModel.type === 'proyecto') {
        return {
            title: 'Alcance del proyecto',
            emptyMessage: 'Este proyecto todavía no tiene alcance público ampliado.',
        };
    }

    return {
        title: 'Especificaciones',
        emptyMessage: 'Este producto aún no tiene metadatos exclusivos configurados para su ficha pública.',
    };
};

const renderVatIncludedLabel = (className = '') => (
    <p className={`mt-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400 ${className}`.trim()}>
        IVA incluido
    </p>
);

const getMarketplaceProductMeta = (product) => product?.vista_previa?.product_meta || {};

const isOfficialSaasProduct = (product) => {
    const productMeta = getMarketplaceProductMeta(product);
    const commercialCode = String(productMeta.commercial_code || '').trim().toUpperCase();
    if (!commercialCode) return false;
    return Boolean(
        productMeta.requires_superadmin_edit
        && (
            commercialCode.startsWith('LIC_')
            || commercialCode.startsWith('PACK_')
            || commercialCode.startsWith('MOD_')
        )
    );
};

const resolveOfficialSaasKind = (product) => {
    const commercialCode = String(getMarketplaceProductMeta(product).commercial_code || '').trim().toUpperCase();
    if (commercialCode.startsWith('LIC_')) return 'Licencia';
    if (commercialCode.startsWith('PACK_')) return 'Pack';
    if (commercialCode.startsWith('MOD_')) return 'Módulo';
    return 'SaaS';
};

const ProductVisualCard = ({ product, canBuy, inCartQuantity, onAddToCart, onOpenDetails }) => {
    const viewModel = resolveMarketplaceProductViewModel(product);
    const coverTheme = COVER_THEMES[product.product_type] || COVER_THEMES.adicional;
    const coverImage = viewModel.commonMeta.imageUrl;
    const salesConfig = viewModel.salesConfig;
    const officialSaas = isOfficialSaasProduct(product);

    return (
        <div className="group overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white transition-colors hover:border-[#F39200]">
            <button type="button" onClick={() => onOpenDetails(product)} className="block w-full bg-transparent p-0 text-left">
                <div className={`relative h-[160px] overflow-hidden xl:h-[168px] 2xl:h-[176px] ${coverImage ? 'bg-zinc-900' : `bg-gradient-to-br ${coverTheme}`}`}>
                    {coverImage ? (
                        <>
                            <img
                                src={coverImage}
                                alt={product.titulo}
                                className="absolute inset-0 h-full w-full object-cover"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,31,0.18),rgba(7,20,31,0.62))]" />
                        </>
                    ) : (
                        <>
                            <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.26),transparent_24%),radial-gradient(circle_at_82%_26%,rgba(255,255,255,0.12),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.22))]" />
                            <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:30px_30px]" />
                        </>
                    )}
                    <div className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/65 text-white transition-transform group-hover:scale-105">
                        <Eye className="h-4 w-4" />
                    </div>
                    {officialSaas ? (
                        <div className="absolute left-3 top-3 rounded-full border border-white/25 bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#136191]">
                            {resolveOfficialSaasKind(product)} SaaS
                        </div>
                    ) : null}
                    <div className="absolute inset-x-0 bottom-0 p-4 text-white xl:p-5">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-white/80 xl:text-[10px]">
                            {viewModel.commonMeta.categoryLabel}
                        </p>
                        <h3 className="mt-1.5 break-words text-[1.08rem] font-extrabold uppercase leading-[1.05] tracking-tight sm:text-[1.16rem] xl:text-[1.24rem] 2xl:text-[1.3rem]">
                            {viewModel.commonMeta.title}
                        </h3>
                    </div>
                </div>
            </button>
            <div className="grid min-h-[176px] grid-rows-[22px_minmax(84px,1fr)_70px] px-4 py-3 xl:min-h-[186px] xl:px-4 xl:py-3.5 2xl:px-5">
                <p className="line-clamp-1 self-start text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                    {viewModel.commonMeta.ownerLabel}
                </p>
                <div className="min-h-0 space-y-2 overflow-hidden">
                    <p className="line-clamp-3 text-[0.98rem] font-semibold leading-[1.24] tracking-tight text-zinc-900 xl:text-[1.02rem]">
                        {viewModel.commonMeta.shortDescription || 'Sin descripción breve disponible.'}
                    </p>
                    {viewModel.licitacionPrice ? (
                        <div className="rounded-[0.9rem] border border-sky-100 bg-sky-50/70 px-3 py-2">
                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-sky-700">
                                Monto de licitación
                            </p>
                            <p className="mt-1 line-clamp-1 text-[12px] font-bold tracking-tight text-sky-900">
                                {formatCurrency(viewModel.licitacionPrice, viewModel.currency)}
                            </p>
                        </div>
                    ) : null}
                </div>
                <div className="grid h-full grid-cols-[minmax(0,1fr)_44px] items-end gap-3">
                    <div className="flex min-h-[64px] min-w-0 flex-col justify-end">
                        {viewModel.pricing.hasDiscount ? (
                            <div className="space-y-1">
                                <p className="text-[0.82rem] font-semibold tracking-tight text-zinc-400 line-through">
                                    {formatCurrency(viewModel.pricing.originalPrice, viewModel.currency)}
                                </p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <p className="text-[1rem] font-bold tracking-tight text-[#F39200] xl:text-[1.05rem]">
                                        {formatCurrency(viewModel.pricing.finalPrice, viewModel.currency)}
                                    </p>
                                    <span className="inline-flex items-center rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.12em] text-[#F39200]">
                                        -{viewModel.pricing.discountPercent}%
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <p className="text-[1rem] font-bold tracking-tight text-[#F39200] xl:text-[1.05rem]">
                                {formatCurrency(viewModel.pricing.finalPrice, viewModel.currency)}
                            </p>
                        )}
                        {renderVatIncludedLabel('tracking-[0.12em]')}
                    </div>
                    {canBuy ? (
                        <button
                            type="button"
                            onClick={() => onAddToCart(product)}
                            className={`inline-flex h-10 w-11 shrink-0 self-end items-center justify-center rounded-xl border px-3 text-[0.84rem] font-bold transition-colors ${
                                inCartQuantity > 0
                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                    : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#F39200] hover:text-[#F39200]'
                            }`}
                            title={salesConfig.allowsMultiple ? 'Añadir al carrito o aumentar cantidad' : 'Añadir al carrito'}
                        >
                            <ShoppingCart className="h-4 w-4" />
                            {inCartQuantity > 0 ? (
                                <span className="ml-2 text-[0.72rem] font-black">
                                    {inCartQuantity}
                                </span>
                            ) : null}
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
};

const ProductDetailDialog = ({ product, canBuy, inCartQuantity, onAddToCart, onOpenChange }) => {
    const detailScrollRef = useRef(null);
    const open = Boolean(product);
    const viewModel = useMemo(() => (product ? resolveMarketplaceProductViewModel(product) : null), [product]);
    const exclusiveSections = useMemo(() => (viewModel ? resolveExclusiveMetaSections(viewModel) : []), [viewModel]);
    const exclusivePresentation = useMemo(
        () => (viewModel ? resolveExclusiveSectionPresentation(viewModel) : { title: 'Especificaciones', emptyMessage: 'Sin información ampliada.' }),
        [viewModel],
    );

    return (
        <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onOpenChange(false); }}>
            <DialogContent showCloseButton={false} className="flex h-[100dvh] w-screen max-w-none flex-col overflow-hidden rounded-none border-0 bg-white p-0 sm:h-auto sm:max-h-[92dvh] sm:w-[calc(100vw-2rem)] sm:max-w-[980px] sm:rounded-[1.6rem] sm:border sm:border-zinc-200 lg:rounded-[1.9rem]">
                {viewModel ? (
                    <>
                        <DialogHeader className="overflow-hidden border-b border-zinc-200 p-0 text-left">
                            <div className={`relative min-h-[170px] overflow-hidden rounded-t-[inherit] sm:min-h-[210px] lg:min-h-[240px] ${viewModel.commonMeta.imageUrl ? 'bg-zinc-900' : `bg-gradient-to-br ${COVER_THEMES[viewModel.type] || COVER_THEMES.adicional}`}`}>
                                {viewModel.commonMeta.imageUrl ? (
                                    <>
                                        <img
                                            src={viewModel.commonMeta.imageUrl}
                                            alt={viewModel.commonMeta.title}
                                            className="absolute inset-0 h-full w-full rounded-t-[inherit] object-cover"
                                        />
                                        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(7,20,31,0.18),rgba(7,20,31,0.74))]" />
                                    </>
                                ) : (
                                    <>
                                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.26),transparent_24%),radial-gradient(circle_at_82%_26%,rgba(255,255,255,0.12),transparent_20%),linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.22))]" />
                                        <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(255,255,255,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:30px_30px]" />
                                    </>
                                )}
                                <div className="relative flex min-h-[170px] flex-col justify-end gap-3 px-4 py-4 text-white sm:min-h-[210px] sm:px-5 sm:py-5 lg:min-h-[240px] lg:gap-4 lg:px-7 lg:py-7">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className="inline-flex items-center rounded-full border border-white/12 bg-white/12 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
                                            {viewModel.commonMeta.categoryLabel}
                                        </span>
                                        <span className="inline-flex items-center rounded-full border border-black/10 bg-black/25 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-white/90 backdrop-blur-sm">
                                            {viewModel.commonMeta.ownerLabel}
                                        </span>
                                    </div>
                                    <div className="max-w-3xl space-y-2.5 sm:space-y-3.5">
                                        <DialogTitle className="max-w-[12ch] text-[1.25rem] font-black leading-[0.94] tracking-[-0.03em] text-white sm:max-w-[15ch] sm:text-[1.7rem] md:max-w-[17ch] md:text-[2rem] lg:max-w-[15ch] lg:text-[2.45rem]">
                                            {viewModel.commonMeta.title}
                                        </DialogTitle>
                                        <DialogDescription className="line-clamp-3 max-w-[62ch] text-[13px] font-medium leading-relaxed text-white/82 sm:text-sm">
                                            {viewModel.commonMeta.shortDescription || 'Sin descripción breve disponible.'}
                                        </DialogDescription>
                                        {viewModel.licitacionPrice ? (
                                            <div className="pt-1">
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-white/62 sm:text-[11px]">
                                                    Monto de licitación
                                                </p>
                                                <p className="mt-1 text-[1rem] font-black tracking-[-0.02em] text-white sm:text-[1.08rem]">
                                                    {formatCurrency(viewModel.licitacionPrice, viewModel.currency)}
                                                </p>
                                            </div>
                                        ) : null}
                                    </div>
                                </div>
                            </div>
                        </DialogHeader>

                        <div className="relative min-h-0 flex-1">
                        <div ref={detailScrollRef} className="giproy-motion-scrollbar-hide h-full min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pr-8 sm:px-5 sm:py-5 lg:px-7 lg:py-6">
                            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.02fr)_minmax(280px,0.98fr)] lg:items-start lg:gap-5 xl:gap-6">
                                <div className="order-2 space-y-4 sm:space-y-5 lg:order-1 lg:space-y-6">
                                    <section className="rounded-[1.3rem] border border-zinc-200 bg-zinc-50/60 p-4 sm:rounded-[1.4rem] sm:p-5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Información general</p>
                                        <div className="mt-4 space-y-4">
                                            {viewModel.commonMeta.longDescription || viewModel.commonMeta.fullDescription ? (
                                                <p className="text-sm leading-relaxed text-zinc-600">
                                                    {viewModel.type === 'portal_compras_publicas'
                                                        ? 'Detalle editorial y descriptivo del proceso publicado dentro del storefront.'
                                                        : 'Resumen ampliado del producto para revisar alcance, contexto y contenido antes de comprar.'}
                                                </p>
                                            ) : null}
                                            {viewModel.commonMeta.longDescription ? (
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Descripción larga</p>
                                                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">{viewModel.commonMeta.longDescription}</p>
                                                </div>
                                            ) : null}
                                            {viewModel.commonMeta.fullDescription ? (
                                                <div>
                                                    <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-400">Descripción completa</p>
                                                    <p className="mt-2 text-sm leading-relaxed text-zinc-700">{viewModel.commonMeta.fullDescription}</p>
                                                </div>
                                            ) : null}
                                            {!viewModel.commonMeta.longDescription && !viewModel.commonMeta.fullDescription ? (
                                                <p className="text-sm leading-relaxed text-zinc-500">Este producto todavía no tiene detalle ampliado configurado.</p>
                                            ) : null}
                                        </div>
                                    </section>

                                    <section className="rounded-[1.3rem] border border-zinc-200 bg-white p-4 sm:rounded-[1.4rem] sm:p-5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{exclusivePresentation.title}</p>
                                        {exclusiveSections.length ? (
                                            <div className="mt-4 space-y-3">
                                                {exclusiveSections.map((section) => (
                                                    <div key={section.title} className="space-y-2.5">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{section.title}</p>
                                                        <div className="grid gap-2.5 md:grid-cols-2">
                                                            {section.entries.map((entry) => (
                                                                <div key={`${section.title}-${entry.label}`} className="rounded-[0.95rem] border border-zinc-100 bg-zinc-50 px-4 py-3">
                                                                    <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-400">{entry.label}</p>
                                                                    <p className="mt-1 text-[0.95rem] font-semibold leading-snug text-zinc-800">{entry.value}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="mt-4 text-sm leading-relaxed text-zinc-500">{exclusivePresentation.emptyMessage}</p>
                                        )}
                                    </section>
                                </div>

                                <aside className="order-1 space-y-4 lg:order-2 lg:sticky lg:top-0">
                                    <section className="rounded-[1.3rem] border border-zinc-200 bg-white p-4 sm:rounded-[1.4rem] sm:p-5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Condiciones comerciales</p>
                                        <div className="mt-4 space-y-4">
                                            <div>
                                                {viewModel.pricing.hasDiscount ? (
                                                    <>
                                                        <p className="text-sm font-semibold text-zinc-400 line-through">
                                                            {formatCurrency(viewModel.pricing.originalPrice, viewModel.currency)}
                                                        </p>
                                                        <div className="mt-2 flex flex-wrap items-center gap-2">
                                                            <p className="text-[1.6rem] font-black tracking-tight text-[#F39200] sm:text-[1.75rem] lg:text-[1.9rem]">
                                                                {formatCurrency(viewModel.pricing.finalPrice, viewModel.currency)}
                                                            </p>
                                                            <span className="inline-flex items-center rounded-full bg-orange-50 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#F39200]">
                                                                -{viewModel.pricing.discountPercent}%
                                                            </span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <p className="text-[1.6rem] font-black tracking-tight text-[#F39200] sm:text-[1.75rem] lg:text-[1.9rem]">
                                                        {formatCurrency(viewModel.pricing.finalPrice, viewModel.currency)}
                                                    </p>
                                                )}
                                                {renderVatIncludedLabel()}
                                            </div>
                                            <div className="space-y-2 rounded-[1rem] bg-zinc-50 px-4 py-3">
                                                <div className="grid gap-1 text-sm sm:grid-cols-[108px_minmax(0,1fr)] sm:items-start sm:gap-3">
                                                    <span className="font-semibold text-zinc-500">Vigencia</span>
                                                    <span className="font-semibold text-zinc-800 sm:text-right sm:[overflow-wrap:anywhere]">
                                                        {formatDisplayDate(viewModel.commonMeta.publicationStart) || '—'} - {formatDisplayDate(viewModel.commonMeta.publicationEnd) || '—'}
                                                    </span>
                                                </div>
                                                <div className="grid gap-1 text-sm sm:grid-cols-[108px_minmax(0,1fr)] sm:items-start sm:gap-3">
                                                    <span className="font-semibold text-zinc-500">Tipo</span>
                                                    <span className="font-semibold text-zinc-800 sm:text-right sm:[overflow-wrap:anywhere]">{viewModel.typeLabel}</span>
                                                </div>
                                                <div className="grid gap-1 text-sm sm:grid-cols-[108px_minmax(0,1fr)] sm:items-start sm:gap-3">
                                                    <span className="font-semibold text-zinc-500">Propietario</span>
                                                    <span className="font-semibold text-zinc-800 sm:text-right sm:[overflow-wrap:anywhere]">{viewModel.commonMeta.ownerLabel}</span>
                                                </div>
                                            </div>
                                            {viewModel.licitacionPrice ? (
                                                <div className="rounded-[1rem] border border-sky-100 bg-sky-50/70 px-4 py-3">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">Monto de licitación</p>
                                                    <p className="mt-1 text-base font-black tracking-tight text-sky-900">
                                                        {formatCurrency(viewModel.licitacionPrice, viewModel.currency)}
                                                    </p>
                                                    <p className="mt-1 text-xs leading-relaxed text-sky-800/80">
                                                        Dato técnico referencial del proceso. No corresponde al precio de compra del producto.
                                                    </p>
                                                </div>
                                            ) : null}
                                            {canBuy ? (
                                                <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Acción de compra</p>
                                                    <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                                                        {inCartQuantity > 0
                                                            ? `Ya tienes ${inCartQuantity} unidad(es) de este producto en el carrito.`
                                                            : 'Puedes agregar este producto al carrito desde este mismo detalle.'}
                                                    </p>
                                                </div>
                                            ) : null}
                                        </div>
                                    </section>
                                </aside>
                            </div>
                        </div>
                        <MotionScrollbar targetRef={detailScrollRef} className="right-0" />
                        </div>

                        <DialogFooter className="shrink-0 border-t border-zinc-200 bg-white/95 px-4 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:px-5 sm:py-4 lg:px-7 lg:py-5 sm:justify-between sm:space-x-0">
                            <div className="hidden text-left md:block">
                                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">Producto</p>
                                <p className="mt-1 line-clamp-1 text-sm font-semibold text-zinc-700">{viewModel.commonMeta.title}</p>
                                <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{viewModel.commonMeta.ownerLabel}</p>
                            </div>
                            <div className="flex w-full flex-col gap-3 sm:w-full sm:max-w-[420px] sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={() => onOpenChange(false)}
                                    className="inline-flex min-h-[46px] w-full items-center justify-center rounded-xl border border-zinc-200 px-5 text-sm font-bold text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 sm:w-auto"
                                >
                                    Cerrar
                                </button>
                                {canBuy ? (
                                    <button
                                        type="button"
                                        onClick={() => onAddToCart(viewModel.raw)}
                                        className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-[#1A1A1A] px-5 text-sm font-black text-white transition-colors hover:bg-zinc-800 sm:w-auto"
                                    >
                                        <ShoppingCart className="h-4 w-4" />
                                        {inCartQuantity > 0 ? `Agregar otra unidad (${inCartQuantity})` : 'Agregar al carrito'}
                                    </button>
                                ) : null}
                            </div>
                        </DialogFooter>
                    </>
                ) : null}
            </DialogContent>
        </Dialog>
    );
};

const SidebarCategoryItem = ({ category, count, isActive, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`group flex min-h-[46px] w-full items-center justify-between gap-3 border-b border-zinc-100 px-0 py-2.5 text-left transition-colors last:border-b-0 ${
            isActive ? 'text-[#F39200]' : 'text-zinc-800 hover:text-[#F39200]'
        }`}
    >
        <span className="inline-flex min-w-0 flex-1 items-center gap-2 text-[0.88rem] font-semibold leading-snug">
            <ChevronRight className={`h-3.5 w-3.5 shrink-0 transition-transform ${isActive ? 'translate-x-0.5' : 'group-hover:translate-x-0.5'}`} />
            <span className="min-w-0 break-words">{category.nombre}</span>
        </span>
        <span className={`inline-flex h-7 min-w-[34px] shrink-0 items-center justify-center rounded-lg px-2 text-[11px] font-black ${
            isActive ? 'bg-[#F39200]/10 text-[#F39200]' : 'bg-zinc-100 text-zinc-500'
        }`}>
            {count}
        </span>
    </button>
);

const RecentProductRow = ({ product, onOpenDetails }) => (
    <button
        type="button"
        onClick={() => onOpenDetails(product)}
        className="flex w-full items-center gap-3 rounded-xl p-1.5 text-left transition-colors hover:bg-zinc-50"
    >
        <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gradient-to-br ${COVER_THEMES[product.product_type] || COVER_THEMES.adicional}`}>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(0,0,0,0.1))]" />
            <div className="absolute inset-x-0 bottom-0 p-2 text-[9px] font-black uppercase leading-none tracking-[0.08em] text-white">
                {product.titulo}
            </div>
        </div>
        <div className="min-w-0">
            <p className="line-clamp-2 text-[0.82rem] font-bold leading-tight tracking-tight text-zinc-900">
                {product.titulo}
            </p>
            <p className="mt-1 text-[0.82rem] font-bold text-[#F39200]">
                {formatCurrency(product.precio, product.moneda)}
            </p>
        </div>
    </button>
);

const StorefrontControlTile = ({ icon: Icon, label, dark = false, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-[11px] font-black tracking-tight shadow-sm transition-all ${
            dark
                ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white hover:bg-zinc-800'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#F39200]/35 hover:text-[#1A1A1A]'
        }`}
    >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
    </button>
);

const StorefrontToggleTile = ({ icon: Icon, label, active = false, onClick }) => (
    <button
        type="button"
        onClick={onClick}
        className={`inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl border px-5 py-3 text-[11px] font-black tracking-tight shadow-sm transition-all ${
            active
                ? 'border-[#136191] bg-blue-50 text-[#136191]'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-[#136191]/35 hover:text-[#136191]'
        }`}
    >
        <Icon className="h-4 w-4 shrink-0" />
        <span className="whitespace-nowrap">{label}</span>
    </button>
);

const Marketplace = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, selectedEmpresa, licenseInfo } = useContext(AuthContext);
    const scrollContainerRef = useRef(null);
    const optionsContainerRef = useRef(null);
    const infiniteSentinelRef = useRef(null);
    const sortMenuRef = useRef(null);
    const payphoneConfirmSignatureRef = useRef('');
    const payPhoneModalScrollRef = useRef(null);
    const payPalModalScrollRef = useRef(null);
    const cartModalScrollRef = useRef(null);
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [query, setQuery] = useState(() => new URLSearchParams(location.search).get('q') || '');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [selectedSort, setSelectedSort] = useState('default');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [recentlyViewedIds, setRecentlyViewedIds] = useState([]);
    const [draftPriceCap, setDraftPriceCap] = useState(200);
    const [appliedPriceCap, setAppliedPriceCap] = useState(200);
    const [draftPriceFloor, setDraftPriceFloor] = useState(0);
    const [appliedPriceFloor, setAppliedPriceFloor] = useState(0);
    const [saasCatalogOnly, setSaasCatalogOnly] = useState(() => new URLSearchParams(location.search).get('saas') === '1');
    const [visibleCount, setVisibleCount] = useState(INITIAL_RENDER_COUNT);
    const [preloadedCount, setPreloadedCount] = useState(INITIAL_RENDER_COUNT + PRECACHE_BUFFER_SIZE);
    const [sortMenuOpen, setSortMenuOpen] = useState(false);
    const [cartLines, setCartLines] = useState([]);
    const [cartLastActivityAt, setCartLastActivityAt] = useState(null);
    const [cartHydrated, setCartHydrated] = useState(false);
    const [cartOpen, setCartOpen] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [cartNotice, setCartNotice] = useState(null);
    const [detailProduct, setDetailProduct] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [bankTransferReference, setBankTransferReference] = useState('');
    const [payPhoneCheckoutConfig, setPayPhoneCheckoutConfig] = useState(null);
    const [payPhoneModalOpen, setPayPhoneModalOpen] = useState(false);
    const [payPhonePreparing, setPayPhonePreparing] = useState(false);
    const [payPhoneConfirming, setPayPhoneConfirming] = useState(false);
    const [payPalCheckoutConfig, setPayPalCheckoutConfig] = useState(null);
    const [payPalModalOpen, setPayPalModalOpen] = useState(false);
    const [payPalPreparing, setPayPalPreparing] = useState(false);
    const [payPalProcessing, setPayPalProcessing] = useState(false);

    const isSuperAdmin = (user?.rol || '').toLowerCase() === 'superadministrador';
    const isCompanyAdmin = (user?.rol || '').toLowerCase() === 'administrador';
    const hasMarketplaceAdminPermission = (user?.marketplace_permissions || []).includes('marketplace.manage_all_products');
    const canBuy = (user?.marketplace_permissions || []).includes('marketplace.buy');
    const canSell = (user?.marketplace_permissions || []).includes('seller.publish');
    const activeCompany = isSuperAdmin ? (selectedEmpresa || user?.empresa || null) : (user?.empresa || selectedEmpresa || null);
    const currentCompanyName = activeCompany?.nombre || activeCompany?.razon_social || activeCompany?.nombre_comercial || user?.empresa_nombre || user?.empresa?.nombre || '';
    const isSantiagoBermeoBetaAdmin = isCompanyAdmin && normalizeCompanyName(currentCompanyName) === normalizeCompanyName('Santiago Bermeo');
    const canAccessAdminPanel = hasMarketplaceAdminPermission || isSuperAdmin || isSantiagoBermeoBetaAdmin;
    const payPhoneContainerId = payPhoneCheckoutConfig?.client_transaction_id
        ? `payphone-box-${String(payPhoneCheckoutConfig.client_transaction_id).replace(/[^a-zA-Z0-9_-]/g, '')}`
        : 'payphone-box-marketplace';
    const payPalContainerId = payPalCheckoutConfig?.payment_attempt_id
        ? `paypal-box-${String(payPalCheckoutConfig.payment_attempt_id)}`
        : 'paypal-box-marketplace';

    useEffect(() => {
        setRecentlyViewedIds(getMarketplaceRecentlyViewed(user?.id));
    }, [user?.id]);

    useEffect(() => {
        const handleOutsideClick = (event) => {
            if (!sortMenuRef.current?.contains(event.target)) {
                setSortMenuOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setSortMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, []);

    useEffect(() => {
        setCartHydrated(false);
        const storedCart = loadStoredCart(user?.id);
        if (storedCart.abandoned) {
            removeStoredCart(user?.id);
            sessionStorage.removeItem(resolveCartReminderSessionKey(user?.id));
        }
        setCartLines(storedCart.lines);
        setCartLastActivityAt(storedCart.lastActivityAt);
        setCartHydrated(true);
    }, [user?.id]);

    useEffect(() => {
        if (!cartHydrated) return;
        persistStoredCart(user?.id, cartLines, cartLastActivityAt);
        if (!cartLines.length) {
            sessionStorage.removeItem(resolveCartReminderSessionKey(user?.id));
        }
    }, [cartHydrated, cartLastActivityAt, cartLines, user?.id]);

    useEffect(() => {
        if (!cartNotice) return undefined;
        const timeoutId = window.setTimeout(() => setCartNotice(null), CART_NOTICE_TIMEOUT_MS);
        return () => window.clearTimeout(timeoutId);
    }, [cartNotice]);

    useEffect(() => {
        if (!cartHydrated || !canBuy || !cartLines.length) return;
        const sessionKey = resolveCartReminderSessionKey(user?.id);
        const currentSignature = cartLines
            .map((line) => `${line.productId}:${line.quantity}`)
            .sort()
            .join('|');
        if (!currentSignature) return;
        if (sessionStorage.getItem(sessionKey) === currentSignature) return;

        sessionStorage.setItem(sessionKey, currentSignature);
        setCartNotice({
            tone: 'info',
            title: 'Carrito pendiente',
            message: cartLines.length === 1
                ? 'Tienes 1 producto pendiente en el carrito.'
                : `Tienes ${cartLines.length} productos pendientes en el carrito.`,
        });
    }, [canBuy, cartHydrated, cartLines, user?.id]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const shouldShowSaasCatalog = searchParams.get('saas') === '1';
        const nextQuery = searchParams.get('q') || '';
        if (nextQuery) {
            setQuery(nextQuery);
        }
        if (!shouldShowSaasCatalog) return;
        setSaasCatalogOnly(true);
        setSelectedCategory('');
    }, [location.search]);

    useEffect(() => {
        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError('');
                const [productsResponse, categoriesResponse] = await Promise.all([
                    marketplaceApi.getProducts({ limit: 100 }),
                    marketplaceApi.getCategories(),
                ]);

                if (cancelled) return;

                const nextProducts = productsResponse.data || [];
                const nextCategories = categoriesResponse.data || [];
                const nextPriceCap = resolvePriceCap(nextProducts);

                setProducts(nextProducts);
                setCategories(nextCategories);
                setDraftPriceFloor(0);
                setAppliedPriceFloor(0);
                setDraftPriceCap(nextPriceCap);
                setAppliedPriceCap(nextPriceCap);
            } catch (loadError) {
                globalThis.reportClientError?.('Error cargando tienda:', loadError);
                if (cancelled) return;
                setProducts([]);
                setCategories([]);
                setError('No fue posible cargar la tienda en este momento.');
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();
        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!canBuy) {
            setPaymentMethods([]);
            setSelectedPaymentMethod('');
            setBankTransferReference('');
            return;
        }

        let cancelled = false;

        const loadPaymentMethods = async () => {
            try {
                setPaymentMethodsLoading(true);
                const { data } = await marketplaceApi.getPaymentMethods();
                if (cancelled) return;
                const nextMethods = Array.isArray(data) ? data : [];
                setPaymentMethods(nextMethods);
                setSelectedPaymentMethod((current) => (
                    current && nextMethods.some((method) => method.slug === current)
                        ? current
                        : (nextMethods[0]?.slug || '')
                ));
            } catch {
                if (cancelled) return;
                setPaymentMethods([]);
                setSelectedPaymentMethod('');
                setBankTransferReference('');
            } finally {
                if (!cancelled) setPaymentMethodsLoading(false);
            }
        };

        loadPaymentMethods();
        return () => {
            cancelled = true;
        };
    }, [canBuy]);

    useEffect(() => {
        if (selectedPaymentMethod !== 'bank_transfer' && bankTransferReference) {
            setBankTransferReference('');
        }
    }, [bankTransferReference, selectedPaymentMethod]);

    useEffect(() => {
        if (selectedPaymentMethod !== 'payphone' && payPhoneCheckoutConfig) {
            setPayPhoneCheckoutConfig(null);
            setPayPhoneModalOpen(false);
        }
    }, [payPhoneCheckoutConfig, selectedPaymentMethod]);

    useEffect(() => {
        if (selectedPaymentMethod !== 'paypal' && payPalCheckoutConfig) {
            setPayPalCheckoutConfig(null);
            setPayPalModalOpen(false);
        }
    }, [payPalCheckoutConfig, selectedPaymentMethod]);

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search || '');
        const payPhoneId = searchParams.get('id');
        const clientTransactionId = searchParams.get('clientTransactionId');
        if (!canBuy || !payPhoneId || !clientTransactionId) return;

        const signature = `${payPhoneId}:${clientTransactionId}`;
        if (payphoneConfirmSignatureRef.current === signature) return;
        payphoneConfirmSignatureRef.current = signature;

        let cancelled = false;

        const confirmPayPhone = async () => {
            try {
                setPayPhoneConfirming(true);
                const { data } = await marketplaceApi.confirmPayPhoneCheckout({
                    id: Number(payPhoneId),
                    client_transaction_id: clientTransactionId,
                });
                if (cancelled) return;

                const normalizedStatus = String(data?.transaction_status || '').toLowerCase();
                if (normalizedStatus === 'approved' && data?.order?.id) {
                    setCartLines([]);
                    setCartLastActivityAt(null);
                    removeStoredCart(user?.id);
                    setCartOpen(false);
                    setPayPhoneCheckoutConfig(null);
                    setPayPhoneModalOpen(false);
                    await appAlert({
                        title: 'Pago confirmado',
                        message: `La compra quedó confirmada correctamente${data?.order?.id ? ` con pedido #${data.order.id}` : ''}.`,
                        tone: 'success',
                    });
                    navigate('/marketplace/buyer', { replace: true });
                    return;
                }

                await appAlert({
                    title: normalizedStatus === 'canceled' ? 'Pago cancelado' : 'Pago no confirmado',
                    message: data?.message || 'La transacción de PayPhone no fue aprobada.',
                    tone: normalizedStatus === 'canceled' ? 'info' : 'warning',
                });
                navigate('/marketplace', { replace: true });
            } catch (confirmError) {
                if (cancelled) return;
                await appAlert({
                    title: 'No se pudo confirmar el pago',
                    message: confirmError?.response?.data?.detail || 'Ocurrió un error al confirmar la transacción PayPhone.',
                    tone: 'danger',
                });
                navigate('/marketplace', { replace: true });
            } finally {
                if (!cancelled) setPayPhoneConfirming(false);
            }
        };

        confirmPayPhone();
        return () => {
            cancelled = true;
        };
    }, [canBuy, location.search, navigate, user?.id]);

    useEffect(() => {
        if (!payPhoneModalOpen || !payPhoneCheckoutConfig) return undefined;

        let cancelled = false;

        const mountPayPhone = async () => {
            try {
                await ensurePayPhoneSdk();
                if (cancelled) return;
                const container = document.getElementById(payPhoneContainerId);
                if (!container) return;
                container.innerHTML = '';
                const PayPhoneButtonBox = window.PPaymentButtonBox;
                if (!PayPhoneButtonBox) {
                    throw new Error('El SDK de PayPhone no se inicializó correctamente.');
                }
                new PayPhoneButtonBox({
                    token: payPhoneCheckoutConfig.token,
                    clientTransactionId: payPhoneCheckoutConfig.client_transaction_id,
                    amount: payPhoneCheckoutConfig.amount,
                    amountWithoutTax: payPhoneCheckoutConfig.amount_without_tax,
                    currency: payPhoneCheckoutConfig.currency,
                    storeId: payPhoneCheckoutConfig.store_id,
                    reference: payPhoneCheckoutConfig.reference,
                    lang: payPhoneCheckoutConfig.lang,
                    defaultMethod: payPhoneCheckoutConfig.default_method,
                    timeZone: payPhoneCheckoutConfig.time_zone,
                    phoneNumber: payPhoneCheckoutConfig.phone_number || undefined,
                    email: payPhoneCheckoutConfig.email || undefined,
                    documentId: payPhoneCheckoutConfig.document_id || undefined,
                    identificationType: payPhoneCheckoutConfig.identification_type,
                    lat: payPhoneCheckoutConfig.lat || undefined,
                    lng: payPhoneCheckoutConfig.lng || undefined,
                }).render(payPhoneContainerId);
            } catch (sdkError) {
                if (cancelled) return;
                await appAlert({
                    title: 'PayPhone no disponible',
                    message: sdkError?.message || 'No fue posible cargar la cajita de pagos de PayPhone.',
                    tone: 'danger',
                });
                setPayPhoneModalOpen(false);
            }
        };

        mountPayPhone();
        return () => {
            cancelled = true;
        };
    }, [payPhoneCheckoutConfig, payPhoneContainerId, payPhoneModalOpen]);

    useEffect(() => {
        if (!payPalModalOpen || !payPalCheckoutConfig) return undefined;

        let cancelled = false;

        const mountPayPal = async () => {
            try {
                const paypal = await ensurePayPalSdk({
                    clientId: payPalCheckoutConfig.client_id,
                    currency: payPalCheckoutConfig.currency,
                    intent: payPalCheckoutConfig.intent?.toLowerCase?.() || 'capture',
                    components: payPalCheckoutConfig.sdk_components || 'buttons',
                });
                if (cancelled) return;
                const container = document.getElementById(payPalContainerId);
                if (!container) return;
                container.innerHTML = '';
                if (!paypal?.Buttons) {
                    throw new Error('El SDK de PayPal no se inicializó correctamente.');
                }
                paypal.Buttons({
                    style: {
                        layout: 'vertical',
                        shape: 'rect',
                        label: 'paypal',
                    },
                    createOrder: async () => {
                        const { data } = await marketplaceApi.createPayPalOrder({
                            checkout_draft_id: payPalCheckoutConfig.checkout_draft_id,
                        });
                        return data.paypal_order_id;
                    },
                    onApprove: async (data) => {
                        try {
                            setPayPalProcessing(true);
                            const captureResponse = await marketplaceApi.capturePayPalOrder({
                                paypal_order_id: data.orderID,
                            });
                            if (cancelled) return;
                            if (captureResponse?.data?.order?.id) {
                                setCartLines([]);
                                setCartLastActivityAt(null);
                                removeStoredCart(user?.id);
                                setCartOpen(false);
                                setPayPalCheckoutConfig(null);
                                setPayPalModalOpen(false);
                                await appAlert({
                                    title: 'Pago confirmado',
                                    message: `La compra quedó confirmada correctamente${captureResponse?.data?.order?.id ? ` con pedido #${captureResponse.data.order.id}` : ''}.`,
                                    tone: 'success',
                                });
                                navigate('/marketplace/buyer');
                                return;
                            }
                            await appAlert({
                                title: 'Captura no completada',
                                message: captureResponse?.data?.message || 'PayPal no confirmó la captura del pago.',
                                tone: 'warning',
                            });
                        } catch (captureError) {
                            if (cancelled) return;
                            await appAlert({
                                title: 'No se pudo confirmar PayPal',
                                message: captureError?.response?.data?.detail || 'Ocurrió un error al capturar el pago con PayPal.',
                                tone: 'danger',
                            });
                        } finally {
                            if (!cancelled) setPayPalProcessing(false);
                        }
                    },
                    onCancel: async () => {
                        if (cancelled) return;
                        await appAlert({
                            title: 'Pago cancelado',
                            message: 'La orden de PayPal fue cancelada. El carrito sigue intacto para que puedas reintentar el pago.',
                            tone: 'info',
                        });
                    },
                    onError: async (sdkError) => {
                        if (cancelled) return;
                        await appAlert({
                            title: 'PayPal no disponible',
                            message: sdkError?.message || 'No fue posible iniciar el flujo de PayPal.',
                            tone: 'danger',
                        });
                    },
                }).render(`#${payPalContainerId}`);
            } catch (sdkError) {
                if (cancelled) return;
                await appAlert({
                    title: 'PayPal no disponible',
                    message: sdkError?.message || 'No fue posible cargar el SDK de PayPal.',
                    tone: 'danger',
                });
                setPayPalModalOpen(false);
            }
        };

        mountPayPal();
        return () => {
            cancelled = true;
        };
    }, [navigate, payPalCheckoutConfig, payPalContainerId, payPalModalOpen, user?.id]);

    const categoryEntries = useMemo(() => ([
        {
            id: 'all',
            nombre: 'Todas',
            count: products.length,
        },
        ...categories.map((category) => ({
            ...category,
            count: products.filter((product) => String(product.category?.id) === String(category.id)).length,
        })),
    ]), [categories, products]);

    const filteredProducts = useMemo(() => {
        const normalizedQuery = normalizeSearchToken(query);

        const result = products.filter((product) => {
            if (saasCatalogOnly && !isOfficialSaasProduct(product)) {
                return false;
            }
            const haystack = [
                product.titulo,
                product.resumen,
                product.descripcion,
                product.category?.nombre,
                getMarketplaceSellerDisplayName(product.seller),
                getMarketplaceProductMeta(product).commercial_code,
            ].filter(Boolean).join(' ');

            const queryMatch = !normalizedQuery || normalizeSearchToken(haystack).includes(normalizedQuery);
            const categoryMatch = !selectedCategory || String(product.category?.id) === String(selectedCategory);
            const currentPrice = Number(product.precio || 0);
            const priceMatch = currentPrice >= Number(appliedPriceFloor || 0) && currentPrice <= Number(appliedPriceCap || 0);

            return queryMatch && categoryMatch && priceMatch;
        });

        return result.slice().sort((left, right) => {
            const leftPrice = Number(left.precio || 0);
            const rightPrice = Number(right.precio || 0);
            const leftSales = Number(left.ventas_count || 0);
            const rightSales = Number(right.ventas_count || 0);
            const leftRating = Number(left.rating_promedio || 0);
            const rightRating = Number(right.rating_promedio || 0);
            const leftDate = left.fecha_creacion ? new Date(left.fecha_creacion).getTime() : 0;
            const rightDate = right.fecha_creacion ? new Date(right.fecha_creacion).getTime() : 0;

            switch (selectedSort) {
            case 'sales':
                return rightSales - leftSales || rightRating - leftRating || rightDate - leftDate;
            case 'rating':
                return rightRating - leftRating || rightSales - leftSales || rightDate - leftDate;
            case 'price_asc':
                return leftPrice - rightPrice;
            case 'price_desc':
                return rightPrice - leftPrice;
            case 'title':
                return String(left.titulo || '').localeCompare(String(right.titulo || ''), 'es', { sensitivity: 'base' });
            case 'default':
            default:
                return rightDate - leftDate || rightSales - leftSales || rightRating - leftRating;
            }
        });
    }, [appliedPriceCap, appliedPriceFloor, products, query, saasCatalogOnly, selectedCategory, selectedSort]);

    const totalResults = filteredProducts.length;
    const officialSaasProducts = useMemo(
        () => products.filter((product) => isOfficialSaasProduct(product)),
        [products],
    );

    useEffect(() => {
        const shouldRenderAll = totalResults <= FULL_RENDER_THRESHOLD;
        const initialVisible = shouldRenderAll
            ? totalResults
            : Math.min(INITIAL_RENDER_COUNT, totalResults);
        const initialPreloaded = shouldRenderAll
            ? totalResults
            : Math.min(initialVisible + PRECACHE_BUFFER_SIZE, totalResults);
        setVisibleCount(initialVisible);
        setPreloadedCount(initialPreloaded);
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
        if (optionsContainerRef.current) {
            optionsContainerRef.current.scrollTop = 0;
        }
    }, [query, selectedCategory, selectedSort, appliedPriceCap, appliedPriceFloor, saasCatalogOnly]);

    const visibleProducts = useMemo(() => {
        return filteredProducts.slice(0, visibleCount);
    }, [filteredProducts, visibleCount]);

    const rangeStart = totalResults === 0 ? 0 : 1;
    const rangeEnd = totalResults === 0 ? 0 : Math.min(visibleCount, totalResults);
    const hasMoreProducts = visibleCount < totalResults;

    useEffect(() => {
        if (!hasMoreProducts || !infiniteSentinelRef.current || !scrollContainerRef.current) {
            return undefined;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const [entry] = entries;
                if (!entry?.isIntersecting) return;

                setVisibleCount((currentVisible) => {
                    const nextVisible = Math.min(currentVisible + RENDER_CHUNK_SIZE, totalResults);
                    setPreloadedCount((currentPreloaded) => Math.min(
                        Math.max(currentPreloaded, nextVisible + PRECACHE_BUFFER_SIZE),
                        totalResults,
                    ));
                    return nextVisible;
                });
            },
            {
                root: scrollContainerRef.current,
                rootMargin: '0px 0px 420px 0px',
                threshold: 0.01,
            },
        );

        observer.observe(infiniteSentinelRef.current);

        return () => observer.disconnect();
    }, [hasMoreProducts, totalResults]);

    const recentProducts = useMemo(() => {
        const recentByStorage = recentlyViewedIds
            .map((recentId) => products.find((product) => String(product.id) === String(recentId)))
            .filter(Boolean)
            .slice(0, 4);

        if (recentByStorage.length > 0) return recentByStorage;

        return products
            .slice()
            .sort((left, right) => {
                const leftDate = left.fecha_creacion ? new Date(left.fecha_creacion).getTime() : 0;
                const rightDate = right.fecha_creacion ? new Date(right.fecha_creacion).getTime() : 0;
                return rightDate - leftDate || Number(right.ventas_count || 0) - Number(left.ventas_count || 0);
            })
            .slice(0, 4);
    }, [products, recentlyViewedIds]);

    const cartProducts = useMemo(() => {
        return cartLines
            .map((line, index) => {
                const product = products.find((item) => String(item.id) === String(line.productId));
                if (!product) return null;
                const quantity = normalizeCartQuantity(product, line.quantity);
                const viewModel = resolveMarketplaceProductViewModel(product);
                const unitPrice = Number(viewModel.pricing.finalPrice || 0);
                return {
                    index,
                    product,
                    viewModel,
                    productId: product.id,
                    quantity,
                    salesConfig: resolveSalesConfig(product),
                    unitPrice,
                    originalUnitPrice: Number(viewModel.pricing.originalPrice || unitPrice),
                    hasDiscount: Boolean(viewModel.pricing.hasDiscount),
                    discountPercent: Number(viewModel.pricing.discountPercent || 0),
                    lineTotal: unitPrice * quantity,
                };
            })
            .filter(Boolean);
    }, [cartLines, products]);
    const cartLicenseProducts = useMemo(
        () => cartProducts.filter((line) => line?.product?.product_type === 'licencia'),
        [cartProducts],
    );
    const hasLicensePlanChangeInCart = useMemo(() => {
        const currentPlan = String(licenseInfo?.licencia_actual || '').trim().toLowerCase();
        if (!currentPlan || !cartLicenseProducts.length) return false;
        return cartLicenseProducts.some((line) => {
            const offer = resolveMarketplaceLicenseOfferMeta(line.product);
            const offerName = String(offer.licenseName || line.product?.titulo || '').trim().toLowerCase();
            const offerKind = String(offer.planKind || '').trim().toLowerCase();
            return Boolean(
                (offerName && offerName !== currentPlan)
                || (offerKind && !currentPlan.includes(offerKind)),
            );
        });
    }, [cartLicenseProducts, licenseInfo?.licencia_actual]);
    const licenseCheckoutNotice = useMemo(() => {
        if (!cartLicenseProducts.length) return null;
        const firstOffer = resolveMarketplaceLicenseOfferMeta(cartLicenseProducts[0].product);
        const currentPlan = licenseInfo?.licencia_actual || 'plan actual';
        const targetPlan = firstOffer.licenseName || cartLicenseProducts[0].product?.titulo || 'nueva licencia';
        const durationLabel = firstOffer.billingCycle === 'annual'
            ? 'anual'
            : firstOffer.durationMonths > 1
                ? `${firstOffer.durationMonths} meses`
                : 'mensual';
        if (hasLicensePlanChangeInCart) {
            return `Vas a cambiar de ${currentPlan} a ${targetPlan}. La nueva licencia ${durationLabel} se activará cuando termine la actual, salvo que hoy solo esté vigente Express.`;
        }
        return `La licencia ${targetPlan} ${durationLabel} se añadirá a la cola comercial de la empresa y empezará al finalizar la vigente.`;
    }, [cartLicenseProducts, hasLicensePlanChangeInCart, licenseInfo?.licencia_actual]);

    const cartQuantities = useMemo(
        () => Object.fromEntries(cartProducts.map((line) => [String(line.productId), line.quantity])),
        [cartProducts],
    );
    const cartCount = cartProducts.reduce((sum, line) => sum + line.quantity, 0);
    const cartTotal = useMemo(
        () => cartProducts.reduce((sum, line) => sum + line.lineTotal, 0),
        [cartProducts],
    );
    const billingStatus = useMemo(() => resolveBillingStatus(user, activeCompany), [activeCompany, user]);
    const canCheckoutCart = canBuy
        && cartCount > 0
        && billingStatus.isComplete
        && !checkingOut
        && (paymentMethods.length === 0 || Boolean(selectedPaymentMethod))
        && (selectedPaymentMethod !== 'bank_transfer' || Boolean(String(bankTransferReference || '').trim()));

    const handleAddToCart = async (product) => {
        if (!canBuy) {
            await appAlert({
                title: 'Compras no disponibles',
                message: 'Solo los administradores de empresa pueden comprar en Tienda.',
            });
            return;
        }

        const salesConfig = resolveSalesConfig(product);
        const existingLine = cartLines.find((line) => String(line.productId) === String(product.id));

        if (existingLine && !salesConfig.allowsMultiple) {
            setCartNotice({
                tone: 'warning',
                message: `“${product.titulo}” ya está en el carrito y solo admite compra unitaria.`,
            });
            return;
        }

        setCartLastActivityAt(Date.now());
        setCartLines((current) => {
            const currentIndex = current.findIndex((line) => String(line.productId) === String(product.id));
            if (currentIndex === -1) {
                return [...current, { productId: product.id, quantity: salesConfig.defaultQuantity }];
            }

            const next = [...current];
            const currentLine = next[currentIndex];
            next[currentIndex] = {
                ...currentLine,
                quantity: normalizeCartQuantity(product, currentLine.quantity + salesConfig.quantityStep),
            };
            return next;
        });
    };

    const handleOpenProductDetails = (product) => {
        if (!product?.id) return;
        const nextRecentIds = pushMarketplaceRecentlyViewed(user?.id, product.id);
        setRecentlyViewedIds(nextRecentIds);
        setDetailProduct(product);
    };

    const handleRemoveFromCart = (productId) => {
        setCartLastActivityAt(Date.now());
        setCartLines((current) => current.filter((line) => String(line.productId) !== String(productId)));
    };

    const handleCartLineQuantityChange = (product, nextQuantity) => {
        const salesConfig = resolveSalesConfig(product);
        if (!salesConfig.allowsMultiple) return;

        setCartLastActivityAt(Date.now());
        setCartLines((current) => current.map((line) => {
            if (String(line.productId) !== String(product.id)) return line;
            return {
                ...line,
                quantity: normalizeCartQuantity(product, nextQuantity),
            };
        }));
    };

    const handleOpenBillingCompletion = async () => {
        setCartOpen(false);
        await appAlert({
            title: 'Completar datos de facturación',
            message: 'Antes de pagar, completa en Configuración los datos fiscales y de contacto de la empresa activa.',
        });
        navigate('/settings');
    };

    const handleCheckout = async () => {
        if (!cartProducts.length) {
            await appAlert({
                title: 'Carrito vacío',
                message: 'Añade al menos un producto antes de continuar con el pago.',
            });
            return;
        }

        if (!billingStatus.isComplete) {
            await appAlert({
                title: 'Facturación incompleta',
                message: `Faltan datos obligatorios para facturación: ${billingStatus.missing.join(', ')}.`,
            });
            return;
        }

        const confirmed = await appConfirm({
            title: 'Confirmar compra',
            message: `${licenseCheckoutNotice ? `${licenseCheckoutNotice}\n\n` : ''}Vas a confirmar ${cartCount} unidad(es) por un total de ${formatCurrency(cartTotal, cartProducts[0]?.product?.moneda || 'USD')}. ¿Deseas continuar?`,
            confirmLabel: 'Confirmar venta',
            cancelLabel: 'Revisar carrito',
        });

        if (!confirmed) return;

        try {
            setCheckingOut(true);
            if (paymentMethods.length > 0) {
                const selectedMethod = paymentMethods.find((method) => method.slug === selectedPaymentMethod) || paymentMethods[0];
                const draftResponse = await marketplaceApi.createCheckoutDraft({
                    payment_method: selectedMethod?.slug || null,
                    items: cartProducts.map((line) => ({
                        product_id: line.productId,
                        quantity: line.quantity,
                    })),
                });

                if (selectedMethod?.slug === 'bank_transfer') {
                    const orderResponse = await marketplaceApi.submitBankTransferCheckout({
                        checkout_draft_id: draftResponse?.data?.id,
                        transfer_reference: String(bankTransferReference || '').trim(),
                    });
                    setCartLines([]);
                    setCartLastActivityAt(null);
                    setBankTransferReference('');
                    removeStoredCart(user?.id);
                    setCartOpen(false);
                    await appAlert({
                        title: 'Pedido pendiente de validación',
                        message: `La compra quedó registrada${orderResponse?.data?.id ? ` como pedido #${orderResponse.data.id}` : ''} y está pendiente de validación bancaria por parte del sistema.`,
                        tone: 'info',
                    });
                    navigate('/marketplace/buyer');
                    return;
                }
                if (selectedMethod?.slug === 'payphone') {
                    setPayPhonePreparing(true);
                    const preparedResponse = await marketplaceApi.preparePayPhoneCheckout({
                        checkout_draft_id: draftResponse?.data?.id,
                    });
                    setPayPhoneCheckoutConfig(preparedResponse?.data || null);
                    setCartOpen(false);
                    setPayPhoneModalOpen(true);
                    await appAlert({
                        title: 'PayPhone listo',
                        message: 'Se abrió la cajita de pagos. Una vez confirmado el cobro, volverás a Tienda para activar la compra.',
                        tone: 'info',
                    });
                    return;
                }
                if (selectedMethod?.slug === 'paypal') {
                    setPayPalPreparing(true);
                    const preparedResponse = await marketplaceApi.preparePayPalCheckout({
                        checkout_draft_id: draftResponse?.data?.id,
                    });
                    setPayPalCheckoutConfig(preparedResponse?.data || null);
                    setCartOpen(false);
                    setPayPalModalOpen(true);
                    await appAlert({
                        title: 'PayPal listo',
                        message: 'Se abrió el flujo de PayPal. La compra solo se activará cuando backend confirme la captura del pago.',
                        tone: 'info',
                    });
                    return;
                }
                await appAlert({
                    title: 'Checkout preparado',
                    message: `Se registró el borrador de compra para ${selectedMethod?.nombre || 'la forma de pago seleccionada'}. La confirmación operativa de este método continuará en el siguiente slice del sistema.`,
                    tone: 'info',
                });
                return;
            }
            const { data } = await marketplaceApi.checkout({
                items: cartProducts.map((line) => ({
                    product_id: line.productId,
                    quantity: line.quantity,
                })),
            });
            setCartLines([]);
            setCartLastActivityAt(null);
            removeStoredCart(user?.id);
            setCartOpen(false);
            await appAlert({
                title: 'Compra completada',
                message: `La venta quedó confirmada correctamente${data?.id ? ` con pedido #${data.id}` : ''}.`,
                tone: 'success',
            });
            navigate('/marketplace/buyer');
        } catch (error) {
            await appAlert({
                title: 'No se pudo completar la compra',
                message: error?.response?.data?.detail || 'Ocurrió un error al procesar el checkout.',
                tone: 'danger',
            });
        } finally {
            setPayPhonePreparing(false);
            setPayPalPreparing(false);
            setCheckingOut(false);
        }
    };

    const clearAllFilters = () => {
        const maxCap = resolvePriceCap(products);
        setQuery('');
        setSelectedCategory('');
        setSelectedSort('default');
        setSaasCatalogOnly(false);
        setDraftPriceFloor(0);
        setAppliedPriceFloor(0);
        setDraftPriceCap(maxCap);
        setAppliedPriceCap(maxCap);
    };

    const absolutePriceCap = resolvePriceCap(products);
    const leftPercent = absolutePriceCap <= 0 ? 0 : (draftPriceFloor / absolutePriceCap) * 100;
    const rightPercent = absolutePriceCap <= 0 ? 100 : (draftPriceCap / absolutePriceCap) * 100;

    return (
        <div data-marketplace-workspace="true" className="h-full overflow-hidden bg-white">
            {cartNotice ? (
                <div className="pointer-events-none fixed right-5 top-24 z-[90]">
                    <div className={`flex max-w-[420px] items-start gap-3 rounded-2xl border bg-white/95 px-4 py-3 shadow-[0_20px_40px_rgba(0,0,0,0.12)] backdrop-blur ${
                        cartNotice.tone === 'info'
                            ? 'border-sky-200'
                            : cartNotice.tone === 'success'
                                ? 'border-emerald-200'
                                : 'border-amber-200'
                    }`}>
                        <CircleAlert className={`mt-0.5 h-5 w-5 shrink-0 ${
                            cartNotice.tone === 'info'
                                ? 'text-sky-600'
                                : cartNotice.tone === 'success'
                                    ? 'text-emerald-600'
                                    : 'text-amber-600'
                        }`} />
                        <div className="min-w-0">
                            <p className={`text-[11px] font-black uppercase tracking-[0.16em] ${
                                cartNotice.tone === 'info'
                                    ? 'text-sky-700'
                                    : cartNotice.tone === 'success'
                                        ? 'text-emerald-700'
                                        : 'text-amber-700'
                            }`}>
                                {cartNotice.title || 'Aviso de carrito'}
                            </p>
                            <p className="mt-1 text-sm leading-relaxed text-zinc-700">
                                {cartNotice.message}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}
            <div className="mx-auto flex h-full max-w-[1680px] flex-col px-4 py-6 sm:px-6 lg:px-10">
                <div className="flex h-full min-h-0 flex-col gap-6">
                    <div className="sticky top-0 z-30 -mx-4 bg-white/95 px-4 pb-4 pt-1 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
                        <header className="rounded-[2rem] border border-zinc-200 bg-white px-5 py-4 shadow-[0_10px_35px_rgba(0,0,0,0.04)] md:px-6 xl:px-8">
                            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex min-w-0 items-center gap-4 xl:gap-6">
                                    <button
                                        type="button"
                                        onClick={() => navigate('/dashboard')}
                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                                        title="Volver al dashboard"
                                    >
                                        <ArrowLeft className="h-5 w-5" />
                                    </button>
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2 xl:gap-3">
                                            <span className="inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
                                            <h1 className="truncate text-xl font-black uppercase tracking-tight text-zinc-900 xl:text-2xl">
                                                Tienda Marketplace
                                            </h1>
                                            <span className="inline-flex rounded-xl border border-orange-100 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#F39200]">
                                                Tienda
                                            </span>
                                        </div>
                                        <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 xl:text-[11px]">
                                            {currentCompanyName ? `Empresa activa: ${currentCompanyName}` : 'Catalogo comercial clasico de GiProy'}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap xl:items-center xl:justify-end">
                                    {canBuy ? (
                                        <button
                                            type="button"
                                            onClick={() => setCartOpen(true)}
                                            className="relative inline-flex h-[58px] items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-zinc-800 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                                            title="Abrir carrito"
                                        >
                                            <ShoppingCart className="h-5 w-5" />
                                            {cartCount > 0 ? (
                                                <span className="absolute -right-2 -top-2 inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-[#F39200] px-1.5 text-[10px] font-black text-white">
                                                    {cartCount}
                                                </span>
                                            ) : null}
                                        </button>
                                    ) : null}
                                    {canBuy ? (
                                        <StorefrontToggleTile
                                            icon={CreditCard}
                                            label="Planes SaaS"
                                            active={saasCatalogOnly}
                                            onClick={() => {
                                                setSaasCatalogOnly((current) => !current);
                                                setSelectedCategory('');
                                            }}
                                        />
                                    ) : null}
                                    {canBuy ? (
                                        <StorefrontControlTile
                                            icon={ShoppingBag}
                                            label="Mis Compras"
                                            onClick={() => navigate('/marketplace/buyer')}
                                        />
                                    ) : null}
                                    {canSell ? (
                                        <StorefrontControlTile
                                            icon={Store}
                                            label="Mis Ventas"
                                            onClick={() => navigate('/dashboard/seller')}
                                        />
                                    ) : null}
                                    {canAccessAdminPanel ? (
                                        <StorefrontControlTile
                                            icon={Play}
                                            label="Panel Administrador"
                                            dark
                                            onClick={() => navigate('/dashboard/admin')}
                                        />
                                    ) : null}
                                </div>
                            </div>
                        </header>

                        <section className="mt-4 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px] xl:items-start 2xl:grid-cols-[minmax(0,1fr)_290px]">
                                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_230px_270px] xl:grid-cols-[minmax(0,1fr)_240px_280px]">
                                    <div className="flex min-h-[52px] items-center">
                                        <p className="text-[11px] font-black tracking-tight text-zinc-700 sm:text-[12px]">
                                            Mostrando {rangeStart}-{rangeEnd} de {totalResults} resultados
                                        </p>
                                    </div>
                                    <div ref={sortMenuRef} className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setSortMenuOpen((current) => !current)}
                                            className="flex min-h-[52px] w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 shadow-sm transition-colors hover:border-zinc-300"
                                        >
                                            <span className="text-[11px] font-black tracking-tight text-zinc-700 sm:text-[12px]">
                                                {SORT_OPTIONS[selectedSort]}
                                            </span>
                                            <ChevronDown className={`h-4 w-4 text-zinc-500 transition-transform ${sortMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {sortMenuOpen ? (
                                            <div className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-40 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
                                                {Object.entries(SORT_OPTIONS).map(([value, label]) => {
                                                    const isActive = value === selectedSort;
                                                    return (
                                                        <button
                                                            key={value}
                                                            type="button"
                                                            onClick={() => {
                                                                setSelectedSort(value);
                                                                setSortMenuOpen(false);
                                                            }}
                                                            className={`flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors ${
                                                                isActive
                                                                    ? 'bg-zinc-100 text-zinc-950'
                                                                    : 'text-zinc-700 hover:bg-zinc-50'
                                                            }`}
                                                        >
                                                            <span className="text-[11px] font-black tracking-tight sm:text-[12px]">
                                                                {label}
                                                            </span>
                                                            {isActive ? <Check className="h-4 w-4 text-[#F39200]" /> : null}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        ) : null}
                                    </div>
                                <ClearSearchField
                                    value={query}
                                    onValueChange={setQuery}
                                    placeholder="Filtrar catálogo..."
                                    containerClassName="min-h-[52px]"
                                    inputClassName="h-[52px] w-full rounded-xl border border-zinc-200 bg-white pl-4 pr-12 text-[11px] font-black tracking-tight text-zinc-700 outline-none placeholder:font-bold placeholder:text-zinc-400 sm:text-[12px]"
                                    searchIconClassName="left-auto right-4 h-5 w-5 text-zinc-800 group-focus-within:text-[#F39200]"
                                    clearButtonClassName="right-14"
                                />
                            </div>
                        </section>
                    </div>

                    <section className="grid min-h-0 flex-1 gap-6 xl:grid-cols-[minmax(0,1fr)_280px] 2xl:grid-cols-[minmax(0,1fr)_290px]">
                        <div className="relative min-h-0 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white">
                            <div
                                ref={scrollContainerRef}
                                className="giproy-motion-scrollbar-hide h-full min-h-0 overflow-y-auto overscroll-contain px-5 py-5 pr-8"
                            >
                                {loading ? (
                                    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                        {Array.from({ length: 12 }).map((_, index) => (
                                            <div key={`marketplace-loading-${index}`} className="overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white">
                                                <div className="h-[160px] animate-pulse bg-zinc-200 xl:h-[168px] 2xl:h-[176px]" />
                                                <div className="space-y-3 px-4 py-3 xl:px-4 xl:py-3.5 2xl:px-5">
                                                    <div className="h-5 w-2/3 animate-pulse rounded bg-zinc-200" />
                                                    <div className="h-5 w-3/4 animate-pulse rounded bg-zinc-200" />
                                                    <div className="h-5 w-1/3 animate-pulse rounded bg-zinc-200" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : error ? (
                                    <div className="rounded-[2rem] border border-red-200 bg-red-50 px-6 py-8 text-center">
                                        <p className="text-xl font-black tracking-tight text-red-700">{error}</p>
                                    </div>
                                ) : totalResults === 0 ? (
                                    <div className="rounded-[2rem] border border-zinc-200 bg-zinc-50 px-6 py-10 text-center">
                                        <p className="text-sm font-black uppercase tracking-[0.18em] text-zinc-500">Sin resultados</p>
                                        <h2 className="mt-3 text-[2rem] font-black tracking-tight text-zinc-950">
                                            No hay productos para esta combinacion de busqueda
                                        </h2>
                                        <p className="mt-3 text-lg leading-relaxed text-zinc-600">
                                            Limpia la busqueda, cambia de categoria o amplia el rango de precio para seguir explorando la tienda.
                                        </p>
                                        <button
                                            type="button"
                                            onClick={clearAllFilters}
                                            className="mt-6 inline-flex items-center justify-center rounded-2xl bg-[#F39200] px-6 py-3 text-base font-black text-white transition-colors hover:bg-[#E94E1B]"
                                        >
                                            Limpiar filtros
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {saasCatalogOnly ? (
                                            <div className="mb-5 rounded-[1.25rem] border border-blue-100 bg-blue-50/70 px-4 py-3">
                                                <div className="flex flex-wrap items-center justify-between gap-3">
                                                    <div>
                                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-[#136191]">Catálogo SaaS oficial</p>
                                                        <p className="mt-1 text-sm font-semibold text-zinc-700">
                                                            Licencias, packs y módulos definidos por Superadministración para venta en Marketplace.
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setSaasCatalogOnly(false)}
                                                        className="inline-flex min-h-[34px] items-center justify-center rounded-xl border border-blue-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-[#136191] transition-colors hover:bg-blue-50"
                                                    >
                                                        Ver todo
                                                    </button>
                                                </div>
                                            </div>
                                        ) : null}
                                        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                                            {visibleProducts.map((product) => (
                                                <ProductVisualCard
                                                    key={product.id}
                                                    product={product}
                                                    canBuy={canBuy}
                                                    inCartQuantity={cartQuantities[String(product.id)] || 0}
                                                    onAddToCart={handleAddToCart}
                                                    onOpenDetails={handleOpenProductDetails}
                                                />
                                            ))}
                                        </div>
                                        {hasMoreProducts ? <div ref={infiniteSentinelRef} className="h-2 w-full" /> : null}
                                    </>
                                )}
                            </div>
                            <MotionScrollbar targetRef={scrollContainerRef} className="right-0" />
                        </div>
                        <aside className="relative min-h-0 overflow-hidden rounded-[1.65rem] border border-zinc-200 bg-white/95 shadow-[0_18px_45px_rgba(15,23,42,0.05)]">
                            <div className="sticky top-0 z-10 border-b border-zinc-100 bg-white/95 px-4 py-3.5 backdrop-blur-sm xl:px-5">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                    Opciones
                                </p>
                            </div>
                            <div
                                ref={optionsContainerRef}
                                className="giproy-motion-scrollbar-hide h-[calc(100%-47px)] min-h-0 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 pr-7 xl:px-5"
                            >
                            <section className="rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-4">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h2 className="text-[1.05rem] font-black tracking-tight text-zinc-950">Planes y packs SaaS</h2>
                                        <p className="mt-1 text-[0.76rem] font-bold leading-relaxed text-zinc-500">
                                            Catálogo oficial de licencias, packs y módulos vendibles.
                                        </p>
                                    </div>
                                    <span className="inline-flex h-7 min-w-[34px] items-center justify-center rounded-lg bg-blue-50 px-2 text-[11px] font-black text-[#136191]">
                                        {officialSaasProducts.length}
                                    </span>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSaasCatalogOnly((current) => !current);
                                        setSelectedCategory('');
                                    }}
                                    className={`mt-4 inline-flex min-h-[42px] w-full items-center justify-center rounded-xl border px-4 text-[10px] font-black uppercase tracking-[0.16em] transition-colors ${
                                        saasCatalogOnly
                                            ? 'border-[#136191] bg-blue-50 text-[#136191]'
                                            : 'border-zinc-200 bg-zinc-50 text-zinc-600 hover:border-[#136191]/40 hover:text-[#136191]'
                                    }`}
                                >
                                    {saasCatalogOnly ? 'Mostrando catálogo SaaS' : 'Ver catálogo SaaS'}
                                </button>
                            </section>

                            <section className="rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-4">
                                <h2 className="text-[1.05rem] font-black tracking-tight text-zinc-950">Categorías</h2>
                                <div className="mt-3">
                                    {categoryEntries.map((category) => (
                                        <SidebarCategoryItem
                                            key={category.id}
                                            category={category}
                                            count={category.count}
                                            isActive={category.id === 'all' ? !selectedCategory : String(selectedCategory) === String(category.id)}
                                            onClick={() => setSelectedCategory((current) => (
                                                category.id === 'all'
                                                    ? ''
                                                    : (String(current) === String(category.id) ? '' : String(category.id))
                                            ))}
                                        />
                                    ))}
                                </div>
                            </section>

                            <section className="rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-4">
                                <h2 className="text-[1.05rem] font-black tracking-tight text-zinc-950">Precio</h2>
                                <div className="mt-4 space-y-4">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between gap-3 text-[0.78rem] font-black text-zinc-500">
                                            <span>Min: ${Number(draftPriceFloor || 0).toFixed(0)}</span>
                                            <span>Max: ${Number(draftPriceCap || 0).toFixed(0)}</span>
                                        </div>
                                        <div className="relative h-8">
                                            <div className="absolute left-0 right-0 top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#B7BEC5] shadow-[inset_0_1px_1px_rgba(15,23,42,0.16)]" />
                                            <div
                                                className="absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full bg-[#9FA8B1]"
                                                style={{
                                                    left: `${leftPercent}%`,
                                                    width: `${Math.max(rightPercent - leftPercent, (PRICE_STEP / Math.max(absolutePriceCap, PRICE_STEP)) * 100)}%`,
                                                }}
                                            />
                                            <input
                                                type="range"
                                                min={0}
                                                max={absolutePriceCap}
                                                step={PRICE_STEP}
                                                value={draftPriceFloor}
                                                onChange={(event) => {
                                                    const nextFloor = Math.min(Number(event.target.value), draftPriceCap - PRICE_STEP);
                                                    setDraftPriceFloor(Math.max(0, nextFloor));
                                                }}
                                                className="giproy-range-thumb absolute left-0 top-1/2 -translate-y-1/2"
                                                aria-label="Precio minimo"
                                            />
                                            <input
                                                type="range"
                                                min={0}
                                                max={absolutePriceCap}
                                                step={PRICE_STEP}
                                                value={draftPriceCap}
                                                onChange={(event) => {
                                                    const nextCap = Math.max(Number(event.target.value), draftPriceFloor + PRICE_STEP);
                                                    setDraftPriceCap(Math.min(absolutePriceCap, nextCap));
                                                }}
                                                className="giproy-range-thumb absolute left-0 top-1/2 -translate-y-1/2"
                                                aria-label="Precio maximo"
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setAppliedPriceFloor(draftPriceFloor);
                                                setAppliedPriceCap(draftPriceCap);
                                            }}
                                            className="inline-flex h-10 items-center justify-center rounded-xl bg-[#F39200] px-4 text-[0.78rem] font-black text-white shadow-sm transition-colors hover:bg-[#E94E1B]"
                                        >
                                            Filtrar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setDraftPriceFloor(0);
                                                setAppliedPriceFloor(0);
                                                setDraftPriceCap(absolutePriceCap);
                                                setAppliedPriceCap(absolutePriceCap);
                                            }}
                                            className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-[0.78rem] font-black text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-950"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                    <p className="rounded-xl bg-zinc-50 px-3 py-2 text-[0.76rem] font-bold text-zinc-500">
                                        Precio: ${Number(appliedPriceFloor || 0).toFixed(0)} - ${Number(appliedPriceCap || 0).toFixed(0)}
                                    </p>
                                </div>
                            </section>

                            <section className="rounded-[1.35rem] border border-zinc-200 bg-white px-4 py-4">
                                <h2 className="text-[1.05rem] font-black tracking-tight text-zinc-950">Recientes</h2>
                                <div className="mt-3 space-y-2">
                                    {recentProducts.length > 0 ? (
                                        recentProducts.map((product) => (
                                            <RecentProductRow key={product.id} product={product} onOpenDetails={handleOpenProductDetails} />
                                        ))
                                    ) : (
                                        <div className="rounded-xl border border-dashed border-zinc-300 px-3 py-4 text-center text-[0.82rem] font-medium leading-relaxed text-zinc-500">
                                            Aun no hay productos recientes para mostrar.
                                        </div>
                                    )}
                                </div>
                            </section>
                            </div>
                            <MotionScrollbar targetRef={optionsContainerRef} className="right-1" style={{ top: 47, bottom: 8 }} />
                        </aside>
                    </section>
                </div>
            </div>

            <Dialog open={payPhoneModalOpen} onOpenChange={setPayPhoneModalOpen}>
                <DialogContent showCloseButton={false} className="flex h-[100dvh] w-screen max-w-none flex-col overflow-hidden rounded-none border-0 bg-white p-0 sm:h-auto sm:max-h-[88dvh] sm:w-[calc(100vw-2rem)] sm:max-w-[720px] sm:rounded-[1.75rem] sm:border sm:border-zinc-200">
                    <DialogHeader className="border-b border-zinc-200 px-4 py-4 sm:px-6 sm:py-5">
                        <DialogTitle className="text-[1.3rem] font-black tracking-tight text-zinc-950 sm:text-[1.45rem]">
                            Pagar con PayPhone
                        </DialogTitle>
                        <DialogDescription className="max-w-[62ch] text-sm leading-relaxed text-zinc-500">
                            Completa el pago desde la cajita segura de PayPhone. Cuando el cobro se confirme volverás a Tienda y activaremos la compra.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative min-h-0 flex-1">
                    <div ref={payPhoneModalScrollRef} className="giproy-motion-scrollbar-hide h-full min-h-0 overflow-y-auto overscroll-contain px-4 py-5 pr-8 sm:px-6">
                        <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 px-5 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
                                Checkout externo confirmado por backend
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-sky-900">
                                No cerraremos la compra solo por abrir la cajita. El acceso al producto se habilita únicamente cuando PayPhone confirme el cobro.
                            </p>
                        </div>
                        <div className="mt-5 rounded-[1.6rem] border border-zinc-200 bg-white p-4 shadow-sm">
                            <div id={payPhoneContainerId} className="min-h-[240px]" />
                        </div>
                        {payPhonePreparing || payPhoneConfirming ? (
                            <div className="mt-4 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-600">
                                {payPhoneConfirming
                                    ? 'Confirmando el estado del pago con PayPhone...'
                                    : 'Preparando la cajita de pagos de PayPhone...'}
                            </div>
                        ) : null}
                    </div>
                    <MotionScrollbar targetRef={payPhoneModalScrollRef} className="right-0" />
                    </div>
                    <DialogFooter className="shrink-0 border-t border-zinc-200 bg-white/95 px-4 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:px-6 sm:py-5 sm:justify-between sm:space-x-0">
                        <p className="max-w-[44ch] text-xs leading-relaxed text-zinc-500">
                            Si cancelas el proceso, el carrito seguirá intacto para reintentar el pago más tarde.
                        </p>
                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={() => setPayPhoneModalOpen(false)}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 px-5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                Cerrar
                            </button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={payPalModalOpen} onOpenChange={setPayPalModalOpen}>
                <DialogContent showCloseButton={false} className="flex h-[100dvh] w-screen max-w-none flex-col overflow-hidden rounded-none border-0 bg-white p-0 sm:h-auto sm:max-h-[88dvh] sm:w-[calc(100vw-2rem)] sm:max-w-[720px] sm:rounded-[1.75rem] sm:border sm:border-zinc-200">
                    <DialogHeader className="border-b border-zinc-200 px-4 py-4 sm:px-6 sm:py-5">
                        <DialogTitle className="text-[1.3rem] font-black tracking-tight text-zinc-950 sm:text-[1.45rem]">
                            Pagar con PayPal
                        </DialogTitle>
                        <DialogDescription className="max-w-[62ch] text-sm leading-relaxed text-zinc-500">
                            Completa el pago desde PayPal. La compra solo se activará cuando el backend confirme la captura correctamente.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="relative min-h-0 flex-1">
                    <div ref={payPalModalScrollRef} className="giproy-motion-scrollbar-hide h-full min-h-0 overflow-y-auto overscroll-contain px-4 py-5 pr-8 sm:px-6">
                        <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 px-5 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
                                Captura confirmada por backend
                            </p>
                            <p className="mt-2 text-sm leading-relaxed text-sky-900">
                                No activaremos el pedido por una señal del navegador. PayPal debe devolver la captura y backend debe validarla antes de liberar el acceso.
                            </p>
                        </div>
                        <div className="mt-5 rounded-[1.6rem] border border-zinc-200 bg-white p-4 shadow-sm">
                            <div id={payPalContainerId} className="min-h-[180px]" />
                        </div>
                        {payPalPreparing || payPalProcessing ? (
                            <div className="mt-4 rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-medium text-zinc-600">
                                {payPalProcessing
                                    ? 'Capturando y validando el pago con PayPal...'
                                    : 'Preparando el flujo de PayPal...'}
                            </div>
                        ) : null}
                    </div>
                    <MotionScrollbar targetRef={payPalModalScrollRef} className="right-0" />
                    </div>
                    <DialogFooter className="shrink-0 border-t border-zinc-200 bg-white/95 px-4 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:px-6 sm:py-5 sm:justify-between sm:space-x-0">
                        <p className="max-w-[44ch] text-xs leading-relaxed text-zinc-500">
                            Si cancelas el proceso, el carrito seguirá intacto para reintentar el pago cuando quieras.
                        </p>
                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
                            <button
                                type="button"
                                onClick={() => setPayPalModalOpen(false)}
                                className="inline-flex h-11 items-center justify-center rounded-2xl border border-zinc-200 px-5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50"
                            >
                                Cerrar
                            </button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={cartOpen} onOpenChange={setCartOpen}>
                <DialogContent className="flex h-[100dvh] w-screen max-w-none flex-col overflow-hidden rounded-none border-0 bg-white p-0 sm:h-auto sm:max-h-[88dvh] sm:w-[calc(100vw-2rem)] sm:max-w-[860px] sm:rounded-[1.75rem] sm:border sm:border-zinc-200">
                    <DialogHeader className="border-b border-zinc-200 px-4 py-4 sm:px-6 sm:py-5">
                        <DialogTitle className="text-[1.3rem] font-black tracking-tight text-zinc-950 sm:text-[1.45rem]">
                            Carrito de compras
                        </DialogTitle>
                        <DialogDescription className="max-w-[60ch] text-sm text-zinc-500">
                            Revisa tus productos, valida facturación y confirma la compra antes del checkout final.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="relative min-h-0 flex-1">
                    <div ref={cartModalScrollRef} className="giproy-motion-scrollbar-hide h-full min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pr-8 sm:px-6 sm:py-5">
                        {cartProducts.length === 0 ? (
                            <div className="rounded-[1.5rem] border border-dashed border-zinc-300 px-6 py-10 text-center">
                                <p className="text-sm font-black uppercase tracking-[0.16em] text-zinc-500">Carrito vacío</p>
                                <p className="mt-3 text-base leading-relaxed text-zinc-600">
                                    Añade productos desde el catálogo para preparar la compra.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-5">
                                {!billingStatus.isComplete ? (
                                    <div className="rounded-[1.5rem] border border-amber-200 bg-amber-50 px-5 py-4">
                                        <div className="flex items-start gap-3">
                                            <CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
                                            <div className="min-w-0">
                                                <p className="text-sm font-black uppercase tracking-[0.16em] text-amber-700">
                                                    Datos de facturación incompletos
                                                </p>
                                                <p className="mt-2 text-sm leading-relaxed text-amber-900">
                                                    Antes de pagar debes completar: {billingStatus.missing.join(', ')}.
                                                </p>
                                                <button
                                                    type="button"
                                                    onClick={handleOpenBillingCompletion}
                                                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-amber-600 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-amber-700"
                                                >
                                                    Completar datos
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 px-5 py-4">
                                        <p className="text-sm font-black uppercase tracking-[0.16em] text-emerald-700">
                                            Facturación verificada
                                        </p>
                                        <p className="mt-2 text-sm leading-relaxed text-emerald-900">
                                            La compra se emitirá a nombre de {billingStatus.companyName || 'la empresa activa'} con los datos de facturación ya registrados.
                                        </p>
                                    </div>
                                )}

                                {licenseCheckoutNotice ? (
                                    <div className={`rounded-[1.5rem] border px-5 py-4 ${hasLicensePlanChangeInCart ? 'border-orange-200 bg-orange-50' : 'border-blue-200 bg-blue-50'}`}>
                                        <p className={`text-sm font-black uppercase tracking-[0.16em] ${hasLicensePlanChangeInCart ? 'text-[#A55A00]' : 'text-[#136191]'}`}>
                                            {hasLicensePlanChangeInCart ? 'Cambio de plan detectado' : 'Licencia en preparación'}
                                        </p>
                                        <p className={`mt-2 text-sm leading-relaxed ${hasLicensePlanChangeInCart ? 'text-orange-900' : 'text-sky-900'}`}>
                                            {licenseCheckoutNotice}
                                        </p>
                                    </div>
                                ) : null}

                                {paymentMethods.length > 0 || paymentMethodsLoading ? (
                                    <div className="rounded-[1.5rem] border border-sky-200 bg-sky-50 px-5 py-4">
                                        <div className="flex items-start gap-3">
                                            <CreditCard className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-black uppercase tracking-[0.16em] text-sky-700">
                                                    Método de pago
                                                </p>
                                                <p className="mt-2 text-sm leading-relaxed text-sky-900">
                                                    Selecciona la forma de pago con la que se preparará este checkout.
                                                </p>
                                                <div className="relative mt-4 max-w-[360px]">
                                                    <AnimatedSelect
                                                        value={selectedPaymentMethod}
                                                        onChange={(event) => setSelectedPaymentMethod(event.target.value)}
                                                        disabled={paymentMethodsLoading}
                                                        className="h-11 w-full appearance-none rounded-2xl border border-sky-200 bg-white px-4 pr-10 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#136191] disabled:cursor-not-allowed disabled:bg-sky-50"
                                                    >
                                                        {paymentMethodsLoading ? (
                                                            <option value="">Cargando métodos...</option>
                                                        ) : (
                                                            paymentMethods.map((method) => (
                                                                <option key={method.slug} value={method.slug}>
                                                                    {method.nombre}
                                                                </option>
                                                            ))
                                                        )}
                                                    </AnimatedSelect>
                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400">
                                                        <ChevronDown className="h-4 w-4" />
                                                    </span>
                                                </div>
                                                {selectedPaymentMethod === 'bank_transfer' ? (
                                                    <div className="mt-4 max-w-[420px] space-y-2">
                                                        <label className="block space-y-2">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
                                                                Referencia de transferencia
                                                            </span>
                                                            <input
                                                                type="text"
                                                                value={bankTransferReference}
                                                                onChange={(event) => setBankTransferReference(event.target.value)}
                                                                placeholder="Ej. COMPROBANTE-12345"
                                                                className="h-11 w-full rounded-2xl border border-sky-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#136191]"
                                                            />
                                                        </label>
                                                        <p className="text-xs leading-relaxed text-sky-900">
                                                            Esta referencia se usará para validar manualmente el pago antes de activar la compra.
                                                        </p>
                                                    </div>
                                                ) : null}
                                                {!paymentMethodsLoading && selectedPaymentMethod ? (
                                                    <p className="mt-3 max-w-[58ch] text-xs leading-relaxed text-sky-900">
                                                        {paymentMethods.find((method) => method.slug === selectedPaymentMethod)?.config_json?.public_text || ''}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    </div>
                                ) : null}

                                <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200">
                                    <div className="hidden grid-cols-[minmax(0,1fr)_90px_110px_110px_52px] gap-3 border-b border-zinc-200 bg-zinc-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500 md:grid">
                                        <span>Producto</span>
                                        <span className="text-center">Cantidad</span>
                                        <span className="text-right">Precio</span>
                                        <span className="text-right">Total</span>
                                        <span />
                                    </div>
                                    {cartProducts.map((line) => (
                                        <div
                                            key={`cart-row-${line.productId}`}
                                            className="grid gap-4 border-b border-zinc-100 px-4 py-4 last:border-b-0 md:grid-cols-[minmax(0,1fr)_90px_110px_110px_52px] md:gap-3"
                                        >
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-black text-zinc-900">{line.product.titulo}</p>
                                                <p className="mt-1 text-xs font-medium text-zinc-500">
                                                    {line.product.category?.nombre || PRODUCT_TYPE_LABELS[line.product.product_type] || 'Producto'}
                                                </p>
                                                <p className="mt-2 text-[11px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                                                    {line.salesConfig.allowsMultiple
                                                        ? `Paquete · paso ${line.salesConfig.quantityStep}`
                                                        : 'Compra unitaria'}
                                                </p>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] md:flex md:items-center md:justify-center">
                                                <div className="space-y-1 md:hidden">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Precio</p>
                                                    {line.hasDiscount ? (
                                                        <div className="space-y-0.5">
                                                            <p className="text-[11px] font-semibold text-zinc-400 line-through">
                                                                {formatCurrency(line.originalUnitPrice, line.product.moneda)}
                                                            </p>
                                                            <p className="text-sm font-bold text-zinc-700">
                                                                {formatCurrency(line.unitPrice, line.product.moneda)}
                                                            </p>
                                                        </div>
                                                    ) : (
                                                        <p className="text-sm font-bold text-zinc-700">
                                                            {formatCurrency(line.unitPrice, line.product.moneda)}
                                                        </p>
                                                    )}
                                                </div>
                                                <div className="space-y-1 md:hidden">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Total</p>
                                                    <p className="text-sm font-black text-zinc-950">
                                                        {formatCurrency(line.lineTotal, line.product.moneda)}
                                                    </p>
                                                </div>
                                                {line.salesConfig.allowsMultiple ? (
                                                    <div className="inline-flex items-center rounded-xl border border-zinc-200 bg-white md:justify-center">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCartLineQuantityChange(
                                                                line.product,
                                                                Math.max(line.salesConfig.minQuantity, line.quantity - line.salesConfig.quantityStep),
                                                            )}
                                                            disabled={line.quantity <= line.salesConfig.minQuantity}
                                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-l-xl text-lg font-bold transition-colors ${
                                                                line.quantity <= line.salesConfig.minQuantity
                                                                    ? 'cursor-not-allowed text-zinc-300'
                                                                    : 'text-zinc-700 hover:bg-zinc-50'
                                                            }`}
                                                        >
                                                            -
                                                        </button>
                                                        <div className="inline-flex min-w-[44px] items-center justify-center px-2 text-sm font-black text-zinc-900">
                                                            {line.quantity}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleCartLineQuantityChange(
                                                                line.product,
                                                                line.quantity + line.salesConfig.quantityStep,
                                                            )}
                                                            disabled={Boolean(line.salesConfig.maxQuantity && line.quantity >= line.salesConfig.maxQuantity)}
                                                            className={`inline-flex h-9 w-9 items-center justify-center rounded-r-xl text-lg font-bold transition-colors ${
                                                                line.salesConfig.maxQuantity && line.quantity >= line.salesConfig.maxQuantity
                                                                    ? 'cursor-not-allowed text-zinc-300'
                                                                    : 'text-zinc-700 hover:bg-zinc-50'
                                                            }`}
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center justify-center text-sm font-bold text-zinc-700">1</div>
                                                )}
                                                <div className="flex items-center justify-end md:hidden">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveFromCart(line.productId)}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-red-300 hover:text-red-600"
                                                        title="Quitar del carrito"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            </div>
                                            <div className="hidden items-center justify-end md:flex">
                                                {line.hasDiscount ? (
                                                    <div className="text-right">
                                                        <p className="text-[11px] font-semibold text-zinc-400 line-through">
                                                            {formatCurrency(line.originalUnitPrice, line.product.moneda)}
                                                        </p>
                                                        <p className="text-sm font-bold text-zinc-700">
                                                            {formatCurrency(line.unitPrice, line.product.moneda)}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <p className="text-sm font-bold text-zinc-700">
                                                        {formatCurrency(line.unitPrice, line.product.moneda)}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="hidden items-center justify-end text-sm font-black text-zinc-950 md:flex">
                                                {formatCurrency(line.lineTotal, line.product.moneda)}
                                            </div>
                                            <div className="hidden items-center justify-end md:flex">
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFromCart(line.productId)}
                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition-colors hover:border-red-300 hover:text-red-600"
                                                    title="Quitar del carrito"
                                                >
                                                    ×
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                    <MotionScrollbar targetRef={cartModalScrollRef} className="right-0" />
                    </div>

                    <DialogFooter className="shrink-0 border-t border-zinc-200 bg-white/95 px-4 py-4 shadow-[0_-10px_30px_rgba(15,23,42,0.05)] backdrop-blur-sm sm:px-6 sm:py-5 sm:justify-between sm:space-x-0">
                        <div className="space-y-1 text-left">
                            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                Resumen del pedido
                            </p>
                            <p className="text-[1.45rem] font-black tracking-tight text-zinc-950">
                                {formatCurrency(cartTotal, cartProducts[0]?.product?.moneda || 'USD')}
                            </p>
                            <p className="text-sm text-zinc-500">
                                {cartCount || 0} unidad(es) en preparación
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                            <button
                                type="button"
                                onClick={() => setCartOpen(false)}
                                className="inline-flex min-h-[48px] w-full items-center justify-center rounded-xl border border-zinc-200 px-5 text-sm font-bold text-zinc-700 transition-colors hover:border-zinc-300 hover:text-zinc-950 sm:w-auto"
                            >
                                Seguir comprando
                            </button>
                            <button
                                type="button"
                                onClick={handleCheckout}
                                disabled={!canCheckoutCart}
                                className={`inline-flex min-h-[48px] w-full items-center justify-center rounded-xl px-5 text-sm font-black text-white transition-colors sm:w-auto ${
                                    canCheckoutCart
                                        ? 'bg-[#1A1A1A] hover:bg-zinc-800'
                                        : 'cursor-not-allowed bg-zinc-300'
                                }`}
                            >
                                {checkingOut ? 'Procesando...' : 'Confirmar compra'}
                            </button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ProductDetailDialog
                product={detailProduct}
                canBuy={canBuy}
                inCartQuantity={detailProduct ? (cartQuantities[String(detailProduct.id)] || 0) : 0}
                onAddToCart={handleAddToCart}
                onOpenChange={(nextOpen) => {
                    if (!nextOpen) setDetailProduct(null);
                }}
            />
        </div>
    );
};

export default Marketplace;
