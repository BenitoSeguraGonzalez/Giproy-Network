import { roundDecimal } from './math';
import {
    multiplyDecimalNumber,
    toDecimalNumber,
} from './decimalNumbers';

/*
POLITICA OBLIGATORIA DE CALCULO NUMERICO

Esta utilidad es la unica via permitida en frontend para resolver importes operativos.
No puede obviarse bajo ningun concepto en modulos economicos criticos.

Reglas:
1. En modo lectura, si existe subtotal persistido, se usa como fuente de verdad visual.
2. En modo edicion viva, puede forzarse el recálculo con los valores actuales de la fila.
3. Si existe simulacion explicita, se calcula con helper dedicado y se marca como temporal.
4. Queda prohibido multiplicar ad hoc precio*cantidad o precio*cantidad*rendimiento
   en modulos economicos criticos fuera de esta utilidad.
5. Queda prohibido usar toFixed/Math.round como regla economica operativa.
*/

export const parseOperationalNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    return toDecimalNumber(value, '0');
};

export const resolveOperationalRelativeWork = (resource = {}) => {
    const sourceLines = Array.isArray(resource?.source_lines) ? resource.source_lines : [];
    const sourceWork = sourceLines.reduce(
        (total, line) => total + parseOperationalNumber(line?.trabajo_relativo),
        0
    );
    if (sourceWork > 0) return sourceWork;

    const persistedWork = parseOperationalNumber(resource?.trabajo_relativo);
    if (persistedWork > 0) return persistedWork;

    return multiplyDecimalNumber(
        [
            parseOperationalNumber(resource?.cantidad),
            parseOperationalNumber(resource?.rendimiento_equivalente ?? resource?.rendimiento),
        ],
        { decimals: 12 }
    );
};

export const resolveLockedOperationalResourceValues = (resource = {}, quantity = null) => {
    const activeQuantity = quantity === null
        ? parseOperationalNumber(resource?.cantidad)
        : parseOperationalNumber(quantity);
    const relativeWork = resolveOperationalRelativeWork(resource);
    const rendimiento = activeQuantity > 0 && relativeWork > 0
        ? relativeWork / activeQuantity
        : 0;

    return {
        cantidad: activeQuantity,
        trabajoRelativo: relativeWork,
        rendimiento,
    };
};

export const roundOperationalMoney = (value, moneyDecimals = 2) => roundDecimal(value ?? 0, moneyDecimals);

export const resolveBudgetLineOperationalSubtotal = (
    linea,
    { moneyDecimals = 2, tanteoSession = {} } = {}
) => {
    if (!linea || linea.tipo === 'CUENTA_PAQUETE' || !linea.apu_id) return 0;

    const simulatedPrice = linea.apu_id != null ? tanteoSession?.[linea.apu_id] : undefined;
    if (simulatedPrice !== undefined) {
        const quantity = parseOperationalNumber(linea.cantidad);
        return multiplyDecimalNumber(
            [simulatedPrice, quantity],
            { decimals: moneyDecimals }
        );
    }

    if (linea.precio_total !== undefined && linea.precio_total !== null && linea.precio_total !== '') {
        return roundOperationalMoney(linea.precio_total, moneyDecimals);
    }

    const price = parseOperationalNumber(linea.precio_unitario);
    const quantity = parseOperationalNumber(linea.cantidad);
    return multiplyDecimalNumber([price, quantity], { decimals: moneyDecimals });
};

export const sumBudgetOperationalSubtotals = (lineas = [], options = {}) => {
    return lineas.reduce((acc, linea) => acc + resolveBudgetLineOperationalSubtotal(linea, options), 0);
};

export const resolveApuLineOperationalUnitPrice = (
    linea,
    { moneyDecimals = 2 } = {}
) => {
    const item = linea?.item_obj || linea?.recurso || linea?.apu_hijo;
    const rawPrice = linea?.precio !== undefined && linea?.precio !== null && linea?.precio !== ''
        ? linea.precio
        : linea?.precio_congelado ?? (
            linea?.is_apu || linea?.apu_hijo_id
                ? (item?.costo_directo ?? item?.precio_unitario_total ?? 0)
                : (item?.precio ?? item?.precio_unitario_total ?? 0)
        );
    return roundOperationalMoney(rawPrice, moneyDecimals);
};

export const resolveApuLineOperationalSubtotal = (
    linea,
    { moneyDecimals = 2, preferPersistedSubtotal = true } = {}
) => {
    if (
        preferPersistedSubtotal &&
        linea?.subtotal !== undefined &&
        linea?.subtotal !== null &&
        linea?.subtotal !== ''
    ) {
        return roundOperationalMoney(linea.subtotal, moneyDecimals);
    }

    const unitPrice = resolveApuLineOperationalUnitPrice(linea, { moneyDecimals });
    const quantity = parseOperationalNumber(linea?.cantidad_num ?? linea?.cantidad);
    const rendimiento = parseOperationalNumber((linea?.rendimiento_num ?? linea?.rendimiento) || 1);
    return multiplyDecimalNumber([unitPrice, quantity, rendimiento || 1], { decimals: moneyDecimals });
};

export const resolveApuLineSimulatedSubtotal = (
    linea,
    { moneyDecimals = 2, cantidad = null, rendimiento = null } = {}
) => {
    const unitPrice = resolveApuLineOperationalUnitPrice(linea, { moneyDecimals });
    const quantity = cantidad === null
        ? parseOperationalNumber(linea?.cantidad_num ?? linea?.cantidad)
        : parseOperationalNumber(cantidad);
    const effectiveRendimiento = rendimiento === null
        ? parseOperationalNumber((linea?.rendimiento_num ?? linea?.rendimiento) || 1)
        : parseOperationalNumber(rendimiento);
    return multiplyDecimalNumber([unitPrice, quantity, effectiveRendimiento || 1], { decimals: moneyDecimals });
};
