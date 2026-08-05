import { useCallback, useEffect, useMemo, useState } from 'react';
import { Check, PackageCheck, RefreshCw, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';


const STATUS_LABELS = { submitted: 'En revisión', accepted: 'Aceptada', rejected: 'Rechazada', superseded: 'Sustituida' };

export default function BimAsBuiltAcceptancePanel({ projectId, empresaId, models = [], activeVersionId, api = bimModelsApi }) {
    const versions = useMemo(() => models.flatMap((model) => (model.versions || []).map((version) => ({ ...version, modelName: model.nombre || model.name || 'Modelo BIM' }))).filter((version) => version.status === 'ready'), [models]);
    const [items, setItems] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [form, setForm] = useState({ version_id: activeVersionId || '', revision: 'ASB-01', criteria: 'Geometría y propiedades verificadas\nCoordenadas y niveles confirmados', declaration_notes: '' });
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');
    const [createOpen, setCreateOpen] = useState(false);

    useEffect(() => { if (activeVersionId) setForm((current) => ({ ...current, version_id: current.version_id || activeVersionId })); }, [activeVersionId]);
    const load = useCallback(async () => {
        if (!projectId) return;
        try {
            setError('');
            const rows = await api.listAsBuiltAcceptances(projectId, empresaId);
            setItems(rows);
            setSelectedId((current) => current || rows[0]?.id || null);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudieron cargar las entregas as-built.');
        }
    }, [api, empresaId, projectId]);
    useEffect(() => { load(); }, [load]);
    useEffect(() => { if (!createOpen) return undefined; const close = (event) => { if (event.key === 'Escape') setCreateOpen(false); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [createOpen]);

    const selected = items.find((item) => item.id === selectedId) || items[0];
    const create = async (event) => {
        event.preventDefault();
        try {
            setBusy(true); setError('');
            const value = await api.createAsBuiltAcceptance(projectId, {
                version_id: Number(form.version_id),
                revision: form.revision,
                acceptance_criteria: form.criteria.split('\n').map((item) => item.trim()).filter(Boolean),
                declaration_notes: form.declaration_notes,
            }, empresaId);
            setItems((current) => [value, ...current]);
            setSelectedId(value.id);
            setForm((current) => ({ ...current, revision: `ASB-${String(items.length + 2).padStart(2, '0')}`, declaration_notes: '' }));
            setCreateOpen(false);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo presentar la entrega as-built.');
        } finally { setBusy(false); }
    };
    const decide = async (decision) => {
        try {
            setBusy(true); setError('');
            const value = await api.decideAsBuiltAcceptance(projectId, selected.id, { decision, reason, expected_lock_version: selected.lock_version }, empresaId);
            setItems((current) => current.map((item) => item.id === value.id ? value : decision === 'accepted' && item.status === 'accepted' ? { ...item, status: 'superseded' } : item));
            setReason('');
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo decidir la entrega as-built.');
        } finally { setBusy(false); }
    };

    return (
        <section className="flex h-full min-h-0 flex-col overflow-hidden border border-zinc-200 bg-white" data-bim-as-built-acceptance>
            <header className="flex h-12 shrink-0 items-center justify-between border-b border-zinc-200 px-3">
                <div className="flex min-w-0 items-center gap-2"><PackageCheck size={16} className="shrink-0 text-[#F39200]" /><div className="min-w-0"><h3 className="truncate text-xs font-semibold">Aceptación as-built</h3><p className="truncate text-[10px] text-zinc-500">Versión IFC inmutable · calidad y decisión auditables</p></div></div>
                <div className="flex items-center gap-2"><button type="button" onClick={() => setCreateOpen(true)} disabled={busy || !versions.length} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-orange-600 px-3 text-[10px] font-semibold text-white disabled:opacity-40"><PackageCheck size={13} />Nueva aceptación</button><button type="button" onClick={load} disabled={busy} aria-label="Actualizar entregas as-built" title="Actualizar" className="grid h-8 w-8 place-items-center border border-zinc-200 text-zinc-600 disabled:opacity-40"><RefreshCw size={14} className={busy ? 'animate-spin' : ''} /></button></div>
            </header>
            <div className="relative flex min-h-0 flex-1">
                <form onSubmit={create} className={`${createOpen ? 'absolute inset-0 z-30 m-6 grid content-start gap-2 overflow-y-auto rounded-xl border border-zinc-200 bg-white p-5 shadow-2xl' : 'hidden'}`} role={createOpen ? 'dialog' : undefined} aria-modal={createOpen ? 'true' : undefined}>
                    <div className="mb-2 flex items-center justify-between border-b border-zinc-200 pb-3"><div><h4 className="text-sm font-semibold text-zinc-950">Nueva aceptación as-built</h4><p className="text-[11px] text-zinc-600">Presenta una versión IFC lista para revisión.</p></div><button type="button" onClick={() => setCreateOpen(false)} aria-label="Cerrar nueva aceptación" className="inline-flex size-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100"><X size={15} /></button></div>
                    <select required aria-label="Versión as-built" value={form.version_id} onChange={(event) => setForm({ ...form, version_id: event.target.value })} className="h-9 min-w-0 border border-zinc-300 px-2 text-xs"><option value="">Versión BIM lista</option>{versions.map((version) => <option key={version.id} value={version.id}>{version.modelName} · {version.version_label || version.label}</option>)}</select>
                    <input required aria-label="Revisión de entrega as-built" value={form.revision} onChange={(event) => setForm({ ...form, revision: event.target.value })} className="h-9 border border-zinc-300 px-2 text-xs" />
                    <textarea required aria-label="Criterios de aceptación as-built" value={form.criteria} onChange={(event) => setForm({ ...form, criteria: event.target.value })} className="h-24 resize-none border border-zinc-300 p-2 text-xs" />
                    <textarea required minLength={5} aria-label="Declaración as-built" placeholder="Alcance, comprobaciones y excepciones declaradas" value={form.declaration_notes} onChange={(event) => setForm({ ...form, declaration_notes: event.target.value })} className="h-28 resize-none border border-zinc-300 p-2 text-xs" />
                    <button disabled={busy || !versions.length} className="h-9 bg-zinc-800 text-xs font-semibold text-white disabled:opacity-40">Presentar para aceptación</button>
                    {error ? <p role="alert" className="text-xs text-red-700">{error}</p> : null}
                </form>
                <main className="flex min-w-0 flex-1 flex-col overflow-hidden" data-bim-as-built-ledger>
                    <div className="min-h-0 flex-1 overflow-y-auto">
                        {!items.length ? <p className="p-8 text-center text-xs text-zinc-500">Sin entregas as-built presentadas.</p> : items.map((item) => <button type="button" key={item.id} onClick={() => setSelectedId(item.id)} className={`grid w-full grid-cols-[110px_130px_minmax(180px,1fr)_120px] gap-3 border-b px-4 py-3 text-left text-xs ${selected?.id === item.id ? 'bg-orange-50' : 'hover:bg-zinc-50'}`}><span><strong className="block">{item.revision}</strong><small className="uppercase text-zinc-500">{STATUS_LABELS[item.status]}</small></span><span><small className="block text-zinc-500">Versión</small><strong>{item.version_label}</strong></span><span className="min-w-0"><small className="block text-zinc-500">Checksum IFC</small><code className="block truncate text-[10px]">{item.source_checksum_sha256}</code></span><span><small className="block text-zinc-500">Calidad</small><strong className={item.quality_status === 'passed' ? 'text-emerald-700' : 'text-amber-700'}>{item.quality_status}</strong></span></button>)}
                    </div>
                    {selected ? <aside className="shrink-0 border-t border-zinc-200 bg-zinc-50 p-3"><div className="grid grid-cols-2 gap-4 text-xs"><div><strong className="block text-zinc-700">Declaración</strong><p className="mt-1 text-zinc-600">{selected.declaration_notes}</p></div><div><strong className="block text-zinc-700">Criterios</strong><ul className="mt-1 list-inside list-disc text-zinc-600">{selected.acceptance_criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}</ul></div></div></aside> : null}
                    {selected?.status === 'submitted' ? <div className="grid shrink-0 grid-cols-[minmax(0,1fr)_110px_110px] gap-2 border-t border-zinc-200 p-3"><input aria-label="Motivo de decisión as-built" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo verificable de la decisión" className="h-9 min-w-0 border border-zinc-300 px-2 text-xs" /><button type="button" onClick={() => decide('accepted')} disabled={busy || reason.length < 5} className="flex items-center justify-center gap-1 bg-emerald-700 text-xs font-semibold text-white disabled:opacity-40"><Check size={13} />Aceptar</button><button type="button" onClick={() => decide('rejected')} disabled={busy || reason.length < 5} className="flex items-center justify-center gap-1 border border-zinc-300 text-xs font-semibold text-red-700 disabled:opacity-40"><X size={13} />Rechazar</button></div> : null}
                </main>
            </div>
        </section>
    );
}
