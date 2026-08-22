import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const ganttSource = readFileSync('src/components/projects/CronogramaGantt.jsx', 'utf8');
const cronogramasSource = readFileSync('src/components/projects/Cronogramas.jsx', 'utf8');
const animatedSelectSource = readFileSync('src/components/ui/AnimatedSelect.jsx', 'utf8');
const gridColumnManagerSource = readFileSync('src/components/projects/GridColumnManager.jsx', 'utf8');
const controlRailSource = readFileSync('src/components/ui/ControlRail.jsx', 'utf8');

assert.match(
    ganttSource,
    /source:\s*'gantt_dependency_sequence'[\s\S]*?deferValoradoSync:\s*true/,
    'Crear una secuenciacion tarea-tarea debe pedir sincronizacion diferida del Valorado',
);

assert.match(
    ganttSource,
    /source:\s*'gantt_manual_milestone_sequence'[\s\S]*?deferValoradoSync:\s*true/,
    'Crear una secuenciacion con hito manual hacia tarea debe pedir sincronizacion diferida del Valorado',
);

assert.match(
    ganttSource,
    /source:\s*'gantt_predecessor_shortcode'[\s\S]*?deferValoradoSync:\s*true/,
    'Editar Predecesoras por shortcode debe usar commit delta/diferido igual que la secuenciacion grafica',
);

assert.match(
    ganttSource,
    /const rawMilestoneStart = configDraft\?\.fecha_inicio_proyecto \|\| fallbackProjectStartDate \|\| anchorRow\?\.start_date \|\| null;[\s\S]*?shiftToGanttWorkingDateTime\(rawMilestoneStart,\s*configDraft,\s*1\)[\s\S]*?start_date:\s*defaultMilestoneStart/,
    'Crear un hito manual debe alinear su fecha inicial al calendario laboral activo, no dejarlo a medianoche',
);

