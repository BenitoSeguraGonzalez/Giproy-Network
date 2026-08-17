/**
 * Utilidad para el cálculo del Valor Agregado Ecuatoriano (VAE)
 * Según la normativa de contratación pública en Ecuador.
 */

const normalizeResourceCpcPercentage = (recurso = {}) => {
    if (Object.prototype.hasOwnProperty.call(recurso, 'cpc_porcentaje')) {
        return Number(recurso.cpc_porcentaje || 0);
    }
    return Number(recurso?.cpc?.porcentaje || 0);
};

const hasResolvableResourceCpc = (recurso = {}) => {
    if (Object.prototype.hasOwnProperty.call(recurso, 'has_cpc')) return Boolean(recurso.has_cpc);
    if (Object.prototype.hasOwnProperty.call(recurso, 'cpc_codigo')) return Boolean(recurso.cpc_codigo);
    return Boolean(recurso?.cpc?.codCPC);
};

export const calculateApuVaeBreakdown = (recursos, costoDirecto) => {
    if (!recursos || recursos.length === 0 || costoDirecto === 0) {
        return {
            value: 0,
            isComplete: true,
            recursos: [],
        };
    }

    let vaePonderadoTotal = 0;
    let isComplete = true;

    const breakdown = recursos.map((recurso) => {
        const subtotal = Number(recurso?.total || 0);
        const pesoRelativo = subtotal / costoDirecto;
        const hasCpc = hasResolvableResourceCpc(recurso);
        const vaeRecurso = hasCpc ? (normalizeResourceCpcPercentage(recurso) / 100) : 0;
        const vaeContribution = pesoRelativo * vaeRecurso;

        if (!hasCpc) {
            isComplete = false;
        } else {
            vaePonderadoTotal += vaeContribution;
        }

        return {
            ...recurso,
            has_cpc: hasCpc,
            peso_relativo: pesoRelativo,
            vae_recurso: vaeRecurso,
            vae_contribution: vaeContribution,
        };
    });

    return {
        value: isComplete ? vaePonderadoTotal : null,
        isComplete,
        recursos: breakdown,
    };
};

/**
 * Calcula el VAE de un APU basado en sus recursos.
 * @param {Array} recursos - Lista de recursos del APU (equipos, materiales, mano de obra, transporte).
 * @param {number} costoDirecto - Costo directo total del APU (suma de subtotales).
 * @returns {number|null} Porcentaje de VAE del rubro (0-1) o null si falta CPC.
 */
export const calculateApuVae = (recursos, costoDirecto) => {
    return calculateApuVaeBreakdown(recursos, costoDirecto).value;
};

/**
 * Calcula el peso relativo de un rubro en el presupuesto consolidado.
 * @param {number} costoGlobalRubro - (Cantidad * Precio Unitario)
 * @param {number} montoTotalProyecto - Suma de todos los costos globales (sin IVA).
 * @returns {number} Porcentaje de peso relativo (0-1).
 */
export const calculatePesoRelativo = (costoGlobalRubro, montoTotalProyecto) => {
    if (montoTotalProyecto === 0) return 0;
    return costoGlobalRubro / montoTotalProyecto;
};

/**
 * Calcula el VAE Ponderado de un rubro para el consolidado del proyecto.
 * @param {number} vaeRubro - VAE calculado para el rubro (0-1).
 * @param {number} pesoRelativo - Peso del rubro en el proyecto (0-1).
 * @returns {number} VAE Ponderado (0-1).
 */
export const calculateVaePonderadoProject = (vaeRubro, pesoRelativo) => {
    if (vaeRubro === null || vaeRubro === undefined) return 0;
    return vaeRubro * pesoRelativo;
};
