import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowDownLeft,
    ArrowUpRight,
    Building2,
    CheckCircle2,
    Clock3,
    HelpCircle,
    KeyRound,
    PackageCheck,
    Plus,
    RefreshCw,
    Send,
    ShoppingCart,
    X,
} from 'lucide-react';
import transferenciasApi from '../api/transferencias';
import { proyectosApi } from '../api/proyectos';
import basesTrabajoApi from '../api/basesTrabajo';
import { AuthContext } from '../context/AuthContext';
import SearchableSelect from '../components/ui/searchable-select';
import AnimatedDateInput from '../components/ui/AnimatedDateInput';
import ClearSearchField from '../components/ui/ClearSearchField';
import { LiquidButton } from '../components/ui/liquid-button';
import ProjectHeaderActionButton from '../components/projects/ProjectHeaderActionButton';
import ProjectSegmentedSwitch from '../components/projects/ProjectSegmentedSwitch';

const directionOptions = [
    { value: 'todos', label: 'Todos' },
    { value: 'entrada', label: 'Entrada' },
    { value: 'salida', label: 'Salida' },
];

const fallbackStates = [
    { code: 'enviado', label: 'Enviado', color: 'blue' },
    { code: 'bloqueado_marketplace', label: 'Bloqueado Marketplace', color: 'amber' },
    { code: 'listo_para_importar', label: 'Listo para importar', color: 'green' },
    { code: 'importado', label: 'Importado', color: 'emerald' },
    { code: 'rechazado', label: 'Rechazado', color: 'rose' },
    { code: 'cancelado', label: 'Cancelado', color: 'slate' },
    { code: 'expirado', label: 'Expirado', color: 'orange' },
    { code: 'fallo_importacion', label: 'Fallo importacion', color: 'red' },
];

const assetTypeOptions = [
    { id: 'proyecto', nombre: 'Proyecto' },
    { id: 'base_trabajo', nombre: 'Base de Trabajo' },
];

const statusClasses = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    cyan: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    violet: 'border-violet-200 bg-violet-50 text-violet-700',
    rose: 'border-rose-200 bg-rose-50 text-rose-700',
    orange: 'border-orange-200 bg-orange-50 text-orange-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    slate: 'border-slate-200 bg-slate-50 text-slate-600',
    neutral: 'border-zinc-200 bg-zinc-50 text-zinc-600',
};

const timelineTypeLabels = {
    creado: 'Envio creado',
    enviado: 'Envio enviado',
    recepcionado: 'Envio recepcionado',
    importado: 'Envio importado',
    rechazado: 'Envio rechazado',
    cancelado: 'Envio cancelado',
    expirado: 'Envio expirado',
    transfer_recipient_added: 'Empresa habilitada para comunicacion',
    transfer_shipment_created: 'Envio creado',
    transfer_shipment_rejected: 'Envio rechazado por el receptor',
    transfer_shipment_rejected_notification: 'Notificacion de rechazo al emisor',
    transfer_shipment_imported: 'Envio importado por el receptor',
    transfer_shipment_import_failed: 'Fallo de importacion del envio',
    transfer_shipment_cancelled: 'Envio cancelado por el emisor',
    transfer_marketplace_requirements_revalidated: 'Compras Marketplace revalidadas',
    transfer_code_validation_failed: 'Validacion de codigo fallida',
    transfer_code_validation_paused: 'Validacion de codigo pausada',
    transfer_code_validation_banned: 'Validacion de codigo bloqueada',
    transfer_code_validation_resolved: 'Codigo de empresa validado',
};

const TRANSFER_TOOL_SHELL_CLASS = 'rounded-[1.55rem] border border-zinc-200 bg-white px-4 py-2 shadow-sm';
const TRANSFER_SOFT_SECTION_CLASS = 'rounded-[1.05rem] border border-[#ececec] bg-[#f7f7f5] p-3 shadow-[3px_3px_10px_rgba(148,163,184,0.16),-3px_-3px_10px_rgba(255,255,255,0.75)]';
const TRANSFER_FIELD_LABEL_CLASS = 'text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500';
const TRANSFER_TEXTAREA_CLASS = 'min-h-[74px] w-full resize-y rounded-[0.85rem] border border-zinc-200 bg-white px-3 py-2 text-[12px] font-semibold leading-relaxed text-zinc-700 shadow-sm outline-none transition hover:border-[#F39200]/60 focus-visible:border-[#F39200] focus-visible:ring-2 focus-visible:ring-[#F39200]/10';
const TRANSFER_SEARCH_INPUT_CLASS = 'h-11 w-full rounded-[1rem] border border-zinc-200 bg-white pl-10 pr-10 text-sm font-semibold text-[#1A1A1A] shadow-[0_2px_4px_rgba(15,23,42,0.04)] outline-none transition-colors placeholder:text-zinc-400 focus:border-[#F39200] focus:bg-white';
const TRANSFER_CODE_INPUT_CLASS = 'h-11 w-full rounded-[1rem] border border-zinc-200 bg-white px-3 font-mono text-sm font-black uppercase tracking-[0.12em] text-[#1A1A1A] shadow-[0_2px_4px_rgba(15,23,42,0.04)] outline-none transition-colors placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-zinc-400 focus:border-[#F39200] focus:bg-white';
const TRANSFER_SELECT_TRIGGER_CLASS = 'flex h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-[1rem] border border-zinc-200 bg-white px-3 text-sm font-semibold text-[#1A1A1A] shadow-[0_2px_4px_rgba(15,23,42,0.04)] outline-none transition-colors hover:border-[#F39200]/55 hover:bg-white [&>span:first-child]:min-w-0 [&>span:first-child]:truncate';
const TRANSFER_DATE_TRIGGER_CLASS = 'h-11 rounded-[1rem] border border-zinc-200 bg-white text-sm font-semibold shadow-[0_2px_4px_rgba(15,23,42,0.04)]';
const TRANSFER_SOFT_BUTTON_CLASS = 'inline-flex h-10 items-center justify-center gap-2 rounded-[1rem] border border-[#ececec] bg-[#ededed] px-4 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 shadow-[4px_4px_10px_#d0d0d0,-4px_-4px_10px_#ffffff] transition-colors duration-200 hover:brightness-[0.99] active:shadow-[inset_2px_2px_8px_#d0d0d0,inset_-2px_-2px_8px_#ffffff] disabled:pointer-events-none disabled:opacity-50';
const TRANSFER_MICRO_BUTTON_CLASS = 'inline-flex h-8 w-8 items-center justify-center rounded-[0.8rem] border border-[#ececec] bg-[#ededed] text-zinc-600 shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff] transition-[color,border-color,transform,box-shadow] duration-200 hover:brightness-[0.99] active:scale-[0.98] active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff] disabled:pointer-events-none disabled:opacity-40';
const TRANSFER_MODAL_CLOSE_CLASS = 'inline-flex h-10 w-10 items-center justify-center rounded-[1rem] border border-[#ececec] bg-[#ededed] text-zinc-500 shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff] transition hover:text-zinc-900';

