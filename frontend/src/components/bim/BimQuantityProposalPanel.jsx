import React, { useEffect, useMemo, useState } from 'react';
import { Calculator, Check, FileCheck2, RefreshCw, X } from 'lucide-react';
import { bimModelsApi } from '../../api/bimModels';

const inputClass = 'h-8 min-w-0 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-800';

const BimQuantityProposalPanel = ({ projectId, empresaId, versionId, element, api = bimModelsApi }) => {
    const [mode, setMode] = useState('qto');
    const [snapshots, setSnapshots] = useState([]);
    const [selectedSnapshotId, setSelectedSnapshotId] = useState(null);
    const [revision, setRevision] = useState('QTO-R1');
    const [wbsCode, setWbsCode] = useState('');
    const [costCode, setCostCode] = useState('');
    const [creatingQto, setCreatingQto] = useState(false);
    const [qtoReason, setQtoReason] = useState('');
    const [qtoPackage, setQtoPackage] = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [index, setIndex] = useState(0);
    const [targetType, setTargetType] = useState('edt');
    const [targetId, setTargetId] = useState('');
    const [proposal, setProposal] = useState(null);
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const refreshSnapshots = async () => {
        if (!projectId || !versionId) return;
        try {
            const rows = await api.listQtoSnapshots(projectId, versionId, empresaId);
            setSnapshots(rows);
            setSelectedSnapshotId((current) => current || rows[0]?.id || null);
        } catch {
            setSnapshots([]);
        }
    };

    useEffect(() => {
        setSelectedSnapshotId(null);
        refreshSnapshots();
    }, [empresaId, projectId, versionId]);

    useEffect(() => {
        setProposal(null);
        setCandidates([]);
        setIndex(0);
        if (element?.id) {
            api.getQuantityCandidates(projectId, element.id, empresaId)
                .then(setCandidates)
                .catch(() => setCandidates([]));
        }
    }, [empresaId, element?.id, projectId]);

    const selectedSnapshot = useMemo(
        () => snapshots.find((item) => item.id === selectedSnapshotId) || snapshots[0] || null,
        [selectedSnapshotId, snapshots],
    );
    const candidate = candidates[index] || candidates[0];

    const createQto = async () => {
        if (!versionId || !revision.trim()) return;
        setCreatingQto(true);
        setError('');
        try {
            const mappings = element?.ifc_class && (wbsCode.trim() || costCode.trim())
                ? [{ ifc_class: element.ifc_class, wbs_code: wbsCode.trim() || null, cost_code: costCode.trim() || null }]
                : [];
            const created = await api.createQtoSnapshot(projectId, {
                version_id: Number(versionId),
                revision: revision.trim(),
                group_by: ['ifc_class', 'storey', 'material'],
                quantity_names: [],
                mappings,
                rounding_digits: 3,
            }, empresaId);
            setSnapshots((current) => [created, ...current.filter((item) => item.id !== created.id)]);
            setSelectedSnapshotId(created.id);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo generar el QTO.');
        } finally {
            setCreatingQto(false);
        }
    };

    const decideQto = async (decision) => {
        if (!selectedSnapshot) return;
        setError('');
        try {
            const decided = await api.decideQtoSnapshot(projectId, selectedSnapshot.id, {
                decision,
                reason: qtoReason.trim(),
                expected_lock_version: selectedSnapshot.lock_version,
            }, empresaId);
            setSnapshots((current) => current.map((item) => (
                item.id === decided.id
                    ? decided
                    : decision === 'approved' && item.version_id === decided.version_id && item.status === 'approved'
                        ? { ...item, status: 'superseded' }
                        : item
            )));
            setQtoReason('');
            setQtoPackage(null);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo decidir el QTO.');
        }
    };

    const verifyQtoPackage = async () => {
        if (!selectedSnapshot) return;
        setError('');
        try {
            setQtoPackage(await api.getQto5dPackage(projectId, selectedSnapshot.id, empresaId));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo preparar el paquete 5D.');
        }
    };

    const createProposal = async () => {
        try {
            setError('');
            setProposal(await api.createQuantityProposal(projectId, {
                element_id: element.id,
                target_type: targetType,
                target_id: Number(targetId),
                candidate,
            }, empresaId));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo crear la propuesta.');
        }
    };

    const decideProposal = async (decision) => {
        try {
            setProposal(await api.decideQuantityProposal(
                projectId,
                proposal.id,
                { decision, reason },
                empresaId,
            ));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo decidir la propuesta.');
        }
    };

    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-quantity-proposal>
            <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2.5">
                <div className="flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-[#F39200]" />
                    <h3 className="text-xs font-semibold">Cantidades BIM</h3>
                </div>
                <div className="flex border border-zinc-200" role="tablist" aria-label="Modo de cantidades">
                    {[
                        ['qto', 'QTO'],
                        ['element', 'Elemento'],
                    ].map(([value, label]) => (
                        <button
                            key={value}
                            type="button"
                            role="tab"
                            aria-selected={mode === value}
                            onClick={() => setMode(value)}
                            className={`h-7 px-2 text-[10px] font-semibold ${mode === value ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600'}`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {mode === 'qto' ? (
                <div className="space-y-2 p-3" data-bim-qto>
                    <div className="grid grid-cols-[1fr_auto] gap-1.5">
                        <input value={revision} onChange={(event) => setRevision(event.target.value)} className={inputClass} aria-label="Revision QTO" placeholder="Revision" />
                        <button type="button" onClick={createQto} disabled={!versionId || !revision.trim() || creatingQto} className="inline-flex h-8 items-center gap-1 bg-[#F39200] px-2 text-[10px] font-semibold text-white disabled:opacity-40">
                            <RefreshCw className={`h-3 w-3 ${creatingQto ? 'animate-spin' : ''}`} />
                            Generar
                        </button>
                    </div>
                    {element?.ifc_class ? (
                        <div className="grid grid-cols-2 gap-1.5">
                            <input value={wbsCode} onChange={(event) => setWbsCode(event.target.value)} className={inputClass} placeholder={`WBS para ${element.ifc_class}`} aria-label="Codigo WBS latente" />
                            <input value={costCode} onChange={(event) => setCostCode(event.target.value)} className={inputClass} placeholder="Codigo de coste" aria-label="Codigo de coste latente" />
                        </div>
                    ) : null}
                    {snapshots.length ? (
                        <select value={selectedSnapshot?.id || ''} onChange={(event) => setSelectedSnapshotId(Number(event.target.value))} className={`${inputClass} w-full`} aria-label="Snapshot QTO">
                            {snapshots.map((item) => <option key={item.id} value={item.id}>{item.revision} · {item.rows.length} filas</option>)}
                        </select>
                    ) : <p className="text-[11px] text-zinc-500">No hay takeoffs para la version activa.</p>}
                    {selectedSnapshot ? (
                        <>
                            <div className="flex items-center justify-between bg-zinc-50 px-2 py-1.5 text-[10px]">
                                <span className="font-semibold uppercase text-zinc-700">{selectedSnapshot.status || 'draft'}</span>
                                <span className="font-mono text-zinc-500">v{selectedSnapshot.lock_version || 1}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-x-3 text-[10px] text-zinc-600">
                                <span>Cobertura cantidades <strong>{selectedSnapshot.coverage.quantity_coverage_percent}%</strong></span>
                                <span>Cobertura codigos <strong>{selectedSnapshot.coverage.mapping_coverage_percent}%</strong></span>
                            </div>
                            <div className="max-h-56 overflow-auto border border-zinc-200">
                                <table className="w-full table-fixed text-left text-[10px]">
                                    <thead className="sticky top-0 bg-zinc-50 text-zinc-500"><tr><th className="w-[42%] px-2 py-1.5">Grupo</th><th className="w-[24%] px-2 py-1.5">Cantidad</th><th className="px-2 py-1.5">Codigos</th></tr></thead>
                                    <tbody>
                                        {selectedSnapshot.rows.map((row) => (
                                            <tr key={`${JSON.stringify(row.group)}-${row.quantity_name}-${row.wbs_code || ''}`} className="border-t border-zinc-100 align-top">
                                                <td className="break-words px-2 py-1.5">{Object.values(row.group).join(' / ')}</td>
                                                <td className="px-2 py-1.5"><strong>{row.value} {row.unit}</strong><br /><span className="text-zinc-500">{row.element_count} elementos</span></td>
                                                <td className="break-words px-2 py-1.5">{row.wbs_code || 'Sin WBS'}<br />{row.cost_code || 'Sin coste'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            {(selectedSnapshot.status || 'draft') === 'draft' ? (
                                <>
                                    <input value={qtoReason} onChange={(event) => setQtoReason(event.target.value)} className={`${inputClass} w-full`} placeholder="Motivo de decision" aria-label="Motivo de decision QTO" />
                                    <div className="grid grid-cols-2 gap-1">
                                        <button type="button" onClick={() => decideQto('approved')} disabled={qtoReason.trim().length < 5 || selectedSnapshot.coverage.mapping_coverage_percent < 100} className="inline-flex h-8 items-center justify-center gap-1 bg-emerald-700 text-[10px] font-semibold text-white disabled:opacity-40"><Check className="h-3 w-3" />Aprobar QTO</button>
                                        <button type="button" onClick={() => decideQto('rejected')} disabled={qtoReason.trim().length < 5} className="inline-flex h-8 items-center justify-center gap-1 border border-rose-200 text-[10px] font-semibold text-rose-700 disabled:opacity-40"><X className="h-3 w-3" />Rechazar QTO</button>
                                    </div>
                                </>
                            ) : null}
                            {selectedSnapshot.status === 'approved' ? (
                                <button type="button" onClick={verifyQtoPackage} className="inline-flex h-8 w-full items-center justify-center gap-1 border border-zinc-300 bg-white text-[10px] font-semibold text-zinc-700"><FileCheck2 className="h-3 w-3" />Verificar paquete 5D</button>
                            ) : null}
                            {qtoPackage ? <p className="break-all bg-emerald-50 px-2 py-1.5 font-mono text-[9px] text-emerald-800" data-bim-qto-package>{qtoPackage.qto_checksum_sha256}</p> : null}
                        </>
                    ) : null}
                </div>
            ) : (
                <div className="space-y-2 p-3" data-bim-element-quantity>
                    {!element ? <p className="text-[11px] text-zinc-500">Selecciona un elemento del modelo.</p> : null}
                    {element && !candidates.length ? <p className="text-[11px] text-zinc-500">El elemento no contiene cantidades utilizables.</p> : null}
                    {candidate ? (
                        <>
                            <select value={index} onChange={(event) => setIndex(Number(event.target.value))} className={`${inputClass} w-full`} aria-label="Cantidad BIM">
                                {candidates.map((item, itemIndex) => <option key={item.quantity_name} value={itemIndex}>{item.quantity_name}</option>)}
                            </select>
                            <div className="text-xs text-zinc-700"><strong>{candidate.presented_value} {candidate.presented_unit}</strong><span className="ml-2 text-[10px] text-zinc-500">{candidate.source_kind} · v{element.bim_model_version_id}</span></div>
                            {!proposal ? (
                                <div className="grid grid-cols-[auto_1fr_auto] gap-1">
                                    <select value={targetType} onChange={(event) => setTargetType(event.target.value)} className={inputClass} aria-label="Destino 5D"><option value="edt">EDT</option><option value="presupuesto">Presupuesto</option><option value="apu">APU</option></select>
                                    <input type="number" min="1" value={targetId} onChange={(event) => setTargetId(event.target.value)} className={inputClass} placeholder="ID destino" aria-label="ID destino 5D" />
                                    <button type="button" onClick={createProposal} disabled={!Number(targetId)} className="h-8 bg-[#F39200] px-2 text-[10px] font-semibold text-white disabled:opacity-40">Proponer</button>
                                </div>
                            ) : (
                                <>
                                    <div className="bg-zinc-50 px-2 py-1.5 text-[10px] text-zinc-600">{proposal.status} · {proposal.target_type} #{proposal.target_id}</div>
                                    {proposal.status === 'pending' ? (
                                        <>
                                            <input value={reason} onChange={(event) => setReason(event.target.value)} className={`${inputClass} w-full`} placeholder="Motivo de decision" aria-label="Motivo de decision 5D" />
                                            <div className="grid grid-cols-2 gap-1">
                                                <button type="button" onClick={() => decideProposal('approved')} disabled={reason.trim().length < 5} className="inline-flex h-8 items-center justify-center gap-1 bg-emerald-700 text-[10px] font-semibold text-white disabled:opacity-40"><Check className="h-3 w-3" />Aprobar</button>
                                                <button type="button" onClick={() => decideProposal('rejected')} disabled={reason.trim().length < 5} className="inline-flex h-8 items-center justify-center gap-1 border border-rose-200 text-[10px] font-semibold text-rose-700 disabled:opacity-40"><X className="h-3 w-3" />Rechazar</button>
                                            </div>
                                        </>
                                    ) : null}
                                </>
                            )}
                        </>
                    ) : null}
                </div>
            )}
            {error ? <p className="border-t border-zinc-100 px-3 py-2 text-xs text-rose-700">{typeof error === 'string' ? error : 'Error 5D'}</p> : null}
        </section>
    );
};

export default BimQuantityProposalPanel;
