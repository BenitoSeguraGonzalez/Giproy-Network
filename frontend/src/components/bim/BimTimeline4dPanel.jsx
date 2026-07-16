import React, { useCallback, useEffect, useRef, useState } from 'react';
import { CalendarDays, Focus, LoaderCircle, Pause, Play, RotateCcw, StepBack, StepForward } from 'lucide-react';

import { bimModelsApi } from '../../api/bimModels';

const STATE_META = [
    ['not_started', 'Futuro', '#71717a'],
    ['in_progress', 'En ejecución', '#F39200'],
    ['completed', 'Completado', '#15803d'],
    ['delayed', 'Retrasado', '#be123c'],
    ['demolished', 'Demolido', '#52525b'],
];

const toDateInput = (value) => value ? new Date(value).toISOString().slice(0, 10) : '';
const dayDistance = (start, finish) => start && finish ? Math.max(0, Math.round((new Date(`${finish}T12:00:00Z`) - new Date(`${start}T12:00:00Z`)) / 86400000)) : 0;
const addDays = (value, amount) => { const next = new Date(`${value}T12:00:00Z`); next.setUTCDate(next.getUTCDate() + amount); return next.toISOString().slice(0, 10); };

const BimTimeline4dPanel = ({
    projectId,
    empresaId,
    onTimelineChange,
    onFocusGuid,
    externalCutoff,
    onCutoffChange,
    showActivityFocus = true,
    api = bimModelsApi,
}) => {
    const [enabled, setEnabled] = useState(false);
    const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
    const [timeline, setTimeline] = useState(null);
    const [playing, setPlaying] = useState(false);
    const [speed, setSpeed] = useState(1);
    const [selectedGuid, setSelectedGuid] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const timerRef = useRef(null);
    const requestRef = useRef(0);

    useEffect(() => {
        if (!externalCutoff) return;
        setDate(externalCutoff);
        setEnabled(true);
    }, [externalCutoff]);

    const commitDate = useCallback((nextDate) => {
        setDate(nextDate);
        onCutoffChange?.(nextDate);
    }, [onCutoffChange]);

    const loadTimeline = useCallback(async (nextDate) => {
        if (!enabled || !projectId || !nextDate) return;
        setLoading(true);
        setError('');
        const requestId = ++requestRef.current;
        try {
            const response = await api.get4dTimeline(projectId, `${nextDate}T12:00:00Z`, empresaId);
            if (requestId !== requestRef.current) return;
            setTimeline(response);
            onTimelineChange?.(response);
        } catch (requestError) {
            setError(requestError?.response?.data?.detail || 'No se pudo calcular la secuencia 4D.');
        } finally {
            setLoading(false);
        }
    }, [api, enabled, empresaId, onTimelineChange, projectId]);

    useEffect(() => {
        if (enabled) {
            void loadTimeline(date);
            return;
        }
        setPlaying(false);
        clearInterval(timerRef.current);
        timerRef.current = null;
        onTimelineChange?.(null);
    }, [date, enabled, loadTimeline, onTimelineChange]);
    useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

    const advance = useCallback((amount = 1) => {
        setDate((current) => {
            const boundary = amount > 0 ? toDateInput(timeline?.range_finish) : toDateInput(timeline?.range_start);
            if (boundary && ((amount > 0 && current >= boundary) || (amount < 0 && current <= boundary))) {
                setPlaying(false);
                onCutoffChange?.(boundary);
                return boundary;
            }
            const next = addDays(current, amount);
            const resolved = boundary && ((amount > 0 && next > boundary) || (amount < 0 && next < boundary)) ? boundary : next;
            onCutoffChange?.(resolved);
            return resolved;
        });
    }, [onCutoffChange, timeline?.range_finish, timeline?.range_start]);

    useEffect(() => {
        if (!playing) return undefined;
        timerRef.current = setInterval(() => advance(1), Math.max(150, 900 / speed));
        return () => { clearInterval(timerRef.current); timerRef.current = null; };
    }, [advance, playing, speed]);

    const togglePlayback = () => {
        if (playing) {
            setPlaying(false);
            return;
        }
        const finish = toDateInput(timeline?.range_finish);
        const start = toDateInput(timeline?.range_start);
        if (finish && date >= finish && start) commitDate(start);
        setPlaying(true);
    };

    const rangeStart = toDateInput(timeline?.range_start);
    const rangeFinish = toDateInput(timeline?.range_finish);
    const rangeDays = dayDistance(rangeStart, rangeFinish);
    const rangeValue = rangeStart ? Math.min(rangeDays, dayDistance(rangeStart, date)) : 0;
    const focusItems = (timeline?.items || []).filter((item) => item.global_id);

    const reset = () => {
        setPlaying(false);
        clearInterval(timerRef.current);
        timerRef.current = null;
        const start = toDateInput(timeline?.range_start) || new Date().toISOString().slice(0, 10);
        commitDate(start);
    };

    return (
        <section className="flex min-h-11 flex-wrap items-center gap-2 border-b border-zinc-200 bg-white px-2.5 py-2" data-bim-timeline-4d data-bim-timeline-enabled={enabled} data-bim-timeline-date={date}>
            <CalendarDays className="h-4 w-4 text-[#F39200]" aria-hidden="true" />
            <label className="inline-flex cursor-pointer items-center gap-1.5 text-xs font-semibold text-zinc-800">
                <input type="checkbox" checked={enabled} onChange={(event) => setEnabled(event.target.checked)} className="h-3.5 w-3.5 accent-[#F39200]" aria-label="Activar secuencia 4D" />
                Secuencia 4D
            </label>
            <label className="sr-only" htmlFor="bim-timeline-date">Fecha de corte 4D</label>
            <input id="bim-timeline-date" type="date" value={date} min={toDateInput(timeline?.range_start)} max={toDateInput(timeline?.range_finish)} onChange={(event) => commitDate(event.target.value)} disabled={!enabled} className="h-8 rounded-md border border-zinc-300 bg-white px-2 text-xs font-medium text-zinc-800 outline-none focus:border-[#F39200] focus:ring-2 focus:ring-orange-100 disabled:cursor-not-allowed disabled:bg-zinc-50 disabled:text-zinc-400" />
            <input type="range" min="0" max={rangeDays || 1} value={rangeValue} onChange={(event) => rangeStart && commitDate(addDays(rangeStart, Number(event.target.value)))} disabled={!enabled || !rangeDays} className="h-8 min-w-28 flex-1 accent-[#F39200] disabled:opacity-35" aria-label="Posición temporal 4D" aria-valuetext={date} />
            <div className="flex gap-1">
                <button type="button" onClick={togglePlayback} disabled={!enabled} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-35" title={playing ? 'Pausar secuencia' : 'Reproducir secuencia'} aria-label={playing ? 'Pausar secuencia 4D' : 'Reproducir secuencia 4D'}>{playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}</button>
                <button type="button" onClick={() => advance(-1)} disabled={!enabled} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-35" title="Retroceder un día" aria-label="Retroceder un día 4D"><StepBack className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => advance(1)} disabled={!enabled} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-35" title="Avanzar un día" aria-label="Avanzar un día 4D"><StepForward className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={reset} disabled={!enabled} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:border-[#F39200] hover:text-[#F39200] disabled:cursor-not-allowed disabled:opacity-35" title="Volver al inicio" aria-label="Reiniciar secuencia 4D"><RotateCcw className="h-3.5 w-3.5" /></button>
            </div>
            <select value={speed} onChange={(event) => setSpeed(Number(event.target.value))} disabled={!enabled} className="h-8 rounded-md border border-zinc-300 bg-white px-1.5 text-xs font-semibold text-zinc-700 disabled:opacity-35" aria-label="Velocidad de reproducción 4D"><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option><option value="4">4×</option></select>
            {showActivityFocus ? <div className="flex min-w-0 items-center gap-1"><select value={selectedGuid} onChange={(event) => setSelectedGuid(event.target.value)} disabled={!enabled || !focusItems.length} className="h-8 max-w-40 min-w-0 rounded-md border border-zinc-300 bg-white px-1.5 text-xs text-zinc-700 disabled:opacity-35" aria-label="Actividad visible 4D"><option value="">Actividad</option>{focusItems.map((item) => <option key={`${item.activity_snapshot_id}-${item.global_id}`} value={item.global_id}>{item.activity_code}</option>)}</select><button type="button" onClick={() => selectedGuid && onFocusGuid?.(selectedGuid)} disabled={!enabled || !selectedGuid} className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:border-[#F39200] hover:text-[#F39200] disabled:opacity-35" title="Enfocar actividad en modelo" aria-label="Enfocar actividad 4D"><Focus className="h-3.5 w-3.5" /></button></div> : null}
            <div className="ml-auto flex min-w-0 flex-wrap items-center justify-end gap-1.5">
                {STATE_META.map(([state, label, color]) => timeline?.counts?.[state] ? <span key={state} className="inline-flex h-6 items-center gap-1 rounded bg-zinc-50 px-1.5 text-[10px] font-semibold text-zinc-600" title={label}><span className="h-2 w-2 rounded-sm" style={{ backgroundColor: color }} />{timeline.counts[state]}</span> : null)}
                {loading ? <LoaderCircle className="h-3.5 w-3.5 animate-spin text-zinc-400" aria-label="Calculando secuencia 4D" /> : null}
            </div>
            {error ? <p className="basis-full text-xs font-medium text-rose-700" role="alert">{error}</p> : null}
        </section>
    );
};

export default BimTimeline4dPanel;