const metricCards = [
    { key: 'enviados', label: 'Enviados', tone: 'text-[#136191]', dot: 'bg-[#136191]' },
    { key: 'recibidos', label: 'Recibidos', tone: 'text-emerald-700', dot: 'bg-emerald-500' },
    { key: 'nuevos', label: 'Nuevos', tone: 'text-[#F39200]', dot: 'bg-[#F39200]' },
    { key: 'bloqueados', label: 'Bloqueados', tone: 'text-amber-700', dot: 'bg-amber-500' },
];

const defaultRecipientInfo = {
    fixed_limit: 3,
    fixed_used: 0,
    fixed_available: 3,
    additional_limit: 0,
    additional_used: 0,
    additional_available: 0,
    additional_active: 0,
    items: [],
};

const todayInput = () => new Date().toISOString().slice(0, 10);
const monthAgoInput = () => {
    const value = new Date();
    value.setDate(value.getDate() - 30);
    return value.toISOString().slice(0, 10);
};

const formatDate = (value) => {
    if (!value) return 'Sin fecha';
    return new Date(value).toLocaleString();
};

const getTimelineLabel = (event) => event?.type_label || timelineTypeLabels[event?.type] || event?.label || 'Evento de transferencia';
const getTimelineTypeLabel = (event) => event?.type_label || timelineTypeLabels[event?.type] || 'Evento de transferencia';

const getErrorMessage = (error, fallback) => {
    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (detail?.message) return detail.message;
    if (detail?.code) return detail.code;
    return fallback;
};

function TransferSignalButton({ label, value, dotClass, title, onClick }) {
    const Tag = onClick ? 'button' : 'div';
    return (
        <Tag
            type={onClick ? 'button' : undefined}
            onClick={onClick}
            title={title}
            className="inline-flex h-7 min-w-[92px] items-center justify-between gap-2 rounded-full border border-zinc-200 bg-white px-2.5 text-left shadow-sm transition hover:border-[#F39200]/40 hover:bg-[#fff7ed]"
        >
            <span className="flex min-w-0 items-center gap-1.5">
                <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
                <span className="truncate text-[8px] font-black uppercase tracking-[0.14em] text-zinc-500">{label}</span>
            </span>
            <span className="shrink-0 text-[12px] font-black tabular-nums text-[#1A1A1A]">{value}</span>
        </Tag>
    );
}

