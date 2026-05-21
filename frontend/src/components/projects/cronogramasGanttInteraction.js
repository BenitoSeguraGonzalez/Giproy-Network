export const buildLineSubbarKey = (lineId = '', subbarId = '') => {
    const normalizedLineId = String(lineId || '').trim();
    const normalizedSubbarId = String(subbarId || '').trim();
    if (!normalizedLineId || !normalizedSubbarId) return '';
    return `${normalizedLineId}::${normalizedSubbarId}`;
};

export const filterSelectionKeysByLine = (lineId = '', selectedKeys = [], orderedSubbarIds = []) => {
    const normalizedLineId = String(lineId || '').trim();
    if (!normalizedLineId) return [];
    const safeSelectedKeys = Array.isArray(selectedKeys) ? selectedKeys : [];
    const safeOrderedSubbarIds = Array.isArray(orderedSubbarIds) ? orderedSubbarIds : [];
    const sameLineSet = new Set(
        safeSelectedKeys
            .map((key) => String(key || ''))
            .filter((key) => key.startsWith(`${normalizedLineId}::`))
    );
    if (!sameLineSet.size) return [];
    if (!safeOrderedSubbarIds.length) {
        return [...sameLineSet];
    }
    return safeOrderedSubbarIds
        .map((subbarId) => buildLineSubbarKey(normalizedLineId, subbarId))
        .filter((key) => sameLineSet.has(key));
};

export const resolveSubbarPointerSelection = ({
    lineId = '',
    subbarId = '',
    selectedKeys = [],
    orderedSubbarIds = [],
} = {}) => {
    const normalizedLineId = String(lineId || '').trim();
    const normalizedSubbarId = String(subbarId || '').trim();
    const targetKey = buildLineSubbarKey(normalizedLineId, normalizedSubbarId);
    if (!targetKey) {
        return {
            selectedSubbarKey: null,
            selectedSubbarKeys: [],
            draggedSubbarIds: [],
        };
    }

    const orderedSelectedKeys = filterSelectionKeysByLine(normalizedLineId, selectedKeys, orderedSubbarIds);
    const preserveMultiSelection = orderedSelectedKeys.length > 1 && orderedSelectedKeys.includes(targetKey);
    const nextKeys = preserveMultiSelection ? orderedSelectedKeys : [targetKey];

    return {
        selectedSubbarKey: targetKey,
        selectedSubbarKeys: nextKeys,
        draggedSubbarIds: nextKeys
            .map((key) => String(key).split('::')[1] || '')
            .filter(Boolean),
    };
};

const resolveSelectionFallbackKey = ({
    nextKeys = [],
    orderedSubbarIds = [],
    lineId = '',
    removedKey = '',
    currentSelectedKey = '',
} = {}) => {
    const safeNextKeys = Array.isArray(nextKeys) ? nextKeys.filter(Boolean) : [];
    if (!safeNextKeys.length) return null;
    const safeLineId = String(lineId || '').trim();
    const safeRemovedKey = String(removedKey || '').trim();
    const safeCurrentSelectedKey = String(currentSelectedKey || '').trim();
    if (safeCurrentSelectedKey && safeCurrentSelectedKey !== safeRemovedKey && safeNextKeys.includes(safeCurrentSelectedKey)) {
        return safeCurrentSelectedKey;
    }
    const orderedKeys = (Array.isArray(orderedSubbarIds) ? orderedSubbarIds : [])
        .map((subbarId) => buildLineSubbarKey(safeLineId, subbarId))
        .filter(Boolean);
    const removedIndex = orderedKeys.findIndex((key) => key === safeRemovedKey);
    if (removedIndex >= 0) {
        for (let index = removedIndex; index < orderedKeys.length; index += 1) {
            if (safeNextKeys.includes(orderedKeys[index])) {
                return orderedKeys[index];
            }
        }
        for (let index = removedIndex - 1; index >= 0; index -= 1) {
            if (safeNextKeys.includes(orderedKeys[index])) {
                return orderedKeys[index];
            }
        }
    }
    return safeNextKeys[safeNextKeys.length - 1];
};

