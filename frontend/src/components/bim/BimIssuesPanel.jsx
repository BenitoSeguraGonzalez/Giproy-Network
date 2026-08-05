import React, { useEffect, useState } from 'react';
import { CheckCircle2, Download, MessageSquarePlus, Plus, UserRoundCheck } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const statusLabels = { open: 'Abierta', assigned: 'Asignada', in_review: 'En revision', resolved: 'Resuelta', closed: 'Cerrada', discarded: 'Descartada' };
const BimIssuesPanel = ({ projectId, versionId, empresaId, currentUserId, viewerState, onOpenIssue, api = bimModelsApi }) => {
    const [issues, setIssues] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [creating, setCreating] = useState(false);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const refresh = async () => {
        if (!projectId) return;
        const items = await api.listIssues(projectId, empresaId);
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
            const issue = await api.createIssue(projectId, {
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
        try { setLoading(true); replace(await api.updateIssue(projectId, selected.id, payload, empresaId)); }
        catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo actualizar la incidencia.'); }
        finally { setLoading(false); }
    };
    const addComment = async () => {
        if (!comment.trim() || !selected) return;
        try { setLoading(true); replace(await api.commentIssue(projectId, selected.id, comment.trim(), empresaId)); setComment(''); }
        finally { setLoading(false); }
    };
    const exportBcf = async () => {
        const blob = await api.exportIssueBcf(projectId, selected.id, empresaId);
        const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `${selected.topic_guid}.bcf`; anchor.click(); URL.revokeObjectURL(url);
    };

    return (
        <section className="flex h-full min-h-0 flex-col bg-white" data-bim-issues-panel>
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-4">
                <div className="flex items-center gap-2"><MessageSquarePlus className="h-4 w-4 text-[#F39200]" /><div><h3 className="text-xs font-semibold text-zinc-900">Incidencias</h3><p className="text-[10px] text-zinc-500">{issues.length} en esta coordinación</p></div></div>
                <button type="button" onClick={() => setCreating((value) => !value)} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-[#F39200] px-2.5 text-[10px] font-semibold text-white hover:bg-[#dc8300]" aria-expanded={creating} aria-label="Crear incidencia desde el contexto"><Plus className="h-3.5 w-3.5" />Nueva</button>
            </div>
            {creating ? <div className="shrink-0 border-b border-orange-200 bg-orange-50 p-4"><label className="text-[11px] font-semibold text-zinc-900">Título de la incidencia<input value={title} onChange={(event) => setTitle(event.target.value)} className="mt-1.5 h-10 w-full rounded-md border border-zinc-300 bg-white px-3 text-xs font-normal" placeholder="Describe el problema observado" aria-label="Titulo de incidencia" /></label><p className="mt-2 text-[10px] leading-4 text-orange-900">Se guardarán cámara, selección y visibilidad actuales como viewpoint.</p><div className="mt-3 flex justify-end gap-2"><button type="button" onClick={() => setCreating(false)} className="h-9 px-3 text-[10px] font-semibold text-zinc-600">Cancelar</button><button type="button" onClick={create} disabled={!title.trim() || loading} className="h-9 rounded-md bg-[#F39200] px-3 text-xs font-semibold text-white disabled:opacity-40">Crear incidencia</button></div></div> : null}
            {error ? <p className="shrink-0 border-b border-rose-200 bg-rose-50 px-4 py-2 text-xs text-rose-700" role="alert">{typeof error === 'string' ? error : 'Error de incidencia'}</p> : null}
            <div className="min-h-0 flex-1 overflow-y-auto">
                {!selected ? <div className="divide-y divide-zinc-200">{issues.map((issue) => <button key={issue.id} type="button" onClick={() => setSelectedId(issue.id)} className="flex w-full items-start gap-3 border-l-2 border-l-transparent px-4 py-3 text-left hover:border-l-[#F39200] hover:bg-zinc-50"><span className="min-w-0 flex-1"><span className="block truncate text-xs font-semibold text-zinc-900">{issue.title}</span><span className="mt-1 block text-[10px] text-zinc-500">{issue.priority || 'normal'} · #{issue.id}</span></span><span className="shrink-0 rounded-full border border-zinc-200 bg-white px-2 py-0.5 text-[9px] font-semibold text-zinc-600">{statusLabels[issue.status]}</span></button>)}{!issues.length ? <div className="px-4 py-8 text-center"><p className="text-xs font-semibold text-zinc-900">Sin incidencias</p><p className="mt-1 text-[11px] leading-4 text-zinc-500">Crea una desde el contexto actual del modelo.</p></div> : null}</div> : (
                    <div className="p-4" data-bim-issue-detail>
                        <button type="button" onClick={() => setSelectedId(null)} className="mb-3 text-[10px] font-semibold text-zinc-500 hover:text-zinc-900">← Volver a incidencias</button>
                        <div className="flex items-start justify-between gap-2 border-b border-zinc-200 pb-4"><button type="button" onClick={() => onOpenIssue?.(selected)} className="min-w-0 text-left"><span className="block text-sm font-semibold leading-5 text-zinc-950">{selected.title}</span><span className="mt-1 block text-[10px] text-zinc-500">{statusLabels[selected.status]} · {selected.priority}</span><span className="mt-2 block text-[10px] font-semibold text-orange-700">Abrir viewpoint en el modelo</span></button><button type="button" onClick={exportBcf} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-zinc-200 text-zinc-500 hover:border-orange-400 hover:text-orange-700" title="Exportar BCF" aria-label="Exportar BCF"><Download className="h-4 w-4" /></button></div>
                        <div className="mt-4 flex flex-wrap gap-2">
                            {!selected.assigned_to && currentUserId ? <button type="button" onClick={() => update({ assigned_to: currentUserId, status: 'assigned' })} className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 px-2 text-[10px] font-semibold"><UserRoundCheck className="h-3.5 w-3.5" />Asignarme</button> : null}
                            {selected.status !== 'resolved' && selected.status !== 'closed' ? <button type="button" onClick={() => update({ status: selected.status === 'in_review' ? 'resolved' : 'in_review' })} className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 px-2 text-[10px] font-semibold"><CheckCircle2 className="h-3.5 w-3.5" />{selected.status === 'in_review' ? 'Resolver' : 'Revisar'}</button> : null}
                            {selected.status === 'resolved' ? <button type="button" onClick={() => update({ status: 'closed' })} className="h-8 rounded-md bg-emerald-700 px-2 text-[10px] font-semibold text-white">Cerrar</button> : null}
                        </div>
                        <div className="mt-5 border-t border-zinc-200 pt-3"><h4 className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Conversación</h4><div className="mt-2 space-y-2">{(selected.comments || []).map((item) => <p key={item.id} className="border-l-2 border-zinc-300 pl-3 text-[10px] leading-4 text-zinc-700">{item.body}</p>)}</div><div className="mt-3 flex gap-1"><input value={comment} onChange={(event) => setComment(event.target.value)} className="h-9 min-w-0 flex-1 rounded border border-zinc-300 px-2 text-xs" placeholder="Añadir comentario" aria-label="Comentario de incidencia" /><button type="button" onClick={addComment} disabled={!comment.trim()} className="h-9 rounded bg-zinc-800 px-3 text-[10px] font-semibold text-white disabled:opacity-40">Enviar</button></div></div>
                    </div>
                )}
            </div>
        </section>
    );
};

export default BimIssuesPanel;
