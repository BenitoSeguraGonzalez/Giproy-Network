import { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    CalendarRange,
    Clock3,
    Edit2,
    History,
    PackageCheck,
    RefreshCw,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';
import adminLicensesApi from '../api/adminLicenses';
import { conectaApi } from '../api/conecta';
import { equipoApi } from '../api/equipo';
import { AuthContext } from '../context/AuthContext';
import { appAlert, appConfirm } from '../utils/appDialog';
import { AppModalBody, AppModalFooter, AppModalHeader, AppModalShell } from '../components/ui/app-modal';
import ClearSearchField from '../components/ui/ClearSearchField';
import { includesNormalized, normalizeSearchToken } from '../utils/normalizeSearch';
import { getLicenseStatusLabel, getLicenseStatusTone } from '../utils/licenseStatusUi';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import AnimatedDateInput from '../components/ui/AnimatedDateInput';

const statusMeta = {
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    warning: 'border-orange-200 bg-orange-50 text-[#F39200]',
    exceeded: 'border-red-200 bg-red-50 text-red-600',
    disabled: 'border-zinc-200 bg-zinc-50 text-zinc-500',
};

const statusLabels = {
    ok: 'Disponible',
    warning: 'Completa',
    exceeded: 'Excedida',
    disabled: 'Sin cupo',
};

const licenseMeta = {
    active: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    expired: 'border-red-200 bg-red-50 text-red-600',
    pending: 'border-blue-200 bg-blue-50 text-blue-700',
};

const licenseLabels = {
    active: 'Vigente',
    expired: 'Vencida',
    pending: 'Pendiente',
};

const licenseFilterOptions = [
    { value: 'all', label: 'Todos' },
    { value: 'active', label: 'Vigentes' },
    { value: 'expired', label: 'Vencidas' },
    { value: 'pending', label: 'Pendientes' },
];

const historyEventMeta = {
    license_default_express_seeded: {
        label: 'Express inicial',
        tone: 'border-zinc-200 bg-zinc-50 text-zinc-600',
    },
    license_assignment_created: {
        label: 'Asignación creada',
        tone: 'border-blue-200 bg-blue-50 text-blue-700',
    },
    license_plan_change_registered: {
        label: 'Cambio de plan',
        tone: 'border-orange-200 bg-orange-50 text-[#F39200]',
    },
    license_activated: {
        label: 'Licencia activada',
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
    license_expired: {
        label: 'Licencia expirada',
        tone: 'border-red-200 bg-red-50 text-red-600',
    },
};

const LICENSE_COLORS = {
    expres: { bg: 'bg-white', border: 'border-zinc-200', text: 'text-zinc-400' },
    basico: { bg: 'bg-white', border: 'border-blue-100', text: 'text-blue-600' },
    estandar: { bg: 'bg-white', border: 'border-cyan-100', text: 'text-cyan-600' },
    profesional: { bg: 'bg-white', border: 'border-orange-100', text: 'text-[#F39200]' },
    empresarial: { bg: 'bg-white', border: 'border-indigo-100', text: 'text-indigo-600' },
    premium: { bg: 'bg-white', border: 'border-emerald-100', text: 'text-emerald-600' },
    elite: { bg: 'bg-white', border: 'border-purple-100', text: 'text-purple-600' },
    free: { bg: 'bg-white', border: 'border-zinc-100', text: 'text-zinc-500' },
    demo: { bg: 'bg-zinc-50', border: 'border-zinc-200', text: 'text-zinc-500' },
    comunidad: { bg: 'bg-white', border: 'border-rose-100', text: 'text-rose-600' },
    campus: { bg: 'bg-white', border: 'border-violet-100', text: 'text-violet-600' },
    academy: { bg: 'bg-white', border: 'border-teal-100', text: 'text-teal-600' },
};

const getLicenseStyles = (name = '') => {
    const key = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (LICENSE_COLORS[key]) return LICENSE_COLORS[key];
    
    // Fallback logic for variations
    if (key.includes('tester') || key.includes('comunidad')) return LICENSE_COLORS.comunidad;
    if (key.includes('campus') || key.includes('academic')) return LICENSE_COLORS.campus;
    if (key.includes('academy') || key.includes('formacion') || key.includes('capacitacion')) return LICENSE_COLORS.academy;
    if (key.includes('pro')) return LICENSE_COLORS.profesional;
    if (key.includes('empresa')) return LICENSE_COLORS.empresarial;
    if (key.includes('estandar')) return LICENSE_COLORS.estandar;
    if (key.includes('basico')) return LICENSE_COLORS.basico;
    
    // Default fallback
    return LICENSE_COLORS.profesional;
};

const formatDate = (value) => {
    if (!value) return 'Sin fecha';
    const dateValue = new Date(`${value}T00:00:00`);
    if (Number.isNaN(dateValue.getTime())) return value;
    return dateValue.toLocaleDateString('es-ES');
};

const toDateInput = (value) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) return '';
    return dateValue.toISOString().slice(0, 10);
};

const addDaysToIsoDate = (value, days) => {
    if (!value) return '';
    const dateValue = new Date(value);
    if (isNaN(dateValue.getTime())) return '';
    dateValue.setDate(dateValue.getDate() + Number(days));
    return dateValue.toISOString().slice(0, 10);
};

const formatDateTime = (value) => {
    if (!value) return 'Sin fecha';
    const dateValue = new Date(value);
    if (Number.isNaN(dateValue.getTime())) return String(value);
    return dateValue.toLocaleString('es-ES');
};

const capabilityLabels = {
    apus: 'APUs',
    presupuestos: 'Presupuestos',
    cronogramas: 'Cronogramas',
    formula_polinomica: 'Fórmula Polinómica',
    desagregacion: 'Desagregación',
    licitaciones: 'Licitaciones',
    conecta: 'Conecta',
    equipo: 'Equipo',
    mod_fusion: 'Fusión',
    mod_migracion: 'Migración',
    excel_exports: 'Excel',
    pdf_exports: 'PDF',
    commercial_exports: 'Exportación comercial',
};

const rightLabels = {
    PACK_PLANIFICA: 'Pack Planifica',
    PACK_LICITA: 'Pack Licita',
    PACK_CONECTA: 'Pack Conecta',
    PACK_EQUIPO: 'Pack Equipo',
    MOD_FUSION: 'Módulo Fusión',
    MOD_MIGRACION: 'Módulo Migración',
};

const primaryCapabilityKeys = [
    'apus',
    'presupuestos',
    'cronogramas',
    'formula_polinomica',
    'desagregacion',
    'licitaciones',
    'conecta',
    'equipo',
    'mod_fusion',
    'mod_migracion',
];

const exportCapabilityKeys = ['excel_exports', 'pdf_exports', 'commercial_exports'];

const getCommercialState = (item) => item?.commercial_capabilities || {};

const getEffectiveRights = (item) => {
    const state = getCommercialState(item);
    return Array.isArray(state.effective_right_codes) ? state.effective_right_codes : [];
};

const getEnabledCapabilityKeys = (item, keys = primaryCapabilityKeys) => {
    const capabilities = getCommercialState(item).capabilities || {};
    return keys.filter((key) => Boolean(capabilities[key]));
};

