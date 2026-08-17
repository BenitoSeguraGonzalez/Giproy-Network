import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, ChevronDown, CreditCard, Eye, FileSpreadsheet, Image as ImageIcon, MapPin, Package, PencilLine, Plus, Power, ShoppingBag, Tags, Trash2, UploadCloud, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { maestrosApi } from '../api/maestros';
import marketplaceApi from '../api/marketplace';
import {
    MarketplaceEmptyState,
    MarketplaceSectionCard,
    MarketplaceShell,
} from '../components/marketplace/MarketplaceVisualSystem';
import ProjectHeaderActionButton from '../components/projects/ProjectHeaderActionButton';
import { ProjectSectionIconButton } from '../components/projects/ProjectSectionReportButton';
import SearchableSelect from '../components/ui/searchable-select';
import { AppModalBody, AppModalFooter, AppModalHeader, AppModalShell } from '../components/ui/app-modal';
import MotionScrollbar from '../components/ui/MotionScrollbar';
import { AuthContext } from '../context/AuthContext';
import { appAlert, appConfirm } from '../utils/appDialog';
import { resolveMarketplacePaymentMethodLabel, resolveMarketplacePaymentStatusLabel, resolveMarketplaceRefundResolutionLabel } from '../utils/marketplacePaymentLabels';
import { normalizeSearchToken } from '../utils/normalizeSearch';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import AnimatedDateInput from '../components/ui/AnimatedDateInput';
import AppHint from '../components/ui/AppHint';

const EMPTY_FORM = {
    nombre: '',
    descripcion: '',
    visibility_scope: 'all',
    sort_order: 0,
    activa: true,
};

const EMPTY_PRODUCT_FORM = {
    titulo: '',
    resumen: '',
    descripcion_larga: '',
    descripcion_completa: '',
    descuento_promocion: '',
    imagen_relevante_url: '',
    precio: '',
    fecha_inicio_publicacion: '',
    fecha_fin_publicacion: '',
    category_id: '',
    activo: true,
};

const EMPTY_PORTAL_FORM = {
    codigo: '',
    titulo: '',
    descripcion_corta: '',
    descripcion_larga: '',
    descripcion_completa: '',
    imagen_relevante_url: '',
    precio_con_iva: '',
    fecha_inicio_publicacion: '',
    fecha_fin_publicacion: '',
    descuento_promocion: '',
    creador: '',
    activo: false,
    pais: 'Ecuador',
    provincia: '',
    canton: '',
    direccion: '',
    codigo_licitacion: '',
    precio_licitacion: '',
    fecha_inicio_licitacion: '',
    fecha_fin_licitacion: '',
    template_version: '',
    delivery_mode: 'excel_and_project',
    import_source_kind: 'manual',
    import_source_reference: '',
    import_notes: '',
    processing_status: 'draft',
    import_analysis: null,
};

const PORTAL_DELIVERY_MODE_OPTIONS = [
    { value: 'excel_only', label: 'Solo Excel', helper: 'Entrega técnica descargable sin GIPROY preparado.' },
    { value: 'project_only', label: 'Solo GIPROY', helper: 'Entrega directa como GIPROY preparado en el sistema comprador.' },
    { value: 'excel_and_project', label: 'Excel + GIPROY', helper: 'Modalidad híbrida: exportación técnica y GIPROY listo para trabajo.' },
];

const PORTAL_IMPORT_SOURCE_OPTIONS = [
    { value: 'manual', label: 'Configuración manual', helper: 'La estructura se define manualmente desde el artículo.' },
    { value: 'archivo_base', label: 'Archivo base', helper: 'La preparación se apoya en una referencia técnica identificable.' },
    { value: 'plantilla_integrada', label: 'Plantilla integrada', helper: 'La entrega se genera desde plantilla controlada por Sistema.' },
];

const PORTAL_PROCESSING_LABELS = {
    draft: 'Borrador técnico',
    ready: 'Listo para entregar',
    error: 'Configuración inconsistente',
};

const ADMIN_PRODUCT_TYPE_OPTIONS = [
    {
        value: 'licencia',
        label: 'Licencias',
        helper: 'Productos comerciales del sistema orientados a licenciamiento.',
    },
    {
        value: 'apu',
        label: 'APUs',
        helper: 'Productos de tipo APU. Su flujo posterior podrá especializarse.',
    },
    {
        value: 'base_maestra',
        label: 'Bases Maestras',
        helper: 'Productos de tipo base maestra para catálogo técnico o comercial.',
    },
    {
        value: 'proyecto',
        label: 'Proyectos',
        helper: 'Productos orientados a proyectos completos dentro del marketplace.',
    },
    {
        value: 'portal_compras_publicas',
        label: 'Portal de compras públicas',
        helper: 'Productos ligados al portal de compras públicas y sus servicios asociados.',
    },
];

const SYSTEM_ONLY_ADMIN_PRODUCT_TYPES = new Set(['portal_compras_publicas']);

const PRODUCT_TYPE_LABELS = {
    licencia: 'Licencias',
    apu: 'APUs',
    base_maestra: 'Bases Maestras',
    proyecto: 'Proyectos',
    portal_compras_publicas: 'Portal de compras públicas',
    addon: 'Actualizaciones',
    adicional: 'Adicionales',
};

const ADMIN_SELECT_CLASS = 'h-11 w-full appearance-none rounded-2xl border border-zinc-200 bg-white bg-[length:0_0] bg-no-repeat px-4 pr-10 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#136191]';

const FIXED_MARKETPLACE_CATEGORY_SLUGS = [
    'tienda-licencias',
    'tienda-apus',
    'tienda-bases-maestras',
    'tienda-proyectos',
    'tienda-portal-compras-publicas',
];

const SCOPE_LABELS = {
    all: 'Todos',
    system: 'Sistema',
    users: 'Usuarios',
};

const ADMIN_PANEL_OPTIONS = [
    {
        key: 'licenses',
        eyebrow: 'Submódulo activo',
        title: 'Licencias SaaS',
        description: 'Gobierno comercial de Estándar, Profesional y Empresarial en sus ciclos mensual y anual.',
        cta: 'Abrir submódulo',
        icon: CreditCard,
        tone: {
            iconWrap: 'border-emerald-200 bg-emerald-50 text-emerald-600',
        },
    },
    {
        key: 'categories',
        eyebrow: 'Submódulo activo',
        title: 'Categorías',
        description: 'Definición, edición y borrado de categorías base para la estructura comercial de Tienda.',
        cta: 'Abrir submódulo',
        icon: Tags,
        tone: {
            iconWrap: 'border-violet-200 bg-violet-50 text-violet-600',
        },
    },
    {
        key: 'products',
        eyebrow: 'Submódulo activo',
        title: 'Productos',
        description: 'Listado global de productos, edición, activación y creación administrativa según tipo.',
        cta: 'Abrir submódulo',
        icon: Package,
        tone: {
            iconWrap: 'border-orange-200 bg-orange-50 text-[#F39200]',
        },
    },
    {
        key: 'payment_methods',
        eyebrow: 'Submódulo activo',
        title: 'Formas de pago',
        description: 'Configuración operativa de métodos, readiness y activación comercial del checkout.',
        cta: 'Abrir submódulo',
        icon: CreditCard,
        tone: {
            iconWrap: 'border-sky-200 bg-sky-50 text-[#136191]',
        },
    },
    {
        key: 'system_sales',
        eyebrow: 'Submódulo activo',
        title: 'Ventas Sistema',
        description: 'Seguimiento administrativo de pedidos, especialmente transferencias pendientes de validación.',
        cta: 'Abrir submódulo',
        icon: ShoppingBag,
        tone: {
            iconWrap: 'border-orange-200 bg-orange-50 text-[#F39200]',
        },
    },
];

const PAYMENT_METHOD_READINESS_STYLES = {
    incomplete: 'border-amber-200 bg-amber-50 text-amber-700',
    sandbox_ready: 'border-sky-200 bg-sky-50 text-sky-700',
    production_ready: 'border-emerald-200 bg-emerald-50 text-emerald-700',
};

const PAYMENT_METHOD_READINESS_LABELS = {
    incomplete: 'Incompleto',
    sandbox_ready: 'Listo en sandbox',
    production_ready: 'Listo en producción',
};

const PAYMENT_METHOD_FIELD_GROUPS = {
    payphone: [
        { key: 'token', label: 'Token', type: 'text' },
        { key: 'store_id', label: 'Store ID', type: 'text' },
        { key: 'return_url', label: 'Return URL', type: 'text' },
        { key: 'support_email', label: 'Email soporte', type: 'text' },
        { key: 'public_text', label: 'Texto visible', type: 'textarea' },
    ],
    paypal: [
        { key: 'client_id', label: 'Client ID', type: 'text' },
        { key: 'client_secret', label: 'Client Secret', type: 'text' },
        { key: 'webhook_id', label: 'Webhook ID', type: 'text' },
        { key: 'support_email', label: 'Email soporte', type: 'text' },
        { key: 'public_text', label: 'Texto visible', type: 'textarea' },
    ],
    bank_transfer: [
        { key: 'bank_name', label: 'Banco', type: 'text' },
        { key: 'account_holder', label: 'Titular', type: 'text' },
        { key: 'account_number', label: 'Cuenta', type: 'text' },
        { key: 'iban_cci', label: 'CCI / IBAN', type: 'text' },
        { key: 'support_email', label: 'Email soporte', type: 'text' },
        { key: 'instructions', label: 'Instrucciones', type: 'textarea' },
        { key: 'public_text', label: 'Texto visible', type: 'textarea' },
    ],
};

const normalizeCompanyName = (value) => normalizeSearchToken(value || '');

const computePortalProcessingStatus = (portalDraft) => {
    const deliveryMode = String(portalDraft.delivery_mode || 'excel_and_project').trim();
    const hasReference = Boolean(String(portalDraft.import_source_reference || '').trim());
    const hasKind = Boolean(String(portalDraft.import_source_kind || '').trim());
    if (!hasKind || !hasReference) return 'draft';
    if (!['excel_only', 'project_only', 'excel_and_project'].includes(deliveryMode)) return 'error';
    return 'ready';
};

const buildPortalTemplateVersion = (portalDraft) => {
    const existing = String(portalDraft.template_version || '').trim();
    if (existing) return existing;
    const code = String(portalDraft.codigo || 'PCP').trim() || 'PCP';
    return `${code}-V1`;
};

const normalizePortalLicitacionInput = (rawValue) => {
    const rawText = String(rawValue || '').trim();
    if (!rawText) return '';

    const compact = rawText.replace(/\s+/g, '').replaceAll("'", '');
    const hasComma = compact.includes(',');
    const hasDot = compact.includes('.');

    if (hasComma && hasDot) {
        const decimalSeparator = compact.lastIndexOf('.') > compact.lastIndexOf(',') ? '.' : ',';
        const thousandsSeparator = decimalSeparator === '.' ? ',' : '.';
        return compact.replaceAll(thousandsSeparator, '').replace(decimalSeparator, '.');
    }

    if (hasComma) {
        const parts = compact.split(',');
        const lastPart = parts.at(-1) || '';
        if (parts.length === 2 && lastPart.length <= 2) {
            return `${parts[0]}.${lastPart}`;
        }
        return compact.replaceAll(',', '');
    }

    if (hasDot) {
        const parts = compact.split('.');
        const lastPart = parts.at(-1) || '';
        if (parts.length === 2 && lastPart.length <= 2) {
            return compact;
        }
        return compact.replaceAll('.', '');
    }

    return compact;
};

const normalizePortalDateInput = (rawValue) => {
    const rawText = String(rawValue || '').trim();
    if (!rawText) return '';

    const compact = rawText.replace(/\s+/g, ' ');
    const firstToken = compact.split(/[T ]/)[0] || '';
    if (!/^\d{4}-\d{2}-\d{2}$/.test(firstToken)) return null;

    const [year, month, day] = firstToken.split('-').map(Number);
    const parsed = new Date(Date.UTC(year, month - 1, day));
    if (Number.isNaN(parsed.getTime())) return null;
    if (
        parsed.getUTCFullYear() !== year
        || parsed.getUTCMonth() + 1 !== month
        || parsed.getUTCDate() !== day
    ) {
        return null;
    }

    return firstToken;
};

const normalizePortalTechnicalReference = (rawValue) => String(rawValue || '')
    .replace(/[\t\r\n]+/g, ' ')
    .trim();

const handlePortalDateFieldChange = (fieldName, value, setPortalForm) => {
    const normalized = normalizePortalDateInput(value);
    if (normalized === null) return;
    setPortalForm((current) => ({
        ...current,
        [fieldName]: normalized,
        ...(fieldName === 'fecha_fin_licitacion' ? { fecha_fin_publicacion: normalized } : {}),
    }));
};

const handlePortalDateFieldPaste = (event, fieldName, setPortalForm) => {
    const rawText = event.clipboardData?.getData('text');
    if (typeof rawText !== 'string') return;

    const normalized = normalizePortalDateInput(rawText);
    if (normalized === null) return;

    event.preventDefault();
    setPortalForm((current) => ({
        ...current,
        [fieldName]: normalized,
        ...(fieldName === 'fecha_fin_licitacion' ? { fecha_fin_publicacion: normalized } : {}),
    }));
};

const handlePortalTechnicalReferencePaste = (event, setPortalForm) => {
    const rawText = event.clipboardData?.getData('text');
    if (typeof rawText !== 'string') return;

    event.preventDefault();
    const normalized = normalizePortalTechnicalReference(rawText);
    setPortalForm((current) => ({
        ...current,
        codigo_licitacion: normalized,
        import_source_reference: normalized,
    }));
};

const parsePortalLicitacionAmount = (rawValue) => {
    const normalized = normalizePortalLicitacionInput(rawValue);
    if (!normalized) return 0;
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
};

const resolvePortalCommercialPrice = (licitacionAmount) => {
    if (licitacionAmount <= 100000) return 11.5;
    if (licitacionAmount <= 300000) return 35.5;
    if (licitacionAmount <= 1000000) return 115;
    return 345;
};

const PORTAL_REQUIRED_FIELD_RULES = [
    { key: 'titulo', label: 'Título comercial', isMissing: (draft) => !String(draft.titulo || '').trim() },
    { key: 'descripcion_corta', label: 'Descripción corta', isMissing: (draft) => !String(draft.descripcion_corta || '').trim() },
    { key: 'descripcion_larga', label: 'Descripción larga', isMissing: (draft) => !String(draft.descripcion_larga || '').trim() },
    { key: 'descripcion_completa', label: 'Descripción completa', isMissing: (draft) => !String(draft.descripcion_completa || '').trim() },
    { key: 'fecha_inicio_publicacion', label: 'Inicio de publicación', isMissing: (draft) => !String(draft.fecha_inicio_publicacion || '').trim() },
    { key: 'fecha_fin_publicacion', label: 'Fin de publicación', isMissing: (draft) => !String(draft.fecha_fin_publicacion || '').trim() },
    { key: 'pais', label: 'País', isMissing: (draft) => !String(draft.pais || '').trim() },
    { key: 'provincia', label: 'Provincia', isMissing: (draft) => !String(draft.provincia || '').trim() },
    { key: 'precio_licitacion', label: 'Precio de licitación', isMissing: (draft) => !String(draft.precio_licitacion || '').trim() },
    { key: 'fecha_inicio_licitacion', label: 'F. de publicación licitación', isMissing: (draft) => !String(draft.fecha_inicio_licitacion || '').trim() },
    { key: 'fecha_fin_licitacion', label: 'F. entrega propuesta', isMissing: (draft) => !String(draft.fecha_fin_licitacion || '').trim() },
    { key: 'import_source_kind', label: 'Origen técnico', isMissing: (draft) => !String(draft.import_source_kind || '').trim() },
    { key: 'import_source_reference', label: 'Código / referencia técnica', isMissing: (draft) => !String(draft.import_source_reference || '').trim() },
    {
        key: 'import_analysis',
        label: 'Análisis del archivo base',
        isMissing: (draft) => String(draft.import_source_kind || '').trim() === 'archivo_base' && !draft.import_analysis,
    },
];

const getPortalActivationReadiness = (portalDraft) => {
    const missingDescriptors = PORTAL_REQUIRED_FIELD_RULES
        .filter((rule) => rule.isMissing(portalDraft))
        .map(({ key, label }) => ({ key, label }));

    return {
        ready: missingDescriptors.length === 0,
        missingFields: missingDescriptors.map((descriptor) => descriptor.label),
        missingDescriptors,
        firstMissingKey: missingDescriptors[0]?.key || null,
    };
};

const AdminHeaderToggle = ({
    label,
    helper,
    checked,
    onChange,
    activeLabel = 'Activo',
    inactiveLabel = 'Inactivo',
    compact = false,
}) => (
    <div className={`rounded-xl border ${compact ? 'px-2.5 py-2' : 'px-3 py-2'} ${checked ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-200 bg-zinc-50'}`}>
        <p className={`${compact ? 'text-[8px]' : 'text-[9px]'} font-black uppercase tracking-[0.18em] text-zinc-400`}>{label}</p>
        <div className={`${compact ? 'mt-1' : 'mt-1.5'} flex items-center gap-3`}>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={onChange}
                className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition-colors ${
                    checked ? 'border-emerald-500 bg-emerald-500' : 'border-zinc-300 bg-zinc-300'
                }`}
            >
                <span
                    className={`inline-block h-4.5 w-4.5 rounded-full bg-white shadow-sm transition-transform ${
                        checked ? 'translate-x-5' : 'translate-x-1'
                    }`}
                />
            </button>
            <div className="min-w-0">
                <p className={`${compact ? 'text-[11px]' : 'text-xs'} font-black ${checked ? 'text-emerald-700' : 'text-zinc-700'}`}>
                    {checked ? activeLabel : inactiveLabel}
                </p>
                {helper && !compact ? (
                    <p className="text-[10px] font-medium leading-tight text-zinc-500">
                        {helper}
                    </p>
                ) : null}
            </div>
        </div>
    </div>
);

const ADMIN_MODAL_SURFACE = '#f7f7f5';
const ADMIN_MODAL_PANEL_CLASS = 'max-h-[92dvh] flex flex-col bg-[#f7f7f5]';
const ADMIN_MODAL_BODY_CLASS = 'min-h-0 flex-1 overflow-hidden bg-[#f7f7f5] p-5';
const ADMIN_MODAL_HEADER_PROPS = {
    surfaceColor: '#1A1A1A',
    titleClassName: 'text-white',
    subtitleClassName: 'text-zinc-300',
    closeButtonClassName: 'inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] border border-white/10 bg-white/8 text-zinc-200 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-colors hover:border-white/25 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200]/35',
};
const ADMIN_SECTION_CLASS = 'rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]';
const ADMIN_LABEL_CLASS = 'text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500';
const ADMIN_FIELD_CLASS = 'h-10 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#136191]';
const ADMIN_TEXTAREA_CLASS = 'w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 outline-none transition-colors focus:border-[#136191]';

const ADMIN_ACCENT_STYLES = {
    blue: {
        icon: 'text-[#136191]',
        wrap: 'border-sky-200 bg-sky-50',
    },
    orange: {
        icon: 'text-[#F39200]',
        wrap: 'border-orange-200 bg-orange-50',
    },
    emerald: {
        icon: 'text-emerald-600',
        wrap: 'border-emerald-200 bg-emerald-50',
    },
    purple: {
        icon: 'text-purple-500',
        wrap: 'border-purple-200 bg-purple-50',
    },
};

const AdminModalSection = ({ eyebrow, title, icon: Icon, accent = 'blue', children, className = '' }) => {
    const accentStyle = ADMIN_ACCENT_STYLES[accent] || ADMIN_ACCENT_STYLES.blue;

    return (
        <section className={`${ADMIN_SECTION_CLASS} ${className}`}>
            {(eyebrow || title || Icon) ? (
                <div className="mb-4 flex items-center gap-2">
                    {Icon ? (
                        <span className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] border ${accentStyle.wrap} shadow-[3px_3px_8px_#e0e0dc,-3px_-3px_8px_#ffffff]`}>
                            <Icon className={`h-4 w-4 ${accentStyle.icon}`} />
                        </span>
                    ) : null}
                    <div className="min-w-0">
                        {eyebrow ? (
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">{eyebrow}</p>
                        ) : null}
                        {title ? (
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700">{title}</p>
                        ) : null}
                    </div>
                </div>
            ) : null}
            {children}
        </section>
    );
};

const AdminModalFooterButton = ({
    children,
    icon: Icon,
    variant = 'secondary',
    className = '',
    ...props
}) => {
    const variantClass = {
        secondary: 'border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700',
        info: 'border border-[#d9e5ef] bg-white text-[#136191] hover:border-[#136191] hover:bg-[#EAF4FB]',
        primary: 'border border-[#136191] bg-[#136191] text-white shadow-[4px_4px_12px_#d8d8d8,-4px_-4px_12px_#ffffff] hover:border-[#0f4f78] hover:bg-[#0f4f78]',
        dark: 'border border-zinc-900 bg-zinc-900 text-white shadow-[4px_4px_12px_#d8d8d8,-4px_-4px_12px_#ffffff] hover:border-[#136191] hover:bg-[#136191]',
        danger: 'border border-red-200 bg-white text-red-700 hover:border-red-400 hover:bg-red-50',
    }[variant] || '';

    return (
        <button
            type="button"
            className={`inline-flex h-11 items-center justify-center gap-2 rounded-xl px-5 text-[10px] font-black uppercase tracking-[0.18em] transition-[background-color,border-color,color,box-shadow,filter] duration-200 active:shadow-[inset_2px_2px_8px_#d0d0d0,inset_-2px_-2px_8px_#ffffff] disabled:cursor-not-allowed disabled:border-zinc-200 disabled:bg-zinc-300 disabled:text-white disabled:shadow-none ${variantClass} ${className}`}
            {...props}
        >
            {Icon ? <Icon className="h-4 w-4 shrink-0" /> : null}
            {children}
        </button>
    );
};

const PortalFieldLabel = ({ children, hint }) => {
    const labelClass = 'inline-flex items-center text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500';
    if (!hint) {
        return <span className={labelClass}>{children}</span>;
    }

    return (
        <AppHint
            as="span"
            tone="light"
            maxWidth={288}
            minWidth={220}
            widthOffset={48}
            zIndex={150}
            followCursor={false}
            hoverDelay={420}
            hideOnMove
            triggerClassName="inline-flex"
            className={`${labelClass} cursor-help`}
            content={(
                <span className="block">
                    <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">GIPROY</span>
                    <span className="mt-1 block text-[11px] font-semibold normal-case leading-snug tracking-normal text-zinc-700">{hint}</span>
                </span>
            )}
        >
            {children}
        </AppHint>
    );
};

const PORTAL_FIELD_HINTS = {
    titulo: 'Descripción superior en el card de la tienda. Es el nombre comercial que verá el comprador.',
    descripcion_corta: 'Resumen visible en la tarjeta de Tienda. Sirve para entender el alcance sin abrir el detalle.',
    descripcion_larga: 'Texto principal dentro de la ficha del producto. Explica el servicio y el valor entregado.',
    descripcion_completa: 'Detalle ampliado para condiciones, alcance técnico y notas comerciales del portal.',
    imagen_relevante_url: 'Imagen de portada del producto en Tienda. Si no cargas una imagen local, GIPROY usa la imagen por defecto del portal.',
    precio_comercial: 'Valor de venta calculado por GIPROY según el monto de la licitación. Tramos: hasta 100.000 USD = 11.50; hasta 300.000 USD = 35.50; hasta 1.000.000 USD = 115.00; superior = 345.00.',
    descuento_promocion: 'Mensaje comercial opcional para mostrar descuentos, vigencias o condiciones promocionales.',
    fecha_inicio_publicacion: 'Fecha desde la que el producto puede aparecer publicado en Tienda.',
    fecha_fin_publicacion: 'Fecha hasta la que el producto permanece visible en Tienda.',
    pais: 'País donde aplica la oportunidad de contratación pública.',
    provincia: 'Provincia o región de referencia para ubicar la licitación.',
    canton: 'Cantón o ciudad de referencia de la licitación.',
    direccion: 'Ubicación textual adicional para orientar al comprador.',
    precio_licitacion: 'Monto base de la licitación. GIPROY lo usa para calcular el precio comercial por tramos automáticos.',
    fecha_inicio_licitacion: 'Inicio del periodo operativo de la licitación pública.',
    fecha_fin_licitacion: 'Cierre del periodo operativo de la licitación pública.',
    import_source_kind: 'Define si el descriptor técnico se captura manualmente o se deriva desde un archivo base de licitación.',
    import_source_reference: 'Código o referencia técnica que identifica la fuente oficial de la licitación.',
    import_analysis: 'Análisis técnico generado desde el archivo base. Solo es obligatorio cuando el origen técnico es archivo base.',
    delivery_mode: 'Define si la compra entrega Excel, proyecto GIPROY o ambas salidas.',
};

const PortalRequirementSemaphoreItem = ({ item, onSelect }) => {
    const handleActivate = () => {
        onSelect?.(item.key);
    };

    return (
        <AppHint
            as="span"
            tone="light"
            maxWidth={288}
            minWidth={220}
            widthOffset={36}
            zIndex={150}
            followCursor={false}
            hoverDelay={420}
            hideOnMove
            triggerClassName="block"
            className="block"
            content={(
                <span className="block">
                    <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">GIPROY</span>
                    <span className="mt-1 block text-[11px] font-semibold normal-case leading-snug tracking-normal text-zinc-700">{item.hint}</span>
                </span>
            )}
        >
            <button
                type="button"
                aria-label={`${item.ready ? 'Revisar' : 'Completar'} requisito: ${item.label}`}
                onClick={handleActivate}
                className={`group flex min-h-[42px] w-full cursor-pointer items-center gap-2 rounded-[0.85rem] border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200]/20 ${
                    item.ready
                        ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300'
                        : 'border-amber-200 bg-amber-50 hover:border-[#F39200]'
                }`}>
                <span className={`relative flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    item.ready ? 'border-emerald-500 bg-emerald-500' : 'border-amber-400 bg-amber-100'
                }`}>
                    {item.ready ? <Check className="h-2.5 w-2.5 text-white" /> : <span className="h-1.5 w-1.5 rounded-full bg-[#F39200]" />}
                </span>
                <span className="min-w-0 flex-1">
                    <span className={`block truncate text-[8px] font-black uppercase tracking-[0.12em] ${
                        item.ready ? 'text-emerald-800' : 'text-amber-900'
                    }`}>
                        {item.label}
                    </span>
                    <span className={`mt-0.5 block text-[8px] font-black uppercase tracking-[0.12em] ${
                        item.ready ? 'text-emerald-600' : 'text-amber-600'
                    }`}>
                        {item.ready ? 'Activo' : 'Pendiente'}
                    </span>
                </span>
            </button>
        </AppHint>
    );
};

