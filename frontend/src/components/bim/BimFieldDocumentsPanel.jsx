import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Download, FileText, RefreshCw, Search } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const CATEGORY_LABELS = {
    drawing: 'Planos', specification: 'Especificaciones', report: 'Informes',
    procedure: 'Procedimientos', contract: 'Contratos', model: 'Modelos', other: 'Otros',
};

const formatBytes = (value) => {
    if (!Number.isFinite(value) || value <= 0) return '0 B';
    if (value < 1024) return `${value} B`;
    if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
    return `${(value / (1024 * 1024)).toFixed(1)} MB`;
};

const BimFieldDocumentsPanel = ({ projectId, empresaId, api = bimModelsApi, onDownload }) => {
    const [documents, setDocuments] = useState([]);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('all');
    const [busyId, setBusyId] = useState(null);
    const [message, setMessage] = useState('');

    const load = useCallback(async () => {
        if (!projectId) return;
        try { setMessage(''); setDocuments(await api.listCdeDocuments(projectId, false, empresaId)); }
        catch (error) { setMessage(error?.response?.data?.detail || 'No se pudieron cargar los documentos de campo.'); }
    }, [api, empresaId, projectId]);

    useEffect(() => { load(); }, [load]);

    const categories = useMemo(() => [...new Set(documents.map((item) => item.category))].sort(), [documents]);
    const visible = useMemo(() => {
        const term = search.trim().toLocaleLowerCase('es');
        return documents.filter((item) => {
            if (category !== 'all' && item.category !== category) return false;
            if (!term) return true;
            return `${item.document_code} ${item.title} ${item.current?.source_filename || ''}`.toLocaleLowerCase('es').includes(term);
        });
    }, [category, documents, search]);

    const download = async (document) => {
        if (!document.current) return;
        try {
            setBusyId(document.id); setMessage('');
            const blob = await api.downloadCdeRevision(projectId, document.current.id, empresaId);
            if (onDownload) {
                onDownload(document, blob);
            } else {
                const url = URL.createObjectURL(blob);
                const anchor = window.document.createElement('a');
                anchor.href = url; anchor.download = document.current.source_filename || `${document.document_code}.bin`;
                anchor.click(); URL.revokeObjectURL(url);
            }
            setMessage(`${document.document_code} descargado`);
        } catch (error) { setMessage(error?.response?.data?.detail || 'No se pudo descargar la revisión vigente.'); }
        finally { setBusyId(null); }
    };

    return (
        <section className="relative h-full min-h-0 overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-field-documents>
            <header className="flex h-11 items-center justify-between border-b border-zinc-200 px-3">
                <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-[#F39200]" aria-hidden="true" /><div><h3 className="text-xs font-semibold text-zinc-900">Documentos de campo</h3><p className="text-[9px] text-zinc-500">Revisiones vigentes autorizadas</p></div></div>
                <button type="button" onClick={load} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:border-[#F39200] hover:text-[#F39200]" aria-label="Actualizar documentos de campo" title="Actualizar documentos"><RefreshCw className="h-3.5 w-3.5" /></button>
            </header>
            <div className="flex h-11 items-center gap-2 border-b border-zinc-200 bg-zinc-50 px-3">
                <label className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-zinc-400" aria-hidden="true" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar código, título o archivo" className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-8 pr-2 text-xs outline-none focus:border-[#F39200]" /></label>
                <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-8 w-44 rounded-md border border-zinc-200 bg-white px-2 text-xs" aria-label="Filtrar categoría documental"><option value="all">Todas las categorías</option>{categories.map((item) => <option key={item} value={item}>{CATEGORY_LABELS[item] || item}</option>)}</select>
                <span className="w-24 text-right text-[10px] font-semibold text-zinc-500">{visible.length} visibles</span>
            </div>
            <div className="h-[calc(100%-88px)] overflow-auto">
                <div className="sticky top-0 z-10 grid h-8 grid-cols-[120px_minmax(0,1fr)_132px_90px_104px_44px] items-center border-b border-zinc-200 bg-white px-3 text-[9px] font-semibold uppercase text-zinc-400"><span>Código</span><span>Documento</span><span>Categoría</span><span>Revisión</span><span>Tamaño</span><span /></div>
                <div data-bim-field-document-list>{visible.length ? visible.map((item) => (
                    <div key={item.id} className="grid min-h-12 grid-cols-[120px_minmax(0,1fr)_132px_90px_104px_44px] items-center border-b border-zinc-100 px-3 text-[11px] hover:bg-zinc-50">
                        <span className="font-semibold text-zinc-800">{item.document_code}</span><div className="min-w-0"><p className="truncate font-medium text-zinc-800" title={item.title}>{item.title}</p><p className="truncate text-[9px] text-zinc-400" title={item.current?.source_filename}>{item.current?.source_filename || 'Sin archivo vigente'}</p></div><span className="text-zinc-500">{CATEGORY_LABELS[item.category] || item.category}</span><span className="text-zinc-600">{item.current ? `${item.current.version_label} · r${item.current.revision}` : 'Sin revisión'}</span><span className="text-zinc-500">{formatBytes(item.current?.file_size_bytes)}</span><button type="button" onClick={() => download(item)} disabled={!item.current || busyId === item.id} className="inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-orange-50 hover:text-[#F39200] disabled:opacity-30" aria-label={`Descargar ${item.document_code}`} title="Descargar revisión vigente"><Download className="h-3.5 w-3.5" /></button>
                    </div>
                )) : <p className="p-4 text-xs text-zinc-500">No hay documentos autorizados para este filtro.</p>}</div>
            </div>
            {message ? <p className="absolute bottom-2 left-3 text-[10px] font-medium text-zinc-600" role="status">{message}</p> : null}
        </section>
    );
};

export default BimFieldDocumentsPanel;
