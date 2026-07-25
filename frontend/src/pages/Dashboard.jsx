import { useContext, useEffect, useRef, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
    Calculator,
    Building2,
    ShieldCheck,
    Wrench,
    ArrowUpRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
const MotionDiv = motion.div;
import { Card, CardContent } from '../components/ui/card';
import { APP_VERSION_LABEL } from '../config/appVersion';

const Dashboard = () => {
    const { user } = useContext(AuthContext);
    const navigate = useNavigate();
    const cardsViewportRef = useRef(null);
    const moduleCardRefs = useRef({});
    const [activeModuleId, setActiveModuleId] = useState('unit-prices');

    const modules = [
        {
            id: 'unit-prices',
            title: 'Precios Unitarios',
            description: 'Gestión de APUs, Presupuestos y Catálogos de Insumos.',
            icon: <Calculator className="w-8 h-8 text-[#F39200]" />,
            path: '/precios-unitarios',
            color: 'bg-orange-50',
            borderColor: 'border-orange-200'
        },
        {
            id: 'projects',
            title: 'Proyectos',
            description: 'Control de Portafolio, Ejecución de Obra y Cronogramas.',
            icon: <Building2 className="w-8 h-8 text-[#136191]" />,
            path: '/proyectos',
            color: 'bg-blue-50',
            borderColor: 'border-blue-200'
        },
        {
            id: 'services',
            title: 'Otros Servicios',
            description: 'Maquinaria, Logística y Servicios Complementarios.',
            icon: <Wrench className="w-8 h-8 text-zinc-600" />,
            path: '/servicios',
            color: 'bg-zinc-50',
            borderColor: 'border-zinc-200'
        }
    ];

    if (user?.rol?.toLowerCase() === 'superadministrador') {
        modules.push({
            id: 'admin-global',
            title: 'Administración Global',
            description: 'Gobierno de plataforma, comunicados, auditoría y herramientas del sistema.',
            icon: <ShieldCheck className="w-8 h-8 text-violet-700" />,
            path: '/admin-global',
            color: 'bg-violet-50',
            borderColor: 'border-violet-200'
        });
    }

    useEffect(() => {
        if (!modules.some((module) => module.id === activeModuleId)) {
            setActiveModuleId(modules[0]?.id || '');
        }
    }, [activeModuleId, modules]);

    useEffect(() => {
        const viewport = cardsViewportRef.current;
        if (!viewport) return undefined;

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntries = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((left, right) => right.intersectionRatio - left.intersectionRatio);

                if (visibleEntries.length > 0) {
                    const nextActiveId = visibleEntries[0].target.getAttribute('data-module-id');
                    if (nextActiveId) setActiveModuleId(nextActiveId);
                }
            },
            {
                root: viewport,
                threshold: [0.35, 0.6, 0.85],
            }
        );

        modules.forEach((module) => {
            const element = moduleCardRefs.current[module.id];
            if (element) observer.observe(element);
        });

        return () => observer.disconnect();
    }, [modules]);

    const handleIndicatorClick = (moduleId) => {
        const target = moduleCardRefs.current[moduleId];
        if (!target) return;
        setActiveModuleId(moduleId);
        target.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    };

    return (
        <div className="h-full min-h-0 overflow-hidden bg-[#F2F4F7]">
            <main className="flex h-full flex-col overflow-hidden px-[var(--app-page-gutter-inline,1rem)] py-[var(--app-page-gutter-block,1rem)]">
                <div className="flex h-full min-h-0 w-full max-w-[1480px] flex-1 flex-col overflow-hidden self-center">
                    <header className="mb-[var(--app-section-gap,1rem)] flex-shrink-0">
                        <MotionDiv
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                        >
                            <h2 className="text-3xl font-black tracking-tight text-[#1A1A1A] lg:text-4xl 2xl:text-5xl">
                                Consola de <span className="text-[#F39200]">Operaciones</span>
                            </h2>
                            <div className="flex items-center gap-4 mt-4">
                                <div className="h-1.5 w-24 bg-[#F39200] rounded-full" />
                                <p className="text-zinc-500 font-bold uppercase tracking-[0.2em] text-xs">
                                    Acceso rápido a módulos principales
                                </p>
                            </div>
                        </MotionDiv>
                    </header>

                    <section ref={cardsViewportRef} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-2 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-4 pb-4 md:grid-cols-3 2xl:gap-8 2xl:pb-8">
                            {modules.map((module, index) => (
                                <div
                                    key={module.id}
                                    ref={(element) => {
                                        if (element) moduleCardRefs.current[module.id] = element;
                                    }}
                                    data-module-id={module.id}
                                    onMouseEnter={() => setActiveModuleId(module.id)}
                                    onFocus={() => setActiveModuleId(module.id)}
                                >
                                    <MotionDiv
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: 0.1 * index }}
                                        whileHover={{ y: -8 }}
                                    >
                                        <Card
                                            onClick={() => navigate(module.path)}
                                            className="group h-full cursor-pointer overflow-hidden rounded-3xl border-none bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-[0_20px_50px_rgba(0,0,0,0.08)] flex flex-col"
                                        >
                                            <CardContent className="flex h-full flex-col p-6 2xl:p-10">
                                                <div className={`mb-8 flex h-16 w-16 items-center justify-center rounded-2xl border ${module.borderColor} ${module.color} shadow-sm transition-transform duration-300 group-hover:scale-110`}>
                                                    {module.icon}
                                                </div>

                                                <h3 className="mb-3 text-2xl font-black uppercase tracking-tight text-[#1A1A1A] transition-colors group-hover:text-[#F39200]">
                                                    {module.title}
                                                </h3>

                                                <p className="mb-10 text-sm font-medium leading-relaxed text-zinc-500">
                                                    {module.description}
                                                </p>

                                                <div className="mt-auto flex items-center justify-between border-t border-zinc-50 pt-6">
                                                    <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400 transition-colors group-hover:text-[#F39200]">
                                                        Ingresar al módulo
                                                    </span>
                                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-100 bg-zinc-50 transition-all group-hover:bg-[#F39200]">
                                                        <ArrowUpRight className="h-5 w-5 text-zinc-400 transition-colors group-hover:text-white" />
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </MotionDiv>
                                </div>
                            ))}
                        </div>
                    </section>

                    <footer data-dashboard-footer className="flex flex-shrink-0 flex-col items-center justify-between gap-1 border-t border-zinc-200 pt-2 md:flex-row md:gap-3 2xl:pt-4">
                        <div className="flex min-w-0 flex-wrap items-center justify-center gap-x-4 gap-y-1 md:justify-start 2xl:gap-x-6">
                            <p data-dashboard-version className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 md:text-left md:tracking-[0.3em]">
                                GIPROY NETWORK {APP_VERSION_LABEL} // 2026
                            </p>
                            <div aria-hidden="true" className="hidden h-1 w-1 rounded-full bg-zinc-300 sm:block" />
                            <p className="text-center text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 md:text-left md:tracking-[0.3em]">Security Layer Active</p>
                        </div>
                        <div aria-label="Navegacion entre modulos" className="flex items-center gap-1" role="group">
                            {modules.map((module) => {
                                const isActive = module.id === activeModuleId;
                                return (
                                    <button
                                        key={`${module.id}-indicator`}
                                        type="button"
                                        onClick={() => handleIndicatorClick(module.id)}
                                        className="group flex h-11 w-14 touch-manipulation items-center justify-center rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] focus-visible:ring-offset-2"
                                        title={`Ir a ${module.title}`}
                                        aria-label={`Ir a ${module.title}`}
                                        aria-pressed={isActive}
                                    >
                                        <span
                                            aria-hidden="true"
                                            className={`h-1 rounded-full transition-all duration-200 ${
                                                isActive
                                                    ? 'w-12 bg-[#F39200]'
                                                    : 'w-10 bg-zinc-200 group-hover:bg-zinc-300'
                                            }`}
                                        />
                                    </button>
                                );
                            })}
                        </div>
                    </footer>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;
