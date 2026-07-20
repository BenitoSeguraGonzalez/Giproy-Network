import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cronogramasSource = readFileSync(new URL('../src/components/projects/Cronogramas.jsx', import.meta.url), 'utf8');
const ganttSource = readFileSync(new URL('../src/components/projects/CronogramaGantt.jsx', import.meta.url), 'utf8');
const cronogramasApiSource = readFileSync(new URL('../src/api/cronogramas.js', import.meta.url), 'utf8');
const reportingApiSource = readFileSync(new URL('../src/api/reporting.js', import.meta.url), 'utf8');
const reportPreviewModalSource = readFileSync(new URL('../src/components/reporting/CommonReportPreviewModal.jsx', import.meta.url), 'utf8');
const apusApiSource = readFileSync(new URL('../src/api/apus.js', import.meta.url), 'utf8');
const basesTrabajoApiSource = readFileSync(new URL('../src/api/basesTrabajo.js', import.meta.url), 'utf8');
const presupuestosApiSource = readFileSync(new URL('../src/api/presupuestos.js', import.meta.url), 'utf8');
const cronogramaTrabajoServiceSource = readFileSync(new URL('../../backend/app/services/cronograma_trabajo.py', import.meta.url), 'utf8');
const operationalNumbersSource = readFileSync(new URL('../src/utils/operationalNumbers.js', import.meta.url), 'utf8');

for (const [name, source] of [
    ['Cronogramas', cronogramasSource],
    ['CronogramaGantt', ganttSource],
]) {
    assert.equal(
        source.includes('axiosConfig'),
        false,
        `${name} no debe importar axiosConfig directamente en MODO 1`,
    );
}

for (const importStatement of [
    "import { proyectoDetalleApi } from '../../api/proyectoDetalle';",
    "import { presupuestosApi } from '../../api/presupuestos';",
    "import { cronogramasApi } from '../../api/cronogramas';",
    "import { edtApi } from '../../api/edt';",
    "import reportingApi from '../../api/reporting';",
]) {
    assert.equal(
        cronogramasSource.includes(importStatement),
        true,
        `Cronogramas debe conservar cliente API: ${importStatement}`,
    );
}

for (const importStatement of [
    "import { apusApi } from '../../api/apus';",
    "import { basesTrabajoApi } from '../../api/basesTrabajo';",
    "import { presupuestosApi } from '../../api/presupuestos';",
]) {
    assert.equal(
        ganttSource.includes(importStatement),
        true,
        `CronogramaGantt debe conservar cliente API: ${importStatement}`,
    );
}

for (const token of [
    'const empId = project?.empresa_id || selectedEmpresa?.id || user?.empresa_id || null;',
    'cronogramasApi.getValorado(resolvedBudgetId, empId)',
    'cronogramasApi.getRecursos(resolvedBudgetId, empId)',
    'cronogramasApi.getRecursosState(resolvedBudgetId, empId)',
    'cronogramasApi.updateRecursosState(',
    "cronogramasApi.getTrabajo(resolvedBudgetId, empId, { compact: true, metadataMode: 'summary' })",
    'cronogramasApi.resetIntegral(resolvedBudgetId, empId)',
    'cronogramasApi.updateValoradoLinea(resolvedBudgetId, row.linea_id, {',
    'cronogramasApi.updateValoradoLinea(resolvedBudgetId, lineaId, {',
    'cronogramasApi.updateValoradoConfig(resolvedBudgetId, {',
    'cronogramasApi.resetValoradoLinea(resolvedBudgetId, row.linea_id, empId)',
    'cronogramasApi.updateTrabajo(resolvedBudgetId, payload, empId)',
    'cronogramasApi.updateTrabajoDelta(resolvedBudgetId, payload, empId)',
    'cronogramasApi.getTrabajoLineMetadata(',
    'cronogramasApi.reloadTrabajoHolidayCalendar(resolvedBudgetId, empId)',
    'cronogramasApi.resetTrabajoHolidayCalendar(resolvedBudgetId, empId)',
    'cronogramasApi.addTrabajoHolidayCalendarManual(resolvedBudgetId, payload, empId)',
    'cronogramasApi.removeTrabajoHolidayCalendarDay(resolvedBudgetId, payload, empId)',
    'reportingApi.previewReport({',
    'reportingApi.exportReport({',
    "await handleOpenCronogramaValoradoReport('resources');",
    "await handleOpenCronogramaValoradoReport('resources_range', {",
    'filters: reportPreview?.filters || undefined,',
    "if (variant === 'resources' || variant === 'resource_usage' || variant === 'uso_recursos' || variant === 'uso_de_recursos') return 'Uso de Recursos';",
    "if (variant === 'resources_range' || variant === 'resource_usage_range' || variant === 'uso_recursos_rango') return 'Uso de Recursos por Rango';",
    'cronogramasApi.exportTrabajoMsProject(resolvedBudgetId, empId, normalizedFormat, false)',
    'cronogramasApi.importTrabajoMsProject(resolvedBudgetId, file, empId)',
]) {
    assert.equal(
        cronogramasSource.includes(token),
        true,
        `Cronogramas debe conservar uso critico de API: ${token}`,
    );
}

