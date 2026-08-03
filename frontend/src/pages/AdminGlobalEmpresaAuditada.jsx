import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    Eye,
    FolderKanban,
    HardHat,
    ScrollText,
    ShieldCheck,
    Users,
} from 'lucide-react';
import adminGlobalApi from '../api/adminGlobal';
import adminSupportApi from '../api/adminSupport';
import { AuthContext } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';
import { appAlert } from '../utils/appDialog';
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

const formatMoney = (value) =>
    new Intl.NumberFormat('es-EC', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(Number(value || 0));

const AdminGlobalEmpresaAuditada = () => {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [empresas, setEmpresas] = useState([]);
    const [empresaAuditadaId, setEmpresaAuditadaId] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingConsole, setLoadingConsole] = useState(false);
    const [consoleData, setConsoleData] = useState(null);

    useEffect(() => {
        if (!isSuperadmin) return;

        const loadEmpresas = async () => {
            setLoading(true);
            try {
                const items = await adminGlobalApi.getEmpresas();
                setEmpresas(items);
                if (items.length > 0) {
                    const initialId = selectedEmpresa?.id || items[0].id;
                    setEmpresaAuditadaId(String(initialId));
                }
            } catch (error) {
                globalThis.reportClientError?.('Error cargando empresas auditables:', error);
                await appAlert({
                    title: 'No se pudieron cargar las empresas',
                    message: error.response?.data?.detail || 'Revise la conectividad con el backend.',
                });
            } finally {
                setLoading(false);
            }
        };

        loadEmpresas();
    }, [isSuperadmin, selectedEmpresa?.id]);

    useEffect(() => {
        if (!isSuperadmin || !empresaAuditadaId) return;

        const loadConsole = async () => {
            setLoadingConsole(true);
            try {
                const data = await adminSupportApi.getCompanyConsole(empresaAuditadaId);
                setConsoleData(data);
            } catch (error) {
                globalThis.reportClientError?.('Error cargando consola auditada:', error);
                await appAlert({
                    title: 'No se pudo cargar la consola auditada',
                    message: error.response?.data?.detail || 'Revise la conectividad con el backend.',
                });
            } finally {
                setLoadingConsole(false);
            }
        };

        loadConsole();
    }, [isSuperadmin, empresaAuditadaId]);

    const isOperationalMatch = useMemo(() => {
        return Number(selectedEmpresa?.id || 0) === Number(empresaAuditadaId || 0);
    }, [selectedEmpresa?.id, empresaAuditadaId]);

    if (!isSuperadmin) {
        return (
            <div className="h-full min-h-0 bg-[#F2F4F7] p-12">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                    <div className="bg-white border border-red-100 rounded-[2rem] p-10 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">Acceso restringido</p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Consola de empresa auditada</h1>
                    </div>
                </div>
            </div>
        );
    }

    const empresa = consoleData?.empresa;
    const usuarios = consoleData?.usuarios || {};
    const bases = consoleData?.bases || {};
    const proyectos = consoleData?.proyectos || {};
    const presupuestos = consoleData?.presupuestos || {};
    const audit = consoleData?.audit || {};

    return (
        <div className="h-full min-h-0 flex flex-col bg-[#F2F4F7]">
            <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="w-full max-w-[1500px] mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver a Administración Global
                    </button>

                    <header className="mb-10 flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">Soporte contextual seguro</p>
                            <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-5xl uppercase">Consola de empresa auditada</h1>
                            <p className="mt-4 max-w-4xl text-sm text-zinc-600 leading-relaxed">
                                Inspección explícita del estado operativo de una empresa sin mezclar silenciosamente el tenant de trabajo normal.
                            </p>
                        </div>

                        <div className="w-full xl:w-[420px]">
                            <label className="space-y-2 block">
                                <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Empresa auditada</span>
                                <AnimatedSelect
                                    value={empresaAuditadaId}
                                    onChange={(e) => setEmpresaAuditadaId(e.target.value)}
                                    disabled={loading}
                                    className="w-full rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-800 outline-none focus:border-[#F39200]"
                                >
                                    {empresas.map((item) => (
                                        <option key={item.id} value={item.id}>
                                            {item.nombre}
                                        </option>
                                    ))}
                                </AnimatedSelect>
                            </label>
                        </div>
                    </header>

                    <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6 mb-8">
                        <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-2xl border border-orange-200 bg-orange-50 flex items-center justify-center">
                                        <Eye className="w-5 h-5 text-[#F39200]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Regla de contexto</p>
                                        <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Separación de tenant</h2>
                                    </div>
                                </div>
                                <div className={`rounded-2xl border px-4 py-4 text-sm leading-relaxed ${isOperationalMatch ? 'border-orange-200 bg-orange-50/70 text-zinc-700' : 'border-blue-200 bg-blue-50/70 text-zinc-700'}`}>
                                    <p>Empresa operativa actual:<span className="ml-2 font-black uppercase">{selectedEmpresa?.nombre || 'Sin empresa activa'}</span></p>
                                    <p className="mt-2">Empresa auditada:<span className="ml-2 font-black uppercase">{empresa?.nombre || 'Sin cargar'}</span></p>
                                    <p className="mt-3 text-xs font-semibold text-zinc-500">
                                        Esta vista no cambia el tenant operativo normal. Solo ofrece contexto de soporte y deja trazabilidad al abrirse.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-[#1A1A1A]">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-11 h-11 rounded-2xl border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                                        <ShieldCheck className="w-5 h-5 text-[#F39200]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Uso esperado</p>
                                        <h2 className="text-xl font-black uppercase tracking-tight text-white">Soporte, no operación</h2>
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-300 leading-relaxed">
                                    Esta consola está diseñada para diagnóstico contextual: usuarios, cuotas, bases, proyectos, presupuestos y eventos recientes de la empresa auditada. No sustituye el cambio de empresa operativo.
                                </p>
                            </CardContent>
                        </Card>
                    </section>

                    {loadingConsole ? (
                        <div className="rounded-[2rem] border border-zinc-200 bg-white p-10 text-sm font-semibold text-zinc-500">
                            Cargando consola auditada...
                        </div>
                    ) : !consoleData ? null : (
                        <>
                            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 mb-8">
                                <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Colaboradores</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{usuarios.total || 0}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Sesiones activas</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-emerald-700">{usuarios.active_sessions || 0}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-blue-200 bg-blue-50/70 px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#136191]">Bases</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-[#136191]">{bases.total || 0}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50/70 px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">Proyectos</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-[#F39200]">{proyectos.total || 0}</p>
                                </div>
                                <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Presupuestos</p>
                                    <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{presupuestos.total || 0}</p>
                                </div>
                                <div className={`rounded-[1.75rem] border px-5 py-5 ${empresa?.activa ? 'border-emerald-200 bg-emerald-50/70' : 'border-red-200 bg-red-50/70'}`}>
                                    <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${empresa?.activa ? 'text-emerald-600' : 'text-red-500'}`}>Empresa</p>
                                    <p className={`mt-3 text-3xl font-black tracking-tight ${empresa?.activa ? 'text-emerald-700' : 'text-red-600'}`}>{empresa?.activa ? 'Activa' : 'Inactiva'}</p>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_1fr] gap-6 mb-8">
                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-11 h-11 rounded-2xl border border-blue-200 bg-blue-50 flex items-center justify-center">
                                                <Building2 className="w-5 h-5 text-[#136191]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Empresa</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Ficha auditada</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-sm text-zinc-600">
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3"><span className="font-black text-zinc-900">{empresa?.nombre}</span></div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">RUC: <span className="font-semibold text-zinc-700">{empresa?.ruc || 'Sin RUC'}</span></div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">Contacto: <span className="font-semibold text-zinc-700">{empresa?.contacto_nombre || empresa?.email || 'Sin dato'}</span></div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">Ubicación: <span className="font-semibold text-zinc-700">{[empresa?.localidad, empresa?.provincia, empresa?.pais].filter(Boolean).join(', ') || 'Sin dato'}</span></div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-11 h-11 rounded-2xl border border-orange-200 bg-orange-50 flex items-center justify-center">
                                                <Users className="w-5 h-5 text-[#F39200]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Cuotas y usuarios</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Capacidad</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-3 text-sm text-zinc-600">
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">Administradores: <span className="font-black text-zinc-900">{usuarios.administradores || 0}</span> / {empresa?.limites?.administradores || 0}</div>
                                            <div className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">Colaboradores: <span className="font-black text-zinc-900">{usuarios.usuarios || 0}</span> / {empresa?.limites?.usuarios || 0}</div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-[#1A1A1A]">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-11 h-11 rounded-2xl border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                                                <ScrollText className="w-5 h-5 text-[#F39200]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Auditoría reciente</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-white">Eventos de soporte</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-3 max-h-[18rem] overflow-y-auto">
                                            {(audit.events || []).length === 0 ? (
                                                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm font-medium text-zinc-300">
                                                    Sin eventos recientes para esta empresa.
                                                </div>
                                            ) : audit.events.map((item) => (
                                                <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm text-zinc-300">
                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-[#F39200]">{item.module}</span>
                                                        <span className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-500">{formatDateTime(item.created_at)}</span>
                                                    </div>
                                                    <div className="font-semibold text-white">{item.message}</div>
                                                    <div className="mt-1 text-xs text-zinc-400">{item.actor_email || 'Sistema'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>

                            <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr] gap-6">
                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-11 h-11 rounded-2xl border border-zinc-200 bg-zinc-50 flex items-center justify-center">
                                                <HardHat className="w-5 h-5 text-zinc-700" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Colaboradores y bases</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Contexto técnico</h2>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                            <div className="space-y-3">
                                                {(usuarios.items || []).slice(0, 6).map((item) => (
                                                    <div key={item.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                        <div className="font-black uppercase tracking-tight text-zinc-900">{item.nombre_completo}</div>
                                                        <div className="text-xs text-zinc-500">{item.email} · {item.rol}</div>
                                                        <div className="mt-1 text-[11px] text-zinc-500">{item.session_active ? `Sesión activa · ${formatDateTime(item.session_started_at)}` : 'Sin sesión activa'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="space-y-3">
                                                {(bases.items || []).slice(0, 6).map((item) => (
                                                    <div key={item.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                        <div className="font-black uppercase tracking-tight text-zinc-900">{item.nombre}</div>
                                                        <div className="text-xs text-zinc-500">{item.tipo} · {item.codigo_unico}</div>
                                                        <div className="mt-1 text-[11px] text-zinc-500">{item.activa ? 'Base activa' : 'Base inactiva'}</div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                    <CardContent className="p-8">
                                        <div className="flex items-center gap-3 mb-6">
                                            <div className="w-11 h-11 rounded-2xl border border-blue-200 bg-blue-50 flex items-center justify-center">
                                                <FolderKanban className="w-5 h-5 text-[#136191]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Proyectos y presupuesto</p>
                                                <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Actividad reciente</h2>
                                            </div>
                                        </div>
                                        <div className="space-y-3 mb-5">
                                            {(proyectos.items || []).slice(0, 5).map((item) => (
                                                <div key={item.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                    <div className="font-black uppercase tracking-tight text-zinc-900">{item.nombre}</div>
                                                    <div className="text-xs text-zinc-500">{item.codigo || item.codigo_root} · Rev. {item.revision} · {item.estado}</div>
                                                    <div className="mt-1 text-[11px] text-zinc-500">Estimado: {formatMoney(item.presupuesto_estimado)}</div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="space-y-3">
                                            {(presupuestos.items || []).slice(0, 5).map((item) => (
                                                <div key={item.id} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                    <div className="font-black uppercase tracking-tight text-zinc-900">{item.descripcion}</div>
                                                    <div className="text-xs text-zinc-500">Rev. {item.revision} · {item.estado}</div>
                                                    <div className="mt-1 text-[11px] text-zinc-500">Total: {formatMoney(item.total)}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </section>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminGlobalEmpresaAuditada;
