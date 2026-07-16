import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileText, PackageCheck, RotateCcw, ShoppingBag, Store } from 'lucide-react';

import marketplaceApi from '../api/marketplace';
import { AppModalBody, AppModalHeader, AppModalShell } from '../components/ui/app-modal';
import ClearSearchField from '../components/ui/ClearSearchField';
import MotionScrollbar from '../components/ui/MotionScrollbar';
import { AuthContext } from '../context/AuthContext';
import { buildMarketplaceEntityLink, getMarketplaceEntityActionLabel } from '../utils/marketplaceEntityLinks';
import { resolveMarketplacePaymentMethodLabel, resolveMarketplacePaymentStatusLabel, resolveMarketplaceRefundResolutionLabel } from '../utils/marketplacePaymentLabels';
import { appAlert, appConfirm } from '../utils/appDialog';
import {
    MarketplaceDashboardHeader,
    MarketplaceEmptyState,
    MarketplaceLoadingState,
    MarketplaceSectionCard,
    MarketplaceShell,
} from '../components/marketplace/MarketplaceVisualSystem';
import { ProjectSectionIconButton } from '../components/projects/ProjectSectionReportButton';
import ProjectSegmentedSwitch from '../components/projects/ProjectSegmentedSwitch';

const ENTITY_LABELS = {
    base_trabajo: 'Base Maestra',
    apu: 'APU',
    proyecto: 'Proyecto',
};

const ORDER_STATUS_META = {
    completed: {
        label: 'Completado',
        pill: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    awaiting_manual_validation: {
        label: 'Pendiente de validación bancaria',
        pill: 'border-amber-200 bg-amber-50 text-amber-700',
    },
    payment_rejected: {
        label: 'Pago rechazado',
        pill: 'border-red-200 bg-red-50 text-red-700',
    },
    expired: {
        label: 'Pedido expirado',
        pill: 'border-zinc-300 bg-zinc-100 text-zinc-700',
    },
    refunded: {
        label: 'Reembolsado',
        pill: 'border-sky-200 bg-sky-50 text-sky-700',
    },
};

const MarketplaceModalScrollBody = ({ children, className = '' }) => {
    const scrollRef = useRef(null);

    return (
        <AppModalBody className="relative min-h-0 flex-1 overflow-hidden">
            <div ref={scrollRef} className={`giproy-motion-scrollbar-hide h-full min-h-0 overflow-y-auto overscroll-contain pr-6 ${className}`}>
                {children}
            </div>
            <MotionScrollbar targetRef={scrollRef} className="right-0" />
        </AppModalBody>
    );
};

const INTERNAL_MODAL_HEADER_PROPS = {
    surfaceColor: '#1A1A1A',
    titleClassName: 'text-white',
    subtitleClassName: 'text-zinc-300',
    closeButtonClassName: 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/8 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200]/35',
};

