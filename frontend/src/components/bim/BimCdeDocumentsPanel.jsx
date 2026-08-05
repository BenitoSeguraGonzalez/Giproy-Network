import { useCallback, useEffect, useMemo, useState } from 'react';
import { Archive, Download, FileStack, History, LockKeyhole, Save, Upload, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const EMPTY_DRAFT = { document_code: '', title: '', category: 'drawing', version_label: 'P01', notes: '', file: null };
const CATEGORY_LABELS = { drawing: 'Plano', specification: 'Especificacion', report: 'Informe', procedure: 'Procedimiento', contract: 'Contrato', model: 'Modelo', other: 'Otro' };
const EMPTY_ACL = { user_id: '', can_view: true, can_download: false, can_revise: false, can_manage: false, active: true };

export default function BimCdeDocumentsPanel({ projectId, empresaId, api = bimModelsApi }) {
    const [documents, setDocuments] = useState([]);
    const [selectedId, setSelectedId] = useState('');
    const [revisions, setRevisions] = useState([]);
    const [includeArchived, setIncludeArchived] = useState(false);
    const [draft, setDraft] = useState(EMPTY_DRAFT);
    const [archiveReason, setArchiveReason] = useState('');
    const [aclUsers, setAclUsers] = useState([]);
    const [aclRows, setAclRows] = useState([]);
    const [aclDraft, setAclDraft] = useState(EMPTY_ACL);
    const [canManageAcl, setCanManageAcl] = useState(false);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [uploadOpen, setUploadOpen] = useState(false);

    const loadDocuments = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const values = await api.listCdeDocuments(projectId, includeArchived, empresaId);
            setDocuments(values);
            setSelectedId((current) => values.some((item) => String(item.id) === current) ? current : String(values[0]?.id || ''));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudieron cargar los documentos CDE BIM.');
        }
    }, [api, empresaId, includeArchived, projectId]);

    useEffect(() => { loadDocuments(); }, [loadDocuments]);
    useEffect(() => { const onKey = (event) => event.key === 'Escape' && setUploadOpen(false); window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey); }, []);
    useEffect(() => {
        let active = true;
        if (!selectedId) { setRevisions([]); return undefined; }
        api.listCdeDocumentRevisions(projectId, Number(selectedId), empresaId)
            .then((values) => { if (active) setRevisions(values); })
            .catch((requestError) => { if (active) setError(requestError?.response?.data?.detail || 'No se pudo cargar el historial CDE BIM.'); });
        return () => { active = false; };
    }, [api, empresaId, projectId, selectedId]);
    useEffect(() => {
        let active = true;
        if (!selectedId || !api.listCdeDocumentAcl) { setAclRows([]); setCanManageAcl(false); return undefined; }
        Promise.all([api.listCdeDocumentAcl(projectId, Number(selectedId), empresaId), api.listCdeAclUsers(projectId, empresaId)])
            .then(([rows, users]) => { if (active) { setAclRows(rows); setAclUsers(users); setCanManageAcl(true); } })
            .catch((requestError) => { if (active) { setAclRows([]); setCanManageAcl(false); if (requestError?.response?.status !== 403) setError(requestError?.response?.data?.detail || 'No se pudo cargar la ACL documental BIM.'); } });
        return () => { active = false; };
    }, [api, empresaId, projectId, selectedId]);

    const selected = useMemo(() => documents.find((item) => String(item.id) === selectedId) || null, [documents, selectedId]);

    const upload = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const saved = await api.uploadCdeDocument(projectId, draft, empresaId);
            setDocuments((current) => [saved, ...current.filter((item) => item.id !== saved.id)]);
            setSelectedId(String(saved.id));
            setDraft((current) => ({ ...EMPTY_DRAFT, document_code: current.document_code, title: current.title, category: current.category, version_label: '' }));
            setRevisions(await api.listCdeDocumentRevisions(projectId, saved.id, empresaId));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo registrar la revision CDE BIM.');
        } finally { setBusy(false); }
    };

    const download = async (revision) => {
        try {
            setBusy(true); setError('');
            const blob = await api.downloadCdeRevision(projectId, revision.id, empresaId);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url; anchor.download = revision.source_filename; anchor.click();
            URL.revokeObjectURL(url);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo descargar la revision CDE BIM.');
        } finally { setBusy(false); }
    };

    const archive = async () => {
        try {
            setBusy(true); setError('');
            await api.archiveCdeDocument(projectId, selected.id, archiveReason.trim(), empresaId);
            setArchiveReason('');
            await loadDocuments();
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo archivar el documento CDE BIM.');
        } finally { setBusy(false); }
    };

    const saveAcl = async (payload = aclDraft) => {
        try {
            setBusy(true); setError('');
            const saved = await api.saveCdeDocumentAcl(projectId, selected.id, { ...payload, user_id: Number(payload.user_id) }, empresaId);
            setAclRows((current) => [saved, ...current.filter((item) => item.user_id !== saved.user_id)]);
            setAclDraft(EMPTY_ACL);
        } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo guardar la ACL documental BIM.'); }
        finally { setBusy(false); }
    };

    return <section className="border border-slate-200 bg-white" data-bim-cde-documents>
        <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2"><FileStack size={16} className="text-orange-600" /><h3 className="text-sm font-semibold text-slate-800">Documentos CDE</h3><button type="button" onClick={() => setUploadOpen(true)} className="ml-auto inline-flex h-7 items-center gap-1 bg-orange-600 px-2.5 text-[11px] font-semibold text-white"><Upload size={13}/>Nueva revisión</button><label className="flex items-center gap-1 text-[10px] text-slate-600"><input type="checkbox" checked={includeArchived} onChange={(event) => setIncludeArchived(event.target.checked)} />Archivados</label></header>
        <div className="space-y-3 p-3 text-xs">
            {false && <form className="hidden" onSubmit={upload}>
                <input className="min-w-0 border border-slate-300 px-2 py-1.5" required aria-label="Codigo documental CDE" placeholder="Codigo documental" value={draft.document_code} onChange={(event) => setDraft({ ...draft, document_code: event.target.value })} />
                <input className="min-w-0 border border-slate-300 px-2 py-1.5" required aria-label="Version documental CDE" placeholder="Version, p. ej. P01" value={draft.version_label} onChange={(event) => setDraft({ ...draft, version_label: event.target.value })} />
                <input className="col-span-2 min-w-0 border border-slate-300 px-2 py-1.5" required aria-label="Titulo documental CDE" placeholder="Titulo" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} />
                <select className="min-w-0 border border-slate-300 px-2 py-1.5" aria-label="Categoria documental CDE" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
                <label className="flex min-w-0 cursor-pointer items-center gap-1 border border-dashed border-slate-300 px-2 py-1.5 text-slate-600"><Upload size={13} /><span className="truncate">{draft.file?.name || 'Seleccionar archivo'}</span><input className="sr-only" type="file" required aria-label="Archivo documental CDE" onChange={(event) => setDraft({ ...draft, file: event.target.files?.[0] || null })} /></label>
                <input className="col-span-2 min-w-0 border border-slate-300 px-2 py-1.5" aria-label="Notas documentales CDE" placeholder="Notas de emision" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
                <button type="submit" disabled={busy || !draft.file || !draft.version_label.trim()} className="col-span-2 inline-flex h-8 items-center justify-center gap-1 bg-orange-600 font-semibold text-white disabled:opacity-40"><Upload size={14} />Registrar revision</button>
            </form>}
            <div className="border-t border-slate-200 pt-3">
                <select className="w-full border border-slate-300 px-2 py-1.5" aria-label="Documento CDE seleccionado" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}><option value="">Sin documentos</option>{documents.map((item) => <option key={item.id} value={item.id}>{item.document_code} · {item.title}{item.status === 'archived' ? ' · ARCHIVADO' : ''}</option>)}</select>
                {selected ? <div className="mt-2 flex items-center gap-2 text-[10px]"><span className="bg-slate-100 px-1.5 py-0.5 font-semibold">{CATEGORY_LABELS[selected.category] || selected.category}</span><strong className="text-slate-700">REV {String(selected.current_revision).padStart(3, '0')}</strong><span className="truncate text-slate-500">{selected.current?.checksum_sha256?.slice(0, 12)}</span></div> : null}
            </div>
            {revisions.length ? <div className="space-y-1" data-bim-cde-history><div className="flex items-center gap-1 text-slate-600"><History size={13} />Historial inmutable</div>{revisions.map((revision) => <div key={revision.id} className="flex h-9 items-center gap-2 border border-slate-200 px-2" data-bim-cde-revision={revision.status}><strong>R{revision.revision}</strong><span className="min-w-0 flex-1 truncate">{revision.version_label} · {revision.source_filename}</span><span className="text-[10px] uppercase text-slate-500">{revision.status}</span><button type="button" title="Descargar revision" aria-label={`Descargar revision ${revision.revision}`} onClick={() => download(revision)} disabled={busy} className="inline-flex h-7 w-7 items-center justify-center text-slate-600 disabled:opacity-40"><Download size={14} /></button></div>)}</div> : null}
            {selected?.status === 'active' ? <div className="grid grid-cols-[minmax(0,1fr)_92px] gap-1"><input className="min-w-0 border border-slate-300 px-2 py-1.5" aria-label="Motivo de archivo CDE" placeholder="Motivo de archivo" value={archiveReason} onChange={(event) => setArchiveReason(event.target.value)} /><button type="button" onClick={archive} disabled={busy || archiveReason.trim().length < 3} className="inline-flex h-8 items-center justify-center gap-1 border border-slate-300 font-semibold text-slate-700 disabled:opacity-40"><Archive size={13} />Archivar</button></div> : null}
            {selected && canManageAcl ? <div className="space-y-2 border-t border-slate-200 pt-3" data-bim-cde-acl>
                <div className="flex items-center gap-1 font-semibold text-slate-700"><LockKeyhole size={13} className="text-orange-600" />Acceso documental</div>
                <div className="grid grid-cols-[minmax(130px,1fr)_repeat(4,68px)_32px] items-center gap-1">
                    <select className="h-8 min-w-0 border border-slate-300 px-2" aria-label="Usuario ACL CDE" value={aclDraft.user_id} onChange={(event) => setAclDraft({ ...aclDraft, user_id: event.target.value })}><option value="">Usuario</option>{aclUsers.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
                    {[['can_view', 'Ver'], ['can_download', 'Descargar'], ['can_revise', 'Revisar'], ['can_manage', 'Gestionar']].map(([key, label]) => <label key={key} className="flex h-8 items-center justify-center gap-1 border border-slate-200 text-[10px]"><input type="checkbox" aria-label={`${label} ACL CDE`} checked={aclDraft[key]} onChange={(event) => setAclDraft({ ...aclDraft, [key]: event.target.checked })} />{label}</label>)}
                    <button type="button" title="Guardar acceso" aria-label="Guardar ACL CDE" onClick={() => saveAcl()} disabled={busy || !aclDraft.user_id} className="inline-flex h-8 items-center justify-center bg-orange-600 text-white disabled:opacity-40"><Save size={13} /></button>
                </div>
                <div className="space-y-1" data-bim-cde-acl-list>{aclRows.map((item) => <div key={item.id} className="flex h-8 items-center gap-2 border border-slate-200 px-2"><span className="min-w-0 flex-1 truncate font-medium">{item.user_name}</span><span className="text-[10px] text-slate-500">{[item.can_view && 'ver', item.can_download && 'descargar', item.can_revise && 'revisar', item.can_manage && 'gestionar'].filter(Boolean).join(' · ')}</span><button type="button" onClick={() => saveAcl({ ...item, active: !item.active })} disabled={busy} className={`h-6 border px-2 text-[10px] font-semibold ${item.active ? 'border-rose-200 text-rose-700' : 'border-emerald-200 text-emerald-700'}`}>{item.active ? 'Revocar' : 'Activar'}</button></div>)}</div>
            </div> : null}
            <p className="text-[10px] text-slate-500">Repositorio BIM aislado. No modifica Documentos de Proyecto clasico.</p>
            {error ? <p role="alert" className="text-rose-700">{error}</p> : null}
        </div>
        {uploadOpen ? <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/35 p-6"><form className="w-full max-w-xl overflow-hidden rounded-xl bg-white shadow-2xl" onSubmit={(event) => { upload(event); setUploadOpen(false); }} role="dialog" aria-modal="true" aria-labelledby="cde-upload-title"><header className="flex min-h-12 items-center border-b border-slate-200 px-5"><div><h3 id="cde-upload-title" className="text-sm font-semibold text-slate-900">Nueva revisión documental</h3><p className="text-[11px] text-slate-500">Incorpora una revisión al repositorio CDE BIM.</p></div><button type="button" onClick={() => setUploadOpen(false)} aria-label="Cerrar nueva revisión" className="ml-auto inline-flex size-8 items-center justify-center text-slate-500"><X size={16}/></button></header><div className="grid grid-cols-2 gap-3 p-5"><input autoFocus className="h-9 border border-slate-300 px-3 text-xs" required aria-label="Codigo documental CDE" placeholder="Código documental" value={draft.document_code} onChange={(event) => setDraft({ ...draft, document_code: event.target.value })}/><input className="h-9 border border-slate-300 px-3 text-xs" required aria-label="Version documental CDE" placeholder="Versión P01" value={draft.version_label} onChange={(event) => setDraft({ ...draft, version_label: event.target.value })}/><input className="col-span-2 h-9 border border-slate-300 px-3 text-xs" required aria-label="Titulo documental CDE" placeholder="Título" value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })}/><select className="h-9 border border-slate-300 px-2 text-xs" aria-label="Categoria documental CDE" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })}>{Object.entries(CATEGORY_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select><label className="flex h-9 cursor-pointer items-center gap-2 border border-dashed border-slate-300 px-3 text-xs text-slate-600"><Upload size={13}/><span className="truncate">{draft.file?.name || 'Seleccionar archivo'}</span><input className="sr-only" type="file" required aria-label="Archivo documental CDE" onChange={(event) => setDraft({ ...draft, file: event.target.files?.[0] || null })}/></label><input className="col-span-2 h-9 border border-slate-300 px-3 text-xs" aria-label="Notas documentales CDE" placeholder="Notas de emisión" value={draft.notes} onChange={(event) => setDraft({ ...draft, notes: event.target.value })}/></div><footer className="flex min-h-12 items-center justify-end gap-2 border-t border-slate-200 px-5"><button type="button" onClick={() => setUploadOpen(false)} className="h-8 px-3 text-xs">Cancelar</button><button type="submit" disabled={busy || !draft.file || !draft.version_label.trim()} className="h-8 bg-orange-600 px-4 text-xs font-semibold text-white disabled:opacity-40">Registrar revisión</button></footer></form></div> : null}
    </section>;
}