for (const token of [
    "{ id: 'recursos', label: 'Recursos' }",
    "scheduleTab === 'recursos'",
    'CronogramaRecursosReadOnly',
    'recursosState={cronogramaRecursosState}',
    'stateError={cronogramaRecursosStateError}',
    'onLimitChange={handleCronogramaRecursosLimitChange}',
    'onSaveState={handleSaveCronogramaRecursosState}',
    'manual_limits',
    'overloadSummary',
    'Exceso {formatNumber(capacityStatus.excess, decCalculos)}',
    'levelingSimulation',
    'Simulación',
    'levelingSimulation.moves.length',
    'resolvedQuantity',
    'unresolvedQuantity',
    'leveling_proposal',
    'onPersistLevelingProposal',
    'handlePersistCronogramaRecursosLevelingProposal',
    'Aprobar propuesta',
    'handleApproveCronogramaRecursosLevelingProposal',
    "status: 'approved'",
    'approved_at',
    'applied: false',
    'applicationPreview',
    'applicationPreview ?',
    'Propuesta aprobada',
    'No se modifico el Gantt',
    'leveling_application_intent',
    'Preparar aplicacion',
    'handleRequestCronogramaRecursosLevelingApplication',
    'ready_to_apply',
    'not_applied_to_gantt_valorado_flujo',
    'leveling_application_result',
    'Aplicar en Recursos',
    'handleApplyCronogramaRecursosLevelingApplication',
    'handleRollbackCronogramaRecursosLevelingApplication',
    'resources_state_only',
    'rollback_snapshot',
    'applied_to_resources',
    'sectionLabel="Uso de Recursos"',
    'title="Reportes de Recursos"',
    "await handleOpenCronogramaValoradoReport('resources');",
    "Uso de Recursos por rango",
    'resourceRangeDraft',
    'handleSubmitResourceRangeReport',
    'cronogramaRecursosLoading',
]) {
    assert.equal(
        cronogramasSource.includes(token),
        true,
        `Cronogramas debe conservar la vista operacional Recursos: ${token}`,
    );
}

for (const token of [
    'buildGanttScheduleConfigWithHolidayCalendar',
    'const holidayCalendar = trabajo?.holiday_calendar || null;',
    '() => buildGanttScheduleConfigWithHolidayCalendar(configDraft, holidayCalendar)',
    'resolveGanttRowsWithDependencySchedule(rows, drafts, scheduleConfig)',
    'resolveDependencyTargetStart(sourceRow, sourceDraft, targetRow, targetDraft, dependency, scheduleConfig)',
    'resolveGanttRowFinishDate(row, draft, scheduleConfig)',
    'buildGanttSubbarVisuals(row, draft, timelineSegments, segmentColumnWidth, scheduleConfig',
    'buildBarGeometry(geometryRow, timelineSegments, segmentColumnWidth, scheduleConfig)',
]) {
    assert.equal(
        ganttSource.includes(token),
        true,
        `CronogramaGantt debe calcular Gantt clasico con calendario oficial fusionado: ${token}`,
    );
}

