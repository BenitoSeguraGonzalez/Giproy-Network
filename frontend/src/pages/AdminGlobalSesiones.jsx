import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Laptop2,
    LogOut,
    Search,
    ShieldCheck,
    TimerReset,
    UsersRound,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import adminSessionsApi from '../api/adminSessions';
import { appAlert, appConfirm } from '../utils/appDialog';
import { Card, CardContent } from '../components/ui/card';
import ClearSearchField from '../components/ui/ClearSearchField';
import { includesNormalized, normalizeSearchToken } from '../utils/normalizeSearch';
import AnimatedSelect from '../components/ui/AnimatedSelect';

const formatDateTime = (value) => {
    if (!value) return 'Sin registro';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin registro';
    return new Intl.DateTimeFormat('es-EC', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const AdminGlobalSesiones = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [loading, setLoading] = useState(true);
    const [revokingId, setRevokingId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [empresaFilter, setEmpresaFilter] = useState('all');
    const [usuarioFilter, setUsuarioFilter] = useState('all');

    const loadSessions = async () => {
        setLoading(true);
        try {
            const data = await adminSessionsApi.getAll();
            setSessions(data || []);
        } catch (error) {
            console.error('Error cargando sesiones:', error);
            await appAlert({
                title: 'No se pudieron cargar las sesiones',
                message: error.response?.data?.detail || 'Revise la conectividad con el backend.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!isSuperadmin) return;
        loadSessions();
    }, [isSuperadmin]);

    const metrics = useMemo(() => {
        const empresas = new Set(sessions.map((item) => item.empresa_id).filter(Boolean));
        const superadmins = sessions.filter((item) => item.rol === 'Superadministrador').length;
        const withDevice = sessions.filter((item) => item.device_id).length;
        return {
            total: sessions.length,
            empresas: empresas.size,
            superadmins,
            withDevice,
        };
    }, [sessions]);

    const empresaOptions = useMemo(() => {
        const map = new Map();
        sessions.forEach((item) => {
            const key = String(item.empresa_id || 'sin-empresa');
            if (!map.has(key)) {
                map.set(key, {
                    value: key,
                    label: item.empresa_nombre || 'Sin empresa',
                });
            }
        });
        return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label, 'es'));
    }, [sessions]);

    const usuarioOptions = useMemo(() => {
        return sessions
            .map((item) => ({
                value: String(item.user_id),
                label: item.nombre_completo || item.email,
            }))
            .sort((a, b) => a.label.localeCompare(b.label, 'es'));
    }, [sessions]);

    const filteredSessions = useMemo(() => {
        const normalizedSearch = normalizeSearchToken(searchTerm);
        return sessions.filter((item) => {
            const matchesEmpresa = empresaFilter === 'all' || String(item.empresa_id || 'sin-empresa') === empresaFilter;
            const matchesUsuario = usuarioFilter === 'all' || String(item.user_id) === usuarioFilter;
            const matchesSearch =
                !normalizedSearch ||
                includesNormalized(item.nombre_completo, normalizedSearch) ||
                includesNormalized(item.email, normalizedSearch);

            return matchesEmpresa && matchesUsuario && matchesSearch;
        });
    }, [sessions, empresaFilter, usuarioFilter, searchTerm]);

    const handleRevoke = async (sessionItem) => {
        const confirmed = await appConfirm({
            title: 'Revocar sesión activa',
            message: `Se invalidará la sesión activa de ${sessionItem.nombre_completo || sessionItem.email}. El usuario perderá acceso en su siguiente petición autenticada.`,
            confirmLabel: 'Revocar',
            cancelLabel: 'Cancelar',
            tone: 'danger',
        });
        if (!confirmed) return;

        setRevokingId(sessionItem.user_id);
        try {
            await adminSessionsApi.revoke(sessionItem.user_id);
            await loadSessions();
        } catch (error) {
            console.error('Error revocando sesión:', error);
            await appAlert({
                title: 'No se pudo revocar la sesión',
                message: error.response?.data?.detail || 'Inténtelo de nuevo en unos segundos.',
                tone: 'danger',
            });
        } finally {
            setRevokingId(null);
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
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Sesiones</h1>
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
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">Control de acceso vivo</p>
                            <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-5xl uppercase">Sesiones activas</h1>
                            <p className="mt-4 max-w-4xl text-sm text-zinc-600 leading-relaxed">
                                Vista operativa de sesiones únicas vigentes por usuario, con empresa asociada, inicio de sesión y último dispositivo conocido.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={loadSessions}
                            className="inline-flex items-center gap-2 rounded-2xl bg-[#1A1A1A] px-5 py-3 text-[11px] font-black uppercase tracking-[0.18em] text-white hover:bg-zinc-800 transition-colors"
                        >
                            <TimerReset className="w-4 h-4" /> Refrescar
                        </button>
                    </header>

                    <section className="mb-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                        <ClearSearchField
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            placeholder="Buscar por usuario o correo..."
                            containerClassName="w-full xl:max-w-md"
                            searchIconClassName="left-4"
                            inputClassName="w-full rounded-2xl border border-zinc-200 bg-white py-3 pl-11 pr-10 text-sm font-semibold text-zinc-800 outline-none transition-colors focus:border-[#F39200]"
                        />

                        <div className="grid w-full gap-3 md:grid-cols-2 xl:w-auto xl:min-w-[520px]">
                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Empresa</span>
                                <AnimatedSelect
                                    value={empresaFilter}
                                    onChange={(e) => setEmpresaFilter(e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]"
                                >
                                    <option value="all">Todas</option>
                                    {empresaOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </AnimatedSelect>
                            </label>

                            <label className="space-y-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Colaborador</span>
                                <AnimatedSelect
                                    value={usuarioFilter}
                                    onChange={(e) => setUsuarioFilter(e.target.value)}
                                    className="w-full rounded-2xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]"
                                >
                                    <option value="all">Todos</option>
                                    {usuarioOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </AnimatedSelect>
                            </label>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Sesiones</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{metrics.total}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-blue-200 bg-blue-50/70 px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#136191]">Empresas</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-[#136191]">{metrics.empresas}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50/70 px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">Con dispositivo</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-[#F39200]">{metrics.withDevice}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Superadmins</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-emerald-700">{metrics.superadmins}</p>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-zinc-200 bg-white shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden">
                        <div className="border-b border-zinc-200 px-6 py-4">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Listado operativo</p>
                            <p className="mt-1 text-sm text-zinc-500">La revocación invalida la sesión única guardada en backend y deja la acción trazada en `auth_debug.log`.</p>
                        </div>

                        <div className="max-h-[62vh] overflow-y-auto">
                            {loading ? (
                                <div className="px-6 py-10 text-sm font-semibold text-zinc-500">Cargando sesiones...</div>
                            ) : sessions.length === 0 ? (
                                <div className="px-6 py-10 text-sm font-semibold text-zinc-500">No hay sesiones activas registradas.</div>
                            ) : filteredSessions.length === 0 ? (
                                <div className="px-6 py-10 text-sm font-semibold text-zinc-500">No hay sesiones que coincidan con los filtros aplicados.</div>
                            ) : (
                                <div className="divide-y divide-zinc-100">
                                    {filteredSessions.map((sessionItem) => (
                                        <div key={sessionItem.user_id} className="px-6 py-5 bg-white">
                                            <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                                                <div className="min-w-0">
                                                    <div className="flex flex-wrap items-center gap-2 mb-3">
                                                        <span className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600">
                                                            <UsersRound className="w-3.5 h-3.5" />
                                                            {sessionItem.empresa_nombre || 'Sin empresa'}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] ${sessionItem.rol === 'Superadministrador' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-[#136191]'}`}>
                                                            <ShieldCheck className="w-3.5 h-3.5" />
                                                            {sessionItem.rol}
                                                        </span>
                                                        <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200] font-mono">
                                                            SID {String(sessionItem.session_id || '').slice(0, 8)}
                                                        </span>
                                                    </div>
                                                    <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">{sessionItem.nombre_completo || sessionItem.email}</h2>
                                                    <p className="mt-1 text-sm text-zinc-600">{sessionItem.email}</p>

                                                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 text-xs">
                                                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                            <p className="font-black uppercase tracking-[0.16em] text-zinc-400 mb-1">Inicio de sesión</p>
                                                            <p className="font-semibold text-zinc-700">{formatDateTime(sessionItem.session_started_at)}</p>
                                                        </div>
                                                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                            <p className="font-black uppercase tracking-[0.16em] text-zinc-400 mb-1">Último acceso de dispositivo</p>
                                                            <p className="font-semibold text-zinc-700">{formatDateTime(sessionItem.device_last_access_at)}</p>
                                                        </div>
                                                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                            <p className="font-black uppercase tracking-[0.16em] text-zinc-400 mb-1">Dispositivo</p>
                                                            <p className="font-semibold text-zinc-700">{sessionItem.device_nombre || 'Sin identificar'}</p>
                                                        </div>
                                                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                            <p className="font-black uppercase tracking-[0.16em] text-zinc-400 mb-1">Contexto técnico</p>
                                                            <div className="flex items-center gap-2">
                                                                <Laptop2 className="w-3.5 h-3.5 text-zinc-400" />
                                                                <p className="font-semibold text-zinc-700">{sessionItem.device_sistema || sessionItem.device_pantalla || 'Sin dato'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex shrink-0 items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRevoke(sessionItem)}
                                                        disabled={revokingId === sessionItem.user_id}
                                                        className="inline-flex items-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-[10px] font-black uppercase tracking-[0.16em] text-red-500 hover:bg-red-50 transition-colors disabled:opacity-60"
                                                    >
                                                        <LogOut className="w-4 h-4" />
                                                        {revokingId === sessionItem.user_id ? 'Revocando...' : 'Revocar'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AdminGlobalSesiones;