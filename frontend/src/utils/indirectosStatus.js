export const getIndirectosStatus = (rawValue) => {
    const value = Number(rawValue || 0);

    if (value === 0) {
        return {
            key: 'rojo',
            label: 'Pendiente',
            description: 'Indirectos en 0%',
            dotClass: 'bg-red-500',
            softTextClass: 'text-red-300',
            strongTextClass: 'text-red-200',
            softBorderClass: 'border-red-400/30',
            softBgClass: 'bg-red-500/10'
        };
    }

    if (value < 10) {
        return {
            key: 'ambar',
            label: 'Bajo',
            description: 'Indirectos por debajo del 10%',
            dotClass: 'bg-amber-400',
            softTextClass: 'text-amber-300',
            strongTextClass: 'text-amber-200',
            softBorderClass: 'border-amber-300/30',
            softBgClass: 'bg-amber-400/10'
        };
    }

    return {
        key: 'verde',
        label: 'OK',
        description: 'Indirectos parametrizados',
        dotClass: 'bg-emerald-400',
        softTextClass: 'text-emerald-300',
        strongTextClass: 'text-emerald-200',
        softBorderClass: 'border-emerald-300/30',
        softBgClass: 'bg-emerald-400/10'
    };
};
