import React, { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, GitMerge, Plus, RefreshCw, ShieldCheck } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';
import { cronogramasApi } from '../../api/cronogramas';
import { presupuestosApi } from '../../api/presupuestos';
import { getErrorMessage } from '../../utils/errorMessage';

const statusLabel = {
    coordinated: 'Coordinado', incomplete: 'Incompleto', conflict: 'Con conflictos',
    outdated: 'Desactualizado', not_configured: 'Sin configurar', disabled: 'Desactivado',
    unresolved: 'Sin resolver', partial: 'Parcial',
};

const DomainState = ({ label, available, detail }) => (
    <div className="border-b border-zinc-200 py-3 last:border-0">
        <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-zinc-900">{label}</span>
            <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${available ? 'text-emerald-700' : 'text-amber-800'}`}>
                {available ? <CheckCircle2 className="size-3.5" aria-hidden="true" /> : <AlertTriangle className="size-3.5" aria-hidden="true" />}
                {available ? 'Conectado' : 'Pendiente'}
            </span>
        </div>
        <p className="mt-1 text-[11px] leading-4 text-zinc-600">{detail}</p>
    </div>
);

const BimCoordinationControlPanel = ({ projectId, empresaId, activeVersionId, selectedElement = null, selectedActivity = null, canEdit = false, canApprove = false, canApply = false, canRecover = false }) => {
    const [sets, setSets] = useState([]);
    const [coverage, setCoverage] = useState(null);
    const [classification, setClassification] = useState(null);
    const [proposals, setProposals] = useState([]);
    const [links, setLinks] = useState([]);
    const [showOfficial, setShowOfficial] = useState(false);
    const [officialReason, setOfficialReason] = useState('Referencia revisada y aprobada para coordinación del proyecto.');
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
        setLoading(true); setError('');
        try {
            const [setRows, classificationResult, budgetResponse, baselineRows] = await Promise.all([
                bimModelsApi.listCoordinationSets(projectId, empresaId),
                bimModelsApi.getClassificationSummary(projectId, empresaId),
                presupuestosApi.getByProyecto(projectId, empresaId),
                bimModelsApi.list4dBaselines(projectId, empresaId),
            ]);
            const budgetRows = budgetResponse?.data || [];
            setBudgets(budgetRows);
            setBaselines(baselineRows || []);
            setSelectedBaselineId(String(setRows?.[0]?.baseline_id || ''));
            const preferredBudgetId = String(setRows?.[0]?.presupuesto_id || budgetRows?.[0]?.id || '');
            setSelectedBudgetId(preferredBudgetId);
            if (preferredBudgetId) {
                try {
                    const schedule = await cronogramasApi.getTrabajo(Number(preferredBudgetId), empresaId, { compact: true });
                    setSelectedScheduleId(schedule?.id || schedule?.cronograma_id || null);
                } catch { setSelectedScheduleId(null); }
            } else { setSelectedScheduleId(null); }
            setSets(setRows || []);
            setClassification(classificationResult);
            const current = setRows?.[0];
            if (current) {
                const [coverageResult, proposalRows, linkRows] = await Promise.all([
                    bimModelsApi.getCoordinationCoverage(projectId, current.id, empresaId),
                    bimModelsApi.listCoordinationProposals(projectId, current.id, empresaId),
                    bimModelsApi.listCoordinationLinks(projectId, current.id, empresaId),
                ]);
                setCoverage(coverageResult); setProposals(proposalRows || []); setLinks(linkRows || []);
            } else { setCoverage(null); setProposals([]); setLinks([]); }
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'No se pudo leer la coordinación del proyecto.'));
        } finally { setLoading(false); }
    }, [empresaId, projectId]);

    useEffect(() => { load(); }, [load]);

    const selectBudget = async (value) => {
        setSelectedBudgetId(value); setSelectedScheduleId(null); setError('');
        if (!value) return;
        try {
            const schedule = await cronogramasApi.getTrabajo(Number(value), empresaId, { compact: true });
            setSelectedScheduleId(schedule?.id || schedule?.cronograma_id || null);
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'El presupuesto no tiene un Gantt disponible; puede coordinarse sin él.'));
        }
    };

    const createSet = async () => {
        setSaving(true); setError('');
        try {
            const budget = budgets.find((item) => String(item.id) === String(selectedBudgetId));
            await bimModelsApi.createCoordinationSet(projectId, {
                presupuesto_id: budget?.id || null,
                presupuesto_revision: budget?.revision ?? null,
                cronograma_trabajo_id: selectedScheduleId,
                baseline_id: selectedBaselineId ? Number(selectedBaselineId) : null,
                bim_version_ids: activeVersionId ? [activeVersionId] : [],
            }, empresaId);
            await load();
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'No se pudo crear el conjunto de coordinación.'));
        } finally { setSaving(false); }
    };

    const makeOfficial = async () => {
        if (!sets[0] || officialReason.trim().length < 3) return;
        setSaving(true); setError('');
        try {
            await bimModelsApi.makeCoordinationSetOfficial(projectId, sets[0].id, {
                expected_revision: sets[0].revision,
                reason: officialReason.trim(),
            }, empresaId);
            setShowOfficial(false); await load();
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'No se pudo oficializar la referencia.'));
        } finally { setSaving(false); }
    };

    const actOnProposal = async (proposal, action) => {
        setSaving(true); setError('');
        try {
            if (action === 'approve') await bimModelsApi.decideCoordinationProposal(projectId, sets[0].id, proposal.id, { decision: 'approve', reason: 'Revisión aprobada desde la bandeja coordinada.' }, empresaId);
            if (action === 'apply') await bimModelsApi.applyCoordinationProposal(projectId, sets[0].id, proposal.id, { expected_version: proposal.version, reason: 'Aplicación confirmada desde la bandeja coordinada.' }, empresaId);
            if (action === 'recover') await bimModelsApi.recoverCoordinationProposal(projectId, sets[0].id, proposal.id, { expected_version: proposal.version, reason: 'Recuperación solicitada desde la bandeja coordinada.' }, empresaId);
            await load();
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'No se pudo completar la acción coordinada.'));
        } finally { setSaving(false); }
    };

    const createContextLink = async () => {
        const current = sets[0];
        if (!current || !selectedActivity || !selectedElement) return;
        setSaving(true); setError('');
        try {
            await bimModelsApi.createCoordinationLink(projectId, current.id, {
                budget_line_id: selectedActivity.budget_line_id || null,
                activity_ref: selectedActivity.source_ref || `activity-${selectedActivity.id}`,
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
            }, empresaId);
            await load();
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'No se pudo crear el vínculo de la selección actual.'));
        } finally { setSaving(false); }
    };

    const reconcileHistoricalLink = async (link) => {
        if (!selectedActivity || !selectedElement) return;
        setSaving(true); setError('');
        try {
            await bimModelsApi.reconcileCoordinationLinkIdentity(projectId, sets[0].id, link.id, {
                activity_snapshot_id: selectedActivity.id,
                bim_element_id: selectedElement.id,
                reason: 'Referencias históricas verificadas desde el contexto compartido 4D/BIM.',
            }, empresaId);
            await load();
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'La selección no coincide con las referencias históricas del vínculo.'));
        } finally { setSaving(false); }
    };

    if (loading) return <div className="space-y-3 p-3" aria-label="Cargando coordinación"><div className="h-16 animate-pulse rounded bg-zinc-100 motion-reduce:animate-none" /><div className="h-32 animate-pulse rounded bg-zinc-100 motion-reduce:animate-none" /></div>;
    const current = sets[0];
    const draftReferenceCount = links.filter((link) => link.identity_status === 'draft_reference').length;
    return (
        <section className="min-w-0" data-bim-coordination-control>
            <div className="flex items-start justify-between gap-3 border-b border-zinc-200 pb-3">
                <div><span className="inline-flex size-8 items-center justify-center rounded-md bg-orange-50 text-orange-700"><GitMerge className="size-4" aria-hidden="true" /></span><h2 className="mt-2 text-sm font-semibold text-zinc-950">Control de coordinación</h2><p className="mt-1 text-[11px] leading-4 text-zinc-600">Referencia única para presupuesto, Gantt y BIM.</p></div>
                <button type="button" onClick={load} className="inline-flex size-9 items-center justify-center rounded-md border border-zinc-300 text-zinc-600 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600" aria-label="Actualizar coordinación"><RefreshCw className="size-4" /></button>
            </div>
            {error ? <div className="mt-3 border border-rose-200 bg-rose-50 p-3 text-xs text-rose-900" role="alert">{error}</div> : null}
            {!current ? <div className="py-5"><div className="text-center"><p className="text-xs font-semibold text-zinc-900">Aún no existe una referencia coordinada.</p><p className="mx-auto mt-1 max-w-xs text-[11px] leading-4 text-zinc-600">Créala sin bloquear el proyecto; los dominios ausentes quedarán señalados hasta enlazarlos.</p></div>{canEdit ? <div className="mx-auto mt-4 max-w-sm"><label htmlFor="coordination-budget" className="text-[11px] font-semibold text-zinc-800">Presupuesto de referencia</label><select id="coordination-budget" value={selectedBudgetId} onChange={(event) => selectBudget(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"><option value="">Coordinar sin presupuesto</option>{budgets.map((budget) => <option key={budget.id} value={budget.id}>{budget.descripcion || budget.nombre || `Presupuesto ${budget.id}`} · R{budget.revision ?? 0}</option>)}</select><label htmlFor="coordination-baseline" className="mt-3 block text-[11px] font-semibold text-zinc-800">Estado de planificación</label><select id="coordination-baseline" value={selectedBaselineId} onChange={(event) => setSelectedBaselineId(event.target.value)} className="mt-1 h-9 w-full rounded-md border border-zinc-300 bg-white px-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"><option value="">Borrador Gantt vigente (no baseline)</option>{baselines.map((baseline) => <option key={baseline.id} value={baseline.id}>{baseline.name} · {baseline.revision}</option>)}</select><p className="mt-1 text-[10px] text-zinc-600">{selectedBaselineId ? 'La referencia fijará esta línea base aprobada.' : selectedScheduleId ? `Gantt ${selectedScheduleId} detectado como borrador operativo.` : 'No hay Gantt seleccionado; BIM y presupuesto seguirán siendo opcionales.'}</p><button type="button" onClick={createSet} disabled={saving || (!selectedBudgetId && !activeVersionId)} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-3 text-xs font-semibold text-white hover:bg-orange-700 disabled:opacity-50"><Plus className="size-4" />{saving ? 'Creando…' : 'Crear referencia coordinada'}</button></div> : null}</div> : <>
                <div className="mt-3 flex items-center justify-between border border-zinc-200 bg-zinc-50 px-3 py-2"><div><span className="block text-[10px] font-semibold uppercase text-zinc-500">Revisión coordinada</span><strong className="text-sm tabular-nums text-zinc-950">R{current.revision}</strong></div><span className="text-xs font-semibold text-zinc-800">{statusLabel[coverage?.coordination_status || current.coordination_status] || current.coordination_status}</span></div>
                <div className="mt-2 flex items-center justify-between gap-3 border-b border-zinc-200 pb-3"><div><p className="text-xs font-semibold text-zinc-900">{current.official ? 'Referencia oficial vigente' : 'Referencia de trabajo'}</p><p className="mt-0.5 text-[11px] text-zinc-600">{current.official ? 'Los informes pueden usar esta revisión.' : 'No alimentará salidas oficiales hasta su aprobación.'}</p></div>{canApprove && !current.official ? <button type="button" onClick={() => setShowOfficial((value) => !value)} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-zinc-300 px-2.5 text-[11px] font-semibold text-zinc-800 hover:border-orange-400 hover:text-orange-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"><ShieldCheck className="size-3.5" />Oficializar</button> : null}</div>
                {draftReferenceCount > 0 ? <div className="mt-2 border border-amber-300 bg-amber-50 p-3" role="status"><p className="text-xs font-semibold text-amber-950">Identidad pendiente en {draftReferenceCount} vínculo(s)</p><p className="mt-1 text-[11px] leading-4 text-amber-900">Son referencias heredadas válidas para trabajo, pero deben reconciliarse con una actividad y un elemento versionados antes de oficializar.</p><div className="mt-2 space-y-1">{links.filter((link) => link.identity_status === 'draft_reference').slice(0, 5).map((link) => { const matchesContext = selectedActivity && selectedElement && (!link.activity_ref || link.activity_ref === selectedActivity.source_ref) && (!link.bim_global_id || link.bim_global_id === selectedElement.global_id); return <button key={link.id} type="button" onClick={() => reconcileHistoricalLink(link)} disabled={saving || !matchesContext} className="h-8 w-full rounded border border-amber-400 bg-white px-2 text-[10px] font-semibold text-amber-950 disabled:opacity-40">Reconciliar vínculo #{link.id} con selección actual</button>; })}</div></div> : null}
                {showOfficial ? <div className="mt-2 border border-orange-200 bg-orange-50 p-3"><label className="text-[11px] font-semibold text-zinc-900" htmlFor="coordination-official-reason">Motivo de aprobación</label><textarea id="coordination-official-reason" value={officialReason} onChange={(event) => setOfficialReason(event.target.value)} rows={3} className="mt-1 w-full resize-none rounded-md border border-zinc-300 bg-white p-2 text-xs text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600" /><div className="mt-2 flex justify-end gap-2"><button type="button" onClick={() => setShowOfficial(false)} className="h-8 px-2 text-[11px] font-semibold text-zinc-600">Cancelar</button><button type="button" onClick={makeOfficial} disabled={saving || officialReason.trim().length < 3 || coverage?.overallocated_count > 0 || draftReferenceCount > 0} className="h-8 rounded-md bg-orange-600 px-3 text-[11px] font-semibold text-white disabled:opacity-50">Confirmar referencia</button></div>{coverage?.overallocated_count > 0 ? <p className="mt-2 text-[11px] font-medium text-rose-800">Resuelve las asignaciones superiores al 100% antes de oficializar.</p> : null}{draftReferenceCount > 0 ? <p className="mt-2 text-[11px] font-medium text-amber-900">Reconciliación de identidades requerida antes de aprobar.</p> : null}</div> : null}
                <div className="mt-2 px-1"><DomainState label="Presupuesto 5D" available={Boolean(current.presupuesto_id)} detail={current.presupuesto_id ? `Presupuesto ${current.presupuesto_id} · revisión ${current.presupuesto_revision ?? 'vigente'}` : 'Selecciona el presupuesto oficial que gobernará costes y cantidades.'} /><DomainState label="Planificación 4D" available={Boolean(current.cronograma_trabajo_id || current.baseline_id)} detail={current.baseline_id ? `Baseline ${current.baseline_id} fijada para comparación; Gantt ${current.cronograma_trabajo_id || 'sin borrador'}` : current.cronograma_trabajo_id ? `Gantt ${current.cronograma_trabajo_id} · borrador operativo, sin baseline fijada` : 'Vincula el Gantt o una línea base aprobada.'} /><DomainState label="Modelo BIM" available={Boolean(current.bim_version_ids?.length)} detail={current.bim_version_ids?.length ? `${current.bim_version_ids.length} versión(es) federadas` : 'Añade una versión BIM publicada.'} /></div>
                <div className="mt-3 border border-zinc-200 bg-zinc-50 p-3" data-coordination-shared-context>
                    <h3 className="text-xs font-semibold text-zinc-950">Selección compartida 5D · 4D · BIM</h3>
                    <dl className="mt-2 grid gap-1 text-[11px]">
                        <div className="flex justify-between gap-3"><dt className="text-zinc-600">Partida</dt><dd className="truncate font-medium text-zinc-900">{selectedActivity?.budget_line_id ? `#${selectedActivity.budget_line_id}` : 'Pendiente en la actividad'}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-zinc-600">Actividad</dt><dd className="truncate font-medium text-zinc-900">{selectedActivity ? `${selectedActivity.code} · ${selectedActivity.name}` : 'Selecciona en Secuencia 4D'}</dd></div>
                        <div className="flex justify-between gap-3"><dt className="text-zinc-600">Elemento</dt><dd className="truncate font-medium text-zinc-900">{selectedElement ? (selectedElement.nombre || selectedElement.name || selectedElement.global_id) : 'Selecciona en el visor'}</dd></div>
                    </dl>
                    {canEdit ? <button type="button" onClick={createContextLink} disabled={saving || !selectedActivity || !selectedElement} className="mt-3 inline-flex h-9 w-full items-center justify-center gap-2 rounded-md bg-orange-600 px-3 text-xs font-semibold text-white hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 disabled:opacity-50"><Plus className="size-4" aria-hidden="true" />{selectedActivity?.budget_line_id ? 'Vincular partida, actividad y elemento' : 'Vincular actividad y elemento'}</button> : null}
                    {selectedActivity && !selectedActivity.budget_line_id ? <p className="mt-2 text-[10px] leading-4 text-amber-800">La actividad no conserva una partida de origen. El vínculo será válido entre 4D y BIM, pero seguirá incompleto en 5D.</p> : null}
                </div>
                <div className={`mt-2 border p-3 ${classification?.warning_required ? 'border-amber-300 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}><p className="text-xs font-semibold text-zinc-950">OmniClass: {statusLabel[classification?.status] || classification?.status || 'Sin datos'}</p>{classification?.warning_required ? <p className="mt-1 text-[11px] leading-4 text-amber-900">La estructura común no está completamente coordinada. Revisa clasificaciones antes de oficializar.</p> : <p className="mt-1 text-[11px] text-emerald-900">Clasificación común coordinada.</p>}</div>
                {coverage ? <div className="mt-3 grid grid-cols-3 divide-x divide-zinc-200 border-y border-zinc-200 py-2 text-center"><div><strong className="block text-sm tabular-nums text-zinc-950">{coverage.coordinated_count}</strong><span className="text-[10px] text-zinc-600">Coordinados</span></div><div><strong className="block text-sm tabular-nums text-amber-800">{coverage.incomplete_count}</strong><span className="text-[10px] text-zinc-600">Incompletos</span></div><div><strong className="block text-sm tabular-nums text-rose-700">{coverage.overallocated_count}</strong><span className="text-[10px] text-zinc-600">Conflictos</span></div></div> : null}
                <div className="mt-4"><h3 className="text-xs font-semibold text-zinc-950">Bandeja de propuestas</h3>{proposals.length ? <ul className="mt-2 divide-y divide-zinc-200 border-y border-zinc-200">{proposals.slice(0, 5).map((proposal) => <li key={proposal.id} className="py-2.5"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-zinc-900">{proposal.proposal_type}</p><p className="mt-0.5 text-[10px] text-zinc-600">{proposal.source_domain} → {proposal.target_domain} · {proposal.status}</p></div><div className="flex shrink-0 gap-1">{proposal.status === 'pending_review' && canApprove ? <button type="button" disabled={saving} onClick={() => actOnProposal(proposal, 'approve')} className="h-7 rounded border border-zinc-300 px-2 text-[10px] font-semibold hover:border-orange-400">Aprobar</button> : null}{proposal.status === 'approved' && canApply ? <button type="button" disabled={saving} onClick={() => actOnProposal(proposal, 'apply')} className="h-7 rounded bg-orange-600 px-2 text-[10px] font-semibold text-white">Aplicar</button> : null}{proposal.status === 'applied' && canRecover ? <button type="button" disabled={saving} onClick={() => actOnProposal(proposal, 'recover')} className="h-7 rounded border border-zinc-300 px-2 text-[10px] font-semibold">Recuperar</button> : null}</div></div></li>)}</ul> : <p className="mt-1 text-[11px] leading-4 text-zinc-600">No hay cambios entre dominios pendientes de revisión.</p>}</div>
            </>}
        </section>
    );
};

export default BimCoordinationControlPanel;
