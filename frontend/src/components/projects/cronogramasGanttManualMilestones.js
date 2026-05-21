const isManualMilestoneLineId = (value) => String(value || '').trim().startsWith('manual-milestone:');

const buildManualMilestoneLineId = (milestoneId) => {
    const normalized = String(milestoneId || '').trim();
    return normalized ? `manual-milestone:${normalized}` : '';
};

const normalizeDependencyEndpointId = (value) => {
    const raw = String(value ?? '').trim();
    if (!raw) return '';
    if (isManualMilestoneLineId(raw)) return raw;
    const numeric = Number(raw);
    return Number.isFinite(numeric) && numeric > 0 ? String(numeric) : '';
};

const serializeDependencyEndpointId = (value) => {
    const normalized = normalizeDependencyEndpointId(value);
    if (!normalized) return '';
    return isManualMilestoneLineId(normalized) ? normalized : Number(normalized);
};

const normalizeDependencyType = (value) => {
    const candidate = String(value || 'FS').trim().toUpperCase();
    if (candidate === 'FC') return 'FS';
    if (candidate === 'CC') return 'SS';
    if (candidate === 'CF') return 'SF';
    return ['FS', 'SS', 'FF', 'SF'].includes(candidate) ? candidate : 'FS';
};

const normalizeDependencyLag = (value) => {
    const numeric = Number(value ?? 0);
    return Number.isFinite(numeric) ? numeric : 0;
};

const normalizeDependencyLagUnit = (value) => {
    const candidate = String(value || 'day').trim().toLowerCase();
    return ['day', 'hour', 'minute', 'percent'].includes(candidate) ? candidate : 'day';
};

const buildNormalizedDependencies = (targetId, rawDependencies = []) => {
    const bySource = new Map();
    const normalizedTargetId = normalizeDependencyEndpointId(targetId);
    (Array.isArray(rawDependencies) ? rawDependencies : []).forEach((dependency) => {
        const sourceId = normalizeDependencyEndpointId(
            dependency?.source_id ?? dependency?.sourceId ?? dependency?.predecessor_id,
        );
        if (!sourceId) return;
        const dependencyTargetId = normalizeDependencyEndpointId(
            dependency?.target_id ?? dependency?.targetId ?? normalizedTargetId,
        ) || normalizedTargetId;
        bySource.set(sourceId, {
            source_id: serializeDependencyEndpointId(sourceId),
            target_id: serializeDependencyEndpointId(dependencyTargetId),
            type: normalizeDependencyType(dependency?.type),
            lag_days: normalizeDependencyLag(dependency?.lag_days ?? dependency?.lagDays),
            lag_unit: normalizeDependencyLagUnit(
                dependency?.lag_unit ?? dependency?.lagUnit ?? 'day',
            ),
            lag_mode: normalizeDependencyLagUnit(
                dependency?.lag_unit ?? dependency?.lagUnit ?? 'day',
            ) === 'percent'
                ? 'percent'
                : (dependency?.lag_mode || dependency?.lagMode || 'duration'),
            metadata: dependency?.metadata || {},
        });
    });
    return Array.from(bySource.values());
};

export const normalizeManualMilestonesConfig = (manualMilestones = [], fechaInicioProyecto = null) => (
    (Array.isArray(manualMilestones) ? manualMilestones : [])
        .map((entry, index) => {
            const id = String(entry?.id || `manual-milestone-${index + 1}`).trim();
            if (!id) return null;
            const milestoneLineId = buildManualMilestoneLineId(id);
            const normalizedDependencies = Array.isArray(entry?.dependencies)
                ? buildNormalizedDependencies(milestoneLineId, entry.dependencies)
                : [];
            const normalizedSuccessorDependencies = Array.isArray(entry?.successor_dependencies)
                ? entry.successor_dependencies
                    .map((dependency) => {
                        const targetId = normalizeDependencyEndpointId(
                            dependency?.target_id ?? dependency?.targetId,
                        );
                        if (!targetId || targetId === milestoneLineId) return null;
                        return {
                            source_id: serializeDependencyEndpointId(milestoneLineId),
                            target_id: serializeDependencyEndpointId(targetId),
                            type: normalizeDependencyType(dependency?.type),
                            lag_days: normalizeDependencyLag(
                                dependency?.lag_days ?? dependency?.lagDays,
                            ),
                            lag_unit: normalizeDependencyLagUnit(
                                dependency?.lag_unit ?? dependency?.lagUnit ?? 'day',
                            ),
                            lag_mode: normalizeDependencyLagUnit(
                                dependency?.lag_unit ?? dependency?.lagUnit ?? 'day',
                            ) === 'percent'
                                ? 'percent'
                                : (dependency?.lag_mode || dependency?.lagMode || 'duration'),
                            metadata: dependency?.metadata || {},
                        };
                    })
                    .filter(Boolean)
                : [];
            return {
                id,
                after_line_id: String(entry?.after_line_id || '').trim(),
                display_after_line_id: String(
                    entry?.display_after_line_id || entry?.after_line_id || '',
                ).trim(),
                descripcion: String(entry?.descripcion || 'Nuevo hito').trim() || 'Nuevo hito',
                start_date: entry?.start_date || fechaInicioProyecto,
                predecessors: normalizedDependencies
                    .map((dependency) => normalizeDependencyEndpointId(dependency?.source_id))
                    .filter(Boolean),
                dependencies: normalizedDependencies,
                successor_dependencies: normalizedSuccessorDependencies,
            };
        })
        .filter(Boolean)
);
