import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Activity,
    ArrowLeft,
    BellRing,
    Database,
    FileClock,
    ServerCog,
    UsersRound,
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import adminSystemApi from '../api/adminSystem';
import { Card, CardContent } from '../components/ui/card';

const formatDateTime = (value) => {
    if (!value) return 'Sin registro';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Sin registro';
    return new Intl.DateTimeFormat('es-EC', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
};

const formatBytes = (value) => {
    if (!value) return '0 B';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const StatusPill = ({ tone = 'default', label }) => {
    const tones = {
        success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        warning: 'border-orange-200 bg-orange-50 text-[#F39200]',
        default: 'border-zinc-200 bg-zinc-50 text-zinc-600',
    };

    return (
        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${tones[tone] || tones.default}`}>
            {label}
        </span>
    );
};

const AdminGlobalEstado = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [loading, setLoading] = useState(true);
    const [statusData, setStatusData] = useState(null);

    useEffect(() => {
        if (!isSuperadmin) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const data = await adminSystemApi.getStatus();
                setStatusData(data);
            } catch (error) {
                console.error('Error cargando estado del sistema:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isSuperadmin]);

    if (!isSuperadmin) {
        return (
            <div className="h-[calc(100vh-theme(spacing.20))] bg-[#F2F4F7] p-12">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                    <div className="bg-white border border-red-100 rounded-[2rem] p-10 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">Acceso restringido</p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Estado del sistema</h1>
                    </div>
                </div>
            </div>
        );
    }

    const backend = statusData?.backend || {};
    const database = statusData?.database || {};
    const migrations = statusData?.migrations || {};
    const sessions = statusData?.sessions || {};
    const platform = statusData?.platform || {};
    const logs = statusData?.logs || {};

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col bg-[#F2F4F7]">
            <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="w-full max-w-[1500px] mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver a Administración Global
                    </button>

                    <header className="mb-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">Lectura operativa</p>
                        <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-5xl uppercase">Estado del sistema</h1>
                        <p className="mt-4 max-w-4xl text-sm text-zinc-600 leading-relaxed">
                            Resumen técnico y sobrio del backend, base de datos, migraciones, sesiones y señales operativas básicas de la plataforma.
                        </p>
                    </header>

                    {loading ? (
                        <div className="rounded-[2rem] border border-zinc-200 bg-white p-10 text-sm font-semibold text-zinc-500">
                            Cargando estado del sistema...
                        </div>
                    ) : (
                        <>
                            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
                                <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-700">Backend</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-emerald-700">OK</p>
                                    <p className="mt-2 text-xs font-semibold text-emerald-700">{backend.project_name || 'Sin dato'}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-blue-200 bg-blue-50/70 px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#136191]">Base de datos</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-[#136191]">{database.reachable ? 'OK' : 'N/A'}</p>
                                    <p className="mt-2 text-xs font-semibold text-[#136191]">{formatDateTime(database.server_time)}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50/70 px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">Migración actual</p>
                                    <p className="mt-3 text-xl font-black tracking-tight text-[#F39200] uppercase">{migrations.current_revision || 'Sin dato'}</p>
                                    <p className="mt-2 text-xs font-semibold text-[#F39200]">{migrations.known_files || 0} revisiones detectadas</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Sesiones activas</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{sessions.active || 0}</p>
                                    <p className="mt-2 text-xs font-semibold text-zinc-500">{sessions.users_total || 0} usuarios totales</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Plataforma</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{platform.companies_active || 0}</p>
                                    <p className="mt-2 text-xs font-semibold text-zinc-500">{platform.announcements_active || 0} comunicados activos</p>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-6 mb-8">
                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-11 h-11 rounded-2xl border border-emerald-200 bg-emerald-50 flex items-center justify-center">
                                                <ServerCog className="w-5 h-5 text-emerald-700" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Backend</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Servicio API</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-sm text-zinc-600">
                                            <div className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <span className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px]">Estado</span>
                                                <StatusPill tone="success" label={backend.status || 'Operativo'} />
                                            </div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Proyecto</p>
                                                <p className="font-semibold text-zinc-700">{backend.project_name || 'Sin dato'}</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Versión</p>
                                                <p className="font-semibold text-zinc-700">{backend.version || 'Sin dato'}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-11 h-11 rounded-2xl border border-blue-200 bg-blue-50 flex items-center justify-center">
                                                <Database className="w-5 h-5 text-[#136191]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Persistencia</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Base y migraciones</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-sm text-zinc-600">
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Hora de servidor</p>
                                                <p className="font-semibold text-zinc-700">{formatDateTime(database.server_time)}</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Revisión aplicada</p>
                                                <p className="font-semibold text-zinc-700 font-mono break-all">{migrations.current_revision || 'Sin dato'}</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Último archivo</p>
                                                <p className="font-semibold text-zinc-700">{migrations.latest_file || 'Sin dato'}</p>
                                                <p className="mt-1 text-xs text-zinc-500">{formatDateTime(migrations.latest_file_updated_at)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-[#1A1A1A]">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-11 h-11 rounded-2xl border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                                                <Activity className="w-5 h-5 text-[#F39200]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Lectura rápida</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-white">Señales operativas</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-sm">
                                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-zinc-300">
                                                    <UsersRound className="w-4 h-4 text-zinc-400" />
                                                    <span>Sesiones activas</span>
                                                </div>
                                                <span className="text-white font-black">{sessions.active || 0}</span>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-zinc-300">
                                                    <BellRing className="w-4 h-4 text-zinc-400" />
                                                    <span>Comunicados activos</span>
                                                </div>
                                                <span className="text-white font-black">{platform.announcements_active || 0}</span>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-zinc-300">
                                                    <FileClock className="w-4 h-4 text-zinc-400" />
                                                    <span>Empresas activas</span>
                                                </div>
                                                <span className="text-white font-black">{platform.companies_active || 0}</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>

                            <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                                {[
                                    {
                                        title: 'Auth Debug',
                                        tone: 'success',
                                        data: logs.auth_debug,
                                    },
                                    {
                                        title: 'Fatal Errors',
                                        tone: 'warning',
                                        data: logs.fatal_errors,
                                    },
                                ].map((item) => (
                                    <Card key={item.title} className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                        <CardContent className="p-8">
                                            <div className="flex items-center justify-between mb-6">
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Logs</p>
                                                    <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">{item.title}</h2>
                                                </div>
                                                <StatusPill tone={item.data?.exists ? item.tone : 'default'} label={item.data?.exists ? 'Disponible' : 'No encontrado'} />
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-zinc-600">
                                                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                    <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Tamaño</p>
                                                    <p className="font-semibold text-zinc-700">{formatBytes(item.data?.size_bytes)}</p>
                                                </div>
                                                <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                    <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Última actualización</p>
                                                    <p className="font-semibold text-zinc-700">{formatDateTime(item.data?.updated_at)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminGlobalEstado;
