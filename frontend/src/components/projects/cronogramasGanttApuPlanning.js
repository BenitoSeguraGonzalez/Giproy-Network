const asFiniteNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const asPositiveNumber = (value, fallback = 0) => {
    const parsed = asFiniteNumber(value, fallback);
    return parsed > 0 ? parsed : fallback;
};

const relativeTolerance = (reference, floor = 0.0001) => (
    Math.max(floor, Math.abs(asFiniteNumber(reference, 0)) * 0.000001)
);

const buildValidation = (id, label, status, detail) => ({ id, label, status, detail });

const resolveOverallStatus = (validations = []) => {
    if (validations.some((validation) => validation.status === 'error')) return 'error';
    if (validations.some((validation) => validation.status === 'review')) return 'review';
    if (validations.length && validations.every((validation) => validation.status === 'ok')) return 'ok';
    return 'unavailable';
};

export const buildGanttApuPlanningSignals = ({
    row = null,
    effectiveRow = null,
    durationModel = null,
    costModel = null,
    dailyHours = 8,
    indirectPercentage = 0,
} = {}) => {
    if (!row?.is_calculable || !row?.apu_id) {
        return {
            available: false,
            overallStatus: 'unavailable',
            reason: 'Selecciona una actividad calculable vinculada a un APU.',
            metrics: {},
            validations: [],
        };
    }

    const sourceRow = effectiveRow || row;
    const metadata = {
        ...(row?.metadata || {}),
        ...(sourceRow?.metadata || {}),
    };
    const governingResource = metadata?.governing_resource || {};
    const quantity = asPositiveNumber(sourceRow?.cantidad ?? row?.cantidad, 0);
    const unit = String(sourceRow?.unidad || row?.unidad || 'u').trim() || 'u';
    const jornada = asPositiveNumber(durationModel?.jornada_horas, asPositiveNumber(dailyHours, 8));
    const planningFactor = asFiniteNumber(durationModel?.factor_eficiencia, 1);
    const validPlanningFactor = planningFactor > 0 && planningFactor <= 1;
    const governingCycle = asPositiveNumber(
        governingResource?.performance_hours_per_unit
            ?? durationModel?.governing_performance_hours_per_unit,
        quantity > 0
            ? asPositiveNumber(sourceRow?.trabajo_gobernante ?? row?.trabajo_gobernante, 0) / quantity
            : 0,
    );
    const theoreticalProduction = governingCycle > 0 ? 1 / governingCycle : 0;
    const plannedProduction = validPlanningFactor ? theoreticalProduction * planningFactor : 0;
    const netDurationHours = quantity > 0 && governingCycle > 0 ? quantity * governingCycle : 0;
    const plannedDurationHours = validPlanningFactor ? netDurationHours / planningFactor : 0;
    const plannedDurationDays = jornada > 0 ? plannedDurationHours / jornada : 0;

    const laborIntensity = asPositiveNumber(row?.rendimiento_unitario_mano_obra, 0);
    const laborNetHours = asPositiveNumber(row?.trabajo_mano_obra, quantity * laborIntensity);
    const laborPlannedHours = validPlanningFactor ? laborNetHours / planningFactor : 0;
    const nominalCrew = asPositiveNumber(row?.cuadrilla_mano_obra, 0);
    const equivalentCrew = plannedDurationHours > 0 ? laborPlannedHours / plannedDurationHours : 0;
    const crewLoad = nominalCrew > 0 ? equivalentCrew / nominalCrew : 0;
    const equipmentNetHours = asPositiveNumber(row?.trabajo_equipos, 0);
    const equipmentPlannedHours = validPlanningFactor ? equipmentNetHours / planningFactor : 0;

    const categoryCosts = costModel?.category_unit_costs || {};
    const equipmentUnitCost = asFiniteNumber(categoryCosts['Equipos y Herramientas'], 0);
    const transportUnitCost = asFiniteNumber(categoryCosts.Transporte, 0);
    const laborUnitCost = asFiniteNumber(categoryCosts['Mano de Obra'], 0);
    const materialUnitCost = asFiniteNumber(categoryCosts.Materiales, 0);
    const timeDependentUnitCost = equipmentUnitCost + transportUnitCost + laborUnitCost;
    const categoryDirectUnitCost = timeDependentUnitCost + materialUnitCost;
    const exactDirectUnitCost = asPositiveNumber(costModel?.unit_direct_cost, categoryDirectUnitCost);
    const plannedDirectUnitCost = validPlanningFactor
        ? materialUnitCost + (timeDependentUnitCost / planningFactor)
        : 0;
    const indirectFactor = Math.max(0, asFiniteNumber(indirectPercentage, 0)) / 100;
    const plannedUnitPrice = plannedDirectUnitCost * (1 + indirectFactor);

    const hasCoreCalculation = quantity > 0 && governingCycle > 0;
    const validations = [];
    validations.push(buildValidation(
        'planning-factor',
        'Factor de planificación',
        validPlanningFactor ? 'ok' : 'error',
        validPlanningFactor ? 'Dentro del rango 0 < Fp ≤ 1.' : 'El factor debe ser mayor que 0 y menor o igual que 1.',
    ));

    if (hasCoreCalculation && validPlanningFactor) {
        const flowError = Math.abs(quantity - (plannedProduction * plannedDurationHours));
        validations.push(buildValidation(
            'quantity-flow-time',
            'Cantidad = producción × duración',
            flowError <= relativeTolerance(quantity) ? 'ok' : 'error',
            `Diferencia ${flowError.toFixed(6)} ${unit}.`,
        ));
    } else {
        validations.push(buildValidation(
            'quantity-flow-time',
            'Cantidad = producción × duración',
            'review',
            'Faltan cantidad, ciclo gobernante o un Fp válido.',
        ));
    }

    if (laborPlannedHours > 0 && equivalentCrew > 0 && plannedDurationHours > 0) {
        const workError = Math.abs(laborPlannedHours - (equivalentCrew * plannedDurationHours));
        validations.push(buildValidation(
            'work-crew-time',
            'Trabajo = cuadrilla equivalente × duración',
            workError <= relativeTolerance(laborPlannedHours) ? 'ok' : 'error',
            `Diferencia ${workError.toFixed(6)} HH.`,
        ));
    } else {
        validations.push(buildValidation(
            'work-crew-time',
            'Trabajo = cuadrilla equivalente × duración',
            'review',
            'La fila no expone suficiente información de Mano de Obra.',
        ));
    }

    if (exactDirectUnitCost > 0 && categoryDirectUnitCost > 0) {
        const costError = Math.abs(exactDirectUnitCost - categoryDirectUnitCost);
        validations.push(buildValidation(
            'cost-categories',
            'Costo directo = suma de categorías',
            costError <= 0.01 ? 'ok' : 'review',
            `Diferencia ${costError.toFixed(4)} por ${unit}.`,
        ));
    } else {
        validations.push(buildValidation(
            'cost-categories',
            'Costo directo = suma de categorías',
            'review',
            'El modelo de costo no contiene desglose suficiente.',
        ));
    }

    validations.push(buildValidation(
        'crew-load',
        'Carga de cuadrilla nominal',
        nominalCrew <= 0 ? 'review' : crewLoad <= 1.000001 ? 'ok' : 'review',
        nominalCrew <= 0
            ? 'No existe cuadrilla nominal de Mano de Obra.'
            : crewLoad <= 1.000001
                ? 'La cuadrilla equivalente cabe en la dotación nominal.'
                : 'La carga supera el 100 % y requiere revisar dotación o solapes.',
    ));

    return {
        available: hasCoreCalculation,
        overallStatus: resolveOverallStatus(validations),
        reason: hasCoreCalculation ? '' : 'La actividad no expone un ciclo gobernante calculable.',
        activity: {
            code: String(row?.codigo_item || ''),
            description: String(row?.descripcion || 'Actividad sin descripción'),
            unit,
            governingResourceName: String(
                governingResource?.name
                    || durationModel?.governing_resource_name
                    || row?.recurso_gobernante_nombre
                    || 'Sin recurso gobernante',
            ),
            governingCandidateCount: Math.max(0, Math.trunc(asFiniteNumber(governingResource?.candidate_count, 0))),
        },
        metrics: {
            quantity,
            jornada,
            planningFactor,
            governingCycle,
            theoreticalProduction,
            plannedProduction,
            netDurationHours,
            plannedDurationHours,
            plannedDurationDays,
            laborIntensity,
            laborNetHours,
            laborPlannedHours,
            nominalCrew,
            equivalentCrew,
            crewLoad,
            equipmentNetHours,
            equipmentPlannedHours,
            exactDirectUnitCost,
            plannedDirectUnitCost,
            plannedUnitPrice,
            indirectPercentage: Math.max(0, asFiniteNumber(indirectPercentage, 0)),
        },
        validations,
    };
};
export const clampFloatingPanelPosition = (
    { left, top, width, height },
    viewportWidth,
    viewportHeight,
    padding = 12,
) => ({
    left: Math.min(
        Math.max(padding, Number(left || 0)),
        Math.max(padding, Number(viewportWidth || 0) - Math.max(0, Number(width || 0)) - padding),
    ),
    top: Math.min(
        Math.max(padding, Number(top || 0)),
        Math.max(padding, Number(viewportHeight || 0) - Math.max(0, Number(height || 0)) - padding),
    ),
});