assert.equal(
    (cronogramasSource.match(/Uso de Recursos/g) || []).length >= 3,
    true,
    'Cronogramas debe exponer Reporte > Uso de Recursos en la capa clasica',
);

for (const token of [
    "item?.preview_layout === 'resource_usage'",
    'renderResourceUsagePreview(item, index)',
    'renderReportWarnings(item,',
    'border-amber-200 bg-amber-50',
    'Reporte estrella',
    'Recursos finales consolidados, concentracion de costo y periodos de mayor demanda.',
    'Listado ejecutivo consolidado',
    'Todos los recursos finales, sin detallar la matriz periodo por periodo.',
]) {
    assert.equal(
        reportPreviewModalSource.includes(token),
        true,
        `CommonReportPreviewModal debe conservar preview GiProy especializado de Uso de Recursos: ${token}`,
    );
}

assert.equal(
    ganttSource.includes('const tenantEmpresaId = selectedBudget?.empresa_id || detail?.empresa_id || project?.empresa_id || user?.empresa_id || null;'),
    true,
    'CronogramaGantt debe conservar resolucion de empresa activa',
);

assert.equal(
    ganttSource.includes("import GanttParetoModal from './GanttParetoModal';"),
    false,
    'CronogramaGantt no debe cargar GanttParetoModal de forma eager en el chunk inicial del Gantt',
);

assert.equal(
    ganttSource.includes("const GanttParetoModal = React.lazy(() => import('./GanttParetoModal'));"),
    true,
    'CronogramaGantt debe diferir GanttParetoModal hasta abrir Pareto',
);

assert.match(
    ganttSource,
    /\{paretoOpen \? \([\s\S]*?<React\.Suspense fallback=\{null\}>[\s\S]*?<GanttParetoModal[\s\S]*?<\/React\.Suspense>[\s\S]*?\) : null\}/,
    'CronogramaGantt debe montar GanttParetoModal solo cuando paretoOpen=true',
);

assert.match(
    ganttSource,
    /const GANTT_WORKSPACE_MIN_HEIGHT_PX = 260;[\s\S]*?const safeAvailableHeight = Math\.max\(GANTT_WORKSPACE_MIN_HEIGHT_PX, Number\(ganttAvailableHeight \|\| 0\)\);[\s\S]*?return safeAvailableHeight;/,
    'CronogramaGantt debe usar toda la altura disponible aunque el proyecto tenga pocas lineas',
);

