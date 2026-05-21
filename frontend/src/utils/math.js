/**
 * math.js - Utilidades Matemáticas y de Redondeo para GiProy Network
 * Implementa la política oficial de redondeo directo del sistema.
 */
import { roundDecimalNumber } from './decimalNumbers';

export const roundDecimal = (valor, precision = 2) => {
    return roundDecimalNumber(valor, precision);
};

// Alias transitorio de compatibilidad para chunks remotos aun no renovados.
export const redondeoCascada = roundDecimal;

export const redondeoEstandar = roundDecimal;

/**
 * Aplica el formato monetario o número según los decimales de presentación.
 * Siempre usa la política oficial de redondeo directo.
 */
export const formatoMoneda = (valor, decimales = 2) => {
    const numerico = roundDecimal(valor, decimales);

    // Retorna string con coma separador de miles si es necesario
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimales,
        maximumFractionDigits: decimales,
        useGrouping: true
    }).format(numerico);
};

/**
 * Aplica el formato de cantidades (ej. 4 decimales visuales siempre obligatorios, incluso si son 0000).
 */
export const formatoCantidad = (valor, decimalesCalculo = 4) => {
    return new Intl.NumberFormat('es-ES', {
        minimumFractionDigits: decimalesCalculo,
        maximumFractionDigits: decimalesCalculo,
        useGrouping: false
    }).format(roundDecimal(valor, decimalesCalculo));
};
