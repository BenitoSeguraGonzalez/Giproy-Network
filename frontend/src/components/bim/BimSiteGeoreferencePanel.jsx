import React, { useEffect, useMemo, useState } from 'react';
import { Crosshair, MapPin, Save } from 'lucide-react';
import { CircleMarker, MapContainer, TileLayer, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

import { bimModelsApi } from '../../api/bimModels';

const DEFAULT_SITE = {
    crs: 'EPSG:4326', latitude: -0.1807, longitude: -78.4678, altitude: 0,
    local_origin: [0, 0, 0], heading_degrees: 0, map_zoom: 18, justification: '',
};

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

    const load = async () => {
        if (!projectId) return;
        try {
            setLoading(true);
            const payload = await api.getSiteGeoreference(projectId, empresaId);
            setSite(payload);
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
    };

    useEffect(() => { load(); }, [projectId, empresaId]);

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
                        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
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
                <div className="grid grid-cols-3 gap-2">
                    <label className="text-[10px] font-medium text-zinc-600">Latitud<input type="number" step="0.000001" value={form.latitude} onChange={(event) => updateNumber('latitude', event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>
                    <label className="text-[10px] font-medium text-zinc-600">Longitud<input type="number" step="0.000001" value={form.longitude} onChange={(event) => updateNumber('longitude', event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>
                    <label className="text-[10px] font-medium text-zinc-600">Altitud<input type="number" step="0.1" value={form.altitude} onChange={(event) => updateNumber('altitude', event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>
                </div>
                <div className="grid grid-cols-5 gap-2">
                    {['X', 'Y', 'Z'].map((axis, index) => <label key={axis} className="text-[10px] font-medium text-zinc-600">Origen {axis}<input type="number" step="0.01" value={form.local_origin[index]} onChange={(event) => updateOrigin(index, event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>)}
                    <label className="text-[10px] font-medium text-zinc-600">Rumbo<input type="number" min="0" max="359.999" step="0.1" value={form.heading_degrees} onChange={(event) => updateNumber('heading_degrees', event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>
                    <label className="text-[10px] font-medium text-zinc-600">Zoom<input type="number" min="3" max="22" value={form.map_zoom} onChange={(event) => updateNumber('map_zoom', event.target.value)} className="mt-1 h-8 w-full rounded border border-zinc-200 px-2 text-xs" /></label>
                </div>
                <div className="flex gap-2">
                    <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-zinc-200 px-2"><Crosshair className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" /><span className="sr-only">Justificación de georreferencia</span><input value={form.justification} onChange={(event) => setForm((current) => ({ ...current, justification: event.target.value }))} placeholder="Justificación topográfica" className="min-w-0 flex-1 text-xs outline-none" /></label>
                    <button type="button" onClick={save} disabled={saving || loading || form.justification.trim().length < 3} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#F39200] text-white disabled:opacity-40" aria-label="Guardar georreferencia BIM" title="Guardar georreferencia BIM"><Save className="h-4 w-4" /></button>
                </div>
                {message ? <p className="text-[10px] font-medium text-zinc-600" role="status">{message}</p> : null}
            </div>
        </section>
    );
};

export default BimSiteGeoreferencePanel;
