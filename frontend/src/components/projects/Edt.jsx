import React, { useState, useEffect, useContext, useCallback, useMemo, useRef } from 'react';
import { Plus, Trash2, Edit2, User, ChevronRight, ChevronDown, GripVertical, Folders, UserCog, UserPlus, ArrowUp, ArrowDown, ListTree, FileText, Search, X, Move, Printer } from 'lucide-react';
import { edtApi } from '../../api/edt';
import reportingApi from '../../api/reporting';
import { presupuestosApi } from '../../api/presupuestos';
import { cronogramasApi } from '../../api/cronogramas';
import { stakeholdersApi, rolesApi } from '../../api/stakeholders';
import { AuthContext } from '../../context/AuthContext';
import { LiquidButton } from '../ui/liquid-button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import SearchableSelect from '../ui/searchable-select';
import { appAlert, appConfirm } from '../../utils/appDialog';
import { extractBlobErrorMessage } from '../../utils/apiBlobErrors';
import { downloadBlobResponse } from '../../utils/blobDownload';
import { buildReportFileName, sanitizeReportContext } from '../../utils/reportFileName';
import { APP_MODAL_CLOSE_BUTTON_CLASS, AppModalShell, AppModalBody, AppModalFooter } from '../ui/app-modal';
import {
    PORTABLE_WORKSPACE_EVENT,
    readPortableWorkspaceOverride,
    resolvePortableWorkspace,
} from '../../utils/portableWorkspace';
import HierarchyGraphView from './HierarchyGraphView';
import CommonReportPreviewModal from '../reporting/CommonReportPreviewModal';
import ClassicPrintOptionsModal from '../reporting/ClassicPrintOptionsModal';
import ProjectSectionReportButton, {
    PROJECT_REPORT_BUTTON_ACTIVE_CLASS,
    ProjectReportMenu,
    ProjectReportMenuItem,
} from './ProjectSectionReportButton';
import ProjectSegmentedSwitch from './ProjectSegmentedSwitch';
import MotionScrollbar from '../ui/MotionScrollbar';
import AppHint from '../ui/AppHint';
import SoftSelectToggle from '../ui/SoftSelectToggle';
import { normalizePersonName } from '../../utils/descriptionCapitalization';
import {
    DARK_RAIL_ICON_BUTTON_CLASS,
    DARK_RAIL_METRIC_CHIP_CLASS,
    DARK_RAIL_METRIC_DOT_CLASS,
    DARK_RAIL_METRIC_VALUE_CLASS,
} from '../ui/darkRailControls';
import { buildEdtNodeMetrics, formatEdtCurrency, formatEdtPercent } from '../../utils/edtValuation';
import { buildEdtGanttDurationSync, formatEdtGanttDurationDays } from '../../utils/edtGanttSync';
import {
    downloadClassicHierarchyPdf,
    summarizeHierarchyPrint,
} from '../../utils/classicPrintEngine';

const findNodeById = (nodes, nodeId) => {
    const stack = [...nodes];
    while (stack.length) {
        const current = stack.shift();
        if (current.id === nodeId) return current;
        if (current.hijos?.length) stack.unshift(...current.hijos);
    }
    return null;
};
const findNodePathById = (nodes, nodeId, trail = []) => {
    for (const node of nodes) {
        const nextTrail = [...trail, node];
        if (node.id === nodeId) return nextTrail;
        const nested = findNodePathById(node.hijos || [], nodeId, nextTrail);
        if (nested.length) return nested;
    }
    return [];
};

const collectNodeIds = (nodes = []) => {
    const ids = [];
    const visit = (items) => {
        (items || []).forEach((node) => {
            ids.push(node.id);
            if (node.hijos?.length) visit(node.hijos);
        });
    };
    visit(nodes);
    return ids;
};

const EDT_HEADER_SURFACE =
    'rounded-[1.1rem] border border-[#ececec] bg-[#f3f3f1] px-4 py-3 shadow-[8px_8px_20px_#dddddd,-8px_-8px_20px_#ffffff]';

const EDT_HEADER_TITLE =
    'text-lg font-black uppercase tracking-tight text-emerald-600';

const EDT_HEADER_SUBTITLE =
    'text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400';

const EDT_LABEL_CLASS =
    'text-[10px] font-black uppercase tracking-widest text-zinc-500';

const EDT_INPUT_CLASS =
    'h-11 rounded-xl border-zinc-200 bg-white font-medium text-zinc-800 focus:border-[#F39200]';

const EDT_SOFT_ICON_BUTTON =
    'inline-flex h-7 w-7 items-center justify-center rounded-xl border border-[#ececec] bg-[#ededed] shadow-[2px_2px_6px_#d5d5d5,-2px_-2px_6px_#ffffff] transition hover:brightness-[0.99] active:scale-[0.98] active:shadow-[inset_2px_2px_6px_#d0d0d0,inset_-2px_-2px_6px_#ffffff] disabled:cursor-not-allowed disabled:opacity-60';

const EDT_TREE_GRID_COLUMNS =
    'grid-cols-[4.75rem_5.25rem_minmax(0,1fr)_19rem_16rem]';
const EDT_GANTT_SYNC_BADGE_STYLES = {
    defined: {
        dot: 'bg-emerald-500',
        chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
        label: 'Duracion definida en Gantt',
    },
    partial: {
        dot: 'bg-amber-500',
        chip: 'border-amber-200 bg-amber-50 text-amber-700',
        label: 'Duracion parcial en Gantt',
    },
    pending: {
        dot: 'bg-slate-400',
        chip: 'border-slate-200 bg-slate-50 text-slate-500',
        label: 'Sin duracion asignada en Gantt',
    },
    none: {
        dot: 'bg-slate-300',
        chip: 'border-slate-200 bg-white text-slate-400',
        label: 'Sin partidas Gantt vinculadas',
    },
};
const resolveEdtGanttSyncStyle = (status) => (
    EDT_GANTT_SYNC_BADGE_STYLES[status] || EDT_GANTT_SYNC_BADGE_STYLES.none
);

const EDT_MODAL_CLOSE_BUTTON =
    APP_MODAL_CLOSE_BUTTON_CLASS;

const normalizeEdtSearch = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const getEdtNodeTitle = (node) =>
    node?.tipo_nodo === 'CUENTA_PAQUETE'
        ? node?.nombre || ''
        : normalizePersonName(`${node?.stakeholder?.nombre || ''} ${node?.stakeholder?.apellidos || ''}`);

const getEdtNodeSearchText = (node) => [
    node?.codigo,
    node?.nombre,
    node?.definicion,
    node?.stakeholder?.nombre,
    node?.stakeholder?.apellidos,
    node?.rol?.nombre,
    node?.actividades_claves,
].filter(Boolean).join(' ');

const filterEdtTreeBySearch = (nodes, query) => {
    const token = normalizeEdtSearch(query);
    if (!token) return nodes;
    return (nodes || []).reduce((acc, node) => {
        const filteredChildren = filterEdtTreeBySearch(node.hijos || [], token);
        const matches = normalizeEdtSearch(getEdtNodeSearchText(node)).includes(token);
        if (matches || filteredChildren.length) {
            acc.push({ ...node, hijos: filteredChildren });
        }
        return acc;
    }, []);
};

const normalizeStakeholderNodePayload = (formData) => ({
    stakeholder_id: formData?.stakeholder_id ? Number(formData.stakeholder_id) : null,
    rol_id: formData?.rol_id ? Number(formData.rol_id) : null,
    actividades_claves: formData?.actividades_claves || ''
});

