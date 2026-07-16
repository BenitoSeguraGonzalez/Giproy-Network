import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, FileCheck2, RefreshCw, ShieldAlert } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const DOMAIN_LABELS = { step: 'STEP', schema: 'Schema', semantic: 'Semántica' };
const STATUS_LABELS = {
    valid: 'Válido',
    invalid: 'Inválido',
    supported: 'Soportado',
    partially_supported: 'Parcial',
    unknown: 'Desconocido',
    passed: 'Conforme',
    warnings: 'Advertencias',
    failed: 'Fallido',
};

const statusClass = (status) => {
    if (['valid', 'supported', 'passed'].includes(status)) return 'bg-emerald-50 text-emerald-700';
    if (['invalid', 'failed', 'unknown'].includes(status)) return 'bg-rose-50 text-rose-700';
    return 'bg-amber-50 text-amber-800';
};

const BimQualityReportPanel = ({ projectId, versionId, empresaId, canGenerate }) => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [reloadToken, setReloadToken] = useState(0);

    useEffect(() => {
        if (!projectId || !versionId) {
            setReport(null);
            setMessage('');
            return undefined;
        }
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                setMessage('');
                const response = await bimModelsApi.getIfcQualityReport(projectId, versionId, empresaId);
                if (!cancelled) setReport(response);
            } catch (error) {
                if (!cancelled) {
                    setReport(null);
                    if (error?.response?.status !== 404) {
                        setMessage(error?.response?.data?.detail || 'No se pudo consultar la calidad IFC.');
                    }
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [empresaId, projectId, reloadToken, versionId]);

    const generate = async () => {
        try {
            setLoading(true);
            setMessage('');
            const response = await bimModelsApi.generateIfcQualityReport(projectId, versionId, empresaId);
            setReport(response);
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo generar el reporte IFC.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="rounded-lg border border-zinc-200 bg-white" data-bim-ifc-quality-report>
            <div className="flex min-h-11 items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2">
                <div className="flex min-w-0 items-center gap-2">
                    <FileCheck2 className="h-4 w-4 shrink-0 text-[#F39200]" />
                    <h3 className="truncate text-xs font-black text-zinc-900">Calidad IFC</h3>
                </div>
                <button
                    type="button"
                    onClick={() => setReloadToken((value) => value + 1)}
                    disabled={!versionId || loading}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 hover:text-[#F39200] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-100 disabled:opacity-40"
                    title="Actualizar reporte de calidad IFC"
                    aria-label="Actualizar reporte de calidad IFC"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin motion-reduce:animate-none' : ''}`} />
                </button>
            </div>

            {!versionId ? <p className="px-3 py-4 text-xs text-zinc-500">Selecciona una versión.</p> : null}
            {versionId && !report && !loading ? (
                <div className="flex items-center justify-between gap-3 px-3 py-4">
                    <p className="text-xs text-zinc-500">Sin reporte disponible.</p>
                    {canGenerate ? (
                        <button type="button" onClick={generate} className="rounded-lg bg-[#F39200] px-3 py-2 text-[10px] font-black text-white hover:bg-[#d87f00]">
                            Generar
                        </button>
                    ) : null}
                </div>
            ) : null}

            {report ? (
                <div className="space-y-3 p-3">
                    <div className="flex items-center gap-2">
                        {report.overall_status === 'passed' ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : report.overall_status === 'failed' ? <ShieldAlert className="h-4 w-4 text-rose-600" /> : <AlertTriangle className="h-4 w-4 text-amber-600" />}
                        <span className={`rounded-md px-2 py-1 text-[10px] font-black ${statusClass(report.overall_status)}`}>
                            {STATUS_LABELS[report.overall_status] || report.overall_status}
                        </span>
                        <span className="ml-auto text-[10px] font-bold text-zinc-500">{report.error_count} E · {report.warning_count} A</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                        {[
                            ['STEP', report.step_status],
                            [report.schema_identifier || 'Schema', report.schema_status],
                            ['Semántica', report.semantic_status],
                        ].map(([label, status]) => (
                            <div key={label} className="min-w-0 rounded-md bg-zinc-50 px-2 py-2 text-center">
                                <p className="truncate text-[9px] font-bold text-zinc-500" title={label}>{label}</p>
                                <p className={`mt-1 truncate text-[9px] font-black ${statusClass(status).split(' ').at(-1)}`}>{STATUS_LABELS[status] || status}</p>
                            </div>
                        ))}
                    </div>
                    {(report.findings || []).length > 0 ? (
                        <div className="space-y-1.5">
                            {report.findings.slice(0, 5).map((finding, index) => (
                                <div key={`${finding.code}-${index}`} className="rounded-md border border-zinc-100 px-2.5 py-2">
                                    <div className="flex items-center gap-2 text-[9px] font-black">
                                        <span className={finding.severity === 'error' ? 'text-rose-700' : 'text-amber-700'}>{DOMAIN_LABELS[finding.domain] || finding.domain}</span>
                                        {finding.entity_ref ? <span className="truncate text-zinc-400" title={finding.entity_ref}>{finding.entity_ref}</span> : null}
                                    </div>
                                    <p className="mt-1 text-[10px] leading-4 text-zinc-600">{finding.message}</p>
                                </div>
                            ))}
                        </div>
                    ) : null}
                    <p className="text-[9px] text-zinc-400" title="Este reporte no constituye certificación buildingSMART">
                        Contrato {report.contract_version}
                    </p>
                </div>
            ) : null}
            {message ? <p className="border-t border-zinc-100 px-3 py-2 text-[10px] font-semibold text-rose-700" role="alert">{message}</p> : null}
        </section>
    );
};

export default BimQualityReportPanel;
