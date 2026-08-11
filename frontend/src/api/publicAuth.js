import api from './axiosConfig';
import { withoutTenant } from './tenant';

export const publicAuthApi = {
    getLegalManifest: async () => {
        const response = await api.get('/legal/manifest', withoutTenant());
        return response.data;
    },
    register: async (payload) => {
        const response = await api.post('/register', payload, withoutTenant());
        return response.data;
    },

    verifyRegistration: async (token) => {
        const response = await api.get('/register/verify', withoutTenant({
            params: { token },
        }));
        return response.data;
    },

    getAccountsByEmail: async (email) => {
        const response = await api.get('/auth/accounts-by-email', withoutTenant({
            params: { email },
        }));
        return response.data;
    },

    requestPasswordRecovery: async (email) => {
        const response = await api.post(
            `/password-recovery/${encodeURIComponent(email)}`,
            {},
            withoutTenant()
        );
        return response.data;
    },

    resetPassword: async ({ token, newPassword }) => {
        const response = await api.post(
            '/reset-password/',
            {
                token,
                new_password: newPassword,
            },
            withoutTenant()
        );
        return response.data;
    },

    validarRuc: async (ruc) => {
        const { data } = await api.get(`/sri-ruc/public/lookup/${encodeURIComponent(ruc)}`, withoutTenant());
        return {
            valido: data.valid,
            mensaje: data.message,
            razon_social: data.business_name,
            estado_contribuyente: data.taxpayer_status,
            clase_contribuyente: data.taxpayer_type,
            fecha_inicio_actividades: data.start_date,
            actividad_economica: data.economic_activity,
            source: data.source,
            source_date: data.source_date,
            requires_manual_review: data.requires_manual_review,
        };
    },

    requestRucManualReview: async (payload) => {
        const response = await api.post('/sri-ruc/public/manual-review', payload, withoutTenant());
        return response.data;
    },

    getRucManualReviewStatus: async (token) => {
        const response = await api.get('/sri-ruc/public/manual-review/status', withoutTenant({ params: { token } }));
        return response.data;
    },
};

export default publicAuthApi;