const EdtModalHeader = ({
    title,
    subtitle,
    icon: Icon = ListTree,
    iconClassName = 'text-emerald-400',
    iconWrapClassName = 'border-emerald-300/20 bg-emerald-400/10',
    closeButtonClassName = EDT_MODAL_CLOSE_BUTTON,
    closeIconClassName = 'h-4 w-4',
    onClose,
}) => (
    <div className="flex items-center justify-between gap-4 border-b border-[#101318] bg-[#111318] px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] border ${iconWrapClassName}`}>
                <Icon className={`h-[18px] w-[18px] ${iconClassName}`} />
            </span>
            <div className="min-w-0">
                <h2 className="text-sm font-black uppercase tracking-tight text-white">{title}</h2>
                {subtitle ? <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white/48">{subtitle}</p> : null}
            </div>
        </div>
        <button
            type="button"
            onClick={onClose}
            className={closeButtonClassName}
            title="Cerrar"
            aria-label="Cerrar"
        >
            <X className={closeIconClassName} />
        </button>
    </div>
);

// Modal para Cuenta Paquete (Nodos Principales)
const CuentaPaqueteModal = ({ isOpen, onClose, onSave, isEditing, initialData }) => {
    const [nombre, setNombre] = useState('');
    const [definicion, setDefinicion] = useState('');

    useEffect(() => {
        if (isOpen && initialData) {
            setTimeout(() => {
                setNombre(prev => prev !== initialData.nombre ? (initialData.nombre || '') : prev);
                setDefinicion(prev => prev !== initialData.definicion ? (initialData.definicion || '') : prev);
            }, 0);
        } else if (isOpen) {
            setTimeout(() => {
                setNombre('');
                setDefinicion('');
            }, 0);
        }
    }, [isOpen, initialData]);


    if (!isOpen) return null;

    return (
        <AppModalShell isOpen={isOpen} onClose={onClose} size="md" zIndex="z-[110]" panelClassName="bg-[#f7f7f5]">
            <EdtModalHeader
                title={isEditing ? 'Editar cuenta' : 'Nueva cuenta'}
                subtitle="Nodo estructural de la EDT"
                icon={Folders}
                iconClassName="text-emerald-400"
                iconWrapClassName="border-emerald-300/20 bg-emerald-400/10"
                onClose={onClose}
            />
            <AppModalBody className="space-y-4 bg-[#f7f7f5] p-5">
                <section className="rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]">
                    <div className="mb-4 flex items-center gap-2">
                        <Folders className="h-4 w-4 text-emerald-600" />
                        <p className={EDT_LABEL_CLASS}>Identidad de la cuenta</p>
                    </div>
                    <div className="space-y-2">
                        <label className={EDT_LABEL_CLASS}>Nombre</label>
                        <Input
                            placeholder="Ej: Cimentación y Estructura..."
                            value={nombre}
                            onChange={e => setNombre(e.target.value)}
                            className={EDT_INPUT_CLASS}
                            autoFocus
                        />
                    </div>
                    <div className="mt-4 space-y-2">
                        <label className={EDT_LABEL_CLASS}>Definición o diccionario EDT</label>
                        <Textarea
                            placeholder="Describa el alcance de esta cuenta de control..."
                            value={definicion}
                            onChange={e => setDefinicion(e.target.value)}
                            className="min-h-[120px] rounded-xl border-zinc-200 bg-white p-4 text-sm font-medium text-zinc-800 focus:border-[#F39200]"
                        />
                    </div>
                </section>
            </AppModalBody>
            <AppModalFooter variant="flat" className="border-t border-[#ececec] bg-[#f7f7f5] px-5 py-4">
                <div className="flex gap-3 justify-end w-full">
                    <button type="button" onClick={onClose} className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700">Cancelar</button>
                    <LiquidButton onClick={() => onSave({ nombre, definicion })} className="!h-11 !px-8 bg-emerald-600 text-white text-xs font-black uppercase tracking-widest rounded-xl">
                        Guardar
                    </LiquidButton>
                </div>
            </AppModalFooter>
        </AppModalShell>
    );
};

// Modal para Stakeholders (Igual al de EDO pero con prefijo EDT)
const StakeholderModal = ({ isOpen, onClose, onSave, project, isEditing, initialData }) => {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const empId = selectedEmpresa?.id || user?.empresa_id || null;
    const [stakeholders, setStakeholders] = useState([]);
    const [roles, setRoles] = useState([]);
    const [newRoleName, setNewRoleName] = useState('');
    const [formData, setFormData] = useState({
        stakeholder_id: '',
        rol_id: '',
        actividades_claves: ''
    });

    useEffect(() => {
        if (isOpen && project) {
            if (isEditing && initialData) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setFormData(prev => {
                    const next = {
                        stakeholder_id: initialData.stakeholder_id || '',
                        rol_id: initialData.rol_id || '',
                        actividades_claves: initialData.actividades_claves || ''
                    };
                    if (JSON.stringify(prev) !== JSON.stringify(next)) return next;
                    return prev;
                });
            } else {
                setFormData({ stakeholder_id: '', rol_id: '', actividades_claves: '' });
            }
            stakeholdersApi.getByProject(project.codigo_root, project.id, empId).then(data => {
                setStakeholders(data);
            });
            rolesApi.getAll(empId).then(data => setRoles(data));
            setNewRoleName('');
        }
    }, [isOpen, project, isEditing, initialData, empId]);

    if (!isOpen) return null;

    const handleStakeholderSelect = (val) => {
        setFormData(prev => ({
            ...prev,
            stakeholder_id: val,
            rol_id: prev.rol_id || ''
        }));
    };

    const handleCreateRole = async () => {
        const roleName = newRoleName.trim();
        if (!roleName) {
            appAlert('Debe ingresar un nombre para el rol.');
            return;
        }
        try {
            const createdRole = await rolesApi.create({ nombre: roleName }, empId);
            setRoles(prev => [...prev, createdRole]);
            setFormData(prev => ({ ...prev, rol_id: createdRole.id }));
            setNewRoleName('');
        } catch (error) {
            appAlert(error?.response?.data?.detail || 'No se pudo crear el rol.');
        }
    };

    return (
        <AppModalShell isOpen={isOpen} onClose={onClose} size="lg" zIndex="z-[110]" panelClassName="bg-[#f7f7f5]">
            <EdtModalHeader
                title={isEditing ? 'Editar participante' : 'Asignar participante'}
                subtitle="Stakeholder del directorio común del proyecto"
                icon={User}
                iconClassName="text-purple-400"
                iconWrapClassName="border-purple-300/20 bg-purple-400/10"
                onClose={onClose}
            />
            <AppModalBody className="space-y-4 bg-[#f7f7f5] p-5">
                <section className="rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]">
                    <div className="mb-4 flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-500" />
                        <p className={EDT_LABEL_CLASS}>Participante</p>
                    </div>
                    <div className="space-y-2">
                        <label className={EDT_LABEL_CLASS}>Stakeholder</label>
                        {isEditing ? (
                            <div className="w-full h-11 px-4 flex items-center border border-zinc-200 bg-zinc-50 rounded-xl text-sm text-zinc-600 font-medium select-none cursor-not-allowed">
                                {normalizePersonName(`${initialData?.stakeholder?.nombre || ''} ${initialData?.stakeholder?.apellidos || ''}`)}
                            </div>
                        ) : (
                            <SearchableSelect
                                options={stakeholders.map(s => ({
                                    id: s.id,
                                    nombre_completo: normalizePersonName(`${s.nombre || ''} ${s.apellidos || ''}`)
                                }))}
                                valueKey="id"
                                labelKey="nombre_completo"
                                value={formData.stakeholder_id}
                                onChange={handleStakeholderSelect}
                                placeholder="Buscar stakeholder del proyecto..."
                            />
                        )}
                    </div>
                </section>
                <section className="rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]">
                    <div className="mb-4 flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-[#F39200]" />
                        <p className={EDT_LABEL_CLASS}>Rol operativo</p>
                    </div>
                    <div className="space-y-2">
                        <label className={EDT_LABEL_CLASS}>Rol específico</label>
                        <SearchableSelect
                            options={roles}
                            valueKey="id"
                            labelKey="nombre"
                            value={formData.rol_id}
                            onChange={(val) => setFormData(prev => ({ ...prev, rol_id: val }))}
                            placeholder="Sobrescribir rol..."
                        />
                        <div className="flex gap-2">
                            <Input
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        handleCreateRole();
                                    }
                                }}
                                placeholder="Crear nuevo rol..."
                                className={EDT_INPUT_CLASS}
                            />
                            <LiquidButton
                                type="button"
                                onClick={handleCreateRole}
                                className="!h-11 !px-4 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-xl"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Crear
                            </LiquidButton>
                        </div>
                    </div>
                </section>
                <section className="rounded-[1.15rem] border border-[#ececec] bg-white p-4 shadow-[4px_4px_12px_#e1e1e1,-4px_-4px_12px_#ffffff]">
                    <div className="mb-4 flex items-center gap-2">
                        <Folders className="h-4 w-4 text-emerald-600" />
                        <p className={EDT_LABEL_CLASS}>Responsabilidades</p>
                    </div>
                    <div className="space-y-2">
                        <label className={EDT_LABEL_CLASS}>Observaciones o actividades específicas</label>
                        <textarea
                            value={formData.actividades_claves}
                            onChange={(e) => setFormData(prev => ({ ...prev, actividades_claves: e.target.value }))}
                            placeholder="Detalles sobre su participación en esta cuenta..."
                            className="w-full h-24 p-4 border border-zinc-200 rounded-xl bg-white text-sm font-medium text-zinc-800 outline-none focus:border-purple-500 transition-colors"
                        />
                    </div>
                </section>
            </AppModalBody>
            <AppModalFooter variant="flat" className="border-t border-[#ececec] bg-[#f7f7f5] px-5 py-4">
                <div className="flex gap-3 justify-end w-full">
                    <button type="button" onClick={onClose} className="h-11 rounded-xl border border-zinc-200 bg-white px-5 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700">Cancelar</button>
                    <LiquidButton
                        onClick={() => onSave(formData)}
                        disabled={!formData.stakeholder_id}
                        className="!h-11 !px-8 bg-purple-500 text-white text-xs font-black uppercase tracking-widest rounded-xl disabled:opacity-50"
                    >
                        {isEditing ? 'Guardar Cambios' : 'Asignar'}
                    </LiquidButton>
                </div>
            </AppModalFooter>
        </AppModalShell>
    );
};

