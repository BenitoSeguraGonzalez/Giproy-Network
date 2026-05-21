import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import {
    AlertTriangle,
    ArrowLeft,
    Info,
    Megaphone,
    Pencil,
    Plus,
    Search,
    ShieldAlert,
    SpellCheck,
    Trash2,
} from 'lucide-react';
import api from '../api/axiosConfig';
import systemAnnouncementsApi from '../api/systemAnnouncements';
import utilsApi from '../api/utils';
import { withoutTenant } from '../api/tenant';
import { AuthContext } from '../context/AuthContext';
import ClearSearchField from '../components/ui/ClearSearchField';
import { appAlert, appConfirm } from '../utils/appDialog';
import { AppModalBody, AppModalFooter, AppModalHeader, AppModalShell } from '../components/ui/app-modal';
import { includesNormalized } from '../utils/normalizeSearch';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import AnimatedDateInput from '../components/ui/AnimatedDateInput';
import SoftSelectToggle from '../components/ui/SoftSelectToggle';

const TYPE_OPTIONS = [
    { value: 'info', label: 'Info' },
    { value: 'warning', label: 'Advertencia' },
    { value: 'critical', label: 'Crítico' },
];

const TYPE_FILTERS = [{ value: 'all', label: 'Todos los tipos' }, ...TYPE_OPTIONS];

const SCOPE_OPTIONS = [
    { value: 'global', label: 'Global' },
    { value: 'empresa', label: 'Empresas específicas' },
];

const STATUS_FILTERS = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Vigentes' },
    { value: 'upcoming', label: 'Próximos' },
    { value: 'expired', label: 'Caducados' },
];

const DURATION_OPTIONS = [
    { value: '10', label: '10 segundos' },
    { value: '20', label: '20 segundos' },
    { value: '30', label: '30 segundos' },
    { value: '60', label: '60 segundos' },
    { value: 'indefinido', label: 'Indefinido' },
];

const TYPE_META = {
    info: { label: 'Info', chip: 'border-blue-200 bg-blue-50 text-[#136191]', icon: Info, panel: 'border-blue-100 bg-blue-50/60' },
    warning: { label: 'Advertencia', chip: 'border-orange-200 bg-orange-50 text-[#F39200]', icon: AlertTriangle, panel: 'border-orange-100 bg-orange-50/60' },
    critical: { label: 'Crítico', chip: 'border-red-200 bg-red-50 text-red-600', icon: ShieldAlert, panel: 'border-red-100 bg-red-50/60' },
};

const STATUS_META = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    upcoming: 'border-blue-200 bg-blue-50 text-[#136191]',
    expired: 'border-zinc-200 bg-zinc-100 text-zinc-600',
};

const STATUS_LABELS = { active: 'Vigente', upcoming: 'Próximo', expired: 'Caducado' };
const DEFAULT_DURATION = '30';
const pad = (value) => String(value).padStart(2, '0');
const startOfDayLocal = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00`;
const endOfDayLocal = (date = new Date()) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T23:59`;

const createEmptyForm = () => ({
    titulo: '',
    mensaje: '',
    tipo: 'info',
    scope: 'global',
    empresa_ids: [],
    starts_at: startOfDayLocal(),
    ends_at: endOfDayLocal(),
    display_duration_seconds: DEFAULT_DURATION,
    is_active: true,
});

const toDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toPayloadDateTime = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
};

