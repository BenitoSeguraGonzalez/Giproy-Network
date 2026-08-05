import React, { useCallback, useEffect, useState } from 'react';
import {
    AlertTriangle,
    CheckCircle2,
    GitMerge,
    Plus,
    RefreshCw,
    ShieldCheck,
} from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';
import { cronogramasApi } from '../../api/cronogramas';
import { presupuestosApi } from '../../api/presupuestos';
import { getErrorMessage } from '../../utils/errorMessage';

const statusLabel = {
    coordinated: 'Coordinado',
    incomplete: 'Incompleto',
    conflict: 'Con conflictos',
    outdated: 'Desactualizado',
    not_configured: 'Sin configurar',
    disabled: 'Desactivado',
    unresolved: 'Sin resolver',
    partial: 'Parcial',
};

const readinessCopy = {
    missing_bim_disciplines: {
        label: 'Faltan disciplinas BIM',
        detail: (value) =>
            `Solo constan ${(value.present_disciplines || ['General']).join(', ')}; revisa la federación por disciplina.`,
    },
    missing_functional_role_assignments: {
        label: 'Roles funcionales sin asignar',
        detail: (value) =>
            `${value.technical_administrators ?? 0} administrador(es) técnico(s); los responsables de negocio no se han inferido.`,
    },
    unclassified_budget_lines: {
        label: 'Partidas sin OmniClass',
        detail: (value) =>
            `${value.count ?? 0} partida(s) carecen de clasificación común y requieren revisión humana.`,
    },
    unlinked_coordination_entities: {
        label: 'Entidades sin vínculo coordinado',
        detail: (value) =>
            `${value.budget_lines ?? 0} partidas · ${value.activities ?? 0} actividades · ${value.bim_elements ?? 0} elementos; no se han creado vínculos automáticos.`,
    },
};

const DomainState = ({ label, available, detail }) => (
    <div className="border-b border-zinc-200 px-4 py-3 last:border-0">
        <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-zinc-900">{label}</span>
            <span
                className={`inline-flex items-center gap-1 text-[10px] font-semibold ${available ? 'text-emerald-700' : 'text-amber-800'}`}
            >
                {available ? (
                    <CheckCircle2 className="size-3.5" aria-hidden="true" />
                ) : (
                    <AlertTriangle className="size-3.5" aria-hidden="true" />
                )}
                {available ? 'Conectado' : 'Pendiente'}
            </span>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-zinc-600">{detail}</p>
    </div>
);

