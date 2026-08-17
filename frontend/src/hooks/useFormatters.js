import { useContext, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';
import { formatoMoneda } from '../utils/math';
import { roundDecimalNumber } from '../utils/decimalNumbers';

export const useFormatters = () => {
    const { selectedEmpresa, activeProject } = useContext(AuthContext);

    // Obtener los valores configurados PRIORIZANDO el proyecto, luego la Empresa, con fallback a valores por defecto (2 y 4)
    const getMonetalesDecimals = useCallback(() => {
        const val = activeProject?.decimales_moneda ?? selectedEmpresa?.decimales_moneda;
        if (val !== undefined && val !== null) {
            return Number(val);
        }
        return 2;
    }, [selectedEmpresa, activeProject]);

    const getCalculoDecimals = useCallback(() => {
        const val = activeProject?.decimales_calculos ?? selectedEmpresa?.decimales_calculos;
        if (val !== undefined && val !== null) {
            return Number(val);
        }
        return 4;
    }, [selectedEmpresa, activeProject]);

    /**
     * Normaliza un valor de entrada para que acepte tanto punto como coma como separador decimal.
     * Retorna un string con punto decimal para que parseFloat funcione correctamente.
     */
    const parseNumericInput = useCallback((valor) => {
        if (valor === null || valor === undefined) return '';
        const str = String(valor);
        // Reemplazar la coma por punto para normalizar antes de cálculos/parseFloat
        return str.replace(',', '.');
    }, []);

    /**
     * Formatea un valor monetario aplicando el redondeo directo obligatorio.
     * Ejemplo: $ 10.50 (2 decimales por defecto)
     */
    const formatMoneda = useCallback((valor) => {
        return formatoMoneda(valor, getMonetalesDecimals());
    }, [getMonetalesDecimals]);

    /**
     * Variante para visualización (con separador es-ES para consistencia total)
     */
    const formatCalculoVisual = useCallback((valor) => {
        const normalized = parseNumericInput(valor);
        if (normalized === '' || normalized === null || normalized === undefined) return '0,' + '0'.repeat(getCalculoDecimals());
        
        const redondeado = roundDecimalNumber(normalized, getCalculoDecimals());
        
        return new Intl.NumberFormat('es-ES', {
            minimumFractionDigits: getCalculoDecimals(),
            maximumFractionDigits: getCalculoDecimals(),
            useGrouping: true
        }).format(redondeado);
    }, [getCalculoDecimals, parseNumericInput]);


    /**
     * Formatea un valor de cantidad, rendimiento u otros cálculos matemáticos.
     * Aliaseado a formatCalculoVisual para unificar la presentación.
     */
    const formatCalculo = useCallback((valor) => {
        return formatCalculoVisual(valor);
    }, [formatCalculoVisual]);

    /**
     * Formatea un valor monetario para INPUT (siempre con PUNTO para compatibilidad de componentes).
     * OJO: Para la entrada aceptamos ambos vía parseNumericInput.
     */
    const formatMonedaInput = useCallback((valor) => {
        const normalized = parseNumericInput(valor);
        const decimals = getMonetalesDecimals();
        if (normalized === '' || normalized === null || normalized === undefined) return '0.' + '0'.repeat(decimals);
        
        const redondeado = roundDecimalNumber(normalized, decimals);
        
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
            useGrouping: false
        }).format(redondeado);
    }, [getMonetalesDecimals, parseNumericInput]);

    /**
     * Variante simplificada para INPUTS: solo cambia punto por coma para visualización,
     * sin forzar decimales ni redondeos (ideal para el atributo value de los inputs).
     */
    /**
     * Formatea un valor para visualización en inputs o tablas.
     * Si se provee `decimals`, fuerza esa cantidad de decimales usando es-ES (coma decimal).
     * Si no, simplemente reemplaza el punto por coma (comportamiento original).
     */
    const formatNumericDisplay = useCallback((valor, decimals) => {
        if (valor === null || valor === undefined || valor === '') return '';

        if (decimals !== undefined) {
            const num = roundDecimalNumber(valor, decimals);
            return new Intl.NumberFormat('es-ES', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals,
                useGrouping: false
            }).format(num);
        }

        return String(valor).replace('.', ',');
    }, []);

    return {
        formatMoneda,
        formatMonedaInput,
        formatCalculo,
        formatCalculoVisual,
        parseNumericInput,
        formatNumericDisplay,
        precisionMoneda: getMonetalesDecimals(),
        precisionCalculo: getCalculoDecimals()
    };
};
