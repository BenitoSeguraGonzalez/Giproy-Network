import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange, Crosshair, Flame, Link2, LoaderCircle, Search, ZoomIn } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const DAY_MS = 86400000;
const ROW_HEIGHT = 34;
const HEADER_HEIGHT = 32;
const LABEL_WIDTH = 430;
const OVERSCAN = 8;
const SCALE_OPTIONS = {
    compact: { label: 'Mes', pixelsPerDay: 3, tickDays: 30 },
    standard: { label: 'Semana', pixelsPerDay: 8, tickDays: 7 },
    detailed: { label: 'Día', pixelsPerDay: 18, tickDays: 1 },
};

const dateOnly = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
const dayOffset = (start, value) => Math.max(0, (new Date(value) - new Date(start)) / DAY_MS);
const addDays = (value, amount) => {
    const next = new Date(value);
    next.setUTCDate(next.getUTCDate() + amount);
    return next;
};
const formatShortDate = (value) => new Intl.DateTimeFormat('es', { day: '2-digit', month: 'short' }).format(new Date(value));

export default function BimGanttPanel({
    projectId,
    empresaId,
    cutoff,
    selectedGuid = '',
    selectedActivityIds = [],
    primaryActivityId = null,
    onSelectActivity,
    onCutoffChange,
    onGanttChange,
    api = bimModelsApi,
}) {
    const scrollRef = useRef(null);
    const onGanttChangeRef = useRef(onGanttChange);
    const [baselines, setBaselines] = useState([]);
    const [baselineId, setBaselineId] = useState('');
    const [gantt, setGantt] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [onlyLinked, setOnlyLinked] = useState(false);
    const [onlyCritical, setOnlyCritical] = useState(false);
    const [scale, setScale] = useState('standard');
    const [viewport, setViewport] = useState({ scrollTop: 0, height: 240 });

    useEffect(() => {
        onGanttChangeRef.current = onGanttChange;
    }, [onGanttChange]);

    useEffect(() => {
        let active = true;
        if (!projectId) return undefined;
        setError('');
        api.list4dBaselines(projectId, empresaId)
            .then((values) => {
                if (!active) return;
                setBaselines(values);
                setBaselineId((current) => current || String(values[0]?.id || ''));
            })
            .catch((requestError) => {
                if (active) setError(requestError?.response?.data?.detail || 'No se pudieron cargar las líneas base BIM.');
            });
        return () => { active = false; };
    }, [api, empresaId, projectId]);

    const load = useCallback(async () => {
        if (!baselineId) {
            setGantt(null);
            onGanttChangeRef.current?.(null);
            return;
        }
        try {
            setLoading(true);
            setError('');
            const response = await api.get4dGantt(projectId, Number(baselineId), empresaId);
            setGantt(response);
            onGanttChangeRef.current?.(response);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo construir el Gantt BIM.');
        } finally {
            setLoading(false);
        }
    }, [api, baselineId, empresaId, projectId]);

    useEffect(() => { void load(); }, [load]);

    const normalizedSearch = searchTerm.trim().toLocaleLowerCase('es');
    const matchingGuidIds = useMemo(() => new Set(
        selectedGuid && gantt
            ? gantt.activities.filter((activity) => activity.global_ids.includes(selectedGuid)).map((activity) => activity.id)
            : [],
    ), [gantt, selectedGuid]);
    const selectedIds = useMemo(
        () => new Set((selectedActivityIds.length ? selectedActivityIds : Array.from(matchingGuidIds)).map(Number)),
        [matchingGuidIds, selectedActivityIds],
    );
    const filteredActivities = useMemo(() => (gantt?.activities || []).filter((activity) => {
        if (onlyLinked && !activity.global_ids.length) return false;
        if (onlyCritical && !activity.critical) return false;
        if (!normalizedSearch) return true;
        return `${activity.code} ${activity.name} ${activity.global_ids.join(' ')}`.toLocaleLowerCase('es').includes(normalizedSearch);
    }), [gantt?.activities, normalizedSearch, onlyCritical, onlyLinked]);

    const scaleConfig = SCALE_OPTIONS[scale];
    const totalDays = gantt ? Math.max(1, Math.ceil(dayOffset(gantt.range_start, gantt.range_finish)) + 1) : 1;
    const timelineWidth = Math.max(900, Math.ceil(totalDays * scaleConfig.pixelsPerDay));
    const contentHeight = HEADER_HEIGHT + filteredActivities.length * ROW_HEIGHT;
    const firstRow = Math.max(0, Math.floor((viewport.scrollTop - HEADER_HEIGHT) / ROW_HEIGHT) - OVERSCAN);
    const visibleCount = Math.ceil(viewport.height / ROW_HEIGHT) + OVERSCAN * 2;
    const lastRow = Math.min(filteredActivities.length, firstRow + visibleCount);
    const visibleActivities = filteredActivities.slice(firstRow, lastRow);
    const indexById = useMemo(
        () => new Map(filteredActivities.map((activity, index) => [Number(activity.id), index])),
        [filteredActivities],
    );
    const visibleIdSet = useMemo(() => new Set(visibleActivities.map((activity) => Number(activity.id))), [visibleActivities]);
    const visibleDependencies = useMemo(() => (gantt?.dependencies || []).filter((dependency) =>
        visibleIdSet.has(Number(dependency.predecessor_activity_id)) && visibleIdSet.has(Number(dependency.successor_activity_id))),
    [gantt?.dependencies, visibleIdSet]);
    const ticks = useMemo(() => {
        if (!gantt) return [];
        const values = [];
        for (let offset = 0; offset < totalDays && values.length < 240; offset += scaleConfig.tickDays) {
            values.push({ offset, date: addDays(gantt.range_start, offset) });
        }
        return values;
    }, [gantt, scaleConfig.tickDays, totalDays]);
    const cutoffOffset = gantt && cutoff ? dayOffset(gantt.range_start, cutoff) : null;
    const cutoffX = cutoffOffset == null ? null : Math.min(timelineWidth, cutoffOffset * scaleConfig.pixelsPerDay);

    const centerActivity = useCallback((activityId) => {
        const index = indexById.get(Number(activityId));
        const node = scrollRef.current;
        if (index == null || !node) return;
        node.scrollTop = Math.max(0, HEADER_HEIGHT + index * ROW_HEIGHT - node.clientHeight / 2);
    }, [indexById]);

    useEffect(() => {
        const firstSelectedId = primaryActivityId || selectedActivityIds[0] || Array.from(matchingGuidIds)[0];
        if (firstSelectedId) centerActivity(firstSelectedId);
    }, [centerActivity, matchingGuidIds, primaryActivityId, selectedActivityIds]);

    const selectActivity = (activity, moveCutoff = false) => {
        onSelectActivity?.(activity);
        if (moveCutoff) onCutoffChange?.(dateOnly(activity.planned_start));
    };

    const handleTimelinePointer = (event) => {
        if (!gantt || event.target.closest('button')) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        const offset = Math.max(0, Math.min(totalDays - 1, Math.round((event.clientX - bounds.left) / scaleConfig.pixelsPerDay)));
        onCutoffChange?.(dateOnly(addDays(gantt.range_start, offset)));
    };

    return (
        <section className="flex h-full min-h-0 flex-col bg-white" data-bim-gantt data-bim-gantt-selected-activities={selectedIds.size} data-bim-gantt-selected-guid={selectedGuid}>
            <div className="flex min-h-11 shrink-0 items-center gap-2 border-b border-zinc-200 px-2.5 py-1.5">
                <CalendarRange className="h-4 w-4 shrink-0 text-[#F39200]" aria-hidden="true" />
                <select className="h-8 w-48 rounded-md border border-zinc-300 bg-white px-2 text-xs font-semibold text-zinc-700" aria-label="Línea base del Gantt BIM" value={baselineId} onChange={(event) => setBaselineId(event.target.value)}>
                    <option value="">Sin línea base</option>
                    {baselines.map((baseline) => <option key={baseline.id} value={baseline.id}>{baseline.revision} · {baseline.name}</option>)}
                </select>
                <label className="flex h-8 min-w-48 flex-1 items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-2 focus-within:border-[#F39200]">
                    <Search className="h-3.5 w-3.5 text-zinc-400" aria-hidden="true" />
                    <span className="sr-only">Buscar actividad 4D</span>
                    <input type="search" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Código, actividad o GlobalId" className="min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-zinc-400" />
                </label>
                <button type="button" onClick={() => setOnlyLinked((value) => !value)} className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs font-semibold ${onlyLinked ? 'border-[#F39200] bg-orange-50 text-[#b86d00]' : 'border-zinc-200 text-zinc-600 hover:border-[#F39200]'}`} aria-pressed={onlyLinked} title="Mostrar solo actividades vinculadas"><Link2 className="h-3.5 w-3.5" />Vinculadas</button>
                <button type="button" onClick={() => setOnlyCritical((value) => !value)} className={`inline-flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs font-semibold ${onlyCritical ? 'border-rose-300 bg-rose-50 text-rose-700' : 'border-zinc-200 text-zinc-600 hover:border-rose-300'}`} aria-pressed={onlyCritical} title="Mostrar solo ruta crítica"><Flame className="h-3.5 w-3.5" />Críticas</button>
                <label className="flex h-8 items-center gap-1 rounded-md border border-zinc-200 px-2 text-xs text-zinc-600"><ZoomIn className="h-3.5 w-3.5" /><span className="sr-only">Escala temporal</span><select value={scale} onChange={(event) => setScale(event.target.value)} className="bg-transparent font-semibold outline-none" aria-label="Escala del Gantt BIM">{Object.entries(SCALE_OPTIONS).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}</select></label>
                <button type="button" onClick={() => centerActivity(primaryActivityId || selectedActivityIds[0] || Array.from(matchingGuidIds)[0])} disabled={!selectedIds.size} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:border-[#F39200] hover:text-[#F39200] disabled:opacity-35" title="Centrar selección" aria-label="Centrar actividad seleccionada"><Crosshair className="h-3.5 w-3.5" /></button>
                <span className="whitespace-nowrap text-[10px] font-semibold tabular-nums text-zinc-500">{filteredActivities.length}/{gantt?.activities.length || 0} · {gantt?.critical_path_activity_ids.length || 0} críticas</span>
                {loading ? <LoaderCircle className="h-4 w-4 animate-spin text-zinc-400 motion-reduce:animate-none" aria-label="Cargando Gantt BIM" /> : null}
            </div>

            {gantt ? (
                <div
                    ref={scrollRef}
                    className="relative min-h-0 flex-1 overflow-auto bg-white gantt-native-scroll"
                    onScroll={(event) => setViewport({ scrollTop: event.currentTarget.scrollTop, height: event.currentTarget.clientHeight })}
                    data-bim-gantt-grid
                >
                    <div className="relative" style={{ width: LABEL_WIDTH + timelineWidth, height: contentHeight }}>
                        <div className="sticky top-0 z-30 flex h-8 border-b border-zinc-300 bg-zinc-50 text-[10px] font-semibold text-zinc-500">
                            <div className="sticky left-0 z-40 grid h-full shrink-0 grid-cols-[72px_minmax(0,1fr)_70px_70px_42px] items-center gap-2 border-r border-zinc-300 bg-zinc-50 px-2" style={{ width: LABEL_WIDTH }}>
                                <span>Código</span><span>Actividad</span><span>Inicio</span><span>Fin</span><span className="text-center">3D</span>
                            </div>
                            <div className="relative h-full shrink-0" style={{ width: timelineWidth }} onPointerDown={handleTimelinePointer}>
                                {ticks.map((tick) => <span key={tick.offset} className="absolute inset-y-0 border-l border-zinc-200 pl-1.5 pt-2" style={{ left: tick.offset * scaleConfig.pixelsPerDay }}>{formatShortDate(tick.date)}</span>)}
                            </div>
                        </div>

                        {cutoffX != null ? <div className="pointer-events-none absolute z-20 w-px bg-[#F39200]" style={{ left: LABEL_WIDTH + cutoffX, top: HEADER_HEIGHT, height: filteredActivities.length * ROW_HEIGHT }} data-bim-gantt-cutoff={cutoff} /> : null}

                        <svg className="pointer-events-none absolute z-10 overflow-visible" style={{ left: LABEL_WIDTH, top: HEADER_HEIGHT, width: timelineWidth, height: filteredActivities.length * ROW_HEIGHT }} aria-hidden="true">
                            {visibleDependencies.map((dependency) => {
                                const predecessor = filteredActivities[indexById.get(Number(dependency.predecessor_activity_id))];
                                const successor = filteredActivities[indexById.get(Number(dependency.successor_activity_id))];
                                if (!predecessor || !successor) return null;
                                const predecessorIndex = indexById.get(Number(predecessor.id));
                                const successorIndex = indexById.get(Number(successor.id));
                                const x1 = (dayOffset(gantt.range_start, predecessor.planned_finish) + 1) * scaleConfig.pixelsPerDay;
                                const x2 = dayOffset(gantt.range_start, successor.planned_start) * scaleConfig.pixelsPerDay;
                                const y1 = predecessorIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                                const y2 = successorIndex * ROW_HEIGHT + ROW_HEIGHT / 2;
                                const elbow = Math.max(x1 + 8, (x1 + x2) / 2);
                                return <path key={`${dependency.predecessor_activity_id}-${dependency.successor_activity_id}`} d={`M ${x1} ${y1} H ${elbow} V ${y2} H ${x2}`} fill="none" stroke="#a1a1aa" strokeWidth="1" />;
                            })}
                        </svg>

                        {visibleActivities.map((activity, localIndex) => {
                            const index = firstRow + localIndex;
                            const selected = selectedIds.has(Number(activity.id));
                            const primary = Number(primaryActivityId) === Number(activity.id);
                            const left = dayOffset(gantt.range_start, activity.planned_start) * scaleConfig.pixelsPerDay;
                            const width = Math.max(4, activity.duration_days * scaleConfig.pixelsPerDay);
                            return (
                                <div key={activity.id} className={`absolute left-0 flex border-b border-zinc-100 text-xs ${selected ? 'bg-blue-50/70' : 'bg-white hover:bg-zinc-50'}`} style={{ top: HEADER_HEIGHT + index * ROW_HEIGHT, width: LABEL_WIDTH + timelineWidth, height: ROW_HEIGHT }} data-bim-gantt-activity={activity.id} data-bim-gantt-activity-selected={selected}>
                                    <button type="button" onClick={() => selectActivity(activity)} className={`sticky left-0 z-20 grid h-full shrink-0 grid-cols-[72px_minmax(0,1fr)_70px_70px_42px] items-center gap-2 border-r px-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#F39200] ${primary ? 'border-r-[#F39200] bg-orange-50' : selected ? 'border-r-blue-400 bg-blue-50' : 'border-r-zinc-200 bg-inherit'}`} style={{ width: LABEL_WIDTH }} aria-label={`Seleccionar actividad ${activity.code}`}>
                                        <span className={`truncate font-semibold ${activity.critical ? 'text-rose-700' : 'text-zinc-700'}`}>{activity.code}</span>
                                        <span className="truncate text-zinc-700" title={activity.name}>{activity.name}</span>
                                        <span className="tabular-nums text-zinc-500">{formatShortDate(activity.planned_start)}</span>
                                        <span className="tabular-nums text-zinc-500">{formatShortDate(activity.planned_finish)}</span>
                                        <span className={`text-center font-semibold tabular-nums ${activity.global_ids.length ? 'text-blue-700' : 'text-zinc-300'}`}>{activity.global_ids.length}</span>
                                    </button>
                                    <div className="relative h-full shrink-0" style={{ width: timelineWidth }} onPointerDown={handleTimelinePointer}>
                                        {ticks.map((tick) => <span key={tick.offset} className="absolute inset-y-0 border-l border-zinc-100" style={{ left: tick.offset * scaleConfig.pixelsPerDay }} />)}
                                        <button
                                            type="button"
                                            onClick={() => selectActivity(activity, true)}
                                            className={`absolute top-2 h-4 min-w-1 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200] ${primary ? 'bg-[#F39200]' : selected ? 'bg-blue-600' : activity.critical ? 'bg-rose-500 hover:bg-rose-600' : 'bg-zinc-500 hover:bg-zinc-600'}`}
                                            style={{ left, width }}
                                            title={`${activity.name}: ${dateOnly(activity.planned_start)} - ${dateOnly(activity.planned_finish)} · ${activity.global_ids.length} elementos`}
                                            aria-label={`Seleccionar y situar ${activity.code}`}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ) : <div className="grid min-h-24 flex-1 place-items-center text-xs text-zinc-500">Seleccione una línea base BIM para visualizar la secuencia.</div>}
            {error ? <p className="shrink-0 border-t border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700" role="alert">{error}</p> : null}
        </section>
    );
}
