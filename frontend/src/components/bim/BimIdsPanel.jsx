import React, { useEffect, useState } from 'react';
import { Download, FileCheck2, ShieldCheck, Upload } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const BimIdsPanel = ({ projectId, versionId, empresaId, onSelectGuid }) => {
    const [profiles, setProfiles] = useState([]);
    const [profileId, setProfileId] = useState('');
    const [validation, setValidation] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [exceptionFindingId, setExceptionFindingId] = useState(null);
    const [exceptionReason, setExceptionReason] = useState('');

    const refreshProfiles = async () => {
        if (!projectId) return;
        const items = await bimModelsApi.listIdsProfiles(projectId, empresaId);
        setProfiles(items || []);
        if (!profileId && items?.length) setProfileId(String(items[0].id));
    };

    useEffect(() => {
        setValidation(null);
        refreshProfiles().catch(() => setProfiles([]));
    }, [empresaId, projectId, versionId]);

    const importFile = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        try {
            setLoading(true);
            setError('');
            const created = await bimModelsApi.importIdsProfile(projectId, { name: file.name.replace(/\.ids$/i, ''), source_filename: file.name, xml_content: await file.text() }, empresaId);
            await refreshProfiles();
            setProfileId(String(created.id));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo importar el perfil IDS.');
        } finally {
            setLoading(false);
        }
    };

    const validate = async () => {
        if (!profileId || !versionId) return;
        try {
            setLoading(true);
            setError('');
            setValidation(await bimModelsApi.validateIdsProfile(projectId, versionId, Number(profileId), empresaId));
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo ejecutar IDS.');
        } finally {
            setLoading(false);
        }
    };

    const exempt = async () => {
        if (!exceptionFindingId || exceptionReason.trim().length < 5) return;
        try {
            setLoading(true);
            setValidation(await bimModelsApi.exemptIdsFinding(projectId, exceptionFindingId, exceptionReason.trim(), empresaId));
            setExceptionFindingId(null);
            setExceptionReason('');
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo registrar la excepcion IDS.');
        } finally {
            setLoading(false);
        }
    };

    const exportCsv = async () => {
        const blob = await bimModelsApi.exportIdsValidation(projectId, validation.id, empresaId);
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `bim-ids-validation-${validation.id}.csv`;
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-ids-panel>
            <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-3 py-2.5">
                <div className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-[#F39200]" aria-hidden="true" /><h3 className="text-xs font-semibold text-zinc-900">Reglas IDS</h3></div>
                <label className="inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 hover:text-[#F39200]" title="Importar perfil IDS">
                    <Upload className="h-4 w-4" /><span className="sr-only">Importar perfil IDS</span><input type="file" accept=".ids,.xml,text/xml" onChange={importFile} className="sr-only" />
                </label>
            </div>
            <div className="space-y-2 p-3">
                <div className="flex gap-1.5">
                    <select value={profileId} onChange={(event) => setProfileId(event.target.value)} className="h-9 min-w-0 flex-1 rounded-md border border-zinc-200 bg-white px-2 text-xs" aria-label="Perfil IDS">
                        <option value="">Seleccionar perfil</option>
                        {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name} · {profile.specification_count}</option>)}
                    </select>
                    <button type="button" onClick={validate} disabled={!profileId || !versionId || loading} className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-[#F39200] text-white disabled:opacity-40" title="Ejecutar validacion IDS" aria-label="Ejecutar validacion IDS"><FileCheck2 className="h-4 w-4" /></button>
                    {validation ? <button type="button" onClick={exportCsv} className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:text-[#F39200]" title="Exportar validacion IDS" aria-label="Exportar validacion IDS"><Download className="h-4 w-4" /></button> : null}
                </div>
                {error ? <p className="text-xs font-medium text-rose-700" role="alert">{typeof error === 'string' ? error : error.message || 'Error IDS'}</p> : null}
                {validation ? (
                    <>
                        <div className="grid grid-cols-3 gap-1 text-center text-[10px] font-semibold">
                            <span className="rounded bg-emerald-50 py-1.5 text-emerald-700">{validation.summary.passed || 0} OK</span>
                            <span className="rounded bg-rose-50 py-1.5 text-rose-700">{validation.summary.failed || 0} fallos</span>
                            <span className="rounded bg-amber-50 py-1.5 text-amber-800">{validation.summary.exempted || 0} excepciones</span>
                        </div>
                        <div className="max-h-64 space-y-1 overflow-auto" data-bim-ids-findings>
                            {(validation.findings || []).filter((finding) => finding.status !== 'passed').map((finding) => (
                                <div key={finding.id} className="rounded-md border border-zinc-200 p-2">
                                    <button type="button" onClick={() => finding.global_id && onSelectGuid?.(finding.global_id)} disabled={!finding.global_id} className="block w-full text-left disabled:cursor-default">
                                        <span className="block truncate text-xs font-medium text-zinc-800">{finding.specification_name}</span>
                                        <span className="mt-0.5 block text-[10px] text-zinc-500">{finding.message}</span>
                                    </button>
                                    {finding.status === 'failed' ? <button type="button" onClick={() => setExceptionFindingId(finding.id)} className="mt-1 text-[10px] font-semibold text-amber-700">Registrar excepcion</button> : <span className="mt-1 block text-[10px] font-semibold text-amber-700">Excepcion auditada</span>}
                                    {exceptionFindingId === finding.id ? <div className="mt-2 flex gap-1"><input value={exceptionReason} onChange={(event) => setExceptionReason(event.target.value)} className="h-8 min-w-0 flex-1 rounded border border-zinc-200 px-2 text-xs" aria-label="Motivo de excepcion IDS" /><button type="button" onClick={exempt} disabled={exceptionReason.trim().length < 5} className="h-8 rounded bg-amber-600 px-2 text-[10px] font-semibold text-white disabled:opacity-40">Guardar</button></div> : null}
                                </div>
                            ))}
                        </div>
                    </>
                ) : null}
            </div>
        </section>
    );
};

export default BimIdsPanel;