function NewShipmentModal({ open, onClose, onCreated, recipients = [], empresaId = null }) {
    const [loading, setLoading] = useState(false);
    const [projects, setProjects] = useState([]);
    const [bases, setBases] = useState([]);
    const [payload, setPayload] = useState({
        recipient_id: '',
        asset_type: 'proyecto',
        asset_id: '',
        description: '',
        marketplace_confirmed: false,
    });
    const [preflight, setPreflight] = useState(null);
    const [error, setError] = useState('');

    const assets = payload.asset_type === 'proyecto' ? projects : bases;
    const assetOptions = assets.map((item) => ({
        ...item,
        nombre: item.nombre || item.titulo || `ID ${item.id}`,
    }));

    useEffect(() => {
        if (!open) return;
        let alive = true;
        const load = async () => {
            setLoading(true);
            setError('');
            try {
                const tenantParams = empresaId ? { empresa_id: empresaId } : {};
                const [projectData, basesResponse] = await Promise.all([
                    proyectosApi.getAll(tenantParams),
                    basesTrabajoApi.getAll(tenantParams),
                ]);
                if (!alive) return;
                setProjects(Array.isArray(projectData) ? projectData : []);
                setBases(Array.isArray(basesResponse?.data) ? basesResponse.data : []);
            } catch (err) {
                if (alive) setError(getErrorMessage(err, 'No se pudo cargar la informacion de envio.'));
            } finally {
                if (alive) setLoading(false);
            }
        };
        load();
        return () => {
            alive = false;
        };
    }, [empresaId, open]);

    useEffect(() => {
        setPayload((current) => ({ ...current, asset_id: '', description: '' }));
        setPreflight(null);
    }, [payload.asset_type]);

    const selectedAsset = assets.find((item) => String(item.id) === String(payload.asset_id));

    const buildPayload = (overrides = {}) => ({
        recipient_id: Number(payload.recipient_id),
        asset_type: payload.asset_type,
        asset_id: Number(payload.asset_id),
        description: (payload.description || selectedAsset?.nombre || selectedAsset?.titulo || '').trim(),
        marketplace_confirmed: Boolean(payload.marketplace_confirmed),
        ...overrides,
    });

    const runPreflight = async () => {
        setError('');
        setLoading(true);
        try {
            const result = await transferenciasApi.preflight(buildPayload({ dry_run: true }), empresaId);
            setPreflight(result);
        } catch (err) {
            setError(getErrorMessage(err, 'No se pudo validar el envio.'));
        } finally {
            setLoading(false);
        }
    };

    const createShipment = async () => {
        setError('');
        setLoading(true);
        try {
            await transferenciasApi.createShipment(buildPayload({ dry_run: false }), empresaId);
            await onCreated();
            onClose();
        } catch (err) {
            setError(getErrorMessage(err, 'No se pudo crear el envio.'));
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[900] flex items-center justify-center bg-black/45 p-4">
            <div className="max-h-[92dvh] w-full max-w-4xl overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F39200]">Validación técnica</p>
                        <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Nuevo envio</h2>
                    </div>
                    <button type="button" onClick={onClose} className={TRANSFER_MODAL_CLOSE_CLASS}>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="custom-scrollbar max-h-[calc(92dvh-86px)] overflow-y-auto bg-[#F2F4F7]/60 p-5">
                    {error && (
                        <div className="mb-4 rounded-[1rem] border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                        <section className={TRANSFER_SOFT_SECTION_CLASS}>
                            <div className="mb-4 grid gap-3 md:grid-cols-2">
                                <label className="space-y-1">
                                    <span className={TRANSFER_FIELD_LABEL_CLASS}>Destinatario</span>
                                    <SearchableSelect
                                        options={recipients}
                                        value={payload.recipient_id}
                                        onChange={(value) => setPayload((current) => ({ ...current, recipient_id: value }))}
                                        placeholder="Seleccionar empresa"
                                        labelKey="company_display_name"
                                        valueKey="id"
                                        triggerClassName={TRANSFER_SELECT_TRIGGER_CLASS}
                                    />
                                </label>
                                <label className="space-y-1">
                                    <span className={TRANSFER_FIELD_LABEL_CLASS}>Activo</span>
                                    <SearchableSelect
                                        options={assetTypeOptions}
                                        value={payload.asset_type}
                                        onChange={(value) => setPayload((current) => ({ ...current, asset_type: value }))}
                                        placeholder="Seleccionar tipo"
                                        triggerClassName={TRANSFER_SELECT_TRIGGER_CLASS}
                                    />
                                </label>
                            </div>
                            {recipients.length === 0 && (
                                <div className="mb-4 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold text-amber-800">
                                    No hay empresas habilitadas. Usa el semaforo `Empresas` de la barra principal para adicionar destinatarios antes de enviar.
                                </div>
                            )}
                            <label className="mb-4 block space-y-1">
                                <span className={TRANSFER_FIELD_LABEL_CLASS}>Elemento</span>
                                <SearchableSelect
                                    options={assetOptions}
                                    value={payload.asset_id}
                                    onChange={(value) => {
                                        const asset = assets.find((item) => String(item.id) === String(value));
                                        setPayload((current) => ({ ...current, asset_id: value, description: asset?.nombre || asset?.titulo || current.description }));
                                    }}
                                    placeholder="Seleccionar"
                                    labelKey="nombre"
                                    valueKey="id"
                                    triggerClassName={TRANSFER_SELECT_TRIGGER_CLASS}
                                />
                            </label>
                            <label className="block space-y-1">
                                <span className={TRANSFER_FIELD_LABEL_CLASS}>Descripcion obligatoria</span>
                                <textarea
                                    value={payload.description}
                                    onChange={(event) => setPayload((current) => ({ ...current, description: event.target.value }))}
                                    placeholder={selectedAsset?.nombre || 'Descripcion del envio'}
                                    className={TRANSFER_TEXTAREA_CLASS}
                                />
                            </label>
                        </section>

                        <aside className={TRANSFER_SOFT_SECTION_CLASS}>
                            {preflight ? (
                                <div className="space-y-3">
                                    <div className="rounded-[1rem] border border-zinc-200 bg-white px-4 py-3 shadow-sm">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Snapshot</p>
                                        <p className="mt-1 break-all font-mono text-[11px] font-bold text-zinc-700">{preflight.snapshot_hash}</p>
                                    </div>
                                    {preflight.marketplace_requirements?.length > 0 && (
                                        <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3">
                                            <div className="mb-2 flex items-center gap-2 text-amber-700">
                                                <ShoppingCart className="h-4 w-4" />
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Marketplace requerido</p>
                                            </div>
                                            <div className="space-y-2">
                                                {preflight.marketplace_requirements.map((item, index) => (
                                                    <div key={`${item.product_id || 'manual'}-${index}`} className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-zinc-700">
                                                        {item.product_title} {item.price ? `· ${item.price} ${item.currency}` : ''}
                                                    </div>
                                                ))}
                                            </div>
                                            <label className="mt-3 flex items-start gap-2 text-xs font-bold text-amber-800">
                                                <input
                                                    type="checkbox"
                                                    checked={payload.marketplace_confirmed}
                                                    onChange={(event) => setPayload((current) => ({ ...current, marketplace_confirmed: event.target.checked }))}
                                                    className="mt-0.5"
                                                />
                                                Confirmo el doble aviso: el receptor debera adquirir todos los productos Marketplace para importar o usar el envio.
                                            </label>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="rounded-[1rem] border border-dashed border-zinc-200 bg-white/80 px-4 py-8 text-center text-sm font-bold text-zinc-400">
                                    Ejecuta validación para ver snapshot, bloqueos y dependencias.
                                </div>
                            )}
                        </aside>
                    </div>

                    <div className="mt-5 flex flex-wrap justify-end gap-3">
                        <button type="button" onClick={runPreflight} disabled={loading || !payload.recipient_id || !payload.asset_id} className={TRANSFER_SOFT_BUTTON_CLASS}>
                            <HelpCircle className="h-4 w-4" />
                            Validación
                        </button>
                        <LiquidButton onClick={createShipment} disabled={loading || !preflight || (preflight.requires_marketplace_confirmation && !payload.marketplace_confirmed)} className="!h-10 !rounded-[1rem] bg-[#1A1A1A] px-6 text-white">
                            <Send className="h-4 w-4" />
                            Enviar
                        </LiquidButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RecipientManagementModal({ open, onClose, recipientsInfo, onRefresh, empresaId = null }) {
    const [myCode, setMyCode] = useState(null);
    const [recipientCode, setRecipientCode] = useState('');
    const [recipientPreview, setRecipientPreview] = useState(null);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const info = recipientsInfo || defaultRecipientInfo;
    const recipients = info.items || [];
    const fixedRecipients = recipients.filter((recipient) => recipient.recipient_kind === 'fixed');
    const additionalRecipients = recipients.filter((recipient) => recipient.recipient_kind === 'additional');

    useEffect(() => {
        if (!open) return;
        let alive = true;
        const loadCode = async () => {
            setLoading(true);
            setError('');
            setSuccess('');
            try {
                const codeData = await transferenciasApi.getMyCode(empresaId);
                if (alive) setMyCode(codeData?.public_code || null);
            } catch (err) {
                if (alive) setError(getErrorMessage(err, 'No se pudo cargar el codigo publico de empresa.'));
            } finally {
                if (alive) setLoading(false);
            }
        };
        setRecipientCode('');
        setRecipientPreview(null);
        loadCode();
        return () => {
            alive = false;
        };
    }, [empresaId, open]);

    const resolveRecipientCode = async () => {
        const normalizedCode = recipientCode.trim();
        setError('');
        setSuccess('');
        setRecipientPreview(null);
        if (!normalizedCode) {
            setError('Introduce el codigo publico de la empresa destino.');
            return;
        }
        setLoading(true);
        try {
            const preview = await transferenciasApi.resolveRecipientCode(normalizedCode, empresaId);
            setRecipientPreview(preview);
        } catch (err) {
            setError(getErrorMessage(err, 'No se pudo validar el codigo indicado.'));
        } finally {
            setLoading(false);
        }
    };

    const confirmRecipientCode = async () => {
        if (!recipientPreview) return;
        setError('');
        setSuccess('');
        setLoading(true);
        try {
            await transferenciasApi.createRecipient({
                public_code: recipientCode.trim(),
                confirm: true,
                confirmed_display_name: recipientPreview.company_display_name,
            }, empresaId);
            await onRefresh();
            setRecipientCode('');
            setRecipientPreview(null);
            setSuccess('Empresa asociada para envios.');
        } catch (err) {
            setError(getErrorMessage(err, 'No se pudo asociar la empresa destino.'));
        } finally {
            setLoading(false);
        }
    };

    if (!open) return null;

    const renderRecipientList = (items, emptyText) => (
        <div className="max-h-[260px] overflow-y-auto rounded-xl border border-zinc-100 bg-zinc-50/70 p-2">
            {items.length === 0 ? (
                <div className="flex min-h-[92px] items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-white px-3 text-center text-xs font-bold text-zinc-400">
                    {emptyText}
                </div>
            ) : (
                <div className="space-y-2">
                    {items.map((recipient) => (
                        <div key={recipient.id} className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="truncate text-xs font-black uppercase text-[#1A1A1A]">{recipient.company_display_name}</p>
                                    <p className="truncate text-[10px] font-bold text-zinc-400">{recipient.company_name}</p>
                                </div>
                                <span className={`inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] ${
                                    recipient.recipient_kind === 'additional'
                                        ? 'border-sky-200 bg-sky-50 text-sky-700'
                                        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                }`}>
                                    {recipient.recipient_kind === 'additional' ? 'Conecta' : 'Fija'}
                                </span>
                            </div>
                            {recipient.recipient_kind === 'additional' && (
                                <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.1em] text-amber-700">
                                    Expira: {formatDate(recipient.expires_at)}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    return (
        <div className="fixed inset-0 z-[920] flex items-center justify-center bg-black/45 p-4">
            <div className="max-h-[92dvh] w-full max-w-5xl overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between border-b border-zinc-100 bg-white px-6 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F39200]">Red de comunicacion</p>
                        <h2 className="text-xl font-black uppercase tracking-tight text-[#1A1A1A]">Empresas para comunicarse</h2>
                    </div>
                    <button type="button" onClick={onClose} className={TRANSFER_MODAL_CLOSE_CLASS}>
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="custom-scrollbar max-h-[calc(92dvh-86px)] overflow-y-auto bg-[#F2F4F7]/60 p-5">
                    {(error || success) && (
                        <div className={`mb-4 rounded-[1rem] border px-4 py-3 text-sm font-bold ${
                            error ? 'border-red-200 bg-red-50 text-red-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700'
                        }`}>
                            {error || success}
                        </div>
                    )}

                    <div className="grid gap-4 lg:grid-cols-[0.95fr_1.35fr]">
                        <section className={TRANSFER_SOFT_SECTION_CLASS}>
                            <div className="mb-4 rounded-[1rem] border border-emerald-200 bg-white px-4 py-3 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Codigo publico de empresa</p>
                                <p className="mt-1 font-mono text-lg font-black text-emerald-800">{myCode || 'Sin codigo'}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2">
                                    <p className={TRANSFER_FIELD_LABEL_CLASS}>Fijas plan</p>
                                    <p className="mt-1 text-lg font-black text-[#1A1A1A]">{info.fixed_used || 0}/{info.fixed_limit || 3}</p>
                                    <p className="text-[10px] font-bold text-zinc-400">Disponibles {info.fixed_available || 0}</p>
                                </div>
                                <div className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2">
                                    <p className={TRANSFER_FIELD_LABEL_CLASS}>Conecta</p>
                                    <p className="mt-1 text-lg font-black text-[#136191]">{info.additional_used || 0}/{info.additional_limit || 0}</p>
                                    <p className="text-[10px] font-bold text-sky-700">Disponibles {info.additional_available || 0}</p>
                                </div>
                            </div>

                            <div className="mt-4 rounded-[1rem] border border-zinc-200 bg-white p-3 shadow-sm">
                                <label className="block space-y-1">
                                    <span className={TRANSFER_FIELD_LABEL_CLASS}>Codigo de conexion</span>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <input
                                            type="text"
                                            value={recipientCode}
                                            onChange={(event) => {
                                                setRecipientCode(event.target.value.toUpperCase());
                                                setRecipientPreview(null);
                                                setError('');
                                                setSuccess('');
                                            }}
                                            placeholder="ABC - 123"
                                            maxLength={12}
                                            className={TRANSFER_CODE_INPUT_CLASS}
                                        />
                                        <button type="button" onClick={resolveRecipientCode} disabled={loading || !recipientCode.trim()} className={TRANSFER_SOFT_BUTTON_CLASS}>
                                            <KeyRound className="h-4 w-4" />
                                            Validar
                                        </button>
                                    </div>
                                </label>
                                {recipientPreview && (
                                    <div className="mt-3 rounded-xl border border-[#F39200]/30 bg-[#F39200]/5 px-3 py-2">
                                        <p className={TRANSFER_FIELD_LABEL_CLASS}>Empresa detectada</p>
                                        <p className="mt-1 text-sm font-black uppercase text-[#1A1A1A]">{recipientPreview.company_display_name}</p>
                                        {recipientPreview.company_alias && (
                                            <p className="text-[11px] font-bold text-zinc-500">{recipientPreview.company_name}</p>
                                        )}
                                        <button type="button" onClick={confirmRecipientCode} disabled={loading} className={`${TRANSFER_SOFT_BUTTON_CLASS} mt-3 border-emerald-100 text-emerald-700`}>
                                            <CheckCircle2 className="h-4 w-4" />
                                            Confirmar empresa
                                        </button>
                                    </div>
                                )}
                            </div>
                        </section>

                        <section className="grid gap-4 md:grid-cols-2">
                            <div className={TRANSFER_SOFT_SECTION_CLASS}>
                                <div className="mb-3 flex items-center justify-between">
                                    <p className={TRANSFER_FIELD_LABEL_CLASS}>Empresas fijas incluidas</p>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-emerald-700">
                                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                                        {info.fixed_used || 0}/{info.fixed_limit || 3}
                                    </span>
                                </div>
                                {renderRecipientList(fixedRecipients, 'Sin empresas fijas asociadas.')}
                            </div>

                            <div className={TRANSFER_SOFT_SECTION_CLASS}>
                                <div className="mb-3 flex items-center justify-between">
                                    <p className={TRANSFER_FIELD_LABEL_CLASS}>Empresas adicionales Conecta</p>
                                    <span className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.12em] text-sky-700">
                                        <span className="h-2 w-2 rounded-full bg-sky-500" />
                                        {info.additional_used || 0}/{info.additional_limit || 0}
                                    </span>
                                </div>
                                {renderRecipientList(additionalRecipients, 'Sin empresas adicionales Conecta activas.')}
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}

function RejectShipmentModal({ shipment, onClose, onConfirm, loading }) {
    const [reason, setReason] = useState('');

    if (!shipment) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-rose-500">Rechazo de envio</p>
                        <h3 className="text-xl font-black uppercase text-[#1A1A1A]">Motivo obligatorio</h3>
                    </div>
                    <button type="button" onClick={onClose} className={TRANSFER_MODAL_CLOSE_CLASS}>
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="space-y-4 bg-[#F2F4F7]/60 p-5">
                    <div className={TRANSFER_SOFT_SECTION_CLASS}>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Envio seleccionado</p>
                        <p className="mt-1 text-sm font-black text-zinc-800">{shipment.asset_name || shipment.description}</p>
                        <p className="text-xs font-bold text-zinc-500">{shipment.company_display_name}</p>
                    </div>
                    <label className="space-y-2">
                        <span className={TRANSFER_FIELD_LABEL_CLASS}>Motivo</span>
                        <textarea
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            rows={4}
                            className={TRANSFER_TEXTAREA_CLASS}
                            placeholder="Indica el motivo que se notificara al emisor..."
                        />
                    </label>
                    <div className="flex flex-wrap justify-end gap-3">
                        <button type="button" onClick={onClose} className={TRANSFER_SOFT_BUTTON_CLASS}>
                            Cancelar
                        </button>
                        <LiquidButton
                            onClick={() => onConfirm(reason.trim())}
                            disabled={loading || !reason.trim()}
                            className="!h-10 !rounded-[1rem] bg-rose-600 px-6 text-white"
                        >
                            <X className="h-4 w-4" />
                            Rechazar
                        </LiquidButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

function CancelShipmentModal({ shipment, onClose, onConfirm, loading }) {
    const [reason, setReason] = useState('');

    if (!shipment) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
            <div className="w-full max-w-xl overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)]">
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-600">Cancelacion de envio</p>
                        <h3 className="text-xl font-black uppercase text-[#1A1A1A]">Cancelar envio emitido</h3>
                    </div>
                    <button type="button" onClick={onClose} className={TRANSFER_MODAL_CLOSE_CLASS}>
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="space-y-4 bg-[#F2F4F7]/60 p-5">
                    <div className={TRANSFER_SOFT_SECTION_CLASS}>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Envio seleccionado</p>
                        <p className="mt-1 text-sm font-black text-zinc-800">{shipment.asset_name || shipment.description}</p>
                        <p className="text-xs font-bold text-zinc-500">{shipment.company_display_name}</p>
                    </div>
                    <div className="rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-bold leading-relaxed text-amber-800">
                        Puedes cancelar este envio porque todavia no ha sido importado por la empresa receptora.
                    </div>
                    <label className="space-y-2">
                        <span className={TRANSFER_FIELD_LABEL_CLASS}>Motivo opcional</span>
                        <textarea
                            value={reason}
                            onChange={(event) => setReason(event.target.value)}
                            rows={3}
                            className={TRANSFER_TEXTAREA_CLASS}
                            placeholder="Motivo interno de cancelacion..."
                        />
                    </label>
                    <div className="flex flex-wrap justify-end gap-3">
                        <button type="button" onClick={onClose} className={TRANSFER_SOFT_BUTTON_CLASS}>
                            Volver
                        </button>
                        <LiquidButton
                            onClick={() => onConfirm(reason.trim())}
                            disabled={loading}
                            className="!h-10 !rounded-[1rem] bg-amber-600 px-6 text-white"
                        >
                            <X className="h-4 w-4" />
                            Cancelar envio
                        </LiquidButton>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ShipmentTimelineModal({ shipment, onClose }) {
    if (!shipment) return null;
    const timeline = shipment.timeline || [];

    return (
        <div data-transfer-timeline-modal="true" className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-black/40 p-2 backdrop-blur-sm sm:items-center sm:p-4">
            <div className="my-2 max-h-[calc(100dvh-1rem)] w-full max-w-2xl overflow-hidden rounded-[1.75rem] border border-zinc-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:my-0 sm:max-h-[calc(100dvh-2rem)]">
                <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#136191]">Historico de transferencia</p>
                        <h3 className="text-xl font-black uppercase text-[#1A1A1A]">Trazabilidad</h3>
                    </div>
                    <button type="button" onClick={onClose} className={TRANSFER_MODAL_CLOSE_CLASS}>
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="space-y-4 bg-[#F2F4F7]/60 p-5">
                    <div className={TRANSFER_SOFT_SECTION_CLASS}>
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Envio seleccionado</p>
                        <p className="mt-1 text-sm font-black text-zinc-800">{shipment.asset_name || shipment.description}</p>
                        <p className="text-xs font-bold text-zinc-500">
                            {shipment.direction === 'entrada' ? 'Emisor' : 'Receptor'}: {shipment.company_display_name}
                        </p>
                    </div>
                    <div className="max-h-[52dvh] overflow-y-auto rounded-[1rem] border border-zinc-200 bg-white">
                        {timeline.length === 0 ? (
                            <div className="px-4 py-6 text-center text-xs font-black uppercase tracking-[0.14em] text-zinc-400">
                                Sin eventos registrados.
                            </div>
                        ) : (
                            <div className="divide-y divide-zinc-100">
                                {timeline.map((event, index) => (
                                    <div key={`${shipment.id}-${event.type}-${event.at || index}`} className="grid grid-cols-[170px_minmax(0,1fr)] gap-3 px-4 py-3">
                                        <div className="text-[11px] font-black tabular-nums text-zinc-500">
                                            {event.at ? formatDate(event.at) : 'Sin fecha'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-[#1A1A1A]">{getTimelineLabel(event)}</p>
                                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-400">{getTimelineTypeLabel(event)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function EnviosTransferencias() {
    const { selectedEmpresa } = useContext(AuthContext);
    const [searchParams] = useSearchParams();
    const selectedEmpresaId = selectedEmpresa?.id || null;
    const [direction, setDirection] = useState(searchParams.get('bandeja') === 'entrada' ? 'entrada' : 'todos');
    const [status, setStatus] = useState('');
    const [query, setQuery] = useState('');
    const [dateFrom, setDateFrom] = useState(monthAgoInput());
    const [dateTo, setDateTo] = useState(todayInput());
    const [tray, setTray] = useState(null);
    const [recipientsInfo, setRecipientsInfo] = useState(defaultRecipientInfo);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [recipientsModalOpen, setRecipientsModalOpen] = useState(false);
    const [rejectShipment, setRejectShipment] = useState(null);
    const [cancelShipment, setCancelShipment] = useState(null);
    const [timelineShipment, setTimelineShipment] = useState(null);

    const states = tray?.states?.length ? tray.states : fallbackStates;
    const metrics = tray?.metrics || {};
    const recipients = recipientsInfo.items || [];

    const loadTray = useCallback(async () => {
        if (!selectedEmpresaId) {
            setTray(null);
            setError('Selecciona una empresa activa para cargar Envios y Transferencias.');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const data = await transferenciasApi.getTray({
                direction,
                status: status || undefined,
                q: query || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
                limit: 80,
            }, selectedEmpresaId);
            setTray(data);
        } catch (err) {
            setError(getErrorMessage(err, 'No se pudo cargar la bandeja.'));
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo, direction, query, selectedEmpresaId, status]);

    const loadRecipients = useCallback(async () => {
        if (!selectedEmpresaId) {
            setRecipientsInfo(defaultRecipientInfo);
            return null;
        }
        const data = await transferenciasApi.getRecipients(selectedEmpresaId);
        setRecipientsInfo({
            ...defaultRecipientInfo,
            ...(data || {}),
            items: data?.items || [],
        });
        return data;
    }, [selectedEmpresaId]);

    useEffect(() => {
        setTray(null);
        setRecipientsInfo(defaultRecipientInfo);
        setModalOpen(false);
        setRecipientsModalOpen(false);
        setRejectShipment(null);
        setCancelShipment(null);
        setTimelineShipment(null);
        setError('');
    }, [selectedEmpresaId]);

    useEffect(() => {
        loadTray();
    }, [loadTray]);

    useEffect(() => {
        const intervalId = window.setInterval(loadTray, 30000);
        return () => window.clearInterval(intervalId);
    }, [loadTray]);

    useEffect(() => {
        const handleTransferSignalOpened = () => {
            setDirection('entrada');
            setStatus('');
            setQuery('');
            setDateFrom(monthAgoInput());
            setDateTo(todayInput());
        };
        window.addEventListener('giproy:transfer-signal-opened', handleTransferSignalOpened);
        return () => window.removeEventListener('giproy:transfer-signal-opened', handleTransferSignalOpened);
    }, []);

    useEffect(() => {
        loadRecipients().catch((err) => {
            setError(getErrorMessage(err, 'No se pudo cargar la red de empresas.'));
        });
    }, [loadRecipients]);

    const stateByCode = useMemo(() => Object.fromEntries(states.map((item) => [item.code, item])), [states]);
    const recipientTotals = useMemo(() => {
        const fixedLimit = Number(recipientsInfo.fixed_limit || 0);
        const fixedUsed = Number(recipientsInfo.fixed_used || 0);
        const additionalLimit = Number(recipientsInfo.additional_limit || 0);
        const additionalUsed = Number(recipientsInfo.additional_used || 0);
        return {
            used: fixedUsed + additionalUsed,
            limit: fixedLimit + additionalLimit,
            available: Number(recipientsInfo.fixed_available || 0) + Number(recipientsInfo.additional_available || 0),
        };
    }, [recipientsInfo]);

    const runAction = async (action, afterSuccess) => {
        setError('');
        if (!selectedEmpresaId) {
            setError('Selecciona una empresa activa para operar Envios y Transferencias.');
            return;
        }
        try {
            await action(selectedEmpresaId);
            await loadTray();
            if (afterSuccess) afterSuccess();
        } catch (err) {
            setError(getErrorMessage(err, 'No se pudo completar la accion.'));
        }
    };

    return (
        <div data-transferencias-workspace="true" className="h-full overflow-y-auto bg-[#F2F4F7] p-3 text-[#1A1A1A] sm:p-6">
            <div className="mx-auto flex max-w-[1700px] flex-col gap-5">
                <section className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-4 shadow-sm">
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#F39200]">Otros Servicios</p>
                            <h1 className="mt-1 text-2xl font-black uppercase tracking-tight">Envios y Transferencias</h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                            <ProjectHeaderActionButton
                                icon={Building2}
                                label="Empresas"
                                onClick={() => setRecipientsModalOpen(true)}
                                tone="primary"
                                size="md"
                                stacked
                            />
                            <ProjectHeaderActionButton
                                icon={Send}
                                label="Nuevo envio"
                                onClick={() => setModalOpen(true)}
                                tone="warning"
                                size="md"
                                stacked
                            />
                            <ProjectHeaderActionButton
                                icon={null}
                                label="Refrescar"
                                onClick={loadTray}
                                disabled={loading}
                                tone="primary"
                                size="md"
                                stacked
                            >
                                <RefreshCw className={`h-[15px] w-[15px] shrink-0 text-[#136191] ${loading ? 'animate-spin' : ''}`} />
                                <span className="text-center text-[9px] font-black uppercase leading-tight tracking-[0.16em] text-[#136191]">Refrescar</span>
                            </ProjectHeaderActionButton>
                        </div>
                    </div>
                </section>

                <section className={TRANSFER_TOOL_SHELL_CLASS}>
                    <div className="flex flex-col gap-2 2xl:flex-row 2xl:items-center 2xl:justify-between">
                        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                            <ProjectSegmentedSwitch
                                value={direction}
                                onChange={setDirection}
                                options={directionOptions}
                                size="sm"
                                ariaLabel="Bandeja de transferencias"
                                minSegmentWidth={78}
                            />
                            <ClearSearchField
                                value={query}
                                onValueChange={setQuery}
                                placeholder="Buscar empresa, alias, descripcion o activo..."
                                containerClassName="w-full xl:w-[420px]"
                                inputClassName={TRANSFER_SEARCH_INPUT_CLASS}
                            />
                        </div>
                        <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-end">
                            <div className="flex flex-wrap items-center gap-1.5">
                                <TransferSignalButton
                                    label="Empresas"
                                    value={`${recipientTotals.used}/${recipientTotals.limit}`}
                                    dotClass={recipientTotals.available > 0 ? 'bg-emerald-500' : 'bg-amber-500'}
                                    title={`Empresas para comunicarse. Disponibles: ${recipientTotals.available}. Fijas ${recipientsInfo.fixed_used || 0}/${recipientsInfo.fixed_limit || 3}. Conecta ${recipientsInfo.additional_used || 0}/${recipientsInfo.additional_limit || 0}.`}
                                    onClick={() => setRecipientsModalOpen(true)}
                                />
                                {metricCards.map((item) => (
                                    <TransferSignalButton
                                        key={item.key}
                                        label={item.label}
                                        value={metrics[item.key] || 0}
                                        dotClass={item.dot}
                                        title={`${item.label}: ${metrics[item.key] || 0}`}
                                    />
                                ))}
                            </div>
                            <div className="grid gap-2 sm:grid-cols-3 xl:w-auto xl:grid-cols-[170px_132px_132px]">
                            <SearchableSelect
                                options={[{ code: '', label: 'Todos los estados' }, ...states]}
                                value={status}
                                onChange={(value) => setStatus(value)}
                                placeholder="Todos los estados"
                                labelKey="label"
                                valueKey="code"
                                triggerClassName={TRANSFER_SELECT_TRIGGER_CLASS}
                            />
                            <AnimatedDateInput
                                type="date"
                                value={dateFrom}
                                onChange={(event) => setDateFrom(event.target.value)}
                                variant="compact"
                                className={TRANSFER_DATE_TRIGGER_CLASS}
                            />
                            <AnimatedDateInput
                                type="date"
                                value={dateTo}
                                onChange={(event) => setDateTo(event.target.value)}
                                variant="compact"
                                className={TRANSFER_DATE_TRIGGER_CLASS}
                            />
                            </div>
                        </div>
                    </div>
                </section>

                {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">{error}</div>}

                <section className="custom-scrollbar overflow-x-auto overflow-y-hidden rounded-[2rem] border border-zinc-200 bg-white">
                    <div className="grid min-w-[980px] grid-cols-[110px_minmax(220px,1fr)_minmax(220px,0.95fr)_180px_190px] border-b border-zinc-200 bg-zinc-50/80 px-5 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                        <span>Tipo</span>
                        <span>Empresa</span>
                        <span>Activo</span>
                        <span>Estado</span>
                        <span>Acciones</span>
                    </div>
                    <div className="custom-scrollbar max-h-[58dvh] min-w-[980px] overflow-y-auto">
                        {loading && <div className="p-8 text-center text-sm font-bold text-zinc-400">Cargando bandeja...</div>}
                        {!loading && (tray?.items || []).length === 0 && <div className="p-8 text-center text-sm font-bold text-zinc-400">Sin envios en el rango seleccionado.</div>}
                        {(tray?.items || []).map((item) => {
                            const state = stateByCode[item.status] || {};
                            const statusClass = statusClasses[item.status_color || state.color] || statusClasses.neutral;
                            return (
                                <article key={item.id} className="grid grid-cols-[110px_minmax(220px,1fr)_minmax(220px,0.95fr)_180px_190px] items-center gap-3 border-b border-zinc-100 px-5 py-3 transition-colors hover:bg-zinc-50/60 last:border-b-0">
                                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                        {item.direction === 'entrada' ? <ArrowDownLeft className="h-4 w-4 text-emerald-600" /> : <ArrowUpRight className="h-4 w-4 text-[#136191]" />}
                                        {item.direction}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black uppercase">{item.company_display_name}</p>
                                        <p className="truncate text-[11px] font-bold text-zinc-400">{item.company_name}</p>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-black">{item.asset_name || item.description}</p>
                                        <p className="truncate text-[11px] font-bold text-zinc-400">{item.asset_type} · {formatDate(item.received_at || item.sent_at || item.created_at)}</p>
                                    </div>
                                    <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${statusClass}`}>
                                        {item.status_label}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <button type="button" data-adaptive-touch-target="true" title="Historial" onClick={() => setTimelineShipment(item)} className={`${TRANSFER_MICRO_BUTTON_CLASS} hover:border-[#136191]/40 hover:text-[#136191]`}>
                                            <Clock3 className="h-4 w-4" />
                                        </button>
                                        {item.direction === 'entrada' && !['importado', 'rechazado', 'cancelado', 'expirado'].includes(item.status) && (
                                            <>
                                                <button type="button" data-adaptive-touch-target="true" title="Importar" onClick={() => runAction((empresaId) => transferenciasApi.importShipment(item.id, empresaId))} className={`${TRANSFER_MICRO_BUTTON_CLASS} border-emerald-100 text-emerald-700 hover:border-emerald-300`}>
                                                    <PackageCheck className="h-4 w-4" />
                                                </button>
                                                <button type="button" data-adaptive-touch-target="true" title="Rechazar" onClick={() => setRejectShipment(item)} className={`${TRANSFER_MICRO_BUTTON_CLASS} border-rose-100 text-rose-700 hover:border-rose-300`}>
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </>
                                        )}
                                        {item.direction === 'salida' && !['importado', 'cancelado', 'rechazado', 'expirado'].includes(item.status) && (
                                            <button type="button" data-adaptive-touch-target="true" title="Cancelar envio" onClick={() => setCancelShipment(item)} className={`${TRANSFER_MICRO_BUTTON_CLASS} border-amber-100 text-amber-700 hover:border-amber-300`}>
                                                <X className="h-4 w-4" />
                                            </button>
                                        )}
                                        {item.status === 'bloqueado_marketplace' && (
                                            <button type="button" data-adaptive-touch-target="true" title="Revalidar compras" onClick={() => runAction((empresaId) => transferenciasApi.revalidateMarketplaceRequirements(item.id, empresaId))} className={`${TRANSFER_MICRO_BUTTON_CLASS} border-amber-100 text-amber-700 hover:border-amber-300`}>
                                                <ShoppingCart className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="col-span-5 flex flex-wrap gap-1.5 pt-1">
                                        {(item.timeline || []).slice(0, 5).map((event, index) => (
                                            <span key={`${item.id}-${event.type}-${index}`} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[9px] font-bold text-zinc-500">
                                                <Clock3 className="h-3 w-3" />
                                                {event.label}
                                            </span>
                                        ))}
                                        {item.marketplace_blocked && (
                                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase text-amber-700">
                                                <AlertTriangle className="h-3 w-3" />
                                                Requiere compra Marketplace
                                            </span>
                                        )}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>
            </div>
            <RecipientManagementModal
                open={recipientsModalOpen}
                onClose={() => setRecipientsModalOpen(false)}
                recipientsInfo={recipientsInfo}
                onRefresh={loadRecipients}
                empresaId={selectedEmpresaId}
            />
            <NewShipmentModal open={modalOpen} onClose={() => setModalOpen(false)} onCreated={loadTray} recipients={recipients} empresaId={selectedEmpresaId} />
            <RejectShipmentModal
                shipment={rejectShipment}
                loading={loading}
                onClose={() => setRejectShipment(null)}
                onConfirm={(reason) => runAction(
                    (empresaId) => transferenciasApi.rejectShipment(rejectShipment.id, reason, empresaId),
                    () => setRejectShipment(null),
                )}
            />
            <CancelShipmentModal
                shipment={cancelShipment}
                loading={loading}
                onClose={() => setCancelShipment(null)}
                onConfirm={(reason) => runAction(
                    (empresaId) => transferenciasApi.cancelShipment(cancelShipment.id, reason || null, empresaId),
                    () => setCancelShipment(null),
                )}
            />
            <ShipmentTimelineModal shipment={timelineShipment} onClose={() => setTimelineShipment(null)} />
        </div>
    );
}
