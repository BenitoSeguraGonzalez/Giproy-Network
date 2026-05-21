import { readFileSync } from 'node:fs';
import assert from 'node:assert/strict';

const read = (path) => readFileSync(path, 'utf8');

const files = {
  cronogramas: read('src/components/projects/Cronogramas.jsx'),
  gantt: read('src/components/projects/CronogramaGantt.jsx'),
  desagregacion: read('src/components/projects/DesagregacionTab.jsx'),
  formula: read('src/components/projects/FormulaPolinomicaTab.jsx'),
  motion: read('src/components/ui/MotionScrollbar.jsx'),
};

const assertContains = (source, pattern, message) => {
  assert.match(source, pattern, message);
};

assertContains(files.motion, /rail\.getBoundingClientRect\(\)/, 'MotionScrollbar debe medir la caja real del rail.');
assertContains(files.motion, /orientation\s*=\s*'vertical'/, 'MotionScrollbar debe conservar orientacion vertical por defecto.');
assertContains(files.motion, /orientation="horizontal"|orientation\s*===\s*'horizontal'/, 'MotionScrollbar debe soportar orientacion horizontal.');

assertContains(files.gantt, /targetRef=\{gridViewportRef\}[\s\S]*orientation="horizontal"/, 'Gantt debe mantener scrollbar horizontal independiente para grid izquierdo.');
assertContains(files.gantt, /targetRef=\{timelineViewportRef\}[\s\S]*orientation="horizontal"/, 'Gantt debe mantener scrollbar horizontal independiente para timeline.');
assertContains(files.gantt, /style=\{\{\s*top:\s*88,\s*bottom:\s*24\s*\}\}/, 'Gantt debe arrancar rails verticales bajo header.');
assertContains(files.gantt, /orientation="horizontal" className="bottom-0" style=\{\{\s*left:\s*24,\s*right:\s*24\s*\}\}/, 'Gantt debe balancear el respiro izquierdo y derecho de sus scrollbars horizontales.');

assertContains(files.cronogramas, /import MotionScrollbar from '..\/ui\/MotionScrollbar';/, 'Cronograma Valorado debe importar MotionScrollbar.');
assertContains(files.cronogramas, /targetRef=\{leftRef\}/, 'Cronograma Valorado debe usar MotionScrollbar en grid izquierdo.');
assertContains(files.cronogramas, /targetRef=\{rightRef\}[\s\S]*orientation="horizontal"/, 'Cronograma Valorado debe usar horizontal propio en grid derecho.');
assertContains(files.cronogramas, /giproy-motion-scrollbar-hide h-full overflow-auto/, 'Cronograma Valorado debe ocultar scrollbar nativo del grid derecho.');

assertContains(files.desagregacion, /import MotionScrollbar from '..\/ui\/MotionScrollbar';/, 'Desagregacion debe importar MotionScrollbar.');
assertContains(files.desagregacion, /targetRef=\{tableContainerRef\}/, 'Desagregacion debe usar MotionScrollbar en tabla principal.');
assertContains(files.desagregacion, /targetRef=\{apuResourcesTableRef\}/, 'Desagregacion debe usar MotionScrollbar en desglose de APU.');
assertContains(files.desagregacion, /orientation="horizontal"/, 'Desagregacion debe cubrir scroll horizontal en modo compacto.');

assertContains(files.formula, /import MotionScrollbar from '..\/ui\/MotionScrollbar';/, 'Formula Polinomica debe importar MotionScrollbar.');
assertContains(files.formula, /targetRef=\{formulaResourcesScrollRef\}[\s\S]*orientation="horizontal"/, 'Formula Polinomica debe usar horizontal propio en recursos.');
assertContains(files.formula, /targetRef=\{formulaResultsScrollRef\}[\s\S]*orientation="horizontal"/, 'Formula Polinomica debe usar horizontal propio en indices\/cuadrilla.');
assertContains(files.formula, /targetRef=\{formulaCompactScrollRef\}/, 'Formula Polinomica debe cubrir scroll vertical compacto.');
assertContains(files.formula, /relative min-h-0 flex-1 overflow-hidden pb-14 pr-7/, 'Formula Polinomica debe reservar gutter inferior amplio en sus grids principales.');
assertContains(files.formula, /orientation="horizontal" className="bottom-6" style=\{\{\s*left:\s*18,\s*right:\s*34\s*\}\}/, 'Formula Polinomica debe acotar y elevar el rail horizontal dentro de la caja util.');

console.log('smoke-project-scrollbars: ok');
