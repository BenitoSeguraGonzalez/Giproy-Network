import { Fragment, cloneElement, useState, useEffect, useContext, useCallback, useMemo, Suspense, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { proyectosApi } from '../api/proyectos';
import { proyectoDetalleApi } from '../api/proyectoDetalle';
import { presupuestosApi } from '../api/presupuestos';
import { basesTrabajoApi } from '../api/basesTrabajo';
import projectCalendarEntriesApi from '../api/projectCalendarEntries';
import personalTodosApi from '../api/personalTodos';
import { PLANTILLAS_OPCIONES } from '../constants/plantillas';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { LiquidButton } from '../components/ui/liquid-button';
import ProjectHeaderActionButton from '../components/projects/ProjectHeaderActionButton';
import { ProjectSectionIconButton } from '../components/projects/ProjectSectionReportButton';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import AppHint from '../components/ui/AppHint';
import { Label } from '../components/ui/label';
import ClearSearchField from '../components/ui/ClearSearchField';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Plus,
    Building2,
    Search,
    Filter,
    X,
    Save,
    Pencil,
    Check,
    LayoutDashboard,
    Users,
    Network,
    ListTree,
    Calculator,
    Calendar,
    CalendarDays,
    Circle,
    CheckCircle2,
    ChevronRight,
    ChevronDown,
    Briefcase,
    Settings2,
    Copy,
    FileText,
    UploadCloud,
    ArchiveX,
    Trash2,
    AlertTriangle,
    XCircle,
    UserPlus,
    Database,
    PanelLeftClose,
    PanelLeftOpen,
    Eye,
    Play,
    LayoutList,
    KanbanSquare,
    ListTodo,
    MessageSquareText,
    Store,
    RotateCcw
} from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "../components/ui/table";
import SearchableSelect from '../components/ui/searchable-select';
import { PresupuestoProvider } from '../context/PresupuestoContext';
import { appAlert, appConfirm } from '../utils/appDialog';
import { AppModalShell, AppModalHeader, AppModalBody, AppModalFooter } from '../components/ui/app-modal';
import { useFormatters } from '../hooks/useFormatters';
import { includesNormalized } from '../utils/normalizeSearch';
import { getIndirectosStatus } from '../utils/indirectosStatus';
import MarketplaceOriginBadgeSet, { getMarketplaceOwnershipTone } from '../components/marketplace/MarketplaceOriginBadgeSet';
import useMarketplaceOrigin from '../hooks/useMarketplaceOrigin';
import useMarketplaceOriginsMap from '../hooks/useMarketplaceOriginsMap';
import { lazyWithChunkRecovery } from '../utils/lazyImportRecovery';
import { useBimFeatureAccess } from '../hooks/bim/useBimFeatureAccess';
import ProjectSegmentedSwitch from '../components/projects/ProjectSegmentedSwitch';
import AnimatedSelect from '../components/ui/AnimatedSelect';
import AnimatedDateInput from '../components/ui/AnimatedDateInput';
import DatosProyecto from '../components/projects/DatosProyecto';

const Stakeholders = lazyWithChunkRecovery(() => import('../components/projects/Stakeholders'));
const Edo = lazyWithChunkRecovery(() => import('../components/projects/Edo'));
const Edt = lazyWithChunkRecovery(() => import('../components/projects/Edt'));
const Cronogramas = lazyWithChunkRecovery(() => import('../components/projects/Cronogramas'));
const DesagregacionTab = lazyWithChunkRecovery(() => import('../components/projects/DesagregacionTab'));
const FormulaPolinomicaTab = lazyWithChunkRecovery(() => import('../components/projects/FormulaPolinomicaTab'));
const PresupuestoDetail = lazyWithChunkRecovery(() => import('../components/presupuestos/PresupuestoDetail'));
const BimTab = lazyWithChunkRecovery(() => import('../components/projects/BimTab'));

const MotionDiv = motion.div;
const MotionAside = motion.aside;
const MotionButton = motion.button;