const MarketplaceBuyerDashboard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const [orders, setOrders] = useState([]);
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingInvoiceId, setDownloadingInvoiceId] = useState(null);
    const [refundingOrderId, setRefundingOrderId] = useState(null);
    const [ordersModalOpen, setOrdersModalOpen] = useState(false);
    const [libraryModalOpen, setLibraryModalOpen] = useState(false);
    const [ordersSearch, setOrdersSearch] = useState('');
    const [ordersStatusFilter, setOrdersStatusFilter] = useState('all');
    const [ordersActionFilter, setOrdersActionFilter] = useState('all');
    const [librarySearch, setLibrarySearch] = useState('');
    const [libraryTypeFilter, setLibraryTypeFilter] = useState('all');
    const [libraryUsageFilter, setLibraryUsageFilter] = useState('all');
    const canBuy = (user?.marketplace_permissions || []).includes('marketplace.buy');
    const isSuperAdmin = (user?.rol || '').toLowerCase() === 'superadministrador';
    const profileComplete = isSuperAdmin || Boolean(user?.marketplace_profile_complete);

    const triggerBlobDownload = (data, filename, mimeType) => {
        const url = window.URL.createObjectURL(new Blob([data], { type: mimeType }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const handleInvoiceDownload = async (targetOrderId) => {
        try {
            setDownloadingInvoiceId(targetOrderId);
            const response = await marketplaceApi.downloadOrderInvoice(targetOrderId);
            triggerBlobDownload(response.data, `factura_marketplace_${targetOrderId}.pdf`, 'application/pdf');
        } catch (error) {
            globalThis.reportClientError?.('Error descargando factura del pedido:', error);
            appAlert('No se pudo descargar la factura del pedido.');
        } finally {
            setDownloadingInvoiceId(null);
        }
    };

    useEffect(() => {
        if (!canBuy || !profileComplete) return;
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                const [ordersRes, libraryRes] = await Promise.all([
                    marketplaceApi.getOrders(),
                    marketplaceApi.getBuyerLibrary(),
                ]);
                if (!cancelled) {
                    setOrders(ordersRes.data || []);
                    setAssets(libraryRes.data || []);
                }
            } catch (error) {
                globalThis.reportClientError?.('Error cargando biblioteca comprador:', error);
                if (!cancelled) {
                    setOrders([]);
                    setAssets([]);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [canBuy, profileComplete]);

    const reloadBuyerData = async () => {
        const [ordersRes, libraryRes] = await Promise.all([
            marketplaceApi.getOrders(),
            marketplaceApi.getBuyerLibrary(),
        ]);
        setOrders(ordersRes.data || []);
        setAssets(libraryRes.data || []);
    };

    const handleOrderRefund = async (order) => {
        const confirmed = await appConfirm({
            title: 'Solicitar devolución',
            message: `El pedido #${order.id} se reembolsará y sus activos entregados dejarán de estar disponibles. ¿Deseas continuar?`,
            confirmLabel: 'Solicitar devolución',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (!confirmed) return;

        try {
            setRefundingOrderId(order.id);
            await marketplaceApi.requestOrderRefund(order.id, {});
            await reloadBuyerData();
            await appAlert({
                title: 'Devolución solicitada',
                message: 'El pedido fue reembolsado y el acceso a los activos asociados quedó revocado.',
                tone: 'success',
            });
        } catch (error) {
            await appAlert({
                title: 'No se pudo completar la devolución',
                message: error?.response?.data?.detail || 'Ocurrió un error al procesar la devolución automática.',
                tone: 'danger',
            });
        } finally {
            setRefundingOrderId(null);
        }
    };

    const totals = useMemo(() => ({
        orders: orders.length,
        assets: assets.length,
        spent: orders.reduce((acc, item) => acc + Number(item.total || 0), 0),
    }), [orders, assets]);
    const pendingManualValidationCount = useMemo(
        () => orders.filter((order) => String(order.status || '').toLowerCase() === 'awaiting_manual_validation').length,
        [orders],
    );
    const completedOrdersCount = useMemo(
        () => orders.filter((order) => String(order.status || '').toLowerCase() === 'completed').length,
        [orders],
    );
    const internalOnlyAssetsCount = useMemo(
        () => assets.filter((asset) => asset.usage_policy?.publishable_marketplace === false).length,
        [assets],
    );
    const latestReadyAsset = useMemo(() => assets[0] || null, [assets]);
    const orderPreviewItems = useMemo(() => orders.slice(0, 4), [orders]);
    const assetPreviewItems = useMemo(() => assets.slice(0, 4), [assets]);
    const availableOrderStatuses = useMemo(
        () => [...new Set(orders.map((order) => String(order.status || '').toLowerCase()).filter(Boolean))],
        [orders]
    );
    const filteredOrders = useMemo(
        () => orders.filter((order) => {
            const orderStatus = String(order.status || '').toLowerCase();
            if (ordersStatusFilter !== 'all' && orderStatus !== ordersStatusFilter) {
                return false;
            }
            if (ordersActionFilter === 'refundable' && !(order.refund_window_open && order.refund_scope === 'all')) {
                return false;
            }
            if (ordersActionFilter === 'pending_access' && orderStatus === 'completed') {
                return false;
            }
            if (ordersActionFilter === 'invoice_ready' && orderStatus !== 'completed') {
                return false;
            }
            if (ordersSearch.trim()) {
                const haystack = [
                    `pedido ${order.id}`,
                    order.items?.map((item) => item.product_title_snapshot || item.product_title).filter(Boolean).join(' '),
                    resolveMarketplacePaymentMethodLabel(order.payment_method),
                    resolveMarketplacePaymentStatusLabel({
                        orderStatus: order.status,
                        paymentStatus: order.payment_status,
                        paymentMethod: order.payment_method,
                    }),
                    order.transfer_reference,
                    order.provider_transaction_id,
                    order.authorization_code,
                ].filter(Boolean).join(' ');
                if (!haystack.toLowerCase().includes(ordersSearch.trim().toLowerCase())) {
                    return false;
                }
            }
            return true;
        }),
        [orders, ordersActionFilter, ordersSearch, ordersStatusFilter]
    );
    const availableAssetTypes = useMemo(
        () => [...new Set(assets.map((asset) => String(asset.entity_type || '').toLowerCase()).filter(Boolean))],
        [assets]
    );
    const filteredAssets = useMemo(
        () => assets.filter((asset) => {
            const assetType = String(asset.entity_type || '').toLowerCase();
            if (libraryTypeFilter !== 'all' && assetType !== libraryTypeFilter) {
                return false;
            }
            if (libraryUsageFilter === 'internal_only' && asset.usage_policy?.publishable_marketplace !== false) {
                return false;
            }
            if (libraryUsageFilter === 'editable' && !asset.usage_policy?.editable_internal) {
                return false;
            }
            if (libraryUsageFilter === 'duplicable' && !asset.usage_policy?.duplicable_internal) {
                return false;
            }
            if (librarySearch.trim()) {
                const haystack = [
                    asset.entity_title,
                    ENTITY_LABELS[asset.entity_type] || asset.entity_type,
                    asset.origin_label,
                    asset.ownership_kind,
                ].filter(Boolean).join(' ');
                if (!haystack.toLowerCase().includes(librarySearch.trim().toLowerCase())) {
                    return false;
                }
            }
            return true;
        }),
        [assets, librarySearch, libraryTypeFilter, libraryUsageFilter]
    );
    const filteredAttentionOrdersCount = useMemo(
        () => filteredOrders.filter((order) => {
            const statusKey = String(order.status || '').toLowerCase();
            return statusKey === 'awaiting_manual_validation' || Boolean(order.refund_window_open);
        }).length,
        [filteredOrders]
    );
    const filteredInvoiceReadyOrdersCount = useMemo(
        () => filteredOrders.filter((order) => String(order.status || '').toLowerCase() === 'completed').length,
        [filteredOrders]
    );
    const filteredInternalAssetsCount = useMemo(
        () => filteredAssets.filter((asset) => asset.usage_policy?.publishable_marketplace === false).length,
        [filteredAssets]
    );
    const filteredEditableAssetsCount = useMemo(
        () => filteredAssets.filter((asset) => asset.usage_policy?.editable_internal).length,
        [filteredAssets]
    );
    const filteredDuplicableAssetsCount = useMemo(
        () => filteredAssets.filter((asset) => asset.usage_policy?.duplicable_internal).length,
        [filteredAssets]
    );

    if (!canBuy || !profileComplete) {
        return (
            <MarketplaceShell className="marketplace-internal-page">
                <div className="mx-auto max-w-[1200px]">
                    <MarketplaceEmptyState
                        eyebrow="Acceso restringido"
                        title="Biblioteca comprador"
                        description={!canBuy
                            ? 'Solo administradores de empresa y superadministración pueden comprar y consultar adquisiciones.'
                            : `Completa tu perfil en Ajustes > Personal antes de comprar. Faltan: ${(user?.marketplace_profile_missing_labels || []).join(', ')}.`}
                        primaryActionLabel={canBuy && !profileComplete ? 'Completar perfil' : undefined}
                        onPrimaryAction={canBuy && !profileComplete ? () => { window.location.href = '/settings?tab=usuarios&edit_user=me'; } : undefined}
                    />
                </div>
            </MarketplaceShell>
        );
    }

    if (loading) {
        return (
            <MarketplaceShell className="marketplace-internal-page">
                <MarketplaceLoadingState
                    eyebrow="Cargando buyer"
                    title="Preparando biblioteca y pedidos"
                    description="Estamos sincronizando el contexto postcompra para abrir una consola buyer consistente y trazable."
                    statsCount={4}
                    cardCount={2}
                />
            </MarketplaceShell>
        );
    }

    return (
        <MarketplaceShell className="marketplace-internal-page">
            <div className="space-y-8">
                <MarketplaceDashboardHeader
                    backTo="/marketplace"
                    title="Mis compras"
                    subtitle="Bandeja operativa del comprador para seguir pedidos y operar activos entregados"
                    contextLabel="Empieza desde listados reales y trabaja cada compra en superficies acotadas"
                    actions={(
                        <div className="flex items-center gap-2">
                            <ProjectSectionIconButton
                                icon={PackageCheck}
                                label="Abrir biblioteca"
                                hintContent="Abrir biblioteca de activos comprados"
                                onClick={() => setLibraryModalOpen(true)}
                            />
                            <ProjectSectionIconButton
                                icon={ShoppingBag}
                                label="Abrir pedidos"
                                hintContent="Abrir bandeja de pedidos y devoluciones"
                                onClick={() => setOrdersModalOpen(true)}
                                className="text-[#136191]"
                            />
                        </div>
                    )}
                />

                <Link
                    to="/marketplace"
                    id="buyer-marketplace-back"
                    className="sr-only"
                >
                    Volver al marketplace
                </Link>

                <section className="grid gap-6 xl:grid-cols-2">
                    <MarketplaceSectionCard
                        eyebrow="Bandeja principal"
                        title="Compras recientes"
                        description="Empieza desde el listado real de pedidos y actúa desde cada compra según su estado, método de pago o elegibilidad de devolución."
                        actionLabel="Abrir pedidos"
                        onAction={() => setOrdersModalOpen(true)}
                    >
                        <div className="space-y-3">
                            {loading ? (
                                <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm font-medium text-zinc-500">
                                    Cargando compras...
                                </div>
                            ) : orderPreviewItems.length === 0 ? (
                                <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm font-medium text-zinc-500">
                                    Todavía no hay compras registradas.
                                </div>
                            ) : orderPreviewItems.map((order) => {
                                const paymentStatusLabel = resolveMarketplacePaymentStatusLabel({
                                    orderStatus: order.status,
                                    paymentStatus: order.payment_status,
                                    paymentMethod: order.payment_method,
                                });
                                const statusKey = String(order.status || '').toLowerCase();
                                const nextActionLabel = order.refund_window_open && order.refund_scope === 'all'
                                    ? 'Devolución disponible'
                                    : statusKey === 'completed'
                                        ? 'Factura y detalle listos'
                                        : statusKey === 'awaiting_manual_validation'
                                            ? 'Esperando validación bancaria'
                                            : statusKey === 'payment_rejected'
                                                ? 'Revisar pago rechazado'
                                                : 'Seguir trazabilidad';
                                return (
                                    <div key={`buyer-order-preview-${order.id}`} className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-900">Pedido #{order.id}</p>
                                                <p className="mt-1 text-sm font-medium text-zinc-600">
                                                    {order.items?.length || 0} item(s) · {resolveMarketplacePaymentMethodLabel(order.payment_method)}
                                                </p>
                                            </div>
                                            <span className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                {Number(order.total || 0).toFixed(2)} {order.currency}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                                {paymentStatusLabel}
                                            </span>
                                            <span className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                {nextActionLabel}
                                            </span>
                                            <Link
                                                to={`/pedido/${order.id}`}
                                                className="inline-flex h-9 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:border-[#136191] hover:text-[#136191]"
                                            >
                                                Abrir detalle
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </MarketplaceSectionCard>

                    <MarketplaceSectionCard
                        eyebrow="Biblioteca"
                        title="Activos entregados"
                        description="La biblioteca comprada debe arrancar también desde un listado útil, no desde métricas. Aquí ves qué activo tienes y desde dónde retomarlo."
                        actionLabel="Abrir biblioteca"
                        onAction={() => setLibraryModalOpen(true)}
                    >
                        <div className="space-y-3">
                            {loading ? (
                                <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm font-medium text-zinc-500">
                                    Cargando biblioteca...
                                </div>
                            ) : assetPreviewItems.length === 0 ? (
                                <div className="rounded-[1.35rem] border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center text-sm font-medium text-zinc-500">
                                    Todavía no hay activos entregados.
                                </div>
                            ) : assetPreviewItems.map((asset) => {
                                const entityLink = buildMarketplaceEntityLink(asset.entity_type, asset.entity_id);
                                const assetUsageLabel = asset.usage_policy?.publishable_marketplace === false
                                    ? 'Solo interno'
                                    : asset.usage_policy?.editable_internal
                                        ? 'Listo para editar'
                                        : asset.usage_policy?.duplicable_internal
                                            ? 'Listo para duplicar'
                                            : 'Continuidad disponible';
                                return (
                                    <div key={`buyer-asset-preview-${asset.origin_id}`} className="rounded-[1.25rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black uppercase tracking-[0.12em] text-zinc-900">{asset.entity_title}</p>
                                                <p className="mt-1 text-sm font-medium text-zinc-600">
                                                    {ENTITY_LABELS[asset.entity_type] || asset.entity_type} · {asset.origin_label || 'Marketplace'}
                                                </p>
                                            </div>
                                            <span className="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                                {asset.ownership_kind}
                                            </span>
                                        </div>
                                        <div className="mt-3 flex flex-wrap items-center gap-3">
                                            <span className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                {assetUsageLabel}
                                            </span>
                                            {entityLink ? (
                                                <Link
                                                    to={entityLink}
                                                    className="inline-flex h-9 items-center rounded-2xl border border-emerald-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 transition-colors hover:border-emerald-400"
                                                >
                                                    {getMarketplaceEntityActionLabel(asset.entity_type)}
                                                </Link>
                                            ) : null}
                                            {asset.marketplace_order_id ? (
                                                <Link
                                                    to={`/pedido/${asset.marketplace_order_id}`}
                                                    className="inline-flex h-9 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:border-[#136191] hover:text-[#136191]"
                                                >
                                                    Ver pedido
                                                </Link>
                                            ) : null}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </MarketplaceSectionCard>
                </section>

                <section className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.85fr)]">
                    <div className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Resumen operativo</p>
                        <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-zinc-900">Qué puedes atender ahora</h2>
                        <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                            {[
                                { label: 'Pedidos', value: totals.orders, helper: 'Historial total' },
                                { label: 'Completados', value: completedOrdersCount, helper: 'Con acceso habilitado' },
                                { label: 'Pendientes', value: pendingManualValidationCount, helper: 'Esperando validación' },
                                { label: 'Activos', value: totals.assets, helper: 'Biblioteca disponible' },
                            ].map((item) => (
                                <div key={item.label} className="rounded-[1.25rem] border border-zinc-100 bg-zinc-50 px-4 py-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{item.label}</p>
                                    <p className="mt-2 text-2xl font-black text-zinc-900">{item.value}</p>
                                    <p className="mt-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{item.helper}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-[2rem] border border-blue-200 bg-[linear-gradient(145deg,#eff6ff_0%,#ffffff_62%,#fff7ed_100%)] p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                        <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Siguiente frente</p>
                                <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-zinc-900">
                                    {pendingManualValidationCount > 0
                                        ? 'Validar pedidos pendientes'
                                        : latestReadyAsset
                                            ? 'Retomar activos entregados'
                                            : 'Seguir comprando en Tienda'}
                                </h2>
                                <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-600">
                                    {pendingManualValidationCount > 0
                                        ? 'Tienes pedidos esperando confirmación o cierre; la bandeja de compras es la mejor puerta de entrada.'
                                        : latestReadyAsset
                                            ? 'Tu biblioteca ya tiene activos listos. Retómalos directamente desde la bandeja de biblioteca.'
                                            : 'Todavía no hay una biblioteca activa; vuelve a Tienda para iniciar la primera compra.'}
                                </p>
                            </div>
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-blue-200 bg-white/90">
                                <Store className="h-5 w-5 text-[#136191]" />
                            </div>
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                            <ProjectSectionIconButton
                                icon={ShoppingBag}
                                label="Abrir compras"
                                hintContent="Abrir bandeja de compras"
                                onClick={() => setOrdersModalOpen(true)}
                                className="text-[#136191]"
                            />
                            <ProjectSectionIconButton
                                icon={PackageCheck}
                                label="Abrir biblioteca"
                                hintContent="Abrir biblioteca de activos comprados"
                                onClick={() => setLibraryModalOpen(true)}
                            />
                            <ProjectSectionIconButton
                                icon={Store}
                                label="Volver a tienda"
                                hintContent="Volver al catálogo de Marketplace"
                                onClick={() => navigate('/marketplace')}
                            />
                        </div>
                        {internalOnlyAssetsCount > 0 ? (
                            <div className="mt-4 rounded-[1.25rem] border border-white/80 bg-white/90 px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Biblioteca interna</p>
                                <p className="mt-2 text-sm font-semibold text-zinc-700">
                                    {internalOnlyAssetsCount} activo(s) son de uso interno y conviene operarlos desde la biblioteca, no desde cuadros técnicos.
                                </p>
                            </div>
                        ) : null}
                    </div>
                </section>
            </div>


            <AppModalShell
                isOpen={ordersModalOpen}
                onClose={() => setOrdersModalOpen(false)}
                size="2xl"
                panelClassName="max-h-[92vh] flex flex-col"
            >
                <AppModalHeader
                    {...INTERNAL_MODAL_HEADER_PROPS}
                    title="Mis compras"
                    subtitle="Bandeja funcional de compras, pagos y acciones transversales"
                    icon={ShoppingBag}
                    iconClassName="text-[#F39200]"
                    iconWrapClassName="border-orange-200 bg-orange-50"
                    onClose={() => setOrdersModalOpen(false)}
                />
                <MarketplaceModalScrollBody className="space-y-4">
                    <div className="grid gap-3 rounded-[1.5rem] border border-zinc-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_auto]">
                        <ClearSearchField
                            value={ordersSearch}
                            onValueChange={setOrdersSearch}
                            placeholder="Buscar por pedido, producto, referencia o pago..."
                            inputClassName="h-11 rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-10 text-sm"
                            containerClassName="w-full"
                        />
                        <ProjectSegmentedSwitch
                            value={ordersStatusFilter}
                            onChange={setOrdersStatusFilter}
                            options={[
                                { value: 'all', label: 'Todos' },
                                ...availableOrderStatuses.map((status) => ({
                                    value: status,
                                    label: ORDER_STATUS_META[status]?.label || status,
                                })),
                            ]}
                            size="sm"
                            minSegmentWidth={112}
                            ariaLabel="Filtrar pedidos por estado"
                        />
                        <ProjectSegmentedSwitch
                            value={ordersActionFilter}
                            onChange={setOrdersActionFilter}
                            options={[
                                { value: 'all', label: 'Todas' },
                                { value: 'refundable', label: 'Devolución' },
                                { value: 'pending_access', label: 'Acceso' },
                                { value: 'invoice_ready', label: 'Factura' },
                            ]}
                            size="sm"
                            minSegmentWidth={104}
                            ariaLabel="Filtrar pedidos por acción"
                        />
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Bandeja actual</p>
                            <p className="mt-2 text-lg font-black text-zinc-900">{filteredOrders.length} pedido(s)</p>
                            <p className="mt-1 text-xs font-medium text-zinc-500">Resultado del filtro activo y la búsqueda actual.</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Requieren atención</p>
                            <p className="mt-2 text-lg font-black text-zinc-900">{filteredAttentionOrdersCount}</p>
                            <p className="mt-1 text-xs font-medium text-zinc-500">Pedidos con devolución abierta o validación bancaria pendiente.</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Factura disponible</p>
                            <p className="mt-2 text-lg font-black text-zinc-900">{filteredInvoiceReadyOrdersCount}</p>
                            <p className="mt-1 text-xs font-medium text-zinc-500">Pedidos completados listos para descargar documentación.</p>
                        </div>
                    </div>
                    {orders.length === 0 ? (
                        <MarketplaceEmptyState
                            eyebrow="Sin compras"
                            title="Todavía no hay pedidos en esta empresa"
                            description="Cuando cierres compras, esta bandeja te servirá para abrir pedidos, descargar factura, revisar pagos o solicitar devoluciones."
                            primaryActionLabel="Volver a Tienda"
                            onPrimaryAction={() => setOrdersModalOpen(false)}
                        />
                    ) : filteredOrders.length === 0 ? (
                        <MarketplaceEmptyState
                            eyebrow="Sin coincidencias"
                            title="Ningún pedido coincide con el filtro actual"
                            description="Ajusta la búsqueda o el estado para recuperar la bandeja de compras."
                            primaryActionLabel="Limpiar filtros"
                            onPrimaryAction={() => {
                                setOrdersSearch('');
                                setOrdersStatusFilter('all');
                                setOrdersActionFilter('all');
                            }}
                        />
                    ) : (
                        filteredOrders.map((order) => {
                            const paymentStatusLabel = resolveMarketplacePaymentStatusLabel({
                                orderStatus: order.status,
                                paymentStatus: order.payment_status,
                                paymentMethod: order.payment_method,
                            });
                            const statusKey = String(order.status || '').toLowerCase();
                            const refundStatusLabel = order.refund_window_open
                                ? 'Devolución activa'
                                : order.refund_deadline_at
                                    ? 'Ventana cerrada'
                                    : 'Sin devolución automática';
                            return (
                                <div key={`buyer-order-modal-${order.id}`} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-base font-black text-zinc-900">Pedido #{order.id}</p>
                                            <p className="mt-1 text-sm font-semibold text-zinc-500">
                                                {order.items?.length || 0} item(s) · {resolveMarketplacePaymentMethodLabel(order.payment_method)}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                    {paymentStatusLabel}
                                                </span>
                                                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                    {refundStatusLabel}
                                                </span>
                                                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                    {statusKey === 'completed' ? 'Acceso disponible' : statusKey === 'refunded' ? 'Acceso revocado' : 'Acceso pendiente'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 xl:items-end">
                                            <span className="inline-flex rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#A55A00]">
                                                {Number(order.total || 0).toFixed(2)} {order.currency}
                                            </span>
                                            <p className="text-[11px] font-semibold text-zinc-500 xl:text-right">
                                                {order.payment_latest_signal || 'Usa el detalle para ver la trazabilidad completa del pedido.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        <Link
                                            to={`/pedido/${order.id}`}
                                            className="inline-flex h-10 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:border-[#136191] hover:text-[#136191]"
                                        >
                                            Abrir detalle
                                        </Link>
                                        {String(order.status || '').toLowerCase() === 'completed' ? (
                                            <ProjectSectionIconButton
                                                icon={FileText}
                                                label="Factura PDF"
                                                hintContent={downloadingInvoiceId === order.id ? 'Generando factura PDF' : 'Descargar factura PDF'}
                                                onClick={() => handleInvoiceDownload(order.id)}
                                                disabled={downloadingInvoiceId === order.id}
                                                className="border-orange-200 bg-orange-50 text-[#A55A00] hover:text-[#A55A00]"
                                            />
                                        ) : null}
                                        {String(order.status || '').toLowerCase() === 'completed' && order.refund_window_open && order.refund_scope === 'all' ? (
                                            <ProjectSectionIconButton
                                                icon={RotateCcw}
                                                label="Solicitar devolución"
                                                hintContent={refundingOrderId === order.id ? 'Procesando devolución' : 'Solicitar devolución automática'}
                                                onClick={() => handleOrderRefund(order)}
                                                disabled={refundingOrderId === order.id}
                                                className="border-sky-200 bg-sky-50 text-sky-700 hover:text-sky-700"
                                            />
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </MarketplaceModalScrollBody>
            </AppModalShell>

            <AppModalShell
                isOpen={libraryModalOpen}
                onClose={() => setLibraryModalOpen(false)}
                size="2xl"
                panelClassName="max-h-[92vh] flex flex-col"
            >
                <AppModalHeader
                    {...INTERNAL_MODAL_HEADER_PROPS}
                    title="Biblioteca de compra"
                    subtitle="Activos entregados, acceso operativo y vínculo con pedido origen"
                    icon={PackageCheck}
                    iconClassName="text-[#136191]"
                    iconWrapClassName="border-blue-200 bg-blue-50"
                    onClose={() => setLibraryModalOpen(false)}
                />
                <MarketplaceModalScrollBody className="space-y-4">
                    <div className="grid gap-3 rounded-[1.5rem] border border-zinc-200 bg-white p-4 md:grid-cols-[minmax(0,1fr)_auto]">
                        <ClearSearchField
                            value={librarySearch}
                            onValueChange={setLibrarySearch}
                            placeholder="Buscar por activo, origen o tipo..."
                            inputClassName="h-11 rounded-2xl border border-zinc-200 bg-zinc-50 pl-10 pr-10 text-sm"
                            containerClassName="w-full"
                        />
                        <ProjectSegmentedSwitch
                            value={libraryTypeFilter}
                            onChange={setLibraryTypeFilter}
                            options={[
                                { value: 'all', label: 'Todos' },
                                ...availableAssetTypes.map((assetType) => ({
                                    value: assetType,
                                    label: ENTITY_LABELS[assetType] || assetType,
                                })),
                            ]}
                            size="sm"
                            minSegmentWidth={112}
                            ariaLabel="Filtrar biblioteca por tipo"
                        />
                        <ProjectSegmentedSwitch
                            value={libraryUsageFilter}
                            onChange={setLibraryUsageFilter}
                            options={[
                                { value: 'all', label: 'Permisos' },
                                { value: 'internal_only', label: 'Interno' },
                                { value: 'editable', label: 'Editables' },
                                { value: 'duplicable', label: 'Duplicables' },
                            ]}
                            size="sm"
                            minSegmentWidth={104}
                            ariaLabel="Filtrar biblioteca por permisos"
                        />
                    </div>
                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Biblioteca visible</p>
                            <p className="mt-2 text-lg font-black text-zinc-900">{filteredAssets.length} activo(s)</p>
                            <p className="mt-1 text-xs font-medium text-zinc-500">Resultado del filtro actual para continuidad operativa.</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Uso interno</p>
                            <p className="mt-2 text-lg font-black text-zinc-900">{filteredInternalAssetsCount}</p>
                            <p className="mt-1 text-xs font-medium text-zinc-500">Activos que conviene operar desde biblioteca sin republicarlos.</p>
                        </div>
                        <div className="rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Editables / duplicables</p>
                            <p className="mt-2 text-lg font-black text-zinc-900">{filteredEditableAssetsCount} / {filteredDuplicableAssetsCount}</p>
                            <p className="mt-1 text-xs font-medium text-zinc-500">Capacidad real de continuidad sobre los activos visibles.</p>
                        </div>
                    </div>
                    {assets.length === 0 ? (
                        <MarketplaceEmptyState
                            eyebrow="Sin activos"
                            title="Todavía no hay activos entregados"
                            description="Cuando cierres compras, esta bandeja mostrará los activos disponibles y sus acciones de continuidad."
                            primaryActionLabel="Volver a Tienda"
                            onPrimaryAction={() => setLibraryModalOpen(false)}
                        />
                    ) : filteredAssets.length === 0 ? (
                        <MarketplaceEmptyState
                            eyebrow="Sin coincidencias"
                            title="Ningún activo coincide con el filtro actual"
                            description="Ajusta la búsqueda o el tipo para recuperar la biblioteca entregada."
                            primaryActionLabel="Limpiar filtros"
                            onPrimaryAction={() => {
                                setLibrarySearch('');
                                setLibraryTypeFilter('all');
                                setLibraryUsageFilter('all');
                            }}
                        />
                    ) : (
                        filteredAssets.map((asset) => {
                            const entityLink = buildMarketplaceEntityLink(asset.entity_type, asset.entity_id);
                            return (
                                <div key={`buyer-asset-modal-${asset.origin_id}`} className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 p-4">
                                    <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                        <div className="min-w-0 flex-1">
                                            <p className="text-base font-black text-zinc-900">{asset.entity_title}</p>
                                            <p className="mt-1 text-sm font-semibold text-zinc-500">
                                                {ENTITY_LABELS[asset.entity_type] || asset.entity_type} · {asset.origin_label || 'Marketplace'}
                                            </p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                                    {asset.ownership_kind}
                                                </span>
                                                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                    {asset.usage_policy?.editable_internal ? 'Editable' : 'No editable'}
                                                </span>
                                                <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                    {asset.usage_policy?.duplicable_internal ? 'Duplicable' : 'No duplicable'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-2 xl:items-end">
                                            <span className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                                                {asset.marketplace_order_id ? `Pedido #${asset.marketplace_order_id}` : 'Sin pedido visible'}
                                            </span>
                                            <p className="text-[11px] font-semibold text-zinc-500 xl:text-right">
                                                {asset.usage_policy?.publishable_marketplace === false
                                                    ? 'Activo de uso interno, sin republicación en marketplace.'
                                                    : 'Disponible para continuidad operativa desde tu biblioteca.'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex flex-wrap gap-3">
                                        {entityLink ? (
                                            <Link
                                                to={entityLink}
                                                className="inline-flex h-10 items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 transition-colors hover:border-emerald-400"
                                            >
                                                {getMarketplaceEntityActionLabel(asset.entity_type)}
                                            </Link>
                                        ) : null}
                                        {asset.marketplace_order_id ? (
                                            <Link
                                                to={`/pedido/${asset.marketplace_order_id}`}
                                                className="inline-flex h-10 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-700 transition-colors hover:border-[#136191] hover:text-[#136191]"
                                            >
                                                Ver pedido
                                            </Link>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })
                    )}
                </MarketplaceModalScrollBody>
            </AppModalShell>
        </MarketplaceShell>
    );
};

export default MarketplaceBuyerDashboard;