const LicenseHistoryModal = ({ isOpen, empresa, history, loading, onClose }) => {
    if (!isOpen || !empresa) return null;

    return (
        <AppModalShell isOpen={isOpen} onClose={onClose} size="lg">
            <AppModalHeader
                title={`Historial · ${empresa.empresa_nombre}`}
                subtitle="Trazabilidad reciente de asignaciones, cambios de plan, activaciones y expiraciones."
                icon={History}
                iconClassName="text-[#136191]"
                iconWrapClassName="border-blue-200 bg-blue-50"
                onClose={onClose}
            />
            <AppModalBody className="space-y-4">
                {loading ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-5 py-10 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Cargando historial...</p>
                    </div>
                ) : (history?.items || []).length === 0 ? (
                    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-5 py-10 text-center">
                        <p className="text-sm font-semibold text-zinc-500">Todavía no hay eventos de licencia para esta empresa.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {(history?.items || []).map((item) => {
                            const meta = historyEventMeta[item.event_type] || {
                                label: item.event_type,
                                tone: 'border-zinc-200 bg-zinc-50 text-zinc-600',
                            };
                            const payload = item.payload || {};
                            const changeCopy = payload.from_license_name && payload.to_license_name
                                ? `${payload.from_license_name} -> ${payload.to_license_name}`
                                : null;
                            return (
                                <div key={item.id} className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-4">
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="space-y-2">
                                            <span className={`inline-flex rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${meta.tone}`}>
                                                {meta.label}
                                            </span>
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-tight text-zinc-900">
                                                    {item.license_name || 'Licencia no resuelta'}
                                                </p>
                                                {changeCopy ? (
                                                    <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-500">
                                                        {changeCopy}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                            <Clock3 className="w-4 h-4" />
                                            {formatDateTime(item.occurred_at)}
                                        </div>
                                    </div>
                                    <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
                                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-3">
                                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Actor</p>
                                            <p className="mt-1 text-sm font-black text-zinc-900">{item.actor_name || 'Sistema'}</p>
                                        </div>
                                        <div className="rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-3">
                                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Asignación</p>
                                            <p className="mt-1 text-sm font-black text-zinc-900">#{item.assignment_id || 'N/D'}</p>
                                        </div>
                                    </div>
                                    {(item.notes || payload.starts_at || payload.ends_at || payload.status) ? (
                                        <div className="mt-3 rounded-2xl border border-zinc-100 bg-zinc-50/60 px-4 py-3">
                                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Detalle</p>
                                            <div className="mt-1 space-y-1 text-sm font-semibold text-zinc-700">
                                                {item.notes ? <p>{item.notes}</p> : null}
                                                {payload.starts_at ? <p>Inicio: {formatDate(payload.starts_at)}</p> : null}
                                                {payload.ends_at ? <p>Fin: {formatDate(payload.ends_at)}</p> : null}
                                                {payload.status ? <p>Estado: {payload.status}</p> : null}
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                )}
            </AppModalBody>
            <AppModalFooter>
                <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-3 rounded-2xl bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-[0.18em] hover:bg-zinc-800 transition-colors"
                >
                    Cerrar
                </button>
            </AppModalFooter>
        </AppModalShell>
    );
};

const QuotaModal = ({ isOpen, empresa, catalog, formState, onChange, onClose, onSave, saving }) => {
    const [confirmStep, setConfirmStep] = useState(1);

    useEffect(() => {
        if (isOpen) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setConfirmStep(1);
        }
    }, [isOpen, empresa?.empresa_id]);

    if (!isOpen || !empresa) return null;

    const handleAdvance = () => {
        setConfirmStep(2);
    };

    const handleBackToEdit = () => {
        setConfirmStep(1);
    };

    return (
        <AppModalShell isOpen={isOpen} onClose={onClose} size="lg">
            <AppModalHeader
                title={confirmStep === 1 ? `Límites · ${empresa.empresa_nombre}` : `Confirmar cambios · ${empresa.empresa_nombre}`}
                subtitle={confirmStep === 1 ? 'Ajusta cuotas de administradores y usuarios para esta empresa.' : 'Revise los cambios de vigencia y cuotas antes de confirmar el guardado.'}
                icon={confirmStep === 1 ? ShieldCheck : AlertTriangle}
                iconClassName={confirmStep === 1 ? 'text-[#F39200]' : 'text-red-600'}
                iconWrapClassName={confirmStep === 1 ? 'border-orange-200 bg-orange-50' : 'border-red-200 bg-red-50'}
                onClose={onClose}
            />
            <AppModalBody className="space-y-5">
                {confirmStep === 1 ? (
                    <>
                        <div className="grid grid-cols-1 gap-4">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Seleccionar Plan</span>
                                <AnimatedSelect 
                                    value={formState.licencia_id || ''} 
                                    onChange={(e) => onChange('licencia_id', e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]"
                                >
                                    <option value="">-- Seleccionar --</option>
                                    {(catalog || []).map(lic => (
                                        <option key={lic.id} value={lic.id}>{lic.nombre} ({lic.codigo})</option>
                                    ))}
                                </AnimatedSelect>
                            </label>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Duración (Meses)</span>
                                <input type="number" min="1" value={formState.months} onChange={(e) => onChange('months', e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]" />
                            </label>
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Vigencia desde</span>
                                <AnimatedDateInput type="date" value={formState.license_start_date} onChange={(e) => onChange('license_start_date', e.target.value)} className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]" />
                            </label>
                        </div>
                    </>
                ) : (
                    <div className="space-y-4">
                        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-4 text-sm text-red-700">
                            Va a guardar cambios de cuotas y vigencia para <span className="font-black uppercase">{empresa.empresa_nombre}</span>.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Administradores</p>
                                <p className="mt-2 text-lg font-black text-zinc-900">{formState.limite_administradores}</p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Colaboradores</p>
                                <p className="mt-2 text-lg font-black text-zinc-900">{formState.limite_usuarios}</p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Vigencia desde</p>
                                <p className="mt-2 text-sm font-black text-zinc-900">{formatDate(formState.license_start_date)}</p>
                            </div>
                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-4">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Vigencia hasta</p>
                                <p className="mt-2 text-sm font-black text-zinc-900">{formatDate(formState.license_end_date)}</p>
                            </div>
                        </div>
                    </div>
                )}
            </AppModalBody>
            <AppModalFooter>
                {confirmStep === 1 ? (
                    <>
                        <button type="button" onClick={onClose} className="px-5 py-3 rounded-2xl border border-zinc-200 text-zinc-600 text-[11px] font-black uppercase tracking-[0.18em] hover:border-zinc-300 hover:text-zinc-900 transition-colors">
                            Cancelar
                        </button>
                        <button type="button" onClick={handleAdvance} className="px-5 py-3 rounded-2xl bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-[0.18em] hover:bg-zinc-800 transition-colors">
                            Revisar cambios
                        </button>
                    </>
                ) : (
                    <>
                        <button type="button" onClick={handleBackToEdit} className="px-5 py-3 rounded-2xl border border-zinc-200 text-zinc-600 text-[11px] font-black uppercase tracking-[0.18em] hover:border-zinc-300 hover:text-zinc-900 transition-colors">
                            Volver
                        </button>
                        <button type="button" onClick={onSave} disabled={saving} className="px-5 py-3 rounded-2xl bg-red-600 text-white text-[11px] font-black uppercase tracking-[0.18em] hover:bg-red-700 transition-colors disabled:opacity-60">
                            {saving ? 'Guardando...' : 'Confirmar guardado'}
                        </button>
                    </>
                )}
            </AppModalFooter>
        </AppModalShell>
    );
};

const metricChip = (used, limit, status) => (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
            <span className="text-lg font-black tracking-tight text-zinc-900">{used} / {limit}</span>
            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${statusMeta[status] || statusMeta.ok}`}>
                {statusLabels[status] || status}
            </span>
        </div>
    </div>
);

const resolveConectaErrorMessage = (error) => {
    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (detail?.message) return detail.message;
    if (detail?.code === 'conecta_slot_lock_active') return 'El cupo esta dentro del bloqueo de 30 dias. Use excepcion superadministrador solo si corresponde.';
    if (detail?.code === 'no_conecta_slots') return 'La empresa no tiene cupos Conecta disponibles.';
    return error?.message || 'No se pudo procesar la operacion Conecta.';
};

const resolveEquipoErrorMessage = (error) => {
    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (detail?.message) return detail.message;
    if (detail?.code === 'no_equipo_slots') return 'La empresa no tiene cupos Equipo disponibles.';
    if (detail?.code === 'equipo_slots_exhausted') return 'La empresa ya consumio todos sus cupos Equipo activos.';
    if (detail?.code === 'equipo_edt_scope_denied') return 'El usuario no tiene alcance EDT para operar Equipo.';
    return error?.message || 'No se pudo procesar la operacion Equipo.';
};

const formatConectaPrincipal = (slot) => (
    slot?.user?.nombre_completo
    || slot?.user?.email
    || slot?.invited_email
    || 'Invitacion pendiente'
);

const formatEquipoPrincipal = (seat) => (
    seat?.collaborator_name
    || seat?.invited_email
    || `Cupo Equipo #${seat?.id}`
);

const initialEquipoForm = {
    owner_user_id: '',
    collaborator_user_id: '',
    project_id: '',
    edt_id: '',
};

const formatEquipoUser = (user) => (
    user ? `${user.nombre_completo || user.email} (${user.rol || 'usuario'})` : ''
);

const formatEquipoProject = (project) => (
    project ? `${project.codigo ? `${project.codigo} - ` : ''}${project.nombre}` : ''
);

const formatEquipoEdt = (node) => (
    node ? `${node.codigo} - ${node.nombre || node.tipo_nodo}` : ''
);

const AdminGlobalLicencias = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [catalog, setCatalog] = useState([]);
    const [formState, setFormState] = useState({
        licencia_id: null,
        months: 12,
        limite_administradores: 0,
        limite_usuarios: 0,
        license_start_date: '',
        license_end_date: '',
    });
    const [summary, setSummary] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [selectedEmpresa, setSelectedEmpresa] = useState(null);
    const [historyEmpresa, setHistoryEmpresa] = useState(null);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyData, setHistoryData] = useState(null);
    const [housekeepingRunning, setHousekeepingRunning] = useState(false);
    const [conectaByEmpresa, setConectaByEmpresa] = useState({});
    const [conectaLoadingEmpresa, setConectaLoadingEmpresa] = useState(null);
    const [conectaAction, setConectaAction] = useState('');
    const [conectaAdminSummary, setConectaAdminSummary] = useState(null);
    const [equipoByEmpresa, setEquipoByEmpresa] = useState({});
    const [equipoContextByEmpresa, setEquipoContextByEmpresa] = useState({});
    const [equipoFormsByEmpresa, setEquipoFormsByEmpresa] = useState({});
    const [equipoLoadingEmpresa, setEquipoLoadingEmpresa] = useState(null);
    const [equipoAction, setEquipoAction] = useState('');
    const [equipoAdminSummary, setEquipoAdminSummary] = useState(null);

    const loadSummary = useCallback(async () => {
        setLoading(true);
        try {
            const [data, catalogData, conectaSummary, equipoSummary] = await Promise.all([
                adminLicensesApi.getSummary(),
                adminLicensesApi.getCatalog(),
                conectaApi.getAdminSummary(),
                equipoApi.getAdminSummary(),
            ]);
            setSummary(data);
            setCatalog(catalogData);
            setConectaAdminSummary(conectaSummary);
            setEquipoAdminSummary(equipoSummary);
        } catch (error) {
            globalThis.reportClientError?.('Error cargando licencias:', error);
            await appAlert({
                title: 'No se pudo cargar el resumen de licencias',
                message: error.response?.data?.detail || 'Revise la conectividad con el backend.',
            });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!isSuperadmin) return;
        loadSummary();
    }, [isSuperadmin, loadSummary]);

    const totals = summary?.totals || {};
    const items = useMemo(() => summary?.items || [], [summary]);
    const filteredItems = useMemo(() => {
        const normalizedSearch = normalizeSearchToken(searchTerm);
        return items.filter((item) => {
            const matchesSearch = !normalizedSearch || includesNormalized(item.empresa_nombre, normalizedSearch);
            const matchesStatus = statusFilter === 'all' || item.license_status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [items, searchTerm, statusFilter]);

    const alerts = useMemo(() => {
        return items.filter((item) =>
            ['administradores', 'usuarios'].some((key) => ['warning', 'exceeded'].includes(item.status[key]))
            || item.license_status === 'expired'
        ).length;
    }, [items]);

    const handleOpenQuotaModal = (empresa) => {
        setFormState({
            licencia_id: empresa.licencia_id || null,
            months: 12, 
            limite_administradores: empresa.limites?.administradores || 0,
            limite_usuarios: empresa.limites?.usuarios || 0,
            license_start_date: toDateInput(empresa.license_start_date) || toDateInput(new Date()),
            license_end_date: toDateInput(empresa.license_end_date),
        });
        setSelectedEmpresa(empresa);
    };

    const handleOpenHistory = async (empresa) => {
        setHistoryEmpresa(empresa);
        setHistoryLoading(true);
        setHistoryData(null);
        try {
            const data = await adminLicensesApi.getHistory(empresa.empresa_id, 25);
            setHistoryData(data);
        } catch (error) {
            globalThis.reportClientError?.('Error cargando historial de licencias:', error);
            await appAlert({
                title: 'No se pudo cargar el historial',
                message: error.response?.data?.detail || 'Ocurrió un error al consultar la trazabilidad de licencias.',
            });
            setHistoryEmpresa(null);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleFormChange = (field, value) => {
        if (field === 'license_start_date') {
            setFormState((current) => ({
                ...current,
                license_start_date: value,
                license_end_date: value ? addDaysToIsoDate(value, 360) : '',
            }));
            return;
        }
        setFormState((current) => ({ ...current, [field]: value }));
    };

    const handleSave = async () => {
        if (!selectedEmpresa) return;
        if (!formState.licencia_id) {
            await appAlert({
                title: 'Plan no seleccionado',
                message: 'Por favor seleccione un plan del catálogo.',
            });
            return;
        }

        setSaving(true);
        try {
            await adminLicensesApi.assignLicense({
                empresa_id: selectedEmpresa.empresa_id,
                licencia_id: Number(formState.licencia_id),
                months: Number(formState.months) || 12,
                start_on: formState.license_start_date || null,
                force_immediate: false,
            });
            setSelectedEmpresa(null);
            await loadSummary();
            await appAlert({
                title: 'Licencia asignada',
                message: 'La licencia se ha actualizado correctamente para la empresa.',
            });
        } catch (error) {
            globalThis.reportClientError?.('Error asignando licencia:', error);
            await appAlert({
                title: 'No se pudo asignar la licencia',
                message: error.response?.data?.detail || 'Ocurrió un error al procesar la solicitud.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleRunHousekeeping = async () => {
        setHousekeepingRunning(true);
        try {
            const result = await adminLicensesApi.runHousekeeping();
            await loadSummary();
            await appAlert({
                title: 'Housekeeping ejecutado',
                message: `Se procesaron ${result?.totals?.companies_processed || 0} empresas. Cambios: ${result?.totals?.companies_changed || 0}. Expiradas: ${result?.totals?.expired || 0}. Activadas: ${result?.totals?.activated || 0}.`,
            });
        } catch (error) {
            globalThis.reportClientError?.('Error ejecutando housekeeping de licencias:', error);
            await appAlert({
                title: 'No se pudo ejecutar el housekeeping',
                message: error.response?.data?.detail || 'Ocurrió un error al sincronizar expiraciones y activaciones de licencias.',
            });
        } finally {
            setHousekeepingRunning(false);
        }
    };

    const handleLoadConecta = async (empresaId) => {
        setConectaLoadingEmpresa(empresaId);
        try {
            const data = await conectaApi.getSlots(empresaId);
            setConectaByEmpresa((current) => ({
                ...current,
                [empresaId]: data,
            }));
        } catch (error) {
            await appAlert({
                title: 'No se pudo cargar Conecta',
                message: resolveConectaErrorMessage(error),
            });
        } finally {
            setConectaLoadingEmpresa(null);
        }
    };

    const handleLoadEquipo = async (empresaId) => {
        setEquipoLoadingEmpresa(empresaId);
        try {
            const [data, context] = await Promise.all([
                equipoApi.getOperations(empresaId),
                equipoApi.getContext(empresaId),
            ]);
            setEquipoByEmpresa((current) => ({
                ...current,
                [empresaId]: data,
            }));
            setEquipoContextByEmpresa((current) => ({
                ...current,
                [empresaId]: {
                    ...(current[empresaId] || {}),
                    ...context,
                },
            }));
            setEquipoFormsByEmpresa((current) => ({
                ...current,
                [empresaId]: current[empresaId] || initialEquipoForm,
            }));
        } catch (error) {
            await appAlert({
                title: 'No se pudo cargar Equipo',
                message: resolveEquipoErrorMessage(error),
            });
        } finally {
            setEquipoLoadingEmpresa(null);
        }
    };

    const handleEquipoFormChange = async (empresaId, field, value) => {
        setEquipoFormsByEmpresa((current) => {
            const nextForm = {
                ...(current[empresaId] || initialEquipoForm),
                [field]: value,
            };
            if (field === 'project_id') {
                nextForm.edt_id = '';
            }
            return {
                ...current,
                [empresaId]: nextForm,
            };
        });

        if (field === 'project_id' && value) {
            try {
                const context = await equipoApi.getContext(empresaId, value);
                setEquipoContextByEmpresa((current) => ({
                    ...current,
                    [empresaId]: {
                        ...(current[empresaId] || {}),
                        ...context,
                    },
                }));
            } catch (error) {
                await appAlert({
                    title: 'No se pudo cargar EDT Equipo',
                    message: resolveEquipoErrorMessage(error),
                });
            }
        }
    };

    const handleCreateEquipoSeatAndAssignment = async (empresaId) => {
        const form = equipoFormsByEmpresa[empresaId] || initialEquipoForm;
        if (!form.owner_user_id || !form.collaborator_user_id || !form.project_id || !form.edt_id) {
            await appAlert({
                title: 'Datos incompletos',
                message: 'Seleccione propietario, colaborador, proyecto y EDT para asignar Equipo.',
            });
            return;
        }

        setEquipoAction(`assign-${empresaId}`);
        try {
            const seat = await equipoApi.createSeat({
                empresa_id: empresaId,
                owner_user_id: Number(form.owner_user_id),
                collaborator_user_id: Number(form.collaborator_user_id),
            });
            await equipoApi.createAssignment({
                empresa_id: empresaId,
                seat_id: seat.id,
                proyecto_id: Number(form.project_id),
                edt_id: Number(form.edt_id),
                modulo: 'presupuestos',
            });
            setEquipoFormsByEmpresa((current) => ({
                ...current,
                [empresaId]: initialEquipoForm,
            }));
            await handleLoadEquipo(empresaId);
            await loadSummary();
            await appAlert({
                title: 'Equipo asignado',
                message: 'El cupo Equipo quedo asociado al colaborador y al alcance EDT seleccionado.',
            });
        } catch (error) {
            await appAlert({
                title: 'No se pudo asignar Equipo',
                message: resolveEquipoErrorMessage(error),
            });
        } finally {
            setEquipoAction('');
        }
    };

    const handleRevokeEquipoAssignment = async (empresaId, assignmentId) => {
        const confirmed = await appConfirm({
            title: 'Revocar asignacion Equipo',
            message: 'Esta accion retira el alcance EDT del colaborador y queda auditada en backend.',
            confirmLabel: 'Revocar',
            cancelLabel: 'Cancelar',
            tone: 'danger',
        });
        if (!confirmed) return;

        setEquipoAction(`revoke-${assignmentId}`);
        try {
            await equipoApi.revokeAssignment(assignmentId, {
                empresa_id: empresaId,
                reason: 'Revocacion desde SaaS / Superadministrador',
            });
            await handleLoadEquipo(empresaId);
            await loadSummary();
        } catch (error) {
            await appAlert({
                title: 'No se pudo revocar Equipo',
                message: resolveEquipoErrorMessage(error),
            });
        } finally {
            setEquipoAction('');
        }
    };

    const handleReleaseEquipoLock = async (empresaId, lockId) => {
        setEquipoAction(`lock-${lockId}`);
        try {
            await equipoApi.releaseLock(lockId, { empresa_id: empresaId });
            await handleLoadEquipo(empresaId);
            await loadSummary();
        } catch (error) {
            await appAlert({
                title: 'No se pudo liberar el lock',
                message: resolveEquipoErrorMessage(error),
            });
        } finally {
            setEquipoAction('');
        }
    };

    const handleReviewEquipoProposal = async (empresaId, proposalId, approve) => {
        setEquipoAction(`proposal-${proposalId}-${approve ? 'approve' : 'reject'}`);
        try {
            await equipoApi.reviewProposal(proposalId, {
                empresa_id: empresaId,
                approve,
                notes: approve ? 'Aprobado desde SaaS / Superadministrador' : 'Rechazado desde SaaS / Superadministrador',
            });
            await handleLoadEquipo(empresaId);
            await loadSummary();
        } catch (error) {
            await appAlert({
                title: 'No se pudo revisar la propuesta',
                message: resolveEquipoErrorMessage(error),
            });
        } finally {
            setEquipoAction('');
        }
    };

    const handleForceReleaseConecta = async (empresaId, slot) => {
        const confirmed = await appConfirm({
            title: 'Liberacion excepcional Conecta',
            message: 'Esta accion libera un cupo aunque exista bloqueo de 30 dias. Debe usarse solo como excepcion superadministrador y queda auditada en backend.',
            confirmLabel: 'Liberar excepcion',
            cancelLabel: 'Cancelar',
            tone: 'danger',
        });
        if (!confirmed) return;

        setConectaAction(`force-${slot.id}`);
        try {
            await conectaApi.releaseSlot(slot.id, {
                empresa_id: empresaId,
                force: true,
                reason: 'Liberacion excepcional desde SaaS / Superadministrador',
            });
            await handleLoadConecta(empresaId);
            await appAlert({
                title: 'Cupo Conecta liberado',
                message: 'La liberacion excepcional fue aplicada correctamente.',
            });
        } catch (error) {
            await appAlert({
                title: 'No se pudo liberar el cupo Conecta',
                message: resolveConectaErrorMessage(error),
            });
        } finally {
            setConectaAction('');
        }
    };

    if (!isSuperadmin) {
        return (
            <div className="h-[calc(100vh-theme(spacing.20))] bg-[#F2F4F7] p-12">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                    <div className="bg-white border border-red-100 rounded-[2rem] p-10 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">Acceso restringido</p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Licencias</h1>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col bg-[#F2F4F7] overflow-hidden">
            <header className="shrink-0 bg-white border-b border-zinc-200 px-8 py-6 shadow-sm z-10">
                <div className="max-w-[1500px] mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-[10px] tracking-widest mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver a Administración
                    </button>
                    <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-2">Gobierno de Capacidades</p>
                            <h1 className="text-3xl font-black tracking-tight text-[#1A1A1A] uppercase">Licencias y cuotas</h1>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-200">
                            {licenseFilterOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => setStatusFilter(option.value)}
                                    className={`rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all ${
                                        statusFilter === option.value
                                            ? 'bg-white text-[#F39200] shadow-sm ring-1 ring-zinc-200'
                                            : 'text-zinc-500 hover:text-zinc-800'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-hidden flex flex-col">
                {/* Dashboard de resumen fijo */}
                <div className="shrink-0 px-8 py-6 bg-zinc-50/50 border-b border-zinc-200">
                    <div className="max-w-[1500px] mx-auto">
                        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
                            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Empresas</p>
                                <p className="mt-2 text-2xl font-black text-zinc-900">{totals.empresas || 0}</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600">Activas</p>
                                <p className="mt-2 text-2xl font-black text-emerald-700">{totals.activas || 0}</p>
                            </div>
                            <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#F39200]">Planes</p>
                                <p className="mt-2 text-2xl font-black text-[#F39200]">{catalog.length}</p>
                            </div>
                            <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-4 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-violet-600">Productos SaaS</p>
                                <p className="mt-2 text-2xl font-black text-violet-700">{totals.productos_saas_activos || 0}</p>
                            </div>
                            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700">Conecta</p>
                                <p className="mt-2 text-2xl font-black text-emerald-700">
                                    {conectaAdminSummary?.totals?.used_slots || 0}
                                    <span className="text-xs text-emerald-500"> / {conectaAdminSummary?.totals?.total_slots || 0}</span>
                                </p>
                            </div>
                            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#136191]">Equipo</p>
                                <p className="mt-2 text-2xl font-black text-[#136191]">
                                    {equipoAdminSummary?.totals?.used_slots || 0}
                                    <span className="text-xs text-blue-500"> / {equipoAdminSummary?.totals?.total_slots || 0}</span>
                                </p>
                            </div>
                            <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-[#136191]">Consumo Total</p>
                                <p className="mt-2 text-2xl font-black text-[#136191]">{(totals.usuarios_usados || 0)} <span className="text-xs text-blue-400">users</span></p>
                            </div>
                            <div className="rounded-2xl border border-red-200 bg-red-50/50 p-4 shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-widest text-red-500">Alertas</p>
                                <p className="mt-2 text-2xl font-black text-red-600">{alerts}</p>
                            </div>
                        </div>

                        <div className="mt-6 flex flex-wrap items-center gap-4">
                             <ClearSearchField
                                value={searchTerm}
                                onValueChange={setSearchTerm}
                                placeholder="Filtrar por nombre de empresa..."
                                containerClassName="flex-1 max-w-md"
                                searchIconClassName="left-4"
                                inputClassName="w-full rounded-xl border border-zinc-200 bg-white py-2.5 pl-11 pr-10 text-sm font-medium text-zinc-800 outline-none transition-all focus:border-[#F39200] focus:ring-4 focus:ring-orange-50/50"
                            />
                            <button
                                type="button"
                                onClick={handleRunHousekeeping}
                                disabled={housekeepingRunning}
                                className="inline-flex items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 transition-colors hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <RefreshCw className={`h-4 w-4 ${housekeepingRunning ? 'animate-spin' : ''}`} />
                                {housekeepingRunning ? 'Sincronizando licencias...' : 'Ejecutar housekeeping'}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Listado de empresas scrollable */}
                <div className="flex-1 overflow-y-auto px-8 py-10 custom-scrollbar bg-[#F2F4F7] relative overscroll-contain">
                    <div className="max-w-[1500px] mx-auto pb-20">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-[3rem] border border-zinc-200">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#F39200]"></div>
                                <p className="mt-4 text-sm font-black text-zinc-400 uppercase tracking-widest">Sincronizando métricas...</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-12">
                                {filteredItems.length === 0 && (
                                    <div className="rounded-[2rem] border border-zinc-200 bg-white p-12 text-center">
                                        <p className="text-sm font-semibold text-zinc-500 text-center">No hay empresas que coincidan con el filtro actual.</p>
                                    </div>
                                )}
                                {filteredItems.map((item) => (
                                    <div key={item.empresa_id} className="group relative rounded-[3rem] border border-zinc-200 bg-white p-10 shadow-sm transition-all hover:shadow-[0_40px_80px_rgba(0,0,0,0.08)]">
                                        <div className="flex flex-col gap-10 lg:flex-row lg:items-start">
                                            {/* Info Empresa */}
                                            <div className="flex-1">
                                                <div className="flex flex-wrap items-center gap-5 mb-10">
                                                    <div className="h-16 w-16 flex items-center justify-center rounded-[1.5rem] bg-[#F39200]/10 text-[#F39200] shrink-0">
                                                        <Users className="w-8 h-8" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-3xl font-black tracking-tight text-zinc-900 uppercase leading-none">{item.empresa_nombre}</h3>
                                                        <div className="flex flex-wrap items-center gap-2 mt-3">
                                                            <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em]">Socio de Negocio · ID #{item.empresa_id}</p>
                                                            {item.flags?.is_tester && <span className="rounded-full bg-rose-50 border border-rose-100 px-2 py-0.5 text-[9px] font-black text-rose-500 uppercase tracking-widest">Modo Tester</span>}
                                                            {item.flags?.is_academic && <span className="rounded-full bg-violet-50 border border-violet-100 px-2 py-0.5 text-[9px] font-black text-violet-500 uppercase tracking-widest">Uso Académico</span>}
                                                            {item.flags?.is_training && <span className="rounded-full bg-teal-50 border border-teal-100 px-2 py-0.5 text-[9px] font-black text-teal-500 uppercase tracking-widest">Academy</span>}
                                                            {!item.flags?.is_commercial && <span className="rounded-full bg-zinc-100 border border-zinc-200 px-2 py-0.5 text-[9px] font-black text-zinc-500 uppercase tracking-widest">No Comercial</span>}
                                                        </div>
                                                    </div>
                                                    <div className="ml-auto flex items-center gap-3">
                                                        <span className={`inline-flex items-center gap-2.5 rounded-2xl border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest ${item.activa ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-600'}`}>
                                                            <span className={`h-2 w-2 rounded-full ${item.activa ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                            {item.activa ? 'Activa' : 'Inactiva'}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-2.5 rounded-2xl border px-5 py-2.5 text-[11px] font-black uppercase tracking-widest ${getLicenseStatusTone(item)}`}>
                                                            <CalendarRange className="w-4 h-4" />
                                                            {getLicenseStatusLabel(item)}
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50/50 p-6">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">Plan Estratégico</p>
                                                        {(() => {
                                                            const styles = getLicenseStyles(item.licencia_actual);
                                                            return (
                                                                <div className={`inline-flex items-center gap-3 rounded-2xl border px-5 py-3 text-[13px] font-black shadow-sm ${styles.bg} ${styles.border} ${styles.text}`}>
                                                                    <ShieldCheck className="w-5 h-5 shadow-inner" />
                                                                    {item.licencia_actual}
                                                                </div>
                                                            );
                                                        })()}
                                                    </div>

                                                    <div className="rounded-[2rem] border border-zinc-100 bg-zinc-50/50 p-6">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">Vigencia</p>
                                                        <div className="space-y-1">
                                                            <p className="text-[13px] font-black text-zinc-800">
                                                                Del {formatDate(item.license_start_date)}
                                                            </p>
                                                            <p className="text-[13px] font-black text-zinc-800">
                                                                al {formatDate(item.license_end_date)}
                                                            </p>
                                                            {item.next_license ? (
                                                                <p className="pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-blue-600">
                                                                    Sigue: {item.next_license.nombre} desde {formatDate(item.next_license.starts_at)}
                                                                </p>
                                                            ) : null}
                                                            {item.access_mode === 'readonly' ? (
                                                                <p className="pt-2 text-[10px] font-black uppercase tracking-[0.18em] text-amber-600">
                                                                    Operación en solo lectura
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>

                                                    <div className="lg:col-span-2 rounded-[2rem] border border-zinc-100 bg-zinc-50/50 p-6">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6">Consumo de Recursos</p>
                                                        <div className="grid grid-cols-3 gap-8">
                                                            <div>
                                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Usuarios</p>
                                                                <p className="text-[15px] font-black text-zinc-900">{item.usados.usuarios} <span className="text-zinc-300 font-bold mx-1">/</span> <span className="text-zinc-400 font-bold">{item.limites.usuarios}</span></p>
                                                                <div className="mt-3 h-2 w-full bg-zinc-200/60 rounded-full overflow-hidden shadow-inner">
                                                                    <div 
                                                                        className={`h-full rounded-full transition-all duration-500 ${item.usados.usuarios >= item.limites.usuarios ? 'bg-red-500' : 'bg-[#F39200]'}`}
                                                                        style={{ width: `${Math.min(100, (item.usados.usuarios / item.limites.usuarios) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Proyectos</p>
                                                                <p className="text-[15px] font-black text-zinc-900">{item.usados.proyectos} <span className="text-zinc-300 font-bold mx-1">/</span> <span className="text-zinc-400 font-bold">{item.limites.proyectos}</span></p>
                                                                <div className="mt-3 h-2 w-full bg-zinc-200/60 rounded-full overflow-hidden shadow-inner">
                                                                    <div 
                                                                        className={`h-full rounded-full transition-all duration-500 ${item.usados.proyectos >= item.limites.proyectos ? 'bg-red-500' : 'bg-[#F39200]'}`}
                                                                        style={{ width: `${Math.min(100, (item.usados.proyectos / item.limites.proyectos) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-3">Espacio (GB)</p>
                                                                <p className="text-[15px] font-black text-zinc-900">{item.usados.almacenamiento_gb.toFixed(1)} <span className="text-zinc-300 font-bold mx-1">/</span> <span className="text-zinc-400 font-bold">{item.limites.almacenamiento_gb.toFixed(1)}</span></p>
                                                                <div className="mt-3 h-2 w-full bg-zinc-200/60 rounded-full overflow-hidden shadow-inner">
                                                                    <div 
                                                                        className={`h-full rounded-full transition-all duration-500 ${item.usados.almacenamiento_gb >= item.limites.almacenamiento_gb ? 'bg-red-500' : 'bg-[#F39200]'}`}
                                                                        style={{ width: `${Math.min(100, (item.usados.almacenamiento_gb / item.limites.almacenamiento_gb) * 100)}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-6 rounded-[2rem] border border-violet-100 bg-violet-50/40 p-6">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-violet-200 bg-white text-violet-600">
                                                                <PackageCheck className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-500">Productos SaaS adicionales</p>
                                                                <p className="text-xs font-bold text-zinc-500">Packs y módulos adquiridos aparte de la licencia de funcionamiento.</p>
                                                            </div>
                                                        </div>
                                                        <span className="rounded-full border border-violet-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-violet-600">
                                                            {item.saas_products_count || 0} activos
                                                        </span>
                                                    </div>
                                                    {(item.saas_products || []).length > 0 ? (
                                                        <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                            {(item.saas_products || []).map((product) => (
                                                                <div key={`${product.commercial_code}-${product.order_item_id}`} className="rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-sm">
                                                                    <div className="flex items-start justify-between gap-3">
                                                                        <div>
                                                                            <p className="text-sm font-black uppercase tracking-tight text-zinc-900">{product.title}</p>
                                                                            <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-violet-500">{product.commercial_code}</p>
                                                                        </div>
                                                                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700">
                                                                            {product.status || 'active'}
                                                                        </span>
                                                                    </div>
                                                                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                                                                        {product.billing_period ? <span>{product.billing_period}</span> : null}
                                                                        {product.duration_months ? <span>{product.duration_months} mes(es)</span> : null}
                                                                        {product.ends_at ? <span>Hasta {formatDate(product.ends_at)}</span> : <span>Pago único</span>}
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="mt-5 rounded-2xl border border-dashed border-violet-200 bg-white/60 px-4 py-4">
                                                            <p className="text-xs font-bold text-violet-500">Sin packs ni módulos SaaS adicionales registrados para esta empresa.</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-6 rounded-[2rem] border border-emerald-100 bg-emerald-50/35 p-6">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-emerald-200 bg-white text-emerald-700">
                                                                <Users className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Cupos Conecta</p>
                                                                <p className="text-xs font-bold text-zinc-500">Producto SaaS separado de la licencia base y editable solo por superadministrador.</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLoadConecta(item.empresa_id)}
                                                            disabled={conectaLoadingEmpresa === item.empresa_id}
                                                            className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-emerald-700 transition-colors hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <RefreshCw className={`h-4 w-4 ${conectaLoadingEmpresa === item.empresa_id ? 'animate-spin' : ''}`} />
                                                            Ver cupos
                                                        </button>
                                                    </div>

                                                    {conectaByEmpresa[item.empresa_id] ? (
                                                        <>
                                                            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
                                                                <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Contratados</p>
                                                                    <p className="mt-2 text-xl font-black text-zinc-900">{conectaByEmpresa[item.empresa_id]?.limits?.total_slots ?? 0}</p>
                                                                </div>
                                                                <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">En uso</p>
                                                                    <p className="mt-2 text-xl font-black text-zinc-900">{conectaByEmpresa[item.empresa_id]?.limits?.used_slots ?? 0}</p>
                                                                </div>
                                                                <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Disponibles</p>
                                                                    <p className="mt-2 text-xl font-black text-emerald-700">{conectaByEmpresa[item.empresa_id]?.limits?.available_slots ?? 0}</p>
                                                                </div>
                                                            </div>
                                                            <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                                                                {(conectaByEmpresa[item.empresa_id]?.items || []).length > 0 ? (conectaByEmpresa[item.empresa_id]?.items || []).map((slot) => (
                                                                    <div key={slot.id} className="rounded-2xl border border-white bg-white/85 px-4 py-3 shadow-sm">
                                                                        <div className="flex items-start justify-between gap-3">
                                                                            <div>
                                                                                <p className="text-sm font-black text-zinc-900">{formatConectaPrincipal(slot)}</p>
                                                                                <p className="mt-1 text-[9px] font-black uppercase tracking-[0.18em] text-emerald-700">{slot.status || 'active'}</p>
                                                                            </div>
                                                                            <button
                                                                                type="button"
                                                                                onClick={() => handleForceReleaseConecta(item.empresa_id, slot)}
                                                                                disabled={conectaAction === `force-${slot.id}`}
                                                                                className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                            >
                                                                                {conectaAction === `force-${slot.id}` ? 'Liberando' : 'Forzar liberar'}
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                )) : (
                                                                    <div className="rounded-2xl border border-dashed border-emerald-200 bg-white/60 px-4 py-4 md:col-span-2 xl:col-span-3">
                                                                        <p className="text-xs font-bold text-emerald-700">Sin cupos Conecta asignados actualmente.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </>
                                                    ) : (
                                                        <div className="mt-5 rounded-2xl border border-dashed border-emerald-200 bg-white/60 px-4 py-4">
                                                            <p className="text-xs font-bold text-emerald-700">Use Ver cupos para consultar asignaciones y disponibilidad por empresa.</p>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="mt-6 rounded-[2rem] border border-blue-100 bg-blue-50/35 p-6">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200 bg-white text-[#136191]">
                                                                <Users className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#136191]">Equipo por EDT</p>
                                                                <p className="text-xs font-bold text-zinc-500">Producto SaaS colaborativo con cupos, asignaciones EDT, locks y propuestas auditadas.</p>
                                                            </div>
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleLoadEquipo(item.empresa_id)}
                                                            disabled={equipoLoadingEmpresa === item.empresa_id}
                                                            className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-4 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191] transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                        >
                                                            <RefreshCw className={`h-4 w-4 ${equipoLoadingEmpresa === item.empresa_id ? 'animate-spin' : ''}`} />
                                                            Ver Equipo
                                                        </button>
                                                    </div>

                                                    {(() => {
                                                        const companyEquipoSummary = (equipoAdminSummary?.companies || []).find((row) => row.empresa_id === item.empresa_id) || {};
                                                        const equipoState = equipoByEmpresa[item.empresa_id];
                                                        const equipoContext = equipoContextByEmpresa[item.empresa_id] || {};
                                                        const equipoForm = equipoFormsByEmpresa[item.empresa_id] || initialEquipoForm;
                                                        const activeAssignments = (equipoState?.assignments || []).filter((assignment) => assignment.status === 'active');
                                                        const activeLocks = (equipoState?.locks || []).filter((lock) => lock.status === 'active');
                                                        const pendingProposals = (equipoState?.proposals || []).filter((proposal) => proposal.status === 'pending');
                                                        const userById = new Map((equipoContext.users || []).map((contextUser) => [Number(contextUser.id), contextUser]));
                                                        const projectById = new Map((equipoContext.projects || []).map((project) => [Number(project.id), project]));
                                                        const edtById = new Map((equipoContext.edt_nodes || []).map((node) => [Number(node.id), node]));
                                                        return (
                                                            <>
                                                                <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
                                                                    <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Contratados</p>
                                                                        <p className="mt-2 text-xl font-black text-zinc-900">{equipoState?.limits?.total_slots ?? companyEquipoSummary.total_slots ?? 0}</p>
                                                                    </div>
                                                                    <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">En uso</p>
                                                                        <p className="mt-2 text-xl font-black text-zinc-900">{equipoState?.limits?.used_slots ?? companyEquipoSummary.used_slots ?? 0}</p>
                                                                    </div>
                                                                    <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Asignaciones</p>
                                                                        <p className="mt-2 text-xl font-black text-[#136191]">{companyEquipoSummary.active_assignments ?? 0}</p>
                                                                    </div>
                                                                    <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Locks</p>
                                                                        <p className="mt-2 text-xl font-black text-[#136191]">{companyEquipoSummary.active_locks ?? 0}</p>
                                                                    </div>
                                                                    <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Propuestas</p>
                                                                        <p className="mt-2 text-xl font-black text-[#F39200]">{companyEquipoSummary.pending_proposals ?? 0}</p>
                                                                    </div>
                                                                </div>
                                                                {equipoState ? (
                                                                    <div className="mt-5 space-y-5">
                                                                        <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                                                                                <label className="space-y-2">
                                                                                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Propietario</span>
                                                                                    <AnimatedSelect
                                                                                        value={equipoForm.owner_user_id}
                                                                                        onChange={(event) => handleEquipoFormChange(item.empresa_id, 'owner_user_id', event.target.value)}
                                                                                        className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-zinc-800 outline-none focus:border-[#136191]"
                                                                                    >
                                                                                        <option value="">Seleccionar</option>
                                                                                        {(equipoContext.users || []).map((contextUser) => (
                                                                                            <option key={contextUser.id} value={contextUser.id}>{formatEquipoUser(contextUser)}</option>
                                                                                        ))}
                                                                                    </AnimatedSelect>
                                                                                </label>
                                                                                <label className="space-y-2">
                                                                                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Colaborador</span>
                                                                                    <AnimatedSelect
                                                                                        value={equipoForm.collaborator_user_id}
                                                                                        onChange={(event) => handleEquipoFormChange(item.empresa_id, 'collaborator_user_id', event.target.value)}
                                                                                        className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-zinc-800 outline-none focus:border-[#136191]"
                                                                                    >
                                                                                        <option value="">Seleccionar</option>
                                                                                        {(equipoContext.users || []).map((contextUser) => (
                                                                                            <option key={contextUser.id} value={contextUser.id}>{formatEquipoUser(contextUser)}</option>
                                                                                        ))}
                                                                                    </AnimatedSelect>
                                                                                </label>
                                                                                <label className="space-y-2">
                                                                                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Proyecto</span>
                                                                                    <AnimatedSelect
                                                                                        value={equipoForm.project_id}
                                                                                        onChange={(event) => handleEquipoFormChange(item.empresa_id, 'project_id', event.target.value)}
                                                                                        className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-zinc-800 outline-none focus:border-[#136191]"
                                                                                    >
                                                                                        <option value="">Seleccionar</option>
                                                                                        {(equipoContext.projects || []).map((project) => (
                                                                                            <option key={project.id} value={project.id}>{formatEquipoProject(project)}</option>
                                                                                        ))}
                                                                                    </AnimatedSelect>
                                                                                </label>
                                                                                <label className="space-y-2">
                                                                                    <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">EDT</span>
                                                                                    <AnimatedSelect
                                                                                        value={equipoForm.edt_id}
                                                                                        onChange={(event) => handleEquipoFormChange(item.empresa_id, 'edt_id', event.target.value)}
                                                                                        disabled={!equipoForm.project_id}
                                                                                        className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs font-bold text-zinc-800 outline-none focus:border-[#136191] disabled:cursor-not-allowed disabled:opacity-60"
                                                                                    >
                                                                                        <option value="">Seleccionar</option>
                                                                                        {(equipoContext.edt_nodes || []).map((node) => (
                                                                                            <option key={node.id} value={node.id}>{formatEquipoEdt(node)}</option>
                                                                                        ))}
                                                                                    </AnimatedSelect>
                                                                                </label>
                                                                            </div>
                                                                            <div className="mt-4 flex justify-end">
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() => handleCreateEquipoSeatAndAssignment(item.empresa_id)}
                                                                                    disabled={equipoAction === `assign-${item.empresa_id}`}
                                                                                    className="inline-flex min-h-[36px] items-center justify-center gap-2 rounded-xl bg-[#136191] px-4 text-[10px] font-black uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#0f4d73] disabled:cursor-not-allowed disabled:opacity-60"
                                                                                >
                                                                                    <Users className="h-4 w-4" />
                                                                                    {equipoAction === `assign-${item.empresa_id}` ? 'Asignando' : 'Asignar Equipo'}
                                                                                </button>
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                                                            <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Cupos Equipo</p>
                                                                                <div className="mt-3 space-y-2">
                                                                                    {(equipoState.seats || []).length > 0 ? (equipoState.seats || []).map((seat) => (
                                                                                        <div key={seat.id} className="rounded-xl border border-blue-50 bg-blue-50/45 px-3 py-3">
                                                                                            <div className="flex items-start justify-between gap-3">
                                                                                                <div>
                                                                                                    <p className="text-xs font-black text-zinc-900">{formatEquipoPrincipal(seat)}</p>
                                                                                                    <p className="mt-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#136191]">{seat.source_right_code || 'PACK_EQUIPO'}</p>
                                                                                                </div>
                                                                                                <span className="rounded-full border border-blue-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-[#136191]">
                                                                                                    {seat.status || 'active'}
                                                                                                </span>
                                                                                            </div>
                                                                                        </div>
                                                                                    )) : (
                                                                                        <p className="text-xs font-bold text-[#136191]">Sin cupos Equipo asignados actualmente.</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Asignaciones EDT activas</p>
                                                                                <div className="mt-3 space-y-2">
                                                                                    {activeAssignments.length > 0 ? activeAssignments.map((assignment) => (
                                                                                        <div key={assignment.id} className="rounded-xl border border-blue-50 bg-blue-50/45 px-3 py-3">
                                                                                            <div className="flex items-start justify-between gap-3">
                                                                                                <div>
                                                                                                    <p className="text-xs font-black text-zinc-900">{formatEquipoUser(userById.get(Number(assignment.usuario_id))) || `Usuario #${assignment.usuario_id}`}</p>
                                                                                                    <p className="mt-1 text-[10px] font-bold text-zinc-500">{formatEquipoProject(projectById.get(Number(assignment.proyecto_id))) || `Proyecto #${assignment.proyecto_id}`}</p>
                                                                                                    <p className="mt-1 text-[10px] font-bold text-[#136191]">{formatEquipoEdt(edtById.get(Number(assignment.edt_id))) || `EDT #${assignment.edt_id}`}</p>
                                                                                                </div>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleRevokeEquipoAssignment(item.empresa_id, assignment.id)}
                                                                                                    disabled={equipoAction === `revoke-${assignment.id}`}
                                                                                                    className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                                                >
                                                                                                    {equipoAction === `revoke-${assignment.id}` ? 'Revocando' : 'Revocar'}
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    )) : (
                                                                                        <p className="text-xs font-bold text-[#136191]">Sin asignaciones EDT activas.</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                                                                            <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Locks activos</p>
                                                                                <div className="mt-3 space-y-2">
                                                                                    {activeLocks.length > 0 ? activeLocks.map((lock) => (
                                                                                        <div key={lock.id} className="rounded-xl border border-blue-50 bg-blue-50/45 px-3 py-3">
                                                                                            <div className="flex items-start justify-between gap-3">
                                                                                                <div>
                                                                                                    <p className="text-xs font-black text-zinc-900">{formatEquipoUser(userById.get(Number(lock.locked_by_user_id))) || `Usuario #${lock.locked_by_user_id}`}</p>
                                                                                                    <p className="mt-1 text-[10px] font-bold text-[#136191]">{formatEquipoEdt(edtById.get(Number(lock.edt_id))) || `EDT #${lock.edt_id}`}</p>
                                                                                                    <p className="mt-1 text-[10px] font-bold text-zinc-500">Linea #{lock.presupuesto_linea_id || 'general'}</p>
                                                                                                </div>
                                                                                                <button
                                                                                                    type="button"
                                                                                                    onClick={() => handleReleaseEquipoLock(item.empresa_id, lock.id)}
                                                                                                    disabled={equipoAction === `lock-${lock.id}`}
                                                                                                    className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-[#136191] transition-colors hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                                                                                                >
                                                                                                    {equipoAction === `lock-${lock.id}` ? 'Liberando' : 'Liberar'}
                                                                                                </button>
                                                                                            </div>
                                                                                        </div>
                                                                                    )) : (
                                                                                        <p className="text-xs font-bold text-[#136191]">Sin locks activos.</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Propuestas pendientes</p>
                                                                                <div className="mt-3 space-y-2">
                                                                                    {pendingProposals.length > 0 ? pendingProposals.map((proposal) => (
                                                                                        <div key={proposal.id} className="rounded-xl border border-orange-100 bg-orange-50/55 px-3 py-3">
                                                                                            <div className="flex items-start justify-between gap-3">
                                                                                                <div>
                                                                                                    <p className="text-xs font-black text-zinc-900">{proposal.title}</p>
                                                                                                    <p className="mt-1 text-[10px] font-bold text-zinc-500">{formatEquipoUser(userById.get(Number(proposal.submitted_by_user_id))) || `Usuario #${proposal.submitted_by_user_id}`}</p>
                                                                                                    <p className="mt-1 text-[10px] font-bold text-[#136191]">{formatEquipoEdt(edtById.get(Number(proposal.edt_id))) || `EDT #${proposal.edt_id}`}</p>
                                                                                                </div>
                                                                                                <div className="flex flex-col gap-2">
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => handleReviewEquipoProposal(item.empresa_id, proposal.id, true)}
                                                                                                        disabled={equipoAction.startsWith(`proposal-${proposal.id}`)}
                                                                                                        className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700 transition-colors hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                                                    >
                                                                                                        Aprobar
                                                                                                    </button>
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={() => handleReviewEquipoProposal(item.empresa_id, proposal.id, false)}
                                                                                                        disabled={equipoAction.startsWith(`proposal-${proposal.id}`)}
                                                                                                        className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-[9px] font-black uppercase tracking-[0.14em] text-red-600 transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                                                                    >
                                                                                                        Rechazar
                                                                                                    </button>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    )) : (
                                                                                        <p className="text-xs font-bold text-[#136191]">Sin propuestas pendientes.</p>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="mt-5 rounded-2xl border border-dashed border-blue-200 bg-white/60 px-4 py-4">
                                                                        <p className="text-xs font-bold text-[#136191]">Use Ver Equipo para consultar y administrar cupos, EDT, locks y propuestas por empresa.</p>
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                                <div className="mt-6 rounded-[2rem] border border-blue-100 bg-blue-50/35 p-6">
                                                    <div className="flex flex-wrap items-center justify-between gap-3">
                                                        <div className="flex items-center gap-3">
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-blue-200 bg-white text-[#136191]">
                                                                <ShieldCheck className="h-5 w-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#136191]">Capacidades comerciales efectivas</p>
                                                                <p className="text-xs font-bold text-zinc-500">Lectura resuelta por backend desde licencia base, packs y módulos SaaS.</p>
                                                            </div>
                                                        </div>
                                                        <span className="rounded-full border border-blue-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#136191]">
                                                            {getEffectiveRights(item).length} derechos
                                                        </span>
                                                    </div>
                                                    <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-3">
                                                        <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Derechos efectivos</p>
                                                            {getEffectiveRights(item).length > 0 ? (
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    {getEffectiveRights(item).map((rightCode) => (
                                                                        <span key={rightCode} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-[#136191]">
                                                                            {rightLabels[rightCode] || rightCode}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="mt-3 text-xs font-bold text-zinc-500">Sin derechos SaaS adicionales efectivos.</p>
                                                            )}
                                                        </div>
                                                        <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Capacidades habilitadas</p>
                                                            {getEnabledCapabilityKeys(item).length > 0 ? (
                                                                <div className="mt-3 flex flex-wrap gap-2">
                                                                    {getEnabledCapabilityKeys(item).map((capabilityKey) => (
                                                                        <span key={capabilityKey} className="rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-emerald-700">
                                                                            {capabilityLabels[capabilityKey] || capabilityKey}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="mt-3 text-xs font-bold text-zinc-500">Sin capacidades comerciales habilitadas.</p>
                                                            )}
                                                        </div>
                                                        <div className="rounded-2xl border border-white bg-white/85 px-4 py-4 shadow-sm">
                                                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Exportes y restricciones</p>
                                                            <div className="mt-3 flex flex-wrap gap-2">
                                                                {exportCapabilityKeys.map((capabilityKey) => {
                                                                    const enabled = Boolean(getCommercialState(item).capabilities?.[capabilityKey]);
                                                                    return (
                                                                        <span key={capabilityKey} className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${enabled ? 'border-emerald-100 bg-emerald-50 text-emerald-700' : 'border-zinc-200 bg-zinc-50 text-zinc-400'}`}>
                                                                            {capabilityLabels[capabilityKey]}
                                                                        </span>
                                                                    );
                                                                })}
                                                                {getCommercialState(item).restrictions?.requires_watermark ? (
                                                                    <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-amber-700">
                                                                        Marca de agua
                                                                    </span>
                                                                ) : null}
                                                                {getCommercialState(item).restrictions?.non_commercial ? (
                                                                    <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">
                                                                        No comercial
                                                                    </span>
                                                                ) : null}
                                                                {getCommercialState(item).restrictions?.readonly ? (
                                                                    <span className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-[9px] font-black uppercase tracking-[0.14em] text-red-600">
                                                                        Solo lectura
                                                                    </span>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Acciones */}
                                            <div className="flex flex-row lg:flex-col gap-4 min-w-[240px] lg:pt-2">
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenQuotaModal(item)}
                                                    className="flex-1 inline-flex items-center justify-center gap-3 rounded-[1.5rem] bg-[#1A1A1A] py-5 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all hover:bg-black hover:translate-y-[-2px] active:translate-y-[0px] shadow-black/10"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                    Gestionar Licencia
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenHistory(item)}
                                                    className="inline-flex items-center justify-center gap-3 rounded-[1.5rem] border-2 border-blue-100 bg-blue-50/50 py-5 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#136191] transition-all hover:border-[#136191]/40 hover:bg-blue-50"
                                                >
                                                    <History className="w-4 h-4" />
                                                    Ver historial
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        try {
                                                            await adminLicensesApi.recalculateUsage(item.empresa_id);
                                                            loadSummary();
                                                            appAlert({ title: 'Éxito', message: 'Métricas recalculadas correctamente.' });
                                                        } catch (e) {
                                                            appAlert({ title: 'Error', message: 'No se pudo recalcular el uso.' });
                                                        }
                                                    }}
                                                    className="inline-flex items-center justify-center gap-3 rounded-[1.5rem] border-2 border-zinc-100 bg-white py-5 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 transition-all hover:border-[#F39200] hover:text-[#F39200] hover:bg-orange-50/30"
                                                >
                                                    Recalcular Uso
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <QuotaModal
                isOpen={Boolean(selectedEmpresa)}
                empresa={selectedEmpresa}
                catalog={catalog}
                formState={formState}
                onChange={handleFormChange}
                onClose={() => setSelectedEmpresa(null)}
                onSave={handleSave}
                saving={saving}
            />
            <LicenseHistoryModal
                isOpen={Boolean(historyEmpresa)}
                empresa={historyEmpresa}
                history={historyData}
                loading={historyLoading}
                onClose={() => {
                    setHistoryEmpresa(null);
                    setHistoryData(null);
                }}
            />
        </div>
    );
};

export default AdminGlobalLicencias;
