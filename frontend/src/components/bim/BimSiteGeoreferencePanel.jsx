import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Crosshair, Eye, EyeOff, Layers3, MapPin, Plus, Save, Trash2 } from 'lucide-react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap, WMSTileLayer } from '../maps/LeafletMap';
import 'leaflet/dist/leaflet.css';

import { bimModelsApi } from '../../api/bimModels';

const DEFAULT_SITE = {
    crs: 'EPSG:4326', latitude: -0.1807, longitude: -78.4678, altitude: 0,
    local_origin: [0, 0, 0], heading_degrees: 0, map_zoom: 18, justification: '',
};

const DEFAULT_LAYERS = [{
    key: 'openstreetmap', name: 'OpenStreetMap', kind: 'basemap', service_type: 'xyz',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    layer_name: null, min_zoom: 3, max_zoom: 22, opacity: 1, visible: true, order: 0,
}];

const EMPTY_LAYER = { name: '', service_type: 'xyz', url: '', layer_name: '', kind: 'overlay' };

const MapView = ({ latitude, longitude, zoom }) => {
    const map = useMap();
    useEffect(() => { map.setView([latitude, longitude], zoom); }, [latitude, longitude, map, zoom]);
    return null;
};

const BimSiteGeoreferencePanel = ({ projectId, empresaId, activeVersionId, onSelectVersion, api = bimModelsApi }) => {
    const [site, setSite] = useState(null);
    const [form, setForm] = useState(DEFAULT_SITE);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [catalog, setCatalog] = useState(null);
    const [layers, setLayers] = useState(DEFAULT_LAYERS);
    const [layerDraft, setLayerDraft] = useState(EMPTY_LAYER);
    const [catalogReason, setCatalogReason] = useState('');
    const [savingCatalog, setSavingCatalog] = useState(false);

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const [payload, mapCatalog] = await Promise.all([
                api.getSiteGeoreference(projectId, empresaId),
                api.getMapCatalog?.(projectId, empresaId),
            ]);
            setSite(payload);
            setCatalog(mapCatalog || null);
            setLayers(mapCatalog?.layers?.length ? mapCatalog.layers : DEFAULT_LAYERS);
            if (payload) setForm({
                crs: payload.crs,
                latitude: payload.latitude,
                longitude: payload.longitude,
                altitude: payload.altitude,
                local_origin: payload.local_origin,
                heading_degrees: payload.heading_degrees,
                map_zoom: payload.map_zoom,
                justification: '',
            });
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo cargar la georreferencia BIM.');
        } finally {
            setLoading(false);
        }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);

    const updateNumber = (field, value) => setForm((current) => ({ ...current, [field]: Number(value) || 0 }));
    const updateOrigin = (index, value) => setForm((current) => {
        const localOrigin = [...current.local_origin]; localOrigin[index] = Number(value) || 0;
        return { ...current, local_origin: localOrigin };
    });

    const save = async () => {
        if (form.justification.trim().length < 3) return;
        try {
            setSaving(true); setMessage('');
            const saved = await api.saveSiteGeoreference(projectId, { ...form, justification: form.justification.trim() }, empresaId);
            setSite(saved); setForm((current) => ({ ...current, justification: '' }));
            setMessage(`Georreferencia r${saved.revision} guardada`);
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo guardar la georreferencia BIM.');
        } finally {
            setSaving(false);
        }
    };

    const center = useMemo(() => [Number(site?.latitude ?? form.latitude), Number(site?.longitude ?? form.longitude)], [form.latitude, form.longitude, site]);
    const points = site?.map_points || [];
    const visibleLayers = useMemo(() => [...layers].filter((layer) => layer.visible).sort((left, right) => left.order - right.order), [layers]);

    const toggleLayer = (key) => setLayers((current) => current.map((layer) => {
        if (layer.key !== key) {
            return layer.kind === 'basemap' && current.find((candidate) => candidate.key === key)?.kind === 'basemap'
                ? { ...layer, visible: false }
                : layer;
        }
        return { ...layer, visible: layer.kind === 'basemap' ? true : !layer.visible };
    }));

    const updateOpacity = (key, opacity) => setLayers((current) => current.map((layer) => (
        layer.key === key ? { ...layer, opacity: Number(opacity) } : layer
    )));

    const addLayer = () => {
        const name = layerDraft.name.trim();
        const url = layerDraft.url.trim();
        if (name.length < 2 || !url.startsWith('http')) return;
        const keyBase = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'layer';
        const key = `${keyBase}-${layers.length + 1}`;
        setLayers((current) => [...current, {
            key, name, kind: layerDraft.kind, service_type: layerDraft.service_type, url,
            attribution: '', layer_name: layerDraft.service_type === 'wms' ? layerDraft.layer_name.trim() : null,
            min_zoom: 3, max_zoom: 22, opacity: 0.8, visible: layerDraft.kind === 'overlay', order: current.length,
        }]);
        setLayerDraft(EMPTY_LAYER);
    };

    const removeLayer = (key) => setLayers((current) => {
        const target = current.find((layer) => layer.key === key);
        if (target?.kind === 'basemap' && current.filter((layer) => layer.kind === 'basemap').length === 1) return current;
        const next = current.filter((layer) => layer.key !== key);
        if (target?.kind === 'basemap' && target.visible) {
            const fallback = next.find((layer) => layer.kind === 'basemap');
            return next.map((layer) => ({ ...layer, visible: layer.key === fallback?.key ? true : layer.visible }));
        }
        return next;
    });

    const saveCatalog = async () => {
        if (catalogReason.trim().length < 3) return;
        try {
            setSavingCatalog(true); setMessage('');
            const saved = await api.saveMapCatalog(projectId, { layers, justification: catalogReason.trim() }, empresaId);
            setCatalog(saved); setLayers(saved.layers); setCatalogReason('');
            setMessage(`Servicios cartográficos r${saved.revision} guardados`);
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo guardar el catálogo cartográfico BIM.');
        } finally {
            setSavingCatalog(false);
        }
    };

    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-site-georeference>
            <header className="flex h-10 items-center justify-between border-b border-zinc-200 px-3">
                <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#F39200]" aria-hidden="true" /><h3 className="text-xs font-semibold text-zinc-900">Ubicación BIM</h3></div>
                {site ? <span className="text-[10px] font-semibold text-zinc-500">r{site.revision} · Proyecto R{site.project_revision}</span> : null}
            </header>
            <div className="space-y-3 p-3">
                <div className="h-56 min-h-56 overflow-hidden rounded-md border border-zinc-200" data-bim-site-map>
                    <MapContainer center={center} zoom={Number(site?.map_zoom || form.map_zoom)} className="h-full w-full" zoomControl attributionControl>
                        <MapView latitude={center[0]} longitude={center[1]} zoom={Number(site?.map_zoom || form.map_zoom)} />
                        {visibleLayers.map((layer) => layer.service_type === 'wms' ? (
                            <WMSTileLayer key={layer.key} url={layer.url} layers={layer.layer_name} format="image/png" transparent={layer.kind === 'overlay'} opacity={layer.opacity} attribution={layer.attribution} minZoom={layer.min_zoom} maxZoom={layer.max_zoom} />
                        ) : (
                            <TileLayer key={layer.key} url={layer.url} opacity={layer.opacity} attribution={layer.attribution} minZoom={layer.min_zoom} maxZoom={layer.max_zoom} />
                        ))}
                        <CircleMarker center={center} radius={8} pathOptions={{ color: '#18181b', fillColor: '#F39200', fillOpacity: 1, weight: 2 }}><Tooltip>Ancla del proyecto BIM</Tooltip></CircleMarker>
                        {points.map((point) => (
                            <CircleMarker
                                key={point.version_id}
                                center={[point.latitude, point.longitude]}
                                radius={activeVersionId === point.version_id ? 9 : 6}
                                pathOptions={{ color: activeVersionId === point.version_id ? '#F39200' : '#2563eb', fillColor: activeVersionId === point.version_id ? '#F39200' : '#60a5fa', fillOpacity: 0.9, weight: 2 }}
                                eventHandlers={{ click: () => onSelectVersion?.(point.version_id) }}
                            >
                                <Tooltip>{point.model_name} · {point.version_label}</Tooltip>
                            </CircleMarker>
                        ))}
                    </MapContainer>
                </div>
                <div className="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{site ? `${site.latitude.toFixed(6)}, ${site.longitude.toFixed(6)} · ${site.crs}` : 'Ancla BIM pendiente'}</span>
                    <span data-bim-site-point-count>{points.length} modelos ubicados</span>
                </div>
                <div className="rounded-md border border-zinc-200" data-bim-map-catalog>
                    <div className="flex h-9 items-center justify-between border-b border-zinc-200 px-2.5">
                        <div className="flex items-center gap-2"><Layers3 className="h-3.5 w-3.5 text-zinc-500" /><span className="text-[11px] font-semibold text-zinc-800">Servicios cartográficos</span></div>
                        <span className="text-[10px] font-medium text-zinc-500" data-bim-map-layer-count>{layers.length} capas{catalog ? ` · r${catalog.revision}` : ''}</span>
                    </div>
                    <div className="grid grid-cols-1 gap-x-3 p-2.5 sm:grid-cols-2">
                        {layers.map((layer) => (
                            <div key={layer.key} className="flex min-h-11 min-w-0 items-center gap-2 border-b border-zinc-100" data-bim-map-layer={layer.key}>
                                <button type="button" onClick={() => toggleLayer(layer.key)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-zinc-500" aria-label={`${layer.visible ? 'Ocultar' : 'Mostrar'} ${layer.name}`} title={`${layer.visible ? 'Ocultar' : 'Mostrar'} ${layer.name}`}>{layer.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button>
                                <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-zinc-700">{layer.name} · {layer.service_type.toUpperCase()}</span>
                                <input type="range" min="0.1" max="1" step="0.1" value={layer.opacity} onChange={(event) => updateOpacity(layer.key, event.target.value)} className="w-16" aria-label={`Opacidad ${layer.name}`} />
                                <button type="button" onClick={() => removeLayer(layer.key)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center text-zinc-400 hover:text-red-600" aria-label={`Eliminar ${layer.name}`} title={`Eliminar ${layer.name}`}><Trash2 className="h-3.5 w-3.5" /></button>
                            </div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 gap-2 border-t border-zinc-200 p-2.5 sm:grid-cols-2 xl:grid-cols-[minmax(120px,0.7fr)_88px_88px_minmax(220px,1.4fr)_minmax(100px,0.7fr)_44px]">
                        <input value={layerDraft.name} onChange={(event) => setLayerDraft((current) => ({ ...current, name: event.target.value }))} placeholder="Nombre de capa" aria-label="Nombre de capa" className="h-11 min-w-0 rounded border border-zinc-200 px-2 text-[10px]" />
                        <select value={layerDraft.kind} onChange={(event) => setLayerDraft((current) => ({ ...current, kind: event.target.value }))} className="h-11 rounded border border-zinc-200 px-1 text-[10px]" aria-label="Tipo de capa"><option value="overlay">Overlay</option><option value="basemap">Base</option></select>
                        <select value={layerDraft.service_type} onChange={(event) => setLayerDraft((current) => ({ ...current, service_type: event.target.value }))} className="h-11 rounded border border-zinc-200 px-1 text-[10px]" aria-label="Protocolo cartográfico"><option value="xyz">XYZ</option><option value="wms">WMS</option></select>
                        <input value={layerDraft.url} onChange={(event) => setLayerDraft((current) => ({ ...current, url: event.target.value }))} placeholder="URL del servicio" aria-label="URL del servicio cartográfico" className="h-11 min-w-0 rounded border border-zinc-200 px-2 text-[10px]" />
                        <input value={layerDraft.layer_name} onChange={(event) => setLayerDraft((current) => ({ ...current, layer_name: event.target.value }))} placeholder="Capa WMS" aria-label="Nombre de capa WMS" disabled={layerDraft.service_type !== 'wms'} className="h-11 min-w-0 rounded border border-zinc-200 px-2 text-[10px] disabled:bg-zinc-50" />
                        <button type="button" onClick={addLayer} className="inline-flex h-11 w-11 items-center justify-center rounded bg-zinc-800 text-white" aria-label="Añadir servicio cartográfico" title="Añadir servicio cartográfico"><Plus className="h-4 w-4" /></button>
                    </div>
                    <div className="flex gap-2 border-t border-zinc-200 p-2.5">
                        <input value={catalogReason} onChange={(event) => setCatalogReason(event.target.value)} placeholder="Justificación del catálogo" aria-label="Justificación del catálogo cartográfico" className="h-11 min-w-0 flex-1 rounded border border-zinc-200 px-2 text-[10px]" />
                        <button type="button" onClick={saveCatalog} disabled={savingCatalog || catalogReason.trim().length < 3} className="inline-flex h-11 w-11 items-center justify-center rounded bg-[#F39200] text-white disabled:opacity-40" aria-label="Guardar servicios cartográficos" title="Guardar servicios cartográficos"><Save className="h-3.5 w-3.5" /></button>
                    </div>
                </div>
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <label className="text-[10px] font-medium text-zinc-600">Latitud<input type="number" step="0.000001" value={form.latitude} onChange={(event) => updateNumber('latitude', event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>
                    <label className="text-[10px] font-medium text-zinc-600">Longitud<input type="number" step="0.000001" value={form.longitude} onChange={(event) => updateNumber('longitude', event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>
                    <label className="text-[10px] font-medium text-zinc-600">Altitud<input type="number" step="0.1" value={form.altitude} onChange={(event) => updateNumber('altitude', event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {['X', 'Y', 'Z'].map((axis, index) => <label key={axis} className="text-[10px] font-medium text-zinc-600">Origen {axis}<input type="number" step="0.01" value={form.local_origin[index]} onChange={(event) => updateOrigin(index, event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>)}
                    <label className="text-[10px] font-medium text-zinc-600">Rumbo<input type="number" min="0" max="359.999" step="0.1" value={form.heading_degrees} onChange={(event) => updateNumber('heading_degrees', event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>
                    <label className="text-[10px] font-medium text-zinc-600">Zoom<input type="number" min="3" max="22" value={form.map_zoom} onChange={(event) => updateNumber('map_zoom', event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>
                </div>
                <div className="flex gap-2">
                    <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-md border border-zinc-200 px-2"><Crosshair className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" /><span className="sr-only">Justificación de georreferencia</span><input value={form.justification} onChange={(event) => setForm((current) => ({ ...current, justification: event.target.value }))} placeholder="Justificación topográfica" className="min-w-0 flex-1 text-xs outline-none" /></label>
                    <button type="button" onClick={save} disabled={saving || loading || form.justification.trim().length < 3} className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[#F39200] text-white disabled:opacity-40" aria-label="Guardar georreferencia BIM" title="Guardar georreferencia BIM"><Save className="h-4 w-4" /></button>
                </div>
                {message ? <p className="text-[10px] font-medium text-zinc-600" role="status">{message}</p> : null}
            </div>
        </section>
    );
};

export default BimSiteGeoreferencePanel;
