export const resolveCriticalEdgeKeys = ({
    nodes = new Map(),
    outgoing = new Map(),
    targetStartConstraint,
    tolerance = 0.0001,
}) => {
    const safeNodes = nodes instanceof Map ? nodes : new Map();
    const safeOutgoing = outgoing instanceof Map ? outgoing : new Map();
    const criticalOutgoingByNode = new Map();
    const criticalIncomingByNode = new Map();

    safeNodes.forEach((node, nodeId) => {
        criticalOutgoingByNode.set(String(nodeId), []);
        criticalIncomingByNode.set(String(nodeId), []);
    });

    safeNodes.forEach((source, sourceId) => {
        (safeOutgoing.get(sourceId) || []).forEach((edge) => {
            const target = safeNodes.get(edge.targetId);
            if (!target || typeof targetStartConstraint !== 'function') return;
            const constrainedStart = Number(targetStartConstraint(source, target, edge.dependency));
            const targetEs = Number(target.es ?? 0);
            const sourceCritical = Number(source.totalSlack ?? 1) <= tolerance;
            const targetCritical = Number(target.totalSlack ?? 1) <= tolerance;
            const constraintIsBinding = Math.abs(targetEs - constrainedStart) <= tolerance;
            if (!sourceCritical || !targetCritical || !constraintIsBinding) return;

            const edgeKey = `${edge.sourceId}-${edge.targetId}`;
            criticalOutgoingByNode.set(String(sourceId), [
                ...(criticalOutgoingByNode.get(String(sourceId)) || []),
                edgeKey,
            ]);
            criticalIncomingByNode.set(String(edge.targetId), [
                ...(criticalIncomingByNode.get(String(edge.targetId)) || []),
                edgeKey,
            ]);
        });
    });

    return {
        criticalOutgoingByNode,
        criticalIncomingByNode,
    };
};

export const normalizeBackendCriticalPaths = (metadata = {}) => {
    const network = metadata?.cpm_network || {};
    return (Array.isArray(network?.critical_paths) ? network.critical_paths : [])
        .map((path) => (
            Array.isArray(path)
                ? path.map((nodeId) => String(nodeId || '').trim()).filter(Boolean)
                : []
        ))
        .filter((path) => path.length > 0);
};

export const resolveBackendCriticalPathMembership = (metadata = {}, nodeId = '') => {
    const normalizedNodeId = String(nodeId || '').trim();
    const criticalPaths = normalizeBackendCriticalPaths(metadata);
    const outgoing = [];
    const incoming = [];
    const pathIndexes = [];

    criticalPaths.forEach((path, pathIndex) => {
        if (path.includes(normalizedNodeId)) {
            pathIndexes.push(pathIndex + 1);
        }
        for (let index = 0; index < path.length - 1; index += 1) {
            const sourceId = path[index];
            const targetId = path[index + 1];
            const edgeKey = `${sourceId}-${targetId}`;
            if (sourceId === normalizedNodeId) outgoing.push(edgeKey);
            if (targetId === normalizedNodeId) incoming.push(edgeKey);
        }
    });

    return {
        criticalOutgoingKeys: Array.from(new Set(outgoing)),
        criticalIncomingKeys: Array.from(new Set(incoming)),
        criticalPathIndexes: Array.from(new Set(pathIndexes)),
        criticalPathCount: criticalPaths.length,
    };
};
