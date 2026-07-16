const toFiniteNumber = (value, fallback = 0) => {
    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : fallback;
};

const normalizeBounds2d = (bounds = {}) => {
    const x = toFiniteNumber(bounds.x);
    const y = toFiniteNumber(bounds.y);
    const width = Math.max(12, toFiniteNumber(bounds.width, 56));
    const height = Math.max(12, toFiniteNumber(bounds.height ?? bounds.depth, 40));

    return { x, y, width, height };
};

export const adaptViewerArtifactToElements = (viewerArtifact = null) => {
    const artifactElements = Array.isArray(viewerArtifact?.elements) ? viewerArtifact.elements : [];

    return artifactElements
        .map((artifactElement, index) => {
            const id = artifactElement.bim_element_id ?? artifactElement.id ?? artifactElement.viewer_id ?? index + 1;
            const bounds2d = normalizeBounds2d(artifactElement.bounds_2d || artifactElement.geometry_2d || {});

            return {
                id,
                global_id: artifactElement.global_id || artifactElement.viewer_id || `artifact-element-${id}`,
                ifc_class: artifactElement.ifc_class || 'IfcElement',
                nombre: artifactElement.name || artifactElement.nombre || artifactElement.global_id || `Elemento ${id}`,
                name: artifactElement.name || artifactElement.nombre || artifactElement.global_id || `Elemento ${id}`,
                storey_name: artifactElement.storey_name || artifactElement.storey || null,
                bim_model_version_id: viewerArtifact.source_version_id || artifactElement.bim_model_version_id || null,
                metadata_json: {
                    ...(artifactElement.metadata_json || {}),
                    geometry_2d: bounds2d,
                    viewer_artifact: {
                        artifact_version: viewerArtifact.artifact_version || 1,
                        source_artifact_path: viewerArtifact.source_artifact_path || null,
                        viewer_id: artifactElement.viewer_id || null,
                        property_count: toFiniteNumber(artifactElement.property_count, 0),
                    },
                },
            };
        })
        .filter((element) => element.id !== null && element.id !== undefined);
};

export default adaptViewerArtifactToElements;
