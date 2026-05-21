import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    downloadClassicGanttPresentationPdf,
} from '../src/utils/classicPrintEngine.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const engineSource = fs.readFileSync(path.resolve(__dirname, '../src/utils/classicPrintEngine.js'), 'utf8');
const ganttSource = fs.readFileSync(path.resolve(__dirname, '../src/components/projects/CronogramaGantt.jsx'), 'utf8');

await assert.rejects(
    () => downloadClassicGanttPresentationPdf({ snapshot: null }),
    /snapshot grafico del Gantt/,
    'La descarga PDF Gantt debe exigir el snapshot grafico emitido por la aplicacion como fuente unica.',
);

assert.match(
    engineSource,
    /buildClassicGanttPresentationPdfBlob/,
    'La descarga PDF Gantt debe generar Blob PDF directo desde el snapshot grafico.',
);

assert.doesNotMatch(
    engineSource,
    /captureElementAsJpeg|foreignObject|XMLSerializer|getBoundingClientRect\(\)/,
    'La descarga PDF Gantt no debe capturar DOM ni depender de render SVG/canvas.',
);

assert.doesNotMatch(
    engineSource,
    /window\.print\(|export const downloadClassicGanttPdf|buildClassicGanttPrintHtml/,
    'No debe quedar activo un motor PDF paralelo ni el dialogo de impresion del navegador.',
);

assert.doesNotMatch(
    engineSource,
    /const color = dependency\.isCriticalPath \? '#D91E18' : '#F39200'/,
    'Las dependencias del PDF Gantt no deben volver a la semantica roja/naranja legacy.',
);

assert.doesNotMatch(
    engineSource,
    /fill:\s*'#D91E18'[\s\S]{0,120}stroke:\s*'#F39200'/,
    'Las subbarras del PDF Gantt no deben pintarse como rectangulos rojos con borde naranja.',
);

assert.doesNotMatch(
    engineSource,
    /layout\.subbars|GANTT_PDF_SUBBAR|GANTT_PDF_BAR_CRITICAL|GANTT_PDF_DEPENDENCY_COLOR_CRITICAL/,
    'El PDF Gantt no debe pintar capas auxiliares ni aplicar criticidad visual propia sobre la barra principal.',
);

assert.doesNotMatch(
    ganttSource,
    /visual:\s*\{[\s\S]{0,140}fill:\s*isCritical\s*\?\s*'#d92525'/,
    'El snapshot PDF Gantt no debe exportar subbarras con tokens criticos rojo/naranja.',
);

assert.match(
    ganttSource,
    /bar:\s*isCritical\s*\?[\s\S]{0,220}fill:\s*'#c91515'/,
    'El snapshot PDF Gantt debe conservar rojo en la barra principal de las tareas criticas.',
);

assert.match(
    ganttSource,
    /stroke:\s*isCriticalDependency\s*\?\s*DEPENDENCY_COLOR_CRITICAL\s*:\s*DEPENDENCY_COLOR_BASE/,
    'El snapshot PDF Gantt debe conservar rojo en dependencias de ruta critica.',
);

console.log('smoke-classic-gantt-print-dependencies: ok');
