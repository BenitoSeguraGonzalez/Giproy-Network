import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const source = await readFile(
  new URL('../src/components/projects/CronogramaGantt.jsx', import.meta.url),
  'utf8',
);

assert.doesNotMatch(
  source,
  /from ['"]framer-motion['"]/u,
  'El Gantt no debe cargar Framer Motion para una única transición decorativa',
);
assert.match(source, /motion-reduce:animate-none/u, 'El menú debe respetar movimiento reducido');
assert.match(source, /buildVirtualRowMetrics/u, 'La virtualización vertical debe permanecer conectada');
assert.match(source, /resolveTimelineVirtualWindow/u, 'La virtualización temporal debe permanecer conectada');
assert.match(
  source,
  /lazyWithChunkRecovery\(\(\) => import\('\.\/GanttApuPlanningSignalsPanel'\)\)/u,
  'El panel de señales APU debe mantenerse fuera del chunk inicial del Gantt',
);

console.log('OK: guardas de rendimiento y movimiento de Cronograma Gantt');
