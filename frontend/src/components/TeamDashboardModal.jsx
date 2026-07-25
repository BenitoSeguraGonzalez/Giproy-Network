import React, { useMemo, useState, useContext } from 'react';
import { 
    Users, 
    Layers, 
    AlertCircle, 
    CheckCircle2, 
    ChevronRight,
    Briefcase,
    LayoutDashboard,
    ArrowRight,
    Search,
    UserCircle2,
    ShieldCheck,
    Calendar,
    ArrowLeft
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { AppModalShell, AppModalHeader, AppModalBody, AppModalFooter } from './ui/app-modal';
import { LiquidButton } from './ui/liquid-button';
import { AuthContext } from '../context/AuthContext';
import { proyectosApi } from '../api/proyectos';
import { appAlert } from '../utils/appDialog';

const AssignmentNode = ({ item, onAssign, onUserClick, level = 0 }) => {
    const isUnassigned = item.assigned_users?.length === 0;
    const isRoot = item.tipo === 'root';
    const isPerson = item.tipo === 'person';

    if (isPerson) {
        return (
            <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="relative ml-5 mb-3 last:mb-6 md:ml-12"
            >
                {/* Conector tipo repisa */}
                <div className="absolute left-[-1.5rem] top-[-1rem] bottom-1/2 w-6 rounded-bl-xl border-b border-l border-zinc-100" />
                
                <button
                    type="button"
                    onClick={() => {
                        if (onUserClick) onUserClick(item);
                    }}
                    aria-label={`Ver resumen de ${item.nombre}`}
                    className="group/person flex min-h-11 w-full items-center gap-3 rounded-2xl border border-zinc-100 bg-white p-3 text-left shadow-sm transition-all hover:border-[#F39200]/40 hover:shadow-md md:gap-4 md:pr-6"
                >
                    <div className="w-10 h-10 rounded-xl bg-[#1A1A1A] text-[#F39200] flex items-center justify-center text-xs font-black shadow-inner group-hover/person:bg-[#F39200] group-hover/person:text-white transition-colors">
                        {item.nombre?.charAt(0)}
                    </div>
                    <div className="flex min-w-0 flex-col">
                        <span className="truncate text-[11px] font-black uppercase tracking-tight text-zinc-800 leading-none mb-1">
                            {item.nombre}
                        </span>
                        <span className="text-[8px] font-bold uppercase tracking-[0.15em] text-zinc-400">
                            {item.profesion || 'Colaborador Técnico'}
                        </span>
                    </div>
                    <div className="ml-auto flex items-center gap-2">
                        <span className="hidden text-[8px] font-black uppercase tracking-widest text-[#F39200] opacity-0 transition-opacity group-hover/person:opacity-100 md:inline">Ver Resumen</span>
                        <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                    </div>
                </button>
            </motion.div>
        );
    }

    return (
        <div className="relative">
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: level * 0.05 }}
                className={`group relative mb-4 flex flex-col items-stretch justify-between gap-4 rounded-2xl border p-4 transition-all md:flex-row md:items-center md:rounded-[2rem] md:p-5 ${
                    isRoot
                    ? 'bg-zinc-900 border-zinc-800 text-white shadow-2xl ring-1 ring-white/5'
                    : isUnassigned 
                    ? 'bg-white border-orange-100/30 hover:border-orange-200 shadow-sm' 
                    : 'bg-[#F8F9FA]/50 border-zinc-100/50 hover:bg-white hover:shadow-lg shadow-sm'
                }`}
            >
                {/* Conectores Visuales */}
                {level > 0 && (
                    <div 
                        className="absolute left-[-1.5rem] top-1/2 w-6 h-[2px] bg-zinc-200" 
                    />
                )}

                <div className="flex min-w-0 items-center gap-3 md:gap-6">
                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-all duration-500 md:h-14 md:w-14 ${
                        isRoot 
                        ? 'bg-[#F39200] text-white shadow-[0_0_25px_rgba(243,146,0,0.4)] rotate-6 group-hover:rotate-12' 
                        : isUnassigned 
                        ? 'bg-orange-50 text-orange-400 group-hover:scale-110' 
                        : 'bg-zinc-100 text-zinc-400 group-hover:text-white group-hover:bg-zinc-900 group-hover:rotate-3'
                    }`}>
                        {isRoot ? <Briefcase className="w-7 h-7" /> : <Layers className="w-6 h-6" />}
                    </div>

                    <div className="min-w-0">
                        <div className="mb-1.5 flex flex-wrap items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] md:gap-3 md:tracking-[0.2em]">
                            <span className={isRoot ? 'text-orange-400' : 'text-[#F39200]'}>
                                {item.codigo}
                            </span>
                            {!isRoot && (
                                <div className={`px-2 py-0.5 rounded-full text-[8px] flex items-center gap-1.5 ${
                                    isUnassigned 
                                    ? 'bg-orange-100/50 text-orange-500' 
                                    : 'bg-green-100/50 text-green-600'
                                }`}>
                                    {isUnassigned ? "CAPÍTULO VACANTE" : "CAPÍTULO ASIGNADO"}
                                </div>
                            )}
                        </div>
                        <h5 className={`break-words text-sm font-black uppercase tracking-tight leading-tight md:text-base ${isRoot ? 'text-white' : 'text-zinc-900'}`}>
                            {item.nombre}
                        </h5>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 md:gap-4">
                    <LiquidButton 
                        onClick={() => onAssign(item)}
                        className={`!h-11 flex-1 !px-4 text-[9px] font-black uppercase tracking-[0.16em] rounded-2xl shadow-xl transition-all active:scale-95 group/btn md:flex-none md:!px-6 md:tracking-[0.2em] ${
                            isRoot ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'
                        }`}
                    >
                        <UserCircle2 className="w-4 h-4 mr-2" />
                        Gestionar Personal
                    </LiquidButton>
                    <ChevronRight className={`w-5 h-5 transition-all group-hover:translate-x-1 ${isRoot ? 'text-zinc-700' : 'text-zinc-200'}`} />
                </div>
            </motion.div>

            {/* Hijos: EDT o Personas */}
            {item.children && item.children.length > 0 && (
                <div className="relative ml-3 md:ml-10">
                    {/* Línea conectora vertical mejorada */}
                    <div className="absolute left-[-1.5rem] top-0 bottom-4 w-[2px] bg-zinc-100 rounded-full" />
                    {item.children.map((child, index) => (
                        <AssignmentNode 
                            key={child.id || `person-${index}`} 
                            item={child} 
                            onAssign={onAssign} 
                            onUserClick={onUserClick}
                            level={level + 1} 
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const TeamDashboardModal = ({ isOpen, onClose, project, dashboardData, onAssign }) => {
    const { selectedEmpresa, user } = useContext(AuthContext);
    const [selectedUserSummary, setSelectedUserSummary] = useState(null);
    const [loadingSummary, setLoadingSummary] = useState(false);

    // Transformar datos planos a árbol e inyectar usuarios como nodos
    const treeData = useMemo(() => {
        if (!dashboardData) return [];
        const map = {};
        const roots = [];

        // 1. Crear mapa inicial de nodos EDT/Root
        dashboardData.forEach(item => {
            map[item.id] = { ...item, children: [] };
        });

        // 2. Inyectar usuarios asignados como nodos hijos reales
        dashboardData.forEach(item => {
            const node = map[item.id];
            if (item.assigned_users && item.assigned_users.length > 0) {
                item.assigned_users.forEach(user => {
                    node.children.push({
                        ...user,
                        id: `user-${user.id}-${item.id}`,
                        real_user_id: user.id, // ID real para el resumen
                        nombre: user.nombre_completo,
                        tipo: 'person',
                        children: []
                    });
                });
            }
        });

        // 3. Montar la jerarquía EDT
        dashboardData.forEach(item => {
            const node = map[item.id];
            if (item.parent_id === null || !map[item.parent_id]) {
                if (item.tipo === 'root' || !map[item.parent_id]) {
                    roots.push(node);
                }
            } else {
                map[item.parent_id].children.push(node);
            }
        });

        // Asegurar que el nodo root esté al principio
        return roots.sort((a, b) => (a.tipo === 'root' ? -1 : b.tipo === 'root' ? 1 : 0));
    }, [dashboardData]);

    const handleUserClick = async (personNode) => {
        if (typeof proyectosApi.getUserSummary !== 'function') {
            return;
        }
        
        setLoadingSummary(true);
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const summary = await proyectosApi.getUserSummary(project.id, personNode.real_user_id, empId);
            setSelectedUserSummary(summary);
        } catch (error) {
            globalThis.reportClientError?.("Error al cargar resumen de usuario:", error);
            const errorMsg = error.response?.data?.detail || error.message;
            if (errorMsg === "Not Found" || error.response?.status === 404) {
                appAlert("El servidor no encuentra la información solicitada. Por favor, asegúrate de que los servicios estén activos.");
            } else {
                appAlert(`Error al cargar el resumen: ${errorMsg}`);
            }
        } finally {
            setLoadingSummary(false);
        }
    };

    if (!dashboardData) return null;

    return (
        <AppModalShell isOpen={isOpen} onClose={onClose} size="3xl">
            <AppModalHeader onClose={onClose}>
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1A1A1A] flex items-center justify-center text-[#F39200] border border-white/10 shadow-xl">
                        <LayoutDashboard className="w-6 h-6" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-base font-black uppercase tracking-tight md:text-xl">Consola de <span className="text-[#F39200]">Asignaciones</span></h3>
                        <p className="flex min-w-0 items-center gap-2 text-[9px] font-bold uppercase tracking-wider text-zinc-500 md:text-[10px] md:tracking-widest">
                            PROYECTO: <span className="text-zinc-600 font-black">{project?.nombre}</span>
                        </p>
                    </div>
                </div>
            </AppModalHeader>

            <AppModalBody className="!p-0 !overflow-hidden bg-[#F8F9FB]">
            <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#F8F9FB]">
                {/* Mapa Jerárquico */}
                <div data-team-dashboard-viewport className="relative min-h-0 flex-1 overflow-y-auto overscroll-contain bg-[#FBFCFE] p-4 custom-scrollbar [touch-action:pan-y] md:p-6 xl:p-10">
                    {loadingSummary && (
                        <div className="absolute inset-0 z-[100] bg-white/60 backdrop-blur-sm flex items-center justify-center rounded-[3rem]">
                            <div className="flex flex-col items-center gap-4">
                                <div className="w-12 h-12 border-4 border-zinc-100 border-t-[#F39200] rounded-full animate-spin" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-[#F39200]">Consultando responsabilidades...</p>
                            </div>
                        </div>
                    )}
                    <div className="mx-auto max-w-5xl">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-4 md:mb-8 md:pb-5">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-zinc-100 flex items-center justify-center text-zinc-400">
                                    <Search className="w-4 h-4" />
                                </div>
                                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-400">
                                    Mapa de Gerenciamiento
                                </h4>
                            </div>

                            <div className="flex items-center gap-2 md:gap-4">
                                <div className="flex min-h-11 items-center gap-2 rounded-full border border-zinc-100 bg-white px-4 py-2 shadow-sm">
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.4)]" />
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">OK</span>
                                </div>
                                <div className="flex min-h-11 items-center gap-2 rounded-full border border-zinc-100 bg-white px-4 py-2 shadow-sm">
                                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.4)]" />
                                    <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">FALTA</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-2">
                            {treeData.length > 0 ? treeData.map(node => (
                                <AssignmentNode 
                                    key={node.id || 'root'} 
                                    item={node} 
                                    onAssign={onAssign} 
                                    onUserClick={handleUserClick}
                                />
                            )) : (
                                <div className="py-20 text-center flex flex-col items-center gap-4 border-3 border-dashed border-zinc-100 rounded-[3rem] bg-white/50">
                                    <Layers className="w-12 h-12 text-zinc-200" />
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-300">Cargando estructura del proyecto...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Overlay de Resumen de Usuario */}
                <AnimatePresence>
                    {selectedUserSummary && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="absolute inset-0 z-50 bg-[#F8F9FB] flex flex-col"
                        >
                            <div data-team-summary-viewport className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 custom-scrollbar [touch-action:pan-y] md:p-8 xl:p-10">
                                <div className="max-w-4xl mx-auto">
                                    <button 
                                        onClick={() => setSelectedUserSummary(null)}
                                        className="group mb-6 flex min-h-11 items-center gap-2 text-zinc-500 transition-colors hover:text-zinc-900 md:mb-10"
                                    >
                                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Volver al Mapa</span>
                                    </button>

                                    <div className="mb-8 flex items-start justify-between md:mb-12">
                                        <div className="flex min-w-0 flex-col gap-4 md:flex-row md:items-center md:gap-8">
                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border-4 border-white bg-[#1A1A1A] text-3xl font-black text-[#F39200] shadow-2xl md:h-24 md:w-24 md:rounded-[2.5rem] md:text-4xl">
                                                {selectedUserSummary.nombre?.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <h2 className="mb-2 break-words text-2xl font-black uppercase tracking-tight md:text-4xl md:tracking-tighter">{selectedUserSummary.nombre}</h2>
                                                <div className="flex flex-wrap items-center gap-2 md:gap-4">
                                                    <span className="bg-orange-100 text-[#F39200] px-4 py-1.5 rounded-2xl text-[10px] font-black tracking-widest border border-orange-200">
                                                        {selectedUserSummary.cargo}
                                                    </span>
                                                    <span className="text-zinc-400 font-bold text-xs">{selectedUserSummary.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm md:rounded-[3rem] md:p-8">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
                                                <ShieldCheck className="w-5 h-5 text-[#F39200]" />
                                                Ámbito de Responsabilidad
                                            </h4>
                                            
                                            <div className="space-y-4">
                                                {selectedUserSummary.items?.map((item, idx) => (
                                                    <div key={idx} className="p-5 rounded-3xl bg-zinc-50 border border-zinc-100 flex items-center justify-between group hover:bg-white hover:border-orange-100 transition-all">
                                                        <div className="flex items-center gap-4">
                                                            <div className="h-10 w-10 rounded-xl bg-white border border-zinc-100 flex items-center justify-center text-[#F39200]">
                                                                <Briefcase className="w-5 h-5" />
                                                            </div>
                                                            <div>
                                                                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-0.5">Módulo: {item.modulo.replace('_', ' ')}</p>
                                                                <p className="text-xs font-black uppercase tracking-tight text-[#1A1A1A]">{item.edt_nombre}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            {item.es_global ? (
                                                                <span className="px-2 py-1 bg-[#F39200]/10 text-[#F39200] rounded-lg text-[8px] font-black uppercase">GLOBAL</span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-zinc-200/50 text-zinc-500 rounded-lg text-[8px] font-black uppercase">ESTA REV.</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-zinc-100 bg-white p-4 shadow-sm md:rounded-[3rem] md:p-8">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-6 flex items-center gap-2">
                                                <Calendar className="w-5 h-5 text-indigo-500" />
                                                Actividad Reciente
                                            </h4>
                                            <div className="space-y-6">
                                                <div className="relative pl-8">
                                                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-zinc-100 rounded-full" />
                                                    <div className="absolute left-[-4px] top-2 w-[10px] h-[10px] rounded-full bg-indigo-500 border-2 border-white" />
                                                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Última Asignación</p>
                                                    <p className="text-xs font-black text-[#1A1A1A]">
                                                        {selectedUserSummary.items?.length > 0 
                                                            ? new Date(selectedUserSummary.items[0].fecha).toLocaleDateString()
                                                            : 'Sin registros'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
            </AppModalBody>
                {/* Footer */}
                <AppModalFooter variant="flat" className="!justify-between">
                    <div className="hidden min-w-0 items-center gap-3 md:flex">
                        <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-orange-500 border border-orange-100">
                            <Users className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-zinc-800 leading-none mb-1">Guía Operativa</p>
                            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">
                                Haz clic en un usuario para ver su resumen de responsabilidades.
                            </p>
                        </div>
                    </div>
                    <LiquidButton
                        onClick={onClose}
                        className="!h-14 w-full !px-8 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-[#F39200] transition-all active:scale-95 md:w-auto md:!px-12"
                    >
                        Salir del Visor
                    </LiquidButton>
                </AppModalFooter>
        </AppModalShell>
    );
};

export default TeamDashboardModal;
