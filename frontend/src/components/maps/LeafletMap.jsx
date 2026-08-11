/* eslint-disable react-refresh/only-export-components -- adapter intentionally mirrors Leaflet's component-and-hook API */
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import L from 'leaflet';

const LeafletContext = createContext(null);

export function MapContainer({ center, zoom, className, style, children, ...options }) {
    const hostRef = useRef(null);
    const [map, setMap] = useState(null);

    useEffect(() => {
        if (!hostRef.current) return undefined;
        const instance = L.map(hostRef.current, options).setView(center, zoom);
        setMap(instance);
        return () => { setMap(null); instance.remove(); };
        // Map construction options are intentionally immutable, matching Leaflet.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return <div ref={hostRef} className={className} style={style}>{map ? <LeafletContext.Provider value={map}>{children}</LeafletContext.Provider> : null}</div>;
}

export function useMap() {
    const map = useContext(LeafletContext);
    if (!map) throw new Error('Leaflet map context is unavailable');
    return map;
}

export function useMapEvents(events) {
    const map = useMap();
    useEffect(() => {
        if (!events || Object.keys(events).length === 0) return undefined;
        map.on(events);
        return () => map.off(events);
    }, [events, map]);
    return map;
}

function tooltipText(children) {
    const tooltip = React.Children.toArray(children).find((child) => child?.type === Tooltip);
    return typeof tooltip?.props?.children === 'string' ? tooltip.props.children : null;
}

export function Tooltip() { return null; }

export function TileLayer({ url, attribution, opacity, minZoom, maxZoom }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.tileLayer(url, { attribution, opacity, minZoom, maxZoom }).addTo(map);
        return () => layer.remove();
    }, [attribution, map, maxZoom, minZoom, opacity, url]);
    return null;
}

export function WMSTileLayer({ url, layers, format, transparent, opacity, attribution, minZoom, maxZoom }) {
    const map = useMap();
    useEffect(() => {
        const layer = L.tileLayer.wms(url, { layers, format, transparent, opacity, attribution, minZoom, maxZoom }).addTo(map);
        return () => layer.remove();
    }, [attribution, format, layers, map, maxZoom, minZoom, opacity, transparent, url]);
    return null;
}

export function Marker({ position, children }) {
    const map = useMap();
    const label = tooltipText(children);
    useEffect(() => {
        const marker = L.marker(position).addTo(map);
        if (label) marker.bindTooltip(label);
        return () => marker.remove();
    }, [label, map, position]);
    return null;
}

export function CircleMarker({ center, radius, pathOptions, eventHandlers, children }) {
    const map = useMap();
    const label = tooltipText(children);
    useEffect(() => {
        const marker = L.circleMarker(center, { radius, ...pathOptions }).addTo(map);
        if (label) marker.bindTooltip(label);
        if (eventHandlers) marker.on(eventHandlers);
        const element = marker.getElement();
        const activate = eventHandlers?.click;
        const handleKeyDown = (event) => {
            if (activate && (event.key === 'Enter' || event.key === ' ')) {
                event.preventDefault();
                activate(event);
            }
        };
        if (element && activate) {
            element.setAttribute('tabindex', '0');
            element.setAttribute('role', 'button');
            element.setAttribute('aria-label', label || 'Seleccionar marcador del mapa');
            element.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            if (element) element.removeEventListener('keydown', handleKeyDown);
            if (eventHandlers) marker.off(eventHandlers);
            marker.remove();
        };
    }, [center, eventHandlers, label, map, pathOptions, radius]);
    return null;
}
