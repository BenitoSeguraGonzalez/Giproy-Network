import api from './axiosConfig';
import { withTenantConfig } from './tenant';

const reportingApi = {
    previewReport: (payload, empresaId = null) => {
        const { empresa_id, ...data } = payload || {};
        return api({
            url: '/reporting/preview',
            method: 'POST',
            data,
            ...withTenantConfig({}, empresa_id ?? empresaId),
        });
    },
    exportReport: (payload, empresaId = null) => {
        const { empresa_id, ...data } = payload || {};
        return api({
            url: '/reporting/export',
            method: 'POST',
            data,
            responseType: 'blob',
            ...withTenantConfig({}, empresa_id ?? empresaId),
        });
    },
    getApuReport: (apuId, templateId = "001", empresaId = null) => {
        return api({
            url: `/reporting/apu/${apuId}`,
            method: 'GET',
            responseType: 'blob',
            ...withTenantConfig({ params: { template_id: templateId } }, empresaId),
        });
    },
    getPresupuestoReport: (presupuestoId, templateId = "001", empresaId = null) => {
        return api({
            url: `/reporting/presupuesto/${presupuestoId}`,
            method: 'GET',
            responseType: 'blob',
            ...withTenantConfig({ params: { template_id: templateId } }, empresaId),
        });
    },
    getEdtReport: (proyectoId, reportType = "listado", empresaId = null) => {
        return api({
            url: `/reporting/edt/${proyectoId}`,
            method: 'GET',
            responseType: 'blob',
            ...withTenantConfig({ params: { report_type: reportType } }, empresaId),
        });
    },
    getVaeReport: (presupuestoId, templateId = "001", empresaId = null) => {
        return api({
            url: `/reporting/vae/${presupuestoId}`,
            method: 'GET',
            responseType: 'blob',
            ...withTenantConfig({ params: { template_id: templateId } }, empresaId),
        });
    },
    getPolinomicaReport: (presupuestoId, templateId = "001", empresaId = null) => {
        return api({
            url: `/reporting/polinomica/${presupuestoId}`,
            method: 'GET',
            responseType: 'blob',
            ...withTenantConfig({ params: { template_id: templateId } }, empresaId),
        });
    }
};

export default reportingApi;
