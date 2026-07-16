import { useEffect, useMemo, useState } from 'react';
import { Download, FileBarChart, Search } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

export default function BimReportsPanel({ projectId, empresaId }) {
    const [type, setType] = useState('conflicts');
    const [baselines, setBaselines] = useState([]); const [resources, setResources] = useState([]);
    const [baselineId, setBaselineId] = useState(''); const [resourceId, setResourceId] = useState('');
    const [cutoff, setCutoff] = useState(new Date().toISOString().slice(0, 10));
    const [report, setReport] = useState(null); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
    useEffect(() => {
        if (!projectId) return;
        Promise.all([bimModelsApi.list4dBaselines(projectId, empresaId), bimModelsApi.list4dResources(projectId, empresaId)]).then(([baselineValues, resourceValues]) => { setBaselines(baselineValues); setResources(resourceValues); setBaselineId(String(baselineValues[0]?.id || '')); setResourceId(String(resourceValues[0]?.id || '')); }).catch((requestError) => setError(requestError?.response?.data?.detail || 'No se pudieron cargar parámetros de informes BIM.'));
    }, [empresaId, projectId]);
    const params = useMemo(() => ({ ...(type === 'gantt' || type === 'plan_actual' ? { baseline_id: baselineId } : {}), ...(type === 'plan_actual' ? { cutoff: `${cutoff}T12:00:00Z` } : {}), ...(type === 'resources' ? { resource_id: resourceId } : {}) }), [baselineId, cutoff, resourceId, type]);
    const valid = !((type === 'gantt' || type === 'plan_actual') && !baselineId) && !(type === 'resources' && !resourceId);
    const preview = async () => { try { setBusy(true); setError(''); setReport(await bimModelsApi.get4dReport(projectId, type, params, empresaId)); } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo generar el informe BIM.'); } finally { setBusy(false); } };
    const download = async () => { try { setBusy(true); setError(''); const blob = await bimModelsApi.download4dReportCsv(projectId, type, params, empresaId); const url = URL.createObjectURL(blob); const anchor = document.createElement('a'); anchor.href = url; anchor.download = `bim-4d-${type}-${projectId}.csv`; anchor.click(); URL.revokeObjectURL(url); } catch (requestError) { setError(requestError?.response?.data?.detail || 'No se pudo descargar el informe BIM.'); } finally { setBusy(false); } };
    return <section className="rounded border border-slate-200 bg-white" data-bim-reports>
        <header className="flex items-center gap-2 border-b border-slate-200 px-3 py-2"><FileBarChart size={16} className="text-orange-600" /><h3 className="text-sm font-semibold text-slate-800">Informes 4D/5D</h3></header>
        <div className="space-y-2 p-3 text-xs">
            <select className="w-full rounded border border-slate-300 px-2 py-1.5" aria-label="Tipo de informe BIM" value={type} onChange={(event) => { setType(event.target.value); setReport(null); }}><option value="conflicts">Conflictos</option><option value="gantt">Gantt y ruta crítica</option><option value="plan_actual">Plan real</option><option value="resources">Recursos</option><option value="productivity">Productividad</option><option value="field">Campo y EVM</option></select>
            {(type === 'gantt' || type === 'plan_actual') ? <select className="w-full rounded border border-slate-300 px-2 py-1.5" aria-label="Línea base del informe" value={baselineId} onChange={(event) => setBaselineId(event.target.value)}><option value="">Sin línea base</option>{baselines.map((item) => <option key={item.id} value={item.id}>{item.revision} · {item.name}</option>)}</select> : null}
            {type === 'resources' ? <select className="w-full rounded border border-slate-300 px-2 py-1.5" aria-label="Recurso del informe" value={resourceId} onChange={(event) => setResourceId(event.target.value)}><option value="">Sin recurso</option>{resources.map((item) => <option key={item.id} value={item.id}>{item.code} · {item.name}</option>)}</select> : null}
            {type === 'plan_actual' ? <input className="w-full rounded border border-slate-300 px-2 py-1.5" type="date" aria-label="Fecha de corte del informe" value={cutoff} onChange={(event) => setCutoff(event.target.value)} /> : null}
            <div className="grid grid-cols-2 gap-2"><button className="inline-flex items-center justify-center gap-1 rounded border border-slate-300 px-2 py-1.5 hover:bg-slate-50 disabled:opacity-50" type="button" disabled={!valid || busy} onClick={preview}><Search size={14} />Vista previa</button><button className="inline-flex items-center justify-center gap-1 rounded bg-orange-600 px-2 py-1.5 text-white disabled:opacity-50" type="button" disabled={!valid || busy} onClick={download}><Download size={14} />CSV</button></div>
            {report ? <div className="rounded bg-slate-50 p-2" data-bim-report-preview><strong>{report.rows.length} filas</strong><p className="mt-1 text-slate-600">Contrato {report.contract_version}</p></div> : null}
            {error ? <p className="text-red-700" role="alert">{typeof error === 'string' ? error : JSON.stringify(error)}</p> : null}
        </div>
    </section>;
}
