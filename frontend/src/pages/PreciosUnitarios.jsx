import { useNavigate } from 'react-router-dom';

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import useMarketplaceOrigin from '../hooks/useMarketplaceOrigin';
import MarketplaceOriginBadgeSet, { getMarketplaceOwnershipTone } from '../components/marketplace/MarketplaceOriginBadgeSet';
import {
    Database,
    LayoutGrid,
    Wrench,
    FileSpreadsheet,
    ArrowLeft,
    ChevronRight
} from 'lucide-react';
const PreciosUnitarios = () => {
    const navigate = useNavigate();
    const { selectedBaseTrabajo } = useContext(AuthContext);
    const activeBaseOrigin = useMarketplaceOrigin('base_trabajo', selectedBaseTrabajo?.id);
    const activeBaseTone = getMarketplaceOwnershipTone(activeBaseOrigin);

    const menuItems = [
        {
            id: 'bases',
            title: 'Bases de Trabajo',
            description: 'Contenedores maestros de configuración regional y técnica.',
            icon: <Database className="w-8 h-8 text-[#F39200]" />,
            path: '/precios-unitarios/bases',
            color: 'bg-orange-50',
            borderColor: 'border-orange-200',
            requiredBase: false
        },
        {
            id: 'subcategorias',
            title: 'Subcategorías',
            description: 'Estructura jerárquica para la organización de recursos.',
            icon: <LayoutGrid className="w-8 h-8 text-[#F39200]" />,
            path: '/precios-unitarios/subcategorias',
            color: 'bg-orange-50',
            borderColor: 'border-orange-200',
            requiredBase: true
        },
        {
            id: 'recursos',
            title: 'Recursos',
            description: 'Catálogo especializado de materiales, mano de obra y equipo.',
            icon: <Wrench className="w-8 h-8 text-[#F39200]" />,
            path: '/recursos',
            color: 'bg-orange-50',
            borderColor: 'border-orange-200',
            requiredBase: true
        },
        {
            id: 'apus',
            title: 'Análisis de Precios Unitarios (APU)',
            description: 'Composición de precios unitarios dinámicos por rubros.',
            icon: <FileSpreadsheet className="w-8 h-8 text-[#F39200]" />,
            path: '/apus',
            color: 'bg-orange-50',
            borderColor: 'border-orange-200',
            requiredBase: true
        }
    ];

    return (
        <div className="h-full min-h-0 flex flex-col bg-[#F8FAFC] overflow-hidden">
            <div className="z-40 flex flex-shrink-0 flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white/80 px-4 py-3 backdrop-blur-md lg:px-6 2xl:px-8 2xl:py-4">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/dashboard')} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors">
                        <ArrowLeft className="w-5 h-5 text-zinc-500" />
                    </button>
                    <div>
                        <h1 className="text-xl font-black uppercase text-zinc-900 tracking-tight">Precios Unitarios</h1>
                        <p className="text-[10px] font-bold text-[#F39200] uppercase tracking-widest">Módulo de Ingeniería • GIPROY</p>
                    </div>
                </div>

                {selectedBaseTrabajo && (
                    <div className="flex max-w-full items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-2 shadow-xl shadow-black/10 transition-all hover:scale-[1.02] 2xl:px-6">
                        <Database className="w-4 h-4 text-[#F39200] animate-pulse" />
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 italic">Base Técnica Activa</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                <MarketplaceOriginBadgeSet
                                    origin={activeBaseOrigin}
                                    loading={activeBaseOrigin.loading}
                                    mode="tooltip"
                                    label="Origen de la base"
                                />
                                <span className="max-w-[44vw] truncate text-[10px] font-black uppercase leading-tight tracking-widest text-zinc-100">{selectedBaseTrabajo.nombre}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <main className="custom-scrollbar flex-1 overflow-y-auto p-4 lg:p-6 2xl:p-12">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:gap-8">
                    {menuItems.map((item) => {
                        const isDisabled = item.requiredBase && !selectedBaseTrabajo;

                        return (
                            <div
                                key={item.id}
                                onClick={() => !isDisabled && navigate(item.path)}
                                className={`group relative min-h-[250px] overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white p-5 transition-all duration-500 lg:p-6 2xl:min-h-0 2xl:rounded-[2.5rem] 2xl:p-10
                                    ${isDisabled
                                        ? 'opacity-60 cursor-not-allowed grayscale-[0.5]'
                                        : 'cursor-pointer hover:border-zinc-300 hover:shadow-2xl hover:shadow-black/5 active:scale-[0.98]'}`}
                            >
                                <div className={`mb-4 inline-flex rounded-2xl border border-zinc-100 p-3 transition-transform duration-500 group-hover:scale-105 2xl:mb-6 2xl:rounded-3xl 2xl:p-4 ${item.color}`}>
                                    {item.icon}
                                </div>

                                <h3 className="mb-3 text-lg font-black uppercase tracking-tight text-zinc-900 2xl:text-2xl">
                                    {item.title}
                                </h3>

                                <p className="mb-8 max-w-[280px] pr-12 font-medium leading-relaxed text-zinc-500">
                                    {item.description}
                                </p>

                                {isDisabled && (
                                    <div className="absolute top-6 right-6 flex items-center gap-1.5 px-3 py-1 bg-zinc-100 text-zinc-600 rounded-full border border-zinc-200">
                                        <Database className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase tracking-widest">Base Requerida</span>
                                    </div>
                                )}

                                <div className="absolute bottom-5 right-5 flex items-center 2xl:bottom-10 2xl:right-10">
                                    <div className={`p-3 rounded-full transition-all duration-500 ${isDisabled ? 'bg-zinc-50 text-zinc-300' : 'bg-white text-zinc-300 border border-zinc-200 group-hover:text-[#F39200] group-hover:border-amber-200 group-hover:bg-amber-50'}`}>
                                        <ChevronRight className="w-5 h-5" />
                                    </div>
                                </div>

                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default PreciosUnitarios;
