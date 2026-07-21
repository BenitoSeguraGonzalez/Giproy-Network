import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Check, Download, FileClock, RotateCcw, Upload, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const FORMAT_OPTIONS = [
    { id: 'mspdi', label: 'MS Project XML', extension: '.xml' },
    { id: 'p6', label: 'Primavera P6 XML', extension: '.xml' },
    { id: 'p6-xer', label: 'Primavera P6 XER', extension: '.xer' },
];

const statusClass = {
    approved: 'bg-emerald-50 text-emerald-700',
    pending: 'bg-amber-50 text-amber-700',
    rejected: 'bg-rose-50 text-rose-700',
    rolled_back: 'bg-slate-100 text-slate-600',
    superseded: 'bg-slate-100 text-slate-600',
};

export default function BimScheduleInterchangePanel({ projectId, empresaId, api = bimModelsApi }) {
    const [format, setFormat] = useState('mspdi');
    const [file, setFile] = useState(null);
    const [timezone, setTimezone] = useState('America/Bogota');
    const [currency, setCurrency] = useState('USD');
    const [preview, setPreview] = useState(null);
    const [revisions, setRevisions] = useState([]);
    const [reason, setReason] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState('');

    const loadRevisions = useCallback(async () => {
        if (!projectId) return;
        try {
            setRevisions(await api.listScheduleImportRevisions(projectId, empresaId));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudieron cargar las revisiones de planificacion BIM.');
        }
    }, [api, empresaId, projectId]);

    useEffect(() => { loadRevisions(); }, [loadRevisions]);

    const runPreview = async () => {
        try {
            setBusy(true); setError(''); setPreview(null);
            setPreview(await api.previewScheduleInterchange(projectId, format, { file, timezone_name: timezone, currency }, empresaId));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo analizar el archivo de planificacion.');
        } finally { setBusy(false); }
    };

    const saveRevision = async () => {
        try {
            setBusy(true); setError('');
            const created = await api.createScheduleImportRevision(projectId, preview.document, empresaId);
            setRevisions((current) => [created, ...current]);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo guardar la revision BIM.');
        } finally { setBusy(false); }
    };

    const decide = async (revision, decision) => {
        try {
            setBusy(true); setError('');
            const updated = await api.decideScheduleImportRevision(projectId, revision.id, { decision, reason: reason.trim(), expected_version: revision.version }, empresaId);
            setRevisions((current) => current.map((item) => item.id === updated.id ? updated : decision === 'approved' && item.status === 'approved' ? { ...item, status: 'superseded' } : item));
            setReason('');
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo decidir la revision BIM.');
        } finally { setBusy(false); }
    };

    const rollback = async (revision) => {
        try {
            setBusy(true); setError('');
            const updated = await api.rollbackScheduleImportRevision(projectId, revision.id, { reason: reason.trim(), expected_version: revision.version }, empresaId);
            setRevisions((current) => current.map((item) => item.id === updated.id ? updated : item));
            setReason('');
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo revertir la revision BIM.');
        } finally { setBusy(false); }
    };

    const exportPreview = async () => {
        try {
            setBusy(true); setError('');
            const blob = await api.exportScheduleInterchange(projectId, format, preview.document, empresaId);
            const url = URL.createObjectURL(blob);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = format === 'p6-xer' ? 'giproy-bim-schedule-p6.xer' : format === 'p6' ? 'giproy-bim-schedule-p6.xml' : 'giproy-bim-schedule.xml';
            anchor.click();
            URL.revokeObjectURL(url);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo exportar el cronograma BIM.');
        } finally { setBusy(false); }
    };

    const counts = preview?.preflight?.counts || {};
    const issues = [...(preview?.preflight?.errors || []), ...(preview?.preflight?.warnings || [])];
    const selectedFormat = FORMAT_OPTIONS.find((option) => option.id === format) || FORMAT_OPTIONS[0];

    return (
        <section className="border border-slate-200 bg-white" data-bim-schedule-interchange>
            <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
                <FileClock size={16} className="text-orange-600" />
                <h3 className="text-sm font-semibold text-slate-800">Intercambio de planificacion</h3>
            </header>
            <div className="space-y-3 p-3 text-xs">
                <div className="grid grid-cols-3 border border-slate-200" aria-label="Formato de intercambio">
                    {FORMAT_OPTIONS.map((option) => <button key={option.id} type="button" onClick={() => { setFormat(option.id); setFile(null); setPreview(null); }} className={`h-8 font-medium ${format === option.id ? 'bg-slate-800 text-white' : 'bg-white text-slate-600'}`}>{option.label}</button>)}
                </div>
                <label className="flex h-9 cursor-pointer items-center gap-2 border border-dashed border-slate-300 px-2 text-slate-600">
                    <Upload size={14} /><span className="min-w-0 flex-1 truncate">{file?.name || `Seleccionar archivo ${selectedFormat.extension}`}</span>
                    <input className="sr-only" type="file" accept={selectedFormat.extension} aria-label="Archivo de planificacion" onChange={(event) => { setFile(event.target.files?.[0] || null); setPreview(null); }} />
                </label>
                <div className="grid grid-cols-[minmax(0,1fr)_72px] gap-2">
                    <input className="min-w-0 border border-slate-300 px-2 py-1.5" aria-label="Zona horaria del cronograma" value={timezone} onChange={(event) => setTimezone(event.target.value)} />
                    <input className="min-w-0 border border-slate-300 px-2 py-1.5 uppercase" aria-label="Moneda del cronograma" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} />
                </div>
                <button type="button" onClick={runPreview} disabled={busy || !file || !timezone.trim() || currency.length !== 3} className="inline-flex h-8 w-full items-center justify-center gap-1 bg-orange-600 font-semibold text-white disabled:opacity-40"><Upload size={14} />Analizar archivo</button>

                {preview ? <div className="space-y-2 border-t border-slate-200 pt-3" data-bim-schedule-preview={preview.preflight.valid ? 'valid' : 'invalid'}>
                    <div className="flex items-center justify-between"><strong className="text-slate-800">{preview.document.project_name}</strong><span className={`px-1.5 py-0.5 font-semibold ${preview.preflight.valid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>{preview.preflight.valid ? 'VALIDO' : 'CON ERRORES'}</span></div>
                    <div className="grid grid-cols-4 gap-1 text-center text-[10px]">
                        <span><strong className="block text-sm">{counts.activities || 0}</strong>actividades</span><span><strong className="block text-sm">{counts.dependencies || 0}</strong>relaciones</span><span><strong className="block text-sm">{counts.resources || 0}</strong>recursos</span><span><strong className="block text-sm">{issues.length}</strong>avisos</span>
                    </div>
                    {issues.length ? <div className="max-h-24 space-y-1 overflow-y-auto border border-amber-200 bg-amber-50 p-2" data-bim-schedule-issues>{issues.map((issue, index) => <p key={`${issue.code}-${index}`} className="flex gap-1 text-[10px] text-amber-800"><AlertTriangle size={12} className="shrink-0" />{issue.message}</p>)}</div> : null}
                    <div className="grid grid-cols-2 gap-1"><button type="button" onClick={saveRevision} disabled={busy || !preview.preflight.valid} className="inline-flex h-8 items-center justify-center gap-1 bg-slate-800 font-semibold text-white disabled:opacity-40"><FileClock size={13} />Guardar revision BIM</button><button type="button" onClick={exportPreview} disabled={busy || !preview.preflight.valid} className="inline-flex h-8 items-center justify-center gap-1 border border-slate-300 font-semibold text-slate-700 disabled:opacity-40"><Download size={13} />Exportar {selectedFormat.extension}</button></div>
                </div> : null}

                {revisions.length ? <div className="space-y-2 border-t border-slate-200 pt-3" data-bim-schedule-revisions>
                    <input className="w-full border border-slate-300 px-2 py-1.5" aria-label="Motivo de decision de planificacion" placeholder="Motivo de decision o rollback" value={reason} onChange={(event) => setReason(event.target.value)} />
                    {revisions.map((revision) => <div key={revision.id} className="border border-slate-200 p-2" data-bim-schedule-revision={revision.status}>
                        <div className="flex items-center gap-2"><strong>REV {String(revision.revision).padStart(3, '0')}</strong><span className="min-w-0 flex-1 truncate text-slate-500">{revision.source_filename}</span><span className={`px-1.5 py-0.5 text-[10px] uppercase ${statusClass[revision.status] || statusClass.pending}`}>{revision.status}</span></div>
                        {revision.status === 'pending' ? <div className="mt-2 grid grid-cols-2 gap-1"><button type="button" onClick={() => decide(revision, 'approved')} disabled={busy || reason.trim().length < 3} className="inline-flex h-7 items-center justify-center gap-1 bg-emerald-700 font-semibold text-white disabled:opacity-40"><Check size={12} />Aprobar</button><button type="button" onClick={() => decide(revision, 'rejected')} disabled={busy || reason.trim().length < 3} className="inline-flex h-7 items-center justify-center gap-1 border border-rose-200 font-semibold text-rose-700 disabled:opacity-40"><X size={12} />Rechazar</button></div> : null}
                        {revision.status === 'approved' ? <button type="button" onClick={() => rollback(revision)} disabled={busy || reason.trim().length < 3} className="mt-2 inline-flex h-7 w-full items-center justify-center gap-1 border border-slate-300 font-semibold text-slate-700 disabled:opacity-40"><RotateCcw size={12} />Rollback BIM</button> : null}
                    </div>)}
                </div> : null}
                <p className="text-[10px] text-slate-500">Las revisiones se conservan en BIM y no modifican el cronograma clasico.</p>
                {error ? <p role="alert" className="text-xs text-rose-700">{error}</p> : null}
            </div>
        </section>
    );
}