const ProjectSectionFallback = () => (
    <div className="flex h-full min-h-[320px] items-center justify-center rounded-[1.4rem] border border-zinc-200 bg-white">
        <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-200 border-t-[#F39200]" />
            Cargando sección
        </div>
    </div>
);

const CLASSIC_SECTIONS = [
    { id: 'datos', label: 'Datos del proyecto', icon: <Briefcase className="w-4 h-4" />, color: 'text-[#F39200]', bg: 'bg-[#F39200]' },
    { id: 'stakeholders', label: 'Stakeholders', icon: <Users className="w-4 h-4" />, color: 'text-purple-500', bg: 'bg-purple-500' },
    { id: 'edo_obs', label: 'EDO/OBS', icon: <Network className="w-4 h-4" />, color: 'text-[#136191]', bg: 'bg-[#136191]' },
    { id: 'edt_wbs', label: 'EDT/WBS', icon: <ListTree className="w-4 h-4" />, color: 'text-emerald-500', bg: 'bg-emerald-500' },
    { id: 'presupuesto', label: 'Presupuesto', icon: <Calculator className="w-4 h-4" />, color: 'text-amber-500', bg: 'bg-amber-500' },
    { id: 'cronogramas', label: 'Cronogramas', icon: <Calendar className="w-4 h-4" />, color: 'text-sky-500', bg: 'bg-sky-500' },
    { id: 'desagregacion', label: 'Desagregacion', icon: <ListTree className="w-4 h-4" />, color: 'text-indigo-500', bg: 'bg-indigo-500' },
    { id: 'formula', label: 'Formula Polinomica', icon: <Settings2 className="w-4 h-4" />, color: 'text-rose-500', bg: 'bg-rose-500' },
];

const BIM_SECTION = {
    id: 'bim',
    label: 'BIM',
    icon: <Database className="w-4 h-4" />,
    color: 'text-cyan-600',
    bg: 'bg-cyan-600',
};

const BIM_TARGET_TABS = Object.freeze({
    edt: 'edt_wbs',
    presupuesto: 'presupuesto',
});

const PROJECTS_HTML_REFERENCE_LANDING = true;
const PROJECTS_FILTER_OPTIONS = [
    { id: 'todos', label: 'Todos' },
    { id: 'con-revisiones', label: 'Con revisiones' },
    { id: 'sin-revisiones', label: 'Base única' },
];
const PROJECTS_VIEW_OPTIONS = [
    { id: 'lista', label: 'Lista', icon: LayoutList },
    { id: 'kanban', label: 'Kanban', icon: KanbanSquare },
];
const PROJECTS_KANBAN_COLUMNS = [
    { id: 'prefactibilidad', label: 'Pre-Factibilidad / Factibilidad', emoji: '💡', state: 'Pre-Factibilidad / Factibilidad' },
    { id: 'planificacion', label: 'Planificación / Diseño', emoji: '📐', state: 'Planificación / Diseño' },
    { id: 'licitacion', label: 'Licitación / Aprobación', emoji: '📋', state: 'Licitación / Aprobación' },
    { id: 'ejecucion', label: 'En ejecución', emoji: '🏗️', state: 'En ejecución' },
    { id: 'finalizado', label: 'Finalizado', emoji: '✅', state: 'Finalizado' },
];
const PORTFOLIO_CALENDAR_PREVIEW_LIMIT = 3;
const PORTFOLIO_TODO_FILTER_OPTIONS = [
    { id: 'active', label: 'Activos' },
    { id: 'completed', label: 'Completados' },
    { id: 'all', label: 'Todos' },
];

const getPortfolioTodoStorageKey = (empresaId, userId) => `giproy_portfolio_todos_${empresaId || 'empresa'}_${userId || 'user'}`;

const PROJECTS_COMPACT_ACTION_BUTTON_CLASS = 'h-10 w-10 rounded-[0.9rem] bg-[#eeeeec] shadow-[3px_3px_8px_#d2d2ce,-3px_-3px_8px_#ffffff]';

const GiproyActionHint = ({ title, detail }) => (
    <div className="space-y-1">
        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#F39200]">GIPROY</p>
        <p className="text-[11px] font-black uppercase tracking-[0.08em] text-zinc-800">{title}</p>
        {detail ? <p className="text-[11px] font-bold leading-snug text-zinc-600">{detail}</p> : null}
    </div>
);

const MarketplaceFieldLabel = ({ children, hint }) => (
    <AppHint
        content={hint}
        tone="dark"
        maxWidth={260}
        widthOffset={18}
        hoverDelay={220}
        hideOnMove
        disabled={!hint}
        triggerClassName="inline-flex"
    >
        <span className={PROJECTS_MODAL_LABEL_CLASS}>{children}</span>
    </AppHint>
);
const PROJECTS_COMPACT_TOOL_BUTTON_CLASS = 'inline-flex h-10 min-w-[92px] items-center justify-center gap-2 rounded-[1rem] border border-[#ececec] bg-[#ededed] px-3 text-[9px] font-black uppercase tracking-[0.18em] text-zinc-600 shadow-[4px_4px_10px_#d0d0d0,-4px_-4px_10px_#ffffff] transition-colors duration-200 hover:brightness-[0.99] active:shadow-[inset_2px_2px_8px_#d0d0d0,inset_-2px_-2px_8px_#ffffff] disabled:pointer-events-none disabled:opacity-50';
const PROJECTS_ICON_TOOL_BUTTON_ACTIVE_CLASS = 'text-[#F39200] shadow-[inset_2px_2px_8px_#d0d0d0,inset_-2px_-2px_8px_#ffffff]';
const PROJECTS_FILTER_DROPDOWN_BUTTON_CLASS = 'inline-flex w-full items-center justify-between gap-3 rounded-[0.9rem] border border-[#ececec] bg-[#ededed] px-3 py-2 text-left text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff] transition-colors hover:brightness-[0.99]';
const PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS = 'inline-flex items-center justify-center border border-[#ececec] bg-[#ededed] text-zinc-600 shadow-[3px_3px_8px_#d5d5d5,-3px_-3px_8px_#ffffff] transition-[color,border-color,transform,box-shadow] duration-200 hover:brightness-[0.99] active:scale-[0.98] active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff]';
const PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS = 'border-[#d9e5ef] text-[#136191] hover:border-[#136191]';
const PROJECTS_SOFT_ACTION_MICRO_BUTTON_DANGER_CLASS = 'border-[#f2d6d6] text-rose-700 hover:border-rose-400';
const PROJECTS_PORTFOLIO_ACTION_BUTTON_CLASS = `${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} !h-8 !w-8 !min-w-8 shrink-0 !rounded-[0.8rem]`;
const PROJECTS_MODAL_LABEL_CLASS = 'inline-flex w-fit cursor-help items-center gap-1 text-[8px] font-black uppercase tracking-[0.16em] text-zinc-500';
const PROJECTS_MODAL_INPUT_CLASS = 'h-8 rounded-[0.75rem] border border-zinc-200 bg-white px-2.5 text-[12px] font-semibold text-zinc-800 shadow-sm outline-none transition hover:border-[#F39200]/60 focus-visible:border-[#F39200] focus-visible:ring-2 focus-visible:ring-[#F39200]/10';
const PROJECTS_MODAL_PRICE_INPUT_CLASS = 'h-8 rounded-[0.75rem] border border-orange-200 bg-orange-50 px-2.5 text-right text-[12px] font-mono font-black text-[#F39200] shadow-sm outline-none transition hover:border-[#F39200] focus-visible:border-[#F39200] focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-[#F39200]/10';
const PROJECTS_MODAL_TEXTAREA_CLASS = 'min-h-[62px] resize-y rounded-[0.85rem] border border-zinc-200 bg-white px-2.5 py-2 text-[12px] font-medium leading-relaxed text-zinc-700 shadow-sm outline-none transition hover:border-[#F39200]/60 focus-visible:border-[#F39200] focus-visible:ring-2 focus-visible:ring-[#F39200]/10';
const PROJECTS_MODAL_SECTION_CLASS = 'rounded-[1.05rem] border border-[#ececec] bg-[#f7f7f5] p-3 shadow-[3px_3px_10px_rgba(148,163,184,0.16),-3px_-3px_10px_rgba(255,255,255,0.75)]';
const PROJECTS_SECTION_LABEL_REVEAL_MOTION = {
    initial: { opacity: 0, x: -8, maxWidth: 0 },
    animate: { opacity: 1, x: 0, maxWidth: 180 },
    exit: { opacity: 0, x: -6, maxWidth: 0 },
    transition: { duration: 0.18, ease: 'easeOut' },
};

const ProjectMarketplaceExportButton = ({
    project,
    onExport,
    exportingProjectId = null,
    className = '',
    title = 'Exportar a Marketplace',
    exportStatus = null,
}) => {
    const isLoading = Boolean(project?.id && exportingProjectId === project.id);
    const status = String(exportStatus?.status || '').toLowerCase();
    const isPublished = Boolean(exportStatus) && status !== 'pending';
    const isPendingReview = Boolean(exportStatus) && status === 'pending';
    const statusClass = isPublished
        ? 'text-emerald-700 ring-1 ring-emerald-200'
        : isPendingReview
            ? 'text-[#A55A00] ring-1 ring-amber-200'
            : '';
    const resolvedTitle = exportStatus?.message || title;
    const handlePress = (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (!project?.id || isLoading) return;
        onExport(project, event, exportStatus);
    };

    return (
        <button
            type="button"
            title={resolvedTitle}
            aria-label={resolvedTitle}
            onPointerDown={(event) => event.stopPropagation()}
            onMouseDown={(event) => event.stopPropagation()}
            onClick={handlePress}
            disabled={isLoading}
            className={`${className} ${statusClass} disabled:pointer-events-none disabled:opacity-50`}
        >
            {isLoading ? (
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-[#136191]" />
            ) : (
                <Store className="h-4 w-4" />
            )}
        </button>
    );
};

const getProjectBudgetChipClasses = (totalPresupuesto) => {
    const total = Number(totalPresupuesto || 0);
    if (total > 0) {
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (total === 0) {
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-red-50 text-red-700 border-red-200';
};

const getProjectIndirectosChipClasses = (indirectosStatusKey) => {
    if (indirectosStatusKey === 'rojo') {
        return 'bg-red-50 text-red-700 border-red-200';
    }
    if (indirectosStatusKey === 'ambar') {
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
};

const getProjectEstimatedTimeMeta = (project, detailsMap) => {
    const rootCode = project.codigo_root || project.codigo;
    const detail = detailsMap[rootCode];
    const plazo = Number(detail?.plazo_ejecucion || 0);
    if (plazo > 0) {
        return `${plazo} día${plazo === 1 ? '' : 's'}`;
    }
    return 'Sin plazo';
};

const hasProjectRevisions = (project) => Number(project?.num_revisiones || 1) > 1;
const getProjectRevisionCount = (project) => Math.max(1, Number(project?.num_revisiones || 1));

const getProjectUpdateDateValue = (project) => (
    project?.ultima_modificacion ||
    project?.fecha_modificacion ||
    project?.fecha_actualizacion ||
    project?.updated_at ||
    project?.fecha_creacion ||
    project?.created_at ||
    null
);

const getProjectUpdateTimestamp = (project) => {
    const dateValue = getProjectUpdateDateValue(project);
    if (!dateValue) return 0;
    const timestamp = new Date(dateValue).getTime();
    return Number.isFinite(timestamp) ? timestamp : 0;
};

const formatProjectUpdateDateTime = (dateValue) => {
    if (!dateValue) return 'Sin fecha';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Sin fecha';
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
};

const resolveLatestProjectRevisionEntry = (project, revisions = []) => {
    const entries = [project, ...(Array.isArray(revisions) ? revisions : [])].filter(Boolean);
    if (entries.length === 0) return project;
    return entries
        .map((entry, index) => ({ entry, index, timestamp: getProjectUpdateTimestamp(entry) }))
        .sort((left, right) => {
            if (right.timestamp !== left.timestamp) return right.timestamp - left.timestamp;
            const rightRevision = Number(right.entry?.revision || 0);
            const leftRevision = Number(left.entry?.revision || 0);
            if (rightRevision !== leftRevision) return rightRevision - leftRevision;
            return left.index - right.index;
        })[0]?.entry || project;
};

const getProjectRevisionUpdateMeta = (project, revisions = []) => {
    const latestEntry = resolveLatestProjectRevisionEntry(project, revisions);
    const revision = Number(latestEntry?.revision || 0);
    const dateValue = getProjectUpdateDateValue(latestEntry);
    return {
        revision,
        timestamp: getProjectUpdateTimestamp(latestEntry),
        label: `Rev. ${revision}: ${formatProjectUpdateDateTime(dateValue)}`,
    };
};

const sortProjectsByLatestUpdate = (projects = []) => (
    [...projects]
        .map((project, index) => ({ project, index, timestamp: getProjectUpdateTimestamp(project) }))
        .sort((left, right) => {
            if (right.timestamp !== left.timestamp) return right.timestamp - left.timestamp;
            return left.index - right.index;
        })
        .map(({ project }) => project)
);

const getProjectWorkflowState = (project) => {
    const normalizedState = String(project?.estado || '').trim().toLowerCase();
    if (normalizedState.includes('final')) return 'Finalizado';
    if (normalizedState.includes('ejec')) return 'En ejecución';
    if (normalizedState.includes('licit') || normalizedState.includes('aprob')) return 'Licitación / Aprobación';
    if (normalizedState.includes('factib')) return 'Pre-Factibilidad / Factibilidad';
    return 'Planificación / Diseño';
};

const resolveRootPortfolioProject = (project, portfolioProjects = []) => {
    const rootCode = project?.codigo_root || project?.codigo;
    if (!rootCode || !Array.isArray(portfolioProjects) || portfolioProjects.length === 0) {
        return project;
    }

    return portfolioProjects.find((candidate) => (
        (candidate?.codigo_root || candidate?.codigo) === rootCode && Number(candidate?.revision || 0) === 0
    )) || portfolioProjects.find((candidate) => Number(candidate?.id || 0) === Number(project?.id || 0)) || project;
};

const getProjectDisplayState = (project, portfolioProjects = []) => {
    const workflowProject = resolveRootPortfolioProject(project, portfolioProjects);
    return getProjectWorkflowState(workflowProject);
};

const getProjectCalculatedBudget = (project) => {
    if (hasProjectRevisions(project)) {
        return null;
    }
    const subtotal = Number(project?.sole_presupuesto_total);
    return Number.isFinite(subtotal) ? subtotal : null;
};

const getProjectEntityBudget = (project) => {
    const value = Number(project?.presupuesto_estimado);
    return Number.isFinite(value) ? value : 0;
};

const hasProjectOperationalBudget = (project) => {
    const calculatedBudget = getProjectCalculatedBudget(project);
    if (Number.isFinite(calculatedBudget) && calculatedBudget > 0) {
        return true;
    }

    const entityBudget = getProjectEntityBudget(project);
    return Number.isFinite(entityBudget) && entityBudget > 0;
};

const getProjectClientLabel = (project, selectedEmpresa) => (
    project?.cliente?.nombre ||
    project?.cliente_nombre ||
    project?.empresa?.nombre ||
    selectedEmpresa?.nombre ||
    'Sin cliente'
);

const getProjectLocationLabel = (projectDetail) => {
    if (!projectDetail) return 'Sin ubicación';
    const parts = [
        projectDetail.ciudad,
        projectDetail.canton,
        projectDetail.provincia,
        projectDetail.pais,
    ].filter((value) => typeof value === 'string' && value.trim());
    return parts.length ? parts.join(', ') : 'Sin ubicación';
};

const getProjectProgressPct = (project, projectDetail) => {
    const candidates = [
        projectDetail?.porcentaje_avance,
        projectDetail?.avance_pct,
        projectDetail?.avance_real_pct,
        project?.porcentaje_avance,
        project?.avance_pct,
    ];
    for (const candidate of candidates) {
        const value = Number(candidate);
        if (Number.isFinite(value)) {
            return Math.max(0, Math.min(100, value));
        }
    }
    return null;
};

const buildInlineRevisionList = (rootProject, revisions = []) => {
    const rootRevision = {
        ...rootProject,
        revision: Number(rootProject?.revision || 0),
        codigo_root: rootProject?.codigo_root || rootProject?.codigo,
    };
    const merged = [rootRevision, ...(Array.isArray(revisions) ? revisions : [])]
        .filter(Boolean)
        .reduce((accumulator, revisionProject) => {
            const key = `${revisionProject.id || revisionProject.codigo}-${Number(revisionProject.revision || 0)}`;
            if (!accumulator.some((entry) => `${entry.id || entry.codigo}-${Number(entry.revision || 0)}` === key)) {
                accumulator.push(revisionProject);
            }
            return accumulator;
        }, []);

    return merged.sort((left, right) => Number(left?.revision || 0) - Number(right?.revision || 0));
};

const getProjectKanbanConfig = (project) => {
    const raw = project?.plantillas_config;
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
        return {};
    }
    const kanban = raw.kanban;
    return kanban && typeof kanban === 'object' && !Array.isArray(kanban) ? kanban : {};
};

const resolveApprovedKanbanRevision = (project, revisions = []) => {
    const kanbanConfig = getProjectKanbanConfig(project);
    const approvedRevisionId = Number(kanbanConfig.approved_revision_id || 0);
    const approvedRevisionNumber = Number(kanbanConfig.approved_revision || 0);

    if (approvedRevisionId > 0) {
        const byId = revisions.find((revisionProject) => Number(revisionProject.id || 0) === approvedRevisionId);
        if (byId) return byId;
    }

    if (approvedRevisionNumber > 0) {
        const byRevision = revisions.find((revisionProject) => Number(revisionProject.revision || 0) === approvedRevisionNumber);
        if (byRevision) return byRevision;
    }

    if (revisions.length === 1) {
        return revisions[0];
    }

    return revisions[revisions.length - 1] || project;
};

const getProjectStatusClasses = (state) => {
    if (state === 'Planificación' || state === 'Planificación / Diseño') {
        return 'border border-blue-200 bg-blue-50 text-[#136191]';
    }
    if (state === 'Con revisiones') {
        return 'border border-zinc-200 bg-zinc-100 text-zinc-700';
    }
    if (state === 'Pre-Factibilidad / Factibilidad') {
        return 'border border-amber-200 bg-amber-50 text-amber-700';
    }
    if (state === 'Licitación / Aprobación') {
        return 'border border-violet-200 bg-violet-50 text-violet-700';
    }
    if (state === 'En ejecución') {
        return 'border border-emerald-200 bg-emerald-50 text-emerald-700';
    }
    if (state === 'Finalizado') {
        return 'border border-zinc-200 bg-zinc-100 text-zinc-700';
    }
    return 'border border-zinc-200 bg-zinc-50 text-zinc-700';
};

const resolveProjectKanbanColumn = (state) => {
    const normalizedState = String(state || '').toLowerCase();
    if (normalizedState.includes('final')) return 'finalizado';
    if (normalizedState.includes('ejec')) return 'ejecucion';
    if (normalizedState.includes('licit') || normalizedState.includes('aprob')) return 'licitacion';
    if (normalizedState.includes('factib')) return 'prefactibilidad';
    return 'planificacion';
};

const buildMonthMatrix = (anchorDate) => {
    const year = anchorDate.getFullYear();
    const month = anchorDate.getMonth();
    const firstOfMonth = new Date(year, month, 1);
    const gridStart = new Date(firstOfMonth);
    gridStart.setDate(firstOfMonth.getDate() - firstOfMonth.getDay());
    const cells = [];
    for (let index = 0; index < 42; index += 1) {
        const date = new Date(gridStart);
        date.setDate(gridStart.getDate() + index);
        cells.push(date);
    }
    return cells;
};

const toCalendarDateKey = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

const getPortfolioCalendarEventMeta = (project, portfolioProjects = []) => {
    const workflowState = getProjectDisplayState(project, portfolioProjects);

    if (workflowState === 'Finalizado') {
        return {
            variant: 'milestone',
            badge: 'Hito',
            classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            dotClasses: 'bg-emerald-500',
        };
    }

    if (workflowState === 'Licitación / Aprobación' || workflowState === 'En ejecución') {
        return {
            variant: 'deadline',
            badge: 'Clave',
            classes: 'bg-amber-50 text-amber-700 border border-amber-200',
            dotClasses: 'bg-amber-500',
        };
    }

    return {
        variant: 'revision',
        badge: 'Revisión',
        classes: 'bg-blue-50 text-[#136191] border border-blue-200',
        dotClasses: 'bg-[#136191]',
    };
};

const getPortfolioAutomaticEventMeta = (eventKind) => {
    if (eventKind === 'project-created') {
        return {
            variant: 'created',
            badge: 'Alta',
            classes: 'bg-zinc-100 text-zinc-700 border border-zinc-200',
            dotClasses: 'bg-zinc-500',
        };
    }

    if (eventKind === 'project-start') {
        return {
            variant: 'start',
            badge: 'Inicio',
            classes: 'bg-sky-50 text-sky-700 border border-sky-200',
            dotClasses: 'bg-sky-500',
        };
    }

    if (eventKind === 'revision-approved') {
        return {
            variant: 'approval',
            badge: 'Aprob.',
            classes: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            dotClasses: 'bg-emerald-500',
        };
    }

    if (eventKind === 'project-finish') {
        return {
            variant: 'milestone',
            badge: 'Hito',
            classes: 'bg-amber-50 text-amber-700 border border-amber-200',
            dotClasses: 'bg-amber-500',
        };
    }

    return {
        variant: 'revision',
        badge: 'Revisión',
        classes: 'bg-blue-50 text-[#136191] border border-blue-200',
        dotClasses: 'bg-[#136191]',
    };
};

const getPortfolioCalendarEntryMeta = (entryType) => {
    if (entryType === 'broadcast') {
        return {
            badge: 'Comunicado',
            classes: 'bg-orange-50 text-[#F39200] border border-orange-200',
            dotClasses: 'bg-[#F39200]',
        };
    }

    if (entryType === 'personal') {
        return {
            badge: 'Privada',
            classes: 'bg-violet-50 text-violet-700 border border-violet-200',
            dotClasses: 'bg-violet-500',
        };
    }

    return {
        badge: 'Anotación',
        classes: 'bg-sky-50 text-sky-700 border border-sky-200',
        dotClasses: 'bg-sky-500',
    };
};

const getPortfolioCalendarEntryTypeLabel = (entryType) => {
    if (entryType === 'broadcast') return 'Comunicado';
    if (entryType === 'personal') return 'Nota privada';
    return 'Anotación';
};

const getCalendarApiErrorMessage = (error) => {
    const status = Number(error?.response?.status || 0);
    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) {
        return detail.trim();
    }
    if (status === 404) {
        return 'El backend activo aún no expone el módulo de anotaciones/comunicados del calendario.';
    }
    if (status === 403) {
        return 'La empresa activa no tiene permisos para operar la capa manual del calendario.';
    }
    if (status >= 500) {
        return 'El servicio de anotaciones/comunicados del calendario no respondió correctamente.';
    }
    return 'No se pudo conectar con la capa manual del calendario.';
};

const PROJECT_APU_EDITOR_QUERY = {
    entry: 'project',
    mode: 'editor',
    return_to: 'project',
    return_tab: 'presupuesto',
};

const normalizePublicProcurementCompanyName = (value) => String(value || '').trim().toLowerCase().replace(/\s+/g, ' ');
const PUBLIC_PROCUREMENT_IMPORT_COMPANY = 'administradores generales';
const PUBLIC_PROCUREMENT_PROGRESS_IDLE = Object.freeze({
    phase: 'idle',
    percent: 0,
    label: '',
    indeterminate: false,
    elapsedSeconds: 0,
});

const normalizeMarketplaceFormValue = (value) => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return ['none', 'null', 'undefined'].includes(trimmed.toLowerCase()) ? '' : value;
    }
    if (Array.isArray(value)) {
        return value.map(normalizeMarketplaceFormValue);
    }
    if (value && typeof value === 'object') {
        return Object.fromEntries(
            Object.entries(value).map(([key, entryValue]) => [key, normalizeMarketplaceFormValue(entryValue)])
        );
    }
    return value;
};

const buildMarketplaceExportForm = (preview = {}) => ({
    product_type: preview.product_type || 'proyecto',
    titulo: preview.titulo || '',
    resumen: preview.resumen || '',
    descripcion: preview.descripcion || '',
    incluye: preview.incluye || '',
    no_incluye: preview.no_incluye || '',
    etiquetas: Array.isArray(preview.etiquetas) ? preview.etiquetas.join(', ') : '',
    product_meta: {
        ...normalizeMarketplaceFormValue(preview.product_meta || {}),
    },
    portal_meta: preview.portal_meta
        ? normalizeMarketplaceFormValue({
            ...preview.portal_meta,
            import_source: { ...(preview.portal_meta.import_source || {}) },
            project_delivery_policy: { ...(preview.portal_meta.project_delivery_policy || {}) },
            import_analysis: preview.portal_meta.import_analysis || null,
        }
        )
        : null,
});

const buildMarketplaceExportFallbackPreview = (project = {}) => {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(today.getDate() + 30);
    const toIsoDate = (value) => {
        if (!value) return '';
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? String(value).slice(0, 10) : parsed.toISOString().slice(0, 10);
    };
    const technicalTotal = Number(project.sole_presupuesto_total || project.presupuesto_estimado || 0);
    const projectSalePrice = 19.99;
    const description = project.descripcion || '';
    return {
        project_id: project.id,
        product_type: 'proyecto',
        can_choose_product_type: false,
        product_type_options: [{ value: 'proyecto', label: 'Vender proyecto' }],
        titulo: project.nombre || `Proyecto ${project.id || ''}`.trim(),
        resumen: description.slice(0, 500),
        descripcion: description,
        incluye: 'Proyecto clasico GIPROY con base de datos, presupuesto y estructura tecnica asociada.',
        no_incluye: 'No incluye derechos de reventa ni exportacion fuera de la empresa compradora.',
        etiquetas: ['proyecto', 'giproy', 'compras-publicas'],
        product_meta: {
            titulo_comercial: project.nombre || '',
            descripcion_corta: description.slice(0, 240),
            descripcion_larga: description,
            descripcion_completa: description,
            precio_con_iva: projectSalePrice.toFixed(2),
            precio_referencia_tecnica: technicalTotal.toFixed(2),
            export_source: 'classic_project',
            export_status: 'pending_moderation',
            codigo_proyecto: project.codigo || null,
            revision_proyecto: project.revision || 0,
            fecha_inicio_publicacion: toIsoDate(today),
            fecha_fin_publicacion: toIsoDate(endDate),
        },
        portal_meta: null,
        price: projectSalePrice.toFixed(2),
        technical_total: technicalTotal.toFixed(2),
        technical_total_source: 'frontend_fallback',
        preview_loading: true,
    };
};
const getPublicProcurementProcessingStage = (elapsedMs) => {
    if (elapsedMs < 4500) {
        return { percent: 48, label: 'Lectura técnica del documento', indeterminate: false };
    }
    if (elapsedMs < 12000) {
        return { percent: 64, label: 'Reconociendo rubros, APUs y recursos', indeterminate: false };
    }
    if (elapsedMs < 26000) {
        return { percent: 78, label: 'Conciliando presupuesto y estructura técnica', indeterminate: false };
    }
    if (elapsedMs < 50000) {
        return { percent: 88, label: 'Validando anidados y advertencias', indeterminate: false };
    }
    return { percent: 94, label: 'El análisis continúa en segundo plano técnico', indeterminate: true };
};

const Proyectos = () => {
    const { user, selectedEmpresa, setSelectedEmpresa, selectedBaseTrabajo, setSelectedBaseTrabajo, setActiveProject, licenseInfo } = useContext(AuthContext);
    const { access: bimAccess, loading: bimAccessLoading } = useBimFeatureAccess();
    const bimEnabled = !bimAccessLoading && bimAccess.enabled;
    const normalizedRole = (user?.rol || '').trim().toLowerCase();
    const publicProcurementCompanyName = normalizePublicProcurementCompanyName(
        selectedEmpresa?.nombre || user?.empresa?.nombre || user?.empresa_nombre
    );
    const canUsePublicProcurementImporter = normalizedRole === 'superadministrador' && publicProcurementCompanyName === PUBLIC_PROCUREMENT_IMPORT_COMPANY;
    const [isSidebarPinned, setIsSidebarPinned] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem('project-detail-sidebar-pinned') === 'true';
    });
    const [isSidebarHovered, setIsSidebarHovered] = useState(false);
    
    // -- Robust formatters with fallbacks --
    const formatters = useFormatters();
    const formatNumericDisplay = formatters?.formatNumericDisplay || ((v) => String(v || '').replace('.', ','));
    const parseNumericInput = formatters?.parseNumericInput || ((v) => String(v || '').replace(',', '.'));
    const { formatMoneda } = formatters || {};

    const navigate = useNavigate();
    const location = useLocation();
    const [proyectos, setProyectos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [projectLoadError, setProjectLoadError] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProject, setSelectedProject] = useState(null);
    const [activeTab, setActiveTab] = useState('datos');
    const [bimNavigationContext, setBimNavigationContext] = useState(null);
    const [selectedPresupuestoId, setSelectedPresupuestoId] = useState(null);
    const [resolvingPresupuesto, setResolvingPresupuesto] = useState(false);
    const [projectPermissions, setProjectPermissions] = useState(null);
    const activeTabRef = useRef('datos');
    useEffect(() => {
        activeTabRef.current = activeTab;
    }, [activeTab]);
    const activateProjectTab = useCallback((tabId, options = {}) => {
        const { replace = false } = options;
        setActiveTab(tabId);
        const params = new URLSearchParams(location.search);
        if (selectedProject?.id) {
            params.set('project_id', String(selectedProject.id));
        }
        params.set('tab', tabId);
        navigate(
            {
                pathname: location.pathname,
                search: `?${params.toString()}`,
            },
            { replace }
        );
    }, [location.pathname, location.search, navigate, selectedProject?.id]);
    const handleBimNavigateTarget = useCallback((link) => {
        const targetType = String(link?.target_type || '').toLowerCase();
        const projectTab = BIM_TARGET_TABS[targetType];
        if (projectTab) {
            setBimNavigationContext({
                targetType,
                targetId: Number(link?.target_id) || null,
            });
            activateProjectTab(projectTab);
            return;
        }

        if (targetType === 'apu' && link?.target_id) {
            const params = new URLSearchParams({
                ...PROJECT_APU_EDITOR_QUERY,
                apu_id: String(link.target_id),
                project_id: String(selectedProject?.id || ''),
                return_tab: 'bim',
            });
            navigate(`/apus?${params.toString()}`);
        }
    }, [activateProjectTab, navigate, selectedProject?.id]);
    const buildRevisionBudgetEntry = useCallback((operativo, fallbackMoneda = 'USD') => {
        const subtotal = Number(operativo?.subtotal || 0);

        return {
            total: Number.isFinite(subtotal) ? subtotal : 0,
            moneda: operativo?.moneda || fallbackMoneda || 'USD',
        };
    }, []);

    useEffect(() => {
        if (normalizedRole !== 'superadministrador') return;
        if (!selectedProject?.empresa_id) return;
        if (Number(selectedEmpresa?.id || 0) === Number(selectedProject.empresa_id)) return;

        setSelectedEmpresa({
            ...(selectedEmpresa || {}),
            ...(selectedProject?.empresa || {}),
            id: selectedProject.empresa_id,
            nombre: selectedProject?.empresa?.nombre || selectedEmpresa?.nombre || `Empresa ${selectedProject.empresa_id}`,
        });
    }, [normalizedRole, selectedEmpresa, selectedProject?.empresa, selectedProject?.empresa_id, setSelectedEmpresa]);

    // Fetch permissions when selectedProject changes
    useEffect(() => {
        const fetchPermissions = async () => {
            if (selectedProject) {
                try {
                    const empId = selectedProject?.empresa_id || selectedEmpresa?.id || user?.empresa_id;
                    const perms = await proyectosApi.getPermissions(selectedProject.id, empId);
                    setProjectPermissions(perms);

                    const redirectToSection = (tabId) => {
                        setActiveTab(tabId);
                        const params = new URLSearchParams(window.location.search);
                        if (selectedProject?.id) {
                            params.set('project_id', String(selectedProject.id));
                        }
                        params.set('tab', tabId);
                        navigate(
                            {
                                pathname: location.pathname,
                                search: `?${params.toString()}`,
                            },
                            { replace: true }
                        );
                    };

                    // Auto-selección de pestaña permitida
                    const allowed = perms.allowed_modules || [];
                    if (!allowed.includes('todos')) {
                        const moduleMapInv = {
                            'datos_generales': 'datos',
                            'stakeholders': 'stakeholders',
                            'edo': 'edo_obs',
                            'edt': 'edt_wbs',
                            'presupuestos': 'presupuesto',
                            'cronogramas': 'cronogramas',
                            'desagregacion': 'desagregacion',
                            'formula_polinomica': 'formula'
                        };
                        
                        const currentModule = {
                            'datos': 'datos_generales',
                            'stakeholders': 'stakeholders',
                            'edo_obs': 'edo',
                            'edt_wbs': 'edt',
                            'presupuesto': 'presupuestos',
                            'cronogramas': 'cronogramas',
                            'desagregacion': 'desagregacion',
                            'formula': 'formula_polinomica'
                        }[activeTabRef.current];

                        if (currentModule && !allowed.includes(currentModule)) {
                            // Si el actual no está permitido, saltar al primero disponible
                            for (const sec of CLASSIC_SECTIONS) {
                                const modName = {
                                    'datos': 'datos_generales',
                                    'stakeholders': 'stakeholders',
                                    'edo_obs': 'edo',
                                    'edt_wbs': 'edt',
                                    'presupuesto': 'presupuestos',
                                    'cronogramas': 'cronogramas',
                                    'desagregacion': 'desagregacion',
                                    'formula': 'formula_polinomica'
                                }[sec.id];
                                if (allowed.includes(modName)) {
                                    redirectToSection(sec.id);
                                    break;
                                }
                            }
                        }
                    } else if (perms.is_restricted) {
                        // Si tiene acceso global pero está restringido por EDT, forzar presupuesto como antes
                        redirectToSection('presupuesto');
                    }
                } catch (error) {
                    globalThis.reportClientError?.("Error fetching permissions:", error);
                    setProjectPermissions({ is_restricted: false, edt_ids: [], has_assignment: true });
                }
            } else {
                setProjectPermissions(null);
            }
        };
        fetchPermissions();
    }, [location.pathname, navigate, normalizedRole, selectedEmpresa?.id, selectedProject, user?.empresa_id]);

    // Reset editor state when changing project or tab (optional, but safer)
    useEffect(() => {
        if (activeTab !== 'presupuesto') {
            setSelectedPresupuestoId(null);
        }
    }, [activeTab, selectedProject?.id]);

    useEffect(() => {
        setBimNavigationContext(null);
    }, [selectedProject?.id]);

    useEffect(() => {
        if (!bimAccessLoading && !bimAccess.enabled && activeTab === 'bim') {
            activateProjectTab('datos', { replace: true });
        }
    }, [activateProjectTab, activeTab, bimAccess.enabled, bimAccessLoading]);

    useEffect(() => {
        let cancelled = false;

        const resolveOperationalPresupuesto = async () => {
            if (activeTab !== 'presupuesto' || !selectedProject?.id) {
                return;
            }

            try {
                setResolvingPresupuesto(true);
                const empId = selectedProject.empresa_id || selectedEmpresa?.id || user?.empresa_id;
                const response = await presupuestosApi.getByProyecto(selectedProject.id, empId);
                const presupuestos = response?.data || [];

                if (!cancelled) {
                    if (presupuestos.length === 0) {
                        appAlert("No se pudo resolver el presupuesto operativo de esta revisión.");
                        setSelectedPresupuestoId(null);
                        return;
                    }
                    setSelectedPresupuestoId(presupuestos[0].id);
                }
            } catch (error) {
                globalThis.reportClientError?.("Error resolviendo presupuesto operativo:", error);
                if (!cancelled) {
                    appAlert("No se pudo cargar el presupuesto operativo de la revisión.");
                    setSelectedPresupuestoId(null);
                }
            } finally {
                if (!cancelled) {
                    setResolvingPresupuesto(false);
                }
            }
        };

        resolveOperationalPresupuesto();
        return () => {
            cancelled = true;
        };
    }, [activeTab, selectedProject?.id, selectedProject?.empresa_id, selectedEmpresa?.id, user?.empresa_id]);

    // Estados para Creación
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showPublicProcurementImportModal, setShowPublicProcurementImportModal] = useState(false);
    const [publicProcurementFiles, setPublicProcurementFiles] = useState([]);
    const [publicProcurementImporting, setPublicProcurementImporting] = useState(false);
    const [publicProcurementMaterializing, setPublicProcurementMaterializing] = useState(false);
    const [publicProcurementPreview, setPublicProcurementPreview] = useState(null);
    const [publicProcurementProgress, setPublicProcurementProgress] = useState(PUBLIC_PROCUREMENT_PROGRESS_IDLE);
    const [showPublicProcurementDiagnosticsModal, setShowPublicProcurementDiagnosticsModal] = useState(false);
    const publicProcurementProgressTimerRef = useRef(null);
    const [marketplaceExportingProjectId, setMarketplaceExportingProjectId] = useState(null);
    const [marketplaceExportModalOpen, setMarketplaceExportModalOpen] = useState(false);
    const [marketplaceExportProject, setMarketplaceExportProject] = useState(null);
    const [marketplaceExportPreview, setMarketplaceExportPreview] = useState(null);
    const [marketplaceExportForm, setMarketplaceExportForm] = useState(null);
    const [marketplaceExportLoading, setMarketplaceExportLoading] = useState(false);
    const [marketplaceExportSubmitting, setMarketplaceExportSubmitting] = useState(false);
    const [marketplaceExportStatuses, setMarketplaceExportStatuses] = useState({});
    const [basesMaestras, setBasesMaestras] = useState([]);
    const [newProject, setNewProject] = useState({
        nombre: '',
        codigo: '',
        descripcion: '',
        presupuesto_estimado: 0,
        moneda: 'USD',
        source_base_id: ''
    });

    // Estados para Revisión
    const [showRevisionModal, setShowRevisionModal] = useState(false);
    const [projectRevisions, setProjectRevisions] = useState([]);
    const [loadingRevisions, setLoadingRevisions] = useState(false);
    const [projectForRevisions, setProjectForRevisions] = useState(null);
    const [revisionBudgetMap, setRevisionBudgetMap] = useState({});
    const [revisionModalMode, setRevisionModalMode] = useState('open');
    const [pendingKanbanTransition, setPendingKanbanTransition] = useState(null);

    // Estados para Eliminación
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [deleteStep, setDeleteStep] = useState(1); // 1: Advertencia inicial, 2: Confirmación final
    const [deleting, setDeleting] = useState(false);
    const [deleteProjectBase, setDeleteProjectBase] = useState(true);
    const [showRecycleModal, setShowRecycleModal] = useState(false);
    const [recycledProjects, setRecycledProjects] = useState([]);
    const [recycleLoading, setRecycleLoading] = useState(false);
    const [recycleActionId, setRecycleActionId] = useState(null);
    const [projectDetailsMap, setProjectDetailsMap] = useState({});
    const [editingEstimatedId, setEditingEstimatedId] = useState(null);
    const [editingEstimatedValue, setEditingEstimatedValue] = useState('');
    const [editingDateRoot, setEditingDateRoot] = useState(null);
    const [editingDateValue, setEditingDateValue] = useState('');
    const selectedProjectOrigin = useMarketplaceOrigin('proyecto', selectedProject?.id);
    const { originsMap } = useMarketplaceOriginsMap();
    const selectedProjectTone = getMarketplaceOwnershipTone(selectedProjectOrigin);
    const selectedProjectRootCode = selectedProject ? (selectedProject.codigo_root || selectedProject.codigo) : '';
    const selectedProjectDetail = selectedProjectRootCode ? (projectDetailsMap[selectedProjectRootCode] || null) : null;
    const isSidebarExpanded = isSidebarPinned || isSidebarHovered;
    const isProjectHeaderCollapsed = true;
    const sectionItems = useMemo(
        () => (bimEnabled ? [...CLASSIC_SECTIONS, BIM_SECTION] : CLASSIC_SECTIONS),
        [bimEnabled],
    );
    const activeSectionMeta = sectionItems.find((section) => section.id === activeTab) || CLASSIC_SECTIONS[0];
    const [portfolioView, setPortfolioView] = useState('lista');
    const [portfolioFilter, setPortfolioFilter] = useState('todos');
    const [showPortfolioFilters, setShowPortfolioFilters] = useState(false);
    const portfolioFilterMenuRef = useRef(null);
    const portfolioListViewportRef = useRef(null);
    const portfolioListRowRefs = useRef({});
    const [expandedProjectRoot, setExpandedProjectRoot] = useState(null);
    const [inlineRevisionsByRoot, setInlineRevisionsByRoot] = useState({});
    const [inlineRevisionBudgetMapByRoot, setInlineRevisionBudgetMapByRoot] = useState({});
    const [inlineLoadingRoot, setInlineLoadingRoot] = useState(null);
    const [portfolioInlinePanelLayout, setPortfolioInlinePanelLayout] = useState(null);
    const [kanbanUpdatingProjectId, setKanbanUpdatingProjectId] = useState(null);
    const [kanbanRevisionMenuRoot, setKanbanRevisionMenuRoot] = useState(null);
    const [kanbanRevisionOptionsByRoot, setKanbanRevisionOptionsByRoot] = useState({});
    const [kanbanRevisionLoadingRoot, setKanbanRevisionLoadingRoot] = useState(null);
    const kanbanRevisionMenuRef = useRef(null);
    const [showPortfolioCalendarModal, setShowPortfolioCalendarModal] = useState(false);
    const [portfolioCalendarDate, setPortfolioCalendarDate] = useState(() => {
        const today = new Date();
        return new Date(today.getFullYear(), today.getMonth(), 1);
    });
    const [portfolioCalendarSelectedKey, setPortfolioCalendarSelectedKey] = useState(() => {
        const today = new Date();
        return toCalendarDateKey(today);
    });
    const [portfolioCalendarEntries, setPortfolioCalendarEntries] = useState([]);
    const [portfolioCalendarEntriesLoading, setPortfolioCalendarEntriesLoading] = useState(false);
    const [portfolioCalendarEntriesAvailable, setPortfolioCalendarEntriesAvailable] = useState(true);
    const [portfolioCalendarEntriesError, setPortfolioCalendarEntriesError] = useState('');
    const [portfolioCalendarRevisionMapByRoot, setPortfolioCalendarRevisionMapByRoot] = useState({});
    const [portfolioCalendarComposerOpen, setPortfolioCalendarComposerOpen] = useState(false);
    const [portfolioCalendarEditingEntry, setPortfolioCalendarEditingEntry] = useState(null);
    const [portfolioCalendarHoveredItemId, setPortfolioCalendarHoveredItemId] = useState(null);
    const [portfolioCalendarQuickAddKey, setPortfolioCalendarQuickAddKey] = useState(null);
    const portfolioCalendarGridRef = useRef(null);
    const portfolioCalendarCellRefs = useRef({});
    const [portfolioCalendarForm, setPortfolioCalendarForm] = useState({
        entry_type: 'annotation',
        title: '',
        message: '',
    });
    const [portfolioTodos, setPortfolioTodos] = useState([]);
    const [portfolioTodosLoading, setPortfolioTodosLoading] = useState(false);
    const [portfolioTodosError, setPortfolioTodosError] = useState('');
    const [portfolioTodosMode, setPortfolioTodosMode] = useState('remote');
    const [portfolioTodoComposerOpen, setPortfolioTodoComposerOpen] = useState(false);
    const [portfolioTodoEditingItem, setPortfolioTodoEditingItem] = useState(null);
    const [portfolioTodoFilter, setPortfolioTodoFilter] = useState('active');
    const [portfolioTodoForm, setPortfolioTodoForm] = useState({
        title: '',
        notes: '',
    });
    const canManagePortfolioDeletes = ['administrador', 'superadministrador'].includes(normalizedRole);
    const canExportProjectsToMarketplace = ['administrador', 'superadministrador'].includes(normalizedRole);
    const canCreateCalendarAnnotation = ['administrador', 'superadministrador'].includes(normalizedRole);
    const canOperatePortfolioCalendarEntries = portfolioCalendarEntriesAvailable;

    const registerPortfolioListRow = useCallback((rootCode, node) => {
        if (!rootCode) return;
        if (node) {
            portfolioListRowRefs.current[rootCode] = node;
        } else {
            delete portfolioListRowRefs.current[rootCode];
        }
    }, []);

    const activateProjectSelection = useCallback(async (project, options = {}) => {
        if (!project?.id) {
            return;
        }

        const { replace = false, syncBase = true } = options;
        const projectEmpresaId = Number(project.empresa_id || selectedEmpresa?.id || user?.empresa_id || 0) || undefined;

        if (
            normalizedRole === 'superadministrador' &&
            projectEmpresaId &&
            Number(selectedEmpresa?.id || 0) !== projectEmpresaId
        ) {
            setSelectedEmpresa({
                ...(selectedEmpresa || {}),
                ...(project?.empresa || {}),
                id: projectEmpresaId,
                nombre: project?.empresa?.nombre || selectedEmpresa?.nombre || `Empresa ${projectEmpresaId}`,
            });
        }

        setSelectedProject(project);
        setActiveProject(project);

        if (syncBase && project.base_trabajo_id) {
            try {
                await basesTrabajoApi.activate(project.base_trabajo_id, projectEmpresaId);
                const baseRes = await basesTrabajoApi.getById(project.base_trabajo_id, projectEmpresaId);
                setSelectedBaseTrabajo(baseRes.data);
            } catch (error) {
                globalThis.reportClientError?.('Error sincronizando base de trabajo del proyecto:', error);
            }
        }

        const params = new URLSearchParams(location.search);
        params.set('project_id', String(project.id));
        if (activeTab) {
            params.set('tab', activeTab);
        }

        navigate(
            {
                pathname: location.pathname,
                search: `?${params.toString()}`,
            },
            { replace }
        );
    }, [
        activeTab,
        location.pathname,
        location.search,
        navigate,
        normalizedRole,
        selectedEmpresa,
        setActiveProject,
        setSelectedBaseTrabajo,
        setSelectedEmpresa,
        user?.empresa_id,
    ]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        window.localStorage.setItem('project-detail-sidebar-pinned', String(isSidebarPinned));
    }, [isSidebarPinned]);

    useEffect(() => {
        const requestedProjectId = Number(new URLSearchParams(location.search).get('project_id') || 0);
        if (!requestedProjectId || selectedProject?.id === requestedProjectId) {
            return;
        }

        let cancelled = false;
        const syncRequestedProject = async () => {
            try {
                const empId = selectedEmpresa?.id || user?.empresa_id;
                const project = await proyectosApi.getById(requestedProjectId, empId);
                if (!project || cancelled) {
                    return;
                }

                if (!cancelled) {
                    await activateProjectSelection(project, { replace: true });
                }
            } catch (error) {
                globalThis.reportClientError?.('Error sincronizando proyecto adquirido:', error);
            }
        };

        syncRequestedProject();
        return () => {
            cancelled = true;
        };
    }, [activateProjectSelection, location.search, selectedEmpresa?.id, selectedProject?.id, user?.empresa_id]);

    useEffect(() => {
        const requestedTab = new URLSearchParams(location.search).get('tab');
        if (!requestedTab || !selectedProject) {
            return;
        }

        if (sectionItems.some((section) => section.id === requestedTab) && activeTab !== requestedTab) {
            setActiveTab(requestedTab);
        }
    }, [activeTab, location.search, sectionItems, selectedProject]);

    const fetchProyectos = async () => {
        try {
            setLoading(true);
            setProjectLoadError(false);
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const params = {
                ...(empId ? { empresa_id: empId } : {}),
                solo_raices: true
            };
            const data = await proyectosApi.getAll(params);
            setProyectos(data);
            try {
                const statusData = await proyectosApi.getProjectMarketplaceExportStatuses({ empresaId: empId });
                setMarketplaceExportStatuses(statusData?.projects || {});
            } catch (statusError) {
                console.warn('No se pudo cargar estado marketplace de proyectos:', statusError?.message || statusError);
                setMarketplaceExportStatuses({});
            }
            const detailEntries = await Promise.all(
                data.map(async (project) => {
                    const rootCode = project.codigo_root || project.codigo;
                    try {
                        const detail = await proyectoDetalleApi.getByRoot(rootCode, empId);
                        return [rootCode, detail];
                    } catch (error) {
                        console.warn(`No se pudo cargar detalle del proyecto ${rootCode}:`, error.message);
                        return [rootCode, null];
                    }
                })
            );
            setProjectDetailsMap(Object.fromEntries(detailEntries));
        } catch (error) {
            setProjectLoadError(true);
            globalThis.reportClientError?.("Error cargando proyectos:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchBasesMaestras = async () => {
        try {
            const res = await basesTrabajoApi.getAll({ empresa_id: selectedEmpresa?.id });
            // Solo bases de tipo "Base Maestra" para clonar
            setBasesMaestras(res.data.filter(b => b.tipo === 'Base Maestra'));
        } catch (error) {
            globalThis.reportClientError?.("Error cargando bases maestras:", error);
        }
    };

    const [isInputFocused, setIsInputFocused] = useState(false);

    const formatCurrencyInput = (val, isFocused = false) => {
        if (!val && val !== 0 && val !== '0') return '';

        if (isFocused) {
            // raw string format para editar libremente, asegurando que los decimales
            // se mantengan con coma para evitar saltos
            return val.toString().replace(/\./g, ',');
        }

        const num = parseFloat(val);
        if (isNaN(num)) return val;

        return new Intl.NumberFormat('es-EC', {
            minimumFractionDigits: selectedEmpresa?.decimales_moneda || 2,
            maximumFractionDigits: selectedEmpresa?.decimales_moneda || 2
        }).format(num);
    };

    const handleAmountChange = (e) => {
        setNewProject({ ...newProject, presupuesto_estimado: parseNumericInput(e.target.value) });
    };

    useEffect(() => {
        fetchProyectos();
        if (selectedEmpresa) fetchBasesMaestras();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedEmpresa]);

    const getProjectPresentationMeta = (project) => {
        const rootCode = project.codigo_root || project.codigo;
        const detail = projectDetailsMap[rootCode];
        if (detail?.fecha_finalizacion) {
            return {
                label: new Date(detail.fecha_finalizacion).toLocaleDateString('es-ES'),
                fallback: false
            };
        }
        const fallbackDate = detail?.fecha_creacion || project.fecha_creacion;
        return {
            label: fallbackDate ? new Date(fallbackDate).toLocaleDateString('es-ES') : 'Sin fecha',
            fallback: true
        };
    };

    const handleStartEstimatedEdit = (project, event) => {
        event.stopPropagation();
        setEditingEstimatedId(project.id);
        setEditingEstimatedValue(String(project.presupuesto_estimado ?? 0));
    };

    const handleSaveEstimated = async (project, event) => {
        if (event) event.stopPropagation();
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await proyectosApi.update(project.id, {
                presupuesto_estimado: parseNumericInput(editingEstimatedValue)
            }, empId);
            setEditingEstimatedId(null);
            await fetchProyectos();
        } catch (error) {
            globalThis.reportClientError?.("Error actualizando presupuesto estimado:", error);
            appAlert("No se pudo actualizar el presupuesto estimado del proyecto.");
        }
    };

    const handleStartDateEdit = (project, event) => {
        event.stopPropagation();
        const rootCode = project.codigo_root || project.codigo;
        const detail = projectDetailsMap[rootCode];
        const rawDate = detail?.fecha_finalizacion;
        setEditingDateRoot(rootCode);
        setEditingDateValue(rawDate ? new Date(rawDate).toISOString().split('T')[0] : '');
    };

    const handleSavePresentationDate = async (project, event) => {
        if (event) event.stopPropagation();
        try {
            const rootCode = project.codigo_root || project.codigo;
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await proyectoDetalleApi.save({
                codigo_root: rootCode,
                fecha_finalizacion: editingDateValue || null
            }, empId);
            setEditingDateRoot(null);
            await fetchProyectos();
        } catch (error) {
            globalThis.reportClientError?.("Error actualizando fecha de presentación:", error);
            appAlert("No se pudo actualizar la fecha global de presentación.");
        }
    };

    const buildProjectBaseName = (project, nextName) => {
        if (!project) return '';
        if ((project.revision || 0) > 0) {
            return `Rev ${String(project.revision).padStart(3, '0')}: ${nextName}`;
        }
        return `Base: ${nextName}`;
    };

    const buildProjectBaseDescription = (project, nextName) => {
        if (!project) return '';
        if ((project.revision || 0) > 0) {
            return `Base desvinculada para revisión ${String(project.revision).padStart(3, '0')} del proyecto ${nextName}`;
        }
        return `Base automática para el proyecto ${nextName}`;
    };

    const handleProjectNameSaved = (nextName) => {
        const normalizedName = (nextName || '').trim();
        if (!normalizedName || !selectedProject) return;

        const selectedRootCode = selectedProject.codigo_root || selectedProject.codigo;
        const updatedProject = { ...selectedProject, nombre: normalizedName };
        setSelectedProject(updatedProject);
        setActiveProject(updatedProject);

        setProyectos((prev) => prev.map((project) => {
            const rootCode = project.codigo_root || project.codigo;
            if (rootCode !== selectedRootCode) return project;
            return { ...project, nombre: normalizedName };
        }));

        setProjectRevisions((prev) => prev.map((revision) => {
            const rootCode = revision.codigo_root || revision.codigo;
            if (rootCode !== selectedRootCode) return revision;
            return { ...revision, nombre: normalizedName };
        }));

        if (selectedProject.base_trabajo_id) {
            if (selectedBaseTrabajo?.id === selectedProject.base_trabajo_id) {
                setSelectedBaseTrabajo({
                    ...selectedBaseTrabajo,
                    nombre: buildProjectBaseName(selectedProject, normalizedName),
                    descripcion: buildProjectBaseDescription(selectedProject, normalizedName),
                });
            }
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        try {
            // Sanear los datos: convertir presupuesto a número y base_id vacío a null
            const payload = {
                ...newProject,
                presupuesto_estimado: parseFloat(newProject.presupuesto_estimado) || 0,
                source_base_id: newProject.source_base_id || null
            };

            const empId = selectedEmpresa?.id || user?.empresa_id;
            await proyectosApi.create(payload, empId);
            setShowCreateModal(false);
            setNewProject({ nombre: '', codigo: '', descripcion: '', presupuesto_estimado: 0, moneda: 'USD', source_base_id: '' });
            fetchProyectos();
        } catch (error) {
            globalThis.reportClientError?.("Error al crear proyecto:", error);
            const detail = error.response?.data?.detail;

            let message = "Error Desconocido";
            if (typeof detail === 'string') {
                message = detail;
            } else if (Array.isArray(detail)) {
                message = detail.map(err => `${err.loc?.join('.') || 'Error'}: ${err.msg}`).join('\n');
            } else if (error.response?.data) {
                message = JSON.stringify(error.response.data);
            } else {
                message = error.message;
            }

            appAlert(`Error al crear el proyecto:\n\n${message}`);
        }
    };

    const resetPublicProcurementImporter = useCallback(() => {
        if (publicProcurementProgressTimerRef.current) {
            window.clearInterval(publicProcurementProgressTimerRef.current);
            publicProcurementProgressTimerRef.current = null;
        }
        setPublicProcurementFiles([]);
        setPublicProcurementPreview(null);
        setPublicProcurementImporting(false);
        setPublicProcurementMaterializing(false);
        setPublicProcurementProgress(PUBLIC_PROCUREMENT_PROGRESS_IDLE);
        setShowPublicProcurementDiagnosticsModal(false);
    }, []);

    const closePublicProcurementImporter = useCallback(() => {
        setShowPublicProcurementImportModal(false);
        resetPublicProcurementImporter();
    }, [resetPublicProcurementImporter]);

    const handlePublicProcurementFileChange = useCallback((event) => {
        setPublicProcurementFiles(Array.from(event.target.files || []));
        setPublicProcurementPreview(null);
        setPublicProcurementProgress(PUBLIC_PROCUREMENT_PROGRESS_IDLE);
    }, []);

    const openPublicProcurementFilePicker = useCallback(() => {
        document.getElementById('public-procurement-project-import-files')?.click();
    }, []);

    const handlePreviewPublicProcurementImport = useCallback(async () => {
        if (!canUsePublicProcurementImporter) {
            appAlert('Importador restringido a Superadministrador de Administradores Generales.');
            return;
        }

        if (!publicProcurementFiles.length) {
            appAlert('Selecciona al menos un archivo para analizar.');
            return;
        }

        try {
            if (publicProcurementProgressTimerRef.current) {
                window.clearInterval(publicProcurementProgressTimerRef.current);
                publicProcurementProgressTimerRef.current = null;
            }
            const startedAt = Date.now();
            let uploadCompleted = false;
            setPublicProcurementImporting(true);
            setPublicProcurementProgress({
                phase: 'uploading',
                percent: 8,
                label: 'Preparando archivos para el importador',
                indeterminate: false,
                elapsedSeconds: 0,
            });
            publicProcurementProgressTimerRef.current = window.setInterval(() => {
                if (!uploadCompleted) return;
                const stage = getPublicProcurementProcessingStage(Date.now() - startedAt);
                setPublicProcurementProgress({
                    phase: 'processing',
                    percent: stage.percent,
                    label: stage.label,
                    indeterminate: Boolean(stage.indeterminate),
                    elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
                });
            }, 1200);
            const response = await proyectosApi.previewPublicProcurementImport({
                files: publicProcurementFiles,
                onUploadProgress: (progressEvent) => {
                    const total = Number(progressEvent?.total || 0);
                    const loaded = Number(progressEvent?.loaded || 0);
                    const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
                    if (total > 0) {
                        const uploadPercent = Math.max(10, Math.min(38, Math.round((loaded / total) * 38)));
                        uploadCompleted = loaded >= total;
                        setPublicProcurementProgress({
                            phase: uploadCompleted ? 'processing' : 'uploading',
                            percent: uploadCompleted ? 42 : uploadPercent,
                            label: uploadCompleted ? 'Carga enviada. Iniciando lectura técnica' : 'Subiendo archivos al importador',
                            indeterminate: false,
                            elapsedSeconds,
                        });
                        return;
                    }
                    setPublicProcurementProgress({
                        phase: 'uploading',
                        percent: 18,
                        label: 'Subiendo archivos al importador',
                        indeterminate: false,
                        elapsedSeconds,
                    });
                },
            });
            setPublicProcurementPreview(response?.import_analysis || response || null);
            setPublicProcurementProgress({
                phase: 'success',
                percent: 100,
                label: 'Análisis técnico completado',
                indeterminate: false,
                elapsedSeconds: Math.floor((Date.now() - startedAt) / 1000),
            });
        } catch (error) {
            globalThis.reportClientError?.('Error al previsualizar importacion de compra publica:', error);
            const detail = error?.response?.data?.detail;
            setPublicProcurementProgress({
                phase: 'error',
                percent: 100,
                label: 'No se pudo completar el análisis',
                indeterminate: false,
                elapsedSeconds: 0,
            });
            appAlert(typeof detail === 'string' ? detail : 'No se pudo analizar la compra publica.');
        } finally {
            if (publicProcurementProgressTimerRef.current) {
                window.clearInterval(publicProcurementProgressTimerRef.current);
                publicProcurementProgressTimerRef.current = null;
            }
            setPublicProcurementImporting(false);
        }
    }, [canUsePublicProcurementImporter, publicProcurementFiles]);

    const handleMaterializePublicProcurementImport = useCallback(async () => {
        if (!canUsePublicProcurementImporter) {
            appAlert('Importador restringido a Superadministrador de Administradores Generales.');
            return;
        }

        if (!publicProcurementPreview) {
            appAlert('Analiza primero la fuente documental.');
            return;
        }

        const projectName = publicProcurementPreview?.title || publicProcurementPreview?.source_filename || 'Compra publica importada';
        const previewSummary = publicProcurementPreview?.analysis_bundle?.summary || publicProcurementPreview?.summary || {};
        const blockingIncidents = previewSummary.blocking_incidents || publicProcurementPreview?.technical_import_contract?.blocking_incidents || [];
        let superadminIncidentConsent = false;

        if (blockingIncidents.length > 0) {
            const confirmed = await appConfirm({
                title: 'Incidencias bloqueantes detectadas',
                message: `El análisis tiene ${blockingIncidents.length} incidencia(s) bloqueante(s). Solo un superadministrador puede continuar aceptando expresamente la importación.`,
                confirmLabel: 'Aceptar e importar',
                cancelLabel: 'Revisar',
                tone: 'warning',
            });
            if (!confirmed) return;
            superadminIncidentConsent = true;
        }

        try {
            setPublicProcurementMaterializing(true);
            setPublicProcurementProgress({
                phase: 'materializing',
                percent: 72,
                label: 'Creando proyecto clásico inicial',
                indeterminate: false,
                elapsedSeconds: 0,
            });
            const response = await proyectosApi.materializePublicProcurementImport({
                importAnalysis: publicProcurementPreview,
                projectName,
                superadminIncidentConsent,
            });
            setPublicProcurementProgress({
                phase: 'success',
                percent: 100,
                label: 'Proyecto creado correctamente',
                indeterminate: false,
                elapsedSeconds: 0,
            });
            const projectId = response?.materialization?.proyecto_id;
            await fetchProyectos();

            if (projectId) {
                const empId = selectedEmpresa?.id || user?.empresa_id;
                const project = await proyectosApi.getById(projectId, empId);
                closePublicProcurementImporter();
                await activateProjectSelection(project);
            } else {
                closePublicProcurementImporter();
            }
        } catch (error) {
            globalThis.reportClientError?.('Error al materializar compra publica como proyecto:', error);
            const detail = error?.response?.data?.detail;
            appAlert(typeof detail === 'string' ? detail : 'No se pudo crear el proyecto desde la compra publica.');
        } finally {
            setPublicProcurementMaterializing(false);
        }
    }, [
        activateProjectSelection,
        canUsePublicProcurementImporter,
        closePublicProcurementImporter,
        fetchProyectos,
        publicProcurementPreview,
        selectedEmpresa?.id,
        user?.empresa_id,
    ]);

    const openMarketplaceExportPreview = useCallback(async (project, productType = null) => {
        if (!project?.id) return;
        const empId = project.empresa_id || selectedEmpresa?.id || user?.empresa_id;
        if (!productType) {
            const fallbackPreview = buildMarketplaceExportFallbackPreview(project);
            setMarketplaceExportProject(project);
            setMarketplaceExportPreview(fallbackPreview);
            setMarketplaceExportForm(buildMarketplaceExportForm(fallbackPreview));
            setMarketplaceExportModalOpen(true);
        }
        setMarketplaceExportLoading(true);
        setMarketplaceExportingProjectId(project.id);
        try {
            const preview = await proyectosApi.previewProjectMarketplaceExport({
                projectId: project.id,
                empresaId: empId,
                productType,
            });
            setMarketplaceExportPreview(preview);
            setMarketplaceExportForm(buildMarketplaceExportForm(preview));
            setMarketplaceExportProject(project);
            setMarketplaceExportModalOpen(true);
        } catch (error) {
            globalThis.reportClientError?.('Error preparando exportacion a marketplace:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo preparar la exportacion completa a Marketplace. Revisa el proyecto y vuelve a intentar.');
        } finally {
            setMarketplaceExportLoading(false);
            setMarketplaceExportingProjectId(null);
        }
    }, [selectedEmpresa?.id, user?.empresa_id]);

    const handleExportProjectToMarketplace = useCallback(async (project, event = null, exportStatus = null) => {
        event?.stopPropagation?.();
        if (!canExportProjectsToMarketplace) {
            appAlert('Solo administradores y superadministradores pueden exportar proyectos a Marketplace.');
            return;
        }
        if (!project?.id) {
            appAlert('Selecciona un proyecto válido para exportar.');
            return;
        }
        if (exportStatus && exportStatus.can_edit === false) {
            appAlert(exportStatus.message || 'Este proyecto ya tiene una publicación en Marketplace. Gestiona su pausa o cancelación desde Mis ventas.');
            navigate('/dashboard/seller');
            return;
        }

        await openMarketplaceExportPreview(project);
    }, [canExportProjectsToMarketplace, navigate, openMarketplaceExportPreview]);

    const closeMarketplaceExportModal = useCallback(() => {
        if (marketplaceExportSubmitting) return;
        setMarketplaceExportModalOpen(false);
        setMarketplaceExportProject(null);
        setMarketplaceExportPreview(null);
        setMarketplaceExportForm(null);
    }, [marketplaceExportSubmitting]);

    const handleMarketplaceExportTypeChange = useCallback(async (productType) => {
        if (!marketplaceExportProject?.id || marketplaceExportForm?.product_type === productType) return;
        await openMarketplaceExportPreview(marketplaceExportProject, productType);
    }, [marketplaceExportForm?.product_type, marketplaceExportProject, openMarketplaceExportPreview]);

    const updateMarketplaceExportForm = useCallback((field, value) => {
        setMarketplaceExportForm((current) => ({ ...(current || {}), [field]: value }));
    }, []);

    const updateMarketplaceProductMeta = useCallback((field, value) => {
        setMarketplaceExportForm((current) => ({
            ...(current || {}),
            product_meta: {
                ...((current || {}).product_meta || {}),
                [field]: value,
            },
        }));
    }, []);

    const updateMarketplacePortalMeta = useCallback((field, value) => {
        setMarketplaceExportForm((current) => ({
            ...(current || {}),
            portal_meta: {
                ...((current || {}).portal_meta || {}),
                [field]: value,
            },
        }));
    }, []);

    const handleConfirmMarketplaceExport = useCallback(async () => {
        if (!marketplaceExportProject?.id || !marketplaceExportForm) return;
        setMarketplaceExportSubmitting(true);
        setMarketplaceExportingProjectId(marketplaceExportProject.id);
        try {
            const empId = marketplaceExportProject.empresa_id || selectedEmpresa?.id || user?.empresa_id;
            const result = await proyectosApi.exportProjectToMarketplace({
                projectId: marketplaceExportProject.id,
                empresaId: empId,
                productType: marketplaceExportForm.product_type,
                payload: {
                    titulo: marketplaceExportForm.titulo,
                    resumen: marketplaceExportForm.resumen,
                    descripcion: marketplaceExportForm.descripcion,
                    incluye: marketplaceExportForm.incluye,
                    no_incluye: marketplaceExportForm.no_incluye,
                    etiquetas: String(marketplaceExportForm.etiquetas || '')
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    product_meta: marketplaceExportForm.product_meta,
                    portal_meta: marketplaceExportForm.portal_meta,
                },
            });
            const priceText = result?.price ? ` Precio: ${Number(result.price).toFixed(2)} USD.` : '';
            const totalText = result?.technical_total ? ` Total tecnico: ${Number(result.technical_total).toFixed(2)} USD.` : '';
            appAlert(`${result?.message || 'Producto enviado a moderacion en Marketplace.'}${priceText}${totalText}`);
            try {
                const statusData = await proyectosApi.getProjectMarketplaceExportStatuses({ empresaId: empId });
                setMarketplaceExportStatuses(statusData?.projects || {});
            } catch (statusError) {
                console.warn('No se pudo refrescar estado marketplace:', statusError?.message || statusError);
            }
            setMarketplaceExportModalOpen(false);
            setMarketplaceExportProject(null);
            setMarketplaceExportPreview(null);
            setMarketplaceExportForm(null);
        } catch (error) {
            globalThis.reportClientError?.('Error exportando proyecto a marketplace:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo exportar el proyecto a Marketplace.');
        } finally {
            setMarketplaceExportSubmitting(false);
            setMarketplaceExportingProjectId(null);
        }
    }, [marketplaceExportForm, marketplaceExportProject, selectedEmpresa?.id, user?.empresa_id]);

    const handleOpenRevisionModal = async (project, options = {}) => {
        const { mode = 'open', targetColumnId = null } = options;
        setProjectForRevisions(project);
        setLoadingRevisions(true);
        setRevisionBudgetMap({});
        setRevisionModalMode(mode);
        setPendingKanbanTransition(targetColumnId ? { project, targetColumnId } : null);
        
        try {
            const rootCode = project.codigo_root || project.codigo;
            // Forzamos el uso del empresa_id del proyecto para evitar conflictos de sesión en el Superadmin
            const empIdForApi = project.empresa_id;
            
            // alert(`Abriendo: ${rootCode} (Empresa: ${empIdForApi})`); // Debug 1

            const revisions = await proyectosApi.getRevisions(
                rootCode, 
                { empresa_id: empIdForApi }
            );
            
            // alert(`Revisiones encontradas: ${revisions?.length || 0}`); // Debug 2

            if (!revisions || revisions.length === 0) {
                appAlert("No se encontraron revisiones para este proyecto.");
                return;
            }

            if (revisions.length === 1 && mode === 'open') {
                // alert("Cargando revisión única..."); // Debug 3
                await activateProjectSelection(revisions[0]);
                return;
            }

            // Si hay múltiples revisiones, mostramos el modal
            // alert("Múltiples versiones: abriendo selector..."); // Debug 4
            setProjectRevisions(revisions);
            const revisionBudgets = {};
            await Promise.all(
                revisions.map(async (rev) => {
                    try {
                        const presRes = await presupuestosApi.getByProyecto(rev.id, rev.empresa_id || empIdForApi);
                        const presupuestos = presRes?.data || [];
                        const operativo = presupuestos[0] || null;
                        revisionBudgets[rev.id] = buildRevisionBudgetEntry(
                            operativo,
                            rev.moneda || project.moneda || 'USD'
                        );
                    } catch {
                        revisionBudgets[rev.id] = {
                            total: null,
                            moneda: rev.moneda || project.moneda || 'USD'
                        };
                    }
                })
            );
            setRevisionBudgetMap(revisionBudgets);
            setShowRevisionModal(true);
        } catch (error) {
            globalThis.reportClientError?.("Error al cargar proyecto:", error);
            appAlert(`No se pudo abrir el proyecto: ${error.response?.data?.detail || error.message}`);
        } finally {
            setLoadingRevisions(false);
        }
    };

    const buildProjectApuEditorPath = useCallback((revisionProject) => {
        const params = new URLSearchParams({
            ...PROJECT_APU_EDITOR_QUERY,
            project_id: String(revisionProject?.id || ''),
        });
        return `/apus?${params.toString()}`;
    }, []);

    const handleActivateRevision = async (revisionProject, options = {}) => {
        if (!revisionProject.base_trabajo_id) {
            appAlert("Esta revisión no tiene una base de trabajo asociada.");
            return;
        }
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await basesTrabajoApi.activate(revisionProject.base_trabajo_id, empId);
            // Actualizar contexto global
            const baseRes = await basesTrabajoApi.getById(revisionProject.base_trabajo_id, empId);
            setSelectedBaseTrabajo(baseRes.data);
            setActiveProject(revisionProject); // Guardar la revisión como el proyecto activo
            if (options.target === 'apu-editor') {
                navigate(buildProjectApuEditorPath(revisionProject));
                return;
            }
            navigate('/precios-unitarios');
        } catch (error) {
            globalThis.reportClientError?.("Error al activar revisión del proyecto:", error);
            appAlert("No se pudo activar la base de la revisión.");
        }
    };

    const handleCreateRevision = async (projectId) => {
        const confirmed = await appConfirm({
            title: 'Clonar proyecto completo',
            message: '¿Está seguro de clonar el proyecto completo como una nueva revisión? Se copiarán datos del proyecto, base, EDT y presupuestos.',
            confirmLabel: 'Clonar completo',
            cancelLabel: 'Cancelar',
            tone: 'warning'
        });
        if (!confirmed) return;
        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const createdRevision = await proyectosApi.createRevision(projectId, empId);
            const rootCode = createdRevision?.codigo_root || createdRevision?.codigo;
            const revisionEmpresaId = createdRevision?.empresa_id || empId;
            await fetchProyectos();
            if (rootCode) {
                try {
                    await refreshRevisionFamilyState(rootCode, revisionEmpresaId, selectedProject);
                } catch (refreshError) {
                    globalThis.reportClientError?.("Error refrescando revisiones tras clonado completo:", refreshError);
                }
            }
            setShowRevisionModal(false);
            setRevisionModalMode('open');
            await activateProjectSelection(createdRevision, { replace: true });
            appAlert("Nueva revisión generada con éxito.");
        } catch (error) {
            globalThis.reportClientError?.("Error al crear revisión:", error);
            appAlert("No se pudo generar la nueva revisión.");
        }
    };

    const handleCloseSelectedProject = useCallback(() => {
        setSelectedProject(null);
        setActiveProject(null);
        const params = new URLSearchParams(location.search);
        params.delete('project_id');
        params.delete('tab');
        const nextSearch = params.toString();
        navigate(
            {
                pathname: location.pathname,
                search: nextSearch ? `?${nextSearch}` : '',
            },
            { replace: true }
        );
    }, [location.pathname, location.search, navigate, setActiveProject]);

    const refreshRevisionFamilyState = useCallback(async (rootCode, empresaId, rootProjectFallback = null) => {
        if (!rootCode) return [];

        const refreshed = await proyectosApi.getRevisions(rootCode, { empresa_id: empresaId });
        const revisionList = Array.isArray(refreshed) ? refreshed : [];
        const rootProject = revisionList.find((revisionProject) => Number(revisionProject?.revision || 0) === 0)
            || rootProjectFallback
            || revisionList[0]
            || null;
        const mergedRevisionList = rootProject
            ? buildInlineRevisionList(rootProject, revisionList)
            : revisionList;
        const revisionBudgets = {};

        await Promise.all(
            mergedRevisionList.map(async (revisionProject) => {
                try {
                    const presRes = await presupuestosApi.getByProyecto(
                        revisionProject.id,
                        revisionProject.empresa_id || empresaId
                    );
                    const presupuestos = presRes?.data || [];
                    revisionBudgets[revisionProject.id] = buildRevisionBudgetEntry(
                        presupuestos[0] || null,
                        revisionProject.moneda || rootProject?.moneda || 'USD'
                    );
                } catch {
                    revisionBudgets[revisionProject.id] = buildRevisionBudgetEntry(
                        null,
                        revisionProject.moneda || rootProject?.moneda || 'USD'
                    );
                }
            })
        );

        setProjectRevisions(mergedRevisionList);
        setRevisionBudgetMap(revisionBudgets);
        setInlineRevisionsByRoot((current) => ({
            ...current,
            [rootCode]: mergedRevisionList,
        }));
        setInlineRevisionBudgetMapByRoot((current) => ({
            ...current,
            [rootCode]: revisionBudgets,
        }));
        setKanbanRevisionOptionsByRoot((current) => ({
            ...current,
            [rootCode]: mergedRevisionList,
        }));
        setPortfolioCalendarRevisionMapByRoot((current) => ({
            ...current,
            [rootCode]: mergedRevisionList,
        }));

        return mergedRevisionList;
    }, [buildRevisionBudgetEntry]);

    const handlePersistKanbanPhase = useCallback(async (project, targetColumnId, approvedRevision = null) => {
        if (!project || !targetColumnId) return;

        const targetColumn = PROJECTS_KANBAN_COLUMNS.find((column) => column.id === targetColumnId);
        if (!targetColumn) return;

        const empId = project.empresa_id || selectedEmpresa?.id || user?.empresa_id;
        const nextState = targetColumn.state;
        const previousProjects = proyectos;
        const currentConfig = project?.plantillas_config && typeof project.plantillas_config === 'object'
            ? project.plantillas_config
            : {};
        const nextPlantillasConfig = {
            ...currentConfig,
            kanban: {
                ...getProjectKanbanConfig(project),
                ...(approvedRevision ? {
                    approved_revision_id: approvedRevision.id,
                    approved_revision: Number(approvedRevision.revision || 0),
                } : {}),
            },
        };

        setKanbanUpdatingProjectId(project.id);
        setProyectos((current) => current.map((entry) => (
            entry.id === project.id
                ? {
                    ...entry,
                    estado: nextState,
                    plantillas_config: nextPlantillasConfig,
                }
                : entry
        )));

        try {
            await proyectosApi.update(project.id, {
                estado: nextState,
                plantillas_config: nextPlantillasConfig,
            }, empId);
        } catch (error) {
            globalThis.reportClientError?.('Error actualizando estado Kanban del proyecto:', error);
            setProyectos(previousProjects);
            appAlert('No se pudo mover el proyecto a la fase seleccionada.');
        } finally {
            setKanbanUpdatingProjectId(null);
        }
    }, [proyectos, selectedEmpresa?.id, user?.empresa_id]);

    const handleDeleteRevision = async (revisionProject, event = null) => {
        event?.stopPropagation?.();
        if (!revisionProject || Number(revisionProject.revision || 0) === 0) {
            await appAlert('La revisión base R000 no puede eliminarse.');
            return;
        }

        const firstConfirm = await appConfirm({
            title: `Eliminar revisión R${String(revisionProject.revision || 0).padStart(3, '0')}`,
            message: `Se eliminará únicamente esta revisión del proyecto ${revisionProject.codigo_root || revisionProject.codigo}. La revisión base R000 se conservará.`,
            confirmLabel: 'Continuar',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (!firstConfirm) return;

        const secondConfirm = await appConfirm({
            title: 'Confirmación final',
            message: '¿Está absolutamente seguro? Esta acción eliminará de forma irreversible la revisión, su base de proyecto, presupuestos y estructura asociada.',
            confirmLabel: 'Eliminar revisión',
            cancelLabel: 'Volver',
            tone: 'danger',
        });
        if (!secondConfirm) return;

        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            const rootCode = revisionProject.codigo_root || revisionProject.codigo;
            await proyectosApi.deleteRevision(revisionProject.id, empId);

            const refreshed = await refreshRevisionFamilyState(rootCode, empId, selectedProject);
            if (selectedProject?.id === revisionProject.id) {
                const fallbackProject = refreshed.find((entry) => Number(entry?.revision || 0) === 0) || refreshed[0] || null;
                if (fallbackProject) {
                    await activateProjectSelection(fallbackProject, { replace: true });
                } else {
                    handleCloseSelectedProject();
                }
            }
            await fetchProyectos();
            await appAlert('Revisión eliminada correctamente.');
        } catch (error) {
            globalThis.reportClientError?.("Error eliminando revisión:", error);
            await appAlert(error?.response?.data?.detail || 'No se pudo eliminar la revisión.');
        }
    };

    const handleRevisionModalSelection = useCallback(async (selectedRevision) => {
        if (!selectedRevision) return;

        if (revisionModalMode === 'kanban-approval' && pendingKanbanTransition?.project && pendingKanbanTransition?.targetColumnId) {
            await handlePersistKanbanPhase(
                pendingKanbanTransition.project,
                pendingKanbanTransition.targetColumnId,
                selectedRevision
            );
            setPendingKanbanTransition(null);
            setShowRevisionModal(false);
            setRevisionModalMode('open');
            return;
        }

        await activateProjectSelection(selectedRevision);
        setShowRevisionModal(false);
        setRevisionModalMode('open');
    }, [activateProjectSelection, handlePersistKanbanPhase, pendingKanbanTransition, revisionModalMode]);

    const openProjectDeleteModal = useCallback((project, event = null) => {
        if (event) {
            event.preventDefault?.();
            event.stopPropagation?.();
            event.nativeEvent?.stopImmediatePropagation?.();
        }
        if (!project || !canManagePortfolioDeletes) return;

        setProjectToDelete(project);
        setDeleteStep(1);
        setDeleteProjectBase(true);
        setShowDeleteModal(true);
    }, [canManagePortfolioDeletes]);

    useEffect(() => {
        if (!canManagePortfolioDeletes) return undefined;

        const handleNativeProjectDeleteClick = (event) => {
            const trigger = event.target?.closest?.('[data-project-delete-action="true"]');
            if (!trigger) return;

            const projectId = trigger.getAttribute('data-project-id');
            const project = proyectos.find((item) => String(item.id) === String(projectId));
            openProjectDeleteModal(project, event);
        };

        document.addEventListener('click', handleNativeProjectDeleteClick, true);
        return () => document.removeEventListener('click', handleNativeProjectDeleteClick, true);
    }, [canManagePortfolioDeletes, openProjectDeleteModal, proyectos]);

    const handleDeleteProject = async () => {
        if (!projectToDelete) return;

        try {
            setDeleting(true);
            const empId = projectToDelete.empresa_id || selectedEmpresa?.id || user?.empresa_id;
            await proyectosApi.delete(projectToDelete.id, empId, { deleteProjectBase });
            await fetchProyectos();
            setShowDeleteModal(false);
            setProjectToDelete(null);
            setDeleteStep(1);
            setDeleteProjectBase(true);
            // Si el proyecto borrado era el que estaba abierto, cerrarlo
            if (selectedProject && (selectedProject.codigo_root === projectToDelete.codigo_root)) {
                setSelectedProject(null);
            }
        } catch (error) {
            globalThis.reportClientError?.("Error eliminando proyecto:", error);
            appAlert(error?.response?.data?.detail || "Error al eliminar el proyecto. Verifique sus permisos.");
        } finally {
            setDeleting(false);
        }
    };

    const formatRecycleDateTime = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const fetchRecycledProjects = async () => {
        const empId = selectedEmpresa?.id || user?.empresa_id;
        setRecycleLoading(true);
        try {
            const data = await proyectosApi.getRecycleBin(empId ? { empresa_id: empId } : {});
            setRecycledProjects(Array.isArray(data) ? data : []);
        } catch (error) {
            globalThis.reportClientError?.('Error cargando papelera de proyectos:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo cargar la papelera de proyectos.');
        } finally {
            setRecycleLoading(false);
        }
    };

    const openProjectRecycleModal = async () => {
        setShowRecycleModal(true);
        await fetchRecycledProjects();
    };

    const handleRestoreRecycledProject = async (project) => {
        if (!project?.id) return;
        const empId = project.empresa_id || selectedEmpresa?.id || user?.empresa_id;
        setRecycleActionId(project.id);
        try {
            await proyectosApi.restoreFromRecycleBin(project.id, empId);
            await fetchRecycledProjects();
            await fetchProyectos();
        } catch (error) {
            globalThis.reportClientError?.('Error restaurando proyecto:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo restaurar el proyecto.');
        } finally {
            setRecycleActionId(null);
        }
    };

    const handlePurgeRecycledProject = async (project) => {
        if (!project?.id) return;
        const confirmed = await appConfirm({
            title: 'Borrado definitivo',
            message: `Se eliminará definitivamente ${project.trash_original_nombre || project.nombre}. Esta acción no se puede deshacer. ¿Desea continuar?`,
            confirmLabel: 'Borrar definitivamente',
            cancelLabel: 'Cancelar',
            tone: 'danger'
        });
        if (!confirmed) return;

        const empId = project.empresa_id || selectedEmpresa?.id || user?.empresa_id;
        setRecycleActionId(project.id);
        try {
            await proyectosApi.purgeFromRecycleBin(project.id, empId);
            await fetchRecycledProjects();
        } catch (error) {
            globalThis.reportClientError?.('Error purgando proyecto:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo borrar definitivamente el proyecto.');
        } finally {
            setRecycleActionId(null);
        }
    };

    const filteredProjects = useMemo(() => (
        sortProjectsByLatestUpdate(proyectos.filter((project) => {
            const matchesSearch =
                includesNormalized(project.nombre, searchTerm) ||
                includesNormalized(project.codigo, searchTerm) ||
                includesNormalized(project.descripcion, searchTerm) ||
                includesNormalized(getProjectClientLabel(project, selectedEmpresa), searchTerm);

            if (!matchesSearch) {
                return false;
            }

            if (portfolioFilter === 'con-revisiones') {
                return hasProjectRevisions(project);
            }
            if (portfolioFilter === 'sin-revisiones') {
                return !hasProjectRevisions(project);
            }
            return true;
        }))
    ), [portfolioFilter, proyectos, searchTerm, selectedEmpresa]);

    const portfolioMetrics = useMemo(() => {
        const totalProjects = filteredProjects.length;
        const totalRevisions = filteredProjects.reduce((sum, project) => sum + getProjectRevisionCount(project), 0);
        const projectsInReview = filteredProjects.filter((project) => hasProjectRevisions(project)).length;
        const totalBudget = filteredProjects.reduce((sum, project) => {
            const calculated = getProjectCalculatedBudget(project);
            const entity = getProjectEntityBudget(project);
            return sum + (calculated ?? entity ?? 0);
        }, 0);

        return {
            totalProjects,
            totalRevisions,
            projectsInReview,
            totalBudget,
        };
    }, [filteredProjects]);

    const portfolioMetricCards = useMemo(() => ([
        {
            id: 'projects',
            label: 'Total proyectos',
            value: portfolioMetrics.totalProjects,
            caption: 'Portafolio activo',
            tag: 'Activo',
            icon: Building2,
            iconBoxClasses: 'border-zinc-200 bg-zinc-50 text-[#136191]',
            tagClasses: 'border-zinc-200 bg-zinc-50 text-zinc-600',
            dotClasses: 'bg-[#136191]',
        },
        {
            id: 'revisions',
            label: 'Revisiones',
            value: portfolioMetrics.totalRevisions,
            caption: 'Historial consolidado',
            tag: 'Rev',
            icon: FileText,
            iconBoxClasses: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            tagClasses: 'border-emerald-200 bg-emerald-50 text-emerald-700',
            dotClasses: 'bg-emerald-600',
        },
        {
            id: 'review',
            label: 'En revisión',
            value: portfolioMetrics.projectsInReview,
            caption: 'Versiones abiertas',
            tag: 'Open',
            icon: AlertTriangle,
            iconBoxClasses: 'border-orange-200 bg-orange-50 text-[#F39200]',
            tagClasses: 'border-orange-200 bg-orange-50 text-[#F39200]',
            dotClasses: 'bg-[#F39200]',
        },
        {
            id: 'budget',
            label: 'Presupuesto',
            value: formatMoneda(portfolioMetrics.totalBudget),
            caption: 'Lectura presupuestaria',
            tag: 'COP',
            icon: Calculator,
            iconBoxClasses: 'border-[#E7C9BC] bg-[#FFF4EE] text-[#B85A3A]',
            tagClasses: 'border-[#E7C9BC] bg-[#FFF4EE] text-[#B85A3A]',
            dotClasses: 'bg-[#B85A3A]',
        },
    ]), [portfolioMetrics, formatMoneda]);

    const calendarCells = useMemo(() => buildMonthMatrix(portfolioCalendarDate), [portfolioCalendarDate]);
    const selectedCalendarDayDate = useMemo(() => {
        const [year, month, day] = String(portfolioCalendarSelectedKey || '').split('-').map(Number);
        if (!year || !month || !day) return null;
        return new Date(year, month - 1, day);
    }, [portfolioCalendarSelectedKey]);

    const portfolioCalendarRevisionsByRoot = useMemo(() => {
        const merged = { ...portfolioCalendarRevisionMapByRoot };

        Object.entries(inlineRevisionsByRoot).forEach(([rootCode, revisions]) => {
            if (Array.isArray(revisions) && revisions.length > 0) {
                merged[rootCode] = revisions;
            }
        });

        Object.entries(kanbanRevisionOptionsByRoot).forEach(([rootCode, revisions]) => {
            if (Array.isArray(revisions) && revisions.length > 0) {
                merged[rootCode] = revisions;
            }
        });

        if (projectForRevisions) {
            const revisionsRootCode = projectForRevisions.codigo_root || projectForRevisions.codigo;
            if (revisionsRootCode && Array.isArray(projectRevisions) && projectRevisions.length > 0) {
                merged[revisionsRootCode] = buildInlineRevisionList(projectForRevisions, projectRevisions);
            }
        }

        return merged;
    }, [
        buildInlineRevisionList,
        inlineRevisionsByRoot,
        kanbanRevisionOptionsByRoot,
        portfolioCalendarRevisionMapByRoot,
        projectForRevisions,
        projectRevisions,
    ]);

    useEffect(() => {
        if (!showPortfolioFilters) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (!portfolioFilterMenuRef.current?.contains(event.target)) {
                setShowPortfolioFilters(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setShowPortfolioFilters(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [showPortfolioFilters]);

    const calendarEventsByDate = useMemo(() => {
        const events = {};
        const pushEvent = (rawDate, eventData) => {
            if (!rawDate || !eventData) return;
            const parsedDate = new Date(rawDate);
            if (Number.isNaN(parsedDate.getTime())) return;
            const key = toCalendarDateKey(parsedDate);
            events[key] = events[key] || [];
            events[key].push(eventData);
        };

        filteredProjects.forEach((project) => {
            const rootCode = project.codigo_root || project.codigo;
            const detail = projectDetailsMap[rootCode];
            const progressPct = getProjectProgressPct(project, detail);
            const workflowState = getProjectDisplayState(project, filteredProjects);
            const baseEventPayload = {
                id: project.id,
                rootCode,
                state: workflowState,
                client: getProjectClientLabel(project, selectedEmpresa),
                budget: getProjectCalculatedBudget(project) ?? getProjectEntityBudget(project),
                moneda: project.moneda || 'USD',
                progressPct,
                hasRevisions: hasProjectRevisions(project),
            };
            const revisionFamily = (portfolioCalendarRevisionsByRoot[rootCode] || []).filter((revisionProject) => Number(revisionProject?.revision || 0) > 0);
            const kanbanConfig = project?.plantillas_config?.kanban || {};
            const approvedRevisionId = Number(kanbanConfig.approved_revision_id || 0);
            const approvedRevisionNumber = Number(kanbanConfig.approved_revision || 0);
            const approvedRevision = revisionFamily.find((revisionProject) => (
                (approvedRevisionId > 0 && Number(revisionProject.id || 0) === approvedRevisionId)
                || (approvedRevisionNumber > 0 && Number(revisionProject.revision || 0) === approvedRevisionNumber)
            )) || (revisionFamily.length === 1 ? revisionFamily[0] : null);

            pushEvent(detail?.fecha_creacion || project.fecha_creacion, {
                ...baseEventPayload,
                id: `project-created-${project.id}`,
                project,
                kind: 'project-created',
                name: project.nombre,
                label: 'Alta del proyecto',
                meta: getPortfolioAutomaticEventMeta('project-created'),
            });

            pushEvent(detail?.fecha_inicio || project.fecha_inicio, {
                ...baseEventPayload,
                id: `project-start-${project.id}`,
                project,
                kind: 'project-start',
                name: project.nombre,
                label: 'Inicio operativo del proyecto',
                meta: getPortfolioAutomaticEventMeta('project-start'),
            });

            pushEvent(detail?.fecha_finalizacion || project.fecha_fin_estimada, {
                ...baseEventPayload,
                id: `project-finish-${project.id}`,
                project,
                kind: 'project-finish',
                name: project.nombre,
                label: workflowState === 'Finalizado' ? 'Hito de finalización' : 'Fin estimado / fecha objetivo',
                meta: getPortfolioAutomaticEventMeta('project-finish'),
            });

            revisionFamily.forEach((revisionProject) => {
                pushEvent(revisionProject.fecha_creacion, {
                    ...baseEventPayload,
                    id: `revision-created-${revisionProject.id}`,
                    project: revisionProject,
                    kind: 'revision-created',
                    name: revisionProject.nombre || project.nombre,
                    label: `Creación de revisión R${String(revisionProject.revision || 0).padStart(3, '0')}`,
                    meta: getPortfolioAutomaticEventMeta('revision-created'),
                });
            });

            if (approvedRevision && ['Licitación / Aprobación', 'En ejecución', 'Finalizado'].includes(workflowState)) {
                pushEvent(approvedRevision.ultima_modificacion || project.ultima_modificacion || approvedRevision.fecha_creacion, {
                    ...baseEventPayload,
                    id: `revision-approved-${approvedRevision.id}`,
                    project: approvedRevision,
                    kind: 'revision-approved',
                    name: approvedRevision.nombre || project.nombre,
                    label: `Revisión aprobada R${String(approvedRevision.revision || 0).padStart(3, '0')}`,
                    meta: getPortfolioAutomaticEventMeta('revision-approved'),
                });
            }
        });
        return events;
    }, [filteredProjects, portfolioCalendarRevisionsByRoot, projectDetailsMap, selectedEmpresa]);

    const selectedCalendarDayEvents = useMemo(
        () => calendarEventsByDate[portfolioCalendarSelectedKey] || [],
        [calendarEventsByDate, portfolioCalendarSelectedKey]
    );

    const calendarEntriesByDate = useMemo(() => {
        const entries = {};
        portfolioCalendarEntries.forEach((entry) => {
            const key = entry.calendar_date;
            entries[key] = entries[key] || [];
            entries[key].push(entry);
        });
        return entries;
    }, [portfolioCalendarEntries]);

    const selectedCalendarDayEntries = useMemo(
        () => calendarEntriesByDate[portfolioCalendarSelectedKey] || [],
        [calendarEntriesByDate, portfolioCalendarSelectedKey]
    );

    const calendarMixedItemsByDate = useMemo(() => {
        const mixed = {};
        Object.entries(calendarEventsByDate).forEach(([key, items]) => {
            mixed[key] = [
                ...(mixed[key] || []),
                ...items.map((eventItem) => ({
                    id: `project-${eventItem.id}`,
                    kind: 'event',
                    label: eventItem.name,
                    title: eventItem.name,
                    subtitle: eventItem.client,
                    summary: eventItem.label,
                    classes: eventItem.meta.classes,
                    dotClasses: eventItem.meta.dotClasses,
                    badge: eventItem.meta.badge,
                    sortOrder: 10,
                    data: eventItem,
                })),
            ];
        });
        Object.entries(calendarEntriesByDate).forEach(([key, items]) => {
            mixed[key] = [
                ...(mixed[key] || []),
                ...items.map((entry) => {
                    const meta = getPortfolioCalendarEntryMeta(entry.entry_type);
                    return {
                        id: `entry-${entry.id}`,
                        kind: 'entry',
                        label: entry.title || entry.message,
                        title: entry.title || getPortfolioCalendarEntryTypeLabel(entry.entry_type),
                        subtitle: entry.author_name || entry.author_email || 'Usuario',
                        summary: entry.message,
                        classes: meta.classes,
                        dotClasses: meta.dotClasses,
                        badge: meta.badge,
                        sortOrder: entry.entry_type === 'broadcast' ? 20 : entry.entry_type === 'annotation' ? 30 : 40,
                        data: entry,
                    };
                }),
            ];
        });

        Object.keys(mixed).forEach((key) => {
            mixed[key] = mixed[key].sort((left, right) => left.sortOrder - right.sortOrder);
        });
        return mixed;
    }, [calendarEntriesByDate, calendarEventsByDate]);

    const calendarMixedPreviewByDate = useMemo(() => {
        const preview = {};
        Object.entries(calendarMixedItemsByDate).forEach(([key, items]) => {
            preview[key] = items.slice(0, PORTFOLIO_CALENDAR_PREVIEW_LIMIT);
        });
        return preview;
    }, [calendarMixedItemsByDate]);

    const selectedCalendarDayMixedItems = useMemo(
        () => calendarMixedItemsByDate[portfolioCalendarSelectedKey] || [],
        [calendarMixedItemsByDate, portfolioCalendarSelectedKey]
    );

    const portfolioCalendarHoveredItem = useMemo(
        () => selectedCalendarDayMixedItems.find((item) => item.id === portfolioCalendarHoveredItemId) || null,
        [portfolioCalendarHoveredItemId, selectedCalendarDayMixedItems]
    );
    const portfolioTodosVisibleItems = useMemo(() => {
        const ordered = [...portfolioTodos].sort((a, b) => {
            if (a.is_completed !== b.is_completed) {
                return a.is_completed ? 1 : -1;
            }
            if ((a.sort_order || 0) !== (b.sort_order || 0)) {
                return (a.sort_order || 0) - (b.sort_order || 0);
            }
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });

        if (portfolioTodoFilter === 'active') {
            return ordered.filter((item) => !item.is_completed);
        }
        if (portfolioTodoFilter === 'completed') {
            return ordered.filter((item) => item.is_completed);
        }
        return ordered;
    }, [portfolioTodoFilter, portfolioTodos]);
    const portfolioTodoStorageKey = useMemo(
        () => getPortfolioTodoStorageKey(selectedEmpresa?.id || user?.empresa_id, user?.id),
        [selectedEmpresa?.id, user?.empresa_id, user?.id]
    );

    const selectedCalendarDayHasOverflow = selectedCalendarDayMixedItems.length > PORTFOLIO_CALENDAR_PREVIEW_LIMIT;

    const portfolioCalendarLegend = useMemo(() => ([
        { id: 'created', label: 'Alta de proyecto', classes: 'bg-zinc-100 text-zinc-700 border-zinc-200' },
        { id: 'start', label: 'Inicio operativo', classes: 'bg-sky-50 text-sky-700 border-sky-200' },
        { id: 'revision', label: 'Creación de revisión', classes: 'bg-blue-50 text-[#136191] border-blue-200' },
        { id: 'approval', label: 'Revisión aprobada', classes: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
        { id: 'milestone', label: 'Fin estimado / hito', classes: 'bg-amber-50 text-amber-700 border-amber-200' },
        { id: 'annotation', label: 'Anotaciones', classes: 'bg-sky-50 text-sky-700 border-sky-200' },
        { id: 'personal', label: 'Notas privadas', classes: 'bg-violet-50 text-violet-700 border-violet-200' },
        { id: 'broadcast', label: 'Comunicados', classes: 'bg-orange-50 text-[#F39200] border-orange-200' },
    ]), []);

    useEffect(() => {
        if (!showPortfolioCalendarModal) {
            return undefined;
        }

        let cancelled = false;
        const loadCalendarEntries = async () => {
            try {
                setPortfolioCalendarEntriesLoading(true);
                setPortfolioCalendarEntriesError('');
                const empId = selectedEmpresa?.id || user?.empresa_id;
                const firstDate = calendarCells[0];
                const lastDate = calendarCells[calendarCells.length - 1];
                const entries = await projectCalendarEntriesApi.getAll({
                    empresa_id: empId,
                    start_date: toCalendarDateKey(firstDate),
                    end_date: toCalendarDateKey(lastDate),
                });
                if (!cancelled) {
                    setPortfolioCalendarEntries(Array.isArray(entries) ? entries : []);
                    setPortfolioCalendarEntriesAvailable(true);
                }
            } catch (error) {
                globalThis.reportClientError?.('Error cargando entradas del calendario del portafolio:', error);
                if (!cancelled) {
                    setPortfolioCalendarEntries([]);
                    setPortfolioCalendarEntriesAvailable(false);
                    setPortfolioCalendarEntriesError(getCalendarApiErrorMessage(error));
                }
            } finally {
                if (!cancelled) {
                    setPortfolioCalendarEntriesLoading(false);
                }
            }
        };

        loadCalendarEntries();
        return () => {
            cancelled = true;
        };
    }, [calendarCells, selectedEmpresa?.id, showPortfolioCalendarModal, user?.empresa_id]);

    useEffect(() => {
        if (!showPortfolioCalendarModal) {
            return undefined;
        }

        let cancelled = false;
        const readLocalTodos = () => {
            try {
                const raw = localStorage.getItem(portfolioTodoStorageKey);
                const parsed = raw ? JSON.parse(raw) : [];
                return Array.isArray(parsed) ? parsed : [];
            } catch {
                return [];
            }
        };
        const loadPersonalTodos = async () => {
            setPortfolioTodosLoading(true);
            setPortfolioTodosError('');
            try {
                const todos = await personalTodosApi.getAll({
                    include_completed: true,
                    empresa_id: selectedEmpresa?.id || user?.empresa_id,
                });
                if (!cancelled) {
                    setPortfolioTodos(Array.isArray(todos) ? todos : []);
                    setPortfolioTodosMode('remote');
                }
            } catch (error) {
                globalThis.reportClientError?.('Error cargando pendientes personales:', error);
                if (!cancelled) {
                    setPortfolioTodos(readLocalTodos());
                    setPortfolioTodosMode('local');
                    setPortfolioTodosError('Pendientes personales en modo local para este usuario.');
                }
            } finally {
                if (!cancelled) {
                    setPortfolioTodosLoading(false);
                }
            }
        };

        loadPersonalTodos();
        return () => {
            cancelled = true;
        };
    }, [portfolioTodoStorageKey, selectedEmpresa?.id, showPortfolioCalendarModal, user?.empresa_id]);

    useEffect(() => {
        if (!showPortfolioCalendarModal) {
            return undefined;
        }

        const rootsToResolve = filteredProjects
            .filter((project) => hasProjectRevisions(project))
            .map((project) => project.codigo_root || project.codigo)
            .filter((rootCode) => rootCode && !portfolioCalendarRevisionsByRoot[rootCode]);

        if (rootsToResolve.length === 0) {
            return undefined;
        }

        let cancelled = false;
        const empId = selectedEmpresa?.id || user?.empresa_id;

        const loadRevisionFamiliesForCalendar = async () => {
            try {
                const entries = await Promise.all(
                    rootsToResolve.map(async (rootCode) => {
                        const rootProject = filteredProjects.find((candidate) => (candidate.codigo_root || candidate.codigo) === rootCode);
                        if (!rootProject) return [rootCode, []];
                        try {
                            const revisions = await proyectosApi.getRevisions(rootCode, { empresa_id: empId });
                            return [rootCode, buildInlineRevisionList(rootProject, revisions || [])];
                        } catch (error) {
                            console.warn(`No se pudieron cargar revisiones para calendario del proyecto ${rootCode}:`, error?.message || error);
                            return [rootCode, buildInlineRevisionList(rootProject, [])];
                        }
                    })
                );

                if (!cancelled) {
                    setPortfolioCalendarRevisionMapByRoot((current) => ({
                        ...current,
                        ...Object.fromEntries(entries),
                    }));
                }
            } catch (error) {
                globalThis.reportClientError?.('Error cargando familias de revisiones para el calendario:', error);
            }
        };

        loadRevisionFamiliesForCalendar();
        return () => {
            cancelled = true;
        };
    }, [
        buildInlineRevisionList,
        filteredProjects,
        portfolioCalendarRevisionsByRoot,
        selectedEmpresa?.id,
        showPortfolioCalendarModal,
        user?.empresa_id,
    ]);

    useEffect(() => {
        if (!showPortfolioCalendarModal) {
            return;
        }

        const selectedDate = selectedCalendarDayDate;
        if (
            selectedDate &&
            selectedDate.getFullYear() === portfolioCalendarDate.getFullYear() &&
            selectedDate.getMonth() === portfolioCalendarDate.getMonth()
        ) {
            return;
        }

        const currentMonthKeys = calendarCells
            .filter((date) => date.getMonth() === portfolioCalendarDate.getMonth())
            .map((date) => toCalendarDateKey(date));
        const firstDayWithEvents = currentMonthKeys.find((key) => ((calendarEventsByDate[key] || []).length + (calendarEntriesByDate[key] || []).length) > 0);
        setPortfolioCalendarSelectedKey(firstDayWithEvents || toCalendarDateKey(new Date(portfolioCalendarDate.getFullYear(), portfolioCalendarDate.getMonth(), 1)));
    }, [calendarCells, calendarEntriesByDate, calendarEventsByDate, portfolioCalendarDate, selectedCalendarDayDate, showPortfolioCalendarModal]);

    useEffect(() => {
        if (!showPortfolioCalendarModal) {
            setPortfolioCalendarHoveredItemId(null);
            setPortfolioCalendarQuickAddKey(null);
            return;
        }

        setPortfolioCalendarQuickAddKey(null);
        setPortfolioCalendarHoveredItemId((current) => {
            if (!current) {
                return selectedCalendarDayMixedItems[0]?.id || null;
            }
            const stillExists = selectedCalendarDayMixedItems.some((item) => item.id === current);
            return stillExists ? current : selectedCalendarDayMixedItems[0]?.id || null;
        });
    }, [selectedCalendarDayMixedItems, showPortfolioCalendarModal]);

    useEffect(() => {
        if (!showPortfolioCalendarModal || !portfolioCalendarQuickAddKey) {
            return undefined;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setPortfolioCalendarQuickAddKey(null);
            }
        };

        const handlePointerDown = (event) => {
            const quickCell = portfolioCalendarCellRefs.current[portfolioCalendarQuickAddKey];
            if (quickCell && !quickCell.contains(event.target)) {
                setPortfolioCalendarQuickAddKey(null);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handlePointerDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handlePointerDown);
        };
    }, [portfolioCalendarQuickAddKey, showPortfolioCalendarModal]);

    const kanbanProjectsByColumn = useMemo(() => {
        const grouped = Object.fromEntries(PROJECTS_KANBAN_COLUMNS.map((column) => [column.id, []]));
        filteredProjects.forEach((project) => {
            const columnId = resolveProjectKanbanColumn(getProjectWorkflowState(project));
            grouped[columnId].push(project);
        });
        return grouped;
    }, [filteredProjects]);

    const expandedInlineProject = useMemo(
        () => filteredProjects.find((project) => (project.codigo_root || project.codigo) === expandedProjectRoot) || null,
        [expandedProjectRoot, filteredProjects]
    );

    useEffect(() => {
        if (portfolioView !== 'lista' || !expandedProjectRoot) {
            setPortfolioInlinePanelLayout(null);
            return undefined;
        }

        const viewport = portfolioListViewportRef.current;
        const rowNode = portfolioListRowRefs.current[expandedProjectRoot];
        if (!viewport || !rowNode) {
            setPortfolioInlinePanelLayout(null);
            return undefined;
        }

        const updateLayout = () => {
            setPortfolioInlinePanelLayout({
                top: rowNode.offsetTop + rowNode.offsetHeight - 1,
            });
        };

        updateLayout();
        viewport.addEventListener('scroll', updateLayout, { passive: true });
        window.addEventListener('resize', updateLayout);
        return () => {
            viewport.removeEventListener('scroll', updateLayout);
            window.removeEventListener('resize', updateLayout);
        };
    }, [expandedProjectRoot, filteredProjects, inlineLoadingRoot, portfolioView]);

    const handleToggleInlineRevisions = useCallback(async (project, event = null) => {
        event?.stopPropagation?.();
        const rootCode = project.codigo_root || project.codigo;
        const baseBudgetValue = getProjectCalculatedBudget(project) ?? getProjectEntityBudget(project);
        const seededBudgetMap = {
            [project.id]: {
                total: baseBudgetValue,
                moneda: project.moneda || 'USD',
            },
        };

        if (expandedProjectRoot === rootCode) {
            setExpandedProjectRoot(null);
            return;
        }

        setExpandedProjectRoot(rootCode);
        if (inlineRevisionsByRoot[rootCode]) {
            return;
        }

        setInlineRevisionsByRoot((current) => ({
            ...current,
            [rootCode]: buildInlineRevisionList(project, current[rootCode] || []),
        }));
        setInlineRevisionBudgetMapByRoot((current) => ({
            ...current,
            [rootCode]: {
                ...(current[rootCode] || {}),
                ...seededBudgetMap,
            },
        }));

        if (!hasProjectRevisions(project)) {
            return;
        }

        setInlineLoadingRoot(rootCode);
        try {
            const empIdForApi = project.empresa_id || selectedEmpresa?.id || user?.empresa_id;
            const revisions = await proyectosApi.getRevisions(rootCode, { empresa_id: empIdForApi });
            const revisionBudgets = { ...seededBudgetMap };

            await Promise.all(
                (revisions || []).map(async (revisionProject) => {
                    try {
                        const presRes = await presupuestosApi.getByProyecto(revisionProject.id, revisionProject.empresa_id || empIdForApi);
                        const presupuestos = presRes?.data || [];
                        revisionBudgets[revisionProject.id] = buildRevisionBudgetEntry(
                            presupuestos[0] || null,
                            revisionProject.moneda || project.moneda || 'USD'
                        );
                    } catch {
                        revisionBudgets[revisionProject.id] = buildRevisionBudgetEntry(
                            null,
                            revisionProject.moneda || project.moneda || 'USD'
                        );
                    }
                })
            );

            setInlineRevisionsByRoot((current) => ({
                ...current,
                [rootCode]: buildInlineRevisionList(project, revisions || []),
            }));
            setInlineRevisionBudgetMapByRoot((current) => ({ ...current, [rootCode]: revisionBudgets }));
        } catch (error) {
            globalThis.reportClientError?.('Error cargando revisiones inline:', error);
            appAlert('No se pudo cargar el historial de revisiones del proyecto.');
            setExpandedProjectRoot(null);
        } finally {
            setInlineLoadingRoot(null);
        }
    }, [
        buildRevisionBudgetEntry,
        expandedProjectRoot,
        getProjectEntityBudget,
        getProjectCalculatedBudget,
        inlineRevisionsByRoot,
        selectedEmpresa?.id,
        user?.empresa_id,
    ]);

    const loadProjectRevisionChoices = useCallback(async (project) => {
        if (!project) return [];
        const rootCode = project.codigo_root || project.codigo;
        const cached = kanbanRevisionOptionsByRoot[rootCode];
        if (cached) {
            return cached;
        }

        const empIdForApi = project.empresa_id || selectedEmpresa?.id || user?.empresa_id;
        setKanbanRevisionLoadingRoot(rootCode);
        try {
            const revisions = await proyectosApi.getRevisions(rootCode, { empresa_id: empIdForApi });
            const merged = buildInlineRevisionList(project, revisions || []);
            setKanbanRevisionOptionsByRoot((current) => ({
                ...current,
                [rootCode]: merged,
            }));
            return merged;
        } catch (error) {
            globalThis.reportClientError?.('Error cargando revisiones para Kanban:', error);
            appAlert('No se pudo cargar la lista de revisiones disponibles.');
            return [];
        } finally {
            setKanbanRevisionLoadingRoot(null);
        }
    }, [buildInlineRevisionList, kanbanRevisionOptionsByRoot, selectedEmpresa?.id, user?.empresa_id]);

    const handleToggleKanbanRevisionMenu = useCallback(async (project, event = null) => {
        event?.stopPropagation?.();
        if (!project) return;
        const rootCode = project.codigo_root || project.codigo;
        if (kanbanRevisionMenuRoot === rootCode) {
            setKanbanRevisionMenuRoot(null);
            return;
        }

        setKanbanRevisionMenuRoot(rootCode);
        await loadProjectRevisionChoices(project);
    }, [kanbanRevisionMenuRoot, loadProjectRevisionChoices]);

    const handleOpenApprovedKanbanRevision = useCallback(async (project, event = null) => {
        event?.stopPropagation?.();
        if (!project) return;
        const revisions = await loadProjectRevisionChoices(project);
        const approvedRevision = resolveApprovedKanbanRevision(project, revisions);
        await activateProjectSelection(approvedRevision);
    }, [activateProjectSelection, loadProjectRevisionChoices]);

    useEffect(() => {
        if (!kanbanRevisionMenuRoot) {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (!kanbanRevisionMenuRef.current?.contains(event.target)) {
                setKanbanRevisionMenuRoot(null);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setKanbanRevisionMenuRoot(null);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [kanbanRevisionMenuRoot]);

    const handleMoveProjectKanbanState = useCallback(async (project, targetColumnId, event = null) => {
        event?.stopPropagation?.();
        if (!project || !targetColumnId) return;

        const targetColumn = PROJECTS_KANBAN_COLUMNS.find((column) => column.id === targetColumnId);
        if (!targetColumn) return;

        const currentColumnId = resolveProjectKanbanColumn(getProjectWorkflowState(project));
        if (currentColumnId === targetColumnId) return;

        if (currentColumnId === 'planificacion' && targetColumnId === 'prefactibilidad' && hasProjectOperationalBudget(project)) {
            const confirmed = await appConfirm({
                title: 'Proyecto retraído a pre-factibilidad',
                message: 'Este proyecto ya tiene presupuesto asociado. Puede volver a `Pre-Factibilidad / Factibilidad`, pero la operación se registrará como un retroceso de fase y no eliminará presupuesto ni revisiones. ¿Desea continuar?',
                confirmLabel: 'Retraer proyecto',
                cancelLabel: 'Cancelar',
                tone: 'warning',
            });
            if (!confirmed) return;
        }

        if (currentColumnId === 'planificacion' && targetColumnId === 'licitacion') {
            const revisions = await loadProjectRevisionChoices(project);
            if (revisions.length > 1) {
                await handleOpenRevisionModal(project, { mode: 'kanban-approval', targetColumnId });
                return;
            }
            await handlePersistKanbanPhase(project, targetColumnId, revisions[0] || project);
            return;
        }

        await handlePersistKanbanPhase(project, targetColumnId);
    }, [handleOpenRevisionModal, handlePersistKanbanPhase, loadProjectRevisionChoices]);

    const handleOpenPortfolioCalendarModal = useCallback(() => {
        setShowPortfolioCalendarModal(true);
    }, []);

    const closePortfolioCalendarComposer = useCallback(() => {
        setPortfolioCalendarComposerOpen(false);
        setPortfolioCalendarEditingEntry(null);
        setPortfolioCalendarQuickAddKey(null);
        setPortfolioCalendarForm({
            entry_type: canCreateCalendarAnnotation ? 'annotation' : 'personal',
            title: '',
            message: '',
        });
    }, [canCreateCalendarAnnotation]);

    const openPortfolioCalendarComposer = useCallback((entryType = 'annotation', entry = null) => {
        setPortfolioCalendarQuickAddKey(null);
        setPortfolioCalendarEditingEntry(entry || null);
        setPortfolioCalendarForm({
            entry_type: entry?.entry_type || entryType,
            title: entry?.title || '',
            message: entry?.message || '',
        });
        setPortfolioCalendarComposerOpen(true);
    }, []);

    const handleOpenPortfolioCalendarComposerForDate = useCallback((calendarKey, entryType) => {
        if (!calendarKey) return;
        setPortfolioCalendarSelectedKey(calendarKey);
        openPortfolioCalendarComposer(entryType);
    }, [openPortfolioCalendarComposer]);

    const handleSavePortfolioCalendarEntry = useCallback(async () => {
        if (!canOperatePortfolioCalendarEntries) {
            appAlert(portfolioCalendarEntriesError || 'La capa manual del calendario no está disponible en el backend activo.');
            return;
        }
        if (!portfolioCalendarSelectedKey) {
            appAlert('Seleccione primero un día del calendario.');
            return;
        }

        const message = String(portfolioCalendarForm.message || '').trim();
        if (!message) {
            appAlert('La nota del calendario no puede quedar vacía.');
            return;
        }

        const empId = selectedEmpresa?.id || user?.empresa_id;
        const basePayload = {
            calendar_date: portfolioCalendarSelectedKey,
            title: String(portfolioCalendarForm.title || '').trim() || null,
            message,
        };

        try {
            if (portfolioCalendarEditingEntry?.id) {
                const updatedEntry = await projectCalendarEntriesApi.update(
                    portfolioCalendarEditingEntry.id,
                    basePayload,
                    empId
                );
                setPortfolioCalendarEntries((current) => current.map((entry) => (
                    entry.id === updatedEntry.id ? updatedEntry : entry
                )));
            } else {
                const createdEntry = await projectCalendarEntriesApi.create(
                    {
                        ...basePayload,
                        entry_type: portfolioCalendarForm.entry_type,
                    },
                    empId
                );
                setPortfolioCalendarEntries((current) => [...current, createdEntry]);
            }
            closePortfolioCalendarComposer();
        } catch (error) {
            globalThis.reportClientError?.('Error guardando entrada del calendario:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo guardar la entrada del calendario.');
        }
    }, [
        closePortfolioCalendarComposer,
        portfolioCalendarEditingEntry?.id,
        portfolioCalendarForm.entry_type,
        portfolioCalendarForm.message,
        portfolioCalendarForm.title,
        portfolioCalendarSelectedKey,
        canOperatePortfolioCalendarEntries,
        portfolioCalendarEntriesError,
        selectedEmpresa?.id,
        user?.empresa_id,
    ]);

    const handleDeletePortfolioCalendarEntry = useCallback(async (entry) => {
        if (!canOperatePortfolioCalendarEntries) {
            appAlert(portfolioCalendarEntriesError || 'La capa manual del calendario no está disponible en el backend activo.');
            return;
        }
        if (!entry?.id) return;

        const confirmed = await appConfirm({
            title: `Eliminar ${getPortfolioCalendarEntryTypeLabel(entry.entry_type).toLowerCase()}`,
            message: 'Esta entrada desaparecerá del calendario del portafolio. ¿Desea continuar?',
            confirmLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (!confirmed) return;

        try {
            const empId = selectedEmpresa?.id || user?.empresa_id;
            await projectCalendarEntriesApi.delete(entry.id, empId);
            setPortfolioCalendarEntries((current) => current.filter((item) => item.id !== entry.id));
            if (portfolioCalendarEditingEntry?.id === entry.id) {
                closePortfolioCalendarComposer();
            }
        } catch (error) {
            globalThis.reportClientError?.('Error eliminando entrada del calendario:', error);
            appAlert(error?.response?.data?.detail || 'No se pudo eliminar la entrada del calendario.');
        }
    }, [
        closePortfolioCalendarComposer,
        canOperatePortfolioCalendarEntries,
        portfolioCalendarEditingEntry?.id,
        portfolioCalendarEntriesError,
        selectedEmpresa?.id,
        user?.empresa_id,
    ]);

    const closePortfolioTodoComposer = useCallback(() => {
        setPortfolioTodoComposerOpen(false);
        setPortfolioTodoEditingItem(null);
        setPortfolioTodoForm({
            title: '',
            notes: '',
        });
    }, []);

    const openPortfolioTodoComposer = useCallback((todo = null) => {
        setPortfolioTodoEditingItem(todo || null);
        setPortfolioTodoForm({
            title: todo?.title || '',
            notes: todo?.notes || '',
        });
        setPortfolioTodoComposerOpen(true);
    }, []);

    const persistPortfolioTodosLocal = useCallback((nextItems) => {
        localStorage.setItem(portfolioTodoStorageKey, JSON.stringify(nextItems));
        setPortfolioTodos(nextItems);
        setPortfolioTodosMode('local');
        setPortfolioTodosError('Pendientes personales en modo local para este usuario.');
    }, [portfolioTodoStorageKey]);

    const handleSavePortfolioTodo = useCallback(async () => {
        const title = String(portfolioTodoForm.title || '').trim();
        if (!title) {
            appAlert('El recordatorio personal necesita un texto corto.');
            return;
        }

        const payload = {
            title,
            notes: String(portfolioTodoForm.notes || '').trim() || null,
        };
        const empresaId = selectedEmpresa?.id || user?.empresa_id;

        try {
            if (portfolioTodosMode === 'local') {
                const nowIso = new Date().toISOString();
                if (portfolioTodoEditingItem?.id) {
                    const nextItems = portfolioTodos.map((item) => (
                        item.id === portfolioTodoEditingItem.id
                            ? { ...item, ...payload, updated_at: nowIso }
                            : item
                    ));
                    persistPortfolioTodosLocal(nextItems);
                } else {
                    const localTodo = {
                        id: `local-${Date.now()}`,
                        empresa_id: empresaId,
                        user_id: user?.id,
                        title: payload.title,
                        notes: payload.notes,
                        is_completed: false,
                        sort_order: portfolioTodos.filter((item) => !item.is_completed).length,
                        completed_at: null,
                        created_at: nowIso,
                        updated_at: nowIso,
                    };
                    persistPortfolioTodosLocal([localTodo, ...portfolioTodos]);
                    setPortfolioTodoFilter('active');
                }
            } else {
                if (portfolioTodoEditingItem?.id) {
                    const updatedTodo = await personalTodosApi.update(portfolioTodoEditingItem.id, payload, empresaId);
                    setPortfolioTodos((current) => current.map((item) => (
                        item.id === updatedTodo.id ? updatedTodo : item
                    )));
                } else {
                    const createdTodo = await personalTodosApi.create(
                        {
                            ...payload,
                            sort_order: portfolioTodos.filter((item) => !item.is_completed).length,
                        },
                        empresaId
                    );
                    setPortfolioTodos((current) => [createdTodo, ...current]);
                    setPortfolioTodoFilter('active');
                }
            }
            closePortfolioTodoComposer();
        } catch (error) {
            globalThis.reportClientError?.('Error guardando pendiente personal:', error);
            const nowIso = new Date().toISOString();
            if (portfolioTodoEditingItem?.id) {
                const nextItems = portfolioTodos.map((item) => (
                    item.id === portfolioTodoEditingItem.id
                        ? { ...item, ...payload, updated_at: nowIso }
                        : item
                ));
                persistPortfolioTodosLocal(nextItems);
            } else {
                const localTodo = {
                    id: `local-${Date.now()}`,
                    empresa_id: empresaId,
                    user_id: user?.id,
                    title: payload.title,
                    notes: payload.notes,
                    is_completed: false,
                    sort_order: portfolioTodos.filter((item) => !item.is_completed).length,
                    completed_at: null,
                    created_at: nowIso,
                    updated_at: nowIso,
                };
                persistPortfolioTodosLocal([localTodo, ...portfolioTodos]);
                setPortfolioTodoFilter('active');
            }
            closePortfolioTodoComposer();
        }
    }, [
        closePortfolioTodoComposer,
        persistPortfolioTodosLocal,
        portfolioTodoEditingItem?.id,
        portfolioTodoForm.notes,
        portfolioTodoForm.title,
        portfolioTodosMode,
        portfolioTodos,
        selectedEmpresa?.id,
        user?.id,
        user?.empresa_id,
    ]);

    const handleTogglePortfolioTodo = useCallback(async (todo) => {
        if (!todo?.id) return;
        const empresaId = selectedEmpresa?.id || user?.empresa_id;
        const nextCompleted = !todo.is_completed;

        try {
            if (portfolioTodosMode === 'local') {
                const nextItems = portfolioTodos.map((item) => (
                    item.id === todo.id
                        ? {
                            ...item,
                            is_completed: nextCompleted,
                            completed_at: nextCompleted ? new Date().toISOString() : null,
                            updated_at: new Date().toISOString(),
                        }
                        : item
                ));
                persistPortfolioTodosLocal(nextItems);
            } else {
                const updatedTodo = await personalTodosApi.update(
                    todo.id,
                    { is_completed: nextCompleted },
                    empresaId
                );
                setPortfolioTodos((current) => current.map((item) => (
                    item.id === updatedTodo.id ? updatedTodo : item
                )));
            }
        } catch (error) {
            globalThis.reportClientError?.('Error actualizando pendiente personal:', error);
            const nextItems = portfolioTodos.map((item) => (
                item.id === todo.id
                    ? {
                        ...item,
                        is_completed: nextCompleted,
                        completed_at: nextCompleted ? new Date().toISOString() : null,
                        updated_at: new Date().toISOString(),
                    }
                    : item
            ));
            persistPortfolioTodosLocal(nextItems);
        }
    }, [persistPortfolioTodosLocal, portfolioTodos, portfolioTodosMode, selectedEmpresa?.id, user?.empresa_id]);

    const handleDeletePortfolioTodo = useCallback(async (todo) => {
        if (!todo?.id) return;
        const confirmed = await appConfirm({
            title: 'Eliminar recordatorio personal',
            message: 'Este pendiente dejará de estar disponible solo para su usuario. ¿Desea continuar?',
            confirmLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (!confirmed) return;

        const empresaId = selectedEmpresa?.id || user?.empresa_id;
        try {
            if (portfolioTodosMode === 'local') {
                persistPortfolioTodosLocal(portfolioTodos.filter((item) => item.id !== todo.id));
            } else {
                await personalTodosApi.delete(todo.id, empresaId);
                setPortfolioTodos((current) => current.filter((item) => item.id !== todo.id));
            }
            if (portfolioTodoEditingItem?.id === todo.id) {
                closePortfolioTodoComposer();
            }
        } catch (error) {
            globalThis.reportClientError?.('Error eliminando pendiente personal:', error);
            persistPortfolioTodosLocal(portfolioTodos.filter((item) => item.id !== todo.id));
        }
    }, [closePortfolioTodoComposer, persistPortfolioTodosLocal, portfolioTodoEditingItem?.id, portfolioTodos, portfolioTodosMode, selectedEmpresa?.id, user?.empresa_id]);

    const handlePortfolioViewChange = useCallback((nextView) => {
        setPortfolioView(nextView);
    }, []);

    const renderCreateProjectModal = () => (
        <AnimatePresence>
            {showCreateModal && (
                <AppModalShell isOpen={true} size="lg" zIndex="z-[100]" overlayClassName="overflow-y-auto" panelClassName="my-8">
                    <AppModalHeader
                        title="Nuevo Proyecto"
                        subtitle="Sincronización técnica y administrativa"
                        icon={Briefcase}
                        iconClassName="text-[#F39200]"
                        iconWrapClassName="border-orange-200 bg-orange-50"
                        onClose={() => setShowCreateModal(false)}
                    />
                    <div className="p-10">
                        <form onSubmit={handleCreateProject} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 opacity-60">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">Código de Proyecto (Auto)</Label>
                                    <div className="h-11 bg-zinc-100 border border-zinc-200 rounded-xl flex items-center px-4 text-xs font-bold text-zinc-500">
                                        [ Generado Automáticamente ]
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">Nombre de la Obra</Label>
                                    <Input
                                        required
                                        value={newProject.nombre}
                                        onChange={e => setNewProject({ ...newProject, nombre: e.target.value })}
                                        className="h-11 bg-white border-zinc-200 rounded-xl focus:ring-[#F39200]"
                                        placeholder="Nombre completo del proyecto"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">Base de Trabajo Inicial (PU)</Label>
                                <div className="bg-orange-50/50 p-4 rounded-[1.5rem] border border-orange-100 space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <Database className="w-3.5 h-3.5 text-[#F39200]" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#F39200]">Clonación Maestra</span>
                                    </div>
                                    <SearchableSelect
                                        options={basesMaestras.map(b => ({ id: b.id, nombre: `${b.codigo_unico} - ${b.nombre}` }))}
                                        value={newProject.source_base_id}
                                        onChange={val => setNewProject({ ...newProject, source_base_id: val })}
                                        valueKey="id"
                                        placeholder="Seleccione la base para clonar los Precios Unitarios..."
                                    />
                                    <p className="text-[8px] font-bold text-zinc-400 italic">Al crear el proyecto, se generará una copia privada de esta base para evitar alterar otras obras.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">Presupuesto Referencial</Label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 font-bold text-xs">$</span>
                                        <Input
                                            type="text"
                                            value={formatCurrencyInput(newProject.presupuesto_estimado, isInputFocused)}
                                            onChange={handleAmountChange}
                                            onFocus={() => setIsInputFocused(true)}
                                            onBlur={() => setIsInputFocused(false)}
                                            className="h-11 bg-white border-zinc-200 rounded-xl pl-8 font-black tabular-nums"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">Moneda</Label>
                                    <AnimatedSelect
                                        value={newProject.moneda}
                                        onChange={e => setNewProject({ ...newProject, moneda: e.target.value })}
                                        className="w-full h-11 bg-zinc-100 border border-zinc-200 rounded-xl px-4 text-xs font-black uppercase appearance-none outline-none"
                                    >
                                        <option value="USD">Dólares (USD)</option>
                                        <option value="EUR">Euros (EUR)</option>
                                    </AnimatedSelect>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1 italic">Descripción</Label>
                                <textarea
                                    value={newProject.descripcion}
                                    onChange={e => setNewProject({ ...newProject, descripcion: e.target.value })}
                                    className="w-full h-24 p-4 bg-white border border-zinc-200 rounded-xl text-sm font-medium outline-none focus:border-[#F39200] transition-all"
                                    placeholder="Detalles adicionales del proyecto..."
                                />
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 h-12 bg-zinc-100 text-zinc-500 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-zinc-200 transition-all"
                                >
                                    Cancelar
                                </button>
                                <LiquidButton type="submit" className="flex-[2] !h-12 !rounded-2xl bg-[#1A1A1A] text-white">
                                    <Save className="w-4 h-4" /> Crear Proyecto
                                </LiquidButton>
                            </div>
                        </form>
                    </div>
                </AppModalShell>
            )}
        </AnimatePresence>
    );

    const renderHtmlPortfolioLanding = () => (
        <div className="h-full min-h-0 overflow-y-auto overscroll-contain bg-[#F2F4F7] text-[#2B241C] [touch-action:pan-y]">
            <div className="mx-auto flex min-h-full w-full max-w-[1780px] flex-col gap-5 px-6 py-6 xl:px-10">
                <div className="rounded-[1.75rem] border border-zinc-200 bg-white px-6 py-4.5">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0 space-y-2">
                            <div className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-[#F39200]">
                                <Building2 className="h-4 w-4" />
                                Gestión de proyectos
                            </div>
                            <h1 className="truncate text-2xl font-black uppercase tracking-tight text-[#1A1A1A] xl:text-[30px]">
                                Portafolios de Infraestructura e Ingeniería
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2.5">
                            <ProjectSectionIconButton
                                icon={ArrowLeft}
                                label="Volver"
                                onClick={() => navigate('/')}
                                hintContent={<GiproyActionHint title="Volver" detail="Regresa al panel principal de GiProy." />}
                                className={`${PROJECTS_COMPACT_ACTION_BUTTON_CLASS} text-[#F39200] hover:text-[#F39200]`}
                            />
                            {['administrador', 'superadministrador'].includes(normalizedRole) && (
                                <>
                                    <ProjectSectionIconButton
                                        icon={Users}
                                        label="Gestión de personal"
                                        onClick={() => navigate('/proyectos/gestor')}
                                        hintContent={<GiproyActionHint title="Gestión de personal" detail="Abre el gestor de equipos y asignaciones del módulo Proyectos." />}
                                        className={`${PROJECTS_COMPACT_ACTION_BUTTON_CLASS} text-zinc-600 hover:text-[#136191]`}
                                    />
                                    {canUsePublicProcurementImporter && (
                                        <ProjectSectionIconButton
                                            icon={UploadCloud}
                                            label="Importar SOCE/SERCOP"
                                            onClick={() => setShowPublicProcurementImportModal(true)}
                                            hintContent={<GiproyActionHint title="Importar SOCE/SERCOP" detail="Analiza documentos de compras públicas y prepara un proyecto clásico desde la fuente técnica." />}
                                            className={`${PROJECTS_COMPACT_ACTION_BUTTON_CLASS} text-[#136191] hover:text-[#136191]`}
                                        />
                                    )}
                                    {canExportProjectsToMarketplace && selectedProject && (
                                        <ProjectMarketplaceExportButton
                                            project={selectedProject}
                                            onExport={handleExportProjectToMarketplace}
                                            exportingProjectId={marketplaceExportingProjectId}
                                            exportStatus={marketplaceExportStatuses?.[String(selectedProject?.id)]}
                                            className={`${PROJECTS_COMPACT_ACTION_BUTTON_CLASS} text-[#136191] hover:text-[#136191]`}
                                        />
                                    )}
                                    <ProjectSectionIconButton
                                        icon={Trash2}
                                        label="Papelera"
                                        onClick={openProjectRecycleModal}
                                        hintContent={<GiproyActionHint title="Papelera" detail="Consulta proyectos eliminados y restaura o purga elementos dentro de los 7 días de retención." />}
                                        className={`${PROJECTS_COMPACT_ACTION_BUTTON_CLASS} text-zinc-600 hover:text-rose-700`}
                                    />
                                    <ProjectSectionIconButton
                                        icon={Plus}
                                        label={licenseInfo?.access_mode === 'readonly'
                                            ? 'Solo lectura'
                                            : (licenseInfo?.usados?.proyectos >= licenseInfo?.limites?.proyectos && licenseInfo?.limites?.proyectos !== -1
                                                ? 'Límite alcanzado'
                                                : 'Nuevo proyecto')}
                                        onClick={() => setShowCreateModal(true)}
                                        hintContent={<GiproyActionHint
                                            title={licenseInfo?.access_mode === 'readonly'
                                                ? 'Solo lectura'
                                                : (licenseInfo?.usados?.proyectos >= licenseInfo?.limites?.proyectos && licenseInfo?.limites?.proyectos !== -1
                                                    ? 'Límite alcanzado'
                                                    : 'Nuevo proyecto')}
                                            detail={licenseInfo?.access_mode === 'readonly'
                                                ? 'La licencia activa no permite crear proyectos.'
                                                : (licenseInfo?.usados?.proyectos >= licenseInfo?.limites?.proyectos && licenseInfo?.limites?.proyectos !== -1
                                                    ? 'La empresa alcanzó el máximo de proyectos disponibles.'
                                                    : 'Crea un nuevo proyecto clásico en la empresa activa.')}
                                        />}
                                        disabled={licenseInfo?.access_mode === 'readonly' || (licenseInfo?.usados?.proyectos >= licenseInfo?.limites?.proyectos && licenseInfo?.limites?.proyectos !== -1)}
                                        className={`${PROJECTS_COMPACT_ACTION_BUTTON_CLASS} text-[#F39200] hover:text-[#F39200]`}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </div>

                <div className="rounded-[1.55rem] border border-zinc-200 bg-white px-4 py-2.5">
                    <div className="flex flex-col gap-3 2xl:flex-row 2xl:items-center 2xl:justify-between">
                        <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-center">
                            <div className="relative w-full xl:w-[340px]">
                                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Buscar proyecto, cliente, código..."
                                    className="h-10 w-full rounded-xl border border-zinc-200 bg-zinc-50 pl-10 pr-4 text-sm font-semibold text-[#1A1A1A] outline-none transition-colors placeholder:text-zinc-400 focus:border-[#F39200] focus:bg-white"
                                />
                            </div>

                            <div className="relative" ref={portfolioFilterMenuRef}>
                                <button
                                    type="button"
                                    title="Filtros"
                                    onClick={() => setShowPortfolioFilters((current) => !current)}
                                    className={`${PROJECTS_COMPACT_TOOL_BUTTON_CLASS} ${
                                        showPortfolioFilters ? PROJECTS_ICON_TOOL_BUTTON_ACTIVE_CLASS : ''
                                    }`}
                                >
                                    <Filter className="h-4 w-4" />
                                    <span>Filtros</span>
                                </button>

                                {showPortfolioFilters && (
                                    <div className="absolute left-0 top-[calc(100%+0.6rem)] z-30 min-w-[220px] rounded-[1rem] border border-[#ececec] bg-[#ededed] p-2 shadow-[4px_4px_10px_#d0d0d0,-4px_-4px_10px_#ffffff]">
                                        <div className="mb-2 px-1 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                            Filtrar portafolio
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            {PROJECTS_FILTER_OPTIONS.map((filterOption) => {
                                                const isActive = portfolioFilter === filterOption.id;
                                                return (
                                                    <button
                                                        key={filterOption.id}
                                                        type="button"
                                                        onClick={() => {
                                                            setPortfolioFilter(filterOption.id);
                                                            setShowPortfolioFilters(false);
                                                        }}
                                                        className={`${PROJECTS_FILTER_DROPDOWN_BUTTON_CLASS} ${
                                                            isActive ? 'text-[#F39200] shadow-[inset_2px_2px_8px_#d0d0d0,inset_-2px_-2px_8px_#ffffff]' : ''
                                                        }`}
                                                    >
                                                        <span>{filterOption.label}</span>
                                                        {isActive ? <Check className="h-4 w-4 shrink-0" /> : <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                                {portfolioMetricCards.map((metricCard) => {
                                    const MetricIcon = metricCard.icon;
                                    return (
                                        <div
                                            key={metricCard.id}
                                            className="inline-flex h-10 min-w-[138px] items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50/80 px-2.5"
                                            title={`${metricCard.label}: ${metricCard.value} · ${metricCard.caption}`}
                                        >
                                            <span className={`inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border ${metricCard.iconBoxClasses}`}>
                                                <MetricIcon className="h-3.5 w-3.5" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block truncate text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                                    {metricCard.label}
                                                </span>
                                                <span className="block truncate text-[13px] font-black leading-tight text-[#1A1A1A]">
                                                    {metricCard.value}
                                                </span>
                                            </span>
                                            <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${metricCard.dotClasses}`} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="flex items-center gap-2 2xl:ml-auto">
                            <button
                                type="button"
                                title="Calendario del portafolio"
                                onClick={handleOpenPortfolioCalendarModal}
                                className={`${PROJECTS_COMPACT_TOOL_BUTTON_CLASS} text-[#136191]`}
                            >
                                <CalendarDays className="h-4 w-4" />
                                <span>Calendario</span>
                            </button>
                            <ProjectSegmentedSwitch
                                value={portfolioView}
                                onChange={handlePortfolioViewChange}
                                options={PROJECTS_VIEW_OPTIONS.map((viewOption) => ({
                                    value: viewOption.id,
                                    label: viewOption.label,
                                }))}
                                size="sm"
                                className="w-full max-w-full"
                                ariaLabel="Vista del portafolio"
                            />
                        </div>
                    </div>

                </div>

                {portfolioView === 'lista' && (
                    <div className="min-w-0 overflow-hidden rounded-[2rem] border border-zinc-200 bg-white">
                        <div
                            ref={portfolioListViewportRef}
                            className="relative max-h-[calc(100dvh-15rem)] overflow-auto overscroll-contain [touch-action:pan-x_pan-y]"
                            style={expandedInlineProject ? { paddingBottom: '25rem' } : undefined}
                        >
                            <table className="w-full min-w-[1180px] table-fixed">
                                <colgroup>
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '25%' }} />
                                    <col style={{ width: '12%' }} />
                                    <col style={{ width: '9%' }} />
                                    <col style={{ width: '10%' }} />
                                    <col style={{ width: '13%' }} />
                                    <col style={{ width: '7%' }} />
                                    <col style={{ width: '8%' }} />
                                    <col style={{ width: '7%' }} />
                                </colgroup>
                                <thead>
                                    <tr className="border-b border-zinc-200 bg-zinc-50/80">
                                        <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">ID / CÓD</th>
                                        <th className="py-4 pl-12 pr-3 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Proyecto</th>
                                        <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Actualizacion</th>
                                        <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Cliente</th>
                                        <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Estado</th>
                                        <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Presupuesto</th>
                                        <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Plazo</th>
                                        <th className="px-3 py-4 text-left text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Fecha fin</th>
                                        <th className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr>
                                            <td colSpan={9} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-200 border-t-[#136191]" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Cargando portafolio...</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : projectLoadError ? (
                                        <tr>
                                            <td colSpan={9} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <AlertTriangle className="h-10 w-10 text-amber-500" />
                                                    <div className="space-y-1">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-700">No se pudo actualizar el portafolio</p>
                                                        <p className="text-xs font-medium text-zinc-500">El servicio no respondió temporalmente. Los proyectos no se han eliminado.</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={fetchProyectos}
                                                        className="inline-flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-700 shadow-sm transition-colors hover:border-[#F39200] hover:text-[#B86D00]"
                                                    >
                                                        <RotateCcw className="h-4 w-4" />
                                                        Reintentar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : filteredProjects.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-8 py-20 text-center">
                                                <div className="flex flex-col items-center gap-4">
                                                    <Building2 className="h-10 w-10 text-zinc-300" />
                                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">No hay proyectos para la vista actual</p>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredProjects.map((project) => {
                                            const rootCode = project.codigo_root || project.codigo;
                                            const detail = projectDetailsMap[rootCode];
                                            const displayState = getProjectDisplayState(project, proyectos);
                                            const calculatedBudget = getProjectCalculatedBudget(project);
                                            const referentialBudget = getProjectEntityBudget(project);
                                            const presentationMeta = getProjectPresentationMeta(project);
                                            const inlineRevisions = inlineRevisionsByRoot[rootCode] || [];
                                            const revisionUpdateMeta = getProjectRevisionUpdateMeta(project, inlineRevisions);
                                            const isExpanded = expandedProjectRoot === rootCode;
                                            const budgetDelta = calculatedBudget !== null ? calculatedBudget - referentialBudget : null;
                                            const budgetDeltaPct = referentialBudget > 0 && budgetDelta !== null
                                                ? (budgetDelta / referentialBudget) * 100
                                                : null;

                                            return (
                                                <Fragment key={project.id}>
                                                    <tr
                                                        ref={(node) => registerPortfolioListRow(rootCode, node)}
                                                        className="cursor-pointer border-b border-zinc-100 transition-colors hover:bg-zinc-50/80"
                                                        onClick={(event) => handleToggleInlineRevisions(project, event)}
                                                    >
                                                        <td className="break-words px-3 py-4 align-top text-[13px] font-black leading-snug text-[#1A1A1A]">
                                                            #{project.codigo || project.id}
                                                        </td>
                                                        <td className="px-3 py-4 align-top">
                                                            <div className="flex min-w-0 items-start gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => handleToggleInlineRevisions(project, event)}
                                                                    className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS} mt-1 h-6 w-6 shrink-0 rounded-full`}
                                                                >
                                                                    <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
                                                                </button>
                                                                <div className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-[#136191]" />
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="text-sm font-black uppercase leading-snug tracking-[0.03em] text-[#1A1A1A] break-words [overflow-wrap:anywhere]">
                                                                        {project.nombre}
                                                                    </div>
                                                                    <p className="mt-1 line-clamp-2 text-[12px] font-semibold leading-snug text-zinc-500 break-words [overflow-wrap:anywhere]">
                                                                        {project.descripcion || 'Sin descripcion registrada.'}
                                                                    </p>
                                                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                                                        <div className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">
                                                                            {Math.max(inlineRevisions.length || 0, Number(project.num_revisiones || 1))} versiones
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 align-top">
                                                            <div className="text-[12px] font-black leading-snug text-[#1A1A1A]">
                                                                {revisionUpdateMeta.label}
                                                            </div>
                                                            <div className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                                                                Mas reciente
                                                            </div>
                                                        </td>
                                                        <td className="break-words px-3 py-4 align-top text-sm font-semibold leading-snug text-zinc-600">
                                                            {getProjectClientLabel(project, selectedEmpresa)}
                                                        </td>
                                                        <td className="px-3 py-4 align-top">
                                                            <span className={`inline-flex max-w-full rounded-full px-3 py-1 text-[10px] font-black uppercase leading-snug tracking-[0.14em] ${getProjectStatusClasses(displayState)}`}>
                                                                {displayState}
                                                            </span>
                                                        </td>
                                                        <td className="px-3 py-4 align-top">
                                                            {editingEstimatedId === project.id ? (
                                                                <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                                                                    <input
                                                                        autoFocus
                                                                        type="text"
                                                                        value={formatCurrencyInput(editingEstimatedValue, true)}
                                                                        onChange={(event) => setEditingEstimatedValue(parseNumericInput(event.target.value))}
                                                                        onBlur={(event) => handleSaveEstimated(project, event)}
                                                                        onKeyDown={(event) => {
                                                                            if (event.key === 'Enter') handleSaveEstimated(project, event);
                                                                            if (event.key === 'Escape') setEditingEstimatedId(null);
                                                                        }}
                                                                        className="h-10 w-[150px] rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-black outline-none focus:border-[#136191]"
                                                                    />
                                                                    <button
                                                                        onMouseDown={(event) => event.preventDefault()}
                                                                        onClick={(event) => handleSaveEstimated(project, event)}
                                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#136191] text-white transition-colors hover:bg-[#0f4f74]"
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="space-y-1">
                                                                    <div className="text-[13px] font-black leading-snug text-[#1A1A1A]">
                                                                        {calculatedBudget === null ? 'Con revisiones' : `${formatMoneda(calculatedBudget)} ${project.moneda || 'USD'}`}
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={(event) => handleStartEstimatedEdit(project, event)}
                                                                        className="inline-flex max-w-full items-center gap-2 text-left text-[11px] font-semibold leading-snug text-zinc-500 transition-colors hover:text-[#136191]"
                                                                    >
                                                                        Ref: {formatMoneda(referentialBudget)} {project.moneda || 'USD'}
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </button>
                                                                    <div className={`text-[11px] font-bold ${budgetDelta !== null && budgetDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                                                                        {budgetDelta === null
                                                                            ? 'Sin delta'
                                                                            : `${budgetDelta >= 0 ? '▲' : '▼'} ${formatMoneda(Math.abs(budgetDelta))}${budgetDeltaPct !== null ? ` (${Math.abs(budgetDeltaPct).toFixed(2)}%)` : ''}`}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-4 align-top">
                                                            <div className="space-y-1">
                                                                <div className="text-[13px] font-black leading-snug text-[#1A1A1A]">{getProjectEstimatedTimeMeta(project, projectDetailsMap)}</div>
                                                                <div className="text-[11px] font-semibold leading-snug text-zinc-500">
                                                                    {detail?.fecha_finalizacion ? `Ubicación: ${getProjectLocationLabel(detail)}` : 'Sin fecha final definida'}
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-4 align-top">
                                                            {editingDateRoot === rootCode ? (
                                                                <div className="flex items-center gap-2" onClick={(event) => event.stopPropagation()}>
                                                                    <AnimatedDateInput
                                                                        autoFocus
                                                                        type="date"
                                                                        value={editingDateValue}
                                                                        onChange={(event) => setEditingDateValue(event.target.value)}
                                                                        onBlur={(event) => handleSavePresentationDate(project, event)}
                                                                        onKeyDown={(event) => {
                                                                            if (event.key === 'Enter') handleSavePresentationDate(project, event);
                                                                            if (event.key === 'Escape') setEditingDateRoot(null);
                                                                        }}
                                                                        className="h-10 rounded-xl border border-zinc-200 bg-zinc-50 px-3 text-sm font-black outline-none focus:border-[#136191]"
                                                                    />
                                                                    <button
                                                                        onMouseDown={(event) => event.preventDefault()}
                                                                        onClick={(event) => handleSavePresentationDate(project, event)}
                                                                        className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#136191] text-white transition-colors hover:bg-[#0f4f74]"
                                                                    >
                                                                        <Check className="h-4 w-4" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => handleStartDateEdit(project, event)}
                                                                    className="min-w-0 space-y-1 text-left transition-colors hover:text-[#136191]"
                                                                >
                                                                    <div className="text-[13px] font-black leading-snug text-[#1A1A1A]">{presentationMeta.label}</div>
                                                                    <div className="inline-flex items-center gap-2 text-[11px] font-semibold leading-snug text-zinc-500">
                                                                        {presentationMeta.fallback ? 'Base' : 'Fecha objetivo'}
                                                                        <Pencil className="h-3.5 w-3.5" />
                                                                    </div>
                                                                </button>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-4 align-top">
                                                            <div className="flex items-center justify-center gap-1.5" onClick={(event) => event.stopPropagation()}>
                                                                {!projectPermissions?.is_restricted && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            handleCreateRevision(project.id);
                                                                        }}
                                                                        className={`${PROJECTS_PORTFOLIO_ACTION_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS}`}
                                                                        title="Clonar Proyecto Completo"
                                                                        aria-label={`Clonar proyecto completo ${project.nombre || project.codigo || project.id}`}
                                                                    >
                                                                        <Copy className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                                {canExportProjectsToMarketplace && (
                                                                    <ProjectMarketplaceExportButton
                                                                        project={project}
                                                                        onExport={handleExportProjectToMarketplace}
                                                                        exportingProjectId={marketplaceExportingProjectId}
                                                                        exportStatus={marketplaceExportStatuses?.[String(project?.id)]}
                                                                        className={`${PROJECTS_PORTFOLIO_ACTION_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS}`}
                                                                    />
                                                                )}
                                                                {canManagePortfolioDeletes && (
                                                                    <button
                                                                        type="button"
                                                                        data-project-delete-action="true"
                                                                        data-project-id={project.id}
                                                                        onPointerUpCapture={(event) => openProjectDeleteModal(project, event)}
                                                                        onClickCapture={(event) => openProjectDeleteModal(project, event)}
                                                                        onClick={(event) => openProjectDeleteModal(project, event)}
                                                                        className={`${PROJECTS_PORTFOLIO_ACTION_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_DANGER_CLASS} opacity-100`}
                                                                        title="Mover proyecto a papelera"
                                                                        aria-label={`Mover proyecto a papelera ${project.nombre || project.codigo || project.id}`}
                                                                    >
                                                                        <ArchiveX className="pointer-events-none h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </Fragment>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>

                            {expandedInlineProject && portfolioInlinePanelLayout && (
                                <div
                                    className="pointer-events-none absolute left-0 right-0 z-20 px-3"
                                    style={{ top: portfolioInlinePanelLayout.top }}
                                >
                                    <div className="pointer-events-auto max-h-[min(30rem,calc(100dvh-25rem))] overflow-hidden rounded-[1.5rem] border border-zinc-200 bg-white p-5 shadow-[0_18px_35px_rgba(15,23,42,0.08)]">
                                        <div className="mb-4 flex items-center justify-between gap-4">
                                            <div className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">
                                                Historial de revisiones ({Math.max((inlineRevisionsByRoot[expandedProjectRoot] || []).length, Number(expandedInlineProject.num_revisiones || 1))} versiones)
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setExpandedProjectRoot(null)}
                                                className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS} h-8 w-8 rounded-lg`}
                                                title="Cerrar historial"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        {inlineLoadingRoot === expandedProjectRoot ? (
                                            <div className="py-12 text-center">
                                                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-zinc-200 border-t-[#136191]" />
                                            </div>
                                        ) : (
                                            <div className="max-h-[calc(min(30rem,calc(100dvh-25rem))-4.5rem)] space-y-3 overflow-auto pr-1">
                                                {(inlineRevisionsByRoot[expandedProjectRoot] || []).map((revisionProject) => {
                                                    const revisionFamilyCount = Math.max(
                                                        (inlineRevisionsByRoot[expandedProjectRoot] || []).length,
                                                        Number(expandedInlineProject?.num_revisiones || 1)
                                                    );
                                                    const revisionBudget = inlineRevisionBudgetMapByRoot[expandedProjectRoot]?.[revisionProject.id] || null;
                                                    const revisionState = getProjectDisplayState(revisionProject, proyectos);
                                                    const canDeleteRevision = canManagePortfolioDeletes && revisionFamilyCount > 1 && Number(revisionProject.revision || 0) > 0;
                                                    const revisionUpdatedLabel = new Date(
                                                        revisionProject.ultima_modificacion || revisionProject.fecha_creacion || Date.now()
                                                    ).toLocaleDateString('es-ES');
                                                    const revisionKindLabel = Number(revisionProject.revision || 0) === 0 ? 'Base' : 'Derivada';
                                                    return (
                                                        <div
                                                            key={revisionProject.id}
                                                            onClick={() => activateProjectSelection(revisionProject)}
                                                            onKeyDown={(event) => {
                                                                if (event.key === 'Enter' || event.key === ' ') {
                                                                    event.preventDefault();
                                                                    activateProjectSelection(revisionProject);
                                                                }
                                                            }}
                                                            role="button"
                                                            tabIndex={0}
                                                            className="grid w-full grid-cols-[92px,minmax(0,1.6fr),auto,auto,auto] items-center gap-x-3 gap-y-1 rounded-[1rem] border border-zinc-200 bg-zinc-50/50 px-4 py-2.5 text-left transition-colors hover:border-zinc-300 hover:bg-white"
                                                        >
                                                            <div className="text-sm font-black text-[#1A1A1A]">
                                                                REV-{String(revisionProject.revision || 0).padStart(3, '0')}
                                                            </div>
                                                            <div className="min-w-0 truncate text-sm font-bold text-[#1A1A1A]">
                                                                {revisionProject.nombre}
                                                            </div>
                                                            <div>
                                                                <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] ${getProjectStatusClasses(revisionState)}`}>
                                                                    {revisionState}
                                                                </span>
                                                            </div>
                                                            <div className="flex w-8 justify-center">
                                                                {canDeleteRevision && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            handleDeleteRevision(revisionProject, event);
                                                                        }}
                                                                        className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_DANGER_CLASS} h-8 w-8 shrink-0 rounded-lg`}
                                                                        title="Eliminar revisión"
                                                                    >
                                                                        <Trash2 className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                            <div className="text-sm font-black text-[#1A1A1A] whitespace-nowrap">
                                                                {formatMoneda(revisionBudget?.total || 0)} {revisionBudget?.moneda || revisionProject.moneda || 'USD'}
                                                            </div>
                                                            <div className="col-span-4 min-w-0 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-zinc-500">
                                                                <span>{getProjectEstimatedTimeMeta(revisionProject, projectDetailsMap)}</span>
                                                                <span className="text-zinc-300">•</span>
                                                                <span>Act. {revisionUpdatedLabel}</span>
                                                                <span className="text-zinc-300">•</span>
                                                                <span>{revisionKindLabel}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {portfolioView === 'kanban' && (
                    <div className="overflow-hidden rounded-[2rem] border border-zinc-200 bg-white">
                        <div className="max-h-[calc(100dvh-21rem)] overflow-x-auto overflow-y-hidden overscroll-contain px-3 py-3">
                            <div className="grid min-w-[1360px] gap-3 xl:grid-cols-5">
                                {PROJECTS_KANBAN_COLUMNS.map((column) => {
                                    const projectsInColumn = kanbanProjectsByColumn[column.id] || [];
                                    return (
                                        <div key={column.id} className="flex min-h-0 flex-col rounded-[1.35rem] border border-zinc-200 bg-zinc-50/60 p-2.5">
                                            <div className="mb-2.5 flex items-center justify-between gap-3 rounded-[1rem] border border-zinc-200 bg-white px-3 py-2">
                                                <div className="min-w-0">
                                                    <div className="text-[8px] font-black uppercase tracking-[0.22em] text-zinc-400">Fase</div>
                                                    <div className="mt-0.5 truncate text-xs font-black text-[#1A1A1A]">
                                                        {column.emoji} {column.label}
                                                    </div>
                                                </div>
                                                <div className="inline-flex h-7 min-w-7 items-center justify-center rounded-full border border-zinc-200 bg-zinc-50 px-2 text-[10px] font-black text-zinc-500">
                                                    {projectsInColumn.length}
                                                </div>
                                            </div>

                                            <div className="min-h-0 flex-1 overflow-auto overscroll-contain pr-1">
                                                <div className="space-y-2">
                                                    {projectsInColumn.length === 0 ? (
                                                        <div className="rounded-[1rem] border border-dashed border-zinc-200 bg-white px-3 py-6 text-center text-xs font-semibold text-zinc-400">
                                                            No hay proyectos en esta fase
                                                        </div>
                                                    ) : (
                                                        projectsInColumn.map((project) => {
                                                            const rootCode = project.codigo_root || project.codigo;
                                                            const detail = projectDetailsMap[rootCode];
                                                            const presentationMeta = getProjectPresentationMeta(project);
                                                            const budgetValue = getProjectCalculatedBudget(project) ?? getProjectEntityBudget(project);
                                                            const revisionsCount = Math.max(Number(project.num_revisiones || 1), 1);
                                                            const workflowState = getProjectWorkflowState(project);
                                                            const currentColumnId = resolveProjectKanbanColumn(workflowState);
                                                            const currentIndex = PROJECTS_KANBAN_COLUMNS.findIndex((entry) => entry.id === currentColumnId);
                                                            const previousColumn = currentIndex > 0 ? PROJECTS_KANBAN_COLUMNS[currentIndex - 1] : null;
                                                            const nextColumn = currentIndex < PROJECTS_KANBAN_COLUMNS.length - 1 ? PROJECTS_KANBAN_COLUMNS[currentIndex + 1] : null;
                                                            const isUpdatingState = kanbanUpdatingProjectId === project.id;

                                                            return (
                                                                <div key={project.id} className="rounded-[1rem] border border-zinc-200 bg-white p-2.5 transition-colors hover:border-zinc-300">
                                                                    <div className="mb-2 flex items-start justify-between gap-2">
                                                                        <div className="min-w-0 flex-1">
                                                                            <div className="truncate text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                                                #{project.codigo || project.id}
                                                                            </div>
                                                                            <div className="mt-0.5 line-clamp-1 text-xs font-black uppercase leading-4 text-[#1A1A1A]">
                                                                                {project.nombre}
                                                                            </div>
                                                                        </div>
                                                                        <div className="mt-1 h-2 w-2 rounded-full bg-[#136191]" />
                                                                    </div>

                                                                    <div className="mb-2 flex flex-wrap items-center gap-1.5">
                                                                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] ${getProjectStatusClasses(workflowState)}`}>
                                                                            {workflowState}
                                                                        </span>
                                                                        <span className="inline-flex rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-500">
                                                                            {revisionsCount} {revisionsCount === 1 ? 'versión' : 'versiones'}
                                                                        </span>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px] font-semibold text-zinc-500">
                                                                        <div className="min-w-0">
                                                                            <span className="block text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">Cliente</span>
                                                                            <span className="block truncate text-[#1A1A1A]">{getProjectClientLabel(project, selectedEmpresa)}</span>
                                                                        </div>
                                                                        <div className="min-w-0 text-right">
                                                                            <span className="block text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">Presupuesto</span>
                                                                            <span className="block truncate text-[#1A1A1A]">{formatMoneda(budgetValue)} {project.moneda || 'USD'}</span>
                                                                        </div>
                                                                        <div className="min-w-0">
                                                                            <span className="block text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">Plazo</span>
                                                                            <span className="block truncate text-[#1A1A1A]">{getProjectEstimatedTimeMeta(project, projectDetailsMap)}</span>
                                                                        </div>
                                                                        <div className="min-w-0 text-right">
                                                                            <span className="block text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">Fin</span>
                                                                            <span className="block truncate text-[#1A1A1A]">{presentationMeta.label}</span>
                                                                        </div>
                                                                        <div className="col-span-2 min-w-0 rounded-[0.8rem] bg-zinc-50 px-2 py-1">
                                                                            <span className="mr-1 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-400">Ubicación</span>
                                                                            <span className="text-[#1A1A1A]">{getProjectLocationLabel(detail)}</span>
                                                                        </div>
                                                                    </div>

                                                                    <div className="mt-2 flex items-center justify-between gap-2 border-t border-zinc-100 pt-2">
                                                                        <div className="flex items-center gap-1.5">
                                                                            <button
                                                                                type="button"
                                                                                disabled={!previousColumn || isUpdatingState}
                                                                                onClick={(event) => previousColumn && handleMoveProjectKanbanState(project, previousColumn.id, event)}
                                                                                className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS} h-7 w-7 rounded-lg disabled:pointer-events-none disabled:opacity-40`}
                                                                                title={previousColumn ? `Mover a ${previousColumn.label}` : 'Sin fase anterior'}
                                                                            >
                                                                                <ChevronRight className="h-3.5 w-3.5 rotate-180" />
                                                                            </button>
                                                                            <button
                                                                                type="button"
                                                                                disabled={!nextColumn || isUpdatingState}
                                                                                onClick={(event) => nextColumn && handleMoveProjectKanbanState(project, nextColumn.id, event)}
                                                                                className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS} h-7 w-7 rounded-lg disabled:pointer-events-none disabled:opacity-40`}
                                                                                title={nextColumn ? `Mover a ${nextColumn.label}` : 'Sin fase siguiente'}
                                                                            >
                                                                                <ChevronRight className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        </div>

                                                                        {currentColumnId === 'prefactibilidad' ? (
                                                                            <div />
                                                                        ) : currentColumnId === 'planificacion' ? (
                                                                            <div className="relative" ref={kanbanRevisionMenuRoot === rootCode ? kanbanRevisionMenuRef : null}>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={(event) => handleToggleKanbanRevisionMenu(project, event)}
                                                                                    className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS} h-7 w-7 rounded-lg`}
                                                                                    title="Revisiones disponibles"
                                                                                >
                                                                                    <Eye className="h-3.5 w-3.5" />
                                                                                </button>

                                                                                {kanbanRevisionMenuRoot === rootCode && (
                                                                                    <div className="absolute right-0 top-[calc(100%+0.55rem)] z-30 w-[240px] rounded-[1rem] border border-[#ececec] bg-[#ededed] p-2 shadow-[4px_4px_10px_#d0d0d0,-4px_-4px_10px_#ffffff]">
                                                                                        <div className="mb-2 px-1 text-[8px] font-black uppercase tracking-[0.2em] text-zinc-400">
                                                                                            Revisiones disponibles
                                                                                        </div>
                                                                                        {kanbanRevisionLoadingRoot === rootCode ? (
                                                                                            <div className="px-3 py-4 text-center text-[10px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                                                                                Cargando...
                                                                                            </div>
                                                                                        ) : (
                                                                                            <div className="flex max-h-[220px] flex-col gap-2 overflow-auto pr-1">
                                                                                                {(kanbanRevisionOptionsByRoot[rootCode] || [project]).map((revisionProject) => (
                                                                                                    <button
                                                                                                        key={revisionProject.id}
                                                                                                        type="button"
                                                                                                        onClick={(event) => {
                                                                                                            event.stopPropagation();
                                                                                                            activateProjectSelection(revisionProject);
                                                                                                            setKanbanRevisionMenuRoot(null);
                                                                                                        }}
                                                                                                        className={`${PROJECTS_FILTER_DROPDOWN_BUTTON_CLASS} justify-start`}
                                                                                                    >
                                                                                                        <div className="flex min-w-0 flex-1 flex-col items-start">
                                                                                                            <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[#136191]">
                                                                                                                REV-{String(revisionProject.revision || 0).padStart(3, '0')}
                                                                                                            </span>
                                                                                                            <span className="mt-0.5 truncate text-[10px] font-bold normal-case tracking-normal text-zinc-600">
                                                                                                                {revisionProject.nombre}
                                                                                                            </span>
                                                                                                        </div>
                                                                                                        <ChevronRight className="h-4 w-4 shrink-0 text-zinc-300" />
                                                                                                    </button>
                                                                                                ))}
                                                                                            </div>
                                                                                        )}
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        ) : (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(event) => handleOpenApprovedKanbanRevision(project, event)}
                                                                                className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS} h-7 w-7 rounded-lg`}
                                                                                title="Entrar a revisión aprobada"
                                                                            >
                                                                                <Eye className="h-3.5 w-3.5" />
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );

    const renderPortfolioCalendarModal = () => {
        if (!showPortfolioCalendarModal) return null;

        const handleCloseCalendarModal = () => {
            closePortfolioCalendarComposer();
            setShowPortfolioCalendarModal(false);
        };

        const currentMonthLabel = portfolioCalendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        const composerDateLabel = selectedCalendarDayDate
            ? selectedCalendarDayDate.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
            : portfolioCalendarSelectedKey;

        return (
            <AnimatePresence>
                <AppModalShell
                    isOpen={true}
                    size="xl"
                    zIndex="z-[115]"
                    onClose={handleCloseCalendarModal}
                    panelClassName="my-4 max-w-[1680px]"
                    overlayClassName="overflow-hidden"
                >
                    <AppModalHeader
                        title="Calendario del portafolio"
                        subtitle="Vista mensual mixta con hitos, revisiones, anotaciones y comunicados"
                        icon={CalendarDays}
                        iconClassName="text-[#136191]"
                        iconWrapClassName="border-blue-200 bg-blue-50"
                        onClose={handleCloseCalendarModal}
                    />
                    <div className="h-[calc(100dvh-10rem)] max-h-full overflow-hidden p-6">
                        <div className="flex h-full min-h-0 flex-col gap-4">
                            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.4rem] border border-zinc-200 bg-white px-3 py-2.5">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPortfolioCalendarDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1))}
                                        className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} h-10 min-w-[54px] rounded-[1rem] px-3 text-[#136191]`}
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                    </button>
                                    <div className="flex min-w-[220px] items-center rounded-[1rem] border border-zinc-200 bg-zinc-50 px-3 py-2 shadow-sm">
                                        <div className="truncate text-[1.35rem] font-extrabold uppercase tracking-[0.05em] leading-none text-[#1A1A1A]">
                                            {currentMonthLabel}
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setPortfolioCalendarDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1))}
                                        className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} h-10 min-w-[54px] rounded-[1rem] px-3 text-[#136191]`}
                                    >
                                        <ArrowRight className="h-4 w-4" />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const today = new Date();
                                            setPortfolioCalendarDate(new Date(today.getFullYear(), today.getMonth(), 1));
                                            setPortfolioCalendarSelectedKey(toCalendarDateKey(today));
                                        }}
                                        className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} h-10 min-w-[74px] rounded-[1rem] px-3`}
                                    >
                                        <Calendar className="h-4 w-4" />
                                        <span>Hoy</span>
                                    </button>
                                </div>

                                <div className="flex flex-wrap items-center justify-end gap-2">
                                    {portfolioCalendarLegend.map((legendItem) => (
                                        <span
                                            key={legendItem.id}
                                            className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-[8px] font-semibold uppercase tracking-[0.1em] ${legendItem.classes}`}
                                        >
                                            <span className="h-2 w-2 rounded-full bg-current" />
                                            {legendItem.label}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="grid min-h-0 flex-1 gap-4 xl:grid-cols-[minmax(0,1fr)_310px]">
                                <div className="relative min-h-0">
                                    <div
                                        ref={portfolioCalendarGridRef}
                                        className="relative h-full min-h-0 overflow-auto rounded-[1.8rem] border border-zinc-200 bg-white"
                                    >
                                        <div className="sticky top-0 z-[1] grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-sm">
                                            {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((dayLabel) => (
                                                <div key={dayLabel} className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-500">
                                                    {dayLabel}
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-7">
                                            {calendarCells.map((date) => {
                                                const key = toCalendarDateKey(date);
                                                const isCurrentMonth = date.getMonth() === portfolioCalendarDate.getMonth();
                                                const todayKey = toCalendarDateKey(new Date());
                                                const isToday = key === todayKey;
                                                const isSelected = key === portfolioCalendarSelectedKey;
                                                const dayItems = calendarMixedItemsByDate[key] || [];
                                                const totalItems = dayItems.length;
                                                const isQuickMenuOpen = portfolioCalendarQuickAddKey === key;
                                                const dayDateLabel = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });

                                                return (
                                                    <div
                                                        key={key}
                                                        ref={(node) => {
                                                            if (node) {
                                                                portfolioCalendarCellRefs.current[key] = node;
                                                            } else {
                                                                delete portfolioCalendarCellRefs.current[key];
                                                            }
                                                        }}
                                                        className={`relative min-h-[176px] border-r border-b border-zinc-200 p-2.5 align-top transition-colors last:border-r-0 ${
                                                            isCurrentMonth ? 'bg-white hover:bg-zinc-50/70' : 'bg-zinc-50/60 hover:bg-zinc-100/70'
                                                        } ${isSelected ? 'ring-2 ring-inset ring-[#136191]' : ''}`}
                                                    >
                                                        <div className="flex h-full flex-col">
                                                            <div className="rounded-[0.8rem] border border-zinc-200/70 bg-zinc-50/75 px-2 py-1.5">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            setPortfolioCalendarSelectedKey(key);
                                                                            setPortfolioCalendarQuickAddKey(null);
                                                                        }}
                                                                        className={`inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-[0.95rem] font-black leading-none transition-colors ${
                                                                            isToday
                                                                                ? 'bg-[#136191] text-white'
                                                                                : isCurrentMonth
                                                                                    ? 'text-[#1A1A1A]'
                                                                                    : 'text-zinc-400'
                                                                        }`}
                                                                    >
                                                                        {date.getDate()}
                                                                    </button>
                                                                    <div className="relative">
                                                                        <button
                                                                            type="button"
                                                                            title="Adicionar al día"
                                                                            onClick={(event) => {
                                                                                event.stopPropagation();
                                                                                setPortfolioCalendarSelectedKey(key);
                                                                                setPortfolioCalendarQuickAddKey((current) => current === key ? null : key);
                                                                            }}
                                                                            className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} h-6 w-6 rounded-[0.75rem] border-zinc-200/80 bg-white/90 text-[#136191] shadow-[2px_2px_6px_#d5d5d5,-2px_-2px_6px_#ffffff]`}
                                                                        >
                                                                            <Plus className="h-3 w-3" />
                                                                        </button>
                                                                        {isQuickMenuOpen && (
                                                                            <div className="absolute right-0 top-8 z-[8] min-w-[170px] rounded-[1rem] border border-zinc-200 bg-white p-2 shadow-[0_18px_40px_rgba(15,23,42,0.14)]">
                                                                                <div className="space-y-1">
                                                                                    {canOperatePortfolioCalendarEntries && canCreateCalendarAnnotation && (
                                                                                        <button
                                                                                            type="button"
                                                                                            onClick={() => handleOpenPortfolioCalendarComposerForDate(key, 'annotation')}
                                                                                            className="flex w-full items-center gap-2 rounded-[0.85rem] px-2.5 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-[#136191] transition-colors hover:bg-blue-50"
                                                                                        >
                                                                                            <Pencil className="h-3.5 w-3.5" />
                                                                                            Anotación
                                                                                        </button>
                                                                                    )}
                                                                                    {canOperatePortfolioCalendarEntries ? (
                                                                                        <>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleOpenPortfolioCalendarComposerForDate(key, 'personal')}
                                                                                                className="flex w-full items-center gap-2 rounded-[0.85rem] px-2.5 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-zinc-600 transition-colors hover:bg-zinc-50"
                                                                                            >
                                                                                                <FileText className="h-3.5 w-3.5" />
                                                                                                Nota privada
                                                                                            </button>
                                                                                            <button
                                                                                                type="button"
                                                                                                onClick={() => handleOpenPortfolioCalendarComposerForDate(key, 'broadcast')}
                                                                                                className="flex w-full items-center gap-2 rounded-[0.85rem] px-2.5 py-2 text-left text-[10px] font-black uppercase tracking-[0.14em] text-[#F39200] transition-colors hover:bg-orange-50"
                                                                                            >
                                                                                                <AlertTriangle className="h-3.5 w-3.5" />
                                                                                                Comunicado
                                                                                            </button>
                                                                                        </>
                                                                                    ) : (
                                                                                        <div className="rounded-[0.85rem] bg-zinc-50 px-2.5 py-2 text-[10px] font-semibold text-zinc-500">
                                                                                            Capa manual no disponible
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>

                                                                <div className="mt-2 flex items-center justify-between gap-2">
                                                                    <div className="truncate text-[9px] font-medium uppercase tracking-[0.1em] text-zinc-400">
                                                                        {dayDateLabel}
                                                                    </div>
                                                                    <div className="text-[9px] font-medium uppercase tracking-[0.1em] text-zinc-400">
                                                                        Ev. {totalItems}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <div className="mt-2 min-h-0 flex-1">
                                                                <div
                                                                    onClick={() => setPortfolioCalendarSelectedKey(key)}
                                                                    className="h-full rounded-[1rem] border border-transparent"
                                                                >
                                                                    <div className="flex h-full max-h-[104px] flex-col gap-1 overflow-y-auto pr-1 custom-scrollbar">
                                                                        {dayItems.length === 0 ? (
                                                                            <div className="px-1 pt-1 text-[10px] font-semibold text-zinc-300">
                                                                                Sin eventos
                                                                            </div>
                                                                        ) : (
                                                                            dayItems.map((item) => (
                                                                                <div key={`${key}-${item.id}`} className="relative">
                                                                                    <button
                                                                                        type="button"
                                                                                        onMouseEnter={() => {
                                                                                            setPortfolioCalendarSelectedKey(key);
                                                                                            setPortfolioCalendarHoveredItemId(item.id);
                                                                                        }}
                                                                                        onFocus={() => {
                                                                                            setPortfolioCalendarSelectedKey(key);
                                                                                            setPortfolioCalendarHoveredItemId(item.id);
                                                                                        }}
                                                                                        onClick={(event) => {
                                                                                            event.stopPropagation();
                                                                                            setPortfolioCalendarSelectedKey(key);
                                                                                            setPortfolioCalendarHoveredItemId(item.id);
                                                                                        }}
                                                                                        className={`flex w-full items-center gap-2 rounded-[0.85rem] border px-2 py-1.5 text-left transition-colors ${
                                                                                            portfolioCalendarHoveredItemId === item.id && isSelected
                                                                                                ? 'border-[#136191] bg-blue-50/60'
                                                                                                : 'border-zinc-200 bg-white hover:border-zinc-300 hover:bg-zinc-50'
                                                                                        }`}
                                                                                    >
                                                                                        <span className={`h-2 w-2 rounded-full ${item.dotClasses}`} />
                                                                                        <span className="min-w-0 flex-1 truncate text-[10px] font-bold text-[#1A1A1A]">
                                                                                            {item.title}
                                                                                        </span>
                                                                                    </button>

                                                                                    {portfolioCalendarHoveredItemId === item.id && isSelected && (
                                                                                        <div className="absolute left-[calc(100%+0.35rem)] top-0 z-[9] w-[240px] rounded-[0.95rem] border border-zinc-200 bg-white p-3 shadow-[0_18px_36px_rgba(15,23,42,0.14)]">
                                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                                <span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black uppercase tracking-[0.14em] ${item.classes}`}>
                                                                                                    {item.badge}
                                                                                                </span>
                                                                                                {item.subtitle && (
                                                                                                    <span className="text-[10px] font-semibold text-zinc-500">
                                                                                                        {item.subtitle}
                                                                                                    </span>
                                                                                                )}
                                                                                            </div>
                                                                                            <div className="mt-2 text-xs font-black uppercase tracking-[0.08em] text-[#1A1A1A]">
                                                                                                {item.title}
                                                                                            </div>
                                                                                            <div className="mt-1 line-clamp-4 text-[11px] leading-relaxed text-zinc-600">
                                                                                                {item.kind === 'entry' ? item.data.message : item.summary}
                                                                                            </div>
                                                                                            {item.kind === 'event' && (
                                                                                                <div className="mt-3 flex justify-end">
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        onClick={(event) => {
                                                                                                            event.stopPropagation();
                                                                                                            handleOpenRevisionModal(item.data.project);
                                                                                                        }}
                                                                                                        className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS} rounded-[0.85rem] px-2.5 py-2 text-[9px] font-black uppercase tracking-[0.14em]`}
                                                                                                    >
                                                                                                        <Eye className="h-3.5 w-3.5" />
                                                                                                        {Number(item.data.project?.revision || 0) > 0 ? 'Abrir revisión' : 'Abrir proyecto'}
                                                                                                    </button>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>

                                <aside className="min-h-0 overflow-hidden rounded-[1.8rem] border border-zinc-200 bg-white">
                                    <div className="flex h-full min-h-0 flex-col">
                                        <div className="border-b border-zinc-200 px-4 py-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                        Bandeja personal
                                                    </div>
                                                    <div className="mt-1 flex items-center gap-2 text-sm font-black uppercase tracking-[0.08em] text-[#1A1A1A]">
                                                        <ListTodo className="h-4 w-4 text-[#136191]" />
                                                        Pendientes
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => openPortfolioTodoComposer()}
                                                    className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS} h-9 rounded-[0.95rem] px-3 text-[9px] font-black uppercase tracking-[0.16em]`}
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Añadir
                                                </button>
                                            </div>
                                            <div className="mt-3 flex items-center gap-2">
                                                {PORTFOLIO_TODO_FILTER_OPTIONS.map((filterOption) => {
                                                    const isActive = portfolioTodoFilter === filterOption.id;
                                                    return (
                                                        <button
                                                            key={filterOption.id}
                                                            type="button"
                                                            onClick={() => setPortfolioTodoFilter(filterOption.id)}
                                                            className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.16em] transition-colors ${
                                                                isActive
                                                                    ? 'border-[#136191] bg-blue-50 text-[#136191]'
                                                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                                                            }`}
                                                        >
                                                            {filterOption.label}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
                                            {portfolioTodosError && (
                                                <div className="mb-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800">
                                                    {portfolioTodosError}
                                                </div>
                                            )}
                                            {portfolioTodosLoading ? (
                                                <div className="flex min-h-[180px] items-center justify-center text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                    Cargando pendientes
                                                </div>
                                            ) : portfolioTodosVisibleItems.length === 0 ? (
                                                <div className="rounded-[1.2rem] border border-dashed border-zinc-200 bg-zinc-50/80 px-4 py-8 text-center">
                                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-400">
                                                        <ListTodo className="h-4 w-4" />
                                                    </div>
                                                    <div className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                        Sin pendientes
                                                    </div>
                                                    <div className="mt-2 text-xs text-zinc-500">
                                                        Use esta bandeja para recordatorios personales sin fecha.
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-3">
                                                    {portfolioTodosVisibleItems.map((todo) => (
                                                        <div
                                                            key={todo.id}
                                                            className={`rounded-[1.1rem] border px-3 py-3 transition-colors ${
                                                                todo.is_completed
                                                                    ? 'border-emerald-200 bg-emerald-50/60'
                                                                    : 'border-zinc-200 bg-zinc-50/70 hover:border-zinc-300'
                                                            }`}
                                                        >
                                                            <div className="flex items-start gap-3">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleTogglePortfolioTodo(todo)}
                                                                    className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
                                                                        todo.is_completed
                                                                            ? 'border-emerald-300 bg-emerald-100 text-emerald-700'
                                                                            : 'border-zinc-200 bg-white text-zinc-400 hover:border-[#136191] hover:text-[#136191]'
                                                                    }`}
                                                                >
                                                                    {todo.is_completed ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                                                </button>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className={`text-sm font-black text-[#1A1A1A] ${todo.is_completed ? 'line-through decoration-emerald-500/60' : ''}`}>
                                                                        {todo.title}
                                                                    </div>
                                                                    {todo.notes && (
                                                                        <div className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                                                                            {todo.notes}
                                                                        </div>
                                                                    )}
                                                                    <div className="mt-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                                                        <span>{todo.is_completed ? 'Completado' : 'Pendiente'}</span>
                                                                        {todo.completed_at && (
                                                                            <span>
                                                                                {new Date(todo.completed_at).toLocaleDateString('es-ES')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="mt-3 flex items-center justify-end gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => openPortfolioTodoComposer(todo)}
                                                                    className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} rounded-[0.85rem] px-2.5 py-2 text-[9px] font-black uppercase tracking-[0.14em]`}
                                                                >
                                                                    <Pencil className="h-3.5 w-3.5" />
                                                                    Editar
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeletePortfolioTodo(todo)}
                                                                    className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_DANGER_CLASS} rounded-[0.85rem] px-2.5 py-2 text-[9px] font-black uppercase tracking-[0.14em]`}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5" />
                                                                    Borrar
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </aside>
                            </div>

                            {portfolioCalendarComposerOpen && (
                                <div className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                                    <div className="pointer-events-auto w-full max-w-[420px] rounded-[1.4rem] border border-zinc-200 bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                    {portfolioCalendarEditingEntry ? 'Editar entrada' : getPortfolioCalendarEntryTypeLabel(portfolioCalendarForm.entry_type)}
                                                </div>
                                                <div className="mt-1 text-sm font-black uppercase tracking-[0.06em] text-[#1A1A1A]">
                                                    {composerDateLabel}
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={closePortfolioCalendarComposer}
                                                className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} rounded-[0.85rem] px-2.5 py-2`}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            <Input
                                                value={portfolioCalendarForm.title}
                                                onChange={(event) => setPortfolioCalendarForm((current) => ({ ...current, title: event.target.value }))}
                                                placeholder="Título corto opcional"
                                                className="rounded-xl border-zinc-200 bg-zinc-50"
                                            />
                                            <textarea
                                                value={portfolioCalendarForm.message}
                                                onChange={(event) => setPortfolioCalendarForm((current) => ({ ...current, message: event.target.value }))}
                                                placeholder="Escriba la nota, anotación o comunicado del día..."
                                                className="min-h-[120px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none transition-colors focus:border-[#136191] focus:bg-white"
                                            />
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={closePortfolioCalendarComposer}
                                                    className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} rounded-[0.95rem] px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em]`}
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSavePortfolioCalendarEntry}
                                                    className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS} rounded-[0.95rem] px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em]`}
                                                >
                                                    <Save className="h-3.5 w-3.5" />
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {portfolioTodoComposerOpen && (
                                <div className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center bg-white/30 backdrop-blur-[1px]">
                                    <div className="pointer-events-auto w-full max-w-[420px] rounded-[1.4rem] border border-zinc-200 bg-white p-5 shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
                                        <div className="flex items-start justify-between gap-4">
                                            <div>
                                                <div className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                    {portfolioTodoEditingItem ? 'Editar recordatorio' : 'Pendiente personal'}
                                                </div>
                                                <div className="mt-1 text-sm font-black uppercase tracking-[0.06em] text-[#1A1A1A]">
                                                    Bandeja privada del usuario
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={closePortfolioTodoComposer}
                                                className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} rounded-[0.85rem] px-2.5 py-2`}
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                        <div className="mt-4 space-y-3">
                                            <Input
                                                value={portfolioTodoForm.title}
                                                onChange={(event) => setPortfolioTodoForm((current) => ({ ...current, title: event.target.value }))}
                                                placeholder="Recordatorio corto"
                                                className="rounded-xl border-zinc-200 bg-zinc-50"
                                            />
                                            <textarea
                                                value={portfolioTodoForm.notes}
                                                onChange={(event) => setPortfolioTodoForm((current) => ({ ...current, notes: event.target.value }))}
                                                placeholder="Detalle opcional del recordatorio..."
                                                className="min-h-[110px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 outline-none transition-colors focus:border-[#136191] focus:bg-white"
                                            />
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    type="button"
                                                    onClick={closePortfolioTodoComposer}
                                                    className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} rounded-[0.95rem] px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em]`}
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSavePortfolioTodo}
                                                    className={`${PROJECTS_SOFT_ACTION_MICRO_BUTTON_CLASS} ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS} rounded-[0.95rem] px-3 py-2 text-[9px] font-black uppercase tracking-[0.16em]`}
                                                >
                                                    <Save className="h-3.5 w-3.5" />
                                                    Guardar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </AppModalShell>
            </AnimatePresence>
        );
    };

    const renderMarketplaceExportModal = () => {
        if (!marketplaceExportModalOpen || !marketplaceExportForm) return null;
        const isPublicProcurement = marketplaceExportForm.product_type === 'portal_compras_publicas';
        const productMeta = marketplaceExportForm.product_meta || {};
        const portalMeta = marketplaceExportForm.portal_meta || {};
        const typeOptions = marketplaceExportPreview?.product_type_options || [{ value: 'proyecto', label: 'Proyecto' }];
        const priceValue = Number(productMeta.precio_con_iva || marketplaceExportPreview?.price || 0).toFixed(2);
        const metricCards = [
            { label: 'Tecnico', value: `${Number(marketplaceExportPreview?.technical_total || 0).toFixed(2)} USD`, className: 'border-zinc-300/30 bg-white/8 text-white' },
            { label: 'Venta', value: `${priceValue} USD`, className: 'border-sky-300/30 bg-sky-400/10 text-sky-100' },
            { label: 'Revision', value: 'Pendiente', className: 'border-amber-300/40 bg-amber-400/12 text-amber-100' },
        ];

        return (
            <AppModalShell
                isOpen={true}
                size="xl"
                zIndex="z-[135]"
                overlayClassName="overflow-y-auto"
                panelClassName="my-6"
                onClose={closeMarketplaceExportModal}
            >
                <div className="flex flex-wrap items-start justify-between gap-3 bg-[#1f2530] px-5 py-4">
                    <div className="flex min-w-0 items-start gap-3">
                        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border border-sky-300/20 bg-sky-400/10 text-sky-300">
                            <Store className="h-5 w-5" />
                        </span>
                        <div className="min-w-0">
                            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">Exportar a Marketplace</h2>
                            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-white/50">Producto inactivo y pendiente de revision</p>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                                {metricCards.map((card) => (
                                    <span key={card.label} className={`inline-flex h-6 items-center gap-1 rounded-full border px-2 text-[8px] font-black uppercase tracking-[0.12em] ${card.className}`}>
                                        <span className="opacity-60">{card.label}</span>
                                        <span>{card.value}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        {marketplaceExportPreview?.can_choose_product_type ? (
                            <ProjectSegmentedSwitch
                                value={marketplaceExportForm.product_type}
                                onChange={handleMarketplaceExportTypeChange}
                                options={typeOptions}
                                size="md"
                                minSegmentWidth={132}
                                disabled={marketplaceExportLoading || marketplaceExportSubmitting}
                                ariaLabel="Tipo de exportacion Marketplace"
                            />
                        ) : null}
                        <button
                            type="button"
                            onClick={closeMarketplaceExportModal}
                            disabled={marketplaceExportSubmitting}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem] border border-white/10 bg-white/8 text-white/70 shadow-[0_10px_24px_rgba(0,0,0,0.18)] transition hover:bg-white/12 hover:text-white disabled:pointer-events-none disabled:opacity-50"
                            title="Cerrar"
                            aria-label="Cerrar"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <AppModalBody className="h-[520px] max-h-[calc(100dvh-13rem)] space-y-3 overflow-y-auto bg-[#f7f7f5] p-4">

                    <section className={PROJECTS_MODAL_SECTION_CLASS}>
                    <div className="grid gap-3 md:grid-cols-2">
                        <label className="space-y-1">
                            <MarketplaceFieldLabel hint="Nombre comercial visible en Marketplace. Puedes ajustarlo antes de enviarlo a revision.">Titulo</MarketplaceFieldLabel>
                            <Input className={PROJECTS_MODAL_INPUT_CLASS} value={marketplaceExportForm.titulo} onChange={(event) => updateMarketplaceExportForm('titulo', event.target.value)} />
                        </label>
                        <label className="space-y-1">
                            <MarketplaceFieldLabel hint="Palabras clave separadas por coma para clasificar y encontrar el producto.">Etiquetas</MarketplaceFieldLabel>
                            <Input className={PROJECTS_MODAL_INPUT_CLASS} value={marketplaceExportForm.etiquetas} onChange={(event) => updateMarketplaceExportForm('etiquetas', event.target.value)} />
                        </label>
                    </div>
                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                        <label className="block space-y-1">
                            <MarketplaceFieldLabel hint="Resumen corto para listados y tarjetas del Marketplace.">Resumen</MarketplaceFieldLabel>
                            <Textarea value={marketplaceExportForm.resumen || ''} onChange={(event) => updateMarketplaceExportForm('resumen', event.target.value)} className={PROJECTS_MODAL_TEXTAREA_CLASS} />
                        </label>
                        <label className="block space-y-1">
                            <MarketplaceFieldLabel hint="Descripcion de detalle para revision y ficha comercial del producto.">Descripcion</MarketplaceFieldLabel>
                            <Textarea value={marketplaceExportForm.descripcion || ''} onChange={(event) => updateMarketplaceExportForm('descripcion', event.target.value)} className={PROJECTS_MODAL_TEXTAREA_CLASS} />
                        </label>
                    </div>
                    </section>

                    <section className={PROJECTS_MODAL_SECTION_CLASS}>
                    <div className="grid gap-3 md:grid-cols-3">
                            <label className="space-y-1">
                                <MarketplaceFieldLabel hint={isPublicProcurement ? 'Precio comercial calculado por tabla de compras publicas. No se edita manualmente.' : 'Precio manual de venta del proyecto. Por defecto inicia en 19.99 USD.'}>Precio venta USD</MarketplaceFieldLabel>
                                <Input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    readOnly={isPublicProcurement}
                                    className={`${PROJECTS_MODAL_PRICE_INPUT_CLASS} ${isPublicProcurement ? 'cursor-not-allowed bg-zinc-100 text-zinc-500' : ''}`}
                                    value={isPublicProcurement ? priceValue : (productMeta.precio_con_iva || '19.99')}
                                    onChange={(event) => {
                                        if (!isPublicProcurement) updateMarketplaceProductMeta('precio_con_iva', event.target.value);
                                    }}
                                />
                            </label>
                        <label className="space-y-1">
                            <MarketplaceFieldLabel hint="Primer dia de vigencia comercial visible para revision y publicacion.">Inicio publicacion</MarketplaceFieldLabel>
                            <AnimatedDateInput
                                value={productMeta.fecha_inicio_publicacion || ''}
                                onChange={(event) => updateMarketplaceProductMeta('fecha_inicio_publicacion', event.target.value)}
                                variant="compact"
                                compactFullDisplay
                                className={PROJECTS_MODAL_INPUT_CLASS}
                            />
                        </label>
                        <label className="space-y-1">
                            <MarketplaceFieldLabel hint="Ultimo dia de vigencia comercial visible para revision y publicacion.">Fin publicacion</MarketplaceFieldLabel>
                            <AnimatedDateInput
                                value={productMeta.fecha_fin_publicacion || ''}
                                onChange={(event) => updateMarketplaceProductMeta('fecha_fin_publicacion', event.target.value)}
                                variant="compact"
                                compactFullDisplay
                                className={PROJECTS_MODAL_INPUT_CLASS}
                            />
                        </label>
                    </div>
                    </section>

                    {isPublicProcurement ? (
                        <section className={`${PROJECTS_MODAL_SECTION_CLASS} border-sky-100 bg-sky-50/35`}>
                            <div className="grid gap-3 md:grid-cols-3">
                                <label className="space-y-1">
                                    <MarketplaceFieldLabel hint="Pais asociado al portal de compra publica.">Pais</MarketplaceFieldLabel>
                                    <Input className={PROJECTS_MODAL_INPUT_CLASS} value={portalMeta.pais || ''} onChange={(event) => updateMarketplacePortalMeta('pais', event.target.value)} />
                                </label>
                                <label className="space-y-1">
                                    <MarketplaceFieldLabel hint="Provincia o region de referencia de la compra publica.">Provincia</MarketplaceFieldLabel>
                                    <Input className={PROJECTS_MODAL_INPUT_CLASS} value={portalMeta.provincia || ''} onChange={(event) => updateMarketplacePortalMeta('provincia', event.target.value)} />
                                </label>
                                <label className="space-y-1">
                                    <MarketplaceFieldLabel hint="Canton o ciudad de referencia de la compra publica.">Canton</MarketplaceFieldLabel>
                                    <Input className={PROJECTS_MODAL_INPUT_CLASS} value={portalMeta.canton || ''} onChange={(event) => updateMarketplacePortalMeta('canton', event.target.value)} />
                                </label>
                            </div>
                            <div className="mt-3 grid gap-3 md:grid-cols-3">
                                <label className="space-y-1">
                                    <MarketplaceFieldLabel hint="Codigo o referencia comercial del proceso que se mostrara en Marketplace.">Referencia</MarketplaceFieldLabel>
                                    <Input className={PROJECTS_MODAL_INPUT_CLASS} value={portalMeta.codigo_licitacion || ''} onChange={(event) => updateMarketplacePortalMeta('codigo_licitacion', event.target.value)} />
                                </label>
                                <label className="space-y-1">
                                    <MarketplaceFieldLabel hint="Fecha de inicio asociada al proceso de compra publica.">Inicio licitacion</MarketplaceFieldLabel>
                                    <AnimatedDateInput
                                        value={portalMeta.fecha_inicio_licitacion || ''}
                                        onChange={(event) => updateMarketplacePortalMeta('fecha_inicio_licitacion', event.target.value)}
                                        variant="compact"
                                        compactFullDisplay
                                        className={PROJECTS_MODAL_INPUT_CLASS}
                                    />
                                </label>
                                <label className="space-y-1">
                                    <MarketplaceFieldLabel hint="Fecha de cierre asociada al proceso de compra publica.">Fin licitacion</MarketplaceFieldLabel>
                                    <AnimatedDateInput
                                        value={portalMeta.fecha_fin_licitacion || ''}
                                        onChange={(event) => updateMarketplacePortalMeta('fecha_fin_licitacion', event.target.value)}
                                        variant="compact"
                                        compactFullDisplay
                                        className={PROJECTS_MODAL_INPUT_CLASS}
                                    />
                                </label>
                            </div>
                        </section>
                    ) : null}
                </AppModalBody>
                <AppModalFooter variant="flat" className="flex-wrap border-t border-[#ececec] bg-[#f7f7f5]">
                    <ProjectSectionIconButton
                        icon={X}
                        label="Cancelar"
                        onClick={closeMarketplaceExportModal}
                        disabled={marketplaceExportSubmitting}
                        hintContent={<GiproyActionHint title="Cancelar" detail="Cierra el envio a revision sin crear ni actualizar el producto." />}
                        className="!h-9 !w-9 !rounded-[0.85rem] text-zinc-500"
                    />
                    <ProjectSectionIconButton
                        icon={Check}
                        label="Enviar a revision"
                        onClick={handleConfirmMarketplaceExport}
                        disabled={marketplaceExportSubmitting}
                        hintContent={<GiproyActionHint title="Enviar a revision" detail="Crea o actualiza el producto como pendiente para moderacion de Marketplace." />}
                        className={`!h-9 !w-9 !rounded-[0.85rem] ${PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS}`}
                    >
                        {marketplaceExportSubmitting ? (
                            <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-200 border-t-[#136191]" />
                        ) : (
                            <Check className="h-3.5 w-3.5" />
                        )}
                    </ProjectSectionIconButton>
                </AppModalFooter>
            </AppModalShell>
        );
    };

    const renderPublicProcurementImporterModal = () => {
        if (!showPublicProcurementImportModal || !canUsePublicProcurementImporter) return null;

        const analysis = publicProcurementPreview || {};
        const summary = analysis.analysis_bundle?.summary || analysis.summary || {};
        const contract = analysis.technical_import_contract || {};
        const warnings = summary.warnings || contract.warnings || [];
        const blockingIncidents = summary.blocking_incidents || contract.blocking_incidents || [];
        const nonBlockingIncidents = summary.non_blocking_incidents || contract.non_blocking_incidents || [];
        const diagnosticItems = [
            ...blockingIncidents.map((item) => ({ ...item, severity: item.severity || 'blocking' })),
            ...nonBlockingIncidents.map((item) => ({ ...item, severity: item.severity || 'warning' })),
            ...warnings.map((message) => ({ severity: 'info', code: 'parser_warning', message })),
        ];
        const sourceFingerprint = contract.source_fingerprint || contract.source_fingerprints?.[0]?.fingerprint || '';
        const metricCards = [
            { label: 'Rubros', value: summary.budget_items_count ?? '-' },
            { label: 'APUs', value: summary.apus_count ?? summary.real_apus_count ?? '-' },
            { label: 'Recursos', value: summary.resources_count ?? '-' },
            { label: 'Anidados', value: summary.nested_apu_link_count ?? '-' },
        ];
        const showImportProgress = publicProcurementImporting
            || publicProcurementMaterializing
            || ['success', 'error', 'materializing'].includes(publicProcurementProgress.phase);
        const importProgressPercent = Math.max(0, Math.min(100, Number(publicProcurementProgress.percent || 0)));

        return (
            <AnimatePresence>
                <AppModalShell
                    isOpen={true}
                    size="lg"
                    zIndex="z-[130]"
                    overlayClassName="overflow-y-auto"
                    panelClassName="my-8"
                    onClose={closePublicProcurementImporter}
                >
                    <AppModalHeader
                        title="Importar SOCE/SERCOP"
                        subtitle="Análisis previo para generar proyecto clásico"
                        icon={UploadCloud}
                        iconClassName="text-[#136191]"
                        iconWrapClassName="border-blue-200 bg-blue-50"
                        onClose={closePublicProcurementImporter}
                    />
                    <div className="space-y-6 p-8">
                        <div className="rounded-[1.4rem] border border-zinc-200 bg-zinc-50/70 p-5">
                            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div>
                                    <div className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">
                                        Fuente documental
                                    </div>
                                    <div className="mt-1 text-sm font-black text-[#1A1A1A]">
                                        {publicProcurementFiles.length > 0
                                            ? `${publicProcurementFiles.length} archivo${publicProcurementFiles.length === 1 ? '' : 's'} seleccionado${publicProcurementFiles.length === 1 ? '' : 's'}`
                                            : 'Sin archivos'}
                                    </div>
                                </div>
                                <input
                                    id="public-procurement-project-import-files"
                                    type="file"
                                    multiple
                                    accept=".pdf,.xls,.xlsx,.xlsm"
                                    onChange={handlePublicProcurementFileChange}
                                    className="hidden"
                                />
                                <ProjectSectionIconButton
                                    icon={FileText}
                                    label="Seleccionar archivo"
                                    onClick={openPublicProcurementFilePicker}
                                    hintContent={<GiproyActionHint title="Seleccionar" detail="Añade archivos PDF o Excel para analizar la compra pública." />}
                                    hintClassName="ml-auto"
                                    className={PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS}
                                />
                            </div>

                            {publicProcurementFiles.length > 0 && (
                                <div className="mt-4 grid gap-2">
                                    {publicProcurementFiles.map((file) => (
                                        <div
                                            key={`${file.name}-${file.size}-${file.lastModified}`}
                                            className="flex items-center justify-between gap-3 rounded-[1rem] border border-zinc-200 bg-white px-3 py-2"
                                        >
                                            <span className="truncate text-xs font-bold text-zinc-700">{file.name}</span>
                                            <span className="shrink-0 text-[9px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                                {(file.size / 1024 / 1024).toFixed(2)} MB
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {publicProcurementPreview && (
                            <div className="space-y-4 rounded-[1.4rem] border border-blue-100 bg-blue-50/40 p-5">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                    <div>
                                        <div className="text-[10px] font-black uppercase tracking-[0.22em] text-[#136191]">
                                            Resultado técnico
                                        </div>
                                        <div className="mt-1 text-lg font-black text-[#1A1A1A]">
                                            {summary.coverage_level || summary.document_kind || contract.document_kind || 'Análisis disponible'}
                                        </div>
                                    </div>
                                    <div className="rounded-full border border-blue-200 bg-white px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.16em] text-[#136191]">
                                        {contract.parser_profile || 'perfil flexible'}
                                    </div>
                                </div>

                                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                    {metricCards.map((metric) => (
                                        <div key={metric.label} className="rounded-[1rem] border border-zinc-200 bg-white px-4 py-3">
                                            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                                {metric.label}
                                            </div>
                                            <div className="mt-1 text-xl font-black text-[#1A1A1A]">
                                                {metric.value}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="grid gap-3 md:grid-cols-2">
                                    <div className="rounded-[1rem] border border-zinc-200 bg-white px-4 py-3">
                                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                            Archivo origen
                                        </div>
                                        <div className="mt-1 truncate text-sm font-black text-[#1A1A1A]">
                                            {analysis.source_filename || 'Fuente combinada'}
                                        </div>
                                    </div>
                                    <div className="rounded-[1rem] border border-zinc-200 bg-white px-4 py-3">
                                        <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">
                                            Huella
                                        </div>
                                        <div className="mt-1 truncate text-sm font-black text-[#1A1A1A]">
                                            {sourceFingerprint ? sourceFingerprint.slice(0, 16) : 'Sin huella'}
                                        </div>
                                    </div>
                                </div>

                                {diagnosticItems.length > 0 && (
                                    <div className="flex flex-col gap-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-3 md:flex-row md:items-center md:justify-between">
                                        <div>
                                            <div className="text-[9px] font-black uppercase tracking-[0.18em] text-amber-700">
                                                Diagnóstico disponible
                                            </div>
                                            <p className="mt-1 text-xs font-semibold leading-relaxed text-amber-800">
                                                Se detectaron {diagnosticItems.length} observación(es) técnicas. Revisa el detalle antes de crear el proyecto.
                                            </p>
                                        </div>
                                        <ProjectSectionIconButton
                                            icon={AlertTriangle}
                                            label="Ver diagnóstico"
                                            onClick={() => setShowPublicProcurementDiagnosticsModal(true)}
                                            hintContent={<GiproyActionHint title="Diagnóstico" detail="Abre una ventana con el detalle técnico encontrado por el importador." />}
                                            className={PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS}
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {showImportProgress ? (
                            <div className="rounded-[1rem] border border-[#d7e3ec] bg-[#f7fafc] p-3">
                                <div className="flex items-center justify-between gap-3">
                                    <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#136191]">
                                        {publicProcurementMaterializing ? 'Progreso de creación' : publicProcurementImporting ? 'Progreso del análisis' : 'Último proceso'}
                                    </p>
                                    <p className="text-[10px] font-medium text-zinc-500">
                                        {publicProcurementProgress.indeterminate
                                            ? `${publicProcurementProgress.elapsedSeconds || 0}s`
                                            : `${importProgressPercent}%`}
                                    </p>
                                </div>
                                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                                    {publicProcurementProgress.indeterminate ? (
                                        <div className="h-full w-full overflow-hidden rounded-full">
                                            <div className="h-full w-1/3 animate-pulse rounded-full bg-[#136191]" />
                                        </div>
                                    ) : (
                                        <div
                                            className={`h-full rounded-full transition-all duration-500 ${
                                                publicProcurementProgress.phase === 'success'
                                                    ? 'bg-emerald-500'
                                                    : publicProcurementProgress.phase === 'error'
                                                        ? 'bg-rose-500'
                                                        : 'bg-[#136191]'
                                            }`}
                                            style={{ width: `${Math.max(6, importProgressPercent)}%` }}
                                        />
                                    )}
                                </div>
                                <p className="mt-2 text-[11px] font-medium text-zinc-600">
                                    {publicProcurementProgress.label || 'Esperando inicio del análisis'}
                                </p>
                            </div>
                        ) : null}

                        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 pt-5">
                            <ProjectSectionIconButton
                                icon={X}
                                label="Cerrar importador"
                                onClick={closePublicProcurementImporter}
                                hintContent={<GiproyActionHint title="Cerrar" detail="Cierra el importador sin conservar la selección actual." />}
                            />
                            <ProjectSectionIconButton
                                icon={Eye}
                                label="Analizar compra pública"
                                onClick={handlePreviewPublicProcurementImport}
                                disabled={publicProcurementImporting || publicProcurementMaterializing || publicProcurementFiles.length === 0}
                                hintContent={<GiproyActionHint title="Analizar" detail="Lee la fuente documental y prepara el resumen técnico previo." />}
                                className={PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS}
                            >
                                {publicProcurementImporting ? (
                                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-[#136191]" />
                                ) : null}
                            </ProjectSectionIconButton>
                            {publicProcurementPreview && (
                                <ProjectSectionIconButton
                                    icon={Check}
                                    label="Crear proyecto"
                                    onClick={handleMaterializePublicProcurementImport}
                                    disabled={publicProcurementImporting || publicProcurementMaterializing}
                                    hintContent={<GiproyActionHint title="Crear proyecto" detail="Materializa el análisis como proyecto clásico inicial." />}
                                    className={PROJECTS_SOFT_ACTION_MICRO_BUTTON_ACCENT_CLASS}
                                >
                                    {publicProcurementMaterializing ? (
                                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-[#136191]" />
                                    ) : null}
                                </ProjectSectionIconButton>
                            )}
                        </div>
                    </div>
                </AppModalShell>
                {showPublicProcurementDiagnosticsModal && (
                    <AppModalShell
                        isOpen={true}
                        size="md"
                        zIndex="z-[150]"
                        panelClassName="my-10"
                        onClose={() => setShowPublicProcurementDiagnosticsModal(false)}
                    >
                        <AppModalHeader
                            title="Diagnóstico SOCE/SERCOP"
                            subtitle="Lectura técnica encontrada antes de crear el proyecto"
                            icon={AlertTriangle}
                            iconClassName={blockingIncidents.length > 0 ? 'text-rose-700' : 'text-amber-700'}
                            iconWrapClassName={blockingIncidents.length > 0 ? 'border-rose-200 bg-rose-50' : 'border-amber-200 bg-amber-50'}
                            onClose={() => setShowPublicProcurementDiagnosticsModal(false)}
                        />
                        <div className="space-y-4 p-7">
                            <div className="grid gap-3 sm:grid-cols-3">
                                <div className="rounded-[1rem] border border-zinc-200 bg-white px-4 py-3">
                                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Bloqueantes</div>
                                    <div className="mt-1 text-xl font-black text-rose-700">{blockingIncidents.length}</div>
                                </div>
                                <div className="rounded-[1rem] border border-zinc-200 bg-white px-4 py-3">
                                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Avisos</div>
                                    <div className="mt-1 text-xl font-black text-amber-700">{nonBlockingIncidents.length}</div>
                                </div>
                                <div className="rounded-[1rem] border border-zinc-200 bg-white px-4 py-3">
                                    <div className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Perfil</div>
                                    <div className="mt-1 truncate text-xs font-black text-[#1A1A1A]">{summary.parser_profile || contract.parser_profile || 'Flexible'}</div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                {diagnosticItems.length > 0 ? diagnosticItems.map((item, index) => {
                                    const isBlocking = item.severity === 'blocking';
                                    return (
                                        <div
                                            key={`${item.code || 'diagnostic'}-${index}`}
                                            className={`rounded-[1rem] border px-4 py-3 ${
                                                isBlocking
                                                    ? 'border-rose-200 bg-rose-50 text-rose-900'
                                                    : item.severity === 'warning'
                                                        ? 'border-amber-200 bg-amber-50 text-amber-900'
                                                        : 'border-blue-100 bg-blue-50 text-blue-900'
                                            }`}
                                        >
                                            <div className="text-[9px] font-black uppercase tracking-[0.18em] opacity-70">
                                                {isBlocking ? 'Incidencia bloqueante' : item.severity === 'warning' ? 'Aviso técnico' : 'Observación'}
                                            </div>
                                            <p className="mt-1 text-sm font-bold leading-relaxed">
                                                {item.message || 'Observación técnica detectada.'}
                                            </p>
                                            {(item.apu_code || item.budget_row || item.candidate_count) && (
                                                <p className="mt-2 text-[11px] font-semibold opacity-75">
                                                    {item.apu_code ? `APU: ${item.apu_code}. ` : ''}
                                                    {item.budget_row ? `Rubro: ${item.budget_row}. ` : ''}
                                                    {item.candidate_count ? `Candidatos: ${item.candidate_count}.` : ''}
                                                </p>
                                            )}
                                            {(item.budget_description || item.budget_unit || item.budget_unit_price) && (
                                                <p className="mt-2 text-[11px] font-semibold leading-relaxed opacity-75">
                                                    {[item.budget_description, item.budget_unit, item.budget_unit_price ? `${item.budget_unit_price} USD` : null].filter(Boolean).join(' · ')}
                                                </p>
                                            )}
                                            {Array.isArray(item.candidates) && item.candidates.length > 0 && (
                                                <div className="mt-3 space-y-2">
                                                    {item.candidates.slice(0, 6).map((candidate, candidateIndex) => (
                                                        <div
                                                            key={`${candidate.temp_id || candidate.codigo || 'candidate'}-${candidateIndex}`}
                                                            className="rounded-[0.75rem] border border-current/10 bg-white/55 px-3 py-2 text-[11px] font-semibold leading-relaxed"
                                                        >
                                                            <div className="font-black uppercase tracking-[0.16em] opacity-60">
                                                                {candidate.codigo || candidate.temp_id || `Candidato ${candidateIndex + 1}`}
                                                            </div>
                                                            <div className="mt-1">
                                                                {[candidate.descripcion, candidate.unidad, candidate.precio_unitario ? `${candidate.precio_unitario} USD` : null].filter(Boolean).join(' · ')}
                                                            </div>
                                                            <div className="mt-1 opacity-65">
                                                                {candidate.resource_count || 0} recurso(s) detectado(s)
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }) : (
                                    <div className="rounded-[1rem] border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-800">
                                        No se detectaron incidencias técnicas.
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end border-t border-zinc-100 pt-4">
                                <ProjectSectionIconButton
                                    icon={X}
                                    label="Cerrar diagnóstico"
                                    onClick={() => setShowPublicProcurementDiagnosticsModal(false)}
                                    hintContent={<GiproyActionHint title="Cerrar" detail="Vuelve al importador SOCE/SERCOP." />}
                                />
                            </div>
                        </div>
                    </AppModalShell>
                )}
            </AnimatePresence>
        );
    };

    const renderProjectDeleteModal = () => (
        <AnimatePresence>
            {showDeleteModal && (
                <AppModalShell isOpen={true} size="sm" zIndex="z-[200]" onClose={() => setShowDeleteModal(false)}>
                    <div className="p-10">
                        <div className="flex flex-col items-center text-center">
                            <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 ${deleteStep === 1 ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                                {deleteStep === 1 ? <AlertTriangle className="w-10 h-10" /> : <Trash2 className="w-10 h-10" />}
                            </div>

                            {deleteStep === 1 ? (
                                <>
                                    <h2 className="text-2xl font-black uppercase tracking-tight mb-4">¿Eliminar Proyecto?</h2>
                                    <p className="text-zinc-500 text-sm font-medium mb-8">
                                        Estás a punto de eliminar <strong>{projectToDelete?.nombre}</strong>.
                                        Esta acción moverá el proyecto y sus revisiones a papelera durante 7 días.
                                    </p>
                                    <button
                                        type="button"
                                        onClick={() => setDeleteProjectBase((value) => !value)}
                                        className={`mb-6 flex w-full items-start gap-3 rounded-[1.25rem] border px-4 py-3 text-left transition ${
                                            deleteProjectBase
                                                ? 'border-rose-200 bg-rose-50 text-rose-800'
                                                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                        }`}
                                    >
                                        <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                            deleteProjectBase ? 'border-rose-300 bg-white' : 'border-emerald-300 bg-white'
                                        }`}>
                                            {deleteProjectBase ? <Check className="h-3.5 w-3.5" /> : null}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-[10px] font-black uppercase tracking-[0.16em]">
                                                {deleteProjectBase ? 'Mover tambien la Base de Proyecto' : 'Conservar Base como Base Maestra'}
                                            </span>
                                            <span className="mt-1 block text-[11px] font-semibold leading-relaxed">
                                                {deleteProjectBase
                                                    ? 'La base asociada tambien quedara en papelera junto al proyecto.'
                                                    : 'Se borrara el proyecto, pero la base quedara disponible como Base de Trabajo reutilizable.'}
                                            </span>
                                        </span>
                                    </button>
                                    <div className="flex flex-col w-full gap-3">
                                        <LiquidButton
                                            onClick={() => setDeleteStep(2)}
                                            className="w-full !h-14 bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl"
                                        >
                                            Entiendo, Continuar
                                        </LiquidButton>
                                        <button
                                            onClick={() => setShowDeleteModal(false)}
                                            className="w-full h-14 bg-zinc-50 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-red-600">CONFIRMACIÓN FINAL</h2>
                                    <p className="text-zinc-500 text-sm font-medium mb-8">
                                        ¿Estás seguro? {deleteProjectBase
                                            ? 'El proyecto y su base quedaran ocultos de la operacion normal y podran restaurarse desde la papelera mientras no expiren.'
                                            : 'El proyecto quedara oculto en papelera y la base asociada se convertira en Base de Trabajo reutilizable.'}
                                    </p>
                                    <div className="flex flex-col w-full gap-3">
                                        <LiquidButton
                                            onClick={handleDeleteProject}
                                            disabled={deleting}
                                            className="w-full !h-14 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
                                        >
                                            {deleting ? (
                                                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Trash2 className="w-4 h-4" />
                                            )}
                                            Mover a Papelera
                                        </LiquidButton>
                                        <button
                                            onClick={() => setShowDeleteModal(false)}
                                            disabled={deleting}
                                            className="w-full h-14 bg-zinc-50 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-all"
                                        >
                                            Dar Marcha Atrás
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </AppModalShell>
            )}
        </AnimatePresence>
    );

    const renderProjectRecycleModal = () => (
        <AnimatePresence>
            {showRecycleModal && (
                <AppModalShell
                    isOpen={showRecycleModal}
                    size="lg"
                    zIndex="z-[200]"
                    panelClassName="rounded-[2.5rem] max-h-[calc(100dvh-4rem)] flex flex-col"
                    onClose={() => setShowRecycleModal(false)}
                >
                    <AppModalHeader
                        title="Papelera de proyectos"
                        subtitle="Retención operativa de 7 días antes del borrado definitivo."
                        icon={Trash2}
                        onClose={() => setShowRecycleModal(false)}
                    />
                    <div className="min-h-0 overflow-y-auto px-6 py-5">
                        {recycleLoading ? (
                            <div className="flex items-center justify-center py-16">
                                <div className="flex flex-col items-center gap-4 text-zinc-400">
                                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-zinc-100 border-t-[#F39200]" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">Cargando papelera...</p>
                                </div>
                            </div>
                        ) : recycledProjects.length === 0 ? (
                            <div className="rounded-[2rem] border border-dashed border-zinc-200 bg-zinc-50/70 px-6 py-12 text-center">
                                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sin proyectos en papelera</p>
                                <p className="mt-3 text-sm font-medium text-zinc-500">Los proyectos eliminados se mostrarán aquí durante 7 días.</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recycledProjects.map((project) => {
                                    const projectName = project.trash_original_nombre || project.nombre;
                                    const projectCode = project.trash_original_codigo || project.codigo;
                                    const isBusy = recycleActionId === project.id;
                                    return (
                                        <div key={project.id} className="rounded-[1.5rem] border border-zinc-200 bg-white px-4 py-3.5 shadow-[0_8px_20px_rgba(0,0,0,0.03)]">
                                            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                                                <div className="min-w-0">
                                                    <p className="truncate text-[12px] font-black uppercase tracking-tight text-zinc-900">{projectName}</p>
                                                    <div className="mt-1 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">
                                                        <span>{projectCode || 'Sin código'}</span>
                                                        <span>Eliminado: {formatRecycleDateTime(project.deleted_at)}</span>
                                                        <span>Expira: {formatRecycleDateTime(project.recycle_expires_at)}</span>
                                                    </div>
                                                </div>
                                                <div className="flex shrink-0 items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRestoreRecycledProject(project)}
                                                        disabled={isBusy}
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.85rem] border border-emerald-100 bg-emerald-50 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-emerald-700 transition hover:border-emerald-300 disabled:opacity-50"
                                                    >
                                                        <RotateCcw className="h-3.5 w-3.5" />
                                                        Restaurar
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handlePurgeRecycledProject(project)}
                                                        disabled={isBusy}
                                                        className="inline-flex h-9 items-center justify-center gap-2 rounded-[0.85rem] border border-rose-100 bg-rose-50 px-3 text-[9px] font-black uppercase tracking-[0.16em] text-rose-700 transition hover:border-rose-300 disabled:opacity-50"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Borrar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                    <AppModalFooter>
                        <button
                            type="button"
                            onClick={() => setShowRecycleModal(false)}
                            className="h-11 rounded-[1rem] bg-zinc-50 px-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:bg-zinc-100"
                        >
                            Cerrar
                        </button>
                        <LiquidButton
                            onClick={fetchRecycledProjects}
                            disabled={recycleLoading}
                            className="!h-11 bg-[#1A1A1A] text-white"
                        >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Actualizar
                        </LiquidButton>
                    </AppModalFooter>
                </AppModalShell>
            )}
        </AnimatePresence>
    );

    if (selectedProject) {
        return (
            <div className="h-full flex flex-col bg-[#F2F4F7] text-[#1A1A1A] overflow-hidden">
                <header className="bg-white border-b border-zinc-200 px-8 py-2 flex-shrink-0 z-40 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className={`flex items-center transition-all duration-300 ${isProjectHeaderCollapsed ? 'gap-4' : 'gap-6'}`}>
                            <button onClick={handleCloseSelectedProject} className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500">
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <div>
                                <div className={`flex items-center gap-2 transition-all duration-300 ${isProjectHeaderCollapsed ? 'mb-0' : 'mb-1'}`}>
                                    <MarketplaceOriginBadgeSet
                                        origin={selectedProjectOrigin}
                                        loading={selectedProjectOrigin.loading}
                                        label="Origen"
                                        mode="tooltip"
                                    />
                                    <h1 className={`font-black uppercase tracking-tight text-zinc-900 transition-all duration-300 ${
                                        isProjectHeaderCollapsed ? 'text-lg' : 'text-xl'
                                    }`}>{selectedProject.nombre}</h1>
                                    <span className="px-3 py-1 bg-orange-50 text-[#F39200] border border-orange-100 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                        Rev {selectedProject.revision.toString().padStart(3, '0')}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {!projectPermissions?.is_restricted && (
                                <>
                                    <ProjectHeaderActionButton
                                        icon={Copy}
                                        label="Clonar Proyecto Completo"
                                        onClick={() => handleCreateRevision(selectedProject.id)}
                                        tone="warning"
                                        size={isProjectHeaderCollapsed ? 'md' : 'lg'}
                                        stacked={!isProjectHeaderCollapsed}
                                    />
                                    <ProjectHeaderActionButton
                                        icon={Play}
                                        label="Pasar al Módulo APU"
                                        onClick={() => handleActivateRevision(selectedProject, { target: 'apu-editor' })}
                                        tone="dark"
                                        size={isProjectHeaderCollapsed ? 'lg' : 'xl'}
                                        stacked={!isProjectHeaderCollapsed}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar de Secciones */}
                    <MotionAside
                        onMouseEnter={() => setIsSidebarHovered(true)}
                        onMouseLeave={() => setIsSidebarHovered(false)}
                        initial={false}
                        animate={{ width: isSidebarExpanded ? 288 : 96 }}
                        transition={{ type: 'spring', stiffness: 260, damping: 30, mass: 0.8 }}
                        className="shrink-0 bg-white border-r border-zinc-100 overflow-x-hidden overflow-y-auto custom-scrollbar p-4"
                        style={{ willChange: 'width' }}
                    >
                        <div className="mb-4 flex items-center justify-between gap-2">
                            <div
                                className={`text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400 transition-all duration-200 ${
                                    isSidebarExpanded ? 'opacity-100' : 'opacity-0 pointer-events-none w-0 overflow-hidden'
                                }`}
                            >
                                Navegacion
                            </div>
                            <button
                                type="button"
                                onClick={() => setIsSidebarPinned((prev) => !prev)}
                                title={isSidebarPinned ? 'Desfijar panel' : 'Fijar panel abierto'}
                                className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-900"
                            >
                                {isSidebarPinned ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeftOpen className="w-4 h-4" />}
                            </button>
                        </div>
                        <div className="space-y-1">
                            {sectionItems.filter(section => {
                                if (section.id === 'bim') return bimEnabled;
                                if (!projectPermissions) return true;
                                const allowed = projectPermissions.allowed_modules || [];
                                if (allowed.includes('todos')) return true;
                                
                                const moduleMap = {
                                    'datos': 'datos_generales',
                                    'stakeholders': 'stakeholders',
                                    'edo_obs': 'edo',
                                    'edt_wbs': 'edt',
                                    'presupuesto': 'presupuestos',
                                    'cronogramas': 'cronogramas',
                                    'desagregacion': 'desagregacion',
                                    'formula': 'formula_polinomica'
                                };
                                return allowed.includes(moduleMap[section.id]);
                            }).map((section) => (
                                <button
                                    key={section.id}
                                    onClick={() => activateProjectTab(section.id)}
                                    title={!isSidebarExpanded ? section.label : undefined}
                                    className={`relative flex items-center gap-3 rounded-2xl border transition-all duration-300 group
                                            ${activeTab === section.id
                                            ? 'border-[#1A1A1A] bg-[#1A1A1A] text-white shadow-xl shadow-black/10'
                                            : 'border-zinc-100 hover:border-zinc-200 hover:bg-zinc-50 text-zinc-500 hover:text-zinc-900'} ${
                                                isSidebarExpanded ? 'w-full h-[58px] justify-start px-4 py-0' : 'w-full h-[58px] justify-center px-0 py-0'
                                            }`}
                                >
                                    <div className={`p-2 rounded-lg border transition-colors ${activeTab === section.id
                                        ? 'border-zinc-700 bg-zinc-800'
                                        : 'border-zinc-200 bg-zinc-100 group-hover:border-zinc-300 group-hover:bg-white'}`}>
                                        {cloneElement(section.icon, {
                                            className: `w-4 h-4 ${activeTab === section.id ? 'text-white' : section.color}`
                                        })}
                                    </div>
                                    <AnimatePresence initial={false}>
                                        {isSidebarExpanded && (
                                            <MotionDiv
                                                key={`${section.id}-label`}
                                                {...PROJECTS_SECTION_LABEL_REVEAL_MOTION}
                                                className={`overflow-hidden whitespace-nowrap text-[10px] font-black uppercase tracking-widest leading-none ${
                                                    activeTab === section.id ? 'text-white' : 'text-zinc-500 group-hover:text-zinc-900'
                                                }`}
                                            >
                                                {section.label}
                                            </MotionDiv>
                                        )}
                                    </AnimatePresence>
                                    {activeTab === section.id && isSidebarExpanded && (
                                        <MotionDiv
                                            layoutId="active-indicator"
                                            className={`ml-auto w-1.5 h-1.5 rounded-full ${section.bg}`}
                                        />
                                    )}
                                    {activeTab === section.id && !isSidebarExpanded && (
                                        <MotionDiv
                                            layoutId="active-indicator"
                                            className={`absolute -right-[3px] top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full ${section.bg}`}
                                        />
                                    )}
                                </button>
                            ))}
                        </div>
                    </MotionAside>

                    {/* Contenido de Sección */}
                    <main className={`flex-1 flex flex-col min-w-0 min-h-0 ${
                        selectedPresupuestoId || activeTab === 'cronogramas' || activeTab === 'desagregacion' || activeTab === 'edo_obs' || activeTab === 'edt_wbs' || activeTab === 'bim'
                            ? 'overflow-hidden p-6'
                            : activeTab === 'datos' || activeTab === 'stakeholders' || activeTab === 'formula'
                                ? 'overflow-hidden p-6'
                                : 'overflow-y-auto custom-scrollbar p-12'
                    }`}>
                        <MotionDiv
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="w-full h-full min-h-0 flex flex-col"
                        >
                            <Suspense fallback={<ProjectSectionFallback />}>
                                {activeTab === 'datos' ? (
                                    <DatosProyecto
                                        project={selectedProject}
                                        initialDetail={selectedProjectDetail}
                                        onProjectNameSaved={handleProjectNameSaved}
                                    />
                                ) : activeTab === 'stakeholders' ? (
                                    <Stakeholders project={selectedProject} />
                                ) : activeTab === 'edo_obs' ? (
                                    <Edo project={selectedProject} />
                                ) : activeTab === 'edt_wbs' ? (
                                    <Edt
                                        project={selectedProject}
                                        initialFocusNodeId={bimNavigationContext?.targetType === 'edt' ? bimNavigationContext.targetId : null}
                                    />
                                ) : activeTab === 'cronogramas' ? (
                                    <Cronogramas project={selectedProject} initialProjectDetail={selectedProjectDetail} />
                                ) : activeTab === 'desagregacion' ? (
                                    <DesagregacionTab project={selectedProject} />
                                ) : activeTab === 'formula' ? (
                                    <FormulaPolinomicaTab projectId={selectedProject.id} activeRevision={selectedProject} />
                                ) : activeTab === 'bim' && bimEnabled ? (
                                    <BimTab
                                        project={selectedProject}
                                        access={bimAccess}
                                        onNavigateTarget={handleBimNavigateTarget}
                                    />
                                ) : activeTab === 'presupuesto' ? (
                                    <PresupuestoProvider>
                                        <div className="h-full min-h-0 flex flex-col">
                                            {selectedPresupuestoId ? (
                                                <div className="h-full min-h-0">
                                                    <PresupuestoDetail
                                                        inlineProyectoId={selectedProject.id}
                                                        inlinePresupuestoId={selectedPresupuestoId}
                                                        initialFocusLineId={bimNavigationContext?.targetType === 'presupuesto' ? bimNavigationContext.targetId : null}
                                                        onBack={() => setSelectedPresupuestoId(null)}
                                                    />
                                                </div>
                                            ) : (
                                                <div className="flex-1 flex items-center justify-center rounded-[1.25rem] border border-zinc-200 bg-white">
                                                    <div className="flex flex-col items-center gap-4">
                                                        <div className="w-12 h-12 border-4 border-zinc-200 border-t-[#F39200] rounded-full animate-spin" />
                                                        <p className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                                                            {resolvingPresupuesto ? 'Resolviendo presupuesto operativo...' : 'Preparando presupuesto...'}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </PresupuestoProvider>
                                ) : (
                                    <Card className="bg-white border-none shadow-[0_20px_50px_rgba(0,0,0,0.04)] rounded-[2.5rem] overflow-hidden">
                                        <CardHeader className="p-10 border-b border-zinc-50">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-8 h-8 rounded-xl bg-zinc-50 flex items-center justify-center">
                                                    {cloneElement(activeSectionMeta.icon, {
                                                        className: `w-4 h-4 ${activeSectionMeta.color}`
                                                    })}
                                                </div>
                                                <CardTitle className="text-2xl font-black uppercase tracking-tight">
                                                    {activeSectionMeta.label}
                                                </CardTitle>
                                            </div>
                                            <CardDescription className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">
                                                Módulo en Desarrollo • Sistema de Gestión de Infraestructura
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-20 text-center">
                                            <div className="flex flex-col items-center gap-6">
                                                <div className="relative">
                                                    <div className="w-24 h-24 bg-zinc-50 rounded-[2rem] flex items-center justify-center">
                                                        {cloneElement(activeSectionMeta.icon, {
                                                            className: `w-10 h-10 ${activeSectionMeta.color} opacity-20 animate-spin-slow`
                                                        })}
                                                    </div>
                                                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-white border border-zinc-100 rounded-full flex items-center justify-center shadow-lg">
                                                        <div className={`w-3 h-3 rounded-full ${activeSectionMeta.bg}`} />
                                                    </div>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black uppercase tracking-tight mb-2">Sección en Construcción</h3>
                                                    <p className="text-zinc-400 text-sm font-medium max-w-xs mx-auto">
                                                        Estamos preparando las herramientas de <strong>{activeSectionMeta.label}</strong> para este proyecto.
                                                    </p>
                                                </div>
                                                <div className="flex gap-2">
                                                    {[1, 2, 3].map(i => (
                                                        <div key={i} className="w-2 h-2 rounded-full bg-zinc-100" />
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </Suspense>
                        </MotionDiv>
                    </main>
                </div>
            </div>
        );
    }

    if (PROJECTS_HTML_REFERENCE_LANDING) {
        return (
            <>
                {renderHtmlPortfolioLanding()}
                {renderMarketplaceExportModal()}
                {renderPublicProcurementImporterModal()}
                {renderCreateProjectModal()}
                {renderPortfolioCalendarModal()}
                {renderProjectDeleteModal()}
                {renderProjectRecycleModal()}
            </>
        );
    }

    return (
        <div className="h-full flex flex-col bg-[#F2F4F7] text-[#1A1A1A] overflow-hidden">
            {/* Header de Módulo */}
            <header className="bg-white border-b border-zinc-200 px-8 py-4 flex-shrink-0 z-40 shadow-sm">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => navigate('/')}
                            className="p-2 hover:bg-zinc-100 rounded-xl transition-colors text-zinc-500"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Building2 className="w-5 h-5 text-[#F39200]" />
                                <h1 className="text-xl font-black uppercase tracking-tight">Gestión de <span className="text-[#F39200]">Proyectos</span></h1>
                            </div>
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.2em]">Portafolio de Infraestructura e Ingeniería</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <ClearSearchField
                            value={searchTerm || ''}
                            onValueChange={setSearchTerm}
                            placeholder="Buscar proyecto..."
                            containerClassName="hidden sm:block w-64"
                            inputClassName="w-full pl-10 pr-10 h-11 bg-zinc-50 border border-zinc-200 rounded-xl text-sm font-medium focus:outline-none focus:border-[#F39200] focus:ring-0 transition-all"
                        />
                        {['administrador', 'superadministrador'].includes(normalizedRole) && (
                            <>
                                <ProjectSectionIconButton
                                    icon={Users}
                                    label="Gestión de personal"
                                    onClick={() => navigate('/proyectos/gestor')}
                                    hintContent={<GiproyActionHint title="Gestión de personal" detail="Abre el gestor de equipos y asignaciones del módulo Proyectos." />}
                                    className={`${PROJECTS_COMPACT_ACTION_BUTTON_CLASS} text-zinc-600 hover:text-[#136191]`}
                                />
                                {canUsePublicProcurementImporter && (
                                    <ProjectSectionIconButton
                                        icon={UploadCloud}
                                        label="Importar SOCE/SERCOP"
                                        onClick={() => setShowPublicProcurementImportModal(true)}
                                        hintContent={<GiproyActionHint title="Importar SOCE/SERCOP" detail="Analiza documentos de compras públicas y prepara un proyecto clásico desde la fuente técnica." />}
                                        className={`${PROJECTS_COMPACT_ACTION_BUTTON_CLASS} text-[#136191] hover:text-[#136191]`}
                                    />
                                )}
                                {canExportProjectsToMarketplace && selectedProject && (
                                    <ProjectMarketplaceExportButton
                                        project={selectedProject}
                                        onExport={handleExportProjectToMarketplace}
                                        exportingProjectId={marketplaceExportingProjectId}
                                        exportStatus={marketplaceExportStatuses?.[String(selectedProject?.id)]}
                                        className={`${PROJECTS_COMPACT_ACTION_BUTTON_CLASS} text-[#136191] hover:text-[#136191]`}
                                    />
                                )}
                                <ProjectSectionIconButton
                                    icon={Trash2}
                                    label="Papelera"
                                    onClick={openProjectRecycleModal}
                                    hintContent={<GiproyActionHint title="Papelera" detail="Consulta proyectos eliminados y restaura o purga elementos dentro de los 7 días de retención." />}
                                    className={`${PROJECTS_COMPACT_ACTION_BUTTON_CLASS} text-zinc-600 hover:text-rose-700`}
                                />
                                <ProjectSectionIconButton
                                    icon={Plus}
                                    label={licenseInfo?.access_mode === 'readonly' ? 'Solo lectura' : (licenseInfo?.usados?.proyectos >= licenseInfo?.limites?.proyectos && licenseInfo?.limites?.proyectos !== -1 ? 'Límite alcanzado' : 'Nuevo Proyecto')}
                                    onClick={() => setShowCreateModal(true)}
                                    disabled={licenseInfo?.access_mode === 'readonly' || (licenseInfo?.usados?.proyectos >= licenseInfo?.limites?.proyectos && licenseInfo?.limites?.proyectos !== -1)}
                                    hintContent={<GiproyActionHint
                                        title={licenseInfo?.access_mode === 'readonly' ? 'Solo lectura' : (licenseInfo?.usados?.proyectos >= licenseInfo?.limites?.proyectos && licenseInfo?.limites?.proyectos !== -1 ? 'Límite alcanzado' : 'Nuevo proyecto')}
                                        detail={licenseInfo?.access_mode === 'readonly'
                                            ? 'La licencia activa no permite crear proyectos.'
                                            : (licenseInfo?.usados?.proyectos >= licenseInfo?.limites?.proyectos && licenseInfo?.limites?.proyectos !== -1
                                                ? 'La empresa alcanzó el máximo de proyectos disponibles.'
                                                : 'Crea un nuevo proyecto clásico en la empresa activa.')}
                                    />}
                                    className={`${PROJECTS_COMPACT_ACTION_BUTTON_CLASS} text-[#F39200] hover:text-[#F39200]`}
                                />
                            </>
                        )}
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-auto overscroll-contain w-full custom-scrollbar [touch-action:pan-x_pan-y]">
                <div className="p-12">
                    <MotionDiv
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-3xl font-black tracking-tight">Vista General</h2>
                                <div className="h-1 w-12 bg-[#F39200] mt-2 rounded-full" />
                            </div>

                        </div>

                        <Card className="bg-white border-none shadow-[0_10px_40px_rgba(0,0,0,0.03)] rounded-3xl overflow-hidden">
                            <CardContent className="p-0">
                                {loading ? (
                                    <div className="p-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-4 border-zinc-100 border-t-[#F39200] rounded-full animate-spin" />
                                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Cargando Portafolio...</p>
                                    </div>
                                ) : (
                                    <Table className="table-fixed min-w-[1560px]">
                                        <colgroup>
                                            <col className="w-[150px]" />
                                            <col className="w-[400px]" />
                                            <col className="w-[170px]" />
                                            <col className="w-[130px]" />
                                            <col className="w-[160px]" />
                                            <col className="w-[160px]" />
                                            <col className="w-[130px]" />
                                            <col className="w-[170px]" />
                                            <col className="w-[90px]" />
                                        </colgroup>
                                        <TableHeader className="bg-zinc-50/50 border-b border-zinc-100">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[9px] py-6 px-8">ID / Cód</TableHead>
                                                <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[9px] py-6">Proyecto</TableHead>
                                                <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[9px] py-6">Actualizacion</TableHead>
                                                <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[9px] py-6 text-center">Estado</TableHead>
                                                <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[9px] py-6">Presupuesto Calculado</TableHead>
                                                <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[9px] py-6">Presupuesto Entidad</TableHead>
                                                <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[9px] py-6">Tiempo Estimado</TableHead>
                                                <TableHead className="font-black text-zinc-400 uppercase tracking-widest text-[9px] py-6">Fecha Presentación</TableHead>
                                                <TableHead className="text-right py-6 px-8"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {proyectos.filter(p => includesNormalized(p.nombre, searchTerm) || includesNormalized(p.codigo, searchTerm)).length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={9} className="py-20 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <Building2 className="w-12 h-12 text-zinc-100" />
                                                            <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">No hay proyectos registrados</p>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                sortProjectsByLatestUpdate(proyectos.filter(p =>
                                                    includesNormalized(p.nombre, searchTerm) ||
                                                    includesNormalized(p.codigo, searchTerm) ||
                                                    includesNormalized(p.descripcion, searchTerm)
                                                )).map((proy) => {
                                                    const projectOriginData = originsMap.get(`proyecto:${proy.id}`) || null;
                                                    const hasMultipleRevisions = hasProjectRevisions(proy);
                                                    const projectCalculatedBudget = getProjectCalculatedBudget(proy);
                                                    const entityBudget = getProjectEntityBudget(proy);
                                                    const projectEstimatedTime = getProjectEstimatedTimeMeta(proy, projectDetailsMap);
                                                    const displayState = getProjectDisplayState(proy, proyectos);
                                                    const revisionUpdateMeta = getProjectRevisionUpdateMeta(proy);
                                                    return (
                                                    <TableRow
                                                        key={proy.id}
                                                        onClick={() => handleOpenRevisionModal(proy)}
                                                        className="hover:bg-zinc-50 transition-colors border-b border-zinc-50 last:border-0 group cursor-pointer"
                                                    >
                                                        <TableCell className="px-8 py-4">
                                                            <span className="block truncate font-bold text-[#1A1A1A] text-xs whitespace-nowrap">#{proy.codigo || proy.id}</span>
                                                        </TableCell>
                                                        <TableCell className="font-black tracking-tight text-sm text-[#1A1A1A]">
                                                            <div className="flex min-w-0 items-start gap-2">
                                                                <MarketplaceOriginBadgeSet
                                                                    origin={projectOriginData}
                                                                    mode="tooltip"
                                                                    label={`Origen de ${proy.nombre}`}
                                                                />
                                                                <div className="min-w-0">
                                                                    <div className="text-zinc-900 uppercase leading-snug break-words [overflow-wrap:anywhere]">{proy.nombre}</div>
                                                                    <p className="mt-1 line-clamp-2 text-[11px] font-semibold leading-snug text-zinc-500 break-words [overflow-wrap:anywhere]">
                                                                        {proy.descripcion || 'Sin descripcion registrada.'}
                                                                    </p>
                                                                    {proy.num_revisiones > 1 && (
                                                                        <span className="mt-1 inline-flex shrink-0 px-2 py-0.5 bg-zinc-100 text-zinc-500 text-[9px] font-black rounded-full border border-zinc-200">
                                                                            {proy.num_revisiones} VERSIONES
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-xs font-black text-[#1A1A1A] leading-snug">
                                                            <span className="block">{revisionUpdateMeta.label}</span>
                                                            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-400">Mas reciente</span>
                                                        </TableCell>
                                                        <TableCell className="text-center">
                                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${displayState === 'Planificación' ? 'bg-orange-50 text-[#F39200] border border-orange-100' :
                                                                displayState === 'Con revisiones' ? 'bg-zinc-100 text-zinc-600 border border-zinc-200' :
                                                                'bg-blue-50 text-[#136191] border border-blue-100'
                                                                }`}>
                                                                {displayState}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="font-black text-[#1A1A1A] text-sm tabular-nums whitespace-nowrap">
                                                            {hasMultipleRevisions ? (
                                                                <span className="text-zinc-400">Con revisiones</span>
                                                            ) : projectCalculatedBudget === null ? (
                                                                <span className="text-zinc-400">Sin presupuesto</span>
                                                            ) : (
                                                                <span>
                                                                    {formatMoneda(projectCalculatedBudget)} <span className="text-[10px] text-zinc-400 font-bold ml-1">{proy.moneda || 'USD'}</span>
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="font-black text-[#1A1A1A] text-sm tabular-nums whitespace-nowrap">
                                                            {editingEstimatedId === proy.id ? (
                                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                    <input
                                                                        autoFocus
                                                                        type="text"
                                                                        value={formatCurrencyInput(editingEstimatedValue, true)}
                                                                        onChange={(e) => setEditingEstimatedValue(parseNumericInput(e.target.value))}
                                                                        onBlur={(e) => handleSaveEstimated(proy, e)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') handleSaveEstimated(proy, e);
                                                                            if (e.key === 'Escape') setEditingEstimatedId(null);
                                                                        }}
                                                                        className="h-9 w-[140px] rounded-xl border border-zinc-200 px-3 text-sm font-black outline-none focus:border-[#F39200]"
                                                                    />
                                                                    <button
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        onClick={(e) => handleSaveEstimated(proy, e)}
                                                                        className="p-2 rounded-lg bg-zinc-900 text-white hover:bg-[#F39200] transition-colors"
                                                                    >
                                                                        <Check className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => handleStartEstimatedEdit(proy, e)}
                                                                    className="flex items-center gap-2 whitespace-nowrap hover:text-[#F39200] transition-colors"
                                                                >
                                                                    <span>
                                                                        {formatMoneda(entityBudget)} <span className="text-[10px] text-zinc-400 font-bold ml-1">{proy.moneda || 'USD'}</span>
                                                                    </span>
                                                                    <Pencil className="w-3.5 h-3.5 text-zinc-300" />
                                                                </button>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-sm font-bold text-zinc-700 whitespace-nowrap">
                                                            {projectEstimatedTime}
                                                        </TableCell>
                                                        <TableCell className="text-sm font-bold text-zinc-700 whitespace-nowrap">
                                                            {editingDateRoot === (proy.codigo_root || proy.codigo) ? (
                                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                                    <AnimatedDateInput
                                                                        autoFocus
                                                                        type="date"
                                                                        value={editingDateValue}
                                                                        onChange={(e) => setEditingDateValue(e.target.value)}
                                                                        onBlur={(e) => handleSavePresentationDate(proy, e)}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Enter') handleSavePresentationDate(proy, e);
                                                                            if (e.key === 'Escape') setEditingDateRoot(null);
                                                                        }}
                                                                        className="h-9 rounded-xl border border-zinc-200 px-3 text-sm font-black outline-none focus:border-[#F39200]"
                                                                    />
                                                                    <button
                                                                        onMouseDown={(e) => e.preventDefault()}
                                                                        onClick={(e) => handleSavePresentationDate(proy, e)}
                                                                        className="p-2 rounded-lg bg-zinc-900 text-white hover:bg-[#F39200] transition-colors"
                                                                    >
                                                                        <Check className="w-3.5 h-3.5" />
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <button
                                                                    onClick={(e) => handleStartDateEdit(proy, e)}
                                                                    className="flex items-center gap-2 whitespace-nowrap hover:text-[#F39200] transition-colors"
                                                                >
                                                                    <span>{getProjectPresentationMeta(proy).label}</span>
                                                                    {getProjectPresentationMeta(proy).fallback && (
                                                                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-500 text-[9px] font-black uppercase tracking-widest border border-zinc-200">
                                                                            Base
                                                                        </span>
                                                                    )}
                                                                    <Pencil className="w-3.5 h-3.5 text-zinc-300" />
                                                                </button>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right px-8">
                                                            <div className="flex items-center justify-end gap-2">
                                                                {['administrador', 'superadministrador'].includes(normalizedRole) && (
                                                                    <button
                                                                        type="button"
                                                                        data-project-delete-action="true"
                                                                        data-project-id={proy.id}
                                                                        onPointerUpCapture={(e) => openProjectDeleteModal(proy, e)}
                                                                        onClickCapture={(e) => openProjectDeleteModal(proy, e)}
                                                                        onClick={(e) => openProjectDeleteModal(proy, e)}
                                                                        className="p-2 rounded-lg hover:bg-red-50 transition-colors text-red-500 hover:text-red-600"
                                                                        title="Mover proyecto a papelera"
                                                                        aria-label={`Mover proyecto a papelera ${proy.nombre || proy.codigo || proy.id}`}
                                                                    >
                                                                        <ArchiveX className="pointer-events-none w-4 h-4" />
                                                                    </button>
                                                                )}
                                                                <button className="p-2 rounded-lg hover:bg-zinc-200 transition-colors text-zinc-400 hover:text-[#1A1A1A]">
                                                                    <ChevronRight className="w-5 h-5" />
                                                                </button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                    );
                                                })
                                            )}
                                        </TableBody>
                                    </Table>
                                )}
                            </CardContent>
                        </Card>
                    </MotionDiv>
                </div>
            </main>

            {/* Importador Compras Públicas */}
            {renderMarketplaceExportModal()}
            {renderPublicProcurementImporterModal()}
            {renderProjectRecycleModal()}

            {/* Modal de Creación */}
            {renderCreateProjectModal()}

            {/* Modal para Seleccionar Revisión a Abrir */}
            <AnimatePresence>
                {showRevisionModal && (
                    <AppModalShell
                        isOpen={true}
                        size="lg"
                        zIndex="z-[120]"
                        onClose={() => {
                            setShowRevisionModal(false);
                            setPendingKanbanTransition(null);
                            setRevisionModalMode('open');
                        }}
                    >
                            <AppModalHeader
                                title={revisionModalMode === 'kanban-approval' ? 'Elegir revisión aprobada' : 'Abrir Proyecto'}
                                subtitle={
                                    revisionModalMode === 'kanban-approval'
                                        ? `${projectForRevisions?.codigo_root || ''} - seleccione la revisión que pasa a la siguiente fase`
                                        : `${projectForRevisions?.codigo_root || ''} - seleccione la revisión a cargar`
                                }
                                icon={Copy}
                                iconClassName="text-[#F39200]"
                                iconWrapClassName="border-orange-200 bg-orange-50"
                                onClose={() => {
                                    setShowRevisionModal(false);
                                    setPendingKanbanTransition(null);
                                    setRevisionModalMode('open');
                                }}
                            />
                            <div className="p-8">
                                {loadingRevisions ? (
                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                        <div className="w-10 h-10 border-4 border-zinc-100 border-t-[#F39200] rounded-full animate-spin" />
                                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Cargando Revisiones...</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="space-y-4">
                                            <Label className="text-[10px] uppercase font-black tracking-widest text-zinc-500">
                                                {revisionModalMode === 'kanban-approval' ? 'Revisión aprobada para la fase' : 'Revisión del Proyecto'}
                                            </Label>
                                            <SearchableSelect
                                                options={projectRevisions.map(rev => ({
                                                    ...rev,
                                                    label: `Revision R${rev.revision.toString().padStart(3, '0')} - ${new Date(rev.ultima_modificacion).toLocaleDateString()}`
                                                }))}
                                                value={""}
                                                onChange={(val) => {
                                                    const selected = projectRevisions.find(r => r.id === val);
                                                    if (selected) {
                                                        handleRevisionModalSelection(selected);
                                                    }
                                                }}
                                                valueKey="id"
                                                labelKey="label"
                                                placeholder={revisionModalMode === 'kanban-approval' ? 'Seleccionar revisión aprobada...' : 'Seleccionar revisión...'}
                                            />
                                        </div>

                                        <div className="pt-4 border-t border-zinc-50">
                                            <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-4">
                                                {revisionModalMode === 'kanban-approval' ? 'O selecciona la revisión que queda aprobada:' : 'O selecciona del listado rápido:'}
                                            </p>
                                            <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                                {projectRevisions.map((rev) => {
                                                    const budgetInfo = revisionBudgetMap[rev.id] || null;
                                                    const canDeleteRevision = ['administrador', 'superadministrador'].includes(normalizedRole) && Number(rev.revision || 0) > 0;
                                                    return (
                                                    <div
                                                        key={rev.id}
                                                        onClick={() => {
                                                            handleRevisionModalSelection(rev);
                                                        }}
                                                        className="flex items-center justify-between p-3 bg-zinc-50 border border-zinc-100 rounded-xl hover:border-[#F39200] hover:bg-white cursor-pointer transition-all group"
                                                    >
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-white border border-zinc-100 flex items-center justify-center group-hover:border-[#F39200] transition-colors">
                                                                <span className="text-[#F39200] font-black text-[9px]">
                                                                    R{rev.revision.toString().padStart(3, '0')}
                                                                </span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-1.5">
                                                                    <MarketplaceOriginBadgeSet
                                                                        origin={originsMap.get(`proyecto:${rev.id}`)}
                                                                        mode="tooltip"
                                                                        label={`Origen de ${rev.nombre}`}
                                                                    />
                                                                    <span className="font-bold text-xs text-[#1A1A1A]">
                                                                        {rev.nombre}
                                                                    </span>
                                                                </div>
                                                                <span className="text-[8px] font-bold text-zinc-400 uppercase">
                                                                    {new Date(rev.ultima_modificacion).toLocaleDateString()}
                                                                </span>
                                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                    <span className="px-2 py-0.5 rounded-full border border-zinc-200 bg-white text-[8px] font-black uppercase tracking-widest text-zinc-500">
                                                                        Referencial {rev.moneda || 'USD'} {formatMoneda(rev.presupuesto_estimado || 0)}
                                                                    </span>
                                                                    <span className="px-2 py-0.5 rounded-full border border-[#E94E1B]/20 bg-[#E94E1B]/10 text-[8px] font-black uppercase tracking-widest text-[#E94E1B]">
                                                                        Presupuesto rev. {(budgetInfo?.moneda || rev.moneda || 'USD')} {formatMoneda(budgetInfo?.total || 0)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            {canDeleteRevision ? (
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => handleDeleteRevision(rev, event)}
                                                                    className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-white text-red-500 transition-all hover:bg-red-50 hover:border-red-300"
                                                                    title={`Eliminar revisión R${String(rev.revision || 0).padStart(3, '0')}`}
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            ) : null}
                                                            <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-[#F39200]" />
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                    </AppModalShell>
                )}
            </AnimatePresence>

            {/* Modal de Eliminación con Doble Confirmación */}
            <AnimatePresence>
                {showDeleteModal && (
                    <AppModalShell isOpen={true} size="sm" zIndex="z-[200]" onClose={() => setShowDeleteModal(false)}>
                            <div className="p-10">
                                <div className="flex flex-col items-center text-center">
                                    <div className={`w-20 h-20 rounded-[2rem] flex items-center justify-center mb-6 ${deleteStep === 1 ? 'bg-orange-50 text-orange-500' : 'bg-red-50 text-red-500'}`}>
                                        {deleteStep === 1 ? <AlertTriangle className="w-10 h-10" /> : <Trash2 className="w-10 h-10" />}
                                    </div>

                                    {deleteStep === 1 ? (
                                        <>
                                                <h2 className="text-2xl font-black uppercase tracking-tight mb-4">¿Eliminar Proyecto?</h2>
                                                <p className="text-zinc-500 text-sm font-medium mb-8">
                                                    Estás a punto de eliminar <strong>{projectToDelete?.nombre}</strong>.
                                                    Esta acción moverá el proyecto y sus revisiones a papelera durante 7 días.
                                                </p>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteProjectBase((value) => !value)}
                                                className={`mb-6 flex w-full items-start gap-3 rounded-[1.25rem] border px-4 py-3 text-left transition ${
                                                    deleteProjectBase
                                                        ? 'border-rose-200 bg-rose-50 text-rose-800'
                                                        : 'border-emerald-200 bg-emerald-50 text-emerald-800'
                                                }`}
                                            >
                                                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                                                    deleteProjectBase ? 'border-rose-300 bg-white' : 'border-emerald-300 bg-white'
                                                }`}>
                                                    {deleteProjectBase ? <Check className="h-3.5 w-3.5" /> : null}
                                                </span>
                                                <span className="min-w-0">
                                                    <span className="block text-[10px] font-black uppercase tracking-[0.16em]">
                                                        {deleteProjectBase ? 'Mover tambien la Base de Proyecto' : 'Conservar Base como Base Maestra'}
                                                    </span>
                                                    <span className="mt-1 block text-[11px] font-semibold leading-relaxed">
                                                        {deleteProjectBase
                                                            ? 'La base asociada tambien quedara en papelera junto al proyecto.'
                                                            : 'Se borrara el proyecto, pero la base quedara disponible como Base de Trabajo reutilizable.'}
                                                    </span>
                                                </span>
                                            </button>
                                            <div className="flex flex-col w-full gap-3">
                                                <LiquidButton
                                                    onClick={() => setDeleteStep(2)}
                                                    className="w-full !h-14 bg-[#1A1A1A] text-white text-[11px] font-black uppercase tracking-widest rounded-2xl"
                                                >
                                                    Entiendo, Continuar
                                                </LiquidButton>
                                                <button
                                                    onClick={() => setShowDeleteModal(false)}
                                                    className="w-full h-14 bg-zinc-50 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <h2 className="text-2xl font-black uppercase tracking-tight mb-4 text-red-600">CONFIRMACIÓN FINAL</h2>
                                            <p className="text-zinc-500 text-sm font-medium mb-8">
                                                ¿Estás seguro? {deleteProjectBase
                                                    ? 'El proyecto y su base quedaran ocultos de la operacion normal y podran restaurarse desde la papelera mientras no expiren.'
                                                    : 'El proyecto quedara oculto en papelera y la base asociada se convertira en Base de Trabajo reutilizable.'}
                                            </p>
                                            <div className="flex flex-col w-full gap-3">
                                                <LiquidButton
                                                    onClick={handleDeleteProject}
                                                    disabled={deleting}
                                                    className="w-full !h-14 bg-red-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2"
                                                >
                                                    {deleting ? (
                                                        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                                    ) : (
                                                        <Trash2 className="w-4 h-4" />
                                                    )}
                                                    Mover a Papelera
                                                </LiquidButton>
                                                <button
                                                    onClick={() => setShowDeleteModal(false)}
                                                    disabled={deleting}
                                                    className="w-full h-14 bg-zinc-50 text-zinc-500 text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-zinc-100 transition-all"
                                                >
                                                    Dar Marcha Atrás
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                    </AppModalShell>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Proyectos;
