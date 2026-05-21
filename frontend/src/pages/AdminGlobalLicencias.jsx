import { useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    CalendarRange,
    Clock3,
    Edit2,
    History,
    RefreshCw,
    Search,
    ShieldCheck,
    Users,
} from 'lucide-react';
import adminLicensesApi from '../api/adminLicenses';
import { AuthContext } from '../context/AuthContext';
import { appAlert } from '../utils/appDialog';
import { AppModalBody, AppModalFooter, AppModalHeader, AppModalShell } from '../components/ui/app-modal';
import ClearSearchField from '../components/ui/ClearSearchField';
import api from '../api/api-client';
import { withoutTenant } from '../api/tenant';
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

    const loadSummary = useCallback(async () => {
        setLoading(true);
        try {
            const [data, catalogData] = await Promise.all([
                adminLicensesApi.getSummary(),
                api.get('/admin-licenses/catalog', withoutTenant()).then(r => r.data)
            ]);
            setSummary(data);
            setCatalog(catalogData);
        } catch (error) {
            console.error('Error cargando licencias:', error);
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
            console.error('Error cargando historial de licencias:', error);
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
            console.error('Error asignando licencia:', error);
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
            console.error('Error ejecutando housekeeping de licencias:', error);
            await appAlert({
                title: 'No se pudo ejecutar el housekeeping',
                message: error.response?.data?.detail || 'Ocurrió un error al sincronizar expiraciones y activaciones de licencias.',
            });
        } finally {
            setHousekeepingRunning(false);
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
                        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
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
