import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const previewModalPath = path.join(root, 'src', 'components', 'reporting', 'CommonReportPreviewModal.jsx');
const generationModalPath = path.join(root, 'src', 'components', 'reporting', 'ReportGenerationModal.jsx');
const ganttPath = path.join(root, 'src', 'components', 'projects', 'CronogramaGantt.jsx');

const previewSource = fs.readFileSync(previewModalPath, 'utf8');
const generationSource = fs.readFileSync(generationModalPath, 'utf8');
const ganttSource = fs.readFileSync(ganttPath, 'utf8');

const parseZIndex = (value) => {
    const match = String(value || '').match(/z-\[(\d+)\]/);
    return match ? Number(match[1]) : null;
};

const readModalZIndex = (source) => {
    const modalStart = source.indexOf('<AppModalShell');
    if (modalStart < 0) return null;
    return parseZIndex(source.slice(modalStart, modalStart + 800).match(/zIndex="([^"]+)"/)?.[1]);
};

const previewZ = readModalZIndex(previewSource);
const generationZ = readModalZIndex(generationSource);
const ganttZValues = [...ganttSource.matchAll(/z-\[(\d+)\]/g)].map((match) => Number(match[1]));
const highestGanttZ = Math.max(...ganttZValues.filter(Number.isFinite));

if (!Number.isFinite(highestGanttZ)) {
    throw new Error('smoke-report-modal-stacking: could not resolve Gantt z-index values');
}

if (!(previewZ > highestGanttZ)) {
    throw new Error(`smoke-report-modal-stacking: preview modal z-index ${previewZ} must be above Gantt ${highestGanttZ}`);
}

if (!(generationZ > highestGanttZ)) {
    throw new Error(`smoke-report-modal-stacking: generation modal z-index ${generationZ} must be above Gantt ${highestGanttZ}`);
}

console.log('smoke-report-modal-stacking: ok');