assert.match(
    ganttSource,
    /const visualBottomFillPx = Math\.max\([\s\S]*?visualBodyHeightPx - Number\(rowVirtualMetrics\.totalHeight \|\| 0\)[\s\S]*?const rowVirtualBottomSpacerPx = Math\.max\([\s\S]*?Number\(rowVirtualWindow\.bottomSpacerPx \|\| 0\) \+ visualBottomFillPx/,
    'CronogramaGantt debe extender visualmente el spacer final cuando las filas no llenan el viewport',
);

assert.equal(
    /const visibleRowCount = Math\.max\(rows\.length/.test(ganttSource),
    false,
    'CronogramaGantt no debe recortar el alto del workspace segun cantidad de lineas',
);

assert.equal(
    ganttSource.includes('if (line?.apu_hijo_id || resource?.apu_hijo_id || resource?.isApu) return 2;'),
    true,
    'CronogramaGantt debe mostrar APUs anidados dentro de Materiales en el editor de recursos',
);

assert.match(
    ganttSource,
    /anidado:\s*\{[\s\S]*?descriptionClassName:\s*'text-\[#8A6A2A\]'[\s\S]*?unitClassName:\s*'text-\[#8A6A2A\]'[\s\S]*?badgeClassName:\s*'text-\[#8A6A2A\]'[\s\S]*?\},\s*consolidado:/,
    'CronogramaGantt debe usar un color sobrio no rojo para recursos anidados',
);

assert.doesNotMatch(
    ganttSource,
    /anidado:\s*\{[\s\S]*?text-\[#E94E1B\][\s\S]*?\},\s*consolidado:/,
    'CronogramaGantt no debe usar rojo/naranja de alerta para recursos anidados',
);

assert.match(
    ganttSource,
    /const handleRendimientoChange = \(itemId, rawValue\) => \{[\s\S]*?setResourceDrafts\(\(prev\) => \(\{ \.\.\.prev, \[itemId\]: normalized \}\)\);[\s\S]*?\r?\n    \};\r?\n\r?\n    const handleResourceQuantityChange/s,
    'CronogramaGantt debe permitir escribir rendimiento sin persistir/formatear metadata en cada tecla',
);

assert.match(
    ganttSource,
    /const handleResourceQuantityChange = \(itemId, rawValue\) => \{[\s\S]*?setResourceQuantityDrafts\(\(prev\) => \(\{ \.\.\.prev, \[itemId\]: normalized \}\)\);[\s\S]*?\r?\n    \};\r?\n\r?\n    const handleResourceQuantityBlur/s,
    'CronogramaGantt debe permitir escribir cantidad sin persistir/formatear metadata en cada tecla',
);

assert.match(
    ganttSource,
    /const handleResourceQuantityBlur = \(itemId\) => \{[\s\S]*?persistLockedResourceQuantityDraft\(itemId, lockedValues\.cantidad, newRendimiento\);[\s\S]*?persistResourceQuantityDraft\(itemId, normalized\);[\s\S]*?const handleRendimientoBlur = \(itemId\) => \{[\s\S]*?persistRendimientoDraft\(itemId, normalized\);/s,
    'CronogramaGantt debe persistir cantidad y rendimiento al confirmar la entrada',
);

assert.match(
    ganttSource,
    /const lockedValues = item\.lockRendimiento[\s\S]*?resolveLockedOperationalResourceValues\([\s\S]*?const activeRendimiento = lockedValues\?\.rendimiento[\s\S]*?const activeTimeHours = lockedValues\?\.trabajoRelativo/s,
    'CronogramaGantt debe derivar rendimiento y trabajo desde el invariante de recursos explotados',
);

assert.match(
    operationalNumbersSource,
    /export const resolveOperationalRelativeWork[\s\S]*?source_lines[\s\S]*?trabajo_relativo[\s\S]*?export const resolveLockedOperationalResourceValues[\s\S]*?relativeWork \/ activeQuantity/s,
    'La politica numerica debe conservar trabajo relativo y derivar rendimiento al cambiar cantidad',
);

assert.match(
    cronogramaTrabajoServiceSource,
    /def _normalize_exploded_operational_snapshot[\s\S]*?source_lines[\s\S]*?trabajo_relativo[\s\S]*?relative_work \/ quantity/s,
    'El backend debe normalizar universalmente snapshots explotados con trabajo relativo fijo',
);

assert.match(
    ganttSource,
    /const activeResourceInputRef = useRef\(null\);[\s\S]*?const activeInputKey = activeResourceInputRef\.current;[\s\S]*?activeInputKey\?\.startsWith\('rendimiento:'\)[\s\S]*?activeInputKey\?\.startsWith\('cantidad:'\)/s,
    'CronogramaGantt debe conservar el texto del input activo durante la sincronizacion del editor light',
);

assert.match(
    ganttSource,
    /onFocus=\{\(event\) => \{[\s\S]*?activeResourceInputRef\.current = `cantidad:\$\{item\.id\}`;[\s\S]*?event\.currentTarget\.select\(\);[\s\S]*?onFocus=\{\(event\) => \{[\s\S]*?activeResourceInputRef\.current = `rendimiento:\$\{item\.id\}`;[\s\S]*?event\.currentTarget\.select\(\);/s,
    'CronogramaGantt debe marcar foco activo en cantidad y rendimiento para evitar autoformateo mientras se escribe',
);

assert.match(
    ganttSource,
    /const cancelledResourceInputRef = useRef\(null\);[\s\S]*?cancelledResourceInputRef\.current === inputKey[\s\S]*?cancelledResourceInputRef\.current = `cantidad:\$\{item\.id\}`;[\s\S]*?cancelledResourceInputRef\.current = `rendimiento:\$\{item\.id\}`;/s,
    'CronogramaGantt debe permitir cancelar edicion con Escape sin persistir el valor parcial',
);

assert.match(
    ganttSource,
    /const resourceEditorSessionRef = useRef\(\{ active: false, lineId: null \}\);[\s\S]*?resourceEditorSessionRef\.current = \{ active: true, lineId \};[\s\S]*?const handleCancelResourceEditor = async \(\) => \{[\s\S]*?resourceEditorSessionRef\.current = \{ active: false, lineId: null \};[\s\S]*?resourceEditorDraftSnapshotRef\.current = \{ lineId: null, draft: null \};/s,
    'CronogramaGantt debe invalidar la sesion del editor antes de restaurar el borrador al cancelar',
);

assert.match(
    ganttSource,
    /onChangeDraftMetadata=\{\(metadataPatch\) => \{[\s\S]*?const session = resourceEditorSessionRef\.current;[\s\S]*?if \(!session\.active \|\| session\.lineId !== lineId\) return;[\s\S]*?updateDraft\(lineId, \{ metadata: metadataPatch \}\);/s,
    'CronogramaGantt debe ignorar sincronizaciones tardias despues de cancelar el editor light',
);

assert.match(
    ganttSource,
    /const \[resourceEditorSessionVersion, setResourceEditorSessionVersion\] = useState\(0\);[\s\S]*?setResourceEditorSessionVersion\(\(current\) => current \+ 1\);[\s\S]*?<GanttResourceEditorModal[\s\S]*?key=\{`\$\{resourceEditorRowId \|\| 'closed'\}:\$\{resourceEditorSessionVersion\}`\}/s,
    'CronogramaGantt debe crear una instancia local limpia del editor light en cada apertura',
);

assert.match(
    ganttSource,
    /const \[resourceEditorResetVersion, setResourceEditorResetVersion\] = useState\(0\);[\s\S]*?handleResetResourceEditorDraft[\s\S]*?setResourceEditorResetVersion\(\(current\) => current \+ 1\);[\s\S]*?resetVersion=\{resourceEditorResetVersion\}/s,
    'CronogramaGantt debe notificar explicitamente al modal cuando restaura los datos iniciales',
);

assert.match(
    ganttSource,
    /lastResourceEditorResetVersionRef\.current !== resetVersion[\s\S]*?activeResourceInputRef\.current = null;[\s\S]*?cancelledResourceInputRef\.current = null;[\s\S]*?resetVersion, visibleResourceLines/s,
    'El editor light debe invalidar el input activo y reconstruir su tabla local al restaurar',
);

assert.equal(
    ganttSource.includes("const typeLabel = line?.recurso ? 'Recurso' : (line?.apu_hijo ? 'APU hijo' : 'Insumo');"),
    true,
    'CronogramaGantt debe conservar la etiqueta APU hijo aunque lo agrupe como Materiales',
);

assert.equal(
    ganttSource.includes("const APU_OPERATIONAL_RESOURCES_METADATA_KEY = 'apu_operational_resources_v1';"),
    true,
    'CronogramaGantt debe transportar el snapshot operativo de APU para recursos explotados',
);

assert.equal(
    ganttSource.includes("const APU_RESOURCE_MODIFICATIONS_CONFIG_KEY = 'apu_resource_modifications_v1';"),
    true,
    'CronogramaGantt debe conservar una base de modificaciones activa por APU en la revision',
);

assert.equal(
    ganttSource.includes("const GANTT_RESOURCE_QUANTITY_DRAFTS_KEY = 'gantt_resource_quantity_drafts_v1';"),
    true,
    'CronogramaGantt debe persistir cantidades de recurso del editor ligero sin tocar cantidad de presupuesto',
);

assert.equal(
    ganttSource.includes('Guardar borrador operativo del APU'),
    true,
    'CronogramaGantt debe confirmar explicitamente que el cambio del editor ligero queda como borrador operativo',
);

assert.equal(
    ganttSource.includes('Aplicar modificación global del APU'),
    false,
    'CronogramaGantt no debe prometer aplicacion global desde el editor ligero',
);

assert.match(
    ganttSource,
    /onSaveGanttDraftIntention\(\{[\s\S]*?preview_snapshot:[\s\S]*?line_payload_map:[\s\S]*?previousPreviewLinePayloadMap[\s\S]*?linePayloadMap/s,
    'CronogramaGantt debe guardar intenciones del editor ligero como borrador Gantt acumulado',
);

assert.match(
    ganttSource,
    /onPreflightGanttDraftApply[\s\S]*?executeApproveCurrentGantt[\s\S]*?preflight\.ok === false[\s\S]*?Borrador Gantt no aplicable/s,
    'CronogramaGantt debe bloquear la confirmacion global si el preflight del borrador detecta invalidaciones',
);

assert.match(
    ganttSource,
    /onSyncValoradoFromGantt\?\.\([\s\S]*?source: 'gantt_approval'[\s\S]*?onMarkGanttDraftApplied\(\{[\s\S]*?application_result[\s\S]*?persisted_line_ids: persisted\.lineIds/s,
    'CronogramaGantt debe marcar el borrador aplicado solo despues de persistir, sincronizar y enviar firma de aplicacion global',
);

assert.match(
    cronogramasSource,
    /ganttDraftInvalidatedCount[\s\S]*?handleDiscardInvalidatedGanttDraft[\s\S]*?discardInvalidatedTrabajoGanttDraft[\s\S]*?invalidada\(s\) · descartar/s,
    'Cronogramas debe mostrar y permitir descartar lineas invalidadas del borrador Gantt sin tocar intenciones compatibles',
);

assert.match(
    cronogramasSource,
    /ganttDraftAdjustmentRequiredCount[\s\S]*?handlePrepareInvalidatedGanttDraftAdjustment[\s\S]*?prepareInvalidatedTrabajoGanttDraftAdjustment[\s\S]*?invalidada\(s\) · reajustar[\s\S]*?por reajustar · abrir editor/s,
    'Cronogramas debe permitir preparar reajuste de lineas invalidadas sin reutilizar valores derivados antiguos',
);

assert.match(
    ganttSource,
    /backendManagedLineIds[\s\S]*?delete nextDrafts\[String\(lineId\)\][\s\S]*?ganttAdjustmentRequiredLineIds[\s\S]*?Reajustar/s,
    'CronogramaGantt debe limpiar previews stale del borrador backend y marcar lineas pendientes de reajuste',
);

assert.match(
    cronogramasSource,
    /handleRequestGanttLockRelease[\s\S]*?requestTrabajoGanttLockRelease[\s\S]*?Solicitud de cierre:[\s\S]*?handleReleaseGanttEditLock/s,
    'Cronogramas debe permitir solicitar y liberar el lock de trabajo Gantt sin habilitar concurrencia',
);

assert.equal(
    cronogramasSource.includes('onLoadTrabajoLineMetadata={handleLoadTrabajoLineMetadata}'),
    true,
    'Cronogramas debe hidratar metadata completa de Gantt por linea solo bajo demanda',
);

assert.match(
    ganttSource,
    /onAcquireGanttEditLock[\s\S]*?catch \(error\)[\s\S]*?onRequestGanttLockRelease[\s\S]*?skipConfirm: true/s,
    'CronogramaGantt debe solicitar liberacion cuando otro usuario tiene el lock, sin abrir el editor',
);

assert.match(
    ganttSource,
    /const officialBudgetLineTotal = Math\.max\([\s\S]*?selectedBudgetDetail\?\.precio_total[\s\S]*?row\?\.precio_total[\s\S]*?apuCostModel\?\.official_budget_line_total[\s\S]*?selectedBudgetDetail\?\.precio_unitario[\s\S]*?row\?\.precio_unitario[\s\S]*?\);/s,
    'CronogramaGantt debe resolver el precio de presupuesto desde la linea oficial, no desde el preview operativo',
);

assert.match(
    ganttSource,
    /Precio en presupuesto[\s\S]*?formatCurrency\(officialBudgetLineTotal \|\| 0, moneyCurrency, moneyDecimals\)/,
    'El card Precio en presupuesto debe mostrar officialBudgetLineTotal',
);

assert.equal(
    /Precio en presupuesto[\s\S]{0,220}visibleBudgetPrice/.test(ganttSource),
    false,
    'El card Precio en presupuesto no debe leer visibleBudgetPrice ni ningun preview operativo',
);

assert.equal(
    ganttSource.includes('Precio operativo preview'),
    true,
    'Los totales derivados por rendimientos de Gantt deben etiquetarse como preview operativo',
);

for (const method of [
    'getValorado',
    'getRecursos',
    'getRecursosState',
    'updateRecursosState',
    'updateValoradoConfig',
    'updateValoradoLinea',
    'resetValoradoLinea',
    'getTrabajo',
    'getTrabajoLineMetadata',
    'getTrabajoPareto',
    'updateTrabajo',
    'updateTrabajoDelta',
    'getTrabajoGanttDraft',
    'saveTrabajoGanttDraftIntention',
    'preflightTrabajoGanttDraftApply',
    'applyTrabajoGanttDraft',
    'discardInvalidatedTrabajoGanttDraft',
    'prepareInvalidatedTrabajoGanttDraftAdjustment',
    'acquireTrabajoGanttLock',
    'heartbeatTrabajoGanttLock',
    'requestTrabajoGanttLockRelease',
    'releaseTrabajoGanttLock',
    'resetIntegral',
    'mergeTrabajoInterparentSubbars',
    'reloadTrabajoHolidayCalendar',
    'resetTrabajoHolidayCalendar',
    'addTrabajoHolidayCalendarManual',
    'removeTrabajoHolidayCalendarDay',
    'exportTrabajoMsProject',
    'importTrabajoMsProject',
]) {
    assert.match(
        cronogramasApiSource,
        new RegExp(`\\b${method}\\s*:`),
        `cronogramasApi debe exponer ${method}`,
    );
}

for (const endpoint of [
    '`/cronogramas/valorados/${presupuestoId}`',
    '`/cronogramas/valorados/${presupuestoId}/recursos`',
    '`/cronogramas/valorados/${presupuestoId}/recursos/state`',
    '`/cronogramas/valorados/${presupuestoId}/config`',
    '`/cronogramas/valorados/${presupuestoId}/lineas/${lineaId}`',
    '`/cronogramas-trabajo/${presupuestoId}`',
    '`/cronogramas-trabajo/${presupuestoId}/lineas/${lineaId}/metadata`',
    '`/cronogramas-trabajo/${presupuestoId}/pareto`',
    '`/cronogramas-trabajo/${presupuestoId}/commit-delta`',
    '`/cronogramas-trabajo/${presupuestoId}/gantt-draft`',
    '`/cronogramas-trabajo/${presupuestoId}/gantt-draft/intentions`',
    '`/cronogramas-trabajo/${presupuestoId}/gantt-draft/preflight`',
    '`/cronogramas-trabajo/${presupuestoId}/gantt-draft/apply`',
    '`/cronogramas-trabajo/${presupuestoId}/gantt-draft/discard-invalidated`',
    '`/cronogramas-trabajo/${presupuestoId}/gantt-draft/prepare-adjustment`',
    '`/cronogramas-trabajo/${presupuestoId}/gantt-lock/acquire`',
    '`/cronogramas-trabajo/${presupuestoId}/gantt-lock/heartbeat`',
    '`/cronogramas-trabajo/${presupuestoId}/gantt-lock/request-release`',
    '`/cronogramas-trabajo/${presupuestoId}/gantt-lock/release`',
    '`/cronogramas-trabajo/${presupuestoId}/reset-integral`',
    '`/cronogramas-trabajo/${presupuestoId}/merge-interparent-subbars`',
    '`/cronogramas-trabajo/${presupuestoId}/holiday-calendar/reload`',
    '`/cronogramas-trabajo/${presupuestoId}/holiday-calendar/reset`',
    '`/cronogramas-trabajo/${presupuestoId}/holiday-calendar/manual`',
    '`/cronogramas-trabajo/${presupuestoId}/holiday-calendar/remove`',
    '`/cronogramas-trabajo/${presupuestoId}/export/ms-project`',
    '`/cronogramas-trabajo/${presupuestoId}/import/ms-project`',
]) {
    assert.equal(
        cronogramasApiSource.includes(endpoint),
        true,
        `cronogramasApi debe conservar endpoint: ${endpoint}`,
    );
}

assert.match(
    cronogramasApiSource,
    /exportTrabajoMsProject\s*:[\s\S]*params:\s*\{\s*format,\s*open_after_export:\s*openAfterExport\s*\}[\s\S]*responseType:\s*'blob'/,
    'cronogramasApi.exportTrabajoMsProject debe conservar formato, open_after_export y blob',
);

assert.match(
    cronogramasApiSource,
    /importTrabajoMsProject\s*:[\s\S]*formData\.append\('file',\s*file\)[\s\S]*multipart\/form-data/,
    'cronogramasApi.importTrabajoMsProject debe conservar multipart',
);

for (const token of [
    "url: '/reporting/preview'",
    "url: '/reporting/export'",
    "responseType: 'blob'",
    'withTenantConfig({}, empresa_id ?? empresaId)',
]) {
    assert.equal(
        reportingApiSource.includes(token),
        true,
        `reportingApi debe conservar contrato de reportes: ${token}`,
    );
}

assert.match(
    apusApiSource,
    /getById\s*:[\s\S]*withTenantConfig\(\{\},\s*empresaId\)/,
    'apusApi.getById debe conservar empresaId para Gantt',
);

assert.match(
    basesTrabajoApiSource,
    /getById\s*:[\s\S]*withTenantConfig\(\{\},\s*empresaId\)/,
    'basesTrabajoApi.getById debe conservar empresaId para Gantt',
);

assert.match(
    presupuestosApiSource,
    /getById\s*:[\s\S]*withTenantConfig\([\s\S]*empresaId\)/,
    'presupuestosApi.getById debe conservar tenant para Gantt/Cronogramas',
);

for (const token of [
    'fecha_inicio_referencia_proyecto',
    'fecha_inicio_autoridad',
    '_sync_config_with_external_project_start',
    '_mark_gantt_start_authority',
]) {
    assert.equal(
        cronogramaTrabajoServiceSource.includes(token),
        true,
        `CronogramaTrabajoService debe conservar autoridad temporal Gantt/Datos Proyecto: ${token}`,
    );
}

for (const token of [
    'Periodo seleccionado',
    'Generar periodos',
    'Generar periodos iniciales',
    'Dividir periodo activo',
]) {
    assert.equal(
        ganttSource.includes(token),
        true,
        `CronogramaGantt debe conservar nomenclatura visual de periodo: ${token}`,
    );
}

assert.equal(
    cronogramasSource.includes('return `P${index + 1}`'),
    true,
    'Cronograma Valorado debe presentar periodos como Pn',
);

console.log('smoke-classic-cronogramas-api-boundary: ok');
