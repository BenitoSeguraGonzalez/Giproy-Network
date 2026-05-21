import { roundDecimal } from './math';
import { sumBudgetOperationalSubtotals } from './operationalNumbers';
import {
    divideDecimalNumber,
    multiplyDecimalNumber,
    roundDecimalNumber,
    sumDecimalNumber,
    toDecimalNumber,
} from './decimalNumbers';

export const formatEdtCurrency = (value) => `$${toDecimalNumber(value || 0).toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const formatEdtPercent = (value) => `${roundDecimalNumber(value || 0, 2).toFixed(2)}%`;

const roundEdtMoney = (value, decimals = 2) => roundDecimalNumber(value || 0, decimals);

export const buildEdtNodeMetrics = ({ tree, lineas, tanteoSession, indirectosPorcentaje }) => {
    const lineasByEdt = (lineas || []).reduce((acc, linea) => {
        const key = linea.edt_id;
        if (!acc[key]) acc[key] = [];
        acc[key].push(linea);
        return acc;
    }, {});

    const walk = (node) => {
        const ownDirecto = sumBudgetOperationalSubtotals(lineasByEdt[node.id] || [], {
            moneyDecimals: 2,
            tanteoSession,
        });

        const children = (node.hijos || []).map(walk);
        const directChildren = sumDecimalNumber(children.map((child) => child.metrics?.directo || 0), { decimals: 2 });
        const directo = roundEdtMoney(sumDecimalNumber([ownDirecto, directChildren], { decimals: 2 }), 2);
        const factor = sumDecimalNumber([1, divideDecimalNumber(indirectosPorcentaje || 0, 100, { decimals: 6 })], { decimals: 6 });
        const valorado = roundEdtMoney(multiplyDecimalNumber([directo, factor], { decimals: 2 }), 2);

        return {
            ...node,
            hijos: children,
            metrics: {
                ownDirecto,
                directo,
                valorado,
            },
        };
    };

    return (tree || []).map(walk);
};

export const findEdtNodeById = (nodes, nodeId) => {
    const stack = [...(nodes || [])];
    while (stack.length) {
        const current = stack.shift();
        if (current.id === nodeId) return current;
        if (current.hijos?.length) stack.unshift(...current.hijos);
    }
    return null;
};