// Modal para Mover Selección EDT
const MoveSelectionModal = ({ isOpen, onClose, onConfirm, tree }) => {
    const [targetParentId, setTargetParentId] = useState(null);

    if (!isOpen) return null;

    const flattenCuentas = (nodes, result = []) => {
        nodes.forEach(node => {
            if (node.tipo_nodo === 'CUENTA_PAQUETE') {
                result.push({ id: node.id, nombre: `${node.codigo} - ${node.nombre}` });
                if (node.hijos) flattenCuentas(node.hijos, result);
            }
        });
        return result;
    };

    const options = [{ id: 'root', nombre: 'NIVEL RAÍZ (SIN PADRE)' }, ...flattenCuentas(tree)];

    return (
        <AppModalShell isOpen={isOpen} onClose={onClose} size="sm" zIndex="z-[120]" panelClassName="rounded-[1.25rem] bg-[#f7f7f5]">
            <EdtModalHeader
                title="Mover elementos"
                subtitle="Seleccione la cuenta destino"
                icon={Move}
                closeButtonClassName={`${APP_MODAL_CLOSE_BUTTON_CLASS} !h-8 !w-8 !rounded-[0.75rem]`}
                closeIconClassName="h-3.5 w-3.5"
                onClose={onClose}
            />
            <AppModalBody className="bg-[#f7f7f5] px-5 py-4">
                <div className="space-y-2">
                    <label className={EDT_LABEL_CLASS}>Cuenta de destino</label>
                    <SearchableSelect
                        options={options}
                        valueKey="id"
                        labelKey="nombre"
                        value={targetParentId}
                        onChange={setTargetParentId}
                        placeholder="Buscar cuenta de destino..."
                        triggerClassName="flex h-11 w-full cursor-pointer items-center justify-between rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-sm font-semibold text-zinc-700 shadow-[inset_1px_1px_3px_rgba(186,190,204,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] transition-all duration-200 hover:border-zinc-300"
                        dropdownClassName="rounded-xl border-zinc-200 shadow-[0_16px_36px_rgba(15,23,42,0.16)]"
                        searchInputClassName="w-full rounded-lg border border-zinc-100 bg-zinc-50 py-2 pl-9 pr-10 text-sm font-semibold text-zinc-700 outline-none focus:border-[#F39200] focus:ring-2 focus:ring-[#F39200]/10"
                        optionClassName="rounded-lg font-semibold hover:bg-orange-50 hover:text-[#F39200] dark:hover:bg-orange-900/20 dark:hover:text-orange-300"
                        optionSelectedClassName="rounded-lg bg-orange-50 font-black text-[#F39200] hover:bg-orange-50 hover:text-[#F39200]"
                        checkClassName="text-[#F39200]"
                    />
                </div>
            </AppModalBody>
            <AppModalFooter variant="flat" className="border-t border-[#ececec] bg-[#f7f7f5] px-5 py-3.5">
                <div className="flex w-full justify-end gap-2.5">
                    <button type="button" onClick={onClose} className="h-10 rounded-xl border border-zinc-200 bg-white px-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 transition hover:border-zinc-300 hover:text-zinc-700">Cancelar</button>
                    <button
                        type="button"
                        onClick={() => onConfirm(targetParentId === 'root' ? null : targetParentId)}
                        className="h-10 rounded-xl border border-emerald-600/20 bg-emerald-600 px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-[0_8px_18px_rgba(5,150,105,0.24)] transition hover:bg-emerald-700 active:scale-[0.99]"
                    >
                        Mover Ahora
                    </button>
                </div>
            </AppModalFooter>
        </AppModalShell>
    );
};

