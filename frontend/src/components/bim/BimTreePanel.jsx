import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, ListTree, Network, Search, Table2 } from 'lucide-react';

import { bimLinksApi } from '../../api/bimLinks';

const PAGE_SIZE = 100;

const normalizeSearchValue = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const elementSearchText = (element) =>
    normalizeSearchValue(
        [
            element.nombre,
            element.global_id,
            element.ifc_class,
            element.storey_name,
            element.system_name,
            element.classification,
            element.descripcion,
            JSON.stringify(element.properties || {}),
        ]
            .filter(Boolean)
            .join(' '),
    );

const groupDefinitions = {
    structure: {
        label: 'Estructura',
        getKey: (element) => `${element.storey_name || 'Sin nivel'} / ${element.ifc_class || 'Sin clase IFC'}`,
    },
    storey: { label: 'Nivel', getKey: (element) => element.storey_name || 'Sin nivel' },
    ifcClass: { label: 'Clase IFC', getKey: (element) => element.ifc_class || 'Sin clase IFC' },
    system: { label: 'Sistema', getKey: (element) => element.system_name || 'Sin sistema' },
};

const groupElements = (elements, groupBy) => {
    const groups = new Map();
    const getKey = groupDefinitions[groupBy]?.getKey || groupDefinitions.structure.getKey;
    elements.forEach((element) => {
        const key = getKey(element);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(element);
    });
    return Array.from(groups.entries()).sort(([left], [right]) => left.localeCompare(right));
};

const ElementButton = ({ element, selected, onSelect }) => (
    <button
        type="button"
        onClick={() => onSelect?.(element)}
        className={`w-full rounded-md border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] ${
            selected ? 'border-[#F39200] bg-orange-50' : 'border-zinc-200 bg-white hover:border-[#F39200]'
        }`}
        aria-pressed={selected}
    >
        <span className="block truncate text-xs font-semibold text-zinc-800">{element.nombre || element.global_id}</span>
        <span className="mt-0.5 block truncate text-[11px] text-zinc-500">
            {element.ifc_class || 'IFC'} · {element.global_id}
        </span>
    </button>
);

