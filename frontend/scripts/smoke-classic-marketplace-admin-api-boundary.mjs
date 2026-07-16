import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const dashboardSource = readFileSync(new URL('../src/pages/MarketplaceAdminDashboard.jsx', import.meta.url), 'utf8');
const marketplaceApiSource = readFileSync(new URL('../src/api/marketplace.js', import.meta.url), 'utf8');
const maestrosApiSource = readFileSync(new URL('../src/api/maestros.js', import.meta.url), 'utf8');

assert.equal(
    dashboardSource.includes("from '../api/axiosConfig'"),
    false,
    'MarketplaceAdminDashboard no debe importar axiosConfig directamente en MODO 1',
);

for (const importStatement of [
    "import { maestrosApi } from '../api/maestros';",
    "import marketplaceApi from '../api/marketplace';",
]) {
    assert.equal(
        dashboardSource.includes(importStatement),
        true,
        `MarketplaceAdminDashboard debe conservar cliente API: ${importStatement}`,
    );
}

for (const token of [
    'marketplaceApi.getAdminCategories()',
    'marketplaceApi.getAdminProducts()',
    'marketplaceApi.getAdminPaymentMethods()',
    'marketplaceApi.getAdminOrders()',
    'marketplaceApi.getAdminPaymentHousekeeping()',
    'marketplaceApi.runAdminPaymentHousekeeping()',
    'marketplaceApi.updateAdminPaymentMethod(method.slug, {',
    'marketplaceApi.confirmAdminBankTransfer(order.id, {',
    'marketplaceApi.rejectAdminBankTransfer(order.id, {',
    'marketplaceApi.refundAdminOrder(order.id, {',
    'marketplaceApi.updateAdminCategory(editingCategoryId, payload)',
    'marketplaceApi.createAdminCategory(payload)',
    'marketplaceApi.deleteAdminCategory(category.id)',
    'marketplaceApi.createAdminProduct(payload)',
    'marketplaceApi.uploadAdminProductImage(file)',
    'marketplaceApi.previewAdminPortalImport(',
    'marketplaceApi.downloadAdminPortalImportExcelPreview({',
    'marketplaceApi.updateAdminProduct(editingProductId, payload)',
    'marketplaceApi.updateAdminProduct(product.id, { activo: !product.activo })',
    'marketplaceApi.deleteAdminProduct(product.id)',
    'maestrosApi.getPaises()',
    'maestrosApi.getProvincias()',
    'maestrosApi.getCantones(portalForm.provincia)',
]) {
    assert.equal(
        dashboardSource.includes(token),
        true,
        `MarketplaceAdminDashboard debe conservar uso critico de API: ${token}`,
    );
}

for (const method of [
    'getAdminProducts',
    'createAdminProduct',
    'updateAdminProduct',
    'deleteAdminProduct',
    'uploadAdminProductImage',
    'getAdminCategories',
    'createAdminCategory',
    'updateAdminCategory',
    'deleteAdminCategory',
    'getAdminPaymentMethods',
    'updateAdminPaymentMethod',
    'getAdminOrders',
    'confirmAdminBankTransfer',
    'rejectAdminBankTransfer',
    'refundAdminOrder',
    'getAdminPaymentHousekeeping',
    'runAdminPaymentHousekeeping',
    'previewAdminPortalImport',
    'downloadAdminPortalImportExcelPreview',
]) {
    assert.match(
        marketplaceApiSource,
        new RegExp(`\\b${method}\\s*:`),
        `marketplaceApi debe exponer ${method}`,
    );
}

for (const endpoint of [
    "'/marketplace/admin/products'",
    "'/marketplace/admin/products/upload-image'",
    "'/marketplace/admin/categories'",
    "'/marketplace/admin/payment-methods'",
    "'/marketplace/admin/orders'",
    "'/marketplace/admin/payments/housekeeping'",
    "'/marketplace/admin/payments/housekeeping/run'",
    "'/marketplace/admin/portal-import/preview'",
    "'/marketplace/admin/portal-import/excel-preview'",
    "'/marketplace/admin/products'",
]) {
    assert.equal(
        marketplaceApiSource.includes(endpoint),
        true,
        `marketplaceApi debe conservar endpoint: ${endpoint}`,
    );
}

for (const dynamicEndpoint of [
    '`/marketplace/admin/products/${productId}`',
    '`/marketplace/admin/categories/${categoryId}`',
    '`/marketplace/admin/payment-methods/${slug}`',
    '`/marketplace/admin/orders/${orderId}/confirm-bank-transfer`',
    '`/marketplace/admin/orders/${orderId}/reject-bank-transfer`',
    '`/marketplace/admin/orders/${orderId}/refund`',
]) {
    assert.equal(
        marketplaceApiSource.includes(dynamicEndpoint),
        true,
        `marketplaceApi debe conservar endpoint dinamico: ${dynamicEndpoint}`,
    );
}

assert.match(
    marketplaceApiSource,
    /uploadAdminProductImage\s*:[\s\S]*formData\.append\('file',\s*file\)[\s\S]*multipart\/form-data/,
    'marketplaceApi.uploadAdminProductImage debe conservar multipart de imagen',
);

assert.match(
    marketplaceApiSource,
    /previewAdminPortalImport\s*:[\s\S]*formData\.append\('files',\s*file\)[\s\S]*multipart\/form-data[\s\S]*timeout:\s*300000/,
    'marketplaceApi.previewAdminPortalImport debe conservar multipart y timeout largo',
);

assert.match(
    marketplaceApiSource,
    /downloadAdminPortalImportExcelPreview\s*:[\s\S]*responseType:\s*'blob'[\s\S]*timeout:\s*300000/,
    'marketplaceApi.downloadAdminPortalImportExcelPreview debe conservar descarga blob y timeout largo',
);

for (const method of ['getPaises', 'getProvincias', 'getCantones']) {
    assert.match(
        maestrosApiSource,
        new RegExp(`\\b${method}\\s*:[\\s\\S]*withoutTenant\\(\\)`),
        `maestrosApi.${method} debe conservar lectura tenantless`,
    );
}

console.log('smoke-classic-marketplace-admin-api-boundary: ok');