// Componente recursivo para cada NODO del Árbol EDT
const EdtNodeItem = ({ node, level = 0, isExpanded, expandedNodes, onToggle, onAddCuenta, onAddStakeholder, onEdit, onDelete, onDragStartNode, onDropOnNode, dragOverNodeId, setDragOverNodeId, onReorder, isSelected, isActive, activeNodeId, onActivate, selectedIds, onToggleSelection, compact = false, totalValorado = 0 }) => {
    const isCuenta = node.tipo_nodo === 'CUENTA_PAQUETE';
    const valuePercent = isCuenta && totalValorado > 0 ? ((node.metrics?.valorado || 0) / totalValorado) * 100 : 0;
    const ganttSync = node.gantt_duration_sync;
    const ganttSyncStyle = resolveEdtGanttSyncStyle(ganttSync?.status);
    const [isRowHovered, setIsRowHovered] = useState(false);

    const handleDragStart = (e) => {
        e.stopPropagation();
        onDragStartNode(e, node);
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (isCuenta && dragOverNodeId !== node.id) {
            setDragOverNodeId(node.id);
        }
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragOverNodeId === node.id) {
            setDragOverNodeId(null);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragOverNodeId(null);
        onDropOnNode(e, node.id);
    };

    return (
        <div className="relative w-full" id={`edt-node-${node.id}`}>
            <div
                draggable
                onMouseEnter={() => setIsRowHovered(true)}
                onMouseLeave={() => setIsRowHovered(false)}
                onClick={() => onActivate(node.id)}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onDoubleClick={(e) => { e.stopPropagation(); onEdit(node); }}
                className={`
                    relative z-10 grid ${EDT_TREE_GRID_COLUMNS} items-center border-b border-r px-0 py-0 transition-all duration-200
                    ${dragOverNodeId === node.id ? 'border-b-emerald-400 bg-emerald-50' : isActive ? 'border-b-emerald-200 bg-emerald-50/70 shadow-[inset_0_0_0_1px_rgba(5,150,105,0.10)]' : 'border-b-slate-100 bg-white hover:border-b-emerald-200 hover:bg-[#f7f7f5]'}
                    ${isCuenta ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-purple-500 bg-purple-50/10'}
                `}
            >
                <div className="flex h-full items-center gap-1.5 px-3 py-1.5">
                    <div className="text-slate-300 hover:text-slate-600 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-3.5 h-3.5" />
                    </div>
                    <SoftSelectToggle
                        checked={isSelected}
                        onChange={(e) => { e.stopPropagation(); onToggleSelection(node); }}
                        label={isSelected ? 'Quitar de la selección' : 'Seleccionar nodo'}
                        size="sm"
                        tone={isCuenta ? 'green' : 'purple'}
                        muted={!isRowHovered && !isSelected}
                    />
                </div>

                <div className={`px-2 py-1.5 text-[11px] font-mono font-bold tracking-wider ${isCuenta ? 'text-emerald-700' : 'text-purple-600'}`}>
                    {node.codigo}
                </div>

                <div className="min-w-0 px-2 py-1.5">
                    {compact ? (
                        <div className="flex min-w-0 flex-col justify-center" style={{ paddingLeft: `${level * 1.25}rem` }}>
                            <div className="mt-1 flex items-start gap-2 min-w-0">
                                {isCuenta ? <Folders className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> : <UserCog className="w-3.5 h-3.5 text-purple-500 shrink-0" />}
                                <div className="min-w-0">
                                    <AppHint as="div" content={getEdtNodeTitle(node)} tone="light" disabled={getEdtNodeTitle(node).length < 36}>
                                    <div className="max-w-[28rem] truncate font-semibold text-[11px] leading-tight text-slate-800">
                                        {isCuenta ? node.nombre : getEdtNodeTitle(node)}
                                    </div>
                                    </AppHint>
                                    {!isCuenta && node.rol?.nombre && (
                                        <span className="inline-flex mt-0.5 px-1.5 py-[1px] text-[8.5px] uppercase font-bold tracking-widest bg-purple-100 text-purple-700 rounded border border-purple-200">
                                            {node.rol.nombre}
                                        </span>
                                    )}
                                </div>
                            </div>
                            {isCuenta && node.definicion && (
                                <AppHint content={node.definicion} tone="light" disabled={node.definicion.length < 42}>
                                <span className="block max-w-[26rem] truncate text-[10px] text-zinc-400 italic mt-1.5 leading-tight">
                                    <FileText className="w-3 h-3 shrink-0" /> {node.definicion}
                                </span>
                                </AppHint>
                            )}
                            {!isCuenta && node.actividades_claves && (
                                <AppHint content={node.actividades_claves} tone="light" disabled={node.actividades_claves.length < 42}>
                                <span className="block max-w-[26rem] truncate text-[10px] text-slate-500 italic mt-1 leading-tight">
                                    {node.actividades_claves}
                                </span>
                                </AppHint>
                            )}
                        </div>
                    ) : (
                        <div className="flex flex-col min-w-0 justify-center" style={{ paddingLeft: `${level * 1.25}rem` }}>
                                <div className="flex items-center gap-2">
                                    {isCuenta ? <Folders className="w-3.5 h-3.5 text-emerald-600" /> : <UserCog className="w-3.5 h-3.5 text-purple-500" />}
                                    <AppHint as="span" content={getEdtNodeTitle(node)} tone="light" disabled={getEdtNodeTitle(node).length < 36}>
                                    <span className="block max-w-[34rem] truncate text-[12.5px] font-semibold text-slate-800">
                                        {isCuenta ? node.nombre : getEdtNodeTitle(node)}
                                    </span>
                                    </AppHint>
                                    {!isCuenta && node.rol?.nombre && (
                                        <span className="ml-1.5 px-1.5 py-[1px] text-[8.5px] uppercase font-bold tracking-widest bg-purple-100 text-purple-700 rounded border border-purple-200">
                                            {node.rol.nombre}
                                        </span>
                                    )}
                                </div>
                                {isCuenta && node.definicion && (
                                    <AppHint content={node.definicion} tone="light" disabled={node.definicion.length < 52}>
                                    <span className="block max-w-[32rem] truncate text-[10.5px] text-zinc-400 italic mt-0.5 ml-5">
                                        <FileText className="w-3 h-3" /> {node.definicion}
                                    </span>
                                    </AppHint>
                                )}
                                {!isCuenta && node.actividades_claves && (
                                    <AppHint content={node.actividades_claves} tone="light" disabled={node.actividades_claves.length < 52}>
                                    <span className="block max-w-[32rem] truncate text-[11px] text-slate-500 italic mt-0.5 ml-5">
                                        {node.actividades_claves}
                                    </span>
                                    </AppHint>
                                )}
                            </div>
                    )}
                </div>

                <div className="flex h-full flex-wrap items-center justify-end gap-1 px-3 py-1.5 text-[9px] font-black uppercase tracking-[0.11em]">
                    {isCuenta && node.metrics ? (
                        <>
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-zinc-500">Dir. {formatEdtCurrency(node.metrics.directo)}</span>
                            <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">Val. {formatEdtCurrency(node.metrics.valorado)}</span>
                            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-amber-700">% {formatEdtPercent(valuePercent)}</span>
                            <AppHint
                                content={`${ganttSyncStyle.label}: ${formatEdtGanttDurationDays(ganttSync?.days || 0)} (${ganttSync?.scheduledRows || 0}/${ganttSync?.totalRows || 0} partidas).`}
                                tone="light"
                                maxWidth={280}
                            >
                                <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 ${ganttSyncStyle.chip}`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${ganttSyncStyle.dot}`} />
                                    <span>Dur. {formatEdtGanttDurationDays(ganttSync?.days || 0)}</span>
                                </span>
                            </AppHint>
                        </>
                    ) : null}
                </div>

                <div className={`flex h-full items-center justify-end gap-1 px-3 py-1.5 transition-opacity ${isRowHovered ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    {isCuenta && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
                                className={`${EDT_SOFT_ICON_BUTTON} text-zinc-500`}
                                title={isExpanded ? 'Contraer rama' : 'Expandir rama'}
                            >
                                {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                            <div className="w-px h-3.5 bg-slate-200 mx-0.5"></div>
                        </>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onReorder(node, -1); }} className={`${EDT_SOFT_ICON_BUTTON} text-zinc-500`} title="Mover arriba">
                        <ArrowUp className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onReorder(node, 1); }} className={`${EDT_SOFT_ICON_BUTTON} text-zinc-500`} title="Mover abajo">
                        <ArrowDown className="w-3 h-3" />
                    </button>
                    <div className="w-px h-3.5 bg-slate-200 mx-0.5"></div>

                    {isCuenta && (
                        <>
                            <button onClick={(e) => { e.stopPropagation(); onAddCuenta(node.id); }} className={`${EDT_SOFT_ICON_BUTTON} text-emerald-600`} title="Añadir cuenta">
                                <Plus className="w-3 h-3" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); onAddStakeholder(node.id); }} className={`${EDT_SOFT_ICON_BUTTON} text-purple-500`} title="Asignar stakeholder">
                                <UserPlus className="w-3 h-3" />
                            </button>
                            <div className="w-px h-3.5 bg-slate-200 mx-0.5"></div>
                        </>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onEdit(node); }} className={`${EDT_SOFT_ICON_BUTTON} text-[#F39200]`} title="Editar">
                        <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDelete(node.id); }} className={`${EDT_SOFT_ICON_BUTTON} text-zinc-300 hover:text-red-500`} title="Eliminar">
                        <Trash2 className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {isExpanded && node.hijos && node.hijos.length > 0 && (
                <div className="relative">
                    <div
                        className="absolute w-[2px] bg-slate-200/60 z-0 border-l border-dashed border-slate-300"
                        style={{ left: `${(level * 1.25) + 10.6}rem`, top: 0, bottom: 0 }}
                    />

                    {node.hijos.map(hijo => (
                        <EdtNodeItem
                            key={hijo.id}
                            node={hijo}
                            level={level + 1}
                            expandedNodes={expandedNodes}
                            isExpanded={!expandedNodes.has(hijo.id)}
                            onToggle={onToggle}
                            onAddCuenta={onAddCuenta}
                            onAddStakeholder={onAddStakeholder}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onDragStartNode={onDragStartNode}
                            onDropOnNode={onDropOnNode}
                            dragOverNodeId={dragOverNodeId}
                            setDragOverNodeId={setDragOverNodeId}
                            onReorder={onReorder}
                            isSelected={selectedIds.has(hijo.id)}
                            isActive={activeNodeId === hijo.id}
                            activeNodeId={activeNodeId}
                            onActivate={onActivate}
                            selectedIds={selectedIds}
                            onToggleSelection={onToggleSelection}
                            compact={compact}
                            totalValorado={totalValorado}
                        />
                    ))}
                    <div
                        onDragOver={(e) => { e.preventDefault(); setDragOverNodeId(`${node.id}-end`) }}
                        onDragLeave={() => setDragOverNodeId(null)}
                        onDrop={(e) => { e.preventDefault(); setDragOverNodeId(null); onDropOnNode(e, node.id, true); }}
                        className={`h-4 mx-2 rounded-full transition-colors ${dragOverNodeId === `${node.id}-end` ? 'bg-[#136191]/20' : 'bg-transparent'}`}
                    />
                </div>
            )}
        </div>
    );
};