assert.match(
    ganttSource,
    /setDependencyShortcodeDrafts\(\(prev\) => \(\{[\s\S]*?\[normalizedTargetId\]: optimisticShortcodeValue[\s\S]*?applyDraftPatches\(accumulatedPatches\);/,
    'El commit textual de Predecesoras debe mantener estado optimista y aplicar el parche local antes del await backend',
);

assert.match(
    ganttSource,
    /const resolveAdjacentDependencyShortcodeLineId = useCallback[\s\S]*?Math\.max\(currentIndex \+ Number\(direction \|\| 0\), 0\)[\s\S]*?editableLineIds\.length - 1/,
    'La navegacion vertical de Predecesoras debe limitarse entre la primera y ultima celda editable',
);

assert.match(
    ganttSource,
    /event\.key === 'Enter'[\s\S]*?focusDependencyShortcodeInput\(normalizedLineId,\s*\{\s*select:\s*false\s*\}\)/,
    'Enter en Predecesoras debe aceptar el valor y quedarse editando la misma celda',
);

assert.match(
    ganttSource,
    /event\.key === 'ArrowUp' \|\| event\.key === 'ArrowDown'[\s\S]*?resolveAdjacentDependencyShortcodeLineId\(normalizedLineId,\s*direction\)[\s\S]*?focusDependencyShortcodeInput\(nextLineId\)/,
    'Cursor arriba/abajo en Predecesoras debe aceptar el valor y saltar a la celda editable anterior/siguiente',
);

assert.match(
    ganttSource,
    /onFocus=\{\(event\) => \{[\s\S]*?setSelectedTaskId\(lineId\);[\s\S]*?setDependencyShortcodeEditingRowId\(lineId\);/,
    'Al enfocar una celda de Predecesoras, la tarea activa debe sincronizarse con esa fila',
);

assert.match(
    ganttSource,
    /const buildDependencyShortcodeSemanticSignature = useCallback[\s\S]*?normalizeDependencyType\(dependency\.type\)[\s\S]*?normalizeDependencyLagUnit\(dependency\.lag_unit \|\| 'day'\)/,
    'Predecesoras debe comparar semanticamente dependencias equivalentes antes de guardar',
);

assert.match(
    ganttSource,
    /const isSameDependencyState = !currentSignature\.error[\s\S]*?currentSignature\.signature === persistedSignature\.signature[\s\S]*?if \(isSameDependencyState \|\| String\(currentValue \|\| ''\)\.trim\(\) === String\(persistedValue \|\| ''\)\.trim\(\)\)/,
    'Predecesoras no debe disparar commit si el valor normalizado no cambia',
);

assert.match(
    ganttSource,
    /const buildGanttWorkdayAutoSegmentConnectors = \([\s\S]*?filter\(isGanttWorkdayAutoSegment\)[\s\S]*?visualRightPx[\s\S]*?nextSegment\.visualLeftPx/,
    'Gantt debe calcular conectores visuales solo para subtramos automaticos de calendario laboral',
);

assert.match(
    ganttSource,
    /buildGanttWorkdayAutoSegmentConnectors\(displayedOperationalSubbars,\s*visibleBarLeftPx,\s*visibleBarWidthPx\)\.map[\s\S]*?workday-connector[\s\S]*?height:\s*'1px'/,
    'Gantt debe renderizar una linea sutil entre subtramos automaticos consecutivos',
);

assert.match(
    ganttSource,
    /onSaveTrabajoLine\(row,\s*built\.payload,\s*options\)/,
    'El guardado puntual del Gantt debe reenviar opciones de commit al contenedor',
);

assert.match(
    ganttSource,
    /onSaveTrabajoDraftBatch\(linePayloadMap,\s*options\)/,
    'El guardado por lote del Gantt debe reenviar opciones de commit al contenedor',
);

assert.match(
    cronogramasSource,
    /const scheduleDeferredValoradoSyncFromGantt = useCallback/,
    'El contenedor debe centralizar la sincronizacion diferida del Valorado',
);

assert.match(
    cronogramasSource,
    /window\.setTimeout\(\(\) => \{[\s\S]*?syncValoradoFromGanttSilently/,
    'La sincronizacion del Valorado debe ejecutarse en segundo plano y no en el await principal',
);

assert.match(
    cronogramasSource,
    /if \(options\?\.deferValoradoSync\) \{[\s\S]*?scheduleDeferredValoradoSyncFromGantt[\s\S]*?return updated;/,
    'Cuando el commit pide diferir Valorado, el guardado debe devolver el Gantt actualizado antes de sincronizar Valorado',
);

assert.match(
    cronogramasSource,
    /const commitTrabajoSchedulePayload = async \(payload,\s*options = \{\}\) =>[\s\S]*?cronogramasApi\.updateTrabajoDelta\(resolvedBudgetId,\s*payload,\s*empId\)/,
    'El commit diferido de secuenciacion debe usar el endpoint delta para no descargar la respuesta completa',
);

assert.match(
    cronogramasSource,
    /Number\(error\?\.response\?\.status\) !== 404[\s\S]*?cronogramasApi\.updateTrabajo\(resolvedBudgetId,\s*payload,\s*empId\)/,
    'Si el endpoint delta devuelve 404, el Gantt debe reintentar por el commit completo existente antes de fallar',
);

assert.match(
    cronogramasSource,
    /const mergeCronogramaTrabajoDeltaResponse = \(previous,\s*delta\) =>/,
    'El contenedor debe fusionar respuestas delta sobre el Gantt vigente',
);

assert.match(
    cronogramasSource,
    /const reuseStableCronogramaTrabajoResponse = \(previous,\s*updated\) =>/,
    'El contenedor debe estabilizar filas equivalentes para reducir renders tras la respuesta backend',
);

assert.match(
    cronogramasSource,
    /const updated = await commitTrabajoSchedulePayload\(payload,\s*options\);[\s\S]*?if \(cronograma\?\.distribution_mode === 'gantt'\)/,
    'El commit de linea/lote debe aplicar delta o fallback completo antes de programar Valorado diferido',
);

assert.match(
    cronogramasSource,
    /if \(normalized === 'FC'\) return 'FS';[\s\S]*?if \(normalized === 'CC'\) return 'SS';[\s\S]*?if \(normalized === 'CF'\) return 'SF';/,
    'El contenedor debe aceptar aliases visibles FC/CC/CF sin convertirlos a otro tipo interno',
);

assert.match(
    cronogramasSource,
    /const normalizeTrabajoDependencyLagUnit = \(value\) =>[\s\S]*?return 'minute';[\s\S]*?return 'percent';/,
    'El contenedor debe conservar unidades minute/percent de shortcodes para no convertir porcentajes en dias',
);

assert.match(
    cronogramasSource,
    /lag_unit:\s*normalizeTrabajoDependencyLagUnit\(dependency\?\.lag_unit \|\| dependency\?\.lagUnit \|\| 'day'\)[\s\S]*?lag_mode:/,
    'El payload de guardado debe persistir lag_unit y lag_mode reales de dependencias FF/CC con adelanto o porcentaje',
);

assert.match(
    animatedSelectSource,
    /dropdownHeader = null[\s\S]*?\{dropdownHeader\}/,
    'AnimatedSelect debe permitir cabecera custom para desplegables con visual de botonera oscura',
);

assert.match(
    ganttSource,
    /dropdownClassName="!rounded-\[1\.25rem\][\s\S]*?!bg-\[#11141a\][\s\S]*?dropdownHeader=\{\(/,
    'El selector temporal del Gantt debe usar panel oscuro tipo gestor de columnas y no el desplegable blanco base',
);

assert.match(
    ganttSource,
    /<div[\s\S]*?animate-in fade-in slide-in-from-top-1 zoom-in-95[\s\S]*?motion-reduce:animate-none[\s\S]*?Herramientas[\s\S]*?min-h-\[46px\][\s\S]*?Factory reset/,
    'El menu de herramientas del Gantt debe abrir animado por CSS, respetar movimiento reducido y usar filas oscuras tipo tarjeta',
);

assert.match(
    ganttSource,
    /gantt-dark-scrollbar max-h-\[20rem\][\s\S]*?listClassName="gantt-dark-scrollbar mb-2[\s\S]*?optionTitle=\{false\}/,
    'Los desplegables oscuros deben usar scrollbar oscuro y el selector temporal no debe mostrar tooltip nativo en sus opciones',
);

assert.match(
    animatedSelectSource,
    /optionTitle = true[\s\S]*?title=\{typeof optionTitle === 'function'/,
    'AnimatedSelect debe permitir desactivar el title nativo por opción cuando el diseño ya contiene suficiente contexto',
);

assert.match(
    controlRailSource,
    /rounded-\[0\.7rem\][\s\S]*?border-white\/20[\s\S]*?bg-\[#0b0d11\]/,
    'Los tooltips de botonera oscura deben tener borde claro sutil para separarse del skin oscuro',
);

assert.match(
    ganttSource,
    /ControlRailTooltip key=\{mode\.id\} content=\{`\$\{mode\.label\}: \$\{count\}`\}/,
    'Los semaforos superiores de ruta critica deben usar ControlRailTooltip y no title nativo del navegador',
);

assert.match(
    gridColumnManagerSource,
    /gantt-dark-scrollbar mt-2 max-h-\[20rem\]/,
    'El desplegable de columnas debe usar scrollbar oscuro y no el scrollbar claro nativo',
);

assert.match(
    ganttSource,
    /sticky top-0 z-\[130\] grid min-h-\[54px\][\s\S]*?border-\[#ececec\][\s\S]*?bg-\[#f2f2f0\]/,
    'El header compacto del grid izquierdo debe usar el lenguaje visual claro de Datos de Proyecto',
);

assert.match(
    ganttSource,
    /sticky top-0 z-\[120\] flex min-h-\[54px\][\s\S]*?border-\[#ececec\][\s\S]*?bg-\[#f2f2f0\]/,
    'El header compacto del timeline derecho debe usar el lenguaje visual claro de Datos de Proyecto',
);

assert.match(
    ganttSource,
    /style=\{\{ top: GANTT_VERTICAL_SCROLLBAR_BODY_TOP_PX, bottom: GANTT_HORIZONTAL_SCROLLBAR_RESERVED_PX \}\}[\s\S]*?<MotionScrollbar targetRef=\{gridViewportRef\} className="pointer-events-auto right-0" style=\{\{ top: 0, bottom: 0 \}\}/,
    'El scrollbar vertical del grid izquierdo debe vivir en una capa de cuerpo bajo la cabecera, no encima del header',
);

assert.match(
    ganttSource,
    /style=\{\{ top: GANTT_VERTICAL_SCROLLBAR_BODY_TOP_PX, bottom: GANTT_HORIZONTAL_SCROLLBAR_RESERVED_PX \}\}[\s\S]*?<MotionScrollbar targetRef=\{timelineViewportRef\} className="pointer-events-auto right-0" style=\{\{ top: 0, bottom: 0 \}\}/,
    'El scrollbar vertical del timeline derecho debe vivir en una capa de cuerpo bajo la cabecera, no encima del header',
);

assert.match(
    gridColumnManagerSource,
    /import \{ motion \} from 'framer-motion';[\s\S]*?<motion\.div/,
    'El gestor de columnas debe conservar la visual oscura y abrir con animacion spring',
);

console.log('smoke-cronogramas-gantt-sequence-commit: ok');