const PortalRequirementSemaphoreGrid = ({ draft, onSelectRequirement }) => {
    const states = PORTAL_REQUIRED_FIELD_RULES.map((rule) => ({
        key: rule.key,
        label: rule.label,
        ready: !rule.isMissing(draft),
        hint: PORTAL_FIELD_HINTS[rule.key] || `Descriptor obligatorio para poder activar el portal: ${rule.label}.`,
    }));
    const completedCount = states.filter((item) => item.ready).length;
    const totalCount = states.length;

    return (
        <div className="rounded-[1.2rem] border border-zinc-200 bg-white p-3 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]">
            <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Semáforos de activación</p>
                    <p className="mt-1 text-[11px] font-semibold leading-snug text-zinc-600">
                        {completedCount}/{totalCount} descriptores completos. El producto puede guardarse, pero solo se publica cuando todos estén activos.
                    </p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[8px] font-black uppercase tracking-[0.14em] ${
                    completedCount === totalCount
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        : 'border-amber-200 bg-amber-50 text-amber-700'
                }`}>
                    {completedCount === totalCount ? 'Activable' : 'Borrador'}
                </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3">
                {states.map((item) => (
                    <PortalRequirementSemaphoreItem key={item.key} item={item} onSelect={onSelectRequirement} />
                ))}
            </div>
        </div>
    );
};

const isInvalidDateRange = (start, end) => {
    if (!start || !end) return false;
    return new Date(`${end}T00:00:00`).getTime() < new Date(`${start}T00:00:00`).getTime();
};

const getProductPublicationWindow = (product) => {
    const productMeta = product?.vista_previa?.product_meta || {};
    return {
        start: productMeta.fecha_inicio_publicacion || productMeta.fecha_publicacion || '',
        end: productMeta.fecha_fin_publicacion || productMeta.fecha_retirada || '',
    };
};

const getProductDraftReadiness = (product) => {
    const readiness = product?.vista_previa?.activation_readiness;
    if (readiness && typeof readiness === 'object') {
        return {
            ready: Boolean(readiness.ready),
            missingFields: Array.isArray(readiness.missing_fields) ? readiness.missing_fields : [],
        };
    }
    return { ready: true, missingFields: [] };
};

const getProductAdminStatus = (product) => {
    const draftReadiness = getProductDraftReadiness(product);
    if (!draftReadiness.ready) {
        return 'draft';
    }
    const isApproved = String(product?.estado || '').trim().toLowerCase() === 'approved';
    const publicationWindow = getProductPublicationWindow(product);
    const hasPublicationWindow = Boolean(publicationWindow.start && publicationWindow.end);
    const now = new Date();
    const currentTime = new Date(`${now.toISOString().slice(0, 10)}T00:00:00`).getTime();
    const startsAt = hasPublicationWindow ? new Date(`${publicationWindow.start}T00:00:00`).getTime() : NaN;
    const endsAt = hasPublicationWindow ? new Date(`${publicationWindow.end}T00:00:00`).getTime() : NaN;
    const isWithinPublicationWindow = Number.isFinite(startsAt)
        && Number.isFinite(endsAt)
        && startsAt <= currentTime
        && currentTime <= endsAt;

    if (product?.activo && isApproved && isWithinPublicationWindow) {
        return 'active';
    }
    if (isWithinPublicationWindow) {
        return 'draft';
    }
    return 'inactive';
};

const PORTAL_IMPORT_KIND_LABELS = {
    presupuesto_only: 'Solo presupuesto',
    presupuesto_apus_integrados: 'Presupuesto + APUs integrados',
    apus_vae: 'APUs + VAE',
    tecnico_parcial: 'Técnico parcial',
    bundle_completo: 'Bundle completo',
    bundle_presupuesto_apus: 'Presupuesto + APUs base',
    bundle_parcial: 'Bundle parcial',
    indeterminado: 'Revisión manual sugerida',
};

const PORTAL_IMPORT_COVERAGE_LABELS = {
    solo_presupuesto: 'Solo presupuesto',
    'presupuesto + apus_base': 'Presupuesto + APUs base',
    'presupuesto + apus + recursos': 'Presupuesto + APUs + recursos',
    'presupuesto + apus + recursos + vae': 'Presupuesto + APUs + recursos + VAE',
};

const PORTAL_IMPORT_ROLE_OPTIONS = [
    { value: 'auto', label: 'Auto' },
    { value: 'budget', label: 'Presupuesto' },
    { value: 'apus_resources', label: 'APUs / recursos' },
    { value: 'integrated', label: 'Integrado' },
    { value: 'vae', label: 'VAE / desagregación' },
];

const ECUADOR_GEO_REFERENCE = {
    'azuay|cuenca': { lat: -2.9006, lng: -79.0045, resolution: 'canton' },
    'azuay|paute': { lat: -2.7801, lng: -78.7597, resolution: 'canton' },
    'guayas|guayaquil': { lat: -2.1709, lng: -79.9224, resolution: 'canton' },
    'guayas|daule': { lat: -1.8622, lng: -79.9778, resolution: 'canton' },
    'manabi|manta': { lat: -0.9677, lng: -80.7089, resolution: 'canton' },
    'pichincha|quito': { lat: -0.1807, lng: -78.4678, resolution: 'canton' },
    'azuay|': { lat: -2.9006, lng: -79.0045, resolution: 'provincia' },
    'guayas|': { lat: -2.1709, lng: -79.9224, resolution: 'provincia' },
    'manabi|': { lat: -0.9677, lng: -80.7089, resolution: 'provincia' },
    'pichincha|': { lat: -0.1807, lng: -78.4678, resolution: 'provincia' },
};

const getPortalImportClassificationLabel = (analysis) => PORTAL_IMPORT_KIND_LABELS[analysis?.classification?.document_kind] || 'Análisis combinado';

const getPortalImportCoverageLabel = (analysis) => PORTAL_IMPORT_COVERAGE_LABELS[analysis?.analysis_bundle?.summary?.coverage_level]
    || PORTAL_IMPORT_COVERAGE_LABELS[analysis?.summary?.coverage_level]
    || 'Cobertura parcial';

const resolvePortalImportRoleLabel = (role) => PORTAL_IMPORT_ROLE_OPTIONS.find((option) => option.value === role)?.label || 'Auto';

const getPortalNestedApuStatusLabel = (summary) => {
    const ambiguous = summary?.ambiguous_nested_apu_link_count || 0;
    const pending = summary?.pending_nested_apu_link_count || 0;
    const resolved = summary?.nested_apu_link_count || 0;
    if (ambiguous > 0) {
        return `${ambiguous} ambiguos`;
    }
    if (pending > 0) {
        return `${pending} pendientes`;
    }
    if (resolved > 0) {
        return `${resolved} resueltos`;
    }
    return 'Sin anidados';
};

const getPortalImportExecutiveWarnings = (analysis) => {
    const summary = analysis?.analysis_bundle?.summary || {};
    const warnings = [];
    const unmatchedBudgetRows = summary?.budget_apu_alignment?.unmatched_budget_rows || 0;
    const pendingNested = summary?.pending_nested_apu_link_count || 0;
    const ambiguousNested = summary?.ambiguous_nested_apu_link_count || 0;
    const vaeEntries = summary?.vae_entries_count || 0;
    const pendingApus = summary?.pending_apus_count || analysis?.generated_apus?.length || 0;
    const realApus = summary?.real_apus_count || 0;

    if (unmatchedBudgetRows > 0) {
        warnings.push(`Quedan ${unmatchedBudgetRows} rubro(s) sin correspondencia técnica.`);
    }
    if (ambiguousNested > 0) {
        warnings.push(`Hay ${ambiguousNested} anidación(es) APU con coincidencia ambigua.`);
    } else if (pendingNested > 0) {
        warnings.push(`Hay ${pendingNested} anidación(es) APU todavía pendientes de enlace.`);
    }
    if (!vaeEntries) {
        warnings.push('No se detectó VAE o desagregación tecnológica en esta lectura.');
    }
    if (pendingApus > 0 && !realApus) {
        warnings.push('La base técnica quedó apoyada en APUs pendientes sin recursos completos.');
    }

    const backendWarnings = Array.isArray(summary?.warnings)
        ? summary.warnings.filter(Boolean).slice(0, 2)
        : [];

    return [...warnings, ...backendWarnings].slice(0, 4);
};

const getPortalImportSummaryFileLabel = (analysis) => {
    const sourceFiles = Array.isArray(analysis?.source_files) ? analysis.source_files.filter(Boolean) : [];
    if (sourceFiles.length) {
        const primaryName = sourceFiles[0]?.filename || sourceFiles[0]?.name || analysis?.source_filename || 'Sin archivo';
        return sourceFiles.length > 1 ? `${primaryName} +${sourceFiles.length - 1} más` : primaryName;
    }
    return analysis?.source_filename || 'Sin archivo';
};

const getPortalImportSummaryStructureLabel = (analysis) => {
    const items = Number(analysis?.items_count || 0);
    const chapters = Number(analysis?.chapters_count || 0);
    return `${items} rubros · ${chapters} capítulos`;
};

const getPortalImportOutcomeState = (analysis) => {
    const warnings = getPortalImportExecutiveWarnings(analysis);
    if (warnings.length) {
        return {
            title: 'Importación lista con advertencias',
            helper: 'La lectura es utilizable, pero conviene revisar algunos puntos antes del guardado final.',
            tone: 'warning',
        };
    }
    return {
        title: 'Importación lista',
        helper: 'La fuente documental fue procesada correctamente y está preparada para incorporarse al producto.',
        tone: 'success',
    };
};

const getPortalImportFileExtension = (filename) => {
    const match = String(filename || '').toLowerCase().match(/\.([a-z0-9]+)$/);
    return match?.[1]?.toUpperCase() || 'ARCHIVO';
};

const _getPortalImportWorkspaceStatus = ({ files, importing, analysis }) => {
    if (importing) {
        return {
            label: 'Analizando fuentes',
            helper: 'El sistema está clasificando y conciliando la base técnica.',
            tone: 'info',
        };
    }
    if (analysis) {
        return {
            label: 'Bundle analizado',
            helper: 'Ya existe un resultado técnico visible para esta fuente documental.',
            tone: 'success',
        };
    }
    if (files?.length) {
        return {
            label: `${files.length} archivo(s) cargado(s)`,
            helper: 'La fuente documental está lista para análisis.',
            tone: 'ready',
        };
    }
    return {
        label: 'Sin fuente documental',
        helper: 'Sube uno o varios PDF, XLS o XLSX para construir la base técnica.',
        tone: 'idle',
    };
};

const getPortalImportProcessingStage = (elapsedMs) => {
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
    if (elapsedSeconds < 4) {
        return { percent: 44, label: 'Validando fuente documental', indeterminate: false };
    }
    if (elapsedSeconds < 12) {
        return { percent: 58, label: 'Leyendo estructura documental', indeterminate: false };
    }
    if (elapsedSeconds < 24) {
        return { percent: 72, label: 'Extrayendo presupuesto, APUs y recursos', indeterminate: false };
    }
    if (elapsedSeconds < 45) {
        return { percent: 84, label: 'Conciliando el bundle técnico', indeterminate: false };
    }
    if (elapsedSeconds < 75) {
        return { percent: 88, label: 'Finalizando análisis técnico', indeterminate: false };
    }
    if (elapsedSeconds < 180) {
        return {
            percent: 88,
            label: 'Procesando el análisis en servidor. Este archivo puede tardar varios minutos',
            indeterminate: true,
        };
    }
    return {
        percent: 88,
        label: 'Cierre del bundle técnico. Esperando respuesta final del servidor',
        indeterminate: true,
    };
};

const normalizePortalImportAnalysis = (analysis) => {
    if (!analysis || typeof analysis !== 'object') {
        return null;
    }

    const rawBundle = analysis.analysis_bundle && typeof analysis.analysis_bundle === 'object'
        ? analysis.analysis_bundle
        : {};
    const rawSummary = rawBundle.summary && typeof rawBundle.summary === 'object'
        ? rawBundle.summary
        : {};
    const normalizeObjectArray = (value) => (Array.isArray(value)
        ? value.filter((item) => item && typeof item === 'object')
        : []);

    return {
        ...analysis,
        source_files: normalizeObjectArray(analysis.source_files),
        generated_apus: normalizeObjectArray(analysis.generated_apus),
        chapter_breakdown: normalizeObjectArray(analysis.chapter_breakdown),
        rubros: normalizeObjectArray(analysis.rubros),
        analysis_bundle: {
            ...rawBundle,
            apus: normalizeObjectArray(rawBundle.apus),
            resources: normalizeObjectArray(rawBundle.resources),
            apu_links: normalizeObjectArray(rawBundle.apu_links),
            vae_entries: normalizeObjectArray(rawBundle.vae_entries),
            budget_items: normalizeObjectArray(rawBundle.budget_items),
            sample_apus: normalizeObjectArray(rawBundle.sample_apus),
            sample_resources: normalizeObjectArray(rawBundle.sample_resources),
            sample_vae_entries: normalizeObjectArray(rawBundle.sample_vae_entries),
            sample_reconciled_apus: normalizeObjectArray(rawBundle.sample_reconciled_apus),
            sample_pending_nested_apu_links: normalizeObjectArray(rawBundle.sample_pending_nested_apu_links),
            sample_ambiguous_nested_apu_links: normalizeObjectArray(rawBundle.sample_ambiguous_nested_apu_links),
            sample_unmatched_budget_rows: normalizeObjectArray(rawBundle.sample_unmatched_budget_rows),
            summary: {
                ...rawSummary,
                warnings: Array.isArray(rawSummary.warnings) ? rawSummary.warnings.filter(Boolean) : [],
                dedupe_summary: rawSummary.dedupe_summary && typeof rawSummary.dedupe_summary === 'object' ? rawSummary.dedupe_summary : {},
                budget_apu_alignment: rawSummary.budget_apu_alignment && typeof rawSummary.budget_apu_alignment === 'object' ? rawSummary.budget_apu_alignment : null,
                apu_reconciliation: rawSummary.apu_reconciliation && typeof rawSummary.apu_reconciliation === 'object' ? rawSummary.apu_reconciliation : null,
            },
        },
    };
};

const buildPortalExcelPreviewPayload = (analysis) => {
    if (!analysis || typeof analysis !== 'object') {
        return null;
    }
    return {
        source_filename: analysis.source_filename || null,
        total_amount: analysis.total_amount || '0.00',
        items_count: analysis.items_count || 0,
        chapters_count: analysis.chapters_count || 0,
        rubros: Array.isArray(analysis.rubros) ? analysis.rubros : [],
        chapter_breakdown: Array.isArray(analysis.chapter_breakdown) ? analysis.chapter_breakdown : [],
        generated_apus: Array.isArray(analysis.generated_apus) ? analysis.generated_apus : [],
        source_files: Array.isArray(analysis.source_files) ? analysis.source_files : [],
        classification: analysis.classification && typeof analysis.classification === 'object'
            ? analysis.classification
            : {},
        analysis_bundle: analysis.analysis_bundle && typeof analysis.analysis_bundle === 'object'
            ? {
                summary: analysis.analysis_bundle.summary && typeof analysis.analysis_bundle.summary === 'object'
                    ? analysis.analysis_bundle.summary
                    : {},
                apus: Array.isArray(analysis.analysis_bundle.apus) ? analysis.analysis_bundle.apus : [],
                resources: Array.isArray(analysis.analysis_bundle.resources) ? analysis.analysis_bundle.resources : [],
                apu_links: Array.isArray(analysis.analysis_bundle.apu_links) ? analysis.analysis_bundle.apu_links : [],
                vae_entries: Array.isArray(analysis.analysis_bundle.vae_entries) ? analysis.analysis_bundle.vae_entries : [],
                budget_items: Array.isArray(analysis.analysis_bundle.budget_items) ? analysis.analysis_bundle.budget_items : [],
                sample_apus: Array.isArray(analysis.analysis_bundle.sample_apus) ? analysis.analysis_bundle.sample_apus : [],
                sample_reconciled_apus: Array.isArray(analysis.analysis_bundle.sample_reconciled_apus) ? analysis.analysis_bundle.sample_reconciled_apus : [],
                sample_resources: Array.isArray(analysis.analysis_bundle.sample_resources) ? analysis.analysis_bundle.sample_resources : [],
                sample_vae_entries: Array.isArray(analysis.analysis_bundle.sample_vae_entries) ? analysis.analysis_bundle.sample_vae_entries : [],
            }
            : {},
    };
};

const resolvePortalTechnicalTotalAmount = (analysis) => {
    const rawValue = normalizePortalLicitacionInput(analysis?.total_amount);
    return rawValue || '';
};

const formatBlobApiError = async (error, fallback) => {
    const responseData = error?.response?.data;
    if (responseData instanceof Blob) {
        try {
            const text = await responseData.text();
            if (text) {
                const parsed = JSON.parse(text);
                return formatApiDetailMessage(parsed?.detail || parsed?.message || parsed, fallback);
            }
        } catch {
            return fallback;
        }
    }
    return formatApiDetailMessage(error?.response?.data?.detail || error?.response?.data?.message, fallback);
};

const formatApiDetailMessage = (detail, fallback) => {
    if (!detail) {
        return fallback;
    }
    if (typeof detail === 'string') {
        return detail;
    }
    if (Array.isArray(detail)) {
        const normalized = detail
            .map((entry) => {
                if (typeof entry === 'string') {
                    return entry;
                }
                if (entry && typeof entry === 'object') {
                    const location = Array.isArray(entry.loc) ? entry.loc.join(' > ') : '';
                    const message = String(entry.msg || '').trim();
                    return [location, message].filter(Boolean).join(': ');
                }
                return '';
            })
            .filter(Boolean);
        return normalized.length ? normalized.join(' | ') : fallback;
    }
    if (typeof detail === 'object') {
        return String(detail.message || detail.detail || detail.msg || fallback);
    }
    return fallback;
};

const normalizeGeoKey = (value) => String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const resolvePortalProjectReference = (draft) => {
    const candidates = [draft.import_source_reference, draft.codigo_licitacion, draft.codigo];
    return candidates.map((value) => String(value || '').trim()).find(Boolean) || 'Sin referencia';
};

const resolvePortalProjectGeolocation = (draft) => {
    const provinceKey = normalizeGeoKey(draft.provincia);
    const cantonKey = normalizeGeoKey(draft.canton);
    return ECUADOR_GEO_REFERENCE[`${provinceKey}|${cantonKey}`]
        || ECUADOR_GEO_REFERENCE[`${provinceKey}|`]
        || null;
};

const buildPortalProjectDeliverySummary = (draft) => {
    const referenceCode = resolvePortalProjectReference(draft);
    const geolocation = resolvePortalProjectGeolocation(draft);
    const locationLabel = [draft.pais, draft.provincia, draft.canton].filter(Boolean).join(' / ') || 'Sin localización';

    return {
        referenceCode,
        locationLabel,
        geolocation,
        address: draft.direccion || 'Sin dirección',
    };
};

const preventWheelSelectChange = (event) => {
    event.currentTarget.blur();
};

const AdminMotionScrollArea = ({ children, className = '', contentClassName = '', axis = 'y' }) => {
    const scrollRef = useRef(null);
    const allowsVertical = axis === 'y' || axis === 'both';
    const allowsHorizontal = axis === 'x' || axis === 'both';
    const overflowClass = axis === 'both'
        ? 'overflow-auto'
        : axis === 'x'
            ? 'overflow-x-auto overflow-y-hidden'
            : 'overflow-y-auto overflow-x-hidden';

    return (
        <div className={`relative min-h-0 ${className}`}>
            <div
                ref={scrollRef}
                className={`giproy-motion-scrollbar-hide h-full min-h-0 overscroll-contain ${overflowClass} ${allowsVertical ? 'pr-7' : ''} ${allowsHorizontal ? 'pb-6' : ''} ${contentClassName}`}
            >
                {children}
            </div>
            {allowsVertical ? <MotionScrollbar targetRef={scrollRef} className="right-1" style={{ top: 8, bottom: 8 }} /> : null}
            {allowsHorizontal ? <MotionScrollbar targetRef={scrollRef} orientation="horizontal" className="bottom-1" style={{ left: 8, right: 8 }} /> : null}
        </div>
    );
};

const MarketplaceAdminDashboard = () => {
    const legacyMarketplacePreviewEnabled = Boolean(import.meta.env.VITE_ENABLE_LEGACY_MARKETPLACE_PREVIEW);
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const currentCompanyName = user?.empresa_nombre || user?.empresa?.nombre || '';
    const isSantiagoBermeoBetaAdmin = (user?.rol || '').toLowerCase() === 'administrador'
        && normalizeCompanyName(currentCompanyName) === normalizeCompanyName('Santiago Bermeo');
    const isAdmin = (user?.marketplace_permissions || []).includes('marketplace.manage_all_products') || isSantiagoBermeoBetaAdmin;
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [adminOrders, setAdminOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(true);
    const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true);
    const [adminOrdersLoading, setAdminOrdersLoading] = useState(true);
    const [, setSaving] = useState(false);
    const [productSaving, setProductSaving] = useState(false);
    const [paymentMethodSavingSlug, setPaymentMethodSavingSlug] = useState('');
    const [adminOrderActionId, setAdminOrderActionId] = useState(null);
    const [error, setError] = useState('');
    const [productsError, setProductsError] = useState('');
    const [paymentMethodsError, setPaymentMethodsError] = useState('');
    const [adminOrdersError, setAdminOrdersError] = useState('');
    const [paymentHousekeeping, setPaymentHousekeeping] = useState(null);
    const [paymentHousekeepingLoading, setPaymentHousekeepingLoading] = useState(true);
    const [paymentHousekeepingRunning, setPaymentHousekeepingRunning] = useState(false);
    const [adminOrdersQuery, setAdminOrdersQuery] = useState('');
    const [adminOrdersStatusFilter, setAdminOrdersStatusFilter] = useState('all');
    const [adminOrdersMethodFilter, setAdminOrdersMethodFilter] = useState('all');
    const [adminOrderNotes, setAdminOrderNotes] = useState({});
    const [editingCategoryId, setEditingCategoryId] = useState(null);
    const [editingProductId, setEditingProductId] = useState(null);
    const [creatingProductType, setCreatingProductType] = useState('');
    const [categoriesModalOpen, setCategoriesModalOpen] = useState(false);
    const [productsModalOpen, setProductsModalOpen] = useState(false);
    const [paymentMethodsModalOpen, setPaymentMethodsModalOpen] = useState(false);
    const [systemSalesModalOpen, setSystemSalesModalOpen] = useState(false);
    const [productEditorModalOpen, setProductEditorModalOpen] = useState(false);
    const [productEditorMode, setProductEditorMode] = useState('create');
    const [productTypeMenuOpen, setProductTypeMenuOpen] = useState(false);
    const [productCategoryFilter, setProductCategoryFilter] = useState('all');
    const [productTypeFilter, setProductTypeFilter] = useState('all');
    const [productStatusFilter, setProductStatusFilter] = useState('all');
    const [productSort, setProductSort] = useState('created_desc');
    const [form, setForm] = useState(EMPTY_FORM);
    const [productForm, setProductForm] = useState(EMPTY_PRODUCT_FORM);
    const [portalModalOpen, setPortalModalOpen] = useState(false);
    const [portalModalMode, setPortalModalMode] = useState('create');
    const [portalForm, setPortalForm] = useState(EMPTY_PORTAL_FORM);
    const [portalPreviewModalOpen, setPortalPreviewModalOpen] = useState(false);
    const [portalPreviewPayload, setPortalPreviewPayload] = useState(null);
    const [portalPreviewReadOnly, setPortalPreviewReadOnly] = useState(false);
    const [portalPreviewExcelDownloading, setPortalPreviewExcelDownloading] = useState(false);
    const [portalImportFiles, setPortalImportFiles] = useState([]);
    const [portalImportRoleOverrides, setPortalImportRoleOverrides] = useState({});
    const [portalImporting, setPortalImporting] = useState(false);
    const [portalImageUploading, setPortalImageUploading] = useState(false);
    const [portalImportProgress, setPortalImportProgress] = useState({ phase: 'idle', percent: 0, label: '', indeterminate: false, elapsedSeconds: 0 });
    const [paises, setPaises] = useState([]);
    const [portalProvincias, setPortalProvincias] = useState([]);
    const [portalCantones, setPortalCantones] = useState([]);
    const productTypeMenuRef = useRef(null);
    const portalImportInputRef = useRef(null);
    const portalImageInputRef = useRef(null);
    const portalImportAbortRef = useRef(null);
    const portalImportProgressTimerRef = useRef(null);
    const portalFieldRefs = useRef({});

    const todayIso = new Date().toISOString().slice(0, 10);

    const setPortalFieldRef = (fieldKey, node) => {
        if (!node) {
            delete portalFieldRefs.current[fieldKey];
            return;
        }
        portalFieldRefs.current[fieldKey] = node;
    };

    const focusPortalField = (fieldKey) => {
        const focusKey = fieldKey === 'import_source_kind' ? 'import_source_reference' : fieldKey;
        const node = portalFieldRefs.current[focusKey];
        if (!node) return;
        node.scrollIntoView({ behavior: 'smooth', block: 'center' });
        window.setTimeout(() => {
            const focusTarget = node.matches?.('input, textarea, select, button, [tabindex]')
                ? node
                : node.querySelector?.('input, textarea, select, button, [tabindex]');
            focusTarget?.focus?.();
        }, 140);
    };

    const triggerBlobDownload = (data, filename, mimeType) => {
        const url = window.URL.createObjectURL(new Blob([data], { type: mimeType }));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    };

    const mergePortalImportFiles = (incomingFiles) => {
        if (!incomingFiles.length) {
            return;
        }
        setPortalImportFiles((current) => {
            const merged = [...current];
            incomingFiles.forEach((incoming) => {
                const alreadyExists = merged.some((candidate) => (
                    candidate.name === incoming.name
                    && candidate.size === incoming.size
                    && candidate.lastModified === incoming.lastModified
                ));
                if (!alreadyExists) {
                    merged.push(incoming);
                }
            });
            return merged;
        });
    };

    const handlePortalImportFilesSelected = async (event) => {
        const incomingFiles = Array.from(event.target.files || []);
        event.target.value = '';
        if (!incomingFiles.length) return;
        if (portalForm.import_analysis) {
            const confirmed = await appConfirm({
                title: 'Reemplazar fuente documental',
                message: 'Este portal ya tiene un análisis técnico asociado. Si continúas, se descartará el resumen actual y se cargará la nueva fuente documental para un análisis nuevo.',
                confirmLabel: 'Reemplazar fuente',
                cancelLabel: 'Mantener análisis',
                tone: 'warning',
            });
            if (!confirmed) {
                return;
            }
            setPortalImportFiles(incomingFiles);
            setPortalImportRoleOverrides({});
            setPortalImportProgress({ phase: 'idle', percent: 0, label: '', indeterminate: false, elapsedSeconds: 0 });
            setPortalForm((current) => {
                const next = {
                    ...current,
                    import_analysis: null,
                };
                next.processing_status = computePortalProcessingStatus(next);
                return next;
            });
            return;
        }
        mergePortalImportFiles(incomingFiles);
    };

    const openPortalImportFilePicker = () => {
        if (!portalImportInputRef.current) {
            return;
        }
        portalImportInputRef.current.value = '';
        portalImportInputRef.current.click();
    };

    const selectableCategories = useMemo(
        () => categories.filter((category) => FIXED_MARKETPLACE_CATEGORY_SLUGS.includes(category.slug)),
        [categories],
    );

    const availableAdminProductTypeOptions = useMemo(
        () => ADMIN_PRODUCT_TYPE_OPTIONS.filter((option) => !SYSTEM_ONLY_ADMIN_PRODUCT_TYPES.has(option.value) || isAdmin),
        [isAdmin],
    );

    const selectableCategoryIds = useMemo(
        () => new Set(selectableCategories.map((category) => String(category.id))),
        [selectableCategories],
    );

    const fixedCategoryIdBySlug = useMemo(
        () => Object.fromEntries((categories || []).map((category) => [category.slug, category.id])),
        [categories],
    );

    const portalFixedCategoryId = useMemo(
        () => fixedCategoryIdBySlug['tienda-portal-compras-publicas'] || null,
        [fixedCategoryIdBySlug],
    );

    const filteredProducts = useMemo(() => {
        const base = [...(products || [])].filter((product) => {
            const productAdminStatus = getProductAdminStatus(product);
            if (productCategoryFilter !== 'all' && String(product.category?.id || '') !== productCategoryFilter) {
                return false;
            }
            if (productTypeFilter !== 'all' && String(product.product_type || '') !== productTypeFilter) {
                return false;
            }
            if (productStatusFilter !== 'all' && productStatusFilter !== productAdminStatus) {
                return false;
            }
            return true;
        });

        const parseDate = (value) => {
            const time = value ? new Date(value).getTime() : 0;
            return Number.isFinite(time) ? time : 0;
        };

        base.sort((left, right) => {
            const leftWindow = getProductPublicationWindow(left);
            const rightWindow = getProductPublicationWindow(right);
            switch (productSort) {
                case 'created_asc':
                    return parseDate(left.fecha_creacion) - parseDate(right.fecha_creacion);
                case 'publication_start_desc':
                    return parseDate(rightWindow.start) - parseDate(leftWindow.start);
                case 'publication_start_asc':
                    return parseDate(leftWindow.start) - parseDate(rightWindow.start);
                case 'publication_end_desc':
                    return parseDate(rightWindow.end) - parseDate(leftWindow.end);
                case 'publication_end_asc':
                    return parseDate(leftWindow.end) - parseDate(rightWindow.end);
                case 'price_desc':
                    return Number(right.precio || 0) - Number(left.precio || 0);
                case 'price_asc':
                    return Number(left.precio || 0) - Number(right.precio || 0);
                case 'title_asc':
                    return String(left.titulo || '').localeCompare(String(right.titulo || ''), 'es', { sensitivity: 'base' });
                case 'title_desc':
                    return String(right.titulo || '').localeCompare(String(left.titulo || ''), 'es', { sensitivity: 'base' });
                case 'created_desc':
                default:
                    return parseDate(right.fecha_creacion) - parseDate(left.fecha_creacion);
            }
        });

        return base;
    }, [products, productCategoryFilter, productTypeFilter, productStatusFilter, productSort]);

    const loadCategories = async () => {
        try {
            setLoading(true);
            setError('');
            const { data } = await marketplaceApi.getAdminCategories();
            setCategories(Array.isArray(data) ? data : []);
        } catch (loadError) {
            setError(loadError?.response?.data?.detail || 'No fue posible cargar las categorías del marketplace.');
        } finally {
            setLoading(false);
        }
    };

    const loadProducts = async () => {
        try {
            setProductsLoading(true);
            setProductsError('');
            const { data } = await marketplaceApi.getAdminProducts();
            setProducts(Array.isArray(data) ? data : []);
        } catch (loadError) {
            setProductsError(loadError?.response?.data?.detail || 'No fue posible cargar el listado global de productos.');
        } finally {
            setProductsLoading(false);
        }
    };

    const loadPaymentMethods = async () => {
        try {
            setPaymentMethodsLoading(true);
            setPaymentMethodsError('');
            const { data } = await marketplaceApi.getAdminPaymentMethods();
            setPaymentMethods(Array.isArray(data) ? data : []);
        } catch (loadError) {
            setPaymentMethodsError(loadError?.response?.data?.detail || 'No fue posible cargar las formas de pago.');
        } finally {
            setPaymentMethodsLoading(false);
        }
    };

    const loadAdminOrders = async () => {
        try {
            setAdminOrdersLoading(true);
            setAdminOrdersError('');
            const { data } = await marketplaceApi.getAdminOrders();
            setAdminOrders(Array.isArray(data) ? data : []);
        } catch (loadError) {
            setAdminOrdersError(loadError?.response?.data?.detail || 'No fue posible cargar las ventas del sistema.');
        } finally {
            setAdminOrdersLoading(false);
        }
    };

    const loadPaymentHousekeeping = async () => {
        try {
            setPaymentHousekeepingLoading(true);
            const { data } = await marketplaceApi.getAdminPaymentHousekeeping();
            setPaymentHousekeeping(data || null);
        } catch {
            setPaymentHousekeeping(null);
        } finally {
            setPaymentHousekeepingLoading(false);
        }
    };

    const runPaymentHousekeeping = async () => {
        try {
            setPaymentHousekeepingRunning(true);
            const { data } = await marketplaceApi.runAdminPaymentHousekeeping();
            setPaymentHousekeeping(data || null);
            await loadAdminOrders();
            appAlert({
                title: 'Housekeeping ejecutado',
                message: 'Se actualizó la conciliación automática del marketplace y se refrescó el listado de ventas.',
                tone: 'success',
            });
        } catch (runError) {
            appAlert({
                title: 'No se pudo ejecutar el housekeeping',
                message: runError?.response?.data?.detail || 'No fue posible ejecutar la conciliación automática del marketplace.',
                tone: 'error',
            });
        } finally {
            setPaymentHousekeepingRunning(false);
        }
    };

    useEffect(() => {
        if (!isAdmin) return;
        loadCategories();
        loadProducts();
        loadPaymentMethods();
        loadAdminOrders();
        loadPaymentHousekeeping();
    }, [isAdmin]);

    useEffect(() => {
        if (!portalModalOpen) return;
        const loadPaises = async () => {
            try {
                const data = await maestrosApi.getPaises();
                setPaises(Array.isArray(data) ? data : []);
            } catch {
                setPaises([]);
            }
        };
        loadPaises();
    }, [portalModalOpen]);

    useEffect(() => {
        if (!portalModalOpen) return;
        if (portalForm.pais === 'Ecuador') {
            maestrosApi.getProvincias()
                .then((data) => setPortalProvincias(Array.isArray(data) ? data : []))
                .catch(() => setPortalProvincias([]));
        } else {
            setPortalProvincias([]);
            setPortalCantones([]);
        }
    }, [portalForm.pais, portalModalOpen]);

    useEffect(() => {
        if (!portalModalOpen) return;
        if (portalForm.pais === 'Ecuador' && portalForm.provincia) {
            maestrosApi.getCantones(portalForm.provincia)
                .then((data) => setPortalCantones(Array.isArray(data) ? data : []))
                .catch(() => setPortalCantones([]));
        } else {
            setPortalCantones([]);
        }
    }, [portalForm.pais, portalForm.provincia, portalModalOpen]);

    useEffect(() => {
        if (!productTypeMenuOpen) return;

        const handlePointerDownOutside = (event) => {
            if (!productTypeMenuRef.current) return;
            if (!productTypeMenuRef.current.contains(event.target)) {
                setProductTypeMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDownOutside);
        document.addEventListener('touchstart', handlePointerDownOutside);
        return () => {
            document.removeEventListener('mousedown', handlePointerDownOutside);
            document.removeEventListener('touchstart', handlePointerDownOutside);
        };
    }, [productTypeMenuOpen]);

    const resetForm = () => {
        setEditingCategoryId(null);
        setForm(EMPTY_FORM);
    };

    const resetProductForm = () => {
        setEditingProductId(null);
        setProductForm({
            ...EMPTY_PRODUCT_FORM,
            fecha_inicio_publicacion: todayIso,
            fecha_fin_publicacion: todayIso,
        });
    };

    const resetCreateProductForm = () => {
        setCreatingProductType('');
        setProductForm({
            ...EMPTY_PRODUCT_FORM,
            fecha_inicio_publicacion: todayIso,
            fecha_fin_publicacion: todayIso,
        });
    };

    const resetPortalForm = () => {
        setPortalForm({
            ...EMPTY_PORTAL_FORM,
            fecha_inicio_publicacion: todayIso,
            fecha_fin_publicacion: todayIso,
            creador: 'Sistema',
        });
        setEditingProductId(null);
        setCreatingProductType('');
        setPortalCantones([]);
        setPortalImportFiles([]);
        setPortalImportRoleOverrides({});
        setPortalImportProgress({ phase: 'idle', percent: 0, label: '', indeterminate: false, elapsedSeconds: 0 });
        setPortalPreviewPayload(null);
        setPortalPreviewModalOpen(false);
        setPortalPreviewReadOnly(false);
    };

    const openPortalCreateModal = () => {
        setPortalModalMode('create');
        resetPortalForm();
        setCreatingProductType('portal_compras_publicas');
        setPortalModalOpen(true);
    };

    const openPortalEditModal = (product) => {
        const preview = product?.vista_previa || {};
        const productMeta = preview.product_meta || {};
        const portalMeta = preview.portal_meta || {};
        setPortalModalMode('edit');
        setEditingProductId(product.id);
        setCreatingProductType('');
        const normalizedImportAnalysis = normalizePortalImportAnalysis(portalMeta.import_analysis);
        const synchronizedTechnicalTotal = resolvePortalTechnicalTotalAmount(normalizedImportAnalysis) || portalMeta.precio_licitacion || '';
        setPortalForm({
            codigo: productMeta.codigo || '',
            titulo: product.titulo || '',
            descripcion_corta: product.resumen || productMeta.descripcion_corta || '',
            descripcion_larga: product.descripcion || productMeta.descripcion_larga || '',
            descripcion_completa: productMeta.descripcion_completa || '',
            imagen_relevante_url: productMeta.imagen_relevante_url || '',
            precio_con_iva: Number(product.precio || 0).toFixed(2),
            fecha_inicio_publicacion: productMeta.fecha_inicio_publicacion || productMeta.fecha_publicacion || todayIso,
            fecha_fin_publicacion: productMeta.fecha_fin_publicacion || productMeta.fecha_retirada || todayIso,
            descuento_promocion: productMeta.descuento_promocion || '',
            creador: 'Sistema',
            activo: Boolean(product.activo),
            pais: portalMeta.pais || 'Ecuador',
            provincia: portalMeta.provincia || '',
            canton: portalMeta.canton || '',
            direccion: portalMeta.direccion || '',
            codigo_licitacion: portalMeta.codigo_licitacion || portalMeta.import_source?.reference || '',
            precio_licitacion: synchronizedTechnicalTotal,
            fecha_inicio_licitacion: portalMeta.fecha_inicio_licitacion || '',
            fecha_fin_licitacion: portalMeta.fecha_fin_licitacion || '',
            template_version: portalMeta.template_version || '',
            delivery_mode: portalMeta.delivery_mode || 'excel_and_project',
            import_source_kind: portalMeta.import_source?.kind || 'manual',
            import_source_reference: portalMeta.import_source?.reference || portalMeta.codigo_licitacion || '',
            import_notes: portalMeta.import_source?.notes || '',
            processing_status: portalMeta.processing_status || computePortalProcessingStatus({
                delivery_mode: portalMeta.delivery_mode || 'excel_and_project',
                import_source_kind: portalMeta.import_source?.kind || 'manual',
                import_source_reference: portalMeta.import_source?.reference || '',
            }),
            import_analysis: normalizedImportAnalysis,
        });
        setPortalImportFiles([]);
        setPortalImportRoleOverrides(
            Object.fromEntries(
                ((normalizedImportAnalysis?.source_files || []))
                    .filter((source) => source?.filename)
                    .map((source) => [source.filename, source.manual_role || 'auto']),
            ),
        );
        setPortalModalOpen(true);
    };

    const closePortalModal = () => {
        portalImportAbortRef.current?.abort?.();
        portalImportAbortRef.current = null;
        if (portalImportProgressTimerRef.current) {
            window.clearInterval(portalImportProgressTimerRef.current);
            portalImportProgressTimerRef.current = null;
        }
        setPortalImporting(false);
        setPortalImportProgress({ phase: 'idle', percent: 0, label: '', indeterminate: false, elapsedSeconds: 0 });
        setPortalModalOpen(false);
        setPortalPreviewModalOpen(false);
        setPortalPreviewPayload(null);
        setPortalPreviewReadOnly(false);
        setProductTypeMenuOpen(false);
        resetPortalForm();
    };

    const openCategoriesModal = () => {
        setProductsModalOpen(false);
        setCategoriesModalOpen(true);
    };

    const closeCategoriesModal = () => {
        setCategoriesModalOpen(false);
        resetForm();
    };

    const openProductsModal = (presetType = 'all') => {
        setCategoriesModalOpen(false);
        setPaymentMethodsModalOpen(false);
        setSystemSalesModalOpen(false);
        setProductTypeFilter(presetType);
        setProductsModalOpen(true);
    };

    const closeProductsModal = () => {
        setProductsModalOpen(false);
        setProductTypeMenuOpen(false);
        resetProductForm();
        resetCreateProductForm();
    };

    const openPaymentMethodsModal = () => {
        setCategoriesModalOpen(false);
        setProductsModalOpen(false);
        setSystemSalesModalOpen(false);
        setPaymentMethodsModalOpen(true);
    };

    const closePaymentMethodsModal = () => {
        setPaymentMethodsModalOpen(false);
    };

    const openSystemSalesModal = () => {
        setCategoriesModalOpen(false);
        setProductsModalOpen(false);
        setPaymentMethodsModalOpen(false);
        setSystemSalesModalOpen(true);
    };

    const closeSystemSalesModal = () => {
        setSystemSalesModalOpen(false);
    };

    const handlePaymentMethodFieldChange = (slug, field, value) => {
        setPaymentMethods((current) => current.map((method) => {
            if (method.slug !== slug) return method;
            const nextConfig = {
                ...(method.config_json || {}),
                [field]: value,
            };
            return { ...method, config_json: nextConfig };
        }));
    };

    const handlePaymentMethodMetaChange = (slug, field, value) => {
        setPaymentMethods((current) => current.map((method) => (
            method.slug === slug ? { ...method, [field]: value } : method
        )));
    };

    const handleSavePaymentMethod = async (method) => {
        try {
            setPaymentMethodSavingSlug(method.slug);
            await marketplaceApi.updateAdminPaymentMethod(method.slug, {
                is_active: Boolean(method.is_active),
                environment_mode: method.environment_mode,
                description: method.descripcion || '',
                ...(method.config_json || {}),
            });
            await loadPaymentMethods();
        } catch (saveError) {
            await appAlert({
                title: 'No se pudo guardar la forma de pago',
                message: saveError?.response?.data?.detail || 'Ocurrió un error al guardar esta configuración de pago.',
                tone: 'danger',
            });
        } finally {
            setPaymentMethodSavingSlug('');
        }
    };

    const handleApproveBankTransfer = async (order) => {
        const confirmed = await appConfirm({
            title: 'Validar transferencia',
            message: `Se confirmará manualmente el pedido #${order.id} y se activará la compra para ${order.buyer_name || 'el comprador'}. ¿Deseas continuar?`,
            confirmLabel: 'Validar compra',
            cancelLabel: 'Cancelar',
        });
        if (!confirmed) return;

        try {
            setAdminOrderActionId(order.id);
            await marketplaceApi.confirmAdminBankTransfer(order.id, {
                admin_notes: String(adminOrderNotes[order.id] || '').trim() || undefined,
            });
            await loadAdminOrders();
            await loadPaymentHousekeeping();
        } catch (actionError) {
            await appAlert({
                title: 'No se pudo validar la transferencia',
                message: actionError?.response?.data?.detail || 'Ocurrió un error al confirmar manualmente esta compra.',
                tone: 'danger',
            });
        } finally {
            setAdminOrderActionId(null);
        }
    };

    const handleRejectBankTransfer = async (order) => {
        const confirmed = await appConfirm({
            title: 'Rechazar transferencia',
            message: `El pedido #${order.id} quedará marcado como rechazado y no se activará la compra. ¿Deseas continuar?`,
            confirmLabel: 'Rechazar pedido',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (!confirmed) return;

        try {
            setAdminOrderActionId(order.id);
            await marketplaceApi.rejectAdminBankTransfer(order.id, {
                admin_notes: String(adminOrderNotes[order.id] || '').trim() || undefined,
            });
            await loadAdminOrders();
            await loadPaymentHousekeeping();
        } catch (actionError) {
            await appAlert({
                title: 'No se pudo rechazar la transferencia',
                message: actionError?.response?.data?.detail || 'Ocurrió un error al rechazar este pedido.',
                tone: 'danger',
            });
        } finally {
            setAdminOrderActionId(null);
        }
    };

    const handleRefundAdminOrder = async (order) => {
        const confirmed = await appConfirm({
            title: 'Reembolsar pedido',
            message: `El pedido #${order.id} quedará reembolsado y sus activos dejarán de estar disponibles para la empresa compradora. ¿Deseas continuar?`,
            confirmLabel: 'Reembolsar pedido',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (!confirmed) return;

        try {
            setAdminOrderActionId(order.id);
            await marketplaceApi.refundAdminOrder(order.id, {
                reason: String(adminOrderNotes[order.id] || '').trim() || undefined,
            });
            await loadAdminOrders();
            await loadPaymentHousekeeping();
        } catch (actionError) {
            await appAlert({
                title: 'No se pudo reembolsar el pedido',
                message: actionError?.response?.data?.detail || 'Ocurrió un error al reembolsar este pedido.',
                tone: 'danger',
            });
        } finally {
            setAdminOrderActionId(null);
        }
    };

    const filteredAdminOrders = useMemo(() => {
        const query = String(adminOrdersQuery || '').trim().toLowerCase();
        return adminOrders.filter((order) => {
            const methodMatches = adminOrdersMethodFilter === 'all'
                || String(order.payment_method || '').toLowerCase() === adminOrdersMethodFilter;
            const statusMatches = adminOrdersStatusFilter === 'all'
                || String(order.status || '').toLowerCase() === adminOrdersStatusFilter;
            const queryMatches = !query
                || [order.id, order.buyer_name, order.buyer_company_name, order.transfer_reference, order.notes, order.admin_notes]
                    .some((value) => String(value || '').toLowerCase().includes(query));
            return methodMatches && statusMatches && queryMatches;
        });
    }, [adminOrders, adminOrdersMethodFilter, adminOrdersQuery, adminOrdersStatusFilter]);

    const closeProductEditorModal = () => {
        setProductEditorModalOpen(false);
        setProductTypeMenuOpen(false);
        resetProductForm();
        resetCreateProductForm();
    };

    const openGenericCreateModal = (productType) => {
        setProductEditorMode('create');
        setEditingProductId(null);
        setCreatingProductType(productType);
        setProductForm({
            ...EMPTY_PRODUCT_FORM,
            fecha_inicio_publicacion: todayIso,
            fecha_fin_publicacion: todayIso,
        });
        setProductEditorModalOpen(true);
        setProductTypeMenuOpen(false);
    };

    const openGenericEditModal = (product) => {
        const normalizedCategoryId = product.category?.id ? String(product.category.id) : '';
        setProductEditorMode('edit');
        setEditingProductId(product.id);
        setCreatingProductType(product.product_type || '');
        setProductForm({
            titulo: product.titulo || '',
            resumen: product?.vista_previa?.product_meta?.descripcion_corta || product.resumen || '',
            descripcion_larga: product?.vista_previa?.product_meta?.descripcion_larga || product.descripcion || '',
            descripcion_completa: product?.vista_previa?.product_meta?.descripcion_completa || '',
            descuento_promocion: product?.vista_previa?.product_meta?.descuento_promocion || '',
            imagen_relevante_url: product?.vista_previa?.product_meta?.imagen_relevante_url || '',
            precio: Number(product.precio || 0).toFixed(2),
            fecha_inicio_publicacion:
                product?.vista_previa?.product_meta?.fecha_inicio_publicacion
                || product?.vista_previa?.product_meta?.fecha_publicacion
                || todayIso,
            fecha_fin_publicacion:
                product?.vista_previa?.product_meta?.fecha_fin_publicacion
                || product?.vista_previa?.product_meta?.fecha_retirada
                || todayIso,
            category_id: selectableCategoryIds.has(normalizedCategoryId) ? normalizedCategoryId : '',
            activo: Boolean(product.activo),
        });
        setProductEditorModalOpen(true);
        setProductTypeMenuOpen(false);
    };

    useEffect(() => {
        if (!productEditorModalOpen) return;
        if (!productForm.category_id) return;
        if (selectableCategoryIds.has(String(productForm.category_id))) return;
        setProductForm((current) => ({ ...current, category_id: '' }));
    }, [productEditorModalOpen, productForm.category_id, selectableCategoryIds]);

    const _handleEditCategory = (category) => {
        setEditingCategoryId(category.id);
        setForm({
            nombre: category.nombre || '',
            descripcion: category.descripcion || '',
            visibility_scope: category.visibility_scope || 'all',
            sort_order: Number(category.sort_order || 0),
            activa: Boolean(category.activa),
        });
    };

    const _handleSubmit = async (event) => {
        event.preventDefault();
        if (!form.nombre.trim()) {
            await appAlert({
                title: 'Nombre requerido',
                message: 'La categoría necesita un nombre antes de guardarse.',
            });
            return;
        }

        const payload = {
            nombre: form.nombre.trim(),
            descripcion: form.descripcion.trim() || null,
            visibility_scope: form.visibility_scope,
            sort_order: Number(form.sort_order || 0),
            activa: Boolean(form.activa),
        };

        try {
            setSaving(true);
            if (editingCategoryId) {
                await marketplaceApi.updateAdminCategory(editingCategoryId, payload);
            } else {
                await marketplaceApi.createAdminCategory(payload);
            }
            await loadCategories();
            resetForm();
        } catch (saveError) {
            await appAlert({
                title: 'No se pudo guardar la categoría',
                message: saveError?.response?.data?.detail || 'Ocurrió un error al guardar la categoría.',
                tone: 'danger',
            });
        } finally {
            setSaving(false);
        }
    };

    const _handleDeleteCategory = async (category) => {
        const confirmed = await appConfirm({
            title: 'Borrar categoría',
            message: `Vas a borrar la categoría “${category.nombre}”. Esta acción no se puede deshacer.`,
            confirmLabel: 'Borrar',
            cancelLabel: 'Cancelar',
            tone: 'danger',
        });
        if (!confirmed) return;

        try {
            await marketplaceApi.deleteAdminCategory(category.id);
            await loadCategories();
            if (editingCategoryId === category.id) {
                resetForm();
            }
        } catch (deleteError) {
            await appAlert({
                title: 'No se pudo borrar la categoría',
                message: deleteError?.response?.data?.detail || 'Ocurrió un error al borrar la categoría.',
                tone: 'danger',
            });
        }
    };

    const handleEditProduct = (product) => {
        if (product.product_type === 'portal_compras_publicas') {
            openPortalEditModal(product);
            return;
        }
        openGenericEditModal(product);
    };

    const handleCreateProduct = async (event) => {
        event.preventDefault();
        await submitCreateProduct();
    };

    const submitCreateProduct = async () => {
        if (!creatingProductType) {
            await appAlert({
                title: 'Selecciona un tipo',
                message: 'Debes elegir primero el tipo de producto antes de entrar en la creación.',
            });
            return;
        }
        if (!productForm.titulo.trim()) {
            await appAlert({
                title: 'Título requerido',
                message: 'El producto necesita un título antes de guardarse.',
            });
            return;
        }
        if (!productForm.fecha_inicio_publicacion || !productForm.fecha_fin_publicacion) {
            await appAlert({
                title: 'Fechas requeridas',
                message: 'Todos los artículos requieren fecha de inicio y fin de publicación.',
            });
            return;
        }
        if (isInvalidDateRange(productForm.fecha_inicio_publicacion, productForm.fecha_fin_publicacion)) {
            await appAlert({
                title: 'Rango inválido',
                message: 'La fecha fin de publicación no puede ser anterior a la fecha de inicio.',
            });
            return;
        }

        const payload = {
            titulo: productForm.titulo.trim(),
            resumen: productForm.resumen.trim() || null,
            descripcion: productForm.descripcion_larga.trim() || null,
            product_type: creatingProductType,
            product_kind: 'manual',
            precio: Number(productForm.precio || 0),
            moneda: 'USD',
            category_id: productForm.category_id ? Number(productForm.category_id) : null,
            activo: Boolean(productForm.activo),
            requiere_aprobacion: false,
            product_meta: {
                descripcion_corta: productForm.resumen.trim() || null,
                descripcion_larga: productForm.descripcion_larga.trim() || null,
                descripcion_completa: productForm.descripcion_completa.trim() || null,
                descuento_promocion: productForm.descuento_promocion.trim() || null,
                imagen_relevante_url: productForm.imagen_relevante_url.trim() || null,
                fecha_inicio_publicacion: productForm.fecha_inicio_publicacion,
                fecha_fin_publicacion: productForm.fecha_fin_publicacion,
            },
        };

        try {
            setProductSaving(true);
            await marketplaceApi.createAdminProduct(payload);
            await loadProducts();
            closeProductEditorModal();
        } catch (saveError) {
            await appAlert({
                title: 'No se pudo crear el producto',
                message: saveError?.response?.data?.detail || 'Ocurrió un error al crear el producto.',
                tone: 'danger',
            });
        } finally {
            setProductSaving(false);
        }
    };

    const computedPortalTemplateVersion = useMemo(
        () => buildPortalTemplateVersion(portalForm),
        [portalForm],
    );

    const computedPortalProcessingStatus = useMemo(
        () => computePortalProcessingStatus(portalForm),
        [portalForm],
    );

    const portalActivationReadiness = useMemo(
        () => getPortalActivationReadiness(portalForm),
        [portalForm],
    );

    const computedPortalCommercialPrice = useMemo(() => (
        resolvePortalCommercialPrice(parsePortalLicitacionAmount(portalForm.precio_licitacion))
    ), [portalForm.precio_licitacion]);

    const portalProjectDeliverySummary = useMemo(
        () => buildPortalProjectDeliverySummary(portalForm),
        [portalForm],
    );

    const portalPreviewImportAnalysis = useMemo(
        () => normalizePortalImportAnalysis(portalForm.import_analysis),
        [portalForm.import_analysis],
    );

    const portalPreviewOutcomeState = useMemo(
        () => getPortalImportOutcomeState(portalPreviewImportAnalysis),
        [portalPreviewImportAnalysis],
    );

    const portalPreviewExecutiveWarnings = useMemo(
        () => getPortalImportExecutiveWarnings(portalPreviewImportAnalysis),
        [portalPreviewImportAnalysis],
    );

    useEffect(() => {
        if (portalActivationReadiness.ready || !portalForm.activo) return;
        setPortalForm((current) => ({ ...current, activo: false }));
    }, [portalActivationReadiness.ready, portalForm.activo]);

    useEffect(() => {
        if (!portalForm.fecha_fin_licitacion) return;
        if (portalForm.fecha_fin_publicacion === portalForm.fecha_fin_licitacion) return;
        setPortalForm((current) => {
            if (!current.fecha_fin_licitacion || current.fecha_fin_publicacion === current.fecha_fin_licitacion) {
                return current;
            }
            return {
                ...current,
                fecha_fin_publicacion: current.fecha_fin_licitacion,
            };
        });
    }, [portalForm.fecha_fin_licitacion, portalForm.fecha_fin_publicacion]);

    const handlePortalImageUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setPortalImageUploading(true);
            const response = await marketplaceApi.uploadAdminProductImage(file);
            const uploadedUrl = response?.data?.url || '';
            if (!uploadedUrl) {
                throw new Error('empty_upload_url');
            }
            setPortalForm((current) => ({
                ...current,
                imagen_relevante_url: uploadedUrl,
            }));
        } catch (uploadError) {
            await appAlert({
                title: 'No se pudo cargar la imagen',
                message: uploadError?.response?.data?.detail || 'Selecciona una imagen JPG, PNG, WEBP o GIF de hasta 5 MB.',
                tone: 'danger',
            });
        } finally {
            setPortalImageUploading(false);
            if (portalImageInputRef.current) {
                portalImageInputRef.current.value = '';
            }
        }
    };

    const buildPortalPayload = () => {
        const technicalReference = normalizePortalTechnicalReference(portalForm.import_source_reference || portalForm.codigo_licitacion);

        return ({
        titulo: portalForm.titulo.trim(),
        resumen: portalForm.descripcion_corta.trim() || null,
        descripcion: portalForm.descripcion_larga.trim() || null,
        product_type: 'portal_compras_publicas',
        product_kind: 'manual',
        category_id: portalFixedCategoryId ? Number(portalFixedCategoryId) : null,
        precio: computedPortalCommercialPrice,
        moneda: 'USD',
        activo: Boolean(portalForm.activo),
        requiere_aprobacion: false,
        product_meta: {
            descripcion_corta: portalForm.descripcion_corta,
            descripcion_larga: portalForm.descripcion_larga,
            descripcion_completa: portalForm.descripcion_completa,
            imagen_relevante_url: portalForm.imagen_relevante_url || null,
            fecha_inicio_publicacion: portalForm.fecha_inicio_publicacion || todayIso,
            fecha_fin_publicacion: portalForm.fecha_fin_publicacion || todayIso,
            descuento_promocion: portalForm.descuento_promocion || null,
        },
        portal_meta: {
            pais: portalForm.pais,
            provincia: portalForm.provincia,
            canton: portalForm.canton || null,
            direccion: portalForm.direccion || null,
            codigo_licitacion: technicalReference,
            precio_licitacion: portalForm.precio_licitacion,
            fecha_inicio_licitacion: portalForm.fecha_inicio_licitacion,
            fecha_fin_licitacion: portalForm.fecha_fin_licitacion,
            delivery_mode: portalForm.delivery_mode,
            import_source: {
                kind: portalForm.import_source_kind,
                reference: technicalReference || null,
                notes: portalForm.import_notes || null,
                excel_export_enabled: portalForm.delivery_mode !== 'project_only',
                project_seed_enabled: portalForm.delivery_mode !== 'excel_only',
            },
            project_delivery_policy: {
                create_project_on_purchase: true,
                project_without_base: true,
                project_send_locked: true,
                mark_as_acquired: true,
            },
            template_version: computedPortalTemplateVersion,
            processing_status: computedPortalProcessingStatus,
            import_analysis: portalForm.import_analysis || null,
        },
        });
    };

    const validatePortalSave = async () => {
        if (!portalForm.titulo.trim()) {
            await appAlert({ title: 'Título requerido', message: 'Debes definir al menos un título comercial para guardar el borrador.' });
            return false;
        }
        if (portalForm.fecha_inicio_publicacion && portalForm.fecha_fin_publicacion && isInvalidDateRange(portalForm.fecha_inicio_publicacion, portalForm.fecha_fin_publicacion)) {
            await appAlert({ title: 'Rango inválido', message: 'La fecha fin de publicación no puede ser anterior a la fecha de inicio.' });
            return false;
        }
        if (portalForm.fecha_inicio_licitacion && portalForm.fecha_fin_licitacion && isInvalidDateRange(portalForm.fecha_inicio_licitacion, portalForm.fecha_fin_licitacion)) {
            await appAlert({ title: 'Rango inválido', message: 'La fecha fin de licitación no puede ser anterior a la fecha de inicio.' });
            return false;
        }
        return true;
    };

    const validatePortalPreview = async () => {
        const canSave = await validatePortalSave();
        if (!canSave) return false;
        if (!portalActivationReadiness.ready) {
            await appAlert({
                title: 'Portal incompleto',
                message: `Completa los descriptores necesarios antes de revisar el previo. Faltan: ${portalActivationReadiness.missingFields.join(', ')}.`,
            });
            return false;
        }
        return true;
    };

    const handlePortalImportPreview = async () => {
        if (!portalImportFiles.length) {
            await appAlert({ title: 'Archivo requerido', message: 'Selecciona al menos un archivo técnico antes de lanzar el análisis.' });
            return;
        }
        let timeoutId = null;
        let processingKickoffId = null;
        const startedAt = Date.now();
        let uploadCompleted = false;
        try {
            portalImportAbortRef.current?.abort?.();
            if (portalImportProgressTimerRef.current) {
                window.clearInterval(portalImportProgressTimerRef.current);
                portalImportProgressTimerRef.current = null;
            }
            const controller = new AbortController();
            portalImportAbortRef.current = controller;
            setPortalImporting(true);
            setPortalImportProgress({
                phase: 'preparing',
                percent: 6,
                label: 'Preparando archivos para análisis',
                indeterminate: false,
                elapsedSeconds: 0,
            });
            const effectiveRoleOverrides = Object.fromEntries(
                Object.entries(portalImportRoleOverrides || {}).filter(([, value]) => value && value !== 'auto'),
            );
            processingKickoffId = window.setTimeout(() => {
                uploadCompleted = true;
                setPortalImportProgress((current) => {
                    if ((current?.percent || 0) >= 40) {
                        return current;
                    }
                    return {
                        phase: 'processing',
                        percent: 40,
                        label: 'Carga enviada. Iniciando lectura técnica',
                        indeterminate: false,
                        elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
                    };
                });
            }, 1800);
            portalImportProgressTimerRef.current = window.setInterval(() => {
                if (!uploadCompleted) return;
                const stage = getPortalImportProcessingStage(Date.now() - startedAt);
                setPortalImportProgress({
                    phase: 'processing',
                    percent: stage.percent,
                    label: stage.label,
                    indeterminate: Boolean(stage.indeterminate),
                    elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
                });
            }, 1200);
            const previewRequest = marketplaceApi.previewAdminPortalImport(
                portalImportFiles,
                effectiveRoleOverrides,
                portalForm.import_analysis || null,
                {
                    signal: controller.signal,
                    onUploadProgress: (progressEvent) => {
                        const total = Number(progressEvent?.total || 0);
                        const loaded = Number(progressEvent?.loaded || 0);
                        if (total > 0) {
                            const uploadPercent = Math.max(10, Math.min(36, Math.round((loaded / total) * 36)));
                            uploadCompleted = loaded >= total;
                            setPortalImportProgress({
                                phase: uploadCompleted ? 'processing' : 'uploading',
                                percent: uploadCompleted ? 40 : uploadPercent,
                                label: uploadCompleted ? 'Carga enviada. Iniciando lectura técnica' : 'Subiendo archivos al importador',
                                indeterminate: false,
                                elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
                            });
                            return;
                        }
                        setPortalImportProgress({
                            phase: 'uploading',
                            percent: 18,
                            label: 'Subiendo archivos al importador',
                            indeterminate: false,
                            elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
                        });
                    },
                },
            );
            const timeoutPromise = new Promise((_, reject) => {
                timeoutId = window.setTimeout(() => {
                    controller.abort();
                    reject(Object.assign(new Error('PORTAL_IMPORT_TIMEOUT'), { code: 'PORTAL_IMPORT_TIMEOUT' }));
                }, 300000);
            });
            const { data } = await Promise.race([previewRequest, timeoutPromise]);
            const normalizedImportAnalysis = normalizePortalImportAnalysis(data?.import_analysis);
            const synchronizedTechnicalTotal = resolvePortalTechnicalTotalAmount(normalizedImportAnalysis);
            setPortalForm((current) => ({
                ...current,
                import_source_kind: data?.import_source_kind || 'archivo_base',
                codigo_licitacion: current.codigo_licitacion || '',
                precio_licitacion: synchronizedTechnicalTotal || current.precio_licitacion || '',
                import_source_reference: current.import_source_reference || normalizePortalTechnicalReference(data?.import_source_reference || portalImportFiles[0]?.name),
                import_analysis: normalizedImportAnalysis,
                processing_status: computePortalProcessingStatus({
                    ...current,
                    import_source_kind: data?.import_source_kind || 'archivo_base',
                    codigo_licitacion: current.codigo_licitacion || '',
                    precio_licitacion: synchronizedTechnicalTotal || current.precio_licitacion || '',
                    import_source_reference: current.import_source_reference || normalizePortalTechnicalReference(data?.import_source_reference || portalImportFiles[0]?.name),
                    import_analysis: normalizedImportAnalysis,
                }),
            }));
            setPortalImportRoleOverrides(
                Object.fromEntries(
                    ((normalizedImportAnalysis?.source_files || []).map((source) => [
                        source.filename,
                        source.manual_role || effectiveRoleOverrides[source.filename] || 'auto',
                    ])),
                ),
            );
            setPortalImportProgress({
                phase: 'success',
                percent: 100,
                label: 'Análisis técnico completado',
                indeterminate: false,
                elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
            });
        } catch (error) {
            if (error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError') {
                setPortalImportProgress({ phase: 'idle', percent: 0, label: '', indeterminate: false, elapsedSeconds: 0 });
                return;
            }
            const timeoutMessage = (error?.code === 'ECONNABORTED' || error?.code === 'PORTAL_IMPORT_TIMEOUT')
                ? 'El análisis técnico tardó demasiado en responder. Reintenta con menos archivos o revisa el estado del backend. Para fuentes pesadas, el importador puede necesitar varios minutos.'
                : null;
            const networkMessage = !error?.response
                ? 'No hubo respuesta válida del backend durante el análisis técnico. Revisa que el servidor del portal esté activo y que no haya cortado la conexión.'
                : null;
            const backendMessage = error?.response?.data?.detail
                ?? error?.response?.data?.message
                ?? error?.response?.data?.details
                ?? null;
            await appAlert({
                title: 'No se pudo analizar el archivo',
                message: formatApiDetailMessage(
                    timeoutMessage || networkMessage || backendMessage,
                    'Ocurrió un error al analizar la fuente técnica del portal.',
                ),
                tone: 'danger',
            });
            setPortalImportProgress({ phase: 'idle', percent: 0, label: '', indeterminate: false, elapsedSeconds: 0 });
        } finally {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
            if (processingKickoffId) {
                window.clearTimeout(processingKickoffId);
            }
            if (portalImportProgressTimerRef.current) {
                window.clearInterval(portalImportProgressTimerRef.current);
                portalImportProgressTimerRef.current = null;
            }
            portalImportAbortRef.current = null;
            setPortalImporting(false);
        }
    };

    const _openPortalPreview = async () => {
        const isValid = await validatePortalPreview();
        if (!isValid) return;
        setPortalPreviewPayload(buildPortalPayload());
        setPortalPreviewReadOnly(false);
        setPortalPreviewModalOpen(true);
    };

    const openPortalTechnicalContent = async () => {
        if (!portalPreviewImportAnalysis) {
            await appAlert({
                title: 'Sin contenido técnico',
                message: 'Este portal todavía no tiene un análisis técnico importado para visionar presupuesto, APUs o recursos.',
                tone: 'warning',
            });
            return;
        }
        setPortalPreviewPayload(buildPortalPayload());
        setPortalPreviewReadOnly(true);
        setPortalPreviewModalOpen(true);
    };

    const closePortalPreviewModal = () => {
        setPortalPreviewModalOpen(false);
        setPortalPreviewReadOnly(false);
    };

    const handleSubmitPortalProduct = async (event) => {
        event.preventDefault();
        const isValid = await validatePortalPreview();
        if (!isValid) return;
        const payload = buildPortalPayload();
        await confirmPortalProductSubmit(payload);
    };

    const confirmPortalProductSubmit = async (payloadOverride = null) => {
        const payload = payloadOverride || portalPreviewPayload || buildPortalPayload();
        try {
            setProductSaving(true);
            if (portalModalMode === 'edit' && editingProductId) {
                await marketplaceApi.updateAdminProduct(editingProductId, payload);
            } else {
                await marketplaceApi.createAdminProduct(payload);
            }
            await loadProducts();
            setPortalPreviewModalOpen(false);
            setPortalPreviewPayload(null);
            setPortalPreviewReadOnly(false);
            closePortalModal();
        } catch (saveError) {
            await appAlert({
                title: portalModalMode === 'edit' ? 'No se pudo guardar el portal' : 'No se pudo crear el portal',
                message: saveError?.response?.data?.detail || 'Ocurrió un error al guardar el producto de portal de compras públicas.',
                tone: 'danger',
            });
        } finally {
            setProductSaving(false);
        }
    };

    const submitPortalProductDirectly = async () => {
        const isValid = await validatePortalPreview();
        if (!isValid) return;
        const payload = buildPortalPayload();
        await confirmPortalProductSubmit(payload);
    };

    const downloadPortalPreviewExcel = async () => {
        if (!portalPreviewImportAnalysis || portalForm.delivery_mode === 'project_only') return;
        try {
            setPortalPreviewExcelDownloading(true);
            const exportAnalysis = buildPortalExcelPreviewPayload(portalPreviewImportAnalysis);
            const response = await marketplaceApi.downloadAdminPortalImportExcelPreview({
                article_title: portalForm.titulo || 'Portal de compras públicas',
                import_analysis: exportAnalysis,
                export_context: {
                    location_label: [portalForm.pais, portalForm.provincia, portalForm.canton].filter(Boolean).join(' / ') || '-',
                    exported_at: new Date().toISOString().slice(0, 10),
                    indirect_cost_percentage: 0.2,
                    reference_code: portalForm.import_source_reference || portalForm.codigo_licitacion || '',
                    licitacion_start: portalForm.fecha_inicio_licitacion || '',
                    licitacion_end: portalForm.fecha_fin_licitacion || '',
                },
            });
            triggerBlobDownload(
                response.data,
                `${(portalForm.titulo || 'portal_compras_publicas').replace(/[^\w.-]+/g, '_')}_salida.xlsx`,
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            );
        } catch (error) {
            const message = await formatBlobApiError(error, 'Ocurrió un error al preparar el Excel de entrega del portal.');
            await appAlert({
                title: 'No se pudo generar el Excel de salida',
                message,
                tone: 'danger',
            });
        } finally {
            setPortalPreviewExcelDownloading(false);
        }
    };

    const savePortalDraft = async ({ closeAfterSave = false } = {}) => {
        const canSave = await validatePortalSave();
        if (!canSave) return;

        const payload = buildPortalPayload();
        payload.activo = Boolean(payload.activo && portalActivationReadiness.ready);

        try {
            setProductSaving(true);
            if (portalModalMode === 'edit' && editingProductId) {
                await marketplaceApi.updateAdminProduct(editingProductId, payload);
            } else {
                await marketplaceApi.createAdminProduct(payload);
            }
            await loadProducts();
            setPortalPreviewPayload(null);
            setPortalPreviewModalOpen(false);
            setPortalPreviewReadOnly(false);

            await appAlert({
                title: portalModalMode === 'edit' ? 'Cambios guardados' : 'Borrador guardado',
                message: portalActivationReadiness.ready
                    ? 'El producto quedó guardado correctamente y ya puede activarse cuando lo decidas.'
                    : 'El producto quedó guardado como borrador inactivo para que continúes más adelante.',
            });

            if (closeAfterSave || portalModalMode !== 'edit') {
                closePortalModal();
            }
        } catch (saveError) {
            await appAlert({
                title: portalModalMode === 'edit' ? 'No se pudo guardar el portal' : 'No se pudo crear el portal',
                message: saveError?.response?.data?.detail || 'Ocurrió un error al guardar el producto de portal de compras públicas.',
                tone: 'danger',
            });
        } finally {
            setProductSaving(false);
        }
    };

    const handleSubmitProduct = async (event) => {
        event.preventDefault();
        await submitUpdateProduct();
    };

    const submitUpdateProduct = async () => {
        if (!editingProductId) return;
        if (!productForm.titulo.trim()) {
            await appAlert({
                title: 'Título requerido',
                message: 'El producto necesita un título antes de guardarse.',
            });
            return;
        }
        if (!productForm.fecha_inicio_publicacion || !productForm.fecha_fin_publicacion) {
            await appAlert({
                title: 'Fechas requeridas',
                message: 'Todos los artículos requieren fecha de inicio y fin de publicación.',
            });
            return;
        }
        if (isInvalidDateRange(productForm.fecha_inicio_publicacion, productForm.fecha_fin_publicacion)) {
            await appAlert({
                title: 'Rango inválido',
                message: 'La fecha fin de publicación no puede ser anterior a la fecha de inicio.',
            });
            return;
        }

        const payload = {
            titulo: productForm.titulo.trim(),
            resumen: productForm.resumen.trim() || null,
            descripcion: productForm.descripcion_larga.trim() || null,
            precio: Number(productForm.precio || 0),
            moneda: 'USD',
            category_id: productForm.category_id ? Number(productForm.category_id) : null,
            activo: Boolean(productForm.activo),
            product_meta: {
                descripcion_corta: productForm.resumen.trim() || null,
                descripcion_larga: productForm.descripcion_larga.trim() || null,
                descripcion_completa: productForm.descripcion_completa.trim() || null,
                descuento_promocion: productForm.descuento_promocion.trim() || null,
                imagen_relevante_url: productForm.imagen_relevante_url.trim() || null,
                fecha_inicio_publicacion: productForm.fecha_inicio_publicacion,
                fecha_fin_publicacion: productForm.fecha_fin_publicacion,
            },
        };

        try {
            setProductSaving(true);
            await marketplaceApi.updateAdminProduct(editingProductId, payload);
            await loadProducts();
            closeProductEditorModal();
        } catch (saveError) {
            await appAlert({
                title: 'No se pudo guardar el producto',
                message: saveError?.response?.data?.detail || 'Ocurrió un error al guardar el producto.',
                tone: 'danger',
            });
        } finally {
            setProductSaving(false);
        }
    };

    const isGenericProductDirty = useMemo(() => (
        Boolean(productForm.titulo.trim())
        || Boolean(productForm.resumen.trim())
        || Boolean(productForm.descripcion_larga.trim())
        || Boolean(productForm.descripcion_completa.trim())
        || Boolean(productForm.descuento_promocion.trim())
        || Boolean(productForm.imagen_relevante_url.trim())
        || Boolean(productForm.precio)
        || Boolean(productForm.category_id)
        || !productForm.activo
        || productForm.fecha_inicio_publicacion !== todayIso
        || productForm.fecha_fin_publicacion !== todayIso
    ), [productForm, todayIso]);

    const isPortalProductDirty = useMemo(() => (
        Boolean(portalForm.titulo.trim())
        || Boolean(portalForm.descripcion_corta.trim())
        || Boolean(portalForm.descripcion_larga.trim())
        || Boolean(portalForm.descripcion_completa.trim())
        || Boolean(portalForm.imagen_relevante_url.trim())
        || portalForm.fecha_inicio_publicacion !== todayIso
        || portalForm.fecha_fin_publicacion !== todayIso
        || Boolean(portalForm.descuento_promocion.trim())
        || !portalForm.activo
        || Boolean(portalForm.pais.trim())
        || Boolean(portalForm.provincia.trim())
        || Boolean(portalForm.canton.trim())
        || Boolean(portalForm.direccion.trim())
        || Boolean(portalForm.precio_licitacion)
        || Boolean(portalForm.fecha_inicio_licitacion)
        || Boolean(portalForm.fecha_fin_licitacion)
        || portalForm.delivery_mode !== 'excel_and_project'
        || portalForm.import_source_kind !== 'manual'
        || Boolean(portalForm.import_source_reference.trim())
        || portalForm.import_analysis !== null
    ), [portalForm, todayIso]);

    const _requestCloseProductEditorModal = async () => {
        if (!isGenericProductDirty) {
            closeProductEditorModal();
            return;
        }
        const shouldSave = await appConfirm({
            title: 'Cerrar editor de producto',
            message: '¿Deseas guardar y cerrar? Si no, se cerrará sin guardar.',
            confirmLabel: 'Guardar y cerrar',
            cancelLabel: 'Cerrar sin guardar',
        });
        if (shouldSave) {
            if (productEditorMode === 'edit') {
                await submitUpdateProduct();
                return;
            }
            await submitCreateProduct();
            return;
        }
        closeProductEditorModal();
    };

    const requestClosePortalModal = async () => {
        if (portalImporting) {
            const shouldAbortImport = await appConfirm({
                title: 'Análisis en curso',
                message: 'Hay un análisis técnico ejecutándose. Si sales ahora, se cancelará para devolverte el control del editor. ¿Deseas continuar?',
                confirmLabel: 'Cancelar análisis',
                cancelLabel: 'Seguir esperando',
                tone: 'danger',
            });
            if (!shouldAbortImport) {
                return;
            }
            portalImportAbortRef.current?.abort?.();
            portalImportAbortRef.current = null;
            if (portalImportProgressTimerRef.current) {
                window.clearInterval(portalImportProgressTimerRef.current);
                portalImportProgressTimerRef.current = null;
            }
            setPortalImporting(false);
            setPortalImportProgress({ phase: 'idle', percent: 0, label: '', indeterminate: false, elapsedSeconds: 0 });
        }
        if (!isPortalProductDirty) {
            closePortalModal();
            return;
        }
        const decision = await appConfirm({
            title: 'Cerrar creador de portal',
            message: '¿Qué deseas hacer con los cambios del producto antes de salir del editor?',
            confirmLabel: 'Guardar y cerrar',
            secondaryLabel: 'Cerrar sin guardar',
            secondaryResult: 'discard',
            cancelLabel: 'Volver al editor',
        });
        if (decision === true) {
            await savePortalDraft({ closeAfterSave: true });
            return;
        }
        if (decision === 'discard') {
            closePortalModal();
            return;
        }
    };

    const handleToggleProductActive = async (product) => {
        try {
            await marketplaceApi.updateAdminProduct(product.id, { activo: !product.activo });
            await loadProducts();
            if (editingProductId === product.id) {
                setProductForm((current) => ({ ...current, activo: !product.activo }));
            }
        } catch (toggleError) {
            await appAlert({
                title: 'No se pudo cambiar el estado',
                message: toggleError?.response?.data?.detail || 'Ocurrió un error al cambiar el estado del producto.',
                tone: 'danger',
            });
        }
    };

    const handleDeleteProduct = async (product) => {
        const confirmed = await appConfirm({
            title: 'Borrar producto',
            message: `Vas a borrar el producto “${product.titulo}”. Esta acción no se puede deshacer.`,
            confirmLabel: 'Borrar',
            cancelLabel: 'Cancelar',
            tone: 'danger',
        });
        if (!confirmed) return;

        try {
            await marketplaceApi.deleteAdminProduct(product.id);
            await loadProducts();
            if (editingProductId === product.id) {
                closeProductEditorModal();
            }
        } catch (deleteError) {
            await appAlert({
                title: 'No se pudo borrar el producto',
                message: deleteError?.response?.data?.detail || 'Ocurrió un error al borrar el producto.',
                tone: 'danger',
            });
        }
    };

    if (!isAdmin) {
        return (
            <MarketplaceShell className="marketplace-internal-page">
                <div className="mx-auto max-w-[1200px]">
                    <MarketplaceEmptyState
                        eyebrow="Acceso restringido"
                        title="Panel Administrador"
                        description="Esta superficie queda reservada para superadministración dentro de Tienda."
                    />
                </div>
            </MarketplaceShell>
        );
    }

    return (
        <MarketplaceShell className="marketplace-internal-page h-full overflow-hidden" contentClassName="h-full min-h-0">
            <div className="mx-auto flex h-full min-h-0 w-full max-w-[1380px] flex-col gap-5 overflow-hidden">
                <header className="sticky top-0 z-20 rounded-[2rem] border border-zinc-200 bg-white px-5 py-4 shadow-[0_10px_35px_rgba(0,0,0,0.04)] md:px-6 xl:px-7">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex min-w-0 items-center gap-4 xl:gap-6">
                            <ProjectSectionIconButton
                                icon={ArrowLeft}
                                label="Volver a Tienda"
                                hintContent="Volver al catálogo de Marketplace"
                                onClick={() => navigate('/marketplace')}
                            />
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-2 xl:gap-2.5">
                                    <span className="inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
                                    <h1 className="truncate text-[1.7rem] font-black uppercase tracking-tight text-zinc-900 xl:text-[1.9rem]">
                                        Panel Administrador
                                    </h1>
                                    <span className="inline-flex rounded-xl border border-orange-100 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#F39200]">
                                        Tienda
                                    </span>
                                </div>
                                <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 xl:text-[11px]">
                                    Administracion global del marketplace clasico
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                <AdminMotionScrollArea className="flex-1">
                    <div className="grid content-start gap-3 pb-8 pr-1 md:grid-cols-2 xl:grid-cols-3">
                            {ADMIN_PANEL_OPTIONS.map((option) => {
                                const Icon = option.icon;
                                const isActive = option.key === 'licenses'
                                    ? (productsModalOpen && productTypeFilter === 'licencia')
                                    : option.key === 'categories'
                                    ? categoriesModalOpen
                                    : option.key === 'products'
                                        ? productsModalOpen
                                        : option.key === 'payment_methods'
                                            ? paymentMethodsModalOpen
                                            : systemSalesModalOpen;
                                return (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => {
                                            if (option.key === 'licenses') {
                                                openProductsModal('licencia');
                                                return;
                                            }
                                            if (option.key === 'categories') {
                                                openCategoriesModal();
                                                return;
                                            }
                                            if (option.key === 'payment_methods') {
                                                openPaymentMethodsModal();
                                                return;
                                            }
                                            if (option.key === 'system_sales') {
                                                openSystemSalesModal();
                                                return;
                                            }
                                            openProductsModal();
                                        }}
                                        aria-label={option.cta}
                                        title={option.cta}
                                        className={`group flex min-h-[148px] flex-col rounded-[1.15rem] border px-4 py-4 text-left shadow-[0_10px_24px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 md:min-h-[156px] ${isActive ? 'border-[#F39200]/35 bg-white shadow-[0_12px_28px_rgba(15,23,42,0.055)]' : 'border-zinc-100 bg-white hover:border-zinc-200'}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border ${option.tone.iconWrap}`}>
                                                <Icon className="h-4 w-4" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                    {option.eyebrow}
                                                </p>
                                                <h2 className="mt-1.5 text-[1rem] font-black uppercase leading-none tracking-tight text-[#1A1A1A] xl:text-[1.08rem]">
                                                    {option.title}
                                                </h2>
                                            </div>
                                        </div>
                                        <p className="mt-3 max-w-[38ch] text-[0.78rem] font-medium leading-relaxed text-zinc-600">
                                            {option.description}
                                        </p>
                                        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                {option.cta}
                                            </span>
                                            <span className={`inline-flex h-9 w-9 items-center justify-center rounded-[0.9rem] border shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff] transition-[color,filter,box-shadow] duration-200 group-hover:text-[#136191] group-active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff] ${isActive ? 'border-[#F39200]/25 bg-orange-50 text-[#F39200]' : 'border-[#ececec] bg-[#ededed] text-zinc-500'}`}>
                                                <ArrowUpRight className="h-4 w-4" />
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                </AdminMotionScrollArea>

                        {categoriesModalOpen ? (
            <AppModalShell
                isOpen={categoriesModalOpen}
                onClose={closeCategoriesModal}
                size="2xl"
                zIndex="z-[130]"
                panelClassName={ADMIN_MODAL_PANEL_CLASS}
                surfaceColor={ADMIN_MODAL_SURFACE}
            >
                <AppModalHeader
                    title="Categorías"
                    subtitle="Submódulo de estructura comercial de Tienda"
                    icon={Tags}
                    iconClassName="text-[#136191]"
                    iconWrapClassName="border-blue-200 bg-blue-50"
                    {...ADMIN_MODAL_HEADER_PROPS}
                    onClose={closeCategoriesModal}
                />
                <AppModalBody className={ADMIN_MODAL_BODY_CLASS}>
                <section className="flex h-full min-h-0 flex-col space-y-5">
                    <div className="rounded-[2rem] border border-blue-100 bg-[linear-gradient(135deg,rgba(239,246,255,0.95),rgba(255,255,255,0.96))] p-6">
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#136191]">Tienda / categorías</p>
                        <h3 className="mt-2 text-2xl font-black uppercase tracking-tight text-[#1A1A1A]">Estructura de categorías</h3>
                        <p className="mt-3 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">
                            El catálogo de categorías quedó cerrado temporalmente. Por ahora solo se usarán las categorías fijas definidas para Tienda.
                        </p>
                    </div>

                    {error ? (
                        <MarketplaceEmptyState
                            eyebrow="Carga fallida"
                            title="No se pudieron cargar las categorías"
                            description={error}
                            primaryActionLabel="Reintentar"
                            onPrimaryAction={loadCategories}
                        />
                    ) : (
                        <div className="space-y-6">
                            <MarketplaceSectionCard
                                eyebrow="Catálogo controlado"
                                title="Categorías bloqueadas temporalmente"
                                description="Por ahora no se pueden crear, editar ni borrar categorías. Solo se utilizarán las categorías fijas mostradas en este listado."
                            >
                                <div className="rounded-[1.35rem] border border-zinc-200 bg-zinc-50 px-4 py-4 text-sm font-medium leading-relaxed text-zinc-600">
                                    Esta restricción aplica tanto al panel como a la administración del backend. Cuando reabramos esta parte, lo haremos sobre una política de categorías ya definida.
                                </div>
                            </MarketplaceSectionCard>
                            <MarketplaceSectionCard
                                eyebrow="Listado"
                                title="Categorías registradas"
                                description="Estas son las únicas categorías activas permitidas por ahora dentro de Tienda."
                            >
                                {loading ? (
                                    <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center text-sm font-medium text-zinc-500">
                                        Cargando categorías...
                                    </div>
                                ) : categories.length === 0 ? (
                                    <MarketplaceEmptyState
                                        eyebrow="Sin categorías"
                                        title="Todavía no hay categorías"
                                        description="Crea la primera categoría del catálogo para empezar a estructurar los artículos."
                                    />
                                ) : (
                                    <div className="space-y-3">
                                        {categories.map((category) => (
                                            <div
                                                key={category.id}
                                                className="rounded-[1.5rem] border border-zinc-200 bg-zinc-50 px-4 py-4"
                                            >
                                                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                    <div className="min-w-0 space-y-2">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <span className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">
                                                                {SCOPE_LABELS[category.visibility_scope] || category.visibility_scope}
                                                            </span>
                                                            <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                                                category.activa
                                                                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                    : 'border-zinc-200 bg-white text-zinc-500'
                                                            }`}>
                                                                {category.activa ? 'Activa' : 'Inactiva'}
                                                            </span>
                                                            <span className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                Orden {category.sort_order || 0}
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <h3 className="text-lg font-black tracking-tight text-zinc-900">{category.nombre}</h3>
                                                            <p className="mt-1 text-sm font-medium text-zinc-500">
                                                                {category.descripcion || 'Sin descripción registrada.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <span className="inline-flex h-10 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                        Catálogo fijo
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </MarketplaceSectionCard>
                        </div>
                    )}
                </section>
                </AppModalBody>
            </AppModalShell>
                        ) : null}

                        {paymentMethodsModalOpen ? (
            <AppModalShell
                isOpen={paymentMethodsModalOpen}
                onClose={closePaymentMethodsModal}
                size="2xl"
                zIndex="z-[130]"
                panelClassName={ADMIN_MODAL_PANEL_CLASS}
                surfaceColor={ADMIN_MODAL_SURFACE}
            >
                <AppModalHeader
                    title="Formas de pago"
                    subtitle="Gobierno operativo de readiness, activación y configuración del checkout"
                    icon={CreditCard}
                    iconClassName="text-[#136191]"
                    iconWrapClassName="border-sky-200 bg-sky-50"
                    {...ADMIN_MODAL_HEADER_PROPS}
                    onClose={closePaymentMethodsModal}
                />
                <AppModalBody className={ADMIN_MODAL_BODY_CLASS}>
                    <section className="flex h-full min-h-0 flex-col space-y-5">
                        {paymentMethodsError ? (
                            <MarketplaceEmptyState
                                eyebrow="Carga fallida"
                                title="No se pudieron cargar las formas de pago"
                                description={paymentMethodsError}
                                primaryActionLabel="Reintentar"
                                onPrimaryAction={loadPaymentMethods}
                            />
                        ) : (
                            <MarketplaceSectionCard
                                eyebrow="Checkout"
                                title="Formas de pago del sistema"
                                description="Activa solo métodos completos. Los compradores solo verán métodos activos y con readiness válido."
                                className="flex min-h-0 flex-1 flex-col"
                                contentClassName="mt-0 flex min-h-0 flex-1 flex-col"
                            >
                                {paymentMethodsLoading ? (
                                    <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center text-sm font-medium text-zinc-500">
                                        Cargando formas de pago...
                                    </div>
                                ) : (
                                    <AdminMotionScrollArea className="flex-1" contentClassName="space-y-4">
                                        {paymentMethods.map((method) => {
                                            const readinessClass = PAYMENT_METHOD_READINESS_STYLES[method.readiness_status] || 'border-zinc-200 bg-zinc-50 text-zinc-600';
                                            const fields = PAYMENT_METHOD_FIELD_GROUPS[method.slug] || [];
                                            const savingThisMethod = paymentMethodSavingSlug === method.slug;
                                            return (
                                                <div key={method.id} className="rounded-[1.6rem] border border-zinc-200 bg-zinc-50/60 p-4">
                                                    <div className="flex flex-col gap-4 border-b border-zinc-200/80 pb-4 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-lg font-black tracking-tight text-zinc-900">{method.nombre}</h3>
                                                                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${readinessClass}`}>
                                                                    {PAYMENT_METHOD_READINESS_LABELS[method.readiness_status] || method.readiness_status}
                                                                </span>
                                                            </div>
                                                            <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-600">
                                                                {method.descripcion || 'Sin descripción operativa.'}
                                                            </p>
                                                        </div>
                                                        <div className="grid gap-3 sm:grid-cols-2">
                                                            <AdminHeaderToggle
                                                                label="Disponibilidad"
                                                                checked={Boolean(method.is_active)}
                                                                onChange={() => handlePaymentMethodMetaChange(method.slug, 'is_active', !method.is_active)}
                                                                activeLabel="Activo"
                                                                inactiveLabel="Inactivo"
                                                                helper="Solo métodos activos y listos aparecen en el checkout."
                                                            />
                                                            <label className="space-y-2">
                                                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Entorno</span>
                                                                <div className="relative">
                                                                    <AnimatedSelect
                                                                        value={method.environment_mode || 'sandbox'}
                                                                        onChange={(event) => handlePaymentMethodMetaChange(method.slug, 'environment_mode', event.target.value)}
                                                                        onWheel={preventWheelSelectChange}
                                                                        className={ADMIN_SELECT_CLASS}
                                                                    >
                                                                        <option value="sandbox">Sandbox</option>
                                                                        <option value="production">Producción</option>
                                                                        <option value="manual">Manual</option>
                                                                    </AnimatedSelect>
                                                                    <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400">
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    </span>
                                                                </div>
                                                            </label>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                                                        {fields.map((field) => (
                                                            <label key={field.key} className={`space-y-2 ${field.type === 'textarea' ? 'md:col-span-2' : ''}`}>
                                                                <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{field.label}</span>
                                                                {field.type === 'textarea' ? (
                                                                    <textarea
                                                                        value={String(method.config_json?.[field.key] || '')}
                                                                        onChange={(event) => handlePaymentMethodFieldChange(method.slug, field.key, event.target.value)}
                                                                        className={`${ADMIN_TEXTAREA_CLASS} min-h-[72px]`}
                                                                    />
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={String(method.config_json?.[field.key] || '')}
                                                                        onChange={(event) => handlePaymentMethodFieldChange(method.slug, field.key, event.target.value)}
                                                                        className={ADMIN_FIELD_CLASS}
                                                                    />
                                                                )}
                                                            </label>
                                                        ))}
                                                    </div>
                                                    <div className="mt-4 flex justify-end">
                                                        <AdminModalFooterButton
                                                            onClick={() => handleSavePaymentMethod(method)}
                                                            disabled={savingThisMethod}
                                                            variant="primary"
                                                        >
                                                            {savingThisMethod ? 'Guardando...' : 'Guardar ajustes'}
                                                        </AdminModalFooterButton>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </AdminMotionScrollArea>
                                )}
                            </MarketplaceSectionCard>
                        )}
                    </section>
                </AppModalBody>
            </AppModalShell>
                        ) : null}

                        {systemSalesModalOpen ? (
            <AppModalShell
                isOpen={systemSalesModalOpen}
                onClose={closeSystemSalesModal}
                size="2xl"
                zIndex="z-[130]"
                panelClassName={ADMIN_MODAL_PANEL_CLASS}
                surfaceColor={ADMIN_MODAL_SURFACE}
            >
                <AppModalHeader
                    title="Ventas Sistema"
                    subtitle="Seguimiento de pedidos marketplace y validación manual de transferencias"
                    icon={ShoppingBag}
                    iconClassName="text-[#F39200]"
                    iconWrapClassName="border-orange-200 bg-orange-50"
                    {...ADMIN_MODAL_HEADER_PROPS}
                    onClose={closeSystemSalesModal}
                />
                <AppModalBody className={ADMIN_MODAL_BODY_CLASS}>
                    <section className="flex h-full min-h-0 flex-col space-y-5">
                        {adminOrdersError ? (
                            <MarketplaceEmptyState
                                eyebrow="Carga fallida"
                                title="No se pudieron cargar las ventas del sistema"
                                description={adminOrdersError}
                                primaryActionLabel="Reintentar"
                                onPrimaryAction={loadAdminOrders}
                            />
                        ) : (
                            <MarketplaceSectionCard
                                eyebrow="Pedidos"
                                title="Ventas y transferencias"
                                description="Aquí se revisan pedidos del sistema y, en esta primera fase, se validan o rechazan transferencias bancarias pendientes."
                                className="flex min-h-0 flex-1 flex-col"
                                contentClassName="mt-0 flex min-h-0 flex-1 flex-col"
                            >
                                <div className="mb-5 rounded-[1.6rem] border border-[#136191]/15 bg-[#F5FAFD] p-4">
                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">Housekeeping de pagos</p>
                                            <h3 className="mt-1 text-lg font-black tracking-tight text-zinc-900">Automatismos y conciliación operativa</h3>
                                            <p className="mt-1 max-w-2xl text-sm font-medium leading-relaxed text-zinc-600">
                                                Resume drafts vencidos, transferencias bancarias fuera de plazo y pedidos todavía dentro de ventana automática de devolución.
                                            </p>
                                        </div>
                                        <AdminModalFooterButton
                                            onClick={runPaymentHousekeeping}
                                            disabled={paymentHousekeepingRunning}
                                            variant="info"
                                        >
                                            {paymentHousekeepingRunning ? 'Ejecutando...' : 'Ejecutar housekeeping'}
                                        </AdminModalFooterButton>
                                    </div>
                                    <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                        <div className="rounded-2xl border border-white bg-white px-4 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Drafts abiertos</p>
                                            <p className="mt-1 text-lg font-black text-zinc-900">
                                                {paymentHousekeepingLoading ? '...' : Number(paymentHousekeeping?.open_checkout_drafts_count || 0)}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-zinc-500">
                                                {paymentHousekeepingLoading
                                                    ? 'Leyendo estado operativo...'
                                                    : `${Number(paymentHousekeeping?.stale_checkout_drafts_count || 0)} vencido(s) pendiente(s) de sweep`}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white bg-white px-4 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Transferencias pendientes</p>
                                            <p className="mt-1 text-lg font-black text-zinc-900">
                                                {paymentHousekeepingLoading ? '...' : Number(paymentHousekeeping?.awaiting_manual_validation_count || 0)}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-zinc-500">
                                                {paymentHousekeepingLoading
                                                    ? 'Leyendo estado operativo...'
                                                    : `${Number(paymentHousekeeping?.stale_bank_transfer_orders_count || 0)} fuera de plazo operativo`}
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white bg-white px-4 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Pagos online en espera</p>
                                            <p className="mt-1 text-lg font-black text-zinc-900">
                                                {paymentHousekeepingLoading ? '...' : Number(paymentHousekeeping?.online_payment_waiting_count || 0)}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-zinc-500">
                                                PayPhone y PayPal todavía sin confirmación final.
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-white bg-white px-4 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Ventanas de devolución</p>
                                            <p className="mt-1 text-lg font-black text-zinc-900">
                                                {paymentHousekeepingLoading ? '...' : Number(paymentHousekeeping?.orders_with_open_refund_window_count || 0)}
                                            </p>
                                            <p className="mt-1 text-xs font-medium text-zinc-500">
                                                {paymentHousekeeping?.generated_at
                                                    ? `Actualizado ${paymentHousekeeping.generated_at}`
                                                    : 'Sin resumen calculado todavía'}
                                            </p>
                                        </div>
                                    </div>
                                    {!paymentHousekeepingLoading && (
                                        <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Último sweep ejecutado en esta sesión</p>
                                            <p className="mt-1 text-sm font-black text-zinc-700">
                                                {Number(paymentHousekeeping?.expired_checkout_drafts_count || 0)} drafts expirado(s) · {Number(paymentHousekeeping?.expired_bank_transfer_orders_count || 0)} transferencia(s) vencida(s)
                                            </p>
                                        </div>
                                    )}
                                </div>
                                <div className="mb-5 grid gap-3 lg:grid-cols-[minmax(0,1.5fr)_220px_220px]">
                                    <label className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Buscar</span>
                                        <input
                                            type="text"
                                            value={adminOrdersQuery}
                                            onChange={(event) => setAdminOrdersQuery(event.target.value)}
                                            placeholder="Pedido, comprador, empresa o referencia"
                                            className="h-11 w-full rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 outline-none transition-colors focus:border-[#136191]"
                                        />
                                    </label>
                                    <label className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Estado</span>
                                        <AnimatedSelect
                                            value={adminOrdersStatusFilter}
                                            onChange={(event) => setAdminOrdersStatusFilter(event.target.value)}
                                            className={ADMIN_SELECT_CLASS}
                                        >
                                            <option value="all">Todos</option>
                                            <option value="awaiting_manual_validation">Pendiente validación</option>
                                            <option value="completed">Completado</option>
                                            <option value="payment_rejected">Pago rechazado</option>
                                            <option value="expired">Expirado</option>
                                            <option value="refunded">Reembolsado</option>
                                        </AnimatedSelect>
                                    </label>
                                    <label className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Método</span>
                                        <AnimatedSelect
                                            value={adminOrdersMethodFilter}
                                            onChange={(event) => setAdminOrdersMethodFilter(event.target.value)}
                                            className={ADMIN_SELECT_CLASS}
                                        >
                                            <option value="all">Todos</option>
                                            <option value="bank_transfer">Transferencia bancaria</option>
                                            <option value="paypal">PayPal</option>
                                            <option value="payphone">PayPhone</option>
                                        </AnimatedSelect>
                                    </label>
                                </div>
                                {adminOrdersLoading ? (
                                    <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center text-sm font-medium text-zinc-500">
                                        Cargando ventas del sistema...
                                    </div>
                                ) : filteredAdminOrders.length === 0 ? (
                                    <MarketplaceEmptyState
                                        eyebrow="Sin pedidos"
                                        title="No hay ventas para esta combinación"
                                        description="Ajusta búsqueda, método o estado para volver a ver pedidos del marketplace."
                                    />
                                ) : (
                                    <AdminMotionScrollArea className="flex-1" contentClassName="space-y-4">
                                        {filteredAdminOrders.map((order) => {
                                            const paymentMethodKey = String(order.payment_method || '').toLowerCase();
                                            const pendingValidation = String(order.status || '').toLowerCase() === 'awaiting_manual_validation'
                                                && paymentMethodKey === 'bank_transfer';
                                            const paymentMethodLabel = resolveMarketplacePaymentMethodLabel(order.payment_method);
                                            const paymentStatusLabel = resolveMarketplacePaymentStatusLabel({
                                                orderStatus: order.status,
                                                paymentStatus: order.payment_status,
                                                paymentMethod: order.payment_method,
                                            });
                                            const acting = adminOrderActionId === order.id;
                                            return (
                                                <div key={order.id} className="rounded-[1.6rem] border border-zinc-200 bg-zinc-50/60 p-4">
                                                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                                                        <div className="min-w-0">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <h3 className="text-lg font-black tracking-tight text-zinc-900">Pedido #{order.id}</h3>
                                                                <span className={`inline-flex rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${
                                                                    pendingValidation
                                                                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                                                                        : String(order.status || '').toLowerCase() === 'completed'
                                                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                                                            : String(order.status || '').toLowerCase() === 'expired'
                                                                                ? 'border-zinc-300 bg-zinc-100 text-zinc-700'
                                                                            : String(order.status || '').toLowerCase() === 'refunded'
                                                                                ? 'border-sky-200 bg-sky-50 text-sky-700'
                                                                            : 'border-zinc-200 bg-white text-zinc-600'
                                                                }`}>
                                                                    {pendingValidation
                                                                        ? 'Pendiente validación'
                                                                        : (order.status || 'Sin estado')}
                                                                </span>
                                                                <span className="inline-flex rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                    {paymentMethodLabel}
                                                                </span>
                                                            </div>
                                                            <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
                                                                {order.buyer_name || 'Sin comprador visible'} · {order.buyer_company_name || 'Sin empresa visible'}
                                                            </p>
                                                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">
                                                                {order.items_count || 0} item(s) · {order.transfer_reference
                                                                    ? `Ref. ${order.transfer_reference}`
                                                                    : order.provider_transaction_id
                                                                        ? `Tx. ${order.provider_transaction_id}`
                                                                        : 'Sin referencia visible'}
                                                            </p>
                                                        </div>
                                                        <div className="rounded-[1.25rem] border border-zinc-200 bg-white px-4 py-3 text-right">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Importe</p>
                                                            <p className="mt-1 text-xl font-black text-zinc-900">{Number(order.total || 0).toFixed(2)} {order.currency || 'USD'}</p>
                                                        </div>
                                                    </div>
                                                    {order.notes ? (
                                                        <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-3">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Nota operativa</p>
                                                            <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-700">{order.notes}</p>
                                                        </div>
                                                    ) : null}
                                                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                                                        <div className="rounded-2xl border border-white bg-white px-4 py-3">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Estado de pago</p>
                                                            <p className="mt-1 text-sm font-black text-zinc-700">{paymentStatusLabel}</p>
                                                        </div>
                                                        <div className="rounded-2xl border border-white bg-white px-4 py-3">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                                                {paymentMethodKey === 'bank_transfer' ? 'Fecha reportada' : 'Referencia proveedor'}
                                                            </p>
                                                            <p className="mt-1 text-sm font-black text-zinc-700">
                                                                {paymentMethodKey === 'bank_transfer'
                                                                    ? (order.transfer_date || 'No reportada')
                                                                    : (order.provider_transaction_id || 'No reportada')}
                                                            </p>
                                                            {order.authorization_code ? (
                                                                <p className="mt-1 text-xs font-medium text-zinc-500">Autorización: {order.authorization_code}</p>
                                                            ) : null}
                                                        </div>
                                                        <div className="rounded-2xl border border-white bg-white px-4 py-3">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Última revisión</p>
                                                            <p className="mt-1 text-sm font-black text-zinc-700">{order.payment_reviewed_at || 'Sin revisión'}</p>
                                                            {order.payment_reviewed_by_name ? (
                                                                <p className="mt-1 text-xs font-medium text-zinc-500">Por {order.payment_reviewed_by_name}</p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    {order.payment_latest_event ? (
                                                        <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-3">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Última señal de pago</p>
                                                            <p className="mt-1 text-sm font-black text-zinc-700">{order.payment_latest_event}</p>
                                                            <p className="mt-1 text-xs font-medium text-zinc-500">{order.payment_latest_event_at || 'Sin fecha visible'}</p>
                                                        </div>
                                                    ) : null}
                                                    <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-3">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Devolución automática</p>
                                                        {order.refundable_items_count > 0 ? (
                                                            <>
                                                                <p className="mt-1 text-sm font-black text-zinc-700">
                                                                    {order.refund_window_open
                                                                        ? `Ventana abierta · ${order.refundable_items_count} item(s)`
                                                                        : 'Sin ventana activa'}
                                                                </p>
                                                                <p className="mt-2 text-xs font-medium leading-relaxed text-zinc-500">
                                                                    {order.refund_window_open
                                                                        ? `La devolución automática sigue disponible hasta ${order.refund_deadline_at || 'el cierre de la ventana'}.`
                                                                        : 'Si hace falta resolver una excepción, la devolución tendrá que gobernarse de forma manual.'}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="mt-1 text-sm font-medium text-zinc-500">
                                                                Este pedido no entra en categorías con devolución automática.
                                                            </p>
                                                        )}
                                                    </div>
                                                    {pendingValidation ? (
                                                        <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-3">
                                                            <label className="space-y-2">
                                                                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Observación administrativa</span>
                                                                <textarea
                                                                    value={String(adminOrderNotes[order.id] || '')}
                                                                    onChange={(event) => setAdminOrderNotes((current) => ({ ...current, [order.id]: event.target.value }))}
                                                                    rows={3}
                                                                    placeholder="Anota validación, referencia externa o motivo de rechazo..."
                                                                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 outline-none transition-colors focus:border-[#136191]"
                                                                />
                                                            </label>
                                                        </div>
                                                    ) : order.admin_notes ? (
                                                        <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-3">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Observación administrativa</p>
                                                            <p className="mt-1 text-sm font-medium leading-relaxed text-zinc-700">{order.admin_notes}</p>
                                                        </div>
                                                    ) : null}
                                                    {String(order.status || '').toLowerCase() === 'refunded' ? (
                                                        <div className="mt-4 rounded-2xl border border-white bg-white px-4 py-3">
                                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Resolución de reembolso</p>
                                                            <p className="mt-1 text-sm font-black text-zinc-700">
                                                                {order.refund_mode === 'manual_override' ? 'Override manual desde Ventas Sistema' : 'Devolución automática del comprador'}
                                                            </p>
                                                            <p className="mt-1 text-xs font-medium leading-relaxed text-zinc-500">
                                                                {order.refunded_at || 'Sin fecha visible'}
                                                                {order.refunded_by_name ? ` · Por ${order.refunded_by_name}` : ''}
                                                                {order.refund_reason ? ` · ${order.refund_reason}` : ''}
                                                            </p>
                                                            {order.refund_provider_resolution_status ? (
                                                                <p className="mt-2 text-xs font-semibold leading-relaxed text-zinc-600">
                                                                    {resolveMarketplaceRefundResolutionLabel(order.refund_provider_resolution_status)}
                                                                    {order.refund_provider_resolution_note ? ` · ${order.refund_provider_resolution_note}` : ''}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
                                                    {pendingValidation ? (
                                                        <div className="mt-4 flex flex-wrap gap-3">
                                                            <AdminModalFooterButton
                                                                onClick={() => handleApproveBankTransfer(order)}
                                                                disabled={acting}
                                                                variant="primary"
                                                                className="h-10 px-4 text-[11px]"
                                                            >
                                                                {acting ? 'Procesando...' : 'Validar transferencia'}
                                                            </AdminModalFooterButton>
                                                            <AdminModalFooterButton
                                                                onClick={() => handleRejectBankTransfer(order)}
                                                                disabled={acting}
                                                                variant="danger"
                                                                className="h-10 px-4 text-[11px]"
                                                            >
                                                                Rechazar
                                                            </AdminModalFooterButton>
                                                        </div>
                                                    ) : String(order.status || '').toLowerCase() === 'completed' ? (
                                                        <div className="mt-4 flex flex-wrap gap-3">
                                                            <AdminModalFooterButton
                                                                onClick={() => handleRefundAdminOrder(order)}
                                                                disabled={acting}
                                                                variant="info"
                                                                className="h-10 px-4 text-[11px]"
                                                            >
                                                                {acting ? 'Procesando...' : 'Reembolsar pedido'}
                                                            </AdminModalFooterButton>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </AdminMotionScrollArea>
                                )}
                            </MarketplaceSectionCard>
                        )}
                    </section>
                </AppModalBody>
            </AppModalShell>
                        ) : null}

                        {productsModalOpen ? (
            <AppModalShell
                isOpen={productsModalOpen}
                onClose={closeProductsModal}
                size="2xl"
                zIndex="z-[130]"
                panelClassName="h-[92dvh] max-h-[92dvh] max-w-[92vw] flex flex-col bg-[#f7f7f5]"
                surfaceColor={ADMIN_MODAL_SURFACE}
            >
                <AppModalHeader
                    title="Productos"
                    subtitle="Submódulo administrativo del catálogo global de Tienda"
                    icon={Package}
                    iconClassName="text-[#F39200]"
                    iconWrapClassName="border-orange-200 bg-orange-50"
                    {...ADMIN_MODAL_HEADER_PROPS}
                    onClose={closeProductsModal}
                />
                <AppModalBody className={ADMIN_MODAL_BODY_CLASS}>
                <section className="flex min-h-0 flex-1 flex-col space-y-5">
                    {productsError ? (
                        <MarketplaceEmptyState
                            eyebrow="Carga fallida"
                            title="No se pudieron cargar los productos"
                            description={productsError}
                            primaryActionLabel="Reintentar"
                            onPrimaryAction={loadProducts}
                        />
                    ) : (
                            <MarketplaceSectionCard
                                className="flex min-h-0 flex-1 flex-col"
                                contentClassName="mt-0 flex min-h-0 flex-1 flex-col"
                            >
                                <div className="mb-5 flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Listado global</p>
                                        <h3 className="mt-2 text-2xl font-black tracking-tight text-zinc-900">
                                            {productTypeFilter === 'licencia' ? 'Licencias SaaS registradas' : 'Productos registrados'}
                                        </h3>
                                        {productTypeFilter === 'licencia' ? (
                                            <p className="mt-2 max-w-3xl text-sm font-medium leading-relaxed text-zinc-600">
                                                Aquí se gobiernan las licencias comerciales visibles para administradores de empresa dentro de Tienda.
                                            </p>
                                        ) : null}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-3">
                                        <div className="inline-flex h-11 items-center rounded-2xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                            {filteredProducts.length} de {products.length} productos
                                        </div>
                                        <div ref={productTypeMenuRef} className="relative">
                                        <button
                                            type="button"
                                            onClick={() => setProductTypeMenuOpen((current) => !current)}
                                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-700 transition-colors hover:border-[#136191] hover:text-[#136191]"
                                            title="Crear producto"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                        {productTypeMenuOpen ? (
                                            <div className="absolute right-0 top-[calc(100%+0.75rem)] z-20 w-[320px] rounded-[1.75rem] border border-zinc-200 bg-white p-3 shadow-[0_24px_50px_rgba(15,23,42,0.12)]">
                                                <p className="px-2 pb-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Crear producto</p>
                                                <div className="space-y-2">
                                                    {availableAdminProductTypeOptions.map((option) => (
                                                        <button
                                                            key={option.value}
                                                            type="button"
                                                            onClick={() => {
                                                                if (option.value === 'portal_compras_publicas') {
                                                                    openPortalCreateModal();
                                                                    return;
                                                                }
                                                                openGenericCreateModal(option.value);
                                                            }}
                                                            className="w-full rounded-[1.2rem] border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-colors hover:border-[#136191] hover:bg-white"
                                                        >
                                                            <p className="text-sm font-black text-zinc-900">{option.label}</p>
                                                            <p className="mt-1 text-xs font-medium text-zinc-500">{option.helper}</p>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : null}
                                    </div>
                                    </div>
                                </div>
                                <div className="mb-6 grid gap-3 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,0.8fr)_minmax(0,1fr)]">
                                    <label className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Categoría</span>
                                        <div className="relative">
                                            <AnimatedSelect
                                                value={productCategoryFilter}
                                                onChange={(event) => setProductCategoryFilter(event.target.value)}
                                                onWheel={preventWheelSelectChange}
                                                className={ADMIN_SELECT_CLASS}
                                            >
                                                <option value="all">Todas</option>
                                                {selectableCategories.map((category) => (
                                                    <option key={category.id} value={String(category.id)}>
                                                        {category.nombre}
                                                    </option>
                                                ))}
                                            </AnimatedSelect>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400">
                                                <ChevronDown className="h-4 w-4" />
                                            </span>
                                        </div>
                                    </label>
                                    <label className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Tipo</span>
                                        <div className="relative">
                                            <AnimatedSelect
                                                value={productTypeFilter}
                                                onChange={(event) => setProductTypeFilter(event.target.value)}
                                                onWheel={preventWheelSelectChange}
                                                className={ADMIN_SELECT_CLASS}
                                            >
                                                <option value="all">Todos</option>
                                                {availableAdminProductTypeOptions.map((option) => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </AnimatedSelect>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400">
                                                <ChevronDown className="h-4 w-4" />
                                            </span>
                                        </div>
                                    </label>
                                    <label className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Estado</span>
                                        <div className="relative">
                                            <AnimatedSelect
                                                value={productStatusFilter}
                                                onChange={(event) => setProductStatusFilter(event.target.value)}
                                                onWheel={preventWheelSelectChange}
                                                className={ADMIN_SELECT_CLASS}
                                            >
                                                <option value="all">Todos</option>
                                                <option value="active">Activos</option>
                                                <option value="inactive">Inactivos</option>
                                                <option value="draft">Borradores</option>
                                            </AnimatedSelect>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400">
                                                <ChevronDown className="h-4 w-4" />
                                            </span>
                                        </div>
                                    </label>
                                    <label className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Ordenar</span>
                                        <div className="relative">
                                            <AnimatedSelect
                                                value={productSort}
                                                onChange={(event) => setProductSort(event.target.value)}
                                                onWheel={preventWheelSelectChange}
                                                className={ADMIN_SELECT_CLASS}
                                            >
                                                <option value="created_desc">Fecha de creación: más reciente</option>
                                                <option value="created_asc">Fecha de creación: más antigua</option>
                                                <option value="publication_start_desc">Inicio publicación: más reciente</option>
                                                <option value="publication_start_asc">Inicio publicación: más antigua</option>
                                                <option value="publication_end_desc">Fin publicación: más reciente</option>
                                                <option value="publication_end_asc">Fin publicación: más antigua</option>
                                                <option value="price_desc">Precio: mayor a menor</option>
                                                <option value="price_asc">Precio: menor a mayor</option>
                                                <option value="title_asc">Título: A-Z</option>
                                                <option value="title_desc">Título: Z-A</option>
                                            </AnimatedSelect>
                                            <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400">
                                                <ChevronDown className="h-4 w-4" />
                                            </span>
                                        </div>
                                    </label>
                                </div>
                                {productsLoading ? (
                                    <div className="rounded-[1.5rem] border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center text-sm font-medium text-zinc-500">
                                        Cargando productos...
                                    </div>
                                ) : products.length === 0 ? (
                                    <MarketplaceEmptyState
                                        eyebrow="Sin productos"
                                        title="Todavía no hay productos registrados"
                                        description="Cuando existan publicaciones en Tienda, aquí aparecerá el listado global para administración."
                                    />
                                ) : filteredProducts.length === 0 ? (
                                    <MarketplaceEmptyState
                                        eyebrow="Sin coincidencias"
                                        title="No hay productos para esta combinación de filtros"
                                        description="Ajusta categoría, tipo, estado u ordenación para volver a ver resultados."
                                        primaryActionLabel="Limpiar filtros"
                                        onPrimaryAction={() => {
                                            setProductCategoryFilter('all');
                                            setProductTypeFilter('all');
                                            setProductStatusFilter('all');
                                            setProductSort('created_desc');
                                        }}
                                    />
                                ) : (
                                    <div className="min-h-0 flex-1 overflow-hidden rounded-[2rem] border border-zinc-200/60 bg-zinc-50/30">
                                        <AdminMotionScrollArea
                                            className="max-h-[calc(92dvh-23rem)]"
                                            contentClassName="overflow-x-auto pb-4"
                                        >
                                        <table className="w-full min-w-[1420px] text-left">
                                            <thead className="bg-zinc-50 border-b border-zinc-200/60">
                                                <tr>
                                                    <th className="sticky top-0 z-10 bg-zinc-50 px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Producto</th>
                                                    <th className="sticky top-0 z-10 bg-zinc-50 px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Propietario</th>
                                                    <th className="sticky top-0 z-10 bg-zinc-50 px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Categoría</th>
                                                    <th className="sticky top-0 z-10 bg-zinc-50 px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Inicio publicación</th>
                                                    <th className="sticky top-0 z-10 bg-zinc-50 px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Fin publicación</th>
                                                    <th className="sticky top-0 z-10 bg-zinc-50 px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 text-center">Estado</th>
                                                    <th className="sticky top-0 z-10 bg-zinc-50 px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400">Precio</th>
                                                    <th className="sticky top-0 z-10 bg-zinc-50 px-8 py-5 text-[9px] font-black uppercase tracking-[0.25em] text-zinc-400 text-center">Acciones</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-zinc-200/60">
                                                {filteredProducts.map((product) => {
                                                    const publicationWindow = getProductPublicationWindow(product);
                                                    const productAdminStatus = getProductAdminStatus(product);
                                                    return (
                                                    <tr key={product.id} className="group hover:bg-white transition-colors">
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-xs font-black uppercase text-[#1A1A1A]">{product.titulo}</span>
                                                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">ID: {product.id}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-xs font-bold text-zinc-600">{product.seller?.nombre_completo || 'Sin propietario'}</span>
                                                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">{product.seller?.rol || 'Rol no definido'}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className="px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border bg-blue-50 border-blue-100 text-[#136191] w-fit inline-flex">
                                                                {product.category?.nombre || 'Sin categoría'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className="text-xs font-bold text-zinc-700">
                                                                {publicationWindow.start || 'Sin fecha'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <span className="text-xs font-bold text-zinc-700">
                                                                {publicationWindow.end || 'Sin fecha'}
                                                            </span>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <div className="flex justify-center">
                                                                {productAdminStatus === 'active' ? (
                                                                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 border border-green-100 rounded-lg">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                                                        <span className="text-[8px] font-black text-green-700 uppercase tracking-widest">Activo</span>
                                                                    </div>
                                                                ) : productAdminStatus === 'draft' ? (
                                                                    <div className="flex items-center gap-2 px-3 py-1 rounded-lg border border-amber-100 bg-amber-50">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                                                        <span className="text-[8px] font-black uppercase tracking-widest text-amber-700">Borrador</span>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex items-center gap-2 px-3 py-1 bg-red-50 border border-red-100 rounded-lg">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                                                                        <span className="text-[8px] font-black text-red-700 uppercase tracking-widest">Inactivo</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6">
                                                            <div className="flex flex-col gap-0.5">
                                                                <span className="text-xs font-black text-zinc-700">{Number(product.precio || 0).toFixed(2)} {product.moneda || 'USD'}</span>
                                                                <span className="text-[8px] font-bold text-zinc-400 uppercase tracking-widest">Ventas: {product.ventas_count || 0}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-6 text-center">
                                                            <div className="flex items-center justify-center gap-1.5">
                                                                <ProjectSectionIconButton
                                                                    icon={PencilLine}
                                                                    label="Editar"
                                                                    hintContent="Editar producto"
                                                                    onClick={() => handleEditProduct(product)}
                                                                    className="h-9 w-9"
                                                                    iconClassName="h-3.5 w-3.5"
                                                                />
                                                                <ProjectSectionIconButton
                                                                    icon={Power}
                                                                    label={product.activo ? 'Desactivar' : 'Activar'}
                                                                    hintContent={product.activo ? 'Desactivar producto' : 'Activar producto'}
                                                                    onClick={() => handleToggleProductActive(product)}
                                                                    className={`h-9 w-9 ${product.activo ? 'border-amber-200 bg-amber-50 text-amber-700 hover:text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:text-emerald-700'}`}
                                                                    iconClassName="h-3.5 w-3.5"
                                                                />
                                                                <ProjectSectionIconButton
                                                                    icon={Trash2}
                                                                    label="Borrar"
                                                                    hintContent="Borrar producto"
                                                                    onClick={() => handleDeleteProduct(product)}
                                                                    className="h-9 w-9 border-red-200 bg-white text-red-700 hover:text-red-700"
                                                                    iconClassName="h-3.5 w-3.5"
                                                                />
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );})}
                                            </tbody>
                                        </table>
                                        </AdminMotionScrollArea>
                                    </div>
                                )}
                            </MarketplaceSectionCard>
                    )}
                </section>
                </AppModalBody>
            </AppModalShell>
                        ) : null}
            </div>

            <AppModalShell
                isOpen={productEditorModalOpen}
                onClose={closeProductEditorModal}
                size="xl"
                zIndex="z-[130]"
                panelClassName="max-h-[86dvh] flex flex-col bg-[#f7f7f5]"
                surfaceColor={ADMIN_MODAL_SURFACE}
            >
                <AppModalHeader
                    title={productEditorMode === 'edit' ? 'Editar producto' : 'Crear producto'}
                    subtitle={productEditorMode === 'edit'
                        ? 'Edición administrativa de producto'
                        : `Nuevo ${ADMIN_PRODUCT_TYPE_OPTIONS.find((item) => item.value === creatingProductType)?.label || 'producto'}`}
                    icon={Package}
                    iconClassName="text-[#F39200]"
                    iconWrapClassName="border-orange-200 bg-orange-50"
                    {...ADMIN_MODAL_HEADER_PROPS}
                    onClose={closeProductEditorModal}
                />
                <AppModalBody className={ADMIN_MODAL_BODY_CLASS}>
                    <AdminMotionScrollArea className="h-full">
                    <form id="generic-product-form" onSubmit={productEditorMode === 'edit' ? handleSubmitProduct : handleCreateProduct} className="grid min-h-0 content-start gap-4">
                        <AdminModalSection eyebrow="Producto" title="Meta común del producto" icon={Package} accent="orange">
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <label className="space-y-2 md:col-span-2">
                                    <span className={ADMIN_LABEL_CLASS}>Título comercial</span>
                                    <input
                                        type="text"
                                        value={productForm.titulo}
                                        onChange={(event) => setProductForm((current) => ({ ...current, titulo: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className={ADMIN_LABEL_CLASS}>Descripción corta</span>
                                    <textarea
                                        value={productForm.resumen}
                                        onChange={(event) => setProductForm((current) => ({ ...current, resumen: event.target.value }))}
                                        className={`${ADMIN_TEXTAREA_CLASS} min-h-[58px]`}
                                    />
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className={ADMIN_LABEL_CLASS}>Descripción larga</span>
                                    <textarea
                                        value={productForm.descripcion_larga}
                                        onChange={(event) => setProductForm((current) => ({ ...current, descripcion_larga: event.target.value }))}
                                        className={`${ADMIN_TEXTAREA_CLASS} min-h-[74px]`}
                                    />
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className={ADMIN_LABEL_CLASS}>Descripción completa</span>
                                    <textarea
                                        value={productForm.descripcion_completa}
                                        onChange={(event) => setProductForm((current) => ({ ...current, descripcion_completa: event.target.value }))}
                                        className={`${ADMIN_TEXTAREA_CLASS} min-h-[92px]`}
                                    />
                                </label>

                                <label className="space-y-2 md:col-span-2">
                                    <span className={ADMIN_LABEL_CLASS}>Imagen relevante</span>
                                    <input
                                        type="text"
                                        value={productForm.imagen_relevante_url}
                                        onChange={(event) => setProductForm((current) => ({ ...current, imagen_relevante_url: event.target.value }))}
                                        placeholder="https://..."
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className={ADMIN_LABEL_CLASS}>Precio comercial</span>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={productForm.precio}
                                        onChange={(event) => setProductForm((current) => ({ ...current, precio: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className={ADMIN_LABEL_CLASS}>Descuento / promoción</span>
                                    <input
                                        type="text"
                                        value={productForm.descuento_promocion}
                                        onChange={(event) => setProductForm((current) => ({ ...current, descuento_promocion: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className={ADMIN_LABEL_CLASS}>Inicio de publicación</span>
                                    <AnimatedDateInput
                                        type="date"
                                        value={productForm.fecha_inicio_publicacion}
                                        onChange={(event) => setProductForm((current) => ({ ...current, fecha_inicio_publicacion: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>

                                <label className="space-y-2">
                                    <span className={ADMIN_LABEL_CLASS}>Fin de publicación</span>
                                    <AnimatedDateInput
                                        type="date"
                                        value={productForm.fecha_fin_publicacion}
                                        onChange={(event) => setProductForm((current) => ({ ...current, fecha_fin_publicacion: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>
                            </div>
                        </AdminModalSection>

                        <AdminModalSection eyebrow="Control" title="Configuración del producto" icon={Tags} accent="blue">
                            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_320px]">
                                <label className="space-y-2">
                                    <span className={ADMIN_LABEL_CLASS}>Categoría</span>
                                    <div className="relative">
                                        <AnimatedSelect
                                            value={productForm.category_id}
                                            onChange={(event) => setProductForm((current) => ({ ...current, category_id: event.target.value }))}
                                            onWheel={preventWheelSelectChange}
                                            className={ADMIN_SELECT_CLASS}
                                        >
                                            <option value="">Sin categoría</option>
                                            {selectableCategories.map((category) => (
                                                <option key={category.id} value={category.id}>
                                                    {category.nombre}
                                                </option>
                                            ))}
                                        </AnimatedSelect>
                                        <span className="pointer-events-none absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400">
                                            <ChevronDown className="h-4 w-4" />
                                        </span>
                                    </div>
                                </label>

                                <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 md:self-end">
                                    <input
                                        type="checkbox"
                                        checked={productForm.activo}
                                        onChange={(event) => setProductForm((current) => ({ ...current, activo: event.target.checked }))}
                                        className="h-4 w-4 rounded border-zinc-300 text-[#136191] focus:ring-[#136191]"
                                    />
                                    <div>
                                        <p className="text-sm font-semibold text-zinc-800">Producto activo</p>
                                        <p className="text-xs font-medium text-zinc-500">Control directo de visibilidad operativa.</p>
                                    </div>
                                </label>
                            </div>
                        </AdminModalSection>
                    </form>
                    </AdminMotionScrollArea>
                </AppModalBody>
                <AppModalFooter variant="flat" surfaceColor={ADMIN_MODAL_SURFACE} className="border-t border-[#ececec] px-5 py-4">
                    <AdminModalFooterButton
                        onClick={closeProductEditorModal}
                        icon={X}
                        variant="secondary"
                    >
                        Cancelar
                    </AdminModalFooterButton>
                    <AdminModalFooterButton
                        type="submit"
                        form="generic-product-form"
                        disabled={productSaving}
                        icon={productEditorMode === 'edit' ? PencilLine : Plus}
                        variant="primary"
                    >
                        {productSaving
                            ? (productEditorMode === 'edit' ? 'Guardando...' : 'Creando...')
                            : (productEditorMode === 'edit' ? 'Guardar producto' : 'Crear producto')}
                    </AdminModalFooterButton>
                </AppModalFooter>
            </AppModalShell>

            <AppModalShell
                isOpen={portalModalOpen}
                onClose={requestClosePortalModal}
                size="2xl"
                zIndex="z-[130]"
                panelClassName="h-[88dvh] max-h-[88dvh] flex flex-col bg-[#f7f7f5]"
                surfaceColor={ADMIN_MODAL_SURFACE}
            >
                <AppModalHeader
                    title={portalModalMode === 'edit' ? 'Editar Portal de compras públicas' : 'Crear Portal de compras públicas'}
                    subtitle="Producto con metadatos comunes y metadatos propios de licitación"
                    icon={Package}
                    iconClassName="text-[#F39200]"
                    iconWrapClassName="border-orange-200 bg-orange-50"
                    {...ADMIN_MODAL_HEADER_PROPS}
                    onClose={requestClosePortalModal}
                />
                <AppModalBody className={`${ADMIN_MODAL_BODY_CLASS} flex`}>
                    <form id="portal-product-form" onSubmit={handleSubmitPortalProduct} className="flex min-h-0 flex-1 flex-col gap-4">
                        <AdminModalSection className="shrink-0">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                <div className="rounded-[0.9rem] border border-[#ececec] bg-[#f7f7f5] px-3 py-2">
                                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">Código</p>
                                    <p className="mt-1 max-w-[150px] truncate text-[11px] font-black text-zinc-800">
                                        {portalModalMode === 'edit' ? (portalForm.codigo || 'Sin código') : 'Automático'}
                                    </p>
                                </div>
                                <div className="rounded-[0.9rem] border border-[#ececec] bg-[#f7f7f5] px-3 py-2">
                                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">Creador</p>
                                    <p className="mt-1 text-[11px] font-black text-zinc-800">Sistema</p>
                                </div>
                                <div className={`rounded-[0.9rem] border px-3 py-2 ${portalActivationReadiness.ready ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                                    <p className="text-[8px] font-black uppercase tracking-[0.18em] text-zinc-400">Estado</p>
                                    <p className={`mt-1 text-[11px] font-black ${portalActivationReadiness.ready ? 'text-emerald-700' : 'text-amber-800'}`}>
                                        {portalActivationReadiness.ready ? 'Listo para activar' : 'Borrador incompleto'}
                                    </p>
                                </div>
                            </div>
                            <ProjectHeaderActionButton
                                icon={Power}
                                label={portalForm.activo ? 'Activo' : (portalActivationReadiness.ready ? 'Inactivo' : 'Bloqueado')}
                                onClick={() => {
                                    if (!portalActivationReadiness.ready) {
                                        focusPortalField(portalActivationReadiness.firstMissingKey);
                                        return;
                                    }
                                    setPortalForm((current) => ({ ...current, activo: !current.activo }));
                                }}
                                tone={portalForm.activo ? 'primary' : 'warning'}
                                stacked={false}
                                size="lg"
                            />
                            </div>
                        </AdminModalSection>
                        <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,1fr)_minmax(0,1fr)] gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)] lg:grid-rows-[minmax(0,1fr)]">
                        <div className="h-full min-h-0 overflow-hidden">
                        <AdminMotionScrollArea className="h-full" contentClassName="space-y-4">
                        <AdminModalSection eyebrow="Producto" title="Identidad comercial" icon={Package} accent="orange">
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <label className="space-y-2 md:col-span-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.titulo}>Título comercial</PortalFieldLabel>
                                    <input
                                        ref={(node) => setPortalFieldRef('titulo', node)}
                                        type="text"
                                        value={portalForm.titulo}
                                        onChange={(event) => setPortalForm((current) => ({ ...current, titulo: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>
                                <label className="space-y-2 md:col-span-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.descripcion_corta}>Descripción corta</PortalFieldLabel>
                                    <textarea
                                        ref={(node) => setPortalFieldRef('descripcion_corta', node)}
                                        value={portalForm.descripcion_corta}
                                        onChange={(event) => setPortalForm((current) => ({ ...current, descripcion_corta: event.target.value }))}
                                        className={`${ADMIN_TEXTAREA_CLASS} min-h-[58px]`}
                                    />
                                </label>
                                <label className="space-y-2 md:col-span-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.descripcion_larga}>Descripción larga</PortalFieldLabel>
                                    <textarea
                                        ref={(node) => setPortalFieldRef('descripcion_larga', node)}
                                        value={portalForm.descripcion_larga}
                                        onChange={(event) => setPortalForm((current) => ({ ...current, descripcion_larga: event.target.value }))}
                                        className={`${ADMIN_TEXTAREA_CLASS} min-h-[74px]`}
                                    />
                                </label>
                                <label className="space-y-2 md:col-span-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.descripcion_completa}>Descripción completa</PortalFieldLabel>
                                    <textarea
                                        ref={(node) => setPortalFieldRef('descripcion_completa', node)}
                                        value={portalForm.descripcion_completa}
                                        onChange={(event) => setPortalForm((current) => ({ ...current, descripcion_completa: event.target.value }))}
                                        className={`${ADMIN_TEXTAREA_CLASS} min-h-[92px]`}
                                    />
                                </label>
                                <div className="space-y-2 md:col-span-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.imagen_relevante_url}>Imagen relevante</PortalFieldLabel>
                                    <div className="grid gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-3 md:grid-cols-[112px_minmax(0,1fr)]">
                                        <div className="flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
                                            {portalForm.imagen_relevante_url ? (
                                                <img
                                                    src={portalForm.imagen_relevante_url}
                                                    alt="Imagen relevante del portal"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <ImageIcon className="h-7 w-7 text-zinc-300" />
                                            )}
                                        </div>
                                        <div className="min-w-0 space-y-2">
                                            <input
                                                ref={portalImageInputRef}
                                                type="file"
                                                accept="image/*"
                                                onChange={handlePortalImageUpload}
                                                className="hidden"
                                            />
                                            <div className="flex flex-wrap items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => portalImageInputRef.current?.click()}
                                                    disabled={portalImageUploading}
                                                    className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-700 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:text-zinc-300"
                                                >
                                                    <UploadCloud className="h-4 w-4" />
                                                    {portalImageUploading ? 'Cargando...' : 'Subir local'}
                                                </button>
                                                {portalForm.imagen_relevante_url ? (
                                                    <button
                                                        type="button"
                                                        onClick={() => setPortalForm((current) => ({ ...current, imagen_relevante_url: '' }))}
                                                        className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900"
                                                    >
                                                        Usar defecto
                                                    </button>
                                                ) : null}
                                            </div>
                                            <p className="text-[10px] font-medium leading-relaxed text-zinc-500">
                                                Solo archivo local. Si no cargas imagen, Tienda mantiene la portada automática del portal.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <label className="space-y-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.precio_comercial}>Precio comercial</PortalFieldLabel>
                                    <input
                                        type="text"
                                        value={`${computedPortalCommercialPrice.toFixed(2)} USD`}
                                        readOnly
                                        className={`${ADMIN_FIELD_CLASS} bg-zinc-100 text-zinc-700`}
                                    />
                                    <p className="text-[10px] font-medium leading-relaxed text-zinc-500">
                                        Calculado automáticamente según el monto de la licitación.
                                    </p>
                                </label>
                                <label className="space-y-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.descuento_promocion}>Descuento / Promoción</PortalFieldLabel>
                                    <input
                                        type="text"
                                        value={portalForm.descuento_promocion}
                                        onChange={(event) => setPortalForm((current) => ({ ...current, descuento_promocion: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>
                                <label className="space-y-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.fecha_inicio_publicacion}>Inicio de publicación</PortalFieldLabel>
                                    <AnimatedDateInput
                                        ref={(node) => setPortalFieldRef('fecha_inicio_publicacion', node)}
                                        type="date"
                                        value={portalForm.fecha_inicio_publicacion}
                                        onChange={(event) => setPortalForm((current) => ({ ...current, fecha_inicio_publicacion: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>
                                <label className="space-y-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.fecha_fin_publicacion}>Fin de publicación</PortalFieldLabel>
                                    <AnimatedDateInput
                                        ref={(node) => setPortalFieldRef('fecha_fin_publicacion', node)}
                                        type="date"
                                        value={portalForm.fecha_fin_publicacion}
                                        onChange={(event) => setPortalForm((current) => ({ ...current, fecha_fin_publicacion: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>
                            </div>
                        </AdminModalSection>

                        <AdminModalSection eyebrow="Licitación" title="Datos de compras públicas" icon={MapPin} accent="orange">
                            <div className="mt-3 grid gap-3 md:grid-cols-2">
                                <div className="space-y-2" ref={(node) => setPortalFieldRef('pais', node)} tabIndex={-1}>
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.pais}>País</PortalFieldLabel>
                                    <SearchableSelect
                                        options={paises.map((pais) => ({ id: pais.id, nombre: pais.nombre }))}
                                        value={portalForm.pais}
                                        onChange={(val) => setPortalForm((current) => ({ ...current, pais: val, provincia: '', canton: '' }))}
                                        placeholder="Buscar país..."
                                        valueKey="nombre"
                                    />
                                </div>
                                <div className="space-y-2" ref={(node) => setPortalFieldRef('provincia', node)} tabIndex={-1}>
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.provincia}>Provincia</PortalFieldLabel>
                                    {portalForm.pais === 'Ecuador' ? (
                                        <SearchableSelect
                                            options={portalProvincias.map((provincia) => ({ id: provincia, nombre: provincia }))}
                                            value={portalForm.provincia}
                                            onChange={(val) => setPortalForm((current) => ({ ...current, provincia: val, canton: '' }))}
                                            placeholder="Seleccionar..."
                                            valueKey="id"
                                            labelKey="nombre"
                                        />
                                    ) : (
                                        <input
                                        type="text"
                                        value={portalForm.provincia}
                                        onChange={(event) => setPortalForm((current) => ({ ...current, provincia: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.canton}>Cantón</PortalFieldLabel>
                                    {portalForm.pais === 'Ecuador' ? (
                                        <SearchableSelect
                                            options={portalCantones.map((canton) => ({ id: canton, nombre: canton }))}
                                            value={portalForm.canton}
                                            onChange={(val) => setPortalForm((current) => ({ ...current, canton: val }))}
                                            placeholder="Opcional"
                                            valueKey="id"
                                            labelKey="nombre"
                                            disabled={!portalForm.provincia}
                                        />
                                    ) : (
                                        <input
                                        type="text"
                                        value={portalForm.canton}
                                        onChange={(event) => setPortalForm((current) => ({ ...current, canton: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                    )}
                                </div>
                                <label className="space-y-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.direccion}>Dirección</PortalFieldLabel>
                                    <input
                                        ref={(node) => setPortalFieldRef('direccion', node)}
                                        type="text"
                                        value={portalForm.direccion}
                                        onChange={(event) => setPortalForm((current) => ({ ...current, direccion: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                        placeholder="Opcional"
                                    />
                                </label>
                                <label className="space-y-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.precio_licitacion}>Precio de licitación</PortalFieldLabel>
                                    <input
                                        ref={(node) => setPortalFieldRef('precio_licitacion', node)}
                                        type="text"
                                        inputMode="decimal"
                                        data-paste-trim="off"
                                        value={portalForm.precio_licitacion}
                                        onChange={(event) => setPortalForm((current) => ({
                                            ...current,
                                            precio_licitacion: normalizePortalLicitacionInput(event.target.value),
                                        }))}
                                        className={ADMIN_FIELD_CLASS}
                                        placeholder="Ej. 86083.88"
                                    />
                                </label>
                                <label className="space-y-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.fecha_inicio_licitacion}>F. de publicación licitación</PortalFieldLabel>
                                    <AnimatedDateInput
                                        ref={(node) => setPortalFieldRef('fecha_inicio_licitacion', node)}
                                        type="date"
                                        value={portalForm.fecha_inicio_licitacion}
                                        onChange={(event) => handlePortalDateFieldChange('fecha_inicio_licitacion', event.target.value, setPortalForm)}
                                        onPaste={(event) => handlePortalDateFieldPaste(event, 'fecha_inicio_licitacion', setPortalForm)}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>
                                <label className="space-y-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.fecha_fin_licitacion}>F. entrega propuesta</PortalFieldLabel>
                                    <AnimatedDateInput
                                        ref={(node) => setPortalFieldRef('fecha_fin_licitacion', node)}
                                        type="date"
                                        value={portalForm.fecha_fin_licitacion}
                                        onChange={(event) => handlePortalDateFieldChange('fecha_fin_licitacion', event.target.value, setPortalForm)}
                                        onPaste={(event) => handlePortalDateFieldPaste(event, 'fecha_fin_licitacion', setPortalForm)}
                                        className={ADMIN_FIELD_CLASS}
                                    />
                                </label>
                            </div>
                        </AdminModalSection>
                        </AdminMotionScrollArea>
                        </div>

                        <div className="h-full min-h-0 overflow-hidden">
                            <AdminMotionScrollArea className="h-full" contentClassName="space-y-4">
                        <div className="space-y-4">
                        <div className="rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]">
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Importador Compras Públicas</p>
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,2.55fr)_190px] md:items-end">
                                <label className="space-y-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <PortalFieldLabel hint={PORTAL_FIELD_HINTS.import_source_reference}>Código / referencia técnica</PortalFieldLabel>
                                    </div>
                                    <input
                                        ref={(node) => {
                                            setPortalFieldRef('codigo_licitacion', node);
                                            setPortalFieldRef('import_source_reference', node);
                                        }}
                                        type="text"
                                        data-paste-trim="off"
                                        value={portalForm.import_source_reference}
                                        onChange={(event) => {
                                            const normalized = normalizePortalTechnicalReference(event.target.value);
                                            setPortalForm((current) => ({
                                                ...current,
                                                codigo_licitacion: normalized,
                                                import_source_reference: normalized,
                                            }));
                                        }}
                                        onPaste={(event) => handlePortalTechnicalReferencePaste(event, setPortalForm)}
                                        className={ADMIN_FIELD_CLASS}
                                        placeholder="Ej. LICO-GADC-2026-994 o plantilla-licitacion-sercop-001"
                                    />
                                </label>
                                <label className="space-y-2">
                                    <PortalFieldLabel hint={PORTAL_FIELD_HINTS.delivery_mode}>Modalidad de entrega</PortalFieldLabel>
                                    <AnimatedSelect
                                        value={portalForm.delivery_mode}
                                        onChange={(event) => setPortalForm((current) => ({ ...current, delivery_mode: event.target.value }))}
                                        className={ADMIN_FIELD_CLASS}
                                        dropdownMinWidth={220}
                                    >
                                        {PORTAL_DELIVERY_MODE_OPTIONS.map((option) => (
                                            <option key={option.value} value={option.value}>{option.label}</option>
                                        ))}
                                    </AnimatedSelect>
                                </label>
                            </div>
                        </div>

                        <div className="rounded-[1.15rem] border border-[#dbe7f1] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]">
                            <div className="flex flex-col gap-1">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#136191]">Fuente documental</p>
                            </div>
                            <input
                                ref={portalImportInputRef}
                                type="file"
                                accept=".pdf,.xls,.xlsx,.xlsm"
                                multiple
                                onChange={handlePortalImportFilesSelected}
                                className="sr-only"
                                tabIndex={-1}
                            />
                            <div className="mt-3 rounded-[1.15rem] border border-[#d7e3ec] bg-white p-3.5">
                                <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <div className="flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Fuentes</p>
                                            <p className="mt-1 text-[11px] font-medium text-zinc-500">
                                                {portalImportFiles.length ? `${portalImportFiles.length} archivo(s) en cola` : 'Sin archivos cargados'}
                                            </p>
                                        </div>
                                        <AdminModalFooterButton
                                            onClick={openPortalImportFilePicker}
                                            variant="secondary"
                                            className="h-11 w-11 shrink-0 px-0 text-zinc-700 hover:border-[#136191] hover:text-[#136191]"
                                            aria-label="Seleccionar archivos"
                                            title="Seleccionar archivos"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </AdminModalFooterButton>
                                    </div>
                                </div>

                                {portalImportFiles.length ? (
                                    <div className="mt-3 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">Archivos cargados</p>
                                            <p className="text-[10px] font-medium text-zinc-500">{portalImportFiles.length} fuente(s)</p>
                                        </div>
                                        <div className="mt-3 grid gap-2">
                                            {portalImportFiles.map((file) => (
                                                <div key={`${file.name}-${file.size}-${file.lastModified}`} className="grid gap-3 rounded-[0.95rem] border border-zinc-200 bg-white px-3 py-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
                                                    <div className="min-w-0">
                                                        <div className="flex min-w-0 items-center gap-2">
                                                            <span className="inline-flex h-8 min-w-[58px] shrink-0 items-center justify-center rounded-full border border-[#cfe1ec] bg-[#eef5fa] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#136191]">
                                                                {getPortalImportFileExtension(file.name)}
                                                            </span>
                                                            <p className="min-w-0 truncate text-[11px] font-semibold text-zinc-800" title={file.name}>{file.name}</p>
                                                        </div>
                                                        <p className="mt-1 text-[10px] font-medium text-zinc-500">
                                                            {Math.max(1, Math.round((file.size || 0) / 1024))} KB · listo para análisis
                                                        </p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setPortalImportFiles((current) => current.filter((candidate) => (
                                                                candidate.name !== file.name
                                                                || candidate.size !== file.size
                                                                || candidate.lastModified !== file.lastModified
                                                            )));
                                                            setPortalImportRoleOverrides((current) => {
                                                                const next = { ...current };
                                                                delete next[file.name];
                                                                return next;
                                                            });
                                                        }}
                                                        className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-rose-300 hover:text-rose-600"
                                                        aria-label={`Quitar ${file.name}`}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="mt-3 rounded-[1rem] border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-500">No hay archivos cargados</p>
                                    </div>
                                )}

                                <div className="mt-3">
                                    <AdminModalFooterButton
                                        onClick={handlePortalImportPreview}
                                        disabled={portalImporting || !portalImportFiles.length}
                                        icon={Eye}
                                        variant="primary"
                                        className="w-full tracking-[0.12em]"
                                    >
                                        {portalImporting ? 'Analizando' : 'Analizar'}
                                    </AdminModalFooterButton>
                                </div>
                                {(portalImporting || portalImportProgress.phase === 'success') ? (
                                    <div className="mt-3 rounded-[1rem] border border-[#d7e3ec] bg-[#f7fafc] p-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#136191]">
                                                {portalImporting ? 'Progreso del análisis' : 'Último análisis'}
                                            </p>
                                            <p className="text-[10px] font-medium text-zinc-500">
                                                {portalImportProgress.indeterminate
                                                    ? `${portalImportProgress.elapsedSeconds || 0}s`
                                                    : `${Math.max(0, Math.min(100, portalImportProgress.percent || 0))}%`}
                                            </p>
                                        </div>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                                            {portalImportProgress.indeterminate ? (
                                                <div className="h-full w-full overflow-hidden rounded-full">
                                                    <div className="h-full w-1/3 animate-pulse rounded-full bg-[#136191]" />
                                                </div>
                                            ) : (
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${portalImportProgress.phase === 'success' ? 'bg-emerald-500' : 'bg-[#136191]'}`}
                                                    style={{ width: `${Math.max(6, Math.min(100, portalImportProgress.percent || 0))}%` }}
                                                />
                                            )}
                                        </div>
                                        <p className="mt-2 text-[11px] font-medium text-zinc-600">
                                            {portalImportProgress.label || 'Esperando inicio del análisis'}
                                        </p>
                                    </div>
                                ) : null}

                            </div>
                        </div>

                            {portalForm.import_analysis ? (
                                <div className="rounded-[1.2rem] border border-[#d7e3ec] bg-[#f7fafc] p-4" ref={(node) => setPortalFieldRef('import_analysis', node)} tabIndex={-1}>
                                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                        <div className="min-w-0">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#136191]">Resultado técnico</p>
                                            <p className="mt-1 text-[11px] font-medium leading-relaxed text-zinc-600">
                                                Resumen operativo del análisis importado para este portal.
                                            </p>
                                        </div>
                                        <div className="flex shrink-0 items-center gap-2">
                                            <ProjectSectionIconButton
                                                onClick={openPortalTechnicalContent}
                                                icon={Eye}
                                                label="Ver contenido técnico"
                                                className="bg-white text-[#136191] hover:border-[#136191]"
                                                hintTone="light"
                                            />
                                            {portalForm.delivery_mode !== 'project_only' ? (
                                                <ProjectSectionIconButton
                                                    onClick={downloadPortalPreviewExcel}
                                                    disabled={portalPreviewExcelDownloading}
                                                    icon={FileSpreadsheet}
                                                    label={portalPreviewExcelDownloading ? 'Preparando Excel técnico' : 'Descargar Excel técnico'}
                                                    className="bg-white text-[#136191] hover:border-[#136191]"
                                                    hintTone="light"
                                                />
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="mt-4 rounded-[1rem] border border-[#d7e3ec] bg-white px-4 py-3">
                                        <div className="space-y-2.5">
                                            <div className="flex flex-col gap-1 border-b border-zinc-100 pb-2 md:flex-row md:items-start md:justify-between md:gap-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Clasificación</p>
                                                <p className="text-sm font-semibold leading-snug text-zinc-800 md:max-w-[65%] md:text-right">{getPortalImportClassificationLabel(portalForm.import_analysis)}</p>
                                            </div>
                                            <div className="flex flex-col gap-1 border-b border-zinc-100 pb-2 md:flex-row md:items-start md:justify-between md:gap-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Cobertura</p>
                                                <p className="text-sm font-semibold leading-snug text-zinc-800 md:max-w-[65%] md:text-right">{getPortalImportCoverageLabel(portalForm.import_analysis)}</p>
                                            </div>
                                            <div className="flex flex-col gap-1 border-b border-zinc-100 pb-2 md:flex-row md:items-start md:justify-between md:gap-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Total técnico</p>
                                                <p className="text-sm font-semibold leading-snug text-zinc-800 md:max-w-[65%] md:text-right">{Number(portalForm.import_analysis.total_amount || 0).toFixed(2)} USD</p>
                                            </div>
                                            <div className="flex flex-col gap-1 border-b border-zinc-100 pb-2 md:flex-row md:items-start md:justify-between md:gap-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Rubros / capítulos</p>
                                                <p className="text-sm font-semibold leading-snug text-zinc-800 md:max-w-[65%] md:text-right">{getPortalImportSummaryStructureLabel(portalForm.import_analysis)}</p>
                                            </div>
                                            <div className="flex flex-col gap-1 md:flex-row md:items-start md:justify-between md:gap-4">
                                                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-400">Archivo importado</p>
                                                <p className="text-sm font-semibold leading-snug text-zinc-800 md:max-w-[65%] md:text-right" title={getPortalImportSummaryFileLabel(portalForm.import_analysis)}>
                                                    {getPortalImportSummaryFileLabel(portalForm.import_analysis)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    {legacyMarketplacePreviewEnabled ? (
                                        <>
                                    <div className="mt-3 grid gap-3 xl:grid-cols-[1.4fr_1fr]">
                                        <div className="rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Lectura estructural</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-4">
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Rubros</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.items_count || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Capítulos</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.chapters_count || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">APUs base</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.pending_apus_count || portalForm.import_analysis.generated_apus?.length || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">VAE</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.vae_entries_count || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Calidad del bundle</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-4 xl:grid-cols-2">
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Conciliados</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">
                                                        {Object.values(portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary || {}).reduce(
                                                            (total, value) => total + (typeof value === 'number' ? value : 0),
                                                            0,
                                                        )}
                                                    </p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Semánticos</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.semantic_match_count || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Detalle VAE</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.vae_detail_count || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">% VAE</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.vae_percentage_count || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {portalForm.import_analysis.source_files?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Archivos analizados</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {portalForm.import_analysis.source_files.map((source) => (
                                                    <span key={`${source.filename}-${source.format || 'na'}`} className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-bold text-zinc-700">
                                                        {source.filename}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.source_files?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Clasificación por archivo</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                {portalForm.import_analysis.source_files.map((source) => (
                                                    <div key={`${source.filename}-${source.document_kind || 'unknown'}`} className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                                        <p className="text-[11px] font-black text-zinc-800">{source.filename}</p>
                                                        <p className="mt-1 text-[11px] font-semibold text-zinc-600">{PORTAL_IMPORT_KIND_LABELS[source.document_kind] || source.document_kind || 'Análisis básico'}</p>
                                                        <p className="mt-1 text-[10px] font-medium text-zinc-500">
                                                            {(source.detected_section_labels || []).join(' · ') || 'Sin secciones detectadas'}
                                                        </p>
                                                        <label className="mt-3 block space-y-1.5">
                                                            <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Rol manual</span>
                                                            <AnimatedSelect
                                                                value={portalImportRoleOverrides[source.filename] || source.manual_role || 'auto'}
                                                                onChange={(event) => setPortalImportRoleOverrides((current) => ({
                                                                    ...current,
                                                                    [source.filename]: event.target.value,
                                                                }))}
                                                                className="h-9 w-full rounded-xl border border-zinc-200 bg-white px-3 text-[11px] font-semibold text-zinc-700 outline-none transition-colors focus:border-[#136191]"
                                                            >
                                                                {PORTAL_IMPORT_ROLE_OPTIONS.map((option) => (
                                                                    <option key={option.value} value={option.value}>{option.label}</option>
                                                                ))}
                                                            </AnimatedSelect>
                                                        </label>
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="mt-3 text-[10px] font-medium leading-relaxed text-zinc-500">
                                                Si una fuente quedó mal interpretada, ajusta su rol y vuelve a pulsar <span className="font-black text-zinc-700">Analizar archivos</span>.
                                            </p>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.chapter_breakdown?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Capítulos principales</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-3">
                                                {portalForm.import_analysis.chapter_breakdown.slice(0, 3).map((chapter) => (
                                                    <div key={chapter.name} className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                        <p className="text-[11px] font-black text-zinc-800">{chapter.name}</p>
                                                        <p className="mt-1 text-[11px] font-semibold text-zinc-500">
                                                            {chapter.items_count || 0} rubros · {Number(chapter.total_amount || 0).toFixed(2)} USD
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.analysis_bundle?.sample_apus?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">APUs detectados</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                {portalForm.import_analysis.analysis_bundle.sample_apus.slice(0, 4).map((apu) => (
                                                    <div key={apu.temp_id} className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                                        <p className="text-[11px] font-black text-zinc-800">{apu.descripcion || 'APU detectado'}</p>
                                                        <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                            {apu.codigo || 'Sin código'} · {apu.unidad || 'Sin unidad'} · {apu.resource_count || 0} recursos
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.analysis_bundle?.sample_resources?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Recursos detectados</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                {portalForm.import_analysis.analysis_bundle.sample_resources.slice(0, 4).map((resource) => (
                                                    <div key={resource.temp_id} className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                                        <p className="text-[11px] font-black text-zinc-800">{resource.descripcion || 'Recurso detectado'}</p>
                                                        <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                            {resource.codigo || 'Sin código'} · {resource.section_label || resource.resource_type || 'Recurso'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.analysis_bundle?.sample_vae_entries?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Señales VAE / desagregación</p>
                                            <div className="mt-3 space-y-2">
                                                {portalForm.import_analysis.analysis_bundle.sample_vae_entries.slice(0, 4).map((entry) => (
                                                    <div key={entry.temp_id} className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                        <p className="text-[11px] font-semibold text-zinc-700">{entry.label}</p>
                                                        <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                            {entry.kind || 'detail'}{entry.value ? ` · ${entry.value}` : ''}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {(portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.budget_rows_removed
                                        || portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.generated_apus_removed
                                        || portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.real_apus_removed
                                        || portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.resources_removed
                                        || portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.vae_entries_removed) ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Conciliación incremental</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-5">
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Rubros</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.budget_rows_removed || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">APUs base</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.generated_apus_removed || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">APUs reales</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.real_apus_removed || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Recursos</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.resources_removed || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">VAE</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.vae_entries_removed || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.analysis_bundle?.summary?.budget_apu_alignment ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Cobertura presupuesto / APUs</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-4">
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Cobertura</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.budget_apu_alignment.coverage_ratio}%</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">APUs reales</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.budget_apu_alignment.matched_real_apus || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">APUs base</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.budget_apu_alignment.matched_pending_apus || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Sin cubrir</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.budget_apu_alignment.unmatched_budget_rows || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                    {(portalForm.import_analysis.analysis_bundle?.summary?.apu_reconciliation?.bootstrap_promoted_to_real
                                        || portalForm.import_analysis.analysis_bundle?.summary?.apu_reconciliation?.pending_apus_remaining) ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Promoción de APUs bootstrap</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-4">
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Promovidos</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.apu_reconciliation.bootstrap_promoted_to_real || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Pendientes</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.apu_reconciliation.pending_apus_remaining || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Reales</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.apu_reconciliation.real_apus_retained || 0}</p>
                                                </div>
                                                <div className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-2.5">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">IDs preservados</p>
                                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.apu_reconciliation.temp_id_remaps || 0}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.analysis_bundle?.sample_reconciled_apus?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">APUs enriquecidos desde bootstrap</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                {portalForm.import_analysis.analysis_bundle.sample_reconciled_apus.slice(0, 4).map((apu) => (
                                                    <div key={apu.temp_id} className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                                        <p className="text-[11px] font-black text-zinc-800">{apu.descripcion || 'APU enriquecido'}</p>
                                                        <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                            {apu.codigo || 'Sin código'} · {apu.unidad || 'Sin unidad'} · {apu.resource_count || 0} recursos
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.analysis_bundle?.sample_pending_nested_apu_links?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Anidaciones pendientes</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                {portalForm.import_analysis.analysis_bundle.sample_pending_nested_apu_links.slice(0, 4).map((link, index) => (
                                                    <div key={`${link.parent_apu_temp_id || 'parent'}-${index}`} className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                                        <p className="text-[11px] font-black text-zinc-800">{link.child_reference_label || 'Referencia APU pendiente'}</p>
                                                        <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                            {link.child_reference_code || 'Sin código'} · pendiente de enlace
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.analysis_bundle?.sample_ambiguous_nested_apu_links?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Anidaciones ambiguas</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                {portalForm.import_analysis.analysis_bundle.sample_ambiguous_nested_apu_links.slice(0, 4).map((link, index) => (
                                                    <div key={`${link.parent_apu_temp_id || 'parent'}-ambiguous-${index}`} className="rounded-[0.9rem] border border-amber-200 bg-amber-50 px-3 py-3">
                                                        <p className="text-[11px] font-black text-zinc-800">{link.child_reference_label || 'Referencia APU ambigua'}</p>
                                                        <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                            {link.child_reference_code || 'Sin código'} · {link.candidate_count || 0} candidatos
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.analysis_bundle?.sample_unmatched_budget_rows?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Rubros sin correspondencia técnica</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                {portalForm.import_analysis.analysis_bundle.sample_unmatched_budget_rows.slice(0, 4).map((row, index) => (
                                                    <div key={`${row.codigo || 'row'}-${index}`} className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                                        <p className="text-[11px] font-black text-zinc-800">{row.descripcion || 'Rubro sin descripción'}</p>
                                                        <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                            {row.codigo || 'Sin código'} · {row.unidad || 'Sin unidad'} · {row.capitulo || 'General'}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.generated_apus?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">APUs bootstrap</p>
                                            <p className="mt-2 text-[11px] font-medium leading-relaxed text-zinc-600">
                                                Se generarán APUs base en estado <span className="font-black text-amber-700">Pendiente</span> para cada línea de presupuesto distinta, sin recursos, listos para enriquecimiento posterior.
                                            </p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                {portalForm.import_analysis.generated_apus.slice(0, 4).map((apu) => (
                                                    <div key={apu.temp_id} className="rounded-[0.9rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                                        <p className="text-[11px] font-black text-zinc-800">{apu.descripcion}</p>
                                                        <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                            {apu.codigo || 'Sin código'} · {apu.unidad || 'Sin unidad'} · {apu.status}
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                    {portalForm.import_analysis.analysis_bundle?.summary?.warnings?.length ? (
                                        <div className="mt-3 rounded-[1rem] border border-amber-200 bg-amber-50 p-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">Warnings</p>
                                            <div className="mt-2 space-y-1">
                                                {portalForm.import_analysis.analysis_bundle.summary.warnings.map((warning, index) => (
                                                    <p key={`${warning}-${index}`} className="text-[11px] font-medium leading-relaxed text-amber-900">{warning}</p>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                        </>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                        <PortalRequirementSemaphoreGrid draft={portalForm} onSelectRequirement={focusPortalField} />
                        <div className="h-4 shrink-0" aria-hidden="true" />
                        </AdminMotionScrollArea>
                        </div>
                        </div>
                    </form>
                </AppModalBody>
                <AppModalFooter variant="flat" surfaceColor={ADMIN_MODAL_SURFACE} className="border-t border-[#ececec] px-5 py-4">
                    <AdminModalFooterButton
                        onClick={requestClosePortalModal}
                        icon={X}
                        variant="secondary"
                    >
                        Cancelar
                    </AdminModalFooterButton>
                    <AdminModalFooterButton
                        onClick={() => savePortalDraft()}
                        disabled={productSaving}
                        icon={portalModalMode === 'edit' ? PencilLine : Package}
                        variant="info"
                    >
                        {portalModalMode === 'edit' ? 'Guardar borrador' : 'Guardar progreso'}
                    </AdminModalFooterButton>
                    <AdminModalFooterButton
                        onClick={submitPortalProductDirectly}
                        disabled={productSaving || !portalActivationReadiness.ready}
                        icon={portalForm.activo ? Power : Check}
                        variant="primary"
                        className="px-6"
                    >
                        {productSaving ? 'Guardando...' : portalForm.activo ? 'Aceptar y publicar' : 'Aceptar'}
                    </AdminModalFooterButton>
                </AppModalFooter>
            </AppModalShell>
            <AppModalShell
                isOpen={portalPreviewModalOpen}
                onClose={closePortalPreviewModal}
                size="lg"
                zIndex="z-[140]"
                panelClassName={ADMIN_MODAL_PANEL_CLASS}
                surfaceColor={ADMIN_MODAL_SURFACE}
            >
                <AppModalHeader
                    title={portalPreviewReadOnly ? 'Contenido técnico del portal' : (portalModalMode === 'edit' ? 'Confirmar edición del portal' : 'Confirmar creación del portal')}
                    subtitle={portalPreviewReadOnly ? 'Visor de presupuesto, APUs, recursos y conciliación importada.' : 'Visor de previo para validar visualmente la entrega antes del guardado.'}
                    icon={Eye}
                    iconClassName="text-[#136191]"
                    iconWrapClassName="border-blue-200 bg-blue-50"
                    {...ADMIN_MODAL_HEADER_PROPS}
                    onClose={closePortalPreviewModal}
                />
                <AppModalBody className={ADMIN_MODAL_BODY_CLASS}>
                    <AdminMotionScrollArea className="h-full" contentClassName="space-y-5">
                    <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Artículo</p>
                        <h3 className="mt-2 text-lg font-black uppercase tracking-tight text-zinc-900">
                            {portalForm.titulo || 'Sin título'}
                        </h3>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-600">
                            {portalForm.descripcion_corta || 'Sin descripción corta definida.'}
                        </p>
                        <div className="mt-4 grid gap-3 md:grid-cols-3">
                            <div className="rounded-[1.2rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Versión</p>
                                <p className="mt-1 text-sm font-black text-zinc-800">{computedPortalTemplateVersion}</p>
                            </div>
                            <div className="rounded-[1.2rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Estado técnico</p>
                                <p className="mt-1 text-sm font-black text-zinc-800">{PORTAL_PROCESSING_LABELS[computedPortalProcessingStatus] || computedPortalProcessingStatus}</p>
                            </div>
                            <div className="rounded-[1.2rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Precio con IVA</p>
                                <p className="mt-1 text-sm font-black text-zinc-800">{computedPortalCommercialPrice.toFixed(2)} USD</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5">
                            <div className="flex items-center gap-2 text-zinc-900">
                                <MapPin className="h-4 w-4 text-[#F39200]" />
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Ubicación y licitación</p>
                            </div>
                            <p className="mt-3 text-sm font-black text-zinc-900">
                                {[portalForm.pais, portalForm.provincia, portalForm.canton].filter(Boolean).join(' / ')}
                            </p>
                            <p className="mt-2 text-sm font-medium text-zinc-600">
                                Ventana: {portalForm.fecha_inicio_licitacion || '-'} {'->'} {portalForm.fecha_fin_licitacion || '-'}
                            </p>
                            <p className="mt-2 text-sm font-medium text-zinc-600">
                                Precio de licitación: {portalForm.precio_licitacion || '0.00'} USD
                            </p>
                        </div>
                        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5">
                            <div className="flex items-center gap-2 text-zinc-900">
                                <FileSpreadsheet className="h-4 w-4 text-[#136191]" />
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Entrega híbrida</p>
                            </div>
                            <p className="mt-3 text-sm font-black text-zinc-900">
                                {(PORTAL_DELIVERY_MODE_OPTIONS.find((option) => option.value === portalForm.delivery_mode) || PORTAL_DELIVERY_MODE_OPTIONS[2]).label}
                            </p>
                            <p className="mt-2 text-sm font-medium text-zinc-600">
                                Origen: {(PORTAL_IMPORT_SOURCE_OPTIONS.find((option) => option.value === portalForm.import_source_kind) || PORTAL_IMPORT_SOURCE_OPTIONS[0]).label}
                            </p>
                            <p className="mt-2 text-sm font-medium text-zinc-600 break-words">
                                Código / referencia: {portalForm.import_source_reference || portalForm.codigo_licitacion || 'Sin referencia'}
                            </p>
                        </div>
                    </div>

                    <div className="rounded-[1.5rem] border border-emerald-200 bg-emerald-50 p-5">
                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Proyecto entregado al comprador</p>
                        <h3 className="mt-2 text-base font-black text-zinc-900">Adquirido · {portalForm.titulo || 'Portal de compras públicas'}</h3>
                        <p className="mt-2 text-sm font-medium leading-relaxed text-zinc-700">
                            El comprador recibirá un proyecto preparado en su sistema, sin base madre, marcado como adquirido y con bloqueo inicial de envío.
                        </p>
                        <div className="mt-4 grid gap-3 md:grid-cols-2">
                            <div className="rounded-[1rem] border border-white bg-white/80 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Cod. Referencial</p>
                                <p className="mt-1 text-sm font-black text-zinc-900 break-words">
                                    {portalProjectDeliverySummary.referenceCode}
                                </p>
                            </div>
                            <div className="rounded-[1rem] border border-white bg-white/80 px-4 py-3">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Localización</p>
                                <p className="mt-1 text-sm font-black text-zinc-900">
                                    {portalProjectDeliverySummary.locationLabel}
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-zinc-600">
                                    {portalProjectDeliverySummary.address}
                                </p>
                            </div>
                            <div className="rounded-[1rem] border border-white bg-white/80 px-4 py-3 md:col-span-2">
                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700">Geolocalización propuesta</p>
                                <p className="mt-1 text-sm font-black text-zinc-900">
                                    {portalProjectDeliverySummary.geolocation
                                        ? `${portalProjectDeliverySummary.geolocation.lat}, ${portalProjectDeliverySummary.geolocation.lng}`
                                        : 'Pendiente de resolución automática'}
                                </p>
                                <p className="mt-1 text-[11px] font-medium text-zinc-600">
                                    {portalProjectDeliverySummary.geolocation
                                        ? `Resolución ${portalProjectDeliverySummary.geolocation.resolution}. Se sembrará en Proyecto > Datos de proyecto.`
                                        : 'El proyecto se generará igual, pero la geolocalización requerirá ajuste manual si la provincia/cantón no coincide con la referencia conocida.'}
                                </p>
                            </div>
                        </div>
                    </div>
                    {portalPreviewImportAnalysis ? (
                        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5">
                            <div className={`rounded-[1.25rem] border px-4 py-4 ${
                                portalPreviewOutcomeState.tone === 'success'
                                    ? 'border-emerald-200 bg-emerald-50'
                                    : 'border-amber-200 bg-amber-50'
                            }`}>
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                                    <div className="min-w-0">
                                        <p className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${
                                            portalPreviewOutcomeState.tone === 'success' ? 'text-emerald-700' : 'text-amber-700'
                                        }`}>
                                            Resultado de importación
                                        </p>
                                        <h3 className="mt-2 text-lg font-semibold text-zinc-900">{portalPreviewOutcomeState.title}</h3>
                                        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-zinc-600">
                                            {portalPreviewOutcomeState.helper}
                                        </p>
                                    </div>
                                    <div className="rounded-[1rem] border border-white/80 bg-white/90 px-4 py-3 lg:w-[18rem]">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Persistencia</p>
                                        <p className="mt-1 text-sm font-semibold text-zinc-900">Pendiente de guardar en el producto</p>
                                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                                            El análisis ya es usable y quedará registrado al guardar el producto o el borrador.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Resumen ejecutivo</p>
                                <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Archivos procesados</p>
                                        <p className="mt-1 text-base font-semibold text-zinc-900">{portalPreviewImportAnalysis.source_files?.length || 1} archivo(s)</p>
                                    </div>
                                    <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Cobertura detectada</p>
                                        <p className="mt-1 text-base font-semibold text-zinc-900">{getPortalImportCoverageLabel(portalPreviewImportAnalysis)}</p>
                                    </div>
                                    <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Importe técnico</p>
                                        <p className="mt-1 text-base font-semibold text-zinc-900">{Number(portalPreviewImportAnalysis.total_amount || 0).toFixed(2)} USD</p>
                                    </div>
                                    <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Cobertura APU</p>
                                        <p className="mt-1 text-base font-semibold text-zinc-900">{portalPreviewImportAnalysis.analysis_bundle?.summary?.budget_apu_alignment?.coverage_ratio || '0.00'}%</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 rounded-[1.1rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Lectura detectada</p>
                                <div className="mt-2 grid gap-2 md:grid-cols-2">
                                    <p className="text-sm leading-relaxed text-zinc-700">
                                        <span className="font-semibold text-zinc-900">Clasificación:</span> {getPortalImportClassificationLabel(portalPreviewImportAnalysis)}
                                    </p>
                                    <p className="text-sm leading-relaxed text-zinc-700">
                                        <span className="font-semibold text-zinc-900">Anidaciones:</span> {getPortalNestedApuStatusLabel(portalPreviewImportAnalysis.analysis_bundle?.summary)}
                                    </p>
                                </div>
                            </div>

                            {portalPreviewExecutiveWarnings.length ? (
                                <div className="mt-4 rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-4">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-700">Puntos a revisar</p>
                                    <div className="mt-2 space-y-2">
                                        {portalPreviewExecutiveWarnings.map((warning, index) => (
                                            <p key={`${warning}-${index}`} className="text-sm leading-relaxed text-amber-900">{warning}</p>
                                        ))}
                                    </div>
                                </div>
                            ) : null}

                            <details className="mt-4 rounded-[1.1rem] border border-zinc-200 bg-zinc-50 px-4 py-4">
                                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-zinc-800 marker:hidden">
                                    <span>Ver detalle técnico</span>
                                    <span className="text-[11px] font-medium text-zinc-500">Diagnóstico, archivos y muestras detectadas</span>
                                </summary>
                                <div className="mt-4 space-y-4">
                                    <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr]">
                                        <div className="rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Lectura estructural</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-4">
                                                <div className="rounded-[0.9rem] border border-zinc-100 bg-zinc-50 px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Rubros</p><p className="mt-1 text-sm font-semibold text-zinc-800">{portalPreviewImportAnalysis.items_count || 0}</p></div>
                                                <div className="rounded-[0.9rem] border border-zinc-100 bg-zinc-50 px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Capítulos</p><p className="mt-1 text-sm font-semibold text-zinc-800">{portalPreviewImportAnalysis.chapters_count || 0}</p></div>
                                                <div className="rounded-[0.9rem] border border-zinc-100 bg-zinc-50 px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">APUs base</p><p className="mt-1 text-sm font-semibold text-zinc-800">{portalPreviewImportAnalysis.analysis_bundle?.summary?.pending_apus_count || portalPreviewImportAnalysis.generated_apus?.length || 0}</p></div>
                                                <div className="rounded-[0.9rem] border border-zinc-100 bg-zinc-50 px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">VAE</p><p className="mt-1 text-sm font-semibold text-zinc-800">{portalPreviewImportAnalysis.analysis_bundle?.summary?.vae_entries_count || 0}</p></div>
                                            </div>
                                        </div>
                                        <div className="rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Calidad del bundle</p>
                                            <div className="mt-3 grid gap-2 md:grid-cols-2">
                                                <div className="rounded-[0.9rem] border border-zinc-100 bg-zinc-50 px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Conciliados</p><p className="mt-1 text-sm font-semibold text-zinc-800">{Object.values(portalPreviewImportAnalysis.analysis_bundle?.summary?.dedupe_summary || {}).reduce((total, value) => total + (typeof value === 'number' ? value : 0), 0)}</p></div>
                                                <div className="rounded-[0.9rem] border border-zinc-100 bg-zinc-50 px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Semánticos</p><p className="mt-1 text-sm font-semibold text-zinc-800">{portalPreviewImportAnalysis.analysis_bundle?.summary?.semantic_match_count || 0}</p></div>
                                                <div className="rounded-[0.9rem] border border-zinc-100 bg-zinc-50 px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Detalle VAE</p><p className="mt-1 text-sm font-semibold text-zinc-800">{portalPreviewImportAnalysis.analysis_bundle?.summary?.vae_detail_count || 0}</p></div>
                                                <div className="rounded-[0.9rem] border border-zinc-100 bg-zinc-50 px-3 py-2.5"><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">% VAE</p><p className="mt-1 text-sm font-semibold text-zinc-800">{portalPreviewImportAnalysis.analysis_bundle?.summary?.vae_percentage_count || 0}</p></div>
                                            </div>
                                        </div>
                                    </div>

                                    {portalPreviewImportAnalysis.source_files?.length ? (
                                        <div className="rounded-[1rem] border border-white bg-white p-3">
                                            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">Archivos analizados</p>
                                            <div className="mt-3 flex flex-wrap gap-2">
                                                {portalPreviewImportAnalysis.source_files.map((source) => (
                                                    <span key={`${source.filename}-${source.format || 'na'}`} className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-semibold text-zinc-700">{source.filename}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            </details>
                        </div>
                    ) : null}
                    {legacyMarketplacePreviewEnabled ? (
                        <div className="rounded-[1.5rem] border border-zinc-200 bg-white p-5">
                            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Previo de importación</p>
                            <div className="mt-3 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
                                <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Archivo</p>
                                    <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.source_files?.length || 1}</p>
                                </div>
                                <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Clasificación</p>
                                    <p className="mt-1 text-sm font-black text-zinc-800">{getPortalImportClassificationLabel(portalForm.import_analysis)}</p>
                                </div>
                                <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Cobertura</p>
                                    <p className="mt-1 text-sm font-black text-zinc-800">{getPortalImportCoverageLabel(portalForm.import_analysis)}</p>
                                </div>
                                <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Cobertura APU</p>
                                    <p className="mt-1 text-sm font-black text-zinc-800">
                                        {portalForm.import_analysis.analysis_bundle?.summary?.budget_apu_alignment?.coverage_ratio || '0.00'}%
                                    </p>
                                </div>
                                <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Anidaciones</p>
                                    <p className="mt-1 text-sm font-black text-zinc-800">{getPortalNestedApuStatusLabel(portalForm.import_analysis.analysis_bundle?.summary)}</p>
                                </div>
                                <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">APUs promovidos</p>
                                    <p className="mt-1 text-sm font-black text-zinc-800">
                                        {portalForm.import_analysis.analysis_bundle?.summary?.apu_reconciliation?.bootstrap_promoted_to_real || 0}
                                    </p>
                                </div>
                                <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 px-3 py-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Importe técnico</p>
                                    <p className="mt-1 text-sm font-black text-zinc-800">{Number(portalForm.import_analysis.total_amount || 0).toFixed(2)} USD</p>
                                </div>
                            </div>
                            <div className="mt-3 grid gap-3 xl:grid-cols-[1.4fr_1fr]">
                                <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Lectura estructural</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-4">
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-2.5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Rubros</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.items_count || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-2.5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Capítulos</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.chapters_count || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-2.5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">APUs base</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.pending_apus_count || portalForm.import_analysis.generated_apus?.length || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-2.5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">VAE</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.vae_entries_count || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Calidad del bundle</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-4 xl:grid-cols-2">
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-2.5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Conciliados</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">
                                                {Object.values(portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary || {}).reduce(
                                                    (total, value) => total + (typeof value === 'number' ? value : 0),
                                                    0,
                                                )}
                                            </p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-2.5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Semánticos</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.semantic_match_count || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-2.5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Detalle VAE</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.vae_detail_count || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-2.5">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">% VAE</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.vae_percentage_count || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            {portalForm.import_analysis.source_files?.length ? (
                                <div className="mt-3 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Archivos analizados</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {portalForm.import_analysis.source_files.map((source) => (
                                            <span key={`${source.filename}-${source.format || 'na'}`} className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-bold text-zinc-700">
                                                {source.filename}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.source_files?.length ? (
                                <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Clasificación por archivo</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                        {portalForm.import_analysis.source_files.map((source) => (
                                            <div key={`${source.filename}-${source.document_kind || 'unknown'}`} className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                                <p className="text-[11px] font-black text-zinc-800">{source.filename}</p>
                                                <p className="mt-1 text-[11px] font-semibold text-zinc-600">
                                                    {PORTAL_IMPORT_KIND_LABELS[source.document_kind] || source.document_kind || 'Análisis básico'}
                                                </p>
                                                <p className="mt-1 text-[10px] font-medium text-zinc-500">
                                                    {(source.detected_section_labels || []).join(' · ') || 'Sin secciones detectadas'}
                                                </p>
                                                <p className="mt-2 text-[10px] font-semibold text-zinc-500">
                                                    Rol manual: {resolvePortalImportRoleLabel(portalImportRoleOverrides[source.filename] || source.manual_role || 'auto')}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.analysis_bundle?.summary?.budget_apu_alignment ? (
                                <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Cobertura presupuesto / APUs</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-4">
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Cobertura</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.budget_apu_alignment.coverage_ratio}%</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">APUs reales</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.budget_apu_alignment.matched_real_apus || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">APUs base</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.budget_apu_alignment.matched_pending_apus || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Sin cubrir</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.budget_apu_alignment.unmatched_budget_rows || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                            {(portalForm.import_analysis.analysis_bundle?.summary?.apu_reconciliation?.bootstrap_promoted_to_real
                                || portalForm.import_analysis.analysis_bundle?.summary?.apu_reconciliation?.pending_apus_remaining) ? (
                                <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Promoción de APUs bootstrap</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-4">
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Promovidos</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.apu_reconciliation.bootstrap_promoted_to_real || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Pendientes</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.apu_reconciliation.pending_apus_remaining || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Reales</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.apu_reconciliation.real_apus_retained || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">IDs preservados</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle.summary.apu_reconciliation.temp_id_remaps || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.analysis_bundle?.sample_reconciled_apus?.length ? (
                                <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">APUs enriquecidos desde bootstrap</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                        {portalForm.import_analysis.analysis_bundle.sample_reconciled_apus.slice(0, 4).map((apu) => (
                                            <div key={apu.temp_id} className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                                <p className="text-[11px] font-black text-zinc-800">{apu.descripcion || 'APU enriquecido'}</p>
                                                <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                    {apu.codigo || 'Sin código'} · {apu.unidad || 'Sin unidad'} · {apu.resource_count || 0} recursos
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.analysis_bundle?.sample_pending_nested_apu_links?.length ? (
                                <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Anidaciones pendientes</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                        {portalForm.import_analysis.analysis_bundle.sample_pending_nested_apu_links.slice(0, 4).map((link, index) => (
                                            <div key={`${link.parent_apu_temp_id || 'parent'}-${index}`} className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                                <p className="text-[11px] font-black text-zinc-800">{link.child_reference_label || 'Referencia APU pendiente'}</p>
                                                <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                    {link.child_reference_code || 'Sin código'} · pendiente de enlace
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.analysis_bundle?.sample_ambiguous_nested_apu_links?.length ? (
                                <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Anidaciones ambiguas</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                        {portalForm.import_analysis.analysis_bundle.sample_ambiguous_nested_apu_links.slice(0, 4).map((link, index) => (
                                            <div key={`${link.parent_apu_temp_id || 'parent'}-ambiguous-${index}`} className="rounded-[0.9rem] border border-amber-200 bg-amber-50 px-3 py-3">
                                                <p className="text-[11px] font-black text-zinc-800">{link.child_reference_label || 'Referencia APU ambigua'}</p>
                                                <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                    {link.child_reference_code || 'Sin código'} · {link.candidate_count || 0} candidatos
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.analysis_bundle?.sample_unmatched_budget_rows?.length ? (
                                <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Rubros sin correspondencia técnica</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                        {portalForm.import_analysis.analysis_bundle.sample_unmatched_budget_rows.slice(0, 4).map((row, index) => (
                                            <div key={`${row.codigo || 'row'}-${index}`} className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                                <p className="text-[11px] font-black text-zinc-800">{row.descripcion || 'Rubro sin descripción'}</p>
                                                <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                    {row.codigo || 'Sin código'} · {row.unidad || 'Sin unidad'} · {row.capitulo || 'General'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.chapter_breakdown?.length ? (
                                <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Lectura por capítulos</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-3">
                                        {portalForm.import_analysis.chapter_breakdown.slice(0, 3).map((chapter) => (
                                            <div key={chapter.name} className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                                <p className="text-[11px] font-black text-zinc-800">{chapter.name}</p>
                                                <p className="mt-1 text-[11px] font-semibold text-zinc-500">
                                                    {chapter.items_count || 0} rubros · {Number(chapter.total_amount || 0).toFixed(2)} USD
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.analysis_bundle?.sample_apus?.length ? (
                                <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">APUs detectados</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                        {portalForm.import_analysis.analysis_bundle.sample_apus.slice(0, 4).map((apu) => (
                                            <div key={apu.temp_id} className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                                <p className="text-[11px] font-black text-zinc-800">{apu.descripcion || 'APU detectado'}</p>
                                                <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                    {apu.codigo || 'Sin código'} · {apu.unidad || 'Sin unidad'} · {apu.resource_count || 0} recursos
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.analysis_bundle?.sample_resources?.length ? (
                                <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Recursos detectados</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                        {portalForm.import_analysis.analysis_bundle.sample_resources.slice(0, 4).map((resource) => (
                                            <div key={resource.temp_id} className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                                <p className="text-[11px] font-black text-zinc-800">{resource.descripcion || 'Recurso detectado'}</p>
                                                <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                    {resource.codigo || 'Sin código'} · {resource.section_label || resource.resource_type || 'Recurso'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.analysis_bundle?.sample_vae_entries?.length ? (
                                <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-zinc-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Señales VAE / desagregación</p>
                                    <div className="mt-3 space-y-2">
                                        {portalForm.import_analysis.analysis_bundle.sample_vae_entries.slice(0, 4).map((entry) => (
                                            <div key={entry.temp_id} className="rounded-[0.9rem] border border-white bg-white px-3 py-3">
                                                <p className="text-[11px] font-semibold text-zinc-700">{entry.label}</p>
                                                <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                    {entry.kind || 'detail'}{entry.value ? ` · ${entry.value}` : ''}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.generated_apus?.length ? (
                                <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">APUs base pendientes</p>
                                    <p className="mt-2 text-[11px] font-medium leading-relaxed text-amber-900">
                                        Como esta fuente se ha clasificado como cobertura presupuestaria sin APUs reales extraídos, el sistema bootstrapeará APUs `Pendiente` sin recursos.
                                    </p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-2">
                                        {portalForm.import_analysis.generated_apus.slice(0, 4).map((apu) => (
                                            <div key={apu.temp_id} className="rounded-[0.9rem] border border-amber-200 bg-white px-3 py-3">
                                                <p className="text-[11px] font-black text-zinc-800">{apu.descripcion}</p>
                                                <p className="mt-1 text-[10px] font-semibold text-zinc-500">
                                                    {apu.codigo || 'Sin código'} · {apu.unidad || 'Sin unidad'} · {apu.status}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                            {(portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.budget_rows_removed
                                || portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.generated_apus_removed
                                || portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.real_apus_removed
                                || portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.resources_removed
                                || portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.vae_entries_removed) ? (
                                <div className="mt-4 rounded-[1rem] border border-blue-200 bg-blue-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">Conciliación incremental</p>
                                    <div className="mt-3 grid gap-2 md:grid-cols-5">
                                        <div className="rounded-[0.9rem] border border-blue-200 bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Rubros</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.budget_rows_removed || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-blue-200 bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">APUs base</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.generated_apus_removed || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-blue-200 bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">APUs reales</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.real_apus_removed || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-blue-200 bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">Recursos</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.resources_removed || 0}</p>
                                        </div>
                                        <div className="rounded-[0.9rem] border border-blue-200 bg-white px-3 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">VAE</p>
                                            <p className="mt-1 text-sm font-black text-zinc-800">{portalForm.import_analysis.analysis_bundle?.summary?.dedupe_summary?.vae_entries_removed || 0}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                            {portalForm.import_analysis.analysis_bundle?.summary?.warnings?.length ? (
                                <div className="mt-4 rounded-[1rem] border border-amber-200 bg-amber-50 p-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">Warnings de clasificación</p>
                                    <div className="mt-2 space-y-1">
                                        {portalForm.import_analysis.analysis_bundle.summary.warnings.map((warning, index) => (
                                            <p key={`${warning}-${index}`} className="text-[11px] font-medium leading-relaxed text-amber-900">{warning}</p>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    </AdminMotionScrollArea>
                </AppModalBody>
                <AppModalFooter variant="flat" surfaceColor={ADMIN_MODAL_SURFACE} className="border-t border-[#ececec] px-5 py-4">
                    {portalForm.delivery_mode !== 'project_only' && portalPreviewImportAnalysis ? (
                        <AdminModalFooterButton
                            onClick={downloadPortalPreviewExcel}
                            disabled={portalPreviewExcelDownloading || productSaving}
                            icon={FileSpreadsheet}
                            variant="info"
                        >
                            {portalPreviewExcelDownloading ? 'Preparando Excel...' : 'Descargar Excel'}
                        </AdminModalFooterButton>
                    ) : null}
                    <AdminModalFooterButton
                        onClick={closePortalPreviewModal}
                        icon={X}
                        variant="secondary"
                    >
                        {portalPreviewReadOnly ? 'Cerrar visor' : 'Volver al editor'}
                    </AdminModalFooterButton>
                    {!portalPreviewReadOnly ? (
                        <>
                            <AdminModalFooterButton
                                onClick={() => savePortalDraft()}
                                disabled={productSaving}
                                icon={Package}
                                variant="secondary"
                            >
                                Guardar borrador
                            </AdminModalFooterButton>
                            <AdminModalFooterButton
                                onClick={confirmPortalProductSubmit}
                                disabled={productSaving}
                                icon={portalModalMode === 'edit' ? PencilLine : Check}
                                variant="dark"
                            >
                                {productSaving ? 'Guardando...' : portalModalMode === 'edit' ? 'Guardar y continuar' : 'Guardar y crear'}
                            </AdminModalFooterButton>
                        </>
                    ) : null}
                </AppModalFooter>
            </AppModalShell>
        </MarketplaceShell>
    );
};

export default MarketplaceAdminDashboard;
