import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    AlertTriangle,
    ArrowLeft,
    CalendarClock,
    ShieldAlert,
    Wrench,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import adminMaintenanceApi from '../api/adminMaintenance';
import { appAlert } from '../utils/appDialog';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import AnimatedDateInput from '../components/ui/AnimatedDateInput';

const toDateTimeLocal = (value) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
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
    return new Intl.DateTimeFormat('es-EC', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const EMPTY_FORM = {
    titulo: 'Mantenimiento del sistema',
    mensaje: 'Se están aplicando tareas de mantenimiento. Guarde su trabajo y vuelva a intentarlo en unos minutos.',
    mode: 'readonly',
    is_enabled: false,
    starts_at: '',
    ends_at: '',
};

const toneMeta = {
    readonly: {
        label: 'Solo lectura',
        className: 'border-orange-200 bg-orange-50 text-[#F39200]',
    },
    restricted: {
        label: 'Acceso restringido',
        className: 'border-red-200 bg-red-50 text-red-600',
    },
};

const AdminGlobalMantenimiento = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [formState, setFormState] = useState(EMPTY_FORM);
    const [status, setStatus] = useState(null);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const data = await adminMaintenanceApi.getConfig();
            setStatus(data);
            setFormState({
                titulo: data.titulo || EMPTY_FORM.titulo,
                mensaje: data.mensaje || EMPTY_FORM.mensaje,
                mode: data.mode || 'readonly',
                is_enabled: Boolean(data.is_enabled),
                starts_at: toDateTimeLocal(data.starts_at),
                ends_at: toDateTimeLocal(data.ends_at),
            });
        } catch (error) {
            console.error('Error cargando mantenimiento:', error);
            await appAlert({
                title: 'No se pudo cargar la configuración',
                message: error.response?.data?.detail || 'Revise la conectividad con el backend.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isSuperadmin) return;
        loadConfig();
    }, [isSuperadmin]);

    const handleChange = (field, value) => {
        setFormState((current) => ({ ...current, [field]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                titulo: formState.titulo.trim(),
                mensaje: formState.mensaje.trim(),
                mode: formState.mode,
                is_enabled: Boolean(formState.is_enabled),
                starts_at: toPayloadDateTime(formState.starts_at),
                ends_at: toPayloadDateTime(formState.ends_at),
            };
            const data = await adminMaintenanceApi.updateConfig(payload);
            setStatus(data);
            await loadConfig();
        } catch (error) {
            console.error('Error guardando mantenimiento:', error);
            await appAlert({
                title: 'No se pudo guardar el modo mantenimiento',
                message: error.response?.data?.detail || 'Revise las fechas y vuelva a intentarlo.',
                tone: 'danger',
            });
        } finally {
            setSaving(false);
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
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Mantenimiento</h1>
                    </div>
                </div>
            </div>
        );
    }

    const currentTone = toneMeta[formState.mode] || toneMeta.readonly;

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col bg-[#F2F4F7]">
            <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="w-full max-w-[1500px] mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver a Administración Global
                    </button>

                    <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">Operación de plataforma</p>
                            <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-5xl uppercase">Modo mantenimiento</h1>
                            <p className="mt-4 max-w-4xl text-sm text-zinc-600 leading-relaxed">
                                Controla periodos de mantenimiento con efecto real sobre la plataforma. Usa `Comunicados` para avisos previos y este submódulo para aplicar restricción efectiva.
                            </p>
                        </div>
                    </header>

                    {loading ? (
                        <div className="rounded-[2rem] border border-zinc-200 bg-white p-10 text-sm font-semibold text-zinc-500">
                            Cargando configuración de mantenimiento...
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
                            <section className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden">
                                <div className="border-b border-zinc-200 px-6 py-5">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Configuración activa</p>
                                    <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-zinc-900">Control del modo</h2>
                                </div>

                                <div className="p-6 space-y-5">
                                    <label className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={formState.is_enabled}
                                            onChange={(event) => handleChange('is_enabled', event.target.checked)}
                                            className="w-4 h-4 accent-[#F39200]"
                                        />
                                        <span className="text-sm font-black uppercase tracking-[0.14em] text-zinc-700">Modo mantenimiento habilitado</span>
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Título</span>
                                            <input
                                                type="text"
                                                value={formState.titulo}
                                                onChange={(event) => handleChange('titulo', event.target.value)}
                                                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Modo</span>
                                            <AnimatedSelect
                                                value={formState.mode}
                                                onChange={(event) => handleChange('mode', event.target.value)}
                                                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]"
                                            >
                                                <option value="readonly">Solo lectura</option>
                                                <option value="restricted">Acceso restringido</option>
                                            </AnimatedSelect>
                                        </label>
                                    </div>

                                    <label className="space-y-2 block">
                                        <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Mensaje operativo</span>
                                        <textarea
                                            value={formState.mensaje}
                                            onChange={(event) => handleChange('mensaje', event.target.value)}
                                            rows={4}
                                            className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-800 outline-none transition-colors focus:border-[#F39200] resize-none"
                                        />
                                    </label>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <label className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Inicio</span>
                                            <AnimatedDateInput
                                                type="datetime-local"
                                                value={formState.starts_at}
                                                onChange={(event) => handleChange('starts_at', event.target.value)}
                                                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]"
                                            />
                                        </label>
                                        <label className="space-y-2">
                                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Fin</span>
                                            <AnimatedDateInput
                                                type="datetime-local"
                                                value={formState.ends_at}
                                                onChange={(event) => handleChange('ends_at', event.target.value)}
                                                className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]"
                                            />
                                        </label>
                                    </div>

                                    <div className="flex justify-end pt-2">
                                        <button
                                            type="button"
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="inline-flex items-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-zinc-800 transition-colors disabled:opacity-60"
                                        >
                                            <Wrench className="w-4 h-4" />
                                            {saving ? 'Guardando...' : 'Guardar mantenimiento'}
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-6">
                                <div className={`rounded-[2rem] border px-6 py-6 ${currentTone.className}`}>
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-2xl border border-current/20 bg-white/60 flex items-center justify-center">
                                            <ShieldAlert className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2">Estado vigente</p>
                                            <h3 className="text-2xl font-black uppercase tracking-tight">{status?.is_active_now ? 'Mantenimiento activo' : 'Mantenimiento inactivo'}</h3>
                                            <p className="mt-2 text-sm font-medium leading-relaxed opacity-90">{status?.mensaje || 'Sin mensaje operativo.'}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] p-6 space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl border border-orange-200 bg-orange-50 flex items-center justify-center">
                                            <CalendarClock className="w-5 h-5 text-[#F39200]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Ventana programada</p>
                                            <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">Calendario operativo</h3>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-zinc-600">
                                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                            <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Inicio</p>
                                            <p className="font-semibold text-zinc-700">{formatDateTime(status?.starts_at)}</p>
                                        </div>
                                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                            <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Fin</p>
                                            <p className="font-semibold text-zinc-700">{formatDateTime(status?.ends_at)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="rounded-[2rem] border border-red-100 bg-red-50/70 px-5 py-4 text-sm text-zinc-700 leading-relaxed">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                                        <p>
                                            `Solo lectura` bloquea operaciones mutantes para usuarios no superadministradores.
                                            `Acceso restringido` bloquea el uso operativo general y deja únicamente las rutas de recuperación y administración necesarias.
                                        </p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminGlobalMantenimiento;