const BimTreePanel = ({
    nodes = [],
    elements = [],
    ready,
    projectId,
    empresaId,
    versionId,
    selectedElement,
    selectedElementId,
    onSelectElement,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [viewMode, setViewMode] = useState('tree');
    const [groupBy, setGroupBy] = useState('structure');
    const [page, setPage] = useState(1);
    const [serverPage, setServerPage] = useState(null);
    const [loading, setLoading] = useState(false);
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);

    useEffect(() => {
        setPage(1);
    }, [normalizedSearchTerm, versionId]);

    useEffect(() => {
        if (!ready || !projectId) {
            setServerPage(null);
            return undefined;
        }
        let cancelled = false;
        const timeoutId = window.setTimeout(async () => {
            try {
                setLoading(true);
                const response = await bimLinksApi.searchElementsByProject(
                    projectId,
                    {
                        version_id: versionId || undefined,
                        q: searchTerm.trim() || undefined,
                        page,
                        page_size: PAGE_SIZE,
                    },
                    empresaId,
                );
                if (!cancelled) {
                    setServerPage(response);
                    if (response.page !== page) setPage(response.page);
                }
            } catch {
                if (!cancelled) setServerPage(null);
            } finally {
                if (!cancelled) setLoading(false);
            }
        }, 220);
        return () => {
            cancelled = true;
            window.clearTimeout(timeoutId);
        };
    }, [empresaId, page, projectId, ready, searchTerm, versionId]);

    const localFiltered = useMemo(() => {
        if (!normalizedSearchTerm) return elements;
        return elements.filter((element) => elementSearchText(element).includes(normalizedSearchTerm));
    }, [elements, normalizedSearchTerm]);
    const localPages = Math.max(1, Math.ceil(localFiltered.length / PAGE_SIZE));
    const localPage = Math.min(page, localPages);
    const localItems = localFiltered.slice((localPage - 1) * PAGE_SIZE, localPage * PAGE_SIZE);
    const pageItems = serverPage?.items || localItems;
    const total = serverPage?.total ?? localFiltered.length;
    const totalPages = serverPage?.pages ?? localPages;
    const currentPage = serverPage?.page ?? localPage;
    const groupedItems = useMemo(() => groupElements(pageItems, groupBy), [groupBy, pageItems]);
    const selectedIsOnPage = pageItems.some((element) => element.id === selectedElementId);

    return (
        <aside className="flex min-h-[260px] min-w-0 flex-col overflow-hidden rounded-lg border border-zinc-200 bg-white" data-bim-element-explorer>
            <div className="border-b border-zinc-200 p-3">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                        <Network className="h-4 w-4 shrink-0 text-[#F39200]" aria-hidden="true" />
                        <h3 className="truncate text-xs font-semibold text-zinc-900">Explorer BIM</h3>
                        <span className="text-[11px] text-zinc-400">{total}</span>
                    </div>
                    <div className="flex rounded-md border border-zinc-200 bg-zinc-50 p-0.5" role="group" aria-label="Vista del explorer BIM">
                        <button
                            type="button"
                            onClick={() => setViewMode('tree')}
                            className={`grid h-7 w-7 place-items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] ${viewMode === 'tree' ? 'bg-white text-[#F39200] shadow-sm' : 'text-zinc-500'}`}
                            title="Vista de árbol"
                            aria-label="Vista de árbol"
                            aria-pressed={viewMode === 'tree'}
                        >
                            <ListTree className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            onClick={() => setViewMode('table')}
                            className={`grid h-7 w-7 place-items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] ${viewMode === 'table' ? 'bg-white text-[#F39200] shadow-sm' : 'text-zinc-500'}`}
                            title="Vista de tabla"
                            aria-label="Vista de tabla"
                            aria-pressed={viewMode === 'table'}
                        >
                            <Table2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                    </div>
                </div>
                <label className="mt-3 flex h-9 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 focus-within:border-[#F39200]">
                    <Search className="h-3.5 w-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
                    <span className="sr-only">Buscar elementos BIM</span>
                    <input
                        type="search"
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Nombre, GUID, clase o propiedad"
                        className="min-w-0 flex-1 bg-transparent text-xs text-zinc-700 outline-none placeholder:text-zinc-400"
                    />
                </label>
                {viewMode === 'tree' ? (
                    <label className="mt-2 flex items-center justify-between gap-2 text-[11px] text-zinc-500">
                        Agrupar por
                        <select
                            value={groupBy}
                            onChange={(event) => setGroupBy(event.target.value)}
                            className="h-8 rounded-md border border-zinc-200 bg-white px-2 text-xs font-medium text-zinc-700 outline-none focus:border-[#F39200]"
                        >
                            {Object.entries(groupDefinitions).map(([value, definition]) => (
                                <option key={value} value={value}>{definition.label}</option>
                            ))}
                        </select>
                    </label>
                ) : null}
            </div>

            <div className="min-h-0 flex-1 overflow-auto p-3" aria-busy={loading}>
                {selectedElement && !selectedIsOnPage ? (
                    <div className="mb-3 border-b border-zinc-200 pb-3" data-bim-pinned-selection>
                        <p className="mb-1.5 text-[10px] font-semibold uppercase text-zinc-400">Elemento activo</p>
                        <ElementButton element={selectedElement} selected onSelect={onSelectElement} />
                    </div>
                ) : null}
                {!ready || (nodes.length === 0 && total === 0) ? (
                    <p className="px-2 py-8 text-center text-sm text-zinc-500">No hay elementos BIM disponibles.</p>
                ) : pageItems.length === 0 ? (
                    <p className="px-2 py-8 text-center text-sm text-zinc-500">No hay coincidencias para esta búsqueda.</p>
                ) : viewMode === 'tree' ? (
                    <div className="space-y-3" data-bim-explorer-tree>
                        {groupedItems.map(([group, items]) => (
                            <section key={group}>
                                <div className="mb-1.5 flex items-center justify-between gap-2">
                                    <h4 className="truncate text-[10px] font-semibold uppercase text-zinc-500" title={group}>{group}</h4>
                                    <span className="text-[10px] text-zinc-400">{items.length}</span>
                                </div>
                                <div className="space-y-1.5">
                                    {items.map((element) => (
                                        <ElementButton
                                            key={element.id}
                                            element={element}
                                            selected={element.id === selectedElementId}
                                            onSelect={onSelectElement}
                                        />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-md border border-zinc-200" data-bim-explorer-table>
                        <table className="w-full min-w-[620px] border-collapse text-left text-xs">
                            <thead className="sticky top-0 bg-zinc-50 text-[10px] uppercase text-zinc-500">
                                <tr><th className="px-2 py-2">Nombre</th><th className="px-2 py-2">Clase</th><th className="px-2 py-2">Nivel</th><th className="px-2 py-2">Sistema</th><th className="px-2 py-2">GUID</th></tr>
                            </thead>
                            <tbody>
                                {pageItems.map((element) => (
                                    <tr
                                        key={element.id}
                                        onClick={() => onSelectElement?.(element)}
                                        className={`cursor-pointer border-t border-zinc-200 ${element.id === selectedElementId ? 'bg-orange-50' : 'bg-white hover:bg-zinc-50'}`}
                                        tabIndex={0}
                                        onKeyDown={(event) => {
                                            if (event.key === 'Enter' || event.key === ' ') onSelectElement?.(element);
                                        }}
                                    >
                                        <td className="max-w-48 truncate px-2 py-2 font-medium text-zinc-800">{element.nombre || element.global_id}</td>
                                        <td className="px-2 py-2 text-zinc-600">{element.ifc_class || 'N/D'}</td>
                                        <td className="px-2 py-2 text-zinc-600">{element.storey_name || 'N/D'}</td>
                                        <td className="px-2 py-2 text-zinc-600">{element.system_name || 'N/D'}</td>
                                        <td className="max-w-44 truncate px-2 py-2 font-mono text-[11px] text-zinc-500">{element.global_id}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="flex min-h-10 items-center justify-between gap-2 border-t border-zinc-200 px-3 py-1.5 text-[11px] text-zinc-500">
                <span>{total === 0 ? '0' : `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, total)}`} de {total}</span>
                <div className="flex gap-1">
                    <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage <= 1 || loading} className="grid h-7 w-7 place-items-center rounded-md border border-zinc-200 bg-white disabled:opacity-40" title="Página anterior" aria-label="Página anterior"><ChevronLeft className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage >= totalPages || loading} className="grid h-7 w-7 place-items-center rounded-md border border-zinc-200 bg-white disabled:opacity-40" title="Página siguiente" aria-label="Página siguiente"><ChevronRight className="h-3.5 w-3.5" /></button>
                </div>
            </div>
        </aside>
    );
};

export default BimTreePanel;
