import { normalizeDisplayUnit } from './descriptionCapitalization';

export function normalizeUnitToken(value) {
    return normalizeDisplayUnit(value || '').trim();
}

export function findMatchingUnit(units = [], valueOrId) {
    if (valueOrId === null || valueOrId === undefined || valueOrId === '') return null;

    const numericId = Number(valueOrId);
    if (!Number.isNaN(numericId) && numericId > 0) {
        const byId = units.find((unit) => Number(unit.id) === numericId);
        if (byId) return byId;
    }

    const normalizedValue = normalizeUnitToken(valueOrId);
    if (!normalizedValue) return null;

    return (
        units.find((unit) => normalizeUnitToken(unit.descripcion) === normalizedValue)
        || units.find((unit) => normalizeUnitToken(unit.descripcion_completa) === normalizedValue)
        || null
    );
}

export function resolveUnitId(units = [], valueOrId, fallbackId = null) {
    return findMatchingUnit(units, valueOrId)?.id || fallbackId;
}

export function resolveUnitDescription(units = [], valueOrId, fallbackValue = '') {
    const match = findMatchingUnit(units, valueOrId);
    if (match?.descripcion) return normalizeUnitToken(match.descripcion);
    return normalizeUnitToken(fallbackValue);
}

function normalizeUnitCandidate(candidate) {
    if (!candidate) return '';
    if (typeof candidate === 'object') {
        return normalizeUnitToken(
            candidate.descripcion
            || candidate.descripcion_completa
            || candidate.nombre
            || ''
        );
    }
    return normalizeUnitToken(candidate);
}

export function resolveApuLineUnitDescription(line = {}, fallbackValue = '') {
    const candidates = [
        line?.recurso?.unidad,
        line?.item_obj?.recurso?.unidad,
        line?.item_obj?.unidad,
        line?.apu_hijo?.unidad,
        line?.item_obj?.apu_hijo?.unidad,
        line?.unidad,
        fallbackValue,
    ];

    for (const candidate of candidates) {
        const normalized = normalizeUnitCandidate(candidate);
        if (normalized) return normalized;
    }

    return '';
}
