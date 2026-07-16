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
    const completedJobIdsRef = useRef(new Set());
    const fileInputRef = useRef(null);
    const onImportReadyRef = useRef(onImportReady);

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
            return;
        }
        if (!file.name.toLowerCase().endsWith('.ifc')) {
            setMessage('Selecciona un archivo con extensión .ifc.');
            return;
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
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo iniciar la importación IFC.');
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

    return (
        <section className="rounded-lg border border-zinc-200 bg-white" data-bim-import-jobs>
            <div className="flex min-h-12 items-center justify-between gap-3 border-b border-zinc-200 px-4 py-2.5">
                <div className="flex min-w-0 items-center gap-2">
                    <FileUp className="h-4 w-4 shrink-0 text-[#F39200]" />
                    <h3 className="truncate text-sm font-black text-zinc-900">Importaciones IFC</h3>
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
            </div>

            <form onSubmit={handleSubmit} className="grid gap-2 p-3 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_110px_minmax(0,1fr)_auto]">
                <label className="grid gap-1 text-[10px] font-bold text-zinc-600">
                    Modelo
                    <input value={modelName} onChange={(event) => setModelName(event.target.value)} className={FIELD_CLASS} maxLength={255} />
                </label>
                <label className="grid gap-1 text-[10px] font-bold text-zinc-600">
                    Versión
                    <input value={versionLabel} onChange={(event) => setVersionLabel(event.target.value)} className={FIELD_CLASS} maxLength={50} />
                </label>
                <label className="grid gap-1 text-[10px] font-bold text-zinc-600">
                    Disciplina
                    <input value={discipline} onChange={(event) => setDiscipline(event.target.value)} className={FIELD_CLASS} maxLength={100} />
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
                        Importar
                    </button>
                </div>
            </form>

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
                            </div>
                        </div>
                    ))}
                </div>
            ) : null}
        </section>
    );
};

export default BimImportJobsPanel;
