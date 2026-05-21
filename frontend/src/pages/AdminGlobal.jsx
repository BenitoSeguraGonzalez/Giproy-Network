import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowUpRight,
    Building2,
    Activity,
    Megaphone,
    TimerReset,
    ShieldAlert,
    Users,
    ScrollText,
    ShieldCheck,
    Wrench,
    Settings2,
    Eye,
    Blocks,
    FileCog
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';

const MotionDiv = motion.div;

const AdminGlobal = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';

    if (!isSuperadmin) {
        return (
            <div className="h-[calc(100vh-theme(spacing.20))] bg-[#F2F4F7] p-12">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
                    </button>

                    <div className="bg-white border border-red-100 rounded-[2rem] p-10 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">
                            Acceso restringido
                        </p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">
                            Administracion Global
                        </h1>
                        <p className="text-sm text-zinc-600 leading-relaxed">
                            Este modulo esta reservado para <span className="font-black uppercase">Superadministrador</span>.
                            Las funciones hibridas entre administradores y superadministradores seguiran viviendo en sus
                            modulos naturales hasta completar la migracion planificada.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const sections = [
        {
            id: 'superadmins',
            title: 'Superadministradores',
            description: 'Edición y gobierno de cuentas con privilegio máximo del sistema desde el ajuste SaaS.',
            icon: <Settings2 className="w-7 h-7 text-violet-700" />,
            color: 'bg-violet-50',
            borderColor: 'border-violet-200',
            status: 'Submódulo activo',
            href: '/settings?tab=superadmins'
        },
        {
            id: 'estado',
            title: 'Estado',
            description: 'Salud del backend, base de datos, migraciones y señales operativas de plataforma.',
            icon: <Activity className="w-7 h-7 text-emerald-600" />,
            color: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            status: 'Submódulo activo',
            href: '/admin-global/estado'
        },
        {
            id: 'sesiones',
            title: 'Sesiones',
            description: 'Lectura y revocación controlada de sesiones activas por usuario y empresa.',
            icon: <TimerReset className="w-7 h-7 text-[#F39200]" />,
            color: 'bg-orange-50',
            borderColor: 'border-orange-200',
            status: 'Submódulo activo',
            href: '/admin-global/sesiones'
        },
        {
            id: 'mantenimiento',
            title: 'Mantenimiento',
            description: 'Control real de solo lectura o acceso restringido durante ventanas operativas.',
            icon: <ShieldAlert className="w-7 h-7 text-red-600" />,
            color: 'bg-red-50',
            borderColor: 'border-red-200',
            status: 'Submódulo activo',
            href: '/admin-global/mantenimiento'
        },
        {
            id: 'bim',
            title: 'BIM',
            description: 'Activación controlada del módulo BIM desde interfaz, con alcance administrable por superadministración.',
            icon: <Blocks className="w-7 h-7 text-[#F39200]" />,
            color: 'bg-orange-50',
            borderColor: 'border-orange-200',
            status: 'Submódulo activo',
            href: '/admin-global/bim'
        },
        {
            id: 'licencias',
            title: 'Licencias',
            description: 'Control de límites, ocupación y alertas de capacidad por empresa.',
            icon: <Users className="w-7 h-7 text-[#136191]" />,
            color: 'bg-blue-50',
            borderColor: 'border-blue-200',
            status: 'Submódulo activo',
            href: '/admin-global/licencias'
        },
        {
            id: 'empresas',
            title: 'Empresas',
            description: 'Gestión de personas jurídicas, activación, cuotas y datos corporativos de plataforma.',
            icon: <Building2 className="w-7 h-7 text-[#136191]" />,
            color: 'bg-blue-50',
            borderColor: 'border-blue-200',
            status: 'Migración activa',
            href: '/settings?tab=empresas'
        },
        {
            id: 'comunicados',
            title: 'Comunicados',
            description: 'Avisos operativos del sistema, mantenimiento e interrupciones programadas.',
            icon: <Megaphone className="w-7 h-7 text-[#F39200]" />,
            color: 'bg-orange-50',
            borderColor: 'border-orange-200',
            status: 'Submódulo activo',
            href: '/admin-global/comunicados'
        },
        {
            id: 'gobernanza',
            title: 'Gobernanza',
            description: 'Empresas, usuarios globales, politicas y control transversal de tenant.',
            icon: <ShieldCheck className="w-7 h-7 text-[#136191]" />,
            color: 'bg-blue-50',
            borderColor: 'border-blue-200',
            status: 'Submódulo preparado',
            href: '/admin-global/gobernanza'
        },
        {
            id: 'auditoria',
            title: 'Auditoria',
            description: 'Trazabilidad administrativa, eventos relevantes y lectura operativa del sistema.',
            icon: <ScrollText className="w-7 h-7 text-emerald-600" />,
            color: 'bg-emerald-50',
            borderColor: 'border-emerald-200',
            status: 'Submódulo activo',
            href: '/admin-global/auditoria'
        },
        {
            id: 'herramientas',
            title: 'Herramientas',
            description: 'Utilidades tecnicas, saneamiento, soporte y diagnostico controlado.',
            icon: <Wrench className="w-7 h-7 text-zinc-700" />,
            color: 'bg-zinc-100',
            borderColor: 'border-zinc-200',
            status: 'Submódulo preparado',
            href: '/admin-global/herramientas'
        },
        {
            id: 'modelos-importacion',
            title: 'Modelos Importación',
            description: 'Editor visual de perfiles SOCE/SERCOP para importación clásica de compras públicas.',
            icon: <FileCog className="w-7 h-7 text-[#136191]" />,
            color: 'bg-blue-50',
            borderColor: 'border-blue-200',
            status: 'Submódulo activo',
            href: '/admin-global/modelos-importacion'
        },
        {
            id: 'empresa-auditada',
            title: 'Empresa Auditada',
            description: 'Consola de soporte contextual para inspeccionar una empresa sin alterar el tenant operativo normal.',
            icon: <Eye className="w-7 h-7 text-[#F39200]" />,
            color: 'bg-orange-50',
            borderColor: 'border-orange-200',
            status: 'Submódulo activo',
            href: '/admin-global/empresa-auditada'
        }
    ];

    return (
        <div className="h-[calc(100vh-theme(spacing.20))] flex flex-col bg-[#F2F4F7]">
            <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="w-full max-w-[1500px] mx-auto">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" /> Volver al Dashboard
                    </button>

                    <header className="mb-12">
                        <MotionDiv
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.35 }}
                            className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between"
                        >
                            <div className="max-w-5xl">
                                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">
                                    Plataforma y operacion del sistema
                                </p>
                                <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-5xl uppercase">
                                    Administracion Global
                                </h1>
                                <p className="mt-4 max-w-4xl text-sm text-zinc-600 leading-relaxed">
                                    Contenedor exclusivo para capacidades de <span className="font-black uppercase">Superadministrador</span>.
                                    Las funciones hibridas entre administradores y superadministradores no se migran
                                    automaticamente: se clasificaran una a una para no romper permisos existentes.
                                </p>
                            </div>
                        </MotionDiv>
                    </header>

                    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                        {sections.map((section, index) => (
                            <MotionDiv
                                key={section.id}
                                initial={{ opacity: 0, y: 24 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.35, delay: index * 0.06 }}
                            >
                                <Card className="h-full border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                    <CardContent className="p-8 flex flex-col h-full">
                                        <div className={`w-14 h-14 rounded-[1.25rem] border flex items-center justify-center ${section.color} ${section.borderColor}`}>
                                            {section.icon}
                                        </div>

                                        <div className="mt-6">
                                            <p className="text-[9px] font-black uppercase tracking-[0.22em] text-zinc-400 mb-2">
                                                {section.status}
                                            </p>
                                            <h2 className="text-2xl font-black uppercase tracking-tight text-zinc-900">
                                                {section.title}
                                            </h2>
                                            <p className="mt-3 text-sm text-zinc-600 leading-relaxed">
                                                {section.description}
                                            </p>
                                        </div>

                                        <div className="mt-auto pt-8 border-t border-zinc-100 flex items-center justify-between">
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                {section.href ? 'Abrir submódulo' : 'Submódulo previsto'}
                                            </span>
                                            {section.href ? (
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(section.href)}
                                                    className="w-10 h-10 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-400 hover:border-orange-200 hover:text-[#F39200] transition-colors"
                                                >
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </button>
                                            ) : (
                                                <div className="w-10 h-10 rounded-xl border border-zinc-200 bg-zinc-50 flex items-center justify-center text-zinc-400">
                                                    <ArrowUpRight className="w-4 h-4" />
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </MotionDiv>
                        ))}
                    </section>

                    <section className="mt-10 grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
                        <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-[1rem] border border-orange-200 bg-orange-50 flex items-center justify-center">
                                        <Settings2 className="w-5 h-5 text-[#F39200]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Migracion controlada</p>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-zinc-900">Relación con Ajustes</h3>
                                    </div>
                                </div>
                                <div className="space-y-3 text-sm text-zinc-600 leading-relaxed">
                                    <p>
                                        Esta shell no mueve todavía nada desde <span className="font-black uppercase">Settings</span>.
                                        Primero se crea el contenedor y después se clasifican capacidades como:
                                        exclusivas de superadministrador, híbridas o exclusivas de administrador.
                                    </p>
                                    <p>
                                        Esa clasificación queda reservada para <span className="font-black uppercase">TASK-0084</span>,
                                        evitando romper accesos existentes por una simple reorganización visual.
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-[#1A1A1A]">
                            <CardContent className="p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-[1rem] border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                                        <Building2 className="w-5 h-5 text-[#F39200]" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Siguiente paso recomendado</p>
                                        <h3 className="text-xl font-black uppercase tracking-tight text-white">Estado del sistema</h3>
                                    </div>
                                </div>
                                <p className="text-sm text-zinc-300 leading-relaxed mb-8">
                                    El siguiente corte operativo recomendado es <span className="font-black text-white uppercase">Estado</span>,
                                    para centralizar salud del backend, base de datos, migraciones y señales básicas de plataforma.
                                </p>
                                <button
                                    type="button"
                                    onClick={() => navigate('/admin-global/estado')}
                                    className="inline-flex items-center rounded-full border border-orange-200/30 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200] hover:bg-orange-500/15 transition-colors"
                                >
                                    Abrir Estado
                                </button>
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </main>
        </div>
    );
};

export default AdminGlobal;
