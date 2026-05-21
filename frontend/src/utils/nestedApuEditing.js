export const buildNestedApuEditConfirmConfig = ({
    currentApuDescripcion,
    nestedApuDescripcion,
    parentApusCount = null,
    affectedPresupuestosCount = null,
} = {}) => {
    const parentLabel = currentApuDescripcion || 'el APU actual';
    const childLabel = nestedApuDescripcion || 'el APU anidado';
    const impactParts = [];
    if (Number.isFinite(parentApusCount) && parentApusCount >= 0) {
        impactParts.push(
            `${parentApusCount} ${parentApusCount === 1 ? 'APU padre afectado' : 'APUs padres afectados'}`
        );
    }
    if (Number.isFinite(affectedPresupuestosCount) && affectedPresupuestosCount >= 0) {
        impactParts.push(
            `${affectedPresupuestosCount} ${affectedPresupuestosCount === 1 ? 'presupuesto afectado' : 'presupuestos afectados'}`
        );
    }
    const impactMessage = impactParts.length > 0
        ? ` Impacto estimado: ${impactParts.join(' · ')}.`
        : '';

    return {
        title: 'Editar APU anidado',
        message: `Va a editar "${childLabel}" desde "${parentLabel}". Antes de continuar se guardará el APU actual. Cualquier cambio en el APU anidado se propagará a todos los APUs que lo reutilicen y, si existen, a los presupuestos/base de proyecto asociados.${impactMessage} ¿Desea continuar?`,
        confirmLabel: 'Guardar y abrir',
        cancelLabel: 'Cancelar',
        tone: 'warning',
    };
};
