import api from './axiosConfig';
import { withTenantConfig, withTenantParams } from './tenant';

export const marketplaceApi = {
    getPermissions: () => api.get('/marketplace/permissions/me'),
    getCategories: () => api.get('/marketplace/categories'),
    getPaymentMethods: () => api.get('/marketplace/payment-methods'),
    getProducts: (params = {}) => api.get('/marketplace/products', { params: withTenantParams(params) }),
    getProductById: (id) => api.get(`/marketplace/products/${id}`),
    getProductReviews: (id) => api.get(`/marketplace/products/${id}/reviews`),
    createProductReview: (id, payload) => api.post(`/marketplace/products/${id}/reviews`, payload, withTenantConfig({})),
    getOrigins: (params = {}) => api.get('/marketplace/origins', { params: withTenantParams(params) }),
    createCheckoutDraft: (payload) => api.post('/marketplace/checkout/drafts', payload, withTenantConfig({})),
    getCheckoutDrafts: () => api.get('/marketplace/checkout/drafts'),
    submitBankTransferCheckout: (payload) => api.post('/marketplace/checkout/bank-transfer', payload, withTenantConfig({})),
    preparePayPhoneCheckout: (payload) => api.post('/marketplace/checkout/payphone/prepare', payload, withTenantConfig({})),
    confirmPayPhoneCheckout: (payload) => api.post('/marketplace/checkout/payphone/confirm', payload, withTenantConfig({})),
    preparePayPalCheckout: (payload) => api.post('/marketplace/checkout/paypal/prepare', payload, withTenantConfig({})),
    createPayPalOrder: (payload) => api.post('/marketplace/checkout/paypal/create-order', payload, withTenantConfig({})),
    capturePayPalOrder: (payload) => api.post('/marketplace/checkout/paypal/capture', payload, withTenantConfig({})),
    checkout: (payload) => api.post('/marketplace/checkout', payload, withTenantConfig({})),
    getOrders: () => api.get('/marketplace/orders'),
    getOrderById: (id) => api.get(`/marketplace/orders/${id}`),
    requestOrderRefund: (orderId, payload = {}) => api.post(`/marketplace/orders/${orderId}/refund`, payload, withTenantConfig({})),
    getOrderDownloads: (id) => api.get(`/marketplace/orders/${id}/downloads`),
    downloadPortalOrderExcel: (orderId, orderItemId) => api.get(`/marketplace/orders/${orderId}/downloads/${orderItemId}/portal-excel`, { responseType: 'blob' }),
    downloadOrderInvoice: (id) => api.get(`/marketplace/orders/${id}/invoice`, { responseType: 'blob' }),
    getBuyerLibrary: () => api.get('/marketplace/buyer/library'),
    getSellerProducts: () => api.get('/marketplace/seller/products'),
    getCompanyProducts: (params = {}) => api.get('/marketplace/company/products', { params: withTenantParams(params) }),
    getSellerSourceOptions: (params = {}) => api.get('/marketplace/seller/source-options', { params: withTenantParams(params) }),
    createProduct: (payload) => api.post('/marketplace/products', payload, withTenantConfig({})),
    createAdminProduct: (payload) => api.post('/marketplace/admin/products', payload, withTenantConfig({})),
    updateSellerProduct: (productId, payload) => api.put(`/marketplace/seller/products/${productId}`, payload, withTenantConfig({})),
    cloneSellerProduct: (productId) => api.post(`/marketplace/seller/products/${productId}/clone`, {}, withTenantConfig({})),
    deleteSellerProduct: (productId) => api.delete(`/marketplace/seller/products/${productId}`, withTenantConfig({})),
    getSellerStats: () => api.get('/marketplace/seller/stats'),
    getCompanyStats: (params = {}) => api.get('/marketplace/company/stats', { params: withTenantParams(params) }),
    getSellerSales: () => api.get('/marketplace/seller/sales'),
    getCompanySales: (params = {}) => api.get('/marketplace/company/sales', { params: withTenantParams(params) }),
    getAdminProducts: () => api.get('/marketplace/admin/products'),
    getAdminPaymentMethods: () => api.get('/marketplace/admin/payment-methods'),
    updateAdminPaymentMethod: (slug, payload) => api.put(`/marketplace/admin/payment-methods/${slug}`, payload, withTenantConfig({})),
    getAdminOrders: () => api.get('/marketplace/admin/orders'),
    getAdminPaymentHousekeeping: () => api.get('/marketplace/admin/payments/housekeeping'),
    runAdminPaymentHousekeeping: () => api.post('/marketplace/admin/payments/housekeeping/run', {}, withTenantConfig({})),
    confirmAdminBankTransfer: (orderId, payload = {}) => api.post(`/marketplace/admin/orders/${orderId}/confirm-bank-transfer`, payload, withTenantConfig({})),
    rejectAdminBankTransfer: (orderId, payload = {}) => api.post(`/marketplace/admin/orders/${orderId}/reject-bank-transfer`, payload, withTenantConfig({})),
    refundAdminOrder: (orderId, payload = {}) => api.post(`/marketplace/admin/orders/${orderId}/refund`, payload, withTenantConfig({})),
    previewAdminPortalImport: (files, sourceRoles = {}, existingAnalysis = null, options = {}) => {
        const formData = new FormData();
        const normalizedFiles = Array.isArray(files) ? files : [files];
        normalizedFiles.filter(Boolean).forEach((file) => {
            formData.append('files', file);
        });
        if (sourceRoles && Object.keys(sourceRoles).length) {
            formData.append('source_roles_json', JSON.stringify(sourceRoles));
        }
        if (existingAnalysis) {
            formData.append('existing_analysis_json', JSON.stringify(existingAnalysis));
        }
        return api.post('/marketplace/admin/portal-import/preview', formData, {
            ...withTenantConfig({}),
            headers: {
                'Content-Type': 'multipart/form-data',
            },
            timeout: 300000,
            signal: options.signal,
            onUploadProgress: options.onUploadProgress,
        });
    },
    downloadAdminPortalImportExcelPreview: async (payload) => {
        try {
            return await api.post('/marketplace/admin/portal-import/excel-preview', payload, {
                ...withTenantConfig({}),
                responseType: 'blob',
                timeout: 300000,
            });
        } catch (error) {
            if (error?.response?.status !== 404) {
                throw error;
            }

            console.warn('[marketplaceApi] /excel-preview returned 404, falling back to form-based /preview. This is expected during staggered deploys.');

            const formData = new FormData();
            formData.append('output_kind', 'excel');
            formData.append('analysis_json', JSON.stringify(payload?.import_analysis || {}));
            formData.append('article_title', String(payload?.article_title || 'portal_compras_publicas'));
            formData.append('export_context_json', JSON.stringify(payload?.export_context || {}));

            return api.post('/marketplace/admin/portal-import/preview', formData, {
                ...withTenantConfig({}),
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
                timeout: 300000,
            });
        }
    },
    updateAdminProduct: (productId, payload) => api.put(`/marketplace/admin/products/${productId}`, payload, withTenantConfig({})),
    uploadAdminProductImage: (file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post('/marketplace/admin/products/upload-image', formData, {
            ...withTenantConfig({}),
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    deleteAdminProduct: (productId) => api.delete(`/marketplace/admin/products/${productId}`, withTenantConfig({})),
    getAdminCategories: () => api.get('/marketplace/admin/categories'),
    createAdminCategory: (payload) => api.post('/marketplace/admin/categories', payload, withTenantConfig({})),
    updateAdminCategory: (categoryId, payload) => api.put(`/marketplace/admin/categories/${categoryId}`, payload, withTenantConfig({})),
    deleteAdminCategory: (categoryId) => api.delete(`/marketplace/admin/categories/${categoryId}`, withTenantConfig({})),
};

export default marketplaceApi;