export const resolveSubbarClickSelection = ({
    lineId = '',
    subbarId = '',
    selectedKeys = [],
    currentSelectedKey = '',
    orderedSubbarIds = [],
    range = false,
    toggle = false,
} = {}) => {
    const normalizedLineId = String(lineId || '').trim();
    const normalizedSubbarId = String(subbarId || '').trim();
    const targetKey = buildLineSubbarKey(normalizedLineId, normalizedSubbarId);
    if (!targetKey) {
        return {
            selectedSubbarKey: null,
            selectedSubbarKeys: [],
        };
    }

    const sameLineKeys = filterSelectionKeysByLine(normalizedLineId, selectedKeys, orderedSubbarIds);
    const normalizedCurrentSelectedKey = String(currentSelectedKey || '').trim();

    if (range && normalizedCurrentSelectedKey.startsWith(`${normalizedLineId}::`)) {
        const orderedKeys = (Array.isArray(orderedSubbarIds) ? orderedSubbarIds : [])
            .map((item) => buildLineSubbarKey(normalizedLineId, item))
            .filter(Boolean);
        const anchorIndex = orderedKeys.findIndex((key) => key === normalizedCurrentSelectedKey);
        const targetIndex = orderedKeys.findIndex((key) => key === targetKey);
        if (anchorIndex >= 0 && targetIndex >= 0) {
            const startIndex = Math.min(anchorIndex, targetIndex);
            const endIndex = Math.max(anchorIndex, targetIndex);
            return {
                selectedSubbarKey: targetKey,
                selectedSubbarKeys: orderedKeys.slice(startIndex, endIndex + 1),
            };
        }
    }

    if (toggle) {
        if (sameLineKeys.includes(targetKey)) {
            const nextKeys = sameLineKeys.filter((key) => key !== targetKey);
            if (!nextKeys.length) {
                return {
                    selectedSubbarKey: targetKey,
                    selectedSubbarKeys: [targetKey],
                };
            }
            return {
                selectedSubbarKey: resolveSelectionFallbackKey({
                    nextKeys,
                    orderedSubbarIds,
                    lineId: normalizedLineId,
                    removedKey: targetKey,
                    currentSelectedKey: normalizedCurrentSelectedKey,
                }),
                selectedSubbarKeys: nextKeys,
            };
        }
        return {
            selectedSubbarKey: targetKey,
            selectedSubbarKeys: [...sameLineKeys, targetKey],
        };
    }

    return {
        selectedSubbarKey: targetKey,
        selectedSubbarKeys: [targetKey],
    };
};

export const isTaskBarDraggable = ({ isCalculable = false, isManualMilestone = false } = {}) => (
    Boolean(isCalculable || isManualMilestone)
);

export const clampMoveDayDeltaToBounds = ({
    rawDayDelta = 0,
    minDayDelta = null,
    maxDayDelta = null,
    projectedStartPx = null,
    boundarySnapThresholdPx = 0,
    movingLeft = false,
} = {}) => {
    const normalizeOptionalNumber = (value) => {
        if (value === null || value === undefined || value === '') return null;
        const numeric = Number(value);
        return Number.isFinite(numeric) ? numeric : null;
    };
    let nextDayDelta = Number.isFinite(Number(rawDayDelta)) ? Number(rawDayDelta) : 0;
    const normalizedMinDayDelta = normalizeOptionalNumber(minDayDelta);
    const normalizedMaxDayDelta = normalizeOptionalNumber(maxDayDelta);
    const normalizedProjectedStartPx = normalizeOptionalNumber(projectedStartPx);
    const normalizedBoundarySnapThresholdPx = Math.max(0, Number(boundarySnapThresholdPx || 0));

    if (normalizedMinDayDelta != null) {
        nextDayDelta = Math.max(normalizedMinDayDelta, nextDayDelta);
    }
    if (normalizedMaxDayDelta != null) {
        nextDayDelta = Math.min(normalizedMaxDayDelta, nextDayDelta);
    }

    if (
        movingLeft
        && normalizedMinDayDelta != null
        && normalizedProjectedStartPx != null
        && normalizedProjectedStartPx <= normalizedBoundarySnapThresholdPx
    ) {
        nextDayDelta = normalizedMinDayDelta;
    }

    return nextDayDelta;
};
