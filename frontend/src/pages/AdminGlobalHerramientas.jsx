import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    DatabaseZap,
    FileSearch,
    LifeBuoy,
    ShieldAlert,
    Sparkles,
    Wrench
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/card';

const toolGroups = [
    {
        id: 'saneamiento',
        title: 'Saneamiento de datos',
        description: 'Rutinas reproducibles para auditar y sanear incoherencias bajo trazabilidad controlada.',
        icon: DatabaseZap,
        tone: 'border-orange-200 bg-orange-50 text-[#F39200]',
        risk: 'Controlado',
        items: [
            'backend/scripts/audit_data_integrity.py',
            'backend/scripts/sanitize_data_integrity.py',
            'backend/scripts/cleanup_orphaned_bases.py',
        ],
    },
    {
        id: 'diagnostico',
        title: 'Diagnóstico',
        description: 'Scripts de inspección y verificación para revisar estructura, tablas, FKs y estado técnico.',
        icon: FileSearch,
        tone: 'border-blue-200 bg-blue-50 text-[#136191]',
        risk: 'Bajo',
        items: [
            'backend/scripts/inspect_tables.py',
            'backend/scripts/find_fks.py',
            'backend/scripts/check_empresas.py',
            'backend/scripts/check_bases.py',
            'backend/scripts/search_data.py',
        ],
    },
    {
        id: 'mantenimiento',
        title: 'Mantenimiento técnico',
        description: 'Migraciones y utilidades de soporte legado que deben ejecutarse solo bajo criterio técnico explícito.',
        icon: Wrench,
        tone: 'border-zinc-200 bg-zinc-100 text-zinc-700',
        risk: 'Medio',
        items: [
            'backend/scripts/migrate_dump.py',
            'backend/scripts/migrate_postgres.py',
            'backend/scripts/sync_db.py',
            'backend/scripts/update_bases_empresa.py',
        ],
    },
    {
        id: 'soporte',
        title: 'Soporte interno',
        description: 'Herramientas auxiliares para soporte, usuarios técnicos y resolución de incidencias específicas.',
        icon: LifeBuoy,
        tone: 'border-emerald-200 bg-emerald-50 text-emerald-600',
        risk: 'Bajo',
        items: [
            'backend/scripts/manage_superuser.py',
            'backend/scripts/reset_user_password.py',
            'backend/scripts/debug_login.py',
            'backend/scripts/get_token.py',
        ],
    },
];

const riskTone = (risk) => {
    switch (risk) {
        case 'Controlado':
            return 'border-orange-200 bg-orange-50 text-[#F39200]';
        case 'Medio':
            return 'border-red-200 bg-red-50 text-red-600';
        default:
            return 'border-blue-200 bg-blue-50 text-[#136191]';
    }
};

const AdminGlobalHerramientas = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const isSuperadmin = user?.rol?.toLowerCase() === 'superadministrador';

    if (!isSuperadmin) {
        return (
            <div className="h-full min-h-0 bg-[#F2F4F7] p-12">
                <div className="max-w-4xl mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver
                    </button>
                    <div className="bg-white border border-red-100 rounded-[2rem] p-10 shadow-sm">
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-red-400 mb-4">Acceso restringido</p>
                        <h1 className="text-3xl font-black uppercase tracking-tight text-zinc-900 mb-3">Herramientas</h1>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full min-h-0 flex flex-col bg-[#F2F4F7]">
            <main className="flex-1 overflow-y-auto p-12 custom-scrollbar">
                <div className="w-full max-w-[1500px] mx-auto">
                    <button onClick={() => navigate('/admin-global')} className="flex items-center gap-2 text-zinc-500 hover:text-[#F39200] font-bold uppercase text-xs mb-8 transition-colors">
                        <ArrowLeft className="w-4 h-4" /> Volver a Administración Global
                    </button>

                    <header className="mb-10">
                        <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#F39200] mb-4">Soporte y control técnico</p>
                        <h1 className="text-4xl font-black tracking-tight text-[#1A1A1A] sm:text-5xl uppercase">Herramientas</h1>
                        <p className="mt-4 max-w-4xl text-sm text-zinc-600 leading-relaxed">
                            Catálogo controlado de scripts y utilidades internas existentes. Esta vista no ejecuta acciones:
                            ordena, clasifica y deja explícito qué herramientas son seguras, cuáles requieren criterio técnico y cuáles
                            deben seguir fuera de la operación cotidiana.
                        </p>
                    </header>

                    <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
                        <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400">Grupos</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-zinc-900">{toolGroups.length}</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-orange-200 bg-orange-50/70 px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">Saneamiento</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-[#F39200]">3</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-blue-200 bg-blue-50/70 px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#136191]">Diagnóstico</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-[#136191]">5</p>
                        </div>
                        <div className="rounded-[1.75rem] border border-red-200 bg-red-50/70 px-5 py-5">
                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500">Con criterio técnico</p>
                            <p className="mt-3 text-3xl font-black tracking-tight text-red-600">4</p>
                        </div>
                    </section>

                    <section className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
                        {toolGroups.map((group) => {
                            const Icon = group.icon;
                            return (
                                <Card key={group.id} className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-white">
                                    <CardContent className="p-8">
                                        <div className="flex items-start justify-between gap-4 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-11 h-11 rounded-2xl border flex items-center justify-center ${group.tone}`}>
                                                    <Icon className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Grupo</p>
                                                    <h2 className="text-xl font-black uppercase tracking-tight text-zinc-900">{group.title}</h2>
                                                </div>
                                            </div>
                                            <div className={`inline-flex items-center rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-[0.18em] ${riskTone(group.risk)}`}>
                                                Riesgo {group.risk}
                                            </div>
                                        </div>
                                        <p className="text-sm text-zinc-600 leading-relaxed mb-5">{group.description}</p>
                                        <div className="space-y-3">
                                            {group.items.map((item) => (
                                                <div key={item} className="rounded-2xl border border-zinc-200 bg-zinc-50/70 px-4 py-3">
                                                    <div className="font-mono text-xs text-zinc-700 break-all">{item}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </section>

                    <Card className="border-none rounded-[2rem] shadow-[0_10px_35px_rgba(0,0,0,0.05)] overflow-hidden bg-[#1A1A1A]">
                        <CardContent className="p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-11 h-11 rounded-2xl border border-zinc-700 bg-zinc-800 flex items-center justify-center">
                                    <ShieldAlert className="w-5 h-5 text-[#F39200]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Regla operativa</p>
                                    <h2 className="text-xl font-black uppercase tracking-tight text-white">Sin ejecución directa desde UI</h2>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-4 text-sm text-zinc-300 leading-relaxed">
                                    Las herramientas de saneamiento y migración deben seguir ejecutándose de forma trazada, no como botones opacos de producción.
                                </div>
                                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-4 text-sm text-zinc-300 leading-relaxed">
                                    Las acciones de mayor riesgo requieren validación explícita, documentación y preferiblemente TASK dedicada antes de operarlas.
                                </div>
                                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-4 text-sm text-zinc-300 leading-relaxed">
                                    El siguiente crecimiento lógico es exponer solo herramientas de lectura o wrappers seguros, nunca scripts heredados sin control.
                                </div>
                            </div>
                            <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-orange-200/30 bg-orange-500/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200]">
                                <Sparkles className="w-4 h-4" /> Herramientas clasificadas
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
};

export default AdminGlobalHerramientas;
