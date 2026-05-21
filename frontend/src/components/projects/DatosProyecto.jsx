import React, { useState, useEffect, useCallback, useContext, useRef } from 'react';
import {
    MapPin, Calendar, Ruler, FileText, Image as ImageIcon,
    Save, Loader2, MapPinned, Briefcase, ChevronRight,
    Layers, Coins, Clock, Target, Paperclip, Plus, X,
    Eye, Download, Trash2, Maximize2, AlertTriangle
} from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import SearchableSelect from '../ui/searchable-select';
import AnimatedSelect from '../ui/AnimatedSelect';
import AnimatedDateInput from '../ui/AnimatedDateInput';
import { Card, CardContent } from '../ui/card';
import { maestrosApi } from '../../api/maestros';
import { proyectoDetalleApi } from '../../api/proyectoDetalle';
import { proyectosApi } from '../../api/proyectos';
import reportingApi from '../../api/reporting';
import { AuthContext } from '../../context/AuthContext';
import { appAlert, appConfirm, appPrompt } from '../../utils/appDialog';
import { useFormatters } from '../../hooks/useFormatters';
import ProjectSectionReportButton from './ProjectSectionReportButton';
import CommonReportPreviewModal from '../reporting/CommonReportPreviewModal';
import ReportGenerationModal from '../reporting/ReportGenerationModal';
import { extractBlobErrorMessage } from '../../utils/apiBlobErrors';
import { buildReportFileName, sanitizeReportContext } from '../../utils/reportFileName';
import { downloadBlobResponse } from '../../utils/blobDownload';
import { resolveMediaUrl } from '../../utils/mediaUrl';
import { PLANTILLAS_OPCIONES } from '../../constants/plantillas';
import ProjectSegmentedSwitch from './ProjectSegmentedSwitch';
import MotionScrollbar from '../ui/MotionScrollbar';
import AppHint from '../ui/AppHint';
import { APP_MODAL_CLOSE_BUTTON_CLASS } from '../ui/app-modal';

// Import Leaflet (we'll initialize it only if window is available)
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

const TIPO_CONSTRUCCION = [
    { id: 'Nueva Construcción', label: 'Nueva Construcción' },
    { id: 'Renovación', label: 'Renovación' }
];

const AMBITO_CONTRATACION = [
    { id: 'Contratación Pública', label: 'Contratación Pública' },
    { id: 'Contratación Privada', label: 'Contratación Privada' },
    { id: 'Autogestión', label: 'Autogestión' },
    { id: 'Asociación Público - Privada', label: 'Asociación Público - Privada' },
    { id: 'Otro', label: 'Otro' }
];

const normalizeAmbitoContratacion = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    if (normalized === 'Público' || normalized === 'Publico') return 'Contratación Pública';
    if (normalized === 'Privado') return 'Contratación Privada';
    if (normalized === 'Autogestion') return 'Autogestión';
    return normalized;
};

const TIPO_CONTRATO = [
    { id: 'Diseño', label: 'Diseño' },
    { id: 'Planificación', label: 'Planificación' },
    { id: 'Construcción', label: 'Construcción' },
    { id: 'Diseño y construcción', label: 'Diseño y construcción' },
    { id: 'Planificación y construcción', label: 'Planificación y construcción' },
    { id: 'Diseño, planificación y const.', label: 'Diseño, planificación y const.' },
    { id: 'Gerencia de la construcción', label: 'Gerencia de la construcción' },
    { id: 'Consultoría en general', label: 'Consultoría en general' }
];

const MONEDAS_REFERENCIALES = [
    { id: 'USD', label: 'USD - Dólar estadounidense' },
    { id: 'EUR', label: 'EUR - Euro' },
    { id: 'COP', label: 'COP - Peso colombiano' },
    { id: 'PEN', label: 'PEN - Sol peruano' },
    { id: 'MXN', label: 'MXN - Peso mexicano' },
    { id: 'CLP', label: 'CLP - Peso chileno' },
    { id: 'ARS', label: 'ARS - Peso argentino' },
    { id: 'OTRA', label: 'OTRA - Otra moneda' },
];

const FUENTES_FINANCIAMIENTO = [
    { id: 'Presupuesto Estatal', label: 'Presupuesto Estatal' },
    { id: 'Financiamiento Privado', label: 'Financiamiento Privado' },
    { id: 'Crédito Bancario', label: 'Crédito Bancario' },
    { id: 'Fondos Mixtos', label: 'Fondos Mixtos' },
    { id: 'Donación', label: 'Donación' },
    { id: 'Otro', label: 'Otro' },
];

const TIPO_MEDICION = [
    { id: 'area', label: 'Área (m²)', switchLabel: 'Área' },
    { id: 'longitud', label: 'Longitud (m/km)', switchLabel: 'Longitud' },
    { id: 'volumen', label: 'Volumen (m³)', switchLabel: 'Volumen' },
    { id: 'unidades', label: 'Unidades' },
    { id: 'mixto', label: 'Mixto' }
];

const UNIDADES_LONGITUD = [
    { id: 'm', label: 'metros (m)' },
    { id: 'km', label: 'kilómetros (km)' }
];

const NORMATIVA_APLICABLE = [
    { id: 'NEC', label: 'NEC (Norma Ecuatoriana de la Construcción)' },
    { id: 'ACI', label: 'ACI (American Concrete Institute)' },
    { id: 'ASTM', label: 'ASTM' },
    { id: 'ISO 9001', label: 'ISO 9001' },
    { id: 'ISO 14001', label: 'ISO 14001' },
    { id: 'Normativa Local', label: 'Normativa Local' },
    { id: 'OSHA', label: 'OSHA' },
    { id: '__otra__', label: 'Otra (especificar)' }
];

const NIVELES_COMPLEJIDAD = [
    { id: 'Baja', label: 'Baja' },
    { id: 'Media', label: 'Media' },
    { id: 'Alta', label: 'Alta' },
    { id: 'Muy Alta', label: 'Muy Alta' },
];

const PAISES = [
    { id: 'Ecuador', label: 'Ecuador' },
    { id: 'Colombia', label: 'Colombia' },
    { id: 'Perú', label: 'Perú' },
    { id: 'Otro', label: 'Otro' }
];

const COLLAPSIBLE_SECTION_BASE =
    'overflow-hidden rounded-[1.15rem] border border-[#ececec] bg-white shadow-[6px_6px_16px_#e1e1e1,-6px_-6px_16px_#ffffff]';

const COLLAPSIBLE_SECTION_HEADER_BUTTON =
    'flex w-full items-center justify-between gap-3 border-b border-[#101318] bg-[#111318] px-4 py-3 text-left shadow-[inset_0_-1px_0_rgba(255,255,255,0.04)]';

const COLLAPSIBLE_SECTION_TITLE_CLASS =
    'block text-xs font-black uppercase tracking-[0.18em] text-white';

const COLLAPSIBLE_SECTION_SUBTITLE_CLASS =
    'block text-[10px] font-bold uppercase tracking-[0.14em] text-white/48';

const SOFT_ACTION_BUTTON_BASE =
    'inline-flex shrink-0 items-center justify-center border border-[#ececec] bg-[#ededed] shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff] transition hover:brightness-[0.99] active:scale-[0.98] active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff] disabled:cursor-not-allowed disabled:opacity-60';

