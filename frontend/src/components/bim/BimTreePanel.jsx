import React, { useMemo, useState } from 'react';
import { ChevronRight, Network, Search } from 'lucide-react';

const groupElementsByStorey = (elements = []) => {
    const groups = new Map();

    elements.forEach((element) => {
        const key = element.storey_name || 'Sin nivel';
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key).push(element);
    });

    return Array.from(groups.entries()).map(([storey, items]) => ({
        storey,
        items: items.sort((left, right) => `${left.nombre || left.global_id}`.localeCompare(`${right.nombre || right.global_id}`)),
    }));
};

const normalizeSearchValue = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const buildIfcSummary = (groups = []) => {
    const counts = new Map();

    groups.forEach((group) => {
        group.items.forEach((element) => {
            const key = element.ifc_class || 'Sin clase IFC';
            counts.set(key, (counts.get(key) || 0) + 1);
        });
    });

    return Array.from(counts.entries())
        .map(([ifcClass, count]) => ({ ifcClass, count }))
        .sort((left, right) => right.count - left.count || left.ifcClass.localeCompare(right.ifcClass))
        .slice(0, 4);
};

const BimTreePanel = ({
    nodes,
    elements = [],
    ready,
    selectedElementId,
    selectedStoreyName = null,
    onSelectElement,
    onSelectStorey,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const groupedElements = useMemo(() => groupElementsByStorey(elements), [elements]);
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    const filteredGroups = useMemo(() => {
        if (!normalizedSearchTerm) {
            return groupedElements;
        }

        return groupedElements
            .map((group) => ({
                ...group,
                items: group.items.filter((element) => {
                    const haystack = normalizeSearchValue(
                        [element.nombre, element.global_id, element.ifc_class, element.storey_name].filter(Boolean).join(' '),
                    );
                    return haystack.includes(normalizedSearchTerm);
                }),
            }))
            .filter((group) => group.items.length > 0);
    }, [groupedElements, normalizedSearchTerm]);
    const storeyFilters = groupedElements.map((group) => ({
        id: group.storey,
        label: group.storey,
        count: group.items.length,
    }));
    const filteredElementCount = filteredGroups.reduce((accumulator, group) => accumulator + group.items.length, 0);
    const visibleStoreyCount = filteredGroups.length;
    const ifcSummary = useMemo(() => buildIfcSummary(filteredGroups), [filteredGroups]);

    return (
        <div className="flex min-h-[220px] flex-col rounded-[1.5rem] border border-zinc-200 bg-white">
            <div className="border-b border-zinc-200 px-5 py-4">
                <div className="flex items-center gap-2">
                    <Network className="h-4 w-4 text-[#F39200]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Árbol BIM</p>
                </div>
                <h3 className="mt-1 text-sm font-black uppercase tracking-widest text-zinc-900">Estructura semántica</h3>
                <div className="mt-4 rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                    <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-zinc-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Buscar nombre, Global ID o IFC"
                            className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                        />
                    </div>
                    <p className="mt-2 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                        {normalizedSearchTerm
                            ? `${filteredElementCount} coincidencias BIM visibles`
                            : `${elements.length} elementos BIM visibles`}
                    </p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600">
                        Niveles {visibleStoreyCount}
                    </span>
                    {ifcSummary.map((item) => (
                        <span
                            key={item.ifcClass}
                            className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500"
                        >
                            {item.ifcClass} {item.count}
                        </span>
                    ))}
                </div>
            </div>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
                {!ready || (nodes.length === 0 && groupedElements.length === 0) ? (
                    <div className="flex h-full items-center justify-center text-center">
                        <p className="max-w-[220px] text-sm text-zinc-500">
                            Cuando haya una versión BIM activa, aquí aparecerán disciplinas, grupos o niveles del modelo.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="space-y-2">
                            <button
                                type="button"
                                onClick={() => onSelectStorey?.(null)}
                                className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 ${
                                    !selectedStoreyName ? 'border-[#F39200] bg-orange-50' : 'border-zinc-200 bg-zinc-50'
                                }`}
                            >
                                <ChevronRight className="h-4 w-4 text-zinc-400" />
                                <div className="min-w-0 text-left">
                                    <p className="truncate text-[11px] font-black uppercase tracking-widest text-zinc-800">Todos los niveles</p>
                                    <p className="text-xs text-zinc-500">
                                        {normalizedSearchTerm ? `${filteredElementCount} coincidencias visibles` : `${elements.length} elementos visibles`}
                                    </p>
                                </div>
                            </button>
                            {storeyFilters.map((node) => (
                                <button
                                    type="button"
                                    key={node.id}
                                    onClick={() => onSelectStorey?.(node.label)}
                                    className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2 ${
                                        selectedStoreyName === node.label
                                            ? 'border-[#F39200] bg-orange-50'
                                            : 'border-zinc-200 bg-zinc-50 hover:border-[#F39200]'
                                    }`}
                                >
                                    <ChevronRight className="h-4 w-4 text-zinc-400" />
                                    <div className="min-w-0">
                                        <p className="truncate text-[11px] font-black uppercase tracking-widest text-zinc-800">{node.label}</p>
                                        <p className="text-xs text-zinc-500">{node.count} entradas disponibles</p>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {filteredGroups.length > 0 ? (
                            <div className="space-y-3 border-t border-zinc-200 pt-4">
                                {filteredGroups.map((group) => (
                                    <div key={group.storey} className="rounded-2xl border border-zinc-200 bg-zinc-50 px-3 py-3">
                                        <div className="flex items-center justify-between gap-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{group.storey}</p>
                                            <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                                {group.items.length} elementos
                                            </span>
                                        </div>
                                        <div className="mt-3 space-y-2">
                                            {group.items.map((element) => {
                                                const isSelected = element.id === selectedElementId;
                                                return (
                                                    <button
                                                        key={element.id}
                                                        type="button"
                                                        onClick={() => onSelectElement?.(element)}
                                                        className={`w-full rounded-xl border px-3 py-2 text-left transition-colors ${
                                                            isSelected
                                                                ? 'border-[#F39200] bg-orange-50'
                                                                : 'border-zinc-200 bg-white hover:border-[#F39200]'
                                                        }`}
                                                    >
                                                        <p className="truncate text-[11px] font-black uppercase tracking-widest text-zinc-800">
                                                            {element.nombre || element.global_id}
                                                        </p>
                                                        <p className="mt-1 truncate text-xs text-zinc-500">
                                                            {element.ifc_class || 'IFC'} • {element.global_id}
                                                        </p>
                                                        {element.classification || element.system_name ? (
                                                            <p className="mt-1 truncate text-[10px] text-zinc-400">
                                                                {[element.classification, element.system_name].filter(Boolean).join(' • ')}
                                                            </p>
                                                        ) : null}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : normalizedSearchTerm ? (
                            <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-4 py-6 text-center">
                                <p className="text-sm font-semibold text-zinc-600">No hay coincidencias BIM para esa búsqueda.</p>
                                <p className="mt-2 text-xs text-zinc-500">
                                    Prueba con otro nombre, `Global ID`, clase IFC o cambia el filtro de nivel activo.
                                </p>
                            </div>
                        ) : null}
                    </>
                )}
            </div>
        </div>
    );
};

export default BimTreePanel;
