const legacyFormEnabled = Boolean(import.meta.env.VITE_ENABLE_LEGACY_BIM_FORMS);

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, CircleHelp, Clock3, Send, X, XCircle } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const EMPTY_DRAFT = { subject: '', question: '', priority: 'normal', assigned_to: '', due_at: '', document_id: '', global_id: '' };
const STATUS_LABELS = { draft: 'Borrador', submitted: 'Enviada', answered: 'Respondida', closed: 'Cerrada', void: 'Anulada' };
const EVENT_LABELS = { created: 'Creada', submitted: 'Enviada', answered: 'Respondida', closed: 'Cerrada', voided: 'Anulada' };

const toIso = (value) => value ? new Date(value).toISOString() : null;
const displayDate = (value) => value ? new Intl.DateTimeFormat('es-CO', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)) : 'Sin fecha';

export default function BimCdeRfiPanel({ projectId, empresaId, selectedElement = null, api = bimModelsApi }) {
    const [rfis, setRfis] = useState([]);
    const [assignees, setAssignees] = useState([]);
    const [documents, setDocuments] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [draft, setDraft] = useState(EMPTY_DRAFT);
    const [reason, setReason] = useState('');
    const [answer, setAnswer] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const [rfiValues, assigneeValues, documentValues] = await Promise.all([
                api.listCdeRfis(projectId, statusFilter || null, empresaId),
                api.listCdeRfiAssignees(projectId, empresaId),
                api.listCdeDocuments(projectId, false, empresaId),
            ]);
            setRfis(rfiValues); setAssignees(assigneeValues); setDocuments(documentValues);
            setSelectedId((current) => rfiValues.some((item) => String(item.id) === current) ? current : String(rfiValues[0]?.id || ''));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudieron cargar las RFI BIM.');
        }
    }, [api, empresaId, projectId, statusFilter]);

    useEffect(() => { load(); }, [load]);
    useEffect(() => { const onKey = (event) => event.key === 'Escape' && setCreateOpen(false); window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
    useEffect(() => {
        if (selectedElement?.global_id) setDraft((current) => ({ ...current, global_id: selectedElement.global_id }));
    }, [selectedElement?.global_id]);

    const selected = useMemo(() => rfis.find((item) => String(item.id) === selectedId) || null, [rfis, selectedId]);
    const assigneeName = (id) => assignees.find((item) => item.id === id)?.name || (id ? `Usuario ${id}` : 'Sin responsable');
    const isOverdue = selected?.due_at && !['closed', 'void'].includes(selected.status) && new Date(selected.due_at) < new Date();

    const create = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const saved = await api.createCdeRfi(projectId, {
                ...draft,
                assigned_to: draft.assigned_to ? Number(draft.assigned_to) : null,
                document_id: draft.document_id ? Number(draft.document_id) : null,
                due_at: toIso(draft.due_at),
                global_id: draft.global_id.trim() || null,
            }, empresaId);
            setDraft({ ...EMPTY_DRAFT, global_id: selectedElement?.global_id || '' });
            setRfis((current) => [saved, ...current]); setSelectedId(String(saved.id));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo crear la RFI BIM.');
        } finally { setBusy(false); }
    };

    const transition = async (action) => {
        try {
            setBusy(true); setError('');
            const saved = await api.transitionCdeRfi(projectId, selected.id, {
                action,
                reason: reason.trim(),
                answer: action === 'answer' ? answer.trim() : null,
                expected_lock_version: selected.lock_version,
            }, empresaId);
            setRfis((current) => current.map((item) => item.id === saved.id ? saved : item));
            setReason(''); setAnswer('');
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo cambiar el estado de la RFI BIM.');
        } finally { setBusy(false); }
    };

    return <section className="border border-slate-200 bg-white" data-bim-cde-rfi>
        <header className="flex h-10 items-center gap-2 border-b border-slate-200 px-3">
            <CircleHelp size={16} className="text-orange-600" /><h3 className="text-sm font-semibold text-slate-800">Solicitudes de informacion</h3>
            <button type="button" onClick={() => setCreateOpen(true)} className="ml-auto inline-flex h-7 items-center gap-1 bg-orange-600 px-2.5 text-[11px] font-semibold text-white"><CircleHelp size={13}/>Nueva RFI</button><select className="h-7 border border-slate-300 px-2 text-[11px]" aria-label="Filtrar RFI por estado" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                <option value="">Todos los estados</option>{Object.entries(STATUS_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
        </header>
        <div className="bim-adaptive-master-detail grid min-h-0 text-xs">
            <div className="border-r border-slate-200 p-3">
                {legacyFormEnabled && <form className="hidden" onSubmit={create}>
                    <input className="col-span-2 min-w-0 border border-slate-300 px-2 py-1.5" required minLength={3} aria-label="Asunto RFI" placeholder="Asunto" value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })} />
                    <textarea className="col-span-2 min-h-20 resize-y border border-slate-300 px-2 py-1.5" required minLength={5} aria-label="Pregunta RFI" placeholder="Pregunta tecnica" value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })} />
                    <select className="min-w-0 border border-slate-300 px-2 py-1.5" aria-label="Prioridad RFI" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}><option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option><option value="critical">Critica</option></select>
                    <select className="min-w-0 border border-slate-300 px-2 py-1.5" required aria-label="Responsable RFI" value={draft.assigned_to} onChange={(event) => setDraft({ ...draft, assigned_to: event.target.value })}><option value="">Responsable</option>{assignees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    <input className="min-w-0 border border-slate-300 px-2 py-1.5" required type="datetime-local" aria-label="Vencimiento RFI" value={draft.due_at} onChange={(event) => setDraft({ ...draft, due_at: event.target.value })} />
                    <select className="min-w-0 border border-slate-300 px-2 py-1.5" aria-label="Documento RFI" value={draft.document_id} onChange={(event) => setDraft({ ...draft, document_id: event.target.value })}><option value="">Sin documento</option>{documents.map((item) => <option key={item.id} value={item.id}>{item.document_code}</option>)}</select>
                    <input className="col-span-2 min-w-0 border border-slate-300 px-2 py-1.5" aria-label="GlobalId RFI" placeholder="GlobalId IFC opcional" value={draft.global_id} onChange={(event) => setDraft({ ...draft, global_id: event.target.value })} />
                    <button type="submit" disabled={busy} className="col-span-2 inline-flex h-8 items-center justify-center gap-1 bg-orange-600 font-semibold text-white disabled:opacity-40"><CircleHelp size={14} />Crear borrador</button>
                </form>}
                <div className="mt-3 space-y-1 border-t border-slate-200 pt-3" data-bim-rfi-list>
                    {rfis.map((item) => <button key={item.id} type="button" onClick={() => setSelectedId(String(item.id))} className={`flex h-10 w-full items-center gap-2 border px-2 text-left ${item.id === selected?.id ? 'border-orange-300 bg-orange-50' : 'border-slate-200 bg-white'}`}><strong className="w-16 shrink-0">{item.rfi_number}</strong><span className="min-w-0 flex-1 truncate">{item.subject}</span><span className="text-[10px] uppercase text-slate-500">{STATUS_LABELS[item.status]}</span></button>)}
                    {!rfis.length ? <p className="py-4 text-center text-slate-500">Sin RFI en este estado.</p> : null}
                </div>
            </div>
            <div className="min-w-0 p-3" data-bim-rfi-detail>
                {selected ? <div className="space-y-3">
                    <div className="flex items-start gap-2"><div className="min-w-0 flex-1"><p className="text-[10px] font-semibold uppercase text-orange-700">{selected.rfi_number} · {STATUS_LABELS[selected.status]}</p><h4 className="truncate text-sm font-semibold text-slate-800">{selected.subject}</h4></div>{isOverdue ? <span className="inline-flex items-center gap-1 bg-rose-100 px-2 py-1 text-[10px] font-semibold text-rose-700"><Clock3 size={12} />Vencida</span> : null}</div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-y border-slate-200 py-2 text-[11px]"><div><dt className="text-slate-500">Responsable</dt><dd className="font-medium">{assigneeName(selected.assigned_to)}</dd></div><div><dt className="text-slate-500">Vencimiento</dt><dd className="font-medium">{displayDate(selected.due_at)}</dd></div><div><dt className="text-slate-500">GlobalId</dt><dd className="truncate font-mono">{selected.global_id || 'Sin vinculo'}</dd></div><div><dt className="text-slate-500">Documento</dt><dd>{documents.find((item) => item.id === selected.document_id)?.document_code || 'Sin documento'}</dd></div></dl>
                    <div><p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Pregunta</p><p className="whitespace-pre-wrap text-slate-700">{selected.question}</p></div>
                    {selected.answer ? <div className="border-l-2 border-emerald-500 bg-emerald-50 p-2"><p className="mb-1 text-[10px] font-semibold uppercase text-emerald-700">Respuesta</p><p className="whitespace-pre-wrap text-slate-700">{selected.answer}</p></div> : null}
                    {selected.status === 'submitted' ? <textarea className="min-h-20 w-full resize-y border border-slate-300 px-2 py-1.5" aria-label="Respuesta RFI" placeholder="Respuesta tecnica" value={answer} onChange={(event) => setAnswer(event.target.value)} /> : null}
                    {!['closed', 'void'].includes(selected.status) ? <input className="w-full border border-slate-300 px-2 py-1.5" aria-label="Motivo transicion RFI" placeholder="Motivo o nota de la accion" value={reason} onChange={(event) => setReason(event.target.value)} /> : null}
                    <div className="flex gap-2">
                        {selected.status === 'draft' ? <button type="button" onClick={() => transition('submit')} disabled={busy || reason.trim().length < 3} className="inline-flex h-8 items-center gap-1 bg-orange-600 px-3 font-semibold text-white disabled:opacity-40"><Send size={13} />Enviar</button> : null}
                        {selected.status === 'submitted' ? <button type="button" onClick={() => transition('answer')} disabled={busy || reason.trim().length < 3 || answer.trim().length < 3} className="inline-flex h-8 items-center gap-1 bg-emerald-600 px-3 font-semibold text-white disabled:opacity-40"><CheckCircle2 size={13} />Responder</button> : null}
                        {selected.status === 'answered' ? <button type="button" onClick={() => transition('close')} disabled={busy || reason.trim().length < 3} className="inline-flex h-8 items-center gap-1 bg-slate-800 px-3 font-semibold text-white disabled:opacity-40"><CheckCircle2 size={13} />Cerrar</button> : null}
                        {['draft', 'submitted'].includes(selected.status) ? <button type="button" onClick={() => transition('void')} disabled={busy || reason.trim().length < 3} className="inline-flex h-8 items-center gap-1 border border-rose-300 px-3 font-semibold text-rose-700 disabled:opacity-40"><XCircle size={13} />Anular</button> : null}
                    </div>
                    <div className="border-t border-slate-200 pt-2" data-bim-rfi-events><p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Trazabilidad</p>{selected.events.map((item) => <div key={item.id} className="flex h-7 items-center gap-2 border-b border-slate-100 text-[10px]"><strong className="w-20">{EVENT_LABELS[item.event_type] || item.event_type}</strong><span className="flex-1 truncate">{item.payload?.reason || item.payload?.subject || ''}</span><time>{displayDate(item.created_at)}</time></div>)}</div>
                </div> : <p className="py-10 text-center text-slate-500">Seleccione o cree una RFI.</p>}
                <p className="mt-3 text-[10px] text-slate-500">Workflow BIM aislado. No modifica solicitudes ni documentos de GiProy Clasico.</p>
                {error ? <p role="alert" className="mt-2 text-rose-700">{error}</p> : null}
            </div>
        </div>
        {createOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-6"><form className="w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-2xl" onSubmit={(event) => { create(event); setCreateOpen(false); }} role="dialog" aria-modal="true" aria-labelledby="rfi-create-title"><header className="flex min-h-12 items-center border-b border-slate-200 px-5"><div><h3 id="rfi-create-title" className="text-sm font-semibold text-slate-900">Nueva RFI BIM</h3><p className="text-[11px] text-slate-500">Formula la pregunta y vincúlala a su responsable y evidencia.</p></div><button type="button" onClick={() => setCreateOpen(false)} aria-label="Cerrar nueva RFI" className="ml-auto inline-flex size-8 items-center justify-center text-slate-500"><X size={16}/></button></header><div className="grid grid-cols-2 gap-3 p-5"><input className="col-span-2 h-9 border border-slate-300 px-3 text-xs" required minLength={3} aria-label="Asunto RFI" placeholder="Asunto" value={draft.subject} onChange={(event) => setDraft({ ...draft, subject: event.target.value })}/><textarea className="col-span-2 h-24 resize-none border border-slate-300 p-3 text-xs" required minLength={5} aria-label="Pregunta RFI" placeholder="Pregunta técnica" value={draft.question} onChange={(event) => setDraft({ ...draft, question: event.target.value })}/><select className="h-9 border border-slate-300 px-2 text-xs" aria-label="Prioridad RFI" value={draft.priority} onChange={(event) => setDraft({ ...draft, priority: event.target.value })}><option value="low">Baja</option><option value="normal">Normal</option><option value="high">Alta</option><option value="critical">Crítica</option></select><select className="h-9 border border-slate-300 px-2 text-xs" required aria-label="Responsable RFI" value={draft.assigned_to} onChange={(event) => setDraft({ ...draft, assigned_to: event.target.value })}><option value="">Responsable</option>{assignees.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><input className="h-9 border border-slate-300 px-2 text-xs" required type="datetime-local" aria-label="Vencimiento RFI" value={draft.due_at} onChange={(event) => setDraft({ ...draft, due_at: event.target.value })}/><select className="h-9 border border-slate-300 px-2 text-xs" aria-label="Documento RFI" value={draft.document_id} onChange={(event) => setDraft({ ...draft, document_id: event.target.value })}><option value="">Sin documento</option>{documents.map((item) => <option key={item.id} value={item.id}>{item.document_code}</option>)}</select><input className="col-span-2 h-9 border border-slate-300 px-3 text-xs" aria-label="GlobalId RFI" placeholder="GlobalId IFC opcional" value={draft.global_id} onChange={(event) => setDraft({ ...draft, global_id: event.target.value })}/></div><footer className="flex min-h-12 items-center justify-end gap-2 border-t border-slate-200 px-5"><button type="button" onClick={() => setCreateOpen(false)} className="h-8 px-3 text-xs">Cancelar</button><button type="submit" disabled={busy} className="h-8 bg-orange-600 px-4 text-xs font-semibold text-white disabled:opacity-40">Crear borrador</button></footer></form></div> : null}
    </section>;
}
