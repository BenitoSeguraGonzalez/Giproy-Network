import React, { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, FileUp, LoaderCircle, RefreshCw, RotateCcw, X } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const TERMINAL_STATUSES = new Set(['succeeded', 'failed', 'cancelled']);
const STATUS_LABELS = {
    queued: 'En cola',
    running: 'Procesando',
    succeeded: 'Lista para revisión',
    failed: 'Fallida',
    cancelled: 'Cancelada',
};

const FIELD_CLASS =
    'h-9 min-w-0 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-800 outline-none transition-colors hover:border-orange-300 focus-visible:border-[#F39200] focus-visible:ring-2 focus-visible:ring-orange-100';
const ICON_BUTTON_CLASS =
    'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-500 transition-colors hover:border-[#F39200] hover:text-[#F39200] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-100 disabled:cursor-not-allowed disabled:opacity-40';

const statusIcon = (status) => {
    if (status === 'succeeded') return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    if (status === 'failed') return <AlertCircle className="h-4 w-4 text-rose-600" />;
    if (status === 'running' || status === 'queued') {
        return <LoaderCircle className="h-4 w-4 animate-spin text-[#F39200] motion-reduce:animate-none" />;
    }
    return <X className="h-4 w-4 text-zinc-400" />;
};

const BimImportJobsPanel = ({ projectId, empresaId, onImportReady }) => {
    const [jobs, setJobs] = useState([]);
    const [modelName, setModelName] = useState('');
    const [versionLabel, setVersionLabel] = useState('');
    const [discipline, setDiscipline] = useState('');
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [refreshToken, setRefreshToken] = useState(0);
    const [createOpen, setCreateOpen] = useState(false);
    const [qualityReport, setQualityReport] = useState(null);
    const [qualityLoading, setQualityLoading] = useState(false);
    const completedJobIdsRef = useRef(new Set());
    const fileInputRef = useRef(null);
    const onImportReadyRef = useRef(onImportReady);

    useEffect(() => {
        if (!createOpen) return undefined;
        const onKeyDown = (event) => event.key === 'Escape' && setCreateOpen(false);
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [createOpen]);

    useEffect(() => {
        onImportReadyRef.current = onImportReady;
    }, [onImportReady]);

    useEffect(() => {
        if (!projectId) return undefined;
        let cancelled = false;
        let timeoutId = null;

        const loadJobs = async () => {
            try {
                const response = await bimModelsApi.listImportJobs(projectId, empresaId);
                if (cancelled) return;
                const nextJobs = Array.isArray(response) ? response : [];
                setJobs(nextJobs);
                setMessage('');
                nextJobs.forEach((job) => {
                    if (job.status === 'succeeded' && !completedJobIdsRef.current.has(job.id)) {
                        completedJobIdsRef.current.add(job.id);
                        onImportReadyRef.current?.(job);
                    }
                });
                if (nextJobs.some((job) => !TERMINAL_STATUSES.has(job.status))) {
                    timeoutId = window.setTimeout(loadJobs, 1500);
                }
            } catch (error) {
                if (!cancelled) {
                    setMessage(error?.response?.data?.detail || 'No se pudieron consultar las importaciones IFC.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        setLoading(true);
        loadJobs();
        return () => {
            cancelled = true;
            if (timeoutId) window.clearTimeout(timeoutId);
        };
    }, [empresaId, projectId, refreshToken]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!file || !modelName.trim() || !versionLabel.trim()) {
            setMessage('Completa modelo, versión y archivo IFC.');
            return false;
        }
        if (!file.name.toLowerCase().endsWith('.ifc')) {
            setMessage('Selecciona un archivo con extensión .ifc.');
            return false;
        }

        try {
            setSubmitting(true);
            setMessage('');
            await bimModelsApi.createIfcImportJob(
                projectId,
                {
                    model_name: modelName.trim(),
                    version_label: versionLabel.trim(),
                    discipline: discipline.trim() || null,
                    file,
                },
                empresaId,
            );
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            setRefreshToken((value) => value + 1);
            return true;
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo iniciar la importación IFC.');
            return false;
        } finally {
            setSubmitting(false);
        }
    };

    const runJobAction = async (action, jobId) => {
        try {
            setMessage('');
            await action(projectId, jobId, empresaId);
            setRefreshToken((value) => value + 1);
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo actualizar el job IFC.');
        }
    };

    const loadQualityReport = async (job) => {
        if (!job.version_id) { setMessage('La importación aún no tiene una versión revisable.'); return; }
        try { setQualityLoading(true); setMessage(''); const report = await bimModelsApi.getIfcQualityReport(projectId, job.version_id, empresaId); setQualityReport(report); } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo cargar el informe de calidad IFC.'); } finally { setQualityLoading(false); }
    };

    return (
        <section className="rounded-lg border border-zinc-200 bg-white" data-bim-import-jobs>
            <div className="flex min-h-12 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                    <FileUp className="h-4 w-4 shrink-0 text-[#F39200]" />
                    <div className="min-w-0">
                        <h3 className="truncate text-sm font-black text-zinc-900">Cargar modelo IFC</h3>
                        <p className="truncate text-[10px] text-zinc-500">Registra una versión del modelo en el proyecto activo y sigue su procesamiento.</p>
                    </div>
                </div>
                <button
                    type="button"
                    className={ICON_BUTTON_CLASS}
                    onClick={() => setRefreshToken((value) => value + 1)}
                    title="Actualizar importaciones IFC"
                    aria-label="Actualizar importaciones IFC"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} />
                </button>
                <button type="button" onClick={() => setCreateOpen(true)} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-[#F39200] px-3 text-[10px] font-black uppercase tracking-[0.12em] text-white"><FileUp className="h-3.5 w-3.5" /> Nueva carga</button>
            </div>

            {createOpen ? <div className="fixed inset-0 z-[80] grid place-items-center bg-zinc-950/45 p-6" onMouseDown={(event) => event.target === event.currentTarget && setCreateOpen(false)}><form role="dialog" aria-modal="true" aria-labelledby="bim-import-title" onSubmit={async (event) => { const created = await handleSubmit(event); if (created) setCreateOpen(false); }} className="grid w-full max-w-2xl gap-3 rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl sm:grid-cols-2">
                <h4 id="bim-import-title" className="col-span-full text-sm font-black text-zinc-900">Nueva carga IFC</h4>
                <label className="grid gap-1 text-[10px] font-bold text-zinc-600">
                    Modelo
                    <input value={modelName} onChange={(event) => setModelName(event.target.value)} className={FIELD_CLASS} maxLength={255} placeholder="Ej. Arquitectura" />
                </label>
                <label className="grid gap-1 text-[10px] font-bold text-zinc-600">
                    Versión
                    <input value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} className={FIELD_CLASS} maxLength={50} placeholder="Ej. R01" />
                </label>
                <label className="grid gap-1 text-[10px] font-bold text-zinc-600">
                    Disciplina
                    <input value={discipline} onChange={(event) => setDiscipline(event.target.value)} className={FIELD_CLASS} maxLength={100} placeholder="Opcional" />
                </label>
                <div className="flex items-end gap-2 sm:col-span-2 xl:col-span-1">
                    <label className="inline-flex h-9 min-w-0 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-zinc-300 px-3 text-xs font-semibold text-zinc-600 hover:border-[#F39200] hover:text-[#F39200]" title="Seleccionar archivo IFC">
                        <FileUp className="h-4 w-4 shrink-0" />
                        <span className="truncate">{file?.name || 'Archivo IFC'}</span>
                        <input ref={fileInputRef} type="file" accept=".ifc" className="sr-only" onChange={(event) => setFile(event.target.files?.[0] || null)} />
                    </label>
                    <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-[#F39200] px-3 text-xs font-black text-white transition-colors hover:bg-[#d87f00] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? <LoaderCircle className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <FileUp className="h-4 w-4" />}
                        Cargar y procesar
                    </button>
                </div>
                <button type="button" onClick={() => setCreateOpen(false)} className="h-9 rounded-lg border border-zinc-200 text-xs font-semibold text-zinc-600">Cancelar</button>
            </form></div> : null}

            {message ? <p className="border-t border-zinc-100 px-4 py-2 text-xs font-semibold text-rose-700" role="alert">{message}</p> : null}

            {jobs.length > 0 ? (
                <div className="max-h-64 overflow-y-auto border-t border-zinc-200" aria-live="polite">
                    {jobs.slice(0, 10).map((job) => (
                        <div key={job.id} className="grid min-h-14 grid-cols-[minmax(0,1fr)_100px_auto] items-center gap-3 border-b border-zinc-100 px-4 py-2 last:border-b-0">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    {statusIcon(job.status)}
                                    <p className="truncate text-xs font-black text-zinc-800">{job.model_name} · {job.version_label}</p>
                                </div>
                                <p className="mt-1 truncate pl-6 text-[10px] text-zinc-500" title={job.error_message || job.source_filename}>
                                    {job.error_message || job.source_filename}
                                </p>
                            </div>
                            <div className="min-w-0">
                                <div className="mb-1 flex items-center justify-between text-[9px] font-bold text-zinc-500">
                                    <span>{STATUS_LABELS[job.status] || job.status}</span>
                                    <span>{job.progress}%</span>
                                </div>
                                <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100">
                                    <div className={`h-full rounded-full ${job.status === 'failed' ? 'bg-rose-500' : job.status === 'succeeded' ? 'bg-emerald-500' : 'bg-[#F39200]'}`} style={{ width: `${Math.max(0, Math.min(100, job.progress || 0))}%` }} />
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {!TERMINAL_STATUSES.has(job.status) ? (
                                    <button type="button" className={ICON_BUTTON_CLASS} onClick={() => runJobAction(bimModelsApi.cancelImportJob, job.id)} title="Cancelar importación" aria-label={`Cancelar importación ${job.model_name}`}>
                                        <X className="h-4 w-4" />
                                    </button>
                                ) : null}
                                {job.status === 'failed' && job.attempt_count < job.max_attempts ? (
                                    <button type="button" className={ICON_BUTTON_CLASS} onClick={() => runJobAction(bimModelsApi.retryImportJob, job.id)} title="Reintentar importación" aria-label={`Reintentar importación ${job.model_name}`}>
                                        <RotateCcw className="h-4 w-4" />
                                    </button>
                                ) : null}
                                {job.status === 'succeeded' && job.version_id ? <button type="button" className={ICON_BUTTON_CLASS} onClick={() => loadQualityReport(job)} title="Ver informe de calidad IFC" aria-label={`Ver informe de calidad ${job.model_name}`} disabled={qualityLoading}>{qualityLoading ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}</button> : null}
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
            {qualityReport ? <div className="border-t border-zinc-200 bg-zinc-50 px-4 py-3" data-bim-ifc-quality-report><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-semibold text-zinc-900">Informe de calidad IFC</p><p className="text-[10px] text-zinc-600">Resultado previo a aceptar la versión en el modelo.</p></div><button type="button" onClick={() => setQualityReport(null)} className="text-xs font-semibold text-zinc-500">Cerrar</button></div><div className="mt-2 grid gap-2 text-[10px] sm:grid-cols-4"><span>Estado <strong>{qualityReport.status || 'N/D'}</strong></span><span>GUID inválidos <strong>{qualityReport.invalid_guid_count ?? 0}</strong></span><span>Duplicados <strong>{qualityReport.duplicate_guid_count ?? 0}</strong></span><span>Sin clasificación <strong>{qualityReport.unclassified_count ?? 0}</strong></span></div></div> : null}
        </section>
    );
};

export default BimImportJobsPanel;
