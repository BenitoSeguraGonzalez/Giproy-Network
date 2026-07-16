import { useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowUpRight,
    Building2,
    ShieldCheck,
    Users,
    Waypoints
} from 'lucide-react';
import adminGlobalApi from '../api/adminGlobal';
import { AuthContext } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';

const AdminGlobalGobernanza = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';
    const [empresas, setEmpresas] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    useEffect(() => {
        if (!isSuperadmin) return;

        const loadData = async () => {
            try {
                const [empresasData, usuariosData] = await Promise.all([
                    adminGlobalApi.getEmpresas(),
                    adminGlobalApi.getUsuarios(),
                ]);
                setEmpresas(empresasData || []);
                setUsuarios(usuariosData || []);
            } catch (error) {
                globalThis.reportClientError?.('Error cargando gobernanza:', error);
            }
        };

        loadData();
    }, [isSuperadmin]);

    const metrics = useMemo(() => {
        const superadmins = usuarios.filter((item) => item.rol === 'Superadministrador').length;
        const administradores = usuarios.filter((item) => item.rol === 'administrador').length;
        const activas = empresas.filter((item) => item.activa).length;
        return {
            empresas: empresas.length,
            activas,
            usuarios: usuarios.length,
            superadmins,
            administradores,
        };
    }, [empresas, usuarios]);

    const policies = [
        'Las funciones exclusivas de plataforma viven en Administración Global.',
        'Las capacidades híbridas entre administrador y superadministrador no se reclasifican por ubicación visual.',
        'El aislamiento multiempresa sigue siendo obligatorio en todos los módulos operativos.',
        'Superadministrador no puede operar módulos de negocio sin empresa activa.',
    ];

    if (!isSuperadmin) {
        return (
            <div className="h-[calc(100vh-theme(spacing.20))] bg-[#F2F4F7] p-12">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                    <div className="bg-white border border-red-100 rounded-[2rem] p-10 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">Acceso restringido</p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Gobernanza</h1>
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

                    <header className="mb-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">Gobierno de plataforma</p>
                        <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-5xl uppercase">Gobernanza</h1>
                        <p className="mt-4 max-w-4xl text-sm text-zinc-600 leading-relaxed">
                            Vista central de empresas, usuarios globales y políticas activas del sistema. Las acciones híbridas siguen
                            entrando por sus módulos naturales hasta completar la migración.
                        </p>
                    </header>

                    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-8">
                        <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Empresas</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{metrics.empresas}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-emerald-200 bg-emerald-50/70 px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-emerald-600">Activas</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-emerald-700">{metrics.activas}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Colaboradores</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{metrics.usuarios}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50/70 px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">Administradores</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-[#F39200]">{metrics.administradores}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-blue-200 bg-blue-50/70 px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#136191]">Superadmins</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-[#136191]">{metrics.superadmins}</p>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 xl:grid-cols-[1fr_1fr_0.9fr] gap-6">
                        <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl border border-orange-200 bg-orange-50 flex items-center justify-center">
                                            <Building2 className="w-5 h-5 text-[#F39200]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sección</p>
                                            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Empresas</h2>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/admin-global/empresas')} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 hover:border-orange-200 hover:text-[#F39200] transition-colors">
                                        Abrir gestión <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {empresas.slice(0, 5).map((empresa) => (
                                        <div key={empresa.id} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-tight text-zinc-900">{empresa.nombre}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{empresa.ruc || 'SIN RUC'}</p>
                                            </div>
                                            <span className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${empresa.activa ? 'border-emerald-200 bg-emerald-50 text-emerald-600' : 'border-red-200 bg-red-50 text-red-500'}`}>
                                                {empresa.activa ? 'Activa' : 'Inactiva'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                            <CardContent className="p-8">
                                <div className="flex items-center justify-between gap-4 mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-11 h-11 rounded-2xl border border-blue-200 bg-blue-50 flex items-center justify-center">
                                            <Users className="w-5 h-5 text-[#136191]" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sección</p>
                                            <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">Colaboradores globales</h2>
                                        </div>
                                    </div>
                                    <button onClick={() => navigate('/settings')} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 hover:border-blue-200 hover:text-[#136191] transition-colors">
                                        Abrir gestión híbrida <ArrowUpRight className="w-4 h-4" />
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {usuarios.slice(0, 6).map((usuario) => (
                                        <div key={usuario.id} className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/60 px-4 py-3">
                                            <div>
                                                <p className="text-sm font-black uppercase tracking-tight text-zinc-900">{usuario.nombre_completo}</p>
                                                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">{usuario.empresa?.nombre || 'Sin empresa'}</p>
                                            </div>
                                            <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600">
                                                {usuario.rol}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-[#1A1A1A]">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-11 h-11 rounded-2xl border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                                        <Waypoints className="w-5 h-5 text-[#F39200]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Políticas activas</p>
                                        <h2 className="text-xl font-black uppercase tracking-tight text-white">Normas de gobierno</h2>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {policies.map((policy) => (
                                        <div key={policy} className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-sm font-medium text-zinc-300 leading-relaxed">
                                            {policy}
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-200/30 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200]">
                                    Gobernanza preparada
                                </div>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AdminGlobalGobernanza;
