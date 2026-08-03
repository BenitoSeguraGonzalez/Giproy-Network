import React, { useEffect, useMemo, useState } from 'react';
import { GitCompareArrows, Layers3, Save, TriangleAlert } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const emptyTransform = () => ({ translation: [0, 0, 0], rotation_degrees: [0, 0, 0], scale: [1, 1, 1] });
const emptyGeoreference = () => ({ crs: 'LOCAL', origin: [0, 0, 0], units: 'm' });

const BimFederationPanel = ({ projectId, empresaId, models = [], federation, onFederationChange }) => {
    const versions = useMemo(
        () => models.flatMap((model) => (model.versions || []).map((version) => ({
            ...version,
            modelId: model.id,
            modelName: model.nombre || model.name || 'Modelo',
            discipline: model.disciplina || 'General',
        }))),
        [models],
    );
    const [members, setMembers] = useState([]);
    const [justification, setJustification] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [reconciliationPair, setReconciliationPair] = useState({ source: '', target: '' });
    const [reconciliation, setReconciliation] = useState(null);
    const [reconciling, setReconciling] = useState(false);
    const [reconciliationReason, setReconciliationReason] = useState('');
    const [reconciliationTargetsByHash, setReconciliationTargetsByHash] = useState({});

    const reconciliationTargets = versions.filter((version) => (
        reconciliationPair.source
        && version.id !== Number(reconciliationPair.source)
        && version.modelId === versions.find((item) => item.id === Number(reconciliationPair.source))?.modelId
    ));

    const reviewVersionChange = async () => {
        if (!reconciliationPair.source || !reconciliationPair.target) return;
        try {
            setReconciling(true); setMessage(''); setReconciliation(null);
            const result = await bimModelsApi.getFederationReconciliation(
                projectId, Number(reconciliationPair.source), Number(reconciliationPair.target), empresaId,
            );
            setReconciliation(result);
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo revisar el cambio de versión.');
        } finally { setReconciling(false); }
    };

    const decideCandidate = async (candidate, decision) => {
        try {
            setReconciling(true); setMessage('');
            const selectedTarget = reconciliationTargetsByHash[candidate.candidate_hash]
                || (candidate.target_global_ids.length === 1 ? candidate.target_global_ids[0] : null);
            const result = await bimModelsApi.decideFederationReconciliation(projectId, {
                source_version_id: Number(reconciliationPair.source),
                target_version_id: Number(reconciliationPair.target),
                candidate_hash: candidate.candidate_hash,
                decision,
                selected_target_global_id: decision === 'approved' ? selectedTarget : null,
                reason: reconciliationReason.trim(),
            }, empresaId);
            setReconciliation((current) => ({ ...current, candidates: current.candidates.map((item) => item.candidate_hash === candidate.candidate_hash ? { ...item, decision_result: result } : item) }));
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo registrar la decisión de reconciliación.');
        } finally { setReconciling(false); }
    };

    useEffect(() => {
        if (!federation) {
            setMembers([]);
            return;
        }
        setMembers(federation.members || []);
    }, [federation]);

    const addVersion = (versionId) => {
        const version = versions.find((item) => item.id === Number(versionId));
        if (!version || members.some((member) => member.version_id === version.id)) return;
        setMembers((current) => [...current, {
            version_id: version.id,
            model_name: version.modelName,
            version_label: version.version_label || version.label,
            discipline: version.discipline,
            display_order: current.length,
            enabled: true,
            transform: emptyTransform(),
            georeference: emptyGeoreference(),
            alignment_status: current.length === 0 ? 'reference' : 'aligned',
        }]);
    };

    const updateMember = (versionId, patch) => setMembers((current) => current.map((member) => (
        member.version_id === versionId ? { ...member, ...patch } : member
    )));

    const updateTranslation = (member, axis, value) => {
        const translation = [...(member.transform?.translation || [0, 0, 0])];
        translation[axis] = Number(value) || 0;
        updateMember(member.version_id, { transform: { ...(member.transform || emptyTransform()), translation } });
    };

    const save = async () => {
        if (!members.length || justification.trim().length < 3) return;
        try {
            setSaving(true);
            setMessage('');
            const saved = await bimModelsApi.saveFederation(projectId, {
                name: federation?.name || 'Federacion principal',
                justification: justification.trim(),
                members: members.map((member, index) => ({
                    version_id: member.version_id,
                    discipline: member.discipline,
                    display_order: index,
                    enabled: member.enabled,
                    transform: member.transform || emptyTransform(),
                    georeference: member.georeference || emptyGeoreference(),
                })),
            }, empresaId);
            setJustification('');
            setMessage(`Revision ${saved.revision} guardada`);
            onFederationChange?.(saved);
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo guardar la federacion BIM.');
        } finally {
            setSaving(false);
        }
    };

    if (versions.length < 2) {
        return (
            <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-federation-panel>
                <div className="flex items-center gap-2 border-b border-zinc-200 px-3 py-2.5">
                    <Layers3 className="h-4 w-4 shrink-0 text-[#F39200]" aria-hidden="true" />
                    <h3 className="text-xs font-semibold text-zinc-900">Federación</h3>
                </div>
                <div className="grid min-h-48 place-items-center px-6 py-10 text-center" data-bim-federation-empty>
                    <div className="max-w-xl">
                        <p className="text-sm font-semibold text-zinc-900">Se necesitan al menos dos versiones BIM</p>
                        <p className="mt-2 text-xs leading-5 text-zinc-600">
                            Cargue otra versión o disciplina en «Cargar modelo IFC». Cuando ambas estén listas,
                            vuelva a Federación para activarlas, revisar su alineación y guardar los ajustes con
                            una justificación.
                        </p>
                    </div>
                </div>
            </section>
        );
    }
    const available = versions.filter((version) => !members.some((member) => member.version_id === version.id));

    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-federation-panel>
            <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                    <Layers3 className="h-4 w-4 shrink-0 text-[#F39200]" aria-hidden="true" />
                    <h3 className="truncate text-xs font-semibold text-zinc-900">Federacion</h3>
                </div>
                {federation ? <span className="text-[10px] font-medium text-zinc-500">r{federation.revision}</span> : null}
            </div>
            <div className="space-y-2 p-3">
                {available.length ? (
                    <select defaultValue="" onChange={(event) => { addVersion(event.target.value); event.target.value = ''; }} className="h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs" aria-label="Agregar version a federacion">
                        <option value="" disabled>Agregar version</option>
                        {available.map((version) => <option key={version.id} value={version.id}>{version.modelName} · {version.version_label || version.label}</option>)}
                    </select>
                ) : null}
                <div className="max-h-72 space-y-1.5 overflow-auto" data-bim-federation-members>
                    {members.map((member) => (
                        <div key={member.version_id} className="rounded-md border border-zinc-200 p-2">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" checked={member.enabled} onChange={(event) => updateMember(member.version_id, { enabled: event.target.checked })} aria-label={`Activar ${member.model_name}`} className="accent-[#F39200]" />
                                <span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-800">{member.model_name} · {member.version_label}</span>
                                {member.alignment_status === 'misaligned' ? <TriangleAlert className="h-3.5 w-3.5 text-amber-600" aria-label="Modelo desalineado" /> : null}
                            </div>
                            <div className="mt-2 grid grid-cols-3 gap-1">
                                {['X', 'Y', 'Z'].map((axis, index) => (
                                    <label key={axis} className="flex items-center gap-1 text-[10px] text-zinc-500">
                                        {axis}
                                        <input type="number" step="0.01" value={member.transform?.translation?.[index] || 0} onChange={(event) => updateTranslation(member, index, event.target.value)} className="h-7 min-w-0 w-full rounded border border-zinc-200 px-1 text-xs text-zinc-800" aria-label={`Traslacion ${axis} de ${member.model_name}`} />
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="border-t border-zinc-200 pt-3" data-bim-version-reconciliation>
                    <div className="flex items-center gap-2"><GitCompareArrows className="size-3.5 text-orange-600" aria-hidden="true" /><h4 className="text-[11px] font-semibold text-zinc-900">Cambio de versión y GUID</h4></div>
                    <div className="mt-2 grid grid-cols-2 gap-1.5">
                        <select value={reconciliationPair.source} onChange={(event) => { setReconciliationPair({ source: event.target.value, target: '' }); setReconciliation(null); }} className="h-8 min-w-0 rounded border border-zinc-200 bg-white px-1.5 text-[10px]" aria-label="Versión BIM de origen"><option value="">Origen</option>{versions.map((version) => <option key={version.id} value={version.id}>{version.modelName} · {version.version_label || version.label}</option>)}</select>
                        <select value={reconciliationPair.target} disabled={!reconciliationPair.source} onChange={(event) => { setReconciliationPair((current) => ({ ...current, target: event.target.value })); setReconciliation(null); }} className="h-8 min-w-0 rounded border border-zinc-200 bg-white px-1.5 text-[10px] disabled:bg-zinc-50" aria-label="Versión BIM de destino"><option value="">Destino</option>{reconciliationTargets.map((version) => <option key={version.id} value={version.id}>{version.version_label || version.label}</option>)}</select>
                    </div>
                    <button type="button" onClick={reviewVersionChange} disabled={reconciling || !reconciliationPair.source || !reconciliationPair.target} className="mt-2 inline-flex h-8 w-full items-center justify-center rounded border border-zinc-300 text-[10px] font-semibold text-zinc-800 hover:border-orange-400 disabled:opacity-40">{reconciling ? 'Comparando…' : 'Revisar reconciliación'}</button>
                    {reconciliation ? (
                        <div className="mt-2 space-y-2 border border-amber-200 bg-amber-50 p-2" role="status">
                            <div>
                                <p className="text-[10px] font-semibold text-amber-950">{reconciliation.summary.review_required} inferencia(s) requieren revisión</p>
                                <p className="mt-1 text-[10px] leading-4 text-amber-900">{reconciliation.summary.retained} GUID conservados · {reconciliation.summary.added} altas · {reconciliation.summary.removed} retiradas. No se aplicó ningún cambio automáticamente.</p>
                            </div>
                            {reconciliation.candidates?.length ? (
                                <div className="max-h-56 space-y-2 overflow-auto" data-bim-reconciliation-candidates>
                                    {reconciliation.candidates.map((candidate) => {
                                        const result = candidate.decision_result;
                                        const selectedTarget = reconciliationTargetsByHash[candidate.candidate_hash] || '';
                                        const needsTarget = candidate.target_global_ids.length > 1;
                                        return (
                                            <article key={candidate.candidate_hash} className="rounded border border-amber-200 bg-white p-2">
                                                <div className="flex items-center justify-between gap-2 text-[10px] text-amber-950">
                                                    <span className="font-semibold">{candidate.kind === 'split' ? 'División' : candidate.kind === 'merge' ? 'Fusión' : candidate.kind === 'ambiguous' ? 'Ambigua' : 'Sustitución'} · {candidate.source_global_ids.length}→{candidate.target_global_ids.length}</span>
                                                    {result ? <span className="shrink-0 font-medium">{result.decision === 'approved' ? 'Aprobada' : 'Rechazada'} · {result.affected_link_count} vínculo(s)</span> : null}
                                                </div>
                                                {!result && needsTarget ? (
                                                    <select value={selectedTarget} onChange={(event) => setReconciliationTargetsByHash((current) => ({ ...current, [candidate.candidate_hash]: event.target.value }))} className="mt-1.5 h-7 w-full rounded border border-zinc-200 bg-white px-1.5 text-[10px]" aria-label="Elemento BIM de destino">
                                                        <option value="">Seleccione destino</option>
                                                        {candidate.target_global_ids.map((globalId) => <option key={globalId} value={globalId}>{globalId}</option>)}
                                                    </select>
                                                ) : null}
                                                {!result ? (
                                                    <div className="mt-1.5 flex gap-1.5">
                                                        <button type="button" onClick={() => decideCandidate(candidate, 'approved')} disabled={reconciling || reconciliationReason.trim().length < 3 || (needsTarget && !selectedTarget)} className="h-7 flex-1 rounded bg-emerald-700 px-2 text-[10px] font-semibold text-white disabled:opacity-40">Aprobar</button>
                                                        <button type="button" onClick={() => decideCandidate(candidate, 'rejected')} disabled={reconciling || reconciliationReason.trim().length < 3} className="h-7 flex-1 rounded border border-zinc-300 bg-white px-2 text-[10px] font-semibold text-zinc-800 disabled:opacity-40">Rechazar</button>
                                                    </div>
                                                ) : null}
                                            </article>
                                        );
                                    })}
                                </div>
                            ) : null}
                            {reconciliation.candidates?.some((candidate) => !candidate.decision_result) ? <input value={reconciliationReason} onChange={(event) => setReconciliationReason(event.target.value)} placeholder="Motivo de la decisión" className="h-8 w-full rounded border border-amber-300 bg-white px-2 text-[10px] placeholder:text-zinc-500" aria-label="Motivo de reconciliación" /> : null}
                        </div>
                    ) : null}
                </div>
                {members.length ? (
                    <div className="flex gap-1.5">
                        <input value={justification} onChange={(event) => setJustification(event.target.value)} placeholder="Justificacion del ajuste" className="h-9 min-w-0 flex-1 rounded-md border border-zinc-200 px-2 text-xs placeholder:text-zinc-500" aria-label="Justificacion de la federacion" />
                        <button type="button" onClick={save} disabled={saving || justification.trim().length < 3} className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-[#F39200] text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] focus-visible:ring-offset-2 disabled:opacity-40" title="Guardar revision de federacion" aria-label="Guardar revision de federacion"><Save className="h-4 w-4" /></button>
                    </div>
                ) : <p className="text-xs text-zinc-500">Agrega versiones para coordinar disciplinas.</p>}
                {message ? <p className="text-[10px] font-medium text-zinc-600" role="status">{message}</p> : null}
            </div>
        </section>
    );
};

export default BimFederationPanel;
