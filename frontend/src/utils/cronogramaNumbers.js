import {
    roundDecimalNumber,
    sumDecimalNumber,
    toDecimalNumber,
} from './decimalNumbers';

/*
POLITICA OBLIGATORIA DE CALCULO NUMERICO PARA CRONOGRAMAS

Esta utilidad es la unica via permitida para normalizar y persistir distribuciones.
No puede obviarse bajo ningun concepto en el cronograma valorado.

Reglas:
1. Toda distribucion persistida debe cerrar exactamente al 100%.
2. La normalizacion usa redondeo directo y ajusta el ultimo periodo como cierre canonico.
3. Si la desviacion total excede el umbral operativo, la distribucion no puede guardarse.
4. toFixed y sumas ad hoc solo pueden usarse para presentacion, nunca como politica de persistencia.
*/

export const parseCronogramaNumber = (value) => {
    if (value === null || value === undefined || value === '') return 0;
    return toDecimalNumber(value, '0');
};

export const roundCronogramaValue = (value, decimals = 6) => roundDecimalNumber(parseCronogramaNumber(value), decimals);

export const sumCronogramaDistribution = (values = [], decimals = 6) => {
    return sumDecimalNumber((values || []).map((value) => parseCronogramaNumber(value)), { decimals });
};

export const balanceCronogramaDistribution = (
    values = [],
    { decimals = 6, target = 100 } = {}
) => {
    if (!values || values.length === 0) return [];

    const rounded = values.map((value) => roundCronogramaValue(value, decimals));
    const partial = rounded.slice(0, -1).reduce((acc, value) => acc + value, 0);
    rounded[rounded.length - 1] = roundCronogramaValue(target - partial, decimals);
    return rounded;
};

export const normalizeCronogramaDistribution = (
    values = [],
    expectedLength,
    { decimals = 6, target = 100, maxDeviation = 5 } = {}
) => {
    if (!Array.isArray(values) || values.length !== expectedLength) return null;

    const normalized = values.map((value) => roundCronogramaValue(value, decimals));
    const total = sumCronogramaDistribution(normalized, decimals);
    if (Math.abs(total - target) > maxDeviation) return null;

    return balanceCronogramaDistribution(normalized, { decimals, target });
};

export const isCronogramaDistributionBalanced = (
    values = [],
    { decimals = 6, target = 100, tolerance = 0.001 } = {}
) => {
    return Math.abs(sumCronogramaDistribution(values, decimals) - target) <= tolerance;
};
