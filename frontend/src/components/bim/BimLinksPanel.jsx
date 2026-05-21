import React, { useEffect, useMemo, useState } from 'react';
import { Blocks, Link2, Search, Trash2 } from 'lucide-react';

import { apusApi } from '../../api/apus';
import { bimLinksApi } from '../../api/bimLinks';
import { edtApi } from '../../api/edt';
import { presupuestosApi } from '../../api/presupuestos';
import AnimatedSelect from '../ui/AnimatedSelect';

const INPUT_BASE =
    'w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 outline-none transition-colors focus:border-[#F39200]';

const TARGET_OPTIONS = [
    { value: 'edt', label: 'EDT' },
    { value: 'apu', label: 'APU' },
    { value: 'presupuesto', label: 'Presupuesto' },
];

const normalizeSearchValue = (value) =>
    String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();

const formatDateTime = (value) => {
    if (!value) {
        return 'Sin fecha';
    }
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return 'Sin fecha';
    }
    return parsed.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const flattenEdtTree = (nodes = [], depth = 0) =>
    nodes.flatMap((node) => [
        {
            id: node.id,
            label: `${'· '.repeat(depth)}${node.codigo || `EDT-${node.id}`} - ${node.nombre || 'Nodo EDT'}`,
        },
        ...flattenEdtTree(node.hijos || [], depth + 1),
    ]);

const buildVisibleTypeSummary = (links = []) => {
    const counts = new Map();
    links.forEach((item) => {
        const key = item.target_type || 'sin_tipo';
        counts.set(key, (counts.get(key) || 0) + 1);
    });
    return Array.from(counts.entries())
        .map(([type, count]) => ({ type, count }))
        .sort((left, right) => right.count - left.count || left.type.localeCompare(right.type));
};

