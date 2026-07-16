import React, { useEffect, useMemo, useState } from 'react';
import { Layers3, Save, TriangleAlert } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const emptyTransform = () => ({ translation: [0, 0, 0], rotation_degrees: [0, 0, 0], scale: [1, 1, 1] });
const emptyGeoreference = () => ({ crs: 'LOCAL', origin: [0, 0, 0], units: 'm' });

const BimFederationPanel = ({ projectId, empresaId, models = [], federation, onFederationChange }) => {
    const versions = useMemo(
        () => models.flatMap((model) => (model.versions || []).map((version) => ({
            ...version,
            modelName: model.nombre || model.name || 'Modelo',
            discipline: model.disciplina || 'General',
        }))),
        [models],
    );
    const [members, setMembers] = useState([]);
    const [justification, setJustification] = useState('');
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');

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

    if (versions.length < 2) return null;
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
