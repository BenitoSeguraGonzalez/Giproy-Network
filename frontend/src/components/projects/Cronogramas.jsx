import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
    Activity,
    AlertCircle,
    ArrowDown,
    BarChart3,
    Calculator,
    CalendarRange,
    ChevronLeft,
    ChevronRight,
    ClipboardList,
    Clock3,
    FileText,
    Download,
    Printer,
    Folders,
    ListFilter,
    Loader2,
    Maximize2,
    Save,
    X,
    ClipboardPaste,
    Sigma,
    Check,
    CheckCircle2,
    TimerReset,
    Copy,
    ChevronDown,
    Users,
    Link2,
    Upload,
} from 'lucide-react';

import { AuthContext } from '../../context/AuthContext';
import { proyectoDetalleApi } from '../../api/proyectoDetalle';
import { presupuestosApi } from '../../api/presupuestos';
import { cronogramasApi } from '../../api/cronogramas';
import { edtApi } from '../../api/edt';
import reportingApi from '../../api/reporting';
import { appAlert, appConfirm } from '../../utils/appDialog';
import { extractBlobErrorMessage } from '../../utils/apiBlobErrors';
import AppHint from '../ui/AppHint';
import { downloadBlobResponse } from '../../utils/blobDownload';
import { resolveEffectiveGanttBootstrapState, shouldAttemptGanttBudgetFallback } from './cronogramasGanttBootstrap';
import { buildReportFileName, sanitizeReportContext } from '../../utils/reportFileName';
import { GIPROY_BUDGET_PRODUCTIVITY_UPDATED_EVENT } from '../../utils/cronogramaSyncEvents';
import { lazyWithChunkRecovery } from '../../utils/lazyImportRecovery';
import ClearSearchField from '../ui/ClearSearchField';
import ProjectHeaderActionButton from './ProjectHeaderActionButton';
import ProjectSectionReportButton, {
    PROJECT_REPORT_BUTTON_ACTIVE_CLASS,
    ProjectReportMenu,
    ProjectReportMenuItem,
} from './ProjectSectionReportButton';
import ProjectSegmentedSwitch from './ProjectSegmentedSwitch';
import CommonReportPreviewModal from '../reporting/CommonReportPreviewModal';
import ReportGenerationModal from '../reporting/ReportGenerationModal';
import ClassicPrintOptionsModal from '../reporting/ClassicPrintOptionsModal';
import { AppModalBody, AppModalFooter, AppModalHeader, AppModalShell } from '../ui/app-modal';
import AnimatedDateInput from '../ui/AnimatedDateInput';
import MotionScrollbar from '../ui/MotionScrollbar';
import { normalizeDescriptionCapitalization, normalizeSubcategoryDisplay } from '../../utils/descriptionCapitalization';
import { includesNormalized } from '../../utils/normalizeSearch';
import { normalizeTextInputValue } from '../../utils/normalizeInputValue';
import {
    balanceCronogramaDistribution,
    isCronogramaDistributionBalanced,
    normalizeCronogramaDistribution,
    sumCronogramaDistribution,
} from '../../utils/cronogramaNumbers';
import { ControlRail, ControlRailDivider, ControlRailIconButton, ControlRailSection } from '../ui/ControlRail';
import GridColumnManager, { useGridColumnSettings } from './GridColumnManager';
import CodeColorizer from '../../utils/codeColorizer';
import {
    downloadClassicCurvePdf,
    downloadClassicGanttPresentationPdf,
    summarizeCurvePrint,
    summarizeGanttPrint,
} from '../../utils/classicPrintEngine';

const PERIOD_OPTIONS = [
    { value: 'diario', label: 'Diario' },
    { value: 'semanal', label: 'Semanal' },
    { value: 'quincenal', label: 'Quincenal' },
    { value: 'mensual', label: 'Mensual' },
    { value: 'bimestral', label: 'Bimestral' },
    { value: 'trimestral', label: 'Trimestral' },
    { value: 'semestral', label: 'Semestral' },
    { value: 'anual', label: 'Anual' },
];

const DISTRIBUTION_OPTIONS = [
    { value: 'homogeneo', label: 'Homogéneo' },
    { value: 'gantt', label: 'Desde Gantt' },
    { value: 'usuario', label: 'Definido por usuario' },
];

const SCHEDULE_TABS = [
    { id: 'gantt', label: 'Cronograma Gantt' },
    { id: 'valorado', label: 'Cronograma Valorado' },
    { id: 'recursos', label: 'Recursos' },
];

const CRONOGRAMA_SOFT_ACTION_BUTTON =
    'inline-flex shrink-0 items-center justify-center border border-[#ececec] bg-[#f3f3f1] shadow-[4px_4px_10px_#d6d6d1,-4px_-4px_10px_#ffffff] transition-[color,box-shadow,filter] duration-200 hover:brightness-[0.99] active:shadow-[inset_2px_2px_8px_#d0d0d0,inset_-2px_-2px_8px_#ffffff] disabled:cursor-not-allowed disabled:opacity-50';
const CronogramaGantt = lazyWithChunkRecovery(() => import('./CronogramaGantt'));

const VALUE_TABS = [
    { id: 'porcentajes', label: 'Porcentaje', icon: Sigma },
    { id: 'inversion', label: 'Inversión', icon: BarChart3 },
    { id: 'cantidades', label: 'Cantidades', icon: ClipboardList },
    { id: 'curva_s', label: 'Curva S', icon: Activity },
];

const BASE_COLUMNS = [
    { key: 'item_visible', id: 'item_visible', label: 'Item', width: 72, type: 'text', locked: true },
    { key: 'edt_code_visible', id: 'edt_code_visible', label: 'Cod EDT', width: 96, type: 'text', locked: true },
    { key: 'descripcion', id: 'descripcion', label: 'Descripción', width: 360, type: 'text' },
    { key: 'finish_date', id: 'finish_date', label: 'Fin', width: 154, type: 'datetime' },
    { key: 'unidad', id: 'unidad', label: 'Unidad', width: 72, type: 'text' },
    { key: 'cantidad', id: 'cantidad', label: 'Cantidad', width: 108, type: 'number' },
    { key: 'precio_unitario', id: 'precio_unitario', label: 'P.Unit.', width: 114, type: 'currency' },
    { key: 'precio_total', id: 'precio_total', label: 'P.Total', width: 120, type: 'currency' },
];

const resolveStickyValoradoColumnLeft = (columns = [], columnIndex = 0) => (
    columns.slice(0, columnIndex).reduce((acc, column) => acc + Number(column?.width || 0), 0)
);

const VALORADO_LEFT_GRID_WIDTH = BASE_COLUMNS.reduce((total, column) => total + column.width, 0);
const VALORADO_LEFT_ROW_HEIGHT = 'h-11';
const VALORADO_LEFT_ROW_MIN_HEIGHT = 'min-h-11';
const VALORADO_RIGHT_PERIOD_WIDTH = '112px';
const VALORADO_RIGHT_ROW_HEIGHT = 'h-11';
const VALORADO_RIGHT_ROW_MIN_HEIGHT = 'min-h-11';

const parseDate = (value) => {
    if (!value) return null;
    if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
    const normalized = String(value).trim();
    const match = normalized.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (match) {
        const [, day, month, year] = match;
        const parsed = new Date(Number(year), Number(month) - 1, Number(day));
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    const parsed = new Date(normalized);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDate = (value) => {
    const parsed = value instanceof Date ? value : parseDate(value);
    if (!parsed) return 'Sin fecha';
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${day}/${month}/${year}`;
};

const formatDateTime = (value) => {
    const parsed = value instanceof Date ? value : parseDate(value);
    if (!parsed) return 'Sin fecha';
    return `${formatDate(parsed)} ${new Intl.DateTimeFormat('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(parsed)}`;
};

const stableJsonEqual = (left, right) => {
    if (left === right) return true;
    if (!left || !right) return false;
    try {
        return JSON.stringify(left) === JSON.stringify(right);
    } catch {
        return false;
    }
};

const resolveTrabajoResponseRowId = (row) => String(
    row?.budget_line_id
    ?? row?.presupuesto_linea_id
    ?? row?.linea_id
    ?? ''
);

const reuseStableCronogramaTrabajoResponse = (previous, updated) => {
    if (!previous || !updated || typeof updated !== 'object') return updated;
    const previousRowsById = new Map(
        (Array.isArray(previous.rows) ? previous.rows : [])
            .map((row) => [resolveTrabajoResponseRowId(row), row])
            .filter(([lineId]) => Boolean(lineId)),
    );
    const nextRows = Array.isArray(updated.rows)
        ? updated.rows.map((row) => {
            const lineId = resolveTrabajoResponseRowId(row);
            const previousRow = previousRowsById.get(lineId);
            return previousRow && stableJsonEqual(previousRow, row) ? previousRow : row;
        })
        : updated.rows;

    const previousScheduleData = previous.schedule_data && typeof previous.schedule_data === 'object'
        ? previous.schedule_data
        : {};
    const nextScheduleData = updated.schedule_data && typeof updated.schedule_data === 'object'
        ? Object.fromEntries(Object.entries(updated.schedule_data).map(([lineId, value]) => {
            const previousValue = previousScheduleData[lineId];
            return [
                lineId,
                previousValue && stableJsonEqual(previousValue, value) ? previousValue : value,
            ];
        }))
        : updated.schedule_data;

    return {
        ...updated,
        rows: nextRows,
        schedule_data: nextScheduleData,
    };
};

const mergeCronogramaTrabajoDeltaResponse = (previous, delta) => {
    if (!previous || !delta || delta.response_mode !== 'delta') return delta;
    const deltaRowsById = new Map(
        (Array.isArray(delta.rows) ? delta.rows : [])
            .map((row) => [resolveTrabajoResponseRowId(row), row])
            .filter(([lineId]) => Boolean(lineId)),
    );
    const previousRows = Array.isArray(previous.rows) ? previous.rows : [];
    const mergedRows = previousRows.map((previousRow) => {
        const lineId = resolveTrabajoResponseRowId(previousRow);
        const deltaRow = deltaRowsById.get(lineId);
        if (!deltaRow) return previousRow;
        const deltaMetadata = deltaRow.metadata && typeof deltaRow.metadata === 'object'
            ? deltaRow.metadata
            : {};
        const hasTopLevelChanges = Object.entries(deltaRow)
            .filter(([key]) => key !== 'metadata')
            .some(([key, value]) => !stableJsonEqual(previousRow?.[key], value));
        const hasMetadataChanges = Object.entries(deltaMetadata)
            .some(([key, value]) => !stableJsonEqual(previousRow?.metadata?.[key], value));
        if (!hasTopLevelChanges && !hasMetadataChanges) return previousRow;
        const mergedRow = {
            ...previousRow,
            ...deltaRow,
            metadata: {
                ...(previousRow.metadata || {}),
                ...deltaMetadata,
            },
        };
        return mergedRow;
    });
    const knownRowIds = new Set(previousRows.map(resolveTrabajoResponseRowId).filter(Boolean));
    deltaRowsById.forEach((deltaRow, lineId) => {
        if (!knownRowIds.has(lineId)) {
            mergedRows.push(deltaRow);
        }
    });

    const previousScheduleData = previous.schedule_data && typeof previous.schedule_data === 'object'
        ? previous.schedule_data
        : {};
    const deltaScheduleData = delta.schedule_data && typeof delta.schedule_data === 'object'
        ? delta.schedule_data
        : {};
    const nextScheduleData = {
        ...previousScheduleData,
        ...deltaScheduleData,
    };

    return {
        ...previous,
        id: delta.id ?? previous.id,
        presupuesto_id: delta.presupuesto_id ?? previous.presupuesto_id,
        proyecto_id: delta.proyecto_id ?? previous.proyecto_id,
        empresa_id: delta.empresa_id ?? previous.empresa_id,
        rows: mergedRows,
        schedule_data: nextScheduleData,
        summary: delta.summary || previous.summary,
        fecha_inicio: delta.fecha_inicio ?? previous.fecha_inicio,
        fecha_fin: delta.fecha_fin ?? previous.fecha_fin,
        updated_at: delta.updated_at ?? previous.updated_at,
    };
};

const resolveValoradoPeriodLabel = (periodOrLabel, index = 0) => {
    const rawValue = typeof periodOrLabel === 'object'
        ? String(periodOrLabel?.label || periodOrLabel?.id || `P${index + 1}`).trim()
        : String(periodOrLabel || `P${index + 1}`).trim();
    if (!rawValue) return `P${index + 1}`;
    if (/^T\d+$/i.test(rawValue)) return `P${rawValue.slice(1)}`;
    return rawValue.replace(/^T(?=\d)/i, 'P');
};

const formatValoradoPeriodRangeLabel = (period) => {
    if (!period?.starts_at || !period?.ends_at) return '';
    return `${formatDate(period.starts_at)} · ${formatDate(period.ends_at)}`;
};

const formatCronogramaDescripcion = (row) => {
    if (!row?.descripcion) return '';
    return row.is_calculable
        ? normalizeDescriptionCapitalization(row.descripcion)
        : normalizeSubcategoryDisplay(row.descripcion);
};

const resolveCronogramaItemVisible = (row) => {
    if (!row) return '';
    return String(
        row.item_visible
        || row.codigo_item
        || ''
    ).trim();
};

const resolveCronogramaEdtCodeVisible = (row) => {
    if (!row) return '';
    return String(
        row.edt_code_visible
        || row.codigo
        || ''
    ).trim();
};

const formatCronogramaReference = (row) => {
    if (!row) return 'Sin referencia';

    const itemVisible = resolveCronogramaItemVisible(row);
    const edtCodeVisible = resolveCronogramaEdtCodeVisible(row);

    if (row.is_calculable) {
        if (itemVisible && edtCodeVisible) return `Item ${itemVisible} · EDT ${edtCodeVisible}`;
        if (itemVisible) return `Item ${itemVisible}`;
    }

    if (edtCodeVisible) return `Cod EDT ${edtCodeVisible}`;
    return 'Sin referencia';
};

const formatDateInputValue = (value) => {
    const parsed = value instanceof Date ? value : parseDate(value);
    if (!parsed) return '';
    return formatDate(parsed);
};

const formatNativeDateInputValue = (value) => {
    const parsed = value instanceof Date ? value : parseDate(value);
    if (!parsed) return '';
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = parsed.getFullYear();
    return `${year}-${month}-${day}`;
};

const normalizeDateInputValue = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    const parsed = parseDate(normalized);
    return parsed ? formatDate(parsed) : normalized;
};

const toIsoDateValue = (value, startHour = DEFAULT_WORKDAY_START_HOUR, mode = 'start', workdayHours = DEFAULT_WORKDAY_HOURS) => {
    if (!value) return null;
    const parsed = value instanceof Date ? new Date(value) : parseDate(value);
    if (!parsed || Number.isNaN(parsed.getTime())) return null;
    const aligned = mode === 'finish'
        ? applyWorkdayFinishTime(parsed, startHour, workdayHours)
        : applyWorkdayStartTime(parsed, startHour);
    if (!aligned) return null;
    const year = aligned.getFullYear();
    const month = String(aligned.getMonth() + 1).padStart(2, '0');
    const day = String(aligned.getDate()).padStart(2, '0');
    const hour = String(aligned.getHours()).padStart(2, '0');
    const minute = String(aligned.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hour}:${minute}:00`;
};

const resolveTrabajoProjectStartBoundary = (cronogramaTrabajo, detail, project) => {
    const startHour = cronogramaTrabajo?.config?.hora_inicio_jornada ?? DEFAULT_WORKDAY_START_HOUR;
    return applyWorkdayStartTime(
        parseDate(
            cronogramaTrabajo?.config?.fecha_inicio_proyecto
            || detail?.fecha_inicio
            || cronogramaTrabajo?.fecha_inicio
            || project?.fecha_inicio
            || null
        ),
        startHour,
    );
};

const validateTrabajoScheduleNotBeforeProjectStart = (
    scheduleData,
    { cronogramaTrabajo, detail, project, trabajoDisplayRows },
) => {
    const boundary = resolveTrabajoProjectStartBoundary(cronogramaTrabajo, detail, project);
    if (!boundary) return null;
    const rowMap = new Map((trabajoDisplayRows || []).map((row) => [String(row?.budget_line_id ?? row?.linea_id ?? ''), row]));
    for (const [lineId, payload] of Object.entries(scheduleData || {})) {
        const candidateStart = parseDate(payload?.start_date);
        if (!candidateStart || candidateStart >= boundary) continue;
        const row = rowMap.get(String(lineId)) || null;
        const rowReference = formatCronogramaReference(row) || row?.codigo_item || `línea ${lineId}`;
        return `Operación cancelada: ninguna tarea puede iniciar antes de la fecha/hora de inicio del proyecto. ${rowReference} inicia en ${formatDateTime(candidateStart)} y el proyecto inicia en ${formatDateTime(boundary)}.`;
    }
    return null;
};

const summarizeMsProjectReason = (reason) => {
    if (!reason) return 'La exportación .mpp está disponible mediante generador nativo del backend.';
    if (reason.includes('ASPOSE_TASKS_LICENSE_PATH')) {
        return 'Falta configurar la licencia del generador .mpp del backend. Mientras tanto puedes usar XML Project.';
    }
    if (reason.includes('Aspose.Tasks')) {
        return 'El generador .mpp del backend no está listo. Mientras tanto puedes usar XML Project.';
    }
    return reason;
};

const formatCurrency = (value, currency = 'USD', decimals = 2) => new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
}).format(Number(value || 0));

const formatNumber = (value, decimals = 2) => new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
}).format(Number(value || 0));

const formatPercent = (value, decimals = 2) => `${formatNumber(value, decimals)}%`;

const DEFAULT_WORKDAY_START_HOUR = 8;
const DEFAULT_WORKDAY_HOURS = 8;

const normalizeWorkdayStartHour = (value) => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return DEFAULT_WORKDAY_START_HOUR;
    return Math.min(Math.max(numeric, 0), 23.5);
};

const splitHourParts = (value) => {
    const normalized = normalizeWorkdayStartHour(value);
    const hour = Math.trunc(normalized);
    const minute = Math.round((normalized - hour) * 60);
    if (minute >= 60) {
        return { hour: Math.min(hour + 1, 23), minute: 0 };
    }
    return { hour, minute };
};

const applyWorkdayStartTime = (value, startHour = DEFAULT_WORKDAY_START_HOUR) => {
    const parsed = value instanceof Date ? new Date(value) : parseDate(value);
    if (!parsed) return null;
    const { hour, minute } = splitHourParts(startHour);
    parsed.setHours(hour, minute, 0, 0);
    return parsed;
};

const applyWorkdayFinishTime = (value, startHour = DEFAULT_WORKDAY_START_HOUR, workdayHours = DEFAULT_WORKDAY_HOURS) => {
    const parsed = applyWorkdayStartTime(value, startHour);
    if (!parsed) return null;
    parsed.setMinutes(parsed.getMinutes() + Math.round(Math.max(0.5, Number(workdayHours || DEFAULT_WORKDAY_HOURS)) * 60));
    return parsed;
};

const addDays = (value, days) => {
    const next = new Date(value);
    next.setDate(next.getDate() + days);
    return next;
};

const getMonthEnd = (year, monthIndex) => new Date(year, monthIndex + 1, 0);

const shiftMonth = (year, monthIndex, offset) => {
    const shifted = new Date(year, monthIndex + offset, 1);
    return { year: shifted.getFullYear(), monthIndex: shifted.getMonth() };
};

const getPeriodBucketBounds = (anchor, periodType) => {
    const year = anchor.getFullYear();
    const monthIndex = anchor.getMonth();
    const day = anchor.getDate();

    if (periodType === 'diario') {
        return { start: new Date(year, monthIndex, day), end: new Date(year, monthIndex, day) };
    }
    if (periodType === 'semanal') {
        const start = new Date(year, monthIndex, day);
        const weekday = (start.getDay() + 6) % 7;
        start.setDate(start.getDate() - weekday);
        const end = new Date(start);
        end.setDate(end.getDate() + 6);
        return { start, end };
    }
    if (periodType === 'quincenal') {
        if (day <= 15) {
            return {
                start: new Date(year, monthIndex, 1),
                end: new Date(year, monthIndex, 15),
            };
        }
        return {
            start: new Date(year, monthIndex, 16),
            end: getMonthEnd(year, monthIndex),
        };
    }
    if (periodType === 'mensual') {
        return {
            start: new Date(year, monthIndex, 1),
            end: getMonthEnd(year, monthIndex),
        };
    }
    if (periodType === 'bimestral') {
        const startMonthIndex = monthIndex % 2 === 0 ? monthIndex : monthIndex - 1;
        const { year: endYear, monthIndex: endMonthIndex } = shiftMonth(year, startMonthIndex, 1);
        return {
            start: new Date(year, startMonthIndex, 1),
            end: getMonthEnd(endYear, endMonthIndex),
        };
    }
    if (periodType === 'trimestral') {
        const startMonthIndex = Math.floor(monthIndex / 3) * 3;
        const { year: endYear, monthIndex: endMonthIndex } = shiftMonth(year, startMonthIndex, 2);
        return {
            start: new Date(year, startMonthIndex, 1),
            end: getMonthEnd(endYear, endMonthIndex),
        };
    }
    if (periodType === 'semestral') {
        const startMonthIndex = monthIndex < 6 ? 0 : 6;
        const { year: endYear, monthIndex: endMonthIndex } = shiftMonth(year, startMonthIndex, 5);
        return {
            start: new Date(year, startMonthIndex, 1),
            end: getMonthEnd(endYear, endMonthIndex),
        };
    }
    if (periodType === 'anual') {
        return {
            start: new Date(year, 0, 1),
            end: new Date(year, 11, 31),
        };
    }
    return {
        start: new Date(Date.UTC(year, monthIndex, 1)),
        end: getMonthEnd(year, monthIndex),
    };
};

const buildHomogeneousDistribution = (periodCount) => {
    if (!periodCount || periodCount <= 0) return [];
    return balanceCronogramaDistribution(
        Array.from({ length: periodCount }, () => Number((100 / periodCount).toFixed(2))),
        { decimals: 2 },
    );
};

const normalizeDistributionToPeriodCount = (distribution, periodCount) => {
    if (!periodCount || periodCount <= 0) return [];
    const normalized = normalizeCronogramaDistribution(
        (distribution || []).map((value) => Number(value || 0)).slice(0, periodCount),
        periodCount,
        { decimals: 2 },
    );
    return normalized || buildHomogeneousDistribution(periodCount);
};

const buildValoradoPreviewPeriods = (detail, periodType, startHour = DEFAULT_WORKDAY_START_HOUR, workdayHours = DEFAULT_WORKDAY_HOURS) => {
    const startAt = applyWorkdayStartTime(parseDate(detail?.fecha_inicio) || new Date(), startHour);

    const explicitEnd = applyWorkdayFinishTime(detail?.fecha_finalizacion, startHour, workdayHours);
    const plazoDays = Number(detail?.plazo_ejecucion || 0);
    const endAt = explicitEnd
        || applyWorkdayFinishTime(addDays(startAt, Math.max(plazoDays, 1) - 1), startHour, workdayHours)
        || applyWorkdayFinishTime(addDays(startAt, 179), startHour, workdayHours);
    const periods = [];
    let cursor = new Date(startAt);
    let index = 1;

    while (cursor <= endAt) {
        const { end } = getPeriodBucketBounds(cursor, periodType);
        const bucketEnd = applyWorkdayFinishTime(end, startHour, workdayHours);
        const clampedEnd = bucketEnd > endAt ? new Date(endAt) : bucketEnd;
        periods.push({
            id: `P${index}`,
            label: `P${index}`,
            starts_at: new Date(cursor).toISOString(),
            ends_at: clampedEnd.toISOString(),
        });
        if (clampedEnd >= endAt) break;
        cursor = applyWorkdayStartTime(addDays(clampedEnd, 1), startHour);
        index += 1;
    }

    return periods;
};

const INTERNAL_ROW_CODE_PATTERN = /^(linea|edt)-\d+$/i;

const sanitizeTrabajoRowCode = (value) => {
    const normalized = String(value || '').trim();
    if (!normalized) return '';
    if (INTERNAL_ROW_CODE_PATTERN.test(normalized)) return '';
    return normalized;
};

const parsePredecessorInput = (value) => String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item) && item > 0);

const normalizeTrabajoDependencyType = (value) => {
    const normalized = String(value || 'FS').trim().toUpperCase();
    if (normalized === 'FC') return 'FS';
    if (normalized === 'CC') return 'SS';
    if (normalized === 'CF') return 'SF';
    return ['FS', 'SS', 'FF', 'SF'].includes(normalized) ? normalized : 'FS';
};

const normalizeTrabajoDependencyLagUnit = (value) => {
    const normalized = String(value || 'day').trim().toLowerCase();
    if (normalized === 'h' || normalized === 'hr' || normalized === 'hrs') return 'hour';
    if (normalized === 'hour') return 'hour';
    if (normalized === 'm' || normalized === 'min' || normalized === 'mins' || normalized === 'minute' || normalized === 'minutes') return 'minute';
    if (normalized === '%' || normalized === 'percent' || normalized === 'percentage') return 'percent';
    return 'day';
};

const buildTrabajoDependenciesPayload = (row, draft, predecessors) => {
    const targetId = getTrabajoRowBudgetLineId(row);
    const allowedSources = new Set((predecessors || []).map(Number));
    const rawDependencies = Array.isArray(draft.dependencies) ? draft.dependencies : [];
    const bySource = new Map();

    rawDependencies.forEach((dependency) => {
        const sourceId = Number(dependency?.source_id ?? dependency?.sourceId ?? dependency?.predecessor_id);
        if (!Number.isFinite(sourceId) || sourceId <= 0 || !allowedSources.has(sourceId)) return;
        const lagDays = Number(dependency?.lag_days ?? dependency?.lagDays ?? 0);
        bySource.set(sourceId, {
            source_id: sourceId,
            target_id: targetId,
            type: normalizeTrabajoDependencyType(dependency?.type),
            lag_days: Number.isFinite(lagDays) ? lagDays : 0,
            lag_unit: normalizeTrabajoDependencyLagUnit(dependency?.lag_unit || dependency?.lagUnit || 'day'),
            lag_mode: dependency?.lag_mode || dependency?.lagMode || (normalizeTrabajoDependencyLagUnit(dependency?.lag_unit || dependency?.lagUnit || 'day') === 'percent' ? 'percent' : 'duration'),
            metadata: dependency?.metadata || {},
        });
    });

    (predecessors || []).forEach((sourceId) => {
        const normalizedSource = Number(sourceId);
        if (!Number.isFinite(normalizedSource) || normalizedSource <= 0 || bySource.has(normalizedSource)) return;
        bySource.set(normalizedSource, {
            source_id: normalizedSource,
            target_id: targetId,
            type: 'FS',
            lag_days: 0,
            lag_unit: 'day',
            metadata: {},
        });
    });

    return Array.from(bySource.values());
};

const getTrabajoRowBudgetLineId = (row) => Number(row?.budget_line_id ?? row?.presupuesto_linea_id ?? row?.linea_id);

const validateTrabajoPredecessors = (row, predecessorIds, displayRows) => {
    const calculableRows = (displayRows || []).filter((item) => item.is_calculable);
    const validIds = new Set(calculableRows.map(getTrabajoRowBudgetLineId).filter((item) => Number.isFinite(item)));
    const currentId = getTrabajoRowBudgetLineId(row);
    const uniqueIds = Array.from(new Set((predecessorIds || []).map((item) => Number(item)).filter((item) => Number.isFinite(item) && item > 0)));

    const invalid = uniqueIds.filter((item) => !validIds.has(item));
    const futureOrSelf = uniqueIds.filter((item) => item === currentId);

    return {
        valid: invalid.length === 0 && futureOrSelf.length === 0,
        invalid,
        futureOrSelf,
        normalized: uniqueIds,
    };
};

const buildCurvePoints = (values, width = 820, height = 320, padding = 42, baseline = null) => {
    if (!values.length) return '';
    const maxValue = Math.max(...values, 1);
    const stepX = values.length === 1 ? 0 : (width - padding * 2) / (values.length - 1);
    const chartBaseline = typeof baseline === 'number' ? baseline : (height - padding);
    const chartHeight = height - 88;
    return values.map((value, index) => {
        const x = padding + stepX * index;
        const y = chartBaseline - ((value / maxValue) * chartHeight);
        return `${x},${y}`;
    }).join(' ');
};

const getMetricValue = (type, row, percent) => {
    if (type === 'porcentajes') return percent;
    if (type === 'inversion') return (Number(row.precio_total || 0) * percent) / 100;
    return (Number(row.cantidad || 0) * percent) / 100;
};

const MetricText = ({ type, value, currency, decMoneda, decCalculos }) => {
    if (type === 'porcentajes') return formatPercent(value, 2);
    if (type === 'inversion') return formatCurrency(value, currency, decMoneda);
    return formatNumber(value, decCalculos);
};

const BaseCell = ({ column, row, currency, decMoneda, decCalculos }) => {
    if (!row.is_calculable) {
        if (column.key === 'item_visible' || column.key === 'edt_code_visible' || column.key === 'descripcion') {
            const isRoot = row.level === 0;
            return (
                <div className="flex items-center gap-2">
                    {column.key === 'item_visible' && (
                        <span className={`font-mono text-[10px] font-black tracking-wider ${isRoot ? 'text-blue-700' : 'text-blue-600'}`}>
                            {row.item_visible || ''}
                        </span>
                    )}
                    {column.key === 'edt_code_visible' && (
                        <span className={`font-mono text-[10px] font-black tracking-wider ${isRoot ? 'text-blue-700' : 'text-blue-600'}`}>
                            {row.edt_code_visible || (isRoot ? '' : 'S/N')}
                        </span>
                    )}
                    {column.key === 'descripcion' && (
                        <>
                            {row.hijos?.length > 0 ? <ChevronDown className="h-3 w-3" /> : <div className="w-3" />}
                            <Folders className={`h-3.5 w-3.5 ${isRoot ? 'text-blue-600' : 'text-blue-500'}`} />
                            <span className={`truncate text-[10px] font-semibold uppercase tracking-tight ${isRoot ? 'text-blue-900' : 'text-zinc-800'}`}>
                                {formatCronogramaDescripcion(row)}
                            </span>
                        </>
                    )}
                </div>
            );
        }
        return '';
    }

    if (column.key === 'item_visible') {
        return <span className="font-mono text-[10px] font-black tracking-wider text-[#136191]">{row.item_visible || 'S/N'}</span>;
    }

    if (column.key === 'edt_code_visible') {
        return (
            <span className="font-mono text-[10px] font-black tracking-wider text-[#136191]">
                {row.edt_code_visible || 'S/N'}
            </span>
        );
    }

    if (column.key === 'descripcion') {
        return (
            <div className="flex items-center gap-2 overflow-hidden">
                <Calculator className="h-3.5 w-3.5 shrink-0 text-[#F39200]" />
                <span className="truncate text-[10px] font-medium leading-snug tracking-[0.01em] text-zinc-700">
                    {formatCronogramaDescripcion(row)}
                </span>
                {row.requires_manual_schedule ? (
                    <span
                        className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.12em] text-amber-700"
                        title="Línea solo materiales pendiente de definir tiempo manual para derivación temporal real."
                    >
                        Tiempo manual
                    </span>
                ) : null}
            </div>
        );
    }

    if (column.key === 'finish_date') {
        const finish = row.finish_date || row.end_date || null;
        return (
            <span className={`truncate text-[10px] font-black ${finish ? 'text-emerald-700' : 'text-zinc-400'}`}>
                {finish ? formatDateTime(finish) : 'Sin fecha'}
            </span>
        );
    }

    if (column.type === 'currency') return formatCurrency(row[column.key], currency, decMoneda);
    if (column.type === 'number') return formatNumber(row[column.key], decCalculos);
    return row[column.key] ?? '-';
};


const buildDisplayRows = (budgetDetail, cronogramaRows, edtTree) => {
    const rowMap = new Map((cronogramaRows || []).map((row) => [String(row.linea_id), row]));
    const budgetLines = (budgetDetail || [])
        .slice()
        .sort((a, b) => (Number(a.orden || 0) - Number(b.orden || 0)) || (Number(a.id || 0) - Number(b.id || 0)));
    const linesByEdt = budgetLines.reduce((acc, line) => {
        const key = String(line.edt_id);
        if (!acc.has(key)) acc.set(key, []);
        acc.get(key).push(line);
        return acc;
    }, new Map());

    const result = [];
    const normalizeComparableText = (value) => String(value || '')
        .trim()
        .replace(/\s+/g, ' ')
        .toLocaleLowerCase('es');

    const visitNode = (node, level = 0) => {
        const childRows = [];
        (node.hijos || []).forEach((child) => {
            childRows.push(...visitNode(child, level + 1));
        });
        const attachedLines = (linesByEdt.get(String(node.id)) || []).filter((line) => {
            if (!line.apu_id) return false;

            const sameCode = String(line.codigo_item || '').trim() === String(node.codigo || '').trim();
            const sameDescription = normalizeComparableText(line.descripcion) === normalizeComparableText(node.nombre);

            if (sameCode && sameDescription) {
                return false;
            }

            return true;
        });
        const hasRelevantContent = attachedLines.length > 0 || childRows.length > 0;
        if (!hasRelevantContent) return [];

        const currentRows = [
            {
                linea_id: `edt-${node.id}`,
                budget_line_id: `edt-${node.id}`,
                codigo_item: level === 0 ? '' : (node.codigo || ''),
                item_visible: '',
                edt_code_visible: level === 0 ? '' : (node.codigo || ''),
                apu_id: null,
                descripcion: node.nombre,
                unidad: '',
                cantidad: '',
                precio_unitario: '',
                precio_total: '',
                distribution: [],
                has_override: false,
                tipo: 'edt',
                is_calculable: false,
                level,
            },
        ];

        attachedLines.forEach((line) => {
            const cronogramaRow = rowMap.get(String(line.id));
            currentRows.push({
                ...(cronogramaRow || {
                    linea_id: line.id,
                    codigo_item: line.codigo_item,
                    item_visible: '',
                    edt_code_visible: line.codigo_item || '',
                    apu_id: line.apu_id,
                    descripcion: line.descripcion,
                    unidad: line.unidad,
                    cantidad: line.cantidad,
                    precio_unitario: line.precio_unitario,
                    precio_total: line.precio_total,
                    distribution: [],
                    has_override: false,
                }),
                budget_line_id: line.id,
                item_visible: '',
                edt_code_visible: cronogramaRow?.edt_code_visible || line.codigo_item || '',
                tipo: line.tipo || 'apu',
                is_calculable: true,
                level: level + 1,
            });
        });

        return [...currentRows, ...childRows];
    };

    (edtTree || []).forEach((node) => {
        result.push(...visitNode(node, 0));
    });

    const assignSequentialItems = (rows) => rows.map((row, index) => ({
        ...row,
        item_visible: String(index + 1),
    }));

    if (result.length) return assignSequentialItems(result);

    return assignSequentialItems(budgetLines.map((line) => {
        const cronogramaRow = rowMap.get(String(line.id));
        return {
            ...(cronogramaRow || {
                linea_id: line.id,
                codigo_item: line.codigo_item,
                item_visible: '',
                edt_code_visible: String(line.codigo_item || '').trim(),
                apu_id: line.apu_id,
                descripcion: line.descripcion,
                unidad: line.unidad,
                cantidad: line.cantidad,
                precio_unitario: line.precio_unitario,
                precio_total: line.precio_total,
                distribution: [],
                has_override: false,
            }),
            budget_line_id: line.id,
            item_visible: '',
            edt_code_visible: cronogramaRow?.edt_code_visible || String(line.codigo_item || '').trim(),
            tipo: line.tipo || 'apu',
            is_calculable: Boolean(line.apu_id),
            level: 0,
        };
    }));
};

const buildValoradoFooterFromRows = (rows, periodCount, decMoneda = 2, decCalculos = 4) => {
    const inversionParcial = Array.from({ length: periodCount }, () => 0);
    const totalBudget = (rows || []).reduce((acc, row) => (
        row.is_calculable ? acc + Number(row.precio_total || 0) : acc
    ), 0);

    (rows || []).forEach((row) => {
        if (!row.is_calculable) return;
        const precioTotal = Number(row.precio_total || 0);
        (row.distribution || []).slice(0, periodCount).forEach((percent, index) => {
            inversionParcial[index] += precioTotal * (Number(percent || 0) / 100);
        });
    });

    const roundedInversion = inversionParcial.map((value) => Number(value.toFixed(decMoneda)));
    let running = 0;
    const inversionAcumulada = [];
    const avanceParcialPct = [];
    const avanceAcumuladoPct = [];

    roundedInversion.forEach((value) => {
        running += value;
        inversionAcumulada.push(Number(running.toFixed(decMoneda)));
        avanceParcialPct.push(Number((totalBudget ? (value / totalBudget) * 100 : 0).toFixed(decCalculos)));
        avanceAcumuladoPct.push(Number((totalBudget ? (running / totalBudget) * 100 : 0).toFixed(decCalculos)));
    });

    return {
        inversion_parcial: roundedInversion,
        avance_parcial_pct: avanceParcialPct,
        inversion_acumulada: inversionAcumulada,
        avance_acumulado_pct: avanceAcumuladoPct,
    };
};

const buildValoradoCurveFromFooter = (periods, footer) => (periods || []).map((period, index) => ({
    label: resolveValoradoPeriodLabel(period, index),
    value: footer.inversion_acumulada?.[index] || 0,
}));

const measurePeriodWorkHours = (startValue, endValue, startHour = DEFAULT_WORKDAY_START_HOUR, workdayHours = DEFAULT_WORKDAY_HOURS) => {
    const start = parseDate(startValue);
    const end = parseDate(endValue);
    if (!start || !end || end < start) return 0;
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);
    const last = new Date(end);
    last.setHours(0, 0, 0, 0);
    let totalMs = 0;
    while (cursor <= last) {
        const workStart = applyWorkdayStartTime(cursor, startHour);
        const workEnd = applyWorkdayFinishTime(cursor, startHour, workdayHours);
        const overlapStart = start > workStart ? start : workStart;
        const overlapEnd = end < workEnd ? end : workEnd;
        if (overlapEnd > overlapStart) {
            totalMs += overlapEnd.getTime() - overlapStart.getTime();
        }
        cursor.setDate(cursor.getDate() + 1);
    }
    return Number((totalMs / 3600000).toFixed(4));
};

const buildValoradoCashFlowFromFooter = (
    periods,
    footer,
    startHour = DEFAULT_WORKDAY_START_HOUR,
    workdayHours = DEFAULT_WORKDAY_HOURS,
) => (periods || []).map((period, index) => ({
    period_id: period.id || `P${index + 1}`,
    label: resolveValoradoPeriodLabel(period, index),
    starts_at: period.starts_at,
    ends_at: period.ends_at,
    work_hours: measurePeriodWorkHours(period.starts_at, period.ends_at, startHour, workdayHours),
    cost: footer.inversion_parcial?.[index] || 0,
    cumulative_cost: footer.inversion_acumulada?.[index] || 0,
    cost_pct: footer.avance_parcial_pct?.[index] || 0,
    cumulative_pct: footer.avance_acumulado_pct?.[index] || 0,
    category_costs: {},
    category_hours: {},
    dominant_category: null,
}));

const buildCashFlowHourWeightedReference = (points) => {
    if (!points?.length) return [];
    const totalHours = points.reduce((acc, item) => acc + Number(item.work_hours || 0), 0);
    if (totalHours <= 0) {
        return buildHomogeneousDistribution(points.length);
    }
    return balanceCronogramaDistribution(
        points.map((item) => (Number(item.work_hours || 0) / totalHours) * 100),
        { decimals: 2 },
    );
};

const toDateOnly = (value) => {
    const parsed = value instanceof Date ? new Date(value) : parseDate(value);
    if (!parsed) return null;
    parsed.setHours(0, 0, 0, 0);
    return parsed;
};

const buildDistributionByDateOverlap = (periods, startValue, endValue) => {
    if (!periods?.length) return [];
    const startDate = toDateOnly(startValue);
    let endDate = toDateOnly(endValue) || startDate;
    if (!startDate) return buildHomogeneousDistribution(periods.length);
    if (!endDate || endDate < startDate) endDate = new Date(startDate);

    const totalDays = Math.max(Math.round((endDate.getTime() - startDate.getTime()) / 86400000) + 1, 1);
    const rawDistribution = periods.map((period) => {
        const periodStart = toDateOnly(period.starts_at);
        const periodEnd = toDateOnly(period.ends_at);
        if (!periodStart || !periodEnd) return 0;
        const overlapStart = startDate > periodStart ? startDate : periodStart;
        const overlapEnd = endDate < periodEnd ? endDate : periodEnd;
        const overlapDays = overlapEnd >= overlapStart
            ? Math.max(Math.round((overlapEnd.getTime() - overlapStart.getTime()) / 86400000) + 1, 0)
            : 0;
        return totalDays ? (overlapDays / totalDays) * 100 : 0;
    });

    if (rawDistribution.some((value) => value > 0)) {
        return balanceCronogramaDistribution(rawDistribution, { decimals: 2 });
    }

    const containingIndex = periods.findIndex((period) => {
        const periodStart = toDateOnly(period.starts_at);
        const periodEnd = toDateOnly(period.ends_at);
        return periodStart && periodEnd && periodStart <= startDate && startDate <= periodEnd;
    });
    const targetIndex = containingIndex >= 0
        ? containingIndex
        : (toDateOnly(periods[0]?.starts_at) && endDate < toDateOnly(periods[0]?.starts_at) ? 0 : periods.length - 1);
    const fallback = Array.from({ length: periods.length }, () => 0);
    fallback[targetIndex] = 100;
    return balanceCronogramaDistribution(fallback, { decimals: 2 });
};

const buildGanttReconciliationSummary = (rows, periods, ganttRows, currency, decMoneda) => {
    const ganttByLineId = new Map((ganttRows || [])
        .filter((row) => row?.presupuesto_linea_id || row?.budget_line_id || row?.linea_id)
        .map((row) => [String(row.presupuesto_linea_id || row.budget_line_id || row.linea_id), row]));

    const differences = [];
    let unscheduled = 0;
    let manualScheduleRequired = 0;
    let estimatedRedistribution = 0;

    (rows || []).forEach((row) => {
        if (!row?.is_calculable) return;
        if (row?.requires_manual_schedule) {
            manualScheduleRequired += 1;
            return;
        }
        const lineId = String(row.linea_id || row.budget_line_id);
        const ganttRow = ganttByLineId.get(lineId);
        if (!ganttRow?.start_date) {
            unscheduled += 1;
            return;
        }
        const ganttDistribution = buildDistributionByDateOverlap(periods, ganttRow.start_date, ganttRow.end_date || ganttRow.start_date);
        const currentDistribution = normalizeDistributionToPeriodCount(row.distribution || [], periods.length);
        const diffs = currentDistribution.map((value, index) => Number((value - Number(ganttDistribution[index] || 0)).toFixed(2)));
        const absPct = diffs.reduce((acc, value) => acc + Math.abs(value), 0);
        if (absPct <= 0.01) return;

        const lineTotal = Number(row.precio_total || 0);
        const shiftedAmount = diffs.reduce((acc, value) => acc + Math.abs(lineTotal * (value / 100)), 0) / 2;
        estimatedRedistribution += shiftedAmount;
        differences.push({
            lineId,
            codigo: row.codigo_item || '',
            descripcion: row.descripcion || 'Sin descripción',
            absPct,
            shiftedAmount,
            currentDistribution,
            ganttDistribution,
        });
    });

    differences.sort((a, b) => b.shiftedAmount - a.shiftedAmount || b.absPct - a.absPct);

    return {
        hasDifferences: differences.length > 0 || unscheduled > 0 || manualScheduleRequired > 0,
        differences,
        unscheduled,
        manualScheduleRequired,
        estimatedRedistribution,
        formattedRedistribution: formatCurrency(estimatedRedistribution, currency, decMoneda),
    };
};

const buildOverrideReconciliationSummary = (rows, periods, ganttRows, distributionMode, globalDistribution, currency, decMoneda) => {
    const ganttByLineId = new Map((ganttRows || [])
        .filter((row) => row?.presupuesto_linea_id || row?.budget_line_id || row?.linea_id)
        .map((row) => [String(row.presupuesto_linea_id || row.budget_line_id || row.linea_id), row]));
    const normalizedGlobal = normalizeDistributionToPeriodCount(globalDistribution || [], periods.length);

    const differences = [];
    let unscheduled = 0;
    let manualScheduleRequired = 0;
    let estimatedRedistribution = 0;

    (rows || []).forEach((row) => {
        if (!row?.is_calculable || !row.has_override) return;
        if (row?.requires_manual_schedule) {
            manualScheduleRequired += 1;
            return;
        }
        const lineId = String(row.linea_id || row.budget_line_id);
        const currentDistribution = normalizeDistributionToPeriodCount(row.distribution || [], periods.length);
        let targetDistribution = normalizedGlobal;

        if (distributionMode === 'gantt') {
            const ganttRow = ganttByLineId.get(lineId);
            if (ganttRow?.start_date) {
                targetDistribution = buildDistributionByDateOverlap(periods, ganttRow.start_date, ganttRow.end_date || ganttRow.start_date);
            } else {
                unscheduled += 1;
                targetDistribution = buildHomogeneousDistribution(periods.length);
            }
        }

        const diffs = currentDistribution.map((value, index) => Number((value - Number(targetDistribution[index] || 0)).toFixed(2)));
        const absPct = diffs.reduce((acc, value) => acc + Math.abs(value), 0);
        if (absPct <= 0.01) return;
        const lineTotal = Number(row.precio_total || 0);
        const shiftedAmount = diffs.reduce((acc, value) => acc + Math.abs(lineTotal * (value / 100)), 0) / 2;
        estimatedRedistribution += shiftedAmount;
        differences.push({
            lineId,
            codigo: row.codigo_item || '',
            descripcion: row.descripcion || 'Sin descripción',
            absPct,
            shiftedAmount,
        });
    });

    differences.sort((a, b) => b.shiftedAmount - a.shiftedAmount || b.absPct - a.absPct);

    return {
        hasOverrides: differences.length > 0 || unscheduled > 0 || manualScheduleRequired > 0,
        differences,
        unscheduled,
        manualScheduleRequired,
        estimatedRedistribution,
        formattedRedistribution: formatCurrency(estimatedRedistribution, currency, decMoneda),
    };
};

const buildManualScheduleTransitionSummary = (previousRows, nextRows, currency, decMoneda) => {
    const previousSummary = summarizeManualScheduleRows(previousRows, currency, decMoneda);
    const nextSummary = summarizeManualScheduleRows(nextRows, currency, decMoneda);
    const recoveredCount = Math.max(0, previousSummary.count - nextSummary.count);
    const recoveredAmount = Math.max(0, previousSummary.pendingAmount - nextSummary.pendingAmount);
    return {
        previousSummary,
        nextSummary,
        recoveredCount,
        recoveredAmount,
        formattedRecoveredAmount: formatCurrency(recoveredAmount, currency, decMoneda),
        hasRecovery: recoveredCount > 0 || recoveredAmount > 0.01,
    };
};

const summarizeManualScheduleRows = (rows, currency, decMoneda) => {
    const pendingRows = (rows || []).filter((row) => row?.is_calculable && row?.requires_manual_schedule);
    const pendingAmount = pendingRows.reduce((acc, row) => acc + Number(row?.precio_total || 0), 0);
    const totalCalculableAmount = (rows || [])
        .filter((row) => row?.is_calculable)
        .reduce((acc, row) => acc + Number(row?.precio_total || 0), 0);
    const scheduledAmount = Math.max(0, totalCalculableAmount - pendingAmount);
    const pendingPct = totalCalculableAmount ? Number(((pendingAmount / totalCalculableAmount) * 100).toFixed(2)) : 0;
    const scheduledPct = totalCalculableAmount ? Number(((scheduledAmount / totalCalculableAmount) * 100).toFixed(2)) : 0;
    return {
        count: pendingRows.length,
        pendingAmount,
        scheduledAmount,
        totalCalculableAmount,
        pendingPct,
        scheduledPct,
        formattedPendingAmount: formatCurrency(pendingAmount, currency, decMoneda),
        formattedScheduledAmount: formatCurrency(scheduledAmount, currency, decMoneda),
        formattedPendingPct: formatPercent(pendingPct, 2),
        formattedScheduledPct: formatPercent(scheduledPct, 2),
        items: pendingRows.slice(0, 3).map((row) => ({
            codigo: formatCronogramaReference(row),
            descripcion: row.descripcion || 'Sin descripción',
        })),
    };
};

const summarizeActiveManualTemporalRows = (rows, currency, decMoneda) => {
    const activeRows = (rows || []).filter((row) => row?.is_calculable && row?.temporal_source === 'manual_temporal_material_only');
    const activeAmount = activeRows.reduce((acc, row) => acc + Number(row?.precio_total || 0), 0);
    return {
        count: activeRows.length,
        amount: activeAmount,
        formattedAmount: formatCurrency(activeAmount, currency, decMoneda),
    };
};

const patchCronogramaValoradoDistributions = (
    cronograma,
    displayRows,
    distributionByLineId,
    workdayStartHour = DEFAULT_WORKDAY_START_HOUR,
    workdayHours = DEFAULT_WORKDAY_HOURS,
) => {
    if (!cronograma) return cronograma;
    const periods = cronograma.periods || [];
    const decMoneda = cronograma.dec_moneda ?? 2;
    const decCalculos = cronograma.dec_calculos ?? 4;

    const patchedDisplayRows = (displayRows || []).map((row) => {
        const lineId = String(row.linea_id);
        if (!distributionByLineId.has(lineId)) return row;
        return {
            ...row,
            distribution: distributionByLineId.get(lineId),
            has_override: true,
        };
    });
    const patchedRows = (cronograma.rows || []).map((row) => {
        const lineId = String(row.linea_id);
        if (!distributionByLineId.has(lineId)) return row;
        return {
            ...row,
            distribution: distributionByLineId.get(lineId),
            has_override: true,
        };
    });
    const footer = buildValoradoFooterFromRows(patchedDisplayRows, periods.length, decMoneda, decCalculos);

    return {
        ...cronograma,
        rows: patchedRows,
        footer,
        curve_s: buildValoradoCurveFromFooter(periods, footer),
        cash_flow: buildValoradoCashFlowFromFooter(periods, footer, workdayStartHour, workdayHours),
        has_line_overrides: true,
    };
};

const buildCashConstraintLineDraft = (rows, periodCount, targetDistribution, currency = 'USD', decMoneda = 2) => {
    if (!periodCount || periodCount <= 0) {
        return {
            drafts: [],
            changes: [],
            formattedRedistribution: formatCurrency(0, currency, decMoneda),
        };
    }

    const workingRows = (rows || [])
        .filter((row) => row?.is_calculable && Number(row.precio_total || 0) > 0)
        .map((row) => ({
            row,
            lineId: String(row.linea_id || row.budget_line_id),
            lineTotal: Number(row.precio_total || 0),
            originalDistribution: normalizeDistributionToPeriodCount(row.distribution || [], periodCount),
            distribution: normalizeDistributionToPeriodCount(row.distribution || [], periodCount),
        }));

    const totalCost = workingRows.reduce((acc, item) => acc + item.lineTotal, 0);
    const targetPct = normalizeDistributionToPeriodCount(targetDistribution || [], periodCount);
    if (!workingRows.length || totalCost <= 0 || !targetPct.length) {
        return {
            drafts: [],
            changes: [],
            formattedRedistribution: formatCurrency(0, currency, decMoneda),
        };
    }

    const periodCosts = Array.from({ length: periodCount }, (_, periodIndex) => (
        workingRows.reduce((acc, item) => acc + item.lineTotal * (Number(item.distribution[periodIndex] || 0) / 100), 0)
    ));
    const targetCosts = targetPct.map((pct) => totalCost * (Number(pct || 0) / 100));
    const surplus = periodCosts.map((value, index) => Number((value - targetCosts[index]).toFixed(decMoneda + 2)));
    const deficits = periodCosts.map((value, index) => Number((targetCosts[index] - value).toFixed(decMoneda + 2)));
    const changes = [];
    let redistributed = 0;
    const maxIterations = Math.max(periodCount * workingRows.length * 4, 20);
    let iterations = 0;

    while (iterations < maxIterations) {
        iterations += 1;
        const fromIndex = surplus.reduce((bestIndex, value, index) => (
            value > Number(surplus[bestIndex] || 0) ? index : bestIndex
        ), 0);
        const toIndex = deficits.reduce((bestIndex, value, index) => (
            value > Number(deficits[bestIndex] || 0) ? index : bestIndex
        ), 0);

        if (Number(surplus[fromIndex] || 0) <= 0.01 || Number(deficits[toIndex] || 0) <= 0.01) break;

        const candidate = workingRows
            .filter((item) => Number(item.distribution[fromIndex] || 0) > 0.01 && Number(item.distribution[toIndex] || 0) < 99.99)
            .sort((a, b) => (
                b.lineTotal * (Number(b.distribution[fromIndex] || 0) / 100)
                - a.lineTotal * (Number(a.distribution[fromIndex] || 0) / 100)
            ))[0];

        if (!candidate) break;

        const removableCost = candidate.lineTotal * (Number(candidate.distribution[fromIndex] || 0) / 100);
        const receivableCost = candidate.lineTotal * (Math.max(0, 100 - Number(candidate.distribution[toIndex] || 0)) / 100);
        const amount = Math.min(surplus[fromIndex], deficits[toIndex], removableCost, receivableCost);
        if (amount <= 0.01) break;

        const pctMove = Number(((amount / candidate.lineTotal) * 100).toFixed(2));
        if (pctMove <= 0) break;

        candidate.distribution[fromIndex] = Number(Math.max(0, Number(candidate.distribution[fromIndex] || 0) - pctMove).toFixed(2));
        candidate.distribution[toIndex] = Number(Math.min(100, Number(candidate.distribution[toIndex] || 0) + pctMove).toFixed(2));
        candidate.distribution = balanceCronogramaDistribution(candidate.distribution, { decimals: 2 });

        surplus[fromIndex] = Number((surplus[fromIndex] - amount).toFixed(decMoneda + 2));
        deficits[toIndex] = Number((deficits[toIndex] - amount).toFixed(decMoneda + 2));
        redistributed += amount;
        changes.push({
            lineId: candidate.lineId,
            codigo: formatCronogramaReference(candidate.row),
            descripcion: candidate.row.descripcion || 'Sin descripción',
            fromIndex,
            toIndex,
            amount,
            formattedAmount: formatCurrency(amount, currency, decMoneda),
        });
    }

    const drafts = workingRows
        .map((item) => ({
            lineId: item.lineId,
            codigo: formatCronogramaReference(item.row),
            descripcion: item.row.descripcion || 'Sin descripción',
            distribution: item.distribution,
            changedPct: item.distribution.reduce((acc, value, index) => (
                acc + Math.abs(Number(value || 0) - Number(item.originalDistribution[index] || 0))
            ), 0),
        }))
        .filter((item) => item.changedPct > 0.01);

    return {
        drafts,
        changes,
        formattedRedistribution: formatCurrency(redistributed, currency, decMoneda),
    };
};

const CronogramaValorado = ({
    detail,
    selectedBudget,
    cronograma,
    configState,
    onConfigChange,
    onApplyConfig,
    onRecalculateFromGantt,
    onClearLineOverrides,
    onRecalculateCashFlow,
    onApplyCashConstraintLineDraft,
    onSaveCell,
    onResetLine,
    onBalanceGlobal,
    configSaving,
    cronogramaLoading,
    editingCell,
    setEditingCell,
    onNavigateCell,
    displayRows,
    selectedRowIds,
    setSelectedRowIds,
    onCopyDistribution,
    onPasteDistribution,
    distributionSum,
    onValueTabChange,
    trabajoRows,
    trabajoConfig,
}) => {
    const { user } = useContext(AuthContext) || {};
    const [activeValueTab, setActiveValueTab] = useState('porcentajes');
    const [isNavigating, setIsNavigating] = useState(true);
    const [focusedCell, setFocusedCell] = useState(null); // { rowIndex, periodIndex }
    const [leftGridSearch, setLeftGridSearch] = useState('');
    const [activeLeftGridSearchIndex, setActiveLeftGridSearchIndex] = useState(-1);
    const editInputRef = useRef(null);
    
    // Auto-collapse if resolution is limited (compact mode)
    const isCompact = useMemo(() => {
        return window.innerWidth <= 1920 || window.innerHeight <= 1080;
    }, []);

    const [showConfig, setShowConfig] = useState(!isCompact);
    const [showFooter, setShowFooter] = useState(true);
    const [summaryExpanded, setSummaryExpanded] = useState(false);
    const [fullscreenCurve, setFullscreenCurve] = useState(false);

    useEffect(() => {
        onValueTabChange?.(activeValueTab);
    }, [activeValueTab, onValueTabChange]);

    useEffect(() => {
        if (activeValueTab !== 'curva_s' && fullscreenCurve) {
            setFullscreenCurve(false);
        }
    }, [activeValueTab, fullscreenCurve]);
    
    const leftRef = useRef(null);
    const rightRef = useRef(null);
    const footerRightRef = useRef(null);
    const leftGridRowRefs = useRef(new Map());
    const periodTypeButtonRef = useRef(null);
    const distributionModeButtonRef = useRef(null);
    const [periodTypeMenuOpen, setPeriodTypeMenuOpen] = useState(false);
    const [distributionModeMenuOpen, setDistributionModeMenuOpen] = useState(false);
    const [periodTypeMenuStyle, setPeriodTypeMenuStyle] = useState(null);
    const [distributionModeMenuStyle, setDistributionModeMenuStyle] = useState(null);
    const columnStorageKey = useMemo(() => {
        const userId = String(user?.id || user?.usuario_id || user?.email || 'anonymous').trim() || 'anonymous';
        const projectId = String(detail?.proyecto_id || detail?.project_id || detail?.id || 'sin-proyecto').trim() || 'sin-proyecto';
        const budgetId = String(selectedBudget?.id || cronograma?.presupuesto_id || 'sin-presupuesto').trim() || 'sin-presupuesto';
        const revision = String(detail?.revision ?? selectedBudget?.revision ?? 0).trim() || '0';
        return `giproy:cronograma-valorado:grid-columns:${userId}:${projectId}:${budgetId}:rev-${revision}`;
    }, [cronograma?.presupuesto_id, detail?.id, detail?.project_id, detail?.proyecto_id, detail?.revision, selectedBudget?.id, selectedBudget?.revision, user?.email, user?.id, user?.usuario_id]);
    const valoradoColumnSettings = useGridColumnSettings({
        columns: BASE_COLUMNS,
        storageKey: columnStorageKey,
    });

    const buildDropdownPosition = useCallback((anchor) => {
        if (!anchor) return null;
        const rect = anchor.getBoundingClientRect();
        return {
            position: 'absolute',
            top: `${rect.bottom + window.scrollY + 8}px`,
            left: `${rect.left + window.scrollX}px`,
            zIndex: 260,
        };
    }, []);

    useEffect(() => {
        if (!periodTypeMenuOpen && !distributionModeMenuOpen) return undefined;

        const updateMenus = () => {
            if (periodTypeMenuOpen) {
                setPeriodTypeMenuStyle(buildDropdownPosition(periodTypeButtonRef.current));
            }
            if (distributionModeMenuOpen) {
                setDistributionModeMenuStyle(buildDropdownPosition(distributionModeButtonRef.current));
            }
        };

        const handlePointerDownOutside = (event) => {
            if (periodTypeButtonRef.current?.contains(event.target)) return;
            if (distributionModeButtonRef.current?.contains(event.target)) return;
            setPeriodTypeMenuOpen(false);
            setDistributionModeMenuOpen(false);
        };

        updateMenus();
        window.addEventListener('resize', updateMenus);
        window.addEventListener('scroll', updateMenus, true);
        document.addEventListener('pointerdown', handlePointerDownOutside, true);
        return () => {
            window.removeEventListener('resize', updateMenus);
            window.removeEventListener('scroll', updateMenus, true);
            document.removeEventListener('pointerdown', handlePointerDownOutside, true);
        };
    }, [buildDropdownPosition, distributionModeMenuOpen, periodTypeMenuOpen]);

    const currency = cronograma?.moneda || 'USD';
    const decMoneda = cronograma?.dec_moneda ?? 2;
    const decCalculos = cronograma?.dec_calculos ?? 4;
    const workdayStartHour = trabajoConfig?.hora_inicio_jornada ?? DEFAULT_WORKDAY_START_HOUR;
    const workdayHours = trabajoConfig?.jornada_laboral_horas ?? DEFAULT_WORKDAY_HOURS;
    const persistedPeriods = useMemo(() => cronograma?.periods || [], [cronograma?.periods]);
    const hasPeriodTypePreview = Boolean(cronograma?.period_type && configState.periodType !== cronograma.period_type);
    const canEditDistribution = !hasPeriodTypePreview;
    const ganttRowsByLineId = useMemo(() => new Map((trabajoRows || [])
        .filter((row) => row?.presupuesto_linea_id || row?.budget_line_id || row?.linea_id)
        .map((row) => [String(row.presupuesto_linea_id || row.budget_line_id || row.linea_id), row])), [trabajoRows]);
    const periods = useMemo(() => {
        if (!hasPeriodTypePreview) return persistedPeriods;
        return buildValoradoPreviewPeriods(
            detail,
            configState.periodType,
            workdayStartHour,
            workdayHours,
        );
    }, [configState.periodType, detail, hasPeriodTypePreview, persistedPeriods, workdayHours, workdayStartHour]);
    const effectiveGlobalDistribution = useMemo(() => (
        configState.distributionMode === 'usuario'
            ? normalizeDistributionToPeriodCount(configState.globalDistribution, periods.length)
            : buildHomogeneousDistribution(periods.length)
    ), [configState.distributionMode, configState.globalDistribution, periods.length]);
    const effectiveDisplayRows = useMemo(() => {
        if (!hasPeriodTypePreview) return displayRows;
        return displayRows.map((row) => {
            if (!row.is_calculable) return row;
            let previewDistribution = [...effectiveGlobalDistribution];
            if (configState.distributionMode === 'gantt') {
                if (row.requires_manual_schedule) {
                    previewDistribution = Array.from({ length: periods.length }, () => 0);
                } else {
                    const ganttRow = ganttRowsByLineId.get(String(row.budget_line_id || row.linea_id));
                    previewDistribution = ganttRow?.start_date
                        ? buildDistributionByDateOverlap(periods, ganttRow.start_date, ganttRow.end_date || ganttRow.start_date)
                        : buildHomogeneousDistribution(periods.length);
                }
            }
            return {
                ...row,
                distribution: previewDistribution,
                has_override: false,
            };
        });
    }, [configState.distributionMode, displayRows, effectiveGlobalDistribution, ganttRowsByLineId, hasPeriodTypePreview, periods]);
    const scheduledDisplayRows = useMemo(() => (
        (effectiveDisplayRows || []).map((row) => {
            if (!row?.is_calculable) return row;
            const ganttRow = ganttRowsByLineId.get(String(row.budget_line_id || row.linea_id));
            return {
                ...row,
                start_date: ganttRow?.start_date || row.start_date || null,
                finish_date: ganttRow?.end_date || row.end_date || null,
                end_date: ganttRow?.end_date || row.end_date || null,
            };
        })
    ), [effectiveDisplayRows, ganttRowsByLineId]);
    const leftGridSearchValue = useMemo(() => normalizeTextInputValue(leftGridSearch), [leftGridSearch]);
    useEffect(() => {
        if (leftGridSearchValue !== leftGridSearch) {
            setLeftGridSearch(leftGridSearchValue);
        }
    }, [leftGridSearch, leftGridSearchValue]);
    const leftGridSearchMatches = useMemo(() => {
        const query = String(leftGridSearchValue || '').trim();
        if (!query) return [];
        return (scheduledDisplayRows || []).map((row) => {
            const reference = [
                row?.item_visible,
                row?.edt_code_visible,
                formatCronogramaDescripcion(row),
                row?.unidad,
                formatDateTime(row?.finish_date || row?.end_date),
            ].filter(Boolean).join(' ');
            return {
                rowId: String(row.budget_line_id || row.linea_id),
                matches: includesNormalized(reference, query),
            };
        }).filter((entry) => entry.matches);
    }, [leftGridSearchValue, scheduledDisplayRows]);
    const leftGridSearchMatchIds = useMemo(
        () => new Set(leftGridSearchMatches.map((entry) => entry.rowId)),
        [leftGridSearchMatches]
    );
    const activeLeftGridSearchMatchId = activeLeftGridSearchIndex >= 0
        ? leftGridSearchMatches[activeLeftGridSearchIndex]?.rowId
        : null;
    const footer = useMemo(() => {
        if (!hasPeriodTypePreview) {
            return cronograma?.footer || {
                inversion_parcial: [],
                avance_parcial_pct: [],
                inversion_acumulada: [],
                avance_acumulado_pct: [],
            };
        }
        return buildValoradoFooterFromRows(effectiveDisplayRows, periods.length, decMoneda, decCalculos);
    }, [cronograma?.footer, decCalculos, decMoneda, effectiveDisplayRows, hasPeriodTypePreview, periods.length]);
    const curveS = useMemo(() => {
        if (!hasPeriodTypePreview) return cronograma?.curve_s || [];
        return periods.map((period, index) => ({
            label: resolveValoradoPeriodLabel(period, index),
            value: footer.inversion_acumulada[index] || 0,
        }));
    }, [cronograma?.curve_s, footer.inversion_acumulada, hasPeriodTypePreview, periods]);
    const curveSDisplayItems = useMemo(() => (
        (curveS || []).map((point, index) => ({
            ...point,
            label: resolveValoradoPeriodLabel(point?.label || periods[index], index),
            rangeLabel: formatValoradoPeriodRangeLabel(periods[index]),
        }))
    ), [curveS, periods]);
    const cashFlow = useMemo(() => {
        if (!hasPeriodTypePreview) return cronograma?.cash_flow || buildValoradoCashFlowFromFooter(periods, footer, workdayStartHour, workdayHours);
        return buildValoradoCashFlowFromFooter(periods, footer, workdayStartHour, workdayHours);
    }, [cronograma?.cash_flow, footer, hasPeriodTypePreview, periods, workdayHours, workdayStartHour]);
    const manualScheduleSummary = useMemo(() => summarizeManualScheduleRows(effectiveDisplayRows, currency, decMoneda), [effectiveDisplayRows, currency, decMoneda]);
    const activeManualTemporalSummary = useMemo(() => summarizeActiveManualTemporalRows(effectiveDisplayRows, currency, decMoneda), [effectiveDisplayRows, currency, decMoneda]);
    const selectedDistributionModeLabel = DISTRIBUTION_OPTIONS.find((opt) => opt.value === configState.distributionMode)?.label || 'Usuario';
    const cashFlowSummary = useMemo(() => {
        const points = cashFlow || [];
        const referenceDistribution = buildCashFlowHourWeightedReference(points);
        const lastPoint = points[points.length - 1] || null;
        const totalCost = Number(lastPoint?.cumulative_cost ?? points.reduce((acc, item) => acc + Number(item.cost || 0), 0));
        const totalWorkHours = Number(points.reduce((acc, item) => acc + Number(item.work_hours || 0), 0).toFixed(2));
        const totalValorado = Number((footer.inversion_acumulada || [])[footer.inversion_acumulada.length - 1] || 0);
        const difference = Number((totalCost - totalValorado).toFixed(decMoneda));
        const pendingManualAmount = Number(manualScheduleSummary.pendingAmount || 0);
        const scheduledAmount = Number(manualScheduleSummary.scheduledAmount || totalValorado || 0);
        const scheduledCoveragePct = Number(manualScheduleSummary.scheduledPct || 0);
        const peakPoint = points.reduce((best, item) => (
            Number(item.cost || 0) > Number(best?.cost || 0) ? item : best
        ), null);

        const resourceCategoryTotals = points.reduce((acc, item) => {
            const categoryCosts = item?.category_costs || {};
            const categoryHours = item?.category_hours || {};
            Object.entries(categoryCosts).forEach(([key, value]) => {
                acc[key] = acc[key] || { cost: 0, hours: 0 };
                acc[key].cost += Number(value || 0);
            });
            Object.entries(categoryHours).forEach(([key, value]) => {
                acc[key] = acc[key] || { cost: 0, hours: 0 };
                acc[key].hours += Number(value || 0);
            });
            return acc;
        }, {});
        const resourceCategoryCards = Object.entries(resourceCategoryTotals)
            .map(([label, values]) => ({
                label,
                cost: Number((values.cost || 0).toFixed(decMoneda)),
                hours: Number((values.hours || 0).toFixed(2)),
            }))
            .filter((item) => item.cost > 0.0001 || item.hours > 0.0001)
            .sort((left, right) => right.cost - left.cost);
        const dominantResourceCategory = resourceCategoryCards[0] || null;
        const sourceLabel = cronograma?.distribution_mode === 'gantt'
            ? (cronograma?.has_line_overrides
                ? 'Gantt + overrides valorados'
                : effectiveDisplayRows?.some((row) => row?.requires_manual_schedule)
                    ? 'Gantt con temporalidad parcial'
                    : 'Gantt vía Valorado')
            : (activeManualTemporalSummary.count
                ? `${selectedDistributionModeLabel} con temporalidad manual preservada`
                : (cronograma?.has_line_overrides ? 'Valorado con overrides' : 'Distribución valorada'));
        const deviationItems = points.map((item, index) => {
            const expectedPeriodPct = Number(referenceDistribution[index] || 0);
            const expectedPct = referenceDistribution
                .slice(0, index + 1)
                .reduce((acc, value) => acc + Number(value || 0), 0);
            const actualPct = Number(item.cumulative_pct || 0);
            const deviationPct = Number((actualPct - expectedPct).toFixed(2));
            return {
                label: item.label || `P${index + 1}`,
                expectedPeriodPct,
                expectedPct,
                actualPct,
                deviationPct,
                absDeviationPct: Math.abs(deviationPct),
                estimatedImpact: totalCost * (Math.abs(deviationPct) / 100),
                direction: deviationPct > 0 ? 'adelantada' : deviationPct < 0 ? 'retrasada' : 'alineada',
            };
        });
        const proposalDiffItems = [...deviationItems]
            .filter((item) => item.absDeviationPct > 0.01)
            .sort((a, b) => b.absDeviationPct - a.absDeviationPct)
            .slice(0, 3)
            .map((item) => ({
                ...item,
                formattedExpectedPeriodPct: formatPercent(item.expectedPeriodPct, 2),
                formattedActualPct: formatPercent(item.actualPct, 2),
                formattedExpectedPct: formatPercent(item.expectedPct, 2),
                formattedDeviationPct: formatPercent(item.absDeviationPct, 2),
                formattedImpact: formatCurrency(Number(item.estimatedImpact || 0), currency, decMoneda),
            }));
        const peakDeviation = deviationItems.reduce((best, item) => (
            item.absDeviationPct > Number(best?.absDeviationPct || 0) ? item : best
        ), null);
        const hasRelevantDeviation = Number(peakDeviation?.absDeviationPct || 0) >= 5;
        const hasManualPending = manualScheduleSummary.count && pendingManualAmount > 0.01;
        const isConsistent = hasManualPending ? pendingManualAmount <= 0.01 : Math.abs(difference) <= 0.01;
        const statusTone = !isConsistent
            ? 'danger'
            : (hasRelevantDeviation || hasManualPending ? 'warning' : 'success');
        const statusLabel = !isConsistent
            ? 'No cuadra'
            : (hasManualPending ? 'Pendiente' : (hasRelevantDeviation ? 'Revisar' : 'OK'));
        const recommendation = peakDeviation?.direction === 'adelantada'
                ? 'La caja concentra inversión antes de la referencia. La propuesta inversa futura debe evaluar desplazar parte de la distribución hacia periodos posteriores o revisar fechas tempranas del Gantt.'
            : peakDeviation?.direction === 'retrasada'
                ? 'La caja concentra inversión después de la referencia. La propuesta inversa futura debe evaluar adelantar distribución o revisar fechas tardías del Gantt.'
                : 'La caja se mantiene alineada con la referencia ponderada por horas efectivas; no se detecta presión financiera relevante.';
        return {
            sourceLabel,
            statusTone,
            statusLabel,
            hasManualPending,
            isConsistent,
            consistencyLabel: manualScheduleSummary.count ? 'Cobertura Valorado' : 'Consistencia Valorado',
            difference,
            formattedDifference: formatCurrency(Math.abs(difference), currency, decMoneda),
            totalCost,
            formattedTotalCost: formatCurrency(totalCost, currency, decMoneda),
            pendingManualAmount,
            formattedPendingManualAmount: formatCurrency(pendingManualAmount, currency, decMoneda),
            scheduledAmount,
            formattedScheduledAmount: formatCurrency(scheduledAmount, currency, decMoneda),
            scheduledCoveragePct,
            formattedScheduledCoveragePct: formatPercent(scheduledCoveragePct, 2),
            totalWorkHours,
            peakLabel: peakPoint?.label || 'Sin periodo',
            peakCost: Number(peakPoint?.cost || 0),
            formattedPeakCost: formatCurrency(Number(peakPoint?.cost || 0), currency, decMoneda),
            peakWindowLabel: peakPoint ? `${formatDateTime(peakPoint.starts_at)} - ${formatDateTime(peakPoint.ends_at)}` : 'Sin ventana',
            peakDominantCategory: peakPoint?.dominant_category || dominantResourceCategory?.label || 'Sin categoría',
            peakDeviationLabel: peakDeviation?.label || 'Sin periodo',
            peakDeviationPct: Number(peakDeviation?.deviationPct || 0),
            formattedPeakDeviationPct: formatPercent(Math.abs(Number(peakDeviation?.deviationPct || 0)), 2),
            peakDeviationDirection: peakDeviation?.direction || 'alineada',
            formattedPeakDeviationImpact: formatCurrency(Number(peakDeviation?.estimatedImpact || 0), currency, decMoneda),
            hasRelevantDeviation,
            recommendation,
            referenceModeLabel: totalWorkHours > 0 ? 'Referencia horaria efectiva' : 'Referencia homogénea',
            proposalDiffItems,
            resourceCategoryCards,
            dominantResourceCategory,
        };
    }, [currency, decMoneda, effectiveDisplayRows, footer.inversion_acumulada, manualScheduleSummary, selectedDistributionModeLabel, activeManualTemporalSummary.count, cashFlow, cronograma?.distribution_mode, cronograma?.has_line_overrides]);
    const compactFooterSummaryCards = useMemo(() => {
        const lastAccumulatedProgress = Number((footer.avance_acumulado_pct || [])[footer.avance_acumulado_pct.length - 1] || 0);
        const statusAccent = cashFlowSummary.statusTone === 'danger'
            ? 'danger'
            : cashFlowSummary.statusTone === 'warning'
                ? 'warning'
                : 'success';
        return [
            {
                id: 'status',
                label: 'Estado',
                value: cashFlowSummary.statusLabel,
                accent: statusAccent,
                title: `Estado financiero: ${cashFlowSummary.statusLabel}. ${cashFlowSummary.consistencyLabel}: ${
                    manualScheduleSummary.count
                        ? `${cashFlowSummary.formattedScheduledCoveragePct} ya entra; pendiente ${cashFlowSummary.formattedPendingManualAmount}`
                        : cashFlowSummary.isConsistent
                            ? 'cuadra con el Valorado'
                            : `diferencia ${cashFlowSummary.formattedDifference}`
                }.`,
            },
            {
                id: 'source',
                label: 'Origen',
                value: cashFlowSummary.sourceLabel,
                accent: 'total',
                title: `Origen financiero: ${cashFlowSummary.sourceLabel}. Referencia: ${cashFlowSummary.referenceModeLabel}.`,
            },
            {
                id: 'total',
                label: 'Total',
                value: cashFlowSummary.formattedTotalCost,
                accent: 'default',
                title: `Total acumulado de inversion/caja: ${cashFlowSummary.formattedTotalCost}.`,
            },
            {
                id: 'peak',
                label: `Pico ${cashFlowSummary.peakLabel}`,
                value: cashFlowSummary.formattedPeakCost,
                accent: 'info',
                title: `Pico financiero: ${cashFlowSummary.peakLabel} por ${cashFlowSummary.formattedPeakCost}. Ventana: ${cashFlowSummary.peakWindowLabel}. Categoria dominante: ${cashFlowSummary.peakDominantCategory}.`,
            },
            {
                id: 'risk',
                label: cashFlowSummary.hasManualPending ? 'Pendiente' : `Riesgo ${cashFlowSummary.peakDeviationLabel}`,
                value: cashFlowSummary.hasManualPending ? cashFlowSummary.formattedPendingManualAmount : cashFlowSummary.formattedPeakDeviationPct,
                accent: cashFlowSummary.hasManualPending || cashFlowSummary.hasRelevantDeviation ? 'warning' : 'default',
                title: cashFlowSummary.hasManualPending
                    ? `Temporalidad manual pendiente: ${cashFlowSummary.formattedPendingManualAmount}. Cobertura incorporada: ${cashFlowSummary.formattedScheduledCoveragePct}.`
                    : `Mayor desviacion contra ${cashFlowSummary.referenceModeLabel.toLowerCase()}: ${cashFlowSummary.peakDeviationLabel}, caja ${cashFlowSummary.peakDeviationDirection} ${cashFlowSummary.formattedPeakDeviationPct}. Impacto: ${cashFlowSummary.formattedPeakDeviationImpact}.`,
            },
            {
                id: 'progress',
                label: 'Avance',
                value: formatPercent(lastAccumulatedProgress, 2),
                accent: lastAccumulatedProgress >= 99.99 ? 'success' : 'default',
                title: `Avance acumulado: ${formatPercent(lastAccumulatedProgress, 2)}. Periodos: ${periods.length}.`,
            },
        ];
    }, [cashFlowSummary, footer.avance_acumulado_pct, manualScheduleSummary.count, periods.length]);

    const cashConstraintDraftSummary = useMemo(() => {
        const points = cashFlow || [];
        if (!points.length) {
            return {
                targetDistribution: [],
                diffItems: [],
                formattedRedistribution: formatCurrency(0, currency, decMoneda),
            };
        }
        const candidateRows = (effectiveDisplayRows || [])
            .filter((row) => row?.is_calculable && !row?.requires_manual_schedule && Number(row.precio_total || 0) > 0);
        const currentDistribution = normalizeDistributionToPeriodCount(
            points.map((point) => Number(point.cost_pct || 0)),
            points.length,
        );
        const targetDistribution = buildCashFlowHourWeightedReference(points);
        let redistributedAmount = 0;
        const diffItems = currentDistribution
            .map((value, index) => {
                const target = Number(targetDistribution[index] || 0);
                const delta = Number((target - Number(value || 0)).toFixed(2));
                const estimatedImpact = cashFlowSummary.totalCost * (Math.abs(delta) / 100);
                redistributedAmount += estimatedImpact;
                const lineCandidates = candidateRows
                    .map((row) => {
                        const rowDistribution = normalizeDistributionToPeriodCount(row.distribution || [], points.length);
                        const rowPct = Number(rowDistribution[index] || 0);
                        const lineTotal = Number(row.precio_total || 0);
                        const periodCost = lineTotal * (rowPct / 100);
                        const potentialCost = delta >= 0
                            ? lineTotal * (Math.max(0, 100 - rowPct) / 100)
                            : periodCost;
                        return {
                            codigo: formatCronogramaReference(row),
                            descripcion: row.descripcion || 'Sin descripción',
                            rowPct,
                            periodCost,
                            potentialCost,
                        };
                    })
                    .filter((candidate) => candidate.potentialCost > 0.01)
                    .sort((a, b) => b.potentialCost - a.potentialCost)
                    .slice(0, 2)
                    .map((candidate) => ({
                        ...candidate,
                        formattedRowPct: formatPercent(candidate.rowPct, 2),
                        formattedPeriodCost: formatCurrency(candidate.periodCost, currency, decMoneda),
                        formattedPotentialCost: formatCurrency(candidate.potentialCost, currency, decMoneda),
                    }));
                return {
                    label: resolveValoradoPeriodLabel(points[index]?.label, index),
                    currentPct: Number(value || 0),
                    targetPct: target,
                    delta,
                    absDelta: Math.abs(delta),
                    estimatedImpact,
                    action: delta > 0 ? 'incrementar' : delta < 0 ? 'reducir' : 'mantener',
                    formattedCurrentPct: formatPercent(Number(value || 0), 2),
                    formattedTargetPct: formatPercent(target, 2),
                    formattedDeltaPct: formatPercent(Math.abs(delta), 2),
                    formattedImpact: formatCurrency(estimatedImpact, currency, decMoneda),
                    lineCandidates,
                };
            })
            .filter((item) => item.absDelta > 0.01)
            .sort((a, b) => b.absDelta - a.absDelta)
            .slice(0, 3);

        return {
            targetDistribution,
            diffItems,
            formattedRedistribution: formatCurrency(redistributedAmount / 2, currency, decMoneda),
        };
    }, [cashFlow, cashFlowSummary.totalCost, currency, decMoneda, effectiveDisplayRows]);
    const cashConstraintLineDraftSummary = useMemo(() => (
        buildCashConstraintLineDraft(
            effectiveDisplayRows,
            periods.length,
            cashConstraintDraftSummary.targetDistribution,
            currency,
            decMoneda,
        )
    ), [cashConstraintDraftSummary.targetDistribution, currency, decMoneda, effectiveDisplayRows, periods.length]);
    const reconciliationSummary = useMemo(
        () => buildGanttReconciliationSummary(effectiveDisplayRows, periods, trabajoRows, currency, decMoneda),
        [currency, decMoneda, effectiveDisplayRows, periods, trabajoRows],
    );
    const reconciliationSignal = useMemo(() => {
        if (!reconciliationSummary.hasDifferences) {
            return {
                label: 'OK',
                detail: 'Sin impacto de reconciliacion pendiente.',
                cardClass: 'border-emerald-400/20 bg-emerald-400/8',
                dotClass: 'bg-emerald-400',
                labelClass: 'text-emerald-300',
                valueClass: 'text-emerald-200',
            };
        }
        const requiresReview = Number(reconciliationSummary.unscheduled || 0) > 0 || Number(reconciliationSummary.manualScheduleRequired || 0) > 0;
        return {
            label: requiresReview ? 'Revisar' : 'Impacto',
            detail: requiresReview
                ? `${reconciliationSummary.differences.length} linea(s) cambian; ${reconciliationSummary.unscheduled || 0} sin fecha y ${reconciliationSummary.manualScheduleRequired || 0} pendientes manuales.`
                : `${reconciliationSummary.differences.length} linea(s) cambiarian desde Gantt.`,
            cardClass: requiresReview
                ? 'border-red-400/25 bg-red-400/8'
                : 'border-[#F39200]/25 bg-[#F39200]/8',
            dotClass: requiresReview ? 'bg-red-400' : 'bg-[#F39200]',
            labelClass: requiresReview ? 'text-red-300' : 'text-[#ffbe64]',
            valueClass: requiresReview ? 'text-red-200' : 'text-[#ffbe64]',
        };
    }, [reconciliationSummary]);

    const overrideSummary = useMemo(
        () => buildOverrideReconciliationSummary(
            effectiveDisplayRows,
            periods,
            trabajoRows,
            configState.distributionMode,
            effectiveGlobalDistribution,
            currency,
            decMoneda,
        ),
        [
            configState.distributionMode,
            currency,
            decMoneda,
            effectiveDisplayRows,
            effectiveGlobalDistribution,
            periods,
            trabajoRows,
        ],
    );

    const syncStatus = useMemo(() => {
        if (hasPeriodTypePreview || configState.distributionMode !== cronograma?.distribution_mode) {
            if (configState.distributionMode !== 'gantt' && activeManualTemporalSummary.count) {
                return {
                    tone: 'warning',
                    label: 'Pendiente de aplicar',
                    detail: `La vista está en previsualización. ${activeManualTemporalSummary.count} línea(s) conservan ventana temporal manual válida en Gantt, pero al aplicar ${selectedDistributionModeLabel} el Valorado dejará de derivar económicamente desde esas ventanas y las mantendrá solo como referencia operativa.`,
                };
            }
            return {
                tone: 'warning',
                label: 'Pendiente de aplicar',
                detail: 'La vista está en previsualización; aplica la configuración antes de editar o reconciliar.',
            };
        }
        if (cronograma?.has_line_overrides) {
            return {
                tone: 'override',
                label: 'Override manual',
                detail: 'Hay distribuciones por línea que tienen prioridad sobre la derivación desde Gantt.',
            };
        }
        if (cronograma?.distribution_mode === 'gantt' && manualScheduleSummary.count) {
            return {
                tone: 'warning',
                label: 'Sincronización parcial',
                detail: `${manualScheduleSummary.count} línea(s) requieren programación manual para derivación temporal real. ${manualScheduleSummary.formattedPendingAmount} siguen fuera de periodización hasta definir su ventana manual.`,
            };
        }
        if (cronograma?.distribution_mode === 'gantt') {
            return {
                tone: 'synced',
                label: 'Sincronizado desde Gantt',
                detail: 'Valorado y Caja se derivan desde las fechas vigentes del Gantt.',
            };
        }
        if (activeManualTemporalSummary.count) {
            return {
                tone: 'manual',
                label: 'Modo valorado',
                detail: `${activeManualTemporalSummary.count} línea(s) mantienen ventana temporal manual válida en Gantt, pero el Valorado opera con ${selectedDistributionModeLabel}. Esas ventanas quedan preservadas como referencia operativa y no gobiernan la distribución económica hasta volver a "Desde Gantt".`,
            };
        }
        return {
            tone: 'manual',
            label: 'Modo valorado',
            detail: 'El cronograma usa una distribución global; Gantt no se modifica automáticamente.',
        };
    }, [activeManualTemporalSummary.count, configState.distributionMode, cronograma?.distribution_mode, cronograma?.has_line_overrides, hasPeriodTypePreview, manualScheduleSummary.count, selectedDistributionModeLabel]);

    // Sincronización de scroll vertical
    const syncScroll = (source, target) => {
        if (!source || !target) return;
        if (target.scrollTop !== source.scrollTop) {
            target.scrollTop = source.scrollTop;
        }
    };

    // Sincronización de scroll horizontal
    const syncHorizontalScroll = (source, target) => {
        if (!source || !target) return;
        if (target.scrollLeft !== source.scrollLeft) {
            target.scrollLeft = source.scrollLeft;
        }
    };

    const scrollLeftGridRowIntoViewById = useCallback((rowId, behavior = 'smooth') => {
        const normalizedId = String(rowId || '');
        if (!normalizedId) return;
        const rowNode = leftGridRowRefs.current.get(normalizedId);
        const scroller = leftRef.current;
        if (!rowNode || !scroller) return;
        const rowTop = rowNode.offsetTop;
        const rowHeight = rowNode.offsetHeight || 1;
        const viewportTop = scroller.scrollTop;
        const viewportHeight = scroller.clientHeight || 1;
        const targetTop = Math.max(0, rowTop - Math.max(0, (viewportHeight - rowHeight) / 2));
        scroller.scrollTo({ top: targetTop, behavior });
        if (rightRef.current) {
            rightRef.current.scrollTo({ top: targetTop, behavior });
        }
    }, []);

    const navigateLeftGridSearchMatch = useCallback((nextIndex = activeLeftGridSearchIndex + 1) => {
        if (!leftGridSearchMatches.length) return;
        const normalizedIndex = ((nextIndex % leftGridSearchMatches.length) + leftGridSearchMatches.length) % leftGridSearchMatches.length;
        const targetId = leftGridSearchMatches[normalizedIndex]?.rowId;
        setActiveLeftGridSearchIndex(normalizedIndex);
        if (!targetId) return;
        setSelectedRowIds(new Set([targetId]));
        window.requestAnimationFrame(() => {
            scrollLeftGridRowIntoViewById(targetId);
        });
    }, [activeLeftGridSearchIndex, leftGridSearchMatches, scrollLeftGridRowIntoViewById, setSelectedRowIds]);

    useEffect(() => {
        const query = String(leftGridSearchValue || '').trim();
        if (!query || leftGridSearchMatches.length === 0) {
            setActiveLeftGridSearchIndex(-1);
            return;
        }
        setActiveLeftGridSearchIndex(0);
        const targetId = leftGridSearchMatches[0]?.rowId;
        if (!targetId) return;
        setSelectedRowIds(new Set([targetId]));
        window.requestAnimationFrame(() => {
            scrollLeftGridRowIntoViewById(targetId);
        });
    }, [leftGridSearchMatches, leftGridSearchValue, scrollLeftGridRowIntoViewById, setSelectedRowIds]);

    const handleToggleConfig = () => {
        const next = !showConfig;
        setShowConfig(next);
        setShowFooter(true);
    };

    const handleToggleFooter = () => {
        setShowFooter(true);
        setShowConfig(false);
        setSummaryExpanded((current) => !current);
    };

    const handleCashConstraintProposal = useCallback(async () => {
        const diffText = cashFlowSummary.proposalDiffItems?.length
            ? [
                'Diff de propuesta:',
                ...cashFlowSummary.proposalDiffItems.map((item) => (
                    `${item.label}: real ${item.formattedActualPct}, referencia acumulada ${item.formattedExpectedPct} (periodo ${item.formattedExpectedPeriodPct}), desviación ${item.direction} ${item.formattedDeviationPct}, impacto ${item.formattedImpact}`
                )),
            ].join('\n')
            : `Diff de propuesta: no hay desviaciones relevantes frente a la ${cashFlowSummary.referenceModeLabel.toLowerCase()}.`;
        await appAlert({
            title: 'Propuesta financiera',
            message: [
                `Mayor desviación: ${cashFlowSummary.peakDeviationLabel} (${cashFlowSummary.peakDeviationDirection} ${cashFlowSummary.formattedPeakDeviationPct}).`,
                `Impacto estimado: ${cashFlowSummary.formattedPeakDeviationImpact}.`,
                diffText,
                cashFlowSummary.recommendation,
                'Guardarraíl: esta acción no modifica Gantt, Cronograma Valorado ni Flujo de Caja. La aplicación automática queda reservada para una fase posterior con diff y confirmación.',
            ].join('\n\n'),
            tone: cashFlowSummary.hasRelevantDeviation ? 'warning' : 'info',
        });
    }, [
        cashFlowSummary.formattedPeakDeviationImpact,
        cashFlowSummary.formattedPeakDeviationPct,
        cashFlowSummary.referenceModeLabel,
        cashFlowSummary.hasRelevantDeviation,
        cashFlowSummary.peakDeviationDirection,
        cashFlowSummary.peakDeviationLabel,
        cashFlowSummary.proposalDiffItems,
        cashFlowSummary.recommendation,
    ]);

    const handlePrepareCashConstraintDraft = useCallback(async () => {
        if (!periods.length) return;
        if (hasPeriodTypePreview) {
            await appAlert({
                title: 'Configuración pendiente',
                message: 'Primero aplica el tipo de periodo pendiente antes de preparar una propuesta financiera.',
                tone: 'warning',
            });
            return;
        }
        if (!cashFlowSummary.hasRelevantDeviation) {
            await appAlert({
                title: 'Caja alineada',
                message: `No hay una desviación financiera relevante frente a la ${cashFlowSummary.referenceModeLabel.toLowerCase()}. No se preparó ningún borrador.`,
                tone: 'info',
            });
            return;
        }

        const targetDistribution = cashConstraintDraftSummary.targetDistribution.length
            ? cashConstraintDraftSummary.targetDistribution
            : buildHomogeneousDistribution(periods.length);
        const draftDiffText = cashConstraintDraftSummary.diffItems.length
            ? [
                `Impacto aproximado del borrador: ${cashConstraintDraftSummary.formattedRedistribution}.`,
                'Cambios principales:',
                ...cashConstraintDraftSummary.diffItems.map((item) => (
                    [
                        `${item.label}: ${item.action} ${item.formattedDeltaPct} (${item.formattedCurrentPct} -> ${item.formattedTargetPct}), impacto ${item.formattedImpact}.`,
                        item.lineCandidates?.length
                            ? `Partidas candidatas: ${item.lineCandidates.map((candidate) => `${candidate.codigo} ${normalizeDescriptionCapitalization(candidate.descripcion)} (${candidate.formattedPotentialCost})`).join('; ')}`
                            : 'Partidas candidatas: sin partidas relevantes en este periodo.',
                    ].join(' ')
                )),
            ].join('\n')
            : 'El borrador no introduce diferencias relevantes frente a la distribución actual.';
        const confirmed = await appConfirm({
            title: 'Preparar propuesta financiera',
            subtitle: 'Borrador controlado Caja -> Valorado',
            message: [
                `Se preparará una distribución objetivo para ${periods.length} periodo(s), ponderada según la ${cashFlowSummary.referenceModeLabel.toLowerCase()}.`,
                draftDiffText,
                'Esto cambiará la configuración visible a `Definido por usuario`, pero no guardará todavía.',
                'El Gantt no se moverá y las fechas no se modificarán. Para persistir el borrador tendrás que pulsar `Aplicar configuración`.',
            ].join('\n\n'),
            confirmLabel: 'Preparar borrador',
            tone: 'warning',
        });
        if (!confirmed) return;

        onConfigChange('distributionMode', 'usuario');
        onConfigChange('globalDistribution', targetDistribution);
        await appAlert({
            title: 'Borrador preparado',
            message: 'La propuesta financiera quedó cargada como distribución definida por usuario. Revisa el resultado y pulsa `Aplicar configuración` si quieres consolidarla.',
            tone: 'success',
        });
    }, [
        cashConstraintDraftSummary.diffItems,
        cashConstraintDraftSummary.formattedRedistribution,
        cashConstraintDraftSummary.targetDistribution,
        cashFlowSummary.hasRelevantDeviation,
        cashFlowSummary.referenceModeLabel,
        hasPeriodTypePreview,
        onConfigChange,
        periods.length,
    ]);

    const handleApplyCashConstraintLineDraft = useCallback(async () => {
        if (!periods.length) return;
        if (hasPeriodTypePreview) {
            await appAlert({
                title: 'Configuración pendiente',
                message: 'Primero aplica el tipo de periodo pendiente antes de aplicar una propuesta por partidas.',
                tone: 'warning',
            });
            return;
        }
        if (!cashFlowSummary.hasRelevantDeviation) {
            await appAlert({
                title: 'Caja alineada',
                message: `No hay una desviación financiera relevante frente a la ${cashFlowSummary.referenceModeLabel.toLowerCase()}. No se aplicó ningún borrador por partidas.`,
                tone: 'info',
            });
            return;
        }
        if (!cashConstraintLineDraftSummary.drafts.length) {
            await appAlert({
                title: 'Sin propuesta por partidas',
                message: 'No se encontraron partidas suficientes para preparar una redistribución controlada por línea.',
                tone: 'info',
            });
            return;
        }

        const changeText = cashConstraintLineDraftSummary.changes.length
            ? [
                `Redistribución aproximada: ${cashConstraintLineDraftSummary.formattedRedistribution}.`,
                `Líneas afectadas: ${cashConstraintLineDraftSummary.drafts.length}.`,
                'Movimientos principales:',
                ...cashConstraintLineDraftSummary.changes.slice(0, 5).map((change) => (
                    `${change.codigo} ${normalizeDescriptionCapitalization(change.descripcion)}: ${resolveValoradoPeriodLabel(periods[change.fromIndex], change.fromIndex)} -> ${resolveValoradoPeriodLabel(periods[change.toIndex], change.toIndex)} (${change.formattedAmount})`
                )),
            ].join('\n')
            : 'La propuesta no requiere movimientos relevantes por línea.';

        const confirmed = await appConfirm({
            title: 'Aplicar propuesta por partidas',
            subtitle: 'Borrador controlado Caja -> Valorado',
            message: [
                changeText,
                'Esta acción guardará overrides por línea en el Cronograma Valorado.',
                'El Gantt no se moverá y las fechas no se modificarán.',
                'Podrás retirar estos overrides con `Limpiar overrides` si necesitas volver a la distribución global o derivada desde Gantt.',
            ].join('\n\n'),
            confirmLabel: 'Aplicar por partidas',
            tone: 'warning',
        });
        if (!confirmed) return;

        await onApplyCashConstraintLineDraft?.(cashConstraintLineDraftSummary);
    }, [
        cashConstraintLineDraftSummary,
        cashFlowSummary.hasRelevantDeviation,
        cashFlowSummary.referenceModeLabel,
        hasPeriodTypePreview,
        onApplyCashConstraintLineDraft,
        periods,
    ]);

    if (cronogramaLoading) {
        return (
            <div className="flex h-full min-h-[440px] items-center justify-center rounded-[2rem] border border-zinc-200 bg-white">
                <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                    Cargando cronograma valorado
                </div>
            </div>
        );
    }

    if (!cronograma) {
        return (
            <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white px-8 py-12 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-500">Cronograma Valorado</p>
                <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-zinc-900">
                    {selectedBudget ? 'Cronograma valorado no disponible' : 'No hay cronograma activo'}
                </h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-500">
                    {selectedBudget
                        ? `Hay un presupuesto operativo activo (${selectedBudget?.descripcion || `Presupuesto ${selectedBudget?.id || ''}`}), pero el cronograma valorado no pudo cargarse con los datos actuales.`
                        : 'Selecciona un presupuesto para inicializar el cronograma valorado del proyecto.'}
                </p>
            </div>
        );
    }

    const activeBaseColumns = valoradoColumnSettings.visibleColumns;
    const activeBaseGridColumns = valoradoColumnSettings.gridTemplateColumns;
    const activeBaseGridWidth = Math.max(
        BASE_COLUMNS.filter((column) => column.locked).reduce((total, column) => total + Number(column.width || 0), 0),
        valoradoColumnSettings.contentWidth || VALORADO_LEFT_GRID_WIDTH,
    );
    const LEFT_WIDTH = activeBaseGridWidth;
    return (
        <div className="flex h-full min-h-0 flex-col gap-3 overflow-hidden">
            {/* Configuración legacy reemplazada por banda integrada bajo el header del valorado. */}
            {false ? (
            <div className={`transition-all duration-300 ease-in-out ${showConfig ? 'shrink-0' : 'h-0 overflow-hidden opacity-0'}`}>
                <section className="grid grid-cols-1 xl:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] gap-3">
                    <div className="rounded-[1.25rem] border border-white/10 bg-[#101318] p-3.5 text-white shadow-[0_20px_44px_rgba(15,23,42,0.18)] ring-1 ring-black/12">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                <CalendarRange className="h-4.5 w-4.5 text-sky-300" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Ventana valorada</p>
                                <h3 className="text-sm font-black uppercase tracking-tight text-white/92">Ejecución base</h3>
                            </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 xl:grid-cols-5 gap-1.5">
                            <div className="rounded-[0.9rem] border border-white/8 bg-white/[0.04] px-2.5 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/36">Inicio</p>
                                <p className="mt-1 text-[11px] font-black text-white/92">{formatDateTime(applyWorkdayStartTime(detail?.fecha_inicio, workdayStartHour) || periods[0]?.starts_at)}</p>
                            </div>
                            <div className="rounded-[0.9rem] border border-white/8 bg-white/[0.04] px-2.5 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/36">Fin</p>
                                <p className="mt-1 text-[11px] font-black text-white/92">{formatDateTime(applyWorkdayFinishTime(detail?.fecha_finalizacion, workdayStartHour, workdayHours) || periods[periods.length - 1]?.ends_at)}</p>
                            </div>
                            <div className="rounded-[0.9rem] border border-white/8 bg-white/[0.04] px-2.5 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/36">Plazo</p>
                                <p className="mt-1 text-[11px] font-black text-white/92">{Number(detail?.plazo_ejecucion || 0)} días</p>
                            </div>
                            <div className="rounded-[0.9rem] border border-white/8 bg-white/[0.04] px-2.5 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/36">Periodos</p>
                                <p className="mt-1 text-[11px] font-black text-white/92">{periods.length}</p>
                            </div>
                            <div className="rounded-[0.9rem] border border-white/8 bg-white/[0.04] px-2.5 py-2">
                                <span className="block text-[8px] font-black uppercase tracking-[0.16em] text-white/36">Periodo</span>
                                <div className="relative mt-1">
                                    <button
                                        ref={periodTypeButtonRef}
                                        type="button"
                                        onClick={() => {
                                            setDistributionModeMenuOpen(false);
                                            setPeriodTypeMenuOpen((current) => !current);
                                        }}
                                        className="flex h-8 w-full items-center justify-between gap-2 rounded-[0.78rem] bg-white/[0.03] px-2.5 text-left text-[11px] font-black text-white/92 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200]/35"
                                        aria-haspopup="menu"
                                        aria-expanded={periodTypeMenuOpen}
                                    >
                                        <span>{PERIOD_OPTIONS.find((option) => option.value === configState.periodType)?.label || 'Mensual'}</span>
                                        <ChevronDown className={`h-3.5 w-3.5 text-white/44 transition ${periodTypeMenuOpen ? 'rotate-180' : ''}`} />
                                    </button>
                                    {periodTypeMenuOpen && periodTypeMenuStyle
                                        ? createPortal(
                                            <div
                                                style={{
                                                    ...periodTypeMenuStyle,
                                                    minWidth: `${Math.max(periodTypeButtonRef.current?.offsetWidth || 0, 168)}px`,
                                                }}
                                                className="rounded-[0.95rem] border border-zinc-700 bg-[#16191f] p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.36)]"
                                            >
                                                <div className="px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/45">
                                                    Tipo de periodo
                                                </div>
                                                <div className="mt-1 space-y-1">
                                                    {PERIOD_OPTIONS.map((option) => {
                                                        const isActive = configState.periodType === option.value;
                                                        return (
                                                            <button
                                                                key={`period-option-${option.value}`}
                                                                type="button"
                                                                onClick={() => {
                                                                    onConfigChange('periodType', option.value);
                                                                    setPeriodTypeMenuOpen(false);
                                                                }}
                                                                className={`flex w-full items-center justify-between rounded-[0.78rem] border px-3 py-2 text-left transition ${
                                                                    isActive
                                                                        ? 'border-[#2b86bb] bg-[#173247] text-white'
                                                                        : 'border-transparent bg-transparent text-white/80 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                                                                }`}
                                                            >
                                                                <span className="text-[10px] font-black uppercase tracking-[0.12em]">{option.label}</span>
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>,
                                            document.body,
                                        )
                                        : null}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="rounded-[1.25rem] border border-white/10 bg-[#101318] p-3.5 text-white shadow-[0_20px_44px_rgba(15,23,42,0.18)] ring-1 ring-black/12">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04]">
                                <Clock3 className="h-4.5 w-4.5 text-sky-300" />
                            </div>
                            <div>
                                <p className="text-[8px] font-black uppercase tracking-[0.18em] text-white/38">Consola del valorado</p>
                                <h3 className="text-sm font-black uppercase tracking-tight text-white/92">Derivación y control</h3>
                            </div>
                        </div>

                        <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:items-stretch">
                            <ControlRail className="min-w-0 flex-1 gap-1.5 px-2 py-1.5 xl:flex-nowrap">
                                <ControlRailSection className="min-w-[220px] max-w-[240px] shrink-0 gap-1.5 px-2 py-1">
                                    <div className="relative min-w-0 flex-1">
                                        <span className="pointer-events-none absolute left-2.5 top-1.5 text-[7px] font-black uppercase tracking-[0.14em] text-white/34">
                                            Modo derivación
                                        </span>
                                        <button
                                            ref={distributionModeButtonRef}
                                            type="button"
                                            onClick={() => {
                                                setPeriodTypeMenuOpen(false);
                                                setDistributionModeMenuOpen((current) => !current);
                                            }}
                                            className="flex h-10 w-full items-center justify-between gap-2 rounded-[0.85rem] bg-white/[0.03] pb-1 pl-2.5 pr-2.5 pt-4 text-left text-[10px] font-black text-white/92 transition hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F39200]/35"
                                            aria-haspopup="menu"
                                            aria-expanded={distributionModeMenuOpen}
                                        >
                                            <span className="truncate">{selectedDistributionModeLabel}</span>
                                            <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-white/44 transition ${distributionModeMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {distributionModeMenuOpen && distributionModeMenuStyle
                                            ? createPortal(
                                                <div
                                                    style={{
                                                        ...distributionModeMenuStyle,
                                                        minWidth: `${Math.max(distributionModeButtonRef.current?.offsetWidth || 0, 220)}px`,
                                                    }}
                                                    className="rounded-[0.95rem] border border-zinc-700 bg-[#16191f] p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.36)]"
                                                >
                                                    <div className="px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/45">
                                                        Modo derivación
                                                    </div>
                                                    <div className="mt-1 space-y-1">
                                                        {DISTRIBUTION_OPTIONS.map((option) => {
                                                            const isActive = configState.distributionMode === option.value;
                                                            return (
                                                                <button
                                                                    key={`distribution-option-${option.value}`}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        onConfigChange('distributionMode', option.value);
                                                                        setDistributionModeMenuOpen(false);
                                                                    }}
                                                                    className={`flex w-full items-center justify-between rounded-[0.78rem] border px-3 py-2 text-left transition ${
                                                                        isActive
                                                                            ? 'border-[#2b86bb] bg-[#173247] text-white'
                                                                            : 'border-transparent bg-transparent text-white/80 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                                                                    }`}
                                                                >
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.12em]">{option.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>,
                                                document.body,
                                            )
                                            : null}
                                    </div>
                                </ControlRailSection>

                                {manualScheduleSummary.count ? (
                                    <AppHint content="Hay líneas de suministro/subcontratación que necesitan una ventana temporal manual para derivar su temporalidad real." tone="dark" maxWidth={260} widthOffset={12}>
                                        <div className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 text-[8px] font-black uppercase tracking-[0.14em] text-amber-300">
                                            <Clock3 className="h-3 w-3" />
                                            {manualScheduleSummary.count} pendientes
                                        </div>
                                    </AppHint>
                                ) : null}
                                <AppHint content={cronograma.has_line_overrides ? 'El valorado tiene ajustes manuales por línea activos.' : 'No hay ajustes manuales por línea activos.'} tone="dark" maxWidth={240} widthOffset={12}>
                                    <div className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[8px] font-black uppercase tracking-[0.14em] text-white/55">
                                        <TimerReset className="h-3 w-3" />
                                        {cronograma.has_line_overrides ? 'Ajustes por línea' : 'Sin ajustes'}
                                    </div>
                                </AppHint>
                            </ControlRail>
                            <ControlRail className="inline-flex shrink-0 gap-1 px-2 py-1.5">
                                <ControlRailSection className="min-w-0 gap-1 px-1 py-1">
                                    <ControlRailIconButton
                                        onClick={onApplyConfig}
                                        disabled={configSaving || !selectedBudget}
                                        tooltip="Aplicar configuración del cronograma valorado"
                                        aria-label="Aplicar configuración"
                                        active={!configSaving && Boolean(selectedBudget)}
                                        className={!configSaving && selectedBudget ? 'bg-[#F39200] text-white hover:bg-[#E94E1B] hover:text-white' : ''}
                                    >
                                        {configSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    </ControlRailIconButton>
                                    {configState.distributionMode === 'usuario' && !isCronogramaDistributionBalanced(configState.globalDistribution || [], { decimals: 2 }) ? (
                                        <ControlRailIconButton
                                            onClick={onBalanceGlobal}
                                            tooltip="Cuadrar automáticamente el 100% global"
                                            aria-label="Cuadrar 100%"
                                        >
                                            <Calculator className="h-4 w-4" />
                                        </ControlRailIconButton>
                                    ) : null}
                                    <ControlRailIconButton
                                        onClick={() => onRecalculateFromGantt(reconciliationSummary)}
                                        disabled={configSaving || !selectedBudget}
                                        tooltip="Recalcular el valorado desde las fechas del Gantt"
                                        aria-label="Recalcular desde Gantt"
                                    >
                                        <Link2 className="h-4 w-4" />
                                    </ControlRailIconButton>
                                    {cronograma.has_line_overrides ? (
                                        <ControlRailIconButton
                                            onClick={() => onClearLineOverrides(overrideSummary)}
                                            disabled={configSaving || !selectedBudget || hasPeriodTypePreview}
                                            tooltip="Eliminar overrides manuales por línea"
                                            aria-label="Limpiar overrides"
                                        >
                                            <TimerReset className="h-4 w-4" />
                                        </ControlRailIconButton>
                                    ) : null}
                                    <ControlRailIconButton
                                        onClick={onRecalculateCashFlow}
                                        disabled={configSaving || !selectedBudget}
                                        tooltip="Recalcular flujo de caja desde el valorado vigente"
                                        aria-label="Recalcular caja"
                                    >
                                        <Activity className="h-4 w-4" />
                                    </ControlRailIconButton>
                                </ControlRailSection>
                            </ControlRail>
                            <AppHint content={`Semaforo reconciliacion: ${reconciliationSignal.label}. ${reconciliationSignal.detail} Redistribucion: ${reconciliationSummary.formattedRedistribution}.`} tone="dark" maxWidth={300} widthOffset={12}>
                                <div
                                    className={`flex min-w-[280px] flex-1 items-center justify-between gap-3 rounded-[0.95rem] border px-3 py-2 ${reconciliationSignal.cardClass}`}
                                >
                                    <div className="flex min-w-0 items-center gap-2.5">
                                        <span className={`h-2.5 w-2.5 shrink-0 rounded-full shadow-sm ${reconciliationSignal.dotClass}`} />
                                        <div className="min-w-0">
                                            <p className={`text-[7px] font-black uppercase tracking-[0.14em] ${reconciliationSignal.labelClass}`}>Semáforo reconciliación</p>
                                            <p className="mt-0.5 truncate text-[10px] font-semibold text-white/82">
                                                <span className={`font-black ${reconciliationSignal.valueClass}`}>{reconciliationSignal.label}</span>
                                                <span className="text-white/55"> · </span>
                                                {reconciliationSignal.detail}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="shrink-0 text-right">
                                        <p className="text-[7px] font-black uppercase tracking-[0.14em] text-white/36">Redistribución</p>
                                        <p className={`mt-0.5 text-[11px] font-black ${reconciliationSignal.valueClass}`}>{reconciliationSummary.formattedRedistribution}</p>
                                    </div>
                                </div>
                            </AppHint>
                        </div>

                        {configState.distributionMode === 'usuario' && periods.length ? (
                            <div className="mt-3 overflow-x-auto rounded-[1rem] border border-white/8 custom-scrollbar">
                                <div className="min-w-max">
                                    <div className="grid bg-white/[0.03]" style={{ gridTemplateColumns: periods.map(() => '110px').join(' ') }}>
                                        {periods.map((period, index) => (
                                            <div key={`global-head-${period.id}`} className="border-r border-white/8 px-3 py-2 text-center text-[9px] font-black uppercase tracking-[0.14em] text-white/44">
                                                {resolveValoradoPeriodLabel(period, index)}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="grid bg-transparent" style={{ gridTemplateColumns: periods.map(() => '110px').join(' ') }}>
                                        {periods.map((period, index) => (
                                            <div key={`global-input-${period.id}`} className="border-r border-white/8 px-2 py-2">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    step="0.01"
                                                    value={typeof configState.globalDistribution[index] === 'number' ? configState.globalDistribution[index].toFixed(2) : (configState.globalDistribution[index] ?? '')}
                                                    onChange={(event) => onConfigChange('globalDistributionValue', { index, value: event.target.value })}
                                                    className="h-8 w-full rounded-[0.85rem] border border-white/10 bg-white/[0.05] px-3 text-right text-[12px] font-black text-white/92 outline-none focus:border-[#F39200]"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ) : null}

                        <div className="mt-3 grid gap-1.5">
                            {manualScheduleSummary.count ? (
                                <div className="rounded-[0.95rem] border border-amber-400/20 bg-amber-500/8 px-3 py-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-amber-300">Temporalidad pendiente</p>
                                            <p className="mt-1 text-[11px] font-semibold text-white/80">{manualScheduleSummary.count} línea(s) aún no tienen ventana manual válida.</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/36">Pendiente</p>
                                            <p className="mt-1 text-[12px] font-black text-amber-200">{manualScheduleSummary.formattedPendingAmount}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {activeManualTemporalSummary.count && configState.distributionMode !== 'gantt' ? (
                                <div className="rounded-[0.95rem] border border-sky-400/20 bg-sky-500/8 px-3 py-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sky-300">Referencia Gantt preservada</p>
                                            <p className="mt-1 text-[11px] font-semibold text-white/80">{activeManualTemporalSummary.count} línea(s) conservan ventana manual en Gantt, pero el valorado gobierna con {selectedDistributionModeLabel.toLowerCase()}.</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/36">Cobertura</p>
                                            <p className="mt-1 text-[12px] font-black text-sky-200">{activeManualTemporalSummary.formattedScheduledAmount}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}

                            {cronograma.has_line_overrides && overrideSummary.hasOverrides ? (
                                <div className="rounded-[0.95rem] border border-white/10 bg-white/[0.04] px-3 py-2">
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/42">Overrides manuales</p>
                                            <p className="mt-1 text-[11px] font-semibold text-white/80">{overrideSummary.differences.length} ajuste(s) manual(es) activos volverían a la distribución vigente.</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black uppercase tracking-[0.16em] text-white/36">Impacto</p>
                                            <p className="mt-1 text-[12px] font-black text-[#ffbe64]">{overrideSummary.formattedRedistribution}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </section>
            </div>
            ) : null}

            <section className="flex min-h-0 flex-1 flex-col rounded-[1.25rem] border border-zinc-200 bg-white shadow-sm overflow-hidden">
                <div className="shrink-0 border-b border-white/8 bg-[#101318] px-4 py-3 text-white">
                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="flex w-full flex-wrap items-center gap-1.5 xl:flex-nowrap xl:justify-end">
                            <ControlRail className="gap-1 px-1.5 py-1.5">
                                <ControlRailSection className="gap-0.5 px-0.5 py-0.5">
                                    <ControlRailIconButton
                                        onClick={handleToggleConfig}
                                        active={showConfig}
                                        tooltip={showConfig ? 'Ocultar configuración' : 'Mostrar configuración'}
                                        aria-label={showConfig ? 'Ocultar configuración' : 'Mostrar configuración'}
                                    >
                                        <ListFilter className="h-3.5 w-3.5" />
                                    </ControlRailIconButton>
                                    <ControlRailIconButton
                                        onClick={handleToggleFooter}
                                        active={summaryExpanded}
                                        tooltip={summaryExpanded ? 'Mostrar resumen compacto' : 'Mostrar resumen completo'}
                                        aria-label={summaryExpanded ? 'Mostrar resumen compacto' : 'Mostrar resumen completo'}
                                    >
                                        <ClipboardList className="h-3.5 w-3.5" />
                                    </ControlRailIconButton>
                                </ControlRailSection>
                            </ControlRail>

                            <ControlRail className="w-full min-w-[320px] max-w-[560px] gap-1 px-1.5 py-1.5 xl:w-[440px] xl:min-w-[400px] xl:flex-none xl:self-stretch">
                                <ControlRailSection className="min-w-0 flex-1 gap-2 pl-2 pr-2">
                                    <GridColumnManager
                                        columns={BASE_COLUMNS}
                                        settings={valoradoColumnSettings.settings}
                                        onToggleColumn={valoradoColumnSettings.toggleColumn}
                                        onMoveColumn={valoradoColumnSettings.moveColumn}
                                        onResetColumns={valoradoColumnSettings.resetColumns}
                                        label="Columnas del valorado"
                                    />
                                    <ControlRailDivider className="h-7" />
                                    <div className="min-w-0 flex-1">
                                        <ClearSearchField
                                            value={leftGridSearchValue}
                                            onValueChange={setLeftGridSearch}
                                            placeholder="Buscar línea o EDT..."
                                            containerClassName="min-w-0 flex-1 rounded-[0.9rem] border border-white/8 bg-white/[0.04]"
                                            inputClassName="w-full bg-transparent py-1.5 pl-10 pr-9 text-[10px] font-black text-white/92 outline-none placeholder:text-white/30"
                                            searchIconClassName="h-3.5 w-3.5 text-white/38"
                                            onKeyDown={(event) => {
                                                if (event.key !== 'Enter') return;
                                                event.preventDefault();
                                                if (leftGridSearchMatches.length > 0) {
                                                    navigateLeftGridSearchMatch(activeLeftGridSearchIndex + 1);
                                                }
                                            }}
                                        />
                                    </div>
                                    <ControlRailDivider className="h-7" />
                                    <button
                                        type="button"
                                        onClick={() => navigateLeftGridSearchMatch(activeLeftGridSearchIndex + 1)}
                                        disabled={leftGridSearchMatches.length === 0}
                                        className="inline-flex h-9 flex-none items-center justify-center gap-1.5 rounded-[0.85rem] border border-white/8 bg-white/[0.04] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-white/78 transition hover:border-white/16 hover:bg-white/[0.08] hover:text-white disabled:pointer-events-none disabled:opacity-35"
                                        title="Buscar siguiente coincidencia"
                                    >
                                        <ArrowDown className="h-3.5 w-3.5" />
                                        Sgte
                                    </button>
                                    <span className="min-w-[42px] flex-none text-right text-[9px] font-black uppercase tracking-[0.16em] text-white/54">
                                        {leftGridSearchMatches.length > 0 && activeLeftGridSearchIndex >= 0
                                            ? `${activeLeftGridSearchIndex + 1}/${leftGridSearchMatches.length}`
                                            : '0/0'}
                                    </span>
                                </ControlRailSection>
                            </ControlRail>

                            <ControlRail className="flex-none gap-1 px-1.5 py-1.5">
                                <ControlRailSection className="min-w-[210px] gap-2 px-2 py-1">
                                    <div className="relative inline-flex h-9 min-w-[196px] shrink-0 items-center rounded-[0.85rem] border border-[#F39200]/35 bg-[#F39200]/10 px-3">
                                        <span className="mr-2 text-[8px] font-black uppercase tracking-[0.14em] text-[#F39200]">Derivación</span>
                                        <button
                                            ref={distributionModeButtonRef}
                                            type="button"
                                            onClick={() => {
                                                setPeriodTypeMenuOpen(false);
                                                setDistributionModeMenuOpen((current) => !current);
                                            }}
                                            className="inline-flex min-w-0 flex-1 items-center justify-between gap-1.5 text-[10.5px] font-black text-white/94"
                                            aria-haspopup="menu"
                                            aria-expanded={distributionModeMenuOpen}
                                        >
                                            <span className="truncate">{selectedDistributionModeLabel}</span>
                                            <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-white/55 transition ${distributionModeMenuOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {distributionModeMenuOpen && distributionModeMenuStyle
                                            ? createPortal(
                                                <div
                                                    style={{ ...distributionModeMenuStyle, minWidth: `${Math.max(distributionModeButtonRef.current?.offsetWidth || 0, 220)}px` }}
                                                    className="rounded-[0.95rem] border border-zinc-700 bg-[#16191f] p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.36)]"
                                                >
                                                    <div className="px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/45">Modo derivación</div>
                                                    <div className="mt-1 space-y-1">
                                                        {DISTRIBUTION_OPTIONS.map((option) => {
                                                            const isActive = configState.distributionMode === option.value;
                                                            return (
                                                                <button
                                                                    key={`distribution-option-header-${option.value}`}
                                                                    type="button"
                                                                    onClick={() => {
                                                                        onConfigChange('distributionMode', option.value);
                                                                        setDistributionModeMenuOpen(false);
                                                                    }}
                                                                    className={`flex w-full items-center justify-between rounded-[0.78rem] border px-3 py-2 text-left transition ${
                                                                        isActive
                                                                            ? 'border-[#2b86bb] bg-[#173247] text-white'
                                                                            : 'border-transparent bg-transparent text-white/80 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                                                                    }`}
                                                                >
                                                                    <span className="text-[10px] font-black uppercase tracking-[0.12em]">{option.label}</span>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>,
                                                document.body,
                                            )
                                            : null}
                                    </div>
                                </ControlRailSection>
                            </ControlRail>

                            <ControlRail className="gap-1 px-1.5 py-1.5">
                                <ControlRailSection className="gap-0.5 px-0.5 py-0.5">
                                    <ControlRailIconButton
                                        onClick={onCopyDistribution}
                                        disabled={selectedRowIds.size === 0}
                                        tooltip="Copiar distribución de la fila seleccionada"
                                        aria-label="Copiar distribución de la fila seleccionada"
                                    >
                                        <Copy className="h-3.5 w-3.5" />
                                    </ControlRailIconButton>
                                    <ControlRailIconButton
                                        onClick={onPasteDistribution}
                                        disabled={selectedRowIds.size === 0}
                                        tooltip="Pegar distribución en filas seleccionadas"
                                        aria-label="Pegar distribución en filas seleccionadas"
                                    >
                                        <ClipboardPaste className="h-3.5 w-3.5" />
                                    </ControlRailIconButton>
                                </ControlRailSection>
                            </ControlRail>

                            <ControlRail className="min-w-0 flex-none gap-1 px-1.5 py-1.5">
                                <ControlRailSection className="min-w-0 flex-none flex-wrap justify-end gap-1 px-1 py-1 xl:flex-nowrap">
                                    {VALUE_TABS.map((tab) => {
                                        const Icon = tab.icon;
                                        const active = activeValueTab === tab.id;
                                        return (
                                            <button
                                                key={tab.id}
                                                type="button"
                                                onClick={() => setActiveValueTab(tab.id)}
                                                className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[0.85rem] border px-2.5 text-[9px] font-black uppercase tracking-[0.14em] transition-colors ${
                                                    active
                                                        ? 'border-[#F39200]/70 bg-[#F39200]/12 text-[#ffbe64]'
                                                        : 'border-transparent bg-transparent text-white/62 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                                                }`}
                                            >
                                                <Icon className="h-3.5 w-3.5" />
                                                {tab.label}
                                            </button>
                                        );
                                    })}
                                </ControlRailSection>
                            </ControlRail>
                        </div>
                    </div>
                </div>

                <div className={`shrink-0 border-b border-white/8 bg-[#101318] text-white transition-all duration-300 ${showConfig ? 'max-h-[260px] opacity-100' : 'max-h-0 overflow-hidden opacity-0'}`}>
                    <div className="flex flex-col gap-2 px-4 py-2">
                        <div className="flex min-w-0 items-center justify-between gap-3">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
                            {[
                                { label: 'Inicio', value: formatDateTime(applyWorkdayStartTime(detail?.fecha_inicio, workdayStartHour) || periods[0]?.starts_at) },
                                { label: 'Fin', value: formatDateTime(applyWorkdayFinishTime(detail?.fecha_finalizacion, workdayStartHour, workdayHours) || periods[periods.length - 1]?.ends_at) },
                                { label: 'Plazo', value: `${Number(detail?.plazo_ejecucion || 0)} días` },
                                { label: 'Periodos', value: periods.length },
                            ].map((item) => (
                                <div key={item.label} className="inline-flex h-8 shrink-0 items-center gap-2 rounded-[0.75rem] border border-white/8 bg-white/[0.04] px-2.5">
                                    <span className="text-[7.5px] font-black uppercase tracking-[0.12em] text-white/40">{item.label}</span>
                                    <span className="text-[10.5px] font-black text-white/92">{item.value}</span>
                                </div>
                            ))}

                            <div className="relative inline-flex h-8 min-w-[132px] shrink-0 items-center rounded-[0.75rem] border border-white/8 bg-white/[0.04] px-2.5">
                                <span className="mr-2 text-[7.5px] font-black uppercase tracking-[0.12em] text-white/40">Periodo</span>
                                <button
                                    ref={periodTypeButtonRef}
                                    type="button"
                                    onClick={() => {
                                        setDistributionModeMenuOpen(false);
                                        setPeriodTypeMenuOpen((current) => !current);
                                    }}
                                    className="inline-flex min-w-0 flex-1 items-center justify-between gap-1.5 text-[10.5px] font-black text-white/92"
                                    aria-haspopup="menu"
                                    aria-expanded={periodTypeMenuOpen}
                                >
                                    <span className="truncate">{PERIOD_OPTIONS.find((option) => option.value === configState.periodType)?.label || 'Mensual'}</span>
                                    <ChevronDown className={`h-3 w-3 shrink-0 text-white/44 transition ${periodTypeMenuOpen ? 'rotate-180' : ''}`} />
                                </button>
                                {periodTypeMenuOpen && periodTypeMenuStyle
                                    ? createPortal(
                                        <div
                                            style={{ ...periodTypeMenuStyle, minWidth: `${Math.max(periodTypeButtonRef.current?.offsetWidth || 0, 168)}px` }}
                                            className="rounded-[0.95rem] border border-zinc-700 bg-[#16191f] p-1.5 shadow-[0_18px_40px_rgba(15,23,42,0.36)]"
                                        >
                                            <div className="px-2 py-1 text-[8px] font-black uppercase tracking-[0.14em] text-white/45">Tipo de periodo</div>
                                            <div className="mt-1 space-y-1">
                                                {PERIOD_OPTIONS.map((option) => {
                                                    const isActive = configState.periodType === option.value;
                                                    return (
                                                        <button
                                                            key={`period-option-${option.value}`}
                                                            type="button"
                                                            onClick={() => {
                                                                onConfigChange('periodType', option.value);
                                                                setPeriodTypeMenuOpen(false);
                                                            }}
                                                            className={`flex w-full items-center justify-between rounded-[0.78rem] border px-3 py-2 text-left transition ${
                                                                isActive
                                                                    ? 'border-[#2b86bb] bg-[#173247] text-white'
                                                                    : 'border-transparent bg-transparent text-white/80 hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                                                            }`}
                                                        >
                                                            <span className="text-[10px] font-black uppercase tracking-[0.12em]">{option.label}</span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>,
                                        document.body,
                                    )
                                    : null}
                            </div>

                            {manualScheduleSummary.count ? (
                                <AppHint content={`Pendiente temporal: ${manualScheduleSummary.formattedPendingAmount}.`} tone="dark" maxWidth={220} widthOffset={12}>
                                    <div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-500/10 px-2.5 text-[8px] font-black uppercase tracking-[0.12em] text-amber-300">
                                        <Clock3 className="h-3 w-3" />
                                        {manualScheduleSummary.count} pendientes
                                    </div>
                                </AppHint>
                            ) : null}
                            <AppHint content={cronograma.has_line_overrides ? 'El valorado tiene ajustes manuales por línea activos.' : 'No hay ajustes manuales por línea activos.'} tone="dark" maxWidth={240} widthOffset={12}>
                                <div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 text-[8px] font-black uppercase tracking-[0.12em] text-white/60">
                                    <TimerReset className="h-3 w-3" />
                                    {cronograma.has_line_overrides ? 'Ajustes por línea' : 'Sin ajustes'}
                                </div>
                            </AppHint>

                            <AppHint content={`Semaforo reconciliacion: ${reconciliationSignal.label}. ${reconciliationSignal.detail} Redistribucion: ${reconciliationSummary.formattedRedistribution}.`} tone="dark" maxWidth={300} widthOffset={12}>
                                <div className={`inline-flex h-8 max-w-[620px] shrink-0 items-center gap-2 rounded-full border px-2.5 ${reconciliationSignal.cardClass}`}>
                                    <span className={`h-2 w-2 shrink-0 rounded-full ${reconciliationSignal.dotClass}`} />
                                    <span className={`shrink-0 text-[7.5px] font-black uppercase tracking-[0.12em] ${reconciliationSignal.labelClass}`}>Reconciliación</span>
                                    <span className="min-w-0 truncate text-[10.5px] font-semibold text-white/86"><span className={`font-black ${reconciliationSignal.valueClass}`}>{reconciliationSignal.label}</span> · {reconciliationSignal.detail}</span>
                                    <span className={`shrink-0 text-[10.5px] font-black ${reconciliationSignal.valueClass}`}>{reconciliationSummary.formattedRedistribution}</span>
                                </div>
                            </AppHint>
                            </div>

                            <ControlRail className="ml-auto inline-flex shrink-0 gap-1 px-1.5 py-1">
                                <ControlRailSection className="min-w-0 gap-1 px-0.5 py-0.5">
                                    <ControlRailIconButton onClick={onApplyConfig} disabled={configSaving || !selectedBudget} tooltip="Aplicar configuración del cronograma valorado" aria-label="Aplicar configuración" active={!configSaving && Boolean(selectedBudget)} className={!configSaving && selectedBudget ? 'bg-[#F39200] text-white hover:bg-[#E94E1B] hover:text-white' : ''}>
                                        {configSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    </ControlRailIconButton>
                                    {configState.distributionMode === 'usuario' && !isCronogramaDistributionBalanced(configState.globalDistribution || [], { decimals: 2 }) ? (
                                        <ControlRailIconButton onClick={onBalanceGlobal} tooltip="Cuadrar automáticamente el 100% global" aria-label="Cuadrar 100%">
                                            <Calculator className="h-4 w-4" />
                                        </ControlRailIconButton>
                                    ) : null}
                                    <ControlRailIconButton onClick={() => onRecalculateFromGantt(reconciliationSummary)} disabled={configSaving || !selectedBudget} tooltip="Recalcular el valorado desde las fechas del Gantt" aria-label="Recalcular desde Gantt">
                                        <Link2 className="h-4 w-4" />
                                    </ControlRailIconButton>
                                    {cronograma.has_line_overrides ? (
                                        <ControlRailIconButton onClick={() => onClearLineOverrides(overrideSummary)} disabled={configSaving || !selectedBudget || hasPeriodTypePreview} tooltip="Eliminar overrides manuales por línea" aria-label="Limpiar overrides">
                                            <TimerReset className="h-4 w-4" />
                                        </ControlRailIconButton>
                                    ) : null}
                                    <ControlRailIconButton onClick={onRecalculateCashFlow} disabled={configSaving || !selectedBudget} tooltip="Recalcular flujo de caja desde el valorado vigente" aria-label="Recalcular caja">
                                        <Activity className="h-4 w-4" />
                                    </ControlRailIconButton>
                                </ControlRailSection>
                            </ControlRail>
                        </div>

                        {configState.distributionMode === 'usuario' && periods.length ? (
                            <div className="overflow-x-auto rounded-[0.85rem] border border-white/8 custom-scrollbar">
                                <div className="grid min-w-max bg-white/[0.03]" style={{ gridTemplateColumns: periods.map(() => '92px').join(' ') }}>
                                    {periods.map((period, index) => (
                                        <div key={`global-input-${period.id}`} className="border-r border-white/8 px-1.5 py-1">
                                            <p className="mb-1 text-center text-[7px] font-black uppercase tracking-[0.12em] text-white/38">{resolveValoradoPeriodLabel(period, index)}</p>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={typeof configState.globalDistribution[index] === 'number' ? configState.globalDistribution[index].toFixed(2) : (configState.globalDistribution[index] ?? '')}
                                                onChange={(event) => onConfigChange('globalDistributionValue', { index, value: event.target.value })}
                                                className="h-7 w-full rounded-[0.7rem] border border-white/10 bg-white/[0.05] px-2 text-right text-[10px] font-black text-white/92 outline-none focus:border-[#F39200]"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>

                {scheduledDisplayRows.length === 0 ? (
                    <div className="px-6 py-10 text-center">
                        <p className="text-[9px] font-black uppercase tracking-[0.18em] text-zinc-400">Sin líneas cargadas</p>
                        <h4 className="mt-2 text-lg font-black uppercase tracking-tight text-zinc-900">Este presupuesto no tiene APUs</h4>
                    </div>
                ) : (
                    <div className="flex-1 flex min-h-0 flex-col overflow-hidden">
                        {activeValueTab === 'inversion' ? (
                            <div className="shrink-0 border-b border-zinc-200 bg-[#F2F4F7] px-3 py-1">
                                <div className="flex min-h-11 min-w-0 items-center gap-2 overflow-x-auto overflow-y-visible py-1">
                                    <AppHint
                                        tone="light"
                                        maxWidth={320}
                                        widthOffset={24}
                                        content={`Estado financiero: ${cashFlowSummary.statusLabel}. ${cashFlowSummary.consistencyLabel}: ${
                                            manualScheduleSummary.count
                                                ? `${cashFlowSummary.formattedScheduledCoveragePct} ya entra; pendiente ${cashFlowSummary.formattedPendingManualAmount}`
                                                : cashFlowSummary.isConsistent
                                                    ? 'cuadra con el Valorado'
                                                    : `diferencia ${cashFlowSummary.formattedDifference}`
                                        }. Riesgo: ${cashFlowSummary.hasRelevantDeviation ? `${cashFlowSummary.peakDeviationLabel} ${cashFlowSummary.peakDeviationDirection} ${cashFlowSummary.formattedPeakDeviationPct}` : 'sin desviación relevante'}.`}
                                    >
                                        <div
                                            className={`inline-flex h-8 shrink-0 items-center gap-2 rounded-full border px-3 ${
                                                cashFlowSummary.statusTone === 'danger'
                                                    ? 'border-rose-200 bg-rose-50'
                                                    : cashFlowSummary.statusTone === 'warning'
                                                        ? 'border-amber-200 bg-amber-50'
                                                        : 'border-emerald-200 bg-emerald-50'
                                            }`}
                                        >
                                            <span className={`h-2 w-2 rounded-full ${
                                                cashFlowSummary.statusTone === 'danger'
                                                    ? 'bg-rose-500'
                                                    : cashFlowSummary.statusTone === 'warning'
                                                        ? 'bg-amber-500'
                                                        : 'bg-emerald-500'
                                            }`} />
                                            <span className={`text-[8px] font-black uppercase tracking-[0.16em] ${
                                                cashFlowSummary.statusTone === 'danger'
                                                    ? 'text-rose-700'
                                                    : cashFlowSummary.statusTone === 'warning'
                                                        ? 'text-amber-700'
                                                        : 'text-emerald-700'
                                            }`}>Estado</span>
                                            <span className={`text-[10px] font-black ${
                                                cashFlowSummary.statusTone === 'danger'
                                                    ? 'text-rose-800'
                                                    : cashFlowSummary.statusTone === 'warning'
                                                        ? 'text-amber-800'
                                                        : 'text-emerald-800'
                                            }`}>{cashFlowSummary.statusLabel}</span>
                                        </div>
                                    </AppHint>

                                    <AppHint content={`Origen financiero: ${cashFlowSummary.sourceLabel}. Referencia: ${cashFlowSummary.referenceModeLabel}. Total acumulado: ${cashFlowSummary.formattedTotalCost}.`} tone="light" maxWidth={300} widthOffset={24}>
                                        <div className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3">
                                            <span className="h-2 w-2 rounded-full bg-[#F39200]" />
                                            <span className="text-[8px] font-black uppercase tracking-[0.16em] text-[#F39200]">Origen</span>
                                            <span className="max-w-[12rem] truncate text-[10px] font-black text-zinc-900">{cashFlowSummary.sourceLabel}</span>
                                        </div>
                                    </AppHint>

                                    <AppHint content={`Total acumulado de inversión/caja: ${cashFlowSummary.formattedTotalCost}. Cobertura incorporada: ${cashFlowSummary.formattedScheduledCoveragePct}. Horas efectivas totales: ${formatNumber(cashFlowSummary.totalWorkHours, 2)} h.`} tone="light" maxWidth={320} widthOffset={24}>
                                        <div className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3">
                                            <span className="h-2 w-2 rounded-full bg-zinc-400" />
                                            <span className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">Total</span>
                                            <span className="text-[10px] font-black text-zinc-900">{cashFlowSummary.formattedTotalCost}</span>
                                        </div>
                                    </AppHint>

                                    <AppHint content={`Pico financiero: ${cashFlowSummary.peakLabel} por ${cashFlowSummary.formattedPeakCost}. Ventana: ${cashFlowSummary.peakWindowLabel}. Categoría dominante: ${cashFlowSummary.peakDominantCategory}.`} tone="light" maxWidth={320} widthOffset={24}>
                                        <div className="inline-flex h-8 shrink-0 items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3">
                                            <span className="h-2 w-2 rounded-full bg-sky-500" />
                                            <span className="text-[8px] font-black uppercase tracking-[0.16em] text-sky-700">Pico</span>
                                            <span className="text-[10px] font-black text-zinc-900">{cashFlowSummary.peakLabel} · {cashFlowSummary.formattedPeakCost}</span>
                                        </div>
                                    </AppHint>

                                    <AppHint
                                        tone="light"
                                        maxWidth={340}
                                        widthOffset={24}
                                        content={cashFlowSummary.hasManualPending
                                            ? `Temporalidad manual pendiente: ${cashFlowSummary.formattedPendingManualAmount}. Cobertura incorporada: ${cashFlowSummary.formattedScheduledCoveragePct}. Revisar partidas con programación parcial antes de aplicar propuestas.`
                                            : `Restricción financiera. Mayor desviación contra ${cashFlowSummary.referenceModeLabel.toLowerCase()} en ${cashFlowSummary.peakDeviationLabel}: caja ${cashFlowSummary.peakDeviationDirection} ${cashFlowSummary.formattedPeakDeviationPct}. Dominante: ${cashFlowSummary.peakDominantCategory}. Impacto: ${cashFlowSummary.formattedPeakDeviationImpact}. ${cashFlowSummary.referenceModeLabel} · diagnóstico solamente.`}
                                    >
                                        <div
                                            className={`inline-flex h-8 min-w-0 shrink items-center gap-2 rounded-full border px-3 ${
                                                cashFlowSummary.hasManualPending || cashFlowSummary.hasRelevantDeviation
                                                    ? 'border-amber-200 bg-amber-50'
                                                    : 'border-zinc-200 bg-zinc-50'
                                            }`}
                                        >
                                            <span className={`h-2 w-2 rounded-full ${cashFlowSummary.hasManualPending || cashFlowSummary.hasRelevantDeviation ? 'bg-amber-500' : 'bg-zinc-400'}`} />
                                            <span className={`text-[8px] font-black uppercase tracking-[0.16em] ${cashFlowSummary.hasManualPending || cashFlowSummary.hasRelevantDeviation ? 'text-amber-700' : 'text-zinc-400'}`}>
                                                {cashFlowSummary.hasManualPending ? 'Pend.' : 'Riesgo'}
                                            </span>
                                            <span className="max-w-[13rem] truncate text-[10px] font-black text-zinc-900">
                                                {cashFlowSummary.hasManualPending
                                                    ? cashFlowSummary.formattedPendingManualAmount
                                                    : `${cashFlowSummary.peakDeviationLabel} · ${cashFlowSummary.formattedPeakDeviationPct}`}
                                            </span>
                                        </div>
                                    </AppHint>

                                    <div className="ml-auto inline-flex shrink-0 items-center gap-1.5 pr-3">
                                        <button
                                            type="button"
                                            onClick={handleCashConstraintProposal}
                                            className={`${CRONOGRAMA_SOFT_ACTION_BUTTON} h-8 w-8 rounded-full text-[#F39200]`}
                                            title="Ver propuesta financiera"
                                        >
                                            <FileText className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handlePrepareCashConstraintDraft}
                                            disabled={!cashFlowSummary.hasRelevantDeviation || hasPeriodTypePreview}
                                            className={`${CRONOGRAMA_SOFT_ACTION_BUTTON} h-8 w-8 rounded-full ${
                                                cashFlowSummary.hasRelevantDeviation && !hasPeriodTypePreview
                                                    ? 'text-[#F39200]'
                                                    : 'text-zinc-400'
                                            }`}
                                            title="Preparar borrador financiero"
                                        >
                                            <ClipboardPaste className="h-4 w-4" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleApplyCashConstraintLineDraft}
                                            disabled={!cashFlowSummary.hasRelevantDeviation || hasPeriodTypePreview || !cashConstraintLineDraftSummary.drafts.length}
                                            className={`${CRONOGRAMA_SOFT_ACTION_BUTTON} h-8 w-8 rounded-full ${
                                                cashFlowSummary.hasRelevantDeviation && !hasPeriodTypePreview && cashConstraintLineDraftSummary.drafts.length
                                                    ? 'text-[#F39200]'
                                                    : 'text-zinc-400'
                                            }`}
                                            title="Aplicar borrador por partidas"
                                        >
                                            <Check className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                        {/* CONTENEDOR PRINCIPAL DE LA MATRIZ */}
                        <div className="relative flex-1 flex min-h-0 overflow-hidden">
                            {fullscreenCurve && activeValueTab === 'curva_s' ? (
                                <div className="absolute inset-0 z-50 flex flex-col overflow-hidden bg-white p-4">
                                    <div className="mb-3 flex shrink-0 items-center justify-between gap-4 rounded-[1.15rem] border border-zinc-200 bg-zinc-50 px-4 py-3">
                                        <div>
                                            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-sky-500">Visualización de inversión</p>
                                            <h3 className="mt-0.5 text-base font-semibold uppercase tracking-[0.02em] text-zinc-900">Curva S de avance acumulado</h3>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setFullscreenCurve(false)}
                                            className="flex h-10 w-10 items-center justify-center rounded-[0.95rem] border border-zinc-200 bg-white text-zinc-500 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-900 active:scale-95"
                                            title="Contraer Curva S"
                                            aria-label="Contraer Curva S"
                                        >
                                            <X className="h-5 w-5" />
                                        </button>
                                    </div>
                                    <div className="flex min-h-0 flex-1 items-center justify-center rounded-[1.5rem] border border-zinc-100 bg-zinc-50/60 p-6 shadow-inner">
                                        <svg viewBox="0 0 820 320" className="h-full w-full">
                                            <defs>
                                                <linearGradient id="curveGradientExpanded" x1="0%" y1="0%" x2="0%" y2="100%">
                                                    <stop offset="0%" stopColor="#F39200" stopOpacity="0.1" />
                                                    <stop offset="100%" stopColor="#F39200" stopOpacity="0" />
                                                </linearGradient>
                                            </defs>
                                            {[0, 0.25, 0.5, 0.75, 1].map((lvl) => (
                                                <line key={`expanded-grid-${lvl}`} x1="42" y1={320 - 54 - lvl * (320 - 88)} x2="790" y2={320 - 54 - lvl * (320 - 88)} stroke="#F1F5F9" strokeWidth="1" />
                                            ))}
                                            <line x1="42" y1="266" x2="790" y2="266" stroke="#D4D4D8" strokeWidth="1" />
                                            <line x1="42" y1="24" x2="42" y2="266" stroke="#D4D4D8" strokeWidth="1" />
                                            <path d={`M 42 266 L ${buildCurvePoints(curveSDisplayItems.map((item) => item.value), 820, 320, 42, 266)} L 790 266 Z`} fill="url(#curveGradientExpanded)" />
                                            <polyline fill="none" stroke="#F39200" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={buildCurvePoints(curveSDisplayItems.map((item) => item.value), 820, 320, 42, 266)} />
                                            {curveSDisplayItems.map((point, index) => {
                                                const values = curveSDisplayItems.map((item) => item.value);
                                                const maxValue = Math.max(...values, 1);
                                                const stepX = values.length === 1 ? 0 : (820 - 84) / (values.length - 1);
                                                const x = 42 + stepX * index;
                                                const y = 266 - ((point.value / maxValue) * (320 - 88));
                                                return (
                                                    <g key={`point-expanded-${point.label}`}>
                                                        <circle cx={x} cy={y} r="4" fill="#136191" />
                                                        <text x={x} y={y - 12} textAnchor="middle" fontSize="10" fontWeight="700" fill="#4B5563">{formatCurrency(point.value, currency, decMoneda)}</text>
                                                        <text x={x} y="286" textAnchor="middle" fontSize="10" fontWeight="700" fill="#52525B">{point.label}</text>
                                                        {point.rangeLabel ? (
                                                            <text x={x} y="301" textAnchor="middle" fontSize="8" fontWeight="500" fill="#A1A1AA">{point.rangeLabel}</text>
                                                        ) : null}
                                                    </g>
                                                );
                                            })}
                                        </svg>
                                    </div>
                                </div>
                            ) : null}
                            {/* COLUMNA IZQUIERDA (FIJA) */}
                            <div className="flex flex-col shrink-0 border-r border-zinc-200" style={{ width: `${LEFT_WIDTH}px` }}>
                                {/* Cabecera Izquierda */}
                                <div 
                                    className="grid border-b border-zinc-200 bg-zinc-50 shrink-0" 
                                    style={{ gridTemplateColumns: activeBaseGridColumns }}
                                >
                                    {activeBaseColumns.map((column) => (
                                        <div
                                            key={column.key}
                                            className={`flex ${VALORADO_LEFT_ROW_HEIGHT} items-center px-2.5 text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500 ${
                                                column.type === 'text' ? 'justify-start text-left' : 'justify-end text-right'
                                            } ${column.key === 'descripcion' ? 'pl-3' : ''} ${
                                                column.key === 'item_visible'
                                                    ? 'sticky left-0 z-[44] border-r border-zinc-200 bg-zinc-50 shadow-[8px_0_18px_rgba(15,23,42,0.04)]'
                                                    : column.key === 'edt_code_visible'
                                                        ? 'sticky z-[43] border-r border-zinc-200 bg-zinc-50 shadow-[8px_0_18px_rgba(15,23,42,0.025)]'
                                                        : ''
                                            }`}
                                            style={
                                                column.key === 'edt_code_visible'
                                                    ? { left: `${resolveStickyValoradoColumnLeft(activeBaseColumns, 1)}px` }
                                                    : undefined
                                            }
                                        >
                                            {column.label}
                                        </div>
                                    ))}
                                </div>
                                
                                {/* Cuerpo Izquierdo (Scrollable Sync) */}
                                <div className="relative min-h-0 flex-1 overflow-hidden pr-6">
                                <div 
                                    ref={leftRef} 
                                    onScroll={() => syncScroll(leftRef.current, rightRef.current)} 
                                    className="giproy-motion-scrollbar-hide h-full overflow-y-auto"
                                >
                                    {scheduledDisplayRows.map((row, index) => {
                                        const isSelected = selectedRowIds.has(String(row.budget_line_id || row.linea_id));
                                        const rowId = String(row.budget_line_id || row.linea_id);
                                        const isSearchMatch = leftGridSearchMatchIds.has(rowId);
                                        const isActiveSearchMatch = activeLeftGridSearchMatchId === rowId;
                                        return (
                                            <div
                                                key={row.budget_line_id || row.linea_id}
                                                ref={(node) => {
                                                    if (node) {
                                                        leftGridRowRefs.current.set(rowId, node);
                                                    } else {
                                                        leftGridRowRefs.current.delete(rowId);
                                                    }
                                                }}
                                                onClick={(e) => {
                                                    if (!row.is_calculable) return;

                                                    let next = new Set(selectedRowIds);

                                                    if (e.ctrlKey || e.metaKey) {
                                                        if (next.has(rowId)) next.delete(rowId);
                                                        else next.add(rowId);
                                                    } else if (e.shiftKey && selectedRowIds.size > 0) {
                                                        // Range selection
                                                        const rowIds = scheduledDisplayRows.map(r => String(r.budget_line_id || r.linea_id));
                                                        const lastId = Array.from(selectedRowIds).pop();
                                                        const start = rowIds.indexOf(lastId);
                                                        const end = index;
                                                        const range = rowIds.slice(Math.min(start, end), Math.max(start, end) + 1);
                                                        range.forEach(id => {
                                                            const r = scheduledDisplayRows.find(dr => String(dr.budget_line_id || dr.linea_id) === String(id));
                                                            if (r?.is_calculable) next.add(id);
                                                        });
                                                    } else {
                                                        next = new Set([rowId]);
                                                    }
                                                    setSelectedRowIds(next);
                                                }}
                                                className={`grid ${VALORADO_LEFT_ROW_MIN_HEIGHT} cursor-pointer border-b border-zinc-100 ${
                                                    isSelected
                                                        ? 'z-10 bg-sky-50/80 ring-1 ring-inset ring-sky-200'
                                                        : isActiveSearchMatch
                                                            ? 'bg-amber-50 ring-1 ring-inset ring-[#F39200]/35'
                                                            : isSearchMatch
                                                                ? 'bg-orange-50/40'
                                                                : row.is_calculable
                                                                    ? 'bg-white hover:bg-zinc-50/70'
                                                                    : 'bg-zinc-50/40'
                                                }`}
                                                style={{ gridTemplateColumns: activeBaseGridColumns }}
                                            >
                                                {activeBaseColumns.map((column) => (
                                                    <div
                                                        key={`${row.budget_line_id || row.linea_id}-${column.key}`}
                                                        className={`flex ${VALORADO_LEFT_ROW_HEIGHT} items-center px-2.5 text-[11px] font-medium ${row.is_calculable ? 'text-zinc-700' : 'text-zinc-400'} ${column.type === 'text' ? 'justify-start text-left' : 'justify-end text-right tabular-nums'} ${column.key === 'descripcion' ? 'truncate pl-3' : ''} ${
                                                            column.key === 'item_visible'
                                                                ? 'sticky left-0 z-[24] border-r border-zinc-200 shadow-[8px_0_18px_rgba(15,23,42,0.035)]'
                                                                : column.key === 'edt_code_visible'
                                                                    ? 'sticky z-[23] border-r border-zinc-200 shadow-[8px_0_18px_rgba(15,23,42,0.025)]'
                                                                    : ''
                                                        }`}
                                                        title={column.key === 'descripcion' ? formatCronogramaDescripcion(row) : undefined}
                                                        style={{
                                                            ...(column.key === 'descripcion' ? { paddingLeft: `${12 + (row.level * 20)}px` } : {}),
                                                            ...(column.key === 'item_visible'
                                                                ? {
                                                                    backgroundColor: isSelected
                                                                        ? '#e0f2fe'
                                                                        : isActiveSearchMatch
                                                                            ? '#fef3c7'
                                                                            : isSearchMatch
                                                                                ? '#fff7ed'
                                                                                : row.is_calculable
                                                                                    ? '#ffffff'
                                                                                    : '#fafafa',
                                                                }
                                                                : {}),
                                                            ...(column.key === 'edt_code_visible'
                                                                ? {
                                                                    left: `${resolveStickyValoradoColumnLeft(activeBaseColumns, 1)}px`,
                                                                    backgroundColor: isSelected
                                                                        ? '#e0f2fe'
                                                                        : isActiveSearchMatch
                                                                            ? '#fef3c7'
                                                                            : isSearchMatch
                                                                                ? '#fff7ed'
                                                                                : row.is_calculable
                                                                                    ? '#ffffff'
                                                                                    : '#fafafa',
                                                                }
                                                                : {}),
                                                        }}
                                                    >
                                                        <BaseCell
                                                            column={column}
                                                            row={row}
                                                            currency={currency}
                                                            decMoneda={decMoneda}
                                                            decCalculos={decCalculos}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })}
                                </div>
                                <MotionScrollbar targetRef={leftRef} className="right-0" style={{ top: 0, bottom: 4 }} />
                                </div>
                            </div>

                                <div className="flex-1 flex flex-col min-w-0">
                                    {activeValueTab === 'curva_s' ? (
                                        <div className="h-full overflow-hidden p-4">
                                            <div 
                                                onClick={() => setFullscreenCurve(true)}
                                                className="group relative flex h-full cursor-pointer flex-col rounded-[1.6rem] border border-zinc-200 bg-white p-5 shadow-xl transition-all hover:border-sky-300 hover:shadow-2xl"
                                            >
                                                <div className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-[0.95rem] bg-zinc-50 text-zinc-400 opacity-0 transition-opacity group-hover:opacity-100">
                                                    <Maximize2 className="h-4.5 w-4.5" />
                                                </div>
                                                <div className="flex min-h-0 flex-1 flex-col rounded-[1.25rem] border border-zinc-100 bg-zinc-50/50 p-4 shadow-inner">
                                                    <svg viewBox="0 0 820 320" className="h-full min-h-[300px] w-full overflow-visible">
                                                        <defs>
                                                            <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                                                <stop offset="0%" stopColor="#F39200" stopOpacity="0.1" />
                                                                <stop offset="100%" stopColor="#F39200" stopOpacity="0" />
                                                            </linearGradient>
                                                        </defs>
                                                        
                                                        {/* Grid Lines */}
                                                        {[0, 0.25, 0.5, 0.75, 1].map(lvl => (
                                                            <line key={lvl} x1="42" y1={320 - 54 - lvl * (320 - 88)} x2="790" y2={320 - 54 - lvl * (320 - 88)} stroke="#F1F5F9" strokeWidth="1" />
                                                        ))}

                                                        <line x1="42" y1="266" x2="790" y2="266" stroke="#D4D4D8" strokeWidth="1" />
                                                        <line x1="42" y1="24" x2="42" y2="266" stroke="#D4D4D8" strokeWidth="1" />
                                                        
                                                        {/* Area under curve */}
                                                        <path 
                                                            d={`M 42 266 L ${buildCurvePoints(curveSDisplayItems.map((item) => item.value), 820, 320, 42, 266)} L 790 266 Z`} 
                                                            fill="url(#curveGradient)" 
                                                        />

                                                        <polyline fill="none" stroke="#F39200" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" points={buildCurvePoints(curveSDisplayItems.map((item) => item.value), 820, 320, 42, 266)} />
                                                        
                                                        {curveSDisplayItems.map((point, index) => {
                                                            const values = curveSDisplayItems.map((item) => item.value);
                                                            const maxValue = Math.max(...values, 1);
                                                            const stepX = values.length === 1 ? 0 : (820 - 84) / (values.length - 1);
                                                            const x = 42 + stepX * index;
                                                            const y = 266 - ((point.value / maxValue) * (320 - 88));
                                                            return (
                                                                <AppHint
                                                                    key={`point-${point.label}`}
                                                                    as="g"
                                                                    triggerClassName=""
                                                                    tone="dark"
                                                                    maxWidth={180}
                                                                    widthOffset={0}
                                                                    content={(
                                                                        <div>
                                                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/50">{point.label}</p>
                                                                            <p className="mt-1 text-sm font-black text-white">{formatCurrency(point.value, currency, decMoneda)}</p>
                                                                        </div>
                                                                    )}
                                                                >
                                                                    <circle className="cursor-pointer transition-all hover:r-6" cx={x} cy={y} r="4" fill="#136191" />
                                                                    <text x={x} y="286" textAnchor="middle" fontSize="10" fontWeight="700" fill="#52525B">{point.label}</text>
                                                                    {point.rangeLabel ? (
                                                                        <text x={x} y="301" textAnchor="middle" fontSize="8" fontWeight="500" fill="#A1A1AA">{point.rangeLabel}</text>
                                                                    ) : null}
                                                                </AppHint>
                                                            );
                                                        })}
                                                    </svg>
                                                </div>
                                                <div className="mt-4 shrink-0 text-center">
                                                    <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-sky-500">Visualización de Inversión</p>
                                                    <h4 className="mt-1.5 text-lg font-semibold uppercase tracking-[0.02em] text-zinc-900">Curva S de Avance Acumulado</h4>
                                                    <p className="mt-1 text-[11px] font-medium text-zinc-500 italic">Haz clic para ampliar en la zona de trabajo</p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                    <div className="relative min-h-0 flex-1 overflow-hidden pb-6 pr-6">
                                    <div 
                                        ref={rightRef}
                                        onScroll={() => {
                                            syncScroll(rightRef.current, leftRef.current);
                                            syncHorizontalScroll(rightRef.current, footerRightRef.current);
                                        }}
                                        className="giproy-motion-scrollbar-hide h-full overflow-auto"
                                    >
                                        <div className="min-w-max">
                                            {/* Cabecera Periodos */}
                                            <div 
                                                className="grid border-b border-zinc-200 bg-zinc-50 shrink-0 sticky top-0 z-30 shadow-[0_1px_0_rgba(228,228,231,1)]" 
                                                style={{ gridTemplateColumns: periods.map(() => VALORADO_RIGHT_PERIOD_WIDTH).join(' ') }}
                                            >
                                                {periods.map((period, index) => (
                                                    <div key={period.id} className={`flex ${VALORADO_RIGHT_ROW_HEIGHT} flex-col items-center justify-center px-2.5 text-center text-[9px] font-black uppercase tracking-[0.16em] text-zinc-500`} title={`${formatDateTime(period.starts_at)} - ${formatDateTime(period.ends_at)}`}>
                                                        <div>{resolveValoradoPeriodLabel(period, index)}</div>
                                                        <div className="mt-0.5 text-[8px] font-medium normal-case tracking-normal text-zinc-400">{formatValoradoPeriodRangeLabel(period)}</div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Cuerpo Periodos */}
                                            <div>
                                            {effectiveDisplayRows.map((row, rowIdx) => {
                                                const isSelected = selectedRowIds.has(String(row.budget_line_id || row.linea_id));
                                                return (
                                                    <div
                                                        key={`period-row-${row.budget_line_id || row.linea_id}`}
                                                        onClick={(e) => {
                                                            if (!row.is_calculable) return;
                                                            const rowId = String(row.budget_line_id || row.linea_id);
                                                            let next = new Set(selectedRowIds);
                                                            if (e.ctrlKey || e.metaKey) {
                                                                if (next.has(rowId)) next.delete(rowId);
                                                                else next.add(rowId);
                                                            } else if (e.shiftKey && selectedRowIds.size > 0) {
                                                                const rowIds = effectiveDisplayRows.map(r => String(r.budget_line_id || r.linea_id));
                                                                const lastId = Array.from(selectedRowIds).pop();
                                                                const start = rowIds.indexOf(lastId);
                                                                const end = rowIdx;
                                                                const range = rowIds.slice(Math.min(start, end), Math.max(start, end) + 1);
                                                                range.forEach(id => {
                                                                    const r = effectiveDisplayRows.find(dr => String(dr.budget_line_id || dr.linea_id) === String(id));
                                                                    if (r?.is_calculable) next.add(id);
                                                                });
                                                            } else {
                                                                next = new Set([rowId]);
                                                            }
                                                            setSelectedRowIds(next);
                                                        }}
                                                        className={`grid ${VALORADO_RIGHT_ROW_MIN_HEIGHT} cursor-pointer border-b border-zinc-100 transition-colors ${isSelected ? 'bg-sky-50/80 ring-1 ring-inset ring-sky-200 z-10' : row.is_calculable ? 'bg-white hover:bg-zinc-50/70' : 'bg-blue-50/30'}`}
                                                        style={{ gridTemplateColumns: periods.map(() => VALORADO_RIGHT_PERIOD_WIDTH).join(' ') }}
                                                    >
                                                        {(() => {
                                                            const isBroken = row.is_calculable && !isCronogramaDistributionBalanced(row.distribution || [], { decimals: 2 });
                                                            
                                                            return periods.map((period, index) => (
                                                                <div
                                                                    key={`${row.budget_line_id || row.linea_id}-${period.id}`}
                                                                    className={`flex ${VALORADO_RIGHT_ROW_HEIGHT} items-center justify-end px-2.5 text-right text-[11px] font-medium tabular-nums border-r border-zinc-50 last:border-0 ${row.is_calculable ? (isBroken ? 'text-red-500 bg-red-50/20' : 'text-zinc-700') : 'text-zinc-300'} ${activeValueTab === 'porcentajes' && row.is_calculable ? (isSelected ? 'bg-orange-50/50 text-orange-600 ring-1 ring-inset ring-orange-200' : 'hover:bg-orange-50/30 transition-colors') : ''}`}
                                                                    onClick={activeValueTab === 'porcentajes' && row.is_calculable ? async (e) => {
                                                                        e.stopPropagation();
                                                                        if (!canEditDistribution) {
                                                                            await appAlert({
                                                                                title: 'Configuración pendiente',
                                                                                message: 'Primero pulse Aplicar configuración para guardar el nuevo tipo de periodo antes de editar porcentajes por línea.',
                                                                                tone: 'warning',
                                                                            });
                                                                            return;
                                                                        }
                                                                        setFocusedCell({ rowIndex: rowIdx, periodIndex: index });
                                                                    } : undefined}
                                                                    onContextMenu={activeValueTab === 'porcentajes' && row.is_calculable && row.has_override ? async (event) => {
                                                                        event.preventDefault();
                                                                        await onResetLine(row);
                                                                    } : undefined}
                                                                >
                                                                    {row.is_calculable && (
                                                                        focusedCell?.rowIndex === rowIdx && focusedCell?.periodIndex === index && activeValueTab === 'porcentajes' ? (
                                                                            <input
                                                                                autoFocus
                                                                                type="number"
                                                                                step="0.01"
                                                                                className="h-8 w-16 rounded border border-sky-500 bg-white px-1 text-right text-xs font-black text-zinc-900 outline-none shadow-[0_0_0_2px_rgba(14,165,233,0.2)]"
                                                                                defaultValue={row.distribution[index] || 0}
                                                                                onFocus={(e) => e.target.select()}
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter' || e.key === 'Tab') {
                                                                                        e.preventDefault();
                                                                                        const val = e.target.value;
                                                                                        const newDist = [...row.distribution];
                                                                                        newDist[index] = val === '' ? 0 : Number(val);
                                                                                        onSaveCell(true, { ...row, distribution: newDist });
                                                                                        
                                                                                        const nextPeriod = e.shiftKey ? (index - 1 + periods.length) % periods.length : (index + 1) % periods.length;
                                                                                        let nextRow = rowIdx;
                                                                                        if (!e.shiftKey && nextPeriod === 0) nextRow = (rowIdx + 1) % effectiveDisplayRows.length;
                                                                                        if (e.shiftKey && nextPeriod === periods.length - 1) nextRow = (rowIdx - 1 + effectiveDisplayRows.length) % effectiveDisplayRows.length;
                                                                                        
                                                                                        setFocusedCell({ rowIndex: nextRow, periodIndex: nextPeriod });
                                                                                    }
                                                                                    if (e.key === 'ArrowRight' && e.target.selectionStart === e.target.value.length) {
                                                                                        const nextPeriod = (index + 1) % periods.length;
                                                                                        setFocusedCell({ rowIndex: rowIdx, periodIndex: nextPeriod });
                                                                                    }
                                                                                    if (e.key === 'ArrowLeft' && e.target.selectionStart === 0) {
                                                                                        const prevPeriod = (index - 1 + periods.length) % periods.length;
                                                                                        setFocusedCell({ rowIndex: rowIdx, periodIndex: prevPeriod });
                                                                                    }
                                                                                    if (e.key === 'ArrowDown') {
                                                                                        const nextRow = (rowIdx + 1) % effectiveDisplayRows.length;
                                                                                        setFocusedCell({ rowIndex: nextRow, periodIndex: index });
                                                                                    }
                                                                                    if (e.key === 'ArrowUp') {
                                                                                        const prevRow = (rowIdx - 1 + effectiveDisplayRows.length) % effectiveDisplayRows.length;
                                                                                        setFocusedCell({ rowIndex: prevRow, periodIndex: index });
                                                                                    }
                                                                                    if (e.key === 'Escape') {
                                                                                        setFocusedCell(null);
                                                                                    }
                                                                                }}
                                                                                onBlur={(e) => {
                                                                                    const val = e.target.value;
                                                                                    const newDist = [...row.distribution];
                                                                                    newDist[index] = val === '' ? 0 : Number(val);
                                                                                    if (newDist[index] !== (row.distribution[index] || 0)) {
                                                                                        onSaveCell(true, { ...row, distribution: newDist });
                                                                                    }
                                                                                    setFocusedCell(null);
                                                                                }}
                                                                            />
                                                                        ) : (
                                                                            <MetricText 
                                                                                type={activeValueTab} 
                                                                                value={getMetricValue(activeValueTab, row, row.distribution[index] || 0)} 
                                                                                currency={currency} 
                                                                                decMoneda={decMoneda} 
                                                                                decCalculos={decCalculos} 
                                                                            />
                                                                        )
                                                                    )}
                                                                    {!row.is_calculable && <span>&nbsp;</span>}
                                                                </div>
                                                            ));
                                                        })()}
                                                    </div>
                                                );
                                            })}
                                            </div>
                                        </div>
                                    </div>
                                    <MotionScrollbar targetRef={rightRef} className="right-0" style={{ top: 44, bottom: 24 }} />
                                    <MotionScrollbar targetRef={rightRef} orientation="horizontal" className="bottom-0" style={{ right: 24 }} />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* PIE DE LA MATRIZ (UNIFICADO FUERA DEL GRID) */}
                        {showFooter && (
                            <div className="shrink-0 overflow-hidden border-t border-white/8 bg-[#101318] text-white shadow-[0_-8px_18px_-12px_rgba(0,0,0,0.65)]">
                                {summaryExpanded ? (
                                <div className="flex">
                                    {/* Etiquetas del Pie */}
                                    <div className="shrink-0 flex flex-col border-r border-white/8 bg-white/[0.035]" style={{ width: `${LEFT_WIDTH}px` }}>
                                        {['Inversión periodo', 'Inversión acumulada', '% periodo', '% acumulado'].map(label => (
                                            <div key={label} className="flex h-9 items-center border-b border-white/8 last:border-0 px-4">
                                                <div className="ml-auto max-w-[18rem] truncate text-right text-[7px] font-semibold uppercase tracking-[0.14em] text-white/50" title={label}>
                                                    {label}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Valores del Pie (Scrollable Sync) */}
                                    <div 
                                        ref={footerRightRef}
                                        onScroll={() => syncHorizontalScroll(footerRightRef.current, rightRef.current)}
                                        className="flex-1 overflow-x-auto scrollbar-hide"
                                    >
                                        <div className="min-w-max">
                                            {[
                                                { id: 'inversion_parcial', values: footer.inversion_parcial, formatter: (v) => formatCurrency(v, currency, decMoneda) },
                                                { id: 'inversion_acumulada', values: footer.inversion_acumulada, formatter: (v) => formatCurrency(v, currency, decMoneda) },
                                                { id: 'avance_parcial_pct', values: footer.avance_parcial_pct, formatter: (v) => formatPercent(v, 2) },
                                                { id: 'avance_acumulado_pct', values: footer.avance_acumulado_pct, formatter: (v) => formatPercent(v, 2) },
                                            ].map(fRow => (
                                                <div 
                                                    key={fRow.id} 
                                                    className="grid h-9 border-b border-white/8 last:border-0"
                                                    style={{ gridTemplateColumns: periods.map(() => VALORADO_RIGHT_PERIOD_WIDTH).join(' ') }}
                                                >
                                                    {(fRow.values || []).map((val, idx) => (
                                                        <div key={`${fRow.id}-${idx}`} className="flex items-center justify-end border-l border-white/8 px-2 text-[9px] font-semibold tabular-nums text-white/78">
                                                            {fRow.formatter(val)}
                                                        </div>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                ) : (
                                    <div className="flex h-10 min-w-0 items-center justify-end gap-1.5 overflow-x-auto px-3">
                                        <AppHint content={`Resumen compacto operativo. Total: ${cashFlowSummary.formattedTotalCost}. Pico: ${cashFlowSummary.peakLabel} por ${cashFlowSummary.formattedPeakCost}. Avance acumulado: ${formatPercent((footer.avance_acumulado_pct || [])[footer.avance_acumulado_pct.length - 1] || 0, 2)}. Periodos: ${periods.length}.`} tone="dark" maxWidth={320} widthOffset={12}>
                                            <span className="shrink-0 text-[8px] font-black uppercase tracking-[0.18em] text-[#F39200]">Resumen compacto</span>
                                        </AppHint>
                                        {compactFooterSummaryCards.map((card) => {
                                            const toneMap = {
                                                default: {
                                                    card: 'border-white/10 bg-white/[0.055]',
                                                    value: 'text-white/88',
                                                    label: 'text-white/44',
                                                    dot: 'bg-zinc-400',
                                                },
                                                success: {
                                                    card: 'border-emerald-400/25 bg-emerald-400/10',
                                                    value: 'text-emerald-200',
                                                    label: 'text-emerald-300',
                                                    dot: 'bg-emerald-400',
                                                },
                                                info: {
                                                    card: 'border-blue-400/25 bg-blue-400/10',
                                                    value: 'text-blue-200',
                                                    label: 'text-blue-300',
                                                    dot: 'bg-blue-400',
                                                },
                                                warning: {
                                                    card: 'border-amber-400/25 bg-amber-400/10',
                                                    value: 'text-amber-200',
                                                    label: 'text-amber-300',
                                                    dot: 'bg-amber-400',
                                                },
                                                danger: {
                                                    card: 'border-red-400/25 bg-red-400/10',
                                                    value: 'text-red-200',
                                                    label: 'text-red-300',
                                                    dot: 'bg-red-400',
                                                },
                                                total: {
                                                    card: 'border-[#F39200]/30 bg-[#F39200]/10',
                                                    value: 'text-[#ffbe64]',
                                                    label: 'text-[#F39200]',
                                                    dot: 'bg-[#F39200]',
                                                },
                                            };
                                            const tone = toneMap[card.accent] || toneMap.default;
                                            return (
                                                <AppHint key={card.id} content={card.title} tone="dark" maxWidth={260} widthOffset={12}>
                                                    <div
                                                        className={`inline-flex h-8 max-w-[210px] shrink-0 items-center gap-2 rounded-2xl border px-2.5 ${tone.card}`}
                                                    >
                                                        <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${tone.dot}`} />
                                                        <span className={`min-w-0 truncate text-[8px] font-black uppercase tracking-[0.16em] ${tone.label}`}>
                                                            {card.label}
                                                        </span>
                                                        <span className={`shrink-0 text-[10px] font-black tabular-nums ${tone.value}`}>
                                                            {card.value}
                                                        </span>
                                                    </div>
                                                </AppHint>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </section>

            {/* Modal de edición de celda */}
            {editingCell && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-900/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-md overflow-hidden rounded-[2rem] border border-zinc-200 bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-zinc-100 bg-zinc-50/50 px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 shadow-sm border border-sky-100">
                                    <Sigma className="h-6 w-6" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black uppercase tracking-tight text-zinc-900">
                                        Ajuste de Celda · Periodo {editingCell.periodIndex + 1}
                                    </h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                        {editingCell.row.codigo_item || formatCronogramaDescripcion(editingCell.row)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="flex bg-white rounded-xl border border-zinc-200 p-1 mr-2 shadow-sm">
                                    <button 
                                        onClick={() => onNavigateCell('prev')}
                                        className={`p-2 hover:bg-zinc-50 transition-colors rounded-lg ${isNavigating ? 'text-sky-600 bg-sky-50' : 'text-zinc-400 hover:text-zinc-900'}`}
                                        title="Periodo anterior (Flecha Izquierda)"
                                    >
                                        <ChevronLeft className="h-5 w-5" />
                                    </button>
                                    <div className="w-px h-6 bg-zinc-100 self-center" />
                                    <button 
                                        onClick={() => onNavigateCell('next')}
                                        className={`p-2 hover:bg-zinc-50 transition-colors rounded-lg ${isNavigating ? 'text-sky-600 bg-sky-50' : 'text-zinc-400 hover:text-zinc-900'}`}
                                        title="Siguiente periodo (Flecha Derecha)"
                                    >
                                        <ChevronRight className="h-5 w-5" />
                                    </button>
                                </div>
                                <button onClick={() => setEditingCell(null)} className="rounded-xl p-2 text-zinc-400 transition-colors hover:bg-white hover:text-zinc-900">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                        <div 
                            className="p-8 outline-none" 
                            tabIndex={0}
                            ref={(el) => {
                                if (el && isNavigating && document.activeElement !== el) {
                                    el.focus();
                                }
                            }}
                            onKeyDown={(e) => {
                                if (isNavigating) {
                                    if (e.key === 'ArrowRight') {
                                        e.preventDefault();
                                        onNavigateCell('next');
                                    }
                                    if (e.key === 'ArrowLeft') {
                                        e.preventDefault();
                                        onNavigateCell('prev');
                                    }
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        setIsNavigating(false);
                                        setTimeout(() => editInputRef.current?.focus(), 50);
                                    }
                                }
                            }}
                        >
                            <label className="block space-y-3">
                                <div className="flex justify-between items-end">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Nuevo Porcentaje (%)</span>
                                    <div className="text-right">
                                        <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">Total Proyectado</p>
                                        <p className={`text-xs font-black ${Math.abs(((() => {
                                            const dist = [...(editingCell.row.distribution || [])];
                                            dist[editingCell.periodIndex] = Number(editingCell.value || 0);
                                            return dist.reduce((acc, v) => acc + Number(v || 0), 0);
                                        })()) - 100) <= 0.001 ? 'text-emerald-600' : 'text-zinc-600'}`}>
                                            {formatPercent((() => {
                                                const dist = [...(editingCell.row.distribution || [])];
                                                dist[editingCell.periodIndex] = Number(editingCell.value || 0);
                                                return dist.reduce((acc, v) => acc + Number(v || 0), 0);
                                            })(), 2)}
                                        </p>
                                    </div>
                                </div>
                                <input
                                    ref={editInputRef}
                                    autoFocus
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="100"
                                    value={typeof editingCell.value === 'number' ? editingCell.value.toFixed(2) : editingCell.value}
                                    onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                                    onFocus={(e) => e.target.select()}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            onSaveCell(true);
                                            setIsNavigating(true);
                                        }
                                        if (e.key === 'ArrowRight' && !isNavigating) onNavigateCell('next');
                                        if (e.key === 'ArrowLeft' && !isNavigating) onNavigateCell('prev');
                                    }}
                                    className={`h-14 w-full rounded-2xl border-2 px-6 text-2xl font-black outline-none transition-all ${isNavigating ? 'border-zinc-100 bg-zinc-50 text-zinc-400 cursor-default' : 'border-sky-500 bg-white text-zinc-900 shadow-sm focus:border-sky-600'}`}
                                    readOnly={isNavigating}
                                    onClick={() => setIsNavigating(false)}
                                />
                            </label>

                            <button
                                onClick={() => setEditingCell({ ...editingCell, copyToRight: !editingCell.copyToRight })}
                                className="mt-6 flex w-full items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50/50 p-4 transition-all hover:bg-zinc-50"
                            >
                                <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border-2 transition-all ${editingCell.copyToRight ? 'border-sky-500 bg-sky-500 text-white' : 'border-zinc-300 bg-white'}`}>
                                    {editingCell.copyToRight && <Check className="h-4 w-4" />}
                                </div>
                                <div className="text-left">
                                    <p className="text-xs font-black text-zinc-900">Copiar a la derecha</p>
                                    <p className="text-[10px] font-bold text-zinc-500">Rellenar periodos siguientes hasta completar el 100%</p>
                                </div>
                            </button>

                            <div className="mt-8 flex gap-3">
                                <button
                                    onClick={() => setEditingCell(null)}
                                    className="flex-1 rounded-2xl border border-zinc-200 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-zinc-500 transition-colors hover:bg-zinc-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={() => onSaveCell()}
                                    className="flex-[2] rounded-2xl bg-zinc-900 px-6 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-lg transition-all hover:bg-zinc-800 hover:shadow-xl active:scale-95"
                                >
                                    Aplicar Cambio
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

const TrabajoDateField = ({
    value,
    onChange,
    onCommit,
    placeholder = 'dd/mm/yyyy',
}) => {
    const [pickerOpen, setPickerOpen] = useState(false);
    const wrapperRef = useRef(null);
    const nativeInputRef = useRef(null);

    const openPicker = useCallback(() => {
        setPickerOpen(true);
        window.requestAnimationFrame(() => {
            nativeInputRef.current?.click?.();
            nativeInputRef.current?.focus?.();
        });
    }, []);

    useEffect(() => {
        if (!pickerOpen) return undefined;

        const handlePointerDown = (event) => {
            if (!wrapperRef.current?.contains(event.target)) {
                setPickerOpen(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === 'Escape') {
                setPickerOpen(false);
            }
        };

        document.addEventListener('mousedown', handlePointerDown);
        document.addEventListener('touchstart', handlePointerDown);
        document.addEventListener('keydown', handleEscape);

        return () => {
            document.removeEventListener('mousedown', handlePointerDown);
            document.removeEventListener('touchstart', handlePointerDown);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [pickerOpen]);

    const commitValue = (nextValue) => {
        onCommit?.(nextValue);
    };

    const handleNativeChange = (event) => {
        const displayValue = formatDateInputValue(event.target.value);
        onChange?.(displayValue);
        commitValue(displayValue);
        setPickerOpen(false);
    };

    const handleToday = () => {
        const todayValue = formatDateInputValue(new Date());
        onChange?.(todayValue);
        commitValue(todayValue);
        setPickerOpen(false);
    };

    const handleClear = () => {
        onChange?.('');
        commitValue('');
        setPickerOpen(false);
    };

    return (
        <div ref={wrapperRef} className="relative">
            <div className="flex items-center gap-1.5 rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                <button
                    type="button"
                    onClick={openPicker}
                    className="shrink-0 rounded-full p-0.5 text-zinc-400 transition hover:bg-zinc-100 hover:text-sky-600"
                    aria-label="Abrir calendario"
                >
                    <CalendarRange className="h-3.5 w-3.5" />
                </button>
                <input
                    type="text"
                    value={value}
                    onFocus={openPicker}
                    onChange={(event) => onChange?.(event.target.value)}
                    onBlur={(event) => commitValue(event.target.value)}
                    placeholder={placeholder}
                    inputMode="numeric"
                    className="w-full bg-transparent text-[10px] font-black text-zinc-900 outline-none"
                />
            </div>
            {pickerOpen && (
                <div className="absolute left-0 top-[calc(100%+0.35rem)] z-30 w-[240px]">
                    <AnimatedDateInput
                        ref={nativeInputRef}
                        type="date"
                        value={formatNativeDateInputValue(value)}
                        onChange={handleNativeChange}
                        variant="compact"
                        align="left"
                        className="w-full rounded-[0.75rem] border border-zinc-200 px-2 py-2 text-[11px] font-black text-zinc-900 outline-none"
                    />
                </div>
            )}
        </div>
    );
};

const CronogramaTrabajo = ({
    detail,
    project,
    selectedBudget,
    selectedBudgetDetail,
    trabajo,
    trabajoLoading,
    onSaveTrabajoConfig,
    onSaveTrabajoLine,
    onExportMsProject,
    onImportMsProject,
}) => {
    const [configDraft, setConfigDraft] = useState({
        hora_inicio_jornada: 8,
        jornada_laboral_horas: 8,
        dias_laborables_semana: 5,
        dias_laborables_mes: 22,
        dias_mes: 30,
        recursos_asumidos_base: 1,
    });
    const [lineDrafts, setLineDrafts] = useState({});
    const [savingConfig, setSavingConfig] = useState(false);
    const [savingLineId, setSavingLineId] = useState(null);
    const [importingMsProject, setImportingMsProject] = useState(false);
    const importMsProjectInputRef = useRef(null);
    const exportCapabilities = trabajo?.export_capabilities;
    const directMppAvailable = exportCapabilities?.direct_mpp_available;
    const directExportReason = exportCapabilities?.direct_export_reason;
    const effectiveMsProjectAvailable = !!directMppAvailable;
    const msProjectStatusMessage = useMemo(
        () => summarizeMsProjectReason(directExportReason),
        [directExportReason],
    );

    useEffect(() => {
        const diasMes = Math.max(1, Number(trabajo?.config?.dias_mes ?? 30));
        const diasLaborablesMes = Number(trabajo?.config?.dias_laborables_mes ?? 22);
        const diasLaborablesSemana = Number(trabajo?.config?.dias_laborables_semana ?? ((diasLaborablesMes * 7) / diasMes));
        setConfigDraft({
            hora_inicio_jornada: trabajo?.config?.hora_inicio_jornada ?? 8,
            jornada_laboral_horas: trabajo?.config?.jornada_laboral_horas ?? 8,
            dias_laborables_semana: Math.min(7, Math.max(1, diasLaborablesSemana || 5)),
            dias_laborables_mes: trabajo?.config?.dias_laborables_mes ?? 22,
            dias_mes: diasMes,
            recursos_asumidos_base: trabajo?.config?.recursos_asumidos_base ?? 1,
            apu_resource_modifications_v1: (
                trabajo?.config?.apu_resource_modifications_v1
                && typeof trabajo.config.apu_resource_modifications_v1 === 'object'
                && !Array.isArray(trabajo.config.apu_resource_modifications_v1)
                    ? trabajo.config.apu_resource_modifications_v1
                    : {}
            ),
        });
    }, [trabajo?.config]);

    const displayRows = useMemo(
        () => buildDisplayRows(selectedBudgetDetail?.detalle, trabajo?.rows || [], selectedBudgetDetail?.edt_tree),
        [selectedBudgetDetail?.detalle, selectedBudgetDetail?.edt_tree, trabajo?.rows],
    );

    const handleConfigField = (field, value) => {
        setConfigDraft((current) => {
            const next = { ...current, [field]: value };
            if (field === 'dias_laborables_semana' || field === 'dias_mes') {
                const diasMes = Math.max(1, Number(next.dias_mes || 30));
                const diasLaborablesSemana = Math.min(7, Math.max(1, Number(next.dias_laborables_semana || 5)));
                next.dias_mes = diasMes;
                next.dias_laborables_semana = diasLaborablesSemana;
                next.dias_laborables_mes = Math.round(((diasLaborablesSemana * diasMes) / 7) * 10000) / 10000;
            }
            if (field === 'hora_inicio_jornada') {
                next.hora_inicio_jornada = Math.min(23.5, Math.max(0, Number(next.hora_inicio_jornada || 8)));
            }
            return next;
        });
    };

    const handleSaveConfig = async () => {
        setSavingConfig(true);
        try {
            await onSaveTrabajoConfig?.(configDraft);
            await appAlert({
                title: 'Cronograma actualizado',
                message: 'La configuración base del cronograma de trabajo se guardó correctamente.',
                tone: 'success',
            });
        } catch (error) {
            globalThis.reportClientError?.('Error guardando configuración de cronograma de trabajo:', error);
            await appAlert({
                title: 'No se pudo guardar',
                message: resolveApiErrorMessage(error, 'No fue posible guardar la configuración del cronograma de trabajo.'),
                tone: 'danger',
            });
        } finally {
            setSavingConfig(false);
        }
    };

    const handleDraftChange = (rowId, field, value) => {
        setLineDrafts((current) => ({
            ...current,
            [rowId]: {
                ...(current[rowId] || {}),
                [field]: value,
            },
        }));
    };

    const handleSaveRow = async (row) => {
        const draft = lineDrafts[row.budget_line_id] || {};
        setSavingLineId(row.budget_line_id);
        try {
            await onSaveTrabajoLine?.(row, draft);
            setLineDrafts((current) => {
                const next = { ...current };
                delete next[row.budget_line_id];
                return next;
            });
        } catch (error) {
            globalThis.reportClientError?.('Error guardando línea de cronograma de trabajo:', error);
            if (!error?.__cronogramaHandled) {
                await appAlert({
                    title: 'No se pudo guardar la línea',
                    message: resolveApiErrorMessage(error, 'No fue posible guardar la línea del cronograma de trabajo.'),
                    tone: 'danger',
                });
            }
        } finally {
            setSavingLineId(null);
        }
    };

    const handleMsProjectExportClick = async () => {
        if (directMppAvailable) {
            await onExportMsProject?.('mpp');
            return;
        }
        await appAlert({
            title: 'Exportación .mpp no disponible',
            message: `${msProjectStatusMessage}\n\nEl carril XML Project sigue disponible mientras se habilita el generador nativo .mpp del backend.`,
            tone: 'warning',
        });
    };

    const handleMsProjectImportClick = async () => {
        const shouldImport = await appConfirm({
            title: 'Importar XML MS Project',
            message: 'La importación actualizará fechas, duración, avance y dependencias del Gantt. No modificará el presupuesto, APUs ni recursos. Usa preferentemente un XML exportado desde GiProy o conserva el campo Text1/OutlineNumber de las partidas.',
            confirmLabel: 'Seleccionar XML',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (shouldImport) {
            importMsProjectInputRef.current?.click();
        }
    };

    const handleMsProjectImportFileChange = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (!file.name.toLowerCase().endsWith('.xml')) {
            await appAlert({
                title: 'Archivo no válido',
                message: 'Selecciona un archivo XML de Microsoft Project.',
                tone: 'danger',
            });
            return;
        }
        setImportingMsProject(true);
        try {
            const updated = await onImportMsProject?.(file);
            await appAlert({
                title: 'Importación lista',
                message: `Se importó el XML y se actualizó el Gantt con ${updated?.rows?.length || 0} partidas calculables disponibles.`,
                tone: 'success',
            });
        } catch (error) {
            globalThis.reportClientError?.('Error importando XML de Microsoft Project:', error);
            await appAlert({
                title: 'No se pudo importar',
                message: resolveApiErrorMessage(error, 'No fue posible importar el XML de Microsoft Project.'),
                tone: 'danger',
            });
        } finally {
            setImportingMsProject(false);
        }
    };

    if (trabajoLoading) {
        return (
            <div className="flex h-full min-h-[440px] items-center justify-center rounded-[2rem] border border-zinc-200 bg-white">
                <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                    Cargando cronograma de trabajo
                </div>
            </div>
        );
    }

    if (!selectedBudget) {
        return (
            <div className="rounded-[2rem] border border-dashed border-zinc-300 bg-white px-8 py-12 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-sky-500">Cronograma Gantt</p>
                <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-zinc-900">Selecciona un presupuesto operativo</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-500">
                    Este workbench calcula duración, horas y carga operativa desde el presupuesto activo del proyecto.
                </p>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-2 overflow-hidden">
            <section className="grid grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_286px]">
                <div className="rounded-[1rem] border border-zinc-200 bg-white px-3 py-2.5 shadow-[0_4px_14px_rgba(0,0,0,0.03)]">
                    <div className="flex flex-col gap-2">
                        <div className="flex min-w-0 flex-1 items-start gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[0.75rem] border border-sky-200 bg-sky-50">
                                <ClipboardList className="h-4 w-4 text-sky-600" />
                            </div>
                            <div className="grid min-w-0 flex-1 grid-cols-1 gap-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)_auto]">
                                <div className="min-w-0 rounded-[0.8rem] border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">Ventana</p>
                                    <p className="mt-0.5 truncate text-[12px] font-black text-zinc-900">
                                        {detail?.fecha_inicio && detail?.fecha_finalizacion
                                            ? `${formatDate(detail.fecha_inicio)} - ${formatDate(detail.fecha_finalizacion)}`
                                            : 'Pendiente de fechas'}
                                    </p>
                                </div>
                                <div className="min-w-0 rounded-[0.8rem] border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">Origen</p>
                                    <p className="mt-0.5 truncate text-[12px] font-black text-zinc-900">
                                        {`${project?.codigo_root || project?.codigo || 'Proyecto'} · REV ${String(project?.revision ?? 0).padStart(3, '0')}`}
                                    </p>
                                </div>
                                <div className="min-w-0 rounded-[0.8rem] border border-zinc-200 bg-zinc-50/80 px-3 py-2">
                                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">Presupuesto</p>
                                    <p className="mt-0.5 truncate text-[12px] font-black text-zinc-900">
                                        {selectedBudget?.descripcion || 'Sin presupuesto operativo'}
                                    </p>
                                </div>
                                <div className="flex shrink-0 flex-col items-stretch gap-1 xl:items-end">
                                    <div className="flex shrink-0 flex-wrap gap-2 xl:justify-end">
                                        <input
                                            ref={importMsProjectInputRef}
                                            type="file"
                                            accept=".xml,application/xml,text/xml"
                                            className="hidden"
                                            onChange={handleMsProjectImportFileChange}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleMsProjectExportClick}
                                            disabled={!selectedBudget}
                                            title={effectiveMsProjectAvailable ? 'Generar y descargar .mpp del proyecto' : msProjectStatusMessage}
                                            className={`${CRONOGRAMA_SOFT_ACTION_BUTTON} h-9 gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.12em] ${
                                                effectiveMsProjectAvailable
                                                    ? 'text-[#171717]'
                                                    : 'text-zinc-500 hover:text-amber-700'
                                            }`}
                                        >
                                            {effectiveMsProjectAvailable ? <Download className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                                            MS Project
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleMsProjectImportClick}
                                            disabled={!selectedBudget || importingMsProject}
                                            className={`${CRONOGRAMA_SOFT_ACTION_BUTTON} h-9 gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.12em] text-[#F39200]`}
                                        >
                                            {importingMsProject ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                                            Importar XML
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => onExportMsProject?.('xml')}
                                            disabled={!selectedBudget}
                                            className={`${CRONOGRAMA_SOFT_ACTION_BUTTON} h-9 gap-2 rounded-full px-3 text-[10px] font-black uppercase tracking-[0.12em] text-zinc-600 hover:text-sky-600`}
                                        >
                                            <Download className="h-4 w-4" />
                                            XML Project
                                        </button>
                                    </div>
                                    {!effectiveMsProjectAvailable && (
                                        <p className="max-w-[320px] text-right text-[8px] font-bold leading-relaxed text-amber-700">
                                            {msProjectStatusMessage}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-7">
                            <div className="rounded-[0.8rem] border border-zinc-200 bg-white px-3 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">Partidas</p>
                                <p className="mt-0.5 text-[1rem] font-black tracking-tight text-zinc-900">{trabajo?.summary?.partidas_calculables || 0}</p>
                            </div>
                            <div className="rounded-[0.8rem] border border-zinc-200 bg-white px-3 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">Trabajo útil</p>
                                <p className="mt-0.5 text-[1rem] font-black tracking-tight text-zinc-900">{formatNumber(trabajo?.summary?.trabajo_total || 0, 2)} h</p>
                            </div>
                            <div className="rounded-[0.8rem] border border-zinc-200 bg-white px-3 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">Cuadrilla</p>
                                <p className="mt-0.5 text-[1rem] font-black tracking-tight text-zinc-900">{formatNumber(trabajo?.summary?.cuadrilla_total || trabajo?.summary?.recursos_calculados_total || 0, 2)}</p>
                            </div>
                            <div className="rounded-[0.8rem] border border-sky-100 bg-sky-50/70 px-3 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-sky-500">Equipos</p>
                                <p className="mt-0.5 text-[1rem] font-black tracking-tight text-sky-700">{formatNumber(trabajo?.summary?.horas_equipos || 0, 2)} h</p>
                            </div>
                            <div className="rounded-[0.8rem] border border-violet-100 bg-violet-50/70 px-3 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-violet-500">Mano de obra</p>
                                <p className="mt-0.5 text-[1rem] font-black tracking-tight text-violet-700">{formatNumber(trabajo?.summary?.horas_mano_obra || 0, 2)} h</p>
                            </div>
                            <div className="rounded-[0.8rem] border border-fuchsia-100 bg-fuchsia-50/70 px-3 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-fuchsia-500">Transporte</p>
                                <p className="mt-0.5 text-[1rem] font-black tracking-tight text-fuchsia-700">{formatNumber(trabajo?.summary?.horas_transporte || 0, 2)} h</p>
                            </div>
                            <div className="rounded-[0.8rem] border border-emerald-100 bg-emerald-50/70 px-3 py-2">
                                <p className="text-[8px] font-black uppercase tracking-[0.16em] text-emerald-500">Días cal.</p>
                                <p className="mt-0.5 text-[1rem] font-black tracking-tight text-emerald-700">{formatNumber(trabajo?.summary?.dias_calendario_total || 0, 2)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-[1rem] border border-zinc-200 bg-white px-2.5 py-2 shadow-[0_4px_14px_rgba(0,0,0,0.03)]">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className="text-[9px] font-black uppercase tracking-[0.14em] text-zinc-500">Parámetros cálculo</p>
                        <button
                            type="button"
                            onClick={handleSaveConfig}
                            disabled={savingConfig}
                            className="inline-flex h-7 items-center gap-1.5 rounded-[0.75rem] bg-[#171717] px-2.5 text-[9px] font-black uppercase tracking-[0.1em] text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {savingConfig ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                            Guardar
                        </button>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                        <label className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50/70 px-2 py-1.5">
                            <span className="text-[7px] font-black uppercase tracking-[0.14em] text-zinc-400">Jornada (h)</span>
                            <input type="number" min="1" step="0.5" value={configDraft.jornada_laboral_horas} onChange={(e) => handleConfigField('jornada_laboral_horas', Number(e.target.value || 0))} className="mt-0.5 w-full bg-transparent text-[0.9rem] font-black leading-none text-zinc-900 outline-none" />
                        </label>
                        <label className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50/70 px-2 py-1.5">
                            <span className="text-[7px] font-black uppercase tracking-[0.14em] text-zinc-400">Recursos base</span>
                            <input type="number" min="1" step="0.5" value={configDraft.recursos_asumidos_base} onChange={(e) => handleConfigField('recursos_asumidos_base', Number(e.target.value || 0))} className="mt-0.5 w-full bg-transparent text-[0.9rem] font-black leading-none text-zinc-900 outline-none" />
                        </label>
                        <label className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50/70 px-2 py-1.5">
                            <span className="text-[7px] font-black uppercase tracking-[0.14em] text-zinc-400">Laborables / semana</span>
                            <input type="number" min="1" max="7" step="0.5" value={configDraft.dias_laborables_semana} onChange={(e) => handleConfigField('dias_laborables_semana', Number(e.target.value || 0))} className="mt-0.5 w-full bg-transparent text-[0.9rem] font-black leading-none text-zinc-900 outline-none" />
                        </label>
                        <label className="rounded-[0.75rem] border border-zinc-200 bg-zinc-50/70 px-2 py-1.5">
                            <span className="text-[7px] font-black uppercase tracking-[0.14em] text-zinc-400">Días / mes</span>
                            <input type="number" min="1" step="1" value={configDraft.dias_mes} onChange={(e) => handleConfigField('dias_mes', Number(e.target.value || 0))} className="mt-0.5 w-full bg-transparent text-[0.9rem] font-black leading-none text-zinc-900 outline-none" />
                        </label>
                    </div>
                </div>
            </section>

            <section className="flex min-h-0 flex-1 overflow-hidden rounded-[1rem] border border-zinc-200 bg-white shadow-[0_4px_14px_rgba(0,0,0,0.03)]">
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                    <div className="grid grid-cols-[84px_minmax(320px,2.4fr)_154px_154px_76px_92px_118px_88px_70px] gap-0 border-b border-zinc-200 bg-[#171717] px-3 py-2 text-[8px] font-black uppercase tracking-[0.14em] text-zinc-300">
                        <div>Código</div>
                        <div>Partida</div>
                        <div>Inicio</div>
                        <div>Fin</div>
                        <div>Días</div>
                        <div>Cuadrilla</div>
                        <div>Predecesoras</div>
                        <div>% Avance</div>
                        <div>Guardar</div>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto">
                        {displayRows.map((row) => {
                            if (!row.is_calculable) {
                                const displayCode = sanitizeTrabajoRowCode(row.codigo_item);
                                return (
                                    <div
                                        key={`trabajo-${row.budget_line_id}`}
                                        className="grid grid-cols-[84px_minmax(320px,2.4fr)_154px_154px_76px_92px_118px_88px_70px] items-center gap-0 border-b border-sky-100 bg-sky-50/50 px-3 py-2"
                                    >
                                        <div className="font-mono text-[10px] font-black tracking-wider text-blue-700">{displayCode || '\u00A0'}</div>
                                        <div className="flex items-center gap-2">
                                            <Folders className="h-3.5 w-3.5 text-blue-500" />
                                            <span className="truncate text-[10px] font-black uppercase tracking-tight text-blue-900">{formatCronogramaDescripcion(row)}</span>
                                        </div>
                                        <div className="col-span-7 text-[8px] font-bold uppercase tracking-[0.1em] text-blue-300">Bloque EDT del presupuesto</div>
                                    </div>
                                );
                            }

                            const draft = lineDrafts[row.budget_line_id] || {};
                            const assumedUnits = draft.assumed_resource_units ?? row.recursos_asumidos ?? trabajo?.config?.recursos_asumidos_base ?? 1;
                            const progressPct = draft.progress_pct ?? row.progress_pct ?? 0;
                            const predecessorsInput = draft.predecessors ?? (row.predecessors || []).join(', ');
                            const startDateInput = draft.start_date ?? formatDateInputValue(row.start_date);

                            const displayCode = sanitizeTrabajoRowCode(row.codigo_item);
                            const quantityLabel = row.unidad
                                ? `${row.unidad} · ${formatNumber(row.cantidad || 0, 2)}`
                                : formatNumber(row.cantidad || 0, 2);
                            const workLabel = Number(row.trabajo_total || row.horas_total || 0) > 0
                                ? `${formatNumber(row.trabajo_total || row.horas_total || 0, 2)} h`
                                : null;
                            const crewLabel = Number(row.cuadrilla_total || row.recursos_calculados || 0) > 0
                                ? formatNumber(row.cuadrilla_total || row.recursos_calculados || 0, 2)
                                : null;

                            return (
                                <div
                                    key={`trabajo-${row.budget_line_id}`}
                                    className="grid grid-cols-[84px_minmax(320px,2.4fr)_154px_154px_76px_92px_118px_88px_70px] items-center gap-0 border-b border-zinc-100 px-3 py-1.5"
                                >
                                    <div className="font-mono text-[10px] font-black tracking-wider text-[#F39200]">
                                        {displayCode || '\u00A0'}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex min-w-0 items-center gap-2">
                                            <Calculator className="h-3.5 w-3.5 shrink-0 text-[#F39200]" />
                                            <span className="truncate text-[10px] font-bold text-zinc-800">{formatCronogramaDescripcion(row)}</span>
                                            <span className="shrink-0 text-[8px] font-bold text-zinc-400">{quantityLabel}</span>
                                            {workLabel && (
                                                <span className="shrink-0 text-[8px] font-bold text-sky-600">{workLabel}</span>
                                            )}
                                            {crewLabel && (
                                                <span className="shrink-0 text-[8px] font-bold text-emerald-600">Cuad. {crewLabel}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div>
                                        <TrabajoDateField
                                            value={startDateInput}
                                            onChange={(nextValue) => handleDraftChange(row.budget_line_id, 'start_date', nextValue)}
                                            onCommit={(nextValue) => handleDraftChange(row.budget_line_id, 'start_date', normalizeDateInputValue(nextValue))}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                                            <span className={`truncate text-[10px] font-black ${row.end_date ? 'text-emerald-700' : 'text-zinc-400'}`}>
                                                {row.end_date ? formatDate(row.end_date) : 'Sin fecha'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-black text-amber-600">{formatNumber(row.dias_calendario || 0, 2)}</div>
                                    <div>
                                        <div className="flex items-center gap-1.5 rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                                            <Users className="h-3.5 w-3.5 text-zinc-400" />
                                            <input
                                                type="number"
                                                min="1"
                                                step="0.5"
                                                value={assumedUnits}
                                                onChange={(e) => handleDraftChange(row.budget_line_id, 'assumed_resource_units', Number(e.target.value || 0))}
                                                className="w-full bg-transparent text-[10px] font-black text-zinc-900 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                                            <Link2 className="h-3.5 w-3.5 text-zinc-400" />
                                            <input
                                                type="text"
                                                value={predecessorsInput}
                                                onChange={(e) => handleDraftChange(row.budget_line_id, 'predecessors', e.target.value)}
                                                placeholder="1,2"
                                                className="w-full bg-transparent text-[10px] font-black text-zinc-900 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-1.5 rounded-[0.75rem] border border-zinc-200 bg-zinc-50 px-2 py-1.5">
                                            <Clock3 className="h-3.5 w-3.5 text-zinc-400" />
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                step="1"
                                                value={progressPct}
                                                onChange={(e) => handleDraftChange(row.budget_line_id, 'progress_pct', Number(e.target.value || 0))}
                                                className="w-full bg-transparent text-[10px] font-black text-zinc-900 outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-end">
                                        <button
                                            type="button"
                                            onClick={() => handleSaveRow(row)}
                                            disabled={savingLineId === row.budget_line_id}
                                            className="inline-flex h-8 w-8 items-center justify-center rounded-[0.75rem] border border-zinc-200 bg-white text-zinc-500 transition hover:border-sky-200 hover:text-sky-600 disabled:cursor-not-allowed disabled:opacity-60"
                                        >
                                            {savingLineId === row.budget_line_id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
};

const withAsyncTimeout = (promise, timeoutMs, timeoutMessage) => new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
        reject(new Error(timeoutMessage));
    }, timeoutMs);

    Promise.resolve(promise)
        .then((value) => {
            clearTimeout(timer);
            resolve(value);
        })
        .catch((error) => {
            clearTimeout(timer);
            reject(error);
    });
});

const CronogramaRecursosReadOnly = ({
    recursos,
    recursosState,
    recursosStateDraft,
    recursosStateDirty,
    recursosStateSaving,
    stateError,
    loading,
    error,
    currency,
    decMoneda,
    decCalculos,
    onRefresh,
    onLimitChange,
    onSaveState,
    onResetStateDraft,
    onPersistLevelingProposal,
    onApproveLevelingProposal,
    onRequestLevelingApplication,
    onCancelLevelingApplication,
    onApplyLevelingApplication,
    onRollbackLevelingApplication,
    onClearLevelingProposal,
}) => {
    const CATEGORIAS_RECURSOS = useMemo(() => [
        { id: 1, nombre: 'Equipos y Herramientas', icon: '🔧', color: 'text-blue-600' },
        { id: 2, nombre: 'Materiales', icon: '📦', color: 'text-green-600' },
        { id: 3, nombre: 'Transporte', icon: '🚚', color: 'text-yellow-600' },
        { id: 4, nombre: 'Mano de Obra', icon: '👥', color: 'text-purple-600' },
    ], []);

    const [recursosSearch, setRecursosSearch] = useState('');
    const [selectedCat, setSelectedCat] = useState(1);
    const [selectedSubcatId, setSelectedSubcatId] = useState(null);
    const [searchSubcategories, setSearchSubcategories] = useState('');

    const allRows = recursos?.recursos || [];

    const categoryCounts = useMemo(() => {
        const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
        allRows.forEach(row => {
            const catId = Number(row.categoria_id);
            if (counts[catId] !== undefined) {
                counts[catId] += 1;
            }
        });
        return counts;
    }, [allRows]);

    const subcategoriesOfActiveCat = useMemo(() => {
        const subMap = new Map();
        allRows.forEach(row => {
            if (Number(row.categoria_id) === Number(selectedCat)) {
                const name = row.subcategoria || 'Sin subcategoria';
                if (!subMap.has(name)) {
                    subMap.set(name, { name, count: 0 });
                }
                subMap.get(name).count += 1;
            }
        });
        return [...subMap.values()].sort((a, b) => a.name.localeCompare(b.name));
    }, [allRows, selectedCat]);

    const filteredSubcategories = useMemo(() => {
        if (!searchSubcategories.trim()) return subcategoriesOfActiveCat;
        const query = searchSubcategories.toLowerCase();
        return subcategoriesOfActiveCat.filter(sub =>
            sub.name.toLowerCase().includes(query)
        );
    }, [subcategoriesOfActiveCat, searchSubcategories]);

    const rows = useMemo(() => {
        if (!recursosSearch.trim()) return allRows;
        const lowerSearch = recursosSearch.toLowerCase();
        return allRows.filter((row) =>
            (row.categoria && row.categoria.toLowerCase().includes(lowerSearch)) ||
            (row.subcategoria && row.subcategoria.toLowerCase().includes(lowerSearch)) ||
            (row.descripcion && row.descripcion.toLowerCase().includes(lowerSearch)) ||
            (row.codigo && row.codigo.toLowerCase().includes(lowerSearch))
        );
    }, [allRows, recursosSearch]);
    const periodos = recursos?.periodos || [];
    const summary = recursos?.summary || {};
    const peakPeriod = [...periodos].sort((a, b) => Number(b.costo || 0) - Number(a.costo || 0))[0] || null;
    const adjustmentKeys = Object.keys(recursosState?.adjustments || {});
    const manualLimits = recursosStateDraft?.manual_limits || {};
    const persistedLevelingProposal = recursosStateDraft?.leveling_proposal || null;
    const approvedLevelingProposal = persistedLevelingProposal?.status === 'approved' ? persistedLevelingProposal : null;
    const levelingApplicationIntent = recursosStateDraft?.leveling_application_intent || null;
    const levelingApplicationResult = recursosStateDraft?.leveling_application_result || null;
    const applicationPreview = useMemo(() => {
        if (!approvedLevelingProposal) return null;
        const moves = approvedLevelingProposal.moves || [];
        const unresolved = approvedLevelingProposal.unresolved || [];
        const summary = approvedLevelingProposal.summary || {};
        const affectedResources = new Set(moves.map((move) => move.resource_id)).size || Number(summary.affected_resources || 0);
        return {
            movesCount: moves.length,
            unresolvedCount: unresolved.length,
            affectedResources,
            resolvedQuantity: Number(summary.resolved_quantity || 0),
            unresolvedQuantity: Number(summary.unresolved_quantity || 0),
            overloadedQuantity: Number(summary.overloaded_quantity || 0),
            hasPendingCapacity: unresolved.length > 0 || Number(summary.unresolved_quantity || 0) > 0,
            generatedAt: approvedLevelingProposal.generated_at,
            approvedAt: approvedLevelingProposal.approved_at,
        };
    }, [approvedLevelingProposal]);
    const getManualLimitValue = (resourceId, periodId) => {
        const value = manualLimits?.[String(resourceId)]?.[String(periodId)];
        return value === null || value === undefined ? '' : String(value);
    };
    const getPeriodCapacityStatus = (resourceId, periodId, demand) => {
        const rawLimit = manualLimits?.[String(resourceId)]?.[String(periodId)];
        if (rawLimit === null || rawLimit === undefined || rawLimit === '') {
            return { hasLimit: false, limit: null, excess: 0, overloaded: false };
        }
        const limit = Number(rawLimit);
        if (!Number.isFinite(limit)) {
            return { hasLimit: false, limit: null, excess: 0, overloaded: false };
        }
        const quantity = Number(demand || 0);
        const excess = Math.max(0, quantity - limit);
        return {
            hasLimit: true,
            limit,
            excess,
            overloaded: excess > 0,
        };
    };
    const overloadSummary = useMemo(() => {
        const overloadedResources = new Set();
        let overloadedPeriods = 0;
        let maxExcess = 0;
        rows.forEach((row) => {
            (row.periodos || []).forEach((periodo) => {
                const status = getPeriodCapacityStatus(row.recurso_id, periodo.periodo_id, periodo.cantidad);
                if (!status.overloaded) return;
                overloadedPeriods += 1;
                overloadedResources.add(row.recurso_id);
                maxExcess = Math.max(maxExcess, status.excess);
            });
        });
        return {
            resources: overloadedResources.size,
            periods: overloadedPeriods,
            maxExcess,
        };
    }, [manualLimits, rows]);
    const levelingSimulation = useMemo(() => {
        const moves = [];
        const unresolved = [];
        const affectedResources = new Set();
        let resolvedQuantity = 0;
        let unresolvedQuantity = 0;
        let overloadedQuantity = 0;

        rows.forEach((row) => {
            const rowPeriods = row.periodos || [];
            const availableByPeriod = rowPeriods.map((periodo) => {
                const status = getPeriodCapacityStatus(row.recurso_id, periodo.periodo_id, periodo.cantidad);
                if (!status.hasLimit || status.overloaded) return 0;
                return Math.max(0, Number(status.limit || 0) - Number(periodo.cantidad || 0));
            });

            rowPeriods.forEach((periodo, sourceIndex) => {
                const status = getPeriodCapacityStatus(row.recurso_id, periodo.periodo_id, periodo.cantidad);
                if (!status.overloaded) return;

                affectedResources.add(row.recurso_id);
                overloadedQuantity += status.excess;
                let remaining = status.excess;

                for (let targetIndex = sourceIndex + 1; targetIndex < rowPeriods.length && remaining > 0; targetIndex += 1) {
                    const available = availableByPeriod[targetIndex] || 0;
                    if (available <= 0) continue;

                    const quantity = Math.min(remaining, available);
                    availableByPeriod[targetIndex] -= quantity;
                    remaining -= quantity;
                    resolvedQuantity += quantity;
                    moves.push({
                        resourceId: row.recurso_id,
                        recurso: row.recurso || 'Recurso sin descripcion',
                        sourcePeriod: periodo.label,
                        targetPeriod: rowPeriods[targetIndex]?.label || '-',
                        quantity,
                    });
                }

                if (remaining > 0) {
                    unresolvedQuantity += remaining;
                    unresolved.push({
                        resourceId: row.recurso_id,
                        recurso: row.recurso || 'Recurso sin descripcion',
                        period: periodo.label,
                        quantity: remaining,
                    });
                }
            });
        });

        return {
            moves,
            unresolved,
            affectedResources: affectedResources.size,
            resolvedQuantity,
            unresolvedQuantity,
            overloadedQuantity,
        };
    }, [manualLimits, rows]);
    const categoryGroups = useMemo(() => {
        const grouped = new Map();
        rows.forEach((row) => {
            // Filter by active category
            if (Number(row.categoria_id) !== Number(selectedCat)) return;
            // Filter by selected subcategory name
            if (selectedSubcatId && row.subcategoria !== selectedSubcatId) return;

            const categoryKey = `${row.categoria_id || 0}|${row.categoria || 'Sin categoria'}`;
            if (!grouped.has(categoryKey)) {
                grouped.set(categoryKey, {
                    id: row.categoria_id || 0,
                    label: row.categoria || 'Sin categoria',
                    totalCost: 0,
                    totalQuantity: 0,
                    subcategories: new Map(),
                });
            }
            const category = grouped.get(categoryKey);
            category.totalCost += Number(row.costo_total || 0);
            category.totalQuantity += Number(row.cantidad_total || 0);
            const subcategoryKey = row.subcategoria || '-';
            if (!category.subcategories.has(subcategoryKey)) {
                category.subcategories.set(subcategoryKey, {
                    label: subcategoryKey,
                    totalCost: 0,
                    totalQuantity: 0,
                    rows: [],
                });
            }
            const subcategory = category.subcategories.get(subcategoryKey);
            subcategory.totalCost += Number(row.costo_total || 0);
            subcategory.totalQuantity += Number(row.cantidad_total || 0);
            subcategory.rows.push(row);
        });
        return [...grouped.values()].map((category) => ({
            ...category,
            subcategories: [...category.subcategories.values()].sort((a, b) => a.label.localeCompare(b.label)),
        }));
    }, [rows, selectedCat, selectedSubcatId]);
    const periodGridStyle = useMemo(() => ({
        gridTemplateColumns: `repeat(${Math.max(periodos.length, 1)}, minmax(8rem, 1fr))`,
    }), [periodos.length]);

    if (loading) {
        return (
            <div className="flex min-h-[360px] items-center justify-center rounded-[1.4rem] border border-zinc-200 bg-white">
                <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                    <Loader2 className="h-5 w-5 animate-spin text-[#136191]" />
                    Cargando recursos
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3">
                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Recursos</p>
                <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-900">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden">
            <div className="flex min-w-0 flex-nowrap items-center gap-2.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden mb-3 pb-1">
                <div className="flex min-w-0 flex-1 shrink-0 flex-nowrap items-center gap-2.5">
                    <ControlRail className="h-[60px] min-w-[280px] flex-[0.7_1_18rem] px-2 py-1.5">
                    <ControlRailSection className="h-full min-w-max flex-1 items-center gap-3 pl-3 pr-3">
                        <div className="flex flex-col items-start justify-center min-w-max">
                            <div className="flex items-center gap-2">
                                <h3 className="text-[11px] font-black uppercase tracking-[0.14em] text-sky-400">
                                    Matriz Operacional
                                </h3>
                                <span className="text-[10px] font-black uppercase tracking-[0.14em] text-zinc-400">
                                    V{formatNumber(recursosState?.version || 1, 0)} - {formatNumber(adjustmentKeys.length, 0)} AJUSTE(S)
                                </span>
                            </div>
                            <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[0.12em] text-white/60">
                                {formatNumber(categoryGroups.length, 0)} CATEGORIAS  {String(recursos?.period_type || 'PERIODOS').toUpperCase()}  {String(recursos?.distribution_mode || 'DISTRIBUCION').toUpperCase()}  {String(recursos?.mode || 'READ_ONLY').toUpperCase()}
                            </p>
                        </div>
                    </ControlRailSection>
                </ControlRail>
                <ControlRail className="h-[60px] min-w-[420px] flex-[2_1_28rem] px-2 py-1.5">
                    <ControlRailSection className="h-full min-w-0 flex-1 items-center gap-2 pl-2 pr-2">
                        <div className="flex flex-col items-center justify-center min-w-[60px]">
                            <p className="text-[7px] font-black uppercase tracking-[0.12em] text-white/40">Métricas</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-bold text-white/90" title="Recursos">{formatNumber(summary.recursos || rows.length, 0)}<span className="text-[8px] text-white/40 ml-0.5">R</span></span>
                                <span className="text-white/20 text-[10px]">|</span>
                                <span className="text-[10px] font-bold text-white/90" title="Periodos">{formatNumber(summary.periodos || periodos.length, 0)}<span className="text-[8px] text-white/40 ml-0.5">P</span></span>
                            </div>
                        </div>
                        <ControlRailDivider className="h-7" />

                        <div className="flex flex-col items-center justify-center min-w-[130px]">
                            <p className="text-[7px] font-black uppercase tracking-[0.12em] text-white/40">Costo Directo / Pico</p>
                            <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-bold text-emerald-400">{formatCurrency(summary.costo_total || 0, currency, decMoneda)}</span>
                                <span className="text-white/20 text-[10px]">|</span>
                                <span className="text-[10px] font-bold text-white/80" title={peakPeriod?.label || '-'}>{formatCurrency(peakPeriod?.costo || 0, currency, decMoneda)}</span>
                            </div>
                        </div>
                        <ControlRailDivider className="h-7" />

                        <div className="flex flex-col items-center justify-center min-w-[80px]">
                            <p className="text-[7px] font-black uppercase tracking-[0.12em] text-white/40">Sobrecargas</p>
                            <div className="flex items-center mt-0.5">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-widest ${overloadSummary.periods > 0 ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                                    {formatNumber(overloadSummary.periods, 0)} <span className="ml-1 text-[7px] opacity-70">PER</span>
                                </span>
                            </div>
                        </div>
                        <ControlRailDivider className="h-7" />

                        <div className="flex flex-col items-center justify-center min-w-[80px]">
                            <p className="text-[7px] font-black uppercase tracking-[0.12em] text-white/40">Simulación</p>
                            <div className="flex items-center mt-0.5">
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black tracking-widest ${levelingSimulation.moves.length > 0 ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30' : 'bg-white/5 text-white/50 border border-white/10'}`}>
                                    {formatNumber(levelingSimulation.moves.length, 0)} <span className="ml-1 text-[7px] opacity-70">MOV</span>
                                </span>
                            </div>
                        </div>
                    </ControlRailSection>
                </ControlRail>
                </div>

                <div className="flex min-w-0 flex-[0.5_1_10rem] shrink-0 items-center justify-end gap-1.5">
                    <ControlRail className="h-[60px] min-w-0 flex-1 gap-1.5 px-2 py-1.5">
                        <ControlRailSection className="h-full min-w-[130px] flex-1 gap-2 pl-2 pr-1.5">
                            <div className="flex items-center gap-2 w-full mt-1.5">
                                <ClearSearchField
                                    value={recursosSearch}
                                    onValueChange={setRecursosSearch}
                                    placeholder="Buscar recurso..."
                                    containerClassName="min-w-0 flex-1 rounded-[0.9rem] border border-white/16 bg-white shadow-[inset_2px_2px_6px_rgba(15,23,42,0.12),inset_-2px_-2px_6px_rgba(255,255,255,0.75)]"
                                    inputClassName="w-full bg-transparent py-1.5 pl-9 pr-8 text-[11px] font-bold text-zinc-800 outline-none placeholder:text-zinc-400"
                                    searchIconClassName="h-3 w-3 text-zinc-500 group-focus-within:text-[#F39200]"
                                    clearButtonClassName="text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
                                />
                            </div>
                        </ControlRailSection>
                        <ControlRailDivider className="h-7" />
                        <ControlRailSection className="h-full min-w-0 flex-none items-center justify-end gap-1.5 pl-2 pr-2">
                        {recursosStateDirty ? (
                            <button
                                type="button"
                                onClick={onSaveState}
                                disabled={recursosStateSaving}
                                className="inline-flex h-8 items-center justify-center rounded-[0.8rem] bg-[#0B5C7A] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(11,92,122,0.18)] transition hover:bg-[#084862] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {recursosStateSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Save className="mr-1.5 h-3.5 w-3.5" />}
                                Guardar
                            </button>
                        ) : null}
                        {persistedLevelingProposal ? (
                            <>
                                {persistedLevelingProposal?.status !== 'approved' ? (
                                    <button
                                        type="button"
                                        onClick={onApproveLevelingProposal}
                                        disabled={recursosStateSaving}
                                        className="inline-flex h-8 items-center justify-center rounded-[0.8rem] bg-emerald-700 px-3 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-[0_10px_24px_rgba(4,120,87,0.18)] transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {recursosStateSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                                        Aprobar propuesta
                                    </button>
                                ) : null}
                                <button
                                    type="button"
                                    onClick={onClearLevelingProposal}
                                    disabled={recursosStateSaving}
                                    className="inline-flex h-8 items-center justify-center rounded-[0.8rem] border border-white/8 bg-[#15181d] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-red-400 transition hover:border-red-400/20"
                                >
                                    <X className="mr-1.5 h-3.5 w-3.5" />
                                    Descartar propuesta
                                </button>
                            </>
                        ) : null}
                        <ControlRailDivider className="h-6 mx-1" />
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={recursosStateSaving}
                            className="inline-flex h-8 items-center justify-center rounded-[0.8rem] border border-white/8 bg-[#15181d] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-white/80 transition hover:border-white/14 hover:bg-[#1b1f25] hover:text-white"
                        >
                            <TimerReset className="mr-1.5 h-3.5 w-3.5" />
                            Actualizar
                        </button>
                    </ControlRailSection>
                </ControlRail>
                </div>
            </div>
            {stateError ? (
                <div className="mb-3 rounded-[0.9rem] border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-900">
                    {stateError}
                </div>
            ) : null}

            <div className="bg-white border border-zinc-200 rounded-[1rem] p-1.5 flex flex-col gap-1.5 flex-shrink-0 shadow-[0_4px_14px_rgba(0,0,0,0.02)]">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2">
                    <div className="flex gap-2 items-center overflow-x-auto flex-1 justify-start">
                        {CATEGORIAS_RECURSOS.map(cat => {
                            const count = categoryCounts[cat.id] || 0;
                            return (
                                <button
                                    key={cat.id}
                                    onClick={() => { setSelectedCat(cat.id); setSelectedSubcatId(null); }}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border ${selectedCat === cat.id ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white hover:bg-zinc-50 text-zinc-500 border-zinc-200 shadow-sm'}`}
                                >
                                    <span className={`text-base ${selectedCat === cat.id ? '' : 'grayscale opacity-50'} ${cat.color} transition-all`}>{cat.icon}</span>
                                    <div className="flex flex-col items-start leading-none">
                                        <span>{cat.nombre}</span>
                                        <span className="text-[7px] mt-0.5 text-zinc-400">{count} recursos</span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto justify-end pr-1">
                        {(levelingSimulation.moves.length > 0 || levelingSimulation.unresolved.length > 0) ? (
                            <>
                                {levelingSimulation.moves.slice(0, 2).map((move, index) => (
                                    <div key={`m-${index}`} className="flex items-center gap-1.5 rounded-full border border-sky-100 bg-sky-50 px-2 py-1 whitespace-nowrap">
                                        <p className="max-w-[120px] truncate text-[10px] font-black text-zinc-950">{move.recurso}</p>
                                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-sky-700">
                                            {move.sourcePeriod} {'->'} {move.targetPeriod} ({formatNumber(move.quantity, decCalculos)})
                                        </p>
                                    </div>
                                ))}
                                {levelingSimulation.unresolved.slice(0, 2).map((item, index) => (
                                    <div key={`u-${index}`} className="flex items-center gap-1.5 rounded-full border border-red-100 bg-red-50 px-2 py-1 whitespace-nowrap">
                                        <p className="max-w-[120px] truncate text-[10px] font-black text-zinc-950">{item.recurso}</p>
                                        <p className="text-[9px] font-black uppercase tracking-[0.12em] text-red-700">
                                            {item.period} · PEND {formatNumber(item.quantity, decCalculos)}
                                        </p>
                                    </div>
                                ))}
                                <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-sky-700 whitespace-nowrap">
                                    Total: {formatNumber(levelingSimulation.affectedResources, 0)} rec
                                </span>
                            </>
                        ) : applicationPreview ? (
                            <>
                                <div className="flex items-center gap-2 rounded-full border border-zinc-100 bg-zinc-50 px-2.5 py-1 whitespace-nowrap">
                                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400">Mov:</p>
                                    <p className="text-[9px] font-black text-zinc-950">{formatNumber(applicationPreview.movesCount, 0)}</p>
                                    <p className="text-[8px] font-black uppercase tracking-[0.16em] text-zinc-400 ml-1">Rec:</p>
                                    <p className="text-[9px] font-black text-zinc-950">{formatNumber(applicationPreview.affectedResources, 0)}</p>
                                </div>
                                <span className={`rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] whitespace-nowrap ${applicationPreview.hasPendingCapacity ? 'border-amber-100 bg-amber-50 text-amber-700' : 'border-emerald-100 bg-emerald-50 text-emerald-700'}`}>
                                    {applicationPreview.hasPendingCapacity ? 'Con pendientes' : 'Lista revisión'}
                                </span>
                                {levelingApplicationIntent && (
                                    <span className="rounded-full border border-sky-100 bg-sky-50 px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-sky-700 whitespace-nowrap">
                                        {levelingApplicationResult ? 'Aplicada' : 'Intención'}
                                    </span>
                                )}
                                {levelingApplicationResult ? (
                                    <button
                                        type="button"
                                        onClick={onRollbackLevelingApplication}
                                        disabled={recursosStateSaving}
                                        className={`${CRONOGRAMA_SOFT_ACTION_BUTTON} h-8 rounded-[0.8rem] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-red-600 whitespace-nowrap`}
                                    >
                                        <TimerReset className="mr-1.5 h-3.5 w-3.5" />
                                        Revertir
                                    </button>
                                ) : levelingApplicationIntent ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={onApplyLevelingApplication}
                                            disabled={recursosStateSaving}
                                            className="inline-flex h-8 shrink-0 items-center justify-center rounded-[0.8rem] bg-emerald-700 px-3 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                                        >
                                            {recursosStateSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                                            Aplicar
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onCancelLevelingApplication}
                                            disabled={recursosStateSaving}
                                            className={`${CRONOGRAMA_SOFT_ACTION_BUTTON} h-8 rounded-[0.8rem] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-red-600 whitespace-nowrap`}
                                        >
                                            <X className="mr-1.5 h-3.5 w-3.5" />
                                            Cancelar
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={onRequestLevelingApplication}
                                        disabled={recursosStateSaving}
                                        className="inline-flex h-8 shrink-0 items-center justify-center rounded-[0.8rem] bg-[#0B5C7A] px-3 text-[9px] font-black uppercase tracking-[0.14em] text-white shadow-sm transition hover:bg-[#084862] disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap"
                                    >
                                        {recursosStateSaving ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                                        Preparar aplicación
                                    </button>
                                )}
                            </>
                        ) : null}
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden min-h-0 gap-3">
                <div className="w-72 bg-white border border-zinc-200 rounded-[1rem] flex flex-col h-full flex-shrink-0 shadow-[0_10px_30px_rgba(15,23,42,0.03)]">
                    <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
                        <h3 className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Subcategorías</h3>
                    </div>
                    <div className="px-3 pt-3">
                        <ClearSearchField
                            value={searchSubcategories || ''}
                            onValueChange={setSearchSubcategories}
                            placeholder="Filtrar subcategorías..."
                            searchIconClassName="h-3.5 w-3.5"
                            inputClassName="w-full pl-10 pr-10 h-10 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-[11px] font-bold text-zinc-700 focus:outline-none focus:border-[#F39200] focus:ring-1 focus:ring-[#F39200] transition-all"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
                        {subcategoriesOfActiveCat.length === 0 ? (
                            <div className="text-center py-10 px-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                                <p className="text-[9px] font-bold text-zinc-400 uppercase leading-tight italic">Sin subcategorías</p>
                            </div>
                        ) : filteredSubcategories.length === 0 ? (
                            <div className="text-center py-10 px-4 bg-zinc-50 rounded-xl border border-dashed border-zinc-100">
                                <p className="text-[9px] font-bold text-zinc-400 uppercase italic">Sin coincidencias</p>
                            </div>
                        ) : (
                            filteredSubcategories.map(sub => (
                                <button
                                    key={sub.name}
                                    onClick={() => setSelectedSubcatId(selectedSubcatId === sub.name ? null : sub.name)}
                                    className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${selectedSubcatId === sub.name ? 'bg-zinc-900 text-white border-zinc-900 shadow-md' : 'bg-white hover:bg-zinc-50 text-zinc-700 border-zinc-200'}`}
                                >
                                    <div className="text-left min-w-0 flex-1">
                                        <p className="text-[11px] font-black uppercase tracking-tight leading-snug truncate">
                                            {normalizeSubcategoryDisplay(sub.name)}
                                        </p>
                                        <p className={`mt-1 text-[9px] font-bold uppercase tracking-[0.14em] ${selectedSubcatId === sub.name ? 'text-white/70' : 'text-zinc-400'}`}>
                                            {sub.count} recursos
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-3.5 h-3.5 shrink-0 transition-transform ${selectedSubcatId === sub.name ? 'rotate-90 text-white' : 'text-zinc-400'}`} />
                                </button>
                            ))
                        )}
                    </div>
                </div>

                <section className="custom-scrollbar min-h-0 flex-1 overflow-auto rounded-[1rem] border border-zinc-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.04)]">
                    {categoryGroups.length === 0 ? (
                        <div className="m-4 rounded-[1rem] border border-zinc-100 bg-zinc-50 px-4 py-6 text-sm font-semibold text-zinc-500">
                            {selectedSubcatId
                                ? "No hay recursos consolidados en la subcategoría seleccionada."
                                : "No hay recursos consolidados para la categoría seleccionada."}
                        </div>
                    ) : categoryGroups.map((category) => (
                        <div key={`${category.id}-${category.label}`} className="border-b border-zinc-200 px-4 py-4 last:border-b-0">
                            <div className="space-y-3">
                                {category.subcategories.map((subcategory) => (
                                    <div key={`${category.id}-${subcategory.label}`} className="overflow-hidden rounded-[0.85rem] border border-zinc-200 bg-zinc-50">
                                        <div className="flex flex-col gap-1 border-b border-zinc-200 bg-white px-3 py-2 md:flex-row md:items-center md:justify-between">
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.16em] text-zinc-400">Subcategoria</p>
                                                <h5 className="text-sm font-black text-zinc-900">{subcategory.label}</h5>
                                            </div>
                                            <p className="text-xs font-black text-zinc-600">{formatCurrency(subcategory.totalCost, currency, decMoneda)}</p>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <div className="min-w-[62rem]">
                                                <div className="grid border-b border-zinc-200 bg-zinc-100 pl-[18rem]" style={periodGridStyle}>
                                                    {periodos.map((periodo) => (
                                                        <div key={`${category.id}-${subcategory.label}-${periodo.periodo_id}-head`} className="border-l border-zinc-200 px-2 py-1.5">
                                                            <p className="truncate text-[9px] font-black uppercase tracking-[0.12em] text-zinc-500">{periodo.label}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="divide-y divide-zinc-200">
                                                    {subcategory.rows.map((row) => (
                                                        <div key={row.recurso_id} className="grid bg-white hover:bg-zinc-50/40 transition-colors" style={{ gridTemplateColumns: '16rem minmax(44rem, 1fr)' }}>
                                                            <div className="border-r border-zinc-200 px-3 py-2 flex flex-col justify-between">
                                                                <div>
                                                                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                                                                        <CodeColorizer code={row.codigo} className="text-[8px] bg-white px-1.5 py-0.5 rounded border border-zinc-100 shadow-sm" />
                                                                        <span className="text-[8px] font-black uppercase text-zinc-400">Und: {row.unidad || '-'}</span>
                                                                    </div>
                                                                    <h6 className="line-clamp-2 text-[11px] font-black tracking-tight leading-snug text-zinc-800">
                                                                        {normalizeDescriptionCapitalization(row.recurso || 'Recurso sin descripcion')}
                                                                    </h6>
                                                                </div>
                                                                <div className="mt-1 pt-1.5 border-t border-zinc-100/80 flex items-center justify-between">
                                                                    <span className="text-[8px] font-bold text-zinc-500">
                                                                        Cant: <span className="font-black text-zinc-700">{formatNumber(row.cantidad_total || 0, decCalculos)}</span>
                                                                    </span>
                                                                    <span className="text-[9px] font-black text-emerald-600">
                                                                        {formatCurrency(row.costo_total || 0, currency, decMoneda)}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            <div className="grid" style={periodGridStyle}>
                                                            {(row.periodos || []).map((periodo) => {
                                                                const capacityStatus = getPeriodCapacityStatus(row.recurso_id, periodo.periodo_id, periodo.cantidad);
                                                                return (
                                                                <div key={`${row.recurso_id}-${periodo.periodo_id}`} className={`border-l border-zinc-200 px-1.5 py-1.5 ${capacityStatus.overloaded ? 'bg-red-50' : Number(periodo.cantidad || 0) > 0 ? 'bg-white' : 'bg-zinc-50/80'}`}>
                                                                    <div className="flex items-center justify-between gap-1">
                                                                        <span className={`truncate text-[8px] font-black uppercase tracking-[0.12em] ${capacityStatus.overloaded ? 'text-red-600' : 'text-zinc-400'}`}>Cant.</span>
                                                                        <span className={`text-[9px] font-black ${capacityStatus.overloaded ? 'text-red-700' : 'text-zinc-900'}`}>{formatNumber(periodo.cantidad || 0, decCalculos)}</span>
                                                                    </div>
                                                                    <div className="mt-0.5 flex items-center justify-between gap-1">
                                                                        <p className="text-[10px] font-black text-emerald-700">{formatCurrency(periodo.costo || 0, currency, decMoneda)}</p>
                                                                        {capacityStatus.overloaded ? (
                                                                            <p className="text-[9px] font-black text-red-700 truncate">
                                                                                Exceso {formatNumber(capacityStatus.excess, decCalculos)}
                                                                            </p>
                                                                        ) : null}
                                                                    </div>
                                                                    <div className="mt-1 flex items-center gap-1.5">
                                                                        <AppHint
                                                                            maxWidth={380}
                                                                            content={
                                                                                <div className="flex flex-col gap-2 p-1 text-[11px] leading-relaxed">
                                                                                    <p>
                                                                                        <strong>&quot;Cap.&quot;</strong> significa Capacidad (o Límite de Capacidad / Capacidad Máxima) asignada a ese recurso en ese período específico.
                                                                                    </p>
                                                                                    <p className="opacity-90">Funciona de la siguiente manera dentro del sistema:</p>
                                                                                    <ul className="list-disc pl-4 flex flex-col gap-1.5 opacity-90">
                                                                                        <li>
                                                                                            <strong className="opacity-100">Límite Operativo:</strong> Representa la cantidad máxima de ese recurso que tienes disponible o permitida para trabajar en dicho período (por ejemplo, el número máximo de horas de una cuadrilla o volumen de materiales).
                                                                                        </li>
                                                                                        <li>
                                                                                            <strong className="opacity-100">Detección de Sobrecarga:</strong> Si la cantidad requerida por la planificación (&quot;Cant.&quot;) supera el valor ingresado en &quot;Cap.&quot;, el sistema marcará la celda en rojo, indicando un Exceso (sobrecarga).
                                                                                        </li>
                                                                                        <li>
                                                                                            <strong className="opacity-100">Motor de Nivelación:</strong> Este límite es el parámetro que utiliza el motor automático para calcular la Simulación de Nivelación. Cuando hay un exceso, la nivelación intenta desplazar la carga de trabajo a períodos futuros que tengan capacidad disponible (donde la cantidad esté por debajo del límite de capacidad).
                                                                                        </li>
                                                                                    </ul>
                                                                                </div>
                                                                            }
                                                                        >
                                                                            <span className="text-[8px] font-black uppercase tracking-[0.12em] text-zinc-400 cursor-help border-b border-dotted border-zinc-400 hover:text-sky-600 hover:border-sky-600 transition-colors">
                                                                                Cap.
                                                                            </span>
                                                                        </AppHint>
                                                                        <input
                                                                            type="number"
                                                                            min="0"
                                                                            step="0.0001"
                                                                            value={getManualLimitValue(row.recurso_id, periodo.periodo_id)}
                                                                            onChange={(event) => onLimitChange(row.recurso_id, periodo.periodo_id, event.target.value)}
                                                                            disabled={recursosStateSaving}
                                                                            title="Ingresa la capacidad máxima disponible"
                                                                            className="h-5 min-w-0 flex-1 rounded-[0.4rem] border border-zinc-200 bg-white px-1.5 text-[9px] font-black text-zinc-800 outline-none transition focus:border-sky-300 disabled:cursor-not-allowed disabled:opacity-60"
                                                                        />
                                                                    </div>
                                                                </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </section>
            </div>
        </div>
    );
};

const resolveApiErrorMessage = (error, fallback) => {
    const detail = error?.response?.data?.detail;
    if (typeof detail === 'string' && detail.trim()) return detail;
    if (detail && typeof detail === 'object') {
        if (detail.code === 'apu_resources_incomplete') {
            const totalIssues = Number(detail.total_issues || detail.issues?.length || 0);
            const issuePreview = Array.isArray(detail.issues)
                ? detail.issues.slice(0, 3).map((issue) => {
                    const code = issue.codigo_item || issue.apu_codigo || issue.linea_presupuesto_id || 'linea';
                    const description = issue.descripcion || issue.apu_descripcion || issue.reason || 'APU sin recursos';
                    return `${code}: ${description}`;
                }).filter(Boolean)
                : [];
            const suffix = totalIssues > issuePreview.length
                ? ` y ${totalIssues - issuePreview.length} mas`
                : '';
            const baseMessage = detail.message || 'El presupuesto contiene APUs sin recursos completos.';
            return issuePreview.length > 0
                ? `${baseMessage} Revise ${issuePreview.join('; ')}${suffix}.`
                : baseMessage;
        }
        if (typeof detail.message === 'string' && detail.message.trim()) return detail.message;
        if (typeof detail.detail === 'string' && detail.detail.trim()) return detail.detail;
    }
    return error?.message || fallback;
};

const Cronogramas = ({ project, initialProjectDetail = null }) => {
    const { user, selectedEmpresa } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [detail, setDetail] = useState(null);
    const [budgets, setBudgets] = useState([]);
    const [selectedBudgetDetail, setSelectedBudgetDetail] = useState(null);
    const [edtTree, setEdtTree] = useState([]);
    const [selectedBudgetId, setSelectedBudgetId] = useState('');
    const [scheduleTab, setScheduleTab] = useState('gantt');
    const [ganttDirtyState, setGanttDirtyState] = useState({
        hasChanges: false,
        pendingRows: 0,
        pendingPersistedRows: 0,
        pendingDraftRows: 0,
    });
    const ganttPanelCollapsed = true;
    const [cronogramaLoading, setCronogramaLoading] = useState(false);
    const [cronograma, setCronograma] = useState(null);
    const [cronogramaValoradoError, setCronogramaValoradoError] = useState('');
    const [cronogramaRecursos, setCronogramaRecursos] = useState(null);
    const [cronogramaRecursosState, setCronogramaRecursosState] = useState(null);
    const [cronogramaRecursosStateDraft, setCronogramaRecursosStateDraft] = useState({});
    const [cronogramaRecursosStateDirty, setCronogramaRecursosStateDirty] = useState(false);
    const [cronogramaRecursosStateSaving, setCronogramaRecursosStateSaving] = useState(false);
    const [cronogramaRecursosLoading, setCronogramaRecursosLoading] = useState(false);
    const [cronogramaRecursosError, setCronogramaRecursosError] = useState('');
    const [cronogramaRecursosStateError, setCronogramaRecursosStateError] = useState('');
    const [cronogramaTrabajoLoading, setCronogramaTrabajoLoading] = useState(false);
    const [cronogramaTrabajo, setCronogramaTrabajo] = useState(null);
    const [cronogramaTrabajoError, setCronogramaTrabajoError] = useState('');
    const ganttFullMetadataLineIdsRef = useRef(new Set());
    const [ganttDraft, setGanttDraft] = useState(null);
    const [ganttDraftLoading, setGanttDraftLoading] = useState(false);
    const [ganttDraftError, setGanttDraftError] = useState('');
    const [ganttEditLock, setGanttEditLock] = useState(null);
    const [ganttEditLockLoading, setGanttEditLockLoading] = useState(false);
    const [ganttEditLockError, setGanttEditLockError] = useState('');
    const applyCronogramaTrabajoUpdate = useCallback((updated) => {
        setCronogramaTrabajo((previous) => reuseStableCronogramaTrabajoResponse(previous, updated));
    }, []);

    const applyCronogramaTrabajoDeltaUpdate = useCallback((delta) => {
        setCronogramaTrabajo((previous) => mergeCronogramaTrabajoDeltaResponse(previous, delta));
    }, []);
    const [resettingCronogramas, setResettingCronogramas] = useState(false);
    const [ganttBudgetResolving, setGanttBudgetResolving] = useState(false);
    const [configState, setConfigState] = useState({
        periodType: 'mensual',
        distributionMode: 'gantt',
        globalDistribution: [],
    });
    const [configSaving, setConfigSaving] = useState(false);
    const [trabajoSaving, setTrabajoSaving] = useState(false);
    const deferredValoradoSyncTimerRef = useRef(null);
    const [editingCell, setEditingCell] = useState(null);
    const [selectedRowIds, setSelectedRowIds] = useState(new Set());
    const [clipboardDistribution, setClipboardDistribution] = useState(null);
    const [_lineBusyId, setLineBusyId] = useState(null);
    const [reportPreview, setReportPreview] = useState(null);
    const [showReportPreview, setShowReportPreview] = useState(false);
    const [loadingReportPreview, setLoadingReportPreview] = useState(false);
    const [generatingReport, setGeneratingReport] = useState(false);
    const [ganttReportMenuOpen, setGanttReportMenuOpen] = useState(false);
    const [valoradoReportMenuOpen, setValoradoReportMenuOpen] = useState(false);
    const [recursosReportMenuOpen, setRecursosReportMenuOpen] = useState(false);
    const [resourceRangeModalOpen, setResourceRangeModalOpen] = useState(false);
    const [resourceRangeDraft, setResourceRangeDraft] = useState({ date_start: '', date_end: '' });
    const [classicPrintTarget, setClassicPrintTarget] = useState(null);
    const [ganttPrintSnapshot, setGanttPrintSnapshot] = useState(null);
    const [valoradoReportTab, setValoradoReportTab] = useState('porcentajes');
    const ganttReportMenuRef = useRef(null);
    const valoradoReportMenuRef = useRef(null);
    const recursosReportMenuRef = useRef(null);
    const periodTypeButtonRef = useRef(null);
    const distributionModeButtonRef = useRef(null);
    const [periodTypeMenuOpen, setPeriodTypeMenuOpen] = useState(false);
    const [distributionModeMenuOpen, setDistributionModeMenuOpen] = useState(false);
    const [periodTypeMenuStyle, setPeriodTypeMenuStyle] = useState(null);
    const [distributionModeMenuStyle, setDistributionModeMenuStyle] = useState(null);
    const distributionSum = useMemo(
        () => sumCronogramaDistribution(configState.globalDistribution || [], 2),
        [configState.globalDistribution],
    );
    const ganttDraftPendingCount = useMemo(() => (
        Array.isArray(ganttDraft?.intentions)
            ? ganttDraft.intentions.filter((item) => item?.status === 'pending').length
            : 0
    ), [ganttDraft?.intentions]);
    const ganttDraftInvalidatedCount = useMemo(() => (
        Array.isArray(ganttDraft?.intentions)
            ? ganttDraft.intentions.filter((item) => item?.status === 'invalidated').length
            : 0
    ), [ganttDraft?.intentions]);
    const ganttDraftAdjustmentRequiredCount = useMemo(() => (
        Array.isArray(ganttDraft?.intentions)
            ? ganttDraft.intentions.filter((item) => item?.status === 'adjustment_required').length
            : 0
    ), [ganttDraft?.intentions]);
    const currentUserId = user?.id ?? user?.usuario_id ?? null;
    const ganttLockReleaseRequested = Boolean(ganttEditLock?.requested_release_by_user_id);
    const ganttLockOwnedByCurrentUser = Boolean(
        ganttEditLock?.status === 'active'
        && currentUserId !== null
        && String(ganttEditLock?.locked_by_user_id ?? '') === String(currentUserId)
    );

    const displayRows = useMemo(
        () => buildDisplayRows(selectedBudgetDetail?.detalle, cronograma?.rows || [], selectedBudgetDetail?.edt_tree),
        [selectedBudgetDetail?.detalle, selectedBudgetDetail?.edt_tree, cronograma?.rows],
    );
    const trabajoDisplayRows = useMemo(
        () => buildDisplayRows(selectedBudgetDetail?.detalle, cronogramaTrabajo?.rows || [], selectedBudgetDetail?.edt_tree),
        [selectedBudgetDetail?.detalle, selectedBudgetDetail?.edt_tree, cronogramaTrabajo?.rows],
    );

    const empId = project?.empresa_id || selectedEmpresa?.id || user?.empresa_id || null;
    const resolvedBudgetId = useMemo(() => {
        const normalizeCandidate = (value) => {
            if (value === null || value === undefined) return '';
            const normalized = String(value).trim();
            return normalized || '';
        };

        const knownBudgetIds = new Set((budgets || []).map((budget) => normalizeCandidate(budget?.id)).filter(Boolean));
        const persistedCandidates = [
            selectedBudgetDetail?.id,
            cronogramaTrabajo?.presupuesto_id,
            cronograma?.presupuesto_id,
        ]
            .map(normalizeCandidate)
            .filter(Boolean);

        const normalizedSelectedBudgetId = normalizeCandidate(selectedBudgetId);
        if (normalizedSelectedBudgetId) {
            if (knownBudgetIds.has(normalizedSelectedBudgetId) || persistedCandidates.includes(normalizedSelectedBudgetId)) {
                return normalizedSelectedBudgetId;
            }
        }

        const fallbackCandidate = [...persistedCandidates, normalizeCandidate(budgets[0]?.id)].find(Boolean);
        return fallbackCandidate || '';
    }, [budgets, cronograma?.presupuesto_id, cronogramaTrabajo?.presupuesto_id, selectedBudgetDetail?.id, selectedBudgetId]);
    const selectedBudget = useMemo(
        () => {
            const resolvedId = resolvedBudgetId;
            if (!resolvedId) return null;
            const existingBudget = budgets.find((budget) => String(budget.id) === resolvedId);
            if (existingBudget) return existingBudget;
            return {
                id: Number(resolvedId) || resolvedId,
                descripcion:
                    selectedBudgetDetail?.descripcion
                    || cronogramaTrabajo?.summary?.presupuesto_descripcion
                    || cronograma?.summary?.presupuesto_descripcion
                    || `Presupuesto ${resolvedId}`,
                revision:
                    selectedBudgetDetail?.revision
                    ?? cronogramaTrabajo?.revision
                    ?? cronograma?.revision
                    ?? project?.revision
                    ?? 0,
            };
        },
        [
            budgets,
            cronograma?.revision,
            cronograma?.summary?.presupuesto_descripcion,
            cronogramaTrabajo?.revision,
            cronogramaTrabajo?.summary?.presupuesto_descripcion,
            resolvedBudgetId,
            project?.revision,
            selectedBudgetDetail?.descripcion,
            selectedBudgetDetail?.revision,
        ],
    );
    const effectiveGanttDetail = useMemo(() => {
        if (detail) return detail;
        if (!project && !cronogramaTrabajo) return null;
        return {
            ...detail,
            fecha_inicio: detail?.fecha_inicio || cronogramaTrabajo?.fecha_inicio || project?.fecha_inicio || null,
            fecha_finalizacion: detail?.fecha_finalizacion || cronogramaTrabajo?.fecha_fin || project?.fecha_fin_estimada || null,
        };
    }, [
        cronogramaTrabajo?.fecha_fin,
        cronogramaTrabajo?.fecha_inicio,
        detail,
        project?.fecha_fin_estimada,
        project?.fecha_inicio,
        project,
    ]);
    const hasGanttBudgetContext = Boolean(resolvedBudgetId || selectedBudget);
    const ganttReadyToMount = Boolean(project && hasGanttBudgetContext);
    const ganttBootstrapping = resolveEffectiveGanttBootstrapState({
        scheduleTab,
        project,
        projectId: project?.id,
        resolvedBudgetId,
        ganttBudgetResolving,
        cronogramaTrabajoLoading,
        cronogramaTrabajo,
        cronogramaTrabajoError,
    });
    const ganttBlockingMessage = useMemo(() => {
        if (!project) {
            return 'El proyecto aún no está resuelto para abrir el Gantt.';
        }
        if (!hasGanttBudgetContext) {
            return 'No se pudo resolver el presupuesto operativo del cronograma.';
        }
        return 'El cronograma aún no tiene el contexto mínimo resuelto para abrir el Gantt con seguridad.';
    }, [hasGanttBudgetContext, project]);

    useEffect(() => {
        if (!ganttReportMenuOpen && !valoradoReportMenuOpen && !recursosReportMenuOpen) return undefined;
        const handlePointerDownOutside = (event) => {
            if (ganttReportMenuRef.current?.contains(event.target)) return;
            if (valoradoReportMenuRef.current?.contains(event.target)) return;
            if (recursosReportMenuRef.current?.contains(event.target)) return;
            setGanttReportMenuOpen(false);
            setValoradoReportMenuOpen(false);
            setRecursosReportMenuOpen(false);
        };
        document.addEventListener('pointerdown', handlePointerDownOutside, true);
        return () => document.removeEventListener('pointerdown', handlePointerDownOutside, true);
    }, [ganttReportMenuOpen, recursosReportMenuOpen, valoradoReportMenuOpen]);

    const buildDropdownPosition = useCallback((anchor) => {
        if (!anchor) return null;
        const rect = anchor.getBoundingClientRect();
        return {
            position: 'absolute',
            top: `${rect.bottom + window.scrollY + 8}px`,
            left: `${rect.left + window.scrollX}px`,
            zIndex: 260,
        };
    }, []);

    useEffect(() => {
        if (!periodTypeMenuOpen && !distributionModeMenuOpen) return undefined;

        const updateMenus = () => {
            if (periodTypeMenuOpen) {
                setPeriodTypeMenuStyle(buildDropdownPosition(periodTypeButtonRef.current));
            }
            if (distributionModeMenuOpen) {
                setDistributionModeMenuStyle(buildDropdownPosition(distributionModeButtonRef.current));
            }
        };

        const handlePointerDownOutside = (event) => {
            if (periodTypeButtonRef.current?.contains(event.target)) return;
            if (distributionModeButtonRef.current?.contains(event.target)) return;
            setPeriodTypeMenuOpen(false);
            setDistributionModeMenuOpen(false);
        };

        updateMenus();
        window.addEventListener('resize', updateMenus);
        window.addEventListener('scroll', updateMenus, true);
        document.addEventListener('pointerdown', handlePointerDownOutside, true);
        return () => {
            window.removeEventListener('resize', updateMenus);
            window.removeEventListener('scroll', updateMenus, true);
            document.removeEventListener('pointerdown', handlePointerDownOutside, true);
        };
    }, [buildDropdownPosition, distributionModeMenuOpen, periodTypeMenuOpen]);

    useEffect(() => {
        if (!resolvedBudgetId || String(selectedBudgetId || '') === String(resolvedBudgetId)) return;
        setSelectedBudgetId(String(resolvedBudgetId));
    }, [resolvedBudgetId, selectedBudgetId]);

    useEffect(() => {
        if (scheduleTab === 'trabajo') {
            setScheduleTab('gantt');
        }
    }, [scheduleTab]);

    useEffect(() => {
        setGanttReportMenuOpen(false);
        setValoradoReportMenuOpen(false);
        setRecursosReportMenuOpen(false);
    }, [scheduleTab]);


    const resolveCronogramaReportVariant = useCallback(() => {
        if (scheduleTab === 'gantt') return 'gantt';
        if (valoradoReportTab === 'flujo_caja') return 'cash_flow';
        if (valoradoReportTab === 'curva_s') return 'integrado';
        return 'valorado';
    }, [scheduleTab, valoradoReportTab]);

    const resolveCronogramaReportVariantLabel = useCallback((variant) => {
        if (variant === 'gantt') return 'Cronograma Gantt';
        if (variant === 'cash_flow') return 'Flujo de Caja';
        if (variant === 'integrado') return 'Cronograma Integrado';
        if (variant === 'pareto') return 'Pareto Temporal';
        if (variant === 'resources_range' || variant === 'resource_usage_range' || variant === 'uso_recursos_rango') return 'Uso de Recursos por Rango';
        if (variant === 'resources' || variant === 'resource_usage' || variant === 'uso_recursos' || variant === 'uso_de_recursos') return 'Uso de Recursos';
        return 'Cronograma Valorado';
    }, []);

    const resolveCronogramaReportLabel = useCallback(() => {
        return resolveCronogramaReportVariantLabel(resolveCronogramaReportVariant());
    }, [resolveCronogramaReportVariant, resolveCronogramaReportVariantLabel]);

    const buildCronogramaValoradoReportFilename = useCallback((extension, variantOverride = null) => buildReportFileName({
        reportLabel: resolveCronogramaReportVariantLabel(variantOverride || resolveCronogramaReportVariant()),
        contextLabel: sanitizeReportContext(project?.nombre || selectedBudget?.descripcion || 'Cronograma', 'Cronograma'),
        revision: selectedBudget?.revision ?? project?.revision ?? 0,
        extension,
    }), [project?.nombre, project?.revision, resolveCronogramaReportVariant, resolveCronogramaReportVariantLabel, selectedBudget?.descripcion, selectedBudget?.revision]);

    const buildPrintProjectContext = useCallback(() => ({
        ...project,
        nombre: project?.nombre || selectedBudget?.descripcion || 'Cronograma',
        revision: selectedBudget?.revision ?? project?.revision ?? 0,
    }), [project, selectedBudget?.descripcion, selectedBudget?.revision]);

    const resolveResourceReportDefaultRange = useCallback(() => {
        const periods = Array.isArray(cronograma?.periods) ? cronograma.periods : [];
        const firstPeriod = periods[0] || null;
        const lastPeriod = periods.length ? periods[periods.length - 1] : null;
        return {
            date_start: formatNativeDateInputValue(firstPeriod?.starts_at || detail?.fecha_inicio || cronogramaTrabajo?.fecha_inicio || project?.fecha_inicio),
            date_end: formatNativeDateInputValue(lastPeriod?.ends_at || detail?.fecha_finalizacion || cronogramaTrabajo?.fecha_fin || project?.fecha_fin_estimada),
        };
    }, [
        cronograma?.periods,
        cronogramaTrabajo?.fecha_fin,
        cronogramaTrabajo?.fecha_inicio,
        detail?.fecha_finalizacion,
        detail?.fecha_inicio,
        project?.fecha_fin_estimada,
        project?.fecha_inicio,
    ]);

    const openResourceRangeReportModal = useCallback(() => {
        setResourceRangeDraft(resolveResourceReportDefaultRange());
        setResourceRangeModalOpen(true);
    }, [resolveResourceReportDefaultRange]);

    const buildCurvePrintCronograma = useCallback(() => {
        const periods = cronograma?.periods || [];
        const footer = cronograma?.footer || {};
        const curve = (cronograma?.curve_s?.length ? cronograma.curve_s : buildValoradoCurveFromFooter(periods, footer));
        return {
            ...(cronograma || {}),
            curve_s: curve,
            periods,
        };
    }, [cronograma]);

    const handleGenerateClassicPrint = useCallback(async ({ pageSize, orientation, printMode, rowsPerPage }) => {
        const printTarget = classicPrintTarget;
        try {
            setClassicPrintTarget(null);
            setGeneratingReport(true);
            if (printTarget === 'gantt') {
                await downloadClassicGanttPresentationPdf({
                    snapshot: ganttPrintSnapshot,
                    project: buildPrintProjectContext(),
                    pageSize,
                    orientation,
                    printMode,
                    rowsPerPage,
                });
                return;
            }
            const printCronograma = buildCurvePrintCronograma();
            downloadClassicCurvePdf({
                project: buildPrintProjectContext(),
                cronograma: printCronograma,
                periods: printCronograma.periods || [],
                pageSize,
                orientation,
            });
        } catch (error) {
            globalThis.reportClientError?.('Error preparando lámina de cronogramas:', error);
            appAlert({
                title: 'No se pudo generar el PDF',
                message: error?.message || 'No fue posible generar la lámina técnica del cronograma.',
                tone: 'danger',
            });
        } finally {
            setGeneratingReport(false);
        }
    }, [buildCurvePrintCronograma, buildPrintProjectContext, classicPrintTarget, ganttPrintSnapshot]);

    const reloadCronogramaBudgetDetail = useCallback(async () => {
        if (!resolvedBudgetId) {
            setSelectedBudgetDetail(null);
            return null;
        }
        const budgetData = await presupuestosApi.getById(resolvedBudgetId, empId);
        const nextDetail = budgetData ? { ...budgetData, edt_tree: edtTree } : null;
        setSelectedBudgetDetail(nextDetail);
        return nextDetail;
    }, [edtTree, empId, resolvedBudgetId]);

    const reloadCronogramaValorado = useCallback(async () => {
        if (!resolvedBudgetId) {
            setCronograma(null);
            setCronogramaValoradoError('');
            return null;
        }
        const data = await cronogramasApi.getValorado(resolvedBudgetId, empId);
        setCronograma(data);
        setCronogramaValoradoError('');
        const balancedDistribution = balanceCronogramaDistribution(data.global_distribution || [], { decimals: 2 });
        setConfigState({
            periodType: data.period_type || 'mensual',
            distributionMode: data.distribution_mode || 'gantt',
            globalDistribution: balancedDistribution,
        });
        return data;
    }, [empId, resolvedBudgetId]);

    const reloadCronogramaTrabajo = useCallback(async () => {
        if (!resolvedBudgetId) {
            setCronogramaTrabajo(null);
            setCronogramaTrabajoError('');
            return null;
        }
        const nextTrabajo = await cronogramasApi.getTrabajo(resolvedBudgetId, empId, { compact: true, metadataMode: 'summary' });
        setCronogramaTrabajo(nextTrabajo);
        setCronogramaTrabajoError('');
        ganttFullMetadataLineIdsRef.current = new Set();
        return nextTrabajo;
    }, [empId, resolvedBudgetId]);

    const handleLoadTrabajoLineMetadata = useCallback(async (lineId) => {
        const normalizedLineId = String(lineId || '').trim();
        if (!resolvedBudgetId || !normalizedLineId) return null;
        if (ganttFullMetadataLineIdsRef.current.has(normalizedLineId)) {
            const existingRow = (cronogramaTrabajo?.rows || []).find((row) => (
                String(row?.presupuesto_linea_id ?? row?.linea_id ?? '') === normalizedLineId
            ));
            return existingRow ? { metadata: existingRow.metadata || {} } : null;
        }
        const payload = await cronogramasApi.getTrabajoLineMetadata(resolvedBudgetId, normalizedLineId, empId);
        const metadata = payload?.metadata && typeof payload.metadata === 'object' ? payload.metadata : {};
        setCronogramaTrabajo((previous) => {
            if (!previous || !Array.isArray(previous.rows)) return previous;
            return {
                ...previous,
                rows: previous.rows.map((row) => {
                    const rowId = String(row?.presupuesto_linea_id ?? row?.linea_id ?? '');
                    if (rowId !== normalizedLineId) return row;
                    return {
                        ...row,
                        metadata: {
                            ...(row.metadata || {}),
                            ...metadata,
                            metadata_lazy: false,
                        },
                    };
                }),
            };
        });
        ganttFullMetadataLineIdsRef.current.add(normalizedLineId);
        return payload;
    }, [cronogramaTrabajo?.rows, empId, resolvedBudgetId]);

    const reloadGanttDraft = useCallback(async () => {
        if (!resolvedBudgetId) {
            setGanttDraft(null);
            setGanttDraftError('');
            return null;
        }
        const nextDraft = await cronogramasApi.getTrabajoGanttDraft(resolvedBudgetId, empId);
        setGanttDraft(nextDraft);
        setGanttDraftError('');
        return nextDraft;
    }, [empId, resolvedBudgetId]);

    const handleSaveGanttDraftIntention = useCallback(async (payload) => {
        if (!resolvedBudgetId) return null;
        setTrabajoSaving(true);
        setGanttDraftError('');
        try {
            const updatedDraft = await cronogramasApi.saveTrabajoGanttDraftIntention(resolvedBudgetId, payload, empId);
            setGanttDraft(updatedDraft);
            return updatedDraft;
        } catch (saveError) {
            const message = resolveApiErrorMessage(saveError, 'No fue posible guardar el borrador del Gantt.');
            setGanttDraftError(message);
            throw saveError;
        } finally {
            setTrabajoSaving(false);
        }
    }, [empId, resolvedBudgetId]);

    const handlePreflightGanttDraftApply = useCallback(async () => {
        if (!resolvedBudgetId) return { ok: true, status: 'none', version: 0, issues: [] };
        setGanttDraftError('');
        try {
            return await cronogramasApi.preflightTrabajoGanttDraftApply(
                resolvedBudgetId,
                { expected_version: ganttDraft?.version ?? null },
                empId,
            );
        } catch (preflightError) {
            const message = resolveApiErrorMessage(preflightError, 'No fue posible validar el borrador Gantt antes de aplicar.');
            setGanttDraftError(message);
            throw preflightError;
        }
    }, [empId, ganttDraft?.version, resolvedBudgetId]);

    const handleApplyGanttDraft = useCallback(async (payload = {}) => {
        if (!resolvedBudgetId) return null;
        setGanttDraftError('');
        try {
            const appliedDraft = await cronogramasApi.applyTrabajoGanttDraft(
                resolvedBudgetId,
                {
                    expected_version: ganttDraft?.version ?? null,
                    ...payload,
                },
                empId,
            );
            setGanttDraft(appliedDraft?.status === 'applied' ? null : appliedDraft);
            return appliedDraft;
        } catch (applyError) {
            const message = resolveApiErrorMessage(applyError, 'El cronograma se confirmo, pero no fue posible cerrar el borrador Gantt.');
            setGanttDraftError(message);
            throw applyError;
        }
    }, [empId, ganttDraft?.version, resolvedBudgetId]);

    const handleDiscardInvalidatedGanttDraft = useCallback(async () => {
        if (!resolvedBudgetId || !ganttDraftInvalidatedCount) return null;
        const confirmed = await appConfirm({
            title: 'Descartar lineas invalidadas',
            message: `Se descartaran ${ganttDraftInvalidatedCount} intencion(es) del borrador Gantt que ya no son compatibles con Presupuesto. Las demas intenciones pendientes se conservaran.`,
            confirmLabel: 'Descartar invalidadas',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (!confirmed) return null;
        setTrabajoSaving(true);
        setGanttDraftError('');
        try {
            const updatedDraft = await cronogramasApi.discardInvalidatedTrabajoGanttDraft(
                resolvedBudgetId,
                { expected_version: ganttDraft?.version ?? null },
                empId,
            );
            setGanttDraft(updatedDraft);
            await appAlert({
                title: 'Borrador Gantt actualizado',
                message: 'Se descartaron las lineas invalidadas y se conservaron las intenciones compatibles.',
                tone: 'success',
            });
            return updatedDraft;
        } catch (discardError) {
            const message = resolveApiErrorMessage(discardError, 'No fue posible descartar las lineas invalidadas del borrador Gantt.');
            setGanttDraftError(message);
            throw discardError;
        } finally {
            setTrabajoSaving(false);
        }
    }, [empId, ganttDraft?.version, ganttDraftInvalidatedCount, resolvedBudgetId]);

    const handlePrepareInvalidatedGanttDraftAdjustment = useCallback(async () => {
        if (!resolvedBudgetId || !ganttDraftInvalidatedCount) return null;
        const confirmed = await appConfirm({
            title: 'Reajustar lineas invalidadas',
            message: `Se conservara solo la intencion operativa compatible de ${ganttDraftInvalidatedCount} linea(s). Los valores derivados anteriores se eliminaran y deberas reabrir el editor light para recalcular desde la base vigente antes de aplicar globalmente.`,
            confirmLabel: 'Preparar reajuste',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (!confirmed) return null;
        setTrabajoSaving(true);
        setGanttDraftError('');
        try {
            const updatedDraft = await cronogramasApi.prepareInvalidatedTrabajoGanttDraftAdjustment(
                resolvedBudgetId,
                { expected_version: ganttDraft?.version ?? null },
                empId,
            );
            setGanttDraft(updatedDraft);
            await appAlert({
                title: 'Reajuste preparado',
                message: 'Las lineas invalidadas quedaron pendientes de reabrir y aceptar desde el editor light con la base vigente.',
                tone: 'success',
            });
            return updatedDraft;
        } catch (adjustError) {
            const message = resolveApiErrorMessage(adjustError, 'No fue posible preparar el reajuste de las lineas invalidadas del borrador Gantt.');
            setGanttDraftError(message);
            throw adjustError;
        } finally {
            setTrabajoSaving(false);
        }
    }, [empId, ganttDraft?.version, ganttDraftInvalidatedCount, resolvedBudgetId]);

    const handleAcquireGanttEditLock = useCallback(async () => {
        if (!resolvedBudgetId) return null;
        setGanttEditLockLoading(true);
        setGanttEditLockError('');
        try {
            const nextLock = await cronogramasApi.acquireTrabajoGanttLock(resolvedBudgetId, {}, empId);
            setGanttEditLock(nextLock);
            return nextLock;
        } catch (lockError) {
            const message = resolveApiErrorMessage(lockError, 'No fue posible tomar el bloqueo de edición del Gantt.');
            setGanttEditLockError(message);
            throw lockError;
        } finally {
            setGanttEditLockLoading(false);
        }
    }, [empId, resolvedBudgetId]);

    const handleRequestGanttLockRelease = useCallback(async (payload = {}) => {
        if (!resolvedBudgetId) return null;
        if (!payload?.skipConfirm) {
            const confirmed = await appConfirm({
                title: 'Solicitar liberacion de Gantt',
                message: 'Otro usuario tiene abierto el modo de trabajo del Gantt. Puedes solicitar que lo libere; mientras tanto, la vista permanece en solo lectura.',
                confirmLabel: 'Solicitar liberacion',
                cancelLabel: 'Solo ver',
                tone: 'warning',
            });
            if (!confirmed) return null;
        }
        setGanttEditLockLoading(true);
        try {
            const requestedLock = await cronogramasApi.requestTrabajoGanttLockRelease(
                resolvedBudgetId,
                { message: payload?.message || 'Solicitud de liberacion desde Gantt.' },
                empId,
            );
            setGanttEditLock(requestedLock);
            const ownerName = requestedLock?.locked_by_name || 'el usuario actual';
            setGanttEditLockError(`Solicitud de liberacion enviada a ${ownerName}.`);
            await appAlert({
                title: 'Solicitud enviada',
                message: `Se registro la solicitud para que ${ownerName} libere el Gantt.`,
                tone: 'success',
            });
            return requestedLock;
        } catch (requestError) {
            const message = resolveApiErrorMessage(requestError, 'No fue posible solicitar la liberacion del Gantt.');
            setGanttEditLockError(message);
            throw requestError;
        } finally {
            setGanttEditLockLoading(false);
        }
    }, [empId, resolvedBudgetId]);

    const handleHeartbeatGanttEditLock = useCallback(async () => {
        if (!resolvedBudgetId) return null;
        const nextLock = await cronogramasApi.heartbeatTrabajoGanttLock(resolvedBudgetId, {}, empId);
        setGanttEditLock(nextLock);
        setGanttEditLockError('');
        return nextLock;
    }, [empId, resolvedBudgetId]);

    const handleReleaseGanttEditLock = useCallback(async () => {
        if (!resolvedBudgetId) return null;
        const releasedLock = await cronogramasApi.releaseTrabajoGanttLock(resolvedBudgetId, empId);
        setGanttEditLock(releasedLock);
        setGanttEditLockError('');
        return releasedLock;
    }, [empId, resolvedBudgetId]);

    const reloadCronogramaRecursos = useCallback(async () => {
        if (!resolvedBudgetId) {
            setCronogramaRecursos(null);
            setCronogramaRecursosState(null);
            setCronogramaRecursosStateDraft({});
            setCronogramaRecursosStateDirty(false);
            setCronogramaRecursosError('');
            setCronogramaRecursosStateError('');
            return null;
        }
        const nextRecursos = await cronogramasApi.getRecursos(resolvedBudgetId, empId);
        setCronogramaRecursos(nextRecursos);
        setCronogramaRecursosError('');
        return nextRecursos;
    }, [empId, resolvedBudgetId]);

    const reloadCronogramaRecursosState = useCallback(async () => {
        if (!resolvedBudgetId) {
            setCronogramaRecursosState(null);
            setCronogramaRecursosStateDraft({});
            setCronogramaRecursosStateDirty(false);
            setCronogramaRecursosStateError('');
            return null;
        }
        const nextState = await cronogramasApi.getRecursosState(resolvedBudgetId, empId);
        setCronogramaRecursosState(nextState);
        setCronogramaRecursosStateDraft(nextState?.adjustments || {});
        setCronogramaRecursosStateDirty(false);
        setCronogramaRecursosStateError('');
        return nextState;
    }, [empId, resolvedBudgetId]);

    const previewReloadCronogramaSources = useCallback(async () => {
        if (!resolvedBudgetId) {
            return {
                budgetDetail: null,
                valorado: null,
                trabajo: null,
            };
        }
        const [budgetData, valoradoData, trabajoData] = await Promise.all([
            presupuestosApi.getById(resolvedBudgetId, empId),
            cronogramasApi.getValorado(resolvedBudgetId, empId),
            cronogramasApi.getTrabajo(resolvedBudgetId, empId, { compact: true, metadataMode: 'summary' }),
        ]);
        return {
            budgetDetail: budgetData ? { ...budgetData, edt_tree: edtTree } : null,
            valorado: valoradoData || null,
            trabajo: trabajoData || null,
        };
    }, [edtTree, empId, resolvedBudgetId]);

    const handleReloadCronogramaSources = useCallback(async () => Promise.all([
        reloadCronogramaBudgetDetail(),
        reloadCronogramaValorado(),
        reloadCronogramaTrabajo(),
        reloadGanttDraft(),
    ]), [reloadCronogramaBudgetDetail, reloadCronogramaTrabajo, reloadCronogramaValorado, reloadGanttDraft]);

    const executeFactoryResetCronogramas = useCallback(async () => {
        if (!resolvedBudgetId || !selectedBudget) return null;
        setResettingCronogramas(true);
        try {
            const updated = await cronogramasApi.resetIntegral(resolvedBudgetId, empId);
            if (updated?.cronograma) {
                setCronograma(updated.cronograma);
                setCronogramaValoradoError('');
                setConfigState({
                    periodType: updated.cronograma.period_type || 'mensual',
                    distributionMode: updated.cronograma.distribution_mode || 'gantt',
                    globalDistribution: balanceCronogramaDistribution(updated.cronograma.global_distribution || [], { decimals: 2 }),
                });
            }
            if (updated?.trabajo) {
                setCronogramaTrabajo(updated.trabajo);
                setCronogramaTrabajoError('');
            }
            setCronogramaRecursos(null);
            setCronogramaRecursosState(null);
            setCronogramaRecursosError('');
            setCronogramaRecursosStateError('');
            await appAlert({
                title: 'Cronogramas reseteados',
                message: 'El Valorado, el Gantt y el calendario operativo del proyecto volvieron al estado base y ya se reconstruyeron con las políticas vigentes.',
                tone: 'success',
            });
            return updated;
        } catch (error) {
            globalThis.reportClientError?.('Error reseteando integralmente los cronogramas:', error);
            await appAlert({
                title: 'No se pudo resetear',
                message: resolveApiErrorMessage(error, 'No fue posible restaurar los cronogramas al estado inicial.'),
                tone: 'danger',
            });
            throw error;
        } finally {
            setResettingCronogramas(false);
        }
    }, [empId, resolvedBudgetId, selectedBudget]);

    useEffect(() => {
        let active = true;
        const loadBase = async () => {
            setLoading(true);
            setError('');
            try {
                const rootCode = project.codigo_root || project.codigo;
                const detailPromise = initialProjectDetail
                    ? Promise.resolve(initialProjectDetail)
                    : proyectoDetalleApi.getByRoot(rootCode, empId).catch((detailError) => {
                        globalThis.reportClientError?.('Error loading project detail for cronogramas:', detailError);
                        return rootCode ? { codigo_root: rootCode } : null;
                    });
                const edtPromise = edtApi.getTree(project.id, empId).catch((edtError) => {
                    globalThis.reportClientError?.('Error loading EDT tree for cronogramas:', edtError);
                    return [];
                });
                const budgetPromise = presupuestosApi
                    .getAll({ proyecto_id: project.id, empresa_id: empId })
                    .catch((budgetError) => {
                        globalThis.reportClientError?.('Error loading budget list for cronogramas:', budgetError);
                        return [];
                    });

                const [detailData, edtData, budgetListRaw] = await Promise.all([
                    detailPromise,
                    edtPromise,
                    budgetPromise,
                ]);
                if (!active) return;
                const normalizedBudgetList = Array.isArray(budgetListRaw)
                    ? budgetListRaw
                    : (Array.isArray(budgetListRaw?.data) ? budgetListRaw.data : []);
                let resolvedBudgets = normalizedBudgetList;
                if (resolvedBudgets.length === 0) {
                    try {
                        const fallbackBudgetResponse = await presupuestosApi.getByProyecto(project.id, empId);
                        const fallbackBudgets = Array.isArray(fallbackBudgetResponse?.data) ? fallbackBudgetResponse.data : [];
                        if (fallbackBudgets.length > 0) {
                            resolvedBudgets = fallbackBudgets;
                        }
                    } catch (fallbackBudgetError) {
                        console.warn('No se pudo resolver el presupuesto operativo de fallback para cronogramas:', fallbackBudgetError);
                    }
                }
                const ordered = [...resolvedBudgets].sort((a, b) => (Number(b.revision || 0) - Number(a.revision || 0)) || (Number(b.id || 0) - Number(a.id || 0)));
                setDetail(detailData || (rootCode ? { codigo_root: rootCode } : null));
                setEdtTree(edtData || []);
                setBudgets(ordered);
                setSelectedBudgetId(ordered[0] ? String(ordered[0].id) : '');
            } catch (loadError) {
                globalThis.reportClientError?.('Error cargando cronogramas:', loadError);
                if (active) setError(resolveApiErrorMessage(loadError, 'No fue posible cargar la base del cronograma.'));
            } finally {
                if (active) setLoading(false);
            }
        };

        loadBase();
        return () => { active = false; };
    }, [initialProjectDetail, project.id, project.codigo, project.codigo_root, empId]);

    useEffect(() => {
        let active = true;
        const loadBudgetDetail = async () => {
            if (!resolvedBudgetId) {
                setSelectedBudgetDetail(null);
                return;
            }
            try {
                await reloadCronogramaBudgetDetail();
                if (!active) return;
            } catch (loadError) {
                globalThis.reportClientError?.('Error cargando detalle de presupuesto para cronograma:', loadError);
                if (active) setSelectedBudgetDetail(null);
            }
        };

        loadBudgetDetail();
        return () => { active = false; };
    }, [reloadCronogramaBudgetDetail, resolvedBudgetId]);

    useEffect(() => {
        let active = true;
        const resolveGanttBudgetFallback = async () => {
            if (!shouldAttemptGanttBudgetFallback({ scheduleTab, resolvedBudgetId, projectId: project?.id })) {
                setGanttBudgetResolving(false);
                return;
            }
            setGanttBudgetResolving(true);
            try {
                const fallbackBudgetResponse = await withAsyncTimeout(
                    presupuestosApi.getByProyecto(project.id, empId),
                    12000,
                    'La resolución del presupuesto operativo tardó demasiado.',
                );
                const fallbackBudgets = Array.isArray(fallbackBudgetResponse?.data) ? fallbackBudgetResponse.data : [];
                if (!active) return;
                if (fallbackBudgets.length > 0) {
                    const ordered = [...fallbackBudgets].sort((a, b) => (Number(b.revision || 0) - Number(a.revision || 0)) || (Number(b.id || 0) - Number(a.id || 0)));
                    setBudgets((current) => (current.length > 0 ? current : ordered));
                    setSelectedBudgetId((current) => current || String(ordered[0]?.id || ''));
                }
            } catch (fallbackBudgetError) {
                globalThis.reportClientError?.('Error resolviendo presupuesto operativo fallback para Gantt:', fallbackBudgetError);
            } finally {
                if (active) {
                    setGanttBudgetResolving(false);
                }
            }
        };

        resolveGanttBudgetFallback();
        return () => { active = false; };
    }, [empId, project?.id, resolvedBudgetId, scheduleTab]);

    useEffect(() => {
        let active = true;
        const loadCronograma = async () => {
            if (!resolvedBudgetId) {
                setCronograma(null);
                setCronogramaValoradoError('');
                return;
            }
            setCronogramaLoading(true);
            try {
                await reloadCronogramaValorado();
                if (!active) return;
            } catch (loadError) {
                globalThis.reportClientError?.('Error cargando cronograma valorado:', loadError);
                if (active) {
                    setCronogramaValoradoError(resolveApiErrorMessage(loadError, 'No fue posible cargar el cronograma valorado.'));
                    setCronograma(null);
                }
            } finally {
                if (active) setCronogramaLoading(false);
            }
        };

        loadCronograma();
        return () => { active = false; };
    }, [reloadCronogramaValorado, resolvedBudgetId]);

    useEffect(() => {
        let active = true;
        const loadCronogramaTrabajo = async () => {
            if (!resolvedBudgetId) {
                setCronogramaTrabajo(null);
                setCronogramaTrabajoError('');
                setGanttDraft(null);
                setGanttDraftError('');
                setCronogramaTrabajoLoading(false);
                setGanttDraftLoading(false);
                return;
            }
            setCronogramaTrabajoLoading(true);
            setGanttDraftLoading(true);
            setCronogramaTrabajoError('');
            setGanttDraftError('');
            try {
                await withAsyncTimeout(
                    Promise.all([
                        reloadCronogramaTrabajo(),
                        reloadGanttDraft(),
                    ]),
                    30000,
                    'La carga del cronograma operativo del Gantt tardó demasiado.',
                );
                if (!active) return;
            } catch (loadError) {
                globalThis.reportClientError?.('Error cargando motor operativo Gantt:', loadError);
                const detailMessage = resolveApiErrorMessage(loadError, 'No fue posible cargar el cronograma operativo del Gantt.');
                if (active) {
                    setCronogramaTrabajo(null);
                    setCronogramaTrabajoError(detailMessage);
                    setGanttDraft(null);
                    setGanttDraftError(resolveApiErrorMessage(loadError, 'No fue posible cargar el borrador del Gantt.'));
                }
            } finally {
                if (active) setCronogramaTrabajoLoading(false);
                if (active) setGanttDraftLoading(false);
            }
        };

        loadCronogramaTrabajo();
        return () => { active = false; };
    }, [reloadCronogramaTrabajo, reloadGanttDraft, resolvedBudgetId]);

    useEffect(() => {
        let active = true;
        const loadCronogramaRecursos = async () => {
            if (scheduleTab !== 'recursos') return;
            if (!resolvedBudgetId) {
                setCronogramaRecursos(null);
                setCronogramaRecursosState(null);
                setCronogramaRecursosStateDraft({});
                setCronogramaRecursosStateDirty(false);
                setCronogramaRecursosError('');
                setCronogramaRecursosStateError('');
                setCronogramaRecursosLoading(false);
                return;
            }
            setCronogramaRecursosLoading(true);
            setCronogramaRecursosError('');
            setCronogramaRecursosStateError('');
            try {
                const [resourceResult, stateResult] = await Promise.allSettled([
                    reloadCronogramaRecursos(),
                    reloadCronogramaRecursosState(),
                ]);
                if (!active) return;
                if (resourceResult.status === 'rejected') {
                    throw resourceResult.reason;
                }
                if (stateResult.status === 'rejected') {
                    setCronogramaRecursosState(null);
                    setCronogramaRecursosStateDraft({});
                    setCronogramaRecursosStateDirty(false);
                    setCronogramaRecursosStateError(resolveApiErrorMessage(stateResult.reason, 'No fue posible cargar el estado colaborativo de recursos.'));
                }
                if (!active) return;
            } catch (loadError) {
                globalThis.reportClientError?.('Error cargando recursos de cronograma:', loadError);
                if (active) {
                    setCronogramaRecursos(null);
                    setCronogramaRecursosError(resolveApiErrorMessage(loadError, 'No fue posible cargar los recursos del cronograma.'));
                }
            } finally {
                if (active) setCronogramaRecursosLoading(false);
            }
        };

        loadCronogramaRecursos();
        return () => { active = false; };
    }, [reloadCronogramaRecursos, reloadCronogramaRecursosState, resolvedBudgetId, scheduleTab]);

    const handleRefreshCronogramaRecursos = useCallback(async () => {
        setCronogramaRecursosLoading(true);
        setCronogramaRecursosStateError('');
        try {
            const [resourceResult, stateResult] = await Promise.allSettled([
                reloadCronogramaRecursos(),
                reloadCronogramaRecursosState(),
            ]);
            if (resourceResult.status === 'rejected') {
                throw resourceResult.reason;
            }
            if (stateResult.status === 'rejected') {
                setCronogramaRecursosState(null);
                setCronogramaRecursosStateDraft({});
                setCronogramaRecursosStateDirty(false);
                setCronogramaRecursosStateError(resolveApiErrorMessage(stateResult.reason, 'No fue posible actualizar el estado colaborativo de recursos.'));
            }
        } catch (refreshError) {
            globalThis.reportClientError?.('Error actualizando recursos de cronograma:', refreshError);
            setCronogramaRecursosError(resolveApiErrorMessage(refreshError, 'No fue posible actualizar los recursos del cronograma.'));
        } finally {
            setCronogramaRecursosLoading(false);
        }
    }, [reloadCronogramaRecursos, reloadCronogramaRecursosState]);

    const handleCronogramaRecursosLimitChange = useCallback((resourceId, periodId, rawValue) => {
        const resourceKey = String(resourceId);
        const periodKey = String(periodId);
        const normalizedValue = String(rawValue ?? '').trim();
        setCronogramaRecursosStateDraft((current) => {
            const next = {
                ...(current || {}),
                manual_limits: {
                    ...((current || {}).manual_limits || {}),
                },
            };
            const resourceLimits = {
                ...(next.manual_limits[resourceKey] || {}),
            };
            if (normalizedValue === '') {
                delete resourceLimits[periodKey];
            } else {
                const numericValue = Number(normalizedValue);
                if (!Number.isFinite(numericValue) || numericValue < 0) {
                    return current || {};
                }
                resourceLimits[periodKey] = numericValue;
            }
            if (Object.keys(resourceLimits).length === 0) {
                delete next.manual_limits[resourceKey];
            } else {
                next.manual_limits[resourceKey] = resourceLimits;
            }
            if (Object.keys(next.manual_limits).length === 0) {
                delete next.manual_limits;
            }
            return next;
        });
        setCronogramaRecursosStateDirty(true);
    }, []);

    const handleResetCronogramaRecursosStateDraft = useCallback(() => {
        setCronogramaRecursosStateDraft(cronogramaRecursosState?.adjustments || {});
        setCronogramaRecursosStateDirty(false);
        setCronogramaRecursosStateError('');
    }, [cronogramaRecursosState?.adjustments]);

    const handleSaveCronogramaRecursosState = useCallback(async () => {
        if (!resolvedBudgetId || !cronogramaRecursosState) return;
        setCronogramaRecursosStateSaving(true);
        setCronogramaRecursosStateError('');
        try {
            // Compute the leveling simulation on the fly to save it along with capacities
            const manualLimits = cronogramaRecursosStateDraft?.manual_limits || {};
            const allRows = cronogramaRecursos?.recursos || [];

            const getPeriodCapacityStatus = (resourceId, periodId, demand) => {
                const rawLimit = manualLimits?.[String(resourceId)]?.[String(periodId)];
                if (rawLimit === null || rawLimit === undefined || rawLimit === '') {
                    return { hasLimit: false, limit: null, excess: 0, overloaded: false };
                }
                const limit = Number(rawLimit);
                if (!Number.isFinite(limit)) {
                    return { hasLimit: false, limit: null, excess: 0, overloaded: false };
                }
                const quantity = Number(demand || 0);
                const excess = Math.max(0, quantity - limit);
                return {
                    hasLimit: true,
                    limit,
                    excess,
                    overloaded: excess > 0,
                };
            };

            const moves = [];
            const unresolved = [];
            const affectedResources = new Set();
            let resolvedQuantity = 0;
            let unresolvedQuantity = 0;
            let overloadedQuantity = 0;

            allRows.forEach((row) => {
                const rowPeriods = row.periodos || [];
                const availableByPeriod = rowPeriods.map((periodo) => {
                    const status = getPeriodCapacityStatus(row.recurso_id, periodo.periodo_id, periodo.cantidad);
                    if (!status.hasLimit || status.overloaded) return 0;
                    return Math.max(0, Number(status.limit || 0) - Number(periodo.cantidad || 0));
                });

                rowPeriods.forEach((periodo, sourceIndex) => {
                    const status = getPeriodCapacityStatus(row.recurso_id, periodo.periodo_id, periodo.cantidad);
                    if (!status.overloaded) return;

                    affectedResources.add(row.recurso_id);
                    overloadedQuantity += status.excess;
                    let remaining = status.excess;

                    for (let targetIndex = sourceIndex + 1; targetIndex < rowPeriods.length && remaining > 0; targetIndex += 1) {
                        const available = availableByPeriod[targetIndex] || 0;
                        if (available <= 0) continue;

                        const quantity = Math.min(remaining, available);
                        availableByPeriod[targetIndex] -= quantity;
                        remaining -= quantity;
                        resolvedQuantity += quantity;
                        moves.push({
                            resourceId: row.recurso_id,
                            recurso: row.recurso || 'Recurso sin descripcion',
                            sourcePeriod: periodo.label,
                            targetPeriod: rowPeriods[targetIndex]?.label || '-',
                            quantity,
                        });
                    }

                    if (remaining > 0) {
                        unresolvedQuantity += remaining;
                        unresolved.push({
                            resourceId: row.recurso_id,
                            recurso: row.recurso || 'Recurso sin descripcion',
                            period: periodo.label,
                            quantity: remaining,
                        });
                    }
                });
            });

            const nextAdjustments = {
                ...(cronogramaRecursosStateDraft || {}),
            };

            if (moves.length > 0 || unresolved.length > 0) {
                nextAdjustments.leveling_proposal = {
                    status: 'proposed',
                    generated_at: new Date().toISOString(),
                    applied: false,
                    summary: {
                        moves: moves.length,
                        unresolved: unresolved.length,
                        affected_resources: affectedResources.size,
                        resolved_quantity: resolvedQuantity,
                        unresolved_quantity: unresolvedQuantity,
                        overloaded_quantity: overloadedQuantity,
                    },
                    moves: moves.map((move) => ({
                        resource_id: move.resourceId,
                        recurso: move.recurso,
                        source_period: move.sourcePeriod,
                        target_period: move.targetPeriod,
                        quantity: move.quantity,
                    })),
                    unresolved: unresolved.map((item) => ({
                        resource_id: item.resourceId,
                        recurso: item.recurso,
                        period: item.period,
                        quantity: item.quantity,
                    })),
                };
            } else {
                delete nextAdjustments.leveling_proposal;
            }

            const updatedState = await cronogramasApi.updateRecursosState(
                resolvedBudgetId,
                {
                    version: cronogramaRecursosState.version,
                    adjustments: nextAdjustments,
                },
                empId,
            );
            setCronogramaRecursosState(updatedState);
            setCronogramaRecursosStateDraft(updatedState?.adjustments || {});
            setCronogramaRecursosStateDirty(false);
            await appAlert({
                title: 'Estado de recursos guardado',
                message: 'Las capacidades manuales y la propuesta de nivelación quedaron persistidas.',
                tone: 'success',
            });
        } catch (saveError) {
            globalThis.reportClientError?.('Error guardando estado de recursos:', saveError);
            const message = resolveApiErrorMessage(saveError, 'No fue posible guardar el estado colaborativo de recursos.');
            setCronogramaRecursosStateError(message);
            if (saveError.response?.status === 409) {
                await reloadCronogramaRecursosState().catch(() => null);
            }
            await appAlert({
                title: 'No se pudo guardar',
                message,
                tone: 'danger',
            });
        } finally {
            setCronogramaRecursosStateSaving(false);
        }
    }, [cronogramaRecursosState, cronogramaRecursosStateDraft, empId, reloadCronogramaRecursosState, resolvedBudgetId, cronogramaRecursos]);

    const handlePersistCronogramaRecursosLevelingProposal = useCallback(async (simulation) => {
        if (!resolvedBudgetId || !cronogramaRecursosState) return;
        setCronogramaRecursosStateSaving(true);
        setCronogramaRecursosStateError('');
        try {
            const levelingProposal = {
                status: 'proposed',
                generated_at: new Date().toISOString(),
                applied: false,
                summary: {
                    moves: simulation?.moves?.length || 0,
                    unresolved: simulation?.unresolved?.length || 0,
                    affected_resources: simulation?.affectedResources || 0,
                    resolved_quantity: simulation?.resolvedQuantity || 0,
                    unresolved_quantity: simulation?.unresolvedQuantity || 0,
                    overloaded_quantity: simulation?.overloadedQuantity || 0,
                },
                moves: (simulation?.moves || []).map((move) => ({
                    resource_id: move.resourceId,
                    recurso: move.recurso,
                    source_period: move.sourcePeriod,
                    target_period: move.targetPeriod,
                    quantity: move.quantity,
                })),
                unresolved: (simulation?.unresolved || []).map((item) => ({
                    resource_id: item.resourceId,
                    recurso: item.recurso,
                    period: item.period,
                    quantity: item.quantity,
                })),
            };
            const nextAdjustments = {
                ...(cronogramaRecursosStateDraft || {}),
                leveling_proposal: levelingProposal,
            };
            const updatedState = await cronogramasApi.updateRecursosState(
                resolvedBudgetId,
                {
                    version: cronogramaRecursosState.version,
                    adjustments: nextAdjustments,
                },
                empId,
            );
            setCronogramaRecursosState(updatedState);
            setCronogramaRecursosStateDraft(updatedState?.adjustments || {});
            setCronogramaRecursosStateDirty(false);
            await appAlert({
                title: 'Propuesta guardada',
                message: 'La propuesta de nivelacion quedo persistida para la revision seleccionada. No se modifico el Gantt.',
                tone: 'success',
            });
        } catch (saveError) {
            globalThis.reportClientError?.('Error guardando propuesta de nivelacion:', saveError);
            const message = resolveApiErrorMessage(saveError, 'No fue posible guardar la propuesta colaborativa de recursos.');
            setCronogramaRecursosStateError(message);
            if (saveError.response?.status === 409) {
                await reloadCronogramaRecursosState().catch(() => null);
            }
            await appAlert({
                title: 'No se pudo guardar',
                message,
                tone: 'danger',
            });
        } finally {
            setCronogramaRecursosStateSaving(false);
        }
    }, [cronogramaRecursosState, cronogramaRecursosStateDraft, empId, reloadCronogramaRecursosState, resolvedBudgetId]);

    const handleApproveCronogramaRecursosLevelingProposal = useCallback(async () => {
        if (!resolvedBudgetId || !cronogramaRecursosState) return;
        const currentProposal = cronogramaRecursosStateDraft?.leveling_proposal;
        if (!currentProposal) return;
        setCronogramaRecursosStateSaving(true);
        setCronogramaRecursosStateError('');
        try {
            const nextAdjustments = {
                ...(cronogramaRecursosStateDraft || {}),
                leveling_proposal: {
                    ...currentProposal,
                    status: 'approved',
                    approved_at: new Date().toISOString(),
                    applied: false,
                },
            };
            const updatedState = await cronogramasApi.updateRecursosState(
                resolvedBudgetId,
                {
                    version: cronogramaRecursosState.version,
                    adjustments: nextAdjustments,
                },
                empId,
            );
            setCronogramaRecursosState(updatedState);
            setCronogramaRecursosStateDraft(updatedState?.adjustments || {});
            setCronogramaRecursosStateDirty(false);
            await appAlert({
                title: 'Propuesta aprobada',
                message: 'La propuesta quedo aprobada para revision colaborativa. Aun no se aplico al Gantt.',
                tone: 'success',
            });
        } catch (approveError) {
            globalThis.reportClientError?.('Error aprobando propuesta de nivelacion:', approveError);
            const message = resolveApiErrorMessage(approveError, 'No fue posible aprobar la propuesta colaborativa de recursos.');
            setCronogramaRecursosStateError(message);
            if (approveError.response?.status === 409) {
                await reloadCronogramaRecursosState().catch(() => null);
            }
            await appAlert({
                title: 'No se pudo aprobar',
                message,
                tone: 'danger',
            });
        } finally {
            setCronogramaRecursosStateSaving(false);
        }
    }, [cronogramaRecursosState, cronogramaRecursosStateDraft, empId, reloadCronogramaRecursosState, resolvedBudgetId]);

    const handleClearCronogramaRecursosLevelingProposal = useCallback(async () => {
        if (!resolvedBudgetId || !cronogramaRecursosState) return;
        setCronogramaRecursosStateSaving(true);
        setCronogramaRecursosStateError('');
        try {
            const nextAdjustments = {
                ...(cronogramaRecursosStateDraft || {}),
            };
            delete nextAdjustments.leveling_proposal;
            const updatedState = await cronogramasApi.updateRecursosState(
                resolvedBudgetId,
                {
                    version: cronogramaRecursosState.version,
                    adjustments: nextAdjustments,
                },
                empId,
            );
            setCronogramaRecursosState(updatedState);
            setCronogramaRecursosStateDraft(updatedState?.adjustments || {});
            setCronogramaRecursosStateDirty(false);
        } catch (clearError) {
            globalThis.reportClientError?.('Error quitando propuesta de nivelacion:', clearError);
            const message = resolveApiErrorMessage(clearError, 'No fue posible quitar la propuesta colaborativa de recursos.');
            setCronogramaRecursosStateError(message);
            if (clearError.response?.status === 409) {
                await reloadCronogramaRecursosState().catch(() => null);
            }
        } finally {
            setCronogramaRecursosStateSaving(false);
        }
    }, [cronogramaRecursosState, cronogramaRecursosStateDraft, empId, reloadCronogramaRecursosState, resolvedBudgetId]);

    const handleRequestCronogramaRecursosLevelingApplication = useCallback(async () => {
        if (!resolvedBudgetId || !cronogramaRecursosState) return;
        const currentProposal = cronogramaRecursosStateDraft?.leveling_proposal;
        if (!currentProposal || currentProposal.status !== 'approved') return;
        const confirmed = await appConfirm({
            title: 'Preparar aplicacion',
            message: 'Se registrara una intencion colaborativa para aplicar la propuesta aprobada. Este paso no modifica Gantt, Valorado ni Flujo.',
            confirmLabel: 'Preparar aplicacion',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (!confirmed) return;
        setCronogramaRecursosStateSaving(true);
        setCronogramaRecursosStateError('');
        try {
            const nextAdjustments = {
                ...(cronogramaRecursosStateDraft || {}),
                leveling_application_intent: {
                    status: 'ready_to_apply',
                    requested_at: new Date().toISOString(),
                    applied: false,
                    source_proposal_approved_at: currentProposal.approved_at || null,
                    source_moves: currentProposal?.moves?.length || 0,
                    source_unresolved: currentProposal?.unresolved?.length || 0,
                    safety: 'not_applied_to_gantt_valorado_flujo',
                },
            };
            const updatedState = await cronogramasApi.updateRecursosState(
                resolvedBudgetId,
                {
                    version: cronogramaRecursosState.version,
                    adjustments: nextAdjustments,
                },
                empId,
            );
            setCronogramaRecursosState(updatedState);
            setCronogramaRecursosStateDraft(updatedState?.adjustments || {});
            setCronogramaRecursosStateDirty(false);
            await appAlert({
                title: 'Intencion registrada',
                message: 'La aplicacion quedo preparada para el siguiente paso controlado. No se modifico el Gantt.',
                tone: 'success',
            });
        } catch (intentError) {
            globalThis.reportClientError?.('Error preparando aplicacion de nivelacion:', intentError);
            const message = resolveApiErrorMessage(intentError, 'No fue posible preparar la aplicacion colaborativa de recursos.');
            setCronogramaRecursosStateError(message);
            if (intentError.response?.status === 409) {
                await reloadCronogramaRecursosState().catch(() => null);
            }
            await appAlert({
                title: 'No se pudo preparar',
                message,
                tone: 'danger',
            });
        } finally {
            setCronogramaRecursosStateSaving(false);
        }
    }, [cronogramaRecursosState, cronogramaRecursosStateDraft, empId, reloadCronogramaRecursosState, resolvedBudgetId]);

    const handleCancelCronogramaRecursosLevelingApplication = useCallback(async () => {
        if (!resolvedBudgetId || !cronogramaRecursosState) return;
        setCronogramaRecursosStateSaving(true);
        setCronogramaRecursosStateError('');
        try {
            const nextAdjustments = {
                ...(cronogramaRecursosStateDraft || {}),
            };
            delete nextAdjustments.leveling_application_intent;
            const updatedState = await cronogramasApi.updateRecursosState(
                resolvedBudgetId,
                {
                    version: cronogramaRecursosState.version,
                    adjustments: nextAdjustments,
                },
                empId,
            );
            setCronogramaRecursosState(updatedState);
            setCronogramaRecursosStateDraft(updatedState?.adjustments || {});
            setCronogramaRecursosStateDirty(false);
        } catch (cancelError) {
            globalThis.reportClientError?.('Error cancelando aplicacion de nivelacion:', cancelError);
            const message = resolveApiErrorMessage(cancelError, 'No fue posible cancelar la intencion colaborativa de aplicacion.');
            setCronogramaRecursosStateError(message);
            if (cancelError.response?.status === 409) {
                await reloadCronogramaRecursosState().catch(() => null);
            }
        } finally {
            setCronogramaRecursosStateSaving(false);
        }
    }, [cronogramaRecursosState, cronogramaRecursosStateDraft, empId, reloadCronogramaRecursosState, resolvedBudgetId]);

    const handleApplyCronogramaRecursosLevelingApplication = useCallback(async () => {
        if (!resolvedBudgetId || !cronogramaRecursosState) return;
        const currentProposal = cronogramaRecursosStateDraft?.leveling_proposal;
        const currentIntent = cronogramaRecursosStateDraft?.leveling_application_intent;
        if (!currentProposal || currentProposal.status !== 'approved' || !currentIntent) return;
        const confirmed = await appConfirm({
            title: 'Aplicar en Recursos',
            message: 'Se marcara la propuesta como aplicada solo en la capa Recursos y se guardara un snapshot de rollback. No se modificaran Gantt, Valorado ni Flujo.',
            confirmLabel: 'Aplicar en Recursos',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (!confirmed) return;
        setCronogramaRecursosStateSaving(true);
        setCronogramaRecursosStateError('');
        const appliedAt = new Date().toISOString();
        try {
            const nextAdjustments = {
                ...(cronogramaRecursosStateDraft || {}),
                leveling_proposal: {
                    ...currentProposal,
                    applied: true,
                    applied_at: appliedAt,
                    applied_scope: 'resources_state_only',
                },
                leveling_application_intent: {
                    ...currentIntent,
                    status: 'applied',
                    applied: true,
                    applied_at: appliedAt,
                },
                leveling_application_result: {
                    status: 'applied_to_resources',
                    applied_at: appliedAt,
                    applied_scope: 'resources_state_only',
                    summary: currentProposal.summary || {},
                    moves: currentProposal.moves || [],
                    unresolved: currentProposal.unresolved || [],
                    rollback_snapshot: {
                        leveling_proposal: currentProposal,
                        leveling_application_intent: currentIntent,
                    },
                    safety: 'not_applied_to_gantt_valorado_flujo',
                },
            };
            const updatedState = await cronogramasApi.updateRecursosState(
                resolvedBudgetId,
                {
                    version: cronogramaRecursosState.version,
                    adjustments: nextAdjustments,
                },
                empId,
            );
            setCronogramaRecursosState(updatedState);
            setCronogramaRecursosStateDraft(updatedState?.adjustments || {});
            setCronogramaRecursosStateDirty(false);
            await appAlert({
                title: 'Aplicacion registrada',
                message: 'La propuesta quedo aplicada solo en la capa Recursos. El Gantt no fue modificado.',
                tone: 'success',
            });
        } catch (applyError) {
            globalThis.reportClientError?.('Error aplicando propuesta en Recursos:', applyError);
            const message = resolveApiErrorMessage(applyError, 'No fue posible aplicar la propuesta en la capa Recursos.');
            setCronogramaRecursosStateError(message);
            if (applyError.response?.status === 409) {
                await reloadCronogramaRecursosState().catch(() => null);
            }
            await appAlert({
                title: 'No se pudo aplicar',
                message,
                tone: 'danger',
            });
        } finally {
            setCronogramaRecursosStateSaving(false);
        }
    }, [cronogramaRecursosState, cronogramaRecursosStateDraft, empId, reloadCronogramaRecursosState, resolvedBudgetId]);

    const handleRollbackCronogramaRecursosLevelingApplication = useCallback(async () => {
        if (!resolvedBudgetId || !cronogramaRecursosState) return;
        const currentResult = cronogramaRecursosStateDraft?.leveling_application_result;
        const rollbackSnapshot = currentResult?.rollback_snapshot;
        if (!rollbackSnapshot) return;
        const confirmed = await appConfirm({
            title: 'Revertir aplicacion',
            message: 'Se restaurara la propuesta y la intencion al estado previo a la aplicacion en Recursos. No se modificaran Gantt, Valorado ni Flujo.',
            confirmLabel: 'Revertir',
            cancelLabel: 'Cancelar',
            tone: 'warning',
        });
        if (!confirmed) return;
        setCronogramaRecursosStateSaving(true);
        setCronogramaRecursosStateError('');
        try {
            const nextAdjustments = {
                ...(cronogramaRecursosStateDraft || {}),
                leveling_proposal: rollbackSnapshot.leveling_proposal,
                leveling_application_intent: rollbackSnapshot.leveling_application_intent,
            };
            delete nextAdjustments.leveling_application_result;
            const updatedState = await cronogramasApi.updateRecursosState(
                resolvedBudgetId,
                {
                    version: cronogramaRecursosState.version,
                    adjustments: nextAdjustments,
                },
                empId,
            );
            setCronogramaRecursosState(updatedState);
            setCronogramaRecursosStateDraft(updatedState?.adjustments || {});
            setCronogramaRecursosStateDirty(false);
            await appAlert({
                title: 'Aplicacion revertida',
                message: 'Se restauro el estado previo dentro de Recursos. El Gantt no fue modificado.',
                tone: 'success',
            });
        } catch (rollbackError) {
            globalThis.reportClientError?.('Error revirtiendo aplicacion en Recursos:', rollbackError);
            const message = resolveApiErrorMessage(rollbackError, 'No fue posible revertir la aplicacion en Recursos.');
            setCronogramaRecursosStateError(message);
            if (rollbackError.response?.status === 409) {
                await reloadCronogramaRecursosState().catch(() => null);
            }
            await appAlert({
                title: 'No se pudo revertir',
                message,
                tone: 'danger',
            });
        } finally {
            setCronogramaRecursosStateSaving(false);
        }
    }, [cronogramaRecursosState, cronogramaRecursosStateDraft, empId, reloadCronogramaRecursosState, resolvedBudgetId]);

    const handleConfigChange = (field, value) => {
        setConfigState((current) => {
            if (field === 'globalDistributionValue') {
                const next = [...(current.globalDistribution || [])];
                const idx = value.index;
                // Allow empty string or just a decimal point while typing
                let val = value.value;
                if (val !== '' && val !== '.') {
                    val = Number(Number(val).toFixed(2));
                }
                next[idx] = val;
                
                // Return without balancing to allow user to see current sum
                return { ...current, globalDistribution: next };
            }
            if (field === 'periodType') {
                const previewPeriodCount = buildValoradoPreviewPeriods(
                    detail,
                    value,
                    cronogramaTrabajo?.config?.hora_inicio_jornada ?? DEFAULT_WORKDAY_START_HOUR,
                    cronogramaTrabajo?.config?.jornada_laboral_horas ?? DEFAULT_WORKDAY_HOURS,
                ).length;
                return {
                    ...current,
                    periodType: value,
                    globalDistribution: normalizeDistributionToPeriodCount(current.globalDistribution, previewPeriodCount),
                };
            }
            return { ...current, [field]: value };
        });
    };

    const handleBalanceGlobal = () => {
        setConfigState(current => ({
            ...current,
            globalDistribution: balanceCronogramaDistribution(current.globalDistribution, { decimals: 2 })
        }));
    };
    const handleCopyDistribution = () => {
        if (selectedRowIds.size === 0) return;
        const targetId = Array.from(selectedRowIds)[0];
        const row = displayRows.find(r => String(r.budget_line_id || r.linea_id) === String(targetId));
        if (row && row.distribution) {
            setClipboardDistribution([...row.distribution]);
            appAlert({ title: 'Copiado', message: 'Distribución copiada al portapapeles.', tone: 'success' });
        }
    };

    const handlePasteDistribution = async () => {
        if (!clipboardDistribution || selectedRowIds.size === 0) return;
        
        const confirmed = await appConfirm({
            title: 'Pegar distribución',
            message: `¿Desea aplicar la distribución copiada a las ${selectedRowIds.size} líneas seleccionadas?`,
            confirmLabel: 'Pegar',
            tone: 'warning'
        });
        if (!confirmed) return;

        setCronogramaLoading(true);
        try {
            let updatedCronograma = cronograma;
            for (const rowId of selectedRowIds) {
                const row = displayRows.find(r => String(r.budget_line_id || r.linea_id) === String(rowId));
                if (row && row.is_calculable) {
                    updatedCronograma = await cronogramasApi.updateValoradoLinea(resolvedBudgetId, row.linea_id, {
                        distribution: clipboardDistribution,
                    }, empId);
                }
            }
            setCronograma(updatedCronograma);
            await appAlert({ title: 'Completado', message: 'Distribución pegada correctamente.', tone: 'success' });
        } catch (error) {
            globalThis.reportClientError?.('Error al pegar distribución:', error);
            await appAlert({ title: 'Error', message: 'No se pudo pegar la distribución en todas las líneas.', tone: 'danger' });
        } finally {
            setCronogramaLoading(false);
        }
    };

    const handleApplyConfig = async () => {
        if (!resolvedBudgetId || !cronograma) return;

        let clearLineOverrides = false;
        if (configState.periodType !== cronograma.period_type && cronograma.has_line_overrides) {
            const confirmed = await appConfirm({
                title: 'Recalcular periodos',
                subtitle: 'Hay líneas con ajustes manuales.',
                message: `Cambiar el tipo de periodo recalculará la matriz y eliminará los ajustes manuales por línea.${activeManualTemporalSummary.count ? ` Las ${activeManualTemporalSummary.count} línea(s) con temporalidad manual válida se preservarán y se reagruparán sobre el nuevo periodo${configState.distributionMode === 'gantt' ? '' : ', pero seguirán actuando solo como referencia operativa mientras el Valorado no vuelva a "Desde Gantt"'}.` : ''} ¿Desea continuar?`,
                confirmLabel: 'Recalcular',
                tone: 'warning',
            });
            if (!confirmed) return;
            clearLineOverrides = true;
        }

        const targetPeriodCount = buildValoradoPreviewPeriods(
            detail,
            configState.periodType,
            cronogramaTrabajo?.config?.hora_inicio_jornada ?? DEFAULT_WORKDAY_START_HOUR,
            cronogramaTrabajo?.config?.jornada_laboral_horas ?? DEFAULT_WORKDAY_HOURS,
        ).length || cronograma.periods.length;
        const currentDistribution = normalizeDistributionToPeriodCount(configState.globalDistribution || [], targetPeriodCount);
            const normalizedDistribution = configState.distributionMode === 'usuario'
                ? normalizeCronogramaDistribution(currentDistribution, targetPeriodCount, { decimals: 2 })
                : cronograma.global_distribution;

        if (configState.distributionMode === 'usuario' && !normalizedDistribution) {
            // If it can't be normalized (too far from 100), ask to balance first or try to balance now
            const confirmedBalance = await appConfirm({
                title: 'Distribución incompleta',
                message: `La suma actual es ${formatPercent(distributionSum, 2)}. ¿Desea cuadrar automáticamente el 100% en el último periodo antes de aplicar?`,
                confirmLabel: 'Cuadrar y Aplicar',
                tone: 'warning'
            });
            
            if (confirmedBalance) {
                const balanced = balanceCronogramaDistribution(currentDistribution, { decimals: 2 });
                // Continue with balanced
                return applyConfig(balanced, true);
            }
            return;
        }

        return applyConfig(normalizedDistribution, clearLineOverrides);
    };

    const handleApplyValoradoLineDistribution = useCallback(async (lineaId, distribution) => {
        if (!resolvedBudgetId || !lineaId) {
            throw new Error('No hay presupuesto operativo o línea válida para actualizar el cronograma valorado.');
        }
        const updated = await cronogramasApi.updateValoradoLinea(resolvedBudgetId, lineaId, {
            distribution,
        }, empId);
        setCronograma(updated);
        return updated;
    }, [empId, resolvedBudgetId]);

    const handleMergeTrabajoInterparentSubbars = useCallback(async (payload) => {
        if (!resolvedBudgetId) {
            throw new Error('No hay presupuesto operativo para fusionar tramos interpadre.');
        }
        const updated = await cronogramasApi.mergeTrabajoInterparentSubbars(
            resolvedBudgetId,
            payload,
            empId,
        );
        if (updated?.cronograma) {
            setCronograma(updated.cronograma);
        }
        if (updated?.trabajo) {
            setCronogramaTrabajo(updated.trabajo);
        }
        return updated;
    }, [empId, resolvedBudgetId]);

    const applyConfig = async (distribution, clearLineOverrides) => {
        setConfigSaving(true);
        try {
            const updated = await cronogramasApi.updateValoradoConfig(resolvedBudgetId, {
                period_type: configState.periodType,
                distribution_mode: configState.distributionMode,
                global_distribution: configState.distributionMode === 'usuario' ? distribution : [],
                clear_line_overrides: clearLineOverrides,
            }, empId);
            setCronograma(updated);
            setConfigState({
                periodType: updated.period_type,
                distributionMode: updated.distribution_mode,
                globalDistribution: balanceCronogramaDistribution(updated.global_distribution || [], { decimals: 2 }),
            });
            await appAlert({
                title: 'Cronograma actualizado',
                message: `La configuración global del cronograma valorado se guardó correctamente.${updated.distribution_mode === 'gantt' && activeManualTemporalSummary.count ? ` ${activeManualTemporalSummary.count} línea(s) con temporalidad manual válida permanecen derivadas desde Gantt y se reagruparon al nuevo periodo.` : ''}${updated.distribution_mode !== 'gantt' && activeManualTemporalSummary.count ? ` ${activeManualTemporalSummary.count} línea(s) con temporalidad manual válida permanecen preservadas en Gantt como referencia operativa, pero el Valorado ahora usa ${selectedDistributionModeLabel} y deja de derivar económicamente desde esas ventanas.` : ''}`,
                tone: 'success',
            });
        } catch (saveError) {
            globalThis.reportClientError?.('Error guardando configuración del cronograma:', saveError);
            await appAlert({
                title: 'No se pudo guardar',
                message: resolveApiErrorMessage(saveError, 'No fue posible guardar la configuración del cronograma.'),
                tone: 'danger',
            });
        } finally {
            setConfigSaving(false);
        }
    };

    const handleRecalculateValoradoFromGantt = async (reconciliationSummary = null) => {
        if (!resolvedBudgetId || !cronograma) return;
        const impactMessage = reconciliationSummary?.hasDifferences
            ? `Impacto estimado: ${reconciliationSummary.differences.length} línea(s) cambiarían distribución y se redistribuirían aproximadamente ${reconciliationSummary.formattedRedistribution}. ${reconciliationSummary.unscheduled ? `${reconciliationSummary.unscheduled} línea(s) sin fecha Gantt usarían distribución homogénea. ` : ''}${reconciliationSummary.manualScheduleRequired ? `${reconciliationSummary.manualScheduleRequired} línea(s) solo materiales seguirían pendientes de tiempo manual. ` : ''}`
            : 'No se detectan diferencias relevantes frente al Gantt vigente. ';
        const confirmed = await appConfirm({
            title: 'Recalcular desde Gantt',
            subtitle: 'Acción explícita de sincronización',
            message: `${impactMessage}Se recalculará el Cronograma Valorado desde las fechas vigentes del Gantt y se limpiarán los overrides manuales por línea. No se moverán fechas del Gantt. ¿Desea continuar?`,
            confirmLabel: 'Recalcular',
            tone: 'warning',
        });
        if (!confirmed) return;

        setConfigSaving(true);
        try {
            const updated = await cronogramasApi.updateValoradoConfig(resolvedBudgetId, {
                period_type: configState.periodType || cronograma.period_type,
                distribution_mode: 'gantt',
                global_distribution: [],
                clear_line_overrides: true,
            }, empId);
            const transitionSummary = buildManualScheduleTransitionSummary(cronograma.rows || [], updated.rows || [], currency, decMoneda);
            setCronograma(updated);
            setConfigState({
                periodType: updated.period_type,
                distributionMode: updated.distribution_mode,
                globalDistribution: balanceCronogramaDistribution(updated.global_distribution || [], { decimals: 2 }),
            });
            await appAlert({
                title: updated.rows?.some((row) => row?.requires_manual_schedule) ? 'Valorado sincronizado parcialmente' : 'Valorado sincronizado',
                message: updated.rows?.some((row) => row?.requires_manual_schedule)
                    ? `El Cronograma Valorado y su Flujo de Caja se recalcularon desde Gantt, pero aún quedan líneas solo materiales pendientes de tiempo manual.${transitionSummary.hasRecovery ? ` Se liberaron ${transitionSummary.recoveredCount} línea(s) y ${transitionSummary.formattedRecoveredAmount} entraron ya en distribución real.` : ''} Las fechas del Gantt no se modificaron.`
                    : `El Cronograma Valorado y su Flujo de Caja se recalcularon desde Gantt.${transitionSummary.hasRecovery ? ` Se liberaron ${transitionSummary.recoveredCount} línea(s) y ${transitionSummary.formattedRecoveredAmount} entraron en distribución real.` : ''} Las fechas del Gantt no se modificaron.`,
                tone: 'success',
            });
        } catch (error) {
            globalThis.reportClientError?.('Error recalculando cronograma valorado desde Gantt:', error);
            await appAlert({
                title: 'No se pudo recalcular',
                message: resolveApiErrorMessage(error, 'No fue posible recalcular el Cronograma Valorado desde Gantt.'),
                tone: 'danger',
            });
        } finally {
            setConfigSaving(false);
        }
    };

    const syncValoradoFromGanttSilently = useCallback(async (options = {}) => {
        if (!resolvedBudgetId || !cronograma || cronograma.distribution_mode !== 'gantt') {
            return null;
        }
        const resolvedCurrency = cronograma?.moneda || 'USD';
        const resolvedDecMoneda = cronograma?.dec_moneda ?? 2;
        const requestPayload = {
            // La sincronización silenciosa debe usar el estado confirmado del servidor,
            // no un borrador local todavía no aplicado en la UI.
            period_type: cronograma.period_type || 'mensual',
            distribution_mode: 'gantt',
            global_distribution: [],
            clear_line_overrides: true,
        };
        let updated = null;
        let lastSyncError = null;
        for (let attempt = 0; attempt < 2; attempt += 1) {
            try {
                updated = await cronogramasApi.updateValoradoConfig(resolvedBudgetId, requestPayload, empId);
                lastSyncError = null;
                break;
            } catch (syncRequestError) {
                lastSyncError = syncRequestError;
                if (attempt === 0) {
                    await new Promise((resolve) => window.setTimeout(resolve, 180));
                    continue;
                }
            }
        }
        if (!updated) {
            throw lastSyncError || new Error('No fue posible sincronizar el Cronograma Valorado desde Gantt.');
        }
        let transitionSummary = {
            recoveredCount: 0,
            recoveredAmount: 0,
            formattedRecoveredAmount: formatCurrency(0, resolvedCurrency, resolvedDecMoneda),
            hasRecovery: false,
        };
        try {
            transitionSummary = buildManualScheduleTransitionSummary(
                cronograma.rows || [],
                updated.rows || [],
                resolvedCurrency,
                resolvedDecMoneda,
            );
        } catch (summaryError) {
            globalThis.reportClientError?.('Error calculando resumen de transición manual tras sincronizar valorado desde Gantt:', summaryError);
        }
        setCronograma(updated);
        setConfigState({
            periodType: updated.period_type,
            distributionMode: updated.distribution_mode,
            globalDistribution: balanceCronogramaDistribution(updated.global_distribution || [], { decimals: 2 }),
        });
        if (!options.silent) {
            await appAlert({
                title: updated.rows?.some((row) => row?.requires_manual_schedule) ? 'Valorado sincronizado parcialmente' : 'Valorado sincronizado',
                message: updated.rows?.some((row) => row?.requires_manual_schedule)
                    ? `El Cronograma Valorado y su Flujo de Caja se actualizaron desde el Gantt confirmado, pero siguen existiendo líneas solo materiales pendientes de tiempo manual.${transitionSummary.hasRecovery ? ` Se liberaron ${transitionSummary.recoveredCount} línea(s) y ${transitionSummary.formattedRecoveredAmount} entraron ya en distribución real.` : ''}`
                    : `El Cronograma Valorado y su Flujo de Caja se actualizaron desde el Gantt confirmado.${transitionSummary.hasRecovery ? ` Se liberaron ${transitionSummary.recoveredCount} línea(s) y ${transitionSummary.formattedRecoveredAmount} entraron en distribución real.` : ''}`,
                tone: 'success',
            });
        }
        return updated;
    }, [cronograma, empId, resolvedBudgetId]);

    const scheduleDeferredValoradoSyncFromGantt = useCallback((source = 'gantt_deferred_save') => {
        if (!resolvedBudgetId || !cronograma || cronograma.distribution_mode !== 'gantt') {
            return;
        }
        if (deferredValoradoSyncTimerRef.current) {
            window.clearTimeout(deferredValoradoSyncTimerRef.current);
        }
        deferredValoradoSyncTimerRef.current = window.setTimeout(() => {
            deferredValoradoSyncTimerRef.current = null;
            void syncValoradoFromGanttSilently({ silent: true, source }).catch(async (syncError) => {
                globalThis.reportClientError?.('Error sincronizando cronograma valorado diferido tras guardar Gantt:', syncError);
                await appAlert({
                    title: 'Gantt guardado con sincronización pendiente',
                    message: `${resolveApiErrorMessage(syncError, 'La secuencia quedó guardada correctamente en el Gantt, pero no fue posible actualizar automáticamente el Cronograma Valorado derivado.')} Puedes reintentar desde "Recalcular desde Gantt".`,
                    tone: 'warning',
                });
            });
        }, 900);
    }, [cronograma, resolvedBudgetId, syncValoradoFromGanttSilently]);

    useEffect(() => () => {
        if (deferredValoradoSyncTimerRef.current) {
            window.clearTimeout(deferredValoradoSyncTimerRef.current);
            deferredValoradoSyncTimerRef.current = null;
        }
    }, []);

    const handleClearValoradoOverrides = async (overrideSummary = null) => {
        if (!resolvedBudgetId || !cronograma) return;
        if (configState.periodType !== cronograma.period_type || configState.distributionMode !== cronograma.distribution_mode) {
            await appAlert({
                title: 'Configuración pendiente',
                message: 'Primero aplica la configuración pendiente del Cronograma Valorado antes de limpiar overrides manuales.',
                tone: 'warning',
            });
            return;
        }

        const impactMessage = overrideSummary?.hasOverrides
            ? `Impacto estimado: ${overrideSummary.differences.length} ajuste(s) volverían a la distribución ${cronograma.distribution_mode === 'gantt' ? 'derivada de Gantt' : 'global vigente'} y se reconciliarían aproximadamente ${overrideSummary.formattedRedistribution}. ${overrideSummary.unscheduled ? `${overrideSummary.unscheduled} línea(s) sin fecha Gantt usarían distribución homogénea. ` : ''}${overrideSummary.manualScheduleRequired ? `${overrideSummary.manualScheduleRequired} línea(s) solo materiales seguirían pendientes de tiempo manual. ` : ''}`
            : 'No se detectan diferencias relevantes al retirar los overrides manuales. ';
        const confirmed = await appConfirm({
            title: 'Limpiar overrides',
            subtitle: 'Reconciliación controlada',
            message: `${impactMessage}Se eliminarán solo los ajustes manuales por línea del Cronograma Valorado. No se moverán fechas, dependencias ni recursos del Gantt. ¿Desea continuar?`,
            confirmLabel: 'Limpiar',
            tone: 'warning',
        });
        if (!confirmed) return;

        setConfigSaving(true);
        try {
            const updated = await cronogramasApi.updateValoradoConfig(resolvedBudgetId, {
                period_type: cronograma.period_type,
                distribution_mode: cronograma.distribution_mode,
                global_distribution: cronograma.distribution_mode === 'usuario'
                    ? normalizeDistributionToPeriodCount(cronograma.global_distribution || [], cronograma.periods?.length || 0)
                    : [],
                clear_line_overrides: true,
            }, empId);
            setCronograma(updated);
            setConfigState({
                periodType: updated.period_type,
                distributionMode: updated.distribution_mode,
                globalDistribution: balanceCronogramaDistribution(updated.global_distribution || [], { decimals: 2 }),
            });
            await appAlert({
                title: 'Overrides limpiados',
                message: 'Los ajustes manuales por línea se limpiaron. El Gantt no fue modificado.',
                tone: 'success',
            });
        } catch (error) {
            globalThis.reportClientError?.('Error limpiando overrides del cronograma valorado:', error);
            await appAlert({
                title: 'No se pudieron limpiar',
                message: resolveApiErrorMessage(error, 'No fue posible limpiar los overrides manuales del Cronograma Valorado.'),
                tone: 'danger',
            });
        } finally {
            setConfigSaving(false);
        }
    };

    const handleRecalculateCashFlow = async () => {
        if (!resolvedBudgetId) return;
        setConfigSaving(true);
        try {
            const updated = await cronogramasApi.getValorado(resolvedBudgetId, empId);
            setCronograma(updated);
            setConfigState({
                periodType: updated.period_type,
                distributionMode: updated.distribution_mode,
                globalDistribution: balanceCronogramaDistribution(updated.global_distribution || [], { decimals: 2 }),
            });
            await appAlert({
                title: 'Caja recalculada',
                message: 'El Flujo de Caja se actualizó desde el Cronograma Valorado vigente. No se modificó el Gantt.',
                tone: 'success',
            });
        } catch (error) {
            globalThis.reportClientError?.('Error recalculando flujo de caja:', error);
            await appAlert({
                title: 'No se pudo recalcular Caja',
                message: resolveApiErrorMessage(error, 'No fue posible actualizar el Flujo de Caja.'),
                tone: 'danger',
            });
        } finally {
            setConfigSaving(false);
        }
    };

    const handleApplyCashConstraintLineDraft = async (draftSummary) => {
        if (!resolvedBudgetId || !cronograma || !draftSummary?.drafts?.length) return;
        const previousCronograma = cronograma;
        const distributionByLineId = new Map(
            draftSummary.drafts.map((draft) => [String(draft.lineId), draft.distribution]),
        );
        const previousLineState = new Map(
            (previousCronograma.rows || []).map((row) => [
                String(row.linea_id),
                {
                    hasOverride: Boolean(row.has_override),
                    distribution: Array.isArray(row.distribution) ? row.distribution : [],
                },
            ]),
        );
        const appliedDrafts = [];

        setConfigSaving(true);
        try {
            setCronograma((current) => patchCronogramaValoradoDistributions(
                current,
                displayRows,
                distributionByLineId,
                cronogramaTrabajo?.config?.hora_inicio_jornada ?? DEFAULT_WORKDAY_START_HOUR,
                cronogramaTrabajo?.config?.jornada_laboral_horas ?? DEFAULT_WORKDAY_HOURS,
            ));

            let serverCronograma = null;
            for (const draft of draftSummary.drafts) {
                serverCronograma = await cronogramasApi.updateValoradoLinea(resolvedBudgetId, draft.lineId, {
                    distribution: draft.distribution,
                }, empId);
                appliedDrafts.push(draft);
            }

            if (serverCronograma) {
                setCronograma(serverCronograma);
                setConfigState({
                    periodType: serverCronograma.period_type,
                    distributionMode: serverCronograma.distribution_mode,
                    globalDistribution: balanceCronogramaDistribution(serverCronograma.global_distribution || [], { decimals: 2 }),
                });
            }

            await appAlert({
                title: 'Propuesta aplicada',
                message: `Se guardaron overrides en ${draftSummary.drafts.length} partida(s). El Gantt no fue modificado.`,
                tone: 'success',
            });
        } catch (error) {
            let rollbackFailed = false;
            for (const draft of [...appliedDrafts].reverse()) {
                const previousLine = previousLineState.get(String(draft.lineId));
                try {
                    if (previousLine?.hasOverride && previousLine.distribution.length) {
                        await cronogramasApi.updateValoradoLinea(resolvedBudgetId, draft.lineId, {
                            distribution: previousLine.distribution,
                        }, empId);
                    } else {
                        await cronogramasApi.resetValoradoLinea(resolvedBudgetId, draft.lineId, empId);
                    }
                } catch (rollbackError) {
                    rollbackFailed = true;
                    globalThis.reportClientError?.('Error revirtiendo propuesta financiera por partidas:', rollbackError);
                }
            }
            setCronograma(previousCronograma);
            globalThis.reportClientError?.('Error aplicando propuesta financiera por partidas:', error);
            await appAlert({
                title: 'No se pudo aplicar',
                message: [
                    resolveApiErrorMessage(error, 'No fue posible aplicar la propuesta financiera por partidas.'),
                    rollbackFailed
                        ? 'Algunas líneas ya guardadas no pudieron revertirse automáticamente. Revisa el Cronograma Valorado y usa Limpiar overrides si es necesario.'
                        : 'Las líneas guardadas antes del fallo se revirtieron al estado anterior.',
                ].join('\n\n'),
                tone: 'danger',
            });
        } finally {
            setConfigSaving(false);
        }
    };

    const handleNavigateCell = async (direction) => {
        if (!editingCell || !cronograma) return;
        if (configState.periodType !== cronograma.period_type) {
            await appAlert({
                title: 'Configuración pendiente',
                message: 'Primero pulse Aplicar configuración para guardar el nuevo tipo de periodo antes de navegar o editar celdas.',
                tone: 'warning',
            });
            return;
        }
        const { periodIndex, rowIndex } = editingCell;
        const totalPeriods = cronograma.periods.length;
        
        // Primero guardamos el cambio actual si es necesario (o simplemente aplicamos)
        await handleSaveCell(true); // Pasamos true para indicar que no cierre el modal aún
        
        let nextPeriod = periodIndex;
        if (direction === 'next') {
            nextPeriod = (periodIndex + 1) % totalPeriods;
        } else if (direction === 'prev') {
            nextPeriod = (periodIndex - 1 + totalPeriods) % totalPeriods;
        }
        
        // Buscamos la fila actual en displayRows para asegurar tener la data más reciente
        const currentRow = displayRows[rowIndex];
        if (currentRow) {
            setEditingCell({
                row: currentRow,
                periodIndex: nextPeriod,
                rowIndex,
                value: currentRow.distribution[nextPeriod] || 0,
                copyToRight: false
            });
        }
    };

    const handleSaveCell = async (keepOpen = false, directTarget = null) => {
        const targetRow = directTarget || (editingCell ? editingCell.row : null);
        if (!targetRow) return;
        if (configState.periodType !== cronograma?.period_type) {
            await appAlert({
                title: 'Configuración pendiente',
                message: 'Primero pulse Aplicar configuración para guardar el nuevo tipo de periodo antes de editar porcentajes por línea.',
                tone: 'warning',
            });
            return;
        }

        const { periodIndex, value, copyToRight } = editingCell || {};
        const newValue = directTarget ? null : Number(Number(value).toFixed(2));
        
        const currentRowId = String(targetRow.budget_line_id || targetRow.linea_id);
        const targetIds = selectedRowIds.has(currentRowId) 
            ? Array.from(selectedRowIds) 
            : [currentRowId];

        const previousCronograma = cronograma;
        const distributionByLineId = new Map();
        try {
            for (const rowId of targetIds) {
                const lineRow = displayRows.find(r => String(r.budget_line_id || r.linea_id) === String(rowId));
                if (!lineRow || !lineRow.is_calculable) continue;

                let newDistribution = directTarget ? [...targetRow.distribution] : [...(lineRow.distribution || [])];
                
                if (!directTarget && copyToRight) {
                    let currentSum = 0;
                    for (let i = 0; i < periodIndex; i++) {
                        currentSum += Number(newDistribution[i] || 0);
                    }
                    for (let i = periodIndex; i < cronograma.periods.length; i++) {
                        if (currentSum >= 100) {
                            newDistribution[i] = 0;
                        } else if (currentSum + newValue <= 100) {
                            newDistribution[i] = newValue;
                            currentSum += newValue;
                            if (i === cronograma.periods.length - 1) {
                                newDistribution[i] = Number((newDistribution[i] + (100 - currentSum)).toFixed(2));
                                currentSum = 100;
                            }
                        } else {
                            newDistribution[i] = Number((100 - currentSum).toFixed(2));
                            currentSum = 100;
                        }
                    }
                } else if (!directTarget) {
                    newDistribution[periodIndex] = newValue;
                }

                const normalizedDistribution = normalizeCronogramaDistribution(newDistribution, cronograma.periods.length, { decimals: 2 });
                if (!normalizedDistribution) {
                    throw new Error('La distribución de la línea debe sumar 100%.');
                }

                distributionByLineId.set(String(lineRow.linea_id), normalizedDistribution);
            }

            if (!distributionByLineId.size) {
                if (!keepOpen) setEditingCell(null);
                return;
            }

            setCronograma((current) => patchCronogramaValoradoDistributions(
                current,
                displayRows,
                distributionByLineId,
                cronogramaTrabajo?.config?.hora_inicio_jornada ?? DEFAULT_WORKDAY_START_HOUR,
                cronogramaTrabajo?.config?.jornada_laboral_horas ?? DEFAULT_WORKDAY_HOURS,
            ));
            if (!keepOpen) setEditingCell(null);

            let serverCronograma = null;
            for (const [lineaId, distribution] of distributionByLineId.entries()) {
                serverCronograma = await cronogramasApi.updateValoradoLinea(resolvedBudgetId, lineaId, {
                    distribution,
                }, empId);
            }

            if (serverCronograma) {
                setCronograma(serverCronograma);
            }
        } catch (lineError) {
            setCronograma(previousCronograma);
            globalThis.reportClientError?.('Error actualizando celda del cronograma:', lineError);
            await appAlert({
                title: 'No se pudo guardar el cambio',
                message: resolveApiErrorMessage(lineError, 'No fue posible guardar el valor de la celda.'),
                tone: 'danger',
            });
        }
    };

    const handleResetLine = async (row) => {
        if (!resolvedBudgetId) return;
        const confirmed = await appConfirm({
            title: 'Restaurar línea',
            subtitle: formatCronogramaDescripcion(row),
            message: 'La línea volverá a usar la distribución global del cronograma. ¿Desea continuar?',
            confirmLabel: 'Restaurar',
            tone: 'warning',
        });
        if (!confirmed) return;

        setLineBusyId(row.linea_id);
        try {
            const updated = await cronogramasApi.resetValoradoLinea(resolvedBudgetId, row.linea_id, empId);
            setCronograma(updated);
            setConfigState({
                periodType: updated.period_type,
                distributionMode: updated.distribution_mode,
                globalDistribution: balanceCronogramaDistribution(updated.global_distribution || [], { decimals: 2 }),
            });
        } catch (lineError) {
            globalThis.reportClientError?.('Error restaurando línea del cronograma:', lineError);
            await appAlert({
                title: 'No se pudo restaurar la línea',
                message: resolveApiErrorMessage(lineError, 'No fue posible quitar el ajuste manual de la línea.'),
                tone: 'danger',
            });
        } finally {
            setLineBusyId(null);
        }
    };

    const handleSaveTrabajoConfig = async (config) => {
        if (!resolvedBudgetId) return null;
        setTrabajoSaving(true);
        try {
            const updated = await cronogramasApi.updateTrabajo(resolvedBudgetId, {
                config,
                schedule_data: {},
            }, empId);
            applyCronogramaTrabajoUpdate(updated);
            return updated;
        } finally {
            setTrabajoSaving(false);
        }
    };

    const handleReloadTrabajoHolidayCalendar = async () => {
        if (!resolvedBudgetId) return null;
        setTrabajoSaving(true);
        try {
            const updated = await cronogramasApi.reloadTrabajoHolidayCalendar(resolvedBudgetId, empId);
            applyCronogramaTrabajoUpdate(updated);
            return updated;
        } finally {
            setTrabajoSaving(false);
        }
    };

    const handleResetTrabajoHolidayCalendar = async () => {
        if (!resolvedBudgetId) return null;
        setTrabajoSaving(true);
        try {
            const updated = await cronogramasApi.resetTrabajoHolidayCalendar(resolvedBudgetId, empId);
            setCronogramaTrabajo(updated);
            return updated;
        } finally {
            setTrabajoSaving(false);
        }
    };

    const handleAddTrabajoHolidayManual = async (payload) => {
        if (!resolvedBudgetId) return null;
        setTrabajoSaving(true);
        try {
            const updated = await cronogramasApi.addTrabajoHolidayCalendarManual(resolvedBudgetId, payload, empId);
            setCronogramaTrabajo(updated);
            return updated;
        } finally {
            setTrabajoSaving(false);
        }
    };

    const handleRemoveTrabajoHolidayDay = async (payload) => {
        if (!resolvedBudgetId) return null;
        setTrabajoSaving(true);
        try {
            const updated = await cronogramasApi.removeTrabajoHolidayCalendarDay(resolvedBudgetId, payload, empId);
            setCronogramaTrabajo(updated);
            return updated;
        } finally {
            setTrabajoSaving(false);
        }
    };

    const commitTrabajoSchedulePayload = async (payload, options = {}) => {
        const useDeltaCommit = Boolean(
            cronograma?.distribution_mode === 'gantt'
            && options?.deferValoradoSync
            && !options?.requiresFullTrabajoRefresh
            && cronogramaTrabajo
        );
        if (!useDeltaCommit) {
            const updated = await cronogramasApi.updateTrabajo(resolvedBudgetId, payload, empId);
            applyCronogramaTrabajoUpdate(updated);
            return updated;
        }
        try {
            const updated = await cronogramasApi.updateTrabajoDelta(resolvedBudgetId, payload, empId);
            applyCronogramaTrabajoDeltaUpdate(updated);
            return updated;
        } catch (error) {
            if (Number(error?.response?.status) !== 404) {
                throw error;
            }
            const updated = await cronogramasApi.updateTrabajo(resolvedBudgetId, payload, empId);
            applyCronogramaTrabajoUpdate(updated);
            return updated;
        }
    };

    const handleSaveTrabajoLine = async (row, draft, options = {}) => {
        if (!resolvedBudgetId) return null;
        setTrabajoSaving(true);
        try {
            const predecessors = Array.isArray(draft.predecessors)
                ? draft.predecessors
                : parsePredecessorInput(draft.predecessors ?? (row.predecessors || []).join(', '));
            const predecessorValidation = validateTrabajoPredecessors(
                row,
                predecessors,
                trabajoDisplayRows.length ? trabajoDisplayRows : (cronogramaTrabajo?.rows || [])
            );
            if (!predecessorValidation.valid) {
                const messages = [];
                if (predecessorValidation.invalid.length) {
                    messages.push(`No existen en este presupuesto: ${predecessorValidation.invalid.join(', ')}`);
                }
                if (predecessorValidation.futureOrSelf.length) {
                    messages.push(`No puede depender de la misma partida: ${predecessorValidation.futureOrSelf.join(', ')}`);
                }
                throw new Error(messages.join('. '));
            }
            const dependencies = buildTrabajoDependenciesPayload(row, draft, predecessorValidation.normalized);
            const metadata = Object.prototype.hasOwnProperty.call(draft, 'metadata')
                ? {
                    ...(row.metadata || {}),
                    ...(draft.metadata || {}),
                }
                : (row.metadata || {});
            const payload = {
                schedule_data: {
                    [String(row.budget_line_id)]: {
                        assumed_resource_units: draft.assumed_resource_units ?? row.recursos_asumidos,
                        progress_pct: draft.progress_pct ?? row.progress_pct ?? 0,
                        start_date: Object.prototype.hasOwnProperty.call(draft, 'start_date')
                            ? toIsoDateValue(
                                draft.start_date,
                                cronogramaTrabajo?.config?.hora_inicio_jornada ?? DEFAULT_WORKDAY_START_HOUR,
                                'start',
                                cronogramaTrabajo?.config?.jornada_laboral_horas ?? DEFAULT_WORKDAY_HOURS,
                            )
                            : (row.start_date || null),
                        end_date: Object.prototype.hasOwnProperty.call(draft, 'end_date')
                            ? toIsoDateValue(
                                draft.end_date,
                                cronogramaTrabajo?.config?.hora_inicio_jornada ?? DEFAULT_WORKDAY_START_HOUR,
                                'finish',
                                cronogramaTrabajo?.config?.jornada_laboral_horas ?? DEFAULT_WORKDAY_HOURS,
                            )
                            : (row.end_date || null),
                        duration: Object.prototype.hasOwnProperty.call(draft, 'duration')
                            ? (draft.duration == null || draft.duration === '' ? null : Number(draft.duration))
                            : undefined,
                        predecessors: predecessorValidation.normalized,
                        dependencies,
                        metadata,
                    },
                },
            };
            const projectStartViolation = validateTrabajoScheduleNotBeforeProjectStart(payload.schedule_data, {
                cronogramaTrabajo,
                detail,
                project,
                trabajoDisplayRows,
            });
            if (projectStartViolation) {
                throw new Error(projectStartViolation);
            }
            const updated = await commitTrabajoSchedulePayload(payload, options);
            if (options?.skipValoradoSync) {
                return updated;
            }
            if (cronograma?.distribution_mode === 'gantt') {
                if (options?.deferValoradoSync) {
                    scheduleDeferredValoradoSyncFromGantt(options.source || 'gantt_line_save_deferred');
                    return updated;
                }
                try {
                    await syncValoradoFromGanttSilently({ silent: true, source: 'gantt_line_save' });
                } catch (syncError) {
                    globalThis.reportClientError?.('Error sincronizando cronograma valorado tras guardar Gantt:', syncError);
                    await appAlert({
                        title: 'Gantt guardado con sincronización pendiente',
                        message: `${resolveApiErrorMessage(syncError, 'La línea se guardó correctamente en el Gantt, pero no fue posible actualizar automáticamente el Cronograma Valorado derivado.')} Puedes reintentar desde "Recalcular desde Gantt".`,
                        tone: 'warning',
                    });
                }
            }
            return updated;
        } catch (error) {
            error.__cronogramaHandled = true;
            await appAlert({
                title: 'No se pudo guardar la secuencia',
                message: resolveApiErrorMessage(error, 'No fue posible guardar la línea del Gantt.'),
                tone: 'danger',
            });
            throw error;
        } finally {
            setTrabajoSaving(false);
        }
    };

    const handleSaveTrabajoDraftBatch = async (scheduleData, options = {}) => {
        if (!resolvedBudgetId) return null;
        const normalizedScheduleData = scheduleData && typeof scheduleData === 'object' ? scheduleData : {};
        const lineCount = Object.keys(normalizedScheduleData).length;
        if (!lineCount) return cronogramaTrabajo;
        setTrabajoSaving(true);
        try {
            const projectStartViolation = validateTrabajoScheduleNotBeforeProjectStart(normalizedScheduleData, {
                cronogramaTrabajo,
                detail,
                project,
                trabajoDisplayRows,
            });
            if (projectStartViolation) {
                throw new Error(projectStartViolation);
            }
            const payload = {
                schedule_data: normalizedScheduleData,
            };
            const updated = await commitTrabajoSchedulePayload(payload, options);
            if (options?.skipValoradoSync) {
                return updated;
            }
            if (cronograma?.distribution_mode === 'gantt') {
                if (options?.deferValoradoSync) {
                    scheduleDeferredValoradoSyncFromGantt(options.source || 'gantt_batch_save_deferred');
                    return updated;
                }
                try {
                    await syncValoradoFromGanttSilently({ silent: true, source: 'gantt_drag_batch_save' });
                } catch (syncError) {
                    globalThis.reportClientError?.('Error sincronizando cronograma valorado tras persistir lote Gantt:', syncError);
                    await appAlert({
                        title: 'Gantt guardado con sincronización pendiente',
                        message: `${resolveApiErrorMessage(syncError, 'El movimiento quedó guardado correctamente en el Gantt, pero no fue posible actualizar automáticamente el Cronograma Valorado derivado.')} Puedes reintentar desde "Recalcular desde Gantt".`,
                        tone: 'warning',
                    });
                }
            }
            return updated;
        } catch (error) {
            error.__cronogramaHandled = true;
            await appAlert({
                title: 'No se pudo guardar el movimiento',
                message: resolveApiErrorMessage(error, 'No fue posible persistir los cambios del Gantt.'),
                tone: 'danger',
            });
            throw error;
        } finally {
            setTrabajoSaving(false);
        }
    };

    const handleOpenCronogramaValoradoReport = useCallback(async (variantOverride = null, filtersOverride = null) => {
        if (!resolvedBudgetId) {
            await appAlert({
                title: 'Reporte no disponible',
                message: 'Selecciona un presupuesto operativo para generar el reporte de cronograma valorado.',
                tone: 'info',
            });
            return;
        }
        try {
            setLoadingReportPreview(true);
            const previewPayload = {
                report_type: 'cronograma_valorado',
                entity_ids: [Number(resolvedBudgetId)],
                template_id: '001',
                variant: variantOverride || resolveCronogramaReportVariant(),
                empresa_id: empId,
            };
            if (filtersOverride) {
                previewPayload.filters = filtersOverride;
            }
            const response = await reportingApi.previewReport(previewPayload, empId);
            setReportPreview(response.data);
            setShowReportPreview(true);
        } catch (error) {
            globalThis.reportClientError?.('Error generando reporte de cronograma valorado:', error);
            setReportPreview(null);
            setShowReportPreview(false);
            await appAlert({
                title: 'Error de reporte',
                message: await extractBlobErrorMessage(error, 'No fue posible generar la vista previa del cronograma valorado.'),
                tone: 'danger',
            });
        } finally {
            setLoadingReportPreview(false);
        }
    }, [empId, resolveCronogramaReportVariant, resolvedBudgetId]);

    const handleSubmitResourceRangeReport = useCallback(async () => {
        const dateStart = resourceRangeDraft.date_start || resolveResourceReportDefaultRange().date_start;
        const dateEnd = resourceRangeDraft.date_end || resolveResourceReportDefaultRange().date_end;
        if (dateStart && dateEnd && parseDate(dateStart) > parseDate(dateEnd)) {
            await appAlert({
                title: 'Rango no válido',
                message: 'La fecha de inicio no puede ser posterior a la fecha final.',
                tone: 'warning',
            });
            return;
        }
        setResourceRangeModalOpen(false);
        await handleOpenCronogramaValoradoReport('resources_range', {
            date_start: dateStart,
            date_end: dateEnd,
        });
    }, [handleOpenCronogramaValoradoReport, resolveResourceReportDefaultRange, resourceRangeDraft.date_end, resourceRangeDraft.date_start]);

    const handleOpenParetoTemporalReport = useCallback(async () => {
        if (!resolvedBudgetId) {
            await appAlert({
                title: 'Reporte no disponible',
                message: 'Selecciona un presupuesto operativo para generar el reporte de Pareto temporal.',
                tone: 'info',
            });
            return;
        }
        try {
            setLoadingReportPreview(true);
            const response = await reportingApi.previewReport({
                report_type: 'cronograma_valorado',
                entity_ids: [Number(resolvedBudgetId)],
                template_id: '001',
                variant: 'pareto',
                empresa_id: empId,
            }, empId);
            setReportPreview(response.data);
            setShowReportPreview(true);
        } catch (error) {
            globalThis.reportClientError?.('Error generando reporte de Pareto temporal:', error);
            setReportPreview(null);
            setShowReportPreview(false);
            await appAlert({
                title: 'Error de reporte',
                message: await extractBlobErrorMessage(error, 'No fue posible generar la vista previa del Pareto temporal.'),
                tone: 'danger',
            });
        } finally {
            setLoadingReportPreview(false);
        }
    }, [empId, resolvedBudgetId]);

    const handleExportCronogramaValoradoReport = useCallback(async (format) => {
        if (!resolvedBudgetId) return;
        try {
            setGeneratingReport(true);
            const response = await reportingApi.exportReport({
                report_type: 'cronograma_valorado',
                entity_ids: [Number(resolvedBudgetId)],
                template_id: reportPreview?.template_id || '001',
                format,
                variant: reportPreview?.variant || resolveCronogramaReportVariant(),
                filters: reportPreview?.filters || undefined,
                empresa_id: empId,
            }, empId);
            const exportVariant = reportPreview?.variant || resolveCronogramaReportVariant();
            downloadBlobResponse(
                response,
                buildCronogramaValoradoReportFilename(format === 'xlsx' ? 'xlsx' : 'pdf', exportVariant),
                format === 'xlsx' ? undefined : 'application/pdf'
            );
        } catch (error) {
            globalThis.reportClientError?.('Error exportando cronograma valorado:', error);
            await appAlert({
                title: 'Error de reporte',
                message: await extractBlobErrorMessage(error, 'No fue posible exportar el reporte de cronograma valorado.'),
                tone: 'danger',
            });
        } finally {
            setGeneratingReport(false);
        }
    }, [buildCronogramaValoradoReportFilename, empId, reportPreview?.filters, reportPreview?.template_id, reportPreview?.variant, resolveCronogramaReportVariant, resolvedBudgetId]);

    const handleScheduleTabChange = useCallback(async (nextTab) => {
        const normalizedNextTab = String(nextTab || '').trim();
        if (!normalizedNextTab || normalizedNextTab === scheduleTab) return;

        if (scheduleTab === 'gantt' && normalizedNextTab !== 'gantt' && ganttDirtyState.hasChanges) {
            const confirmed = await appConfirm({
                title: 'Cambios de Gantt sin guardar',
                message: `Hay ${ganttDirtyState.pendingRows || 0} tarea(s) con cambios pendientes en el Gantt. Si cambias de sección ahora, esos cambios locales se perderán. ¿Desea salir igualmente?`,
                confirmLabel: 'Salir sin guardar',
                tone: 'warning',
            });
            if (!confirmed) return;
            setGanttDirtyState({
                hasChanges: false,
                pendingRows: 0,
                pendingPersistedRows: 0,
                pendingDraftRows: 0,
            });
        }

        if (scheduleTab === 'recursos' && normalizedNextTab !== 'recursos' && cronogramaRecursosStateDirty) {
            const shouldSave = await appConfirm({
                title: 'Cambios sin guardar en Recursos',
                message: '¿Deseas guardar los límites de capacidad modificados antes de salir de la sección?',
                confirmLabel: 'Guardar y salir',
                cancelLabel: 'Descartar y salir',
                tone: 'warning',
            });
            if (shouldSave) {
                await handleSaveCronogramaRecursosState();
            } else {
                handleResetCronogramaRecursosStateDraft();
            }
        }

        setScheduleTab(normalizedNextTab);
    }, [ganttDirtyState.hasChanges, ganttDirtyState.pendingRows, scheduleTab, cronogramaRecursosStateDirty, handleSaveCronogramaRecursosState, handleResetCronogramaRecursosStateDraft]);

    const handleExportTrabajoMsProject = async (format = 'xml') => {
        if (!resolvedBudgetId) return;
        try {
            setTrabajoSaving(true);
            const normalizedFormat = format === 'mpp' ? 'mpp' : 'xml';
            const response = await cronogramasApi.exportTrabajoMsProject(resolvedBudgetId, empId, normalizedFormat, false);
            const fallbackName = normalizedFormat === 'mpp'
                ? `Cronograma_Gantt_${resolvedBudgetId}.mpp`
                : `Cronograma_Gantt_${resolvedBudgetId}.xml`;
            downloadBlobResponse(
                response,
                fallbackName,
                normalizedFormat === 'mpp' ? 'application/vnd.ms-project' : 'application/xml'
            );
            await appAlert({
                title: 'Exportación lista',
                message: normalizedFormat === 'mpp'
                    ? 'Se generó y descargó el archivo .mpp del proyecto.'
                    : 'Se generó el archivo XML compatible con Microsoft Project.',
                tone: 'success',
            });
        } catch (error) {
            globalThis.reportClientError?.('Error exportando cronograma Gantt a Microsoft Project:', error);
            await appAlert({
                title: 'No se pudo exportar',
                message: await extractBlobErrorMessage(error, 'No fue posible generar el archivo de Microsoft Project.'),
                tone: 'danger',
            });
        } finally {
            setTrabajoSaving(false);
        }
    };

    const handleImportTrabajoMsProject = async (file) => {
        if (!resolvedBudgetId) return null;
        setTrabajoSaving(true);
        try {
            const updated = await cronogramasApi.importTrabajoMsProject(resolvedBudgetId, file, empId);
            setCronogramaTrabajo(updated);
            return updated;
        } finally {
            setTrabajoSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-full min-h-[480px] items-center justify-center rounded-[1.5rem] border border-zinc-200 bg-white">
                <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                    <Loader2 className="h-5 w-5 animate-spin text-sky-500" />
                    Cargando cronogramas
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-[1.5rem] border border-red-200 bg-white px-6 py-8">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Cronogramas</p>
                <h3 className="mt-2 text-xl font-black uppercase tracking-tight text-zinc-900">No se pudo cargar el módulo</h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-zinc-500">{error}</p>
            </div>
        );
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-4 overflow-hidden">
            <div className="flex flex-1 min-h-0 flex-col gap-4">
            <div className="relative z-[180] flex flex-col gap-2 rounded-[1.1rem] border border-zinc-100 bg-white px-4 py-3 shadow-[0_10px_40px_rgba(0,0,0,0.03)] lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-sky-500">
                        <CalendarRange className="w-4 h-4" /> Cronogramas
                    </h2>
                    <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                        Planificación temporal, secuencia y distribución del proyecto
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <ProjectSegmentedSwitch
                        value={scheduleTab}
                        onChange={handleScheduleTabChange}
                        options={SCHEDULE_TABS.map((tab) => ({ value: tab.id, label: tab.label.replace('Cronograma ', '') }))}
                        size="lg"
                        ariaLabel="Tipo de cronograma"
                    />
                    {scheduleTab === 'gantt' ? (
                        <div ref={ganttReportMenuRef} className="relative">
                            <ProjectSectionReportButton
                                sectionLabel="Cronograma Gantt"
                                onClick={() => {
                                    setValoradoReportMenuOpen(false);
                                    setGanttReportMenuOpen((current) => !current);
                                }}
                                disabled={!resolvedBudgetId || loadingReportPreview || generatingReport || trabajoSaving}
                                className={ganttReportMenuOpen ? PROJECT_REPORT_BUTTON_ACTIVE_CLASS : ''}
                            />
                            {ganttReportMenuOpen ? (
                                <ProjectReportMenu widthClassName="w-[16rem]">
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            setGanttReportMenuOpen(false);
                                            await handleOpenCronogramaValoradoReport('gantt');
                                        }}
                                        disabled={loadingReportPreview || generatingReport}
                                        icon={FileText}
                                    >
                                        Reporte Gantt
                                    </ProjectReportMenuItem>
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            setGanttReportMenuOpen(false);
                                            await handleOpenCronogramaValoradoReport('integrado');
                                        }}
                                        disabled={loadingReportPreview || generatingReport}
                                        icon={FileText}
                                    >
                                        Reporte integrado
                                    </ProjectReportMenuItem>
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            setGanttReportMenuOpen(false);
                                            await handleOpenCronogramaValoradoReport('resources');
                                        }}
                                        disabled={loadingReportPreview || generatingReport}
                                        icon={FileText}
                                    >
                                        Uso de Recursos
                                    </ProjectReportMenuItem>
                                    <ProjectReportMenuItem
                                        onClick={() => {
                                            setGanttReportMenuOpen(false);
                                            setClassicPrintTarget('gantt');
                                        }}
                                        disabled={!trabajoDisplayRows.length}
                                        icon={Printer}
                                        accent="blue"
                                    >
                                        Presentación Gantt
                                    </ProjectReportMenuItem>
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            setGanttReportMenuOpen(false);
                                            await handleExportTrabajoMsProject('mpp');
                                        }}
                                        disabled={!resolvedBudgetId || trabajoSaving}
                                        icon={Download}
                                    >
                                        MS Project
                                    </ProjectReportMenuItem>
                                </ProjectReportMenu>
                            ) : null}
                        </div>
                    ) : scheduleTab === 'valorado' ? (
                        <div ref={valoradoReportMenuRef} className="relative">
                            <ProjectSectionReportButton
                                sectionLabel={resolveCronogramaReportLabel()}
                                onClick={() => {
                                    setGanttReportMenuOpen(false);
                                    setValoradoReportMenuOpen((current) => !current);
                                }}
                                disabled={!resolvedBudgetId || loadingReportPreview || generatingReport}
                                className={valoradoReportMenuOpen ? PROJECT_REPORT_BUTTON_ACTIVE_CLASS : ''}
                            />
                            {valoradoReportMenuOpen ? (
                                <ProjectReportMenu widthClassName="w-[17rem]">
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            setValoradoReportMenuOpen(false);
                                            await handleOpenCronogramaValoradoReport('valorado');
                                        }}
                                        disabled={loadingReportPreview || generatingReport}
                                        icon={FileText}
                                    >
                                        Cronograma valorado
                                    </ProjectReportMenuItem>
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            setValoradoReportMenuOpen(false);
                                            await handleOpenCronogramaValoradoReport('cash_flow');
                                        }}
                                        disabled={loadingReportPreview || generatingReport}
                                        icon={FileText}
                                    >
                                        Flujo de caja
                                    </ProjectReportMenuItem>
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            setValoradoReportMenuOpen(false);
                                            await handleOpenCronogramaValoradoReport('integrado');
                                        }}
                                        disabled={loadingReportPreview || generatingReport}
                                        icon={FileText}
                                    >
                                        Reporte integrado
                                    </ProjectReportMenuItem>
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            setValoradoReportMenuOpen(false);
                                            await handleOpenCronogramaValoradoReport('resources');
                                        }}
                                        disabled={loadingReportPreview || generatingReport}
                                        icon={FileText}
                                    >
                                        Uso de Recursos
                                    </ProjectReportMenuItem>
                                    <ProjectReportMenuItem
                                        onClick={() => {
                                            setValoradoReportMenuOpen(false);
                                            setClassicPrintTarget('curve');
                                        }}
                                        disabled={!cronograma?.curve_s?.length && !cronograma?.footer?.inversion_acumulada?.length}
                                        icon={Printer}
                                        accent="blue"
                                    >
                                        Lámina Curva S
                                    </ProjectReportMenuItem>
                                </ProjectReportMenu>
                            ) : null}
                        </div>
                    ) : scheduleTab === 'recursos' ? (
                        <div ref={recursosReportMenuRef} className="relative">
                            <ProjectSectionReportButton
                                sectionLabel="Uso de Recursos"
                                title="Reportes de Recursos"
                                onClick={() => {
                                    setGanttReportMenuOpen(false);
                                    setValoradoReportMenuOpen(false);
                                    setRecursosReportMenuOpen((current) => !current);
                                }}
                                disabled={!resolvedBudgetId || loadingReportPreview || generatingReport || cronogramaRecursosLoading}
                                className={recursosReportMenuOpen ? PROJECT_REPORT_BUTTON_ACTIVE_CLASS : ''}
                            />
                            {recursosReportMenuOpen ? (
                                <ProjectReportMenu widthClassName="w-[18rem]">
                                    <ProjectReportMenuItem
                                        onClick={async () => {
                                            setRecursosReportMenuOpen(false);
                                            await handleOpenCronogramaValoradoReport('resources');
                                        }}
                                        disabled={loadingReportPreview || generatingReport}
                                        icon={FileText}
                                    >
                                        Uso de Recursos completo
                                    </ProjectReportMenuItem>
                                    <ProjectReportMenuItem
                                        onClick={() => {
                                            setRecursosReportMenuOpen(false);
                                            openResourceRangeReportModal();
                                        }}
                                        disabled={loadingReportPreview || generatingReport}
                                        icon={CalendarRange}
                                        accent="blue"
                                    >
                                        Uso de Recursos por rango
                                    </ProjectReportMenuItem>
                                </ProjectReportMenu>
                            ) : null}
                        </div>
                    ) : null}
                </div>
            </div>
            {scheduleTab === 'gantt' && (ganttDraftPendingCount > 0 || ganttDraftInvalidatedCount > 0 || ganttDraftAdjustmentRequiredCount > 0 || ganttDraftError || ganttEditLockError || ganttLockReleaseRequested) ? (
                <div className="mb-3 flex flex-wrap items-center gap-2">
                    {ganttDraftPendingCount > 0 ? (
                        <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
                            Borrador Gantt: {ganttDraftPendingCount} pendiente(s)
                        </span>
                    ) : null}
                    {ganttDraftInvalidatedCount > 0 ? (
                        <>
                            <button
                                type="button"
                                onClick={() => void handlePrepareInvalidatedGanttDraftAdjustment()}
                                disabled={trabajoSaving}
                                className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:pointer-events-none disabled:opacity-60"
                                title="Preparar reajuste desde la base vigente"
                            >
                                {ganttDraftInvalidatedCount} invalidada(s) · reajustar
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleDiscardInvalidatedGanttDraft()}
                                disabled={trabajoSaving}
                                className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:pointer-events-none disabled:opacity-60"
                                title="Descartar lineas invalidadas del borrador Gantt"
                            >
                                {ganttDraftInvalidatedCount} invalidada(s) · descartar
                            </button>
                        </>
                    ) : null}
                    {ganttDraftAdjustmentRequiredCount > 0 ? (
                        <span
                            className="inline-flex items-center rounded-full border border-sky-200 bg-white px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-700"
                            title="Reabre esas lineas en el editor light y acepta para recalcularlas desde la base vigente"
                        >
                            {ganttDraftAdjustmentRequiredCount} por reajustar · abrir editor
                        </span>
                    ) : null}
                    {ganttDraftError ? (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                            {ganttDraftError}
                        </span>
                    ) : null}
                    {ganttEditLockError ? (
                        <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-amber-700">
                            {ganttEditLockError}
                        </span>
                    ) : null}
                    {ganttLockReleaseRequested ? (
                        ganttLockOwnedByCurrentUser ? (
                            <button
                                type="button"
                                onClick={() => void handleReleaseGanttEditLock()}
                                disabled={ganttEditLockLoading}
                                className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-700 transition hover:border-sky-300 hover:bg-sky-100 disabled:pointer-events-none disabled:opacity-60"
                                title="Liberar el Gantt para otro usuario"
                            >
                                Solicitud de cierre: {ganttEditLock?.requested_release_by_name || 'otro usuario'} · liberar
                            </button>
                        ) : (
                            <span className="inline-flex items-center rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-sky-700">
                                Solicitud de cierre enviada
                            </span>
                        )
                    ) : null}
                </div>
            ) : null}
            {scheduleTab === 'gantt' ? (
                ganttBootstrapping ? (
                    <div className="flex h-full min-h-[440px] items-center justify-center rounded-[1.4rem] border border-zinc-200 bg-white">
                        <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                            <Loader2 className="h-5 w-5 animate-spin text-[#136191]" />
                            Preparando Gantt
                        </div>
                    </div>
                ) : !ganttReadyToMount ? (
                    <div className="rounded-[1.4rem] border border-zinc-200 bg-white px-8 py-10">
                        <div className="flex items-start gap-3 rounded-[1rem] border border-amber-200 bg-amber-50 px-4 py-4 text-amber-900">
                            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.18em]">Vista Gantt</p>
                                <p className="mt-2 text-sm font-medium leading-relaxed">
                                    {ganttBlockingMessage}
                                </p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <React.Suspense
                        fallback={(
                            <div className="flex h-full min-h-[440px] items-center justify-center rounded-[1.4rem] border border-zinc-200 bg-white">
                                <div className="flex items-center gap-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">
                                    <Loader2 className="h-5 w-5 animate-spin text-[#136191]" />
                                    Cargando Gantt
                                </div>
                            </div>
                        )}
                    >
                        <CronogramaGantt
                            detail={effectiveGanttDetail}
                            project={project}
                            trabajo={cronogramaTrabajo}
                            trabajoError={cronogramaTrabajoError}
                            trabajoLoading={cronogramaTrabajoLoading}
                            trabajoSaving={trabajoSaving}
                            ganttDraft={ganttDraft}
                            ganttDraftLoading={ganttDraftLoading}
                            ganttDraftError={ganttDraftError}
                            ganttEditLock={ganttEditLock}
                            ganttEditLockLoading={ganttEditLockLoading}
                            ganttEditLockError={ganttEditLockError}
                            selectedBudget={selectedBudget}
                            selectedBudgetDetail={selectedBudgetDetail}
                            valorado={cronograma}
                            displayRows={trabajoDisplayRows}
                            operationalPanelCollapsed={ganttPanelCollapsed}
                            onSaveTrabajoConfig={handleSaveTrabajoConfig}
                            onReloadTrabajoHolidayCalendar={handleReloadTrabajoHolidayCalendar}
                            onResetTrabajoHolidayCalendar={handleResetTrabajoHolidayCalendar}
                            onAddTrabajoHolidayManual={handleAddTrabajoHolidayManual}
                            onRemoveTrabajoHolidayDay={handleRemoveTrabajoHolidayDay}
                            onSaveTrabajoLine={handleSaveTrabajoLine}
                            onSaveTrabajoDraftBatch={handleSaveTrabajoDraftBatch}
                            onLoadTrabajoLineMetadata={handleLoadTrabajoLineMetadata}
                            onSaveGanttDraftIntention={handleSaveGanttDraftIntention}
                            onPreflightGanttDraftApply={handlePreflightGanttDraftApply}
                            onMarkGanttDraftApplied={handleApplyGanttDraft}
                            onAcquireGanttEditLock={handleAcquireGanttEditLock}
                            onRequestGanttLockRelease={handleRequestGanttLockRelease}
                            onHeartbeatGanttEditLock={handleHeartbeatGanttEditLock}
                            onReleaseGanttEditLock={handleReleaseGanttEditLock}
                            onReloadFromBudget={handleReloadCronogramaSources}
                            onPreviewReloadFromBudget={previewReloadCronogramaSources}
                            onSyncValoradoFromGantt={syncValoradoFromGanttSilently}
                            onApplyValoradoLineDistribution={handleApplyValoradoLineDistribution}
                            onMergeInterparentSubbars={handleMergeTrabajoInterparentSubbars}
                            onExportMsProject={handleExportTrabajoMsProject}
                            onImportMsProject={handleImportTrabajoMsProject}
                            onOpenParetoReport={handleOpenParetoTemporalReport}
                            onFactoryResetCronogramas={executeFactoryResetCronogramas}
                            onDirtyStateChange={setGanttDirtyState}
                            onPresentationSnapshotChange={setGanttPrintSnapshot}
                        />
                    </React.Suspense>
                )
            ) : scheduleTab === 'recursos' ? (
                <CronogramaRecursosReadOnly
                    recursos={cronogramaRecursos}
                    recursosState={cronogramaRecursosState}
                    recursosStateDraft={cronogramaRecursosStateDraft}
                    recursosStateDirty={cronogramaRecursosStateDirty}
                    recursosStateSaving={cronogramaRecursosStateSaving}
                    stateError={cronogramaRecursosStateError}
                    loading={cronogramaRecursosLoading}
                    error={cronogramaRecursosError}
                    currency={cronograma?.moneda || 'USD'}
                    decMoneda={cronograma?.dec_moneda ?? 2}
                    decCalculos={cronograma?.dec_calculos ?? 4}
                    onRefresh={handleRefreshCronogramaRecursos}
                    onLimitChange={handleCronogramaRecursosLimitChange}
                    onSaveState={handleSaveCronogramaRecursosState}
                    onResetStateDraft={handleResetCronogramaRecursosStateDraft}
                    onPersistLevelingProposal={handlePersistCronogramaRecursosLevelingProposal}
                    onApproveLevelingProposal={handleApproveCronogramaRecursosLevelingProposal}
                    onRequestLevelingApplication={handleRequestCronogramaRecursosLevelingApplication}
                    onCancelLevelingApplication={handleCancelCronogramaRecursosLevelingApplication}
                    onApplyLevelingApplication={handleApplyCronogramaRecursosLevelingApplication}
                    onRollbackLevelingApplication={handleRollbackCronogramaRecursosLevelingApplication}
                    onClearLevelingProposal={handleClearCronogramaRecursosLevelingProposal}
                />
            ) : (
                <div className="flex min-h-0 flex-1 flex-col gap-3">
                    {cronogramaValoradoError ? (
                        <div className="rounded-[1.1rem] border border-amber-200 bg-amber-50 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">Cronograma valorado</p>
                            <p className="mt-1 text-sm font-semibold leading-relaxed text-amber-900">{cronogramaValoradoError}</p>
                        </div>
                    ) : null}
                    <CronogramaValorado
                        detail={detail}
                        selectedBudget={selectedBudget}
                        selectedBudgetDetail={selectedBudgetDetail}
                        cronograma={cronograma}
                        configState={configState}
                        onConfigChange={handleConfigChange}
                        onApplyConfig={handleApplyConfig}
                        onRecalculateFromGantt={handleRecalculateValoradoFromGantt}
                        onClearLineOverrides={handleClearValoradoOverrides}
                        onRecalculateCashFlow={handleRecalculateCashFlow}
                        onApplyCashConstraintLineDraft={handleApplyCashConstraintLineDraft}
                        onBalanceGlobal={handleBalanceGlobal}
                        onSaveCell={handleSaveCell}
                        onResetLine={handleResetLine}
                        configSaving={configSaving || resettingCronogramas}
                        cronogramaLoading={cronogramaLoading}
                        editingCell={editingCell}
                        setEditingCell={setEditingCell}
                        onNavigateCell={handleNavigateCell}
                        displayRows={displayRows}
                        selectedRowIds={selectedRowIds}
                        setSelectedRowIds={setSelectedRowIds}
                        onCopyDistribution={handleCopyDistribution}
                        onPasteDistribution={handlePasteDistribution}
                        distributionSum={distributionSum}
                        onValueTabChange={setValoradoReportTab}
                        trabajoRows={cronogramaTrabajo?.rows || []}
                        trabajoConfig={cronogramaTrabajo?.config || null}
                    />
                </div>
            )}
            </div>
            <AppModalShell
                isOpen={resourceRangeModalOpen}
                onClose={() => setResourceRangeModalOpen(false)}
                size="md"
                zIndex="z-[410]"
            >
                <AppModalHeader
                    title="Uso de Recursos por Rango"
                    subtitle="Reporte de recursos necesarios entre dos fechas"
                    icon={CalendarRange}
                    onClose={() => setResourceRangeModalOpen(false)}
                />
                <AppModalBody className="space-y-5 bg-[#f7f7f5]">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <label className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Fecha inicio</span>
                            <AnimatedDateInput
                                type="date"
                                value={resourceRangeDraft.date_start}
                                onChange={(event) => setResourceRangeDraft((current) => ({ ...current, date_start: event.target.value }))}
                                className="w-full rounded-[0.9rem] border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold text-zinc-800 outline-none focus:border-[#F39200]"
                            />
                        </label>
                        <label className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.18em] text-zinc-500">Fecha final</span>
                            <AnimatedDateInput
                                type="date"
                                value={resourceRangeDraft.date_end}
                                onChange={(event) => setResourceRangeDraft((current) => ({ ...current, date_end: event.target.value }))}
                                className="w-full rounded-[0.9rem] border border-zinc-200 bg-white px-3 py-2.5 text-sm font-bold text-zinc-800 outline-none focus:border-[#F39200]"
                            />
                        </label>
                    </div>
                </AppModalBody>
                <AppModalFooter variant="flat" className="justify-end gap-2 bg-[#f7f7f5]">
                    <button
                        type="button"
                        onClick={() => setResourceRangeModalOpen(false)}
                        className="rounded-[0.85rem] border border-zinc-200 bg-white px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-zinc-600 transition hover:text-zinc-900"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmitResourceRangeReport}
                        disabled={loadingReportPreview || generatingReport}
                        className="rounded-[0.85rem] bg-[#136191] px-4 py-2 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-sm transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-60"
                    >
                        Generar
                    </button>
                </AppModalFooter>
            </AppModalShell>
            <CommonReportPreviewModal
                isOpen={showReportPreview}
                onClose={() => setShowReportPreview(false)}
                preview={reportPreview}
                onExportExcel={() => handleExportCronogramaValoradoReport('xlsx')}
                onExportPdf={() => handleExportCronogramaValoradoReport('pdf')}
                onExportPdfFromExcel={() => handleExportCronogramaValoradoReport('pdf_excel')}
                exporting={generatingReport}
            />
            <ReportGenerationModal
                isOpen={generatingReport}
                title="Generando reporte"
                message={`Estamos preparando el reporte de ${resolveCronogramaReportVariantLabel(reportPreview?.variant || resolveCronogramaReportVariant())}. La descarga comenzará automáticamente cuando esté listo.`}
            />
            <ClassicPrintOptionsModal
                isOpen={Boolean(classicPrintTarget)}
                onClose={() => setClassicPrintTarget(null)}
                onConfirm={handleGenerateClassicPrint}
                targetLabel={classicPrintTarget === 'gantt' ? 'Presentación Gantt' : 'Curva S'}
                defaultPageSize={classicPrintTarget === 'gantt' ? 'A1' : 'A4'}
                defaultOrientation="landscape"
                supportsPagination={classicPrintTarget === 'gantt'}
                defaultPrintMode="complete"
                defaultRowsPerPage={40}
                paginationItemLabel={classicPrintTarget === 'gantt' ? 'actividades' : 'elementos'}
                summaryItems={classicPrintTarget === 'gantt' ? summarizeGanttPrint(trabajoDisplayRows) : summarizeCurvePrint(buildCurvePrintCronograma())}
                recommendedText={classicPrintTarget === 'gantt'
                    ? 'La salida usa el snapshot gráfico emitido por el Gantt clásico: filas, barras, subbarras, escala y rutas resueltas por la propia presentación.'
                    : 'La Curva S se genera completa con todos los periodos acumulados disponibles.'}
            />
        </div>
    );
};

export default Cronogramas;
