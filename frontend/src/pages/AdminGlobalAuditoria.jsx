import { useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ActivitySquare,
    AlertTriangle,
    ArrowLeft,
    Filter,
    FileWarning,
    ScrollText,
    ShieldCheck
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import adminAuditApi from '../api/adminAudit';
import { Card, CardContent } from '../components/ui/card';
import AnimatedSelect from '../components/ui/AnimatedSelect';

const sourceLabel = (source) => {
    switch (source) {
        case 'auth_debug':
            return 'Auth Debug';
        case 'fatal_errors':
            return 'Fatal Errors';
        default:
            return source;
    }
};

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

const AdminGlobalAuditoria = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState(null);
    const [events, setEvents] = useState([]);
    const [legacyEvents, setLegacyEvents] = useState([]);
    const [filters, setFilters] = useState({
        module: '',
        severity: '',
        q: '',
    });

    useEffect(() => {
        if (!isSuperadmin) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const [summaryData, eventsData, legacyData] = await Promise.all([
                    adminAuditApi.getSummary(),
                    adminAuditApi.getEvents({ limit: 80, ...filters }),
                    adminAuditApi.getRecentEvents(),
                ]);
                setSummary(summaryData);
                setEvents(eventsData || []);
                setLegacyEvents(legacyData || []);
            } catch (error) {
                console.error('Error cargando auditoría:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, [isSuperadmin, filters]);

    if (!isSuperadmin) {
        return (
            <div className="h-[calc(100vh-theme(spacing.20))] bg-[#F2F4F7] p-12">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                    <div className="bg-white border border-red-100 rounded-[2rem] p-10 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">Acceso restringido</p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Auditoría</h1>
                    </div>
                </div>
            </div>
        );
    }

    const metrics = summary?.metrics || {};
    const sources = summary?.sources || {};
    const backlog = summary?.backlog || [];
    const modules = ['auth', 'empresas', 'maintenance', 'announcements', 'admin_system'];
    const severities = ['info', 'warning', 'critical'];

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col bg-[#F2F4F7]">
            <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="w-full max-w-[1500px] mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver a Administración Global
                    </button>

                    <header className="mb-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">Trazabilidad operativa</p>
                        <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-5xl uppercase">Auditoría</h1>
                        <p className="mt-4 max-w-4xl text-sm text-zinc-600 leading-relaxed">
                            Consolida las fuentes reales de trazabilidad disponibles hoy: logs operativos, errores fatales,
                            estado administrativo y backlog pendiente para una auditoría estructurada completa.
                        </p>
                    </header>

                    {loading ? (
                        <div className="rounded-[2rem] border border-zinc-200 bg-white p-10 text-sm font-semibold text-zinc-500">
                            Cargando auditoría...
                        </div>
                    ) : (
                        <>
                            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
                                <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Empresas</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{metrics.empresas || 0}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Activas</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-emerald-700">{metrics.empresas_activas || 0}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Colaboradores</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{metrics.usuarios || 0}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-blue-200 bg-blue-50/70 px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#136191]">Superadmins</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-[#136191]">{metrics.superadministradores || 0}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50/70 px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">Comunicados</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-[#F39200]">{metrics.comunicados_activos || 0}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Eventos estructurados</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{metrics.structured_events_total || 0}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-red-200 bg-red-50/70 px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">Críticos 7 días</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-red-600">{metrics.critical_events_7d || 0}</p>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1.1fr] gap-6 mb-8">
                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-11 h-11 rounded-2xl border border-blue-200 bg-blue-50 flex items-center justify-center">
                                                <ActivitySquare className="w-5 h-5 text-[#136191]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Fuente</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Auth Debug</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-sm text-zinc-600">
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Archivo</p>
                                                <p className="font-semibold text-zinc-700">{sources.auth_debug?.exists ? 'Disponible' : 'No encontrado'}</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Tamaño</p>
                                                <p className="font-semibold text-zinc-700">{formatBytes(sources.auth_debug?.size_bytes)}</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Última actualización</p>
                                                <p className="font-semibold text-zinc-700">{formatDateTime(sources.auth_debug?.updated_at)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-11 h-11 rounded-2xl border border-red-200 bg-red-50 flex items-center justify-center">
                                                <FileWarning className="w-5 h-5 text-red-600" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Fuente</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Fatal Errors</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-sm text-zinc-600">
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Archivo</p>
                                                <p className="font-semibold text-zinc-700">{sources.fatal_errors?.exists ? 'Disponible' : 'No encontrado'}</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Tamaño</p>
                                                <p className="font-semibold text-zinc-700">{formatBytes(sources.fatal_errors?.size_bytes)}</p>
                                            </div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                <p className="font-black uppercase tracking-[0.16em] text-zinc-400 text-[10px] mb-1">Última actualización</p>
                                                <p className="font-semibold text-zinc-700">{formatDateTime(sources.fatal_errors?.updated_at)}</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-[#1A1A1A]">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-11 h-11 rounded-2xl border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                                                <ShieldCheck className="w-5 h-5 text-[#F39200]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Backlog real</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-white">Estado de auditoría</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {backlog.map((item) => (
                                                <div key={item} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm font-medium text-zinc-300 leading-relaxed">
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>

                            <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                <CardContent className="p-8">
                                    <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between mb-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-11 h-11 rounded-2xl border border-orange-200 bg-orange-50 flex items-center justify-center">
                                                <ScrollText className="w-5 h-5 text-[#F39200]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Eventos recientes</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Auditoría estructurada</h2>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full xl:w-auto xl:min-w-[720px]">
                                            <label className="space-y-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Módulo</span>
                                                <AnimatedSelect value={filters.module} onChange={(e) => setFilters((current) => ({ ...current, module: e.target.value }))} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]">
                                                    <option value="">Todos</option>
                                                    {modules.map((item) => <option key={item} value={item}>{item}</option>)}
                                                </AnimatedSelect>
                                            </label>
                                            <label className="space-y-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Severidad</span>
                                                <AnimatedSelect value={filters.severity} onChange={(e) => setFilters((current) => ({ ...current, severity: e.target.value }))} className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]">
                                                    <option value="">Todas</option>
                                                    {severities.map((item) => <option key={item} value={item}>{item}</option>)}
                                                </AnimatedSelect>
                                            </label>
                                            <label className="space-y-2">
                                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Buscar</span>
                                                <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                                                    <Filter className="w-4 h-4 text-zinc-400" />
                                                    <input value={filters.q} onChange={(e) => setFilters((current) => ({ ...current, q: e.target.value }))} placeholder="usuario, mensaje, evento..." className="w-full bg-transparent text-sm font-semibold text-zinc-800 outline-none placeholder:text-zinc-400" />
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                    <div className="max-h-[44vh] overflow-y-auto rounded-2xl border border-zinc-200 bg-zinc-50/50">
                                        <div className="divide-y divide-zinc-200/60">
                                            {events.length === 0 ? (
                                                <div className="px-5 py-6 text-sm font-semibold text-zinc-500">No hay eventos estructurados para los filtros aplicados.</div>
                                            ) : events.map((event, index) => (
                                                <div key={`${event.id}-${index}`} className="px-5 py-4">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">
                                                            {event.module}
                                                        </span>
                                                        <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${event.severity === 'critical' ? 'border-red-200 bg-red-50 text-red-600' : event.severity === 'warning' ? 'border-orange-200 bg-orange-50 text-[#F39200]' : 'border-blue-200 bg-blue-50 text-[#136191]'}`}>
                                                            {event.severity}
                                                        </span>
                                                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                                            {event.event_type}
                                                        </span>
                                                        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                                                            {formatDateTime(event.created_at)}
                                                        </span>
                                                    </div>
                                                    <div className="text-sm font-semibold leading-relaxed text-zinc-800 break-words mb-1">
                                                        {event.message}
                                                    </div>
                                                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-zinc-500">
                                                        <span>Actor: <span className="font-black text-zinc-700">{event.actor_email || 'Sistema'}</span></span>
                                                        {event.target_empresa_nombre ? <span>Empresa: <span className="font-black text-zinc-700">{event.target_empresa_nombre}</span></span> : null}
                                                        {event.entity_type ? <span>Entidad: <span className="font-black text-zinc-700">{event.entity_type}</span></span> : null}
                                                    </div>
                                                    {event.payload ? (
                                                        <pre className="mt-3 overflow-x-auto rounded-2xl border border-zinc-200 bg-white px-3 py-3 text-[11px] text-zinc-600">
                                                            {JSON.stringify(event.payload, null, 2)}
                                                        </pre>
                                                    ) : null}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="mt-6 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                                        <div className="flex items-start gap-3 rounded-2xl border border-orange-100 bg-orange-50/70 px-4 py-3 text-sm text-zinc-600">
                                            <AlertTriangle className="w-4 h-4 text-[#F39200] mt-0.5 shrink-0" />
                                            <p>
                                                La prioridad de esta vista ya es la auditoría estructurada. Los logs legacy se mantienen como apoyo de diagnóstico mientras más módulos se instrumentan como eventos formales.
                                            </p>
                                        </div>
                                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50/50 overflow-hidden">
                                            <div className="border-b border-zinc-200 px-4 py-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Logs legacy recientes</p>
                                            </div>
                                            <div className="max-h-[18rem] overflow-y-auto divide-y divide-zinc-200/60">
                                                {legacyEvents.length === 0 ? (
                                                    <div className="px-4 py-4 text-sm font-semibold text-zinc-500">No hay eventos legacy recientes.</div>
                                                ) : legacyEvents.map((event, index) => (
                                                    <div key={`${event.source}-${index}`} className="px-4 py-3">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${event.source === 'fatal_errors' ? 'border-red-200 bg-red-50 text-red-600' : 'border-blue-200 bg-blue-50 text-[#136191]'}`}>
                                                                {sourceLabel(event.source)}
                                                            </span>
                                                        </div>
                                                        <div className="font-mono text-[11px] leading-relaxed text-zinc-700 break-words">
                                                            {event.message}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminGlobalAuditoria;