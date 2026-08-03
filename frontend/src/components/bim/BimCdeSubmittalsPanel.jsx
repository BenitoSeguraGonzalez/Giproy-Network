import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, RotateCcw, Send, XCircle } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const EMPTY_DRAFT = { title: '', submittal_type: 'shop_drawing', discipline: 'Arquitectura', specification_section: '', reviewer_id: '', required_at: '', document_id: '', submission_notes: '' };
const STATUS = { draft: 'Borrador', submitted: 'Enviado', under_review: 'En revision', approved: 'Aprobado', rejected: 'Rechazado', void: 'Anulado' };
const TYPES = { shop_drawing: 'Plano de taller', product_data: 'Ficha de producto', sample: 'Muestra', method_statement: 'Procedimiento', calculation: 'Calculo', other: 'Otro' };
const toIso = (value) => new Date(value).toISOString();
const displayDate = (value) => value ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Sin fecha';

export default function BimCdeSubmittalsPanel({ projectId, empresaId, api = bimModelsApi }) {
    const [items, setItems] = useState([]);
    const [assignees, setAssignees] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [draft, setDraft] = useState(EMPTY_DRAFT);
    const [comment, setComment] = useState('');
    const [resubmit, setResubmit] = useState({ document_id: '', submission_notes: '' });
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const [submittals, users, docs] = await Promise.all([api.listCdeSubmittals(projectId, empresaId), api.listCdeRfiAssignees(projectId, empresaId), api.listCdeDocuments(projectId, false, empresaId)]);
            setItems(submittals); setAssignees(users); setDocuments(docs);
            setSelectedId((current) => submittals.some((item) => String(item.id) === current) ? current : String(submittals[0]?.id || ''));
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudieron cargar los submittals BIM.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);
    const selected = useMemo(() => items.find((item) => String(item.id) === selectedId) || null, [items, selectedId]);
    const userName = (id) => assignees.find((item) => item.id === id)?.name || `Usuario ${id}`;
    const documentCode = (id) => documents.find((item) => item.id === id)?.document_code || `Documento ${id}`;
    const replace = (saved) => { setItems((current) => [saved, ...current.filter((item) => item.id !== saved.id)]); setSelectedId(String(saved.id)); };

    const create = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const saved = await api.createCdeSubmittal(projectId, { ...draft, reviewer_id: Number(draft.reviewer_id), document_id: Number(draft.document_id), required_at: toIso(draft.required_at), specification_section: draft.specification_section.trim() || null, submission_notes: draft.submission_notes.trim() || null }, empresaId);
            replace(saved); setDraft(EMPTY_DRAFT);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear el submittal BIM.'); }
        finally { setBusy(false); }
    };

    const transition = async (action) => {
        try {
            setBusy(true); setError('');
            replace(await api.transitionCdeSubmittal(projectId, selected.id, { action, comment: comment.trim(), expected_lock_version: selected.lock_version }, empresaId)); setComment('');
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo cambiar el estado del submittal BIM.'); }
        finally { setBusy(false); }
    };

    const createRevision = async () => {
        try {
            setBusy(true); setError('');
            replace(await api.createCdeSubmittalRevision(projectId, selected.id, { document_id: Number(resubmit.document_id), submission_notes: resubmit.submission_notes.trim(), expected_lock_version: selected.lock_version }, empresaId)); setResubmit({ document_id: '', submission_notes: '' });
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo crear la revision del submittal BIM.'); }
        finally { setBusy(false); }
    };

    return <section className="border border-slate-200 bg-white" data-bim-cde-submittals>
        <header className="flex h-10 items-center gap-2 border-b border-slate-200 px-3"><ClipboardCheck size={16} className="text-orange-600" /><h3 className="text-sm font-semibold text-slate-800">Submittals y planos de ingenieria</h3></header>
        <div className="bim-adaptive-master-detail grid min-h-0 text-xs">
            <div className="border-r border-slate-200 p-3">
                <form className="grid grid-cols-2 gap-2" onSubmit={create}>
                    <input className="col-span-2 border border-slate-300 px-2 py-1.5" required minLength={3} aria-label="Titulo submittal" placeholder="Titulo del expediente" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                    <select className="border border-slate-300 px-2 py-1.5" aria-label="Tipo submittal" value={draft.submittal_type} onChange={(event) => setDraft({ ...draft, submittal_type: event.target.value })}>{Object.entries(TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                    <input className="border border-slate-300 px-2 py-1.5" required aria-label="Disciplina submittal" placeholder="Disciplina" value={draft.discipline} onChange={(event) => setDraft({ ...draft, discipline: event.target.value })} />
                    <input className="border border-slate-300 px-2 py-1.5" aria-label="Seccion especificacion submittal" placeholder="Seccion especificacion" value={draft.specification_section} onChange={(event) => setDraft({ ...draft, specification_section: event.target.value })} />
                    <select className="border border-slate-300 px-2 py-1.5" required aria-label="Revisor submittal" value={draft.reviewer_id} onChange={(event) => setDraft({ ...draft, reviewer_id: event.target.value })}><option value="">Revisor</option>{assignees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    <input className="border border-slate-300 px-2 py-1.5" required type="datetime-local" aria-label="Fecha requerida submittal" value={draft.required_at} onChange={(event) => setDraft({ ...draft, required_at: event.target.value })} />
                    <select className="col-span-2 border border-slate-300 px-2 py-1.5" required aria-label="Documento submittal" value={draft.document_id} onChange={(event) => setDraft({ ...draft, document_id: event.target.value })}><option value="">Documento CDE vigente</option>{documents.map((item) => <option key={item.id} value={item.id}>{item.document_code} · {item.title}</option>)}</select>
                    <textarea className="col-span-2 min-h-16 resize-y border border-slate-300 px-2 py-1.5" aria-label="Notas submittal" placeholder="Notas de emision" value={draft.submission_notes} onChange={(event) => setDraft({ ...draft, submission_notes: event.target.value })} />
                    <button type="submit" disabled={busy} className="col-span-2 inline-flex h-8 items-center justify-center gap-1 bg-orange-600 font-semibold text-white disabled:opacity-40"><ClipboardCheck size={14} />Crear expediente</button>
                </form>
                <div className="mt-3 space-y-1 border-t border-slate-200 pt-3" data-bim-submittal-list>{items.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(String(item.id))} className={`flex h-10 w-full items-center gap-2 border px-2 text-left ${item.id === selected?.id ? 'border-orange-300 bg-orange-50' : 'border-slate-200'}`}><strong className="w-16">{item.submittal_number}</strong><span className="min-w-0 flex-1 truncate">{item.title}</span><span className="text-[10px] uppercase text-slate-500">{STATUS[item.status]}</span></button>)}</div>
            </div>
            <div className="min-w-0 p-3" data-bim-submittal-detail>
                {selected ? <div className="space-y-3">
                    <div><p className="text-[10px] font-semibold uppercase text-orange-700">{selected.submittal_number} · REV {String(selected.current_revision).padStart(2, '0')} · {STATUS[selected.status]}</p><h4 className="text-sm font-semibold text-slate-800">{selected.title}</h4></div>
                    <dl className="grid grid-cols-2 gap-2 border-y border-slate-200 py-2 text-[11px]"><div><dt className="text-slate-500">Tipo</dt><dd>{TYPES[selected.submittal_type]}</dd></div><div><dt className="text-slate-500">Disciplina</dt><dd>{selected.discipline}</dd></div><div><dt className="text-slate-500">Revisor</dt><dd>{userName(selected.reviewer_id)}</dd></div><div><dt className="text-slate-500">Fecha requerida</dt><dd>{displayDate(selected.required_at)}</dd></div></dl>
                    <div data-bim-submittal-revisions><p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Revisiones documentales</p>{selected.revisions.map((item) => <div key={item.id} className="flex h-8 items-center gap-2 border-b border-slate-100"><strong className="w-12">REV {item.revision}</strong><span className="flex-1 truncate">{documentCode(item.document_id)}</span><span className="text-[10px] uppercase text-slate-500">{STATUS[item.status] || item.status}</span></div>)}</div>
                    {selected.status === 'rejected' ? <div className="grid grid-cols-[180px_minmax(0,1fr)_100px] gap-2 border border-rose-200 bg-rose-50 p-2"><select className="border border-slate-300 px-2" aria-label="Nuevo documento submittal" value={resubmit.document_id} onChange={(event) => setResubmit({ ...resubmit, document_id: event.target.value })}><option value="">Nueva emision CDE</option>{documents.map((item) => <option key={item.id} value={item.id}>{item.document_code}</option>)}</select><input className="min-w-0 border border-slate-300 px-2" aria-label="Notas reenvio submittal" placeholder="Cambios realizados" value={resubmit.submission_notes} onChange={(event) => setResubmit({ ...resubmit, submission_notes: event.target.value })} /><button type="button" onClick={createRevision} disabled={busy || !resubmit.document_id || resubmit.submission_notes.trim().length < 3} className="inline-flex items-center justify-center gap-1 bg-orange-600 font-semibold text-white disabled:opacity-40"><RotateCcw size={13} />Reenviar</button></div> : null}
                    {!['approved', 'rejected', 'void'].includes(selected.status) ? <input className="w-full border border-slate-300 px-2 py-1.5" aria-label="Comentario submittal" placeholder="Comentario de la accion" value={comment} onChange={(event) => setComment(event.target.value)} /> : null}
                    <div className="flex gap-2">
                        {selected.status === 'draft' ? <button type="button" onClick={() => transition('submit')} disabled={busy || comment.trim().length < 3} className="inline-flex h-8 items-center gap-1 bg-orange-600 px-3 font-semibold text-white disabled:opacity-40"><Send size={13} />Enviar</button> : null}
                        {selected.status === 'submitted' ? <button type="button" onClick={() => transition('start_review')} disabled={busy || comment.trim().length < 3} className="inline-flex h-8 items-center gap-1 bg-sky-700 px-3 font-semibold text-white disabled:opacity-40"><ClipboardCheck size={13} />Iniciar revision</button> : null}
                        {selected.status === 'under_review' ? <><button type="button" onClick={() => transition('approve')} disabled={busy || comment.trim().length < 3} className="inline-flex h-8 items-center gap-1 bg-emerald-600 px-3 font-semibold text-white disabled:opacity-40"><CheckCircle2 size={13} />Aprobar</button><button type="button" onClick={() => transition('reject')} disabled={busy || comment.trim().length < 3} className="inline-flex h-8 items-center gap-1 border border-rose-300 px-3 font-semibold text-rose-700 disabled:opacity-40"><XCircle size={13} />Rechazar</button></> : null}
                        {['draft', 'submitted'].includes(selected.status) ? <button type="button" onClick={() => transition('void')} disabled={busy || comment.trim().length < 3} className="inline-flex h-8 items-center gap-1 border border-slate-300 px-3 font-semibold text-slate-700 disabled:opacity-40"><XCircle size={13} />Anular</button> : null}
                    </div>
                    <div className="border-t border-slate-200 pt-2" data-bim-submittal-events><p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Trazabilidad</p>{selected.events.map((item) => <div key={item.id} className="flex h-7 items-center border-b border-slate-100 text-[10px]"><strong className="w-28">{item.event_type}</strong><span className="flex-1 truncate">{item.payload?.comment || `Revision ${item.payload?.revision || 1}`}</span><time>{displayDate(item.created_at)}</time></div>)}</div>
                </div> : <p className="py-10 text-center text-slate-500">Seleccione o cree un submittal.</p>}
                <p className="mt-3 text-[10px] text-slate-500">Expediente BIM aislado. No modifica Documentos, Compras ni Contratos de GiProy Clasico.</p>{error ? <p role="alert" className="mt-2 text-rose-700">{error}</p> : null}
            </div>
        </div>
    </section>;
}
