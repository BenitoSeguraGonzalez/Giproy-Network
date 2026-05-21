import React from 'react';
import { ArrowRight, ScanSearch } from 'lucide-react';

const formatStructuredValue = (value) => {
    try {
        return JSON.stringify(value, null, 2);
    } catch {
        return String(value);
    }
};

const renderPropertyValue = (value) => {
    if (value == null || value === '') {
        return <span>N/D</span>;
    }
    if (typeof value === 'object') {
        return (
            <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-words rounded-xl bg-zinc-100 px-3 py-2 text-left text-[11px] font-semibold text-zinc-700">
                {formatStructuredValue(value)}
            </pre>
        );
    }
    if (typeof value === 'boolean') {
        return <span>{value ? 'Sí' : 'No'}</span>;
    }
    return <span>{String(value)}</span>;
};

const buildGeometrySummary = (selectedElement) => {
    const geometry = selectedElement?.metadata_json?.geometry_2d;
    if (!geometry || typeof geometry !== 'object') {
        return [];
    }

    const points = Array.isArray(geometry.points) ? geometry.points : [];
    if (points.length === 2) {
        return [
            { key: 'Tipo geometría', value: 'Línea 2D' },
            { key: 'Puntos', value: points.length },
        ];
    }

    if (points.length >= 3) {
        return [
            { key: 'Tipo geometría', value: 'Polígono 2D' },
            { key: 'Puntos', value: points.length },
        ];
    }

    const hasRectGeometry = ['x', 'y', 'width', 'height'].every((key) => Number.isFinite(Number(geometry[key])));
    if (hasRectGeometry) {
        return [
            { key: 'Tipo geometría', value: 'Rectángulo 2D' },
            { key: 'Origen X', value: geometry.x },
            { key: 'Origen Y', value: geometry.y },
            { key: 'Ancho', value: geometry.width },
            { key: 'Alto', value: geometry.height },
        ];
    }

    return [{ key: 'Tipo geometría', value: 'Metadata geométrica disponible' }];
};

const buildMetadataSummary = (selectedElement) => {
    const metadata = { ...(selectedElement?.metadata_json || {}) };
    delete metadata.geometry_2d;
    return Object.entries(metadata).map(([key, value]) => ({ key, value }));
};

const buildTopSummary = (selectedElement, selectedLink) => {
    if (!selectedElement) {
        return [];
    }

    const geometry = selectedElement?.metadata_json?.geometry_2d;
    const points = Array.isArray(geometry?.points) ? geometry.points : [];
    const geometryLabel =
        points.length === 2
            ? 'Línea 2D'
            : points.length >= 3
              ? 'Polígono 2D'
              : ['x', 'y', 'width', 'height'].every((key) => Number.isFinite(Number(geometry?.[key])))
                ? 'Rectángulo 2D'
                : 'Sin geometría importada';

    return [
        { key: 'Clase IFC', value: selectedElement.ifc_class || 'Sin clase IFC' },
        { key: 'Nivel', value: selectedElement.storey_name || 'Sin nivel' },
        { key: 'Geometría', value: geometryLabel },
        {
            key: 'Vínculo',
            value: selectedLink ? selectedLink.target_type?.toUpperCase() || 'Activo' : 'Sin vínculo activo',
        },
    ];
};

const BimPropertiesPanel = ({ groups, ready, selectedElement, selectedLink, onNavigateTarget }) => {
    const geometryItems = buildGeometrySummary(selectedElement);
    const metadataItems = buildMetadataSummary(selectedElement);
    const topSummary = buildTopSummary(selectedElement, selectedLink);

    const selectedGroups = selectedElement
        ? [
              {
                  label: 'Elemento activo',
                  items: [
                      { key: 'Nombre', value: selectedElement.nombre || selectedElement.global_id },
                      { key: 'Global ID', value: selectedElement.global_id },
                      { key: 'Clase IFC', value: selectedElement.ifc_class },
                      { key: 'Nivel', value: selectedElement.storey_name },
                      { key: 'Sistema', value: selectedElement.system_name },
                      { key: 'Clasificación', value: selectedElement.classification },
                      { key: 'Descripción', value: selectedElement.descripcion },
                  ],
              },
              {
                  label: 'Geometría técnica',
                  items: geometryItems,
              },
              {
                  label: 'Propiedades del elemento',
                  items: Object.entries(selectedElement.properties || {}).map(([key, value]) => ({ key, value })),
              },
              {
                  label: 'Metadata BIM',
                  items: metadataItems,
              },
              ...(selectedLink
                  ? [
                        {
                            label: 'Vínculo activo',
                            items: [
                                { key: 'Tipo destino', value: selectedLink.target_type },
                                { key: 'Destino', value: selectedLink.target_label },
                                { key: 'Modo de vínculo', value: selectedLink.link_type },
                                { key: 'ID destino', value: selectedLink.target_id },
                                { key: 'Notas', value: selectedLink.notes || 'Sin notas' },
                            ],
                        },
                    ]
                  : []),
          ].filter((group) => group.items.length > 0)
        : groups;

    return (
        <div className="flex min-h-[220px] flex-col rounded-[1.5rem] border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-4">
                <div className="flex items-center gap-2">
                    <ScanSearch className="h-4 w-4 text-[#F39200]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Propiedades</p>
                </div>
                <h3 className="mt-1 text-sm font-black uppercase tracking-widest text-zinc-900">Metadatos operativos</h3>
            </div>
            <div className="space-y-3 px-5 py-5">
                {!ready || selectedGroups.length === 0 ? (
                    <p className="text-sm text-zinc-500">
                        {selectedElement
                            ? 'El elemento BIM no tiene propiedades registradas todavía.'
                            : 'No hay propiedades BIM activas todavía para este proyecto.'}
                    </p>
                ) : (
                    <>
                        {selectedElement ? (
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Resumen técnico</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {topSummary.map((item) => (
                                        <div
                                            key={item.key}
                                            className="rounded-full border border-zinc-200 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600"
                                        >
                                            <span className="text-zinc-400">{item.key}</span> {item.value}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}

                        {selectedGroups.map((group) => (
                            <div key={group.label} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">{group.label}</p>
                                <div className="mt-3 space-y-2">
                                    {(group.items || []).map((item) => (
                                        <div
                                            key={item.key}
                                            className="flex flex-col gap-2 border-b border-zinc-200/70 pb-2 text-sm last:border-b-0 last:pb-0"
                                        >
                                            <span className="font-bold text-zinc-500">{item.key}</span>
                                            <div className="text-right font-black text-zinc-800 break-words">
                                                {renderPropertyValue(item.value)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                {group.label === 'Vínculo activo' && selectedLink ? (
                                    <button
                                        type="button"
                                        onClick={() => onNavigateTarget?.(selectedLink)}
                                        className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#F39200]/20 bg-white px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200] transition-colors hover:bg-orange-50"
                                    >
                                        <ArrowRight className="h-3.5 w-3.5" />
                                        Abrir destino vinculado
                                    </button>
                                ) : null}
                            </div>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
};

export default BimPropertiesPanel;
