import React, { useEffect, useMemo, useState } from 'react';
import { Bell, CheckCircle2, MessageSquare, Plus, RotateCcw, Send, XCircle } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const tomorrow = () => {
    const value = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return value.toISOString().slice(0, 16);
};

const BimCdeReviewPanel = ({ projectId, empresaId, selectedElement, viewerState, api = bimModelsApi }) => {
    const [reviews, setReviews] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [revisions, setRevisions] = useState([]);
    const [assignees, setAssignees] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [documentId, setDocumentId] = useState('');
    const [form, setForm] = useState({ title: '', document_revision_id: '', assigned_to: '', due_at: tomorrow(), initial_comment: '' });
    const [comment, setComment] = useState('');
    const [resolution, setResolution] = useState('');
    const [message, setMessage] = useState('');
    const [busy, setBusy] = useState(false);

    const selected = useMemo(() => reviews.find((item) => item.id === selectedId) || reviews[0] || null, [reviews, selectedId]);
    const unread = notifications.filter((item) => !item.read_at);

    const load = async () => {
        if (!projectId) return;
        try {
            const [reviewRows, documentRows, userRows, notificationRows] = await Promise.all([
                api.listCdeReviews(projectId, empresaId),
                api.listCdeDocuments(projectId, false, empresaId),
                api.listCdeRfiAssignees(projectId, empresaId),
                api.listCdeReviewNotifications(projectId, empresaId),
            ]);
            setReviews(reviewRows); setDocuments(documentRows); setAssignees(userRows); setNotifications(notificationRows);
            setSelectedId((current) => current || reviewRows[0]?.id || null);
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudieron cargar las revisiones CDE.');
        }
    };

    useEffect(() => { load(); }, [projectId, empresaId]);

    const chooseDocument = async (value) => {
        setDocumentId(value); setForm((current) => ({ ...current, document_revision_id: '' }));
        if (!value) { setRevisions([]); return; }
        try { setRevisions(await api.listCdeDocumentRevisions(projectId, Number(value), empresaId)); }
        catch { setRevisions([]); }
    };

    const replaceReview = (updated) => {
        setReviews((current) => current.some((item) => item.id === updated.id) ? current.map((item) => item.id === updated.id ? updated : item) : [updated, ...current]);
        setSelectedId(updated.id);
    };

    const create = async () => {
        if (!form.title.trim() || !form.document_revision_id || !form.assigned_to || !form.initial_comment.trim()) return;
        try {
            setBusy(true); setMessage('');
            const created = await api.createCdeReview(projectId, {
                ...form,
                document_revision_id: Number(form.document_revision_id),
                assigned_to: Number(form.assigned_to),
                due_at: new Date(form.due_at).toISOString(),
                global_id: selectedElement?.global_id || null,
                viewpoint: viewerState || null,
            }, empresaId);
            replaceReview(created); setForm({ title: '', document_revision_id: '', assigned_to: '', due_at: tomorrow(), initial_comment: '' }); setDocumentId(''); setRevisions([]);
            setMessage(`${created.review_number} creada`);
        } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo crear la revisión.'); }
        finally { setBusy(false); }
    };

    const addComment = async () => {
        if (!selected || !comment.trim()) return;
        try { setBusy(true); replaceReview(await api.commentCdeReview(projectId, selected.id, { body: comment.trim(), expected_lock_version: selected.lock_version }, empresaId)); setComment(''); }
        catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo comentar.'); }
        finally { setBusy(false); }
    };

    const transition = async (action) => {
        if (!selected || (action === 'resolve' && resolution.trim().length < 3)) return;
        try { setBusy(true); replaceReview(await api.transitionCdeReview(projectId, selected.id, { action, resolution: resolution.trim() || null, expected_lock_version: selected.lock_version }, empresaId)); setResolution(''); }
        catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo actualizar la revisión.'); }
        finally { setBusy(false); }
    };

    const readNotification = async (notification) => {
        const updated = await api.readCdeReviewNotification(projectId, notification.id, empresaId);
        setNotifications((current) => current.map((item) => item.id === updated.id ? updated : item)); setSelectedId(notification.review_id);
    };

    return (
        <section className="bim-responsive-container overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-cde-reviews>
            <header className="flex h-10 items-center justify-between border-b border-zinc-200 px-3">
                <div className="flex items-center gap-2"><MessageSquare className="h-4 w-4 text-[#F39200]" aria-hidden="true" /><h3 className="text-xs font-semibold text-zinc-900">Revisiones CDE</h3></div>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-zinc-500"><Bell className="h-3.5 w-3.5" />{unread.length} pendientes</span>
            </header>
            <div className="bim-responsive-two-column bim-responsive-cde-review divide-x divide-zinc-200">
                <div className="space-y-3 p-3">
                    {unread.length ? <div className="space-y-1" data-bim-review-notifications>{unread.slice(0, 3).map((item) => <button key={item.id} type="button" onClick={() => readNotification(item)} className="flex w-full items-center justify-between rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-left text-[10px]"><span className="truncate">{item.review_number} · {item.event_type}</span><span className="font-semibold">Leer</span></button>)}</div> : null}
                    <div className="space-y-2 border-b border-zinc-200 pb-3">
                        <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Título de revisión" className="h-8 w-full rounded border border-zinc-200 px-2 text-xs" />
                        <select value={documentId} onChange={(event) => chooseDocument(event.target.value)} className="h-8 w-full rounded border border-zinc-200 px-2 text-xs" aria-label="Documento de revisión"><option value="">Documento CDE</option>{documents.map((item) => <option key={item.id} value={item.id}>{item.document_code} · {item.title}</option>)}</select>
                        <div className="grid grid-cols-2 gap-2"><select value={form.document_revision_id} onChange={(event) => setForm((current) => ({ ...current, document_revision_id: event.target.value }))} className="h-8 rounded border border-zinc-200 px-2 text-xs" aria-label="Revisión documental"><option value="">Revisión</option>{revisions.map((item) => <option key={item.id} value={item.id}>{item.version_label} · r{item.revision}</option>)}</select><select value={form.assigned_to} onChange={(event) => setForm((current) => ({ ...current, assigned_to: event.target.value }))} className="h-8 rounded border border-zinc-200 px-2 text-xs" aria-label="Responsable de revisión"><option value="">Responsable</option>{assignees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
                        <input type="datetime-local" value={form.due_at} onChange={(event) => setForm((current) => ({ ...current, due_at: event.target.value }))} className="h-8 w-full rounded border border-zinc-200 px-2 text-xs" aria-label="Vencimiento de revisión" />
                        <textarea value={form.initial_comment} onChange={(event) => setForm((current) => ({ ...current, initial_comment: event.target.value }))} placeholder="Observación inicial" className="h-16 w-full resize-none rounded border border-zinc-200 p-2 text-xs" />
                        <button type="button" onClick={create} disabled={busy} className="inline-flex h-8 w-full items-center justify-center gap-2 rounded bg-[#F39200] text-xs font-semibold text-white disabled:opacity-40"><Plus className="h-3.5 w-3.5" />Crear revisión</button>
                    </div>
                    <div className="max-h-64 space-y-1 overflow-auto" data-bim-review-list>{reviews.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(item.id)} className={`w-full rounded border px-2 py-2 text-left ${selected?.id === item.id ? 'border-[#F39200] bg-orange-50' : 'border-zinc-200'}`}><span className="block text-[10px] font-semibold text-zinc-500">{item.review_number} · {item.status}</span><span className="block truncate text-xs font-medium text-zinc-900">{item.title}</span><span className="block truncate text-[10px] text-zinc-500">{item.document_code} · {item.version_label} · {item.assigned_name}</span></button>)}</div>
                </div>
                <div className="min-w-0 space-y-3 p-3">
                    {selected ? <>
                        <div><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="text-[10px] font-semibold text-[#F39200]">{selected.review_number}</p><h4 className="truncate text-sm font-semibold text-zinc-900">{selected.title}</h4></div><span className="rounded bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600">{selected.status}</span></div><p className="mt-1 text-[10px] text-zinc-500">{selected.document_code} · {selected.version_label}{selected.global_id ? ` · ${selected.global_id}` : ''}</p></div>
                        <div className="max-h-64 space-y-2 overflow-auto" data-bim-review-comments>{selected.comments.map((item) => <div key={item.id} className="rounded border border-zinc-200 bg-zinc-50 p-2"><p className="text-xs leading-5 text-zinc-700">{item.body}</p><p className="mt-1 text-[9px] text-zinc-400">Usuario {item.created_by}</p></div>)}</div>
                        {selected.status !== 'closed' ? <div className="flex gap-2"><input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Añadir comentario" className="h-8 min-w-0 flex-1 rounded border border-zinc-200 px-2 text-xs" /><button type="button" onClick={addComment} className="inline-flex h-8 w-8 items-center justify-center rounded bg-zinc-900 text-white" aria-label="Enviar comentario"><Send className="h-3.5 w-3.5" /></button></div> : null}
                        <div className="space-y-2 border-t border-zinc-200 pt-3"><input value={resolution} onChange={(event) => setResolution(event.target.value)} placeholder="Respuesta o motivo de decisión" className="h-8 w-full rounded border border-zinc-200 px-2 text-xs" />
                            <div className="flex gap-2">{selected.status === 'open' ? <button type="button" onClick={() => transition('resolve')} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded bg-emerald-600 text-xs font-semibold text-white"><CheckCircle2 className="h-3.5 w-3.5" />Resolver</button> : null}{selected.status === 'resolved' ? <><button type="button" onClick={() => transition('reopen')} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded border border-zinc-300 text-xs font-semibold"><RotateCcw className="h-3.5 w-3.5" />Reabrir</button><button type="button" onClick={() => transition('close')} className="inline-flex h-8 flex-1 items-center justify-center gap-1 rounded bg-zinc-900 text-xs font-semibold text-white"><XCircle className="h-3.5 w-3.5" />Cerrar</button></> : null}</div>
                        </div>
                    </> : <p className="text-xs text-zinc-500">Crea una revisión sobre una emisión documental exacta.</p>}
                </div>
            </div>
            {message ? <p className="border-t border-zinc-200 px-3 py-2 text-[10px] font-medium text-zinc-600" role="status">{message}</p> : null}
        </section>
    );
};

export default BimCdeReviewPanel;