const renderSectionToggleIcon = (isCollapsed) => (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#e3e3e3] bg-[#ededed] text-zinc-500 shadow-[1px_1px_4px_rgba(0,0,0,0.18),-1px_-1px_3px_rgba(255,255,255,0.58)] transition-[color,border-color,transform,box-shadow] duration-200 hover:border-[#F39200]/40 hover:text-[#F39200] active:scale-[0.98] active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff]">
        <ChevronRight className={`h-3.5 w-3.5 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
    </span>
);

const CollapsibleSectionBody = ({ isCollapsed, children }) => (
    <div
        className={`grid overflow-hidden transition-[grid-template-rows,opacity] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isCollapsed ? 'grid-rows-[0fr] opacity-0' : 'grid-rows-[1fr] opacity-100'
        }`}
    >
        <div className="min-h-0 overflow-hidden">
            {children}
        </div>
    </div>
);

const normalizeOptionalInt = (value) => {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

const normalizeOptionalFloat = (value, fallback = 0) => {
    if (value === '' || value === null || value === undefined) return fallback;
    const parsed = Number(String(value).replace(',', '.'));
    return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeOptionalDate = (value) => {
    if (!value) return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString().split('T')[0];
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return null;
        if (trimmed.includes('T')) {
            const parsed = new Date(trimmed);
            if (!Number.isNaN(parsed.getTime())) {
                return parsed.toISOString().split('T')[0];
            }
        }
        return trimmed;
    }
    return null;
};

const normalizeVisibleTextValue = (value) => {
    if (value === null || value === undefined) return '';
    return String(value);
};

const parseListItems = (rawValue) => {
    if (Array.isArray(rawValue)) {
        return rawValue.map((item) => normalizeVisibleTextValue(item).trim()).filter(Boolean);
    }

    if (typeof rawValue !== 'string') {
        return [];
    }

    const trimmed = rawValue.trim();
    if (!trimmed) {
        return [];
    }

    try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed)
            ? parsed.map((item) => normalizeVisibleTextValue(item).trim()).filter(Boolean)
            : [];
    } catch {
        return trimmed
            .split(/\r?\n+/)
            .map((item) => item.trim())
            .filter(Boolean);
    }
};

const serializeListItems = (items) => {
    const normalizedItems = (Array.isArray(items) ? items : [])
        .map((item) => normalizeVisibleTextValue(item).trim())
        .filter(Boolean);

    return normalizedItems.length ? JSON.stringify(normalizedItems) : '';
};

const parseEditableListItems = (rawValue) => {
    if (Array.isArray(rawValue)) {
        return rawValue.map((item) => normalizeVisibleTextValue(item));
    }

    if (typeof rawValue !== 'string') {
        return [];
    }

    const trimmed = rawValue.trim();
    if (!trimmed) {
        return [];
    }

    try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed)
            ? parsed.map((item) => normalizeVisibleTextValue(item))
            : [];
    } catch {
        return rawValue.split(/\r?\n/).map((item) => normalizeVisibleTextValue(item));
    }
};

const serializeEditableListItems = (items) => {
    const editableItems = (Array.isArray(items) ? items : [])
        .map((item) => normalizeVisibleTextValue(item));

    return editableItems.some((item) => item.trim()) || editableItems.length > 1
        ? JSON.stringify(editableItems)
        : '';
};

const parseObjectiveItems = parseListItems;
const serializeObjectiveItems = serializeListItems;

const formatDocumentSize = (bytes) => {
    const value = Number(bytes || 0);
    if (!Number.isFinite(value) || value <= 0) return '0 KB';
    if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDocumentDate = (dateValue) => {
    if (!dateValue) return 'Sin fecha';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    return date.toLocaleDateString('es-ES');
};

const formatContractMoney = (amount, currency = 'USD') => {
    const numericAmount = Number(amount || 0);
    if (!Number.isFinite(numericAmount)) return '0';
    try {
        return new Intl.NumberFormat('es-EC', {
            style: 'currency',
            currency: currency || 'USD',
            maximumFractionDigits: 2,
        }).format(numericAmount);
    } catch {
        return `${numericAmount.toLocaleString('es-EC', { maximumFractionDigits: 2 })} ${currency || ''}`.trim();
    }
};

const joinGeocodeQueryParts = (parts) => parts
    .map((part) => String(part || '').replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .filter((part, index, source) => source.findIndex((item) => item.toLowerCase() === part.toLowerCase()) === index)
    .join(', ');

const GEOCODE_ACCENT_ALIASES = [
    ['simon', 'Simón'],
    ['bolivar', 'Bolívar'],
    ['velez', 'Vélez'],
    ['america', 'América'],
    ['espana', 'España'],
    ['colon', 'Colón'],
    ['ordonez', 'Ordóñez'],
    ['ordónez', 'Ordóñez'],
    ['republica', 'República'],
    ['mexico', 'México'],
    ['panama', 'Panamá'],
    ['peru', 'Perú'],
    ['rio', 'Río'],
    ['jeronimo', 'Jerónimo'],
    ['jose', 'José'],
    ['maria', 'María'],
    ['arizaga', 'Arízaga'],
    ['martin', 'Martín'],
];

const stripGeocodeDiacritics = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const applyGeocodeAccentAliases = (value) => GEOCODE_ACCENT_ALIASES.reduce((current, [rawWord, accentedWord]) => {
    const pattern = new RegExp(`\\b${rawWord}\\b`, 'gi');
    return current.replace(pattern, accentedWord);
}, String(value || '').replace(/\s+/g, ' ').trim());

const expandGeocodeQueryVariants = (query) => {
    const normalized = String(query || '').replace(/\s+/g, ' ').trim();
    const variants = [
        normalized,
        stripGeocodeDiacritics(normalized),
        applyGeocodeAccentAliases(normalized),
        applyGeocodeAccentAliases(stripGeocodeDiacritics(normalized)),
    ]
        .map((value) => String(value || '').replace(/\s+/g, ' ').trim())
        .filter(Boolean);

    return variants.filter((value, index) => variants.findIndex((item) => item.toLowerCase() === value.toLowerCase()) === index);
};

const geocodeMatchKey = (value) => stripGeocodeDiacritics(value).toLowerCase();

const getGeocodeRequiredTerms = (...streets) => streets.flatMap((street) => (
    geocodeMatchKey(street).match(/[a-záéíóúüñ]+/gi) || []
))
    .filter((token) => token.length >= 3 && !['calle', 'avenida', 'av', 'via', 'pasaje'].includes(token))
    .filter((token, index, source) => source.indexOf(token) === index);

const geocodeResultSatisfiesRequiredTerms = (result, requiredTerms = []) => {
    if (!requiredTerms.length) return true;
    const addressBlob = Object.values(result?.address || {}).join(' ');
    const searchable = geocodeMatchKey(`${result?.display_name || ''} ${addressBlob}`);
    return requiredTerms.every((term) => searchable.includes(term));
};

const buildOverpassStreetRegex = (street) => String(street || '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    .replace(/[aA]/g, '[aá]')
    .replace(/[eE]/g, '[eé]')
    .replace(/[iI]/g, '[ií]')
    .replace(/[oO]/g, '[oó]')
    .replace(/[uU]/g, '[uúü]')
    .replace(/[nN]/g, '[nñ]');

const haversineMeters = (lat1, lon1, lat2, lon2) => {
    const radius = 6371000;
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(deltaPhi / 2) ** 2
        + Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) ** 2;
    return radius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const streetNameMatches = (street, osmName) => {
    const terms = getGeocodeRequiredTerms(street);
    const key = geocodeMatchKey(osmName);
    return terms.length > 0 && terms.every((term) => key.includes(term));
};

const findNearestIntersectionFromOsmWays = (firstStreet, secondStreet, ways) => {
    const firstGeometries = [];
    const secondGeometries = [];

    (ways || []).forEach((way) => {
        if (way?.type !== 'way' || !Array.isArray(way.geometry)) return;
        const name = way.tags?.name || '';
        if (streetNameMatches(firstStreet, name)) firstGeometries.push(way.geometry);
        if (streetNameMatches(secondStreet, name)) secondGeometries.push(way.geometry);
    });

    let best = null;
    firstGeometries.forEach((firstGeometry) => {
        secondGeometries.forEach((secondGeometry) => {
            firstGeometry.forEach((firstPoint) => {
                secondGeometry.forEach((secondPoint) => {
                    const distance = haversineMeters(firstPoint.lat, firstPoint.lon, secondPoint.lat, secondPoint.lon);
                    if (!best || distance < best.distance) {
                        best = {
                            distance,
                            latitud: (firstPoint.lat + secondPoint.lat) / 2,
                            longitud: (firstPoint.lon + secondPoint.lon) / 2,
                        };
                    }
                });
            });
        });
    });

    return best && best.distance <= 35 ? best : null;
};

const geocodeIntersectionFromOverpassFallback = async (data) => {
    if (String(data.pais || '').toLowerCase() !== 'ecuador') return null;
    const intersection = splitEcuadorIntersectionAddress(data.direccion);
    if (!intersection) return null;

    const [firstStreet, secondStreet] = intersection;
    const city = String(data.ciudad || data.canton || '').replace(/\s+/g, ' ').trim();
    if (!city) return null;

    const firstRegex = buildOverpassStreetRegex(firstStreet);
    const secondRegex = buildOverpassStreetRegex(secondStreet);
    const cityRegex = buildOverpassStreetRegex(city);
    const cityKey = geocodeMatchKey(city);
    const provinceKey = geocodeMatchKey(data.provincia);
    const query = cityKey === 'cuenca' && provinceKey.includes('azuay') ? `
[out:json][timeout:12];
(
  way["highway"]["name"~"${firstRegex}",i](-3.05,-79.08,-2.80,-78.90);
  way["highway"]["name"~"${secondRegex}",i](-3.05,-79.08,-2.80,-78.90);
);
out geom tags;
` : `
[out:json][timeout:12];
area["ISO3166-1"="EC"][admin_level=2]->.country;
area["boundary"="administrative"]["name"~"^${cityRegex}$",i](area.country)->.searchArea;
(
  way["highway"]["name"~"${firstRegex}",i](area.searchArea);
  way["highway"]["name"~"${secondRegex}",i](area.searchArea);
);
out geom tags;
`;

    const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body: new URLSearchParams({ data: query }).toString(),
    });
    if (!response.ok) return null;

    const payload = await response.json();
    const match = findNearestIntersectionFromOsmWays(firstStreet, secondStreet, payload.elements);
    if (!match) return null;

    return {
        latitud: match.latitud,
        longitud: match.longitud,
        map_zoom: 18,
        message: 'Intersección localizada desde geometría OSM. Verifica el punto y ajústalo si hace falta.',
        query: joinGeocodeQueryParts([`${firstStreet} y ${secondStreet}`, city, data.provincia, data.pais]),
        display_name: `${firstStreet} y ${secondStreet}, ${city}`,
        source: 'overpass-browser-fallback',
    };
};

const splitEcuadorIntersectionAddress = (address) => {
    const normalized = String(address || '').replace(/\s+/g, ' ').trim();
    if (!normalized) return null;

    const explicitMatch = normalized.match(/\b(?:entre|intersecci[oó]n(?:\s+de)?|cruce(?:\s+de)?|esquina(?:\s+de)?)\s+(.+?)\s+(?:y|e|con|&|\/)\s+(.+)$/i);
    const parts = explicitMatch
        ? [explicitMatch[1], explicitMatch[2]]
        : normalized.split(/\s+(?:y|e|con)\s+|\s*[&/]\s*/i, 2);

    if (parts.length !== 2) return null;
    const first = String(parts[0] || '').replace(/^[\s,.-]+|[\s,.-]+$/g, '').replace(/\s+/g, ' ').trim();
    const second = String(parts[1] || '').replace(/^[\s,.-]+|[\s,.-]+$/g, '').replace(/\s+/g, ' ').trim();
    return first.length >= 3 && second.length >= 3 ? [first, second] : null;
};

const buildClientGeocodeCandidates = (data) => {
    const pais = String(data.pais || '').trim();
    const provincia = String(data.provincia || '').trim();
    const canton = String(data.canton || '').trim();
    const ciudad = String(data.ciudad || '').trim();
    const direccion = String(data.direccion || '').replace(/\s+/g, ' ').trim();
    const context = [ciudad, canton, provincia, pais];
    const contextWithoutCity = [canton, provincia, pais];
    const candidates = [];
    const addCandidate = (key, query, zoom, message, requiredTerms = []) => {
        expandGeocodeQueryVariants(query).forEach((queryVariant) => {
            candidates.push({ key, query: queryVariant, zoom, message, requiredTerms });
        });
    };

    if (direccion) {
        const intersection = pais.toLowerCase() === 'ecuador' ? splitEcuadorIntersectionAddress(direccion) : null;
        const requiredTerms = intersection ? getGeocodeRequiredTerms(...intersection) : [];

        if (intersection) {
            const [firstStreet, secondStreet] = intersection;
            [
                [firstStreet, secondStreet],
                [secondStreet, firstStreet],
            ].forEach(([first, second]) => {
                [' y ', ' & ', ' con ', ' / ', ', '].forEach((separator) => {
                    addCandidate(
                        'interseccion',
                        joinGeocodeQueryParts([`${first}${separator}${second}`, ...context]),
                        17,
                        'Se buscó como intersección urbana. Verifica la posición y ajusta el punto si hace falta.',
                        requiredTerms
                    );
                });
            });
        }

        addCandidate(
            'exacta',
            joinGeocodeQueryParts([direccion, ...context]),
            16,
            'Ubicación exacta sugerida cargada. Ajusta el punto en el mapa si necesitas más precisión.',
            requiredTerms
        );

        addCandidate(
            'exacta_legacy',
            joinGeocodeQueryParts([pais, provincia, canton, ciudad, direccion]),
            16,
            'Ubicación exacta sugerida cargada. Ajusta el punto en el mapa si necesitas más precisión.',
            requiredTerms
        );
        if (!intersection) {
            addCandidate(
                'mixta',
                joinGeocodeQueryParts([direccion, ...contextWithoutCity]),
                14,
                'Se ubicó una referencia parcial usando cantón y dirección. Verifica la posición y ajústala si hace falta.'
            );
        }
    }

    if (!direccion || !(pais.toLowerCase() === 'ecuador' && splitEcuadorIntersectionAddress(direccion))) {
        addCandidate('urbana', joinGeocodeQueryParts(context), 14, 'Se ubicó una referencia urbana del sector. Conviene ajustar el punto exacto en el mapa.');
        addCandidate('territorial', joinGeocodeQueryParts([canton, provincia, pais]), 12, 'Se ubicó una referencia territorial del cantón. Ajusta manualmente el punto exacto.');
        addCandidate('regional', joinGeocodeQueryParts([provincia, pais]), 10, 'Solo se pudo ubicar una referencia general de la provincia. Ajusta manualmente el punto exacto.');
    }

    const seen = new Set();
    return candidates.filter((candidate) => {
        if (!candidate.query || seen.has(candidate.query)) return false;
        seen.add(candidate.query);
        return true;
    });
};

const geocodeAddressFromBrowserFallback = async (data) => {
    const countryCode =
        data.pais === 'Ecuador' ? 'ec'
            : data.pais === 'Colombia' ? 'co'
                : ['Perú', 'Peru'].includes(data.pais) ? 'pe'
                    : null;

    const overpassMatch = await geocodeIntersectionFromOverpassFallback(data);
    if (overpassMatch) {
        return overpassMatch;
    }

    for (const candidate of buildClientGeocodeCandidates(data)) {
        const params = new URLSearchParams({
            q: candidate.query,
            format: 'jsonv2',
            limit: candidate.requiredTerms?.length ? '5' : '1',
            addressdetails: '1',
            'accept-language': 'es',
        });
        if (countryCode) {
            params.set('countrycodes', countryCode);
        }

        const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
            throw new Error(`Geocoding fallback failed with status ${response.status}`);
        }
        const results = await response.json();
        if (Array.isArray(results) && results.length > 0) {
            const result = results.find((item) => geocodeResultSatisfiesRequiredTerms(item, candidate.requiredTerms));
            if (!result) {
                continue;
            }
            return {
                latitud: Number(result.lat),
                longitud: Number(result.lon),
                map_zoom: candidate.zoom,
                message: candidate.message,
                query: candidate.query,
                display_name: result.display_name,
                source: 'nominatim-browser-fallback',
            };
        }
    }

    throw new Error('No geocoding match found');
};

const DEFAULT_MAP_CENTER = {
    lat: -0.1807,
    lng: -78.4678,
    zoom: 13,
};

const LocationMarker = React.memo(({
    lat,
    lng,
    editable = false,
    isAdmin = false,
    onLocationChange,
    onZoomChange,
}) => {
    const map = useMapEvents({
        click(e) {
            if (!isAdmin || !editable) {
                return;
            }
            const currentZoom = map.getZoom();
            onLocationChange?.({
                lat: e.latlng.lat,
                lng: e.latlng.lng,
                zoom: currentZoom,
            });
        },
        zoomend() {
            if (!isAdmin || !editable) {
                return;
            }
            onZoomChange?.(map.getZoom());
        }
    });

    return lat != null && lng != null ? (
        <Marker position={[lat, lng]} />
    ) : null;
});

LocationMarker.displayName = 'LocationMarker';

const MapCenterUpdater = React.memo(({ lat, lng, zoom }) => {
    const map = useMapEvents({});

    useEffect(() => {
        if (lat == null || lng == null) {
            return;
        }
        map.setView([lat, lng], zoom || DEFAULT_MAP_CENTER.zoom, { animate: true });
    }, [lat, lng, zoom, map]);

    return null;
});

MapCenterUpdater.displayName = 'MapCenterUpdater';

const MapSizeUpdater = React.memo(({ trigger }) => {
    const map = useMapEvents({});

    useEffect(() => {
        const timeoutId = window.setTimeout(() => {
            map.invalidateSize();
        }, 120);
        return () => window.clearTimeout(timeoutId);
    }, [map, trigger]);

    return null;
});

MapSizeUpdater.displayName = 'MapSizeUpdater';

const GeoMapViewport = React.memo(({
    lat,
    lng,
    zoom,
    fullscreen = false,
    sizeTrigger,
    isAdmin = false,
    onLocationChange,
    onZoomChange,
}) => (
    <MapContainer
        center={[lat ?? DEFAULT_MAP_CENTER.lat, lng ?? DEFAULT_MAP_CENTER.lng]}
        zoom={zoom || DEFAULT_MAP_CENTER.zoom}
        scrollWheelZoom={fullscreen}
        zoomControl={fullscreen}
        dragging={fullscreen}
        touchZoom={fullscreen}
        doubleClickZoom={fullscreen}
        boxZoom={fullscreen}
        keyboard={fullscreen}
        style={{ height: '100%', width: '100%' }}
    >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapCenterUpdater lat={lat} lng={lng} zoom={zoom || DEFAULT_MAP_CENTER.zoom} />
        <MapSizeUpdater trigger={sizeTrigger} />
        <LocationMarker
            lat={lat}
            lng={lng}
            editable={fullscreen}
            isAdmin={isAdmin}
            onLocationChange={onLocationChange}
            onZoomChange={onZoomChange}
        />
    </MapContainer>
));

GeoMapViewport.displayName = 'GeoMapViewport';

const DatosProyecto = ({ project, initialDetail = null, onProjectNameSaved }) => {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const normalizedRole = (user?.rol || '').toLowerCase();
    
    // -- Robust formatters with fallbacks --
    const formatters = useFormatters();
    const formatNumericDisplay = formatters?.formatNumericDisplay || ((v) => String(v || '').replace('.', ','));
    const parseNumericInput = formatters?.parseNumericInput || ((v) => String(v || '').replace(',', '.'));

    const isAdmin = ['administrador', 'superadministrador'].includes(normalizedRole);
    const empId = selectedEmpresa?.id || user?.empresa_id || null;
    const projectRootCode = project?.codigo_root || project?.codigo || '';

    const [loading, setLoading] = useState(true);
    const [projectName, setProjectName] = useState(project?.nombre || '');

    const [saveStatus, _setSaveStatus] = useState(''); // 'saved', 'saving', 'error'
    const [geoSearching, setGeoSearching] = useState(false);
    const [mapZoom, setMapZoom] = useState(13);
    const [geoHint, setGeoHint] = useState('');
    // Referencia para mantener el estado más reciente de formData para el unmount
    const formDataRef = React.useRef(null);
    const projectNameRef = React.useRef(project?.nombre || '');
    const projectCommercialRef = React.useRef({
        presupuesto_estimado: Number(project?.presupuesto_estimado || 0),
        moneda: project?.moneda || 'USD',
    });
    const isMounted = React.useRef(true);
    const isDirty = React.useRef(false); // SOLO guardar si el usuario hizo cambios
    const isProjectDirty = React.useRef(false);
    const saveTimeoutRef = React.useRef(null);
    const lastSavedPayloadRef = React.useRef('');
    const lastSavedProjectNameRef = React.useRef((project?.nombre || '').trim());
    const mainScrollRef = React.useRef(null);
    const sideScrollRef = React.useRef(null);
    const documentInputRef = React.useRef(null);
    const contractDateInputRef = React.useRef(null);
    const startDateInputRef = React.useRef(null);
    // Master data states
    const [tiposProyecto, setTiposProyecto] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [provincias, setProvincias] = useState([]);
    const [cantones, setCantones] = useState([]);

    const openDatePicker = useCallback((inputRef) => {
        const input = inputRef?.current;
        if (!input || !isAdmin) return;
        input.focus();
        if (typeof input.showPicker === 'function') {
            input.showPicker();
            return;
        }
        input.click();
    }, [isAdmin]);

    const loadCategorias = useCallback(async (tipoId) => {
        try {
            const data = await maestrosApi.getCategorias(tipoId);
            setCategorias(data);
        } catch (error) {
            console.error("Error al cargar categorías:", error);
        }
    }, []);

    const loadCantones = useCallback(async (provincia) => {
        if (!provincia) return;
        try {
            console.log("Solicitando cantones al API para:", provincia);
            const data = await maestrosApi.getCantones(provincia);
            console.log("Cantones recibidos:", data);
            setCantones(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error al cargar cantones:", error);
            setCantones([]);
        }
    }, []);


    // Form state
    const [formData, setFormData] = useState({
        cod_referencial: '',
        tipo_proyecto_id: '',
        categoria_id: '',
        tipo_construccion: '',
        ambito_contratacion: '',
        tipo_contrato: '',
        normativa_aplicable: '',
        nivel_complejidad: '',
        cliente_contratante_preliminar: '',
        presupuesto_referencial: project?.presupuesto_estimado ?? '',
        moneda: project?.moneda || 'USD',
        fuente_financiamiento: '',
        numero_contrato: '',
        fecha_firma_contrato: '',
        descripcion_breve: '',
        alcance_detallado: '',
        tipo_medicion: 'area',
        area_terreno: 0,
        area_construccion: 0,
        num_niveles: '',
        longitud_total: '',
        unidad_longitud: 'm',
        ancho_promedio: '',
        volumen_total: '',
        cantidad_unidades: '',
        descripcion_unidad: '',
        fecha_inicio: '',
        plazo_ejecucion: 0,
        fecha_finalizacion: '',
        pais: 'Ecuador',
        provincia: '',
        canton: '',
        ciudad: '',
        direccion: '',
        objetivos_clave: '',
        restricciones_conocidas: '',
        supuestos_iniciales: '',
        imagen_referencial_url: '',
        latitud: -0.1807, // Centro de Quito por defecto
        longitud: -78.4678,
        map_zoom: 13,
        georef_map_url: '',
        georef_map_status: '',
        georef_map_signature: '',
        georef_map_generated_at: null,
        georef_map_error: ''
    });
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [reportPreview, setReportPreview] = useState(null);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [loadingReportPreview, setLoadingReportPreview] = useState(false);
    const [projectDocuments, setProjectDocuments] = useState([]);
    const [documentsLoading, setDocumentsLoading] = useState(false);
    const [documentUploading, setDocumentUploading] = useState(false);
    const [pdfPreviewDocument, setPdfPreviewDocument] = useState(null);
    const [pdfPreviewUrl, setPdfPreviewUrl] = useState('');
    const [pdfPreviewLoading, setPdfPreviewLoading] = useState(false);
    const [imageViewerOpen, setImageViewerOpen] = useState(false);
    const [geoViewerOpen, setGeoViewerOpen] = useState(false);
    const [geoSearchQuery, setGeoSearchQuery] = useState('');
    const [reportTemplateId, setReportTemplateId] = useState(
        project?.plantillas_config?.acta_constitucion
            || selectedEmpresa?.plantillas_config?.acta_constitucion
            || PLANTILLAS_OPCIONES.acta_constitucion.options[0]?.id
            || '001'
    );
    const [collapsedSections, setCollapsedSections] = useState({
        contractual: true,
        objectives: true
    });

    const toggleSection = useCallback((sectionKey) => {
        setCollapsedSections((prev) => ({
            ...prev,
            [sectionKey]: !prev[sectionKey]
        }));
    }, []);

    useEffect(() => {
        const loadInitialData = async () => {
            setLoading(true);
            try {
                // We load each piece of data independently to avoid one failure blocking everything
                const fetchTipos = maestrosApi.getTiposProyecto().catch(e => {
                    console.error("Error loading project types:", e);
                    return [];
                });
                const fetchProvincias = maestrosApi.getProvincias().catch(e => {
                    console.error("Error loading provinces:", e);
                    return [];
                });
                const fetchDetalle = initialDetail
                    ? Promise.resolve(initialDetail)
                    : proyectoDetalleApi.getByRoot(project.codigo_root || project.codigo, empId).catch(e => {
                        console.error("Error loading project details:", e);
                        return { codigo_root: project.codigo_root || project.codigo };
                    });

                const [tipos, provs, detalle] = await Promise.all([fetchTipos, fetchProvincias, fetchDetalle]);

                setTiposProyecto(Array.isArray(tipos) ? tipos : []);
                setProvincias(Array.isArray(provs) ? provs : []);

                if (detalle && (detalle.codigo_root || detalle.id)) {
                    console.log("Detalle cargado:", detalle);
                    setFormData(prev => ({
                        ...prev,
                        ...detalle,
                        ambito_contratacion: normalizeAmbitoContratacion(detalle.ambito_contratacion),
                        presupuesto_referencial: detalle.presupuesto_referencial ?? project?.presupuesto_estimado ?? prev.presupuesto_referencial,
                        moneda: detalle.moneda || project?.moneda || prev.moneda || 'USD',
                        tipo_medicion: detalle.tipo_medicion || 'area',
                        unidad_longitud: detalle.unidad_longitud || 'm',
                    }));
                    setMapZoom(detalle.map_zoom || 13);

                    // Explicitly await dependent data BEFORE finalizing loading
                    const promises = [];
                    if (detalle.tipo_proyecto_id) {
                        promises.push(loadCategorias(detalle.tipo_proyecto_id));
                    }
                    if (detalle.provincia) {
                        console.log("Cargando cantones para:", detalle.provincia);
                        promises.push(loadCantones(detalle.provincia));
                    }
                    await Promise.all(promises);
                    console.log("Datos dependientes cargados correctamente");
                }
            } catch (error) {
                console.error("Error al cargar datos iniciales:", error);
            } finally {
                setLoading(false);
            }
        };

        if (project) loadInitialData();
    }, [empId, initialDetail, project, loadCantones, loadCategorias]);

    useEffect(() => {
        setReportTemplateId(
            project?.plantillas_config?.acta_constitucion
                || selectedEmpresa?.plantillas_config?.acta_constitucion
                || PLANTILLAS_OPCIONES.acta_constitucion.options[0]?.id
                || '001'
        );
    }, [project?.plantillas_config?.acta_constitucion, selectedEmpresa?.plantillas_config?.acta_constitucion]);

    const handleInputChange = (e) => {
        isDirty.current = true;
        const { name, value } = e.target;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };

            // Recalcular fecha finalización si cambia inicio o plazo
            if (name === 'fecha_inicio' || name === 'plazo_ejecucion') {
                if (newState.fecha_inicio && newState.plazo_ejecucion) {
                    const start = new Date(newState.fecha_inicio);
                    const end = new Date(start);
                    end.setDate(start.getDate() + parseInt(newState.plazo_ejecucion));
                    newState.fecha_finalizacion = end.toISOString().split('T')[0];
                }
            }
            return newState;
        });
    };

    const handleSelectChange = (name, value) => {
        isDirty.current = true;
        setFormData(prev => {
            const newState = { ...prev, [name]: value };
            if (name === 'tipo_proyecto_id') {
                newState.categoria_id = '';
                loadCategorias(value);
            }
            if (name === 'provincia') {
                newState.canton = '';
                newState.ciudad = '';
                loadCantones(value);
            }
            return newState;
        });
    };

    const handleMultiSelectChange = async (name, event) => {
        isDirty.current = true;
        const eventValue = event.target.value;
        let nextValues = (Array.isArray(eventValue)
            ? eventValue
            : Array.from(event.target.selectedOptions || []).map((option) => option.value))
            .filter(Boolean);

        if (name === 'normativa_aplicable' && (nextValues.includes('__otra__') || nextValues.includes('Otra'))) {
            nextValues = nextValues.filter((value) => value !== '__otra__' && value !== 'Otra');
            const customNormativa = await appPrompt({
                title: 'Normativa personalizada',
                message: 'Especifica la normativa aplicable que deseas añadir al proyecto.',
                label: 'Nombre o código de normativa',
                placeholder: 'Ej: ISO 45001, Ordenanza local, NTE INEN...',
                confirmLabel: 'Añadir',
                cancelLabel: 'Cancelar',
                tone: 'info',
                size: 'compact',
                requiredMessage: 'Indica una normativa para poder añadirla.',
            });

            const normalizedCustom = normalizeVisibleTextValue(customNormativa).trim();
            if (normalizedCustom) {
                const exists = nextValues.some((value) => value.trim().toLowerCase() === normalizedCustom.toLowerCase());
                if (!exists) {
                    nextValues = [...nextValues, normalizedCustom];
                }
            }
        }

        setFormData(prev => ({
            ...prev,
            [name]: serializeListItems(nextValues),
        }));
    };

    const handleRemoveNormativa = (norma) => {
        isDirty.current = true;
        setFormData(prev => ({
            ...prev,
            normativa_aplicable: serializeListItems(parseListItems(prev.normativa_aplicable).filter((item) => item !== norma)),
        }));
    };

    const handleImageUpload = async (e) => {
        isDirty.current = true;
        const file = e.target.files[0];
        if (!file) return;

        try {
            const res = await proyectoDetalleApi.uploadImage(file, empId);
            setFormData(prev => ({ ...prev, imagen_referencial_url: res.url }));
        } catch (error) {
            console.error("Error uploading image:", error);
            appAlert("Error al subir la imagen");
        }
    };

    const loadProjectDocuments = useCallback(async () => {
        if (!projectRootCode) return;
        setDocumentsLoading(true);
        try {
            const documents = await proyectoDetalleApi.listDocuments(projectRootCode, empId);
            setProjectDocuments(Array.isArray(documents) ? documents : []);
        } catch (error) {
            console.error("Error cargando documentos del proyecto:", error);
            setProjectDocuments([]);
        } finally {
            setDocumentsLoading(false);
        }
    }, [empId, projectRootCode]);

    useEffect(() => {
        loadProjectDocuments();
    }, [loadProjectDocuments]);

    useEffect(() => () => {
        if (pdfPreviewUrl) {
            window.URL.revokeObjectURL(pdfPreviewUrl);
        }
    }, [pdfPreviewUrl]);

    const handleDocumentUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
            await appAlert({ title: 'Documento no válido', message: 'Solo se permiten documentos PDF.' });
            event.target.value = '';
            return;
        }

        setDocumentUploading(true);
        try {
            const uploaded = await proyectoDetalleApi.uploadDocument(projectRootCode, file, empId);
            setProjectDocuments((current) => [uploaded, ...current]);
        } catch (error) {
            console.error("Error subiendo documento PDF:", error);
            await appAlert(error?.response?.data?.detail || 'No se pudo subir el documento PDF.');
        } finally {
            setDocumentUploading(false);
            event.target.value = '';
        }
    };

    const handleViewDocument = async (document) => {
        if (!document?.id) return;
        setPdfPreviewDocument(document);
        setPdfPreviewLoading(true);
        try {
            const response = await proyectoDetalleApi.downloadDocument(document.id, empId);
            const blob = new Blob([response.data], { type: response?.headers?.['content-type'] || 'application/pdf' });
            const nextUrl = window.URL.createObjectURL(blob);
            setPdfPreviewUrl((currentUrl) => {
                if (currentUrl) window.URL.revokeObjectURL(currentUrl);
                return nextUrl;
            });
        } catch (error) {
            console.error("Error abriendo visor PDF:", error);
            setPdfPreviewDocument(null);
            await appAlert('No se pudo abrir el visor interno del PDF.');
        } finally {
            setPdfPreviewLoading(false);
        }
    };

    const handleClosePdfPreview = () => {
        setPdfPreviewDocument(null);
        setPdfPreviewUrl((currentUrl) => {
            if (currentUrl) window.URL.revokeObjectURL(currentUrl);
            return '';
        });
    };

    const handleDownloadDocument = async (document) => {
        if (!document?.id) return;
        try {
            const response = await proyectoDetalleApi.downloadDocument(document.id, empId);
            downloadBlobResponse(response, document.file_name || 'documento.pdf', 'application/pdf');
        } catch (error) {
            console.error("Error descargando documento PDF:", error);
            await appAlert('No se pudo descargar el documento PDF.');
        }
    };

    const handleDeleteDocument = async (document) => {
        if (!document?.id) return;
        const confirmed = await appConfirm({
            title: 'Eliminar PDF',
            message: `Se retirará el documento "${document.file_name}" del listado del proyecto. ¿Deseas continuar?`,
            confirmLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            tone: 'danger',
        });
        if (!confirmed) return;

        try {
            await proyectoDetalleApi.deleteDocument(document.id, empId);
            setProjectDocuments((current) => current.filter((item) => item.id !== document.id));
            if (pdfPreviewDocument?.id === document.id) {
                handleClosePdfPreview();
            }
        } catch (error) {
            console.error("Error eliminando documento PDF:", error);
            await appAlert(error?.response?.data?.detail || 'No se pudo eliminar el documento PDF.');
        }
    };

    const objectiveItems = parseEditableListItems(formData.objetivos_clave);
    const restrictionItems = parseEditableListItems(formData.restricciones_conocidas);
    const assumptionItems = parseEditableListItems(formData.supuestos_iniciales);
    const normativaItems = parseListItems(formData.normativa_aplicable);
    const normativaDisplayLabel = normativaItems.length
        ? normativaItems.join(', ')
        : 'Seleccione normativa aplicable...';
    const normativaDisplayClass = normativaItems.length ? 'text-zinc-900' : 'text-zinc-400';
    const activeMeasurementType = formData.tipo_medicion || 'area';
    const areaTerrenoValue = normalizeOptionalFloat(formData.area_terreno, 0);
    const areaConstruccionValue = normalizeOptionalFloat(formData.area_construccion, 0);
    const numNivelesValue = normalizeOptionalInt(formData.num_niveles);
    const longitudTotalValue = normalizeOptionalFloat(formData.longitud_total, null);
    const anchoPromedioValue = normalizeOptionalFloat(formData.ancho_promedio, null);
    const volumenTotalValue = normalizeOptionalFloat(formData.volumen_total, null);
    const cantidadUnidadesValue = normalizeOptionalInt(formData.cantidad_unidades);
    const measurementAlerts = [];
    const measurementSummary = [];
    const showsAreaFields = activeMeasurementType === 'area' || activeMeasurementType === 'mixto';
    const showsLengthFields = activeMeasurementType === 'longitud' || activeMeasurementType === 'mixto';
    const showsVolumeFields = activeMeasurementType === 'volumen' || activeMeasurementType === 'mixto';
    const showsUnitFields = activeMeasurementType === 'unidades' || activeMeasurementType === 'mixto';

    if (showsAreaFields) {
        if (areaTerrenoValue > 0) {
            measurementSummary.push({ label: 'Área terreno', value: `${formatNumericDisplay(areaTerrenoValue)} m²` });
        }
        if (areaConstruccionValue > 0) {
            measurementSummary.push({ label: 'Área construcción', value: `${formatNumericDisplay(areaConstruccionValue)} m²` });
        }
        if (numNivelesValue) {
            measurementSummary.push({ label: 'Niveles', value: `${numNivelesValue}` });
        }
        if (areaTerrenoValue > 0 && areaConstruccionValue > areaTerrenoValue) {
            measurementAlerts.push({
                tone: 'warning',
                title: 'Atención técnica',
                message: `El área de construcción (${formatNumericDisplay(areaConstruccionValue)} m²) es mayor que el área de terreno (${formatNumericDisplay(areaTerrenoValue)} m²). Esto indica edificación vertical. Verifique el número de niveles.`
            });
            if (!numNivelesValue || numNivelesValue <= 1) {
                measurementAlerts.push({
                    tone: 'danger',
                    title: 'Revisión recomendada',
                    message: 'La edificación parece vertical, pero el número de niveles no está informado o es 1. Conviene corregirlo antes de emitir reportes.'
                });
            }
        }
    }
    if (showsLengthFields) {
        if (longitudTotalValue) {
            measurementSummary.push({ label: 'Longitud', value: `${formatNumericDisplay(longitudTotalValue)} ${formData.unidad_longitud || 'm'}` });
        }
        if (anchoPromedioValue) {
            measurementSummary.push({ label: 'Ancho promedio', value: `${formatNumericDisplay(anchoPromedioValue)} m` });
        }
        if (longitudTotalValue && anchoPromedioValue) {
            const longitudMetros = formData.unidad_longitud === 'km' ? longitudTotalValue * 1000 : longitudTotalValue;
            measurementSummary.push({ label: 'Área estimada', value: `${formatNumericDisplay(longitudMetros * anchoPromedioValue)} m²` });
        }
    }
    if (showsVolumeFields && volumenTotalValue) {
        measurementSummary.push({ label: 'Volumen', value: `${formatNumericDisplay(volumenTotalValue)} m³` });
    }
    if (showsUnitFields) {
        if (cantidadUnidadesValue) {
            measurementSummary.push({ label: 'Unidades', value: `${cantidadUnidadesValue}` });
        }
        if (formData.descripcion_unidad) {
            measurementSummary.push({ label: 'Tipo unidad', value: normalizeVisibleTextValue(formData.descripcion_unidad) });
        }
    }
    if (activeMeasurementType === 'mixto' && measurementSummary.length === 0) {
        measurementAlerts.push({
            tone: 'warning',
            title: 'Atención técnica',
            message: 'La medición mixta está seleccionada, pero todavía no hay magnitudes capturadas.'
        });
    }
    const objectiveRows = isAdmin && objectiveItems.length === 0 ? [''] : objectiveItems;
    const restrictionRows = isAdmin && restrictionItems.length === 0 ? [''] : restrictionItems;
    const assumptionRows = isAdmin && assumptionItems.length === 0 ? [''] : assumptionItems;

    const setListItems = useCallback((fieldName, nextItems) => {
        isDirty.current = true;
        setFormData((prev) => ({
            ...prev,
            [fieldName]: serializeEditableListItems(nextItems),
        }));
    }, []);

    const handleListItemChange = useCallback((fieldName, currentRows, index, nextValue) => {
        const sourceItems = currentRows.length > 0 ? [...currentRows] : [''];
        sourceItems[index] = nextValue;
        setListItems(fieldName, sourceItems);
    }, [setListItems]);

    const handleAddListItem = useCallback((fieldName, currentRows) => {
        const sourceItems = currentRows.length > 0 ? [...currentRows] : [];
        sourceItems.push('');
        setListItems(fieldName, sourceItems);
    }, [setListItems]);

    const handleRemoveListItem = useCallback((fieldName, currentRows, index) => {
        const sourceItems = [...currentRows];
        sourceItems.splice(index, 1);
        setListItems(fieldName, sourceItems);
    }, [setListItems]);

    const renderIncrementalListCard = ({
        fieldName,
        title,
        subtitle,
        rows,
        emptyLabel,
        placeholder,
    }) => (
        <div className="space-y-3 rounded-[1rem] border border-dashed border-zinc-200 bg-zinc-50/80 p-4">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">{title}</p>
                    <p className="mt-1 text-[11px] font-semibold text-zinc-400">{subtitle}</p>
                </div>
                {isAdmin && (
                    <button
                        type="button"
                        onClick={() => handleAddListItem(fieldName, rows)}
                        className={`${SOFT_ACTION_BUTTON_BASE} h-8 w-8 rounded-[0.9rem] text-[#136191]`}
                        title={`Agregar ${title.toLowerCase()}`}
                        aria-label={`Agregar ${title.toLowerCase()}`}
                    >
                        <Plus className="h-3.5 w-3.5" />
                    </button>
                )}
            </div>
            <div className="space-y-2">
                {rows.length > 0 ? (
                    rows.map((item, index) => (
                        <div key={`${fieldName}-${index}`} className="flex items-center gap-2">
                            <AppHint
                                content={item}
                                disabled={!String(item || '').trim() || String(item || '').trim().length < 28}
                                tone="light"
                                as="div"
                                triggerClassName="block min-w-0 flex-1"
                                maxWidth={360}
                                widthOffset={96}
                            >
                                <Input
                                    value={item}
                                    onChange={(e) => handleListItemChange(fieldName, rows, index, e.target.value)}
                                    readOnly={!isAdmin}
                                    spellCheck={true}
                                    placeholder={placeholder}
                                    className="h-11 w-full rounded-xl border-zinc-200 bg-white font-medium"
                                />
                            </AppHint>
                            {isAdmin && (
                                <button
                                    type="button"
                                    onClick={() => handleRemoveListItem(fieldName, rows, index)}
                                    className={`${SOFT_ACTION_BUTTON_BASE} h-10 w-10 rounded-[0.9rem] text-red-600 hover:text-red-700`}
                                    title={`Quitar ${title.toLowerCase()}`}
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="text-[11px] font-semibold text-zinc-400">{emptyLabel}</p>
                )}
            </div>
        </div>
    );



    // Mantiene la referencia siempre actualizada
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    useEffect(() => {
        const normalizedAddress = normalizeVisibleTextValue(formData.direccion);
        setGeoSearchQuery((current) => (geoViewerOpen ? current || normalizedAddress : normalizedAddress));
    }, [geoViewerOpen, formData.direccion]);

    useEffect(() => {
        const nextName = project?.nombre || '';
        setProjectName(nextName);
        projectNameRef.current = nextName;
        lastSavedProjectNameRef.current = nextName.trim();
        projectCommercialRef.current = {
            presupuesto_estimado: Number(project?.presupuesto_estimado || 0),
            moneda: project?.moneda || 'USD',
        };
        isProjectDirty.current = false;
    }, [project?.id, project?.moneda, project?.nombre, project?.presupuesto_estimado]);

    const buildSavePayload = useCallback((data) => ({
        codigo_root: project?.codigo_root || project?.codigo || data?.codigo_root || '',
        cod_referencial: (data?.cod_referencial || '').trim() || null,
        tipo_proyecto_id: normalizeOptionalInt(data?.tipo_proyecto_id),
        categoria_id: normalizeOptionalInt(data?.categoria_id),
        tipo_construccion: data?.tipo_construccion || null,
        ambito_contratacion: normalizeAmbitoContratacion(data?.ambito_contratacion) || null,
        tipo_contrato: data?.tipo_contrato || null,
        normativa_aplicable: serializeListItems(parseListItems(data?.normativa_aplicable)),
        nivel_complejidad: data?.nivel_complejidad || null,
        cliente_contratante_preliminar: (data?.cliente_contratante_preliminar || '').trim() || null,
        presupuesto_referencial: normalizeOptionalFloat(data?.presupuesto_referencial, null),
        moneda: (data?.moneda || 'USD').trim() || 'USD',
        fuente_financiamiento: (data?.fuente_financiamiento || '').trim() || null,
        numero_contrato: (data?.numero_contrato || '').trim() || null,
        fecha_firma_contrato: normalizeOptionalDate(data?.fecha_firma_contrato),
        descripcion_breve: (data?.descripcion_breve || '').trim().slice(0, 200) || null,
        alcance_detallado: (data?.alcance_detallado || '').trim() || null,
        tipo_medicion: data?.tipo_medicion || 'area',
        area_terreno: normalizeOptionalFloat(data?.area_terreno, 0),
        area_construccion: normalizeOptionalFloat(data?.area_construccion, 0),
        num_niveles: normalizeOptionalInt(data?.num_niveles),
        longitud_total: normalizeOptionalFloat(data?.longitud_total, null),
        unidad_longitud: data?.unidad_longitud || 'm',
        ancho_promedio: normalizeOptionalFloat(data?.ancho_promedio, null),
        volumen_total: normalizeOptionalFloat(data?.volumen_total, null),
        cantidad_unidades: normalizeOptionalInt(data?.cantidad_unidades),
        descripcion_unidad: (data?.descripcion_unidad || '').trim() || null,
        fecha_inicio: normalizeOptionalDate(data?.fecha_inicio),
        plazo_ejecucion: normalizeOptionalInt(data?.plazo_ejecucion) ?? 0,
        fecha_finalizacion: normalizeOptionalDate(data?.fecha_finalizacion),
        pais: data?.pais || 'Ecuador',
        provincia: data?.provincia || null,
        canton: data?.canton || null,
        ciudad: data?.ciudad || null,
        direccion: data?.direccion || null,
        objetivos_clave: serializeListItems(parseListItems(data?.objetivos_clave)),
        restricciones_conocidas: serializeListItems(parseListItems(data?.restricciones_conocidas)),
        supuestos_iniciales: serializeListItems(parseListItems(data?.supuestos_iniciales)),
        imagen_referencial_url: data?.imagen_referencial_url || null,
        latitud: normalizeOptionalFloat(data?.latitud, null),
        longitud: normalizeOptionalFloat(data?.longitud, null),
        map_zoom: normalizeOptionalInt(data?.map_zoom) ?? 13,
    }), [project?.codigo, project?.codigo_root]);

    const persistProjectDetail = useCallback(async (data, empresaId, { silent = false } = {}) => {
        if (!data?.codigo_root) {
            return;
        }

        const payload = buildSavePayload(data);
        const serializedPayload = JSON.stringify(payload);
        if (serializedPayload === lastSavedPayloadRef.current) {
            isDirty.current = false;
            if (!silent) {
                _setSaveStatus('saved');
            }
            return;
        }

        if (!silent) {
            _setSaveStatus('saving');
        }

        try {
            const savedDetail = await proyectoDetalleApi.save(payload, empresaId);
            lastSavedPayloadRef.current = serializedPayload;
            isDirty.current = false;
            if (isMounted.current) {
                if (savedDetail) {
                    setFormData(prev => {
                        const nextState = {
                            ...prev,
                            georef_map_url: savedDetail.georef_map_url || '',
                            georef_map_status: savedDetail.georef_map_status || '',
                            georef_map_signature: savedDetail.georef_map_signature || '',
                            georef_map_generated_at: savedDetail.georef_map_generated_at || null,
                            georef_map_error: savedDetail.georef_map_error || ''
                        };
                        formDataRef.current = nextState;
                        return nextState;
                    });
                }
                _setSaveStatus('saved');
                window.clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = window.setTimeout(() => {
                    if (isMounted.current) {
                        _setSaveStatus('');
                    }
                }, 1800);
            }
        } catch (error) {
            console.error("Error guardando detalle del proyecto:", error);
            if (isMounted.current) {
                _setSaveStatus('error');
            }
            throw error;
        }
    }, [buildSavePayload]);

    const persistProjectName = useCallback(async (name, empresaId, { silent = false } = {}) => {
        if (!project?.id) return;
        const normalizedName = (name || '').trim();
        if (!normalizedName || normalizedName === lastSavedProjectNameRef.current) {
            isProjectDirty.current = false;
            if (!silent) {
                _setSaveStatus('saved');
            }
            return;
        }

        if (!silent) {
            _setSaveStatus('saving');
        }

        try {
            await proyectosApi.update(project.id, { nombre: normalizedName }, empresaId);
            lastSavedProjectNameRef.current = normalizedName;
            isProjectDirty.current = false;
            onProjectNameSaved?.(normalizedName);
            if (isMounted.current) {
                _setSaveStatus('saved');
                window.clearTimeout(saveTimeoutRef.current);
                saveTimeoutRef.current = window.setTimeout(() => {
                    if (isMounted.current) {
                        _setSaveStatus('');
                    }
                }, 1800);
            }
        } catch (error) {
            console.error('Error guardando nombre del proyecto:', error);
            if (isMounted.current) {
                _setSaveStatus('error');
            }
            throw error;
        }
    }, [onProjectNameSaved, project?.id]);

    const persistProjectCommercialSummary = useCallback(async (data, empresaId) => {
        if (!project?.id) return;

        const nextBudget = normalizeOptionalFloat(data?.presupuesto_referencial, 0) ?? 0;
        const nextCurrency = (data?.moneda || 'USD').trim() || 'USD';
        const currentBudget = Number(projectCommercialRef.current?.presupuesto_estimado || 0);
        const currentCurrency = projectCommercialRef.current?.moneda || 'USD';

        if (nextBudget === currentBudget && nextCurrency === currentCurrency) {
            return;
        }

        await proyectosApi.update(project.id, {
            presupuesto_estimado: nextBudget,
            moneda: nextCurrency,
        }, empresaId);

        projectCommercialRef.current = {
            presupuesto_estimado: nextBudget,
            moneda: nextCurrency,
        };
    }, [project?.id]);

    useEffect(() => {
        if (!isAdmin || (!isDirty.current && !isProjectDirty.current) || !formData.codigo_root) {
            return undefined;
        }

        window.clearTimeout(saveTimeoutRef.current);
        _setSaveStatus('saving');
        saveTimeoutRef.current = window.setTimeout(() => {
            Promise.all([
                isDirty.current ? persistProjectDetail(formDataRef.current, empId, { silent: true }) : Promise.resolve(),
                isDirty.current ? persistProjectCommercialSummary(formDataRef.current, empId) : Promise.resolve(),
                isProjectDirty.current ? persistProjectName(projectNameRef.current, empId, { silent: true }) : Promise.resolve(),
            ])
                .then(() => {
                    if (isMounted.current) {
                        _setSaveStatus('saved');
                        window.clearTimeout(saveTimeoutRef.current);
                        saveTimeoutRef.current = window.setTimeout(() => {
                            if (isMounted.current) {
                                _setSaveStatus('');
                            }
                        }, 1800);
                    }
                })
                .catch(() => {
                    if (isMounted.current) {
                        _setSaveStatus('error');
                    }
                });
        }, 900);

        return () => {
            window.clearTimeout(saveTimeoutRef.current);
        };
    }, [formData, projectName, empId, isAdmin, persistProjectCommercialSummary, persistProjectDetail, persistProjectName]);

    // Save on unmount (cambio de sección o salida del proyecto)
    useEffect(() => {
        isMounted.current = true;
        const currentEmpId = empId; // Guardar referencia para el cleanup
        return () => {
            isMounted.current = false;
            window.clearTimeout(saveTimeoutRef.current);
            // Al desmontar, disparamos el guardado con los datos más recientes SOLO si hubo cambios
            if ((isDirty.current || isProjectDirty.current) && formDataRef.current && formDataRef.current.codigo_root) {
                Promise.all([
                    isDirty.current ? persistProjectDetail(formDataRef.current, currentEmpId, { silent: true }) : Promise.resolve(),
                    isDirty.current ? persistProjectCommercialSummary(formDataRef.current, currentEmpId) : Promise.resolve(),
                    isProjectDirty.current ? persistProjectName(projectNameRef.current, currentEmpId, { silent: true }) : Promise.resolve(),
                ]).catch(e => console.error("Error al guardar en segundo plano (unmount)", e));
            }
        };
    }, [empId, persistProjectCommercialSummary, persistProjectDetail, persistProjectName, project.codigo_root]);

    const handleGeoLocationChange = useCallback(({ lat, lng, zoom }) => {
        isDirty.current = true;
        setMapZoom(zoom);
        setFormData(prev => ({
            ...prev,
            latitud: lat,
            longitud: lng,
            map_zoom: zoom,
            georef_map_status: 'pending',
            georef_map_signature: '',
            georef_map_error: ''
        }));
    }, []);

    const handleGeoZoomChange = useCallback((zoom) => {
        if ((formDataRef.current?.map_zoom ?? DEFAULT_MAP_CENTER.zoom) === zoom) {
            setMapZoom(zoom);
            return;
        }
        isDirty.current = true;
        setMapZoom(zoom);
        setFormData(prev => ({
            ...prev,
            map_zoom: zoom,
            georef_map_status: 'pending',
            georef_map_signature: '',
            georef_map_error: ''
        }));
    }, []);

    const handleGeocodeAddress = async (searchQueryOverride = null) => {
        const activeSearchQuery = typeof searchQueryOverride === 'string'
            ? searchQueryOverride
            : geoSearchQuery;
        const effectiveAddress = String(activeSearchQuery || formData.direccion || '').replace(/\s+/g, ' ').trim();
        if (effectiveAddress && effectiveAddress !== geoSearchQuery) {
            setGeoSearchQuery(effectiveAddress);
        }

        const hasLocationInput = [formData.pais, formData.provincia, formData.canton, formData.ciudad, effectiveAddress]
            .some((value) => String(value || '').trim());
        if (!hasLocationInput) {
            await appAlert("Complete la dirección del proyecto antes de solicitar la georreferenciación.");
            return;
        }

        try {
            setGeoSearching(true);
            setGeoHint('');

            const geocodePayload = {
                pais: formData.pais,
                provincia: formData.provincia,
                canton: formData.canton,
                ciudad: formData.ciudad,
                direccion: effectiveAddress,
            };
            const intersection = String(geocodePayload.pais || '').toLowerCase() === 'ecuador'
                ? splitEcuadorIntersectionAddress(effectiveAddress)
                : null;
            const requiredTerms = intersection ? getGeocodeRequiredTerms(...intersection) : [];

            let match;
            if (intersection) {
                match = await geocodeIntersectionFromOverpassFallback(geocodePayload).catch(() => null);
            }

            try {
                if (!match) {
                    match = await proyectoDetalleApi.geocodeAddress(geocodePayload, empId);
                }
                if (
                    intersection
                    && match?.source !== 'overpass'
                    && !geocodeResultSatisfiesRequiredTerms({ display_name: match?.display_name || match?.query || '' }, requiredTerms)
                ) {
                    match = await geocodeAddressFromBrowserFallback(geocodePayload);
                }
            } catch (backendError) {
                const status = backendError?.response?.status;
                if (![404, 405].includes(status)) {
                    throw backendError;
                }
                match = await geocodeAddressFromBrowserFallback(geocodePayload);
            }

            isDirty.current = true;
            const nextZoom = Number(match.map_zoom || DEFAULT_MAP_CENTER.zoom);
            setMapZoom(nextZoom);
            setGeoHint(match.message || 'Ubicación localizada. Ajusta el punto en el mapa si necesitas más precisión.');
            setFormData((prev) => ({
                ...prev,
                latitud: Number(match.latitud),
                longitud: Number(match.longitud),
                map_zoom: nextZoom,
                georef_map_status: 'pending',
                georef_map_signature: '',
                georef_map_error: ''
            }));
        } catch (error) {
            console.error("Error georreferenciando dirección:", error);
            const message = error?.response?.data?.detail
                || "No fue posible localizar la dirección en este momento. Ajuste el punto manualmente o reintente en unos segundos.";
            setGeoHint('No se encontró una coincidencia útil. Revisa ciudad, cantón o provincia antes de volver a intentar.');
            await appAlert(message);
        } finally {
            setGeoSearching(false);
        }
    };

    const handleOpenGeoViewerAndLocate = () => {
        const effectiveAddress = normalizeVisibleTextValue(formData.direccion).replace(/\s+/g, ' ').trim();
        setGeoSearchQuery(effectiveAddress);
        setGeoViewerOpen(true);
        window.setTimeout(() => {
            handleGeocodeAddress(effectiveAddress);
        }, 0);
    };

    const buildActaReportFilename = useCallback((extension) => buildReportFileName({
        reportLabel: 'Acta de Constitucion del Proyecto',
        contextLabel: sanitizeReportContext(project?.nombre || project?.codigo_root || 'Proyecto', 'Proyecto'),
        revision: project?.revision ?? 0,
        extension,
    }), [project?.nombre, project?.codigo_root, project?.revision]);

    const handleOpenReportPreview = useCallback(async () => {
        if (!project?.id) return;
        try {
            setLoadingReportPreview(true);
            const reportEmpresaId = project?.empresa_id || empId;
            const response = await reportingApi.previewReport({
                report_type: 'acta_constitucion',
                entity_ids: [project.id],
                template_id: reportTemplateId || '001',
                empresa_id: reportEmpresaId,
            }, reportEmpresaId);
            setReportPreview(response.data);
            setShowReportPreview(true);
        } catch (error) {
            console.error('Error generando vista previa del acta:', error);
            setShowReportPreview(false);
            setReportPreview(null);
            await appAlert({
                title: 'Error de reporte',
                message: await extractBlobErrorMessage(error, 'No fue posible generar la vista previa del acta de constitución.'),
                tone: 'danger',
            });
        } finally {
            setLoadingReportPreview(false);
        }
    }, [project?.id, project?.empresa_id, reportTemplateId, empId]);

    const handleExportReport = useCallback(async (format) => {
        if (!project?.id) return;
        try {
            setGeneratingReport(true);
            const reportEmpresaId = project?.empresa_id || empId;
            const response = await reportingApi.exportReport({
                report_type: 'acta_constitucion',
                entity_ids: [project.id],
                template_id: reportPreview?.template_id || reportTemplateId || '001',
                format,
                empresa_id: reportEmpresaId,
            }, reportEmpresaId);
            downloadBlobResponse(
                response,
                buildActaReportFilename(format === 'xlsx' ? 'xlsx' : 'pdf'),
                format === 'xlsx' ? undefined : 'application/pdf'
            );
        } catch (error) {
            console.error('Error exportando acta de constitución:', error);
            const fallbackMessage =
                format === 'xlsx'
                    ? 'No fue posible exportar el acta de constitución en Excel.'
                    : format === 'pdf_excel'
                        ? 'No fue posible exportar el acta de constitución en PDF desde Excel.'
                        : 'No fue posible exportar el acta de constitución en PDF.';
            await appAlert({
                title: 'Error de reporte',
                message: await extractBlobErrorMessage(error, fallbackMessage),
                tone: 'danger',
            });
        } finally {
            setGeneratingReport(false);
        }
    }, [project?.id, project?.empresa_id, reportPreview?.template_id, reportTemplateId, empId, buildActaReportFilename]);

    const georefCacheStatus = String(formData.georef_map_status || '').toLowerCase();
    const hasGeorefCoordinates = formData.latitud !== null && formData.latitud !== undefined && formData.latitud !== ''
        && formData.longitud !== null && formData.longitud !== undefined && formData.longitud !== '';
    const georefCacheMeta = (() => {
        if (!hasGeorefCoordinates || georefCacheStatus === 'missing') {
            return {
                label: 'Sin mapa de reporte',
                detail: 'Faltan coordenadas válidas para crear la imagen georreferenciada del reporte.',
                className: 'border-zinc-200 bg-zinc-50 text-zinc-500',
                icon: <AlertTriangle className="h-3 w-3" />
            };
        }
        if (georefCacheStatus === 'ready') {
            return {
                label: 'Mapa listo',
                detail: formData.georef_map_generated_at
                    ? `Imagen georreferenciada de reporte actualizada: ${new Date(formData.georef_map_generated_at).toLocaleString()}.`
                    : 'Imagen georreferenciada de reporte actualizada para el proyecto.',
                className: 'border-emerald-100 bg-emerald-50 text-emerald-700',
                icon: <MapPinned className="h-3 w-3" />
            };
        }
        return {
            label: 'Mapa pendiente',
            detail: formData.georef_map_error
                ? `Pendiente de actualizar cuando el servicio de mapas esté disponible. Último error: ${formData.georef_map_error}`
                : 'Pendiente de generar o actualizar con la vista georreferenciada aceptada.',
            className: 'border-amber-100 bg-amber-50 text-amber-700',
            icon: <Loader2 className="h-3 w-3 animate-spin" />
        };
    })();

    if (loading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-[#F39200]" />
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-3">
            <div className="flex flex-col gap-2 rounded-[1.1rem] border border-[#ececec] bg-[#f3f3f1] px-4 py-3 shadow-[8px_8px_20px_#dddddd,-8px_-8px_20px_#ffffff] lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-[#F39200]">
                        <Briefcase className="w-4 h-4" /> Datos de Proyecto
                    </h2>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                        Información técnica, contractual y geográfica común del proyecto
                    </p>
                </div>
                <div className="flex items-center gap-2 lg:flex-wrap lg:justify-end">
                    {isAdmin && (
                        <>
                        {saveStatus === 'saving' && (
                            <span className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /> Guardando
                            </span>
                        )}
                        {saveStatus === 'saved' && (
                            <span className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600">
                                <Save className="w-3.5 h-3.5" /> Guardado
                            </span>
                        )}
                        {saveStatus === 'error' && (
                            <span className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-red-600">
                                Error al guardar
                            </span>
                        )}
                        </>
                    )}
                    <ProjectSectionReportButton
                        sectionLabel="Datos del proyecto"
                        onClick={handleOpenReportPreview}
                        disabled={generatingReport || loadingReportPreview}
                    />
                </div>
            </div>

            <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.25rem] border border-[#ececec] bg-[#f7f7f5] shadow-[10px_10px_26px_#dddddd,-10px_-10px_26px_#ffffff]">
                <CardContent
                    className="flex-1 min-h-0 overflow-hidden p-4"
                >
                    <div className="grid h-full min-h-0 grid-cols-12 gap-4">
                        <div className="relative col-span-12 min-h-0 lg:col-span-8">
                            <div
                                ref={mainScrollRef}
                                className="h-full min-h-0 space-y-4 overflow-y-auto pr-5 giproy-motion-scrollbar-hide lg:pr-6"
                            >
                                <section className={COLLAPSIBLE_SECTION_BASE}>
                                <button type="button" onClick={() => toggleSection('identity')} className={COLLAPSIBLE_SECTION_HEADER_BUTTON}>
                                    <span className="flex items-center gap-3">
                                        <Briefcase className="h-4 w-4 text-[#F39200]" />
                                        <span>
                                            <span className={COLLAPSIBLE_SECTION_TITLE_CLASS}>1. Identificación del proyecto</span>
                                            <span className={COLLAPSIBLE_SECTION_SUBTITLE_CLASS}>Código, nombre y estado operativo</span>
                                        </span>
                                    </span>
                                    {renderSectionToggleIcon(collapsedSections.identity)}
                                </button>
                                <CollapsibleSectionBody isCollapsed={collapsedSections.identity}>
                                    <div className="grid gap-4 p-4 md:grid-cols-2">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-[#F39200]">Código de Obra</Label>
                                            <Input
                                                value={`#${project.codigo_root || project.codigo || ''}`}
                                                readOnly
                                                className="h-11 rounded-xl border-zinc-200 bg-zinc-100/70 font-black tracking-tight text-[#1A1A1A] cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-[#F39200]">Nombre de la Obra</Label>
                                            <Input
                                                value={projectName}
                                                onChange={(e) => {
                                                    isProjectDirty.current = true;
                                                    const nextName = e.target.value;
                                                    projectNameRef.current = nextName;
                                                    setProjectName(nextName);
                                                }}
                                                readOnly={!isAdmin}
                                                className="h-11 rounded-xl border-zinc-200 font-black uppercase tracking-tight text-[#1A1A1A]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Estado del Proyecto</Label>
                                            <Input
                                                value={project?.estado || 'Sin estado operativo'}
                                                readOnly
                                                className="h-11 rounded-xl border-zinc-200 bg-zinc-50 font-bold text-[#136191] cursor-not-allowed"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Fecha de creación</Label>
                                            <Input
                                                value={project?.fecha_creacion ? new Date(project.fecha_creacion).toLocaleDateString('es-ES') : 'Pendiente'}
                                                readOnly
                                                className="h-11 rounded-xl border-zinc-200 bg-zinc-50 font-bold text-zinc-500 cursor-not-allowed"
                                            />
                                        </div>
                                    </div>
                                </CollapsibleSectionBody>
                            </section>

                            <section className={COLLAPSIBLE_SECTION_BASE}>
                                <button type="button" onClick={() => toggleSection('technical')} className={COLLAPSIBLE_SECTION_HEADER_BUTTON}>
                                    <span className="flex items-center gap-3">
                                        <Layers className="h-4 w-4 text-[#136191]" />
                                        <span>
                                            <span className={COLLAPSIBLE_SECTION_TITLE_CLASS}>2. Especificaciones técnicas</span>
                                            <span className={COLLAPSIBLE_SECTION_SUBTITLE_CLASS}>Tipología, categoría, contratación y referencia</span>
                                        </span>
                                    </span>
                                    {renderSectionToggleIcon(collapsedSections.technical)}
                                </button>
                                <CollapsibleSectionBody isCollapsed={collapsedSections.technical}>
                                    <div className="grid gap-4 p-4 md:grid-cols-3">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Cod. Referencial</Label>
                                            <Input name="cod_referencial" value={normalizeVisibleTextValue(formData.cod_referencial)} onChange={handleInputChange} readOnly={!isAdmin} placeholder="Ej: PR-2024-X" className="h-11 rounded-xl border-zinc-200 font-bold focus:border-[#F39200]" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Tipo de Proyecto</Label>
                                            <SearchableSelect options={tiposProyecto} labelKey="descripcion" valueKey="id" value={formData.tipo_proyecto_id} onChange={(val) => handleSelectChange('tipo_proyecto_id', val)} readOnly={!isAdmin} placeholder="Seleccione tipo..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Categoría</Label>
                                            <SearchableSelect options={categorias} labelKey="descripcion" valueKey="id" value={formData.categoria_id} onChange={(val) => handleSelectChange('categoria_id', val)} readOnly={!isAdmin} disabled={!formData.tipo_proyecto_id} placeholder="Seleccione categoría..." />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Tipo de Construcción</Label>
                                            <SearchableSelect options={TIPO_CONSTRUCCION} value={formData.tipo_construccion} onChange={(val) => handleSelectChange('tipo_construccion', val)} readOnly={!isAdmin} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Modalidad de contratación</Label>
                                            <SearchableSelect options={AMBITO_CONTRATACION} value={formData.ambito_contratacion} onChange={(val) => handleSelectChange('ambito_contratacion', val)} readOnly={!isAdmin} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Tipo de Contrato</Label>
                                            <SearchableSelect options={TIPO_CONTRATO} value={formData.tipo_contrato} onChange={(val) => handleSelectChange('tipo_contrato', val)} readOnly={!isAdmin} />
                                        </div>
                                        <div className="grid gap-4 md:col-span-3 md:grid-cols-3">
                                            <div className="space-y-2 md:col-span-2">
                                                <div className="flex items-center justify-between gap-3">
                                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Normativa aplicable</Label>
                                                    <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                                                        {normativaItems.length ? `${normativaItems.length} seleccionada${normativaItems.length === 1 ? '' : 's'}` : 'Selección múltiple'}
                                                    </span>
                                                </div>
                                                <AnimatedSelect
                                                    multiple
                                                    value={normativaItems}
                                                    displayValue={normativaDisplayLabel}
                                                    onChange={(event) => void handleMultiSelectChange('normativa_aplicable', event)}
                                                    disabled={!isAdmin}
                                                    className={`h-11 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-normal shadow-[0_2px_4px_rgba(15,23,42,0.04)] outline-none hover:bg-white focus-visible:border-[#F39200] focus-visible:ring-2 focus-visible:ring-[#F39200]/15 ${normativaDisplayClass}`}
                                                    aria-label="Normativa aplicable"
                                                >
                                                    {NORMATIVA_APLICABLE.map((item) => (
                                                        <option key={item.id} value={item.id}>{item.label}</option>
                                                    ))}
                                                </AnimatedSelect>
                                                {normativaItems.length ? (
                                                    <div className="rounded-xl border border-zinc-100 bg-white/70">
                                                        {normativaItems.map((norma) => {
                                                            const label = NORMATIVA_APLICABLE.find((item) => item.id === norma)?.label || norma;
                                                            return (
                                                                <div key={norma} className="flex items-center justify-between gap-3 border-b border-zinc-100 px-3 py-2 last:border-b-0">
                                                                    <span className="min-w-0 truncate text-[11px] font-semibold text-zinc-600">{label}</span>
                                                                    {isAdmin && (
                                                                        <button
                                                                            type="button"
                                                                            onClick={() => handleRemoveNormativa(norma)}
                                                                            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-zinc-400 transition hover:border-red-200 hover:text-red-600"
                                                                            title={`Quitar ${label}`}
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                        </button>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ) : (
                                                    <p className="text-[11px] font-semibold text-zinc-400">Sin normativa seleccionada.</p>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Nivel de complejidad</Label>
                                                <SearchableSelect
                                                    options={NIVELES_COMPLEJIDAD}
                                                    value={formData.nivel_complejidad}
                                                    onChange={(val) => handleSelectChange('nivel_complejidad', val)}
                                                    readOnly={!isAdmin}
                                                    placeholder="Seleccione nivel..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleSectionBody>
                            </section>

                            <section className={COLLAPSIBLE_SECTION_BASE}>
                                <button type="button" onClick={() => toggleSection('scope')} className={COLLAPSIBLE_SECTION_HEADER_BUTTON}>
                                    <span className="flex items-center gap-3">
                                        <Ruler className="h-4 w-4 text-zinc-500" />
                                        <span>
                                            <span className={COLLAPSIBLE_SECTION_TITLE_CLASS}>3. Alcance y dimensionamiento</span>
                                            <span className={COLLAPSIBLE_SECTION_SUBTITLE_CLASS}>Áreas persistidas y alcance contractual</span>
                                        </span>
                                    </span>
                                    {renderSectionToggleIcon(collapsedSections.scope)}
                                </button>
                                <CollapsibleSectionBody isCollapsed={collapsedSections.scope}>
                                    <div className="space-y-4 p-4">
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Descripción breve</Label>
                                                <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-zinc-400">
                                                    {normalizeVisibleTextValue(formData.descripcion_breve).length}/200
                                                </span>
                                            </div>
                                            <Input
                                                name="descripcion_breve"
                                                maxLength={200}
                                                value={normalizeVisibleTextValue(formData.descripcion_breve)}
                                                onChange={handleInputChange}
                                                readOnly={!isAdmin}
                                                spellCheck={true}
                                                placeholder="Resumen ejecutivo para listados y reportes..."
                                                className="h-11 rounded-xl border-zinc-200 font-medium focus:border-[#F39200]"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Alcance detallado</Label>
                                            <Textarea
                                                name="alcance_detallado"
                                                value={normalizeVisibleTextValue(formData.alcance_detallado)}
                                                onChange={handleInputChange}
                                                readOnly={!isAdmin}
                                                spellCheck={true}
                                                placeholder="Descripción completa de entregables, especificaciones generales y alcance del proyecto..."
                                                className="min-h-[120px] rounded-3xl border-zinc-200 p-4 text-sm font-medium focus:border-[#F39200]"
                                            />
                                        </div>

                                        <div className="h-px bg-zinc-100" />

                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Tipo de medición</Label>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <ProjectSegmentedSwitch
                                                    value={activeMeasurementType}
                                                    onChange={(nextType) => handleSelectChange('tipo_medicion', nextType)}
                                                    options={TIPO_MEDICION.map((option) => ({
                                                        value: option.id,
                                                        label: option.switchLabel || option.label,
                                                        title: option.label,
                                                    }))}
                                                    size="sm"
                                                    className="max-w-full"
                                                    ariaLabel="Tipo de medición del alcance"
                                                    disabled={!isAdmin}
                                                />
                                                {measurementAlerts.map((alert, index) => (
                                                    <button
                                                        key={`${alert.tone}-${index}`}
                                                        type="button"
                                                        onClick={() => appAlert({
                                                            title: alert.title || (alert.tone === 'danger' ? 'Revisión recomendada' : 'Atención técnica'),
                                                            message: alert.message,
                                                            tone: alert.tone === 'danger' ? 'danger' : 'warning',
                                                            confirmLabel: 'Entendido',
                                                            size: 'compact',
                                                        })}
                                                        className={`inline-flex h-10 items-center gap-2 rounded-[1.05rem] border bg-[#f2f2f0] px-3 text-[9px] font-black uppercase tracking-[0.14em] shadow-[4px_4px_10px_rgba(148,163,184,0.2),-4px_-4px_10px_rgba(255,255,255,0.92)] transition hover:-translate-y-0.5 ${
                                                            alert.tone === 'danger'
                                                                ? 'border-red-100 text-red-600'
                                                                : 'border-amber-100 text-[#F39200]'
                                                        }`}
                                                    >
                                                        <AlertTriangle className="h-3.5 w-3.5" />
                                                        {index + 1}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-4 rounded-[1rem] border border-zinc-100 bg-zinc-50/70 p-4">
                                            {(showsAreaFields) && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Medición por área</p>
                                                    <div className="grid gap-4 md:grid-cols-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Área terreno (m²)</Label>
                                                            <Input type="text" name="area_terreno" value={formatNumericDisplay(formData.area_terreno)} onChange={(e) => {
                                                                isDirty.current = true;
                                                                setFormData(prev => ({ ...prev, area_terreno: parseNumericInput(e.target.value) }));
                                                            }} readOnly={!isAdmin} className="h-11 rounded-xl border-zinc-200 bg-white font-bold" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Área construcción (m²)</Label>
                                                            <Input type="text" name="area_construccion" value={formatNumericDisplay(formData.area_construccion)} onChange={(e) => {
                                                                isDirty.current = true;
                                                                setFormData(prev => ({ ...prev, area_construccion: parseNumericInput(e.target.value) }));
                                                            }} readOnly={!isAdmin} className="h-11 rounded-xl border-zinc-200 bg-white font-bold text-[#136191]" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Niveles / pisos</Label>
                                                            <Input type="text" name="num_niveles" value={normalizeVisibleTextValue(formData.num_niveles)} onChange={(e) => {
                                                                isDirty.current = true;
                                                                setFormData(prev => ({ ...prev, num_niveles: e.target.value }));
                                                            }} readOnly={!isAdmin} placeholder="Ej: 2" className="h-11 rounded-xl border-zinc-200 bg-white font-bold" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {(showsLengthFields) && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Medición por longitud</p>
                                                    <div className="grid gap-4 md:grid-cols-3">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Longitud total</Label>
                                                            <Input type="text" name="longitud_total" value={formatNumericDisplay(formData.longitud_total)} onChange={(e) => {
                                                                isDirty.current = true;
                                                                setFormData(prev => ({ ...prev, longitud_total: parseNumericInput(e.target.value) }));
                                                            }} readOnly={!isAdmin} className="h-11 rounded-xl border-zinc-200 bg-white font-bold" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Unidad</Label>
                                                            <AnimatedSelect
                                                                value={formData.unidad_longitud || 'm'}
                                                                onChange={(event) => handleSelectChange('unidad_longitud', event.target.value)}
                                                                disabled={!isAdmin}
                                                                className="h-11 rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-800 outline-none focus-visible:border-[#F39200]"
                                                            >
                                                                {UNIDADES_LONGITUD.map((item) => (
                                                                    <option key={item.id} value={item.id}>{item.label}</option>
                                                                ))}
                                                            </AnimatedSelect>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Ancho promedio (m)</Label>
                                                            <Input type="text" name="ancho_promedio" value={formatNumericDisplay(formData.ancho_promedio)} onChange={(e) => {
                                                                isDirty.current = true;
                                                                setFormData(prev => ({ ...prev, ancho_promedio: parseNumericInput(e.target.value) }));
                                                            }} readOnly={!isAdmin} className="h-11 rounded-xl border-zinc-200 bg-white font-bold" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {(showsVolumeFields) && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Medición por volumen</p>
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Volumen total (m³)</Label>
                                                            <Input type="text" name="volumen_total" value={formatNumericDisplay(formData.volumen_total)} onChange={(e) => {
                                                                isDirty.current = true;
                                                                setFormData(prev => ({ ...prev, volumen_total: parseNumericInput(e.target.value) }));
                                                            }} readOnly={!isAdmin} className="h-11 rounded-xl border-zinc-200 bg-white font-bold" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {(showsUnitFields) && (
                                                <div className="space-y-3">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Medición por unidades</p>
                                                    <div className="grid gap-4 md:grid-cols-2">
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Cantidad de unidades</Label>
                                                            <Input type="text" name="cantidad_unidades" value={normalizeVisibleTextValue(formData.cantidad_unidades)} onChange={(e) => {
                                                                isDirty.current = true;
                                                                setFormData(prev => ({ ...prev, cantidad_unidades: e.target.value }));
                                                            }} readOnly={!isAdmin} placeholder="Ej: 12" className="h-11 rounded-xl border-zinc-200 bg-white font-bold" />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Descripción de unidad</Label>
                                                            <Input name="descripcion_unidad" value={normalizeVisibleTextValue(formData.descripcion_unidad)} onChange={handleInputChange} readOnly={!isAdmin} spellCheck={true} placeholder="Ej: viviendas, postes, luminarias..." className="h-11 rounded-xl border-zinc-200 bg-white font-medium" />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="rounded-[1rem] border border-zinc-100 bg-[#f2f2f0] p-3 shadow-[4px_4px_12px_rgba(225,225,225,0.75),-4px_-4px_12px_rgba(255,255,255,0.9)]">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">Resumen técnico automático</p>
                                            {measurementSummary.length ? (
                                                <div className="mt-3 grid gap-2 md:grid-cols-3">
                                                    {measurementSummary.map((item) => (
                                                        <div key={`${item.label}-${item.value}`} className="rounded-xl border border-white/70 bg-white/55 px-3 py-2 shadow-[inset_1px_1px_3px_rgba(186,190,204,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.8)]">
                                                            <p className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">{item.label}</p>
                                                            <p className="mt-1 truncate text-sm font-black text-zinc-800">{item.value}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p className="mt-1 text-[11px] font-semibold text-zinc-400">Sin magnitudes capturadas para el tipo de medición seleccionado.</p>
                                            )}
                                        </div>

                                    </div>
                                </CollapsibleSectionBody>
                            </section>

                            <section className={COLLAPSIBLE_SECTION_BASE}>
                                <button type="button" onClick={() => toggleSection('contractual')} className={COLLAPSIBLE_SECTION_HEADER_BUTTON}>
                                    <span className="flex items-center gap-3">
                                        <Coins className="h-4 w-4 text-zinc-500" />
                                        <span>
                                            <span className={COLLAPSIBLE_SECTION_TITLE_CLASS}>4. Información contractual y financiera</span>
                                            <span className={COLLAPSIBLE_SECTION_SUBTITLE_CLASS}>Marco comercial, cliente preliminar y presupuesto de referencia</span>
                                        </span>
                                    </span>
                                    {renderSectionToggleIcon(collapsedSections.contractual)}
                                </button>
                                <CollapsibleSectionBody isCollapsed={collapsedSections.contractual}>
                                    <div className="space-y-4 p-4">
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Modalidad de contratación</Label>
                                                <SearchableSelect
                                                    options={AMBITO_CONTRATACION}
                                                    value={formData.ambito_contratacion}
                                                    onChange={(val) => handleSelectChange('ambito_contratacion', val)}
                                                    readOnly={!isAdmin}
                                                    placeholder="Seleccione modalidad..."
                                                />
                                            </div>
                                            <div className="space-y-2 xl:col-span-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Cliente / contratante</Label>
                                                <Input
                                                    name="cliente_contratante_preliminar"
                                                    value={normalizeVisibleTextValue(formData.cliente_contratante_preliminar)}
                                                    onChange={handleInputChange}
                                                    readOnly={!isAdmin}
                                                    placeholder="Nombre del cliente, promotor o entidad contratante"
                                                    className="h-11 rounded-xl border-zinc-200 font-medium focus:border-[#F39200]"
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Presupuesto base</Label>
                                                <Input
                                                    type="text"
                                                    name="presupuesto_referencial"
                                                    value={formatNumericDisplay(formData.presupuesto_referencial)}
                                                    onChange={(e) => {
                                                        isDirty.current = true;
                                                        setFormData((prev) => ({
                                                            ...prev,
                                                            presupuesto_referencial: parseNumericInput(e.target.value),
                                                        }));
                                                    }}
                                                    readOnly={!isAdmin}
                                                    placeholder="Monto estimado inicial"
                                                    className="h-11 rounded-xl border-zinc-200 font-bold focus:border-[#F39200]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Moneda</Label>
                                                <SearchableSelect
                                                    options={MONEDAS_REFERENCIALES}
                                                    value={formData.moneda}
                                                    onChange={(val) => handleSelectChange('moneda', val)}
                                                    readOnly={!isAdmin}
                                                    placeholder="Seleccione moneda..."
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Fuente de financiamiento</Label>
                                                <SearchableSelect
                                                    options={FUENTES_FINANCIAMIENTO}
                                                    value={formData.fuente_financiamiento}
                                                    onChange={(val) => handleSelectChange('fuente_financiamiento', val)}
                                                    readOnly={!isAdmin}
                                                    placeholder="Seleccione fuente..."
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Número de contrato</Label>
                                                <Input
                                                    name="numero_contrato"
                                                    value={normalizeVisibleTextValue(formData.numero_contrato)}
                                                    onChange={handleInputChange}
                                                    readOnly={!isAdmin}
                                                    placeholder="Ej: CONT-2026-045"
                                                    className="h-11 rounded-xl border-zinc-200 font-medium focus:border-[#F39200]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Fecha de firma de contrato</Label>
                                                <AnimatedDateInput
                                                    ref={contractDateInputRef}
                                                    type="date"
                                                    name="fecha_firma_contrato"
                                                    value={formData.fecha_firma_contrato ? normalizeVisibleTextValue(formData.fecha_firma_contrato).split('T')[0] : ''}
                                                    onChange={handleInputChange}
                                                    readOnly={!isAdmin}
                                                    className="h-11 rounded-xl border-zinc-200 pl-12 pr-4 font-medium focus:border-[#F39200]"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleSectionBody>
                            </section>

                            <section className={COLLAPSIBLE_SECTION_BASE}>
                                <button type="button" onClick={() => toggleSection('schedule')} className={COLLAPSIBLE_SECTION_HEADER_BUTTON}>
                                    <span className="flex items-center gap-3">
                                        <Clock className="h-4 w-4 text-[#F39200]" />
                                        <span>
                                            <span className={COLLAPSIBLE_SECTION_TITLE_CLASS}>5. Cronograma y plazos</span>
                                            <span className={COLLAPSIBLE_SECTION_SUBTITLE_CLASS}>Semilla temporal clásica del proyecto</span>
                                        </span>
                                    </span>
                                    {renderSectionToggleIcon(collapsedSections.schedule)}
                                </button>
                                <CollapsibleSectionBody isCollapsed={collapsedSections.schedule}>
                                    <div className="space-y-4 p-4">
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Fecha Inicio</Label>
                                                <AnimatedDateInput
                                                    ref={startDateInputRef}
                                                    type="date"
                                                    name="fecha_inicio"
                                                    value={formData.fecha_inicio ? formData.fecha_inicio.split('T')[0] : ''}
                                                    onChange={handleInputChange}
                                                    readOnly={!isAdmin}
                                                    className="h-11 rounded-xl border-zinc-200 pl-12 pr-4 font-bold"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Plazo (Días)</Label>
                                                <Input type="text" name="plazo_ejecucion" value={formatNumericDisplay(formData.plazo_ejecucion)} onChange={(e) => {
                                                    isDirty.current = true;
                                                    const val = parseNumericInput(e.target.value);
                                                    setFormData(prev => {
                                                        const newState = { ...prev, plazo_ejecucion: val };
                                                        if (newState.fecha_inicio && val) {
                                                            const start = new Date(newState.fecha_inicio);
                                                            const end = new Date(start);
                                                            end.setDate(start.getDate() + parseInt(val));
                                                            newState.fecha_finalizacion = end.toISOString().split('T')[0];
                                                        }
                                                        return newState;
                                                    });
                                                }} readOnly={!isAdmin} className="h-11 rounded-xl border-zinc-200 font-bold" />
                                            </div>
                                            <div className="space-y-2 md:col-span-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Fecha Estimada de Finalización</Label>
                                                <div className="flex min-h-11 items-center rounded-xl border border-orange-100 bg-orange-50 px-4 text-sm font-black text-[#F39200]">
                                                    {formData.fecha_finalizacion ? new Date(formData.fecha_finalizacion).toLocaleDateString('es-ES', { dateStyle: 'long' }) : '---'}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleSectionBody>
                            </section>

                            <section className={COLLAPSIBLE_SECTION_BASE}>
                                <button type="button" onClick={() => toggleSection('location')} className={COLLAPSIBLE_SECTION_HEADER_BUTTON}>
                                    <span className="flex items-center gap-3">
                                        <MapPin className="h-4 w-4 text-[#136191]" />
                                        <span>
                                            <span className={COLLAPSIBLE_SECTION_TITLE_CLASS}>6. Ubicación y localización</span>
                                            <span className={COLLAPSIBLE_SECTION_SUBTITLE_CLASS}>Dirección y georreferencia asistida</span>
                                        </span>
                                    </span>
                                    {renderSectionToggleIcon(collapsedSections.location)}
                                </button>
                                <CollapsibleSectionBody isCollapsed={collapsedSections.location}>
                                    <div className="space-y-4 p-4">
                                        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">País</Label>
                                                <SearchableSelect options={PAISES} value={formData.pais} onChange={(val) => handleSelectChange('pais', val)} readOnly={!isAdmin} />
                                            </div>
                                            {formData.pais === 'Ecuador' ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Provincia</Label>
                                                        <SearchableSelect options={provincias.map(p => ({ id: p, nombre: p }))} labelKey="nombre" valueKey="id" value={formData.provincia} onChange={(val) => handleSelectChange('provincia', val)} readOnly={!isAdmin} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Cantón</Label>
                                                        <SearchableSelect options={cantones.map(c => ({ id: c, nombre: c }))} labelKey="nombre" valueKey="id" value={formData.canton} onChange={(val) => handleSelectChange('canton', val)} readOnly={!isAdmin} disabled={!formData.provincia} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Ciudad</Label>
                                                        <Input name="ciudad" value={normalizeVisibleTextValue(formData.ciudad)} onChange={handleInputChange} readOnly={!isAdmin} className="h-11 rounded-xl" />
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Estado/Región</Label>
                                                        <Input name="provincia" value={normalizeVisibleTextValue(formData.provincia)} onChange={handleInputChange} readOnly={!isAdmin} className="h-11 rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Municipio/Cantón</Label>
                                                        <Input name="canton" value={normalizeVisibleTextValue(formData.canton)} onChange={handleInputChange} readOnly={!isAdmin} className="h-11 rounded-xl" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Ciudad</Label>
                                                        <Input name="ciudad" value={normalizeVisibleTextValue(formData.ciudad)} onChange={handleInputChange} readOnly={!isAdmin} className="h-11 rounded-xl" />
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Dirección Exacta</Label>
                                            <div className="flex items-center gap-3">
                                                <div className="relative flex-1">
                                                    <Input name="direccion" value={normalizeVisibleTextValue(formData.direccion)} onChange={handleInputChange} readOnly={!isAdmin} className="h-11 rounded-xl pl-10" placeholder="Calle principal y transversal..." />
                                                    <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                                </div>
                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={handleOpenGeoViewerAndLocate}
                                                        disabled={geoSearching}
                                                        title="Abrir georreferenciación en pantalla completa para localizar o ajustar la posición."
                                                        className={`${SOFT_ACTION_BUTTON_BASE} h-11 w-11 rounded-[1rem] text-[#136191] disabled:opacity-60`}
                                                    >
                                                        {geoSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPinned className="h-4 w-4" />}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </CollapsibleSectionBody>
                            </section>

                            <section className={COLLAPSIBLE_SECTION_BASE}>
                                <button type="button" onClick={() => toggleSection('objectives')} className={COLLAPSIBLE_SECTION_HEADER_BUTTON}>
                                    <span className="flex items-center gap-3">
                                        <Target className="h-4 w-4 text-zinc-500" />
                                        <span>
                                            <span className={COLLAPSIBLE_SECTION_TITLE_CLASS}>7. Objetivos, restricciones y supuestos</span>
                                            <span className={COLLAPSIBLE_SECTION_SUBTITLE_CLASS}>Reservado para ampliación controlada del acta</span>
                                        </span>
                                    </span>
                                    {renderSectionToggleIcon(collapsedSections.objectives)}
                                </button>
                                <CollapsibleSectionBody isCollapsed={collapsedSections.objectives}>
                                    <div className="grid gap-4 p-4 xl:grid-cols-3">
                                        {renderIncrementalListCard({
                                            fieldName: 'objetivos_clave',
                                            title: 'Objetivos clave',
                                            subtitle: 'Listado simple e incremental del proyecto',
                                            rows: objectiveRows,
                                            emptyLabel: 'Sin objetivos registrados.',
                                            placeholder: 'Descripción del objetivo...',
                                        })}
                                        {renderIncrementalListCard({
                                            fieldName: 'restricciones_conocidas',
                                            title: 'Restricciones conocidas',
                                            subtitle: 'Listado simple e incremental de restricciones',
                                            rows: restrictionRows,
                                            emptyLabel: 'Sin restricciones registradas.',
                                            placeholder: 'Descripción de la restricción...',
                                        })}
                                        {renderIncrementalListCard({
                                            fieldName: 'supuestos_iniciales',
                                            title: 'Supuestos iniciales',
                                            subtitle: 'Listado simple e incremental de supuestos',
                                            rows: assumptionRows,
                                            emptyLabel: 'Sin supuestos registrados.',
                                            placeholder: 'Descripción del supuesto...',
                                        })}
                                    </div>
                                </CollapsibleSectionBody>
                                </section>
                            </div>
                            <MotionScrollbar targetRef={mainScrollRef} className="right-0" />
                        </div>

                        <div className="relative col-span-12 min-h-0 lg:col-span-4">
                            <div
                                ref={sideScrollRef}
                                className="h-full min-h-0 space-y-4 overflow-y-auto pr-5 giproy-motion-scrollbar-hide"
                            >
                                <section className="sticky top-0 z-20 overflow-hidden rounded-[1.15rem] border border-[#101318] bg-white shadow-[6px_6px_16px_#e1e1e1,-6px_-6px_16px_#ffffff]">
                                <div className={COLLAPSIBLE_SECTION_HEADER_BUTTON}>
                                    <span className="flex items-center gap-3">
                                        <ImageIcon className="h-4 w-4 text-[#F39200]" />
                                        <span>
                                            <span className={COLLAPSIBLE_SECTION_TITLE_CLASS}>8. Documentos e imágenes</span>
                                            <span className={COLLAPSIBLE_SECTION_SUBTITLE_CLASS}>Repositorio visual del proyecto</span>
                                        </span>
                                    </span>
                                </div>
                                </section>

                            <section className="space-y-3 rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[6px_6px_16px_#e1e1e1,-6px_-6px_16px_#ffffff]">
                                <div className="flex items-center justify-between">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500 flex items-center gap-2">
                                        Geo-Referenciación
                                        <span className="px-2 py-1 rounded-full bg-blue-50 text-[#136191] border border-blue-100 text-[8px] font-black uppercase tracking-widest">
                                            Asistida
                                        </span>
                                    </Label>
                                    <div className="flex items-center gap-2">
                                        {hasGeorefCoordinates && (
                                            <span className="text-[8px] font-bold text-zinc-300 tracking-normal">
                                                {Number(formData.latitud).toFixed(4)}, {Number(formData.longitud).toFixed(4)}
                                            </span>
                                        )}
                                        <AppHint content={georefCacheMeta.detail} tone="light" maxWidth={280} widthOffset={20}>
                                            <span className={`inline-flex h-8 items-center gap-1 rounded-xl border px-2 text-[8px] font-black uppercase tracking-[0.14em] ${georefCacheMeta.className}`}>
                                                {georefCacheMeta.icon}
                                                {georefCacheMeta.label}
                                            </span>
                                        </AppHint>
                                        <button
                                            type="button"
                                            onClick={() => setGeoViewerOpen(true)}
                                            className={`${SOFT_ACTION_BUTTON_BASE} h-8 w-8 rounded-xl text-[#136191]`}
                                            title="Ver georreferenciación en pantalla completa"
                                        >
                                            <Maximize2 className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>
                                <div className="relative z-0 h-[350px] overflow-hidden rounded-3xl border border-zinc-100 bg-zinc-50 [&_.leaflet-bottom]:!z-0 [&_.leaflet-container]:!z-0 [&_.leaflet-control]:!z-0 [&_.leaflet-pane]:!z-0 [&_.leaflet-top]:!z-0">
                                    <GeoMapViewport
                                        lat={formData.latitud}
                                        lng={formData.longitud}
                                        zoom={formData.map_zoom || mapZoom || DEFAULT_MAP_CENTER.zoom}
                                        sizeTrigger="inline"
                                        isAdmin={isAdmin}
                                        onLocationChange={handleGeoLocationChange}
                                        onZoomChange={handleGeoZoomChange}
                                    />
                                </div>
                            </section>

                            <section className="space-y-3 rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[6px_6px_16px_#e1e1e1,-6px_-6px_16px_#ffffff]">
                                <div className="flex items-center justify-between gap-3">
                                    <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Imagen Referencial</Label>
                                    <div className="flex items-center gap-2">
                                        {isAdmin && (
                                            <label
                                                className={`${SOFT_ACTION_BUTTON_BASE} h-8 w-8 cursor-pointer rounded-xl text-[#136191]`}
                                                title={formData.imagen_referencial_url ? 'Cambiar imagen referencial' : 'Subir imagen referencial'}
                                            >
                                                <ImageIcon className="h-3.5 w-3.5" />
                                                <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                            </label>
                                        )}
                                        {formData.imagen_referencial_url && (
                                            <button
                                                type="button"
                                                onClick={() => setImageViewerOpen(true)}
                                                className={`${SOFT_ACTION_BUTTON_BASE} h-8 w-8 rounded-xl text-[#136191]`}
                                                title="Ver imagen en pantalla completa"
                                            >
                                                <Maximize2 className="h-3.5 w-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="relative flex aspect-video flex-col items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-zinc-100 bg-zinc-50">
                                    {formData.imagen_referencial_url ? (
                                        <img src={resolveMediaUrl(formData.imagen_referencial_url)} alt="Referencia" className="h-full w-full object-cover" />
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <Briefcase className="h-10 w-10 text-zinc-200" />
                                            {isAdmin && (
                                                <label
                                                    className={`${SOFT_ACTION_BUTTON_BASE} h-8 w-8 cursor-pointer rounded-xl text-[#136191]`}
                                                    title="Subir imagen referencial"
                                                >
                                                    <ImageIcon className="h-3.5 w-3.5" />
                                                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                                </label>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>

                            <section className="space-y-3 rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[6px_6px_16px_#e1e1e1,-6px_-6px_16px_#ffffff]">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">Documentos adjuntos</Label>
                                        <p className="mt-1 text-[11px] font-semibold text-zinc-400">Listado PDF persistido del proyecto.</p>
                                    </div>
                                    {isAdmin && (
                                        <>
                                            <input
                                                ref={documentInputRef}
                                                type="file"
                                                className="hidden"
                                                accept="application/pdf,.pdf"
                                                onChange={handleDocumentUpload}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => documentInputRef.current?.click()}
                                                disabled={documentUploading}
                                                className={`${SOFT_ACTION_BUTTON_BASE} h-10 rounded-[1rem] px-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#136191]`}
                                            >
                                                {documentUploading ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-2 h-3.5 w-3.5" />}
                                                PDF
                                            </button>
                                        </>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {documentsLoading ? (
                                        <div className="flex items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Cargando documentos
                                        </div>
                                    ) : projectDocuments.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-5">
                                            <div className="flex items-center gap-3">
                                                <Paperclip className="h-4 w-4 text-[#136191]" />
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">Sin PDFs adjuntos</p>
                                                    <p className="mt-1 text-[11px] font-semibold text-zinc-400">Carga TDR, planos o estudios en formato PDF.</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        projectDocuments.map((document) => (
                                            <div key={document.id} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex min-w-0 items-start gap-3">
                                                        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-white text-red-600">
                                                            <FileText className="h-4 w-4" />
                                                        </span>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-[11px] font-black uppercase tracking-[0.08em] text-zinc-800">{document.file_name}</p>
                                                            <p className="mt-1 text-[10px] font-semibold text-zinc-400">
                                                                {formatDocumentSize(document.size_bytes)} · {formatDocumentDate(document.created_at)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-1.5">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleViewDocument(document)}
                                                            className={`${SOFT_ACTION_BUTTON_BASE} h-8 w-8 rounded-xl text-[#136191]`}
                                                            title="Ver PDF"
                                                        >
                                                            <Eye className="h-3.5 w-3.5" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDownloadDocument(document)}
                                                            className={`${SOFT_ACTION_BUTTON_BASE} h-8 w-8 rounded-xl text-[#136191]`}
                                                            title="Descargar PDF"
                                                        >
                                                            <Download className="h-3.5 w-3.5" />
                                                        </button>
                                                        {isAdmin && (
                                                            <button
                                                                type="button"
                                                                onClick={() => handleDeleteDocument(document)}
                                                                className={`${SOFT_ACTION_BUTTON_BASE} h-8 w-8 rounded-xl text-red-600`}
                                                                title="Eliminar PDF"
                                                            >
                                                                <Trash2 className="h-3.5 w-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </section>
                            </div>
                            <MotionScrollbar targetRef={sideScrollRef} className="right-0" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {imageViewerOpen && formData.imagen_referencial_url && (
                <div className="fixed inset-0 z-[135] flex items-center justify-center bg-zinc-900/45 px-4 py-6 backdrop-blur-[2px]">
                    <div className="flex h-full max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[1.7rem] border border-[#ececec] bg-[#f7f7f5] shadow-[12px_12px_30px_rgba(15,23,42,0.28),-10px_-10px_26px_rgba(255,255,255,0.2)]">
                        <div className="flex items-center justify-between gap-4 border-b border-[#101318] bg-[#111318] px-6 py-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[#F39200]/25 bg-[#F39200]/10 text-[#F39200]">
                                    <ImageIcon className="h-[19px] w-[19px]" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="truncate text-base font-black uppercase tracking-tight text-[#F39200]">Imagen referencial</h3>
                                    <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.18em] text-white/48">{projectName || 'Proyecto'}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setImageViewerOpen(false)}
                                className={APP_MODAL_CLOSE_BUTTON_CLASS}
                                aria-label="Cerrar visor de imagen"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="min-h-0 flex-1 bg-[#f7f7f5] p-6">
                            <div className="flex h-full min-h-0 items-center justify-center overflow-hidden rounded-[1.25rem] border border-[#ececec] bg-white p-4 shadow-[6px_6px_16px_#e1e1e1,-6px_-6px_16px_#ffffff]">
                                <img
                                    src={resolveMediaUrl(formData.imagen_referencial_url)}
                                    alt="Imagen referencial del proyecto"
                                    className="h-full w-full object-contain"
                                />
                            </div>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-white/72 px-6 py-4">
                                <label className={`${SOFT_ACTION_BUTTON_BASE} h-11 cursor-pointer rounded-xl px-5 text-[10px] font-black uppercase tracking-widest text-[#136191]`}>
                                    Cambiar imagen
                                    <input type="file" className="hidden" onChange={handleImageUpload} accept="image/*" />
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {geoViewerOpen && (
                <div className="fixed inset-0 z-[136] flex items-center justify-center bg-zinc-900/45 px-4 py-6 backdrop-blur-[2px]">
                    <div className="flex h-full max-h-[92vh] w-full max-w-7xl flex-col overflow-hidden rounded-[1.7rem] border border-[#ececec] bg-[#f7f7f5] shadow-[12px_12px_30px_rgba(15,23,42,0.28),-10px_-10px_26px_rgba(255,255,255,0.2)]">
                        <div className="flex items-center justify-between gap-4 border-b border-[#101318] bg-[#111318] px-6 py-5">
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[1rem] border border-[#136191]/25 bg-[#136191]/10 text-[#136191]">
                                    <MapPinned className="h-[19px] w-[19px]" />
                                </span>
                                <div className="min-w-0">
                                    <h3 className="truncate text-base font-black uppercase tracking-tight text-[#69C7FF]">Geo-referenciación</h3>
                                    <p className="mt-1 truncate text-[10px] font-black uppercase tracking-[0.18em] text-white/48">Ubicación del proyecto</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setGeoViewerOpen(false)}
                                className={APP_MODAL_CLOSE_BUTTON_CLASS}
                                aria-label="Cerrar visor de georreferenciación"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="grid min-h-0 flex-1 gap-4 bg-[#f7f7f5] p-6 lg:grid-cols-[1fr_320px]">
                            <div className="relative min-h-[420px] overflow-hidden rounded-[1.25rem] border border-[#ececec] bg-zinc-100 shadow-[6px_6px_16px_#e1e1e1,-6px_-6px_16px_#ffffff] [&_.leaflet-container]:!z-0">
                                <GeoMapViewport
                                    fullscreen
                                    lat={formData.latitud}
                                    lng={formData.longitud}
                                    zoom={formData.map_zoom || mapZoom || DEFAULT_MAP_CENTER.zoom}
                                    sizeTrigger={geoViewerOpen ? 'fullscreen-open' : 'fullscreen-closed'}
                                    isAdmin={isAdmin}
                                    onLocationChange={handleGeoLocationChange}
                                    onZoomChange={handleGeoZoomChange}
                                />
                            </div>
                            <aside className="space-y-4 rounded-[1.25rem] border border-[#ececec] bg-white p-5 shadow-[6px_6px_16px_#e1e1e1,-6px_-6px_16px_#ffffff]">
                                <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Coordenadas actuales</p>
                                    <p className="mt-2 text-sm font-black text-zinc-900">
                                        {formData.latitud ? `${formData.latitud.toFixed(6)}, ${formData.longitud.toFixed(6)}` : 'Sin coordenadas'}
                                    </p>
                                    <p className="mt-1 text-[10px] font-semibold text-zinc-400">Zoom {formData.map_zoom || mapZoom || 13}</p>
                                </div>
                                {geoHint && (
                                    <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Resultado de localización</p>
                                        <p className="mt-1 text-[11px] font-medium text-blue-900">{geoHint}</p>
                                    </div>
                                )}
                                <p className="text-[11px] font-semibold leading-5 text-zinc-500">
                                    {isAdmin
                                        ? 'Haz clic sobre el mapa para ajustar el punto exacto. El zoom y la posición se guardan automáticamente dentro de Datos de Proyecto.'
                                        : 'Vista ampliada de la ubicación registrada para este proyecto.'}
                                </p>
                            </aside>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center justify-end gap-3 border-t border-zinc-100 bg-white/72 px-6 py-4">
                                <div className="relative min-w-[240px] max-w-[620px] flex-1">
                                    <Input
                                        value={geoSearchQuery}
                                        onChange={(event) => setGeoSearchQuery(event.target.value)}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter') {
                                                event.preventDefault();
                                                handleGeocodeAddress();
                                            }
                                        }}
                                        disabled={geoSearching}
                                        placeholder="Buscar por calle principal e intersección..."
                                        className="h-11 rounded-xl border-zinc-200 bg-white pl-10 pr-3 text-sm font-bold text-zinc-700 shadow-[inset_2px_2px_6px_#d8d8d8,inset_-2px_-2px_6px_#ffffff]"
                                    />
                                    <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => handleGeocodeAddress()}
                                    disabled={geoSearching}
                                    className={`${SOFT_ACTION_BUTTON_BASE} h-11 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest text-[#136191]`}
                                >
                                    {geoSearching ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <MapPinned className="mr-2 h-3.5 w-3.5" />}
                                    Localizar
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {pdfPreviewDocument && (
                <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/55 px-4 py-6">
                    <div className="flex h-full max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 bg-[#f2f2f0] px-5 py-4">
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Visor interno PDF</p>
                                <h3 className="truncate text-sm font-black uppercase tracking-tight text-zinc-900">{pdfPreviewDocument.file_name}</h3>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleDownloadDocument(pdfPreviewDocument)}
                                    className={`${SOFT_ACTION_BUTTON_BASE} h-10 rounded-[1rem] px-4 text-[9px] font-black uppercase tracking-[0.18em] text-[#136191]`}
                                >
                                    <Download className="mr-2 h-3.5 w-3.5" />
                                    Descargar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleClosePdfPreview}
                                    className={APP_MODAL_CLOSE_BUTTON_CLASS}
                                    aria-label="Cerrar visor PDF"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                        <div className="relative min-h-0 flex-1 bg-zinc-100">
                            {pdfPreviewLoading ? (
                                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#F39200]" />
                                    Preparando visor
                                </div>
                            ) : pdfPreviewUrl ? (
                                <iframe
                                    title={`Visor PDF ${pdfPreviewDocument.file_name}`}
                                    src={pdfPreviewUrl}
                                    className="h-full w-full"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-zinc-500">
                                    No se pudo preparar la vista previa.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <CommonReportPreviewModal
                isOpen={showReportPreview}
                onClose={() => setShowReportPreview(false)}
                preview={reportPreview}
                onExportExcel={() => handleExportReport('xlsx')}
                onExportPdf={() => handleExportReport('pdf')}
                onExportPdfFromExcel={() => handleExportReport('pdf_excel')}
                exporting={generatingReport}
            />

            <ReportGenerationModal
                isOpen={generatingReport}
                title="Generando reporte"
                message="Estamos preparando el acta de constitución del proyecto. La descarga comenzará automáticamente cuando esté lista."
            />
        </div>
    );
};

export default DatosProyecto;

