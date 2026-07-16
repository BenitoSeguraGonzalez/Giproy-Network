import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, MessageSquarePlus, Plus, UserRoundCheck } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const statusLabels = { open: 'Abierta', assigned: 'Asignada', in_review: 'En revision', resolved: 'Resuelta', closed: 'Cerrada', discarded: 'Descartada' };
const BimIssuesPanel = ({ projectId, versionId, empresaId, currentUserId, viewerState, onOpenIssue }) => {
    const [issues, setIssues] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const refresh = async () => {
        if (!projectId) return;
        const items = await bimModelsApi.listIssues(projectId, empresaId);
        setIssues(items || []);
        if (selectedId && !items.some((item) => item.id === selectedId)) setSelectedId(null);
    };
    useEffect(() => { refresh().catch(() => setIssues([])); }, [empresaId, projectId]);
    const selected = issues.find((issue) => issue.id === selectedId) || null;
    const replace = (issue) => setIssues((current) => current.map((item) => item.id === issue.id ? issue : item));

    const create = async () => {
        if (!title.trim()) return;
        try {
            setLoading(true); setError('');
            const issue = await bimModelsApi.createIssue(projectId, {
                title: title.trim(), version_id: versionId || null, priority: 'normal',
                viewpoint: {
                    source_version_id: versionId || null,
                    camera: viewerState?.camera || {},
                    selected_guids: viewerState?.selection?.global_id ? [viewerState.selection.global_id] : [],
                    visibility: viewerState?.visibility || {}, clipping: viewerState?.clipping || {},
                },
            }, empresaId);
            setIssues((current) => [issue, ...current]); setSelectedId(issue.id); setTitle(''); setCreating(false);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear la incidencia.'); }
        finally { setLoading(false); }
    };
    const update = async (payload) => {
        if (!selected) return;
        try { setLoading(true); replace(await bimModelsApi.updateIssue(projectId, selected.id, payload, empresaId)); }
        catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo actualizar la incidencia.'); }
        finally { setLoading(false); }
    };
    const addComment = async () => {
        if (!comment.trim() || !selected) return;
        try { setLoading(true); replace(await bimModelsApi.commentIssue(projectId, selected.id, comment.trim(), empresaId)); setComment(''); }
        finally { setLoading(false); }
    };
    const exportBcf = async () => {
        const blob = await bimModelsApi.exportIssueBcf(projectId, selected.id, empresaId);
        const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${selected.topic_guid}.bcf`; anchor.click(); URL.revokeObjectURL(url);
    };

    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-issues-panel>
            <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2.5">
                <div className="flex items-center gap-2"><MessageSquarePlus className="h-4 w-4 text-[#F39200]" /><h3 className="text-xs font-semibold text-zinc-900">Incidencias</h3><span className="text-[10px] text-zinc-500">{issues.length}</span></div>
                <button type="button" onClick={() => setCreating((value) => !value)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-[#F39200]" title="Crear incidencia desde el contexto" aria-label="Crear incidencia desde el contexto"><Plus className="h-4 w-4" /></button>
            </div>
            <div className="space-y-2 p-3">
                {creating ? <div className="flex gap-1"><input value={title} onChange={(event) => setTitle(event.target.value)} className="h-9 min-w-0 flex-1 rounded-md border border-zinc-200 px-2 text-xs" placeholder="Titulo de incidencia" aria-label="Titulo de incidencia" /><button type="button" onClick={create} disabled={!title.trim() || loading} className="h-9 rounded-md bg-[#F39200] px-3 text-xs font-semibold text-white disabled:opacity-40">Crear</button></div> : null}
                {error ? <p className="text-xs text-rose-700" role="alert">{typeof error === 'string' ? error : 'Error de incidencia'}</p> : null}
                {!selected ? <div className="max-h-52 space-y-1 overflow-auto">{issues.map((issue) => <button key={issue.id} type="button" onClick={() => setSelectedId(issue.id)} className="flex w-full items-center gap-2 rounded-md border border-zinc-200 px-2 py-2 text-left hover:border-[#F39200]"><span className="min-w-0 flex-1 truncate text-xs font-medium text-zinc-800">{issue.title}</span><span className="text-[10px] text-zinc-500">{statusLabels[issue.status]}</span></button>)}</div> : (
                    <div data-bim-issue-detail>
                        <button type="button" onClick={() => setSelectedId(null)} className="mb-2 text-[10px] font-semibold text-zinc-500">Volver</button>
                        <div className="flex items-start justify-between gap-2"><button type="button" onClick={() => onOpenIssue?.(selected)} className="min-w-0 text-left"><span className="block truncate text-xs font-semibold text-zinc-900">{selected.title}</span><span className="text-[10px] text-zinc-500">{statusLabels[selected.status]} · {selected.priority}</span></button><button type="button" onClick={exportBcf} className="h-8 w-8 shrink-0 rounded-md text-zinc-500 hover:bg-zinc-100" title="Exportar BCF" aria-label="Exportar BCF"><Download className="mx-auto h-4 w-4" /></button></div>
                        <div className="mt-2 flex flex-wrap gap-1">
                            {!selected.assigned_to && currentUserId ? <button type="button" onClick={() => update({ assigned_to: currentUserId, status: 'assigned' })} className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 px-2 text-[10px] font-semibold"><UserRoundCheck className="h-3.5 w-3.5" />Asignarme</button> : null}
                            {selected.status !== 'resolved' && selected.status !== 'closed' ? <button type="button" onClick={() => update({ status: selected.status === 'in_review' ? 'resolved' : 'in_review' })} className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 px-2 text-[10px] font-semibold"><CheckCircle2 className="h-3.5 w-3.5" />{selected.status === 'in_review' ? 'Resolver' : 'Revisar'}</button> : null}
                            {selected.status === 'resolved' ? <button type="button" onClick={() => update({ status: 'closed' })} className="h-8 rounded-md bg-emerald-700 px-2 text-[10px] font-semibold text-white">Cerrar</button> : null}
                        </div>
                        <div className="mt-2 max-h-32 space-y-1 overflow-auto">{(selected.comments || []).map((item) => <p key={item.id} className="rounded bg-zinc-50 px-2 py-1.5 text-[10px] text-zinc-700">{item.body}</p>)}</div>
                        <div className="mt-2 flex gap-1"><input value={comment} onChange={(event) => setComment(event.target.value)} className="h-8 min-w-0 flex-1 rounded border border-zinc-200 px-2 text-xs" aria-label="Comentario de incidencia" /><button type="button" onClick={addComment} disabled={!comment.trim()} className="h-8 rounded bg-zinc-800 px-2 text-[10px] font-semibold text-white disabled:opacity-40">Enviar</button></div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default BimIssuesPanel;
