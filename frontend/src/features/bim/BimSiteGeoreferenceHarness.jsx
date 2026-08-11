/* eslint-disable react-refresh/only-export-components -- standalone Playwright harness entry */
import React, { useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

import '../../index.css';
import BimSiteGeoreferencePanel from '../../components/bim/BimSiteGeoreferencePanel';

const initialSite = {
    id: 301, project_id: 7, company_id: 1, revision: 1, status: 'active',
    project_root_code: 'GEO-01', project_revision: 3, crs: 'EPSG:9377',
    latitude: -0.1807, longitude: -78.4678, altitude: 2850,
    local_origin: [500000, 9970000, 0], heading_degrees: 0, map_zoom: 18,
    justification: 'Control topográfico inicial', created_by: 4, created_at: '2026-07-13T12:00:00Z',
    map_points: [
        { version_id: 41, model_id: 11, model_name: 'Arquitectura', version_label: 'P01', discipline: 'Arquitectura', latitude: -0.1806, longitude: -78.4677, altitude: 2850, alignment_status: 'reference' },
        { version_id: 42, model_id: 12, model_name: 'Estructura', version_label: 'P02', discipline: 'Estructura', latitude: -0.1805, longitude: -78.4676, altitude: 2851, alignment_status: 'aligned' },
    ],
};

const initialCatalog = {
    id: 401, project_id: 7, company_id: 1, revision: 1, status: 'active', project_root_code: 'GEO-01', project_revision: 3,
    justification: 'Servicios iniciales', created_by: 4, created_at: '2026-07-20T12:00:00Z',
    layers: [
        { key: 'openstreetmap', name: 'OpenStreetMap', kind: 'basemap', service_type: 'xyz', url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>', layer_name: null, min_zoom: 3, max_zoom: 22, opacity: 1, visible: true, order: 0 },
        { key: 'site-logistics', name: 'Logística de obra', kind: 'overlay', service_type: 'wms', url: 'https://maps.example.test/wms', attribution: '', layer_name: 'site_logistics', min_zoom: 3, max_zoom: 22, opacity: 0.7, visible: false, order: 1 },
    ],
};

const BimSiteGeoreferenceHarness = () => {
    const current = useRef(initialSite);
    const currentCatalog = useRef(initialCatalog);
    const [selectedVersion, setSelectedVersion] = useState(41);
    const api = useMemo(() => ({
        getSiteGeoreference: async () => current.current,
        getMapCatalog: async () => currentCatalog.current,
        saveSiteGeoreference: async (_projectId, payload) => {
            current.current = { ...current.current, ...payload, revision: current.current.revision + 1, justification: payload.justification };
            return current.current;
        },
        saveMapCatalog: async (_projectId, payload) => {
            currentCatalog.current = { ...currentCatalog.current, ...payload, revision: currentCatalog.current.revision + 1 };
            return currentCatalog.current;
        },
    }), []);
    return (
        <main className="min-h-screen bg-[#F2F4F7] p-6">
            <div className="mx-auto w-full max-w-[1180px]">
                <div className="mb-2 text-xs font-semibold text-zinc-700" data-bim-map-selected-version>Versión activa: {selectedVersion}</div>
                <BimSiteGeoreferencePanel projectId={7} empresaId={1} activeVersionId={selectedVersion} onSelectVersion={setSelectedVersion} api={api} />
            </div>
        </main>
    );
};

createRoot(document.getElementById('root')).render(<BimSiteGeoreferenceHarness />);
