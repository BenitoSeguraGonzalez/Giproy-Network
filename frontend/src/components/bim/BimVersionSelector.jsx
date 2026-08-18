import React, { useMemo, useState } from 'react';
import { Layers3, Search } from 'lucide-react';

const formatDateTime = (value) => {
    if (!value) {
        return 'N/D';
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'N/D';
    }

    return new Intl.DateTimeFormat('es-CO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(parsed);
};

const normalizeSearchValue = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const buildDisciplineSummary = (versions = []) => {
    const counts = new Map();
    versions.forEach((version) => {
        const key = version.disciplina || 'Sin disciplina';
        counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
        .map(([discipline, count]) => ({ discipline, count }))
        .sort((left, right) => right.count - left.count || left.discipline.localeCompare(right.discipline))
        .slice(0, 4);
};

const BimVersionSelector = ({ models, activeVersionId, onSelectVersion }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterMode, setFilterMode] = useState('all');
    const versions = useMemo(
        () =>
            models.flatMap((model) =>
                (model.versions || []).map((version) => ({
                    ...version,
                    modelName: model.nombre,
                    disciplina: model.disciplina,
                    sourceFilename: version.source_filename || model.archivo_fuente || null,
                }))
            ),
        [models],
    );
    const normalizedSearchTerm = normalizeSearchValue(searchTerm);
    const filteredVersions = useMemo(
        () =>
            versions.filter((version) => {
                const matchesFilter =
                    filterMode === 'all'
                        ? true
                        : filterMode === 'active'
                          ? Boolean(version.is_active)
                          : (version.element_count ?? 0) > 0;
                if (!matchesFilter) {
                    return false;
                }
                if (!normalizedSearchTerm) {
                    return true;
                }
                const haystack = normalizeSearchValue(
                    [
                        version.version_label,
                        version.modelName,
                        version.disciplina,
                        version.sourceFilename,
                        version.status,
                        version.notes,
                    ]
                        .filter(Boolean)
                        .join(' '),
                );
                return haystack.includes(normalizedSearchTerm);
            }),
        [filterMode, normalizedSearchTerm, versions],
    );
    const disciplineSummary = useMemo(() => buildDisciplineSummary(filteredVersions), [filteredVersions]);
    const activeBackendCount = filteredVersions.filter((version) => Boolean(version.is_active)).length;
    const withElementsCount = filteredVersions.filter((version) => (version.element_count ?? 0) > 0).length;

    return (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="mb-3 flex items-center gap-2">
                <Layers3 className="h-4 w-4 text-[#F39200]" />
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Versiones</p>
            </div>
            {versions.length > 0 ? (
                <div className="mb-3 rounded-2xl border border-zinc-200 bg-white p-3">
                    <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                        <Search className="h-4 w-4 text-zinc-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Buscar versión BIM por modelo, disciplina u origen"
                            className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                        />
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                        <button
                            type="button"
                            onClick={() => setFilterMode('all')}
                            className={`inline-flex h-8 items-center rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                filterMode === 'all'
                                    ? 'border-orange-200 bg-orange-50 text-[#F39200]'
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                            }`}
                        >
                            Todas
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode('active')}
                            className={`inline-flex h-8 items-center rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                filterMode === 'active'
                                    ? 'border-orange-200 bg-orange-50 text-[#F39200]'
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                            }`}
                        >
                            Activas backend
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilterMode('with-elements')}
                            className={`inline-flex h-8 items-center rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                filterMode === 'with-elements'
                                    ? 'border-orange-200 bg-orange-50 text-[#F39200]'
                                    : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                            }`}
                        >
                            Con elementos
                        </button>
                    </div>
                    <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                        {filteredVersions.length} versiones BIM visibles
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-[0.16em]">
                        <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-600">
                            Activas {activeBackendCount}
                        </span>
                        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-zinc-600">
                            Con elementos {withElementsCount}
                        </span>
                        {disciplineSummary.map((item) => (
                            <span
                                key={item.discipline}
                                className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-zinc-500"
                            >
                                {item.discipline} {item.count}
                            </span>
                        ))}
                    </div>
                </div>
            ) : null}
            {versions.length === 0 ? (
                <p className="text-sm text-zinc-500">Aún no hay versiones BIM registradas para este proyecto.</p>
            ) : filteredVersions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-5 text-center">
                    <p className="text-sm font-semibold text-zinc-600">No hay versiones BIM para el filtro actual.</p>
                    <p className="mt-2 text-xs text-zinc-500">
                        Ajusta la búsqueda o cambia el filtro para volver a mostrar el catálogo de versiones del proyecto.
                    </p>
                </div>
            ) : (
                <div className="min-w-0 max-w-full space-y-2 overflow-x-hidden">
                    {filteredVersions.map((version) => {
                        const isActive = version.id === activeVersionId;
                        return (
                            <button
                                key={version.id}
                                type="button"
                                onClick={() => onSelectVersion?.(version.id)}
                                className={`block w-full min-w-0 max-w-full overflow-hidden rounded-xl border px-3 py-2 text-left ${
                                    isActive
                                        ? 'border-[#F39200] bg-orange-50 text-[#F39200]'
                                        : 'border-zinc-200 bg-white text-zinc-600 hover:border-[#F39200]'
                                }`}
                            >
                                <div className="flex min-w-0 items-start justify-between gap-3">
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[11px] font-black uppercase tracking-widest">
                                            {version.version_label}
                                        </p>
                                        <p className="truncate text-xs text-zinc-500">{version.modelName}</p>
                                        <div className="mt-2 flex flex-wrap gap-2 text-[9px] font-black uppercase tracking-[0.16em]">
                                            <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-zinc-500">
                                                {version.disciplina || 'Sin disciplina'}
                                            </span>
                                            {version.is_active ? (
                                                <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-emerald-700">
                                                    Activa en backend
                                                </span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <span className="max-w-[45%] shrink-0 truncate rounded-full border border-current px-2 py-0.5 text-[9px] font-black uppercase tracking-widest">
                                        {version.status}
                                    </span>
                                </div>
                                <div className="mt-3 grid gap-2 text-left text-[10px] font-semibold text-zinc-500">
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <span>Elementos</span>
                                        <span className="font-black text-zinc-700">{version.element_count ?? 0}</span>
                                    </div>
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <span>Niveles</span>
                                        <span className="font-black text-zinc-700">{version.storey_count ?? 0}</span>
                                    </div>
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <span>Creada</span>
                                        <span className="font-black text-zinc-700">{formatDateTime(version.fecha_creacion)}</span>
                                    </div>
                                    <div className="flex min-w-0 items-start justify-between gap-3">
                                        <span>Origen</span>
                                        <span className="truncate text-right font-black text-zinc-700">
                                            {version.sourceFilename || 'Sin archivo'}
                                        </span>
                                    </div>
                                    {version.notes ? (
                                        <div className="min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 px-2 py-2 text-[10px] text-zinc-600">
                                            <span className="block break-all">{version.notes}</span>
                                        </div>
                                    ) : null}
                                </div>
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default BimVersionSelector;