const BimLinksPanel = ({
    linkSummary,
    ready,
    projectId,
    empresaId,
    elements = [],
    recentLinks = [],
    selectedElement = null,
    selectedLinkId = null,
    onSelectLink,
    onRefresh,
}) => {
    const [form, setForm] = useState({
        bim_element_id: '',
        target_type: 'edt',
        target_id: '',
        notes: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [deletingId, setDeletingId] = useState(null);
    const [message, setMessage] = useState('');
    const [targetOptions, setTargetOptions] = useState([]);
    const [loadingTargets, setLoadingTargets] = useState(false);
    const [linkSearchTerm, setLinkSearchTerm] = useState('');
    const [linkFilterType, setLinkFilterType] = useState('all');

    const sortedElements = useMemo(
        () =>
            [...elements].sort((left, right) =>
                `${left.nombre || left.global_id}`.localeCompare(`${right.nombre || right.global_id}`),
            ),
        [elements],
    );
    const filteredRecentLinks = useMemo(() => {
        if (!selectedElement?.id) {
            return recentLinks;
        }
        return recentLinks.filter((item) => item.bim_element_id === selectedElement.id);
    }, [recentLinks, selectedElement]);
    const visibleRecentLinks = useMemo(() => {
        const normalizedSearchTerm = normalizeSearchValue(linkSearchTerm);
        return filteredRecentLinks.filter((item) => {
            const matchesType = linkFilterType === 'all' ? true : item.target_type === linkFilterType;
            if (!matchesType) {
                return false;
            }
            if (!normalizedSearchTerm) {
                return true;
            }
            const haystack = normalizeSearchValue(
                [
                    item.target_type,
                    item.target_label,
                    item.bim_element_nombre,
                    item.bim_element_global_id,
                    item.notes,
                ]
                    .filter(Boolean)
                    .join(' '),
            );
            return haystack.includes(normalizedSearchTerm);
        });
    }, [filteredRecentLinks, linkFilterType, linkSearchTerm]);
    const visibleTypeSummary = useMemo(() => buildVisibleTypeSummary(visibleRecentLinks), [visibleRecentLinks]);

    useEffect(() => {
        let cancelled = false;

        const loadTargets = async () => {
            if (!ready || !projectId) {
                setTargetOptions([]);
                return;
            }

            try {
                setLoadingTargets(true);
                let options = [];

                if (form.target_type === 'edt') {
                    const tree = await edtApi.getTree(projectId, empresaId);
                    options = flattenEdtTree(tree || []);
                } else if (form.target_type === 'apu') {
                    const response = await apusApi.getAll({ limit: 100, empresa_id: empresaId });
                    options = (response?.data || []).map((apu) => ({
                        id: apu.id,
                        label: `${apu.codigo || `APU-${apu.id}`} - ${apu.descripcion || 'APU'}`,
                    }));
                } else if (form.target_type === 'presupuesto') {
                    const presupuestosResponse = await presupuestosApi.getByProyecto(projectId, empresaId);
                    const presupuestos = presupuestosResponse?.data || [];
                    options = presupuestos.flatMap((presupuesto) =>
                        (presupuesto.detalle || []).map((linea) => ({
                            id: linea.id,
                            label: `${linea.codigo_item || `DET-${linea.id}`} - ${linea.descripcion || 'Línea de presupuesto'}`,
                        })),
                    );
                }

                if (!cancelled) {
                    setTargetOptions(options);
                }
            } catch (error) {
                if (!cancelled) {
                    setTargetOptions([]);
                    setMessage(error?.response?.data?.detail || 'No se pudieron cargar los destinos del vínculo BIM.');
                }
            } finally {
                if (!cancelled) {
                    setLoadingTargets(false);
                }
            }
        };

        loadTargets();
        return () => {
            cancelled = true;
        };
    }, [empresaId, form.target_type, projectId, ready]);

    useEffect(() => {
        if (!selectedElement?.id) {
            return;
        }
        setForm((current) => ({
            ...current,
            bim_element_id: String(selectedElement.id),
        }));
    }, [selectedElement]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!projectId || !form.bim_element_id || !form.target_id) {
            setMessage('Selecciona un elemento BIM e indica el ID del destino.');
            return;
        }

        try {
            setSubmitting(true);
            setMessage('');
            await bimLinksApi.create(
                projectId,
                {
                    bim_element_id: Number(form.bim_element_id),
                    target_type: form.target_type,
                    target_id: Number(form.target_id),
                    notes: form.notes?.trim() || null,
                },
                empresaId,
            );
            setForm((current) => ({ ...current, target_id: '', notes: '' }));
            setMessage('Vínculo BIM registrado.');
            onRefresh?.();
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo registrar el vínculo BIM.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (event, item) => {
        event.stopPropagation();
        if (!projectId) {
            return;
        }
        try {
            setDeletingId(item.id);
            setMessage('');
            await bimLinksApi.remove(projectId, item.target_type, item.id, empresaId);
            setMessage('Vínculo BIM eliminado.');
            onRefresh?.();
        } catch (error) {
            setMessage(error?.response?.data?.detail || 'No se pudo eliminar el vínculo BIM.');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="mb-3 flex items-center gap-2">
                <Blocks className="h-4 w-4 text-[#F39200]" />
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-400">Vínculos de negocio</p>
            </div>

            {!ready || linkSummary.length === 0 ? (
                <p className="text-sm text-zinc-500">Todavía no se han registrado vínculos BIM con módulos de negocio.</p>
            ) : (
                <div className="space-y-2">
                    {linkSummary.map((item) => (
                        <div key={item.type} className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-3 py-2">
                            <span className="text-[11px] font-black uppercase tracking-widest text-zinc-700">{item.type}</span>
                            <span className="rounded-full border border-zinc-200 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                                {item.count}
                            </span>
                        </div>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-3 rounded-2xl border border-zinc-200 bg-white p-3">
                <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-[#F39200]" />
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">Registro rápido BIM</p>
                </div>

                <AnimatedSelect
                    className={INPUT_BASE}
                    value={form.bim_element_id}
                    onChange={(event) => setForm((current) => ({ ...current, bim_element_id: event.target.value }))}
                    disabled={Boolean(selectedElement?.id)}
                >
                    <option value="">Selecciona un elemento BIM</option>
                    {sortedElements.map((element) => (
                        <option key={element.id} value={element.id}>
                            {element.nombre || element.global_id} · {element.ifc_class || 'IFC'}
                        </option>
                    ))}
                </AnimatedSelect>

                <div className="grid gap-3">
                    <AnimatedSelect
                        className={INPUT_BASE}
                        value={form.target_type}
                        onChange={(event) =>
                            setForm((current) => ({ ...current, target_type: event.target.value, target_id: '' }))
                        }
                    >
                        {TARGET_OPTIONS.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </AnimatedSelect>
                    <AnimatedSelect
                        className={INPUT_BASE}
                        value={form.target_id}
                        onChange={(event) => setForm((current) => ({ ...current, target_id: event.target.value }))}
                        disabled={loadingTargets}
                    >
                        <option value="">
                            {loadingTargets ? 'Cargando destinos...' : 'Selecciona el destino'}
                        </option>
                        {targetOptions.map((target) => (
                            <option key={`${form.target_type}-${target.id}`} value={target.id}>
                                {target.label}
                            </option>
                        ))}
                    </AnimatedSelect>
                </div>

                <textarea
                    className={`${INPUT_BASE} min-h-[84px] resize-y`}
                    placeholder="Notas del vínculo BIM (opcional)"
                    value={form.notes}
                    onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
                />

                <button
                    type="submit"
                    disabled={submitting || !ready}
                    className="w-full rounded-xl bg-[#F39200] px-3 py-2 text-xs font-black uppercase tracking-[0.18em] text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting ? 'Registrando...' : 'Crear vínculo BIM'}
                </button>

                <p className="text-[11px] text-zinc-500">
                    Este formulario técnico permite vincular un elemento BIM con `EDT`, `APUs` o `Presupuesto` usando selectores reales del proyecto activo.
                </p>
                {selectedElement ? (
                    <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#F39200]">
                        Elemento activo: {selectedElement.nombre || selectedElement.global_id}
                    </p>
                ) : null}

                {message ? <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">{message}</p> : null}
            </form>

            <div className="mt-4 space-y-2">
                {filteredRecentLinks.length > 0 ? (
                    <div className="rounded-2xl border border-zinc-200 bg-white p-3">
                        <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                            <Search className="h-4 w-4 text-zinc-400" />
                            <input
                                type="text"
                                value={linkSearchTerm}
                                onChange={(event) => setLinkSearchTerm(event.target.value)}
                                placeholder="Buscar vínculo BIM por destino o elemento"
                                className="w-full bg-transparent text-sm text-zinc-700 outline-none placeholder:text-zinc-400"
                            />
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setLinkFilterType('all')}
                                className={`inline-flex h-8 items-center rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                    linkFilterType === 'all'
                                        ? 'border-orange-200 bg-orange-50 text-[#F39200]'
                                        : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                                }`}
                            >
                                Todos
                            </button>
                            {TARGET_OPTIONS.map((option) => (
                                <button
                                    key={`filter-${option.value}`}
                                    type="button"
                                    onClick={() => setLinkFilterType(option.value)}
                                    className={`inline-flex h-8 items-center rounded-lg border px-3 text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                        linkFilterType === option.value
                                            ? 'border-orange-200 bg-orange-50 text-[#F39200]'
                                            : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-700'
                                    }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                        <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-zinc-400">
                            {visibleRecentLinks.length} vínculos BIM visibles
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-500">
                                Totales {filteredRecentLinks.length}
                            </span>
                            {visibleTypeSummary.map((item) => (
                                <span
                                    key={`summary-${item.type}`}
                                    className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-zinc-600"
                                >
                                    {item.type} {item.count}
                                </span>
                            ))}
                        </div>
                    </div>
                ) : null}
                {visibleRecentLinks.map((item) => (
                    <div
                        key={`${item.target_type}-${item.id}`}
                        role="button"
                        tabIndex={0}
                        onClick={() => onSelectLink?.(item)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                                event.preventDefault();
                                onSelectLink?.(item);
                            }
                        }}
                        className={`rounded-2xl border px-3 py-3 ${
                            selectedLinkId === item.id
                                ? 'border-[#F39200] bg-orange-50'
                                : 'border-zinc-200 bg-white'
                        }`}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-400">{item.target_type}</p>
                                <p className="mt-1 truncate text-sm font-black text-zinc-800">{item.target_label}</p>
                                <p className="mt-1 truncate text-xs text-zinc-500">
                                    {item.bim_element_nombre || item.bim_element_global_id}
                                </p>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                                    {formatDateTime(item.fecha_creacion)}
                                </p>
                                {item.notes ? (
                                    <p className="mt-2 line-clamp-2 text-xs text-zinc-500">{item.notes}</p>
                                ) : null}
                            </div>
                            <button
                                type="button"
                                onClick={(event) => handleDelete(event, item)}
                                disabled={deletingId === item.id}
                                className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-zinc-200 text-zinc-500 transition-colors hover:border-rose-200 hover:text-rose-500 disabled:opacity-50"
                                title="Eliminar vínculo BIM"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
                {ready && filteredRecentLinks.length === 0 && selectedElement ? (
                    <p className="text-sm text-zinc-500">El elemento activo todavía no tiene vínculos BIM registrados.</p>
                ) : null}
                {ready && filteredRecentLinks.length > 0 && visibleRecentLinks.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-5 text-center">
                        <p className="text-sm font-semibold text-zinc-600">No hay vínculos BIM para el filtro actual.</p>
                        <p className="mt-2 text-xs text-zinc-500">
                            Ajusta la búsqueda o cambia el tipo de destino para volver a mostrar la bitácora del elemento.
                        </p>
                    </div>
                ) : null}
            </div>
        </div>
    );
};

export default BimLinksPanel;