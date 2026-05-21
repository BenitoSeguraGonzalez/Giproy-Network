import assert from 'node:assert/strict';
import { buildDeferredZoomViewport, clampGanttZoom } from '../src/components/projects/cronogramasGanttZoom.js';

assert.equal(clampGanttZoom(1.237), 1.24, 'El zoom debe normalizarse a 2 decimales');
assert.equal(clampGanttZoom(0.1), 0.35, 'El zoom no debe bajar del mínimo permitido');
assert.equal(clampGanttZoom(9), 3.5, 'El zoom no debe superar el máximo permitido');

const presentation = buildDeferredZoomViewport({
    committedZoomLevel: 1,
    previewZoomLevel: 1.5,
    timelineCanvasWidthPx: 1200,
    viewportSnapshot: {
        scrollLeft: 300,
        width: 900,
    },
});

assert.equal(presentation.renderRatio, 1.5, 'El preview debe expresar correctamente la relación visual frente al zoom comprometido');
assert.equal(presentation.renderCanvasWidthPx, 1800, 'El ancho renderizado debe crecer de forma inmediata con el preview');
assert.equal(presentation.logicalViewport.scrollLeft, 200, 'El viewport lógico debe traducirse al espacio no escalado');
assert.equal(presentation.logicalViewport.width, 600, 'El ancho lógico debe traducirse al espacio no escalado');

console.log('smoke-cronogramas-gantt-zoom: ok');