const formatDateTime = (value) => {
    if (!value) return 'Sin programar';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin programar';
    return new Intl.DateTimeFormat('es-ES', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
};

const formatDuration = (value) => (value == null ? 'Indefinido' : `${value} s`);
const normalizeDateTime = (value, mode) => (!value ? '' : value.includes('T') ? value : `${value}T${mode === 'start' ? '00:00' : '23:59'}`);

const buildPayload = (formState) => ({
    titulo: formState.titulo.trim(),
    mensaje: formState.mensaje.trim(),
    tipo: formState.tipo,
    scope: formState.scope,
    empresa_id: formState.scope === 'empresa' && formState.empresa_ids.length > 0 ? Number(formState.empresa_ids[0]) : null,
    target_company_ids: formState.scope === 'empresa' ? formState.empresa_ids.map(Number) : [],
    starts_at: toPayloadDateTime(formState.starts_at),
    ends_at: toPayloadDateTime(formState.ends_at),
    display_duration_seconds: formState.display_duration_seconds === 'indefinido' ? null : Number(formState.display_duration_seconds),
    is_active: Boolean(formState.is_active),
});

const AnnouncementFormModal = ({ isOpen, mode, formState, empresas, companySearch, confirmStep, saving, checkingSpell, onChange, onToggleEmpresa, onCompanySearchChange, onClose, onAdvance, onBack, onSubmit, onSpellCheck }) => {
    if (!isOpen) return null;

    const title = mode === 'edit' ? 'Editar comunicado' : 'Nuevo comunicado';
    const subtitle = confirmStep === 1
        ? 'Define alcance, vigencia, prioridad y permanencia del comunicado.'
        : 'Revise el contenido y los destinatarios antes de confirmar el guardado.';
    const filteredEmpresas = empresas.filter((empresa) => includesNormalized(empresa.nombre, companySearch));

    return (
        <AppModalShell size="2xl">
            <AppModalHeader
                title={confirmStep === 1 ? title : `Confirmar · ${title}`}
                subtitle={subtitle}
                icon={confirmStep === 1 ? Megaphone : AlertTriangle}
                iconClassName={confirmStep === 1 ? 'text-[#F39200]' : 'text-red-600'}
                iconWrapClassName={confirmStep === 1 ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}
                onClose={onClose}
            />
            <AppModalBody className="space-y-5 max-h-[76vh] overflow-y-auto">
                {confirmStep === 1 ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Título</span>
                                <input type="text" value={formState.titulo} onChange={(event) => onChange('titulo', event.target.value)} placeholder="Mantenimiento programado" className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]" />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Tipo</span>
                                <AnimatedSelect value={formState.tipo} onChange={(event) => onChange('tipo', event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]">
                                    {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </AnimatedSelect>
                            </label>
                        </div>
                        <label className="space-y-2 block">
                            <div className="flex items-center justify-between gap-3">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Mensaje</span>
                                <button
                                    type="button"
                                    onClick={onSpellCheck}
                                    disabled={checkingSpell}
                                    className="inline-flex items-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200] transition-colors hover:bg-orange-100 disabled:cursor-not-allowed disabled:opacity-60"
                                    title="Revisar ortografía del comunicado"
                                >
                                    <SpellCheck className="h-4 w-4" />
                                    {checkingSpell ? 'Revisando...' : 'Revisar ortografía'}
                                </button>
                            </div>
                            <textarea value={formState.mensaje} onChange={(event) => onChange('mensaje', event.target.value)} rows={4} placeholder="El sistema se reiniciará a las 18:30. Guarde su trabajo antes de esa hora." className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none transition-colors focus:border-[#F39200] resize-none" />
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Alcance</span>
                                <AnimatedSelect value={formState.scope} onChange={(event) => onChange('scope', event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]">
                                    {SCOPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </AnimatedSelect>
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Permanencia</span>
                                <AnimatedSelect value={formState.display_duration_seconds} onChange={(event) => onChange('display_duration_seconds', event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]">
                                    {DURATION_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </AnimatedSelect>
                            </label>
                            <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3 mt-6">
                                <input type="checkbox" checked={formState.is_active} onChange={(event) => onChange('is_active', event.target.checked)} className="w-4 h-4 accent-[#F39200]" />
                                <span className="text-sm font-black uppercase tracking-[0.14em] text-zinc-700">Comunicado activo</span>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Fecha / hora inicio</span>
                                <AnimatedDateInput type="datetime-local" value={formState.starts_at} onChange={(event) => onChange('starts_at', normalizeDateTime(event.target.value, 'start'))} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]" />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Fecha / hora fin</span>
                                <AnimatedDateInput type="datetime-local" value={formState.ends_at} onChange={(event) => onChange('ends_at', normalizeDateTime(event.target.value, 'end'))} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]" />
                            </label>
                        </div>
                        {formState.scope === 'empresa' ? (
                            <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-50/70 p-4">
                                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Empresas destinatarias</p>
                                        <p className="mt-1 text-sm text-zinc-500">Seleccione una o varias empresas. Si el alcance es específico, deja de ser global.</p>
                                    </div>
                                    <ClearSearchField
                                        value={companySearch}
                                        onValueChange={onCompanySearchChange}
                                        placeholder="Buscar empresa destinataria"
                                        containerClassName="w-full lg:w-80"
                                        searchIconClassName="left-4"
                                        inputClassName="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-10 text-sm font-semibold text-zinc-700 outline-none transition-colors focus:border-[#F39200]"
                                    />
                                </div>
                                <div className="mt-4 max-h-64 overflow-y-auto space-y-2 pr-1">
                                    {filteredEmpresas.length === 0 ? (
                                        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white px-4 py-5 text-sm font-semibold text-zinc-500">No hay empresas que coincidan con la búsqueda actual.</div>
                                    ) : filteredEmpresas.map((empresa) => (
                                        <label key={empresa.id} className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black uppercase tracking-tight text-zinc-900 truncate">{empresa.nombre}</p>
                                                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">{empresa.codigo || `EMP ${empresa.id}`}</p>
                                            </div>
                                            <SoftSelectToggle
                                                checked={formState.empresa_ids.includes(String(empresa.id))}
                                                onChange={() => onToggleEmpresa(String(empresa.id))}
                                                label={formState.empresa_ids.includes(String(empresa.id)) ? 'Quitar destinatario' : 'Seleccionar destinatario'}
                                                size="md"
                                                tone="blue"
                                                muted={!formState.empresa_ids.includes(String(empresa.id))}
                                            />
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                            Va a guardar un comunicado {mode === 'edit' ? 'actualizado' : 'nuevo'} con impacto {formState.scope === 'global' ? 'global' : 'por empresas específicas'}.
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Título</p>
                                <p className="mt-2 text-base font-black text-zinc-900">{formState.titulo || 'Sin título'}</p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Tipo y permanencia</p>
                                <p className="mt-2 text-base font-black text-zinc-900">{(TYPE_META[formState.tipo] || TYPE_META.info).label} · {formState.display_duration_seconds === 'indefinido' ? 'Indefinido' : `${formState.display_duration_seconds} segundos`}</p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Fecha / hora inicio</p>
                                <p className="mt-2 text-sm font-black text-zinc-900">{formatDateTime(formState.starts_at)}</p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Fecha / hora fin</p>
                                <p className="mt-2 text-sm font-black text-zinc-900">{formatDateTime(formState.ends_at)}</p>
                            </div>
                        </div>
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Mensaje</p>
                            <p className="mt-2 whitespace-pre-line text-sm font-medium leading-relaxed text-zinc-700">{formState.mensaje || 'Sin contenido'}</p>
                        </div>
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Destinatarios</p>
                            {formState.scope === 'global' ? (
                                <p className="mt-2 text-sm font-black text-zinc-900">Todas las empresas</p>
                            ) : (
                                <div className="mt-2 flex flex-wrap gap-2">
                                    {empresas.filter((empresa) => formState.empresa_ids.includes(String(empresa.id))).map((empresa) => (
                                        <span key={empresa.id} className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">{empresa.nombre}</span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </AppModalBody>
            <AppModalFooter>
                {confirmStep === 1 ? (
                    <>
                        <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-zinc-200 text-zinc-600 text-[11px] font-black uppercase tracking-[0.18em] hover:border-zinc-300 hover:text-zinc-900 transition-colors">Cancelar</button>
                        <button type="button" onClick={onAdvance} className="px-5 py-3 rounded-2xl bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-[0.18em] hover:bg-zinc-800 transition-colors">Revisar comunicado</button>
                    </>
                ) : (
                    <>
                        <button type="button" onClick={onBack} className="px-5 py-3 rounded-2xl border border-zinc-200 text-zinc-600 text-[11px] font-black uppercase tracking-[0.18em] hover:border-zinc-300 hover:text-zinc-900 transition-colors">Volver</button>
                        <button type="button" onClick={onSubmit} disabled={saving} className="px-5 py-3 rounded-2xl bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.18em] hover:bg-red-700 transition-colors disabled:opacity-60">{saving ? 'Guardando...' : 'Confirmar guardado'}</button>
                    </>
                )}
            </AppModalFooter>
        </AppModalShell>
    );
};

const AdminGlobalComunicados = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [announcements, setAnnouncements] = useState([]);
    const [empresas, setEmpresas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [checkingSpell, setCheckingSpell] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState('create');
    const [editingId, setEditingId] = useState(null);
    const [formState, setFormState] = useState(createEmptyForm());
    const [companySearch, setCompanySearch] = useState('');
    const [confirmStep, setConfirmStep] = useState(1);
    const [filters, setFilters] = useState({
        q: '',
        status_filter: 'all',
        tipo: 'all',
        empresa_id: '',
        starts_from: '',
        starts_to: '',
        ends_from: '',
        ends_to: '',
    });

    const loadAnnouncements = useCallback(async (nextFilters = filters) => {
        setLoading(true);
        try {
            const payload = {
                q: nextFilters.q || undefined,
                status_filter: nextFilters.status_filter,
                tipo: nextFilters.tipo !== 'all' ? nextFilters.tipo : undefined,
                empresa_id: nextFilters.empresa_id || undefined,
                starts_from: nextFilters.starts_from ? new Date(normalizeDateTime(nextFilters.starts_from, 'start')).toISOString() : undefined,
                starts_to: nextFilters.starts_to ? new Date(normalizeDateTime(nextFilters.starts_to, 'end')).toISOString() : undefined,
                ends_from: nextFilters.ends_from ? new Date(normalizeDateTime(nextFilters.ends_from, 'start')).toISOString() : undefined,
                ends_to: nextFilters.ends_to ? new Date(normalizeDateTime(nextFilters.ends_to, 'end')).toISOString() : undefined,
            };
            const data = await systemAnnouncementsApi.getAll(payload);
            setAnnouncements(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error cargando comunicados:', error);
            await appAlert({
                title: 'No se pudieron cargar los comunicados',
                message: error.response?.data?.detail || 'Revise la conectividad o el estado del backend.',
            });
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        if (!isSuperadmin) return;
        loadAnnouncements(filters);
        api.get('/empresas/', withoutTenant())
            .then((response) => setEmpresas(response.data || []))
            .catch((error) => console.error('Error cargando empresas para comunicados:', error));
    }, [isSuperadmin, loadAnnouncements, filters]);

    const metrics = useMemo(() => ({
        total: announcements.length,
        active: announcements.filter((item) => item.status === 'active').length,
        upcoming: announcements.filter((item) => item.status === 'upcoming').length,
        expired: announcements.filter((item) => item.status === 'expired').length,
    }), [announcements]);

    const openCreateModal = () => {
        setModalMode('create');
        setEditingId(null);
        setFormState(createEmptyForm());
        setCompanySearch('');
        setConfirmStep(1);
        setIsModalOpen(true);
    };

    const openEditModal = (announcement) => {
        setModalMode('edit');
        setEditingId(announcement.id);
        setFormState({
            titulo: announcement.titulo || '',
            mensaje: announcement.mensaje || '',
            tipo: announcement.tipo || 'info',
            scope: announcement.scope || 'global',
            empresa_ids: (announcement.target_company_ids || []).map(String),
            starts_at: toDateTimeLocal(announcement.starts_at) || startOfDayLocal(),
            ends_at: toDateTimeLocal(announcement.ends_at) || endOfDayLocal(),
            display_duration_seconds: announcement.display_duration_seconds == null ? 'indefinido' : String(announcement.display_duration_seconds),
            is_active: Boolean(announcement.is_active),
        });
        setCompanySearch('');
        setConfirmStep(1);
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormState(createEmptyForm());
        setCompanySearch('');
        setConfirmStep(1);
    };

    const handleFormChange = (field, value) => {
        setFormState((current) => {
            if (field === 'scope' && value === 'global') {
                return { ...current, scope: value, empresa_ids: [] };
            }
            return { ...current, [field]: value };
        });
    };

    const handleToggleEmpresa = (empresaId) => {
        setFormState((current) => {
            const exists = current.empresa_ids.includes(empresaId);
            return { ...current, empresa_ids: exists ? current.empresa_ids.filter((item) => item !== empresaId) : [...current.empresa_ids, empresaId] };
        });
    };

    const validateForm = async () => {
        const payload = buildPayload(formState);
        if (!payload.titulo || !payload.mensaje) {
            await appAlert({ title: 'Datos incompletos', message: 'Debe indicar al menos título y mensaje del comunicado.' });
            return false;
        }
        if (payload.scope === 'empresa' && payload.target_company_ids.length === 0) {
            await appAlert({ title: 'Empresas requeridas', message: 'Seleccione al menos una empresa destinataria cuando el alcance no sea global.' });
            return false;
        }
        if (payload.starts_at && payload.ends_at && new Date(payload.ends_at) < new Date(payload.starts_at)) {
            await appAlert({ title: 'Rango temporal inválido', message: 'La fecha / hora fin no puede ser anterior a la fecha / hora inicio.' });
            return false;
        }
        return true;
    };

    const handleAdvanceConfirm = async () => {
        const valid = await validateForm();
        if (valid) setConfirmStep(2);
    };

    const handleSubmit = async () => {
        const payload = buildPayload(formState);
        setSaving(true);
        try {
            if (modalMode === 'edit' && editingId) {
                await systemAnnouncementsApi.update(editingId, payload);
            } else {
                await systemAnnouncementsApi.create(payload);
            }
            closeModal();
            await loadAnnouncements(filters);
        } catch (error) {
            console.error('Error guardando comunicado:', error);
            await appAlert({
                title: 'No se pudo guardar el comunicado',
                message: error.response?.data?.detail || 'Revise las fechas, la duración y los destinatarios antes de reintentar.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (announcement) => {
        const confirmed = await appConfirm({
            title: 'Eliminar comunicado',
            message: `Se eliminará "${announcement.titulo}". Esta acción no se puede deshacer.`,
            confirmText: 'Eliminar',
            cancelText: 'Cancelar',
        });
        if (!confirmed) return;
        try {
            await systemAnnouncementsApi.remove(announcement.id);
            await loadAnnouncements(filters);
        } catch (error) {
            console.error('Error eliminando comunicado:', error);
            await appAlert({
                title: 'No se pudo eliminar',
                message: error.response?.data?.detail || 'El comunicado no pudo borrarse.',
            });
        }
    };

    const handleSpellCheck = async () => {
        const trimmed = formState.mensaje.trim();
        if (!trimmed) {
            await appAlert({
                title: 'Sin contenido para revisar',
                message: 'No hay contenido en el mensaje del comunicado para revisar ortografía.',
            });
            return;
        }

        try {
            setCheckingSpell(true);
            const res = await utilsApi.spellcheck(trimmed);
            if (res.data.has_errors) {
                const suggestionsList = Array.isArray(res.data.suggestions) ? res.data.suggestions.join('\n') : '';
                const hasAutomaticReplacement = res.data.corrected && res.data.corrected !== trimmed;
                if (!hasAutomaticReplacement) {
                    await appAlert({
                        title: 'Revisión ortográfica completada',
                        message: `Se detectaron posibles incidencias ortográficas, pero no hay una corrección automática segura para aplicar.\n\n${suggestionsList || 'Revise manualmente el contenido.'}`,
                    });
                    return;
                }
                const confirmed = await appConfirm({
                    title: 'Aplicar corrección ortográfica',
                    message: `Se han detectado posibles mejoras ortográficas en el comunicado:\n\n${suggestionsList}\n\nTexto sugerido por el asistente:\n\n"${res.data.corrected}"\n\n¿Desea reemplazar el contenido actual por esta versión corregida?`,
                    confirmLabel: 'Aplicar',
                    cancelLabel: 'Mantener actual',
                    tone: 'info',
                });
                if (confirmed) {
                    setFormState((current) => ({ ...current, mensaje: res.data.corrected }));
                }
            } else {
                await appAlert({
                    title: 'Sin correcciones necesarias',
                    message: 'No se detectaron correcciones ortográficas necesarias en el mensaje del comunicado.',
                });
            }
        } catch (error) {
            console.error('Error revisando ortografía del comunicado:', error);
            await appAlert({
                title: 'No fue posible revisar la ortografía',
                message: error.response?.data?.detail || error.message,
            });
        } finally {
            setCheckingSpell(false);
        }
    };

    const handleFilterChange = (field, value) => setFilters((current) => ({ ...current, [field]: value }));
    const applyFilters = async () => loadAnnouncements(filters);
    const clearFilters = async () => {
        const reset = { q: '', status_filter: 'all', tipo: 'all', empresa_id: '', starts_from: '', starts_to: '', ends_from: '', ends_to: '' };
        setFilters(reset);
        await loadAnnouncements(reset);
    };

    if (!isSuperadmin) {
        return (
            <div className="h-[calc(100vh-theme(spacing.20))] bg-[#F2F4F7] p-12">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                    <div className="rounded-[2rem] border border-red-100 bg-white p-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-400 mb-4">Acceso restringido</p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900">Comunicados</h1>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col bg-[#F2F4F7]">
            <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="w-full max-w-[1500px] mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver a Administración Global
                    </button>

                    <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">Operación y avisos del sistema</p>
                            <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-5xl uppercase">Comunicados</h1>
                            <p className="mt-4 max-w-4xl text-sm text-zinc-600 leading-relaxed">
                                Los comunicados se muestran en serie después de cada login. Pueden ser globales o dirigidos a una o varias empresas, con vigencia y permanencia configurables.
                            </p>
                        </div>
                        <button type="button" onClick={openCreateModal} className="inline-flex items-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-zinc-800 transition-colors">
                            <Plus className="w-4 h-4" /> Nuevo comunicado
                        </button>
                    </header>

                    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Comunicados</p><p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{metrics.total}</p></div>
                        <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 px-5 py-5"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Vigentes</p><p className="mt-3 text-3xl font-black tracking-tight text-emerald-700">{metrics.active}</p></div>
                        <div className="rounded-[1.75rem] border border-blue-200 bg-blue-50/70 px-5 py-5"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#136191]">Próximos</p><p className="mt-3 text-3xl font-black tracking-tight text-[#136191]">{metrics.upcoming}</p></div>
                        <div className="rounded-[1.75rem] border border-zinc-200 bg-zinc-100/80 px-5 py-5"><p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">Caducados</p><p className="mt-3 text-3xl font-black tracking-tight text-zinc-700">{metrics.expired}</p></div>
                    </section>

                    <section className="rounded-[2rem] border border-zinc-200 bg-white p-6 shadow-[0_10px_35px_rgba(0,0,0,0.05)] mb-8">
                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
                            <label className="space-y-2 xl:col-span-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Buscar comunicado</span>
                                <div className="relative">
                                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                    <input type="text" value={filters.q} onChange={(event) => handleFilterChange('q', event.target.value)} placeholder="Título o mensaje" className="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-zinc-700 outline-none transition-colors focus:border-[#F39200]" />
                                </div>
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Estado</span>
                                <AnimatedSelect value={filters.status_filter} onChange={(event) => handleFilterChange('status_filter', event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]">
                                    {STATUS_FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </AnimatedSelect>
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Tipo</span>
                                <AnimatedSelect value={filters.tipo} onChange={(event) => handleFilterChange('tipo', event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]">
                                    {TYPE_FILTERS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                                </AnimatedSelect>
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Empresa destinataria</span>
                                <AnimatedSelect value={filters.empresa_id} onChange={(event) => handleFilterChange('empresa_id', event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]">
                                    <option value="">Todas</option>
                                    {empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nombre}</option>)}
                                </AnimatedSelect>
                            </label>
                            <label className="space-y-2"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Fecha / hora inicio desde</span><AnimatedDateInput type="datetime-local" value={filters.starts_from} onChange={(event) => handleFilterChange('starts_from', event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]" /></label>
                            <label className="space-y-2"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Fecha / hora inicio hasta</span><AnimatedDateInput type="datetime-local" value={filters.starts_to} onChange={(event) => handleFilterChange('starts_to', event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]" /></label>
                            <label className="space-y-2"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Fecha / hora fin desde</span><AnimatedDateInput type="datetime-local" value={filters.ends_from} onChange={(event) => handleFilterChange('ends_from', event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]" /></label>
                            <label className="space-y-2"><span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Fecha / hora fin hasta</span><AnimatedDateInput type="datetime-local" value={filters.ends_to} onChange={(event) => handleFilterChange('ends_to', event.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]" /></label>
                        </div>
                        <div className="mt-5 flex flex-wrap justify-end gap-3">
                            <button type="button" onClick={clearFilters} className="px-5 py-3 rounded-2xl border border-zinc-200 text-zinc-600 text-[11px] font-black uppercase tracking-[0.18em] hover:border-zinc-300 hover:text-zinc-900 transition-colors">Limpiar filtros</button>
                            <button type="button" onClick={applyFilters} className="px-5 py-3 rounded-2xl bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-[0.18em] hover:bg-zinc-800 transition-colors">Aplicar filtros</button>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden">
                        <div className="border-b border-zinc-200 px-6 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Listado operativo</p>
                            <p className="mt-1 text-sm text-zinc-500">Los comunicados vigentes se presentan en serie después del login y respetan la prioridad configurada.</p>
                        </div>
                        <div className="max-h-[62vh] overflow-y-auto">
                            {loading ? (
                                <div className="px-6 py-10 text-sm font-semibold text-zinc-500">Cargando comunicados...</div>
                            ) : announcements.length === 0 ? (
                                <div className="px-6 py-10 text-sm font-semibold text-zinc-500">No hay comunicados que coincidan con los filtros actuales.</div>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {announcements.map((announcement) => {
                                        const meta = TYPE_META[announcement.tipo] || TYPE_META.info;
                                        const Icon = meta.icon;
                                        return (
                                            <div key={announcement.id} className={`px-6 py-5 ${meta.panel}`}>
                                                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                                            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${meta.chip}`}><Icon className="w-3.5 h-3.5" />{meta.label}</div>
                                                            <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${STATUS_META[announcement.status] || STATUS_META.active}`}>{STATUS_LABELS[announcement.status] || announcement.status}</div>
                                                            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{announcement.scope === 'empresa' ? announcement.impact_label : 'Global'}</div>
                                                            <div className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">{announcement.is_active ? 'Activo' : 'Inactivo'}</div>
                                                        </div>
                                                        <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">{announcement.titulo}</h2>
                                                        <p className="mt-2 text-sm text-zinc-600 leading-relaxed whitespace-pre-line">{announcement.mensaje}</p>
                                                        {announcement.scope === 'empresa' && announcement.target_company_names?.length > 0 ? (
                                                            <div className="mt-4 flex flex-wrap gap-2">
                                                                {announcement.target_company_names.map((name) => <span key={`${announcement.id}-${name}`} className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">{name}</span>)}
                                                            </div>
                                                        ) : null}
                                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
                                                            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3"><p className="font-black uppercase tracking-[0.16em] text-zinc-400 mb-1">Fecha / hora inicio</p><p className="font-semibold text-zinc-700">{formatDateTime(announcement.starts_at)}</p></div>
                                                            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3"><p className="font-black uppercase tracking-[0.16em] text-zinc-400 mb-1">Fecha / hora fin</p><p className="font-semibold text-zinc-700">{formatDateTime(announcement.ends_at)}</p></div>
                                                            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3"><p className="font-black uppercase tracking-[0.16em] text-zinc-400 mb-1">Permanencia</p><p className="font-semibold text-zinc-700">{formatDuration(announcement.display_duration_seconds)}</p></div>
                                                            <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-3"><p className="font-black uppercase tracking-[0.16em] text-zinc-400 mb-1">Creado</p><p className="font-semibold text-zinc-700">{formatDateTime(announcement.created_at)}</p></div>
                                                        </div>
                                                    </div>
                                                    <div className="flex shrink-0 items-center gap-2">
                                                        <button type="button" onClick={() => openEditModal(announcement)} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600 hover:border-[#F39200] hover:text-[#F39200] transition-colors"><Pencil className="w-4 h-4" /> Editar</button>
                                                        <button type="button" onClick={() => handleDelete(announcement)} className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-red-500 hover:bg-red-50 transition-colors"><Trash2 className="w-4 h-4" /> Eliminar</button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            <AnimatePresence>
                <AnnouncementFormModal
                    isOpen={isModalOpen}
                    mode={modalMode}
                    formState={formState}
                    empresas={empresas}
                    companySearch={companySearch}
                    confirmStep={confirmStep}
                    saving={saving}
                    checkingSpell={checkingSpell}
                    onChange={handleFormChange}
                    onToggleEmpresa={handleToggleEmpresa}
                    onCompanySearchChange={setCompanySearch}
                    onClose={closeModal}
                    onAdvance={handleAdvanceConfirm}
                    onBack={() => setConfirmStep(1)}
                    onSubmit={handleSubmit}
                    onSpellCheck={handleSpellCheck}
                />
            </AnimatePresence>
        </div>
    );
};

export default AdminGlobalComunicados;
