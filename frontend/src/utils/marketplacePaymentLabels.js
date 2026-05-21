export function resolveMarketplacePaymentMethodLabel(paymentMethod) {
    const key = String(paymentMethod || '').trim().toLowerCase();
    if (key === 'bank_transfer') return 'Transferencia bancaria';
    if (key === 'payphone') return 'PayPhone';
    if (key === 'paypal') return 'PayPal';
    if (key === 'legacy_checkout') return 'Checkout legacy';
    return paymentMethod || 'Sin método';
}

export function resolveMarketplacePaymentStatusLabel({ orderStatus, paymentStatus, paymentMethod }) {
    const orderKey = String(orderStatus || '').trim().toLowerCase();
    const paymentKey = String(paymentStatus || '').trim().toLowerCase();
    const methodKey = String(paymentMethod || '').trim().toLowerCase();

    if (orderKey === 'awaiting_manual_validation') return 'Esperando validación administrativa';
    if (orderKey === 'payment_rejected') return 'Pago rechazado';
    if (orderKey === 'expired') {
        return methodKey === 'bank_transfer'
            ? 'Transferencia vencida'
            : 'Intento de pago expirado';
    }
    if (orderKey === 'refunded') return 'Reembolsado';

    if (paymentKey === 'confirmed' || paymentKey === 'completed') return 'Confirmado';
    if (paymentKey === 'refunded') return 'Reembolsado';
    if (paymentKey === 'rejected' || paymentKey === 'failed') return 'Pago rechazado';
    if (paymentKey === 'pending_customer_action') return 'Pendiente de acción del comprador';
    if (paymentKey === 'created' || paymentKey === 'draft') return 'Preparado';
    if (paymentKey === 'expired') return 'Expirado';

    return paymentStatus || 'Sin estado';
}

export function resolveMarketplaceRefundResolutionLabel(resolutionStatus) {
    const key = String(resolutionStatus || '').trim().toLowerCase();
    if (key === 'manual_bank_reversal_required') return 'Reversa bancaria manual pendiente';
    if (key === 'provider_reversal_pending') return 'Conciliación externa pendiente';
    if (key === 'internal_refund_recorded') return 'Reembolso registrado en GiProy';
    if (key === 'resolved') return 'Resolución externa conciliada';
    return resolutionStatus || 'Sin resolución visible';
}

export default {
    resolveMarketplacePaymentMethodLabel,
    resolveMarketplacePaymentStatusLabel,
    resolveMarketplaceRefundResolutionLabel,
};
