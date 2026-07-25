import React, { useState, useEffect, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext';
import { proyectosApi } from '../api/proyectos';
import { basesTrabajoApi } from '../api/basesTrabajo';
import { edtApi } from '../api/edt';
import { usuariosApi } from '../api/usuarios';
import { 
    Users, 
    Briefcase, 
    ArrowLeft, 
    Search, 
    UserPlus, 
    X, 
    ShieldCheck, 
    Trash2,
    Building2,
    ChevronRight,
    UserMinus,
    Database,
    Layers
} from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import TeamDashboardModal from '../components/TeamDashboardModal';
import EDTTreeSelector from '../components/ui/EDTTreeSelector';
import ClearSearchField from '../components/ui/ClearSearchField';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { LiquidButton } from '../components/ui/liquid-button';
import { includesNormalized } from '../utils/normalizeSearch';
import { 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableHeader, 
    TableRow 
} from "../components/ui/table";
import { AppModalShell, AppModalHeader, AppModalBody, AppModalFooter } from '../components/ui/app-modal';
import { appAlert, appConfirm } from '../utils/appDialog';
import AnimatedSelect from '../components/ui/AnimatedSelect';

const PROJECT_MANAGER_ENABLE_NEW_LANDING = false;

const ProjectManager = () => {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const normalizedRole = (user?.rol || '').toLowerCase();
    const navigate = useNavigate();
    const [proyectos, setProyectos] = useState([]);
    const [basesMaestras, setBasesMaestras] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeView, setActiveView] = useState('projects'); // projects | bases
    
    // Modal de Asignación
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [targetItem, setTargetItem] = useState(null); // Proyecto o Base
    const [itemType, setItemType] = useState('project'); // project | base
    const [assignedUsers, setAssignedUsers] = useState([]);
    const [loadingAssignments, setLoadingAssignments] = useState(false);
    const [modalSearch, setModalSearch] = useState('');
    const [edtNodes, setEdtNodes] = useState([]);
    const [selectedEdtNode, setSelectedEdtNode] = useState(null); // null = Todo el proyecto

    // Dashboard de Equipo
    const [showDashboardModal, setShowDashboardModal] = useState(false);
    const [dashboardData, setDashboardData] = useState(null);
    const [loadingDashboard, setLoadingDashboard] = useState(false);
    const [dashboardModulo, setDashboardModulo] = useState('todos'); // Filtro del dashboard

    // Estado para nueva lógica de asignación
    const [assignModulo, setAssignModulo] = useState('todos');
    const [assignEsGlobal, setAssignEsGlobal] = useState(false);

    // Helper para estadísticas de asignación
    const assignedStats = useMemo(() => {
        if (!dashboardData) return {};
        const stats = {};
        dashboardData.forEach(item => {
            if (item.id) stats[item.id] = item.assigned_users?.length || 0;
        });
        return stats;
    }, [dashboardData]);

    const checkAccess = () => {
        if (!['administrador', 'superadministrador'].includes(normalizedRole)) {
            appAlert("Acceso restringido. Solo los administradores pueden gestionar personal de proyectos.");
            navigate('/dashboard');
        }
    };

    const fetchData = async () => {
        try {
            setLoading(true);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            
            // Cargar Proyectos (solo raíces)
            const projectsData = await proyectosApi.getAll({ 
                empresa_id: empId,
                solo_raices: true 
            });
            setProyectos(projectsData);

            // Cargar Bases Maestras
            const basesRes = await basesTrabajoApi.getAll({ empresa_id: empId });
            setBasesMaestras(basesRes.data.filter(b => b.tipo === 'Base Maestra'));

            // Cargar Usuarios de la empresa
            const usersData = await usuariosApi.getAll({ empresa_id: empId });
            // Mostrar solo colaboradores (rol 'usuario') para asignación
            setUsuarios(usersData.filter(u => u.rol === 'usuario'));
            
        } catch (error) {
            globalThis.reportClientError?.("Error cargando datos del gestor:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAccess();
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEmpresa]);

    const fetchAssignments = async (item, type, edtId = null, modulo = 'todos') => {
        setLoadingAssignments(true);
        try {
            const params = { modulo };
            if (edtId) params.edt_id = edtId;

            const data = type === 'project'
                ? await proyectosApi.getAssignedUsers(item.id, params)
                : await basesTrabajoApi.getAssignedUsers(item.id, params);
            setAssignedUsers(data);
        } catch (error) {
            globalThis.reportClientError?.("Error cargando asignados:", error);
        } finally {
            setLoadingAssignments(false);
        }
    };

    const handleOpenAssign = async (item, type = 'project') => {
        setTargetItem(item);
        setItemType(type);
        setSelectedEdtNode(null); // Reset a todo el proyecto
        setEdtNodes([]);
        setAssignModulo('todos');
        setAssignEsGlobal(false);
        setShowAssignModal(true);
        
        // Cargar EDT si es proyecto
        if (type === 'project') {
            try {
                const empId = selectedEmpresa?.id || user?.empresa_id;
                const edtData = await edtApi.getTree(item.id, empId);
                setEdtNodes(edtData || []);
                const dData = await proyectosApi.getAssignmentDashboard(item.id, empId, 'todos');
                setDashboardData(dData);
            } catch (error) {
                globalThis.reportClientError?.("Error cargando EDT o Dashboard:", error);
            }
        }

        await fetchAssignments(item, type, null, 'todos');
    };

    const handleOpenDashboard = async (project, modulo = 'todos') => {
        setTargetItem(project);
        setLoadingDashboard(true);
        setDashboardModulo(modulo);
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const data = await proyectosApi.getAssignmentDashboard(project.id, empId, modulo);
            setDashboardData(data);
            setShowDashboardModal(true);
        } catch (error) {
            globalThis.reportClientError?.("Error cargando dashboard:", error);
            appAlert("No se pudo cargar el dashboard de equipo.");
        } finally {
            setLoadingDashboard(false);
        }
    };

    const handleAssignFromDashboard = async (item) => {
        // Caso especial: Actualizar el dashboard por cambio de módulo
        if (item.id === 'REFRESH_DASHBOARD') {
            await handleOpenDashboard(targetItem, item.modulo);
            return;
        }

        // Redirigir la asignación a una rama específica desde el dashboard
        setTargetItem(targetItem);
        setItemType('project');
        setAssignModulo(dashboardModulo); // Heredar módulo del dashboard
        setAssignEsGlobal(false);
        
        // Asegurar que la EDT esté cargada
        let nodes = edtNodes;
        if (nodes.length === 0) {
            try {
                const empId = selectedEmpresa?.id || user?.empresa_id;
                const edtData = await edtApi.getTree(targetItem.id, empId);
                nodes = edtData || [];
                setEdtNodes(nodes);
            } catch (error) {
                globalThis.reportClientError?.("Error cargando EDT:", error);
            }
        }

        if (item.id === null) {
            setSelectedEdtNode(null);
        } else {
            const node = nodes.find(n => n.id === item.id) || { id: item.id, codigo: item.codigo, nombre: item.nombre };
            setSelectedEdtNode(node);
        }

        setShowDashboardModal(false);
        setShowAssignModal(true);
        await fetchAssignments(targetItem, 'project', item.id, dashboardModulo);
    };

    const handleAssignUser = async (userId) => {
        try {
            const params = { 
                usuario_id: userId,
                modulo: assignModulo,
                es_global: assignEsGlobal
            };
            if (selectedEdtNode) params.edt_id = selectedEdtNode.id;

            if (itemType === 'project') {
                await proyectosApi.assignUser(targetItem.id, params);
            } else {
                await basesTrabajoApi.assignUser(targetItem.id, params);
            }
            
            await fetchAssignments(targetItem, itemType, selectedEdtNode?.id, assignModulo);
            
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const dData = await proyectosApi.getAssignmentDashboard(targetItem.id, empId, assignModulo);
            setDashboardData(dData);
        } catch (error) {
            globalThis.reportClientError?.("Error asignando:", error);
            const msg = error.response?.data?.detail || "No se pudo realizar la vinculación.";
            appAlert(msg);
        }
    };

    const handleUnassignUser = async (userId) => {
        try {
            const confirmAction = await appConfirm(`¿Estás seguro de desvincular a este colaborador?`);
            if (!confirmAction) return;
            
            const params = {
                modulo: assignModulo,
                es_global: assignEsGlobal
            };
            if (selectedEdtNode) params.edt_id = selectedEdtNode.id;

            if (itemType === 'project') {
                await proyectosApi.unassignUser(targetItem.id, userId, params);
            } else {
                await basesTrabajoApi.unassignUser(targetItem.id, userId, params);
            }
            
            setAssignedUsers(prev => prev.filter(u => u.id !== userId));

            const empId = selectedEmpresa?.id || user?.empresa_id;
            const dData = await proyectosApi.getAssignmentDashboard(targetItem.id, empId, assignModulo);
            setDashboardData(dData);
        } catch (error) {
            globalThis.reportClientError?.("Error desasignando:", error);
            const msg = error.response?.data?.detail || "No se pudo quitar la asignación.";
            appAlert(msg);
        }
    };

    const filteredProyectos = proyectos.filter(p => 
        includesNormalized(p.nombre, searchTerm) || 
        includesNormalized(p.codigo, searchTerm)
    );

    const filteredBases = basesMaestras.filter(b => 
        includesNormalized(b.nombre, searchTerm) || 
        includesNormalized(b.codigo_unico, searchTerm)
    );

    const activeItems = activeView === 'projects' ? filteredProyectos : filteredBases;
    const activeViewLabel = activeView === 'projects' ? 'Proyectos' : 'Bases maestras';
    const activeViewSingularLabel = activeView === 'projects' ? 'proyecto' : 'base maestra';
    const totalProjects = proyectos.length;
    const totalBases = basesMaestras.length;
    const totalCollaborators = usuarios.length;
    const totalManagedRecords = totalProjects + totalBases;

    const renderRecordsTable = (tableVariant = 'modern') => (
        <Table
            className="min-w-[940px]"
            scrollAxis="both"
            containerClassName="h-full [touch-action:pan-x_pan-y]"
            containerProps={{ 'data-project-manager-records-viewport': activeView }}
            scrollLabel={`Listado de ${activeViewLabel.toLowerCase()}`}
        >
            <TableHeader className={`sticky top-0 z-10 ${tableVariant === 'modern' ? 'bg-[#f8f6f1] border-b border-[#eadfca]' : 'bg-zinc-50 border-b border-zinc-100'}`}>
                <TableRow>
                    <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[9px] py-6 px-8 w-[150px]">Código</TableHead>
                    <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[9px] py-6">{activeView === 'projects' ? 'Proyecto' : 'Base Maestra'}</TableHead>
                    <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[9px] py-6">Cobertura</TableHead>
                    <TableHead className="text-right py-6 px-8 w-[260px]"></TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {activeItems.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={4} className="py-20 text-center text-zinc-400 uppercase text-[10px] font-black">
                            No se encontraron registros.
                        </TableCell>
                    </TableRow>
                ) : (
                    activeItems.map((item) => (
                        <TableRow
                            key={item.id}
                            className={`transition-colors border-b last:border-0 group ${
                                tableVariant === 'modern'
                                    ? 'hover:bg-[#fff7ed] border-[#f3ead8]'
                                    : 'hover:bg-zinc-50 border-zinc-50'
                            }`}
                        >
                            <TableCell className="px-8 py-6">
                                <div className="flex flex-col gap-1">
                                    <span className="font-black text-[#1A1A1A] text-xs">
                                        #{activeView === 'projects' ? item.codigo : item.codigo_unico}
                                    </span>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                        {activeView === 'projects' ? 'Proyecto' : 'Base maestra'}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col gap-2">
                                    <span className="font-black uppercase tracking-tight text-sm text-[#1A1A1A]">
                                        {item.nombre}
                                    </span>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest ${
                                            activeView === 'projects'
                                                ? 'bg-[#fff7ed] text-[#F39200] border border-[#fed7aa]'
                                                : 'bg-zinc-100 text-zinc-600 border border-zinc-200'
                                        }`}>
                                            {activeView === 'projects' ? 'Gestión por proyecto' : 'Repositorio base'}
                                        </span>
                                        {activeView === 'projects' ? (
                                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-[#eff6ff] text-[#136191] border border-[#bfdbfe]">
                                                Equipo por módulos y EDT
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest bg-[#faf5ff] text-[#7c3aed] border border-[#e9d5ff]">
                                                Asignación transversal
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell>
                                <button
                                    disabled={activeView !== 'projects'}
                                    onClick={() => handleOpenDashboard(item)}
                                    className={`flex items-center gap-3 transition-all ${activeView === 'projects' ? 'hover:scale-[1.02] cursor-pointer' : 'opacity-60 cursor-default'}`}
                                >
                                    <div className={`inline-flex h-11 w-11 items-center justify-center rounded-2xl border ${
                                        activeView === 'projects'
                                            ? 'bg-white border-zinc-200 text-[#136191]'
                                            : 'bg-orange-50 border-orange-100 text-[#F39200]'
                                    }`}>
                                        {activeView === 'projects' ? <Briefcase className="w-4 h-4" /> : <Database className="w-4 h-4" />}
                                    </div>
                                    <div className="flex flex-col items-start">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${
                                            activeView === 'projects' ? 'text-[#136191]' : 'text-zinc-500'
                                        }`}>
                                            {activeView === 'projects'
                                                ? (loadingDashboard && targetItem?.id === item.id ? 'Cargando equipo' : 'Ver equipo')
                                                : 'Ver equipo'}
                                        </span>
                                        <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider">
                                            {activeView === 'projects' ? 'Dashboard operativo' : 'Consulta informativa'}
                                        </span>
                                    </div>
                                </button>
                            </TableCell>
                            <TableCell className="text-right px-8">
                                <div className="flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => activeView === 'projects' && handleOpenDashboard(item)}
                                        disabled={activeView !== 'projects'}
                                        className={`inline-flex h-11 items-center justify-center rounded-xl border px-4 text-[9px] font-black uppercase tracking-widest transition-all ${
                                            activeView === 'projects'
                                                ? 'border-zinc-200 bg-white text-zinc-700 hover:border-[#F39200] hover:text-[#F39200]'
                                                : 'border-zinc-200 bg-zinc-100 text-zinc-400'
                                        }`}
                                    >
                                        Ver equipo
                                    </button>
                                    <LiquidButton
                                        onClick={() => handleOpenAssign(item, activeView === 'projects' ? 'project' : 'base')}
                                        className={`!h-11 !px-5 !text-white text-[9px] font-black uppercase tracking-widest rounded-xl ${
                                            activeView === 'projects' ? 'bg-zinc-900 hover:bg-[#F39200]' : 'bg-[#F39200] hover:bg-zinc-900'
                                        }`}
                                    >
                                        <UserPlus className="w-3.5 h-3.5 mr-2" />
                                        Asignar personal
                                    </LiquidButton>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))
                )}
            </TableBody>
        </Table>
    );

    const renderLegacyLanding = () => (
        <>
            <header className="shrink-0 border-b border-zinc-200 bg-white px-4 py-3 shadow-sm sm:px-6 lg:px-8 lg:py-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/proyectos')}
                            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-zinc-500 transition-colors hover:bg-zinc-100"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Users className="w-5 h-5 text-[#F39200]" />
                                <h1 className="text-xl font-black uppercase tracking-tight">Gestor de <span className="text-[#F39200]">Personal</span></h1>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Asignación de Proyectos y Equipos</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ClearSearchField
                            value={searchTerm}
                            onValueChange={setSearchTerm}
                            placeholder="Buscar proyecto..."
                            containerClassName="w-full md:w-64"
                            inputClassName="w-full pl-10 pr-10 h-11 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#F39200] focus:ring-0 transition-all"
                        />
                    </div>
                </div>
            </header>

            <main className="min-h-0 flex-1 overflow-hidden p-4 sm:p-6 lg:p-8 xl:p-10">
                <div className="mx-auto flex h-full min-h-0 max-w-[1400px] flex-col gap-4 lg:gap-6">
                    <div className="flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h2 className="text-3xl font-black tracking-tight">Equipos de Trabajo</h2>
                            <div className="h-1 w-12 bg-[#F39200] mt-2 rounded-full" />
                        </div>

                        <div className="flex bg-white p-1 rounded-2xl border border-zinc-200 shadow-sm">
                            <button
                                onClick={() => setActiveView('projects')}
                                className={`min-h-11 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'projects' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                Proyectos
                            </button>
                            <button
                                onClick={() => setActiveView('bases')}
                                className={`min-h-11 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'bases' ? 'bg-[#F39200] text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                Bases Maestras
                            </button>
                        </div>
                    </div>

                    <Card className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-3xl border-none bg-white shadow-[0_10px_40px_rgba(0,0,0,0.03)]">
                        <CardContent className="min-h-0 flex-1 p-0">
                            {loading ? (
                                <div className="p-20 text-center flex flex-col items-center gap-4">
                                    <div className="w-10 h-10 border-4 border-zinc-100 border-t-[#F39200] rounded-full animate-spin" />
                                    <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Cargando Datos...</p>
                                </div>
                            ) : renderRecordsTable('legacy')}
                        </CardContent>
                    </Card>
                </div>
            </main>
        </>
    );

    const renderModernLanding = () => (
        <>
            <header className="border-b border-[#e7dcc8] bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ed_100%)] px-8 py-5 shadow-[0_6px_24px_rgba(163,92,0,0.06)]">
                <div className="mx-auto flex max-w-[1680px] items-center justify-between gap-6">
                    <div className="flex items-center gap-5">
                        <button
                            onClick={() => navigate('/proyectos')}
                            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-[#eadfca] bg-white text-zinc-500 transition-colors hover:border-[#F39200] hover:text-[#F39200]"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[#1A1A1A] text-white shadow-[0_10px_24px_rgba(26,26,26,0.12)]">
                                    <Users className="h-5 w-5 text-[#F39200]" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#F39200]">Landing operativo</p>
                                    <h1 className="text-[1.55rem] font-black tracking-tight text-[#1A1A1A]">
                                        Gestión de proyectos y equipos
                                    </h1>
                                </div>
                            </div>
                            <p className="max-w-[780px] text-sm font-medium text-zinc-500">
                                Supervisor ejecutivo para asignación de personal por proyecto, base maestra, EDT y módulo, manteniendo intacto el flujo operativo actual.
                            </p>
                        </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-3">
                        <span className="inline-flex items-center rounded-full border border-[#fed7aa] bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#F39200]">
                            {selectedEmpresa?.nombre || 'Empresa activa'}
                        </span>
                        <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                            Modelo legacy en standby
                        </span>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto bg-[#f6f3ee] p-8 custom-scrollbar">
                <div className="mx-auto flex max-w-[1680px] flex-col gap-8">
                    <section className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,0.85fr)]">
                        <div className="rounded-[2rem] border border-[#eadfca] bg-[linear-gradient(135deg,#ffffff_0%,#fff8ef_100%)] p-8 shadow-[0_18px_50px_rgba(163,92,0,0.08)]">
                            <div className="flex flex-col gap-8">
                                <div className="space-y-4">
                                    <div className="inline-flex items-center gap-2 rounded-full border border-[#fed7aa] bg-[#fff7ed] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#F39200]">
                                        <Building2 className="h-3.5 w-3.5" />
                                        Gestión centralizada de cobertura
                                    </div>
                                    <div className="space-y-3">
                                        <h2 className="max-w-[820px] text-4xl font-black tracking-tight text-[#1A1A1A]">
                                            Nuevo landing para orquestar asignación operativa sin perder el modelo actual.
                                        </h2>
                                        <p className="max-w-[860px] text-[15px] font-medium leading-7 text-zinc-600">
                                            Esta vista reorganiza el acceso a proyectos y bases maestras en una experiencia más ejecutiva, pero sigue apoyándose en los mismos contratos, modales y reglas de asignación ya validados.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="rounded-[1.6rem] border border-[#eadfca] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Proyectos</p>
                                        <p className="mt-3 text-4xl font-black tracking-tight text-[#1A1A1A]">{totalProjects}</p>
                                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#136191]">Raíces disponibles</p>
                                    </div>
                                    <div className="rounded-[1.6rem] border border-[#eadfca] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Bases maestras</p>
                                        <p className="mt-3 text-4xl font-black tracking-tight text-[#1A1A1A]">{totalBases}</p>
                                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#7c3aed]">Repositorios activos</p>
                                    </div>
                                    <div className="rounded-[1.6rem] border border-[#eadfca] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Colaboradores</p>
                                        <p className="mt-3 text-4xl font-black tracking-tight text-[#1A1A1A]">{totalCollaborators}</p>
                                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-emerald-600">Asignables en empresa</p>
                                    </div>
                                    <div className="rounded-[1.6rem] border border-[#eadfca] bg-white p-5 shadow-[0_10px_24px_rgba(15,23,42,0.04)]">
                                        <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Registros</p>
                                        <p className="mt-3 text-4xl font-black tracking-tight text-[#1A1A1A]">{totalManagedRecords}</p>
                                        <p className="mt-2 text-xs font-bold uppercase tracking-[0.14em] text-[#F39200]">Superficie administrable</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <aside className="rounded-[2rem] border border-[#eadfca] bg-[#1A1A1A] p-6 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]">
                            <div className="flex h-full flex-col gap-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F39200]">Estado operativo</p>
                                    <h3 className="mt-3 text-2xl font-black tracking-tight">
                                        {activeViewLabel}
                                    </h3>
                                    <p className="mt-3 text-sm font-medium leading-6 text-zinc-300">
                                        Accede a la cobertura por {activeViewSingularLabel}, revisa equipos actuales y lanza la gestión detallada sin abandonar este landing.
                                    </p>
                                </div>

                                <div className="grid gap-3">
                                    <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Vista activa</p>
                                        <p className="mt-2 text-lg font-black">{activeViewLabel}</p>
                                    </div>
                                    <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Resultados visibles</p>
                                        <p className="mt-2 text-lg font-black">{activeItems.length}</p>
                                    </div>
                                    <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
                                        <p className="text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">Motor conservado</p>
                                        <p className="mt-2 text-sm font-black uppercase tracking-[0.12em] text-zinc-200">Asignación, dashboard, EDT y módulos intactos</p>
                                    </div>
                                </div>
                            </div>
                        </aside>
                    </section>

                    <section className="rounded-[2rem] border border-[#eadfca] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.05)]">
                        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
                            <div className="flex flex-1 flex-col gap-4 xl:flex-row xl:items-center">
                                <div className="w-full max-w-[420px]">
                                    <ClearSearchField
                                        value={searchTerm}
                                        onValueChange={setSearchTerm}
                                        placeholder={`Buscar ${activeView === 'projects' ? 'proyecto' : 'base'}...`}
                                        containerClassName="w-full"
                                        inputClassName="w-full pl-10 pr-10 h-12 bg-[#fcfbf8] border border-[#eadfca] rounded-2xl text-sm font-medium focus:outline-none focus:border-[#F39200] focus:ring-0 transition-all"
                                    />
                                </div>

                                <div className="flex w-full max-w-[360px] bg-[#fcfbf8] p-1 rounded-2xl border border-[#eadfca] shadow-sm">
                                    <button
                                        onClick={() => setActiveView('projects')}
                                        className={`flex-1 px-5 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-[0.18em] transition-all ${activeView === 'projects' ? 'bg-[#1A1A1A] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700'}`}
                                    >
                                        Proyectos
                                    </button>
                                    <button
                                        onClick={() => setActiveView('bases')}
                                        className={`flex-1 px-5 py-2.5 rounded-[1rem] text-[10px] font-black uppercase tracking-[0.18em] transition-all ${activeView === 'bases' ? 'bg-[#F39200] text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700'}`}
                                    >
                                        Bases maestras
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <span className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                    {activeItems.length} visibles
                                </span>
                                <span className="inline-flex items-center rounded-full border border-[#fed7aa] bg-[#fff7ed] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#F39200]">
                                    Modelo nuevo activo
                                </span>
                            </div>
                        </div>
                    </section>

                    <section className="rounded-[2rem] border border-[#eadfca] bg-white shadow-[0_18px_50px_rgba(15,23,42,0.05)] overflow-hidden">
                        <div className="border-b border-[#f0e7d7] px-8 py-6 bg-[linear-gradient(180deg,#fffdf9_0%,#fff9f2_100%)]">
                            <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#F39200]">Selector operativo</p>
                                    <h3 className="mt-2 text-2xl font-black tracking-tight text-[#1A1A1A]">{activeViewLabel}</h3>
                                    <p className="mt-2 text-sm font-medium text-zinc-500">
                                        Vista ejecutiva de cobertura y acceso a asignación detallada, manteniendo los flujos actuales de equipo, EDT y módulos.
                                    </p>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <span className="inline-flex items-center rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">
                                        Dashboard y asignación intactos
                                    </span>
                                    <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                        Legacy en standby
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Card className="border-none shadow-none rounded-none">
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="p-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-4 border-zinc-100 border-t-[#F39200] rounded-full animate-spin" />
                                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Cargando Datos...</p>
                                    </div>
                                ) : renderRecordsTable('modern')}
                            </CardContent>
                        </Card>
                    </section>
                </div>
            </main>
        </>
    );

    return (
        <div className="h-full flex flex-col bg-[#F2F4F7] text-[#1A1A1A] overflow-hidden">
            {PROJECT_MANAGER_ENABLE_NEW_LANDING ? renderModernLanding() : renderLegacyLanding()}

            {/* Dashboard de Equipo */}
            <TeamDashboardModal 
                isOpen={showDashboardModal}
                onClose={() => setShowDashboardModal(false)}
                project={targetItem}
                dashboardData={dashboardData}
                onAssign={handleAssignFromDashboard}
            />

            {/* Modal de Asignación */}
            <AnimatePresence mode="wait">
                {showAssignModal && (
                    <AppModalShell isOpen={showAssignModal} onClose={() => setShowAssignModal(false)} size="2xl">
                        <AppModalHeader onClose={() => setShowAssignModal(false)}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-[#F39200]">
                                    <UserPlus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black uppercase tracking-tight">Gestión de Personal</h3>
                                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{itemType === 'project' ? 'Proyecto' : 'Base Maestra'}: {targetItem?.nombre}</p>
                                </div>
                            </div>
                        </AppModalHeader>

                        <AppModalBody className="!p-0 !overflow-hidden bg-white">
                        <div className="flex h-full min-h-0 flex-col overflow-y-auto overscroll-contain [touch-action:pan-y] xl:flex-row xl:overflow-hidden">
                            {/* Columna 1: Estructura EDT */}
                            {itemType === 'project' && (
                                <section
                                    data-assignment-scope-pane
                                    className="flex max-h-[42dvh] w-full shrink-0 flex-col border-b border-zinc-200 bg-zinc-50 p-4 md:p-5 xl:max-h-none xl:h-full xl:w-1/3 xl:border-b-0 xl:border-r xl:p-6"
                                >
                                    <div className="space-y-6">
                                        <div>
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                                <ShieldCheck className="w-4 h-4 text-[#F39200]" /> 
                                                Configuración de Alcance
                                            </h4>
                                            
                                            <div className="mt-4 space-y-4">
                                                {/* Ámbito */}
                                                <div>
                                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Alcance de Asignación</label>
                                                    <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-100 rounded-xl">
                                                        <button 
                                                            onClick={() => setAssignEsGlobal(false)}
                                                            className={`min-h-11 px-2 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${!assignEsGlobal ? 'bg-white text-[#1A1A1A] shadow-sm' : 'text-zinc-500'}`}
                                                        >
                                                            Esta Revisión
                                                        </button>
                                                        <button 
                                                            onClick={() => setAssignEsGlobal(true)}
                                                            className={`min-h-11 px-2 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${assignEsGlobal ? 'bg-[#F39200] text-white shadow-sm' : 'text-zinc-500'}`}
                                                        >
                                                            Global (Todo)
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Módulo */}
                                                <div>
                                                    <label className="text-[9px] font-black text-zinc-400 uppercase tracking-widest block mb-2">Módulo Destino</label>
                                                    <AnimatedSelect 
                                                        value={assignModulo}
                                                        onChange={(e) => {
                                                            setAssignModulo(e.target.value);
                                                            fetchAssignments(targetItem, itemType, selectedEdtNode?.id, e.target.value);
                                                        }}
                                                        className="w-full h-11 px-3 bg-white border border-zinc-200 rounded-xl text-[10px] font-bold uppercase tracking-widest focus:outline-none focus:border-[#F39200]"
                                                    >
                                                        <option value="todos">Todos los Módulos</option>
                                                        <option value="datos_generales">Datos Generales</option>
                                                        <option value="stakeholders">Stakeholders</option>
                                                        <option value="edo">EDO (Org.)</option>
                                                        <option value="edt">EDT (Trabajo)</option>
                                                        <option value="presupuestos">Presupuestos</option>
                                                        <option value="cronogramas">Cronogramas</option>
                                                        <option value="desagregacion">Desagregación</option>
                                                        <option value="formula_polinomica">Fórmula Polinómica</option>
                                                    </AnimatedSelect>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-6 border-t border-zinc-200">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 flex items-center gap-2">
                                                <Layers className="w-4 h-4" /> 
                                                Estructura del Proyecto
                                            </h4>
                                            <p className="text-[9px] font-bold text-zinc-400 mt-1 uppercase tracking-widest">Filtro por Rama del Presupuesto</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 min-h-[12rem] flex-1 overflow-hidden">
                                        <EDTTreeSelector 
                                            nodes={edtNodes}
                                            selectedId={selectedEdtNode?.id}
                                            onSelect={(node) => {
                                                setSelectedEdtNode(node);
                                                fetchAssignments(targetItem, 'project', node?.id, assignModulo);
                                            }}
                                            assignedStats={assignedStats}
                                        />
                                    </div>
                                </section>
                            )}

                            <div
                                data-assignment-people-region
                                className={`${itemType === 'project' ? 'xl:w-2/3' : 'xl:w-full'} flex min-h-[42rem] w-full shrink-0 flex-col md:min-h-[24rem] md:flex-row xl:min-h-0 xl:flex-1`}
                            >
                                {/* Columna Izquierda: Usuarios Disponibles */}
                                <section data-assignment-available-pane className="flex min-h-[21rem] flex-1 flex-col border-b border-zinc-200 p-4 md:min-h-0 md:border-b-0 md:border-r md:p-5 xl:p-6">
                                    <div className="mb-4">
                                        <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">Personal Disponible</h4>
                                        <div className="relative group">
                                            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-[#F39200] transition-colors" />
                                            <input 
                                                type="text" 
                                                placeholder="BUSCAR USUARIO..."
                                                value={modalSearch}
                                                onChange={(e) => setModalSearch(e.target.value)}
                                                className="w-full pl-10 pr-4 h-11 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-black uppercase tracking-widest focus:outline-none focus:border-[#F39200] transition-all" 
                                            />
                                        </div>
                                    </div>
                                    <div data-assignment-available-viewport className="min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar space-y-3 [touch-action:pan-y]">
                                        {usuarios
                                            .filter(u => !assignedUsers.some(au => au.id === u.id))
                                            .filter(u => includesNormalized(u.nombre_completo, modalSearch) || includesNormalized(u.email, modalSearch))
                                            .length === 0 ? (
                                                <div className="py-20 text-center opacity-30">
                                                    <p className="text-[10px] font-black uppercase tracking-widest">No hay personal disponible</p>
                                                </div>
                                            ) : usuarios
                                            .filter(u => !assignedUsers.some(au => au.id === u.id))
                                            .filter(u => includesNormalized(u.nombre_completo, modalSearch) || includesNormalized(u.email, modalSearch))
                                            .map(u => (
                                                <div key={u.id} className="group flex items-center justify-between gap-3 rounded-2xl border border-zinc-100 bg-white p-3 shadow-sm transition-all hover:border-[#F39200]/30 hover:shadow-md">
                                                    <div className="flex min-w-0 items-center gap-3">
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-transparent bg-zinc-50 text-[12px] font-black text-zinc-500 transition-colors group-hover:border-orange-100 group-hover:text-[#F39200]">
                                                            {u.nombre_completo?.charAt(0)}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="truncate text-xs font-black uppercase tracking-tight text-zinc-800">{u.nombre_completo}</p>
                                                            <p className="text-[9px] font-extrabold text-[#F39200] uppercase tracking-widest">Colaborador</p>
                                                        </div>
                                                    </div>
                                                    <button 
                                                        onClick={() => handleAssignUser(u.id)}
                                                        aria-label={`Asignar a ${u.nombre_completo}`}
                                                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#1A1A1A] text-white shadow-lg transition-all hover:bg-[#F39200] active:scale-90"
                                                    >
                                                        <UserPlus className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            ))
                                        }
                                    </div>
                                </section>

                                {/* Columna Derecha: Usuarios Asignados */}
                                <section data-assignment-assigned-pane className="flex min-h-[21rem] flex-1 flex-col bg-zinc-50/30 p-4 md:min-h-0 md:p-5 xl:p-6">
                                    <div className="mb-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-[#F39200]">
                                                {selectedEdtNode ? `Rama: ${selectedEdtNode.codigo}` : 'Personal Proyecto'}
                                            </h4>
                                            <span className="bg-orange-100 text-[#F39200] px-2.5 py-1 rounded-full text-[9px] font-black border border-orange-200 shadow-sm">
                                                {assignedUsers.length} INTEGRANTES
                                            </span>
                                        </div>
                                        <div className="h-0.5 w-12 bg-[#F39200] rounded-full" />
                                    </div>

                                    <div data-assignment-assigned-viewport className="min-h-0 flex-1 overflow-y-auto overscroll-contain custom-scrollbar space-y-3 [touch-action:pan-y]">
                                        {loadingAssignments ? (
                                            <div className="h-full flex items-center justify-center">
                                                <div className="w-10 h-10 border-4 border-zinc-100 border-t-[#F39200] rounded-full animate-spin" />
                                            </div>
                                        ) : assignedUsers.length === 0 ? (
                                            <div className="h-full flex flex-col items-center justify-center text-center opacity-40 p-10 border-3 border-dashed border-zinc-200 rounded-[2.5rem] bg-white/50">
                                                <div className="w-16 h-16 rounded-3xl bg-zinc-50 flex items-center justify-center mb-4">
                                                    <Users className="w-8 h-8 text-zinc-300" />
                                                </div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Sin integrantes asignados</p>
                                            </div>
                                        ) : assignedUsers.map(u => (
                                            <div key={u.id} className="flex items-center justify-between gap-3 rounded-2xl border border-transparent bg-[#1A1A1A] p-3 shadow-xl transition-all">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <div className="w-12 h-12 rounded-2xl bg-zinc-800 flex items-center justify-center text-[12px] font-black text-[#F39200] border border-white/5">
                                                        {u.nombre_completo?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="truncate text-xs font-black uppercase tracking-tight text-white mb-0.5">{u.nombre_completo}</p>
                                                        <p className="truncate text-[9px] font-bold text-zinc-500 uppercase tracking-widest">{u.email}</p>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleUnassignUser(u.id)}
                                                    aria-label={`Desasignar a ${u.nombre_completo}`}
                                                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/5 text-red-300 transition-all hover:bg-red-500/10 hover:text-red-200 active:scale-95"
                                                >
                                                    <UserMinus className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                        </AppModalBody>
                        <AppModalFooter variant="flat">
                            <LiquidButton
                                onClick={() => setShowAssignModal(false)}
                                className="!h-14 !px-12 bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-2xl hover:bg-[#222] transition-all"
                            >
                                Finalizar Gestión
                            </LiquidButton>
                        </AppModalFooter>
                    </AppModalShell>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ProjectManager;