const BimCoordinationControlPanel = ({
    projectId,
    empresaId,
    activeVersionId,
    selectedElement = null,
    selectedActivity = null,
    canEdit = false,
    canApprove = false,
    canApply = false,
    canRecover = false,
    embedded = false,
    api = bimModelsApi,
    budgetsApi = presupuestosApi,
    schedulesApi = cronogramasApi,
}) => {
    const [sets, setSets] = useState([]);
    const [coverage, setCoverage] = useState(null);
    const [classification, setClassification] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [links, setLinks] = useState([]);
    const [conflicts, setConflicts] = useState([]);
    const [showOfficial, setShowOfficial] = useState(false);
    const [officialReason, setOfficialReason] = useState(
        'Referencia revisada y aprobada para coordinación del proyecto.',
    );
    const [budgets, setBudgets] = useState([]);
    const [selectedBudgetId, setSelectedBudgetId] = useState('');
    const [selectedScheduleId, setSelectedScheduleId] = useState(null);
    const [baselines, setBaselines] = useState([]);
    const [selectedBaselineId, setSelectedBaselineId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!projectId) return;
        setLoading(true);
        setError('');
        try {
            const [
                setRows,
                classificationResult,
                budgetResponse,
                baselineRows,
            ] = await Promise.all([
                api.listCoordinationSets(projectId, empresaId),
                api.getClassificationSummary(projectId, empresaId),
                budgetsApi.getByProyecto(projectId, empresaId),
                api.list4dBaselines(projectId, empresaId),
            ]);
            const budgetRows = budgetResponse?.data || [];
            setBudgets(budgetRows);
            setBaselines(baselineRows || []);
            setSelectedBaselineId(String(setRows?.[0]?.baseline_id || ''));
            const preferredBudgetId = String(
                setRows?.[0]?.presupuesto_id || budgetRows?.[0]?.id || '',
            );
            setSelectedBudgetId(preferredBudgetId);
            if (preferredBudgetId) {
                try {
                    const schedule = await schedulesApi.getTrabajo(
                        Number(preferredBudgetId),
                        empresaId,
                        { compact: true },
                    );
                    setSelectedScheduleId(
                        schedule?.id || schedule?.cronograma_id || null,
                    );
                } catch {
                    setSelectedScheduleId(null);
                }
            } else {
                setSelectedScheduleId(null);
            }
            setSets(setRows || []);
            setClassification(classificationResult);
            const current = setRows?.[0];
            if (current) {
                const [coverageResult, proposalRows, linkRows, conflictRows] =
                    await Promise.all([
                        api.getCoordinationCoverage(
                            projectId,
                            current.id,
                            empresaId,
                        ),
                        api.listCoordinationProposals(
                            projectId,
                            current.id,
                            empresaId,
                        ),
                        api.listCoordinationLinks(
                            projectId,
                            current.id,
                            empresaId,
                        ),
                        api.listCoordinationConflicts
                            ? api.listCoordinationConflicts(
                                  projectId,
                                  current.id,
                                  empresaId,
                              )
                            : Promise.resolve([]),
                    ]);
                setCoverage(coverageResult);
                setProposals(proposalRows || []);
                setLinks(linkRows || []);
                setConflicts(conflictRows || []);
            } else {
                setCoverage(null);
                setProposals([]);
                setLinks([]);
                setConflicts([]);
            }
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    'No se pudo leer la coordinación del proyecto.',
                ),
            );
        } finally {
            setLoading(false);
        }
    }, [api, budgetsApi, empresaId, projectId, schedulesApi]);

    useEffect(() => {
        load();
    }, [load]);

    const selectBudget = async (value) => {
        setSelectedBudgetId(value);
        setSelectedScheduleId(null);
        setError('');
        if (!value) return;
        try {
            const schedule = await schedulesApi.getTrabajo(
                Number(value),
                empresaId,
                { compact: true },
            );
            setSelectedScheduleId(
                schedule?.id || schedule?.cronograma_id || null,
            );
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    'El presupuesto no tiene un Gantt disponible; puede coordinarse sin él.',
                ),
            );
        }
    };

    const createSet = async () => {
        setSaving(true);
        setError('');
        try {
            const budget = budgets.find(
                (item) => String(item.id) === String(selectedBudgetId),
            );
            await api.createCoordinationSet(
                projectId,
                {
                    presupuesto_id: budget?.id || null,
                    presupuesto_revision: budget?.revision ?? null,
                    cronograma_trabajo_id: selectedScheduleId,
                    baseline_id: selectedBaselineId
                        ? Number(selectedBaselineId)
                        : null,
                    bim_version_ids: activeVersionId ? [activeVersionId] : [],
                },
                empresaId,
            );
            await load();
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    'No se pudo crear el conjunto de coordinación.',
                ),
            );
        } finally {
            setSaving(false);
        }
    };

    const makeOfficial = async () => {
        if (!sets[0] || officialReason.trim().length < 3) return;
        setSaving(true);
        setError('');
        try {
            await api.makeCoordinationSetOfficial(
                projectId,
                sets[0].id,
                {
                    expected_revision: sets[0].revision,
                    reason: officialReason.trim(),
                },
                empresaId,
            );
            setShowOfficial(false);
            await load();
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    'No se pudo oficializar la referencia.',
                ),
            );
        } finally {
            setSaving(false);
        }
    };

    const actOnProposal = async (proposal, action) => {
        setSaving(true);
        setError('');
        try {
            if (action === 'approve')
                await api.decideCoordinationProposal(
                    projectId,
                    sets[0].id,
                    proposal.id,
                    {
                        decision: 'approve',
                        reason: 'Revisión aprobada desde la bandeja coordinada.',
                    },
                    empresaId,
                );
            if (action === 'apply')
                await api.applyCoordinationProposal(
                    projectId,
                    sets[0].id,
                    proposal.id,
                    {
                        expected_version: proposal.version,
                        reason: 'Aplicación confirmada desde la bandeja coordinada.',
                    },
                    empresaId,
                );
            if (action === 'recover')
                await api.recoverCoordinationProposal(
                    projectId,
                    sets[0].id,
                    proposal.id,
                    {
                        expected_version: proposal.version,
                        reason: 'Recuperación solicitada desde la bandeja coordinada.',
                    },
                    empresaId,
                );
            await load();
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    'No se pudo completar la acción coordinada.',
                ),
            );
        } finally {
            setSaving(false);
        }
    };

    const createContextLink = async () => {
        const current = sets[0];
        if (!current || !selectedActivity || !selectedElement) return;
        setSaving(true);
        setError('');
        try {
            await api.createCoordinationLink(
                projectId,
                current.id,
                {
                    budget_line_id: selectedActivity.budget_line_id || null,
                    activity_ref:
                        selectedActivity.source_ref ||
                        `activity-${selectedActivity.id}`,
                    activity_snapshot_id: selectedActivity.id,
                    bim_element_id: selectedElement.id,
                    bim_global_id: selectedElement.global_id || null,
                    allocation_key: `activity-${selectedActivity.id}-element-${selectedElement.id}`,
                    allocation_type: 'percentage',
                    allocation_value: 100,
                    additive: true,
                    source: 'bim_workspace_context',
                    notes: selectedActivity.budget_line_id
                        ? 'Vínculo coordinado 5D/4D/BIM creado desde la selección compartida.'
                        : 'Vínculo 4D/BIM; pendiente asociar la actividad a una partida presupuestaria.',
                },
                empresaId,
            );
            await load();
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    'No se pudo crear el vínculo de la selección actual.',
                ),
            );
        } finally {
            setSaving(false);
        }
    };

    const reconcileHistoricalLink = async (link) => {
        if (!selectedActivity || !selectedElement) return;
        setSaving(true);
        setError('');
        try {
            await api.reconcileCoordinationLinkIdentity(
                projectId,
                sets[0].id,
                link.id,
                {
                    activity_snapshot_id: selectedActivity.id,
                    bim_element_id: selectedElement.id,
                    reason: 'Referencias históricas verificadas desde el contexto compartido 4D/BIM.',
                },
                empresaId,
            );
            await load();
        } catch (requestError) {
            setError(
                getErrorMessage(
                    requestError,
                    'La selección no coincide con las referencias históricas del vínculo.',
                ),
            );
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return (
            <div
                className="grid h-full grid-cols-[20rem_minmax(0,1fr)_22rem] gap-px bg-zinc-200"
                aria-label="Cargando coordinación"
            >
                <div className="animate-pulse bg-zinc-50 motion-reduce:animate-none" />
                <div className="animate-pulse bg-white motion-reduce:animate-none" />
                <div className="animate-pulse bg-zinc-50 motion-reduce:animate-none" />
            </div>
        );
    const current = sets[0];
    const draftReferenceCount = links.filter(
        (link) => link.identity_status === 'draft_reference',
    ).length;
    const blockingConflictCount = conflicts.filter((conflict) =>
        ['critical', 'error', 'blocking'].includes(conflict.severity),
    ).length;
    return (
        <section
            className="flex h-full min-h-0 min-w-0 flex-col bg-white"
            data-bim-coordination-control
        >
            {!embedded ? (
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-zinc-200 px-4">
                    <div className="flex items-center gap-3">
                        <span className="inline-flex size-8 items-center justify-center rounded-md bg-orange-50 text-orange-700">
                            <GitMerge className="size-4" aria-hidden="true" />
                        </span>
                        <div>
                            <h2 className="text-sm font-semibold text-zinc-950">
                                Control de coordinación
                            </h2>
                            <p className="text-[11px] text-zinc-600">
                                Referencia única para presupuesto, Gantt y BIM.
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={load}
                        className="inline-flex size-9 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                        aria-label="Actualizar coordinación"
                    >
                        <RefreshCw className="size-4" />
                    </button>
                </div>
            ) : null}
            {error ? (
                <div
                    className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-900"
                    role="alert"
                >
                    {error}
                </div>
            ) : null}
            {!current ? (
                <div className="grid min-h-0 flex-1 place-items-center bg-zinc-50 p-8">
                    <div className="w-full max-w-xl border border-zinc-200 bg-white">
                        <div className="border-b border-zinc-200 px-6 py-5">
                            <p className="text-sm font-semibold text-zinc-950">
                                Crear referencia coordinada
                            </p>
                            <p className="mt-1 text-xs leading-5 text-zinc-600">
                                Fija el estado común que usarán costes,
                                planificación y modelo. BIM seguirá siendo
                                opcional; cualquier dominio ausente quedará
                                señalado.
                            </p>
                        </div>
                        {canEdit ? (
                            <div className="p-6">
                                <label
                                    htmlFor="coordination-budget"
                                    className="text-xs font-semibold text-zinc-800"
                                >
                                    Presupuesto de referencia
                                </label>
                                <select
                                    id="coordination-budget"
                                    value={selectedBudgetId}
                                    onChange={(event) =>
                                        selectBudget(event.target.value)
                                    }
                                    className="mt-1.5 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                                >
                                    <option value="">
                                        Coordinar sin presupuesto
                                    </option>
                                    {budgets.map((budget) => (
                                        <option
                                            key={budget.id}
                                            value={budget.id}
                                        >
                                            {budget.descripcion ||
                                                budget.nombre ||
                                                `Presupuesto ${budget.id}`}{' '}
                                            · R{budget.revision ?? 0}
                                        </option>
                                    ))}
                                </select>
                                <label
                                    htmlFor="coordination-baseline"
                                    className="mt-5 block text-xs font-semibold text-zinc-800"
                                >
                                    Estado de planificación
                                </label>
                                <select
                                    id="coordination-baseline"
                                    value={selectedBaselineId}
                                    onChange={(event) =>
                                        setSelectedBaselineId(
                                            event.target.value,
                                        )
                                    }
                                    className="mt-1.5 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                                >
                                    <option value="">
                                        Borrador Gantt vigente (no baseline)
                                    </option>
                                    {baselines.map((baseline) => (
                                        <option
                                            key={baseline.id}
                                            value={baseline.id}
                                        >
                                            {baseline.name} ·{' '}
                                            {baseline.revision}
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-2 text-[11px] leading-4 text-zinc-600">
                                    {selectedBaselineId
                                        ? 'La referencia fijará esta línea base aprobada.'
                                        : selectedScheduleId
                                          ? `Gantt ${selectedScheduleId} detectado como borrador operativo.`
                                          : 'No hay Gantt seleccionado; BIM y presupuesto seguirán siendo opcionales.'}
                                </p>
                                <div className="mt-6 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={createSet}
                                        disabled={
                                            saving ||
                                            (!selectedBudgetId &&
                                                !activeVersionId)
                                        }
                                        className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-orange-600 px-4 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
                                    >
                                        <Plus className="size-4" />
                                        {saving
                                            ? 'Creando…'
                                            : 'Crear referencia coordinada'}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-6 text-xs text-zinc-600">
                                No tienes permiso para crear la referencia.
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <>
                    <div className="flex h-12 shrink-0 items-center gap-5 border-b border-zinc-200 bg-zinc-50 px-4">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                Revisión
                            </span>
                            <strong className="text-sm tabular-nums text-zinc-950">
                                R{current.revision}
                            </strong>
                        </div>
                        <div className="h-5 w-px bg-zinc-300" />
                        <div>
                            <p className="text-xs font-semibold text-zinc-900">
                                {current.official
                                    ? 'Referencia oficial vigente'
                                    : 'Referencia de trabajo'}
                            </p>
                        </div>
                        <span className="rounded-full border border-zinc-300 bg-white px-2 py-1 text-[10px] font-semibold text-zinc-700">
                            {statusLabel[
                                coverage?.coordination_status ||
                                    current.coordination_status
                            ] || current.coordination_status}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[11px] text-zinc-600">
                            {current.official
                                ? 'Disponible para informes y salidas oficiales.'
                                : 'No alimentará salidas oficiales hasta su aprobación.'}
                        </span>
                        {canApprove && !current.official ? (
                            <button
                                type="button"
                                onClick={() =>
                                    setShowOfficial((value) => !value)
                                }
                                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-300 bg-white px-3 text-[11px] font-semibold text-zinc-800 hover:border-orange-400 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                            >
                                <ShieldCheck className="size-3.5" />
                                Oficializar
                            </button>
                        ) : null}
                        <button
                            type="button"
                            onClick={load}
                            className="inline-flex size-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-600 hover:text-orange-700"
                            aria-label="Actualizar coordinación"
                        >
                            <RefreshCw className="size-3.5" />
                        </button>
                    </div>
                    {showOfficial ? (
                        <div className="shrink-0 border-b border-orange-200 bg-orange-50 px-4 py-3">
                            <div className="mx-auto flex max-w-4xl items-end gap-3">
                                <label
                                    className="min-w-0 flex-1 text-[11px] font-semibold text-zinc-900"
                                    htmlFor="coordination-official-reason"
                                >
                                    Motivo de aprobación
                                    <textarea
                                        id="coordination-official-reason"
                                        value={officialReason}
                                        onChange={(event) =>
                                            setOfficialReason(
                                                event.target.value,
                                            )
                                        }
                                        rows={2}
                                        className="mt-1 w-full resize-none rounded-md border border-zinc-300 bg-white p-2 text-xs font-normal text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
                                    />
                                </label>
                                <button
                                    type="button"
                                    onClick={() => setShowOfficial(false)}
                                    className="h-9 px-3 text-[11px] font-semibold text-zinc-600"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={makeOfficial}
                                    disabled={
                                        saving ||
                                        officialReason.trim().length < 3 ||
                                        coverage?.overallocated_count > 0 ||
                                        draftReferenceCount > 0 ||
                                        blockingConflictCount > 0
                                    }
                                    className="h-9 rounded-md bg-orange-600 px-4 text-[11px] font-semibold text-white disabled:opacity-50"
                                >
                                    Confirmar referencia
                                </button>
                            </div>
                            {coverage?.overallocated_count > 0 ? (
                                <p className="mx-auto mt-2 max-w-4xl text-[11px] font-medium text-rose-800">
                                    Resuelve las asignaciones superiores al 100%
                                    antes de oficializar.
                                </p>
                            ) : null}
                            {draftReferenceCount > 0 ? (
                                <p className="mx-auto mt-2 max-w-4xl text-[11px] font-medium text-amber-900">
                                    Reconciliación de identidades requerida
                                    antes de aprobar.
                                </p>
                            ) : null}
                            {blockingConflictCount > 0 ? (
                                <p className="mx-auto mt-2 max-w-4xl text-[11px] font-medium text-rose-800">
                                    Hay {blockingConflictCount} incidencia(s)
                                    crítica(s) de preparación que impiden
                                    oficializar.
                                </p>
                            ) : null}
                        </div>
                    ) : null}
                    <div className="grid min-h-0 flex-1 grid-cols-[20rem_minmax(28rem,1fr)_22rem] divide-x divide-zinc-200 overflow-hidden">
                        <aside className="min-h-0 overflow-y-auto bg-zinc-50">
                            <div className="border-b border-zinc-200 px-4 py-3">
                                <h3 className="text-xs font-semibold text-zinc-950">
                                    Fuentes de referencia
                                </h3>
                                <p className="mt-1 text-[11px] leading-4 text-zinc-600">
                                    Estado fijado para esta revisión.
                                </p>
                            </div>
                            <DomainState
                                label="Presupuesto 5D"
                                available={Boolean(current.presupuesto_id)}
                                detail={
                                    current.presupuesto_id
                                        ? `Presupuesto ${current.presupuesto_id} · revisión ${current.presupuesto_revision ?? 'vigente'}`
                                        : 'Selecciona el presupuesto oficial que gobernará costes y cantidades.'
                                }
                            />
                            <DomainState
                                label="Planificación 4D"
                                available={Boolean(
                                    current.cronograma_trabajo_id ||
                                    current.baseline_id,
                                )}
                                detail={
                                    current.baseline_id
                                        ? `Baseline ${current.baseline_id} fijada para comparación; Gantt ${current.cronograma_trabajo_id || 'sin borrador'}`
                                        : current.cronograma_trabajo_id
                                          ? `Gantt ${current.cronograma_trabajo_id} · borrador operativo, sin baseline fijada`
                                          : 'Vincula el Gantt o una línea base aprobada.'
                                }
                            />
                            <DomainState
                                label="Modelo BIM"
                                available={Boolean(
                                    current.bim_version_ids?.length,
                                )}
                                detail={
                                    current.bim_version_ids?.length
                                        ? `${current.bim_version_ids.length} versión(es) federadas`
                                        : 'Añade una versión BIM publicada.'
                                }
                            />
                            <div className="border-t border-zinc-200 bg-white">
                                <div className="px-4 py-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <h3 className="text-xs font-semibold text-zinc-950">
                                                Preparación para oficializar
                                            </h3>
                                            <p className="mt-1 text-[11px] leading-4 text-zinc-600">
                                                Configuración y coordinación son
                                                estados diferentes.
                                            </p>
                                        </div>
                                        <span
                                            className={`shrink-0 text-[10px] font-semibold ${conflicts.length ? 'text-amber-800' : 'text-emerald-700'}`}
                                        >
                                            {conflicts.length
                                                ? `${conflicts.length} avisos`
                                                : 'Preparado'}
                                        </span>
                                    </div>
                                </div>
                                <div
                                    className={`border-y px-4 py-3 ${classification?.enabled === false ? 'border-rose-300 bg-rose-50' : classification?.warning_required ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}
                                    role={
                                        classification?.warning_required
                                            ? 'alert'
                                            : 'status'
                                    }
                                >
                                    <p className="text-xs font-semibold text-zinc-950">
                                        {classification?.enabled === false
                                            ? 'OmniClass desactivado · estructura común rota'
                                            : classification?.warning_required
                                              ? 'OmniClass activado · coordinación incompleta'
                                              : 'OmniClass activado · coordinación completa'}
                                    </p>
                                    <p className="mt-1 text-[11px] leading-4 text-zinc-700">
                                        {classification?.enabled === false
                                            ? 'Los vínculos 4D/5D conservan su origen, pero presupuesto, Gantt y BIM pueden divergir.'
                                            : classification?.total === 0
                                              ? 'No existen resoluciones BIM aprobadas; activar OmniClass no clasifica los datos existentes.'
                                              : `${classification?.total ?? 0} resoluciones BIM · ${statusLabel[classification?.status] || classification?.status || 'sin evaluar'}.`}
                                    </p>
                                </div>
                                {conflicts.length ? (
                                    <ul className="divide-y divide-zinc-200">
                                        {conflicts.map((conflict) => {
                                            const copy =
                                                readinessCopy[
                                                    conflict.conflict_type
                                                ];
                                            return (
                                                <li
                                                    key={conflict.id}
                                                    className="px-4 py-3"
                                                >
                                                    <div className="flex gap-2.5">
                                                        <AlertTriangle
                                                            className={`mt-0.5 size-3.5 shrink-0 ${['critical', 'error', 'blocking'].includes(conflict.severity) ? 'text-rose-700' : 'text-amber-700'}`}
                                                            aria-hidden="true"
                                                        />
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-semibold text-zinc-900">
                                                                {copy?.label ||
                                                                    conflict.conflict_type}
                                                            </p>
                                                            <p className="mt-0.5 [overflow-wrap:anywhere] text-[10px] leading-4 text-zinc-600">
                                                                {copy?.detail(
                                                                    conflict.detail ||
                                                                        {},
                                                                ) ||
                                                                    'Requiere revisión antes del cierre coordinado.'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                ) : null}
                            </div>
                        </aside>
                        <main className="min-h-0 overflow-y-auto bg-white p-5">
                            <div
                                className="mx-auto max-w-3xl"
                                data-coordination-shared-context
                            >
                                <div className="flex items-end justify-between gap-4">
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-950">
                                            Selección compartida
                                        </h3>
                                        <p className="mt-1 text-[11px] text-zinc-600">
                                            Cadena operativa presupuesto →
                                            planificación → modelo.
                                        </p>
                                    </div>
                                    {coverage ? (
                                        <div className="flex divide-x divide-zinc-200 border border-zinc-200 bg-zinc-50">
                                            <div className="px-3 py-2 text-center">
                                                <strong className="block text-xs tabular-nums text-zinc-950">
                                                    {coverage.coordinated_count}
                                                </strong>
                                                <span className="text-[9px] text-zinc-600">
                                                    Coordinados
                                                </span>
                                            </div>
                                            <div className="px-3 py-2 text-center">
                                                <strong className="block text-xs tabular-nums text-amber-800">
                                                    {coverage.incomplete_count}
                                                </strong>
                                                <span className="text-[9px] text-zinc-600">
                                                    Incompletos
                                                </span>
                                            </div>
                                            <div className="px-3 py-2 text-center">
                                                <strong className="block text-xs tabular-nums text-rose-700">
                                                    {
                                                        coverage.overallocated_count
                                                    }
                                                </strong>
                                                <span className="text-[9px] text-zinc-600">
                                                    Conflictos
                                                </span>
                                            </div>
                                        </div>
                                    ) : null}
                                </div>
                                <div className="mt-5 divide-y divide-zinc-200 border-y border-zinc-200">
                                    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 py-4">
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                            Partida 5D
                                        </span>
                                        <span className="truncate text-xs font-medium text-zinc-900">
                                            {selectedActivity?.budget_line_id
                                                ? `#${selectedActivity.budget_line_id}`
                                                : 'Pendiente en la actividad'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 py-4">
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                            Actividad 4D
                                        </span>
                                        <span className="truncate text-xs font-medium text-zinc-900">
                                            {selectedActivity
                                                ? `${selectedActivity.code} · ${selectedActivity.name}`
                                                : 'Selecciona una actividad en Secuencia 4D'}
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-[7rem_minmax(0,1fr)] gap-4 py-4">
                                        <span className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                                            Elemento BIM
                                        </span>
                                        <span className="truncate text-xs font-medium text-zinc-900">
                                            {selectedElement
                                                ? selectedElement.nombre ||
                                                  selectedElement.name ||
                                                  selectedElement.global_id
                                                : 'Selecciona un elemento en el visor'}
                                        </span>
                                    </div>
                                </div>
                                {canEdit ? (
                                    <div className="mt-5 flex justify-end">
                                        <button
                                            type="button"
                                            onClick={createContextLink}
                                            disabled={
                                                saving ||
                                                !selectedActivity ||
                                                !selectedElement
                                            }
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-orange-600 px-4 text-xs font-semibold text-white hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 disabled:opacity-50"
                                        >
                                            <Plus
                                                className="size-4"
                                                aria-hidden="true"
                                            />
                                            {selectedActivity?.budget_line_id
                                                ? 'Vincular partida, actividad y elemento'
                                                : 'Vincular actividad y elemento'}
                                        </button>
                                    </div>
                                ) : null}
                                {selectedActivity &&
                                !selectedActivity.budget_line_id ? (
                                    <p className="mt-3 border-l-2 border-amber-400 pl-3 text-[11px] leading-4 text-amber-900">
                                        La actividad no conserva una partida de
                                        origen. El vínculo será válido entre 4D
                                        y BIM, pero seguirá incompleto en 5D.
                                    </p>
                                ) : null}
                            </div>
                            {draftReferenceCount > 0 ? (
                                <div
                                    className="mx-auto mt-8 max-w-3xl border-t border-amber-300 pt-4"
                                    role="status"
                                >
                                    <p className="text-xs font-semibold text-amber-950">
                                        Identidad pendiente en{' '}
                                        {draftReferenceCount} vínculo(s)
                                    </p>
                                    <p className="mt-1 text-[11px] leading-4 text-amber-900">
                                        Las referencias heredadas deben
                                        reconciliarse con una actividad y un
                                        elemento versionados antes de
                                        oficializar.
                                    </p>
                                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        {links
                                            .filter(
                                                (link) =>
                                                    link.identity_status ===
                                                    'draft_reference',
                                            )
                                            .slice(0, 5)
                                            .map((link) => {
                                                const matchesContext =
                                                    selectedActivity &&
                                                    selectedElement &&
                                                    (!link.activity_ref ||
                                                        link.activity_ref ===
                                                            selectedActivity.source_ref) &&
                                                    (!link.bim_global_id ||
                                                        link.bim_global_id ===
                                                            selectedElement.global_id);
                                                return (
                                                    <button
                                                        key={link.id}
                                                        type="button"
                                                        onClick={() =>
                                                            reconcileHistoricalLink(
                                                                link,
                                                            )
                                                        }
                                                        disabled={
                                                            saving ||
                                                            !matchesContext
                                                        }
                                                        className="h-9 rounded border border-amber-400 bg-white px-3 text-[10px] font-semibold text-amber-950 disabled:opacity-40"
                                                    >
                                                        Reconciliar vínculo #
                                                        {link.id} con selección
                                                        actual
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>
                            ) : null}
                        </main>
                        <aside className="min-h-0 overflow-y-auto bg-zinc-50">
                            <div className="border-b border-zinc-200 px-4 py-3">
                                <h3 className="text-xs font-semibold text-zinc-950">
                                    Bandeja de decisiones
                                </h3>
                                <p className="mt-1 text-[11px] leading-4 text-zinc-600">
                                    Cambios entre dominios que requieren
                                    revisión.
                                </p>
                            </div>
                            {proposals.length ? (
                                <ul className="divide-y divide-zinc-200">
                                    {proposals.slice(0, 10).map((proposal) => (
                                        <li
                                            key={proposal.id}
                                            className="bg-white px-4 py-3"
                                        >
                                            <p className="truncate text-[11px] font-semibold text-zinc-900">
                                                {proposal.proposal_type}
                                            </p>
                                            <p className="mt-1 text-[10px] text-zinc-600">
                                                {proposal.source_domain} →{' '}
                                                {proposal.target_domain}
                                            </p>
                                            <div className="mt-3 flex items-center justify-between">
                                                <span className="text-[10px] font-medium text-zinc-500">
                                                    {proposal.status}
                                                </span>
                                                <div className="flex gap-1">
                                                    {proposal.status ===
                                                        'pending_review' &&
                                                    canApprove ? (
                                                        <button
                                                            type="button"
                                                            disabled={saving}
                                                            onClick={() =>
                                                                actOnProposal(
                                                                    proposal,
                                                                    'approve',
                                                                )
                                                            }
                                                            className="h-7 rounded border border-zinc-300 bg-white px-2 text-[10px] font-semibold hover:border-orange-400"
                                                        >
                                                            Aprobar
                                                        </button>
                                                    ) : null}
                                                    {proposal.status ===
                                                        'approved' &&
                                                    canApply ? (
                                                        <button
                                                            type="button"
                                                            disabled={saving}
                                                            onClick={() =>
                                                                actOnProposal(
                                                                    proposal,
                                                                    'apply',
                                                                )
                                                            }
                                                            className="h-7 rounded bg-orange-600 px-2 text-[10px] font-semibold text-white"
                                                        >
                                                            Aplicar
                                                        </button>
                                                    ) : null}
                                                    {proposal.status ===
                                                        'applied' &&
                                                    canRecover ? (
                                                        <button
                                                            type="button"
                                                            disabled={saving}
                                                            onClick={() =>
                                                                actOnProposal(
                                                                    proposal,
                                                                    'recover',
                                                                )
                                                            }
                                                            className="h-7 rounded border border-zinc-300 bg-white px-2 text-[10px] font-semibold"
                                                        >
                                                            Recuperar
                                                        </button>
                                                    ) : null}
                                                </div>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="px-4 py-8 text-center">
                                    <CheckCircle2 className="mx-auto size-5 text-emerald-600" />
                                    <p className="mt-2 text-xs font-semibold text-zinc-900">
                                        Sin decisiones pendientes
                                    </p>
                                    <p className="mt-1 text-[11px] leading-4 text-zinc-600">
                                        No hay cambios entre dominios pendientes
                                        de revisión.
                                    </p>
                                </div>
                            )}
                        </aside>
                    </div>
                </>
            )}
        </section>
    );
};

export default BimCoordinationControlPanel;
