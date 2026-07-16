import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Archive, PackageCheck, ReceiptText, ShoppingBag } from 'lucide-react';

import marketplaceApi from '../api/marketplace';
import reportingApi from '../api/reporting';
import { buildMarketplaceEntityLink, getMarketplaceEntityActionLabel } from '../utils/marketplaceEntityLinks';
import { resolveMarketplacePaymentMethodLabel, resolveMarketplacePaymentStatusLabel, resolveMarketplaceRefundResolutionLabel } from '../utils/marketplacePaymentLabels';
import { appAlert } from '../utils/appDialog';
import {
    MarketplaceActionTile,
    MarketplaceHero,
    MarketplaceLoadingState,
    MarketplaceQuickStat,
    MarketplaceSectionHeader,
    MarketplaceShell,
    MarketplaceTrustPanel,
} from '../components/marketplace/MarketplaceVisualSystem';

const scrollToSection = (sectionId) => {
    if (typeof document === 'undefined') return;
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const ORDER_STATUS_META = {
    completed: {
        eyebrow: 'Pedido confirmado',
        label: 'Completado',
        description: 'La compra ya fue confirmada y sus activos entregables están habilitados.',
    },
    awaiting_manual_validation: {
        eyebrow: 'Pendiente de validación',
        label: 'En revisión bancaria',
        description: 'El pedido está registrado, pero la compra aún no se activa hasta que la transferencia sea validada manualmente.',
    },
    payment_rejected: {
        eyebrow: 'Pago rechazado',
        label: 'Requiere nueva gestión',
        description: 'La transferencia fue rechazada y no se entregaron activos para este pedido.',
    },
    expired: {
        eyebrow: 'Pedido expirado',
        label: 'Validación vencida',
        description: 'La transferencia no se validó dentro del plazo operativo y el pedido dejó de estar activo.',
    },
    refunded: {
        eyebrow: 'Pedido reembolsado',
        label: 'Acceso revocado',
        description: 'El pedido fue reembolsado y los activos asociados dejaron de estar disponibles para la empresa compradora.',
    },
};

const FULFILLMENT_STATUS_LABELS = {
    fulfilled: 'Entregado',
    pending: 'Pendiente de entrega',
    partial: 'Entrega parcial',
    none: 'Sin entrega',
};

const MarketplaceOrderDetail = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [downloads, setDownloads] = useState([]);
    const [downloading, setDownloading] = useState(null);

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

    const handleInvoiceDownload = async () => {
        try {
            setDownloading('invoice');
            const response = await marketplaceApi.downloadOrderInvoice(orderId);
            triggerBlobDownload(response.data, `factura_marketplace_${orderId}.pdf`, 'application/pdf');
        } catch (error) {
            globalThis.reportClientError?.('Error descargando factura marketplace:', error);
            appAlert('No se pudo descargar la factura del pedido.');
        } finally {
            setDownloading(null);
        }
    };

    const handleTechnicalDownload = async (download) => {
        const key = `${download.order_item_id || 'shared'}-${download.label}`;
        try {
            setDownloading(key);
            let response;
            if (download.report_type === 'portal_excel') {
                response = await marketplaceApi.downloadPortalOrderExcel(orderId, download.order_item_id);
            } else if (download.report_type === 'apu' && download.format === 'xlsx') {
                response = await reportingApi.getApuReport(download.entity_id, download.template_id || '001');
            } else if (download.report_type === 'edt' && download.format === 'xlsx') {
                response = await reportingApi.getEdtReport(download.entity_id, download.variant || 'listado');
            } else {
                response = await reportingApi.exportReport({
                    report_type: download.report_type,
                    entity_ids: [download.entity_id],
                    template_id: download.template_id || '001',
                    variant: download.variant || undefined,
                    format: download.format,
                });
            }

            const extension = download.format === 'pdf' ? 'pdf' : 'xlsx';
            const mimeType = download.format === 'pdf'
                ? 'application/pdf'
                : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
            const safeLabel = (download.label || 'descarga').replace(/[^\w.-]+/g, '_');
            triggerBlobDownload(response.data, `${safeLabel}.${extension}`, mimeType);
        } catch (error) {
            globalThis.reportClientError?.('Error descargando recurso marketplace:', error);
            appAlert('No se pudo generar la descarga solicitada.');
        } finally {
            setDownloading(null);
        }
    };

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            try {
                const [{ data: orderData }, { data: downloadData }] = await Promise.all([
                    marketplaceApi.getOrderById(orderId),
                    marketplaceApi.getOrderDownloads(orderId),
                ]);
                if (!cancelled) {
                    setOrder(orderData);
                    setDownloads(downloadData || []);
                }
            } catch (error) {
                globalThis.reportClientError?.('Error cargando pedido:', error);
                if (!cancelled) {
                    setOrder(null);
                    setDownloads([]);
                }
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [orderId]);

    const orderHighlights = useMemo(() => {
        if (!order) {
            return {
                itemsCount: 0,
                activeAssets: 0,
                totalValue: 0,
                downloadsCount: 0,
                hasLinkedAssets: false,
                focusTitle: 'Cargando pedido',
                focusDescription: 'Preparando el contexto operativo del pedido.',
                focusActionLabel: 'Ver resumen',
                focusAction: () => scrollToSection('order-summary-section'),
            };
        }

        const items = order.items || [];
        const itemsWithDeliveredAssets = items.filter((item) => (
            Boolean(buildMarketplaceEntityLink(item.delivered_entity_type, item.delivered_entity_id))
        ));

        let focusTitle = 'Pedido listo para operar';
        let focusDescription = 'El siguiente paso natural es entrar a los activos entregados o descargar la factura del pedido.';
        let focusActionLabel = 'Ver activos';
        let focusAction = () => scrollToSection('order-items-section');

        if (downloads.length > 0) {
            focusTitle = 'Entregables técnicos disponibles';
            focusDescription = 'Este pedido incluye descargas técnicas adicionales; conviene consolidarlas junto con los activos ya entregados.';
            focusActionLabel = 'Ir a descargas';
            focusAction = () => scrollToSection('order-downloads-section');
        } else if (itemsWithDeliveredAssets.length === 0) {
            focusTitle = 'Pedido con entrega comercial simple';
            focusDescription = 'No hay activos navegables ni descargas adicionales; el valor principal del pedido está en su trazabilidad comercial y factura.';
            focusActionLabel = 'Ver resumen';
            focusAction = () => scrollToSection('order-summary-section');
        }

        return {
            itemsCount: items.length,
            activeAssets: itemsWithDeliveredAssets.length,
            totalValue: Number(order.total || 0),
            downloadsCount: downloads.length,
            hasLinkedAssets: itemsWithDeliveredAssets.length > 0,
            focusTitle,
            focusDescription,
            focusActionLabel,
            focusAction,
        };
    }, [downloads, order]);
    const orderStatusMeta = ORDER_STATUS_META[String(order?.status || '').toLowerCase()] || {
        eyebrow: 'Pedido marketplace',
        label: order?.status || 'Sin estado',
        description: 'Consulta aquí el estado comercial, de pago y de entrega de este pedido.',
    };
    const paymentMethodLabel = resolveMarketplacePaymentMethodLabel(order?.payment_method);
    const paymentStatusLabel = resolveMarketplacePaymentStatusLabel({
        orderStatus: order?.status,
        paymentStatus: order?.payment_status,
        paymentMethod: order?.payment_method,
    });
    const fulfillmentLabel = FULFILLMENT_STATUS_LABELS[String(order?.fulfillment_status || '').toLowerCase()] || 'Sin entrega';
    const canDownloadInvoice = String(order?.status || '').toLowerCase() === 'completed';

    if (!order) {
        return (
            <MarketplaceShell>
                <MarketplaceLoadingState
                    eyebrow="Cargando pedido"
                    title="Preparando el detalle postcompra"
                    description="Estamos reuniendo factura, entregables y activos vinculados para abrir el pedido con contexto completo."
                    statsCount={4}
                    cardCount={2}
                />
            </MarketplaceShell>
        );
    }

    return (
        <MarketplaceShell>
            <div className="space-y-8">
                <MarketplaceHero
                    eyebrow={orderStatusMeta.eyebrow}
                    title={`Pedido #${order.id}`}
                    description={orderStatusMeta.description}
                    accent="blue"
                >
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <MarketplaceQuickStat label="Items" value={orderHighlights.itemsCount} tone="orange" />
                        <MarketplaceQuickStat label="Entregados" value={order.delivered_items_count || orderHighlights.activeAssets} tone="blue" />
                        <MarketplaceQuickStat label="Descargas" value={orderHighlights.downloadsCount} />
                        <MarketplaceQuickStat label="Total" value={`${orderHighlights.totalValue.toFixed(2)} ${order.currency}`} />
                    </div>
                </MarketplaceHero>

                <section className="rounded-[2rem] border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-cyan-50 p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                    <MarketplaceSectionHeader
                        eyebrow="Cockpit pedido"
                        title="Pulso postcompra"
                        description="Esta ficha reúne factura, entregables y activos vinculados para que el pedido se pueda operar sin perder contexto."
                        badge={order.status || 'Estado no disponible'}
                    />

                    <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.9fr)]">
                        <div className="rounded-[1.5rem] border border-white/80 bg-white/90 p-5 shadow-[0_10px_30px_rgba(15,23,42,0.05)]">
                            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                {[
                                    { label: 'Items', value: orderHighlights.itemsCount },
                                    { label: 'Fulfillment', value: fulfillmentLabel },
                                    { label: 'Descargas', value: orderHighlights.downloadsCount },
                                    { label: 'Total', value: `${orderHighlights.totalValue.toFixed(2)} ${order.currency}` },
                                ].map((item) => (
                                    <MarketplaceQuickStat key={item.label} label={item.label} value={item.value} />
                                ))}
                            </div>
                        </div>

                        <MarketplaceTrustPanel
                            title={orderHighlights.focusTitle}
                            items={[orderHighlights.focusDescription]}
                        />
                    </div>

                    <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        {[
                            { label: 'Resumen', helper: 'Volver arriba', action: () => scrollToSection('order-summary-section') },
                            { label: 'Activos', helper: `${orderHighlights.activeAssets} vinculados`, action: () => scrollToSection('order-items-section') },
                            { label: 'Descargas', helper: `${orderHighlights.downloadsCount} disponibles`, action: () => scrollToSection('order-downloads-section') },
                            { label: 'Mis compras', helper: 'Volver al buyer', action: () => scrollToSection('order-buyer-back') },
                        ].map((item) => (
                            <MarketplaceActionTile
                                key={item.label}
                                eyebrow={item.label}
                                title={item.helper}
                                description="Acceso directo al frente postcompra correspondiente."
                                onClick={item.action}
                            />
                        ))}
                    </div>
                </section>

                <section className="grid gap-6 md:grid-cols-4">
                    {[ 
                        { label: 'Estado', value: order.status, icon: PackageCheck },
                        { label: 'Pago', value: paymentStatusLabel, icon: ShoppingBag },
                        { label: 'Factura', value: Number(order.total || 0).toFixed(2), icon: ReceiptText },
                        { label: 'Entrega', value: fulfillmentLabel, icon: Archive },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <div key={item.label} className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.05)]">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{item.label}</p>
                                        <p className="mt-2 text-2xl font-black text-zinc-900">{item.value}</p>
                                    </div>
                                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50">
                                        <Icon className="h-5 w-5 text-emerald-700" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </section>

                <section id="order-summary-section" className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                    <div className="grid gap-6 md:grid-cols-3">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Estado</p>
                            <p className="mt-1 text-lg font-black text-zinc-800">{order.status}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Total</p>
                            <p className="mt-1 text-lg font-black text-zinc-800">{Number(order.total || 0).toFixed(2)} {order.currency}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Comisión plataforma</p>
                            <p className="mt-1 text-lg font-black text-zinc-800">{Number(order.commission_amount || 0).toFixed(2)} {order.currency}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Método de pago</p>
                            <p className="mt-1 text-lg font-black text-zinc-800">{paymentMethodLabel}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Estado de pago</p>
                            <p className="mt-1 text-lg font-black text-zinc-800">{paymentStatusLabel}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Estado de entrega</p>
                            <p className="mt-1 text-lg font-black text-zinc-800">{fulfillmentLabel}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                {String(order.payment_method || '').toLowerCase() === 'bank_transfer'
                                    ? 'Referencia bancaria'
                                    : 'Referencia del proveedor'}
                            </p>
                            <p className="mt-1 text-lg font-black text-zinc-800">{order.transfer_reference || order.provider_transaction_id || 'No aplica'}</p>
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                {String(order.payment_method || '').toLowerCase() === 'bank_transfer'
                                    ? 'Fecha reportada'
                                    : 'Autorización'}
                            </p>
                            <p className="mt-1 text-lg font-black text-zinc-800">
                                {String(order.payment_method || '').toLowerCase() === 'bank_transfer'
                                    ? (order.transfer_date || 'No reportada')
                                    : (order.authorization_code || 'No reportada')}
                            </p>
                        </div>
                    </div>

                    <div className="mt-6 flex flex-wrap gap-3">
                        {canDownloadInvoice ? (
                            <button
                                type="button"
                                onClick={handleInvoiceDownload}
                                disabled={downloading === 'invoice'}
                                className="inline-flex h-11 items-center rounded-2xl border border-orange-200 bg-orange-50 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-[#A55A00] transition-colors hover:border-orange-400 disabled:cursor-wait disabled:opacity-60"
                            >
                                {downloading === 'invoice' ? 'Generando factura' : 'Descargar factura PDF'}
                            </button>
                        ) : null}
                        <Link
                            to="/marketplace/buyer"
                            id="order-buyer-back"
                            className="inline-flex h-11 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                        >
                            Volver a mis compras
                        </Link>
                    </div>

                    {(order.payment_timeline || []).length > 0 ? (
                        <div className="mt-8 rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Trazabilidad del pago</p>
                            <div className="mt-4 space-y-3">
                                {(order.payment_timeline || []).map((event, index) => (
                                    <div
                                        key={`${event.event_type}-${event.occurred_at || index}`}
                                        className="flex flex-col gap-1 rounded-2xl border border-white bg-white px-4 py-3 md:flex-row md:items-center md:justify-between"
                                    >
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-zinc-800">{event.summary}</p>
                                            <p className="text-xs font-medium uppercase tracking-[0.14em] text-zinc-500">
                                                {(event.provider || 'sistema')} · {(event.event_origin || 'interno')}
                                            </p>
                                        </div>
                                        <p className="text-xs font-semibold text-zinc-500">{event.occurred_at || 'Sin fecha'}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : null}

                    {String(order.status || '').toLowerCase() === 'refunded' ? (
                        <div className="mt-8 rounded-[1.5rem] border border-sky-200 bg-sky-50 p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-700">Reembolso</p>
                            <p className="mt-2 text-lg font-black text-zinc-900">
                                {order.refund_mode === 'manual_override' ? 'Reembolso manual aprobado por superadministración' : 'Devolución automática completada'}
                            </p>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
                                {order.refund_reason || 'No se registró un motivo adicional para este reembolso.'}
                            </p>
                            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">
                                {order.refunded_at || 'Sin fecha visible'}
                            </p>
                            {order.refund_provider_resolution_status ? (
                                <div className="mt-4 rounded-2xl border border-white/80 bg-white/80 px-4 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Resolución operativa</p>
                                    <p className="mt-1 text-sm font-black text-zinc-800">
                                        {resolveMarketplaceRefundResolutionLabel(order.refund_provider_resolution_status)}
                                    </p>
                                    <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-600">
                                        {order.refund_provider_resolution_note || 'Sin nota operativa visible.'}
                                    </p>
                                </div>
                            ) : null}
                        </div>
                    ) : null}

                    <div id="order-items-section" className="mt-8 space-y-4">
                        {(order.items || []).map((item) => (
                            <div key={item.id} className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-5">
                                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                    <div>
                                        <p className="text-lg font-black text-[#1A1A1A]">{item.product_title_snapshot}</p>
                                        <p className="text-sm font-semibold text-zinc-500">
                                            Tipo: {item.product_type_snapshot} | Entregado como: {item.delivered_entity_type || 'manual'}
                                        </p>
                                    </div>
                                    <p className="text-lg font-black text-zinc-700">{Number(item.price || 0).toFixed(2)}</p>
                                </div>
                                {String(order.status || '').toLowerCase() !== 'refunded' && buildMarketplaceEntityLink(item.delivered_entity_type, item.delivered_entity_id) && (
                                    <div className="mt-4">
                                        <Link
                                            to={buildMarketplaceEntityLink(item.delivered_entity_type, item.delivered_entity_id)}
                                            className="inline-flex h-10 items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 text-[11px] font-black uppercase tracking-[0.16em] text-emerald-700 transition-colors hover:border-emerald-400"
                                        >
                                            {getMarketplaceEntityActionLabel(item.delivered_entity_type)}
                                        </Link>
                                    </div>
                                )}
                                {item.product_type_snapshot === 'portal_compras_publicas' && (
                                    <div className="mt-4 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Entrega portal</p>
                                        <p className="mt-1 text-sm font-medium text-zinc-600">
                                            Este artículo entrega un proyecto adquirido preparado para trabajo interno, con presupuesto base sembrado desde la fuente técnica y, si aplica, una exportación Excel desde descargas.
                                        </p>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                <section id="order-downloads-section" className="rounded-[2rem] border border-zinc-200 bg-white p-7 shadow-[0_16px_50px_rgba(15,23,42,0.05)]">
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Descargas</p>
                    <h2 className="mt-2 text-xl font-black uppercase tracking-tight text-zinc-900">Entregables técnicos</h2>
                    <div className="mt-6 space-y-3">
                        {downloads.length === 0 ? (
                            <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 p-5 text-sm font-semibold text-zinc-500">
                                {String(order.status || '').toLowerCase() === 'completed'
                                    ? 'Este pedido no tiene descargas técnicas adicionales. Los activos ya están disponibles dentro del sistema.'
                                    : 'Las descargas técnicas aparecerán aquí cuando el pedido quede confirmado y el fulfillment haya sido completado.'}
                            </div>
                        ) : (
                            downloads.map((download) => {
                                const key = `${download.order_item_id || 'shared'}-${download.label}`;
                                return (
                                    <div key={key} className="rounded-[1.5rem] border border-zinc-100 bg-zinc-50 p-5">
                                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="text-base font-black text-zinc-900">{download.label}</p>
                                                {download.description && (
                                                    <p className="mt-1 text-sm font-medium text-zinc-500">{download.description}</p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => handleTechnicalDownload(download)}
                                                disabled={downloading === key}
                                                className="inline-flex h-10 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-wait disabled:opacity-60"
                                            >
                                                {downloading === key ? 'Generando' : `Descargar ${String(download.format || 'xlsx').toUpperCase()}`}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </section>

                <div className="flex justify-end">
                    <div className="flex gap-3">
                        <Link
                            to="/marketplace/buyer"
                            className="inline-flex h-11 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                        >
                            Mis compras
                        </Link>
                        <Link
                            to="/marketplace"
                            className="inline-flex h-11 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-[11px] font-black uppercase tracking-[0.16em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                        >
                            Volver al marketplace
                        </Link>
                    </div>
                </div>
            </div>
        </MarketplaceShell>
    );
};

export default MarketplaceOrderDetail;
