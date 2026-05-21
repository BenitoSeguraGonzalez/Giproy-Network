import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    ArrowUpRight,
    MessageSquareMore,
    Store,
    Truck,
    BadgeCheck,
    BriefcaseBusiness
} from 'lucide-react';
import { Card, CardContent } from '../components/ui/card';
import MotionScrollbar from '../components/ui/MotionScrollbar';

const PlaceholderPage = ({ title }) => {
    const navigate = useNavigate();
    return (
        <div className="min-h-screen bg-[#F2F4F7]">
            <div className="flex min-h-screen flex-col">
                <div className="flex items-center justify-between border-b border-zinc-200 bg-white/85 px-6 py-4 backdrop-blur-md md:px-8">
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/')} className="rounded-xl p-2 transition-colors hover:bg-zinc-100">
                            <ArrowLeft className="h-5 w-5 text-zinc-500" />
                        </button>
                        <div>
                            <h1 className="text-xl font-black uppercase tracking-tight text-zinc-900">{title}</h1>
                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F39200]">
                                Otros servicios
                            </p>
                        </div>
                    </div>
                </div>
                <div className="p-6 md:p-10 xl:p-12">
                    <div className="mx-auto max-w-[1480px] rounded-3xl border border-zinc-200 bg-white p-12 shadow-sm">
                        <p className="text-zinc-500 font-medium">Módulo en desarrollo...</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const PreciosUnitarios = () => <PlaceholderPage title="Precios Unitarios" />;

const servicePlaceholders = [
    {
        id: 'comunidad',
        title: 'Comunidad',
        description: 'Espacio base para interacción, novedades y servicios compartidos entre empresas y usuarios.',
        icon: MessageSquareMore,
        iconTone: 'text-[#136191]',
        iconBg: 'bg-blue-50 border-blue-200',
        accent: 'text-[#136191]',
        status: 'Entrar a comunidad',
        progressionStage: 'active',
        path: '/servicios/comunidad'
    },
    {
        id: 'tienda',
        title: 'Tienda',
        description: 'Catálogo comercial interno para bases, APUs, proyectos, licencias y addons con trazabilidad de origen.',
        icon: Store,
        iconTone: 'text-[#F39200]',
        iconBg: 'bg-orange-50 border-orange-200',
        accent: 'text-[#F39200]',
        status: 'Marketplace activo',
        progressionStage: 'active',
        path: '/marketplace'
    },
    {
        id: 'envios-transferencias',
        title: 'Envíos y Transferencias',
        description: 'Base visual para logística, envíos internos, traspasos y movimientos entre contextos operativos.',
        icon: Truck,
        iconTone: 'text-emerald-700',
        iconBg: 'bg-emerald-50 border-emerald-200',
        accent: 'text-emerald-700',
        status: 'En desarrollo',
        progressionStage: 'active',
        path: null
    },
    {
        id: 'bolsa-trabajo',
        title: 'Bolsa de Trabajo',
        description: 'Placeholder específico para vacantes, postulaciones y futuros flujos laborales sin mezclarlo con Comunidad.',
        icon: BriefcaseBusiness,
        iconTone: 'text-violet-700',
        iconBg: 'bg-violet-50 border-violet-200',
        accent: 'text-violet-700',
        status: 'En desarrollo',
        progressionStage: 'planned',
        path: null
    },
    {
        id: 'certificaciones',
        title: 'Certificaciones',
        description: 'Placeholder específico para certificados, validaciones y futuras rutas de acreditación sin mezclarlo con otros servicios.',
        icon: BadgeCheck,
        iconTone: 'text-sky-700',
        iconBg: 'bg-sky-50 border-sky-200',
        accent: 'text-sky-700',
        status: 'En desarrollo',
        progressionStage: 'planned',
        path: null
    }
];

export const OtrosServicios = () => {
    const navigate = useNavigate();
    const servicesScrollRef = useRef(null);
    const orderedServicePlaceholders = [...servicePlaceholders].sort((a, b) => {
        const stageWeight = {
            active: 0,
            planned: 1
        };
        const aWeight = stageWeight[a.progressionStage] ?? 99;
        const bWeight = stageWeight[b.progressionStage] ?? 99;
        if (aWeight !== bWeight) {
            return aWeight - bWeight;
        }
        return servicePlaceholders.findIndex((item) => item.id === a.id) - servicePlaceholders.findIndex((item) => item.id === b.id);
    });
    const renderServiceCard = (item, index) => {
        const Icon = item.icon;
        const eyebrow = item.path ? 'Submódulo activo' : 'Próximamente';
        const cta = item.path ? 'Abrir submódulo' : 'Estado actual';
        return (
            <Card
                key={item.id}
                onClick={() => item.path && navigate(item.path)}
                className={`group w-full overflow-hidden rounded-[1.35rem] border border-zinc-100 bg-white shadow-[0_12px_30px_rgba(15,23,42,0.04)] transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-zinc-200 ${item.path ? 'cursor-pointer' : ''}`}
            >
                <CardContent className="flex h-full min-h-[172px] flex-col p-4">
                    <div className="flex items-start gap-3">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.9rem] border ${item.iconBg} shadow-sm transition-transform duration-200 group-hover:scale-105`}>
                            <Icon className={`h-5 w-5 ${item.iconTone}`} />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                {eyebrow}
                            </p>
                            <h2 className="mt-1.5 text-[1rem] font-black uppercase leading-none tracking-tight text-[#1A1A1A] xl:text-[1.08rem]">
                                {item.title}
                            </h2>
                        </div>
                    </div>

                    <p className="mt-3 max-w-[38ch] text-[0.78rem] font-medium leading-relaxed text-zinc-600">
                        {item.description}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3">
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
                            {cta}
                        </span>
                        <div className="flex h-9 w-9 items-center justify-center rounded-[0.9rem] border border-[#ececec] bg-[#ededed] text-zinc-500 shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff] transition-[color,filter,box-shadow] duration-200 group-hover:text-[#136191] group-active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff]">
                            <ArrowUpRight className="h-4 w-4" />
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    };

    return (
        <div className="h-screen overflow-hidden bg-[#F2F4F7]">
            <div className="mx-auto flex h-screen max-w-[1380px] flex-col gap-5 overflow-hidden px-4 py-5 sm:px-5 md:px-8 md:py-6 xl:px-10">
                <header className="sticky top-0 z-20 rounded-[2rem] border border-zinc-200 bg-white px-5 py-4 shadow-[0_10px_35px_rgba(0,0,0,0.04)] md:px-6 xl:px-7">
                    <div className="flex min-w-0 items-center gap-4 xl:gap-6">
                        <button
                            type="button"
                            onClick={() => navigate('/')}
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
                            title="Volver"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2 xl:gap-2.5">
                                <span className="inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500" />
                                <h1 className="truncate text-[1.7rem] font-black uppercase tracking-tight text-zinc-900 xl:text-[1.9rem]">
                                    Otros Servicios
                                </h1>
                                <span className="inline-flex rounded-xl border border-orange-100 bg-orange-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#F39200]">
                                    Servicios
                                </span>
                            </div>
                            <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 xl:text-[11px]">
                                Comunidad, tienda, envíos, certificaciones y bolsa de trabajo
                            </p>
                        </div>
                    </div>
                </header>

                <section className="relative min-h-0 flex-1">
                            <div
                                ref={servicesScrollRef}
                                className="giproy-motion-scrollbar-hide h-full min-h-0 overflow-y-auto overscroll-contain pb-8 pr-7"
                            >
                            <div className="grid content-start gap-3 md:grid-cols-2 xl:grid-cols-3">
                                {orderedServicePlaceholders.map((item, index) => renderServiceCard(item, index))}
                            </div>
                        </div>
                            <MotionScrollbar targetRef={servicesScrollRef} className="right-0" />
                </section>
            </div>
        </div>
    );
};

export const Settings = () => <PlaceholderPage title="Ajustes del Sistema" />;
