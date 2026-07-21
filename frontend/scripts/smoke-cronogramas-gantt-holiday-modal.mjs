import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const componentPath = path.resolve(scriptDirectory, '../src/components/projects/CronogramaGantt.jsx');
const source = await readFile(componentPath, 'utf8');

assert.match(source, /data-testid="gantt-holiday-calendar-modal"/);
assert.match(source, /z-\[1000\]/);
assert.match(source, /h-\[min\(55rem,calc\(100dvh-4rem\)\)\]/);
assert.match(source, /max-h-\[calc\(100dvh-4rem\)\]/);
assert.match(source, /aria-labelledby="gantt-holiday-calendar-title"/);
assert.match(source, /aria-label="Cerrar calendario laboral del proyecto"/);
assert.match(source, /gantt-dark-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto/);
assert.match(source, /gantt-dark-scrollbar h-full min-h-0 space-y-3 overflow-y-auto/);

console.log('Smoke calendario laboral modal: OK');
