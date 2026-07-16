import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Camera, CheckCircle2, Eye, ImagePlus, MessageSquarePlus, Plus, RefreshCw, Search, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const STATUS_LABELS = { open: 'Abierta', assigned: 'Asignada', in_review: 'En revisión', resolved: 'Resuelta', closed: 'Cerrada', discarded: 'Descartada' };
const PRIORITY_LABELS = { low: 'Baja', normal: 'Normal', high: 'Alta', critical: 'Crítica' };
const OPEN_STATUSES = new Set(['open', 'assigned', 'in_review']);

const BimFieldIssuesPanel = ({ projectId, versionId, empresaId, viewerState, onOpenIssue, api = bimModelsApi, onOpenAttachment }) => {
    const [issues, setIssues] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [search, setSearch] = useState('');
    const [status, setStatus] = useState('open');
    const [creating, setCreating] = useState(false);
    const [draft, setDraft] = useState({ title: '', description: '', priority: 'normal' });
    const [comment, setComment] = useState('');
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const [previewUrls, setPreviewUrls] = useState({});

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setMessage('');
            const items = await api.listIssues(projectId, empresaId);
            setIssues(items || []);
            setSelectedId((current) => current && items.some((item) => item.id === current) ? current : items[0]?.id || null);
        } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudieron cargar las incidencias de campo.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);
    const selected = issues.find((item) => item.id === selectedId) || null;

    useEffect(() => {
        let cancelled = false;
        const urls = [];
        Promise.all((selected?.attachments || []).map(async (attachment) => {
            const blob = await api.downloadIssueAttachment(projectId, selected.id, attachment.id, empresaId);
            const url = URL.createObjectURL(blob); urls.push(url);
            return [attachment.id, url];
        })).then((entries) => { if (!cancelled) setPreviewUrls(Object.fromEntries(entries)); }).catch(() => { if (!cancelled) setPreviewUrls({}); });
        return () => { cancelled = true; urls.forEach((url) => URL.revokeObjectURL(url)); };
    }, [api, empresaId, projectId, selected?.id, selected?.attachments]);

    const visible = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('es');
        return issues.filter((item) => {
            if (status === 'open' && !OPEN_STATUSES.has(item.status)) return false;
            if (status !== 'all' && status !== 'open' && item.status !== status) return false;
            return !term || `${item.title} ${item.description || ''} ${item.topic_guid}`.toLocaleLowerCase('es').includes(term);
        });
    }, [issues, search, status]);

    const replace = (issue) => setIssues((current) => current.map((item) => item.id === issue.id ? issue : item));

    const create = async () => {
        if (!draft.title.trim()) return;
        try {
            setBusy(true); setMessage('');
            const issue = await api.createIssue(projectId, {
                title: draft.title.trim(), description: draft.description.trim() || null,
                priority: draft.priority, version_id: versionId || null,
                viewpoint: { source_version_id: versionId || null, camera: viewerState?.camera || {}, selected_guids: viewerState?.selection?.global_id ? [viewerState.selection.global_id] : [], visibility: viewerState?.visibility || {}, clipping: viewerState?.clipping || {} },
            }, empresaId);
            setIssues((current) => [issue, ...current]); setSelectedId(issue.id);
            setDraft({ title: '', description: '', priority: 'normal' }); setCreating(false);
        } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo crear la incidencia.'); }
        finally { setBusy(false); }
    };

    const update = async (payload) => {
        if (!selected) return;
        try { setBusy(true); setMessage(''); replace(await api.updateIssue(projectId, selected.id, payload, empresaId)); }
        catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo actualizar la incidencia.'); }
        finally { setBusy(false); }
    };

    const addComment = async () => {
        if (!selected || !comment.trim()) return;
        try { setBusy(true); replace(await api.commentIssue(projectId, selected.id, comment.trim(), empresaId)); setComment(''); }
        catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo registrar la observación.'); }
        finally { setBusy(false); }
    };

    const upload = async (file) => {
        if (!selected || !file) return;
        try {
            setBusy(true); setMessage('');
            const attachment = await api.uploadIssueAttachment(projectId, selected.id, file, empresaId);
            replace({ ...selected, attachments: [...(selected.attachments || []), attachment] });
            setMessage(`${attachment.filename} registrada`);
        } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo registrar la fotografía.'); }
        finally { setBusy(false); }
    };

    const openAttachment = async (attachment) => {
        const blob = await api.downloadIssueAttachment(projectId, selected.id, attachment.id, empresaId);
        if (onOpenAttachment) return onOpenAttachment(attachment, blob);
        const url = URL.createObjectURL(blob); window.open(url, '_blank', 'noopener,noreferrer'); setTimeout(() => URL.revokeObjectURL(url), 30000);
    };

    return (
        <section className="grid h-full min-h-0 grid-cols-[minmax(340px,0.36fr)_minmax(0,1fr)] overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-field-issues>
            <aside className="flex min-h-0 flex-col border-r border-zinc-200">
                <header className="flex h-11 shrink-0 items-center justify-between border-b border-zinc-200 px-3"><div className="flex items-center gap-2"><MessageSquarePlus className="h-4 w-4 text-[#F39200]" /><div><h3 className="text-xs font-semibold text-zinc-900">Incidencias de campo</h3><p className="text-[9px] text-zinc-500">{visible.length} visibles · {issues.length} totales</p></div></div><div className="flex gap-1"><button type="button" onClick={load} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100" aria-label="Actualizar incidencias" title="Actualizar"><RefreshCw className="h-3.5 w-3.5" /></button><button type="button" onClick={() => setCreating(true)} className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-[#F39200] text-white" aria-label="Nueva incidencia de campo" title="Nueva incidencia"><Plus className="h-4 w-4" /></button></div></header>
                <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_132px] gap-2 border-b border-zinc-200 bg-zinc-50 p-2"><label className="relative"><Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-2 text-xs" placeholder="Buscar incidencia" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs" aria-label="Filtrar estado de incidencia"><option value="open">Activas</option><option value="all">Todas</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></div>
                <div className="min-h-0 flex-1 overflow-y-auto" data-bim-field-issue-list>{visible.map((item) => <button key={item.id} type="button" onClick={() => { setCreating(false); setSelectedId(item.id); }} className={`grid w-full grid-cols-[minmax(0,1fr)_76px] gap-2 border-b border-zinc-100 px-3 py-3 text-left ${item.id === selectedId && !creating ? 'bg-orange-50' : 'hover:bg-zinc-50'}`}><span className="min-w-0"><span className="block truncate text-xs font-semibold text-zinc-800">{item.title}</span><span className="mt-1 block truncate text-[10px] text-zinc-500">{item.description || 'Sin descripción'}</span><span className="mt-1 inline-flex items-center gap-1 text-[9px] text-zinc-400"><Camera className="h-3 w-3" />{item.attachments?.length || 0} evidencias</span></span><span className="text-right"><span className="block text-[10px] font-semibold text-zinc-600">{STATUS_LABELS[item.status] || item.status}</span><span className={`mt-1 block text-[9px] ${item.priority === 'critical' ? 'text-rose-700' : 'text-zinc-400'}`}>{PRIORITY_LABELS[item.priority] || item.priority}</span></span></button>)}{!visible.length ? <p className="p-4 text-xs text-zinc-500">No hay incidencias para este filtro.</p> : null}</div>
            </aside>
            <div className="min-h-0 overflow-y-auto" data-bim-field-issue-detail>
                {creating ? <div className="mx-auto max-w-3xl p-6"><div className="mb-5 flex items-center justify-between"><div><h3 className="text-sm font-semibold text-zinc-900">Nueva incidencia de campo</h3><p className="text-xs text-zinc-500">Se conservará el contexto BIM seleccionado.</p></div><button type="button" onClick={() => setCreating(false)} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100" aria-label="Cancelar nueva incidencia"><X className="h-4 w-4" /></button></div><div className="space-y-4"><label className="block text-xs font-medium text-zinc-700">Título<input value={draft.title} onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-zinc-200 px-3 text-xs" placeholder="Describe el hallazgo" /></label><label className="block text-xs font-medium text-zinc-700">Descripción<textarea value={draft.description} onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))} className="mt-1 min-h-28 w-full resize-y rounded-md border border-zinc-200 p-3 text-xs" placeholder="Ubicación, condición observada y acción requerida" /></label><label className="block w-48 text-xs font-medium text-zinc-700">Prioridad<select value={draft.priority} onChange={(event) => setDraft((current) => ({ ...current, priority: event.target.value }))} className="mt-1 h-9 w-full rounded-md border border-zinc-200 bg-white px-2 text-xs">{Object.entries(PRIORITY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><button type="button" onClick={create} disabled={busy || !draft.title.trim()} className="h-9 rounded-md bg-[#F39200] px-4 text-xs font-semibold text-white disabled:opacity-40">Crear incidencia</button></div></div> : selected ? <div className="p-5"><div className="flex items-start justify-between gap-4 border-b border-zinc-200 pb-4"><div className="min-w-0"><div className="flex items-center gap-2"><h3 className="truncate text-sm font-semibold text-zinc-900">{selected.title}</h3><span className="rounded bg-zinc-100 px-2 py-1 text-[9px] font-semibold text-zinc-600">{PRIORITY_LABELS[selected.priority]}</span></div><p className="mt-1 text-xs text-zinc-500">{selected.description || 'Sin descripción'}</p><p className="mt-2 font-mono text-[9px] text-zinc-400">{selected.topic_guid}</p></div><div className="flex shrink-0 items-center gap-2"><select value={selected.status} onChange={(event) => update({ status: event.target.value })} disabled={busy} className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs" aria-label="Estado de incidencia">{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><button type="button" onClick={() => onOpenIssue?.(selected)} className="inline-flex h-8 items-center gap-1 rounded-md border border-zinc-200 px-2 text-[10px] font-semibold text-zinc-600 hover:border-[#F39200]" title="Abrir contexto BIM"><Eye className="h-3.5 w-3.5" />Contexto</button></div></div><div className="grid grid-cols-[minmax(0,1fr)_minmax(280px,0.34fr)] gap-5 pt-5"><div><div className="mb-3 flex items-center justify-between"><div><h4 className="text-xs font-semibold text-zinc-800">Evidencia fotográfica</h4><p className="text-[10px] text-zinc-500">JPEG, PNG o WebP · máximo 10 MB</p></div><label className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md bg-zinc-800 px-3 text-[10px] font-semibold text-white"><ImagePlus className="h-3.5 w-3.5" />Agregar foto<input type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" aria-label="Agregar evidencia fotográfica" disabled={busy} onChange={(event) => { upload(event.target.files?.[0]); event.target.value = ''; }} /></label></div><div className="grid grid-cols-3 gap-2 2xl:grid-cols-4" data-bim-field-issue-attachments>{(selected.attachments || []).map((attachment) => <button key={attachment.id} type="button" onClick={() => openAttachment(attachment)} className="group overflow-hidden rounded-md border border-zinc-200 bg-zinc-50 text-left" aria-label={`Abrir evidencia ${attachment.filename}`}><div className="aspect-video bg-zinc-100">{previewUrls[attachment.id] ? <img src={previewUrls[attachment.id]} alt="" className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center"><Camera className="h-5 w-5 text-zinc-300" /></div>}</div><div className="px-2 py-1.5"><p className="truncate text-[10px] font-medium text-zinc-700">{attachment.filename}</p><p className="text-[9px] text-zinc-400">{Math.max(1, Math.round(attachment.byte_size / 1024))} KB</p></div></button>)}{!selected.attachments?.length ? <div className="col-span-full border border-dashed border-zinc-200 py-10 text-center text-xs text-zinc-500">Sin evidencia fotográfica.</div> : null}</div></div><div className="border-l border-zinc-200 pl-5"><h4 className="text-xs font-semibold text-zinc-800">Observaciones</h4><div className="mt-3 max-h-64 space-y-2 overflow-y-auto">{(selected.comments || []).map((item) => <p key={item.id} className="rounded-md bg-zinc-50 px-3 py-2 text-[10px] text-zinc-700">{item.body}</p>)}{!selected.comments?.length ? <p className="text-[10px] text-zinc-400">Sin observaciones.</p> : null}</div><div className="mt-3 flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} className="h-8 min-w-0 flex-1 rounded-md border border-zinc-200 px-2 text-xs" aria-label="Nueva observación de campo" placeholder="Añadir observación" /><button type="button" onClick={addComment} disabled={busy || !comment.trim()} className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-zinc-800 text-white disabled:opacity-40" aria-label="Guardar observación"><CheckCircle2 className="h-3.5 w-3.5" /></button></div></div></div></div> : <div className="flex h-full items-center justify-center text-xs text-zinc-500">Selecciona o crea una incidencia.</div>}
                {message ? <p className="fixed bottom-5 right-5 rounded-md border border-zinc-200 bg-white px-3 py-2 text-[10px] font-medium text-zinc-700 shadow-sm" role="status">{message}</p> : null}
            </div>
        </section>
    );
};

export default BimFieldIssuesPanel;