const Edt = ({ project, initialFocusNodeId = null }) => {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const normalizedRole = (user?.rol || '').toLowerCase();
    const empId = selectedEmpresa?.id || user?.empresa_id || null;
    const [tree, setTree] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState(new Set());

    // Modals state
    const [cuentaModal, setCuentaModal] = useState({ isOpen: false, parentId: null, isEditing: false, nodeData: null });
    const [stakeholderModal, setStakeholderModal] = useState({ isOpen: false, parentId: null, isEditing: false, nodeData: null });
    const [moveBulkModal, setMoveBulkModal] = useState(false);

    // Multiple selection state
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [activeNodeId, setActiveNodeId] = useState(null);

    // Drag state
    const [dragOverNodeId, setDragOverNodeId] = useState(null);
    const [viewMode, setViewMode] = useState('graph');
    const [searchTerm, setSearchTerm] = useState('');
    const [graphToolbarTarget, setGraphToolbarTarget] = useState(null);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [reportPreview, setReportPreview] = useState(null);
    const [loadingReportPreview, setLoadingReportPreview] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [reportMenuOpen, setReportMenuOpen] = useState(false);
    const [printOptionsOpen, setPrintOptionsOpen] = useState(false);
    const reportMenuRef = useRef(null);
    const treeContainerRef = useRef(null);
    const [lastAddedId, setLastAddedId] = useState(null);
    const [activeBudget, setActiveBudget] = useState(null);
    const [budgetLoading, setBudgetLoading] = useState(false);
    const [ganttTrabajo, setGanttTrabajo] = useState(null);
    const [ganttSyncLoading, setGanttSyncLoading] = useState(false);
    const [forcedPortableWorkspace, setForcedPortableWorkspace] = useState(() => readPortableWorkspaceOverride());
    const [viewport, setViewport] = useState(() => ({
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
    }));

    const loadTree = useCallback(async () => {
        try {
            setLoading(true);
            const data = await edtApi.getTree(project.id, empId);
            setTree(data);
            setSelectedIds((prev) => new Set(Array.from(prev).filter((id) => Boolean(findNodeById(data, id)))));
            setActiveNodeId((prev) => (prev && findNodeById(data, prev) ? prev : null));
        } catch (error) {
            globalThis.reportClientError?.("Error cargando EDT:", error);
        } finally {
            setLoading(false);
        }
    }, [project.id, empId]);

    const loadOperationalBudget = useCallback(async () => {
        if (!project?.id) return;
        try {
            setBudgetLoading(true);
            const response = await presupuestosApi.getByProyecto(project.id, empId);
            const budget = response?.data?.[0] || null;
            if (!budget?.id) {
                setActiveBudget(null);
                return;
            }
            const detail = await presupuestosApi.getById(budget.id, empId);
            setActiveBudget(detail);
        } catch (error) {
            globalThis.reportClientError?.('Error cargando presupuesto operativo en EDT:', error);
            setActiveBudget(null);
        } finally {
            setBudgetLoading(false);
        }
    }, [project?.id, empId]);

    const loadGanttTrabajo = useCallback(async () => {
        if (!activeBudget?.id) {
            setGanttTrabajo(null);
            return;
        }
        try {
            setGanttSyncLoading(true);
            const data = await cronogramasApi.getTrabajo(activeBudget.id, empId);
            setGanttTrabajo(data || null);
        } catch (error) {
            globalThis.reportClientError?.('Error sincronizando duraciones Gantt en EDT:', error);
            setGanttTrabajo(null);
        } finally {
            setGanttSyncLoading(false);
        }
    }, [activeBudget?.id, empId]);

    const reloadEdtAndBudget = useCallback(async () => {
        await Promise.all([loadTree(), loadOperationalBudget()]);
    }, [loadTree, loadOperationalBudget]);


    useEffect(() => {
        if (project?.id) loadTree();
    }, [project?.id, loadTree]);

    useEffect(() => {
        loadOperationalBudget();
    }, [loadOperationalBudget]);

    useEffect(() => {
        loadGanttTrabajo();
    }, [loadGanttTrabajo]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const syncViewport = () => setViewport({ width: window.innerWidth, height: window.innerHeight });
        const syncPortableOverride = () => setForcedPortableWorkspace(readPortableWorkspaceOverride());
        syncViewport();
        syncPortableOverride();
        window.addEventListener('resize', syncViewport);
        window.addEventListener('storage', syncPortableOverride);
        window.addEventListener(PORTABLE_WORKSPACE_EVENT, syncPortableOverride);
        return () => {
            window.removeEventListener('resize', syncViewport);
            window.removeEventListener('storage', syncPortableOverride);
            window.removeEventListener(PORTABLE_WORKSPACE_EVENT, syncPortableOverride);
        };
    }, []);

    useEffect(() => {
        if (!reportMenuOpen) return undefined;
        const handlePointerDownOutside = (event) => {
            if (reportMenuRef.current?.contains(event.target)) return;
            setReportMenuOpen(false);
        };
        document.addEventListener('pointerdown', handlePointerDownOutside, true);
        return () => document.removeEventListener('pointerdown', handlePointerDownOutside, true);
    }, [reportMenuOpen]);

    const isCompactViewport = resolvePortableWorkspace({
        moduleKey: 'project-structure',
        width: viewport.width,
        height: viewport.height,
        forced: user?.role === 'superadmin' && forcedPortableWorkspace,
    });

    const valuedTreeBase = useMemo(
        () => buildEdtNodeMetrics({
            tree,
            lineas: activeBudget?.detalle || [],
            tanteoSession: null,
            indirectosPorcentaje: activeBudget?.indirectos_porcentaje || 0,
        }),
        [tree, activeBudget?.detalle, activeBudget?.indirectos_porcentaje]
    );
    const { tree: valuedTree, summary: ganttSyncSummary } = useMemo(
        () => buildEdtGanttDurationSync({
            tree: valuedTreeBase,
            rows: ganttTrabajo?.rows || [],
        }),
        [valuedTreeBase, ganttTrabajo?.rows]
    );

    const totalDirecto = useMemo(
        () => valuedTree.reduce((acc, node) => acc + (node.metrics?.directo || 0), 0),
        [valuedTree]
    );
    const totalValorado = useMemo(
        () => valuedTree.reduce((acc, node) => acc + (node.metrics?.valorado || 0), 0),
        [valuedTree]
    );
    const hasBudgetValues = (activeBudget?.detalle || []).length > 0;
    const hasGanttSyncRows = (ganttSyncSummary?.totalRows || 0) > 0;
    const ganttSyncSummaryStyle = resolveEdtGanttSyncStyle(ganttSyncSummary?.status);
    const filteredTree = useMemo(
        () => filterEdtTreeBySearch(valuedTree, searchTerm),
        [valuedTree, searchTerm]
    );
    const visibleTreeIds = useMemo(() => collectNodeIds(filteredTree), [filteredTree]);
    const allVisibleSelected = visibleTreeIds.length > 0 && visibleTreeIds.every((id) => selectedIds.has(id));
    const toggleVisibleSelection = () => {
        if (!visibleTreeIds.length) return;
        if (allVisibleSelected) {
            setSelectedIds(new Set());
            setActiveNodeId(null);
            return;
        }
        setSelectedIds(new Set(visibleTreeIds));
        setActiveNodeId(visibleTreeIds[0]);
    };

    const buildEdtReportFilename = useCallback((extension) => buildReportFileName({
        reportLabel: 'EDT Listado',
        contextLabel: sanitizeReportContext(project?.nombre || project?.codigo_root || 'Proyecto', 'Proyecto'),
        revision: project?.revision ?? 0,
        extension,
    }), [project?.nombre, project?.codigo_root, project?.revision]);

    const handleOpenReportPreview = useCallback(async () => {
        if (!project?.id) return;
        try {
            setLoadingReportPreview(true);
            const reportEmpresaId = project?.empresa_id || empId;
            const response = await reportingApi.previewReport({
                report_type: 'edt',
                entity_ids: [project.id],
                template_id: '001',
                variant: 'listado',
                empresa_id: reportEmpresaId,
            }, reportEmpresaId);
            setReportPreview(response.data);
            setShowReportPreview(true);
        } catch (error) {
            globalThis.reportClientError?.('Error generando vista previa de EDT:', error);
            appAlert(await extractBlobErrorMessage(error, 'No fue posible generar la vista previa del reporte EDT.'));
        } finally {
            setLoadingReportPreview(false);
        }
    }, [project?.id, project?.empresa_id, empId]);

    const handleExportReport = useCallback(async (format) => {
        if (!project?.id) return;
        try {
            setGeneratingReport(true);
            const reportEmpresaId = project?.empresa_id || empId;
            const response = await reportingApi.exportReport({
                report_type: 'edt',
                entity_ids: [project.id],
                template_id: reportPreview?.template_id || '001',
                variant: reportPreview?.variant || 'listado',
                format,
                empresa_id: reportEmpresaId,
            }, reportEmpresaId);
            downloadBlobResponse(
                response,
                buildEdtReportFilename(format === 'xlsx' ? 'xlsx' : 'pdf'),
                format === 'xlsx' ? undefined : 'application/pdf'
            );
        } catch (error) {
            globalThis.reportClientError?.('Error exportando reporte EDT:', error);
            const fallbackMessage =
                format === 'xlsx'
                    ? 'No fue posible exportar el reporte EDT en Excel.'
                    : format === 'pdf_excel'
                        ? 'No fue posible exportar el reporte EDT en PDF desde Excel.'
                        : 'No fue posible exportar el reporte EDT en PDF.';
            appAlert(await extractBlobErrorMessage(error, fallbackMessage));
        } finally {
            setGeneratingReport(false);
        }
    }, [project?.id, project?.empresa_id, reportPreview?.template_id, reportPreview?.variant, empId, buildEdtReportFilename]);

    const handleGenerateGraphicPrint = useCallback(({ pageSize, orientation, printMode, rowsPerPage }) => {
        try {
            setGeneratingReport(true);
            downloadClassicHierarchyPdf({
                tree: valuedTree,
                moduleType: 'edt',
                project,
                pageSize,
                orientation,
                printMode,
                rowsPerPage,
                currency: activeBudget?.moneda || 'USD',
            });
            setPrintOptionsOpen(false);
        } catch (error) {
            globalThis.reportClientError?.('Error preparando lámina gráfica EDT:', error);
            appAlert({
                title: 'No se pudo generar el PDF',
                message: error?.message || 'No fue posible generar la lámina gráfica EDT.',
                tone: 'danger',
            });
        } finally {
            setGeneratingReport(false);
        }
    }, [activeBudget?.moneda, project, valuedTree]);

    useEffect(() => {
        if (lastAddedId && !loading) {
            const element = document.getElementById(`edt-node-${lastAddedId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                setLastAddedId(null);
            }
        }
    }, [tree, lastAddedId, loading]);

    useEffect(() => {
        if (viewMode !== 'tree' || !activeNodeId) return;
        const element = document.getElementById(`edt-node-${activeNodeId}`);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [viewMode, activeNodeId, tree]);

    useEffect(() => {
        if (!activeNodeId) return;
        const path = findNodePathById(tree, activeNodeId);
        if (!path.length) return;
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            path.forEach((node) => {
                if (node.tipo_nodo === 'CUENTA_PAQUETE') next.delete(node.id);
            });
            return next;
        });
    }, [activeNodeId, tree]);

    useEffect(() => {
        if (!initialFocusNodeId || loading) return;
        setActiveNodeId(initialFocusNodeId);
        setSelectedIds(new Set([initialFocusNodeId]));
        setExpandedNodes((prev) => {
            const next = new Set(prev);
            next.delete(initialFocusNodeId);
            return next;
        });
        setViewMode('tree');
        window.setTimeout(() => {
            const element = document.getElementById(`edt-node-${initialFocusNodeId}`);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }, 120);
    }, [initialFocusNodeId, loading]);

    const handleToggle = (id) => {
        const newSet = new Set(expandedNodes);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setExpandedNodes(newSet);
    };

    const toggleSelection = (node) => {
        const newSet = new Set(selectedIds);
        const isCurrentlySelected = newSet.has(node.id);

        const toggleRecursive = (n, select) => {
            if (select) newSet.add(n.id);
            else newSet.delete(n.id);
            if (n.hijos) n.hijos.forEach(child => toggleRecursive(child, select));
        };

        toggleRecursive(node, !isCurrentlySelected);
        setSelectedIds(newSet);
        setActiveNodeId(node.id);
    };

    const handleGraphSelect = (nodeId) => {
        setActiveNodeId(nodeId);
        setSelectedIds(new Set([nodeId]));
    };
    const nodeContainsDescendant = (node, targetId) => {
        if (!node?.hijos?.length) return false;
        return node.hijos.some((child) => child.id === targetId || nodeContainsDescendant(child, targetId));
    };

    const handleSaveCuenta = async (data) => {
        try {
            if (cuentaModal.isEditing) {
                await edtApi.update(cuentaModal.nodeData.id, data, empId);
            } else {
                const newNode = await edtApi.create({
                    proyecto_id: project.id,
                    parent_id: cuentaModal.parentId,
                    tipo_nodo: 'CUENTA_PAQUETE',
                    nombre: data.nombre,
                    definicion: data.definicion,
                    orden: 0,
                    codigo: 'TBD'
                }, empId);
                setLastAddedId(newNode.id);
                if (cuentaModal.parentId) {
                    setExpandedNodes(prev => new Set(prev).add(cuentaModal.parentId));
                }
            }
            setCuentaModal({ isOpen: false });
            await reloadEdtAndBudget();
        } catch (error) {
            globalThis.reportClientError?.(error);
            appAlert("Error al guardar cuenta paquete.");
        }
    };

    const handleSaveStakeholder = async (formData) => {
        try {
            const normalized = normalizeStakeholderNodePayload(formData);
            if (stakeholderModal.isEditing) {
                await edtApi.update(stakeholderModal.nodeData.id, normalized, empId);
            } else {
                const newNode = await edtApi.create({
                    proyecto_id: project.id,
                    parent_id: stakeholderModal.parentId,
                    tipo_nodo: 'STAKEHOLDER',
                    ...normalized,
                    orden: 0,
                    codigo: 'TBD'
                }, empId);
                setLastAddedId(newNode.id);
                if (stakeholderModal.parentId) {
                    setExpandedNodes(prev => new Set(prev).add(stakeholderModal.parentId));
                }
            }
            setStakeholderModal({ isOpen: false });
            await reloadEdtAndBudget();
        } catch (error) {
            globalThis.reportClientError?.(error);
            appAlert("Error al asignar stakeholder.");
        }
    };

    const handleDelete = async (id) => {
        const confirmed = await appConfirm({
            title: 'Eliminar elemento EDT',
            message: '¿Seguro que desea eliminar esta cuenta o participante? Si es un paquete de trabajo, se borrarán todos sus hijos recursivamente Y TODAS LAS LÍNEAS DE PRESUPUESTO ASOCIADAS.',
            confirmLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            tone: 'danger'
        });
        if (!confirmed) {
            return;
        }
        try {
            await edtApi.delete(id, empId);
            await reloadEdtAndBudget();
        } catch (error) {
            globalThis.reportClientError?.(error);
            appAlert("Error al eliminar.");
        }
    };

    const handleBulkDelete = async () => {
        if (!selectedIds.size) return;
        const confirmed = await appConfirm({
            title: 'Eliminar selección EDT',
            message: `¿Seguro que desea eliminar los ${selectedIds.size} elementos seleccionados y sus descendientes?\n\n⚠️ ADVERTENCIA: Esta acción eliminará irremediablemente todas las LÍNEAS DE PRESUPUESTO que estén contenidas dentro de estos capítulos EDT.`,
            confirmLabel: 'Eliminar',
            cancelLabel: 'Cancelar',
            tone: 'danger'
        });
        if (!confirmed) return;
        try {
            setLoading(true);
            await edtApi.bulkDelete(Array.from(selectedIds), empId);
            setSelectedIds(new Set());
            setActiveNodeId(null);
            await reloadEdtAndBudget();
        } catch (error) {
            globalThis.reportClientError?.("Bulk delete error:", error);
            appAlert("Error al eliminar elementos en bloque.");
        } finally {
            setLoading(false);
        }
    };

    const handleBulkMove = async (newParentId) => {
        try {
            setLoading(true);
            await edtApi.bulkMove(Array.from(selectedIds), newParentId, empId);
            setMoveBulkModal(false);
            setSelectedIds(new Set());
            setActiveNodeId(null);
            await reloadEdtAndBudget();
        } catch (error) {
            globalThis.reportClientError?.(error);
            appAlert("Error al mover elementos en bloque.");
            setLoading(false);
        }
    };

    const onDragStartNode = (e, node) => {
        e.dataTransfer.setData('application/json', JSON.stringify({ nodeId: node.id, currentParentId: node.parent_id }));
        e.dataTransfer.effectAllowed = 'move';
    };

    const onDropOnNode = async (e, targetParentId) => {
        try {
            const dataStr = e.dataTransfer.getData('application/json');
            if (!dataStr) return;
            const dragged = JSON.parse(dataStr);

            if (dragged.nodeId === targetParentId) return;

            const newOrden = 99999;
            await edtApi.move(dragged.nodeId, targetParentId, newOrden, empId);
            await reloadEdtAndBudget();
            setExpandedNodes(prev => new Set(prev).add(targetParentId));
        } catch (error) {
            globalThis.reportClientError?.("Error un drop:", error);
            appAlert("No se pudo mover el elemento.");
        }
    };

    const handleReorder = async (node, direction) => {
        const newOrden = Math.max(0, node.orden + direction);
        if (newOrden === node.orden) return;

        try {
            await edtApi.move(node.id, node.parent_id, newOrden, empId);
            await reloadEdtAndBudget();
        } catch (error) {
            globalThis.reportClientError?.("Error al reordenar:", error);
            appAlert("No se pudo cambiar el orden.");
        }
    };
    const handleGraphReorder = async (draggedNode, targetNode, dropZone) => {
        if (!draggedNode || !targetNode || draggedNode.id === targetNode.id) return;
        if (targetNode.tipo_nodo !== 'CUENTA_PAQUETE') {
            appAlert("Solo se puede soltar sobre otra cuenta EDT.");
            return;
        }
        if (draggedNode.parent_id === targetNode.id) {
            const confirmed = await appConfirm({
                title: 'Subir cuenta EDT de nivel',
                message: `¿Mover "${draggedNode.nombre}" al mismo nivel que "${targetNode.nombre}"?`,
                confirmLabel: 'Mover',
                cancelLabel: 'Cancelar',
                tone: 'info'
            });
            if (!confirmed) return;
            try {
                await edtApi.move(draggedNode.id, targetNode.parent_id, targetNode.orden + 1, empId);
                await reloadEdtAndBudget();
            } catch (error) {
                globalThis.reportClientError?.(error);
                appAlert("No se pudo subir la cuenta de nivel en la vista gráfica.");
            }
            return;
        }
        if (dropZone === 'inside') {
            if (nodeContainsDescendant(draggedNode, targetNode.id)) {
                appAlert("No se puede mover una cuenta dentro de uno de sus propios descendientes.");
                return;
            }
            const confirmed = await appConfirm({
                title: 'Mover cuenta EDT',
                message: `¿Hacer que "${draggedNode.nombre}" dependa de "${targetNode.nombre}"?`,
                confirmLabel: 'Mover',
                cancelLabel: 'Cancelar',
                tone: 'info'
            });
            if (!confirmed) return;
            try {
                const newOrder = (targetNode.hijos || []).length;
                await edtApi.move(draggedNode.id, targetNode.id, newOrder, empId);
                await reloadEdtAndBudget();
                setExpandedNodes((prev) => new Set(prev).add(targetNode.id));
            } catch (error) {
                globalThis.reportClientError?.(error);
                appAlert("No se pudo mover la cuenta en la vista gráfica.");
            }
            return;
        }
        if (dropZone !== 'before' && dropZone !== 'after') return;
        if (draggedNode.parent_id !== targetNode.parent_id) {
            appAlert("Para reordenar, las cuentas deben compartir el mismo padre.");
            return;
        }
        const confirmed = await appConfirm({
            title: 'Reordenar cuenta EDT',
            message: dropZone === 'before'
                ? `¿Colocar "${draggedNode.nombre}" antes de "${targetNode.nombre}"?`
                : `¿Colocar "${draggedNode.nombre}" después de "${targetNode.nombre}"?`,
            confirmLabel: 'Reordenar',
            cancelLabel: 'Cancelar',
            tone: 'info'
        });
        if (!confirmed) return;
        try {
            const newOrder = dropZone === 'before' ? targetNode.orden : targetNode.orden + 1;
            await edtApi.move(draggedNode.id, targetNode.parent_id, newOrder, empId);
            await reloadEdtAndBudget();
        } catch (error) {
            globalThis.reportClientError?.(error);
            appAlert("No se pudo reordenar la cuenta en la vista gráfica.");
        }
    };

    const handleDropOnRoot = async (e) => {
        e.preventDefault();
        setDragOverNodeId(null);
        try {
            const dataStr = e.dataTransfer.getData('application/json');
            if (!dataStr) return;
            const dragged = JSON.parse(dataStr);
            await edtApi.move(dragged.nodeId, null, 99999, empId);
            await reloadEdtAndBudget();
        } catch (error) {
            globalThis.reportClientError?.(error);
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
            <div className={EDT_HEADER_SURFACE}>
                <div className="flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
                    <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.9rem] border border-emerald-200/70 bg-emerald-50 text-emerald-600">
                            <ListTree className="h-4 w-4" />
                        </span>
                        <div className="min-w-0">
                            <h2 className={EDT_HEADER_TITLE}>Estructura de Desglose EDT</h2>
                            <p className={EDT_HEADER_SUBTITLE}>Jerarquía de productos, cuentas y paquetes</p>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 ${isCompactViewport ? 'flex-wrap' : 'xl:justify-end'}`}>
                    <ProjectSegmentedSwitch
                        value={viewMode}
                        onChange={setViewMode}
                        options={[
                            { value: 'graph', label: 'Gráfico' },
                            { value: 'tree', label: 'Árbol' },
                        ]}
                        size="md"
                        ariaLabel="Modo de visualización EDT"
                    />
                    <div ref={reportMenuRef} className="relative">
                        <ProjectSectionReportButton
                            sectionLabel="EDT"
                            onClick={() => setReportMenuOpen((current) => !current)}
                            disabled={generatingReport || loadingReportPreview}
                            className={reportMenuOpen ? PROJECT_REPORT_BUTTON_ACTIVE_CLASS : ''}
                        />
                        {reportMenuOpen ? (
                            <ProjectReportMenu widthClassName="w-[17rem]">
                                <ProjectReportMenuItem
                                    onClick={async () => {
                                        setReportMenuOpen(false);
                                        await handleOpenReportPreview();
                                    }}
                                    disabled={loadingReportPreview || generatingReport}
                                    icon={FileText}
                                >
                                    Reporte documental
                                </ProjectReportMenuItem>
                                <ProjectReportMenuItem
                                    onClick={() => {
                                        setReportMenuOpen(false);
                                        setPrintOptionsOpen(true);
                                    }}
                                    disabled={loading || budgetLoading || valuedTree.length === 0}
                                    icon={Printer}
                                    accent="blue"
                                >
                                    Lámina gráfica
                                </ProjectReportMenuItem>
                            </ProjectReportMenu>
                        ) : null}
                    </div>
                    </div>
                </div>
            </div>

            <div className={`${isCompactViewport ? 'rounded-[1.25rem]' : 'rounded-[1.25rem]'} flex flex-1 min-h-0 flex-col overflow-hidden border border-[#ececec] bg-[#f7f7f5] shadow-[10px_10px_26px_#dddddd,-10px_-10px_26px_#ffffff]`}>
                <div className={`border-b border-[#101318] bg-[#111318] px-5 pt-2.5 ${viewMode === 'tree' ? 'pb-0' : 'pb-2.5'}`}>
                    <div className="flex flex-wrap items-center gap-3">
                        <AppHint content="Nueva cuenta principal" tone="light">
                            <button
                                type="button"
                                onClick={() => setCuentaModal({ isOpen: true, parentId: null, isEditing: false })}
                                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/80 bg-[#f7f7f5] text-emerald-600 shadow-[0_4px_12px_rgba(0,0,0,0.26),0_0_0_1px_rgba(255,255,255,0.42)] transition hover:bg-white hover:text-emerald-700 active:scale-[0.98] active:shadow-[inset_2px_2px_6px_rgba(0,0,0,0.18),inset_-2px_-2px_6px_rgba(255,255,255,0.75)]"
                                aria-label="Nueva cuenta principal"
                            >
                                <Plus className="h-[18px] w-[18px]" strokeWidth={2.2} />
                            </button>
                        </AppHint>
                        <div className="relative w-full sm:max-w-[22rem]">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                            <input
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                                placeholder={viewMode === 'graph' ? 'Buscar cuenta o participante...' : 'Buscar en EDT...'}
                                className="h-9 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-9 text-sm font-semibold text-zinc-700 shadow-[inset_1px_1px_3px_rgba(186,190,204,0.35),inset_-2px_-2px_5px_rgba(255,255,255,0.8)] outline-none placeholder:text-zinc-400 focus:border-[#F39200] focus:ring-2 focus:ring-[#F39200]/10"
                            />
                            {searchTerm ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition hover:text-zinc-700"
                                    aria-label="Limpiar búsqueda EDT"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            ) : null}
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            {viewMode === 'graph' ? (
                                <div ref={setGraphToolbarTarget} className="flex min-h-9 min-w-0 flex-1 flex-wrap items-center justify-end gap-2" />
                            ) : null}
                            {viewMode === 'tree' && hasBudgetValues ? (
                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                    <AppHint content={`Directo: ${formatEdtCurrency(totalDirecto)}.`} tone="dark" maxWidth={220} widthOffset={12}>
                                        <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                                            <span className={`${DARK_RAIL_METRIC_DOT_CLASS} bg-emerald-300`} />
                                            <span>Dir.</span>
                                            <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-emerald-100`}>{formatEdtCurrency(totalDirecto)}</span>
                                        </div>
                                    </AppHint>
                                    <AppHint content={`Indirectos: ${formatEdtPercent(activeBudget?.indirectos_porcentaje || 0)}.`} tone="dark" maxWidth={220} widthOffset={12}>
                                        <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                                            <span className={`${DARK_RAIL_METRIC_DOT_CLASS} bg-amber-300`} />
                                            <span>Ind.</span>
                                            <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-amber-100`}>{formatEdtPercent(activeBudget?.indirectos_porcentaje || 0)}</span>
                                        </div>
                                    </AppHint>
                                    <AppHint content={`Valorado sin IVA: directo + indirectos del presupuesto (${formatEdtCurrency(totalValorado)}).`} tone="dark" maxWidth={300} widthOffset={12}>
                                        <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                                            <span className={`${DARK_RAIL_METRIC_DOT_CLASS} bg-sky-300`} />
                                            <span>Val.</span>
                                            <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-sky-100`}>{formatEdtCurrency(totalValorado)}</span>
                                        </div>
                                    </AppHint>
                                    {hasGanttSyncRows || ganttSyncLoading ? (
                                        <AppHint content={`${ganttSyncLoading ? 'Sincronizando duracion Gantt...' : `${ganttSyncSummaryStyle.label}: ${formatEdtGanttDurationDays(ganttSyncSummary?.days || 0)}.`}`} tone="dark" maxWidth={260} widthOffset={12}>
                                            <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                                                <span className={`${DARK_RAIL_METRIC_DOT_CLASS} ${ganttSyncLoading ? 'bg-white/35' : ganttSyncSummaryStyle.dot}`} />
                                                <span>Dur.</span>
                                                <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} text-cyan-100`}>{ganttSyncLoading ? '...' : formatEdtGanttDurationDays(ganttSyncSummary?.days || 0)}</span>
                                            </div>
                                        </AppHint>
                                    ) : null}
                                </div>
                            ) : null}
                            {viewMode === 'tree' ? (
                                <div className="flex flex-wrap items-center justify-end gap-1.5">
                                    <AppHint content={`${selectedIds.size} ${selectedIds.size === 1 ? 'nodo seleccionado' : 'nodos seleccionados'}.`} tone="dark" maxWidth={240} widthOffset={12}>
                                        <div className={DARK_RAIL_METRIC_CHIP_CLASS}>
                                            <span className={`${DARK_RAIL_METRIC_DOT_CLASS} ${selectedIds.size > 0 ? 'bg-emerald-300' : 'bg-white/25'}`} />
                                            <span>Sel.</span>
                                            <span className={`${DARK_RAIL_METRIC_VALUE_CLASS} ${selectedIds.size > 0 ? 'text-emerald-100' : 'text-white/35'}`}>{selectedIds.size}</span>
                                        </div>
                                    </AppHint>
                                    <AppHint content="Mover selección" tone="dark">
                                        <button type="button" onClick={() => setMoveBulkModal(true)} className={`${DARK_RAIL_ICON_BUTTON_CLASS} text-emerald-600 hover:text-emerald-700`} disabled={selectedIds.size === 0} aria-label="Mover selección EDT">
                                            <Move className="h-3.5 w-3.5" />
                                        </button>
                                    </AppHint>
                                    <AppHint content="Eliminar selección" tone="dark">
                                        <button type="button" onClick={handleBulkDelete} className={`${DARK_RAIL_ICON_BUTTON_CLASS} text-red-500 hover:text-red-600`} disabled={selectedIds.size === 0} aria-label="Eliminar selección EDT">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                    </AppHint>
                                    <AppHint content="Limpiar selección" tone="dark">
                                        <button type="button" onClick={() => { setSelectedIds(new Set()); setActiveNodeId(null); }} className={DARK_RAIL_ICON_BUTTON_CLASS} disabled={selectedIds.size === 0} aria-label="Limpiar selección EDT">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </AppHint>
                                </div>
                            ) : null}
                        </div>
                    </div>
                    {viewMode === 'tree' ? (
                        <div className={`mt-2 grid ${EDT_TREE_GRID_COLUMNS} items-center border-t border-white/10 text-[10px] font-black uppercase tracking-widest text-white/60`}>
                            <div className="flex justify-center px-3 py-2.5">
                                <SoftSelectToggle
                                    checked={allVisibleSelected}
                                    onChange={toggleVisibleSelection}
                                    label={allVisibleSelected ? 'Limpiar selección visible' : 'Seleccionar todos los visibles'}
                                    size="sm"
                                    tone="green"
                                    muted={!allVisibleSelected}
                                    disabled={visibleTreeIds.length === 0}
                                />
                            </div>
                            <div className="px-2 py-2.5">Código</div>
                            <div className="px-2 py-2.5">Descripción / Responsable</div>
                            <div className="px-3 py-2.5 text-right">Subvalores</div>
                            <div className="px-3 py-2.5 text-right">Acciones</div>
                        </div>
                    ) : null}
                </div>
                {loading || budgetLoading ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-zinc-100 border-t-[#136191] rounded-full animate-spin" />
                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-[10px]">Cargando EDT...</p>
                    </div>
                ) : valuedTree.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center">
                            <ListTree className="w-8 h-8 text-[#136191] opacity-50" />
                        </div>
                        <p className="text-zinc-400 font-bold uppercase tracking-widest text-xs mt-4">La estructura EDT está vacía</p>
                        <button onClick={() => setCuentaModal({ isOpen: true, parentId: null, isEditing: false })} className="text-[#136191] font-black text-[10px] uppercase tracking-widest hover:underline mt-2">
                            AÑADIR EL PRIMER PAQUETE DE TRABAJO
                        </button>
                    </div>
                ) : viewMode === 'tree' && searchTerm && filteredTree.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                        <Search className="w-12 h-12 text-zinc-300" />
                        <div>
                            <p className="text-zinc-500 font-black uppercase tracking-[0.16em] text-[10px]">Sin coincidencias EDT</p>
                            <p className="mt-1 text-xs font-semibold text-zinc-400">Ajusta la búsqueda para recuperar la estructura visible.</p>
                        </div>
                    </div>
                ) : viewMode === 'graph' ? (
                    <HierarchyGraphView
                        tree={valuedTree}
                        moduleType="edt"
                        compact={isCompactViewport}
                        selectedIds={selectedIds}
                        onSelectNode={handleGraphSelect}
                        onMoveSelection={() => setMoveBulkModal(true)}
                        onDeleteSelection={handleBulkDelete}
                                    activeNodeId={activeNodeId}
                                    onClearSelection={() => {
                                        setSelectedIds(new Set());
                                        setActiveNodeId(null);
                                    }}
                        onCreateChild={(parentId) => setCuentaModal({ isOpen: true, parentId, isEditing: false })}
                        onCreateStakeholder={(parentId) => setStakeholderModal({ isOpen: true, parentId, isEditing: false })}
                        onEditNode={(node) => (
                            node.tipo_nodo === 'CUENTA_PAQUETE'
                                ? setCuentaModal({ isOpen: true, parentId: node.parent_id, isEditing: true, nodeData: node })
                                : setStakeholderModal({ isOpen: true, parentId: node.parent_id, isEditing: true, nodeData: node })
                        )}
                        onEditEmbeddedStakeholder={(node) => setStakeholderModal({ isOpen: true, parentId: node.parent_id, isEditing: true, nodeData: node })}
                        onDeleteNode={(node) => handleDelete(node.id)}
                        onDeleteEmbeddedStakeholder={(node) => handleDelete(node.id)}
                        onReorderNodes={handleGraphReorder}
                        economicSummary={{
                            enabled: hasBudgetValues,
                            totalDirecto,
                            indirectosPorcentaje: activeBudget?.indirectos_porcentaje || 0,
                            totalValorado,
                        }}
                        toolbarPortalTarget={graphToolbarTarget}
                        useExternalToolbar
                        externalSearchTerm={searchTerm}
                        onExternalSearchTermChange={setSearchTerm}
                    />
                ) : (
                    <div className="relative flex max-h-full flex-1 min-h-0 flex-col overflow-hidden border-x border-b border-[#ececec] bg-white shadow-[0_12px_34px_rgba(15,23,42,0.05)]">
                        <div
                            className={`flex w-full items-center justify-center overflow-hidden border-b transition-all ${dragOverNodeId === 'root' ? 'min-h-[24px] border-dashed border-emerald-600 bg-emerald-50' : 'min-h-[6px] border-transparent bg-white'}`}
                            onDragOver={(e) => { e.preventDefault(); setDragOverNodeId('root'); }}
                            onDragLeave={() => setDragOverNodeId(null)}
                            onDrop={handleDropOnRoot}
                        >
                            {dragOverNodeId === 'root' && <span className="text-[9px] font-bold text-emerald-600 uppercase">Mover al nivel principal</span>}
                        </div>
                        <div className="relative min-h-0 flex-1">
                            <div ref={treeContainerRef} className="giproy-motion-scrollbar-hide flex h-full flex-col overflow-y-auto pr-5">
                                {filteredTree.map(node => (
                                    <EdtNodeItem
                                        key={node.id}
                                        node={node}
                                        level={0}
                                        expandedNodes={expandedNodes}
                                        isExpanded={!expandedNodes.has(node.id)}
                                        onToggle={handleToggle}
                                        onAddCuenta={(pid) => setCuentaModal({ isOpen: true, parentId: pid, isEditing: false })}
                                        onAddStakeholder={(pid) => setStakeholderModal({ isOpen: true, parentId: pid, isEditing: false })}
                                        onEdit={(n) => {
                                            if (n.tipo_nodo === 'CUENTA_PAQUETE') {
                                                setCuentaModal({ isOpen: true, parentId: n.parent_id, isEditing: true, nodeData: n });
                                            } else {
                                                setStakeholderModal({ isOpen: true, parentId: n.parent_id, isEditing: true, nodeData: n });
                                            }
                                        }}
                                        onDelete={handleDelete}
                                        onDragStartNode={onDragStartNode}
                                        onDropOnNode={onDropOnNode}
                                        dragOverNodeId={dragOverNodeId}
                                        setDragOverNodeId={setDragOverNodeId}
                                        onReorder={handleReorder}
                                        isSelected={selectedIds.has(node.id)}
                                        isActive={activeNodeId === node.id}
                                        activeNodeId={activeNodeId}
                                        onActivate={setActiveNodeId}
                                        selectedIds={selectedIds}
                                        onToggleSelection={toggleSelection}
                                        compact={isCompactViewport}
                                        totalValorado={totalValorado}
                                    />
                                ))}
                            </div>
                            <MotionScrollbar targetRef={treeContainerRef} className="right-1" />
                        </div>
                    </div>
                )}
            </div>

            <CuentaPaqueteModal
                isOpen={cuentaModal.isOpen}
                onClose={() => setCuentaModal({ isOpen: false })}
                onSave={handleSaveCuenta}
                isEditing={cuentaModal.isEditing}
                initialData={cuentaModal.nodeData}
            />

            <StakeholderModal
                isOpen={stakeholderModal.isOpen}
                onClose={() => setStakeholderModal({ isOpen: false })}
                onSave={handleSaveStakeholder}
                project={project}
                isEditing={stakeholderModal.isEditing}
                initialData={stakeholderModal.nodeData}
            />

            <MoveSelectionModal
                isOpen={moveBulkModal}
                onClose={() => setMoveBulkModal(false)}
                onConfirm={handleBulkMove}
                tree={tree}
            />
            <CommonReportPreviewModal
                isOpen={showReportPreview}
                onClose={() => setShowReportPreview(false)}
                preview={reportPreview}
                onExportExcel={() => handleExportReport('xlsx')}
                onExportPdf={() => handleExportReport('pdf')}
                onExportPdfFromExcel={() => handleExportReport('pdf_excel')}
                exporting={generatingReport}
            />
            <ClassicPrintOptionsModal
                isOpen={printOptionsOpen}
                onClose={() => setPrintOptionsOpen(false)}
                onConfirm={handleGenerateGraphicPrint}
                targetLabel="EDT gráfico"
                defaultPageSize="A3"
                defaultOrientation="landscape"
                supportsPagination
                defaultPrintMode="complete"
                defaultRowsPerPage={30}
                summaryItems={summarizeHierarchyPrint(valuedTree)}
                recommendedText="Para EDT valoradas o profundas se recomienda A1 o A0 horizontal."
            />
        </div>
    );
};

export default Edt;
